import React, { useEffect, useState } from 'react';
import { ArrowRight, Sun, Moon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { PV_LOGO_URL } from '../constants';

interface WelcomePageProps {
  onEnter: () => void;
}

export const WelcomePage: React.FC<WelcomePageProps> = ({ onEnter }) => {
  const { theme, toggleTheme } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();
  const isDark = theme === 'dark';
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 200);
    const t2 = setTimeout(() => setPhase(2), 1200);
    const t3 = setTimeout(() => setPhase(3), 2000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

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
        .animate-line { animation: line-draw 1s ease-out 2.2s forwards; width: 0; }
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
        <div className="flex flex-col items-center text-center">
          <div className={`transition-all duration-[1.5s] ease-out ${phase >= 1 ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
            <img src={PV_LOGO_URL} alt="Pallacanestro Varese" className="w-24 h-24 sm:w-28 sm:h-28 object-contain mb-10" />
          </div>

          <div className={`transition-all duration-[1.2s] ease-out ${phase >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <h1 className={`text-3xl sm:text-4xl lg:text-5xl font-light tracking-[0.15em] uppercase mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Pallacanestro Varese
            </h1>
            <div className="flex justify-center mb-6">
              <div className={`h-px animate-line ${isDark ? 'bg-red-700' : 'bg-red-400'}`}></div>
            </div>
            <p className={`text-sm sm:text-base tracking-[0.3em] uppercase font-light ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              {t('Operations & Business Intelligence')}
            </p>
          </div>

          <div className={`mt-16 transition-all duration-1000 ease-out ${phase >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <button
              onClick={onEnter}
              className={`group relative flex items-center gap-3 px-10 py-4 rounded-full transition-all duration-500 tracking-[0.2em] uppercase text-xs font-medium ${
                isDark
                  ? 'border border-gray-700 text-gray-300 hover:border-red-800 hover:text-white hover:shadow-lg hover:shadow-red-950/20'
                  : 'border border-gray-300 text-gray-600 hover:border-red-400 hover:text-gray-900 hover:shadow-lg hover:shadow-red-100/50'
              }`}
            >
              {t('Enter')}
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform duration-300" />
            </button>
          </div>
        </div>

        <div className={`absolute bottom-8 left-1/2 -translate-x-1/2 transition-all duration-1000 ${phase >= 3 ? 'opacity-100' : 'opacity-0'}`}>
          <div className={`flex items-center gap-4 text-[10px] tracking-[0.25em] uppercase ${isDark ? 'text-gray-700' : 'text-gray-300'}`}>
            <span>{t('Season')} 2025/26</span>
            <span className="w-px h-3 bg-current"></span>
            <span>pallva.it</span>
          </div>
        </div>
      </div>
    </div>
  );
};
