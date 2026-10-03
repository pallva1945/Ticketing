import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRomeDay } from '../hooks/useRomeDay';
import { CalendarDays, Printer, TrendingUp } from 'lucide-react';
import type { GameData, GameDayData } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { MultiSelect } from './MultiSelect';
import { ComparisonCustomFiltersPanel } from './ComparisonCustomFilters';
import { ComparisonBadges } from './ComparisonBadges';
import { GameDayComparisonChart } from './GameDayComparisonChart';
import { printGameDayComparisonReport } from './GameDayComparisonReport';
import { ComparisonModeTabs, type ComparisonMode } from './ComparisonModeTabs';
import { YtdReferenceControls } from './YtdReferenceControls';
import {
  buildGameDayFixtures, buildGameDayGroups, DEFAULT_GAMEDAY_METRICS,
  GAMEDAY_METRICS, gameDayChannelRows, gameDayCoverage, gameDayMetric,
  gameDaySeasons, gameDayFixtureLabel, gameDayDate, isGameDaySeason, selectGameDayCustom,
  resolveYtdReference,
  type GameDayComparisonMode, type GameDayCustomFilters, type GameDayMetricKey,
  type GameDaySelection,
} from '../utils/gameDayComparison';

interface Props {
  data: GameDayData[];
  ticketingData: GameData[];
  includeTicketing: boolean;
  isLoading?: boolean;
}

const EMPTY_CUSTOM: GameDayCustomFilters = {
  seasons: ['All'], leagues: ['All'], opponents: ['All'], tiers: ['All'], dates: ['All'],
};
const modeCaptions: Record<GameDayComparisonMode, string> = {
  opponent: 'Compare the same opponent across seasons',
  tier: 'Compare tier-level results across seasons',
  week: 'Compare the same home-game week across seasons',
  'ytd-week': 'Compare year-to-date results by home-game week',
  'ytd-opponent': 'Compare year-to-date results by reference opponent',
  ytd: 'Compare the same number of fixtures to date',
  custom: 'Build two fixture selections from real schedule identities',
};
const fixtureIdentity = gameDayFixtureLabel;
const uniqueSorted = (values: string[]) => [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b));
const initialMetricSlots = (): GameDayMetricKey[] => {
  try {
    const stored = JSON.parse(window.localStorage.getItem('gameday-comparison-metrics') || 'null');
    if (Array.isArray(stored) && stored.length) {
      return DEFAULT_GAMEDAY_METRICS.map((fallback, index) => {
        const candidate = stored[index];
        return GAMEDAY_METRICS.some(metric => metric.key === candidate) ? candidate : fallback;
      });
    }
  } catch { /* Storage can be disabled. */ }
  return [...DEFAULT_GAMEDAY_METRICS];
};
const euros = (value: number | null, locale: string) =>
  value === null ? '—' : new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 }).format(value);
