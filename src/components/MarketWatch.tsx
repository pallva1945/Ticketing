import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, Sun, Moon, TrendingUp, DollarSign, Users, Award, Search, ChevronDown, ArrowUpDown, Shield, Eye, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, Cell, Legend, LineChart, Line, ComposedChart, ReferenceLine, ReferenceArea } from 'recharts';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { PV_LOGO_URL } from '../constants';
import type { MarketPlayer } from '../services/bigQueryService';

type SortKey = 'yearly_salary_norm' | 'ws' | 'ws_40' | 'cost_per_ws' | 'net_paid' | 'min_play' | 'player' | 'team_name';
type Tab = 'overview' | 'teams' | 'players' | 'efficiency' | 'varese';

const fmt = (n: number) => {
  if (n >= 1000000) return `€${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `€${(n / 1000).toFixed(0)}K`;
  return `€${n}`;
};

const fmtFull = (n: number) => `€${n.toLocaleString('en-US')}`;
const MIN_NET_PAID = 25000;
const adjNp = (np: number) => Math.max(0, np - MIN_NET_PAID);

export const MarketWatch: React.FC<{ onBack: () => void; onHome: () => void }> = ({ onBack, onHome }) => {
  const { theme, toggleTheme } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();
  const isDark = theme === 'dark';

  const [data, setData] = useState<MarketPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSeason, setSelectedSeason] = useState('2025-26');
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('net_paid');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [selectedTeam, setSelectedTeam] = useState<string>('all');
  const [wsRank, setWsRank] = useState<number>(1);
  const [teamSortKey, setTeamSortKey] = useState<string>('gini');
  const [teamSortDir, setTeamSortDir] = useState<'asc' | 'desc'>('desc');
  const [wsSortKey, setWsSortKey] = useState<string>('wsGini');
  const [wsSortDir, setWsSortDir] = useState<'asc' | 'desc'>('desc');
  const [excludeOutliers, setExcludeOutliers] = useState(false);

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
  const isOutlierTeam = (name: string) => /milano/i.test(name) || /bologna/i.test(name);
  const seasonData = useMemo(() => data.filter(d => d.season === selectedSeason && !(d.season === '2025-26' && d.team_name === 'Trapani Shark') && (!excludeOutliers || !isOutlierTeam(d.team_name))), [data, selectedSeason, excludeOutliers]);
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
      costPerWs: totalWs > 0 ? paid.reduce((s, p) => s + adjNp(p.net_paid), 0) / totalWs : 0,
    };
  }, [seasonData, teams]);

  const payrollTrend = useMemo(() => {
    return seasons.map(s => {
      const sd = data.filter(d => d.season === s && !(d.season === '2025-26' && d.team_name === 'Trapani Shark') && (!excludeOutliers || !isOutlierTeam(d.team_name)));
      const teamMap = new Map<string, number>();
      sd.forEach(p => teamMap.set(p.team_name, (teamMap.get(p.team_name) || 0) + p.net_paid));
      const payrolls = [...teamMap.values()].filter(v => v > 0);
      const avg = payrolls.length > 0 ? payrolls.reduce((a, b) => a + b, 0) / payrolls.length : 0;
      const vareseNetPaid = sd.filter(p => p.team_name.includes('Varese')).reduce((s, p) => s + p.net_paid, 0);
      return { season: s, avg: Math.round(avg), varese: vareseNetPaid };
    }).reverse();
  }, [data, seasons, excludeOutliers]);

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

  const parseNumericFilter = (token: string): { field: string; op: '>' | '<'; value: number } | null => {
    const aliases: Record<string, string> = { salary: 'yearly_salary_norm', net: 'net_paid', min: 'min_play', ws: 'ws', ws40: 'ws_40', cost: 'cost_per_ws' };
    const match = token.match(/^(salary|net|min|ws40|ws|cost)\s*([+\-])\s*([0-9]*\.?[0-9]+)(k|m)?$/i);
    if (!match) return null;
    const field = aliases[match[1].toLowerCase()] || match[1].toLowerCase();
    const op = match[2] === '+' ? '>' : '<';
    let value = parseFloat(match[3]);
    const suffix = (match[4] || '').toLowerCase();
    if (suffix === 'k') value *= 1000;
    if (suffix === 'm') value *= 1000000;
    return { field, op, value };
  };

  const filteredPlayers = useMemo(() => {
    let p = seasonData.filter(p => p.yearly_salary_norm > 0 || p.min_play > 0);
    if (selectedTeam !== 'all') p = p.filter(pp => pp.team_name === selectedTeam);
    if (searchQuery) {
      const tokens = searchQuery.trim().split(/\s+/);
      const numericFilters: { field: string; op: '>' | '<'; value: number }[] = [];
      const textParts: string[] = [];
      let i = 0;
      while (i < tokens.length) {
        const fieldToken = tokens[i].toLowerCase();
        if (['salary', 'net', 'min', 'ws', 'ws40', 'cost'].includes(fieldToken) && i + 1 < tokens.length) {
          const combined = fieldToken + tokens[i + 1];
          const parsed = parseNumericFilter(combined);
          if (parsed) { numericFilters.push(parsed); i += 2; continue; }
        }
        const parsed = parseNumericFilter(tokens[i]);
        if (parsed) { numericFilters.push(parsed); }
        else { textParts.push(tokens[i].toLowerCase()); }
        i++;
      }
      if (textParts.length > 0) {
        const textQ = textParts.join(' ');
        p = p.filter(pp => pp.player.toLowerCase().includes(textQ) || pp.team_name.toLowerCase().includes(textQ) || (pp.nationality || '').toLowerCase().includes(textQ));
      }
      for (const f of numericFilters) {
        p = p.filter(pp => {
          let val: number;
          if (f.field === 'cost_per_ws') val = pp.ws > 0 && pp.net_paid > 0 ? adjNp(pp.net_paid) / pp.ws : 0;
          else val = (pp as any)[f.field] || 0;
          return f.op === '>' ? val >= f.value : val <= f.value;
        });
      }
    }
    const enriched = p.map(pp => ({ ...pp, cost_per_ws: pp.ws > 0 && pp.net_paid > 0 ? adjNp(pp.net_paid) / pp.ws : 0 }));
    enriched.sort((a, b) => {
      const aVal = sortKey === 'cost_per_ws' ? a.cost_per_ws : (a as any)[sortKey];
      const bVal = sortKey === 'cost_per_ws' ? b.cost_per_ws : (b as any)[sortKey];
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
      'UNAHOTELS Reggio Emilia': 'Reggio',
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

  const teamSpendingAnalysis = useMemo(() => {
    return teamStats.map(tm => {
      const salaries = tm.players.map(p => p.net_paid).filter(s => s > 0).sort((a, b) => b - a);
      const n = salaries.length;
      const top1Share = n > 0 && tm.netPaid > 0 ? (salaries[0] / tm.netPaid) * 100 : 0;
      const top3Share = n >= 3 && tm.netPaid > 0 ? (salaries.slice(0, 3).reduce((s, v) => s + v, 0) / tm.netPaid) * 100 : 0;
      const top5Share = n >= 5 && tm.netPaid > 0 ? (salaries.slice(0, 5).reduce((s, v) => s + v, 0) / tm.netPaid) * 100 : 0;
      const top9Share = n >= 9 && tm.netPaid > 0 ? (salaries.slice(0, 9).reduce((s, v) => s + v, 0) / tm.netPaid) * 100 : 0;
      const maxSalary = salaries[0] || 0;
      const medianSalary = n > 0 ? salaries[Math.floor(n / 2)] : 0;
      const avgSalary = n > 0 ? salaries.reduce((s, v) => s + v, 0) / n : 0;
      const maxAvgRatio = avgSalary > 0 ? maxSalary / avgSalary : 0;
      let gini = 0;
      if (n > 1) {
        let sumDiff = 0;
        for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) sumDiff += Math.abs(salaries[i] - salaries[j]);
        const mean = salaries.reduce((s, v) => s + v, 0) / n;
        gini = mean > 0 ? sumDiff / (2 * n * n * mean) : 0;
      }
      const adjTeamNp = tm.players.reduce((s, p) => s + adjNp(p.net_paid), 0);
      const costPerWs = tm.ws > 0 ? adjTeamNp / tm.ws : 0;
      const sortedByNp = tm.players.slice().sort((a, b) => b.net_paid - a.net_paid);
      const benchPlayers = tm.players.filter(p => p.tm_min_rk >= 10 && !(p.situation && (p.situation.includes('Cut') || p.situation.includes('Buyout') || p.situation.includes('Released') || p.situation.includes('Mid-season'))));
      const benchNp = benchPlayers.reduce((s, p) => s + adjNp(p.net_paid), 0);
      const benchWs = benchPlayers.reduce((s, p) => s + p.ws, 0);
      const benchCount = benchPlayers.length;
      const benchCostPerWs = benchWs !== 0 ? benchNp / benchWs : 0;
      const benchNpShare = tm.netPaid > 0 ? (benchPlayers.reduce((s, p) => s + p.net_paid, 0) / tm.netPaid) * 100 : 0;
      const top3Paid = sortedByNp.slice(0, 3);
      const top3WsShare = tm.ws > 0 ? (top3Paid.reduce((s, p) => s + p.ws, 0) / tm.ws) * 100 : 0;
      const wsValues = tm.players.map(p => p.ws).filter(w => w > 0).sort((a, b) => b - a);
      const wn = wsValues.length;
      const totalWs = wn > 0 ? wsValues.reduce((s, v) => s + v, 0) : 0;
      const wsTop1 = wn > 0 ? wsValues[0] : 0;
      const wsTop3 = wn >= 3 ? wsValues.slice(0, 3).reduce((s, v) => s + v, 0) : 0;
      const wsTop5 = wn >= 5 ? wsValues.slice(0, 5).reduce((s, v) => s + v, 0) : 0;
      const wsTop9 = wn >= 9 ? wsValues.slice(0, 9).reduce((s, v) => s + v, 0) : 0;
      const wsMax = wsValues[0] || 0;
      const wsAvg = wn > 0 ? totalWs / wn : 0;
      const wsMaxAvgRatio = wsAvg > 0 ? wsMax / wsAvg : 0;
      let wsGini = 0;
      if (wn > 1) {
        let wsDiff = 0;
        for (let i = 0; i < wn; i++) for (let j = 0; j < wn; j++) wsDiff += Math.abs(wsValues[i] - wsValues[j]);
        const wsMean = totalWs / wn;
        wsGini = wsMean > 0 ? wsDiff / (2 * wn * wn * wsMean) : 0;
      }
      return {
        team: shortName(tm.team),
        fullTeam: tm.team,
        netPaid: tm.netPaid,
        payroll: tm.payroll,
        ws: tm.ws,
        rosterSize: tm.rosterSize,
        top1Share,
        top3Share,
        top5Share,
        top9Share,
        benchNpShare,
        maxSalary,
        medianSalary,
        avgSalary,
        maxAvgRatio,
        gini,
        costPerWs,
        top3WsShare,
        wsGini,
        wsTop1,
        wsTop3,
        wsTop5,
        wsTop9,
        wsMaxAvgRatio,
        benchNp,
        benchWs,
        benchCount,
        benchCostPerWs,
        adjTeamNp,
        isVarese: tm.team.includes('Varese'),
      };
    });
  }, [teamStats]);

  const leagueAvgGini = useMemo(() => {
    const ginis = teamSpendingAnalysis.filter(t => t.gini > 0);
    return ginis.length > 0 ? ginis.reduce((s, t) => s + t.gini, 0) / ginis.length : 0;
  }, [teamSpendingAnalysis]);

  const leagueAvgTop3 = useMemo(() => {
    const tops = teamSpendingAnalysis.filter(t => t.top3Share > 0);
    return tops.length > 0 ? tops.reduce((s, t) => s + t.top3Share, 0) / tops.length : 0;
  }, [teamSpendingAnalysis]);

  const sortedTeamData = useMemo(() => {
    return [...teamSpendingAnalysis].sort((a, b) => {
      const aVal = (a as any)[teamSortKey] ?? 0;
      const bVal = (b as any)[teamSortKey] ?? 0;
      if (typeof aVal === 'string') return teamSortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      return teamSortDir === 'asc' ? aVal - bVal : bVal - aVal;
    });
  }, [teamSpendingAnalysis, teamSortKey, teamSortDir]);

  const sortedWsData = useMemo(() => {
    return [...teamSpendingAnalysis].sort((a, b) => {
      const aVal = (a as any)[wsSortKey] ?? 0;
      const bVal = (b as any)[wsSortKey] ?? 0;
      if (typeof aVal === 'string') return wsSortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      return wsSortDir === 'asc' ? aVal - bVal : bVal - aVal;
    });
  }, [teamSpendingAnalysis, wsSortKey, wsSortDir]);

  const leagueAvgWsGini = useMemo(() => {
    const ginis = teamSpendingAnalysis.filter(t => t.wsGini > 0);
    return ginis.length > 0 ? ginis.reduce((s, t) => s + t.wsGini, 0) / ginis.length : 0;
  }, [teamSpendingAnalysis]);

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
                      {d.netPaid > 0 && d.ws > 0 && <p className="text-[10px]">{t('Cost/WS')}: {fmt(d.netPaid / d.ws)}</p>}
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
                <XAxis type="number" dataKey="netPaid" tick={{ fontSize: 9, fill: isDark ? '#9ca3af' : '#6b7280' }} tickFormatter={(v: number) => fmt(v)} name="Net Paid" domain={[(dm: number) => Math.max(0, dm * 0.85), (dm: number) => dm * 1.05]} />
                <YAxis type="number" dataKey="ws" tick={{ fontSize: 9, fill: isDark ? '#9ca3af' : '#6b7280' }} name="Win Shares" domain={[(dm: number) => Math.max(0, dm * 0.85), (dm: number) => dm * 1.05]} tickFormatter={(v: number) => v % 1 === 0 ? String(v) : v.toFixed(1)} />
                <Tooltip content={({ payload }) => {
                  if (!payload || !payload.length) return null;
                  const d = payload[0]?.payload;
                  if (!d || d.isRegLine) return null;
                  return (
                    <div style={tipStyle as any} className="p-2">
                      <p className="font-semibold text-xs">{d.team}</p>
                      <p className="text-[10px]">Net Paid: {fmtFull(d.netPaid)}</p>
                      <p className="text-[10px]">Win Shares: {d.ws.toFixed(2)}</p>
                      {d.netPaid > 0 && d.ws > 0 && <p className="text-[10px]">{t('Cost/WS')}: {fmt(adjNp(d.netPaid) / d.ws)}</p>}
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

  const handleTeamSort = (key: string) => {
    if (teamSortKey === key) setTeamSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setTeamSortKey(key); setTeamSortDir('desc'); }
  };

  const handleWsSort = (key: string) => {
    if (wsSortKey === key) setWsSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setWsSortKey(key); setWsSortDir('desc'); }
  };

  const renderTeams = () => {
    const concentrationChart = [...teamSpendingAnalysis].sort((a, b) => b.top3Share - a.top3Share).map(t => ({
      team: t.team,
      top3: Math.round(t.top3Share),
      rest: Math.round(100 - t.top3Share),
      isVarese: t.isVarese,
    }));
    const vareseData = teamSpendingAnalysis.find(t => t.isVarese);

    return (
      <div className="space-y-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label={t('Avg Gini Index')} value={leagueAvgGini.toFixed(2)} sub={t('0 = equal, 1 = concentrated')} color="blue" />
          <StatCard label={t('Avg Top 3 Share')} value={`${leagueAvgTop3.toFixed(0)}%`} sub={t('of total net paid')} color="orange" />
          {vareseData && <StatCard label={t('Varese Gini')} value={vareseData.gini.toFixed(2)} sub={`${t('League Avg')}: ${leagueAvgGini.toFixed(2)}`} color="red" />}
          {vareseData && <StatCard label={t('Varese Top 3')} value={`${vareseData.top3Share.toFixed(0)}%`} sub={`${t('League Avg')}: ${leagueAvgTop3.toFixed(0)}%`} color="red" />}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className={`${card} p-4`}>
            <h3 className={`text-xs font-semibold mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{t('Salary Concentration')} — {t('Top 3 Players Share')}</h3>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={concentrationChart} layout="vertical" margin={{ left: 0, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 9, fill: isDark ? '#9ca3af' : '#6b7280' }} tickFormatter={(v: number) => `${v}%`} />
                  <YAxis type="category" dataKey="team" tick={{ fontSize: 9, fill: isDark ? '#9ca3af' : '#6b7280' }} width={80} />
                  <Tooltip contentStyle={tipStyle} formatter={(v: number, name: string) => [`${v}%`, name === 'top3' ? t('Top 3') : t('Rest')]} />
                  <Bar dataKey="top3" name={t('Top 3')} stackId="a" fill={isDark ? '#f59e0b' : '#d97706'}>
                    {concentrationChart.map((e, i) => (
                      <Cell key={i} fill={e.isVarese ? VARESE_COLOR : (isDark ? '#f59e0b' : '#d97706')} />
                    ))}
                  </Bar>
                  <Bar dataKey="rest" name={t('Rest')} stackId="a" fill={isDark ? '#374151' : '#e5e7eb'} radius={[0, 4, 4, 0]} />
                  <ReferenceLine x={leagueAvgTop3} stroke={isDark ? '#9ca3af' : '#6b7280'} strokeDasharray="3 3" label={{ value: `${t('Avg')}: ${leagueAvgTop3.toFixed(0)}%`, position: 'top', fontSize: 9, fill: isDark ? '#9ca3af' : '#6b7280' }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className={`${card} p-4`}>
            <h3 className={`text-xs font-semibold mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{t('WS Concentration')} — {t('Top 3 Players Share')}</h3>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[...teamSpendingAnalysis].sort((a, b) => b.top3WsShare - a.top3WsShare).map(t => ({ team: t.team, top3: Math.round(t.top3WsShare), rest: Math.round(100 - t.top3WsShare), isVarese: t.isVarese }))} layout="vertical" margin={{ left: 0, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 9, fill: isDark ? '#9ca3af' : '#6b7280' }} tickFormatter={(v: number) => `${v}%`} />
                  <YAxis type="category" dataKey="team" tick={{ fontSize: 9, fill: isDark ? '#9ca3af' : '#6b7280' }} width={80} />
                  <Tooltip contentStyle={tipStyle} formatter={(v: number, name: string) => [`${v}%`, name === 'top3' ? t('Top 3') : t('Rest')]} />
                  <Bar dataKey="top3" name={t('Top 3')} stackId="a" fill={isDark ? '#3b82f6' : '#2563eb'}>
                    {[...teamSpendingAnalysis].sort((a, b) => b.top3WsShare - a.top3WsShare).map((e, i) => (
                      <Cell key={i} fill={e.isVarese ? VARESE_COLOR : (isDark ? '#3b82f6' : '#2563eb')} />
                    ))}
                  </Bar>
                  <Bar dataKey="rest" name={t('Rest')} stackId="a" fill={isDark ? '#374151' : '#e5e7eb'} radius={[0, 4, 4, 0]} />
                  <ReferenceLine x={(() => { const vals = teamSpendingAnalysis.filter(t => t.top3WsShare > 0); return vals.length > 0 ? Math.round(vals.reduce((s, t) => s + t.top3WsShare, 0) / vals.length) : 0; })()} stroke={isDark ? '#9ca3af' : '#6b7280'} strokeDasharray="3 3" label={{ value: `${t('Avg')}: ${(() => { const vals = teamSpendingAnalysis.filter(t => t.top3WsShare > 0); return vals.length > 0 ? Math.round(vals.reduce((s, t) => s + t.top3WsShare, 0) / vals.length) : 0; })()}%`, position: 'top', fontSize: 9, fill: isDark ? '#9ca3af' : '#6b7280' }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className={`${card} p-4`}>
          <h3 className={`text-xs font-semibold mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{t('Top 3 Salary Share vs Top 3 WS Share')}</h3>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} />
                <XAxis type="number" dataKey="top3Share" domain={['dataMin - 5', 'dataMax + 5']} tick={{ fontSize: 9, fill: isDark ? '#9ca3af' : '#6b7280' }} tickFormatter={(v: number) => `${v.toFixed(0)}%`} label={{ value: t('Top 3 Salary Share %'), position: 'insideBottom', offset: -5, fontSize: 9, fill: isDark ? '#9ca3af' : '#6b7280' }} />
                <YAxis type="number" dataKey="top3WsShare" domain={['dataMin - 5', 'dataMax + 5']} tick={{ fontSize: 9, fill: isDark ? '#9ca3af' : '#6b7280' }} tickFormatter={(v: number) => `${v.toFixed(0)}%`} label={{ value: t('Top 3 WS Share %'), angle: -90, position: 'insideLeft', offset: 10, fontSize: 9, fill: isDark ? '#9ca3af' : '#6b7280' }} />
                <Tooltip content={({ payload }) => {
                  if (!payload || !payload.length) return null;
                  const d = payload[0]?.payload;
                  return d ? (
                    <div style={tipStyle as any} className="p-2">
                      <p className="font-semibold text-xs">{d.team}</p>
                      <p className="text-[10px]">{t('Salary Share (Top 3)')}: {d.top3Share.toFixed(1)}%</p>
                      <p className="text-[10px]">{t('WS Share (Top 3)')}: {d.top3WsShare.toFixed(1)}%</p>
                      <p className="text-[10px]">{t('ROI')}: {d.top3WsShare > 0 && d.top3Share > 0 ? (d.top3WsShare / d.top3Share).toFixed(2) + 'x' : '—'}</p>
                    </div>
                  ) : null;
                }} />
                <ReferenceLine segment={[{ x: 20, y: 20 }, { x: 80, y: 80 }]} stroke={isDark ? '#4b5563' : '#9ca3af'} strokeDasharray="5 5" />
                <Scatter data={teamSpendingAnalysis.filter(t => t.top3Share > 0)}>
                  {teamSpendingAnalysis.filter(t => t.top3Share > 0).map((e, i) => (
                    <Cell key={i} fill={e.isVarese ? VARESE_COLOR : (isDark ? '#10b981' : '#059669')} r={e.isVarese ? 7 : 5} opacity={e.isVarese ? 1 : 0.7} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <p className={`text-[10px] mt-1 ${subtext}`}>{t('Above the line = top players outperform their salary share · Below = overpaid stars')}</p>
        </div>

        <div className={`${card} p-4 overflow-x-auto`}>
          <h3 className={`text-xs font-semibold mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{t('Spending Distribution Table')}</h3>
          <table className="w-full text-xs">
            <thead>
              <tr className={`border-b ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
                <th className={`py-2 px-2 text-left font-semibold ${subtext}`}>#</th>
                {[
                  { key: 'team', label: t('Team'), align: 'left' },
                  { key: 'netPaid', label: t('Net Paid') },
                  { key: 'rosterSize', label: t('Roster') },
                  { key: 'gini', label: t('Gini') },
                  { key: 'top1Share', label: t('Top 1') },
                  { key: 'top3Share', label: t('Top 3') },
                  { key: 'top5Share', label: t('Top 5') },
                  { key: 'top9Share', label: t('Top 9') },
                  { key: 'benchNpShare', label: t('Bench') },
                  { key: 'maxAvgRatio', label: t('Max/Avg') },
                  { key: 'costPerWs', label: t('Cost/WS') },
                  { key: 'ws', label: 'WS' },
                ].map(col => (
                  <th key={col.key} className={`py-2 px-2 ${col.align === 'left' ? 'text-left' : 'text-right'} font-semibold cursor-pointer select-none whitespace-nowrap ${subtext}`} onClick={() => handleTeamSort(col.key)}>
                    <span className="inline-flex items-center gap-1">{col.label} {teamSortKey === col.key && <ArrowUpDown size={10} className={teamSortDir === 'asc' ? 'rotate-180' : ''} />}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedTeamData.map((tm, i) => (
                <tr key={tm.fullTeam} className={`border-b ${isDark ? 'border-gray-800/50' : 'border-gray-100'} ${tm.isVarese ? (isDark ? 'bg-red-950/20' : 'bg-red-50/50') : ''}`}>
                  <td className={`py-2 px-2 ${subtext}`}>{i + 1}</td>
                  <td className={`py-2 px-2 font-medium whitespace-nowrap ${tm.isVarese ? 'text-red-500 font-bold' : isDark ? 'text-gray-200' : 'text-gray-800'}`}>{tm.team}</td>
                  <td className={`py-2 px-2 text-right tabular-nums font-semibold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>{fmt(tm.netPaid)}</td>
                  <td className={`py-2 px-2 text-right ${subtext}`}>{tm.rosterSize}</td>
                  <td className={`py-2 px-2 text-right tabular-nums font-bold ${tm.gini > leagueAvgGini ? (isDark ? 'text-amber-400' : 'text-amber-600') : (isDark ? 'text-blue-400' : 'text-blue-600')}`}>{tm.gini.toFixed(3)}</td>
                  <td className={`py-2 px-2 text-right tabular-nums ${subtext}`}>{tm.top1Share.toFixed(0)}%</td>
                  <td className={`py-2 px-2 text-right tabular-nums font-semibold ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>{tm.top3Share.toFixed(0)}%</td>
                  <td className={`py-2 px-2 text-right tabular-nums ${subtext}`}>{tm.top5Share.toFixed(0)}%</td>
                  <td className={`py-2 px-2 text-right tabular-nums ${subtext}`}>{tm.top9Share > 0 ? `${tm.top9Share.toFixed(0)}%` : '—'}</td>
                  <td className={`py-2 px-2 text-right tabular-nums ${subtext}`}>{tm.benchNpShare > 0 ? `${tm.benchNpShare.toFixed(0)}%` : '—'}</td>
                  <td className={`py-2 px-2 text-right tabular-nums ${subtext}`}>{tm.maxAvgRatio.toFixed(1)}x</td>
                  <td className={`py-2 px-2 text-right tabular-nums ${isDark ? 'text-sky-400' : 'text-sky-600'}`}>{tm.costPerWs > 0 ? fmt(tm.costPerWs) : '—'}</td>
                  <td className={`py-2 px-2 text-right tabular-nums ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>{tm.ws.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className={`${card} p-4 overflow-x-auto`}>
          <h3 className={`text-xs font-semibold mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{t('Win Share Distribution Table')}</h3>
          <table className="w-full text-xs">
            <thead>
              <tr className={`border-b ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
                <th className={`py-2 px-2 text-left font-semibold ${subtext}`}>#</th>
                {[
                  { key: 'team', label: t('Team'), align: 'left' },
                  { key: 'ws', label: 'WS' },
                  { key: 'wsGini', label: t('Gini') },
                  { key: 'wsTop1', label: t('Top 1') },
                  { key: 'wsTop3', label: t('Top 3') },
                  { key: 'wsTop5', label: t('Top 5') },
                  { key: 'wsTop9', label: t('Top 9') },
                  { key: 'benchWs', label: t('Bench') },
                  { key: 'wsMaxAvgRatio', label: t('Max/Avg') },
                  { key: 'costPerWs', label: t('Cost/WS') },
                  { key: 'netPaid', label: t('Net Paid') },
                ].map(col => (
                  <th key={col.key} className={`py-2 px-2 ${col.align === 'left' ? 'text-left' : 'text-right'} font-semibold cursor-pointer select-none whitespace-nowrap ${subtext}`} onClick={() => handleWsSort(col.key)}>
                    <span className="inline-flex items-center gap-1">{col.label} {wsSortKey === col.key && <ArrowUpDown size={10} className={wsSortDir === 'asc' ? 'rotate-180' : ''} />}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedWsData.map((tm, i) => (
                <tr key={tm.fullTeam} className={`border-b ${isDark ? 'border-gray-800/50' : 'border-gray-100'} ${tm.isVarese ? (isDark ? 'bg-red-950/20' : 'bg-red-50/50') : ''}`}>
                  <td className={`py-2 px-2 ${subtext}`}>{i + 1}</td>
                  <td className={`py-2 px-2 font-medium whitespace-nowrap ${tm.isVarese ? 'text-red-500 font-bold' : isDark ? 'text-gray-200' : 'text-gray-800'}`}>{tm.team}</td>
                  <td className={`py-2 px-2 text-right tabular-nums font-semibold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>{tm.ws.toFixed(1)}</td>
                  <td className={`py-2 px-2 text-right tabular-nums font-bold ${tm.wsGini > leagueAvgWsGini ? (isDark ? 'text-amber-400' : 'text-amber-600') : (isDark ? 'text-blue-400' : 'text-blue-600')}`}>{tm.wsGini.toFixed(3)}</td>
                  <td className={`py-2 px-2 text-right tabular-nums ${subtext}`}>{tm.wsTop1.toFixed(2)}</td>
                  <td className={`py-2 px-2 text-right tabular-nums font-semibold ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>{tm.wsTop3.toFixed(2)}</td>
                  <td className={`py-2 px-2 text-right tabular-nums ${subtext}`}>{tm.wsTop5.toFixed(2)}</td>
                  <td className={`py-2 px-2 text-right tabular-nums ${subtext}`}>{tm.wsTop9 > 0 ? tm.wsTop9.toFixed(2) : '—'}</td>
                  <td className={`py-2 px-2 text-right tabular-nums ${tm.benchWs < 0 ? 'text-red-500' : subtext}`}>{tm.benchWs.toFixed(2)}</td>
                  <td className={`py-2 px-2 text-right tabular-nums ${subtext}`}>{tm.wsMaxAvgRatio.toFixed(1)}x</td>
                  <td className={`py-2 px-2 text-right tabular-nums ${isDark ? 'text-sky-400' : 'text-sky-600'}`}>{tm.costPerWs > 0 ? fmt(tm.costPerWs) : '—'}</td>
                  <td className={`py-2 px-2 text-right tabular-nums ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>{fmt(tm.netPaid)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className={`${card} p-4`}>
          <h3 className={`text-xs font-semibold mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{t('Bench Analysis')} — {t('Players ranked 10th+ by Minutes')}</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className={`border-b ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
                  {[
                    { key: '#', label: '#' },
                    { key: 'team', label: t('Team'), align: 'left' },
                    { key: 'benchCount', label: t('Players') },
                    { key: 'benchNp', label: t('Adj. Spent') },
                    { key: 'benchWs', label: 'WS' },
                    { key: 'benchCostPerWs', label: t('Cost/WS') },
                    { key: 'benchWsPct', label: t('WS %') },
                    { key: 'benchNpPct', label: t('Spend %') },
                  ].map(col => (
                    <th key={col.key} className={`py-2 px-2 ${col.align === 'left' ? 'text-left' : 'text-right'} font-semibold cursor-pointer select-none whitespace-nowrap ${subtext}`}
                      onClick={() => col.key !== '#' && handleTeamSort(col.key)}>
                      <span className="inline-flex items-center gap-1">{col.label} {teamSortKey === col.key && <ArrowUpDown size={10} className={teamSortDir === 'asc' ? 'rotate-180' : ''} />}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...teamSpendingAnalysis].sort((a, b) => {
                  const aVal = (a as any)[teamSortKey] ?? 0;
                  const bVal = (b as any)[teamSortKey] ?? 0;
                  if (typeof aVal === 'string') return teamSortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
                  return teamSortDir === 'asc' ? aVal - bVal : bVal - aVal;
                }).map((tm, i) => {
                  const benchWsPct = tm.ws > 0 ? (tm.benchWs / tm.ws) * 100 : 0;
                  const benchNpPct = tm.adjTeamNp > 0 ? (tm.benchNp / tm.adjTeamNp) * 100 : 0;
                  return (
                    <tr key={tm.fullTeam} className={`border-b ${isDark ? 'border-gray-800/50' : 'border-gray-100'} ${tm.isVarese ? (isDark ? 'bg-red-950/20' : 'bg-red-50/50') : ''}`}>
                      <td className={`py-2 px-2 ${subtext}`}>{i + 1}</td>
                      <td className={`py-2 px-2 font-medium whitespace-nowrap ${tm.isVarese ? 'text-red-500 font-bold' : isDark ? 'text-gray-200' : 'text-gray-800'}`}>{tm.team}</td>
                      <td className={`py-2 px-2 text-right tabular-nums ${subtext}`}>{tm.benchCount}</td>
                      <td className={`py-2 px-2 text-right tabular-nums font-semibold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>{fmt(tm.benchNp)}</td>
                      <td className={`py-2 px-2 text-right tabular-nums font-semibold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>{tm.benchWs.toFixed(2)}</td>
                      <td className={`py-2 px-2 text-right tabular-nums font-semibold ${tm.benchCostPerWs < 0 ? 'text-red-500' : isDark ? 'text-orange-400' : 'text-orange-600'}`}>{tm.benchCostPerWs !== 0 ? (tm.benchCostPerWs < 0 ? `−${fmt(Math.abs(tm.benchCostPerWs))}` : fmt(tm.benchCostPerWs)) : '—'}</td>
                      <td className={`py-2 px-2 text-right tabular-nums ${subtext}`}>{benchWsPct.toFixed(1)}%</td>
                      <td className={`py-2 px-2 text-right tabular-nums ${subtext}`}>{benchNpPct > 0 ? `${benchNpPct.toFixed(1)}%` : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className={`text-[10px] mt-2 ${subtext}`}>{t('Bench = players ranked 10th+ by team minutes. Adj. Spent = net paid minus €25K min per player. WS % = bench share of team WS. Spend % = bench share of team adjusted total.')}</p>
        </div>
      </div>
    );
  };

  const renderPlayers = () => (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${subtext}`} />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={t('Search: name, team, nat | net +2m | ws +1 | min -500 | cost -100k')}
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
              <SortHeader label={t('Net Paid')} sortId="net_paid" />
              <SortHeader label={t('MIN')} sortId="min_play" />
              <SortHeader label="WS" sortId="ws" />
              <SortHeader label="WS/40" sortId="ws_40" />
              <SortHeader label={t('Cost/WS')} sortId="cost_per_ws" />
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
                  <td className={`py-1.5 px-2 text-right tabular-nums font-semibold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>{fmt(p.net_paid)}</td>
                  <td className={`py-1.5 px-2 text-right tabular-nums ${subtext}`}>{p.min_play}</td>
                  <td className={`py-1.5 px-2 text-right tabular-nums ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>{p.ws.toFixed(2)}</td>
                  <td className={`py-1.5 px-2 text-right tabular-nums ${subtext}`}>{p.ws_40 !== null ? p.ws_40.toFixed(3) : '—'}</td>
                  <td className={`py-1.5 px-2 text-right tabular-nums font-semibold ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>{p.ws > 0 && p.net_paid > 0 ? fmt(adjNp(p.net_paid) / p.ws) : '—'}</td>
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
        negNetPaid: -p.net_paid,
        salary: p.yearly_salary_norm,
        ws: p.ws,
        ws40: p.ws_40 || 0,
        costPerWs: adjNp(p.net_paid) / p.ws,
        isVarese: p.team_name.includes('Varese'),
        min_play: p.min_play,
      }));

    const bestValue = [...effData].sort((a, b) => a.costPerWs - b.costPerWs).slice(0, 15);
    const worstValue = [...effData].sort((a, b) => b.costPerWs - a.costPerWs).slice(0, 15);

    return (
      <div className="space-y-5">
        {(() => {
          const sortedNp = effData.map(d => d.netPaid).sort((a, b) => a - b);
          const sortedWs = effData.map(d => d.ws).sort((a, b) => a - b);
          const median = (arr: number[]) => {
            const mid = Math.floor(arr.length / 2);
            return arr.length % 2 !== 0 ? arr[mid] : (arr[mid - 1] + arr[mid]) / 2;
          };
          const medNp = median(sortedNp);
          const medWs = median(sortedWs);
          const maxNp = sortedNp[sortedNp.length - 1] * 1.05;
          const maxWs = sortedWs[sortedWs.length - 1] * 1.1;
          const minWs = Math.min(0, sortedWs[0]);
          return (
            <div className={`${card} p-4`}>
              <h3 className={`text-xs font-semibold mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{t('Value Quadrant')} <span className={`font-normal ${subtext}`}>({t('min 50 min played')} | {t('median lines')})</span></h3>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 20, right: 20, bottom: 10, left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} opacity={0.5} />
                    <XAxis type="number" dataKey="negNetPaid" tick={{ fontSize: 9, fill: isDark ? '#9ca3af' : '#6b7280' }} tickFormatter={(v: number) => fmt(Math.abs(v))} name="Net Paid" domain={['dataMin', 'dataMax']} label={{ value: `← ${t('Net Paid')}`, position: 'insideBottomLeft', offset: -5, fontSize: 10, fill: isDark ? '#6b7280' : '#9ca3af' }} />
                    <YAxis type="number" dataKey="ws" tick={{ fontSize: 9, fill: isDark ? '#9ca3af' : '#6b7280' }} name="Win Shares" domain={['dataMin', 'dataMax']} tickFormatter={(v: number) => v % 1 === 0 ? String(v) : v.toFixed(1)} label={{ value: t('Win Shares →'), position: 'insideTopLeft', offset: 0, fontSize: 10, fill: isDark ? '#6b7280' : '#9ca3af', angle: -90 }} />
                    <ReferenceArea x1={0} x2={-medNp} y1={medWs} y2={maxWs * 2} fill={isDark ? '#10b981' : '#86efac'} fillOpacity={isDark ? 0.12 : 0.18} />
                    <ReferenceArea x1={-medNp} x2={-maxNp * 2} y1={medWs} y2={maxWs * 2} fill={isDark ? '#3b82f6' : '#93c5fd'} fillOpacity={isDark ? 0.1 : 0.15} />
                    <ReferenceArea x1={0} x2={-medNp} y1={-maxWs} y2={medWs} fill={isDark ? '#f97316' : '#fdba74'} fillOpacity={isDark ? 0.1 : 0.15} />
                    <ReferenceArea x1={-medNp} x2={-maxNp * 2} y1={-maxWs} y2={medWs} fill={isDark ? '#ef4444' : '#fca5a5'} fillOpacity={isDark ? 0.12 : 0.18} />
                    <ReferenceLine x={-medNp} stroke={isDark ? '#6b7280' : '#9ca3af'} strokeDasharray="6 4" strokeWidth={1.5} label={{ value: `${t('Med')}: ${fmt(medNp)}`, position: 'top', fontSize: 9, fill: isDark ? '#9ca3af' : '#6b7280' }} />
                    <ReferenceLine y={medWs} stroke={isDark ? '#6b7280' : '#9ca3af'} strokeDasharray="6 4" strokeWidth={1.5} label={{ value: `${t('Med')}: ${medWs.toFixed(2)}`, position: 'right', fontSize: 9, fill: isDark ? '#9ca3af' : '#6b7280' }} />

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
              <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-2">
                <span className={`text-[10px] flex items-center gap-1 ${subtext}`}><span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: isDark ? '#10b981' : '#6ee7b7', opacity: 0.6 }} /> {t('Cheap & Valuable')}</span>
                <span className={`text-[10px] flex items-center gap-1 ${subtext}`}><span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: isDark ? '#3b82f6' : '#93c5fd', opacity: 0.6 }} /> {t('Expensive & Valuable')}</span>
                <span className={`text-[10px] flex items-center gap-1 ${subtext}`}><span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: isDark ? '#f97316' : '#fdba74', opacity: 0.6 }} /> {t('Cheap & Low Value')}</span>
                <span className={`text-[10px] flex items-center gap-1 ${subtext}`}><span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: isDark ? '#ef4444' : '#fca5a5', opacity: 0.6 }} /> {t('Expensive & Low Value')}</span>
              </div>
            </div>
          );
        })()}

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
    const vPlayers = varese.players.sort((a, b) => b.net_paid - a.net_paid);
    const vareseCostPerWs = varese.ws > 0 ? varese.players.reduce((s, p) => s + adjNp(p.net_paid), 0) / varese.ws : 0;
    const leagueCostPerWs = leagueAvg.costPerWs;
    const vReg = (() => {
      const pts = vPlayers.filter(p => p.net_paid > 0 && p.ws > 0);
      if (pts.length < 2) return null;
      const n = pts.length;
      const sX = pts.reduce((s, p) => s + p.net_paid, 0);
      const sY = pts.reduce((s, p) => s + p.ws, 0);
      const sXY = pts.reduce((s, p) => s + p.net_paid * p.ws, 0);
      const sX2 = pts.reduce((s, p) => s + p.net_paid ** 2, 0);
      const sY2 = pts.reduce((s, p) => s + p.ws ** 2, 0);
      const slope = (n * sXY - sX * sY) / (n * sX2 - sX * sX);
      const intercept = (sY - slope * sX) / n;
      const rNum = n * sXY - sX * sY;
      const rDen = Math.sqrt((n * sX2 - sX * sX) * (n * sY2 - sY * sY));
      const r2 = rDen > 0 ? (rNum / rDen) ** 2 : 0;
      const mnX = Math.min(...pts.map(p => p.net_paid));
      const mxX = Math.max(...pts.map(p => p.net_paid));
      return { r2, line: [{ netPaid: mnX, ws: slope * mnX + intercept }, { netPaid: mxX, ws: slope * mxX + intercept }] };
    })();

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
          {(() => {
            const rosterData = vPlayers.filter(p => p.net_paid > 0).map(p => ({ player: p.player, netPaid: p.net_paid, ws: p.ws }));
            const chartH = Math.max(250, rosterData.length * 28);
            return (
              <div style={{ height: chartH }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={rosterData} layout="vertical" margin={{ left: 0, right: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} />
                    <XAxis type="number" tick={{ fontSize: 9, fill: isDark ? '#9ca3af' : '#6b7280' }} tickFormatter={(v: number) => fmt(v)} />
                    <YAxis type="category" dataKey="player" tick={{ fontSize: 9, fill: isDark ? '#9ca3af' : '#6b7280' }} width={100} interval={0} />
                    <Tooltip contentStyle={tipStyle} formatter={(v: number) => fmtFull(v)} />
                    <Bar dataKey="netPaid" name={t('Net Paid')} fill={VARESE_COLOR} opacity={0.8} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            );
          })()}
        </div>

        <div className={`${card} p-4`}>
          <h3 className={`text-xs font-semibold mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            {t('Net Paid vs Win Shares')}
            {vReg && <span className={`ml-2 font-normal ${subtext}`}>R² = {vReg.r2.toFixed(3)}</span>}
          </h3>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} />
                <XAxis type="number" dataKey="netPaid" tick={{ fontSize: 9, fill: isDark ? '#9ca3af' : '#6b7280' }} tickFormatter={(v: number) => fmt(v)} name={t('Net Paid')} label={{ value: t('Net Paid'), position: 'insideBottom', offset: -5, fontSize: 9, fill: isDark ? '#9ca3af' : '#6b7280' }} domain={[(dm: number) => Math.max(0, dm * 0.85), (dm: number) => dm * 1.1]} />
                <YAxis type="number" dataKey="ws" tick={{ fontSize: 9, fill: isDark ? '#9ca3af' : '#6b7280' }} tickFormatter={(v: number) => v % 1 === 0 ? String(v) : v.toFixed(1)} name="WS" label={{ value: 'Win Shares', angle: -90, position: 'insideLeft', offset: 10, fontSize: 9, fill: isDark ? '#9ca3af' : '#6b7280' }} domain={[(dm: number) => Math.max(0, dm * 0.85), (dm: number) => dm * 1.1]} />
                <Tooltip content={({ payload }) => {
                  if (!payload || !payload.length) return null;
                  const d = payload[0]?.payload;
                  return d ? (
                    <div style={tipStyle as any} className="p-2">
                      <p className="font-semibold text-xs">{d.player}</p>
                      <p className="text-[10px]">{t('Net Paid')}: {fmtFull(d.netPaid)}</p>
                      <p className="text-[10px]">WS: {d.ws.toFixed(2)} | WS/40: {d.ws40 !== null ? d.ws40.toFixed(3) : '—'}</p>
                      <p className="text-[10px]">{t('Cost/WS')}: {d.ws > 0 && d.netPaid > 0 ? fmt(adjNp(d.netPaid) / d.ws) : '—'}</p>
                      <p className="text-[10px]">MIN: {d.min}</p>
                    </div>
                  ) : null;
                }} />
                <Scatter data={vPlayers.filter(p => p.net_paid > 0 || p.min_play > 0).map(p => ({ player: p.player, netPaid: p.net_paid, ws: p.ws, ws40: p.ws_40, min: p.min_play }))} fill={VARESE_COLOR}>
                  {vPlayers.filter(p => p.net_paid > 0 || p.min_play > 0).map((_, i) => (
                    <Cell key={i} fill={VARESE_COLOR} r={6} />
                  ))}
                </Scatter>
                {vReg && (
                  <Scatter data={vReg.line} line={{ stroke: isDark ? '#f59e0b' : '#d97706', strokeWidth: 2, strokeDasharray: '6 3' }} fill="transparent" legendType="none">
                    {vReg.line.map((_, i) => <Cell key={i} fill="transparent" r={0} />)}
                  </Scatter>
                )}
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <p className={`text-[10px] mt-1 ${subtext}`}>{t('Top-left = high value (low cost, high WS) · Bottom-right = low value (high cost, low WS)')}</p>
        </div>

        <div className={`${card} p-4 overflow-x-auto`}>
          <h3 className={`text-xs font-semibold mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{t('Full Roster')}</h3>
          <table className="w-full text-xs">
            <thead>
              <tr className={`border-b ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
                {[t('Player'), t('Net Paid'), t('Months'), 'MIN', 'WS', 'WS/40', t('Cost/WS'), t('NAT'), t('Tm NP Rk'), t('Tm WS Rk'), t('Status')].map(h => (
                  <th key={h} className={`py-2 px-2 text-left font-semibold whitespace-nowrap ${subtext}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {vPlayers.map((p, i) => {
                const costPerWs = p.ws > 0 && p.net_paid > 0 ? fmt(adjNp(p.net_paid) / p.ws) : '—';
                return (
                  <tr key={i} className={`border-b ${isDark ? 'border-gray-800/50' : 'border-gray-100'}`}>
                    <td className={`py-1.5 px-2 font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{p.player}</td>
                    <td className={`py-1.5 px-2 tabular-nums font-semibold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>{fmt(p.net_paid)}</td>
                    <td className={`py-1.5 px-2 ${subtext}`}>{p.months || '—'}</td>
                    <td className={`py-1.5 px-2 tabular-nums ${subtext}`}>{p.min_play}</td>
                    <td className={`py-1.5 px-2 tabular-nums ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>{p.ws.toFixed(2)}</td>
                    <td className={`py-1.5 px-2 tabular-nums ${subtext}`}>{p.ws_40 !== null ? p.ws_40.toFixed(3) : '—'}</td>
                    <td className={`py-1.5 px-2 tabular-nums font-semibold ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>{costPerWs}</td>
                    <td className={`py-1.5 px-2 ${subtext}`}>{p.nationality || '—'}</td>
                    <td className={`py-1.5 px-2 text-center ${subtext}`}>{p.tm_np_rk}</td>
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
              <button
                onClick={() => setExcludeOutliers(v => {
                  if (!v && seasons.length > 1) {
                    const idx = seasons.indexOf(selectedSeason);
                    if (idx < seasons.length - 1) setSelectedSeason(seasons[idx + 1]);
                  }
                  return !v;
                })}
                className={`px-2 py-1.5 rounded-lg text-[10px] font-medium whitespace-nowrap transition-all border ${
                  excludeOutliers
                    ? isDark ? 'bg-red-900/40 text-red-400 border-red-800' : 'bg-red-50 text-red-600 border-red-200'
                    : isDark ? 'text-gray-500 border-gray-700 hover:text-gray-300' : 'text-gray-400 border-gray-200 hover:text-gray-600'
                }`}
                title={t('Exclude Olimpia Milano & Virtus Bologna')}
              >
                {excludeOutliers ? `✕ ${t('No MIL/BOL')}` : `${t('No MIL/BOL')}`}
              </button>
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
