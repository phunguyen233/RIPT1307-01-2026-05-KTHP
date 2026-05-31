import React, { useEffect, useState } from 'react';
import { Card, Table, Typography } from 'antd';
import { getShopsStats, ShopStats } from '../api/adminAPI';

const { Title } = Typography;

const ShopsPage: React.FC = () => {
  const [shops, setShops] = useState<ShopStats[]>([]);

  useEffect(() => {
    const load = async () => {
      const data = await getShopsStats();
      setShops(data);
    };
    load().catch(console.error);
  }, []);

  const columns = [
    {
      title: 'Tên shop',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Khách hàng',
      dataIndex: 'customer_count',
      key: 'customer_count',
    },
    {
      title: 'Sản phẩm',
      dataIndex: 'product_count',
      key: 'product_count',
    },
    {
      title: 'Đơn hàng',
      dataIndex: 'order_count',
      key: 'order_count',
    },
    {
      title: 'Doanh thu',
      dataIndex: 'revenue',
      key: 'revenue',
      render: (value: number) => value.toLocaleString('vi-VN') + '₫',
    },
  ];

  return (
    <div className="page-container">
      <Title level={2}>Quản lý Shop</Title>
      <Card>
        <Table rowKey="id" dataSource={shops} columns={columns} />
      </Card>
    </div>
  );
};

export default ShopsPage;
