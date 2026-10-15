import { SEASON_TARGET_GAMEDAY, SEASON_TARGET_GAMEDAY_TOTAL } from '../constants';
import { getTicketingSeasonPlan } from './ticketingTargets';
import type { GameDayData } from '../types';

/** GameDay revenue excluding Ticketing; these budgets apply only to 2026/27. */
export const GAMEDAY_TARGETS_26_27 = {
  LBA: 1275000,
  BCL: 180000,
  'LBA - Pre Season': 5000,
} as const;

function normalizeSeason(season: string) {
  const normalized = season.trim().replace(/\//g, '-');
  return ['26-27', '2026-2027', '2026-27'].includes(normalized) ? '26-27' : normalized;
}

export function getGameDaySeasonPlan(
  seasons: string[],
  leagues: string[],
  includeTicketing: boolean,
  playedGames = 0,
) {
  const normalizedSeasons = [...new Set(seasons.map(normalizeSeason))];
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

/** Sum competition forecasts, not a pooled average. Supply completed, filtered fixtures only. */
export function getGameDayRevenueForecast(
  seasons: string[],
  leagues: string[],
  includeTicketing: boolean,
  playedData: readonly Pick<GameDayData, 'season' | 'league' | 'totalRevenue' | 'tixRevenue'>[],
): { projectedRevenue: number | null; games: number } {
  let forecastCents = 0;
  let games = 0;
  let groups = 0;
  let complete = true;
  for (const season of new Set(seasons.map(normalizeSeason))) {
    const seasonData = playedData.filter(game => normalizeSeason(game.season) === season
      && (leagues.includes('All') || leagues.includes(game.league)));
    // Historical seasons retain a single original season budget and fixture baseline.
    const competitions: (string | null)[] = season === '26-27'
      ? Object.keys(GAMEDAY_TARGETS_26_27).filter(league => leagues.includes('All') || leagues.includes(league))
      : [null];
    if (season === '26-27' && seasonData.some(game => !(game.league in GAMEDAY_TARGETS_26_27))) {
      complete = false;
    }
    for (const competition of competitions) {
      groups++;
      const fixtures = competition === null ? seasonData : seasonData.filter(game => game.league === competition);
      const plan = getGameDaySeasonPlan([season], competition === null ? leagues : [competition], includeTicketing, fixtures.length);
      games += plan.games;
      if (!fixtures.length) {
        // Do not invent a projection for a competition that has not played.
        complete = false;
        continue;
      }
      const revenue = fixtures.reduce((sum, game) => sum + game.totalRevenue
        - (includeTicketing ? 0 : game.tixRevenue), 0);
      forecastCents += Math.round(revenue / fixtures.length * plan.games * 100);
    }
  }
  return {
    projectedRevenue: complete && groups > 0 ? forecastCents / 100 : null,
    games,
  };
}
