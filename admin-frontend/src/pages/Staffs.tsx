import React, { useEffect, useMemo, useState } from 'react';
import { Button, Card, Table, Modal, Form, Input, Space, message, Popconfirm, Typography } from 'antd';
import { PlusOutlined, DeleteOutlined, UserAddOutlined } from '@ant-design/icons';
import { staffAPI } from '../api/staffAPI';

const { Title } = Typography;

const Staffs: React.FC = () => {
  const [staffs, setStaffs] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [form] = Form.useForm();
  const [showPasswords, setShowPasswords] = useState<Set<number>>(new Set());

  const currentUser = useMemo(() => {
    try {
      const raw = localStorage.getItem('user');
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      console.error('Staffs currentUser parse error', error);
      return null;
    }
  }, []);

  const fetchStaffs = async () => {
    try {
      setLoading(true);
      const data = await staffAPI.getStaffs();
      setStaffs(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      message.error('Không tải được danh sách nhân viên');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffs();
  }, []);

  const handleCreateStaff = async (values: any) => {
    try {
      setSubmitting(true);
      await staffAPI.createStaff({
        name: values.name,
        email: values.email,
        password: values.password,
        role: 'staff',
      });
      message.success('Đã tạo tài khoản nhân viên');
      setModalVisible(false);
      form.resetFields();
      fetchStaffs();
    } catch (error: any) {
      console.error(error);
      message.error(error?.response?.data?.error || 'Tạo nhân viên thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteStaff = async (id: number) => {
    try {
      setLoading(true);
      await staffAPI.deleteStaff(id);
      message.success('Đã xóa tài khoản nhân viên');
      fetchStaffs();
    } catch (error: any) {
      console.error(error);
      message.error(error?.response?.data?.error || 'Xóa tài khoản thất bại');
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = (id: number) => {
    const newSet = new Set(showPasswords);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setShowPasswords(newSet);
  };


  const columns = [
    {
      title: 'Họ và tên',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Mật khẩu',
      dataIndex: 'password',
      key: 'password',
      render: (value: string, record: any) => (
        <Space size="small">
          <span>{showPasswords.has(record.id) ? value : '••••••••'}</span>
          <Button
            type="text"
            size="small"
            onClick={() => togglePasswordVisibility(record.id)}
          >
            {showPasswords.has(record.id) ? 'Ẩn' : 'Xem'}
          </Button>
        </Space>
      ),
    },
    {
      title: 'Hành động',
      key: 'action',
      align: 'center' as const,
      render: (_: any, record: any) => (
        <Popconfirm
          title="Bạn có chắc muốn xóa tài khoản này?"
          onConfirm={() => handleDeleteStaff(record.id)}
          okText="Xóa"
          cancelText="Hủy"
        >
          <Button danger type="text" icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ];

  return (
    <div style={{ padding: '0 24px 24px 24px', minHeight: '100vh' }}>
      <Card
        title={<Title level={4} style={{ margin: 0 }}>Quản lý nhân viên</Title>}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
            Tạo tài khoản nhân viên
          </Button>
        }
      >
        <Table
          dataSource={staffs.map((item) => ({ ...item, key: item.id }))}
          columns={columns}
          loading={loading}
          locale={{ emptyText: 'Chưa có nhân viên nào' }}
          pagination={{ pageSize: 8 }}
        />
      </Card>

      <Modal
        title="Tạo tài khoản nhân viên"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        <Form layout="vertical" form={form} onFinish={handleCreateStaff}>
          <Form.Item
            label="Họ và tên"
            name="name"
            rules={[{ required: true, message: 'Vui lòng nhập họ và tên' }]}
          >
            <Input placeholder="Nhập họ tên nhân viên" />
          </Form.Item>
          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: 'Vui lòng nhập email' },
              { type: 'email', message: 'Email không hợp lệ' },
            ]}
          >
            <Input placeholder="Nhập email nhân viên" />
          </Form.Item>
          <Form.Item
            label="Mật khẩu"
            name="password"
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }, { min: 6, message: 'Mật khẩu phải ít nhất 6 ký tự' }]}
          >
            <Input.Password placeholder="Nhập mật khẩu" />
          </Form.Item>
          <Form.Item>
            <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button onClick={() => setModalVisible(false)}>Hủy</Button>
              <Button type="primary" htmlType="submit" loading={submitting} icon={<UserAddOutlined />}>
                Tạo nhân viên
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Staffs;
