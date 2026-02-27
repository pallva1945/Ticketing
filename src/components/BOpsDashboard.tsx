import React, { useState, useEffect } from 'react';
import { Activity, Euro, Target, AlertTriangle, TrendingUp, Calendar, CheckCircle2, FileSpreadsheet, Loader2, Check, Settings, X } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';

const MODULE_KEY = 'bops';

const formatCurrency = (val: number) => `€${val.toLocaleString('it-IT', { maximumFractionDigits: 0 })}`;

const parseEuro = (s: string): number => {
  if (!s || typeof s !== 'string') return 0;
  const cleaned = s.replace(/[€\s]/g, '').replace(/\./g, '').replace(',', '.');
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
};

const DEFAULT_BOPS_DATA = {
  periodLabel: '4/10 Months',
  h1Budget: 180000,
  seasonBudget: 525000,
  h1Actual: 173508,
};

const DEFAULT_REVENUE_BREAKDOWN = [
  { name: 'Buy Out (Elisée Assui)', amount: 80000, color: '#10b981', note: 'Player buyout revenue' },
  { name: 'U23–U26', amount: 18500, color: '#6366f1', note: 'Youth development allocation' },
  { name: 'LBA Shared Revenue', amount: 75008, color: '#f59e0b', note: 'League shared revenue pool' },
];

const COLORS_POOL = ['#10b981', '#6366f1', '#f59e0b', '#3b82f6', '#ef4444', '#a855f7', '#14b8a6', '#f97316', '#ec4899', '#8b5cf6'];

const NOTES = [
  {
    type: 'warning' as const,
    title: 'U26 Qualification Status',
    text: 'Under 26 revenue is in budget but the club does not currently qualify due to the roster status change from 5+5 to 6+6. This was decided as part of the use of funds from the last Aucap (capital increase).',
  },
  {
    type: 'info' as const,
    title: 'Revenue Recognition',
    text: 'All BOps revenue is accounted on a 4/10 basis to match gameday revenue recognition timing across the season.',
  },
];

function parseSheetData(rows: string[][]) {
  if (!rows || rows.length < 2) return null;

  const breakdown: { name: string; amount: number; color: string; note: string }[] = [];
  let h1Budget = 0;
  let seasonBudget = 0;
  let periodLabel = '';

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;
    const label = (row[0] || '').trim().toLowerCase();

    if (label === 'h1 budget' || label === 'h1budget') {
      h1Budget = parseEuro(row[1] || '');
    } else if (label === 'season budget' || label === 'seasonbudget') {
      seasonBudget = parseEuro(row[1] || '');
    } else if (label === 'period' || label === 'period label') {
      periodLabel = (row[1] || '').trim();
    } else if (label && !['category', 'name', 'item', ''].includes(label)) {
      const amount = parseEuro(row[1] || '');
      if (amount > 0) {
        const note = (row[2] || '').trim();
        breakdown.push({
          name: (row[0] || '').trim(),
          amount,
          color: COLORS_POOL[breakdown.length % COLORS_POOL.length],
          note: note || '',
        });
      }
    }
  }

  if (breakdown.length === 0) return null;

  const h1Actual = breakdown.reduce((s, b) => s + b.amount, 0);

  return {
    bopsData: {
      periodLabel: periodLabel || DEFAULT_BOPS_DATA.periodLabel,
      h1Budget: h1Budget || h1Actual,
      seasonBudget: seasonBudget || h1Actual * 2.5,
      h1Actual,
    },
    breakdown,
  };
}

