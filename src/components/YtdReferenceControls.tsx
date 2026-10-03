import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import type { GameDayFixture } from '../utils/gameDayComparison';

interface Props {
  seasons: string[];
  availableFixtures: GameDayFixture[];
  referenceSeason?: string;
  ytdWeek?: number;
  onReferenceSeasonChange: (season: string) => void;
  onYtdWeekChange: (week?: number) => void;
  tone?: 'gray' | 'slate';
}

export const YtdReferenceControls: React.FC<Props> = ({
  seasons, availableFixtures, referenceSeason, ytdWeek,
  onReferenceSeasonChange, onYtdWeekChange, tone = 'gray',
}) => {
  const { t } = useLanguage();
  const classes = tone === 'slate'
    ? 'mt-1 block min-h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100'
    : 'mt-1 block min-h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white disabled:cursor-not-allowed disabled:opacity-60';
  const labelClass = tone === 'slate'
    ? 'text-xs font-semibold text-slate-500 dark:text-slate-400'
    : 'text-xs font-semibold text-gray-600 dark:text-gray-300';
  const effectiveSeason = referenceSeason && seasons.includes(referenceSeason)
    ? referenceSeason : [...seasons].sort()[seasons.length - 1] || '';
  const effectiveCutoff = ytdWeek === undefined || !Number.isFinite(ytdWeek) || !availableFixtures.length
    ? 'all' : String(Math.max(1, Math.min(Math.floor(ytdWeek), availableFixtures.length)));

  return (
    <>
      <label className={labelClass}>
        {t('Reference season')}
        <select value={effectiveSeason} onChange={event => onReferenceSeasonChange(event.target.value)} className={classes}>
          {seasons.map(season => <option key={season} value={season}>{season}</option>)}
        </select>
      </label>
      <label className={labelClass}>
        {t('YTD cutoff')}
        <select value={effectiveCutoff}
          disabled={!availableFixtures.length}
          onChange={event => onYtdWeekChange(event.target.value === 'all' ? undefined : Number(event.target.value))}
          className={classes}>
          <option value="all">{t('All eligible games')}</option>
          {availableFixtures.map((fixture, index) => (
            <option key={`${fixture.date}-${fixture.opponent}-${index}`} value={index + 1}>
              W{index + 1} · {fixture.date} · {fixture.opponent}
            </option>
          ))}
        </select>
        {!availableFixtures.length && <span className="mt-1 block text-[11px] font-normal text-amber-700 dark:text-amber-300">{t('No eligible matches in this reference season.')}</span>}
      </label>
    </>
  );
};