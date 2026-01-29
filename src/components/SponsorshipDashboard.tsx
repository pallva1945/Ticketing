import React, { useState, useMemo, useRef } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { SponsorData } from '../types';
import { Flag, DollarSign, Building2, ArrowUpRight, ChevronDown, Banknote, RefreshCw, FileSpreadsheet, X, Filter, Target, Ticket, Award, TrendingUp, TrendingDown, Minus, Search, Calendar, Mail, User, Clock, History, ArrowRight, CheckCircle, Circle } from 'lucide-react';
import { SEASON_TARGET_SPONSORSHIP } from '../constants';

const SPONSOR_TIERS = {
  PLATINUM: { name: 'Platinum', min: 200000, color: '#475569', bgColor: 'bg-slate-600', textColor: 'text-white', borderColor: 'border-slate-600' },
  GOLD: { name: 'Gold', min: 100000, color: '#ca8a04', bgColor: 'bg-yellow-600', textColor: 'text-white', borderColor: 'border-yellow-600' },
  SILVER: { name: 'Silver', min: 50000, color: '#64748b', bgColor: 'bg-slate-400', textColor: 'text-white', borderColor: 'border-slate-400' },
  BRONZE: { name: 'Bronze', min: 10000, color: '#b45309', bgColor: 'bg-amber-700', textColor: 'text-white', borderColor: 'border-amber-700' },
  MICRO: { name: 'Micro', min: 0, color: '#78716c', bgColor: 'bg-stone-500', textColor: 'text-white', borderColor: 'border-stone-500' }
};

const getSponsorTier = (value: number) => {
  if (value >= 200000) return SPONSOR_TIERS.PLATINUM;
  if (value >= 100000) return SPONSOR_TIERS.GOLD;
  if (value >= 50000) return SPONSOR_TIERS.SILVER;
  if (value >= 10000) return SPONSOR_TIERS.BRONZE;
  return SPONSOR_TIERS.MICRO;
};

const getDealQuality = (delta: number, commercialValue: number) => {
  if (commercialValue === 0) return { label: 'N/A', score: 0, color: 'text-gray-400', bgColor: 'bg-gray-100', icon: Minus };
  const ratio = delta / commercialValue;
  if (ratio >= 0.2) return { label: 'Excellent', score: 5, color: 'text-emerald-700', bgColor: 'bg-emerald-100', icon: TrendingUp };
  if (ratio >= 0.05) return { label: 'Good', score: 4, color: 'text-green-600', bgColor: 'bg-green-100', icon: TrendingUp };
  if (ratio >= -0.05) return { label: 'Fair', score: 3, color: 'text-slate-600', bgColor: 'bg-slate-100', icon: Minus };
  if (ratio >= -0.2) return { label: 'Below', score: 2, color: 'text-amber-600', bgColor: 'bg-amber-100', icon: TrendingDown };
  return { label: 'Poor', score: 1, color: 'text-red-600', bgColor: 'bg-red-100', icon: TrendingDown };
};

interface SponsorshipDashboardProps {
  data: SponsorData[];
  onUploadCsv: (content: string) => void;
  dataSource: 'local' | 'cloud';
  lastUpdated: string | null;
}

const COLORS = {
  primary: '#dc2626',
  secondary: '#3b82f6', 
  tertiary: '#10b981',
  quaternary: '#f59e0b',
  gray: '#64748b',
  cash: '#16a34a',
  cm: '#8b5cf6'
};

