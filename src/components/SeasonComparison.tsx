import React, { useMemo, useState } from 'react';
import { Printer } from 'lucide-react';
import { GameData, SalesChannel } from '../types';
import { calculateKPIs } from './StatsCards';
import { printComparisonReport, ComparisonReportGroup } from './comparisonReport';
import { useLanguage } from '../contexts/LanguageContext';
import { FIXED_CAPACITY_25_26 } from '../constants';

export type SeasonComparisonMode = 'opponent' | 'week' | 'ytd';

interface Props {
  fullData: GameData[];
  mode: SeasonComparisonMode;
  viewMode: 'total' | 'gameday';
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
  const capacities = Object.entries(game.zoneCapacities || {}).reduce((sum, [zone, capacity]) =>
    sum + (viewMode === 'gameday' ? Math.max(0, capacity - (FIXED_CAPACITY_25_26[zone] || 0)) : capacity), 0);
  return {
    ...game,
    salesBreakdown: sales,
    totalRevenue: hasBreakdown ? sales.reduce((sum, item) => sum + item.revenue, 0) :
      (viewMode === 'total' ? game.totalRevenue : 0),
    attendance: hasBreakdown ? sales.reduce((sum, item) => sum + item.quantity, 0) :
      (viewMode === 'total' ? game.attendance : 0),
    capacity: Object.keys(game.zoneCapacities || {}).length ? capacities : game.capacity,
  };
};

