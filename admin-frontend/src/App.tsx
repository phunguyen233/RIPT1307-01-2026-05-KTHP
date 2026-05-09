import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout, Menu, Button, Dropdown, Avatar, Space } from "antd";
import {
  DashboardOutlined,
  ShoppingOutlined,
  UserOutlined,
  FileTextOutlined,
  LogoutOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Auth from "./pages/Auth";
import "./App.css";
const { Header, Sider, Content } = Layout;

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token } = useAuth();
  return token ? <>{children}</> : <Navigate to="/auth" replace />;
};

// Dashboard Component with Ant Design Layout
const Dashboard: React.FC = () => {
  const { token, setToken } = useAuth();
  const [collapsed, setCollapsed] = React.useState(false);
  const user = localStorage.getItem("user");
  const shopName = localStorage.getItem("shop_name");
  const userData = user ? JSON.parse(user) : null;

  const handleLogout = () => {
    setToken(null);
    window.location.href = "/auth";
  };

  const userMenuItems = [
    { key: "profile", icon: <SettingOutlined />, label: "Hồ sơ cá nhân" },
    { key: "logout", icon: <LogoutOutlined />, label: "Đăng xuất" },
  ];

  const handleUserMenuClick = (e: any) => {
    if (e.key === "logout") {
      handleLogout();
    }
  };
  const sidebarMenu = [
    { key: "1", icon: <DashboardOutlined />, label: "Dashboard" },
    { key: "2", icon: <ShoppingOutlined />, label: "Sản phẩm" },
    { key: "3", icon: <UserOutlined />, label: "Khách hàng" },
    { key: "4", icon: <FileTextOutlined />, label: "Đơn hàng" },
  ];
  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider trigger={null} collapsible collapsed={collapsed} width={200} style={{ background: "#001529" }}>
        <div style={{ padding: "16px", textAlign: "center", color: "#fff", fontSize: "18px", fontWeight: "bold" }}>
          {!collapsed && "Admin"}
        </div>
        <Menu theme="dark" mode="inline" defaultSelectedKeys={["1"]} items={sidebarMenu} />
      </Sider>

      <Layout>
        <Header
          style={{
            background: "#fff",
            padding: "0 24px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Button
            type="text"
            icon={collapsed ? <DashboardOutlined /> : <DashboardOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: "16px" }}
          />
          <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
            {shopName && <span style={{ fontSize: "14px", color: "#666" }}>Shop: {shopName}</span>}
            <Dropdown menu={{ items: userMenuItems, onClick: handleUserMenuClick }} trigger={["click"]}>
              <Space style={{ cursor: "pointer" }}>
                <Avatar size="large" icon={<UserOutlined />} />
                <span>{userData?.name || "User"}</span>
              </Space>
            </Dropdown>
          </div>
        </Header>

        <Content
          style={{
            margin: "24px 16px",
            padding: 24,
            background: "#fff",
            borderRadius: "8px",
          }}
        >
          <div style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "24px" }}>Chào mừng, {userData?.name}</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "16px" }}>
            <div
              style={{
                padding: "24px",
                background: "#fafafa",
                borderRadius: "8px",
                border: "1px solid #f0f0f0",
              }}
            >
              <div style={{ fontSize: "14px", color: "#666", marginBottom: "12px" }}>Tổng đơn hàng</div>
              <div style={{ fontSize: "28px", fontWeight: "bold", color: "#1890ff" }}>0</div>
            </div>
            <div
              style={{
                padding: "24px",
                background: "#fafafa",
                borderRadius: "8px",
                border: "1px solid #f0f0f0",
              }}
            >
              <div style={{ fontSize: "14px", color: "#666", marginBottom: "12px" }}>Tổng khách hàng</div>
              <div style={{ fontSize: "28px", fontWeight: "bold", color: "#52c41a" }}>0</div>
            </div>
            <div
              style={{
                padding: "24px",
                background: "#fafafa",
                borderRadius: "8px",
                border: "1px solid #f0f0f0",
              }}
            >
              <div style={{ fontSize: "14px", color: "#666", marginBottom: "12px" }}>Tổng sản phẩm</div>
              <div style={{ fontSize: "28px", fontWeight: "bold", color: "#faad14" }}>0</div>
            </div>
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/auth" element={<Auth />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
