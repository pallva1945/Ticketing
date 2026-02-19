import React, { useState, useEffect, useRef } from 'react';
import { Lock, AlertCircle, Sun, Moon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { PV_LOGO_URL } from '../constants';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          renderButton: (element: HTMLElement, config: any) => void;
          prompt: () => void;
        };
      };
    };
    handleGoogleLogin?: (response: any) => void;
  }
}

export const LoginPage: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();
  const { loginWithGoogle, loginWithPassword } = useAuth();
  const isDark = theme === 'dark';

  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [phase, setPhase] = useState(0);
  const [clientId, setClientId] = useState('');
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const [showPasswordLogin, setShowPasswordLogin] = useState(false);
  const [passwordEmail, setPasswordEmail] = useState('');
  const [passwordValue, setPasswordValue] = useState('');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 200);
    const t2 = setTimeout(() => setPhase(2), 800);
    const t3 = setTimeout(() => setPhase(3), 1400);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  useEffect(() => {
    fetch('/api/auth/client-id')
      .then(r => r.json())
      .then(data => {
        if (data.clientId) setClientId(data.clientId);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!clientId || !googleButtonRef.current) return;

    window.handleGoogleLogin = async (response: any) => {
      if (response.credential) {
        setIsSubmitting(true);
        setError('');
        const result = await loginWithGoogle(response.credential);
        setIsSubmitting(false);
        if (!result.success && !(result as any).pending) {
          setError(result.message || t('Login failed'));
        }
      }
    };

    const initGoogle = () => {
      if (window.google?.accounts?.id && googleButtonRef.current) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: window.handleGoogleLogin,
          auto_select: false,
          itp_support: true,
        });
        window.google.accounts.id.renderButton(
          googleButtonRef.current,
          {
            type: 'standard',
            theme: isDark ? 'filled_black' : 'outline',
            size: 'large',
            text: 'signin_with',
            shape: 'pill',
            width: 320,
            locale: language === 'it' ? 'it' : 'en',
          }
        );
      }
    };

    if (window.google?.accounts?.id) {
      initGoogle();
    } else {
      const interval = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(interval);
          initGoogle();
        }
      }, 200);
      return () => clearInterval(interval);
    }
  }, [clientId, isDark, language, loginWithGoogle, t]);

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
            {isSubmitting && (
              <div className="flex items-center justify-center gap-2 mb-4">
                <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('Signing in...')}</span>
              </div>
            )}

            {error && (
              <div className={`flex items-center gap-2 mb-4 px-3 py-2 rounded-lg text-xs ${
                isDark ? 'text-red-400 bg-red-900/20 border border-red-800/40' : 'text-red-600 bg-red-50 border border-red-200'
              }`}>
                <AlertCircle size={14} className="flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex justify-center mb-6" ref={googleButtonRef}></div>

            <div className="relative my-4">
              <div className={`absolute inset-0 flex items-center`}>
                <div className={`w-full border-t ${isDark ? 'border-gray-800' : 'border-gray-200'}`}></div>
              </div>
              <div className="relative flex justify-center">
                <button
                  onClick={() => setShowPasswordLogin(!showPasswordLogin)}
                  className={`px-3 text-[10px] tracking-wider uppercase ${isDark ? 'bg-[#0a0a0a] text-gray-600 hover:text-gray-400' : 'bg-[#fafafa] text-gray-400 hover:text-gray-600'} transition-colors`}
                >
                  {showPasswordLogin ? 'Hide' : 'External Access'}
                </button>
              </div>
            </div>

            {showPasswordLogin && (
              <form onSubmit={async (e) => {
                e.preventDefault();
                if (!passwordEmail || !passwordValue) return;
                setIsSubmitting(true);
                setError('');
                const result = await loginWithPassword(passwordEmail, passwordValue);
                setIsSubmitting(false);
                if (!result.success) setError(result.message || 'Login failed');
              }} className="space-y-3 mb-4">
                <input
                  type="email"
                  placeholder="Email"
                  value={passwordEmail}
                  onChange={e => setPasswordEmail(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg text-sm border ${isDark ? 'bg-gray-900 border-gray-800 text-white placeholder-gray-600' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'}`}
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={passwordValue}
                  onChange={e => setPasswordValue(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg text-sm border ${isDark ? 'bg-gray-900 border-gray-800 text-white placeholder-gray-600' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'}`}
                />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  {isSubmitting ? 'Signing in...' : 'Sign In'}
                </button>
              </form>
            )}

            <p className={`text-[10px] tracking-wide ${isDark ? 'text-gray-700' : 'text-gray-400'}`}>
              {t('Sign in with your @pallacanestrovarese.it Google account')}
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
