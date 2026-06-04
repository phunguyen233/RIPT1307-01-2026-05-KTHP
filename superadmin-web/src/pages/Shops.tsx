import React, { useEffect, useState } from 'react';
import { Card, Table, Typography, Space, Button } from 'antd';
import { ShopOutlined, PlusOutlined } from '@ant-design/icons';
import { getShopsStats, ShopStats } from '../api/adminAPI';

const { Title, Text } = Typography;

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
      align: 'right' as const,
      render: (value: number) => (
        <Text strong style={{ color: '#16a34a', fontSize: '17px' }}>
          {value.toLocaleString('vi-VN')} ₫
        </Text>
      ),
    },
  ];

  return (
    <div className="page-container" style={{ padding: '0 12px' }}>
      <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <Title level={3} style={{ color: '#1f2937', marginBottom: 4 }}>Quản lý Cửa hàng</Title>
          <Text type="secondary">Quản lý danh sách chi nhánh và doanh thu</Text>
        </div>
      </div>

      <Card bordered={false} style={{ borderRadius: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
        <Table rowKey="id" dataSource={shops} columns={columns} />
      </Card>
    </div>
  );
};

export default ShopsPage;
