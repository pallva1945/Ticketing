import React, { useState, useEffect } from 'react';
import { Trophy, Flag, Activity, TrendingUp, Calendar, Dumbbell, FileSpreadsheet, Loader2, Settings, X, Check } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
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
  section?: string;
}

export interface VbRevenueSection {
  key: string;
  label: string;
  values: number[];
  total: number;
  lines: VbPnlLine[];
}

export interface VbPnlData {
  revenue: VbPnlLine[];
  revenueSections: VbRevenueSection[];
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
  let currentRevenueCategory: string | null = null;

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;
    const label = (row[0] || '').trim();
    if (!label) continue;
    const lowerLabel = label.toLowerCase().replace(/[^a-z& ]/g, '').trim();

    if (SECTION_ALIASES[lowerLabel]) {
      currentSection = SECTION_ALIASES[lowerLabel] as any;
      currentRevenueCategory = null;
      continue;
    }

    if (['total', 'totale', 'gross profit', 'ebitda', 'net income', 'subtotal'].some(skip => lowerLabel.startsWith(skip))) continue;
    if (!currentSection) continue;

    if (currentSection === 'revenue' && REVENUE_LINE_ALIASES[lowerLabel]) {
      const values = new Array(12).fill(0);
      let hasValue = false;
      for (const [colStr, monthIdx] of Object.entries(monthIndices)) {
        const col = parseInt(colStr);
        const val = parseEuro(row[col] || '');
        values[monthIdx] = val;
        if (val !== 0) hasValue = true;
      }
      currentRevenueCategory = REVENUE_LINE_ALIASES[lowerLabel];
      if (hasValue) {
        const total = values.reduce((s: number, v: number) => s + v, 0);
        revenue.push({ key: lowerLabel.replace(/\s+/g, '_'), label, values, total, section: currentRevenueCategory });
      }
      continue;
    }

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
      const key = lowerLabel.replace(/\s+/g, '_');
      revenue.push({ key, label, values, total, section: currentRevenueCategory || undefined });
    } else if (currentSection === 'cos') {
      const key = COS_LINE_ALIASES[lowerLabel] || `cos_${lowerLabel.replace(/\s+/g, '_')}`;
      cos.push({ key, label, values, total });
    } else if (currentSection === 'sga') {
      const key = SGA_LINE_ALIASES[lowerLabel] || `sga_${lowerLabel.replace(/\s+/g, '_')}`;
      sga.push({ key, label, values, total });
    }
  }

  if (revenue.length === 0 && cos.length === 0 && sga.length === 0) return null;

  const sectionOrder = ['sponsorship', 'bops', 'gameday', 'ebp'];
  const sectionLabels: Record<string, string> = { sponsorship: 'Sponsorship', bops: 'BOps', gameday: 'GameDay', ebp: 'EBP' };
  const revenueSections: VbRevenueSection[] = [];
  for (const sKey of sectionOrder) {
    const sectionLines = revenue.filter(l => l.section === sKey);
    if (sectionLines.length === 0) continue;
    const aggValues = new Array(12).fill(0);
    sectionLines.forEach(l => l.values.forEach((v, i) => aggValues[i] += v));
    const aggTotal = aggValues.reduce((s, v) => s + v, 0);
    revenueSections.push({ key: sKey, label: sectionLabels[sKey] || sKey, values: aggValues, total: aggTotal, lines: sectionLines });
  }

  return { revenue, revenueSections, cos, sga, monthCount };
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

type ActiveView = 'overview' | 'sponsorship' | 'bops' | 'gameday' | 'ebp';

const SECTION_ICONS: Record<string, any> = {
  sponsorship: Flag,
  bops: Activity,
  gameday: Calendar,
  ebp: Dumbbell,
};

