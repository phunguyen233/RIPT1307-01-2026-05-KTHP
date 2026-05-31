import React, { useEffect, useState } from 'react';
import { Card, Table, Typography } from 'antd';
import { getAdminUsers, AdminUserStats } from '../api/adminAPI';

const { Title } = Typography;

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
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
    },
    {
      title: 'Shop ID',
      dataIndex: 'shop_id',
      key: 'shop_id',
      render: (value: number | null) => value ?? '-',
    },
    {
      title: 'Số khách hàng',
      dataIndex: 'customer_count',
      key: 'customer_count',
    },
  ];

  return (
    <div className="page-container">
      <Title level={2}>Quản lý người dùng</Title>
      <Card>
        <Table rowKey="id" dataSource={users} columns={columns} />
      </Card>
    </div>
  );
};

export default AdminUsersPage;
