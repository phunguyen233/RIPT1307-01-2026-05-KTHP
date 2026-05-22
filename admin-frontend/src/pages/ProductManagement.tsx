import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, Form, Input, InputNumber, Select, Tag, message, Typography, Image } from 'antd'; // Bổ sung import Image
import { PlusOutlined, DeleteOutlined, EditOutlined, ReloadOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import axios from 'axios';

const { Title } = Typography;
const { Option } = Select;

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
  image_url?: string; // Bổ sung trường image_url
  category_id: number;
  shop_id?: number;
  is_active: boolean;
}

const ProductManagement: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<number | null>(null); 
  
  const [form] = Form.useForm();

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';

  const getCurrentShopId = () => {
    try {
      const userInfoString = localStorage.getItem('user'); 
      if (userInfoString) {
        const currentUser = JSON.parse(userInfoString);
        return currentUser?.shop_id || 5; 
      }
    } catch (error) {
      console.error("Lỗi đọc thông tin đăng nhập:", error);
    }
    return 5; 
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const currentShopId = getCurrentShopId(); 

      const [prodRes, cateRes] = await Promise.all([
        axios.get<{ data: Product[] }>(`${API_URL}/products?shop_id=${currentShopId}`),
        axios.get<any>(`${API_URL}/categories?shop_id=${currentShopId}`)
      ]);
      
      setProducts(prodRes.data.data || []);
      
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmitForm = async (values: Partial<Product>) => {
    try {
      const currentShopId = getCurrentShopId(); 
      const payload = { ...values, shop_id: currentShopId, is_active: true };
      
      if (editingId) {
        await axios.put(`${API_URL}/products/${editingId}`, payload);
        message.success("Cập nhật sản phẩm thành công!");
      } else {
        await axios.post(`${API_URL}/products`, payload);
        message.success("Thêm sản phẩm thành công!");
      }
      
      handleCloseModal(); 
      fetchData(); 
    } catch (error) {
      message.error("Lỗi khi lưu sản phẩm!");
    }
  };

  const handleEdit = (record: Product) => {
    setEditingId(record.id);
    form.setFieldsValue(record);
    setIsModalVisible(true);
  };

  const handleDelete = (id: number) => {
    Modal.confirm({
      title: 'Xác nhận xóa sản phẩm',
      content: 'Bạn có chắc chắn muốn xóa sản phẩm này? Hành động này không thể hoàn tác.',
      okText: 'Xóa luôn',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await axios.delete(`${API_URL}/products/${id}`);
          message.success("Đã xóa sản phẩm!");
          fetchData(); 
        } catch (error) {
          message.error("Lỗi khi xóa sản phẩm!");
        }
      }
    });
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setEditingId(null);
    form.resetFields();
  };

  // Cột của bảng (Đã chèn thêm cột Hình ảnh)
  const columns: ColumnsType<Product> = [
    {
      title: 'Mã SP',
      dataIndex: 'product_code',
      key: 'product_code',
      width: 100,
    },
    {
      title: 'Hình ảnh',
      dataIndex: 'image_url',
      key: 'image_url',
      width: 100,
      align: 'center',
      render: (url: string) => (
        url ? (
          <Image 
            width={50} 
            height={50} 
            src={url} 
            alt="Giày" 
            style={{ objectFit: 'cover', borderRadius: '4px' }} 
            fallback="https://via.placeholder.com/50?text=Lỗi+ảnh"
          />
        ) : (
          <div style={{ width: 50, height: 50, background: '#f0f0f0', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#999', margin: '0 auto' }}>
            Trống
          </div>
        )
      )
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
          <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)} />
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
        title={editingId ? "Cập nhật sản phẩm" : "Thêm sản phẩm mới"}
        open={isModalVisible}
        onCancel={handleCloseModal}
        footer={null}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" onFinish={handleSubmitForm}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Form.Item name="product_code" label="Mã sản phẩm">
              <Input placeholder="VD: SP001" disabled={!!editingId} /> 
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
              <InputNumber style={{ width: '100%' }} min={0} formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
            </Form.Item>
            <Form.Item name="cost_price" label="Giá vốn (đ)">
              <InputNumber style={{ width: '100%' }} min={0} formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
            </Form.Item>
          </div>

          {/* Ô nhập Link hình ảnh */}
          <Form.Item name="image_url" label="Link hình ảnh (URL)">
            <Input placeholder="Dán link ảnh giày vào đây (VD: https://.../nike.png)" />
          </Form.Item>

          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={3} />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={handleCloseModal}>Hủy</Button>
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