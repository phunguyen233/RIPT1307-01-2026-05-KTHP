import { useEffect, useState } from "react";
import { Table, Button, Modal, Form, Input, Select, Upload, Switch, Space, Image, message } from "antd";
import { UploadOutlined, EditOutlined, DeleteOutlined, PlusOutlined, ReloadOutlined, EyeOutlined, FilterOutlined, AppstoreOutlined, ShoppingOutlined, InboxOutlined, ArrowUpOutlined, ArrowDownOutlined, SearchOutlined } from "@ant-design/icons";
import { productAPI } from "../api/productAPI";
import { categoryAPI, Category } from "../api/categoryAPI";
import { Product } from "../types/Product";
import axiosClient from "../api/axiosClient";

const { Option } = Select;

export default function Products() {
  // Product states
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<string | number>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [formData, setFormData] = useState<Product>({
    name: "",
    price: 0,
    cost_price: 0,
    description: "",
    image_url: "",
    category_id: undefined,
    is_active: true,
    image_base64: "",
  });
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [productFieldErrors, setProductFieldErrors] = useState<{ name?: string; price?: string; }>({});

  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoriesError, setCategoriesError] = useState("");
  const [form] = Form.useForm();

  // Lấy danh sách sản phẩm
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await productAPI.getAll();
      setProducts(data);
    } catch (error) {
      console.error("Lỗi khi lấy sản phẩm:", error);
      alert("Lỗi khi lấy danh sách sản phẩm!");
    } finally {
      setLoading(false);
    }
  };

  // Lấy danh sách phân loại
  const fetchCategories = async () => {
    try {
      setCategoriesLoading(true);
      setCategoriesError("");
      const data = await categoryAPI.getAll();
      setCategories(data);
    } catch (error) {
      console.error("Lỗi khi lấy phân loại:", error);
      setCategoriesError("Không thể tải danh mục");
    } finally {
      setCategoriesLoading(false);
    }
  };

  const handleReloadPage = async () => {
    await Promise.all([fetchProducts(), fetchCategories()]);
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  // ===== Product Functions =====
  const handleAddProductClick = () => {
    setEditingProductId(null);
    const newForm = {
      name: "",
      price: 0,
      cost_price: 0,
      description: "",
      image_url: "",
      category_id: undefined,
      is_active: true,
    };
    setFormData(newForm as Product);
    form.resetFields();
    form.setFieldsValue(newForm);
    setPreview(null);
    setShowProductForm(true);
  };

  const handleEditProductClick = (product: Product) => {
    setEditingProductId(product.id || null);
    setFormData(product);
    form.setFieldsValue(product);
    setPreview(product.image_url || null);
    setShowProductForm(true);
  };

  const handleDeleteProduct = async (id: number) => {
    if (window.confirm("Bạn chắc chắn muốn xóa sản phẩm này?")) {
      try {
        await productAPI.delete(id);
        alert("Xóa sản phẩm thành công!");
        fetchProducts();
      } catch (error) {
        console.error("Lỗi khi xóa sản phẩm:", error);
        alert("Lỗi khi xóa sản phẩm!");
      }
    }
  };

  const handleToggleProductVisibility = async (id: number) => {
    try {
      const product = products.find(p => p.id === id);
      if (product) {
        await productAPI.update(id, { ...product, is_active: !product.is_active });
        fetchProducts();
      }
    } catch (err) {
      console.error('Lỗi khi đổi trạng thái sản phẩm', err);
      alert('Lỗi khi đổi trạng thái sản phẩm');
    }
  };

  const handleProductInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: (name === "price" || name === "cost_price") ? parseFloat(value) || 0 : value,
    });
  };

  const handleProductTextAreaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleProductSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value ? parseInt(value) : undefined,
    });
  };

  const handleProductSubmit = async (values: any) => {
    try {
      setUploading(true);
      const productData = {
        ...formData,
        ...values,
        price: Number(values.price),
        cost_price: Number(values.cost_price || 0),
        is_active: values.is_active !== false,
        image_base64: formData.image_base64,
      };

      if (editingProductId) {
        if (formData.image_base64) {
          await productAPI.updateWithImage(editingProductId, productData);
        } else {
          await productAPI.update(editingProductId, productData);
        }
        message.success("Cập nhật sản phẩm thành công!");
      } else {
        if (formData.image_base64) {
          await productAPI.createWithImage(productData);
        } else {
          await productAPI.create(productData);
        }
        message.success("Thêm sản phẩm thành công!");
      }

      setShowProductForm(false);
      setFormData({
        name: "",
        price: 0,
        cost_price: 0,
        description: "",
        image_url: "",
        category_id: undefined,
        is_active: true,
        image_base64: "",
      });
      setPreview(null);
      fetchProducts();
    } catch (error) {
      console.error("Lỗi khi lưu sản phẩm:", error);
      message.error("Lỗi khi lưu sản phẩm!");
    } finally {
      setUploading(false);
    }
  };

  // Get category name by id
  const getCategoryName = (categoryId: number | undefined) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.name || "Không phân loại";
  };

  const getCategoryColor = (categoryId: number | undefined) => {
    if (!categoryId) return { bg: '#f3f4f6', color: '#4b5563' };
    const colors = [
      { bg: '#ffedd5', color: '#ea580c' },
      { bg: '#dcfce7', color: '#16a34a' },
      { bg: '#dbeafe', color: '#2563eb' },
      { bg: '#f3e8ff', color: '#9333ea' },
      { bg: '#fce7f3', color: '#db2777' }
    ];
    return colors[categoryId % colors.length];
  };

  // Lọc sản phẩm dựa trên tìm kiếm và các bộ lọc
  const filteredProducts = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        p.id?.toString().includes(searchTerm) ||
                        p.product_code?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchCategory = filterCategory === "all" || p.category_id === filterCategory;
    
    let matchStatus = true;
    if (filterStatus === "active") matchStatus = p.is_active === true;
    if (filterStatus === "hidden") matchStatus = p.is_active === false;

    return matchSearch && matchCategory && matchStatus;
  });

  const columns = [
    {
      title: 'Sản phẩm',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: Product) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '8px 0' }}>
          <div 
            style={{ 
              width: 60, height: 60, minWidth: 60, minHeight: 60,
              backgroundColor: '#f9fafb', borderRadius: 12, 
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid #f3f4f6', padding: 6, boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}
          >
            {record.image_url ? (
               <img 
                 src={record.image_url} 
                 alt={text} 
                 style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 8 }} 
               />
            ) : (
               <div style={{ color: '#d1d5db', fontSize: 20 }}>📦</div>
            )}
          </div>
          <div>
            <div style={{ fontWeight: 'bold', color: '#1f2937', fontSize: 15 }}>{text}</div>
            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4, textTransform: 'uppercase', fontWeight: 500 }}>
              {record.product_code || `SP00${record.id}`}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Danh mục',
      dataIndex: 'category_id',
      key: 'category_id',
      render: (categoryId: number) => {
         const name = getCategoryName(categoryId);
         const colorInfo = getCategoryColor(categoryId);
         return (
           <span style={{ 
             backgroundColor: colorInfo.bg, color: colorInfo.color,
             padding: '4px 12px', borderRadius: 6, fontSize: 13, fontWeight: 500
           }}>
             {name}
           </span>
         );
      },
    },
    {
      title: 'Giá bán',
      dataIndex: 'price',
      key: 'price',
      render: (price: number) => (
        <span style={{ fontWeight: 600, color: '#1f2937', fontSize: 14 }}>
          {price.toLocaleString("vi-VN")}đ
        </span>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'is_active',
      key: 'is_active',
      align: 'center' as const,
      render: (isActive: boolean, record: Product) => (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: isActive !== false ? '#f0fdf4' : '#fef2f2', padding: '6px 12px', borderRadius: 20 }}>
           <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: isActive !== false ? '#16a34a' : '#ef4444' }}></div>
           <span style={{ color: isActive !== false ? '#16a34a' : '#ef4444', fontSize: 13, fontWeight: 500 }}>
             {isActive !== false ? 'Đang bán' : 'Hết hàng'}
           </span>
        </div>
      ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      align: 'center' as const,
      render: (_: any, record: Product) => (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          <Button 
            icon={<EditOutlined style={{ color: '#16a34a' }} />} 
            onClick={() => handleEditProductClick(record)}
            style={{ width: 36, height: 36, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, border: '1px solid #bbf7d0', backgroundColor: '#f0fdf4' }}
          />

          <Button 
            icon={<DeleteOutlined style={{ color: '#ef4444' }} />} 
            onClick={() => {
              Modal.confirm({
                title: 'Xác nhận xóa',
                content: 'Bạn có chắc chắn muốn xóa sản phẩm này?',
                okText: 'Xóa',
                cancelText: 'Hủy',
                onOk: () => handleDeleteProduct(record.id || 0),
              });
            }}
            style={{ width: 36, height: 36, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, border: '1px solid #fecaca', backgroundColor: '#fef2f2' }}
          />
        </div>
      ),
    },
  ];

  const activeCount = products.filter(p => p.is_active !== false).length;
  const hiddenCount = products.length - activeCount;

  return (
    <div style={{ backgroundColor: '#fff', minHeight: '100vh', padding: 32, borderRadius: 16 }}>
      <style>{`
        .custom-product-table .ant-table-thead > tr > th {
          background: transparent !important;
          border-bottom: 1px solid #f3f4f6 !important;
          color: #4b5563 !important;
          font-weight: 600 !important;
          padding: 16px !important;
        }
        .custom-product-table .ant-table-tbody > tr > td {
          border-bottom: 1px dashed #f3f4f6 !important;
          padding: 16px !important;
        }
      `}</style>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 'bold', color: '#111', margin: 0 }}>Quản lý sản phẩm</h1>
          <div style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>Thêm, sửa, xóa và quản lý tất cả sản phẩm của cửa hàng</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Input 
            placeholder="Tìm kiếm sản phẩm..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: 240, height: 40, borderRadius: 8 }}
            prefix={<SearchOutlined style={{ color: '#9ca3af' }} />}
          />
          <Button icon={<FilterOutlined />} style={{ height: 40, borderRadius: 8, display: 'flex', alignItems: 'center', fontWeight: 500, color: '#4b5563' }}>Bộ lọc</Button>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={handleAddProductClick}
            style={{ backgroundColor: '#16a34a', height: 40, borderRadius: 8, fontWeight: 500, display: 'flex', alignItems: 'center', padding: '0 20px' }}
          >
            Thêm sản phẩm
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginBottom: 32 }}>
        {/* Card 1 */}
        <div style={{ backgroundColor: '#fff', padding: '16px 20px', borderRadius: 16, display: 'flex', alignItems: 'center', gap: 16, border: '1px solid #f3f4f6', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02), 0 2px 4px -2px rgba(0,0,0,0.02)' }}>
           <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AppstoreOutlined style={{ fontSize: 18, color: '#16a34a' }} />
           </div>
           <div>
              <div style={{ color: '#6b7280', fontSize: 13, fontWeight: 500, letterSpacing: '0.02em', textTransform: 'uppercase' }}>Tổng sản phẩm</div>
              <div style={{ color: '#111', fontSize: 24, fontWeight: 600, lineHeight: 1.1, marginTop: 4 }}>{products.length}</div>
           </div>
        </div>

        {/* Card 2 */}
        <div style={{ backgroundColor: '#fff', padding: '16px 20px', borderRadius: 16, display: 'flex', alignItems: 'center', gap: 16, border: '1px solid #f3f4f6', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02), 0 2px 4px -2px rgba(0,0,0,0.02)' }}>
           <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShoppingOutlined style={{ fontSize: 18, color: '#3b82f6' }} />
           </div>
           <div>
              <div style={{ color: '#6b7280', fontSize: 13, fontWeight: 500, letterSpacing: '0.02em', textTransform: 'uppercase' }}>Đang bán</div>
              <div style={{ color: '#111', fontSize: 24, fontWeight: 600, lineHeight: 1.1, marginTop: 4 }}>{activeCount}</div>
           </div>
        </div>

        {/* Card 3 */}
        <div style={{ backgroundColor: '#fff', padding: '16px 20px', borderRadius: 16, display: 'flex', alignItems: 'center', gap: 16, border: '1px solid #f3f4f6', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02), 0 2px 4px -2px rgba(0,0,0,0.02)' }}>
           <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <InboxOutlined style={{ fontSize: 18, color: '#ef4444' }} />
           </div>
           <div>
              <div style={{ color: '#6b7280', fontSize: 13, fontWeight: 500, letterSpacing: '0.02em', textTransform: 'uppercase' }}>Hết hàng</div>
              <div style={{ color: '#111', fontSize: 24, fontWeight: 600, lineHeight: 1.1, marginTop: 4 }}>{hiddenCount}</div>
           </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 32, borderBottom: '1px solid #f3f4f6', marginBottom: 24 }}>
         <div onClick={() => setFilterStatus('all')} style={{ cursor: 'pointer', paddingBottom: 12, borderBottom: filterStatus === 'all' ? '2px solid #16a34a' : '2px solid transparent', color: filterStatus === 'all' ? '#16a34a' : '#6b7280', fontWeight: filterStatus === 'all' ? 600 : 500, fontSize: 14 }}>Tất cả ({products.length})</div>
         <div onClick={() => setFilterStatus('active')} style={{ cursor: 'pointer', paddingBottom: 12, borderBottom: filterStatus === 'active' ? '2px solid #16a34a' : '2px solid transparent', color: filterStatus === 'active' ? '#16a34a' : '#6b7280', fontWeight: filterStatus === 'active' ? 600 : 500, fontSize: 14 }}>Đang bán ({activeCount})</div>
         <div onClick={() => setFilterStatus('hidden')} style={{ cursor: 'pointer', paddingBottom: 12, borderBottom: filterStatus === 'hidden' ? '2px solid #16a34a' : '2px solid transparent', color: filterStatus === 'hidden' ? '#16a34a' : '#6b7280', fontWeight: filterStatus === 'hidden' ? 600 : 500, fontSize: 14 }}>Hết hàng ({hiddenCount})</div>
      </div>

      <Table
        columns={columns}
        dataSource={filteredProducts}
        rowKey="id"
        loading={loading}
        rowSelection={{
           type: 'checkbox',
        }}
        pagination={{ 
           pageSize: 10,
           showSizeChanger: true,
           showTotal: (total, range) => `Hiển thị ${range[0]} - ${range[1]} trong ${total} sản phẩm`,
           className: "mt-8",
           position: ['bottomRight']
        }}
        className="custom-product-table"
      />

      <style>{`
        .custom-product-modal .ant-modal-content {
          border-radius: 12px;
          padding: 16px 20px;
        }
        .custom-product-modal .ant-modal-header {
          margin-bottom: 0;
          padding-bottom: 0;
          border-bottom: none;
        }
        .custom-product-modal .ant-switch-checked {
          background-color: #16a34a !important;
        }
        .custom-product-modal .ant-form-item-label > label {
          font-weight: 600;
          color: #374151;
          height: auto;
        }
        .custom-product-modal .ant-form-item-label {
          padding-bottom: 4px;
        }
      `}</style>
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid #f3f4f6', paddingBottom: 16, marginBottom: 16 }}>
            <div style={{ backgroundColor: '#f0fdf4', padding: 8, borderRadius: 8, display: 'flex' }}>
              <EditOutlined style={{ color: '#16a34a', fontSize: 20 }} />
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 'bold', color: '#111' }}>
                {editingProductId ? "Sửa sản phẩm" : "Thêm sản phẩm mới"}
              </div>
              <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4, fontWeight: 'normal' }}>
                Cập nhật thông tin sản phẩm
              </div>
            </div>
          </div>
        }
        open={showProductForm}
        onCancel={() => setShowProductForm(false)}
        footer={null}
        destroyOnClose
        width={600}
        className="custom-product-modal"
        closeIcon={<div style={{ fontSize: 16, color: '#6b7280', marginTop: 8 }}>✕</div>}
      >
        <Form form={form} onFinish={handleProductSubmit} layout="vertical" initialValues={formData} requiredMark={false}>
          <div style={{ display: 'flex', gap: 20 }}>
            {/* Left Column - Image & Status */}
            <div style={{ width: 180, flexShrink: 0, borderRight: '1px solid #f3f4f6', paddingRight: 20 }}>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12, color: '#111' }}>Ảnh sản phẩm</div>
              
              <div style={{ position: 'relative', width: '100%', aspectRatio: '3/4', backgroundColor: '#f9fafb', borderRadius: 12, overflow: 'hidden', border: '1px solid #e5e7eb', marginBottom: 12 }}>
                {(preview || formData.image_url) ? (
                  <img src={preview || formData.image_url} alt="product preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#d1d5db' }}>
                    Chưa có ảnh
                  </div>
                )}
              </div>

              <Upload
                showUploadList={false}
                beforeUpload={(file) => {
                  const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/webp';
                  if (!isJpgOrPng) {
                    message.error('Chỉ được upload file JPG/PNG/WEBP!');
                    return false;
                  }
                  const isLt2M = file.size / 1024 / 1024 < 2;
                  if (!isLt2M) {
                    message.error('Ảnh phải nhỏ hơn 2MB!');
                    return false;
                  }
                  return false;
                }}
                onChange={async (info) => {
                  if (info.file) {
                    setUploading(true);
                    try {
                      const fileToRead = info.file.originFileObj || (info.file as any);
                      const reader = new FileReader();
                      reader.onload = (e) => {
                        const base64 = e.target?.result as string;
                        setFormData({ ...formData, image_base64: base64 });
                        setPreview(base64);
                      };
                      reader.readAsDataURL(fileToRead);
                    } catch (error) {
                      message.error('Lỗi khi đọc file ảnh');
                    } finally {
                      setUploading(false);
                    }
                  }
                }}
              >
                <div style={{ width: 156, border: '1px dashed #d1d5db', borderRadius: 8, padding: '8px 4px', textAlign: 'center', cursor: 'pointer', backgroundColor: '#fff' }}>
                  <UploadOutlined style={{ color: '#16a34a', fontSize: 20, marginBottom: 4 }} />
                  <div style={{ color: '#16a34a', fontWeight: 600, fontSize: 13 }}>Thay đổi ảnh</div>
                  <div style={{ color: '#9ca3af', fontSize: 11, marginTop: 2 }}>Tối đa 2MB</div>
                </div>
              </Upload>

              <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid #f3f4f6' }}>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12, color: '#111' }}>Trạng thái</div>
                <Form.Item name="is_active" valuePropName="checked" style={{ marginBottom: 4 }}>
                  <Switch 
                     checkedChildren={<span style={{ fontWeight: 600 }}>Đang bán</span>} 
                     unCheckedChildren="Đã ẩn" 
                  />
                </Form.Item>
                <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 8 }}>Sản phẩm sẽ hiển thị và có thể đặt hàng</div>
              </div>
            </div>

            {/* Right Column - Info */}
            <div style={{ flex: 1 }}>
              <Form.Item
                label={<span><span style={{color: '#ef4444'}}>*</span> Tên sản phẩm</span>}
                name="name"
                rules={[{ required: true, message: 'Vui lòng nhập tên sản phẩm' }]}
              >
                <Input 
                  showCount 
                  maxLength={100}
                  style={{ height: 36, borderRadius: 6, borderColor: '#e5e7eb' }} 
                />
              </Form.Item>

              <Form.Item 
                label={<span><span style={{color: '#ef4444'}}>*</span> Danh mục sản phẩm</span>} 
                name="category_id"
                rules={[{ required: true, message: 'Vui lòng chọn danh mục' }]}
              >
                <Select loading={categoriesLoading} style={{ height: 36 }}>
                  {categories.map((cat) => (
                    <Option key={cat.id} value={cat.id}>{cat.name}</Option>
                  ))}
                </Select>
              </Form.Item>

              <div style={{ display: 'flex', gap: 16 }}>
                 <Form.Item
                   style={{ flex: 1 }}
                   label={<span><span style={{color: '#ef4444'}}>*</span> Giá bán</span>}
                   name="price"
                   rules={[{ required: true, message: 'Vui lòng nhập giá bán' }]}
                 >
                   <Input type="number" style={{ height: 36, borderRadius: 6, borderColor: '#e5e7eb' }} suffix={<span style={{color: '#6b7280'}}>đ</span>} />
                 </Form.Item>

                 <Form.Item 
                   style={{ flex: 1 }}
                   label={<span>Giá vốn</span>} 
                   name="cost_price"
                 >
                   <Input type="number" style={{ height: 36, borderRadius: 6, borderColor: '#e5e7eb' }} suffix={<span style={{color: '#6b7280'}}>đ</span>} />
                 </Form.Item>
              </div>

              <Form.Item 
                label={<span>Mô tả</span>} 
                name="description"
                style={{ marginBottom: 0 }}
              >
                <Input.TextArea showCount maxLength={500} rows={3} style={{ borderRadius: 6, borderColor: '#e5e7eb' }} />
              </Form.Item>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 20, paddingTop: 16, borderTop: '1px solid #f3f4f6' }}>
            <Button onClick={() => setShowProductForm(false)} style={{ height: 36, padding: '0 20px', borderRadius: 8, fontWeight: 600, borderColor: '#e5e7eb', color: '#374151' }}>
              Hủy bỏ
            </Button>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={uploading} 
              icon={<EditOutlined />} 
              style={{ height: 36, padding: '0 20px', borderRadius: 8, fontWeight: 600, backgroundColor: '#16a34a', borderColor: '#16a34a' }}
            >
              Lưu thay đổi
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}