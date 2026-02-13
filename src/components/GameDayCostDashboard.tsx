import React, { useState } from 'react';
import { Calendar, Euro, TrendingUp, Target } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Line, ComposedChart, Legend } from 'recharts';
import { useLanguage } from '../contexts/LanguageContext';

const formatCurrency = (val: number) => `€${val.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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
const COST_PER_GAME = GRAND_TOTAL / TOTAL_GAMES;

const TOP_COSTS = [...COST_LINES].sort((a, b) => b.total - a.total);

const CustomBarLabel = ({ x, y, width, value }: any) => {
  if (!value) return null;
  return (
    <text x={x + width / 2} y={y - 6} textAnchor="middle" fontSize={9} fill="#6b7280">
      {value}g
    </text>
  );
};

export const GameDayCostDashboard: React.FC = () => {
  const { t } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const monthlyBarData = MONTHS.map((month, i) => {
    const games = GAMES_PER_MONTH[i];
    const total = MONTHLY_TOTALS[i];
    const costPerGame = games > 0 ? total / games : 0;
    return {
      month: t(month).substring(0, 3),
      fullMonth: t(month),
      total,
      games,
      costPerGame,
    };
  });

  const costPerGameData = MONTHS
    .map((month, i) => {
      const games = GAMES_PER_MONTH[i];
      if (games === 0) return null;
      const total = MONTHLY_TOTALS[i];
      return {
        month: t(month).substring(0, 3),
        costPerGame: total / games,
        games,
      };
    })
    .filter(Boolean);

  const perGameByCategoryData = COST_LINES.map(line => ({
    name: t(line.name),
    rawName: line.name,
    totalPerGame: line.total / TOTAL_GAMES,
    total: line.total,
    color: line.color,
  })).sort((a, b) => b.totalPerGame - a.totalPerGame);

  const lowestCPG = Math.min(...costPerGameData.map((d: any) => d.costPerGame));
  const highestCPG = Math.max(...costPerGameData.map((d: any) => d.costPerGame));
  const lowestCPGMonth = costPerGameData.find((d: any) => d.costPerGame === lowestCPG);
  const highestCPGMonth = costPerGameData.find((d: any) => d.costPerGame === highestCPG);

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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-1">
            <Euro size={13} />
            <span>{t('Total GameDay Cost')}</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrencyShort(GRAND_TOTAL)}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">{TOTAL_GAMES} {t('home games')} · Jul–Dec</div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-1">
            <Target size={13} />
            <span>{t('Avg Cost / Game')}</span>
          </div>
          <div className="text-2xl font-bold text-red-600">{formatCurrencyShort(COST_PER_GAME)}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">{t('across')} 12 {t('categories')}</div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-1">
            <TrendingUp size={13} className="text-green-500" />
            <span>{t('Most Efficient Month')}</span>
          </div>
          <div className="text-2xl font-bold text-green-600">{(lowestCPGMonth as any)?.month}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">{formatCurrencyShort(lowestCPG)} / {t('game')}</div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-1">
            <TrendingUp size={13} className="text-red-500 rotate-180" />
            <span>{t('Highest Cost Month')}</span>
          </div>
          <div className="text-2xl font-bold text-red-600">{(highestCPGMonth as any)?.month}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">{formatCurrencyShort(highestCPG)} / {t('game')}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-1">{t('Monthly Cost vs Games')}</h3>
          <p className="text-[10px] text-gray-400 dark:text-gray-500 mb-4">{t('Bars = total cost · Labels = number of games')}</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={monthlyBarData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="cost" tick={{ fontSize: 10 }} tickFormatter={(v: number) => `€${(v / 1000).toFixed(0)}K`} />
                <YAxis yAxisId="games" orientation="right" tick={{ fontSize: 10 }} domain={[0, 6]} tickFormatter={(v: number) => `${v}g`} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    const d = payload[0].payload;
                    const monthKey = MONTHS.find(m => t(m).substring(0, 3) === d.month) || '';
                    const dates = GAME_DATES[monthKey] || [];
                    return (
                      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-lg text-xs">
                        <div className="font-semibold text-gray-800 dark:text-white mb-1">{d.fullMonth}</div>
                        <div className="text-gray-600 dark:text-gray-300">{t('Total')}: {formatCurrency(d.total)}</div>
                        <div className="text-gray-600 dark:text-gray-300">{t('Games')}: {d.games}</div>
                        {d.games > 0 && (
                          <>
                            <div className="text-red-600 font-semibold mt-1">{t('Cost/Game')}: {formatCurrency(d.costPerGame)}</div>
                            {dates.length > 0 && (
                              <div className="text-gray-400 mt-1 text-[10px]">{dates.join(' · ')}</div>
                            )}
                          </>
                        )}
                      </div>
                    );
                  }}
                />
                <Bar yAxisId="cost" dataKey="total" radius={[6, 6, 0, 0]} name={t('Total Cost')} label={<CustomBarLabel />}>
                  {monthlyBarData.map((entry, i) => (
                    <Cell key={i} fill={entry.games > 0 ? '#ef4444' : '#fca5a5'} />
                  ))}
                </Bar>
                <Line yAxisId="games" type="monotone" dataKey="games" stroke="#f59e0b" strokeWidth={2} dot={{ fill: '#f59e0b', r: 4 }} name={t('Games')} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-1">{t('Cost per Game by Month')}</h3>
          <p className="text-[10px] text-gray-400 dark:text-gray-500 mb-4">{t('Normalized view — higher is less efficient')}</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={costPerGameData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v: number) => `€${(v / 1000).toFixed(0)}K`} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-lg text-xs">
                        <div className="font-semibold text-gray-800 dark:text-white mb-1">{d.month} — {d.games} {t('games')}</div>
                        <div className="text-red-600 font-semibold">{t('Cost/Game')}: {formatCurrency(d.costPerGame)}</div>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="costPerGame" radius={[6, 6, 0, 0]} name={t('Cost/Game')}>
                  {(costPerGameData as any[]).map((entry, i) => (
                    <Cell key={i} fill={entry.costPerGame === lowestCPG ? '#22c55e' : entry.costPerGame === highestCPG ? '#ef4444' : '#f97316'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-1">{t('Cost per Game by Category')}</h3>
        <p className="text-[10px] text-gray-400 dark:text-gray-500 mb-4">{t('Average cost per game across')} {TOTAL_GAMES} {t('home games')} · {t('Click to filter table below')}</p>
        <div className="space-y-2.5">
          {perGameByCategoryData.map((item) => {
            const isSelected = selectedCategory === item.rawName;
            return (
              <button
                key={item.rawName}
                onClick={() => setSelectedCategory(isSelected ? null : item.rawName)}
                className={`w-full text-left transition-all rounded-lg p-1 ${isSelected ? 'bg-red-50 dark:bg-red-900/10 ring-1 ring-red-200 dark:ring-red-800' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-xs text-gray-700 dark:text-gray-200">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400">{formatCurrencyShort(item.total)} {t('total')}</span>
                    <span className="text-xs font-bold text-gray-900 dark:text-white">{formatCurrencyShort(item.totalPerGame)} / {t('game')}</span>
                  </div>
                </div>
                <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1 ml-4">
                  <div className="h-1 rounded-full transition-all" style={{ width: `${(item.totalPerGame / perGameByCategoryData[0].totalPerGame) * 100}%`, backgroundColor: item.color }} />
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
            <button onClick={() => setSelectedCategory(null)} className="text-[10px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
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
                      <div className="text-[9px] text-amber-500 font-normal">{GAMES_PER_MONTH[i]}g</div>
                    )}
                  </th>
                ))}
                <th className="text-right py-2 pl-3 text-red-600 font-semibold whitespace-nowrap">{t('Total')}</th>
                <th className="text-right py-2 pl-3 text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap">/ {t('Game')}</th>
              </tr>
            </thead>
            <tbody>
              {COST_LINES
                .filter(line => !selectedCategory || line.name === selectedCategory)
                .map((line) => (
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
                  <td className="text-right py-2 pl-3 text-red-500 font-medium whitespace-nowrap">{formatCurrency(line.total / TOTAL_GAMES)}</td>
                </tr>
              ))}
              {!selectedCategory && (
                <tr className="border-t-2 border-gray-300 dark:border-gray-600">
                  <td className="py-2 pr-4 font-bold text-gray-900 dark:text-white">{t('Total GameDay')}</td>
                  {MONTHLY_TOTALS.map((val, i) => (
                    <td key={i} className="text-right py-2 px-2 font-bold text-gray-900 dark:text-white whitespace-nowrap">{formatCurrency(val)}</td>
                  ))}
                  <td className="text-right py-2 pl-3 font-bold text-red-600 whitespace-nowrap">{formatCurrency(GRAND_TOTAL)}</td>
                  <td className="text-right py-2 pl-3 font-bold text-red-600 whitespace-nowrap">{formatCurrency(COST_PER_GAME)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
