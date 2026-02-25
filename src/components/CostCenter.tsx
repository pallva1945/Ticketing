import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Flag, Activity, Landmark, ShoppingBag, Users, GraduationCap, Construction, Sun, Moon, PieChart, TrendingUp, Briefcase, Building2, HardHat, Upload, Check, Loader2, RefreshCw, Settings, X, FileSpreadsheet } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { PV_LOGO_URL } from '../constants';
import { BOpsCostDashboard } from './BOpsCostDashboard';
import { GameDayCostDashboard } from './GameDayCostDashboard';
import { SponsorshipCostDashboard } from './SponsorshipCostDashboard';
import { VenueOpsCostDashboard } from './VenueOpsCostDashboard';
import { MerchandisingCostDashboard } from './MerchandisingCostDashboard';
import { LaborCostDashboard } from './LaborCostDashboard';
import { SGACombinedDashboard } from './SGACombinedDashboard';

export interface CostLine {
  name: string;
  values: number[];
  total: number;
  color: string;
}

export type CostData = Record<string, CostLine[]>;

type CostModule = 'overview' | 'gameday' | 'sponsorship' | 'bops' | 'venue_ops' | 'merchandising' | 'ebp' | 'varese_basketball' | 'sga_labor' | 'sga_other';

const formatCurrency = (val: number) => `€${val.toLocaleString('it-IT', { maximumFractionDigits: 0 })}`;

interface CostCenterProps {
  onBackToLanding: () => void;
}

function sectionTotal(lines?: CostLine[]): number {
  if (!lines) return 0;
  return lines.reduce((s, l) => s + l.total, 0);
}

const MONTH_SHORT: Record<number, string> = { 0: 'Jul', 1: 'Aug', 2: 'Sep', 3: 'Oct', 4: 'Nov', 5: 'Dec', 6: 'Jan', 7: 'Feb', 8: 'Mar', 9: 'Apr', 10: 'May', 11: 'Jun' };

function periodLabel(monthCount: number): string {
  if (monthCount <= 6) return 'Jul–Dec 2025';
  const endMonth = MONTH_SHORT[monthCount - 1] || 'Jun';
  return `Jul 2025–${endMonth} 2026`;
}

