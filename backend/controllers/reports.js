const db = require('../config/db');

const parseQueryArray = (value) => {
  if (Array.isArray(value)) return value;
  if (value === undefined || value === null || value === '') return [];
  return [value];
};

const normalizeDate = (date, isEnd = false) => {
  if (!date) return null;
  if (date.length === 10) {
    return `${date} ${isEnd ? '23:59:59' : '00:00:00'}`;
  }
  return date;
};

const buildDateFilter = (field, startDate, endDate, startIndex = 1) => {
  const conditions = [];
  const values = [];
  if (startDate) {
    values.push(normalizeDate(startDate, false));
    conditions.push(`${field} >= $${startIndex + values.length - 1}`);
  }
  if (endDate) {
    values.push(normalizeDate(endDate, true));
    conditions.push(`${field} <= $${startIndex + values.length - 1}`);
  }
  return { clause: conditions.length ? ` AND ${conditions.join(' AND ')}` : '', values };
};

const buildInFilter = (field, options, startIndex = 1) => {
  if (!options || options.length === 0) {
    return { clause: '', values: [] };
  }
  return {
    clause: ` AND lower(${field}) = ANY($${startIndex}::text[])`,
    values: [options.map((item) => String(item).toLowerCase())],
  };
};

const getRevenueReport = async (shop_id, type, filters) => {
  const { startDate, endDate } = filters;
  const dateFilter = buildDateFilter('o.created_at', startDate, endDate, 2);
  const values = [shop_id, ...dateFilter.values];

  switch (type) {
    case 'overview': {
      const orderQuery = `
        SELECT
          COALESCE(SUM(o.total_price), 0)::numeric AS total_revenue,
          COUNT(*)::INT AS total_orders,
          COALESCE(AVG(o.total_price), 0)::numeric AS avg_order_value
        FROM orders o
        WHERE o.shop_id = $1${dateFilter.clause}`;
      const customerDateFilter = buildDateFilter('c.created_at', startDate, endDate, 2);
      const cogsDateFilter = buildDateFilter('ii.created_at', startDate, endDate, 2);
      const customerSummaryQuery = `
        SELECT
          (SELECT COALESCE(COUNT(*), 0) FROM customers c WHERE c.shop_id = $1) AS total_customers,
          (SELECT COALESCE(COUNT(*), 0) FROM customers c WHERE c.shop_id = $1${customerDateFilter.clause}) AS new_customers`;
      const cogsQuery = `
        SELECT COALESCE(SUM(ii.quantity * ii.import_price), 0)::numeric AS cogs
        FROM inventory_imports ii
        WHERE ii.shop_id = $1${cogsDateFilter.clause}`;

      const orderResult = await db.query(orderQuery, values);
      const customerResult = await db.query(customerSummaryQuery, [shop_id, ...customerDateFilter.values]);
      const cogsResult = await db.query(cogsQuery, [shop_id, ...cogsDateFilter.values]);

      return [{
        total_revenue: orderResult.rows[0].total_revenue,
        total_orders: orderResult.rows[0].total_orders,
        avg_order_value: orderResult.rows[0].avg_order_value,
        total_customers: customerResult.rows[0].total_customers,
        new_customers: customerResult.rows[0].new_customers,
        cogs: cogsResult.rows[0].cogs,
        gross_profit: (Number(orderResult.rows[0].total_revenue) - Number(cogsResult.rows[0].cogs)).toFixed(2),
      }];
    }
    case 'daily': {
      const query = `
        SELECT
          TO_CHAR(date_trunc('day', o.created_at), 'YYYY-MM-DD') AS date,
          COUNT(*)::INT AS total_orders,
          COALESCE(SUM(o.total_price), 0)::numeric AS total_revenue,
          COALESCE(AVG(o.total_price), 0)::numeric AS avg_order_value
        FROM orders o
        WHERE o.shop_id = $1${dateFilter.clause}
        GROUP BY date_trunc('day', o.created_at)
        ORDER BY date`;
      const result = await db.query(query, values);
      return result.rows;
    }
    case 'monthly': {
      const query = `
        SELECT
          TO_CHAR(date_trunc('month', o.created_at), 'YYYY-MM') AS month,
          COUNT(*)::INT AS total_orders,
          COALESCE(SUM(o.total_price), 0)::numeric AS total_revenue,
          COALESCE(AVG(o.total_price), 0)::numeric AS avg_order_value
        FROM orders o
        WHERE o.shop_id = $1${dateFilter.clause}
        GROUP BY date_trunc('month', o.created_at)
        ORDER BY month`;
      const result = await db.query(query, values);
      return result.rows.map((row) => ({
        date: row.month,
        total_orders: row.total_orders,
        total_revenue: row.total_revenue,
        avg_order_value: row.avg_order_value,
      }));
    }
    case 'profit': {
      const query = `
        SELECT
          COALESCE(SUM(oi.quantity * oi.price), 0)::numeric AS total_revenue,
          COALESCE(SUM(oi.quantity * p.cost_price), 0)::numeric AS cogs,
          COALESCE(SUM(oi.quantity * oi.price), 0) - COALESCE(SUM(oi.quantity * p.cost_price), 0) AS gross_profit
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        JOIN products p ON oi.product_id = p.id
        WHERE o.shop_id = $1${dateFilter.clause}`;
      const result = await db.query(query, values);
      return [{
        total_revenue: result.rows[0].total_revenue,
        cogs: result.rows[0].cogs,
        gross_profit: result.rows[0].gross_profit,
      }];
    }
    case 'top_products': {
      const query = `
        SELECT
          p.product_code,
          p.name AS product_name,
          c.name AS category,
          COALESCE(SUM(oi.quantity), 0)::INT AS quantity_sold,
          COALESCE(SUM(oi.quantity * oi.price), 0)::numeric AS revenue
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        JOIN products p ON oi.product_id = p.id
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE o.shop_id = $1${dateFilter.clause}
        GROUP BY p.id, c.name
        ORDER BY quantity_sold DESC
        LIMIT 50`;
      const result = await db.query(query, values);
      return result.rows;
    }
    case 'top_customers': {
      const query = `
        SELECT
          c.customer_code,
          c.name AS customer_name,
          c.phone,
          COUNT(o.id)::INT AS order_count,
          COALESCE(SUM(o.total_price), 0)::numeric AS total_spent
        FROM orders o
        JOIN customers c ON o.customer_id = c.id
        WHERE o.shop_id = $1${dateFilter.clause}
        GROUP BY c.id
        ORDER BY total_spent DESC
        LIMIT 50`;
      const result = await db.query(query, values);
      return result.rows;
    }
    case 'ingredient_cost': {
      const query = `
        SELECT
          i.name AS ingredient_name,
          COALESCE(SUM(ii.quantity), 0)::numeric AS total_quantity,
          COALESCE(SUM(ii.quantity * ii.import_price), 0)::numeric AS total_cost
        FROM inventory_imports ii
        JOIN ingredients i ON ii.ingredient_id = i.id
        WHERE ii.shop_id = $1${buildDateFilter('ii.created_at', startDate, endDate, 2).clause}
        GROUP BY i.id
        ORDER BY total_cost DESC`;
      const queryValues = [shop_id, ...buildDateFilter('ii.created_at', startDate, endDate, 2).values];
      const result = await db.query(query, queryValues);
      return result.rows;
    }
    default:
      return [];
  }
};

