import React, { useState, useMemo, useRef } from 'react';
import { Users, Building2, Mail, MapPin, Ticket, TrendingUp, Search, Upload, X, Filter, BarChart3, PieChart, Euro, Award } from 'lucide-react';
import { CRMRecord, SponsorData } from '../types';
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
  sponsorData?: SponsorData[];
  onUploadCsv?: (content: string) => void;
  isLoading?: boolean;
}

const getCustomerKey = (r: CRMRecord): string => {
  const lastName = (r.lastName || '').trim().toLowerCase();
  const firstName = (r.firstName || '').trim().toLowerCase();
  const dob = (r.dob || '').trim();
  const email = (r.email || '').trim().toLowerCase();
  
  if (lastName && firstName && dob) {
    return `${lastName}|${firstName}|${dob}`;
  }
  if (lastName && firstName && email) {
    return `${lastName}|${firstName}|${email}`;
  }
  if (email) {
    return `email:${email}`;
  }
  return `name:${(r.fullName || 'unknown').trim().toLowerCase()}`;
};

const normalizeCompanyName = (name: string): string => {
  return (name || '')
    .toLowerCase()
    .trim()
    .replace(/\s+(s\.?r\.?l\.?|s\.?p\.?a\.?|s\.?n\.?c\.?|s\.?a\.?s\.?|ltd|inc|corp|gmbh|ag)\.?$/i, '')
    .replace(/[^\w\s]/g, '')
    .trim();
};