const percentage = (value: number | null) => value === null ? '—' : `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
export const GameDayComparisonView: React.FC<Props> = ({ data, ticketingData, includeTicketing, isLoading = false }) => {
  const { t } = useLanguage();
  const asOf = useRomeDay();
  const fixtures = useMemo(() => buildGameDayFixtures(data, ticketingData, asOf), [data, ticketingData, asOf]);
  const seasons = useMemo(() => gameDaySeasons(data, ticketingData), [data, ticketingData]);
  const newestSeason = seasons[seasons.length - 1] || '';
  const excludedRecords = useMemo(() => [...data, ...ticketingData]
    .filter(game => !isGameDaySeason(game.season) || !gameDayDate(game.date)).length, [data, ticketingData]);
  const leagues = useMemo(() => uniqueSorted(fixtures.map(fixture => fixture.league)), [fixtures]);
  const opponents = useMemo(() => uniqueSorted(fixtures.map(fixture => fixture.opponent)), [fixtures]);
  const tiers = useMemo(() => uniqueSorted(fixtures.flatMap(fixture => fixture.tier === undefined ? [] : [String(fixture.tier)]))
    .sort((a, b) => Number(a) - Number(b)), [fixtures]);
  const dates = useMemo(() => fixtures.map(fixtureIdentity), [fixtures]);
  const defaultLeague = leagues.includes('LBA') ? 'LBA' : leagues[0] || '';
  const defaultLeagueOpponents = uniqueSorted(fixtures.filter(fixture => fixture.league === defaultLeague).map(fixture => fixture.opponent));
  const currentOpponents = uniqueSorted(fixtures.filter(fixture => fixture.season === newestSeason && fixture.league === defaultLeague).map(game => game.opponent));
  const defaultOpponent = currentOpponents[0] || defaultLeagueOpponents[0] || '';
  const leagueTiers = uniqueSorted(fixtures.filter(fixture => fixture.league === defaultLeague && fixture.tier !== undefined).map(fixture => String(fixture.tier)))
    .sort((a, b) => Number(a) - Number(b));
  const [mode, setMode] = useState<ComparisonMode>('opponent');
  const [seasonSelection, setSeasonSelection] = useState<string[]>(['All']);
  const [selection, setSelection] = useState<GameDaySelection>({
    league: defaultLeague,
    opponent: defaultOpponent,
      tier: leagueTiers[0] || tiers[0] || '',
    week: 1,
      secondOpponent: '',
  });
  const ytdReference = useMemo(() => resolveYtdReference(fixtures, seasons, selection), [fixtures, seasons, selection]);
  const leagueOpponents = useMemo(() => uniqueSorted(fixtures.filter(fixture => fixture.league === selection.league).map(fixture => fixture.opponent)), [fixtures, selection.league]);
  const selectedLeagueTiers = useMemo(() => uniqueSorted(fixtures.filter(fixture => fixture.league === selection.league && fixture.tier !== undefined)
    .map(fixture => String(fixture.tier))).sort((a, b) => Number(a) - Number(b)), [fixtures, selection.league]);
  const [customA, setCustomA] = useState<GameDayCustomFilters>(() => ({
    ...EMPTY_CUSTOM,
    seasons: seasons.length > 1 ? [seasons[seasons.length - 2]] : ['All'],
    leagues: leagues.includes('LBA') ? ['LBA'] : leagues.length ? [leagues[0]] : ['All'],
  }));
  const [customB, setCustomB] = useState<GameDayCustomFilters>(() => ({
    ...EMPTY_CUSTOM,
    seasons: newestSeason ? [newestSeason] : ['All'],
    leagues: leagues.includes('LBA') ? ['LBA'] : leagues.length ? [leagues[0]] : ['All'],
  }));
  const [metricSlots, setMetricSlots] = useState<GameDayMetricKey[]>(initialMetricSlots);
  const customDefaultsReady = useRef(Boolean(seasons.length && defaultLeague));
  // Data arrives asynchronously. Fill unset defaults without overwriting
  // selections the user has already made.
  useEffect(() => {
    setSelection(current => ({
      ...current,
      league: current.league || defaultLeague,
      opponent: current.opponent || defaultOpponent,
      tier: current.tier || leagueTiers[0] || '',
    }));
  }, [defaultLeague, defaultOpponent, leagueTiers.join('|')]);
  useEffect(() => {
    if (customDefaultsReady.current || !seasons.length || !defaultLeague) return;
    customDefaultsReady.current = true;
    setCustomA({ ...EMPTY_CUSTOM, seasons: [seasons[Math.max(0, seasons.length - 2)]], leagues: [defaultLeague] });
    setCustomB({ ...EMPTY_CUSTOM, seasons: [newestSeason], leagues: [defaultLeague] });
  }, [seasons.join('|'), newestSeason, defaultLeague]);
  const locale = typeof navigator !== 'undefined' && navigator.language.startsWith('it') ? 'it-IT' : 'en-GB';

  const fullSeasonGroups = useMemo(
    () => buildGameDayGroups(fixtures, seasons, mode, selection, customA, customB),
    [fixtures, seasons, mode, selection, customA, customB],
  );
  const groups = useMemo(() => mode === 'custom'
    ? fullSeasonGroups
    : fullSeasonGroups.filter(group => seasonSelection.includes('All') || !group.season || seasonSelection.includes(group.season)),
  [fullSeasonGroups, mode, seasonSelection]);
  const ytdReferenceCount = ytdReference.count;
  const ytdReferenceSeason = ytdReference.season;
  const ytdReferenceOpponents = ytdReference.opponents;
  const isYtdMode = mode === 'ytd-week' || mode === 'ytd-opponent';
  const selectedMetrics = metricSlots;
  const matchedFixtures = groups.reduce((sum, group) => sum + group.fixtureCount, 0);
  const knownGames = groups.reduce((sum, group) => sum + group.games.length, 0);
  const setMetric = (index: number, next: GameDayMetricKey) => {
    setMetricSlots(current => {
      const updated = [...current];
      updated[index] = next;
      try { window.localStorage.setItem('gameday-comparison-metrics', JSON.stringify(updated)); } catch { /* Storage can be disabled. */ }
      return updated;
    });
  };
  const setCustomFilter = (side: 'A' | 'B', field: keyof GameDayCustomFilters, values: string[]) => {
    const setter = side === 'A' ? setCustomA : setCustomB;
    setter(previous => ({ ...previous, [field]: values }));
  };
  const customSelect = (filters: GameDayCustomFilters) => selectGameDayCustom(fixtures, filters);
  const displayGroups = groups;
  const cagrBaseline = useMemo(() => {
    const cagrKeys = selectedMetrics.filter(key => key.startsWith('cagr'));
    if (!cagrKeys.length) return t('No CAGR metric selected');
    return cagrKeys.map(key => {
      const baseKey = key === 'cagrRevenue' ? 'revenuePerGame' : 'operationalPerPerson';
      const title = t(GAMEDAY_METRICS.find(metric => metric.key === key)?.label || key);
      if (mode === 'custom') return `${title}: ${t('Not applicable to Custom A / B')}`;
      const baseline = displayGroups.find(group => {
        const value = gameDayMetric(group, baseKey, includeTicketing);
        return value !== null && value > 0;
      });
      return `${title}: ${baseline?.season || t('No positive baseline')}`;
    }).join(' · ');
  }, [displayGroups, selectedMetrics, includeTicketing, mode, t]);
  const badgeOpponents = mode === 'opponent'
    ? [selection.opponent]
    : mode === 'custom'
      ? uniqueSorted([...customSelect(customA), ...customSelect(customB)].map(fixture => fixture.opponent)).slice(0, 4)
      : uniqueSorted(displayGroups.flatMap(group => group.games.map(game => game.opponent))).slice(0, 4);
  const badgeLeague = mode === 'custom'
    ? (() => {
      const selected = [...customSelect(customA), ...customSelect(customB)].map(fixture => fixture.league);
      return selected.length && selected.every(value => value === selected[0]) ? selected[0] : undefined;
    })()
    : selection.league || undefined;
  const describeFilterValues = (values: string[]) =>
    values.includes('All') ? t('All') : values.length ? values.join(', ') : t('None');
  const filterSummary = mode === 'custom'
    ? `A · ${t('Seasons')}: ${describeFilterValues(customA.seasons)} · ${t('Leagues')}: ${describeFilterValues(customA.leagues)} · ${t('Opponents')}: ${describeFilterValues(customA.opponents)} · ${t('Tiers')}: ${describeFilterValues(customA.tiers)} · ${t('Fixture identities')}: ${describeFilterValues(customA.dates)} | B · ${t('Seasons')}: ${describeFilterValues(customB.seasons)} · ${t('Leagues')}: ${describeFilterValues(customB.leagues)} · ${t('Opponents')}: ${describeFilterValues(customB.opponents)} · ${t('Tiers')}: ${describeFilterValues(customB.tiers)} · ${t('Fixture identities')}: ${describeFilterValues(customB.dates)}`
    : [
      `${t('League')}: ${selection.league || '—'}`,
      `${t('Display seasons')}: ${describeFilterValues(seasonSelection)}`,
      ...(mode === 'opponent' ? [`${t('Opponent')}: ${selection.opponent || '—'}${selection.secondOpponent ? ` vs ${selection.secondOpponent}` : ''}`] : []),
       ...(mode === 'week' ? [`${t('Home game week')}: W${selection.week}`] : []),
       ...(mode === 'tier' ? [`${t('Tier')}: ${selection.tier || '—'}`] : []),
        ...(mode === 'ytd-week' ? [`${t('YTD by week')}: ${ytdReferenceSeason || '—'} · ${t('First')} ${ytdReferenceCount} ${t('fixtures')} · ${ytdReferenceOpponents.join(', ') || t('None yet')}`] : []),
        ...(mode === 'ytd-opponent' ? [`${t('YTD by opponent')}: ${ytdReferenceSeason || '—'} · ${t('First')} ${ytdReferenceCount} ${t('fixtures')} · ${ytdReferenceOpponents.join(', ') || t('None yet')}`] : []),
    ].join(' · ');

  const onPrint = () => printGameDayComparisonReport({
    groups: displayGroups,
    metrics: selectedMetrics,
    includeTicketing,
    mode,
    filterSummary,
    newestSeason,
    ytdReferenceSeason,
    ytdReferenceCount,
    cagrBaseline,
    excludedRecords,
    league: badgeLeague,
    opponents: badgeOpponents,
    locale,
    translate: label => t(label),
  });

  if (!fixtures.length) return (
    <div className="mx-auto max-w-6xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <CalendarDays className="mx-auto mb-3 text-rose-700" size={27} />
      <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">{t(isLoading ? 'Loading GameDay comparison' : 'No GameDay comparison fixtures')}</h2>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t(isLoading ? 'Loading the match schedule and commercial data.' : 'No dated schedule or commercial data is available to compare yet.')}</p>
    </div>
  );

  const updateSeasonSelection = (values: string[]) => setSeasonSelection(values);
  return (
    <main className="mx-auto max-w-[1500px] space-y-6 pb-10">
      <header className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-wrap items-center gap-4 border-b border-slate-100 px-5 py-5 sm:px-7 dark:border-slate-800">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-rose-50 text-rose-700">
            <img src="/favicon.png" alt="Pallacanestro Varese" className="h-9 w-9 object-contain" />
          </div>
          <div className="min-w-[210px] flex-1">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-rose-700">{t('Commercial intelligence')}</p>
            <h1 className="mt-0.5 text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">{t('GameDay comparison')}</h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-500 dark:text-slate-400">{t('Compare commercial performance across opponents, fixture order and seasons.')}</p>
          </div>
          <button type="button" onClick={onPrint} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:ring-offset-2">
            <Printer size={16} />{t('Print / PDF')}
          </button>
        </div>
        <div className="grid grid-cols-2 divide-x divide-slate-100 sm:grid-cols-4 dark:divide-slate-800">
          <div className="px-5 py-3"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{t('Newest season')}</p><p className="mt-1 font-mono text-sm font-bold text-slate-900 dark:text-slate-100">{newestSeason || '—'}</p></div>
          <div className="px-5 py-3"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{t('YTD reference')}</p><p className="mt-1 text-sm font-bold text-slate-900 dark:text-slate-100">{ytdReferenceSeason || '—'} · {t('First')} {ytdReferenceCount} {t('fixtures')}</p><p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{ytdReferenceOpponents.join(', ') || t('None yet')}</p></div>
          <div className="px-5 py-3"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{t('Fixtures selected')}</p><p className="mt-1 text-sm font-bold text-slate-900 dark:text-slate-100">{matchedFixtures} <span className="font-normal text-slate-400 dark:text-slate-500">· {knownGames} {t('with commercial data')}</span></p></div>
          <div className="px-5 py-3"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{t('Ticketing')}</p><p className="mt-1 text-sm font-bold text-slate-900 dark:text-slate-100">{includeTicketing ? t('Included in commercial total') : t('Excluded from commercial total')}</p></div>
        </div>
      </header>
      {excludedRecords > 0 && <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
        {excludedRecords} {t('source records excluded because their season or match date is invalid. No figures have been assigned to another season.')}
      </p>}

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 dark:border-slate-700 dark:bg-slate-900">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div><p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400">{t('Comparison lens')}</p>
            <h2 className="mt-1 text-base font-bold text-slate-900 dark:text-slate-100">{t(modeCaptions[mode])}</h2></div>
          <p className="text-xs text-slate-500 dark:text-slate-400">{t('Filters and options use the full fixture dataset.')}</p>
        </div>
        <ComparisonModeTabs value={mode} onChange={setMode} />
        {mode !== 'custom' ? <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MultiSelect label={t('Display seasons')} options={seasons} selected={seasonSelection} onChange={updateSeasonSelection} />
          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t('League')}
            <select value={selection.league} onChange={event => {
              const league = event.target.value;
              const nextOpponents = uniqueSorted(fixtures.filter(fixture => fixture.league === league).map(fixture => fixture.opponent));
              const nextCurrentOpponents = uniqueSorted(fixtures.filter(fixture => fixture.league === league && fixture.season === newestSeason).map(fixture => fixture.opponent));
              const nextTiers = uniqueSorted(fixtures.filter(fixture => fixture.league === league && fixture.tier !== undefined).map(fixture => String(fixture.tier)))
                .sort((a, b) => Number(a) - Number(b));
               setSelection(current => ({
                ...current, league,
                opponent: nextCurrentOpponents[0] || nextOpponents[0] || '',
                secondOpponent: '',
                tier: nextTiers[0] || '',
                week: 1,
                 ytdWeek: undefined,
              }));
            }}
              className="mt-1 block min-h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
              {leagues.map(league => <option key={league} value={league}>{league}</option>)}
            </select>
          </label>
          {mode === 'opponent' && <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t('Opponent')}
            <select value={selection.opponent} onChange={event => setSelection(current => ({ ...current, opponent: event.target.value, secondOpponent: '' }))}
              className="mt-1 block min-h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
              {leagueOpponents.map(opponent => <option key={opponent} value={opponent}>{opponent}</option>)}
            </select>
          </label>}
          {mode === 'opponent' && <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t('Compare with (optional)')}
            <select value={selection.secondOpponent || ''} onChange={event => setSelection(current => ({ ...current, secondOpponent: event.target.value }))}
              className="mt-1 block min-h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
              <option value="">{t('Same fixture across seasons')}</option>
              {leagueOpponents.filter(opponent => opponent !== selection.opponent).map(opponent => <option key={opponent} value={opponent}>{opponent}</option>)}
            </select>
          </label>}
          {mode === 'week' && <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t('Home game week')}
            <select value={selection.week} onChange={event => setSelection(current => ({ ...current, week: Number(event.target.value) }))}
              className="mt-1 block min-h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
              {Array.from({ length: Math.max(1, ...seasons.map(season => fixtures.filter(fixture => fixture.season === season && fixture.league === selection.league).length)) }, (_, index) => index + 1)
                 .map(week => <option key={week} value={week}>W{week}</option>)}
            </select>
          </label>}
          {mode === 'tier' && <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t('Tier')}
            <select value={selection.tier} onChange={event => setSelection(current => ({ ...current, tier: event.target.value }))}
              className="mt-1 block min-h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
              {selectedLeagueTiers.map(tier => <option key={tier} value={tier}>{t('Tier')} {tier}</option>)}
            </select>
          </label>}
          {(mode === 'ytd-week' || mode === 'ytd-opponent') && <>
            <YtdReferenceControls
              tone="slate"
              seasons={seasons}
              availableFixtures={ytdReference.availableFixtures}
              referenceSeason={selection.referenceSeason}
              ytdWeek={selection.ytdWeek}
              onReferenceSeasonChange={referenceSeason => setSelection(current => ({ ...current, referenceSeason, ytdWeek: undefined }))}
              onYtdWeekChange={ytdWeek => setSelection(current => ({ ...current, ytdWeek }))}
            />
            <div className="flex items-center gap-3 rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-900 sm:col-span-2 xl:col-span-2 dark:bg-rose-950/50 dark:text-rose-200">
              <CalendarDays size={17} className="shrink-0" /><span>{t('YTD reference')}: {ytdReferenceSeason || '—'} · {t('First')} {ytdReferenceCount} {t('fixtures')} · {ytdReferenceOpponents.join(', ') || t('None yet')}. {t('Changing display seasons does not change the reference.')}</span>
            </div>
          </>}
        </div> : <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-2">
          {(['A', 'B'] as const).map(side => {
            const filters = side === 'A' ? customA : customB;
            const matches = customSelect(filters);
            return <ComparisonCustomFiltersPanel key={side} side={side} filters={filters}
              options={{ seasons, leagues, opponents, tiers, dates }}
              onChange={(field, values) => setCustomFilter(side, field, values)}
              fixturesSelected={matches.length} fixturesWithData={matches.filter(fixture => fixture.data).length} />;
          })}
        </div>}
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-slate-100 pt-3 text-[11px] text-slate-500 dark:border-slate-800 dark:text-slate-400">
          <span>{t('GameDay commercial definition:')}</span>
          <span className="font-semibold text-slate-700 dark:text-slate-300">{t('Operational')} = F&B + Merchandising + Hospitality + Parking + Experience</span>
          <span>{t('Commercial total adds Sponsorship')}{includeTicketing ? ` + ${t('Ticketing')}` : ''}.</span>
          <span>{t('TV excluded; no costs or margin inferred.')}</span>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">{t('Included fixtures')}</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {displayGroups.map((group, index) => <div key={`${group.label}-${index}`} className="min-w-0 rounded-xl bg-slate-50 px-3 py-2.5 dark:bg-slate-800/70">
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{group.label}
              <span className="ml-2 font-mono font-semibold text-slate-500 dark:text-slate-400">{group.games.length}/{group.fixtureCount}</span>
            </p>
            <p className="mt-1 break-words text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
              {group.fixtures?.length ? group.fixtures.map(fixtureIdentity).join(' · ') : t('No matching fixtures')}
            </p>
          </div>)}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 dark:border-slate-700 dark:bg-slate-900">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div><p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400">{t('Chart selection')}</p>
            <h2 className="mt-1 text-base font-bold text-slate-900 dark:text-slate-100">{t('Choose six metrics')}</h2></div>
          <p className="text-xs text-slate-500 dark:text-slate-400">{t('Your six choices are saved on this device.')}</p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {metricSlots.map((key, index) => <label key={index} className="text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {t('Chart')} 0{index + 1}
            <select value={key} onChange={event => setMetric(index, event.target.value as GameDayMetricKey)}
              className="mt-1 block min-h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold normal-case tracking-normal text-slate-800 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
              {GAMEDAY_METRICS.map(metric => <option key={metric.key} value={metric.key}>{t(metric.label)}</option>)}
            </select>
          </label>)}
        </div>
      </section>

      <div className="space-y-4">
        <ComparisonBadges league={badgeLeague} opponents={badgeOpponents} />
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
          <TrendingUp size={14} className="text-teal-700" />
          {t('Columns show exact matching-group values. Seasonal linear regression appears only when there is one group per season; fixture identities are not treated as a growth series.')}
        </div>
        {selectedMetrics.some(key => key.startsWith('cagr')) && <p className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-xs text-teal-900 dark:border-teal-900 dark:bg-teal-950/50 dark:text-teal-200">
          <span className="font-bold">{t('CAGR baseline')}:</span> {cagrBaseline}
        </p>}
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {selectedMetrics.map((key, index) => <GameDayComparisonChart key={`${index}-${key}`} groups={displayGroups} metricKey={key}
            includeTicketing={includeTicketing} seasonal={mode !== 'custom'}
            highlightSeason={isYtdMode ? ytdReferenceSeason : undefined} translate={t} />)}
        </div>
      </div>

      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div><p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400">{t('Supporting detail')}</p>
            <h2 className="mt-1 text-lg font-black text-slate-900 dark:text-slate-100">{t('Channel performance & field coverage')}</h2></div>
          <p className="text-xs text-slate-500 dark:text-slate-400">{t('Expand a group to inspect revenue, per-game, per-person, share and change.')}</p>
        </div>
        {displayGroups.map((group, groupIndex) => {
          const rows = gameDayChannelRows(group, includeTicketing);
          const priorRows = groupIndex ? gameDayChannelRows(displayGroups[groupIndex - 1], includeTicketing) : [];
          const fieldCoverageMissing = gameDayCoverage(group, 'attendance') < group.games.length ||
            rows.some(row => row.coverage < group.games.length);
          const isPartial = group.missingFixtures > 0 || fieldCoverageMissing;
          const stateText = group.fixtureCount === 0 ? t('No matching fixtures')
            : group.games.length === 0 ? t('Schedule fixtures found · commercial data missing')
              : isPartial ? t('Partial field coverage') : t('Complete fixture data');
          return <details key={`${group.label}-${groupIndex}`} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3.5 marker:hidden">
              <span className="grid h-8 min-w-8 place-items-center rounded-lg bg-slate-100 px-2 font-mono text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">{String(groupIndex + 1).padStart(2, '0')}</span>
              <span className="min-w-[170px] flex-1 text-sm font-bold text-slate-900 dark:text-slate-100">{group.label}</span>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">{group.games.length}/{group.fixtureCount} {t('with data')}</span>
              <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${isPartial || !group.fixtureCount ? 'bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200' : 'bg-teal-50 text-teal-800 dark:bg-teal-950/50 dark:text-teal-200'}`}>{stateText}</span>
              <span className="text-xs text-slate-400 group-open:rotate-180">⌄</span>
            </summary>
            <div className="border-t border-slate-100 dark:border-slate-800">
              <p className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">{group.games.length} {t('reported GameDay records')} · {group.missingFixtures} {t('fixture records missing')} · {t('Attendance field coverage')} {gameDayCoverage(group, 'attendance')}/{group.fixtureCount}</p>
              {group.fixtures && group.fixtures.length > 0 && <p className="border-t border-slate-100 px-4 py-3 text-xs leading-relaxed text-slate-600 dark:border-slate-800 dark:text-slate-400">
                <span className="font-semibold text-slate-800 dark:text-slate-200">{t('Included fixtures')}: </span>
                {group.fixtures.map(fixtureIdentity).join(' · ')}
              </p>}
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] border-collapse text-left text-xs">
                  <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                    <tr><th className="px-4 py-2">{t('Channel')}</th><th className="px-3 py-2 text-right">{t('Revenue')}</th><th className="px-3 py-2 text-right">{t('€/game')}</th><th className="px-3 py-2 text-right">{t('€/person')}</th><th className="px-3 py-2 text-right">{t('Share')}</th><th className="px-3 py-2 text-right">{t('Change in €/game vs prior group')}</th><th className="px-4 py-2 text-right">{t('Coverage')}</th></tr>
                  </thead>
                  <tbody>{rows.map(row => {
                    const previous = priorRows.find(item => item.field === row.field)?.perGame;
                    const change = row.perGame === null || previous === null || previous === undefined || previous === 0
                      ? null : (row.perGame - previous) / Math.abs(previous) * 100;
                    return <tr key={row.field} className="border-t border-slate-100 text-slate-700 dark:border-slate-800 dark:text-slate-300">
                      <th scope="row" className={`px-4 py-2.5 font-semibold ${row.operational ? 'text-slate-800 dark:text-slate-200' : 'text-slate-500 dark:text-slate-400'}`}>{t(row.label)}{row.operational && <span className="ml-2 rounded bg-teal-50 px-1.5 py-0.5 text-[9px] font-bold uppercase text-teal-800 dark:bg-teal-950/50 dark:text-teal-200">{t('Operational')}</span>}</th>
                      <td className="px-3 py-2.5 text-right font-mono">{euros(row.revenue, locale)}</td>
                      <td className="px-3 py-2.5 text-right font-mono">{euros(row.perGame, locale)}</td>
                      <td className="px-3 py-2.5 text-right font-mono">{euros(row.perPerson, locale)}</td>
                      <td className="px-3 py-2.5 text-right font-mono">{row.share === null ? '—' : `${row.share.toFixed(1)}%`}</td>
                      <td className="px-3 py-2.5 text-right font-mono">{percentage(change)}</td>
                      <td className="px-4 py-2.5 text-right font-mono">{row.coverage}/{group.fixtureCount}</td>
                    </tr>;
                  })}</tbody>
                </table>
              </div>
              {group.fixtureCount === 0 && <p className="px-4 py-4 text-sm text-slate-500 dark:text-slate-400">{t('No fixtures match these filters. A dash indicates unavailable data, not zero.')}</p>}
            </div>
          </details>;
        })}
        <p className="rounded-xl bg-slate-100 px-4 py-3 text-xs leading-relaxed text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          {t('A dash means no matching fixture or an unreported field, never zero. Per-game averages use actual fixture counts; euros/person is calculated from total channel revenue divided by total reported attendance (weighted). Coverage counts reported values.')}
        </p>
      </section>
    </main>
  );
};