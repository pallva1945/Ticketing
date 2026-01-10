import React, { useMemo } from 'react';
import { DollarSign, Users, Ticket, TrendingUp, TrendingDown, Minus, Gift } from 'lucide-react';
import { GameData, SalesChannel, StatsCardsProps } from '../types';
import { FIXED_CAPACITY_25_26 } from '../constants';

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
      if (s.channel === SalesChannel.GIVEAWAY || s.channel === SalesChannel.PROTOCOL) {
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
  inverse = false, // If true, lower is better (e.g., Giveaway Rate)
  comparisonLabel = "vs KPIs"
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
          {hasTarget ? comparisonLabel : subValue}
        </p>
      </div>
    </div>
  );
};

export const StatsCards: React.FC<StatsCardsProps> = ({ data, fullDataset, filters, kpiConfig, viewMode }) => {
  
  // 1. Calculate Current KPIs (based on the filtered `data` passed in)
  const currentKPIs = useMemo(() => calculateKPIs(data), [data]);
  
  // Calculate Total View attendance (ignores gameday filter) for attendance card
  const totalViewAttendance = useMemo(() => {
    // Get current season games with all channels (not gameday filtered)
    const currentSeasonGames = fullDataset.filter(d => 
      (filters.season.includes('All') || filters.season.includes(d.season)) &&
      (filters.league.includes('All') || filters.league.includes(d.league)) &&
      (filters.opponent.includes('All') || filters.opponent.includes(d.opponent)) &&
      (filters.tier.includes('All') || filters.tier.includes(String(d.tier)))
    );
    
    if (currentSeasonGames.length === 0) return { avgAttendance: 0, gameCount: 0 };
    
    const totalAtt = currentSeasonGames.reduce((acc, g) => acc + g.attendance, 0);
    return {
      avgAttendance: totalAtt / currentSeasonGames.length,
      gameCount: currentSeasonGames.length
    };
  }, [fullDataset, filters]);

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

    // --- CRITICAL FIX: APPLY GAME DAY FILTERING TO BASELINE ---
    baselineGames = baselineGames.map(game => {
        let zoneSales = game.salesBreakdown;

        // Apply Zone Filter first
        if (!filters.zone.includes('All')) {
            zoneSales = zoneSales.filter(s => filters.zone.includes(s.zone));
        }

        // Apply Game Day Logic if needed
        if (viewMode === 'gameday') {
            zoneSales = zoneSales.filter(s => 
                [SalesChannel.TIX, SalesChannel.MP, SalesChannel.VB, SalesChannel.GIVEAWAY].includes(s.channel)
            );
        }

        const zoneRev = zoneSales.reduce((acc, curr) => acc + curr.revenue, 0);
        const zoneAtt = zoneSales.reduce((acc, curr) => acc + curr.quantity, 0);
        
        let partialCapacity = 0;
        if (game.zoneCapacities) {
             Object.entries(game.zoneCapacities).forEach(([z, cap]) => {
                 if (filters.zone.includes('All') || filters.zone.includes(z)) {
                     let effectiveCap = cap as number;
                     // Deduct fixed capacity if in Game Day Mode
                     if (viewMode === 'gameday') {
                         const fixedDeduction = FIXED_CAPACITY_25_26[z] || 0;
                         effectiveCap = Math.max(0, effectiveCap - fixedDeduction);
                     }
                     partialCapacity += effectiveCap;
                 }
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

    const baselineKPIs = calculateKPIs(baselineGames);
    if (!baselineKPIs) return null;

    // Calculate Targets by applying specific growth factors to baseline
    const growthArpg = 1 + (kpiConfig.arpgGrowth / 100);
    const growthYield = 1 + (kpiConfig.yieldGrowth / 100);
    const growthRevPas = 1 + (kpiConfig.revPasGrowth / 100);
    const growthOcc = 1 + (kpiConfig.occupancyGrowth / 100);

    // Calculate total view baseline for attendance (without gameday filter)
    const totalViewBaselineGames = fullDataset.filter(d => 
      baselineSeasons.includes(d.season) && 
      (filters.league.includes('All') || filters.league.includes(d.league)) &&
      (filters.opponent.includes('All') || filters.opponent.includes(d.opponent)) &&
      (filters.tier.includes('All') || filters.tier.includes(String(d.tier)))
    );
    const totalViewBaselineAtt = totalViewBaselineGames.reduce((acc, g) => acc + g.attendance, 0);
    const totalViewBaselineAvgAtt = totalViewBaselineGames.length > 0 ? totalViewBaselineAtt / totalViewBaselineGames.length : 0;

    return {
        // Apply specific growth factors
        arpg: baselineKPIs.arpg * growthArpg,
        yield_atp: baselineKPIs.yield_atp * growthYield,
        revPas: baselineKPIs.revPas * growthRevPas,
        
        // Attendance logic
        occupancy: Math.min(baselineKPIs.occupancy * growthOcc, 100), 

        // Special Rules
        giveawayRate: kpiConfig.giveawayTarget, // Fixed target remains
        
        // Avg Attendance from baseline (total view, not gameday filtered)
        avgAttendance: totalViewBaselineAvgAtt,
    };

  }, [fullDataset, filters, kpiConfig, viewMode]);


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
        comparisonLabel="vs Max Target"
      />
      <div className="bg-white p-5 rounded-xl shadow-sm border-l-4 border-blue-600">
        <div className="flex justify-between items-start mb-2">
          <div>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Avg Attendance</p>
            <p className="text-xl font-bold text-gray-900 mt-1">
              {totalViewAttendance.avgAttendance.toLocaleString('it-IT', { maximumFractionDigits: 0 })}
            </p>
          </div>
          <div className="p-2 rounded-full bg-blue-50 text-blue-600">
            <Users size={18} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          {targetKPIs && targetKPIs.avgAttendance ? (
            <>
              <div className={`flex items-center text-xs font-semibold ${
                totalViewAttendance.avgAttendance >= targetKPIs.avgAttendance ? 'text-green-600' : 'text-red-600'
              }`}>
                {totalViewAttendance.avgAttendance >= targetKPIs.avgAttendance ? <TrendingUp size={12} className="mr-1" /> : <TrendingDown size={12} className="mr-1" />}
                {Math.abs(((totalViewAttendance.avgAttendance - targetKPIs.avgAttendance) / targetKPIs.avgAttendance) * 100).toFixed(1)}%
              </div>
              <span className="text-[10px] text-gray-400">vs prev season</span>
            </>
          ) : (
            <span className="text-xs text-gray-400">per game</span>
          )}
        </div>
      </div>
    </div>
  );
};