const SECTOR_COLORS: Record<string, string> = {
  'Finanziario/Bancario': '#3b82f6',
  'Industria': '#64748b',
  'Energia': '#f59e0b',
  'Commercio/GDO': '#10b981',
  'Food & Beverage': '#ef4444',
  'Tecnologia': '#8b5cf6',
  'Trasporti': '#06b6d4',
  'Aerospace': '#1e40af',
  'Servizi HR': '#ec4899',
  'Assicurazioni': '#84cc16',
  'Abbigliamento/Tessile': '#f97316',
  'Turismo': '#14b8a6',
  'Ho.Re.Ca.': '#a855f7',
  'Comunicazione/Pubblicità': '#6366f1',
  'Medico': '#22c55e',
  'Servizi/Artigiano': '#78716c',
  'Scolastico/Corsi': '#0ea5e9',
  'Serramenti': '#737373',
  'default': '#94a3b8'
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatCompactCurrency = (value: number) => {
  const absVal = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  if (absVal >= 1000000) return `${sign}€${(absVal / 1000000).toFixed(1)}M`;
  if (absVal >= 1000) return `${sign}€${(absVal / 1000).toFixed(0)}k`;
  return `${sign}€${absVal}`;
};

export const SponsorshipDashboard: React.FC<SponsorshipDashboardProps> = ({ 
  data, 
  onUploadCsv
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedSeason, setSelectedSeason] = useState<string>('25/26');
  const [showSeasonDropdown, setShowSeasonDropdown] = useState(false);
  const [excludeCorpTix, setExcludeCorpTix] = useState(true);
  const [excludeGameDay, setExcludeGameDay] = useState(true);
  const [excludeVB, setExcludeVB] = useState(true);
  
  const [filterCompany, setFilterCompany] = useState<string | null>(null);
  const [filterSector, setFilterSector] = useState<string | null>(null);
  const [filterContractType, setFilterContractType] = useState<'CASH' | 'CM' | null>(null);
  const [filterTier, setFilterTier] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRecType, setFilterRecType] = useState<'sponsorship' | 'vb' | 'csr' | 'corptix' | 'gameday' | null>(null);
  const [selectedSponsor, setSelectedSponsor] = useState<SponsorData | null>(null);
  
  const hasActiveFilter = filterCompany || filterSector || filterContractType || filterTier || searchQuery || filterRecType;
  
  const clearAllFilters = () => {
    setFilterCompany(null);
    setFilterSector(null);
    setFilterContractType(null);
    setFilterTier(null);
    setSearchQuery('');
    setFilterRecType(null);
  };

  const seasons = useMemo(() => {
    const s = Array.from(new Set(data.map(d => d.season))).filter(Boolean).sort().reverse();
    return s.length > 0 ? s : ['24/25'];
  }, [data]);

  const filteredData = useMemo(() => {
    return data.filter(d => d.season === selectedSeason);
  }, [data, selectedSeason]);

  const chartFilteredData = useMemo(() => {
    let result = [...filteredData];
    
    // Search filter - search by company name
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(d => d.company.toLowerCase().includes(query));
    }
    
    if (filterCompany) {
      result = result.filter(d => d.company === filterCompany);
    }
    if (filterSector) {
      result = result.filter(d => (d.sector || 'Other') === filterSector);
    }
    if (filterContractType) {
      result = result.filter(d => d.contractType === filterContractType);
    }
    if (filterTier) {
      result = result.filter(d => getSponsorTier(d.commercialValue).name === filterTier);
    }
    // Reconciliation type filter - filter sponsors who have value in that category
    if (filterRecType) {
      result = result.filter(d => {
        switch (filterRecType) {
          case 'sponsorship': return d.sponsorReconciliation > 0;
          case 'vb': return d.vbReconciliation > 0;
          case 'csr': return d.csrReconciliation > 0;
          case 'corptix': return d.corpTixReconciliation > 0;
          case 'gameday': return d.gamedayReconciliation > 0;
          default: return true;
        }
      });
    }
    return result;
  }, [filteredData, searchQuery, filterCompany, filterSector, filterContractType, filterTier, filterRecType]);

  const stats = useMemo(() => {
    const dataSource = chartFilteredData;
    const GAMES_PER_SEASON = 15; // GameDay reconciliation values are per-game, multiply by 15 for season total
    
    const totalCommercial = dataSource.reduce((sum, d) => sum + d.commercialValue, 0);
    const totalCash = dataSource.filter(d => d.contractType === 'CASH').reduce((sum, d) => sum + d.commercialValue, 0);
    const totalCM = dataSource.filter(d => d.contractType === 'CM').reduce((sum, d) => sum + d.commercialValue, 0);
    const totalSponsors = dataSource.length;
    const uniqueCompanies = new Set(dataSource.map(d => d.company)).size;
    
    // GameDay reconciliation is per-game, so multiply by 15 for season total
    const totalGameday = dataSource.reduce((sum, d) => sum + d.gamedayReconciliation, 0) * GAMES_PER_SEASON;
    const totalVB = dataSource.reduce((sum, d) => sum + d.vbReconciliation, 0);
    const totalCSR = dataSource.reduce((sum, d) => sum + d.csrReconciliation, 0);
    const totalCorpTix = dataSource.reduce((sum, d) => sum + d.corpTixReconciliation, 0);
    const totalSponsorRec = dataSource.reduce((sum, d) => sum + d.sponsorReconciliation, 0);
    
    const avgDealSize = uniqueCompanies > 0 ? totalCommercial / uniqueCompanies : 0;
    
    const pureSponsorship = totalSponsorRec + totalCSR;
    
    // Adjusted values based on toggles
    // When ALL exclusions are enabled, use pureSponsorship directly to ensure consistency with Season Target
    const allExcluded = excludeCorpTix && excludeGameDay && excludeVB;
    const adjustedCommercial = allExcluded 
      ? pureSponsorship 
      : totalCommercial 
        - (excludeCorpTix ? totalCorpTix : 0) 
        - (excludeGameDay ? totalGameday : 0)
        - (excludeVB ? totalVB : 0);
    
    // For Cash/CM breakdown when all excluded, use reconciliation-based values
    const cashSponsorRec = dataSource.filter(d => d.contractType === 'CASH').reduce((sum, d) => sum + d.sponsorReconciliation, 0);
    const cashCSR = dataSource.filter(d => d.contractType === 'CASH').reduce((sum, d) => sum + d.csrReconciliation, 0);
    const cmSponsorRec = dataSource.filter(d => d.contractType === 'CM').reduce((sum, d) => sum + d.sponsorReconciliation, 0);
    const cmCSR = dataSource.filter(d => d.contractType === 'CM').reduce((sum, d) => sum + d.csrReconciliation, 0);
    
    const adjustedCash = allExcluded
      ? cashSponsorRec + cashCSR
      : totalCash 
        - (excludeCorpTix ? dataSource.filter(d => d.contractType === 'CASH').reduce((sum, d) => sum + d.corpTixReconciliation, 0) : 0)
        - (excludeGameDay ? dataSource.filter(d => d.contractType === 'CASH').reduce((sum, d) => sum + d.gamedayReconciliation, 0) * GAMES_PER_SEASON : 0)
        - (excludeVB ? dataSource.filter(d => d.contractType === 'CASH').reduce((sum, d) => sum + d.vbReconciliation, 0) : 0);
    const adjustedCM = allExcluded
      ? cmSponsorRec + cmCSR
      : totalCM 
        - (excludeCorpTix ? dataSource.filter(d => d.contractType === 'CM').reduce((sum, d) => sum + d.corpTixReconciliation, 0) : 0)
        - (excludeGameDay ? dataSource.filter(d => d.contractType === 'CM').reduce((sum, d) => sum + d.gamedayReconciliation, 0) * GAMES_PER_SEASON : 0)
        - (excludeVB ? dataSource.filter(d => d.contractType === 'CM').reduce((sum, d) => sum + d.vbReconciliation, 0) : 0);
    
    return {
      totalCommercial,
      totalCash,
      totalCM,
      adjustedCommercial,
      adjustedCash,
      adjustedCM,
      totalSponsors,
      uniqueCompanies,
      totalGameday,
      totalVB,
      totalCSR,
      totalCorpTix,
      totalSponsorRec,
      pureSponsorship,
      avgDealSize,
      cashRatio: totalCommercial > 0 ? (totalCash / totalCommercial) * 100 : 0
    };
  }, [chartFilteredData, excludeCorpTix, excludeGameDay, excludeVB]);

  const topSponsors = useMemo(() => {
    return [...chartFilteredData]
      .sort((a, b) => b.commercialValue - a.commercialValue)
      .slice(0, 10);
  }, [chartFilteredData]);

  const tableFilteredData = useMemo(() => {
    return [...chartFilteredData].sort((a, b) => b.commercialValue - a.commercialValue);
  }, [chartFilteredData]);

  const sectorData = useMemo(() => {
    const sectorMap: Record<string, { value: number, count: number }> = {};
    chartFilteredData.forEach(d => {
      const sector = d.sector || 'Other';
      if (!sectorMap[sector]) sectorMap[sector] = { value: 0, count: 0 };
      sectorMap[sector].value += d.commercialValue;
      sectorMap[sector].count += 1;
    });
    return Object.entries(sectorMap)
      .map(([name, { value, count }]) => ({ name, value, count }))
      .sort((a, b) => b.value - a.value);
  }, [chartFilteredData]);

  const contractTypeData = useMemo(() => {
    return [
      { name: 'Cash', value: stats.totalCash, fill: COLORS.cash },
      { name: 'Cambio Merce', value: stats.totalCM, fill: COLORS.cm }
    ];
  }, [stats]);

  const reconciliationData = useMemo(() => {
    // Always show all reconciliation categories (no exclusion toggles applied to charts)
    const items = [
      { name: 'Sponsorship', value: stats.totalSponsorRec, fill: COLORS.primary },
      { name: 'VB (Youth)', value: stats.totalVB, fill: COLORS.quaternary },
      { name: 'CSR', value: stats.totalCSR, fill: COLORS.gray },
      { name: 'Corp Tickets', value: stats.totalCorpTix, fill: COLORS.secondary },
      { name: 'Game Day', value: stats.totalGameday, fill: COLORS.tertiary }
    ];
    return items.filter(d => d.value > 0);
  }, [stats]);

  const monthlyData = useMemo(() => {
    const months = ['july', 'august', 'september', 'october', 'november', 'december', 
                    'january', 'february', 'march', 'april', 'may', 'june'];
    const monthLabels = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    
    return months.map((m, i) => {
      const total = chartFilteredData.reduce((sum, d) => sum + (d.monthlyPayments[m] || 0), 0);
      return { name: monthLabels[i], value: total, month: m };
    });
  }, [chartFilteredData]);

  const tierStats = useMemo(() => {
    const tiers = Object.values(SPONSOR_TIERS).map(tier => ({
      ...tier,
      sponsors: chartFilteredData.filter(d => getSponsorTier(d.commercialValue).name === tier.name),
      count: 0,
      totalValue: 0,
      avgDealQuality: 0
    }));

    tiers.forEach(tier => {
      tier.count = tier.sponsors.length;
      tier.totalValue = tier.sponsors.reduce((sum, s) => sum + s.commercialValue, 0);
      const qualityScores = tier.sponsors.map(s => {
        return getDealQuality(s.delta, s.commercialValue).score;
      });
      tier.avgDealQuality = qualityScores.length > 0 
        ? qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length 
        : 0;
    });

    return tiers;
  }, [chartFilteredData]);

  const dealQualityStats = useMemo(() => {
    const qualityBuckets = { excellent: 0, good: 0, fair: 0, below: 0, poor: 0 };
    let totalDelta = 0;
    
    chartFilteredData.forEach(sponsor => {
      totalDelta += sponsor.delta;
      const quality = getDealQuality(sponsor.delta, sponsor.commercialValue);
      if (quality.label === 'Excellent') qualityBuckets.excellent++;
      else if (quality.label === 'Good') qualityBuckets.good++;
      else if (quality.label === 'Fair') qualityBuckets.fair++;
      else if (quality.label === 'Below') qualityBuckets.below++;
      else if (quality.label === 'Poor') qualityBuckets.poor++;
    });

    const avgQualityScore = chartFilteredData.length > 0 
      ? chartFilteredData.reduce((sum, s) => sum + getDealQuality(s.delta, s.commercialValue).score, 0) / chartFilteredData.length 
      : 0;

    return { ...qualityBuckets, totalDelta, avgQualityScore, total: chartFilteredData.length };
  }, [chartFilteredData]);

  const topAndWorstDeals = useMemo(() => {
    const withDelta = chartFilteredData.map(s => ({
      ...s,
      delta: s.delta,
      quality: getDealQuality(s.delta, s.commercialValue)
    }));
    const sorted = [...withDelta].sort((a, b) => b.delta - a.delta);
    return {
      top5: sorted.slice(0, 5),
      worst5: sorted.slice(-5).reverse()
    };
  }, [chartFilteredData]);

  // Historical data for selected sponsor (same company across all seasons)
  const sponsorHistory = useMemo(() => {
    if (!selectedSponsor) return { past: [], current: [], future: [], all: [] };
    
    // Helper to extract start year from season (handles both "25-26" and "25/26" formats)
    const getSeasonYear = (season: string): number => {
      const match = season.match(/(\d+)/);
      return match ? parseInt(match[1]) : 0;
    };
    
    const allContracts = data
      .filter(d => d.company === selectedSponsor.company)
      .sort((a, b) => getSeasonYear(a.season) - getSeasonYear(b.season));
    
    // Current season is 25-26 (Jan 2026)
    const currentSeasonYear = 25;
    
    const past = allContracts.filter(c => getSeasonYear(c.season) < currentSeasonYear);
    const current = allContracts.filter(c => getSeasonYear(c.season) === currentSeasonYear);
    const future = allContracts.filter(c => getSeasonYear(c.season) > currentSeasonYear);
    
    return { past, current, future, all: allContracts };
  }, [data, selectedSponsor]);

  // Monthly payment breakdown for selected sponsor
  const selectedSponsorMonthly = useMemo(() => {
    if (!selectedSponsor) return [];
    const months = ['july', 'august', 'september', 'october', 'november', 'december', 
                    'january', 'february', 'march', 'april', 'may', 'june'];
    const monthLabels = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    
    // Determine current month for highlighting future payments
    const now = new Date();
    const currentMonthIndex = now.getMonth(); // 0-11
    // Map calendar month to fiscal month (July = 0)
    const fiscalMonthMap: Record<number, number> = { 6: 0, 7: 1, 8: 2, 9: 3, 10: 4, 11: 5, 0: 6, 1: 7, 2: 8, 3: 9, 4: 10, 5: 11 };
    const currentFiscalMonth = fiscalMonthMap[currentMonthIndex] ?? 0;
    
    return months.map((m, i) => ({
      name: monthLabels[i],
      month: m,
      value: selectedSponsor.monthlyPayments[m] || 0,
      isPast: i < currentFiscalMonth,
      isCurrent: i === currentFiscalMonth,
      isFuture: i > currentFiscalMonth
    }));
  }, [selectedSponsor]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        onUploadCsv(content);
      };
      reader.readAsText(file);
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 shadow-xl rounded-lg text-xs">
          <p className="font-bold text-gray-900 mb-1">{payload[0].name}</p>
          <p className="text-gray-600">{formatCurrency(payload[0].value)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        accept=".csv" 
        className="hidden" 
      />
      
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Flag className="text-red-600" size={24} />
            Sponsorship Analytics
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Revenue breakdown and sponsor portfolio analysis
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search sponsors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 w-48 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Type Filter Dropdown */}
          <select
            value={filterRecType || ''}
            onChange={(e) => setFilterRecType(e.target.value as any || null)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="">All Types</option>
            <option value="sponsorship">Sponsorship</option>
            <option value="vb">VB (Youth)</option>
            <option value="csr">CSR</option>
            <option value="corptix">Corp Tickets</option>
            <option value="gameday">GameDay</option>
          </select>

          <div className="relative">
            <button 
              onClick={() => setShowSeasonDropdown(!showSeasonDropdown)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <span className="text-sm font-medium text-gray-700">Season: {selectedSeason}</span>
              <ChevronDown size={16} className="text-gray-500" />
            </button>
            {showSeasonDropdown && (
              <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                {seasons.map(s => (
                  <button
                    key={s}
                    onClick={() => { setSelectedSeason(s); setShowSeasonDropdown(false); }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg ${
                      selectedSeason === s ? 'bg-red-50 text-red-700 font-medium' : 'text-gray-700'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {hasActiveFilter && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-amber-600" />
              <span className="text-sm font-medium text-amber-800">Active Filters:</span>
              <div className="flex items-center gap-2 flex-wrap">
                {filterCompany && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-amber-300 rounded-full text-xs font-medium text-amber-800">
                    Company: {filterCompany}
                    <button onClick={() => setFilterCompany(null)} className="hover:text-amber-600">
                      <X size={12} />
                    </button>
                  </span>
                )}
                {filterSector && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-amber-300 rounded-full text-xs font-medium text-amber-800">
                    Sector: {filterSector}
                    <button onClick={() => setFilterSector(null)} className="hover:text-amber-600">
                      <X size={12} />
                    </button>
                  </span>
                )}
                {filterContractType && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-amber-300 rounded-full text-xs font-medium text-amber-800">
                    Type: {filterContractType === 'CASH' ? 'Cash' : 'Cambio Merce'}
                    <button onClick={() => setFilterContractType(null)} className="hover:text-amber-600">
                      <X size={12} />
                    </button>
                  </span>
                )}
                {filterTier && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-amber-300 rounded-full text-xs font-medium text-amber-800">
                    Tier: {filterTier}
                    <button onClick={() => setFilterTier(null)} className="hover:text-amber-600">
                      <X size={12} />
                    </button>
                  </span>
                )}
                {searchQuery && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-amber-300 rounded-full text-xs font-medium text-amber-800">
                    Search: "{searchQuery}"
                    <button onClick={() => setSearchQuery('')} className="hover:text-amber-600">
                      <X size={12} />
                    </button>
                  </span>
                )}
                {filterRecType && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-amber-300 rounded-full text-xs font-medium text-amber-800">
                    Type: {filterRecType === 'vb' ? 'VB (Youth)' : filterRecType === 'csr' ? 'CSR' : filterRecType === 'corptix' ? 'Corp Tickets' : filterRecType === 'gameday' ? 'GameDay' : 'Sponsorship'}
                    <button onClick={() => setFilterRecType(null)} className="hover:text-amber-600">
                      <X size={12} />
                    </button>
                  </span>
                )}
              </div>
            </div>
            <button 
              onClick={clearAllFilters}
              className="text-xs font-medium text-amber-700 hover:text-amber-900 underline"
            >
              Clear All
            </button>
          </div>
          <p className="text-xs text-amber-600 mt-2">
            Showing {tableFilteredData.length} of {filteredData.length} sponsors • Click any chart element to filter
          </p>
        </div>
      )}

      {/* Season Target Pacing Widget */}
      {(() => {
        const progress = Math.min((stats.pureSponsorship / SEASON_TARGET_SPONSORSHIP) * 100, 100);
        const isOnTrack = stats.pureSponsorship >= SEASON_TARGET_SPONSORSHIP * 0.8;
        const variance = stats.pureSponsorship - SEASON_TARGET_SPONSORSHIP;
        const variancePercent = ((stats.pureSponsorship / SEASON_TARGET_SPONSORSHIP) - 1) * 100;
        
        return (
          <div className="bg-slate-900 rounded-xl p-6 text-white shadow-lg border border-slate-700 relative overflow-hidden">
            {!isOnTrack && <div className="absolute top-0 right-0 w-24 h-24 bg-red-600/20 blur-3xl rounded-full" />}
            
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-600/20 rounded-lg flex items-center justify-center">
                  <Target size={20} className="text-red-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Season Target (Sponsorship + CSR)</h3>
                  <p className="text-xs text-slate-500">Excludes Corp Tickets, GameDay, VB</p>
                </div>
              </div>
              <div className={`text-right px-3 py-1.5 rounded-lg ${variance >= 0 ? 'bg-green-900/40' : 'bg-amber-900/40'}`}>
                <span className={`text-lg font-bold ${variance >= 0 ? 'text-green-400' : 'text-amber-400'}`}>
                  {variancePercent >= 0 ? '+' : ''}{variancePercent.toFixed(1)}%
                </span>
                <p className="text-xs text-slate-400">{variance >= 0 ? 'Above Target' : 'Below Target'}</p>
              </div>
            </div>
            
            <div className="flex items-baseline gap-3 mb-4">
              <span className="text-4xl font-extrabold">{formatCompactCurrency(stats.pureSponsorship)}</span>
              <span className="text-lg text-slate-400 font-medium">/ {formatCompactCurrency(SEASON_TARGET_SPONSORSHIP)}</span>
            </div>
            
            <div className="relative h-3 bg-slate-800 rounded-full overflow-hidden mb-3">
              <div 
                className={`absolute top-0 left-0 h-full transition-all duration-1000 ease-out ${variance >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                style={{ width: `${progress}%` }}
              />
            </div>
            
            <div className="flex justify-between text-xs text-slate-500">
              <span>Sponsorship: {formatCompactCurrency(stats.totalSponsorRec)}</span>
              <span>CSR: {formatCompactCurrency(stats.totalCSR)}</span>
              <span>{progress.toFixed(1)}% of target</span>
            </div>
          </div>
        );
      })()}

      {/* Sponsor Tiers & Deal Quality Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sponsor Tiers */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Award size={20} className="text-amber-500" />
            Sponsor Tiers
          </h3>
          <div className="space-y-3">
            {tierStats.map((tier) => (
              <div 
                key={tier.name} 
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                  filterTier === tier.name 
                    ? 'ring-2 ring-amber-400 border-amber-400' 
                    : tier.count > 0 ? tier.borderColor : 'border-gray-200'
                } ${tier.count > 0 ? 'bg-gray-50 hover:bg-gray-100' : 'bg-gray-50 opacity-50'}`}
                onClick={() => tier.count > 0 && setFilterTier(filterTier === tier.name ? null : tier.name)}
              >
                <div className={`w-10 h-10 rounded-lg ${tier.bgColor} ${tier.textColor} flex items-center justify-center font-bold text-sm`}>
                  {tier.count}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-800">{tier.name}</span>
                    <span className="font-bold text-gray-900">{formatCompactCurrency(tier.totalValue)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500 mt-0.5">
                    <span>{tier.min >= 200000 ? '€200k+' : tier.min >= 100000 ? '€100k-200k' : tier.min >= 50000 ? '€50k-100k' : tier.min >= 10000 ? '€10k-50k' : '€0-10k'}</span>
                    {tier.count > 0 && (
                      <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${tier.avgDealQuality >= 4 ? 'bg-emerald-100 text-emerald-700' : tier.avgDealQuality >= 3 ? 'bg-slate-100 text-slate-700' : 'bg-amber-100 text-amber-700'}`}>
                        Avg Quality: {tier.avgDealQuality.toFixed(1)}/5
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Deal Quality Overview */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm flex flex-col justify-center">
          <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <TrendingUp size={20} className="text-emerald-500" />
            Deal Quality Overview
          </h3>
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-gray-500">Portfolio Net Delta</span>
              <span className={`text-xl font-bold ${dealQualityStats.totalDelta >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {dealQualityStats.totalDelta >= 0 ? '+' : ''}{formatCompactCurrency(dealQualityStats.totalDelta)}
              </span>
            </div>
            <p className="text-xs text-gray-400">Revenue received minus value given (LED, jersey, tickets, etc.)</p>
          </div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm text-gray-500">Avg Score:</span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className={`w-4 h-4 rounded ${i <= Math.round(dealQualityStats.avgQualityScore) ? 'bg-emerald-500' : 'bg-gray-200'}`} />
              ))}
            </div>
            <span className="text-sm font-bold text-gray-700">{dealQualityStats.avgQualityScore.toFixed(1)}/5</span>
          </div>
          <div className="grid grid-cols-5 gap-2 text-center mb-3">
            <div className="bg-emerald-50 rounded-lg p-2">
              <p className="text-lg font-bold text-emerald-700">{dealQualityStats.excellent}</p>
              <p className="text-[10px] text-emerald-600 font-medium">Excellent</p>
            </div>
            <div className="bg-green-50 rounded-lg p-2">
              <p className="text-lg font-bold text-green-600">{dealQualityStats.good}</p>
              <p className="text-[10px] text-green-600 font-medium">Good</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-2">
              <p className="text-lg font-bold text-slate-600">{dealQualityStats.fair}</p>
              <p className="text-[10px] text-slate-600 font-medium">Fair</p>
            </div>
            <div className="bg-amber-50 rounded-lg p-2">
              <p className="text-lg font-bold text-amber-600">{dealQualityStats.below}</p>
              <p className="text-[10px] text-amber-600 font-medium">Below</p>
            </div>
            <div className="bg-red-50 rounded-lg p-2">
              <p className="text-lg font-bold text-red-600">{dealQualityStats.poor}</p>
              <p className="text-[10px] text-red-600 font-medium">Poor</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-100 items-start">
            <div>
              <p className="text-[10px] font-bold text-emerald-600 uppercase mb-2">Best Deals</p>
              <div className="space-y-1">
                {topAndWorstDeals.top5.map((s, i) => {
                  const score = (5 - i * 0.8).toFixed(1);
                  return (
                    <div key={s.id} className="flex items-center gap-2 bg-emerald-50 rounded px-2 py-1">
                      <span className="w-4 h-4 bg-emerald-600 text-white rounded-full flex items-center justify-center text-[9px] font-bold shrink-0">{i + 1}</span>
                      <span 
                        className="flex-1 text-[11px] font-semibold text-gray-800 truncate cursor-pointer hover:text-emerald-700 hover:underline"
                        onClick={() => setFilterCompany(filterCompany === s.company ? null : s.company)}
                      >{s.company}</span>
                      <span className="text-[11px] font-bold text-emerald-700 shrink-0">{score}/5</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold text-red-600 uppercase mb-2">Worst Deals</p>
              <div className="space-y-1">
                {topAndWorstDeals.worst5.map((s, i) => {
                  const score = (i * 0.2).toFixed(1);
                  return (
                    <div key={s.id} className="flex items-center gap-2 bg-red-50 rounded px-2 py-1">
                      <span className="w-4 h-4 bg-red-600 text-white rounded-full flex items-center justify-center text-[9px] font-bold shrink-0">{i + 1}</span>
                      <span 
                        className="flex-1 text-[11px] font-semibold text-gray-800 truncate cursor-pointer hover:text-red-700 hover:underline"
                        onClick={() => setFilterCompany(filterCompany === s.company ? null : s.company)}
                      >{s.company}</span>
                      <span className="text-[11px] font-bold text-red-700 shrink-0">{score}/5</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <FileSpreadsheet size={14} />
            <span>{stats.totalSponsors} contracts | {stats.uniqueCompanies} companies</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setExcludeCorpTix(!excludeCorpTix)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                excludeCorpTix ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-white text-gray-600 border-gray-200'
              }`}
            >
              {excludeCorpTix ? '✓' : '○'} Exclude Corp Tickets
            </button>
            <button
              onClick={() => setExcludeGameDay(!excludeGameDay)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                excludeGameDay ? 'bg-green-50 text-green-700 border-green-200' : 'bg-white text-gray-600 border-gray-200'
              }`}
            >
              {excludeGameDay ? '✓' : '○'} Exclude GameDay
            </button>
            <button
              onClick={() => setExcludeVB(!excludeVB)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                excludeVB ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-white text-gray-600 border-gray-200'
              }`}
            >
              {excludeVB ? '✓' : '○'} Exclude VB
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
              <DollarSign size={20} className="text-red-600" />
            </div>
            <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full flex items-center gap-1">
              <ArrowUpRight size={12} /> Active
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatCompactCurrency(stats.adjustedCommercial)}</p>
          <p className="text-xs text-gray-500 mt-1">Commercial Value</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
              <Banknote size={20} className="text-green-600" />
            </div>
            <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
              {stats.cashRatio.toFixed(0)}% Cash
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatCompactCurrency(stats.adjustedCash)}</p>
          <p className="text-xs text-gray-500 mt-1">Cash</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
              <RefreshCw size={20} className="text-purple-600" />
            </div>
            <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
              Barter
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatCompactCurrency(stats.adjustedCM)}</p>
          <p className="text-xs text-gray-500 mt-1">Cambio Merce</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
              <Ticket size={20} className="text-orange-600" />
            </div>
            <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
              Corp
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatCompactCurrency(stats.totalCorpTix)}</p>
          <p className="text-xs text-gray-500 mt-1">Corp Tickets</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <Building2 size={20} className="text-blue-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatCompactCurrency(stats.avgDealSize)}</p>
          <p className="text-xs text-gray-500 mt-1">Avg. Deal Size</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center justify-between">
            Top 10 Sponsors
            <span className="text-xs font-normal text-gray-400">Click bar to filter</span>
          </h3>
          <div className="h-80 -ml-8">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={topSponsors} 
                layout="vertical" 
                margin={{ left: -20, right: 20 }}
                onClick={(e) => {
                  if (e && e.activePayload && e.activePayload[0]) {
                    const company = e.activePayload[0].payload.company;
                    setFilterCompany(filterCompany === company ? null : company);
                  }
                }}
                style={{ cursor: 'pointer' }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis type="number" tickFormatter={formatCompactCurrency} tick={{ fontSize: 10 }} />
                <YAxis 
                  type="category" 
                  dataKey="company" 
                  width={160} 
                  tick={{ fontSize: 10, fontWeight: 600, textAnchor: 'end' }}
                  tickFormatter={(v) => v.length > 22 ? v.substring(0, 22) + '..' : v}
                />
                <Tooltip 
                  formatter={(value: number) => [formatCurrency(value), 'Value']}
                  labelFormatter={(label) => label}
                  contentStyle={{ fontSize: '12px' }}
                />
                <Bar dataKey="commercialValue" radius={[0, 4, 4, 0]}>
                  {topSponsors.map((entry) => (
                    <Cell 
                      key={entry.id} 
                      fill={filterCompany === entry.company ? '#991b1b' : COLORS.primary}
                      opacity={filterCompany && filterCompany !== entry.company ? 0.4 : 1}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center justify-between">
            Revenue by Sector
            <span className="text-xs font-normal text-gray-400">Click slice to filter</span>
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sectorData.slice(0, 8)}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name.substring(0, 10)}${name.length > 10 ? '..' : ''} ${(percent * 100).toFixed(0)}%`}
                  labelLine={true}
                  onClick={(data) => {
                    if (data && data.name) {
                      setFilterSector(filterSector === data.name ? null : data.name);
                    }
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  {sectorData.slice(0, 8).map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={SECTOR_COLORS[entry.name] || SECTOR_COLORS.default}
                      opacity={filterSector && filterSector !== entry.name ? 0.4 : 1}
                      stroke={filterSector === entry.name ? '#000' : 'none'}
                      strokeWidth={filterSector === entry.name ? 2 : 0}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center justify-between">
            Contract Type Split
            <span className="text-xs font-normal text-gray-400">Click slice to filter</span>
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={contractTypeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  onClick={(data) => {
                    if (data && data.name) {
                      const type = data.name === 'Cash' ? 'CASH' : 'CM';
                      setFilterContractType(filterContractType === type ? null : type);
                    }
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  {contractTypeData.map((entry, index) => {
                    const type = entry.name === 'Cash' ? 'CASH' : 'CM';
                    return (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.fill}
                        opacity={filterContractType && filterContractType !== type ? 0.4 : 1}
                        stroke={filterContractType === type ? '#000' : 'none'}
                        strokeWidth={filterContractType === type ? 2 : 0}
                      />
                    );
                  })}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Revenue Reconciliation</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reconciliationData} layout="vertical" margin={{ left: 10, right: 30 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis type="number" tickFormatter={formatCompactCurrency} tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 10 }} />
                <Tooltip 
                  formatter={(value: number) => [formatCurrency(value), 'Value']}
                  contentStyle={{ fontSize: '12px' }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {reconciliationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Monthly Cash Flow Projection</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={formatCompactCurrency} tick={{ fontSize: 11 }} />
              <Tooltip 
                formatter={(value: number) => [formatCurrency(value), 'Projected']}
                contentStyle={{ fontSize: '12px' }}
              />
              <Bar dataKey="value" fill={COLORS.secondary} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center justify-between">
          <span>Sponsor Portfolio {hasActiveFilter && <span className="text-sm font-normal text-amber-600">({tableFilteredData.length} filtered)</span>}</span>
          {hasActiveFilter && (
            <button 
              onClick={clearAllFilters}
              className="text-xs font-medium text-gray-500 hover:text-gray-700 flex items-center gap-1"
            >
              <X size={14} /> Clear filters
            </button>
          )}
        </h3>
        <div className="overflow-x-auto max-h-96">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-white">
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Company</th>
                <th className="text-center py-3 px-2 font-semibold text-gray-600">Tier</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Sector</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Type</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-600">Value</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-600">Deal Quality</th>
              </tr>
            </thead>
            <tbody>
              {(hasActiveFilter ? tableFilteredData : topSponsors.slice(0, 15)).map((sponsor, idx) => {
                const tier = getSponsorTier(sponsor.commercialValue);
                const quality = getDealQuality(sponsor.delta, sponsor.commercialValue);
                const QualityIcon = quality.icon;
                return (
                <tr 
                  key={sponsor.id} 
                  className="border-b border-gray-50 hover:bg-red-50 transition-colors cursor-pointer group"
                  onClick={() => setSelectedSponsor(sponsor)}
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold text-gray-600 group-hover:bg-red-100 group-hover:text-red-700 transition-colors">
                        {idx + 1}
                      </span>
                      <span className="font-medium text-gray-900 group-hover:text-red-700 transition-colors">{sponsor.company}</span>
                      <ArrowRight size={14} className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </td>
                  <td className="py-3 px-2 text-center">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold ${tier.bgColor} ${tier.textColor}`}>
                      {tier.name}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <button 
                      onClick={() => setFilterSector(filterSector === (sponsor.sector || 'Other') ? null : (sponsor.sector || 'Other'))}
                      className="px-2 py-0.5 rounded-full text-xs font-medium hover:ring-2 hover:ring-offset-1 transition-all"
                      style={{ 
                        backgroundColor: `${SECTOR_COLORS[sponsor.sector] || SECTOR_COLORS.default}20`,
                        color: SECTOR_COLORS[sponsor.sector] || SECTOR_COLORS.default
                      }}
                    >
                      {sponsor.sector || 'Other'}
                    </button>
                  </td>
                  <td className="py-3 px-4">
                    <button 
                      onClick={() => setFilterContractType(filterContractType === sponsor.contractType ? null : sponsor.contractType)}
                      className={`px-2 py-0.5 rounded-full text-xs font-medium hover:ring-2 hover:ring-offset-1 transition-all ${
                        sponsor.contractType === 'CASH' 
                          ? 'bg-green-50 text-green-700' 
                          : 'bg-purple-50 text-purple-700'
                      }`}
                    >
                      {sponsor.contractType}
                    </button>
                  </td>
                  <td className="py-3 px-4 text-right font-medium text-gray-900">
                    {formatCompactCurrency(sponsor.commercialValue)}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center gap-1.5 group relative">
                      <span className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 ${quality.bgColor} ${quality.color}`}>
                        <QualityIcon size={12} />
                        {quality.label}
                      </span>
                      <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs rounded-lg px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                        <p>Delta: {sponsor.delta >= 0 ? '+' : ''}{formatCompactCurrency(sponsor.delta)}</p>
                        <p className="text-slate-400">({((sponsor.delta / sponsor.commercialValue) * 100).toFixed(1)}% margin)</p>
                      </div>
                    </div>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sponsor Detail Modal */}
      {selectedSponsor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedSponsor(null)}>
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getSponsorTier(selectedSponsor.commercialValue).bgColor}`}>
                  <Building2 size={24} className="text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedSponsor.company}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${getSponsorTier(selectedSponsor.commercialValue).bgColor} ${getSponsorTier(selectedSponsor.commercialValue).textColor}`}>
                      {getSponsorTier(selectedSponsor.commercialValue).name}
                    </span>
                    <span className="text-sm text-gray-500">{selectedSponsor.sector || 'N/A'}</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${selectedSponsor.contractType === 'CASH' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'}`}>
                      {selectedSponsor.contractType}
                    </span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setSelectedSponsor(null)}
                className="w-10 h-10 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Contact & Contract Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-gray-600 mb-3 flex items-center gap-2">
                    <User size={16} /> Contact Information
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 w-16">Contact:</span>
                      <span className="font-medium text-gray-900">{selectedSponsor.contact || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 w-16">Email:</span>
                      <span className="font-medium text-gray-900">{selectedSponsor.email || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 w-16">Size:</span>
                      <span className="font-medium text-gray-900">{selectedSponsor.dimension || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-gray-600 mb-3 flex items-center gap-2">
                    <Calendar size={16} /> Contract Details
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 w-16">Season:</span>
                      <span className="font-medium text-gray-900">{selectedSponsor.season}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 w-16">Duration:</span>
                      <span className="font-medium text-gray-900">{selectedSponsor.contractDuration || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 w-16">Level:</span>
                      <span className="font-medium text-gray-900">{selectedSponsor.level || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Financial Summary */}
              <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Financial Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(selectedSponsor.commercialValue)}</p>
                    <p className="text-xs text-gray-500 mt-1">Commercial Value</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(selectedSponsor.sponsorReconciliation)}</p>
                    <p className="text-xs text-gray-500 mt-1">Sponsorship</p>
                  </div>
                  <div className="text-center">
                    <p className={`text-2xl font-bold ${selectedSponsor.delta >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {selectedSponsor.delta >= 0 ? '+' : ''}{formatCurrency(selectedSponsor.delta)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Delta (Profit/Loss)</p>
                  </div>
                  <div className="text-center">
                    {(() => {
                      const quality = getDealQuality(selectedSponsor.delta, selectedSponsor.commercialValue);
                      const Icon = quality.icon;
                      return (
                        <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg ${quality.bgColor} ${quality.color}`}>
                          <Icon size={16} />
                          <span className="font-bold">{quality.label}</span>
                        </div>
                      );
                    })()}
                    <p className="text-xs text-gray-500 mt-1">Deal Quality</p>
                  </div>
                </div>
              </div>

              {/* Revenue Breakdown */}
              <div className="bg-white border border-gray-100 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Revenue Breakdown</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {[
                    { label: 'Sponsorship', value: selectedSponsor.sponsorReconciliation, color: 'bg-red-100 text-red-700' },
                    { label: 'VB (Youth)', value: selectedSponsor.vbReconciliation, color: 'bg-amber-100 text-amber-700' },
                    { label: 'CSR', value: selectedSponsor.csrReconciliation, color: 'bg-slate-100 text-slate-700' },
                    { label: 'Corp Tickets', value: selectedSponsor.corpTixReconciliation, color: 'bg-blue-100 text-blue-700' },
                    { label: 'GameDay', value: selectedSponsor.gamedayReconciliation * 15, color: 'bg-emerald-100 text-emerald-700' }
                  ].map(item => (
                    <div key={item.label} className={`rounded-lg p-3 ${item.color}`}>
                      <p className="text-lg font-bold">{formatCompactCurrency(item.value)}</p>
                      <p className="text-xs mt-1">{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Monthly Payment Schedule */}
              <div className="bg-white border border-gray-100 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <Clock size={16} /> Monthly Payment Schedule
                </h3>
                <div className="grid grid-cols-6 md:grid-cols-12 gap-2">
                  {selectedSponsorMonthly.map((month) => (
                    <div 
                      key={month.month}
                      className={`text-center p-2 rounded-lg border ${
                        month.isCurrent 
                          ? 'border-red-500 bg-red-50 ring-2 ring-red-200' 
                          : month.isPast 
                            ? 'border-gray-200 bg-gray-50' 
                            : 'border-blue-200 bg-blue-50'
                      }`}
                    >
                      <p className="text-[10px] font-medium text-gray-500">{month.name}</p>
                      <p className={`text-xs font-bold mt-1 ${month.value > 0 ? 'text-gray-900' : 'text-gray-300'}`}>
                        {month.value > 0 ? formatCompactCurrency(month.value) : '-'}
                      </p>
                      <div className="mt-1">
                        {month.isPast ? (
                          <CheckCircle size={12} className="mx-auto text-green-500" />
                        ) : month.isCurrent ? (
                          <Clock size={12} className="mx-auto text-red-500" />
                        ) : (
                          <Circle size={12} className="mx-auto text-blue-300" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><CheckCircle size={12} className="text-green-500" /> Paid</span>
                  <span className="flex items-center gap-1"><Clock size={12} className="text-red-500" /> Current</span>
                  <span className="flex items-center gap-1"><Circle size={12} className="text-blue-300" /> Upcoming</span>
                </div>
              </div>

              {/* Future Contracts */}
              {sponsorHistory.future.length > 0 && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-blue-700 mb-4 flex items-center gap-2">
                    <Calendar size={16} /> Future Contracts ({sponsorHistory.future.length} {sponsorHistory.future.length === 1 ? 'season' : 'seasons'})
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-blue-200">
                          <th className="text-left py-2 px-3 font-medium text-blue-600">Season</th>
                          <th className="text-left py-2 px-3 font-medium text-blue-600">Type</th>
                          <th className="text-right py-2 px-3 font-medium text-blue-600">Commercial Value</th>
                          <th className="text-right py-2 px-3 font-medium text-blue-600">Sponsorship</th>
                          <th className="text-right py-2 px-3 font-medium text-blue-600">Delta</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sponsorHistory.future.map((hist) => {
                          const histQuality = getDealQuality(hist.delta, hist.commercialValue);
                          return (
                            <tr key={hist.id} className="border-b border-blue-100 hover:bg-blue-100/50">
                              <td className="py-2 px-3">
                                <span className="font-medium text-blue-800 flex items-center gap-1">
                                  <Circle size={8} className="text-blue-400" />
                                  {hist.season}
                                </span>
                              </td>
                              <td className="py-2 px-3">
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${hist.contractType === 'CASH' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'}`}>
                                  {hist.contractType}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-right font-medium text-blue-900">{formatCurrency(hist.commercialValue)}</td>
                              <td className="py-2 px-3 text-right text-blue-800">{formatCurrency(hist.sponsorReconciliation)}</td>
                              <td className={`py-2 px-3 text-right font-medium ${hist.delta >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                {hist.delta >= 0 ? '+' : ''}{formatCompactCurrency(hist.delta)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr className="bg-blue-100/50 font-semibold">
                          <td className="py-2 px-3 text-blue-700">Future Total</td>
                          <td className="py-2 px-3"></td>
                          <td className="py-2 px-3 text-right text-blue-900">{formatCurrency(sponsorHistory.future.reduce((sum, h) => sum + h.commercialValue, 0))}</td>
                          <td className="py-2 px-3 text-right text-blue-800">{formatCurrency(sponsorHistory.future.reduce((sum, h) => sum + h.sponsorReconciliation, 0))}</td>
                          <td className="py-2 px-3 text-right text-emerald-600">
                            +{formatCompactCurrency(sponsorHistory.future.reduce((sum, h) => sum + h.delta, 0))}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}

              {/* Historical Data (Past Contracts) */}
              {sponsorHistory.past.length > 0 && (
                <div className="bg-white border border-gray-100 rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                    <History size={16} /> Past Contracts ({sponsorHistory.past.length} {sponsorHistory.past.length === 1 ? 'season' : 'seasons'})
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100">
                          <th className="text-left py-2 px-3 font-medium text-gray-600">Season</th>
                          <th className="text-left py-2 px-3 font-medium text-gray-600">Type</th>
                          <th className="text-right py-2 px-3 font-medium text-gray-600">Commercial Value</th>
                          <th className="text-right py-2 px-3 font-medium text-gray-600">Sponsorship</th>
                          <th className="text-right py-2 px-3 font-medium text-gray-600">Delta</th>
                          <th className="text-center py-2 px-3 font-medium text-gray-600">Quality</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sponsorHistory.past.map((hist) => {
                          const histQuality = getDealQuality(hist.delta, hist.commercialValue);
                          const HistIcon = histQuality.icon;
                          return (
                            <tr key={hist.id} className="border-b border-gray-50 hover:bg-gray-50">
                              <td className="py-2 px-3">
                                <span className="font-medium text-gray-600 flex items-center gap-1">
                                  <CheckCircle size={12} className="text-green-500" />
                                  {hist.season}
                                </span>
                              </td>
                              <td className="py-2 px-3">
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${hist.contractType === 'CASH' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'}`}>
                                  {hist.contractType}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-right font-medium">{formatCurrency(hist.commercialValue)}</td>
                              <td className="py-2 px-3 text-right">{formatCurrency(hist.sponsorReconciliation)}</td>
                              <td className={`py-2 px-3 text-right font-medium ${hist.delta >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                {hist.delta >= 0 ? '+' : ''}{formatCompactCurrency(hist.delta)}
                              </td>
                              <td className="py-2 px-3 text-center">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${histQuality.bgColor} ${histQuality.color}`}>
                                  <HistIcon size={10} /> {histQuality.label}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr className="bg-gray-50 font-semibold">
                          <td className="py-2 px-3 text-gray-700">Past Total</td>
                          <td className="py-2 px-3"></td>
                          <td className="py-2 px-3 text-right">{formatCurrency(sponsorHistory.past.reduce((sum, h) => sum + h.commercialValue, 0))}</td>
                          <td className="py-2 px-3 text-right">{formatCurrency(sponsorHistory.past.reduce((sum, h) => sum + h.sponsorReconciliation, 0))}</td>
                          <td className="py-2 px-3 text-right text-emerald-600">
                            +{formatCompactCurrency(sponsorHistory.past.reduce((sum, h) => sum + h.delta, 0))}
                          </td>
                          <td className="py-2 px-3"></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}

              {/* All-Time Summary */}
              {sponsorHistory.all.length > 1 && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-slate-700 mb-3">Lifetime Partnership Summary</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-slate-900">{sponsorHistory.all.length}</p>
                      <p className="text-xs text-slate-500">Total Seasons</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-slate-900">{formatCurrency(sponsorHistory.all.reduce((sum, h) => sum + h.commercialValue, 0))}</p>
                      <p className="text-xs text-slate-500">Total Value</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-600">{formatCurrency(sponsorHistory.all.reduce((sum, h) => sum + h.sponsorReconciliation, 0))}</p>
                      <p className="text-xs text-slate-500">Total Sponsorship</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-emerald-600">+{formatCurrency(sponsorHistory.all.reduce((sum, h) => sum + h.delta, 0))}</p>
                      <p className="text-xs text-slate-500">Lifetime Delta</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Bonus Info */}
              {selectedSponsor.bonusPlayoff > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-amber-800 mb-2 flex items-center gap-2">
                    <Award size={16} /> Playoff Bonus
                  </h3>
                  <p className="text-lg font-bold text-amber-700">{formatCurrency(selectedSponsor.bonusPlayoff)}</p>
                  <p className="text-xs text-amber-600 mt-1">Additional bonus if team qualifies for playoffs</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SponsorshipDashboard;
