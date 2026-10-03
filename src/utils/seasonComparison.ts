import type { GameData, GameDayData } from '../types';
import { SalesChannel } from '../types';
import { getFixedCapacityForSeason } from '../constants';
import type { ComparisonReportGroup } from '../components/comparisonReport';
import {
  buildGameDayFixtures, buildGameDayGroups, fixtureKey, gameDaySeasons, selectGameDayCustom,
  type GameDayComparisonGroup, type GameDayCustomFilters,
} from './gameDayComparison';

export type SeasonComparisonMode = 'opponent' | 'week' | 'ytd' | 'ytd-week' | 'ytd-opponent' | 'tier';
export interface SeasonComparisonSelection {
  league: string;
  opponent: string;
  secondOpponent: string;
  firstTier: number | null;
  week: number;
  seasons?: string[];
}
const allFilters: GameDayCustomFilters = {
  seasons: ['All'], leagues: ['All'], opponents: ['All'], tiers: ['All'], dates: ['All'],
};
const compareGame = (game: GameData, viewMode: 'total' | 'gameday'): GameData => {
  const hasBreakdown = game.salesBreakdown.length > 0;
  const sales = viewMode === 'gameday'
    ? game.salesBreakdown.filter(s => [SalesChannel.TIX, SalesChannel.MP, SalesChannel.VB, SalesChannel.GIVEAWAY].includes(s.channel))
    : game.salesBreakdown;
  const zoneCapacities = Object.fromEntries(Object.entries(game.zoneCapacities || {}).map(([zone, capacity]) =>
    [zone, viewMode === 'gameday' ? Math.max(0, capacity - getFixedCapacityForSeason(game.season, zone)) : capacity]));
  return {
    ...game, salesBreakdown: sales,
    totalRevenue: hasBreakdown ? sales.reduce((sum, item) => sum + item.revenue, 0) : viewMode === 'total' ? game.totalRevenue : 0,
    attendance: hasBreakdown ? sales.reduce((sum, item) => sum + item.quantity, 0) : viewMode === 'total' ? game.attendance : 0,
    capacity: Object.keys(game.zoneCapacities || {}).length
      ? Object.values(zoneCapacities).reduce((sum, capacity) => sum + capacity, 0) : game.capacity,
    zoneCapacities,
  };
};
function ticketingGroup(group: GameDayComparisonGroup, fullData: GameData[], viewMode: 'total' | 'gameday'): ComparisonReportGroup {
  const byFixture = new Map(fullData.map(game => [fixtureKey(game), game]));
  const games = (group.fixtures || []).flatMap(fixture => {
    const game = byFixture.get(fixtureKey(fixture));
    return game && (viewMode === 'total' || game.salesBreakdown.length > 0) ? [compareGame(game, viewMode)] : [];
  });
  return { label: group.label, games, fixtures: group.fixtures, seriesKey: group.seriesKey,
    fixtureCount: group.fixtureCount, missingFixtures: group.fixtureCount - games.length };
}
export function buildSeasonComparison(
  fullData: GameData[], mode: SeasonComparisonMode, viewMode: 'total' | 'gameday',
  selection: SeasonComparisonSelection, scheduleData: GameDayData[] = [],
) {
  const fixtures = buildGameDayFixtures(scheduleData, fullData);
  const leagues = [...new Set(fixtures.map(fixture => fixture.league))].sort();
  const league = leagues.includes(selection.league) ? selection.league : leagues.includes('LBA') ? 'LBA' : leagues[0] || 'LBA';
  const leagueFixtures = fixtures.filter(fixture => fixture.league === league);
  // Both modules retain the same season horizon. A league with no games in
  // the current season must not silently switch YTD to a historical season.
  const seasons = gameDaySeasons(scheduleData, fullData);
  const currentSeason = seasons[seasons.length - 1];
  const currentFixtures = leagueFixtures.filter(fixture => fixture.season === currentSeason);
  const currentOpponents = [...new Set(currentFixtures.map(fixture => fixture.opponent))].sort();
  const opponents = [...new Set(leagueFixtures.map(fixture => fixture.opponent))].sort();
  const tiers = [...new Set(leagueFixtures.flatMap(fixture => fixture.tier === undefined ? [] : [fixture.tier]))].sort((a, b) => a - b);
  const selectedOpponent = opponents.includes(selection.opponent) ? selection.opponent : currentOpponents[0] || opponents[0] || '';
  const selectedSecond = selection.secondOpponent !== selectedOpponent && opponents.includes(selection.secondOpponent) ? selection.secondOpponent : '';
  const selectedFirstTier = selection.firstTier !== null && tiers.includes(selection.firstTier) ? selection.firstTier : tiers[0];
  const maxWeek = Math.max(1, ...seasons.map(season => leagueFixtures.filter(fixture => fixture.season === season).length));
  const selectedWeek = Math.max(1, Math.min(selection.week, maxWeek));
  const groups = buildGameDayGroups(fixtures, seasons, mode,
    { league, opponent: selectedOpponent, secondOpponent: selectedSecond, tier: String(selectedFirstTier ?? ''), week: selectedWeek },
    allFilters, allFilters)
    .filter(group => !selection.seasons || selection.seasons.includes('All') || (group.season && selection.seasons.includes(group.season)))
    .map(group => ticketingGroup(group, fullData, viewMode));
  const currentCount = currentFixtures.length;
  const title = mode === 'opponent' ? 'Opponent comparison' : mode === 'tier' ? 'Tier over the years' :
    mode === 'week' ? 'Week vs week' : mode === 'ytd-opponent' ? 'YTD by opponent' : 'YTD by week';
  const detail = mode === 'opponent' ? `${selectedOpponent}${selectedSecond ? ` vs ${selectedSecond}` : ''}` :
    mode === 'tier' ? `Tier ${selectedFirstTier ?? '—'}` : mode === 'week' ? `W${selectedWeek}` :
    mode === 'ytd-opponent' ? currentOpponents.join(' + ') || 'No opponents played' : currentCount ? `W1–W${currentCount}` : 'No weeks played';
  return { leagues, league, seasons, opponents, tiers, selectedOpponent, selectedSecond, selectedFirstTier,
    maxWeek, selectedWeek, currentCount, currentOpponents, groups, title,
    description: `${title} · ${detail} · per-game averages · ${league} · ${viewMode === 'total' ? 'Total' : 'GameDay'}`,
    currentLabels: groups.filter(group => group.label.startsWith(`${currentSeason} · `)).map(group => group.label) };
}
export function buildTicketingCustomComparison(
  fullData: GameData[], viewMode: 'total' | 'gameday', filtersA: GameDayCustomFilters,
  filtersB: GameDayCustomFilters, scheduleData: GameDayData[] = [],
): ComparisonReportGroup[] {
  const fixtures = buildGameDayFixtures(scheduleData, fullData);
  return [filtersA, filtersB].map((filters, index) => {
    const chosen = selectGameDayCustom(fixtures, filters);
    return ticketingGroup({ label: index ? 'Scenario B' : 'Scenario A', games: [],
      fixtureCount: chosen.length, missingFixtures: 0, fixtures: chosen }, fullData, viewMode);
  });
}