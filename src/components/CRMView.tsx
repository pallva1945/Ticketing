import React, { useState, useMemo } from 'react';
import { Users, Building2, Mail, MapPin, Ticket, TrendingUp, Search, X, Filter, BarChart3, PieChart, Euro, Award, ChevronUp, ChevronDown, ChevronLeft, User, Loader2 } from 'lucide-react';
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

interface CRMStats {
  totalRecords: number;
  totalTickets: number;
  totalRevenue: number;
  uniqueCustomers: number;
  topCustomers: Array<{
    key: string;
    name: string;
    email: string;
    tickets: number;
    value: number;
    principalZone: string;
    secondaryZone: string;
    topSellType: string;
    avgAdvance: number | null;
    gameCount: number;
    avgPerGame: number;
    avgPerTxn: number;
    age: string;
    location: string;
  }>;
  zoneBreakdown: Array<{ zone: string; tickets: number; revenue: number }>;
  sellTypeBreakdown: Array<{ type: string; tickets: number; revenue: number }>;
  ageBreakdown?: Record<string, { count: number; value: number }>;
  locationBreakdown?: Record<string, { count: number; value: number }>;
  purchaseHourBreakdown?: Record<string, { count: number; value: number }>;
  purchaseDayBreakdown?: Record<string, { count: number; value: number }>;
  advanceBookingBreakdown?: Record<string, { count: number; value: number }>;
  zoneByAge?: Record<string, Record<string, number>>;
  zoneByLocation?: Record<string, Record<string, number>>;
  zoneStats?: Record<string, { totalValue: number; totalTickets: number; totalAdvanceDays: number; advanceCount: number }>;
  paymentBreakdown?: Record<string, { count: number; revenue: number }>;
  topCorps?: Array<{ name: string; count: number; revenue: number; value: number; principalZone: string; secondaryZone: string }>;
  uniqueCorps?: number;
  corporateTickets?: number;
  capacityBreakdown?: {
    fixed: { tickets: number; revenue: number };
    flexible: { tickets: number; revenue: number };
  };
  corpCommercialValue?: number;
}

interface CRMViewProps {
  data: CRMRecord[];
  sponsorData?: SponsorData[];
  isLoading?: boolean;
  serverStats?: { all: CRMStats; fixed: CRMStats; flexible: CRMStats } | null; // Pre-computed stats from server for fast loading
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

export const CRMView: React.FC<CRMViewProps> = ({ data, sponsorData = [], isLoading = false, serverStats = null }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterZone, setFilterZone] = useState<string | null>(null);
  const [filterEvent, setFilterEvent] = useState<string | null>(null);
  const [capacityView, setCapacityView] = useState<'all' | 'fixed' | 'flexible'>('all');
  const [activeView, setActiveView] = useState<'overview' | 'demographics' | 'behavior' | 'customers' | 'corporate' | 'search'>('overview');
  const [clientSearchQuery, setClientSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [searchSelectedClient, setSearchSelectedClient] = useState<string | null>(null);
  const [searchGameFilter, setSearchGameFilter] = useState<string>('all');
  const [sortColumn, setSortColumn] = useState<string>('value');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const hasActiveFilter = filterZone || filterEvent || capacityView !== 'all' || searchQuery;

  const getCapacityBucket = (r: CRMRecord): 'fixed' | 'flexible' => {
    // Fixed = event equals "ABBONAMENTO LBA 2025/26" (case-insensitive)
    // Flexible = everything else
    const eventLower = (r.event || '').trim().toLowerCase();
    if (eventLower === 'abbonamento lba 2025/26') {
      return 'fixed';
    }
    return 'flexible';
  };

  const clearAllFilters = () => {
    setFilterZone(null);
    setFilterEvent(null);
    setCapacityView('all');
    setSearchQuery('');
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
    if (capacityView !== 'all') {
      result = result.filter(r => getCapacityBucket(r) === capacityView);
    }
    
    return result;
  }, [data, searchQuery, filterZone, filterEvent, capacityView]);

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
    // Use server-computed stats when no complex filters (search, zone, event) are active
    // For capacity filter, we can use the pre-computed fixed/flexible stats from server
    const hasComplexFilter = !!filterZone || !!filterEvent || !!searchQuery;
    
