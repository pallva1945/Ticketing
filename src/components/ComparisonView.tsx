import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { GameData, GameDayData } from '../types';
import { Printer } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { SeasonComparison, type SeasonComparisonMode, type SeasonComparisonSelection } from './SeasonComparison';
import { ComparisonPrintDialog } from './ComparisonPrintDialog';
import { ComparisonReport } from './comparisonReport';
import { ComparisonQuadrant } from './ComparisonQuadrant';
import { ComparisonBadges } from './ComparisonBadges';
import { COMPARISON_METRICS, ComparisonMetricKey, metricDisplayTitle } from './comparisonMetrics';
import { ComparisonModeTabs, type ComparisonMode } from './ComparisonModeTabs';
import { ComparisonCustomFiltersPanel } from './ComparisonCustomFilters';
import type { GameDayCustomFilters } from '../utils/gameDayComparison';
import { buildGameDayFixtures, gameDayFixtureLabel } from '../utils/gameDayComparison';
import { buildTicketingCustomComparison } from '../utils/seasonComparison';
import { useRomeDay } from '../hooks/useRomeDay';

interface ComparisonViewProps {
  fullData: GameData[];
  scheduleData?: GameDayData[];
  options: {
    seasons: string[];
    leagues: string[];
    opponents: string[];
    tiers: string[];
    zones: string[];
  };
  viewMode: 'total' | 'gameday';
}

const EMPTY_FILTERS: GameDayCustomFilters = {
  seasons: ['All'], leagues: ['All'], opponents: ['All'], tiers: ['All'], dates: ['All'],
};

