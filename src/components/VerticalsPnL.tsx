import React from 'react';
import { BarChart3, TrendingUp, TrendingDown, Sun, Moon, PieChart } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { PV_LOGO_URL } from '../constants';

const formatCurrency = (val: number) => `€${Math.abs(val).toLocaleString('it-IT', { maximumFractionDigits: 0 })}`;
const formatCurrencySign = (val: number) => val < 0 ? `(${formatCurrency(val)})` : formatCurrency(val);

const TOTAL_SGA = 837843;
const VB_SGA = 148459;
const SHARED_SGA = TOTAL_SGA - VB_SGA;

interface Vertical {
  id: string;
  labelKey: string;
  color: string;
  sales: number;
  cos: number;
  sgaPct: number | null;
  sgaFixed: number | null;
}

const VERTICALS: Vertical[] = [
  { id: 'gameday', labelKey: 'GameDay', color: '#ef4444', sales: 1177289 + 173508, cos: 206015 + 1691290, sgaPct: 0.60, sgaFixed: null },
  { id: 'sponsorship', labelKey: 'Sponsorship', color: '#f97316', sales: 1097254, cos: 30854, sgaPct: 0.30, sgaFixed: null },
  { id: 'merchandising', labelKey: 'Merchandising', color: '#3b82f6', sales: 91742, cos: 81849, sgaPct: 0.05, sgaFixed: null },
  { id: 'venue_ops', labelKey: 'Venue Ops', color: '#8b5cf6', sales: 85486, cos: 49877, sgaPct: 0.05, sgaFixed: null },
  { id: 'varese_basketball', labelKey: 'Varese Basketball', color: '#10b981', sales: 386020, cos: 260635, sgaPct: null, sgaFixed: VB_SGA },
];

interface VerticalsPnLProps {
  onBackToLanding: () => void;
}

