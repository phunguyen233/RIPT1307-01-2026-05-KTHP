import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Popconfirm, message, Space } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import axios from 'axios';

interface Category {
  id: number;
  name: string;
}

const CategoryManagement: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [form] = Form.useForm();

  // Gọi API lấy danh sách danh mục
  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await axios.get<Category[]>('http://localhost:4000/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Lỗi khi lấy danh sách danh mục:', error);
      message.error('Không thể lấy danh sách danh mục!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Xử lý thêm mới
  const handleAddSubmit = async (values: { name: string }) => {
    try {
      await axios.post('http://localhost:4000/categories', { name: values.name });
      message.success('Thêm danh mục thành công!');
      setIsModalVisible(false);
      form.resetFields();
      fetchCategories(); // Load lại bảng
    } catch (error) {
      console.error('Lỗi khi thêm danh mục:', error);
      message.error('Thêm danh mục thất bại!');
    }
  };

  // Xử lý xóa
  const handleDelete = async (id: number) => {
    try {
      await axios.delete(`http://localhost:4000/categories/${id}`);
      message.success('Xóa danh mục thành công!');
      fetchCategories(); // Load lại bảng
    } catch (error) {
      console.error('Lỗi khi xóa danh mục:', error);
      message.error('Xóa danh mục thất bại!');
    }
  };

  // Cấu hình các cột của bảng
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: '10%',
    },
    {
      title: 'Tên danh mục',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Hành động',
      key: 'action',
      width: '20%',
      render: (_: any, record: Category) => (
        <Space size="middle">
          <Popconfirm
            title="Xóa danh mục"
            description="Bạn có chắc chắn muốn xóa danh mục này không?"
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true, style: { backgroundColor: '#ff4d4f', color: '#fff' } }}
          >
            <Button danger type="text" icon={<DeleteOutlined />}>Xóa</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px', background: '#fff', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
        <h2 style={{ margin: 0, fontWeight: 600 }}>Quản lý Danh mục</h2>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={() => setIsModalVisible(true)}
          style={{ backgroundColor: '#000', borderColor: '#000', color: '#fff', borderRadius: '4px' }}
        >
          Thêm danh mục
        </Button>
      </div>

      <Table 
        columns={columns} 
        dataSource={categories} 
        rowKey="id" 
        loading={loading}
        bordered
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={<span style={{ fontWeight: 600 }}>Thêm danh mục mới</span>}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        centered
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleAddSubmit}
          style={{ marginTop: '20px' }}
        >
          <Form.Item
            name="name"
            label="Tên danh mục"
            rules={[{ required: true, message: 'Vui lòng nhập tên danh mục!' }]}
          >
            <Input placeholder="Nhập tên danh mục..." />
          </Form.Item>
          
          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Button onClick={() => { setIsModalVisible(false); form.resetFields(); }} style={{ marginRight: '10px' }}>
              Hủy
            </Button>
            <Button type="primary" htmlType="submit" style={{ backgroundColor: '#000', borderColor: '#000', color: '#fff', borderRadius: '4px' }}>
              Thêm mới
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CategoryManagement;
