import React, { useState, useEffect, useMemo } from 'react';
import { Activity, Users, User, GitCompare, TrendingUp, RefreshCw, Ruler, Weight, Target, Zap, Timer, Dumbbell, ChevronDown, ArrowLeft, Crosshair, Heart, Flag, BarChart3, Loader2, ArrowUpDown, ArrowUp, ArrowDown, Calendar, CalendarDays } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, BarChart, Bar, CartesianGrid, Legend } from 'recharts';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';

function useIsDark() {
  const { theme } = useTheme();
  return theme === 'dark';
}

interface VBSession {
  player: string;
  date: string;
  practiceLoad: number | null;
  vitaminsLoad: number | null;
  weightsLoad: number | null;
  gameLoad: number | null;
  height: number | null;
  weight: number | null;
  wingspan: number | null;
  standingReach: number | null;
  bodyFat: number | null;
  pureVertical: number | null;
  noStepVertical: number | null;
  sprint: number | null;
  coneDrill: number | null;
  deadlift: number | null;
  shootsTaken: number | null;
  shootsMade: number | null;
  shootingPct: number | null;
  formShooting: number | null;
  injured: number | null;
  nationalTeam: number | null;
}

type TabId = 'overview' | 'player' | 'compare' | 'progression';

const METRIC_COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

function getLatestMetric(sessions: VBSession[], player: string, field: keyof VBSession): number | null {
  const playerSessions = sessions.filter(s => s.player === player);
  for (let i = playerSessions.length - 1; i >= 0; i--) {
    const val = playerSessions[i][field];
    if (val !== null && val !== undefined) return val as number;
  }
  return null;
}

function getPlayerSessions(sessions: VBSession[], player: string): VBSession[] {
  return sessions.filter(s => s.player === player);
}

function getAvg(values: (number | null)[]): number | null {
  const valid = values.filter(v => v !== null && !isNaN(Number(v))) as number[];
  if (valid.length === 0) return null;
  const avg = Math.round((valid.reduce((a, b) => a + b, 0) / valid.length) * 10) / 10;
  return isNaN(avg) ? null : avg;
}

function getSeason(dateStr: string): string | null {
  if (!dateStr || dateStr === 'unknown') return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  if (year < 2000) return null;
  if (month >= 7) return `${year}/${(year + 1).toString().slice(2)}`;
  return `${year - 1}/${year.toString().slice(2)}`;
}

function StatCard({ label, value, unit, icon: Icon, color, subtitle }: { label: string; value: string | number | null; unit?: string; icon: any; color: string; subtitle?: string }) {
  const isDark = useIsDark();
  return (
    <div className={`rounded-xl border p-4 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} shadow-sm`}>
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center`} style={{ backgroundColor: color + '15' }}>
          <Icon size={14} style={{ color }} />
        </div>
        <span className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{label}</span>
      </div>
      <div className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
        {value !== null && value !== undefined && !Number.isNaN(value) ? `${value}${unit || ''}` : '—'}
      </div>
      {subtitle && <div className={`text-[10px] mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{subtitle}</div>}
    </div>
  );
}

function PlayerSelector({ players, selected, onChange, multiple }: { players: string[]; selected: string | string[]; onChange: (val: any) => void; multiple?: boolean }) {
  const isDark = useIsDark();
  if (multiple) {
    const sel = selected as string[];
    return (
      <div className="flex flex-wrap gap-1.5">
        {players.map(p => (
          <button
            key={p}
            onClick={() => {
              if (sel.includes(p)) onChange(sel.filter(x => x !== p));
              else if (sel.length < 4) onChange([...sel, p]);
            }}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
              sel.includes(p)
                ? 'bg-orange-500 text-white'
                : isDark ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {p.split(' ').map(n => n[0]).join('')} {p.split(' ').pop()}
          </button>
        ))}
      </div>
    );
  }
  return (
    <div className="relative">
      <select
        value={selected as string}
        onChange={e => onChange(e.target.value)}
        className={`w-full px-3 py-2 rounded-lg text-sm font-medium appearance-none pr-8 ${
          isDark ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-gray-900 border-gray-200'
        } border`}
      >
        {players.map(p => <option key={p} value={p}>{p}</option>)}
      </select>
      <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
    </div>
  );
}

type SortKey = 'player' | 'height' | 'weight' | 'wingspan' | 'reach' | 'bodyFat' | 'pct' | 'shots' | 'vitamins' | 'weights' | 'practice' | 'game' | 'injury' | 'nt' | 'daysOff';
type SortDir = 'asc' | 'desc';

interface RosterRow {
  player: string;
  height: number | null;
  weight: number | null;
  wingspan: number | null;
  reach: number | null;
  bodyFat: number | null;
  pct: number | null;
  shots: number;
  vitamins: number;
  weights: number;
  practice: number;
  game: number;
  injury: number;
  nt: number;
  daysOff: number;
}

function getCurrentSeason(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  if (month >= 7) return `${year}/${(year + 1).toString().slice(2)}`;
  return `${year - 1}/${year.toString().slice(2)}`;
}

const SEASON_START_DATES: Record<string, Date> = {
  '2024/25': new Date(2024, 7, 23),
  '2025/26': new Date(2025, 7, 11),
};

const PLAYER_START_OVERRIDES: Record<string, Record<string, Date>> = {
  '2025/26': {
    'ciocchetti, filippo': new Date(2025, 11, 1),
  },
};

