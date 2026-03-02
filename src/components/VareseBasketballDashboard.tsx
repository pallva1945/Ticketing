import React, { useState, useEffect } from 'react';
import { Euro, Trophy, Flag, Activity, TrendingUp, TrendingDown, CheckCircle2, Calendar, Target, Dumbbell, FileSpreadsheet, Loader2, Settings, X, Check, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';

const MODULE_KEY = 'vb_pnl';
const SEASON_MONTHS = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

const formatCurrency = (val: number) => `€${Math.abs(val).toLocaleString('it-IT', { maximumFractionDigits: 0 })}`;
const formatCurrencySign = (val: number) => val < 0 ? `(${formatCurrency(val)})` : formatCurrency(val);

const parseEuro = (s: string): number => {
  if (!s || typeof s !== 'string') return 0;
  const cleaned = s.replace(/[€\s]/g, '').replace(/\./g, '').replace(',', '.');
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
};

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

const SECTION_ALIASES: Record<string, string> = {
  'revenue': 'revenue', 'ricavi': 'revenue', 'sales': 'revenue', 'vendite': 'revenue',
  'cos': 'cos', 'cost of sales': 'cos', 'costo del venduto': 'cos', 'cogs': 'cos', 'cost of goods sold': 'cos',
  'sga': 'sga', 'sg&a': 'sga', 'selling general': 'sga', 'spese generali': 'sga', 'overheads': 'sga', 'overhead': 'sga',
};

const REVENUE_LINE_ALIASES: Record<string, string> = {
  'sponsorship': 'sponsorship', 'sponsor': 'sponsorship', 'sponsorizzazioni': 'sponsorship',
  'bops': 'bops', 'basketball operations': 'bops', 'b.ops': 'bops', 'basketball ops': 'bops',
  'gameday': 'gameday', 'game day': 'gameday', 'matchday': 'gameday', 'match day': 'gameday', 'ticketing': 'gameday',
  'ebp': 'ebp', 'elite basketball program': 'ebp', 'elite basketball': 'ebp',
};

const COS_LINE_ALIASES: Record<string, string> = {
  'bops': 'cos_bops', 'basketball operations': 'cos_bops', 'b.ops': 'cos_bops', 'basketball ops': 'cos_bops',
  'ebp': 'cos_ebp', 'elite basketball program': 'cos_ebp', 'elite basketball': 'cos_ebp',
};

const SGA_LINE_ALIASES: Record<string, string> = {
  'team ops': 'team_ops', 'team operations': 'team_ops', 'team oops': 'team_ops',
  'labor': 'labor', 'labour': 'labor', 'lavoro': 'labor', 'salaries': 'labor', 'stipendi': 'labor',
  'marketing': 'marketing', 'mktg': 'marketing',
  'office': 'office', 'ufficio': 'office',
  'utilities': 'utilities', 'utenze': 'utilities', 'maintenance': 'utilities',
  'professional services': 'professional_services', 'prof services': 'professional_services', 'consulenze': 'professional_services',
  'financial': 'financial', 'finance': 'financial', 'finanziario': 'financial',
};

export interface VbPnlLine {
  key: string;
  label: string;
  values: number[];
  total: number;
}

export interface VbPnlData {
  revenue: VbPnlLine[];
  cos: VbPnlLine[];
  sga: VbPnlLine[];
  monthCount: number;
}

export function parseVbPnlSheetData(rows: string[][]): VbPnlData | null {
  if (!rows || rows.length < 2) return null;

  const header = rows[0].map(h => (h || '').trim());
  const monthIndices: Record<number, number> = {};

  for (let c = 1; c < header.length; c++) {
    const h = header[c].toLowerCase().replace(/[^a-z]/g, '');
    if (MONTH_ALIASES[h] !== undefined) {
      monthIndices[c] = MONTH_ALIASES[h];
    }
  }

  if (Object.keys(monthIndices).length < 2) return null;

  let maxMonthIdx = -1;
  for (const idx of Object.values(monthIndices)) {
    if (idx > maxMonthIdx) maxMonthIdx = idx;
  }
  const monthCount = maxMonthIdx + 1;

  const revenue: VbPnlLine[] = [];
  const cos: VbPnlLine[] = [];
  const sga: VbPnlLine[] = [];

  let currentSection: 'revenue' | 'cos' | 'sga' | null = null;

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;
    const label = (row[0] || '').trim();
    if (!label) continue;
    const lowerLabel = label.toLowerCase().replace(/[^a-z& ]/g, '').trim();

    if (SECTION_ALIASES[lowerLabel]) {
      currentSection = SECTION_ALIASES[lowerLabel] as any;
      continue;
    }

    if (['total', 'totale', 'gross profit', 'ebitda', 'net income', 'subtotal'].some(skip => lowerLabel.startsWith(skip))) continue;
    if (!currentSection) continue;

    const values = new Array(12).fill(0);
    let hasValue = false;
    for (const [colStr, monthIdx] of Object.entries(monthIndices)) {
      const col = parseInt(colStr);
      const val = parseEuro(row[col] || '');
      values[monthIdx] = val;
      if (val !== 0) hasValue = true;
    }

    if (!hasValue) continue;

    const total = values.reduce((s: number, v: number) => s + v, 0);

    if (currentSection === 'revenue') {
      const key = REVENUE_LINE_ALIASES[lowerLabel] || lowerLabel.replace(/\s+/g, '_');
      revenue.push({ key, label, values, total });
    } else if (currentSection === 'cos') {
      const key = COS_LINE_ALIASES[lowerLabel] || `cos_${lowerLabel.replace(/\s+/g, '_')}`;
      cos.push({ key, label, values, total });
    } else if (currentSection === 'sga') {
      const key = SGA_LINE_ALIASES[lowerLabel] || `sga_${lowerLabel.replace(/\s+/g, '_')}`;
      sga.push({ key, label, values, total });
    }
  }

  if (revenue.length === 0 && cos.length === 0 && sga.length === 0) return null;

  return { revenue, cos, sga, monthCount };
}

