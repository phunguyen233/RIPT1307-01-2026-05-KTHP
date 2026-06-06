import React, { useEffect, useState } from "react";
import { Table, Button, Modal, Form, Input, Select, Space, message, DatePicker, InputNumber, Tag , Card, Dropdown } from "antd";
import { EyeOutlined, PlusOutlined, ReloadOutlined, UserOutlined, PhoneOutlined, EnvironmentOutlined, MoreOutlined, ShoppingCartOutlined, ClockCircleOutlined, CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";
import dayjs from 'dayjs';
import { orderAPI, Order } from "../api/orderAPI";
import { productAPI } from "../api/productAPI";
import { customerAPI } from "../api/customerAPI";

const Orders = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(false);
    const [query, setQuery] = useState("");
    const [selectedStatus, setSelectedStatus] = useState<'all' | 'pending' | 'completed' | 'cancelled'>('all');
    const [detail, setDetail] = useState<Order | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [customers, setCustomers] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);

    // add order form state
    const [selectedCustomer, setSelectedCustomer] = useState<number | undefined>(undefined);
    // recipient name removed from schema
    const [recipientPhone, setRecipientPhone] = useState("");
    const [recipientAddress, setRecipientAddress] = useState("");
    const [deliveryTime, setDeliveryTime] = useState<string | null>(null);
    const [orderItems, setOrderItems] = useState<Array<{ ma_san_pham: number; ten_san_pham?: string; so_luong: number; don_gia: number }>>([]);
    const [selectedProduct, setSelectedProduct] = useState<number | undefined>(undefined);

    // Use enum values from your DB: 'pending','completed','cancelled'
    const statusLabels: Record<string, string> = {
        pending: "Đang chờ",
        completed: "Hoàn thành",
        cancelled: "Đã hủy",
    };

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const data = await orderAPI.getAll();
            setOrders(data);
        } catch (err) {
            console.error(err);
            alert("Lỗi khi lấy đơn hàng");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        try {
            const data = await customerAPI.getAll();
            setCustomers(data);
        } catch (err) {
            console.error('Lỗi khi lấy khách hàng', err);
        }
    };

    const fetchProducts = async () => {
        try {
            const data = await productAPI.getAll();
            setProducts(data);
        } catch (err) {
            console.error('Lỗi khi lấy sản phẩm', err);
        }
    };

    const handleReloadPage = async () => {
        await Promise.all([fetchOrders(), fetchCustomers(), fetchProducts()]);
    };

    const handleSearch = async () => {
        try {
            const res = await orderAPI.search(query);
            setOrders(res);
        } catch (err) {
            console.error(err);
            alert("Lỗi tìm kiếm");
        }
    };

    const columns = [
        {
    title: "Mã đơn",
    dataIndex: "order_code",
    key: "order_code",
    render: (_: any, record: any) => {
        const statusConfig: any = {
            pending: {
                color: "#faad14",
                bg: "#fff7e6",
                text: "Chờ xác nhận"
            },
            completed: {
                color: "#22aa44",
                bg: "#f6ffed",
                text: "Đã hoàn thành"
            },
            cancelled: {
                color: "#ff4d4f",
                bg: "#fff1f0",
                text: "Đã hủy"
            }
        };

        const current =
            statusConfig[record.status] ||
            statusConfig.pending;

        return (
            <div>
                <div
                    style={{
                        fontSize: 15,
                        fontWeight: 700,
                        color: "#111827"
                    }}
                >
                    {record.order_code}
                </div>

                <div
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        marginTop: 6,
                        padding: "4px 12px",
                        borderRadius: 20,
                        background: current.bg,
                        color: current.color,
                        fontWeight: 600,
                        fontSize: 13
                    }}
                >
                    ● {current.text}
                </div>
            </div>
        );
    }
},
        {
    title: "Khách hàng",
    key: "customer",
    width: 220,
    render: (_: any, record: any) => (
        <div>
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 8
                }}
            >
                <UserOutlined
                    style={{
                        color: "#6b7280"
                    }}
                />

                <span
                    style={{
                        fontWeight: 500
                    }}
                >
                    {record.customer_name || "N/A"}
                </span>
            </div>

            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    color: "#6b7280"
                }}
            >
                <PhoneOutlined />

                <span>
                    {record.customer_phone || "N/A"}
                </span>
            </div>
        </div>
    ),
},
        {
            title: "Thời gian nhận",
            dataIndex: "delivery_time",
            key: "delivery_time",
            render: (date: string) => date ? new Date(date).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }) : "Chưa xác định",
        },
        {
    title: "Địa chỉ",
    dataIndex: "shipping_address",
    key: "shipping_address",
    width: 250,
    render: (address: string) => (
        <div>
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 8
                }}
            >
                <EnvironmentOutlined
                    style={{
                        color: "#6b7280"
                    }}
                />

                <span>{address}</span>
            </div>

            <div
                style={{
                    color: "#6b7280"
                }}
            >
                Hà Nội, Việt Nam
            </div>
        </div>
    )
},
        {
            title: " ",
            dataIndex: "total_price",
            key: "total_price",
           render: (amount: number) => (
    <div>
        <div
            style={{
                color: "#22aa44",
                fontSize: 15,
                fontWeight: 500
            }}
        >
            {amount?.toLocaleString("vi-VN")}₫
        </div>

        <div
            style={{
                color: "#6b7280",
                fontSize: 10
            }}
        >
            COD
        </div>
    </div>
),
        },
        
