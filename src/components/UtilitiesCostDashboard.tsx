import React from 'react';
import { Zap, Euro, TrendingUp, Wrench } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useLanguage } from '../contexts/LanguageContext';

const formatCurrency = (val: number) => `€${val.toLocaleString('it-IT', { maximumFractionDigits: 0 })}`;

const MONTHS = ['July', 'August', 'September', 'October', 'November', 'December'];

interface CostLine {
  name: string;
  values: number[];
  total: number;
  color: string;
}

const COST_LINES: CostLine[] = [
  { name: 'Utilities', values: [4151.01, 6176.04, 3256.54, 4076.17, 7508.68, 8106.73], total: 33275.17, color: '#ef4444' },
  { name: 'Maintenance', values: [6391.46, 4782.19, 5471.79, 5555.96, 5111.10, 5112.82], total: 32349.32, color: '#f97316' },
  { name: 'Cleaning', values: [2190, 2190, 2190, 2190, 2190, 2190], total: 13140, color: '#3b82f6' },
  { name: 'Wi-Fi', values: [1708.85, 1708.85, 1758.35, 1708.85, 1758.35, 1708.85], total: 10352.10, color: '#10b981' },
];

const MONTHLY_TOTALS = MONTHS.map((_, i) => COST_LINES.reduce((sum, line) => sum + line.values[i], 0));
const GRAND_TOTAL = COST_LINES.reduce((sum, line) => sum + line.total, 0);
const SORTED = [...COST_LINES].sort((a, b) => b.total - a.total);

const UTIL_TOTAL = COST_LINES.find(l => l.name === 'Utilities')!.total;
const MAINT_TOTAL = COST_LINES.find(l => l.name === 'Maintenance')!.total;

export const UtilitiesCostDashboard: React.FC = () => {
  const { t } = useLanguage();

  const monthlyData = MONTHS.map((month, i) => ({
    month: t(month).substring(0, 3),
    monthKey: month,
    total: MONTHLY_TOTALS[i],
  }));

  const peakMonth = monthlyData.reduce((a, b) => a.total > b.total ? a : b);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-orange-100 dark:bg-orange-900/20 rounded-xl">
          <Zap className="text-orange-600" size={22} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('Utilities & Maintenance')} — {t('Cost Structure')}</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">{t('Monthly Actuals')} · Jul–Dec 2025 · SG&A</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm p-4">
          <div className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400 mb-1">
            <Euro size={12} />
            <span>{t('Total Cost')}</span>
          </div>
          <div className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(GRAND_TOTAL)}</div>
          <div className="text-[10px] text-gray-400 mt-1">Jul–Dec 2025</div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm p-4">
          <div className="flex items-center gap-1.5 text-[11px] text-orange-500 mb-1">
            <Zap size={12} />
            <span>{t('Utilities')}</span>
          </div>
          <div className="text-xl font-bold text-orange-600">{formatCurrency(UTIL_TOTAL)}</div>
          <div className="text-[10px] text-gray-400 mt-1">{((UTIL_TOTAL / GRAND_TOTAL) * 100).toFixed(1)}% {t('of total')}</div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm p-4">
          <div className="flex items-center gap-1.5 text-[11px] text-orange-500 mb-1">
            <Wrench size={12} />
            <span>{t('Maintenance')}</span>
          </div>
          <div className="text-xl font-bold text-orange-600">{formatCurrency(MAINT_TOTAL)}</div>
          <div className="text-[10px] text-gray-400 mt-1">{((MAINT_TOTAL / GRAND_TOTAL) * 100).toFixed(1)}% {t('of total')}</div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm p-4">
          <div className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400 mb-1">
            <TrendingUp size={12} />
            <span>{t('Avg Monthly')}</span>
          </div>
          <div className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(GRAND_TOTAL / 6)}</div>
          <div className="text-[10px] text-gray-400 mt-1">6 {t('months')}</div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-4">{t('Monthly Cost Trend')}</h3>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData} barSize={48}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `€${(v / 1000).toFixed(0)}K`} width={50} />
              <Tooltip
                cursor={{ fill: 'rgba(0,0,0,0.04)' }}
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null;
                  const d = payload[0].payload;
                  return (
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-xl text-xs min-w-[160px]">
                      <div className="font-semibold text-gray-800 dark:text-white mb-2">{t(d.monthKey)}</div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">{t('Total')}</span>
                        <span className="font-medium text-gray-800 dark:text-white">{formatCurrency(d.total)}</span>
                      </div>
                    </div>
                  );
                }}
              />
              <Bar dataKey="total" radius={[8, 8, 0, 0]}>
                {monthlyData.map((entry, i) => (
                  <Cell key={i} fill={entry.total === peakMonth.total ? '#ea580c' : '#fb923c'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-4">{t('Cost by Category')}</h3>
        <div className="space-y-2.5">
          {SORTED.map(line => {
            const pct = (line.total / GRAND_TOTAL) * 100;
            return (
              <div key={line.name}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: line.color }} />
                    <span className="text-xs text-gray-700 dark:text-gray-200">{t(line.name)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-gray-400 tabular-nums">{pct.toFixed(1)}%</span>
                    <span className="text-xs font-semibold tabular-nums text-gray-900 dark:text-white">{formatCurrency(line.total)}</span>
                  </div>
                </div>
                <div className="ml-4 bg-gray-100 dark:bg-gray-800 rounded-full h-1">
                  <div className="h-1 rounded-full" style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: line.color }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-4">{t('Full Cost Breakdown')}</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-2 pr-4 text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap">{t('Category')}</th>
                {MONTHS.map(m => (
                  <th key={m} className="text-right py-2 px-2 text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap">{t(m).substring(0, 3)}</th>
                ))}
                <th className="text-right py-2 pl-3 text-orange-600 font-semibold whitespace-nowrap">{t('Total')}</th>
              </tr>
            </thead>
            <tbody>
              {COST_LINES.map((line) => (
                <tr key={line.name} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="py-2 pr-4 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: line.color }} />
                      {t(line.name)}
                    </div>
                  </td>
                  {line.values.map((val, i) => (
                    <td key={i} className="text-right py-2 px-2 whitespace-nowrap tabular-nums text-gray-700 dark:text-gray-300">
                      {formatCurrency(val)}
                    </td>
                  ))}
                  <td className="text-right py-2 pl-3 font-semibold whitespace-nowrap tabular-nums text-gray-900 dark:text-white">
                    {formatCurrency(line.total)}
                  </td>
                </tr>
              ))}
              <tr className="border-t-2 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/30">
                <td className="py-2.5 pr-4 font-bold text-gray-900 dark:text-white">{t('Total Utilities & Maintenance')}</td>
                {MONTHLY_TOTALS.map((val, i) => (
                  <td key={i} className="text-right py-2.5 px-2 font-bold text-gray-900 dark:text-white whitespace-nowrap tabular-nums">{formatCurrency(val)}</td>
                ))}
                <td className="text-right py-2.5 pl-3 font-bold text-orange-600 whitespace-nowrap tabular-nums">{formatCurrency(GRAND_TOTAL)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
