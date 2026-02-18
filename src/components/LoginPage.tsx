import React, { useState } from 'react';
import { Lock, Mail, ArrowRight, AlertCircle, Sun, Moon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { PV_LOGO_URL } from '../constants';

export const LoginPage: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();
  const { login } = useAuth();
  const isDark = theme === 'dark';

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [phase, setPhase] = useState(0);

  React.useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 200);
    const t2 = setTimeout(() => setPhase(2), 800);
    const t3 = setTimeout(() => setPhase(3), 1400);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      setError(t('Please enter your email address'));
      return;
    }

    if (!trimmed.endsWith('@pallacanestrovarese.it')) {
      setError(t('Access restricted to @pallacanestrovarese.it accounts'));
      return;
    }

    setIsSubmitting(true);
    const result = await login(trimmed);
    setIsSubmitting(false);

    if (!result.success) {
      setError(result.message || t('Login failed'));
    }
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
        .login-line { animation: line-draw 1s ease-out 1s forwards; width: 0; }
        .login-glow { animation: subtle-pulse 4s ease-in-out infinite; }
      `}</style>

      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full login-glow ${
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
        <div className="flex flex-col items-center text-center w-full max-w-sm">
          <div className={`transition-all duration-[1.5s] ease-out ${phase >= 1 ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
            <img src={PV_LOGO_URL} alt="Pallacanestro Varese" className="w-20 h-20 sm:w-24 sm:h-24 object-contain mb-8" />
          </div>

          <div className={`transition-all duration-[1.2s] ease-out ${phase >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <div className="flex items-center gap-2 mb-2 justify-center">
              <Lock size={14} className={isDark ? 'text-red-500' : 'text-red-600'} />
              <h2 className={`text-sm tracking-[0.2em] uppercase font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {t('Corporate Access')}
              </h2>
            </div>
            <div className="flex justify-center mb-8">
              <div className={`h-px login-line ${isDark ? 'bg-red-700' : 'bg-red-400'}`}></div>
            </div>
          </div>

          <div className={`w-full transition-all duration-[1s] ease-out ${phase >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <form onSubmit={handleSubmit} className="w-full">
              <div className="relative mb-4">
                <Mail size={16} className={`absolute left-4 top-1/2 -translate-y-1/2 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  placeholder="nome@pallacanestrovarese.it"
                  autoComplete="email"
                  autoFocus
                  className={`w-full pl-11 pr-4 py-3.5 rounded-xl text-sm tracking-wide transition-all outline-none ${
                    isDark
                      ? 'bg-white/5 border border-gray-800 text-white placeholder-gray-600 focus:border-red-800 focus:bg-white/[0.07]'
                      : 'bg-white border border-gray-200 text-gray-900 placeholder-gray-400 focus:border-red-400 focus:shadow-sm'
                  } ${error ? (isDark ? 'border-red-800' : 'border-red-300') : ''}`}
                />
              </div>

              {error && (
                <div className={`flex items-center gap-2 mb-4 px-1 text-xs ${isDark ? 'text-red-400' : 'text-red-500'}`}>
                  <AlertCircle size={12} />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full group flex items-center justify-center gap-3 py-3.5 rounded-xl transition-all duration-500 tracking-[0.15em] uppercase text-xs font-medium ${
                  isDark
                    ? 'bg-red-900/40 border border-red-800/60 text-red-200 hover:bg-red-900/60 hover:border-red-700 disabled:opacity-40'
                    : 'bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 hover:border-red-300 disabled:opacity-40'
                } disabled:cursor-not-allowed`}
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    {t('Sign In')}
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform duration-300" />
                  </>
                )}
              </button>
            </form>

            <p className={`mt-6 text-[10px] tracking-wide ${isDark ? 'text-gray-700' : 'text-gray-400'}`}>
              {t('Restricted to Pallacanestro Varese staff')}
            </p>
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