const SECTION_COLORS: Record<string, { text: string; bg: string; bar: string }> = {
  sponsorship: { text: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/30', bar: 'bg-blue-500' },
  bops: { text: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/30', bar: 'bg-emerald-500' },
  gameday: { text: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/30', bar: 'bg-indigo-500' },
  ebp: { text: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/30', bar: 'bg-purple-500' },
};

export const VareseBasketballDashboard: React.FC = () => {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [activeView, setActiveView] = useState<ActiveView>('overview');
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

  const totalRevenue = pnlData ? pnlData.revenueSections.reduce((s, sec) => s + sec.total, 0) : 0;
  const monthCount = pnlData?.monthCount || 7;
  const periodLabel = monthCount <= 6 ? 'Jul–Dec 2025' : `Jul 2025–${SEASON_MONTHS[monthCount - 1]} 2026`;

  const getSectionByKey = (key: string) => pnlData?.revenueSections.find(s => s.key === key);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="text-teal-600 animate-spin" />
      </div>
    );
  }

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

  const renderSectionDetail = (key: string) => {
    const section = getSectionByKey(key);
    if (!section) return (
      <div className={`rounded-xl border p-12 text-center ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
        <p className="text-gray-400">{t('No data available for this section. Sync the Google Sheet to load data.')}</p>
      </div>
    );
    const Icon = SECTION_ICONS[key] || Flag;
    const colors = SECTION_COLORS[key] || SECTION_COLORS.sponsorship;
    const chartData = SEASON_MONTHS.slice(0, monthCount).map((m, i) => ({ month: m, value: section.values[i] }));
    const pctOfTotal = totalRevenue > 0 ? (section.total / totalRevenue * 100).toFixed(1) : '0';

    return (
      <>
        <div className="flex items-center gap-3 mb-2">
          <button onClick={() => setActiveView('overview')} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            <TrendingUp size={16} />
          </button>
          <div className={`p-2.5 rounded-xl ${colors.bg}`}>
            <Icon size={22} className={colors.text} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{section.label}</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t('Revenue')} · {periodLabel}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className={`p-5 rounded-xl border shadow-sm ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">{t('YTD Revenue')}</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{formatCurrency(section.total)}</p>
            <p className="text-xs text-gray-400 mt-1">{periodLabel}</p>
          </div>
          <div className={`p-5 rounded-xl border shadow-sm ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">{t('Share of VB Revenue')}</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{pctOfTotal}%</p>
            <p className="text-xs text-gray-400 mt-1">{t('of')} {formatCurrency(totalRevenue)} {t('total')}</p>
          </div>
          <div className={`p-5 rounded-xl border shadow-sm ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">{t('Monthly Avg')}</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{formatCurrency(Math.round(section.total / Math.max(1, monthCount)))}</p>
            <p className="text-xs text-gray-400 mt-1">{monthCount} {t('months')}</p>
          </div>
        </div>

        <div className={`p-5 rounded-xl border shadow-sm ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
          <p className="text-sm font-bold text-gray-900 dark:text-white mb-4">{t('Monthly Breakdown')}</p>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: isDark ? '#9ca3af' : '#6b7280' }} />
                <YAxis tick={{ fontSize: 10, fill: isDark ? '#9ca3af' : '#6b7280' }} tickFormatter={v => `€${Math.round(v/1000)}K`} />
                <Tooltip formatter={(val: number) => formatCurrency(val)} contentStyle={{ backgroundColor: isDark ? '#1f2937' : '#fff', border: 'none', borderRadius: '8px', fontSize: '11px' }} />
                <Bar dataKey="value" fill={getColor(key)} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={`p-5 rounded-xl border shadow-sm ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
          <p className="text-sm font-bold text-gray-900 dark:text-white mb-3">{t('Detail by Line Item')}</p>
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
                {section.lines.map(line => (
                  <tr key={line.key} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="py-2 px-2 font-medium text-gray-900 dark:text-white">{line.label}</td>
                    {line.values.slice(0, monthCount).map((v, i) => (
                      <td key={i} className="text-right py-2 px-2 text-gray-600 dark:text-gray-400">{v > 0 ? formatCurrency(v) : '-'}</td>
                    ))}
                    <td className="text-right py-2 px-2 font-bold text-gray-900 dark:text-white">{formatCurrency(line.total)}</td>
                  </tr>
                ))}
                <tr className="border-t-2 border-gray-300 dark:border-gray-600 font-bold">
                  <td className="py-2 px-2 text-gray-900 dark:text-white">{t('Total')}</td>
                  {section.values.slice(0, monthCount).map((v, i) => (
                    <td key={i} className="text-right py-2 px-2 text-gray-900 dark:text-white">{v > 0 ? formatCurrency(v) : '-'}</td>
                  ))}
                  <td className="text-right py-2 px-2 text-teal-600">{formatCurrency(section.total)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-teal-50 dark:bg-teal-900/30">
            <Trophy size={22} className="text-teal-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('Varese Basketball')}</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t('Revenue')} – {periodLabel}</p>
          </div>
        </div>
        <SyncToolbar />
      </div>

      {showConfig && (
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
      )}

      {!pnlData ? (
        <div className={`text-center py-16 rounded-xl border-2 border-dashed ${isDark ? 'border-gray-700 bg-gray-900/50' : 'border-gray-200 bg-gray-50'}`}>
          <FileSpreadsheet size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-2">{t('Connect Your VB P&L')}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
            {t('Configure a Google Sheet with the Varese Basketball P&L to populate revenue data.')}
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
      ) : activeView === 'overview' ? (
        <>
          <div className="bg-gradient-to-r from-teal-800 to-teal-900 rounded-xl p-6 text-white">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
              <div>
                <p className="text-[10px] font-bold text-teal-300 uppercase tracking-wider mb-1">{t('Total Revenue')}</p>
                <p className="text-3xl sm:text-4xl font-bold">{formatCurrency(totalRevenue)}</p>
                <p className="text-xs text-teal-300/70 mt-1">{periodLabel}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-teal-300 uppercase tracking-wider mb-1">{t('Monthly Avg')}</p>
                <p className="text-3xl sm:text-4xl font-bold text-teal-200">{formatCurrency(Math.round(totalRevenue / Math.max(1, monthCount)))}</p>
                <p className="text-xs text-teal-300/70 mt-1">{monthCount} {t('months')}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-teal-300 uppercase tracking-wider mb-1">{t('Categories')}</p>
                <p className="text-3xl sm:text-4xl font-bold text-teal-200">{pnlData.revenueSections.length}</p>
                <p className="text-xs text-teal-300/70 mt-1">{t('revenue streams')}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {pnlData.revenueSections.map(section => {
              const Icon = SECTION_ICONS[section.key] || Flag;
              const colors = SECTION_COLORS[section.key] || SECTION_COLORS.sponsorship;
              const pct = totalRevenue > 0 ? (section.total / totalRevenue * 100) : 0;

              return (
                <button key={section.key} onClick={() => setActiveView(section.key as ActiveView)}
                  className={`text-left p-5 rounded-xl border shadow-sm transition-all hover:shadow-md cursor-pointer ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{section.label}</p>
                    <div className={`p-2 rounded-lg ${colors.bg}`}>
                      <Icon size={16} className={colors.text} />
                    </div>
                  </div>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{formatCurrency(section.total)}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{pct.toFixed(1)}% {t('of total')}</p>
                  <div className="w-full bg-gray-100 dark:bg-gray-800 h-2 rounded-full mt-3 overflow-hidden">
                    <div className={`h-full rounded-full ${colors.bar}`} style={{ width: `${Math.min(100, pct)}%` }} />
                  </div>
                </button>
              );
            })}
          </div>

          <div className={`p-5 rounded-xl border shadow-sm ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
            <p className="text-sm font-bold text-gray-900 dark:text-white mb-4">{t('Monthly Revenue')}</p>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={SEASON_MONTHS.slice(0, monthCount).map((m, i) => {
                  const entry: any = { month: m };
                  pnlData.revenueSections.forEach(sec => { entry[sec.label] = sec.values[i]; });
                  return entry;
                })}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: isDark ? '#9ca3af' : '#6b7280' }} />
                  <YAxis tick={{ fontSize: 10, fill: isDark ? '#9ca3af' : '#6b7280' }} tickFormatter={v => `€${Math.round(v/1000)}K`} />
                  <Tooltip formatter={(val: number) => formatCurrency(val)} contentStyle={{ backgroundColor: isDark ? '#1f2937' : '#fff', border: 'none', borderRadius: '8px', fontSize: '11px' }} />
                  {pnlData.revenueSections.map(sec => (
                    <Bar key={sec.key} dataKey={sec.label} stackId="rev" fill={getColor(sec.key)} radius={[0, 0, 0, 0]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      ) : (
        renderSectionDetail(activeView)
      )}
    </div>
  );
};
