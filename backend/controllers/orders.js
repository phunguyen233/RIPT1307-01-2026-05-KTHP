const db = require('../config/db');

exports.getAllOrders = async (req, res, next) => {
  try {
    const shop_id = req.user.shop_id;

    const query = `SELECT o.*, c.name AS customer_name, c.phone AS customer_phone
                   FROM orders o
                   LEFT JOIN customers c ON o.customer_id = c.id
                   WHERE o.shop_id = $1
                   ORDER BY o.id`;

    const result = await db.query(query, [shop_id]);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

exports.getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const shop_id = req.user.shop_id;

    const orderResult = await db.query(
      `SELECT o.*, c.name AS customer_name, c.phone AS customer_phone
       FROM orders o
       LEFT JOIN customers c ON o.customer_id = c.id
       WHERE o.id = $1 AND o.shop_id = $2`,
      [id, shop_id]
    );
    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    const itemsResult = await db.query(
      `SELECT oi.*, p.name AS product_name, p.image_url AS product_image
       FROM order_items oi
       LEFT JOIN products p ON oi.product_id = p.id AND p.shop_id = $2
       WHERE oi.order_id = $1`,
      [id, shop_id]
    );
    res.json({ ...orderResult.rows[0], order_items: itemsResult.rows });
  } catch (error) {
    next(error);
  }
};

exports.createOrder = async (req, res, next) => {
  const client = await db.pool.connect();
  try {
    const { customer_id, shipping_address, total_price, status, order_items, items } = req.body;
    const shop_id = req.user.shop_id;

    // Validate required fields
    if (!shipping_address) {
      return res.status(400).json({ error: 'Địa chỉ giao hàng là bắt buộc' });
    }
    if (!total_price || total_price < 0) {
      return res.status(400).json({ error: 'Tổng tiền không hợp lệ' });
    }

    // Generate order_code
    const codeQuery = `SELECT COALESCE(MAX(CAST(SUBSTRING(order_code FROM 3) AS INTEGER)), 0) + 1 AS next_number
                       FROM orders WHERE shop_id = $1 AND order_code LIKE 'DH%'`;
    const codeResult = await client.query(codeQuery, [shop_id]);
    const nextNumber = codeResult.rows[0].next_number;
    const order_code = 'DH' + nextNumber.toString();

    // Use transaction to create order and order items
    await client.query('BEGIN');

    // Handle customer_id - use null if not provided or invalid
    const validCustomerId = customer_id && !isNaN(customer_id) ? customer_id : null;

    const orderResult = await client.query(
      'INSERT INTO orders (customer_id, shipping_address, total_price, status, shop_id, order_code) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [validCustomerId, shipping_address, total_price || 0, status || 'pending', shop_id, order_code]
    );
    const newOrder = orderResult.rows[0];

    // Insert order items (support both 'order_items' and 'items' field names)
    const orderItemsToInsert = order_items || items || [];
    const insertedItems = [];
    if (orderItemsToInsert.length > 0) {
      for (const item of orderItemsToInsert) {
        const itemResult = await client.query(
          'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4) RETURNING *',
          [newOrder.id, item.product_id || item.ma_san_pham, item.quantity || item.so_luong, item.price || item.don_gia]
        );
        insertedItems.push(itemResult.rows[0]);
      }
    }

    await client.query('COMMIT');
    res.status(201).json({ ...newOrder, order_items: insertedItems });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create order error:', error);
    next(error);
  } finally {
    client.release();
  }
};

