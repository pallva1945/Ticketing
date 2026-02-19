import React, { useState, useEffect, useCallback } from 'react';
import { Shield, Users, Mail, UserPlus, X, Check, Ban, RefreshCw, Copy, Trash2, Eye, EyeOff, ChevronDown, Clock, Globe, Building, Zap } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';

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
  {
    id: 'full',
    label: 'Full Access',
    description: 'Access to everything',
    accessLevel: 'full' as const,
    pages: ALL_PAGES.map(p => p.id),
  },
  {
    id: 'coaches',
    label: 'Coaches',
    description: 'Hub sections only — no Corp area',
    accessLevel: 'partial' as const,
    pages: ['hub'],
  },
  {
    id: 'corp_readonly',
    label: 'Corp (Read Only)',
    description: 'Hub + Revenue Center (all modules)',
    accessLevel: 'partial' as const,
    pages: ['hub', 'revenue', 'home', 'ticketing', 'gameday', 'sponsorship', 'merchandising', 'venue_ops', 'bops', 'sg'],
  },
  {
    id: 'finance',
    label: 'Finance',
    description: 'Hub + Revenue, Cost & P&L',
    accessLevel: 'partial' as const,
    pages: ['hub', 'revenue', 'cost', 'pnl', 'home', 'ticketing', 'gameday', 'sponsorship', 'merchandising', 'venue_ops', 'bops', 'sg'],
  },
  {
    id: 'custom',
    label: 'Custom',
    description: 'Pick specific pages',
    accessLevel: 'partial' as const,
    pages: [],
  },
];

interface User {
  id: number;
  email: string;
  name: string;
  auth_type: string;
  role: string;
  access_level: string;
  is_external: boolean;
  status: string;
  expires_at: string | null;
  created_at: string;
  last_login: string | null;
  allowed_pages: string[];
}

interface Invitation {
  id: number;
  email: string;
  token: string;
  access_level: string;
  is_temporary: boolean;
  expires_at: string | null;
  status: string;
  created_at: string;
  pages: string[];
}

function getPresetForUser(user: User): string {
  if (user.access_level === 'full') return 'full';
  const pages = user.allowed_pages || [];
  for (const preset of ACCESS_PRESETS) {
    if (preset.id === 'full' || preset.id === 'custom') continue;
    if (pages.length === preset.pages.length && preset.pages.every(p => pages.includes(p))) {
      return preset.id;
    }
  }
  return 'custom';
}