const getOrdersReport = async (shop_id, type, filters) => {
  const { startDate, endDate, filterStatus } = filters;
  const values = [shop_id];
  const dateFilter = buildDateFilter('o.created_at', startDate, endDate, values.length + 1);
  values.push(...dateFilter.values);
  const statusFilter = buildInFilter('o.status', parseQueryArray(filterStatus), values.length + 1);
  values.push(...statusFilter.values);

  switch (type) {
    case 'order_list': {
      const query = `
        SELECT
          o.order_code,
          COALESCE(c.name, 'Khách lẻ') AS customer,
          o.shipping_address,
          COALESCE(string_agg(p.name || ' x' || oi.quantity, ', '), '') AS order_products,
          o.total_price AS total_amount,
          o.status,
          o.created_at
        FROM orders o
        LEFT JOIN customers c ON o.customer_id = c.id
        LEFT JOIN order_items oi ON oi.order_id = o.id
        LEFT JOIN products p ON oi.product_id = p.id
        WHERE o.shop_id = $1${dateFilter.clause}${statusFilter.clause}
        GROUP BY o.id, c.name
        ORDER BY o.created_at DESC`;
      const result = await db.query(query, values);
      return result.rows;
    }
    case 'status': {
      const query = `
        SELECT
          o.status,
          COUNT(*)::INT AS order_count,
          COALESCE(SUM(o.total_price), 0)::numeric AS total_revenue
        FROM orders o
        WHERE o.shop_id = $1${dateFilter.clause}${statusFilter.clause}
        GROUP BY o.status
        ORDER BY order_count DESC`;
      const result = await db.query(query, values);
      return result.rows;
    }
    case 'customer': {
      const query = `
        SELECT
          c.customer_code,
          c.name AS customer,
          c.phone,
          COUNT(o.id)::INT AS order_count,
          COALESCE(SUM(o.total_price), 0)::numeric AS total_spent
        FROM orders o
        JOIN customers c ON o.customer_id = c.id
        WHERE o.shop_id = $1${dateFilter.clause}${statusFilter.clause}
        GROUP BY c.id
        ORDER BY total_spent DESC`;
      const result = await db.query(query, values);
      return result.rows;
    }
    case 'product': {
      const query = `
        SELECT
          p.product_code,
          p.name AS product_name,
          COALESCE(SUM(oi.quantity), 0)::INT AS quantity_sold,
          COALESCE(SUM(oi.quantity * oi.price), 0)::numeric AS revenue
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        JOIN products p ON oi.product_id = p.id
        WHERE o.shop_id = $1${dateFilter.clause}${statusFilter.clause}
        GROUP BY p.id
        ORDER BY quantity_sold DESC`;
      const result = await db.query(query, values);
      return result.rows;
    }
    case 'canceled': {
      const canceledFilter = ` AND lower(o.status) IN ('canceled', 'cancelled')`;
      const query = `
        SELECT
          o.order_code,
          COALESCE(c.name, 'Khách lẻ') AS customer,
          o.shipping_address,
          COALESCE(string_agg(p.name || ' x' || oi.quantity, ', '), '') AS order_products,
          o.total_price AS total_amount,
          o.status,
          o.created_at
        FROM orders o
        LEFT JOIN customers c ON o.customer_id = c.id
        LEFT JOIN order_items oi ON oi.order_id = o.id
        LEFT JOIN products p ON oi.product_id = p.id
        WHERE o.shop_id = $1${dateFilter.clause}${canceledFilter}
        GROUP BY o.id, c.name
        ORDER BY o.created_at DESC`;
      const result = await db.query(query, values);
      return result.rows;
    }
    default:
      return [];
  }
};

