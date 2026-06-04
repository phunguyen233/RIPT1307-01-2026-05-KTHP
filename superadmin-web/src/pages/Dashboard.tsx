import React, { useEffect, useState } from 'react';
import { Card, Col, Row, Statistic, Table, Typography, Space } from 'antd';
import { 
  ShopOutlined, 
  UserOutlined, 
  ShoppingOutlined, 
  DollarOutlined 
} from '@ant-design/icons';
import { getDashboardStats, getShopsStats } from '../api/adminAPI';
import { ShopStats, DashboardStats } from '../api/adminAPI';

const { Title, Text } = Typography;

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
      <div style={{ marginBottom: 32 }}>
        <Title level={3} style={{ color: '#1f2937', marginBottom: 4 }}>Tổng quan hệ thống</Title>
        <Text type="secondary">Cập nhật số liệu thống kê mới nhất của Bếp Mầm</Text>
      </div>

      <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false} hoverable style={{ borderRadius: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
            <Statistic 
              title={<Text type="secondary" style={{ fontSize: 14 }}>Tổng số Chi nhánh</Text>}
              value={stats?.total_shops ?? 0} 
              valueStyle={{ fontWeight: 700, fontSize: 24, color: '#1f2937' }}
              prefix={
                <div style={{ padding: '8px', background: '#dcfce7', borderRadius: '10px', display: 'flex', marginRight: '16px' }}>
                  <ShopOutlined style={{ color: '#16a34a', fontSize: 20 }} />
                </div>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false} hoverable style={{ borderRadius: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
            <Statistic 
              title={<Text type="secondary" style={{ fontSize: 14 }}>Tổng Khách hàng</Text>}
              value={stats?.total_customers ?? 0} 
              valueStyle={{ fontWeight: 700, fontSize: 24, color: '#1f2937' }}
              prefix={
                <div style={{ padding: '8px', background: '#e0f2fe', borderRadius: '10px', display: 'flex', marginRight: '16px' }}>
                  <UserOutlined style={{ color: '#0284c7', fontSize: 20 }} />
                </div>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false} hoverable style={{ borderRadius: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
            <Statistic 
              title={<Text type="secondary" style={{ fontSize: 14 }}>Tổng Sản phẩm</Text>}
              value={stats?.total_products ?? 0} 
              valueStyle={{ fontWeight: 700, fontSize: 24, color: '#1f2937' }}
              prefix={
                <div style={{ padding: '8px', background: '#fef3c7', borderRadius: '10px', display: 'flex', marginRight: '16px' }}>
                  <ShoppingOutlined style={{ color: '#d97706', fontSize: 20 }} />
                </div>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false} hoverable style={{ borderRadius: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
            <Statistic 
              title={<Text type="secondary" style={{ fontSize: 14 }}>Tổng Đơn hàng</Text>}
              value={stats?.total_orders ?? 0} 
              valueStyle={{ fontWeight: 700, fontSize: 24, color: '#1f2937' }}
              prefix={
                <div style={{ padding: '8px', background: '#fae8ff', borderRadius: '10px', display: 'flex', marginRight: '16px' }}>
                  <DollarOutlined style={{ color: '#c026d3', fontSize: 20 }} />
                </div>
              }
            />
          </Card>
        </Col>
      </Row>

      <Card 
        bordered={false} 
        style={{ borderRadius: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}
        title={<Title level={5} style={{ margin: 0 }}>Thống kê doanh thu theo Chi nhánh</Title>}
      >
        <Table 
          rowKey="id" 
          dataSource={shops} 
          columns={columns} 
          pagination={{ pageSize: 5 }} 
        />
      </Card>
    </div>
  );
};

export default DashboardPage;
