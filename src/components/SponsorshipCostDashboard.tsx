import React from 'react';
import { Flag, Euro, TrendingUp, CalendarDays } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useLanguage } from '../contexts/LanguageContext';

const formatCurrency = (val: number) => `€${val.toLocaleString('it-IT', { maximumFractionDigits: 0 })}`;

const MONTHS = ['July', 'August', 'September', 'October', 'November', 'December'];
const GAMES_PER_MONTH = [0, 0, 2, 2, 3, 1];
const TOTAL_GAMES = GAMES_PER_MONTH.reduce((s, g) => s + g, 0);

interface CostLine {
  name: string;
  values: number[];
  total: number;
  color: string;
}

const COST_LINES: CostLine[] = [
  { name: 'Events', values: [0, 0, 8647.43, 0, 0, 11823.32], total: 20470.75, color: '#f97316' },
  { name: 'Materials and Advertising', values: [0, 0, 1111.11, 1828.61, 3354.32, 4089.32], total: 10383.36, color: '#3b82f6' },
];

const MONTHLY_TOTALS = MONTHS.map((_, i) => COST_LINES.reduce((sum, line) => sum + line.values[i], 0));
const GRAND_TOTAL = COST_LINES.reduce((sum, line) => sum + line.total, 0);

export const SponsorshipCostDashboard: React.FC = () => {
  const { t } = useLanguage();

  const monthlyData = MONTHS
    .map((month, i) => ({
      month: t(month).substring(0, 3),
      monthKey: month,
      total: MONTHLY_TOTALS[i],
      games: GAMES_PER_MONTH[i],
    }))
    .filter(d => d.total > 0);

  const peakMonth = monthlyData.reduce((a, b) => a.total > b.total ? a : b);
  const eventsPct = (COST_LINES[0].total / GRAND_TOTAL) * 100;
  const matPct = (COST_LINES[1].total / GRAND_TOTAL) * 100;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-red-100 dark:bg-red-900/20 rounded-xl">
          <Flag className="text-red-600" size={22} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('Sponsorship')} — {t('Cost Structure')}</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">{t('Monthly Actuals')} · Jul–Dec 2025</p>
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
          <div className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400 mb-1">
            <TrendingUp size={12} />
            <span>{t('Peak Month')}</span>
          </div>
          <div className="text-xl font-bold text-gray-900 dark:text-white">{peakMonth.month}</div>
          <div className="text-[10px] text-gray-400 mt-1">{formatCurrency(peakMonth.total)}</div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm p-4">
          <div className="flex items-center gap-1.5 text-[11px] text-orange-500 mb-1">
            <Flag size={12} />
            <span>{t('Events')}</span>
          </div>
          <div className="text-xl font-bold text-orange-600">{formatCurrency(COST_LINES[0].total)}</div>
          <div className="text-[10px] text-gray-400 mt-1">{eventsPct.toFixed(1)}% {t('of total')}</div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm p-4">
          <div className="flex items-center gap-1.5 text-[11px] text-blue-500 mb-1">
            <Flag size={12} />
            <span>{t('Materials & Ads')}</span>
          </div>
          <div className="text-xl font-bold text-blue-600">{formatCurrency(COST_LINES[1].total)}</div>
          <div className="text-[10px] text-gray-400 mt-1">{matPct.toFixed(1)}% {t('of total')}</div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-3">
          <CalendarDays size={14} className="text-orange-500" />
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">{t('Events Calendar')}</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/30">
            <div className="text-center min-w-[40px]">
              <div className="text-[10px] font-medium text-orange-500 uppercase">{t('September').substring(0, 3)}</div>
              <div className="text-lg font-bold text-orange-600">1</div>
            </div>
            <div>
              <div className="text-xs font-semibold text-gray-800 dark:text-gray-200">{t('Team Presentation')}</div>
              <div className="text-[10px] text-gray-400">{t('Season kickoff event')}</div>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30">
            <div className="text-center min-w-[40px]">
              <div className="text-[10px] font-medium text-red-500 uppercase">{t('December').substring(0, 3)}</div>
              <div className="text-lg font-bold text-red-600">3</div>
            </div>
            <div>
              <div className="text-xs font-semibold text-gray-800 dark:text-gray-200">OJM · BSN · {t('Christmas Dinner')}</div>
              <div className="text-[10px] text-gray-400">{t('Municipality exams')}</div>
            </div>
          </div>
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
                      {d.games > 0 && (
                        <div className="flex justify-between mt-1">
                          <span className="text-gray-500">{t('Games')}</span>
                          <span className="font-medium text-gray-800 dark:text-white">{d.games}</span>
                        </div>
                      )}
                    </div>
                  );
                }}
              />
              <Bar dataKey="total" radius={[8, 8, 0, 0]}>
                {monthlyData.map((entry, i) => (
                  <Cell key={i} fill={entry.total === peakMonth.total ? '#ef4444' : '#f87171'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-1">{t('Category Split')}</h3>
        <p className="text-[10px] text-gray-400 dark:text-gray-500 mb-4">{t('Sponsorship cost breakdown by type')}</p>
        <div className="space-y-3">
          {COST_LINES.map(line => {
            const pct = (line.total / GRAND_TOTAL) * 100;
            return (
              <div key={line.name}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: line.color }} />
                    <span className="text-sm text-gray-700 dark:text-gray-200">{t(line.name)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400">{pct.toFixed(1)}%</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{formatCurrency(line.total)}</span>
                  </div>
                </div>
                <div className="ml-4 bg-gray-100 dark:bg-gray-800 rounded-full h-1.5">
                  <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, backgroundColor: line.color }} />
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
                <th className="text-right py-2 pl-3 text-red-600 font-semibold whitespace-nowrap">{t('Total')}</th>
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
                  <td className="text-right py-2 pl-3 font-semibold text-gray-900 dark:text-white whitespace-nowrap tabular-nums">{formatCurrency(line.total)}</td>
                </tr>
              ))}
              <tr className="border-t-2 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/30">
                <td className="py-2.5 pr-4 font-bold text-gray-900 dark:text-white">{t('Total Sponsorship')}</td>
                {MONTHLY_TOTALS.map((val, i) => (
                  <td key={i} className="text-right py-2.5 px-2 font-bold text-gray-900 dark:text-white whitespace-nowrap tabular-nums">{formatCurrency(val)}</td>
                ))}
                <td className="text-right py-2.5 pl-3 font-bold text-red-600 whitespace-nowrap tabular-nums">{formatCurrency(GRAND_TOTAL)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