{
  title: " ",
  key: "action",
  render: (_: any, record: Order) => (
    <Space>
      {/* Nút xem chi tiết */}
      <Button
        type="link"
        icon={<EyeOutlined />}
        onClick={() => handleViewDetail(record)}
      >
        Xem chi tiết
      </Button>

      {/* Nút 3 chấm */}
      <Dropdown
        menu={{
          items: [
            {
              key: "pending",
              label: "Chờ xử lý",
            },
            {
              key: "completed",
              label: "Hoàn thành",
            },
            {
              key: "cancelled",
              label: "Đã hủy",
            },
          ],
          onClick: async ({ key }) => {
            try {
              await orderAPI.updateStatus(record.id!, key);
              message.success("Cập nhật trạng thái thành công");
              fetchOrders();
            } catch {
              message.error("Cập nhật thất bại");
            }
          },
        }}
        trigger={["click"]}
      >
        <Button
          icon={<MoreOutlined />}
          shape="circle"
        />
      </Dropdown>
    </Space>
  ),
},
    ];

    const openAddModal = async () => {
        await Promise.all([fetchCustomers(), fetchProducts()]);
        setSelectedCustomer(undefined);
        setRecipientPhone("");
        setRecipientAddress("");
        setDeliveryTime(null);
        setOrderItems([]);
        setShowAddModal(true);
    };

    const addProductLine = (productId: number) => {
        const p = products.find((x) => x.ma_san_pham === productId || x.id === productId);
        if (!p) return;
        const existing = orderItems.find((it) => it.ma_san_pham === (p.ma_san_pham || p.id));
        if (existing) {
            setOrderItems(orderItems.map(it => it.ma_san_pham === existing.ma_san_pham ? { ...it, so_luong: it.so_luong + 1 } : it));
        } else {
            setOrderItems([...orderItems, { ma_san_pham: p.ma_san_pham || p.id, ten_san_pham: p.ten_san_pham || p.ten_san_pham || p.ten_san_pham, so_luong: 1, don_gia: Number(p.gia_ban || p.gia || p.price || 0) }]);
        }
    };

    const removeProductLine = (ma_san_pham: number) => {
        setOrderItems(orderItems.filter(it => it.ma_san_pham !== ma_san_pham));
    };

    const setQtyFor = (ma_san_pham: number, qty: number) => {
        if (qty <= 0) return removeProductLine(ma_san_pham);
        setOrderItems(orderItems.map(it => it.ma_san_pham === ma_san_pham ? { ...it, so_luong: qty } : it));
    };

    const handleAddOrderSubmit = async (values: any) => {
        if (orderItems.length === 0) {
            message.error("Vui lòng thêm ít nhất một sản phẩm");
            return;
        }
        if (!recipientAddress.trim()) {
            message.error("Vui lòng nhập địa chỉ giao");
            return;
        }

        try {
            const totalPrice = orderItems.reduce((total, item) => total + (item.so_luong * item.don_gia), 0);

            const orderData = {
                customer_id: selectedCustomer || null,
                shipping_address: recipientAddress,
                total_price: totalPrice,
                status: 'pending',
                delivery_time: deliveryTime ? dayjs(deliveryTime).toISOString() : null,
                order_items: orderItems.map(item => ({
                    product_id: item.ma_san_pham,
                    quantity: item.so_luong,
                    price: item.don_gia,
                }))
            };

            await orderAPI.create(orderData);
            message.success("Tạo đơn hàng thành công!");
            setShowAddModal(false);
            // Reset form
            setSelectedCustomer(undefined);
            setRecipientPhone("");
            setRecipientAddress("");
            setOrderItems([]);
            fetchOrders();
        } catch (error: any) {
            console.error("Lỗi khi tạo đơn hàng:", error);
            const errorMsg = error?.response?.data?.error || error?.message || 'Lỗi khi tạo đơn hàng!';
            message.error(errorMsg);
        }
    };

    const computeTotal = () => orderItems.reduce((s, it) => s + (it.so_luong || 0) * (it.don_gia || 0), 0);

    const handleViewDetail = async (orderOrId: Order | number) => {
        const id = typeof orderOrId === 'number' ? orderOrId : orderOrId.id || 0;
        if (!id) return;
        try {
            const data = await orderAPI.getById(id);
            setDetail(data);
        } catch (err) {
            console.error(err);
            alert("Lỗi khi lấy chi tiết");
        }
    };

    // client-side filter based on selectedStatus (creation date YYYY-MM-DD)
    const displayedOrders = orders.filter(o => {
        if (selectedStatus !== 'all' && o.status !== selectedStatus) return false;
        return true;
    });
    const totalOrders = orders.length;

    const pendingOrders = orders.filter(
        order => order.status === "pending"
    ).length;

    const completedOrders = orders.filter(
        order => order.status === "completed"
    ).length;

    const cancelledOrders = orders.filter(
        order => order.status === "cancelled"
    ).length;
    return (
        <Card
        bordered={false}
        style={{
            borderRadius: 20,
            boxShadow: "0 4px 20px rgba(0,0,0,0.06)"
        }}
        >
        

        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h2 style={{ fontSize: 24, fontWeight: 'bold', color: '#111', margin: 0 }}
                    >
                        Quản lý đơn hàng</h2>
                <Space>
                    <Button icon={<ReloadOutlined />} onClick={handleReloadPage}>
                        Tải lại
                    </Button>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={openAddModal}
                        style= {{   
                            background: "#22aa44",
                            borderColor: "#22aa44",
                            borderRadius: 10,
                            fontWeight: 600
                        }}
                    >
                        Thêm đơn hàng
                    </Button>
                </Space>
            </div>

            <div style={{ 
                marginBottom: 24,
                display: 'flex',
                gap: 12,
                padding: 20,
                background: '#fafafa',
                borderRadius: 16,
                }}>
                <Input
                    placeholder="Tìm kiếm theo mã, khách, sản phẩm..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onPressEnter={handleSearch}
                    style={{ 
                        width: 350,
                        borderRadius: 10
                    }}
                />
                <Button onClick={handleSearch}>Tìm</Button>
                <Select
                    value={selectedStatus}
                    onChange={(value) => setSelectedStatus(value)}
                    style={{ width: 150 }}
                >
                    <Select.Option value="all">Tất cả</Select.Option>
                    <Select.Option value="pending">Đang chờ</Select.Option>
                    <Select.Option value="completed">Hoàn thành</Select.Option>
                    <Select.Option value="cancelled">Đã hủy</Select.Option>
                </Select>
            </div>
            {/* Thống kê đơn hàng */}
{/* Stats Cards */}
<div
  style={{
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 20,
    marginBottom: 32,
  }}
>
  {/* Card 1 */}
  <div
    style={{
      backgroundColor: "#fff",
      padding: "12px 20px",
      borderRadius: 16,
      display: "flex",
      alignItems: "center",
      gap: 16,
      border: "1px solid #f3f4f6",
      boxShadow:
        "0 4px 6px -1px rgba(0,0,0,0.02), 0 2px 4px -2px rgba(0,0,0,0.02)",
    }}
  >
    <div
      style={{
        width: 40,
        height: 40,
        borderRadius: "50%",
        backgroundColor: "#f0fdf4",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <ShoppingCartOutlined
        style={{
          fontSize: 20,
          color: "#16a34a",
        }}
      />
    </div>

    <div>
      <div
        style={{
          color: "#6b7280",
          fontSize: 13,
          fontWeight: 500,
          textTransform: "uppercase",
        }}
      >
        Tổng đơn hàng
      </div>

      <div
        style={{
          color: "#111",
          fontSize: 24,
          fontWeight: 700,
          marginTop: 4,
        }}
      >
        {totalOrders}
      </div>
    </div>
  </div>

  {/* Card 2 */}
  <div
    style={{
      backgroundColor: "#fff",
      padding: "12px 20px",
      borderRadius: 16,
      display: "flex",
      alignItems: "center",
      gap: 16,
      border: "1px solid #f3f4f6",
      boxShadow:
        "0 4px 6px -1px rgba(0,0,0,0.02), 0 2px 4px -2px rgba(0,0,0,0.02)",
    }}
  >
    <div
      style={{
        width: 40,
        height: 40,
        borderRadius: "50%",
        backgroundColor: "#fff7ed",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <ClockCircleOutlined
        style={{
          fontSize: 20,
          color: "#f97316",
        }}
      />
    </div>

    <div>
      <div
        style={{
          color: "#6b7280",
          fontSize: 13,
          fontWeight: 500,
          textTransform: "uppercase",
        }}
      >
        Chờ xử lý
      </div>

      <div
        style={{
          color: "#111",
          fontSize: 24,
          fontWeight: 700,
          marginTop: 4,
        }}
      >
        {pendingOrders}
      </div>
    </div>
  </div>

  {/* Card 3 */}
  <div
    style={{
      backgroundColor: "#fff",
      padding: "12px 20px",
      borderRadius: 16,
      display: "flex",
      alignItems: "center",
      gap: 16,
      border: "1px solid #f3f4f6",
      boxShadow:
        "0 4px 6px -1px rgba(0,0,0,0.02), 0 2px 4px -2px rgba(0,0,0,0.02)",
    }}
  >
    <div
      style={{
        width: 40,
        height: 40,
        borderRadius: "50%",
        backgroundColor: "#f0fdf4",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <CheckCircleOutlined
        style={{
          fontSize: 20,
          color: "#16a34a",
        }}
      />
    </div>

    <div>
      <div
        style={{
          color: "#6b7280",
          fontSize: 13,
          fontWeight: 500,
          textTransform: "uppercase",
        }}
      >
        Hoàn thành
      </div>

      <div
        style={{
          color: "#111",
          fontSize: 24,
          fontWeight: 700,
          marginTop: 4,
        }}
      >
        {completedOrders}
      </div>
    </div>
  </div>

  {/* Card 4 */}
  <div
    style={{
      backgroundColor: "#fff",
      padding: "12px 20px",
      borderRadius: 16,
      display: "flex",
      alignItems: "center",
      gap: 16,
      border: "1px solid #f3f4f6",
      boxShadow:
        "0 4px 6px -1px rgba(0,0,0,0.02), 0 2px 4px -2px rgba(0,0,0,0.02)",
    }}
  >
    <div
      style={{
        width: 40,
        height: 40,
        borderRadius: "50%",
        backgroundColor: "#fef2f2",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <CloseCircleOutlined
        style={{
          fontSize: 20,
          color: "#ef4444",
        }}
      />
    </div>

    <div>
      <div
        style={{
          color: "#6b7280",
          fontSize: 13,
          fontWeight: 500,
          textTransform: "uppercase",
        }}
      >
        Đã hủy
      </div>

      <div
        style={{
          color: "#111",
          fontSize: 24,
          fontWeight: 700,
          marginTop: 4,
        }}
      >
        {cancelledOrders}
      </div>
    </div>
  </div>
</div>

            <Table
                columns={columns}
                dataSource={displayedOrders}
                rowKey="id"
                loading={loading}
                pagination={{ 
                    pageSize: 10,
                    showSizeChanger: false 
                }}
                bordered={false}
            />

            {/* Order Detail Modal */}
            {/* Order Detail Modal */}
            <Modal
                open={!!detail}   
                onCancel={() => setDetail(null)}    
                footer={null}
                width={800}
            >
                {detail && (
                    <div style={{ padding: 10 }}>

                        {/* Header */}
                        <div
                            style={{                   
                                display: "flex",                    
                                justifyContent: "space-between",                   
                                alignItems: "center",         
                                marginBottom: 10
                            }}
                        >
                            <h2 style={{ margin: 0 }}>                    
                                Chi tiết đơn hàng
                            </h2>

                            <Space>
                                <Select
                                    value={detail.status}                        
                                    style={{ width: 180 }}                        
                                    onChange={async (value) => {
                                        try {                                
                                            await orderAPI.updateStatus(detail.id!, value);                               
                                            message.success("Cập nhật thành công");
                                            fetchOrders();
                                            const updated =
                                                await orderAPI.getById(detail.id!);
                                            setDetail(updated);
                                        } catch {
                                            message.error("Lỗi cập nhật");
                                        }
                                    }}
                                >
                                    <Select.Option value="pending">
                                        Đang chờ
                                    </Select.Option>
                                    <Select.Option value="completed">
                                        Hoàn thành
                                    </Select.Option>
                                    <Select.Option value="cancelled">
                                        Đã hủy
                                    </Select.Option>
                                </Select>
                            </Space>
                        </div>

                        {/* Thông tin đơn */}
                        <Card style={{ marginBottom: 20 }}>
                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "1fr 1fr 1fr 1fr",
                                    gap: 20
                                }}
                            >
                                <div>
                                    <div>Mã đơn hàng</div>

                                    <h2>
                                        {detail.order_code || detail.id}
                                    </h2>

                                    <Tag color="green">
                                        {statusLabels[detail.status || "pending"]}
                                    </Tag>
                                </div>

                                <div>
                                    <div>Thời gian đặt hàng</div>

                                    <b>
                                        {new Date(
                                            detail.created_at || ""
                                        ).toLocaleString("vi-VN")}
                                    </b>
                                </div>

                                <div>
                                    <div>Thanh toán</div>

                                    <b>COD</b>
                                </div>

                                <div>
                                    <div>Vận chuyển</div>
                                    <b>Giao hàng nhanh</b>
                                </div>
                            </div>
                        </Card>

                        {/* Khách hàng + Tổng tiền */}
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "2fr 1fr",
                                gap: 20,
                                marginBottom: 20
                            }}
                        >
                            <Card title="Thông tin khách hàng">
                                <p>
                                    <b>Tên khách:</b>{" "}
                                    {customers.find(
                                        c => c.id === detail.customer_id
                                    )?.name || "N/A"}
                                </p>

                                <p>
                                    <b>SĐT:</b>{" "}
                                    {customers.find(
                                        c => c.id === detail.customer_id
                                    )?.phone || "N/A"}
                                </p>

                                <p>
                                    <b>Địa chỉ:</b>{" "}
                                    {detail.shipping_address}
                                </p>
                            </Card>

                            <Card title="Thông tin đơn hàng">
                                <p>
                                    Tạm tính:
                                    <b style={{ float: "right" }}>
                                        {detail.total_price?.toLocaleString("vi-VN")}₫
                                    </b>
                                </p>

                                <p>
                                    Phí ship:
                                    <b style={{ float: "right" }}>
                                        0₫
                                    </b>
                                </p>

                                <hr />

                                <p
                                    style={{
                                        fontSize: 18,
                                        color: "red",
                                        fontWeight: 700
                                    }}
                                >
                                    Tổng cộng:
                                    <span style={{ float: "right" }}>
                                        {detail.total_price?.toLocaleString("vi-VN")}₫
                                    </span>
                                </p>
                            </Card>
                        </div>

                        {/* Sản phẩm */}
                        <Card
                            title="Sản phẩm đã đặt"
                            style={{ marginBottom: 20 }}
                        >
                        <Table
                            pagination={false}
                            dataSource={detail.order_items || []}
                            rowKey="id"
                            columns={[
                                {
                                    title: "Tên sản phẩm",
                                    dataIndex: "product_name"
                                },
                                {
                                    title: "Đơn giá",
                                    dataIndex: "price",
                                    render: (v: number) =>
                                    v?.toLocaleString("vi-VN") + "₫"
                                },
                                {
                                    title: "Số lượng",
                                    dataIndex: "quantity"
                                },
                                {
                                    title: "Thành tiền",
                                    render: (_: any, row: any) =>
                                        (
                                            row.quantity *
                                            row.price
                                        ).toLocaleString("vi-VN") + "₫"
                                }
                            ]}
                        />
                    </Card>

                    {/* Lịch sử */}
                    <Card title="Lịch sử đơn hàng">
                        <div style={{ padding: 10 }}>
                            <p>
                                ✅ Đơn hàng được tạo
                            </p>

                            <p>
                                🕒 {new Date(
                                    detail.created_at || ""
                                ).toLocaleString("vi-VN")}
                            </p>

                            <p>
                                📦 Trạng thái hiện tại:
                                <b>
                                    {" "}
                                    {statusLabels[
                                        detail.status || "pending"
                                    ]}
                                </b>
                            </p>
                        </div>
                    </Card>

                </div>
            )}
        </Modal>

            {/* Add Order Modal */}
            <Modal
                title="Thêm đơn hàng mới"
                open={showAddModal}
                onCancel={() => setShowAddModal(false)}
                footer={null}
                width={800}
            >
                <Form onFinish={handleAddOrderSubmit} layout="vertical">
                    <Form.Item
                        label="Chọn khách hàng"
                        name="customer_id"
                    >
                        <Select
                            value={selectedCustomer}
                            onChange={(value) => {
                                setSelectedCustomer(value);
                                // Tự động điền số điện thoại khi chọn khách
                                const customer = customers.find(c => c.id === value);
                                if (customer) {
                                    setRecipientPhone(customer.phone || "");
                                }
                            }}
                            placeholder="Chọn khách hàng (không bắt buộc)"
                            allowClear
                        >
                            {customers.map((customer) => (
                                <Select.Option key={customer.id} value={customer.id}>
                                    {customer.name} - {customer.phone}
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item
                        label="Số điện thoại khách"
                        name="phone"
                    >
                        <Input
                            value={recipientPhone}
                            onChange={(e) => setRecipientPhone(e.target.value)}
                            placeholder="Số điện thoại"
                        />
                    </Form.Item>

                    <Form.Item
                        label="Thời gian giao"
                        name="delivery_time"
                    >
                        <DatePicker
                            showTime
                            format="YYYY-MM-DD HH:mm:ss"
                            value={deliveryTime ? dayjs(deliveryTime) : null}
                            onChange={(date, dateString) => setDeliveryTime(dateString)}
                            placeholder="Chọn thời gian giao"
                            style={{ width: '100%' }}
                        />
                    </Form.Item>

                    <Form.Item
                        label="Địa chỉ giao"
                        name="address"
                        rules={[{ required: true, message: 'Vui lòng nhập địa chỉ giao' }]}
                    >
                        <Input.TextArea
                            value={recipientAddress}
                            onChange={(e) => setRecipientAddress(e.target.value)}
                            placeholder="Địa chỉ giao hàng"
                            rows={3}
                        />
                    </Form.Item>

                    <div style={{ border: '1px solid #d9d9d9', padding: '16px', marginBottom: '16px', borderRadius: '6px' }}>
                        <h4>Sản phẩm trong đơn</h4>
                        {orderItems.map((item, index) => (
                            <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                <span>{item.ten_san_pham}</span>
                                <InputNumber
                                    min={1}
                                    value={item.so_luong}
                                    onChange={(value) => {
                                        const newItems = [...orderItems];
                                        newItems[index].so_luong = value || 1;
                                        setOrderItems(newItems);
                                    }}
                                    style={{ width: '80px' }}
                                />
                                <span>x {item.don_gia.toLocaleString("vi-VN")}₫</span>
                                <span>= {(item.so_luong * item.don_gia).toLocaleString("vi-VN")}₫</span>
                                <Button
                                    type="link"
                                    danger
                                    onClick={() => {
                                        setOrderItems(orderItems.filter((_, i) => i !== index));
                                    }}
                                >
                                    Xóa
                                </Button>
                            </div>
                        ))}

                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '16px' }}>
                            <Select
                                placeholder="Chọn sản phẩm"
                                style={{ flex: 1 }}
                                value={selectedProduct}
                                onChange={(value) => setSelectedProduct(value)}
                            >
                                {products.map((product) => (
                                    <Select.Option key={product.id} value={product.id}>
                                        {product.name} - {product.price.toLocaleString("vi-VN")}₫
                                    </Select.Option>
                                ))}
                            </Select>
                            <Button 
                                type="primary" 
                                onClick={() => {
                                    if (selectedProduct) {
                                        const product = products.find(p => p.id === selectedProduct);
                                        if (product) {
                                            const existingItem = orderItems.find(item => item.ma_san_pham === selectedProduct);
                                            if (existingItem) {
                                                setOrderItems(orderItems.map(item =>
                                                    item.ma_san_pham === selectedProduct
                                                        ? { ...item, so_luong: item.so_luong + 1 }
                                                        : item
                                                ));
                                            } else {
                                                setOrderItems([...orderItems, {
                                                    ma_san_pham: selectedProduct,
                                                    ten_san_pham: product.name,
                                                    so_luong: 1,
                                                    don_gia: product.price
                                                }]);
                                            }
                                            setSelectedProduct(undefined);
                                        }
                                    }
                                }}
                            >
                                Thêm sản phẩm
                            </Button>
                        </div>
                    </div>

                    <div style={{ textAlign: 'right', fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>
                        Tổng tiền: {orderItems.reduce((total, item) => total + (item.so_luong * item.don_gia), 0).toLocaleString("vi-VN")}₫
                    </div>

                    <Form.Item>
                        <Button type="primary" htmlType="submit" loading={loading}>
                            Tạo đơn hàng
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
        </Card>
    );
}

export default Orders;
