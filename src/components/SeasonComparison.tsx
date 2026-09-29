import React from 'react';
import { GameData, SalesChannel } from '../types';
import { ComparisonReportGroup } from './comparisonReport';
import { ComparisonQuadrant } from './ComparisonQuadrant';
import { ComparisonBadges } from './ComparisonBadges';
import { ComparisonMetricKey } from './comparisonMetrics';
import { useLanguage } from '../contexts/LanguageContext';
import { getFixedCapacityForSeason } from '../constants';

export type SeasonComparisonMode = 'opponent' | 'week' | 'ytd' | 'tier';

export interface SeasonComparisonSelection {
  league: string;
  opponent: string;
  secondOpponent: string;
  firstTier: number | null;
  week: number;
}

interface Props {
  fullData: GameData[];
  mode: SeasonComparisonMode;
  viewMode: 'total' | 'gameday';
  selectedMetrics: ComparisonMetricKey[];
  selection: SeasonComparisonSelection;
  onSelectionChange: (selection: SeasonComparisonSelection) => void;
}

const gameTimestamp = (date: string): number => {
  const parts = date.split('/');
  if (parts.length === 3) return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0])).getTime();
  const parsed = Date.parse(date);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const seasonOrder = (season: string) => {
  const match = season.match(/^(\d{2,4})[-/]/);
  if (!match) return -1;
  const year = Number(match[1]);
  return year < 100 ? 2000 + year : year;
};

const compareGame = (game: GameData, viewMode: Props['viewMode']): GameData => {
  const hasBreakdown = game.salesBreakdown.length > 0;
  const sales = viewMode === 'gameday'
    ? game.salesBreakdown.filter(s => [SalesChannel.TIX, SalesChannel.MP, SalesChannel.VB, SalesChannel.GIVEAWAY].includes(s.channel))
    : game.salesBreakdown;
  const zoneCapacities = Object.fromEntries(Object.entries(game.zoneCapacities || {}).map(([zone, capacity]) =>
    [zone, viewMode === 'gameday' ? Math.max(0, capacity - getFixedCapacityForSeason(game.season, zone)) : capacity]));
  const capacities = Object.values(zoneCapacities).reduce((sum, capacity) => sum + capacity, 0);
  return {
    ...game,
    salesBreakdown: sales,
    totalRevenue: hasBreakdown ? sales.reduce((sum, item) => sum + item.revenue, 0) :
      (viewMode === 'total' ? game.totalRevenue : 0),
    attendance: hasBreakdown ? sales.reduce((sum, item) => sum + item.quantity, 0) :
      (viewMode === 'total' ? game.attendance : 0),
    capacity: Object.keys(game.zoneCapacities || {}).length ? capacities : game.capacity,
    zoneCapacities,
  };
};

export function buildSeasonComparison(
  fullData: GameData[], mode: SeasonComparisonMode, viewMode: Props['viewMode'],
  selection: SeasonComparisonSelection,
) {
  const leagues = Array.from(new Set(fullData.map(g => g.league))).sort();
  const league = leagues.includes(selection.league) ? selection.league : (leagues[0] || 'LBA');
  const seasons =
    Array.from(new Set(fullData.filter(g => g.league === league).map(g => g.season)))
      .sort((a, b) => seasonOrder(b) - seasonOrder(a)).slice(0, mode === 'tier' ? undefined : 4);
  const currentSeason = seasons[0];
  const seasonGames = seasons.map(season => ({
    season,
    games: fullData.filter(g => g.league === league && g.season === season)
      .sort((a, b) => gameTimestamp(a.date) - gameTimestamp(b.date) || a.id.localeCompare(b.id)),
  }));
  const opponents = Array.from(new Set(seasonGames.flatMap(s => s.games.map(g => g.opponent)))).sort();
  const tiers = Array.from(new Set(seasonGames.flatMap(s => s.games.map(g => g.tier)))).sort((a, b) => a - b);
  const selectedFirstTier = selection.firstTier !== null && tiers.includes(selection.firstTier) ? selection.firstTier : tiers[0];
  const currentOpponents = seasonGames[0]?.games.map(g => g.opponent) || [];
  const selectedOpponent = opponents.includes(selection.opponent) ? selection.opponent : (currentOpponents[0] || opponents[0] || '');
  const selectedSecond = selection.secondOpponent !== selectedOpponent && opponents.includes(selection.secondOpponent) ? selection.secondOpponent : '';
  const currentCount = seasonGames[0]?.games.length || 0;
  const maxWeek = Math.max(1, ...seasonGames.map(s => s.games.length));
  const selectedWeek = Math.max(1, Math.min(selection.week, maxWeek));

  const chosen = mode === 'opponent'
      ? [selectedOpponent, ...(selectedSecond ? [selectedSecond] : [])].filter(Boolean)
      : mode === 'tier' ? [String(selectedFirstTier)]
      : [''];
  const groups: ComparisonReportGroup[] = ((mode === 'ytd' && currentCount === 0) ||
    (mode === 'tier' && selectedFirstTier === undefined)) ? [] :
    seasonGames.flatMap(({ season, games }) => chosen.map(name => ({
      label: mode === 'opponent' ? `${season} · ${name}` : season,
      games: (mode === 'opponent' ? games.filter(g => g.opponent === name) :
        mode === 'tier' ? games.filter(g => g.tier === Number(name)) :
        mode === 'week' ? games.slice(selectedWeek - 1, selectedWeek) :
        games.slice(0, currentCount)).filter(g => viewMode === 'total' || g.salesBreakdown.length > 0)
        .map(g => compareGame(g, viewMode)),
    })));

  const description = mode === 'opponent'
    ? `${selectedOpponent}${selectedSecond ? ` vs ${selectedSecond}` : ''} · ${league} · ${viewMode === 'total' ? 'Total' : 'GameDay'}`
    : mode === 'tier'
      ? `Tier ${selectedFirstTier ?? '—'} across seasons · per-game averages · ${league} · ${viewMode === 'total' ? 'Total' : 'GameDay'}`
    : mode === 'week'
      ? `Home game week ${selectedWeek} in each season · ${league} · ${viewMode === 'total' ? 'Total' : 'GameDay'}`
      : `First ${currentCount} home ${currentCount === 1 ? 'game' : 'games'} in each season · ${league} · ${viewMode === 'total' ? 'Total' : 'GameDay'}`;
  const title = mode === 'opponent' ? 'Opponent comparison' : mode === 'tier' ? 'Tier over the years' :
    mode === 'week' ? 'Week-by-week comparison' : 'Season to date comparison';
  const currentLabels = groups.filter(group =>
    group.label === currentSeason || group.label.startsWith(`${currentSeason} · `)).map(group => group.label);

  return { leagues, league, opponents, tiers, selectedOpponent, selectedSecond, selectedFirstTier,
    maxWeek, selectedWeek, currentCount, groups, description, title, currentLabels };
}