const getProductsReport = async (shop_id, type, filters) => {
  const { startDate, endDate } = filters;
  const values = [shop_id];
  const dateFilter = buildDateFilter('o.created_at', startDate, endDate, values.length + 1);
  values.push(...dateFilter.values);
  const baseQuery = `
    SELECT
      p.product_code,
      p.name AS product_name,
      c.name AS category,
      p.price AS sale_price,
      p.cost_price,
      COALESCE(SUM(oi.quantity), 0)::INT AS quantity_sold,
      COALESCE(SUM(oi.quantity * oi.price), 0)::numeric AS revenue,
      COALESCE(SUM(oi.quantity * oi.price), 0) - COALESCE(SUM(oi.quantity * p.cost_price), 0)::numeric AS profit
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN order_items oi ON oi.product_id = p.id
    LEFT JOIN orders o ON oi.order_id = o.id AND o.shop_id = p.shop_id
    WHERE p.shop_id = $1${dateFilter.clause}
    GROUP BY p.id, c.name`;

  switch (type) {
    case 'product_list': {
      const query = `${baseQuery} ORDER BY p.id`;
      const result = await db.query(query, values);
      return result.rows;
    }
    case 'stock': {
      const query = `${baseQuery} ORDER BY quantity_sold DESC`;
      const result = await db.query(query, values);
      return result.rows;
    }
    case 'best_sellers': {
      const query = `${baseQuery} ORDER BY quantity_sold DESC LIMIT 50`;
      const result = await db.query(query, values);
      return result.rows;
    }
    case 'revenue': {
      const query = `${baseQuery} ORDER BY revenue DESC LIMIT 50`;
      const result = await db.query(query, values);
      return result.rows;
    }
    case 'profit': {
      const query = `${baseQuery} ORDER BY profit DESC LIMIT 50`;
      const result = await db.query(query, values);
      return result.rows;
    }
    default:
      return [];
  }
};

