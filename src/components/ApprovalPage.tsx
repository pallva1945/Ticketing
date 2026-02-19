import React, { useState, useEffect } from 'react';
import { Shield, Check, X, User, Clock, Zap } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { PV_LOGO_URL } from '../constants';

const ALL_PAGES = [
  { id: 'hub', label: 'Internal Hub', group: 'sections' },
  { id: 'revenue', label: 'Revenue Center', group: 'corp' },
  { id: 'cost', label: 'Cost Center', group: 'corp' },
  { id: 'pnl', label: 'Verticals P&L', group: 'corp' },
  { id: 'home', label: 'Executive Overview', group: 'modules' },
  { id: 'ticketing', label: 'Ticketing', group: 'modules' },
  { id: 'gameday', label: 'GameDay', group: 'modules' },
  { id: 'sponsorship', label: 'Sponsorship', group: 'modules' },
  { id: 'merchandising', label: 'Merchandising', group: 'modules' },
  { id: 'venue_ops', label: 'Venue Ops', group: 'modules' },
  { id: 'bops', label: 'BOps', group: 'modules' },
  { id: 'sg', label: 'Varese Basketball', group: 'modules' },
];

const ACCESS_PRESETS = [
  { id: 'full', label: 'Full Access', description: 'Access to everything', pages: ALL_PAGES.map(p => p.id) },
  { id: 'coaches', label: 'Coaches', description: 'Hub sections only — no Corp area', pages: ['hub'] },
  { id: 'corp_readonly', label: 'Corp (Read Only)', description: 'Hub + Revenue Center (all modules)', pages: ['hub', 'revenue', 'home', 'ticketing', 'gameday', 'sponsorship', 'merchandising', 'venue_ops', 'bops', 'sg'] },
  { id: 'finance', label: 'Finance', description: 'Hub + Revenue, Cost & P&L', pages: ['hub', 'revenue', 'cost', 'pnl', 'home', 'ticketing', 'gameday', 'sponsorship', 'merchandising', 'venue_ops', 'bops', 'sg'] },
  { id: 'custom', label: 'Custom', description: 'Pick specific pages', pages: [] },
];

