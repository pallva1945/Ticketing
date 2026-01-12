import React, { useState, useMemo, useRef } from 'react';
import { Users, Building2, Mail, MapPin, Ticket, TrendingUp, Search, X, Filter, Eye, BarChart3, PieChart, UserCheck, Euro, Award } from 'lucide-react';
import { CRMRecord } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPie, Pie, Cell, Legend } from 'recharts';

const COLORS = ['#dc2626', '#2563eb', '#16a34a', '#ca8a04', '#9333ea', '#0891b2', '#be185d', '#65a30d'];

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatCompact = (value: number) => {
  const absVal = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  if (absVal >= 1000000) return `${sign}€${(absVal / 1000000).toFixed(1)}M`;
  if (absVal >= 1000) return `${sign}€${(absVal / 1000).toFixed(0)}k`;
  return `${sign}€${absVal.toFixed(0)}`;
};

interface CRMViewProps {
  data: CRMRecord[];
  onUploadCsv?: (content: string) => void;
}

export const CRMView: React.FC<CRMViewProps> = ({ data, onUploadCsv }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterZone, setFilterZone] = useState<string | null>(null);
  const [filterEvent, setFilterEvent] = useState<string | null>(null);
  const [filterSellType, setFilterSellType] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'overview' | 'customers' | 'corporate' | 'zones'>('overview');
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);

  const hasActiveFilter = filterZone || filterEvent || filterSellType || searchQuery;

  const clearAllFilters = () => {
    setFilterZone(null);
    setFilterEvent(null);
    setFilterSellType(null);
    setSearchQuery('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUploadCsv) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        onUploadCsv(content);
      };
      reader.readAsText(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const filteredData = useMemo(() => {
    let result = [...data];
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(r => 
        r.fullName.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.group.toLowerCase().includes(q) ||
        r.address.toLowerCase().includes(q)
      );
    }
    if (filterZone) result = result.filter(r => r.pvZone === filterZone);
    if (filterEvent) result = result.filter(r => r.event.includes(filterEvent));
    if (filterSellType) result = result.filter(r => r.sellType === filterSellType);
    
    return result;
  }, [data, searchQuery, filterZone, filterEvent, filterSellType]);

  const stats = useMemo(() => {
    const uniqueEmails = new Set(filteredData.filter(r => r.email).map(r => r.email.toLowerCase()));
    const uniqueCustomers = new Set(filteredData.map(r => r.email || r.fullName));
    const corporateRecords = filteredData.filter(r => r.sellType === 'Corp' || r.ticketType === 'CORP');
    const uniqueCorps = new Set(corporateRecords.map(r => r.group).filter(Boolean));
    
    const totalRevenue = filteredData.reduce((sum, r) => sum + r.price, 0);
    const totalCommercialValue = filteredData.reduce((sum, r) => sum + r.commercialValue, 0);
    const corpCommercialValue = corporateRecords.reduce((sum, r) => sum + r.commercialValue, 0);
    const cashReceived = totalCommercialValue - corpCommercialValue;
    const totalTickets = filteredData.reduce((sum, r) => sum + r.quantity, 0);

    const zoneBreakdown: Record<string, { count: number; revenue: number; value: number }> = {};
    const eventBreakdown: Record<string, { count: number; revenue: number }> = {};
    const sellTypeBreakdown: Record<string, { count: number; revenue: number; value: number }> = {};
    const paymentBreakdown: Record<string, { count: number; revenue: number }> = {};
    const discountBreakdown: Record<string, { count: number; revenue: number }> = {};
    const corpBreakdown: Record<string, { count: number; revenue: number; value: number }> = {};

    filteredData.forEach(r => {
      const zone = r.pvZone || 'Unknown';
      if (!zoneBreakdown[zone]) zoneBreakdown[zone] = { count: 0, revenue: 0, value: 0 };
      zoneBreakdown[zone].count += r.quantity;
      zoneBreakdown[zone].revenue += r.price;
      zoneBreakdown[zone].value += r.commercialValue;

      const event = r.event.includes('ABBONAMENTO') ? 'Season Ticket' : 
                    r.event.includes('PACK') ? 'Mini Pack' : 'Single Game';
      if (!eventBreakdown[event]) eventBreakdown[event] = { count: 0, revenue: 0 };
      eventBreakdown[event].count += r.quantity;
      eventBreakdown[event].revenue += r.price;

      const sell = r.sellType || 'Unknown';
      if (!sellTypeBreakdown[sell]) sellTypeBreakdown[sell] = { count: 0, revenue: 0, value: 0 };
      sellTypeBreakdown[sell].count += r.quantity;
      sellTypeBreakdown[sell].revenue += r.price;
      sellTypeBreakdown[sell].value += r.commercialValue;

      const payment = r.payment || 'Unknown';
      if (!paymentBreakdown[payment]) paymentBreakdown[payment] = { count: 0, revenue: 0 };
      paymentBreakdown[payment].count += r.quantity;
      paymentBreakdown[payment].revenue += r.price;

      const discount = r.discountType || r.ticketType || 'Unknown';
      if (!discountBreakdown[discount]) discountBreakdown[discount] = { count: 0, revenue: 0 };
      discountBreakdown[discount].count += r.quantity;
      discountBreakdown[discount].revenue += r.price;

      if (r.group && (r.sellType === 'Corp' || r.ticketType === 'CORP')) {
        if (!corpBreakdown[r.group]) corpBreakdown[r.group] = { count: 0, revenue: 0, value: 0 };
        corpBreakdown[r.group].count += r.quantity;
        corpBreakdown[r.group].revenue += r.price;
        corpBreakdown[r.group].value += r.commercialValue;
      }
    });

    const topCustomers = Object.entries(
      filteredData.reduce((acc, r) => {
        const key = r.email || r.fullName;
        if (!acc[key]) acc[key] = { name: r.fullName, email: r.email, tickets: 0, revenue: 0, value: 0 };
        acc[key].tickets += r.quantity;
        acc[key].revenue += r.price;
        acc[key].value += r.commercialValue;
        return acc;
      }, {} as Record<string, { name: string; email: string; tickets: number; revenue: number; value: number }>)
    ).map(([key, val]) => ({ key, ...val }))
     .sort((a, b) => b.value - a.value)
     .slice(0, 10);

    const topCorps = Object.entries(corpBreakdown)
      .map(([name, val]) => ({ name, ...val }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    return {
      totalTickets,
      totalRevenue,
      totalCommercialValue,
      cashReceived,
      corpCommercialValue,
      uniqueCustomers: uniqueCustomers.size,
      uniqueEmails: uniqueEmails.size,
      uniqueCorps: uniqueCorps.size,
      corporateTickets: corporateRecords.length,
      zoneBreakdown,
      eventBreakdown,
      sellTypeBreakdown,
      paymentBreakdown,
      discountBreakdown,
      topCustomers,
      topCorps
    };
  }, [filteredData]);


  const zoneChartData = useMemo(() => 
    Object.entries(stats.zoneBreakdown)
      .map(([zone, val]) => ({ zone, tickets: val.count, value: val.value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10),
  [stats.zoneBreakdown]);

  const eventChartData = useMemo(() => 
    Object.entries(stats.eventBreakdown)
      .map(([name, val]) => ({ name, value: val.count })),
  [stats.eventBreakdown]);

  const sellTypeChartData = useMemo(() => 
    Object.entries(stats.sellTypeBreakdown)
      .map(([name, val]) => ({ name, tickets: val.count, value: val.value }))
      .sort((a, b) => b.value - a.value),
  [stats.sellTypeBreakdown]);

  const customerDetail = useMemo(() => {
    if (!selectedCustomer) return null;
    const records = filteredData.filter(r => (r.email || r.fullName) === selectedCustomer);
    if (records.length === 0) return null;
    
    const first = records[0];
    const totalSpend = records.reduce((sum, r) => sum + r.price, 0);
    const totalValue = records.reduce((sum, r) => sum + r.commercialValue, 0);
    const ticketCount = records.reduce((sum, r) => sum + r.quantity, 0);
    const zones = [...new Set(records.map(r => r.pvZone).filter(Boolean))];
    const games = [...new Set(records.map(r => r.game).filter(Boolean))];
    
    return {
      name: first.fullName,
      email: first.email,
      phone: first.cell || first.phone,
      address: first.address,
      dob: first.dob,
      totalSpend,
      totalValue,
      ticketCount,
      zones,
      games,
      records
    };
  }, [selectedCustomer, filteredData]);

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] text-center p-8 animate-fade-in pt-6">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6 shadow-inner relative overflow-hidden">
          <Users size={40} className="text-gray-400 relative z-10" />
        </div>
        <h2 className="text-3xl font-bold text-gray-800 mb-2">CRM System</h2>
        <p className="text-gray-500 max-w-md mb-8">
          Upload your CRM CSV file to analyze customer data and gain insights into your fan base.
        </p>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept=".csv"
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium"
        >
          <Upload size={20} />
          Upload CRM CSV
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Users size={28} className="text-red-600" />
            CRM Analytics
          </h1>
          <p className="text-sm text-gray-500 mt-1">{stats.totalTickets.toLocaleString()} tickets from {stats.uniqueCustomers.toLocaleString()} customers</p>
        </div>
        <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search customers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent w-64"
            />
          </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {['overview', 'customers', 'corporate', 'zones'].map(view => (
          <button
            key={view}
            onClick={() => setActiveView(view as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeView === view 
                ? 'bg-red-600 text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {view === 'overview' && <BarChart3 size={14} className="inline mr-2" />}
            {view === 'customers' && <UserCheck size={14} className="inline mr-2" />}
            {view === 'corporate' && <Building2 size={14} className="inline mr-2" />}
            {view === 'zones' && <MapPin size={14} className="inline mr-2" />}
            {view.charAt(0).toUpperCase() + view.slice(1)}
          </button>
        ))}
      </div>

      {hasActiveFilter && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-amber-600" />
              <span className="text-sm font-medium text-amber-800">Active Filters:</span>
              <div className="flex items-center gap-2 flex-wrap">
                {searchQuery && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-amber-300 rounded-full text-xs font-medium text-amber-800">
                    Search: "{searchQuery}"
                    <button onClick={() => setSearchQuery('')} className="hover:text-amber-600"><X size={12} /></button>
                  </span>
                )}
                {filterZone && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-amber-300 rounded-full text-xs font-medium text-amber-800">
                    Zone: {filterZone}
                    <button onClick={() => setFilterZone(null)} className="hover:text-amber-600"><X size={12} /></button>
                  </span>
                )}
                {filterEvent && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-amber-300 rounded-full text-xs font-medium text-amber-800">
                    Event: {filterEvent}
                    <button onClick={() => setFilterEvent(null)} className="hover:text-amber-600"><X size={12} /></button>
                  </span>
                )}
                {filterSellType && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-amber-300 rounded-full text-xs font-medium text-amber-800">
                    Type: {filterSellType}
                    <button onClick={() => setFilterSellType(null)} className="hover:text-amber-600"><X size={12} /></button>
                  </span>
                )}
              </div>
            </div>
            <button onClick={clearAllFilters} className="text-xs font-medium text-amber-700 hover:text-amber-900 underline">
              Clear All
            </button>
          </div>
          <p className="text-xs text-amber-600 mt-2">
            Showing {filteredData.length.toLocaleString()} of {data.length.toLocaleString()} records
          </p>
        </div>
      )}

      {activeView === 'overview' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">
                  <Ticket size={16} className="text-red-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalTickets.toLocaleString()}</p>
              <p className="text-xs text-gray-500">Total Tickets</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Users size={16} className="text-blue-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.uniqueCustomers.toLocaleString()}</p>
              <p className="text-xs text-gray-500">Unique Customers</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                  <Euro size={16} className="text-green-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{formatCompact(stats.cashReceived)}</p>
              <p className="text-xs text-gray-500">Cash Received</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
                  <TrendingUp size={16} className="text-purple-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{formatCompact(stats.totalCommercialValue)}</p>
              <p className="text-xs text-gray-500">Commercial Value</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
                  <Building2 size={16} className="text-amber-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.uniqueCorps}</p>
              <p className="text-xs text-gray-500">Corporate Accounts</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-cyan-50 rounded-lg flex items-center justify-center">
                  <Mail size={16} className="text-cyan-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.uniqueEmails.toLocaleString()}</p>
              <p className="text-xs text-gray-500">Valid Emails</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <MapPin size={20} className="text-red-500" />
                Revenue by Zone
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={zoneChartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis type="number" tickFormatter={(v) => formatCompact(v)} tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="zone" tick={{ fontSize: 10 }} width={80} />
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ fontSize: '12px', borderRadius: '8px' }}
                    />
                    <Bar 
                      dataKey="value" 
                      fill="#dc2626" 
                      radius={[0, 4, 4, 0]}
                      cursor="pointer"
                      onClick={(data) => setFilterZone(filterZone === data.zone ? null : data.zone)}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <PieChart size={20} className="text-blue-500" />
                Ticket Type Distribution
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPie>
                    <Pie
                      data={eventChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {eventChartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => value.toLocaleString()} />
                    <Legend />
                  </RechartsPie>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Award size={20} className="text-amber-500" />
                Top 10 Customers by Value
              </h3>
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {stats.topCustomers.map((c, i) => (
                  <div 
                    key={c.key} 
                    className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"
                    onClick={() => setSelectedCustomer(selectedCustomer === c.key ? null : c.key)}
                  >
                    <span className="w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 truncate">{c.name}</p>
                      <p className="text-xs text-gray-500">{c.tickets} tickets</p>
                    </div>
                    <span className="font-bold text-gray-900">{formatCompact(c.value)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <BarChart3 size={20} className="text-green-500" />
                Sales Channel Breakdown
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sellTypeChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tickFormatter={(v) => formatCompact(v)} tick={{ fontSize: 11 }} />
                    <Tooltip 
                      formatter={(value: number, name: string) => [formatCurrency(value), name === 'value' ? 'Value' : 'Tickets']}
                      contentStyle={{ fontSize: '12px', borderRadius: '8px' }}
                    />
                    <Bar 
                      dataKey="value" 
                      fill="#16a34a" 
                      radius={[4, 4, 0, 0]}
                      cursor="pointer"
                      onClick={(data) => setFilterSellType(filterSellType === data.name ? null : data.name)}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}

      {activeView === 'customers' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <UserCheck size={18} className="text-blue-500" />
              Customer List ({stats.topCustomers.length} shown)
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="text-left py-3 px-4 font-medium">#</th>
                  <th className="text-left py-3 px-4 font-medium">Customer</th>
                  <th className="text-left py-3 px-4 font-medium">Email</th>
                  <th className="text-right py-3 px-4 font-medium">Tickets</th>
                  <th className="text-right py-3 px-4 font-medium">Revenue</th>
                  <th className="text-right py-3 px-4 font-medium">Value</th>
                  <th className="text-center py-3 px-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {stats.topCustomers.map((c, i) => (
                  <tr key={c.key} className="hover:bg-gray-50">
                    <td className="py-3 px-4 text-gray-500">{i + 1}</td>
                    <td className="py-3 px-4 font-medium text-gray-800">{c.name}</td>
                    <td className="py-3 px-4 text-gray-600">{c.email || '-'}</td>
                    <td className="py-3 px-4 text-right">{c.tickets}</td>
                    <td className="py-3 px-4 text-right">{formatCurrency(c.revenue)}</td>
                    <td className="py-3 px-4 text-right font-semibold text-green-600">{formatCurrency(c.value)}</td>
                    <td className="py-3 px-4 text-center">
                      <button 
                        onClick={() => setSelectedCustomer(selectedCustomer === c.key ? null : c.key)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeView === 'corporate' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-amber-600 to-amber-800 rounded-xl p-5 text-white shadow-lg">
              <Building2 size={24} className="mb-3 opacity-80" />
              <p className="text-3xl font-bold">{stats.uniqueCorps}</p>
              <p className="text-amber-100 text-sm">Corporate Accounts</p>
            </div>
            <div className="bg-gradient-to-br from-slate-700 to-slate-900 rounded-xl p-5 text-white shadow-lg">
              <Ticket size={24} className="mb-3 opacity-80" />
              <p className="text-3xl font-bold">{stats.corporateTickets.toLocaleString()}</p>
              <p className="text-slate-300 text-sm">Corp Tickets Sold</p>
            </div>
            <div className="bg-gradient-to-br from-green-600 to-green-800 rounded-xl p-5 text-white shadow-lg">
              <Euro size={24} className="mb-3 opacity-80" />
              <p className="text-3xl font-bold">{formatCompact(stats.topCorps.reduce((sum, c) => sum + c.value, 0))}</p>
              <p className="text-green-100 text-sm">Corp Commercial Value</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <Building2 size={18} className="text-amber-500" />
                Top Corporate Accounts
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium">#</th>
                    <th className="text-left py-3 px-4 font-medium">Company</th>
                    <th className="text-right py-3 px-4 font-medium">Seats</th>
                    <th className="text-right py-3 px-4 font-medium">Cash Paid</th>
                    <th className="text-right py-3 px-4 font-medium">Commercial Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {stats.topCorps.map((c, i) => (
                    <tr key={c.name} className="hover:bg-gray-50 cursor-pointer" onClick={() => {
                      setSearchQuery(c.name);
                      setActiveView('overview');
                    }}>
                      <td className="py-3 px-4">
                        <span className="w-6 h-6 bg-amber-600 text-white rounded-full flex items-center justify-center text-xs font-bold">{i + 1}</span>
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-800">{c.name}</td>
                      <td className="py-3 px-4 text-right">{c.count}</td>
                      <td className="py-3 px-4 text-right text-gray-600">{formatCurrency(c.revenue)}</td>
                      <td className="py-3 px-4 text-right font-bold text-green-600">{formatCurrency(c.value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeView === 'zones' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(stats.zoneBreakdown)
            .sort((a, b) => b[1].value - a[1].value)
            .map(([zone, data]) => (
              <div 
                key={zone} 
                className={`bg-white rounded-xl border p-5 shadow-sm cursor-pointer transition-all hover:shadow-md ${
                  filterZone === zone ? 'ring-2 ring-red-500 border-red-500' : 'border-gray-100'
                }`}
                onClick={() => setFilterZone(filterZone === zone ? null : zone)}
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-800">{zone}</h4>
                  <MapPin size={18} className="text-gray-400" />
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-xl font-bold text-gray-900">{data.count.toLocaleString()}</p>
                    <p className="text-[10px] text-gray-500 uppercase">Tickets</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-blue-600">{formatCompact(data.revenue)}</p>
                    <p className="text-[10px] text-gray-500 uppercase">Cash</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-green-600">{formatCompact(data.value)}</p>
                    <p className="text-[10px] text-gray-500 uppercase">Value</p>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}

      {customerDetail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedCustomer(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-800">{customerDetail.name}</h3>
                {customerDetail.email && <p className="text-sm text-gray-500">{customerDetail.email}</p>}
              </div>
              <button onClick={() => setSelectedCustomer(null)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-gray-900">{customerDetail.ticketCount}</p>
                  <p className="text-xs text-gray-500">Total Tickets</p>
                </div>
                <div className="bg-blue-50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-blue-600">{formatCompact(customerDetail.totalSpend)}</p>
                  <p className="text-xs text-gray-500">Cash Paid</p>
                </div>
                <div className="bg-green-50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-green-600">{formatCompact(customerDetail.totalValue)}</p>
                  <p className="text-xs text-gray-500">Commercial Value</p>
                </div>
              </div>
              
              {customerDetail.phone && (
                <div className="mb-4">
                  <p className="text-xs text-gray-500 uppercase mb-1">Phone</p>
                  <p className="font-medium">{customerDetail.phone}</p>
                </div>
              )}
              
              {customerDetail.address && (
                <div className="mb-4">
                  <p className="text-xs text-gray-500 uppercase mb-1">Address</p>
                  <p className="font-medium">{customerDetail.address}</p>
                </div>
              )}
              
              {customerDetail.zones.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs text-gray-500 uppercase mb-2">Preferred Zones</p>
                  <div className="flex flex-wrap gap-2">
                    {customerDetail.zones.map(z => (
                      <span key={z} className="px-3 py-1 bg-red-50 text-red-700 rounded-full text-xs font-medium">{z}</span>
                    ))}
                  </div>
                </div>
              )}
              
              <div>
                <p className="text-xs text-gray-500 uppercase mb-2">Purchase History ({customerDetail.records.length} transactions)</p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {customerDetail.records.slice(0, 20).map((r, i) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-sm">
                      <div>
                        <p className="font-medium">{r.event}</p>
                        <p className="text-xs text-gray-500">{r.buyDate} • {r.pvZone}</p>
                      </div>
                      <span className="font-bold text-green-600">{formatCurrency(r.commercialValue)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