exports.updateOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { customer_id, shipping_address, total_price, status, order_code } = req.body;
    const shop_id = req.user.shop_id;

    const query = 'UPDATE orders SET customer_id = $1, shipping_address = $2, total_price = $3, status = $4, order_code = $5 WHERE id = $6 AND shop_id = $7 RETURNING *';
    const result = await db.query(query, [customer_id, shipping_address, total_price, status, order_code, id, shop_id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

exports.deleteOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const shop_id = req.user.shop_id;

    const query = 'DELETE FROM orders WHERE id = $1 AND shop_id = $2 RETURNING id';
    const result = await db.query(query, [id, shop_id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    next(error);
  }
};

const deductIngredientsForOrder = async (client, orderId, shop_id, orderCode) => {
  const consumptionResult = await client.query(
    `SELECT ri.ingredient_id,
            i.name AS ingredient_name,
            SUM(oi.quantity * ri.quantity) AS needed_quantity,
            i.stock_quantity
     FROM order_items oi
     JOIN products p ON oi.product_id = p.id
     JOIN recipes r ON r.product_id = p.id
     JOIN recipe_ingredients ri ON ri.recipe_id = r.id
     JOIN ingredients i ON ri.ingredient_id = i.id AND i.shop_id = $2
     WHERE oi.order_id = $1 AND p.shop_id = $2
     GROUP BY ri.ingredient_id, i.name, i.stock_quantity`,
    [orderId, shop_id]
  );

  const insufficient = consumptionResult.rows.filter(
    (row) => Number(row.stock_quantity) < Number(row.needed_quantity)
  );

  if (insufficient.length > 0) {
    return {
      insufficient: insufficient.map((row) => ({
        ingredient_id: row.ingredient_id,
        ingredient_name: row.ingredient_name,
        needed_quantity: Number(row.needed_quantity),
        stock_quantity: Number(row.stock_quantity),
      })),
    };
  }

  for (const row of consumptionResult.rows) {
    const neededQuantity = Number(row.needed_quantity);
    if (neededQuantity <= 0) continue;

    await client.query(
      'UPDATE ingredients SET stock_quantity = stock_quantity - $1 WHERE id = $2 AND shop_id = $3',
      [neededQuantity, row.ingredient_id, shop_id]
    );

    await client.query(
      `INSERT INTO inventory_logs (ingredient_id, change_type, quantity, note, shop_id)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        row.ingredient_id,
        'export',
        neededQuantity,
        `Trừ kho do hoàn thành đơn hàng ${orderCode}`,
        shop_id,
      ]
    );
  }

  return { insufficient: [] };
};

exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { trang_thai } = req.body;
    const shop_id = req.user.shop_id;

    // Verify order belongs to this shop
    const orderCheck = await db.query('SELECT status, order_code FROM orders WHERE id = $1 AND shop_id = $2', [id, shop_id]);
    if (orderCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const currentStatus = orderCheck.rows[0].status;
    const orderCode = orderCheck.rows[0].order_code || id;

    // Validate status transition
    const allowedTransitions = {
      pending: ['completed', 'cancelled'],
      completed: [],
      cancelled: []
    };

    if (currentStatus === 'cancelled' || currentStatus === 'completed') {
      return res.status(400).json({ message: 'Đơn hàng ở trạng thái này không được chỉnh trạng thái.' });
    }

    const allowed = allowedTransitions[currentStatus] || [];
    if (!allowed.includes(trang_thai)) {
      return res.status(400).json({ message: `Không được phép chuyển trạng thái từ "${currentStatus}" sang "${trang_thai}"` });
    }

    if (trang_thai === 'completed') {
      const client = await db.pool.connect();
      try {
        await client.query('BEGIN');

        const { insufficient } = await deductIngredientsForOrder(client, id, shop_id, orderCode);
        if (insufficient.length > 0) {
          await client.query('ROLLBACK');
          return res.status(400).json({
            message: 'Kho không đủ nguyên liệu để hoàn thành đơn hàng',
            insufficient,
          });
        }

        const result = await client.query(
          'UPDATE orders SET status = $1 WHERE id = $2 AND shop_id = $3 RETURNING *',
          [trang_thai, id, shop_id]
        );

        await client.query('COMMIT');
        return res.json({ message: 'Cập nhật trạng thái thành công', order: result.rows[0] });
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    }

    const result = await db.query(
      'UPDATE orders SET status = $1 WHERE id = $2 AND shop_id = $3 RETURNING *',
      [trang_thai, id, shop_id]
    );

    res.json({ message: 'Cập nhật trạng thái thành công', order: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

exports.processOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const shop_id = req.user.shop_id;

    const orderCheck = await db.query('SELECT status, order_code FROM orders WHERE id = $1 AND shop_id = $2', [id, shop_id]);
    if (orderCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const currentStatus = orderCheck.rows[0].status;
    const orderCode = orderCheck.rows[0].order_code || id;
    if (currentStatus === 'cancelled' || currentStatus === 'completed') {
      return res.status(400).json({ message: 'Đơn hàng ở trạng thái này không được xử lý thêm.' });
    }

    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      const { insufficient } = await deductIngredientsForOrder(client, id, shop_id, orderCode);
      if (insufficient.length > 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          message: 'Kho không đủ nguyên liệu để hoàn thành đơn hàng',
          insufficient,
        });
      }

      const result = await client.query(
        'UPDATE orders SET status = $1 WHERE id = $2 AND shop_id = $3 RETURNING *',
        ['completed', id, shop_id]
      );

      await client.query('COMMIT');
      res.json({ message: 'Order processed and inventory updated', order: result.rows[0] });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    next(error);
  }
};
