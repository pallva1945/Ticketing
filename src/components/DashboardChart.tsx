import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Line, ComposedChart, ScatterChart, Scatter, ReferenceLine, ZAxis, Label, ReferenceArea
} from 'recharts';
import { GameData, SalesChannel } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface DashboardChartProps {
  data: GameData[];
  efficiencyData?: GameData[]; // Added optional prop for specific Efficiency chart data
  onFilterChange: (type: 'opponent' | 'tier' | 'day', value: string) => void;
  viewMode: 'total' | 'gameday';  // Global view mode from App
}

const SEASON_COLORS: Record<string, string> = {
  '23-24': '#94a3b8', // Slate (Historical)
  '24-25': '#3b82f6', // Blue (Previous)
  '25-26': '#dc2626', // Red (Current)
  'Unknown': '#cbd5e1'
};

// Helper for consistent currency formatting
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

// Helper for compact axis formatting (e.g. 10k)
const formatAxisCurrency = (value: number) => {
  if (value >= 1000) return `€${(value / 1000).toFixed(0)}k`;
  return `€${value}`;
};

// Helper for Day of Week
const getDayOfWeek = (dateStr: string) => {
    if (!dateStr) return '';
    try {
        const [day, month, year] = dateStr.split('/').map(Number);
        const date = new Date(year, month - 1, day);
        return date.toLocaleDateString('en-US', { weekday: 'short' });
    } catch (e) {
        return '';
    }
};

// Simple Linear Regression for Forecasting
const calculateTrendLine = (dataPoints: any[]) => {
    // FIX: If not enough points to calculate a trend (slope), return data as-is 
    // so the bars still appear. Previously returned [] causing chart to vanish.
    if (dataPoints.length < 2) return dataPoints;

    const n = dataPoints.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;

    dataPoints.forEach((point, index) => {
        sumX += index;
        sumY += point.revenue;
        sumXY += index * point.revenue;
        sumXX += index * index;
    });

    const denominator = (n * sumXX - sumX * sumX);
    if (denominator === 0) return dataPoints;

    const slope = (n * sumXY - sumX * sumY) / denominator;
    const intercept = (sumY - slope * sumX) / n;

    // Generate trend points
    return dataPoints.map((point, index) => ({
        ...point,
        trend: slope * index + intercept
    }));
};

