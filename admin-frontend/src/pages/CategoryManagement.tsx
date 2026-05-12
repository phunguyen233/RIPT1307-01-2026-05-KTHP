import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, Form, Input, message, Typography } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined, ReloadOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import axios from 'axios';

const { Title } = Typography;

// Định nghĩa kiểu dữ liệu cho Danh mục
interface Category {
  id: number;
  name: string;
  description?: string;
  shop_id?: number;
}

const CategoryManagement: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form] = Form.useForm();

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';

  // ============ HÀM LẤY SHOP_ID TỪ LOCALSTORAGE ============
  const getCurrentShopId = () => {
    try {
      const userInfoString = localStorage.getItem('user');
      if (userInfoString) {
        const currentUser = JSON.parse(userInfoString);
        return currentUser?.shop_id || 5; // Mặc định shop 5 của Minh
      }
    } catch (error) {
      console.error("Lỗi đọc thông tin đăng nhập:", error);
    }
    return 5;
  };

  // 1. Hàm lấy danh sách danh mục (Lọc theo shop)
  const fetchData = async () => {
    setLoading(true);
    try {
      const currentShopId = getCurrentShopId();
      const res = await axios.get<any>(`${API_URL}/categories?shop_id=${currentShopId}`);
      
      // Xử lý linh hoạt nếu Backend trả về mảng trực tiếp hoặc bọc trong { data: [] }
      const data = res.data;
      setCategories(Array.isArray(data) ? data : (data?.data || []));
    } catch (error) {
      console.error("Lỗi fetch categories:", error);
      message.error("Không thể kết nối đến máy chủ!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2. Hàm xử lý Lưu (Thêm mới hoặc Cập nhật)
  const handleSubmit = async (values: Partial<Category>) => {
    try {
      const currentShopId = getCurrentShopId();
      const payload = { ...values, shop_id: currentShopId };

      if (editingId) {
        await axios.put(`${API_URL}/categories/${editingId}`, payload);
        message.success("Cập nhật danh mục thành công!");
      } else {
        await axios.post(`${API_URL}/categories`, payload);
        message.success("Thêm danh mục thành công!");
      }

      handleCloseModal();
      fetchData();
    } catch (error) {
      message.error("Lỗi khi lưu dữ liệu!");
    }
  };

  // 3. Hàm Xóa danh mục
  const handleDelete = (id: number) => {
    Modal.confirm({
      title: 'Xác nhận xóa',
      content: 'Bạn có chắc muốn xóa danh mục này? Các sản phẩm thuộc danh mục này có thể bị ảnh hưởng.',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await axios.delete(`${API_URL}/categories/${id}`);
          message.success("Đã xóa danh mục!");
          fetchData();
        } catch (error) {
          message.error("Lỗi khi xóa!");
        }
      }
    });
  };

  const handleEdit = (record: Category) => {
    setEditingId(record.id);
    form.setFieldsValue(record);
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setEditingId(null);
    form.resetFields();
  };

  // Cấu hình các cột của bảng
  const columns: ColumnsType<Category> = [
  {
      title: 'STT',
      key: 'stt',
      width: 80,
      align: 'center',
      render: (text: any, record: Category) => categories.indexOf(record) + 1,
    },
    {
      title: 'Tên danh mục',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <span style={{ fontWeight: 500 }}>{text}</span>,
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
      render: (text: string) => text || '-',
    },
    {
      title: 'Hành động',
      key: 'action',
      align: 'center',
      width: 150,
      render: (_, record: Category) => (
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
        <Title level={3} style={{ margin: 0, fontWeight: 400 }}>Quản lý Danh mục</Title>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchData} />
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={() => setIsModalVisible(true)}
            style={{ background: '#000', borderColor: '#000' }}
          >
            Thêm danh mục
          </Button>
        </Space>
      </div>

      <Table 
        columns={columns} 
        dataSource={categories} 
        rowKey="id" 
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={editingId ? "Sửa danh mục" : "Thêm danh mục mới"}
        open={isModalVisible}
        onCancel={handleCloseModal}
        footer={null}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item 
            name="name" 
            label="Tên danh mục" 
            rules={[{ required: true, message: 'Vui lòng nhập tên danh mục!' }]}
          >
            <Input placeholder="VD: Giày thể thao, Nước ép..." />
          </Form.Item>

          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={4} placeholder="Nhập mô tả ngắn về danh mục này" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={handleCloseModal}>Hủy</Button>
              <Button type="primary" htmlType="submit" style={{ background: '#000', borderColor: '#000' }}>
                Lưu danh mục
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CategoryManagement;