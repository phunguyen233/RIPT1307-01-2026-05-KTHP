import React, { useEffect, useState } from 'react';
import { Card, Table, Button, Space, Modal, Form, Select, InputNumber, Typography, Row, Col, Input, message } from 'antd';
import { PlusOutlined, DeleteOutlined, ReloadOutlined, EditOutlined, SearchOutlined, ExclamationCircleOutlined } from '@ant-design/icons';

// API Imports (Đảm bảo các file API này đã tồn tại theo chuẩn của nhóm)
import { productAPI } from "../api/productAPI";
import { ingredientAPI, Ingredient } from "../api/ingredientAPI";
import { unitAPI, Unit } from "../api/unitAPI";
import { recipeAPI } from "../api/recipeAPI";

const { Title, Text } = Typography;
const { Option } = Select;
const { confirm } = Modal;

const THEME = {
  primaryGreen: '#16a34a',
  bgPage: '#f8fafc',
  shadowSubtle: '0 4px 18px 0 rgba(0, 0, 0, 0.03)',
  borderLight: '#e2e8f0'
};

const Recipes: React.FC = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [totalCost, setTotalCost] = useState(0);
  const [loading, setLoading] = useState(false);
  
  const [searchText, setSearchText] = useState("");
  const [editingRecipeId, setEditingRecipeId] = useState<number | null>(null);

  const [products, setProducts] = useState<any[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [recipesList, setRecipesList] = useState<any[]>([]);
  const [recipeIngredients, setRecipeIngredients] = useState<any[]>([]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [productsData, ingredientsData, unitsData, recipesData] = await Promise.all([
        productAPI.getAll().catch(() => []),
        ingredientAPI.getAll().catch(() => []),
        unitAPI.getAll().catch(() => []),
        recipeAPI.getAll().catch(() => []),
      ]);

      setProducts(productsData || []);
      setIngredients(ingredientsData || []);
      setUnits(unitsData || []);
      setRecipesList(recipesData || []);
      
      // Fetch all recipe ingredients
      try {
        const allIngredientsRes = await Promise.all(
          (recipesData || []).map(recipe => 
            recipeAPI.getIngredientsByRecipe(recipe.id).catch(() => [])
          )
        );
        const flattened = allIngredientsRes.flat();
        setRecipeIngredients(flattened || []);
      } catch (e) {
        setRecipeIngredients([]);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      message.error("Lỗi khi tải dữ liệu từ máy chủ!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleDelete = (id: number) => {
    confirm({
      title: 'Xác nhận xóa công thức',
      icon: <ExclamationCircleOutlined style={{ color: '#ef4444' }} />,
      content: 'Bạn có chắc chắn muốn xóa công thức này không? Thao tác này không thể hoàn tác.',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await recipeAPI.delete(id);
          message.success('Đã xóa công thức thành công!');
          fetchAllData();
        } catch (error) {
          message.error('Lỗi khi xóa công thức!');
        }
      },
    });
  };

  const handleEdit = (record: any) => {
    setEditingRecipeId(record.id);
    form.setFieldsValue({
      product_id: record.product_id,
    });
    // Load existing recipe ingredients
    const existingIngredients = recipeIngredients.filter(ri => ri.recipe_id === record.id);
    if (existingIngredients.length > 0) {
      form.setFieldsValue({
        recipe_items: existingIngredients.map(ri => ({
          ingredient_id: ri.ingredient_id,
          quantity: ri.quantity,
          unit_id: ri.unit_id,
        }))
      });
    } else {
      form.setFieldsValue({
        recipe_items: [{}],
      });
    }
    setTotalCost(0);
    setIsModalVisible(true);
  };

  const tableData = recipesList.map(recipe => {
    const product = products.find(p => p.id === recipe.product_id);
    return {
      ...recipe,
      key: recipe.id,
      productName: product ? product.name : 'Sản phẩm không xác định',
    };
  }).filter(item => item.productName.toLowerCase().includes(searchText.toLowerCase()));

  const columns = [
    { 
      title: 'Tên sản phẩm', 
      dataIndex: 'productName', 
      key: 'productName',
      render: (text: string) => <Text strong style={{ color: '#334155' }}>{text}</Text>
    },
    { 
      // Cột giá cost chờ Backend trả về biến total_cost
      title: 'Giá cost nguyên liệu', 
      dataIndex: 'total_cost', 
      key: 'total_cost',
      render: (val: number) => <Text strong>{(val || 0).toLocaleString()} đ</Text> 
    },
    { 
      title: 'Hành động', 
      key: 'action', 
      render: (_: any, record: any) => (
        <Space size="middle">
          <Button type="link" size="small" icon={<EditOutlined />} style={{ color: THEME.primaryGreen }} onClick={() => handleEdit(record)}>
            Chỉnh sửa
          </Button>
          <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)}>
            Xóa
          </Button>
        </Space>
      )
    },
  ];

  const handleValuesChange = (_: any, allValues: any) => {
    const items = allValues.recipe_items || [];
    let currentTotal = 0;
    
    items.forEach((item: any) => {
      if (item && item.ingredient_id && item.quantity) {
        const selectedIngredient = ingredients.find(ing => ing.id === item.ingredient_id);
        if (selectedIngredient && selectedIngredient.avg_price) {
          currentTotal += (Number(item.quantity) * Number(selectedIngredient.avg_price));
        }
      }
    });
    
    setTotalCost(currentTotal);
  };

  const handleFinish = async (values: any) => {
    try {
      setLoading(true);
      
      // Filter out empty recipe items
      const validItems = (values.recipe_items || []).filter((item: any) => item && item.ingredient_id && item.quantity && item.unit_id);
      
      if (validItems.length === 0) {
        message.error('Vui lòng thêm ít nhất một nguyên liệu!');
        setLoading(false);
        return;
      }

      let recipeId = editingRecipeId;
      
      if (editingRecipeId) {
        // Update existing recipe
        await recipeAPI.update(editingRecipeId, { product_id: values.product_id });
        
        // Delete old ingredients
        const oldIngredients = recipeIngredients.filter(ri => ri.recipe_id === editingRecipeId);
        for (const ing of oldIngredients) {
          await recipeAPI.deleteIngredient(ing.id);
        }
      } else {
        // Create new recipe
        const newRecipe = await recipeAPI.create({ product_id: values.product_id });
        recipeId = newRecipe.id;
      }

      // Add new ingredients
      for (const item of validItems) {
        await recipeAPI.addIngredient({
          recipe_id: recipeId!,
          ingredient_id: item.ingredient_id,
          quantity: item.quantity,
          unit_id: item.unit_id,
        });
      }

      message.success(editingRecipeId ? 'Cập nhật công thức thành công!' : 'Tạo công thức thành công!');
      setIsModalVisible(false);
      form.resetFields();
      setTotalCost(0);
      setEditingRecipeId(null);
      fetchAllData();
    } catch (error: any) {
      const errorMsg = error?.response?.data?.error || 'Lỗi khi lưu công thức!';
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px', backgroundColor: THEME.bgPage, minHeight: '100vh' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <Title level={4} style={{ margin: 0, color: '#1e293b' }}>Quản lý công thức</Title>
          <Text type="secondary">Danh sách các công thức sản phẩm và giá cost nguyên liệu thực tế</Text>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchAllData} loading={loading}>Tải lại</Button>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            style={{ backgroundColor: THEME.primaryGreen }}
            onClick={() => {
              setEditingRecipeId(null);
              form.resetFields();
              form.setFieldsValue({
                recipe_items: [{}],
              });
              setTotalCost(0);
              setIsModalVisible(true);
            }}
          >
            Thêm công thức
          </Button>
        </Space>
      </div>

      <Card bordered={false} style={{ borderRadius: '12px', boxShadow: THEME.shadowSubtle }}>
        <Input 
          placeholder="Tìm kiếm công thức..." 
          prefix={<SearchOutlined style={{ color: '#cbd5e1' }} />} 
          style={{ width: 300, marginBottom: '20px', borderRadius: '8px' }} 
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          allowClear
        />
        <Table 
          columns={columns} 
          dataSource={tableData} 
          rowKey="id" 
          loading={loading}
          locale={{ emptyText: "Chưa có công thức nào" }}
          pagination={{ 
            pageSize: 6,
            // Đã fix: Hiện phân trang đẹp theo dạng Trang X / Y
            showTotal: (total, range) => {
              const currentPage = Math.ceil(range[1] / 6);
              const totalPages = Math.ceil(total / 6);
              return `Trang ${currentPage} / ${totalPages}`;
            }
          }} 
        />
      </Card>

      <Modal 
        title={<span style={{ fontSize: '18px', fontWeight: 600 }}>{editingRecipeId ? 'Chỉnh sửa công thức' : 'Tạo công thức mới'}</span>}
        open={isModalVisible} 
        onCancel={() => {
          setIsModalVisible(false);
          setEditingRecipeId(null);
          form.resetFields();
          setTotalCost(0);
        }}
        width={850}
        footer={[
          <Button key="back" onClick={() => {
            setIsModalVisible(false);
            setEditingRecipeId(null);
            form.resetFields();
            setTotalCost(0);
          }}>Hủy</Button>,
          <Button key="submit" type="primary" style={{ backgroundColor: THEME.primaryGreen }} onClick={() => form.submit()} loading={loading}>
            {editingRecipeId ? 'Cập nhật công thức' : 'Lưu công thức'}
          </Button>,
        ]}
      >
        <Form 
          form={form} 
          layout="vertical" 
          onFinish={handleFinish} 
          onValuesChange={handleValuesChange}
          style={{ marginTop: '20px' }}
        >
          <Form.Item 
            name="product_id" 
            label={<Text strong>Chọn sản phẩm <span style={{color: 'red'}}>*</span></Text>} 
            rules={[{ required: true, message: 'Vui lòng chọn sản phẩm!' }]}
          >
            <Select placeholder="Chọn sản phẩm để tạo công thức" size="large" showSearch optionFilterProp="children">
              {products.map(product => (
                <Option key={product.id} value={product.id}>{product.name}</Option>
              ))}
            </Select>
          </Form.Item>

          <div style={{ marginTop: '24px', marginBottom: '12px', fontWeight: 600, fontSize: '15px' }}>
            Danh sách nguyên liệu
          </div>
          
          <Row gutter={12} style={{ marginBottom: '8px', paddingBottom: '8px', borderBottom: `1px solid ${THEME.borderLight}`, color: '#64748b', fontSize: '13px', fontWeight: 500 }}>
            <Col span={7}>Nguyên liệu</Col>
            <Col span={4}>Số lượng</Col>
            <Col span={5}>Đơn vị</Col>
            <Col span={6}>Giá cost (Tự động)</Col>
            <Col span={2} style={{ textAlign: 'center' }}>Xóa</Col>
          </Row>

          <Form.List name="recipe_items" initialValue={[{}]}>
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Row key={key} gutter={12} style={{ marginBottom: '12px', alignItems: 'center' }}>
                    <Col span={7}>
                      <Form.Item {...restField} name={[name, 'ingredient_id']} rules={[{ required: true, message: 'Thiếu' }]} style={{ marginBottom: 0 }}>
                        <Select placeholder="Chọn nguyên liệu" showSearch optionFilterProp="children">
                          {ingredients.map(ing => (
                            <Option key={ing.id} value={ing.id}>{ing.name}</Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={4}>
                      <Form.Item {...restField} name={[name, 'quantity']} rules={[{ required: true, message: 'Thiếu' }]} style={{ marginBottom: 0 }}>
                        <InputNumber placeholder="0" min={0.01} step={0.1} style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={5}>
                      <Form.Item {...restField} name={[name, 'unit_id']} rules={[{ required: true, message: 'Thiếu' }]} style={{ marginBottom: 0 }}>
                        <Select placeholder="Chọn đơn vị">
                          {units.map(unit => (
                            <Option key={unit.id} value={unit.id}>{unit.symbol || unit.name}</Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item style={{ marginBottom: 0 }}>
                        <Input placeholder="Tính tự động" disabled style={{ backgroundColor: '#f8fafc', color: THEME.primaryGreen, fontWeight: 500 }} />
                      </Form.Item>
                    </Col>
                    <Col span={2} style={{ textAlign: 'center' }}>
                      <Button 
                        type="text" 
                        danger 
                        icon={<DeleteOutlined style={{ fontSize: '16px' }} />} 
                        onClick={() => {
                          remove(name);
                          setTimeout(() => handleValuesChange({}, form.getFieldsValue()), 0);
                        }} 
                      />
                    </Col>
                  </Row>
                ))}
                
                <Form.Item style={{ marginTop: '16px', marginBottom: '24px' }}>
                  <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />} style={{ color: THEME.primaryGreen, borderColor: '#bbf7d0', backgroundColor: '#f0fdf4' }}>
                    Thêm nguyên liệu khác
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px', border: `1px solid ${THEME.borderLight}` }}>
            <Text strong style={{ color: '#475569' }}>Tổng cost nguyên liệu dự kiến:</Text>
            <Text strong style={{ color: THEME.primaryGreen, fontSize: '18px' }}>
              {totalCost.toLocaleString()} đ
            </Text>
          </div>

        </Form>
      </Modal>
    </div>
  );
};

export default Recipes;