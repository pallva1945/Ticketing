import React from 'react';
import { Clock, ArrowLeft } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { PV_LOGO_URL } from '../constants';

export const AccessPendingPage: React.FC = () => {
  const { theme } = useTheme();
  const { pendingEmail, logout } = useAuth();
  const isDark = theme === 'dark';

  return (
    <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-[#0a0a0a]' : 'bg-[#fafafa]'}`}>
      <div className="text-center max-w-sm px-6">
        <img src={PV_LOGO_URL} alt="PV" className="w-16 h-16 mx-auto mb-8 object-contain" />

        <div className={`w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center ${isDark ? 'bg-amber-900/20 border border-amber-800/40' : 'bg-amber-50 border border-amber-200'}`}>
          <Clock size={28} className="text-amber-500" />
        </div>

        <h2 className={`text-lg font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Access Request Sent
        </h2>

        <p className={`text-sm mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          Your request to access the PV Internal Portal has been sent to the administrator.
        </p>

        {pendingEmail && (
          <p className={`text-xs mb-6 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
            {pendingEmail}
          </p>
        )}

        <p className={`text-xs mb-8 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
          You'll be able to log in once your access is approved.
        </p>

        <button
          onClick={logout}
          className={`flex items-center justify-center gap-2 mx-auto px-4 py-2 rounded-lg text-sm transition-colors ${
            isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <ArrowLeft size={14} />
          Back to login
        </button>
      </div>
    </div>
  );
};
