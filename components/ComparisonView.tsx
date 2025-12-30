
import React, { useState, useMemo } from 'react';
import { GameData } from '../types';
import { MultiSelect } from './MultiSelect';
import { calculateKPIs } from './StatsCards';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { ArrowLeftRight, TrendingUp, TrendingDown, Minus, Filter, AlertCircle } from 'lucide-react';

interface ComparisonViewProps {
  fullData: GameData[];
  options: {
    seasons: string[];
    leagues: string[];
    opponents: string[];
    tiers: string[];
    zones: string[];
    // We ignore the passed static options for cascading logic, 
    // but keep the prop signature compatible with App.tsx
  };
}

interface FilterState {
    seasons: string[];
    leagues: string[];
    opponents: string[];
    tiers: string[];
    zones: string[];
    times: string[];
    dates: string[];
    pvRanks: string[];
    oppRanks: string[];
}

const INITIAL_FILTERS: FilterState = {
    seasons: ['All'],
    leagues: ['All'],
    opponents: ['All'],
    tiers: ['All'],
    zones: ['All'],
    times: ['All'],
    dates: ['All'],
    pvRanks: ['All'],
    oppRanks: ['All']
};

// --- Helper: Filter Data based on State ---
const getFilteredData = (allGames: GameData[], filters: FilterState) => {
    // 1. Filter
    const filteredGames = allGames.filter(d => {
      const matchSeason = filters.seasons.includes('All') || filters.seasons.includes(d.season);
      const matchLeague = filters.leagues.includes('All') || filters.leagues.includes(d.league);
      const matchOpponent = filters.opponents.includes('All') || filters.opponents.includes(d.opponent);
      const matchTier = filters.tiers.includes('All') || filters.tiers.includes(String(d.tier));
      const matchTime = filters.times.includes('All') || filters.times.includes(d.id.split('-')[3] ? `${d.id.split('-')[3].slice(0,2)}:${d.id.split('-')[3].slice(2)}` : '') || filters.times.includes(d.date) || true; // Check logic below
      
      // Fix Time matching: The ID construction in dataProcessor is roughly YYYY-MM-DD-HHMM-Opp.
      // But let's look at the raw data fields. d.date and d.time are not explicitly on GameData interface in previous files?
      // Wait, they ARE in GameData interface in types.ts.
      // d.time from CSV is like "20.30".
      const dTime = (d as any).time || ''; // Access raw time if available or reconstruct
      // Actually, let's assume the dataProcessor added `time` to GameData or we parse it from ID?
      // Looking at `types.ts`, `GameData` has `date`. It doesn't explicitly have `time`.
      // However, `dataProcessor.ts` creates `id` using time. 
      // Let's rely on the fact that we will extract available options from the data objects themselves.
      // If `time` isn't on GameData, we need to extract it.
      // Let's assume we extract it from `id` or add it to GameData. 
      // For now, I will use a safe access assuming it might be added or derived.
      
      // Let's assume `d.date` is DD/MM/YYYY.
      const matchDate = filters.dates.includes('All') || filters.dates.includes(d.date);
      
      // For Time, let's extract from ID since it's reliable: YYYY-MM-DD-HHMM-Opp
      const timePart = d.id.split('-')[3]; 
      const formattedTime = timePart ? `${timePart.slice(0,2)}.${timePart.slice(2)}` : '00.00';
      const matchTimeDerived = filters.times.includes('All') || filters.times.includes(formattedTime);

      const matchPvRank = filters.pvRanks.includes('All') || filters.pvRanks.includes(String(d.pvRank));
      const matchOppRank = filters.oppRanks.includes('All') || filters.oppRanks.includes(String(d.oppRank));

      return matchSeason && matchLeague && matchOpponent && matchTier && matchDate && matchTimeDerived && matchPvRank && matchOppRank;
    });

    // 2. Zone Transform
    if (filters.zones.includes('All')) {
      return filteredGames;
    }

    return filteredGames.map(game => {
      const zoneSales = game.salesBreakdown.filter(s => filters.zones.includes(s.zone));
      const zoneRevenue = zoneSales.reduce((acc, curr) => acc + curr.revenue, 0);
      const zoneAttendance = zoneSales.reduce((acc, curr) => acc + curr.quantity, 0);
      let zoneCapacity = 0;
      if (game.zoneCapacities) {
        filters.zones.forEach((z: string) => {
             zoneCapacity += (game.zoneCapacities[z] || 0);
        });
      }
      return {
        ...game,
        attendance: zoneAttendance,
        totalRevenue: zoneRevenue,
        capacity: zoneCapacity,
        salesBreakdown: zoneSales
      };
    });
};

