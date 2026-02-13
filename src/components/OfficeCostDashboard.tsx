import React from 'react';
import { Building, Euro, TrendingUp, Monitor } from 'lucide-react';
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
  { name: 'Software Licenses & Subscriptions', values: [3632.38, 3542.95, 3460.61, 3533.80, 3094.39, 3089.08], total: 20353.21, color: '#ef4444' },
  { name: 'Hardware', values: [551.48, 555.94, 576.42, 773.45, 716.08, 859.55], total: 4032.92, color: '#f97316' },
  { name: 'Staff Appreciation', values: [319.88, 270.80, 502.18, 564.96, 1134.57, 1012.12], total: 3804.51, color: '#8b5cf6' },
  { name: 'Education/Trainings', values: [0, 0, 0, 1071.43, 1071.43, 1071.43], total: 3214.29, color: '#3b82f6' },
  { name: 'Phones', values: [420.70, 420.70, 420.70, 420.70, 430.70, 420.70], total: 2534.20, color: '#10b981' },
  { name: 'Internet', values: [341.76, 341.76, 341.76, 341.76, 341.76, 341.76], total: 2050.56, color: '#06b6d4' },
  { name: 'Office Supplies', values: [0, 0, 156.09, 137.96, 157.42, 205.16], total: 656.63, color: '#f59e0b' },
];

const MONTHLY_TOTALS = MONTHS.map((_, i) => COST_LINES.reduce((sum, line) => sum + line.values[i], 0));
const GRAND_TOTAL = COST_LINES.reduce((sum, line) => sum + line.total, 0);
const SORTED = [...COST_LINES].sort((a, b) => b.total - a.total);

const SW_TOTAL = COST_LINES.find(l => l.name === 'Software Licenses & Subscriptions')!.total;
const SW_PCT = (SW_TOTAL / GRAND_TOTAL) * 100;

export const OfficeCostDashboard: React.FC = () => {
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
          <Building className="text-orange-600" size={22} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('Office')} — {t('Cost Structure')}</h2>
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
            <Monitor size={12} />
            <span>{t('Software & Subs')}</span>
          </div>
          <div className="text-xl font-bold text-orange-600">{formatCurrency(SW_TOTAL)}</div>
          <div className="text-[10px] text-gray-400 mt-1">{SW_PCT.toFixed(1)}% {t('of total')}</div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm p-4">
          <div className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400 mb-1">
            <TrendingUp size={12} />
            <span>{t('Peak Month')}</span>
          </div>
          <div className="text-xl font-bold text-gray-900 dark:text-white">{peakMonth.month}</div>
          <div className="text-[10px] text-gray-400 mt-1">{formatCurrency(peakMonth.total)}</div>
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
                    <td key={i} className={`text-right py-2 px-2 whitespace-nowrap tabular-nums ${val === 0 ? 'text-gray-300 dark:text-gray-600' : 'text-gray-700 dark:text-gray-300'}`}>
                      {val === 0 ? '—' : formatCurrency(val)}
                    </td>
                  ))}
                  <td className="text-right py-2 pl-3 font-semibold whitespace-nowrap tabular-nums text-gray-900 dark:text-white">
                    {formatCurrency(line.total)}
                  </td>
                </tr>
              ))}
              <tr className="border-t-2 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/30">
                <td className="py-2.5 pr-4 font-bold text-gray-900 dark:text-white">{t('Total Office')}</td>
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
