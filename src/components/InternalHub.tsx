import React from 'react';
import { Compass, Users, Building2, Shield, ArrowRight, Lock, Sun, Moon } from 'lucide-react';
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

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#0a0a0a]' : 'bg-[#fafafa]'}`}>
      <div className={`fixed top-0 left-0 w-full h-px z-50 ${isDark ? 'bg-gradient-to-r from-transparent via-red-800/40 to-transparent' : 'bg-gradient-to-r from-transparent via-red-200 to-transparent'}`}></div>

      <nav className={`sticky top-0 z-40 backdrop-blur-xl ${isDark ? 'bg-[#0a0a0a]/80 border-b border-gray-800/50' : 'bg-[#fafafa]/80 border-b border-gray-200/50'}`}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onBackToWelcome} className="hover:opacity-70 transition-opacity">
              <img src={PV_LOGO_URL} alt="PV" className="w-8 h-8 object-contain" />
            </button>
            <div className={`h-5 w-px ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`}></div>
            <span className={`text-xs tracking-[0.2em] uppercase font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Pallacanestro Varese
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

      <main className="max-w-6xl mx-auto px-6 py-16">
        <div className="mb-16">
          <h1 className={`text-2xl sm:text-3xl font-light tracking-[0.1em] uppercase mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {t('Internal Hub')}
          </h1>
          <div className={`w-12 h-px mt-4 ${isDark ? 'bg-red-700' : 'bg-red-400'}`}></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          <button
            disabled
            className={`group relative text-left rounded-2xl border transition-all duration-300 overflow-hidden cursor-not-allowed opacity-60 ${
              isDark ? 'bg-gray-900/50 border-gray-800/50' : 'bg-white/50 border-gray-200/50'
            }`}
          >
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-amber-900/20' : 'bg-amber-50'}`}>
                  <Compass size={24} className="text-amber-600" />
                </div>
                <div className="flex items-center gap-1.5">
                  <Lock size={12} className={isDark ? 'text-gray-600' : 'text-gray-400'} />
                  <span className={`text-[10px] tracking-[0.15em] uppercase font-medium ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>{t('Coming Soon')}</span>
                </div>
              </div>
              <h2 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {t('Vision, Mission & Values')}
              </h2>
              <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                {t('Our strategic direction, purpose, and the principles that guide Pallacanestro Varese.')}
              </p>
            </div>
          </button>

          <button
            disabled
            className={`group relative text-left rounded-2xl border transition-all duration-300 overflow-hidden cursor-not-allowed opacity-60 ${
              isDark ? 'bg-gray-900/50 border-gray-800/50' : 'bg-white/50 border-gray-200/50'
            }`}
          >
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-blue-900/20' : 'bg-blue-50'}`}>
                  <Users size={24} className="text-blue-600" />
                </div>
                <div className="flex items-center gap-1.5">
                  <Lock size={12} className={isDark ? 'text-gray-600' : 'text-gray-400'} />
                  <span className={`text-[10px] tracking-[0.15em] uppercase font-medium ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>{t('Coming Soon')}</span>
                </div>
              </div>
              <h2 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {t('About Us')}
              </h2>
              <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                {t('Our organization, leadership team, and the story behind the club.')}
              </p>
            </div>
          </button>
        </div>

        <div className="mb-6">
          <h2 className={`text-xs tracking-[0.2em] uppercase font-medium mb-6 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            {t('Departments')}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button
            onClick={() => onNavigate('landing')}
            className={`group relative text-left rounded-2xl border transition-all duration-300 overflow-hidden hover:shadow-xl ${
              isDark ? 'bg-gray-900 border-gray-800 hover:border-red-800/50' : 'bg-white border-gray-200 hover:border-red-300'
            }`}
          >
            <div className={`absolute top-0 left-0 w-full h-px bg-gradient-to-r from-red-600 to-red-400 opacity-0 group-hover:opacity-100 transition-opacity`}></div>
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-red-900/20' : 'bg-red-50'}`}>
                  <Building2 size={24} className="text-red-600" />
                </div>
                <ArrowRight size={16} className={`group-hover:translate-x-1 transition-all ${isDark ? 'text-gray-600 group-hover:text-red-500' : 'text-gray-300 group-hover:text-red-500'}`} />
              </div>
              <h2 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Corp
              </h2>
              <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                {t('Financial Center — Revenue, Costs & Verticals P&L')}
              </p>
            </div>
          </button>

          <button
            disabled
            className={`group relative text-left rounded-2xl border transition-all duration-300 overflow-hidden cursor-not-allowed opacity-60 ${
              isDark ? 'bg-gray-900/50 border-gray-800/50' : 'bg-white/50 border-gray-200/50'
            }`}
          >
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-emerald-900/20' : 'bg-emerald-50'}`}>
                  <Shield size={24} className="text-emerald-600" />
                </div>
                <div className="flex items-center gap-1.5">
                  <Lock size={12} className={isDark ? 'text-gray-600' : 'text-gray-400'} />
                  <span className={`text-[10px] tracking-[0.15em] uppercase font-medium ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>{t('Coming Soon')}</span>
                </div>
              </div>
              <h2 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                BOps
              </h2>
              <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                {t('Basketball Operations — Team management, roster & performance')}
              </p>
            </div>
          </button>
        </div>

        <div className="mt-20 text-center">
          <div className={`flex items-center justify-center gap-4 text-[10px] tracking-[0.25em] uppercase ${isDark ? 'text-gray-700' : 'text-gray-300'}`}>
            <span>Pallacanestro Varese</span>
            <span className="w-px h-3 bg-current"></span>
            <span>{t('Season')} 2025/26</span>
          </div>
        </div>
      </main>
    </div>
  );
};
