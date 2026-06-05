import React, { useState } from 'react';
import { Button, Form, Input, message, Typography, Checkbox } from 'antd';
import { Navigate, useNavigate } from 'react-router-dom';
import { LockOutlined, CrownOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';

const { Title, Text } = Typography;

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
    <div style={{
      minHeight: '100vh',
      width: '100%',
      display: 'flex',
      boxSizing: 'border-box',
      backgroundColor: '#f8fafc',
      overflow: 'hidden',
      position: 'relative'
    }}>
      {/* Seamless Unified Background & Transition Effect */}
      <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: '65%', pointerEvents: 'none', zIndex: 0 }}>
        {/* Soft, wide gradient fading into the right side's white/light gray */}
        <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, background: 'linear-gradient(to right, #16a34a 0%, rgba(22,163,74,0.9) 60%, transparent 100%)' }}></div>
        
        {/* Subtle Network Pattern */}
        <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, opacity: 0.08, backgroundImage: 'radial-gradient(circle, #fff 1.5px, transparent 1.5px)', backgroundSize: '40px 40px', maskImage: 'linear-gradient(to right, black 30%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to right, black 30%, transparent 100%)' }}></div>
        
        <CrownOutlined style={{ position: 'absolute', bottom: '-80px', left: '40px', fontSize: '360px', opacity: 0.08, transform: 'rotate(-10deg)', color: '#fff' }} />
      </div>

      {/* Left Side - Content */}
      <div style={{
        flex: '0 0 58%',
        background: 'transparent',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        zIndex: 10
      }}>
        {/* Decorative background shapes */}
        <div style={{ position: 'absolute', top: '-15%', right: '-5%', width: '400px', height: '400px', borderRadius: '50%', background: 'rgba(255,255,255,0.03)' }}></div>
        <div style={{ position: 'absolute', bottom: '-10%', left: '-15%', width: '500px', height: '500px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }}></div>
        
        <div style={{ maxWidth: '540px', width: '100%', padding: '0 40px', margin: '0 auto', position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '40px' }}>
            <div style={{ width: '40px', height: '40px', background: 'rgba(255,255,255,0.2)', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <CrownOutlined style={{ fontSize: '20px', color: '#fff' }} />
            </div>
            <div style={{ textAlign: 'left' }}>
              <Title level={4} style={{ color: '#fff', margin: 0 }}>SuperAdmin</Title>
              <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px' }}>Quản trị toàn bộ hệ thống</Text>
            </div>
          </div>

          <Title level={1} style={{ color: '#fff', marginBottom: '24px', fontWeight: 800, fontSize: '46px', lineHeight: 1.2, textShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
            Kết nối và quản lý<br />mọi chi nhánh
          </Title>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '16px', lineHeight: '1.6', maxWidth: '400px', margin: '0 auto' }}>
            Super Admin giúp bạn kiểm soát, theo dõi và phát triển toàn bộ hệ thống một cách dễ dàng.
          </p>

          <div style={{ marginTop: '60px', position: 'relative' }}>
            {/* SVG Network Map connecting to the right */}
            <svg width="100%" height="220px" viewBox="0 0 500 250" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.9, overflow: 'visible' }}>
              <path d="M 50,150 L 150,80 L 280,120 L 350,60" stroke="rgba(255,255,255,0.2)" strokeWidth="2" strokeDasharray="5,5" />
              <path d="M 150,80 L 200,220 L 320,180 L 350,60" stroke="rgba(255,255,255,0.2)" strokeWidth="2" strokeDasharray="5,5" />
              <path d="M 50,150 L 120,250 L 200,220" stroke="rgba(255,255,255,0.2)" strokeWidth="2" strokeDasharray="5,5" />
              {/* Connecting line to the card */}
              <path d="M 320,180 L 460,100" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeDasharray="5,5" />
              
              {/* The node that connects to the card */}
              <g>
                <circle cx="460" cy="100" r="8" fill="#fff" />
                <circle cx="460" cy="100" r="18" fill="#fff" opacity="0.3">
                  <animate attributeName="r" values="8;24;8" dur="2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.4;0;0.4" dur="2s" repeatCount="indefinite" />
                </circle>
              </g>

              {/* Other Nodes */}
              <g>
                <circle cx="50" cy="150" r="6" fill="#fff" />
                <circle cx="50" cy="150" r="14" fill="#fff" opacity="0.2">
                  <animate attributeName="r" values="6;20;6" dur="3s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.4;0;0.4" dur="3s" repeatCount="indefinite" />
                </circle>
                <text x="50" y="170" fill="rgba(255,255,255,0.6)" fontSize="12" textAnchor="middle">Cơ sở 1</text>
              </g>

              <g>
                <circle cx="150" cy="80" r="8" fill="#fff" />
                <circle cx="150" cy="80" r="18" fill="#fff" opacity="0.2">
                  <animate attributeName="r" values="8;24;8" dur="4s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.4;0;0.4" dur="4s" repeatCount="indefinite" />
                </circle>
                <text x="150" y="60" fill="rgba(255,255,255,0.9)" fontSize="14" fontWeight="bold" textAnchor="middle">Trung tâm</text>
              </g>

              <g>
                <circle cx="280" cy="120" r="6" fill="#fff" />
                <circle cx="280" cy="120" r="14" fill="#fff" opacity="0.2">
                  <animate attributeName="r" values="6;20;6" dur="2.5s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.4;0;0.4" dur="2.5s" repeatCount="indefinite" />
                </circle>
                <text x="280" y="100" fill="rgba(255,255,255,0.6)" fontSize="12" textAnchor="middle">Cơ sở 2</text>
              </g>

              <g>
                <circle cx="350" cy="60" r="5" fill="#fff" />
              </g>

              <g>
                <circle cx="200" cy="220" r="6" fill="#fff" />
                <circle cx="200" cy="220" r="14" fill="#fff" opacity="0.2">
                  <animate attributeName="r" values="6;20;6" dur="3.2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.4;0;0.4" dur="3.2s" repeatCount="indefinite" />
                </circle>
                <text x="200" y="240" fill="rgba(255,255,255,0.6)" fontSize="12" textAnchor="middle">Cơ sở 3</text>
              </g>

              <g>
                <circle cx="320" cy="180" r="5" fill="#fff" />
              </g>
              
              <g>
                <circle cx="120" cy="250" r="4" fill="#fff" />
              </g>
            </svg>
          </div>
        </div>
      </div>

      {/* Right Side - Content */}
      <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', zIndex: 10 }}>
        
        {/* Main Content Area */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {/* The Overlapping Login Card */}
          <div style={{
            marginLeft: '-180px', // Đẩy thẻ lấn sâu sang trái hơn để lấp đầy khoảng trống
            width: '480px',
            backgroundColor: '#fff',
            borderRadius: '24px',
            boxShadow: '0 24px 64px rgba(0,0,0,0.12)',
            display: 'flex',
            overflow: 'hidden',
            zIndex: 10
          }}>
            {/* Left panel of the card (Gradient + Icon) */}
            <div style={{
              width: '120px',
              background: 'linear-gradient(180deg, #f0fdf4 0%, #ffffff 100%)',
              borderRight: '1px solid rgba(0,0,0,0.04)',
              display: 'flex',
              justifyContent: 'center',
              paddingTop: '48px'
            }}>
              <div style={{ 
                width: '48px', height: '48px', 
                background: '#dcfce7', 
                borderRadius: '16px', 
                display: 'flex', justifyContent: 'center', alignItems: 'center',
                boxShadow: '0 8px 16px rgba(22, 163, 74, 0.15)'
              }}>
                <CrownOutlined style={{ fontSize: '24px', color: '#16a34a' }} />
              </div>
            </div>

            {/* Right panel of the card (Form) */}
            <div style={{ flex: 1, padding: '40px 32px' }}>
              <Title level={3} style={{ margin: '0 0 32px 0', color: '#1f2937', textAlign: 'center' }}>
                Đăng nhập Super Admin
              </Title>
              
              <Form name="login" layout="vertical" onFinish={onFinish} size="large">
                <Form.Item name="email" rules={[{ required: true, message: 'Vui lòng nhập email' }]}>
                  <Input 
                    prefix={<span style={{ fontWeight: 800, fontSize: '18px', color: '#1e3a8a', marginRight: '12px' }}>e</span>} 
                    placeholder="Email" 
                    style={{ borderRadius: '12px', height: '48px' }} 
                  />
                </Form.Item>
                
                <Form.Item name="password" rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }]}>
                  <Input.Password 
                    prefix={<LockOutlined style={{ color: '#16a34a', marginRight: '12px', fontSize: '16px' }} />} 
                    placeholder="Mật khẩu" 
                    style={{ borderRadius: '12px', height: '48px' }} 
                  />
                </Form.Item>

                <Form.Item style={{ marginBottom: '24px' }}>
                  <Checkbox style={{ color: '#6b7280' }}>Nhớ tài khoản</Checkbox>
                </Form.Item>

                <Form.Item style={{ marginBottom: 0 }}>
                  <Button type="primary" htmlType="submit" loading={submitting} block style={{ 
                    height: '48px', 
                    borderRadius: '12px', 
                    fontSize: '16px', 
                    fontWeight: 600, 
                    background: 'linear-gradient(90deg, #22c55e 0%, #16a34a 100%)',
                    border: 'none',
                    boxShadow: '0 8px 20px rgba(22, 163, 74, 0.3)'
                  }}>
                    Đăng nhập
                  </Button>
                </Form.Item>
              </Form>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', color: '#9ca3af', fontSize: '13px', padding: '24px 0' }}>
          <p style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
            <LockOutlined style={{ color: '#16a34a' }} /> Chỉ tài khoản có quyền Super Admin mới có thể đăng nhập
          </p>
          <p>© 2026 Bếp Mầm. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
