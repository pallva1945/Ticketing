import React from 'react';
import { 
  BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, ComposedChart, AreaChart, Area
} from 'recharts';
import { GameData } from '../types';

interface DashboardChartProps {
  data: GameData[];
  onFilterChange: (type: 'opponent' | 'tier' | 'day', value: string) => void;
}

const TIER_COLORS: Record<string, string> = {
  '1': '#DC2626', // Tier 1: Red (High Value)
  '2': '#EA580C', // Tier 2: Orange
  '3': '#CA8A04', // Tier 3: Yellow/Gold
  '4': '#64748B', // Tier 4: Slate
  'Unknown': '#94A3B8'
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

export const DashboardChart: React.FC<DashboardChartProps> = ({ data, onFilterChange }) => {
  
  // 1. Revenue & Attendance Trend (Composed)
  const uniqueOpponents = new Set(data.map(d => d.opponent));
  const isComparisonMode = uniqueOpponents.size < data.length * 0.5;

  const sortedData = [...data].sort((a, b) => {
        const dateA = a.date.split('/').reverse().join('');
        const dateB = b.date.split('/').reverse().join('');
        return dateA.localeCompare(dateB);
  });

  const trendData = sortedData.map(game => ({
        name: isComparisonMode 
            ? `${game.season}`
            : (uniqueOpponents.size <= 3 ? `${game.season} ${game.opponent}` : game.opponent.substring(0, 8)),
        fullLabel: `${game.opponent} (${game.season})`,
        date: game.date,
        revenue: game.totalRevenue,
        attendance: game.attendance,
        opponent: game.opponent,
        season: game.season,
        tier: game.tier,
    }));

  // 2. Tier Analysis (Bar Chart)
  const tierStats: Record<string, { revenue: number; count: number }> = {};
  data.forEach(game => {
    const tierKey = game.tier && game.tier > 0 ? game.tier.toString() : 'Unknown';
    if (!tierStats[tierKey]) tierStats[tierKey] = { revenue: 0, count: 0 };
    tierStats[tierKey].revenue += game.totalRevenue;
    tierStats[tierKey].count += 1;
  });

  const tierData = Object.entries(tierStats)
    .map(([tier, val]) => ({
      name: tier === 'Unknown' ? 'Unknown' : `Tier ${tier}`,
      tierKey: tier,
      avgRevenue: val.count > 0 ? val.revenue / val.count : 0,
      totalRevenue: val.revenue,
      gameCount: val.count
    }))
    .sort((a, b) => {
      if (a.tierKey === 'Unknown') return 1;
      if (b.tierKey === 'Unknown') return -1;
      return parseInt(a.tierKey) - parseInt(b.tierKey);
    });

  // 3. Day of Week Analysis with Avg Tier
  const dayStats: Record<string, { revenue: number, count: number, tierSum: number }> = {};
  data.forEach(game => {
    const [day, month, year] = game.date.split('/');
    const dateObj = new Date(Number(year), Number(month) - 1, Number(day));
    const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
    
    if (!dayStats[dayName]) dayStats[dayName] = { revenue: 0, count: 0, tierSum: 0 };
    dayStats[dayName].revenue += game.totalRevenue;
    dayStats[dayName].count += 1;
    dayStats[dayName].tierSum += (game.tier || 0);
  });

  const dayData = Object.entries(dayStats).map(([day, val]) => ({
    name: day,
    avgRevenue: val.revenue / val.count,
    gameCount: val.count,
    avgTier: val.count > 0 ? val.tierSum / val.count : 0
  })).sort((a, b) => b.avgRevenue - a.avgRevenue);

  // 4. Moving Average (Last 3 Games)
  const movingAvgData = sortedData.map((game, index) => {
      const windowStart = Math.max(0, index - 2);
      const windowGames = sortedData.slice(windowStart, index + 1);
      const sumRev = windowGames.reduce((acc, g) => acc + g.totalRevenue, 0);
      const avgRev = sumRev / windowGames.length;

      return {
          name: game.opponent.substring(0, 10),
          fullLabel: `${game.opponent} (${game.date})`,
          actualRevenue: game.totalRevenue,
          movingAvg: avgRev,
          season: game.season
      };
  });

  return (
    <div className="space-y-6">
      {/* Top Row: Trend & Tier */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Revenue Trend */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
             {uniqueOpponents.size === 1 
                ? `YoY History: ${Array.from(uniqueOpponents)[0]}` 
                : 'Revenue vs Attendance Pacing'}
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
                  content={({ active, payload }) => {
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
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tier Analysis (Smaller) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Value by Tier</h3>
          <div className="h-72 flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tierData} margin={{ top: 20, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{fontSize: 11}} interval={0} />
                <YAxis tickFormatter={formatAxisCurrency} tick={{fontSize: 11}} width={40} />
                <Tooltip 
                  cursor={{fill: 'transparent'}}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-white p-2 border border-gray-200 shadow-lg rounded-lg text-xs z-50">
                          <p className="font-bold text-gray-900 mb-1">{d.name}</p>
                          <p className="text-red-600 font-bold">{formatCurrency(d.avgRevenue)} <span className="text-gray-400 font-normal">avg</span></p>
                          <p className="text-gray-500">{d.gameCount} Games Played</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar 
                    dataKey="avgRevenue" 
                    radius={[4, 4, 0, 0]} 
                    barSize={30} 
                    cursor="pointer"
                    onClick={(data) => data.tierKey && onFilterChange('tier', data.tierKey)}
                >
                  {tierData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={TIER_COLORS[entry.tierKey] || '#94A3B8'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Moving Average Chart (Replaces Monthly PnL) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4">
             <h3 className="text-lg font-semibold text-gray-800">Revenue Trend (Moving Avg)</h3>
             <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">Last 3 Games Smoothing</span>
          </div>
          <div className="h-64">
             <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={movingAvgData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorMa" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563EB" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{fontSize: 10}} />
                    <YAxis tickFormatter={formatAxisCurrency} tick={{fontSize: 11}} />
                    <Tooltip 
                        contentStyle={{fontSize: '12px'}}
                        formatter={(val: number, name: string) => [formatCurrency(val), name === 'movingAvg' ? '3-Game Avg' : 'Actual Rev']}
                        labelFormatter={(label) => `Opponent: ${label}`}
                    />
                    <Legend wrapperStyle={{fontSize: '11px'}} />
                    <Area type="monotone" dataKey="movingAvg" stroke="#2563EB" fillOpacity={1} fill="url(#colorMa)" strokeWidth={2} name="3-Game Avg" />
                    <Line type="monotone" dataKey="actualRevenue" stroke="#DC2626" strokeWidth={1} strokeDasharray="3 3" dot={{r:2}} name="Actual" />
                </AreaChart>
             </ResponsiveContainer>
          </div>
        </div>

        {/* Day of Week (Refined) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Day Performance & Tier</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={dayData} 
                layout="vertical"
                margin={{top: 5, right: 30, left: 0, bottom: 5}}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tickFormatter={formatAxisCurrency} tick={{fontSize: 10}} />
                <YAxis dataKey="name" type="category" width={40} tick={{fontSize: 12}} />
                <Tooltip 
                   cursor={{fill: 'transparent'}}
                   content={({ active, payload }) => {
                     if (active && payload && payload.length) {
                       const d = payload[0].payload;
                       return (
                         <div className="bg-white p-3 border border-gray-200 shadow-lg rounded-lg text-xs z-50">
                           <p className="font-bold text-sm mb-2 text-gray-900">{d.name}</p>
                           <div className="space-y-1.5">
                              <div className="flex justify-between items-center gap-6">
                                <span className="text-gray-500">Avg Revenue:</span>
                                <span className="font-bold text-gray-900">{formatCurrency(d.avgRevenue)}</span>
                              </div>
                              <div className="flex justify-between items-center gap-6 border-t border-gray-100 pt-1 mt-1">
                                <span className="text-gray-500">Avg Opp Tier:</span>
                                <span className="font-bold text-blue-600">{d.avgTier ? d.avgTier.toFixed(1) : '-'}</span>
                              </div>
                           </div>
                         </div>
                       );
                     }
                     return null;
                   }}
                />
                <Bar 
                    dataKey="avgRevenue" 
                    fill="#4B5563" 
                    radius={[0, 4, 4, 0]} 
                    barSize={24} 
                    cursor="pointer"
                    onClick={(data) => data.name && onFilterChange('day', data.name)}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
};