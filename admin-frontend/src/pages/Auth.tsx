import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Form, Input, Button, Card, Tabs, message, Spin } from "antd";
import { UserOutlined, LockOutlined, ShopOutlined, MailOutlined } from "@ant-design/icons";
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

      if (res.user.role !== "admin") {
        message.error("Chỉ admin được phép đăng nhập tại đây");
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

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", backgroundColor: "#f0f2f5", padding: "24px" }}>
      <Card
        style={{ width: "100%", maxWidth: "450px" }}
        title={<div style={{ textAlign: "center", fontSize: "24px", fontWeight: "bold" }}>Hệ Thống Quản Lý Cửa Hàng</div>}
        bordered={false}
      >
        <Tabs
          activeKey={mode}
          onChange={(key) => setMode(key as TabKey)}
          items={[
            {
              key: "login",
              label: "Đăng nhập",
              children: (
                <Spin spinning={loginLoading}>
                  <Form form={loginForm} layout="vertical" onFinish={handleLogin}>
                    <Form.Item
                      label="Email"
                      name="email"
                      rules={[
                        { required: true, message: "Vui lòng nhập email" },
                        { type: "email", message: "Email không hợp lệ" },
                      ]}
                    >
                      <Input prefix={<MailOutlined />} placeholder="Nhập email" size="large" />
                    </Form.Item>

                    <Form.Item
                      label="Mật khẩu"
                      name="password"
                      rules={[{ required: true, message: "Vui lòng nhập mật khẩu" }]}
                    >
                      <Input.Password prefix={<LockOutlined />} placeholder="Nhập mật khẩu" size="large" />
                    </Form.Item>

                    <Form.Item>
                      <Button type="primary" htmlType="submit" block size="large" loading={loginLoading}>
                        Đăng nhập
                      </Button>
                    </Form.Item>
                  </Form>
                </Spin>
              ),
            },
            {
              key: "register",
              label: "Đăng ký",
              children: (
                <Spin spinning={registerLoading}>
                  <Form form={registerForm} layout="vertical" onFinish={handleRegister}>
                    <Form.Item
                      label="Họ và tên"
                      name="name"
                      rules={[{ required: true, message: "Vui lòng nhập họ tên" }]}
                    >
                      <Input prefix={<UserOutlined />} placeholder="Nhập họ tên" size="large" />
                    </Form.Item>

                    <Form.Item
                      label="Email"
                      name="email"
                      rules={[
                        { required: true, message: "Vui lòng nhập email" },
                        { type: "email", message: "Email không hợp lệ" },
                      ]}
                    >
                      <Input prefix={<MailOutlined />} placeholder="Nhập email" size="large" />
                    </Form.Item>

                    <Form.Item
                      label="Tên cửa hàng"
                      name="shopName"
                      rules={[{ required: true, message: "Vui lòng nhập tên cửa hàng" }]}
                    >
                      <Input prefix={<ShopOutlined />} placeholder="Nhập tên cửa hàng" size="large" />
                    </Form.Item>

                    <Form.Item
                      label="Email cửa hàng (tùy chọn)"
                      name="shopEmail"
                      rules={[{ type: "email", message: "Email không hợp lệ" }]}
                    >
                      <Input prefix={<MailOutlined />} placeholder="Nhập email cửa hàng" size="large" />
                    </Form.Item>

                    <Form.Item
                      label="Mật khẩu"
                      name="password"
                      rules={[
                        { required: true, message: "Vui lòng nhập mật khẩu" },
                        { min: 6, message: "Mật khẩu phải có ít nhất 6 ký tự" },
                      ]}
                    >
                      <Input.Password prefix={<LockOutlined />} placeholder="Nhập mật khẩu" size="large" />
                    </Form.Item>

                    <Form.Item
                      label="Xác nhận mật khẩu"
                      name="confirmPassword"
                      rules={[{ required: true, message: "Vui lòng xác nhận mật khẩu" }]}
                    >
                      <Input.Password prefix={<LockOutlined />} placeholder="Xác nhận mật khẩu" size="large" />
                    </Form.Item>

                    <Form.Item>
                      <Button type="primary" htmlType="submit" block size="large" loading={registerLoading}>
                        Đăng ký
                      </Button>
                    </Form.Item>
                  </Form>
                </Spin>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
};

export default Auth;