    if (serverStats && !hasComplexFilter) {
      // Select the appropriate pre-computed stats based on capacityView
      const selectedStats = capacityView === 'fixed' ? serverStats.fixed 
                          : capacityView === 'flexible' ? serverStats.flexible 
                          : serverStats.all;
      
      // Use the selected stats, or fall back to all stats
      const statsToUse = selectedStats || serverStats.all;
      if (!statsToUse) {
        // Return empty default stats if nothing available
        return {
          uniqueEmails: 0, uniqueCustomers: 0, uniqueCorps: 0, totalRevenue: 0, totalCommercialValue: 0,
          corpCommercialValue: 0, totalTickets: 0, zoneBreakdown: {}, eventBreakdown: {}, rawSellTypeBreakdown: {},
          groupedSellTypeBreakdown: {}, paymentBreakdown: {}, discountBreakdown: {}, topCorps: [], allCustomers: [],
          ageBreakdown: {}, locationBreakdown: {}, zoneStats: {}, purchaseHourBreakdown: {}, purchaseDayBreakdown: {},
          advanceBookingBreakdown: {}, monthBreakdown: {}, zoneByAge: {}, zoneByLocation: {}, corporateTickets: 0,
          capacityBreakdown: { fixed: { tickets: 0, revenue: 0 }, flexible: { tickets: 0, revenue: 0 } }
        };
      }
      
      // Build zoneBreakdown as Record
      const zoneBreakdown: Record<string, { count: number; revenue: number; value: number }> = {};
      (statsToUse.zoneBreakdown || []).forEach((z: any) => {
        zoneBreakdown[z.zone] = { count: z.tickets, revenue: z.revenue, value: z.revenue };
      });
      
      // Build rawSellTypeBreakdown from server data
      const rawSellTypeBreakdown: Record<string, { count: number; revenue: number; value: number }> = {};
      const groupedSellTypeBreakdown: Record<string, { count: number; revenue: number; value: number }> = {};
      (statsToUse.sellTypeBreakdown || []).forEach((s: any) => {
        rawSellTypeBreakdown[s.type] = { count: s.tickets, revenue: s.revenue, value: s.revenue };
        // Group into categories
        const typeLower = (s.type || '').toLowerCase();
        let category = s.type;
        if (['mp', 'tix', 'vb'].includes(typeLower)) category = 'GameDay';
        else if (['corp', 'abb'].includes(typeLower)) category = 'Fixed';
        else if (['protocol', 'giveaway', 'giveaways'].includes(typeLower)) category = 'Giveaway';
        
        if (!groupedSellTypeBreakdown[category]) groupedSellTypeBreakdown[category] = { count: 0, revenue: 0, value: 0 };
        groupedSellTypeBreakdown[category].count += s.tickets;
        groupedSellTypeBreakdown[category].revenue += s.revenue;
        groupedSellTypeBreakdown[category].value += s.revenue;
      });

      // Build paymentBreakdown from server data
      const serverPaymentBreakdown: Record<string, { count: number; revenue: number }> = {};
      if (statsToUse.paymentBreakdown) {
        Object.entries(statsToUse.paymentBreakdown).forEach(([method, val]: [string, any]) => {
          serverPaymentBreakdown[method] = { count: val.count, revenue: val.revenue };
        });
      }

      return {
        uniqueEmails: statsToUse.uniqueCustomers || 0,
        uniqueCustomers: statsToUse.uniqueCustomers || 0,
        uniqueCorps: statsToUse.uniqueCorps || 0,
        totalRevenue: statsToUse.totalRevenue || 0,
        totalCommercialValue: statsToUse.totalRevenue || 0,
        corpCommercialValue: statsToUse.corpCommercialValue || 0,
        totalTickets: statsToUse.totalTickets || 0,
        zoneBreakdown,
        eventBreakdown: {} as Record<string, { count: number; revenue: number }>,
        rawSellTypeBreakdown,
        groupedSellTypeBreakdown,
        paymentBreakdown: serverPaymentBreakdown,
        discountBreakdown: {} as Record<string, { count: number; revenue: number }>,
        topCorps: statsToUse.topCorps || [],
        allCustomers: statsToUse.topCustomers || [],
        ageBreakdown: statsToUse.ageBreakdown || {},
        locationBreakdown: statsToUse.locationBreakdown || {},
        zoneStats: statsToUse.zoneStats || {},
        purchaseHourBreakdown: statsToUse.purchaseHourBreakdown || {},
        purchaseDayBreakdown: statsToUse.purchaseDayBreakdown || {},
        advanceBookingBreakdown: statsToUse.advanceBookingBreakdown || {},
        monthBreakdown: {} as Record<string, { count: number; value: number }>,
        zoneByAge: statsToUse.zoneByAge || {},
        zoneByLocation: statsToUse.zoneByLocation || {},
        corporateTickets: statsToUse.corporateTickets || 0,
        capacityBreakdown: statsToUse.capacityBreakdown
      };
    }
    
    const uniqueEmails = new Set(filteredData.filter(r => r.email).map(r => r.email.toLowerCase()));
    const uniqueCustomers = new Set(filteredData.map(r => r.email || r.fullName));
    const corporateRecords = filteredData.filter(r => r.sellType === 'Corp' || r.ticketType === 'CORP');
    const uniqueCorps = new Set(corporateRecords.map(r => r.group).filter(Boolean));
    
    const totalRevenue = filteredData.reduce((sum, r) => sum + r.price, 0);
    const totalCommercialValue = filteredData.reduce((sum, r) => sum + r.commercialValue, 0);
    const corpCommercialValue = corporateRecords.reduce((sum, r) => sum + r.commercialValue, 0);
    const totalTickets = filteredData.reduce((sum, r) => sum + r.quantity, 0);

    const zoneBreakdown: Record<string, { count: number; revenue: number; value: number }> = {};
    const eventBreakdown: Record<string, { count: number; revenue: number }> = {};
    const rawSellTypeBreakdown: Record<string, { count: number; revenue: number; value: number }> = {};
    const groupedSellTypeBreakdown: Record<string, { count: number; revenue: number; value: number }> = {};
    const paymentBreakdown: Record<string, { count: number; revenue: number }> = {};
    const discountBreakdown: Record<string, { count: number; revenue: number }> = {};
    const corpBreakdown: Record<string, { count: number; revenue: number; value: number; zones: Record<string, number> }> = {};

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

