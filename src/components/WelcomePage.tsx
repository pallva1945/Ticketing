import React, { useEffect, useState } from 'react';
import { BarChart3, ArrowRight, Sun, Moon, Shield } from 'lucide-react';
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`min-h-screen relative overflow-hidden ${isDark ? 'dark bg-gray-950' : 'bg-white'}`}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute -top-40 -right-40 w-96 h-96 rounded-full blur-3xl ${isDark ? 'bg-red-900/10' : 'bg-red-50'}`}></div>
        <div className={`absolute -bottom-40 -left-40 w-96 h-96 rounded-full blur-3xl ${isDark ? 'bg-orange-900/10' : 'bg-orange-50'}`}></div>
        <div className={`absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full blur-3xl ${isDark ? 'bg-red-950/5' : 'bg-red-50/50'}`}></div>
      </div>

      <div className="absolute top-5 right-5 flex items-center gap-2 z-10">
        <button
          onClick={toggleLanguage}
          className={`px-3 py-2 rounded-xl text-sm font-medium transition-all border ${
            isDark ? 'bg-gray-900 border-gray-800 text-gray-300 hover:bg-gray-800' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
          } shadow-sm`}
        >
          {language === 'en' ? '\u{1F1EE}\u{1F1F9} IT' : '\u{1F1EC}\u{1F1E7} EN'}
        </button>
        <button
          onClick={toggleTheme}
          className={`p-2.5 rounded-xl transition-all border ${
            isDark ? 'bg-gray-900 border-gray-800 text-gray-300 hover:bg-gray-800' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
          } shadow-sm`}
        >
          {isDark ? <Sun size={16} className="text-yellow-400" /> : <Moon size={16} className="text-gray-500" />}
        </button>
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6">
        <div className={`transition-all duration-1000 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <div className="flex flex-col items-center text-center mb-12">
            <div className={`w-28 h-28 rounded-3xl flex items-center justify-center mb-8 shadow-lg ${
              isDark ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-100'
            }`}>
              <img src={PV_LOGO_URL} alt="Pallacanestro Varese" className="w-20 h-20 object-contain" />
            </div>

            <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium mb-6 ${
              isDark ? 'bg-red-900/20 text-red-400 border border-red-800/30' : 'bg-red-50 text-red-600 border border-red-100'
            }`}>
              <Shield size={12} />
              {t('Internal Platform')}
            </div>

            <h1 className={`text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Pallacanestro Varese
            </h1>
            <p className={`text-lg sm:text-xl max-w-lg leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {t('Operations & Business Intelligence Hub')}
            </p>
          </div>
        </div>

        <div className={`transition-all duration-1000 delay-300 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <button
            onClick={onEnter}
            className="group relative flex items-center gap-4 px-8 py-5 rounded-2xl transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white shadow-lg shadow-red-600/20"
          >
            <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center">
              <BarChart3 size={24} />
            </div>
            <div className="text-left">
              <div className="font-bold text-lg">PV Financial Center</div>
              <div className="text-sm text-red-100">{t('Revenue, Costs & Business Intelligence')}</div>
            </div>
            <ArrowRight size={20} className="ml-4 group-hover:translate-x-1 transition-transform text-red-200" />
          </button>
        </div>

        <div className={`transition-all duration-1000 delay-500 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <div className={`mt-20 flex items-center gap-6 text-xs ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
            <span>Pallacanestro Varese</span>
            <span className="w-1 h-1 rounded-full bg-current"></span>
            <span>{t('Season')} 2025/26</span>
            <span className="w-1 h-1 rounded-full bg-current"></span>
            <span>pallva.it</span>
          </div>
        </div>
      </div>
    </div>
  );
};