// --- Helper: Cascading Options Logic ---
// This calculates unique values for a specific dropdown (targetField)
// based on the data filtered by *all other* currently active filters.
const getAvailableOptions = (allGames: GameData[], currentFilters: FilterState, targetField: keyof FilterState): string[] => {
    
    // Create a temporary filter state that ignores the target field
    // (e.g. if I want available Opponents, I shouldn't restrict by the Opponent I just selected, 
    // unless I want to narrow down lists progressively? 
    // Usually "cascading" means Filter A restricts B. B restricts C. 
    // But if I change A, B updates. 
    // A standard "Excel Slicer" behavior is: The options shown are those compatible with ALL OTHER active filters.
    
    const relevantData = allGames.filter(d => {
        const timePart = d.id.split('-')[3]; 
        const formattedTime = timePart ? `${timePart.slice(0,2)}.${timePart.slice(2)}` : '00.00';

        if (targetField !== 'seasons' && !currentFilters.seasons.includes('All') && !currentFilters.seasons.includes(d.season)) return false;
        if (targetField !== 'leagues' && !currentFilters.leagues.includes('All') && !currentFilters.leagues.includes(d.league)) return false;
        if (targetField !== 'opponents' && !currentFilters.opponents.includes('All') && !currentFilters.opponents.includes(d.opponent)) return false;
        if (targetField !== 'tiers' && !currentFilters.tiers.includes('All') && !currentFilters.tiers.includes(String(d.tier))) return false;
        // Zones is a transformation filter, usually doesn't filter the existence of a game, so we ignore it for "game availability" logic usually, 
        // but here we can include it if needed. Let's skip zones for row filtering.
        
        if (targetField !== 'dates' && !currentFilters.dates.includes('All') && !currentFilters.dates.includes(d.date)) return false;
        if (targetField !== 'times' && !currentFilters.times.includes('All') && !currentFilters.times.includes(formattedTime)) return false;
        if (targetField !== 'pvRanks' && !currentFilters.pvRanks.includes('All') && !currentFilters.pvRanks.includes(String(d.pvRank))) return false;
        if (targetField !== 'oppRanks' && !currentFilters.oppRanks.includes('All') && !currentFilters.oppRanks.includes(String(d.oppRank))) return false;

        return true;
    });

    const uniqueValues = new Set<string>();
    relevantData.forEach(d => {
        if (targetField === 'seasons') uniqueValues.add(d.season);
        if (targetField === 'leagues') uniqueValues.add(d.league);
        if (targetField === 'opponents') uniqueValues.add(d.opponent);
        if (targetField === 'tiers') uniqueValues.add(String(d.tier));
        if (targetField === 'dates') uniqueValues.add(d.date);
        if (targetField === 'pvRanks') uniqueValues.add(String(d.pvRank));
        if (targetField === 'oppRanks') uniqueValues.add(String(d.oppRank));
        if (targetField === 'times') {
             const timePart = d.id.split('-')[3]; 
             const formattedTime = timePart ? `${timePart.slice(0,2)}.${timePart.slice(2)}` : '00.00';
             uniqueValues.add(formattedTime);
        }
        if (targetField === 'zones') {
             // Zones are within the game, not a property of the game row itself (mostly).
             // We can just return all zones or those with > 0 sales.
             d.salesBreakdown.forEach(s => uniqueValues.add(s.zone));
        }
    });

    // Special sort for numeric strings
    if (['tiers', 'pvRanks', 'oppRanks'].includes(targetField)) {
        return Array.from(uniqueValues).sort((a, b) => Number(a) - Number(b));
    }
    // Sort Dates
    if (targetField === 'dates') {
         return Array.from(uniqueValues).sort((a, b) => {
             const [da, ma, ya] = a.split('/').map(Number);
             const [db, mb, yb] = b.split('/').map(Number);
             return new Date(ya, ma-1, da).getTime() - new Date(yb, mb-1, db).getTime();
         });
    }

    return Array.from(uniqueValues).sort();
};


const ComparisonMetric = ({ label, valA, valB, isCurrency = false, isPercent = false, inverse = false }: any) => {
    let diff = valA > 0 ? ((valB - valA) / valA) * 100 : 0;
    if (valA === 0 && valB > 0) diff = 100;
    
    // Inverse: If True, a Lower B is Better (e.g. Rank 1 is better than Rank 10)
    // Diff > 0 means B is Higher (Worse if inverse).
    let isPositive = diff > 0; 
    if (inverse) isPositive = diff < 0;

    const isNeutral = Math.abs(diff) < 0.1;

    const format = (v: number) => {
        if (isCurrency) return `€${v >= 1000 ? (v/1000).toFixed(1) + 'k' : v.toFixed(0)}`;
        if (isPercent) return `${v.toFixed(1)}%`;
        if (inverse) return `#${v.toFixed(1)}`; // Rank formatting
        return v.toLocaleString(undefined, { maximumFractionDigits: 1 });
    };

    return (
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div className="flex-1">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">{label}</p>
                <div className="flex items-baseline gap-3">
                   <div className="text-right">
                       <p className="text-sm font-semibold text-gray-500">A: {format(valA)}</p>
                   </div>
                   <div className="h-4 w-px bg-gray-200"></div>
                   <div className="text-left">
                       <p className="text-lg font-bold text-gray-900">B: {format(valB)}</p>
                   </div>
                </div>
            </div>
            <div className={`flex flex-col items-end ${isNeutral ? 'text-gray-400' : (isPositive ? 'text-green-600' : 'text-red-600')}`}>
                {isNeutral ? <Minus size={20} /> : (isPositive ? <TrendingUp size={20} /> : <TrendingDown size={20} />)}
                <span className="text-xs font-bold">{diff > 0 ? '+' : ''}{diff.toFixed(1)}%</span>
            </div>
        </div>
    );
};