export const CostCenter: React.FC<CostCenterProps> = ({ onBackToLanding }) => {
  const { theme, toggleTheme } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();
  const isDark = theme === 'dark';
  const [activeModule, setActiveModule] = useState<CostModule>('overview');
  const [costData, setCostData] = useState<CostData | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [showSheetConfig, setShowSheetConfig] = useState(false);
  const [sheetId, setSheetId] = useState('');
  const [sheetName, setSheetName] = useState('SG&A (No Labor)');
  const [sheetConfigured, setSheetConfigured] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/costs/data')
      .then(r => r.json())
      .then(res => {
        if (res.success && res.data) setCostData(res.data);
      })
      .catch(() => {});
    fetch('/api/costs/sheet-config')
      .then(r => r.json())
      .then(res => {
        if (res.success) {
          if (res.sheetId) { setSheetId(res.sheetId); setSheetConfigured(true); }
          if (res.sheetName) setSheetName(res.sheetName);
        }
      })
      .catch(() => {});
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setUploadSuccess(false);
    try {
      const text = await file.text();
      const res = await fetch('/api/costs/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csv: text }),
      });
      const result = await res.json();
      if (result.success) {
        setCostData(result.data);
        setUploadSuccess(true);
        setTimeout(() => setUploadSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSyncSheet = async () => {
    setIsSyncing(true);
    setSyncSuccess(false);
    try {
      const res = await fetch('/api/costs/sync-sheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const result = await res.json();
      if (result.success) {
        setCostData(result.data);
        setSyncSuccess(true);
        setTimeout(() => setSyncSuccess(false), 3000);
      } else {
        alert(result.message || 'Sync failed');
      }
    } catch (err) {
      console.error('Sheet sync failed:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSaveSheetConfig = async () => {
    if (!sheetId.trim()) return;
    try {
      const res = await fetch('/api/costs/sheet-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sheetId: sheetId.trim(), sheetName: sheetName.trim() }),
      });
      const result = await res.json();
      if (result.success) {
        setSheetConfigured(true);
        setShowSheetConfig(false);
      }
    } catch (err) {
      console.error('Config save failed:', err);
    }
  };

  const hasDynamic = !!costData;
  const dynGameday = hasDynamic ? sectionTotal(costData.gameday) : 177396;
  const dynMerch = hasDynamic ? sectionTotal(costData.merchandising) : 81849;
  const dynVenueOps = hasDynamic ? sectionTotal(costData.venue_ops) : 49876;
  const dynSponsorship = hasDynamic ? sectionTotal(costData.sponsorship) : 30854;
  const bopsProrated = Math.round(3989726 * 6 / 15);

  const dynTeamOps = hasDynamic ? sectionTotal(costData.team_ops) : 189691;
  const dynMarketing = hasDynamic ? sectionTotal(costData.marketing) : 40726;
  const dynOffice = hasDynamic ? sectionTotal(costData.office) : 36646;
  const dynUtilities = hasDynamic ? sectionTotal(costData.utilities) : 89117;
  const dynFinancial = hasDynamic ? sectionTotal(costData.financial) : 8375;
  const dynContingencies = hasDynamic ? sectionTotal(costData.contingencies) : 6410;

  const dataMonthCount = hasDynamic ? (Object.values(costData).find(v => v?.[0]))?.[0]?.values.length || 6 : 6;
  const period = periodLabel(dataMonthCount);

  const dynProfServices = hasDynamic ? sectionTotal(costData.professional_services) : 53185;
  const laborProrated = Math.round(511145 * 6 / 12) + dynProfServices;
  const sgaOtherTotal = dynTeamOps + dynMarketing + dynOffice + dynUtilities + dynFinancial + dynContingencies;
  const sgaTotal = laborProrated + sgaOtherTotal;

  const COS_MODULES: { id: CostModule; label: string; icon: any }[] = [
    { id: 'bops', label: t('BOps'), icon: Activity },
    { id: 'gameday', label: t('GameDay'), icon: Calendar },
    { id: 'sponsorship', label: t('Sponsorship'), icon: Flag },
    { id: 'venue_ops', label: t('Venue Ops'), icon: Landmark },
    { id: 'merchandising', label: t('Merchandising'), icon: ShoppingBag },
    { id: 'ebp', label: t('EBP'), icon: Users },
    { id: 'varese_basketball', label: t('Varese Basketball'), icon: GraduationCap },
  ];

  const SGA_MODULES: { id: CostModule; label: string; icon: any }[] = [
    { id: 'sga_labor', label: t('Labor'), icon: HardHat },
    { id: 'sga_other', label: t('General & Administrative'), icon: Building2 },
  ];

  const MODULES: { id: CostModule; label: string; icon: any }[] = [
    { id: 'overview', label: t('Executive Overview'), icon: PieChart },
    ...COS_MODULES,
    ...SGA_MODULES,
  ];

  const activeModuleInfo = MODULES.find(m => m.id === activeModule);
  const ActiveIcon = activeModuleInfo?.icon || Construction;

  return (
    <div className={`min-h-screen ${isDark ? 'dark bg-gray-950 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="fixed top-0 left-0 w-full bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 z-50 px-4 shadow-sm">
        <div className="flex items-center justify-between py-1.5">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={onBackToLanding} className="w-8 h-8 flex-shrink-0 hover:opacity-70 transition-opacity" title={t('Back to Financial Center')}>
              <img src={PV_LOGO_URL} alt="PV" className="w-full h-full object-contain" />
            </button>

            <div className="h-10 w-px bg-gray-200 dark:bg-gray-700 hidden md:block flex-shrink-0"></div>
            <div className="hidden md:flex items-center gap-2 min-w-0">
                <button
                  onClick={() => setActiveModule('overview')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                    activeModule === 'overview'
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-gray-900 shadow-md'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <PieChart size={16} className={activeModule === 'overview' ? 'text-white dark:text-gray-900' : 'text-gray-400'} />
                  {t('Executive Overview')}
                </button>
                <div className={`self-stretch w-px ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                <div className="flex flex-col gap-1 overflow-x-auto min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-red-500 px-0.5 w-8 flex-shrink-0">COS</span>
                    {COS_MODULES.map((module) => (
                      <button
                        key={module.id}
                        onClick={() => setActiveModule(module.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                          activeModule === module.id
                            ? 'bg-slate-900 dark:bg-white text-white dark:text-gray-900 shadow-md'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                      >
                        <module.icon size={16} className={activeModule === module.id ? 'text-white dark:text-gray-900' : 'text-gray-400'} />
                        {module.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-orange-500 px-0.5 w-8 flex-shrink-0">SG&A</span>
                    {SGA_MODULES.map((module) => (
                      <button
                        key={module.id}
                        onClick={() => setActiveModule(module.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                          activeModule === module.id
                            ? 'bg-slate-900 dark:bg-white text-white dark:text-gray-900 shadow-md'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                      >
                        <module.icon size={16} className={activeModule === module.id ? 'text-white dark:text-gray-900' : 'text-gray-400'} />
                        {module.label}
                      </button>
                    ))}
                  </div>
                </div>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-2 flex-shrink-0">
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold transition-all border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 bg-white dark:bg-gray-900"
            >
              <span className="text-sm">{language === 'en' ? '\u{1F1EE}\u{1F1F9}' : '\u{1F1EC}\u{1F1E7}'}</span>
              <span className="text-[9px] text-gray-500 dark:text-gray-400 uppercase">{language === 'en' ? 'IT' : 'EN'}</span>
            </button>
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-lg transition-all border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 bg-white dark:bg-gray-900"
            >
              {isDark ? <Sun size={14} className="text-yellow-400" /> : <Moon size={14} className="text-gray-500" />}
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8 pt-28">
        {activeModule === 'overview' ? (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
                  <PieChart size={28} className="text-red-600" />
                  {t('Cost Center')} — {t('Executive Overview')}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('Season')} 2025/26</p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleUpload}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all border ${
                    uploadSuccess
                      ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600'
                      : isDark
                        ? 'border-gray-700 bg-gray-800 hover:bg-gray-700 text-gray-300'
                        : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-600'
                  }`}
                  title={t('Upload cost data CSV')}
                >
                  {isUploading ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : uploadSuccess ? (
                    <Check size={14} />
                  ) : (
                    <Upload size={14} />
                  )}
                  {isUploading ? t('Uploading...') : uploadSuccess ? t('Updated') : t('Upload CSV')}
                </button>
                <button
                  onClick={sheetConfigured ? handleSyncSheet : () => setShowSheetConfig(true)}
                  disabled={isSyncing}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all border ${
                    syncSuccess
                      ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600'
                      : isDark
                        ? 'border-gray-700 bg-gray-800 hover:bg-gray-700 text-gray-300'
                        : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-600'
                  }`}
                  title={sheetConfigured ? t('Sync from Google Sheets') : t('Connect Google Sheet')}
                >
                  {isSyncing ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : syncSuccess ? (
                    <Check size={14} />
                  ) : (
                    <FileSpreadsheet size={14} className="text-green-600" />
                  )}
                  {isSyncing ? t('Syncing...') : syncSuccess ? t('Synced') : sheetConfigured ? t('Sync Sheet') : t('Connect Sheet')}
                </button>
                {sheetConfigured && (
                  <button
                    onClick={() => setShowSheetConfig(true)}
                    className={`p-2 rounded-lg transition-all border ${isDark ? 'border-gray-700 bg-gray-800 hover:bg-gray-700 text-gray-400' : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-400'}`}
                    title={t('Sheet settings')}
                  >
                    <Settings size={14} />
                  </button>
                )}
                {hasDynamic && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400">
                    {t('Live Data')}
                  </span>
                )}
              </div>
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
                  <div className="text-lg font-bold text-red-600">{formatCurrency(bopsProrated + dynGameday + dynMerch + dynVenueOps + dynSponsorship)}</div>
                  <div className="text-[10px] text-gray-400">{period} · {t('BOps prorated')}</div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {(() => {
                  const COST_CARDS: { id: CostModule; amount: number; detail: string; badge: string; badgeStyle: string }[] = [
                    { id: 'bops', amount: bopsProrated, detail: `${t('Players')}: 78% · ${t('Coaches')}: 10.3%`, badge: t('YTD Prorated'), badgeStyle: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400' },
                    { id: 'gameday', amount: dynGameday, detail: `12 ${t('categories')}`, badge: hasDynamic && costData.gameday ? t('CSV Data') : t('Monthly Actuals'), badgeStyle: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400' },
                    { id: 'merchandising', amount: dynMerch, detail: `${t('Stock')}: 82.6%`, badge: hasDynamic && costData.merchandising ? t('CSV Data') : t('Monthly Actuals'), badgeStyle: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400' },
                    { id: 'venue_ops', amount: dynVenueOps, detail: `${t('Campus - Rental')}: 79.7%`, badge: hasDynamic && costData.venue_ops ? t('CSV Data') : t('Monthly Actuals'), badgeStyle: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400' },
                    { id: 'sponsorship', amount: dynSponsorship, detail: `${t('Events')}: 66.3% · ${t('Materials & Ads')}: 33.7%`, badge: hasDynamic && costData.sponsorship ? t('CSV Data') : t('Monthly Actuals'), badgeStyle: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400' },
                    { id: 'ebp', amount: 0, detail: t('No costs recorded YTD'), badge: t('Zero Activity'), badgeStyle: 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400' },
                    { id: 'varese_basketball', amount: -1, detail: '', badge: t('Coming Soon'), badgeStyle: '' },
                  ];
                  const sorted = [...COST_CARDS].sort((a, b) => b.amount - a.amount);
                  const totalCOS = COST_CARDS.filter(c => c.amount >= 0).reduce((s, c) => s + c.amount, 0);
                  return sorted.map(card => {
                    const module = MODULES.find(m => m.id === card.id)!;
                    const Icon = module.icon;
                    const pctOfCOS = totalCOS > 0 && card.amount > 0 ? ((card.amount / totalCOS) * 100).toFixed(1) : null;
                    return (
                      <button
                        key={card.id}
                        onClick={() => setActiveModule(card.id)}
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
                        {card.amount >= 0 ? (
                          <div className="mt-2 space-y-2">
                            <div className="flex items-baseline gap-2">
                              <div className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(card.amount)}</div>
                              {pctOfCOS && <span className="text-xs font-semibold text-red-500">{pctOfCOS}%</span>}
                            </div>
                            <div className="text-[10px] text-gray-400 dark:text-gray-500">
                              {card.detail}
                            </div>
                            <div className="text-[10px] text-gray-400 dark:text-gray-500">{period}</div>
                            <div className={`mt-1 px-1.5 py-0.5 border rounded text-[9px] inline-block ${card.badgeStyle}`}>
                              {card.badge}
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 mt-4">
                            <Construction size={14} className="text-gray-400" />
                            <span className="text-xs text-gray-400">{card.badge}</span>
                          </div>
                        )}
                      </button>
                    );
                  });
                })()}
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
                <div className="ml-auto text-right">
                  <div className="text-lg font-bold text-orange-600">{formatCurrency(sgaTotal)}</div>
                  <div className="text-[10px] text-gray-400">{period}</div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => setActiveModule('sga_labor')}
                  className={`text-left p-5 rounded-xl border transition-all hover:shadow-lg cursor-pointer ${
                    isDark ? 'bg-gray-900 border-gray-800 hover:border-gray-700' : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                      <HardHat size={18} className="text-orange-600" />
                    </div>
                    <h3 className="font-semibold text-sm text-gray-800 dark:text-white">{t('Labor')}</h3>
                  </div>
                  <div className="mt-2 space-y-2">
                    <div className="flex items-baseline gap-2">
                      <div className="text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(laborProrated)}</div>
                      <span className="text-xs font-semibold text-orange-500">{sgaTotal > 0 ? ((laborProrated / sgaTotal) * 100).toFixed(1) : '0'}%</span>
                    </div>
                    <div className="text-[10px] text-gray-400 dark:text-gray-500">20 {t('headcount')} · {t('Internal')} + {t('External')}</div>
                    <div className="text-[10px] text-gray-400 dark:text-gray-500">{period}</div>
                    <div className="mt-1 px-1.5 py-0.5 border rounded text-[9px] inline-block bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400">
                      {t('Monthly Actuals')}
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => setActiveModule('sga_other')}
                  className={`text-left p-5 rounded-xl border transition-all hover:shadow-lg cursor-pointer ${
                    isDark ? 'bg-gray-900 border-gray-800 hover:border-gray-700' : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                      <Building2 size={18} className="text-orange-600" />
                    </div>
                    <h3 className="font-semibold text-sm text-gray-800 dark:text-white">{t('General & Administrative')}</h3>
                  </div>
                  <div className="mt-2 space-y-2">
                    <div className="flex items-baseline gap-2">
                      <div className="text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(sgaOtherTotal)}</div>
                      <span className="text-xs font-semibold text-orange-500">{sgaTotal > 0 ? ((sgaOtherTotal / sgaTotal) * 100).toFixed(1) : '0'}%</span>
                    </div>
                    <div className="text-[10px] text-gray-400 dark:text-gray-500">{t('Team Ops')} · {t('Marketing')} · {t('Office')} · {t('Utilities & Maint.')} · {t('Financial')} · {t('Contingencies')}</div>
                    <div className="text-[10px] text-gray-400 dark:text-gray-500">{period}</div>
                    <div className={`mt-1 px-1.5 py-0.5 border rounded text-[9px] inline-block ${
                      hasDynamic ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400' : 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400'
                    }`}>
                      {hasDynamic ? t('CSV Data') : t('Monthly Actuals')}
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        ) : activeModule === 'bops' ? (
          <BOpsCostDashboard />
        ) : activeModule === 'gameday' ? (
          <GameDayCostDashboard costLines={costData?.gameday} />
        ) : activeModule === 'sponsorship' ? (
          <SponsorshipCostDashboard costLines={costData?.sponsorship} />
        ) : activeModule === 'venue_ops' ? (
          <VenueOpsCostDashboard costLines={costData?.venue_ops} />
        ) : activeModule === 'merchandising' ? (
          <MerchandisingCostDashboard costLines={costData?.merchandising} />
        ) : activeModule === 'sga_labor' ? (
          <LaborCostDashboard professionalServices={costData?.professional_services} />
        ) : activeModule === 'sga_other' ? (
          <SGACombinedDashboard costData={costData || undefined} />
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

      {showSheetConfig && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]" onClick={() => setShowSheetConfig(false)}>
          <div className={`rounded-xl shadow-2xl w-full max-w-md mx-4 ${isDark ? 'bg-gray-900 border border-gray-700' : 'bg-white border border-gray-200'}`} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <FileSpreadsheet size={18} className="text-green-600" />
                <h3 className="font-semibold text-gray-900 dark:text-white">{t('Google Sheet Configuration')}</h3>
              </div>
              <button onClick={() => setShowSheetConfig(false)} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
                <X size={16} className="text-gray-500" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  {t('Spreadsheet ID')}
                </label>
                <input
                  type="text"
                  value={sheetId}
                  onChange={e => setSheetId(e.target.value)}
                  placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms"
                  className={`w-full px-3 py-2 rounded-lg border text-sm ${isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}`}
                />
                <p className="text-[10px] text-gray-400 mt-1">{t('Found in the Google Sheets URL between /d/ and /edit')}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  {t('Sheet Tab Name')}
                </label>
                <input
                  type="text"
                  value={sheetName}
                  onChange={e => setSheetName(e.target.value)}
                  placeholder="SG&A (No Labor)"
                  className={`w-full px-3 py-2 rounded-lg border text-sm ${isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}`}
                />
                <p className="text-[10px] text-gray-400 mt-1">{t('The exact name of the tab/sheet to read from')}</p>
              </div>
            </div>
            <div className="flex justify-end gap-2 p-5 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowSheetConfig(false)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${isDark ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                {t('Cancel')}
              </button>
              <button
                onClick={handleSaveSheetConfig}
                disabled={!sheetId.trim()}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {t('Save & Connect')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
