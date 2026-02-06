import React, { useMemo, useState, useEffect } from 'react';
import { Users, Heart, AlertTriangle, Sparkles, ShoppingBag, Package, TrendingUp, BarChart3, Layers, Target, RefreshCw, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

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
  variants: { id: string; title: string; price: number; inventoryQuantity: number; sku: string }[];
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

const formatCurrency = (value: number) => {
  const formatted = new Intl.NumberFormat('de-DE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
  return `${formatted} €`;
};

export function CommunityIntelligenceHub() {
  const [data, setData] = useState<MerchandisingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const res = await fetch('/api/shopify/data');
        if (!res.ok) throw new Error('Failed to fetch');
        const json = await res.json();
        setData(json);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const allOrders = useMemo(() => {
    if (!data) return [];
    return data.orders.filter(o => {
      if (o.sourceName === 'shopify_draft_order' && o.totalPrice === 0) return false;
      return true;
    });
  }, [data]);

  const rfmData = useMemo(() => {
    if (!allOrders.length) return null;

    const now = new Date();
    const sixMonthsAgo = new Date(now);
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const customerMap: Record<string, {
      email: string;
      name: string;
      orders: number;
      totalSpent: number;
      firstOrder: Date;
      lastOrder: Date;
    }> = {};

    allOrders.forEach(order => {
      const email = order.customerEmail;
      if (!email) return;
      const orderDate = new Date(order.processedAt);
      const netAmount = order.totalPrice - (order.totalTax || 0);

      if (!customerMap[email]) {
        customerMap[email] = {
          email,
          name: order.customerName,
          orders: 0,
          totalSpent: 0,
          firstOrder: orderDate,
          lastOrder: orderDate,
        };
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

    const championsAvgSpend = champions.length > 0
      ? champions.reduce((s, c) => s + c.totalSpent, 0) / champions.length
      : 0;
    const championsRevenue = champions.reduce((s, c) => s + c.totalSpent, 0);
    const atRiskAvgSpend = atRisk.length > 0
      ? atRisk.reduce((s, c) => s + c.totalSpent, 0) / atRisk.length
      : 0;
    const atRiskRevenue = atRisk.reduce((s, c) => s + c.totalSpent, 0);
    const newBloodAvgSpend = newBlood.length > 0
      ? newBlood.reduce((s, c) => s + c.totalSpent, 0) / newBlood.length
      : 0;

    return {
      champions: { count: champions.length, avgSpend: championsAvgSpend, totalRevenue: championsRevenue },
      atRisk: { count: atRisk.length, avgSpend: atRiskAvgSpend, totalRevenue: atRiskRevenue },
      newBlood: { count: newBlood.length, avgSpend: newBloodAvgSpend },
      repeatRate,
      totalCustomers,
      repeatCustomers: repeatCustomers.length,
    };
  }, [allOrders]);

  const gatewayData = useMemo(() => {
    if (!allOrders.length) return { entryProducts: [], bundles: [] };

    const customerFirstOrders: Record<string, ShopifyOrder> = {};
    allOrders.forEach(order => {
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
        const key = item.title;
        if (!entryProductCount[key]) entryProductCount[key] = { title: key, count: 0 };
        entryProductCount[key].count++;
      });
    });

    const entryProducts = Object.values(entryProductCount)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const pairCount: Record<string, { product1: string; product2: string; count: number }> = {};
    allOrders.forEach(order => {
      const titles = [...new Set(order.lineItems.map(i => i.title))];
      for (let i = 0; i < titles.length; i++) {
        for (let j = i + 1; j < titles.length; j++) {
          const key = [titles[i], titles[j]].sort().join('|||');
          if (!pairCount[key]) pairCount[key] = { product1: titles[i], product2: titles[j], count: 0 };
          pairCount[key].count++;
        }
      }
    });

    const bundles = Object.values(pairCount)
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    return { entryProducts, bundles };
  }, [allOrders]);

  const cohortData = useMemo(() => {
    if (!allOrders.length) return { cohorts: [], months: [] };

    const customerOrders: Record<string, Date[]> = {};
    allOrders.forEach(order => {
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

    const cohortMonthKeys = Object.keys(cohortGroups).sort();
    const recentCohorts = cohortMonthKeys.slice(-12);

    const cohorts = recentCohorts.map(cohortMonth => {
      const customers = cohortGroups[cohortMonth];
      const total = customers.length;
      const monthsAfter = allMonths.filter(m => m >= cohortMonth);
      const retention: { month: string; monthIndex: number; rate: number; count: number }[] = [];

      monthsAfter.forEach((month, idx) => {
        if (idx > 11) return;
        const active = customers.filter(c => c.orderMonths.has(month)).length;
        retention.push({
          month,
          monthIndex: idx,
          rate: total > 0 ? (active / total) * 100 : 0,
          count: active,
        });
      });

      const label = new Date(cohortMonth + '-01').toLocaleDateString('en-US', { year: '2-digit', month: 'short' });
      return { cohortMonth, label, total, retention };
    });

    const maxRetentionLength = Math.max(...cohorts.map(c => c.retention.length), 0);
    const monthHeaders = Array.from({ length: Math.min(maxRetentionLength, 12) }, (_, i) =>
      i === 0 ? 'M0' : `M+${i}`
    );

    return { cohorts, months: monthHeaders };
  }, [allOrders]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw size={32} className="animate-spin text-orange-600 mx-auto mb-3" />
          <p className="text-gray-600">Loading Community Intelligence data...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <AlertCircle size={32} className="text-red-500 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-red-800 mb-2">Failed to Load Data</h3>
        <p className="text-red-600">{error || 'No data available'}</p>
      </div>
    );
  }

  const getHeatmapColor = (rate: number) => {
    if (rate === 0) return 'bg-gray-100 text-gray-400';
    if (rate <= 5) return 'bg-orange-100 text-orange-700';
    if (rate <= 15) return 'bg-orange-200 text-orange-800';
    if (rate <= 30) return 'bg-orange-300 text-orange-900';
    if (rate <= 50) return 'bg-orange-400 text-white';
    if (rate <= 75) return 'bg-orange-500 text-white';
    return 'bg-orange-600 text-white';
  };

  return (
    <div className="space-y-6 pt-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Users size={28} className="text-orange-600" />
            Community Intelligence Hub
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            All seasons | {allOrders.length.toLocaleString()} orders | {rfmData?.totalCustomers.toLocaleString() || 0} unique customers
          </p>
        </div>
      </div>

      {rfmData && (
        <>
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Heart size={20} className="text-orange-600" />
            Customer Loyalty & RFM Breakdown
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                  <Sparkles size={20} className="text-green-600" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-800">Champions</h3>
                  <p className="text-xs text-gray-500">High frequency, high spend</p>
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-800">{rfmData.champions.count}</p>
              <div className="mt-2 space-y-1">
                <p className="text-xs text-gray-500">Avg Spend: <span className="font-medium text-gray-700">{formatCurrency(rfmData.champions.avgSpend)}</span></p>
                <p className="text-xs text-gray-500">Total Revenue: <span className="font-medium text-green-600">{formatCurrency(rfmData.champions.totalRevenue)}</span></p>
              </div>
              <div className="mt-3 h-1 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full" style={{ width: `${Math.min((rfmData.champions.count / rfmData.totalCustomers) * 100, 100)}%` }} />
              </div>
              <p className="text-xs text-gray-400 mt-1">{((rfmData.champions.count / rfmData.totalCustomers) * 100).toFixed(1)}% of customers</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                  <AlertTriangle size={20} className="text-red-600" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-800">At Risk</h3>
                  <p className="text-xs text-gray-500">No purchase in 6+ months</p>
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-800">{rfmData.atRisk.count}</p>
              <div className="mt-2 space-y-1">
                <p className="text-xs text-gray-500">Avg Spend: <span className="font-medium text-gray-700">{formatCurrency(rfmData.atRisk.avgSpend)}</span></p>
                <p className="text-xs text-gray-500">Revenue at Risk: <span className="font-medium text-red-600">{formatCurrency(rfmData.atRisk.totalRevenue)}</span></p>
              </div>
              <div className="mt-3 h-1 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-red-500 rounded-full" style={{ width: `${Math.min((rfmData.atRisk.count / rfmData.totalCustomers) * 100, 100)}%` }} />
              </div>
              <p className="text-xs text-gray-400 mt-1">{((rfmData.atRisk.count / rfmData.totalCustomers) * 100).toFixed(1)}% of customers</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <TrendingUp size={20} className="text-blue-600" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-800">New Blood</h3>
                  <p className="text-xs text-gray-500">First-time buyers (last 30 days)</p>
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-800">{rfmData.newBlood.count}</p>
              <div className="mt-2 space-y-1">
                <p className="text-xs text-gray-500">Avg First Purchase: <span className="font-medium text-gray-700">{formatCurrency(rfmData.newBlood.avgSpend)}</span></p>
                <p className="text-xs text-gray-500">Conversion Window: <span className="font-medium text-blue-600">Active</span></p>
              </div>
              <div className="mt-3 h-1 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min((rfmData.newBlood.count / rfmData.totalCustomers) * 100, 100)}%` }} />
              </div>
              <p className="text-xs text-gray-400 mt-1">{((rfmData.newBlood.count / rfmData.totalCustomers) * 100).toFixed(1)}% of customers</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Target size={18} className="text-orange-600" />
                <h3 className="text-sm font-semibold text-gray-800">Repeat Purchase Rate</h3>
              </div>
              <span className="text-2xl font-bold text-orange-600">{rfmData.repeatRate.toFixed(1)}%</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-orange-400 to-orange-600 rounded-full transition-all duration-1000"
                style={{ width: `${Math.min(rfmData.repeatRate, 100)}%` }}
              />
            </div>
            <div className="flex justify-between mt-2">
              <p className="text-xs text-gray-500">{rfmData.repeatCustomers.toLocaleString()} repeat customers</p>
              <p className="text-xs text-gray-500">{rfmData.totalCustomers.toLocaleString()} total</p>
            </div>
          </div>
        </>
      )}

      {gatewayData.entryProducts.length > 0 && (
        <>
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Package size={20} className="text-orange-600" />
            Gateway & Bundle Analysis
          </h2>

          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <BarChart3 size={16} className="text-orange-600" />
              Top Entry Products
              <span className="text-xs font-normal text-gray-500 ml-1">Most common first purchase</span>
            </h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={gatewayData.entryProducts} layout="vertical" margin={{ left: 10, right: 20, top: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis
                    type="category"
                    dataKey="title"
                    width={180}
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v: string) => v.length > 28 ? v.slice(0, 25) + '...' : v}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '12px' }}
                    formatter={(value: number) => [`${value} customers`, 'Entry Count']}
                  />
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
            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Layers size={16} className="text-orange-600" />
                Frequently Bought Together
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase">#</th>
                      <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase">Product 1</th>
                      <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase">Product 2</th>
                      <th className="text-right py-2 px-3 text-xs font-medium text-gray-500 uppercase">Co-Purchases</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gatewayData.bundles.map((bundle, idx) => (
                      <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="py-2.5 px-3 text-gray-400 font-medium">{idx + 1}</td>
                        <td className="py-2.5 px-3 text-gray-800 font-medium">
                          <span className="line-clamp-1">{bundle.product1}</span>
                        </td>
                        <td className="py-2.5 px-3 text-gray-800 font-medium">
                          <span className="line-clamp-1">{bundle.product2}</span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-700 text-xs font-medium">
                            {bundle.count}
                          </span>
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
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <BarChart3 size={20} className="text-orange-600" />
            Cohort Retention Heatmap
          </h2>

          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <p className="text-xs text-gray-500 mb-4">Percentage of customers who returned in subsequent months after their first purchase</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr>
                    <th className="text-left py-2 px-2 text-gray-500 font-medium sticky left-0 bg-white min-w-[80px]">Cohort</th>
                    <th className="text-center py-2 px-1 text-gray-500 font-medium min-w-[44px]">Size</th>
                    {cohortData.months.map(m => (
                      <th key={m} className="text-center py-2 px-1 text-gray-500 font-medium min-w-[44px]">{m}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {cohortData.cohorts.map(cohort => (
                    <tr key={cohort.cohortMonth} className="border-t border-gray-50">
                      <td className="py-1.5 px-2 font-medium text-gray-700 sticky left-0 bg-white whitespace-nowrap">{cohort.label}</td>
                      <td className="py-1.5 px-1 text-center text-gray-600 font-medium">{cohort.total}</td>
                      {cohortData.months.map((_, idx) => {
                        const ret = cohort.retention[idx];
                        if (!ret) return <td key={idx} className="py-1.5 px-1"><div className="w-10 h-8 rounded bg-gray-50 mx-auto" /></td>;
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
            <div className="flex items-center gap-2 mt-4 text-xs text-gray-500">
              <span>Low</span>
              <div className="flex gap-0.5">
                <div className="w-6 h-4 rounded bg-gray-100" />
                <div className="w-6 h-4 rounded bg-orange-100" />
                <div className="w-6 h-4 rounded bg-orange-200" />
                <div className="w-6 h-4 rounded bg-orange-300" />
                <div className="w-6 h-4 rounded bg-orange-400" />
                <div className="w-6 h-4 rounded bg-orange-500" />
                <div className="w-6 h-4 rounded bg-orange-600" />
              </div>
              <span>High</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