export const ComparisonView: React.FC<ComparisonViewProps> = ({ fullData, scheduleData = [], viewMode }) => {
  const { t } = useLanguage();
  const [comparisonType, setComparisonType] = useState<ComparisonMode>('opponent');
  const [seasonSelection, setSeasonSelection] = useState<SeasonComparisonSelection>({
    league: 'LBA', opponent: '', secondOpponent: '', firstTier: null, week: 1,
  });
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [metricSlots, setMetricSlots] = useState<ComparisonMetricKey[]>(() => {
    const all = COMPARISON_METRICS.map(metric => metric.key);
    const defaults = ['revenue', 'attendance', 'yield', 'loadFactor', 'cagrRevenue', 'cagrYield'];
    try {
      const stored = JSON.parse(window.localStorage.getItem('ticketing-comparison-metrics') || 'null');
      const valid = Array.isArray(stored) ? defaults.map((key, index) => {
        if (index >= stored.length) return key;
        const selected = stored[index] === 'yoyRevenueGrowth' ? 'cagrRevenue'
          : stored[index] === 'yoyYieldGrowth' ? 'cagrYield' : stored[index];
        return all.includes(selected) ? selected : '';
      }) : [];
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

  const asOf = useRomeDay();
  const fixtures = useMemo(() => buildGameDayFixtures(scheduleData, fullData, asOf), [scheduleData, fullData, asOf]);
  const customOptions = useMemo(() => ({
    seasons: [...new Set(fixtures.map(fixture => fixture.season))].sort(),
    leagues: [...new Set(fixtures.map(fixture => fixture.league))].sort(),
    opponents: [...new Set(fixtures.map(fixture => fixture.opponent))].sort(),
    tiers: [...new Set(fixtures.flatMap(fixture => fixture.tier === undefined ? [] : [String(fixture.tier)]))]
      .sort((a, b) => Number(a) - Number(b)),
    dates: fixtures.map(gameDayFixtureLabel),
  }), [fixtures]);
  const validSeasons = customOptions.seasons;
  const defaultLeague = customOptions.leagues.includes('LBA') ? 'LBA' : customOptions.leagues[0] || '';
  const customDefaultsReady = useRef(false);
  const [filtersA, setFiltersA] = useState<GameDayCustomFilters>(EMPTY_FILTERS);
  const [filtersB, setFiltersB] = useState<GameDayCustomFilters>(EMPTY_FILTERS);
  useEffect(() => {
    if (customDefaultsReady.current || !validSeasons.length || !defaultLeague) return;
    customDefaultsReady.current = true;
    const ordered = [...validSeasons].sort();
    setFiltersA({ ...EMPTY_FILTERS, seasons: [ordered[Math.max(0, ordered.length - 2)]], leagues: [defaultLeague] });
    setFiltersB({ ...EMPTY_FILTERS, seasons: [ordered[ordered.length - 1]], leagues: [defaultLeague] });
  }, [validSeasons, defaultLeague]);

  const customGroups = useMemo(
    () => buildTicketingCustomComparison(fullData, viewMode, filtersA, filtersB, scheduleData, asOf),
    [fullData, viewMode, filtersA, filtersB, scheduleData, asOf],
  );
  const customGames = customGroups.flatMap(group => group.games);
  const customLeagues = [...new Set(customGames.map(game => game.league))];
  const customOpponents = [...new Set(customGames.map(game => game.opponent))];
  const filterCaption = (side: string, filters: GameDayCustomFilters) =>
    `${side}: ${filters.seasons.join(', ')} · ${filters.leagues.join(', ')} · ${filters.opponents.join(', ')} · ${filters.tiers.join(', ')} · ${filters.dates.join(', ')}`;
  const customReport: ComparisonReport = {
    title: 'Custom ticketing comparison',
    subtitle: `${viewMode === 'total' ? 'Total' : 'GameDay'} view · A vs B\n${filterCaption('A', filtersA)}\n${filterCaption('B', filtersB)}`,
    groups: customGroups,
    highlightLabels: ['Scenario B'], showTrend: false, perGame: true,
    league: customLeagues.length === 1 ? customLeagues[0] : undefined,
    opponents: customOpponents.length <= 4 ? customOpponents : [],
  };
  const updateCustomFilter = (side: 'A' | 'B', field: keyof GameDayCustomFilters, values: string[]) => {
    const setter = side === 'A' ? setFiltersA : setFiltersB;
    setter(previous => ({ ...previous, [field]: values }));
  };
  const matchedOpponentNames = comparisonType === 'custom'
    ? customReport.opponents || [] : [];

  return (
    <div className="animate-fade-in mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-red-50 p-1.5 dark:bg-red-900/30">
          <img src="/favicon.png" alt="Pallacanestro Varese" className="h-full w-full object-contain" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('Comparative Analysis')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {viewMode === 'gameday' ? t('Analyzing GameDay revenue only (Variable)') : t('Analyze performance variance between two distinct datasets.')}
          </p>
        </div>
        <button onClick={() => setShowPrintDialog(true)}
          className="ml-auto flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white dark:bg-white dark:text-gray-900">
          <Printer size={16} /> {t('Print / Save PDF')}
        </button>
      </div>

      <ComparisonModeTabs value={comparisonType} onChange={setComparisonType} />

      <div className="rounded-xl border border-gray-200 bg-white px-4 py-4 dark:border-gray-700 dark:bg-gray-900">
        <span className="mb-3 block text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">Metrics to display</span>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {metricSlots.map((key, index) => <label key={index} className="text-xs font-semibold text-gray-600 dark:text-gray-300">
            Chart {index + 1}
            <select value={key} onChange={event => setMetricSlot(index, event.target.value as ComparisonMetricKey)}
              className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white">
              <option value="">Hide chart</option>
              {[...new Set(COMPARISON_METRICS.map(metric => metric.category))].map(category =>
                <optgroup key={category} label={category}>
                  {COMPARISON_METRICS.filter(metric => metric.category === category)
                    .map(metric => <option key={metric.key} value={metric.key}>{metricDisplayTitle(metric.key, true)}</option>)}
                </optgroup>)}
            </select>
          </label>)}
        </div>
      </div>

      {comparisonType !== 'custom' ? <SeasonComparison
        fullData={fullData} scheduleData={scheduleData} mode={comparisonType as SeasonComparisonMode}
        viewMode={viewMode} selectedMetrics={selectedMetrics} selection={seasonSelection}
        onSelectionChange={setSeasonSelection}
      /> : <div className="space-y-5">
        <ComparisonBadges league={customReport.league} opponents={matchedOpponentNames} />
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {(['A', 'B'] as const).map((side, index) => {
            const group = customGroups[index];
            return <ComparisonCustomFiltersPanel key={side} side={side}
              filters={side === 'A' ? filtersA : filtersB} options={customOptions}
              onChange={(field, values) => updateCustomFilter(side, field, values)}
              fixturesSelected={group?.fixtureCount ?? 0} fixturesWithData={group?.games.length ?? 0} />;
          })}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {customGroups.map(group => <p key={group.label}>
            <strong className="text-gray-700 dark:text-gray-200">{group.label} · {group.games.length}/{group.fixtureCount} fixtures:</strong>{' '}
            {group.fixtures?.length ? group.fixtures.map(fixture => `${fixture.date} ${fixture.opponent}`).join(' · ') : 'No matching fixtures'}
          </p>)}
        </div>
        <ComparisonQuadrant groups={customReport.groups} highlightLabels={customReport.highlightLabels}
          selectedMetrics={selectedMetrics} perGame />
        <p className="text-xs text-gray-500">— means no matching game or unavailable metric, not zero.</p>
      </div>}

      {showPrintDialog && <ComparisonPrintDialog fullData={fullData} scheduleData={scheduleData} viewMode={viewMode}
        selectedMetrics={selectedMetrics} initialMode={comparisonType} initialSelection={seasonSelection}
        customReport={customReport} onClose={() => setShowPrintDialog(false)} />}
    </div>
  );
};