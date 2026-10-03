import React from 'react';
import type { GameData, GameDayData } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { fixtureDay } from '../utils/fixtureEligibility';
import { fixtureKey } from '../utils/gameDayComparison';
import { upcomingTicketingSummary, type TicketingViewMode } from '../utils/upcomingTicketing';

interface Props {
  ticketing: GameData[];
  gameDay?: GameDayData[];
  module: 'ticketing' | 'gameday';
  viewMode?: TicketingViewMode;
}

// An isolated inspection view: opening an upcoming fixture never changes the
// played-game cohort used by the dashboards, forecasts, AI or comparisons.
export function UpcomingGames({ ticketing, gameDay = [], module, viewMode = 'total' }: Props) {
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
  // Currency units are already in the column headings; keep table cells compact.
  const tableRevenue = (value: number) => value.toLocaleString('it-IT', { maximumFractionDigits: 2 });
  const ticketingSummaries = module === 'ticketing'
    ? ticketing.map(game => upcomingTicketingSummary(game, viewMode))
    : [];
  const combinedRevenue = ticketingSummaries.length > 0 && ticketingSummaries.every(summary => summary.revenue !== null)
    ? ticketingSummaries.reduce((sum, summary) => sum + (summary.revenue ?? 0), 0)
    : null;
  const formatMetric = (value: number | null) => value === null ? '—' : currency(value);
  const formatQuantity = (value: number | null) => value === null ? '—' : value.toLocaleString('it-IT');

  return <section className="mb-6 rounded-xl border border-amber-200 bg-white p-4 dark:border-amber-800 dark:bg-gray-900" aria-label={t('Upcoming games / On sale')}>
    <h2 className="font-semibold text-gray-900 dark:text-white">{t('Upcoming games / On sale')} ({sorted.length})</h2>
    {ticketing.length > 0 && <p className="mt-1 text-sm text-gray-700 dark:text-gray-200">{t('Advance ticket sales')}: <strong>{module === 'ticketing'
      ? formatMetric(combinedRevenue)
      : currency(ticketing.reduce((sum, game) => sum + game.totalRevenue, 0))}</strong></p>}
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
            <p className="text-xs text-gray-500 dark:text-gray-400">{t(module === 'ticketing' && viewMode === 'gameday'
              ? 'Fixture totals (GameDay tickets only)'
              : 'Fixture totals (all zones and channels)')}</p>
            {ticket && <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {module === 'ticketing' ? (() => {
                const summary = upcomingTicketingSummary(ticket, viewMode);
                return <>
                  <p>{t('Ticket sales revenue')}: <strong>{formatMetric(summary.revenue)}</strong></p>
                  <p>{t('Tickets / allocations to date')}: <strong>{formatQuantity(summary.quantity)}</strong></p>
                  <p>{t('Allocated capacity')}: <strong>{summary.quantity !== null && summary.capacity > 0
                    ? `${(summary.quantity / summary.capacity * 100).toFixed(1)}%`
                    : '—'}</strong></p>
                </>;
              })() : <>
                <p>{t('Ticket sales revenue')}: <strong>{currency(ticket.totalRevenue)}</strong></p>
                <p>{t('Tickets / allocations to date')}: <strong>{ticket.attendance.toLocaleString('it-IT')}</strong></p>
                <p>{t('Allocated capacity')}: <strong>{ticket.capacity > 0 ? `${(ticket.attendance / ticket.capacity * 100).toFixed(1)}%` : '—'}</strong></p>
              </>}
            </div>}
            {module === 'ticketing' && ticket && (() => {
              const summary = upcomingTicketingSummary(ticket, viewMode);
              if (!summary.hasBreakdown) {
                return <p className="text-xs text-gray-500 dark:text-gray-400">{t('No channel breakdown available.')}</p>;
              }
              if (summary.rows.length === 0) {
                return <p className="text-xs text-gray-500 dark:text-gray-400">{t('No GameDay tickets allocated yet.')}</p>;
              }
              return <div className="max-w-full overflow-x-auto overscroll-x-contain rounded-md border border-gray-100 dark:border-gray-800">
                <table className="w-full min-w-max border-collapse text-xs tabular-nums">
                  <thead className="bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                    <tr>
                      <th scope="col" className="sticky left-0 z-10 bg-gray-50 py-2 pl-2 pr-3 text-left font-semibold dark:bg-gray-800">{t('Zone')}</th>
                      {summary.channels.map(channel => <React.Fragment key={channel}>
                        <th scope="col" aria-label={`${channel} revenue`} className="px-2 py-2 text-right font-semibold">{channel} €</th>
                        <th scope="col" aria-label={`${channel} tickets`} className="px-2 py-2 text-right font-semibold">{channel} #</th>
                      </React.Fragment>)}
                      <th scope="col" aria-label={`${t('Total')} ${t('Revenue')}`} className="border-l border-gray-200 px-2 py-2 text-right font-semibold dark:border-gray-700">{t('Total')} €</th>
                      <th scope="col" aria-label={`${t('Total')} ${t('Tickets')}`} className="px-2 py-2 pr-3 text-right font-semibold">{t('Total')} #</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.rows.map(row => <tr key={row.zone} className="border-t border-gray-100 dark:border-gray-800">
                      <th scope="row" className="sticky left-0 z-[1] bg-white py-2 pl-2 pr-3 text-left font-medium text-gray-800 dark:bg-gray-900 dark:text-gray-100">{row.zone}</th>
                      {summary.channels.map(channel => {
                        const sales = row.channels[channel] || { revenue: 0, quantity: 0 };
                        return <React.Fragment key={channel}>
                          <td className="px-2 py-2 text-right whitespace-nowrap">{tableRevenue(sales.revenue)}</td>
                          <td className="px-2 py-2 text-right whitespace-nowrap">{sales.quantity.toLocaleString('it-IT')}</td>
                        </React.Fragment>;
                      })}
                      <td className="border-l border-gray-100 px-2 py-2 text-right whitespace-nowrap font-medium dark:border-gray-800">{tableRevenue(row.revenue)}</td>
                      <td className="px-2 py-2 pr-3 text-right whitespace-nowrap font-medium">{row.quantity.toLocaleString('it-IT')}</td>
                    </tr>)}
                  </tbody>
                  <tfoot className="border-t border-gray-200 bg-gray-50 font-semibold text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100">
                    <tr>
                      <th scope="row" className="sticky left-0 z-[1] bg-gray-50 py-2 pl-2 pr-3 text-left dark:bg-gray-800">{t('Total')}</th>
                      {summary.channels.map(channel => {
                        const totals = summary.rows.reduce((sum, row) => {
                          const sales = row.channels[channel];
                          return {
                            revenue: sum.revenue + (sales?.revenue || 0),
                            quantity: sum.quantity + (sales?.quantity || 0),
                          };
                        }, { revenue: 0, quantity: 0 });
                        return <React.Fragment key={channel}>
                          <td className="px-2 py-2 text-right whitespace-nowrap">{tableRevenue(totals.revenue)}</td>
                          <td className="px-2 py-2 text-right whitespace-nowrap">{totals.quantity.toLocaleString('it-IT')}</td>
                        </React.Fragment>;
                      })}
                      <td className="border-l border-gray-200 px-2 py-2 text-right whitespace-nowrap dark:border-gray-700">{tableRevenue(summary.rows.reduce((sum, row) => sum + row.revenue, 0))}</td>
                      <td className="px-2 py-2 pr-3 text-right whitespace-nowrap">{summary.rows.reduce((sum, row) => sum + row.quantity, 0).toLocaleString('it-IT')}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>;
            })()}
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