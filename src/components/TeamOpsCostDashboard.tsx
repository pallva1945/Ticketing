import React from 'react';
import { Plane, Euro, TrendingUp, MapPin } from 'lucide-react';
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
  { name: 'Travel - Flight', values: [0, 0, 7075.60, 9041.11, 0, 12696.95], total: 28813.66, color: '#ef4444' },
  { name: 'Travel - Buses', values: [0, 0, 918.82, 2690.91, 3800, 4960], total: 12369.73, color: '#f97316' },
  { name: 'Travel - Vans', values: [132.37, 240.11, 9824.20, 137.82, 217.60, 108.30], total: 10660.40, color: '#f59e0b' },
  { name: 'Travel - Accommodation', values: [0, 107, 6869.80, 7272.37, 8293.78, 12902.56], total: 35445.51, color: '#10b981' },
  { name: 'Team Gear', values: [0, 6527.93, 3041.02, 6887.73, 6919.42, 6919.42], total: 30295.52, color: '#3b82f6' },
  { name: 'Medical Expenses', values: [251.22, 6858.55, 172.67, 2263.68, 1698.05, 2029.09], total: 13273.26, color: '#8b5cf6' },
  { name: 'Immigration Processing Costs', values: [48.86, 34.49, 1765.81, 148.79, 228.37, 473.56], total: 2699.88, color: '#06b6d4' },
  { name: 'Logistical', values: [45.09, 313.89, 2562.31, 943.35, 1222.90, 1242.59], total: 6330.13, color: '#14b8a6' },
  { name: 'Payroll Deductions', values: [0, 0, -416.44, -168.56, 42.27, -6.19], total: -548.92, color: '#6b7280' },
  { name: 'Team Registration', values: [0, 0, 122.14, 14890, 18612.50, 14890], total: 48514.64, color: '#e11d48' },
  { name: 'Penalties and Sanctions', values: [195.98, 195.53, 386.66, 711.41, 364.34, -16.51], total: 1837.41, color: '#a855f7' },
];

interface TeamOpsCostDashboardProps {
  costLines?: CostLine[];
}

export const TeamOpsCostDashboard: React.FC<TeamOpsCostDashboardProps> = ({ costLines }) => {
  const { t } = useLanguage();

  const effectiveLines = costLines || COST_LINES;
  const MONTHLY_TOTALS = MONTHS.map((_, i) => effectiveLines.reduce((sum, line) => sum + line.values[i], 0));
  const GRAND_TOTAL = effectiveLines.reduce((sum, line) => sum + line.total, 0);
  const SORTED = [...effectiveLines].sort((a, b) => Math.abs(b.total) - Math.abs(a.total));
  const TRAVEL_TOTAL = effectiveLines.filter(l => l.name.startsWith('Travel')).reduce((s, l) => s + l.total, 0);
  const TRAVEL_PCT = GRAND_TOTAL !== 0 ? (TRAVEL_TOTAL / GRAND_TOTAL) * 100 : 0;

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
          <Plane className="text-orange-600" size={22} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('Team Ops')} — {t('Cost Structure')}</h2>
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
            <MapPin size={12} />
            <span>{t('Travel Total')}</span>
          </div>
          <div className="text-xl font-bold text-orange-600">{formatCurrency(TRAVEL_TOTAL)}</div>
          <div className="text-[10px] text-gray-400 mt-1">{TRAVEL_PCT.toFixed(1)}% {t('of total')}</div>
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
            const pct = GRAND_TOTAL !== 0 ? (Math.abs(line.total) / GRAND_TOTAL) * 100 : 0;
            return (
              <div key={line.name}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: line.color }} />
                    <span className="text-xs text-gray-700 dark:text-gray-200">{t(line.name)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-gray-400 tabular-nums">{pct.toFixed(1)}%</span>
                    <span className={`text-xs font-semibold tabular-nums ${line.total < 0 ? 'text-emerald-600' : 'text-gray-900 dark:text-white'}`}>{line.total < 0 ? '-' : ''}{formatCurrency(Math.abs(line.total))}</span>
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
              {effectiveLines.map((line) => (
                <tr key={line.name} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="py-2 pr-4 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: line.color }} />
                      {t(line.name)}
                    </div>
                  </td>
                  {line.values.map((val, i) => (
                    <td key={i} className={`text-right py-2 px-2 whitespace-nowrap tabular-nums ${val === 0 ? 'text-gray-300 dark:text-gray-600' : val < 0 ? 'text-emerald-600' : 'text-gray-700 dark:text-gray-300'}`}>
                      {val === 0 ? '—' : val < 0 ? `-${formatCurrency(Math.abs(val))}` : formatCurrency(val)}
                    </td>
                  ))}
                  <td className={`text-right py-2 pl-3 font-semibold whitespace-nowrap tabular-nums ${line.total < 0 ? 'text-emerald-600' : 'text-gray-900 dark:text-white'}`}>
                    {line.total < 0 ? `-${formatCurrency(Math.abs(line.total))}` : formatCurrency(line.total)}
                  </td>
                </tr>
              ))}
              <tr className="border-t-2 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/30">
                <td className="py-2.5 pr-4 font-bold text-gray-900 dark:text-white">{t('Total Team Ops')}</td>
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