export const VerticalsPnL: React.FC<VerticalsPnLProps> = ({ onBackToLanding }) => {
  const { theme, toggleTheme } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();
  const isDark = theme === 'dark';

  const computed = (() => {
    const sharedVerticals = VERTICALS.filter(v => v.sgaPct !== null);
    let allocated = 0;
    const sharedAllocations = sharedVerticals.map((v, i) => {
      if (i < sharedVerticals.length - 1) {
        const sga = Math.round(SHARED_SGA * (v.sgaPct || 0));
        allocated += sga;
        return sga;
      }
      return SHARED_SGA - allocated;
    });
    let sharedIdx = 0;
    return VERTICALS.map(v => {
      const sga = v.sgaFixed !== null ? v.sgaFixed : sharedAllocations[sharedIdx++];
      const grossProfit = v.sales - v.cos;
      const netIncome = grossProfit - sga;
      const grossMargin = v.sales > 0 ? (grossProfit / v.sales) * 100 : 0;
      const netMargin = v.sales > 0 ? (netIncome / v.sales) * 100 : 0;
      return { ...v, sga, grossProfit, netIncome, grossMargin, netMargin };
    });
  })();

  const totalSales = computed.reduce((s, v) => s + v.sales, 0);
  const totalCOS = computed.reduce((s, v) => s + v.cos, 0);
  const totalGrossProfit = totalSales - totalCOS;
  const totalSGA = computed.reduce((s, v) => s + v.sga, 0);
  const totalNet = totalGrossProfit - totalSGA;

  const chartData = computed.map(v => ({
    name: v.labelKey === 'Varese Basketball' ? 'VB' : v.labelKey,
    fullName: v.labelKey,
    netIncome: v.netIncome,
    color: v.color,
  }));

  return (
    <div className={`min-h-screen ${isDark ? 'dark bg-gray-950 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="fixed top-0 left-0 w-full bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 h-16 z-50 px-6 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={onBackToLanding} className="w-8 h-8 flex-shrink-0 hover:opacity-70 transition-opacity" title={t('Back to Financial Center')}>
            <img src={PV_LOGO_URL} alt="PV" className="w-full h-full object-contain" />
          </button>
          <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 hidden md:block"></div>
          <div className="hidden md:flex items-center gap-2">
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-slate-900 dark:bg-white text-white dark:text-gray-900 shadow-md">
              <BarChart3 size={16} />
              {t('Verticals P&Ls')}
            </div>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-bold transition-all border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 bg-white dark:bg-gray-900"
          >
            <span className="text-base">{language === 'en' ? '\u{1F1EE}\u{1F1F9}' : '\u{1F1EC}\u{1F1E7}'}</span>
            <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase">{language === 'en' ? 'IT' : 'EN'}</span>
          </button>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg transition-all border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 bg-white dark:bg-gray-900"
          >
            {isDark ? <Sun size={16} className="text-yellow-400" /> : <Moon size={16} className="text-gray-500" />}
          </button>
          <div className="h-6 w-px bg-gray-200 dark:bg-gray-700"></div>
          <div className="text-right">
            <p className="text-xs font-bold text-gray-900 dark:text-white">Pallacanestro Varese</p>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase">{t('Verticals P&Ls')}</p>
          </div>
          <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center border border-gray-200 dark:border-gray-700">
            <span className="text-xs font-bold text-gray-600 dark:text-gray-300">PV</span>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 pt-24 pb-12">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
            <BarChart3 size={28} className="text-blue-600" />
            {t('Verticals P&Ls')}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">H1 2025/26 · Jul–Dec 2025</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm p-4">
            <div className="text-[11px] text-gray-500 dark:text-gray-400 mb-1">{t('Total Sales')}</div>
            <div className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(totalSales)}</div>
            <div className="text-[10px] text-gray-400 mt-1">5 {t('verticals')}</div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm p-4">
            <div className="text-[11px] text-gray-500 dark:text-gray-400 mb-1">{t('Gross Profit')}</div>
            <div className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(totalGrossProfit)}</div>
            <div className="text-[10px] text-gray-400 mt-1">{(totalGrossProfit / totalSales * 100).toFixed(1)}% {t('margin')}</div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm p-4">
            <div className="text-[11px] text-gray-500 dark:text-gray-400 mb-1">{t('Total SG&A')}</div>
            <div className="text-xl font-bold text-orange-600">{formatCurrency(totalSGA)}</div>
            <div className="text-[10px] text-gray-400 mt-1">{(totalSGA / totalSales * 100).toFixed(1)}% {t('of sales')}</div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm p-4">
            <div className="text-[11px] text-gray-500 dark:text-gray-400 mb-1">{t('Net Income')}</div>
            <div className={`text-xl font-bold ${totalNet >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{formatCurrencySign(totalNet)}</div>
            <div className="text-[10px] text-gray-400 mt-1">{(totalNet / totalSales * 100).toFixed(1)}% {t('margin')}</div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm p-5 mb-8">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-4">{t('Net Income by Vertical')}</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barSize={56}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#f3f4f6'} vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: isDark ? '#9ca3af' : '#6b7280' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `€${(v / 1000).toFixed(0)}K`} width={60} />
                <Tooltip
                  cursor={{ fill: 'rgba(0,0,0,0.04)' }}
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-xl text-xs min-w-[160px]">
                        <div className="font-semibold text-gray-800 dark:text-white mb-1">{t(d.fullName)}</div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">{t('Net Income')}</span>
                          <span className={`font-medium ${d.netIncome >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{formatCurrencySign(d.netIncome)}</span>
                        </div>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="netIncome" radius={[8, 8, 0, 0]}>
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={entry.netIncome >= 0 ? entry.color : '#ef4444'} opacity={entry.netIncome >= 0 ? 1 : 0.6} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
          {computed.map(v => {
            const isProfit = v.netIncome >= 0;
            return (
              <div key={v.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
                <div className="h-1" style={{ backgroundColor: v.color }}></div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-gray-800 dark:text-white">{t(v.labelKey)}</h3>
                    {isProfit ? <TrendingUp size={14} className="text-emerald-500" /> : <TrendingDown size={14} className="text-red-500" />}
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-baseline">
                      <span className="text-[11px] text-gray-500 dark:text-gray-400">{t('Sales')}</span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">{formatCurrency(v.sales)}</span>
                    </div>
                    <div className="flex justify-between items-baseline">
                      <span className="text-[11px] text-gray-500 dark:text-gray-400">{t('Cost of Sales')}</span>
                      <span className="text-sm text-red-500">({formatCurrency(v.cos)})</span>
                    </div>
                    <div className={`flex justify-between items-baseline pt-1 border-t ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
                      <span className="text-[11px] font-medium text-gray-600 dark:text-gray-300">{t('Gross Profit')}</span>
                      <span className={`text-sm font-semibold ${v.grossProfit >= 0 ? 'text-gray-900 dark:text-white' : 'text-red-500'}`}>{formatCurrencySign(v.grossProfit)}</span>
                    </div>
                    <div className="flex justify-between items-baseline">
                      <span className="text-[11px] text-gray-500 dark:text-gray-400">
                        SG&A {v.sgaPct !== null ? `(${(v.sgaPct * 100).toFixed(0)}%)` : ''}
                      </span>
                      <span className="text-sm text-red-500">({formatCurrency(v.sga)})</span>
                    </div>
                    <div className={`flex justify-between items-baseline pt-1.5 border-t-2 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                      <span className="text-[11px] font-bold text-gray-800 dark:text-white">{t('Net Income')}</span>
                      <span className={`text-base font-bold ${isProfit ? 'text-emerald-600' : 'text-red-600'}`}>{formatCurrencySign(v.netIncome)}</span>
                    </div>
                    <div className="flex justify-between items-baseline">
                      <span className="text-[10px] text-gray-400">{t('Gross Margin')}</span>
                      <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400">{v.grossMargin.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between items-baseline">
                      <span className="text-[10px] text-gray-400">{t('Net Margin')}</span>
                      <span className={`text-[10px] font-medium ${isProfit ? 'text-emerald-500' : 'text-red-500'}`}>{v.netMargin.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-4">{t('Consolidated P&L')}</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-2.5 pr-4 text-gray-500 dark:text-gray-400 font-medium w-36"></th>
                  {computed.map(v => (
                    <th key={v.id} className="text-right py-2.5 px-3 font-semibold whitespace-nowrap" style={{ color: v.color }}>{t(v.labelKey)}</th>
                  ))}
                  <th className="text-right py-2.5 pl-4 font-bold text-gray-900 dark:text-white border-l-2 border-gray-200 dark:border-gray-700">{t('Total')}</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-2.5 pr-4 font-semibold text-gray-800 dark:text-white">{t('Sales')}</td>
                  {computed.map(v => (
                    <td key={v.id} className="text-right py-2.5 px-3 text-gray-700 dark:text-gray-300 tabular-nums">{formatCurrency(v.sales)}</td>
                  ))}
                  <td className="text-right py-2.5 pl-4 font-bold text-gray-900 dark:text-white tabular-nums border-l-2 border-gray-200 dark:border-gray-700">{formatCurrency(totalSales)}</td>
                </tr>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-2.5 pr-4 text-gray-600 dark:text-gray-400">{t('Cost of Sales')}</td>
                  {computed.map(v => (
                    <td key={v.id} className="text-right py-2.5 px-3 text-red-500 tabular-nums">({formatCurrency(v.cos)})</td>
                  ))}
                  <td className="text-right py-2.5 pl-4 font-bold text-red-600 tabular-nums border-l-2 border-gray-200 dark:border-gray-700">({formatCurrency(totalCOS)})</td>
                </tr>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/30">
                  <td className="py-2.5 pr-4 font-bold text-gray-800 dark:text-white">{t('Gross Profit')}</td>
                  {computed.map(v => (
                    <td key={v.id} className={`text-right py-2.5 px-3 font-semibold tabular-nums ${v.grossProfit >= 0 ? 'text-gray-900 dark:text-white' : 'text-red-600'}`}>
                      {formatCurrencySign(v.grossProfit)}
                    </td>
                  ))}
                  <td className={`text-right py-2.5 pl-4 font-bold tabular-nums border-l-2 border-gray-200 dark:border-gray-700 ${totalGrossProfit >= 0 ? 'text-gray-900 dark:text-white' : 'text-red-600'}`}>
                    {formatCurrencySign(totalGrossProfit)}
                  </td>
                </tr>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-2.5 pr-4 text-gray-600 dark:text-gray-400">SG&A</td>
                  {computed.map(v => (
                    <td key={v.id} className="text-right py-2.5 px-3 text-red-500 tabular-nums">({formatCurrency(v.sga)})</td>
                  ))}
                  <td className="text-right py-2.5 pl-4 font-bold text-red-600 tabular-nums border-l-2 border-gray-200 dark:border-gray-700">({formatCurrency(totalSGA)})</td>
                </tr>
                <tr className="bg-gray-50 dark:bg-gray-800/30 border-t-2 border-gray-300 dark:border-gray-600">
                  <td className="py-3 pr-4 font-bold text-gray-900 dark:text-white">{t('Net Income')}</td>
                  {computed.map(v => (
                    <td key={v.id} className={`text-right py-3 px-3 font-bold tabular-nums ${v.netIncome >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {formatCurrencySign(v.netIncome)}
                    </td>
                  ))}
                  <td className={`text-right py-3 pl-4 font-bold tabular-nums border-l-2 border-gray-200 dark:border-gray-700 ${totalNet >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {formatCurrencySign(totalNet)}
                  </td>
                </tr>
                <tr className="border-t border-gray-100 dark:border-gray-800">
                  <td className="py-2 pr-4 text-[10px] text-gray-400 italic">{t('Gross Margin')}</td>
                  {computed.map(v => (
                    <td key={v.id} className="text-right py-2 px-3 text-[10px] text-gray-400 tabular-nums">{v.grossMargin.toFixed(1)}%</td>
                  ))}
                  <td className="text-right py-2 pl-4 text-[10px] text-gray-500 font-medium tabular-nums border-l-2 border-gray-200 dark:border-gray-700">{(totalGrossProfit / totalSales * 100).toFixed(1)}%</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 text-[10px] text-gray-400 italic">{t('Net Margin')}</td>
                  {computed.map(v => (
                    <td key={v.id} className={`text-right py-2 px-3 text-[10px] tabular-nums ${v.netMargin >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>{v.netMargin.toFixed(1)}%</td>
                  ))}
                  <td className={`text-right py-2 pl-4 text-[10px] font-medium tabular-nums border-l-2 border-gray-200 dark:border-gray-700 ${totalNet >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>{(totalNet / totalSales * 100).toFixed(1)}%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};
