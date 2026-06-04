import React, { useMemo, useState } from 'react';
import { Card, Row, Col, Typography, Button, Modal, DatePicker, Radio, Checkbox, Select, InputNumber, Space, message, Form } from 'antd';
import { FileExcelOutlined, BarChartOutlined, ShoppingCartOutlined, ShopOutlined, UserOutlined, DatabaseOutlined, AppstoreOutlined, PartitionOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import { saveAs } from 'file-saver';
import ExcelJS from 'exceljs';
import reportAPI from '../api/reportAPI';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

interface ReportField {
  label: string;
  value: string;
}

interface ReportOption {
  title: string;
  radioOptions: { label: string; value: string }[];
  fields: ReportField[];
  filters?: { label: string; value: string }[];
}

type ReportOptions = Record<string, ReportOption>;

const cardItems = [
  { key: 'revenue', label: 'Doanh thu', icon: <BarChartOutlined /> },
  { key: 'orders', label: 'Đơn hàng', icon: <ShoppingCartOutlined /> },
  { key: 'products', label: 'Sản phẩm', icon: <AppstoreOutlined /> },
  { key: 'customers', label: 'Khách hàng', icon: <UserOutlined /> },
  { key: 'inventory', label: 'Kho', icon: <DatabaseOutlined /> },
  { key: 'ingredients', label: 'Nguyên liệu', icon: <PartitionOutlined /> },
  { key: 'recipes', label: 'Công thức', icon: <ShopOutlined /> },
];

const reportOptions: ReportOptions = {
  revenue: {
    title: 'XUẤT BÁO CÁO DOANH THU',
    radioOptions: [
      { label: 'Tổng quan kinh doanh', value: 'overview' },
      { label: 'Doanh thu theo ngày', value: 'daily' },
      { label: 'Doanh thu theo tháng', value: 'monthly' },
      { label: 'Lợi nhuận', value: 'profit' },
      { label: 'Top sản phẩm bán chạy', value: 'top_products' },
      { label: 'Top khách hàng', value: 'top_customers' },
      { label: 'Chi phí nhập nguyên liệu', value: 'ingredient_cost' },
    ],
    fields: [
      { label: 'Tổng doanh thu', value: 'total_revenue' },
      { label: 'Tổng đơn hàng', value: 'total_orders' },
      { label: 'Giá trị đơn trung bình', value: 'avg_order_value' },
      { label: 'Tổng khách hàng', value: 'total_customers' },
      { label: 'Khách hàng mới', value: 'new_customers' },
      { label: 'Giá vốn hàng bán', value: 'cogs' },
      { label: 'Lợi nhuận gộp', value: 'gross_profit' },
      { label: 'Ngày', value: 'date' },
      { label: 'Tháng', value: 'date' },
      { label: 'Mã sản phẩm', value: 'product_code' },
      { label: 'Tên sản phẩm', value: 'product_name' },
      { label: 'Danh mục', value: 'category' },
      { label: 'Số lượng bán', value: 'quantity_sold' },
      { label: 'Doanh thu sản phẩm', value: 'revenue' },
      { label: 'Khách hàng', value: 'customer_name' },
      { label: 'Tổng chi tiêu', value: 'total_spent' },
    ],
  },
  orders: {
    title: 'XUẤT BÁO CÁO ĐƠN HÀNG',
    radioOptions: [
      { label: 'Danh sách đơn hàng', value: 'order_list' },
      { label: 'Đơn hàng theo trạng thái', value: 'status' },
      { label: 'Đơn hàng theo khách hàng', value: 'customer' },
      { label: 'Đơn hàng theo sản phẩm', value: 'product' },
      { label: 'Đơn hàng bị hủy', value: 'canceled' },
    ],
    filters: [
      { label: 'Hoàn thành', value: 'completed' },
      { label: 'Chờ xử lý', value: 'pending' },
      { label: 'Đã hủy', value: 'canceled' },
    ],
    fields: [
      { label: 'Mã đơn hàng', value: 'order_code' },
      { label: 'Khách hàng', value: 'customer' },
      { label: 'Số điện thoại', value: 'phone' },
      { label: 'Địa chỉ giao hàng', value: 'shipping_address' },
      { label: 'Sản phẩm trong đơn hàng', value: 'order_products' },
      { label: 'Tổng tiền', value: 'total_amount' },
      { label: 'Trạng thái', value: 'status' },
      { label: 'Ngày tạo', value: 'created_at' },
      { label: 'Số đơn hàng', value: 'order_count' },
      { label: 'Doanh thu', value: 'total_revenue' },
      { label: 'Mã khách hàng', value: 'customer_code' },
      { label: 'Sản phẩm', value: 'product_name' },
      { label: 'Số lượng bán', value: 'quantity_sold' },
      { label: 'Doanh thu sản phẩm', value: 'revenue' },
    ],
  },
  products: {
    title: 'XUẤT BÁO CÁO SẢN PHẨM',
    radioOptions: [
      { label: 'Danh sách sản phẩm', value: 'product_list' },
      { label: 'Tồn kho sản phẩm', value: 'stock' },
      { label: 'Sản phẩm bán chạy', value: 'best_sellers' },
      { label: 'Doanh thu theo sản phẩm', value: 'revenue' },
      { label: 'Lợi nhuận theo sản phẩm', value: 'profit' },
    ],
    filters: [],
    fields: [
      { label: 'Mã sản phẩm', value: 'product_code' },
      { label: 'Tên sản phẩm', value: 'product_name' },
      { label: 'Danh mục', value: 'category' },
      { label: 'Giá bán', value: 'sale_price' },
      { label: 'Giá vốn', value: 'cost_price' },
      { label: 'Tổng số lượng bán', value: 'quantity_sold' },
      { label: 'Doanh thu', value: 'revenue' },
      { label: 'Lợi nhuận', value: 'profit' },
    ],
  },
  customers: {
    title: 'XUẤT BÁO CÁO KHÁCH HÀNG',
    radioOptions: [
      { label: 'Danh sách khách hàng', value: 'customer_list' },
      { label: 'Khách hàng VIP', value: 'vip' },
      { label: 'Khách hàng mới', value: 'new_customers' },
      { label: 'Lịch sử mua hàng', value: 'purchase_history' },
    ],
    filters: [],
    fields: [
      { label: 'Mã khách hàng', value: 'customer_code' },
      { label: 'Họ tên', value: 'customer_name' },
      { label: 'Số điện thoại', value: 'phone' },
      { label: 'Địa chỉ', value: 'address' },
      { label: 'Tổng chi tiêu', value: 'total_spent' },
      { label: 'Số đơn hàng', value: 'order_count' },
      { label: 'Ngày tham gia', value: 'created_at' },
    ],
  },
  inventory: {
    title: 'XUẤT BÁO CÁO KHO',
    radioOptions: [
      { label: 'Nhập kho', value: 'incoming' },
      { label: 'Xuất kho', value: 'outgoing' },
      { label: 'Nhập - Xuất - Tồn', value: 'in_out_stock' },
      { label: 'Lịch sử biến động kho', value: 'history' },
    ],
    filters: [],
    fields: [
      { label: 'Nguyên liệu', value: 'ingredient_name' },
      { label: 'Loại giao dịch', value: 'transaction_type' },
      { label: 'Số lượng', value: 'quantity' },
      { label: 'Giá nhập', value: 'cost_price' },
      { label: 'Ghi chú', value: 'note' },
      { label: 'Ngày giao dịch', value: 'transaction_date' },
    ],
  },
  ingredients: {
    title: 'XUẤT BÁO CÁO NGUYÊN LIỆU',
    radioOptions: [
      { label: 'Danh sách nguyên liệu', value: 'ingredient_list' },
      { label: 'Tồn kho nguyên liệu', value: 'stock' },
      { label: 'Nguyên liệu sắp hết', value: 'low_stock' },
      { label: 'Lịch sử nhập nguyên liệu', value: 'incoming_history' },
      { label: 'Lịch sử xuất nguyên liệu', value: 'outgoing_history' },
    ],
    filters: [],
    fields: [
      { label: 'Tên nguyên liệu', value: 'ingredient_name' },
      { label: 'Đơn vị', value: 'unit' },
      { label: 'Tồn kho hiện tại', value: 'stock' },
      { label: 'Giá trung bình', value: 'avg_cost' },
      { label: 'Tổng giá trị tồn kho', value: 'stock_value' },
      { label: 'Ngày giao dịch', value: 'transaction_date' },
    ],
  },
  recipes: {
    title: 'XUẤT BÁO CÁO CÔNG THỨC',
    radioOptions: [
      { label: 'Danh sách công thức', value: 'recipe_list' },
      { label: 'Chi tiết công thức sản phẩm', value: 'recipe_details' },
      { label: 'Chi phí nguyên liệu theo công thức', value: 'ingredient_cost' },
    ],
    filters: [],
    fields: [
      { label: 'Tên sản phẩm', value: 'product_name' },
      { label: 'Nguyên liệu', value: 'ingredients' },
      { label: 'Định lượng', value: 'quantity' },
      { label: 'Đơn vị', value: 'unit' },
      { label: 'Giá trung bình nguyên liệu', value: 'avg_cost' },
      { label: 'Chi phí nguyên liệu', value: 'ingredient_cost' },
    ],
  },
};

const reportFieldsByType: Record<string, Record<string, ReportField[]>> = {
  revenue: {
    overview: [
      { label: 'Tổng doanh thu', value: 'total_revenue' },
      { label: 'Tổng đơn hàng', value: 'total_orders' },
      { label: 'Giá trị đơn trung bình', value: 'avg_order_value' },
      { label: 'Tổng khách hàng', value: 'total_customers' },
      { label: 'Khách hàng mới', value: 'new_customers' },
      { label: 'Giá vốn hàng bán', value: 'cogs' },
      { label: 'Lợi nhuận gộp', value: 'gross_profit' },
    ],
    daily: [
      { label: 'Ngày', value: 'date' },
      { label: 'Tổng đơn hàng', value: 'total_orders' },
      { label: 'Tổng doanh thu', value: 'total_revenue' },
      { label: 'Giá trị đơn trung bình', value: 'avg_order_value' },
    ],
    monthly: [
      { label: 'Tháng', value: 'date' },
      { label: 'Tổng đơn hàng', value: 'total_orders' },
      { label: 'Tổng doanh thu', value: 'total_revenue' },
      { label: 'Giá trị đơn trung bình', value: 'avg_order_value' },
    ],
    profit: [
      { label: 'Tổng doanh thu', value: 'total_revenue' },
      { label: 'Giá vốn', value: 'cogs' },
      { label: 'Lợi nhuận gộp', value: 'gross_profit' },
    ],
    top_products: [
      { label: 'Mã sản phẩm', value: 'product_code' },
      { label: 'Tên sản phẩm', value: 'product_name' },
      { label: 'Danh mục', value: 'category' },
      { label: 'Tổng số lượng bán', value: 'quantity_sold' },
      { label: 'Doanh thu sản phẩm', value: 'revenue' },
    ],
    top_customers: [
      { label: 'Mã khách hàng', value: 'customer_code' },
      { label: 'Tên khách hàng', value: 'customer_name' },
      { label: 'Số điện thoại', value: 'phone' },
      { label: 'Tổng chi tiêu', value: 'total_spent' },
      { label: 'Số đơn hàng', value: 'order_count' },
    ],
    ingredient_cost: [
      { label: 'Tên nguyên liệu', value: 'ingredient_name' },
      { label: 'Tổng số lượng', value: 'total_quantity' },
      { label: 'Tổng chi phí', value: 'total_cost' },
    ],
  },
  orders: {
    order_list: [
      { label: 'Mã đơn hàng', value: 'order_code' },
      { label: 'Khách hàng', value: 'customer' },
      { label: 'Địa chỉ giao hàng', value: 'shipping_address' },
      { label: 'Sản phẩm trong đơn hàng', value: 'order_products' },
      { label: 'Tổng tiền', value: 'total_amount' },
      { label: 'Trạng thái', value: 'status' },
      { label: 'Ngày tạo', value: 'created_at' },
    ],
    status: [
      { label: 'Trạng thái', value: 'status' },
      { label: 'Số đơn hàng', value: 'order_count' },
      { label: 'Doanh thu', value: 'total_revenue' },
    ],
    customer: [
      { label: 'Mã khách hàng', value: 'customer_code' },
      { label: 'Khách hàng', value: 'customer' },
      { label: 'Số điện thoại', value: 'phone' },
      { label: 'Số đơn hàng', value: 'order_count' },
      { label: 'Tổng chi tiêu', value: 'total_spent' },
    ],
    product: [
      { label: 'Mã sản phẩm', value: 'product_code' },
      { label: 'Tên sản phẩm', value: 'product_name' },
      { label: 'Số lượng bán', value: 'quantity_sold' },
      { label: 'Doanh thu sản phẩm', value: 'revenue' },
    ],
    canceled: [
      { label: 'Mã đơn hàng', value: 'order_code' },
      { label: 'Khách hàng', value: 'customer' },
      { label: 'Địa chỉ giao hàng', value: 'shipping_address' },
      { label: 'Sản phẩm trong đơn hàng', value: 'order_products' },
      { label: 'Tổng tiền', value: 'total_amount' },
      { label: 'Trạng thái', value: 'status' },
      { label: 'Ngày tạo', value: 'created_at' },
    ],
  },
  products: {
    product_list: [
      { label: 'Mã sản phẩm', value: 'product_code' },
      { label: 'Tên sản phẩm', value: 'product_name' },
      { label: 'Danh mục', value: 'category' },
      { label: 'Giá bán', value: 'sale_price' },
      { label: 'Giá vốn', value: 'cost_price' },
      { label: 'Tổng số lượng bán', value: 'quantity_sold' },
      { label: 'Doanh thu', value: 'revenue' },
      { label: 'Lợi nhuận', value: 'profit' },
    ],
    stock: [
      { label: 'Mã sản phẩm', value: 'product_code' },
      { label: 'Tên sản phẩm', value: 'product_name' },
      { label: 'Danh mục', value: 'category' },
      { label: 'Giá bán', value: 'sale_price' },
      { label: 'Giá vốn', value: 'cost_price' },
      { label: 'Tổng số lượng bán', value: 'quantity_sold' },
      { label: 'Doanh thu', value: 'revenue' },
      { label: 'Lợi nhuận', value: 'profit' },
    ],
    best_sellers: [
      { label: 'Mã sản phẩm', value: 'product_code' },
      { label: 'Tên sản phẩm', value: 'product_name' },
      { label: 'Danh mục', value: 'category' },
      { label: 'Tổng số lượng bán', value: 'quantity_sold' },
      { label: 'Doanh thu', value: 'revenue' },
      { label: 'Lợi nhuận', value: 'profit' },
    ],
    revenue: [
      { label: 'Mã sản phẩm', value: 'product_code' },
      { label: 'Tên sản phẩm', value: 'product_name' },
      { label: 'Danh mục', value: 'category' },
      { label: 'Tổng số lượng bán', value: 'quantity_sold' },
      { label: 'Doanh thu', value: 'revenue' },
      { label: 'Lợi nhuận', value: 'profit' },
    ],
    profit: [
      { label: 'Mã sản phẩm', value: 'product_code' },
      { label: 'Tên sản phẩm', value: 'product_name' },
      { label: 'Danh mục', value: 'category' },
      { label: 'Tổng số lượng bán', value: 'quantity_sold' },
      { label: 'Doanh thu', value: 'revenue' },
      { label: 'Lợi nhuận', value: 'profit' },
    ],
  },
  customers: {
    customer_list: [
      { label: 'Mã khách hàng', value: 'customer_code' },
      { label: 'Họ tên', value: 'customer_name' },
      { label: 'Số điện thoại', value: 'phone' },
      { label: 'Địa chỉ', value: 'address' },
      { label: 'Tổng chi tiêu', value: 'total_spent' },
      { label: 'Số đơn hàng', value: 'order_count' },
      { label: 'Ngày tham gia', value: 'created_at' },
    ],
    vip: [
      { label: 'Mã khách hàng', value: 'customer_code' },
      { label: 'Họ tên', value: 'customer_name' },
      { label: 'Số điện thoại', value: 'phone' },
      { label: 'Địa chỉ', value: 'address' },
      { label: 'Tổng chi tiêu', value: 'total_spent' },
      { label: 'Số đơn hàng', value: 'order_count' },
      { label: 'Ngày tham gia', value: 'created_at' },
    ],
    new_customers: [
      { label: 'Mã khách hàng', value: 'customer_code' },
      { label: 'Họ tên', value: 'customer_name' },
      { label: 'Số điện thoại', value: 'phone' },
      { label: 'Địa chỉ', value: 'address' },
      { label: 'Tổng chi tiêu', value: 'total_spent' },
      { label: 'Số đơn hàng', value: 'order_count' },
      { label: 'Ngày tham gia', value: 'created_at' },
    ],
    purchase_history: [
      { label: 'Mã khách hàng', value: 'customer_code' },
      { label: 'Họ tên', value: 'customer_name' },
      { label: 'Số điện thoại', value: 'phone' },
      { label: 'Địa chỉ', value: 'address' },
      { label: 'Tổng chi tiêu', value: 'total_spent' },
      { label: 'Số đơn hàng', value: 'order_count' },
      { label: 'Ngày tham gia', value: 'created_at' },
    ],
  },
  inventory: {
    incoming: [
      { label: 'Nguyên liệu', value: 'ingredient_name' },
      { label: 'Loại giao dịch', value: 'transaction_type' },
      { label: 'Số lượng', value: 'quantity' },
      { label: 'Giá nhập', value: 'cost_price' },
      { label: 'Ghi chú', value: 'note' },
      { label: 'Ngày giao dịch', value: 'transaction_date' },
    ],
    outgoing: [
      { label: 'Nguyên liệu', value: 'ingredient_name' },
      { label: 'Loại giao dịch', value: 'transaction_type' },
      { label: 'Số lượng', value: 'quantity' },
      { label: 'Ghi chú', value: 'note' },
      { label: 'Ngày giao dịch', value: 'transaction_date' },
    ],
    in_out_stock: [
      { label: 'Nguyên liệu', value: 'ingredient_name' },
      { label: 'Loại giao dịch', value: 'transaction_type' },
      { label: 'Số lượng', value: 'quantity' },
      { label: 'Giá nhập', value: 'cost_price' },
      { label: 'Ghi chú', value: 'note' },
      { label: 'Ngày giao dịch', value: 'transaction_date' },
    ],
    history: [
      { label: 'Nguyên liệu', value: 'ingredient_name' },
      { label: 'Loại giao dịch', value: 'transaction_type' },
      { label: 'Số lượng', value: 'quantity' },
      { label: 'Giá nhập', value: 'cost_price' },
      { label: 'Ghi chú', value: 'note' },
      { label: 'Ngày giao dịch', value: 'transaction_date' },
    ],
  },
  ingredients: {
    ingredient_list: [
      { label: 'Tên nguyên liệu', value: 'ingredient_name' },
      { label: 'Đơn vị', value: 'unit' },
      { label: 'Tồn kho hiện tại', value: 'stock' },
      { label: 'Giá trung bình', value: 'avg_cost' },
      { label: 'Tổng giá trị tồn kho', value: 'stock_value' },
    ],
    stock: [
      { label: 'Tên nguyên liệu', value: 'ingredient_name' },
      { label: 'Đơn vị', value: 'unit' },
      { label: 'Tồn kho hiện tại', value: 'stock' },
      { label: 'Giá trung bình', value: 'avg_cost' },
      { label: 'Tổng giá trị tồn kho', value: 'stock_value' },
    ],
    low_stock: [
      { label: 'Tên nguyên liệu', value: 'ingredient_name' },
      { label: 'Đơn vị', value: 'unit' },
      { label: 'Tồn kho hiện tại', value: 'stock' },
      { label: 'Giá trung bình', value: 'avg_cost' },
      { label: 'Tổng giá trị tồn kho', value: 'stock_value' },
    ],
    incoming_history: [
      { label: 'Tên nguyên liệu', value: 'ingredient_name' },
      { label: 'Đơn vị', value: 'unit' },
      { label: 'Số lượng', value: 'stock' },
      { label: 'Giá trung bình', value: 'avg_cost' },
      { label: 'Tổng giá trị tồn kho', value: 'stock_value' },
      { label: 'Ngày giao dịch', value: 'transaction_date' },
    ],
    outgoing_history: [
      { label: 'Tên nguyên liệu', value: 'ingredient_name' },
      { label: 'Đơn vị', value: 'unit' },
      { label: 'Số lượng', value: 'stock' },
      { label: 'Giá trung bình', value: 'avg_cost' },
      { label: 'Tổng giá trị tồn kho', value: 'stock_value' },
      { label: 'Ngày giao dịch', value: 'transaction_date' },
    ],
  },
  recipes: {
    recipe_list: [
      { label: 'Tên sản phẩm', value: 'product_name' },
      { label: 'Nguyên liệu', value: 'ingredients' },
    ],
    recipe_details: [
      { label: 'Tên sản phẩm', value: 'product_name' },
      { label: 'Nguyên liệu', value: 'ingredients' },
      { label: 'Định lượng', value: 'quantity' },
      { label: 'Đơn vị', value: 'unit' },
      { label: 'Giá trung bình nguyên liệu', value: 'avg_cost' },
      { label: 'Chi phí nguyên liệu', value: 'ingredient_cost' },
    ],
    ingredient_cost: [
      { label: 'Tên sản phẩm', value: 'product_name' },
      { label: 'Nguyên liệu', value: 'ingredients' },
      { label: 'Định lượng', value: 'quantity' },
      { label: 'Đơn vị', value: 'unit' },
      { label: 'Giá trung bình nguyên liệu', value: 'avg_cost' },
      { label: 'Chi phí nguyên liệu', value: 'ingredient_cost' },
    ],
  },
};

const getColumnLetter = (col: number) => {
  let letter = '';
  while (col > 0) {
    const remainder = (col - 1) % 26;
    letter = String.fromCharCode(65 + remainder) + letter;
    col = Math.floor((col - 1) / 26);
  }
  return letter;
};

const exportExcelReport = async (
  title: string,
  selectedFields: ReportField[],
  rows: any[],
  startDate?: string,
  endDate?: string
) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(title);
  const lastColumn = getColumnLetter(selectedFields.length || 1);

  worksheet.mergeCells(`A1:${lastColumn}1`);
  const titleCell = worksheet.getCell('A1');
  titleCell.value = title;
  titleCell.font = { bold: true, size: 18 };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

  worksheet.addRow([]);
  worksheet.addRow([`Từ ngày: ${startDate || ''}`]);
  worksheet.addRow([`Đến ngày: ${endDate || ''}`]);
  worksheet.addRow([`Ngày xuất: ${dayjs().format('DD/MM/YYYY HH:mm')}`]);
  worksheet.addRow([]);

  const headerRow = worksheet.addRow(selectedFields.map((field) => field.label));
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF52C41A' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      right: { style: 'thin' },
      bottom: { style: 'thin' },
    };
  });

  rows.forEach((row) => {
    const values = selectedFields.map((field) => {
      const value = row[field.value];
      if (value === null || typeof value === 'undefined') return '';
      if (typeof value === 'object') return JSON.stringify(value);
      return value;
    });
    worksheet.addRow(values);
  });

  const headerRowNumber = headerRow.number;
  worksheet.eachRow((row) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        right: { style: 'thin' },
        bottom: { style: 'thin' },
      };

      if (typeof cell.value === 'number') {
        const headerText = worksheet.getRow(headerRowNumber).getCell(cell.col).value?.toString() || '';
        if (/(doanh thu|tổng tiền|tổng chi|giá|chi phí|giá bán|giá vốn)/i.test(headerText)) {
          cell.numFmt = '#,##0';
        }
      }
    });
  });

  worksheet.columns.forEach((column) => {
    let maxLength = 10;
    column.eachCell?.({ includeEmpty: true }, (cell) => {
      const value = cell.value;
      const length = value ? value.toString().length : 0;
      if (length > maxLength) {
        maxLength = length;
      }
    });
    column.width = maxLength + 5;
  });

  worksheet.views = [{ state: 'frozen', ySplit: headerRowNumber }];

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  saveAs(blob, `${title.replace(/\s+/g, '_')}_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`);
};

