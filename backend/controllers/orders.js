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

// Helper function to get conversion path from unit A to unit B
const getConversionFactor = async (client, fromUnitId, toUnitId) => {
  if (fromUnitId === toUnitId) return 1; // Same unit, no conversion needed

  // Fetch both units with their base unit info
  const unitsResult = await client.query(
    `SELECT id, base_unit_id, conversion_factor, type
     FROM units
     WHERE id = $1 OR id = $2`,
    [fromUnitId, toUnitId]
  );

  const units = {};
  for (const unit of unitsResult.rows) {
    units[unit.id] = unit;
  }

  if (!units[fromUnitId] || !units[toUnitId]) {
    throw new Error(`Unit not found: ${fromUnitId} or ${toUnitId}`);
  }

  // Check if units have the same type
  if (units[fromUnitId].type !== units[toUnitId].type) {
    throw new Error(`Incompatible units: cannot convert ${units[fromUnitId].type} to ${units[toUnitId].type}`);
  }

  // Find base unit for fromUnit
  let fromBaseId = fromUnitId;
  const fromChain = [fromBaseId];
  while (units[fromBaseId] && units[fromBaseId].base_unit_id) {
    fromBaseId = units[fromBaseId].base_unit_id;
    fromChain.push(fromBaseId);
  }

  // Find base unit for toUnit
  let toBaseId = toUnitId;
  const toChain = [toBaseId];
  while (units[toBaseId] && units[toBaseId].base_unit_id) {
    toBaseId = units[toBaseId].base_unit_id;
    toChain.push(toBaseId);
  }

  // They must have the same base unit
  if (fromBaseId !== toBaseId) {
    throw new Error(`Cannot convert: different base units`);
  }

  // Calculate conversion factor
  // Convert from 'fromUnit' to base unit, then from base unit to 'toUnit'
  let factor = 1;
  
  // Convert from fromUnit to base (multiply by conversion_factor)
  for (let i = 0; i < fromChain.length - 1; i++) {
    const u = units[fromChain[i]];
    factor *= u.conversion_factor;
  }

  // Convert from base to toUnit (divide by conversion_factor)
  for (let i = 0; i < toChain.length - 1; i++) {
    const u = units[toChain[i]];
    factor /= u.conversion_factor;
  }

  return factor;
};

const deductIngredientsForOrder = async (client, orderId, shop_id, orderCode) => {
  // Get all order items with recipe and ingredient details
  const itemsResult = await client.query(
    `SELECT oi.id AS order_item_id,
            oi.quantity AS order_quantity,
            oi.product_id,
            ri.ingredient_id,
            ri.quantity AS recipe_quantity,
            ri.unit_id AS recipe_unit_id,
            i.name AS ingredient_name,
            i.stock_quantity,
            i.unit_id AS ingredient_unit_id
     FROM order_items oi
     JOIN products p ON oi.product_id = p.id AND p.shop_id = $2
     JOIN recipes r ON r.product_id = p.id
     JOIN recipe_ingredients ri ON ri.recipe_id = r.id
     JOIN ingredients i ON ri.ingredient_id = i.id AND i.shop_id = $2
     WHERE oi.order_id = $1`,
    [orderId, shop_id]
  );

  // Group by ingredient to get total needed
  const ingredientMap = {};
  for (const row of itemsResult.rows) {
    const ingredientId = row.ingredient_id;
    if (!ingredientMap[ingredientId]) {
      ingredientMap[ingredientId] = {
        ingredient_id: ingredientId,
        ingredient_name: row.ingredient_name,
        stock_quantity: Number(row.stock_quantity),
        ingredient_unit_id: row.ingredient_unit_id,
        items: [],
      };
    }
    ingredientMap[ingredientId].items.push(row);
  }

  // Calculate needed quantity for each ingredient with unit conversion
  const insufficient = [];
  const deductions = []; // Array to store deductions to apply

  for (const ingredientId in ingredientMap) {
    const ing = ingredientMap[ingredientId];
    let totalNeeded = 0;

    // Calculate total needed quantity (converting recipe unit to ingredient unit)
    for (const item of ing.items) {
      try {
        const factor = await getConversionFactor(
          client,
          item.recipe_unit_id,
          item.ingredient_unit_id
        );
        const neededForThisItem = item.order_quantity * item.recipe_quantity * factor;
        totalNeeded += neededForThisItem;
      } catch (error) {
        console.error(`Unit conversion error for ingredient ${ingredientId}:`, error.message);
        // If conversion fails, try direct comparison (assume same unit or error)
        totalNeeded += item.order_quantity * item.recipe_quantity;
      }
    }

    // Check if sufficient
    if (ing.stock_quantity < totalNeeded) {
      insufficient.push({
        ingredient_id: ingredientId,
        ingredient_name: ing.ingredient_name,
        needed_quantity: totalNeeded,
        stock_quantity: ing.stock_quantity,
      });
    } else {
      deductions.push({
        ingredient_id: ingredientId,
        ingredient_name: ing.ingredient_name,
        quantity_to_deduct: totalNeeded,
      });
    }
  }

  if (insufficient.length > 0) {
    return { insufficient };
  }

  // Apply deductions
  for (const deduction of deductions) {
    const quantityToDeduct = deduction.quantity_to_deduct;
    if (quantityToDeduct <= 0) continue;

    await client.query(
      'UPDATE ingredients SET stock_quantity = stock_quantity - $1 WHERE id = $2 AND shop_id = $3',
      [quantityToDeduct, deduction.ingredient_id, shop_id]
    );

    await client.query(
      `INSERT INTO inventory_logs (ingredient_id, change_type, quantity, note, shop_id)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        deduction.ingredient_id,
        'export',
        quantityToDeduct,
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
