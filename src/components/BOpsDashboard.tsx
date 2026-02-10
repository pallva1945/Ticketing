import React from 'react';
import { Activity, Euro, Target, AlertTriangle, TrendingUp, Calendar, CheckCircle2 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useLanguage } from '../contexts/LanguageContext';

const formatCurrency = (val: number) => `€${val.toLocaleString('it-IT', { maximumFractionDigits: 0 })}`;

const BOPS_DATA = {
  periodLabel: '4/10 Months',
  h1Budget: 180000,
  seasonBudget: 525000,
  h1Actual: 173508,
};

const REVENUE_BREAKDOWN = [
  { name: 'Buy Out (Elisée Assui)', amount: 80000, color: '#10b981', note: 'Player buyout revenue' },
  { name: 'U23–U26', amount: 18500, color: '#6366f1', note: 'Youth development allocation' },
  { name: 'LBA Shared Revenue', amount: 75008, color: '#f59e0b', note: 'League shared revenue pool' },
];

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

const pctOfBudget = (BOPS_DATA.h1Actual / BOPS_DATA.h1Budget) * 100;
const gap = BOPS_DATA.h1Budget - BOPS_DATA.h1Actual;

export const BOpsDashboard: React.FC = () => {
  const { t } = useLanguage();
  const pieData = REVENUE_BREAKDOWN.map(r => ({ name: r.name, value: r.amount }));
  const pieColors = REVENUE_BREAKDOWN.map(r => r.color);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/20 rounded-xl">
          <Activity className="text-emerald-600" size={22} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('BOps — Serie A')}</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">{t('Basketball Operations')} · {BOPS_DATA.periodLabel} {t('Accounting')}</p>
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
    </div>
  );
};
