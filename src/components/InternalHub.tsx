import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Compass, Users, Building2, Shield, ArrowRight, Lock, Sun, Moon, ChevronDown, ChevronLeft, ChevronRight, UserCircle2, Trophy, Crown, Heart, Landmark, Briefcase, Star, Layers, Globe, Leaf, Lightbulb, BarChart3, Rocket, TrendingUp, Settings, ExternalLink, Activity, Construction } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { PV_LOGO_URL } from '../constants';

const TEAM_SLIDES = 8;

const OWNERSHIP_DATA = [
  { name: 'Varese Sports & Entertainment', value: 51.5, color: '#E30613' },
  { name: 'Luis Scola Group', value: 21.3, color: '#1e3a5f' },
  { name: 'Verofin', value: 11.9, color: '#6366f1' },
  { name: 'PV Ignis', value: 9.0, color: '#f59e0b' },
  { name: 'Varese Nel Cuore', value: 4.4, color: '#10b981' },
  { name: 'Basket Siamo Noi', value: 1.9, color: '#8b5cf6' },
];

const BOARD_MEMBERS = [
  { name: 'Antonio Bulgheroni', initials: 'AB', roleKey: 'Presidente', bioKey: 'bio_bulgheroni', color: '#E30613', photo: 'https://i.imgur.com/Ot1rDJr.jpeg' },
  { name: 'Luis Scola', initials: 'LS', roleKey: 'Amministratore Delegato', bioKey: 'bio_scola', color: '#1e3a5f', photo: 'https://i.imgur.com/1llx2jG.jpeg' },
  { name: 'Paolo Perego', initials: 'PP', roleKey: 'Vice Presidente', bioKey: 'bio_perego', color: '#6366f1', photo: 'https://i.imgur.com/4XWGZ9A.jpeg' },
  { name: 'Paolo Orrigoni', initials: 'PO', roleKey: 'Consigliere', bioKey: 'bio_orrigoni', color: '#f59e0b', photo: 'https://i.imgur.com/XUTdo02.jpeg' },
  { name: 'Roberto D\'Avola', initials: 'RD', roleKey: 'Consigliere', bioKey: 'bio_davola', color: '#10b981', photo: 'https://i.imgur.com/zXFeyU6.jpeg' },
];

const ELT_MEMBERS = [
  { name: 'Zach Sogolow', initials: 'ZS', roleKey: 'GM Basketball Operations', bioKey: 'bio_sogolow', color: '#E30613', photo: 'https://i.imgur.com/wHVwtM7.jpeg' },
  { name: 'Maksim Horowitz', initials: 'MH', roleKey: 'GM Basketball Operations', bioKey: 'bio_horowitz', color: '#1e3a5f', photo: 'https://i.imgur.com/jAMPp3V.jpeg' },
  { name: 'Marco Zamberletti', initials: 'MZ', roleKey: 'CSO', bioKey: 'bio_zamberletti', color: '#6366f1', photo: 'https://i.imgur.com/lRgRD1m.jpeg' },
  { name: 'Federico Bellotto', initials: 'FB', roleKey: 'COO', bioKey: 'bio_bellotto', color: '#f59e0b', photo: 'https://i.imgur.com/3lFQ9uQ.jpeg' },
];

const SPECIAL_ADVISORS = [
  { name: 'Charles Baker', initials: 'CB', roleKey: 'role_baker', bioKey: 'bio_baker', color: '#1e3a5f', photo: 'https://i.imgur.com/jfiaK5X.png', org: 'Sidley Austin' },
  { name: 'CAA', initials: 'CAA', roleKey: 'role_caa', bioKey: 'bio_caa', color: '#E30613', org: 'Creative Artists Agency' },
  { name: 'Stefano Bonfiglio', initials: 'SB', roleKey: 'role_bonfiglio', bioKey: 'bio_bonfiglio', color: '#6366f1', photo: 'https://i.imgur.com/MOma7zU.png', org: 'Stirling Square Capital Partners' },
];

const DEPT_MEMBERS = [
  { name: 'Mario Oioli', initials: 'MO', roleKey: 'role_oioli', color: '#E30613' },
  { name: 'Maria Grazia Ferrari', initials: 'MF', roleKey: 'role_ferrari', color: '#1e3a5f' },
  { name: 'Raffaella Damatè', initials: 'RD', roleKey: 'role_damate', color: '#6366f1' },
  { name: 'Federico Pisanti', initials: 'FP', roleKey: 'role_pisanti', color: '#f59e0b' },
  { name: 'Marco Gandini', initials: 'MG', roleKey: 'role_gandini', color: '#10b981' },
  { name: 'Lorenzo Gaudina', initials: 'LG', roleKey: 'role_gaudina', color: '#8b5cf6' },
  { name: 'Filippo Buttarelli', initials: 'FB', roleKey: 'role_buttarelli', color: '#ec4899' },
  { name: 'Nicola Artuso', initials: 'NA', roleKey: 'role_artuso', color: '#14b8a6' },
];

const EXT_SERVICES = [
  { name: 'FullField', initials: 'FF', roleKey: 'role_fullfield', color: '#E30613' },
  { name: 'Oltre', initials: 'OL', roleKey: 'role_oltre', color: '#6366f1' },
  { name: 'BSN', initials: 'BS', roleKey: 'role_bsn', color: '#10b981' },
  { name: 'Airish Waclin', initials: 'AW', roleKey: 'role_airish', color: '#f59e0b' },
  { name: 'Studio Broggini', initials: 'SB', roleKey: 'role_broggini', color: '#1e3a5f' },
  { name: 'Studio Terzaghi', initials: 'ST', roleKey: 'role_terzaghi', color: '#8b5cf6' },
];

