import React from 'react';
import { TrendingUp, TrendingDown, BarChart3, ArrowRight, Lock } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { PV_LOGO_URL } from '../constants';

interface FinancialCenterProps {
  onNavigate: (section: string) => void;
}

export const FinancialCenter: React.FC<FinancialCenterProps> = ({ onNavigate }) => {
  const { theme, toggleTheme } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();
  const isDark = theme === 'dark';

  const sections = [
    {
      id: 'revenue',
      title: t('Revenue Center'),
      description: t('Track all revenue streams including ticketing, sponsorship, merchandising, game day operations, and more.'),
      icon: TrendingUp,
      color: 'from-green-500 to-emerald-600',
      iconBg: 'bg-green-100 dark:bg-green-900/30',
      iconColor: 'text-green-600',
      available: true,
    },
    {
      id: 'cost',
      title: t('Cost Center'),
      description: t('Monitor and analyze operational costs, player salaries, facility expenses, and budget allocation.'),
      icon: TrendingDown,
      color: 'from-red-500 to-rose-600',
      iconBg: 'bg-red-100 dark:bg-red-900/30',
      iconColor: 'text-red-600',
      available: true,
    },
    {
      id: 'pnl',
      title: t('Verticals P&Ls'),
      description: t('Profit and loss analysis by business vertical — ticketing, sponsorship, merchandising, venue ops, and more.'),
      icon: BarChart3,
      color: 'from-blue-500 to-indigo-600',
      iconBg: 'bg-blue-100 dark:bg-blue-900/30',
      iconColor: 'text-blue-600',
      available: true,
    },
  ];

  return (
    <div className={`min-h-screen ${isDark ? 'dark bg-gray-950' : 'bg-gray-50'}`}>
      <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
        <button
          onClick={toggleLanguage}
          className="px-3 py-2 rounded-lg text-sm font-medium bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shadow-sm"
        >
          {language === 'en' ? '🇮🇹 IT' : '🇬🇧 EN'}
        </button>
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shadow-sm"
        >
          {isDark ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
          )}
        </button>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-16 sm:py-24">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <button onClick={() => onNavigate('hub')} className="hover:opacity-70 transition-opacity">
              <img src={PV_LOGO_URL} alt="Pallacanestro Varese" className="w-20 h-20 object-contain" />
            </button>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-3 tracking-tight">
            PV Internal Portal
          </h1>
          <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
            {t('Comprehensive financial intelligence for Pallacanestro Varese')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                onClick={() => section.available ? onNavigate(section.id) : null}
                disabled={!section.available}
                className={`group relative text-left rounded-2xl border transition-all duration-300 overflow-hidden ${
                  section.available
                    ? 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-xl cursor-pointer'
                    : 'bg-gray-100 dark:bg-gray-900/50 border-gray-200 dark:border-gray-800/50 cursor-not-allowed opacity-60'
                }`}
              >
                <div className="p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div className={`w-14 h-14 rounded-xl ${section.iconBg} flex items-center justify-center`}>
                      <Icon size={28} className={section.iconColor} />
                    </div>
                    {section.available ? (
                      <ArrowRight size={20} className="text-gray-300 dark:text-gray-600 group-hover:text-gray-500 dark:group-hover:text-gray-400 group-hover:translate-x-1 transition-all" />
                    ) : (
                      <div className="flex items-center gap-1.5 text-gray-400 dark:text-gray-600">
                        <Lock size={14} />
                        <span className="text-xs font-medium">{t('Coming Soon')}</span>
                      </div>
                    )}
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    {section.title}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                    {section.description}
                  </p>
                </div>
                {section.available && (
                  <div className={`h-1 bg-gradient-to-r ${section.color} opacity-0 group-hover:opacity-100 transition-opacity`} />
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-16 text-center">
          <p className="text-xs text-gray-400 dark:text-gray-600">
            Pallacanestro Varese &middot; {t('Season')} 2025/26
          </p>
        </div>
      </div>
    </div>
  );
};
