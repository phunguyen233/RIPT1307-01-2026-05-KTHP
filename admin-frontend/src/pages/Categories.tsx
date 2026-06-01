import React, { useState, useEffect } from "react";
import { Table, Button, Modal, Form, Input, Space, message, Switch } from "antd";
import { EditOutlined, DeleteOutlined, PlusOutlined, EyeOutlined, AppstoreOutlined, DropboxOutlined, SearchOutlined, ShoppingOutlined, CheckCircleOutlined, MinusCircleOutlined } from "@ant-design/icons";
import { categoryAPI, Category } from "../api/categoryAPI";

const Categories: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentId, setCurrentId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setInitialLoading(true);
      const data = await categoryAPI.getAll();
      setCategories(data || []);
      setError("");
    } catch (err) {
      console.error("Error fetching categories:", err);
      setError("Lỗi khi tải danh mục");
    } finally {
      setInitialLoading(false);
    }
  };

  const handleAddCategory = async (values: any) => {
    setError("");
    const name = values.name || formData.name;
    const description = values.description || formData.description;
    if (!name.trim()) {
      setError("Tên danh mục không được trống");
      return;
    }

    try {
      setLoading(true);
      if (isEditMode && currentId) {
        await categoryAPI.update(currentId, { name, description });
        message.success("Cập nhật danh mục thành công!");
      } else {
        await categoryAPI.create({ name, description });
        message.success("Thêm danh mục thành công!");
      }
      setFormData({ name: "", description: "" });
      setShowModal(false);
      setIsEditMode(false);
      setCurrentId(null);
      await fetchCategories();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Lỗi khi lưu danh mục");
      message.error(err?.response?.data?.message || "Lỗi khi lưu danh mục");
    } finally {
      setLoading(false);
    }
  };

  const handleEditCategory = (category: Category) => {
    setCurrentId(category.id || 0);
    setFormData({ name: category.name, description: category.description || "" });
    setIsEditMode(true);
    setShowModal(true);
    setError("");
  };

  const handleDeleteCategory = async (id: number) => {
    try {
      await categoryAPI.delete(id);
      message.success("Xóa danh mục thành công!");
      await fetchCategories();
    } catch (err: any) {
      message.error(err?.response?.data?.message || "Lỗi khi xóa danh mục");
    }
  };


  const columns = [
    {
      title: "Danh mục",
      dataIndex: "name",
      key: "name",
      render: (text: string) => (
        <span style={{ fontWeight: 600, color: '#1f2937', fontSize: 15 }}>{text}</span>
      )
    },


    {
      title: "Thao tác",
      key: "action",
      align: 'center' as const,
      render: (_: any, record: Category) => (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          <Button
            icon={<EditOutlined style={{ color: '#16a34a' }} />}
            onClick={() => handleEditCategory(record)}
            style={{ width: 36, height: 36, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, border: '1px solid #bbf7d0', backgroundColor: '#f0fdf4' }}
          />
          <Button
            icon={<DeleteOutlined style={{ color: '#ef4444' }} />}
            onClick={() => {
              Modal.confirm({
                title: 'Xác nhận xóa',
                content: 'Bạn có chắc chắn muốn xóa danh mục này?',
                okText: 'Xóa',
                cancelText: 'Hủy',
                onOk: () => handleDeleteCategory(record.id || 0),
              });
            }}
            style={{ width: 36, height: 36, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, border: '1px solid #fecaca', backgroundColor: '#fef2f2' }}
          />
        </div>
      ),
    },
  ];

  const filteredCategories = categories.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = categories.filter(c => c.is_active !== false).length;
  const hiddenCount = categories.length - activeCount;

  return (
    <div style={{ backgroundColor: '#fff', minHeight: '100vh', padding: 32, borderRadius: 16 }}>
      <style>{`
        .custom-category-table .ant-table-thead > tr > th {
          background: transparent !important;
          border-bottom: 1px solid #f3f4f6 !important;
          color: #4b5563 !important;
          font-weight: 600 !important;
          padding: 16px !important;
        }
        .custom-category-table .ant-table-tbody > tr > td {
          border-bottom: 1px dashed #f3f4f6 !important;
          padding: 16px !important;
        }
        .custom-category-table .ant-table-tbody > tr:hover > td {
          background-color: #f9fafb !important;
        }
      `}</style>

      {/* Breadcrumb */}
      <div style={{ marginBottom: 24, fontSize: 13, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><AppstoreOutlined /> Trang chủ</span>
        <span style={{ color: '#d1d5db' }}>›</span>
        <span style={{ color: '#111', fontWeight: 600 }}>Danh mục</span>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div>
           <h1 style={{ fontSize: 28, fontWeight: 'bold', color: '#111', margin: 0, letterSpacing: '-0.025em' }}>Quản lý danh mục</h1>
           <div style={{ fontSize: 14, color: '#6b7280', marginTop: 8 }}>Thêm, sửa, xóa và quản lý các danh mục sản phẩm</div>  
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
           <Input
             placeholder="Tìm kiếm danh mục..."
             value={search}
             onChange={(e) => setSearch(e.target.value)}
             style={{ width: 280, height: 44, borderRadius: 8, borderColor: '#e5e7eb' }}
             prefix={<SearchOutlined style={{ color: '#9ca3af', marginRight: 4 }} />}
           />
           <Button
             type="primary"
             icon={<PlusOutlined />}
             onClick={() => {
               setFormData({ name: "", description: "" });
               setIsEditMode(false);
               setCurrentId(null);
               setError("");
               setShowModal(true);
             }}
             style={{ backgroundColor: '#16a34a', borderColor: '#16a34a', height: 44, borderRadius: 8, padding: '0 24px', fontWeight: 600 }}
           >
             Thêm danh mục
           </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'flex', gap: 24, marginBottom: 32 }}>
        {/* Card 1 */}
        <div style={{ backgroundColor: '#fff', padding: '16px 20px', borderRadius: 16, display: 'flex', alignItems: 'center', gap: 16, border: '1px solid #f3f4f6', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02), 0 2px 4px -2px rgba(0,0,0,0.02)', width: 320 }}>
           <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShoppingOutlined style={{ fontSize: 18, color: '#16a34a' }} />
           </div>
           <div>
              <div style={{ color: '#6b7280', fontSize: 13, fontWeight: 500, letterSpacing: '0.02em', textTransform: 'uppercase' }}>Tổng danh mục</div>
              <div style={{ color: '#111', fontSize: 24, fontWeight: 600, lineHeight: 1.1, marginTop: 4 }}>{categories.length}</div>
           </div>
        </div>
      </div>

      <Table
        columns={columns}
        dataSource={filteredCategories}
        rowKey="id"
        loading={initialLoading}
        className="custom-category-table"
        pagination={{ 
           pageSize: 10,
           showSizeChanger: false,
           showTotal: (total, range) => `Hiển thị ${range[0]} - ${range[1]} trong tổng số ${total} danh mục`,
           position: ['bottomCenter'],
           className: "mt-8"
        }}
      />

      <Modal
        title={
          <div style={{ fontSize: 20, fontWeight: 'bold', color: '#111', borderBottom: '1px solid #f3f4f6', paddingBottom: 16, marginBottom: 16 }}>
            {isEditMode ? "Sửa danh mục" : "Thêm danh mục mới"}
          </div>
        }
        open={showModal}
        onCancel={() => setShowModal(false)}
        footer={null}
        width={500}
      >
        <Form onFinish={handleAddCategory} layout="vertical">
          <Form.Item
            label={<span style={{ fontWeight: 600, color: '#374151' }}>Tên danh mục</span>}
            name="name"
            initialValue={formData.name}
            rules={[{ required: true, message: 'Vui lòng nhập tên danh mục' }]}
          >
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              style={{ height: 44, borderRadius: 8 }}
            />
          </Form.Item>



          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 32 }}>
            <Button onClick={() => setShowModal(false)} style={{ height: 44, padding: '0 24px', borderRadius: 8, fontWeight: 600 }}>
              Hủy
            </Button>
            <Button type="primary" htmlType="submit" loading={loading} style={{ height: 44, padding: '0 24px', borderRadius: 8, fontWeight: 600, backgroundColor: '#16a34a' }}>
              {isEditMode ? "Lưu thay đổi" : "Thêm mới"}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default Categories;