const StatCounter: React.FC<{ target: number; label: string; suffix?: string; active: boolean; isDark: boolean }> = ({ target, label, suffix, active, isDark }) => {
  const [count, setCount] = useState(0);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!active || hasAnimated.current) return;
    hasAnimated.current = true;
    const duration = 2000;
    const steps = 60;
    const increment = target / steps;
    let current = 0;
    const interval = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(interval);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(interval);
  }, [active, target]);

  return (
    <div className="text-center">
      <div className={`text-2xl sm:text-4xl font-bold tabular-nums ${isDark ? 'text-white' : 'text-gray-900'}`}>
        {count}{suffix || ''}
      </div>
      <div className={`text-[10px] sm:text-xs tracking-[0.15em] sm:tracking-[0.2em] uppercase mt-1 sm:mt-1.5 font-medium ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
        {label}
      </div>
    </div>
  );
};

interface InternalHubProps {
  onNavigate: (section: string) => void;
  onBackToWelcome: () => void;
}

export const InternalHub: React.FC<InternalHubProps> = ({ onNavigate, onBackToWelcome }) => {
  const { theme, toggleTheme } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();
  const { isAdmin } = useAuth();
  const isDark = theme === 'dark';
  const [phase, setPhase] = useState(0);
  const [bopsExpanded, setBopsExpanded] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 150);
    const t2 = setTimeout(() => setPhase(2), 600);
    const t3 = setTimeout(() => setPhase(3), 1000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  const cards = [
    {
      id: 'us',
      label: t('About Us'),
      desc: t('Vision, Mission, Values & Our Team'),
      icon: Users,
      color: 'red',
      action: () => onNavigate('pv-us'),
      actionLabel: t('Enter'),
      actionIcon: ArrowRight,
      external: false,
    },
    {
      id: 'corp',
      label: 'Corp',
      desc: t('Financial Center — Revenue, Costs & Verticals P&L'),
      icon: Building2,
      color: 'blue',
      action: () => onNavigate('landing'),
      actionLabel: t('Enter'),
      actionIcon: ArrowRight,
      external: false,
    },
    {
      id: 'bops',
      label: 'BOps',
      desc: t('Basketball Operations — Team management, roster & performance'),
      icon: Shield,
      color: 'emerald',
      action: () => setBopsExpanded(!bopsExpanded),
      actionLabel: t('Enter'),
      actionIcon: ArrowRight,
      external: false,
      subItems: [
        { label: t('BOps Internal Portal'), action: () => window.open('https://basket.pallacanestrovarese.club', '_blank'), external: true },
        { label: t('Market Watch'), action: () => {}, external: false, comingSoon: true },
      ],
    },
  ];

  const colorMap: Record<string, { bg: string; hoverBorder: string; hoverShadow: string; iconBg: string; text: string; topBar: string }> = {
    red: {
      bg: isDark ? 'bg-gray-900/50' : 'bg-white',
      hoverBorder: isDark ? 'hover:border-red-800/60' : 'hover:border-red-300',
      hoverShadow: isDark ? 'hover:shadow-red-950/10' : 'hover:shadow-red-100/30',
      iconBg: isDark ? 'bg-red-900/20' : 'bg-red-50',
      text: isDark ? 'text-red-500' : 'text-red-600',
      topBar: 'from-red-600 to-red-400',
    },
    blue: {
      bg: isDark ? 'bg-gray-900/50' : 'bg-white',
      hoverBorder: isDark ? 'hover:border-blue-800/60' : 'hover:border-blue-300',
      hoverShadow: isDark ? 'hover:shadow-blue-950/10' : 'hover:shadow-blue-100/30',
      iconBg: isDark ? 'bg-blue-900/20' : 'bg-blue-50',
      text: isDark ? 'text-blue-500' : 'text-blue-600',
      topBar: 'from-blue-600 to-blue-400',
    },
    emerald: {
      bg: isDark ? 'bg-gray-900/50' : 'bg-white',
      hoverBorder: isDark ? 'hover:border-emerald-800/60' : 'hover:border-emerald-300',
      hoverShadow: isDark ? 'hover:shadow-emerald-950/10' : 'hover:shadow-emerald-100/30',
      iconBg: isDark ? 'bg-emerald-900/20' : 'bg-emerald-50',
      text: isDark ? 'text-emerald-500' : 'text-emerald-600',
      topBar: 'from-emerald-600 to-emerald-400',
    },
  };

  return (
    <div className={`min-h-screen relative overflow-hidden ${isDark ? 'bg-[#0a0a0a]' : 'bg-[#fafafa]'}`}>
      <style>{`
        @keyframes subtle-pulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.05); }
        }
        @keyframes line-draw {
          from { width: 0; }
          to { width: 80px; }
        }
        .animate-line { animation: line-draw 1s ease-out 0.8s forwards; width: 0; }
        .animate-glow { animation: subtle-pulse 4s ease-in-out infinite; }
      `}</style>

      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full animate-glow ${
          isDark ? 'bg-red-950/20' : 'bg-red-50/80'
        }`} style={{ filter: 'blur(120px)' }}></div>
      </div>

      <div className={`absolute top-0 left-0 w-full h-px ${isDark ? 'bg-gradient-to-r from-transparent via-red-800/40 to-transparent' : 'bg-gradient-to-r from-transparent via-red-200 to-transparent'}`}></div>

      <div className="absolute top-5 right-5 flex items-center gap-2 z-20">
        <button
          onClick={toggleLanguage}
          className={`px-3 py-2 rounded-lg text-xs font-medium tracking-wider uppercase transition-all ${
            isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          {language === 'en' ? 'IT' : 'EN'}
        </button>
        <button
          onClick={toggleTheme}
          className={`p-2 rounded-lg transition-all ${
            isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          {isDark ? <Sun size={14} /> : <Moon size={14} />}
        </button>
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6">
        <div className="flex flex-col items-center text-center w-full max-w-4xl">
          <div className={`transition-all duration-[1s] ease-out ${phase >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <button onClick={onBackToWelcome} className="hover:opacity-70 transition-opacity mb-4">
              <img src={PV_LOGO_URL} alt="PV" className="w-14 h-14 sm:w-16 sm:h-16 object-contain mx-auto" />
            </button>
            <p className={`text-xs tracking-[0.25em] uppercase font-medium mb-6 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
              Pallacanestro Varese
            </p>
            <div className="flex justify-center mb-8">
              <div className={`h-px animate-line ${isDark ? 'bg-red-700' : 'bg-red-400'}`}></div>
            </div>
          </div>

          <div className={`transition-all duration-[1s] ease-out delay-300 ${phase >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            <p className={`text-xs tracking-[0.25em] uppercase font-medium mb-8 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
              {t('Choose your area')}
            </p>
          </div>

          <div className={`grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 w-full max-w-3xl transition-all duration-1000 ease-out ${phase >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            {cards.map((card) => {
              const colors = colorMap[card.color];
              const Icon = card.icon;
              const ActionIcon = card.actionIcon;
              const isDisabled = !card.action;
              const hasSubItems = card.subItems && card.subItems.length > 0;
              const isExpanded = card.id === 'bops' && bopsExpanded;

              const content = (
                <>
                  <div className={`absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r ${colors.topBar} ${isExpanded ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity duration-500`}></div>
                  <div className="p-5 sm:p-8 flex flex-col items-center text-center">
                    <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center mb-4 sm:mb-5 ${colors.iconBg}`}>
                      <Icon size={24} className={`${colors.text} sm:w-[28px] sm:h-[28px]`} />
                    </div>
                    <h3 className={`text-base sm:text-xl font-semibold mb-1.5 sm:mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {card.label}
                    </h3>
                    <p className={`text-[10px] sm:text-xs leading-relaxed ${isExpanded ? 'mb-3' : 'mb-4 sm:mb-5'} min-h-[2rem] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                      {card.desc}
                    </p>
                    {isExpanded && hasSubItems ? (
                      <div className="w-full space-y-2 mt-1">
                        {card.subItems!.map((sub, si) => (
                          <button
                            key={si}
                            onClick={(e) => { e.stopPropagation(); sub.action(); }}
                            disabled={sub.comingSoon}
                            className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-medium transition-all ${
                              sub.comingSoon
                                ? isDark ? 'bg-gray-800/50 text-gray-600 cursor-not-allowed' : 'bg-gray-100/50 text-gray-300 cursor-not-allowed'
                                : isDark ? 'bg-gray-800/80 text-gray-200 hover:bg-emerald-900/30 hover:text-emerald-400 border border-gray-700 hover:border-emerald-800' : 'bg-gray-50 text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 border border-gray-200 hover:border-emerald-300'
                            }`}
                          >
                            <span>{sub.label}</span>
                            {sub.comingSoon ? (
                              <span className={`text-[9px] tracking-wider uppercase ${isDark ? 'text-gray-600' : 'text-gray-300'}`}>{t('Soon')}</span>
                            ) : sub.external ? (
                              <ExternalLink size={12} />
                            ) : (
                              <ArrowRight size={12} />
                            )}
                          </button>
                        ))}
                      </div>
                    ) : !isDisabled ? (
                      <div className={`inline-flex items-center gap-2 text-[10px] sm:text-xs font-medium tracking-wider uppercase group-hover:gap-3 transition-all ${colors.text}`}>
                        {card.actionLabel}
                        {card.external ? (
                          <ExternalLink size={12} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        ) : (
                          <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                        )}
                      </div>
                    ) : (
                      <div className={`inline-flex items-center gap-2 text-[10px] sm:text-xs font-medium tracking-wider uppercase ${isDark ? 'text-gray-600' : 'text-gray-300'}`}>
                        {card.actionLabel}
                      </div>
                    )}
                  </div>
                </>
              );

              if (isDisabled) {
                return (
                  <div
                    key={card.id}
                    className={`group relative rounded-2xl border transition-all duration-500 overflow-hidden ${
                      isDark ? 'bg-gray-900/30 border-gray-800/50 opacity-60' : 'bg-white/60 border-gray-200/60 opacity-60'
                    }`}
                  >
                    {content}
                  </div>
                );
              }

              return (
                <button
                  key={card.id}
                  onClick={card.action}
                  className={`group relative rounded-2xl border transition-all duration-500 overflow-hidden hover:shadow-2xl text-left ${colors.bg} ${
                    isDark ? 'border-gray-800' : 'border-gray-200'
                  } ${colors.hoverBorder} ${colors.hoverShadow} ${isExpanded ? (isDark ? 'border-emerald-800/60 shadow-2xl' : 'border-emerald-300 shadow-2xl') : ''}`}
                >
                  {content}
                </button>
              );
            })}
          </div>
        </div>

        <div className={`absolute bottom-8 left-1/2 -translate-x-1/2 transition-all duration-1000 ${phase >= 3 ? 'opacity-100' : 'opacity-0'}`}>
          <div className={`flex items-center gap-4 text-[10px] tracking-[0.25em] uppercase ${isDark ? 'text-gray-700' : 'text-gray-300'}`}>
            <span>{t('Season')} 2025/26</span>
            <span className="w-px h-3 bg-current"></span>
            <span>pallva.it</span>
          </div>
        </div>

        {isAdmin && (
          <button
            onClick={() => onNavigate('admin')}
            className={`fixed bottom-5 right-5 z-50 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 opacity-40 hover:opacity-100 ${
              isDark ? 'bg-gray-800/80 hover:bg-gray-700 text-gray-400 hover:text-white' : 'bg-gray-200/80 hover:bg-gray-300 text-gray-400 hover:text-gray-700'
            }`}
            title="Access Management"
          >
            <Settings size={16} />
          </button>
        )}
      </div>
    </div>
  );
};

interface PVUsPageProps {
  onBack: () => void;
  onHome: () => void;
}

export const PVUsPage: React.FC<PVUsPageProps> = ({ onBack, onHome }) => {
  const { theme, toggleTheme } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();
  const isDark = theme === 'dark';

  const containerRef = useRef<HTMLDivElement>(null);
  const [teamSlide, setTeamSlide] = useState(0);
  const isSliding = useRef(false);
  const currentTeamSlide = useRef(0);

  const goToTeamSlide = useCallback((index: number) => {
    if (isSliding.current || index < 0 || index >= TEAM_SLIDES) return;
    isSliding.current = true;
    currentTeamSlide.current = index;
    setTeamSlide(index);
    setTimeout(() => { isSliding.current = false; }, 1400);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let accumulated = 0;
    let lastWheelTime = 0;
    const THRESHOLD = 60;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (isSliding.current) return;
      const now = Date.now();
      if (now - lastWheelTime > 200) accumulated = 0;
      lastWheelTime = now;
      accumulated += e.deltaY;
      if (Math.abs(accumulated) >= THRESHOLD) {
        if (accumulated > 0 && currentTeamSlide.current < TEAM_SLIDES - 1) {
          goToTeamSlide(currentTeamSlide.current + 1);
        } else if (accumulated < 0 && currentTeamSlide.current > 0) {
          goToTeamSlide(currentTeamSlide.current - 1);
        }
        accumulated = 0;
      }
    };

    let touchStartY = 0;
    let touchStartX = 0;
    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
      touchStartX = e.touches[0].clientX;
    };
    const handleTouchEnd = (e: TouchEvent) => {
      if (isSliding.current) return;
      const deltaY = touchStartY - e.changedTouches[0].clientY;
      const deltaX = touchStartX - e.changedTouches[0].clientX;
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 40) {
        if (deltaX > 0 && currentTeamSlide.current < TEAM_SLIDES - 1) goToTeamSlide(currentTeamSlide.current + 1);
        else if (deltaX < 0 && currentTeamSlide.current > 0) goToTeamSlide(currentTeamSlide.current - 1);
        return;
      }
      if (Math.abs(deltaY) > 40) {
        if (deltaY > 0 && currentTeamSlide.current < TEAM_SLIDES - 1) goToTeamSlide(currentTeamSlide.current + 1);
        else if (deltaY < 0 && currentTeamSlide.current > 0) goToTeamSlide(currentTeamSlide.current - 1);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'PageDown') {
        e.preventDefault();
        goToTeamSlide(currentTeamSlide.current + 1);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        goToTeamSlide(currentTeamSlide.current - 1);
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [goToTeamSlide]);

  const slideLabels = [t('VMV'), t('About'), t('Ownership'), t('Board'), t('Advisors'), t('ELT'), t('Depts'), t('External')];

  return (
    <div
      ref={containerRef}
      className={`h-screen overflow-hidden relative ${isDark ? 'bg-[#0a0a0a]' : 'bg-[#fafafa]'}`}
    >
      <style>{`
        @keyframes bounce-subtle { 0%, 100% { transform: translateX(-50%) translateY(0); } 50% { transform: translateX(-50%) translateY(6px); } }
        .bounce-arrow { animation: bounce-subtle 2s ease-in-out infinite; }
      `}</style>

      <div className={`absolute top-0 left-0 w-full h-px z-50 ${isDark ? 'bg-gradient-to-r from-transparent via-red-800/40 to-transparent' : 'bg-gradient-to-r from-transparent via-red-200 to-transparent'}`}></div>

      <nav className={`fixed top-0 left-0 w-full z-40 backdrop-blur-xl ${isDark ? 'bg-[#0a0a0a]/90 border-b border-gray-800/50' : 'bg-[#fafafa]/90 border-b border-gray-200/50'}`}>
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onHome} className="hover:opacity-70 transition-opacity">
              <img src={PV_LOGO_URL} alt="PV" className="w-7 h-7 object-contain" />
            </button>
            <div className={`h-4 w-px ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`}></div>
            <button
              onClick={onBack}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs tracking-[0.15em] uppercase font-medium transition-all ${
                isDark ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <ChevronLeft size={14} />
              {t('Back')}
            </button>
            <div className={`h-4 w-px ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`}></div>
            <span className={`text-xs tracking-[0.15em] uppercase font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Us
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggleLanguage} className={`px-3 py-1.5 rounded-lg text-xs tracking-wider uppercase transition-all ${isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}>
              {language === 'en' ? 'IT' : 'EN'}
            </button>
            <button onClick={toggleTheme} className={`p-2 rounded-lg transition-all ${isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}>
              {isDark ? <Sun size={14} /> : <Moon size={14} />}
            </button>
          </div>
        </div>
      </nav>

      <div
        className="flex h-full"
        style={{
          transform: `translate3d(-${teamSlide * (100 / TEAM_SLIDES)}%, 0, 0)`,
          width: `${TEAM_SLIDES * 100}%`,
          transition: 'transform 1200ms cubic-bezier(0.16, 1, 0.3, 1)',
          willChange: 'transform',
          backfaceVisibility: 'hidden' as const,
        }}
      >
        {/* Sub-slide 0: VMV */}
        <div className="w-full flex-shrink-0 h-full flex flex-col justify-center px-3 sm:px-6 pt-14" style={{ width: `${100 / TEAM_SLIDES}%` }}>
          <div className="max-w-6xl mx-auto w-full">
            <div className="text-center mb-3 sm:mb-6">
              <div className={`inline-flex items-center gap-2 px-3 py-1 sm:px-4 sm:py-1.5 rounded-full text-[10px] sm:text-xs tracking-[0.2em] uppercase font-medium mb-2 sm:mb-4 ${
                isDark ? 'bg-amber-900/15 text-amber-500 border border-amber-800/20' : 'bg-amber-50 text-amber-600 border border-amber-100'
              }`}>
                <Compass size={12} className="sm:w-[14px] sm:h-[14px]" />
                {t('Vision, Mission & Values')}
              </div>
              <p className={`text-sm sm:text-lg italic max-w-lg mx-auto ${isDark ? 'text-amber-400/80' : 'text-amber-600/80'}`}>
                {t('brand_promise')}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 sm:gap-4">
              <div className={`rounded-xl border p-3 sm:p-6 ${isDark ? 'bg-gray-900/60 border-gray-800/60' : 'bg-white border-gray-200/80'}`}>
                <div className="flex items-center gap-2.5 sm:gap-3 mb-2 sm:mb-4">
                  <div className={`w-7 h-7 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-red-900/25' : 'bg-red-50'}`}>
                    <Rocket size={14} className="text-red-500 sm:w-[18px] sm:h-[18px]" />
                  </div>
                  <h3 className={`text-sm sm:text-base font-semibold uppercase tracking-wider ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {t('Mission')}
                  </h3>
                </div>
                <p className={`text-xs sm:text-sm leading-relaxed sm:mb-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  {t('mission_statement')}
                </p>
                <div className="hidden sm:block space-y-2">
                  {['mission_1', 'mission_2', 'mission_3', 'mission_4'].map((key) => (
                    <div key={key} className="flex items-start gap-2.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-[7px] flex-shrink-0" />
                      <p className={`text-xs leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t(key)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className={`rounded-xl border p-3 sm:p-6 ${isDark ? 'bg-gray-900/60 border-gray-800/60' : 'bg-white border-gray-200/80'}`}>
                <div className="flex items-center gap-2.5 sm:gap-3 mb-2 sm:mb-4">
                  <div className={`w-7 h-7 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-blue-900/25' : 'bg-blue-50'}`}>
                    <Compass size={14} className="text-blue-500 sm:w-[18px] sm:h-[18px]" />
                  </div>
                  <h3 className={`text-sm sm:text-base font-semibold uppercase tracking-wider ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {t('Vision')}
                  </h3>
                </div>
                <p className={`text-xs sm:text-sm leading-relaxed sm:mb-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  {t('vision_statement')}
                </p>
                <div className="hidden sm:block space-y-2">
                  {['vision_1', 'vision_2', 'vision_3', 'vision_4'].map((key) => (
                    <div key={key} className="flex items-start gap-2.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-[7px] flex-shrink-0" />
                      <p className={`text-xs leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t(key)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className={`rounded-xl border p-3 sm:p-6 ${isDark ? 'bg-gray-900/60 border-gray-800/60' : 'bg-white border-gray-200/80'}`}>
                <div className="flex items-center gap-2.5 sm:gap-3 mb-2 sm:mb-4">
                  <div className={`w-7 h-7 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-amber-900/25' : 'bg-amber-50'}`}>
                    <Star size={14} className="text-amber-500 sm:w-[18px] sm:h-[18px]" />
                  </div>
                  <h3 className={`text-sm sm:text-base font-semibold uppercase tracking-wider ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {t('Core Values')}
                  </h3>
                </div>
                <div className="space-y-1.5 sm:space-y-3.5">
                  <div>
                    <p className={`text-[10px] sm:text-xs font-semibold uppercase tracking-wider mb-0.5 sm:mb-1.5 ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>{t('values_athlete_title')}</p>
                    <p className={`text-[10px] sm:text-xs leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('values_athlete_desc')}</p>
                  </div>
                  <div>
                    <p className={`text-[10px] sm:text-xs font-semibold uppercase tracking-wider mb-0.5 sm:mb-1.5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>{t('values_citizen_title')}</p>
                    <p className={`text-[10px] sm:text-xs leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('values_citizen_desc')}</p>
                  </div>
                  <div>
                    <p className={`text-[10px] sm:text-xs font-semibold uppercase tracking-wider mb-0.5 sm:mb-1.5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>{t('values_org_title')}</p>
                    <p className={`text-[10px] sm:text-xs leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('values_org_desc')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sub-slide 1: About Us */}
        <div className="w-full flex-shrink-0 h-full flex flex-col justify-center px-3 sm:px-6 pt-14" style={{ width: `${100 / TEAM_SLIDES}%` }}>
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-3 sm:mb-8">
              <div className={`inline-flex items-center gap-2 px-3 py-1 sm:px-4 sm:py-1.5 rounded-full text-[10px] sm:text-xs tracking-[0.2em] uppercase font-medium mb-2 sm:mb-4 ${
                isDark ? 'bg-red-900/15 text-red-400 border border-red-800/20' : 'bg-red-50 text-red-600 border border-red-100'
              }`}>
                <Users size={12} className="sm:w-[14px] sm:h-[14px]" />
                {t('About Us')}
              </div>
              <h2 className={`text-xl sm:text-3xl lg:text-4xl font-light tracking-tight leading-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {t('about_headline')}
              </h2>
              <p className={`text-xs sm:text-base leading-relaxed max-w-2xl mx-auto mt-2 sm:mt-3 hidden sm:block ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                {t('about_subheadline')}
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 sm:gap-4 mb-3 sm:mb-8">
              <div className={`rounded-xl border p-3 sm:p-5 ${isDark ? 'bg-gray-900/60 border-gray-800/60' : 'bg-white border-gray-200/80'}`}>
                <div className={`w-7 h-7 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center mb-2 sm:mb-3 ${isDark ? 'bg-emerald-900/25' : 'bg-emerald-50'}`}>
                  <Leaf size={14} className="text-emerald-500 sm:w-[18px] sm:h-[18px]" />
                </div>
                <h3 className={`text-xs sm:text-base font-semibold mb-0.5 sm:mb-1.5 ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('Sustainability')}</h3>
                <p className={`text-[10px] sm:text-xs leading-relaxed hidden sm:block ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('pillar_sustainability')}</p>
              </div>
              <div className={`rounded-xl border p-3 sm:p-5 ${isDark ? 'bg-gray-900/60 border-gray-800/60' : 'bg-white border-gray-200/80'}`}>
                <div className={`w-7 h-7 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center mb-2 sm:mb-3 ${isDark ? 'bg-amber-900/25' : 'bg-amber-50'}`}>
                  <Lightbulb size={14} className="text-amber-500 sm:w-[18px] sm:h-[18px]" />
                </div>
                <h3 className={`text-xs sm:text-base font-semibold mb-0.5 sm:mb-1.5 ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('Innovation')}</h3>
                <p className={`text-[10px] sm:text-xs leading-relaxed hidden sm:block ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('pillar_innovation')}</p>
              </div>
              <div className={`rounded-xl border p-3 sm:p-5 ${isDark ? 'bg-gray-900/60 border-gray-800/60' : 'bg-white border-gray-200/80'}`}>
                <div className={`w-7 h-7 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center mb-2 sm:mb-3 ${isDark ? 'bg-blue-900/25' : 'bg-blue-50'}`}>
                  <BarChart3 size={14} className="text-blue-500 sm:w-[18px] sm:h-[18px]" />
                </div>
                <h3 className={`text-xs sm:text-base font-semibold mb-0.5 sm:mb-1.5 ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('Data-Driven')}</h3>
                <p className={`text-[10px] sm:text-xs leading-relaxed hidden sm:block ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('pillar_datadriven')}</p>
              </div>
              <div className={`rounded-xl border p-3 sm:p-5 ${isDark ? 'bg-gray-900/60 border-gray-800/60' : 'bg-white border-gray-200/80'}`}>
                <div className={`w-7 h-7 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center mb-2 sm:mb-3 ${isDark ? 'bg-red-900/25' : 'bg-red-50'}`}>
                  <Rocket size={14} className="text-red-500 sm:w-[18px] sm:h-[18px]" />
                </div>
                <h3 className={`text-xs sm:text-base font-semibold mb-0.5 sm:mb-1.5 ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('Ambition')}</h3>
                <p className={`text-[10px] sm:text-xs leading-relaxed hidden sm:block ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('pillar_ambition')}</p>
              </div>
              <div className={`rounded-xl border p-3 sm:p-5 col-span-2 sm:col-span-1 ${isDark ? 'bg-gray-900/60 border-gray-800/60' : 'bg-white border-gray-200/80'}`}>
                <div className={`w-7 h-7 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center mb-2 sm:mb-3 ${isDark ? 'bg-purple-900/25' : 'bg-purple-50'}`}>
                  <TrendingUp size={14} className="text-purple-500 sm:w-[18px] sm:h-[18px]" />
                </div>
                <h3 className={`text-xs sm:text-base font-semibold mb-0.5 sm:mb-1.5 ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('Development')}</h3>
                <p className={`text-[10px] sm:text-xs leading-relaxed hidden sm:block ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('pillar_development')}</p>
              </div>
            </div>

            <div className={`rounded-xl border p-3 sm:p-6 ${isDark ? 'bg-gray-900/40 border-gray-800/40' : 'bg-gray-50/80 border-gray-200/60'}`}>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-8">
                <StatCounter target={10} label={t('League Titles')} active={true} isDark={isDark} />
                <StatCounter target={5} label={t('EuroLeague Titles')} active={true} isDark={isDark} />
                <StatCounter target={3} label={t('Intercontinental Cups')} active={true} isDark={isDark} />
                <StatCounter target={80} label={t('Years of History')} active={true} isDark={isDark} />
              </div>
            </div>
          </div>
        </div>

        {/* Sub-slide 2: Ownership */}
        <div className="w-full flex-shrink-0 h-full flex flex-col justify-center px-3 sm:px-8 pt-14" style={{ width: `${100 / TEAM_SLIDES}%` }}>
          <div className="max-w-6xl mx-auto w-full">
            <div className="text-center mb-3 sm:mb-6">
              <div className={`inline-flex items-center gap-2 px-3 py-1 sm:px-4 sm:py-1.5 rounded-full text-[10px] sm:text-xs tracking-[0.2em] uppercase font-medium mb-2 sm:mb-4 ${
                isDark ? 'bg-purple-900/15 text-purple-400 border border-purple-800/20' : 'bg-purple-50 text-purple-600 border border-purple-100'
              }`}>
                <Shield size={12} className="sm:w-[14px] sm:h-[14px]" />
                {t('Ownership')}
              </div>
              <h2 className={`text-xl sm:text-3xl font-light tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {t('Shareholder Structure')}
              </h2>
              <p className={`text-xs sm:text-base mt-1 sm:mt-2 max-w-lg mx-auto hidden sm:block ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                {t('ownership_subtitle')}
              </p>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-3 sm:gap-6 md:gap-10">
              <div className="flex-shrink-0" style={{ width: 'min(200px, 50vw)', height: 'min(200px, 50vw)' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={OWNERSHIP_DATA} cx="50%" cy="50%" innerRadius="55%" outerRadius="95%" paddingAngle={2} dataKey="value" stroke="none" animationBegin={200} animationDuration={1200}>
                      {OWNERSHIP_DATA.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 w-full max-w-md">
                <div className="space-y-1.5 sm:space-y-3">
                  {OWNERSHIP_DATA.map((item, i) => (
                    <div key={i} className={`flex items-center justify-between px-3 py-2 sm:px-5 sm:py-3 rounded-lg ${
                      isDark ? 'bg-gray-900/60 border border-gray-800/50' : 'bg-white border border-gray-200/80'
                    }`}>
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                        <span className={`text-[11px] sm:text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{item.name}</span>
                      </div>
                      <span className={`text-xs sm:text-base font-semibold tabular-nums ml-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{item.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sub-slide 3: Board */}
        <div className="w-full flex-shrink-0 h-full flex flex-col justify-center px-3 sm:px-6 pt-14" style={{ width: `${100 / TEAM_SLIDES}%` }}>
          <div className="max-w-6xl mx-auto w-full">
            <div className="text-center mb-3 sm:mb-6">
              <div className={`inline-flex items-center gap-2 px-3 py-1 sm:px-4 sm:py-1.5 rounded-full text-[10px] sm:text-xs tracking-[0.2em] uppercase font-medium mb-2 sm:mb-4 ${
                isDark ? 'bg-indigo-900/15 text-indigo-400 border border-indigo-800/20' : 'bg-indigo-50 text-indigo-600 border border-indigo-100'
              }`}>
                <Briefcase size={12} className="sm:w-[14px] sm:h-[14px]" />
                {t('Board of Directors')}
              </div>
              <h2 className={`text-xl sm:text-3xl font-light tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {t('Consiglio di Amministrazione')}
              </h2>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-4">
              {BOARD_MEMBERS.map((member, i) => (
                <div key={i} className={`rounded-xl border p-2.5 sm:p-5 text-center transition-all duration-500 hover:scale-[1.02] ${
                  isDark ? 'bg-gray-900/60 border-gray-800/60 hover:border-gray-700' : 'bg-white border-gray-200/80 hover:border-gray-300'
                }`}>
                  <div className="w-11 h-11 sm:w-16 sm:h-16 rounded-full mx-auto mb-2 sm:mb-3 overflow-hidden border-2" style={{ borderColor: member.color }}>
                    <img src={member.photo} alt={member.name} className="w-full h-full object-cover" />
                  </div>
                  <h3 className={`text-[11px] sm:text-sm font-semibold mb-0.5 sm:mb-1 leading-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>{member.name}</h3>
                  <p className="text-[10px] sm:text-xs tracking-[0.05em] sm:tracking-[0.1em] uppercase font-medium sm:mb-3" style={{ color: member.color }}>{t(member.roleKey)}</p>
                  <p className={`text-xs leading-relaxed hidden sm:block ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t(member.bioKey)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sub-slide 4: Special Advisors */}
        <div className="w-full flex-shrink-0 h-full flex flex-col justify-center px-3 sm:px-6 pt-14" style={{ width: `${100 / TEAM_SLIDES}%` }}>
          <div className="max-w-5xl mx-auto w-full">
            <div className="text-center mb-3 sm:mb-6">
              <div className={`inline-flex items-center gap-2 px-3 py-1 sm:px-4 sm:py-1.5 rounded-full text-[10px] sm:text-xs tracking-[0.2em] uppercase font-medium mb-2 sm:mb-4 ${
                isDark ? 'bg-violet-900/15 text-violet-400 border border-violet-800/20' : 'bg-violet-50 text-violet-600 border border-violet-100'
              }`}>
                <Crown size={12} className="sm:w-[14px] sm:h-[14px]" />
                {t('Special Advisors')}
              </div>
              <h2 className={`text-xl sm:text-3xl font-light tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {t('Strategic Advisory Board')}
              </h2>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-3 gap-2 sm:gap-4">
              {SPECIAL_ADVISORS.map((advisor, i) => (
                <div key={i} className={`rounded-xl border p-2.5 sm:p-5 text-center transition-all duration-500 hover:scale-[1.02] ${
                  isDark ? 'bg-gray-900/60 border-gray-800/60 hover:border-gray-700' : 'bg-white border-gray-200/80 hover:border-gray-300'
                }`}>
                  <div className="w-11 h-11 sm:w-16 sm:h-16 rounded-full mx-auto mb-2 sm:mb-3 overflow-hidden flex items-center justify-center text-white text-sm sm:text-lg font-bold" style={{ backgroundColor: advisor.color }}>
                    {advisor.photo ? <img src={advisor.photo} alt={advisor.name} className="w-full h-full object-cover" /> : advisor.initials}
                  </div>
                  <h3 className={`text-[11px] sm:text-sm font-semibold mb-0.5 sm:mb-1 leading-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>{advisor.name}</h3>
                  <p className="text-[10px] sm:text-xs tracking-[0.05em] uppercase font-medium mb-0.5 sm:mb-1" style={{ color: advisor.color }}>{advisor.org}</p>
                  <p className="text-[10px] sm:text-xs tracking-[0.05em] sm:tracking-[0.1em] uppercase font-medium sm:mb-3" style={{ color: advisor.color, opacity: 0.7 }}>{t(advisor.roleKey)}</p>
                  <p className={`text-xs leading-relaxed hidden sm:block ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t(advisor.bioKey)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sub-slide 5: ELT */}
        <div className="w-full flex-shrink-0 h-full flex flex-col justify-center px-3 sm:px-6 pt-14" style={{ width: `${100 / TEAM_SLIDES}%` }}>
          <div className="max-w-5xl mx-auto w-full">
            <div className="text-center mb-3 sm:mb-6">
              <div className={`inline-flex items-center gap-2 px-3 py-1 sm:px-4 sm:py-1.5 rounded-full text-[10px] sm:text-xs tracking-[0.2em] uppercase font-medium mb-2 sm:mb-4 ${
                isDark ? 'bg-emerald-900/15 text-emerald-400 border border-emerald-800/20' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
              }`}>
                <Star size={12} className="sm:w-[14px] sm:h-[14px]" />
                {t('Elite Leadership Team')}
              </div>
              <h2 className={`text-xl sm:text-3xl font-light tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {t('Executive Leadership')}
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
              {ELT_MEMBERS.map((member, i) => (
                <div key={i} className={`rounded-xl border p-2.5 sm:p-5 text-center transition-all duration-500 hover:scale-[1.02] ${
                  isDark ? 'bg-gray-900/60 border-gray-800/60 hover:border-gray-700' : 'bg-white border-gray-200/80 hover:border-gray-300'
                }`}>
                  <div className="w-11 h-11 sm:w-16 sm:h-16 rounded-full mx-auto mb-2 sm:mb-3 overflow-hidden flex items-center justify-center text-white text-sm sm:text-lg font-bold" style={{ backgroundColor: member.color }}>
                    {member.photo ? <img src={member.photo} alt={member.name} className="w-full h-full object-cover" /> : member.initials}
                  </div>
                  <h3 className={`text-[11px] sm:text-sm font-semibold mb-0.5 sm:mb-1 leading-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>{member.name}</h3>
                  <p className="text-[10px] sm:text-xs tracking-[0.05em] sm:tracking-[0.1em] uppercase font-medium sm:mb-3" style={{ color: member.color }}>{t(member.roleKey)}</p>
                  <p className={`text-xs leading-relaxed hidden sm:block ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t(member.bioKey)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sub-slide 6: Departments */}
        <div className="w-full flex-shrink-0 h-full flex flex-col justify-center px-3 sm:px-6 pt-14" style={{ width: `${100 / TEAM_SLIDES}%` }}>
          <div className="max-w-6xl mx-auto w-full">
            <div className="text-center mb-3 sm:mb-6">
              <div className={`inline-flex items-center gap-2 px-3 py-1 sm:px-4 sm:py-1.5 rounded-full text-[10px] sm:text-xs tracking-[0.2em] uppercase font-medium mb-2 sm:mb-4 ${
                isDark ? 'bg-amber-900/15 text-amber-400 border border-amber-800/20' : 'bg-amber-50 text-amber-600 border border-amber-100'
              }`}>
                <Layers size={12} className="sm:w-[14px] sm:h-[14px]" />
                {t('Departments')}
              </div>
              <h2 className={`text-xl sm:text-3xl font-light tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {t('Department Overview')}
              </h2>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-4 gap-1.5 sm:gap-4">
              {DEPT_MEMBERS.map((member, i) => (
                <div key={i} className={`rounded-xl border p-2 sm:p-5 text-center transition-all duration-500 hover:scale-[1.02] ${
                  isDark ? 'bg-gray-900/60 border-gray-800/60 hover:border-gray-700' : 'bg-white border-gray-200/80 hover:border-gray-300'
                }`}>
                  <div className="rounded-full mx-auto mb-1.5 sm:mb-3 flex items-center justify-center text-white text-xs sm:text-base font-bold w-9 h-9 sm:w-[3.25rem] sm:h-[3.25rem]" style={{ backgroundColor: member.color }}>
                    {member.initials}
                  </div>
                  <h3 className={`text-[10px] sm:text-sm font-semibold mb-0.5 sm:mb-1 leading-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>{member.name}</h3>
                  <p className="text-[9px] sm:text-xs tracking-[0.03em] sm:tracking-[0.05em] uppercase font-medium leading-tight" style={{ color: member.color }}>{t(member.roleKey)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sub-slide 7: External Services */}
        <div className="w-full flex-shrink-0 h-full flex flex-col justify-center px-3 sm:px-6 pt-14" style={{ width: `${100 / TEAM_SLIDES}%` }}>
          <div className="max-w-5xl mx-auto w-full">
            <div className="text-center mb-3 sm:mb-6">
              <div className={`inline-flex items-center gap-2 px-3 py-1 sm:px-4 sm:py-1.5 rounded-full text-[10px] sm:text-xs tracking-[0.2em] uppercase font-medium mb-2 sm:mb-4 ${
                isDark ? 'bg-cyan-900/15 text-cyan-400 border border-cyan-800/20' : 'bg-cyan-50 text-cyan-600 border border-cyan-100'
              }`}>
                <Globe size={12} className="sm:w-[14px] sm:h-[14px]" />
                {t('External Services')}
              </div>
              <h2 className={`text-xl sm:text-3xl font-light tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {t('Partner Network')}
              </h2>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-3 gap-2 sm:gap-4">
              {EXT_SERVICES.map((svc, i) => (
                <div key={i} className={`rounded-xl border p-2.5 sm:p-5 text-center transition-all duration-500 hover:scale-[1.02] ${
                  isDark ? 'bg-gray-900/60 border-gray-800/60 hover:border-gray-700' : 'bg-white border-gray-200/80 hover:border-gray-300'
                }`}>
                  <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full mx-auto mb-1.5 sm:mb-3 flex items-center justify-center text-white text-xs sm:text-base font-bold" style={{ backgroundColor: svc.color }}>
                    {svc.initials}
                  </div>
                  <h3 className={`text-[11px] sm:text-sm font-semibold mb-0.5 sm:mb-1 leading-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>{svc.name}</h3>
                  <p className="text-[10px] sm:text-xs tracking-[0.03em] sm:tracking-[0.05em] uppercase font-medium" style={{ color: svc.color }}>{t(svc.roleKey)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Sub-slide navigation */}
      <div className="absolute bottom-12 sm:bottom-16 left-1/2 -translate-x-1/2 flex items-center gap-2 sm:gap-4 z-10">
        <button
          onClick={() => goToTeamSlide(teamSlide - 1)}
          className={`p-2 rounded-full transition-all duration-300 ${
            teamSlide === 0
              ? 'opacity-0 pointer-events-none'
              : isDark ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <ChevronLeft size={18} />
        </button>

        <div className="flex items-center gap-2">
          {slideLabels.map((label, i) => (
            <button
              key={i}
              onClick={() => goToTeamSlide(i)}
              className={`rounded-full transition-all duration-500 ${
                teamSlide === i
                  ? isDark ? 'bg-white/10 text-white' : 'bg-gray-900/10 text-gray-900'
                  : isDark ? 'text-gray-600 hover:text-gray-400' : 'text-gray-300 hover:text-gray-500'
              }`}
            >
              <span className="hidden sm:inline px-3 py-1.5 text-xs tracking-[0.15em] uppercase font-medium">{label}</span>
              <span className={`sm:hidden flex items-center justify-center w-8 h-8`}>
                <span className={`block w-2.5 h-2.5 rounded-full transition-all ${
                  teamSlide === i
                    ? isDark ? 'bg-white scale-125' : 'bg-gray-900 scale-125'
                    : isDark ? 'bg-gray-600' : 'bg-gray-300'
                }`} />
              </span>
            </button>
          ))}
        </div>

        <button
          onClick={() => goToTeamSlide(teamSlide + 1)}
          className={`p-2 rounded-full transition-all duration-300 ${
            teamSlide === TEAM_SLIDES - 1
              ? 'opacity-0 pointer-events-none'
              : isDark ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Progress bar */}
      <div className={`absolute bottom-7 sm:bottom-10 left-1/2 -translate-x-1/2 w-32 sm:w-48 h-0.5 rounded-full overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`}>
        <div
          className={`h-full rounded-full ${isDark ? 'bg-purple-500' : 'bg-purple-400'}`}
          style={{ width: `${((teamSlide + 1) / TEAM_SLIDES) * 100}%`, transition: 'width 1200ms cubic-bezier(0.16, 1, 0.3, 1)' }}
        />
      </div>

      {/* Footer */}
      <div className={`absolute bottom-1 sm:bottom-3 left-1/2 -translate-x-1/2`}>
        <div className={`flex items-center gap-3 text-[9px] tracking-[0.2em] uppercase ${isDark ? 'text-gray-700' : 'text-gray-300'}`}>
          <span>Pallacanestro Varese</span>
          <span className="w-px h-2.5 bg-current"></span>
          <span>{t('Season')} 2025/26</span>
        </div>
      </div>
    </div>
  );
};
