import React, { useState, useEffect, useMemo } from 'react';
import { Shield, Zap, Truck, Search, Sun, Moon, ArrowLeft, Home, FileSpreadsheet, Loader2, Check, Settings, X, ChevronDown, ChevronUp, RefreshCw, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Cell, LineChart, Line, Legend } from 'recharts';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { PV_LOGO_URL } from '../constants';

const SEASON_MONTHS = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
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

interface MonthlyItem {
  name: string;
  values: number[];
  color: string;
  unit?: string;
}

interface SheetTabData {
  items: MonthlyItem[];
  seasonBudget: number;
}

const COLORS_POOL = ['#8b5cf6', '#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6', '#f97316', '#a855f7'];

const MONTH_ALIASES: Record<string, number> = {
  'jul': 0, 'july': 0, 'lug': 0, 'luglio': 0,
  'aug': 1, 'august': 1, 'ago': 1, 'agosto': 1,
  'sep': 2, 'september': 2, 'set': 2, 'settembre': 2,
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

function parseSheetData(rows: string[][]): SheetTabData | null {
  if (!rows || rows.length < 2) return null;
  const items: MonthlyItem[] = [];
  let seasonBudget = 0;
  let monthIndices: number[] = [];

  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length === 0) continue;
    const label = (row[0] || '').trim().toLowerCase();

    if (label === 'month' || label === 'mese' || label === 'period') {
      monthIndices = [];
      for (let c = 1; c < row.length; c++) {
        const cellVal = (row[c] || '').trim().toLowerCase();
        const mi = MONTH_ALIASES[cellVal];
        if (mi !== undefined) monthIndices.push(mi);
      }
      continue;
    }

    if (label === 'budget' || label === 'season budget' || label === 'total budget') {
      seasonBudget = parseEuro(row[1] || '');
      continue;
    }

    if (label === '' || label === 'category' || label === 'name' || label === 'item') continue;

    const values = new Array(12).fill(0);
    let hasValue = false;
    for (let c = 1; c < row.length && c - 1 < monthIndices.length; c++) {
      const v = parseEuro(row[c] || '');
      if (v > 0) { values[monthIndices[c - 1]] = v; hasValue = true; }
    }
    if (hasValue) {
      items.push({
        name: (row[0] || '').trim(),
        values,
        color: COLORS_POOL[items.length % COLORS_POOL.length],
        unit: (row[row.length - 1] || '').trim() || undefined,
      });
    }
  }

  if (items.length === 0) return null;
  return { items, seasonBudget };
}

function getCurrentSeason(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  if (month >= 6) {
    return `${String(year).slice(-2)}-${String(year + 1).slice(-2)}`;
  }
  return `${String(year - 1).slice(-2)}-${String(year).slice(-2)}`;
}

type TabId = 'energy' | 'van' | 'transactions';

interface CostControlCenterProps {
  onBackToLanding: () => void;
  onHome?: () => void;
}

