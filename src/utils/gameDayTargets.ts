import { SEASON_TARGET_GAMEDAY, SEASON_TARGET_GAMEDAY_TOTAL } from '../constants';
import { getTicketingSeasonPlan } from './ticketingTargets';

/** GameDay revenue excluding Ticketing; these budgets apply only to 2026/27. */
export const GAMEDAY_TARGETS_26_27 = {
  LBA: 1275000,
  BCL: 180000,
  'LBA - Pre Season': 5000,
} as const;

export function getGameDaySeasonPlan(
  seasons: string[],
  leagues: string[],
  includeTicketing: boolean,
  playedGames = 0,
) {
  const normalizedSeasons = [...new Set(seasons.map(season => {
    const normalized = season.trim().replace(/\//g, '-');
    return ['26-27', '2026-2027', '2026-27'].includes(normalized) ? '26-27' : normalized;
  }))];
  let target = 0;
  for (const season of normalizedSeasons) {
    if (season === '26-27') {
      for (const [league, budget] of Object.entries(GAMEDAY_TARGETS_26_27)) {
        if (leagues.includes('All') || leagues.includes(league)) target += budget;
      }
      if (includeTicketing) {
        target += getTicketingSeasonPlan([season], leagues, 'total').target;
      }
    } else {
      // Historical combined budgets remain exactly as originally configured.
      target += includeTicketing ? SEASON_TARGET_GAMEDAY_TOTAL : SEASON_TARGET_GAMEDAY;
    }
  }
  // Both revenue streams cover the same home fixtures; do not count games twice.
  const { games } = getTicketingSeasonPlan(normalizedSeasons, leagues, 'total', playedGames);
  return { target, games };
}
