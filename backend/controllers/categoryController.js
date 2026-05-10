const { Pool } = require('pg');

// Khởi tạo Pool từ thư viện pg với SSL cho Supabase
const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_DATABASE,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: {
        rejectUnauthorized: false
    }
});

// GET /: Lấy danh sách toàn bộ danh mục, có thể lọc theo shop_id
const getCategories = async (req, res) => {
    try {
        const { shop_id } = req.query;
        let query = 'SELECT * FROM categories';
        const queryParams = [];

        if (shop_id) {
            query += ' WHERE shop_id = $1';
            queryParams.push(shop_id);
        }

        query += ' ORDER BY id ASC';

        const result = await pool.query(query, queryParams);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ message: 'Lỗi khi lấy danh sách danh mục', error: error.message });
    }
};

// POST /: Thêm danh mục mới.
const addCategory = async (req, res) => {
    try {
        const { name, shop_id } = req.body;

        if (!name) {
            return res.status(400).json({ message: 'Tên danh mục là bắt buộc' });
        }

        // Chạy query INSERT bằng tham số an toàn (ID tự động tăng nhờ SERIAL)
        const insertQuery = 'INSERT INTO categories (name, shop_id) VALUES ($1, $2) RETURNING *';
        const insertResult = await pool.query(insertQuery, [name, shop_id || null]);

        res.status(201).json({ message: 'Thêm danh mục thành công', data: insertResult.rows[0] });
    } catch (error) {
        console.error('Error creating category:', error);
        res.status(500).json({ message: 'Lỗi khi thêm danh mục', error: error.message });
    }
};

// PUT /:id: Cập nhật name của danh mục theo id.
const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({ message: 'Tên danh mục là bắt buộc' });
        }

        const updateQuery = 'UPDATE categories SET name = $1 WHERE id = $2 RETURNING *';
        const result = await pool.query(updateQuery, [name, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy ID danh mục để sửa' });
        }

        res.status(200).json({ message: 'Cập nhật danh mục thành công', data: result.rows[0] });
    } catch (error) {
        console.error('Error updating category:', error);
        res.status(500).json({ message: 'Lỗi khi cập nhật danh mục', error: error.message });
    }
};

// DELETE /:id: Xóa danh mục theo id.
const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;

        const deleteQuery = 'DELETE FROM categories WHERE id = $1';
        const result = await pool.query(deleteQuery, [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Không tìm thấy ID danh mục để xóa' });
        }

        res.status(200).json({ message: 'Xóa danh mục thành công' });
    } catch (error) {
        console.error('Error deleting category:', error);
        res.status(500).json({ message: 'Lỗi khi xóa danh mục', error: error.message });
    }
};

module.exports = {
    getCategories,
    addCategory,
    updateCategory,
    deleteCategory
};
