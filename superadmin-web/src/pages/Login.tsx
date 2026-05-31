import React, { useState } from 'react';
import { Button, Card, Form, Input, message, Typography } from 'antd';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const { Title } = Typography;

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, user } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  const onFinish = async (values: { email: string; password: string }) => {
    setSubmitting(true);
    try {
      await login(values);
      message.success('Đăng nhập thành công');
      navigate('/dashboard');
    } catch (error) {
      message.error((error as Error).message || 'Đăng nhập thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="login-page">
      <Card className="login-card">
        <Title level={3} style={{ textAlign: 'center' }}>Superadmin Login</Title>
        <Form name="login" layout="vertical" onFinish={onFinish}>
          <Form.Item
            label="Email"
            name="email"
            rules={[{ required: true, message: 'Vui lòng nhập email' }]}
          >
            <Input placeholder="Superadmin@gmail.com" />
          </Form.Item>

          <Form.Item
            label="Mật khẩu"
            name="password"
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }]}
          >
            <Input.Password placeholder="Mật khẩu" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={submitting} block>
              Đăng nhập
            </Button>
          </Form.Item>
        </Form>
        <div style={{ textAlign: 'center', marginTop: 12, color: 'rgba(0,0,0,0.45)' }}>
          Chỉ tài khoản role <strong>superadmin</strong> mới đăng nhập được.
        </div>
      </Card>
    </div>
  );
};

export default LoginPage;
