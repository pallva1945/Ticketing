import React from 'react';
import { Calendar, Euro, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useLanguage } from '../contexts/LanguageContext';

const formatCurrency = (val: number) => `€${val.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const formatCurrencyShort = (val: number) => `€${val.toLocaleString('it-IT', { maximumFractionDigits: 0 })}`;

const MONTHS = ['July', 'August', 'September', 'October', 'November', 'December'];

interface CostLine {
  name: string;
  values: number[];
  total: number;
  color: string;
}

const COST_LINES: CostLine[] = [
  { name: 'Tix Cost', values: [514.24, 0, 1229.00, 6504.15, 7606.71, 4821.83], total: 20675.93, color: '#ef4444' },
  { name: 'Tix Sales Ops', values: [0, 0, 968.83, 1080.05, 1082.91, 1064.81], total: 4196.60, color: '#f97316' },
  { name: 'GD Merchandising', values: [0, 0, 0, 5797.35, 8696.02, 2898.67], total: 17392.04, color: '#f59e0b' },
  { name: 'Advertising Taxes', values: [0, 0, 0, 4025.28, 6037.92, 2641.59], total: 12704.79, color: '#84cc16' },
  { name: 'GD Mkt - Materials and Advertising', values: [0, 0, 0, 4125.49, 6188.23, 2062.74], total: 12376.46, color: '#10b981' },
  { name: 'Hospitality', values: [0, 0, 731.15, 14444.63, 25886.97, 8758.07], total: 49820.82, color: '#14b8a6' },
  { name: 'Security and Safety', values: [0, 0, 1775.00, 3704.00, 5556.00, 1852.00], total: 12887.00, color: '#06b6d4' },
  { name: 'GD Staff', values: [0, 0, 593.08, 6932.32, 15966.64, 7234.05], total: 30726.09, color: '#3b82f6' },
  { name: 'Cleaning', values: [0, 0, 725.00, 2220.00, 2880.00, 1230.00], total: 7055.00, color: '#6366f1' },
  { name: 'Entertainment', values: [0, 0, 0, 1696.82, 2473.31, 1125.00], total: 5295.13, color: '#8b5cf6' },
  { name: 'Penalties and Sanctions - Fans', values: [0, 0, 0, 0, 3600.00, 666.00], total: 4266.00, color: '#a855f7' },
  { name: 'GD Utilities', values: [0, 0, 3911.48, 5429.48, 11869.25, 7408.93], total: 28619.14, color: '#d946ef' },
];

const MONTHLY_TOTALS = MONTHS.map((_, i) => COST_LINES.reduce((sum, line) => sum + line.values[i], 0));
const GRAND_TOTAL = COST_LINES.reduce((sum, line) => sum + line.total, 0);

const TOP_COSTS = [...COST_LINES].sort((a, b) => b.total - a.total);

export const GameDayCostDashboard: React.FC = () => {
  const { t } = useLanguage();

  const monthlyBarData = MONTHS.map((month, i) => ({
    month: t(month).substring(0, 3),
    total: MONTHLY_TOTALS[i],
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-red-100 dark:bg-red-900/20 rounded-xl">
          <Calendar className="text-red-600" size={22} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('GameDay')} — {t('Cost Structure')}</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">{t('Monthly Actuals')} · Jul–Dec 2025</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-1">
            <Euro size={13} />
            <span>{t('Total GameDay Cost')}</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrencyShort(GRAND_TOTAL)}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">Jul–Dec 2025 · {t('Monthly Actuals')}</div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-1">
            <TrendingUp size={13} />
            <span>{t('Peak Month')}</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{t('November')}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">{formatCurrencyShort(MONTHLY_TOTALS[4])}</div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-1">
            <Calendar size={13} />
            <span>{t('Top Cost Category')}</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{t(TOP_COSTS[0].name)}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">{formatCurrencyShort(TOP_COSTS[0].total)} ({((TOP_COSTS[0].total / GRAND_TOTAL) * 100).toFixed(1)}%)</div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-4">{t('Monthly Cost Trend')}</h3>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyBarData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => `€${(v / 1000).toFixed(0)}K`} />
              <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ borderRadius: '8px', fontSize: '12px', border: '1px solid #e5e7eb' }} />
              <Bar dataKey="total" radius={[6, 6, 0, 0]} name={t('Total')}>
                {monthlyBarData.map((entry, i) => (
                  <Cell key={i} fill={entry.total === Math.max(...MONTHLY_TOTALS) ? '#ef4444' : '#fca5a5'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
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
                <th className="text-right py-2 pl-3 text-red-600 font-semibold whitespace-nowrap">{t('Total')}</th>
              </tr>
            </thead>
            <tbody>
              {COST_LINES.map((line) => (
                <tr key={line.name} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="py-2 pr-4 text-gray-700 dark:text-gray-300 whitespace-nowrap flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: line.color }} />
                    {t(line.name)}
                  </td>
                  {line.values.map((val, i) => (
                    <td key={i} className={`text-right py-2 px-2 whitespace-nowrap ${val === 0 ? 'text-gray-300 dark:text-gray-600' : 'text-gray-700 dark:text-gray-300'}`}>
                      {val === 0 ? '—' : formatCurrency(val)}
                    </td>
                  ))}
                  <td className="text-right py-2 pl-3 font-semibold text-gray-900 dark:text-white whitespace-nowrap">{formatCurrency(line.total)}</td>
                </tr>
              ))}
              <tr className="border-t-2 border-gray-300 dark:border-gray-600">
                <td className="py-2 pr-4 font-bold text-gray-900 dark:text-white">{t('Total GameDay')}</td>
                {MONTHLY_TOTALS.map((val, i) => (
                  <td key={i} className="text-right py-2 px-2 font-bold text-gray-900 dark:text-white whitespace-nowrap">{formatCurrency(val)}</td>
                ))}
                <td className="text-right py-2 pl-3 font-bold text-red-600 whitespace-nowrap">{formatCurrency(GRAND_TOTAL)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-4">{t('Top Cost Categories')}</h3>
        <div className="space-y-3">
          {TOP_COSTS.slice(0, 5).map((line) => {
            const pct = (line.total / GRAND_TOTAL) * 100;
            return (
              <div key={line.name}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: line.color }} />
                    <span className="text-sm text-gray-700 dark:text-gray-200">{t(line.name)}</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{formatCurrencyShort(line.total)}</span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5 ml-4">
                  <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: line.color }} />
                </div>
                <div className="text-right text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{pct.toFixed(1)}%</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
