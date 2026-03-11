import React, { useState, useEffect, useMemo } from 'react';
import {
  Building2, CalendarDays, Euro, TrendingUp, AlertTriangle, CheckCircle2,
  Clock, Users, PartyPopper, Camera, GraduationCap, Trophy,
  ArrowRight, Shield, ChevronDown, ChevronUp,
  Landmark, MapPin, DollarSign,
  BarChart3, PieChart as PieChartIcon, Target,
  FileSpreadsheet, Loader2, Check, Settings, X
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';

const MODULE_KEY = 'venue_ops';
const SEASON_MONTHS = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
const COLORS_POOL = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#a855f7', '#14b8a6', '#f97316', '#ec4899', '#8b5cf6', '#6366f1'];

const formatCurrency = (val: number) => `€${val.toLocaleString('it-IT', { maximumFractionDigits: 0 })}`;
const formatCompact = (val: number) => {
  if (Math.abs(val) >= 10000) return `€${Math.round(val / 1000)}K`;
  if (Math.abs(val) >= 1000) return `€${(val / 1000).toFixed(1)}K`;
  return `€${Math.round(val)}`;
};

const parseEuro = (s: string): number => {
  if (!s || typeof s !== 'string') return 0;
  const cleaned = s.replace(/[€\s]/g, '').replace(/\./g, '').replace(',', '.');
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
};

interface MonthlyRevenueItem {
  name: string;
  values: number[];
  color: string;
  note: string;
}

export interface VenueOpsSheetData {
  monthlyRevenue: MonthlyRevenueItem[];
  seasonBudget: number;
}

const EMPTY_MONTHLY_REVENUE: MonthlyRevenueItem[] = [];

const DEFAULT_SEASON_BUDGET = 262364;

const FINANCIAL_NOTE = 'The revenue gap vs. budget is non-operational. It is driven by the VSE €100k right-to-equity conversion, shifting value from the P&L to the Balance Sheet. Operationally, the department is performing as expected, with all costs tracking on-budget for the first half of the season.';

const MONTHLY_OCCUPANCY = [
  { month: 'Jul', days: 0, total: 31, events: [] as { name: string; type: string }[] },
  { month: 'Aug', days: 1, total: 31, events: [{ name: 'Birthday Party', type: 'private' }] },
  { month: 'Sep', days: 2, total: 30, events: [{ name: '2 Friendly Games (Bergamo, Reggio Emilia)', type: 'game' }] },
  { month: 'Oct', days: 5, total: 31, events: [
    { name: '2 Serie A Games', type: 'game' },
    { name: '2 Birthday Parties', type: 'private' },
    { name: '1 Video Production (Carlo Recalcati Movie)', type: 'production' }
  ]},
  { month: 'Nov', days: 2, total: 30, events: [{ name: '2 Serie A Home Games', type: 'game' }] },
  { month: 'Dec', days: 8, total: 31, events: [
    { name: '1 Serie A Home Game', type: 'game' },
    { name: '3 Christmas Dinners (OJM, BSN, PV)', type: 'corporate' },
    { name: '1 Christmas Party (Varese Calcio)', type: 'corporate' },
    { name: '1 University Career Day (Municipality)', type: 'community' },
    { name: '2 Days Preparation', type: 'setup' }
  ]}
];

const EVENT_TYPE_COLORS: Record<string, { bg: string; text: string; icon: any }> = {
  game: { bg: 'bg-red-50 dark:bg-red-900/30', text: 'text-red-700', icon: Trophy },
  private: { bg: 'bg-purple-50 dark:bg-purple-900/30', text: 'text-purple-700', icon: PartyPopper },
  production: { bg: 'bg-blue-50 dark:bg-blue-900/30', text: 'text-blue-700', icon: Camera },
  corporate: { bg: 'bg-amber-50 dark:bg-amber-900/30', text: 'text-amber-700', icon: Building2 },
  community: { bg: 'bg-green-50 dark:bg-green-900/30', text: 'text-green-700', icon: GraduationCap },
  setup: { bg: 'bg-gray-50 dark:bg-gray-800', text: 'text-gray-500 dark:text-gray-400', icon: Clock }
};

const PIPELINE = {
  revenue: [
    { name: 'Minibasket Tournament Finals', date: 'Feb 22', revenue: 1500, extra: '+ Cleaning costs', status: 'confirmed' as const },
    { name: 'U13 Tournament', date: 'May 30 – Jun 2', revenue: 4000, extra: '€1.000/day + Cleaning (4 days)', status: 'confirmed' as const },
    { name: 'Foresteria Rental (Trofeo Garbosi)', date: 'Apr', revenue: 1200, extra: '3 days, 12 kids + 2 coaches', status: 'confirmed' as const },
    { name: 'Foresteria Rental (U13 Tournament)', date: 'May/Jun', revenue: 1200, extra: '3 days, 12 kids + 2 coaches', status: 'confirmed' as const },
    { name: 'Municipality Payment (H2)', date: 'Jan – Jun 2026', revenue: 48000, extra: 'Equal to H1 contribution', status: 'confirmed' as const },
  ],
  community: [
    { name: 'School Cup Finals – Middle Schools', date: 'Mar 27', status: 'confirmed' as const },
    { name: 'School Cup Finals – High Schools', date: 'Apr 24', status: 'confirmed' as const },
    { name: 'Trofeo Giovani Leggende – Final', date: 'Apr 5', status: 'confirmed' as const },
    { name: 'Trofeo Garbosi – Final', date: 'Apr 6', status: 'confirmed' as const },
  ],
  unrealized: [
    { name: 'RAI Production (4-Day Event)', date: 'Apr (TBD)', revenue: null as number | null, status: 'pending' as const, note: 'Full arena buyout for concert. Offer submitted, awaiting response. Final follow-up by mid-February.' },
    { name: 'Music Video Production', date: 'Cancelled', revenue: 2000, status: 'cancelled' as const, note: 'Client paid €2,000 non-refundable deposit but chose not to proceed. Deposit retained.' },
    { name: 'Dancing Event (Campus)', date: 'N/A', revenue: null as number | null, status: 'lost' as const, note: 'Court measurement standards not met (roof height).' },
  ]
};

const COMPLIANCE_ITEMS = [
  { name: 'RSPP (Safety Manager)', status: 'active', description: 'Monthly fixed fee – legally required' },
  { name: 'ODV (Supervisory Body)', status: 'active', description: 'Monthly fixed fee – legally required' },
  { name: 'Visiting Fan Section Upgrade', status: 'completed', description: 'Replaced metal cage with glass barrier system. Engineering certifications obtained.' },
];

const MONTH_ALIASES: Record<string, number> = {
  'jul': 0, 'july': 0, 'lug': 0, 'luglio': 0,
  'aug': 1, 'august': 1, 'ago': 1, 'agosto': 1,
  'sep': 2, 'sept': 2, 'september': 2, 'set': 2, 'settembre': 2,
  'oct': 3, 'october': 3, 'ott': 3, 'ottobre': 3,
  'nov': 4, 'november': 4, 'novembre': 4,
  'dec': 5, 'december': 5, 'dic': 5, 'dicembre': 5,
  'jan': 6, 'january': 6, 'gen': 6, 'gennaio': 6,
  'feb': 7, 'february': 7, 'febbraio': 7,
  'mar': 8, 'march': 8, 'marzo': 8,
  'apr': 9, 'april': 9, 'aprile': 9,
  'may': 10, 'maggio': 10, 'mag': 10,
  'jun': 11, 'june': 11, 'giu': 11, 'giugno': 11,
};

export function parseVenueOpsSheetData(rows: string[][]): VenueOpsSheetData | null {
  if (!rows || rows.length < 2) return null;

  const header = rows[0].map(h => (h || '').trim());
  const monthIndices: Record<number, number> = {};

  for (let c = 1; c < header.length; c++) {
    const h = header[c].toLowerCase().replace(/[^a-z]/g, '');
    if (MONTH_ALIASES[h] !== undefined) {
      monthIndices[c] = MONTH_ALIASES[h];
    }
  }

  const isMonthly = Object.keys(monthIndices).length >= 3;
  let seasonBudget = DEFAULT_SEASON_BUDGET;

  if (isMonthly) {
    const items: MonthlyRevenueItem[] = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;
      const label = (row[0] || '').trim();
      const lowerLabel = label.toLowerCase();

      if (['season budget', 'seasonbudget', 'budget'].includes(lowerLabel)) {
        seasonBudget = parseEuro(row[1] || '') || DEFAULT_SEASON_BUDGET;
        continue;
      }
      if (['', 'category', 'name', 'item', 'total', 'ytd', 'header'].includes(lowerLabel)) continue;

      const values = new Array(12).fill(0);
      let hasValue = false;
      for (const [colStr, monthIdx] of Object.entries(monthIndices)) {
        const col = parseInt(colStr);
        const val = parseEuro(row[col] || '');
        values[monthIdx] = val;
        if (val !== 0) hasValue = true;
      }

      if (hasValue) {
        items.push({
          name: label,
          values,
          color: COLORS_POOL[items.length % COLORS_POOL.length],
          note: '',
        });
      }
    }

    if (items.length === 0) return null;
    return { monthlyRevenue: items, seasonBudget };
  }

  let h1ActualRevenue = 0;
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;
    const label = (row[0] || '').trim().toLowerCase();
    if (['h1 actual revenue', 'h1 actual', 'actual revenue'].includes(label)) {
      h1ActualRevenue = parseEuro(row[1] || '');
    } else if (['season budget'].includes(label)) {
      seasonBudget = parseEuro(row[1] || '') || DEFAULT_SEASON_BUDGET;
    }
  }

  if (h1ActualRevenue > 0) {
    const items: MonthlyRevenueItem[] = [{
      name: 'Venue Revenue',
      values: SEASON_MONTHS.map((_, mi) => mi === 5 ? h1ActualRevenue : 0),
      color: COLORS_POOL[0],
      note: 'Imported from legacy format',
    }];
    return { monthlyRevenue: items, seasonBudget };
  }

  return null;
}

