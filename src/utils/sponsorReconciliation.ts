import type { SponsorData } from '../types';

export const SPONSOR_LBA_GAMES = 15;

// European reconciliation is an annual allocation ALREADY included in the
// existing GameDay total. The per-game European field is descriptive only:
// do not multiply it by an assumed number of European fixtures.
export function splitSponsorGameDay(sponsor: Pick<SponsorData, 'gamedayReconciliation' | 'europeanCompetitionReconciliation'>) {
  const total = sponsor.gamedayReconciliation * SPONSOR_LBA_GAMES;
  const european = sponsor.europeanCompetitionReconciliation ?? 0;
  return { total, lba: total - european, european };
}

export function totalSponsorGameDaySplit(sponsors: SponsorData[]) {
  return sponsors.reduce((totals, sponsor) => {
    const split = splitSponsorGameDay(sponsor);
    return {
      total: totals.total + split.total,
      lba: totals.lba + split.lba,
      european: totals.european + split.european,
    };
  }, { total: 0, lba: 0, european: 0 });
}