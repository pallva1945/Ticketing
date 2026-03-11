import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Home, FileSpreadsheet, Loader2, Check, X, RefreshCw, ChevronDown, ChevronRight, TrendingUp, TrendingDown, Info, AlertTriangle, ToggleLeft, ToggleRight } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { PV_LOGO_URL } from '../constants';
import { ResponsiveContainer, ComposedChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Line, Area, ReferenceLine, Cell } from 'recharts';

const MODULE_KEY = 'five_year';

interface Annotation {
  year: string;
  marker: string;
  title: string;
  description: string;
  impact?: string;
  color: string;
}

const ANNOTATIONS: Annotation[] = [
  {
    year: 'Jun-22',
    marker: '1',
    title: 'Previous Ownership Sponsorship Settlement',
    description: 'Sponsorship revenue artificially inflated by a deal from previous owners to cover accumulated losses. This also distorted the Net Income figure for the period.',
    impact: 'Sponsorship Rev & NI distorted',
    color: '#f59e0b',
  },
  {
    year: 'Jun-22',
    marker: '2',
    title: 'Legacy Contract Penalties (2016)',
    description: 'Penalized for unpaid player contracts dating back to 2016 under prior management. Resulted in approximately €100K in legal costs and an estimated €300K in missed playoff revenue.',
    impact: '~€400K total impact',
    color: '#ef4444',
  },
  {
    year: 'Jun-25',
    marker: '3',
    title: 'First Amortization Year',
    description: 'Jun-25 was the first fiscal year that included depreciation/amortization charges. COVID-era regulations had allowed Italian basketball clubs to defer these costs to ease financial pressure.',
    impact: 'Explains Jun-24 → Jun-25 jump in costs',
    color: '#8b5cf6',
  },
  {
    year: 'Jun-22',
    marker: '4',
    title: 'Past Contingencies & Deferred',
    description: 'P&L costs discovered over time from previous management. Although assumed and paid, these are not considered reflective of current operational performance and should be excluded from performance evaluation.',
    impact: 'Excluded in adjusted view',
    color: '#06b6d4',
  },
];

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
  }[];
  projectionStartIndex: number;
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

  let projectionStartIndex = headers.length;
  const now = new Date();
  const currentFiscalYear = now.getMonth() >= 6 ? now.getFullYear() + 1 : now.getFullYear();
  for (let i = 0; i < headers.length; i++) {
    const h = headers[i];
    let yr = 0;
    const match2 = h.match(/(\d{2})$/);
    const match4 = h.match(/(20\d{2})/);
    if (match4) {
      yr = parseInt(match4[1]);
    } else if (match2) {
      yr = 2000 + parseInt(match2[1]);
    }
    if (yr > 0 && yr > currentFiscalYear) {
      projectionStartIndex = i;
      break;
    }
  }

  const TOTAL_PATTERNS = /^(total|ebitda|ebit|ebt|ni|gross profit|depreciation$)/i;
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
    if (ll.includes('margin')) {
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

  return { headers, pnl: pnlSections, balanceSheet: bsSections, cashFlow: cfSections, keyMetrics, projectionStartIndex };
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
  const [showAmortSim, setShowAmortSim] = useState(false);
  const [showExclContingencies, setShowExclContingencies] = useState(false);
  const [showContext, setShowContext] = useState(true);
  const [soloRevenue, setSoloRevenue] = useState<string | null>(null);
  const [soloCost, setSoloCost] = useState<string | null>(null);
  const [soloProfit, setSoloProfit] = useState<string | null>(null);

  const DEFAULT_SCENARIOS = [
    { key: 'base', tabName: 'Base', label: 'Base' },
    { key: 'conservative', tabName: 'Conservative', label: 'Conservative' },
    { key: 'optimistic', tabName: 'Optimistic', label: 'Optimistic' },
  ];
  const [scenarios, setScenarios] = useState(DEFAULT_SCENARIOS);
  const [scenarioData, setScenarioData] = useState<Record<string, FiveYearData | null>>({});
  const [activeScenario, setActiveScenario] = useState('base');
  const [hasScenarios, setHasScenarios] = useState(false);

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
    fetch(`/api/revenue/scenarios-data/${MODULE_KEY}`)
      .then(r => r.json())
      .then(res => {
        if (res.success && res.scenarios && res.data) {
          setScenarios(res.scenarios);
          setHasScenarios(true);
          const parsed: Record<string, FiveYearData | null> = {};
          for (const s of res.scenarios) {
            if (res.data[s.key]) {
              parsed[s.key] = parseFiveYearData(res.data[s.key]);
            }
          }
          setScenarioData(parsed);
          const firstKey = res.scenarios[0]?.key;
          if (firstKey && parsed[firstKey]) {
            setRawData(parsed[firstKey]);
            setActiveScenario(firstKey);
          }
        } else {
          fetch(`/api/revenue/sheet-data/${MODULE_KEY}`)
            .then(r => r.json())
            .then(res2 => {
              if (res2.success && res2.data) {
                const parsed = parseFiveYearData(res2.data);
                if (parsed) setRawData(parsed);
              }
            })
            .catch(() => {});
        }
      })
      .catch(() => {
        fetch(`/api/revenue/sheet-data/${MODULE_KEY}`)
          .then(r => r.json())
          .then(res => {
            if (res.success && res.data) {
              const parsed = parseFiveYearData(res.data);
              if (parsed) setRawData(parsed);
            }
          })
          .catch(() => {});
      });
  }, []);

  const handleSyncSheet = async () => {
    setIsSyncing(true);
    setSyncSuccess(false);
    try {
      if (hasScenarios || scenarios.some(s => s.tabName.trim())) {
        const res = await fetch(`/api/revenue/sync-scenarios/${MODULE_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sheetId: sheetId.trim() || undefined, scenarios }),
        });
        const result = await res.json();
        if (result.success) {
          setHasScenarios(true);
          const parsed: Record<string, FiveYearData | null> = {};
          for (const s of scenarios) {
            if (result.results[s.key]?.success && result.results[s.key]?.data) {
              parsed[s.key] = parseFiveYearData(result.results[s.key].data);
            }
          }
          setScenarioData(parsed);
          if (parsed[activeScenario]) {
            setRawData(parsed[activeScenario]);
          } else {
            const firstKey = scenarios.find(s => parsed[s.key])?.key;
            if (firstKey) { setRawData(parsed[firstKey]); setActiveScenario(firstKey); }
          }
          const failed = scenarios.filter(s => !result.results[s.key]?.success);
          if (failed.length > 0) {
            alert(`Some tabs failed: ${failed.map(f => f.tabName).join(', ')}`);
          }
          setSyncSuccess(true);
          setTimeout(() => setSyncSuccess(false), 3000);
        } else {
          alert(result.message || 'Sync failed');
        }
      } else {
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

  const switchScenario = (key: string) => {
    setActiveScenario(key);
    if (scenarioData[key]) {
      setRawData(scenarioData[key]);
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

  const projIdx = rawData?.projectionStartIndex ?? 0;

  const priorPeriodValues = useMemo(() => {
    if (!rawData) return null;
    const ppSection = rawData.pnl.find(s =>
      s.name.toLowerCase().includes('past contingenc')
    );
    if (!ppSection) return null;
    const totalRow = ppSection.rows.find(r => r.isTotal);
    return totalRow ? totalRow.values : ppSection.rows.reduce((acc, r) => {
      return r.values.map((v, i) => (acc[i] || 0) + v);
    }, new Array(rawData.headers.length).fill(0) as number[]);
  }, [rawData]);

  const depreciationShift = useMemo(() => {
    if (!rawData) return null;
    let depRow: { values: number[] } | undefined;
    for (const section of rawData.pnl) {
      const found = section.rows.find(r =>
        r.label.toLowerCase().includes('depreciation') || r.label.toLowerCase().includes('amortization')
      );
      if (found) { depRow = found; break; }
    }
    if (!depRow) return null;
    const original = depRow.values;
    const n = original.length;
    const SHIFT = 3;
    const maxVal = Math.max(...original);
    const threshold = maxVal * 0.1;
    const firstAmortIdx = original.findIndex(v => v >= threshold);
    if (firstAmortIdx < SHIFT || firstAmortIdx < 0) return null;
    const shifted = new Array(n).fill(0);
    for (let i = firstAmortIdx; i < n; i++) {
      shifted[i - SHIFT] = original[i];
    }
    const availableEnd = n - SHIFT;
    if (availableEnd < n) {
      const trendWindow = Math.min(3, availableEnd);
      const lastValues = shifted.slice(availableEnd - trendWindow, availableEnd);
      if (lastValues.length >= 2) {
        const avgChange = (lastValues[lastValues.length - 1] - lastValues[0]) / (lastValues.length - 1);
        for (let i = availableEnd; i < n; i++) {
          shifted[i] = Math.max(0, shifted[availableEnd - 1] + avgChange * (i - availableEnd + 1));
        }
      } else if (lastValues.length === 1) {
        for (let i = availableEnd; i < n; i++) {
          shifted[i] = lastValues[0];
        }
      }
    }
    const delta = original.map((orig, i) => orig - shifted[i]);
    return { original, shifted, delta };
  }, [rawData]);

  const activeKeyMetrics = useMemo(() => {
    if (!rawData) return [];
    if (!showAmortSim && !showExclContingencies) return rawData.keyMetrics;
    return rawData.keyMetrics.map(m => {
      const label = m.label.toUpperCase();
      let values = [...m.values];
      if (showExclContingencies && priorPeriodValues) {
        values = values.map((v, i) => v + Math.abs(priorPeriodValues[i]));
      }
      if (showAmortSim && depreciationShift && (label.startsWith('EBIT') || label.startsWith('EBT') || label.startsWith('NI')) && !label.startsWith('EBITDA')) {
        values = values.map((v, i) => v + depreciationShift.delta[i]);
      }
      return { ...m, values };
    });
  }, [rawData, showAmortSim, showExclContingencies, priorPeriodValues, depreciationShift]);

  const annotationYearIndices = useMemo(() => {
    if (!rawData) return new Map<string, number>();
    const map = new Map<string, number>();
    rawData.headers.forEach((h, i) => map.set(h, i));
    return map;
  }, [rawData]);

  const revenueChartData = useMemo(() => {
    if (!rawData) return [];
    const salesSection = rawData.pnl.find(s => s.name.toLowerCase().includes('sales') && !s.name.toLowerCase().includes('cost'));
    if (!salesSection) return [];
    const items = salesSection.rows.filter(r => !r.isTotal && !r.isSummary);
    return rawData.headers.map((h, hi) => {
      const entry: Record<string, any> = { name: h, isProjection: hi >= projIdx };
      items.forEach(item => { entry[item.label] = item.values[hi]; });
      const totalRow = salesSection.rows.find(r => r.isTotal);
      entry.total = totalRow ? totalRow.values[hi] : items.reduce((s, item) => s + item.values[hi], 0);
      return entry;
    });
  }, [rawData, projIdx]);

  const revenueItems = useMemo(() => {
    if (!rawData) return [];
    const salesSection = rawData.pnl.find(s => s.name.toLowerCase().includes('sales') && !s.name.toLowerCase().includes('cost'));
    if (!salesSection) return [];
    return salesSection.rows.filter(r => !r.isTotal && !r.isSummary).map(r => r.label);
  }, [rawData]);

  const filteredRevenueChartData = useMemo(() => {
    if (!soloRevenue) return revenueChartData;
    return revenueChartData.map(entry => {
      const filtered: Record<string, any> = { name: entry.name, isProjection: entry.isProjection };
      revenueItems.forEach(item => { filtered[item] = item === soloRevenue ? entry[item] : 0; });
      filtered.total = entry.total;
      return filtered;
    });
  }, [revenueChartData, revenueItems, soloRevenue]);

  const profitabilityData = useMemo(() => {
    if (!rawData || activeKeyMetrics.length === 0) return [];
    return rawData.headers.map((h, hi) => {
      const entry: Record<string, any> = { name: h, isProjection: hi >= projIdx };
      activeKeyMetrics.forEach(m => { entry[m.label] = m.values[hi]; });
      const hasAnnotation = ANNOTATIONS.some(a => a.year === h);
      if (hasAnnotation) entry._annotated = true;
      return entry;
    });
  }, [rawData, projIdx, activeKeyMetrics]);

  const costBreakdownData = useMemo(() => {
    if (!rawData) return [];
    const cosSection = rawData.pnl.find(s => s.name.toLowerCase().includes('cost of sales'));
    const sgnaSection = rawData.pnl.find(s => s.name.toLowerCase().includes('sgna') || s.name.toLowerCase().includes('sg&a') || s.name.toLowerCase().includes('sgna'));
    if (!cosSection && !sgnaSection) return [];
    return rawData.headers.map((h, hi) => {
      const cosTotal = cosSection?.rows.find(r => r.isTotal);
      const sgnaTotal = sgnaSection?.rows.find(r => r.isTotal);
      const salesSection = rawData.pnl.find(s => s.name.toLowerCase().includes('sales') && !s.name.toLowerCase().includes('cost'));
      const salesTotal = salesSection?.rows.find(r => r.isTotal);
      const revenue = salesTotal ? salesTotal.values[hi] : 0;
      const cos = cosTotal ? cosTotal.values[hi] : 0;
      const sgna = sgnaTotal ? sgnaTotal.values[hi] : 0;
      return {
        name: h,
        isProjection: hi >= projIdx,
        'Cost of Sales': cos,
        'SG&A': sgna,
        'Gross Margin': revenue > 0 ? ((revenue - cos) / revenue * 100) : 0,
      };
    });
  }, [rawData, projIdx]);

  const filteredCostBreakdownData = useMemo(() => {
    if (!soloCost || soloCost === 'Gross Margin') return costBreakdownData;
    return costBreakdownData.map(entry => ({
      ...entry,
      'Cost of Sales': soloCost === 'Cost of Sales' ? entry['Cost of Sales'] : 0,
      'SG&A': soloCost === 'SG&A' ? entry['SG&A'] : 0,
    }));
  }, [costBreakdownData, soloCost]);

  const sections = activeTab === 'pnl' ? rawData?.pnl : activeTab === 'balance' ? rawData?.balanceSheet : rawData?.cashFlow;

  const REVENUE_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#ef4444', '#14b8a6', '#a855f7'];
  const projectionDividerHeader = rawData && projIdx > 0 && projIdx < rawData.headers.length ? rawData.headers[projIdx] : null;

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

  const isProjectionCol = (hi: number) => hi >= projIdx;
  const isCurrentYear = (hi: number) => hi === projIdx - 1;

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

      <div className={`max-w-[1400px] mx-auto px-4 pt-4 pb-0`}>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          {hasScenarios && Object.keys(scenarioData).length > 0 ? (
            <div className={`inline-flex rounded-lg p-0.5 ${isDark ? 'bg-gray-900/80 border border-gray-800' : 'bg-gray-100 border border-gray-200'}`}>
              {scenarios.map(s => {
                const isActive = activeScenario === s.key;
                const hasData = !!scenarioData[s.key];
                return (
                  <button
                    key={s.key}
                    onClick={() => hasData && switchScenario(s.key)}
                    disabled={!hasData}
                    className={`px-3 py-1.5 rounded-md text-[11px] font-semibold transition-all ${
                      isActive
                        ? 'bg-amber-600 text-white shadow-sm'
                        : hasData
                          ? isDark ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200'
                          : isDark ? 'text-gray-700 cursor-not-allowed' : 'text-gray-300 cursor-not-allowed'
                    }`}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
          ) : <div />}
          <div className="flex items-center gap-2">
            {depreciationShift && (
              <button
                onClick={() => setShowAmortSim(!showAmortSim)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                  showAmortSim
                    ? isDark ? 'bg-violet-900/30 text-violet-400 border border-violet-800' : 'bg-violet-50 text-violet-700 border border-violet-200'
                    : isDark ? 'bg-gray-800/60 text-gray-400 border border-gray-700' : 'bg-gray-100 text-gray-500 border border-gray-200'
                }`}
              >
                {showAmortSim ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                {t('Amort. Simulator')}
                {showAmortSim && <span className={`text-[8px] px-1 py-0.5 rounded-full ${isDark ? 'bg-violet-900/50 text-violet-300' : 'bg-violet-100 text-violet-600'}`}>{t('from 2022')}</span>}
              </button>
            )}
            {priorPeriodValues && (
              <button
                onClick={() => setShowExclContingencies(!showExclContingencies)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                  showExclContingencies
                    ? isDark ? 'bg-cyan-900/30 text-cyan-400 border border-cyan-800' : 'bg-cyan-50 text-cyan-700 border border-cyan-200'
                    : isDark ? 'bg-gray-800/60 text-gray-400 border border-gray-700' : 'bg-gray-100 text-gray-500 border border-gray-200'
                }`}
              >
                {showExclContingencies ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                {t('Excl. Past Contingencies')}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 py-6 space-y-6">
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
            {activeKeyMetrics.length > 0 && (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {activeKeyMetrics.map(metric => {
                    const lastActualIdx = Math.min(projIdx, metric.values.length) - 1;
                    const lastProjIdx = metric.values.length - 1;
                    const currentVal = lastActualIdx >= 0 ? metric.values[lastActualIdx] : 0;
                    const projectedVal = metric.values[lastProjIdx];
                    const improving = projectedVal > currentVal;
                    const currentHeader = lastActualIdx >= 0 ? rawData.headers[lastActualIdx] : '';
                    const projectedHeader = rawData.headers[lastProjIdx];

                    const sparkPoints = metric.values.map((v, i) => {
                      const minV = Math.min(...metric.values);
                      const maxV = Math.max(...metric.values);
                      const range = maxV - minV || 1;
                      return { x: (i / (metric.values.length - 1)) * 100, y: 28 - ((v - minV) / range) * 24, isProj: i >= projIdx };
                    });
                    const actualPath = sparkPoints.filter(p => !p.isProj).map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
                    const projPath = sparkPoints.filter((_p, i) => i >= projIdx - 1).map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');

                    const annotatedIndices = new Set(
                      ANNOTATIONS.map(a => annotationYearIndices.get(a.year)).filter((v): v is number => v !== undefined)
                    );

                    return (
                      <div key={metric.label} className={`${card} p-4 ${(showAmortSim || showExclContingencies) ? (isDark ? 'ring-1 ring-cyan-800/50' : 'ring-1 ring-cyan-200') : ''}`}>
                        <div className="flex items-center justify-between mb-2">
                          <p className={`text-[10px] font-semibold uppercase tracking-wider ${subtext}`}>{metric.label}</p>
                          <div className={`flex items-center gap-0.5 text-[10px] font-medium ${improving ? 'text-emerald-500' : 'text-red-500'}`}>
                            {improving ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                          </div>
                        </div>
                        <svg viewBox="0 0 100 32" className="w-full h-8 mb-2">
                          <path d={actualPath} fill="none" stroke={isDark ? '#9ca3af' : '#6b7280'} strokeWidth="1.5" />
                          {projPath && <path d={projPath} fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="3 2" />}
                          {sparkPoints.map((p, i) => (
                            <React.Fragment key={i}>
                              <circle cx={p.x} cy={p.y} r={i === lastActualIdx ? 2.5 : annotatedIndices.has(i) ? 2 : 1.2}
                                fill={annotatedIndices.has(i) ? '#f59e0b' : i >= projIdx ? '#f59e0b' : isDark ? '#d1d5db' : '#4b5563'}
                                stroke={i === lastActualIdx ? (isDark ? '#fff' : '#111') : annotatedIndices.has(i) ? '#f59e0b' : 'none'}
                                strokeWidth={i === lastActualIdx ? 1 : annotatedIndices.has(i) ? 0.5 : 0} />
                            </React.Fragment>
                          ))}
                          {projIdx > 0 && projIdx < sparkPoints.length && (
                            <line x1={sparkPoints[projIdx].x} y1="0" x2={sparkPoints[projIdx].x} y2="32" stroke={isDark ? '#374151' : '#d1d5db'} strokeWidth="0.5" strokeDasharray="2 1" />
                          )}
                        </svg>
                        <div className="flex items-end justify-between">
                          <div>
                            <p className={`text-[8px] ${subtext}`}>{currentHeader} {t('(actual)')}</p>
                            <p className={`text-sm font-bold tabular-nums ${currentVal < 0 ? 'text-red-500' : isDark ? 'text-white' : 'text-gray-900'}`}>{fmt(currentVal)}</p>
                          </div>
                          <div className="text-right">
                            <p className={`text-[8px] ${subtext}`}>{projectedHeader} {t('(target)')}</p>
                            <p className={`text-sm font-bold tabular-nums ${projectedVal < 0 ? 'text-red-500' : 'text-emerald-500'}`}>{fmt(projectedVal)}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            <div className={`${card} overflow-hidden transition-all`}>
              <button
                onClick={() => setShowContext(!showContext)}
                className={`w-full flex items-center justify-between px-5 py-3 text-left transition-colors ${isDark ? 'hover:bg-gray-800/40' : 'hover:bg-gray-50'}`}
              >
                <div className="flex items-center gap-2">
                  <Info size={14} className={isDark ? 'text-amber-400' : 'text-amber-600'} />
                  <span className={`text-xs font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{t('Historical Context & Adjustments')}</span>
                  <span className={`text-[9px] px-2 py-0.5 rounded-full ${isDark ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-100 text-amber-700'}`}>{ANNOTATIONS.length} {t('notes')}</span>
                </div>
                {showContext ? <ChevronDown size={14} className={subtext} /> : <ChevronRight size={14} className={subtext} />}
              </button>
              {showContext && (
                <div className={`px-5 pb-5 border-t ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
                  <div className="relative mt-4">
                    <div className={`absolute left-[19px] top-0 bottom-0 w-px ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`} />
                    <div className="space-y-4">
                      {ANNOTATIONS.map((ann, i) => (
                        <div key={i} className="relative flex gap-4 pl-0">
                          <div className="relative z-10 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: ann.color }}>
                            {ann.marker}
                          </div>
                          <div className="flex-1 pt-0.5">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>{ann.year}</span>
                              <span className={`text-xs font-semibold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{t(ann.title)}</span>
                            </div>
                            <p className={`text-[11px] leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{t(ann.description)}</p>
                            {ann.impact && (
                              <div className="mt-1.5 flex items-center gap-1">
                                <AlertTriangle size={10} style={{ color: ann.color }} />
                                <span className="text-[10px] font-medium" style={{ color: ann.color }}>{t(ann.impact)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredRevenueChartData.length > 0 && (
                <div className={`${card} p-4`}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className={`text-xs font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{t('Revenue Breakdown')}</h3>
                    <div className="flex items-center gap-3 text-[9px]">
                      <span className={`flex items-center gap-1 ${subtext}`}><span className="w-2 h-2 rounded-sm bg-gray-400 inline-block" /> {t('Actual')}</span>
                      <span className={`flex items-center gap-1 ${subtext}`}><span className="w-2 h-2 rounded-sm bg-amber-500/50 inline-block" style={{ border: '1px dashed #f59e0b' }} /> {t('Projected')}</span>
                    </div>
                  </div>
                  <div className="h-[320px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={filteredRevenueChartData} margin={{ top: 10, right: 10, bottom: 5, left: 5 }}>
                        <defs>
                          {revenueItems.map((item, i) => (
                            <React.Fragment key={item}>
                              <pattern id={`stripe-${i}`} patternUnits="userSpaceOnUse" width="4" height="4" patternTransform="rotate(45)">
                                <rect width="2" height="4" fill={REVENUE_COLORS[i % REVENUE_COLORS.length]} opacity={0.5} />
                              </pattern>
                            </React.Fragment>
                          ))}
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} opacity={0.5} />
                        <XAxis dataKey="name" tick={({ x, y, payload }: any) => {
                          const yearAnns = ANNOTATIONS.filter(a => a.year === payload.value);
                          const hasAnnotation = yearAnns.length > 0;
                          return (
                            <g>
                              <text x={x} y={y + 12} textAnchor="middle" fontSize={9} fill={isDark ? '#9ca3af' : '#6b7280'}>{payload.value}</text>
                              {hasAnnotation && (
                                <g>
                                  {yearAnns.map((ann, ai) => (
                                    <circle key={ai} cx={x + (ai - (yearAnns.length - 1) / 2) * 8} cy={y + 24} r={3.5} fill={ann.color} />
                                  ))}
                                  {yearAnns.map((ann, ai) => (
                                    <text key={`t${ai}`} x={x + (ai - (yearAnns.length - 1) / 2) * 8} y={y + 27} textAnchor="middle" fontSize={5.5} fill="white" fontWeight="bold">{ann.marker}</text>
                                  ))}
                                </g>
                              )}
                            </g>
                          );
                        }} height={38} />
                        <YAxis tick={{ fontSize: 9, fill: isDark ? '#9ca3af' : '#6b7280' }} tickFormatter={(v: number) => fmt(v)} />
                        <Tooltip contentStyle={tipStyle} formatter={(v: number, name: string, props: any) => {
                          if (soloRevenue && props.dataKey !== soloRevenue && props.dataKey !== 'total') return [null, null];
                          return [fmtFull(v), name];
                        }} itemStyle={{ fontSize: 10 }} />
                        <Legend wrapperStyle={{ fontSize: 9, cursor: 'pointer' }} onClick={(e: any) => {
                          if (!e || !e.dataKey) return;
                          const key = e.dataKey as string;
                          if (key === 'total') return;
                          setSoloRevenue(prev => prev === key ? null : key);
                        }} formatter={(value: string, entry: any) => {
                          const isSolo = soloRevenue === entry.dataKey;
                          const isDimmed = soloRevenue !== null && !isSolo && entry.dataKey !== 'total';
                          return <span style={{ color: isDimmed ? (isDark ? '#4b5563' : '#d1d5db') : (isDark ? '#d1d5db' : '#374151'), fontWeight: isSolo ? 700 : 400, cursor: 'pointer' }}>{value}</span>;
                        }} />
                        {projectionDividerHeader && (
                          <ReferenceLine x={projectionDividerHeader} stroke={isDark ? '#f59e0b' : '#d97706'} strokeDasharray="4 3" strokeWidth={1} label={{ value: t('Projected'), position: 'top', fontSize: 8, fill: '#f59e0b' }} />
                        )}
                        {revenueItems.map((item, i) => {
                          const isVisible = !soloRevenue || soloRevenue === item;
                          return (
                            <Bar key={item} dataKey={item} name={item.replace(' Rev', '')} fill={isVisible ? REVENUE_COLORS[i % REVENUE_COLORS.length] : 'transparent'} stackId="a" radius={isVisible && (soloRevenue === item || (!soloRevenue && i === revenueItems.length - 1)) ? [3, 3, 0, 0] : [0, 0, 0, 0]}>
                              {filteredRevenueChartData.map((entry, idx) => (
                                <Cell key={idx} fillOpacity={isVisible ? (entry.isProjection ? 0.45 : 0.9) : 0} />
                              ))}
                            </Bar>
                          );
                        })}
                        <Line type="monotone" dataKey="total" name={t('Total Sales')} stroke={isDark ? '#fbbf24' : '#d97706'} strokeWidth={2.5} dot={{ r: 3, fill: isDark ? '#fbbf24' : '#d97706' }} hide={!!soloRevenue} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {profitabilityData.length > 0 && (
                <div className={`${card} p-4`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <h3 className={`text-xs font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{t('Profitability Path')}</h3>
                      {showAmortSim && <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${isDark ? 'bg-violet-900/30 text-violet-400' : 'bg-violet-50 text-violet-700'}`}>{t('Amort. Sim')}</span>}
                      {showExclContingencies && <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${isDark ? 'bg-cyan-900/30 text-cyan-400' : 'bg-cyan-50 text-cyan-700'}`}>{t('Excl. Conting.')}</span>}
                    </div>
                    <div className="flex items-center gap-3 text-[9px]">
                      <span className={`flex items-center gap-1 ${subtext}`}><span className="w-6 border-t border-gray-400 inline-block" /> {t('Actual')}</span>
                      <span className={`flex items-center gap-1 ${subtext}`}><span className="w-6 border-t border-dashed border-amber-500 inline-block" /> {t('Projected')}</span>
                    </div>
                  </div>
                  <div className="h-[320px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={profitabilityData} margin={{ top: 20, right: 10, bottom: 5, left: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} opacity={0.5} />
                        <XAxis dataKey="name" tick={({ x, y, payload }: any) => {
                          const yearAnns = ANNOTATIONS.filter(a => a.year === payload.value);
                          const hasAnnotation = yearAnns.length > 0;
                          return (
                            <g>
                              <text x={x} y={y + 12} textAnchor="middle" fontSize={9} fill={isDark ? '#9ca3af' : '#6b7280'}>{payload.value}</text>
                              {hasAnnotation && (
                                <g>
                                  {yearAnns.map((ann, ai) => (
                                    <circle key={ai} cx={x + (ai - (yearAnns.length - 1) / 2) * 8} cy={y + 24} r={4} fill={ann.color} />
                                  ))}
                                  {yearAnns.map((ann, ai) => (
                                    <text key={`t${ai}`} x={x + (ai - (yearAnns.length - 1) / 2) * 8} y={y + 27} textAnchor="middle" fontSize={6} fill="white" fontWeight="bold">{ann.marker}</text>
                                  ))}
                                </g>
                              )}
                            </g>
                          );
                        }} height={40} />
                        <YAxis tick={{ fontSize: 9, fill: isDark ? '#9ca3af' : '#6b7280' }} tickFormatter={(v: number) => fmt(v)} />
                        <Tooltip contentStyle={tipStyle} formatter={(v: number, name: string, props: any) => {
                          if (soloProfit && props.dataKey !== soloProfit) return [null, null];
                          return [fmtFull(v), name];
                        }} itemStyle={{ fontSize: 10 }} />
                        <Legend wrapperStyle={{ fontSize: 9, cursor: 'pointer' }} onClick={(e: any) => {
                          if (!e || !e.dataKey) return;
                          setSoloProfit(prev => prev === e.dataKey ? null : e.dataKey);
                        }} formatter={(value: string, entry: any) => {
                          const isSolo = soloProfit === entry.dataKey;
                          const isDimmed = soloProfit !== null && !isSolo;
                          return <span style={{ color: isDimmed ? (isDark ? '#4b5563' : '#d1d5db') : (isDark ? '#d1d5db' : '#374151'), fontWeight: isSolo ? 700 : 400, cursor: 'pointer' }}>{value}</span>;
                        }} />
                        {projectionDividerHeader && (
                          <ReferenceLine x={projectionDividerHeader} stroke={isDark ? '#f59e0b' : '#d97706'} strokeDasharray="4 3" strokeWidth={1} />
                        )}
                        <ReferenceLine y={0} stroke={isDark ? '#4b5563' : '#9ca3af'} strokeWidth={1} />
                        {activeKeyMetrics.map((m, i) => {
                          const colors = ['#f59e0b', '#ef4444', '#8b5cf6', '#3b82f6'];
                          const isVisible = !soloProfit || soloProfit === m.label;
                          return <Line key={m.label} type="monotone" dataKey={m.label} stroke={colors[i % colors.length]} strokeWidth={isVisible ? 2 : 0.5} dot={isVisible ? { r: 2.5 } : false} opacity={isVisible ? 1 : 0.1} />;
                        })}
                        <Area type="monotone" dataKey={soloProfit || 'EBITDA'} fill={isDark ? '#f59e0b20' : '#f59e0b15'} stroke="transparent" />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>

            {filteredCostBreakdownData.length > 0 && (
              <div className={`${card} p-4`}>
                <h3 className={`text-xs font-semibold mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{t('Cost Structure & Gross Margin')}</h3>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={filteredCostBreakdownData} margin={{ top: 10, right: 40, bottom: 5, left: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} opacity={0.5} />
                      <XAxis dataKey="name" tick={{ fontSize: 9, fill: isDark ? '#9ca3af' : '#6b7280' }} />
                      <YAxis yAxisId="left" tick={{ fontSize: 9, fill: isDark ? '#9ca3af' : '#6b7280' }} tickFormatter={(v: number) => fmt(v)} />
                      <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 9, fill: isDark ? '#9ca3af' : '#6b7280' }} tickFormatter={(v: number) => `${v.toFixed(0)}%`} domain={['auto', 'auto']} />
                      <Tooltip contentStyle={tipStyle} formatter={(v: number, name: string, props: any) => {
                        if (soloCost && props.dataKey !== soloCost) return [null, null];
                        return name === 'Gross Margin' ? [`${v.toFixed(1)}%`, name] : [fmtFull(v), name];
                      }} itemStyle={{ fontSize: 10 }} />
                      <Legend wrapperStyle={{ fontSize: 9, cursor: 'pointer' }} onClick={(e: any) => {
                        if (!e || !e.dataKey) return;
                        setSoloCost(prev => prev === e.dataKey ? null : e.dataKey);
                      }} formatter={(value: string, entry: any) => {
                        const isSolo = soloCost === entry.dataKey;
                        const isDimmed = soloCost !== null && !isSolo;
                        return <span style={{ color: isDimmed ? (isDark ? '#4b5563' : '#d1d5db') : (isDark ? '#d1d5db' : '#374151'), fontWeight: isSolo ? 700 : 400, cursor: 'pointer' }}>{value}</span>;
                      }} />
                      {projectionDividerHeader && (
                        <ReferenceLine yAxisId="left" x={projectionDividerHeader} stroke={isDark ? '#f59e0b' : '#d97706'} strokeDasharray="4 3" strokeWidth={1} />
                      )}
                      {(() => {
                        const cosVisible = !soloCost || soloCost === 'Cost of Sales';
                        const sgaVisible = !soloCost || soloCost === 'SG&A';
                        const gmVisible = !soloCost || soloCost === 'Gross Margin';
                        return (
                          <>
                            <Bar yAxisId="left" dataKey="Cost of Sales" fill={cosVisible ? '#ef4444' : 'transparent'} stackId="costs" opacity={0.7}>
                              {filteredCostBreakdownData.map((entry, idx) => (
                                <Cell key={idx} fillOpacity={cosVisible ? (entry.isProjection ? 0.4 : 0.7) : 0} />
                              ))}
                            </Bar>
                            <Bar yAxisId="left" dataKey="SG&A" fill={sgaVisible ? '#8b5cf6' : 'transparent'} stackId="costs" radius={[3, 3, 0, 0]} opacity={0.7}>
                              {filteredCostBreakdownData.map((entry, idx) => (
                                <Cell key={idx} fillOpacity={sgaVisible ? (entry.isProjection ? 0.4 : 0.7) : 0} />
                              ))}
                            </Bar>
                            <Line yAxisId="right" type="monotone" dataKey="Gross Margin" stroke="#10b981" strokeWidth={gmVisible ? 2.5 : 0.5} dot={gmVisible ? { r: 3, fill: '#10b981' } : false} opacity={gmVisible ? 1 : 0.1} />
                          </>
                        );
                      })()}
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

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
                <table className="w-full text-xs" style={{ minWidth: `${280 + rawData.headers.length * 90}px` }}>
                  <thead>
                    <tr className={`border-b ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
                      <th className={`py-2 px-3 text-left font-semibold ${subtext} w-[280px] sticky left-0 z-10 ${isDark ? 'bg-gray-900/90' : 'bg-white/90'}`}></th>
                      {rawData.headers.map((h, hi) => {
                        const yearAnns = ANNOTATIONS.filter(a => a.year === h);
                        return (
                          <th key={h} className={`py-2 px-2 text-right font-semibold whitespace-nowrap ${
                            isCurrentYear(hi) 
                              ? isDark ? 'text-amber-400 bg-amber-500/5' : 'text-amber-700 bg-amber-50'
                              : isProjectionCol(hi)
                                ? isDark ? 'text-gray-600 italic' : 'text-gray-400 italic'
                                : subtext
                          }`}>
                            <span className="flex items-center justify-end gap-1">
                              {yearAnns.length > 0 && (
                                <span className="flex gap-0.5">
                                  {yearAnns.map((ann, ai) => (
                                    <span key={ai} className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full text-[7px] font-bold text-white not-italic" style={{ backgroundColor: ann.color }}>{ann.marker}</span>
                                  ))}
                                </span>
                              )}
                              {h}
                            </span>
                            {isCurrentYear(hi) && <span className="block text-[7px] font-normal not-italic">{t('CURRENT')}</span>}
                            {hi === projIdx && <span className="block text-[7px] font-normal text-amber-500 not-italic">{t('PROJECTED')}</span>}
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {(sections || []).map((section, si) => {
                      const sectionKey = `${activeTab}-${section.name}`;
                      const isExpanded = expandedSections.has(sectionKey);
                      const detailRows = section.rows.filter(r => !r.isTotal && !r.isSummary);
                      const totalRow = section.rows.find(r => r.isTotal && r.label.startsWith('Total ')) || section.rows.find(r => r.isTotal);

                      return (
                        <React.Fragment key={si}>
                          <tr
                            className={`border-b cursor-pointer transition-colors ${isDark ? 'border-gray-800 hover:bg-gray-800/40' : 'border-gray-100 hover:bg-gray-50/80'}`}
                            onClick={() => toggleSection(sectionKey)}
                          >
                            <td className={`py-2.5 px-3 font-bold sticky left-0 z-10 ${isDark ? 'text-white bg-gray-900/90' : 'text-gray-900 bg-white/90'}`}>
                              <span className="inline-flex items-center gap-1.5">
                                {detailRows.length > 0 ? (
                                  isExpanded ? <ChevronDown size={12} className="text-amber-500" /> : <ChevronRight size={12} className="text-gray-400" />
                                ) : <span className="w-3" />}
                                {section.name}
                              </span>
                            </td>
                            {totalRow ? totalRow.values.map((v, vi) => (
                              <td key={vi} className={`py-2.5 px-2 text-right tabular-nums font-bold ${
                                isCurrentYear(vi) ? (isDark ? 'bg-amber-500/5' : 'bg-amber-50') : ''
                              } ${v < 0 ? 'text-red-500' : isProjectionCol(vi) ? (isDark ? 'text-gray-400' : 'text-gray-500') : isDark ? 'text-white' : 'text-gray-900'}`}>{fmt(v)}</td>
                            )) : rawData.headers.map((_, vi) => (
                              <td key={vi} className={`py-2.5 px-2 text-right tabular-nums font-bold ${isCurrentYear(vi) ? (isDark ? 'bg-amber-500/5' : 'bg-amber-50') : ''}`}>—</td>
                            ))}
                          </tr>
                          {isExpanded && detailRows.map((row, ri) => (
                            <tr key={ri} className={`border-b transition-colors ${
                              row.isSummary
                                ? isDark ? 'border-gray-700 bg-gray-800/30' : 'border-gray-200 bg-gray-50'
                                : isDark ? 'border-gray-800/30' : 'border-gray-50'
                            }`}>
                              <td className={`py-1.5 px-3 ${row.isSummary ? 'font-semibold' : ''} ${isDark ? 'text-gray-300' : 'text-gray-700'} sticky left-0 z-10 ${isDark ? 'bg-gray-900/90' : 'bg-white/90'}`}
                                  style={{ paddingLeft: `${(row.depth + 1) * 16 + 12}px` }}>
                                {row.label}
                              </td>
                              {row.values.map((v, vi) => (
                                <td key={vi} className={`py-1.5 px-2 text-right tabular-nums ${
                                  row.isSummary ? 'font-semibold' : ''
                                } ${isCurrentYear(vi) ? (isDark ? 'bg-amber-500/5' : 'bg-amber-50') : ''
                                } ${v < 0 ? 'text-red-400' : isProjectionCol(vi) ? (isDark ? 'text-gray-500' : 'text-gray-400') : isDark ? 'text-gray-400' : 'text-gray-600'}`}>
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
                <label className={`block text-xs font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{t('Scenario Tabs')}</label>
                <p className="text-[10px] text-gray-400 mb-2">{t('Enter the exact tab name in Google Sheets for each scenario')}</p>
                <div className="space-y-2">
                  {scenarios.map((s, idx) => (
                    <div key={s.key} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={s.label}
                        onChange={e => {
                          const updated = [...scenarios];
                          updated[idx] = { ...updated[idx], label: e.target.value };
                          setScenarios(updated);
                        }}
                        placeholder="Label"
                        className={`w-28 px-2 py-1.5 rounded-lg border text-xs ${isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}`}
                      />
                      <input
                        type="text"
                        value={s.tabName}
                        onChange={e => {
                          const updated = [...scenarios];
                          updated[idx] = { ...updated[idx], tabName: e.target.value };
                          setScenarios(updated);
                        }}
                        placeholder="Tab name in Sheets"
                        className={`flex-1 px-2 py-1.5 rounded-lg border text-xs ${isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}`}
                      />
                    </div>
                  ))}
                </div>
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
