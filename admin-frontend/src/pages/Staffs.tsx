import React, { useEffect, useMemo, useState } from 'react';
import { Button, Card, Table, Modal, Form, Input, Space, message, Popconfirm, Typography } from 'antd';
import { PlusOutlined, DeleteOutlined, UserAddOutlined } from '@ant-design/icons';
import { userAPI } from '../api/userAPI';

const { Title } = Typography;

const Staffs: React.FC = () => {
  const [staffs, setStaffs] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [form] = Form.useForm();

  const currentUser = useMemo(() => {
    try {
      const raw = localStorage.getItem('user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  const shopId = currentUser?.shop_id;

  const fetchStaffs = async () => {
    try {
      setLoading(true);
      const data = await userAPI.getStaffs();
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
    if (!shopId) {
      message.error('Không xác định được cửa hàng hiện tại');
      return;
    }

    try {
      setSubmitting(true);
      await userAPI.createStaff({
        name: values.name,
        email: values.email,
        password: values.password,
        role: 'staff',
        shop_id: shopId,
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
      await userAPI.deleteUser(id);
      message.success('Đã xóa tài khoản nhân viên');
      fetchStaffs();
    } catch (error: any) {
      console.error(error);
      message.error(error?.response?.data?.error || 'Xóa tài khoản thất bại');
    } finally {
      setLoading(false);
    }
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
      title: 'Vai trò',
      dataIndex: 'role',
      key: 'role',
      render: (value: string) => value === 'staff' ? 'Nhân viên' : value,
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (value: string) => value ? new Date(value).toLocaleString('vi-VN') : '-',
    },
    {
      title: 'Hành động',
      key: 'action',
      align: 'center' as const,
      render: (_: any, record: any) => (
        <Space>
          <Popconfirm
            title="Bạn có chắc muốn xóa tài khoản này?"
            onConfirm={() => handleDeleteStaff(record.id)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button danger type="text" icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
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