const categoryOptions = [
  { label: 'Tất cả', value: 'all' },
  { label: 'Thức ăn', value: 'food' },
  { label: 'Thức uống', value: 'drink' },
];

const productOptions = [
  { label: 'Tất cả sản phẩm', value: 'all' },
  { label: 'Bánh mì', value: 'bread' },
  { label: 'Trà sữa', value: 'milk_tea' },
];

function Reports() {
  const [activeReport, setActiveReport] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();

  const reportConfig = useMemo(() => {
    return activeReport ? reportOptions[activeReport as keyof typeof reportOptions] : null;
  }, [activeReport]);

  const getFieldOptions = (reportKey: string, type?: string) => {
    if (!reportKey) return [];
    if (type && reportFieldsByType[reportKey]?.[type]) {
      return reportFieldsByType[reportKey][type];
    }
    return reportOptions[reportKey]?.fields ?? [];
  };

  const openReportModal = (reportKey: string) => {
    const config = reportOptions[reportKey as keyof typeof reportOptions];
    const initialType = config.radioOptions?.[0]?.value;
    const initialFields = getFieldOptions(reportKey, initialType);

    setActiveReport(reportKey);
    setModalVisible(true);
    form.resetFields();
    form.setFieldsValue({
      dateRange: [dayjs().startOf('month'), dayjs().endOf('month')],
      type: initialType,
      fields: initialFields.map((field) => field.value),
      filterStatus: ['completed', 'pending', 'canceled'],
      category: 'all',
      product: 'all',
      vipThreshold: 1000000,
      format: 'excel',
    });
  };

  const handleFormValuesChange = (changedValues: any, allValues: any) => {
    if (!activeReport) return;

    if (changedValues.type) {
      const typeFields = getFieldOptions(activeReport, changedValues.type);
      const currentFields = allValues.fields || [];
      const validFields = currentFields.filter((fieldValue: string) =>
        typeFields.some((field) => field.value === fieldValue)
      );

      if (validFields.length > 0) {
        form.setFieldsValue({ fields: validFields });
      } else {
        form.setFieldsValue({ fields: typeFields.map((field) => field.value) });
      }
    }
  };

  const handleExport = async (values: any) => {
    if (!activeReport || !reportConfig) {
      message.error('Loại báo cáo không hợp lệ. Vui lòng thử lại.');
      return;
    }

    if (!Object.prototype.hasOwnProperty.call(reportOptions, activeReport)) {
      message.error('Loại báo cáo không hợp lệ. Vui lòng chọn lại.');
      return;
    }

    try {
      const params: Record<string, any> = {
        type: values.type,
        category: values.category,
        product: values.product,
        vipThreshold: values.vipThreshold,
      };

      if (values.dateRange && values.dateRange.length === 2) {
        params.startDate = values.dateRange[0].format('YYYY-MM-DD');
        params.endDate = values.dateRange[1].format('YYYY-MM-DD');
      }
      if (values.filterStatus) params.filterStatus = values.filterStatus;

      const rows = await reportAPI.getReport(activeReport, params);

      if (!rows || rows.length === 0) {
        message.warning('Không có dữ liệu để xuất');
        return setModalVisible(false);
      }

      const availableFields = getFieldOptions(activeReport, values.type);
      const selectedFields = availableFields.filter((f) => values.fields?.includes(f.value));
      await exportExcelReport(reportConfig.title, selectedFields, rows, params.startDate, params.endDate);
      message.success('Đã xuất file Excel');
      setModalVisible(false);
    } catch (error: any) {
      console.error('Export report error', error);
      message.error(error?.response?.data?.error || 'Lỗi khi xuất báo cáo');
    }
  };

  const renderSpecificFields = () => {
    if (!activeReport) return null;

    const selectedType = form.getFieldValue('type') || reportConfig?.radioOptions?.[0]?.value;
    const fieldOptions = getFieldOptions(activeReport, selectedType);

    switch (activeReport) {
      case 'revenue':
        return (
          <>
            <Form.Item label="Loại báo cáo" name="type">
              <Radio.Group options={reportConfig?.radioOptions} optionType="button" buttonStyle="solid" />
            </Form.Item>
            <Form.Item label="Thông tin xuất" name="fields" rules={[{ required: true, message: 'Vui lòng chọn tối thiểu 1 nội dung' }]}> 
              <Checkbox.Group options={fieldOptions} />
            </Form.Item>
          </>
        );
      case 'orders':
        return (
          <>
            <Form.Item label="Loại báo cáo" name="type">
              <Radio.Group options={reportConfig?.radioOptions} optionType="button" buttonStyle="solid" />
            </Form.Item>
            <Form.Item label="Bộ lọc - Trạng thái" name="filterStatus">
              <Checkbox.Group options={reportConfig?.filters || []} />
            </Form.Item>
            <Form.Item label="Thông tin xuất" name="fields" rules={[{ required: true, message: 'Vui lòng chọn tối thiểu 1 thông tin' }]}> 
              <Checkbox.Group options={fieldOptions} />
            </Form.Item>
          </>
        );
      case 'products':
        return (
          <>
            <Form.Item label="Loại báo cáo" name="type">
              <Radio.Group options={reportConfig?.radioOptions} optionType="button" buttonStyle="solid" />
            </Form.Item>
            <Form.Item label="Danh mục" name="category">
              <Select>
                {categoryOptions.map((item) => (
                  <Option key={item.value} value={item.value}>{item.label}</Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item label="Thông tin xuất" name="fields" rules={[{ required: true, message: 'Vui lòng chọn tối thiểu 1 thông tin' }]}> 
              <Checkbox.Group options={fieldOptions} />
            </Form.Item>
          </>
        );
      case 'customers':
        return (
          <>
            <Form.Item label="Loại báo cáo" name="type">
              <Radio.Group options={reportConfig?.radioOptions} optionType="button" buttonStyle="solid" />
            </Form.Item>
            <Form.Item label="Chi tiêu từ" name="vipThreshold">
              <InputNumber style={{ width: '100%' }} min={0} formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
            </Form.Item>
            <Form.Item label="Thông tin xuất" name="fields" rules={[{ required: true, message: 'Vui lòng chọn tối thiểu 1 thông tin' }]}> 
              <Checkbox.Group options={fieldOptions} />
            </Form.Item>
          </>
        );
      case 'inventory':
      case 'ingredients':
        return (
          <>
            <Form.Item label="Loại báo cáo" name="type">
              <Radio.Group options={reportConfig?.radioOptions} optionType="button" buttonStyle="solid" />
            </Form.Item>
            {activeReport === 'ingredients' && (
              <Form.Item label="Ngưỡng cảnh báo tồn kho" name="vipThreshold">
                <InputNumber style={{ width: '100%' }} min={0} formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
              </Form.Item>
            )}
            <Form.Item label="Thông tin xuất" name="fields" rules={[{ required: true, message: 'Vui lòng chọn tối thiểu 1 thông tin' }]}> 
              <Checkbox.Group options={fieldOptions} />
            </Form.Item>
          </>
        );
      case 'recipes':
        return (
          <>
            <Form.Item label="Loại báo cáo" name="type">
              <Radio.Group options={reportConfig?.radioOptions} optionType="button" buttonStyle="solid" />
            </Form.Item>
            <Form.Item label="Sản phẩm" name="product">
              <Select>
                {productOptions.map((item) => (
                  <Option key={item.value} value={item.value}>{item.label}</Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item label="Thông tin xuất" name="fields" rules={[{ required: true, message: 'Vui lòng chọn tối thiểu 1 thông tin' }]}> 
              <Checkbox.Group options={fieldOptions} />
            </Form.Item>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div style={{ padding: '0 24px 24px 24px', minHeight: '100vh' }}>
      <Title level={3} style={{ marginBottom: 24 }}>BÁO CÁO & XUẤT DỮ LIỆU</Title>
      <Row gutter={[16, 16]}>
        {cardItems.map((item) => (
          <Col key={item.key} xs={24} sm={12} md={8} lg={8} xl={6}>
            <Card
              hoverable
              onClick={() => openReportModal(item.key)}
              style={{ cursor: 'pointer', minHeight: 150 }}
              bodyStyle={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
            >
              <div style={{ fontSize: 30, color: '#1890ff' }}>{item.icon}</div>
              <div>
                <Title level={5} style={{ margin: 0 }}>{item.label}</Title>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Modal
        title={reportConfig?.title}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={760}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            dateRange: [dayjs().startOf('month'), dayjs().endOf('month')],
            type: reportConfig?.radioOptions?.[0]?.value,
            fields: activeReport ? getFieldOptions(activeReport, reportConfig?.radioOptions?.[0]?.value).map((field) => field.value) : [],
            filterStatus: ['completed', 'pending', 'canceled'],
            category: 'all',
            product: 'all',
            vipThreshold: 1000000,
            format: 'excel',
          }}
          onValuesChange={handleFormValuesChange}
          onFinish={handleExport}
        >
          {['revenue', 'orders', 'inventory'].includes(activeReport ?? '') && (
            <>
              <Title level={5}>Khoảng thời gian</Title>
              <Form.Item name="dateRange">
                <RangePicker style={{ width: '100%' }} />
              </Form.Item>
            </>
          )}

          {renderSpecificFields()}

          <Form.Item label="Định dạng" name="format">
            <Radio.Group options={[{ label: 'Excel', value: 'excel' }, { label: 'PDF', value: 'pdf', disabled: true }]} />
          </Form.Item>

          <Form.Item>
            <Space style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
              <Button onClick={() => setModalVisible(false)}>Huỷ</Button>
              <Button type="primary" htmlType="submit" icon={<FileExcelOutlined />}>Xuất báo cáo</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default Reports;
