import { SalesChannel, type GameData } from '../types';
import { FIXED_CORP_25_26, getFixedCapacityForSeason, isSeason26_27 } from '../constants';

export type TicketingViewMode = 'total' | 'gameday';

const ALL_CHANNELS = [
  SalesChannel.ABB, SalesChannel.CORP, SalesChannel.TIX, SalesChannel.MP,
  SalesChannel.VB, SalesChannel.PROTOCOL, SalesChannel.GIVEAWAY,
];
const GAME_DAY_CHANNELS = [SalesChannel.TIX, SalesChannel.MP, SalesChannel.VB, SalesChannel.GIVEAWAY];

interface SalesTotals {
  revenue: number;
  quantity: number;
}

export interface UpcomingZoneRow extends SalesTotals {
  zone: string;
  channels: Partial<Record<SalesChannel, SalesTotals>>;
}

// Inspection-only aggregation. Never changes the raw fixture or played cohort.
export function upcomingTicketingSummary(game: GameData, viewMode: TicketingViewMode = 'total') {
  const channels = viewMode === 'gameday' ? GAME_DAY_CHANNELS : ALL_CHANNELS;
  const sales = game.salesBreakdown.filter(sale => channels.includes(sale.channel));
  const byZone = new Map<string, UpcomingZoneRow>();
  for (const sale of sales) {
    const row = byZone.get(sale.zone) || { zone: sale.zone, channels: {}, revenue: 0, quantity: 0 };
    const channel = row.channels[sale.channel] || { revenue: 0, quantity: 0 };
    channel.revenue += sale.revenue;
    channel.quantity += sale.quantity;
    row.channels[sale.channel] = channel;
    row.revenue += sale.revenue;
    row.quantity += sale.quantity;
    byZone.set(sale.zone, row);
  }

  const hasBreakdown = game.salesBreakdown.length > 0;
  const revenue = hasBreakdown ? sales.reduce((sum, sale) => sum + sale.revenue, 0)
    : viewMode === 'total' ? game.totalRevenue : null;
  const quantity = hasBreakdown ? sales.reduce((sum, sale) => sum + sale.quantity, 0)
    : viewMode === 'total' ? game.attendance : null;

  let capacity = game.capacity;
  if (viewMode === 'gameday') {
    capacity = Object.entries(game.zoneCapacities).reduce((sum, [zone, zoneCapacity]) => {
      const corp = game.salesBreakdown.filter(sale => sale.zone === zone && sale.channel === SalesChannel.CORP)
        .reduce((total, sale) => total + sale.quantity, 0);
      const additionalCorp = isSeason26_27(game.season) ? 0 : Math.max(0, corp - (FIXED_CORP_25_26[zone] || 0));
      return sum + Math.max(0, zoneCapacity - getFixedCapacityForSeason(game.season, zone) - additionalCorp);
    }, 0);
  }

  return { channels, rows: [...byZone.values()], revenue, quantity, capacity, hasBreakdown };
}