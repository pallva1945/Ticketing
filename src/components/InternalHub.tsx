import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Compass, Users, Building2, Shield, ArrowRight, Lock, Sun, Moon, ChevronDown } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { PV_LOGO_URL } from '../constants';

interface InternalHubProps {
  onNavigate: (section: string) => void;
  onBackToWelcome: () => void;
}

export const InternalHub: React.FC<InternalHubProps> = ({ onNavigate, onBackToWelcome }) => {
  const { theme, toggleTheme } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();
  const isDark = theme === 'dark';

  const containerRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState<boolean[]>([true, false, false]);
  const [activeNav, setActiveNav] = useState(0);
  const isScrolling = useRef(false);
  const currentSection = useRef(0);

  const easeInOutCubic = (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

  const smoothScrollTo = useCallback((container: HTMLDivElement, target: number, duration: number) => {
    const start = container.scrollTop;
    const distance = target - start;
    if (distance === 0) { isScrolling.current = false; return; }
    let startTime: number | null = null;

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      container.scrollTop = start + distance * easeInOutCubic(progress);
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        isScrolling.current = false;
      }
    };
    requestAnimationFrame(step);
  }, []);

  const goToSection = useCallback((index: number) => {
    if (isScrolling.current || index < 0 || index > 2) return;
    isScrolling.current = true;
    currentSection.current = index;
    setActiveNav(index);
    setVisible(prev => { const n = [...prev]; n[index] = true; return n; });

    const container = containerRef.current;
    if (!container) return;
    const target = index * window.innerHeight;
    smoothScrollTo(container, target, 1200);
  }, [smoothScrollTo]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let accumulated = 0;
    const THRESHOLD = 50;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (isScrolling.current) return;

      accumulated += e.deltaY;

      if (Math.abs(accumulated) >= THRESHOLD) {
        if (accumulated > 0 && currentSection.current < 2) {
          goToSection(currentSection.current + 1);
        } else if (accumulated < 0 && currentSection.current > 0) {
          goToSection(currentSection.current - 1);
        }
        accumulated = 0;
      }
    };

    let touchStartY = 0;
    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
    };
    const handleTouchEnd = (e: TouchEvent) => {
      if (isScrolling.current) return;
      const delta = touchStartY - e.changedTouches[0].clientY;
      if (Math.abs(delta) > 40) {
        if (delta > 0 && currentSection.current < 2) {
          goToSection(currentSection.current + 1);
        } else if (delta < 0 && currentSection.current > 0) {
          goToSection(currentSection.current - 1);
        }
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        e.preventDefault();
        goToSection(currentSection.current + 1);
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        goToSection(currentSection.current - 1);
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
  }, [goToSection]);

  const navItems = [
    t('Vision, Mission & Values'),
    t('About Us'),
    t('Departments'),
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

      <div className={`fixed top-0 left-0 w-full h-px z-50 ${isDark ? 'bg-gradient-to-r from-transparent via-red-800/40 to-transparent' : 'bg-gradient-to-r from-transparent via-red-200 to-transparent'}`}></div>

      <nav className={`fixed top-0 left-0 w-full z-40 backdrop-blur-xl ${isDark ? 'bg-[#0a0a0a]/90 border-b border-gray-800/50' : 'bg-[#fafafa]/90 border-b border-gray-200/50'}`}>
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onBackToWelcome} className="hover:opacity-70 transition-opacity">
              <img src={PV_LOGO_URL} alt="PV" className="w-7 h-7 object-contain" />
            </button>
            <div className={`h-4 w-px ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`}></div>
            <div className="hidden sm:flex items-center gap-1">
              {navItems.map((label, i) => (
                <button
                  key={i}
                  onClick={() => goToSection(i)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] tracking-[0.15em] uppercase font-medium transition-all duration-300 ${
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
            <button onClick={toggleLanguage} className={`px-3 py-1.5 rounded-lg text-[10px] tracking-wider uppercase transition-all ${isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}>
              {language === 'en' ? 'IT' : 'EN'}
            </button>
            <button onClick={toggleTheme} className={`p-2 rounded-lg transition-all ${isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}>
              {isDark ? <Sun size={14} /> : <Moon size={14} />}
            </button>
          </div>
        </div>
      </nav>

      <div className={`fixed right-6 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-3`}>
        {[0, 1, 2].map(i => (
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

      <div className="h-screen flex flex-col items-center justify-center px-6 relative">
        <div className={`transition-all duration-[1s] ease-out ${visible[0] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="max-w-2xl mx-auto text-center">
            <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] tracking-[0.2em] uppercase font-medium mb-10 ${
              isDark ? 'bg-amber-900/15 text-amber-500 border border-amber-800/20' : 'bg-amber-50 text-amber-600 border border-amber-100'
            }`}>
              <Compass size={12} />
              {t('Vision, Mission & Values')}
            </div>

            <h2 className={`text-3xl sm:text-4xl lg:text-5xl font-light tracking-tight leading-tight mb-8 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {t('Building the future of Italian basketball')}
            </h2>

            <div className="flex justify-center mb-8">
              <div className={`h-px line-grow ${isDark ? 'bg-amber-700/50' : 'bg-amber-300'}`}></div>
            </div>

            <p className={`text-base sm:text-lg leading-relaxed max-w-lg mx-auto mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {t('Tradition, innovation, and community — the pillars that define our path forward.')}
            </p>

            <div className={`mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs tracking-[0.15em] uppercase font-medium ${
              isDark ? 'border border-gray-800 text-gray-500' : 'border border-gray-200 text-gray-400'
            }`}>
              <Lock size={10} />
              {t('Coming Soon')}
            </div>
          </div>
        </div>

        <button
          onClick={() => goToSection(1)}
          className={`absolute bottom-12 left-1/2 bounce-arrow ${isDark ? 'text-gray-600' : 'text-gray-300'}`}
        >
          <ChevronDown size={20} />
        </button>
      </div>

      <div className="h-screen flex flex-col items-center justify-center px-6 relative">
        <div className={`transition-all duration-[1s] ease-out ${visible[1] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="max-w-2xl mx-auto text-center">
            <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] tracking-[0.2em] uppercase font-medium mb-10 ${
              isDark ? 'bg-blue-900/15 text-blue-400 border border-blue-800/20' : 'bg-blue-50 text-blue-600 border border-blue-100'
            }`}>
              <Users size={12} />
              {t('About Us')}
            </div>

            <h2 className={`text-3xl sm:text-4xl lg:text-5xl font-light tracking-tight leading-tight mb-8 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {t('A club with history, a team with ambition')}
            </h2>

            <div className="flex justify-center mb-8">
              <div className={`h-px line-grow ${isDark ? 'bg-blue-700/50' : 'bg-blue-300'}`}></div>
            </div>

            <p className={`text-base sm:text-lg leading-relaxed max-w-lg mx-auto mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {t('Our organization, leadership, and the people who make Pallacanestro Varese a cornerstone of Italian sports.')}
            </p>

            <div className={`mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs tracking-[0.15em] uppercase font-medium ${
              isDark ? 'border border-gray-800 text-gray-500' : 'border border-gray-200 text-gray-400'
            }`}>
              <Lock size={10} />
              {t('Coming Soon')}
            </div>
          </div>
        </div>

        <button
          onClick={() => goToSection(2)}
          className={`absolute bottom-12 left-1/2 bounce-arrow ${isDark ? 'text-gray-600' : 'text-gray-300'}`}
        >
          <ChevronDown size={20} />
        </button>
      </div>

      <div className="h-screen flex flex-col items-center justify-center px-6 relative">
        <div className={`transition-all duration-[1s] ease-out ${visible[2] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="max-w-3xl mx-auto text-center mb-16">
            <p className={`text-[10px] tracking-[0.3em] uppercase font-medium mb-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              {t('Departments')}
            </p>
            <h2 className={`text-3xl sm:text-4xl font-light tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {t('Choose your area')}
            </h2>
            <div className="flex justify-center mt-6">
              <div className={`h-px line-grow ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            <button
              onClick={() => onNavigate('landing')}
              className={`group relative text-left rounded-2xl border transition-all duration-500 overflow-hidden hover:shadow-2xl ${
                isDark ? 'bg-gray-900 border-gray-800 hover:border-red-800/60' : 'bg-white border-gray-200 hover:border-red-300'
              }`}
            >
              <div className={`absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-red-600 to-red-400 opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
              <div className="p-8 sm:p-10">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${isDark ? 'bg-red-900/20' : 'bg-red-50'}`}>
                  <Building2 size={26} className="text-red-600" />
                </div>
                <h3 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Corp
                </h3>
                <p className={`text-sm leading-relaxed mb-6 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  {t('Financial Center — Revenue, Costs & Verticals P&L')}
                </p>
                <div className={`inline-flex items-center gap-2 text-xs font-medium tracking-wider uppercase group-hover:gap-3 transition-all ${isDark ? 'text-red-500' : 'text-red-600'}`}>
                  {t('Enter')}
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </button>

            <div
              className={`relative text-left rounded-2xl border overflow-hidden opacity-50 ${
                isDark ? 'bg-gray-900/50 border-gray-800/50' : 'bg-white/50 border-gray-200/50'
              }`}
            >
              <div className="p-8 sm:p-10">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${isDark ? 'bg-emerald-900/20' : 'bg-emerald-50'}`}>
                  <Shield size={26} className="text-emerald-600" />
                </div>
                <h3 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  BOps
                </h3>
                <p className={`text-sm leading-relaxed mb-6 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  {t('Basketball Operations — Team management, roster & performance')}
                </p>
                <div className={`inline-flex items-center gap-2 text-xs tracking-[0.15em] uppercase font-medium ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                  <Lock size={10} />
                  {t('Coming Soon')}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={`absolute bottom-8 left-1/2 -translate-x-1/2`}>
          <div className={`flex items-center gap-4 text-[10px] tracking-[0.25em] uppercase ${isDark ? 'text-gray-700' : 'text-gray-300'}`}>
            <span>Pallacanestro Varese</span>
            <span className="w-px h-3 bg-current"></span>
            <span>{t('Season')} 2025/26</span>
          </div>
        </div>
      </div>
    </div>
  );
};
