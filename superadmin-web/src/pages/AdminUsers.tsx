import React, { useEffect, useState } from 'react';
import { Card, Table, Typography, Tag, Button } from 'antd';
import { UserAddOutlined } from '@ant-design/icons';
import { getAdminUsers, AdminUserStats } from '../api/adminAPI';

const { Title, Text } = Typography;

const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<AdminUserStats[]>([]);

  useEffect(() => {
    const load = async () => {
      const data = await getAdminUsers();
      setUsers(data);
    };
    load().catch(console.error);
  }, []);

  const columns = [
    {
      title: 'Tên tài khoản',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Quyền hạn (Role)',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => {
        let color = role === 'superadmin' ? 'volcano' : 'green';
        let label = role === 'superadmin' ? 'Superadmin' : 'Admin Shop';
        return <Tag color={color}>{label}</Tag>;
      },
    },
    {
      title: 'Shop Quản lý',
      dataIndex: 'shop_id',
      key: 'shop_id',
      render: (value: number | null) => 
        value ? <Text strong>Shop #{value}</Text> : <Text type="secondary">Toàn hệ thống</Text>,
    },
    {
      title: 'Số khách hàng',
      dataIndex: 'customer_count',
      key: 'customer_count',
    },
  ];

  return (
    <div className="page-container" style={{ padding: '0 12px' }}>
      <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <Title level={3} style={{ color: '#1f2937', marginBottom: 4 }}>Quản lý Người dùng Admin</Title>
          <Text type="secondary">Phân quyền tài khoản quản trị hệ thống</Text>
        </div>
      </div>
      <Card bordered={false} style={{ borderRadius: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
        <Table rowKey="id" dataSource={users} columns={columns} />
      </Card>
    </div>
  );
};

export default AdminUsersPage;
