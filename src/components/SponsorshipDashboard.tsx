import React, { useState, useMemo, useRef } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { SponsorData } from '../types';
import { Flag, DollarSign, Building2, ArrowUpRight, ChevronDown, Banknote, RefreshCw, FileSpreadsheet, X, Filter, Target, Ticket } from 'lucide-react';
import { SEASON_TARGET_SPONSORSHIP } from '../constants';

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
  if (value >= 1000000) return `€${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `€${(value / 1000).toFixed(0)}k`;
  return `€${value}`;
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
  
  const hasActiveFilter = filterCompany || filterSector || filterContractType;
  
  const clearAllFilters = () => {
    setFilterCompany(null);
    setFilterSector(null);
    setFilterContractType(null);
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
    if (filterCompany) {
      result = result.filter(d => d.company === filterCompany);
    }
    if (filterSector) {
      result = result.filter(d => (d.sector || 'Other') === filterSector);
    }
    if (filterContractType) {
      result = result.filter(d => d.contractType === filterContractType);
    }
    return result;
  }, [filteredData, filterCompany, filterSector, filterContractType]);

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
    
    // Adjusted values based on toggles
    const adjustedCommercial = totalCommercial 
      - (excludeCorpTix ? totalCorpTix : 0) 
      - (excludeGameDay ? totalGameday : 0)
      - (excludeVB ? totalVB : 0);
    const adjustedCash = totalCash 
      - (excludeCorpTix ? dataSource.filter(d => d.contractType === 'CASH').reduce((sum, d) => sum + d.corpTixReconciliation, 0) : 0)
      - (excludeGameDay ? dataSource.filter(d => d.contractType === 'CASH').reduce((sum, d) => sum + d.gamedayReconciliation, 0) * GAMES_PER_SEASON : 0)
      - (excludeVB ? dataSource.filter(d => d.contractType === 'CASH').reduce((sum, d) => sum + d.vbReconciliation, 0) : 0);
    const adjustedCM = totalCM 
      - (excludeCorpTix ? dataSource.filter(d => d.contractType === 'CM').reduce((sum, d) => sum + d.corpTixReconciliation, 0) : 0)
      - (excludeGameDay ? dataSource.filter(d => d.contractType === 'CM').reduce((sum, d) => sum + d.gamedayReconciliation, 0) * GAMES_PER_SEASON : 0)
      - (excludeVB ? dataSource.filter(d => d.contractType === 'CM').reduce((sum, d) => sum + d.vbReconciliation, 0) : 0);
    
    const pureSponsorship = totalSponsorRec + totalCSR;
    
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
    return [...filteredData]
      .sort((a, b) => b.commercialValue - a.commercialValue)
      .slice(0, 10);
  }, [filteredData]);

  const tableFilteredData = useMemo(() => {
    return [...chartFilteredData].sort((a, b) => b.commercialValue - a.commercialValue);
  }, [chartFilteredData]);

  const sectorData = useMemo(() => {
    const sectorMap: Record<string, { value: number, count: number }> = {};
    filteredData.forEach(d => {
      const sector = d.sector || 'Other';
      if (!sectorMap[sector]) sectorMap[sector] = { value: 0, count: 0 };
      sectorMap[sector].value += d.commercialValue;
      sectorMap[sector].count += 1;
    });
    return Object.entries(sectorMap)
      .map(([name, { value, count }]) => ({ name, value, count }))
      .sort((a, b) => b.value - a.value);
  }, [filteredData]);

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
      const total = filteredData.reduce((sum, d) => sum + (d.monthlyPayments[m] || 0), 0);
      return { name: monthLabels[i], value: total, month: m };
    });
  }, [filteredData]);

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
        
        <div className="flex items-center gap-3">
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
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={topSponsors} 
                layout="vertical" 
                margin={{ left: 10, right: 30 }}
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
                  width={120} 
                  tick={{ fontSize: 10 }}
                  tickFormatter={(v) => v.length > 18 ? v.substring(0, 18) + '...' : v}
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
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Sector</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Type</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-600">Commercial Value</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-600">Net of Ticketing</th>
              </tr>
            </thead>
            <tbody>
              {(hasActiveFilter ? tableFilteredData : topSponsors.slice(0, 15)).map((sponsor, idx) => (
                <tr key={sponsor.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold text-gray-600">
                        {idx + 1}
                      </span>
                      <span className="font-medium text-gray-900">{sponsor.company}</span>
                    </div>
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
                    {formatCurrency(sponsor.commercialValue)}
                  </td>
                  <td className="py-3 px-4 text-right text-gray-600">
                    {formatCurrency(sponsor.netOfTicketing)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SponsorshipDashboard;
