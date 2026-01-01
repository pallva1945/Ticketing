import React, { useMemo } from 'react';
import { DollarSign, Users, Briefcase, Ticket, TrendingUp, TrendingDown, Minus, Gift } from 'lucide-react';
import { DashboardStats, GameData, SalesChannel, StatsCardsProps } from '../types';

// Helper to calculate raw KPIs for any set of games
export const calculateKPIs = (games: GameData[]) => {
  if (games.length === 0) return null;

  const gameCount = games.length;
  const totalRevenue = games.reduce((acc, g) => acc + g.totalRevenue, 0);
  const totalAttendance = games.reduce((acc, g) => acc + g.attendance, 0);
  const totalCapacity = games.reduce((acc, g) => acc + g.capacity, 0);
  
  // Calculate Corporate Share specifically
  let totalCorpRev = 0;
  let totalSold = 0; // For Yield calculation
  let totalGiveaways = 0; // For Giveaway Rate
  
  games.forEach(g => {
    g.salesBreakdown.forEach(s => {
      // If we are filtering by zone in the main app, the 'games' passed here 
      // are already transformed to only contain that zone's breakdown.
      totalSold += s.quantity;
      if (s.channel === SalesChannel.CORP) {
        totalCorpRev += s.revenue;
      }
      if (s.channel === SalesChannel.GIVEAWAY) {
        totalGiveaways += s.quantity;
      }
    });
  });

  const arpg = totalRevenue / gameCount;
  const yield_atp = totalSold > 0 ? totalRevenue / totalSold : 0;
  // RevPAS (Rev / Total Capacity Available)
  const revPas = totalCapacity > 0 ? totalRevenue / totalCapacity : 0;
  const corpShare = totalRevenue > 0 ? (totalCorpRev / totalRevenue) * 100 : 0;
  const occupancy = totalCapacity > 0 ? (totalAttendance / totalCapacity) * 100 : 0;
  const giveawayRate = totalAttendance > 0 ? (totalGiveaways / totalAttendance) * 100 : 0;

  return { 
      arpg, 
      yield_atp, 
      revPas, 
      corpShare, 
      occupancy,
      giveawayRate,
      totalRevenue,     // Added
      totalAttendance,  // Added
      gameCount         // Added
  };
};

