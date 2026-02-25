import React, { useState } from 'react';
import { Calendar, Euro, Target, TrendingDown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useLanguage } from '../contexts/LanguageContext';

const formatCurrency = (val: number) => `€${val.toLocaleString('it-IT', { maximumFractionDigits: 0 })}`;
const formatCurrencyShort = (val: number) => `€${val.toLocaleString('it-IT', { maximumFractionDigits: 0 })}`;

const MONTHS = ['July', 'August', 'September', 'October', 'November', 'December'];
const GAMES_PER_MONTH = [0, 0, 2, 2, 3, 1];
const TOTAL_GAMES = GAMES_PER_MONTH.reduce((s, g) => s + g, 0);

const GAME_DATES: Record<string, string[]> = {
  September: ['3 Sep', '28 Sep'],
  October: ['11 Oct', '25 Oct'],
  November: ['4 Nov', '16 Nov', '23 Nov'],
  December: ['21 Dec'],
};

interface CostLine {
  name: string;
  values: number[];
  total: number;
  color: string;
}

const DEFAULT_COST_LINES: CostLine[] = [
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

interface GameDayCostDashboardProps {
  costLines?: CostLine[];
}

export const GameDayCostDashboard: React.FC<GameDayCostDashboardProps> = ({ costLines }) => {
  const { t } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const COST_LINES = costLines || DEFAULT_COST_LINES;
  const MONTHLY_TOTALS = MONTHS.map((_, i) => COST_LINES.reduce((sum, line) => sum + line.values[i], 0));
  const GRAND_TOTAL = COST_LINES.reduce((sum, line) => sum + line.total, 0);
  const COST_PER_GAME = GRAND_TOTAL / TOTAL_GAMES;

  const perGameByCategoryData = COST_LINES.map(line => ({
    name: line.name,
    totalPerGame: line.total / TOTAL_GAMES,
    total: line.total,
    color: line.color,
  })).sort((a, b) => b.totalPerGame - a.totalPerGame);

  const gameMonthsData = MONTHS
    .map((month, i) => {
      const games = GAMES_PER_MONTH[i];
      if (games === 0) return null;
      const total = MONTHLY_TOTALS[i];
      const costPerGame = total / games;
      return {
        month: t(month).substring(0, 3),
        monthKey: month,
        total,
        games,
        costPerGame,
      };
    })
    .filter(Boolean) as { month: string; monthKey: string; total: number; games: number; costPerGame: number }[];

  const cpgValues = gameMonthsData.map(d => d.costPerGame);
  const lowestCPG = Math.min(...cpgValues);
  const highestCPG = Math.max(...cpgValues);
  const lowestMonth = gameMonthsData.find(d => d.costPerGame === lowestCPG)!;
  const highestMonth = gameMonthsData.find(d => d.costPerGame === highestCPG)!;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-red-100 dark:bg-red-900/20 rounded-xl">
          <Calendar className="text-red-600" size={22} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('GameDay')} — {t('Cost Structure')}</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">{t('Monthly Actuals')} · Jul–Dec 2025 · {TOTAL_GAMES} {t('home games')}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm p-4">
          <div className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400 mb-1">
            <Euro size={12} />
            <span>{t('Total Cost')}</span>
          </div>
          <div className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrencyShort(GRAND_TOTAL)}</div>
          <div className="text-[10px] text-gray-400 mt-1">{TOTAL_GAMES} {t('home games')}</div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm p-4">
          <div className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400 mb-1">
            <Target size={12} />
            <span>{t('Avg Cost / Game')}</span>
          </div>
          <div className="text-xl font-bold text-red-600">{formatCurrencyShort(COST_PER_GAME)}</div>
          <div className="text-[10px] text-gray-400 mt-1">{COST_LINES.length} {t('categories')}</div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm p-4">
          <div className="flex items-center gap-1.5 text-[11px] text-green-600 mb-1">
            <TrendingDown size={12} />
            <span>{t('Most Efficient')}</span>
          </div>
          <div className="text-xl font-bold text-green-600">{lowestMonth.month}</div>
          <div className="text-[10px] text-gray-400 mt-1">{formatCurrencyShort(lowestCPG)}/{t('game')} · {lowestMonth.games}g</div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm p-4">
          <div className="flex items-center gap-1.5 text-[11px] text-red-500 mb-1">
            <Target size={12} />
            <span>{t('Highest Cost')}</span>
          </div>
          <div className="text-xl font-bold text-red-600">{highestMonth.month}</div>
          <div className="text-[10px] text-gray-400 mt-1">{formatCurrencyShort(highestCPG)}/{t('game')} · {highestMonth.games}g</div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-4">{t('Cost per Game by Month')}</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={gameMonthsData} barSize={48}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12, fill: '#6b7280' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => `€${(v / 1000).toFixed(0)}K`}
                width={55}
              />
              <Tooltip
                cursor={{ fill: 'rgba(0,0,0,0.04)' }}
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null;
                  const d = payload[0].payload;
                  const dates = GAME_DATES[d.monthKey] || [];
                  return (
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-xl text-xs min-w-[160px]">
                      <div className="font-semibold text-gray-800 dark:text-white mb-2">{t(d.monthKey)}</div>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-gray-500">{t('Games')}</span>
                          <span className="font-medium text-gray-800 dark:text-white">{d.games}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">{t('Total Cost')}</span>
                          <span className="font-medium text-gray-800 dark:text-white">{formatCurrencyShort(d.total)}</span>
                        </div>
                        <div className="border-t border-gray-100 dark:border-gray-700 pt-1 mt-1">
                          <div className="flex justify-between">
                            <span className="text-red-500 font-medium">{t('Cost/Game')}</span>
                            <span className="font-bold text-red-600">{formatCurrencyShort(d.costPerGame)}</span>
                          </div>
                        </div>
                      </div>
                      {dates.length > 0 && (
                        <div className="text-[10px] text-gray-400 mt-2 pt-1 border-t border-gray-100 dark:border-gray-700">{dates.join('  ·  ')}</div>
                      )}
                    </div>
                  );
                }}
              />
              <Bar dataKey="costPerGame" radius={[8, 8, 0, 0]}>
                {gameMonthsData.map((entry, i) => {
                  let fill = '#f87171';
                  if (entry.costPerGame === lowestCPG) fill = '#22c55e';
                  else if (entry.costPerGame === highestCPG) fill = '#ef4444';
                  return <Cell key={i} fill={fill} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center justify-center gap-6 mt-3 text-[10px] text-gray-400">
          {gameMonthsData.map(d => (
            <div key={d.month} className="text-center">
              <span className="font-medium text-gray-600 dark:text-gray-300">{d.month}</span>
              <span className="ml-1">{d.games} {d.games === 1 ? t('game') : t('games')}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-1">{t('Cost per Game by Category')}</h3>
        <p className="text-[10px] text-gray-400 dark:text-gray-500 mb-4">{t('Average cost per game across')} {TOTAL_GAMES} {t('home games')}</p>
        <div className="space-y-2">
          {perGameByCategoryData.map((item) => {
            const isSelected = selectedCategory === item.name;
            const pct = (item.totalPerGame / perGameByCategoryData[0].totalPerGame) * 100;
            return (
              <button
                key={item.name}
                onClick={() => setSelectedCategory(isSelected ? null : item.name)}
                className={`w-full text-left transition-all rounded-lg px-2 py-1.5 ${isSelected ? 'bg-red-50 dark:bg-red-900/10 ring-1 ring-red-200 dark:ring-red-800' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-xs text-gray-700 dark:text-gray-200">{t(item.name)}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] text-gray-400 tabular-nums">{formatCurrencyShort(item.total)} tot</span>
                    <span className="text-xs font-semibold text-gray-900 dark:text-white tabular-nums w-20 text-right">{formatCurrencyShort(item.totalPerGame)}/{t('game')}</span>
                  </div>
                </div>
                <div className="ml-4 bg-gray-100 dark:bg-gray-800 rounded-full h-1">
                  <div className="h-1 rounded-full" style={{ width: `${pct}%`, backgroundColor: item.color }} />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
            {t('Full Cost Breakdown')}
            {selectedCategory && <span className="ml-2 text-xs font-normal text-red-500">— {t(selectedCategory)}</span>}
          </h3>
          {selectedCategory && (
            <button onClick={() => setSelectedCategory(null)} className="text-[10px] px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
              {t('Show All')}
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-2 pr-4 text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap">{t('Category')}</th>
                {MONTHS.map((m, i) => (
                  <th key={m} className="text-right py-2 px-2 text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap">
                    <div>{t(m).substring(0, 3)}</div>
                    {GAMES_PER_MONTH[i] > 0 && (
                      <div className="text-[9px] font-normal text-amber-500 mt-0.5">{GAMES_PER_MONTH[i]} {GAMES_PER_MONTH[i] === 1 ? t('game') : t('games')}</div>
                    )}
                  </th>
                ))}
                <th className="text-right py-2 pl-3 text-red-600 font-semibold whitespace-nowrap">{t('Total')}</th>
                <th className="text-right py-2 pl-3 text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap">/{t('Game')}</th>
              </tr>
            </thead>
            <tbody>
              {COST_LINES
                .filter(line => !selectedCategory || line.name === selectedCategory)
                .map((line) => (
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
                  <td className="text-right py-2 pl-3 text-red-500 font-medium whitespace-nowrap tabular-nums">{formatCurrency(line.total / TOTAL_GAMES)}</td>
                </tr>
              ))}
              {!selectedCategory && (
                <tr className="border-t-2 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/30">
                  <td className="py-2.5 pr-4 font-bold text-gray-900 dark:text-white">{t('Total GameDay')}</td>
                  {MONTHLY_TOTALS.map((val, i) => (
                    <td key={i} className="text-right py-2.5 px-2 font-bold text-gray-900 dark:text-white whitespace-nowrap tabular-nums">{formatCurrency(val)}</td>
                  ))}
                  <td className="text-right py-2.5 pl-3 font-bold text-red-600 whitespace-nowrap tabular-nums">{formatCurrency(GRAND_TOTAL)}</td>
                  <td className="text-right py-2.5 pl-3 font-bold text-red-600 whitespace-nowrap tabular-nums">{formatCurrency(COST_PER_GAME)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
