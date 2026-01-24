import React, { useState, useEffect, useMemo } from 'react';
import { ShoppingBag, Package, Users, TrendingUp, DollarSign, BarChart3, RefreshCw, AlertCircle, ChevronDown, ChevronUp, Calendar, Tag, Layers, Search } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, LineChart, Line } from 'recharts';

interface ShopifyOrder {
  id: string;
  orderNumber: string;
  createdAt: string;
  processedAt: string;
  totalPrice: number;
  currency: string;
  customerName: string;
  customerEmail: string;
  itemCount: number;
  lineItems: {
    title: string;
    quantity: number;
    price: number;
    sku: string;
    productId: string;
  }[];
  financialStatus: string;
  fulfillmentStatus: string;
}

interface ShopifyProduct {
  id: string;
  title: string;
  productType: string;
  vendor: string;
  status: string;
  totalInventory: number;
  variants: {
    id: string;
    title: string;
    price: number;
    inventoryQuantity: number;
    sku: string;
  }[];
  images: { src: string }[];
}

interface ShopifyCustomer {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  ordersCount: number;
  totalSpent: number;
  createdAt: string;
  tags: string[];
}

interface MerchandisingData {
  orders: ShopifyOrder[];
  products: ShopifyProduct[];
  customers: ShopifyCustomer[];
  lastUpdated: string;
}

const COLORS = ['#dc2626', '#ea580c', '#d97706', '#ca8a04', '#65a30d', '#16a34a', '#0d9488', '#0891b2', '#0284c7', '#2563eb', '#7c3aed', '#c026d3'];

