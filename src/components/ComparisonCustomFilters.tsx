import React from 'react';
import type { GameDayCustomFilters } from '../utils/gameDayComparison';
import { useLanguage } from '../contexts/LanguageContext';
import { MultiSelect } from './MultiSelect';

export interface ComparisonCustomOptions {
  seasons: string[];
  leagues: string[];
  opponents: string[];
  tiers: string[];
  dates: string[];
}

interface Props {
  side: 'A' | 'B';
  filters: GameDayCustomFilters;
  options: ComparisonCustomOptions;
  onChange: (field: keyof GameDayCustomFilters, values: string[]) => void;
  fixturesSelected?: number;
  fixturesWithData?: number;
}

export const ComparisonCustomFiltersPanel: React.FC<Props> = ({
  side, filters, options, onChange, fixturesSelected, fixturesWithData,
}) => {
  const { t } = useLanguage();
  const sideClass = side === 'A'
    ? 'border-slate-200 bg-slate-50/70 dark:border-slate-700 dark:bg-slate-800/60'
    : 'border-rose-200 bg-rose-50/40 dark:border-rose-900 dark:bg-rose-950/30';

  return (
    <section className={`rounded-2xl border p-4 ${sideClass}`}>
      <div className="mb-4 flex items-center gap-2">
        <span className={`grid h-7 w-7 place-items-center rounded-lg text-xs font-black ${side === 'A' ? 'bg-slate-800 text-white' : 'bg-rose-700 text-white'}`}>{side}</span>
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{t('Scenario')} {side}</h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">{side === 'A' ? t('Baseline selection') : t('Comparison selection')}</p>
        </div>
        {fixturesSelected !== undefined && <span className="ml-auto text-xs font-semibold text-slate-500 dark:text-slate-400">
          {fixturesWithData ?? 0}/{fixturesSelected} {t('fixtures')}
        </span>}
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <MultiSelect label={t('Seasons')} options={options.seasons} selected={filters.seasons} onChange={values => onChange('seasons', values)} />
        <MultiSelect label={t('Leagues')} options={options.leagues} selected={filters.leagues} onChange={values => onChange('leagues', values)} />
        <MultiSelect label={t('Opponents')} options={options.opponents} selected={filters.opponents} onChange={values => onChange('opponents', values)} />
        <MultiSelect label={t('Tiers')} options={options.tiers} selected={filters.tiers} onChange={values => onChange('tiers', values)} />
        <div className="sm:col-span-2">
          <MultiSelect label={t('Fixture identity · date / opponent / league / season')} options={options.dates} selected={filters.dates} onChange={values => onChange('dates', values)} />
        </div>
      </div>
    </section>
  );
};