export const ApprovalPage: React.FC<{ token: string; onDone: () => void }> = ({ token, onDone }) => {
  const { theme } = useTheme();
  const { isAuthenticated, isAdmin } = useAuth();
  const isDark = theme === 'dark';

  const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState<any>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedPreset, setSelectedPreset] = useState('full');
  const [selectedPages, setSelectedPages] = useState<string[]>(ALL_PAGES.map(p => p.id));
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/approve/${token}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setRequest(data);
        } else {
          setError(data.message || 'Request not found');
        }
        setLoading(false);
      })
      .catch(() => { setError('Failed to load request'); setLoading(false); });
  }, [token]);

  const applyPreset = (presetId: string) => {
    setSelectedPreset(presetId);
    const preset = ACCESS_PRESETS.find(p => p.id === presetId);
    if (preset && preset.id !== 'custom') {
      setSelectedPages([...preset.pages]);
    }
  };

  const togglePage = (pageId: string) => {
    setSelectedPages(prev => prev.includes(pageId) ? prev.filter(p => p !== pageId) : [...prev, pageId]);
  };

  const handleApprove = async () => {
    setSubmitting(true);
    try {
      const accessLevel = selectedPreset === 'full' ? 'full' : 'partial';
      const res = await fetch(`/api/approve/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ accessLevel, pages: selectedPages })
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(`Access granted to ${request.email}`);
        setTimeout(onDone, 2000);
      } else {
        setError(data.message || 'Failed to approve');
      }
    } catch {
      setError('Network error');
    }
    setSubmitting(false);
  };

  const handleDeny = async () => {
    if (!confirm('Are you sure you want to deny this request?')) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/approve/${token}/deny`, {
        method: 'POST',
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        setSuccess('Access denied');
        setTimeout(onDone, 2000);
      } else {
        setError(data.message || 'Failed');
      }
    } catch {
      setError('Network error');
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-[#0a0a0a]' : 'bg-gray-50'}`}>
        <div className="w-8 h-8 border-2 border-red-800 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-[#0a0a0a] text-white' : 'bg-gray-50 text-gray-900'}`}>
        <div className="text-center max-w-sm px-6">
          <img src={PV_LOGO_URL} alt="PV" className="w-16 h-16 mx-auto mb-6 object-contain" />
          <Shield size={32} className="mx-auto mb-4 text-red-500" />
          <h2 className="text-lg font-bold mb-2">Admin Login Required</h2>
          <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Please sign in with your admin account to review this access request.
          </p>
          <button onClick={() => { window.location.hash = ''; window.location.reload(); }} className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700">
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#0a0a0a] text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-lg mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <img src={PV_LOGO_URL} alt="PV" className="w-12 h-12 mx-auto mb-4 object-contain" />
          <Shield size={28} className="mx-auto mb-3 text-red-500" />
          <h1 className="text-xl font-bold">Access Request</h1>
          <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Review and customize access</p>
        </div>

        {error && (
          <div className={`mb-4 px-4 py-3 rounded-lg text-sm ${isDark ? 'bg-red-900/20 border border-red-800/40 text-red-400' : 'bg-red-50 border border-red-200 text-red-600'}`}>{error}</div>
        )}
        {success && (
          <div className={`mb-4 px-4 py-3 rounded-lg text-sm ${isDark ? 'bg-green-900/20 border border-green-800/40 text-green-400' : 'bg-green-50 border border-green-200 text-green-600'}`}>{success}</div>
        )}

        {request && !success && (
          <>
            <div className={`rounded-xl border p-5 mb-6 ${isDark ? 'bg-gray-900/60 border-gray-800' : 'bg-white border-gray-200'}`}>
              <div className="flex items-center gap-4">
                {request.picture ? (
                  <img src={request.picture} alt="" className="w-12 h-12 rounded-full" />
                ) : (
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                    <User size={20} className={isDark ? 'text-gray-500' : 'text-gray-400'} />
                  </div>
                )}
                <div>
                  <p className="font-semibold">{request.name}</p>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{request.email}</p>
                  <p className={`text-xs mt-1 flex items-center gap-1 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                    <Clock size={10} />
                    Requested {new Date(request.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            <div className={`rounded-xl border p-5 mb-6 ${isDark ? 'bg-gray-900/60 border-gray-800' : 'bg-white border-gray-200'}`}>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Zap size={14} className="text-red-500" />
                Access Level
              </h3>
              <div className="grid grid-cols-2 gap-2 mb-3">
                {ACCESS_PRESETS.map(preset => (
                  <button
                    key={preset.id}
                    onClick={() => applyPreset(preset.id)}
                    className={`text-left p-3 rounded-lg border text-xs transition-all ${
                      selectedPreset === preset.id
                        ? 'border-red-500 bg-red-600/10 ring-1 ring-red-500/30'
                        : isDark ? 'border-gray-700 hover:border-gray-600 bg-gray-800/50' : 'border-gray-200 hover:border-gray-300 bg-gray-50'
                    }`}
                  >
                    <div className={`font-semibold mb-0.5 ${selectedPreset === preset.id ? 'text-red-500' : isDark ? 'text-white' : 'text-gray-900'}`}>
                      {preset.label}
                    </div>
                    <div className={`text-[10px] leading-tight ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                      {preset.description}
                    </div>
                  </button>
                ))}
              </div>

              {selectedPreset === 'custom' && (
                <div className={`p-3 rounded-lg border ${isDark ? 'border-gray-700 bg-gray-800/30' : 'border-gray-200 bg-gray-50'}`}>
                  <p className={`text-xs font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Select pages:</p>
                  <div className="space-y-2">
                    <div>
                      <p className={`text-[10px] uppercase tracking-wider font-semibold mb-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Sections</p>
                      <div className="flex flex-wrap gap-1.5">
                        {ALL_PAGES.filter(p => p.group === 'sections' || p.group === 'corp').map(page => (
                          <button
                            key={page.id}
                            onClick={() => togglePage(page.id)}
                            className={`px-2.5 py-1 rounded-md text-xs transition-colors ${
                              selectedPages.includes(page.id)
                                ? 'bg-red-600 text-white'
                                : isDark ? 'bg-gray-700 text-gray-400 hover:bg-gray-600' : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
                            }`}
                          >
                            {page.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className={`text-[10px] uppercase tracking-wider font-semibold mb-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Revenue Modules</p>
                      <div className="flex flex-wrap gap-1.5">
                        {ALL_PAGES.filter(p => p.group === 'modules').map(page => (
                          <button
                            key={page.id}
                            onClick={() => togglePage(page.id)}
                            className={`px-2.5 py-1 rounded-md text-xs transition-colors ${
                              selectedPages.includes(page.id)
                                ? 'bg-red-600 text-white'
                                : isDark ? 'bg-gray-700 text-gray-400 hover:bg-gray-600' : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
                            }`}
                          >
                            {page.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleApprove}
                disabled={submitting || selectedPages.length === 0}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                <Check size={16} />
                Approve Access
              </button>
              <button
                onClick={handleDeny}
                disabled={submitting}
                className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${isDark ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
              >
                <X size={16} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
