import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

export type ComparisonMode = 'opponent' | 'tier' | 'week' | 'ytd-week' | 'ytd-opponent' | 'custom';

interface ComparisonModeTabsProps {
  value: ComparisonMode;
  onChange: (value: ComparisonMode) => void;
}

const modes: { value: ComparisonMode; label: string }[] = [
  { value: 'opponent', label: 'Opponent vs opponent' },
  { value: 'tier', label: 'Tier over the years' },
  { value: 'week', label: 'Week vs week' },
  { value: 'ytd-week', label: 'YTD by week' },
  { value: 'ytd-opponent', label: 'YTD by opponent' },
  { value: 'custom', label: 'Custom' },
];

export const ComparisonModeTabs: React.FC<ComparisonModeTabsProps> = ({ value, onChange }) => {
  const { t } = useLanguage();

  return (
    <div className="flex flex-wrap gap-2" role="tablist" aria-label={t('Comparison type')}>
      {modes.map(mode => (
        <button
          key={mode.value}
          type="button"
          role="tab"
          aria-selected={value === mode.value}
          onClick={() => onChange(mode.value)}
          className={`rounded-lg px-4 py-2.5 text-sm font-semibold border transition-colors ${
            value === mode.value
              ? 'bg-red-600 border-red-600 text-white'
              : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-red-300'
          }`}
        >
          {t(mode.label)}
        </button>
      ))}
    </div>
  );
};