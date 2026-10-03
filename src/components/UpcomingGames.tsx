import React from 'react';
import type { GameData, GameDayData } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { fixtureDay } from '../utils/fixtureEligibility';
import { fixtureKey } from '../utils/gameDayComparison';

interface Props {
  ticketing: GameData[];
  gameDay?: GameDayData[];
  module: 'ticketing' | 'gameday';
}

// An isolated inspection view: opening an upcoming fixture never changes the
// played-game cohort used by the dashboards, forecasts, AI or comparisons.
export function UpcomingGames({ ticketing, gameDay = [], module }: Props) {
  const { t } = useLanguage();
  const fixtures = new Map<string, { ticket?: GameData; commercial?: GameDayData }>();
  ticketing.forEach(game => fixtures.set(fixtureKey(game), { ticket: game }));
  gameDay.forEach(game => {
    const key = fixtureKey(game);
    fixtures.set(key, { ...fixtures.get(key), commercial: game });
  });
  const sorted = [...fixtures.entries()].sort(([, a], [, b]) =>
    fixtureDay((a.ticket || a.commercial)!.date).localeCompare(fixtureDay((b.ticket || b.commercial)!.date)));
  if (!sorted.length) return null;
  const currency = (value: number) => value.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' });

  return <section className="mb-6 rounded-xl border border-amber-200 bg-white p-4 dark:border-amber-800 dark:bg-gray-900" aria-label={t('Upcoming games / On sale')}>
    <h2 className="font-semibold text-gray-900 dark:text-white">{t('Upcoming games / On sale')} ({sorted.length})</h2>
    {ticketing.length > 0 && <p className="mt-1 text-sm text-gray-700 dark:text-gray-200">{t('Advance ticket sales')}: <strong>{currency(ticketing.reduce((sum, game) => sum + game.totalRevenue, 0))}</strong></p>}
    <p className="mb-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
      {t('Open a game to inspect current sales. These figures are excluded from played-game averages, trends and projections.')}
    </p>
    <div className="space-y-2">
      {sorted.map(([key, { ticket, commercial }]) => {
        const fixture = (ticket || commercial)!;
        const streams = commercial ? [
          ['Ticketing', 'tixRevenue'], ['F&B', 'fbRevenue'], ['Merchandising', 'merchRevenue'],
          ['Hospitality', 'hospitalityRevenue'], ['Parking', 'parkingRevenue'],
          ['Experience', 'expRevenue'], ['Sponsorship', 'sponsorshipRevenue'],
        ] as const : [];
        return <details key={key} className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
          <summary className="cursor-pointer text-sm font-medium text-gray-900 dark:text-white">
            {fixture.opponent} · {fixture.date} · {fixture.league} · {fixture.season}
            <span className="ml-2 text-xs font-normal text-amber-700 dark:text-amber-400">{t('Upcoming / On sale')}</span>
          </summary>
          <div className="mt-3 space-y-3 text-sm text-gray-700 dark:text-gray-200">
            <p className="text-xs text-gray-500 dark:text-gray-400">{t('Fixture totals (all zones and channels)')}</p>
            {ticket && <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <p>{t('Ticket sales revenue')}: <strong>{currency(ticket.totalRevenue)}</strong></p>
              <p>{t('Tickets / allocations to date')}: <strong>{ticket.attendance.toLocaleString('it-IT')}</strong></p>
              <p>{t('Allocated capacity')}: <strong>{ticket.capacity > 0 ? `${(ticket.attendance / ticket.capacity * 100).toFixed(1)}%` : '—'}</strong></p>
            </div>}
            {module === 'ticketing' && ticket && <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead><tr><th className="py-2">{t('Zone')}</th><th>{t('Channel')}</th><th>{t('Tickets')}</th><th>{t('Revenue')}</th></tr></thead>
                <tbody>{ticket.salesBreakdown.map((sale, index) => <tr key={index} className="border-t border-gray-100 dark:border-gray-800">
                  <td className="py-2 pr-2">{sale.zone}</td><td className="pr-2">{sale.channel}</td>
                  <td className="pr-2">{sale.quantity.toLocaleString('it-IT')}</td><td>{currency(sale.revenue)}</td>
                </tr>)}</tbody>
              </table>
            </div>}
            {module === 'gameday' && (commercial ? <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {streams.map(([label, field]) => <p key={field}>{t(label)}: <strong>{commercial.reported?.[field] === false ? '—' : currency(commercial[field])}</strong></p>)}
            </div> : <p>{t('GameDay figures have not been reported yet.')}</p>)}
            <p className="text-xs text-amber-700 dark:text-amber-400">{t('Sales progress only, not final attendance. Included in performance from the following day (Europe/Rome).')}</p>
          </div>
        </details>;
      })}
    </div>
  </section>;
}