import React, { useEffect, useState } from 'react';
import { Card, Col, Row, Statistic, Table, Typography } from 'antd';
import { getDashboardStats, getShopsStats } from '../api/adminAPI';
import { ShopStats, DashboardStats } from '../api/adminAPI';

const { Title } = Typography;

const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [shops, setShops] = useState<ShopStats[]>([]);

  useEffect(() => {
    const load = async () => {
      const [dashboard, shopData] = await Promise.all([getDashboardStats(), getShopsStats()]);
      setStats(dashboard);
      setShops(shopData);
    };
    load().catch(console.error);
  }, []);

  const columns = [
    {
      title: 'Shop',
      dataIndex: 'name',
      key: 'name',
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
      <Title level={2}>Dashboard</Title>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="Tổng số Shop" value={stats?.total_shops ?? 0} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="Tổng khách hàng" value={stats?.total_customers ?? 0} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="Tổng sản phẩm" value={stats?.total_products ?? 0} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="Tổng đơn hàng" value={stats?.total_orders ?? 0} />
          </Card>
        </Col>
      </Row>

      <Card title="Thống kê Shop">
        <Table rowKey="id" dataSource={shops} columns={columns} pagination={false} />
      </Card>
    </div>
  );
};

export default DashboardPage;
