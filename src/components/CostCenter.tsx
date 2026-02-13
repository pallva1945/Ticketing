import React, { useState } from 'react';
import { Calendar, Flag, Activity, Landmark, ShoppingBag, Users, GraduationCap, Construction, Sun, Moon, PieChart, TrendingUp, Briefcase, Building2 } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { PV_LOGO_URL } from '../constants';
import { BOpsCostDashboard } from './BOpsCostDashboard';
import { GameDayCostDashboard } from './GameDayCostDashboard';
import { SponsorshipCostDashboard } from './SponsorshipCostDashboard';
import { VenueOpsCostDashboard } from './VenueOpsCostDashboard';
import { MerchandisingCostDashboard } from './MerchandisingCostDashboard';

type CostModule = 'overview' | 'gameday' | 'sponsorship' | 'bops' | 'venue_ops' | 'merchandising' | 'ebp' | 'varese_basketball';

const formatCurrency = (val: number) => `€${val.toLocaleString('it-IT', { maximumFractionDigits: 0 })}`;

interface CostCenterProps {
  onBackToLanding: () => void;
}

export const CostCenter: React.FC<CostCenterProps> = ({ onBackToLanding }) => {
  const { theme, toggleTheme } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();
  const isDark = theme === 'dark';
  const [activeModule, setActiveModule] = useState<CostModule>('overview');

  const MODULES: { id: CostModule; label: string; icon: any }[] = [
    { id: 'overview', label: t('Executive Overview'), icon: PieChart },
    { id: 'bops', label: t('BOps'), icon: Activity },
    { id: 'gameday', label: t('GameDay'), icon: Calendar },
    { id: 'sponsorship', label: t('Sponsorship'), icon: Flag },
    { id: 'venue_ops', label: t('Venue Ops'), icon: Landmark },
    { id: 'merchandising', label: t('Merchandising'), icon: ShoppingBag },
    { id: 'ebp', label: t('EBP'), icon: Users },
    { id: 'varese_basketball', label: t('Varese Basketball'), icon: GraduationCap },
  ];

  const activeModuleInfo = MODULES.find(m => m.id === activeModule);
  const ActiveIcon = activeModuleInfo?.icon || Construction;

  return (
    <div className={`min-h-screen ${isDark ? 'dark bg-gray-950 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <header className={`sticky top-0 z-30 ${isDark ? 'bg-gray-900/95 border-gray-800' : 'bg-white/95 border-gray-200'} border-b backdrop-blur-md`}>
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <button onClick={onBackToLanding} className="w-8 h-8 flex-shrink-0 hover:opacity-70 transition-opacity" title={t('Back to Financial Center')}>
              <img src={PV_LOGO_URL} alt="PV" className="w-full h-full object-contain" />
            </button>

            <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 hidden md:block"></div>
            <div className="hidden md:flex items-center gap-1 overflow-x-auto">
              {MODULES.map((module) => (
                <button
                  key={module.id}
                  onClick={() => setActiveModule(module.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                    activeModule === module.id
                      ? 'bg-red-600 text-white shadow-lg shadow-red-600/20'
                      : isDark
                        ? 'text-gray-400 hover:text-white hover:bg-gray-800'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <module.icon size={16} />
                  {module.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleLanguage}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isDark ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {language === 'en' ? '\u{1F1EE}\u{1F1F9} IT' : '\u{1F1EC}\u{1F1E7} EN'}
            </button>
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg transition-colors ${isDark ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </div>

        <div className="md:hidden overflow-x-auto px-4 pb-2">
          <div className="flex items-center gap-1">
            {MODULES.map((module) => (
              <button
                key={module.id}
                onClick={() => setActiveModule(module.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  activeModule === module.id
                    ? 'bg-red-600 text-white'
                    : isDark
                      ? 'text-gray-400 hover:bg-gray-800'
                      : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <module.icon size={14} />
                {module.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {activeModule === 'overview' ? (
          <div className="space-y-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
                <PieChart size={28} className="text-red-600" />
                {t('Cost Center')} — {t('Executive Overview')}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('Season')} 2025/26</p>
            </div>

            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                  <Briefcase size={16} className="text-red-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-800 dark:text-white">{t('Cost of Sales')}</h2>
                  <p className="text-[11px] text-gray-400 dark:text-gray-500">{t('Direct costs tied to revenue verticals')}</p>
                </div>
                <div className="ml-auto text-right">
                  <div className="text-lg font-bold text-red-600">{formatCurrency(Math.round(3989726 * 6 / 15) + 177396 + 30854 + 49876 + 81849 + 0)}</div>
                  <div className="text-[10px] text-gray-400">{t('YTD')} · 6/15 {t('games')} · {t('BOps prorated')}</div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {MODULES.filter(m => m.id !== 'overview').map((module) => {
                  const Icon = module.icon;
                  const isBops = module.id === 'bops';
                  return (
                    <button
                      key={module.id}
                      onClick={() => setActiveModule(module.id)}
                      className={`text-left p-6 rounded-xl border transition-all hover:shadow-lg cursor-pointer ${
                        isDark ? 'bg-gray-900 border-gray-800 hover:border-gray-700' : 'bg-white border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                          <Icon size={20} className="text-red-600" />
                        </div>
                        <h3 className="font-semibold text-gray-800 dark:text-white">{module.label}</h3>
                      </div>
                      {isBops ? (
                        <div className="mt-2 space-y-2">
                          <div className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(Math.round(3989726 * 6 / 15))}</div>
                          <div className="text-[10px] text-gray-400 dark:text-gray-500">
                            6/15 {t('games')} · {t('Players')}: 78% · {t('Coaches')}: 10.3%
                          </div>
                          <div className="mt-1 px-1.5 py-0.5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded text-[9px] text-emerald-600 dark:text-emerald-400 inline-block">
                            {t('YTD Prorated')}
                          </div>
                        </div>
                      ) : module.id === 'gameday' ? (
                        <div className="mt-2 space-y-2">
                          <div className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(177396)}</div>
                          <div className="text-[10px] text-gray-400 dark:text-gray-500">
                            Jul–Dec 2025 · 12 {t('categories')}
                          </div>
                          <div className="mt-1 px-1.5 py-0.5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded text-[9px] text-emerald-600 dark:text-emerald-400 inline-block">
                            {t('Monthly Actuals')}
                          </div>
                        </div>
                      ) : module.id === 'sponsorship' ? (
                        <div className="mt-2 space-y-2">
                          <div className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(30854)}</div>
                          <div className="text-[10px] text-gray-400 dark:text-gray-500">
                            {t('Events')}: 66.3% · {t('Materials & Ads')}: 33.7%
                          </div>
                          <div className="mt-1 px-1.5 py-0.5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded text-[9px] text-emerald-600 dark:text-emerald-400 inline-block">
                            {t('Monthly Actuals')}
                          </div>
                        </div>
                      ) : module.id === 'venue_ops' ? (
                        <div className="mt-2 space-y-2">
                          <div className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(49876)}</div>
                          <div className="text-[10px] text-gray-400 dark:text-gray-500">
                            {t('Campus - Rental')}: 79.7%
                          </div>
                          <div className="mt-1 px-1.5 py-0.5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded text-[9px] text-emerald-600 dark:text-emerald-400 inline-block">
                            {t('Monthly Actuals')}
                          </div>
                        </div>
                      ) : module.id === 'merchandising' ? (
                        <div className="mt-2 space-y-2">
                          <div className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(81849)}</div>
                          <div className="text-[10px] text-gray-400 dark:text-gray-500">
                            {t('Stock')}: 82.6% · {t('Aug spike')}: {formatCurrency(59937)}
                          </div>
                          <div className="mt-1 px-1.5 py-0.5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded text-[9px] text-emerald-600 dark:text-emerald-400 inline-block">
                            {t('Monthly Actuals')}
                          </div>
                        </div>
                      ) : module.id === 'ebp' ? (
                        <div className="mt-2 space-y-2">
                          <div className="text-xl font-bold text-gray-900 dark:text-white">€0</div>
                          <div className="text-[10px] text-gray-400 dark:text-gray-500">
                            {t('No costs recorded YTD')}
                          </div>
                          <div className="mt-1 px-1.5 py-0.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-[9px] text-gray-500 dark:text-gray-400 inline-block">
                            {t('Zero Activity')}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 mt-4">
                          <Construction size={14} className="text-gray-400" />
                          <span className="text-xs text-gray-400">{t('Coming Soon')}</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className={`border-t ${isDark ? 'border-gray-800' : 'border-gray-200'} pt-8`}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                  <Building2 size={16} className="text-orange-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-800 dark:text-white">{t('SG&A')}</h2>
                  <p className="text-[11px] text-gray-400 dark:text-gray-500">{t('Selling, General & Administrative')}</p>
                </div>
              </div>
              <div className={`rounded-xl border p-10 text-center ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Construction size={24} className="text-orange-500" />
                </div>
                <h3 className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-1">{t('Coming Soon')}</h3>
                <p className="text-sm text-gray-400 dark:text-gray-500 max-w-md mx-auto">
                  {t('SG&A cost tracking will be added here — overhead, admin, and general business expenses.')}
                </p>
              </div>
            </div>
          </div>
        ) : activeModule === 'bops' ? (
          <BOpsCostDashboard />
        ) : activeModule === 'gameday' ? (
          <GameDayCostDashboard />
        ) : activeModule === 'sponsorship' ? (
          <SponsorshipCostDashboard />
        ) : activeModule === 'venue_ops' ? (
          <VenueOpsCostDashboard />
        ) : activeModule === 'merchandising' ? (
          <MerchandisingCostDashboard />
        ) : activeModule === 'ebp' ? (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-red-100 dark:bg-red-900/20 rounded-xl">
                <ActiveIcon className="text-red-600" size={22} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">EBP — {t('Cost Structure')}</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">{t('Monthly Actuals')} · Jul–Dec 2025</p>
              </div>
            </div>
            <div className={`rounded-xl border p-12 text-center ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
              <div className="text-5xl font-bold text-gray-300 dark:text-gray-600 mb-3">€0</div>
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">{t('No costs recorded YTD')}</h3>
              <p className="text-sm text-gray-400 dark:text-gray-500 max-w-sm mx-auto">
                {t('No EBP expenses have been recorded for the Jul–Dec 2025 period.')}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
                <ActiveIcon size={28} className="text-red-600" />
                {t('Cost Center')} — {activeModuleInfo?.label}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('Season')} 2025/26</p>
            </div>
            <div className={`rounded-xl border p-12 text-center ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Construction size={32} className="text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
                {activeModuleInfo?.label} — {t('Cost Center')}
              </h2>
              <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                {t('This cost vertical is currently being integrated into the PV Financial Center.')} {t('Data pipelines are under construction.')}
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
