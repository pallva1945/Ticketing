import React from 'react';
import type { GameData, GameDayData } from '../types';
import { ComparisonQuadrant } from './ComparisonQuadrant';
import { ComparisonBadges } from './ComparisonBadges';
import type { ComparisonMetricKey } from './comparisonMetrics';
import { useLanguage } from '../contexts/LanguageContext';
import { MultiSelect } from './MultiSelect';
import {
  buildSeasonComparison, type SeasonComparisonMode, type SeasonComparisonSelection,
} from '../utils/seasonComparison';
export { buildSeasonComparison } from '../utils/seasonComparison';
export type { SeasonComparisonMode, SeasonComparisonSelection } from '../utils/seasonComparison';

interface Props {
  fullData: GameData[];
  scheduleData?: GameDayData[];
  mode: SeasonComparisonMode;
  viewMode: 'total' | 'gameday';
  selectedMetrics: ComparisonMetricKey[];
  selection: SeasonComparisonSelection;
  onSelectionChange: (selection: SeasonComparisonSelection) => void;
}

export const SeasonComparison: React.FC<Props> = ({
  fullData, scheduleData = [], mode, viewMode, selectedMetrics, selection, onSelectionChange,
}) => {
  const { t } = useLanguage();
  const result = React.useMemo(
    () => buildSeasonComparison(fullData, mode, viewMode, selection, scheduleData),
    [fullData, mode, viewMode, selection, scheduleData],
  );
  const {
    leagues, league, seasons, opponents, tiers, selectedOpponent, selectedSecond, selectedFirstTier,
    maxWeek, selectedWeek, currentCount, groups, description, currentLabels, currentOpponents,
  } = result;
  const update = (changes: Partial<SeasonComparisonSelection>) => onSelectionChange({ ...selection, ...changes });
  const includedOpponents = [...new Set(groups.flatMap(group => group.games.map(game => game.opponent)))];
  const visibleOpponents = mode === 'opponent'
    ? [selectedOpponent, selectedSecond].filter(Boolean)
    : includedOpponents.length <= 4 ? includedOpponents : [];
  const explanation = mode === 'tier'
    ? 'The selected tier is compared with the same tier in earlier seasons. Volume metrics are averaged per matching game; rates and yield use all matching tickets.'
    : mode === 'week' ? 'Weeks follow the chronological order of dated home league fixtures within each season.'
      : mode === 'ytd-week' ? `Each season is aligned to the current season’s first ${currentCount} fixtures, grouped in chronological order by week.`
        : mode === 'ytd-opponent' ? `Each season includes the same reference opponents currently played: ${currentOpponents.join(', ') || 'none yet'}.`
          : mode === 'ytd' ? 'YTD aligns prior seasons to the number of games played this season, not their full-season totals.'
            : 'Select one opponent to compare the same fixture across seasons, or add a second opponent.';

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4 rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
        <div className="flex flex-wrap items-end gap-4">
          <MultiSelect label={t('Display seasons')} options={seasons} selected={selection.seasons || ['All']}
            onChange={values => update({ seasons: values })} />
          <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">
            {t('League')}
            <select value={league} onChange={event => update({ league: event.target.value, opponent: '', secondOpponent: '', firstTier: null, week: 1 })}
              className="mt-1 block min-w-32 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800">
              {leagues.map(value => <option key={value} value={value}>{value}</option>)}
            </select>
          </label>
          {mode === 'opponent' && <>
            <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">
              {t('Opponent')}
              <select value={selectedOpponent} onChange={event => update({ opponent: event.target.value, secondOpponent: '' })}
                className="mt-1 block min-w-40 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800">
                {opponents.map(value => <option key={value} value={value}>{value}</option>)}
              </select>
            </label>
            <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">
              {t('Compare with (optional)')}
              <select value={selectedSecond} onChange={event => update({ secondOpponent: event.target.value })}
                className="mt-1 block min-w-40 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800">
                <option value="">{t('Same fixture across seasons')}</option>
                {opponents.filter(value => value !== selectedOpponent).map(value => <option key={value} value={value}>{value}</option>)}
              </select>
            </label>
          </>}
          {mode === 'tier' && <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">
            {t('Tier')}
            <select value={selectedFirstTier ?? ''} onChange={event => update({ firstTier: Number(event.target.value) })}
              className="mt-1 block min-w-32 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800">
              {tiers.map(value => <option key={value} value={value}>{t('Tier')} {value}</option>)}
            </select>
          </label>}
          {mode === 'week' && <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">
            {t('Home game week')}
            <select value={selectedWeek} onChange={event => update({ week: Number(event.target.value) })}
              className="mt-1 block min-w-32 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800">
              {Array.from({ length: maxWeek }, (_, index) => <option key={index} value={index + 1}>W{index + 1}</option>)}
            </select>
          </label>}
        </div>
      </div>

      {groups.some(group => group.games.length > 0) && <ComparisonBadges league={league} opponents={visibleOpponents} />}

      <div className="text-sm text-gray-600 dark:text-gray-400">
        <strong className="text-gray-900 dark:text-white">{description}</strong>
        <span className="mt-1 block">{t(explanation)}</span>
      </div>

      {groups.length === 0 ? <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-gray-500 dark:border-gray-700 dark:bg-gray-900">
        {mode === 'tier' && tiers.length === 0 ? t('No tiers are available in this league.') : t('No games are available for this comparison yet.')}
      </div> : <>
        <ComparisonQuadrant groups={groups} highlightLabels={currentLabels} selectedMetrics={selectedMetrics} showTrend perGame />
        <div className="rounded-xl border border-gray-200 bg-white px-5 py-4 dark:border-gray-700 dark:bg-gray-900">
          <h3 className="mb-2 text-sm font-semibold text-gray-800 dark:text-gray-100">{t('Included fixtures')}</h3>
          <div className="grid grid-cols-1 gap-x-5 gap-y-1 text-xs text-gray-600 dark:text-gray-400 sm:grid-cols-2">
            {groups.map(group => <div key={group.label}>
              <span className="font-semibold text-gray-800 dark:text-gray-200">{group.label} · {group.games.length}/{group.fixtureCount ?? group.games.length}:</span>{' '}
              {group.fixtures?.length
                ? group.fixtures.map((fixture: { date: string; opponent: string }) => `${fixture.date} ${fixture.opponent}`).join(' · ')
                : group.games.length ? group.games.map(game => `${game.date} ${game.opponent}`).join(' · ') : t('No matching game')}
              {(group.missingFixtures ?? 0) > 0 && <span className="text-amber-700"> · {group.missingFixtures} {t('missing')}</span>}
            </div>)}
          </div>
        </div>
      </>}
      <p className="text-xs text-gray-500">— {t('means no matching game or unavailable metric, not zero.')}{viewMode === 'gameday' && ` ${t('Games without ticket-channel detail are excluded from GameDay comparisons.')}`}</p>
    </div>
  );
};