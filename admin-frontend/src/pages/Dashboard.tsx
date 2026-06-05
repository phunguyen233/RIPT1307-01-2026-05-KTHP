import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Row, Col, Card, Select, Table, Tag, Typography, Space, Progress, Avatar, Spin, Input, Badge, Modal, notification } from 'antd';
import { 
  ShoppingOutlined, 
  ContainerOutlined, 
  DollarCircleOutlined, 
  TagOutlined, 
  ClockCircleOutlined,
  ArrowUpOutlined,
  SearchOutlined,
  BellOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { io, Socket } from 'socket.io-client';
import dayjs from 'dayjs';

// API Imports
import { ingredientAPI } from '../api/ingredientAPI'; 
import { productAPI } from '../api/productAPI';
import { orderAPI } from '../api/orderAPI';

const { Title, Text } = Typography;
const { Option } = Select;

type NotificationItem = {
  id: string | number;
  title: string;
  description: string;
  time: string;
  orderCode?: string;
};

const apiHost = (process.env.REACT_APP_API_URL || 'https://bepmam-backend.onrender.com').replace(/\/api\/?$/, '');

// Theme configuration matching SaaS style
const THEME = {
  primaryGreen: '#16a34a',
  lightGreenBg: '#f0fdf4',
  textDark: '#1e293b',
  textSecondary: '#64748b',
  borderLight: '#f1f5f9',
  bgPage: '#f8fafc',
  shadowSubtle: '0 4px 18px 0 rgba(0, 0, 0, 0.03)'
};

const Dashboard: React.FC = () => {
  const [isFetching, setIsFetching] = useState<boolean>(true);
  
  // ==========================================
  // FIX LỖI Ở ĐÂY: KHAI BÁO BIẾN PHÂN QUYỀN
  // ==========================================
  const currentUserRole = (() => {
    try {
      const raw = localStorage.getItem('user');
      const user = raw ? JSON.parse(raw) : null;
      return user?.role || '';
    } catch {
      return '';
    }
  })();
  const isStaff = currentUserRole === 'staff';
  // ==========================================
  
  // 1. STATE FOR FILTERS (Time & Search)
  const [timeFilter, setTimeFilter] = useState<string>('all');
  const [searchText, setSearchText] = useState<string>(''); 
  
  // 2. STATE FOR RAW DATA STORAGE (Fetch API only once)
  const [rawOrders, setRawOrders] = useState<any[]>([]);
  const [rawProducts, setRawProducts] = useState<any[]>([]);
  const [rawIngredients, setRawIngredients] = useState<any[]>([]);

  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [socketConnected, setSocketConnected] = useState<boolean>(false);
  const socketRef = useRef<Socket | null>(null);

  const addNotification = (data: any) => {
    const orderId = data?.id || data?.order?.id || data?.order_code || 'chưa rõ';
    const newNotification: NotificationItem = {
      id: `${Date.now()}-${orderId}`,
      title: 'Đơn hàng mới',
      description: `Mã đơn ${orderId} vừa được tạo.`,
      time: dayjs().format('HH:mm DD/MM/YYYY'),
      orderCode: `#${data?.order_code || orderId}`,
    };

    setNotifications((prev) => [newNotification, ...prev].slice(0, 10));
    setUnreadCount((prev) => prev + 1);
    notification.success({
      message: 'Đơn hàng mới',
      description: `Mã đơn ${orderId}`,
    });

    if ('speechSynthesis' in window) {
      const speech = new SpeechSynthesisUtterance(`Bạn có đơn hàng mới mã số ${orderId}`);
      speech.lang = 'vi-VN';
      window.speechSynthesis.speak(speech);
    }

    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Đơn hàng mới', { body: `Mã đơn ${orderId} vừa được tạo.` });
    } else if ('Notification' in window && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
  };

  useEffect(() => {
    const socket = io(apiHost, {
      transports: ['websocket'],
    });
    socketRef.current = socket;

    socket.on('connect', () => setSocketConnected(true));
    socket.on('disconnect', () => setSocketConnected(false));
    socket.on('new-order', addNotification);

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('new-order');
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (isFetching || rawOrders.length === 0) return;

    const initialData = [...rawOrders]
      .sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime())
      .slice(0, 5)
      .map((order) => ({
        id: order.id || `${order.order_code}-${Math.random()}`,
        title: 'Đơn hàng gần đây',
        description: `Đơn ${order.order_code || `#${order.id}`} từ ${order.customer_name || 'khách lẻ'}`,
        time: order.created_at ? dayjs(order.created_at).format('HH:mm DD/MM/YYYY') : dayjs().format('HH:mm DD/MM/YYYY'),
        orderCode: `#${order.order_code || order.id}`,
      }));

    setNotifications(initialData);
    // keep unreadCount only for new incoming websocket notifications
  }, [rawOrders, isFetching]);

  // States for UI rendering
  const [totalProducts, setTotalProducts] = useState<number>(0); 
  const [totalOrders, setTotalOrders] = useState<number>(0);     
  const [totalIngredients, setTotalIngredients] = useState<number>(0);
  const [lowStockCount, setLowStockCount] = useState<number>(0);
  
  const [totalRevenue, setTotalRevenue] = useState<number>(0);
  const [totalProductValue, setTotalProductValue] = useState<number>(0);
  const [realOrderData, setRealOrderData] = useState<any[]>([]);
  const [realBestSellers, setRealBestSellers] = useState<any[]>([]);
  const [salesActivities, setSalesActivities] = useState<any[]>([]);

  // States for the SVG Chart
  const [chartData, setChartData] = useState<{day: string, value: number, x: number, y: number}[]>([]);
  const [chartMax, setChartMax] = useState<number>(1000000);

  // PHASE 1: FETCH DATA FROM SERVER ON COMPONENT MOUNT
  useEffect(() => {
    const fetchAllDashboardData = async () => {
      setIsFetching(true);
      try {
        const [resIng, resProd, resOrder] = await Promise.all([
          ingredientAPI.getAll().catch(() => []),
          productAPI.getAll().catch(() => []),
          orderAPI.getAll().catch(() => [])
        ]);
        setRawIngredients(Array.isArray(resIng) ? resIng : []);
        setRawProducts(Array.isArray(resProd) ? resProd : []);
        setRawOrders(Array.isArray(resOrder) ? resOrder : []);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsFetching(false);
      }
    };
    fetchAllDashboardData();
  }, []);

  // PHASE 2: PROCESS & FILTER DATA
  useEffect(() => {
    if (isFetching) return;

    setTotalIngredients(rawIngredients.length);
    setLowStockCount(rawIngredients.filter((item: any) => (item.stock_quantity || 0) < 250).length);

    setTotalProducts(rawProducts.length);
    setTotalProductValue(rawProducts.reduce((sum, p) => sum + (Number(p.price) || 0), 0));

    const now = dayjs();
    const filteredOrders = rawOrders.filter(order => {
      if (timeFilter !== 'all' && order.created_at) {
        const orderDate = dayjs(order.created_at);
        if (timeFilter === 'today' && !orderDate.isSame(now, 'day')) return false;
        if (timeFilter === 'this_week' && !orderDate.isSame(now, 'week')) return false;
        if (timeFilter === 'this_month' && !orderDate.isSame(now, 'month')) return false;
      }

      if (searchText.trim() !== '') {
        const query = searchText.toLowerCase();
        const customerName = (order.customer_name || 'khách vãng lai').toLowerCase();
        const orderIdStr = String(order.id || order.order_code || '').toLowerCase();
        
        if (!customerName.includes(query) && !orderIdStr.includes(query)) {
          return false;
        }
      }

      return true;
    });

    setTotalOrders(filteredOrders.length);
    setTotalRevenue(filteredOrders.reduce((sum, order) => {
      if (order.status === 'completed') return sum + (Number(order.total_price) || 0);
      return sum;
    }, 0));

    const sortedOrders = [...filteredOrders].sort((a, b) => 
      new Date(b.created_at || "").getTime() - new Date(a.created_at || "").getTime()
    );

    const top5Orders = sortedOrders.slice(0, 5).map((order) => {
      let statusText = 'Đang xử lý'; let color = 'warning';
      if (order.status === 'completed') { statusText = 'Đã hoàn thành'; color = 'success'; } 
      else if (order.status === 'cancelled') { statusText = 'Đã hủy'; color = 'error'; }
      
      return {
        key: order.id,
        id: `#DH${order.id || order.order_code}`,
        customer: order.customer_name || 'Khách vãng lai',
        total: `${(Number(order.total_price) || 0).toLocaleString()} đ`,
        status: statusText, color: color
      };
    });
    setRealOrderData(top5Orders);

    const activities = sortedOrders.slice(0, 5).map(order => {
      const customer = order.customer_name || 'Khách vãng lai';
      const total = (Number(order.total_price) || 0).toLocaleString() + ' đ';
      
      let text = `Đơn mới: ${customer} vừa đặt hàng trị giá ${total}`;
      if (order.status === 'completed') text = `Hoàn thành: Giao thành công đơn ${total} cho ${customer}`;
      if (order.status === 'cancelled') text = `Đã hủy: ${customer} hủy đơn hàng ${total}`;
      
      let timeStr = 'Vừa xong';
      if (order.created_at) {
          const d = new Date(order.created_at);
          timeStr = `${d.getHours()}h${d.getMinutes().toString().padStart(2, '0')} - ${d.getDate()}/${d.getMonth()+1}`;
      }
      return { text: text, time: timeStr };
    });
    setSalesActivities(activities);

    const productSalesCount: Record<number, number> = {};
    filteredOrders.forEach(order => {
      const status = (order.status || '').toLowerCase();
      if (status === 'completed' || status === 'đã hoàn thành' || status === 'hoàn thành') {
        const items = order.order_items || order.items || [];
        items.forEach((item: any) => {
          const pId = item.product_id;
          if (pId) productSalesCount[pId] = (productSalesCount[pId] || 0) + (item.quantity || 0);
        });
      }
    });

    const bestSellersData = rawProducts.map(product => {
      const totalSold = productSalesCount[product.id] || 0;
      return {
        name: product.name,
        sold: `${totalSold} món`,
        soldCount: totalSold,
        percent: Math.min((totalSold / 50) * 100, 100),
        img: product.image_url || 'https://placehold.co/100x100?text=No+Img' 
      };
    }).filter(item => item.soldCount > 0).sort((a, b) => b.soldCount - a.soldCount).slice(0, 5);
    setRealBestSellers(bestSellersData);

    const last7Days = Array.from({length: 7}).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
    });

    const dailyRevenue: Record<string, number> = {};
    last7Days.forEach(d => dailyRevenue[d] = 0);

    filteredOrders.forEach(order => {
      if (order.status === 'completed' && order.created_at) {
        const orderDate = new Date(order.created_at).toISOString().split('T')[0];
        if (dailyRevenue[orderDate] !== undefined) {
          dailyRevenue[orderDate] += (Number(order.total_price) || 0);
        }
      }
    });

    const maxRev = Math.max(...Object.values(dailyRevenue), 100000); 
    setChartMax(maxRev);

    const xCoords = [50, 170, 290, 410, 530, 650, 770];
    const newChartData = last7Days.map((day, idx) => {
      const val = dailyRevenue[day];
      const y = 220 - (val / maxRev) * 200; 
      const dateObj = new Date(day);
      const dayStr = `${dateObj.getDate()}/${dateObj.getMonth()+1}`;
      return { day: dayStr, value: val, x: xCoords[idx], y: y };
    });
    
    setChartData(newChartData);

  }, [rawOrders, rawProducts, rawIngredients, timeFilter, searchText, isFetching]);

  const generateSmoothCurve = (data: {x: number, y: number}[]) => {
    if (data.length === 0) return '';
    let path = `M ${data[0].x} ${data[0].y}`;
    for (let i = 1; i < data.length; i++) {
      const prev = data[i - 1];
      const curr = data[i];
      const cpX = (prev.x + curr.x) / 2;
      path += ` C ${cpX} ${prev.y}, ${cpX} ${curr.y}, ${curr.x} ${curr.y}`;
    }
    return path;
  };

  const orderColumns = [
    { title: 'Mã đơn hàng', dataIndex: 'id', key: 'id', render: (text: string) => <Text strong style={{ color: '#0f172a' }}>{text}</Text> },
    { title: 'Khách hàng', dataIndex: 'customer', key: 'customer' },
    { title: 'Tổng tiền', dataIndex: 'total', key: 'total' },
    { title: 'Trạng thái', dataIndex: 'status', key: 'status', render: (status: string, record: any) => (<Tag bordered={false} color={record.color} style={{ fontWeight: 500 }}>{status}</Tag>) },
  ];

  if (isFetching) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: THEME.bgPage }}><Spin size="large" tip="Đang đồng bộ dữ liệu..." /></div>;

  return (
    <div style={{ padding: '0 24px 24px 24px', backgroundColor: THEME.bgPage, minHeight: '100vh' }}>
      
      {/* Header Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: `1px solid ${THEME.borderLight}`, marginBottom: '24px' }}>
        <Title level={4} style={{ color: THEME.textDark, margin: 0, fontWeight: 600, fontSize: '18px' }}>Bảng điều khiển hệ thống</Title>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          
          <Input 
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Tìm đơn hàng, khách... Ctrl K" 
            prefix={<SearchOutlined style={{ color: '#94a3b8' }} />} 
            style={{ width: 220, borderRadius: '6px', backgroundColor: '#fff' }} 
            size="small" 
          />
          
          <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => { setModalVisible(true); setUnreadCount(0); }}>
            <Badge count={unreadCount} size="small" style={{ backgroundColor: '#ff4d4f' }}>
              <BellOutlined style={{ fontSize: '18px', color: THEME.textDark }} />
            </Badge>
          </div>
          
          <Select 
            value={timeFilter} 
            onChange={(val) => setTimeFilter(val)} 
            style={{ width: 140 }} 
            size="small"
          >
            <Option value="all">📅 Toàn thời gian</Option>
            <Option value="today">📅 Hôm nay</Option>
            <Option value="this_week">📅 Tuần này</Option>
            <Option value="this_month">📅 Tháng này</Option>
          </Select>
        </div>
      </div>

      {/* Top Statistic Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ borderRadius: '12px', boxShadow: THEME.shadowSubtle }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Space size={12}>
                <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: THEME.lightGreenBg, display: 'flex', justifyContent: 'center', alignItems: 'center' }}><ShoppingOutlined style={{ fontSize: '18px', color: THEME.primaryGreen }} /></div>
                <div><div style={{ fontSize: '12px', color: THEME.textSecondary, marginBottom: '2px' }}>Tổng sản phẩm</div><div style={{ fontSize: '24px', fontWeight: '700', color: THEME.textDark }}>{totalProducts}</div></div>
              </Space>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ borderRadius: '12px', boxShadow: THEME.shadowSubtle }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Space size={12}>
                <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: THEME.lightGreenBg, display: 'flex', justifyContent: 'center', alignItems: 'center' }}><ContainerOutlined style={{ fontSize: '18px', color: THEME.primaryGreen }} /></div>
                <div><div style={{ fontSize: '12px', color: THEME.textSecondary, marginBottom: '2px' }}>Đơn hàng {timeFilter !== 'all' || searchText ? '(Đã lọc)' : ''}</div><div style={{ fontSize: '24px', fontWeight: '700', color: THEME.textDark }}>{totalOrders}</div></div>
              </Space>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ borderRadius: '12px', boxShadow: THEME.shadowSubtle }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Space size={12}>
                <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: THEME.lightGreenBg, display: 'flex', justifyContent: 'center', alignItems: 'center' }}><DollarCircleOutlined style={{ fontSize: '18px', color: THEME.primaryGreen }} /></div>
                <div>
                  <div style={{ fontSize: '12px', color: THEME.textSecondary, marginBottom: '2px' }}>
                    {isStaff ? 'Đơn hàng đã xử lý' : `Doanh thu ${timeFilter !== 'all' || searchText ? '(Đã lọc)' : ''}`}
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: '700', color: THEME.textDark }}>
                    {isStaff ? totalOrders : `${totalRevenue.toLocaleString()} đ`}
                  </div>
                </div>
              </Space>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ borderRadius: '12px', boxShadow: THEME.shadowSubtle }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Space size={12}>
                <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: THEME.lightGreenBg, display: 'flex', justifyContent: 'center', alignItems: 'center' }}><TagOutlined style={{ fontSize: '18px', color: THEME.primaryGreen }} /></div>
                <div>
                  <div style={{ fontSize: '12px', color: THEME.textSecondary, marginBottom: '2px' }}>
                    {isStaff ? 'Nguyên liệu cần nhập' : 'Tổng giá trị thực đơn'}
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: '700', color: THEME.textDark }}>
                    {isStaff ? lowStockCount : `${totalProductValue.toLocaleString()} đ`}
                  </div>
                </div>
              </Space>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Main Content Area */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        
        {/* CHỈ HIỆN BIỂU ĐỒ CHO CHỦ QUÁN */}
        {!isStaff && (
          <Col xs={24} xl={16}>
            <Card bordered={false} style={{ borderRadius: '12px', boxShadow: THEME.shadowSubtle }} title={<Space size={6}><span style={{ fontSize: '15px', fontWeight: 600, color: THEME.textDark }}>Doanh thu 7 ngày qua</span><InfoCircleOutlined style={{ color: '#cbd5e1', fontSize: '13px' }} /></Space>}>
              <div style={{ width: '100%', height: '240px' }}>
                <svg width="100%" height="100%" viewBox="0 0 800 240" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
                  <defs><linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#16a34a" stopOpacity="0.15" /><stop offset="100%" stopColor="#16a34a" stopOpacity="0.00" /></linearGradient></defs>
                  <line x1="45" y1="20" x2="780" y2="20" stroke="#f1f5f9" strokeDasharray="3" />
                  <line x1="45" y1="70" x2="780" y2="70" stroke="#f1f5f9" strokeDasharray="3" />
                  <line x1="45" y1="120" x2="780" y2="120" stroke="#f1f5f9" strokeDasharray="3" />
                  <line x1="45" y1="170" x2="780" y2="170" stroke="#f1f5f9" strokeDasharray="3" />
                  <line x1="45" y1="220" x2="780" y2="220" stroke="#cbd5e1" strokeWidth="1" />
                  <text x="35" y="24" fill="#94a3b8" fontSize="11" textAnchor="end">{(chartMax / 1000).toLocaleString()}k</text>
                  <text x="35" y="74" fill="#94a3b8" fontSize="11" textAnchor="end">{((chartMax * 0.75) / 1000).toLocaleString()}k</text>
                  <text x="35" y="124" fill="#94a3b8" fontSize="11" textAnchor="end">{((chartMax * 0.5) / 1000).toLocaleString()}k</text>
                  <text x="35" y="174" fill="#94a3b8" fontSize="11" textAnchor="end">{((chartMax * 0.25) / 1000).toLocaleString()}k</text>
                  <text x="35" y="224" fill="#94a3b8" fontSize="11" textAnchor="end">0</text>
                  
                  {chartData.length > 0 && <path d={`${generateSmoothCurve(chartData)} L 770 220 L 50 220 Z`} fill="url(#chartGradient)" />}
                  {chartData.length > 0 && <path d={generateSmoothCurve(chartData)} fill="none" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}
                  
                  {chartData.map((d, i) => <circle key={`circle-${i}`} cx={d.x} cy={d.y} r="5" fill="#16a34a" stroke="#fff" strokeWidth="2" />)}
                  {chartData.map((d, i) => <text key={`text-${i}`} x={d.x} y="238" fill="#94a3b8" fontSize="11" textAnchor="middle">{d.day}</text>)}
                </svg>
              </div>
            </Card>
          </Col>
        )}

        <Col xs={24} xl={isStaff ? 24 : 8}>
          <Card bordered={false} style={{ borderRadius: '12px', boxShadow: THEME.shadowSubtle, height: '100%' }} title={<span style={{ fontSize: '15px', fontWeight: 600, color: THEME.textDark }}>{isStaff ? 'Tổng quan hoạt động' : 'Tổng quan dữ liệu kho'}</span>}>
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', gap: '22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Space size={12}>
                  <Avatar size="large" icon={<DollarCircleOutlined />} style={{ backgroundColor: THEME.lightGreenBg, color: THEME.primaryGreen }} />
                  <div>
                    <div style={{ fontSize: '12px', color: THEME.textSecondary }}>{isStaff ? 'Tổng đơn hàng' : 'Doanh thu (Theo bộ lọc)'}</div>
                    <div style={{ fontSize: '15px', fontWeight: '700', color: THEME.textDark }}>{isStaff ? totalOrders : `${totalRevenue.toLocaleString()} đ`}</div>
                  </div>
                </Space>
                <Progress type="circle" percent={totalOrders > 0 ? 100 : 0} width={42} strokeColor={THEME.primaryGreen} strokeWidth={9} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderTop: `1px solid ${THEME.borderLight}`, borderBottom: `1px solid ${THEME.borderLight}` }}>
                <Space size={12}>
                  <Avatar size="large" icon={<ShoppingOutlined />} style={{ backgroundColor: '#eff6ff', color: '#2563eb' }} />
                  <div><div style={{ fontSize: '12px', color: THEME.textSecondary }}>Nguyên liệu đang quản lý</div><div style={{ fontSize: '15px', fontWeight: '700', color: THEME.textDark }}>{totalIngredients} loại</div></div>
                </Space>
                <Progress type="circle" percent={Math.min(totalIngredients * 10, 100)} width={42} strokeColor="#2563eb" strokeWidth={9} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Space size={12}>
                  <Avatar size="large" icon={<TagOutlined />} style={{ backgroundColor: '#fff7ed', color: '#ea580c' }} />
                  <div><div style={{ fontSize: '12px', color: THEME.textSecondary }}>Nguyên liệu sắp hết hàng</div><div style={{ fontSize: '15px', fontWeight: '700', color: '#ef4444' }}>{lowStockCount} loại cần nhập</div></div>
                </Space>
                <Progress type="circle" percent={totalIngredients > 0 ? Math.round((lowStockCount / totalIngredients) * 100) : 0} width={42} strokeColor="#ef4444" strokeWidth={9} />
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        
        {/* Latest Orders Table */}
        <Col xs={24} lg={10}>
          <Card bordered={false} style={{ borderRadius: '12px', boxShadow: THEME.shadowSubtle }} title={<span style={{ fontSize: '14px', fontWeight: 600 }}>Đơn hàng {timeFilter !== 'all' || searchText ? 'mới nhất (Đã lọc)' : 'mới nhất'}</span>}>
            <Table columns={orderColumns} dataSource={realOrderData} pagination={false} size="small" style={{ borderRadius: '8px', overflow: 'hidden' }} locale={{ emptyText: "Không có đơn hàng nào khớp với tìm kiếm" }} />
          </Card>
        </Col>

        {/* Best Sellers Section */}
        <Col xs={24} sm={12} lg={7}>
          <Card bordered={false} style={{ borderRadius: '12px', boxShadow: THEME.shadowSubtle }} title={<span style={{ fontSize: '14px', fontWeight: 600 }}>Sản phẩm bán chạy</span>}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {realBestSellers.length === 0 ? <div style={{ textAlign: 'center', color: THEME.textSecondary, padding: '20px 0' }}>Chưa ghi nhận số liệu</div> : 
                realBestSellers.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img 
                      src={item.img} 
                      alt={item.name} 
                      style={{ width: '36px', height: '36px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0, border: '1px solid #e2e8f0' }} 
                      onError={(e) => { e.currentTarget.src = 'https://placehold.co/100x100?text=Error'; }} 
                    />
                    <div style={{ flex: 1 }}><div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '2px' }}><Text strong style={{ color: '#334155' }}>{item.name}</Text><Text type="success" strong>{item.sold}</Text></div><Progress percent={item.percent} strokeColor={THEME.primaryGreen} showInfo={false} size="small" trailColor="#f1f5f9" strokeWidth={5} /></div>
                  </div>
                ))
              }
            </div>
          </Card>
        </Col>

        {/* Sales Activities Log */}
        <Col xs={24} sm={12} lg={7}>
          <Card bordered={false} style={{ borderRadius: '12px', boxShadow: THEME.shadowSubtle }} title={<span style={{ fontSize: '14px', fontWeight: 600 }}>Hoạt động buôn bán</span>}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '4px 0' }}>
              {salesActivities.length === 0 ? <div style={{ textAlign: 'center', color: THEME.textSecondary, padding: '20px 0' }}>Không có hoạt động nào khớp tìm kiếm</div> : 
                salesActivities.map((act, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <div style={{ marginTop: '7px', width: '6px', height: '6px', borderRadius: '50%', backgroundColor: THEME.primaryGreen, boxShadow: '0 0 0 2px #d1fae5', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}><div style={{ fontSize: '13px', color: THEME.textDark, lineHeight: 1.3 }}>{act.text}</div><div style={{ fontSize: '11px', color: THEME.textSecondary, marginTop: '2px' }}><ClockCircleOutlined /> {act.time}</div></div>
                  </div>
                ))
              }
            </div>
          </Card>
        </Col>
      </Row>

      <Modal
        title="Thông báo đơn hàng"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={560}
      >
        {notifications.length === 0 ? (
          <div style={{ textAlign: 'center', color: THEME.textSecondary, padding: '24px 0' }}>
            Chưa có thông báo đơn hàng mới.
          </div>
        ) : (
          notifications.map((notificationItem) => (
            <div key={notificationItem.id} style={{ padding: '14px 0', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                <div>
                  <Text strong style={{ display: 'block', fontSize: '14px', color: THEME.textDark }}>{notificationItem.title}</Text>
                  <div style={{ marginTop: '6px', color: THEME.textSecondary, fontSize: '13px' }}>{notificationItem.description}</div>
                </div>
                <Text type="secondary" style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>{notificationItem.time}</Text>
              </div>
              {notificationItem.orderCode && (
                <div style={{ marginTop: '10px', fontSize: '13px', color: '#0f172a' }}>{notificationItem.orderCode}</div>
              )}
            </div>
          ))
        )}
      </Modal>

      {/* Footer Connection Status */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', backgroundColor: THEME.lightGreenBg, borderRadius: '10px', marginTop: '24px', boxShadow: '0 2px 8px rgba(22, 163, 74, 0.04)' }}>
        <Text style={{ color: '#047857', fontSize: '13px', fontWeight: 500 }}>🌿 <Text strong style={{ color: '#047857' }}>Trạng thái kết nối</Text> • Đã liên kết thành công các nhánh Kho, Nguyên liệu và Đơn hàng</Text>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ fontSize: '15px', fontWeight: '700', color: '#047857', letterSpacing: '-0.3px' }}>Hệ thống trực tuyến</span><div style={{ backgroundColor: '#d1fae5', padding: '3px 6px', borderRadius: '4px', display: 'flex', alignItems: 'center' }}><ArrowUpOutlined style={{ color: '#047857', fontSize: '12px' }} /></div></div>
      </div>
    </div>
  );
};

export default Dashboard;