const formatMoney = (value: number) => `€${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

export const SeasonComparison: React.FC<Props> = ({ fullData, mode, viewMode }) => {
  const { t } = useLanguage();
  const leagues = useMemo(() => Array.from(new Set(fullData.map(g => g.league))).sort(), [fullData]);
  const [league, setLeague] = useState('LBA');
  const [opponent, setOpponent] = useState('');
  const [secondOpponent, setSecondOpponent] = useState('');
  const [week, setWeek] = useState(1);

  const seasons = useMemo(() =>
    Array.from(new Set(fullData.filter(g => g.league === league).map(g => g.season)))
      .sort((a, b) => seasonOrder(b) - seasonOrder(a)).slice(0, 4),
    [fullData, league]
  );
  const currentSeason = seasons[0];
  const seasonGames = useMemo(() => seasons.map(season => ({
    season,
    games: fullData.filter(g => g.league === league && g.season === season)
      .sort((a, b) => gameTimestamp(a.date) - gameTimestamp(b.date) || a.id.localeCompare(b.id)),
  })), [fullData, league, seasons]);
  const opponents = useMemo(() =>
    Array.from(new Set(seasonGames.flatMap(s => s.games.map(g => g.opponent)))).sort(),
    [seasonGames]
  );
  const currentOpponents = seasonGames[0]?.games.map(g => g.opponent) || [];
  const selectedOpponent = opponents.includes(opponent) ? opponent : (currentOpponents[0] || opponents[0] || '');
  const selectedSecond = secondOpponent !== selectedOpponent && opponents.includes(secondOpponent) ? secondOpponent : '';
  const currentCount = seasonGames[0]?.games.length || 0;
  const maxWeek = Math.max(1, ...seasonGames.map(s => s.games.length));
  const selectedWeek = Math.min(week, maxWeek);

  const groups: ComparisonReportGroup[] = useMemo(() => {
    if (mode === 'ytd' && currentCount === 0) return [];
    const chosen = mode === 'opponent'
      ? [selectedOpponent, ...(selectedSecond ? [selectedSecond] : [])].filter(Boolean)
      : [''];
    return seasonGames.flatMap(({ season, games }) => chosen.map(name => ({
      label: mode === 'opponent' ? `${season} · ${name}` : season,
      games: (mode === 'opponent' ? games.filter(g => g.opponent === name) :
        mode === 'week' ? games.slice(selectedWeek - 1, selectedWeek) :
        games.slice(0, currentCount)).filter(g => viewMode === 'total' || g.salesBreakdown.length > 0)
        .map(g => compareGame(g, viewMode)),
    })));
  }, [seasonGames, mode, selectedOpponent, selectedSecond, selectedWeek, currentCount, viewMode]);

  const description = mode === 'opponent'
    ? `${selectedOpponent}${selectedSecond ? ` vs ${selectedSecond}` : ''} · ${league} · ${viewMode === 'total' ? 'Total' : 'GameDay'}`
    : mode === 'week'
      ? `Home game week ${selectedWeek} in each season · ${league} · ${viewMode === 'total' ? 'Total' : 'GameDay'}`
      : `First ${currentCount} home ${currentCount === 1 ? 'game' : 'games'} in each season · ${league} · ${viewMode === 'total' ? 'Total' : 'GameDay'}`;
  const title = mode === 'opponent' ? 'Opponent comparison' : mode === 'week' ? 'Week-by-week comparison' : 'Season to date comparison';
  const maxRevenue = Math.max(1, ...groups.map(group => calculateKPIs(group.games)?.totalRevenue || 0));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-5">
        <div className="flex flex-wrap gap-4 items-end">
          <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">
            {t('League')}
            <select value={league} onChange={event => { setLeague(event.target.value); setOpponent(''); setSecondOpponent(''); setWeek(1); }}
              className="block mt-1 min-w-32 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm">
              {leagues.map(value => <option key={value} value={value}>{value}</option>)}
            </select>
          </label>
          {mode === 'opponent' && <>
            <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">
              {t('Opponent')}
              <select value={selectedOpponent} onChange={event => setOpponent(event.target.value)}
                className="block mt-1 min-w-40 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm">
                {opponents.map(value => <option key={value} value={value}>{value}</option>)}
              </select>
            </label>
            <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">
              Compare with (optional)
              <select value={selectedSecond} onChange={event => setSecondOpponent(event.target.value)}
                className="block mt-1 min-w-40 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm">
                <option value="">Same fixture across seasons</option>
                {opponents.filter(value => value !== selectedOpponent).map(value => <option key={value} value={value}>{value}</option>)}
              </select>
            </label>
          </>}
          {mode === 'week' && <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">
            Home game week
            <select value={selectedWeek} onChange={event => setWeek(Number(event.target.value))}
              className="block mt-1 min-w-32 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm">
              {Array.from({ length: maxWeek }, (_, index) => <option key={index} value={index + 1}>W{index + 1}</option>)}
            </select>
          </label>}
        </div>
        <button onClick={() => printComparisonReport(title, description, groups)} disabled={groups.length === 0}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-900 text-white dark:bg-white dark:text-gray-900 text-sm font-semibold disabled:opacity-50">
          <Printer size={16} /> {t('Print / Save PDF')}
        </button>
      </div>

      <div className="text-sm text-gray-600 dark:text-gray-400">
        <strong className="text-gray-900 dark:text-white">{description}</strong>
        <span className="block mt-1">
          {mode === 'week' ? 'Weeks follow the chronological order of home league games within each season.' :
            mode === 'ytd' ? 'YTD aligns prior seasons to the number of games played this season, not their full-season totals.' :
            'Select one opponent to compare the same fixture across seasons, or add a second opponent.'}
        </span>
      </div>

      {groups.length === 0 ? <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-10 text-center text-gray-500">
        No games are available for this comparison yet.
      </div> : <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <table className="w-full min-w-[780px] text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800 text-xs uppercase tracking-wide text-gray-500 dark:text-gray-300">
            <tr><th className="text-left px-5 py-4">Season / selection</th><th className="text-left px-4 py-4 w-1/3">Revenue</th>
              <th className="text-right px-4 py-4">Games</th><th className="text-right px-4 py-4">Revenue / game</th>
              <th className="text-right px-4 py-4">Avg attendance</th><th className="text-right px-4 py-4">Load factor</th>
              <th className="text-right px-5 py-4">Current vs row</th></tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {groups.map(group => {
              const stats = calculateKPIs(group.games);
              const isCurrent = group.label.startsWith(`${currentSeason} `) || group.label === currentSeason;
              const selection = mode === 'opponent' ? group.label.split(' · ').slice(1).join(' · ') : '';
              const currentGroup = groups.find(candidate => candidate.label ===
                (mode === 'opponent' ? `${currentSeason} · ${selection}` : currentSeason));
              const currentStats = currentGroup ? calculateKPIs(currentGroup.games) : null;
              const variance = !isCurrent && stats && currentStats && stats.totalRevenue > 0
                ? ((currentStats.totalRevenue - stats.totalRevenue) / stats.totalRevenue) * 100 : null;
              return <tr key={group.label} className={isCurrent ? 'bg-red-50/60 dark:bg-red-900/10' : ''}>
                <th scope="row" className="text-left px-5 py-4 font-semibold text-gray-900 dark:text-white">
                  {group.label}{isCurrent && <span className="ml-2 text-xs font-normal text-red-700 dark:text-red-400">Current</span>}
                  {mode !== 'ytd' && group.games.length > 0 && <span className="block text-xs font-normal text-gray-500 dark:text-gray-400 mt-1">
                    {group.games.map(game => `${game.date} ${game.opponent}`).join(' · ')}
                  </span>}
                </th>
                <td className="px-4 py-4">
                  {stats ? <div className="flex items-center gap-3"><span className="font-semibold tabular-nums whitespace-nowrap text-gray-900 dark:text-white">{formatMoney(stats.totalRevenue)}</span>
                    <div className="flex-1 rounded-full bg-gray-100 dark:bg-gray-700 h-2 min-w-12"><div className={`h-2 rounded-full ${isCurrent ? 'bg-red-600' : 'bg-gray-400'}`} style={{ width: `${Math.max(0, stats.totalRevenue / maxRevenue * 100)}%` }} /></div></div> : <span className="text-gray-400">No game</span>}
                </td>
                <td className="text-right px-4 py-4">{stats?.gameCount ?? '—'}</td>
                <td className="text-right px-4 py-4">{stats ? formatMoney(stats.arpg) : '—'}</td>
                <td className="text-right px-4 py-4">{stats ? Math.round(stats.totalAttendance / stats.gameCount).toLocaleString() : '—'}</td>
                <td className="text-right px-4 py-4">{stats ? `${stats.occupancy.toFixed(1)}%` : '—'}</td>
                <td className={`text-right px-5 py-4 font-semibold ${variance === null ? 'text-gray-400' : variance >= 0 ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                  {variance === null ? '—' : `${variance > 0 ? '+' : ''}${variance.toFixed(1)}%`}
                </td>
              </tr>;
            })}
          </tbody>
        </table>
      </div>}
      {viewMode === 'gameday' && <p className="text-xs text-gray-500">Games without channel-level ticket data are shown as missing in GameDay view.</p>}
    </div>
  );
};