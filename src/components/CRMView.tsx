import React, { useState, useMemo } from 'react';
import { Users, Building2, Mail, MapPin, Ticket, TrendingUp, Search, X, Filter, BarChart3, PieChart, Euro, Award, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, User, Loader2, Calendar } from 'lucide-react';
import { CRMRecord, SponsorData } from '../types';
import { ZONE_OPPORTUNITY_COST } from '../constants';
import { MultiSelect } from './MultiSelect';
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

const toTitleCase = (str: string | undefined | null): string => {
  if (!str) return '';
  return str.trim().split(/\s+/).map(word => {
    if (word.length <= 2) return word.toUpperCase();
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }).join(' ');
};

interface CRMStats {
  totalRecords: number;
  totalTickets: number;
  totalRevenue: number;
  totalCommercialValue?: number;
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

interface GameInfo {
  id: string;
  opponent: string;
  date: string;
}

interface CRMViewProps {
  data: CRMRecord[];
  sponsorData?: SponsorData[];
  isLoading?: boolean;
  isLoadingSearch?: boolean; // True while full client data is loading for search
  serverStats?: { all: CRMStats; fixed: CRMStats; flexible: CRMStats } | null; // Pre-computed stats from server for fast loading
  games?: GameInfo[]; // Game schedule for seat history view
  viewMode?: 'total' | 'gameday'; // View mode from parent
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

// Helper to format seat location: combines area and seat number
const formatSeatLocation = (area: string, seat: string): string => {
  const cleanArea = (area || '').trim();
  const cleanSeatNum = (seat || '').trim();
  
  if (cleanArea && cleanSeatNum) {
    return `${cleanArea}-${cleanSeatNum}`;
  }
  if (cleanSeatNum) return cleanSeatNum;
  if (cleanArea) return cleanArea;
  return '—';
};

// Legacy helper for backwards compatibility with old seat format
const cleanSeat = (seat: string): string => {
  if (!seat) return '—';
  const postoMatch = seat.match(/Posto\s*(\d+)/i);
  if (postoMatch) return postoMatch[1];
  const numberMatch = seat.match(/\d+/);
  if (numberMatch) return numberMatch[0];
  return seat || '—';
};

export const CRMView: React.FC<CRMViewProps> = ({ data, sponsorData = [], isLoading = false, isLoadingSearch = false, serverStats = null, games = [], viewMode = 'total' }) => {
  const [selectedZones, setSelectedZones] = useState<string[]>(['All']);
  const [selectedGames, setSelectedGames] = useState<string[]>(['All']);
  const [selectedSellTypes, setSelectedSellTypes] = useState<string[]>(['All']);
  const [capacityView, setCapacityView] = useState<'all' | 'fixed' | 'flexible'>('all');
  const [activeView, setActiveView] = useState<'overview' | 'demographics' | 'behavior' | 'customers' | 'corporate' | 'giveaways' | 'search'>('overview');
  const [clientSearchQuery, setClientSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [searchSelectedClient, setSearchSelectedClient] = useState<string | null>(null);
  const [searchGameFilter, setSearchGameFilter] = useState<string>('all');
  const [searchMode, setSearchMode] = useState<'client' | 'seat'>('client');
  const [sortColumn, setSortColumn] = useState<string>('value');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedCorporate, setSelectedCorporate] = useState<string | null>(null);
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [selectedGiveawayRecipient, setSelectedGiveawayRecipient] = useState<string | null>(null);
  const [selectedGiveawayType, setSelectedGiveawayType] = useState<string | null>(null);

  const hasActiveFilter = !selectedZones.includes('All') || !selectedGames.includes('All') || !selectedSellTypes.includes('All') || capacityView !== 'all';

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
    setSelectedZones(['All']);
    setSelectedGames(['All']);
    setSelectedSellTypes(['All']);
    setCapacityView('all');
  };
  
  // Filter options from data
  const filterOptions = useMemo(() => {
    const zones = ['All', ...new Set(data.map(r => r.pvZone).filter(Boolean))].sort((a, b) => a === 'All' ? -1 : b === 'All' ? 1 : a.localeCompare(b));
    const sellTypes = ['All', ...new Set(data.map(r => r.sell || r.sellType).filter(Boolean))].sort((a, b) => a === 'All' ? -1 : b === 'All' ? 1 : a.localeCompare(b));
    const gamesList = [...new Set(data.map(r => r.game).filter(Boolean))];
    // Sort games by date (most recent first)
    const sortedGames = gamesList.sort((a, b) => {
      const getDate = (g: string) => {
        const match = g.match(/\d{2}\/\d{2}\/\d{4}/);
        if (match) {
          const [d, m, y] = match[0].split('/').map(Number);
          return new Date(y, m - 1, d).getTime();
        }
        return 0;
      };
      return getDate(b) - getDate(a);
    });
    return { zones, sellTypes, games: ['All', ...sortedGames] };
  }, [data]);

  const filteredData = useMemo(() => {
    let result = [...data];
    
    if (!selectedZones.includes('All')) {
      result = result.filter(r => selectedZones.includes(r.pvZone));
    }
    if (!selectedGames.includes('All')) {
      result = result.filter(r => selectedGames.includes(r.game));
    }
    if (!selectedSellTypes.includes('All')) {
      result = result.filter(r => selectedSellTypes.includes((r.sell || r.sellType || '').toUpperCase()));
    }
    if (capacityView !== 'all') {
      result = result.filter(r => getCapacityBucket(r) === capacityView);
    }
    
    return result;
  }, [data, selectedZones, selectedGames, selectedSellTypes, capacityView]);

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

  // Memoized seat history computation for seat search mode (must be at component level)
  const seatHistoryData = useMemo(() => {
    const query = clientSearchQuery.toLowerCase().trim();
    if (searchMode !== 'seat' || query.length < 2) return null;
    
    const parts = query.split(/[,\s]+/).map((p: string) => p.trim()).filter((p: string) => p);
    
    let seatNumber: string | null = null;
    let areaFromHyphen: string | null = null;
    let zoneParts: string[] = parts;
    
    const lastPart = parts[parts.length - 1];
    const hyphenMatch = lastPart.match(/^([a-z]+)-?(\d+)$/i);
    
    if (hyphenMatch) {
      areaFromHyphen = hyphenMatch[1].toLowerCase();
      seatNumber = hyphenMatch[2];
      zoneParts = parts.slice(0, -1);
    } else if (/^\d+$/.test(lastPart)) {
      seatNumber = lastPart;
      zoneParts = parts.slice(0, -1);
    }

    const matchingRecords = data.filter((r: any) => {
      const pvZone = ((r as any).pvZone || (r as any).pv_zone || (r as any).Pv_Zone || '').toLowerCase();
      const fullZone = ((r as any).zone || (r as any).Zone || '').toLowerCase();
      const area = ((r as any).area || (r as any).Area || '').toLowerCase();
      const seat = ((r as any).seat || (r as any).Seat || '').toString().trim();
      const combinedZone = `${pvZone} ${fullZone} ${area}`.toLowerCase();

      const allZonePartsMatch = zoneParts.length === 0 || zoneParts.every((p: string) => combinedZone.includes(p));
      const areaMatches = !areaFromHyphen || area === areaFromHyphen;
      const seatMatches = !seatNumber || seat === seatNumber;
      
      return allZonePartsMatch && areaMatches && seatMatches;
    });

    const firstMatch = matchingRecords[0] as any;
    const seatLocation = firstMatch ? {
      zone: (firstMatch.zone || firstMatch.Zone || firstMatch.pv_zone || ''),
      area: areaFromHyphen || (firstMatch.area || firstMatch.Area || ''),
      seat: seatNumber || 'All seats'
    } : null;

    const seatHistory = games.map(game => {
      const gameDate = game.date;
      
      const gameRecords = matchingRecords.filter((r: any) => {
        const recordDate = (r.Gm_Date_time || r.gm_date_time || '').split(' ')[0];
        if (recordDate && gameDate && recordDate === gameDate) return true;
        
        const recordGame = (r.gm || r.game || '').toLowerCase().trim();
        const gameOpp = game.opponent.toLowerCase().trim();
        if (recordGame && gameOpp) {
          return recordGame.includes(gameOpp) || gameOpp.includes(recordGame);
        }
        return false;
      });
      
      if (gameRecords.length > 0) {
        const rec = gameRecords[0] as any;
        return {
          date: game.date,
          opponent: game.opponent,
          occupied: true,
          occupant: `${rec.firstName || rec.name || ''} ${rec.lastName || rec.last_name || ''}`.trim() || 'Unknown',
          sellType: (rec.sell || rec.sellType || rec.type || '—').toUpperCase(),
          price: Number(rec.price) || Number(rec.comercial_value) || 0,
          email: rec.email || '—'
        };
      } else {
        return {
          date: game.date,
          opponent: game.opponent,
          occupied: false,
          occupant: '',
          sellType: '',
          price: 0,
          email: ''
        };
      }
    });

    return { seatLocation, seatHistory, matchingRecords };
  }, [searchMode, clientSearchQuery, data, games]);

