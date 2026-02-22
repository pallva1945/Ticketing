import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ArrowRight, Sun, Moon, ChevronLeft, Eye, Heart, Target, Users, GraduationCap, Activity, Shield, Construction, Layers, BookOpen, ExternalLink, Globe, Rocket, Star, Compass } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';

const VB_LOGO_URL = "https://i.imgur.com/e7khORs.png";

const TOTAL_SECTIONS = 5;

interface VBHubProps {
  onNavigate: (section: string) => void;
  onBackToWelcome: () => void;
}

export const VBHub: React.FC<VBHubProps> = ({ onNavigate, onBackToWelcome }) => {
  const { theme, toggleTheme } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();
  const isDark = theme === 'dark';

  const containerRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState<boolean[]>([true, false, false, false, false]);
  const [activeNav, setActiveNav] = useState(0);
  const isScrolling = useRef(false);
  const currentSection = useRef(0);

  const easeInOutQuint = (t: number) => t < 0.5 ? 16 * t * t * t * t * t : 1 - Math.pow(-2 * t + 2, 5) / 2;

  const smoothScrollTo = useCallback((container: HTMLDivElement, target: number, duration: number) => {
    const start = container.scrollTop;
    const distance = target - start;
    if (distance === 0) { isScrolling.current = false; return; }
    let startTime: number | null = null;

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      container.scrollTop = start + distance * easeInOutQuint(progress);
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        isScrolling.current = false;
      }
    };
    requestAnimationFrame(step);
  }, []);

  const goToSection = useCallback((index: number) => {
    if (isScrolling.current || index < 0 || index > TOTAL_SECTIONS - 1) return;
    isScrolling.current = true;
    currentSection.current = index;
    setActiveNav(index);
    setVisible(prev => {
      const next = [...prev];
      next[index] = true;
      return next;
    });
    const container = containerRef.current;
    if (container) {
      smoothScrollTo(container, index * window.innerHeight, 1200);
    }
  }, [smoothScrollTo]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let accumulated = 0;
    let lastTime = 0;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (isScrolling.current) return;
      const now = Date.now();
      if (now - lastTime > 800) accumulated = 0;
      lastTime = now;
      accumulated += e.deltaY;
      const threshold = 80;
      if (accumulated > threshold && currentSection.current < TOTAL_SECTIONS - 1) {
        accumulated = 0;
        goToSection(currentSection.current + 1);
      } else if (accumulated < -threshold && currentSection.current > 0) {
        accumulated = 0;
        goToSection(currentSection.current - 1);
      }
    };

    let touchStartY = 0;
    const handleTouchStart = (e: TouchEvent) => { touchStartY = e.touches[0].clientY; };
    const handleTouchEnd = (e: TouchEvent) => {
      if (isScrolling.current) return;
      const deltaY = touchStartY - e.changedTouches[0].clientY;
      if (deltaY > 50 && currentSection.current < TOTAL_SECTIONS - 1) {
        goToSection(currentSection.current + 1);
      } else if (deltaY < -50 && currentSection.current > 0) {
        goToSection(currentSection.current - 1);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' && currentSection.current < TOTAL_SECTIONS - 1) goToSection(currentSection.current + 1);
      if (e.key === 'ArrowUp' && currentSection.current > 0) goToSection(currentSection.current - 1);
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
  }, [goToSection]);

  const navItems = [
    t('Vision, Mission & Values'),
    t('About Us'),
    t('Our Method'),
    t('Our Team'),
    'BOps',
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
            <button onClick={onBackToWelcome} className="hover:opacity-70 transition-opacity flex items-center gap-2">
              <ChevronLeft size={16} className={isDark ? 'text-gray-500' : 'text-gray-400'} />
              <img src={VB_LOGO_URL} alt="VB" className="w-7 h-7 object-contain" />
            </button>
            <div className={`h-4 w-px ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`}></div>
            <span className={`text-xs tracking-[0.15em] uppercase font-medium ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Varese Basketball</span>
            <div className={`h-4 w-px hidden sm:block ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`}></div>
            <div className="hidden sm:flex items-center gap-1">
              {navItems.map((label, i) => (
                <button
                  key={i}
                  onClick={() => goToSection(i)}
                  className={`px-3 py-1.5 rounded-lg text-xs tracking-[0.15em] uppercase font-medium transition-all duration-300 ${
                    activeNav === i
                      ? isDark ? 'text-white bg-gray-800' : 'text-gray-900 bg-gray-100'
                      : isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
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

      <div className={`fixed right-6 top-1/2 -translate-y-1/2 z-40 hidden sm:flex flex-col gap-3`}>
        {Array.from({ length: TOTAL_SECTIONS }).map((_, i) => (
          <button
            key={i}
            onClick={() => goToSection(i)}
            className={`w-2 h-2 rounded-full transition-all duration-500 ${
              activeNav === i
                ? isDark ? 'bg-white scale-125' : 'bg-gray-900 scale-125'
                : isDark ? 'bg-gray-700 hover:bg-gray-500' : 'bg-gray-300 hover:bg-gray-400'
            }`}
          />
        ))}
      </div>

      {/* Section 1: Vision, Mission & Values */}
      <div className="h-screen flex flex-col items-center justify-center px-4 sm:px-6 relative">
        <div className={`transition-all duration-[1s] ease-out ${visible[0] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
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
      </div>

      {/* Section 2: About Us */}
      <div className="h-screen flex flex-col items-center justify-center px-4 sm:px-6 relative">
        <div className={`transition-all duration-[1s] ease-out ${visible[1] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
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
      </div>

      {/* Section 3: Our Method */}
      <div className="h-screen flex flex-col items-center justify-center px-4 sm:px-6 relative">
        <div className={`transition-all duration-[1s] ease-out ${visible[2] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
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
      </div>

      {/* Section 4: Our Team */}
      <div className="h-screen flex flex-col items-center justify-center px-4 sm:px-6 relative">
        <div className={`transition-all duration-[1s] ease-out ${visible[3] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
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
                    { name: 'Massimo Ferrariuolo', role: 'Senior Advisor' },
                    { name: 'Giovanni Todisco', role: 'RSG' },
                    { name: 'Francisco Zambelli', role: 'Head of Operations' },
                  ].map((p) => (
                    <div key={p.name} className={`py-2 border-b last:border-b-0 ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
                      <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{p.name}</p>
                      <p className={`text-[11px] leading-snug ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{p.role}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className={`rounded-2xl border p-5 sm:p-6 text-left ${isDark ? 'bg-gray-900/50 border-gray-800' : 'bg-white border-gray-200'}`}>
                <div className="flex items-center gap-2 mb-4">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? 'bg-orange-900/20' : 'bg-orange-50'}`}>
                    <Users size={16} className="text-orange-500" />
                  </div>
                  <h3 className={`text-xs font-semibold tracking-[0.15em] uppercase ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>
                    {t('Coaching Staff')}
                  </h3>
                </div>
                <div className="space-y-3">
                  {[
                    { name: 'Tommaso Sacchetti', role: 'HC Serie B · U19' },
                    { name: 'Stefano Bianchi', role: 'HC U19 · U17' },
                    { name: 'Giovanni Todisco', role: 'HC U17 · U15' },
                    { name: 'Andrea Longoni', role: 'HC U15' },
                    { name: 'Federico Besio', role: 'AC U15 · U17' },
                  ].map((p) => (
                    <div key={p.name} className={`py-2 border-b last:border-b-0 ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
                      <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{p.name}</p>
                      <p className={`text-[11px] leading-snug ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{p.role}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className={`rounded-2xl border p-5 sm:p-6 text-left ${isDark ? 'bg-gray-900/50 border-gray-800' : 'bg-white border-gray-200'}`}>
                <div className="flex items-center gap-2 mb-4">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? 'bg-orange-900/20' : 'bg-orange-50'}`}>
                    <Activity size={16} className="text-orange-500" />
                  </div>
                  <h3 className={`text-xs font-semibold tracking-[0.15em] uppercase ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>
                    {t('Strength & Conditioning')}
                  </h3>
                </div>
                <div className="space-y-3">
                  {[
                    { name: 'Marcelo Lopez', role: 'Head of S&C' },
                  ].map((p) => (
                    <div key={p.name} className={`py-2 border-b last:border-b-0 ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
                      <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{p.name}</p>
                      <p className={`text-[11px] leading-snug ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{p.role}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 5: BOps */}
      <div className="h-screen flex flex-col items-center justify-center px-4 sm:px-6 relative">
        <div className={`transition-all duration-[1s] ease-out ${visible[4] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="max-w-3xl mx-auto text-center mb-8 sm:mb-16">
            <p className={`text-[10px] sm:text-xs tracking-[0.3em] uppercase font-medium mb-2 sm:mb-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              BOps
            </p>
            <h2 className={`text-xl sm:text-3xl lg:text-4xl font-light tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {t('Basketball Operations')}
            </h2>
            <div className="flex justify-center mt-4 sm:mt-6">
              <div className={`h-px line-grow ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
            </div>
          </div>

          <div className="max-w-md mx-auto">
            <button
              onClick={() => onNavigate('vb')}
              className={`group relative w-full text-left rounded-2xl border transition-all duration-500 overflow-hidden hover:shadow-2xl ${
                isDark ? 'bg-gray-900 border-gray-800 hover:border-orange-800/60' : 'bg-white border-gray-200 hover:border-orange-300'
              }`}
            >
              <div className={`absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-orange-500 to-orange-400 opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
              <div className="p-6 sm:p-8">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-5 ${isDark ? 'bg-orange-900/20' : 'bg-orange-50'}`}>
                  <Activity size={22} className="text-orange-500" />
                </div>
                <h3 className={`text-lg sm:text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {t('Youth Development')}
                </h3>
                <p className={`text-xs sm:text-sm leading-relaxed mb-5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  {t('Player profiles, session tracking, progression analytics & scouting database')}
                </p>
                <div className={`inline-flex items-center gap-2 text-xs font-medium tracking-wider uppercase group-hover:gap-3 transition-all ${isDark ? 'text-orange-500' : 'text-orange-600'}`}>
                  {t('Enter')}
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </button>
          </div>
        </div>

        <div className={`absolute bottom-4 sm:bottom-8 left-1/2 -translate-x-1/2`}>
          <div className={`flex items-center gap-3 sm:gap-4 text-[10px] sm:text-xs tracking-[0.2em] sm:tracking-[0.25em] uppercase ${isDark ? 'text-gray-700' : 'text-gray-300'}`}>
            <span>Varese Basketball</span>
            <span className="w-px h-3 bg-current"></span>
            <span>{t('Season')} 2025/26</span>
          </div>
        </div>
      </div>
    </div>
  );
};