export const CRMView: React.FC<CRMViewProps> = ({ data, sponsorData = [], onUploadCsv, isLoading = false }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterZone, setFilterZone] = useState<string | null>(null);
  const [filterEvent, setFilterEvent] = useState<string | null>(null);
  const [filterSellType, setFilterSellType] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'overview' | 'demographics' | 'behavior' | 'customers' | 'corporate'>('overview');
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
      const queries = searchQuery.split(',').map(q => q.trim().toLowerCase()).filter(q => q);
      result = result.filter(r => 
        queries.every(q => 
          (r.fullName || '').toLowerCase().includes(q) ||
          (r.email || '').toLowerCase().includes(q) ||
          (r.group || '').toLowerCase().includes(q) ||
          (r.address || '').toLowerCase().includes(q) ||
          (r.pvZone || '').toLowerCase().includes(q) ||
          (r.sellType || '').toLowerCase().includes(q) ||
          (r.ticketType || '').toLowerCase().includes(q) ||
          (r.event || '').toLowerCase().includes(q) ||
          (r.game || '').toLowerCase().includes(q)
        )
      );
    }
    if (filterZone) result = result.filter(r => r.pvZone === filterZone);
    if (filterEvent) result = result.filter(r => (r.event || '').includes(filterEvent));
    if (filterSellType) result = result.filter(r => (r.sellType || '').toLowerCase() === filterSellType.toLowerCase());
    
    return result;
  }, [data, searchQuery, filterZone, filterEvent, filterSellType]);

  const sectorLookup = useMemo(() => {
    const lookup: Record<string, { sector: string; sector2?: string }> = {};
    sponsorData.forEach(s => {
      const key = normalizeCompanyName(s.company);
      if (key && !lookup[key]) {
        lookup[key] = { sector: s.sector || '' };
      }
    });
    return lookup;
  }, [sponsorData]);

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
    const rawSellTypeBreakdown: Record<string, { count: number; revenue: number; value: number }> = {};
    const groupedSellTypeBreakdown: Record<string, { count: number; revenue: number; value: number }> = {};
    const paymentBreakdown: Record<string, { count: number; revenue: number }> = {};
    const discountBreakdown: Record<string, { count: number; revenue: number }> = {};
    const corpBreakdown: Record<string, { count: number; revenue: number; value: number }> = {};

    filteredData.forEach(r => {
      const zone = r.pvZone || 'Unknown';
      if (!zoneBreakdown[zone]) zoneBreakdown[zone] = { count: 0, revenue: 0, value: 0 };
      zoneBreakdown[zone].count += r.quantity;
      zoneBreakdown[zone].revenue += r.price;
      zoneBreakdown[zone].value += r.commercialValue;

      const event = (r.event || '').includes('ABBONAMENTO') ? 'Season Ticket' : 
                    (r.event || '').includes('PACK') ? 'Mini Pack' : 'Single Game';
      if (!eventBreakdown[event]) eventBreakdown[event] = { count: 0, revenue: 0 };
      eventBreakdown[event].count += r.quantity;
      eventBreakdown[event].revenue += r.price;

      const rawSell = (r.sellType || '').toLowerCase();
      const rawTicketType = (r.ticketType || '').toLowerCase();
      
      const normalizedSellType = (r.sellType || r.ticketType || 'Unknown').toUpperCase();
      if (!rawSellTypeBreakdown[normalizedSellType]) rawSellTypeBreakdown[normalizedSellType] = { count: 0, revenue: 0, value: 0 };
      rawSellTypeBreakdown[normalizedSellType].count += r.quantity;
      rawSellTypeBreakdown[normalizedSellType].revenue += r.price;
      rawSellTypeBreakdown[normalizedSellType].value += r.commercialValue;
      
      let sellCategory: string;
      if (['mp', 'tix', 'vb'].includes(rawSell) || ['mp', 'tix', 'vb'].includes(rawTicketType)) {
        sellCategory = 'GameDay';
      } else if (['corp', 'abb'].includes(rawSell) || ['corp', 'abb'].includes(rawTicketType)) {
        sellCategory = 'Fixed';
      } else if (['protocol', 'giveaway', 'giveaways'].includes(rawSell) || ['protocol', 'giveaway', 'giveaways'].includes(rawTicketType)) {
        sellCategory = 'Giveaway';
      } else {
        sellCategory = r.sellType || r.ticketType || 'Unknown';
      }
      if (!groupedSellTypeBreakdown[sellCategory]) groupedSellTypeBreakdown[sellCategory] = { count: 0, revenue: 0, value: 0 };
      groupedSellTypeBreakdown[sellCategory].count += r.quantity;
      groupedSellTypeBreakdown[sellCategory].revenue += r.price;
      groupedSellTypeBreakdown[sellCategory].value += r.commercialValue;

      const payment = r.payment || 'Unknown';
      if (!paymentBreakdown[payment]) paymentBreakdown[payment] = { count: 0, revenue: 0 };
      paymentBreakdown[payment].count += r.quantity;
      paymentBreakdown[payment].revenue += r.price;

      const discount = r.discountType || r.ticketType || 'Unknown';
      if (!discountBreakdown[discount]) discountBreakdown[discount] = { count: 0, revenue: 0 };
      discountBreakdown[discount].count += r.quantity;
      discountBreakdown[discount].revenue += r.price;

      const isCorp = (r.sellType || '').toLowerCase() === 'corp' || (r.ticketType || '').toLowerCase() === 'corp';
      if (isCorp) {
        const corpKey = r.fullName || r.group || 'Unknown';
        if (!corpBreakdown[corpKey]) corpBreakdown[corpKey] = { count: 0, revenue: 0, value: 0 };
        corpBreakdown[corpKey].count += r.quantity;
        corpBreakdown[corpKey].revenue += r.price;
        corpBreakdown[corpKey].value += r.commercialValue;
      }
    });

    const nonCorpData = filteredData.filter(r => {
      const sellLower = (r.sellType || '').toLowerCase();
      const ticketLower = (r.ticketType || '').toLowerCase();
      const isCorp = sellLower === 'corp' || ticketLower === 'corp';
      const isAbb = sellLower === 'abb' || ticketLower === 'abb';
      return !isCorp && !isAbb;
    });

    const topCustomers = Object.entries(
      nonCorpData.reduce((acc, r) => {
        const key = getCustomerKey(r);
        if (!acc[key]) acc[key] = { 
          name: r.fullName, 
          email: r.email, 
          tickets: 0, 
          revenue: 0, 
          value: 0,
          zones: {} as Record<string, number>,
          games: new Set<string>(),
          transactions: 0,
          age: r.dob || '',
          location: r.province || r.pob || '',
          advanceDays: [] as number[]
        };
        acc[key].tickets += Number(r.quantity) || 1;
        acc[key].revenue += Number(r.price) || 0;
        acc[key].value += Number(r.commercialValue) || 0;
        acc[key].transactions += 1;
        const zone = r.pvZone || r.zone || 'Unknown';
        acc[key].zones[zone] = (acc[key].zones[zone] || 0) + (Number(r.quantity) || 1);
        if (r.game || r.event) acc[key].games.add(r.game || r.event);
        if (!acc[key].age && r.dob) acc[key].age = r.dob;
        if (!acc[key].location && (r.province || r.pob)) acc[key].location = r.province || r.pob || '';
        
        const buyTs = r.buyTimestamp && r.buyTimestamp instanceof Date && !isNaN(r.buyTimestamp.getTime()) ? r.buyTimestamp : null;
        if (buyTs && r.gmDateTime && r.gmDateTime > 0) {
          const gameDate = new Date(r.gmDateTime);
          if (!isNaN(gameDate.getTime())) {
            const diffDays = Math.floor((gameDate.getTime() - buyTs.getTime()) / (1000 * 60 * 60 * 24));
            if (diffDays >= 0) acc[key].advanceDays.push(diffDays);
          }
        }
        return acc;
      }, {} as Record<string, { name: string; email: string; tickets: number; revenue: number; value: number; zones: Record<string, number>; games: Set<string>; transactions: number; age: string; location: string; advanceDays: number[] }>)
    ).map(([key, val]) => {
      const favoriteZone = Object.entries(val.zones).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Unknown';
      const avgAdvance = val.advanceDays.length > 0 ? Math.round(val.advanceDays.reduce((a, b) => a + b, 0) / val.advanceDays.length) : null;
      const gameCount = val.games.size;
      const avgPerGame = gameCount > 0 ? val.value / gameCount : 0;
      const avgPerTxn = val.transactions > 0 ? val.value / val.transactions : 0;
      return { key, ...val, favoriteZone, avgAdvance, gameCount, avgPerGame, avgPerTxn };
    })
     .sort((a, b) => b.value - a.value)
     .slice(0, 10);

    const topCorps = Object.entries(corpBreakdown)
      .map(([name, val]) => {
        const normalizedName = normalizeCompanyName(name);
        const sectorInfo = sectorLookup[normalizedName] || { sector: '' };
        return { name, ...val, sector: sectorInfo.sector || '—', sector2: '—' };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    // Demographics calculations
    const ageBreakdown: Record<string, { count: number; value: number }> = {};
    const locationBreakdown: Record<string, { count: number; value: number }> = {};
    const zoneByAge: Record<string, Record<string, number>> = {};
    const zoneByLocation: Record<string, Record<string, number>> = {};
    const zoneStats: Record<string, { totalValue: number; totalTickets: number; totalAdvanceDays: number; advanceCount: number }> = {};
    
    const getAgeGroup = (dob: string): string => {
      if (!dob) return 'Unknown';
      const parts = dob.split('/');
      if (parts.length < 3) return 'Unknown';
      const year = parseInt(parts[2], 10);
      if (isNaN(year)) return 'Unknown';
      const currentYear = new Date().getFullYear();
      const age = currentYear - year;
      if (age < 18) return 'Under 18';
      if (age < 25) return '18-24';
      if (age < 35) return '25-34';
      if (age < 45) return '35-44';
      if (age < 55) return '45-54';
      if (age < 65) return '55-64';
      return '65+';
    };

    // Buying behavior calculations
    const purchaseHourBreakdown: Record<string, { count: number; value: number }> = {};
    const purchaseDayBreakdown: Record<string, { count: number; value: number }> = {};
    const advanceBookingBreakdown: Record<string, { count: number; value: number }> = {};
    const monthBreakdown: Record<string, { count: number; value: number }> = {};

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    filteredData.forEach(r => {
      const ageGroup = getAgeGroup(r.dob);
      if (!ageBreakdown[ageGroup]) ageBreakdown[ageGroup] = { count: 0, value: 0 };
      ageBreakdown[ageGroup].count += r.quantity;
      ageBreakdown[ageGroup].value += r.commercialValue;

      const location = r.province || r.pob || '';
      let normalizedLoc = location.trim().toUpperCase();
      if (normalizedLoc === 'VA') normalizedLoc = 'VARESE';
      if (normalizedLoc === 'MI') normalizedLoc = 'MILANO';
      if (normalizedLoc === 'CO') normalizedLoc = 'COMO';
      if (normalizedLoc === 'NO') normalizedLoc = 'NOVARA';
      if (!normalizedLoc) normalizedLoc = 'Unknown';
      if (normalizedLoc !== 'Unknown') {
        if (!locationBreakdown[normalizedLoc]) locationBreakdown[normalizedLoc] = { count: 0, value: 0 };
        locationBreakdown[normalizedLoc].count += r.quantity;
        locationBreakdown[normalizedLoc].value += r.commercialValue;
      }

      const zone = r.pvZone || 'Unknown';
      if (!zoneStats[zone]) zoneStats[zone] = { totalValue: 0, totalTickets: 0, totalAdvanceDays: 0, advanceCount: 0 };
      zoneStats[zone].totalValue += r.commercialValue;
      zoneStats[zone].totalTickets += r.quantity;
      
      // Calculate advance days for this zone
      const zoneBuyTs = r.buyTimestamp && r.buyTimestamp instanceof Date && !isNaN(r.buyTimestamp.getTime()) ? r.buyTimestamp : null;
      if (zoneBuyTs && r.gmDateTime && r.gmDateTime > 0) {
        const gameDate = new Date(r.gmDateTime);
        if (!isNaN(gameDate.getTime())) {
          const diffDays = Math.floor((gameDate.getTime() - zoneBuyTs.getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays >= 0) {
            zoneStats[zone].totalAdvanceDays += diffDays * r.quantity;
            zoneStats[zone].advanceCount += r.quantity;
          }
        }
      }
      
      if (ageGroup !== 'Unknown') {
        if (!zoneByAge[zone]) zoneByAge[zone] = {};
        if (!zoneByAge[zone][ageGroup]) zoneByAge[zone][ageGroup] = 0;
        zoneByAge[zone][ageGroup] += r.quantity;
      }

      if (normalizedLoc !== 'Unknown') {
        if (!zoneByLocation[zone]) zoneByLocation[zone] = {};
        if (!zoneByLocation[zone][normalizedLoc]) zoneByLocation[zone][normalizedLoc] = 0;
        zoneByLocation[zone][normalizedLoc] += r.quantity;
      }

      // Buying behavior
      if (r.buyTimestamp && r.buyTimestamp instanceof Date && !isNaN(r.buyTimestamp.getTime())) {
        const hour = r.buyTimestamp.getHours();
        const minute = r.buyTimestamp.getMinutes();
        const hasValidTime = !(hour === 0 && minute === 0);
        
        if (hasValidTime) {
          const hourLabel = `${hour.toString().padStart(2, '0')}:00`;
          if (!purchaseHourBreakdown[hourLabel]) purchaseHourBreakdown[hourLabel] = { count: 0, value: 0 };
          purchaseHourBreakdown[hourLabel].count += r.quantity;
          purchaseHourBreakdown[hourLabel].value += r.commercialValue;
        }

        const dayOfWeek = dayNames[r.buyTimestamp.getDay()];
        if (!purchaseDayBreakdown[dayOfWeek]) purchaseDayBreakdown[dayOfWeek] = { count: 0, value: 0 };
        purchaseDayBreakdown[dayOfWeek].count += r.quantity;
        purchaseDayBreakdown[dayOfWeek].value += r.commercialValue;

        const monthKey = `${r.buyTimestamp.getFullYear()}-${(r.buyTimestamp.getMonth() + 1).toString().padStart(2, '0')}`;
        if (!monthBreakdown[monthKey]) monthBreakdown[monthKey] = { count: 0, value: 0 };
        monthBreakdown[monthKey].count += r.quantity;
        monthBreakdown[monthKey].value += r.commercialValue;
      }

      // Advance booking (days before game)
      const buyTs = r.buyTimestamp && r.buyTimestamp instanceof Date && !isNaN(r.buyTimestamp.getTime()) ? r.buyTimestamp : null;
      if (buyTs && r.gmDateTime && r.gmDateTime > 0) {
        const gameDate = new Date(r.gmDateTime);
        if (!isNaN(gameDate.getTime())) {
          const diffDays = Math.floor((gameDate.getTime() - buyTs.getTime()) / (1000 * 60 * 60 * 24));
          let advanceLabel: string;
          if (diffDays <= 0) advanceLabel = 'Same Day';
          else if (diffDays <= 3) advanceLabel = '1-3 Days';
          else if (diffDays <= 7) advanceLabel = '4-7 Days';
          else if (diffDays <= 14) advanceLabel = '1-2 Weeks';
          else if (diffDays <= 30) advanceLabel = '2-4 Weeks';
          else advanceLabel = '1+ Month';
          
          if (!advanceBookingBreakdown[advanceLabel]) advanceBookingBreakdown[advanceLabel] = { count: 0, value: 0 };
          advanceBookingBreakdown[advanceLabel].count += r.quantity;
          advanceBookingBreakdown[advanceLabel].value += r.commercialValue;
        }
      }
    });

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
      rawSellTypeBreakdown,
      groupedSellTypeBreakdown,
      paymentBreakdown,
      discountBreakdown,
      topCustomers,
      topCorps,
      ageBreakdown,
      locationBreakdown,
      zoneByAge,
      zoneByLocation,
      zoneStats,
      purchaseHourBreakdown,
      purchaseDayBreakdown,
      advanceBookingBreakdown,
      monthBreakdown
    };
  }, [filteredData, sectorLookup]);


  const ageChartData = useMemo(() => {
    const order = ['Under 18', '18-24', '25-34', '35-44', '45-54', '55-64', '65+'];
    return Object.entries(stats.ageBreakdown)
      .filter(([age]) => age !== 'Unknown')
      .map(([age, val]) => ({ age, tickets: val.count, value: val.value }))
      .sort((a, b) => order.indexOf(a.age) - order.indexOf(b.age));
  }, [stats.ageBreakdown]);

  const locationChartData = useMemo(() => 
    Object.entries(stats.locationBreakdown)
      .filter(([location]) => location !== 'Unknown')
      .map(([location, val]) => ({ location, tickets: val.count, value: val.value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10),
  [stats.locationBreakdown]);

  const hourChartData = useMemo(() => {
    const hours = [];
    for (let i = 0; i < 24; i++) {
      const label = `${i.toString().padStart(2, '0')}:00`;
      const data = stats.purchaseHourBreakdown[label] || { count: 0, value: 0 };
      hours.push({ hour: label, tickets: data.count, value: data.value });
    }
    return hours;
  }, [stats.purchaseHourBreakdown]);

  const dayChartData = useMemo(() => {
    const order = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return order.map(day => ({
      day,
      tickets: stats.purchaseDayBreakdown[day]?.count || 0,
      value: stats.purchaseDayBreakdown[day]?.value || 0
    }));
  }, [stats.purchaseDayBreakdown]);

  const advanceChartData = useMemo(() => {
    const order = ['Same Day', '1-3 Days', '4-7 Days', '1-2 Weeks', '2-4 Weeks', '1+ Month'];
    return order.map(label => ({
      label,
      tickets: stats.advanceBookingBreakdown[label]?.count || 0,
      value: stats.advanceBookingBreakdown[label]?.value || 0
    })).filter(d => d.tickets > 0);
  }, [stats.advanceBookingBreakdown]);

  const paymentChartData = useMemo(() => 
    Object.entries(stats.paymentBreakdown)
      .map(([method, val]) => ({ method, tickets: val.count, revenue: val.revenue }))
      .sort((a, b) => b.tickets - a.tickets)
      .slice(0, 8),
  [stats.paymentBreakdown]);

  const salesChannelChartData = useMemo(() => 
    Object.entries(stats.rawSellTypeBreakdown)
      .filter(([name]) => !['PROTOCOL', 'GIVEAWAY', 'GIVEAWAYS'].includes(name.toUpperCase()))
      .map(([name, val]) => ({ name, tickets: val.count, value: val.value }))
      .sort((a, b) => b.value - a.value),
  [stats.rawSellTypeBreakdown]);

  const ticketTypeDistributionData = useMemo(() => 
    Object.entries(stats.groupedSellTypeBreakdown)
      .map(([name, val]) => ({ name, tickets: val.count, value: val.value }))
      .sort((a, b) => b.value - a.value),
  [stats.groupedSellTypeBreakdown]);

  const customerDetail = useMemo(() => {
    if (!selectedCustomer) return null;
    const records = filteredData.filter(r => getCustomerKey(r) === selectedCustomer);
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

  if (isLoading && data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] text-center p-8 animate-fade-in pt-6">
        <div className="w-16 h-16 border-4 border-gray-200 border-t-red-600 rounded-full animate-spin mb-6"></div>
        <p className="text-gray-500">Loading CRM data...</p>
      </div>
    );
  }

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
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Filter: name, zone, type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent w-64"
            />
          </div>
          <select
            value={filterSellType || ''}
            onChange={(e) => setFilterSellType(e.target.value || null)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white"
          >
            <option value="">All Sell Types</option>
            <option value="Corp">Corp</option>
            <option value="Abb">Abb</option>
            <option value="VB">VB</option>
            <option value="GiveAway">GiveAway</option>
            <option value="MP">MP</option>
            <option value="Tix">Tix</option>
          </select>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {['overview', 'demographics', 'behavior', 'corporate'].map(view => (
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
            {view === 'demographics' && <Users size={14} className="inline mr-2" />}
            {view === 'behavior' && <TrendingUp size={14} className="inline mr-2" />}
            {view === 'corporate' && <Building2 size={14} className="inline mr-2" />}
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
                <PieChart size={20} className="text-blue-500" />
                Ticket Type Distribution
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPie>
                    <Pie
                      data={ticketTypeDistributionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="tickets"
                      nameKey="name"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {ticketTypeDistributionData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={COLORS[index % COLORS.length]} 
                          cursor="pointer"
                          onClick={() => setFilterSellType(filterSellType === entry.name ? null : entry.name)}
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => value.toLocaleString() + ' tickets'} />
                    <Legend />
                  </RechartsPie>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <BarChart3 size={20} className="text-green-500" />
                Sales Channel Breakdown
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={salesChannelChartData}>
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

          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Award size={20} className="text-amber-500" />
              Top 10 Customers by Value
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-2 font-semibold text-gray-600">#</th>
                    <th className="text-left py-2 px-2 font-semibold text-gray-600">Customer</th>
                    <th className="text-center py-2 px-2 font-semibold text-gray-600">Tickets</th>
                    <th className="text-right py-2 px-2 font-semibold text-gray-600">Total Paid</th>
                    <th className="text-right py-2 px-2 font-semibold text-gray-600">Avg/Gm</th>
                    <th className="text-right py-2 px-2 font-semibold text-gray-600">Avg/Txn</th>
                    <th className="text-left py-2 px-2 font-semibold text-gray-600">Favorite Zone</th>
                    <th className="text-center py-2 px-2 font-semibold text-gray-600">Avg Advance</th>
                    <th className="text-left py-2 px-2 font-semibold text-gray-600">Age</th>
                    <th className="text-left py-2 px-2 font-semibold text-gray-600">Location</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.topCustomers.map((c, i) => {
                    let ageDisplay = '-';
                    if (c.age) {
                      const parts = c.age.split('/');
                      if (parts.length >= 3) {
                        const year = parseInt(parts[2], 10);
                        if (!isNaN(year)) {
                          ageDisplay = String(new Date().getFullYear() - year);
                        }
                      }
                    }
                    return (
                      <tr 
                        key={c.key} 
                        className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => setSelectedCustomer(selectedCustomer === c.key ? null : c.key)}
                      >
                        <td className="py-2 px-2">
                          <span className="w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-bold">{i + 1}</span>
                        </td>
                        <td className="py-2 px-2">
                          <p className="font-medium text-gray-800">{c.name}</p>
                        </td>
                        <td className="py-2 px-2 text-center text-gray-600">{c.tickets}</td>
                        <td className="py-2 px-2 text-right font-bold text-gray-900">{formatCompact(c.value)}</td>
                        <td className="py-2 px-2 text-right text-gray-600">{c.avgPerGame > 0 ? formatCompact(c.avgPerGame) : '-'}</td>
                        <td className="py-2 px-2 text-right text-gray-600">{c.avgPerTxn > 0 ? formatCompact(c.avgPerTxn) : '-'}</td>
                        <td className="py-2 px-2">
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">{c.favoriteZone}</span>
                        </td>
                        <td className="py-2 px-2 text-center text-gray-600">
                          {c.avgAdvance !== null ? `${c.avgAdvance}d` : '-'}
                        </td>
                        <td className="py-2 px-2 text-gray-600">{ageDisplay}</td>
                        <td className="py-2 px-2 text-gray-600">{c.location || '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeView === 'demographics' && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Users size={20} className="text-blue-500" />
                Age Distribution
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ageChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="age" tick={{ fontSize: 10 }} />
                    <YAxis tickFormatter={(v) => v.toLocaleString()} tick={{ fontSize: 11 }} />
                    <Tooltip 
                      formatter={(value: number, name: string) => [value.toLocaleString(), name === 'tickets' ? 'Tickets' : 'Value']}
                      contentStyle={{ fontSize: '12px', borderRadius: '8px' }}
                    />
                    <Bar dataKey="tickets" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <MapPin size={20} className="text-green-500" />
                Top Locations (Province)
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={locationChartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis type="number" tickFormatter={(v) => v.toLocaleString()} tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="location" tick={{ fontSize: 10 }} width={60} />
                    <Tooltip 
                      formatter={(value: number) => [value.toLocaleString() + ' tickets']}
                      contentStyle={{ fontSize: '12px', borderRadius: '8px' }}
                    />
                    <Bar dataKey="tickets" fill="#16a34a" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Users size={20} className="text-purple-500" />
              Buyer Persona by Zone
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium">Zone</th>
                    <th className="text-center py-3 px-4 font-medium">Under 18</th>
                    <th className="text-center py-3 px-4 font-medium">18-24</th>
                    <th className="text-center py-3 px-4 font-medium">25-34</th>
                    <th className="text-center py-3 px-4 font-medium">35-44</th>
                    <th className="text-center py-3 px-4 font-medium">45-54</th>
                    <th className="text-center py-3 px-4 font-medium">55-64</th>
                    <th className="text-center py-3 px-4 font-medium">65+</th>
                    <th className="text-right py-3 px-4 font-medium">Avg Price</th>
                    <th className="text-right py-3 px-4 font-medium">Avg Advance</th>
                    <th className="text-right py-3 px-4 font-medium">Top Location</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {Object.entries(stats.zoneByAge)
                    .sort((a, b) => Object.values(b[1]).reduce((s, v) => s + v, 0) - Object.values(a[1]).reduce((s, v) => s + v, 0))
                    .slice(0, 10)
                    .map(([zone, ages]) => {
                      const locations = stats.zoneByLocation[zone] || {};
                      const topLoc = Object.entries(locations).filter(([loc]) => loc !== 'Unknown').sort((a, b) => b[1] - a[1])[0];
                      const zoneTotal = Object.values(ages).reduce((s, v) => s + v, 0);
                      const zs = stats.zoneStats[zone];
                      const avgPrice = zs && zs.totalTickets > 0 ? zs.totalValue / zs.totalTickets : 0;
                      const ageGroups = ['Under 18', '18-24', '25-34', '35-44', '45-54', '55-64', '65+'];
                      const getColorIntensity = (pct: number) => {
                        if (pct === 0) return 'bg-gray-50 text-gray-400';
                        if (pct < 10) return 'bg-blue-50 text-blue-600';
                        if (pct < 20) return 'bg-blue-100 text-blue-700';
                        if (pct < 30) return 'bg-blue-200 text-blue-800';
                        if (pct < 40) return 'bg-blue-300 text-blue-900';
                        return 'bg-blue-400 text-white';
                      };
                      return (
                        <tr key={zone} className="hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium text-gray-800">{zone}</td>
                          {ageGroups.map(ag => {
                            const count = ages[ag] || 0;
                            const pct = zoneTotal > 0 ? (count / zoneTotal) * 100 : 0;
                            return (
                              <td key={ag} className="py-2 px-2 text-center">
                                <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getColorIntensity(pct)}`}>
                                  {pct > 0 ? `${pct.toFixed(0)}%` : '-'}
                                </span>
                              </td>
                            );
                          })}
                          <td className="py-3 px-4 text-right font-medium text-gray-700">
                            {avgPrice > 0 ? `€${avgPrice.toFixed(0)}` : '-'}
                          </td>
                          <td className="py-3 px-4 text-right font-medium text-gray-700">
                            {zs && zs.advanceCount > 0 ? `${Math.round(zs.totalAdvanceDays / zs.advanceCount)}d` : '-'}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {topLoc ? (
                              <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs">{topLoc[0]}</span>
                            ) : '-'}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeView === 'behavior' && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <TrendingUp size={20} className="text-blue-500" />
                Purchase Time (Hour of Day)
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={hourChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="hour" tick={{ fontSize: 9 }} interval={2} />
                    <YAxis tickFormatter={(v) => v.toLocaleString()} tick={{ fontSize: 11 }} />
                    <Tooltip 
                      formatter={(value: number) => [value.toLocaleString() + ' tickets']}
                      contentStyle={{ fontSize: '12px', borderRadius: '8px' }}
                    />
                    <Bar dataKey="tickets" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <BarChart3 size={20} className="text-purple-500" />
                Purchase Day of Week
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dayChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                    <YAxis tickFormatter={(v) => v.toLocaleString()} tick={{ fontSize: 11 }} />
                    <Tooltip 
                      formatter={(value: number) => [value.toLocaleString() + ' tickets']}
                      contentStyle={{ fontSize: '12px', borderRadius: '8px' }}
                    />
                    <Bar dataKey="tickets" fill="#9333ea" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Award size={20} className="text-amber-500" />
                Advance Booking (Days Before Game)
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={advanceChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                    <YAxis tickFormatter={(v) => v.toLocaleString()} tick={{ fontSize: 11 }} />
                    <Tooltip 
                      formatter={(value: number) => [value.toLocaleString() + ' tickets']}
                      contentStyle={{ fontSize: '12px', borderRadius: '8px' }}
                    />
                    <Bar dataKey="tickets" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Euro size={20} className="text-green-500" />
                Payment Methods
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPie>
                    <Pie
                      data={paymentChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="tickets"
                      nameKey="method"
                      label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {paymentChartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => value.toLocaleString() + ' tickets'} />
                    <Legend />
                  </RechartsPie>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
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
                    <th className="text-left py-3 px-4 font-medium">Sector</th>
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
                      <td className="py-3 px-4 text-gray-600">
                        {c.sector !== '—' ? (
                          <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">{c.sector}</span>
                        ) : '—'}
                      </td>
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
                  {(() => {
                    const grouped: Record<string, { label: string; sellType: string; tickets: number; value: number; zone: string }> = {};
                    customerDetail.records.forEach(r => {
                      const rawSell = (r.sellType || '').toLowerCase();
                      const isAbb = rawSell === 'abb';
                      const key = isAbb ? 'Season Ticket' : (r.game || r.event || 'Unknown');
                      const sellType = rawSell.toUpperCase() || 'N/A';
                      if (!grouped[key]) grouped[key] = { label: key, sellType, tickets: 0, value: 0, zone: r.pvZone || '' };
                      grouped[key].tickets += r.quantity;
                      grouped[key].value += r.commercialValue;
                    });
                    return Object.values(grouped)
                      .sort((a, b) => b.value - a.value)
                      .map((g, i) => (
                        <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-sm">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{g.label}</p>
                            <p className="text-xs text-gray-500">{g.sellType} • {g.tickets} tickets • {g.zone}</p>
                          </div>
                          <span className="font-bold text-green-600 ml-2">{formatCurrency(g.value)}</span>
                        </div>
                      ));
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