      let payment = r.payment || 'Unknown';
      const paymentLower = payment.toLowerCase().replace(/[^a-z]/g, '');
      if (
        paymentLower.includes('visa') ||
        paymentLower.includes('mastercard') ||
        paymentLower.includes('master') ||
        paymentLower.includes('cartadicredito') ||
        paymentLower.includes('bancomat') ||
        paymentLower.includes('amex') ||
        paymentLower.includes('americanexpress') ||
        paymentLower === 'pos'
      ) {
        payment = 'Credit Card';
      }
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
        if (!corpBreakdown[corpKey]) corpBreakdown[corpKey] = { count: 0, revenue: 0, value: 0, zones: {} as Record<string, number> };
        corpBreakdown[corpKey].count += r.quantity;
        corpBreakdown[corpKey].revenue += r.price;
        corpBreakdown[corpKey].value += r.commercialValue;
        const zone = r.pvZone || r.zone || 'Unknown';
        corpBreakdown[corpKey].zones[zone] = (corpBreakdown[corpKey].zones[zone] || 0) + (Number(r.quantity) || 1);
      }
    });

    const nonCorpData = filteredData.filter(r => {
      const sellLower = (r.sellType || '').toLowerCase();
      const ticketLower = (r.ticketType || '').toLowerCase();
      const isCorp = sellLower === 'corp' || ticketLower === 'corp';
      const isAbb = sellLower === 'abb' || ticketLower === 'abb';
      const isGiveaway = ['protocol', 'giveaway', 'giveaways'].includes(sellLower) || ['protocol', 'giveaway', 'giveaways'].includes(ticketLower);
      return !isCorp && !isAbb && !isGiveaway;
    });

    const allCustomers = Object.entries(
      nonCorpData.reduce((acc, r) => {
        const key = getCustomerKey(r);
        if (!acc[key]) acc[key] = { 
          name: r.fullName, 
          email: r.email, 
          tickets: 0, 
          revenue: 0, 
          value: 0,
          zones: {} as Record<string, number>,
          sellTypes: {} as Record<string, number>,
          games: new Set<string>(),
          transactions: 0,
          age: r.dob || '',
          location: r.province || r.pob || '',
          advanceDays: [] as number[]
        };
        const sellType = r.sellType || r.ticketType || 'Unknown';
        acc[key].sellTypes[sellType] = (acc[key].sellTypes[sellType] || 0) + (Number(r.quantity) || 1);
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
      }, {} as Record<string, { name: string; email: string; tickets: number; revenue: number; value: number; zones: Record<string, number>; sellTypes: Record<string, number>; games: Set<string>; transactions: number; age: string; location: string; advanceDays: number[] }>)
    ).map(([key, val]) => {
      const sortedZones = Object.entries(val.zones).sort((a, b) => b[1] - a[1]);
      const principalZone = sortedZones[0]?.[0] || '—';
      const secondaryZone = sortedZones[1]?.[0] || '—';
      const topSellType = Object.entries(val.sellTypes).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Unknown';
      const avgAdvance = val.advanceDays.length > 0 ? Math.round(val.advanceDays.reduce((a, b) => a + b, 0) / val.advanceDays.length) : null;
      const gameCount = val.games.size;
      const avgPerGame = gameCount > 0 ? val.value / gameCount : 0;
      const avgPerTxn = val.transactions > 0 ? val.value / val.transactions : 0;
      return { key, ...val, principalZone, secondaryZone, topSellType, avgAdvance, gameCount, avgPerGame, avgPerTxn };
    });

    const topCorps = Object.entries(corpBreakdown)
      .map(([name, val]) => {
        const sortedZones = Object.entries(val.zones).sort((a, b) => b[1] - a[1]);
        const principalZone = sortedZones[0]?.[0] || '—';
        const secondaryZone = sortedZones[1]?.[0] || '—';
        return { name, ...val, principalZone, secondaryZone };
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
      if (age < 25) return 'Under 25';
      if (age < 45) return '25-44';
      if (age < 65) return '45-64';
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
      if (normalizedLoc === 'MB') normalizedLoc = 'MONZA';
      if (normalizedLoc === 'BG') normalizedLoc = 'BERGAMO';
      if (normalizedLoc === 'RM') normalizedLoc = 'ROMA';
      if (normalizedLoc === 'VS') normalizedLoc = 'VERCELLI';
      if (normalizedLoc === 'UD') normalizedLoc = 'UDINE';
      if (normalizedLoc === 'NA') normalizedLoc = 'NAPOLI';
      if (normalizedLoc === 'VB') normalizedLoc = 'VERBANO';
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
      allCustomers,
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
  }, [filteredData, sectorLookup, serverStats, hasActiveFilter]);


  const ageChartData = useMemo(() => {
    const order = ['Under 25', '25-44', '45-64', '65+'];
    return Object.entries(stats.ageBreakdown || {})
      .filter(([age]) => age !== 'Unknown')
      .map(([age, val]: [string, any]) => ({ age, tickets: val.count, value: val.value }))
      .sort((a, b) => order.indexOf(a.age) - order.indexOf(b.age));
  }, [stats.ageBreakdown]);

  const locationChartData = useMemo(() => 
    Object.entries(stats.locationBreakdown || {})
      .filter(([location]) => location !== 'Unknown')
      .map(([location, val]: [string, any]) => ({ location, tickets: val.count, value: val.value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10),
  [stats.locationBreakdown]);

  const hourChartData = useMemo(() => {
    const hours = [];
    const breakdown = stats.purchaseHourBreakdown || {};
    for (let i = 0; i < 24; i++) {
      const label = `${i.toString().padStart(2, '0')}:00`;
      const data = breakdown[label] || { count: 0, value: 0 };
      hours.push({ hour: label, tickets: data.count, value: data.value });
    }
    return hours;
  }, [stats.purchaseHourBreakdown]);

  const dayChartData = useMemo(() => {
    const order = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const breakdown = stats.purchaseDayBreakdown || {};
    return order.map(day => ({
      day,
      tickets: breakdown[day]?.count || 0,
      value: breakdown[day]?.value || 0
    }));
  }, [stats.purchaseDayBreakdown]);

  const advanceChartData = useMemo(() => {
    const order = ['Same Day', '1-3 Days', '4-7 Days', '1-2 Weeks', '2-4 Weeks', '1+ Month'];
    const breakdown = stats.advanceBookingBreakdown || {};
    return order.map(label => ({
      label,
      tickets: breakdown[label]?.count || 0,
      value: breakdown[label]?.value || 0
    })).filter(d => d.tickets > 0);
  }, [stats.advanceBookingBreakdown]);

  const paymentChartData = useMemo(() => 
    Object.entries(stats.paymentBreakdown || {})
      .map(([method, val]: [string, any]) => ({ method, tickets: val.count, revenue: val.revenue }))
      .sort((a, b) => b.tickets - a.tickets)
      .slice(0, 8),
  [stats.paymentBreakdown]);

  const salesChannelChartData = useMemo(() => 
    Object.entries(stats.rawSellTypeBreakdown || {})
      .filter(([name]) => !['PROTOCOL', 'GIVEAWAY', 'GIVEAWAYS'].includes(name.toUpperCase()))
      .map(([name, val]: [string, any]) => ({ name, tickets: val.count, value: val.value }))
      .sort((a, b) => b.value - a.value),
  [stats.rawSellTypeBreakdown]);

  const ticketTypeDistributionData = useMemo(() => 
    Object.entries(stats.groupedSellTypeBreakdown || {})
      .map(([name, val]: [string, any]) => ({ name, tickets: val.count, value: val.value }))
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

  if (isLoading && data.length === 0 && !serverStats) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] text-center p-8 animate-fade-in pt-6">
        <div className="w-16 h-16 border-4 border-gray-200 border-t-red-600 rounded-full animate-spin mb-6"></div>
        <p className="text-gray-500">Loading CRM data...</p>
      </div>
    );
  }

  if (data.length === 0 && !serverStats) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] text-center p-8 animate-fade-in pt-6">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6 shadow-inner relative overflow-hidden">
          <Users size={40} className="text-gray-400 relative z-10" />
        </div>
        <h2 className="text-3xl font-bold text-gray-800 mb-2">CRM System</h2>
        <p className="text-gray-500 max-w-md mb-8">
          Loading CRM data from BigQuery...
        </p>
        <div className="flex items-center gap-2 text-gray-400">
          <Loader2 size={20} className="animate-spin" />
          <span>Please wait</span>
        </div>
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
          <div className="inline-flex rounded-lg border border-gray-200 bg-gray-100 p-1">
            {[
              { key: 'all', label: 'All' },
              { key: 'fixed', label: 'Fix Sell (Summer)' },
              { key: 'flexible', label: 'Flexible Sell (inSeason)' }
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setCapacityView(key as 'all' | 'fixed' | 'flexible')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  capacityView === key
                    ? 'bg-white text-gray-800 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {['overview', 'demographics', 'behavior', 'corporate', 'search'].map(view => (
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
            {view === 'search' && <Search size={14} className="inline mr-2" />}
            {view === 'search' ? 'Client Search' : view.charAt(0).toUpperCase() + view.slice(1)}
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
                {capacityView !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-amber-300 rounded-full text-xs font-medium text-amber-800">
                    View: {capacityView === 'fixed' ? 'Fix Sell (Summer)' : 'Flexible Sell (inSeason)'}
                    <button onClick={() => setCapacityView('all')} className="hover:text-amber-600"><X size={12} /></button>
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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
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
                      {ticketTypeDistributionData.map((_, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={COLORS[index % COLORS.length]} 
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
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Award size={20} className="text-amber-500" />
              Top Customers
              <span className="text-xs font-normal text-gray-400 ml-2">
                (sorted by {sortColumn === 'value' ? 'Total Paid' : sortColumn === 'tickets' ? 'Tickets' : sortColumn === 'avgPerGame' ? 'Avg/Gm' : sortColumn === 'avgPerTxn' ? 'Avg/Txn' : sortColumn === 'avgAdvance' ? 'Avg Advance' : sortColumn === 'age' ? 'Age' : sortColumn.replace(/([A-Z])/g, ' $1').trim()})
              </span>
            </h3>
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-white z-10">
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-2 font-semibold text-gray-600 bg-white">#</th>
                    <th 
                      className="text-left py-2 px-2 font-semibold text-gray-600 cursor-pointer hover:bg-gray-50 select-none"
                      onClick={() => { setSortColumn('name'); setSortDirection(sortColumn === 'name' && sortDirection === 'asc' ? 'desc' : 'asc'); }}
                    >
                      <span className="flex items-center gap-1">Customer {sortColumn === 'name' && (sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}</span>
                    </th>
                    <th 
                      className="text-left py-2 px-2 font-semibold text-gray-600 cursor-pointer hover:bg-gray-50 select-none"
                      onClick={() => { setSortColumn('topSellType'); setSortDirection(sortColumn === 'topSellType' && sortDirection === 'asc' ? 'desc' : 'asc'); }}
                    >
                      <span className="flex items-center gap-1">Sell Type {sortColumn === 'topSellType' && (sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}</span>
                    </th>
                    <th 
                      className="text-center py-2 px-2 font-semibold text-gray-600 cursor-pointer hover:bg-gray-50 select-none"
                      onClick={() => { setSortColumn('tickets'); setSortDirection(sortColumn === 'tickets' && sortDirection === 'desc' ? 'asc' : 'desc'); }}
                    >
                      <span className="flex items-center justify-center gap-1">Tickets {sortColumn === 'tickets' && (sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}</span>
                    </th>
                    <th 
                      className="text-right py-2 px-2 font-semibold text-gray-600 cursor-pointer hover:bg-gray-50 select-none"
                      onClick={() => { setSortColumn('value'); setSortDirection(sortColumn === 'value' && sortDirection === 'desc' ? 'asc' : 'desc'); }}
                    >
                      <span className="flex items-center justify-end gap-1">Total Paid {sortColumn === 'value' && (sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}</span>
                    </th>
                    <th 
                      className="text-right py-2 px-2 font-semibold text-gray-600 cursor-pointer hover:bg-gray-50 select-none"
                      onClick={() => { setSortColumn('avgPerGame'); setSortDirection(sortColumn === 'avgPerGame' && sortDirection === 'desc' ? 'asc' : 'desc'); }}
                    >
                      <span className="flex items-center justify-end gap-1">Avg/Gm {sortColumn === 'avgPerGame' && (sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}</span>
                    </th>
                    <th 
                      className="text-right py-2 px-2 font-semibold text-gray-600 cursor-pointer hover:bg-gray-50 select-none"
                      onClick={() => { setSortColumn('avgPerTxn'); setSortDirection(sortColumn === 'avgPerTxn' && sortDirection === 'desc' ? 'asc' : 'desc'); }}
                    >
                      <span className="flex items-center justify-end gap-1">Avg/Txn {sortColumn === 'avgPerTxn' && (sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}</span>
                    </th>
                    <th 
                      className="text-left py-2 px-2 font-semibold text-gray-600 cursor-pointer hover:bg-gray-50 select-none"
                      onClick={() => { setSortColumn('principalZone'); setSortDirection(sortColumn === 'principalZone' && sortDirection === 'asc' ? 'desc' : 'asc'); }}
                    >
                      <span className="flex items-center gap-1">Principal Zone {sortColumn === 'principalZone' && (sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}</span>
                    </th>
                    <th 
                      className="text-left py-2 px-2 font-semibold text-gray-600 cursor-pointer hover:bg-gray-50 select-none"
                      onClick={() => { setSortColumn('secondaryZone'); setSortDirection(sortColumn === 'secondaryZone' && sortDirection === 'asc' ? 'desc' : 'asc'); }}
                    >
                      <span className="flex items-center gap-1">Secondary Zone {sortColumn === 'secondaryZone' && (sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}</span>
                    </th>
                    <th 
                      className="text-center py-2 px-2 font-semibold text-gray-600 cursor-pointer hover:bg-gray-50 select-none"
                      onClick={() => { setSortColumn('avgAdvance'); setSortDirection(sortColumn === 'avgAdvance' && sortDirection === 'desc' ? 'asc' : 'desc'); }}
                    >
                      <span className="flex items-center justify-center gap-1">Avg Advance {sortColumn === 'avgAdvance' && (sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}</span>
                    </th>
                    <th 
                      className="text-left py-2 px-2 font-semibold text-gray-600 cursor-pointer hover:bg-gray-50 select-none"
                      onClick={() => { setSortColumn('age'); setSortDirection(sortColumn === 'age' && sortDirection === 'desc' ? 'asc' : 'desc'); }}
                    >
                      <span className="flex items-center gap-1">Age {sortColumn === 'age' && (sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}</span>
                    </th>
                    <th 
                      className="text-left py-2 px-2 font-semibold text-gray-600 cursor-pointer hover:bg-gray-50 select-none"
                      onClick={() => { setSortColumn('location'); setSortDirection(sortColumn === 'location' && sortDirection === 'asc' ? 'desc' : 'asc'); }}
                    >
                      <span className="flex items-center gap-1">Location {sortColumn === 'location' && (sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[...stats.allCustomers].sort((a, b) => {
                    const getAgeNum = (dob: string) => {
                      if (!dob) return 0;
                      const parts = dob.split('/');
                      if (parts.length < 3) return 0;
                      const year = parseInt(parts[2], 10);
                      return isNaN(year) ? 0 : new Date().getFullYear() - year;
                    };
                    let aVal: any, bVal: any;
                    switch (sortColumn) {
                      case 'name': aVal = a.name?.toLowerCase() || ''; bVal = b.name?.toLowerCase() || ''; break;
                      case 'topSellType': aVal = a.topSellType?.toLowerCase() || ''; bVal = b.topSellType?.toLowerCase() || ''; break;
                      case 'tickets': aVal = a.tickets; bVal = b.tickets; break;
                      case 'value': aVal = a.value; bVal = b.value; break;
                      case 'avgPerGame': aVal = a.avgPerGame; bVal = b.avgPerGame; break;
                      case 'avgPerTxn': aVal = a.avgPerTxn; bVal = b.avgPerTxn; break;
                      case 'principalZone': aVal = a.principalZone?.toLowerCase() || ''; bVal = b.principalZone?.toLowerCase() || ''; break;
                      case 'secondaryZone': aVal = a.secondaryZone?.toLowerCase() || ''; bVal = b.secondaryZone?.toLowerCase() || ''; break;
                      case 'avgAdvance': aVal = a.avgAdvance ?? -1; bVal = b.avgAdvance ?? -1; break;
                      case 'age': aVal = getAgeNum(a.age); bVal = getAgeNum(b.age); break;
                      case 'location': aVal = a.location?.toLowerCase() || ''; bVal = b.location?.toLowerCase() || ''; break;
                      default: aVal = a.value; bVal = b.value;
                    }
                    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
                    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
                    return 0;
                  }).slice(0, 100).map((c, i) => {
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
                        <td className="py-2 px-2">
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">{c.topSellType}</span>
                        </td>
                        <td className="py-2 px-2 text-center text-gray-600">{c.tickets}</td>
                        <td className="py-2 px-2 text-right font-bold text-gray-900">{formatCompact(c.value)}</td>
                        <td className="py-2 px-2 text-right text-gray-600">{c.avgPerGame > 0 ? formatCompact(c.avgPerGame) : '-'}</td>
                        <td className="py-2 px-2 text-right text-gray-600">{c.avgPerTxn > 0 ? formatCompact(c.avgPerTxn) : '-'}</td>
                        <td className="py-2 px-2">
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">{c.principalZone}</span>
                        </td>
                        <td className="py-2 px-2">
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">{c.secondaryZone}</span>
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
                    <th className="text-center py-3 px-4 font-medium">Under 25</th>
                    <th className="text-center py-3 px-4 font-medium">25-44</th>
                    <th className="text-center py-3 px-4 font-medium">45-64</th>
                    <th className="text-center py-3 px-4 font-medium">65+</th>
                    <th className="text-right py-3 px-4 font-medium">Avg Price</th>
                    <th className="text-right py-3 px-4 font-medium">Avg Advance</th>
                    <th className="text-right py-3 px-4 font-medium">Top Location</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {Object.entries(stats.zoneByAge || {})
                    .sort((a, b) => Object.values(b[1]).reduce((s, v) => s + v, 0) - Object.values(a[1]).reduce((s, v) => s + v, 0))
                    .slice(0, 10)
                    .map(([zone, ages]) => {
                      const locations = (stats.zoneByLocation || {})[zone] || {};
                      const topLoc = Object.entries(locations).filter(([loc]) => loc !== 'Unknown').sort((a, b) => b[1] - a[1])[0];
                      const zoneTotal = Object.values(ages).reduce((s, v) => s + v, 0);
                      const zs = (stats.zoneStats || {})[zone];
                      const avgPrice = zs && zs.totalTickets > 0 ? zs.totalValue / zs.totalTickets : 0;
                      const ageGroups = ['Under 25', '25-44', '45-64', '65+'];
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
                    <th className="text-left py-3 px-4 font-medium">Principal Zone</th>
                    <th className="text-left py-3 px-4 font-medium">Secondary Zone</th>
                    <th className="text-right py-3 px-4 font-medium">Total Tickets</th>
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
                      <td className="py-3 px-4">
                        {c.principalZone !== '—' ? (
                          <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">{c.principalZone}</span>
                        ) : '—'}
                      </td>
                      <td className="py-3 px-4">
                        {c.secondaryZone !== '—' ? (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">{c.secondaryZone}</span>
                        ) : '—'}
                      </td>
                      <td className="py-3 px-4 text-right">{c.count}</td>
                      <td className="py-3 px-4 text-right font-bold text-green-600">{formatCurrency(c.value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeView === 'search' && (() => {
        const allClients = Object.entries(
          data.reduce((acc, r) => {
            const key = getCustomerKey(r);
            if (!acc[key]) acc[key] = {
              name: r.fullName || `${r.firstName} ${r.lastName}`.trim(),
              firstName: r.firstName,
              lastName: r.lastName,
              email: r.email,
              phone: r.phone,
              cell: r.cell,
              address: r.address,
              nationality: r.nationality,
              dob: r.dob,
              pob: r.pob,
              province: r.province,
              records: [] as CRMRecord[],
              payments: {} as Record<string, number>,
              leadDays: [] as number[]
            };
            acc[key].records.push(r);
            if (!acc[key].phone && r.phone) acc[key].phone = r.phone;
            if (!acc[key].cell && r.cell) acc[key].cell = r.cell;
            if (!acc[key].address && r.address) acc[key].address = r.address;
            if (!acc[key].nationality && r.nationality) acc[key].nationality = r.nationality;
            if (!acc[key].pob && r.pob) acc[key].pob = r.pob;
            const payment = (r.payment || '').toLowerCase().replace(/[^a-z]/g, '');
            if (payment) acc[key].payments[payment] = (acc[key].payments[payment] || 0) + (Number(r.quantity) || 1);
            if (r.buyTimestamp && r.gmDateTime) {
              const gameDate = r.gmDateTime > 1e11 ? r.gmDateTime : r.gmDateTime * 1000;
              const diff = Math.floor((gameDate - r.buyTimestamp.getTime()) / (1000 * 60 * 60 * 24));
              if (diff >= 0 && diff < 365) acc[key].leadDays.push(diff);
            }
            return acc;
          }, {} as Record<string, any>)
        ).map(([key, val]) => {
          const preferredPayment = Object.entries(val.payments).sort((a, b) => (b[1] as number) - (a[1] as number))[0]?.[0] || '—';
          const avgLeadDays = val.leadDays.length > 0 ? Math.round(val.leadDays.reduce((a: number, b: number) => a + b, 0) / val.leadDays.length) : null;
          let age: string | null = null;
          if (val.dob) {
            const parts = val.dob.split('/');
            if (parts.length >= 3) {
              const year = parseInt(parts[2], 10);
              if (!isNaN(year)) age = String(new Date().getFullYear() - year);
            }
          }
          return { key, ...val, preferredPayment, avgLeadDays, age };
        });

        const query = clientSearchQuery.toLowerCase().trim();
        const matchingClients = query.length >= 2 ? allClients.filter(c => {
          const searchStr = [
            c.name, c.firstName, c.lastName, c.email, c.phone, c.cell, c.address, c.nationality, c.dob, c.pob, c.province, c.age
          ].filter(Boolean).join(' ').toLowerCase();
          return searchStr.includes(query);
        }).slice(0, 20) : [];

        const selectedClient = searchSelectedClient ? allClients.find(c => c.key === searchSelectedClient) : null;
        const clientGames: string[] = selectedClient ? [...new Set(selectedClient.records.map((r: CRMRecord) => r.game || r.event).filter(Boolean))] as string[] : [];

        const getTicketRows = () => {
          if (!selectedClient) return [];
          let records = selectedClient.records as CRMRecord[];
          if (searchGameFilter !== 'all') {
            records = records.filter(r => (r.game || r.event) === searchGameFilter);
          }
          const subscriptionTypes = ['abbonamento', 'abb', 'mini'];
          const grouped: any[] = [];
          const subRecords = records.filter(r => {
            const sellType = (r.sellType || r.ticketType || '').toLowerCase();
            return subscriptionTypes.some(t => sellType.includes(t));
          });
          const otherRecords = records.filter(r => {
            const sellType = (r.sellType || r.ticketType || '').toLowerCase();
            return !subscriptionTypes.some(t => sellType.includes(t));
          });
          const subGroups: Record<string, CRMRecord[]> = {};
          subRecords.forEach(r => {
            const key = `${r.sellType || r.ticketType}|${r.pvZone || r.zone}`;
            if (!subGroups[key]) subGroups[key] = [];
            subGroups[key].push(r);
          });
          Object.entries(subGroups).forEach(([_key, recs]) => {
            const seats = [...new Set(recs.map(r => r.seat).filter(Boolean))];
            const totalValue = recs.reduce((sum, r) => sum + (Number(r.commercialValue) || 0), 0);
            const leadDays = recs.map(r => {
              if (r.buyTimestamp && r.gmDateTime) {
                const gameDate = r.gmDateTime > 1e11 ? r.gmDateTime : r.gmDateTime * 1000;
                return Math.floor((gameDate - r.buyTimestamp.getTime()) / (1000 * 60 * 60 * 24));
              }
              return null;
            }).filter(d => d !== null && d >= 0);
            const avgLead = leadDays.length > 0 ? Math.round(leadDays.reduce((a, b) => a! + b!, 0)! / leadDays.length) : null;
            grouped.push({
              isGrouped: true,
              zone: recs[0].pvZone || recs[0].zone || '—',
              seats: seats.join(', ') || '—',
              discountType: recs[0].discountType || '—',
              value: totalValue,
              leadDays: avgLead,
              sellType: recs[0].sellType || recs[0].ticketType || '—',
              giveawayType: recs[0].giveawayType || '',
              quantity: recs.length,
              game: 'Season Package'
            });
          });
          otherRecords.forEach(r => {
            let leadDays: number | null = null;
            if (r.buyTimestamp && r.gmDateTime) {
              const gameDate = r.gmDateTime > 1e11 ? r.gmDateTime : r.gmDateTime * 1000;
              leadDays = Math.floor((gameDate - r.buyTimestamp.getTime()) / (1000 * 60 * 60 * 24));
              if (leadDays < 0) leadDays = null;
            }
            grouped.push({
              isGrouped: false,
              zone: r.pvZone || r.zone || '—',
              seats: r.seat || '—',
              discountType: r.discountType || '—',
              value: Number(r.commercialValue) || 0,
              leadDays,
              sellType: r.sellType || r.ticketType || '—',
              giveawayType: r.giveawayType || '',
              quantity: Number(r.quantity) || 1,
              game: r.game || r.event || '—'
            });
          });
          return grouped;
        };

        return (
          <>
            <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Search size={20} className="text-red-500" />
                Client Search
              </h3>
              <div className="mb-6">
                <div className="relative max-w-xl">
                  <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name, email, phone, address, DOB, nationality..."
                    value={clientSearchQuery}
                    onChange={(e) => {
                      setClientSearchQuery(e.target.value);
                      if (e.target.value.length < 2) setSearchSelectedClient(null);
                    }}
                    className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    autoFocus
                  />
                  {clientSearchQuery && (
                    <button 
                      onClick={() => { setClientSearchQuery(''); setSearchSelectedClient(null); setSearchGameFilter('all'); }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-2">Enter at least 2 characters to find a client</p>
              </div>

              {query.length >= 2 && !selectedClient && (
                matchingClients.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Users size={48} className="mx-auto mb-4 opacity-30" />
                    <p>No clients found matching "{clientSearchQuery}"</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600 mb-3">{matchingClients.length} client{matchingClients.length !== 1 ? 's' : ''} found - click to view details</p>
                    {matchingClients.map(c => (
                      <div
                        key={c.key}
                        onClick={() => { setSearchSelectedClient(c.key); setSearchGameFilter('all'); }}
                        className="p-4 border border-gray-200 rounded-lg hover:border-red-300 hover:bg-red-50 cursor-pointer transition-colors"
                      >
                        <p className="font-semibold text-gray-800">{c.name}</p>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 mt-1">
                          {c.email && <span>{c.email}</span>}
                          {c.phone && <span>{c.phone}</span>}
                          {c.dob && <span>DOB: {c.dob}</span>}
                          {c.province && <span>{c.province}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}

              {selectedClient && (
                <div className="space-y-6">
                  <button
                    onClick={() => setSearchSelectedClient(null)}
                    className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
                  >
                    <ChevronLeft size={16} /> Back to search results
                  </button>

                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
                    <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <User size={20} className="text-red-500" />
                      Client Profile
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-xs text-gray-500 uppercase">Full Name</p>
                        <p className="font-medium">{selectedClient.name || '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase">Email</p>
                        <p className="font-medium">{selectedClient.email || '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase">Date of Birth</p>
                        <p className="font-medium">{selectedClient.dob || '—'}{selectedClient.age && ` (${selectedClient.age} yrs)`}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase">Place of Birth</p>
                        <p className="font-medium">{selectedClient.pob || selectedClient.province || '—'}</p>
                      </div>
                      <div className="md:col-span-2">
                        <p className="text-xs text-gray-500 uppercase">Address</p>
                        <p className="font-medium">{selectedClient.address || '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase">Nationality</p>
                        <p className="font-medium">{selectedClient.nationality || '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase">Phone</p>
                        <p className="font-medium">{selectedClient.phone || '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase">Cell</p>
                        <p className="font-medium">{selectedClient.cell || '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase">Preferred Payment</p>
                        <p className="font-medium capitalize">{selectedClient.preferredPayment}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase">Avg Days Before Game</p>
                        <p className="font-medium">{selectedClient.avgLeadDays !== null ? `${selectedClient.avgLeadDays} days` : '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase">Total Tickets</p>
                        <p className="font-medium">{selectedClient.records.length}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <Ticket size={20} className="text-blue-500" />
                        Ticket History
                      </h4>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">Filter by game:</span>
                        <select
                          value={searchGameFilter}
                          onChange={(e) => setSearchGameFilter(e.target.value)}
                          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5"
                        >
                          <option value="all">All Games</option>
                          {clientGames.map(g => (
                            <option key={g} value={g}>{g}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-200 bg-gray-50">
                            <th className="text-left py-2 px-2 font-semibold text-gray-600">Game</th>
                            <th className="text-left py-2 px-2 font-semibold text-gray-600">Zone</th>
                            <th className="text-left py-2 px-2 font-semibold text-gray-600">Seat(s)</th>
                            <th className="text-left py-2 px-2 font-semibold text-gray-600">Sell Type</th>
                            <th className="text-left py-2 px-2 font-semibold text-gray-600">Discount</th>
                            <th className="text-right py-2 px-2 font-semibold text-gray-600">Value</th>
                            <th className="text-center py-2 px-2 font-semibold text-gray-600">Days Before</th>
                            <th className="text-left py-2 px-2 font-semibold text-gray-600">Giveaway</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {getTicketRows().map((row, i) => (
                            <tr key={i} className={row.isGrouped ? 'bg-purple-50' : ''}>
                              <td className="py-2 px-2 text-xs">{row.game}</td>
                              <td className="py-2 px-2">
                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">{row.zone}</span>
                              </td>
                              <td className="py-2 px-2 text-xs max-w-24 truncate" title={row.seats}>{row.seats}</td>
                              <td className="py-2 px-2">
                                <span className={`px-2 py-0.5 rounded text-xs ${row.isGrouped ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                                  {row.sellType}{row.isGrouped ? ` (${row.quantity})` : ''}
                                </span>
                              </td>
                              <td className="py-2 px-2 text-xs text-gray-600">{row.discountType}</td>
                              <td className="py-2 px-2 text-right font-medium text-green-600">{formatCurrency(row.value)}</td>
                              <td className="py-2 px-2 text-center text-xs">{row.leadDays !== null ? row.leadDays : '—'}</td>
                              <td className="py-2 px-2 text-xs text-gray-600">{row.giveawayType || '—'}</td>
                            </tr>
                          ))}
                          {getTicketRows().length === 0 && (
                            <tr>
                              <td colSpan={8} className="py-8 text-center text-gray-400">No tickets found for this filter</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {query.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <Search size={48} className="mx-auto mb-4 opacity-30" />
                  <p>Start typing to find a client</p>
                  <p className="text-xs mt-2">Search by name, email, phone, DOB, address, or nationality</p>
                </div>
              )}

              {query.length > 0 && query.length < 2 && (
                <div className="text-center py-12 text-gray-400">
                  <Search size={48} className="mx-auto mb-4 opacity-30" />
                  <p>Type at least 2 characters to search</p>
                </div>
              )}
            </div>
          </>
        );
      })()}

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
