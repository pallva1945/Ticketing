import React, { useMemo } from 'react';
import { DollarSign, Users, Briefcase, Ticket, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { DashboardStats, GameData, SalesChannel, StatsCardsProps } from '../types';

// Helper to calculate raw KPIs for any set of games
const calculateKPIs = (games: GameData[]) => {
  if (games.length === 0) return null;

  const gameCount = games.length;
  const totalRevenue = games.reduce((acc, g) => acc + g.totalRevenue, 0);
  const totalAttendance = games.reduce((acc, g) => acc + g.attendance, 0);
  const totalCapacity = games.reduce((acc, g) => acc + g.capacity, 0);
  
  // Calculate Corporate Share specifically
  let totalCorpRev = 0;
  let totalSold = 0; // For Yield calculation
  
  games.forEach(g => {
    g.salesBreakdown.forEach(s => {
      // If we are filtering by zone in the main app, the 'games' passed here 
      // are already transformed to only contain that zone's breakdown.
      totalSold += s.quantity;
      if (s.channel === SalesChannel.CORP) {
        totalCorpRev += s.revenue;
      }
    });
  });

  const arpg = totalRevenue / gameCount;
  const yield_atp = totalSold > 0 ? totalRevenue / totalSold : 0;
  // RevPAS (Rev / Total Capacity Available)
  const revPas = totalCapacity > 0 ? totalRevenue / totalCapacity : 0;
  const corpShare = totalRevenue > 0 ? (totalCorpRev / totalRevenue) * 100 : 0;
  const occupancy = totalCapacity > 0 ? (totalAttendance / totalCapacity) * 100 : 0;

  return { arpg, yield_atp, revPas, corpShare, occupancy };
};

const MetricCard = ({ 
  label, 
  value, 
  subValue, 
  icon: Icon, 
  colorClass, 
  prevValue, 
  isPercentage = false,
  inverse = false // If true, lower is better (not used for these revenue metrics usually)
}: any) => {
  
  // Calculate Variance
  let variance = 0;
  let hasHistory = prevValue !== null && prevValue !== undefined && prevValue !== 0;
  
  if (hasHistory) {
    variance = ((value - prevValue) / prevValue) * 100;
  }

  // Determine Color
  let trendColor = 'text-gray-400';
  let TrendIcon = Minus;
  
  if (hasHistory && Math.abs(variance) > 0.5) { // 0.5% threshold for neutrality
    if (variance > 0) {
      trendColor = inverse ? 'text-red-600' : 'text-green-600';
      TrendIcon = TrendingUp;
    } else {
      trendColor = inverse ? 'text-green-600' : 'text-red-600';
      TrendIcon = TrendingDown;
    }
  }

  return (
    <div className={`bg-white p-5 rounded-xl shadow-sm border-l-4 ${colorClass}`}>
      <div className="flex justify-between items-start mb-2">
        <div>
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{label}</p>
          <p className="text-xl font-bold text-gray-900 mt-1">
            {isPercentage ? `${value.toFixed(1)}%` : (value >= 1000 ? `€${(value / 1000).toFixed(1)}k` : `€${value.toFixed(2)}`)}
          </p>
        </div>
        <div className={`p-2 rounded-full ${colorClass.replace('border-', 'bg-').replace('600', '50').replace('800', '100')} ${colorClass.replace('border-', 'text-')}`}>
          <Icon size={18} />
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        {hasHistory ? (
          <div className={`flex items-center text-xs font-semibold ${trendColor}`}>
            <TrendIcon size={12} className="mr-1" />
            {Math.abs(variance).toFixed(1)}%
          </div>
        ) : (
          <span className="text-xs text-gray-300">-</span>
        )}
        <p className="text-[10px] text-gray-400 truncate">
          {hasHistory ? 'vs baseline' : subValue}
        </p>
      </div>
    </div>
  );
};

export const StatsCards: React.FC<StatsCardsProps> = ({ stats, data, fullDataset, filters }) => {
  
  // 1. Calculate Current KPIs (based on the filtered `data` passed in)
  const currentKPIs = useMemo(() => calculateKPIs(data), [data]);

  // 2. Calculate Comparison KPIs
  const prevKPIs = useMemo(() => {
    // Only support direct previous season comparison if exactly one season is selected
    const isSingleSeason = filters.season.length === 1 && filters.season[0] !== 'All';
    
    if (!isSingleSeason) return null;

    const currentSeason = filters.season[0];
    const allSeasons = Array.from(new Set(fullDataset.map(d => d.season))).sort().reverse();
    const currentIndex = allSeasons.indexOf(currentSeason);
    
    // If not found or it's the last one (oldest), no history
    if (currentIndex === -1 || currentIndex === allSeasons.length - 1) return null;

    const prevSeason = allSeasons[currentIndex + 1];

    // Filter full dataset for the Baseline Group (Previous Season + Same League/Opponent/Zone Filters)
    let baselineGames = fullDataset.filter(d => 
      d.season === prevSeason && 
      (filters.league.includes('All') || filters.league.includes(d.league)) &&
      (filters.opponent.includes('All') || filters.opponent.includes(d.opponent)) &&
      (filters.tier.includes('All') || filters.tier.includes(String(d.tier)))
    );

    // Apply Zone Transformation if needed
    if (!filters.zone.includes('All')) {
      baselineGames = baselineGames.map(game => {
        const zoneSales = game.salesBreakdown.filter(s => filters.zone.includes(s.zone));
        const zoneRev = zoneSales.reduce((acc, curr) => acc + curr.revenue, 0);
        const zoneAtt = zoneSales.reduce((acc, curr) => acc + curr.quantity, 0);
        
        // Calculate partial capacity for the selected zones
        let partialCapacity = 0;
        if (game.zoneCapacities) {
             filters.zone.forEach(z => {
                 partialCapacity += (game.zoneCapacities[z] || 0);
             });
        }

        return {
          ...game,
          attendance: zoneAtt,
          totalRevenue: zoneRev,
          capacity: partialCapacity, // Update capacity for correct occupancy calc
          salesBreakdown: zoneSales
        };
      });
    }

    return calculateKPIs(baselineGames);

  }, [fullDataset, filters]);


  if (!currentKPIs) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
      <MetricCard 
        label="Avg Rev/Game" 
        value={currentKPIs.arpg} 
        prevValue={prevKPIs?.arpg}
        subValue="Total Average"
        icon={DollarSign} 
        colorClass="border-red-600" 
      />
      <MetricCard 
        label="Yield (ATP)" 
        value={currentKPIs.yield_atp} 
        prevValue={prevKPIs?.yield_atp}
        subValue="Per sold seat"
        icon={Ticket} 
        colorClass="border-gray-800" 
      />
      <MetricCard 
        label="RevPAS" 
        value={currentKPIs.revPas} 
        prevValue={prevKPIs?.revPas}
        subValue="Rev/Avail Seat"
        icon={TrendingUp} 
        colorClass="border-purple-600" 
      />
      <MetricCard 
        label="B2B Share" 
        value={currentKPIs.corpShare} 
        prevValue={prevKPIs?.corpShare}
        subValue="Corp %"
        icon={Briefcase} 
        colorClass="border-blue-600" 
        isPercentage={true}
      />
      <MetricCard 
        label="Load Factor" 
        value={currentKPIs.occupancy} 
        prevValue={prevKPIs?.occupancy}
        subValue="Occupancy"
        icon={Users} 
        colorClass="border-gray-600" 
        isPercentage={true}
      />
    </div>
  );
};