const COLORS = {
  sponsorship: '#3b82f6',
  bops: '#10b981',
  gameday: '#6366f1',
  ebp: '#a855f7',
  cos_bops: '#ef4444',
  cos_ebp: '#f97316',
  team_ops: '#ec4899',
  labor: '#8b5cf6',
  marketing: '#f59e0b',
  office: '#06b6d4',
  utilities: '#84cc16',
  professional_services: '#64748b',
  financial: '#d946ef',
};

const getColor = (key: string): string => (COLORS as any)[key] || '#6b7280';

type Section = 'overview' | 'revenue' | 'costs' | 'pnl';

export const VareseBasketballDashboard: React.FC = () => {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [activeSection, setActiveSection] = useState<Section>('overview');
  const [pnlData, setPnlData] = useState<VbPnlData | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [sheetId, setSheetId] = useState('');
  const [sheetName, setSheetName] = useState('');
  const [savedConfig, setSavedConfig] = useState({ sheetId: '', sheetName: '' });
  const [syncMessage, setSyncMessage] = useState('');

  useEffect(() => {
    Promise.all([
      fetch(`/api/revenue/sheet-data/${MODULE_KEY}`).then(r => r.json()).catch(() => ({ success: false })),
      fetch(`/api/revenue/sheet-config/${MODULE_KEY}`).then(r => r.json()).catch(() => ({ success: false })),
    ]).then(([dataRes, configRes]) => {
      if (dataRes.success && dataRes.data) {
        const parsed = parseVbPnlSheetData(dataRes.data);
        if (parsed) setPnlData(parsed);
      }
      if (configRes.success) {
        setSheetId(configRes.sheetId || '');
        setSheetName(configRes.sheetName || '');
        setSavedConfig({ sheetId: configRes.sheetId || '', sheetName: configRes.sheetName || '' });
      }
      setLoading(false);
    });
  }, []);

  const handleSaveConfig = async () => {
    try {
      await fetch(`/api/revenue/sheet-config/${MODULE_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sheetId, sheetName }),
      });
      setSavedConfig({ sheetId, sheetName });
      setShowConfig(false);
    } catch {}
  };

  const handleSync = async () => {
    setSyncing(true);
    setSyncMessage('');
    try {
      const res = await fetch(`/api/revenue/sync-sheet/${MODULE_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sheetId: savedConfig.sheetId || sheetId, sheetName: savedConfig.sheetName || sheetName }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        const parsed = parseVbPnlSheetData(json.data);
        if (parsed) {
          setPnlData(parsed);
          setSyncMessage(`Synced ${json.rowCount} rows`);
        } else {
          setSyncMessage('Could not parse sheet data. Check the format.');
        }
      } else {
        setSyncMessage(json.message || 'Sync failed');
      }
    } catch (e: any) {
      setSyncMessage(e.message || 'Sync error');
    }
    setSyncing(false);
    setTimeout(() => setSyncMessage(''), 4000);
  };

  const totalRevenue = pnlData ? pnlData.revenue.reduce((s, l) => s + l.total, 0) : 0;
  const totalCos = pnlData ? pnlData.cos.reduce((s, l) => s + l.total, 0) : 0;
  const totalSga = pnlData ? pnlData.sga.reduce((s, l) => s + l.total, 0) : 0;
  const grossProfit = totalRevenue - totalCos;
  const ebitda = grossProfit - totalSga;
  const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue * 100) : 0;
  const ebitdaMargin = totalRevenue > 0 ? (ebitda / totalRevenue * 100) : 0;
  const monthCount = pnlData?.monthCount || 7;

  const periodLabel = monthCount <= 6 ? 'Jul–Dec 2025' : `Jul 2025–${SEASON_MONTHS[monthCount - 1]} 2026`;

  const monthlyRevenueChart = pnlData ? SEASON_MONTHS.slice(0, monthCount).map((m, i) => {
    const entry: any = { month: m };
    let total = 0;
    pnlData.revenue.forEach(line => {
      entry[line.label] = line.values[i];
      total += line.values[i];
    });
    entry.total = total;
    return entry;
  }) : [];

  const revenueBreakdownChart = pnlData ? pnlData.revenue.map(l => ({
    name: l.label,
    value: l.total,
    color: getColor(l.key),
  })) : [];

  const costBreakdownChart = pnlData ? [
    ...pnlData.cos.map(l => ({ name: `CoS: ${l.label}`, value: l.total, color: getColor(l.key) })),
    ...pnlData.sga.map(l => ({ name: `SG&A: ${l.label}`, value: l.total, color: getColor(l.key) })),
  ] : [];

  const pnlTableData = (() => {
    if (!pnlData) return [];
    const rows: { label: string; values: number[]; total: number; isHeader?: boolean; isBold?: boolean }[] = [];

    rows.push({ label: 'Revenue', values: [], total: totalRevenue, isHeader: true });
    pnlData.revenue.forEach(l => rows.push({ label: `  ${l.label}`, values: l.values, total: l.total }));

    const revByMonth = new Array(12).fill(0);
    pnlData.revenue.forEach(l => l.values.forEach((v, i) => revByMonth[i] += v));
    rows.push({ label: 'Total Revenue', values: revByMonth, total: totalRevenue, isBold: true });

    rows.push({ label: 'Cost of Sales', values: [], total: totalCos, isHeader: true });
    pnlData.cos.forEach(l => rows.push({ label: `  ${l.label}`, values: l.values, total: l.total }));

    const cosByMonth = new Array(12).fill(0);
    pnlData.cos.forEach(l => l.values.forEach((v, i) => cosByMonth[i] += v));
    rows.push({ label: 'Total CoS', values: cosByMonth, total: totalCos, isBold: true });

    const gpByMonth = revByMonth.map((v, i) => v - cosByMonth[i]);
    rows.push({ label: 'Gross Profit', values: gpByMonth, total: grossProfit, isBold: true });

    rows.push({ label: 'SG&A', values: [], total: totalSga, isHeader: true });
    pnlData.sga.forEach(l => rows.push({ label: `  ${l.label}`, values: l.values, total: l.total }));

    const sgaByMonth = new Array(12).fill(0);
    pnlData.sga.forEach(l => l.values.forEach((v, i) => sgaByMonth[i] += v));
    rows.push({ label: 'Total SG&A', values: sgaByMonth, total: totalSga, isBold: true });

    const ebitdaByMonth = gpByMonth.map((v, i) => v - sgaByMonth[i]);
    rows.push({ label: 'EBITDA', values: ebitdaByMonth, total: ebitda, isBold: true });

    return rows;
  })();

  const SyncToolbar = () => (
    <div className="flex items-center gap-2 flex-wrap">
      {pnlData && (
        <span className="text-[10px] font-medium text-teal-600 bg-teal-50 dark:bg-teal-900/30 px-2 py-1 rounded-full flex items-center gap-1">
          <Check size={10} /> Google Sheet
        </span>
      )}
      <button onClick={handleSync} disabled={syncing || (!savedConfig.sheetId && !sheetId)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-semibold rounded-lg bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50 transition-colors">
        {syncing ? <Loader2 size={12} className="animate-spin" /> : <FileSpreadsheet size={12} />}
        {syncing ? t('Syncing...') : t('Sync Sheet')}
      </button>
      <button onClick={() => setShowConfig(!showConfig)}
        className={`p-1.5 rounded-lg transition-colors ${showConfig ? 'bg-teal-100 dark:bg-teal-900/40 text-teal-700' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
        <Settings size={14} />
      </button>
      {syncMessage && (
        <span className={`text-[10px] font-medium px-2 py-1 rounded ${syncMessage.includes('Synced') ? 'text-green-700 bg-green-50' : 'text-red-700 bg-red-50'}`}>
          {syncMessage}
        </span>
      )}
    </div>
  );

  const ConfigPanel = () => showConfig ? (
    <div className={`p-4 rounded-xl border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} shadow-sm`}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold text-gray-700 dark:text-gray-300">{t('Google Sheet Configuration')}</p>
        <button onClick={() => setShowConfig(false)} className="text-gray-400 hover:text-gray-600"><X size={14} /></button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] font-semibold text-gray-500 uppercase">{t('Spreadsheet ID')}</label>
          <input value={sheetId} onChange={e => setSheetId(e.target.value)}
            className="w-full mt-1 px-3 py-2 text-xs border rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700" placeholder="1BxiMVs0XRA5nFMdKvBd..." />
        </div>
        <div>
          <label className="text-[10px] font-semibold text-gray-500 uppercase">{t('Tab Name')}</label>
          <input value={sheetName} onChange={e => setSheetName(e.target.value)}
            className="w-full mt-1 px-3 py-2 text-xs border rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700" placeholder="P&L" />
        </div>
      </div>
      <button onClick={handleSaveConfig} disabled={!sheetId}
        className="mt-3 px-4 py-2 text-xs font-semibold rounded-lg bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50">
        {t('Save & Close')}
      </button>
    </div>
  ) : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="text-teal-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-teal-50 dark:bg-teal-900/30">
            <Trophy size={22} className="text-teal-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('Varese Basketball')}</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t('P&L')} – {periodLabel}</p>
          </div>
        </div>
        <SyncToolbar />
      </div>

      <ConfigPanel />

      {!pnlData ? (
        <div className={`text-center py-16 rounded-xl border-2 border-dashed ${isDark ? 'border-gray-700 bg-gray-900/50' : 'border-gray-200 bg-gray-50'}`}>
          <FileSpreadsheet size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-2">{t('Connect Your VB P&L')}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
            {t('Configure a Google Sheet with the Varese Basketball P&L to populate revenue, costs, and SG&A data.')}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
            {t('Expected structure: Sections (Revenue, CoS, SG&A) with line items in rows and months in columns.')}
          </p>
          <button onClick={() => setShowConfig(true)}
            className="px-6 py-3 text-sm font-semibold rounded-xl bg-teal-600 text-white hover:bg-teal-700 transition-colors">
            <FileSpreadsheet size={16} className="inline mr-2" />
            {t('Configure Google Sheet')}
          </button>
        </div>
      ) : (
        <>
          <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 pb-1">
            {(['overview', 'revenue', 'costs', 'pnl'] as const).map(section => (
              <button key={section} onClick={() => setActiveSection(section)}
                className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors ${activeSection === section ? 'bg-teal-600 text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                {section === 'overview' ? t('Executive Overview') : section === 'revenue' ? t('Revenue') : section === 'costs' ? t('Costs') : t('P&L')}
              </button>
            ))}
          </div>

          {activeSection === 'overview' && (
            <>
              <div className="bg-gradient-to-r from-teal-800 to-teal-900 rounded-xl p-6 text-white">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                  <div>
                    <p className="text-[10px] font-bold text-teal-300 uppercase tracking-wider mb-1">{t('Revenue')}</p>
                    <p className="text-3xl sm:text-4xl font-bold">{formatCurrency(totalRevenue)}</p>
                    <p className="text-xs text-teal-300/70 mt-1">{periodLabel}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-teal-300 uppercase tracking-wider mb-1">{t('Total Costs')}</p>
                    <p className="text-3xl sm:text-4xl font-bold text-red-300">{formatCurrency(totalCos + totalSga)}</p>
                    <p className="text-xs text-teal-300/70 mt-1">{t('CoS')} + {t('SG&A')}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-teal-300 uppercase tracking-wider mb-1">{t('Gross Profit')}</p>
                    <p className={`text-3xl sm:text-4xl font-bold ${grossProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatCurrencySign(grossProfit)}</p>
                    <p className="text-xs text-teal-300/70 mt-1">{grossMargin.toFixed(1)}% {t('margin')}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-teal-300 uppercase tracking-wider mb-1">{t('EBITDA')}</p>
                    <p className={`text-3xl sm:text-4xl font-bold ${ebitda >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatCurrencySign(ebitda)}</p>
                    <p className="text-xs text-teal-300/70 mt-1">{ebitdaMargin.toFixed(1)}% {t('margin')}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {pnlData.revenue.map((line, idx) => (
                  <div key={line.key} className={`p-5 rounded-xl border shadow-sm cursor-pointer hover:shadow-md transition-shadow ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}
                    onClick={() => setActiveSection('revenue')}>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{line.label}</p>
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getColor(line.key) }} />
                    </div>
                    <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{formatCurrency(line.total)}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{totalRevenue > 0 ? (line.total / totalRevenue * 100).toFixed(1) : 0}% {t('of revenue')}</p>
                    <div className="w-full bg-gray-100 dark:bg-gray-800 h-2 rounded-full mt-3 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${totalRevenue > 0 ? Math.min(100, line.total / totalRevenue * 100) : 0}%`, backgroundColor: getColor(line.key) }} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className={`p-5 rounded-xl border shadow-sm ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
                  <p className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-4">{t('Cost of Sales Breakdown')}</p>
                  <div className="space-y-3">
                    {pnlData.cos.map(line => (
                      <div key={line.key} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getColor(line.key) }} />
                          <span className="text-sm text-gray-700 dark:text-gray-300">{line.label}</span>
                        </div>
                        <span className="text-sm font-bold text-gray-900 dark:text-white">{formatCurrency(line.total)}</span>
                      </div>
                    ))}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                      <span className="text-xs font-bold text-gray-500">{t('Total CoS')}</span>
                      <span className="text-sm font-bold text-red-600">{formatCurrency(totalCos)}</span>
                    </div>
                  </div>
                </div>

                <div className={`p-5 rounded-xl border shadow-sm ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
                  <p className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-4">{t('SG&A Breakdown')}</p>
                  <div className="space-y-3">
                    {pnlData.sga.map(line => (
                      <div key={line.key} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getColor(line.key) }} />
                          <span className="text-sm text-gray-700 dark:text-gray-300">{line.label}</span>
                        </div>
                        <span className="text-sm font-bold text-gray-900 dark:text-white">{formatCurrency(line.total)}</span>
                      </div>
                    ))}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                      <span className="text-xs font-bold text-gray-500">{t('Total SG&A')}</span>
                      <span className="text-sm font-bold text-red-600">{formatCurrency(totalSga)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeSection === 'revenue' && (
            <>
              <div className={`p-5 rounded-xl border shadow-sm ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{t('Monthly Revenue by Category')}</p>
                  <p className="text-xs text-gray-500">{periodLabel}</p>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyRevenueChart}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} />
                      <XAxis dataKey="month" tick={{ fontSize: 10, fill: isDark ? '#9ca3af' : '#6b7280' }} />
                      <YAxis tick={{ fontSize: 10, fill: isDark ? '#9ca3af' : '#6b7280' }} tickFormatter={v => `€${Math.round(v/1000)}K`} />
                      <Tooltip formatter={(val: number) => formatCurrency(val)} contentStyle={{ backgroundColor: isDark ? '#1f2937' : '#fff', border: 'none', borderRadius: '8px', fontSize: '11px' }} />
                      {pnlData.revenue.map(line => (
                        <Bar key={line.key} dataKey={line.label} stackId="rev" fill={getColor(line.key)} radius={[0, 0, 0, 0]} />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className={`p-5 rounded-xl border shadow-sm ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
                <p className="text-sm font-bold text-gray-900 dark:text-white mb-4">{t('Revenue Detail')}</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left py-2 px-2 font-semibold text-gray-500">{t('Category')}</th>
                        {SEASON_MONTHS.slice(0, monthCount).map(m => (
                          <th key={m} className="text-right py-2 px-2 font-semibold text-gray-500">{m}</th>
                        ))}
                        <th className="text-right py-2 px-2 font-bold text-gray-700 dark:text-gray-300">{t('Total')}</th>
                        <th className="text-right py-2 px-2 font-semibold text-gray-500">%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pnlData.revenue.map(line => (
                        <tr key={line.key} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                          <td className="py-2 px-2 font-medium text-gray-900 dark:text-white flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: getColor(line.key) }} />
                            {line.label}
                          </td>
                          {line.values.slice(0, monthCount).map((v, i) => (
                            <td key={i} className="text-right py-2 px-2 text-gray-600 dark:text-gray-400">{v > 0 ? formatCurrency(v) : '-'}</td>
                          ))}
                          <td className="text-right py-2 px-2 font-bold text-gray-900 dark:text-white">{formatCurrency(line.total)}</td>
                          <td className="text-right py-2 px-2 text-gray-500">{totalRevenue > 0 ? (line.total / totalRevenue * 100).toFixed(1) : 0}%</td>
                        </tr>
                      ))}
                      <tr className="border-t-2 border-gray-300 dark:border-gray-600 font-bold">
                        <td className="py-2 px-2 text-gray-900 dark:text-white">{t('Total')}</td>
                        {SEASON_MONTHS.slice(0, monthCount).map((m, i) => {
                          const monthTotal = pnlData.revenue.reduce((s, l) => s + l.values[i], 0);
                          return <td key={m} className="text-right py-2 px-2 text-gray-900 dark:text-white">{monthTotal > 0 ? formatCurrency(monthTotal) : '-'}</td>;
                        })}
                        <td className="text-right py-2 px-2 text-teal-600">{formatCurrency(totalRevenue)}</td>
                        <td className="text-right py-2 px-2 text-gray-500">100%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {activeSection === 'costs' && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className={`p-5 rounded-xl border shadow-sm ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
                  <p className="text-sm font-bold text-gray-900 dark:text-white mb-1">{t('Cost of Sales')}</p>
                  <p className="text-xs text-gray-500 mb-4">{t('Direct costs tied to revenue generation')}</p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                          <th className="text-left py-2 px-2 font-semibold text-gray-500">{t('Item')}</th>
                          {SEASON_MONTHS.slice(0, monthCount).map(m => (
                            <th key={m} className="text-right py-2 px-2 font-semibold text-gray-500">{m}</th>
                          ))}
                          <th className="text-right py-2 px-2 font-bold text-gray-700 dark:text-gray-300">{t('Total')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pnlData.cos.map(line => (
                          <tr key={line.key} className="border-b border-gray-100 dark:border-gray-800">
                            <td className="py-2 px-2 font-medium text-gray-900 dark:text-white">{line.label}</td>
                            {line.values.slice(0, monthCount).map((v, i) => (
                              <td key={i} className="text-right py-2 px-2 text-gray-600 dark:text-gray-400">{v > 0 ? formatCurrency(v) : '-'}</td>
                            ))}
                            <td className="text-right py-2 px-2 font-bold text-red-600">{formatCurrency(line.total)}</td>
                          </tr>
                        ))}
                        <tr className="border-t-2 border-gray-300 dark:border-gray-600 font-bold">
                          <td className="py-2 px-2 text-gray-900 dark:text-white">{t('Total CoS')}</td>
                          {SEASON_MONTHS.slice(0, monthCount).map((m, i) => {
                            const monthTotal = pnlData.cos.reduce((s, l) => s + l.values[i], 0);
                            return <td key={m} className="text-right py-2 px-2 text-red-600">{monthTotal > 0 ? formatCurrency(monthTotal) : '-'}</td>;
                          })}
                          <td className="text-right py-2 px-2 text-red-600">{formatCurrency(totalCos)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className={`p-5 rounded-xl border shadow-sm ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
                  <p className="text-sm font-bold text-gray-900 dark:text-white mb-1">{t('SG&A')}</p>
                  <p className="text-xs text-gray-500 mb-4">{t('Selling, General & Administrative expenses')}</p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                          <th className="text-left py-2 px-2 font-semibold text-gray-500">{t('Item')}</th>
                          {SEASON_MONTHS.slice(0, monthCount).map(m => (
                            <th key={m} className="text-right py-2 px-2 font-semibold text-gray-500">{m}</th>
                          ))}
                          <th className="text-right py-2 px-2 font-bold text-gray-700 dark:text-gray-300">{t('Total')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pnlData.sga.map(line => (
                          <tr key={line.key} className="border-b border-gray-100 dark:border-gray-800">
                            <td className="py-2 px-2 font-medium text-gray-900 dark:text-white">{line.label}</td>
                            {line.values.slice(0, monthCount).map((v, i) => (
                              <td key={i} className="text-right py-2 px-2 text-gray-600 dark:text-gray-400">{v > 0 ? formatCurrency(v) : '-'}</td>
                            ))}
                            <td className="text-right py-2 px-2 font-bold text-red-600">{formatCurrency(line.total)}</td>
                          </tr>
                        ))}
                        <tr className="border-t-2 border-gray-300 dark:border-gray-600 font-bold">
                          <td className="py-2 px-2 text-gray-900 dark:text-white">{t('Total SG&A')}</td>
                          {SEASON_MONTHS.slice(0, monthCount).map((m, i) => {
                            const monthTotal = pnlData.sga.reduce((s, l) => s + l.values[i], 0);
                            return <td key={m} className="text-right py-2 px-2 text-red-600">{monthTotal > 0 ? formatCurrency(monthTotal) : '-'}</td>;
                          })}
                          <td className="text-right py-2 px-2 text-red-600">{formatCurrency(totalSga)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className={`p-5 rounded-xl border shadow-sm ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
                <p className="text-sm font-bold text-gray-900 dark:text-white mb-4">{t('Cost Distribution')}</p>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={costBreakdownChart} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} />
                      <XAxis type="number" tick={{ fontSize: 10, fill: isDark ? '#9ca3af' : '#6b7280' }} tickFormatter={v => `€${Math.round(v/1000)}K`} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: isDark ? '#9ca3af' : '#6b7280' }} width={120} />
                      <Tooltip formatter={(val: number) => formatCurrency(val)} contentStyle={{ backgroundColor: isDark ? '#1f2937' : '#fff', border: 'none', borderRadius: '8px', fontSize: '11px' }} />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                        {costBreakdownChart.map((entry, idx) => (
                          <Cell key={idx} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}

          {activeSection === 'pnl' && (
            <div className={`p-5 rounded-xl border shadow-sm ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <BarChart3 size={16} className="text-teal-600" />
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{t('Consolidated P&L')}</p>
                </div>
                <p className="text-xs text-gray-500">{periodLabel}</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b-2 border-gray-300 dark:border-gray-600">
                      <th className="text-left py-2 px-2 font-bold text-gray-700 dark:text-gray-300">{t('Line Item')}</th>
                      {SEASON_MONTHS.slice(0, monthCount).map(m => (
                        <th key={m} className="text-right py-2 px-2 font-semibold text-gray-500">{m}</th>
                      ))}
                      <th className="text-right py-2 px-2 font-bold text-gray-700 dark:text-gray-300">{t('YTD')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pnlTableData.map((row, idx) => {
                      const isNeg = row.total < 0;
                      const isSummary = row.isBold;
                      const isSection = row.isHeader;
                      return (
                        <tr key={idx}
                          className={`
                            ${isSection ? 'bg-gray-50 dark:bg-gray-800/50' : ''}
                            ${isSummary ? 'border-t border-gray-300 dark:border-gray-600 font-bold' : 'border-b border-gray-100 dark:border-gray-800'}
                            ${row.label === 'EBITDA' ? 'bg-teal-50 dark:bg-teal-900/20' : ''}
                          `}>
                          <td className={`py-2 px-2 ${isSummary || isSection ? 'font-bold' : ''} ${isSection ? 'text-gray-500 dark:text-gray-400 uppercase text-[10px] tracking-wider' : 'text-gray-900 dark:text-white'}`}>
                            {row.label}
                          </td>
                          {isSection ? (
                            <>
                              {SEASON_MONTHS.slice(0, monthCount).map(m => (
                                <td key={m} className="py-2 px-2" />
                              ))}
                              <td className="text-right py-2 px-2 font-bold text-gray-500 dark:text-gray-400">{formatCurrency(row.total)}</td>
                            </>
                          ) : (
                            <>
                              {row.values.slice(0, monthCount).map((v, i) => (
                                <td key={i} className={`text-right py-2 px-2 ${v < 0 ? 'text-red-500' : 'text-gray-600 dark:text-gray-400'}`}>
                                  {v !== 0 ? formatCurrencySign(v) : '-'}
                                </td>
                              ))}
                              <td className={`text-right py-2 px-2 font-bold ${isNeg ? 'text-red-600' : row.label === 'EBITDA' || row.label === 'Gross Profit' ? 'text-teal-600' : 'text-gray-900 dark:text-white'}`}>
                                {formatCurrencySign(row.total)}
                              </td>
                            </>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
