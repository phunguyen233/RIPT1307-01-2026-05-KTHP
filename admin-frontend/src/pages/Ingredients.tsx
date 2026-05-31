import React, { useEffect, useState, useMemo } from "react";
import { Table, Button, Modal, Form, Input, Select, Space, message, InputNumber, Row, Col } from "antd";
import { EditOutlined, DeleteOutlined, PlusOutlined, HistoryOutlined, ReloadOutlined, AppstoreOutlined, CarryOutOutlined, InboxOutlined, DollarCircleOutlined, FilterOutlined, SearchOutlined, EyeOutlined } from "@ant-design/icons";
import { ingredientAPI, Ingredient } from "../api/ingredientAPI";
import { unitAPI, Unit } from "../api/unitAPI";
import { receiptAPI, InventoryImport } from "../api/receiptAPI";

const Ingredients: React.FC = () => {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [search, setSearch] = useState("");

  // Add ingredient modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({ name: "", unit_id: 0, stock_quantity: null as number | null, avg_price: null as number | null, warning_threshold: null as number | null, note: "" });
  const [addError, setAddError] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  // Edit ingredient modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState({ name: "", unit_id: 0, stock_quantity: null as number | null, avg_price: null as number | null, warning_threshold: null as number | null, note: "" });
  const [editError, setEditError] = useState("");

  // Import stock modal
  const [showImportModal, setShowImportModal] = useState(false);
  const [importData, setImportData] = useState({ ingredient_id: 0, quantity: null as number | null, unit_id: 0, import_price: null as number | null });
  const [importError, setImportError] = useState("");
  const [importLoading, setImportLoading] = useState(false);

  // Import history modal
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyIngredient, setHistoryIngredient] = useState<Ingredient | null>(null);
  const [importHistory, setImportHistory] = useState<InventoryImport[]>([]);
  
  const [filterStatus, setFilterStatus] = useState<'all' | 'low' | 'out'>('all');

  const fetchData = async () => {
    try {
      const [ingredientsData, unitsData] = await Promise.all([
        ingredientAPI.getAll(),
        unitAPI.getAll()
      ]);
      setIngredients(ingredientsData || []);
      setUnits(unitsData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleReloadPage = async () => {
    await fetchData();
  };

  const getUnitSymbol = (unitId: number) => {
    return units.find(u => u.id === unitId)?.symbol || "";
  };

  const fmtQty = (v: any) => {
    const num = Number(v || 0);
    if (!isFinite(num)) return "0";
    if (Math.abs(num - Math.round(num)) < 1e-9) return String(Math.round(num));
    return num.toFixed(4).replace(/\.?0+$/, "");
  };

  const filteredIngredients = ingredients.filter(i =>
    i.name?.toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    {
      title: "Nguyên liệu",
      key: "ingredient",
      render: (_: any, record: Ingredient) => (
        <div>
          <div style={{ color: '#111', fontWeight: 500 }}>{record.name}</div>
          <div style={{ color: '#6b7280', fontSize: 13 }}>NL{(record.id || 0).toString().padStart(3, '0')}</div>
        </div>
      ),
    },
    {
      title: "Đơn vị tính",
      dataIndex: "unit_id",
      key: "unit",
      align: 'center' as const,
      render: (unitId: number) => {
        const unit = units.find(u => u.id === unitId);
        return <span style={{ color: '#4b5563' }}>{unit ? unit.symbol : "N/A"}</span>;
      },
    },
    {
      title: "Tồn kho",
      key: "stock_quantity",
      align: 'center' as const,
      render: (_: any, record: Ingredient) => {
        const displayQty = getDisplayStockQuantity(record);
        return <span style={{ color: '#111', fontWeight: 500 }}>{fmtQty(displayQty)}</span>;
      },
    },
    {
      title: "Đơn giá nhập",
      key: "avg_price",
      align: 'center' as const,
      render: (_: any, record: Ingredient) => {
        const p = record.avg_price || 0;
        return <span style={{ color: '#4b5563' }}>{p > 0 ? `${p.toLocaleString()}đ` : '-'}</span>;
      },
    },
    {
      title: "Giá trị tồn kho",
      key: "total_value",
      align: 'center' as const,
      render: (_: any, record: Ingredient) => {
        const p = record.avg_price || 0;
        const qty = getDisplayStockQuantity(record);
        const val = p * qty;
        return <span style={{ color: '#111', fontWeight: 500 }}>{val > 0 ? `${val.toLocaleString()}đ` : '-'}</span>;
      },
    },

    {
      title: "Thao tác",
      key: "action",
      align: 'center' as const,
      render: (_: any, record: Ingredient) => (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          <Button 
            icon={<EditOutlined style={{ color: '#16a34a' }} />} 
            onClick={() => handleEditIngredient(record)}
            style={{ width: 36, height: 36, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, border: '1px solid #bbf7d0', backgroundColor: '#f0fdf4' }}
          />
          <Button 
            icon={<DeleteOutlined style={{ color: '#ef4444' }} />} 
            onClick={() => {
              Modal.confirm({
                title: 'Xác nhận xóa',
                content: 'Bạn có chắc chắn muốn xóa nguyên liệu này?',
                okText: 'Xóa',
                cancelText: 'Hủy',
                onOk: () => handleDeleteIngredient(record.id || 0),
              });
            }}
            style={{ width: 36, height: 36, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, border: '1px solid #fecaca', backgroundColor: '#fef2f2' }}
          />
        </div>
      ),
    },
  ];

  // Add ingredient
  const handleAddIngredient = async (values: any) => {
    setAddError("");
    
    const name = values.name || formData.name;
    const unit_id = values.unit_id || formData.unit_id;
    const stock_quantity = values.stock_quantity || formData.stock_quantity;
    const avg_price = values.avg_price || formData.avg_price;
    const warning_threshold = values.warning_threshold || formData.warning_threshold;
    const note = values.note || formData.note;
    
    if (!name.trim()) {
      setAddError("Tên nguyên liệu không được trống");
      return;
    }
    if (!unit_id) {
      setAddError("Vui lòng chọn đơn vị");
      return;
    }

    try {
      setAddLoading(true);
      await ingredientAPI.add({
        name,
        unit_id,
        stock_quantity: Number(stock_quantity) || 0,
        avg_price: Number(avg_price) || 0,
        warning_threshold: warning_threshold ? Number(warning_threshold) : undefined,
        note: note || ''
      });
      message.success("Thêm nguyên liệu thành công!");
      setFormData({ name: "", unit_id: 0, stock_quantity: null, avg_price: null, warning_threshold: null, note: "" });
      setShowAddModal(false);
      await fetchData();
    } catch (err: any) {
      setAddError(err?.response?.data?.message || "Lỗi khi thêm nguyên liệu");
      message.error(err?.response?.data?.message || "Lỗi khi thêm nguyên liệu");
    } finally {
      setAddLoading(false);
    }
  };

  const handleEditIngredient = (record: Ingredient) => {
    setEditId(record.id);
    const displayQty = getDisplayStockQuantity(record);
    setEditFormData({
      name: record.name,
      unit_id: record.unit_id,
      stock_quantity: displayQty,
      avg_price: record.avg_price || 0,
      warning_threshold: record.warning_threshold || null,
      note: record.note || ""
    });
    setShowEditModal(true);
  };

  const handleEditIngredientSubmit = async (values: any) => {
    setEditError("");
    
    const name = values.name || editFormData.name;
    const unit_id = values.unit_id || editFormData.unit_id;
    const stock_quantity = values.stock_quantity || editFormData.stock_quantity;
    const avg_price = values.avg_price || editFormData.avg_price;
    const warning_threshold = values.warning_threshold || editFormData.warning_threshold;
    const note = values.note || editFormData.note;
    
    if (!name.trim()) {
      setEditError("Tên nguyên liệu không được trống");
      return;
    }
    if (!unit_id) {
      setEditError("Vui lòng chọn đơn vị");
      return;
    }

    try {
      if (editId) {
        await ingredientAPI.update(editId, {
          name,
          unit_id,
          stock_quantity: Number(stock_quantity) || 0,
          avg_price: Number(avg_price) || 0,
          warning_threshold: warning_threshold ? Number(warning_threshold) : undefined,
          note: note || ''
        });
        message.success("Cập nhật nguyên liệu thành công!");
        setShowEditModal(false);
        await fetchData();
      }
    } catch (error: any) {
      setEditError(error?.response?.data?.error || "Lỗi khi cập nhật nguyên liệu");
      message.error(error?.response?.data?.error || "Lỗi khi cập nhật nguyên liệu");
    }
  };

  // Delete ingredient
  const handleDeleteIngredient = async (id: number) => {
    try {
      await ingredientAPI.delete(id);
      message.success("Xóa nguyên liệu thành công!");
      await fetchData();
    } catch (error: any) {
      message.error(error?.response?.data?.error || "Lỗi khi xóa nguyên liệu");
    }
  };

  // Import stock
  const openImportModal = (ingredient: Ingredient) => {
    setImportData({
      ingredient_id: ingredient.id,
      quantity: null,
      unit_id: ingredient.unit_id,
      import_price: null
    });
    setShowImportModal(true);
  };

  const handleImportStock = async () => {
    setImportError("");
    
    if (!importData.quantity || Number(importData.quantity) <= 0) {
      setImportError("Số lượng phải lớn hơn 0");
      return;
    }
    if (!importData.unit_id) {
      setImportError("Vui lòng chọn đơn vị");
      return;
    }
    if (!importData.import_price || Number(importData.import_price) < 0) {
      setImportError("Giá nhập không hợp lệ");
      return;
    }

    try {
      setImportLoading(true);
      const convertedQuantity = getConvertedImportQuantity();
      if (convertedQuantity === null || Number.isNaN(convertedQuantity)) {
        setImportError("Không thể quy đổi đơn vị nhập kho với đơn vị hiện tại của nguyên liệu");
        return;
      }
      await receiptAPI.add(importData.ingredient_id, {
        quantity: Number(importData.quantity),
        unit_id: importData.unit_id,
        import_price: Number(importData.import_price)
      });
      setSuccessMsg("Nhập kho thành công!");
      setShowImportModal(false);
      setImportData({ ingredient_id: 0, quantity: null, unit_id: 0, import_price: null });
      await fetchData();
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (error: any) {
      setImportError(error?.response?.data?.error || "Lỗi khi nhập kho");
    } finally {
      setImportLoading(false);
    }
  };

  // View import history
  const openHistoryModal = async (ingredient: Ingredient) => {
    try {
      const history = await receiptAPI.getAll();
      const filtered = history.filter(h => h.ingredient_id === ingredient.id);
      setHistoryIngredient(ingredient);
      setImportHistory(filtered);
      setShowHistoryModal(true);
    } catch (error) {
      console.error("Lỗi khi tải lịch sử:", error);
    }
  };

  const getUnitById = (id?: number) => {
    return units.find(u => u.id === id);
  };

  const getIngredientUnit = (ingredientId: number) => {
    const ingredient = ingredients.find(i => i.id === ingredientId);
    return ingredient ? getUnitById(ingredient.unit_id) : undefined;
  };

  const getImportUnitsForIngredient = (ingredientId: number) => {
    const ingredientUnit = getIngredientUnit(ingredientId);
    if (!ingredientUnit) return units;
    return units.filter(u => u.type === ingredientUnit.type);
  };

  const getFactorToBase = (unit?: Unit): number => {
    if (!unit) return 1;
    if (!unit.base_unit_id) return 1;
    const parentUnit = getUnitById(unit.base_unit_id);
    return unit.conversion_factor * getFactorToBase(parentUnit);
  };

  const convertQuantity = (quantity: number, fromUnitId: number, toUnitId: number) => {
    const fromUnit = getUnitById(fromUnitId);
    const toUnit = getUnitById(toUnitId);
    if (!fromUnit || !toUnit || fromUnit.type !== toUnit.type) return NaN;
    const fromFactor = getFactorToBase(fromUnit);
    const toFactor = getFactorToBase(toUnit);
    return (quantity * fromFactor) / toFactor;
  };

  const getConvertedImportQuantity = () => {
    if (!importData.quantity || !importData.unit_id || !importData.ingredient_id) return null;
    const ingredient = ingredients.find(i => i.id === importData.ingredient_id);
    if (!ingredient) return null;
    const converted = convertQuantity(Number(importData.quantity), importData.unit_id, ingredient.unit_id);
    return Number.isFinite(converted) ? converted : null;
  };

  const getDisplayStockQuantity = (ingredient: Ingredient) => {
    return ingredient.stock_quantity || 0;
  };

  // Convert stock to base unit (g/ml/unit) for threshold check
  const getStockInBaseUnit = (ingredient: Ingredient) => {
    if (!ingredient.stock_quantity || !ingredient.unit_id) return 0;
    const ingredientUnit = getUnitById(ingredient.unit_id);
    if (!ingredientUnit) return ingredient.stock_quantity || 0;
    const factor = getFactorToBase(ingredientUnit);
    return ingredient.stock_quantity * factor;
  };

  const { lowStockCount, outOfStockCount, totalValue, finalIngredients } = useMemo(() => {
    let lowCount = 0;
    let outCount = 0;
    let value = 0;
    
    const filtered = filteredIngredients.filter(i => {
      const baseUnitQty = getStockInBaseUnit(i);
      const isOut = baseUnitQty === 0;
      const isLow = baseUnitQty > 0 && baseUnitQty < 250;
      
      if (isOut) outCount++;
      if (isLow) lowCount++;
      value += (i.avg_price || 0) * (i.stock_quantity || 0);

      if (filterStatus === 'low') return isLow;
      if (filterStatus === 'out') return isOut;
      return true;
    });

    return { lowStockCount: lowCount, outOfStockCount: outCount, totalValue: value, finalIngredients: filtered };
  }, [filteredIngredients, filterStatus]);

  return (
    <div style={{ backgroundColor: '#fff', minHeight: '100vh', padding: 32, borderRadius: 16 }}>
      <style>{`
        .custom-ingredient-table .ant-table-thead > tr > th {
          background: transparent !important;
          border-bottom: 1px solid #f3f4f6 !important;
          color: #4b5563 !important;
          font-weight: 600 !important;
          padding: 16px !important;
        }
        .custom-ingredient-table .ant-table-tbody > tr > td {
          border-bottom: 1px dashed #f3f4f6 !important;
          padding: 16px !important;
        }
        .custom-ingredient-modal .ant-modal-content {
          border-radius: 12px;
          padding: 20px;
        }
        .custom-ingredient-modal .ant-form-item {
          margin-bottom: 12px;
        }
        .custom-ingredient-modal .ant-modal-header {
          margin-bottom: 0;
          padding-bottom: 0;
          border-bottom: none;
        }
        .custom-ingredient-modal .ant-form-item-label > label {
          font-weight: 500;
          color: #4b5563;
          height: auto;
        }
        .custom-ingredient-modal .ant-form-item-label {
          padding-bottom: 8px;
        }
        .custom-ingredient-modal .ant-input, .custom-ingredient-modal .ant-select-selector, .custom-ingredient-modal .ant-input-number {
          border-radius: 8px !important;
          border-color: #d1d5db;
        }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 'bold', color: '#111', margin: 0 }}>Quản lý nguyên liệu</h1>
          <div style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>Quản lý toàn bộ nguyên liệu, theo dõi tồn kho và nhập xuất.</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Input 
            placeholder="Tìm kiếm nguyên liệu..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 240, height: 40, borderRadius: 8 }}
            prefix={<SearchOutlined style={{ color: '#9ca3af' }} />}
          />
          <Button icon={<FilterOutlined />} style={{ height: 40, borderRadius: 8, display: 'flex', alignItems: 'center', fontWeight: 500, color: '#4b5563' }}>Bộ lọc</Button>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={() => setShowAddModal(true)}
            style={{ backgroundColor: '#16a34a', height: 40, borderRadius: 8, fontWeight: 500, display: 'flex', alignItems: 'center', padding: '0 20px' }}
          >
            Thêm nguyên liệu
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 32 }}>
        {/* Card 1 */}
        <div style={{ backgroundColor: '#fff', padding: '12px 20px', borderRadius: 16, display: 'flex', alignItems: 'center', gap: 16, border: '1px solid #f3f4f6', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02), 0 2px 4px -2px rgba(0,0,0,0.02)' }}>
           <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <AppstoreOutlined style={{ fontSize: 20, color: '#16a34a' }} />
           </div>
           <div style={{ overflow: 'hidden' }}>
              <div style={{ color: '#6b7280', fontSize: 13, fontWeight: 500, letterSpacing: '0.02em', textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Tổng nguyên liệu</div>
              <div style={{ color: '#111', fontSize: 24, fontWeight: 700, lineHeight: 1.1, marginTop: 4 }}>{ingredients.length}</div>
           </div>
        </div>

        {/* Card 2 */}
        <div style={{ backgroundColor: '#fff', padding: '12px 20px', borderRadius: 16, display: 'flex', alignItems: 'center', gap: 16, border: '1px solid #f3f4f6', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02), 0 2px 4px -2px rgba(0,0,0,0.02)' }}>
           <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <CarryOutOutlined style={{ fontSize: 20, color: '#f97316' }} />
           </div>
           <div style={{ overflow: 'hidden' }}>
              <div style={{ color: '#6b7280', fontSize: 13, fontWeight: 500, letterSpacing: '0.02em', textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Sắp hết hàng</div>
              <div style={{ color: '#111', fontSize: 24, fontWeight: 700, lineHeight: 1.1, marginTop: 4 }}>{lowStockCount}</div>
           </div>
        </div>

        {/* Card 3 */}
        <div style={{ backgroundColor: '#fff', padding: '12px 20px', borderRadius: 16, display: 'flex', alignItems: 'center', gap: 16, border: '1px solid #f3f4f6', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02), 0 2px 4px -2px rgba(0,0,0,0.02)' }}>
           <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <InboxOutlined style={{ fontSize: 20, color: '#ef4444' }} />
           </div>
           <div style={{ overflow: 'hidden' }}>
              <div style={{ color: '#6b7280', fontSize: 13, fontWeight: 500, letterSpacing: '0.02em', textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Hết hàng</div>
              <div style={{ color: '#111', fontSize: 24, fontWeight: 700, lineHeight: 1.1, marginTop: 4 }}>{outOfStockCount}</div>
           </div>
        </div>

        {/* Card 4 */}
        <div style={{ backgroundColor: '#fff', padding: '12px 20px', borderRadius: 16, display: 'flex', alignItems: 'center', gap: 16, border: '1px solid #f3f4f6', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02), 0 2px 4px -2px rgba(0,0,0,0.02)' }}>
           <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <DollarCircleOutlined style={{ fontSize: 20, color: '#16a34a' }} />
           </div>
           <div style={{ overflow: 'hidden' }}>
              <div style={{ color: '#6b7280', fontSize: 13, fontWeight: 500, letterSpacing: '0.02em', textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Tổng giá trị tồn kho</div>
              <div style={{ color: '#111', fontSize: 24, fontWeight: 700, lineHeight: 1.1, marginTop: 4 }}>
                 {totalValue >= 1000000 ? `${(totalValue / 1000000).toFixed(1)} triệu` : `${totalValue.toLocaleString()}đ`}
              </div>
           </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 32, borderBottom: '1px solid #f3f4f6', marginBottom: 24 }}>
         <div onClick={() => setFilterStatus('all')} style={{ cursor: 'pointer', paddingBottom: 12, borderBottom: filterStatus === 'all' ? '2px solid #16a34a' : '2px solid transparent', color: filterStatus === 'all' ? '#16a34a' : '#6b7280', fontWeight: filterStatus === 'all' ? 600 : 500, fontSize: 14 }}>Tất cả ({ingredients.length})</div>
         <div onClick={() => setFilterStatus('low')} style={{ cursor: 'pointer', paddingBottom: 12, borderBottom: filterStatus === 'low' ? '2px solid #16a34a' : '2px solid transparent', color: filterStatus === 'low' ? '#16a34a' : '#6b7280', fontWeight: filterStatus === 'low' ? 600 : 500, fontSize: 14 }}>Sắp hết ({lowStockCount})</div>
         <div onClick={() => setFilterStatus('out')} style={{ cursor: 'pointer', paddingBottom: 12, borderBottom: filterStatus === 'out' ? '2px solid #16a34a' : '2px solid transparent', color: filterStatus === 'out' ? '#16a34a' : '#6b7280', fontWeight: filterStatus === 'out' ? 600 : 500, fontSize: 14 }}>Hết hàng ({outOfStockCount})</div>
      </div>

      <Table
        columns={columns}
        dataSource={finalIngredients}
        rowKey="id"
        rowSelection={{ type: 'checkbox' }}
        pagination={{ 
           pageSize: 10,
           showSizeChanger: true,
           showTotal: (total, range) => `Hiển thị ${range[0]} - ${range[1]} trong ${total} nguyên liệu`,
           className: "mt-8",
           position: ['bottomRight']
        }}
        className="custom-ingredient-table"
      />

      {/* Add Ingredient Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid #f3f4f6', paddingBottom: 16, marginBottom: 16 }}>
            <div style={{ backgroundColor: '#f0fdf4', padding: 8, borderRadius: 8, display: 'flex' }}>
              <AppstoreOutlined style={{ color: '#16a34a', fontSize: 20 }} />
            </div>
            <div style={{ fontSize: 18, fontWeight: 'bold', color: '#111' }}>Thêm nguyên liệu</div>
          </div>
        }
        open={showAddModal}
        onCancel={() => setShowAddModal(false)}
        footer={null}
        className="custom-ingredient-modal"
        closeIcon={<span style={{ fontSize: 16, color: '#9ca3af', padding: 8 }}>✕</span>}
        width={600}
        destroyOnClose
      >
        <Form onFinish={handleAddIngredient} layout="vertical" initialValues={formData}>
          <div style={{ fontWeight: 600, color: '#111', fontSize: 15, marginBottom: 8 }}>Thông tin cơ bản</div>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Tên nguyên liệu" name="name" rules={[{ required: true, message: 'Vui lòng nhập tên' }]}>
                <Input placeholder="Nhập tên nguyên liệu" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} style={{ height: 40 }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Đơn vị tính" name="unit_id" rules={[{ required: true, message: 'Vui lòng chọn đơn vị' }]}>
                <Select placeholder="Chọn đơn vị tính" value={formData.unit_id} onChange={(value) => setFormData({ ...formData, unit_id: value })} style={{ height: 40 }}>
                  {units.map((unit) => (<Select.Option key={unit.id} value={unit.id}>{unit.name}</Select.Option>))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <div style={{ fontWeight: 600, color: '#111', fontSize: 15, marginBottom: 8, marginTop: 4 }}>Thông tin tồn kho</div>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Tồn kho hiện tại" name="stock_quantity">
                <InputNumber placeholder="Nhập số lượng tồn kho" min={0} value={formData.stock_quantity ?? undefined} onChange={(value) => setFormData({ ...formData, stock_quantity: value ?? null })} style={{ width: '100%', height: 40, paddingTop: 4 }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Ngưỡng cảnh báo" name="warning_threshold">
                <InputNumber placeholder="Nhập ngưỡng cảnh báo" min={0} value={formData.warning_threshold ?? undefined} onChange={(value) => setFormData({ ...formData, warning_threshold: value ?? null })} style={{ width: '100%', height: 40, paddingTop: 4 }} />
              </Form.Item>
            </Col>
          </Row>


          <Row>
            <Col span={24}>
              <Form.Item label="Ghi chú" name="note">
                <Input.TextArea placeholder="Nhập ghi chú (nếu có)" value={formData.note} onChange={(e) => setFormData({ ...formData, note: e.target.value })} rows={2} style={{ borderRadius: 8 }} />
              </Form.Item>
            </Col>
          </Row>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 16 }}>
            <Button onClick={() => setShowAddModal(false)} style={{ height: 40, borderRadius: 8, padding: '0 24px', fontWeight: 500 }}>Hủy</Button>
            <Button type="primary" htmlType="submit" loading={addLoading} style={{ backgroundColor: '#16a34a', height: 40, borderRadius: 8, fontWeight: 500, padding: '0 24px' }}>
              Thêm nguyên liệu
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Edit Ingredient Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid #f3f4f6', paddingBottom: 16, marginBottom: 16 }}>
            <div style={{ backgroundColor: '#f0fdf4', padding: 8, borderRadius: 8, display: 'flex' }}>
              <EditOutlined style={{ color: '#16a34a', fontSize: 20 }} />
            </div>
            <div style={{ fontSize: 18, fontWeight: 'bold', color: '#111' }}>Sửa nguyên liệu</div>
          </div>
        }
        open={showEditModal}
        onCancel={() => setShowEditModal(false)}
        footer={null}
        className="custom-ingredient-modal"
        closeIcon={<span style={{ fontSize: 16, color: '#9ca3af', padding: 8 }}>✕</span>}
        width={600}
        destroyOnClose
      >
        <Form onFinish={handleEditIngredientSubmit} layout="vertical" initialValues={editFormData}>
          <div style={{ fontWeight: 600, color: '#111', fontSize: 15, marginBottom: 8 }}>Thông tin cơ bản</div>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Tên nguyên liệu" name="name" rules={[{ required: true, message: 'Vui lòng nhập tên' }]}>
                <Input placeholder="Nhập tên nguyên liệu" value={editFormData.name} onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })} style={{ height: 40 }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Đơn vị tính" name="unit_id" rules={[{ required: true, message: 'Vui lòng chọn đơn vị' }]}>
                <Select placeholder="Chọn đơn vị tính" value={editFormData.unit_id} onChange={(value) => setEditFormData({ ...editFormData, unit_id: value })} style={{ height: 40 }}>
                  {units.map((unit) => (<Select.Option key={unit.id} value={unit.id}>{unit.name}</Select.Option>))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <div style={{ fontWeight: 600, color: '#111', fontSize: 15, marginBottom: 8, marginTop: 4 }}>Thông tin tồn kho</div>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Tồn kho hiện tại" name="stock_quantity">
                <InputNumber placeholder="Nhập số lượng tồn kho" min={0} value={editFormData.stock_quantity ?? undefined} onChange={(value) => setEditFormData({ ...editFormData, stock_quantity: value ?? null })} style={{ width: '100%', height: 40, paddingTop: 4 }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Ngưỡng cảnh báo" name="warning_threshold">
                <InputNumber placeholder="Nhập ngưỡng cảnh báo" min={0} value={editFormData.warning_threshold ?? undefined} onChange={(value) => setEditFormData({ ...editFormData, warning_threshold: value ?? null })} style={{ width: '100%', height: 40, paddingTop: 4 }} />
              </Form.Item>
            </Col>
          </Row>


          <Row>
            <Col span={24}>
              <Form.Item label="Ghi chú" name="note">
                <Input.TextArea placeholder="Nhập ghi chú (nếu có)" value={editFormData.note} onChange={(e) => setEditFormData({ ...editFormData, note: e.target.value })} rows={2} style={{ borderRadius: 8 }} />
              </Form.Item>
            </Col>
          </Row>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 16 }}>
            <Button onClick={() => setShowEditModal(false)} style={{ height: 40, borderRadius: 8, padding: '0 24px', fontWeight: 500 }}>Hủy</Button>
            <Button type="primary" htmlType="submit" style={{ backgroundColor: '#16a34a', height: 40, borderRadius: 8, fontWeight: 500, padding: '0 24px' }}>
              Cập nhật
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Import Stock Modal */}
      <Modal
        title="Nhập kho nguyên liệu"
        open={showImportModal}
        onCancel={() => setShowImportModal(false)}
        footer={null}
      >
        <Form onFinish={() => handleImportStock()} layout="vertical">
          <Form.Item label="Số lượng nhập" name="quantity" rules={[{ required: true, message: 'Vui lòng nhập số lượng' }]}>
            <InputNumber
              min={0}
              value={importData.quantity ?? undefined}
              onChange={(value) => setImportData({ ...importData, quantity: value ?? null })}
              style={{ width: '100%' }}
            />
          </Form.Item>
          <Form.Item label="Đơn vị" name="unit_id" rules={[{ required: true, message: 'Vui lòng chọn đơn vị' }]}>\n            <Select
              value={importData.unit_id}
              onChange={(value) => setImportData({ ...importData, unit_id: value })}
              style={{ width: '100%' }}
            >
              {getImportUnitsForIngredient(importData.ingredient_id).map((unit) => (
                <Select.Option key={unit.id} value={unit.id}>
                  {`${unit.name} (${unit.symbol})`}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          {getConvertedImportQuantity() !== null && (
            <div style={{ marginBottom: 16, color: '#1890ff' }}>
              Quy đổi sang đơn vị hiện tại: {fmtQty(getConvertedImportQuantity())} {getUnitById(ingredients.find(i => i.id === importData.ingredient_id)?.unit_id)?.symbol}
            </div>
          )}
          <Form.Item label="Giá nhập (₫)" name="import_price">
            <InputNumber
              min={0}
              value={importData.import_price ?? undefined}
              onChange={(value) => setImportData({ ...importData, import_price: value ?? null })}
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={importLoading}>
              Nhập kho
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Import History Modal */}
      <Modal
        title={`Lịch sử nhập kho - ${historyIngredient?.name}`}
        open={showHistoryModal}
        onCancel={() => setShowHistoryModal(false)}
        footer={null}
        width={800}
      >
        <Table
          columns={[
            { title: 'Ngày nhập', dataIndex: 'created_at', key: 'created_at', render: (date: string) => new Date(date).toLocaleDateString('vi-VN') },
            { title: 'Số lượng', dataIndex: 'quantity', key: 'quantity' },
            { title: 'Giá nhập', dataIndex: 'import_price', key: 'import_price', render: (price: number) => price ? `${price.toLocaleString()}₫` : 'N/A' },
          ]}
          dataSource={importHistory}
          rowKey="id"
          pagination={false}
        />
      </Modal>
    </div>
  );
};

export default Ingredients;