const MetricCard = ({ 
  label, 
  value, 
  subValue, 
  icon: Icon, 
  colorClass, 
  targetValue, // Renamed from prevValue
  isPercentage = false,
  inverse = false // If true, lower is better (e.g., Giveaway Rate)
}: any) => {
  
  // Calculate Variance vs Target
  let variance = 0;
  let hasTarget = targetValue !== null && targetValue !== undefined && targetValue !== 0;
  
  if (hasTarget) {
    variance = ((value - targetValue) / targetValue) * 100;
  }

  // Determine Color
  let trendColor = 'text-gray-400';
  let TrendIcon = Minus;
  
  if (hasTarget) { 
    const isGood = inverse ? variance < 0 : variance > 0;
    
    if (Math.abs(variance) > 0.1) { // 0.1% threshold
        if (isGood) {
            trendColor = 'text-green-600';
            TrendIcon = TrendingUp; // Or TrendingDown if inverse, but standard icon implies direction
            if (inverse) TrendIcon = TrendingDown; 
        } else {
            trendColor = 'text-red-600';
            TrendIcon = TrendingDown;
            if (inverse) TrendIcon = TrendingUp;
        }
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
        <div className={`p-2 rounded-full ${colorClass.replace('border-', 'bg-').replace('600', '50').replace('800', '100').replace('500', '50')} ${colorClass.replace('border-', 'text-')}`}>
          <Icon size={18} />
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        {hasTarget ? (
          <div className={`flex items-center text-xs font-semibold ${trendColor}`}>
            <TrendIcon size={12} className="mr-1" />
            {Math.abs(variance).toFixed(1)}%
          </div>
        ) : (
          <span className="text-xs text-gray-300">-</span>
        )}
        <p className="text-[10px] text-gray-400 truncate">
          {hasTarget ? 'vs KPIs' : subValue}
        </p>
      </div>
    </div>
  );
};

export const StatsCards: React.FC<StatsCardsProps> = ({ stats, data, fullDataset, filters, kpiConfig }) => {
  
  // 1. Calculate Current KPIs (based on the filtered `data` passed in)
  const currentKPIs = useMemo(() => calculateKPIs(data), [data]);

  // 2. Calculate Comparison/Target KPIs based on KPI Config
  const targetKPIs = useMemo(() => {
    // Only support direct comparison if exactly one season is selected
    const isSingleSeason = filters.season.length === 1 && filters.season[0] !== 'All';
    
    if (!isSingleSeason) return null;

    const currentSeason = filters.season[0];
    const allSeasons = Array.from(new Set(fullDataset.map(d => d.season))).sort().reverse();
    const currentIndex = allSeasons.indexOf(currentSeason);
    
    // Baseline determination
    let baselineSeasons = [];
    if (kpiConfig.baselineMode === 'prev_season') {
       if (currentIndex !== -1 && currentIndex < allSeasons.length - 1) {
           baselineSeasons.push(allSeasons[currentIndex + 1]);
       }
    } else {
        // TODO: Implement multi-season avg if needed
        if (currentIndex !== -1 && currentIndex < allSeasons.length - 1) {
           baselineSeasons.push(allSeasons[currentIndex + 1]);
       }
    }

    if (baselineSeasons.length === 0) return null;

    // Fetch Baseline Data
    let baselineGames = fullDataset.filter(d => 
      baselineSeasons.includes(d.season) && 
      (filters.league.includes('All') || filters.league.includes(d.league)) &&
      (filters.opponent.includes('All') || filters.opponent.includes(d.opponent)) &&
      (filters.tier.includes('All') || filters.tier.includes(String(d.tier)))
    );

    // Apply Zone Transformation if needed to Baseline Data
    if (!filters.zone.includes('All')) {
      baselineGames = baselineGames.map(game => {
        const zoneSales = game.salesBreakdown.filter(s => filters.zone.includes(s.zone));
        const zoneRev = zoneSales.reduce((acc, curr) => acc + curr.revenue, 0);
        const zoneAtt = zoneSales.reduce((acc, curr) => acc + curr.quantity, 0);
        
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
          capacity: partialCapacity,
          salesBreakdown: zoneSales
        };
      });
    }

    const baselineKPIs = calculateKPIs(baselineGames);
    if (!baselineKPIs) return null;

    // Apply Growth Targets
    // Target Rev = Baseline Rev * (1 + Growth%)
    const growthRev = 1 + (kpiConfig.revenueGrowth / 100);
    const growthAtt = 1 + (kpiConfig.attendanceGrowth / 100);

    return {
        // Revenue derived metrics affected by Rev Growth
        totalRevenue: baselineKPIs.totalRevenue * growthRev,
        arpg: baselineKPIs.arpg * growthRev,
        yield_atp: baselineKPIs.yield_atp * growthRev, 
        revPas: baselineKPIs.revPas * growthRev,
        
        // Attendance derived metrics affected by Att Growth
        totalAttendance: baselineKPIs.totalAttendance * growthAtt,
        occupancy: Math.min(baselineKPIs.occupancy * growthAtt, 100), // Cap at 100%

        // Special Rules
        corpShare: baselineKPIs.corpShare, // Target is simply to match last season
        giveawayRate: kpiConfig.giveawayTarget, // Fixed target
    };

  }, [fullDataset, filters, kpiConfig]);


  if (!currentKPIs) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
      <MetricCard 
        label="Avg Rev/Game" 
        value={currentKPIs.arpg} 
        targetValue={targetKPIs?.arpg}
        subValue="Total Average"
        icon={DollarSign} 
        colorClass="border-red-600" 
      />
      <MetricCard 
        label="Yield (ATP)" 
        value={currentKPIs.yield_atp} 
        targetValue={targetKPIs?.yield_atp}
        subValue="Per sold seat"
        icon={Ticket} 
        colorClass="border-gray-800" 
      />
      <MetricCard 
        label="RevPAS" 
        value={currentKPIs.revPas} 
        targetValue={targetKPIs?.revPas}
        subValue="Rev/Avail Seat"
        icon={TrendingUp} 
        colorClass="border-purple-600" 
      />
      <MetricCard 
        label="B2B Share" 
        value={currentKPIs.corpShare} 
        targetValue={targetKPIs?.corpShare}
        subValue="Corp %"
        icon={Briefcase} 
        colorClass="border-blue-600" 
        isPercentage={true}
      />
      <MetricCard 
        label="Load Factor" 
        value={currentKPIs.occupancy} 
        targetValue={targetKPIs?.occupancy}
        subValue="Occupancy"
        icon={Users} 
        colorClass="border-gray-600" 
        isPercentage={true}
      />
      <MetricCard 
        label="Giveaway %" 
        value={currentKPIs.giveawayRate} 
        targetValue={targetKPIs?.giveawayRate}
        subValue="Tickets %"
        icon={Gift} 
        colorClass="border-orange-500" 
        isPercentage={true}
        inverse={true}
      />
    </div>
  );
};