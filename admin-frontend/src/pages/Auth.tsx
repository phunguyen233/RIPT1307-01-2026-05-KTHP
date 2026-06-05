import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Form, Input, Button, Checkbox, message, Spin } from "antd";
import { UserOutlined, LockOutlined, MailOutlined, SafetyCertificateOutlined, ShopOutlined, CheckCircleFilled } from "@ant-design/icons";
import authAPI from "../api/authAPI";
import { useAuth } from "../contexts/AuthContext";

type TabKey = "login" | "register";

const Auth: React.FC = () => {
  const [mode, setMode] = useState<TabKey>("login");
  const [loginForm] = Form.useForm();
  const [registerForm] = Form.useForm();
  const [loginLoading, setLoginLoading] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { setToken } = useAuth();

  const from = (location.state as any)?.from?.pathname || "/dashboard";

  const handleLogin = async (values: any) => {
    setLoginLoading(true);
    try {
      const res = await authAPI.login({ email: values.email, password: values.password });

      if (res.user.role !== "admin" && res.user.role !== "staff" && res.user.role !== "superadmin") {
        message.error("Chỉ admin hoặc nhân viên được phép đăng nhập tại đây");
        return;
      }

      if (res.token) {
        setToken(res.token);
        localStorage.setItem("user", JSON.stringify(res.user));
        localStorage.setItem("shop_id", res.user.shop_id);
        localStorage.setItem("api_key", res.user.api_key || "");
        message.success("Đăng nhập thành công!");
        navigate(from, { replace: true });
      }
    } catch (err: any) {
      message.error(err?.response?.data?.error || "Email hoặc mật khẩu bị sai");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async (values: any) => {
    if (values.password !== values.confirmPassword) {
      message.error("Mật khẩu không khớp");
      return;
    }

    setRegisterLoading(true);
    try {
      const res = await authAPI.registerAdmin({
        name: values.name,
        email: values.email,
        password: values.password,
        shop_name: values.shopName,
        shop_email: values.shopEmail || undefined,
      });

      if (res.user && res.token) {
        setToken(res.token);
        localStorage.setItem("user", JSON.stringify(res.user));
        localStorage.setItem("shop_id", res.user.shop_id);
        if (res.user.api_key) {
          localStorage.setItem("api_key", res.user.api_key);
        }
        if (res.shop?.name) {
          localStorage.setItem("shop_name", res.shop.name);
        }
        message.success("Đăng ký thành công!");
        navigate(from, { replace: true });
      }
    } catch (err: any) {
      message.error(err?.response?.data?.error || "Đăng ký thất bại");
    } finally {
      setRegisterLoading(false);
    }
  };

  const features = [
    { title: "Quản lý đa chi nhánh" },
    { title: "Theo dõi doanh thu" },
    { title: "Đồng bộ dữ liệu" },
  ];

  return (
    <div className="flex h-screen w-full bg-[#f8fafc] font-sans overflow-hidden relative">
      
      {/* Seamless Unified Background & Transition Effect */}
      <div className="absolute inset-y-0 left-0 w-[65%] pointer-events-none z-0">
        {/* Soft, wide gradient fading into the right side's white/light gray */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#16a34a] via-[#16a34a]/90 to-transparent"></div>
        
        {/* Subtle Network Pattern */}
        <div className="absolute inset-0 opacity-[0.08]" style={{ backgroundImage: 'radial-gradient(circle, #fff 1.5px, transparent 1.5px)', backgroundSize: '40px 40px', maskImage: 'linear-gradient(to right, black 30%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to right, black 30%, transparent 100%)' }}></div>
        
        {/* Glowing dot network map simulation */}
        <svg className="absolute inset-0 w-full h-full opacity-15 mix-blend-overlay" viewBox="0 0 100 100" preserveAspectRatio="none">
           <path d="M10,20 L30,50 L60,30 L75,60" fill="none" stroke="white" strokeWidth="0.5" strokeDasharray="2,2"/>
           <circle cx="10" cy="20" r="1.5" fill="white" className="animate-pulse"/>
           <circle cx="30" cy="50" r="1.5" fill="white" className="animate-pulse"/>
           <circle cx="60" cy="30" r="1.5" fill="white" className="animate-pulse"/>
           <circle cx="75" cy="60" r="1.5" fill="white" className="animate-pulse"/>
        </svg>

        {/* Large transparent shield watermark - increased opacity to 8% */}
        <SafetyCertificateOutlined className="absolute -bottom-20 left-10 text-[360px] opacity-[0.08] rotate-[-10deg]" />
      </div>

      <div className="flex w-full h-full relative z-10">
        
        {/* Left Column Content - Marketing */}
        <div className="hidden lg:flex flex-col w-[45%] xl:w-[40%] text-white px-16 py-20 justify-between">
          
          {/* Logo */}
          <div className="flex items-center space-x-3 mb-10">
            <div className="w-10 h-10 border border-white/30 rounded-xl flex items-center justify-center bg-white/10 backdrop-blur-md shadow-sm">
              <SafetyCertificateOutlined className="text-xl" />
            </div>
            <div>
              <h1 className="text-[22px] font-bold leading-tight m-0 tracking-tight text-white drop-shadow-sm">Bếp Mầm</h1>
              <p className="text-[10px] text-green-50 m-0 uppercase tracking-[0.2em] font-bold opacity-80">Store Management</p>
            </div>
          </div>

          {/* Hero Text */}
          <div className="flex-grow flex flex-col justify-center">
            <h2 className="text-[48px] font-bold leading-[1.1] mb-6 tracking-tight drop-shadow-sm max-w-sm">
              Quản lý toàn bộ<br/>
              <span className="text-white/90 font-light">hệ thống cửa hàng</span>
            </h2>
            <p className="text-green-50 text-[17px] max-w-sm leading-relaxed mb-14 opacity-95 font-light">
              Giải pháp quản lý tập trung giúp kiểm soát và phát triển toàn bộ hệ thống từ một nền tảng duy nhất.
            </p>

            {/* Feature List */}
            <div className="space-y-6">
              {features.map((feature, idx) => (
                <div key={idx} className="flex items-center group">
                  <div className="w-[22px] h-[22px] rounded-full bg-white/15 flex items-center justify-center mr-4 backdrop-blur-sm shadow-sm transition-transform duration-300 group-hover:scale-110">
                    <CheckCircleFilled className="text-white text-[12px]" />
                  </div>
                  <h4 className="text-white font-medium text-[16px] drop-shadow-sm tracking-wide">{feature.title}</h4>
                </div>
              ))}
            </div>
          </div>

          <div className="text-green-100/60 text-[13px] font-light tracking-wide pt-10">
            &copy; 2026 Bếp Mầm. Enterprise Edition.
          </div>
        </div>

        {/* Right Column Content - Login Form Card */}
        <div className="w-full lg:w-[55%] xl:w-[60%] flex items-center justify-center p-6 lg:p-12 overflow-y-auto">
          <div className="bg-white w-full max-w-[460px] rounded-[24px] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.08)] border border-gray-100/80 p-10 relative">
            
            {/* Form Header */}
            <div className="text-center mb-8">
              <h2 className="text-[26px] font-bold text-[#0f172a] mb-1.5 tracking-tight">Hệ Thống Quản Lý</h2>
              <p className="text-gray-500 text-[14px]">Đăng nhập để tiếp tục sử dụng hệ thống</p>
            </div>

            {/* Pill Tabs */}
            <div className="flex mb-8 bg-gray-100/70 p-1.5 rounded-full border border-gray-100">
              <button 
                className={`flex-1 py-2 text-center font-medium text-[14px] rounded-full transition-all duration-300 ${mode === 'login' ? 'bg-white text-[#0f172a] shadow-sm' : 'text-gray-400 hover:text-gray-700'}`}
                onClick={() => setMode('login')}
              >
                Đăng nhập
              </button>
              <button 
                className={`flex-1 py-2 text-center font-medium text-[14px] rounded-full transition-all duration-300 ${mode === 'register' ? 'bg-white text-[#0f172a] shadow-sm' : 'text-gray-400 hover:text-gray-700'}`}
                onClick={() => setMode('register')}
              >
                Đăng ký
              </button>
            </div>

            {mode === "login" && (
              <Spin spinning={loginLoading}>
                <Form form={loginForm} layout="vertical" onFinish={handleLogin} requiredMark={false} className="login-form">
                  <Form.Item
                    label={<span className="text-[#0f172a] font-medium text-[13px] ml-1">Email làm việc</span>}
                    name="email"
                    rules={[{ required: true, message: "Vui lòng nhập email!" }, { type: 'email', message: 'Email không hợp lệ!' }]}
                    className="mb-5"
                  >
                    <Input 
                      size="large" 
                      prefix={<MailOutlined className="text-gray-400 mr-2 text-lg" />} 
                      placeholder="admin@bepmam.vn" 
                      className="rounded-[14px] py-3 px-4 border-gray-200 hover:border-[#16a34a] focus:border-[#16a34a] focus:shadow-[0_0_0_2px_rgba(22,163,74,0.15)] text-[15px] bg-gray-50/50 hover:bg-white focus:bg-white transition-all duration-300"
                    />
                  </Form.Item>

                  <Form.Item
                    label={<span className="text-[#0f172a] font-medium text-[13px] ml-1">Mật khẩu</span>}
                    name="password"
                    rules={[{ required: true, message: "Vui lòng nhập mật khẩu!" }]}
                    className="mb-5"
                  >
                    <Input.Password 
                      size="large" 
                      prefix={<LockOutlined className="text-gray-400 mr-2 text-lg" />} 
                      placeholder="••••••••" 
                      className="rounded-[14px] py-3 px-4 border-gray-200 hover:border-[#16a34a] focus:border-[#16a34a] focus:shadow-[0_0_0_2px_rgba(22,163,74,0.15)] text-[15px] bg-gray-50/50 hover:bg-white focus:bg-white transition-all duration-300"
                    />
                  </Form.Item>

                  <div className="flex justify-between items-center mb-8 px-1">
                    <Form.Item name="remember" valuePropName="checked" noStyle>
                      <Checkbox className="text-gray-500 text-[13px] font-medium">Nhớ thiết bị này</Checkbox>
                    </Form.Item>
                    <a className="text-[#16a34a] hover:text-[#15803d] text-[13px] font-semibold transition-colors duration-300" href="#">
                      Quên mật khẩu?
                    </a>
                  </div>

                  <Form.Item className="mb-0">
                    <Button 
                      type="primary" 
                      htmlType="submit" 
                      className="w-full h-14 rounded-[14px] bg-[#16a34a] hover:bg-[#15803d] text-[15px] font-semibold flex items-center justify-center border-none shadow-[0_8px_16px_-6px_rgba(22,163,74,0.4)] transition-all duration-300 hover:-translate-y-[2px] hover:shadow-[0_12px_20px_-6px_rgba(22,163,74,0.5)]"
                    >
                      Đăng nhập
                    </Button>
                  </Form.Item>
                </Form>
              </Spin>
            )}

            {mode === "register" && (
              <Spin spinning={registerLoading}>
                <Form form={registerForm} layout="vertical" onFinish={handleRegister} requiredMark={false} className="register-form">
                  <div className="grid grid-cols-2 gap-3">
                    <Form.Item
                      label={<span className="text-[#0f172a] font-medium text-[13px] ml-1">Họ tên</span>}
                      name="name"
                      rules={[{ required: true, message: "Nhập họ tên!" }]}
                      className="mb-4"
                    >
                      <Input size="large" prefix={<UserOutlined className="text-gray-400 mr-2 text-lg" />} placeholder="Họ tên" className="rounded-[14px] py-2.5 px-3 border-gray-200 hover:border-[#16a34a] focus:border-[#16a34a] focus:shadow-[0_0_0_2px_rgba(22,163,74,0.15)] bg-gray-50/50 focus:bg-white transition-all duration-300"/>
                    </Form.Item>

                    <Form.Item
                      label={<span className="text-[#0f172a] font-medium text-[13px] ml-1">Email quản trị</span>}
                      name="email"
                      rules={[{ required: true, message: "Nhập email!" }, { type: "email", message: "Email không hợp lệ!" }]}
                      className="mb-4"
                    >
                      <Input size="large" prefix={<MailOutlined className="text-gray-400 mr-2 text-lg" />} placeholder="admin@bepmam.vn" className="rounded-[14px] py-2.5 px-3 border-gray-200 hover:border-[#16a34a] focus:border-[#16a34a] focus:shadow-[0_0_0_2px_rgba(22,163,74,0.15)] bg-gray-50/50 focus:bg-white transition-all duration-300"/>
                    </Form.Item>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Form.Item
                      label={<span className="text-[#0f172a] font-medium text-[13px] ml-1">Tên cửa hàng</span>}
                      name="shopName"
                      rules={[{ required: true, message: "Nhập tên cửa hàng!" }]}
                      className="mb-4"
                    >
                      <Input size="large" prefix={<ShopOutlined className="text-gray-400 mr-2 text-lg" />} placeholder="Tên cửa hàng" className="rounded-[14px] py-2.5 px-3 border-gray-200 hover:border-[#16a34a] focus:border-[#16a34a] focus:shadow-[0_0_0_2px_rgba(22,163,74,0.15)] bg-gray-50/50 focus:bg-white transition-all duration-300"/>
                    </Form.Item>

                    <Form.Item
                      label={<span className="text-[#0f172a] font-medium text-[13px] ml-1">Email cửa hàng <span className="text-gray-400 font-normal">(Tùy chọn)</span></span>}
                      name="shopEmail"
                      rules={[{ type: "email", message: "Email không hợp lệ!" }]}
                      className="mb-4"
                    >
                      <Input size="large" prefix={<MailOutlined className="text-gray-400 mr-2 text-lg" />} placeholder="cskh@bepmam.vn" className="rounded-[14px] py-2.5 px-3 border-gray-200 hover:border-[#16a34a] focus:border-[#16a34a] focus:shadow-[0_0_0_2px_rgba(22,163,74,0.15)] bg-gray-50/50 focus:bg-white transition-all duration-300"/>
                    </Form.Item>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Form.Item
                      label={<span className="text-[#0f172a] font-medium text-[13px] ml-1">Mật khẩu</span>}
                      name="password"
                      rules={[{ required: true, message: "Nhập mật khẩu!" }, { min: 6, message: "Tối thiểu 6 ký tự!" }]}
                      className="mb-4"
                    >
                      <Input.Password size="large" prefix={<LockOutlined className="text-gray-400 mr-2 text-lg" />} placeholder="••••••••" className="rounded-[14px] py-2.5 px-3 border-gray-200 hover:border-[#16a34a] focus:border-[#16a34a] focus:shadow-[0_0_0_2px_rgba(22,163,74,0.15)] bg-gray-50/50 focus:bg-white transition-all duration-300"/>
                    </Form.Item>

                    <Form.Item
                      label={<span className="text-[#0f172a] font-medium text-[13px] ml-1">Xác nhận</span>}
                      name="confirmPassword"
                      rules={[{ required: true, message: "Xác nhận mật khẩu!" }]}
                      className="mb-4"
                    >
                      <Input.Password size="large" prefix={<LockOutlined className="text-gray-400 mr-2 text-lg" />} placeholder="••••••••" className="rounded-[14px] py-2.5 px-3 border-gray-200 hover:border-[#16a34a] focus:border-[#16a34a] focus:shadow-[0_0_0_2px_rgba(22,163,74,0.15)] bg-gray-50/50 focus:bg-white transition-all duration-300"/>
                    </Form.Item>
                  </div>

                  <Form.Item className="mt-4 mb-0">
                    <Button 
                      type="primary" 
                      htmlType="submit" 
                      className="w-full h-14 rounded-[14px] bg-[#16a34a] hover:bg-[#15803d] text-[15px] font-semibold border-none shadow-[0_8px_16px_-6px_rgba(22,163,74,0.4)] transition-all duration-300 hover:-translate-y-[2px] hover:shadow-[0_12px_20px_-6px_rgba(22,163,74,0.5)]"
                    >
                      Tạo tài khoản quản trị
                    </Button>
                  </Form.Item>
                </Form>
              </Spin>
            )}

            {/* Feature Badges under the form */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
              <div className="flex items-center text-[12px] text-gray-500 font-medium"><span className="mr-1.5 text-[14px]">🔒</span> Bảo mật dữ liệu</div>
              <div className="flex items-center text-[12px] text-gray-500 font-medium"><span className="mr-1.5 text-[14px]">⚡</span> Truy cập nhanh</div>
              <div className="flex items-center text-[12px] text-gray-500 font-medium"><span className="mr-1.5 text-[14px]">☁️</span> Đồng bộ hệ thống</div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default Auth;