import { useNavigate } from "react-router-dom";
import { Layout, Button, Avatar, Dropdown } from "antd";
import { 
  MenuFoldOutlined, 
  MenuUnfoldOutlined, 
  UserOutlined, 
  LogoutOutlined, 
  ShopOutlined // Tao import thêm cái icon Cửa hàng ở đây
} from "@ant-design/icons";
import { useAuth } from "../contexts/AuthContext";
// theme removed

const { Header: AntHeader } = Layout;

export default function Header() {
  const navigate = useNavigate();
  const { setToken, sidebarCollapsed, setSidebarCollapsed } = useAuth();
  
  // Lấy data user từ két sắt
  const userRaw = localStorage.getItem("user");
  const user = userRaw ? JSON.parse(userRaw) : null;

  const handleLogout = () => {
    setToken(null);
    navigate("/auth");
  };

  // Hàm xử lý khi bấm nút "Xem cửa hàng"
  const handleViewShop = () => {
    if (user && user.shop_id) {
      // Mở sang web khách hàng cổng 3001, tự động gài ID vào link
      window.open(`http://localhost:3001?shop_id=${user.shop_id}`, '_blank');
    } else {
      alert('Tài khoản này chưa được liên kết với cửa hàng nào!');
    }
  };

  const userMenuItems = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Đăng xuất',
      onClick: handleLogout,
    },
  ];

  return (
    <AntHeader style={{ background: '#fff', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Button
          type="text"
          icon={sidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          style={{ fontSize: '16px', width: 64, height: 64 }}
        />
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>Hệ thống quản lý cửa hàng</h1>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Nút Xem Cửa Hàng tao nhét vào đây, đứng cạnh nút đổi Theme */}
        <Button 
          type="primary" 
          icon={<ShopOutlined />} 
          onClick={handleViewShop}
          style={{ display: 'flex', alignItems: 'center', background: '#16a34a' }}
        >
          Xem cửa hàng
        </Button>

        {/* theme toggle removed */}
        
        {user && (
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <Avatar icon={<UserOutlined />} />
              <span style={{ marginLeft: '8px' }}>{user.ho_ten || user.ten_dang_nhap}</span>
            </div>
          </Dropdown>
        )}
      </div>
    </AntHeader>
  );
}