export const VenueOpsDashboard: React.FC = () => {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const { isAdmin } = useAuth();
  const isDark = theme === 'dark';
  const [expandedMonth, setExpandedMonth] = useState<string | null>('Dec');
  const [activeSection, setActiveSection] = useState<'overview' | 'pipeline'>('overview');

  const [sheetData, setSheetData] = useState<VenueOpsSheetData | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [showSheetConfig, setShowSheetConfig] = useState(false);
  const [sheetId, setSheetId] = useState('');
  const [sheetName, setSheetName] = useState('Venue Ops');
  const [sheetConfigured, setSheetConfigured] = useState(false);

  useEffect(() => {
    fetch(`/api/revenue/sheet-config/${MODULE_KEY}`)
      .then(r => r.json())
      .then(res => {
        if (res.success) {
          if (res.sheetId) { setSheetId(res.sheetId); setSheetConfigured(true); }
          if (res.sheetName) setSheetName(res.sheetName);
        }
      })
      .catch(() => {});
    fetch(`/api/revenue/sheet-data/${MODULE_KEY}`)
      .then(r => r.json())
      .then(res => {
        if (res.success && res.data) {
          const parsed = parseVenueOpsSheetData(res.data);
          if (parsed) setSheetData(parsed);
        }
      })
      .catch(() => {});
  }, []);

  const handleSyncSheet = async () => {
    setIsSyncing(true);
    setSyncSuccess(false);
    try {
      const res = await fetch(`/api/revenue/sync-sheet/${MODULE_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const result = await res.json();
      if (result.success) {
        const parsed = parseVenueOpsSheetData(result.data);
        if (parsed) setSheetData(parsed);
        setSyncSuccess(true);
        setTimeout(() => setSyncSuccess(false), 3000);
      } else {
        alert(result.message || 'Sync failed');
      }
    } catch (err) {
      console.error('Sheet sync failed:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSaveSheetConfig = async () => {
    if (!sheetId.trim()) return;
    try {
      const res = await fetch(`/api/revenue/sheet-config/${MODULE_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sheetId: sheetId.trim(), sheetName: sheetName.trim() }),
      });
      const result = await res.json();
      if (result.success) {
        setSheetConfigured(true);
        setShowSheetConfig(false);
      }
    } catch (err) {
      console.error('Config save failed:', err);
    }
  };

  const monthlyRevenue = sheetData?.monthlyRevenue || EMPTY_MONTHLY_REVENUE;
  const seasonBudget = sheetData?.seasonBudget || DEFAULT_SEASON_BUDGET;
  const hasLiveData = !!sheetData;

  const monthlyTotals = useMemo(() =>
    SEASON_MONTHS.map((_, mi) => monthlyRevenue.reduce((s, item) => s + item.values[mi], 0)),
    [monthlyRevenue]
  );

  const ytd = monthlyTotals.reduce((s, v) => s + v, 0);
  const pctOfBudget = (ytd / seasonBudget) * 100;

  const lastActiveMonth = useMemo(() => {
    for (let i = 11; i >= 0; i--) {
      if (monthlyTotals[i] > 0) return i;
    }
    return -1;
  }, [monthlyTotals]);

  const itemYTDs = useMemo(() =>
    monthlyRevenue.map(item => item.values.reduce((s, v) => s + v, 0)),
    [monthlyRevenue]
  );

  const revenueChartData = useMemo(() =>
    SEASON_MONTHS.map((name, i) => ({
      name,
      total: monthlyTotals[i],
    })).slice(0, Math.max(lastActiveMonth + 2, 7)),
    [monthlyTotals, lastActiveMonth]
  );

  const totalOccupiedDays = MONTHLY_OCCUPANCY.reduce((s, m) => s + m.days, 0);
  const totalDays = MONTHLY_OCCUPANCY.reduce((s, m) => s + m.total, 0);
  const occupancyRate = ((totalOccupiedDays / totalDays) * 100).toFixed(1);

  const totalPipelineRevenue = PIPELINE.revenue.reduce((s, e) => s + e.revenue, 0);

  const eventTypeBreakdown = MONTHLY_OCCUPANCY.flatMap(m => m.events).reduce((acc, e) => {
    acc[e.type] = (acc[e.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(eventTypeBreakdown).map(([type, count]) => ({
    name: type.charAt(0).toUpperCase() + type.slice(1),
    value: count
  }));

  const PIE_COLORS = ['#ef4444', '#a855f7', '#3b82f6', '#f59e0b', '#22c55e', '#94a3b8'];

  const occupancyChartData = MONTHLY_OCCUPANCY.map(m => ({
    name: m.month,
    occupied: m.days,
    available: m.total - m.days
  }));

  const cardClass = `rounded-xl border shadow-sm p-5 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('Venue Operations')}</h1>
          <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Season 25-26 · {t('Monthly Revenue')} · {t('Through')} {SEASON_MONTHS[lastActiveMonth] || '—'}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {isAdmin && (
            <button
              onClick={sheetConfigured ? handleSyncSheet : () => setShowSheetConfig(true)}
              disabled={isSyncing}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all border ${
                syncSuccess
                  ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600'
                  : isDark
                    ? 'border-gray-700 bg-gray-800 hover:bg-gray-700 text-gray-300'
                    : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-600'
              }`}
              title={sheetConfigured ? t('Sync from Google Sheets') : t('Connect Google Sheet')}
            >
              {isSyncing ? <Loader2 size={14} className="animate-spin" /> : syncSuccess ? <Check size={14} /> : <FileSpreadsheet size={14} className="text-green-600" />}
              {isSyncing ? t('Syncing...') : syncSuccess ? t('Synced') : sheetConfigured ? t('Sync Sheet') : t('Connect Sheet')}
            </button>
          )}
          {isAdmin && sheetConfigured && (
            <button
              onClick={() => setShowSheetConfig(true)}
              className={`p-2 rounded-lg transition-all border ${isDark ? 'border-gray-700 bg-gray-800 hover:bg-gray-700 text-gray-400' : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-400'}`}
              title={t('Sheet settings')}
            >
              <Settings size={14} />
            </button>
          )}
          {hasLiveData && (
            <span className="text-[9px] px-1.5 py-0.5 rounded border bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400">
              {t('Live Data')}
            </span>
          )}
          {(['overview', 'pipeline'] as const).map(section => (
            <button
              key={section}
              onClick={() => setActiveSection(section)}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeSection === section
                  ? 'bg-slate-800 text-white shadow-md'
                  : isDark ? 'bg-gray-900 text-gray-400 border border-gray-700 hover:bg-gray-800' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {section === 'overview' ? t('Overview') : t('Event Pipeline')}
            </button>
          ))}
        </div>
      </div>

      {activeSection === 'overview' && (
        <>
          <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-6 text-white">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{t('YTD Revenue')}</p>
                <p className="text-4xl font-bold">{formatCurrency(ytd)}</p>
                <p className="text-xs text-gray-400 mt-1">{t('Through')} {SEASON_MONTHS[lastActiveMonth] || '—'} · {lastActiveMonth + 1}/12 {t('months')}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{t('Season Budget')}</p>
                <p className="text-4xl font-bold text-gray-300">{formatCurrency(seasonBudget)}</p>
                <div className="w-full bg-gray-700 h-2 rounded-full mt-3 overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full" style={{ width: `${Math.min(pctOfBudget, 100).toFixed(1)}%` }}></div>
                </div>
                <p className="text-[10px] text-gray-500 mt-1">{pctOfBudget.toFixed(1)}% {t('of target')}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{t('H2 Confirmed Pipeline')}</p>
                <p className="text-4xl font-bold text-green-400">{formatCurrency(totalPipelineRevenue)}</p>
                <p className="text-xs text-gray-400 mt-1">{t('Projected Total')}: {formatCurrency(ytd + totalPipelineRevenue)}</p>
              </div>
            </div>
          </div>

          <div className={cardClass}>
            <h3 className={`text-sm font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>{t('Monthly Revenue Breakdown')}</h3>
            <div className="overflow-x-auto -mx-5 px-5">
              <table className="w-full text-xs min-w-[700px]">
                <thead>
                  <tr className={`border-b ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
                    <th className={`text-left py-2.5 px-2 font-semibold sticky left-0 z-10 ${isDark ? 'bg-gray-900 text-gray-400' : 'bg-white text-gray-500'}`}>{t('Revenue Line')}</th>
                    {SEASON_MONTHS.map((m, i) => (
                      <th key={m} className={`text-right py-2.5 px-1.5 font-semibold whitespace-nowrap ${i > lastActiveMonth ? 'opacity-30' : ''} ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{m}</th>
                    ))}
                    <th className={`text-right py-2.5 px-2 font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>YTD</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyRevenue.map((item, ri) => (
                    <tr key={ri} className={`border-b ${isDark ? 'border-gray-800/50' : 'border-gray-50'}`}>
                      <td className={`py-2.5 px-2 sticky left-0 z-10 ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                          <span className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>{item.name}</span>
                        </div>
                      </td>
                      {item.values.map((v, mi) => (
                        <td key={mi} className={`text-right py-2.5 px-1.5 tabular-nums ${mi > lastActiveMonth ? 'opacity-30' : ''} ${v > 0 ? (isDark ? 'text-gray-200 font-medium' : 'text-gray-800 font-medium') : (isDark ? 'text-gray-700' : 'text-gray-300')}`}>
                          {v > 0 ? formatCompact(v) : '—'}
                        </td>
                      ))}
                      <td className={`text-right py-2.5 px-2 font-bold tabular-nums ${isDark ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(itemYTDs[ri])}</td>
                    </tr>
                  ))}
                  <tr className={`border-t-2 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                    <td className={`py-2.5 px-2 font-bold sticky left-0 z-10 ${isDark ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>{t('Total')}</td>
                    {monthlyTotals.map((v, mi) => (
                      <td key={mi} className={`text-right py-2.5 px-1.5 font-bold tabular-nums ${mi > lastActiveMonth ? 'opacity-30' : ''} ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {v > 0 ? formatCompact(v) : '—'}
                      </td>
                    ))}
                    <td className="text-right py-2.5 px-2 font-bold tabular-nums text-emerald-600">{formatCurrency(ytd)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className={cardClass}>
              <h3 className={`text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2 ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>
                <BarChart3 size={16} className="text-blue-600" />
                {t('Monthly Revenue Trend')}
              </h3>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueChartData} barSize={28}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#f0f0f0'} vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: isDark ? '#9ca3af' : '#6b7280' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `€${(v / 1000).toFixed(0)}K`} width={50} />
                    <Tooltip
                      cursor={{ fill: 'rgba(0,0,0,0.04)' }}
                      contentStyle={{ borderRadius: '8px', fontSize: '12px', backgroundColor: isDark ? '#1f2937' : '#fff', border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`, color: isDark ? '#f3f4f6' : '#111827' }}
                      formatter={(value: number) => [formatCurrency(value), t('Revenue')]}
                    />
                    <Bar dataKey="total" radius={[6, 6, 0, 0]} fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className={cardClass}>
              <div className="flex items-center justify-between mb-3">
                <p className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('Summary')}</p>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('Arena Occupancy')}</span>
                  <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{occupancyRate}% ({totalOccupiedDays}/{totalDays} {t('days')})</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('Campus Status')}</span>
                  <span className="text-sm font-bold text-green-600 flex items-center gap-1"><CheckCircle2 size={12} /> {t('Active')}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('H2 Pipeline')}</span>
                  <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(totalPipelineRevenue)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('Season Projection')}</span>
                  <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(ytd + totalPipelineRevenue)}</span>
                </div>
                <div className={`pt-3 border-t ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('Gap to Budget')}</span>
                    <span className={`text-sm font-bold ${seasonBudget - ytd > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {seasonBudget - ytd > 0 ? `-${formatCurrency(seasonBudget - ytd)}` : `+${formatCurrency(ytd - seasonBudget)}`}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className={`rounded-xl border p-4 ${isDark ? 'bg-amber-900/30 border-amber-800' : 'bg-amber-50 border-amber-200'}`}>
            <div className="flex items-start gap-3">
              <AlertTriangle size={18} className="text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className={`text-sm font-semibold mb-1 ${isDark ? 'text-amber-400' : 'text-amber-800'}`}>{t('Financial Note')}</p>
                <p className={`text-xs leading-relaxed ${isDark ? 'text-amber-300/80' : 'text-amber-700'}`}>{t(FINANCIAL_NOTE)}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className={cardClass}>
              <h3 className={`text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2 ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>
                <BarChart3 size={16} className="text-blue-600" />
                {t('Monthly Arena Usage')}
              </h3>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={occupancyChartData} margin={{ left: 0, right: 10, top: 5, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#f0f0f0'} />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: isDark ? '#9ca3af' : '#6b7280' }} />
                    <YAxis tick={{ fontSize: 12, fill: isDark ? '#9ca3af' : '#6b7280' }} />
                    <Tooltip
                      formatter={(value: number, name: string) => [
                        `${value} ${t('days')}`,
                        name === 'occupied' ? t('Used') : t('Available')
                      ]}
                      contentStyle={{ borderRadius: '8px', border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`, fontSize: '12px', backgroundColor: isDark ? '#1f2937' : '#fff', color: isDark ? '#f3f4f6' : '#111827' }}
                    />
                    <Bar dataKey="occupied" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} name={t('Used')} />
                    <Bar dataKey="available" stackId="a" fill={isDark ? '#374151' : '#e5e7eb'} radius={[4, 4, 0, 0]} name={t('Available')} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className={cardClass}>
              <h3 className={`text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2 ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>
                <PieChartIcon size={16} className="text-purple-600" />
                {t('Event Type Breakdown')}
              </h3>
              <div className="h-[220px] flex items-center">
                <div className="w-1/2 h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value" paddingAngle={3}>
                        {pieData.map((_, idx) => (
                          <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number, name: string) => [`${value} ${t('events')}`, name]}
                        contentStyle={{ borderRadius: '8px', border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`, fontSize: '12px', backgroundColor: isDark ? '#1f2937' : '#fff', color: isDark ? '#f3f4f6' : '#111827' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-1/2 space-y-2">
                  {pieData.map((entry, idx) => {
                    const typeKey = entry.name.toLowerCase();
                    const config = EVENT_TYPE_COLORS[typeKey] || EVENT_TYPE_COLORS.setup;
                    const Icon = config.icon;
                    return (
                      <div key={idx} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}></div>
                        <Icon size={12} className={config.text} />
                        <span className={`text-xs ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>{entry.name}</span>
                        <span className={`text-xs font-bold ml-auto ${isDark ? 'text-white' : 'text-gray-900'}`}>{entry.value}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className={cardClass}>
            <h3 className={`text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2 ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>
              <CalendarDays size={16} className="text-blue-600" />
              {t('Monthly Event Detail')}
            </h3>
            <div className="space-y-2">
              {MONTHLY_OCCUPANCY.map(m => (
                <div key={m.month} className={`border rounded-lg overflow-hidden ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
                  <button
                    onClick={() => setExpandedMonth(expandedMonth === m.month ? null : m.month)}
                    className={`w-full flex items-center justify-between px-4 py-3 transition-colors ${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-50'}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`text-sm font-bold w-8 ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>{m.month}</span>
                      <div className="flex items-center gap-2">
                        <div className={`w-24 h-2 rounded-full overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                          <div
                            className={`h-full rounded-full ${m.days > 0 ? 'bg-blue-500' : isDark ? 'bg-gray-700' : 'bg-gray-200'}`}
                            style={{ width: `${(m.days / m.total) * 100}%` }}
                          ></div>
                        </div>
                        <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{m.days}/{m.total} {t('days')}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-medium ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{m.events.length} {m.events.length !== 1 ? t('events') : t('event')}</span>
                      {expandedMonth === m.month ? <ChevronUp size={14} className={isDark ? 'text-gray-500' : 'text-gray-400'} /> : <ChevronDown size={14} className={isDark ? 'text-gray-500' : 'text-gray-400'} />}
                    </div>
                  </button>
                  {expandedMonth === m.month && m.events.length > 0 && (
                    <div className={`px-4 pb-3 space-y-2 border-t ${isDark ? 'border-gray-800' : 'border-gray-50'}`}>
                      {m.events.map((e, idx) => {
                        const config = EVENT_TYPE_COLORS[e.type] || EVENT_TYPE_COLORS.setup;
                        const Icon = config.icon;
                        return (
                          <div key={idx} className={`flex items-center gap-2 px-3 py-2 rounded-lg ${config.bg}`}>
                            <Icon size={14} className={config.text} />
                            <span className={`text-xs font-medium ${config.text}`}>{e.name}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {expandedMonth === m.month && m.events.length === 0 && (
                    <div className={`px-4 pb-3 border-t ${isDark ? 'border-gray-800' : 'border-gray-50'}`}>
                      <p className={`text-xs italic py-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{t('No events scheduled')}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className={cardClass}>
            <h3 className={`text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2 ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>
              <Shield size={16} className="text-green-600" />
              {t('Compliance & Safety')}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {COMPLIANCE_ITEMS.map((item, idx) => (
                <div key={idx} className={`p-4 rounded-lg border ${item.status === 'completed' ? (isDark ? 'border-green-800 bg-green-900/30' : 'border-green-200 bg-green-50') : (isDark ? 'border-blue-800 bg-blue-900/30' : 'border-blue-200 bg-blue-50')}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 size={14} className={item.status === 'completed' ? 'text-green-600' : 'text-blue-600'} />
                    <span className={`text-xs font-bold uppercase ${item.status === 'completed' ? 'text-green-700' : 'text-blue-700'}`}>
                      {item.status === 'completed' ? t('Completed') : t('Active')}
                    </span>
                  </div>
                  <p className={`text-sm font-semibold mb-1 ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>{t(item.name)}</p>
                  <p className={`text-xs leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t(item.description)}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {activeSection === 'pipeline' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className={`${cardClass} border-t-4 border-t-green-500`}>
              <p className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('Confirmed Revenue')}</p>
              <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(totalPipelineRevenue)}</p>
              <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{PIPELINE.revenue.length} {t('revenue events')}</p>
            </div>
            <div className={`${cardClass} border-t-4 border-t-blue-500`}>
              <p className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('Community Events')}</p>
              <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{PIPELINE.community.length}</p>
              <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{t('Zero cost to club (organizers cover expenses)')}</p>
            </div>
            <div className={`${cardClass} border-t-4 border-t-amber-500`}>
              <p className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('Unrealized / Lost')}</p>
              <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{PIPELINE.unrealized.length}</p>
              <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{formatCurrency(2000)} {t('deposit retained')}</p>
            </div>
          </div>

          <div className={cardClass}>
            <h3 className={`text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2 ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>
              <DollarSign size={16} className="text-green-600" />
              {t('Revenue-Generating Events')}
            </h3>
            <div className="space-y-3">
              {PIPELINE.revenue.map((event, idx) => (
                <div key={idx} className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${isDark ? 'bg-green-900/20 border-green-800 hover:bg-green-900/30' : 'bg-green-50/50 border-green-100 hover:bg-green-50'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDark ? 'bg-green-900/30' : 'bg-green-100'}`}>
                      <Euro size={18} className="text-green-700" />
                    </div>
                    <div>
                      <p className={`text-sm font-semibold ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>{event.name}</p>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{event.extra}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-700">{formatCurrency(event.revenue)}</p>
                    <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{event.date}</p>
                  </div>
                </div>
              ))}
              <div className={`flex items-center justify-between p-3 rounded-lg border ${isDark ? 'bg-green-900/30 border-green-800' : 'bg-green-100 border-green-200'}`}>
                <span className={`text-sm font-bold ${isDark ? 'text-green-400' : 'text-green-800'}`}>{t('Total Confirmed Revenue')}</span>
                <span className={`text-lg font-bold ${isDark ? 'text-green-400' : 'text-green-800'}`}>{formatCurrency(totalPipelineRevenue)}</span>
              </div>
            </div>
          </div>

          <div className={cardClass}>
            <h3 className={`text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2 ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>
              <Users size={16} className="text-blue-600" />
              {t('Community Events (Zero Net Cost)')}
            </h3>
            <p className={`text-xs mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('Organizers cover all operational expenses (cleaning, utilities, staff), ensuring zero loss for the club.')}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PIPELINE.community.map((event, idx) => (
                <div key={idx} className={`flex items-center gap-3 p-3 rounded-lg border ${isDark ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50/50 border-blue-100'}`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-blue-900/30' : 'bg-blue-100'}`}>
                    <Trophy size={14} className="text-blue-700" />
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>{event.name}</p>
                    <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{event.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={cardClass}>
            <h3 className={`text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2 ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>
              <AlertTriangle size={16} className="text-amber-600" />
              {t('Unrealized & Pending Opportunities')}
            </h3>
            <div className="space-y-3">
              {PIPELINE.unrealized.map((opp, idx) => {
                const statusColors = {
                  pending: { bg: isDark ? 'bg-amber-900/20' : 'bg-amber-50', border: isDark ? 'border-amber-800' : 'border-amber-200', badge: isDark ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-100 text-amber-800' },
                  cancelled: { bg: isDark ? 'bg-red-900/20' : 'bg-red-50', border: isDark ? 'border-red-800' : 'border-red-200', badge: isDark ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-800' },
                  lost: { bg: isDark ? 'bg-gray-800' : 'bg-gray-50', border: isDark ? 'border-gray-700' : 'border-gray-200', badge: isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700' }
                };
                const colors = statusColors[opp.status];
                return (
                  <div key={idx} className={`p-4 rounded-lg border ${colors.bg} ${colors.border}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-sm font-semibold ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>{opp.name}</span>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${colors.badge}`}>{opp.status}</span>
                    </div>
                    <p className={`text-xs leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{opp.note}</p>
                    <div className={`flex items-center gap-4 mt-2 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                      <span>{opp.date}</span>
                      {opp.revenue !== null && <span className="font-medium">{formatCurrency(opp.revenue)}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {isAdmin && showSheetConfig && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]" onClick={() => setShowSheetConfig(false)}>
          <div className={`rounded-xl shadow-2xl w-full max-w-md mx-4 ${isDark ? 'bg-gray-900 border border-gray-700' : 'bg-white border border-gray-200'}`} onClick={e => e.stopPropagation()}>
            <div className={`flex items-center justify-between p-5 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex items-center gap-2">
                <FileSpreadsheet size={18} className="text-green-600" />
                <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('Google Sheet Configuration')}</h3>
              </div>
              <button onClick={() => setShowSheetConfig(false)} className={`p-1 rounded ${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}>
                <X size={16} className="text-gray-500" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{t('Spreadsheet ID')}</label>
                <input
                  type="text"
                  value={sheetId}
                  onChange={e => setSheetId(e.target.value)}
                  placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms"
                  className={`w-full px-3 py-2 rounded-lg border text-sm ${isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}`}
                />
                <p className="text-[10px] text-gray-400 mt-1">{t('Found in the Google Sheets URL between /d/ and /edit')}</p>
              </div>
              <div>
                <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{t('Sheet Tab Name')}</label>
                <input
                  type="text"
                  value={sheetName}
                  onChange={e => setSheetName(e.target.value)}
                  placeholder="Venue Ops"
                  className={`w-full px-3 py-2 rounded-lg border text-sm ${isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}`}
                />
              </div>
            </div>
            <div className={`flex justify-end gap-2 p-5 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <button onClick={() => setShowSheetConfig(false)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${isDark ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'}`}>{t('Cancel')}</button>
              <button
                onClick={handleSaveSheetConfig}
                disabled={!sheetId.trim()}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >{t('Save & Connect')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};