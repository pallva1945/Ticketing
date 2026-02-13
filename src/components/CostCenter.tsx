import React, { useState } from 'react';
import { Calendar, Flag, Activity, Landmark, ShoppingBag, Users, GraduationCap, Construction, ArrowLeft, Sun, Moon, PieChart, Euro, TrendingUp, Scale, ChevronRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart as RePieChart, Pie } from 'recharts';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { PV_LOGO_URL } from '../constants';
import { BOpsCostDashboard } from './BOpsCostDashboard';

type CostModule = 'overview' | 'gameday' | 'sponsorship' | 'bops' | 'venue_ops' | 'merchandising' | 'ebp' | 'varese_basketball';

const formatCurrency = (val: number) => `€${val.toLocaleString('it-IT', { maximumFractionDigits: 0 })}`;

const BOPS_SEASONS = [
  { season: '22/23', total: 2830120, players: 1877615, coaches: 469800, management: 238691, staff: 152657, anr: 91357, luxuryTax: 0 },
  { season: '23/24', total: 2843367, players: 2107177, coaches: 352066, management: 108060, staff: 102814, anr: 173250, luxuryTax: 0 },
  { season: '24/25', total: 3731721, players: 2834910, coaches: 453335, management: 217648, staff: 106908, anr: 78920, luxuryTax: 40000 },
  { season: '25/26', total: 3989726, players: 3110841, coaches: 409361, management: 173643, staff: 138856, anr: 117025, luxuryTax: 40000 },
];

const CURRENT_BOPS = BOPS_SEASONS[3];
const PREV_BOPS = BOPS_SEASONS[2];
const BOPS_YOY = ((CURRENT_BOPS.total - PREV_BOPS.total) / PREV_BOPS.total) * 100;

const CATEGORY_COLORS: Record<string, string> = {
  Players: '#ef4444',
  Coaches: '#f97316',
  Management: '#8b5cf6',
  Staff: '#3b82f6',
  'A&R': '#10b981',
  'Luxury Tax': '#f59e0b',
};

