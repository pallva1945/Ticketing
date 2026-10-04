/** Guaranteed revenue fixtures only; potential additional BCL games are not assumed. */
export function getDefaultRevenueLeagues(season: string): string[] {
  const normalized = season.trim().replace(/\//g, '-');
  return ['26-27', '2026-2027', '2026-27'].includes(normalized) ? ['All'] : ['LBA'];
}

export function getRevenueSeasonGames(season: string, playedGames = 0): number {
  const normalized = season.trim().replace(/\//g, '-');
  const baseline = ['26-27', '2026-2027', '2026-27'].includes(normalized) ? 19 : 15;
  // Once extra games have actually happened, never project less than earned revenue.
  return Math.max(baseline, playedGames);
}