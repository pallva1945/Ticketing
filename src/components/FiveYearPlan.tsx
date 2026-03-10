import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Home, FileSpreadsheet, Loader2, Check, X, RefreshCw, ChevronDown, ChevronRight, TrendingUp, TrendingDown } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { PV_LOGO_URL } from '../constants';
import { ResponsiveContainer, ComposedChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Line, AreaChart, Area, BarChart } from 'recharts';

const MODULE_KEY = 'five_year';

interface FiveYearPlanProps {
  onBackToLanding: () => void;
  onHome?: () => void;
}

interface ParsedRow {
  label: string;
  depth: number;
  values: number[];
  isTotal: boolean;
  isSummary: boolean;
}

interface FinancialSection {
  name: string;
  rows: ParsedRow[];
  statement: string;
}

interface FiveYearData {
  headers: string[];
  pnl: FinancialSection[];
  balanceSheet: FinancialSection[];
  cashFlow: FinancialSection[];
  keyMetrics: {
    label: string;
    values: number[];
    isPercentage?: boolean;
  }[];
}

function parseNum(v: string | undefined | null): number {
  if (!v || v === '' || v === '-' || v === '—' || v === '_') return 0;
  let s = String(v).trim();
  if (s === '0') return 0;
  if (s.endsWith('%')) return 0;

  let neg = false;
  if (s.startsWith('(') && s.endsWith(')')) {
    neg = true;
    s = s.slice(1, -1);
  } else if (s.startsWith('-')) {
    neg = true;
    s = s.slice(1);
  }
  s = s.replace(/[€$£\s"]/g, '').trim();
  if (!s || s === '_' || s === 'ok') return 0;

  if (s.includes(',') && s.includes('.')) {
    const lastComma = s.lastIndexOf(',');
    const lastDot = s.lastIndexOf('.');
    if (lastComma > lastDot) {
      s = s.replace(/\./g, '').replace(',', '.');
    } else {
      s = s.replace(/,/g, '');
    }
  } else if (s.includes(',')) {
    const parts = s.split(',');
    if (parts.length === 2 && parts[1].length <= 2) {
      s = s.replace(',', '.');
    } else {
      s = s.replace(/,/g, '');
    }
  }

  const num = parseFloat(s);
  if (isNaN(num)) return 0;
  return neg ? -num : num;
}

function parseFiveYearData(raw: string[][]): FiveYearData | null {
  if (!raw || raw.length < 5) return null;

  let headerRowIdx = -1;
  let valueCols: number[] = [];
  let yearRowIdx = -1;
  let yearCols: number[] = [];

  for (let i = 0; i < Math.min(raw.length, 10); i++) {
    const row = raw[i];
    if (!row) continue;
    const junCols: number[] = [];
    const yrCols: number[] = [];
    for (let c = 0; c < row.length; c++) {
      const cell = (row[c] || '').trim();
      if (/^[A-Za-z]{3}-\d{2}$/i.test(cell)) junCols.push(c);
      if (/^20\d{2}$/.test(cell)) yrCols.push(c);
    }
    if (junCols.length >= 4) {
      const firstSet = [junCols[0]];
      for (let j = 1; j < junCols.length; j++) {
        if (junCols[j] - junCols[j - 1] <= 2) firstSet.push(junCols[j]);
        else break;
      }
      if (firstSet.length >= 4) {
        headerRowIdx = i;
        valueCols = firstSet;
      }
    }
    if (yrCols.length >= 4 && yearRowIdx < 0) {
      const firstSet = [yrCols[0]];
      for (let j = 1; j < yrCols.length; j++) {
        if (yrCols[j] - yrCols[j - 1] <= 2) firstSet.push(yrCols[j]);
        else break;
      }
      if (firstSet.length >= 4) {
        yearRowIdx = i;
        yearCols = firstSet;
      }
    }
  }

  if (headerRowIdx < 0 && yearRowIdx >= 0) {
    headerRowIdx = yearRowIdx;
    valueCols = yearCols;
  }

  if (headerRowIdx < 0 || valueCols.length === 0) return null;

  const dataStartRow = Math.max(headerRowIdx, yearRowIdx) + 1;
  const headers = valueCols.map(c => (raw[headerRowIdx][c] || '').trim());
  const maxLabelCol = valueCols[0];

  const TOTAL_PATTERNS = /^(total|ebitda|ebit|ebt|ni|gross profit|depreciation$|interest$)/i;
  const SUMMARY_KEYS = ['EBITDA', 'EBIT', 'EBT', 'NI', 'Gross Profit'];

  interface PreRow {
    label: string;
    depth: number;
    values: number[];
    allZero: boolean;
    statement: string;
  }

  const preRows: PreRow[] = [];
  let currentStatement = 'pnl';

  for (let i = dataStartRow; i < raw.length; i++) {
    const row = raw[i];
    if (!row) continue;

    let label = '';
    let depth = 0;
    for (let c = 0; c < maxLabelCol; c++) {
      const cell = (row[c] || '').trim();
      if (cell && cell !== '_' && cell !== 'ok' && cell !== 'Check' && cell !== 'check') {
        label = cell;
        if (c <= 1) depth = 0;
        else if (c === 2) depth = 1;
        else depth = 2;
        break;
      }
    }

    if (!label || label === '_') continue;
    const ll = label.toLowerCase();
    if (ll === 'p&l') continue;
    if (ll === 'balance sheet') { currentStatement = 'bs'; continue; }
    if (ll === 'cf statement') { currentStatement = 'cf'; continue; }
    if (ll === 'assets' || ll === 'liabilities') continue;
    if (ll.includes('margin') && label.includes('%') === false) {
      const hasPercentValues = valueCols.some(c => {
        const cell = (row[c] || '').trim();
        return cell.endsWith('%') || (cell.startsWith('(') && cell.endsWith('%)'));
      });
      if (hasPercentValues) continue;
    }

    const values = valueCols.map(c => parseNum(row[c]));
    const allZero = values.every(v => v === 0);

    preRows.push({ label, depth, values, allZero, statement: currentStatement });
  }

  function isSectionHeader(idx: number): boolean {
    const r = preRows[idx];
    if (!r.allZero) return false;
    if (TOTAL_PATTERNS.test(r.label) || r.label.startsWith('Total ') || r.label.startsWith('TOTAL ')) return false;
    for (let j = idx + 1; j < preRows.length; j++) {
      const next = preRows[j];
      if (next.statement !== r.statement) return false;
      if (next.allZero && next.depth <= r.depth) return false;
      if (!next.allZero) return next.depth > r.depth;
      if (next.depth > r.depth) return true;
    }
    return false;
  }

  const pnlSections: FinancialSection[] = [];
  const bsSections: FinancialSection[] = [];
  const cfSections: FinancialSection[] = [];
  const keyMetrics: FiveYearData['keyMetrics'] = [];

  let currentSection: FinancialSection | null = null;
  let prevStatement = '';

  function pushSection() {
    if (!currentSection || currentSection.rows.length === 0) return;
    const st = currentSection.statement;
    if (st === 'pnl') pnlSections.push(currentSection);
    else if (st === 'bs') bsSections.push(currentSection);
    else cfSections.push(currentSection);
    currentSection = null;
  }

  for (let idx = 0; idx < preRows.length; idx++) {
    const r = preRows[idx];

    if (r.statement !== prevStatement) {
      pushSection();
      prevStatement = r.statement;
    }

    if (isSectionHeader(idx)) {
      pushSection();
      currentSection = { name: r.label, rows: [], statement: r.statement };
      continue;
    }

    if (!currentSection) {
      const defaultName = r.statement === 'pnl' ? 'P&L' : r.statement === 'bs' ? 'Balance Sheet' : 'Cash Flow';
      currentSection = { name: defaultName, rows: [], statement: r.statement };
    }

    const isTotal = TOTAL_PATTERNS.test(r.label) || r.label.startsWith('Total ') || r.label.startsWith('TOTAL ');
    const isSummary = SUMMARY_KEYS.some(k => r.label.toUpperCase().startsWith(k));

    if (isSummary && r.statement === 'pnl') {
      keyMetrics.push({ label: r.label, values: r.values });
    }

    if (r.allZero && !isTotal) continue;

    currentSection.rows.push({ label: r.label, depth: r.depth, values: r.values, isTotal, isSummary });
  }
  pushSection();

  return { headers, pnl: pnlSections, balanceSheet: bsSections, cashFlow: cfSections, keyMetrics };
}

const fmt = (v: number) => {
  const abs = Math.abs(v);
  const sign = v < 0 ? '-' : '';
  if (abs >= 1000000) return `${sign}€${(abs / 1000000).toFixed(1)}M`;
  if (abs >= 1000) return `${sign}€${Math.round(abs / 1000)}K`;
  return `${sign}€${Math.round(abs)}`;
};

const fmtFull = (v: number) => {
  const abs = Math.abs(v);
  const formatted = abs.toLocaleString('en-US', { maximumFractionDigits: 0 });
  return v < 0 ? `-€${formatted}` : `€${formatted}`;
};

const fmtPct = (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`;

type TabKey = 'pnl' | 'balance' | 'cashflow';

export const FiveYearPlan: React.FC<FiveYearPlanProps> = ({ onBackToLanding, onHome }) => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const isDark = theme === 'dark';

  const [rawData, setRawData] = useState<FiveYearData | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [showSheetConfig, setShowSheetConfig] = useState(false);
  const [sheetId, setSheetId] = useState('');
  const [sheetName, setSheetName] = useState('Yearly');
  const [sheetConfigured, setSheetConfigured] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<TabKey>('pnl');

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
          const parsed = parseFiveYearData(res.data);
          if (parsed) setRawData(parsed);
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
        const parsed = parseFiveYearData(result.data);
        if (parsed) setRawData(parsed);
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
        handleSyncSheet();
      }
    } catch (err) {
      console.error('Config save failed:', err);
    }
  };

  const toggleSection = (key: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const revenueChartData = useMemo(() => {
    if (!rawData) return [];
    const salesSection = rawData.pnl.find(s => s.name.toLowerCase().includes('sales') && !s.name.toLowerCase().includes('cost'));
    if (!salesSection) return [];
    const items = salesSection.rows.filter(r => !r.isTotal && !r.isSummary);
    return rawData.headers.map((h, hi) => {
      const entry: Record<string, any> = { name: h };
      items.forEach(item => { entry[item.label] = item.values[hi]; });
      const totalRow = salesSection.rows.find(r => r.isTotal);
      entry.total = totalRow ? totalRow.values[hi] : items.reduce((s, item) => s + item.values[hi], 0);
      return entry;
    });
  }, [rawData]);

  const revenueItems = useMemo(() => {
    if (!rawData) return [];
    const salesSection = rawData.pnl.find(s => s.name.toLowerCase().includes('sales') && !s.name.toLowerCase().includes('cost'));
    if (!salesSection) return [];
    return salesSection.rows.filter(r => !r.isTotal && !r.isSummary).map(r => r.label);
  }, [rawData]);

  const profitabilityData = useMemo(() => {
    if (!rawData || rawData.keyMetrics.length === 0) return [];
    return rawData.headers.map((h, hi) => {
      const entry: Record<string, any> = { name: h };
      rawData.keyMetrics.forEach(m => { entry[m.label] = m.values[hi]; });
      return entry;
    });
  }, [rawData]);

  const sections = activeTab === 'pnl' ? rawData?.pnl : activeTab === 'balance' ? rawData?.balanceSheet : rawData?.cashFlow;

  const REVENUE_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#ef4444', '#14b8a6', '#a855f7'];

  const card = isDark ? 'bg-gray-900/60 border border-gray-800 rounded-xl' : 'bg-white border border-gray-200 rounded-xl shadow-sm';
  const subtext = isDark ? 'text-gray-500' : 'text-gray-400';

  const tipStyle: React.CSSProperties = {
    backgroundColor: isDark ? '#1f2937' : '#ffffff',
    border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
    borderRadius: '8px',
    fontSize: '11px',
    color: isDark ? '#e5e7eb' : '#374151',
  };

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'pnl', label: t('P&L') },
    { key: 'balance', label: t('Balance Sheet') },
    { key: 'cashflow', label: t('Cash Flow') },
  ];

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-950 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="sticky top-0 z-30 backdrop-blur-xl border-b" style={{ borderColor: isDark ? '#1f2937' : '#e5e7eb', backgroundColor: isDark ? 'rgba(3,7,18,0.85)' : 'rgba(249,250,251,0.85)' }}>
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBackToLanding} className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-200'}`}>
              <ArrowLeft size={18} />
            </button>
            <img src={PV_LOGO_URL} alt="PV" className="w-8 h-8 object-contain" />
            <div>
              <h1 className="text-sm font-bold">{t('5 Year Financial Plan')}</h1>
              <p className={`text-[10px] ${subtext}`}>{t('Varese Pallacanestro — Financing Case')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={sheetConfigured ? handleSyncSheet : () => setShowSheetConfig(true)}
              disabled={isSyncing}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                syncSuccess
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                  : isDark ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700' : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {isSyncing ? <Loader2 size={14} className="animate-spin" /> : syncSuccess ? <Check size={14} /> : <FileSpreadsheet size={14} />}
              {isSyncing ? t('Syncing...') : syncSuccess ? t('Synced') : sheetConfigured ? t('Sync Sheet') : t('Connect Sheet')}
            </button>
            {sheetConfigured && (
              <button onClick={() => setShowSheetConfig(true)} className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-800 text-gray-500' : 'hover:bg-gray-200 text-gray-400'}`}>
                <RefreshCw size={14} />
              </button>
            )}
            {onHome && (
              <button onClick={onHome} className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-200'}`}>
                <Home size={18} />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {!rawData ? (
          <div className={`${card} p-12 text-center`}>
            <FileSpreadsheet size={48} className={`mx-auto mb-4 ${subtext}`} />
            <h2 className="text-lg font-semibold mb-2">{t('No Data Connected')}</h2>
            <p className={`text-sm ${subtext} mb-4`}>{t('Connect a Google Sheet to load your 5-year financial projections.')}</p>
            <button
              onClick={() => setShowSheetConfig(true)}
              className="px-4 py-2 rounded-lg bg-amber-600 text-white font-medium text-sm hover:bg-amber-700 transition-colors"
            >
              {t('Connect Google Sheet')}
            </button>
          </div>
        ) : (
          <>
            {rawData.keyMetrics.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {rawData.keyMetrics.map(metric => {
                  const lastVal = metric.values[metric.values.length - 1];
                  const firstVal = metric.values[0];
                  const improving = lastVal > firstVal;
                  return (
                    <div key={metric.label} className={`${card} p-4`}>
                      <p className={`text-[10px] font-medium ${subtext} mb-1`}>{metric.label}</p>
                      <div className="flex items-end justify-between">
                        <div>
                          <p className={`text-[9px] ${subtext}`}>{rawData.headers[0]}</p>
                          <p className={`text-sm font-bold ${firstVal < 0 ? 'text-red-500' : isDark ? 'text-white' : 'text-gray-900'}`}>{fmt(firstVal)}</p>
                        </div>
                        <div className={`flex items-center gap-0.5 ${improving ? 'text-emerald-500' : 'text-red-500'}`}>
                          {improving ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        </div>
                        <div className="text-right">
                          <p className={`text-[9px] ${subtext}`}>{rawData.headers[rawData.headers.length - 1]}</p>
                          <p className={`text-sm font-bold ${lastVal < 0 ? 'text-red-500' : 'text-emerald-500'}`}>{fmt(lastVal)}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {revenueChartData.length > 0 && (
                <div className={`${card} p-4`}>
                  <h3 className={`text-xs font-semibold mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{t('Revenue Breakdown')}</h3>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={revenueChartData} margin={{ top: 10, right: 10, bottom: 5, left: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} opacity={0.5} />
                        <XAxis dataKey="name" tick={{ fontSize: 10, fill: isDark ? '#9ca3af' : '#6b7280' }} />
                        <YAxis tick={{ fontSize: 9, fill: isDark ? '#9ca3af' : '#6b7280' }} tickFormatter={(v: number) => fmt(v)} />
                        <Tooltip contentStyle={tipStyle} formatter={(v: number, name: string) => [fmtFull(v), name]} />
                        <Legend wrapperStyle={{ fontSize: 9 }} />
                        {revenueItems.map((item, i) => (
                          <Bar key={item} dataKey={item} name={item.replace(' Rev', '')} fill={REVENUE_COLORS[i % REVENUE_COLORS.length]} stackId="a" opacity={0.85} radius={i === revenueItems.length - 1 ? [3, 3, 0, 0] : [0, 0, 0, 0]} />
                        ))}
                        <Line type="monotone" dataKey="total" name={t('Total Sales')} stroke={isDark ? '#fbbf24' : '#d97706'} strokeWidth={2.5} dot={{ r: 3, fill: isDark ? '#fbbf24' : '#d97706' }} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {profitabilityData.length > 0 && (
                <div className={`${card} p-4`}>
                  <h3 className={`text-xs font-semibold mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{t('Profitability Path')}</h3>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={profitabilityData} margin={{ top: 10, right: 10, bottom: 5, left: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} opacity={0.5} />
                        <XAxis dataKey="name" tick={{ fontSize: 10, fill: isDark ? '#9ca3af' : '#6b7280' }} />
                        <YAxis tick={{ fontSize: 9, fill: isDark ? '#9ca3af' : '#6b7280' }} tickFormatter={(v: number) => fmt(v)} />
                        <Tooltip contentStyle={tipStyle} formatter={(v: number, name: string) => [fmtFull(v), name]} />
                        <Legend wrapperStyle={{ fontSize: 9 }} />
                        {rawData.keyMetrics.map((m, i) => {
                          const colors = ['#f59e0b', '#ef4444', '#8b5cf6', '#3b82f6'];
                          return <Line key={m.label} type="monotone" dataKey={m.label} stroke={colors[i % colors.length]} strokeWidth={2} dot={{ r: 3 }} />;
                        })}
                        <Area type="monotone" dataKey="EBITDA" fill={isDark ? '#f59e0b20' : '#f59e0b15'} stroke="transparent" />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>

            <div className={`${card} overflow-hidden`}>
              <div className={`flex border-b ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
                {tabs.map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`px-5 py-3 text-xs font-semibold transition-all border-b-2 ${
                      activeTab === tab.key
                        ? isDark ? 'border-amber-500 text-amber-400 bg-amber-500/5' : 'border-amber-600 text-amber-700 bg-amber-50'
                        : isDark ? 'border-transparent text-gray-500 hover:text-gray-300' : 'border-transparent text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="p-4 overflow-x-auto">
                <table className="w-full text-xs min-w-[700px]">
                  <thead>
                    <tr className={`border-b ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
                      <th className={`py-2 px-3 text-left font-semibold ${subtext} w-[280px]`}></th>
                      {rawData.headers.map(h => (
                        <th key={h} className={`py-2 px-3 text-right font-semibold ${subtext}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(sections || []).map((section, si) => {
                      const sectionKey = `${activeTab}-${section.name}`;
                      const isExpanded = expandedSections.has(sectionKey);
                      const detailRows = section.rows.filter(r => !r.isTotal);
                      const totalRow = section.rows.find(r => r.isTotal);

                      return (
                        <React.Fragment key={si}>
                          <tr
                            className={`border-b cursor-pointer transition-colors ${isDark ? 'border-gray-800 hover:bg-gray-800/40' : 'border-gray-100 hover:bg-gray-50/80'}`}
                            onClick={() => toggleSection(sectionKey)}
                          >
                            <td className={`py-2.5 px-3 font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              <span className="inline-flex items-center gap-1.5">
                                {detailRows.length > 0 ? (
                                  isExpanded ? <ChevronDown size={12} className="text-amber-500" /> : <ChevronRight size={12} className="text-gray-400" />
                                ) : <span className="w-3" />}
                                {section.name}
                              </span>
                            </td>
                            {totalRow ? totalRow.values.map((v, vi) => (
                              <td key={vi} className={`py-2.5 px-3 text-right tabular-nums font-bold ${v < 0 ? 'text-red-500' : isDark ? 'text-white' : 'text-gray-900'}`}>{fmt(v)}</td>
                            )) : rawData.headers.map((_, vi) => (
                              <td key={vi} className="py-2.5 px-3 text-right tabular-nums font-bold">—</td>
                            ))}
                          </tr>
                          {isExpanded && detailRows.map((row, ri) => (
                            <tr key={ri} className={`border-b transition-colors ${
                              row.isSummary
                                ? isDark ? 'border-gray-700 bg-gray-800/30' : 'border-gray-200 bg-gray-50'
                                : isDark ? 'border-gray-800/30' : 'border-gray-50'
                            }`}>
                              <td className={`py-1.5 px-3 ${row.isSummary ? 'font-semibold' : ''} ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
                                  style={{ paddingLeft: `${(row.depth + 1) * 16 + 12}px` }}>
                                {row.label}
                              </td>
                              {row.values.map((v, vi) => (
                                <td key={vi} className={`py-1.5 px-3 text-right tabular-nums ${
                                  row.isSummary ? 'font-semibold' : ''
                                } ${v < 0 ? 'text-red-400' : isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                  {v !== 0 ? fmt(v) : '—'}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {showSheetConfig && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]" onClick={() => setShowSheetConfig(false)}>
          <div className={`rounded-xl shadow-2xl w-full max-w-md mx-4 ${isDark ? 'bg-gray-900 border border-gray-700' : 'bg-white border border-gray-200'}`} onClick={e => e.stopPropagation()}>
            <div className={`flex items-center justify-between p-5 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex items-center gap-2">
                <FileSpreadsheet size={18} className="text-amber-600" />
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
                  placeholder="Yearly"
                  className={`w-full px-3 py-2 rounded-lg border text-sm ${isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}`}
                />
              </div>
            </div>
            <div className={`flex justify-end gap-2 p-5 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <button onClick={() => setShowSheetConfig(false)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${isDark ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'}`}>{t('Cancel')}</button>
              <button
                onClick={handleSaveSheetConfig}
                disabled={!sheetId.trim()}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50 transition-all"
              >
                {t('Save & Sync')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
