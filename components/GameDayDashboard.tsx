
import React, { useState, useMemo } from 'react';
import { GameDayData } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, ComposedChart } from 'recharts';
import { ShoppingBag, Coffee, Car, Crown, DollarSign, ToggleLeft, ToggleRight, Users, AlertCircle } from 'lucide-react';

interface GameDayDashboardProps {
  data: GameDayData[];
}

export const GameDayDashboard: React.FC<GameDayDashboardProps> = ({ data }) => {
  // Default to TRUE to avoid double counting as per instructions
  const [excludeTicketing, setExcludeTicketing] = useState(true);

  // Use data as-is (it is already filtered and sorted by the parent)
  // Just ensure chronological order for the chart
  const sortedData = useMemo(() => {
      return [...data].sort((a, b) => {
          // Parse DD/MM/YYYY
          const [da, ma, ya] = a.date.split('/');
          const [db, mb, yb] = b.date.split('/');
          return new Date(`${ya}-${ma}-${da}`).getTime() - new Date(`${yb}-${mb}-${db}`).getTime();
      });
  }, [data]);

  const stats = useMemo(() => {
      const totals = sortedData.reduce((acc, game) => ({
          attendance: acc.attendance + game.attendance,
          total: acc.total + (excludeTicketing ? (game.totalRevenue - game.tixRevenue) : game.totalRevenue),
          merch: acc.merch + game.merchRevenue,
          fb: acc.fb + game.fbRevenue,
          hospitality: acc.hospitality + game.hospitalityRevenue,
          parking: acc.parking + game.parkingRevenue,
          exp: acc.exp + game.expRevenue,
          sponsorship: acc.sponsorship + game.sponsorshipRevenue,
          tv: acc.tv + game.tvRevenue,
      }), {
          attendance: 0, total: 0, merch: 0, fb: 0, hospitality: 0, parking: 0, exp: 0, sponsorship: 0, tv: 0
      });

      const gameCount = sortedData.length || 1;

      return {
          ...totals,
          avgTotal: totals.total / gameCount,
          sph: totals.attendance > 0 ? totals.total / totals.attendance : 0,
          merchSph: totals.attendance > 0 ? totals.merch / totals.attendance : 0,
          fbSph: totals.attendance > 0 ? totals.fb / totals.attendance : 0
      };
  }, [sortedData, excludeTicketing]);

  const chartData = sortedData.map(game => ({
      name: game.opponent.substring(0, 10),
      fullLabel: `${game.opponent} (${game.date})`,
      ...(excludeTicketing ? {} : { Ticketing: game.tixRevenue }),
      Merch: game.merchRevenue,
      "F&B": game.fbRevenue,
      Hospitality: game.hospitalityRevenue,
      Parking: game.parkingRevenue,
      Experience: game.expRevenue,
      Sponsorship: game.sponsorshipRevenue, // Often 0 or fixed, but included
      TV: game.tvRevenue
  }));

  const formatCurrency = (val: number) => `€${val >= 1000 ? (val/1000).toFixed(1) + 'k' : val.toFixed(0)}`;

  const KPICard = ({ label, value, subLabel, icon: Icon, color }: any) => (
      <div className={`bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-start justify-between ${color}`}>
          <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">{label}</p>
              <p className="text-xl font-bold text-gray-900">{typeof value === 'number' ? `€${value.toLocaleString(undefined, {maximumFractionDigits: 0})}` : value}</p>
              {subLabel && <p className="text-[10px] text-gray-400 mt-1">{subLabel}</p>}
          </div>
          <div className={`p-2 rounded-lg bg-opacity-10 ${color.replace('border', 'bg').replace('text', 'bg')}`}>
              <Icon size={20} className="opacity-80" />
          </div>
      </div>
  );

  if (data.length === 0) {
      return (
          <div className="flex flex-col items-center justify-center h-64 bg-white rounded-xl border border-gray-200">
              <AlertCircle size={32} className="text-gray-300 mb-2" />
              <p className="text-gray-500 text-sm">No GameDay data matches the current filters.</p>
          </div>
      );
  }

  return (
    <div className="space-y-6 animate-fade-in">
        {/* Controls */}
        <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div>
                <h2 className="text-lg font-bold text-gray-800">GameDay Revenue</h2>
                <p className="text-xs text-gray-500">Ancillary revenue streams and per-fan spending analysis.</p>
            </div>
            <button 
                onClick={() => setExcludeTicketing(!excludeTicketing)}
                className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-all ${excludeTicketing ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-gray-50 text-gray-600 border border-gray-200'}`}
            >
                <span className="text-xs font-bold uppercase">{excludeTicketing ? 'Ticketing Excluded' : 'Ticketing Included'}</span>
                {excludeTicketing ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
            </button>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard 
                label={excludeTicketing ? "Net GameDay Revenue" : "Total Revenue"}
                value={stats.total}
                subLabel={`Avg: €${stats.avgTotal.toLocaleString(undefined, {maximumFractionDigits: 0})} / game`}
                icon={DollarSign}
                color="text-emerald-600 border-emerald-100"
            />
            <KPICard 
                label="Spend Per Head (SPH)"
                value={`€${stats.sph.toFixed(2)}`}
                subLabel={excludeTicketing ? "Ancillary Spend Only" : "Incl. Ticket"}
                icon={Users}
                color="text-blue-600 border-blue-100"
            />
            <KPICard 
                label="Merchandising"
                value={stats.merch}
                subLabel={`SPH: €${stats.merchSph.toFixed(2)}`}
                icon={ShoppingBag}
                color="text-orange-600 border-orange-100"
            />
            <KPICard 
                label="Food & Beverage"
                value={stats.fb}
                subLabel={`SPH: €${stats.fbSph.toFixed(2)}`}
                icon={Coffee}
                color="text-purple-600 border-purple-100"
            />
        </div>

        {/* Breakdown Chart */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-[500px] flex flex-col">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">Revenue Mix by Game</h3>
            <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" tick={{fontSize: 10}} />
                        <YAxis tickFormatter={formatCurrency} tick={{fontSize: 10}} />
                        <Tooltip 
                            formatter={(value: number) => `€${value.toLocaleString()}`}
                            labelStyle={{color: '#111827', fontWeight: 'bold'}}
                            contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}}
                        />
                        <Legend wrapperStyle={{fontSize: '11px', paddingTop: '10px'}} />
                        
                        {!excludeTicketing && <Bar dataKey="Ticketing" stackId="a" fill="#ef4444" />}
                        <Bar dataKey="Merch" stackId="a" fill="#f97316" />
                        <Bar dataKey="F&B" stackId="a" fill="#8b5cf6" />
                        <Bar dataKey="Hospitality" stackId="a" fill="#10b981" />
                        <Bar dataKey="Parking" stackId="a" fill="#64748b" />
                        <Bar dataKey="Experience" stackId="a" fill="#ec4899" />
                        <Bar dataKey="Sponsorship" stackId="a" fill="#3b82f6" />
                        <Bar dataKey="TV" stackId="a" fill="#6366f1" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Secondary Metrics Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
             <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                 <div className="flex items-center gap-3 mb-2">
                     <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600"><Crown size={18} /></div>
                     <h4 className="font-bold text-gray-700">Hospitality</h4>
                 </div>
                 <p className="text-2xl font-bold text-gray-900">€{stats.hospitality.toLocaleString()}</p>
                 <div className="w-full bg-gray-100 h-1.5 rounded-full mt-2 overflow-hidden">
                     <div className="h-full bg-emerald-500" style={{width: `${(stats.hospitality / stats.total) * 100}%`}}></div>
                 </div>
                 <p className="text-xs text-gray-400 mt-1">{(stats.hospitality / stats.total * 100).toFixed(1)}% of Revenue</p>
             </div>

             <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                 <div className="flex items-center gap-3 mb-2">
                     <div className="p-2 bg-gray-100 rounded-lg text-gray-600"><Car size={18} /></div>
                     <h4 className="font-bold text-gray-700">Parking</h4>
                 </div>
                 <p className="text-2xl font-bold text-gray-900">€{stats.parking.toLocaleString()}</p>
                 <div className="w-full bg-gray-100 h-1.5 rounded-full mt-2 overflow-hidden">
                     <div className="h-full bg-gray-500" style={{width: `${(stats.parking / stats.total) * 100}%`}}></div>
                 </div>
                 <p className="text-xs text-gray-400 mt-1">{(stats.parking / stats.total * 100).toFixed(1)}% of Revenue</p>
             </div>

             <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                 <div className="flex items-center gap-3 mb-2">
                     <div className="p-2 bg-pink-50 rounded-lg text-pink-600"><Crown size={18} /></div>
                     <h4 className="font-bold text-gray-700">Experience</h4>
                 </div>
                 <p className="text-2xl font-bold text-gray-900">€{stats.exp.toLocaleString()}</p>
                 <div className="w-full bg-gray-100 h-1.5 rounded-full mt-2 overflow-hidden">
                     <div className="h-full bg-pink-500" style={{width: `${(stats.exp / stats.total) * 100}%`}}></div>
                 </div>
                 <p className="text-xs text-gray-400 mt-1">{(stats.exp / stats.total * 100).toFixed(1)}% of Revenue</p>
             </div>
        </div>
    </div>
  );
};