export const DashboardChart: React.FC<DashboardChartProps> = ({ data, efficiencyData, onFilterChange, viewMode }) => {
  const { t } = useLanguage();
  
  // 1. Revenue & Attendance Trend (Composed)
  const uniqueOpponents = new Set(data.map(d => d.opponent));
  
  // If we are looking at a single opponent across multiple seasons, concise labeling is better.
  const isSingleOpponentView = uniqueOpponents.size === 1; 
  
  // If we have very few games, we show full details. If many, we abbreviate.
  const isComparisonMode = uniqueOpponents.size < data.length * 0.5; 

  const sortedData = [...data].sort((a, b) => {
    const [da, ma, ya] = a.date.split('/').map(Number);
    const [db, mb, yb] = b.date.split('/').map(Number);
    const dateA = new Date(ya < 100 ? 2000 + ya : ya, ma - 1, da);
    const dateB = new Date(yb < 100 ? 2000 + yb : yb, mb - 1, db);
    return dateA.getTime() - dateB.getTime();
  });

  const rawTrendData = sortedData.map(game => ({
        name: isSingleOpponentView
            ? `${game.season}` // Just season if looking at one team history
            : (uniqueOpponents.size <= 3 ? `${game.season} ${game.opponent}` : game.opponent.substring(0, 8)),
        fullLabel: `${game.opponent} (${game.season})`,
        date: game.date,
        revenue: game.totalRevenue,
        attendance: game.attendance,
        opponent: game.opponent,
        season: game.season,
        tier: game.tier,
    }));

  // Calculate Forecast
  const trendData = calculateTrendLine(rawTrendData);

  // 2. Yield vs Occupancy (Scatter Quadrant)
  // Use viewMode to determine which attendance/revenue to use
  const sourceDataForScatter = efficiencyData || data;
  
  // Calculate averages for quadrants - use view-specific metrics
  const rawScatterData = sourceDataForScatter.map(game => {
      const attendance = viewMode === 'total' 
          ? game.attendance 
          : (game.attendanceGameDay ?? game.attendance);
      const revenue = viewMode === 'total'
          ? game.totalRevenue
          : (game.revenueGameDay ?? game.totalRevenue);
      // Use capacityGameDay for GameDay view (excludes protocol seats)
      const capacity = viewMode === 'total'
          ? game.capacity
          : ((game as any).capacityGameDay ?? game.capacity);
      return {
          x: capacity > 0 ? (attendance / capacity) * 100 : 0,
          y: attendance > 0 ? revenue / attendance : 0
      };
  });
  const avgOccupancy = rawScatterData.reduce((acc, d) => acc + d.x, 0) / (rawScatterData.length || 1);
  const avgYield = rawScatterData.reduce((acc, d) => acc + d.y, 0) / (rawScatterData.length || 1);

  // Process data for chart - use view-specific metrics
  const scatterData = sourceDataForScatter.map(game => {
      const attendance = viewMode === 'total' 
          ? game.attendance 
          : (game.attendanceGameDay ?? game.attendance);
      const revenue = viewMode === 'total'
          ? game.totalRevenue
          : (game.revenueGameDay ?? game.totalRevenue);
      // Use capacityGameDay for GameDay view (excludes protocol seats)
      const capacity = viewMode === 'total'
          ? game.capacity
          : ((game as any).capacityGameDay ?? game.capacity);
      
      const occupancy = capacity > 0 ? (attendance / capacity) * 100 : 0;
      const yieldVal = attendance > 0 ? revenue / attendance : 0;
      
      // Calculate Z (Size) based on Tier. 
      // Tier 1 (High) -> Big Bubble. Tier 4 (Low) -> Small Bubble.
      // Inverting logic: 5 - Tier.
      const tierVal = Math.max(1, Math.min(game.tier || 4, 4));
      const zScore = (5 - tierVal) * 100; // 1->400, 4->100

      return {
          name: game.opponent,
          x: occupancy,
          y: yieldVal,
          z: zScore, 
          tier: game.tier,
          season: game.season,
          date: game.date,
          attendance,
          capacity,
          revenue
      };
  });
  
  // Group by Season for Coloring
  const seasonsInView = Array.from(new Set(scatterData.map(d => d.season))).sort().reverse() as string[];

  // Calculate Symmetrical Domains to Center the Averages
  const xValues = scatterData.map(d => d.x);
  const yValues = scatterData.map(d => d.y);
  
  const minX = Math.min(...xValues, avgOccupancy);
  const maxX = Math.max(...xValues, avgOccupancy);
  const minY = Math.min(...yValues, avgYield);
  const maxY = Math.max(...yValues, avgYield);

  // Dynamic tight-fit domains that zoom to actual data
  const xRange = maxX - minX;
  const xPad = Math.max(xRange * 0.08, 2);
  const xDomainMin = Math.max(0, minX - xPad); 
  const xDomainMax = Math.min(100, maxX + xPad); 
  
  const yRange = maxY - minY;
  const yPad = Math.max(yRange * 0.12, 0.5);
  let yDomainMin = minY - yPad;
  let yDomainMax = maxY + yPad;
  
  if (yDomainMin < 0) yDomainMin = 0;



  // 4. Tier Analysis Data
  const tierStats: Record<string, { revenue: number, count: number, rankSum: number, attendSum: number }> = {};
  data.forEach(g => {
      const t = String(g.tier || 'Unknown');
      if (!tierStats[t]) tierStats[t] = { revenue: 0, count: 0, rankSum: 0, attendSum: 0 };
      tierStats[t].revenue += g.totalRevenue;
      tierStats[t].rankSum += (g.pvRank || 0); // Sum ranks
      tierStats[t].attendSum += g.attendance;
      tierStats[t].count += 1;
  });

  const tierData = Object.entries(tierStats)
      .filter(([t]) => t !== 'Unknown' && t !== '0')
      .map(([tier, stats]) => ({
          tier: `Tier ${tier}`,
          avgRevenue: stats.revenue / stats.count,
          avgRank: stats.rankSum / stats.count,
          avgAttend: stats.attendSum / stats.count,
          rawTier: tier
      }))
      .sort((a, b) => Number(a.rawTier) - Number(b.rawTier));

  // 5. Day of Week Data
  const dayStats: Record<string, { revenue: number, count: number, attendance: number }> = {};
  data.forEach(g => {
      const [day, month, year] = g.date.split('/');
      const dateObj = new Date(Number(year), Number(month) - 1, Number(day));
      const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
      
      if (!dayStats[dayName]) dayStats[dayName] = { revenue: 0, count: 0, attendance: 0 };
      dayStats[dayName].revenue += g.totalRevenue;
      dayStats[dayName].attendance += g.attendance;
      dayStats[dayName].count += 1;
  });

  const dayOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const dayData = Object.entries(dayStats).map(([day, stats]) => ({
      day,
      avgRevenue: stats.revenue / stats.count,
      avgAttend: stats.attendance / stats.count,
      totalRevenue: stats.revenue
  })).sort((a, b) => dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day));


  return (
    <div className="space-y-6">
      
      {/* ROW 1: Yield Matrix */}
          {/* Yield vs Occupancy Quadrant */}
          <div className="bg-white dark:bg-gray-900 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col h-[520px]">
              <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                      {viewMode === 'total' ? t('Total Efficiency Matrix') : t('GameDay Efficiency Matrix')}
                  </h3>
              </div>
              
              <div className="flex-1 min-h-0 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                      <ScatterChart margin={{ top: 10, right: 10, bottom: 20, left: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            type="number" 
                            dataKey="x" 
                            name="Occupancy" 
                            domain={[xDomainMin, xDomainMax]} 
                            tick={{fontSize: 10}}
                            tickFormatter={(val) => `${val.toFixed(0)}%`}
                          >
                             <Label value={t("Occupancy %")} offset={-10} position="insideBottom" style={{ fontSize: '10px', fill: '#64748b' }} />
                          </XAxis>
                          <YAxis 
                            type="number" 
                            dataKey="y" 
                            name="Yield" 
                            unit="€" 
                            tick={{fontSize: 10}} 
                            domain={[yDomainMin, yDomainMax]}
                            tickFormatter={(val) => `€${val.toFixed(2)}`}
                          >
                             <Label value={t("Yield (€)")} angle={-90} position="insideLeft" style={{ fontSize: '10px', fill: '#64748b' }} />
                          </YAxis>
                          <ZAxis type="number" dataKey="z" range={[60, 450]} name="Tier Weight" />
                          
                          <Tooltip cursor={{ strokeDasharray: '3 3' }} content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                  const d = payload[0].payload;
                                  return (
                                      <div className="bg-white dark:bg-gray-900 p-3 border border-gray-200 dark:border-gray-700 shadow-xl rounded-lg text-xs z-50 min-w-[150px]">
                                          <div className="mb-2 border-b border-gray-100 dark:border-gray-800 pb-1">
                                              <p className="font-bold text-gray-900 dark:text-white text-sm">{d.name}</p>
                                              <p className="text-[10px] text-gray-500 dark:text-gray-400">
                                                  {d.date} <span className="font-bold text-gray-400">({getDayOfWeek(d.date)})</span> • {d.season}
                                              </p>
                                          </div>
                                          <div className="space-y-1">
                                              <div className="flex justify-between">
                                                  <span className="text-gray-500 dark:text-gray-400">{t('Tier:')}</span>
                                                  <span className="font-bold text-gray-800 dark:text-gray-200">{d.tier}</span>
                                              </div>
                                              <div className="flex justify-between">
                                                  <span className="text-gray-500 dark:text-gray-400">{t('Occupancy:')}</span>
                                                  <span className="font-bold text-gray-800 dark:text-gray-200">{d.x.toFixed(1)}%</span>
                                              </div>
                                              <div className="flex justify-between">
                                                  <span className="text-gray-500 dark:text-gray-400">{t('Yield (ATP):')}</span>
                                                  <span className="font-bold text-blue-600">€{d.y.toFixed(2)}</span>
                                              </div>
                                              <div className="flex justify-between border-t border-gray-50 dark:border-gray-800 pt-1 mt-1">
                                                  <span className="text-gray-500 dark:text-gray-400">{t('Revenue:')}</span>
                                                  <span className="font-bold text-green-600">€{(d.revenue / 1000).toFixed(1)}k</span>
                                              </div>
                                          </div>
                                      </div>
                                  );
                              }
                              return null;
                          }} />
                          
                          <ReferenceArea x1={xDomainMin} x2={avgOccupancy} y1={avgYield} y2={yDomainMax} fill="transparent" label={{ value: t('Premium'), position: 'center', fill: '#94a3b8', fontSize: 10, fontWeight: 'bold', opacity: 0.3 }} />
                          <ReferenceArea x1={avgOccupancy} x2={xDomainMax} y1={avgYield} y2={yDomainMax} fill="transparent" label={{ value: t('Cash Cows'), position: 'center', fill: '#16a34a', fontSize: 10, fontWeight: 'bold', opacity: 0.3 }} />
                          <ReferenceArea x1={xDomainMin} x2={avgOccupancy} y1={yDomainMin} y2={avgYield} fill="transparent" label={{ value: t('Kill Zone'), position: 'center', fill: '#DC2626', fontSize: 10, fontWeight: 'bold', opacity: 0.3 }} />
                          <ReferenceArea x1={avgOccupancy} x2={xDomainMax} y1={yDomainMin} y2={avgYield} fill="transparent" label={{ value: t('Discount Trap'), position: 'center', fill: '#ea580c', fontSize: 10, fontWeight: 'bold', opacity: 0.3 }} />

                          <ReferenceLine x={avgOccupancy} stroke="#94a3b8" strokeDasharray="3 3" strokeWidth={1} />
                          <ReferenceLine y={avgYield} stroke="#94a3b8" strokeDasharray="3 3" strokeWidth={1} />

                          {seasonsInView.map(season => (
                              <Scatter 
                                  key={season}
                                  name={season} 
                                  data={scatterData.filter(d => d.season === season)} 
                                  fill={SEASON_COLORS[season] || '#000'} 
                                  stroke="#fff"
                                  strokeWidth={1.5}
                              />
                          ))}
                      </ScatterChart>
                  </ResponsiveContainer>
              </div>

              {/* Bottom Legends Panel */}
              <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex flex-wrap items-center justify-between gap-4">
                  
                  {/* Group 1: View Mode (Read-only indicator from global toggle) */}
                  <div className="flex flex-col gap-1">
                      <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{t('View Mode')}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded border font-semibold w-fit ${
                          viewMode === 'gameday' 
                              ? 'bg-blue-50 text-blue-700 border-blue-200' 
                              : 'bg-green-50 text-green-700 border-green-200'
                      }`}>
                          {viewMode === 'gameday' ? t('GameDay') : t('Total')}
                      </span>
                  </div>

                  {/* Group 2: Season */}
                  <div className="flex flex-col gap-1">
                      <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{t('Season')}</span>
                      <div className="flex items-center gap-3">
                          {seasonsInView.map(s => (
                              <div key={s} className="flex items-center gap-1.5">
                                  <div className="w-2.5 h-2.5 rounded-full shadow-sm flex-shrink-0 border border-white" style={{ backgroundColor: SEASON_COLORS[s] || '#94a3b8' }}></div>
                                  <span className="text-[10px] text-gray-600 dark:text-gray-400 font-medium">{s}</span>
                              </div>
                          ))}
                      </div>
                  </div>

                  {/* Group 3: Tier */}
                  <div className="flex flex-col gap-1">
                      <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{t('Tier Size')}</span>
                      <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5">
                              <div className="w-3.5 h-3.5 rounded-full bg-gray-300 border border-white"></div>
                              <span className="text-[10px] text-gray-600 dark:text-gray-400">T1</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                              <div className="w-2.5 h-2.5 rounded-full bg-gray-300 border border-white"></div>
                              <span className="text-[10px] text-gray-600 dark:text-gray-400">T2</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                              <div className="w-2 h-2 rounded-full bg-gray-300 border border-white"></div>
                              <span className="text-[10px] text-gray-600 dark:text-gray-400">T3</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                              <div className="w-1.5 h-1.5 rounded-full bg-gray-300 border border-white"></div>
                              <span className="text-[10px] text-gray-600 dark:text-gray-400">T4</span>
                          </div>
                      </div>
                  </div>
              </div>
          </div>

      {/* ROW 2: Main Revenue Trend (Kept from before) */}
      <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center justify-between">
             <span>{uniqueOpponents.size === 1 ? `${t('YoY History')}: ${Array.from(uniqueOpponents)[0]}` : t('Revenue vs Attendance Pacing')}</span>
             <span className="text-xs font-normal text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <span className="w-3 h-0.5 bg-yellow-500 dashed"></span> {t('Forecast Line')}
             </span>
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                    dataKey="name" 
                    tick={{fontSize: 10}} 
                    interval={0} 
                    angle={-45} 
                    textAnchor="end" 
                    height={50} 
                />
                <YAxis yAxisId="left" tick={{fontSize: 11}} tickFormatter={formatAxisCurrency} />
                <YAxis yAxisId="right" orientation="right" tick={{fontSize: 11}} domain={[0, 'auto']} />
                <Tooltip 
                  cursor={{ stroke: '#9CA3AF', strokeWidth: 1, strokeDasharray: '3 3' }}
                  content={({ active, payload }: any) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-white dark:bg-gray-900 p-3 border border-gray-200 dark:border-gray-700 shadow-xl rounded-lg text-xs z-50 min-w-[180px]">
                          <div className="mb-2 border-b border-gray-100 dark:border-gray-800 pb-2">
                            <p className="font-bold text-sm text-gray-900 dark:text-white truncate">{d.opponent}</p>
                            <p className="text-gray-500 dark:text-gray-400">{d.date}</p>
                          </div>
                          <div className="space-y-1.5">
                             <div className="flex justify-between items-center gap-4">
                               <span className="text-gray-500 dark:text-gray-400">{t('Season:')}</span>
                               <span className="font-medium text-gray-900 dark:text-white">{d.season}</span>
                             </div>
                             <div className="flex justify-between items-center gap-4 border-t border-gray-50 dark:border-gray-800 pt-1 mt-1">
                               <span className="text-gray-500 dark:text-gray-400">{t('Revenue:')}</span>
                               <span className="font-bold text-red-600">{formatCurrency(d.revenue)}</span>
                             </div>
                             <div className="flex justify-between items-center gap-4">
                               <span className="text-gray-500 dark:text-gray-400">{t('Attendance:')}</span>
                               <span className="font-bold text-gray-900 dark:text-white">{d.attendance}</span>
                             </div>
                             {d.trend !== undefined && (
                                <div className="flex justify-between items-center gap-4 border-t border-gray-50 dark:border-gray-800 pt-1 mt-1">
                                    <span className="text-gray-500 dark:text-gray-400">{t('Forecast:')}</span>
                                    <span className="font-bold text-yellow-600">{formatCurrency(d.trend)}</span>
                                </div>
                             )}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend />
                <Bar 
                  yAxisId="left" 
                  dataKey="revenue" 
                  name={t("Revenue (€)")} 
                  fill="#DC2626" 
                  radius={[4, 4, 0, 0]} 
                  barSize={20} 
                  cursor="pointer"
                  onClick={(data) => {
                    if (data && data.opponent) {
                      onFilterChange('opponent', data.opponent);
                    }
                  }}
                />
                <Line 
                  yAxisId="right" 
                  type="monotone" 
                  dataKey="attendance" 
                  name={t("Attendance")} 
                  stroke="#1F2937" 
                  strokeWidth={2} 
                  dot={{r: 3}} 
                />
                {/* Trend Line (Linear Regression) */}
                <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="trend"
                    name={t("Trend (Forecast)")}
                    stroke="#eab308"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                    activeDot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
      </div>

      {/* ROW 3: Tier Analysis & Day of Week */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tier Analysis with Rank Line */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">{t('Tier Performance Analysis')}</h3>
              <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={tierData} margin={{ top: 20, right: 50, left: 0, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="tier" tick={{fontSize: 11}} />
                          <YAxis yAxisId="left" tickFormatter={formatAxisCurrency} tick={{fontSize: 10}} label={{ value: t('Avg Revenue'), angle: -90, position: 'insideLeft', style:{fontSize:10} }} />
                          <YAxis yAxisId="right" orientation="right" reversed domain={[0, 17]} label={{ value: t('Avg PV Rank'), angle: 90, position: 'right', offset: 10, style:{fontSize:10} }} />
                          <Tooltip 
                            formatter={(value: any, name: string) => {
                                if (name.includes('Rank')) return value.toFixed(1);
                                if (name.includes('Revenue')) return formatCurrency(value);
                                return value;
                            }}
                          />
                          <Legend wrapperStyle={{fontSize: '11px'}} />
                          <Bar yAxisId="left" dataKey="avgRevenue" name={t("Avg Revenue")} fill="#475569" barSize={30} radius={[4, 4, 0, 0]} 
                               onClick={(d) => onFilterChange('tier', d.rawTier)} cursor="pointer"
                          />
                          <Line yAxisId="right" type="monotone" dataKey="avgRank" name={t("Avg PV Rank")} stroke="#DC2626" strokeWidth={2} dot={{r: 4}} />
                      </ComposedChart>
                  </ResponsiveContainer>
              </div>
          </div>

          {/* Day of Week Analysis */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">{t('Day of Week Performance')}</h3>
              <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dayData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="day" tick={{fontSize: 11}} />
                          <YAxis yAxisId="left" tickFormatter={formatAxisCurrency} tick={{fontSize: 10}} />
                          <YAxis yAxisId="right" orientation="right" tick={{fontSize: 10}} />
                          <Tooltip 
                             cursor={{fill: '#f3f4f6'}}
                             content={({ active, payload }: any) => {
                                if (active && payload && payload.length) {
                                    const d = payload[0].payload;
                                    return (
                                        <div className="bg-white p-2 border border-gray-200 shadow-xl rounded text-xs z-50 relative" style={{zIndex: 100}}>
                                            <p className="font-bold mb-1 text-gray-900">{d.day}</p>
                                            <p className="text-gray-600">{t('Avg Rev')}: <strong className="text-green-600">{formatCurrency(d.avgRevenue)}</strong></p>
                                            <p className="text-gray-600">{t('Avg Att')}: <strong className="text-blue-600">{Math.round(d.avgAttend)}</strong></p>
                                        </div>
                                    )
                                }
                                return null;
                             }}
                          />
                          <Legend wrapperStyle={{fontSize: '11px'}} />
                          <Bar yAxisId="left" dataKey="avgRevenue" name={t("Avg Revenue")} fill="#16a34a" barSize={20} radius={[4, 4, 0, 0]} 
                               onClick={(d) => onFilterChange('day', d.day)} cursor="pointer"
                          />
                          <Bar yAxisId="right" dataKey="avgAttend" name={t("Avg Attendance")} fill="#93c5fd" barSize={20} radius={[4, 4, 0, 0]} cursor="pointer" />
                      </BarChart>
                  </ResponsiveContainer>
              </div>
          </div>
      </div>
    </div>
  );
};