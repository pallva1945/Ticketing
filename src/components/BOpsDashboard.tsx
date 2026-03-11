import React, { useState, useEffect, useMemo } from 'react';
import { Activity, Euro, Target, AlertTriangle, TrendingUp, CheckCircle2, FileSpreadsheet, Loader2, Check, Settings, X } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

const MODULE_KEY = 'bops';
const SEASON_MONTHS = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
const COLORS_POOL = ['#10b981', '#6366f1', '#f59e0b', '#3b82f6', '#ef4444', '#a855f7', '#14b8a6', '#f97316', '#ec4899', '#8b5cf6'];

const formatCurrency = (val: number) => `€${val.toLocaleString('it-IT', { maximumFractionDigits: 0 })}`;
const formatCompact = (val: number) => {
  if (Math.abs(val) >= 10000) return `€${Math.round(val / 1000)}K`;
  if (Math.abs(val) >= 1000) return `€${(val / 1000).toFixed(1)}K`;
  return `€${Math.round(val)}`;
};

function getSeasonMonthsElapsed(): number {
  const now = new Date();
  const month = now.getMonth();
  const seasonIndex = month >= 6 ? month - 6 : month + 6;
  const GAME_MONTH_START = 2;
  const TOTAL_GAME_MONTHS = 10;
  const elapsed = Math.max(0, Math.min(seasonIndex - GAME_MONTH_START, TOTAL_GAME_MONTHS));
  return elapsed;
}

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

export interface BopsSheetData {
  monthlyRevenue: MonthlyRevenueItem[];
  seasonBudget: number;
}

const EMPTY_MONTHLY_REVENUE: MonthlyRevenueItem[] = [];

const DEFAULT_SEASON_BUDGET = 525000;

const NOTES = [
  {
    type: 'warning' as const,
    title: 'U26 Qualification Status',
    text: 'Under 26 revenue is in budget but the club does not currently qualify due to the roster status change from 5+5 to 6+6. This was decided as part of the use of funds from the last Aucap (capital increase).',
  },
  {
    type: 'info' as const,
    title: 'Revenue Recognition',
    text: 'All BOps revenue is recognized across 10 months (Sep–Jun) to match gameday revenue recognition timing across the season.',
  },
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

export function parseBopsSheetData(rows: string[][]): BopsSheetData | null {
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

  const breakdown: { name: string; amount: number; note: string }[] = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;
    const label = (row[0] || '').trim().toLowerCase();

    if (['season budget', 'seasonbudget'].includes(label)) {
      seasonBudget = parseEuro(row[1] || '') || DEFAULT_SEASON_BUDGET;
    } else if (!['', 'category', 'name', 'item', 'h1 budget', 'h1budget', 'period', 'period label'].includes(label)) {
      const amount = parseEuro(row[1] || '');
      if (amount > 0) {
        breakdown.push({ name: (row[0] || '').trim(), amount, note: (row[2] || '').trim() });
      }
    }
  }

  if (breakdown.length === 0) return null;

  const elapsed = getSeasonMonthsElapsed();
  const GAME_MONTH_START = 2;
  const TOTAL_GAME_MONTHS = 10;
  const items: MonthlyRevenueItem[] = breakdown.map((b, i) => ({
    name: b.name,
    values: SEASON_MONTHS.map((_, mi) => mi >= GAME_MONTH_START && mi < GAME_MONTH_START + elapsed ? Math.round(b.amount / TOTAL_GAME_MONTHS) : 0),
    color: COLORS_POOL[i % COLORS_POOL.length],
    note: b.note,
  }));

  return { monthlyRevenue: items, seasonBudget };
}