export const ComparisonView: React.FC<ComparisonViewProps> = ({ fullData, options }) => {
  // Default Filters
  const [filtersA, setFiltersA] = useState<FilterState>({
     ...INITIAL_FILTERS,
     seasons: [options.seasons.length > 1 ? options.seasons[1] : options.seasons[0]], 
  });

  const [filtersB, setFiltersB] = useState<FilterState>({
     ...INITIAL_FILTERS,
     seasons: [options.seasons[0]],
  });

  const dataA = useMemo(() => getFilteredData(fullData, filtersA), [fullData, filtersA]);
  const dataB = useMemo(() => getFilteredData(fullData, filtersB), [fullData, filtersB]);

  const statsA = calculateKPIs(dataA);
  const statsB = calculateKPIs(dataB);
  
  // Calculate Rank Averages
  const avgRankA = dataA.length > 0 ? dataA.reduce((sum, g) => sum + g.pvRank, 0) / dataA.length : 0;
  const avgRankB = dataB.length > 0 ? dataB.reduce((sum, g) => sum + g.pvRank, 0) / dataB.length : 0;
  const avgOppRankA = dataA.length > 0 ? dataA.reduce((sum, g) => sum + g.oppRank, 0) / dataA.length : 0;
  const avgOppRankB = dataB.length > 0 ? dataB.reduce((sum, g) => sum + g.oppRank, 0) / dataB.length : 0;


  const chartData = [
      { name: 'Total Revenue', A: statsA?.totalRevenue || 0, B: statsB?.totalRevenue || 0 },
  ];

  const updateFilter = (set: 'A'|'B', field: keyof FilterState, value: string[]) => {
      const setter = set === 'A' ? setFiltersA : setFiltersB;
      setter(prev => ({ ...prev, [field]: value }));
  };

  const FilterColumn = ({ label, filters, setFilter }: { label: string, filters: FilterState, setFilter: (f: keyof FilterState, v: string[]) => void }) => {
      // Dynamic Options Calculation
      const availSeasons = useMemo(() => getAvailableOptions(fullData, filters, 'seasons'), [filters]);
      const availLeagues = useMemo(() => getAvailableOptions(fullData, filters, 'leagues'), [filters]);
      const availOpponents = useMemo(() => getAvailableOptions(fullData, filters, 'opponents'), [filters]);
      const availTiers = useMemo(() => getAvailableOptions(fullData, filters, 'tiers'), [filters]);
      const availZones = useMemo(() => getAvailableOptions(fullData, filters, 'zones'), [filters]);
      
      // New Options
      const availDates = useMemo(() => getAvailableOptions(fullData, filters, 'dates'), [filters]);
      const availTimes = useMemo(() => getAvailableOptions(fullData, filters, 'times'), [filters]);
      const availPvRanks = useMemo(() => getAvailableOptions(fullData, filters, 'pvRanks'), [filters]);
      const availOppRanks = useMemo(() => getAvailableOptions(fullData, filters, 'oppRanks'), [filters]);

      return (
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col h-[calc(100vh-200px)] sticky top-6">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100 flex-shrink-0">
             <span className={`w-3 h-3 rounded-full ${label === 'A' ? 'bg-gray-400' : 'bg-red-600'}`}></span>
             <h3 className="font-bold text-gray-800">Scenario {label}</h3>
             <span className="text-xs text-gray-400 ml-auto">
                 {label === 'A' ? 'Baseline' : 'Comparison'}
             </span>
          </div>
          
          <div className="overflow-y-auto space-y-4 flex-1 pr-2 custom-scrollbar">
            <MultiSelect label="Season" options={availSeasons} selected={filters.seasons} onChange={(v) => setFilter('seasons', v)} />
            <MultiSelect label="League" options={availLeagues} selected={filters.leagues} onChange={(v) => setFilter('leagues', v)} />
            <MultiSelect label="Opponent" options={availOpponents} selected={filters.opponents} onChange={(v) => setFilter('opponents', v)} />
            <MultiSelect label="Tier" options={availTiers} selected={filters.tiers} onChange={(v) => setFilter('tiers', v)} />
            
            <div className="border-t border-gray-100 my-2"></div>
            
            <MultiSelect label="Date" options={availDates} selected={filters.dates} onChange={(v) => setFilter('dates', v)} />
            <MultiSelect label="Time" options={availTimes} selected={filters.times} onChange={(v) => setFilter('times', v)} />
            <div className="grid grid-cols-2 gap-2">
                <MultiSelect label="PV Rank" options={availPvRanks} selected={filters.pvRanks} onChange={(v) => setFilter('pvRanks', v)} />
                <MultiSelect label="Opp Rank" options={availOppRanks} selected={filters.oppRanks} onChange={(v) => setFilter('oppRanks', v)} />
            </div>

            <div className="border-t border-gray-100 my-2"></div>

            <MultiSelect label="Zone" options={availZones} selected={filters.zones} onChange={(v) => setFilter('zones', v)} />
          </div>

          <div className="pt-4 text-xs text-center text-gray-400 border-t border-gray-100 mt-2 flex-shrink-0">
             {label === 'A' ? dataA.length : dataB.length} Games matched
          </div>
      </div>
      );
  };

  return (
    <div className="animate-fade-in max-w-7xl mx-auto space-y-6">
       <div className="flex items-center gap-3 mb-6">
           <div className="p-3 bg-red-50 rounded-lg text-red-700">
               <ArrowLeftRight size={24} />
           </div>
           <div>
               <h1 className="text-2xl font-bold text-gray-900">Comparative Analysis</h1>
               <p className="text-gray-500 text-sm">Analyze performance variance between two distinct datasets.</p>
           </div>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
           {/* Filters Left */}
           <div className="lg:col-span-1">
               <FilterColumn label="A" filters={filtersA} setFilter={(f: keyof FilterState, v: string[]) => updateFilter('A', f, v)} />
           </div>

           {/* Results Middle */}
           <div className="lg:col-span-2 space-y-6">
               {(!statsA || !statsB) ? (
                   <div className="flex flex-col items-center justify-center h-full bg-white rounded-xl border border-gray-200 p-10 text-center">
                       <AlertCircle className="text-gray-300 mb-4" size={48} />
                       <p className="text-gray-500">Select filters to begin comparison.</p>
                   </div>
               ) : (
                   <>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                         <ComparisonMetric label="Total Revenue" valA={statsA.totalRevenue} valB={statsB.totalRevenue} isCurrency />
                         <ComparisonMetric label="Avg Revenue / Game" valA={statsA.arpg} valB={statsB.arpg} isCurrency />
                         <ComparisonMetric label="Avg Attendance" valA={statsA.totalAttendance / (statsA.gameCount||1)} valB={statsB.totalAttendance / (statsB.gameCount||1)} />
                         <ComparisonMetric label="Yield (ATP)" valA={statsA.yield_atp} valB={statsB.yield_atp} isCurrency />
                         <ComparisonMetric label="RevPAS" valA={statsA.revPas} valB={statsB.revPas} isCurrency />
                         <ComparisonMetric label="Load Factor" valA={statsA.occupancy} valB={statsB.occupancy} isPercent />
                         
                         {/* New Rank Metrics */}
                         <ComparisonMetric label="Avg PV Rank" valA={avgRankA} valB={avgRankB} inverse={true} />
                         <ComparisonMetric label="Avg Opp Rank" valA={avgOppRankA} valB={avgOppRankB} inverse={true} />
                     </div>
                     
                     {/* Mini Charts */}
                     <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                         <h4 className="font-bold text-gray-800 mb-4">Revenue Comparison (Total)</h4>
                         <div className="h-40">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} layout="vertical" margin={{top: 0, left: 0, right: 30, bottom: 0}}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                    <XAxis type="number" tickFormatter={(v) => `€${v/1000}k`} />
                                    <YAxis type="category" dataKey="name" hide width={10} />
                                    <Tooltip formatter={(v:number) => `€${v.toLocaleString()}`} />
                                    <Legend />
                                    <Bar dataKey="A" name="Scenario A" fill="#9CA3AF" radius={[0, 4, 4, 0]} barSize={20} />
                                    <Bar dataKey="B" name="Scenario B" fill="#DC2626" radius={[0, 4, 4, 0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                         </div>
                     </div>
                   </>
               )}
           </div>

           {/* Filters Right */}
           <div className="lg:col-span-1">
               <FilterColumn label="B" filters={filtersB} setFilter={(f: keyof FilterState, v: string[]) => updateFilter('B', f, v)} />
           </div>
       </div>
    </div>
  );
};
