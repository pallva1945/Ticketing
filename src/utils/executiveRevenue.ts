import { getTicketingSeasonPlan } from './ticketingTargets';
import { getGameDaySeasonPlan } from './gameDayTargets';
import { compareRevenueForecast } from './revenueForecast';

/** Executive commercial streams: total Ticketing and GameDay net of Ticketing.
 * These plans never replace the independent monthly Google Sheet budgets.
 */
export function getExecutiveRevenue(
  seasons: string[], leagues: string[],
  ticketingRevenue: number, ticketingGames: number,
  gameDayRevenue: number, gameDayGames: number,
) {
  const stream = (current: number, played: number, plan: { target: number; games: number }) => {
    const hasData = played > 0;
    const projectedFinish = hasData ? current / played * plan.games : 0;
    const expected = plan.games > 0 ? plan.target * played / plan.games : 0;
    return {
      current, played, ...plan, hasData, projectedFinish,
      pacing: hasData && expected > 0 ? (current / expected - 1) * 100 : null,
      forecast: compareRevenueForecast(projectedFinish, plan.target, hasData),
    };
  };
  const ticketing = stream(ticketingRevenue, ticketingGames,
    getTicketingSeasonPlan(seasons, leagues, 'total', ticketingGames));
  const gameDay = stream(gameDayRevenue, gameDayGames,
    getGameDaySeasonPlan(seasons, leagues, false, gameDayGames));
  const combinedTarget = ticketing.target + gameDay.target;
  const combinedProjection = ticketing.projectedFinish + gameDay.projectedFinish;
  return {
    ticketing, gameDay,
    combined: {
      target: combinedTarget,
      projectedFinish: combinedProjection,
      forecast: compareRevenueForecast(combinedProjection, combinedTarget, ticketing.hasData && gameDay.hasData),
    },
  };
}
