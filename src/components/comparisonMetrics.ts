import { GameData } from '../types';
import { calculateKPIs } from './StatsCards';

export interface ComparisonMetrics {
  revenue: number | null;
  attendance: number | null;
  yield: number | null;
  loadFactor: number | null;
}

export function getComparisonMetrics(games: GameData[]): ComparisonMetrics {
  const stats = calculateKPIs(games);
  if (!stats) return { revenue: null, attendance: null, yield: null, loadFactor: null };

  const ticketCount = games.reduce((total, game) =>
    total + game.salesBreakdown.reduce((sum, sale) => sum + sale.quantity, 0), 0);
  const capacity = games.reduce((total, game) => total + game.capacity, 0);

  return {
    revenue: stats.totalRevenue,
    attendance: stats.totalAttendance,
    yield: ticketCount > 0 ? stats.yield_atp : null,
    loadFactor: capacity > 0 ? stats.occupancy : null,
  };
}