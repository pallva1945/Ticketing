import React, { useEffect, useState } from 'react';
import { ArrowRight, Sun, Moon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { PV_LOGO_URL } from '../constants';

const VB_LOGO_URL = "https://i.imgur.com/e7khORs.png";

interface WelcomePageProps {
  onEnterPV: () => void;
  onEnterVB: () => void;
}

export const WelcomePage: React.FC<WelcomePageProps> = ({ onEnterPV, onEnterVB }) => {
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
          <div className={`transition-all duration-[1.2s] ease-out ${phase >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <p className={`text-sm sm:text-base tracking-[0.3em] uppercase font-light mb-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              {t('Operations & Business Intelligence')}
            </p>
            <div className="flex justify-center mb-10">
              <div className={`h-px animate-line ${isDark ? 'bg-red-700' : 'bg-red-400'}`}></div>
            </div>
          </div>

          <div className={`transition-all duration-[1.2s] ease-out delay-500 ${phase >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            <p className={`text-xs tracking-[0.25em] uppercase font-medium mb-8 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
              {t('Choose your area')}
            </p>
          </div>

          <div className={`grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-10 max-w-2xl transition-all duration-1000 ease-out ${phase >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <button
              onClick={onEnterPV}
              className={`group relative flex flex-col items-center text-center px-10 py-10 sm:px-12 sm:py-14 rounded-2xl border transition-all duration-500 hover:shadow-2xl ${
                isDark
                  ? 'bg-gray-900/50 border-gray-800 hover:border-red-800/60 hover:shadow-red-950/10'
                  : 'bg-white border-gray-200 hover:border-red-300 hover:shadow-red-100/30'
              }`}
            >
              <div className={`absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-red-600 to-red-400 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-t-2xl`}></div>
              <img src={PV_LOGO_URL} alt="Pallacanestro Varese" className="w-20 h-20 sm:w-24 sm:h-24 object-contain mb-6 group-hover:scale-105 transition-transform duration-500" />
              <h2 className={`text-lg sm:text-xl font-semibold tracking-[0.05em] mb-2 whitespace-nowrap ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Pallacanestro Varese
              </h2>
              <p className={`text-xs sm:text-sm mb-5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                Corp · BOps
              </p>
              <div className={`inline-flex items-center gap-2 text-xs font-medium tracking-wider uppercase group-hover:gap-3 transition-all ${isDark ? 'text-red-500' : 'text-red-600'}`}>
                {t('Enter')}
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </button>

            <button
              onClick={onEnterVB}
              className={`group relative flex flex-col items-center text-center px-10 py-10 sm:px-12 sm:py-14 rounded-2xl border transition-all duration-500 hover:shadow-2xl ${
                isDark
                  ? 'bg-gray-900/50 border-gray-800 hover:border-orange-800/60 hover:shadow-orange-950/10'
                  : 'bg-white border-gray-200 hover:border-orange-300 hover:shadow-orange-100/30'
              }`}
            >
              <div className={`absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-orange-500 to-orange-400 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-t-2xl`}></div>
              <img src={VB_LOGO_URL} alt="Varese Basketball" className="w-20 h-20 sm:w-24 sm:h-24 object-contain mb-6 group-hover:scale-105 transition-transform duration-500" />
              <h2 className={`text-lg sm:text-xl font-semibold tracking-[0.05em] mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Varese Basketball
              </h2>
              <p className={`text-xs sm:text-sm mb-5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                {t('Youth Development')}
              </p>
              <div className={`inline-flex items-center gap-2 text-xs font-medium tracking-wider uppercase group-hover:gap-3 transition-all ${isDark ? 'text-orange-500' : 'text-orange-600'}`}>
                {t('Enter')}
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </div>
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