function getSeasonStartDate(selectedSeason: string, player?: string): Date | null {
  if (player) {
    const overrides = PLAYER_START_OVERRIDES[selectedSeason];
    if (overrides) {
      const key = player.toLowerCase().trim();
      for (const [name, date] of Object.entries(overrides)) {
        if (key.includes(name) || name.includes(key)) return date;
      }
    }
  }
  if (SEASON_START_DATES[selectedSeason]) return SEASON_START_DATES[selectedSeason];
  const parts = selectedSeason.match(/^(\d{4})\//);
  if (!parts) return null;
  const startYear = parseInt(parts[1], 10);
  return new Date(startYear, 7, 1);
}

function getSeasonDays(selectedSeason: string, player?: string): number {
  if (selectedSeason === 'all') {
    return 0;
  }
  const seasonStart = getSeasonStartDate(selectedSeason, player);
  if (!seasonStart) return 1;
  const parts = selectedSeason.match(/^(\d{4})\//);
  const startYear = parts ? parseInt(parts[1], 10) : new Date().getFullYear();
  const seasonEnd = new Date(startYear + 1, 5, 30);
  const now = new Date();
  const end = now < seasonEnd ? now : seasonEnd;
  return Math.max(1, Math.ceil((end.getTime() - seasonStart.getTime()) / 86400000));
}

function RosterTable({ filtered, activePlayers, onSelectPlayer, isDark, selectedSeason }: { filtered: VBSession[]; activePlayers: string[]; onSelectPlayer: (p: string) => void; isDark: boolean; selectedSeason: string }) {
  const { t } = useLanguage();
  const [sortKey, setSortKey] = useState<SortKey>('player');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [viewMode, setViewMode] = useState<'total' | 'perDay'>('total');

  const baseSeasonDays = useMemo(() => getSeasonDays(selectedSeason), [selectedSeason]);
  const canShowPerDay = baseSeasonDays > 0;

  useEffect(() => {
    if (!canShowPerDay && viewMode === 'perDay') setViewMode('total');
  }, [canShowPerDay]);

  const rows: RosterRow[] = useMemo(() => activePlayers.map(player => {
    const ps = getPlayerSessions(filtered, player);
    const shootingSessions = ps.filter(s => s.shootingPct !== null);
    const playerSeasonDays = getSeasonDays(selectedSeason, player);
    const isPerDay = viewMode === 'perDay' && canShowPerDay;

    const sumOrAvg = (values: (number | null)[]): number => {
      const valid = values.filter(v => v !== null && v !== undefined) as number[];
      if (valid.length === 0) return 0;
      const total = valid.reduce((a, b) => a + b, 0);
      return isPerDay ? Math.round((total / playerSeasonDays) * 10) / 10 : total;
    };

    const injuryDateSet = new Set(ps.filter(s => s.injured !== null && s.injured > 0).map(s => s.date));
    const injuryDays = injuryDateSet.size;
    const ntDateSet = new Set(ps.filter(s => s.nationalTeam !== null && s.nationalTeam > 0).map(s => s.date));
    const ntDays = ntDateSet.size;
    const seasonStartDate = getSeasonStartDate(selectedSeason, player);
    const psInRange = seasonStartDate ? ps.filter(s => new Date(s.date) >= seasonStartDate) : ps;
    const activeDateSet = new Set<string>();
    for (const s of psInRange) {
      if ((s.vitaminsLoad || 0) > 0 || (s.weightsLoad || 0) > 0 || (s.practiceLoad || 0) > 0 || (s.gameLoad || 0) > 0 || (s.injured !== null && s.injured > 0) || (s.nationalTeam !== null && s.nationalTeam > 0)) {
        activeDateSet.add(s.date);
      }
    }
    const daysOff = isPerDay ? 0 : Math.max(0, playerSeasonDays - activeDateSet.size);

    return {
      player,
      height: getLatestMetric(filtered, player, 'height'),
      weight: getLatestMetric(filtered, player, 'weight'),
      wingspan: getLatestMetric(filtered, player, 'wingspan'),
      reach: getLatestMetric(filtered, player, 'standingReach'),
      bodyFat: getLatestMetric(filtered, player, 'bodyFat'),
      pct: getAvg(shootingSessions.map(s => s.shootingPct)),
      shots: sumOrAvg(ps.map(s => s.shootsTaken)),
      vitamins: sumOrAvg(ps.map(s => s.vitaminsLoad)),
      weights: sumOrAvg(ps.map(s => s.weightsLoad)),
      practice: sumOrAvg(ps.map(s => s.practiceLoad)),
      game: sumOrAvg(ps.map(s => s.gameLoad)),
      injury: injuryDays,
      nt: ntDays,
      daysOff: daysOff,
    };
  }), [filtered, activePlayers, viewMode, selectedSeason]);

  const sorted = useMemo(() => {
    const arr = [...rows];
    arr.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (sortKey === 'player') {
        const cmp = String(av).localeCompare(String(bv));
        return sortDir === 'asc' ? cmp : -cmp;
      }
      const an = av as number | null;
      const bn = bv as number | null;
      if (an === null && bn === null) return 0;
      if (an === null) return 1;
      if (bn === null) return -1;
      return sortDir === 'asc' ? an - bn : bn - an;
    });
    return arr;
  }, [rows, sortKey, sortDir]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir(key === 'player' ? 'asc' : 'desc');
    }
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ArrowUpDown size={10} className="opacity-30 ml-0.5 inline" />;
    return sortDir === 'asc' 
      ? <ArrowUp size={10} className="text-orange-500 ml-0.5 inline" /> 
      : <ArrowDown size={10} className="text-orange-500 ml-0.5 inline" />;
  };

  const thClass = (align: string = 'center') => `${align === 'left' ? 'text-left' : 'text-center'} py-2 px-1 font-semibold cursor-pointer select-none hover:text-orange-500 transition-colors ${isDark ? 'text-gray-400' : 'text-gray-500'}`;

  const columns: { key: SortKey; label: string; align?: string }[] = [
    { key: 'player', label: t('Player'), align: 'left' },
    { key: 'height', label: t('Height') },
    { key: 'weight', label: t('Weight') },
    { key: 'wingspan', label: t('Wingspan') },
    { key: 'reach', label: t('Reach') },
    { key: 'bodyFat', label: t('Body Fat') },
    { key: 'pct', label: t('3PT %') },
    { key: 'shots', label: t('Shots') },
    { key: 'vitamins', label: t('Vitamins') },
    { key: 'weights', label: t('Weights') },
    { key: 'practice', label: t('Practice') },
    { key: 'game', label: t('Game') },
    { key: 'injury', label: t('Injury') },
    { key: 'nt', label: t('NT') },
    { key: 'daysOff', label: t('Days Off') },
  ];

  return (
    <div className={`rounded-xl border p-5 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} shadow-sm`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('Player Roster')}</h3>
        {canShowPerDay && (
          <div className={`inline-flex rounded-lg p-0.5 ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
            <button
              onClick={() => setViewMode('total')}
              className={`px-3 py-1 rounded-md text-[11px] font-medium transition-all ${viewMode === 'total' ? (isDark ? 'bg-orange-600 text-white shadow-sm' : 'bg-white text-gray-900 shadow-sm') : (isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700')}`}
            >
              {t('Total')}
            </button>
            <button
              onClick={() => setViewMode('perDay')}
              className={`px-3 py-1 rounded-md text-[11px] font-medium transition-all ${viewMode === 'perDay' ? (isDark ? 'bg-orange-600 text-white shadow-sm' : 'bg-white text-gray-900 shadow-sm') : (isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700')}`}
            >
              {t('Per Day')}
            </button>
          </div>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className={`border-b ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
              {columns.map(col => (
                <th key={col.key} onClick={() => handleSort(col.key)} className={thClass(col.align)} style={col.key === 'player' ? { paddingLeft: 8 } : undefined}>
                  {col.label}<SortIcon col={col.key} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map(row => (
              <tr key={row.player} onClick={() => onSelectPlayer(row.player)} className={`border-b cursor-pointer transition-colors ${isDark ? 'border-gray-800/50 hover:bg-gray-800/50' : 'border-gray-50 hover:bg-gray-50'}`}>
                <td className={`py-2.5 px-2 font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{row.player}</td>
                <td className={`text-center py-2.5 px-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{row.height ?? '—'}</td>
                <td className={`text-center py-2.5 px-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{row.weight ?? '—'}</td>
                <td className={`text-center py-2.5 px-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{row.wingspan ?? '—'}</td>
                <td className={`text-center py-2.5 px-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{row.reach ?? '—'}</td>
                <td className={`text-center py-2.5 px-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{row.bodyFat ?? '—'}</td>
                <td className={`text-center py-2.5 px-1 font-semibold ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>{row.pct != null ? `${row.pct}%` : '—'}</td>
                <td className={`text-center py-2.5 px-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{row.shots || '—'}</td>
                <td className={`text-center py-2.5 px-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{row.vitamins || '—'}</td>
                <td className={`text-center py-2.5 px-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{row.weights || '—'}</td>
                <td className={`text-center py-2.5 px-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{row.practice || '—'}</td>
                <td className={`text-center py-2.5 px-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{row.game || '—'}</td>
                <td className={`text-center py-2.5 px-1 ${row.injury > 0 ? 'text-red-500 font-semibold' : isDark ? 'text-gray-300' : 'text-gray-700'}`}>{row.injury || '—'}</td>
                <td className={`text-center py-2.5 px-1 ${row.nt > 0 ? 'text-blue-500 font-semibold' : isDark ? 'text-gray-300' : 'text-gray-700'}`}>{row.nt || '—'}</td>
                <td className={`text-center py-2.5 px-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{row.daysOff || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function getMonthLabel(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
}

function getWeekLabel(dateStr: string): string {
  const d = new Date(dateStr);
  const startOfYear = new Date(d.getFullYear(), 0, 1);
  const weekNum = Math.ceil(((d.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7);
  return `W${weekNum} ${d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}`;
}

function OverviewTab({ sessions, players, onSelectPlayer }: { sessions: VBSession[]; players: string[]; onSelectPlayer: (p: string) => void }) {
  const { t } = useLanguage();
  const isDark = useIsDark();
  const [selectedSeason, setSelectedSeason] = useState<string>(() => getCurrentSeason());
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedWeek, setSelectedWeek] = useState<string>('all');
  const [selectedDay, setSelectedDay] = useState<string>('all');
  
  const validSessions = useMemo(() => sessions.filter(s => getSeason(s.date) !== null), [sessions]);

  const seasons = useMemo(() => {
    const s = [...new Set(validSessions.map(s => getSeason(s.date)!))].sort().reverse();
    return s;
  }, [validSessions]);

  const seasonFiltered = useMemo(() => {
    if (selectedSeason === 'all') return validSessions;
    return validSessions.filter(s => getSeason(s.date) === selectedSeason);
  }, [validSessions, selectedSeason]);

  const months = useMemo(() => {
    const m = [...new Set(seasonFiltered.map(s => s.date.substring(0, 7)))].sort().reverse();
    return m;
  }, [seasonFiltered]);

  const monthFiltered = useMemo(() => {
    if (selectedMonth === 'all') return seasonFiltered;
    return seasonFiltered.filter(s => s.date.substring(0, 7) === selectedMonth);
  }, [seasonFiltered, selectedMonth]);

  const weeks = useMemo(() => {
    const wMap = new Map<string, string>();
    monthFiltered.forEach(s => {
      const d = new Date(s.date);
      const startOfYear = new Date(d.getFullYear(), 0, 1);
      const weekNum = Math.ceil(((d.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7);
      const key = `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
      if (!wMap.has(key)) wMap.set(key, getWeekLabel(s.date));
    });
    return [...wMap.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [monthFiltered]);

  const weekFiltered = useMemo(() => {
    if (selectedWeek === 'all') return monthFiltered;
    return monthFiltered.filter(s => {
      const d = new Date(s.date);
      const startOfYear = new Date(d.getFullYear(), 0, 1);
      const weekNum = Math.ceil(((d.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7);
      return `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}` === selectedWeek;
    });
  }, [monthFiltered, selectedWeek]);

  const days = useMemo(() => {
    return [...new Set(weekFiltered.map(s => s.date))].sort().reverse();
  }, [weekFiltered]);

  const filtered = useMemo(() => {
    if (selectedDay === 'all') return weekFiltered;
    return weekFiltered.filter(s => s.date === selectedDay);
  }, [weekFiltered, selectedDay]);

  useEffect(() => { setSelectedMonth('all'); setSelectedWeek('all'); setSelectedDay('all'); }, [selectedSeason]);
  useEffect(() => { setSelectedWeek('all'); setSelectedDay('all'); }, [selectedMonth]);
  useEffect(() => { setSelectedDay('all'); }, [selectedWeek]);

  const activePlayers = useMemo(() => {
    return [...new Set(filtered.map(s => s.player))].sort();
  }, [filtered]);

  const totalSessions = filtered.length;
  const avgShootingPct = getAvg(filtered.map(s => s.shootingPct));
  const injuredDays = filtered.filter(s => s.injured && s.injured > 0).length;
  const ntDays = filtered.filter(s => s.nationalTeam && s.nationalTeam > 0).length;

  const loadData = useMemo(() => {
    const buckets = new Map<string, { practice: number[]; vitamins: number[]; weights: number[]; game: number[] }>();
    filtered.forEach(s => {
      const m = s.date.substring(0, 7);
      if (!buckets.has(m)) buckets.set(m, { practice: [], vitamins: [], weights: [], game: [] });
      const entry = buckets.get(m)!;
      if (s.practiceLoad) entry.practice.push(s.practiceLoad);
      if (s.vitaminsLoad) entry.vitamins.push(s.vitaminsLoad);
      if (s.weightsLoad) entry.weights.push(s.weightsLoad);
      if (s.gameLoad) entry.game.push(s.gameLoad);
    });
    return [...buckets.entries()].sort().map(([month, data]) => ({
      month: month.substring(5) + '/' + month.substring(2, 4),
      practice: data.practice.length ? +(data.practice.reduce((a, b) => a + b, 0) / data.practice.length).toFixed(1) : 0,
      vitamins: data.vitamins.length ? +(data.vitamins.reduce((a, b) => a + b, 0) / data.vitamins.length).toFixed(1) : 0,
      weights: data.weights.length ? +(data.weights.reduce((a, b) => a + b, 0) / data.weights.length).toFixed(1) : 0,
      game: data.game.length ? +(data.game.reduce((a, b) => a + b, 0) / data.game.length).toFixed(1) : 0,
    }));
  }, [filtered]);

  const selectClass = `px-3 py-1.5 rounded-lg text-xs font-medium appearance-none pr-7 ${isDark ? 'bg-gray-800 text-gray-300 border-gray-700' : 'bg-white text-gray-700 border-gray-200'} border`;

  return (
    <div className="space-y-6">
      <div className={`grid grid-cols-4 gap-3 rounded-xl border p-3 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} shadow-sm`}>
        <div className="relative">
          <select value={selectedSeason} onChange={e => setSelectedSeason(e.target.value)} className={selectClass + ' w-full'}>
            <option value="all">{t('All Seasons')}</option>
            {seasons.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
        </div>
        <div className="relative">
          <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className={selectClass + ' w-full'}>
            <option value="all">{t('All Months')}</option>
            {months.map(m => {
              const d = new Date(m + '-01');
              return <option key={m} value={m}>{d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</option>;
            })}
          </select>
          <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
        </div>
        <div className="relative">
          <select value={selectedWeek} onChange={e => setSelectedWeek(e.target.value)} className={selectClass + ' w-full'}>
            <option value="all">{t('All Weeks')}</option>
            {weeks.map(([key, label]) => <option key={key} value={key}>{label}</option>)}
          </select>
          <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
        </div>
        <div className="relative">
          <select value={selectedDay} onChange={e => setSelectedDay(e.target.value)} className={selectClass + ' w-full'}>
            <option value="all">{t('All Days')}</option>
            {days.map(d => {
              const dt = new Date(d);
              return <option key={d} value={d}>{dt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</option>;
            })}
          </select>
          <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label={t('Players')} value={activePlayers.length} icon={Users} color="#3b82f6" />
        <StatCard label={t('Sessions')} value={totalSessions} icon={Activity} color="#10b981" />
        <StatCard label={t('3PT %')} value={avgShootingPct} unit="%" icon={Target} color="#f59e0b" subtitle={t('Team Average')} />
        <StatCard label={t('Availability')} value={totalSessions > 0 ? Math.round(((totalSessions - injuredDays) / totalSessions) * 100) : 0} unit="%" icon={Heart} color="#ef4444" subtitle={`${injuredDays} ${t('injury days')} · ${ntDays} NT`} />
      </div>

      <div className={`rounded-xl border p-5 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} shadow-sm`}>
        <h3 className={`text-sm font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('Training Load Trends')}</h3>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={loadData}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: isDark ? '#9ca3af' : '#6b7280' }} />
              <YAxis domain={[0, 4]} tick={{ fontSize: 10, fill: isDark ? '#9ca3af' : '#6b7280' }} />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12, backgroundColor: isDark ? '#1f2937' : '#fff', border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`, color: isDark ? '#f3f4f6' : '#111827' }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="practice" name={t('Practice')} fill="#3b82f6" radius={[2, 2, 0, 0]} />
              <Bar dataKey="vitamins" name={t('Vitamins')} fill="#8b5cf6" radius={[2, 2, 0, 0]} />
              <Bar dataKey="weights" name={t('Weights')} fill="#10b981" radius={[2, 2, 0, 0]} />
              <Bar dataKey="game" name={t('Game')} fill="#f59e0b" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <RosterTable filtered={filtered} activePlayers={activePlayers} onSelectPlayer={onSelectPlayer} isDark={isDark} selectedSeason={selectedSeason} />
    </div>
  );
}

function PlayerProfileTab({ sessions, players, initialPlayer }: { sessions: VBSession[]; players: string[]; initialPlayer: string }) {
  const { t } = useLanguage();
  const isDark = useIsDark();
  const [selectedPlayer, setSelectedPlayer] = useState(initialPlayer || players[0]);
  const [metricGroup, setMetricGroup] = useState<'anthro' | 'athletic' | 'shooting' | 'load'>('anthro');

  const ps = useMemo(() => getPlayerSessions(sessions, selectedPlayer), [sessions, selectedPlayer]);

  const latestAnthro = {
    height: getLatestMetric(sessions, selectedPlayer, 'height'),
    weight: getLatestMetric(sessions, selectedPlayer, 'weight'),
    wingspan: getLatestMetric(sessions, selectedPlayer, 'wingspan'),
    standingReach: getLatestMetric(sessions, selectedPlayer, 'standingReach'),
    bodyFat: getLatestMetric(sessions, selectedPlayer, 'bodyFat'),
  };

  const latestAthletic = {
    pureVertical: getLatestMetric(sessions, selectedPlayer, 'pureVertical'),
    noStepVertical: getLatestMetric(sessions, selectedPlayer, 'noStepVertical'),
    sprint: getLatestMetric(sessions, selectedPlayer, 'sprint'),
    coneDrill: getLatestMetric(sessions, selectedPlayer, 'coneDrill'),
    deadlift: getLatestMetric(sessions, selectedPlayer, 'deadlift'),
  };

  const shootingSessions = ps.filter(s => s.shootingPct !== null);
  const totalTaken = ps.reduce((a, s) => a + (s.shootsTaken || 0), 0);
  const totalMade = ps.reduce((a, s) => a + (s.shootsMade || 0), 0);
  const overallPct = totalTaken > 0 ? Math.round((totalMade / totalTaken) * 1000) / 10 : null;

  const chartData = useMemo(() => {
    const fields: Record<string, (keyof VBSession)[]> = {
      anthro: ['weight', 'bodyFat'],
      athletic: ['pureVertical', 'noStepVertical', 'deadlift'],
      shooting: ['shootingPct'],
      load: ['practiceLoad', 'vitaminsLoad', 'weightsLoad', 'gameLoad'],
    };
    const activeFields = fields[metricGroup];
    return ps.filter(s => activeFields.some(f => s[f] !== null)).map(s => {
      const entry: any = { date: s.date.substring(5) };
      activeFields.forEach(f => { entry[f] = s[f]; });
      return entry;
    });
  }, [ps, metricGroup]);

  const metricLabels: Record<string, string> = {
    weight: t('Weight') + ' (kg)', bodyFat: t('Body Fat') + ' (%)',
    pureVertical: t('Pure Vertical') + ' (cm)', noStepVertical: t('No-Step Vertical') + ' (cm)', deadlift: t('Deadlift') + ' (kg)',
    shootingPct: t('3PT %'),
    practiceLoad: t('Practice'), vitaminsLoad: t('Vitamins'), weightsLoad: t('Weights'), gameLoad: t('Game'),
  };

  const chartFields: Record<string, string[]> = {
    anthro: ['weight', 'bodyFat'],
    athletic: ['pureVertical', 'noStepVertical', 'deadlift'],
    shooting: ['shootingPct'],
    load: ['practiceLoad', 'vitaminsLoad', 'weightsLoad', 'gameLoad'],
  };

  const groups = [
    { id: 'anthro' as const, label: t('Anthropometrics'), icon: Ruler },
    { id: 'athletic' as const, label: t('Athletics'), icon: Zap },
    { id: 'shooting' as const, label: t('Shooting'), icon: Crosshair },
    { id: 'load' as const, label: t('Load'), icon: Activity },
  ];

  return (
    <div className="space-y-6">
      <div className="max-w-xs">
        <PlayerSelector players={players} selected={selectedPlayer} onChange={setSelectedPlayer} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <StatCard label={t('Height')} value={latestAnthro.height} unit=" cm" icon={Ruler} color="#3b82f6" />
        <StatCard label={t('Weight')} value={latestAnthro.weight} unit=" kg" icon={Weight} color="#10b981" />
        <StatCard label={t('Wingspan')} value={latestAnthro.wingspan} unit=" cm" icon={Ruler} color="#8b5cf6" />
        <StatCard label={t('Body Fat')} value={latestAnthro.bodyFat} unit="%" icon={Heart} color="#ef4444" />
        <StatCard label={t('3PT %')} value={overallPct} unit="%" icon={Target} color="#f59e0b" subtitle={`${totalMade}/${totalTaken}`} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <StatCard label={t('Pure Vertical')} value={latestAthletic.pureVertical} unit=" cm" icon={Zap} color="#06b6d4" />
        <StatCard label={t('No-Step Vertical')} value={latestAthletic.noStepVertical} unit=" cm" icon={Zap} color="#8b5cf6" />
        <StatCard label={t('Sprint')} value={latestAthletic.sprint} unit=" ms" icon={Timer} color="#f97316" />
        <StatCard label={t('Cone Drill')} value={latestAthletic.coneDrill} unit=" ms" icon={Timer} color="#ec4899" />
        <StatCard label={t('Deadlift')} value={latestAthletic.deadlift} unit=" kg" icon={Dumbbell} color="#10b981" />
      </div>

      <div className={`rounded-xl border p-5 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} shadow-sm`}>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('Progression')}</h3>
          <div className="flex gap-1">
            {groups.map(g => (
              <button
                key={g.id}
                onClick={() => setMetricGroup(g.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium flex items-center gap-1 transition-all ${
                  metricGroup === g.id
                    ? 'bg-orange-500 text-white'
                    : isDark ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                <g.icon size={11} />
                <span className="hidden sm:inline">{g.label}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: isDark ? '#9ca3af' : '#6b7280' }} />
              <YAxis tick={{ fontSize: 10, fill: isDark ? '#9ca3af' : '#6b7280' }} />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12, backgroundColor: isDark ? '#1f2937' : '#fff', border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`, color: isDark ? '#f3f4f6' : '#111827' }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {chartFields[metricGroup].map((f, i) => (
                <Line key={f} type="monotone" dataKey={f} name={metricLabels[f] || f} stroke={METRIC_COLORS[i]} strokeWidth={2} dot={{ r: 3 }} connectNulls />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={`rounded-xl border p-5 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} shadow-sm`}>
          <h3 className={`text-sm font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('Availability Log')}</h3>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {ps.filter(s => s.injured && s.injured > 0).length === 0 ? (
              <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{t('No injury records')}</p>
            ) : ps.filter(s => s.injured && s.injured > 0).reverse().slice(0, 20).map((s, i) => (
              <div key={i} className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-xs ${isDark ? 'bg-red-900/10' : 'bg-red-50'}`}>
                <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>{s.date}</span>
                <span className="text-red-500 font-medium">{t('Injury Level')} {s.injured}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={`rounded-xl border p-5 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} shadow-sm`}>
          <h3 className={`text-sm font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('Shooting History')}</h3>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {shootingSessions.length === 0 ? (
              <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{t('No shooting data')}</p>
            ) : shootingSessions.reverse().slice(0, 20).map((s, i) => (
              <div key={i} className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-xs ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>{s.date}</span>
                <span className={`font-semibold ${(s.shootingPct || 0) >= 40 ? 'text-emerald-500' : (s.shootingPct || 0) >= 30 ? 'text-amber-500' : 'text-red-500'}`}>
                  {s.shootsMade}/{s.shootsTaken} ({s.shootingPct}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function CompareTab({ sessions, players }: { sessions: VBSession[]; players: string[] }) {
  const { t } = useLanguage();
  const isDark = useIsDark();
  const [selected, setSelected] = useState<string[]>(players.slice(0, 2));

  const radarData = useMemo(() => {
    if (selected.length < 2) return [];
    const metrics = [
      { key: 'pureVertical', label: t('Pure Vertical'), max: 120 },
      { key: 'noStepVertical', label: t('No-Step V.'), max: 100 },
      { key: 'deadlift', label: t('Deadlift'), max: 200 },
      { key: 'shootingPct', label: t('3PT %'), max: 60 },
      { key: 'bodyFat', label: t('Body Fat'), max: 25, invert: true },
    ];
    return metrics.map(m => {
      const entry: any = { metric: m.label };
      selected.forEach(p => {
        let val = getLatestMetric(sessions, p, m.key as keyof VBSession);
        if (val !== null && m.max) {
          if ((m as any).invert) val = m.max - val;
          val = Math.round((val / m.max) * 100);
        }
        entry[p] = val || 0;
      });
      return entry;
    });
  }, [sessions, selected, t]);

  const comparisonData = useMemo(() => {
    const metrics: { key: keyof VBSession; label: string; unit: string }[] = [
      { key: 'height', label: t('Height'), unit: 'cm' },
      { key: 'weight', label: t('Weight'), unit: 'kg' },
      { key: 'wingspan', label: t('Wingspan'), unit: 'cm' },
      { key: 'standingReach', label: t('Standing Reach'), unit: 'cm' },
      { key: 'bodyFat', label: t('Body Fat'), unit: '%' },
      { key: 'pureVertical', label: t('Pure Vertical'), unit: 'cm' },
      { key: 'noStepVertical', label: t('No-Step Vertical'), unit: 'cm' },
      { key: 'sprint', label: t('Sprint'), unit: 'ms' },
      { key: 'coneDrill', label: t('Cone Drill'), unit: 'ms' },
      { key: 'deadlift', label: t('Deadlift'), unit: 'kg' },
    ];
    return metrics.map(m => ({
      ...m,
      values: selected.map(p => getLatestMetric(sessions, p, m.key)),
    }));
  }, [sessions, selected, t]);

  return (
    <div className="space-y-6">
      <div>
        <label className={`text-xs font-medium mb-2 block ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('Select players to compare')} ({t('max 4')})</label>
        <PlayerSelector players={players} selected={selected} onChange={setSelected} multiple />
      </div>

      {selected.length >= 2 && (
        <>
          <div className={`rounded-xl border p-5 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} shadow-sm`}>
            <h3 className={`text-sm font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('Performance Radar')}</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke={isDark ? '#374151' : '#e5e7eb'} />
                  <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10, fill: isDark ? '#9ca3af' : '#6b7280' }} />
                  <PolarRadiusAxis tick={{ fontSize: 9 }} domain={[0, 100]} />
                  {selected.map((p, i) => (
                    <Radar key={p} name={p.split(' ').pop()} dataKey={p} stroke={METRIC_COLORS[i]} fill={METRIC_COLORS[i]} fillOpacity={0.15} strokeWidth={2} />
                  ))}
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 11, backgroundColor: isDark ? '#1f2937' : '#fff', border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`, color: isDark ? '#f3f4f6' : '#111827' }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className={`rounded-xl border p-5 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} shadow-sm`}>
            <h3 className={`text-sm font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('Side by Side')}</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className={`border-b ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
                    <th className={`text-left py-2 px-2 font-semibold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('Metric')}</th>
                    {selected.map((p, i) => (
                      <th key={p} className="text-center py-2 px-2 font-semibold" style={{ color: METRIC_COLORS[i] }}>{p.split(' ').pop()}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {comparisonData.map(row => (
                    <tr key={row.key} className={`border-b ${isDark ? 'border-gray-800/50' : 'border-gray-50'}`}>
                      <td className={`py-2 px-2 font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{row.label} <span className="text-gray-400">({row.unit})</span></td>
                      {row.values.map((v, i) => {
                        const best = row.key === 'sprint' || row.key === 'coneDrill' || row.key === 'bodyFat'
                          ? Math.min(...row.values.filter(x => x !== null) as number[])
                          : Math.max(...row.values.filter(x => x !== null) as number[]);
                        const isBest = v === best && row.values.filter(x => x !== null).length > 1;
                        return (
                          <td key={i} className={`text-center py-2 px-2 ${isBest ? 'font-bold' : ''} ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                            {v !== null ? v : '—'}
                            {isBest && <span className="text-emerald-500 ml-1">●</span>}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function ProgressionTab({ sessions, players }: { sessions: VBSession[]; players: string[] }) {
  const { t } = useLanguage();
  const isDark = useIsDark();
  const [selected, setSelected] = useState<string[]>(players.slice(0, 3));
  const [metric, setMetric] = useState<keyof VBSession>('pureVertical');

  const metrics: { key: keyof VBSession; label: string; unit: string; group: string }[] = [
    { key: 'weight', label: t('Weight'), unit: 'kg', group: t('Anthropometrics') },
    { key: 'bodyFat', label: t('Body Fat'), unit: '%', group: t('Anthropometrics') },
    { key: 'pureVertical', label: t('Pure Vertical'), unit: 'cm', group: t('Athletics') },
    { key: 'noStepVertical', label: t('No-Step Vertical'), unit: 'cm', group: t('Athletics') },
    { key: 'sprint', label: t('Sprint'), unit: 'ms', group: t('Athletics') },
    { key: 'coneDrill', label: t('Cone Drill'), unit: 'ms', group: t('Athletics') },
    { key: 'deadlift', label: t('Deadlift'), unit: 'kg', group: t('Athletics') },
    { key: 'shootingPct', label: t('3PT %'), unit: '%', group: t('Shooting') },
  ];

  const chartData = useMemo(() => {
    const allDates = [...new Set(sessions.filter(s => selected.includes(s.player) && s[metric] !== null).map(s => s.date))].sort();
    return allDates.map(date => {
      const entry: any = { date: date.substring(5) };
      selected.forEach(p => {
        const session = sessions.find(s => s.player === p && s.date === date);
        entry[p] = session ? session[metric] : null;
      });
      return entry;
    });
  }, [sessions, selected, metric]);

  const deltaData = useMemo(() => {
    return selected.map(p => {
      const ps = sessions.filter(s => s.player === p && s[metric] !== null).sort((a, b) => a.date.localeCompare(b.date));
      if (ps.length < 2) return { player: p, first: null, last: null, delta: null };
      const first = ps[0][metric] as number;
      const last = ps[ps.length - 1][metric] as number;
      return { player: p, first, last, delta: Math.round((last - first) * 10) / 10 };
    });
  }, [sessions, selected, metric]);

  const currentMetric = metrics.find(m => m.key === metric);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <label className={`text-xs font-medium mb-2 block ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('Metric')}</label>
          <div className="relative">
            <select
              value={metric}
              onChange={e => setMetric(e.target.value as keyof VBSession)}
              className={`w-full px-3 py-2 rounded-lg text-sm font-medium appearance-none pr-8 ${isDark ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-gray-900 border-gray-200'} border`}
            >
              {metrics.map(m => <option key={m.key} value={m.key}>{m.label} ({m.unit})</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
          </div>
        </div>
        <div className="flex-1">
          <label className={`text-xs font-medium mb-2 block ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('Players')}</label>
          <PlayerSelector players={players} selected={selected} onChange={setSelected} multiple />
        </div>
      </div>

      <div className={`rounded-xl border p-5 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} shadow-sm`}>
        <h3 className={`text-sm font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {currentMetric?.label} {t('Over Time')} <span className="text-gray-400 font-normal">({currentMetric?.unit})</span>
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: isDark ? '#9ca3af' : '#6b7280' }} />
              <YAxis tick={{ fontSize: 10, fill: isDark ? '#9ca3af' : '#6b7280' }} />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12, backgroundColor: isDark ? '#1f2937' : '#fff', border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`, color: isDark ? '#f3f4f6' : '#111827' }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {selected.map((p, i) => (
                <Line key={p} type="monotone" dataKey={p} name={p.split(' ').pop()} stroke={METRIC_COLORS[i]} strokeWidth={2} dot={{ r: 3 }} connectNulls />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {deltaData.map((d, i) => (
          <div key={d.player} className={`rounded-xl border p-4 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} shadow-sm`}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: METRIC_COLORS[i] }} />
              <span className={`text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{d.player.split(' ').pop()}</span>
            </div>
            <div className="flex items-end gap-2">
              <span className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {d.last !== null ? d.last : '—'}
              </span>
              {d.delta !== null && (
                <span className={`text-xs font-semibold mb-0.5 ${
                  (metric === 'sprint' || metric === 'coneDrill' || metric === 'bodyFat')
                    ? (d.delta < 0 ? 'text-emerald-500' : d.delta > 0 ? 'text-red-500' : 'text-gray-400')
                    : (d.delta > 0 ? 'text-emerald-500' : d.delta < 0 ? 'text-red-500' : 'text-gray-400')
                }`}>
                  {d.delta > 0 ? '+' : ''}{d.delta} {currentMetric?.unit}
                </span>
              )}
            </div>
            <div className={`text-[10px] mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              {d.first !== null ? `${t('from')} ${d.first}` : t('No data')}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export const VBDashboard: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { t } = useLanguage();
  const isDark = useIsDark();
  const [sessions, setSessions] = useState<VBSession[]>([]);
  const [players, setPlayers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [selectedPlayer, setSelectedPlayer] = useState<string>('');
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async (refresh = false) => {
    try {
      if (refresh) setRefreshing(true);
      else setLoading(true);
      
      const res = await fetch(`/api/vb-data${refresh ? '?refresh=true' : ''}`);
      const json = await res.json();
      
      if (json.success) {
        setSessions(json.data);
        setPlayers(json.players);
        if (json.players.length > 0 && !selectedPlayer) setSelectedPlayer(json.players[0]);
      } else {
        setError(json.message || 'Failed to load data');
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSelectPlayer = (p: string) => {
    setSelectedPlayer(p);
    setActiveTab('player');
  };

  const tabs: { id: TabId; label: string; icon: any }[] = [
    { id: 'overview', label: t('Overview'), icon: BarChart3 },
    { id: 'player', label: t('Player Profile'), icon: User },
    { id: 'compare', label: t('Compare'), icon: GitCompare },
    { id: 'progression', label: t('Progression'), icon: TrendingUp },
  ];

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-[#0a0a0a]' : 'bg-gray-50'}`}>
        <div className="text-center">
          <Loader2 size={32} className="animate-spin mx-auto mb-3 text-orange-500" />
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('Loading VB data...')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#0a0a0a] text-white' : 'bg-gray-50 text-gray-900'}`}>
      <header className={`sticky top-0 z-40 border-b backdrop-blur-xl ${isDark ? 'bg-[#0a0a0a]/90 border-gray-800' : 'bg-white/90 border-gray-200'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <button onClick={onBack} className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
                <ArrowLeft size={18} />
              </button>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-orange-500/10 flex items-center justify-center">
                  <Activity size={15} className="text-orange-500" />
                </div>
                <div>
                  <h1 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>BOps · VB</h1>
                  <p className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Varese Basketball</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => fetchData(true)}
              disabled={refreshing}
              className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
            >
              <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
            </button>
          </div>

          <div className="flex gap-1 -mb-px overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? `border-orange-500 ${isDark ? 'text-orange-400' : 'text-orange-600'}`
                    : `border-transparent ${isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`
                }`}
              >
                <tab.icon size={13} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {error && (
          <div className="mb-4 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        {sessions.length === 0 && !error ? (
          <div className="text-center py-20">
            <Activity size={40} className={`mx-auto mb-3 ${isDark ? 'text-gray-700' : 'text-gray-300'}`} />
            <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{t('No VB data available')}</p>
          </div>
        ) : (
          <>
            {activeTab === 'overview' && <OverviewTab sessions={sessions} players={players} onSelectPlayer={handleSelectPlayer} />}
            {activeTab === 'player' && <PlayerProfileTab sessions={sessions} players={players} initialPlayer={selectedPlayer} />}
            {activeTab === 'compare' && <CompareTab sessions={sessions} players={players} />}
            {activeTab === 'progression' && <ProgressionTab sessions={sessions} players={players} />}
          </>
        )}
      </main>
    </div>
  );
};
