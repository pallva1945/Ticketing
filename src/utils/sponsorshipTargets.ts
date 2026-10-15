import { SEASON_TARGET_SPONSORSHIP } from '../constants';

/** Sponsorship + CSR only: excludes corporate tickets, GameDay and VB. */
export function getSponsorshipSeasonTarget(season: string): number {
  const normalized = season.trim().replace(/\//g, '-');
  return ['26-27', '2026-2027', '2026-27'].includes(normalized) ? 2400000 : SEASON_TARGET_SPONSORSHIP;
}
