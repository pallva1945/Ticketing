import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, ComposedChart, ScatterChart, Scatter, ReferenceLine, ZAxis, Label, ReferenceArea
} from 'recharts';
import { GameData } from '../types';

interface DashboardChartProps {
  data: GameData[];
  efficiencyData?: GameData[]; // Added optional prop for specific Efficiency chart data
  onFilterChange: (type: 'opponent' | 'tier' | 'day', value: string) => void;
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

export const DashboardChart: React.FC<DashboardChartProps> = ({ data, efficiencyData, onFilterChange }) => {
  
  // 1. Revenue & Attendance Trend (Composed)
  const uniqueOpponents = new Set(data.map(d => d.opponent));
  
  // If we are looking at a single opponent across multiple seasons, concise labeling is better.
  const isSingleOpponentView = uniqueOpponents.size === 1; 
  
  // If we have very few games, we show full details. If many, we abbreviate.
  const isComparisonMode = uniqueOpponents.size < data.length * 0.5; 

  const sortedData = [...data].sort((a, b) => {
        const dateA = a.date.split('/').reverse().join('');
        const dateB = b.date.split('/').reverse().join('');
        return dateA.localeCompare(dateB);
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
  const sourceDataForScatter = efficiencyData || data;
  
  // Calculate averages for quadrants
  const rawScatterData = sourceDataForScatter.map(game => ({
      x: game.capacity > 0 ? (game.attendance / game.capacity) * 100 : 0,
      y: game.attendance > 0 ? game.totalRevenue / game.attendance : 0
  }));
  const avgOccupancy = rawScatterData.reduce((acc, d) => acc + d.x, 0) / (rawScatterData.length || 1);
  const avgYield = rawScatterData.reduce((acc, d) => acc + d.y, 0) / (rawScatterData.length || 1);

  // Process data for chart
  const scatterData = sourceDataForScatter.map(game => {
      const occupancy = game.capacity > 0 ? (game.attendance / game.capacity) * 100 : 0;
      const yieldVal = game.attendance > 0 ? game.totalRevenue / game.attendance : 0;
      
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
          attendance: game.attendance,
          capacity: game.capacity,
          revenue: game.totalRevenue
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

  // Determine spread needed to center the average
  const xSpread = Math.max(avgOccupancy - minX, maxX - avgOccupancy, 10) * 1.1; 
  const xDomainMin = Math.max(0, avgOccupancy - xSpread); 
  const xDomainMax = Math.min(100, avgOccupancy + xSpread); 
  
  const ySpread = Math.max(avgYield - minY, maxY - avgYield, 5) * 1.1;
  let yDomainMin = avgYield - ySpread;
  let yDomainMax = avgYield + ySpread;
  
  if (yDomainMin < 10) {
      yDomainMin = 10;
      if (minY < 10) yDomainMin = Math.floor(minY); 
  }
  if (yDomainMax < maxY) yDomainMax = maxY * 1.05;


  // 3. Ticket Type Breakdown (Stacked Bar)
  const ticketTypeData = sortedData.map(game => {
      const breakdown = game.ticketTypeBreakdown || { full: 0, discount: 0, giveaway: 0 };
      return {
          name: isComparisonMode ? `${game.season}` : game.opponent.substring(0, 8),
          fullLabel: game.opponent,
          full: breakdown.full,
          discount: breakdown.discount,
          free: breakdown.giveaway
      };
  });

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
      
      {/* ROW 1: Yield Matrix & Ticket Types */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Yield vs Occupancy Quadrant */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col h-[520px]">
              <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-semibold text-gray-800">GameDay Efficiency Matrix</h3>
              </div>
              
              <div className="flex-1 min-h-0 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                      <ScatterChart margin={{ top: 10, right: 10, bottom: 20, left: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            type="number" 
                            dataKey="x" 
                            name="Occupancy" 
                            unit="%" 
                            domain={[xDomainMin, xDomainMax]} 
                            tick={{fontSize: 10}}
                            tickFormatter={(val) => `${val.toFixed(0)}%`}
                          >
                             <Label value="Occupancy %" offset={-10} position="insideBottom" style={{ fontSize: '10px', fill: '#64748b' }} />
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
                             <Label value="Yield (€)" angle={-90} position="insideLeft" style={{ fontSize: '10px', fill: '#64748b' }} />
                          </YAxis>
                          <ZAxis type="number" dataKey="z" range={[60, 450]} name="Tier Weight" />
                          
                          <Tooltip cursor={{ strokeDasharray: '3 3' }} content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                  const d = payload[0].payload;
                                  return (
                                      <div className="bg-white p-3 border border-gray-200 shadow-xl rounded-lg text-xs z-50 min-w-[150px]">
                                          <div className="mb-2 border-b border-gray-100 pb-1">
                                              <p className="font-bold text-gray-900 text-sm">{d.name}</p>
                                              <p className="text-[10px] text-gray-500">
                                                  {d.date} <span className="font-bold text-gray-400">({getDayOfWeek(d.date)})</span> • {d.season}
                                              </p>
                                          </div>
                                          <div className="space-y-1">
                                              <div className="flex justify-between">
                                                  <span className="text-gray-500">Tier:</span>
                                                  <span className="font-bold text-gray-800">{d.tier}</span>
                                              </div>
                                              <div className="flex justify-between">
                                                  <span className="text-gray-500">Occupancy:</span>
                                                  <span className="font-bold text-gray-800">{d.x.toFixed(1)}%</span>
                                              </div>
                                              <div className="flex justify-between">
                                                  <span className="text-gray-500">Yield (ATP):</span>
                                                  <span className="font-bold text-blue-600">€{d.y.toFixed(2)}</span>
                                              </div>
                                              <div className="flex justify-between border-t border-gray-50 pt-1 mt-1">
                                                  <span className="text-gray-500">Revenue:</span>
                                                  <span className="font-bold text-green-600">€{(d.revenue / 1000).toFixed(1)}k</span>
                                              </div>
                                          </div>
                                      </div>
                                  );
                              }
                              return null;
                          }} />
                          
                          <ReferenceArea x1={xDomainMin} x2={avgOccupancy} y1={avgYield} y2={yDomainMax} fill="transparent" label={{ value: 'Premium', position: 'center', fill: '#94a3b8', fontSize: 10, fontWeight: 'bold', opacity: 0.3 }} />
                          <ReferenceArea x1={avgOccupancy} x2={xDomainMax} y1={avgYield} y2={yDomainMax} fill="transparent" label={{ value: 'Cash Cows', position: 'center', fill: '#16a34a', fontSize: 10, fontWeight: 'bold', opacity: 0.3 }} />
                          <ReferenceArea x1={xDomainMin} x2={avgOccupancy} y1={yDomainMin} y2={avgYield} fill="transparent" label={{ value: 'Kill Zone', position: 'center', fill: '#DC2626', fontSize: 10, fontWeight: 'bold', opacity: 0.3 }} />
                          <ReferenceArea x1={avgOccupancy} x2={xDomainMax} y1={yDomainMin} y2={avgYield} fill="transparent" label={{ value: 'Discount Trap', position: 'center', fill: '#ea580c', fontSize: 10, fontWeight: 'bold', opacity: 0.3 }} />

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
              <div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-4">
                  
                  {/* Group 1: View Mode */}
                  <div className="flex flex-col gap-1">
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">View Mode</span>
                      <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-100 font-semibold w-fit">
                          Game Day
                      </span>
                  </div>

                  {/* Group 2: Season */}
                  <div className="flex flex-col gap-1">
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Season</span>
                      <div className="flex items-center gap-3">
                          {seasonsInView.map(s => (
                              <div key={s} className="flex items-center gap-1.5">
                                  <div className="w-2.5 h-2.5 rounded-full shadow-sm flex-shrink-0 border border-white" style={{ backgroundColor: SEASON_COLORS[s] || '#94a3b8' }}></div>
                                  <span className="text-[10px] text-gray-600 font-medium">{s}</span>
                              </div>
                          ))}
                      </div>
                  </div>

                  {/* Group 3: Tier */}
                  <div className="flex flex-col gap-1">
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Tier Size</span>
                      <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5">
                              <div className="w-3.5 h-3.5 rounded-full bg-gray-300 border border-white"></div>
                              <span className="text-[10px] text-gray-600">T1</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                              <div className="w-2.5 h-2.5 rounded-full bg-gray-300 border border-white"></div>
                              <span className="text-[10px] text-gray-600">T2</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                              <div className="w-2 h-2 rounded-full bg-gray-300 border border-white"></div>
                              <span className="text-[10px] text-gray-600">T3</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                              <div className="w-1.5 h-1.5 rounded-full bg-gray-300 border border-white"></div>
                              <span className="text-[10px] text-gray-600">T4</span>
                          </div>
                      </div>
                  </div>
              </div>
          </div>

          {/* Ticket Type Breakdown */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col h-[520px]">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Ticket Type Breakdown</h3>
              <div className="flex-1 min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={ticketTypeData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="name" tick={{fontSize: 10}} interval={0} angle={-45} textAnchor="end" height={60} />
                          <YAxis tick={{fontSize: 10}} />
                          <Tooltip content={({ active, payload, label }: any) => {
                              if (active && payload && payload.length) {
                                  const total = payload.reduce((sum: number, p: any) => sum + (Number(p.value) || 0), 0);
                                  return (
                                      <div className="bg-white p-2 border border-gray-200 shadow-lg rounded-lg text-xs z-50">
                                          <p className="font-bold text-gray-900 mb-1">{payload[0].payload.fullLabel}</p>
                                          {payload.map((p: any) => {
                                              const val = Number(p.value) || 0;
                                              const pct = total > 0 ? ((val / total) * 100).toFixed(1) : '0.0';
                                              return (
                                                  <div key={p.name} className="flex justify-between gap-4" style={{color: p.color}}>
                                                      <span>{p.name}:</span>
                                                      <span className="font-bold">
                                                          {val} <span className="text-[10px] opacity-80 font-normal">({pct}%)</span>
                                                      </span>
                                                  </div>
                                              );
                                          })}
                                          <div className="border-t border-gray-100 mt-1 pt-1 font-bold flex justify-between gap-4">
                                              <span>Total:</span>
                                              <span>{total}</span>
                                          </div>
                                      </div>
                                  );
                              }
                              return null;
                          }} />
                          <Legend wrapperStyle={{fontSize: '11px'}} />
                          <Bar dataKey="full" name="Full Price" stackId="a" fill="#16a34a" />
                          <Bar dataKey="discount" name="Discounted" stackId="a" fill="#eab308" />
                          <Bar dataKey="free" name="Giveaways" stackId="a" fill="#dc2626" />
                      </BarChart>
                  </ResponsiveContainer>
              </div>
          </div>
      </div>

      {/* ROW 2: Main Revenue Trend (Kept from before) */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center justify-between">
             <span>{uniqueOpponents.size === 1 ? `YoY History: ${Array.from(uniqueOpponents)[0]}` : 'Revenue vs Attendance Pacing'}</span>
             <span className="text-xs font-normal text-gray-500 flex items-center gap-1">
                <span className="w-3 h-0.5 bg-yellow-500 dashed"></span> Forecast Line
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
                        <div className="bg-white p-3 border border-gray-200 shadow-xl rounded-lg text-xs z-50 min-w-[180px]">
                          <div className="mb-2 border-b border-gray-100 pb-2">
                            <p className="font-bold text-sm text-gray-900 truncate">{d.opponent}</p>
                            <p className="text-gray-500">{d.date}</p>
                          </div>
                          <div className="space-y-1.5">
                             <div className="flex justify-between items-center gap-4">
                               <span className="text-gray-500">Season:</span>
                               <span className="font-medium text-gray-900">{d.season}</span>
                             </div>
                             <div className="flex justify-between items-center gap-4 border-t border-gray-50 pt-1 mt-1">
                               <span className="text-gray-500">Revenue:</span>
                               <span className="font-bold text-red-600">{formatCurrency(d.revenue)}</span>
                             </div>
                             <div className="flex justify-between items-center gap-4">
                               <span className="text-gray-500">Attendance:</span>
                               <span className="font-bold text-gray-900">{d.attendance}</span>
                             </div>
                             {d.trend !== undefined && (
                                <div className="flex justify-between items-center gap-4 border-t border-gray-50 pt-1 mt-1">
                                    <span className="text-gray-500">Forecast:</span>
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
                  name="Revenue (€)" 
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
                  name="Attendance" 
                  stroke="#1F2937" 
                  strokeWidth={2} 
                  dot={{r: 3}} 
                />
                {/* Trend Line (Linear Regression) */}
                <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="trend"
                    name="Trend (Forecast)"
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
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Tier Performance Analysis</h3>
              <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={tierData} margin={{ top: 20, right: 50, left: 0, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="tier" tick={{fontSize: 11}} />
                          <YAxis yAxisId="left" tickFormatter={formatAxisCurrency} tick={{fontSize: 10}} label={{ value: 'Avg Revenue', angle: -90, position: 'insideLeft', style:{fontSize:10} }} />
                          <YAxis yAxisId="right" orientation="right" reversed domain={[0, 17]} label={{ value: 'Avg PV Rank', angle: 90, position: 'right', offset: 10, style:{fontSize:10} }} />
                          <Tooltip 
                            formatter={(value: any, name: string) => {
                                if (name.includes('Rank')) return value.toFixed(1);
                                if (name.includes('Revenue')) return formatCurrency(value);
                                return value;
                            }}
                          />
                          <Legend wrapperStyle={{fontSize: '11px'}} />
                          <Bar yAxisId="left" dataKey="avgRevenue" name="Avg Revenue" fill="#475569" barSize={30} radius={[4, 4, 0, 0]} 
                               onClick={(d) => onFilterChange('tier', d.rawTier)} cursor="pointer"
                          />
                          <Line yAxisId="right" type="monotone" dataKey="avgRank" name="Avg PV Rank" stroke="#DC2626" strokeWidth={2} dot={{r: 4}} />
                      </ComposedChart>
                  </ResponsiveContainer>
              </div>
          </div>

          {/* Day of Week Analysis */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Day of Week Performance</h3>
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
                                            <p className="text-gray-600">Avg Rev: <strong className="text-green-600">{formatCurrency(d.avgRevenue)}</strong></p>
                                            <p className="text-gray-600">Avg Att: <strong className="text-blue-600">{Math.round(d.avgAttend)}</strong></p>
                                        </div>
                                    )
                                }
                                return null;
                             }}
                          />
                          <Legend wrapperStyle={{fontSize: '11px'}} />
                          <Bar yAxisId="left" dataKey="avgRevenue" name="Avg Revenue" fill="#16a34a" barSize={20} radius={[4, 4, 0, 0]} 
                               onClick={(d) => onFilterChange('day', d.day)} cursor="pointer"
                          />
                          <Bar yAxisId="right" dataKey="avgAttend" name="Avg Attendance" fill="#93c5fd" barSize={20} radius={[4, 4, 0, 0]} cursor="pointer" />
                      </BarChart>
                  </ResponsiveContainer>
              </div>
          </div>
      </div>
    </div>
  );
};