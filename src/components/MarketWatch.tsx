import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, Sun, Moon, TrendingUp, DollarSign, Users, Award, Search, ChevronDown, ArrowUpDown, Shield, Eye, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, Cell, Legend, LineChart, Line, ComposedChart, ReferenceLine } from 'recharts';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { PV_LOGO_URL } from '../constants';
import type { MarketPlayer } from '../services/bigQueryService';

type SortKey = 'yearly_salary_norm' | 'ws' | 'ws_40' | 'ws_per_million' | 'net_paid' | 'min_play' | 'player' | 'team_name';
type Tab = 'overview' | 'teams' | 'players' | 'efficiency' | 'varese';

const fmt = (n: number) => {
  if (n >= 1000000) return `€${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `€${(n / 1000).toFixed(0)}K`;
  return `€${n}`;
};

const fmtFull = (n: number) => `€${n.toLocaleString('en-US')}`;

export const MarketWatch: React.FC<{ onBack: () => void; onHome: () => void }> = ({ onBack, onHome }) => {
  const { theme, toggleTheme } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();
  const isDark = theme === 'dark';

  const [data, setData] = useState<MarketPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSeason, setSelectedSeason] = useState('2025-26');
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('yearly_salary_norm');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [selectedTeam, setSelectedTeam] = useState<string>('all');
  const [wsRank, setWsRank] = useState<number>(1);

  useEffect(() => {
    fetch('/api/market')
      .then(r => r.json())
      .then(d => { if (d.success) setData(d.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const seasons = useMemo(() => [...new Set(data.map(d => d.season))].sort().reverse(), [data]);

  useEffect(() => {
    if (seasons.length > 0 && !seasons.includes(selectedSeason)) {
      setSelectedSeason(seasons[0]);
    }
  }, [seasons]);
  const seasonData = useMemo(() => data.filter(d => d.season === selectedSeason && !(d.season === '2025-26' && d.team_name === 'Trapani Shark')), [data, selectedSeason]);
  const teams = useMemo(() => [...new Set(seasonData.map(d => d.team_name))].sort(), [seasonData]);

  const teamStats = useMemo(() => {
    const map = new Map<string, { team: string; players: MarketPlayer[]; payroll: number; netPaid: number; ws: number; avgWs40: number; avgSalary: number; rosterSize: number; itaCount: number; visaCount: number; youthCount: number }>();
    seasonData.forEach(p => {
      if (!map.has(p.team_name)) map.set(p.team_name, { team: p.team_name, players: [], payroll: 0, netPaid: 0, ws: 0, avgWs40: 0, avgSalary: 0, rosterSize: 0, itaCount: 0, visaCount: 0, youthCount: 0 });
      const t = map.get(p.team_name)!;
      t.players.push(p);
      t.payroll += p.yearly_salary_norm;
      t.netPaid += p.net_paid;
      t.ws += p.ws;
      t.rosterSize++;
      if (p.ita) t.itaCount++;
      if (p.visa) t.visaCount++;
      if (p.youth) t.youthCount++;
    });
    map.forEach(t => {
      t.avgSalary = t.rosterSize > 0 ? t.payroll / t.rosterSize : 0;
      const ws40Players = t.players.filter(p => p.ws_40 !== null && p.ws_40 !== undefined);
      t.avgWs40 = ws40Players.length > 0 ? ws40Players.reduce((s, p) => s + (p.ws_40 || 0), 0) / ws40Players.length : 0;
    });
    return [...map.values()].sort((a, b) => b.payroll - a.payroll);
  }, [seasonData]);

  const varese = useMemo(() => teamStats.find(t => t.team.includes('Varese')), [teamStats]);
  const vareseRank = useMemo(() => teamStats.findIndex(t => t.team.includes('Varese')) + 1, [teamStats]);

  const leagueAvg = useMemo(() => {
    const paid = seasonData.filter(p => p.yearly_salary_norm > 0);
    const totalWs = seasonData.filter(p => p.ws > 0).reduce((s, p) => s + p.ws, 0);
    const totalNetPaid = paid.reduce((s, p) => s + p.net_paid, 0);
    const highestPaid = paid.length > 0 ? paid.reduce((max, p) => p.yearly_salary_norm > max.yearly_salary_norm ? p : max, paid[0]) : null;
    return {
      avgSalary: paid.length > 0 ? paid.reduce((s, p) => s + p.yearly_salary_norm, 0) / paid.length : 0,
      medianSalary: (() => { const sorted = paid.map(p => p.yearly_salary_norm).sort((a, b) => a - b); return sorted.length > 0 ? sorted[Math.floor(sorted.length / 2)] : 0; })(),
      avgWs40: (() => { const ws40s = paid.filter(p => p.ws_40 !== null); return ws40s.length > 0 ? ws40s.reduce((s, p) => s + (p.ws_40 || 0), 0) / ws40s.length : 0; })(),
      totalPayroll: paid.reduce((s, p) => s + p.yearly_salary_norm, 0),
      teamCount: teams.length,
      highestPaid,
      costPerWs: totalWs > 0 ? totalNetPaid / totalWs : 0,
    };
  }, [seasonData, teams]);

  const payrollTrend = useMemo(() => {
    return seasons.map(s => {
      const sd = data.filter(d => d.season === s && !(d.season === '2025-26' && d.team_name === 'Trapani Shark'));
      const teamMap = new Map<string, number>();
      sd.forEach(p => teamMap.set(p.team_name, (teamMap.get(p.team_name) || 0) + p.net_paid));
      const payrolls = [...teamMap.values()];
      const avg = payrolls.length > 0 ? payrolls.reduce((a, b) => a + b, 0) / payrolls.length : 0;
      const vareseNetPaid = sd.filter(p => p.team_name.includes('Varese')).reduce((s, p) => s + p.net_paid, 0);
      return { season: s, avg: Math.round(avg), varese: vareseNetPaid };
    }).reverse();
  }, [data, seasons]);

  const card = isDark ? 'bg-gray-900/60 border border-gray-800 rounded-xl' : 'bg-white border border-gray-200 rounded-xl shadow-sm';
  const subtext = isDark ? 'text-gray-500' : 'text-gray-400';
  const selectClass = `text-xs rounded-lg px-3 py-2 appearance-none pr-7 ${isDark ? 'bg-gray-800 text-gray-300 border-gray-700' : 'bg-white text-gray-700 border-gray-200'} border`;

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'overview', label: t('Overview'), icon: BarChart3 },
    { id: 'teams', label: t('Teams'), icon: Shield },
    { id: 'players', label: t('Players'), icon: Users },
    { id: 'efficiency', label: t('Value Map'), icon: TrendingUp },
    { id: 'varese', label: 'Varese', icon: Eye },
  ];

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const filteredPlayers = useMemo(() => {
    let p = seasonData.filter(p => p.yearly_salary_norm > 0 || p.min_play > 0);
    if (selectedTeam !== 'all') p = p.filter(pp => pp.team_name === selectedTeam);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      p = p.filter(pp => pp.player.toLowerCase().includes(q) || pp.team_name.toLowerCase().includes(q) || (pp.nationality || '').toLowerCase().includes(q));
    }
    const enriched = p.map(pp => ({ ...pp, ws_per_million: pp.yearly_salary_norm > 0 ? pp.ws / (pp.yearly_salary_norm / 1000000) : 0 }));
    enriched.sort((a, b) => {
      const aVal = sortKey === 'ws_per_million' ? a.ws_per_million : (a as any)[sortKey];
      const bVal = sortKey === 'ws_per_million' ? b.ws_per_million : (b as any)[sortKey];
      if (typeof aVal === 'string') return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      return sortDir === 'asc' ? (aVal || 0) - (bVal || 0) : (bVal || 0) - (aVal || 0);
    });
    return enriched;
  }, [seasonData, selectedTeam, searchQuery, sortKey, sortDir]);

  const tipStyle = { borderRadius: 8, fontSize: 11, backgroundColor: isDark ? '#1f2937' : '#fff', border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`, color: isDark ? '#f3f4f6' : '#111827' };

  const VARESE_COLOR = '#E30613';
  const shortName = (name: string) => {
    const map: Record<string, string> = {
      'EA7 Emporio Armani Milano': 'Milano',
      'Virtus Segafredo Bologna': 'Bologna',
      'Umana Reyer Venezia': 'Venezia',
      'Openjobmetis Varese': 'Varese',
      'Germani Brescia': 'Brescia',
      'Bertram Derthona Tortona': 'Tortona',
      'Nutribullet Treviso Basket': 'Treviso',
      'Banco di Sardegna Sassari': 'Sassari',
      'Dolomiti Energia Trentino': 'Trentino',
      'Pallacanestro Trieste': 'Trieste',
      'Vanoli Basket Cremona': 'Cremona',
      'Acqua San Bernardo Cantu': 'Cantù',
      'Old Wild West Udine': 'Udine',
      'UNAHOTELS Reggio Emilia': 'Reggio Emilia',
      'Trapani Shark': 'Trapani',
      'Napoli Basket': 'Napoli',
    };
    return map[name] || name;
  };
  const teamPayrollChart = useMemo(() => teamStats.map(t => ({
    team: shortName(t.team),
    netPaid: t.netPaid,
    isVarese: t.team.includes('Varese'),
  })).sort((a, b) => b.netPaid - a.netPaid), [teamStats]);

  const scatterData = useMemo(() => {
    return teamStats.map(t => ({
      team: shortName(t.team),
      netPaid: t.netPaid,
      ws: t.ws,
      isVarese: t.team.includes('Varese'),
    }));
  }, [teamStats]);

  const regression = useMemo(() => {
    const pts = scatterData.filter(d => d.netPaid > 0 && d.ws > 0);
    if (pts.length < 2) return null;
    const n = pts.length;
    const sumX = pts.reduce((s, p) => s + p.netPaid, 0);
    const sumY = pts.reduce((s, p) => s + p.ws, 0);
    const sumXY = pts.reduce((s, p) => s + p.netPaid * p.ws, 0);
    const sumX2 = pts.reduce((s, p) => s + p.netPaid * p.netPaid, 0);
    const sumY2 = pts.reduce((s, p) => s + p.ws * p.ws, 0);
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    const rNum = n * sumXY - sumX * sumY;
    const rDen = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    const r2 = rDen > 0 ? (rNum / rDen) ** 2 : 0;
    const minX = Math.min(...pts.map(p => p.netPaid));
    const maxX = Math.max(...pts.map(p => p.netPaid));
    return { slope, intercept, r2, line: [{ netPaid: minX, ws: slope * minX + intercept }, { netPaid: maxX, ws: slope * maxX + intercept }] };
  }, [scatterData]);

  const maxWsRank = useMemo(() => {
    const ranks = seasonData.map(p => p.tm_ws_rk).filter(r => r > 0);
    return ranks.length > 0 ? Math.max(...ranks) : 10;
  }, [seasonData]);

  const wsRankChart = useMemo(() => {
    const playersAtRank = seasonData.filter(p => p.tm_ws_rk === wsRank && p.net_paid > 0);
    return playersAtRank
      .map(p => ({
        label: `${p.player} (${shortName(p.team_name)})`,
        netPaid: p.net_paid,
        ws: p.ws,
        ws40: p.ws_40,
        isVarese: p.team_name.includes('Varese'),
      }))
      .sort((a, b) => b.netPaid - a.netPaid);
  }, [seasonData, wsRank]);

  const wsRankAvgNetPaid = useMemo(() => {
    if (wsRankChart.length === 0) return 0;
    return wsRankChart.reduce((s, p) => s + p.netPaid, 0) / wsRankChart.length;
  }, [wsRankChart]);

  if (loading) {
    return (
      <div className={`fixed inset-0 flex items-center justify-center ${isDark ? 'bg-gray-950' : 'bg-gray-50'}`}>
        <div className="text-center">
          <div className={`w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-3 ${isDark ? 'border-emerald-500' : 'border-emerald-600'}`}></div>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('Loading market data...')}</p>
        </div>
      </div>
    );
  }

  const StatCard = ({ label, value, sub, color = 'emerald' }: { label: string; value: string | number; sub?: string; color?: string }) => {
    const colorClass = { emerald: 'text-emerald-500', blue: 'text-blue-500', orange: 'text-orange-500', purple: 'text-purple-500', red: 'text-red-500', sky: 'text-sky-500' }[color] || 'text-emerald-500';
    return (
      <div className={`${card} p-4`}>
        <p className={`text-[10px] uppercase tracking-wider font-medium mb-1 ${subtext}`}>{label}</p>
        <p className={`text-xl font-bold tabular-nums ${colorClass}`}>{value}</p>
        {sub && <p className={`text-[10px] mt-0.5 ${subtext}`}>{sub}</p>}
      </div>
    );
  };

  const SortHeader = ({ label, sortId, className = '' }: { label: string; sortId: SortKey; className?: string }) => (
    <th className={`py-2 px-2 text-left font-semibold cursor-pointer select-none whitespace-nowrap ${subtext} ${className}`} onClick={() => handleSort(sortId)}>
      <span className="inline-flex items-center gap-1">{label} {sortKey === sortId && <ArrowUpDown size={10} className={sortDir === 'asc' ? 'rotate-180' : ''} />}</span>
    </th>
  );

  const renderOverview = () => (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label={t('Teams')} value={teams.length} color="blue" />
        <StatCard label={t('Players')} value={seasonData.length} color="emerald" />
        <StatCard label={t('Avg Salary')} value={fmt(leagueAvg.avgSalary)} sub={`Median: ${fmt(leagueAvg.medianSalary)}`} color="orange" />
        <StatCard label={t('Highest Salary')} value={leagueAvg.highestPaid ? fmt(leagueAvg.highestPaid.yearly_salary_norm) : '—'} sub={leagueAvg.highestPaid ? `${leagueAvg.highestPaid.player}` : ''} color="red" />
        <StatCard label={t('Cost per WS')} value={fmt(leagueAvg.costPerWs)} sub={t('Net Paid / WS')} color="sky" />
        <StatCard label={t('Avg WS/40')} value={leagueAvg.avgWs40.toFixed(3)} sub={t('League average')} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className={`${card} p-4`}>
          <h3 className={`text-xs font-semibold mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{t('Team Net Paid')} — {selectedSeason}</h3>
          <div style={{ height: Math.max(350, teamPayrollChart.length * 28) }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={teamPayrollChart} layout="vertical" margin={{ left: 5, right: 10, top: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} />
                <XAxis type="number" tick={{ fontSize: 9, fill: isDark ? '#9ca3af' : '#6b7280' }} tickFormatter={(v: number) => fmt(v)} />
                <YAxis type="category" dataKey="team" tick={{ fontSize: 9, fill: isDark ? '#9ca3af' : '#6b7280' }} width={120} interval={0} />
                <Tooltip contentStyle={tipStyle} formatter={(v: number) => fmtFull(v)} />
                <Bar dataKey="netPaid" name={t('Net Paid')} radius={[0, 4, 4, 0]}>
                  {teamPayrollChart.map((e, i) => (
                    <Cell key={i} fill={e.isVarese ? VARESE_COLOR : (isDark ? '#10b981' : '#059669')} opacity={e.isVarese ? 1 : 0.7} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={`${card} p-4`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className={`text-xs font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{t('Salary by WS Team Rank')} — {selectedSeason}</h3>
            <div className="relative">
              <select value={wsRank} onChange={e => setWsRank(Number(e.target.value))} className={selectClass}>
                {Array.from({ length: maxWsRank }, (_, i) => i + 1).map(r => (
                  <option key={r} value={r}>WS Rk #{r}</option>
                ))}
              </select>
              <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
            </div>
          </div>
          <div style={{ height: Math.max(380, wsRankChart.length * 32) }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={wsRankChart} layout="vertical" margin={{ left: 5, right: 10, top: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} horizontal={false} />
                <XAxis xAxisId="paid" type="number" tick={{ fontSize: 9, fill: isDark ? '#9ca3af' : '#6b7280' }} tickFormatter={(v: number) => fmt(v)} orientation="bottom" />
                <XAxis xAxisId="ws" type="number" tick={{ fontSize: 9, fill: isDark ? '#60a5fa' : '#3b82f6' }} orientation="top" hide />
                <YAxis type="category" dataKey="label" tick={{ fontSize: 8, fill: isDark ? '#9ca3af' : '#6b7280' }} width={140} interval={0} />
                <Tooltip content={({ payload }) => {
                  if (!payload || !payload.length) return null;
                  const d = payload[0]?.payload;
                  if (!d) return null;
                  return (
                    <div style={tipStyle as any} className="p-2">
                      <p className="font-semibold text-xs mb-1">{d.label}</p>
                      <p className="text-[10px]">Net Paid: {fmtFull(d.netPaid)}</p>
                      <p className="text-[10px]">WS: {d.ws.toFixed(2)}</p>
                      {d.ws40 !== null && <p className="text-[10px]">WS/40: {d.ws40.toFixed(3)}</p>}
                      {d.netPaid > 0 && <p className="text-[10px]">WS/€M: {(d.ws / (d.netPaid / 1000000)).toFixed(1)}</p>}
                    </div>
                  );
                }} />
                <ReferenceLine xAxisId="paid" x={wsRankAvgNetPaid} stroke={isDark ? '#f59e0b' : '#d97706'} strokeDasharray="4 4" strokeWidth={1.5} label={{ value: `Avg ${fmt(wsRankAvgNetPaid)}`, position: 'top', fill: isDark ? '#f59e0b' : '#d97706', fontSize: 9 }} />
                <Bar xAxisId="paid" dataKey="netPaid" name={t('Net Paid')} radius={[0, 4, 4, 0]} barSize={14}>
                  {wsRankChart.map((e, i) => (
                    <Cell key={i} fill={e.isVarese ? VARESE_COLOR : (isDark ? '#6366f1' : '#4f46e5')} opacity={e.isVarese ? 1 : 0.7} />
                  ))}
                </Bar>
                <Scatter xAxisId="ws" dataKey="ws" name="WS" fill={isDark ? '#34d399' : '#059669'} shape="diamond" legendType="diamond">
                  {wsRankChart.map((e, i) => (
                    <Cell key={i} fill={e.isVarese ? VARESE_COLOR : (isDark ? '#34d399' : '#059669')} r={5} />
                  ))}
                </Scatter>
                <Legend wrapperStyle={{ fontSize: 10 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className={`${card} p-4`}>
          <h3 className={`text-xs font-semibold mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            {t('Net Paid vs Win Shares')}
            {regression && <span className={`ml-2 font-normal ${subtext}`}>R² = {regression.r2.toFixed(3)}</span>}
          </h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} />
                <XAxis type="number" dataKey="netPaid" tick={{ fontSize: 9, fill: isDark ? '#9ca3af' : '#6b7280' }} tickFormatter={(v: number) => fmt(v)} name="Net Paid" />
                <YAxis type="number" dataKey="ws" tick={{ fontSize: 9, fill: isDark ? '#9ca3af' : '#6b7280' }} name="Win Shares" />
                <Tooltip content={({ payload }) => {
                  if (!payload || !payload.length) return null;
                  const d = payload[0]?.payload;
                  if (!d || d.isRegLine) return null;
                  return (
                    <div style={tipStyle as any} className="p-2">
                      <p className="font-semibold text-xs">{d.team}</p>
                      <p className="text-[10px]">Net Paid: {fmtFull(d.netPaid)}</p>
                      <p className="text-[10px]">Win Shares: {d.ws.toFixed(2)}</p>
                      {d.netPaid > 0 && <p className="text-[10px]">WS/€M (Net): {(d.ws / (d.netPaid / 1000000)).toFixed(1)}</p>}
                    </div>
                  );
                }} />
                <Scatter data={scatterData} name={t('Teams')}>
                  {scatterData.map((e, i) => (
                    <Cell key={i} fill={e.isVarese ? VARESE_COLOR : (isDark ? '#3b82f6' : '#2563eb')} r={e.isVarese ? 8 : 5} />
                  ))}
                </Scatter>
                {regression && (
                  <Scatter data={regression.line.map(p => ({ ...p, isRegLine: true }))} name={t('Regression')} line={{ stroke: isDark ? '#f59e0b' : '#d97706', strokeWidth: 2, strokeDasharray: '6 3' }} fill="transparent" legendType="line">
                    {regression.line.map((_, i) => <Cell key={i} fill="transparent" r={0} />)}
                  </Scatter>
                )}
                <Legend wrapperStyle={{ fontSize: 10 }} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={`${card} p-4`}>
          <h3 className={`text-xs font-semibold mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{t('Net Paid Trend')}</h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={payrollTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} />
                <XAxis dataKey="season" tick={{ fontSize: 9, fill: isDark ? '#9ca3af' : '#6b7280' }} />
                <YAxis tick={{ fontSize: 9, fill: isDark ? '#9ca3af' : '#6b7280' }} tickFormatter={(v: number) => fmt(v)} />
                <Tooltip contentStyle={tipStyle} formatter={(v: number) => fmtFull(v)} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Line type="monotone" dataKey="avg" name={t('League Avg')} stroke={isDark ? '#6366f1' : '#4f46e5'} strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="varese" name="Varese" stroke={VARESE_COLOR} strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTeams = () => (
    <div className={`${card} p-4 overflow-x-auto`}>
      <table className="w-full text-xs">
        <thead>
          <tr className={`border-b ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
            <th className={`py-2 px-2 text-left font-semibold ${subtext}`}>#</th>
            <th className={`py-2 px-2 text-left font-semibold ${subtext}`}>{t('Team')}</th>
            <th className={`py-2 px-2 text-right font-semibold ${subtext}`}>{t('Roster')}</th>
            <th className={`py-2 px-2 text-right font-semibold ${subtext}`}>{t('Payroll')}</th>
            <th className={`py-2 px-2 text-right font-semibold ${subtext}`}>{t('Net Paid')}</th>
            <th className={`py-2 px-2 text-right font-semibold ${subtext}`}>{t('Avg Salary')}</th>
            <th className={`py-2 px-2 text-right font-semibold ${subtext}`}>WS</th>
            <th className={`py-2 px-2 text-right font-semibold ${subtext}`}>WS/40</th>
            <th className={`py-2 px-2 text-right font-semibold ${subtext}`}>WS/€M</th>
            <th className={`py-2 px-2 text-right font-semibold ${subtext}`}>ITA</th>
            <th className={`py-2 px-2 text-right font-semibold ${subtext}`}>{t('Visa')}</th>
            <th className={`py-2 px-2 text-right font-semibold ${subtext}`}>{t('Youth')}</th>
          </tr>
        </thead>
        <tbody>
          {teamStats.map((t, i) => {
            const isV = t.team.includes('Varese');
            const rowBg = isV ? (isDark ? 'bg-red-950/20' : 'bg-red-50/50') : '';
            const wsPerMillion = t.payroll > 0 ? (t.ws / (t.payroll / 1000000)).toFixed(1) : '—';
            return (
              <tr key={t.team} className={`border-b ${isDark ? 'border-gray-800/50' : 'border-gray-100'} ${rowBg}`}>
                <td className={`py-2 px-2 ${subtext}`}>{i + 1}</td>
                <td className={`py-2 px-2 font-medium whitespace-nowrap ${isV ? 'text-red-500 font-bold' : isDark ? 'text-gray-200' : 'text-gray-800'}`}>{t.team}</td>
                <td className={`py-2 px-2 text-right ${subtext}`}>{t.rosterSize}</td>
                <td className={`py-2 px-2 text-right font-semibold tabular-nums ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>{fmt(t.payroll)}</td>
                <td className={`py-2 px-2 text-right tabular-nums ${subtext}`}>{fmt(t.netPaid)}</td>
                <td className={`py-2 px-2 text-right tabular-nums ${subtext}`}>{fmt(t.avgSalary)}</td>
                <td className={`py-2 px-2 text-right tabular-nums ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>{t.ws.toFixed(1)}</td>
                <td className={`py-2 px-2 text-right tabular-nums ${subtext}`}>{t.avgWs40.toFixed(3)}</td>
                <td className={`py-2 px-2 text-right tabular-nums font-semibold ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>{wsPerMillion}</td>
                <td className={`py-2 px-2 text-right ${subtext}`}>{t.itaCount}</td>
                <td className={`py-2 px-2 text-right ${subtext}`}>{t.visaCount}</td>
                <td className={`py-2 px-2 text-right ${subtext}`}>{t.youthCount}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  const renderPlayers = () => (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${subtext}`} />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={t('Search player, team, nationality...')}
            className={`w-full pl-9 pr-3 py-2 text-xs rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-white border-gray-200 text-gray-700'}`}
          />
        </div>
        <div className="relative">
          <select value={selectedTeam} onChange={e => setSelectedTeam(e.target.value)} className={selectClass}>
            <option value="all">{t('All Teams')}</option>
            {teams.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
        </div>
      </div>
      <div className={`${card} p-4 overflow-x-auto`}>
        <p className={`text-[10px] mb-2 ${subtext}`}>{filteredPlayers.length} {t('players')}</p>
        <table className="w-full text-xs">
          <thead>
            <tr className={`border-b ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
              <SortHeader label={t('Player')} sortId="player" />
              <SortHeader label={t('Team')} sortId="team_name" />
              <SortHeader label={t('Salary')} sortId="yearly_salary_norm" />
              <SortHeader label={t('Net Paid')} sortId="net_paid" />
              <SortHeader label={t('MIN')} sortId="min_play" />
              <SortHeader label="WS" sortId="ws" />
              <SortHeader label="WS/40" sortId="ws_40" />
              <SortHeader label="WS/€M" sortId="ws_per_million" />
              <th className={`py-2 px-2 text-left font-semibold ${subtext}`}>{t('NAT')}</th>
              <th className={`py-2 px-2 text-left font-semibold ${subtext}`}>{t('Status')}</th>
            </tr>
          </thead>
          <tbody>
            {filteredPlayers.slice(0, 100).map((p, i) => {
              const isV = p.team_name.includes('Varese');
              return (
                <tr key={`${p.player_id}-${i}`} className={`border-b ${isDark ? 'border-gray-800/50' : 'border-gray-100'} ${isV ? (isDark ? 'bg-red-950/20' : 'bg-red-50/30') : ''}`}>
                  <td className={`py-1.5 px-2 font-medium whitespace-nowrap ${isV ? 'text-red-500' : isDark ? 'text-gray-200' : 'text-gray-800'}`}>{p.player}</td>
                  <td className={`py-1.5 px-2 whitespace-nowrap ${subtext}`}>{shortName(p.team_name)}</td>
                  <td className={`py-1.5 px-2 text-right tabular-nums font-semibold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>{fmt(p.yearly_salary_norm)}</td>
                  <td className={`py-1.5 px-2 text-right tabular-nums ${subtext}`}>{fmt(p.net_paid)}</td>
                  <td className={`py-1.5 px-2 text-right tabular-nums ${subtext}`}>{p.min_play}</td>
                  <td className={`py-1.5 px-2 text-right tabular-nums ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>{p.ws.toFixed(2)}</td>
                  <td className={`py-1.5 px-2 text-right tabular-nums ${subtext}`}>{p.ws_40 !== null ? p.ws_40.toFixed(3) : '—'}</td>
                  <td className={`py-1.5 px-2 text-right tabular-nums font-semibold ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>{p.ws_per_million > 0 ? p.ws_per_million.toFixed(1) : '—'}</td>
                  <td className={`py-1.5 px-2 ${subtext}`}>{p.nationality || '—'}</td>
                  <td className={`py-1.5 px-2 whitespace-nowrap ${subtext}`}>
                    {p.situation ? <span className={`text-[9px] px-1.5 py-0.5 rounded ${p.situation.includes('Cut') || p.situation.includes('Buyout') || p.situation.includes('Released') ? 'bg-red-500/10 text-red-400' : p.situation.includes('Mid-season') ? 'bg-blue-500/10 text-blue-400' : p.situation.includes('Youth') ? 'bg-purple-500/10 text-purple-400' : 'bg-gray-500/10 text-gray-400'}`}>{p.situation}</span> : ''}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderEfficiency = () => {
    const effData = seasonData
      .filter(p => p.net_paid > 0 && p.ws > 0 && p.min_play > 50)
      .map(p => ({
        player: p.player,
        team: shortName(p.team_name),
        netPaid: p.net_paid,
        salary: p.yearly_salary_norm,
        ws: p.ws,
        ws40: p.ws_40 || 0,
        costPerWs: p.net_paid / p.ws,
        isVarese: p.team_name.includes('Varese'),
        min_play: p.min_play,
      }));

    const bestValue = [...effData].sort((a, b) => a.costPerWs - b.costPerWs).slice(0, 15);
    const worstValue = [...effData].sort((a, b) => b.costPerWs - a.costPerWs).slice(0, 15);

    return (
      <div className="space-y-5">
        <div className={`${card} p-4`}>
          <h3 className={`text-xs font-semibold mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{t('Net Paid vs Performance')} <span className={`font-normal ${subtext}`}>({t('min 50 min played')})</span></h3>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} />
                <XAxis type="number" dataKey="netPaid" tick={{ fontSize: 9, fill: isDark ? '#9ca3af' : '#6b7280' }} tickFormatter={(v: number) => fmt(v)} name="Net Paid" />
                <YAxis type="number" dataKey="ws" tick={{ fontSize: 9, fill: isDark ? '#9ca3af' : '#6b7280' }} name="Win Shares" />
                <Tooltip content={({ payload }) => {
                  if (!payload || !payload.length) return null;
                  const d = payload[0]?.payload;
                  return d ? (
                    <div style={tipStyle as any} className="p-2">
                      <p className="font-semibold text-xs">{d.player} <span className="font-normal text-gray-400">({d.team})</span></p>
                      <p className="text-[10px]">Net Paid: {fmtFull(d.netPaid)}</p>
                      <p className="text-[10px]">WS: {d.ws.toFixed(2)} | WS/40: {d.ws40.toFixed(3)}</p>
                      <p className="text-[10px]">Cost/WS: {fmt(d.costPerWs)} | MIN: {d.min_play}</p>
                    </div>
                  ) : null;
                }} />
                <Scatter data={effData}>
                  {effData.map((e, i) => (
                    <Cell key={i} fill={e.isVarese ? VARESE_COLOR : (isDark ? '#6366f1' : '#4f46e5')} r={e.isVarese ? 6 : 3} opacity={e.isVarese ? 1 : 0.6} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className={`${card} p-4`}>
            <h3 className={`text-xs font-semibold mb-3 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>{t('Best Value')} — {t('Cost/WS')}</h3>
            <table className="w-full text-xs">
              <thead>
                <tr className={`border-b ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
                  <th className={`py-1.5 px-2 text-left ${subtext}`}>#</th>
                  <th className={`py-1.5 px-2 text-left ${subtext}`}>{t('Player')}</th>
                  <th className={`py-1.5 px-2 text-left ${subtext}`}>{t('Team')}</th>
                  <th className={`py-1.5 px-2 text-right ${subtext}`}>{t('Net Paid')}</th>
                  <th className={`py-1.5 px-2 text-right ${subtext}`}>WS</th>
                  <th className={`py-1.5 px-2 text-right font-bold ${subtext}`}>{t('Cost/WS')}</th>
                </tr>
              </thead>
              <tbody>
                {bestValue.map((p, i) => (
                  <tr key={i} className={`border-b ${isDark ? 'border-gray-800/50' : 'border-gray-100'} ${p.isVarese ? (isDark ? 'bg-red-950/20' : 'bg-red-50/30') : ''}`}>
                    <td className={`py-1.5 px-2 ${subtext}`}>{i + 1}</td>
                    <td className={`py-1.5 px-2 font-medium ${p.isVarese ? 'text-red-500' : isDark ? 'text-gray-200' : 'text-gray-800'}`}>{p.player}</td>
                    <td className={`py-1.5 px-2 ${subtext}`}>{p.team}</td>
                    <td className={`py-1.5 px-2 text-right tabular-nums ${subtext}`}>{fmt(p.netPaid)}</td>
                    <td className={`py-1.5 px-2 text-right tabular-nums ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>{p.ws.toFixed(2)}</td>
                    <td className={`py-1.5 px-2 text-right tabular-nums font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>{fmt(p.costPerWs)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className={`${card} p-4`}>
            <h3 className={`text-xs font-semibold mb-3 ${isDark ? 'text-red-400' : 'text-red-600'}`}>{t('Worst Value')} — {t('Cost/WS')}</h3>
            <table className="w-full text-xs">
              <thead>
                <tr className={`border-b ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
                  <th className={`py-1.5 px-2 text-left ${subtext}`}>#</th>
                  <th className={`py-1.5 px-2 text-left ${subtext}`}>{t('Player')}</th>
                  <th className={`py-1.5 px-2 text-left ${subtext}`}>{t('Team')}</th>
                  <th className={`py-1.5 px-2 text-right ${subtext}`}>{t('Net Paid')}</th>
                  <th className={`py-1.5 px-2 text-right ${subtext}`}>WS</th>
                  <th className={`py-1.5 px-2 text-right font-bold ${subtext}`}>{t('Cost/WS')}</th>
                </tr>
              </thead>
              <tbody>
                {worstValue.map((p, i) => (
                  <tr key={i} className={`border-b ${isDark ? 'border-gray-800/50' : 'border-gray-100'} ${p.isVarese ? (isDark ? 'bg-red-950/20' : 'bg-red-50/30') : ''}`}>
                    <td className={`py-1.5 px-2 ${subtext}`}>{i + 1}</td>
                    <td className={`py-1.5 px-2 font-medium ${p.isVarese ? 'text-red-500' : isDark ? 'text-gray-200' : 'text-gray-800'}`}>{p.player}</td>
                    <td className={`py-1.5 px-2 ${subtext}`}>{p.team}</td>
                    <td className={`py-1.5 px-2 text-right tabular-nums ${subtext}`}>{fmt(p.netPaid)}</td>
                    <td className={`py-1.5 px-2 text-right tabular-nums ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>{p.ws.toFixed(2)}</td>
                    <td className={`py-1.5 px-2 text-right tabular-nums font-bold ${isDark ? 'text-red-400' : 'text-red-600'}`}>{fmt(p.costPerWs)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderVarese = () => {
    if (!varese) return <div className={`${card} p-8 text-center ${subtext}`}>{t('No Varese data for this season')}</div>;
    const vPlayers = varese.players.sort((a, b) => b.yearly_salary_norm - a.yearly_salary_norm);
    const vareseCostPerWs = varese.ws > 0 ? varese.netPaid / varese.ws : 0;
    const leagueCostPerWs = leagueAvg.costPerWs;

    return (
      <div className="space-y-5">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <StatCard label={t('Payroll')} value={fmt(varese.payroll)} sub={`#${vareseRank} ${t('of')} ${teamStats.length}`} color="red" />
          <StatCard label={t('Net Paid')} value={fmt(varese.netPaid)} sub={`${((varese.netPaid / varese.payroll) * 100).toFixed(0)}% ${t('of payroll')}`} color="orange" />
          <StatCard label="WS" value={varese.ws.toFixed(1)} sub={`Avg WS/40: ${varese.avgWs40.toFixed(3)}`} color="blue" />
          <StatCard label={t('Cost/WS')} value={fmt(vareseCostPerWs)} sub={`${t('League')}: ${fmt(leagueCostPerWs)}`} color="emerald" />
          <StatCard label={t('Roster')} value={varese.rosterSize.toString()} sub={`${varese.itaCount} ITA · ${varese.visaCount} Visa · ${varese.youthCount} Youth`} color="purple" />
        </div>

        <div className={`${card} p-4`}>
          <h3 className={`text-xs font-semibold mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{t('Roster Breakdown')} — {selectedSeason}</h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={vPlayers.filter(p => p.yearly_salary_norm > 0).map(p => ({
                player: p.player,
                salary: p.yearly_salary_norm,
                ws: p.ws,
              }))} layout="vertical" margin={{ left: 0, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} />
                <XAxis type="number" tick={{ fontSize: 9, fill: isDark ? '#9ca3af' : '#6b7280' }} tickFormatter={(v: number) => fmt(v)} />
                <YAxis type="category" dataKey="player" tick={{ fontSize: 9, fill: isDark ? '#9ca3af' : '#6b7280' }} width={90} />
                <Tooltip contentStyle={tipStyle} formatter={(v: number, name: string) => name === 'salary' ? fmtFull(v) : v.toFixed(2)} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="salary" name={t('Salary')} fill={VARESE_COLOR} opacity={0.8} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={`${card} p-4 overflow-x-auto`}>
          <h3 className={`text-xs font-semibold mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{t('Full Roster')}</h3>
          <table className="w-full text-xs">
            <thead>
              <tr className={`border-b ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
                {[t('Player'), t('Salary'), t('Net Paid'), t('Months'), 'MIN', 'WS', 'WS/40', t('Cost/WS'), t('NAT'), t('Tm Salary Rk'), t('Tm WS Rk'), t('Status')].map(h => (
                  <th key={h} className={`py-2 px-2 text-left font-semibold whitespace-nowrap ${subtext}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {vPlayers.map((p, i) => {
                const costPerWs = p.ws > 0 && p.net_paid > 0 ? fmt(p.net_paid / p.ws) : '—';
                return (
                  <tr key={i} className={`border-b ${isDark ? 'border-gray-800/50' : 'border-gray-100'}`}>
                    <td className={`py-1.5 px-2 font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{p.player}</td>
                    <td className={`py-1.5 px-2 tabular-nums font-semibold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>{fmt(p.yearly_salary_norm)}</td>
                    <td className={`py-1.5 px-2 tabular-nums ${subtext}`}>{fmt(p.net_paid)}</td>
                    <td className={`py-1.5 px-2 ${subtext}`}>{p.months || '—'}</td>
                    <td className={`py-1.5 px-2 tabular-nums ${subtext}`}>{p.min_play}</td>
                    <td className={`py-1.5 px-2 tabular-nums ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>{p.ws.toFixed(2)}</td>
                    <td className={`py-1.5 px-2 tabular-nums ${subtext}`}>{p.ws_40 !== null ? p.ws_40.toFixed(3) : '—'}</td>
                    <td className={`py-1.5 px-2 tabular-nums font-semibold ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>{costPerWs}</td>
                    <td className={`py-1.5 px-2 ${subtext}`}>{p.nationality || '—'}</td>
                    <td className={`py-1.5 px-2 text-center ${subtext}`}>{p.tm_ys_rk}</td>
                    <td className={`py-1.5 px-2 text-center ${subtext}`}>{p.tm_ws_rk}</td>
                    <td className={`py-1.5 px-2 whitespace-nowrap`}>
                      {p.situation ? <span className={`text-[9px] px-1.5 py-0.5 rounded ${p.situation.includes('Cut') || p.situation.includes('Buyout') || p.situation.includes('Released') ? 'bg-red-500/10 text-red-400' : p.situation.includes('Mid-season') ? 'bg-blue-500/10 text-blue-400' : p.situation.includes('Youth') ? 'bg-purple-500/10 text-purple-400' : 'bg-gray-500/10 text-gray-400'}`}>{p.situation}</span> : ''}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className={`fixed inset-0 overflow-auto ${isDark ? 'bg-gray-950' : 'bg-gray-50'}`}>
      <div className={`sticky top-0 z-30 backdrop-blur-xl border-b ${isDark ? 'bg-gray-950/90 border-gray-800' : 'bg-gray-50/90 border-gray-200'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <button onClick={onBack} className={`p-1.5 rounded-lg transition-all ${isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}>
                <ChevronLeft size={18} />
              </button>
              <button onClick={onHome} className="hover:opacity-70 transition-opacity">
                <img src={PV_LOGO_URL} alt="PV" className="w-7 h-7 object-contain" />
              </button>
              <div>
                <h1 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Market Watch</h1>
                <p className={`text-[10px] ${subtext}`}>LBA {t('Salary & Performance Intelligence')}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <select value={selectedSeason} onChange={e => setSelectedSeason(e.target.value)} className={selectClass}>
                  {seasons.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
              </div>
              <button onClick={toggleLanguage} className={`px-2 py-1.5 rounded-lg text-[10px] font-medium tracking-wider uppercase ${isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}>
                {language === 'en' ? 'IT' : 'EN'}
              </button>
              <button onClick={toggleTheme} className={`p-1.5 rounded-lg ${isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}>
                {isDark ? <Sun size={14} /> : <Moon size={14} />}
              </button>
            </div>
          </div>

          <div className="flex gap-1 pb-2 overflow-x-auto">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                    activeTab === tab.id
                      ? isDark ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-800' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : isDark ? 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/50' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon size={12} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'teams' && renderTeams()}
        {activeTab === 'players' && renderPlayers()}
        {activeTab === 'efficiency' && renderEfficiency()}
        {activeTab === 'varese' && renderVarese()}
      </div>
    </div>
  );
};
