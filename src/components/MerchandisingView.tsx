import React, { useState, useEffect, useMemo } from 'react';
import { ShoppingBag, Package, Users, TrendingUp, DollarSign, BarChart3, RefreshCw, AlertCircle, ChevronDown, ChevronUp, Calendar, Tag, Layers, Search, Target, X, CreditCard, Eye, ToggleLeft, ToggleRight, ArrowUp, ArrowDown } from 'lucide-react';

type SortDirection = 'asc' | 'desc' | null;
type SortConfig<T extends string> = { key: T; direction: SortDirection };
import { GameDayData } from '../types';
import { processGameDayData } from '../utils/dataProcessor';
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
  paymentMethod: string;
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

const SEASON_GOAL = 131000;

const formatCurrency = (value: number) => {
  const formatted = new Intl.NumberFormat('de-DE', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  }).format(value);
  return `${formatted} €`;
};

const getSeasonFromDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = date.getMonth();
  if (month >= 7) {
    return `${String(year).slice(2)}/${String(year + 1).slice(2)}`;
  } else {
    return `${String(year - 1).slice(2)}/${String(year).slice(2)}`;
  }
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' });
};

const getPaymentMethod = (order: ShopifyOrder): string => {
  return order.paymentMethod || 'Unknown';
};

export const MerchandisingView: React.FC = () => {
  const [data, setData] = useState<MerchandisingData | null>(null);
  const [gameDayData, setGameDayData] = useState<GameDayData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders' | 'customers' | 'inventory'>('overview');
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);
  
  const [selectedSeason, setSelectedSeason] = useState<string>('25/26');
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [excludeGameDayMerch, setExcludeGameDayMerch] = useState(true);
  
  const [productSearch, setProductSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [orderSearch, setOrderSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  const [productsLimit, setProductsLimit] = useState(50);
  const [ordersLimit, setOrdersLimit] = useState(50);
  const [customersLimit, setCustomersLimit] = useState(50);

  // Sorting state for tables
  const [productSort, setProductSort] = useState<SortConfig<'title' | 'productType' | 'price' | 'inventory' | 'status'>>({ key: 'title', direction: null });
  const [orderSort, setOrderSort] = useState<SortConfig<'orderNumber' | 'processedAt' | 'customerName' | 'itemCount' | 'totalPrice' | 'paymentMethod' | 'fulfillmentStatus'>>({ key: 'processedAt', direction: 'desc' });
  const [customerSort, setCustomerSort] = useState<SortConfig<'name' | 'email' | 'ordersCount' | 'totalSpent' | 'createdAt'>>({ key: 'totalSpent', direction: 'desc' });

  const handleSort = <T extends string>(currentSort: SortConfig<T>, key: T, setSort: React.Dispatch<React.SetStateAction<SortConfig<T>>>) => {
    if (currentSort.key === key) {
      const nextDir = currentSort.direction === 'asc' ? 'desc' : currentSort.direction === 'desc' ? null : 'asc';
      setSort({ key, direction: nextDir });
    } else {
      setSort({ key, direction: 'asc' });
    }
  };

  const SortableHeader = ({ label, sortKey, currentSort, onSort, align = 'left' }: { label: string; sortKey: string; currentSort: { key: string; direction: SortDirection }; onSort: () => void; align?: 'left' | 'right' | 'center' }) => (
    <th 
      className={`text-${align} px-4 py-3 font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 select-none`}
      onClick={onSort}
    >
      <div className={`flex items-center gap-1 ${align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : ''}`}>
        {label}
        {currentSort.key === sortKey && currentSort.direction && (
          currentSort.direction === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />
        )}
      </div>
    </th>
  );

  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [shopifyResponse, gameDayResponse] = await Promise.all([
        fetch('/api/shopify/data'),
        fetch('/api/gameday/bigquery')
      ]);
      
      if (!shopifyResponse.ok) {
        const errData = await shopifyResponse.json();
        throw new Error(errData.message || 'Failed to fetch Shopify data');
      }
      const shopifyResult = await shopifyResponse.json();
      setData(shopifyResult);
      
      if (gameDayResponse.ok) {
        const gdResult = await gameDayResponse.json();
        if (gdResult.success && gdResult.csvContent) {
          const processedGD = processGameDayData(gdResult.csvContent);
          setGameDayData(processedGD);
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const availableSeasons = useMemo(() => {
    if (!data) return ['25/26'];
    const seasons = new Set<string>();
    data.orders.forEach(order => {
      seasons.add(getSeasonFromDate(order.processedAt));
    });
    return Array.from(seasons).sort().reverse();
  }, [data]);

  const filteredOrders = useMemo(() => {
    if (!data) return [];
    let orders = data.orders.filter(order => getSeasonFromDate(order.processedAt) === selectedSeason);
    
    if (selectedMonth) {
      orders = orders.filter(order => {
        const d = new Date(order.processedAt);
        const monthKey = d.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
        return monthKey === selectedMonth;
      });
    }
    
    return orders;
  }, [data, selectedSeason, selectedMonth]);

  const gameDayMerchByMonth = useMemo(() => {
    const merchByMonth: Record<string, number> = {};
    const normalizedSeason = selectedSeason.replace('/', '-');
    
    gameDayData
      .filter(gd => gd.season === normalizedSeason)
      .forEach(gd => {
        const dateParts = gd.date.split('/');
        if (dateParts.length === 3) {
          const day = parseInt(dateParts[0]);
          const month = parseInt(dateParts[1]) - 1;
          const year = parseInt(dateParts[2]) + (dateParts[2].length === 2 ? 2000 : 0);
          const d = new Date(year, month, day);
          const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          merchByMonth[monthKey] = (merchByMonth[monthKey] || 0) + (gd.merchRevenue || 0);
        }
      });
    
    return merchByMonth;
  }, [gameDayData, selectedSeason]);

  const totalGameDayMerch = useMemo(() => {
    return Object.values(gameDayMerchByMonth).reduce((sum, val) => sum + val, 0);
  }, [gameDayMerchByMonth]);

  const stats = useMemo(() => {
    if (!data) return null;
    
    const grossRevenue = filteredOrders.reduce((sum, o) => sum + o.totalPrice, 0);
    const gameDayDeduction = excludeGameDayMerch ? totalGameDayMerch : 0;
    const totalRevenue = Math.max(0, grossRevenue - gameDayDeduction);
    const totalOrders = filteredOrders.length;
    const avgOrderValue = totalOrders > 0 ? grossRevenue / totalOrders : 0;
    const totalCustomers = data.customers.length;
    const realisticRevenue = Math.max(0, grossRevenue - totalGameDayMerch);
    const goalProgress = (realisticRevenue / SEASON_GOAL) * 100;
    const totalProducts = data.products.length;
    const totalInventory = data.products.reduce((sum, p) => sum + p.totalInventory, 0);
    
    const productSales: Record<string, { title: string; revenue: number; quantity: number; type: string }> = {};
    filteredOrders.forEach(order => {
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
    filteredOrders.forEach(order => {
      order.lineItems.forEach(item => {
        const product = data.products.find(p => p.id === item.productId);
        const category = product?.productType || 'Other';
        categoryRevenue[category] = (categoryRevenue[category] || 0) + (item.price * item.quantity);
      });
    });
    
    const categoryData = Object.entries(categoryRevenue)
      .map(([name, value]) => ({ name: name || 'Uncategorized', value }))
      .sort((a, b) => b.value - a.value);
    
    const getOrderDate = (order: ShopifyOrder) => new Date(order.processedAt);
    
    const monthlyRevenue: Record<string, number> = {};
    const allSeasonOrders = data.orders.filter(order => getSeasonFromDate(order.processedAt) === selectedSeason);
    allSeasonOrders.forEach(order => {
      const d = getOrderDate(order);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthlyRevenue[monthKey] = (monthlyRevenue[monthKey] || 0) + order.totalPrice;
    });
    
    const customerSpending: Record<string, { email: string; firstName: string; lastName: string; spent: number; orders: number }> = {};
    filteredOrders.forEach(order => {
      const email = order.customerEmail || 'guest';
      if (!customerSpending[email]) {
        const nameParts = order.customerName.split(' ');
        customerSpending[email] = {
          email,
          firstName: nameParts[0] || '',
          lastName: nameParts.slice(1).join(' ') || '',
          spent: 0,
          orders: 0
        };
      }
      customerSpending[email].spent += order.totalPrice;
      customerSpending[email].orders += 1;
    });
    
    const topCustomers = Object.values(customerSpending)
      .sort((a, b) => b.spent - a.spent)
      .slice(0, 10);
    
    const allMonths: { month: string; revenue: number; gameDayMerch: number; onlineRevenue: number; monthKey: string }[] = [];
    if (allSeasonOrders.length > 0) {
      const orderDates = allSeasonOrders.map(o => getOrderDate(o));
      const earliest = new Date(Math.min(...orderDates.map(d => d.getTime())));
      const now = new Date();
      
      const startDate = new Date(earliest.getFullYear(), earliest.getMonth(), 1);
      const endDate = new Date(now.getFullYear(), now.getMonth(), 1);
      
      let current = new Date(startDate);
      while (current <= endDate) {
        const monthKey = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
        const displayMonth = current.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
        const totalMonthRevenue = monthlyRevenue[monthKey] || 0;
        const gameDayMerch = gameDayMerchByMonth[monthKey] || 0;
        const onlineRevenue = excludeGameDayMerch ? Math.max(0, totalMonthRevenue - gameDayMerch) : totalMonthRevenue;
        allMonths.push({ 
          month: displayMonth, 
          revenue: totalMonthRevenue,
          gameDayMerch: gameDayMerch,
          onlineRevenue: onlineRevenue,
          monthKey: displayMonth 
        });
        current.setMonth(current.getMonth() + 1);
      }
    }
    
    return {
      totalRevenue,
      grossRevenue,
      realisticRevenue,
      gameDayDeduction,
      totalOrders,
      totalCustomers,
      avgOrderValue,
      totalProducts,
      totalInventory,
      topProducts,
      categoryData,
      monthlyData: allMonths,
      topCustomers,
      goalProgress
    };
  }, [data, filteredOrders, selectedSeason, excludeGameDayMerch, totalGameDayMerch, gameDayMerchByMonth]);

  const filteredProducts = useMemo(() => {
    if (!data) return [];
    let result = data.products;
    if (productSearch.trim()) {
      const searchLower = productSearch.toLowerCase();
      result = result.filter(p => 
        p.title.toLowerCase().includes(searchLower) ||
        p.productType?.toLowerCase().includes(searchLower) ||
        p.variants.some(v => v.sku?.toLowerCase().includes(searchLower))
      );
    }
    // Apply sorting
    if (productSort.direction) {
      result = [...result].sort((a, b) => {
        let aVal: any, bVal: any;
        switch (productSort.key) {
          case 'title': aVal = a.title.toLowerCase(); bVal = b.title.toLowerCase(); break;
          case 'productType': aVal = (a.productType || '').toLowerCase(); bVal = (b.productType || '').toLowerCase(); break;
          case 'price': aVal = a.variants[0]?.price || 0; bVal = b.variants[0]?.price || 0; break;
          case 'inventory': aVal = a.variants.reduce((sum, v) => sum + (v.inventoryQuantity || 0), 0); bVal = b.variants.reduce((sum, v) => sum + (v.inventoryQuantity || 0), 0); break;
          case 'status': aVal = a.status; bVal = b.status; break;
          default: return 0;
        }
        if (aVal < bVal) return productSort.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return productSort.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [data, productSearch, productSort]);

  const searchedOrders = useMemo(() => {
    let result = filteredOrders;
    if (orderSearch.trim()) {
      const searchLower = orderSearch.toLowerCase();
      result = result.filter(o =>
        o.orderNumber.toLowerCase().includes(searchLower) ||
        o.customerName.toLowerCase().includes(searchLower) ||
        o.customerEmail.toLowerCase().includes(searchLower) ||
        formatDate(o.processedAt).toLowerCase().includes(searchLower) ||
        o.totalPrice.toString().includes(searchLower) ||
        o.financialStatus.toLowerCase().includes(searchLower) ||
        o.fulfillmentStatus?.toLowerCase().includes(searchLower) ||
        (o.paymentMethod || '').toLowerCase().includes(searchLower)
      );
    }
    // Apply sorting
    if (orderSort.direction) {
      result = [...result].sort((a, b) => {
        let aVal: any, bVal: any;
        switch (orderSort.key) {
          case 'orderNumber': aVal = parseInt(a.orderNumber) || 0; bVal = parseInt(b.orderNumber) || 0; break;
          case 'processedAt': aVal = new Date(a.processedAt).getTime(); bVal = new Date(b.processedAt).getTime(); break;
          case 'customerName': aVal = a.customerName.toLowerCase(); bVal = b.customerName.toLowerCase(); break;
          case 'itemCount': aVal = a.itemCount; bVal = b.itemCount; break;
          case 'totalPrice': aVal = a.totalPrice; bVal = b.totalPrice; break;
          case 'paymentMethod': aVal = (a.paymentMethod || '').toLowerCase(); bVal = (b.paymentMethod || '').toLowerCase(); break;
          case 'fulfillmentStatus': aVal = a.fulfillmentStatus || ''; bVal = b.fulfillmentStatus || ''; break;
          default: return 0;
        }
        if (aVal < bVal) return orderSort.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return orderSort.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [filteredOrders, orderSearch, orderSort]);

  const filteredCustomers = useMemo(() => {
    if (!data) return [];
    let result = data.customers;
    if (customerSearch.trim()) {
      const searchLower = customerSearch.toLowerCase();
      result = result.filter(c => 
        c.firstName?.toLowerCase().includes(searchLower) ||
        c.lastName?.toLowerCase().includes(searchLower) ||
        c.email?.toLowerCase().includes(searchLower) ||
        c.tags?.some(t => t.toLowerCase().includes(searchLower))
      );
    }
    // Apply sorting
    if (customerSort.direction) {
      result = [...result].sort((a, b) => {
        let aVal: any, bVal: any;
        switch (customerSort.key) {
          case 'name': aVal = `${a.firstName} ${a.lastName}`.toLowerCase(); bVal = `${b.firstName} ${b.lastName}`.toLowerCase(); break;
          case 'email': aVal = (a.email || '').toLowerCase(); bVal = (b.email || '').toLowerCase(); break;
          case 'ordersCount': aVal = a.ordersCount; bVal = b.ordersCount; break;
          case 'totalSpent': aVal = a.totalSpent; bVal = b.totalSpent; break;
          case 'createdAt': aVal = new Date(a.createdAt).getTime(); bVal = new Date(b.createdAt).getTime(); break;
          default: return 0;
        }
        if (aVal < bVal) return customerSort.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return customerSort.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [data, customerSearch, customerSort]);

  const getProductOrders = (productId: string) => {
    if (!data) return [];
    return filteredOrders.filter(order => 
      order.lineItems.some(item => item.productId === productId)
    ).map(order => ({
      ...order,
      purchasedItems: order.lineItems.filter(item => item.productId === productId)
    }));
  };

  const getCustomerOrders = (email: string) => {
    if (!data) return [];
    return filteredOrders.filter(order => order.customerEmail === email);
  };

  const getProductStats = (productId: string) => {
    const product = data?.products.find(p => p.id === productId);
    if (!product) return null;
    
    const orders = getProductOrders(productId);
    const totalSold = orders.reduce((sum, o) => 
      sum + o.purchasedItems.reduce((s, item) => s + item.quantity, 0), 0
    );
    const totalRevenue = orders.reduce((sum, o) => 
      sum + o.purchasedItems.reduce((s, item) => s + item.price * item.quantity, 0), 0
    );
    
    const monthlySales: Record<string, { month: string; quantity: number; revenue: number }> = {};
    orders.forEach(order => {
      const d = new Date(order.processedAt);
      const monthKey = d.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      if (!monthlySales[monthKey]) {
        monthlySales[monthKey] = { month: monthKey, quantity: 0, revenue: 0 };
      }
      order.purchasedItems.forEach(item => {
        monthlySales[monthKey].quantity += item.quantity;
        monthlySales[monthKey].revenue += item.price * item.quantity;
      });
    });
    
    return {
      product,
      orders,
      totalSold,
      totalRevenue,
      monthlySales: Object.values(monthlySales).sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())
    };
  };

  const inventoryStats = useMemo(() => {
    if (!data) return null;
    
    const products = data.products;
    const totalUnits = products.reduce((sum, p) => sum + p.totalInventory, 0);
    const totalValue = products.reduce((sum, p) => {
      return sum + p.variants.reduce((vSum, v) => vSum + (v.price * v.inventoryQuantity), 0);
    }, 0);
    
    const outOfStock = products.filter(p => p.totalInventory <= 0);
    const lowStock = products.filter(p => p.totalInventory > 0 && p.totalInventory <= 5);
    const healthyStock = products.filter(p => p.totalInventory > 5);
    
    const categoryInventory: Record<string, { units: number; value: number; products: number }> = {};
    products.forEach(p => {
      const cat = p.productType || 'Uncategorized';
      if (!categoryInventory[cat]) categoryInventory[cat] = { units: 0, value: 0, products: 0 };
      categoryInventory[cat].units += p.totalInventory;
      categoryInventory[cat].products += 1;
      p.variants.forEach(v => {
        categoryInventory[cat].value += v.price * v.inventoryQuantity;
      });
    });
    
    const byCategory = Object.entries(categoryInventory)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.value - a.value);
    
    const topStocked = [...products]
      .filter(p => p.totalInventory > 0)
      .sort((a, b) => b.totalInventory - a.totalInventory)
      .slice(0, 10);
    
    const allVariants = products.flatMap(p => 
      p.variants.map(v => ({
        productTitle: p.title,
        productType: p.productType,
        variantTitle: v.title,
        sku: v.sku,
        price: v.price,
        quantity: v.inventoryQuantity,
        value: v.price * v.inventoryQuantity
      }))
    );
    
    const lowStockVariants = allVariants
      .filter(v => v.quantity > 0 && v.quantity <= 5)
      .sort((a, b) => a.quantity - b.quantity);
    
    const outOfStockVariants = allVariants.filter(v => v.quantity <= 0);
    
    const avgPrice = allVariants.length > 0 
      ? allVariants.reduce((sum, v) => sum + v.price, 0) / allVariants.length 
      : 0;
    
    return {
      totalUnits,
      totalValue,
      totalProducts: products.length,
      totalVariants: allVariants.length,
      outOfStock,
      lowStock,
      healthyStock,
      byCategory,
      topStocked,
      lowStockVariants,
      outOfStockVariants,
      avgPrice
    };
  }, [data]);

  const clearMonthFilter = () => {
    setSelectedMonth(null);
  };

  const handleMonthClick = (monthData: any) => {
    if (selectedMonth === monthData.month) {
      setSelectedMonth(null);
    } else {
      setSelectedMonth(monthData.month);
    }
  };

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

  const selectedProductStats = selectedProductId ? getProductStats(selectedProductId) : null;
  const selectedCustomerOrders = selectedCustomerId ? getCustomerOrders(selectedCustomerId) : [];
  const selectedOrder = selectedOrderId ? filteredOrders.find(o => o.id === selectedOrderId) : null;
  const selectedCustomer = selectedCustomerId ? data.customers.find(c => c.email === selectedCustomerId) : null;

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
            {selectedMonth && <span className="ml-2 text-orange-600">• Filtered: {selectedMonth}</span>}
            {data.lastUpdated && <span className="ml-2">• Updated {formatDate(data.lastUpdated)}</span>}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setExcludeGameDayMerch(!excludeGameDayMerch)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              excludeGameDayMerch 
                ? 'bg-red-100 text-red-700 border border-red-200' 
                : 'bg-gray-100 text-gray-600 border border-gray-200'
            }`}
            title={excludeGameDayMerch ? 'GameDay merch is excluded (no double counting)' : 'GameDay merch is included (may double count)'}
          >
            {excludeGameDayMerch ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
            Exclude GameDay
            {totalGameDayMerch > 0 && (
              <span className="text-xs opacity-75">({formatCurrency(totalGameDayMerch)})</span>
            )}
          </button>
          {selectedMonth && (
            <button
              onClick={clearMonthFilter}
              className="px-3 py-2 bg-orange-100 text-orange-700 rounded-lg text-sm font-medium hover:bg-orange-200 transition-colors flex items-center gap-2"
            >
              <X size={14} /> Clear Month Filter
            </button>
          )}
          <select
            value={selectedSeason}
            onChange={(e) => { setSelectedSeason(e.target.value); setSelectedMonth(null); }}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            {availableSeasons.map(season => (
              <option key={season} value={season}>Season {season}</option>
            ))}
          </select>
          <button 
            onClick={loadData} 
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2"
          >
            <RefreshCw size={16} /> Refresh Data
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {(['overview', 'products', 'orders', 'customers', 'inventory'] as const).map(tab => (
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
            {tab === 'inventory' && <Layers size={14} className="inline mr-2" />}
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

          <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-xl p-5 shadow-lg text-white">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <Target size={20} className="text-white" />
                </div>
                <div>
                  <p className="text-sm text-white/80">Season {selectedSeason} Goal</p>
                  <p className="text-2xl font-bold">{formatCurrency(SEASON_GOAL)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-white/80">Current Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</p>
              </div>
            </div>
            <div className="relative h-4 bg-white/20 rounded-full overflow-hidden">
              <div 
                className="absolute inset-y-0 left-0 bg-white rounded-full transition-all duration-500"
                style={{ width: `${Math.min(stats.goalProgress, 100)}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-sm">
              <span className="text-white/80">{stats.goalProgress.toFixed(1)}% achieved</span>
              <span className="text-white/80">{formatCurrency(Math.max(0, SEASON_GOAL - stats.realisticRevenue))} remaining</span>
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
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-700">Monthly Revenue Trend</h3>
                  {excludeGameDayMerch && totalGameDayMerch > 0 && (
                    <p className="text-xs text-gray-400 mt-1">
                      <span className="inline-block w-2 h-2 bg-red-400 rounded mr-1"></span>
                      GameDay merch shown in red (excluded from totals)
                    </p>
                  )}
                </div>
                <p className="text-xs text-gray-500">Click a bar to filter by month</p>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.monthlyData} onClick={(data) => data?.activePayload && handleMonthClick(data.activePayload[0]?.payload)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={(v) => `€${(v/1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                  <Tooltip 
                    formatter={(value: number, name: string) => [
                      formatCurrency(value), 
                      name === 'Online Sales' ? 'Online' : name === 'GameDay Sales' ? 'GameDay' : 'Revenue'
                    ]}
                  />
                  {excludeGameDayMerch ? (
                    <>
                      <Bar 
                        dataKey="onlineRevenue" 
                        stackId="a"
                        fill="#ea580c" 
                        name="Online Sales"
                        cursor="pointer"
                      >
                        {stats.monthlyData.map((entry, index) => (
                          <Cell 
                            key={`online-${index}`} 
                            fill={selectedMonth === entry.month ? '#c2410c' : '#ea580c'} 
                          />
                        ))}
                      </Bar>
                      <Bar 
                        dataKey="gameDayMerch" 
                        stackId="a"
                        fill="#ef4444" 
                        name="GameDay Sales"
                        radius={[4, 4, 0, 0]}
                        cursor="pointer"
                      >
                        {stats.monthlyData.map((entry, index) => (
                          <Cell 
                            key={`gameday-${index}`} 
                            fill={selectedMonth === entry.month ? '#dc2626' : '#fca5a5'} 
                          />
                        ))}
                      </Bar>
                    </>
                  ) : (
                    <Bar 
                      dataKey="revenue" 
                      fill="#ea580c" 
                      radius={[4, 4, 0, 0]}
                      cursor="pointer"
                    >
                      {stats.monthlyData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={selectedMonth === entry.month ? '#c2410c' : '#ea580c'} 
                          stroke={selectedMonth === entry.month ? '#9a3412' : 'none'}
                          strokeWidth={selectedMonth === entry.month ? 2 : 0}
                        />
                      ))}
                    </Bar>
                  )}
                  {excludeGameDayMerch && <Legend />}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Top Selling Products</h3>
              <div className="space-y-3">
                {stats.topProducts.slice(0, 5).map((product, i) => (
                  <div 
                    key={product.id} 
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => setSelectedProductId(product.id)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 bg-orange-100 text-orange-700 rounded-full flex items-center justify-center text-xs font-bold">{i + 1}</span>
                      <div>
                        <p className="text-sm font-medium text-gray-800 truncate max-w-[200px]">{product.title}</p>
                        <p className="text-xs text-gray-500">{product.quantity} units sold</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-green-600">{formatCurrency(product.revenue)}</p>
                      <Eye size={14} className="text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Top Customers</h3>
              <div className="space-y-3">
                {stats.topCustomers.slice(0, 5).map((customer, i) => (
                  <div 
                    key={customer.email} 
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => setSelectedCustomerId(customer.email)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold">{i + 1}</span>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{customer.firstName} {customer.lastName}</p>
                        <p className="text-xs text-gray-500">{customer.orders} orders</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-green-600">{formatCurrency(customer.spent)}</p>
                      <Eye size={14} className="text-gray-400" />
                    </div>
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
                  <SortableHeader label="Product" sortKey="title" currentSort={productSort} onSort={() => handleSort(productSort, 'title', setProductSort)} />
                  <SortableHeader label="Type" sortKey="productType" currentSort={productSort} onSort={() => handleSort(productSort, 'productType', setProductSort)} />
                  <SortableHeader label="Price" sortKey="price" currentSort={productSort} onSort={() => handleSort(productSort, 'price', setProductSort)} align="right" />
                  <SortableHeader label="Inventory" sortKey="inventory" currentSort={productSort} onSort={() => handleSort(productSort, 'inventory', setProductSort)} align="right" />
                  <SortableHeader label="Status" sortKey="status" currentSort={productSort} onSort={() => handleSort(productSort, 'status', setProductSort)} align="center" />
                  <th className="text-center px-4 py-3 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.slice(0, productsLimit).map((product) => (
                  <React.Fragment key={product.id}>
                    <tr 
                      className="border-t border-gray-100 hover:bg-gray-50 cursor-pointer"
                      onClick={() => setSelectedProductId(product.id)}
                    >
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
                        <button 
                          onClick={(e) => { e.stopPropagation(); setSelectedProductId(product.id); }}
                          className="px-3 py-1 bg-orange-100 text-orange-700 rounded-lg text-xs font-medium hover:bg-orange-200 transition-colors"
                        >
                          <Eye size={12} className="inline mr-1" /> View
                        </button>
                      </td>
                    </tr>
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
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search orders by number, date, customer, total, payment..."
                value={orderSearch}
                onChange={(e) => { setOrderSearch(e.target.value); setOrdersLimit(50); }}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <SortableHeader label="Order" sortKey="orderNumber" currentSort={orderSort} onSort={() => handleSort(orderSort, 'orderNumber', setOrderSort)} />
                  <SortableHeader label="Date" sortKey="processedAt" currentSort={orderSort} onSort={() => handleSort(orderSort, 'processedAt', setOrderSort)} />
                  <SortableHeader label="Customer" sortKey="customerName" currentSort={orderSort} onSort={() => handleSort(orderSort, 'customerName', setOrderSort)} />
                  <SortableHeader label="Items" sortKey="itemCount" currentSort={orderSort} onSort={() => handleSort(orderSort, 'itemCount', setOrderSort)} align="right" />
                  <SortableHeader label="Total" sortKey="totalPrice" currentSort={orderSort} onSort={() => handleSort(orderSort, 'totalPrice', setOrderSort)} align="right" />
                  <SortableHeader label="Payment" sortKey="paymentMethod" currentSort={orderSort} onSort={() => handleSort(orderSort, 'paymentMethod', setOrderSort)} align="center" />
                  <SortableHeader label="Fulfillment" sortKey="fulfillmentStatus" currentSort={orderSort} onSort={() => handleSort(orderSort, 'fulfillmentStatus', setOrderSort)} align="center" />
                  <th className="text-center px-4 py-3 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {searchedOrders.slice(0, ordersLimit).map((order) => (
                  <tr 
                    key={order.id} 
                    className="border-t border-gray-100 hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedOrderId(order.id)}
                  >
                    <td className="px-4 py-3 font-medium text-gray-800">#{order.orderNumber}</td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(order.processedAt)}</td>
                    <td className="px-4 py-3">
                      <p className="text-gray-800">{order.customerName}</p>
                      <p className="text-xs text-gray-500">{order.customerEmail}</p>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">{order.itemCount}</td>
                    <td className="px-4 py-3 text-right font-medium text-gray-800">{formatCurrency(order.totalPrice)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1 ${
                        order.financialStatus === 'paid' ? 'bg-green-100 text-green-700' :
                        order.financialStatus === 'pending' ? 'bg-amber-100 text-amber-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        <CreditCard size={10} />
                        {getPaymentMethod(order)}
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
                    <td className="px-4 py-3 text-center">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setSelectedOrderId(order.id); }}
                        className="px-3 py-1 bg-orange-100 text-orange-700 rounded-lg text-xs font-medium hover:bg-orange-200 transition-colors"
                      >
                        <Eye size={12} className="inline mr-1" /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {searchedOrders.length > ordersLimit ? (
            <div className="px-4 py-3 bg-gray-50 text-center">
              <span className="text-sm text-gray-500 mr-3">Showing {ordersLimit} of {searchedOrders.length} orders</span>
              <button 
                onClick={() => setOrdersLimit(l => l + 50)}
                className="px-4 py-1.5 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-700 transition-colors"
              >
                Load More
              </button>
            </div>
          ) : (
            <div className="px-4 py-3 bg-gray-50 text-center text-sm text-gray-500">
              Showing all {searchedOrders.length} orders for season {selectedSeason}
              {selectedMonth && ` in ${selectedMonth}`}
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
                  <SortableHeader label="Customer" sortKey="name" currentSort={customerSort} onSort={() => handleSort(customerSort, 'name', setCustomerSort)} />
                  <SortableHeader label="Email" sortKey="email" currentSort={customerSort} onSort={() => handleSort(customerSort, 'email', setCustomerSort)} />
                  <SortableHeader label="Orders" sortKey="ordersCount" currentSort={customerSort} onSort={() => handleSort(customerSort, 'ordersCount', setCustomerSort)} align="right" />
                  <SortableHeader label="Total Spent" sortKey="totalSpent" currentSort={customerSort} onSort={() => handleSort(customerSort, 'totalSpent', setCustomerSort)} align="right" />
                  <SortableHeader label="Member Since" sortKey="createdAt" currentSort={customerSort} onSort={() => handleSort(customerSort, 'createdAt', setCustomerSort)} />
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Tags</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.slice(0, customersLimit).map((customer) => (
                  <tr 
                    key={customer.id} 
                    className="border-t border-gray-100 hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedCustomerId(customer.email)}
                  >
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
                    <td className="px-4 py-3 text-center">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setSelectedCustomerId(customer.email); }}
                        className="px-3 py-1 bg-orange-100 text-orange-700 rounded-lg text-xs font-medium hover:bg-orange-200 transition-colors"
                      >
                        <Eye size={12} className="inline mr-1" /> View
                      </button>
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

      {activeTab === 'inventory' && inventoryStats && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Layers size={16} className="text-blue-600" />
                </div>
              </div>
              <p className="text-xs text-gray-500 mb-1">Total Units</p>
              <p className="text-xl font-bold text-gray-800">{inventoryStats.totalUnits.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <DollarSign size={16} className="text-green-600" />
                </div>
              </div>
              <p className="text-xs text-gray-500 mb-1">Inventory Value</p>
              <p className="text-xl font-bold text-gray-800">{formatCurrency(inventoryStats.totalValue)}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  <AlertCircle size={16} className="text-orange-600" />
                </div>
              </div>
              <p className="text-xs text-gray-500 mb-1">Low Stock</p>
              <p className="text-xl font-bold text-orange-600">{inventoryStats.lowStock.length}</p>
              <p className="text-[10px] text-gray-400">≤5 units</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                  <X size={16} className="text-red-600" />
                </div>
              </div>
              <p className="text-xs text-gray-500 mb-1">Out of Stock</p>
              <p className="text-xl font-bold text-red-600">{inventoryStats.outOfStock.length}</p>
              <p className="text-[10px] text-gray-400">{inventoryStats.totalProducts} total products</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <BarChart3 size={16} className="text-gray-400" />
                Inventory by Category
                <span className="text-xs text-gray-400 ml-auto">Click to view products</span>
              </h3>
              <div className="space-y-2">
                {inventoryStats.byCategory.slice(0, 8).map((cat, i) => (
                  <div 
                    key={cat.name} 
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => setSelectedCategory(cat.name)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-sm text-gray-700 hover:text-blue-600">{cat.name}</span>
                      <span className="text-xs text-gray-400">({cat.products} products)</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-gray-500">{cat.units.toLocaleString()} units</span>
                      <span className="font-medium text-gray-800 w-24 text-right">{formatCurrency(cat.value)}</span>
                    </div>
                  </div>
                ))}
              </div>
              {inventoryStats.byCategory.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie
                        data={inventoryStats.byCategory.slice(0, 8)}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={2}
                      >
                        {inventoryStats.byCategory.slice(0, 8).map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <Package size={16} className="text-gray-400" />
                Top Stocked Products
              </h3>
              <div className="space-y-2">
                {inventoryStats.topStocked.map((product, i) => (
                  <div key={product.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="text-xs text-gray-400 w-5">{i + 1}.</span>
                      <span className="text-sm text-gray-700 truncate">{product.title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">{product.productType || 'N/A'}</span>
                      <span className="text-sm font-bold text-gray-800 bg-blue-50 px-2 py-0.5 rounded">
                        {product.totalInventory.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {inventoryStats.lowStockVariants.length > 0 && (
            <div className="bg-white rounded-xl border border-orange-200 p-5">
              <h3 className="text-sm font-semibold text-orange-700 mb-4 flex items-center gap-2">
                <AlertCircle size={16} />
                Low Stock Alert ({inventoryStats.lowStockVariants.length} variants)
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-orange-100">
                      <th className="text-left py-2 px-3 text-gray-600 font-medium">Product</th>
                      <th className="text-left py-2 px-3 text-gray-600 font-medium">Variant</th>
                      <th className="text-left py-2 px-3 text-gray-600 font-medium">SKU</th>
                      <th className="text-right py-2 px-3 text-gray-600 font-medium">Price</th>
                      <th className="text-right py-2 px-3 text-gray-600 font-medium">Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventoryStats.lowStockVariants.slice(0, 15).map((v, i) => (
                      <tr key={i} className="border-b border-orange-50 hover:bg-orange-50/50">
                        <td className="py-2 px-3 text-gray-700">{v.productTitle}</td>
                        <td className="py-2 px-3 text-gray-500">{v.variantTitle}</td>
                        <td className="py-2 px-3 text-gray-400 font-mono text-xs">{v.sku || '-'}</td>
                        <td className="py-2 px-3 text-right text-gray-600">{formatCurrency(v.price)}</td>
                        <td className="py-2 px-3 text-right">
                          <span className="font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded">{v.quantity}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {inventoryStats.lowStockVariants.length > 15 && (
                <p className="text-xs text-gray-400 mt-3 text-center">
                  Showing 15 of {inventoryStats.lowStockVariants.length} low stock items
                </p>
              )}
            </div>
          )}

          {inventoryStats.outOfStockVariants.length > 0 && (
            <div className="bg-white rounded-xl border border-red-200 p-5">
              <h3 className="text-sm font-semibold text-red-700 mb-4 flex items-center gap-2">
                <X size={16} />
                Out of Stock ({inventoryStats.outOfStockVariants.length} variants)
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-red-100">
                      <th className="text-left py-2 px-3 text-gray-600 font-medium">Product</th>
                      <th className="text-left py-2 px-3 text-gray-600 font-medium">Variant</th>
                      <th className="text-left py-2 px-3 text-gray-600 font-medium">SKU</th>
                      <th className="text-right py-2 px-3 text-gray-600 font-medium">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventoryStats.outOfStockVariants.slice(0, 20).map((v, i) => (
                      <tr key={i} className="border-b border-red-50 hover:bg-red-50/50">
                        <td className="py-2 px-3 text-gray-700">{v.productTitle}</td>
                        <td className="py-2 px-3 text-gray-500">{v.variantTitle}</td>
                        <td className="py-2 px-3 text-gray-400 font-mono text-xs">{v.sku || '-'}</td>
                        <td className="py-2 px-3 text-right text-gray-600">{formatCurrency(v.price)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {inventoryStats.outOfStockVariants.length > 20 && (
                <p className="text-xs text-gray-400 mt-3 text-center">
                  Showing 20 of {inventoryStats.outOfStockVariants.length} out of stock items
                </p>
              )}
            </div>
          )}

          <div className="bg-gray-50 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Inventory Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Products</p>
                <p className="font-bold text-gray-800">{inventoryStats.totalProducts}</p>
              </div>
              <div>
                <p className="text-gray-500">Variants</p>
                <p className="font-bold text-gray-800">{inventoryStats.totalVariants}</p>
              </div>
              <div>
                <p className="text-gray-500">Avg. Price</p>
                <p className="font-bold text-gray-800">{formatCurrency(inventoryStats.avgPrice)}</p>
              </div>
              <div>
                <p className="text-gray-500">Stock Health</p>
                <p className="font-bold text-green-600">
                  {((inventoryStats.healthyStock.length / inventoryStats.totalProducts) * 100).toFixed(0)}% healthy
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedCategory && data && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedCategory(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-800">{selectedCategory}</h2>
                <p className="text-sm text-gray-500">
                  {data.products.filter(p => (p.productType || 'Uncategorized') === selectedCategory).length} products in this category
                </p>
              </div>
              <button onClick={() => setSelectedCategory(null)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-3 px-4 font-semibold text-gray-600">Product</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-600">Price</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-600">Inventory</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-600">Value</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-600">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.products
                      .filter(p => (p.productType || 'Uncategorized') === selectedCategory)
                      .sort((a, b) => b.totalInventory - a.totalInventory)
                      .map(product => {
                        const inventoryValue = product.variants.reduce((sum, v) => sum + (v.price * v.inventoryQuantity), 0);
                        const avgPrice = product.variants.length > 0 
                          ? product.variants.reduce((sum, v) => sum + v.price, 0) / product.variants.length 
                          : 0;
                        return (
                          <tr key={product.id} className="border-b border-gray-50 hover:bg-gray-50">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                {product.images[0] ? (
                                  <img src={product.images[0].src} alt="" className="w-10 h-10 rounded-lg object-cover" />
                                ) : (
                                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                    <Package size={16} className="text-gray-400" />
                                  </div>
                                )}
                                <div>
                                  <p className="font-medium text-gray-800">{product.title}</p>
                                  <p className="text-xs text-gray-400">{product.variants.length} variant{product.variants.length !== 1 ? 's' : ''}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-right text-gray-700">{formatCurrency(avgPrice)}</td>
                            <td className="py-3 px-4 text-right">
                              <span className={product.totalInventory <= 0 ? 'text-red-600 font-semibold' : product.totalInventory < 10 ? 'text-amber-600' : 'text-gray-800'}>
                                {product.totalInventory.toLocaleString()}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right font-medium text-gray-800">{formatCurrency(inventoryValue)}</td>
                            <td className="py-3 px-4 text-center">
                              {product.totalInventory <= 0 ? (
                                <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full">Out of Stock</span>
                              ) : product.totalInventory < 10 ? (
                                <span className="px-2 py-1 text-xs font-medium bg-amber-100 text-amber-700 rounded-full">Low Stock</span>
                              ) : (
                                <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">In Stock</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center text-sm text-gray-500">
                <span>
                  Total: {data.products.filter(p => (p.productType || 'Uncategorized') === selectedCategory).reduce((sum, p) => sum + p.totalInventory, 0).toLocaleString()} units
                </span>
                <span>
                  Value: {formatCurrency(data.products.filter(p => (p.productType || 'Uncategorized') === selectedCategory).reduce((sum, p) => sum + p.variants.reduce((vs, v) => vs + v.price * v.inventoryQuantity, 0), 0))}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedProductStats && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedProductId(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">Product Details</h2>
              <button onClick={() => setSelectedProductId(null)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-start gap-6">
                {selectedProductStats.product.images[0] ? (
                  <img 
                    src={selectedProductStats.product.images[0].src} 
                    alt={selectedProductStats.product.title} 
                    className="w-32 h-32 object-cover rounded-xl"
                  />
                ) : (
                  <div className="w-32 h-32 bg-gray-100 rounded-xl flex items-center justify-center">
                    <Package size={40} className="text-gray-400" />
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-800">{selectedProductStats.product.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">{selectedProductStats.product.productType || 'No category'}</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                    <div className="bg-green-50 rounded-lg p-3 text-center">
                      <p className="text-xs text-green-600">Revenue</p>
                      <p className="text-lg font-bold text-green-700">{formatCurrency(selectedProductStats.totalRevenue)}</p>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-3 text-center">
                      <p className="text-xs text-orange-600">Units Sold</p>
                      <p className="text-lg font-bold text-orange-700">{selectedProductStats.totalSold}</p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-3 text-center">
                      <p className="text-xs text-blue-600">In Stock</p>
                      <p className="text-lg font-bold text-blue-700">{selectedProductStats.product.totalInventory}</p>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-3 text-center">
                      <p className="text-xs text-purple-600">Price</p>
                      <p className="text-lg font-bold text-purple-700">
                        {selectedProductStats.product.variants.length === 1
                          ? formatCurrency(selectedProductStats.product.variants[0].price)
                          : `${formatCurrency(Math.min(...selectedProductStats.product.variants.map(v => v.price)))}`
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {selectedProductStats.product.variants.length > 1 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Variants</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedProductStats.product.variants.map(variant => (
                      <div key={variant.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-700">{variant.title}</span>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="font-medium">{formatCurrency(variant.price)}</span>
                          <span className={variant.inventoryQuantity <= 0 ? 'text-red-600' : 'text-gray-500'}>
                            {variant.inventoryQuantity} in stock
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedProductStats.monthlySales.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Sales History</h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={selectedProductStats.monthlySales}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                      <YAxis tickFormatter={(v) => v.toString()} tick={{ fontSize: 10 }} />
                      <Tooltip formatter={(value: number, name: string) => [name === 'quantity' ? value + ' units' : formatCurrency(value), name === 'quantity' ? 'Units' : 'Revenue']} />
                      <Bar dataKey="quantity" fill="#ea580c" radius={[4, 4, 0, 0]} name="Units Sold" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Recent Purchases ({selectedProductStats.orders.length})</h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {selectedProductStats.orders.slice(0, 20).map(order => (
                    <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-800">{order.customerName}</p>
                        <p className="text-xs text-gray-500">{formatDate(order.processedAt)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-800">
                          {order.purchasedItems.reduce((sum, item) => sum + item.quantity, 0)} units
                        </p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          order.financialStatus === 'paid' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {getPaymentMethod(order)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedCustomerId && selectedCustomerOrders.length > 0 && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedCustomerId(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">Customer Details</h2>
              <button onClick={() => setSelectedCustomerId(null)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-start gap-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users size={28} className="text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-800">
                    {selectedCustomer ? `${selectedCustomer.firstName} ${selectedCustomer.lastName}` : selectedCustomerOrders[0]?.customerName || 'Guest'}
                  </h3>
                  <p className="text-sm text-gray-500">{selectedCustomer?.email || selectedCustomerId}</p>
                  {selectedCustomer?.tags && selectedCustomer.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedCustomer.tags.map((tag, i) => (
                        <span key={i} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">{tag}</span>
                      ))}
                    </div>
                  )}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                    <div className="bg-green-50 rounded-lg p-3 text-center">
                      <p className="text-xs text-green-600">Total Spent</p>
                      <p className="text-lg font-bold text-green-700">
                        {formatCurrency(selectedCustomer?.totalSpent || selectedCustomerOrders.reduce((sum, o) => sum + o.totalPrice, 0))}
                      </p>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-3 text-center">
                      <p className="text-xs text-orange-600">Orders</p>
                      <p className="text-lg font-bold text-orange-700">{selectedCustomer?.ordersCount || selectedCustomerOrders.length}</p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-3 text-center">
                      <p className="text-xs text-blue-600">This Season</p>
                      <p className="text-lg font-bold text-blue-700">{selectedCustomerOrders.length}</p>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-3 text-center">
                      <p className="text-xs text-purple-600">Member Since</p>
                      <p className="text-sm font-bold text-purple-700">
                        {selectedCustomer ? formatDate(selectedCustomer.createdAt) : formatDate(selectedCustomerOrders[selectedCustomerOrders.length - 1]?.processedAt || '')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Purchase History ({selectedCustomerOrders.length})</h4>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {selectedCustomerOrders.map(order => (
                    <div key={order.id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-sm font-medium text-gray-800">Order #{order.orderNumber}</p>
                          <p className="text-xs text-gray-500">{formatDate(order.processedAt)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-green-600">{formatCurrency(order.totalPrice)}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                            order.financialStatus === 'paid' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                          }`}>
                            <CreditCard size={10} />
                            {getPaymentMethod(order)}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        {order.lineItems.map((item, i) => (
                          <div key={i} className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">{item.title}</span>
                            <span className="text-gray-800">{item.quantity} x {formatCurrency(item.price)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedOrderId(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">Order #{selectedOrder.orderNumber}</h2>
              <button onClick={() => setSelectedOrderId(null)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Customer</p>
                  <p className="text-sm font-medium text-gray-800">{selectedOrder.customerName}</p>
                  <p className="text-xs text-gray-500">{selectedOrder.customerEmail}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Date</p>
                  <p className="text-sm font-medium text-gray-800">{formatDate(selectedOrder.processedAt)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Payment Method</p>
                  <span className={`text-sm px-2 py-1 rounded-full inline-flex items-center gap-1 ${
                    selectedOrder.financialStatus === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    <CreditCard size={12} />
                    {getPaymentMethod(selectedOrder)}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Fulfillment</p>
                  <span className={`text-sm px-2 py-1 rounded-full ${
                    selectedOrder.fulfillmentStatus === 'fulfilled' ? 'bg-green-100 text-green-700' :
                    selectedOrder.fulfillmentStatus === 'partial' ? 'bg-amber-100 text-amber-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {selectedOrder.fulfillmentStatus || 'Unfulfilled'}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Items ({selectedOrder.itemCount})</h4>
                <div className="space-y-2">
                  {selectedOrder.lineItems.map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-800">{item.title}</p>
                        {item.sku && <p className="text-xs text-gray-500">SKU: {item.sku}</p>}
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-800">{item.quantity} x {formatCurrency(item.price)}</p>
                        <p className="text-sm font-bold text-green-600">{formatCurrency(item.price * item.quantity)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold text-gray-800">Total</span>
                  <span className="text-xl font-bold text-green-600">{formatCurrency(selectedOrder.totalPrice)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MerchandisingView;