export const SeasonComparison: React.FC<Props> = ({
  fullData, mode, viewMode, selectedMetrics, selection, onSelectionChange,
}) => {
  const { t } = useLanguage();
  const { leagues, league, opponents, tiers, selectedOpponent, selectedSecond, selectedFirstTier,
    maxWeek, selectedWeek, groups, description, currentLabels } =
    React.useMemo(() => buildSeasonComparison(fullData, mode, viewMode, selection),
      [fullData, mode, viewMode, selection]);
  const update = (changes: Partial<SeasonComparisonSelection>) => onSelectionChange({ ...selection, ...changes });
  const includedOpponents = [...new Set(groups.flatMap(group => group.games.map(game => game.opponent)))];
  const visibleOpponents = mode === 'opponent'
    ? [selectedOpponent, selectedSecond].filter(Boolean)
    : includedOpponents.length === 1 ? includedOpponents : [];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-5">
        <div className="flex flex-wrap gap-4 items-end">
          <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">
            {t('League')}
            <select value={league} onChange={event => update({ league: event.target.value, opponent: '', secondOpponent: '', firstTier: null, week: 1 })}
              className="block mt-1 min-w-32 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm">
              {leagues.map(value => <option key={value} value={value}>{value}</option>)}
            </select>
          </label>
          {mode === 'opponent' && <>
            <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">
              {t('Opponent')}
              <select value={selectedOpponent} onChange={event => update({ opponent: event.target.value, secondOpponent: '' })}
                className="block mt-1 min-w-40 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm">
                {opponents.map(value => <option key={value} value={value}>{value}</option>)}
              </select>
            </label>
            <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">
              Compare with (optional)
              <select value={selectedSecond} onChange={event => update({ secondOpponent: event.target.value })}
                className="block mt-1 min-w-40 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm">
                <option value="">Same fixture across seasons</option>
                {opponents.filter(value => value !== selectedOpponent).map(value => <option key={value} value={value}>{value}</option>)}
              </select>
            </label>
          </>}
          {mode === 'tier' && <>
            <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">
              {t('Tier')}
              <select value={selectedFirstTier ?? ''} onChange={event => update({ firstTier: Number(event.target.value) })}
                className="block mt-1 min-w-32 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm">
                {tiers.map(value => <option key={value} value={value}>Tier {value}</option>)}
              </select>
            </label>
          </>}
          {mode === 'week' && <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">
            Home game week
           <select value={selectedWeek} onChange={event => update({ week: Number(event.target.value) })}
              className="block mt-1 min-w-32 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm">
              {Array.from({ length: maxWeek }, (_, index) => <option key={index} value={index + 1}>W{index + 1}</option>)}
            </select>
          </label>}
        </div>
      </div>

      {groups.some(group => group.games.length > 0) &&
        <ComparisonBadges league={league} opponents={visibleOpponents} />}

      <div className="text-sm text-gray-600 dark:text-gray-400">
        <strong className="text-gray-900 dark:text-white">{description}</strong>
        <span className="block mt-1">
          {mode === 'tier' ? 'The selected tier is compared with the same tier in earlier seasons. Volume metrics are averaged per matching game; rates and yield use all matching tickets.' :
            mode === 'week' ? 'Weeks follow the chronological order of home league games within each season.' :
            mode === 'ytd' ? 'YTD aligns prior seasons to the number of games played this season, not their full-season totals.' :
            'Select one opponent to compare the same fixture across seasons, or add a second opponent.'}
        </span>
      </div>

      {groups.length === 0 ? <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-10 text-center text-gray-500">
        {mode === 'tier' && tiers.length === 0 ? 'No tiers are available in this league.' : 'No games are available for this comparison yet.'}
      </div> : <>
        <ComparisonQuadrant groups={groups} highlightLabels={currentLabels} selectedMetrics={selectedMetrics} showTrend perGame={mode === 'tier'} />
        {mode !== 'ytd' && <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-5 py-4">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-2">Included fixtures</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-1 text-xs text-gray-600 dark:text-gray-400">
            {groups.map(group => <div key={group.label}>
              <span className="font-semibold text-gray-800 dark:text-gray-200">{group.label}:</span>{' '}
              {group.games.length ? group.games.map(game => `${game.date} ${game.opponent}`).join(' · ') : 'No matching game'}
            </div>)}
          </div>
        </div>}
      </>}
      <p className="text-xs text-gray-500">— means no matching game or unavailable metric, not zero.
        {viewMode === 'gameday' && ' Games without ticket-channel detail are excluded from GameDay comparisons.'}</p>
    </div>
  );
};