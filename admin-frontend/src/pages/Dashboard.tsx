import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Select, Table, Tag, Typography, Space, Progress, Avatar, Spin, Input } from 'antd';
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

// Import API
import { ingredientAPI } from '../api/ingredientAPI'; 
import { productAPI } from '../api/productAPI';
import { orderAPI } from '../api/orderAPI';

const { Title, Text } = Typography;
const { Option } = Select;

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
  const [loading, setLoading] = useState<boolean>(true);
  
  const [totalProducts, setTotalProducts] = useState<number>(0); 
  const [totalOrders, setTotalOrders] = useState<number>(0);     
  const [totalIngredients, setTotalIngredients] = useState<number>(0);
  const [lowStockCount, setLowStockCount] = useState<number>(0);
  
  const [totalRevenue, setTotalRevenue] = useState<number>(0);
  const [totalProductValue, setTotalProductValue] = useState<number>(0);
  const [realOrderData, setRealOrderData] = useState<any[]>([]);
  const [realBestSellers, setRealBestSellers] = useState<any[]>([]);
  const [salesActivities, setSalesActivities] = useState<any[]>([]);

  const [chartData, setChartData] = useState<{day: string, value: number, x: number, y: number}[]>([]);
  const [chartMax, setChartMax] = useState<number>(1000000);

  useEffect(() => {
    const fetchAllDashboardData = async () => {
      try {
        setLoading(true);
        let fetchedProducts: any[] = [];
        let fetchedOrders: any[] = [];

        // 1. Kho nguyên liệu
        try {
          const resIng = await ingredientAPI.getAll();
          if (Array.isArray(resIng)) {
            setTotalIngredients(resIng.length);
            const lowStockItems = resIng.filter((item: any) => (item.stock_quantity || 0) < 250);
            setLowStockCount(lowStockItems.length);
          }
        } catch (e) { console.error(e); }

        // 2. Sản phẩm
        try {
          const resProd = await productAPI.getAll();
          if (Array.isArray(resProd)) {
            fetchedProducts = resProd;
            setTotalProducts(resProd.length);
            const sumValue = resProd.reduce((sum, p) => sum + (Number(p.price) || 0), 0);
            setTotalProductValue(sumValue);
          }
        } catch (e) { console.error(e); }

        // 3. Đơn hàng & Log buôn bán
        try {
          const resOrder = await orderAPI.getAll();
          if (Array.isArray(resOrder)) {
            fetchedOrders = resOrder;
            setTotalOrders(resOrder.length);

            const doanhThu = resOrder.reduce((sum, order) => {
              if (order.status === 'completed') return sum + (Number(order.total_price) || 0);
              return sum;
            }, 0);
            setTotalRevenue(doanhThu);

            const sortedOrders = [...resOrder].sort((a, b) => 
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
          }
        } catch (e) { console.error(e); }

        // 4. Sản phẩm bán chạy
        if (fetchedOrders.length > 0 && fetchedProducts.length > 0) {
          const productSalesCount: Record<number, number> = {};
          
          fetchedOrders.forEach(order => {
            const status = (order.status || '').toLowerCase();
            if (status === 'completed' || status === 'đã hoàn thành' || status === 'hoàn thành') {
              const items = order.order_items || order.items || [];
              items.forEach((item: any) => {
                const pId = item.product_id;
                if (pId) productSalesCount[pId] = (productSalesCount[pId] || 0) + (item.quantity || 0);
              });
            }
          });

          const bestSellersData = fetchedProducts.map(product => {
            const totalSold = productSalesCount[product.id] || 0;
            return {
              name: product.name,
              sold: `${totalSold} món`,
              soldCount: totalSold,
              percent: Math.min((totalSold / 50) * 100, 100),
              img: '🔥' 
            };
          }).filter(item => item.soldCount > 0).sort((a, b) => b.soldCount - a.soldCount).slice(0, 5);
          setRealBestSellers(bestSellersData);
        }

        // 5. Biểu đồ 7 ngày
        const last7Days = Array.from({length: 7}).map((_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - (6 - i));
          return d.toISOString().split('T')[0];
        });

        const dailyRevenue: Record<string, number> = {};
        last7Days.forEach(d => dailyRevenue[d] = 0);

        fetchedOrders.forEach(order => {
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

      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAllDashboardData();
  }, []);

  const orderColumns = [
    { title: 'Mã đơn hàng', dataIndex: 'id', key: 'id', render: (text: string) => <Text strong style={{ color: '#0f172a' }}>{text}</Text> },
    { title: 'Khách hàng', dataIndex: 'customer', key: 'customer' },
    { title: 'Tổng tiền', dataIndex: 'total', key: 'total' },
    { title: 'Trạng thái', dataIndex: 'status', key: 'status', render: (status: string, record: any) => (<Tag bordered={false} color={record.color} style={{ fontWeight: 500 }}>{status}</Tag>) },
  ];

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: THEME.bgPage }}><Spin size="large" tip="Đang đồng bộ dữ liệu..." /></div>;

  return (
    <div style={{ padding: '0 24px 24px 24px', backgroundColor: THEME.bgPage, minHeight: '100vh' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: `1px solid ${THEME.borderLight}`, marginBottom: '24px' }}>
        <Title level={4} style={{ color: THEME.textDark, margin: 0, fontWeight: 600, fontSize: '18px' }}>Bảng điều khiển hệ thống</Title>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <Input placeholder="Tìm nhanh... Ctrl K" prefix={<SearchOutlined style={{ color: '#94a3b8' }} />} style={{ width: 220, borderRadius: '6px', backgroundColor: '#fff' }} size="small" />
          <div style={{ position: 'relative', cursor: 'pointer' }}>
            <BellOutlined style={{ fontSize: '18px', color: THEME.textDark }} />
            <span style={{ position: 'absolute', top: -4, right: -4, width: '14px', height: '14px', backgroundColor: '#ef4444', color: '#fff', fontSize: '9px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold' }}>{lowStockCount}</span>
          </div>
          <Select defaultValue="30-days" style={{ width: 115 }} size="small"><Option value="30-days">📅 Toàn thời gian</Option></Select>
        </div>
      </div>

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
                <div><div style={{ fontSize: '12px', color: THEME.textSecondary, marginBottom: '2px' }}>Đơn hàng</div><div style={{ fontSize: '24px', fontWeight: '700', color: THEME.textDark }}>{totalOrders}</div></div>
              </Space>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ borderRadius: '12px', boxShadow: THEME.shadowSubtle }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Space size={12}>
                <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: THEME.lightGreenBg, display: 'flex', justifyContent: 'center', alignItems: 'center' }}><DollarCircleOutlined style={{ fontSize: '18px', color: THEME.primaryGreen }} /></div>
                <div><div style={{ fontSize: '12px', color: THEME.textSecondary, marginBottom: '2px' }}>Doanh thu thật</div><div style={{ fontSize: '20px', fontWeight: '700', color: THEME.textDark }}>{totalRevenue.toLocaleString()} đ</div></div>
              </Space>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ borderRadius: '12px', boxShadow: THEME.shadowSubtle }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Space size={12}>
                <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: THEME.lightGreenBg, display: 'flex', justifyContent: 'center', alignItems: 'center' }}><TagOutlined style={{ fontSize: '18px', color: THEME.primaryGreen }} /></div>
                <div><div style={{ fontSize: '12px', color: THEME.textSecondary, marginBottom: '2px' }}>Tổng giá trị thực đơn</div><div style={{ fontSize: '20px', fontWeight: '700', color: THEME.textDark }}>{totalProductValue.toLocaleString()} đ</div></div>
              </Space>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
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
                {chartData.length > 0 && <path d={`M 50 ${chartData[0].y} ${chartData.map((d, i) => i > 0 ? `L ${d.x} ${d.y}` : '').join(' ')} L 770 220 L 50 220 Z`} fill="url(#chartGradient)" />}
                {chartData.length > 0 && <path d={`M 50 ${chartData[0].y} ${chartData.map((d, i) => i > 0 ? `L ${d.x} ${d.y}` : '').join(' ')}`} fill="none" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}
                {chartData.map((d, i) => <circle key={`circle-${i}`} cx={d.x} cy={d.y} r="5" fill="#16a34a" stroke="#fff" strokeWidth="2" />)}
                {chartData.map((d, i) => <text key={`text-${i}`} x={d.x} y="238" fill="#94a3b8" fontSize="11" textAnchor="middle">{d.day}</text>)}
              </svg>
            </div>
          </Card>
        </Col>

        <Col xs={24} xl={8}>
          <Card bordered={false} style={{ borderRadius: '12px', boxShadow: THEME.shadowSubtle, height: '100%' }} title={<span style={{ fontSize: '15px', fontWeight: 600, color: THEME.textDark }}>Tổng quan dữ liệu kho</span>}>
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', gap: '22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Space size={12}>
                  <Avatar size="large" icon={<DollarCircleOutlined />} style={{ backgroundColor: THEME.lightGreenBg, color: THEME.primaryGreen }} />
                  <div><div style={{ fontSize: '12px', color: THEME.textSecondary }}>Tổng doanh thu thực</div><div style={{ fontSize: '15px', fontWeight: '700', color: THEME.textDark }}>{totalRevenue.toLocaleString()} đ</div></div>
                </Space>
                <Progress type="circle" percent={totalOrders > 0 ? 100 : 0} width={42} strokeColor={THEME.primaryGreen} strokeWidth={9} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderTop: `1px solid ${THEME.borderLight}`, borderBottom: `1px solid ${THEME.borderLight}` }}>
                <Space size={12}>
                  <Avatar size="large" icon={<ShoppingOutlined />} style={{ backgroundColor: '#eff6ff', color: '#2563eb' }} />
                  <div><div style={{ fontSize: '12px', color: THEME.textSecondary }}>Nguyên liệu đang quản lý</div><div style={{ fontSize: '15px', fontWeight: '700', color: THEME.textDark }}>{totalIngredients} loại nguyên liệu</div></div>
                </Space>
                <Progress type="circle" percent={Math.min(totalIngredients * 10, 100)} width={42} strokeColor="#2563eb" strokeWidth={9} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Space size={12}>
                  <Avatar size="large" icon={<TagOutlined />} style={{ backgroundColor: '#fff7ed', color: '#ea580c' }} />
                  <div><div style={{ fontSize: '12px', color: THEME.textSecondary }}>Nguyên liệu sắp hết hàng</div><div style={{ fontSize: '15px', fontWeight: '700', color: '#ef4444' }}>{lowStockCount} loại cần nhập kho</div></div>
                </Space>
                <Progress type="circle" percent={totalIngredients > 0 ? Math.round((lowStockCount / totalIngredients) * 100) : 0} width={42} strokeColor="#ef4444" strokeWidth={9} />
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={10}>
          <Card bordered={false} style={{ borderRadius: '12px', boxShadow: THEME.shadowSubtle }} title={<span style={{ fontSize: '14px', fontWeight: 600 }}>Đơn hàng mới nhất</span>}>
            <Table columns={orderColumns} dataSource={realOrderData} pagination={false} size="small" style={{ borderRadius: '8px', overflow: 'hidden' }} locale={{ emptyText: "Chưa có đơn hàng nào" }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={7}>
          <Card bordered={false} style={{ borderRadius: '12px', boxShadow: THEME.shadowSubtle }} title={<span style={{ fontSize: '14px', fontWeight: 600 }}>Sản phẩm bán chạy</span>}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {realBestSellers.length === 0 ? <div style={{ textAlign: 'center', color: THEME.textSecondary, padding: '20px 0' }}>Chưa ghi nhận số liệu bán lẻ</div> : 
                realBestSellers.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '18px', backgroundColor: '#f1f5f9', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>{item.img}</span>
                    <div style={{ flex: 1 }}><div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '2px' }}><Text strong style={{ color: '#334155' }}>{item.name}</Text><Text type="success" strong>{item.sold}</Text></div><Progress percent={item.percent} strokeColor={THEME.primaryGreen} showInfo={false} size="small" trailColor="#f1f5f9" strokeWidth={5} /></div>
                  </div>
                ))
              }
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={7}>
          <Card bordered={false} style={{ borderRadius: '12px', boxShadow: THEME.shadowSubtle }} title={<span style={{ fontSize: '14px', fontWeight: 600 }}>Hoạt động buôn bán</span>}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '4px 0' }}>
              {salesActivities.length === 0 ? <div style={{ textAlign: 'center', color: THEME.textSecondary, padding: '20px 0' }}>Chưa có hoạt động giao dịch</div> : 
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

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', backgroundColor: THEME.lightGreenBg, borderRadius: '10px', marginTop: '24px', boxShadow: '0 2px 8px rgba(22, 163, 74, 0.04)' }}>
        <Text style={{ color: '#047857', fontSize: '13px', fontWeight: 500 }}>🌿 <Text strong style={{ color: '#047857' }}>Trạng thái kết nối</Text> • Đã liên kết thành công các nhánh Kho, Nguyên liệu và Đơn hàng</Text>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ fontSize: '15px', fontWeight: '700', color: '#047857', letterSpacing: '-0.3px' }}>Hệ thống trực tuyến</span><div style={{ backgroundColor: '#d1fae5', padding: '3px 6px', borderRadius: '4px', display: 'flex', alignItems: 'center' }}><ArrowUpOutlined style={{ color: '#047857', fontSize: '12px' }} /></div></div>
      </div>
    </div>
  );
};

export default Dashboard;