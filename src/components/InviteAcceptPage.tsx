import React, { useState, useEffect } from 'react';
import { Lock, AlertCircle, Check, Eye, EyeOff } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { PV_LOGO_URL } from '../constants';

interface InviteAcceptPageProps {
  token: string;
  onAccepted: () => void;
}

export const InviteAcceptPage: React.FC<InviteAcceptPageProps> = ({ token, onAccepted }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [invalidInvite, setInvalidInvite] = useState(false);

  useEffect(() => {
    fetch(`/api/invite/${token}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setEmail(data.email);
        } else {
          setError(data.message || 'Invalid invitation');
          setInvalidInvite(true);
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to verify invitation');
        setInvalidInvite(true);
        setLoading(false);
      });
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/invite/${token}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ password, name: name || email })
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        setTimeout(() => onAccepted(), 1500);
      } else {
        setError(data.message || 'Failed to create account');
      }
    } catch {
      setError('Network error. Please try again.');
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-[#0a0a0a]' : 'bg-[#fafafa]'}`}>
        <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex items-center justify-center px-6 ${isDark ? 'bg-[#0a0a0a]' : 'bg-[#fafafa]'}`}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <img src={PV_LOGO_URL} alt="PV" className="w-16 h-16 object-contain mx-auto mb-4" />
          <h1 className={`text-xl font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {success ? 'Account Created!' : invalidInvite ? 'Invalid Invitation' : 'Create Your Account'}
          </h1>
          {!invalidInvite && !success && (
            <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              You've been invited to PV Internal Portal
            </p>
          )}
        </div>

        {success ? (
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-green-600/20 flex items-center justify-center mx-auto mb-4">
              <Check size={32} className="text-green-500" />
            </div>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Redirecting you to the portal...</p>
          </div>
        ) : invalidInvite ? (
          <div className={`text-center p-6 rounded-xl border ${isDark ? 'bg-gray-900/60 border-gray-800' : 'bg-white border-gray-200'}`}>
            <AlertCircle size={32} className="text-red-500 mx-auto mb-3" />
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{error}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={`p-6 rounded-xl border space-y-4 ${isDark ? 'bg-gray-900/60 border-gray-800' : 'bg-white border-gray-200'}`}>
            <div>
              <label className={`text-xs font-medium mb-1 block ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Email</label>
              <input type="email" value={email} readOnly className={`w-full px-3 py-2 rounded-lg text-sm border ${isDark ? 'bg-gray-800/50 border-gray-700 text-gray-400' : 'bg-gray-50 border-gray-200 text-gray-500'}`} />
            </div>

            <div>
              <label className={`text-xs font-medium mb-1 block ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Your Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Enter your name"
                className={`w-full px-3 py-2 rounded-lg text-sm border ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
              />
            </div>

            <div>
              <label className={`text-xs font-medium mb-1 block ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className={`w-full px-3 py-2 pr-10 rounded-lg text-sm border ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className={`absolute right-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className={`text-xs font-medium mb-1 block ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                className={`w-full px-3 py-2 rounded-lg text-sm border ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
              />
            </div>

            {error && (
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${isDark ? 'text-red-400 bg-red-900/20 border border-red-800/40' : 'text-red-600 bg-red-50 border border-red-200'}`}>
                <AlertCircle size={14} />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Creating account...
                </>
              ) : (
                <>
                  <Lock size={16} />
                  Create Account & Enter
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
