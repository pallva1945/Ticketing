import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Compass, Users, Building2, Shield, ArrowRight, Lock, Sun, Moon, ChevronDown, ChevronLeft, ChevronRight, UserCircle2, Trophy, Crown, Heart, Landmark, Briefcase, Star, Layers, Globe, Leaf, Lightbulb, BarChart3, Rocket, TrendingUp, Settings } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { PV_LOGO_URL } from '../constants';

const TEAM_SLIDES = 5;

const OWNERSHIP_DATA = [
  { name: 'Varese Sports & Entertainment', value: 51.5, color: '#E30613' },
  { name: 'Luis Scola Group', value: 21.3, color: '#1e3a5f' },
  { name: 'Verofin', value: 11.9, color: '#6366f1' },
  { name: 'PV Ignis', value: 9.0, color: '#f59e0b' },
  { name: 'Varese Nel Cuore', value: 4.4, color: '#10b981' },
  { name: 'Basket Siamo Noi', value: 1.9, color: '#8b5cf6' },
];

const BOARD_MEMBERS = [
  {
    name: 'Antonio Bulgheroni',
    initials: 'AB',
    roleKey: 'Presidente',
    bioKey: 'bio_bulgheroni',
    color: '#E30613',
    photo: 'https://i.imgur.com/Ot1rDJr.jpeg',
  },
  {
    name: 'Luis Scola',
    initials: 'LS',
    roleKey: 'Amministratore Delegato',
    bioKey: 'bio_scola',
    color: '#1e3a5f',
    photo: 'https://i.imgur.com/1llx2jG.jpeg',
  },
  {
    name: 'Paolo Perego',
    initials: 'PP',
    roleKey: 'Vice Presidente',
    bioKey: 'bio_perego',
    color: '#6366f1',
    photo: 'https://i.imgur.com/4XWGZ9A.jpeg',
  },
  {
    name: 'Paolo Orrigoni',
    initials: 'PO',
    roleKey: 'Consigliere',
    bioKey: 'bio_orrigoni',
    color: '#f59e0b',
    photo: 'https://i.imgur.com/XUTdo02.jpeg',
  },
  {
    name: 'Roberto D\'Avola',
    initials: 'RD',
    roleKey: 'Consigliere',
    bioKey: 'bio_davola',
    color: '#10b981',
    photo: 'https://i.imgur.com/zXFeyU6.jpeg',
  },
];

