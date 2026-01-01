import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, ComposedChart, ReferenceLine, LabelList
} from 'recharts';
import { GameData, SalesChannel } from '../types';

interface DashboardChartProps {
  data: GameData[];
  onFilterChange: (type: 'opponent' | 'tier' | 'day', value: string) => void;
}

const COLORS = ['#DC2626', '#1F2937', '#4B5563', '#9CA3AF', '#F87171', '#EF4444'];

// STYLISH PALETTE: Oldest (Slate 500) -> Mid (Slate 800) -> Current (PV Red) -> Future/Alt (Dark Red)
const SEASON_COLORS = ['#64748B', '#1E293B', '#DC2626', '#991B1B']; 

const CHANNEL_COLORS: Record<string, string> = {
  [SalesChannel.ABB]: '#1F2937', // Dark Gray
  [SalesChannel.TIX]: '#DC2626', // PV Red
  [SalesChannel.CORP]: '#2563EB', // Blue
  [SalesChannel.MP]: '#F59E0B', // Amber
  [SalesChannel.VB]: '#10B981', // Green
  [SalesChannel.GIVEAWAY]: '#E5E7EB', // Light Gray
};

const GIVEAWAY_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981', 
  '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef', '#f43f5e'
];

const TIER_COLORS: Record<string, string> = {
  '1': '#DC2626', // Tier 1: Red (High Value)
  '2': '#EA580C', // Tier 2: Orange
  '3': '#CA8A04', // Tier 3: Yellow/Gold
  '4': '#64748B', // Tier 4: Slate
  'Unknown': '#94A3B8'
};

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

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

  const trendData = data
    .sort((a, b) => {
        // Sort chronologically
        const dateA = a.date.split('/').reverse().join('');
        const dateB = b.date.split('/').reverse().join('');
        return dateA.localeCompare(dateB);
    })
    .map(game => ({
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
        // Ticket Type Breakdown for Stacked Bar
        typeFull: game.ticketTypeBreakdown?.full || 0,
        typeDiscount: game.ticketTypeBreakdown?.discount || 0,
        typeGiveaway: game.ticketTypeBreakdown?.giveaway || 0
    }));

  // 2. Channel Breakdown (Pie)
  const channelStats: Record<string, number> = {};
  data.forEach(game => {
    game.salesBreakdown.forEach(s => {
      // Exclude Giveaways from Revenue Pie
      if (s.channel !== SalesChannel.GIVEAWAY) {
        channelStats[s.channel] = (channelStats[s.channel] || 0) + s.revenue;
      }
    });
  });

  const pieData = Object.keys(channelStats).map(key => ({
    name: key,
    value: channelStats[key]
  })).sort((a, b) => b.value - a.value);

  // 3. Tier Analysis (Bar Chart)
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

  const avgRevenueTotal = data.length > 0 ? data.reduce((acc, curr) => acc + curr.totalRevenue, 0) / data.length : 0;

  // 4. Day of Week Analysis
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
    avgTier: val.count > 0 ? val.tierSum / val.count : 0 // Calculate Avg Tier
  })).sort((a, b) => b.avgRevenue - a.avgRevenue);

  // 5. Monthly PnL Analysis (Multi-Season)
  const seasonMonthOrder = [7, 8, 9, 10, 11, 12, 1, 2, 3, 4, 5, 6];
  const uniqueSeasons: string[] = Array.from(new Set<string>(data.map(d => d.season))).sort();
  
  const monthlyPnlData = seasonMonthOrder.map(mIndex => {
      const monthName = MONTH_NAMES[mIndex - 1];
      const row: any = { name: monthName, monthIndex: mIndex };
      
      uniqueSeasons.forEach((season: string) => {
          // Sum PnL for this season and month
          const seasonTotal = data
              .filter(d => d.season === season)
              .reduce((acc, game) => acc + (game.pnlBreakdown?.[mIndex] || 0), 0);
          row[season] = seasonTotal;
      });
      return row;
  });

  // 6. Discount and Giveaway Details (Aggregated)
  const aggDiscount: Record<string, number> = {};
  const aggGiveaway: Record<string, number> = {};
  
  data.forEach(g => {
       if (g.ticketTypeBreakdown && g.ticketTypeBreakdown.discountDetails) {
           const details = g.ticketTypeBreakdown.discountDetails;
           Object.keys(details).forEach((k) => {
               aggDiscount[k] = (aggDiscount[k] || 0) + details[k];
           });
       }
       if (g.ticketTypeBreakdown && g.ticketTypeBreakdown.giveawayDetails) {
           const details = g.ticketTypeBreakdown.giveawayDetails;
           Object.keys(details).forEach((k) => {
               aggGiveaway[k] = (aggGiveaway[k] || 0) + details[k];
           });
       }
  });

  const discountDetailData = Object.entries(aggDiscount)
     .map(([name, value]) => ({ name, value }))
     .sort((a,b) => b.value - a.value);

  const giveawayDetailData = Object.entries(aggGiveaway)
     .map(([name, value]) => ({ name, value }))
     .sort((a,b) => b.value - a.value);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Trend - Takes up 2 columns */}
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
                
                {/* Custom Tooltip for detailed Game info */}
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
                             <div className="flex justify-between items-center gap-4">
                               <span className="text-gray-500">Tier:</span>
                               <span className="font-medium text-gray-900">{d.tier || 'N/A'}</span>
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

        {/* Channel Mix - Takes up 1 column */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Revenue Mix</h3>
          <div className="h-64 flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHANNEL_COLORS[entry.name] || COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{fontSize: '10px'}} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 text-center">
             <p className="text-xs text-gray-400">Excludes Giveaways/Protocol</p>
          </div>
        </div>
      </div>

      {/* NEW: Detailed Breakdown Charts */}
      { (discountDetailData.length > 0 || giveawayDetailData.length > 0) && (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
             <h3 className="text-lg font-semibold text-gray-800 mb-4">Discount Type Analysis</h3>
             <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={discountDetailData} layout="vertical" margin={{ left: 20, right: 30 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" width={80} tick={{fontSize: 11}} />
                      {/* Using props.payload.name to explicitly show the category name */}
                      <Tooltip formatter={(value: number, name: string, props: any) => [value, props.payload.name]} />
                      <Bar dataKey="value" fill="#eab308" radius={[0, 4, 4, 0]} barSize={20}>
                         <LabelList dataKey="value" position="right" fontSize={11} fill="#666" />
                      </Bar>
                   </BarChart>
                </ResponsiveContainer>
             </div>
         </div>

         <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
             <h3 className="text-lg font-semibold text-gray-800 mb-4">Giveaway Breakdown</h3>
             <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                   <PieChart>
                      <Pie
                        data={giveawayDetailData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                        label={({name, value}) => `${value}`} 
                      >
                        {giveawayDetailData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={GIVEAWAY_COLORS[index % GIVEAWAY_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number, name: string) => [value, name]} />
                      <Legend layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{fontSize: '10px'}} />
                   </PieChart>
                </ResponsiveContainer>
             </div>
         </div>
      </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Opponent Tier Analysis (Bar Chart) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
             <div>
                <h3 className="text-lg font-semibold text-gray-800">Revenue by Opponent Tier</h3>
                <p className="text-xs text-gray-400">Average Revenue per Tier</p>
             </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={tierData} 
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{fontSize: 12}} />
                <YAxis 
                   tickFormatter={formatAxisCurrency}
                   tick={{fontSize: 11}}
                />
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
                               <span className="font-bold text-gray-900">
                                 {formatCurrency(d.avgRevenue || 0)}
                               </span>
                             </div>
                             <div className="flex justify-between items-center gap-6">
                               <span className="text-gray-500">Games Played:</span>
                               <span className="font-mono text-gray-900 font-semibold">{d.gameCount}</span>
                             </div>
                             <div className="flex justify-between items-center gap-6 border-t border-gray-100 pt-1 mt-1">
                               <span className="text-gray-500">Total Rev:</span>
                               <span className="font-mono text-gray-600">
                                 {formatAxisCurrency(d.totalRevenue || 0)}
                               </span>
                             </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <ReferenceLine y={avgRevenueTotal} stroke="#9CA3AF" strokeDasharray="3 3" label={{ value: 'Avg', position: 'right', fontSize: 10, fill: '#9CA3AF' }} />
                <Bar 
                    dataKey="avgRevenue" 
                    radius={[4, 4, 0, 0]} 
                    barSize={40} 
                    cursor="pointer"
                    onClick={(data) => {
                        if (data && data.tierKey) {
                            onFilterChange('tier', data.tierKey);
                        }
                    }}
                >
                  {tierData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={TIER_COLORS[entry.tierKey] || TIER_COLORS['Unknown']} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Day of Week Analysis */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Avg Revenue by Day</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={dayData} 
                layout="vertical"
                margin={{top: 5, right: 30, left: 0, bottom: 5}}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis 
                    type="number" 
                    tickFormatter={formatAxisCurrency} 
                    tick={{fontSize: 10}} 
                />
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
                                <span className="font-bold text-gray-900">
                                  {formatCurrency(d.avgRevenue || 0)}
                                </span>
                              </div>
                              <div className="flex justify-between items-center gap-6">
                                <span className="text-gray-500">Games Played:</span>
                                <span className="font-mono text-gray-900 font-semibold">{d.gameCount}</span>
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
                    onClick={(data) => {
                        if (data && data.name) {
                            onFilterChange('day', data.name);
                        }
                    }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Monthly PnL Analysis */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Monthly Revenue PnL (Season Cycle)</h3>
          <div className="h-64">
             <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyPnlData} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{fontSize: 12}} />
                    <YAxis 
                        tickFormatter={(val) => val === 0 ? '0' : formatAxisCurrency(val)} 
                        tick={{fontSize: 11}} 
                    />
                    <Tooltip 
                       cursor={{fill: 'transparent'}}
                       formatter={(value: number, name: string) => [formatCurrency(value), name]}
                    />
                    <Legend />
                    {uniqueSeasons.map((season, index) => (
                        <Bar 
                            key={season} 
                            dataKey={season} 
                            fill={SEASON_COLORS[index % SEASON_COLORS.length]} 
                            radius={[4, 4, 0, 0]} 
                            barSize={uniqueSeasons.length > 1 ? 20 : 40}
                        >
                             <LabelList 
                                dataKey={season} 
                                position="top" 
                                formatter={(val: number) => {
                                    if (!val) return '';
                                    return formatAxisCurrency(val);
                                }}
                                style={{ fontSize: '10px', fill: '#666' }}
                            />
                        </Bar>
                    ))}
                </BarChart>
             </ResponsiveContainer>
          </div>
      </div>
    </div>
  );
};