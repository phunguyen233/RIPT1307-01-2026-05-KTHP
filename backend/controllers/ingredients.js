const db = require('../config/db');

exports.getAllIngredients = async (req, res, next) => {
  try {
    const shop_id = req.user.shop_id;

    const query = `SELECT i.*, u.name AS unit_name, u.symbol AS unit_symbol,
                   COALESCE(
                     NULLIF(i.avg_price, 0),
                     (SELECT SUM(ii.quantity * ii.import_price) / NULLIF(SUM(ii.quantity), 0)
                      FROM inventory_imports ii
                      WHERE ii.ingredient_id = i.id AND ii.shop_id = i.shop_id), 0
                   ) AS avg_price
                   FROM ingredients i
                   LEFT JOIN units u ON i.unit_id = u.id
                   WHERE i.shop_id = $1
                   ORDER BY i.id`;

    const result = await db.query(query, [shop_id]);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

exports.getIngredientById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const shop_id = req.user.shop_id;

    const query = `SELECT i.*, u.name AS unit_name, u.symbol AS unit_symbol
                   FROM ingredients i
                   LEFT JOIN units u ON i.unit_id = u.id
                   WHERE i.id = $1 AND i.shop_id = $2`;

    const result = await db.query(query, [id, shop_id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ingredient not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

exports.createIngredient = async (req, res, next) => {
  try {
    const { name, unit_id, stock_quantity, avg_price, warning_threshold, note } = req.body;
    const shop_id = req.user.shop_id;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const result = await db.query(
      'INSERT INTO ingredients (name, unit_id, stock_quantity, shop_id, avg_price, warning_threshold, note) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [name, unit_id, stock_quantity || 0, shop_id, avg_price || 0, warning_threshold || 0, note || '']
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

exports.updateIngredient = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, unit_id, stock_quantity, avg_price, warning_threshold, note } = req.body;
    const shop_id = req.user.shop_id;

    const query = 'UPDATE ingredients SET name = $1, unit_id = $2, stock_quantity = $3, avg_price = $4, warning_threshold = $5, note = $6 WHERE id = $7 AND shop_id = $8 RETURNING *';
    const result = await db.query(query, [name, unit_id, stock_quantity || 0, avg_price || 0, warning_threshold || 0, note || '', id, shop_id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ingredient not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

exports.deleteIngredient = async (req, res, next) => {
  try {
    const { id } = req.params;
    const shop_id = req.user.shop_id;

    const query = 'DELETE FROM ingredients WHERE id = $1 AND shop_id = $2 RETURNING id';
    const result = await db.query(query, [id, shop_id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ingredient not found' });
    }
    res.json({ message: 'Ingredient deleted successfully' });
  } catch (error) {
    next(error);
  }
};