const formatCurrency = (value: number) => 
  new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(value);

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const MerchandisingView: React.FC = () => {
  const [data, setData] = useState<MerchandisingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders' | 'customers'>('overview');
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);
  
  // Search states
  const [productSearch, setProductSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  
  // Pagination states
  const [productsLimit, setProductsLimit] = useState(50);
  const [ordersLimit, setOrdersLimit] = useState(50);
  const [customersLimit, setCustomersLimit] = useState(50);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/shopify/data');
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Failed to fetch Shopify data');
      }
      const result = await response.json();
      setData(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const stats = useMemo(() => {
    if (!data) return null;
    
    const totalRevenue = data.orders.reduce((sum, o) => sum + o.totalPrice, 0);
    const totalOrders = data.orders.length;
    const totalCustomers = data.customers.length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const totalProducts = data.products.length;
    const totalInventory = data.products.reduce((sum, p) => sum + p.totalInventory, 0);
    
    const productSales: Record<string, { title: string; revenue: number; quantity: number; type: string }> = {};
    data.orders.forEach(order => {
      order.lineItems.forEach(item => {
        if (!productSales[item.productId]) {
          productSales[item.productId] = { title: item.title, revenue: 0, quantity: 0, type: '' };
        }
        productSales[item.productId].revenue += item.price * item.quantity;
        productSales[item.productId].quantity += item.quantity;
      });
    });
    
    const topProducts = Object.entries(productSales)
      .map(([id, stats]) => ({ id, ...stats }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
    
    const categoryRevenue: Record<string, number> = {};
    data.orders.forEach(order => {
      order.lineItems.forEach(item => {
        const product = data.products.find(p => p.id === item.productId);
        const category = product?.productType || 'Other';
        categoryRevenue[category] = (categoryRevenue[category] || 0) + (item.price * item.quantity);
      });
    });
    
    const categoryData = Object.entries(categoryRevenue)
      .map(([name, value]) => ({ name: name || 'Uncategorized', value }))
      .sort((a, b) => b.value - a.value);
    
    // Use processedAt as the actual purchase date (when payment was processed)
    const getOrderDate = (order: ShopifyOrder) => new Date(order.processedAt);
    
    const monthlyRevenue: Record<string, number> = {};
    data.orders.forEach(order => {
      const d = getOrderDate(order);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthlyRevenue[monthKey] = (monthlyRevenue[monthKey] || 0) + order.totalPrice;
    });
    
    const topCustomers = [...data.customers]
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10);
    
    // Generate all months from earliest order to now, filling in 0 for months without orders
    const allMonths: { month: string; revenue: number }[] = [];
    if (data.orders.length > 0) {
      const orderDates = data.orders.map(o => getOrderDate(o));
      const earliest = new Date(Math.min(...orderDates.map(d => d.getTime())));
      const now = new Date();
      
      const startDate = new Date(earliest.getFullYear(), earliest.getMonth(), 1);
      const endDate = new Date(now.getFullYear(), now.getMonth(), 1);
      
      let current = new Date(startDate);
      while (current <= endDate) {
        const monthKey = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
        const displayMonth = current.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
        allMonths.push({ month: displayMonth, revenue: monthlyRevenue[monthKey] || 0 });
        current.setMonth(current.getMonth() + 1);
      }
    }
    
    return {
      totalRevenue,
      totalOrders,
      totalCustomers,
      avgOrderValue,
      totalProducts,
      totalInventory,
      topProducts,
      categoryData,
      monthlyData: allMonths,
      topCustomers
    };
  }, [data]);

  // Filtered products based on search
  const filteredProducts = useMemo(() => {
    if (!data) return [];
    if (!productSearch.trim()) return data.products;
    const searchLower = productSearch.toLowerCase();
    return data.products.filter(p => 
      p.title.toLowerCase().includes(searchLower) ||
      p.productType?.toLowerCase().includes(searchLower) ||
      p.variants.some(v => v.sku?.toLowerCase().includes(searchLower))
    );
  }, [data, productSearch]);

  // Filtered customers based on search
  const filteredCustomers = useMemo(() => {
    if (!data) return [];
    if (!customerSearch.trim()) return data.customers;
    const searchLower = customerSearch.toLowerCase();
    return data.customers.filter(c => 
      c.firstName?.toLowerCase().includes(searchLower) ||
      c.lastName?.toLowerCase().includes(searchLower) ||
      c.email?.toLowerCase().includes(searchLower) ||
      c.tags?.some(t => t.toLowerCase().includes(searchLower))
    );
  }, [data, customerSearch]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw size={32} className="animate-spin text-orange-600 mx-auto mb-3" />
          <p className="text-gray-600">Loading Shopify data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <AlertCircle size={32} className="text-red-500 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-red-800 mb-2">Failed to Load Merchandising Data</h3>
        <p className="text-red-600 mb-4">{error}</p>
        <button onClick={loadData} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
          <RefreshCw size={16} className="inline mr-2" /> Retry
        </button>
      </div>
    );
  }

  if (!data || !stats) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-center">
        <Package size={32} className="text-gray-400 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-gray-700">No Merchandising Data Available</h3>
        <p className="text-gray-500">Connect your Shopify store to see merchandising analytics.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <ShoppingBag size={28} className="text-orange-600" />
            Merchandising Analytics
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {stats.totalOrders.toLocaleString()} orders | {formatCurrency(stats.totalRevenue)} revenue
            {data.lastUpdated && <span className="ml-2">• Updated {formatDate(data.lastUpdated)}</span>}
          </p>
        </div>
        <button 
          onClick={loadData} 
          className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2"
        >
          <RefreshCw size={16} /> Refresh Data
        </button>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {(['overview', 'products', 'orders', 'customers'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab 
                ? 'bg-orange-600 text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tab === 'overview' && <BarChart3 size={14} className="inline mr-2" />}
            {tab === 'products' && <Package size={14} className="inline mr-2" />}
            {tab === 'orders' && <ShoppingBag size={14} className="inline mr-2" />}
            {tab === 'customers' && <Users size={14} className="inline mr-2" />}
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                  <DollarSign size={16} className="text-green-600" />
                </div>
              </div>
              <p className="text-xs text-gray-500 mb-1">Total Revenue</p>
              <p className="text-lg font-bold text-gray-800">{formatCurrency(stats.totalRevenue)}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
                  <ShoppingBag size={16} className="text-orange-600" />
                </div>
              </div>
              <p className="text-xs text-gray-500 mb-1">Total Orders</p>
              <p className="text-lg font-bold text-gray-800">{stats.totalOrders.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Users size={16} className="text-blue-600" />
                </div>
              </div>
              <p className="text-xs text-gray-500 mb-1">Customers</p>
              <p className="text-lg font-bold text-gray-800">{stats.totalCustomers.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
                  <TrendingUp size={16} className="text-purple-600" />
                </div>
              </div>
              <p className="text-xs text-gray-500 mb-1">Avg Order Value</p>
              <p className="text-lg font-bold text-gray-800">{formatCurrency(stats.avgOrderValue)}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
                  <Package size={16} className="text-indigo-600" />
                </div>
              </div>
              <p className="text-xs text-gray-500 mb-1">Products</p>
              <p className="text-lg font-bold text-gray-800">{stats.totalProducts.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-teal-50 rounded-lg flex items-center justify-center">
                  <Layers size={16} className="text-teal-600" />
                </div>
              </div>
              <p className="text-xs text-gray-500 mb-1">Inventory Units</p>
              <p className="text-lg font-bold text-gray-800">{stats.totalInventory.toLocaleString()}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Revenue by Category</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={stats.categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {stats.categoryData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Monthly Revenue Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={stats.monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={(v) => `€${(v/1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Line type="monotone" dataKey="revenue" stroke="#ea580c" strokeWidth={2} dot={{ fill: '#ea580c' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Top Selling Products</h3>
              <div className="space-y-3">
                {stats.topProducts.slice(0, 5).map((product, i) => (
                  <div key={product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 bg-orange-100 text-orange-700 rounded-full flex items-center justify-center text-xs font-bold">{i + 1}</span>
                      <div>
                        <p className="text-sm font-medium text-gray-800 truncate max-w-[200px]">{product.title}</p>
                        <p className="text-xs text-gray-500">{product.quantity} units sold</p>
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-green-600">{formatCurrency(product.revenue)}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Top Customers</h3>
              <div className="space-y-3">
                {stats.topCustomers.slice(0, 5).map((customer, i) => (
                  <div key={customer.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold">{i + 1}</span>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{customer.firstName} {customer.lastName}</p>
                        <p className="text-xs text-gray-500">{customer.ordersCount} orders</p>
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-green-600">{formatCurrency(customer.totalSpent)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'products' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search products by name, type, or SKU..."
                value={productSearch}
                onChange={(e) => { setProductSearch(e.target.value); setProductsLimit(50); }}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Product</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Type</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-700">Price</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-700">Inventory</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-700">Status</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-700"></th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.slice(0, productsLimit).map((product) => (
                  <React.Fragment key={product.id}>
                    <tr className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {product.images[0] ? (
                            <img src={product.images[0].src} alt={product.title} className="w-10 h-10 object-cover rounded-lg" />
                          ) : (
                            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                              <Package size={16} className="text-gray-400" />
                            </div>
                          )}
                          <span className="font-medium text-gray-800">{product.title}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{product.productType || '-'}</td>
                      <td className="px-4 py-3 text-right text-gray-800">
                        {product.variants.length === 1 
                          ? formatCurrency(product.variants[0].price)
                          : `${formatCurrency(Math.min(...product.variants.map(v => v.price)))} - ${formatCurrency(Math.max(...product.variants.map(v => v.price)))}`
                        }
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={product.totalInventory <= 0 ? 'text-red-600 font-semibold' : product.totalInventory < 10 ? 'text-amber-600' : 'text-gray-800'}>
                          {product.totalInventory}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          product.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {product.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {product.variants.length > 1 && (
                          <button 
                            onClick={() => setExpandedProduct(expandedProduct === product.id ? null : product.id)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            {expandedProduct === product.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                        )}
                      </td>
                    </tr>
                    {expandedProduct === product.id && product.variants.length > 1 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-3 bg-gray-50">
                          <div className="pl-12 space-y-2">
                            {product.variants.map(variant => (
                              <div key={variant.id} className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">{variant.title}</span>
                                <div className="flex items-center gap-6">
                                  <span className="text-gray-800">{formatCurrency(variant.price)}</span>
                                  <span className={variant.inventoryQuantity <= 0 ? 'text-red-600' : 'text-gray-600'}>
                                    {variant.inventoryQuantity} in stock
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
          {filteredProducts.length > productsLimit ? (
            <div className="px-4 py-3 bg-gray-50 text-center">
              <span className="text-sm text-gray-500 mr-3">Showing {productsLimit} of {filteredProducts.length} products</span>
              <button 
                onClick={() => setProductsLimit(l => l + 50)}
                className="px-4 py-1.5 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-700 transition-colors"
              >
                Load More
              </button>
            </div>
          ) : filteredProducts.length > 0 && (
            <div className="px-4 py-3 bg-gray-50 text-center text-sm text-gray-500">
              Showing all {filteredProducts.length} products
            </div>
          )}
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Order</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Date</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Customer</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-700">Items</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-700">Total</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-700">Payment</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-700">Fulfillment</th>
                </tr>
              </thead>
              <tbody>
                {data.orders.slice(0, ordersLimit).map((order) => (
                  <tr key={order.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">#{order.orderNumber}</td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(order.processedAt)}</td>
                    <td className="px-4 py-3">
                      <p className="text-gray-800">{order.customerName}</p>
                      <p className="text-xs text-gray-500">{order.customerEmail}</p>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">{order.itemCount}</td>
                    <td className="px-4 py-3 text-right font-medium text-gray-800">{formatCurrency(order.totalPrice)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        order.financialStatus === 'paid' ? 'bg-green-100 text-green-700' :
                        order.financialStatus === 'pending' ? 'bg-amber-100 text-amber-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {order.financialStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        order.fulfillmentStatus === 'fulfilled' ? 'bg-green-100 text-green-700' :
                        order.fulfillmentStatus === 'partial' ? 'bg-amber-100 text-amber-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {order.fulfillmentStatus || 'unfulfilled'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data.orders.length > ordersLimit ? (
            <div className="px-4 py-3 bg-gray-50 text-center">
              <span className="text-sm text-gray-500 mr-3">Showing {ordersLimit} of {data.orders.length} orders</span>
              <button 
                onClick={() => setOrdersLimit(l => l + 50)}
                className="px-4 py-1.5 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-700 transition-colors"
              >
                Load More
              </button>
            </div>
          ) : (
            <div className="px-4 py-3 bg-gray-50 text-center text-sm text-gray-500">
              Showing all {data.orders.length} orders
            </div>
          )}
        </div>
      )}

      {activeTab === 'customers' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search customers by name, email, or tag..."
                value={customerSearch}
                onChange={(e) => { setCustomerSearch(e.target.value); setCustomersLimit(50); }}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Customer</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Email</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-700">Orders</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-700">Total Spent</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Member Since</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Tags</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.slice(0, customersLimit).map((customer) => (
                  <tr key={customer.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{customer.firstName} {customer.lastName}</td>
                    <td className="px-4 py-3 text-gray-600">{customer.email}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{customer.ordersCount}</td>
                    <td className="px-4 py-3 text-right font-medium text-green-600">{formatCurrency(customer.totalSpent)}</td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(customer.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {customer.tags.slice(0, 3).map((tag, i) => (
                          <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">{tag}</span>
                        ))}
                        {customer.tags.length > 3 && (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-xs">+{customer.tags.length - 3}</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredCustomers.length > customersLimit ? (
            <div className="px-4 py-3 bg-gray-50 text-center">
              <span className="text-sm text-gray-500 mr-3">Showing {customersLimit} of {filteredCustomers.length} customers</span>
              <button 
                onClick={() => setCustomersLimit(l => l + 50)}
                className="px-4 py-1.5 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-700 transition-colors"
              >
                Load More
              </button>
            </div>
          ) : filteredCustomers.length > 0 && (
            <div className="px-4 py-3 bg-gray-50 text-center text-sm text-gray-500">
              Showing all {filteredCustomers.length} customers
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MerchandisingView;