export const CostControlCenter: React.FC<CostControlCenterProps> = ({ onBackToLanding, onHome }) => {
  const { theme, toggleTheme } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();
  const isDark = theme === 'dark';

  const [activeTab, setActiveTab] = useState<TabId>('energy');
  const [selectedSeason, setSelectedSeason] = useState(getCurrentSeason());

  const [energyData, setEnergyData] = useState<SheetTabData | null>(null);
  const [vanData, setVanData] = useState<SheetTabData | null>(null);

  const [energySheetId, setEnergySheetId] = useState('');
  const [energySheetName, setEnergySheetName] = useState('Energy');
  const [energyConfigured, setEnergyConfigured] = useState(false);
  const [showEnergyConfig, setShowEnergyConfig] = useState(false);

  const [vanSheetId, setVanSheetId] = useState('');
  const [vanSheetName, setVanSheetName] = useState('Van');
  const [vanConfigured, setVanConfigured] = useState(false);
  const [showVanConfig, setShowVanConfig] = useState(false);

  const [isSyncing, setIsSyncing] = useState<string | null>(null);
  const [syncSuccess, setSyncSuccess] = useState<string | null>(null);

  const [txSearch, setTxSearch] = useState('');

  const seasons = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const currentStartYear = month >= 6 ? year : year - 1;
    const result: string[] = [];
    for (let y = currentStartYear; y >= currentStartYear - 2; y--) {
      result.push(`${String(y).slice(-2)}-${String(y + 1).slice(-2)}`);
    }
    return result;
  }, []);

  useEffect(() => {
    ['energy', 'van'].forEach(mod => {
      fetch(`/api/revenue/sheet-config/${mod}`)
        .then(r => r.json())
        .then(res => {
          if (res.success) {
            if (mod === 'energy') {
              if (res.sheetId) { setEnergySheetId(res.sheetId); setEnergyConfigured(true); }
              if (res.sheetName) setEnergySheetName(res.sheetName);
            } else {
              if (res.sheetId) { setVanSheetId(res.sheetId); setVanConfigured(true); }
              if (res.sheetName) setVanSheetName(res.sheetName);
            }
          }
        }).catch(() => {});
      fetch(`/api/revenue/sheet-data/${mod}`)
        .then(r => r.json())
        .then(res => {
          if (res.success && res.data) {
            const parsed = parseSheetData(res.data);
            if (mod === 'energy' && parsed) setEnergyData(parsed);
            if (mod === 'van' && parsed) setVanData(parsed);
          }
        }).catch(() => {});
    });
  }, []);

  const handleSyncSheet = async (mod: 'energy' | 'van') => {
    setIsSyncing(mod);
    setSyncSuccess(null);
    try {
      const res = await fetch(`/api/revenue/sync-sheet/${mod}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
      const result = await res.json();
      if (result.success) {
        const parsed = parseSheetData(result.data);
        if (mod === 'energy' && parsed) setEnergyData(parsed);
        if (mod === 'van' && parsed) setVanData(parsed);
        setSyncSuccess(mod);
        setTimeout(() => setSyncSuccess(null), 3000);
      } else {
        alert(result.message || 'Sync failed');
      }
    } catch (err) {
      console.error('Sync failed:', err);
    } finally {
      setIsSyncing(null);
    }
  };

  const handleSaveConfig = async (mod: 'energy' | 'van') => {
    const sid = mod === 'energy' ? energySheetId : vanSheetId;
    const sname = mod === 'energy' ? energySheetName : vanSheetName;
    if (!sid.trim()) return;
    try {
      const res = await fetch(`/api/revenue/sheet-config/${mod}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sheetId: sid.trim(), sheetName: sname.trim() }) });
      const result = await res.json();
      if (result.success) {
        if (mod === 'energy') { setEnergyConfigured(true); setShowEnergyConfig(false); }
        else { setVanConfigured(true); setShowVanConfig(false); }
      }
    } catch (err) {
      console.error('Config save failed:', err);
    }
  };

  const tabs: { id: TabId; label: string; icon: React.ElementType; color: string }[] = [
    { id: 'energy', label: t('Energy'), icon: Zap, color: 'text-yellow-600' },
    { id: 'van', label: t('Van'), icon: Truck, color: 'text-blue-600' },
    { id: 'transactions', label: t('Transaction Search'), icon: Search, color: 'text-purple-600' },
  ];

  const renderSheetTab = (mod: 'energy' | 'van', data: SheetTabData | null, configured: boolean, sheetId: string, setSheetIdFn: (v: string) => void, sheetName: string, setSheetNameFn: (v: string) => void, showConfig: boolean, setShowConfigFn: (v: boolean) => void, icon: React.ElementType, iconColor: string) => {
    const Icon = icon;
    const items = data?.items || [];
    const monthlyTotals = SEASON_MONTHS.map((_, mi) => items.reduce((s, item) => s + item.values[mi], 0));
    const ytd = monthlyTotals.reduce((s, v) => s + v, 0);
    const lastActiveMonth = (() => { for (let i = 11; i >= 0; i--) { if (monthlyTotals[i] > 0) return i; } return -1; })();
    const chartData = SEASON_MONTHS.map((name, i) => ({ name, total: monthlyTotals[i], hasData: i <= lastActiveMonth })).slice(0, Math.max(lastActiveMonth + 2, 7));
    const itemYTDs = items.map(item => item.values.reduce((s, v) => s + v, 0));

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
              <Icon size={20} className={iconColor} />
            </div>
            <div>
              <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>{mod === 'energy' ? t('Energy Consumption') : t('Van Costs')}</h2>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('Season')} {selectedSeason}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {configured && (
              <button onClick={() => handleSyncSheet(mod)} disabled={isSyncing === mod}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${syncSuccess === mod ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-900/50'}`}>
                {isSyncing === mod ? <Loader2 size={14} className="animate-spin" /> : syncSuccess === mod ? <Check size={14} /> : <RefreshCw size={14} />}
                {syncSuccess === mod ? t('Synced') : t('Sync Sheet')}
              </button>
            )}
            <button onClick={() => setShowConfigFn(!showConfig)}
              className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
              <Settings size={16} />
            </button>
          </div>
        </div>

        {showConfig && (
          <div className={`p-4 rounded-xl border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
            <h4 className={`text-sm font-semibold mb-3 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>{t('Google Sheet Configuration')}</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">{t('Sheet ID')}</label>
                <input value={sheetId} onChange={(e) => setSheetIdFn(e.target.value)} placeholder="1abc..." className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">{t('Tab Name')}</label>
                <input value={sheetName} onChange={(e) => setSheetNameFn(e.target.value)} placeholder={mod === 'energy' ? 'Energy' : 'Van'} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <button onClick={() => handleSaveConfig(mod)} className="px-4 py-1.5 bg-purple-600 text-white text-xs rounded-lg hover:bg-purple-700">{t('Save')}</button>
              <button onClick={() => setShowConfigFn(false)} className="px-4 py-1.5 bg-gray-200 dark:bg-gray-700 text-xs rounded-lg">{t('Cancel')}</button>
            </div>
          </div>
        )}

        {!data ? (
          <div className={`p-12 rounded-xl border text-center ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
            <FileSpreadsheet size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>{t('No Data Connected')}</h3>
            <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {t('Connect a Google Sheet to start tracking')} {mod === 'energy' ? t('energy consumption') : t('van costs')}.
            </p>
            <button onClick={() => setShowConfigFn(true)} className="px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700">
              <FileSpreadsheet size={16} className="inline mr-1.5" />{t('Connect Sheet')}
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className={`p-4 rounded-xl border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} shadow-sm`}>
                <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('YTD Total')}</p>
                <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>{formatCurrency(ytd)}</p>
                <p className={`text-[10px] mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{t('Through')} {SEASON_MONTHS[lastActiveMonth] || '—'}</p>
              </div>
              {data.seasonBudget > 0 && (
                <div className={`p-4 rounded-xl border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} shadow-sm`}>
                  <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('Season Budget')}</p>
                  <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>{formatCurrency(data.seasonBudget)}</p>
                  <p className={`text-[10px] mt-1 ${ytd > data.seasonBudget ? 'text-red-500' : isDark ? 'text-gray-500' : 'text-gray-400'}`}>{data.seasonBudget > 0 ? `${((ytd / data.seasonBudget) * 100).toFixed(1)}% ${t('used')}` : ''}</p>
                </div>
              )}
              <div className={`p-4 rounded-xl border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} shadow-sm`}>
                <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('Avg Monthly')}</p>
                <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>{lastActiveMonth >= 0 ? formatCurrency(ytd / (lastActiveMonth + 1)) : '—'}</p>
              </div>
              <div className={`p-4 rounded-xl border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} shadow-sm`}>
                <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('Line Items')}</p>
                <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>{items.length}</p>
              </div>
            </div>

            <div className={`p-5 rounded-xl border shadow-sm ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
              <h3 className={`text-sm font-bold uppercase tracking-wider mb-4 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>{t('Monthly Breakdown')}</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tickFormatter={formatCompact} tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                    <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={index} fill={entry.hasData ? (mod === 'energy' ? '#f59e0b' : '#3b82f6') : '#e5e7eb'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className={`p-5 rounded-xl border shadow-sm ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
              <h3 className={`text-sm font-bold uppercase tracking-wider mb-4 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>{t('Cost Items')}</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className={`border-b ${isDark ? 'border-gray-700 text-gray-400' : 'border-gray-200 text-gray-500'}`}>
                      <th className="text-left py-2 px-3 font-medium">{t('Item')}</th>
                      {SEASON_MONTHS.slice(0, Math.max(lastActiveMonth + 1, 1)).map(m => (
                        <th key={m} className="text-right py-2 px-2 font-medium text-xs">{m}</th>
                      ))}
                      <th className="text-right py-2 px-3 font-medium">{t('Total')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => (
                      <tr key={idx} className={`border-b ${isDark ? 'border-gray-800 hover:bg-gray-800/50' : 'border-gray-100 hover:bg-gray-50'}`}>
                        <td className={`py-2 px-3 font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                          <span className="inline-block w-2 h-2 rounded-full mr-2" style={{ backgroundColor: item.color }} />
                          {item.name}
                        </td>
                        {SEASON_MONTHS.slice(0, Math.max(lastActiveMonth + 1, 1)).map((m, mi) => (
                          <td key={m} className={`text-right py-2 px-2 tabular-nums text-xs ${item.values[mi] > 0 ? (isDark ? 'text-gray-200' : 'text-gray-700') : (isDark ? 'text-gray-600' : 'text-gray-300')}`}>
                            {item.values[mi] > 0 ? formatCurrency(item.values[mi]) : '—'}
                          </td>
                        ))}
                        <td className={`text-right py-2 px-3 font-semibold tabular-nums ${isDark ? 'text-white' : 'text-gray-800'}`}>{formatCurrency(itemYTDs[idx])}</td>
                      </tr>
                    ))}
                    <tr className={`font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                      <td className="py-2 px-3">{t('Total')}</td>
                      {SEASON_MONTHS.slice(0, Math.max(lastActiveMonth + 1, 1)).map((m, mi) => (
                        <td key={m} className="text-right py-2 px-2 tabular-nums text-xs">{monthlyTotals[mi] > 0 ? formatCurrency(monthlyTotals[mi]) : '—'}</td>
                      ))}
                      <td className="text-right py-2 px-3 tabular-nums">{formatCurrency(ytd)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  const renderTransactionsTab = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
          <Search size={20} className="text-purple-600" />
        </div>
        <div>
          <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>{t('Transaction Search')}</h2>
          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('Search accounting transactions from Xero')}</p>
        </div>
      </div>

      <div className={`p-8 rounded-xl border text-center ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
        <Search size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
        <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>{t('Xero Integration Coming Soon')}</h3>
        <p className={`text-sm mb-4 max-w-md mx-auto ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          {t('Connect your Xero account to search invoices, bills, and payments directly from the portal. Set up your Xero API credentials to get started.')}
        </p>
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm ${isDark ? 'bg-purple-900/30 text-purple-400' : 'bg-purple-50 text-purple-700'}`}>
          <Shield size={16} />
          {t('Requires Xero OAuth setup')}
        </div>

        <div className="mt-6">
          <div className="relative max-w-lg mx-auto">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={txSearch}
              onChange={(e) => setTxSearch(e.target.value)}
              placeholder={t('Search transactions (connect Xero to enable)...')}
              disabled
              className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm opacity-50 cursor-not-allowed ${isDark ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-700'}`}
            />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen ${isDark ? 'dark bg-gray-950' : 'bg-gray-50'}`}>
      <header className={`sticky top-0 z-50 border-b ${isDark ? 'bg-gray-950/95 border-gray-800' : 'bg-white/95 border-gray-200'} backdrop-blur-sm`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBackToLanding} className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
              <ArrowLeft size={18} />
            </button>
            {onHome && (
              <button onClick={onHome} className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
                <Home size={18} />
              </button>
            )}
            <img src={PV_LOGO_URL} alt="PV" className="w-7 h-7 object-contain" />
            <div>
              <h1 className={`text-base font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>{t('Cost Control Center')}</h1>
              <p className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Pallacanestro Varese</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={selectedSeason}
              onChange={(e) => setSelectedSeason(e.target.value)}
              className={`px-3 py-1.5 rounded-lg text-sm border ${isDark ? 'bg-gray-800 border-gray-700 text-gray-200' : 'bg-white border-gray-200 text-gray-700'}`}
            >
              {seasons.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <button onClick={toggleLanguage} className={`px-2 py-1.5 rounded-lg text-xs font-medium border ${isDark ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-white border-gray-200 text-gray-700'}`}>
              {language === 'en' ? 'IT' : 'EN'}
            </button>
            <button onClick={toggleTheme} className={`p-1.5 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-white border-gray-200 text-gray-700'}`}>
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </div>

        <div className={`border-t ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex gap-0 overflow-x-auto">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? `${tab.color} border-current`
                      : `${isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'} border-transparent`
                  }`}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {activeTab === 'energy' && renderSheetTab('energy', energyData, energyConfigured, energySheetId, setEnergySheetId, energySheetName, setEnergySheetName, showEnergyConfig, setShowEnergyConfig, Zap, 'text-yellow-600')}
        {activeTab === 'van' && renderSheetTab('van', vanData, vanConfigured, vanSheetId, setVanSheetId, vanSheetName, setVanSheetName, showVanConfig, setShowVanConfig, Truck, 'text-blue-600')}
        {activeTab === 'transactions' && renderTransactionsTab()}
      </main>
    </div>
  );
};
