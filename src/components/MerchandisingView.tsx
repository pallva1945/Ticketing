import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { ShoppingBag, Package, Users, TrendingUp, DollarSign, BarChart3, RefreshCw, AlertCircle, ChevronDown, ChevronUp, Calendar, Tag, Layers, Search, Target, X, CreditCard, Eye, ToggleLeft, ToggleRight, ArrowUp, ArrowDown, Heart, Sparkles, AlertTriangle } from 'lucide-react';

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
  sourceName?: string;
  tags?: string;
  totalTax?: number;
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
  const month = date.getMonth(); // 0-indexed: January=0, July=6
  // Season runs July 1st to June 30th
  if (month >= 6) { // July (6) or later
    return `${String(year).slice(2)}/${String(year + 1).slice(2)}`;
  } else { // January-June belongs to previous season
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
  const { t } = useLanguage();
  const [data, setData] = useState<MerchandisingData | null>(null);
  const [gameDayData, setGameDayData] = useState<GameDayData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders' | 'customers' | 'inventory' | 'community'>('overview');
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
      className={`text-${align} px-4 py-3 font-semibold text-gray-700 dark:text-gray-200 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 select-none`}
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

  useEffect(() => {
    const handleShopifyRefresh = () => loadData();
    window.addEventListener('shopify-refresh', handleShopifyRefresh);
    return () => window.removeEventListener('shopify-refresh', handleShopifyRefresh);
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
    
    const salesOrders = filteredOrders.filter(o => !(o.sourceName === 'shopify_draft_order' && o.totalPrice === 0));
    const grossRevenueWithTax = salesOrders.reduce((sum, o) => sum + o.totalPrice, 0);
    const totalIVA = salesOrders.reduce((sum, o) => sum + (o.totalTax || 0), 0);
    const grossRevenue = grossRevenueWithTax - totalIVA;
    const gameDayDeduction = excludeGameDayMerch ? totalGameDayMerch : 0;
    const totalRevenue = Math.max(0, grossRevenue - gameDayDeduction);
    const totalOrders = salesOrders.length;
    const avgOrderValue = totalOrders > 0 ? grossRevenue / totalOrders : 0;
    const totalCustomers = data.customers.length;
    const realisticRevenue = Math.max(0, grossRevenue - totalGameDayMerch);
    const goalProgress = (realisticRevenue / SEASON_GOAL) * 100;
    const totalProducts = data.products.length;
    const totalInventory = data.products.filter(p => (p.productType || '').toLowerCase() !== 'servizio').reduce((sum, p) => sum + p.totalInventory, 0);
    
    const getNetPrice = (order: ShopifyOrder, amount: number) => {
      const tax = order.totalTax || 0;
      const total = order.totalPrice;
      if (total > 0 && tax > 0) {
        return amount * (1 - tax / total);
      }
      return amount;
    };

    const productSales: Record<string, { title: string; revenue: number; quantity: number; type: string }> = {};
    filteredOrders.forEach(order => {
      order.lineItems.forEach(item => {
        if (!productSales[item.productId]) {
          productSales[item.productId] = { title: item.title, revenue: 0, quantity: 0, type: '' };
        }
        productSales[item.productId].revenue += getNetPrice(order, item.price * item.quantity);
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
        categoryRevenue[category] = (categoryRevenue[category] || 0) + getNetPrice(order, item.price * item.quantity);
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
      const orderNetRevenue = order.totalPrice - (order.totalTax || 0);
      monthlyRevenue[monthKey] = (monthlyRevenue[monthKey] || 0) + orderNetRevenue;
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
      customerSpending[email].spent += order.totalPrice - (order.totalTax || 0);
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
          case 'totalPrice': aVal = a.totalPrice - (a.totalTax || 0); bVal = b.totalPrice - (b.totalTax || 0); break;
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
      const searchLower = customerSearch.toLowerCase().trim();
      const searchWords = searchLower.split(/\s+/).filter(w => w.length > 0);
      result = result.filter(c => {
        const fullName = `${c.firstName || ''} ${c.lastName || ''}`.toLowerCase();
        const email = (c.email || '').toLowerCase();
        const tagsStr = (c.tags || []).join(' ').toLowerCase();
        const searchableText = `${fullName} ${email} ${tagsStr}`;
        
        // All search words must match somewhere in the searchable text
        return searchWords.every(word => searchableText.includes(word));
      });
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
    // Show ALL orders for this customer, not just filtered by season
    return data.orders
      .filter(order => order.customerEmail === email)
      .sort((a, b) => new Date(b.processedAt).getTime() - new Date(a.processedAt).getTime());
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
      const taxRate = (order.totalPrice > 0 && (order.totalTax || 0) > 0) ? (order.totalTax || 0) / order.totalPrice : 0;
      order.purchasedItems.forEach(item => {
        monthlySales[monthKey].quantity += item.quantity;
        const gross = item.price * item.quantity;
        monthlySales[monthKey].revenue += gross * (1 - taxRate);
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
    
    const products = data.products.filter(p => (p.productType || '').toLowerCase() !== 'servizio');
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

  const allOrdersForCommunity = useMemo(() => {
    if (!data) return [];
    return data.orders.filter(o => {
      if (o.sourceName === 'shopify_draft_order' && o.totalPrice === 0) return false;
      return true;
    });
  }, [data]);

  const rfmData = useMemo(() => {
    if (!allOrdersForCommunity.length) return null;
    const now = new Date();
    const sixMonthsAgo = new Date(now); sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const thirtyDaysAgo = new Date(now); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const customerMap: Record<string, { email: string; name: string; orders: number; totalSpent: number; firstOrder: Date; lastOrder: Date }> = {};
    allOrdersForCommunity.forEach(order => {
      const email = order.customerEmail;
      if (!email) return;
      const orderDate = new Date(order.processedAt);
      const netAmount = order.totalPrice - (order.totalTax || 0);
      if (!customerMap[email]) {
        customerMap[email] = { email, name: order.customerName, orders: 0, totalSpent: 0, firstOrder: orderDate, lastOrder: orderDate };
      }
      customerMap[email].orders++;
      customerMap[email].totalSpent += netAmount;
      if (orderDate < customerMap[email].firstOrder) customerMap[email].firstOrder = orderDate;
      if (orderDate > customerMap[email].lastOrder) customerMap[email].lastOrder = orderDate;
    });
    const customers = Object.values(customerMap);
    const totalCustomers = customers.length;
    const champions = customers.filter(c => c.orders >= 3 && c.totalSpent >= 100);
    const atRisk = customers.filter(c => c.orders >= 2 && c.lastOrder < sixMonthsAgo);
    const newBlood = customers.filter(c => c.orders === 1 && c.firstOrder >= thirtyDaysAgo);
    const repeatCustomers = customers.filter(c => c.orders >= 2);
    const repeatRate = totalCustomers > 0 ? (repeatCustomers.length / totalCustomers) * 100 : 0;
    return {
      champions: { count: champions.length, avgSpend: champions.length > 0 ? champions.reduce((s, c) => s + c.totalSpent, 0) / champions.length : 0, totalRevenue: champions.reduce((s, c) => s + c.totalSpent, 0) },
      atRisk: { count: atRisk.length, avgSpend: atRisk.length > 0 ? atRisk.reduce((s, c) => s + c.totalSpent, 0) / atRisk.length : 0, totalRevenue: atRisk.reduce((s, c) => s + c.totalSpent, 0) },
      newBlood: { count: newBlood.length, avgSpend: newBlood.length > 0 ? newBlood.reduce((s, c) => s + c.totalSpent, 0) / newBlood.length : 0 },
      repeatRate, totalCustomers, repeatCustomers: repeatCustomers.length,
    };
  }, [allOrdersForCommunity]);

  const gatewayData = useMemo(() => {
    if (!allOrdersForCommunity.length) return { entryProducts: [] as { title: string; count: number }[], bundles: [] as { product1: string; product2: string; count: number }[] };
    const customerFirstOrders: Record<string, ShopifyOrder> = {};
    allOrdersForCommunity.forEach(order => {
      const email = order.customerEmail;
      if (!email) return;
      const orderDate = new Date(order.processedAt).getTime();
      if (!customerFirstOrders[email] || orderDate < new Date(customerFirstOrders[email].processedAt).getTime()) {
        customerFirstOrders[email] = order;
      }
    });
    const entryProductCount: Record<string, { title: string; count: number }> = {};
    Object.values(customerFirstOrders).forEach(order => {
      order.lineItems.forEach(item => {
        if (!entryProductCount[item.title]) entryProductCount[item.title] = { title: item.title, count: 0 };
        entryProductCount[item.title].count++;
      });
    });
    const entryProducts = Object.values(entryProductCount).sort((a, b) => b.count - a.count).slice(0, 10);
    const pairCount: Record<string, { product1: string; product2: string; count: number }> = {};
    allOrdersForCommunity.forEach(order => {
      const titles = [...new Set(order.lineItems.map(i => i.title))];
      for (let i = 0; i < titles.length; i++) {
        for (let j = i + 1; j < titles.length; j++) {
          const key = [titles[i], titles[j]].sort().join('|||');
          if (!pairCount[key]) pairCount[key] = { product1: titles[i], product2: titles[j], count: 0 };
          pairCount[key].count++;
        }
      }
    });
    const bundles = Object.values(pairCount).sort((a, b) => b.count - a.count).slice(0, 8);
    return { entryProducts, bundles };
  }, [allOrdersForCommunity]);

  const cohortData = useMemo(() => {
    if (!allOrdersForCommunity.length) return { cohorts: [] as any[], months: [] as string[] };
    const customerOrders: Record<string, Date[]> = {};
    allOrdersForCommunity.forEach(order => {
      const email = order.customerEmail;
      if (!email) return;
      if (!customerOrders[email]) customerOrders[email] = [];
      customerOrders[email].push(new Date(order.processedAt));
    });
    const cohortCustomers: Record<string, { email: string; firstMonth: string; orderMonths: Set<string> }> = {};
    Object.entries(customerOrders).forEach(([email, dates]) => {
      dates.sort((a, b) => a.getTime() - b.getTime());
      const firstDate = dates[0];
      const firstMonth = `${firstDate.getFullYear()}-${String(firstDate.getMonth() + 1).padStart(2, '0')}`;
      const orderMonths = new Set(dates.map(d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`));
      cohortCustomers[email] = { email, firstMonth, orderMonths };
    });
    const allMonths = [...new Set(Object.values(cohortCustomers).flatMap(c => [...c.orderMonths]))].sort();
    const cohortGroups: Record<string, typeof cohortCustomers[string][]> = {};
    Object.values(cohortCustomers).forEach(c => {
      if (!cohortGroups[c.firstMonth]) cohortGroups[c.firstMonth] = [];
      cohortGroups[c.firstMonth].push(c);
    });
    const recentCohorts = Object.keys(cohortGroups).sort().slice(-12);
    const cohorts = recentCohorts.map(cohortMonth => {
      const customers = cohortGroups[cohortMonth];
      const total = customers.length;
      const monthsAfter = allMonths.filter(m => m >= cohortMonth);
      const retention: { month: string; monthIndex: number; rate: number; count: number }[] = [];
      monthsAfter.forEach((month, idx) => {
        if (idx > 11) return;
        const active = customers.filter(c => c.orderMonths.has(month)).length;
        retention.push({ month, monthIndex: idx, rate: total > 0 ? (active / total) * 100 : 0, count: active });
      });
      const label = new Date(cohortMonth + '-01').toLocaleDateString('en-US', { year: '2-digit', month: 'short' });
      return { cohortMonth, label, total, retention };
    });
    const maxLen = Math.max(...cohorts.map(c => c.retention.length), 0);
    const months = Array.from({ length: Math.min(maxLen, 12) }, (_, i) => i === 0 ? 'M0' : `M+${i}`);
    return { cohorts, months };
  }, [allOrdersForCommunity]);

  const getHeatmapColor = (rate: number) => {
    if (rate === 0) return 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500';
    if (rate <= 5) return 'bg-orange-100 dark:bg-orange-900/20 text-orange-700';
    if (rate <= 15) return 'bg-orange-200 text-orange-800';
    if (rate <= 30) return 'bg-orange-300 text-orange-900';
    if (rate <= 50) return 'bg-orange-400 text-white';
    if (rate <= 75) return 'bg-orange-500 text-white';
    return 'bg-orange-600 text-white';
  };

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
          <p className="text-gray-600 dark:text-gray-400">{t('Loading Shopify data...')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 rounded-xl p-6 text-center">
        <AlertCircle size={32} className="text-red-500 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-red-800 mb-2">{t('Failed to Load Merchandising Data')}</h3>
        <p className="text-red-600 mb-4">{error}</p>
        <button onClick={loadData} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
          <RefreshCw size={16} className="inline mr-2" /> {t('Retry')}
        </button>
      </div>
    );
  }

  if (!data || !stats) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 text-center">
        <Package size={32} className="text-gray-400 dark:text-gray-500 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">{t('No Merchandising Data Available')}</h3>
        <p className="text-gray-500 dark:text-gray-400">{t('Connect your Shopify store to see merchandising analytics.')}</p>
      </div>
    );
  }

  const selectedProductStats = selectedProductId ? getProductStats(selectedProductId) : null;
  const selectedCustomerOrders = selectedCustomerId ? getCustomerOrders(selectedCustomerId) : [];
  const selectedOrder = selectedOrderId ? (data?.orders.find(o => o.id === selectedOrderId) || filteredOrders.find(o => o.id === selectedOrderId)) : null;
  const selectedCustomer = selectedCustomerId ? data.customers.find(c => c.email === selectedCustomerId) : null;

  return (
    <div className="space-y-6 pt-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <ShoppingBag size={28} className="text-orange-600" />
            {t('Merchandising Analytics')}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {stats.totalOrders.toLocaleString()} {t('orders')} | {formatCurrency(stats.totalRevenue)} {t('revenue')}
            {selectedMonth && <span className="ml-2 text-orange-600">• {t('Filtered')}: {selectedMonth}</span>}
            {data.lastUpdated && <span className="ml-2">• {t('Updated')} {formatDate(data.lastUpdated)}</span>}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setExcludeGameDayMerch(!excludeGameDayMerch)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              excludeGameDayMerch 
                ? 'bg-red-100 dark:bg-red-900/20 text-red-700 border border-red-200' 
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700'
            }`}
            title={excludeGameDayMerch ? 'GameDay merch is excluded (no double counting)' : 'GameDay merch is included (may double count)'}
          >
            {excludeGameDayMerch ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
            {t('Exclude GameDay')}
            {totalGameDayMerch > 0 && (
              <span className="text-xs opacity-75">({formatCurrency(totalGameDayMerch)})</span>
            )}
          </button>
          {selectedMonth && (
            <button
              onClick={clearMonthFilter}
              className="px-3 py-2 bg-orange-100 dark:bg-orange-900/20 text-orange-700 rounded-lg text-sm font-medium hover:bg-orange-200 transition-colors flex items-center gap-2"
            >
              <X size={14} /> {t('Clear Month Filter')}
            </button>
          )}
          <select
            value={selectedSeason}
            onChange={(e) => { setSelectedSeason(e.target.value); setSelectedMonth(null); }}
            className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            {availableSeasons.map(season => (
              <option key={season} value={season}>{t('Season')} {season}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {(['overview', 'products', 'orders', 'customers', 'inventory', 'community'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab 
                ? 'bg-orange-600 text-white' 
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
            }`}
          >
            {tab === 'overview' && <BarChart3 size={14} className="inline mr-2" />}
            {tab === 'products' && <Package size={14} className="inline mr-2" />}
            {tab === 'orders' && <ShoppingBag size={14} className="inline mr-2" />}
            {tab === 'customers' && <Users size={14} className="inline mr-2" />}
            {tab === 'inventory' && <Layers size={14} className="inline mr-2" />}
            {tab === 'community' && <Target size={14} className="inline mr-2" />}
            {tab === 'community' ? t('Community') : tab === 'overview' ? t('Overview') : tab === 'products' ? t('Products') : tab === 'orders' ? t('Orders') : tab === 'customers' ? t('Customers') : t('Inventory')}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-green-50 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                  <DollarSign size={16} className="text-green-600" />
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('Total Revenue')}</p>
              <p className="text-lg font-bold text-gray-800 dark:text-gray-100">{formatCurrency(stats.totalRevenue)}</p>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-orange-50 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                  <ShoppingBag size={16} className="text-orange-600" />
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('Total Orders')}</p>
              <p className="text-lg font-bold text-gray-800 dark:text-gray-100">{stats.totalOrders.toLocaleString()}</p>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <Users size={16} className="text-blue-600" />
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('Customers')}</p>
              <p className="text-lg font-bold text-gray-800 dark:text-gray-100">{stats.totalCustomers.toLocaleString()}</p>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-purple-50 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                  <TrendingUp size={16} className="text-purple-600" />
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('Avg Order Value')}</p>
              <p className="text-lg font-bold text-gray-800 dark:text-gray-100">{formatCurrency(stats.avgOrderValue)}</p>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
                  <Package size={16} className="text-indigo-600" />
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('Products')}</p>
              <p className="text-lg font-bold text-gray-800 dark:text-gray-100">{stats.totalProducts.toLocaleString()}</p>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-teal-50 dark:bg-teal-900/30 rounded-lg flex items-center justify-center">
                  <Layers size={16} className="text-teal-600" />
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('Inventory Units')}</p>
              <p className="text-lg font-bold text-gray-800 dark:text-gray-100">{stats.totalInventory.toLocaleString()}</p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-xl p-5 shadow-lg text-white">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white dark:bg-gray-900/20 rounded-lg flex items-center justify-center">
                  <Target size={20} className="text-white" />
                </div>
                <div>
                  <p className="text-sm text-white/80">{t('Season')} {selectedSeason} {t('Goal')}</p>
                  <p className="text-2xl font-bold">{formatCurrency(SEASON_GOAL)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-white/80">{t('Current Revenue')}</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</p>
              </div>
            </div>
            <div className="relative h-4 bg-white dark:bg-gray-900/20 rounded-full overflow-hidden">
              <div 
                className="absolute inset-y-0 left-0 bg-white dark:bg-gray-900 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(stats.goalProgress, 100)}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-sm">
              <span className="text-white/80">{stats.goalProgress.toFixed(1)}% {t('achieved')}</span>
              <span className="text-white/80">{formatCurrency(Math.max(0, SEASON_GOAL - stats.realisticRevenue))} {t('remaining')}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4">{t('Revenue by Category')}</h3>
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

            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">{t('Monthly Revenue Trend')}</h3>
                  {excludeGameDayMerch && totalGameDayMerch > 0 && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      <span className="inline-block w-2 h-2 bg-red-400 rounded mr-1"></span>
                      {t('GameDay merch shown in red (excluded from totals)')}
                    </p>
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">{t('Click a bar to filter by month')}</p>
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
                        name={t('Online Sales')}
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
                        name={t('GameDay Sales')}
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
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4">{t('Top Selling Products')}</h3>
              <div className="space-y-3">
                {stats.topProducts.slice(0, 5).map((product, i) => (
                  <div 
                    key={product.id} 
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    onClick={() => setSelectedProductId(product.id)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 bg-orange-100 dark:bg-orange-900/20 text-orange-700 rounded-full flex items-center justify-center text-xs font-bold">{i + 1}</span>
                      <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate max-w-[200px]">{product.title}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{product.quantity} {t('units sold')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-green-600">{formatCurrency(product.revenue)}</p>
                      <Eye size={14} className="text-gray-400 dark:text-gray-500" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4">{t('Top Customers')}</h3>
              <div className="space-y-3">
                {stats.topCustomers.slice(0, 5).map((customer, i) => (
                  <div 
                    key={customer.email} 
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    onClick={() => setSelectedCustomerId(customer.email)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 bg-blue-100 dark:bg-blue-900/20 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold">{i + 1}</span>
                      <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{customer.firstName} {customer.lastName}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{customer.orders} {t('orders')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-green-600">{formatCurrency(customer.spent)}</p>
                      <Eye size={14} className="text-gray-400 dark:text-gray-500" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'products' && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder={t("Search products by name, type, or SKU...")}
                value={productSearch}
                onChange={(e) => { setProductSearch(e.target.value); setProductsLimit(50); }}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <SortableHeader label={t("Product")} sortKey="title" currentSort={productSort} onSort={() => handleSort(productSort, 'title', setProductSort)} />
                  <SortableHeader label={t("Type")} sortKey="productType" currentSort={productSort} onSort={() => handleSort(productSort, 'productType', setProductSort)} />
                  <SortableHeader label={t("Price")} sortKey="price" currentSort={productSort} onSort={() => handleSort(productSort, 'price', setProductSort)} align="right" />
                  <SortableHeader label={t("Inventory")} sortKey="inventory" currentSort={productSort} onSort={() => handleSort(productSort, 'inventory', setProductSort)} align="right" />
                  <SortableHeader label={t("Status")} sortKey="status" currentSort={productSort} onSort={() => handleSort(productSort, 'status', setProductSort)} align="center" />
                  <th className="text-center px-4 py-3 font-semibold text-gray-700 dark:text-gray-200">{t('Actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.slice(0, productsLimit).map((product) => (
                  <React.Fragment key={product.id}>
                    <tr 
                      className="border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                      onClick={() => setSelectedProductId(product.id)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {product.images[0] ? (
                            <img src={product.images[0].src} alt={product.title} className="w-10 h-10 object-cover rounded-lg" />
                          ) : (
                            <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                              <Package size={16} className="text-gray-400 dark:text-gray-500" />
                            </div>
                          )}
                          <span className="font-medium text-gray-800 dark:text-gray-100">{product.title}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{product.productType || '-'}</td>
                      <td className="px-4 py-3 text-right text-gray-800 dark:text-gray-100">
                        {product.variants.length === 1 
                          ? formatCurrency(product.variants[0].price)
                          : `${formatCurrency(Math.min(...product.variants.map(v => v.price)))} - ${formatCurrency(Math.max(...product.variants.map(v => v.price)))}`
                        }
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={product.totalInventory <= 0 ? 'text-red-600 font-semibold' : product.totalInventory < 10 ? 'text-amber-600' : 'text-gray-800 dark:text-gray-100'}>
                          {product.totalInventory}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          product.status === 'active' ? 'bg-green-100 dark:bg-green-900/20 text-green-700' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                        }`}>
                          {product.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setSelectedProductId(product.id); }}
                          className="px-3 py-1 bg-orange-100 dark:bg-orange-900/20 text-orange-700 rounded-lg text-xs font-medium hover:bg-orange-200 transition-colors"
                        >
                          <Eye size={12} className="inline mr-1" /> {t('View')}
                        </button>
                      </td>
                    </tr>
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
          {filteredProducts.length > productsLimit ? (
            <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 text-center">
              <span className="text-sm text-gray-500 dark:text-gray-400 mr-3">{t('Showing')} {productsLimit} {t('of')} {filteredProducts.length} {t('products')}</span>
              <button 
                onClick={() => setProductsLimit(l => l + 50)}
                className="px-4 py-1.5 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-700 transition-colors"
              >
                {t('Load More')}
              </button>
            </div>
          ) : filteredProducts.length > 0 && (
            <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 text-center text-sm text-gray-500 dark:text-gray-400">
              {t('Showing all')} {filteredProducts.length} {t('products')}
            </div>
          )}
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder={t("Search orders by number, date, customer, total, payment...")}
                value={orderSearch}
                onChange={(e) => { setOrderSearch(e.target.value); setOrdersLimit(50); }}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <SortableHeader label={t("Order")} sortKey="orderNumber" currentSort={orderSort} onSort={() => handleSort(orderSort, 'orderNumber', setOrderSort)} />
                  <SortableHeader label={t("Date")} sortKey="processedAt" currentSort={orderSort} onSort={() => handleSort(orderSort, 'processedAt', setOrderSort)} />
                  <SortableHeader label={t("Customer")} sortKey="customerName" currentSort={orderSort} onSort={() => handleSort(orderSort, 'customerName', setOrderSort)} />
                  <SortableHeader label={t("Items")} sortKey="itemCount" currentSort={orderSort} onSort={() => handleSort(orderSort, 'itemCount', setOrderSort)} align="right" />
                  <SortableHeader label={t("Total")} sortKey="totalPrice" currentSort={orderSort} onSort={() => handleSort(orderSort, 'totalPrice', setOrderSort)} align="right" />
                  <SortableHeader label={t("Payment")} sortKey="paymentMethod" currentSort={orderSort} onSort={() => handleSort(orderSort, 'paymentMethod', setOrderSort)} align="center" />
                  <SortableHeader label={t("Fulfillment")} sortKey="fulfillmentStatus" currentSort={orderSort} onSort={() => handleSort(orderSort, 'fulfillmentStatus', setOrderSort)} align="center" />
                  <th className="text-center px-4 py-3 font-semibold text-gray-700 dark:text-gray-200">{t('Actions')}</th>
                </tr>
              </thead>
              <tbody>
                {searchedOrders.slice(0, ordersLimit).map((order) => (
                  <tr 
                    key={order.id} 
                    className="border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                    onClick={() => setSelectedOrderId(order.id)}
                  >
                    <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-100">#{order.orderNumber}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{formatDate(order.processedAt)}</td>
                    <td className="px-4 py-3">
                      <p className="text-gray-800 dark:text-gray-100">{order.customerName}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{order.customerEmail}</p>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-400">{order.itemCount}</td>
                    <td className="px-4 py-3 text-right font-medium text-gray-800 dark:text-gray-100">{formatCurrency(order.totalPrice - (order.totalTax || 0))}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1 ${
                        order.financialStatus === 'paid' ? 'bg-green-100 dark:bg-green-900/20 text-green-700' :
                        order.financialStatus === 'pending' ? 'bg-amber-100 dark:bg-amber-900/20 text-amber-700' :
                        'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                      }`}>
                        <CreditCard size={10} />
                        {getPaymentMethod(order)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        order.fulfillmentStatus === 'fulfilled' ? 'bg-green-100 dark:bg-green-900/20 text-green-700' :
                        order.fulfillmentStatus === 'partial' ? 'bg-amber-100 dark:bg-amber-900/20 text-amber-700' :
                        'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                      }`}>
                        {order.fulfillmentStatus || 'unfulfilled'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setSelectedOrderId(order.id); }}
                        className="px-3 py-1 bg-orange-100 dark:bg-orange-900/20 text-orange-700 rounded-lg text-xs font-medium hover:bg-orange-200 transition-colors"
                      >
                        <Eye size={12} className="inline mr-1" /> {t('View')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {searchedOrders.length > ordersLimit ? (
            <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 text-center">
              <span className="text-sm text-gray-500 dark:text-gray-400 mr-3">{t('Showing')} {ordersLimit} {t('of')} {searchedOrders.length} {t('orders')}</span>
              <button 
                onClick={() => setOrdersLimit(l => l + 50)}
                className="px-4 py-1.5 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-700 transition-colors"
              >
                {t('Load More')}
              </button>
            </div>
          ) : (
            <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 text-center text-sm text-gray-500 dark:text-gray-400">
              {t('Showing all')} {searchedOrders.length} {t('orders')} {t('for season')} {selectedSeason}
              {selectedMonth && ` in ${selectedMonth}`}
            </div>
          )}
        </div>
      )}

      {activeTab === 'customers' && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder={t("Search all customers by name, email, or tag...")}
                value={customerSearch}
                onChange={(e) => { setCustomerSearch(e.target.value); setCustomersLimit(50); }}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <SortableHeader label={t("Customer")} sortKey="name" currentSort={customerSort} onSort={() => handleSort(customerSort, 'name', setCustomerSort)} />
                  <SortableHeader label={t("Email")} sortKey="email" currentSort={customerSort} onSort={() => handleSort(customerSort, 'email', setCustomerSort)} />
                  <SortableHeader label={t("Orders")} sortKey="ordersCount" currentSort={customerSort} onSort={() => handleSort(customerSort, 'ordersCount', setCustomerSort)} align="right" />
                  <SortableHeader label={t("Total Spent")} sortKey="totalSpent" currentSort={customerSort} onSort={() => handleSort(customerSort, 'totalSpent', setCustomerSort)} align="right" />
                  <SortableHeader label={t("Member Since")} sortKey="createdAt" currentSort={customerSort} onSort={() => handleSort(customerSort, 'createdAt', setCustomerSort)} />
                  <th className="text-left px-4 py-3 font-semibold text-gray-700 dark:text-gray-200">{t('Tags')}</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-700 dark:text-gray-200">{t('Actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.slice(0, customerSearch.trim() ? Math.max(customersLimit, 100) : customersLimit).map((customer) => (
                  <tr 
                    key={customer.id} 
                    className="border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                    onClick={() => setSelectedCustomerId(customer.email)}
                  >
                    <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-100">{customer.firstName} {customer.lastName}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{customer.email}</td>
                    <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-400">{customer.ordersCount}</td>
                    <td className="px-4 py-3 text-right font-medium text-green-600">{formatCurrency(customer.totalSpent)}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{formatDate(customer.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {customer.tags.slice(0, 3).map((tag, i) => (
                          <span key={i} className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded text-xs">{tag}</span>
                        ))}
                        {customer.tags.length > 3 && (
                          <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded text-xs">+{customer.tags.length - 3}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setSelectedCustomerId(customer.email); }}
                        className="px-3 py-1 bg-orange-100 dark:bg-orange-900/20 text-orange-700 rounded-lg text-xs font-medium hover:bg-orange-200 transition-colors"
                      >
                        <Eye size={12} className="inline mr-1" /> {t('View')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {(() => {
            const displayLimit = customerSearch.trim() ? Math.max(customersLimit, 100) : customersLimit;
            const isSearching = customerSearch.trim().length > 0;
            if (filteredCustomers.length > displayLimit) {
              return (
                <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 text-center">
                  <span className="text-sm text-gray-500 dark:text-gray-400 mr-3">
                    {isSearching ? `${t('Found')} ${filteredCustomers.length} ${t('customers matching')} "${customerSearch}" - ${t('showing')} ${displayLimit}` : `${t('Showing')} ${displayLimit} ${t('of')} ${filteredCustomers.length} ${t('customers')}`}
                  </span>
                  <button 
                    onClick={() => setCustomersLimit(l => l + 100)}
                    className="px-4 py-1.5 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-700 transition-colors"
                  >
                    {t('Load More')}
                  </button>
                </div>
              );
            } else if (filteredCustomers.length > 0) {
              return (
                <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 text-center text-sm text-gray-500 dark:text-gray-400">
                  {isSearching ? `${t('Found')} ${filteredCustomers.length} ${t('customers matching')} "${customerSearch}"` : `${t('Showing all')} ${filteredCustomers.length} ${t('customers')}`}
                </div>
              );
            }
            return null;
          })()}
        </div>
      )}

      {activeTab === 'inventory' && inventoryStats && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                  <Layers size={16} className="text-blue-600" />
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('Total Units')}</p>
              <p className="text-xl font-bold text-gray-800 dark:text-gray-100">{inventoryStats.totalUnits.toLocaleString()}</p>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                  <DollarSign size={16} className="text-green-600" />
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('Inventory Value')}</p>
              <p className="text-xl font-bold text-gray-800 dark:text-gray-100">{formatCurrency(inventoryStats.totalValue)}</p>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                  <AlertCircle size={16} className="text-orange-600" />
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('Low Stock')}</p>
              <p className="text-xl font-bold text-orange-600">{inventoryStats.lowStock.length}</p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500">≤5 units</p>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                  <X size={16} className="text-red-600" />
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('Out of Stock')}</p>
              <p className="text-xl font-bold text-red-600">{inventoryStats.outOfStock.length}</p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500">{inventoryStats.totalProducts} {t('total products')}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2">
                <BarChart3 size={16} className="text-gray-400 dark:text-gray-500" />
                {t('Inventory by Category')}
                <span className="text-xs text-gray-400 dark:text-gray-500 ml-auto">{t('Click to view products')}</span>
              </h3>
              <div className="space-y-2">
                {inventoryStats.byCategory.slice(0, 8).map((cat, i) => (
                  <div 
                    key={cat.name} 
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                    onClick={() => setSelectedCategory(cat.name)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-sm text-gray-700 dark:text-gray-200 hover:text-blue-600">{cat.name}</span>
                      <span className="text-xs text-gray-400 dark:text-gray-500">({cat.products} {t('products')})</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-gray-500 dark:text-gray-400">{cat.units.toLocaleString()} {t('units')}</span>
                      <span className="font-medium text-gray-800 dark:text-gray-100 w-24 text-right">{formatCurrency(cat.value)}</span>
                    </div>
                  </div>
                ))}
              </div>
              {inventoryStats.byCategory.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
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

            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2">
                <Package size={16} className="text-gray-400 dark:text-gray-500" />
                {t('Top Stocked Products')}
              </h3>
              <div className="space-y-2">
                {inventoryStats.topStocked.map((product, i) => (
                  <div key={product.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="text-xs text-gray-400 dark:text-gray-500 w-5">{i + 1}.</span>
                      <span className="text-sm text-gray-700 dark:text-gray-200 truncate">{product.title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 dark:text-gray-500">{product.productType || 'N/A'}</span>
                      <span className="text-sm font-bold text-gray-800 dark:text-gray-100 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded">
                        {product.totalInventory.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {inventoryStats.lowStockVariants.length > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-orange-200 p-5">
              <h3 className="text-sm font-semibold text-orange-700 mb-4 flex items-center gap-2">
                <AlertCircle size={16} />
                {t('Low Stock Alert')} ({inventoryStats.lowStockVariants.length} {t('variants')})
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-orange-100">
                      <th className="text-left py-2 px-3 text-gray-600 dark:text-gray-400 font-medium">{t('Product')}</th>
                      <th className="text-left py-2 px-3 text-gray-600 dark:text-gray-400 font-medium">{t('Variant')}</th>
                      <th className="text-left py-2 px-3 text-gray-600 dark:text-gray-400 font-medium">{t('SKU')}</th>
                      <th className="text-right py-2 px-3 text-gray-600 dark:text-gray-400 font-medium">{t('Price')}</th>
                      <th className="text-right py-2 px-3 text-gray-600 dark:text-gray-400 font-medium">{t('Qty')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventoryStats.lowStockVariants.slice(0, 15).map((v, i) => (
                      <tr key={i} className="border-b border-orange-50 hover:bg-orange-50/50 dark:bg-orange-900/30">
                        <td className="py-2 px-3 text-gray-700 dark:text-gray-200">{v.productTitle}</td>
                        <td className="py-2 px-3 text-gray-500 dark:text-gray-400">{v.variantTitle}</td>
                        <td className="py-2 px-3 text-gray-400 dark:text-gray-500 font-mono text-xs">{v.sku || '-'}</td>
                        <td className="py-2 px-3 text-right text-gray-600 dark:text-gray-400">{formatCurrency(v.price)}</td>
                        <td className="py-2 px-3 text-right">
                          <span className="font-bold text-orange-600 bg-orange-100 dark:bg-orange-900/20 px-2 py-0.5 rounded">{v.quantity}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {inventoryStats.lowStockVariants.length > 15 && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-3 text-center">
                  {t('Showing')} 15 {t('of')} {inventoryStats.lowStockVariants.length} {t('low stock items')}
                </p>
              )}
            </div>
          )}

          {inventoryStats.outOfStockVariants.length > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-red-200 p-5">
              <h3 className="text-sm font-semibold text-red-700 mb-4 flex items-center gap-2">
                <X size={16} />
                {t('Out of Stock')} ({inventoryStats.outOfStockVariants.length} {t('variants')})
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-red-100">
                      <th className="text-left py-2 px-3 text-gray-600 dark:text-gray-400 font-medium">{t('Product')}</th>
                      <th className="text-left py-2 px-3 text-gray-600 dark:text-gray-400 font-medium">{t('Variant')}</th>
                      <th className="text-left py-2 px-3 text-gray-600 dark:text-gray-400 font-medium">{t('SKU')}</th>
                      <th className="text-right py-2 px-3 text-gray-600 dark:text-gray-400 font-medium">{t('Price')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventoryStats.outOfStockVariants.slice(0, 20).map((v, i) => (
                      <tr key={i} className="border-b border-red-50 hover:bg-red-50/50 dark:bg-red-900/30">
                        <td className="py-2 px-3 text-gray-700 dark:text-gray-200">{v.productTitle}</td>
                        <td className="py-2 px-3 text-gray-500 dark:text-gray-400">{v.variantTitle}</td>
                        <td className="py-2 px-3 text-gray-400 dark:text-gray-500 font-mono text-xs">{v.sku || '-'}</td>
                        <td className="py-2 px-3 text-right text-gray-600 dark:text-gray-400">{formatCurrency(v.price)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {inventoryStats.outOfStockVariants.length > 20 && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-3 text-center">
                  {t('Showing')} 20 {t('of')} {inventoryStats.outOfStockVariants.length} {t('out of stock items')}
                </p>
              )}
            </div>
          )}

          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4">{t('Inventory Summary')}</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-500 dark:text-gray-400">{t('Products')}</p>
                <p className="font-bold text-gray-800 dark:text-gray-100">{inventoryStats.totalProducts}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">{t('Variants')}</p>
                <p className="font-bold text-gray-800 dark:text-gray-100">{inventoryStats.totalVariants}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">{t('Avg. Price')}</p>
                <p className="font-bold text-gray-800 dark:text-gray-100">{formatCurrency(inventoryStats.avgPrice)}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">{t('Stock Health')}</p>
                <p className="font-bold text-green-600">
                  {((inventoryStats.healthyStock.length / inventoryStats.totalProducts) * 100).toFixed(0)}% {t('healthy')}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'community' && rfmData && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                <Heart size={20} className="text-orange-600" />
                {t('Customer Loyalty & RFM Breakdown')}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('All seasons')} | {allOrdersForCommunity.length.toLocaleString()} {t('orders')} | {rfmData.totalCustomers.toLocaleString()} {t('unique customers')}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-green-50 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                  <Sparkles size={20} className="text-green-600" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">{t('Champions')}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t('High frequency, high spend')}</p>
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-800 dark:text-gray-100">{rfmData.champions.count}</p>
              <div className="mt-2 space-y-1">
                <p className="text-xs text-gray-500 dark:text-gray-400">{t('Avg Spend')}: <span className="font-medium text-gray-700 dark:text-gray-200">{formatCurrency(rfmData.champions.avgSpend)}</span></p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{t('Total Revenue')}: <span className="font-medium text-green-600">{formatCurrency(rfmData.champions.totalRevenue)}</span></p>
              </div>
              <div className="mt-3 h-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full" style={{ width: `${Math.min((rfmData.champions.count / rfmData.totalCustomers) * 100, 100)}%` }} />
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{((rfmData.champions.count / rfmData.totalCustomers) * 100).toFixed(1)}% {t('of customers')}</p>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-red-50 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                  <AlertTriangle size={20} className="text-red-600" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">{t('At Risk')}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t('No purchase in 6+ months')}</p>
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-800 dark:text-gray-100">{rfmData.atRisk.count}</p>
              <div className="mt-2 space-y-1">
                <p className="text-xs text-gray-500 dark:text-gray-400">{t('Avg Spend')}: <span className="font-medium text-gray-700 dark:text-gray-200">{formatCurrency(rfmData.atRisk.avgSpend)}</span></p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{t('Revenue at Risk')}: <span className="font-medium text-red-600">{formatCurrency(rfmData.atRisk.totalRevenue)}</span></p>
              </div>
              <div className="mt-3 h-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-red-500 rounded-full" style={{ width: `${Math.min((rfmData.atRisk.count / rfmData.totalCustomers) * 100, 100)}%` }} />
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{((rfmData.atRisk.count / rfmData.totalCustomers) * 100).toFixed(1)}% {t('of customers')}</p>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <TrendingUp size={20} className="text-blue-600" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">{t('New Blood')}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t('First-time buyers (last 30 days)')}</p>
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-800 dark:text-gray-100">{rfmData.newBlood.count}</p>
              <div className="mt-2 space-y-1">
                <p className="text-xs text-gray-500 dark:text-gray-400">{t('Avg First Purchase')}: <span className="font-medium text-gray-700 dark:text-gray-200">{formatCurrency(rfmData.newBlood.avgSpend)}</span></p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{t('Conversion Window')}: <span className="font-medium text-blue-600">{t('Active')}</span></p>
              </div>
              <div className="mt-3 h-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min((rfmData.newBlood.count / rfmData.totalCustomers) * 100, 100)}%` }} />
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{((rfmData.newBlood.count / rfmData.totalCustomers) * 100).toFixed(1)}% {t('of customers')}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Target size={18} className="text-orange-600" />
                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">{t('Repeat Purchase Rate')}</h3>
              </div>
              <span className="text-2xl font-bold text-orange-600">{rfmData.repeatRate.toFixed(1)}%</span>
            </div>
            <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-orange-400 to-orange-600 rounded-full transition-all duration-1000" style={{ width: `${Math.min(rfmData.repeatRate, 100)}%` }} />
            </div>
            <div className="flex justify-between mt-2">
              <p className="text-xs text-gray-500 dark:text-gray-400">{rfmData.repeatCustomers.toLocaleString()} {t('repeat customers')}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{rfmData.totalCustomers.toLocaleString()} {t('total')}</p>
            </div>
          </div>

          {gatewayData.entryProducts.length > 0 && (
            <>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                <Package size={20} className="text-orange-600" />
                {t('Gateway & Bundle Analysis')}
              </h2>

              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                  <BarChart3 size={16} className="text-orange-600" />
                  {t('Top Entry Products')}
                  <span className="text-xs font-normal text-gray-500 dark:text-gray-400 ml-1">{t('Most common first purchase')}</span>
                </h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={gatewayData.entryProducts} layout="vertical" margin={{ left: 10, right: 20, top: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 12 }} />
                      <YAxis type="category" dataKey="title" width={180} tick={{ fontSize: 11 }} tickFormatter={(v: string) => v.length > 28 ? v.slice(0, 25) + '...' : v} />
                      <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '12px' }} formatter={(value: number) => [`${value} customers`, 'Entry Count']} />
                      <Bar dataKey="count" radius={[0, 6, 6, 0]} maxBarSize={28}>
                        {gatewayData.entryProducts.map((_, idx) => (
                          <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {gatewayData.bundles.length > 0 && (
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                    <Layers size={16} className="text-orange-600" />
                    {t('Frequently Bought Together')}
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                          <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">#</th>
                          <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('Product 1')}</th>
                          <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('Product 2')}</th>
                          <th className="text-right py-2 px-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('Co-Purchases')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {gatewayData.bundles.map((bundle, idx) => (
                          <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                            <td className="py-2.5 px-3 text-gray-400 dark:text-gray-500 font-medium">{idx + 1}</td>
                            <td className="py-2.5 px-3 text-gray-800 dark:text-gray-100 font-medium"><span className="line-clamp-1">{bundle.product1}</span></td>
                            <td className="py-2.5 px-3 text-gray-800 dark:text-gray-100 font-medium"><span className="line-clamp-1">{bundle.product2}</span></td>
                            <td className="py-2.5 px-3 text-right">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-orange-50 dark:bg-orange-900/30 text-orange-700 text-xs font-medium">{bundle.count}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}

          {cohortData.cohorts.length > 0 && (
            <>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                <BarChart3 size={20} className="text-orange-600" />
                {t('Cohort Retention Heatmap')}
              </h2>

              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">{t('Percentage of customers who returned in subsequent months after their first purchase')}</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr>
                        <th className="text-left py-2 px-2 text-gray-500 dark:text-gray-400 font-medium sticky left-0 bg-white dark:bg-gray-900 min-w-[80px]">{t('Cohort')}</th>
                        <th className="text-center py-2 px-1 text-gray-500 dark:text-gray-400 font-medium min-w-[44px]">{t('Size')}</th>
                        {cohortData.months.map((m: string) => (
                          <th key={m} className="text-center py-2 px-1 text-gray-500 dark:text-gray-400 font-medium min-w-[44px]">{m}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {cohortData.cohorts.map((cohort: any) => (
                        <tr key={cohort.cohortMonth} className="border-t border-gray-50">
                          <td className="py-1.5 px-2 font-medium text-gray-700 dark:text-gray-200 sticky left-0 bg-white dark:bg-gray-900 whitespace-nowrap">{cohort.label}</td>
                          <td className="py-1.5 px-1 text-center text-gray-600 dark:text-gray-400 font-medium">{cohort.total}</td>
                          {cohortData.months.map((_: string, idx: number) => {
                            const ret = cohort.retention[idx];
                            if (!ret) return <td key={idx} className="py-1.5 px-1"><div className="w-10 h-8 rounded bg-gray-50 dark:bg-gray-800 mx-auto" /></td>;
                            return (
                              <td key={idx} className="py-1.5 px-1">
                                <div
                                  className={`w-10 h-8 rounded flex items-center justify-center text-[10px] font-medium mx-auto ${getHeatmapColor(ret.rate)}`}
                                  title={`${ret.count} of ${cohort.total} customers (${ret.rate.toFixed(1)}%)`}
                                >
                                  {ret.rate >= 1 ? `${Math.round(ret.rate)}%` : ret.rate > 0 ? '<1%' : '0%'}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex items-center gap-2 mt-4 text-xs text-gray-500 dark:text-gray-400">
                  <span>{t('Low')}</span>
                  <div className="flex gap-0.5">
                    <div className="w-6 h-4 rounded bg-gray-100 dark:bg-gray-800" />
                    <div className="w-6 h-4 rounded bg-orange-100 dark:bg-orange-900/20" />
                    <div className="w-6 h-4 rounded bg-orange-200" />
                    <div className="w-6 h-4 rounded bg-orange-300" />
                    <div className="w-6 h-4 rounded bg-orange-400" />
                    <div className="w-6 h-4 rounded bg-orange-500" />
                    <div className="w-6 h-4 rounded bg-orange-600" />
                  </div>
                  <span>{t('High')}</span>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {selectedCategory && data && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedCategory(null)}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{selectedCategory}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {data.products.filter(p => (p.productType || 'Uncategorized') === selectedCategory).length} {t('products in this category')}
                </p>
              </div>
              <button onClick={() => setSelectedCategory(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                <X size={20} className="text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-800">
                      <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-400">{t('Product')}</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-600 dark:text-gray-400">{t('Price')}</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-600 dark:text-gray-400">{t('Inventory')}</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-600 dark:text-gray-400">{t('Value')}</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-600 dark:text-gray-400">{t('Status')}</th>
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
                          <tr key={product.id} className="border-b border-gray-50 hover:bg-gray-50 dark:hover:bg-gray-800">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                {product.images[0] ? (
                                  <img src={product.images[0].src} alt="" className="w-10 h-10 rounded-lg object-cover" />
                                ) : (
                                  <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                                    <Package size={16} className="text-gray-400 dark:text-gray-500" />
                                  </div>
                                )}
                                <div>
                                  <p className="font-medium text-gray-800 dark:text-gray-100">{product.title}</p>
                                  <p className="text-xs text-gray-400 dark:text-gray-500">{product.variants.length} {product.variants.length !== 1 ? t('variants_plural') : t('variant')}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-right text-gray-700 dark:text-gray-200">{formatCurrency(avgPrice)}</td>
                            <td className="py-3 px-4 text-right">
                              <span className={product.totalInventory <= 0 ? 'text-red-600 font-semibold' : product.totalInventory < 10 ? 'text-amber-600' : 'text-gray-800 dark:text-gray-100'}>
                                {product.totalInventory.toLocaleString()}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right font-medium text-gray-800 dark:text-gray-100">{formatCurrency(inventoryValue)}</td>
                            <td className="py-3 px-4 text-center">
                              {product.totalInventory <= 0 ? (
                                <span className="px-2 py-1 text-xs font-medium bg-red-100 dark:bg-red-900/20 text-red-700 rounded-full">{t('Out of Stock')}</span>
                              ) : product.totalInventory < 10 ? (
                                <span className="px-2 py-1 text-xs font-medium bg-amber-100 dark:bg-amber-900/20 text-amber-700 rounded-full">{t('Low Stock')}</span>
                              ) : (
                                <span className="px-2 py-1 text-xs font-medium bg-green-100 dark:bg-green-900/20 text-green-700 rounded-full">{t('In Stock')}</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
                <span>
                  {t('Total')}: {data.products.filter(p => (p.productType || 'Uncategorized') === selectedCategory).reduce((sum, p) => sum + p.totalInventory, 0).toLocaleString()} {t('units')}
                </span>
                <span>
                  {t('Value')}: {formatCurrency(data.products.filter(p => (p.productType || 'Uncategorized') === selectedCategory).reduce((sum, p) => sum + p.variants.reduce((vs, v) => vs + v.price * v.inventoryQuantity, 0), 0))}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedProductStats && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedProductId(null)}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{t('Product Details')}</h2>
              <button onClick={() => setSelectedProductId(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                <X size={20} className="text-gray-500 dark:text-gray-400" />
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
                  <div className="w-32 h-32 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center">
                    <Package size={40} className="text-gray-400 dark:text-gray-500" />
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">{selectedProductStats.product.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{selectedProductStats.product.productType || t('No category')}</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                    <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-3 text-center">
                      <p className="text-xs text-green-600">{t('Revenue')}</p>
                      <p className="text-lg font-bold text-green-700">{formatCurrency(selectedProductStats.totalRevenue)}</p>
                    </div>
                    <div className="bg-orange-50 dark:bg-orange-900/30 rounded-lg p-3 text-center">
                      <p className="text-xs text-orange-600">{t('Units Sold')}</p>
                      <p className="text-lg font-bold text-orange-700">{selectedProductStats.totalSold}</p>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-3 text-center">
                      <p className="text-xs text-blue-600">{t('In Stock')}</p>
                      <p className="text-lg font-bold text-blue-700">{selectedProductStats.product.totalInventory}</p>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/30 rounded-lg p-3 text-center">
                      <p className="text-xs text-purple-600">{t('Price')}</p>
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
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">{t('Variants')}</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedProductStats.product.variants.map(variant => (
                      <div key={variant.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <span className="text-sm text-gray-700 dark:text-gray-200">{variant.title}</span>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="font-medium">{formatCurrency(variant.price)}</span>
                          <span className={variant.inventoryQuantity <= 0 ? 'text-red-600' : 'text-gray-500 dark:text-gray-400'}>
                            {variant.inventoryQuantity} {t('in stock')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedProductStats.monthlySales.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">{t('Sales History')}</h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={selectedProductStats.monthlySales}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                      <YAxis tickFormatter={(v) => `€${(v/1).toLocaleString('it-IT', { maximumFractionDigits: 0 })}`} tick={{ fontSize: 10 }} />
                      <Tooltip formatter={(value: number) => [formatCurrency(value), t('Revenue_tooltip')]} />
                      <Bar dataKey="revenue" fill="#ea580c" radius={[4, 4, 0, 0]} name={t('Revenue_tooltip')} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              <div>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">{t('Recent Purchases')} ({selectedProductStats.orders.length})</h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {selectedProductStats.orders.slice(0, 20).map(order => (
                    <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{order.customerName}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(order.processedAt)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
                          {order.purchasedItems.reduce((sum, item) => sum + item.quantity, 0)} {t('units')}
                        </p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          order.financialStatus === 'paid' ? 'bg-green-100 dark:bg-green-900/20 text-green-700' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
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
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{t('Customer Details')}</h2>
              <button onClick={() => setSelectedCustomerId(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                <X size={20} className="text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-start gap-6">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                  <Users size={28} className="text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">
                    {selectedCustomer ? `${selectedCustomer.firstName} ${selectedCustomer.lastName}` : selectedCustomerOrders[0]?.customerName || t('Guest')}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{selectedCustomer?.email || selectedCustomerId}</p>
                  {selectedCustomer?.tags && selectedCustomer.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedCustomer.tags.map((tag, i) => (
                        <span key={i} className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded text-xs">{tag}</span>
                      ))}
                    </div>
                  )}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                    <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-3 text-center">
                      <p className="text-xs text-green-600">{t('Total Spent')}</p>
                      <p className="text-lg font-bold text-green-700">
                        {formatCurrency(selectedCustomer?.totalSpent || selectedCustomerOrders.reduce((sum, o) => sum + o.totalPrice - (o.totalTax || 0), 0))}
                      </p>
                    </div>
                    <div className="bg-orange-50 dark:bg-orange-900/30 rounded-lg p-3 text-center">
                      <p className="text-xs text-orange-600">{t('Orders')}</p>
                      <p className="text-lg font-bold text-orange-700">{selectedCustomer?.ordersCount || selectedCustomerOrders.length}</p>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-3 text-center">
                      <p className="text-xs text-blue-600">{t('This Season')}</p>
                      <p className="text-lg font-bold text-blue-700">{selectedCustomerOrders.length}</p>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/30 rounded-lg p-3 text-center">
                      <p className="text-xs text-purple-600">{t('Member Since')}</p>
                      <p className="text-sm font-bold text-purple-700">
                        {selectedCustomer ? formatDate(selectedCustomer.createdAt) : formatDate(selectedCustomerOrders[selectedCustomerOrders.length - 1]?.processedAt || '')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">{t('Purchase History')} ({selectedCustomerOrders.length})</h4>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {selectedCustomerOrders.map(order => (
                    <div key={order.id} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{t('Order')} #{order.orderNumber}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(order.processedAt)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-green-600">{formatCurrency(order.totalPrice - (order.totalTax || 0))}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                            order.financialStatus === 'paid' ? 'bg-green-100 dark:bg-green-900/20 text-green-700' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                          }`}>
                            <CreditCard size={10} />
                            {getPaymentMethod(order)}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        {order.lineItems.map((item, i) => (
                          <div key={i} className="flex items-center justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">{item.title}</span>
                            <span className="text-gray-800 dark:text-gray-100">{item.quantity} x {formatCurrency(item.price)}</span>
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
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{t('Order')} #{selectedOrder.orderNumber}</h2>
              <button onClick={() => setSelectedOrderId(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                <X size={20} className="text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t('Customer')}</p>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{selectedOrder.customerName}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{selectedOrder.customerEmail}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t('Date')}</p>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{formatDate(selectedOrder.processedAt)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t('Payment Method')}</p>
                  <span className={`text-sm px-2 py-1 rounded-full inline-flex items-center gap-1 ${
                    selectedOrder.financialStatus === 'paid' ? 'bg-green-100 dark:bg-green-900/20 text-green-700' : 'bg-amber-100 dark:bg-amber-900/20 text-amber-700'
                  }`}>
                    <CreditCard size={12} />
                    {getPaymentMethod(selectedOrder)}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t('Fulfillment')}</p>
                  <span className={`text-sm px-2 py-1 rounded-full ${
                    selectedOrder.fulfillmentStatus === 'fulfilled' ? 'bg-green-100 dark:bg-green-900/20 text-green-700' :
                    selectedOrder.fulfillmentStatus === 'partial' ? 'bg-amber-100 dark:bg-amber-900/20 text-amber-700' :
                    'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                  }`}>
                    {selectedOrder.fulfillmentStatus || t('Unfulfilled')}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">{t('Items')} ({selectedOrder.itemCount})</h4>
                <div className="space-y-2">
                  {selectedOrder.lineItems.map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{item.title}</p>
                        {item.sku && <p className="text-xs text-gray-500 dark:text-gray-400">{t('SKU')}: {item.sku}</p>}
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{item.quantity} x {formatCurrency(item.price)}</p>
                        <p className="text-sm font-bold text-green-600">{formatCurrency(item.price * item.quantity)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold text-gray-800 dark:text-gray-100">{t('Total')}</span>
                  <span className="text-xl font-bold text-green-600">{formatCurrency(selectedOrder.totalPrice - (selectedOrder.totalTax || 0))}</span>
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
