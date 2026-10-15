import { SEASON_TARGET_TOTAL, SEASON_TARGET_TICKETING_DAY } from '../constants';

/** Ticketing budgets for 2026/27 only. Historical budgets remain unchanged. */
export const TICKETING_TARGETS_26_27 = {
  LBA: { target: 1850000, games: 15 },
  BCL: { target: 210000, games: 3 },
  'LBA - Pre Season': { target: 12500, games: 1 },
} as const;

export function getTicketingSeasonPlan(
  seasons: string[],
  leagues: string[],
  viewMode: 'total' | 'gameday',
  playedGames = 0,
) {
  let target = 0;
  let games = 0;
  const normalizedSeasons = [...new Set(seasons.map(season => {
    const normalized = season.trim().replace(/\//g, '-');
    return ['26-27', '2026-2027', '2026-27'].includes(normalized) ? '26-27' : normalized;
  }))];
  for (const season of normalizedSeasons) {
    if (season === '26-27') {
      for (const [league, plan] of Object.entries(TICKETING_TARGETS_26_27)) {
        if (leagues.includes('All') || leagues.includes(league)) {
          target += plan.target;
          games += plan.games;
        }
      }
    } else {
      // Do not apply the new competition budgets to previous seasons.
      target += viewMode === 'gameday' ? SEASON_TARGET_TICKETING_DAY : SEASON_TARGET_TOTAL;
      games += 15;
    }
  }
  return { target, games: Math.max(games, playedGames) };
}
