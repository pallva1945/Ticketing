
import React, { useMemo } from 'react';
import { GameDayData } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ShoppingBag, Coffee, Car, Crown, DollarSign, Users, Ticket, Tv, Flag, Sparkles, AlertCircle, Coins } from 'lucide-react';

interface GameDayDashboardProps {
  data: GameDayData[];
  includeTicketing?: boolean;
}

export const GameDayDashboard: React.FC<GameDayDashboardProps> = ({ data, includeTicketing = false }) => {
  
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
          tix: acc.tix + game.tixRevenue,
          merch: acc.merch + game.merchRevenue,
          fb: acc.fb + game.fbRevenue,
          hospitality: acc.hospitality + game.hospitalityRevenue,
          parking: acc.parking + game.parkingRevenue,
          exp: acc.exp + game.expRevenue,
          sponsorship: acc.sponsorship + game.sponsorshipRevenue,
          tv: acc.tv + game.tvRevenue,
      }), {
          attendance: 0, tix: 0, merch: 0, fb: 0, hospitality: 0, parking: 0, exp: 0, sponsorship: 0, tv: 0
      });

      // Net GameDay Variable (Merch + F&B + Hosp + Park + Exp)
      const totalVariable = totals.merch + totals.fb + totals.hospitality + totals.parking + totals.exp;
      
      const gameCount = sortedData.length || 1;

      // "Budget Revenue" / "GameDay Net Revenue" logic
      // According to requirement:
      // If Toggle ON: 2.9M Target -> Measures Everything (Total Revenue including Tix)
      // If Toggle OFF: 1.25M Target -> Measures Everything minus Tix (Variable + Spons + TV)
      
      const revenueForBudget = includeTicketing 
          ? (totalVariable + totals.tix + totals.sponsorship + totals.tv)
          : (totalVariable + totals.sponsorship + totals.tv);

      return {
          gameCount,
          attendance: totals.attendance / gameCount, // Avg Attendance
          tix: totals.tix / gameCount,
          merch: totals.merch / gameCount,
          fb: totals.fb / gameCount,
          hospitality: totals.hospitality / gameCount,
          parking: totals.parking / gameCount,
          exp: totals.exp / gameCount,
          sponsorship: totals.sponsorship / gameCount,
          tv: totals.tv / gameCount,
          
          // Calculated Averages for Cards
          avgBudgetRev: revenueForBudget / gameCount,
          avgVariableOps: totalVariable / gameCount, // Pure operational variable (Merch/F&B/Hosp/Park/Exp)
          
          // SPH Calculation (Based on the revenue being tracked)
          commercialSph: totals.attendance > 0 ? revenueForBudget / totals.attendance : 0,
      };
  }, [sortedData, includeTicketing]);

  const chartData = sortedData.map(game => ({
      name: game.opponent.substring(0, 10),
      fullLabel: `${game.opponent} (${game.date})`,
      Ticketing: includeTicketing ? game.tixRevenue : 0, // Zero out if hidden
      Merch: game.merchRevenue,
      "F&B": game.fbRevenue,
      Hospitality: game.hospitalityRevenue,
      Parking: game.parkingRevenue,
      Experience: game.expRevenue,
      Sponsorship: game.sponsorshipRevenue, 
      TV: game.tvRevenue
  }));

  const formatCurrency = (val: number) => `€${val >= 1000 ? (val/1000).toFixed(1) + 'k' : val.toFixed(0)}`;

  // Top Row Card Component
  const KPICard = ({ label, value, subLabel, icon: Icon, color, borderTop = false }: any) => (
      <div className={`bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-start justify-between ${color} ${borderTop ? 'border-t-4' : ''}`}>
          <div>
              <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">{label}</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{typeof value === 'number' ? `€${value.toLocaleString(undefined, {maximumFractionDigits: 0})}` : value}</p>
              {subLabel && <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 font-medium">{subLabel}</p>}
          </div>
          <div className={`p-2 rounded-lg bg-opacity-10 ${color.replace('border', 'bg').replace('text', 'bg').split(' ')[0]}`}>
              <Icon size={20} className="opacity-90" />
          </div>
      </div>
  );

  // Bottom Row Breakdown Component
  const BreakdownCard = ({ label, value, colorClass, icon: Icon, totalForMix, attendance }: any) => {
      // Calculate share relative to the Tracked Total
      const share = totalForMix > 0 ? (value / totalForMix) * 100 : 0;
      const sph = attendance > 0 ? value / attendance : 0;
      const colorBase = colorClass.split('-')[1]; // extract 'orange', 'purple' etc

      return (
        <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col justify-between h-full hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-lg bg-${colorBase}-50 text-${colorBase}-600`}>
                    <Icon size={18} />
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded bg-${colorBase}-50 text-${colorBase}-700`}>
                    {share.toFixed(1)}% Mix
                </span>
            </div>
            
            <div>
                <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">{label}</h4>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mb-2">€{value.toLocaleString(undefined, {maximumFractionDigits: 0})}</p>
                
                <div className="w-full bg-gray-100 dark:bg-gray-800 h-1.5 rounded-full mb-2 overflow-hidden">
                    <div className={`h-full bg-${colorBase}-500`} style={{width: `${share}%`}}></div>
                </div>
                
                <div className="flex justify-between items-center text-[10px]">
                    <span className="font-medium text-gray-400 dark:text-gray-500 flex items-center gap-1">
                        <Users size={10} /> SPH
                    </span>
                    <span className="font-bold text-gray-800 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 px-1.5 py-0.5 rounded border border-gray-100 dark:border-gray-800">
                        €{sph.toFixed(2)}
                    </span>
                </div>
            </div>
        </div>
      );
  };

  if (data.length === 0) {
      return (
          <div className="flex flex-col items-center justify-center h-64 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
              <AlertCircle size={32} className="text-gray-300 mb-2" />
              <p className="text-gray-500 dark:text-gray-400 text-sm">No GameDay data matches the current filters.</p>
          </div>
      );
  }

  return (
    <div className="space-y-8 animate-fade-in">
        
        {/* TOP ROW: High Level KPIs */}
        <div>
            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider mb-4 flex items-center gap-2">
                <DollarSign size={16} /> Financial Overview (Per Game Avg)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                
                {/* 1. Primary Tracking Metric */}
                <KPICard 
                    label={includeTicketing ? "Total GameDay Rev" : "GameDay Rev (Net)"}
                    value={stats.avgBudgetRev}
                    subLabel={includeTicketing ? "Total Net (Target 2.9M)" : "Net excl. Tix (Target 1.25M)"}
                    icon={Coins}
                    color="text-emerald-600 border-emerald-100"
                    borderTop
                />

                {/* 2. Operational/Variable Component */}
                <KPICard 
                    label="Variable Ops (Total)"
                    value={stats.avgVariableOps}
                    subLabel="Merch, F&B, Hosp, Park, Exp"
                    icon={Sparkles}
                    color="text-indigo-600 border-indigo-100"
                    borderTop
                />

                {/* 3. SPH */}
                <KPICard 
                    label="Rev Per Head"
                    value={`€${stats.commercialSph.toFixed(2)}`}
                    subLabel={`Based on Total Tracked`}
                    icon={Users}
                    color="text-teal-600 border-teal-100"
                    borderTop
                />

                {/* 4. Sponsorship Allocation */}
                <KPICard 
                    label="Avg Sponsorship"
                    value={stats.sponsorship}
                    subLabel="Allocated / Game"
                    icon={Flag}
                    color="text-blue-600 border-blue-100"
                    borderTop
                />

                {/* 5. Fixed Context (Ticketing or TV based on toggle) */}
                {includeTicketing ? (
                    <KPICard 
                        label="Avg TV Rights"
                        value={stats.tv}
                        subLabel="Allocated / Game"
                        icon={Tv}
                        color="text-purple-600 border-purple-100"
                        borderTop
                    />
                ) : (
                    <KPICard 
                        label="Avg Ticketing"
                        value={stats.tix}
                        subLabel="Excluded from this View"
                        icon={Ticket}
                        color="text-gray-400 dark:text-gray-500 border-gray-200 dark:border-gray-700"
                    />
                )}
            </div>
        </div>

        {/* MIDDLE: Breakdown Chart */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm h-[400px] flex flex-col">
            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider mb-4">
                {includeTicketing ? 'Total Revenue Mix by Match (Incl. Tix)' : 'Revenue Mix by Match (Excl. Tix)'}
            </h3>
            <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" tick={{fontSize: 10}} />
                        <YAxis tickFormatter={formatCurrency} tick={{fontSize: 10}} />
                        <Tooltip 
                            formatter={(value: number) => `€${value.toLocaleString()}`}
                            labelStyle={{color: '#111827', fontWeight: 'bold'}}
                            contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}}
                        />
                        <Legend wrapperStyle={{fontSize: '11px', paddingTop: '10px'}} />
                        
                        {includeTicketing && (
                            <Bar dataKey="Ticketing" stackId="a" fill="#ef4444" />
                        )}
                        <Bar dataKey="Sponsorship" stackId="a" fill="#3b82f6" />
                        <Bar dataKey="TV" stackId="a" fill="#6366f1" />
                        
                        {/* Variable Streams on Top - Aligned with Bottom Card Order */}
                        <Bar dataKey="Hospitality" stackId="a" fill="#10b981" />
                        <Bar dataKey="Parking" stackId="a" fill="#64748b" />
                        <Bar dataKey="Experience" stackId="a" fill="#ec4899" />
                        <Bar dataKey="Merch" stackId="a" fill="#f97316" />
                        <Bar dataKey="F&B" stackId="a" fill="#8b5cf6" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* BOTTOM ROW: Variable Stream Breakdown */}
        <div>
            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Sparkles size={16} /> Operational Variable Mix (Avg Per Game)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <BreakdownCard 
                    label="Hospitality"
                    value={stats.hospitality}
                    totalForMix={stats.avgBudgetRev}
                    attendance={stats.attendance}
                    icon={Crown}
                    colorClass="text-emerald-600"
                />
                <BreakdownCard 
                    label="Parking"
                    value={stats.parking}
                    totalForMix={stats.avgBudgetRev}
                    attendance={stats.attendance}
                    icon={Car}
                    colorClass="text-slate-600"
                />
                <BreakdownCard 
                    label="Experiences"
                    value={stats.exp}
                    totalForMix={stats.avgBudgetRev}
                    attendance={stats.attendance}
                    icon={Sparkles}
                    colorClass="text-pink-600"
                />
                <BreakdownCard 
                    label="Merchandising"
                    value={stats.merch}
                    totalForMix={stats.avgBudgetRev}
                    attendance={stats.attendance}
                    icon={ShoppingBag}
                    colorClass="text-orange-600"
                />
                <BreakdownCard 
                    label="Food & Beverage"
                    value={stats.fb}
                    totalForMix={stats.avgBudgetRev}
                    attendance={stats.attendance}
                    icon={Coffee}
                    colorClass="text-purple-600"
                />
            </div>
        </div>
    </div>
  );
};
