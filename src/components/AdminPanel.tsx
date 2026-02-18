import React, { useState, useEffect, useCallback } from 'react';
import { Shield, Users, Mail, UserPlus, X, Check, Ban, RefreshCw, Copy, Trash2, Eye, EyeOff, ChevronDown, Clock, Globe, Building } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';

const ALL_PAGES = [
  { id: 'hub', label: 'Internal Hub' },
  { id: 'revenue', label: 'Revenue Center' },
  { id: 'cost', label: 'Cost Center' },
  { id: 'pnl', label: 'Verticals P&L' },
  { id: 'home', label: 'Executive Overview' },
  { id: 'ticketing', label: 'Ticketing' },
  { id: 'gameday', label: 'GameDay' },
  { id: 'sponsorship', label: 'Sponsorship' },
  { id: 'merchandising', label: 'Merchandising' },
  { id: 'venue_ops', label: 'Venue Ops' },
  { id: 'bops', label: 'BOps' },
  { id: 'sg', label: 'Varese Basketball' },
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

export const AdminPanel: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const isDark = theme === 'dark';

  const [activeTab, setActiveTab] = useState<'users' | 'invite' | 'invitations'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [newInternalEmail, setNewInternalEmail] = useState('');
  const [newInternalAccess, setNewInternalAccess] = useState('full');
  const [newInternalPages, setNewInternalPages] = useState<string[]>([]);

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteAccess, setInviteAccess] = useState('partial');
  const [invitePages, setInvitePages] = useState<string[]>(ALL_PAGES.map(p => p.id));
  const [inviteTemporary, setInviteTemporary] = useState(false);
  const [inviteExpiry, setInviteExpiry] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');

  const [editingUser, setEditingUser] = useState<number | null>(null);
  const [editAccess, setEditAccess] = useState('full');
  const [editPages, setEditPages] = useState<string[]>([]);
  const [editExpiry, setEditExpiry] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, invRes] = await Promise.all([
        fetch('/api/admin/users', { credentials: 'include' }),
        fetch('/api/admin/invitations', { credentials: 'include' })
      ]);
      if (usersRes.ok) {
        const data = await usersRes.json();
        setUsers(data.users || []);
      }
      if (invRes.ok) {
        const data = await invRes.json();
        setInvitations(data.invitations || []);
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
    try {
      const res = await fetch('/api/admin/users/internal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, accessLevel: newInternalAccess, pages: newInternalPages })
      });
      const data = await res.json();
      if (data.success) {
        showMessage(`Access granted to ${email}`);
        setNewInternalEmail('');
        setNewInternalPages([]);
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
    try {
      const res = await fetch('/api/admin/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: inviteEmail,
          accessLevel: inviteAccess,
          pages: invitePages,
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
    try {
      const res = await fetch(`/api/admin/users/${userId}/access`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ accessLevel: editAccess, pages: editPages, expiresAt: editExpiry || null })
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

  const PageCheckboxes: React.FC<{ selected: string[], onChange: (pages: string[]) => void }> = ({ selected, onChange }) => (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
      {ALL_PAGES.map(page => (
        <label key={page.id} className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-xs ${
          isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-50'
        }`}>
          <input
            type="checkbox"
            checked={selected.includes(page.id)}
            onChange={() => togglePage(page.id, selected, onChange)}
            className="rounded"
          />
          <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>{page.label}</span>
        </label>
      ))}
    </div>
  );

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
            </button>
          ))}
        </div>

        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className={cardClass}>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <UserPlus size={16} className="text-red-500" />
                Add Internal Member
              </h3>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  placeholder="email or username (auto-adds @pallacanestrovarese.it)"
                  value={newInternalEmail}
                  onChange={e => setNewInternalEmail(e.target.value)}
                  className={`${inputClass} flex-1`}
                />
                <select value={newInternalAccess} onChange={e => setNewInternalAccess(e.target.value)} className={`${inputClass} w-40`}>
                  <option value="full">Full Access</option>
                  <option value="partial">Partial Access</option>
                </select>
                <button onClick={addInternalUser} className={btnPrimary}>Add</button>
              </div>
              {newInternalAccess === 'partial' && (
                <PageCheckboxes selected={newInternalPages} onChange={setNewInternalPages} />
              )}
            </div>

            {loading ? (
              <div className="text-center py-8"><RefreshCw size={20} className="animate-spin mx-auto text-gray-500" /></div>
            ) : (
              <div className="space-y-2">
                {users.map(user => (
                  <div key={user.id} className={`${cardClass} flex flex-col sm:flex-row sm:items-center gap-3`}>
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
                        <span className={`px-2 py-0.5 rounded-full text-[10px] ${isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
                          {user.access_level === 'full' ? 'Full Access' : 'Partial'}
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
                      {user.access_level === 'partial' && user.allowed_pages?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {user.allowed_pages.map((p: string) => (
                            <span key={p} className={`text-[10px] px-1.5 py-0.5 rounded ${isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>{p}</span>
                          ))}
                        </div>
                      )}
                    </div>

                    {user.role !== 'admin' && (
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          onClick={() => {
                            if (editingUser === user.id) { setEditingUser(null); return; }
                            setEditingUser(user.id);
                            setEditAccess(user.access_level);
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

                    {editingUser === user.id && (
                      <div className={`w-full mt-3 pt-3 border-t ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
                        <div className="flex flex-col sm:flex-row gap-3 mb-3">
                          <select value={editAccess} onChange={e => setEditAccess(e.target.value)} className={`${inputClass} w-40`}>
                            <option value="full">Full Access</option>
                            <option value="partial">Partial Access</option>
                          </select>
                          <input
                            type="date"
                            placeholder="Expiry date (optional)"
                            value={editExpiry}
                            onChange={e => setEditExpiry(e.target.value)}
                            className={`${inputClass} w-48`}
                          />
                          <button onClick={() => updateAccess(user.id)} className={btnPrimary}>Save</button>
                          <button onClick={() => setEditingUser(null)} className={btnSecondary}>Cancel</button>
                        </div>
                        {editAccess === 'partial' && (
                          <PageCheckboxes selected={editPages} onChange={setEditPages} />
                        )}
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={`text-xs font-medium mb-1 block ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Access Level</label>
                    <select value={inviteAccess} onChange={e => setInviteAccess(e.target.value)} className={inputClass}>
                      <option value="full">Full Access</option>
                      <option value="partial">Partial Access</option>
                    </select>
                  </div>
                  <div>
                    <label className={`text-xs font-medium mb-1 block ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Duration</label>
                    <div className="flex items-center gap-3">
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
                </div>

                {inviteTemporary && (
                  <div>
                    <label className={`text-xs font-medium mb-1 block ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Expires On</label>
                    <input type="date" value={inviteExpiry} onChange={e => setInviteExpiry(e.target.value)} className={`${inputClass} w-48`} />
                  </div>
                )}

                {inviteAccess === 'partial' && (
                  <div>
                    <label className={`text-xs font-medium mb-1 block ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Allowed Pages</label>
                    <PageCheckboxes selected={invitePages} onChange={setInvitePages} />
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
