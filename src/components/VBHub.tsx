import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ArrowRight, Sun, Moon, ChevronLeft, Eye, Heart, Target, Users, GraduationCap, Activity, Shield, Construction, Layers, BookOpen, ExternalLink, Globe, Rocket, Star, Compass, ChevronRight } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';

const VB_LOGO_URL = "https://i.imgur.com/e7khORs.png";

interface VBHubProps {
  onNavigate: (section: string) => void;
  onBackToWelcome: () => void;
}

export const VBHub: React.FC<VBHubProps> = ({ onNavigate, onBackToWelcome }) => {
  const { theme, toggleTheme } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();
  const isDark = theme === 'dark';
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 150);
    const t2 = setTimeout(() => setPhase(2), 600);
    const t3 = setTimeout(() => setPhase(3), 1000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  const cards = [
    {
      id: 'us',
      label: 'Us',
      desc: t('Vision, Mission, Values & Our Team'),
      icon: Users,
      color: 'orange',
      action: () => onNavigate('vb-us'),
      actionLabel: t('Enter'),
      actionIcon: ArrowRight,
    },
    {
      id: 'youth',
      label: t('Youth Development'),
      desc: t('Player profiles, session tracking, progression analytics & scouting database'),
      icon: Activity,
      color: 'amber',
      action: () => onNavigate('vb'),
      actionLabel: t('Enter'),
      actionIcon: ArrowRight,
    },
  ];

  const colorMap: Record<string, { bg: string; hoverBorder: string; hoverShadow: string; iconBg: string; text: string; topBar: string }> = {
    orange: {
      bg: isDark ? 'bg-gray-900/50' : 'bg-white',
      hoverBorder: isDark ? 'hover:border-orange-800/60' : 'hover:border-orange-300',
      hoverShadow: isDark ? 'hover:shadow-orange-950/10' : 'hover:shadow-orange-100/30',
      iconBg: isDark ? 'bg-orange-900/20' : 'bg-orange-50',
      text: isDark ? 'text-orange-500' : 'text-orange-600',
      topBar: 'from-orange-600 to-orange-400',
    },
    amber: {
      bg: isDark ? 'bg-gray-900/50' : 'bg-white',
      hoverBorder: isDark ? 'hover:border-amber-800/60' : 'hover:border-amber-300',
      hoverShadow: isDark ? 'hover:shadow-amber-950/10' : 'hover:shadow-amber-100/30',
      iconBg: isDark ? 'bg-amber-900/20' : 'bg-amber-50',
      text: isDark ? 'text-amber-500' : 'text-amber-600',
      topBar: 'from-amber-600 to-amber-400',
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
          isDark ? 'bg-orange-950/20' : 'bg-orange-50/80'
        }`} style={{ filter: 'blur(120px)' }}></div>
      </div>

      <div className={`absolute top-0 left-0 w-full h-px ${isDark ? 'bg-gradient-to-r from-transparent via-orange-800/40 to-transparent' : 'bg-gradient-to-r from-transparent via-orange-200 to-transparent'}`}></div>

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
              <img src={VB_LOGO_URL} alt="VB" className="w-14 h-14 sm:w-16 sm:h-16 object-contain mx-auto" />
            </button>
            <p className={`text-xs tracking-[0.25em] uppercase font-medium mb-6 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
              Varese Basketball
            </p>
            <div className="flex justify-center mb-8">
              <div className={`h-px animate-line ${isDark ? 'bg-orange-700' : 'bg-orange-400'}`}></div>
            </div>
          </div>

          <div className={`transition-all duration-[1s] ease-out delay-300 ${phase >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            <p className={`text-xs tracking-[0.25em] uppercase font-medium mb-8 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
              {t('Choose your area')}
            </p>
          </div>

          <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 w-full max-w-2xl transition-all duration-1000 ease-out ${phase >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            {cards.map((card) => {
              const colors = colorMap[card.color];
              const Icon = card.icon;
              const ActionIcon = card.actionIcon;

              return (
                <button
                  key={card.id}
                  onClick={card.action}
                  className={`group relative rounded-2xl border transition-all duration-500 overflow-hidden hover:shadow-2xl text-left ${colors.bg} ${
                    isDark ? 'border-gray-800' : 'border-gray-200'
                  } ${colors.hoverBorder} ${colors.hoverShadow}`}
                >
                  <div className={`absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r ${colors.topBar} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
                  <div className="p-5 sm:p-8 flex flex-col items-center text-center">
                    <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center mb-4 sm:mb-5 ${colors.iconBg}`}>
                      <Icon size={24} className={`${colors.text} sm:w-[28px] sm:h-[28px]`} />
                    </div>
                    <h3 className={`text-base sm:text-xl font-semibold mb-1.5 sm:mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {card.label}
                    </h3>
                    <p className={`text-[10px] sm:text-xs leading-relaxed mb-4 sm:mb-5 min-h-[2rem] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                      {card.desc}
                    </p>
                    <div className={`inline-flex items-center gap-2 text-[10px] sm:text-xs font-medium tracking-wider uppercase group-hover:gap-3 transition-all ${colors.text}`}>
                      {card.actionLabel}
                      <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className={`absolute bottom-8 left-1/2 -translate-x-1/2 transition-all duration-1000 ${phase >= 3 ? 'opacity-100' : 'opacity-0'}`}>
          <div className={`flex items-center gap-4 text-[10px] tracking-[0.25em] uppercase ${isDark ? 'text-gray-700' : 'text-gray-300'}`}>
            <span>Varese Basketball</span>
            <span className="w-px h-3 bg-current"></span>
            <span>{t('Season')} 2025/26</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const US_SUB_SLIDES = 4;

interface VBUsPageProps {
  onBack: () => void;
  onHome: () => void;
  onNavigate: (section: string) => void;
}

export const VBUsPage: React.FC<VBUsPageProps> = ({ onBack, onHome, onNavigate }) => {
  const { theme, toggleTheme } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();
  const isDark = theme === 'dark';

  const containerRef = useRef<HTMLDivElement>(null);
  const [usSlide, setUsSlide] = useState(0);
  const currentUsSlide = useRef(0);
  const isSliding = useRef(false);

  const goToUsSlide = useCallback((index: number) => {
    if (isSliding.current || index < 0 || index >= US_SUB_SLIDES) return;
    isSliding.current = true;
    currentUsSlide.current = index;
    setUsSlide(index);
    setTimeout(() => { isSliding.current = false; }, 600);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let accumulated = 0;
    let lastTime = 0;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (isSliding.current) return;
      const now = Date.now();
      if (now - lastTime > 800) accumulated = 0;
      lastTime = now;
      accumulated += e.deltaY;
      const threshold = 80;

      if (Math.abs(accumulated) >= threshold) {
        if (accumulated > 0 && currentUsSlide.current < US_SUB_SLIDES - 1) {
          goToUsSlide(currentUsSlide.current + 1);
        } else if (accumulated < 0 && currentUsSlide.current > 0) {
          goToUsSlide(currentUsSlide.current - 1);
        }
        accumulated = 0;
      }
    };

    let touchStartY = 0;
    const handleTouchStart = (e: TouchEvent) => { touchStartY = e.touches[0].clientY; };
    const handleTouchEnd = (e: TouchEvent) => {
      if (isSliding.current) return;
      const deltaY = touchStartY - e.changedTouches[0].clientY;
      if (Math.abs(deltaY) > 50) {
        if (deltaY > 0 && currentUsSlide.current < US_SUB_SLIDES - 1) {
          goToUsSlide(currentUsSlide.current + 1);
        } else if (deltaY < 0 && currentUsSlide.current > 0) {
          goToUsSlide(currentUsSlide.current - 1);
        }
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'PageDown') {
        e.preventDefault();
        if (currentUsSlide.current < US_SUB_SLIDES - 1) goToUsSlide(currentUsSlide.current + 1);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        if (currentUsSlide.current > 0) goToUsSlide(currentUsSlide.current - 1);
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    container.addEventListener('touchstart', handleTouchStart);
    container.addEventListener('touchend', handleTouchEnd);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [goToUsSlide]);

  const usSubLabels = [
    t('Vision, Mission & Values'),
    t('About Us'),
    t('Our Method'),
    t('Our Team'),
  ];

  return (
    <div
      ref={containerRef}
      className={`h-screen overflow-hidden relative ${isDark ? 'bg-[#0a0a0a]' : 'bg-[#fafafa]'}`}
    >
      <style>{`
        @keyframes line-grow { from { width: 0; } to { width: 60px; } }
        @keyframes bounce-subtle { 0%, 100% { transform: translateX(-50%) translateY(0); } 50% { transform: translateX(-50%) translateY(6px); } }
        .line-grow { animation: line-grow 0.8s ease-out 0.3s forwards; width: 0; }
        .bounce-arrow { animation: bounce-subtle 2s ease-in-out infinite; }
      `}</style>

      <div className={`fixed top-0 left-0 w-full h-px z-50 ${isDark ? 'bg-gradient-to-r from-transparent via-orange-800/40 to-transparent' : 'bg-gradient-to-r from-transparent via-orange-200 to-transparent'}`}></div>

      <nav className={`fixed top-0 left-0 w-full z-40 backdrop-blur-xl ${isDark ? 'bg-[#0a0a0a]/90 border-b border-gray-800/50' : 'bg-[#fafafa]/90 border-b border-gray-200/50'}`}>
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="hover:opacity-70 transition-opacity flex items-center gap-2">
              <ChevronLeft size={16} className={isDark ? 'text-gray-500' : 'text-gray-400'} />
              <img src={VB_LOGO_URL} alt="VB" className="w-7 h-7 object-contain" />
            </button>
            <div className={`h-4 w-px ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`}></div>
            <span className={`text-xs tracking-[0.15em] uppercase font-medium ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Varese Basketball</span>
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

      <div className="h-screen relative overflow-hidden pt-14">
        {/* Sub-slide 0: VMV */}
        <div className={`absolute inset-0 flex flex-col items-center justify-center px-4 sm:px-6 transition-opacity duration-500 ${usSlide === 0 ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
          <div className="max-w-6xl mx-auto w-full">
            <div className="text-center mb-3 sm:mb-6">
              <div className="flex items-center justify-center gap-3 mb-2 sm:mb-4">
                <img src={VB_LOGO_URL} alt="VB" className="w-12 h-12 sm:w-14 sm:h-14 object-contain" />
                <div className={`inline-flex items-center gap-2 px-3 py-1 sm:px-4 sm:py-1.5 rounded-full text-[10px] sm:text-xs tracking-[0.2em] uppercase font-medium ${
                  isDark ? 'bg-orange-900/15 text-orange-400 border border-orange-800/20' : 'bg-orange-50 text-orange-600 border border-orange-100'
                }`}>
                  <Compass size={12} className="sm:w-[14px] sm:h-[14px]" />
                  {t('Vision, Mission & Values')}
                </div>
              </div>
              <p className={`text-sm sm:text-lg italic max-w-lg mx-auto ${isDark ? 'text-orange-400/80' : 'text-orange-600/80'}`}>
                {t('vb_brand_promise')}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 sm:gap-4">
              <div className={`rounded-xl border p-3 sm:p-6 ${isDark ? 'bg-gray-900/60 border-gray-800/60' : 'bg-white border-gray-200/80'}`}>
                <div className="flex items-center gap-2.5 sm:gap-3 mb-2 sm:mb-4">
                  <div className={`w-7 h-7 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-orange-900/25' : 'bg-orange-50'}`}>
                    <Rocket size={14} className="text-orange-500 sm:w-[18px] sm:h-[18px]" />
                  </div>
                  <h3 className={`text-sm sm:text-base font-semibold uppercase tracking-wider ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {t('Mission')}
                  </h3>
                </div>
                <p className={`text-xs sm:text-sm leading-relaxed sm:mb-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  {t('vb_mission_statement')}
                </p>
                <div className="hidden sm:block space-y-2">
                  {['vb_mission_1', 'vb_mission_2', 'vb_mission_3', 'vb_mission_4'].map((key) => (
                    <div key={key} className="flex items-start gap-2.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-[7px] flex-shrink-0" />
                      <p className={`text-xs leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t(key)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className={`rounded-xl border p-3 sm:p-6 ${isDark ? 'bg-gray-900/60 border-gray-800/60' : 'bg-white border-gray-200/80'}`}>
                <div className="flex items-center gap-2.5 sm:gap-3 mb-2 sm:mb-4">
                  <div className={`w-7 h-7 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-blue-900/25' : 'bg-blue-50'}`}>
                    <Eye size={14} className="text-blue-500 sm:w-[18px] sm:h-[18px]" />
                  </div>
                  <h3 className={`text-sm sm:text-base font-semibold uppercase tracking-wider ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {t('Vision')}
                  </h3>
                </div>
                <p className={`text-xs sm:text-sm leading-relaxed sm:mb-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  {t('vb_vision_statement')}
                </p>
                <div className="hidden sm:block space-y-2">
                  {['vb_vision_1', 'vb_vision_2', 'vb_vision_3', 'vb_vision_4'].map((key) => (
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
                    <p className={`text-[10px] sm:text-xs font-semibold uppercase tracking-wider mb-0.5 sm:mb-1.5 ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>{t('vb_values_player_title')}</p>
                    <p className={`text-[10px] sm:text-xs leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('vb_values_player_desc')}</p>
                  </div>
                  <div>
                    <p className={`text-[10px] sm:text-xs font-semibold uppercase tracking-wider mb-0.5 sm:mb-1.5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>{t('vb_values_method_title')}</p>
                    <p className={`text-[10px] sm:text-xs leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('vb_values_method_desc')}</p>
                  </div>
                  <div>
                    <p className={`text-[10px] sm:text-xs font-semibold uppercase tracking-wider mb-0.5 sm:mb-1.5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>{t('vb_values_culture_title')}</p>
                    <p className={`text-[10px] sm:text-xs leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('vb_values_culture_desc')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sub-slide 1: About Us */}
        <div className={`absolute inset-0 flex flex-col items-center justify-center px-4 sm:px-6 transition-opacity duration-500 ${usSlide === 1 ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
          <div className="max-w-3xl mx-auto text-center">
            <p className={`text-[10px] sm:text-xs tracking-[0.3em] uppercase font-medium mb-3 sm:mb-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              {t('About Us')}
            </p>
            <h2 className={`text-2xl sm:text-3xl lg:text-4xl font-light tracking-tight mb-6 sm:mb-8 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {t('vb_about_title')}
            </h2>
            <div className="flex justify-center mb-8 sm:mb-12">
              <div className={`h-px line-grow ${isDark ? 'bg-orange-700' : 'bg-orange-300'}`}></div>
            </div>
            <div className={`rounded-2xl border p-8 sm:p-12 ${isDark ? 'bg-gray-900/50 border-gray-800' : 'bg-white border-gray-200'}`}>
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 ${isDark ? 'bg-orange-900/20' : 'bg-orange-50'}`}>
                <Globe size={28} className="text-orange-500" />
              </div>
              <p className={`text-sm sm:text-base leading-relaxed mb-8 max-w-lg mx-auto ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {t('vb_about_description')}
              </p>
              <a
                href="https://varesebasket.pallacanestrovarese.club/"
                target="_blank"
                rel="noopener noreferrer"
                className={`group inline-flex items-center gap-3 px-8 py-3 rounded-xl text-sm font-medium tracking-wider uppercase transition-all duration-300 ${
                  isDark
                    ? 'bg-orange-900/30 text-orange-400 border border-orange-800/50 hover:bg-orange-900/50 hover:border-orange-700'
                    : 'bg-orange-50 text-orange-600 border border-orange-200 hover:bg-orange-100 hover:border-orange-300'
                }`}
              >
                {t('vb_check_us_out')}
                <ExternalLink size={16} className="group-hover:translate-x-1 group-hover:-translate-y-0.5 transition-transform" />
              </a>
            </div>
          </div>
        </div>

        {/* Sub-slide 2: Our Method */}
        <div className={`absolute inset-0 flex flex-col items-center justify-center px-4 sm:px-6 transition-opacity duration-500 ${usSlide === 2 ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
          <div className="max-w-3xl mx-auto text-center">
            <p className={`text-[10px] sm:text-xs tracking-[0.3em] uppercase font-medium mb-3 sm:mb-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              {t('Our Method')}
            </p>
            <h2 className={`text-2xl sm:text-3xl lg:text-4xl font-light tracking-tight mb-6 sm:mb-8 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {t('The Official Club Manual')}
            </h2>
            <div className="flex justify-center mb-8 sm:mb-12">
              <div className={`h-px line-grow ${isDark ? 'bg-orange-700' : 'bg-orange-300'}`}></div>
            </div>
            <div className={`rounded-2xl border p-8 sm:p-12 ${isDark ? 'bg-gray-900/50 border-gray-800' : 'bg-white border-gray-200'}`}>
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 ${isDark ? 'bg-orange-900/20' : 'bg-orange-50'}`}>
                <BookOpen size={28} className="text-orange-500" />
              </div>
              <p className={`text-sm sm:text-base leading-relaxed mb-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {t('vb_method_description')}
              </p>
              <button
                onClick={() => onNavigate('vb-manual')}
                className={`group inline-flex items-center gap-3 px-8 py-3 rounded-xl text-sm font-medium tracking-wider uppercase transition-all duration-300 ${
                  isDark
                    ? 'bg-orange-900/30 text-orange-400 border border-orange-800/50 hover:bg-orange-900/50 hover:border-orange-700'
                    : 'bg-orange-50 text-orange-600 border border-orange-200 hover:bg-orange-100 hover:border-orange-300'
                }`}
              >
                {t('Read the Manual')}
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>

        {/* Sub-slide 3: Our Team */}
        <div className={`absolute inset-0 flex flex-col items-center justify-center px-4 sm:px-6 transition-opacity duration-500 ${usSlide === 3 ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
          <div className="max-w-4xl mx-auto text-center">
            <p className={`text-[10px] sm:text-xs tracking-[0.3em] uppercase font-medium mb-3 sm:mb-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              {t('Our Team')}
            </p>
            <h2 className={`text-2xl sm:text-3xl lg:text-4xl font-light tracking-tight mb-6 sm:mb-8 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {t('Staff & Coaching')}
            </h2>
            <div className="flex justify-center mb-8 sm:mb-12">
              <div className={`h-px line-grow ${isDark ? 'bg-orange-700' : 'bg-orange-300'}`}></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
              <div className={`rounded-2xl border p-5 sm:p-6 text-left ${isDark ? 'bg-gray-900/50 border-gray-800' : 'bg-white border-gray-200'}`}>
                <div className="flex items-center gap-2 mb-4">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? 'bg-orange-900/20' : 'bg-orange-50'}`}>
                    <Shield size={16} className="text-orange-500" />
                  </div>
                  <h3 className={`text-xs font-semibold tracking-[0.15em] uppercase ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>
                    {t('Executive Leadership')}
                  </h3>
                </div>
                <div className="space-y-3">
                  {[
                    { name: 'Federico Bellotto', role: 'CEO · Head of Business Opportunities' },
                    { name: 'Luis Scola', role: 'Elite Development Leader' },
                  ].map((p) => (
                    <div key={p.name}>
                      <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{p.name}</p>
                      <p className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{p.role}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className={`rounded-2xl border p-5 sm:p-6 text-left ${isDark ? 'bg-gray-900/50 border-gray-800' : 'bg-white border-gray-200'}`}>
                <div className="flex items-center gap-2 mb-4">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? 'bg-blue-900/20' : 'bg-blue-50'}`}>
                    <Target size={16} className="text-blue-500" />
                  </div>
                  <h3 className={`text-xs font-semibold tracking-[0.15em] uppercase ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                    {t('Coaching Staff')}
                  </h3>
                </div>
                <div className="space-y-3">
                  {[
                    { name: 'Marco Legovich', role: 'Head Coach' },
                    { name: 'Paolo Mara', role: 'Asst. Coach' },
                    { name: 'Mattia Vanni', role: 'Asst. Coach' },
                    { name: 'Salvatore Zasa', role: 'Asst. Coach' },
                  ].map((p) => (
                    <div key={p.name}>
                      <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{p.name}</p>
                      <p className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{p.role}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className={`rounded-2xl border p-5 sm:p-6 text-left ${isDark ? 'bg-gray-900/50 border-gray-800' : 'bg-white border-gray-200'}`}>
                <div className="flex items-center gap-2 mb-4">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? 'bg-emerald-900/20' : 'bg-emerald-50'}`}>
                    <Heart size={16} className="text-emerald-500" />
                  </div>
                  <h3 className={`text-xs font-semibold tracking-[0.15em] uppercase ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                    {t('Support Staff')}
                  </h3>
                </div>
                <div className="space-y-3">
                  {[
                    { name: 'Lorenzo Gaudina', role: 'Performance Coach' },
                    { name: 'Alberto Lazzaro', role: 'Team Manager' },
                    { name: 'Nicolò Vella', role: 'Video Analyst' },
                  ].map((p) => (
                    <div key={p.name}>
                      <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{p.name}</p>
                      <p className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{p.role}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sub-slide indicators */}
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-3">
          <div className="flex items-center gap-4">
            <button
              onClick={() => goToUsSlide(usSlide - 1)}
              className={`p-1 rounded-full transition-all ${usSlide === 0 ? 'opacity-0 pointer-events-none' : ''} ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}
            >
              <ChevronLeft size={16} />
            </button>
            <div className="flex items-center gap-2">
              {usSubLabels.map((label, i) => (
                <button
                  key={i}
                  onClick={() => goToUsSlide(i)}
                  className={`w-2 h-2 rounded-full transition-all duration-500 ${
                    usSlide === i
                      ? isDark ? 'bg-orange-500 scale-125' : 'bg-orange-500 scale-125'
                      : isDark ? 'bg-gray-700 hover:bg-gray-500' : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                />
              ))}
            </div>
            <button
              onClick={() => goToUsSlide(usSlide + 1)}
              className={`p-1 rounded-full transition-all ${usSlide === US_SUB_SLIDES - 1 ? 'opacity-0 pointer-events-none' : ''} ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}
            >
              <ChevronRight size={16} />
            </button>
          </div>
          <p className={`text-[10px] tracking-[0.2em] uppercase ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
            {usSubLabels[usSlide]}
          </p>
        </div>
      </div>
    </div>
  );
};
