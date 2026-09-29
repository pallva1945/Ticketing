import React from 'react';
import { leagueLogoSrc, opponentLogoSrc } from './comparisonReport';

interface Props {
  league?: string;
  opponents?: string[];
}

/** Only show crests that belong to the currently displayed comparison. */
export const ComparisonBadges: React.FC<Props> = ({ league, opponents = [] }) => {
  const uniqueOpponents = [...new Set(opponents.filter(Boolean))];
  if (!league && !uniqueOpponents.length) return null;
  const leagueLogo = league ? leagueLogoSrc(league) : null;

  return <div className="flex flex-wrap items-center gap-2" aria-label="Comparison teams and competition">
    {uniqueOpponents.map(name => {
      const logo = opponentLogoSrc(name);
      return <div key={name} className="flex min-h-11 items-center gap-2 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200">
        {logo && <img src={logo} alt="" className="h-8 w-8 shrink-0 object-contain" />}
        <span>{name}</span>
      </div>;
    })}
    {league && <div className="flex min-h-11 items-center gap-2 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200">
      {leagueLogo && <img src={leagueLogo} alt="" className="h-8 w-10 shrink-0 object-contain" />}
      <span>{league}</span>
    </div>}
  </div>;
};