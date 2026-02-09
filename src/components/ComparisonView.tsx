import React, { useState, useMemo } from 'react';
import { GameData, TicketZone, SalesChannel } from '../types';
import { MultiSelect } from './MultiSelect';
import { calculateKPIs } from './StatsCards';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ArrowLeftRight, TrendingUp, TrendingDown, Minus, AlertCircle, UserX } from 'lucide-react';
import { FIXED_CAPACITY_25_26 } from '../constants';

interface ComparisonViewProps {
  fullData: GameData[];
  options: {
    seasons: string[];
    leagues: string[];
    opponents: string[];
    tiers: string[];
    zones: string[];
  };
  viewMode: 'total' | 'gameday';
}

interface FilterState {
    seasons: string[];
    leagues: string[];
    opponents: string[];
    tiers: string[];
    zones: string[];
    times: string[];
    dates: string[];
    ignoreOspiti: boolean;
}

const INITIAL_FILTERS: FilterState = {
    seasons: ['All'],
    leagues: ['LBA'],
    opponents: ['All'],
    tiers: ['All'],
    zones: ['All'],
    times: ['All'],
    dates: ['All'],
    ignoreOspiti: false,
};

const getFilteredData = (allGames: GameData[], filters: FilterState, viewMode: 'total' | 'gameday') => {
    const filteredGames = allGames.filter(d => {
      const matchSeason = filters.seasons.includes('All') || filters.seasons.includes(d.season);
      const matchLeague = filters.leagues.includes('All') || filters.leagues.includes(d.league);
      const matchOpponent = filters.opponents.includes('All') || filters.opponents.includes(d.opponent);
      const matchTier = filters.tiers.includes('All') || filters.tiers.includes(String(d.tier));
      
      const matchDate = filters.dates.includes('All') || filters.dates.includes(d.date);
      
      const timePart = d.id.split('-')[3]; 
      const formattedTime = timePart ? `${timePart.slice(0,2)}.${timePart.slice(2)}` : '00.00';
      const matchTimeDerived = filters.times.includes('All') || filters.times.includes(formattedTime);

      return matchSeason && matchLeague && matchOpponent && matchTier && matchDate && matchTimeDerived;
    });

    return filteredGames.map(game => {
      let zoneSales = game.salesBreakdown;

      if (filters.ignoreOspiti) {
          zoneSales = zoneSales.filter(s => s.zone !== TicketZone.OSPITI);
      }

      if (!filters.zones.includes('All')) {
          zoneSales = zoneSales.filter(s => filters.zones.includes(s.zone));
      }

      if (viewMode === 'gameday') {
          zoneSales = zoneSales.filter(s => 
              [SalesChannel.TIX, SalesChannel.MP, SalesChannel.VB, SalesChannel.GIVEAWAY].includes(s.channel)
          );
      }

      const zoneRevenue = zoneSales.reduce((acc, curr) => acc + curr.revenue, 0);
      const zoneAttendance = zoneSales.reduce((acc, curr) => acc + curr.quantity, 0);
      
      let zoneCapacity = 0;
      const filteredZoneCapacities = { ...game.zoneCapacities };
      
      if (filters.ignoreOspiti) {
          delete filteredZoneCapacities[TicketZone.OSPITI];
      }

      if (viewMode === 'gameday') {
          Object.keys(filteredZoneCapacities).forEach(z => {
              const fixedDeduction = FIXED_CAPACITY_25_26[z] || 0;
              filteredZoneCapacities[z] = Math.max(0, filteredZoneCapacities[z] - fixedDeduction);
          });
      }

      if (game.zoneCapacities) {
        Object.entries(filteredZoneCapacities).forEach(([z, cap]) => {
             if (filters.zones.includes('All') || filters.zones.includes(z)) {
                 zoneCapacity += (cap as number);
             }
        });
      }

      return {
        ...game,
        attendance: zoneAttendance,
        totalRevenue: zoneRevenue,
        capacity: zoneCapacity,
        salesBreakdown: zoneSales,
        zoneCapacities: filteredZoneCapacities
      };
    });
};

