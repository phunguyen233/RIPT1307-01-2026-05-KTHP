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

// GET /: Lấy danh sách sản phẩm (JOIN, lọc, tìm kiếm, phân trang)
const getProducts = async (req, res) => {
    try {
        let { shop_id, category_id, is_active, search, page = 1, limit = 10 } = req.query;

        // Nếu header có truyền x-api-key, lấy shop_id của shop đó
        const apiKey = req.headers['x-api-key'];
        if (apiKey && !shop_id) {
            const shopResult = await pool.query('SELECT id FROM shops WHERE api_key = $1', [apiKey]);
            if (shopResult.rows.length > 0) {
                shop_id = shopResult.rows[0].id;
            }
        }
        
        let query = `
            SELECT p.*, c.name as category_name
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE 1=1
        `;
        const queryParams = [];
        let paramIndex = 1;

        // Lọc theo shop_id
        if (shop_id) {
            query += ` AND p.shop_id = $${paramIndex++}`;
            queryParams.push(shop_id);
        }

        // Lọc theo category_id
        if (category_id) {
            query += ` AND p.category_id = $${paramIndex++}`;
            queryParams.push(category_id);
        }

        // Lọc theo trạng thái is_active
        if (is_active !== undefined) {
            query += ` AND p.is_active = $${paramIndex++}`;
            queryParams.push(is_active);
        }

        // Tìm kiếm tương đối theo tên (ILIKE không phân biệt hoa thường)
        if (search) {
            query += ` AND p.name ILIKE $${paramIndex++}`;
            queryParams.push(`%${search}%`);
        }

        // Sắp xếp
        query += ` ORDER BY p.id DESC`;

        // Phân trang
        const parsedLimit = parseInt(limit, 10);
        const parsedPage = parseInt(page, 10);
        const offset = (parsedPage - 1) * parsedLimit;

        query += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
        queryParams.push(parsedLimit, offset);

        const result = await pool.query(query, queryParams);

        // Trả về JSON bao gồm dữ liệu và thông tin phân trang
        res.status(200).json({
            data: result.rows,
            pagination: {
                page: parsedPage,
                limit: parsedLimit,
                count: result.rows.length
            }
        });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ message: 'Lỗi khi lấy danh sách sản phẩm', error: error.message });
    }
};

// POST /: Thêm sản phẩm mới.
const addProduct = async (req, res) => {
    try {
        const { product_code, name, price, cost_price, description, image_url, category_id, shop_id, is_active } = req.body;

        if (!name || !product_code) {
            return res.status(400).json({ message: 'Mã sản phẩm và tên sản phẩm là bắt buộc' });
        }

        const insertQuery = `
            INSERT INTO products (product_code, name, price, cost_price, description, image_url, category_id, shop_id, is_active)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *
        `;
        
        const isActiveVal = is_active !== undefined ? is_active : true;
        const values = [product_code, name, price, cost_price, description, image_url, category_id, shop_id, isActiveVal];

        const insertResult = await pool.query(insertQuery, values);
        res.status(201).json({ message: 'Thêm sản phẩm thành công', data: insertResult.rows[0] });
    } catch (error) {
        // Bắt lỗi Unique Constraint của Postgres (mã 23505)
        if (error.code === '23505') {
            return res.status(400).json({ message: 'Mã sản phẩm đã tồn tại!' });
        }
        console.error('Error creating product:', error);
        res.status(500).json({ message: 'Lỗi khi thêm sản phẩm', error: error.message });
    }
};

// PUT /:id: Cập nhật thông tin sản phẩm theo id.
const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { product_code, name, price, cost_price, description, image_url, category_id, shop_id, is_active } = req.body;

        if (!name || !product_code) {
            return res.status(400).json({ message: 'Mã sản phẩm và tên sản phẩm là bắt buộc' });
        }

        const updateQuery = `
            UPDATE products 
            SET product_code = $1, name = $2, price = $3, cost_price = $4, description = $5, image_url = $6, category_id = $7, shop_id = $8, is_active = $9
            WHERE id = $10 
            RETURNING *
        `;
        const values = [product_code, name, price, cost_price, description, image_url, category_id, shop_id, is_active, id];

        const result = await pool.query(updateQuery, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy ID sản phẩm để sửa' });
        }

        res.status(200).json({ message: 'Cập nhật sản phẩm thành công', data: result.rows[0] });
    } catch (error) {
        // Bắt lỗi Unique Constraint của Postgres (mã 23505)
        if (error.code === '23505') {
            return res.status(400).json({ message: 'Mã sản phẩm đã tồn tại!' });
        }
        console.error('Error updating product:', error);
        res.status(500).json({ message: 'Lỗi khi cập nhật sản phẩm', error: error.message });
    }
};

// DELETE /:id: Xóa sản phẩm theo id.
const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;

        const deleteQuery = 'DELETE FROM products WHERE id = $1';
        const result = await pool.query(deleteQuery, [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Không tìm thấy ID sản phẩm để xóa' });
        }

        res.status(200).json({ message: 'Xóa sản phẩm thành công' });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ message: 'Lỗi khi xóa sản phẩm', error: error.message });
    }
};

module.exports = {
    getProducts,
    addProduct,
    updateProduct,
    deleteProduct
};