const CostOverview: React.FC<{ isDark: boolean; t: (key: string) => string; onNavigate: (m: CostModule) => void }> = ({ isDark, t, onNavigate }) => {
  const pieData = [
    { name: t('Players'), value: CURRENT_BOPS.players, color: CATEGORY_COLORS.Players },
    { name: t('Coaches'), value: CURRENT_BOPS.coaches, color: CATEGORY_COLORS.Coaches },
    { name: t('Management'), value: CURRENT_BOPS.management, color: CATEGORY_COLORS.Management },
    { name: t('Staff'), value: CURRENT_BOPS.staff, color: CATEGORY_COLORS.Staff },
    { name: t('A&R'), value: CURRENT_BOPS.anr, color: CATEGORY_COLORS['A&R'] },
    { name: t('Luxury Tax'), value: CURRENT_BOPS.luxuryTax, color: CATEGORY_COLORS['Luxury Tax'] },
  ].filter(d => d.value > 0);

  const trendData = BOPS_SEASONS.map(s => ({
    season: s.season,
    total: s.total,
  }));

  const otherModules: { id: CostModule; label: string; icon: any }[] = [
    { id: 'gameday', label: t('GameDay'), icon: Calendar },
    { id: 'sponsorship', label: t('Sponsorship'), icon: Flag },
    { id: 'venue_ops', label: t('Venue Ops'), icon: Landmark },
    { id: 'merchandising', label: t('Merchandising'), icon: ShoppingBag },
    { id: 'ebp', label: t('EBP'), icon: Users },
    { id: 'varese_basketball', label: t('Varese Basketball'), icon: GraduationCap },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
          <PieChart size={28} className="text-red-600" />
          {t('Cost Center')} — {t('Executive Overview')}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('Season')} 2025/26</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={`rounded-xl border shadow-sm p-5 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-1">
            <Euro size={13} />
            <span>{t('Total BOps Cost')} (25/26)</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(CURRENT_BOPS.total)}</div>
          <div className={`flex items-center gap-1 mt-2 text-xs text-red-500`}>
            <TrendingUp size={13} />
            <span>+{BOPS_YOY.toFixed(1)}% {t('vs prior season')}</span>
          </div>
        </div>

        <div className={`rounded-xl border shadow-sm p-5 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-1">
            <Users size={13} />
            <span>{t('Player Cost Share')}</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{((CURRENT_BOPS.players / CURRENT_BOPS.total) * 100).toFixed(1)}%</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">{formatCurrency(CURRENT_BOPS.players)} {t('of')} {formatCurrency(CURRENT_BOPS.total)}</div>
        </div>

        <div className={`rounded-xl border shadow-sm p-5 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-1">
            <Scale size={13} />
            <span>{t('4-Season Growth')}</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">+{(((CURRENT_BOPS.total - BOPS_SEASONS[0].total) / BOPS_SEASONS[0].total) * 100).toFixed(0)}%</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">{formatCurrency(BOPS_SEASONS[0].total)} → {formatCurrency(CURRENT_BOPS.total)}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={`rounded-xl border shadow-sm p-5 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-4">{t('BOps Cost Trend')}</h3>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} />
                <XAxis dataKey="season" tick={{ fontSize: 11, fill: isDark ? '#9ca3af' : '#6b7280' }} />
                <YAxis tick={{ fontSize: 11, fill: isDark ? '#9ca3af' : '#6b7280' }} tickFormatter={(v: number) => `€${(v / 1000000).toFixed(1)}M`} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ borderRadius: '8px', fontSize: '12px', border: '1px solid #e5e7eb', backgroundColor: isDark ? '#1f2937' : '#fff', color: isDark ? '#f3f4f6' : '#111' }} />
                <Bar dataKey="total" radius={[6, 6, 0, 0]} name={t('Total BOps')}>
                  {trendData.map((_, i) => (
                    <Cell key={i} fill={i === trendData.length - 1 ? '#ef4444' : '#fca5a5'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={`rounded-xl border shadow-sm p-5 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-4">{t('Cost Distribution')} — 25/26</h3>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" paddingAngle={2}>
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ borderRadius: '8px', fontSize: '12px', border: '1px solid #e5e7eb', backgroundColor: isDark ? '#1f2937' : '#fff', color: isDark ? '#f3f4f6' : '#111' }} />
              </RePieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mt-1">
            {pieData.map((item) => (
              <div key={item.name} className="flex items-center gap-1.5 text-[10px] text-gray-600 dark:text-gray-400">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                {item.name}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={`rounded-xl border shadow-sm p-5 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">{t('Season-over-Season Comparison')}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-2 text-gray-500 dark:text-gray-400 font-medium">{t('Category')}</th>
                {BOPS_SEASONS.map(s => (
                  <th key={s.season} className={`text-right py-2 font-medium ${s.season === '25/26' ? 'text-red-600' : 'text-gray-500 dark:text-gray-400'}`}>{s.season}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { label: t('Players'), key: 'players' as const },
                { label: t('Coaches'), key: 'coaches' as const },
                { label: t('Management'), key: 'management' as const },
                { label: t('Staff'), key: 'staff' as const },
                { label: t('A&R'), key: 'anr' as const },
                { label: t('Luxury Tax'), key: 'luxuryTax' as const },
              ].map(row => (
                <tr key={row.label} className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-2 text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[row.label] || CATEGORY_COLORS[Object.keys(CATEGORY_COLORS).find(k => t(k) === row.label) || ''] }} />
                    {row.label}
                  </td>
                  {BOPS_SEASONS.map((s, i) => (
                    <td key={i} className={`text-right py-2 ${s.season === '25/26' ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                      {formatCurrency(s[row.key])}
                    </td>
                  ))}
                </tr>
              ))}
              <tr className="border-t-2 border-gray-300 dark:border-gray-600">
                <td className="py-2 font-bold text-gray-900 dark:text-white">{t('Total')}</td>
                {BOPS_SEASONS.map((s, i) => (
                  <td key={i} className={`text-right py-2 font-bold ${s.season === '25/26' ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>
                    {formatCurrency(s.total)}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <button
        onClick={() => onNavigate('bops')}
        className={`w-full rounded-xl border shadow-sm p-5 flex items-center justify-between hover:shadow-md transition-all cursor-pointer ${isDark ? 'bg-gray-900 border-gray-800 hover:border-gray-700' : 'bg-white border-gray-100 hover:border-gray-300'}`}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
            <Activity size={20} className="text-red-600" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-gray-800 dark:text-white">{t('View Full BOps Dashboard')}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t('Detailed category breakdowns, sub-cost analysis, and ratio trends')}</p>
          </div>
        </div>
        <ChevronRight size={20} className="text-gray-400" />
      </button>

      <div>
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-3">{t('Other Cost Verticals')}</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {otherModules.map((module) => {
            const Icon = module.icon;
            return (
              <button
                key={module.id}
                onClick={() => onNavigate(module.id)}
                className={`text-left p-4 rounded-xl border transition-all hover:shadow-md cursor-pointer ${
                  isDark ? 'bg-gray-900 border-gray-800 hover:border-gray-700' : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-red-50 dark:bg-red-900/10 rounded-lg flex items-center justify-center">
                    <Icon size={14} className="text-red-500" />
                  </div>
                </div>
                <h4 className="text-xs font-semibold text-gray-800 dark:text-white">{module.label}</h4>
                <div className="flex items-center gap-1 mt-1">
                  <Construction size={10} className="text-gray-400" />
                  <span className="text-[10px] text-gray-400">{t('Coming Soon')}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

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
          <CostOverview isDark={isDark} t={t} onNavigate={setActiveModule} />
        ) : activeModule === 'bops' ? (
          <BOpsCostDashboard />
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
