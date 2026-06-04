import React from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { Layout, Menu, Button, Typography, ConfigProvider } from 'antd';
import {
  DashboardOutlined,
  ShopOutlined,
  UserOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import RequireAuth from './components/RequireAuth';
import LoginPage from './pages/Login';
import DashboardPage from './pages/Dashboard';
import ShopsPage from './pages/Shops';
import AdminUsersPage from './pages/AdminUsers';
import './App.css';

const { Header, Content, Sider } = Layout;
const { Title } = Typography;

const AppLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const selectedKey = location.pathname.replace('/', '') || 'dashboard';

  const handleMenuSelect = ({ key }: { key: string }) => {
    navigate(`/${key}`);
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider breakpoint="lg" collapsedWidth="0" theme="light" style={{ borderRight: '1px solid #f0f0f0' }}>
        <div className="logo">
          <Title level={4} style={{ color: '#16a34a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            SuperAdmin
          </Title>
        </div>
        <Menu
          theme="light"
          mode="inline"
          selectedKeys={[selectedKey]}
          onClick={handleMenuSelect}
          items={[
            { key: 'dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
            { key: 'shops', icon: <ShopOutlined />, label: 'Quản lý Shop' },
            { key: 'admin-users', icon: <UserOutlined />, label: 'Quản lý người dùng' },
          ]}
          style={{ borderRight: 0 }}
        />
      </Sider>
      <Layout style={{ background: '#f8fafc' }}>
        <Header className="site-layout-header">
          <div className="header-content">
            <div>
              <Title level={5} style={{ color: '#334155', margin: 0, display: 'inline-block' }}>
                Xin chào, {user?.name || 'Superadmin'}
              </Title>
            </div>
            <Button icon={<LogoutOutlined />} type="default" onClick={() => { logout(); navigate('/login'); }}>
              Đăng xuất
            </Button>
          </div>
        </Header>
        <Content className="site-layout-content">
          <Routes>
            <Route
              path="/"
              element={<Navigate replace to="/dashboard" />}
            />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/shops" element={<ShopsPage />} />
            <Route path="/admin-users" element={<AdminUsersPage />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
};

const App: React.FC = () => (
  <ConfigProvider
    theme={{
      token: {
        colorPrimary: '#16a34a',
        borderRadius: 8,
        colorBgContainer: '#ffffff',
      },
      components: {
        Layout: {
          siderBg: '#ffffff',
          headerBg: '#ffffff',
        },
      },
    }}
  >
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/*"
            element={
              <RequireAuth>
                <AppLayout />
              </RequireAuth>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </ConfigProvider>
);

export default App;
