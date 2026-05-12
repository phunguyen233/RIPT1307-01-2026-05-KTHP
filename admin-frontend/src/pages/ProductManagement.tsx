import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, Form, Input, InputNumber, Select, Tag, message, Typography } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined, ReloadOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import axios from 'axios';

const { Title } = Typography;
const { Option } = Select;

// Định nghĩa kiểu dữ liệu (Interfaces) chuẩn theo Database của mày
interface Category {
  id: number;
  name: string;
  shop_id?: number;
}

interface Product {
  id: number;
  product_code: string;
  name: string;
  price: number;
  cost_price?: number;
  description?: string;
  category_id: number;
  shop_id?: number;
  is_active: boolean;
}

const ProductManagement: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [form] = Form.useForm();

  // Lấy Base URL từ file .env (Dùng cho Vite thì thay bằng import.meta.env.VITE_API_URL)
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';

  // 1. Hàm lấy dữ liệu từ Backend (Đã Fix sạch lỗi TypeScript)
  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodRes, cateRes] = await Promise.all([
        // Ép kiểu chuẩn cấu trúc { data: [...] } cho Sản phẩm
        axios.get<{ data: Product[] }>(`${API_URL}/products`),
        // Dùng any cho Category để xử lý linh hoạt
        axios.get<any>(`${API_URL}/categories`)
      ]);
      
      // Trỏ đúng lớp vỏ thứ 2 của Sản phẩm, thêm [] dự phòng
      setProducts(prodRes.data.data || []);
      
      // Xử lý an toàn cho Danh mục (nếu API trả mảng trực tiếp hoặc bọc { data: [...] })
      const cData = cateRes.data;
      setCategories(Array.isArray(cData) ? cData : (cData?.data || []));

    } catch (error) {
      console.error("Lỗi fetch data:", error);
      message.error("Không thể kết nối đến server Backend!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 2. Hàm thêm sản phẩm mới
  const handleAddProduct = async (values: Partial<Product>) => {
    try {
      // Gửi shop_id mặc định là 1 (theo logic Multi-tenant của DB)
      const payload = { ...values, shop_id: 1, is_active: true };
      await axios.post(`${API_URL}/products`, payload);
      
      message.success("Thêm sản phẩm thành công!");
      setIsModalVisible(false);
      form.resetFields();
      fetchData(); // Load lại bảng
    } catch (error) {
      message.error("Lỗi khi thêm sản phẩm!");
    }
  };

  // 3. Định nghĩa các cột của bảng theo chuẩn phong cách tối giản
  const columns: ColumnsType<Product> = [
    {
      title: 'Mã SP',
      dataIndex: 'product_code',
      key: 'product_code',
      width: 100,
    },
    {
      title: 'Tên sản phẩm',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <span style={{ fontWeight: 500 }}>{text}</span>,
    },
    {
      title: 'Danh mục',
      dataIndex: 'category_id',
      key: 'category_id',
      render: (cateId: number) => {
        const cate = categories.find(c => c.id === cateId);
        return <Tag color="default">{cate ? cate.name : 'N/A'}</Tag>;
      }
    },
    {
      title: 'Giá bán',
      dataIndex: 'price',
      key: 'price',
      align: 'right',
      render: (val: number) => <span style={{ color: '#000' }}>{val?.toLocaleString()}đ</span>,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (active: boolean) => (
        <Tag color={active ? 'processing' : 'error'} bordered={false}>
          {active ? 'Đang bán' : 'Ngừng bán'}
        </Tag>
      ),
    },
    {
      title: 'Hành động',
      key: 'action',
      align: 'center',
      render: (_, record: Product) => (
        <Space size="middle">
          <Button type="text" icon={<EditOutlined />} />
          <Button type="text" danger icon={<DeleteOutlined />} />
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px', background: '#fff', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0, fontWeight: 400 }}>Quản lý Sản phẩm</Title>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchData} />
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={() => setIsModalVisible(true)}
            style={{ background: '#000', borderColor: '#000' }}
          >
            Thêm sản phẩm
          </Button>
        </Space>
      </div>

      <Table 
        columns={columns} 
        dataSource={products} 
        rowKey="id" 
        loading={loading}
        pagination={{ pageSize: 8 }}
      />

      <Modal
        title="Thêm sản phẩm mới"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" onFinish={handleAddProduct}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Form.Item name="product_code" label="Mã sản phẩm">
              <Input placeholder="VD: SP001" />
            </Form.Item>
            <Form.Item name="category_id" label="Danh mục" rules={[{ required: true, message: 'Chọn danh mục!' }]}>
              <Select placeholder="Chọn nhóm">
                {categories.map(c => (
                  <Option key={c.id} value={c.id}>{c.name}</Option>
                ))}
              </Select>
            </Form.Item>
          </div>

          <Form.Item name="name" label="Tên sản phẩm" rules={[{ required: true, message: 'Nhập tên sản phẩm!' }]}>
            <Input />
          </Form.Item>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Form.Item name="price" label="Giá bán (đ)" rules={[{ required: true }]}>
              <InputNumber style={{ width: '100%' }} min={0} />
            </Form.Item>
            <Form.Item name="cost_price" label="Giá vốn (đ)">
              <InputNumber style={{ width: '100%' }} min={0} />
            </Form.Item>
          </div>

          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={3} />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setIsModalVisible(false)}>Hủy</Button>
              <Button type="primary" htmlType="submit" style={{ background: '#000', borderColor: '#000' }}>
                Lưu sản phẩm
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ProductManagement;