export const BOpsDashboard: React.FC = () => {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const { isAdmin } = useAuth();
  const isDark = theme === 'dark';

  const [sheetData, setSheetData] = useState<BopsSheetData | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [showSheetConfig, setShowSheetConfig] = useState(false);
  const [sheetId, setSheetId] = useState('');
  const [sheetName, setSheetName] = useState('BOps');
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
          const parsed = parseBopsSheetData(res.data);
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
        const parsed = parseBopsSheetData(result.data);
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
  const remaining = seasonBudget - ytd;
  const pctOfBudget = (ytd / seasonBudget) * 100;

  const lastActiveMonth = useMemo(() => {
    for (let i = 11; i >= 0; i--) {
      if (monthlyTotals[i] > 0) return i;
    }
    return -1;
  }, [monthlyTotals]);

  const chartData = useMemo(() =>
    SEASON_MONTHS.map((name, i) => ({
      name,
      total: monthlyTotals[i],
      hasData: i <= lastActiveMonth,
    })).slice(0, Math.max(lastActiveMonth + 2, 7)),
    [monthlyTotals, lastActiveMonth]
  );

  const itemYTDs = useMemo(() =>
    monthlyRevenue.map(item => item.values.reduce((s, v) => s + v, 0)),
    [monthlyRevenue]
  );

  const cardClass = `rounded-xl border shadow-sm p-5 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`;
  const labelClass = `text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/20 rounded-xl">
            <Activity className="text-emerald-600" size={22} />
          </div>
          <div>
            <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('BOps — Serie A')}</h2>
            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('Basketball Operations')} · {t('Monthly Revenue')} · 25/26</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
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
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={cardClass}>
          <div className="flex items-center gap-2 mb-1">
            <Euro size={13} className={isDark ? 'text-gray-400' : 'text-gray-500'} />
            <span className={labelClass}>{t('YTD Revenue')}</span>
          </div>
          <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(ytd)}</div>
          <div className={`mt-2 w-full rounded-full h-2 ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
            <div className="bg-emerald-500 h-2 rounded-full transition-all" style={{ width: `${Math.min(pctOfBudget, 100)}%` }} />
          </div>
          <div className="flex justify-between mt-1">
            <span className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{pctOfBudget.toFixed(1)}% {t('of season')}</span>
            <span className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{t('Through')} {SEASON_MONTHS[lastActiveMonth] || '—'}</span>
          </div>
        </div>

        <div className={cardClass}>
          <div className="flex items-center gap-2 mb-1">
            <Target size={13} className={isDark ? 'text-gray-400' : 'text-gray-500'} />
            <span className={labelClass}>{t('Season Budget')}</span>
          </div>
          <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(seasonBudget)}</div>
          <div className={`mt-2 text-[11px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {lastActiveMonth >= 0 ? `${lastActiveMonth + 1}/12 ${t('months reported')}` : t('No data yet')}
          </div>
        </div>

        <div className={cardClass}>
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={13} className={isDark ? 'text-gray-400' : 'text-gray-500'} />
            <span className={labelClass}>{t('Remaining')}</span>
          </div>
          <div className={`text-2xl font-bold ${remaining > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
            {remaining > 0 ? formatCurrency(remaining) : formatCurrency(Math.abs(remaining))}
          </div>
          <div className={`mt-2 text-[11px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {remaining > 0 ? `${formatCurrency(remaining)} ${t('to reach target')}` : t('Target exceeded')}
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
                <td className={`text-right py-2.5 px-2 font-bold tabular-nums text-emerald-600`}>{formatCurrency(ytd)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className={cardClass}>
        <h3 className={`text-sm font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>{t('Monthly Revenue Trend')}</h3>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#f3f4f6'} vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: isDark ? '#9ca3af' : '#6b7280' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `€${(v / 1000).toFixed(0)}K`} width={50} />
              <Tooltip
                cursor={{ fill: 'rgba(0,0,0,0.04)' }}
                contentStyle={{ borderRadius: '8px', fontSize: '12px', backgroundColor: isDark ? '#1f2937' : '#fff', border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`, color: isDark ? '#f3f4f6' : '#111827' }}
                formatter={(value: number) => [formatCurrency(value), t('Revenue')]}
              />
              <Bar dataKey="total" radius={[6, 6, 0, 0]}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.total > 0 ? '#10b981' : (isDark ? '#374151' : '#e5e7eb')} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="space-y-3">
        {NOTES.map((note, i) => (
          <div
            key={i}
            className={`rounded-xl border p-4 flex gap-3 ${
              note.type === 'warning'
                ? 'bg-amber-50/50 dark:bg-amber-900/30 border-amber-200'
                : 'bg-blue-50/50 dark:bg-blue-900/30 border-blue-200'
            }`}
          >
            {note.type === 'warning' ? (
              <AlertTriangle size={16} className="text-amber-500 mt-0.5 shrink-0" />
            ) : (
              <CheckCircle2 size={16} className="text-blue-500 mt-0.5 shrink-0" />
            )}
            <div>
              <div className={`text-xs font-semibold mb-0.5 ${note.type === 'warning' ? 'text-amber-700' : 'text-blue-700'}`}>
                {t(note.title)}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{t(note.text)}</div>
            </div>
          </div>
        ))}
      </div>

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
                  placeholder="BOps"
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