export const AdminPanel: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const isDark = theme === 'dark';

  const [activeTab, setActiveTab] = useState<'users' | 'requests' | 'invite' | 'invitations'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [accessRequests, setAccessRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [newInternalEmail, setNewInternalEmail] = useState('');
  const [newInternalPreset, setNewInternalPreset] = useState('full');
  const [newInternalPages, setNewInternalPages] = useState<string[]>(ALL_PAGES.map(p => p.id));

  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePreset, setInvitePreset] = useState('corp_readonly');
  const [invitePages, setInvitePages] = useState<string[]>(ACCESS_PRESETS.find(p => p.id === 'corp_readonly')!.pages);
  const [inviteTemporary, setInviteTemporary] = useState(false);
  const [inviteExpiry, setInviteExpiry] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');

  const [editingUser, setEditingUser] = useState<number | null>(null);
  const [editPreset, setEditPreset] = useState('full');
  const [editPages, setEditPages] = useState<string[]>([]);
  const [editExpiry, setEditExpiry] = useState('');

  const applyPreset = (presetId: string, setPages: (p: string[]) => void, currentPages?: string[]) => {
    const preset = ACCESS_PRESETS.find(p => p.id === presetId);
    if (preset && preset.id !== 'custom') {
      setPages([...preset.pages]);
    } else if (preset?.id === 'custom') {
      setPages(currentPages || []);
    }
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, invRes, reqRes] = await Promise.all([
        fetch('/api/admin/users', { credentials: 'include' }),
        fetch('/api/admin/invitations', { credentials: 'include' }),
        fetch('/api/admin/access-requests', { credentials: 'include' })
      ]);
      if (usersRes.ok) {
        const data = await usersRes.json();
        setUsers(data.users || []);
      }
      if (invRes.ok) {
        const data = await invRes.json();
        setInvitations(data.invitations || []);
      }
      if (reqRes.ok) {
        const data = await reqRes.json();
        setAccessRequests(data.requests || []);
      }
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const showMessage = (msg: string, isError = false) => {
    if (isError) { setError(msg); setSuccess(''); }
    else { setSuccess(msg); setError(''); }
    setTimeout(() => { setError(''); setSuccess(''); }, 4000);
  };

  const addInternalUser = async () => {
    if (!newInternalEmail) return;
    const email = newInternalEmail.includes('@') ? newInternalEmail : `${newInternalEmail}@pallacanestrovarese.it`;
    const preset = ACCESS_PRESETS.find(p => p.id === newInternalPreset);
    const accessLevel = preset?.accessLevel === 'full' ? 'full' : 'partial';
    try {
      const res = await fetch('/api/admin/users/internal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, accessLevel, pages: accessLevel === 'full' ? ALL_PAGES.map(p => p.id) : newInternalPages })
      });
      const data = await res.json();
      if (data.success) {
        showMessage(`Access granted to ${email}`);
        setNewInternalEmail('');
        setNewInternalPages(ALL_PAGES.map(p => p.id));
        setNewInternalPreset('full');
        fetchData();
      } else {
        showMessage(data.message, true);
      }
    } catch (e: any) {
      showMessage(e.message, true);
    }
  };

  const sendInvite = async () => {
    if (!inviteEmail) return;
    const preset = ACCESS_PRESETS.find(p => p.id === invitePreset);
    const accessLevel = preset?.accessLevel === 'full' ? 'full' : 'partial';
    try {
      const res = await fetch('/api/admin/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: inviteEmail,
          accessLevel,
          pages: accessLevel === 'full' ? ALL_PAGES.map(p => p.id) : invitePages,
          isTemporary: inviteTemporary,
          expiresAt: inviteExpiry || null
        })
      });
      const data = await res.json();
      if (data.success) {
        setGeneratedLink(data.inviteLink);
        showMessage('Invitation created successfully');
        fetchData();
      } else {
        showMessage(data.message, true);
      }
    } catch (e: any) {
      showMessage(e.message, true);
    }
  };

  const updateAccess = async (userId: number) => {
    const preset = ACCESS_PRESETS.find(p => p.id === editPreset);
    const accessLevel = preset?.accessLevel === 'full' ? 'full' : 'partial';
    try {
      const res = await fetch(`/api/admin/users/${userId}/access`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ accessLevel, pages: accessLevel === 'full' ? ALL_PAGES.map(p => p.id) : editPages, expiresAt: editExpiry || null })
      });
      const data = await res.json();
      if (data.success) {
        showMessage('Access updated');
        setEditingUser(null);
        fetchData();
      } else {
        showMessage(data.message, true);
      }
    } catch (e: any) {
      showMessage(e.message, true);
    }
  };

  const toggleStatus = async (user: User) => {
    const endpoint = user.status === 'active' ? 'revoke' : 'restore';
    try {
      const res = await fetch(`/api/admin/users/${user.id}/${endpoint}`, {
        method: 'POST', credentials: 'include'
      });
      if (res.ok) {
        showMessage(user.status === 'active' ? `Access revoked for ${user.email}` : `Access restored for ${user.email}`);
        fetchData();
      }
    } catch (e: any) {
      showMessage(e.message, true);
    }
  };

  const deleteUserById = async (userId: number) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE', credentials: 'include'
      });
      if (res.ok) {
        showMessage('User deleted');
        fetchData();
      }
    } catch (e: any) {
      showMessage(e.message, true);
    }
  };

  const revokeInvite = async (invId: number) => {
    try {
      const res = await fetch(`/api/admin/invitations/${invId}/revoke`, {
        method: 'POST', credentials: 'include'
      });
      if (res.ok) {
        showMessage('Invitation revoked');
        fetchData();
      }
    } catch (e: any) {
      showMessage(e.message, true);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showMessage('Link copied to clipboard');
  };

  const togglePage = (pageId: string, pages: string[], setPages: (p: string[]) => void) => {
    setPages(pages.includes(pageId) ? pages.filter(p => p !== pageId) : [...pages, pageId]);
  };

  const cardClass = `rounded-xl border p-5 ${isDark ? 'bg-gray-900/60 border-gray-800' : 'bg-white border-gray-200'}`;
  const inputClass = `w-full px-3 py-2 rounded-lg text-sm border ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`;
  const btnPrimary = `px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors`;
  const btnSecondary = `px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${isDark ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`;

  const PresetSelector: React.FC<{
    value: string;
    onChange: (presetId: string) => void;
    pages: string[];
    onPagesChange: (pages: string[]) => void;
  }> = ({ value, onChange, pages, onPagesChange }) => (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {ACCESS_PRESETS.map(preset => (
          <button
            key={preset.id}
            onClick={() => {
              onChange(preset.id);
              applyPreset(preset.id, onPagesChange);
            }}
            className={`text-left p-3 rounded-lg border text-xs transition-all ${
              value === preset.id
                ? 'border-red-500 bg-red-600/10 ring-1 ring-red-500/30'
                : isDark ? 'border-gray-700 hover:border-gray-600 bg-gray-800/50' : 'border-gray-200 hover:border-gray-300 bg-gray-50'
            }`}
          >
            <div className={`font-semibold mb-0.5 ${value === preset.id ? 'text-red-500' : isDark ? 'text-white' : 'text-gray-900'}`}>
              {preset.label}
            </div>
            <div className={`text-[10px] leading-tight ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              {preset.description}
            </div>
          </button>
        ))}
      </div>

      {value === 'custom' && (
        <div className={`p-3 rounded-lg border ${isDark ? 'border-gray-700 bg-gray-800/30' : 'border-gray-200 bg-gray-50'}`}>
          <p className={`text-xs font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Select pages:</p>
          <div className="space-y-2">
            <div>
              <p className={`text-[10px] uppercase tracking-wider font-semibold mb-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Sections</p>
              <div className="flex flex-wrap gap-1.5">
                {ALL_PAGES.filter(p => p.group === 'sections' || p.group === 'corp').map(page => (
                  <button
                    key={page.id}
                    onClick={() => togglePage(page.id, pages, onPagesChange)}
                    className={`px-2.5 py-1 rounded-md text-xs transition-colors ${
                      pages.includes(page.id)
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
              <p className={`text-[10px] uppercase tracking-wider font-semibold mb-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Revenue Center Modules</p>
              <div className="flex flex-wrap gap-1.5">
                {ALL_PAGES.filter(p => p.group === 'modules').map(page => (
                  <button
                    key={page.id}
                    onClick={() => togglePage(page.id, pages, onPagesChange)}
                    className={`px-2.5 py-1 rounded-md text-xs transition-colors ${
                      pages.includes(page.id)
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
  );

  const getPresetLabel = (user: User) => {
    const presetId = getPresetForUser(user);
    const preset = ACCESS_PRESETS.find(p => p.id === presetId);
    return preset?.label || 'Custom';
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#0a0a0a] text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Shield className="text-red-500" size={24} />
            <div>
              <h1 className="text-2xl font-bold">Access Management</h1>
              <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Manage who can access the portal</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={fetchData} className={btnSecondary}><RefreshCw size={14} /></button>
            <button onClick={onBack} className={btnSecondary}>Back</button>
          </div>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-lg bg-red-900/20 border border-red-800/40 text-red-400 text-sm">{error}</div>
        )}
        {success && (
          <div className="mb-4 px-4 py-3 rounded-lg bg-green-900/20 border border-green-800/40 text-green-400 text-sm">{success}</div>
        )}

        <div className="flex gap-2 mb-6">
          {[
            { id: 'users' as const, icon: Users, label: 'Users' },
            { id: 'requests' as const, icon: Clock, label: 'Requests', badge: accessRequests.filter(r => r.status === 'pending').length },
            { id: 'invite' as const, icon: Mail, label: 'Invite External' },
            { id: 'invitations' as const, icon: Globe, label: 'Invitations' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-red-600 text-white'
                  : isDark ? 'bg-gray-900 text-gray-400 hover:text-white' : 'bg-white text-gray-500 hover:text-gray-900'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
              {'badge' in tab && (tab as any).badge > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500 text-white">{(tab as any).badge}</span>
              )}
            </button>
          ))}
        </div>

        {activeTab === 'requests' && (
          <div className="space-y-2">
            {accessRequests.length === 0 ? (
              <div className={`${cardClass} text-center py-8`}>
                <Clock size={24} className={`mx-auto mb-2 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
                <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>No access requests yet</p>
              </div>
            ) : (
              accessRequests.map((req: any) => (
                <div key={req.id} className={`${cardClass} flex flex-col sm:flex-row sm:items-center gap-3`}>
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {req.picture ? (
                      <img src={req.picture} alt="" className="w-10 h-10 rounded-full flex-shrink-0" />
                    ) : (
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                        <Users size={16} className={isDark ? 'text-gray-500' : 'text-gray-400'} />
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{req.name || req.email}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          req.status === 'pending' ? isDark ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-50 text-amber-600'
                          : req.status === 'approved' ? isDark ? 'bg-green-900/30 text-green-400' : 'bg-green-50 text-green-600'
                          : isDark ? 'bg-red-900/30 text-red-400' : 'bg-red-50 text-red-600'
                        }`}>
                          {req.status.toUpperCase()}
                        </span>
                      </div>
                      <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{req.email}</p>
                      <p className={`text-[10px] ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                        {new Date(req.created_at).toLocaleDateString()} {new Date(req.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  {req.status === 'pending' && (
                    <a
                      href={`#approve/${req.approval_token}`}
                      className={btnPrimary}
                    >
                      Review
                    </a>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className={cardClass}>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <UserPlus size={16} className="text-red-500" />
                Add PV Account
              </h3>
              <div className="flex flex-col sm:flex-row gap-3 mb-3">
                <input
                  type="text"
                  placeholder="email or username (auto-adds @pallacanestrovarese.it)"
                  value={newInternalEmail}
                  onChange={e => setNewInternalEmail(e.target.value)}
                  className={`${inputClass} flex-1`}
                />
                <button onClick={addInternalUser} className={btnPrimary}>Add</button>
              </div>
              <PresetSelector
                value={newInternalPreset}
                onChange={setNewInternalPreset}
                pages={newInternalPages}
                onPagesChange={setNewInternalPages}
              />
            </div>

            {loading ? (
              <div className="text-center py-8"><RefreshCw size={20} className="animate-spin mx-auto text-gray-500" /></div>
            ) : (
              <div className="space-y-2">
                {users.map(user => (
                  <div key={user.id} className={`${cardClass} flex flex-col`}>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm truncate">{user.email}</span>
                          {user.role === 'admin' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-600 text-white">ADMIN</span>
                          )}
                          {user.is_external && (
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>EXTERNAL</span>
                          )}
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            user.status === 'active'
                              ? isDark ? 'bg-green-900/30 text-green-400' : 'bg-green-50 text-green-600'
                              : isDark ? 'bg-red-900/30 text-red-400' : 'bg-red-50 text-red-600'
                          }`}>
                            {user.status.toUpperCase()}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] flex items-center gap-1 ${isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
                            <Zap size={8} />
                            {getPresetLabel(user)}
                          </span>
                        </div>
                        {user.name && user.name !== user.email && (
                          <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{user.name}</p>
                        )}
                        {user.expires_at && (
                          <p className="text-xs text-amber-500 mt-0.5 flex items-center gap-1">
                            <Clock size={10} /> Expires: {new Date(user.expires_at).toLocaleDateString()}
                          </p>
                        )}
                        {user.last_login && (
                          <p className={`text-[10px] mt-0.5 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                            Last login: {new Date(user.last_login).toLocaleDateString()}
                          </p>
                        )}
                      </div>

                      {user.role !== 'admin' && (
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <button
                            onClick={() => {
                              if (editingUser === user.id) { setEditingUser(null); return; }
                              setEditingUser(user.id);
                              setEditPreset(getPresetForUser(user));
                              setEditPages(user.allowed_pages || []);
                              setEditExpiry(user.expires_at ? user.expires_at.split('T')[0] : '');
                            }}
                            className={btnSecondary}
                            title="Edit access"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={() => toggleStatus(user)}
                            className={`${btnSecondary} ${user.status === 'active' ? 'text-red-500' : 'text-green-500'}`}
                            title={user.status === 'active' ? 'Revoke' : 'Restore'}
                          >
                            {user.status === 'active' ? <Ban size={14} /> : <Check size={14} />}
                          </button>
                          <button
                            onClick={() => deleteUserById(user.id)}
                            className={`${btnSecondary} text-red-500`}
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </div>

                    {editingUser === user.id && (
                      <div className={`mt-3 pt-3 border-t ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
                        <div className="flex items-center gap-3 mb-3">
                          <div>
                            <label className={`text-[10px] uppercase tracking-wider font-semibold ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Expiry (optional)</label>
                            <input
                              type="date"
                              value={editExpiry}
                              onChange={e => setEditExpiry(e.target.value)}
                              className={`${inputClass} w-48 mt-1`}
                            />
                          </div>
                          <div className="flex-1" />
                          <button onClick={() => updateAccess(user.id)} className={btnPrimary}>Save</button>
                          <button onClick={() => setEditingUser(null)} className={btnSecondary}>Cancel</button>
                        </div>
                        <PresetSelector
                          value={editPreset}
                          onChange={setEditPreset}
                          pages={editPages}
                          onPagesChange={setEditPages}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'invite' && (
          <div className="space-y-4">
            <div className={cardClass}>
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <Mail size={16} className="text-red-500" />
                Invite External User
              </h3>
              <div className="space-y-4">
                <div>
                  <label className={`text-xs font-medium mb-1 block ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Email Address</label>
                  <input
                    type="email"
                    placeholder="guest@company.com"
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={`text-xs font-medium mb-2 block ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Access Level</label>
                  <PresetSelector
                    value={invitePreset}
                    onChange={setInvitePreset}
                    pages={invitePages}
                    onPagesChange={setInvitePages}
                  />
                </div>

                <div>
                  <label className={`text-xs font-medium mb-1 block ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Duration</label>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" checked={!inviteTemporary} onChange={() => setInviteTemporary(false)} />
                      <span className="text-sm">Permanent</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" checked={inviteTemporary} onChange={() => setInviteTemporary(true)} />
                      <span className="text-sm">Temporary</span>
                    </label>
                  </div>
                </div>

                {inviteTemporary && (
                  <div>
                    <label className={`text-xs font-medium mb-1 block ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Expires On</label>
                    <input type="date" value={inviteExpiry} onChange={e => setInviteExpiry(e.target.value)} className={`${inputClass} w-48`} />
                  </div>
                )}

                <button onClick={sendInvite} className={`${btnPrimary} w-full sm:w-auto`}>
                  Generate Invitation Link
                </button>

                {generatedLink && (
                  <div className={`mt-4 p-4 rounded-lg border ${isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-green-50 border-green-200'}`}>
                    <p className="text-xs font-medium mb-2 text-green-500">Invitation link generated! Send this to the user:</p>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={generatedLink}
                        className={`${inputClass} flex-1 text-xs font-mono`}
                      />
                      <button onClick={() => copyToClipboard(generatedLink)} className={btnSecondary}>
                        <Copy size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'invitations' && (
          <div className="space-y-2">
            {invitations.length === 0 ? (
              <div className={`${cardClass} text-center py-8`}>
                <Mail size={24} className={`mx-auto mb-2 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
                <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>No invitations sent yet</p>
              </div>
            ) : (
              invitations.map(inv => (
                <div key={inv.id} className={`${cardClass} flex flex-col sm:flex-row sm:items-center gap-3`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{inv.email}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        inv.status === 'pending' ? isDark ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-50 text-amber-600'
                        : inv.status === 'accepted' ? isDark ? 'bg-green-900/30 text-green-400' : 'bg-green-50 text-green-600'
                        : isDark ? 'bg-red-900/30 text-red-400' : 'bg-red-50 text-red-600'
                      }`}>
                        {inv.status.toUpperCase()}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] ${isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
                        {inv.access_level === 'full' ? 'Full' : 'Partial'}
                      </span>
                      {inv.is_temporary && (
                        <span className="text-[10px] text-amber-500 flex items-center gap-1"><Clock size={10} /> Temporary</span>
                      )}
                    </div>
                    <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                      Created: {new Date(inv.created_at).toLocaleDateString()}
                      {inv.expires_at && ` · Expires: ${new Date(inv.expires_at).toLocaleDateString()}`}
                    </p>
                    {inv.pages?.length > 0 && inv.access_level === 'partial' && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {inv.pages.map((p: string) => (
                          <span key={p} className={`text-[10px] px-1.5 py-0.5 rounded ${isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>{p}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  {inv.status === 'pending' && (
                    <button onClick={() => revokeInvite(inv.id)} className={`${btnSecondary} text-red-500`}>
                      <Ban size={14} />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
