import React, { useState, useMemo } from 'react';
import { GameData, TicketZone, SalesChannel } from '../types';
import { MultiSelect } from './MultiSelect';
import { ArrowLeftRight, UserX, Printer } from 'lucide-react';
import { getFixedCapacityForSeason } from '../constants';
import { useLanguage } from '../contexts/LanguageContext';
import { SeasonComparison, SeasonComparisonMode, SeasonComparisonSelection } from './SeasonComparison';
import { ComparisonPrintDialog } from './ComparisonPrintDialog';
import { ComparisonReport } from './comparisonReport';
import { ComparisonQuadrant } from './ComparisonQuadrant';
import { COMPARISON_METRICS, ComparisonMetricKey } from './comparisonMetrics';

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
       if (!filters.zones.includes('All')) {
           Object.keys(filteredZoneCapacities).forEach(z => {
               if (!filters.zones.includes(z)) delete filteredZoneCapacities[z];
           });
       }

      if (viewMode === 'gameday') {
          Object.keys(filteredZoneCapacities).forEach(z => {
              const fixedDeduction = getFixedCapacityForSeason(game.season, z);
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


export const ComparisonView: React.FC<ComparisonViewProps> = ({ fullData, options, viewMode }) => {
  const { t } = useLanguage();
  const [comparisonType, setComparisonType] = useState<SeasonComparisonMode | 'custom'>('opponent');
  const [seasonSelection, setSeasonSelection] = useState<SeasonComparisonSelection>({
    league: 'LBA', opponent: '', secondOpponent: '', firstTier: null, week: 1,
  });
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [metricSlots, setMetricSlots] = useState<ComparisonMetricKey[]>(() => {
    const all = COMPARISON_METRICS.map(metric => metric.key);
    const defaults = ['revenue', 'attendance', 'yield', 'loadFactor'];
    try {
      const stored = JSON.parse(window.localStorage.getItem('ticketing-comparison-metrics') || 'null');
      const valid = Array.isArray(stored)
        ? Array.from({ length: 4 }, (_, index) => all.includes(stored[index]) ? stored[index] : '')
        : [];
      return valid.some(Boolean) ? valid : defaults;
    } catch { return defaults; }
  });
  const selectedMetrics = metricSlots.filter(Boolean);
  const setMetricSlot = (index: number, key: ComparisonMetricKey) => {
    setMetricSlots(current => {
      const next = [...current];
      next[index] = key;
      if (!next.some(Boolean)) return current;
      try { window.localStorage.setItem('ticketing-comparison-metrics', JSON.stringify(next)); } catch { /* storage may be unavailable */ }
      return next;
    });
  };
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

  const updateFilter = (set: 'A'|'B', field: keyof FilterState, value: any) => {
      const setter = set === 'A' ? setFiltersA : setFiltersB;
      setter(prev => ({ ...prev, [field]: value }));
  };
  const describeFilters = (label: string, filters: FilterState) =>
    `${label}: ${filters.seasons.join(', ')} · ${filters.leagues.join(', ')} · ${filters.opponents.join(', ')}` +
    ` · zones ${filters.zones.join(', ')}${filters.ignoreOspiti ? ' (no guests)' : ''}` +
    ` · tiers ${filters.tiers.join(', ')} · dates ${filters.dates.join(', ')} · times ${filters.times.join(', ')}`;
  const customReport: ComparisonReport = {
    title: 'Custom ticketing comparison',
    subtitle: `${viewMode === 'total' ? 'Total' : 'GameDay'} view · A vs B\n${describeFilters('Scenario A', filtersA)}\n${describeFilters('Scenario B', filtersB)}`,
    groups: [{ label: 'Scenario A', games: dataA }, { label: 'Scenario B', games: dataB }],
    highlightLabels: ['Scenario B'], showTrend: false, perGame: false,
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
      <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col h-80">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
             <span className={`w-3 h-3 rounded-full ${label === 'A' ? 'bg-gray-400' : 'bg-red-600'}`}></span>
             <h3 className="font-bold text-gray-800 dark:text-white">{t('Scenario')} {label}</h3>
             <span className="text-xs text-gray-400 dark:text-gray-500 ml-auto">
                 {label === 'A' ? t('Baseline') : t('Comparison')}
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
                {filters.ignoreOspiti ? t('Zona Ospiti Excluded') : t('Ignore Zona Ospiti')}
            </button>

            <MultiSelect label={t("Season")} options={availSeasons} selected={filters.seasons} onChange={(v) => setFilter('seasons', v)} />
            <MultiSelect label={t("League")} options={availLeagues} selected={filters.leagues} onChange={(v) => setFilter('leagues', v)} />
            <MultiSelect label={t("Opponent")} options={availOpponents} selected={filters.opponents} onChange={(v) => setFilter('opponents', v)} />
            <MultiSelect label={t("Tier")} options={availTiers} selected={filters.tiers} onChange={(v) => setFilter('tiers', v)} />
            
            <div className="border-t border-gray-100 dark:border-gray-800 my-2"></div>
            
            <MultiSelect label={t("Date")} options={availDates} selected={filters.dates} onChange={(v) => setFilter('dates', v)} />
            <MultiSelect label={t("Time")} options={availTimes} selected={filters.times} onChange={(v) => setFilter('times', v)} />
            
            <div className="border-t border-gray-100 dark:border-gray-800 my-2"></div>

            <MultiSelect label={t("Zone")} options={availZones} selected={filters.zones} onChange={(v) => setFilter('zones', v)} />
          </div>

          <div className="pt-4 text-xs text-center text-gray-400 dark:text-gray-500 border-t border-gray-100 dark:border-gray-800 mt-2 flex-shrink-0">
             {label === 'A' ? dataA.length : dataB.length} {t('Games matched')}
          </div>
      </div>
      );
  };

  return (
    <div className="animate-fade-in max-w-7xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center gap-3 mb-6">
           <div className="p-3 bg-red-50 dark:bg-red-900/30 rounded-lg text-red-700">
               <ArrowLeftRight size={24} />
           </div>
           <div>
               <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('Comparative Analysis')}</h1>
               <p className="text-gray-500 dark:text-gray-400 text-sm">
                   {viewMode === 'gameday' 
                    ? t('Analyzing GameDay revenue only (Variable)') 
                    : t('Analyze performance variance between two distinct datasets.')}
               </p>
           </div>
             <button onClick={() => setShowPrintDialog(true)}
              className="ml-auto flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-900 text-white dark:bg-white dark:text-gray-900 text-sm font-semibold"
             ><Printer size={16} /> {t('Print / Save PDF')}</button>
       </div>

        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Comparison type">
          {([
            ['opponent', 'Opponent vs opponent'],
            ['tier', 'Tier over the years'],
            ['week', 'Week vs week'],
            ['ytd', 'Season to date'],
            ['custom', 'Custom'],
          ] as const).map(([value, label]) => (
            <button key={value} type="button" role="tab" aria-selected={comparisonType === value}
              onClick={() => setComparisonType(value)}
              className={`rounded-lg px-4 py-2.5 text-sm font-semibold border transition-colors ${
                comparisonType === value
                  ? 'bg-red-600 border-red-600 text-white'
                  : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-red-300'
              }`}>{t(label)}</button>
          ))}
        </div>

        <div className="rounded-xl border border-gray-200 bg-white px-4 py-4 dark:border-gray-700 dark:bg-gray-900">
          <span className="mb-3 block text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">Metrics to display</span>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {metricSlots.map((key, index) => <label key={index} className="text-xs font-semibold text-gray-600 dark:text-gray-300">
              Chart {index + 1}
              <select value={key} onChange={event => setMetricSlot(index, event.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white">
                <option value="">Hide chart</option>
                {[...new Set(COMPARISON_METRICS.map(metric => metric.category))].map(category =>
                  <optgroup key={category} label={category}>
                    {COMPARISON_METRICS.filter(metric => metric.category === category)
                      .map(metric => <option key={metric.key} value={metric.key}>{metric.title}</option>)}
                  </optgroup>)}
              </select>
            </label>)}
          </div>
        </div>

         {comparisonType !== 'custom' ? <SeasonComparison fullData={fullData} mode={comparisonType} viewMode={viewMode}
           selectedMetrics={selectedMetrics} selection={seasonSelection} onSelectionChange={setSeasonSelection} /> : (
        <div className="space-y-5">
          <ComparisonQuadrant groups={[{ label: 'Scenario A', games: dataA }, { label: 'Scenario B', games: dataB }]} highlightLabels={['Scenario B']} selectedMetrics={selectedMetrics} />
          <p className="text-xs text-gray-500">— means no matching game or unavailable metric, not zero.</p>
          <details className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
            <summary className="cursor-pointer px-5 py-4 font-semibold text-sm text-gray-800 dark:text-gray-100">
              {t('Custom')} · A: {filtersA.seasons.join(', ')} · B: {filtersB.seasons.join(', ')} — Configure scenarios
            </summary>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 pt-0">
              <FilterColumn label="A" filters={filtersA} setFilter={(f: keyof FilterState, v: any) => updateFilter('A', f, v)} />
              <FilterColumn label="B" filters={filtersB} setFilter={(f: keyof FilterState, v: any) => updateFilter('B', f, v)} />
            </div>
          </details>
       </div>
        )}
         {showPrintDialog && <ComparisonPrintDialog fullData={fullData} viewMode={viewMode}
           selectedMetrics={selectedMetrics} initialMode={comparisonType} initialSelection={seasonSelection}
           customReport={customReport} onClose={() => setShowPrintDialog(false)} />}
    </div>
  );
};