  const stats = useMemo(() => {
    // Use server-computed stats when no complex filters (search, zone, event) are active
    // For capacity filter, we can use the pre-computed fixed/flexible stats from server
    const hasComplexFilter = !selectedZones.includes('All') || !selectedGames.includes('All') || !selectedSellTypes.includes('All');
    
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
        rawSellTypeBreakdown[s.type] = { count: s.tickets, revenue: s.revenue, value: s.commercialValue || s.revenue };
        // Group into ticket type categories - only valid sell types (ABB, TIX, CORP, MP, VB)
        const typeLower = (s.type || '').toLowerCase();
        let category: string | null = null;
        if (['mp', 'tix', 'vb'].includes(typeLower)) category = 'GameDay';
        else if (['corp', 'abb'].includes(typeLower)) category = 'Fixed';
        else if (['protocol', 'giveaway', 'giveaways'].includes(typeLower)) category = 'Giveaway';
        
        // Only add to grouped breakdown if it's a valid category
        if (category) {
          if (!groupedSellTypeBreakdown[category]) groupedSellTypeBreakdown[category] = { count: 0, revenue: 0, value: 0 };
          groupedSellTypeBreakdown[category].count += s.tickets;
          groupedSellTypeBreakdown[category].revenue += s.revenue;
          groupedSellTypeBreakdown[category].value += s.commercialValue || s.revenue;
        }
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
        totalCommercialValue: statsToUse.totalCommercialValue || statsToUse.totalRevenue || 0,
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
    const corporateRecords = filteredData.filter(r => (r.sell || r.sellType || '').toLowerCase() === 'corp' || (r.ticketType || '').toLowerCase() === 'corp');
    const uniqueCorps = new Set(corporateRecords.map(r => r.group).filter(Boolean));
    
    const totalRevenue = filteredData.reduce((sum, r) => sum + (r.price * r.quantity), 0);
    const totalCommercialValue = filteredData.reduce((sum, r) => sum + (r.commercialValue * r.quantity), 0);
    const corpCommercialValue = corporateRecords.reduce((sum, r) => sum + (r.commercialValue * r.quantity), 0);
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

      const rawSell = (r.sell || r.sellType || '').toLowerCase();
      const rawTicketType = (r.ticketType || '').toLowerCase();
      
      const normalizedSellType = (r.sell || r.sellType || r.ticketType || 'Unknown').toUpperCase();
      if (!rawSellTypeBreakdown[normalizedSellType]) rawSellTypeBreakdown[normalizedSellType] = { count: 0, revenue: 0, value: 0 };
      rawSellTypeBreakdown[normalizedSellType].count += r.quantity;
      rawSellTypeBreakdown[normalizedSellType].revenue += r.price;
      rawSellTypeBreakdown[normalizedSellType].value += r.commercialValue;
      
      // Only categorize valid sell types (ABB, TIX, CORP, MP, VB) into ticket type groups
      let sellCategory: string | null = null;
      if (['mp', 'tix', 'vb'].includes(rawSell) || ['mp', 'tix', 'vb'].includes(rawTicketType)) {
        sellCategory = 'GameDay';
      } else if (['corp', 'abb'].includes(rawSell) || ['corp', 'abb'].includes(rawTicketType)) {
        sellCategory = 'Fixed';
      } else if (['protocol', 'giveaway', 'giveaways'].includes(rawSell) || ['protocol', 'giveaway', 'giveaways'].includes(rawTicketType)) {
        sellCategory = 'Giveaway';
      }
      // Only add to grouped breakdown if valid category
      if (sellCategory) {
        if (!groupedSellTypeBreakdown[sellCategory]) groupedSellTypeBreakdown[sellCategory] = { count: 0, revenue: 0, value: 0 };
        groupedSellTypeBreakdown[sellCategory].count += r.quantity;
        groupedSellTypeBreakdown[sellCategory].revenue += r.price;
        groupedSellTypeBreakdown[sellCategory].value += r.commercialValue;
      }

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

      const isCorp = (r.sell || r.sellType || '').toLowerCase() === 'corp' || (r.ticketType || '').toLowerCase() === 'corp';
      if (isCorp) {
        const corpKey = r.group || r.fullName || 'Unknown';
        if (!corpBreakdown[corpKey]) corpBreakdown[corpKey] = { count: 0, revenue: 0, value: 0, zones: {} as Record<string, number> };
        corpBreakdown[corpKey].count += r.quantity;
        corpBreakdown[corpKey].revenue += r.price * r.quantity;
        corpBreakdown[corpKey].value += r.commercialValue * r.quantity;
        const zone = r.pvZone || r.zone || 'Unknown';
        corpBreakdown[corpKey].zones[zone] = (corpBreakdown[corpKey].zones[zone] || 0) + (Number(r.quantity) || 1);
      }
    });

    const isFilteringByAbbOrCorp = !selectedSellTypes.includes('All') && 
      (selectedSellTypes.includes('ABB') || selectedSellTypes.includes('CORP'));
    
    const customerData = isFilteringByAbbOrCorp 
      ? filteredData.filter(r => {
          const sellLower = (r.sell || r.sellType || '').toLowerCase();
          const ticketLower = (r.ticketType || '').toLowerCase();
          const isGiveaway = ['protocol', 'giveaway', 'giveaways'].includes(sellLower) || ['protocol', 'giveaway', 'giveaways'].includes(ticketLower);
          return !isGiveaway;
        })
      : filteredData.filter(r => {
          const sellLower = (r.sell || r.sellType || '').toLowerCase();
          const ticketLower = (r.ticketType || '').toLowerCase();
          const isCorp = sellLower === 'corp' || ticketLower === 'corp';
          const isAbb = sellLower === 'abb' || ticketLower === 'abb';
          const isGiveaway = ['protocol', 'giveaway', 'giveaways'].includes(sellLower) || ['protocol', 'giveaway', 'giveaways'].includes(ticketLower);
          return !isCorp && !isAbb && !isGiveaway;
        });