const getCustomersReport = async (shop_id, type, filters) => {
  const { startDate, endDate, vipThreshold } = filters;
  const values = [shop_id];
  const dateFilter = buildDateFilter('c.created_at', startDate, endDate, values.length + 1);
  const orderDateFilter = buildDateFilter('o.created_at', startDate, endDate, values.length + 1);
  values.push(...dateFilter.values);
  const querySuffix = ` AND o.shop_id = $1${orderDateFilter.clause}`;

  switch (type) {
    case 'customer_list': {
      const query = `
        SELECT
          c.customer_code,
          c.name AS customer_name,
          c.phone,
          c.address,
          c.total_spent,
          COUNT(o.id)::INT AS order_count,
          c.created_at
        FROM customers c
        LEFT JOIN orders o ON o.customer_id = c.id AND o.shop_id = c.shop_id${orderDateFilter.clause}
        WHERE c.shop_id = $1${dateFilter.clause}
        GROUP BY c.id
        ORDER BY c.created_at DESC`;
      const result = await db.query(query, values);
      return result.rows;
    }
    case 'vip': {
      const threshold = Number(vipThreshold) || 0;
      const query = `
        SELECT
          c.customer_code,
          c.name AS customer_name,
          c.phone,
          c.address,
          c.total_spent,
          COUNT(o.id)::INT AS order_count,
          c.created_at
        FROM customers c
        LEFT JOIN orders o ON o.customer_id = c.id AND o.shop_id = c.shop_id${orderDateFilter.clause}
        WHERE c.shop_id = $1 AND c.total_spent >= $2${dateFilter.clause}
        GROUP BY c.id
        ORDER BY c.total_spent DESC`;
      const result = await db.query(query, [shop_id, threshold, ...dateFilter.values]);
      return result.rows;
    }
    case 'new_customers': {
      const query = `
        SELECT
          c.customer_code,
          c.name AS customer_name,
          c.phone,
          c.address,
          c.total_spent,
          COUNT(o.id)::INT AS order_count,
          c.created_at
        FROM customers c
        LEFT JOIN orders o ON o.customer_id = c.id AND o.shop_id = c.shop_id${orderDateFilter.clause}
        WHERE c.shop_id = $1${dateFilter.clause}
        GROUP BY c.id
        ORDER BY c.created_at DESC`;
      const result = await db.query(query, values);
      return result.rows;
    }
    case 'purchase_history': {
      const query = `
        SELECT
          c.customer_code,
          c.name AS customer_name,
          c.phone,
          c.address,
          c.total_spent,
          COUNT(o.id)::INT AS order_count,
          c.created_at
        FROM customers c
        LEFT JOIN orders o ON o.customer_id = c.id AND o.shop_id = c.shop_id${orderDateFilter.clause}
        WHERE c.shop_id = $1${dateFilter.clause}
        GROUP BY c.id
        ORDER BY order_count DESC, c.created_at DESC`;
      const result = await db.query(query, values);
      return result.rows;
    }
    default:
      return [];
  }
};

