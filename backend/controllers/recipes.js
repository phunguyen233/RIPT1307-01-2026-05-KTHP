const db = require('../config/db');

exports.getAllRecipes = async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT r.*, p.name AS product_name
       FROM recipes r
       LEFT JOIN products p ON r.product_id = p.id
       ORDER BY r.id DESC`
    );
    res.status(200).json(result.rows);
  } catch (error) {
    next(error);
  }
};

exports.getRecipeById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      `SELECT r.*, p.name AS product_name
       FROM recipes r
       LEFT JOIN products p ON r.product_id = p.id
       WHERE r.id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Recipe not found' });
    }
    res.status(200).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

exports.createRecipe = async (req, res, next) => {
  try {
    const { product_id } = req.body;
    if (!product_id) {
      return res.status(400).json({ error: 'product_id is required' });
    }
    const result = await db.query(
      'INSERT INTO recipes (product_id) VALUES ($1) RETURNING *',
      [product_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

exports.updateRecipe = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { product_id } = req.body;
    if (!product_id) {
      return res.status(400).json({ error: 'product_id is required' });
    }
    const result = await db.query(
      'UPDATE recipes SET product_id = $1 WHERE id = $2 RETURNING *',
      [product_id, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Recipe not found' });
    }
    res.status(200).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

exports.deleteRecipe = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await db.query('DELETE FROM recipes WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Recipe not found' });
    }
    res.status(200).json({ message: 'Recipe deleted successfully' });
  } catch (error) {
    next(error);
  }
};
