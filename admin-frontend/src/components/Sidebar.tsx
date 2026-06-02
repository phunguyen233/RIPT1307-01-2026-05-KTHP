import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, type MenuProps } from "antd";
import { HomeOutlined, ShoppingOutlined, AppstoreOutlined, UserOutlined, ShoppingCartOutlined, InboxOutlined, BookOutlined, StarOutlined, LogoutOutlined, KeyOutlined, ShopOutlined } from "@ant-design/icons";
import { useAuth } from "../contexts/AuthContext";

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { sidebarCollapsed, setToken } = useAuth();

  const handleLogout = () => {
    try { setToken(null); localStorage.removeItem("user"); } catch { }
    navigate('/auth');
  };

  const menuItems: MenuProps['items'] = [
    {
      key: "/dashboard",
      icon: <HomeOutlined />,
      label: <Link to="/dashboard">Trang chủ</Link>,
    },
    {
      key: "/products",
      icon: <ShoppingOutlined />,
      label: <Link to="/products">Sản phẩm</Link>,
    },
    {
      key: "/categories",
      icon: <AppstoreOutlined />,
      label: <Link to="/categories">Danh mục</Link>,
    },
    {
      key: "/ingredients",
      icon: <StarOutlined />,
      label: <Link to="/ingredients">Nguyên liệu</Link>,
    },
    {
      key: "/recipes",
      icon: <BookOutlined />,
      label: <Link to="/recipes">Công thức</Link>,
    },
    {
      key: "/customers",
      icon: <UserOutlined />,
      label: <Link to="/customers">Khách hàng</Link>,
    },
    {
      key: "/orders",
      icon: <ShoppingCartOutlined />,
      label: <Link to="/orders">Đơn hàng</Link>,
    },
    {
      key: "/inventory",
      icon: <InboxOutlined />,
      label: <Link to="/inventory">Nhập kho</Link>,
    },
    {
      key: "/api-key",
      icon: <KeyOutlined />,
      label: <Link to="/api-key">API Key</Link>,
    },
    {
      type: 'divider',
    },
  ];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
        <div style={{
          minWidth: 40, width: 40, height: 40, borderRadius: '50%', backgroundColor: '#dcfce7',
          display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#16a34a', fontSize: '20px'
        }}>
          <ShopOutlined />
        </div>
        {!sidebarCollapsed && (
          <div style={{ display: 'flex', flexDirection: 'column', whiteSpace: 'nowrap' }}>
            <span style={{ fontWeight: 'bold', fontSize: '18px', color: '#16a34a', lineHeight: 1.2 }}>Admin</span>
            <span style={{ fontSize: '12px', color: '#6b7280' }}>Quản trị cửa hàng</span>
          </div>
        )}
      </div>
      <Menu
        mode="inline"
        selectedKeys={[location.pathname]}
        style={{ flex: 1, borderRight: 0 }}
        inlineCollapsed={sidebarCollapsed}
        items={menuItems}
      />
    </div>
  );
}