const getInventoryReport = async (shop_id, type, filters) => {
  const { startDate, endDate } = filters;
  switch (type) {
    case 'incoming': {
      const dateFilter = buildDateFilter('ii.created_at', startDate, endDate, 2);
      const query = `
        SELECT
          i.name AS ingredient_name,
          'Incoming' AS transaction_type,
          ii.quantity,
          ii.import_price AS cost_price,
          '' AS note,
          ii.created_at AS transaction_date
        FROM inventory_imports ii
        JOIN ingredients i ON ii.ingredient_id = i.id
        WHERE ii.shop_id = $1${dateFilter.clause}
        ORDER BY ii.created_at DESC`;
      const result = await db.query(query, [shop_id, ...dateFilter.values]);
      return result.rows;
    }
    case 'outgoing': {
      const dateFilter = buildDateFilter('il.created_at', startDate, endDate, 2);
      const query = `
        SELECT
          i.name AS ingredient_name,
          COALESCE(il.change_type, 'Outgoing') AS transaction_type,
          il.quantity,
          NULL::numeric AS cost_price,
          il.note,
          il.created_at AS transaction_date
        FROM inventory_logs il
        JOIN ingredients i ON il.ingredient_id = i.id
        WHERE il.shop_id = $1${dateFilter.clause}
        ORDER BY il.created_at DESC`;
      const result = await db.query(query, [shop_id, ...dateFilter.values]);
      return result.rows;
    }
    case 'in_out_stock': {
      const incomingQuery = `
        SELECT
          i.name AS ingredient_name,
          'Incoming' AS transaction_type,
          ii.quantity,
          ii.import_price AS cost_price,
          '' AS note,
          ii.created_at AS transaction_date
        FROM inventory_imports ii
        JOIN ingredients i ON ii.ingredient_id = i.id
        WHERE ii.shop_id = $1${buildDateFilter('ii.created_at', startDate, endDate, 2).clause}`;
      const outgoingQuery = `
        SELECT
          i.name AS ingredient_name,
          COALESCE(il.change_type, 'Outgoing') AS transaction_type,
          il.quantity,
          NULL::numeric AS cost_price,
          il.note,
          il.created_at AS transaction_date
        FROM inventory_logs il
        JOIN ingredients i ON il.ingredient_id = i.id
        WHERE il.shop_id = $1${buildDateFilter('il.created_at', startDate, endDate, 2).clause}`;
      const incoming = await db.query(incomingQuery, [shop_id, ...buildDateFilter('ii.created_at', startDate, endDate, 2).values]);
      const outgoing = await db.query(outgoingQuery, [shop_id, ...buildDateFilter('il.created_at', startDate, endDate, 2).values]);
      return [...incoming.rows, ...outgoing.rows].sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date));
    }
    case 'history': {
      const incomingQuery = `
        SELECT
          i.name AS ingredient_name,
          'Incoming' AS transaction_type,
          ii.quantity,
          ii.import_price AS cost_price,
          '' AS note,
          ii.created_at AS transaction_date
        FROM inventory_imports ii
        JOIN ingredients i ON ii.ingredient_id = i.id
        WHERE ii.shop_id = $1${buildDateFilter('ii.created_at', startDate, endDate, 2).clause}`;
      const outgoingQuery = `
        SELECT
          i.name AS ingredient_name,
          COALESCE(il.change_type, 'Outgoing') AS transaction_type,
          il.quantity,
          NULL::numeric AS cost_price,
          il.note,
          il.created_at AS transaction_date
        FROM inventory_logs il
        JOIN ingredients i ON il.ingredient_id = i.id
        WHERE il.shop_id = $1${buildDateFilter('il.created_at', startDate, endDate, 2).clause}`;
      const incoming = await db.query(incomingQuery, [shop_id, ...buildDateFilter('ii.created_at', startDate, endDate, 2).values]);
      const outgoing = await db.query(outgoingQuery, [shop_id, ...buildDateFilter('il.created_at', startDate, endDate, 2).values]);
      return [...incoming.rows, ...outgoing.rows].sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date));
    }
    default:
      return [];
  }
};

const getIngredientsReport = async (shop_id, type, filters) => {
  const { startDate, endDate } = filters;
  switch (type) {
    case 'ingredient_list':
    case 'stock': {
      const dateFilter = buildDateFilter('i.created_at', startDate, endDate, 2);
      const query = `
        SELECT
          i.name AS ingredient_name,
          u.symbol AS unit,
          i.stock_quantity AS stock,
          COALESCE(i.avg_price, 0)::numeric AS avg_cost,
          COALESCE(i.stock_quantity * COALESCE(i.avg_price, 0), 0)::numeric AS stock_value
        FROM ingredients i
        LEFT JOIN units u ON i.unit_id = u.id
        WHERE i.shop_id = $1${dateFilter.clause}
        ORDER BY i.name`;
      const result = await db.query(query, [shop_id, ...dateFilter.values]);
      return result.rows;
    }
    case 'low_stock': {
      const query = `
        SELECT
          i.name AS ingredient_name,
          u.symbol AS unit,
          i.stock_quantity AS stock,
          COALESCE(i.avg_price, 0)::numeric AS avg_cost,
          COALESCE(i.stock_quantity * COALESCE(i.avg_price, 0), 0)::numeric AS stock_value
        FROM ingredients i
        LEFT JOIN units u ON i.unit_id = u.id
        WHERE i.shop_id = $1 AND i.stock_quantity <= COALESCE(i.warning_threshold, 0)
        ORDER BY i.stock_quantity ASC`;
      const result = await db.query(query, [shop_id]);
      return result.rows;
    }
    case 'incoming_history': {
      const dateFilter = buildDateFilter('ii.created_at', startDate, endDate, 2);
      const query = `
        SELECT
          i.name AS ingredient_name,
          u.symbol AS unit,
          ii.quantity AS stock,
          COALESCE(i.avg_price, 0)::numeric AS avg_cost,
          COALESCE(ii.quantity * COALESCE(i.avg_price, 0), 0)::numeric AS stock_value,
          ii.created_at AS transaction_date
        FROM inventory_imports ii
        JOIN ingredients i ON ii.ingredient_id = i.id
        LEFT JOIN units u ON i.unit_id = u.id
        WHERE ii.shop_id = $1${dateFilter.clause}
        ORDER BY ii.created_at DESC`;
      const result = await db.query(query, [shop_id, ...dateFilter.values]);
      return result.rows;
    }
    case 'outgoing_history': {
      const dateFilter = buildDateFilter('il.created_at', startDate, endDate, 2);
      const query = `
        SELECT
          i.name AS ingredient_name,
          u.symbol AS unit,
          il.quantity AS stock,
          COALESCE(i.avg_price, 0)::numeric AS avg_cost,
          COALESCE(il.quantity * COALESCE(i.avg_price, 0), 0)::numeric AS stock_value,
          il.created_at AS transaction_date
        FROM inventory_logs il
        JOIN ingredients i ON il.ingredient_id = i.id
        LEFT JOIN units u ON i.unit_id = u.id
        WHERE il.shop_id = $1${dateFilter.clause}
        ORDER BY il.created_at DESC`;
      const result = await db.query(query, [shop_id, ...dateFilter.values]);
      return result.rows;
    }
    default:
      return [];
  }
};

