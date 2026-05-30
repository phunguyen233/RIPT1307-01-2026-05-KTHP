import React from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { Layout, Menu, Button, Typography } from 'antd';
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
      <Sider breakpoint="lg" collapsedWidth="0">
        <div className="logo">
          <Title level={4} style={{ color: '#fff', margin: 0 }}>
            Superadmin
          </Title>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          onClick={handleMenuSelect}
          items={[
            { key: 'dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
            { key: 'shops', icon: <ShopOutlined />, label: 'Quản lý Shop' },
            { key: 'admin-users', icon: <UserOutlined />, label: 'Quản lý người dùng' },
          ]}
        />
      </Sider>
      <Layout>
        <Header className="site-layout-header">
          <div className="header-content">
            <div>
              <Title level={5} style={{ color: '#fff', margin: 0, display: 'inline-block' }}>
                Xin chào, {user?.name || 'Superadmin'}
              </Title>
            </div>
            <Button icon={<LogoutOutlined />} type="primary" danger onClick={() => { logout(); navigate('/login'); }}>
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
);

export default App;