const getAvailableOptions = (allGames: GameData[], currentFilters: FilterState, targetField: keyof FilterState): string[] => {
    
    const relevantData = allGames.filter(d => {
        const timePart = d.id.split('-')[3]; 
        const formattedTime = timePart ? `${timePart.slice(0,2)}.${timePart.slice(2)}` : '00.00';

        if (targetField !== 'seasons' && !currentFilters.seasons.includes('All') && !currentFilters.seasons.includes(d.season)) return false;
        if (targetField !== 'leagues' && !currentFilters.leagues.includes('All') && !currentFilters.leagues.includes(d.league)) return false;
        if (targetField !== 'opponents' && !currentFilters.opponents.includes('All') && !currentFilters.opponents.includes(d.opponent)) return false;
        if (targetField !== 'tiers' && !currentFilters.tiers.includes('All') && !currentFilters.tiers.includes(String(d.tier))) return false;
        
        if (targetField !== 'dates' && !currentFilters.dates.includes('All') && !currentFilters.dates.includes(d.date)) return false;
        if (targetField !== 'times' && !currentFilters.times.includes('All') && !currentFilters.times.includes(formattedTime)) return false;

        return true;
    });

    const uniqueValues = new Set<string>();
    relevantData.forEach(d => {
        if (targetField === 'seasons') uniqueValues.add(d.season);
        if (targetField === 'leagues') uniqueValues.add(d.league);
        if (targetField === 'opponents') uniqueValues.add(d.opponent);
        if (targetField === 'tiers') uniqueValues.add(String(d.tier));
        if (targetField === 'dates') uniqueValues.add(d.date);
        if (targetField === 'times') {
             const timePart = d.id.split('-')[3]; 
             const formattedTime = timePart ? `${timePart.slice(0,2)}.${timePart.slice(2)}` : '00.00';
             uniqueValues.add(formattedTime);
        }
        if (targetField === 'zones') {
             d.salesBreakdown.forEach(s => uniqueValues.add(s.zone));
        }
    });

    if (targetField === 'tiers') {
        return Array.from(uniqueValues).sort((a, b) => Number(a) - Number(b));
    }
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
    
    let isPositive = diff > 0; 
    if (inverse) isPositive = diff < 0;

    const isNeutral = Math.abs(diff) < 0.1;

    const format = (v: number) => {
        if (isCurrency) return `€${v >= 1000 ? (v/1000).toFixed(1) + 'k' : v.toFixed(0)}`;
        if (isPercent) return `${v.toFixed(1)}%`;
        if (inverse) return `#${v.toFixed(1)}`;
        return v.toLocaleString(undefined, { maximumFractionDigits: 1 });
    };

    return (
        <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center justify-between">
            <div className="flex-1">
                <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider mb-1">{label}</p>
                <div className="flex items-baseline gap-3">
                   <div className="text-right">
                       <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">A: {format(valA)}</p>
                   </div>
                   <div className="h-4 w-px bg-gray-200 dark:bg-gray-700"></div>
                   <div className="text-left">
                       <p className="text-lg font-bold text-gray-900 dark:text-white">B: {format(valB)}</p>
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

export const ComparisonView: React.FC<ComparisonViewProps> = ({ fullData, options, viewMode }) => {
  const [filtersA, setFiltersA] = useState<FilterState>({
     ...INITIAL_FILTERS,
     seasons: [options.seasons.length > 1 ? options.seasons[1] : options.seasons[0]], 
  });

  const [filtersB, setFiltersB] = useState<FilterState>({
     ...INITIAL_FILTERS,
     seasons: [options.seasons[0]],
  });

  const dataA = useMemo(() => getFilteredData(fullData, filtersA, viewMode), [fullData, filtersA, viewMode]);
  const dataB = useMemo(() => getFilteredData(fullData, filtersB, viewMode), [fullData, filtersB, viewMode]);

  const statsA = calculateKPIs(dataA);
  const statsB = calculateKPIs(dataB);
  
  const chartData = [
      { name: 'Total Revenue', A: statsA?.totalRevenue || 0, B: statsB?.totalRevenue || 0 },
  ];

  const updateFilter = (set: 'A'|'B', field: keyof FilterState, value: any) => {
      const setter = set === 'A' ? setFiltersA : setFiltersB;
      setter(prev => ({ ...prev, [field]: value }));
  };

  const FilterColumn = ({ label, filters, setFilter }: { label: string, filters: FilterState, setFilter: (f: keyof FilterState, v: any) => void }) => {
      const availSeasons = useMemo(() => getAvailableOptions(fullData, filters, 'seasons'), [filters]);
      const availLeagues = useMemo(() => getAvailableOptions(fullData, filters, 'leagues'), [filters]);
      const availOpponents = useMemo(() => getAvailableOptions(fullData, filters, 'opponents'), [filters]);
      const availTiers = useMemo(() => getAvailableOptions(fullData, filters, 'tiers'), [filters]);
      const availZones = useMemo(() => getAvailableOptions(fullData, filters, 'zones'), [filters]);
      const availDates = useMemo(() => getAvailableOptions(fullData, filters, 'dates'), [filters]);
      const availTimes = useMemo(() => getAvailableOptions(fullData, filters, 'times'), [filters]);

      return (
      <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col h-[calc(100vh-200px)] sticky top-6">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
             <span className={`w-3 h-3 rounded-full ${label === 'A' ? 'bg-gray-400' : 'bg-red-600'}`}></span>
             <h3 className="font-bold text-gray-800 dark:text-white">Scenario {label}</h3>
             <span className="text-xs text-gray-400 dark:text-gray-500 ml-auto">
                 {label === 'A' ? 'Baseline' : 'Comparison'}
             </span>
          </div>
          
          <div className="overflow-y-auto space-y-4 flex-1 pr-2 custom-scrollbar">
            <button 
                onClick={() => setFilter('ignoreOspiti', !filters.ignoreOspiti)}
                className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-colors border ${
                    filters.ignoreOspiti 
                    ? 'bg-red-50 dark:bg-red-900/30 text-red-700 border-red-200' 
                    : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
            >
                <UserX size={14} />
                {filters.ignoreOspiti ? 'Zona Ospiti Excluded' : 'Ignore Zona Ospiti'}
            </button>

            <MultiSelect label="Season" options={availSeasons} selected={filters.seasons} onChange={(v) => setFilter('seasons', v)} />
            <MultiSelect label="League" options={availLeagues} selected={filters.leagues} onChange={(v) => setFilter('leagues', v)} />
            <MultiSelect label="Opponent" options={availOpponents} selected={filters.opponents} onChange={(v) => setFilter('opponents', v)} />
            <MultiSelect label="Tier" options={availTiers} selected={filters.tiers} onChange={(v) => setFilter('tiers', v)} />
            
            <div className="border-t border-gray-100 dark:border-gray-800 my-2"></div>
            
            <MultiSelect label="Date" options={availDates} selected={filters.dates} onChange={(v) => setFilter('dates', v)} />
            <MultiSelect label="Time" options={availTimes} selected={filters.times} onChange={(v) => setFilter('times', v)} />
            
            <div className="border-t border-gray-100 dark:border-gray-800 my-2"></div>

            <MultiSelect label="Zone" options={availZones} selected={filters.zones} onChange={(v) => setFilter('zones', v)} />
          </div>

          <div className="pt-4 text-xs text-center text-gray-400 dark:text-gray-500 border-t border-gray-100 dark:border-gray-800 mt-2 flex-shrink-0">
             {label === 'A' ? dataA.length : dataB.length} Games matched
          </div>
      </div>
      );
  };

  return (
    <div className="animate-fade-in max-w-7xl mx-auto space-y-6">
       <div className="flex items-center gap-3 mb-6">
           <div className="p-3 bg-red-50 dark:bg-red-900/30 rounded-lg text-red-700">
               <ArrowLeftRight size={24} />
           </div>
           <div>
               <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Comparative Analysis</h1>
               <p className="text-gray-500 dark:text-gray-400 text-sm">
                   {viewMode === 'gameday' 
                    ? 'Analyzing GameDay revenue only (Variable)' 
                    : 'Analyze performance variance between two distinct datasets.'}
               </p>
           </div>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
           <div className="lg:col-span-1">
               <FilterColumn label="A" filters={filtersA} setFilter={(f: keyof FilterState, v: any) => updateFilter('A', f, v)} />
           </div>

           <div className="lg:col-span-2 space-y-6">
               {(!statsA || !statsB) ? (
                   <div className="flex flex-col items-center justify-center h-full bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-10 text-center">
                       <AlertCircle className="text-gray-300 dark:text-gray-600 mb-4" size={48} />
                       <p className="text-gray-500 dark:text-gray-400">Select filters to begin comparison.</p>
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
                     </div>
                     
                     <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                         <h4 className="font-bold text-gray-800 dark:text-white mb-4">Revenue Comparison (Total)</h4>
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

           <div className="lg:col-span-1">
               <FilterColumn label="B" filters={filtersB} setFilter={(f: keyof FilterState, v: any) => updateFilter('B', f, v)} />
           </div>
       </div>
    </div>
  );
};