import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "antd";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import Auth from "./pages/Auth";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import "./App.css";

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token } = useAuth();
  return token ? <>{children}</> : <Navigate to="/auth" replace />;
};

// Layout Wrapper Component for protected pages
const LayoutWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { sidebarCollapsed, setSidebarCollapsed } = useAuth();
  const sidebarWidth = sidebarCollapsed ? 80 : 200;

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Layout.Sider
        trigger={null}
        collapsible
        collapsed={sidebarCollapsed}
        width={200}
        collapsedWidth={80}
        style={{
          background: "#001529",
          position: "fixed",
          left: 0,
          top: 0,
          bottom: 0,
          overflow: "auto",
          height: "100vh",
        }}
      >
        <div
          style={{
            padding: "16px",
            textAlign: "center",
            color: "#001529",
            fontSize: "18px",
            fontWeight: "bold",
            background: "#fff",
          }}
        >
          {!sidebarCollapsed && "Admin"}
        </div>
        <Sidebar />
      </Layout.Sider>

      <Layout style={{ marginLeft: sidebarWidth, minHeight: "100vh" }}>
        <Header />

        <Layout.Content
          style={{
            margin: "24px 16px",
            padding: 24,
            background: "#fff",
            borderRadius: "8px",
            overflow: "auto",
          }}
        >
          {children}
        </Layout.Content>
      </Layout>
    </div>
  );
};

// Placeholder page components
const PagePlaceholder: React.FC<{ title: string }> = ({ title }) => (
  <div>
    <h1>{title}</h1>
    <p>Coming soon...</p>
  </div>
);

// Dashboard Component with Ant Design Layout
const Dashboard: React.FC = () => {
  const user = localStorage.getItem("user");
  const userData = user ? JSON.parse(user) : null;

  return (
    <LayoutWrapper>
      <div
        style={{
          fontSize: "24px",
          fontWeight: "bold",
          marginBottom: "24px",
        }}
      >
        Chào mừng, {userData?.name}
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "16px",
        }}
      >
        <div
          style={{
            padding: "24px",
            background: "#fafafa",
            borderRadius: "8px",
            border: "1px solid #f0f0f0",
          }}
        >
          <div style={{ fontSize: "14px", color: "#666", marginBottom: "12px" }}>
            Tổng đơn hàng
          </div>
          <div style={{ fontSize: "28px", fontWeight: "bold", color: "#1890ff" }}>
            0
          </div>
        </div>
        <div
          style={{
            padding: "24px",
            background: "#fafafa",
            borderRadius: "8px",
            border: "1px solid #f0f0f0",
          }}
        >
          <div style={{ fontSize: "14px", color: "#666", marginBottom: "12px" }}>
            Tổng khách hàng
          </div>
          <div
            style={{
              fontSize: "28px",
              fontWeight: "bold",
              color: "#52c41a",
            }}
          >
            0
          </div>
        </div>
        <div
          style={{
            padding: "24px",
            background: "#fafafa",
            borderRadius: "8px",
            border: "1px solid #f0f0f0",
          }}
        >
          <div style={{ fontSize: "14px", color: "#666", marginBottom: "12px" }}>
            Tổng sản phẩm
          </div>
          <div
            style={{
              fontSize: "28px",
              fontWeight: "bold",
              color: "#faad14",
            }}
          >
            0
          </div>
        </div>
      </div>
    </LayoutWrapper>
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
      <Route
        path="/products"
        element={
          <ProtectedRoute>
            <LayoutWrapper>
              <PagePlaceholder title="Sản phẩm" />
            </LayoutWrapper>
          </ProtectedRoute>
        }
      />
      <Route
        path="/categories"
        element={
          <ProtectedRoute>
            <LayoutWrapper>
              <PagePlaceholder title="Danh mục" />
            </LayoutWrapper>
          </ProtectedRoute>
        }
      />
      <Route
        path="/ingredients"
        element={
          <ProtectedRoute>
            <LayoutWrapper>
              <PagePlaceholder title="Nguyên liệu" />
            </LayoutWrapper>
          </ProtectedRoute>
        }
      />
      <Route
        path="/recipes"
        element={
          <ProtectedRoute>
            <LayoutWrapper>
              <PagePlaceholder title="Công thức" />
            </LayoutWrapper>
          </ProtectedRoute>
        }
      />
      <Route
        path="/customers"
        element={
          <ProtectedRoute>
            <LayoutWrapper>
              <PagePlaceholder title="Khách hàng" />
            </LayoutWrapper>
          </ProtectedRoute>
        }
      />
      <Route
        path="/orders"
        element={
          <ProtectedRoute>
            <LayoutWrapper>
              <PagePlaceholder title="Đơn hàng" />
            </LayoutWrapper>
          </ProtectedRoute>
        }
      />
      <Route
        path="/inventory"
        element={
          <ProtectedRoute>
            <LayoutWrapper>
              <PagePlaceholder title="Nhập kho" />
            </LayoutWrapper>
          </ProtectedRoute>
        }
      />
      <Route
        path="/api-key"
        element={
          <ProtectedRoute>
            <LayoutWrapper>
              <PagePlaceholder title="API Key" />
            </LayoutWrapper>
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
        <ThemeProvider>
          <AppRoutes />
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
