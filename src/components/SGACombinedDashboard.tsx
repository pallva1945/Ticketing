import React, { useState } from 'react';
import { Building2, Plane, Megaphone, Building, Zap, DollarSign, AlertTriangle, Construction } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { TeamOpsCostDashboard } from './TeamOpsCostDashboard';
import { MarketingCostDashboard } from './MarketingCostDashboard';
import { OfficeCostDashboard } from './OfficeCostDashboard';
import { UtilitiesCostDashboard } from './UtilitiesCostDashboard';
import { FinancialCostDashboard } from './FinancialCostDashboard';

type SGASubModule = 'overview' | 'team_ops' | 'marketing' | 'office' | 'utilities' | 'financial' | 'contingencies';

const formatCurrency = (val: number) => `€${val.toLocaleString('it-IT', { maximumFractionDigits: 0 })}`;

const SUB_MODULES: { id: SGASubModule; labelKey: string; icon: any; amount: number; detailFn: (t: (k: string) => string) => string }[] = [
  { id: 'team_ops', labelKey: 'Team Ops', icon: Plane, amount: 189691, detailFn: (t) => `${t('Travel')}: 46.1% · ${t('Team Registration')}: 25.6%` },
  { id: 'marketing', labelKey: 'Marketing', icon: Megaphone, amount: 40726, detailFn: (t) => `${t('Advertising')}: 46.8% · 7 ${t('categories')}` },
  { id: 'office', labelKey: 'Office', icon: Building, amount: 36646, detailFn: (t) => `${t('Software & Subs')}: 55.6% · 7 ${t('categories')}` },
  { id: 'utilities', labelKey: 'Utilities & Maint.', icon: Zap, amount: 89117, detailFn: (t) => `${t('Utilities')}: 37.3% · ${t('Maintenance')}: 36.3%` },
  { id: 'financial', labelKey: 'Financial', icon: DollarSign, amount: 8375, detailFn: (t) => `${t('Bank Charges')}: 92.3% · 4 ${t('categories')}` },
  { id: 'contingencies', labelKey: 'Contingencies', icon: AlertTriangle, amount: 6410, detailFn: () => 'Jul–Dec 2025' },
];

const TOTAL_SGA_OTHER = SUB_MODULES.filter(m => m.amount > 0).reduce((s, m) => s + m.amount, 0);

export const SGACombinedDashboard: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const isDark = theme === 'dark';
  const [activeSub, setActiveSub] = useState<SGASubModule>('overview');

  const sorted = [...SUB_MODULES].sort((a, b) => b.amount - a.amount);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-orange-100 dark:bg-orange-900/20 rounded-xl">
          <Building2 className="text-orange-600" size={22} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('SG&A')} — {t('General & Administrative')}</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">{t('Monthly Actuals')} · Jul–Dec 2025</p>
        </div>
        <div className="ml-auto text-right">
          <div className="text-xl font-bold text-orange-600">{formatCurrency(TOTAL_SGA_OTHER)}</div>
          <div className="text-[10px] text-gray-400">6 {t('categories')}</div>
        </div>
      </div>

      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveSub('overview')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
            activeSub === 'overview'
              ? 'bg-orange-600 text-white shadow-md'
              : isDark
                ? 'text-gray-400 hover:text-white hover:bg-gray-800'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          {t('Overview')}
        </button>
        {SUB_MODULES.map(mod => {
          const Icon = mod.icon;
          return (
            <button
              key={mod.id}
              onClick={() => setActiveSub(mod.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                activeSub === mod.id
                  ? 'bg-orange-600 text-white shadow-md'
                  : isDark
                    ? 'text-gray-400 hover:text-white hover:bg-gray-800'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Icon size={16} className={activeSub === mod.id ? 'text-white' : 'text-gray-400'} />
              {t(mod.labelKey)}
            </button>
          );
        })}
      </div>

      {activeSub === 'overview' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sorted.map(card => {
            const Icon = card.icon;
            const pct = TOTAL_SGA_OTHER > 0 && card.amount > 0 ? ((card.amount / TOTAL_SGA_OTHER) * 100).toFixed(1) : null;
            return (
              <button
                key={card.id}
                onClick={() => setActiveSub(card.id)}
                className={`text-left p-5 rounded-xl border transition-all hover:shadow-lg cursor-pointer ${
                  isDark ? 'bg-gray-900 border-gray-800 hover:border-gray-700' : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                    <Icon size={18} className="text-orange-600" />
                  </div>
                  <h3 className="font-semibold text-sm text-gray-800 dark:text-white">{t(card.labelKey)}</h3>
                </div>
                {card.amount > 0 ? (
                  <div className="mt-2 space-y-2">
                    <div className="flex items-baseline gap-2">
                      <div className="text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(card.amount)}</div>
                      {pct && <span className="text-xs font-semibold text-orange-500">{pct}%</span>}
                    </div>
                    <div className="text-[10px] text-gray-400 dark:text-gray-500">{card.detailFn(t)}</div>
                    <div className="text-[10px] text-gray-400 dark:text-gray-500">Jul–Dec 2025</div>
                    <div className="mt-1 px-1.5 py-0.5 border rounded text-[9px] inline-block bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400">
                      {t('Monthly Actuals')}
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 space-y-2">
                    <div className="text-lg font-bold text-gray-300 dark:text-gray-600">€0</div>
                    <div className="mt-1 px-1.5 py-0.5 border rounded text-[9px] inline-block bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-400">
                      {t('Zero Activity')}
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      ) : activeSub === 'team_ops' ? (
        <TeamOpsCostDashboard />
      ) : activeSub === 'marketing' ? (
        <MarketingCostDashboard />
      ) : activeSub === 'office' ? (
        <OfficeCostDashboard />
      ) : activeSub === 'utilities' ? (
        <UtilitiesCostDashboard />
      ) : activeSub === 'financial' ? (
        <FinancialCostDashboard />
      ) : activeSub === 'contingencies' ? (
        <div className={`rounded-xl border p-12 text-center ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
          <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Construction size={32} className="text-orange-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
            {t('Contingencies')} — {t('Cost Center')}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            {t('This cost vertical is currently being integrated into the PV Financial Center.')} {t('Data pipelines are under construction.')}
          </p>
        </div>
      ) : null}
    </div>
  );
};