    // Build customer profile lookup from ALL data (not filtered) to preserve names, company, etc.
    const customerProfileLookup: Record<string, { name: string; email: string; company: string; age: string; location: string }> = {};
    data.forEach(r => {
      const key = getCustomerKey(r);
      if (!customerProfileLookup[key]) {
        customerProfileLookup[key] = {
          name: toTitleCase(`${r.firstName || ''} ${r.lastName || ''}`.trim() || r.fullName),
          email: r.email || '',
          company: toTitleCase(r.group || ''),
          age: r.dob || '',
          location: toTitleCase(r.province || r.pob || '')
        };
      } else {
        // Update with non-empty values if current is empty
        if (!customerProfileLookup[key].name && (r.firstName || r.lastName || r.fullName)) {
          customerProfileLookup[key].name = toTitleCase(`${r.firstName || ''} ${r.lastName || ''}`.trim() || r.fullName);
        }
        if (!customerProfileLookup[key].email && r.email) {
          customerProfileLookup[key].email = r.email;
        }
        if (!customerProfileLookup[key].company && r.group) {
          customerProfileLookup[key].company = toTitleCase(r.group);
        }
        if (!customerProfileLookup[key].age && r.dob) {
          customerProfileLookup[key].age = r.dob;
        }
        if (!customerProfileLookup[key].location && (r.province || r.pob)) {
          customerProfileLookup[key].location = toTitleCase(r.province || r.pob || '');
        }
      }
    });