const getRecipesReport = async (shop_id, type, filters) => {
  switch (type) {
    case 'recipe_list': {
      const query = `
        SELECT
          p.name AS product_name,
          COALESCE(string_agg(DISTINCT i.name, ', '), '') AS ingredients
        FROM recipes r
        JOIN products p ON r.product_id = p.id
        LEFT JOIN recipe_ingredients ri ON ri.recipe_id = r.id
        LEFT JOIN ingredients i ON ri.ingredient_id = i.id
        WHERE p.shop_id = $1
        GROUP BY p.name
        ORDER BY p.name`;
      const result = await db.query(query, [shop_id]);
      return result.rows;
    }
    case 'recipe_details':
    case 'ingredient_cost': {
      const query = `
        SELECT
          p.name AS product_name,
          i.name AS ingredients,
          ri.quantity,
          u.symbol AS unit,
          COALESCE(i.avg_price, 0)::numeric AS avg_cost,
          COALESCE(ri.quantity * COALESCE(i.avg_price, 0), 0)::numeric AS ingredient_cost
        FROM recipe_ingredients ri
        JOIN recipes r ON ri.recipe_id = r.id
        JOIN products p ON r.product_id = p.id
        LEFT JOIN ingredients i ON ri.ingredient_id = i.id
        LEFT JOIN units u ON ri.unit_id = u.id
        WHERE p.shop_id = $1
        ORDER BY p.name, i.name`;
      const result = await db.query(query, [shop_id]);
      return result.rows;
    }
    default:
      return [];
  }
};

exports.getReport = async (req, res, next) => {
  try {
    const shop_id = req.user.shop_id;
    const reportKey = req.params.reportKey || req.query.reportKey;
    const { type, startDate, endDate, filterStatus, category, product, vipThreshold } = req.query;
    const parsedFilterStatus = parseQueryArray(filterStatus);
    const filters = {
      startDate,
      endDate,
      filterStatus: parsedFilterStatus,
      category,
      product,
      vipThreshold,
    };

    let rows = [];
    switch (reportKey) {
      case 'revenue':
        rows = await getRevenueReport(shop_id, type, filters);
        break;
      case 'orders':
        rows = await getOrdersReport(shop_id, type, filters);
        break;
      case 'products':
        rows = await getProductsReport(shop_id, type, filters);
        break;
      case 'customers':
        rows = await getCustomersReport(shop_id, type, filters);
        break;
      case 'inventory':
        rows = await getInventoryReport(shop_id, type, filters);
        break;
      case 'ingredients':
        rows = await getIngredientsReport(shop_id, type, filters);
        break;
      case 'recipes':
        rows = await getRecipesReport(shop_id, type, filters);
        break;
      default:
        return res.status(400).json({ error: 'Unknown report type' });
    }

    res.json(rows);
  } catch (error) {
    next(error);
  }
};