const ELT_MEMBERS = [
  {
    name: 'Zach Sogolow',
    initials: 'ZS',
    roleKey: 'GM Basketball Operations',
    bioKey: 'bio_sogolow',
    color: '#E30613',
    photo: 'https://i.imgur.com/wHVwtM7.jpeg',
  },
  {
    name: 'Maksim Horowitz',
    initials: 'MH',
    roleKey: 'GM Basketball Operations',
    bioKey: 'bio_horowitz',
    color: '#1e3a5f',
    photo: 'https://i.imgur.com/jAMPp3V.jpeg',
  },
  {
    name: 'Marco Zamberletti',
    initials: 'MZ',
    roleKey: 'CSO',
    bioKey: 'bio_zamberletti',
    color: '#6366f1',
    photo: 'https://i.imgur.com/lRgRD1m.jpeg',
  },
  {
    name: 'Federico Bellotto',
    initials: 'FB',
    roleKey: 'COO',
    bioKey: 'bio_bellotto',
    color: '#f59e0b',
    photo: 'https://i.imgur.com/3lFQ9uQ.jpeg',
  },
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
      <div className={`text-3xl sm:text-4xl font-bold tabular-nums ${isDark ? 'text-white' : 'text-gray-900'}`}>
        {count}{suffix || ''}
      </div>
      <div className={`text-xs tracking-[0.2em] uppercase mt-1.5 font-medium ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
        {label}
      </div>
    </div>
  );
};

const TOTAL_SECTIONS = 4;

interface InternalHubProps {
  onNavigate: (section: string) => void;
  onBackToWelcome: () => void;
}

export const InternalHub: React.FC<InternalHubProps> = ({ onNavigate, onBackToWelcome }) => {
  const { theme, toggleTheme } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();
  const { isAdmin } = useAuth();
  const isDark = theme === 'dark';

  const containerRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState<boolean[]>([true, false, false, false]);
  const [activeNav, setActiveNav] = useState(0);
  const [teamSlide, setTeamSlide] = useState(0);
  const isScrolling = useRef(false);
  const isSliding = useRef(false);
  const currentSection = useRef(0);
  const currentTeamSlide = useRef(0);

  const goToTeamSlide = useCallback((index: number) => {
    if (isSliding.current || index < 0 || index >= TEAM_SLIDES) return;
    isSliding.current = true;
    currentTeamSlide.current = index;
    setTeamSlide(index);
    setTimeout(() => { isSliding.current = false; }, 1400);
  }, []);

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
    setVisible(prev => { const n = [...prev]; n[index] = true; return n; });

    if (index !== 2) {
      currentTeamSlide.current = 0;
      setTeamSlide(0);
    }

    const container = containerRef.current;
    if (!container) return;
    const target = index * window.innerHeight;
    smoothScrollTo(container, target, 1800);
  }, [smoothScrollTo]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let accumulated = 0;
    let lastWheelTime = 0;
    const THRESHOLD = 60;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (isScrolling.current || isSliding.current) return;

      const now = Date.now();
      if (now - lastWheelTime > 200) accumulated = 0;
      lastWheelTime = now;

      accumulated += e.deltaY;

      if (Math.abs(accumulated) >= THRESHOLD) {
        if (currentSection.current === 2) {
          if (accumulated > 0 && currentTeamSlide.current < TEAM_SLIDES - 1) {
            goToTeamSlide(currentTeamSlide.current + 1);
            accumulated = 0;
            return;
          } else if (accumulated < 0 && currentTeamSlide.current > 0) {
            goToTeamSlide(currentTeamSlide.current - 1);
            accumulated = 0;
            return;
          }
        }
        if (accumulated > 0 && currentSection.current < TOTAL_SECTIONS - 1) {
          goToSection(currentSection.current + 1);
        } else if (accumulated < 0 && currentSection.current > 0) {
          goToSection(currentSection.current - 1);
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
      if (isScrolling.current || isSliding.current) return;
      const deltaY = touchStartY - e.changedTouches[0].clientY;
      const deltaX = touchStartX - e.changedTouches[0].clientX;

      if (currentSection.current === 2 && Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 40) {
        if (deltaX > 0 && currentTeamSlide.current < TEAM_SLIDES - 1) {
          goToTeamSlide(currentTeamSlide.current + 1);
        } else if (deltaX < 0 && currentTeamSlide.current > 0) {
          goToTeamSlide(currentTeamSlide.current - 1);
        }
        return;
      }

      if (Math.abs(deltaY) > 40) {
        if (currentSection.current === 2) {
          if (deltaY > 0 && currentTeamSlide.current < TEAM_SLIDES - 1) {
            goToTeamSlide(currentTeamSlide.current + 1);
            return;
          } else if (deltaY < 0 && currentTeamSlide.current > 0) {
            goToTeamSlide(currentTeamSlide.current - 1);
            return;
          }
        }
        if (deltaY > 0 && currentSection.current < TOTAL_SECTIONS - 1) {
          goToSection(currentSection.current + 1);
        } else if (deltaY < 0 && currentSection.current > 0) {
          goToSection(currentSection.current - 1);
        }
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (currentSection.current === 2) {
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          goToTeamSlide(currentTeamSlide.current + 1);
          return;
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          goToTeamSlide(currentTeamSlide.current - 1);
          return;
        }
        if (e.key === 'ArrowDown' || e.key === 'PageDown') {
          e.preventDefault();
          if (currentTeamSlide.current < TEAM_SLIDES - 1) {
            goToTeamSlide(currentTeamSlide.current + 1);
          } else {
            goToSection(currentSection.current + 1);
          }
          return;
        } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
          e.preventDefault();
          if (currentTeamSlide.current > 0) {
            goToTeamSlide(currentTeamSlide.current - 1);
          } else {
            goToSection(currentSection.current - 1);
          }
          return;
        }
      }
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
  }, [goToSection, goToTeamSlide]);

  const navItems = [
    t('Vision, Mission & Values'),
    t('About Us'),
    t('Our Team'),
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

      <div className={`fixed right-6 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-3`}>
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
      <div className="h-screen flex flex-col justify-center px-4 sm:px-6 relative pt-14">
        <div className={`transition-all duration-[1s] ease-out ${visible[0] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="max-w-6xl mx-auto w-full">
            <div className="text-center mb-6">
              <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs tracking-[0.2em] uppercase font-medium mb-4 ${
                isDark ? 'bg-amber-900/15 text-amber-500 border border-amber-800/20' : 'bg-amber-50 text-amber-600 border border-amber-100'
              }`}>
                <Compass size={14} />
                {t('Vision, Mission & Values')}
              </div>
              <p className={`text-base sm:text-lg italic max-w-lg mx-auto ${isDark ? 'text-amber-400/80' : 'text-amber-600/80'}`}>
                {t('brand_promise')}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className={`rounded-xl border p-5 sm:p-6 ${isDark ? 'bg-gray-900/60 border-gray-800/60' : 'bg-white border-gray-200/80'}`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-red-900/25' : 'bg-red-50'}`}>
                    <Rocket size={18} className="text-red-500" />
                  </div>
                  <h3 className={`text-base font-semibold uppercase tracking-wider ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {t('Mission')}
                  </h3>
                </div>
                <p className={`text-sm leading-relaxed mb-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  {t('mission_statement')}
                </p>
                <div className="space-y-2">
                  {['mission_1', 'mission_2', 'mission_3', 'mission_4'].map((key) => (
                    <div key={key} className="flex items-start gap-2.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-[7px] flex-shrink-0" />
                      <p className={`text-xs leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t(key)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className={`rounded-xl border p-5 sm:p-6 ${isDark ? 'bg-gray-900/60 border-gray-800/60' : 'bg-white border-gray-200/80'}`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-blue-900/25' : 'bg-blue-50'}`}>
                    <Compass size={18} className="text-blue-500" />
                  </div>
                  <h3 className={`text-base font-semibold uppercase tracking-wider ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {t('Vision')}
                  </h3>
                </div>
                <p className={`text-sm leading-relaxed mb-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  {t('vision_statement')}
                </p>
                <div className="space-y-2">
                  {['vision_1', 'vision_2', 'vision_3', 'vision_4'].map((key) => (
                    <div key={key} className="flex items-start gap-2.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-[7px] flex-shrink-0" />
                      <p className={`text-xs leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t(key)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className={`rounded-xl border p-5 sm:p-6 ${isDark ? 'bg-gray-900/60 border-gray-800/60' : 'bg-white border-gray-200/80'}`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-amber-900/25' : 'bg-amber-50'}`}>
                    <Star size={18} className="text-amber-500" />
                  </div>
                  <h3 className={`text-base font-semibold uppercase tracking-wider ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {t('Core Values')}
                  </h3>
                </div>
                <div className="space-y-3.5">
                  <div>
                    <p className={`text-xs font-semibold uppercase tracking-wider mb-1.5 ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>{t('values_athlete_title')}</p>
                    <p className={`text-xs leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('values_athlete_desc')}</p>
                  </div>
                  <div>
                    <p className={`text-xs font-semibold uppercase tracking-wider mb-1.5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>{t('values_citizen_title')}</p>
                    <p className={`text-xs leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('values_citizen_desc')}</p>
                  </div>
                  <div>
                    <p className={`text-xs font-semibold uppercase tracking-wider mb-1.5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>{t('values_org_title')}</p>
                    <p className={`text-xs leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('values_org_desc')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={() => goToSection(1)}
          className={`absolute bottom-8 left-1/2 bounce-arrow ${isDark ? 'text-gray-600' : 'text-gray-300'}`}
        >
          <ChevronDown size={20} />
        </button>
      </div>

      {/* Section 2: About Us */}
      <div className="h-screen flex flex-col justify-center px-4 sm:px-6 relative pt-14">
        <div className={`transition-all duration-[1s] ease-out ${visible[1] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-6 sm:mb-8">
              <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs tracking-[0.2em] uppercase font-medium mb-4 ${
                isDark ? 'bg-red-900/15 text-red-400 border border-red-800/20' : 'bg-red-50 text-red-600 border border-red-100'
              }`}>
                <Users size={14} />
                {t('About Us')}
              </div>
              <h2 className={`text-2xl sm:text-3xl lg:text-4xl font-light tracking-tight leading-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {t('about_headline')}
              </h2>
              <p className={`text-sm sm:text-base leading-relaxed max-w-2xl mx-auto mt-3 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                {t('about_subheadline')}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 mb-6 sm:mb-8">
              <div className={`rounded-xl border p-5 ${isDark ? 'bg-gray-900/60 border-gray-800/60' : 'bg-white border-gray-200/80'}`}>
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${isDark ? 'bg-emerald-900/25' : 'bg-emerald-50'}`}>
                  <Leaf size={18} className="text-emerald-500" />
                </div>
                <h3 className={`text-base font-semibold mb-1.5 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {t('Sustainability')}
                </h3>
                <p className={`text-xs leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {t('pillar_sustainability')}
                </p>
              </div>

              <div className={`rounded-xl border p-5 ${isDark ? 'bg-gray-900/60 border-gray-800/60' : 'bg-white border-gray-200/80'}`}>
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${isDark ? 'bg-amber-900/25' : 'bg-amber-50'}`}>
                  <Lightbulb size={18} className="text-amber-500" />
                </div>
                <h3 className={`text-base font-semibold mb-1.5 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {t('Innovation')}
                </h3>
                <p className={`text-xs leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {t('pillar_innovation')}
                </p>
              </div>

              <div className={`rounded-xl border p-5 ${isDark ? 'bg-gray-900/60 border-gray-800/60' : 'bg-white border-gray-200/80'}`}>
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${isDark ? 'bg-blue-900/25' : 'bg-blue-50'}`}>
                  <BarChart3 size={18} className="text-blue-500" />
                </div>
                <h3 className={`text-base font-semibold mb-1.5 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {t('Data-Driven')}
                </h3>
                <p className={`text-xs leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {t('pillar_datadriven')}
                </p>
              </div>

              <div className={`rounded-xl border p-5 ${isDark ? 'bg-gray-900/60 border-gray-800/60' : 'bg-white border-gray-200/80'}`}>
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${isDark ? 'bg-red-900/25' : 'bg-red-50'}`}>
                  <Rocket size={18} className="text-red-500" />
                </div>
                <h3 className={`text-base font-semibold mb-1.5 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {t('Ambition')}
                </h3>
                <p className={`text-xs leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {t('pillar_ambition')}
                </p>
              </div>

              <div className={`rounded-xl border p-5 ${isDark ? 'bg-gray-900/60 border-gray-800/60' : 'bg-white border-gray-200/80'}`}>
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${isDark ? 'bg-purple-900/25' : 'bg-purple-50'}`}>
                  <TrendingUp size={18} className="text-purple-500" />
                </div>
                <h3 className={`text-base font-semibold mb-1.5 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {t('Development')}
                </h3>
                <p className={`text-xs leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {t('pillar_development')}
                </p>
              </div>
            </div>

            <div className={`rounded-xl border p-5 sm:p-6 ${isDark ? 'bg-gray-900/40 border-gray-800/40' : 'bg-gray-50/80 border-gray-200/60'}`}>
              <div className="grid grid-cols-4 gap-4 sm:gap-8">
                <StatCounter target={10} label={t('League Titles')} active={visible[1]} isDark={isDark} />
                <StatCounter target={5} label={t('EuroLeague Titles')} active={visible[1]} isDark={isDark} />
                <StatCounter target={3} label={t('Intercontinental Cups')} active={visible[1]} isDark={isDark} />
                <StatCounter target={80} label={t('Years of History')} active={visible[1]} isDark={isDark} />
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={() => goToSection(2)}
          className={`absolute bottom-8 left-1/2 bounce-arrow ${isDark ? 'text-gray-600' : 'text-gray-300'}`}
        >
          <ChevronDown size={20} />
        </button>
      </div>

      {/* Section 3: Our Team — Sub-slide carousel */}
      <div className="h-screen relative overflow-hidden">
        <div className={`transition-all duration-[1s] ease-out h-full ${visible[2] ? 'opacity-100' : 'opacity-0'}`}>

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
            {/* Sub-slide 1: Ownership */}
            <div className="w-full flex-shrink-0 h-full flex flex-col justify-center px-4 sm:px-8 pt-14" style={{ width: `${100 / TEAM_SLIDES}%` }}>
              <div className="max-w-6xl mx-auto w-full">
                <div className="text-center mb-6">
                  <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs tracking-[0.2em] uppercase font-medium mb-4 ${
                    isDark ? 'bg-purple-900/15 text-purple-400 border border-purple-800/20' : 'bg-purple-50 text-purple-600 border border-purple-100'
                  }`}>
                    <Shield size={14} />
                    {t('Ownership')}
                  </div>
                  <h2 className={`text-2xl sm:text-3xl font-light tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {t('Shareholder Structure')}
                  </h2>
                  <p className={`text-sm sm:text-base mt-2 max-w-lg mx-auto ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    {t('ownership_subtitle')}
                  </p>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10">
                  <div className="flex-shrink-0" style={{ width: 280, height: 280 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={OWNERSHIP_DATA}
                          cx="50%"
                          cy="50%"
                          innerRadius={75}
                          outerRadius={125}
                          paddingAngle={2}
                          dataKey="value"
                          stroke="none"
                          animationBegin={200}
                          animationDuration={1200}
                        >
                          {OWNERSHIP_DATA.map((entry, index) => (
                            <Cell key={index} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="flex-1 w-full max-w-md">
                    <div className="space-y-3">
                      {OWNERSHIP_DATA.map((item, i) => (
                        <div key={i} className={`flex items-center justify-between px-5 py-3 rounded-lg ${
                          isDark ? 'bg-gray-900/60 border border-gray-800/50' : 'bg-white border border-gray-200/80'
                        }`}>
                          <div className="flex items-center gap-3">
                            <div className="w-3.5 h-3.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                            <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{item.name}</span>
                          </div>
                          <span className={`text-base font-semibold tabular-nums ${isDark ? 'text-white' : 'text-gray-900'}`}>{item.value}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sub-slide 2: Board */}
            <div className="w-full flex-shrink-0 h-full flex flex-col justify-center px-4 sm:px-6 pt-14" style={{ width: `${100 / TEAM_SLIDES}%` }}>
              <div className="max-w-6xl mx-auto w-full">
                <div className="text-center mb-6">
                  <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs tracking-[0.2em] uppercase font-medium mb-4 ${
                    isDark ? 'bg-indigo-900/15 text-indigo-400 border border-indigo-800/20' : 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                  }`}>
                    <Briefcase size={14} />
                    {t('Board of Directors')}
                  </div>
                  <h2 className={`text-2xl sm:text-3xl font-light tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {t('Consiglio di Amministrazione')}
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
                  {BOARD_MEMBERS.map((member, i) => (
                    <div
                      key={i}
                      className={`rounded-xl border p-5 text-center transition-all duration-500 hover:scale-[1.02] ${
                        isDark ? 'bg-gray-900/60 border-gray-800/60 hover:border-gray-700' : 'bg-white border-gray-200/80 hover:border-gray-300'
                      }`}
                    >
                      <div
                        className="w-16 h-16 rounded-full mx-auto mb-3 overflow-hidden border-2"
                        style={{ borderColor: member.color }}
                      >
                        <img src={member.photo} alt={member.name} className="w-full h-full object-cover" />
                      </div>
                      <h3 className={`text-sm font-semibold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {member.name}
                      </h3>
                      <p className="text-xs tracking-[0.1em] uppercase font-medium mb-3" style={{ color: member.color }}>
                        {t(member.roleKey)}
                      </p>
                      <p className={`text-xs leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {t(member.bioKey)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sub-slide 3: ELT */}
            <div className="w-full flex-shrink-0 h-full flex flex-col justify-center px-4 sm:px-6 pt-14" style={{ width: `${100 / TEAM_SLIDES}%` }}>
              <div className="max-w-5xl mx-auto w-full">
                <div className="text-center mb-6">
                  <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs tracking-[0.2em] uppercase font-medium mb-4 ${
                    isDark ? 'bg-emerald-900/15 text-emerald-400 border border-emerald-800/20' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                  }`}>
                    <Star size={14} />
                    {t('Elite Leadership Team')}
                  </div>
                  <h2 className={`text-2xl sm:text-3xl font-light tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {t('Executive Leadership')}
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  {ELT_MEMBERS.map((member, i) => (
                    <div
                      key={i}
                      className={`rounded-xl border p-5 text-center transition-all duration-500 hover:scale-[1.02] ${
                        isDark ? 'bg-gray-900/60 border-gray-800/60 hover:border-gray-700' : 'bg-white border-gray-200/80 hover:border-gray-300'
                      }`}
                    >
                      <div className="w-16 h-16 rounded-full mx-auto mb-3 overflow-hidden flex items-center justify-center text-white text-lg font-bold" style={{ backgroundColor: member.color }}>
                        {member.photo ? (
                          <img src={member.photo} alt={member.name} className="w-full h-full object-cover" />
                        ) : (
                          member.initials
                        )}
                      </div>
                      <h3 className={`text-sm font-semibold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {member.name}
                      </h3>
                      <p className="text-xs tracking-[0.1em] uppercase font-medium mb-3" style={{ color: member.color }}>
                        {t(member.roleKey)}
                      </p>
                      <p className={`text-xs leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {t(member.bioKey)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sub-slide 4: Departments */}
            <div className="w-full flex-shrink-0 h-full flex flex-col justify-center px-4 sm:px-6 pt-14" style={{ width: `${100 / TEAM_SLIDES}%` }}>
              <div className="max-w-6xl mx-auto w-full">
                <div className="text-center mb-6">
                  <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs tracking-[0.2em] uppercase font-medium mb-4 ${
                    isDark ? 'bg-amber-900/15 text-amber-400 border border-amber-800/20' : 'bg-amber-50 text-amber-600 border border-amber-100'
                  }`}>
                    <Layers size={14} />
                    {t('Departments')}
                  </div>
                  <h2 className={`text-2xl sm:text-3xl font-light tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {t('Department Overview')}
                  </h2>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {DEPT_MEMBERS.map((member, i) => (
                    <div
                      key={i}
                      className={`rounded-xl border p-4 sm:p-5 text-center transition-all duration-500 hover:scale-[1.02] ${
                        isDark ? 'bg-gray-900/60 border-gray-800/60 hover:border-gray-700' : 'bg-white border-gray-200/80 hover:border-gray-300'
                      }`}
                    >
                      <div
                        className="w-13 h-13 rounded-full mx-auto mb-3 flex items-center justify-center text-white text-base font-bold" style={{ backgroundColor: member.color, width: '3.25rem', height: '3.25rem' }}
                      >
                        {member.initials}
                      </div>
                      <h3 className={`text-sm font-semibold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {member.name}
                      </h3>
                      <p className="text-xs tracking-[0.05em] uppercase font-medium" style={{ color: member.color }}>
                        {t(member.roleKey)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sub-slide 5: External Services */}
            <div className="w-full flex-shrink-0 h-full flex flex-col justify-center px-4 sm:px-6 pt-14" style={{ width: `${100 / TEAM_SLIDES}%` }}>
              <div className="max-w-5xl mx-auto w-full">
                <div className="text-center mb-6">
                  <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs tracking-[0.2em] uppercase font-medium mb-4 ${
                    isDark ? 'bg-cyan-900/15 text-cyan-400 border border-cyan-800/20' : 'bg-cyan-50 text-cyan-600 border border-cyan-100'
                  }`}>
                    <Globe size={14} />
                    {t('External Services')}
                  </div>
                  <h2 className={`text-2xl sm:text-3xl font-light tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {t('Partner Network')}
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
                  {EXT_SERVICES.map((svc, i) => (
                    <div
                      key={i}
                      className={`rounded-xl border p-5 text-center transition-all duration-500 hover:scale-[1.02] ${
                        isDark ? 'bg-gray-900/60 border-gray-800/60 hover:border-gray-700' : 'bg-white border-gray-200/80 hover:border-gray-300'
                      }`}
                    >
                      <div
                        className="w-14 h-14 rounded-full mx-auto mb-3 flex items-center justify-center text-white text-base font-bold"
                        style={{ backgroundColor: svc.color }}
                      >
                        {svc.initials}
                      </div>
                      <h3 className={`text-sm font-semibold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {svc.name}
                      </h3>
                      <p className="text-xs tracking-[0.05em] uppercase font-medium" style={{ color: svc.color }}>
                        {t(svc.roleKey)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Sub-slide navigation */}
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex items-center gap-4 z-10">
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
              {[t('Ownership'), t('Board'), t('ELT'), t('Depts'), t('External')].map((label, i) => (
                <button
                  key={i}
                  onClick={() => goToTeamSlide(i)}
                  className={`px-3 py-1.5 rounded-full text-xs tracking-[0.15em] uppercase font-medium transition-all duration-500 ${
                    teamSlide === i
                      ? isDark ? 'bg-white/10 text-white' : 'bg-gray-900/10 text-gray-900'
                      : isDark ? 'text-gray-600 hover:text-gray-400' : 'text-gray-300 hover:text-gray-500'
                  }`}
                >
                  {label}
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
          <div className={`absolute bottom-10 left-1/2 -translate-x-1/2 w-48 h-0.5 rounded-full overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`}>
            <div
              className={`h-full rounded-full ${isDark ? 'bg-purple-500' : 'bg-purple-400'}`}
              style={{ width: `${((teamSlide + 1) / TEAM_SLIDES) * 100}%`, transition: 'width 1200ms cubic-bezier(0.16, 1, 0.3, 1)' }}
            />
          </div>
        </div>

        <button
          onClick={() => {
            if (teamSlide < TEAM_SLIDES - 1) {
              goToTeamSlide(teamSlide + 1);
            } else {
              goToSection(3);
            }
          }}
          className={`absolute bottom-3 left-1/2 bounce-arrow ${isDark ? 'text-gray-600' : 'text-gray-300'}`}
        >
          <ChevronDown size={16} />
        </button>
      </div>

      {/* Section 4: Departments */}
      <div className="h-screen flex flex-col items-center justify-center px-6 relative">
        <div className={`transition-all duration-[1s] ease-out ${visible[3] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="max-w-3xl mx-auto text-center mb-16">
            <p className={`text-xs tracking-[0.3em] uppercase font-medium mb-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              {t('Departments')}
            </p>
            <h2 className={`text-2xl sm:text-3xl lg:text-4xl font-light tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {t('Choose your area')}
            </h2>
            <div className="flex justify-center mt-6">
              <div className={`h-px line-grow ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
            </div>
          </div>

          <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto`}>
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
          <div className={`flex items-center gap-4 text-xs tracking-[0.25em] uppercase ${isDark ? 'text-gray-700' : 'text-gray-300'}`}>
            <span>Pallacanestro Varese</span>
            <span className="w-px h-3 bg-current"></span>
            <span>{t('Season')} 2025/26</span>
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