    const allCustomers = Object.entries(
      customerData.reduce((acc, r) => {
        const key = getCustomerKey(r);
        const profile = customerProfileLookup[key] || { name: '', email: '', company: '', age: '', location: '' };
        if (!acc[key]) acc[key] = { 
          name: profile.name || toTitleCase(`${r.firstName || ''} ${r.lastName || ''}`.trim() || r.fullName), 
          email: profile.email || r.email, 
          company: profile.company || toTitleCase(r.group || ''),
          tickets: 0, 
          revenue: 0, 
          value: 0,
          zones: {} as Record<string, number>,
          sellTypes: {} as Record<string, number>,
          games: new Set<string>(),
          transactions: 0,
          age: profile.age || r.dob || '',
          location: profile.location || toTitleCase(r.province || r.pob || ''),
          advanceDays: [] as number[]
        };
        const sellType = r.sell || r.sellType || r.ticketType || 'Unknown';
        acc[key].sellTypes[sellType] = (acc[key].sellTypes[sellType] || 0) + (Number(r.quantity) || 1);
        acc[key].tickets += Number(r.quantity) || 1;
        acc[key].revenue += Number(r.price) || 0;
        acc[key].value += Number(r.commercialValue) || 0;
        acc[key].transactions += 1;
        const zone = r.pvZone || r.zone || 'Unknown';
        acc[key].zones[zone] = (acc[key].zones[zone] || 0) + (Number(r.quantity) || 1);
        if (r.gm || r.game || r.event) acc[key].games.add(r.gm || r.game || r.event);
        
        const buyTs = r.buyTimestamp && r.buyTimestamp instanceof Date && !isNaN(r.buyTimestamp.getTime()) ? r.buyTimestamp : null;
        if (buyTs && r.gmDateTime && r.gmDateTime > 0) {
          const gameDate = new Date(r.gmDateTime);
          if (!isNaN(gameDate.getTime())) {
            const diffDays = Math.floor((gameDate.getTime() - buyTs.getTime()) / (1000 * 60 * 60 * 24));
            if (diffDays >= 0) acc[key].advanceDays.push(diffDays);
          }
        }
        return acc;
      }, {} as Record<string, { name: string; email: string; company: string; tickets: number; revenue: number; value: number; zones: Record<string, number>; sellTypes: Record<string, number>; games: Set<string>; transactions: number; age: string; location: string; advanceDays: number[] }>)
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

      // Use only province for location (not pob which is place of birth - could be international)
      // Check multiple possible field names
      const location = r.province || (r as any).provincia || '';
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

  // Sales Channel: Only show the 5 valid sell types from "Sell" column
  const VALID_SALES_CHANNELS = ['ABB', 'TIX', 'CORP', 'MP', 'VB'];
  const salesChannelChartData = useMemo(() => 
    Object.entries(stats.rawSellTypeBreakdown || {})
      .filter(([name]) => VALID_SALES_CHANNELS.includes(name.toUpperCase()))
      .map(([name, val]: [string, any]) => ({ name: name.toUpperCase(), tickets: val.count, value: val.value }))
      .sort((a, b) => b.value - a.value),
  [stats.rawSellTypeBreakdown]);

  // Ticket Type: Only show Fixed, GameDay, Giveaway
  const VALID_TICKET_TYPES = ['Fixed', 'GameDay', 'Giveaway'];
  const ticketTypeDistributionData = useMemo(() => 
    Object.entries(stats.groupedSellTypeBreakdown || {})
      .filter(([name]) => VALID_TICKET_TYPES.includes(name))
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
      name: toTitleCase(`${first.firstName || ''} ${first.lastName || ''}`.trim() || first.fullName),
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

      {/* Filter Row */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div><MultiSelect label="Game" options={filterOptions.games} selected={selectedGames} onChange={setSelectedGames} /></div>
        <div><MultiSelect label="Zone" options={filterOptions.zones} selected={selectedZones} onChange={setSelectedZones} /></div>
        {hasActiveFilter && (
          <div className="flex items-end">
            <button onClick={clearAllFilters} className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-800 underline">
              Clear All Filters
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {['overview', 'demographics', 'behavior', 'corporate', 'giveaways', 'search'].map(view => (
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
            {view === 'giveaways' && <Award size={14} className="inline mr-2" />}
            {view === 'search' && <Search size={14} className="inline mr-2" />}
            {view === 'search' ? 'Find Customer' : view.charAt(0).toUpperCase() + view.slice(1)}
          </button>
        ))}
      </div>

      {hasActiveFilter && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 shadow-sm">
          <p className="text-xs text-amber-600">
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
                {!selectedSellTypes.includes('All') && (
                  <span className="text-xs font-normal text-green-600 ml-2">
                    (Filtered: {selectedSellTypes.join(', ')})
                    <button onClick={() => setSelectedSellTypes(['All'])} className="ml-2 text-red-500 hover:text-red-700">✕</button>
                  </span>
                )}
              </h3>
              <p className="text-xs text-gray-400 mb-2">Click a bar to filter by that channel</p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={salesChannelChartData} style={{ cursor: 'pointer' }}>
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
                      onClick={(data: any) => {
                        if (data?.name) {
                          setSelectedSellTypes(prev => 
                            prev.includes(data.name) && !prev.includes('All') 
                              ? ['All'] 
                              : [data.name]
                          );
                        }
                      }}
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
                      onClick={() => { setSortColumn('company'); setSortDirection(sortColumn === 'company' && sortDirection === 'asc' ? 'desc' : 'asc'); }}
                    >
                      <span className="flex items-center gap-1">Company {sortColumn === 'company' && (sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}</span>
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
                      case 'company': aVal = ((a as any).company || '').toLowerCase(); bVal = ((b as any).company || '').toLowerCase(); break;
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
                        <td className="py-2 px-2 text-gray-600 text-xs">
                          {(c as any).company || '-'}
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
          {selectedCorporate ? (() => {
            // Corporate detail view - show tickets and games for selected corporation
            // Corporate records are identified by sellType or ticketType being 'corp'
            // and matched by group (with title case, matching server logic)
            const selectedNormalized = normalizeCompanyName(selectedCorporate);
            const corpRecords = filteredData.filter(r => {
              const isCorp = (r.sell || r.sellType || '').toLowerCase() === 'corp' || (r.ticketType || '').toLowerCase() === 'corp';
              if (!isCorp) return false;
              // Match using title case (same as server) or normalized comparison
              const rawGroup = r.group || r.fullName || 'Unknown';
              const titleCaseGroup = toTitleCase(rawGroup);
              return titleCaseGroup === selectedCorporate || normalizeCompanyName(rawGroup) === selectedNormalized;
            });
            const corpInfo = stats.topCorps.find(c => c.name === selectedCorporate);
            
            // Group by game (using GM column, not Event)
            const gameBreakdown = corpRecords.reduce((acc, r) => {
              const gameKey = r.gm || r.game || r.event || 'Unknown Game';
              if (!acc[gameKey]) {
                acc[gameKey] = { tickets: 0, value: 0, seats: [] as string[], zones: new Set<string>() };
              }
              acc[gameKey].tickets += r.quantity || 1;
              acc[gameKey].value += r.commercialValue * (r.quantity || 1);
              if (r.area || r.seat) {
                acc[gameKey].seats.push(formatSeatLocation(r.area || '', r.seat || ''));
              }
              if (r.zone || r.pvZone) acc[gameKey].zones.add(r.pvZone || r.zone);
              return acc;
            }, {} as Record<string, { tickets: number; value: number; seats: string[]; zones: Set<string> }>);
            
            const gameList = Object.entries(gameBreakdown)
              .map(([event, data]) => ({ event, ...data, zones: Array.from(data.zones) }))
              .sort((a, b) => b.tickets - a.tickets);
            
            // Get tickets for selected game (third level drill-down)
            const gameTickets = selectedGame 
              ? corpRecords.filter(r => (r.gm || r.game || r.event || 'Unknown Game') === selectedGame)
              : [];
            
            // Third level: Individual tickets for selected game
            if (selectedGame) {
              return (
                <>
                  {/* Breadcrumb navigation */}
                  <div className="flex items-center gap-2 mb-4 text-sm">
                    <button 
                      onClick={() => { setSelectedCorporate(null); setSelectedGame(null); }}
                      className="text-amber-600 hover:text-amber-800 hover:underline"
                    >
                      Corporate List
                    </button>
                    <ChevronRight size={16} className="text-gray-400" />
                    <button 
                      onClick={() => setSelectedGame(null)}
                      className="text-amber-600 hover:text-amber-800 hover:underline"
                    >
                      {selectedCorporate}
                    </button>
                    <ChevronRight size={16} className="text-gray-400" />
                    <span className="text-gray-600 font-medium">{selectedGame}</span>
                  </div>
                  
                  {/* Game header */}
                  <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl p-6 text-white shadow-lg mb-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <Calendar size={28} />
                          <div>
                            <h2 className="text-2xl font-bold">{selectedGame}</h2>
                            <p className="text-blue-200 text-sm mt-1">{selectedCorporate}</p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-bold">{gameTickets.length}</p>
                        <p className="text-blue-100 text-sm">Tickets</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-white/20">
                      <div>
                        <p className="text-2xl font-bold">{formatCurrency(gameTickets.reduce((sum, t) => sum + (t.commercialValue * (t.quantity || 1)), 0))}</p>
                        <p className="text-blue-100 text-sm">Total Value</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{new Set(gameTickets.map(t => t.pvZone || t.zone)).size}</p>
                        <p className="text-blue-100 text-sm">Zones</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{formatCurrency(gameTickets.reduce((sum, t) => sum + (t.commercialValue * (t.quantity || 1)), 0) / (gameTickets.length || 1))}</p>
                        <p className="text-blue-100 text-sm">Avg Value/Ticket</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Individual tickets table */}
                  <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-gray-100">
                      <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                        <Ticket size={18} className="text-blue-500" />
                        Individual Tickets ({gameTickets.length})
                      </h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-gray-600">
                          <tr>
                            <th className="text-left py-3 px-4 font-medium">#</th>
                            <th className="text-left py-3 px-4 font-medium">Name</th>
                            <th className="text-left py-3 px-4 font-medium">Zone</th>
                            <th className="text-left py-3 px-4 font-medium">Area</th>
                            <th className="text-left py-3 px-4 font-medium">Seat</th>
                            <th className="text-center py-3 px-4 font-medium">Age</th>
                            <th className="text-left py-3 px-4 font-medium">Province</th>
                            <th className="text-right py-3 px-4 font-medium">Commercial Value</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {gameTickets.map((t, i) => (
                            <tr key={i} className="hover:bg-gray-50">
                              <td className="py-3 px-4 text-gray-400">{i + 1}</td>
                              <td className="py-3 px-4 font-medium text-gray-800">{t.fullName || t.lastName || '—'}</td>
                              <td className="py-3 px-4">
                                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">
                                  {t.pvZone || t.zone || '—'}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-gray-600">{t.area || '—'}</td>
                              <td className="py-3 px-4 text-gray-600">{t.seat || '—'}</td>
                              <td className="py-3 px-4 text-center text-gray-600">{t.age || '—'}</td>
                              <td className="py-3 px-4 text-gray-600">{t.province || '—'}</td>
                              <td className="py-3 px-4 text-right font-bold text-green-600">{formatCurrency(t.commercialValue * (t.quantity || 1))}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              );
            }
            
            // Second level: Games list for selected corporation
            return (
              <>
                {/* Back button and header */}
                <div className="flex items-center gap-4 mb-4">
                  <button 
                    onClick={() => setSelectedCorporate(null)}
                    className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <ChevronLeft size={20} />
                    <span>Back to List</span>
                  </button>
                </div>
                
                {/* Corporation header */}
                <div className="bg-gradient-to-br from-amber-600 to-amber-800 rounded-xl p-6 text-white shadow-lg mb-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <Building2 size={28} />
                        <h2 className="text-2xl font-bold">{selectedCorporate}</h2>
                      </div>
                      <div className="flex flex-wrap gap-4 text-amber-100 text-sm mt-3">
                        {corpInfo?.principalZone && corpInfo.principalZone !== '—' && (
                          <span className="px-2 py-1 bg-white/20 rounded">Principal: {corpInfo.principalZone}</span>
                        )}
                        {corpInfo?.secondaryZone && corpInfo.secondaryZone !== '—' && (
                          <span className="px-2 py-1 bg-white/20 rounded">Secondary: {corpInfo.secondaryZone}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold">{corpRecords.length}</p>
                      <p className="text-amber-100 text-sm">Total Tickets</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-white/20">
                    <div>
                      <p className="text-2xl font-bold">{formatCurrency(corpInfo?.value || 0)}</p>
                      <p className="text-amber-100 text-sm">Commercial Value</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{gameList.length}</p>
                      <p className="text-amber-100 text-sm">Games Attended</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{formatCurrency((corpInfo?.value || 0) / (corpRecords.length || 1))}</p>
                      <p className="text-amber-100 text-sm">Avg Value/Ticket</p>
                    </div>
                  </div>
                </div>
                
                {/* Games table */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-gray-100">
                    <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                      <Calendar size={18} className="text-amber-500" />
                      Games ({gameList.length})
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">Click on a game to view individual tickets</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 text-gray-600">
                        <tr>
                          <th className="text-left py-3 px-4 font-medium">Game</th>
                          <th className="text-left py-3 px-4 font-medium">Zones</th>
                          <th className="text-right py-3 px-4 font-medium">Tickets</th>
                          <th className="text-right py-3 px-4 font-medium">Value</th>
                          <th className="text-left py-3 px-4 font-medium">Seats</th>
                          <th className="w-8"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {gameList.map((g, i) => (
                          <tr 
                            key={i} 
                            className="hover:bg-amber-50 cursor-pointer transition-colors"
                            onClick={() => setSelectedGame(g.event)}
                          >
                            <td className="py-3 px-4 font-medium text-gray-800">{g.event}</td>
                            <td className="py-3 px-4">
                              <div className="flex flex-wrap gap-1">
                                {g.zones.slice(0, 3).map(z => (
                                  <span key={z} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">{z}</span>
                                ))}
                                {g.zones.length > 3 && (
                                  <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-xs">+{g.zones.length - 3}</span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-right font-medium">{g.tickets}</td>
                            <td className="py-3 px-4 text-right font-bold text-green-600">{formatCurrency(g.value)}</td>
                            <td className="py-3 px-4">
                              <div className="flex flex-wrap gap-1 max-w-xs">
                                {g.seats.slice(0, 5).map((s, si) => (
                                  <span key={si} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">{s}</span>
                                ))}
                                {g.seats.length > 5 && (
                                  <span className="px-1.5 py-0.5 bg-gray-200 text-gray-500 rounded text-xs">+{g.seats.length - 5}</span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-gray-400">
                              <ChevronRight size={16} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            );
          })() : (
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
                  <p className="text-xs text-gray-500 mt-1">Click on a company to view ticket and game details</p>
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
                        <tr key={c.name} className="hover:bg-amber-50 cursor-pointer transition-colors" onClick={() => {
                          setSelectedCorporate(c.name);
                        }}>
                          <td className="py-3 px-4">
                            <span className="w-6 h-6 bg-amber-600 text-white rounded-full flex items-center justify-center text-xs font-bold">{i + 1}</span>
                          </td>
                          <td className="py-3 px-4 font-medium text-gray-800 flex items-center gap-2">
                            {c.name}
                            <ChevronRight size={16} className="text-gray-400" />
                          </td>
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
        </>
      )}

      {activeView === 'giveaways' && (() => {
        // Filter giveaway records based on capacityView toggle:
        // - "all": Sell = "Giveaway" OR "Protocol" (total should be 2175)
        // - "fixed": Sell = "Protocol" only
        // - "flexible": Sell = "Giveaway" only
        const giveawayRecords = filteredData.filter(r => {
          const sellLower = (r.sellType || '').toLowerCase().trim();
          const isGiveaway = sellLower === 'giveaway' || sellLower === 'giveaways';
          const isProtocol = sellLower === 'protocol';
          
          if (capacityView === 'all') {
            return isGiveaway || isProtocol;
          } else if (capacityView === 'fixed') {
            return isProtocol;
          } else { // flexible
            return isGiveaway;
          }
        });

        // Helper to get opportunity cost for a ticket based on zone's hardcoded ABB price
        const getOpportunityCost = (r: CRMRecord) => {
          const zone = (r.pvZone || r.zone || '').toUpperCase().trim();
          const cost = ZONE_OPPORTUNITY_COST[zone] || 0;
          return cost * (r.quantity || 1);
        };

        // Group by giveaway type (only use giveawayType column, removing GA suffix)
        // Use opportunity cost based on zone average prices
        // Helper to normalize giveaway type names
        const normalizeGiveawayType = (gType: string): string => {
          let type = (gType || '').replace(/\s*GA$/i, '').trim();
          // Normalize "Agent/Sponsor" to just "Agent"
          if (type.toLowerCase().includes('agent/sponsor') || type.toLowerCase() === 'agent/sponsor') {
            type = 'Agent';
          }
          return toTitleCase(type) || 'Unknown';
        };

        const giveawayTypeBreakdown = giveawayRecords.reduce((acc, r) => {
          // Only use actual giveawayType column values - don't infer types
          if (!r.giveawayType || r.giveawayType.trim() === '') {
            return acc; // Skip records without a giveawayType
          }
          const type = normalizeGiveawayType(r.giveawayType);
          if (!acc[type]) {
            acc[type] = { tickets: 0, value: 0, recipients: new Set<string>() };
          }
          acc[type].tickets += r.quantity || 1;
          // Opportunity cost = zone average price for the season
          acc[type].value += getOpportunityCost(r);
          const recipientKey = toTitleCase(`${r.firstName || ''} ${r.lastName || ''}`.trim() || r.fullName) || r.email || 'Unknown';
          acc[type].recipients.add(recipientKey);
          return acc;
        }, {} as Record<string, { tickets: number; value: 0, recipients: Set<string> }>);

        const typeList = Object.entries(giveawayTypeBreakdown)
          .map(([type, data]) => ({ type, ...data, recipientCount: data.recipients.size }))
          .sort((a, b) => b.tickets - a.tickets);

        // Group by recipient
        const recipientBreakdown = giveawayRecords.reduce((acc, r) => {
          const name = toTitleCase(`${r.firstName || ''} ${r.lastName || ''}`.trim() || r.fullName) || 'Unknown';
          if (!acc[name]) {
            acc[name] = { 
              tickets: 0, 
              value: 0, 
              types: new Set<string>(), 
              games: new Set<string>(),
              zones: new Set<string>(),
              email: r.email,
              company: toTitleCase(r.group || ''),
              age: r.age,
              location: toTitleCase(r.city || r.location)
            };
          }
          acc[name].tickets += r.quantity || 1;
          // Opportunity cost = zone average price for the season
          acc[name].value += getOpportunityCost(r);
          // Add giveaway type - only use actual giveawayType column values
          if (r.giveawayType && r.giveawayType.trim() !== '') {
            const gType = normalizeGiveawayType(r.giveawayType);
            if (gType && gType !== 'Unknown') acc[name].types.add(gType);
          }
          // Capture age, location, and company from records that have them
          if (r.age && r.age.trim() !== '' && !acc[name].age) acc[name].age = r.age;
          if ((r.city || r.location) && !acc[name].location) acc[name].location = r.city || r.location;
          if (r.group && !acc[name].company) acc[name].company = toTitleCase(r.group);
          if (r.gm || r.game || r.event) acc[name].games.add(r.gm || r.game || r.event);
          if (r.pvZone || r.zone) acc[name].zones.add(r.pvZone || r.zone);
          if (!acc[name].email && r.email) acc[name].email = r.email;
          return acc;
        }, {} as Record<string, { tickets: number; value: number; types: Set<string>; games: Set<string>; zones: Set<string>; email?: string; company?: string; age?: string; location?: string }>);

        const recipientList = Object.entries(recipientBreakdown)
          .map(([name, data]) => ({ 
            name, 
            ...data, 
            types: Array.from(data.types), 
            games: Array.from(data.games),
            zones: Array.from(data.zones)
          }))
          .sort((a, b) => b.tickets - a.tickets);

        const totalGiveawayTickets = giveawayRecords.reduce((sum, r) => sum + (r.quantity || 1), 0);
        // Opportunity cost = zone average price for the season
        const totalGiveawayValue = giveawayRecords.reduce((sum, r) => sum + getOpportunityCost(r), 0);

        return (
          <>
            {/* Summary stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-xl p-5 text-white shadow-lg">
                <Award size={24} className="mb-3 opacity-80" />
                <p className="text-3xl font-bold">{totalGiveawayTickets.toLocaleString()}</p>
                <p className="text-purple-100 text-sm">Total Giveaway Tickets</p>
              </div>
              <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-xl p-5 text-white shadow-lg">
                <Euro size={24} className="mb-3 opacity-80" />
                <p className="text-3xl font-bold">{formatCompact(totalGiveawayValue)}</p>
                <p className="text-indigo-100 text-sm">Opportunity Cost</p>
              </div>
              <div className="bg-gradient-to-br from-slate-600 to-slate-800 rounded-xl p-5 text-white shadow-lg">
                <Users size={24} className="mb-3 opacity-80" />
                <p className="text-3xl font-bold">{recipientList.length.toLocaleString()}</p>
                <p className="text-slate-200 text-sm">Recipients</p>
              </div>
              <div className="bg-gradient-to-br from-pink-600 to-pink-800 rounded-xl p-5 text-white shadow-lg">
                <Ticket size={24} className="mb-3 opacity-80" />
                <p className="text-3xl font-bold">{typeList.length}</p>
                <p className="text-pink-100 text-sm">Giveaway Types</p>
              </div>
            </div>

            {/* Show recipient detail view if selected */}
            {selectedGiveawayRecipient ? (() => {
              const recipientData = recipientList.find(r => r.name === selectedGiveawayRecipient);
              const recipientTickets = giveawayRecords.filter(r => {
                const name = toTitleCase(`${r.firstName || ''} ${r.lastName || ''}`.trim() || r.fullName) || 'Unknown';
                return name === selectedGiveawayRecipient;
              });
              
              return (
                <>
                  {/* Breadcrumb navigation */}
                  <div className="flex items-center gap-2 mb-4 text-sm">
                    <button 
                      onClick={() => setSelectedGiveawayRecipient(null)}
                      className="text-purple-600 hover:text-purple-800 hover:underline"
                    >
                      Giveaway Recipients
                    </button>
                    <ChevronRight size={16} className="text-gray-400" />
                    <span className="text-gray-600 font-medium">{selectedGiveawayRecipient}</span>
                  </div>
                  
                  {/* Recipient header */}
                  <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-xl p-6 text-white shadow-lg mb-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <User size={28} />
                          <div>
                            <h2 className="text-2xl font-bold">{selectedGiveawayRecipient}</h2>
                            {recipientData?.location && (
                              <p className="text-purple-200 text-sm mt-1">{recipientData.location}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-3">
                          {recipientData?.types.map(t => (
                            <span key={t} className="px-2 py-1 bg-white/20 rounded text-sm">{t}</span>
                          ))}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-bold">{recipientTickets.length}</p>
                        <p className="text-purple-100 text-sm">Total Tickets</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-white/20">
                      <div>
                        <p className="text-2xl font-bold">{formatCurrency(recipientData?.value || 0)}</p>
                        <p className="text-purple-100 text-sm">Opportunity Cost</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{recipientData?.games.length || 0}</p>
                        <p className="text-purple-100 text-sm">Games</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{recipientData?.zones.length || 0}</p>
                        <p className="text-purple-100 text-sm">Zones</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{recipientData?.age || '—'}</p>
                        <p className="text-purple-100 text-sm">Age</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Individual tickets table */}
                  <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-gray-100">
                      <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                        <Ticket size={18} className="text-purple-500" />
                        Individual Tickets ({recipientTickets.length})
                      </h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-gray-600">
                          <tr>
                            <th className="text-left py-3 px-4 font-medium">#</th>
                            <th className="text-left py-3 px-4 font-medium">Game</th>
                            <th className="text-left py-3 px-4 font-medium">Giveaway Type</th>
                            <th className="text-left py-3 px-4 font-medium">Zone</th>
                            <th className="text-left py-3 px-4 font-medium">Area</th>
                            <th className="text-left py-3 px-4 font-medium">Seat</th>
                            <th className="text-right py-3 px-4 font-medium">Opportunity Cost</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {recipientTickets.map((t, i) => {
                            // Determine giveaway type - use giveawayType if available, otherwise infer from sellType
                            let gType: string;
                            if (t.giveawayType && t.giveawayType.trim() !== '') {
                              gType = normalizeGiveawayType(t.giveawayType);
                            } else {
                              const sellLower = (t.sellType || '').toLowerCase().trim();
                              if (sellLower === 'protocol') {
                                gType = 'Protocol';
                              } else if (sellLower === 'giveaway' || sellLower === 'giveaways') {
                                gType = 'Giveaway';
                              } else {
                                gType = 'Other';
                              }
                            }
                            return (
                              <tr key={i} className="hover:bg-gray-50">
                                <td className="py-3 px-4 text-gray-400">{i + 1}</td>
                                <td className="py-3 px-4 font-medium text-gray-800">{t.gm || t.game || t.event || '—'}</td>
                                <td className="py-3 px-4">
                                  <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded text-xs">
                                    {gType || t.giveawayType || '—'}
                                  </span>
                                </td>
                                <td className="py-3 px-4">
                                  <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">
                                    {t.pvZone || t.zone || '—'}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-gray-600">{t.area || '—'}</td>
                                <td className="py-3 px-4 text-gray-600">{t.seat || '—'}</td>
                                <td className="py-3 px-4 text-right font-bold text-green-600">{formatCurrency(getOpportunityCost(t))}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              );
            })() : selectedGiveawayType ? (() => {
              // Show recipients filtered by type
              const filteredByType = recipientList.filter(r => r.types.includes(selectedGiveawayType));
              const typeData = typeList.find(t => t.type === selectedGiveawayType);
              
              return (
                <>
                  {/* Breadcrumb navigation */}
                  <div className="flex items-center gap-2 mb-4 text-sm">
                    <button 
                      onClick={() => setSelectedGiveawayType(null)}
                      className="text-purple-600 hover:text-purple-800 hover:underline"
                    >
                      Giveaway Types
                    </button>
                    <ChevronRight size={16} className="text-gray-400" />
                    <span className="text-gray-600 font-medium">{selectedGiveawayType}</span>
                  </div>
                  
                  {/* Type header */}
                  <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-xl p-6 text-white shadow-lg mb-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h2 className="text-2xl font-bold">{selectedGiveawayType}</h2>
                        <p className="text-purple-200 text-sm mt-1">Giveaway Type</p>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-bold">{typeData?.tickets.toLocaleString() || 0}</p>
                        <p className="text-purple-100 text-sm">Total Tickets</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-white/20">
                      <div>
                        <p className="text-2xl font-bold">{formatCurrency(typeData?.value || 0)}</p>
                        <p className="text-purple-100 text-sm">Opportunity Cost</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{filteredByType.length}</p>
                        <p className="text-purple-100 text-sm">Recipients</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Recipients for this type */}
                  <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-gray-100">
                      <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                        <Users size={18} className="text-purple-500" />
                        Recipients ({filteredByType.length})
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">Click on a name to view ticket details</p>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-gray-600">
                          <tr>
                            <th className="text-left py-3 px-4 font-medium">#</th>
                            <th className="text-left py-3 px-4 font-medium">Name</th>
                            <th className="text-right py-3 px-4 font-medium">Tickets</th>
                            <th className="text-right py-3 px-4 font-medium">Games</th>
                            <th className="text-left py-3 px-4 font-medium">Zones</th>
                            <th className="text-center py-3 px-4 font-medium">Age</th>
                            <th className="text-left py-3 px-4 font-medium">Location</th>
                            <th className="text-right py-3 px-4 font-medium">Opportunity Cost</th>
                            <th className="w-8"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {filteredByType.slice(0, 100).map((r, i) => (
                            <tr 
                              key={i} 
                              className="hover:bg-purple-50 cursor-pointer transition-colors"
                              onClick={() => setSelectedGiveawayRecipient(r.name)}
                            >
                              <td className="py-3 px-4 text-gray-400">{i + 1}</td>
                              <td className="py-3 px-4 font-medium text-purple-700 hover:text-purple-900">{r.name}</td>
                              <td className="py-3 px-4 text-right font-medium">{r.tickets}</td>
                              <td className="py-3 px-4 text-right">{r.games.length}</td>
                              <td className="py-3 px-4">
                                <div className="flex flex-wrap gap-1">
                                  {r.zones.slice(0, 2).map(z => (
                                    <span key={z} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">{z}</span>
                                  ))}
                                  {r.zones.length > 2 && (
                                    <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-xs">+{r.zones.length - 2}</span>
                                  )}
                                </div>
                              </td>
                              <td className="py-3 px-4 text-center text-gray-600">{r.age || '—'}</td>
                              <td className="py-3 px-4 text-gray-600">{r.location || '—'}</td>
                              <td className="py-3 px-4 text-right font-bold text-green-600">{formatCurrency(r.value)}</td>
                              <td className="py-3 px-4 text-gray-400">
                                <ChevronRight size={16} />
                              </td>
                            </tr>
                          ))}
                          {filteredByType.length === 0 && (
                            <tr>
                              <td colSpan={9} className="py-8 text-center text-gray-400">
                                No recipients found for this type
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                      {filteredByType.length > 100 && (
                        <div className="p-4 text-center text-sm text-gray-500 border-t border-gray-100">
                          Showing first 100 of {filteredByType.length} recipients
                        </div>
                      )}
                    </div>
                  </div>
                </>
              );
            })() : (
              <>
                {/* Giveaway Types breakdown with Pie Chart */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-gray-100">
                    <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                      <PieChart size={18} className="text-purple-500" />
                      Giveaway Types Breakdown
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">Click on a type to see recipients</p>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
                    {/* Pie Chart */}
                    <div className="h-72">
                      {typeList.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartsPie>
                            <Pie
                              data={typeList.map(t => ({ name: t.type, value: t.tickets }))}
                              cx="50%"
                              cy="50%"
                              outerRadius={90}
                              innerRadius={50}
                              paddingAngle={2}
                              dataKey="value"
                              label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                              labelLine={false}
                              onClick={(data) => setSelectedGiveawayType(data.name)}
                              style={{ cursor: 'pointer' }}
                            >
                              {typeList.map((_, i) => (
                                <Cell key={i} fill={COLORS[i % COLORS.length]} style={{ cursor: 'pointer' }} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value: number) => [value.toLocaleString(), 'Tickets']} />
                          </RechartsPie>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-full text-gray-400">
                          No giveaway data
                        </div>
                      )}
                    </div>
                    {/* Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-gray-600">
                          <tr>
                            <th className="text-left py-2 px-3 font-medium">Type</th>
                            <th className="text-right py-2 px-3 font-medium">Tickets</th>
                            <th className="text-right py-2 px-3 font-medium">Cost</th>
                            <th className="w-8"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {typeList.map((t, i) => (
                            <tr 
                              key={i} 
                              className="hover:bg-purple-50 cursor-pointer transition-colors"
                              onClick={() => setSelectedGiveawayType(t.type)}
                            >
                              <td className="py-2 px-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                                  <span className="font-medium text-purple-700">{t.type}</span>
                                </div>
                              </td>
                              <td className="py-2 px-3 text-right">{t.tickets.toLocaleString()}</td>
                              <td className="py-2 px-3 text-right font-bold text-green-600">{formatCurrency(t.value)}</td>
                              <td className="py-2 px-3 text-gray-400">
                                <ChevronRight size={14} />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Recipients list */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-gray-100">
                    <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                      <Users size={18} className="text-purple-500" />
                      All Giveaway Recipients ({recipientList.length})
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">Click on a name to view ticket details</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 text-gray-600">
                        <tr>
                          <th className="text-left py-3 px-4 font-medium">#</th>
                          <th className="text-left py-3 px-4 font-medium">Name</th>
                          <th className="text-left py-3 px-4 font-medium">Company</th>
                          <th className="text-left py-3 px-4 font-medium">Types</th>
                          <th className="text-right py-3 px-4 font-medium">Tickets</th>
                          <th className="text-right py-3 px-4 font-medium">Games</th>
                          <th className="text-left py-3 px-4 font-medium">Zones</th>
                          <th className="text-center py-3 px-4 font-medium">Age</th>
                          <th className="text-left py-3 px-4 font-medium">Location</th>
                          <th className="text-right py-3 px-4 font-medium">Opportunity Cost</th>
                          <th className="w-8"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {recipientList.slice(0, 100).map((r, i) => (
                          <tr 
                            key={i} 
                            className="hover:bg-purple-50 cursor-pointer transition-colors"
                            onClick={() => setSelectedGiveawayRecipient(r.name)}
                          >
                            <td className="py-3 px-4 text-gray-400">{i + 1}</td>
                            <td className="py-3 px-4 font-medium text-purple-700 hover:text-purple-900">{r.name}</td>
                            <td className="py-3 px-4 text-gray-600 text-xs">{r.company || '—'}</td>
                            <td className="py-3 px-4">
                              <div className="flex flex-wrap gap-1">
                                {r.types.slice(0, 2).map(t => (
                                  <span key={t} className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded text-xs">{t}</span>
                                ))}
                                {r.types.length > 2 && (
                                  <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-xs">+{r.types.length - 2}</span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-right font-medium">{r.tickets}</td>
                            <td className="py-3 px-4 text-right">{r.games.length}</td>
                            <td className="py-3 px-4">
                              <div className="flex flex-wrap gap-1">
                                {r.zones.slice(0, 2).map(z => (
                                  <span key={z} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">{z}</span>
                                ))}
                                {r.zones.length > 2 && (
                                  <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-xs">+{r.zones.length - 2}</span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-center text-gray-600">{r.age || '—'}</td>
                            <td className="py-3 px-4 text-gray-600">{r.location || '—'}</td>
                            <td className="py-3 px-4 text-right font-bold text-green-600">{formatCurrency(r.value)}</td>
                            <td className="py-3 px-4 text-gray-400">
                              <ChevronRight size={16} />
                            </td>
                          </tr>
                        ))}
                        {recipientList.length === 0 && (
                          <tr>
                            <td colSpan={11} className="py-8 text-center text-gray-400">
                              No giveaway recipients found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                    {recipientList.length > 100 && (
                      <div className="p-4 text-center text-sm text-gray-500 border-t border-gray-100">
                        Showing first 100 of {recipientList.length} recipients
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </>
        );
      })()}

      {activeView === 'search' && (() => {
        // Show loading indicator if search data is still loading
        if (isLoadingSearch && data.length === 0) {
          return (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
              <div className="flex flex-col items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mb-4"></div>
                <p className="text-gray-600 font-medium">Loading client search data...</p>
                <p className="text-gray-400 text-sm mt-2">This may take a few seconds</p>
              </div>
            </div>
          );
        }
        
        const allClients = Object.entries(
          data.reduce((acc, r) => {
            const key = getCustomerKey(r);
            if (!acc[key]) acc[key] = {
              name: toTitleCase(`${r.firstName || ''} ${r.lastName || ''}`.trim() || r.fullName),
              firstName: toTitleCase(r.firstName),
              lastName: toTitleCase(r.lastName),
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
          if (searchMode === 'client') {
            // Client search: search by name, email, phone, address, etc. (no zone/seat)
            const searchStr = [
              c.name, c.firstName, c.lastName, c.email, c.phone, c.cell, c.address, c.nationality, c.dob, c.pob, c.province, c.age
            ].filter(Boolean).join(' ').toLowerCase();
            return searchStr.includes(query);
          } else {
            // Seat search: search by zone, area, and seat only
            // Parse the query into parts (comma or space separated)
            const parts = query.split(/[,\s]+/).map(p => p.trim()).filter(p => p);
            
            return c.records.some((r: CRMRecord) => {
              // Handle various BigQuery column name formats
              // pv_zone is abbreviated (e.g., "TRIB G O"), zone is full (e.g., "TRIBUNA GOLD OVEST")
              const pvZone = ((r as any).pvZone || (r as any).pv_zone || (r as any).Pv_Zone || '').toLowerCase();
              const fullZone = ((r as any).zone || (r as any).Zone || '').toLowerCase();
              const area = ((r as any).area || (r as any).Area || (r as any).AREA || (r as any).settore || (r as any).Settore || '').toLowerCase();
              const seat = ((r as any).seat || (r as any).Seat || (r as any).SEAT || (r as any).posto || (r as any).Posto || '').toString().trim();
              
              // Combined zone string for flexible matching
              const combinedZone = `${pvZone} ${fullZone} ${area}`.toLowerCase();
              
              // Check if the last part is a seat number
              const lastPart = parts[parts.length - 1];
              const isLastPartSeat = /^\d+$/.test(lastPart);
              
              if (isLastPartSeat && parts.length >= 2) {
                // Last part is seat number, everything before is zone/area search
                const zoneParts = parts.slice(0, -1);
                const seatQuery = lastPart;
                
                // All zone parts must match somewhere in the combined zone string
                const allZonePartsMatch = zoneParts.every(p => combinedZone.includes(p));
                return allZonePartsMatch && seat === seatQuery;
              } else {
                // No seat number - just match all parts against zone
                const allPartsMatch = parts.every(p => combinedZone.includes(p));
                return allPartsMatch;
              }
            });
          }
        }).slice(0, 20) : [];

        const selectedClient = searchSelectedClient ? allClients.find(c => c.key === searchSelectedClient) : null;
        const clientGames: string[] = selectedClient ? [...new Set(selectedClient.records.map((r: CRMRecord) => r.gm || r.game || r.event).filter(Boolean))] as string[] : [];

        const getTicketRows = () => {
          if (!selectedClient) return [];
          let records = selectedClient.records as CRMRecord[];
          if (searchGameFilter !== 'all') {
            records = records.filter(r => (r.gm || r.game || r.event) === searchGameFilter);
          }
          const subscriptionTypes = ['abbonamento', 'abb', 'mini'];
          const grouped: any[] = [];
          const subRecords = records.filter(r => {
            const sellType = (r.sell || r.sellType || r.ticketType || '').toLowerCase();
            return subscriptionTypes.some(t => sellType.includes(t));
          });
          const otherRecords = records.filter(r => {
            const sellType = (r.sell || r.sellType || r.ticketType || '').toLowerCase();
            return !subscriptionTypes.some(t => sellType.includes(t));
          });
          const subGroups: Record<string, CRMRecord[]> = {};
          subRecords.forEach(r => {
            const key = `${r.sell || r.sellType || r.ticketType}|${r.pvZone || r.zone}`;
            if (!subGroups[key]) subGroups[key] = [];
            subGroups[key].push(r);
          });
          Object.entries(subGroups).forEach(([_key, recs]) => {
            const seats = [...new Set(recs.map(r => formatSeatLocation(r.area || '', r.seat || '')).filter(s => s && s !== '—'))];
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
              seats: formatSeatLocation(r.area || '', r.seat || ''),
              discountType: r.discountType || '—',
              value: Number(r.commercialValue) || 0,
              leadDays,
              sellType: r.sell || r.sellType || r.ticketType || '—',
              giveawayType: r.giveawayType || '',
              quantity: Number(r.quantity) || 1,
              game: r.gm || r.game || r.event || '—'
            });
          });
          return grouped;
        };

        return (
          <>
            <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Search size={20} className="text-red-500" />
                Find Customer
              </h3>
              
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => { setSearchMode('client'); setClientSearchQuery(''); setSearchSelectedClient(null); }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                    searchMode === 'client' 
                      ? 'bg-red-600 text-white' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <User size={16} />
                  Client Search
                </button>
                <button
                  onClick={() => { setSearchMode('seat'); setClientSearchQuery(''); setSearchSelectedClient(null); }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                    searchMode === 'seat' 
                      ? 'bg-red-600 text-white' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <MapPin size={16} />
                  Seat Search
                </button>
              </div>
              
              <div className="mb-6">
                <div className="relative max-w-xl">
                  <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder={searchMode === 'client' 
                      ? "Search by name, email, phone..." 
                      : "Search by zone, area, seat (e.g., par o, D, 121)"
                    }
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
                <p className="text-xs text-gray-500 mt-2">
                  {searchMode === 'client' 
                    ? "Enter at least 2 characters to find a client by name, email, or phone" 
                    : "Search examples: par o, par ex D 121, curva n"
                  }
                </p>
              </div>

              {query.length >= 2 && !selectedClient && searchMode === 'client' && (
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

              {query.length >= 2 && searchMode === 'seat' && seatHistoryData && (
                <div className="space-y-4">
                  {seatHistoryData.seatLocation && (
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-600 text-white rounded-lg p-3">
                          <MapPin size={24} />
                        </div>
                        <div>
                          <p className="text-xs text-blue-600 uppercase font-semibold">Seat Location</p>
                          <p className="text-lg font-bold text-gray-800">
                            {seatHistoryData.seatLocation.zone} {seatHistoryData.seatLocation.area && `- Section ${seatHistoryData.seatLocation.area}`} {seatHistoryData.seatLocation.seat !== 'All seats' && `- Seat ${seatHistoryData.seatLocation.seat}`}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 bg-gray-50">
                      <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                        <Ticket size={18} className="text-blue-500" />
                        Seat History ({seatHistoryData.seatHistory.filter(g => g.occupied).length}/{seatHistoryData.seatHistory.length} games occupied)
                      </h4>
                    </div>
                    <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
                      <table className="w-full text-sm">
                        <thead className="sticky top-0 z-10">
                          <tr className="border-b border-gray-200 bg-gray-50">
                            <th className="text-left py-2 px-3 font-semibold text-gray-600 bg-gray-50">Date</th>
                            <th className="text-left py-2 px-3 font-semibold text-gray-600 bg-gray-50">Opponent</th>
                            <th className="text-left py-2 px-3 font-semibold text-gray-600 bg-gray-50">Status</th>
                            <th className="text-left py-2 px-3 font-semibold text-gray-600 bg-gray-50">Occupant</th>
                            <th className="text-left py-2 px-3 font-semibold text-gray-600 bg-gray-50">Type</th>
                            <th className="text-right py-2 px-3 font-semibold text-gray-600 bg-gray-50">Value</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {seatHistoryData.seatHistory.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="py-8 text-center text-gray-500">
                                <MapPin size={32} className="mx-auto mb-2 opacity-30" />
                                <p>No games found. Make sure game data is loaded.</p>
                              </td>
                            </tr>
                          ) : seatHistoryData.seatHistory.map((row, i) => (
                            <tr key={i} className={`hover:bg-gray-50 ${!row.occupied ? 'bg-gray-50/50' : ''}`}>
                              <td className="py-2 px-3 text-gray-600">{row.date}</td>
                              <td className="py-2 px-3 font-medium">{row.opponent}</td>
                              <td className="py-2 px-3">
                                {row.occupied ? (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    Occupied
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                    Empty
                                  </span>
                                )}
                              </td>
                              <td className="py-2 px-3">{row.occupant || '—'}</td>
                              <td className="py-2 px-3 text-gray-600">{row.sellType || '—'}</td>
                              <td className="py-2 px-3 text-right font-medium">
                                {row.price > 0 ? formatCurrency(row.price) : '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {seatHistoryData.matchingRecords.length > 0 && (
                    <p className="text-xs text-gray-500">
                      Found {seatHistoryData.matchingRecords.length} ticket records for this location
                    </p>
                  )}
                </div>
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
                            </tr>
                          ))}
                          {getTicketRows().length === 0 && (
                            <tr>
                              <td colSpan={7} className="py-8 text-center text-gray-400">No tickets found for this filter</td>
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
                      const rawSell = (r.sell || r.sellType || '').toLowerCase();
                      const isAbb = rawSell === 'abb';
                      const key = isAbb ? 'Season Ticket' : (r.gm || r.game || r.event || 'Unknown');
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