export const BOpsDashboard: React.FC = () => {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [sheetData, setSheetData] = useState<ReturnType<typeof parseSheetData>>(null);
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
          const parsed = parseSheetData(res.data);
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
        const parsed = parseSheetData(result.data);
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

  const BOPS_DATA = sheetData?.bopsData || DEFAULT_BOPS_DATA;
  const REVENUE_BREAKDOWN = sheetData?.breakdown || DEFAULT_REVENUE_BREAKDOWN;
  const hasLiveData = !!sheetData;

  const pctOfBudget = (BOPS_DATA.h1Actual / BOPS_DATA.h1Budget) * 100;
  const gap = BOPS_DATA.h1Budget - BOPS_DATA.h1Actual;
  const pieData = REVENUE_BREAKDOWN.map(r => ({ name: r.name, value: r.amount }));
  const pieColors = REVENUE_BREAKDOWN.map(r => r.color);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/20 rounded-xl">
            <Activity className="text-emerald-600" size={22} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('BOps — Serie A')}</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t('Basketball Operations')} · {BOPS_DATA.periodLabel} {t('Accounting')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
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
            {isSyncing ? (
              <Loader2 size={14} className="animate-spin" />
            ) : syncSuccess ? (
              <Check size={14} />
            ) : (
              <FileSpreadsheet size={14} className="text-green-600" />
            )}
            {isSyncing ? t('Syncing...') : syncSuccess ? t('Synced') : sheetConfigured ? t('Sync Sheet') : t('Connect Sheet')}
          </button>
          {sheetConfigured && (
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
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-1">
            <Euro size={13} />
            <span>{t('H1 Revenue')} ({BOPS_DATA.periodLabel})</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(BOPS_DATA.h1Actual)}</div>
          <div className="mt-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2">
            <div
              className="bg-emerald-500 h-2 rounded-full transition-all"
              style={{ width: `${Math.min(pctOfBudget, 100)}%` }}
            />
          </div>
          <div className="flex justify-between mt-1 text-[10px] text-gray-400 dark:text-gray-500">
            <span>{pctOfBudget.toFixed(1)}% {t('of H1 budget')}</span>
            <span>{formatCurrency(BOPS_DATA.h1Budget)}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-1">
            <Target size={13} />
            <span>{t('Season Budget')}</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(BOPS_DATA.seasonBudget)}</div>
          <div className="mt-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2">
            <div
              className="bg-emerald-500 h-2 rounded-full transition-all"
              style={{ width: `${Math.min((BOPS_DATA.h1Actual / BOPS_DATA.seasonBudget) * 100, 100)}%` }}
            />
          </div>
          <div className="flex justify-between mt-1 text-[10px] text-gray-400 dark:text-gray-500">
            <span>{((BOPS_DATA.h1Actual / BOPS_DATA.seasonBudget) * 100).toFixed(1)}% {t('achieved')}</span>
            <span>{formatCurrency(BOPS_DATA.seasonBudget)}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-1">
            <TrendingUp size={13} />
            <span>{t('H1 Gap to Budget')}</span>
          </div>
          <div className={`text-2xl font-bold ${gap > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
            {gap > 0 ? `-${formatCurrency(gap)}` : formatCurrency(Math.abs(gap))}
          </div>
          <div className="mt-2 text-[11px] text-gray-500 dark:text-gray-400">
            {gap > 0
              ? `${formatCurrency(gap)} ${t('below H1 target')}`
              : t('On or above target')}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-4">{t('Revenue Breakdown')}</h3>
          <div className="space-y-3">
            {REVENUE_BREAKDOWN.map((item) => {
              const pct = (item.amount / BOPS_DATA.h1Actual) * 100;
              return (
                <div key={item.name} className="group">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-sm text-gray-700 dark:text-gray-200">{t(item.name)}</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{formatCurrency(item.amount)}</span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5 ml-5">
                    <div
                      className="h-1.5 rounded-full transition-all"
                      style={{ width: `${pct}%`, backgroundColor: item.color }}
                    />
                  </div>
                  <div className="flex justify-between ml-5 mt-0.5">
                    <span className="text-[10px] text-gray-400 dark:text-gray-500">{t(item.note)}</span>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500">{pct.toFixed(1)}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-4">{t('Revenue Distribution')}</h3>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  dataKey="value"
                  paddingAngle={3}
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={pieColors[i]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ borderRadius: '8px', fontSize: '12px', border: '1px solid #e5e7eb' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-3 mt-2">
            {REVENUE_BREAKDOWN.map((item) => (
              <div key={item.name} className="flex items-center gap-1.5 text-[11px] text-gray-600 dark:text-gray-400">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                {item.name.split('(')[0].trim()}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
          <Calendar size={14} />
          {t('Accounting Method')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-emerald-50/50 dark:bg-emerald-900/30 rounded-lg p-4 border border-emerald-100">
            <div className="text-xs font-medium text-emerald-700 mb-2">{t('4/10 Month Basis')}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {t('BOps revenue is recognized on a')} <strong>{t('4 out of 10 month')}</strong> {t('basis to align with the gameday revenue cycle. This ensures consistent period-over-period comparisons and matches the competitive season calendar.')}
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="text-xs font-medium text-gray-700 dark:text-gray-200 mb-2">{t('Season Projection')}</div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">{t('H1 (4/10)')}</span>
                <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(BOPS_DATA.h1Actual)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">{t('H2 Remaining (6/10)')}</span>
                <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(BOPS_DATA.seasonBudget - BOPS_DATA.h1Actual)}</span>
              </div>
              <div className="border-t border-gray-200 dark:border-gray-700 pt-1 flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400 font-medium">{t('Season Target (label)')}</span>
                <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(BOPS_DATA.seasonBudget)}</span>
              </div>
            </div>
          </div>
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
              <div className={`text-xs font-semibold mb-0.5 ${
                note.type === 'warning' ? 'text-amber-700' : 'text-blue-700'
              }`}>
                {t(note.title)}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{t(note.text)}</div>
            </div>
          </div>
        ))}
      </div>

      {showSheetConfig && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]" onClick={() => setShowSheetConfig(false)}>
          <div className={`rounded-xl shadow-2xl w-full max-w-md mx-4 ${isDark ? 'bg-gray-900 border border-gray-700' : 'bg-white border border-gray-200'}`} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <FileSpreadsheet size={18} className="text-green-600" />
                <h3 className="font-semibold text-gray-900 dark:text-white">{t('Google Sheet Configuration')}</h3>
              </div>
              <button onClick={() => setShowSheetConfig(false)} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
                <X size={16} className="text-gray-500" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  {t('Spreadsheet ID')}
                </label>
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
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  {t('Sheet Tab Name')}
                </label>
                <input
                  type="text"
                  value={sheetName}
                  onChange={e => setSheetName(e.target.value)}
                  placeholder="BOps"
                  className={`w-full px-3 py-2 rounded-lg border text-sm ${isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}`}
                />
                <p className="text-[10px] text-gray-400 mt-1">{t('The exact name of the tab/sheet to read from')}</p>
              </div>
            </div>
            <div className="flex justify-end gap-2 p-5 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowSheetConfig(false)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${isDark ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                {t('Cancel')}
              </button>
              <button
                onClick={handleSaveSheetConfig}
                disabled={!sheetId.trim()}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {t('Save & Connect')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
