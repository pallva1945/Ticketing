import React from 'react';
import { 
  BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, ComposedChart, ScatterChart, Scatter, ReferenceLine, ZAxis, Label
} from 'recharts';
import { GameData } from '../types';

interface DashboardChartProps {
  data: GameData[];
  efficiencyData?: GameData[]; // Added optional prop for specific Efficiency chart data
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

export const DashboardChart: React.FC<DashboardChartProps> = ({ data, efficiencyData, onFilterChange }) => {
  
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

  // 2. Yield vs Occupancy (Scatter Quadrant) - Uses efficiencyData if provided
  const sourceDataForScatter = efficiencyData || data;
  const scatterData = sourceDataForScatter.map(game => {
      const occupancy = game.capacity > 0 ? (game.attendance / game.capacity) * 100 : 0;
      const yieldVal = game.attendance > 0 ? game.totalRevenue / game.attendance : 0;
      return {
          name: game.opponent,
          x: occupancy,
          y: yieldVal,
          z: game.totalRevenue, // Bubble size
          season: game.season,
          date: game.date,
          attendance: game.attendance,
          capacity: game.capacity
      };
  });
  
  // Calculate averages for quadrants
  const avgOccupancy = scatterData.reduce((acc, d) => acc + d.x, 0) / (scatterData.length || 1);
  const avgYield = scatterData.reduce((acc, d) => acc + d.y, 0) / (scatterData.length || 1);

  // 3. Ticket Type Breakdown (Stacked Bar)
  const ticketTypeData = sortedData.map(game => {
      const breakdown = game.ticketTypeBreakdown || { full: 0, discount: 0, giveaway: 0 };
      // Fallback logic if breakdown is empty but we have salesBreakdown
      // Note: processGameData calculates ticketTypeBreakdown, so it should be there.
      return {
          name: isComparisonMode ? `${game.season}` : game.opponent.substring(0, 8),
          fullLabel: game.opponent,
          full: breakdown.full,
          discount: breakdown.discount,
          free: breakdown.giveaway
      };
  });

  return (
    <div className="space-y-6">
      
      {/* ROW 1: Yield Matrix & Ticket Types */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Yield vs Occupancy Quadrant */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center justify-between">
                  <span>GameDay Efficiency Matrix</span>
                  <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-1 rounded">Locked: Game Day View</span>
              </h3>
              <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                      <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 10 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" dataKey="x" name="Occupancy" unit="%" domain={[25, 100]} tick={{fontSize: 10}}>
                             <Label value="Occupancy % (Game Day Inventory)" offset={-10} position="insideBottom" style={{ fontSize: '10px', fill: '#64748b' }} />
                          </XAxis>
                          <YAxis type="number" dataKey="y" name="Yield" unit="€" tick={{fontSize: 10}}>
                             <Label value="Yield / Avg Price (€)" angle={-90} position="insideLeft" style={{ fontSize: '10px', fill: '#64748b' }} />
                          </YAxis>
                          <ZAxis type="number" dataKey="z" range={[50, 400]} name="Revenue" />
                          <Tooltip cursor={{ strokeDasharray: '3 3' }} content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                  const d = payload[0].payload;
                                  return (
                                      <div className="bg-white p-3 border border-gray-200 shadow-xl rounded-lg text-xs z-50 min-w-[150px]">
                                          <div className="mb-2 border-b border-gray-100 pb-1">
                                              <p className="font-bold text-gray-900 text-sm">{d.name}</p>
                                              <p className="text-[10px] text-gray-500">{d.date} • {d.season}</p>
                                          </div>
                                          <div className="space-y-1">
                                              <div className="flex justify-between">
                                                  <span className="text-gray-500">Occupancy:</span>
                                                  <span className="font-bold text-gray-800">{d.x.toFixed(1)}% <span className="text-[9px] font-normal text-gray-400">({d.attendance}/{d.capacity})</span></span>
                                              </div>
                                              <div className="flex justify-between">
                                                  <span className="text-gray-500">Yield (ATP):</span>
                                                  <span className="font-bold text-blue-600">€{d.y.toFixed(1)}</span>
                                              </div>
                                              <div className="flex justify-between border-t border-gray-50 pt-1 mt-1">
                                                  <span className="text-gray-500">Revenue:</span>
                                                  <span className="font-bold text-green-600">€{(d.z / 1000).toFixed(1)}k</span>
                                              </div>
                                          </div>
                                      </div>
                                  );
                              }
                              return null;
                          }} />
                          {/* Quadrant Lines */}
                          <ReferenceLine x={avgOccupancy} stroke="#94a3b8" strokeDasharray="3 3" />
                          <ReferenceLine y={avgYield} stroke="#94a3b8" strokeDasharray="3 3" />
                          
                          {/* Quadrant Labels */}
                          <ReferenceLine y={avgYield * 1.5} stroke="none" label={{ value: 'Premium', position: 'insideTopLeft', fontSize: 10, fill: '#DC2626', fontWeight: 'bold' }} />
                          <ReferenceLine y={avgYield * 1.5} stroke="none" label={{ value: 'Cash Cows', position: 'insideTopRight', fontSize: 10, fill: '#16a34a', fontWeight: 'bold' }} />
                          <ReferenceLine y={avgYield * 0.5} stroke="none" label={{ value: 'Kill Zone', position: 'insideBottomLeft', fontSize: 10, fill: '#94a3b8', fontWeight: 'bold' }} />
                          <ReferenceLine y={avgYield * 0.5} stroke="none" label={{ value: 'Discount Trap', position: 'insideBottomRight', fontSize: 10, fill: '#ea580c', fontWeight: 'bold' }} />

                          <Scatter name="Games" data={scatterData} fill="#8884d8">
                              {scatterData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.y > avgYield ? (entry.x > avgOccupancy ? '#16a34a' : '#DC2626') : (entry.x > avgOccupancy ? '#ea580c' : '#94a3b8')} />
                              ))}
                          </Scatter>
                      </ScatterChart>
                  </ResponsiveContainer>
              </div>
          </div>

          {/* Ticket Type Breakdown */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Ticket Type Breakdown</h3>
              <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={ticketTypeData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="name" tick={{fontSize: 10}} interval={0} angle={-45} textAnchor="end" height={60} />
                          <YAxis tick={{fontSize: 10}} />
                          <Tooltip content={({ active, payload, label }) => {
                              if (active && payload && payload.length) {
                                  // @ts-ignore
                                  const total = payload.reduce((sum, p) => sum + (p.value as number), 0);
                                  return (
                                      <div className="bg-white p-2 border border-gray-200 shadow-lg rounded-lg text-xs z-50">
                                          <p className="font-bold text-gray-900 mb-1">{payload[0].payload.fullLabel}</p>
                                          {payload.map((p: any) => (
                                              <div key={p.name} className="flex justify-between gap-4" style={{color: p.color}}>
                                                  <span>{p.name}:</span>
                                                  <span className="font-bold">{p.value}</span>
                                              </div>
                                          ))}
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
                          <Bar dataKey="free" name="Comp/Free" stackId="a" fill="#dc2626" />
                      </BarChart>
                  </ResponsiveContainer>
              </div>
          </div>
      </div>

      {/* Main Revenue Trend (Kept from before) */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
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
    </div>
  );
};