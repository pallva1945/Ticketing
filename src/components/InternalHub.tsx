import React, { useEffect, useRef, useState } from 'react';
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

  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [visible, setVisible] = useState<boolean[]>([false, false, false]);
  const [activeNav, setActiveNav] = useState(0);

  useEffect(() => {
    const observers = sectionRefs.current.map((ref, i) => {
      if (!ref) return null;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setVisible(prev => { const n = [...prev]; n[i] = true; return n; });
            setActiveNav(i);
          }
        },
        { threshold: 0.3 }
      );
      observer.observe(ref);
      return observer;
    });
    return () => observers.forEach(o => o?.disconnect());
  }, []);

  const scrollTo = (i: number) => {
    sectionRefs.current[i]?.scrollIntoView({ behavior: 'smooth' });
  };

  const navItems = [
    t('Vision, Mission & Values'),
    t('About Us'),
    t('Departments'),
  ];

  return (
    <div className={`relative ${isDark ? 'bg-[#0a0a0a]' : 'bg-[#fafafa]'}`}>
      <style>{`
        @keyframes fade-up { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes line-grow { from { width: 0; } to { width: 60px; } }
        @keyframes bounce-subtle { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(6px); } }
        .fade-up { animation: fade-up 1s ease-out forwards; }
        .line-grow { animation: line-grow 0.8s ease-out forwards; }
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
                  onClick={() => scrollTo(i)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] tracking-[0.15em] uppercase font-medium transition-all ${
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

      <div
        ref={el => { sectionRefs.current[0] = el; }}
        className="min-h-screen flex flex-col items-center justify-center px-6 relative"
      >
        <div className={`transition-all duration-[1.2s] ease-out ${visible[0] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
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
          onClick={() => scrollTo(1)}
          className={`absolute bottom-12 left-1/2 -translate-x-1/2 bounce-arrow ${isDark ? 'text-gray-600' : 'text-gray-300'}`}
        >
          <ChevronDown size={20} />
        </button>
      </div>

      <div className={`w-full h-px ${isDark ? 'bg-gradient-to-r from-transparent via-gray-800 to-transparent' : 'bg-gradient-to-r from-transparent via-gray-200 to-transparent'}`}></div>

      <div
        ref={el => { sectionRefs.current[1] = el; }}
        className="min-h-screen flex flex-col items-center justify-center px-6 relative"
      >
        <div className={`transition-all duration-[1.2s] ease-out ${visible[1] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
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
          onClick={() => scrollTo(2)}
          className={`absolute bottom-12 left-1/2 -translate-x-1/2 bounce-arrow ${isDark ? 'text-gray-600' : 'text-gray-300'}`}
        >
          <ChevronDown size={20} />
        </button>
      </div>

      <div className={`w-full h-px ${isDark ? 'bg-gradient-to-r from-transparent via-gray-800 to-transparent' : 'bg-gradient-to-r from-transparent via-gray-200 to-transparent'}`}></div>

      <div
        ref={el => { sectionRefs.current[2] = el; }}
        className="min-h-screen flex flex-col items-center justify-center px-6 relative"
      >
        <div className={`transition-all duration-[1.2s] ease-out ${visible[2] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
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
