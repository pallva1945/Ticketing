import React, { useState, useEffect, useMemo } from 'react';
import { Activity, Users, User, GitCompare, TrendingUp, RefreshCw, Ruler, Weight, Target, Zap, Timer, Dumbbell, ChevronDown, ArrowLeft, Crosshair, Heart, Flag, BarChart3, Loader2, ArrowUpDown, ArrowUp, ArrowDown, Calendar, CalendarDays, Pill, Gamepad2, CalendarOff, ArrowUpFromDot, Gauge, Printer, Trophy, Search, Star, Eye, ExternalLink, MapPin, Globe, Video, ChevronUp, BookOpen, CircleDot, Footprints, Hand, Move, CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, BarChart, Bar, CartesianGrid, Legend, ReferenceLine, ReferenceArea, Cell, ComposedChart } from 'recharts';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { PV_LOGO_URL } from '../constants';
import { CoachesResourcesTab } from './VBCoachesResources';

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

interface PlayerProfile {
  name: string;
  email: string | null;
  cellNumber: string | null;
  momHeight: number | null;
  dadHeight: number | null;
  dob: string | null;
  role: string | null;
  midParentalHeight: number | null;
  mugShot: string | null;
  season: string | null;
  passport: string | null;
  italianFormation: number | null;
  soyStatus: string | null;
  eoyStatus: string | null;
  year1Destination: string | null;
  revenueGenerated: number | null;
}

interface VBProspect {
  name: string;
  dob: string | null;
  age: number | null;
  height: number | null;
  weight: number | null;
  wingspan: number | null;
  position: string | null;
  secondaryPosition: string | null;
  nationality: string | null;
  secondNationality: string | null;
  passport: string | null;
  teamSchool: string | null;
  language: string | null;
  headshot: string | null;
  video: string | null;
  handlerName: string | null;
  strength: number | null;
  speed: number | null;
  quickness: number | null;
  motor: number | null;
  stamina: number | null;
  athleticismNotes: string | null;
  dribbling: number | null;
  passing: number | null;
  finishing: number | null;
  shooting: number | null;
  defense: number | null;
  basketballIQ: number | null;
  skillsNotes: string | null;
  likeliness: number | null;
  workEthic: number | null;
  coachable: number | null;
  teammate: number | null;
  lifePersonality: number | null;
  generalNotes: string | null;
  timestamp: string | null;
}

type TabId = 'overview' | 'performance' | 'gameperf' | 'player' | 'compare' | 'progression' | 'search' | 'prospects' | 'resources';

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

const SEASON_START_DATES: Record<string, Date> = {
  '2024/25': new Date(2024, 7, 23),
  '2025/26': new Date(2025, 7, 11),
  '2026/27': new Date(2026, 7, 3),
};

const SEASON_END_DATES: Record<string, Date> = {
  '2024/25': new Date(2025, 5, 28),
  '2025/26': new Date(2026, 5, 26),
};

function getSeason(dateStr: string): string | null {
  if (!dateStr || dateStr === 'unknown') return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  if (year < 2000) return null;
  const candidateSeason = month >= 7 ? `${year}/${(year + 1).toString().slice(2)}` : `${year - 1}/${year.toString().slice(2)}`;
  const start = SEASON_START_DATES[candidateSeason];
  const end = SEASON_END_DATES[candidateSeason];
  if (start && d < start) return null;
  if (end && d > end) return null;
  return candidateSeason;
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
            {p.split(' ').pop()}
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

type SortKey = 'player' | 'height' | 'projHeight' | 'reach' | 'projReach' | 'pureVertical' | 'sprint' | 'coneDrill' | 'weight' | 'wingspan' | 'bodyFat' | 'pct' | 'shots' | 'totalLoad' | 'vitamins' | 'weights' | 'practice' | 'game' | 'injury' | 'nt' | 'daysOff';
type SortDir = 'asc' | 'desc';

interface RosterRow {
  player: string;
  height: number | null;
  projHeight: number | null;
  reach: number | null;
  projReach: number | null;
  pureVertical: number | null;
  sprint: number | null;
  coneDrill: number | null;
  weight: number | null;
  wingspan: number | null;
  bodyFat: number | null;
  pct: number | null;
  shots: number;
  totalLoad: number;
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

function matchesPlayerName(profileName: string, sessionPlayer: string): boolean {
  const a = profileName.toLowerCase().trim();
  const b = sessionPlayer.toLowerCase().trim();
  return a === b || a.includes(b) || b.includes(a);
}

function excelSerialToDate(serial: number): Date {
  return new Date(Date.UTC(1899, 11, 30 + serial));
}

function calcBodyFatPct(skinfoldSum: number, dobSerial: number | null, sessionDate?: string): number | null {
  if (!dobSerial || skinfoldSum <= 0) return null;
  const dob = excelSerialToDate(dobSerial);
  const ref = sessionDate ? new Date(sessionDate) : new Date();
  let age = ref.getFullYear() - dob.getFullYear();
  const m = ref.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && ref.getDate() < dob.getDate())) age--;
  if (age < 5 || age > 60) return null;
  const S = skinfoldSum;
  const BD = 1.10938 - (0.0008267 * S) + (0.0000016 * S * S) - (0.0002574 * age);
  if (BD <= 0) return null;
  const bfPct = (495 / BD) - 450;
  return Math.round(bfPct * 10) / 10;
}

function getPlayerDobSerial(player: string, profiles: PlayerProfile[]): number | null {
  for (const p of profiles) {
    if (matchesPlayerName(p.name, player) && p.dob) {
      const n = Number(p.dob);
      if (!isNaN(n) && n > 10000) return n;
    }
  }
  return null;
}

function getPlayerPosition(player: string, profiles: PlayerProfile[]): string {
  for (const p of profiles) {
    if (matchesPlayerName(p.name, player)) {
      return p.role || '';
    }
  }
  return '';
}

function getPlayerBirthYear(player: string, profiles: PlayerProfile[]): number | null {
  const dobSerial = getPlayerDobSerial(player, profiles);
  if (!dobSerial) return null;
  const dob = excelSerialToDate(dobSerial);
  return dob.getFullYear();
}

function getPlayerCategory(player: string, profiles: PlayerProfile[], season?: string): string {
  const year = getPlayerBirthYear(player, profiles);
  if (!year) return '';
  const endYear = season ? parseInt(season.split('/')[0]) + 1 : 2026;
  if (year >= endYear - 15 && year <= endYear - 14) return 'U15';
  if (year >= endYear - 17 && year <= endYear - 16) return 'U17';
  if (year >= endYear - 19 && year <= endYear - 18) return 'U19';
  if (year >= endYear - 21 && year <= endYear - 20) return 'DY';
  return '';
}

const KR_TABLE: { age: number; wt: number; ht: number; mph: number; beta: number }[] = [
  { age: 4,    wt: -0.087235, ht: 1.23812, mph: 0.50286, beta: -10.2567 },
  { age: 4.5,  wt: -0.074454, ht: 1.15964, mph: 0.52887, beta: -10.719 },
  { age: 5,    wt: -0.064778, ht: 1.10674, mph: 0.53919, beta: -11.0213 },
  { age: 5.5,  wt: -0.05776,  ht: 1.0748,  mph: 0.53691, beta: -11.1556 },
  { age: 6,    wt: -0.052947, ht: 1.05923, mph: 0.52513, beta: -11.1138 },
  { age: 6.5,  wt: -0.049892, ht: 1.05542, mph: 0.50692, beta: -11.0221 },
  { age: 7,    wt: -0.048144, ht: 1.05877, mph: 0.48538, beta: -10.9984 },
  { age: 7.5,  wt: -0.047256, ht: 1.06467, mph: 0.46361, beta: -11.0214 },
  { age: 8,    wt: -0.046778, ht: 1.06853, mph: 0.44469, beta: -11.0696 },
  { age: 8.5,  wt: -0.046261, ht: 1.06572, mph: 0.43171, beta: -11.122 },
  { age: 9,    wt: -0.045254, ht: 1.05166, mph: 0.42776, beta: -11.1571 },
  { age: 9.5,  wt: -0.043311, ht: 1.02174, mph: 0.43593, beta: -11.1405 },
  { age: 10,   wt: -0.039981, ht: 0.97135, mph: 0.45932, beta: -11.038 },
  { age: 10.5, wt: -0.034814, ht: 0.89589, mph: 0.50101, beta: -10.8286 },
  { age: 11,   wt: -0.02905,  ht: 0.81239, mph: 0.54781, beta: -10.4917 },
  { age: 11.5, wt: -0.024167, ht: 0.74134, mph: 0.58409, beta: -10.0065 },
  { age: 12,   wt: -0.020076, ht: 0.68325, mph: 0.60927, beta: -9.3522 },
  { age: 12.5, wt: -0.016681, ht: 0.63869, mph: 0.62279, beta: -8.6055 },
  { age: 13,   wt: -0.013895, ht: 0.60818, mph: 0.62407, beta: -7.8632 },
  { age: 13.5, wt: -0.011624, ht: 0.59228, mph: 0.61253, beta: -7.1348 },
  { age: 14,   wt: -0.009776, ht: 0.59151, mph: 0.58762, beta: -6.4299 },
  { age: 14.5, wt: -0.008261, ht: 0.60643, mph: 0.54875, beta: -5.7578 },
  { age: 15,   wt: -0.006988, ht: 0.63757, mph: 0.49536, beta: -5.1282 },
  { age: 15.5, wt: -0.005863, ht: 0.68548, mph: 0.42687, beta: -4.5092 },
  { age: 16,   wt: -0.004795, ht: 0.75069, mph: 0.34271, beta: -3.9292 },
  { age: 16.5, wt: -0.003695, ht: 0.83375, mph: 0.24231, beta: -3.4873 },
  { age: 17,   wt: -0.00247,  ht: 0.9352,  mph: 0.1251,  beta: -3.283 },
  { age: 17.5, wt: -0.001027, ht: 1.05558, mph: -0.0095, beta: -3.4156 },
];

function getKRCoefficients(age: number): { wt: number; ht: number; mph: number; beta: number } {
  if (age <= KR_TABLE[0].age) return KR_TABLE[0];
  if (age >= KR_TABLE[KR_TABLE.length - 1].age) return KR_TABLE[KR_TABLE.length - 1];
  let lo = KR_TABLE[0], hi = KR_TABLE[1];
  for (let i = 0; i < KR_TABLE.length - 1; i++) {
    if (age >= KR_TABLE[i].age && age <= KR_TABLE[i + 1].age) {
      lo = KR_TABLE[i];
      hi = KR_TABLE[i + 1];
      break;
    }
  }
  if (lo.age === hi.age) return lo;
  const frac = (age - lo.age) / (hi.age - lo.age);
  return {
    wt: lo.wt + frac * (hi.wt - lo.wt),
    ht: lo.ht + frac * (hi.ht - lo.ht),
    mph: lo.mph + frac * (hi.mph - lo.mph),
    beta: lo.beta + frac * (hi.beta - lo.beta),
  };
}

function getProjectedHeight(player: string, profiles: PlayerProfile[], sessions: VBSession[]): number | null {
  const profile = getPlayerProfile(player, profiles);
  if (!profile || profile.momHeight == null || profile.dadHeight == null) return null;
  const dobSerial = getPlayerDobSerial(player, profiles);
  if (!dobSerial) return null;

  const playerSessions = getPlayerSessions(sessions, player)
    .filter(s => s.height !== null && s.weight !== null)
    .sort((a, b) => b.date.localeCompare(a.date));
  if (playerSessions.length === 0) return null;
  const latest = playerSessions[0];
  const currentHeightCm = latest.height!;
  const currentWeightKg = latest.weight!;

  const dobDate = excelSerialToDate(dobSerial);
  const sessionDate = new Date(latest.date);
  const ageYears = (sessionDate.getTime() - dobDate.getTime()) / (365.25 * 86400000);

  const coeffs = getKRCoefficients(ageYears);

  const currentHeightIn = currentHeightCm / 2.54;
  const currentWeightLbs = currentWeightKg * 2.20462;
  const dadHeightIn = profile.dadHeight / 2.54;
  const momHeightIn = profile.momHeight / 2.54;
  const mph = (dadHeightIn + momHeightIn) / 2;

  const predictedIn = coeffs.beta + (coeffs.ht * currentHeightIn) + (coeffs.wt * currentWeightLbs) + (coeffs.mph * mph);
  let predictedCm = predictedIn * 2.54;

  if (predictedCm < currentHeightCm) predictedCm = currentHeightCm;

  return Math.round(predictedCm * 10) / 10;
}

function getProjectedReach(player: string, profiles: PlayerProfile[], sessions: VBSession[]): number | null {
  const projectedHeight = getProjectedHeight(player, profiles, sessions);
  if (projectedHeight === null) return null;

  const playerSessions = getPlayerSessions(sessions, player);
  const latestWithBoth = playerSessions
    .filter(s => s.height !== null && s.standingReach !== null)
    .sort((a, b) => b.date.localeCompare(a.date));
  if (latestWithBoth.length === 0) return null;

  const currentHeight = latestWithBoth[0].height!;
  const currentReach = latestWithBoth[0].standingReach!;
  if (currentHeight <= 0) return null;

  const growthRatio = projectedHeight / currentHeight;
  let projectedReach = currentReach * growthRatio;

  if (projectedReach < currentReach) projectedReach = currentReach;

  return Math.round(projectedReach * 10) / 10;
}

function getPlayerProfile(player: string, profiles: PlayerProfile[], season?: string): PlayerProfile | null {
  let match: PlayerProfile | null = null;
  for (const p of profiles) {
    if (matchesPlayerName(p.name, player)) {
      if (season && p.season === season) return p;
      if (!match) match = p;
    }
  }
  return match;
}

const PLAYER_START_OVERRIDES: Record<string, Record<string, Date>> = {
  '2025/26': {
    'filippo ciocchetti': new Date(2025, 11, 1),
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
  const seasonEnd = SEASON_END_DATES[selectedSeason];
  const fallbackEnd = (() => { const parts = selectedSeason.match(/^(\d{4})\//); const sy = parts ? parseInt(parts[1], 10) : new Date().getFullYear(); return new Date(sy + 1, 5, 30); })();
  const endDate = seasonEnd || fallbackEnd;
  const now = new Date();
  const end = now < endDate ? now : endDate;
  return Math.max(1, Math.ceil((end.getTime() - seasonStart.getTime()) / 86400000));
}

function RosterTable({ filtered, activePlayers, onSelectPlayer, isDark, selectedSeason, profiles }: { filtered: VBSession[]; activePlayers: string[]; onSelectPlayer: (p: string) => void; isDark: boolean; selectedSeason: string; profiles: PlayerProfile[] }) {
  const { t } = useLanguage();
  const [sortKey, setSortKey] = useState<SortKey>('player');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [viewMode, setViewMode] = useState<'total' | 'perDay' | 'perWeek' | 'perMonth'>('total');

  const baseSeasonDays = useMemo(() => getSeasonDays(selectedSeason), [selectedSeason]);
  const canShowRates = baseSeasonDays > 0;

  useEffect(() => {
    if (!canShowRates && viewMode !== 'total') setViewMode('total');
  }, [canShowRates]);

  const rows: RosterRow[] = useMemo(() => activePlayers.map(player => {
    const ps = getPlayerSessions(filtered, player);
    const shootingSessions = ps.filter(s => s.shootingPct !== null);
    const playerSeasonDays = getSeasonDays(selectedSeason, player);
    const isRate = viewMode !== 'total' && canShowRates;
    const divisor = viewMode === 'perWeek' ? playerSeasonDays / 7 : viewMode === 'perMonth' ? playerSeasonDays / 30 : playerSeasonDays;

    const sumOrRate = (values: (number | null)[]): number => {
      const valid = values.filter(v => v !== null && v !== undefined) as number[];
      if (valid.length === 0) return 0;
      const total = valid.reduce((a, b) => a + b, 0);
      return isRate ? Math.round((total / divisor) * 10) / 10 : total;
    };

    const injuryDateSet = new Set(ps.filter(s => s.injured !== null && s.injured > 0).map(s => s.date));
    const ntDateSet = new Set(ps.filter(s => s.nationalTeam !== null && s.nationalTeam > 0).map(s => s.date));
    const seasonStartDate = getSeasonStartDate(selectedSeason, player);
    const psInRange = seasonStartDate ? ps.filter(s => new Date(s.date) >= seasonStartDate) : ps;
    const activeDateSet = new Set<string>();
    for (const s of psInRange) {
      if ((s.vitaminsLoad || 0) > 0 || (s.weightsLoad || 0) > 0 || (s.practiceLoad || 0) > 0 || (s.gameLoad || 0) > 0 || (s.injured !== null && s.injured > 0) || (s.nationalTeam !== null && s.nationalTeam > 0)) {
        activeDateSet.add(s.date);
      }
    }
    const rawDaysOff = Math.max(0, playerSeasonDays - activeDateSet.size);
    const injuryVal = isRate ? Math.round((injuryDateSet.size / divisor) * 10) / 10 : injuryDateSet.size;
    const ntVal = isRate ? Math.round((ntDateSet.size / divisor) * 10) / 10 : ntDateSet.size;
    const daysOffVal = isRate ? Math.round((rawDaysOff / divisor) * 10) / 10 : rawDaysOff;

    const vitamins = sumOrRate(ps.map(s => s.vitaminsLoad));
    const weights = sumOrRate(ps.map(s => s.weightsLoad));
    const practice = sumOrRate(ps.map(s => s.practiceLoad));
    const game = sumOrRate(ps.map(s => s.gameLoad));

    return {
      player,
      height: getLatestMetric(filtered, player, 'height'),
      projHeight: getProjectedHeight(player, profiles, filtered),
      reach: getLatestMetric(filtered, player, 'standingReach'),
      projReach: getProjectedReach(player, profiles, filtered),
      pureVertical: (() => {
        const pv = getLatestMetric(filtered, player, 'pureVertical');
        const sr = getLatestMetric(filtered, player, 'standingReach');
        return (pv !== null && sr !== null) ? pv - sr : pv;
      })(),
      sprint: getLatestMetric(filtered, player, 'sprint'),
      coneDrill: getLatestMetric(filtered, player, 'coneDrill'),
      weight: getLatestMetric(filtered, player, 'weight'),
      wingspan: getLatestMetric(filtered, player, 'wingspan'),
      bodyFat: (() => {
        const rawSF = getLatestMetric(filtered, player, 'bodyFat');
        if (rawSF === null) return null;
        const dobSerial = getPlayerDobSerial(player, profiles);
        const latestSession = getPlayerSessions(filtered, player).filter(s => s.bodyFat !== null).sort((a, b) => b.date.localeCompare(a.date))[0];
        const bf = calcBodyFatPct(rawSF, dobSerial, latestSession?.date);
        return bf !== null ? bf : rawSF;
      })(),
      pct: getAvg(shootingSessions.map(s => s.shootingPct)),
      shots: sumOrRate(ps.map(s => s.shootsTaken)),
      totalLoad: Math.round((vitamins + weights + practice + game) * 10) / 10,
      vitamins,
      weights,
      practice,
      game,
      injury: injuryVal,
      nt: ntVal,
      daysOff: daysOffVal,
    };
  }), [filtered, activePlayers, viewMode, selectedSeason, profiles]);

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
    { key: 'projHeight', label: t('P.Height') },
    { key: 'reach', label: t('Reach') },
    { key: 'projReach', label: t('P.Reach') },
    { key: 'pureVertical', label: t('Pure Vertical') },
    { key: 'sprint', label: t('Sprint') },
    { key: 'coneDrill', label: t('Cone Drill') },
    { key: 'bodyFat', label: t('BF %') },
    { key: 'pct', label: t('3PT %') },
    { key: 'shots', label: t('Shots') },
    { key: 'totalLoad', label: t('T.Load') },
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
        {canShowRates && (
          <div className={`inline-flex rounded-lg p-0.5 ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
            {(['total', 'perDay', 'perWeek', 'perMonth'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1 rounded-md text-[11px] font-medium transition-all ${viewMode === mode ? (isDark ? 'bg-orange-600 text-white shadow-sm' : 'bg-white text-gray-900 shadow-sm') : (isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700')}`}
              >
                {t(mode === 'total' ? 'Total' : mode === 'perDay' ? 'Per Day' : mode === 'perWeek' ? 'Per Week' : 'Per Month')}
              </button>
            ))}
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
                <td className={`text-center py-2.5 px-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{row.projHeight ?? '—'}</td>
                <td className={`text-center py-2.5 px-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{row.reach ?? '—'}</td>
                <td className={`text-center py-2.5 px-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{row.projReach ?? '—'}</td>
                <td className={`text-center py-2.5 px-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{row.pureVertical ?? '—'}</td>
                <td className={`text-center py-2.5 px-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{row.sprint ?? '—'}</td>
                <td className={`text-center py-2.5 px-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{row.coneDrill ?? '—'}</td>
                <td className={`text-center py-2.5 px-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{row.bodyFat != null ? `${row.bodyFat}%` : '—'}</td>
                <td className={`text-center py-2.5 px-1 font-semibold ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>{row.pct != null ? `${row.pct}%` : '—'}</td>
                <td className={`text-center py-2.5 px-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{row.shots || '—'}</td>
                <td className={`text-center py-2.5 px-1 font-semibold ${isDark ? 'text-sky-400' : 'text-sky-600'}`}>{row.totalLoad || '—'}</td>
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


function OverviewTab({ sessions, players, onSelectPlayer, profiles }: { sessions: VBSession[]; players: string[]; onSelectPlayer: (p: string) => void; profiles: PlayerProfile[] }) {
  const { t } = useLanguage();
  const isDark = useIsDark();
  const [selectedSeason, setSelectedSeason] = useState<string>(() => getCurrentSeason());
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedWeek, setSelectedWeek] = useState<string>('all');
  const [selectedDay, setSelectedDay] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedPlayerFilter, setSelectedPlayerFilter] = useState<string>('all');
  
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

  const getSeasonWeek = (dateStr: string, season: string): number => {
    const d = new Date(dateStr);
    const startDate = SEASON_START_DATES[season];
    const start = startDate || new Date(parseInt(season.split('/')[0]), 7, 1);
    const diffDays = Math.floor((d.getTime() - start.getTime()) / 86400000);
    return Math.floor(diffDays / 7) + 1;
  };

  const monthWeekRanges = useMemo(() => {
    const monthOrder = ['08', '09', '10', '11', '12', '01', '02', '03', '04', '05', '06'];
    const result = new Map<string, [number, number]>();
    const season = selectedSeason === 'all' ? getCurrentSeason() : selectedSeason;
    const startYear = parseInt(season.split('/')[0]);
    monthOrder.forEach((mm, idx) => {
      const yyyy = parseInt(mm) >= 8 ? startYear : startYear + 1;
      const key = `${yyyy}-${mm}`;
      const w1 = idx * 4 + 1;
      const w4 = idx * 4 + 4;
      result.set(key, [w1, w4]);
    });
    return result;
  }, [selectedSeason]);

  const monthFiltered = useMemo(() => {
    if (selectedMonth === 'all') return seasonFiltered;
    const season = selectedSeason === 'all' ? getCurrentSeason() : selectedSeason;
    const range = monthWeekRanges.get(selectedMonth);
    if (!range) return seasonFiltered.filter(s => s.date.substring(0, 7) === selectedMonth);
    const [w1, w4] = range;
    return seasonFiltered.filter(s => {
      const w = getSeasonWeek(s.date, season);
      return w >= w1 && w <= w4;
    });
  }, [seasonFiltered, selectedMonth, selectedSeason, monthWeekRanges]);

  const weeks = useMemo(() => {
    const season = selectedSeason === 'all' ? getCurrentSeason() : selectedSeason;
    if (selectedMonth !== 'all') {
      const range = monthWeekRanges.get(selectedMonth);
      if (range) {
        const [w1, w4] = range;
        const dataWeeks = new Set(monthFiltered.map(s => getSeasonWeek(s.date, season)));
        return [w1, w1 + 1, w1 + 2, w1 + 3]
          .filter(w => w <= w4 && dataWeeks.has(w))
          .map(w => [`W${w}`, `Week ${w}`] as [string, string]);
      }
    }
    const wSet = new Set<number>();
    monthFiltered.forEach(s => {
      const w = getSeasonWeek(s.date, season);
      if (w > 0) wSet.add(w);
    });
    return [...wSet].sort((a, b) => a - b).map(w => [`W${w}`, `Week ${w}`] as [string, string]);
  }, [monthFiltered, selectedMonth, selectedSeason, monthWeekRanges]);

  const weekFiltered = useMemo(() => {
    if (selectedWeek === 'all') return monthFiltered;
    const weekNum = parseInt(selectedWeek.replace('W', ''));
    const season = selectedSeason === 'all' ? getCurrentSeason() : selectedSeason;
    return monthFiltered.filter(s => getSeasonWeek(s.date, season) === weekNum);
  }, [monthFiltered, selectedWeek, selectedSeason]);

  const days = useMemo(() => {
    return [...new Set(weekFiltered.map(s => s.date))].sort().reverse();
  }, [weekFiltered]);

  const dayFiltered = useMemo(() => {
    if (selectedDay === 'all') return weekFiltered;
    return weekFiltered.filter(s => s.date === selectedDay);
  }, [weekFiltered, selectedDay]);

  const availableCategories = useMemo(() => {
    const cats = [...new Set(dayFiltered.map(s => getPlayerCategory(s.player, profiles, selectedSeason !== 'all' ? selectedSeason : undefined)).filter(c => c))].sort();
    return cats;
  }, [dayFiltered, profiles, selectedSeason]);

  const categoryFiltered = useMemo(() => {
    if (selectedCategory === 'all') return dayFiltered;
    return dayFiltered.filter(s => getPlayerCategory(s.player, profiles, selectedSeason !== 'all' ? selectedSeason : undefined) === selectedCategory);
  }, [dayFiltered, selectedCategory, profiles, selectedSeason]);

  const availableRoles = useMemo(() => {
    const roles = [...new Set(categoryFiltered.map(s => getPlayerPosition(s.player, profiles)).filter(r => r))].sort();
    return roles;
  }, [categoryFiltered, profiles]);

  const roleFiltered = useMemo(() => {
    if (selectedRole === 'all') return categoryFiltered;
    return categoryFiltered.filter(s => getPlayerPosition(s.player, profiles) === selectedRole);
  }, [categoryFiltered, selectedRole, profiles]);

  const playersInFilter = useMemo(() => {
    return [...new Set(roleFiltered.map(s => s.player))].sort();
  }, [roleFiltered]);

  const filtered = useMemo(() => {
    if (selectedPlayerFilter === 'all') return roleFiltered;
    return roleFiltered.filter(s => s.player === selectedPlayerFilter);
  }, [roleFiltered, selectedPlayerFilter]);

  useEffect(() => { setSelectedMonth('all'); setSelectedWeek('all'); setSelectedDay('all'); setSelectedCategory('all'); setSelectedRole('all'); setSelectedPlayerFilter('all'); }, [selectedSeason]);
  useEffect(() => { setSelectedWeek('all'); setSelectedDay('all'); }, [selectedMonth]);
  useEffect(() => { setSelectedDay('all'); }, [selectedWeek]);
  useEffect(() => { setSelectedRole('all'); setSelectedPlayerFilter('all'); }, [selectedCategory]);
  useEffect(() => { setSelectedPlayerFilter('all'); }, [selectedRole]);

  const activePlayers = useMemo(() => {
    return [...new Set(filtered.map(s => s.player))].sort();
  }, [filtered]);

  const totalSessions = filtered.length;
  const avgShootingPct = getAvg(filtered.map(s => s.shootingPct));
  const injuredDays = new Set(filtered.filter(s => s.injured && s.injured > 0).map(s => s.player + '|' + s.date)).size;
  const ntDays = new Set(filtered.filter(s => s.nationalTeam && s.nationalTeam > 0).map(s => s.player + '|' + s.date)).size;

  const teamAvgVitamins = useMemo(() => {
    const playerTotals = activePlayers.map(p => {
      const vals = filtered.filter(s => s.player === p && s.vitaminsLoad).map(s => s.vitaminsLoad!);
      return vals.reduce((a, b) => a + b, 0);
    });
    return playerTotals.length ? Math.round(playerTotals.reduce((a, b) => a + b, 0) / playerTotals.length * 10) / 10 : null;
  }, [filtered, activePlayers]);
  const teamAvgWeights = useMemo(() => {
    const playerTotals = activePlayers.map(p => {
      const vals = filtered.filter(s => s.player === p && s.weightsLoad).map(s => s.weightsLoad!);
      return vals.reduce((a, b) => a + b, 0);
    });
    return playerTotals.length ? Math.round(playerTotals.reduce((a, b) => a + b, 0) / playerTotals.length * 10) / 10 : null;
  }, [filtered, activePlayers]);
  const teamAvgGame = useMemo(() => {
    const playerTotals = activePlayers.map(p => {
      const vals = filtered.filter(s => s.player === p && s.gameLoad).map(s => s.gameLoad!);
      return vals.reduce((a, b) => a + b, 0);
    });
    return playerTotals.length ? Math.round(playerTotals.reduce((a, b) => a + b, 0) / playerTotals.length * 10) / 10 : null;
  }, [filtered, activePlayers]);
  const teamAvgTotalLoad = useMemo(() => {
    const playerTotals = activePlayers.map(p => {
      const ps = filtered.filter(s => s.player === p);
      return ps.reduce((sum, s) => sum + (s.practiceLoad || 0) + (s.vitaminsLoad || 0) + (s.weightsLoad || 0) + (s.gameLoad || 0), 0);
    });
    if (!playerTotals.length) return null;
    const avg = playerTotals.reduce((a, b) => a + b, 0) / playerTotals.length;
    return avg > 0 ? Math.round(avg * 10) / 10 : null;
  }, [filtered, activePlayers]);
  const teamAvgInjuries = useMemo(() => {
    const playerCounts = activePlayers.map(p => {
      return new Set(filtered.filter(s => s.player === p && s.injured && s.injured > 0).map(s => s.date)).size;
    });
    return playerCounts.length ? Math.round(playerCounts.reduce((a, b) => a + b, 0) / playerCounts.length * 10) / 10 : null;
  }, [filtered, activePlayers]);

  const teamAvgHeight = useMemo(() => {
    const vals = activePlayers.map(p => getLatestMetric(filtered, p, 'height')).filter(v => v !== null) as number[];
    return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length * 10) / 10 : null;
  }, [filtered, activePlayers]);
  const teamAvgReach = useMemo(() => {
    const vals = activePlayers.map(p => getLatestMetric(filtered, p, 'standingReach')).filter(v => v !== null) as number[];
    return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length * 10) / 10 : null;
  }, [filtered, activePlayers]);
  const teamAvgProjHeight = useMemo(() => {
    const vals = activePlayers.map(p => getProjectedHeight(p, profiles, filtered)).filter(v => v !== null) as number[];
    return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length * 10) / 10 : null;
  }, [filtered, activePlayers, profiles]);
  const teamAvgProjReach = useMemo(() => {
    const vals = activePlayers.map(p => getProjectedReach(p, profiles, filtered)).filter(v => v !== null) as number[];
    return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length * 10) / 10 : null;
  }, [filtered, activePlayers, profiles]);
  const teamAvgVertical = useMemo(() => {
    const vals = activePlayers.map(p => {
      const pv = getLatestMetric(filtered, p, 'pureVertical');
      const sr = getLatestMetric(filtered, p, 'standingReach');
      return (pv !== null && sr !== null) ? pv - sr : null;
    }).filter(v => v !== null) as number[];
    return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length * 10) / 10 : null;
  }, [filtered, activePlayers]);
  const teamAvgSprint = useMemo(() => {
    const vals = activePlayers.map(p => getLatestMetric(filtered, p, 'sprint')).filter(v => v !== null) as number[];
    return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length * 10) / 10 : null;
  }, [filtered, activePlayers]);
  const teamAvgCone = useMemo(() => {
    const vals = activePlayers.map(p => getLatestMetric(filtered, p, 'coneDrill')).filter(v => v !== null) as number[];
    return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length * 10) / 10 : null;
  }, [filtered, activePlayers]);

  const filteredPeriodDays = useMemo(() => {
    if (selectedSeason === 'all') return 0;
    if (selectedDay !== 'all') return 1;
    if (selectedWeek !== 'all') return 7;
    if (selectedMonth !== 'all') {
      const year = parseInt(selectedMonth.substring(0, 4));
      const month = parseInt(selectedMonth.substring(5, 7));
      const daysInMonth = new Date(year, month, 0).getDate();
      const now = new Date();
      const monthEnd = new Date(year, month, 0);
      if (now < monthEnd) {
        return now.getDate();
      }
      return daysInMonth;
    }
    return getSeasonDays(selectedSeason);
  }, [selectedSeason, selectedMonth, selectedWeek, selectedDay]);

  const teamDaysOff = useMemo(() => {
    if (filteredPeriodDays <= 0) return null;
    const playerDaysOff = activePlayers.map(player => {
      const ps = filtered.filter(s => s.player === player);
      const active = new Set<string>();
      for (const s of ps) {
        if ((s.vitaminsLoad || 0) > 0 || (s.weightsLoad || 0) > 0 || (s.practiceLoad || 0) > 0 || (s.gameLoad || 0) > 0 || (s.injured !== null && s.injured > 0) || (s.nationalTeam !== null && s.nationalTeam > 0)) {
          active.add(s.date);
        }
      }
      let periodDays = filteredPeriodDays;
      if (selectedMonth === 'all' && selectedWeek === 'all' && selectedDay === 'all') {
        periodDays = getSeasonDays(selectedSeason, player);
      }
      return Math.max(0, periodDays - active.size);
    });
    return playerDaysOff.length ? Math.round(playerDaysOff.reduce((a, b) => a + b, 0) / playerDaysOff.length * 10) / 10 : null;
  }, [filtered, activePlayers, selectedSeason, selectedMonth, selectedWeek, selectedDay, filteredPeriodDays]);

  const filterGranularity = useMemo(() => {
    if (selectedDay !== 'all') return 'day';
    if (selectedWeek !== 'all') return 'week';
    if (selectedMonth !== 'all') return 'month';
    return 'season';
  }, [selectedDay, selectedWeek, selectedMonth]);

  const monthlyGoals = { practice: { min: 16, max: 32 }, vitamins: { min: 32, max: 48 }, weights: { min: 32, max: 48 }, game: { min: 24, max: 28 } };
  const shotsGoal = filterGranularity === 'day' ? 100 : filterGranularity === 'week' ? 100 : filterGranularity === 'month' ? 700 : 3000;
  const goalScale = filterGranularity === 'day' ? 1 / 30 : filterGranularity === 'week' ? 1 / 30 : filterGranularity === 'month' ? 7 / 30 : 1;
  const proratedGoals = {
    practice: { min: +(monthlyGoals.practice.min * goalScale).toFixed(1), max: +(monthlyGoals.practice.max * goalScale).toFixed(1) },
    vitamins: { min: +(monthlyGoals.vitamins.min * goalScale).toFixed(1), max: +(monthlyGoals.vitamins.max * goalScale).toFixed(1) },
    weights: { min: +(monthlyGoals.weights.min * goalScale).toFixed(1), max: +(monthlyGoals.weights.max * goalScale).toFixed(1) },
    game: { min: +(monthlyGoals.game.min * goalScale).toFixed(1), max: +(monthlyGoals.game.max * goalScale).toFixed(1) },
    totalLoad: { min: +((monthlyGoals.practice.min + monthlyGoals.vitamins.min + monthlyGoals.weights.min + monthlyGoals.game.min) * goalScale).toFixed(1), max: +((monthlyGoals.practice.max + monthlyGoals.vitamins.max + monthlyGoals.weights.max + monthlyGoals.game.max) * goalScale).toFixed(1) },
  };

  const LoadTooltip = ({ active, payload, label, goalMin, goalMax, unit, goalLabel }: any) => {
    if (!active || !payload || !payload.length) return null;
    const val = payload[0]?.value;
    const status = val < goalMin ? 'Below' : val > goalMax ? 'Above' : 'In Range';
    const statusColor = val < goalMin ? '#3b82f6' : val > goalMax ? '#ef4444' : '#22c55e';
    return (
      <div style={{ borderRadius: 8, fontSize: 11, backgroundColor: isDark ? '#1f2937' : '#fff', border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`, color: isDark ? '#f3f4f6' : '#111827', padding: '8px 12px', minWidth: 140 }}>
        <p style={{ fontWeight: 700, marginBottom: 4 }}>{label}</p>
        <p style={{ color: statusColor, fontWeight: 600 }}>{payload[0]?.name}: {val}{unit || ''}</p>
        <div style={{ borderTop: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`, marginTop: 4, paddingTop: 4 }}>
          <p style={{ color: '#22c55e', fontSize: 10 }}>{goalLabel || t('Goal')}: {goalMin}–{goalMax}{unit || ''}</p>
          <p style={{ color: statusColor, fontSize: 10, fontWeight: 600 }}>{status}</p>
        </div>
      </div>
    );
  };

  const ShotTooltip = ({ active, payload, label, goal }: any) => {
    if (!active || !payload || !payload.length) return null;
    const val = payload[0]?.value;
    const status = val < goal ? 'Below' : 'On Target';
    const statusColor = val < goal ? '#3b82f6' : '#22c55e';
    return (
      <div style={{ borderRadius: 8, fontSize: 11, backgroundColor: isDark ? '#1f2937' : '#fff', border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`, color: isDark ? '#f3f4f6' : '#111827', padding: '8px 12px', minWidth: 140 }}>
        <p style={{ fontWeight: 700, marginBottom: 4 }}>{label}</p>
        <p style={{ color: statusColor, fontWeight: 600 }}>{payload[0]?.name}: {val}</p>
        <div style={{ borderTop: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`, marginTop: 4, paddingTop: 4 }}>
          <p style={{ color: '#22c55e', fontSize: 10 }}>{t('Goal')}: {goal}</p>
          <p style={{ color: statusColor, fontSize: 10, fontWeight: 600 }}>{status}</p>
        </div>
      </div>
    );
  };

  const PctTooltip = ({ active, payload, label, goalMin, goalMax }: any) => {
    if (!active || !payload || !payload.length) return null;
    const val = payload[0]?.value;
    const status = val < goalMin ? 'Below' : val > goalMax ? 'Above' : 'In Range';
    const statusColor = val < goalMin ? '#3b82f6' : val > goalMax ? '#ef4444' : '#22c55e';
    return (
      <div style={{ borderRadius: 8, fontSize: 11, backgroundColor: isDark ? '#1f2937' : '#fff', border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`, color: isDark ? '#f3f4f6' : '#111827', padding: '8px 12px', minWidth: 140 }}>
        <p style={{ fontWeight: 700, marginBottom: 4 }}>{label}</p>
        <p style={{ color: statusColor, fontWeight: 600 }}>{payload[0]?.name}: {val}%</p>
        <div style={{ borderTop: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`, marginTop: 4, paddingTop: 4 }}>
          <p style={{ color: '#22c55e', fontSize: 10 }}>{t('Goal')}: {goalMin}%–{goalMax}%</p>
          <p style={{ color: statusColor, fontSize: 10, fontWeight: 600 }}>{status}</p>
        </div>
      </div>
    );
  };

  const loadData = useMemo(() => {
    const getBucketKey = (s: VBSession): string => {
      if (filterGranularity === 'day') return s.player;
      if (filterGranularity === 'week') {
        const dt = new Date(s.date);
        return dt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      }
      if (filterGranularity === 'month') {
        const season = selectedSeason === 'all' ? getCurrentSeason() : selectedSeason;
        const w = getSeasonWeek(s.date, season);
        return `W${w}`;
      }
      return s.date.substring(5, 7) + '/' + s.date.substring(2, 4);
    };

    const getSortKey = (s: VBSession): string => {
      if (filterGranularity === 'day') return s.player;
      if (filterGranularity === 'week') return s.date;
      if (filterGranularity === 'month') {
        const season = selectedSeason === 'all' ? getCurrentSeason() : selectedSeason;
        return String(getSeasonWeek(s.date, season)).padStart(3, '0');
      }
      return s.date.substring(0, 7);
    };

    const sortKeyMap = new Map<string, string>();
    const bucketPlayerLoads = new Map<string, Map<string, { practice: number; vitamins: number; weights: number; game: number; shotsTaken: number; shotsMade: number }>>();

    filtered.forEach(s => {
      const key = getBucketKey(s);
      const sortKey = getSortKey(s);
      if (!bucketPlayerLoads.has(key)) {
        bucketPlayerLoads.set(key, new Map());
        sortKeyMap.set(key, sortKey);
      }
      if (sortKey < (sortKeyMap.get(key) || sortKey)) sortKeyMap.set(key, sortKey);
      const playerMap = bucketPlayerLoads.get(key)!;
      if (!playerMap.has(s.player)) playerMap.set(s.player, { practice: 0, vitamins: 0, weights: 0, game: 0, shotsTaken: 0, shotsMade: 0 });
      const pLoad = playerMap.get(s.player)!;
      if (s.practiceLoad) pLoad.practice += s.practiceLoad;
      if (s.vitaminsLoad) pLoad.vitamins += s.vitaminsLoad;
      if (s.weightsLoad) pLoad.weights += s.weightsLoad;
      if (s.gameLoad) pLoad.game += s.gameLoad;
      if (s.shootsTaken) pLoad.shotsTaken += s.shootsTaken;
      if (s.shootsMade) pLoad.shotsMade += s.shootsMade;
    });

    let sorted = [...bucketPlayerLoads.entries()]
      .sort((a, b) => (sortKeyMap.get(a[0]) || '').localeCompare(sortKeyMap.get(b[0]) || ''));

    if (filterGranularity === 'month' && sorted.length > 4) {
      sorted = sorted.slice(0, 4);
    }

    return sorted.map(([label, playerMap]) => {
        const players = [...playerMap.values()];
        const n = players.length || 1;
        const totalTaken = players.reduce((sum, p) => sum + p.shotsTaken, 0);
        const totalMade = players.reduce((sum, p) => sum + p.shotsMade, 0);
        return {
          month: label,
          totalLoad: +(players.reduce((sum, p) => sum + p.practice + p.vitamins + p.weights + p.game, 0) / n).toFixed(1),
          practice: +(players.reduce((sum, p) => sum + p.practice, 0) / n).toFixed(1),
          vitamins: +(players.reduce((sum, p) => sum + p.vitamins, 0) / n).toFixed(1),
          weights: +(players.reduce((sum, p) => sum + p.weights, 0) / n).toFixed(1),
          game: +(players.reduce((sum, p) => sum + p.game, 0) / n).toFixed(1),
          shotsTaken: +(totalTaken / n).toFixed(0),
          shootingPct: totalTaken > 0 ? +((totalMade / totalTaken) * 100).toFixed(1) : 0,
          _totalTaken: totalTaken,
          _totalMade: totalMade,
        };
      });
  }, [filtered, filterGranularity, selectedSeason]);

  const selectClass = `px-3 py-1.5 rounded-lg text-xs font-medium appearance-none pr-7 ${isDark ? 'bg-gray-800 text-gray-300 border-gray-700' : 'bg-white text-gray-700 border-gray-200'} border`;

  return (
    <div className="space-y-6">
      <div className={`grid grid-cols-8 gap-2 rounded-xl border p-3 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} shadow-sm`}>
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
        <div className="relative">
          <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} className={selectClass + ' w-full'}>
            <option value="all">{t('All Categories')}</option>
            {availableCategories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
        </div>
        <div className="relative">
          <select value={selectedRole} onChange={e => setSelectedRole(e.target.value)} className={selectClass + ' w-full'}>
            <option value="all">{t('All Roles')}</option>
            {availableRoles.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
        </div>
        <div className="relative col-span-2">
          <select value={selectedPlayerFilter} onChange={e => setSelectedPlayerFilter(e.target.value)} className={selectClass + ' w-full'}>
            <option value="all">{t('All Players')}</option>
            {playersInFilter.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
        </div>
      </div>

      <div className="grid grid-cols-7 gap-3">
        <StatCard label={t('3PT %')} value={avgShootingPct} unit="%" icon={Target} color="#f59e0b" subtitle={t('Team Average')} />
        <StatCard label={t('Total Load')} value={teamAvgTotalLoad} icon={Activity} color="#0ea5e9" subtitle={t('Avg / Player')} />
        <StatCard label={t('Vitamins')} value={teamAvgVitamins} icon={Pill} color="#8b5cf6" subtitle={t('Avg / Player')} />
        <StatCard label={t('Weights')} value={teamAvgWeights} icon={Dumbbell} color="#10b981" subtitle={t('Avg / Player')} />
        <StatCard label={t('Game')} value={teamAvgGame} icon={Gamepad2} color="#f97316" subtitle={t('Avg / Player')} />
        <StatCard label={t('Injuries')} value={teamAvgInjuries} icon={Heart} color="#ef4444" subtitle={t('Avg / Player')} />
        <StatCard label={t('Days Off')} value={teamDaysOff} icon={CalendarOff} color="#6b7280" subtitle={t('Avg / Player')} />
      </div>
      <div className="grid grid-cols-7 gap-3">
        <StatCard label={t('Height')} value={teamAvgHeight} unit=" cm" icon={Ruler} color="#3b82f6" subtitle={t('Team Average')} />
        <StatCard label={t('Projected Height')} value={teamAvgProjHeight} unit=" cm" icon={Ruler} color="#6366f1" subtitle={t('Team Average')} />
        <StatCard label={t('Reach')} value={teamAvgReach} unit=" cm" icon={ArrowUpFromDot} color="#8b5cf6" subtitle={t('Team Average')} />
        <StatCard label={t('Projected Reach')} value={teamAvgProjReach} unit=" cm" icon={ArrowUpFromDot} color="#a855f7" subtitle={t('Team Average')} />
        <StatCard label={t('Vertical')} value={teamAvgVertical} unit=" cm" icon={Zap} color="#f59e0b" subtitle={t('Team Average')} />
        <StatCard label={t('Speed')} value={teamAvgSprint} unit=" ms" icon={Timer} color="#10b981" subtitle={t('Team Average')} />
        <StatCard label={t('Agility')} value={teamAvgCone} unit=" ms" icon={Gauge} color="#f97316" subtitle={t('Team Average')} />
      </div>

      <div className={`rounded-xl border p-5 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} shadow-sm`}>
        <h3 className={`text-sm font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('Training Load Trends')} — {filterGranularity === 'day' ? t('By Player') : filterGranularity === 'week' ? t('By Day') : filterGranularity === 'month' ? t('By Week') : t('By Month')}</h3>
        <div className="mb-4">
          <p className={`text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('Total Load')} <span className={`${isDark ? 'text-gray-500' : 'text-gray-400'}`}>({t('Goal')}: {proratedGoals.totalLoad.min}–{proratedGoals.totalLoad.max})</span></p>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={loadData}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} />
                <XAxis dataKey="month" tick={{ fontSize: 9, fill: isDark ? '#9ca3af' : '#6b7280' }} />
                <YAxis tick={{ fontSize: 9, fill: isDark ? '#9ca3af' : '#6b7280' }} domain={[(() => { const mid = (proratedGoals.totalLoad.min + proratedGoals.totalLoad.max) / 2; const range = proratedGoals.totalLoad.max - proratedGoals.totalLoad.min; return (dataMin: number) => { const maxDist = Math.max(mid - dataMin, 0, range / 2); return Math.max(0, Math.floor(mid - maxDist * 1.3)); }; })(), (() => { const mid = (proratedGoals.totalLoad.min + proratedGoals.totalLoad.max) / 2; const range = proratedGoals.totalLoad.max - proratedGoals.totalLoad.min; return (dataMax: number) => { const maxDist = Math.max(dataMax - mid, 0, range / 2); return Math.ceil(mid + maxDist * 1.3); }; })()]} />
                <Tooltip content={<LoadTooltip goalMin={proratedGoals.totalLoad.min} goalMax={proratedGoals.totalLoad.max} />} />
                <ReferenceArea y1={proratedGoals.totalLoad.min} y2={proratedGoals.totalLoad.max} fill="#22c55e" fillOpacity={isDark ? 0.08 : 0.1} />
                <ReferenceLine y={proratedGoals.totalLoad.min} stroke="#22c55e" strokeDasharray="4 4" strokeWidth={1.5} label={{ value: `${proratedGoals.totalLoad.min}`, position: 'right', fontSize: 9, fill: '#22c55e' }} />
                <ReferenceLine y={proratedGoals.totalLoad.max} stroke="#22c55e" strokeDasharray="4 4" strokeWidth={1.5} label={{ value: `${proratedGoals.totalLoad.max}`, position: 'right', fontSize: 9, fill: '#22c55e' }} />
                <Bar dataKey="totalLoad" name={t('Total Load')} radius={[2, 2, 0, 0]}>
                  {loadData.map((entry: any, idx: number) => {
                    const val = entry.totalLoad;
                    const fill: string = val < proratedGoals.totalLoad.min ? '#3b82f6' : val > proratedGoals.totalLoad.max ? '#ef4444' : '#22c55e';
                    return <Cell key={idx} fill={fill} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {([
            { key: 'practice', label: t('Practice'), baseColor: '#3b82f6', goals: proratedGoals.practice },
            { key: 'vitamins', label: t('Vitamins'), baseColor: '#8b5cf6', goals: proratedGoals.vitamins },
            { key: 'weights', label: t('Weights'), baseColor: '#10b981', goals: proratedGoals.weights },
            { key: 'game', label: t('Game'), baseColor: '#f59e0b', goals: proratedGoals.game },
          ] as const).map(({ key, label, baseColor, goals }) => (
            <div key={key}>
              <p className={`text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{label} <span className={`${isDark ? 'text-gray-500' : 'text-gray-400'}`}>({t('Goal')}: {goals.min}–{goals.max})</span></p>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={loadData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} />
                    <XAxis dataKey="month" tick={{ fontSize: 9, fill: isDark ? '#9ca3af' : '#6b7280' }} />
                    <YAxis tick={{ fontSize: 9, fill: isDark ? '#9ca3af' : '#6b7280' }} domain={[(() => { const mid = (goals.min + goals.max) / 2; const halfRange = (goals.max - goals.min) / 2; return (dataMin: number) => { const dist = Math.max(mid - dataMin, 0, halfRange); return Math.max(0, Math.floor(mid - dist * 1.3)); }; })(), (() => { const mid = (goals.min + goals.max) / 2; const halfRange = (goals.max - goals.min) / 2; return (dataMax: number) => { const dist = Math.max(dataMax - mid, 0, halfRange); return Math.ceil(mid + dist * 1.3); }; })()]} />
                    <Tooltip content={<LoadTooltip goalMin={goals.min} goalMax={goals.max} />} />
                    <ReferenceArea y1={goals.min} y2={goals.max} fill="#22c55e" fillOpacity={isDark ? 0.08 : 0.1} />
                    <ReferenceLine y={goals.min} stroke="#22c55e" strokeDasharray="4 4" strokeWidth={1.5} label={{ value: `${goals.min}`, position: 'right', fontSize: 9, fill: '#22c55e' }} />
                    <ReferenceLine y={goals.max} stroke="#22c55e" strokeDasharray="4 4" strokeWidth={1.5} label={{ value: `${goals.max}`, position: 'right', fontSize: 9, fill: '#22c55e' }} />
                    <Bar dataKey={key} name={label} radius={[2, 2, 0, 0]}>
                      {loadData.map((entry: any, idx: number) => {
                        const val = entry[key];
                        const fill: string = val < goals.min ? '#3b82f6' : val > goals.max ? '#ef4444' : '#22c55e';
                        return <Cell key={idx} fill={fill} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <p className={`text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('Shots Taken')} <span className={`${isDark ? 'text-gray-500' : 'text-gray-400'}`}>({t('Goal')}: {shotsGoal})</span></p>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={loadData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} />
                  <XAxis dataKey="month" tick={{ fontSize: 9, fill: isDark ? '#9ca3af' : '#6b7280' }} />
                  <YAxis tick={{ fontSize: 9, fill: isDark ? '#9ca3af' : '#6b7280' }} domain={[(dataMin: number) => Math.max(0, Math.floor(Math.min(dataMin, shotsGoal) * 0.9)), (dataMax: number) => Math.ceil(Math.max(dataMax, shotsGoal) * 1.05)]} />
                  <Tooltip content={<ShotTooltip goal={shotsGoal} />} />
                  <ReferenceLine y={shotsGoal} stroke="#22c55e" strokeDasharray="4 4" strokeWidth={1.5} label={{ value: `${shotsGoal}`, position: 'right', fontSize: 9, fill: '#22c55e' }} />
                  <Bar dataKey="shotsTaken" name={t('Shots Taken')} radius={[2, 2, 0, 0]}>
                    {loadData.map((entry: any, idx: number) => {
                      const fill: string = entry.shotsTaken < shotsGoal ? '#3b82f6' : '#22c55e';
                      return <Cell key={idx} fill={fill} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div>
            <p className={`text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('3PT %')} ({t('Cumulative')}) <span className={`${isDark ? 'text-gray-500' : 'text-gray-400'}`}>({t('Goal')}: 65%–85%)</span></p>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={(() => {
                  let cumTaken = 0, cumMade = 0;
                  return loadData.map((d: any) => {
                    cumTaken += d._totalTaken || 0;
                    cumMade += d._totalMade || 0;
                    return { month: d.month, cumulativePct: cumTaken > 0 ? +((cumMade / cumTaken) * 100).toFixed(1) : 0 };
                  });
                })()}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} />
                  <XAxis dataKey="month" tick={{ fontSize: 9, fill: isDark ? '#9ca3af' : '#6b7280' }} />
                  <YAxis tick={{ fontSize: 9, fill: isDark ? '#9ca3af' : '#6b7280' }} domain={[(dataMin: number) => { const mid = 75; const dist = Math.max(mid - dataMin, 0, 10); return Math.max(0, Math.floor(mid - dist * 1.3)); }, (dataMax: number) => { const mid = 75; const dist = Math.max(dataMax - mid, 0, 10); return Math.min(100, Math.ceil(mid + dist * 1.3)); }]} />
                  <Tooltip content={<PctTooltip goalMin={65} goalMax={85} />} />
                  <ReferenceArea y1={65} y2={85} fill="#22c55e" fillOpacity={isDark ? 0.08 : 0.1} />
                  <ReferenceLine y={65} stroke="#22c55e" strokeDasharray="4 4" strokeWidth={1.5} label={{ value: '65%', position: 'right', fontSize: 9, fill: '#22c55e' }} />
                  <ReferenceLine y={85} stroke="#22c55e" strokeDasharray="4 4" strokeWidth={1.5} label={{ value: '85%', position: 'right', fontSize: 9, fill: '#22c55e' }} />
                  <Line type="monotone" dataKey="cumulativePct" name={t('3PT %')} stroke="#f59e0b" strokeWidth={2} dot={{ fill: '#f59e0b', r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        <div className={`flex items-center justify-center gap-6 mt-3 pt-3 border-t ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#3b82f6' }} /><span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('Below Range')}</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#22c55e' }} /><span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('In Range')}</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#ef4444' }} /><span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('Above Range')}</span></div>
        </div>
      </div>

      <RosterTable filtered={filtered} activePlayers={activePlayers} onSelectPlayer={onSelectPlayer} isDark={isDark} selectedSeason={selectedSeason} profiles={profiles} />
    </div>
  );
}

function PerformanceTab({ sessions, players, profiles }: { sessions: VBSession[]; players: string[]; profiles: PlayerProfile[] }) {
  const { t } = useLanguage();
  const isDark = useIsDark();

  const validSessions = useMemo(() =>
    sessions.filter(s => getSeason(s.date) !== null).sort((a, b) => a.date.localeCompare(b.date)),
    [sessions]);

  const seasons = useMemo(() => {
    const s = [...new Set(validSessions.map(s => getSeason(s.date)!))].sort();
    return s;
  }, [validSessions]);

  const [selectedSeason, setSelectedSeason] = useState(() => getCurrentSeason());
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedPlayer, setSelectedPlayer] = useState<string>('all');

  const seasonFiltered = useMemo(() => {
    if (selectedSeason === 'all') return validSessions;
    return validSessions.filter(s => getSeason(s.date) === selectedSeason);
  }, [validSessions, selectedSeason]);

  const availableCategories = useMemo(() => {
    const cats = [...new Set(seasonFiltered.map(s => getPlayerCategory(s.player, profiles, selectedSeason !== 'all' ? selectedSeason : undefined)).filter(c => c))].sort();
    return cats;
  }, [seasonFiltered, profiles, selectedSeason]);

  const categoryFiltered = useMemo(() => {
    if (selectedCategory === 'all') return seasonFiltered;
    return seasonFiltered.filter(s => getPlayerCategory(s.player, profiles, selectedSeason !== 'all' ? selectedSeason : undefined) === selectedCategory);
  }, [seasonFiltered, selectedCategory, profiles, selectedSeason]);

  const availableRoles = useMemo(() => {
    const roles = [...new Set(categoryFiltered.map(s => getPlayerPosition(s.player, profiles)).filter(r => r))].sort();
    return roles;
  }, [categoryFiltered, profiles]);

  const filtered = useMemo(() => {
    if (selectedRole === 'all') return categoryFiltered;
    return categoryFiltered.filter(s => getPlayerPosition(s.player, profiles) === selectedRole);
  }, [categoryFiltered, selectedRole, profiles]);

  const activePlayers = useMemo(() => {
    const pSet = new Set(filtered.map(s => s.player));
    return players.filter(p => pSet.has(p));
  }, [filtered, players]);

  const displayPlayers = useMemo(() => {
    if (selectedPlayer !== 'all') return [selectedPlayer];
    return activePlayers;
  }, [activePlayers, selectedPlayer]);

  useEffect(() => { setSelectedCategory('all'); setSelectedRole('all'); setSelectedPlayer('all'); }, [selectedSeason]);
  useEffect(() => { setSelectedRole('all'); setSelectedPlayer('all'); }, [selectedCategory]);
  useEffect(() => { setSelectedPlayer('all'); }, [selectedRole]);

  const metrics = [
    { key: 'sprint', label: t('Speed'), unit: 'ms', icon: Timer, color: '#10b981', lowerBetter: true },
    { key: 'coneDrill', label: t('Agility'), unit: 'ms', icon: Gauge, color: '#f97316', lowerBetter: true },
    { key: 'pureVertical', label: t('Pure Vertical'), unit: 'cm', icon: Zap, color: '#f59e0b', lowerBetter: false },
    { key: 'noStepVertical', label: t('No-Step Vertical'), unit: 'cm', icon: Zap, color: '#8b5cf6', lowerBetter: false },
    { key: 'bodyFat', label: t('BF %'), unit: '%', icon: Heart, color: '#ef4444', lowerBetter: true },
    { key: 'deadlift', label: t('Strength'), unit: 'kg', icon: Dumbbell, color: '#3b82f6', lowerBetter: false },
  ] as const;

  const teamAverages = useMemo(() => {
    const result: Record<string, number | null> = {};
    for (const m of metrics) {
      if (m.key === 'bodyFat') {
        const vals = displayPlayers.map(p => {
          const rawSF = getLatestMetric(filtered, p, 'bodyFat');
          if (rawSF === null) return null;
          const dobSerial = getPlayerDobSerial(p, profiles);
          const latestSession = getPlayerSessions(filtered, p).filter(s => s.bodyFat !== null).sort((a, b) => b.date.localeCompare(a.date))[0];
          return calcBodyFatPct(rawSF, dobSerial, latestSession?.date);
        }).filter(v => v !== null) as number[];
        result[m.key] = vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length * 10) / 10 : null;
      } else if (m.key === 'pureVertical' || m.key === 'noStepVertical') {
        const vals = displayPlayers.map(p => {
          const v = getLatestMetric(filtered, p, m.key as keyof VBSession);
          const sr = getLatestMetric(filtered, p, 'standingReach');
          return (v !== null && sr !== null) ? v - sr : null;
        }).filter(v => v !== null) as number[];
        result[m.key] = vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length * 10) / 10 : null;
      } else {
        const vals = displayPlayers.map(p => getLatestMetric(filtered, p, m.key as keyof VBSession)).filter(v => v !== null) as number[];
        result[m.key] = vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length * 10) / 10 : null;
      }
    }
    return result;
  }, [filtered, displayPlayers, profiles]);

  const trendData = useMemo(() => {
    const monthMap = new Map<string, Map<string, { values: number[]; date: string }>>();
    const sortKeyMap = new Map<string, string>();

    filtered.forEach(s => {
      const monthKey = s.date.substring(0, 7);
      const d = new Date(s.date);
      const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      if (!monthMap.has(label)) {
        monthMap.set(label, new Map());
        sortKeyMap.set(label, monthKey);
      }

      for (const m of metrics) {
        let val: number | null = null;
        if (m.key === 'bodyFat') {
          const raw = s.bodyFat;
          if (raw !== null) {
            const dobSerial = getPlayerDobSerial(s.player, profiles);
            val = calcBodyFatPct(raw, dobSerial, s.date);
          }
        } else if (m.key === 'pureVertical' || m.key === 'noStepVertical') {
          const raw = s[m.key as keyof VBSession] as number | null;
          const sr = s.standingReach;
          val = (raw !== null && sr !== null) ? raw - sr : null;
        } else {
          val = s[m.key as keyof VBSession] as number | null;
        }
        if (val !== null && displayPlayers.includes(s.player)) {
          const metricMap = monthMap.get(label)!;
          if (!metricMap.has(m.key)) metricMap.set(m.key, { values: [], date: monthKey });
          metricMap.get(m.key)!.values.push(val);
        }
      }
    });

    return [...monthMap.entries()]
      .sort((a, b) => (sortKeyMap.get(a[0]) || '').localeCompare(sortKeyMap.get(b[0]) || ''))
      .map(([label, metricMap]) => {
        const row: any = { month: label };
        for (const m of metrics) {
          const data = metricMap.get(m.key);
          if (data && data.values.length > 0) {
            row[m.key] = Math.round(data.values.reduce((a, b) => a + b, 0) / data.values.length * 10) / 10;
          }
        }
        return row;
      });
  }, [filtered, displayPlayers, profiles]);

  type PerfSortKey = 'player' | 'sprint' | 'coneDrill' | 'pureVertical' | 'noStepVertical' | 'bodyFat' | 'deadlift';
  const [sortKey, setSortKey] = useState<PerfSortKey>('player');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const tableRows = useMemo(() => {
    return displayPlayers.map(player => {
      const bf = (() => {
        const rawSF = getLatestMetric(filtered, player, 'bodyFat');
        if (rawSF === null) return null;
        const dobSerial = getPlayerDobSerial(player, profiles);
        const latestSession = getPlayerSessions(filtered, player).filter(s => s.bodyFat !== null).sort((a, b) => b.date.localeCompare(a.date))[0];
        return calcBodyFatPct(rawSF, dobSerial, latestSession?.date);
      })();

      const getFirstMetric = (field: keyof VBSession): number | null => {
        const ps = getPlayerSessions(filtered, player).filter(s => s[field] !== null).sort((a, b) => a.date.localeCompare(b.date));
        return ps.length ? ps[0][field] as number : null;
      };

      const firstBf = (() => {
        const ps = getPlayerSessions(filtered, player).filter(s => s.bodyFat !== null).sort((a, b) => a.date.localeCompare(b.date));
        if (!ps.length) return null;
        const raw = ps[0].bodyFat!;
        const dobSerial = getPlayerDobSerial(player, profiles);
        return calcBodyFatPct(raw, dobSerial, ps[0].date);
      })();

      return {
        player,
        sprint: getLatestMetric(filtered, player, 'sprint'),
        sprintFirst: getFirstMetric('sprint'),
        coneDrill: getLatestMetric(filtered, player, 'coneDrill'),
        coneDrillFirst: getFirstMetric('coneDrill'),
        pureVertical: (() => {
          const v = getLatestMetric(filtered, player, 'pureVertical');
          const sr = getLatestMetric(filtered, player, 'standingReach');
          return (v !== null && sr !== null) ? v - sr : null;
        })(),
        pureVerticalFirst: (() => {
          const ps = getPlayerSessions(filtered, player).filter(s => s.pureVertical !== null && s.standingReach !== null).sort((a, b) => a.date.localeCompare(b.date));
          return ps.length ? (ps[0].pureVertical as number) - (ps[0].standingReach as number) : null;
        })(),
        noStepVertical: (() => {
          const v = getLatestMetric(filtered, player, 'noStepVertical');
          const sr = getLatestMetric(filtered, player, 'standingReach');
          return (v !== null && sr !== null) ? v - sr : null;
        })(),
        noStepVerticalFirst: (() => {
          const ps = getPlayerSessions(filtered, player).filter(s => s.noStepVertical !== null && s.standingReach !== null).sort((a, b) => a.date.localeCompare(b.date));
          return ps.length ? (ps[0].noStepVertical as number) - (ps[0].standingReach as number) : null;
        })(),
        bodyFat: bf,
        bodyFatFirst: firstBf,
        deadlift: getLatestMetric(filtered, player, 'deadlift'),
        deadliftFirst: getFirstMetric('deadlift'),
      };
    });
  }, [filtered, displayPlayers, profiles]);

  const sortedRows = useMemo(() => {
    const arr = [...tableRows];
    arr.sort((a, b) => {
      if (sortKey === 'player') {
        const cmp = a.player.localeCompare(b.player);
        return sortDir === 'asc' ? cmp : -cmp;
      }
      const av = a[sortKey] as number | null;
      const bv = b[sortKey] as number | null;
      if (av === null && bv === null) return 0;
      if (av === null) return 1;
      if (bv === null) return -1;
      return sortDir === 'asc' ? av - bv : bv - av;
    });
    return arr;
  }, [tableRows, sortKey, sortDir]);

  const handleSort = (key: PerfSortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir(key === 'player' ? 'asc' : 'desc'); }
  };

  const SortIcon = ({ col }: { col: PerfSortKey }) => {
    if (sortKey !== col) return <ArrowUpDown size={10} className="opacity-30 ml-0.5 inline" />;
    return sortDir === 'asc' ? <ArrowUp size={10} className="text-orange-500 ml-0.5 inline" /> : <ArrowDown size={10} className="text-orange-500 ml-0.5 inline" />;
  };

  const getDelta = (latest: number | null, first: number | null, lowerBetter: boolean) => {
    if (latest === null || first === null || latest === first) return null;
    const diff = Math.round((latest - first) * 10) / 10;
    const improved = lowerBetter ? diff < 0 : diff > 0;
    return { diff, improved };
  };

  const selectClass = `px-3 py-1.5 rounded-lg text-xs font-medium appearance-none pr-7 ${isDark ? 'bg-gray-800 text-gray-300 border-gray-700' : 'bg-white text-gray-700 border-gray-200'} border`;

  return (
    <div className="space-y-6">
      <div className={`grid grid-cols-5 gap-2 rounded-xl border p-3 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} shadow-sm`}>
        <div className="relative">
          <select value={selectedSeason} onChange={e => setSelectedSeason(e.target.value)} className={selectClass + ' w-full'}>
            <option value="all">{t('All Seasons')}</option>
            {seasons.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
        </div>
        <div className="relative">
          <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} className={selectClass + ' w-full'}>
            <option value="all">{t('All Categories')}</option>
            {availableCategories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
        </div>
        <div className="relative">
          <select value={selectedRole} onChange={e => setSelectedRole(e.target.value)} className={selectClass + ' w-full'}>
            <option value="all">{t('All Roles')}</option>
            {availableRoles.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
        </div>
        <div className="relative">
          <select value={selectedPlayer} onChange={e => setSelectedPlayer(e.target.value)} className={selectClass + ' w-full'}>
            <option value="all">{t('All Players')}</option>
            {activePlayers.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
        </div>
        <div className="flex items-center justify-end">
          <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{displayPlayers.length} {t('players')} · {filtered.length} {t('sessions')}</span>
        </div>
      </div>

      <div className="grid grid-cols-6 gap-3">
        {metrics.map(m => (
          <StatCard key={m.key} label={m.label} value={teamAverages[m.key]} unit={m.key === 'bodyFat' ? '%' : ` ${m.unit}`} icon={m.icon} color={m.color} subtitle={selectedPlayer === 'all' ? t('Team Average') : t('Latest')} />
        ))}
      </div>

      <div className={`rounded-xl border p-5 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} shadow-sm`}>
        <h3 className={`text-sm font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('Athletic Trends')} — {t('By Month')}</h3>
        <div className="grid grid-cols-3 gap-4">
          {metrics.map(m => (
            <div key={m.key}>
              <p className={`text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{m.label} ({m.unit})</p>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} />
                    <XAxis dataKey="month" tick={{ fontSize: 9, fill: isDark ? '#9ca3af' : '#6b7280' }} />
                    <YAxis tick={{ fontSize: 9, fill: isDark ? '#9ca3af' : '#6b7280' }} domain={[(dataMin: number) => { const pad = Math.max(1, Math.abs(dataMin) * 0.05); return Math.floor(dataMin - pad); }, (dataMax: number) => { const pad = Math.max(1, Math.abs(dataMax) * 0.05); return Math.ceil(dataMax + pad); }]} />
                    <Tooltip contentStyle={{ borderRadius: 8, fontSize: 11, backgroundColor: isDark ? '#1f2937' : '#fff', border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`, color: isDark ? '#f3f4f6' : '#111827' }} formatter={(value: any) => `${value}${m.key === 'bodyFat' ? '%' : ' ' + m.unit}`} />
                    <Line type="monotone" dataKey={m.key} name={m.label} stroke={m.color} strokeWidth={2} dot={{ fill: m.color, r: 3 }} connectNulls />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={`rounded-xl border p-5 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} shadow-sm`}>
        <h3 className={`text-sm font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('Performance Table')}</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className={`border-b ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
                <th onClick={() => handleSort('player')} className={`text-left py-2 px-2 font-semibold cursor-pointer select-none hover:text-orange-500 transition-colors ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('Player')}<SortIcon col="player" /></th>
                {metrics.map(m => (
                  <th key={m.key} onClick={() => handleSort(m.key as PerfSortKey)} className={`text-center py-2 px-1 font-semibold cursor-pointer select-none hover:text-orange-500 transition-colors ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{m.label}<SortIcon col={m.key as PerfSortKey} /></th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedRows.map(row => (
                <tr key={row.player} className={`border-b transition-colors ${isDark ? 'border-gray-800/50 hover:bg-gray-800/50' : 'border-gray-50 hover:bg-gray-50'}`}>
                  <td className={`py-2.5 px-2 font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{row.player}</td>
                  {metrics.map(m => {
                    const val = row[m.key as keyof typeof row] as number | null;
                    const firstVal = row[(m.key + 'First') as keyof typeof row] as number | null;
                    const delta = getDelta(val, firstVal, m.lowerBetter);
                    return (
                      <td key={m.key} className={`text-center py-2.5 px-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        <div>{val !== null ? (m.key === 'bodyFat' ? `${val}%` : val) : '—'}</div>
                        {delta && (
                          <span className={`text-[10px] ${delta.improved ? 'text-green-500' : 'text-red-500'}`}>
                            {delta.diff > 0 ? '+' : ''}{delta.diff}
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function PlayerProfileTab({ sessions, players, initialPlayer, profiles }: { sessions: VBSession[]; players: string[]; initialPlayer: string; profiles: PlayerProfile[] }) {
  const { t } = useLanguage();
  const isDark = useIsDark();
  const [selectedPlayer, setSelectedPlayer] = useState(initialPlayer || players[0]);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [showCasInfo, setShowCasInfo] = useState(false);
  const [showApsInfo, setShowApsInfo] = useState(false);
  const allPs = useMemo(() => getPlayerSessions(sessions, selectedPlayer), [sessions, selectedPlayer]);
  const ps = useMemo(() => selectedMonth ? allPs.filter(s => s.date.substring(0, 7) === selectedMonth) : allPs, [allPs, selectedMonth]);
  const availableMonths = useMemo(() => {
    const months = [...new Set(allPs.map(s => s.date.substring(0, 7)))].sort();
    return months;
  }, [allPs]);

  const getWeekOfMonth = (dateStr: string) => {
    const day = parseInt(dateStr.substring(8, 10));
    if (day <= 7) return 1;
    if (day <= 14) return 2;
    if (day <= 21) return 3;
    return 4;
  };

  const getWeeklyBuckets = (filteredSessions: typeof ps) => {
    if (!selectedMonth) return null;
    const weekMap: Record<number, typeof ps> = { 1: [], 2: [], 3: [], 4: [] };
    filteredSessions.forEach(s => {
      const wk = getWeekOfMonth(s.date);
      weekMap[wk].push(s);
    });
    return [1, 2, 3, 4].map(wk => ({ week: wk, sessions: weekMap[wk] }));
  };

  const getWeekDays = (weekNum: number) => {
    if (!selectedMonth) return 7;
    const [y, m] = selectedMonth.split('-').map(Number);
    const daysInMonth = new Date(y, m, 0).getDate();
    if (weekNum === 1) return 7;
    if (weekNum === 2) return 7;
    if (weekNum === 3) return 7;
    return daysInMonth - 21;
  };

  const monthLabel = selectedMonth ? (() => {
    const [y, m] = selectedMonth.split('-');
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return `${t(monthNames[parseInt(m) - 1])} ${y}`;
  })() : null;

  const playerSeasons = useMemo(() => {
    return [...new Set(allPs.map(s => getSeason(s.date)).filter(Boolean))].sort().reverse() as string[];
  }, [allPs]);

  const currentSeason = playerSeasons[0] || null;
  const profile = useMemo(() => getPlayerProfile(selectedPlayer, profiles, currentSeason || undefined), [selectedPlayer, profiles, currentSeason]);

  const playerAge = useMemo(() => {
    const dobSerial = getPlayerDobSerial(selectedPlayer, profiles);
    if (!dobSerial) return null;
    const dob = excelSerialToDate(dobSerial);
    const now = new Date();
    let age = now.getFullYear() - dob.getFullYear();
    if (now.getMonth() < dob.getMonth() || (now.getMonth() === dob.getMonth() && now.getDate() < dob.getDate())) age--;
    return age;
  }, [selectedPlayer, profiles]);

  const playerDobFormatted = useMemo(() => {
    const dobSerial = getPlayerDobSerial(selectedPlayer, profiles);
    if (!dobSerial) return null;
    const dob = excelSerialToDate(dobSerial);
    return dob.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }, [selectedPlayer, profiles]);

  const category = currentSeason ? getPlayerCategory(selectedPlayer, profiles, currentSeason) : '';
  const sessionCount = ps.length;
  const injuryCount = ps.filter(s => s.injured && s.injured > 0).length;
  const availabilityPct = sessionCount > 0 ? Math.round(((sessionCount - injuryCount) / sessionCount) * 100) : null;

  const COMBINE_REF: Record<string, { height: number; wingspan: number; weight: number; standingReach: number; pureVertical: number; noStepVertical: number; sprint: number; coneDrill: number }> = {
    'Playmaker': { height: 186.7, wingspan: 200.0, weight: 86.2, standingReach: 250.8, pureVertical: 94.5, noStepVertical: 78.2, sprint: 3.05, coneDrill: 11.10 },
    '3nD': { height: 200.0, wingspan: 212.1, weight: 98.0, standingReach: 267.3, pureVertical: 90.9, noStepVertical: 76.2, sprint: 3.12, coneDrill: 11.40 },
    'Center': { height: 209.6, wingspan: 224.2, weight: 113.9, standingReach: 281.9, pureVertical: 82.8, noStepVertical: 72.4, sprint: 3.28, coneDrill: 11.70 },
  };
  const combineRef = profile?.role ? COMBINE_REF[profile.role] || null : null;
  const combineLabel = t('Combine Avg');
  const renderDelta = (val: number | null, ref: number | undefined, unit: string, lowerIsBetter = false) => {
    if (val === null || ref === undefined) return null;
    const delta = Math.round((val - ref) * 10) / 10;
    if (delta === 0) return <div className={subValueClass}>{combineLabel}: {ref}{unit}</div>;
    const isGood = lowerIsBetter ? delta < 0 : delta > 0;
    const color = isGood ? 'text-emerald-500' : 'text-red-400';
    const sign = delta > 0 ? '+' : '';
    return <div className={`text-[10px] ${color}`}>{sign}{delta}{unit} vs {combineLabel}</div>;
  };

  const latestAnthro = {
    height: getLatestMetric(sessions, selectedPlayer, 'height'),
    weight: getLatestMetric(sessions, selectedPlayer, 'weight'),
    wingspan: getLatestMetric(sessions, selectedPlayer, 'wingspan'),
    standingReach: getLatestMetric(sessions, selectedPlayer, 'standingReach'),
    bodyFat: (() => {
      const rawSF = getLatestMetric(sessions, selectedPlayer, 'bodyFat');
      if (rawSF === null) return null;
      const dobSerial = getPlayerDobSerial(selectedPlayer, profiles);
      const latestBFSession = getPlayerSessions(sessions, selectedPlayer).filter(s => s.bodyFat !== null).sort((a, b) => b.date.localeCompare(a.date))[0];
      const bf = calcBodyFatPct(rawSF, dobSerial, latestBFSession?.date);
      return bf !== null ? bf : rawSF;
    })(),
  };

  const latestAthletic = {
    pureVertical: (() => {
      const v = getLatestMetric(sessions, selectedPlayer, 'pureVertical');
      const sr = getLatestMetric(sessions, selectedPlayer, 'standingReach');
      return (v !== null && sr !== null) ? v - sr : null;
    })(),
    noStepVertical: (() => {
      const v = getLatestMetric(sessions, selectedPlayer, 'noStepVertical');
      const sr = getLatestMetric(sessions, selectedPlayer, 'standingReach');
      return (v !== null && sr !== null) ? v - sr : null;
    })(),
    sprint: getLatestMetric(sessions, selectedPlayer, 'sprint'),
    coneDrill: getLatestMetric(sessions, selectedPlayer, 'coneDrill'),
    deadlift: getLatestMetric(sessions, selectedPlayer, 'deadlift'),
  };

  const casData = useMemo(() => {
    const getPlayerAthData = (p: string) => {
      const sr = getLatestMetric(sessions, p, 'standingReach');
      const pv = getLatestMetric(sessions, p, 'pureVertical');
      const nsv = getLatestMetric(sessions, p, 'noStepVertical');
      const maxVert = (pv !== null && sr !== null) ? pv - sr : null;
      const standVert = (nsv !== null && sr !== null) ? nsv - sr : null;
      const sp = getLatestMetric(sessions, p, 'sprint');
      const cd = getLatestMetric(sessions, p, 'coneDrill');
      const dl = getLatestMetric(sessions, p, 'deadlift');
      const wt = getLatestMetric(sessions, p, 'weight');
      const relDL = (dl !== null && wt !== null && wt > 0) ? Math.round((dl / wt) * 100) / 100 : null;
      return { maxVert, standVert, sprint: sp, shuttle: cd, relDeadlift: relDL };
    };

    const allData = players.map(p => ({ player: p, ...getPlayerAthData(p) }));

    const calcStats = (vals: number[]) => {
      if (vals.length < 2) return { mean: vals[0] || 0, std: 1 };
      const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
      const std = Math.sqrt(vals.reduce((a, v) => a + (v - mean) ** 2, 0) / vals.length);
      return { mean, std: std || 1 };
    };

    const maxVertVals = allData.map(d => d.maxVert).filter((v): v is number => v !== null);
    const standVertVals = allData.map(d => d.standVert).filter((v): v is number => v !== null);
    const sprintVals = allData.map(d => d.sprint).filter((v): v is number => v !== null);
    const shuttleVals = allData.map(d => d.shuttle).filter((v): v is number => v !== null);
    const relDLVals = allData.map(d => d.relDeadlift).filter((v): v is number => v !== null);

    const stats = {
      maxVert: calcStats(maxVertVals),
      standVert: calcStats(standVertVals),
      sprint: calcStats(sprintVals),
      shuttle: calcStats(shuttleVals),
      relDL: calcStats(relDLVals),
    };

    const pd = getPlayerAthData(selectedPlayer);
    const availCount = [pd.maxVert, pd.standVert, pd.sprint, pd.shuttle, pd.relDeadlift].filter(v => v !== null).length;
    if (availCount < 4) return null;

    const zScore = (val: number | null, s: { mean: number; std: number }, invert = false): number | null => {
      if (val === null) return null;
      const z = (val - s.mean) / s.std;
      return invert ? -z : z;
    };

    const zMaxVert = zScore(pd.maxVert, stats.maxVert);
    const zStandVert = zScore(pd.standVert, stats.standVert);
    const zSprint = zScore(pd.sprint, stats.sprint, true);
    const zShuttle = zScore(pd.shuttle, stats.shuttle, true);
    const zRelDL = zScore(pd.relDeadlift, stats.relDL);

    const role = profile?.role || '';
    let baseWeights = { maxVert: 0.30, shuttle: 0.25, sprint: 0.15, standVert: 0.15, relDL: 0.15 };
    if (role === 'Playmaker') {
      baseWeights = { maxVert: 0.25, shuttle: 0.35, sprint: 0.15, standVert: 0.10, relDL: 0.15 };
    } else if (role === 'Center') {
      baseWeights = { maxVert: 0.20, shuttle: 0.15, sprint: 0.15, standVert: 0.25, relDL: 0.25 };
    }

    const rawComps = [
      { key: 'maxVert' as const, label: 'Max Vertical', z: zMaxVert, baseW: baseWeights.maxVert, val: pd.maxVert, unit: 'cm' },
      { key: 'shuttle' as const, label: 'Shuttle Run', z: zShuttle, baseW: baseWeights.shuttle, val: pd.shuttle, unit: 's' },
      { key: 'sprint' as const, label: '¾ Sprint', z: zSprint, baseW: baseWeights.sprint, val: pd.sprint, unit: 's' },
      { key: 'standVert' as const, label: 'Standing Vertical', z: zStandVert, baseW: baseWeights.standVert, val: pd.standVert, unit: 'cm' },
      { key: 'relDL' as const, label: 'Rel. Deadlift', z: zRelDL, baseW: baseWeights.relDL, val: pd.relDeadlift, unit: 'x BW' },
    ];

    const availComps = rawComps.filter(c => c.z !== null);
    const totalAvailW = availComps.reduce((a, c) => a + c.baseW, 0);
    const components = rawComps.map(c => ({
      label: c.label,
      z: c.z ?? 0,
      w: c.z !== null ? c.baseW / totalAvailW : 0,
      val: c.val,
      unit: c.unit,
      missing: c.z === null,
    }));

    const cas = availComps.reduce((sum, c) => sum + (c.z as number) * (c.baseW / totalAvailW), 0);
    const casNorm = Math.round((50 + cas * 10) * 10) / 10;
    const jumpDelta = (pd.maxVert !== null && pd.standVert !== null) ? Math.round((pd.maxVert - pd.standVert) * 10) / 10 : null;
    let jumpInsight = '';
    if (jumpDelta !== null) {
      if (jumpDelta < 5) jumpInsight = 'Strong but not springy — focus on plyometrics';
      else if (jumpDelta > 12) jumpInsight = 'Springy but not strong — focus on strength training';
      else jumpInsight = 'Balanced elastic-strength profile';
    }

    return { cas: casNorm, components, jumpDelta, jumpInsight, archetype: role || 'Baseline', partial: availCount < 5 };
  }, [sessions, players, selectedPlayer, profile?.role]);

  const apsData = useMemo(() => {
    const getPlayerAnthroData = (p: string) => {
      const projH = getProjectedHeight(p, profiles, sessions);
      const weight = getLatestMetric(sessions, p, 'weight');
      const wingspan = getLatestMetric(sessions, p, 'wingspan');
      const projR = getProjectedReach(p, profiles, sessions);
      return { projHeight: projH, weight, wingspan, projReach: projR };
    };

    const allData = players.map(p => ({ player: p, ...getPlayerAnthroData(p) }));

    const calcStats = (vals: number[]) => {
      if (vals.length < 2) return { mean: vals[0] || 0, std: 1 };
      const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
      const std = Math.sqrt(vals.reduce((a, v) => a + (v - mean) ** 2, 0) / vals.length);
      return { mean, std: std || 1 };
    };

    const projHVals = allData.map(d => d.projHeight).filter((v): v is number => v !== null);
    const weightVals = allData.map(d => d.weight).filter((v): v is number => v !== null);
    const wingVals = allData.map(d => d.wingspan).filter((v): v is number => v !== null);
    const projRVals = allData.map(d => d.projReach).filter((v): v is number => v !== null);

    const stats = {
      projHeight: calcStats(projHVals),
      weight: calcStats(weightVals),
      wingspan: calcStats(wingVals),
      projReach: calcStats(projRVals),
    };

    const pd = getPlayerAnthroData(selectedPlayer);
    const availCount = [pd.projHeight, pd.weight, pd.wingspan, pd.projReach].filter(v => v !== null).length;
    if (availCount < 3) return null;

    const zScore = (val: number | null, s: { mean: number; std: number }): number | null => {
      if (val === null) return null;
      return (val - s.mean) / s.std;
    };

    const zProjH = zScore(pd.projHeight, stats.projHeight);
    const zWeight = zScore(pd.weight, stats.weight);
    const zWingspan = zScore(pd.wingspan, stats.wingspan);
    const zProjR = zScore(pd.projReach, stats.projReach);

    const baseWeights = { projReach: 0.40, wingspan: 0.30, projHeight: 0.15, weight: 0.15 };

    const rawComps = [
      { key: 'projReach', label: 'Proj. Standing Reach', z: zProjR, baseW: baseWeights.projReach, val: pd.projReach, unit: 'cm' },
      { key: 'wingspan', label: 'Wingspan', z: zWingspan, baseW: baseWeights.wingspan, val: pd.wingspan, unit: 'cm' },
      { key: 'projHeight', label: 'Proj. Height', z: zProjH, baseW: baseWeights.projHeight, val: pd.projHeight, unit: 'cm' },
      { key: 'weight', label: 'Weight', z: zWeight, baseW: baseWeights.weight, val: pd.weight, unit: 'kg' },
    ];

    const availComps = rawComps.filter(c => c.z !== null);
    const totalAvailW = availComps.reduce((a, c) => a + c.baseW, 0);
    const components = rawComps.map(c => ({
      label: c.label,
      z: c.z ?? 0,
      w: c.z !== null ? c.baseW / totalAvailW : 0,
      val: c.val,
      unit: c.unit,
      missing: c.z === null,
    }));

    const aps = availComps.reduce((sum, c) => sum + (c.z as number) * (c.baseW / totalAvailW), 0);
    const apsNorm = Math.round((50 + aps * 10) * 10) / 10;

    const apeIndex = (pd.wingspan !== null && pd.projHeight !== null && pd.projHeight > 0) ? Math.round((pd.wingspan / pd.projHeight) * 1000) / 1000 : null;

    return { aps: apsNorm, components, apeIndex, partial: availCount < 4 };
  }, [sessions, players, selectedPlayer, profiles]);

  const totalTaken = ps.reduce((a, s) => a + (s.shootsTaken || 0), 0);
  const totalMade = ps.reduce((a, s) => a + (s.shootsMade || 0), 0);
  const overallPct = totalTaken > 0 ? Math.round((totalMade / totalTaken) * 1000) / 10 : null;

  const cardClass = `rounded-xl border p-5 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} shadow-sm`;
  const labelClass = `text-[11px] font-medium print-label ${isDark ? 'text-gray-500' : 'text-gray-400'}`;
  const valueClass = `text-sm font-semibold print-value ${isDark ? 'text-white' : 'text-gray-900'}`;
  const subValueClass = `text-xs print-sub ${isDark ? 'text-gray-400' : 'text-gray-500'}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 print-container">
      <div className="no-print flex items-center gap-3 flex-wrap">
        <div className="w-48">
          <PlayerSelector players={players} selected={selectedPlayer} onChange={setSelectedPlayer} />
        </div>
        <select
          value={selectedMonth || ''}
          onChange={e => setSelectedMonth(e.target.value || null)}
          className={`px-3 py-2 rounded-lg text-xs font-medium border ${isDark ? 'bg-gray-800 text-gray-300 border-gray-700' : 'bg-white text-gray-600 border-gray-200'} shadow-sm`}
        >
          <option value="">{t('Full Season')}</option>
          {availableMonths.map(m => {
            const [y, mo] = m.split('-');
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            return <option key={m} value={m}>{monthNames[parseInt(mo) - 1]} {y}</option>;
          })}
        </select>
        <button
          onClick={handlePrint}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${isDark ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'} shadow-sm`}
        >
          <Printer size={14} />
          <span className="hidden sm:inline">{t('Print')}</span>
        </button>
      </div>

      {monthLabel && (
        <div className={`text-center py-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          <h2 className="text-lg font-bold">{monthLabel}</h2>
        </div>
      )}

      <div className={`${cardClass} print-page`}>
        <div className="print-header hidden">
          <div className="print-header-logos">
            <img src="https://i.imgur.com/e7khORs.png" alt="PV" className="print-logo" />
            <div className="print-header-center">
              <div className="print-header-name">{selectedPlayer}{monthLabel ? ` — ${monthLabel}` : ''}</div>
              <div className="print-header-meta">{profile?.role || ''} · {category || ''} · {profile?.season || currentSeason || ''}</div>
            </div>
            <img src="https://i.imgur.com/r1fWDF1.png" alt="VB" className="print-logo" />
          </div>
        </div>
        <div className="flex items-center gap-2 mb-4 print-mb-sm">
          <User size={14} className="text-orange-500" />
          <h3 className={`text-sm font-bold print-section-title ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('Info')}</h3>
        </div>
        <div className="flex flex-col sm:flex-row gap-5 print-grid">
          <div className="flex-shrink-0 flex flex-col items-center">
            {profile?.mugShot ? (
              <img src={profile.mugShot} alt={selectedPlayer} className="w-28 h-28 print-photo rounded-xl object-cover border-2 border-orange-500/30" />
            ) : (
              <div className={`w-28 h-28 print-photo rounded-xl flex items-center justify-center text-3xl font-bold ${isDark ? 'bg-gray-800 text-gray-600' : 'bg-gray-100 text-gray-300'}`}>
                {selectedPlayer.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
              </div>
            )}
            <span className={`text-lg font-bold mt-2 print-value ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedPlayer.split(' ').pop()}</span>
            <span className={`text-xs print-sub ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{selectedPlayer.split(' ').slice(0, -1).join(' ')}</span>
          </div>

          <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-3 print-grid">
            <div>
              <div className={labelClass}>{t('Role')}</div>
              <div className={valueClass}>{profile?.role || '—'}</div>
            </div>
            <div>
              <div className={labelClass}>{t('Category')}</div>
              <div className={valueClass}>{category || '—'}</div>
            </div>
            <div>
              <div className={labelClass}>{t('DOB')}</div>
              <div className={valueClass}>{playerDobFormatted || '—'}</div>
              {playerAge !== null && <div className={subValueClass}>{playerAge} {t('years')}</div>}
            </div>
            <div>
              <div className={labelClass}>{t('Email')}</div>
              <div className={valueClass}>{profile?.email || '—'}</div>
            </div>
            <div>
              <div className={labelClass}>{t('Phone')}</div>
              <div className={valueClass}>{profile?.cellNumber || '—'}</div>
            </div>
            <div>
              <div className={labelClass}>{t('Passport')}</div>
              <div className={valueClass}>{profile?.passport || '—'}</div>
            </div>
            <div>
              <div className={labelClass}>{t('Italian Formation')}</div>
              <div className={valueClass}>{profile?.italianFormation !== null && profile?.italianFormation !== undefined ? (profile.italianFormation === 1 ? t('Yes') : t('No')) : '—'}</div>
            </div>
            <div>
              <div className={labelClass}>{t('Season')}</div>
              <div className={valueClass}>{profile?.season || currentSeason || '—'}</div>
            </div>
            <div>
              <div className={labelClass}>{t('SoY Status')}</div>
              <div className={valueClass}>{profile?.soyStatus || '—'}</div>
            </div>
            <div>
              <div className={labelClass}>{t("Mom's Height")}</div>
              <div className={valueClass}>{profile?.momHeight !== null && profile?.momHeight !== undefined ? `${profile.momHeight} cm` : '—'}</div>
            </div>
            <div>
              <div className={labelClass}>{t("Dad's Height")}</div>
              <div className={valueClass}>{profile?.dadHeight !== null && profile?.dadHeight !== undefined ? `${profile.dadHeight} cm` : '—'}</div>
            </div>
            <div>
              <div className={labelClass}>{t('Total Load')}</div>
              <div className={valueClass}>{ps.reduce((a, s) => a + (s.practiceLoad || 0) + (s.vitaminsLoad || 0) + (s.weightsLoad || 0) + (s.gameLoad || 0), 0).toLocaleString()}</div>
            </div>
            <div>
              <div className={labelClass}>{t('Sessions')}</div>
              <div className={valueClass}>{sessionCount}</div>
              <div className={subValueClass}>{playerSeasons.length} {t('seasons')}</div>
            </div>
            <div>
              <div className={labelClass}>{t('Availability')}</div>
              <div className={`text-sm font-semibold ${availabilityPct !== null && availabilityPct >= 90 ? 'text-emerald-500' : availabilityPct !== null && availabilityPct >= 70 ? 'text-amber-500' : 'text-red-500'}`}>
                {availabilityPct !== null ? `${availabilityPct}%` : '—'}
              </div>
              {injuryCount > 0 && <div className={subValueClass}>{injuryCount} {t('injury sessions')}</div>}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-4 print-assessment-grid">
          <div className={`rounded-lg p-3 print-inner ${isDark ? 'bg-emerald-900/20 border border-emerald-800/30' : 'bg-emerald-50/50 border border-emerald-100'}`}>
            <div className={`text-[11px] font-semibold mb-2 flex items-center gap-1.5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
              <span>✦</span> {t('Strengths')}
            </div>
            <ul className={`text-xs space-y-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              <li className="flex items-start gap-1.5"><span className="text-emerald-500 mt-0.5">•</span>{t('Strength placeholder 1')}</li>
              <li className="flex items-start gap-1.5"><span className="text-emerald-500 mt-0.5">•</span>{t('Strength placeholder 2')}</li>
              <li className="flex items-start gap-1.5"><span className="text-emerald-500 mt-0.5">•</span>{t('Strength placeholder 3')}</li>
            </ul>
          </div>
          <div className={`rounded-lg p-3 print-inner ${isDark ? 'bg-red-900/20 border border-red-800/30' : 'bg-red-50/50 border border-red-100'}`}>
            <div className={`text-[11px] font-semibold mb-2 flex items-center gap-1.5 ${isDark ? 'text-red-400' : 'text-red-600'}`}>
              <span>✦</span> {t('Weaknesses')}
            </div>
            <ul className={`text-xs space-y-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              <li className="flex items-start gap-1.5"><span className="text-red-400 mt-0.5">•</span>{t('Weakness placeholder 1')}</li>
              <li className="flex items-start gap-1.5"><span className="text-red-400 mt-0.5">•</span>{t('Weakness placeholder 2')}</li>
              <li className="flex items-start gap-1.5"><span className="text-red-400 mt-0.5">•</span>{t('Weakness placeholder 3')}</li>
            </ul>
          </div>
          <div className={`rounded-lg p-3 print-inner ${isDark ? 'bg-amber-900/20 border border-amber-800/30' : 'bg-amber-50/50 border border-amber-100'}`}>
            <div className={`text-[11px] font-semibold mb-2 flex items-center gap-1.5 ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
              <span>✦</span> {t('Points of Emphasis')}
            </div>
            <ul className={`text-xs space-y-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              <li className="flex items-start gap-1.5"><span className="text-amber-500 mt-0.5">•</span>{t('Emphasis placeholder 1')}</li>
              <li className="flex items-start gap-1.5"><span className="text-amber-500 mt-0.5">•</span>{t('Emphasis placeholder 2')}</li>
              <li className="flex items-start gap-1.5"><span className="text-amber-500 mt-0.5">•</span>{t('Emphasis placeholder 3')}</li>
            </ul>
          </div>
          <div className={`rounded-lg p-3 print-inner ${isDark ? 'bg-sky-900/20 border border-sky-800/30' : 'bg-sky-50/50 border border-sky-100'}`}>
            <div className={`text-[11px] font-semibold mb-2 flex items-center gap-1.5 ${isDark ? 'text-sky-400' : 'text-sky-600'}`}>
              <span>✦</span> {t('Health Report')}
            </div>
            <ul className={`text-xs space-y-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              <li className="flex items-start gap-1.5"><span className="text-sky-500 mt-0.5">•</span>{t('Health placeholder 1')}</li>
              <li className="flex items-start gap-1.5"><span className="text-sky-500 mt-0.5">•</span>{t('Health placeholder 2')}</li>
              <li className="flex items-start gap-1.5"><span className="text-sky-500 mt-0.5">•</span>{t('Health placeholder 3')}</li>
            </ul>
          </div>
        </div>

        <div className="mt-5 print-anthro-section">
          <div className="flex items-center gap-2 mb-3 print-mb-sm">
            <Ruler size={14} className="text-blue-500" />
            <h3 className={`text-sm font-bold print-section-title ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('Anthropometrics')}</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 print-anthro-cards">
            <div className={`rounded-lg p-3 print-inner-sm print-stat-card ${isDark ? 'bg-gray-800/60' : 'bg-blue-50/50'}`}>
              <div className={labelClass}>{t('Height')}</div>
              <div className={`text-lg font-bold print-value-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>{latestAnthro.height !== null ? `${latestAnthro.height}` : '—'}<span className="text-xs font-normal ml-0.5 print-sub">cm</span></div>
              {renderDelta(latestAnthro.height, combineRef?.height, ' cm')}
            </div>
            <div className={`rounded-lg p-3 print-inner-sm print-stat-card ${isDark ? 'bg-gray-800/60' : 'bg-indigo-50/50'}`}>
              <div className={labelClass}>{t('Projected Height')} (KR)</div>
              <div className={`text-lg font-bold print-value-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>{(() => { const ph = getProjectedHeight(selectedPlayer, profiles, sessions); return ph !== null ? `${ph}` : '—'; })()}<span className="text-xs font-normal ml-0.5 print-sub">cm</span></div>
              {profile?.midParentalHeight && <div className={subValueClass}>MPH: {profile.midParentalHeight} cm</div>}
            </div>
            <div className={`rounded-lg p-3 print-inner-sm print-stat-card ${isDark ? 'bg-gray-800/60' : 'bg-green-50/50'}`}>
              <div className={labelClass}>{t('Weight')}</div>
              <div className={`text-lg font-bold print-value-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>{latestAnthro.weight !== null ? `${latestAnthro.weight}` : '—'}<span className="text-xs font-normal ml-0.5 print-sub">kg</span></div>
              {renderDelta(latestAnthro.weight, combineRef?.weight, ' kg')}
            </div>
            <div className={`rounded-lg p-3 print-inner-sm print-stat-card ${isDark ? 'bg-gray-800/60' : 'bg-purple-50/50'}`}>
              <div className={labelClass}>{t('Wingspan')}</div>
              <div className={`text-lg font-bold print-value-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>{latestAnthro.wingspan !== null ? `${latestAnthro.wingspan}` : '—'}<span className="text-xs font-normal ml-0.5 print-sub">cm</span></div>
              {latestAnthro.height && latestAnthro.wingspan && (
                <div className={subValueClass}>+{Math.round((latestAnthro.wingspan - latestAnthro.height) * 10) / 10} vs H</div>
              )}
              {renderDelta(latestAnthro.wingspan, combineRef?.wingspan, ' cm')}
            </div>
            <div className={`rounded-lg p-3 print-inner-sm print-stat-card ${isDark ? 'bg-gray-800/60' : 'bg-cyan-50/50'}`}>
              <div className={labelClass}>{t('Standing Reach')}</div>
              <div className={`text-lg font-bold print-value-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>{latestAnthro.standingReach !== null ? `${latestAnthro.standingReach}` : '—'}<span className="text-xs font-normal ml-0.5 print-sub">cm</span></div>
              {(() => { const pr = getProjectedReach(selectedPlayer, profiles, sessions); return pr ? <div className={subValueClass}>{t('Proj')}: {pr} cm</div> : null; })()}
              {renderDelta(latestAnthro.standingReach, combineRef?.standingReach, ' cm')}
            </div>
            <div className={`rounded-lg p-3 print-inner-sm print-stat-card ${isDark ? 'bg-gray-800/60' : 'bg-red-50/50'}`}>
              <div className={labelClass}>{t('Body Fat')}</div>
              <div className={`text-lg font-bold print-value-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>{latestAnthro.bodyFat !== null ? `${latestAnthro.bodyFat}` : '—'}<span className="text-xs font-normal ml-0.5 print-sub">%</span></div>
            </div>
          </div>

          {apsData && (
            <div className={`rounded-xl border p-4 mt-4 print-aps ${isDark ? 'bg-gradient-to-r from-blue-500/5 to-gray-900 border-blue-500/20' : 'bg-gradient-to-r from-blue-50 to-white border-blue-200'}`}>
              <div className="flex flex-col sm:flex-row gap-4 items-start">
                <div className="flex-shrink-0 text-center sm:text-left sm:min-w-[120px]">
                  <button
                    onClick={() => setShowApsInfo(true)}
                    className={`text-4xl sm:text-5xl font-black uppercase tracking-widest mb-2 cursor-pointer transition-colors ${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'}`}
                  >
                    APS
                  </button>
                  <div className={`text-4xl font-black leading-none ${apsData.aps >= 55 ? 'text-emerald-500' : apsData.aps >= 45 ? (isDark ? 'text-white' : 'text-gray-900') : 'text-red-400'}`}>
                    {apsData.aps}
                  </div>
                  {apsData.partial && <div className={`text-[10px] mt-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>*</div>}
                </div>

                <div className="flex-1 min-w-0 w-full">
                  <div className="space-y-1.5">
                    {apsData.components.map((c, i) => {
                      if (c.missing) {
                        return (
                          <div key={i} className="flex items-center gap-2 opacity-40">
                            <div className={`w-24 sm:w-28 text-[10px] font-medium text-right flex-shrink-0 line-through ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                              {t(c.label)}
                            </div>
                            <div className={`flex-1 h-4 rounded-full overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`} />
                            <div className={`w-14 text-[10px] font-mono text-right flex-shrink-0 ${isDark ? 'text-gray-600' : 'text-gray-300'}`}>N/A</div>
                            <div className={`w-16 text-[10px] text-right flex-shrink-0 ${isDark ? 'text-gray-600' : 'text-gray-300'}`}>—</div>
                          </div>
                        );
                      }
                      const barWidth = Math.min(Math.max((c.z + 3) / 6 * 100, 2), 100);
                      const isPositive = c.z >= 0;
                      return (
                        <div key={i} className="flex items-center gap-2">
                          <div className={`w-24 sm:w-28 text-[10px] font-medium text-right flex-shrink-0 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            {t(c.label)} <span className={`${isDark ? 'text-gray-600' : 'text-gray-300'}`}>({Math.round(c.w * 100)}%)</span>
                          </div>
                          <div className={`relative flex-1 h-4 rounded-full overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                            <div
                              className={`h-full rounded-full transition-all ${isPositive ? 'bg-gradient-to-r from-blue-500 to-blue-400' : 'bg-gradient-to-r from-red-500/60 to-red-400/60'}`}
                              style={{ width: `${barWidth}%` }}
                            />
                            <div className={`absolute top-0 left-1/2 w-px h-full ${isDark ? 'bg-gray-500/60' : 'bg-gray-400/50'}`} />
                          </div>
                          <div className={`w-14 text-[10px] font-mono text-right flex-shrink-0 ${isPositive ? (isDark ? 'text-blue-400' : 'text-blue-600') : 'text-red-400'}`}>
                            {c.z > 0 ? '+' : ''}{Math.round(c.z * 100) / 100}
                          </div>
                          <div className={`w-16 text-[10px] text-right flex-shrink-0 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            {c.val !== null ? `${c.val} ${c.unit}` : '—'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {apsData.apeIndex !== null && (
                <div className={`mt-3 pt-3 border-t flex items-center gap-2 ${isDark ? 'border-gray-800' : 'border-blue-100'}`}>
                  <div className={`text-[10px] font-bold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {t('Ape Index')}: <span className={isDark ? 'text-white' : 'text-gray-900'}>{apsData.apeIndex}</span>
                  </div>
                  <div className={`text-[10px] px-2 py-0.5 rounded-full ${isDark ? 'bg-gray-800 text-gray-400' : 'bg-blue-50 text-gray-500'}`}>
                    {apsData.apeIndex >= 1.06 ? t('Elite functional length') : apsData.apeIndex >= 1.03 ? t('Above-average length') : t('Average proportions')}
                  </div>
                </div>
              )}
            </div>
          )}

          {showApsInfo && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowApsInfo(false)}>
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
              <div
                className={`relative max-w-lg w-full max-h-[80vh] overflow-y-auto rounded-2xl border shadow-2xl p-6 ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}
                onClick={e => e.stopPropagation()}
              >
                <button
                  onClick={() => setShowApsInfo(false)}
                  className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
                >
                  ✕
                </button>

                <h3 className={`text-lg font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Anthropometric Potential Score (APS)
                </h3>
                <p className={`text-xs mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  A position-adjusted composite score that quantifies a player's physical foundation, moving beyond raw height to emphasize "functional length." It assesses how a player's physical frame enables or constrains their on-court potential by comparing them to elite NBA Combine benchmarks.
                </p>

                <h4 className={`text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                  The Four Pillars of Physical Structure
                </h4>
                <div className="space-y-2 mb-4">
                  {[
                    { name: 'Height & Weight', desc: 'Foundational measures of a player\'s mass and scale.' },
                    { name: 'Wingspan', desc: 'A premier metric for defensive potential, allowing players to contest more shots and disrupt passing lanes. The ratio of wingspan to height (the "Ape Index") is a key indicator of disproportionate length.' },
                    { name: 'Standing Reach', desc: 'Arguably the most important single measurement — it synthesizes height and length to define a player\'s ability to control vertical space around the basket, directly impacting rim protection, rebounding, and finishing.' },
                  ].map((c, i) => (
                    <div key={i} className={`rounded-lg p-2.5 ${isDark ? 'bg-gray-800/60' : 'bg-gray-50'}`}>
                      <div className={`text-xs font-semibold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{c.name}</div>
                      <div className={`text-[11px] mt-0.5 leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{c.desc}</div>
                    </div>
                  ))}
                </div>

                <h4 className={`text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                  APS Calculation
                </h4>
                <p className={`text-[11px] leading-relaxed mb-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Calculated as a weighted sum of Z-scores for the four pillars. Each player is measured against the mean and standard deviation for their group. Projected height and projected standing reach are used to account for growth potential in developing players.
                </p>

                <h4 className={`text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                  Component Weightings
                </h4>
                <div className={`rounded-lg overflow-hidden border mb-3 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                  <table className="w-full text-xs">
                    <thead>
                      <tr className={isDark ? 'bg-gray-800' : 'bg-gray-50'}>
                        <th className={`text-left py-2 px-3 font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Metric</th>
                        <th className={`text-right py-2 px-3 font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Weight</th>
                        <th className={`text-left py-2 px-3 font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Rationale</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ['Proj. Standing Reach', '40%', 'Most direct measure of effective size and vertical space control'],
                        ['Wingspan', '30%', 'Primary determinant of defensive versatility and disruption'],
                        ['Proj. Height', '15%', 'Baseline measure of overall scale'],
                        ['Weight', '15%', 'Essential for physicality and durability'],
                      ].map(([name, w, why], i) => (
                        <tr key={i} className={`border-t ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
                          <td className={`py-1.5 px-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{name}</td>
                          <td className={`py-1.5 px-3 text-right font-semibold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>{w}</td>
                          <td className={`py-1.5 px-3 text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{why}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className={`rounded-lg p-3 border-l-4 ${isDark ? 'bg-blue-500/5 border-blue-500/40' : 'bg-blue-50 border-blue-400'}`}>
                  <div className={`text-xs font-semibold mb-0.5 ${isDark ? 'text-blue-400' : 'text-blue-700'}`}>Ape Index</div>
                  <div className={`text-[11px] leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    The ratio of wingspan to height. Values above 1.05 indicate disproportionate length — a key physical advantage for defense, rebounding, and finishing at the rim.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className={`${cardClass} print-page`}>
        <div className="print-header hidden">
          <div className="print-header-logos">
            <img src="https://i.imgur.com/e7khORs.png" alt="PV" className="print-logo" />
            <div className="print-header-center">
              <div className="print-header-name">{selectedPlayer}{monthLabel ? ` — ${monthLabel}` : ''}</div>
              <div className="print-header-meta">{profile?.role || ''} · {category || ''} · {profile?.season || currentSeason || ''}</div>
            </div>
            <img src="https://i.imgur.com/r1fWDF1.png" alt="VB" className="print-logo" />
          </div>
        </div>
        <div className="flex items-center gap-2 mb-4 print-mb-sm">
          <Zap size={14} className="text-amber-500" />
          <h3 className={`text-sm font-bold print-section-title ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('Performance')}</h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-5 print-perf-cards print-mb-sm">
          <div className={`rounded-lg p-3 print-inner-sm text-center print-stat-card ${isDark ? 'bg-gray-800/60' : 'bg-cyan-50/50'}`}>
            <div className={labelClass}>{t('Pure Vertical')}</div>
            <div className={`text-xl font-bold print-value-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>{latestAthletic.pureVertical !== null ? latestAthletic.pureVertical : '—'}<span className="text-xs font-normal ml-0.5 print-sub">cm</span></div>
            {renderDelta(latestAthletic.pureVertical, combineRef?.pureVertical, ' cm')}
          </div>
          <div className={`rounded-lg p-3 print-inner-sm text-center print-stat-card ${isDark ? 'bg-gray-800/60' : 'bg-violet-50/50'}`}>
            <div className={labelClass}>{t('No-Step Vertical')}</div>
            <div className={`text-xl font-bold print-value-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>{latestAthletic.noStepVertical !== null ? latestAthletic.noStepVertical : '—'}<span className="text-xs font-normal ml-0.5 print-sub">cm</span></div>
            {renderDelta(latestAthletic.noStepVertical, combineRef?.noStepVertical, ' cm')}
          </div>
          <div className={`rounded-lg p-3 print-inner-sm text-center print-stat-card ${isDark ? 'bg-gray-800/60' : 'bg-orange-50/50'}`}>
            <div className={labelClass}>{t('Sprint')}</div>
            <div className={`text-xl font-bold print-value-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>{latestAthletic.sprint !== null ? latestAthletic.sprint : '—'}<span className="text-xs font-normal ml-0.5 print-sub">ms</span></div>
            {renderDelta(latestAthletic.sprint, combineRef?.sprint, 's', true)}
          </div>
          <div className={`rounded-lg p-3 print-inner-sm text-center print-stat-card ${isDark ? 'bg-gray-800/60' : 'bg-pink-50/50'}`}>
            <div className={labelClass}>{t('Cone Drill')}</div>
            <div className={`text-xl font-bold print-value-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>{latestAthletic.coneDrill !== null ? latestAthletic.coneDrill : '—'}<span className="text-xs font-normal ml-0.5 print-sub">ms</span></div>
            {renderDelta(latestAthletic.coneDrill, combineRef?.coneDrill, 's', true)}
          </div>
          <div className={`rounded-lg p-3 print-inner-sm text-center print-stat-card ${isDark ? 'bg-gray-800/60' : 'bg-green-50/50'}`}>
            <div className={labelClass}>{t('Deadlift')}</div>
            <div className={`text-xl font-bold print-value-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>{latestAthletic.deadlift !== null ? latestAthletic.deadlift : '—'}<span className="text-xs font-normal ml-0.5 print-sub">kg</span></div>
          </div>
          <div className={`rounded-lg p-3 print-inner-sm text-center print-stat-card ${isDark ? 'bg-gray-800/60' : 'bg-amber-50/50'}`}>
            <div className={labelClass}>{t('3PT %')}</div>
            <div className={`text-xl font-bold print-value-lg ${overallPct !== null && overallPct >= 40 ? 'text-emerald-500' : overallPct !== null && overallPct >= 30 ? 'text-amber-500' : isDark ? 'text-white' : 'text-gray-900'}`}>
              {overallPct !== null ? overallPct : '—'}<span className="text-xs font-normal ml-0.5 print-sub">%</span>
            </div>
            <div className={subValueClass}>{totalMade}/{totalTaken}</div>
          </div>
        </div>

        {casData && (
          <div className={`rounded-xl border p-4 mb-5 print-cas ${isDark ? 'bg-gradient-to-r from-orange-500/5 to-gray-900 border-orange-500/20' : 'bg-gradient-to-r from-orange-50 to-white border-orange-200'}`}>
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <div className="flex-shrink-0 text-center sm:text-left sm:min-w-[120px]">
                <button
                  onClick={() => setShowCasInfo(true)}
                  className={`text-4xl sm:text-5xl font-black uppercase tracking-widest mb-2 cursor-pointer transition-colors ${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'}`}
                >
                  CAS
                </button>
                <div className={`text-6xl sm:text-7xl font-black leading-none ${casData.cas >= 55 ? 'text-emerald-500' : casData.cas >= 45 ? (isDark ? 'text-white' : 'text-gray-900') : 'text-red-400'}`}>
                  {casData.cas}
                </div>
                <div className={`text-[10px] mt-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  {casData.archetype} {t('weights')}{casData.partial ? ' *' : ''}
                </div>
              </div>

              <div className="flex-1 min-w-0 w-full">
                <div className="space-y-1.5">
                  {casData.components.map((c, i) => {
                    if (c.missing) {
                      return (
                        <div key={i} className="flex items-center gap-2 opacity-40">
                          <div className={`w-24 sm:w-28 text-[10px] font-medium text-right flex-shrink-0 line-through ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            {t(c.label)}
                          </div>
                          <div className={`flex-1 h-4 rounded-full overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`} />
                          <div className={`w-14 text-[10px] font-mono text-right flex-shrink-0 ${isDark ? 'text-gray-600' : 'text-gray-300'}`}>N/A</div>
                          <div className={`w-16 text-[10px] text-right flex-shrink-0 ${isDark ? 'text-gray-600' : 'text-gray-300'}`}>—</div>
                        </div>
                      );
                    }
                    const barWidth = Math.min(Math.max((c.z + 3) / 6 * 100, 2), 100);
                    const isPositive = c.z >= 0;
                    return (
                      <div key={i} className="flex items-center gap-2">
                        <div className={`w-24 sm:w-28 text-[10px] font-medium text-right flex-shrink-0 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          {t(c.label)} <span className={`${isDark ? 'text-gray-600' : 'text-gray-300'}`}>({Math.round(c.w * 100)}%)</span>
                        </div>
                        <div className={`relative flex-1 h-4 rounded-full overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                          <div
                            className={`h-full rounded-full transition-all ${isPositive ? 'bg-gradient-to-r from-orange-500 to-orange-400' : 'bg-gradient-to-r from-red-500/60 to-red-400/60'}`}
                            style={{ width: `${barWidth}%` }}
                          />
                          <div className={`absolute top-0 left-1/2 w-px h-full ${isDark ? 'bg-gray-500/60' : 'bg-gray-400/50'}`} />
                        </div>
                        <div className={`w-14 text-[10px] font-mono text-right flex-shrink-0 ${isPositive ? (isDark ? 'text-orange-400' : 'text-orange-600') : 'text-red-400'}`}>
                          {c.z > 0 ? '+' : ''}{Math.round(c.z * 100) / 100}
                        </div>
                        <div className={`w-16 text-[10px] text-right flex-shrink-0 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                          {c.val !== null ? `${c.val} ${c.unit}` : '—'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {casData.jumpDelta !== null && (
              <div className={`mt-3 pt-3 border-t flex items-center gap-2 ${isDark ? 'border-gray-800' : 'border-orange-100'}`}>
                <div className={`text-[10px] font-bold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {t('Jump Delta')}: <span className={isDark ? 'text-white' : 'text-gray-900'}>{casData.jumpDelta} cm</span>
                </div>
                <div className={`text-[10px] px-2 py-0.5 rounded-full ${isDark ? 'bg-gray-800 text-gray-400' : 'bg-orange-50 text-gray-500'}`}>
                  {t(casData.jumpInsight)}
                </div>
              </div>
            )}
          </div>
        )}

        {showCasInfo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowCasInfo(false)}>
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <div
              className={`relative max-w-lg w-full max-h-[80vh] overflow-y-auto rounded-2xl border shadow-2xl p-6 ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={() => setShowCasInfo(false)}
                className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
              >
                ✕
              </button>

              <h3 className={`text-lg font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Composite Athleticism Score (CAS)
              </h3>
              <p className={`text-xs mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                A single score designed to quantify a player's overall basketball-specific athleticism, derived from a five-test battery measuring explosive power, speed, agility, and functional strength.
              </p>

              <h4 className={`text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>
                Core Components & On-Court Relevance
              </h4>
              <div className="space-y-2 mb-4">
                {[
                  { name: 'Shuttle Run', desc: 'Measures agility, body control, and the ability to change direction efficiently — crucial for perimeter defense and offensive cutting.' },
                  { name: '¾ Court Sprint', desc: 'A pure test of linear speed and acceleration over 22.86m, directly translating to transition offense and defense.' },
                  { name: 'Standing Vertical Leap', desc: 'Measures static, concentric lower-body power — important for rebounding in traffic and contesting shots without a running start.' },
                  { name: 'Max Vertical Leap', desc: 'Measures dynamic, elastic power with a running start — the "highlight reel" jump for dunks and chase-down blocks.' },
                  { name: 'Hex Bar Deadlift 1RM (Relative)', desc: 'Quantifies foundational total-body strength relative to bodyweight — the bedrock for all other athletic qualities and injury resilience.' },
                ].map((c, i) => (
                  <div key={i} className={`rounded-lg p-2.5 ${isDark ? 'bg-gray-800/60' : 'bg-gray-50'}`}>
                    <div className={`text-xs font-semibold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{c.name}</div>
                    <div className={`text-[11px] mt-0.5 leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{c.desc}</div>
                  </div>
                ))}
              </div>

              <div className={`rounded-lg p-3 mb-4 border-l-4 ${isDark ? 'bg-orange-500/5 border-orange-500/40' : 'bg-orange-50 border-orange-400'}`}>
                <div className={`text-xs font-semibold mb-0.5 ${isDark ? 'text-orange-400' : 'text-orange-700'}`}>Jump Delta</div>
                <div className={`text-[11px] leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  The difference between Max and Standing Vertical Leaps. This reveals whether an athlete is "strong but not springy" or "springy but not strong," guiding targeted training interventions.
                </div>
              </div>

              <h4 className={`text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>
                CAS Calculation
              </h4>
              <p className={`text-[11px] leading-relaxed mb-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Calculated as a weighted sum of normalized Z-scores for each test. Z-scores standardize results by measuring how many standard deviations a player is from the group average. Scores for timed events (sprint, shuttle) are inverted so that a faster time results in a higher score.
              </p>

              <h4 className={`text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>
                Baseline Weightings
              </h4>
              <div className={`rounded-lg overflow-hidden border mb-3 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <table className="w-full text-xs">
                  <thead>
                    <tr className={isDark ? 'bg-gray-800' : 'bg-gray-50'}>
                      <th className={`text-left py-2 px-3 font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Test Component</th>
                      <th className={`text-right py-2 px-3 font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Weight</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['Max Vertical Leap', '30%'],
                      ['Shuttle Run', '25%'],
                      ['Three-Quarter Sprint', '15%'],
                      ['Standing Vertical Leap', '15%'],
                      ['Hex Bar Deadlift (Relative)', '15%'],
                    ].map(([name, w], i) => (
                      <tr key={i} className={`border-t ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
                        <td className={`py-1.5 px-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{name}</td>
                        <td className={`py-1.5 px-3 text-right font-semibold ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>{w}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p className={`text-[11px] leading-relaxed ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                Weights are adjusted for three archetypes — <span className={`font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Guards</span> (Shuttle 35%), <span className={`font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Wings</span> (baseline), and <span className={`font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Bigs</span> (Deadlift & Standing Vertical 25% each) — to reflect the athletic demands of each position.
              </p>
            </div>
          </div>
        )}

        {(() => {
          const sr = getLatestMetric(sessions, selectedPlayer, 'standingReach');
          const avg = (arr: number[]) => arr.length > 0 ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length * 10) / 10 : null;
          const weeklyBuckets = getWeeklyBuckets(ps);

          const buildGroupedData = () => {
            type AthGroup = { sprint: number[]; coneDrill: number[]; pureVert: number[]; noStepVert: number[]; deadlift: number[] };
            type ShotGroup = { taken: number; made: number };
            const athleticMap: Record<string, AthGroup> = {};
            const shootingMap: Record<string, ShotGroup> = {};

            if (weeklyBuckets) {
              weeklyBuckets.forEach(({ week, sessions: ws }) => {
                const key = `W${week}`;
                athleticMap[key] = { sprint: [], coneDrill: [], pureVert: [], noStepVert: [], deadlift: [] };
                shootingMap[key] = { taken: 0, made: 0 };
                ws.forEach(s => {
                  if (s.sprint !== null) athleticMap[key].sprint.push(s.sprint);
                  if (s.coneDrill !== null) athleticMap[key].coneDrill.push(s.coneDrill);
                  if (s.pureVertical !== null && sr !== null) athleticMap[key].pureVert.push(s.pureVertical - sr);
                  if (s.noStepVertical !== null && sr !== null) athleticMap[key].noStepVert.push(s.noStepVertical - sr);
                  if (s.deadlift !== null) athleticMap[key].deadlift.push(s.deadlift);
                  shootingMap[key].taken += s.shootsTaken || 0;
                  shootingMap[key].made += s.shootsMade || 0;
                });
              });
            } else {
              ps.forEach(s => {
                const key = s.date.substring(0, 7);
                if (!athleticMap[key]) athleticMap[key] = { sprint: [], coneDrill: [], pureVert: [], noStepVert: [], deadlift: [] };
                if (s.sprint !== null) athleticMap[key].sprint.push(s.sprint);
                if (s.coneDrill !== null) athleticMap[key].coneDrill.push(s.coneDrill);
                if (s.pureVertical !== null && sr !== null) athleticMap[key].pureVert.push(s.pureVertical - sr);
                if (s.noStepVertical !== null && sr !== null) athleticMap[key].noStepVert.push(s.noStepVertical - sr);
                if (s.deadlift !== null) athleticMap[key].deadlift.push(s.deadlift);
                if (!shootingMap[key]) shootingMap[key] = { taken: 0, made: 0 };
                shootingMap[key].taken += s.shootsTaken || 0;
                shootingMap[key].made += s.shootsMade || 0;
              });
            }
            return { athleticMap, shootingMap };
          };

          const { athleticMap, shootingMap } = buildGroupedData();
          const sortedKeys = Object.keys(athleticMap).sort((a, b) => a.localeCompare(b));
          const dateLabel = (k: string) => weeklyBuckets ? k : k.substring(2);

          const speedData = sortedKeys
            .filter(k => athleticMap[k].sprint.length > 0 || athleticMap[k].coneDrill.length > 0)
            .map(k => ({
              date: dateLabel(k),
              [t('Sprint')]: avg(athleticMap[k].sprint),
              [t('Cone Drill')]: avg(athleticMap[k].coneDrill),
            }));

          const verticalsData = sortedKeys
            .filter(k => athleticMap[k].pureVert.length > 0 || athleticMap[k].noStepVert.length > 0)
            .map(k => ({
              date: dateLabel(k),
              [t('Pure Vertical')]: avg(athleticMap[k].pureVert),
              [t('No-Step Vertical')]: avg(athleticMap[k].noStepVert),
            }));

          const deadliftData = sortedKeys
            .filter(k => athleticMap[k].deadlift.length > 0)
            .map(k => ({
              date: dateLabel(k),
              [t('Deadlift')]: avg(athleticMap[k].deadlift),
            }));

          const shotSortedKeys = Object.keys(shootingMap).sort((a, b) => a.localeCompare(b));
          const shotVolumeData = shotSortedKeys
            .filter(k => shootingMap[k].taken > 0)
            .map(k => ({
              date: dateLabel(k),
              [t('Shots Taken')]: shootingMap[k].taken,
              [t('Shots Made')]: shootingMap[k].made,
              [t('3PT %')]: shootingMap[k].taken > 0 ? Math.round((shootingMap[k].made / shootingMap[k].taken) * 1000) / 10 : 0,
            }));

          const chartBox = `rounded-lg border p-4 print-inner ${isDark ? 'bg-gray-800/40 border-gray-700' : 'bg-gray-50/50 border-gray-200'}`;
          const chartTitle = `text-xs font-semibold mb-3 print-value ${isDark ? 'text-gray-300' : 'text-gray-700'}`;
          const tipStyle = { borderRadius: 8, fontSize: 11, backgroundColor: isDark ? '#1f2937' : '#fff', border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`, color: isDark ? '#f3f4f6' : '#111827' };
          const tickStyle = { fontSize: 9, fill: isDark ? '#9ca3af' : '#6b7280' };
          const gridStroke = isDark ? '#374151' : '#e5e7eb';

          return (
            <div className="grid grid-cols-2 gap-4 mt-4 print-charts-grid flex-1">
              <div className={`${chartBox} flex flex-col`}>
                <h4 className={chartTitle}>{t('Speed & Agility')}</h4>
                <div className="flex-1 min-h-[160px] print-chart-fill">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={speedData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                      <XAxis dataKey="date" tick={tickStyle} />
                      <YAxis tick={tickStyle} domain={['dataMin - 0.5', 'dataMax + 0.5']} />
                      <Tooltip contentStyle={tipStyle} />
                      <Legend wrapperStyle={{ fontSize: 10 }} />
                      <Line type="monotone" dataKey={t('Sprint')} stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} connectNulls />
                      <Line type="monotone" dataKey={t('Cone Drill')} stroke="#ec4899" strokeWidth={2} dot={{ r: 3 }} connectNulls />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className={`${chartBox} flex flex-col`}>
                <h4 className={chartTitle}>{t('Verticals')}</h4>
                <div className="flex-1 min-h-[160px] print-chart-fill">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={verticalsData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                      <XAxis dataKey="date" tick={tickStyle} />
                      <YAxis tick={tickStyle} domain={['dataMin - 2', 'dataMax + 2']} />
                      <Tooltip contentStyle={tipStyle} />
                      <Legend wrapperStyle={{ fontSize: 10 }} />
                      <Line type="monotone" dataKey={t('Pure Vertical')} stroke="#06b6d4" strokeWidth={2} dot={{ r: 3 }} connectNulls />
                      <Line type="monotone" dataKey={t('No-Step Vertical')} stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} connectNulls />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className={`${chartBox} flex flex-col`}>
                <h4 className={chartTitle}>{t('Shooting Volume')}</h4>
                <div className="flex-1 min-h-[160px] print-chart-fill">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={shotVolumeData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                      <XAxis dataKey="date" tick={tickStyle} />
                      <YAxis yAxisId="left" tick={tickStyle} />
                      <YAxis yAxisId="right" orientation="right" tick={tickStyle} domain={[0, 100]} />
                      <Tooltip contentStyle={tipStyle} />
                      <Legend wrapperStyle={{ fontSize: 10 }} />
                      <Bar yAxisId="left" dataKey={t('Shots Taken')} fill="#3b82f6" opacity={0.7} />
                      <Bar yAxisId="left" dataKey={t('Shots Made')} fill="#10b981" opacity={0.7} />
                      <Line yAxisId="right" type="monotone" dataKey={t('3PT %')} stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className={`${chartBox} flex flex-col`}>
                <h4 className={chartTitle}>{t('Deadlift')}</h4>
                <div className="flex-1 min-h-[160px] print-chart-fill">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={deadliftData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                      <XAxis dataKey="date" tick={tickStyle} />
                      <YAxis tick={tickStyle} domain={['dataMin - 5', 'dataMax + 5']} />
                      <Tooltip contentStyle={tipStyle} />
                      <Bar dataKey={t('Deadlift')} fill="#10b981" opacity={0.7} radius={[4, 4, 0, 0]} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          );
        })()}

      </div>

      <div className={`${cardClass} print-page`}>
        <div className="print-header hidden">
          <div className="print-header-logos">
            <img src="https://i.imgur.com/e7khORs.png" alt="PV" className="print-logo" />
            <div className="print-header-center">
              <div className="print-header-name">{selectedPlayer}{monthLabel ? ` — ${monthLabel}` : ''}</div>
              <div className="print-header-meta">{profile?.role || ''} · {category || ''} · {profile?.season || currentSeason || ''}</div>
            </div>
            <img src="https://i.imgur.com/r1fWDF1.png" alt="VB" className="print-logo" />
          </div>
        </div>
        <div className="flex items-center gap-2 mb-4 print-mb-sm">
          <Activity size={14} className="text-green-500" />
          <h3 className={`text-sm font-bold print-section-title ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('Load')}</h3>
        </div>

        {(() => {
          const totalPractice = ps.reduce((a, s) => a + (s.practiceLoad || 0), 0);
          const totalVitamins = ps.reduce((a, s) => a + (s.vitaminsLoad || 0), 0);
          const totalWeights = ps.reduce((a, s) => a + (s.weightsLoad || 0), 0);
          const totalGame = ps.reduce((a, s) => a + (s.gameLoad || 0), 0);
          const totalLoad = totalPractice + totalVitamins + totalWeights + totalGame;
          const loadSessions = ps.filter(s => (s.practiceLoad || 0) > 0 || (s.vitaminsLoad || 0) > 0 || (s.weightsLoad || 0) > 0 || (s.gameLoad || 0) > 0);
          const avgLoad = loadSessions.length > 0 ? Math.round(totalLoad / loadSessions.length) : 0;

          const loadWeeklyBuckets = getWeeklyBuckets(ps);
          const loadGroupMap: Record<string, { practice: number; vitamins: number; weights: number; game: number }> = {};

          if (loadWeeklyBuckets) {
            loadWeeklyBuckets.forEach(({ week, sessions: ws }) => {
              const key = `W${week}`;
              loadGroupMap[key] = { practice: 0, vitamins: 0, weights: 0, game: 0 };
              ws.forEach(s => {
                loadGroupMap[key].practice += s.practiceLoad || 0;
                loadGroupMap[key].vitamins += s.vitaminsLoad || 0;
                loadGroupMap[key].weights += s.weightsLoad || 0;
                loadGroupMap[key].game += s.gameLoad || 0;
              });
            });
          } else {
            ps.forEach(s => {
              if ((s.practiceLoad || 0) === 0 && (s.vitaminsLoad || 0) === 0 && (s.weightsLoad || 0) === 0 && (s.gameLoad || 0) === 0) return;
              const key = s.date.substring(0, 7);
              if (!loadGroupMap[key]) loadGroupMap[key] = { practice: 0, vitamins: 0, weights: 0, game: 0 };
              loadGroupMap[key].practice += s.practiceLoad || 0;
              loadGroupMap[key].vitamins += s.vitaminsLoad || 0;
              loadGroupMap[key].weights += s.weightsLoad || 0;
              loadGroupMap[key].game += s.gameLoad || 0;
            });
          }

          const loadSortedKeys = Object.keys(loadGroupMap).sort((a, b) => a.localeCompare(b));
          const loadDateLabel = (k: string) => loadWeeklyBuckets ? k : k.substring(2);
          const loadChartData = loadSortedKeys.map(k => ({
            date: loadDateLabel(k),
            [t('Practice')]: Math.round(loadGroupMap[k].practice),
            [t('Vitamins')]: Math.round(loadGroupMap[k].vitamins),
            [t('Weights')]: Math.round(loadGroupMap[k].weights),
            [t('Game')]: Math.round(loadGroupMap[k].game),
          }));

          const isActive = (s: typeof ps[0]) => (s.practiceLoad || 0) > 0 || (s.vitaminsLoad || 0) > 0 || (s.weightsLoad || 0) > 0 || (s.gameLoad || 0) > 0 || (s.injured !== null && s.injured > 0) || (s.nationalTeam !== null && s.nationalTeam > 0);
          const countActiveDaysAndInjury = (sessionList: typeof ps) => {
            const byDate: Record<string, typeof ps> = {};
            sessionList.forEach(s => {
              if (!byDate[s.date]) byDate[s.date] = [];
              byDate[s.date].push(s);
            });
            let activeDays = 0;
            let injuryDays = 0;
            Object.values(byDate).forEach(daySessions => {
              if (daySessions.some(isActive)) activeDays++;
              if (daySessions.some(s => s.injured !== null && s.injured > 0)) injuryDays++;
            });
            return { activeDays, injuryDays };
          };

          const seasonForMonth = (ym: string) => {
            const d = new Date(ym + '-15');
            return getSeason(d.toISOString().substring(0, 10));
          };
          const getSeasonBoundsForMonth = (y: number, m: number) => {
            const monthStart = new Date(y, m - 1, 1);
            const daysInMonth = new Date(y, m, 0).getDate();
            const monthEnd = new Date(y, m - 1, daysInMonth);
            const season = seasonForMonth(`${y}-${String(m).padStart(2, '0')}`);
            let firstDay = 1;
            let lastDay = daysInMonth;
            if (season) {
              const sStart = SEASON_START_DATES[season];
              const sEnd = SEASON_END_DATES[season];
              if (sStart && sStart > monthStart) firstDay = sStart.getDate();
              if (sEnd && sEnd < monthEnd) lastDay = sEnd.getDate();
            }
            const today = new Date();
            if (today.getFullYear() === y && (today.getMonth() + 1) === m && today.getDate() < lastDay) {
              lastDay = today.getDate();
            }
            return { firstDay, lastDay };
          };

          const availabilityMap: Record<string, { daysOff: number; injuryDays: number }> = {};
          if (loadWeeklyBuckets && selectedMonth) {
            const [y, m] = selectedMonth.split('-').map(Number);
            const { firstDay, lastDay } = getSeasonBoundsForMonth(y, m);
            loadWeeklyBuckets.forEach(({ week, sessions: ws }) => {
              const weekStartRaw = (week - 1) * 7 + 1;
              const weekEndRaw = week === 4 ? new Date(y, m, 0).getDate() : week * 7;
              const wStart = Math.max(weekStartRaw, firstDay);
              const wEnd = Math.min(weekEndRaw, lastDay);
              const calendarDays = Math.max(0, wEnd - wStart + 1);
              const { activeDays, injuryDays } = countActiveDaysAndInjury(ws);
              availabilityMap[`W${week}`] = { daysOff: Math.max(0, calendarDays - activeDays), injuryDays };
            });
          } else {
            const playerMonths = [...new Set(ps.map(s => s.date.substring(0, 7)))].sort();
            playerMonths.forEach(month => {
              const [y, m] = month.split('-').map(Number);
              const { firstDay, lastDay } = getSeasonBoundsForMonth(y, m);
              const calendarDays = Math.max(0, lastDay - firstDay + 1);
              const { activeDays, injuryDays } = countActiveDaysAndInjury(ps.filter(s => s.date.substring(0, 7) === month));
              availabilityMap[month] = { daysOff: Math.max(0, calendarDays - activeDays), injuryDays };
            });
          }
          const availSortedKeys = Object.keys(availabilityMap).sort((a, b) => a.localeCompare(b));
          const availChartData = availSortedKeys.map(k => ({
            date: loadWeeklyBuckets ? k : k.substring(2),
            [t('Days Off')]: availabilityMap[k].daysOff,
            [t('Injury Days')]: availabilityMap[k].injuryDays,
          }));

          const tipStyle = { borderRadius: 8, fontSize: 11, backgroundColor: isDark ? '#1f2937' : '#fff', border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`, color: isDark ? '#f3f4f6' : '#111827' };
          const tickStyle = { fontSize: 9, fill: isDark ? '#9ca3af' : '#6b7280' };
          const gridStroke = isDark ? '#374151' : '#e5e7eb';
          const chartBox = `rounded-lg border p-4 print-inner ${isDark ? 'bg-gray-800/40 border-gray-700' : 'bg-gray-50/50 border-gray-200'}`;
          const chartTitle = `text-xs font-semibold mb-3 print-value ${isDark ? 'text-gray-300' : 'text-gray-700'}`;

          return (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-5 print-load-cards print-mb-sm">
                <div className={`rounded-lg p-3 print-inner-sm text-center print-stat-card ${isDark ? 'bg-gray-800/60' : 'bg-emerald-50/50'}`}>
                  <div className={labelClass}>{t('Practice')}</div>
                  <div className={`text-xl font-bold print-value-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>{totalPractice.toLocaleString()}</div>
                </div>
                <div className={`rounded-lg p-3 print-inner-sm text-center print-stat-card ${isDark ? 'bg-gray-800/60' : 'bg-blue-50/50'}`}>
                  <div className={labelClass}>{t('Vitamins')}</div>
                  <div className={`text-xl font-bold print-value-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>{totalVitamins.toLocaleString()}</div>
                </div>
                <div className={`rounded-lg p-3 print-inner-sm text-center print-stat-card ${isDark ? 'bg-gray-800/60' : 'bg-purple-50/50'}`}>
                  <div className={labelClass}>{t('Weights')}</div>
                  <div className={`text-xl font-bold print-value-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>{totalWeights.toLocaleString()}</div>
                </div>
                <div className={`rounded-lg p-3 print-inner-sm text-center print-stat-card ${isDark ? 'bg-gray-800/60' : 'bg-orange-50/50'}`}>
                  <div className={labelClass}>{t('Game')}</div>
                  <div className={`text-xl font-bold print-value-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>{totalGame.toLocaleString()}</div>
                </div>
                <div className={`rounded-lg p-3 print-inner-sm text-center print-stat-card ${isDark ? 'bg-gray-800/60' : 'bg-gray-50'}`}>
                  <div className={labelClass}>{t('Total Load')}</div>
                  <div className={`text-xl font-bold print-value-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>{totalLoad.toLocaleString()}</div>
                </div>
                <div className={`rounded-lg p-3 print-inner-sm text-center print-stat-card ${isDark ? 'bg-gray-800/60' : 'bg-amber-50/50'}`}>
                  <div className={labelClass}>{t('Avg/Session')}</div>
                  <div className={`text-xl font-bold print-value-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>{avgLoad.toLocaleString()}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 print-charts-grid flex-1">
                <div className={`${chartBox} flex flex-col`}>
                  <h4 className={chartTitle}>{t('Load Distribution')}</h4>
                  <div className="flex-1 min-h-[160px] print-chart-fill">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={loadChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                        <XAxis dataKey="date" tick={tickStyle} />
                        <YAxis tick={tickStyle} />
                        <Tooltip contentStyle={tipStyle} />
                        <Legend wrapperStyle={{ fontSize: 10 }} />
                        <Bar dataKey={t('Practice')} stackId="load" fill="#10b981" />
                        <Bar dataKey={t('Vitamins')} stackId="load" fill="#3b82f6" />
                        <Bar dataKey={t('Weights')} stackId="load" fill="#8b5cf6" />
                        <Bar dataKey={t('Game')} stackId="load" fill="#f97316" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className={`${chartBox} flex flex-col`}>
                  <h4 className={chartTitle}>{t('Load Progression')}</h4>
                  <div className="flex-1 min-h-[160px] print-chart-fill">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={loadChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                        <XAxis dataKey="date" tick={tickStyle} />
                        <YAxis tick={tickStyle} />
                        <Tooltip contentStyle={tipStyle} />
                        <Legend wrapperStyle={{ fontSize: 10 }} />
                        <Line type="monotone" dataKey={t('Practice')} stroke="#10b981" strokeWidth={2} dot={{ r: 2 }} connectNulls />
                        <Line type="monotone" dataKey={t('Vitamins')} stroke="#3b82f6" strokeWidth={2} dot={{ r: 2 }} connectNulls />
                        <Line type="monotone" dataKey={t('Weights')} stroke="#8b5cf6" strokeWidth={2} dot={{ r: 2 }} connectNulls />
                        <Line type="monotone" dataKey={t('Game')} stroke="#f97316" strokeWidth={2} dot={{ r: 2 }} connectNulls />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className={`${chartBox} flex flex-col`}>
                  <h4 className={chartTitle}>{t('Days Off')}</h4>
                  <div className="flex-1 min-h-[160px] print-chart-fill">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={availChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                        <XAxis dataKey="date" tick={tickStyle} />
                        <YAxis tick={tickStyle} allowDecimals={false} />
                        <Tooltip contentStyle={tipStyle} />
                        <Bar dataKey={t('Days Off')} fill="#94a3b8" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className={`${chartBox} flex flex-col`}>
                  <h4 className={chartTitle}>{t('Injury Days')}</h4>
                  <div className="flex-1 min-h-[160px] print-chart-fill">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={availChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                        <XAxis dataKey="date" tick={tickStyle} />
                        <YAxis tick={tickStyle} allowDecimals={false} />
                        <Tooltip contentStyle={tipStyle} />
                        <Bar dataKey={t('Injury Days')} fill="#ef4444" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </>
          );
        })()}
      </div>
    </div>
  );
}

function GamePerformanceTab({ sessions, players, profiles }: { sessions: VBSession[]; players: string[]; profiles: PlayerProfile[] }) {
  const { t } = useLanguage();
  const isDark = useIsDark();
  return (
    <div className="space-y-6">
      <div className={`rounded-xl border p-8 text-center ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} shadow-sm`}>
        <Trophy size={40} className={`mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
        <h3 className={`text-lg font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('Game Performance')}</h3>
        <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{t('Coming Soon')}</p>
      </div>
    </div>
  );
}

function RatingDots({ value, max = 5, color = 'orange' }: { value: number | null; max?: number; color?: string }) {
  if (value == null) return <span className="text-gray-400 text-xs">—</span>;
  const colorMap: Record<string, string> = {
    orange: 'bg-orange-500',
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
  };
  const fillClass = colorMap[color] || 'bg-orange-500';
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }, (_, i) => (
        <div key={i} className={`w-2.5 h-2.5 rounded-full ${i < value ? fillClass : 'bg-gray-300 dark:bg-gray-600'}`} />
      ))}
    </div>
  );
}

function ProspectsTab({ prospects }: { prospects: VBProspect[] }) {
  const { t } = useLanguage();
  const isDark = useIsDark();
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'age' | 'height' | 'likeliness'>('likeliness');
  const [filterPosition, setFilterPosition] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const positions = useMemo(() => {
    const pos = new Set<string>();
    prospects.forEach(p => { if (p.position) pos.add(p.position); });
    return Array.from(pos).sort();
  }, [prospects]);

  const sorted = useMemo(() => {
    let filtered = [...prospects];
    if (filterPosition !== 'all') filtered = filtered.filter(p => p.position === filterPosition);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.nationality && p.nationality.toLowerCase().includes(q)) ||
        (p.teamSchool && p.teamSchool.toLowerCase().includes(q)) ||
        (p.handlerName && p.handlerName.toLowerCase().includes(q))
      );
    }
    filtered.sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'age') return (a.age ?? 99) - (b.age ?? 99);
      if (sortBy === 'height') return (b.height ?? 0) - (a.height ?? 0);
      if (sortBy === 'likeliness') return (b.likeliness ?? 0) - (a.likeliness ?? 0);
      return 0;
    });
    return filtered;
  }, [prospects, sortBy, filterPosition, searchQuery]);

  const avgRating = (p: VBProspect) => {
    const vals = [p.strength, p.speed, p.quickness, p.motor, p.stamina, p.dribbling, p.passing, p.finishing, p.shooting, p.defense, p.basketballIQ].filter(v => v != null) as number[];
    return vals.length > 0 ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : '—';
  };

  const card = `rounded-xl border ${isDark ? 'bg-[#111] border-gray-800' : 'bg-white border-gray-100'} shadow-sm`;
  const subtext = isDark ? 'text-gray-400' : 'text-gray-500';
  const label = `text-[10px] uppercase tracking-wide font-semibold ${isDark ? 'text-gray-500' : 'text-gray-400'}`;

  if (prospects.length === 0) {
    return (
      <div className="text-center py-20">
        <Star size={40} className={`mx-auto mb-3 ${isDark ? 'text-gray-700' : 'text-gray-300'}`} />
        <p className={`text-sm ${subtext}`}>{t('No prospects data available')}</p>
      </div>
    );
  }

  const getHeadshotUrl = (url: string | null) => {
    if (!url) return null;
    return url;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${subtext}`} />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={t('Search prospects...')}
            className={`w-full pl-9 pr-3 py-2 rounded-lg text-sm border ${isDark ? 'bg-[#1a1a1a] border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'}`}
          />
        </div>
        <select
          value={filterPosition}
          onChange={e => setFilterPosition(e.target.value)}
          className={`px-3 py-2 rounded-lg text-sm border ${isDark ? 'bg-[#1a1a1a] border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'}`}
        >
          <option value="all">{t('All Positions')}</option>
          {positions.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as any)}
          className={`px-3 py-2 rounded-lg text-sm border ${isDark ? 'bg-[#1a1a1a] border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'}`}
        >
          <option value="likeliness">{t('Sort by Likeliness')}</option>
          <option value="name">{t('Sort by Name')}</option>
          <option value="age">{t('Sort by Year of Birth')}</option>
          <option value="height">{t('Sort by Height')}</option>
        </select>
      </div>

      <div className={`text-xs ${subtext}`}>{sorted.length} {t('prospects')}</div>

      <div className="grid gap-4">
        {sorted.map((p, idx) => {
          const isExpanded = expandedId === idx;
          const thumb = getHeadshotUrl(p.headshot);
          const athleticRatings = [
            { label: t('Strength'), value: p.strength },
            { label: t('Speed'), value: p.speed },
            { label: t('Quickness'), value: p.quickness },
            { label: t('Motor'), value: p.motor },
            { label: t('Stamina'), value: p.stamina },
          ];
          const skillRatings = [
            { label: t('Dribbling'), value: p.dribbling },
            { label: t('Passing'), value: p.passing },
            { label: t('Finishing'), value: p.finishing },
            { label: t('Shooting'), value: p.shooting },
            { label: t('Defense'), value: p.defense },
            { label: t('Basketball IQ'), value: p.basketballIQ },
          ];
          const characterRatings = [
            { label: t('Work Ethic'), value: p.workEthic },
            { label: t('Coachable'), value: p.coachable },
            { label: t('Teammate'), value: p.teammate },
            { label: t('Life/Personality'), value: p.lifePersonality },
          ];

          return (
            <div key={idx} className={card}>
              <div
                className="p-4 cursor-pointer"
                onClick={() => setExpandedId(isExpanded ? null : idx)}
              >
                <div className="flex items-start gap-4">
                  {thumb ? (
                    <img src={thumb} alt={p.name} className="w-14 h-14 rounded-full object-cover border-2 border-orange-500/30 flex-shrink-0" />
                  ) : (
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0 ${isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
                      {p.name.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{p.name}</h3>
                      {p.likeliness != null && (
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: 5 }, (_, i) => (
                            <Star key={i} size={11} className={i < p.likeliness! ? 'text-orange-500 fill-orange-500' : `${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
                          ))}
                        </div>
                      )}
                    </div>
                    <div className={`flex items-center gap-3 text-xs mt-1 ${subtext}`}>
                      {p.position && <span className="px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-600 dark:text-orange-400 font-medium">{p.position}</span>}
                      {p.dob && <span>{p.dob.substring(0, 4)}</span>}
                      {p.height != null && <span>{p.height} cm</span>}
                      {p.nationality && <span className="flex items-center gap-1"><Globe size={10} />{p.nationality}</span>}
                    </div>
                    <div className={`flex items-center gap-4 text-xs mt-1.5 ${subtext}`}>
                      {p.teamSchool && <span className="flex items-center gap-1"><MapPin size={10} />{p.teamSchool}</span>}
                      {p.handlerName && <span>{t('Handler')}: {p.handlerName}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="text-center">
                      <div className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{avgRating(p)}</div>
                      <div className={`text-[9px] ${subtext}`}>{t('AVG')}</div>
                    </div>
                    {isExpanded ? <ChevronUp size={16} className={subtext} /> : <ChevronDown size={16} className={subtext} />}
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div className={`border-t px-4 py-4 space-y-5 ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    {p.dob && <div><span className={label}>{t('DOB')}</span><div className={`mt-0.5 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{p.dob.split('-').reverse().join('/')}</div></div>}
                    {p.weight != null && <div><span className={label}>{t('Weight')}</span><div className={`mt-0.5 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{p.weight} lbs</div></div>}
                    {p.wingspan != null && <div><span className={label}>{t('Wingspan')}</span><div className={`mt-0.5 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{p.wingspan} cm</div></div>}
                    {p.secondNationality && <div><span className={label}>{t('2nd Nationality')}</span><div className={`mt-0.5 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{p.secondNationality}</div></div>}
                    {p.language && <div><span className={label}>{t('Language')}</span><div className={`mt-0.5 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{p.language}</div></div>}
                    {p.secondaryPosition && <div><span className={label}>{t('2nd Position')}</span><div className={`mt-0.5 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{p.secondaryPosition}</div></div>}
                  </div>

                  <div>
                    <h4 className={`text-xs font-bold mb-2 ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>{t('Athleticism')}</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {athleticRatings.map(r => (
                        <div key={r.label} className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg ${isDark ? 'bg-[#1a1a1a]' : 'bg-gray-50'}`}>
                          <span className={`text-xs ${subtext}`}>{r.label}</span>
                          <RatingDots value={r.value} color="orange" />
                        </div>
                      ))}
                    </div>
                    {p.athleticismNotes && (
                      <p className={`text-xs mt-2 leading-relaxed ${subtext}`}>{p.athleticismNotes}</p>
                    )}
                  </div>

                  <div>
                    <h4 className={`text-xs font-bold mb-2 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>{t('Skills')}</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {skillRatings.map(r => (
                        <div key={r.label} className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg ${isDark ? 'bg-[#1a1a1a]' : 'bg-gray-50'}`}>
                          <span className={`text-xs ${subtext}`}>{r.label}</span>
                          <RatingDots value={r.value} color="blue" />
                        </div>
                      ))}
                    </div>
                    {p.skillsNotes && (
                      <p className={`text-xs mt-2 leading-relaxed ${subtext}`}>{p.skillsNotes}</p>
                    )}
                  </div>

                  <div>
                    <h4 className={`text-xs font-bold mb-2 ${isDark ? 'text-green-400' : 'text-green-600'}`}>{t('Character')}</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {characterRatings.map(r => (
                        <div key={r.label} className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg ${isDark ? 'bg-[#1a1a1a]' : 'bg-gray-50'}`}>
                          <span className={`text-xs ${subtext}`}>{r.label}</span>
                          <RatingDots value={r.value} color="green" />
                        </div>
                      ))}
                    </div>
                  </div>

                  {p.generalNotes && (
                    <div>
                      <h4 className={`text-xs font-bold mb-1 ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>{t('General Notes')}</h4>
                      <p className={`text-xs leading-relaxed ${subtext}`}>{p.generalNotes}</p>
                    </div>
                  )}

                  <div className="flex gap-2 pt-1">
                    {p.video && (
                      <a href={p.video} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 hover:bg-orange-500/20 transition-colors">
                        <Video size={12} /> {t('Video')}
                        <ExternalLink size={10} />
                      </a>
                    )}
                    {p.passport && (
                      <a href={p.passport} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 transition-colors">
                        <Flag size={12} /> {t('Passport')}
                        <ExternalLink size={10} />
                      </a>
                    )}
                  </div>

                  {p.timestamp && (
                    <div className={`text-[10px] ${subtext} text-right`}>{t('Scouted')}: {p.timestamp.split('-').reverse().join('/')}</div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className={`${card} p-4`}>
        <h3 className={`text-xs font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('Prospect Ratings Overview')}</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className={`border-b ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
                <th className={`text-left py-2 pr-3 font-semibold ${subtext}`}>{t('Name')}</th>
                <th className={`text-center py-2 px-1 font-semibold ${subtext}`}>{t('Pos')}</th>
                <th className={`text-center py-2 px-1 font-semibold ${subtext}`}>{t('YoB')}</th>
                <th className={`text-center py-2 px-1 font-semibold ${subtext}`}>{t('Ht')}</th>
                <th className={`text-center py-2 px-1 font-semibold text-orange-500`}>STR</th>
                <th className={`text-center py-2 px-1 font-semibold text-orange-500`}>SPD</th>
                <th className={`text-center py-2 px-1 font-semibold text-blue-500`}>DRB</th>
                <th className={`text-center py-2 px-1 font-semibold text-blue-500`}>PAS</th>
                <th className={`text-center py-2 px-1 font-semibold text-blue-500`}>FIN</th>
                <th className={`text-center py-2 px-1 font-semibold text-blue-500`}>SHT</th>
                <th className={`text-center py-2 px-1 font-semibold text-blue-500`}>DEF</th>
                <th className={`text-center py-2 px-1 font-semibold text-blue-500`}>IQ</th>
                <th className={`text-center py-2 px-1 font-semibold text-green-500`}>WE</th>
                <th className={`text-center py-2 px-1 font-semibold text-purple-500`}><Star size={10} className="inline" /></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((p, idx) => {
                const ratingCell = (val: number | null, color: string) => {
                  if (val == null) return <td className="text-center py-1.5 px-1 text-gray-400">—</td>;
                  const bg = val >= 4 ? (color === 'orange' ? 'bg-orange-500/20 text-orange-600 dark:text-orange-400' : color === 'blue' ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400' : color === 'green' ? 'bg-green-500/20 text-green-600 dark:text-green-400' : 'bg-purple-500/20 text-purple-600 dark:text-purple-400') : val <= 2 ? 'bg-red-500/10 text-red-500' : '';
                  return <td className={`text-center py-1.5 px-1 ${bg} rounded`}>{val}</td>;
                };
                return (
                  <tr key={idx} className={`border-b ${isDark ? 'border-gray-800/50' : 'border-gray-50'} hover:${isDark ? 'bg-gray-800/30' : 'bg-gray-50'}`}>
                    <td className={`py-1.5 pr-3 font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{p.name}</td>
                    <td className="text-center py-1.5 px-1">{p.position || '—'}</td>
                    <td className="text-center py-1.5 px-1">{p.dob ? p.dob.substring(0, 4) : '—'}</td>
                    <td className="text-center py-1.5 px-1">{p.height ?? '—'}</td>
                    {ratingCell(p.strength, 'orange')}
                    {ratingCell(p.speed, 'orange')}
                    {ratingCell(p.dribbling, 'blue')}
                    {ratingCell(p.passing, 'blue')}
                    {ratingCell(p.finishing, 'blue')}
                    {ratingCell(p.shooting, 'blue')}
                    {ratingCell(p.defense, 'blue')}
                    {ratingCell(p.basketballIQ, 'blue')}
                    {ratingCell(p.workEthic, 'green')}
                    {ratingCell(p.likeliness, 'purple')}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SearchTab({ sessions, players, profiles }: { sessions: VBSession[]; players: string[]; profiles: PlayerProfile[] }) {
  const { t } = useLanguage();
  const isDark = useIsDark();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<VBSession[]>([]);
  const [searched, setSearched] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const allRoles = useMemo(() =>
    [...new Set(players.map(p => getPlayerPosition(p, profiles)).filter(r => r))],
  [players, profiles]);

  const allCategories = useMemo(() =>
    [...new Set(players.map(p => getPlayerCategory(p, profiles)).filter(c => c))],
  [players, profiles]);

  const allSeasons = useMemo(() => [...new Set(sessions.map(s => getSeason(s.date)).filter(Boolean))].sort().reverse() as string[], [sessions]);
  const allMonths = useMemo(() => [...new Set(sessions.map(s => s.date.substring(0, 7)))].sort(), [sessions]);
  const allDates = useMemo(() => [...new Set(sessions.map(s => s.date))].sort(), [sessions]);

  const monthNamesEN = ['january','february','march','april','may','june','july','august','september','october','november','december'];
  const monthNamesIT = ['gennaio','febbraio','marzo','aprile','maggio','giugno','luglio','agosto','settembre','ottobre','novembre','dicembre'];
  const monthShortEN = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
  const monthShortIT = ['gen','feb','mar','apr','mag','giu','lug','ago','set','ott','nov','dic'];
  const monthDisplay = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  const parseMonthName = (str: string): number | null => {
    const s = str.toLowerCase();
    for (let i = 0; i < 12; i++) {
      if (monthNamesEN[i].startsWith(s) || monthNamesIT[i].startsWith(s) || monthShortEN[i] === s || monthShortIT[i] === s) return i;
    }
    return null;
  };

  const expandYear = (y: string): string => {
    if (y.length === 4) return y;
    const n = parseInt(y);
    return n >= 0 && n <= 50 ? `20${y.padStart(2, '0')}` : `19${y.padStart(2, '0')}`;
  };

  const categoryKeywords: Record<string, string> = { u15: 'U15', u17: 'U17', u19: 'U19', dy: 'DY' };
  const roleAliases: Record<string, string> = { '3nd': '3nD', '3&d': '3nD', '3d': '3nD', playmaker: 'Playmaker', pm: 'Playmaker', center: 'Center' };

  const isRoleToken = (lower: string): string | null => {
    if (roleAliases[lower]) return roleAliases[lower];
    const match = allRoles.find(r => r.toLowerCase() === lower);
    if (match) return match;
    return null;
  };

  const isCategoryToken = (lower: string): string | null => {
    return categoryKeywords[lower] || null;
  };

  const parseCompoundQuery = (raw: string): { nameTokens: string[]; year: number | null; month: number | null; day: number | null; role: string | null; category: string | null } => {
    const result = { nameTokens: [] as string[], year: null as number | null, month: null as number | null, day: null as number | null, role: null as string | null, category: null as string | null };
    const q = raw.trim();
    if (!q) return result;

    let remaining = q;

    const dp3a = remaining.match(/(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/);
    if (dp3a) {
      const [full, a, b, c] = dp3a;
      result.day = parseInt(a);
      result.month = parseInt(b);
      result.year = parseInt(expandYear(c));
      remaining = remaining.replace(full, ' ');
    } else {
      const dp3b = remaining.match(/(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})/);
      if (dp3b) {
        const [full, yr, mo, dy] = dp3b;
        result.year = parseInt(yr);
        result.month = parseInt(mo);
        result.day = parseInt(dy);
        remaining = remaining.replace(full, ' ');
      } else {
        const dp2a = remaining.match(/(\d{1,2})[\/\-.](\d{4})/);
        if (dp2a) {
          const [full, mo, yr] = dp2a;
          result.month = parseInt(mo);
          result.year = parseInt(yr);
          remaining = remaining.replace(full, ' ');
        } else {
          const dp2b = remaining.match(/(\d{4})[\/\-.](\d{1,2})/);
          if (dp2b) {
            const [full, yr, mo] = dp2b;
            result.year = parseInt(yr);
            result.month = parseInt(mo);
            remaining = remaining.replace(full, ' ');
          }
        }
      }
    }

    const tokens = remaining.split(/[\s,;]+/).filter(t => t.length > 0);
    const pending: { token: string; lower: string }[] = [];

    for (const token of tokens) {
      const lower = token.toLowerCase();

      const cat = isCategoryToken(lower);
      if (cat) { result.category = cat; continue; }

      const role = isRoleToken(lower);
      if (role) { result.role = role; continue; }

      const mi = parseMonthName(token);
      if (mi !== null) { result.month = mi + 1; continue; }

      if (/^\d{4}$/.test(token)) { result.year = parseInt(token); continue; }

      pending.push({ token, lower });
    }

    for (const { token, lower } of pending) {
      if (/^\d{1,2}$/.test(token)) {
        const n = parseInt(token);
        if (result.day === null && n >= 1 && n <= 31) { result.day = n; continue; }
        if (result.month === null && n >= 1 && n <= 12) { result.month = n; continue; }
      }
      if (/^\d{2}$/.test(token) && result.year === null) { result.year = parseInt(expandYear(token)); continue; }
      if (/^[a-zA-Zéàòùì0-9&]+$/.test(token)) { result.nameTokens.push(lower); }
    }

    return result;
  };

  const getPlayerSeasons = useMemo(() => {
    const map: Record<string, Set<string>> = {};
    sessions.forEach(s => {
      const season = getSeason(s.date);
      if (season) {
        if (!map[s.player]) map[s.player] = new Set();
        map[s.player].add(season);
      }
    });
    return map;
  }, [sessions]);

  const findSeasonsForPeriod = (year: number | null, month: number | null, day: number | null): Set<string> => {
    const result = new Set<string>();
    if (year === null) return result;
    if (month !== null && day !== null) {
      const s = getSeason(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
      if (s) result.add(s);
    } else if (month !== null) {
      const daysInMonth = new Date(year, month, 0).getDate();
      for (let d = 1; d <= daysInMonth; d += 5) {
        const s = getSeason(`${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
        if (s) result.add(s);
      }
      const s = getSeason(`${year}-${String(month).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`);
      if (s) result.add(s);
    } else {
      for (let m = 1; m <= 12; m++) {
        const s = getSeason(`${year}-${String(m).padStart(2, '0')}-15`);
        if (s) result.add(s);
      }
    }
    return result;
  };

  const getMatchingPlayers = (parsed: ReturnType<typeof parseCompoundQuery>): string[] => {
    const searchSeasons = findSeasonsForPeriod(parsed.year, parsed.month, parsed.day);

    return players.filter(p => {
      if (parsed.role && getPlayerPosition(p, profiles).toLowerCase() !== parsed.role.toLowerCase()) return false;
      if (parsed.category && getPlayerCategory(p, profiles) !== parsed.category) return false;
      if (parsed.nameTokens.length > 0 && !parsed.nameTokens.every(nt => p.toLowerCase().includes(nt))) return false;
      if (searchSeasons.size > 0) {
        const playerS = getPlayerSeasons[p];
        if (!playerS || ![...searchSeasons].some(s => playerS.has(s))) return false;
      }
      return true;
    });
  };

  const matchesSession = (s: VBSession, parsed: ReturnType<typeof parseCompoundQuery>): boolean => {
    if (parsed.nameTokens.length > 0) {
      const playerLower = s.player.toLowerCase();
      if (!parsed.nameTokens.every(nt => playerLower.includes(nt))) return false;
    }
    if (parsed.role && getPlayerPosition(s.player, profiles).toLowerCase() !== parsed.role.toLowerCase()) return false;
    if (parsed.category && getPlayerCategory(s.player, profiles) !== parsed.category) return false;
    const [sy, sm, sd] = s.date.split('-').map(Number);
    if (parsed.year !== null && sy !== parsed.year) return false;
    if (parsed.month !== null && sm !== parsed.month) return false;
    if (parsed.day !== null && sd !== parsed.day) return false;
    return true;
  };

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const items: { type: string; label: string; value: string; sortKey: number }[] = [];

    const catKeys = Object.keys(categoryKeywords);
    catKeys.filter(k => k.includes(q) || categoryKeywords[k].toLowerCase().includes(q)).forEach(k => {
      items.push({ type: 'category', label: categoryKeywords[k], value: categoryKeywords[k], sortKey: -2 });
    });

    const matchedRole = isRoleToken(q);
    if (matchedRole) {
      items.push({ type: 'role', label: matchedRole, value: matchedRole, sortKey: -1 });
    } else {
      allRoles.filter(r => r.toLowerCase().includes(q)).forEach(r => {
        if (!items.some(i => i.label === r)) items.push({ type: 'role', label: r, value: r, sortKey: -1 });
      });
    }

    players.filter(p => p.toLowerCase().includes(q)).slice(0, 5).forEach(p => {
      items.push({ type: 'player', label: p, value: p, sortKey: 0 });
    });

    allSeasons.filter(s => s.includes(q)).slice(0, 3).forEach(s => {
      items.push({ type: 'season', label: `${t('Season')} ${s}`, value: `season:${s}`, sortKey: 1 });
    });

    const parsed = parseCompoundQuery(query);
    const hasDate = parsed.year !== null || parsed.month !== null || parsed.day !== null;

    if (hasDate) {
      if (parsed.year !== null && parsed.month !== null && parsed.day !== null) {
        const iso = `${parsed.year}-${String(parsed.month).padStart(2, '0')}-${String(parsed.day).padStart(2, '0')}`;
        if (allDates.includes(iso)) {
          items.push({ type: 'date', label: `${String(parsed.day).padStart(2, '0')}/${String(parsed.month).padStart(2, '0')}/${parsed.year}`, value: `date:${iso}`, sortKey: 3 });
        }
      } else if (parsed.year !== null && parsed.month !== null) {
        const iso = `${parsed.year}-${String(parsed.month).padStart(2, '0')}`;
        if (allMonths.includes(iso)) {
          const mi = parsed.month - 1;
          items.push({ type: 'month', label: `${monthDisplay[mi]} ${parsed.year}`, value: `month:${iso}`, sortKey: 2 });
        }
      } else if (parsed.month !== null) {
        allMonths.filter(m => parseInt(m.split('-')[1]) === parsed.month).slice(0, 4).forEach(m => {
          const mi = parseInt(m.split('-')[1]) - 1;
          items.push({ type: 'month', label: `${monthDisplay[mi]} ${m.split('-')[0]}`, value: `month:${m}`, sortKey: 2 });
        });
      } else if (parsed.year !== null) {
        allMonths.filter(m => m.startsWith(`${parsed.year}-`)).slice(0, 6).forEach(m => {
          const mi = parseInt(m.split('-')[1]) - 1;
          items.push({ type: 'month', label: `${monthDisplay[mi]} ${parsed.year}`, value: `month:${m}`, sortKey: 2 });
        });
      }
    }

    if (!hasDate) {
      allMonths.filter(m => m.includes(q)).slice(0, 5).forEach(m => {
        if (items.some(i => i.value === `month:${m}`)) return;
        const mi = parseInt(m.split('-')[1]) - 1;
        items.push({ type: 'month', label: `${monthDisplay[mi]} ${m.split('-')[0]}`, value: `month:${m}`, sortKey: 2 });
      });

      allDates.filter(d => d.includes(q)).slice(0, 5).forEach(d => {
        if (items.some(i => i.value === `date:${d}`)) return;
        const [dy, dm, dd] = d.split('-');
        items.push({ type: 'date', label: `${dd}/${dm}/${dy}`, value: `date:${d}`, sortKey: 3 });
      });
    }

    if (parsed.nameTokens.length > 0 && hasDate) {
      const matchedPlayers = players.filter(p => parsed.nameTokens.every(nt => p.toLowerCase().includes(nt)));
      const dateLabel = parsed.day !== null
        ? `${parsed.day}/${parsed.month}/${parsed.year}`
        : parsed.month !== null
        ? `${monthDisplay[(parsed.month || 1) - 1]}${parsed.year ? ' ' + parsed.year : ''}`
        : `${parsed.year}`;
      matchedPlayers.slice(0, 3).forEach(p => {
        items.unshift({ type: 'player', label: `${p} · ${dateLabel}`, value: `compound:${q}`, sortKey: -1 });
      });
    }

    const hasDigit = /\d/.test(q);
    if (hasDigit || hasDate) {
      items.sort((a, b) => a.sortKey - b.sortKey);
    }

    return items.slice(0, 10);
  }, [query, players, allSeasons, allMonths, allDates, profiles, t]);

  const makeDayOff = (player: string, date: string): VBSession => ({
    player, date, practiceLoad: null, vitaminsLoad: null, weightsLoad: null, gameLoad: null,
    height: null, weight: null, wingspan: null, standingReach: null, bodyFat: null,
    pureVertical: null, noStepVertical: null, sprint: null, coneDrill: null, deadlift: null,
    shootsTaken: null, shootsMade: null, shootingPct: null, injured: null, nationalTeam: null, formShooting: null,
  });

  const isSessionActive = (s: VBSession): boolean => {
    return (s.vitaminsLoad || 0) > 0 || (s.weightsLoad || 0) > 0 || (s.practiceLoad || 0) > 0 || (s.gameLoad || 0) > 0
      || (s.injured !== null && s.injured > 0) || (s.nationalTeam !== null && s.nationalTeam > 0)
      || s.height !== null || s.weight !== null || s.sprint !== null || s.coneDrill !== null
      || s.pureVertical !== null || s.noStepVertical !== null || s.deadlift !== null
      || s.shootsTaken !== null;
  };

  const generateDateRange = (parsed: ReturnType<typeof parseCompoundQuery>): string[] => {
    if (parsed.year !== null && parsed.month !== null && parsed.day !== null) {
      return [`${parsed.year}-${String(parsed.month).padStart(2, '0')}-${String(parsed.day).padStart(2, '0')}`];
    }
    if (parsed.year !== null && parsed.month !== null) {
      const daysInMonth = new Date(parsed.year, parsed.month, 0).getDate();
      const today = new Date();
      const dates: string[] = [];
      for (let d = 1; d <= daysInMonth; d++) {
        const dt = new Date(parsed.year, parsed.month - 1, d);
        if (dt <= today) {
          dates.push(`${parsed.year}-${String(parsed.month).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
        }
      }
      return dates;
    }
    return [];
  };

  const executeSearch = (searchValue: string) => {
    setShowSuggestions(false);
    let filtered: VBSession[] = [];
    const searchText = searchValue.startsWith('compound:') ? searchValue.replace('compound:', '')
      : searchValue.startsWith('season:') || searchValue.startsWith('month:') || searchValue.startsWith('date:') ? '' : searchValue;
    const parsed = parseCompoundQuery(searchText || searchValue);
    const hasDate = parsed.year !== null || parsed.month !== null || parsed.day !== null;
    const hasName = parsed.nameTokens.length > 0;
    const hasRoleOrCat = parsed.role !== null || parsed.category !== null;
    const targetPlayers = getMatchingPlayers(parsed);

    if (searchValue.startsWith('season:')) {
      const season = searchValue.replace('season:', '');
      filtered = sessions.filter(s => getSeason(s.date) === season);
    } else if (searchValue.startsWith('month:')) {
      const month = searchValue.replace('month:', '');
      filtered = sessions.filter(s => s.date.startsWith(month));
    } else if (searchValue.startsWith('date:')) {
      const date = searchValue.replace('date:', '');
      filtered = sessions.filter(s => s.date === date);
    } else if (hasDate || hasName || hasRoleOrCat) {
      filtered = sessions.filter(s => matchesSession(s, parsed));
    } else {
      const q = searchValue.toLowerCase();
      filtered = sessions.filter(s => s.player.toLowerCase().includes(q) || s.date.includes(q));
    }

    if (hasRoleOrCat) {
      filtered = filtered.filter(s => targetPlayers.includes(s.player));
    }

    const dates = hasDate ? generateDateRange(parsed) : [];

    if (dates.length > 0 && (hasName || hasRoleOrCat)) {
      for (const p of targetPlayers) {
        const existingDates = new Set(filtered.filter(s => s.player === p).map(s => s.date));
        for (const date of dates) {
          if (!existingDates.has(date)) {
            filtered.push(makeDayOff(p, date));
          }
        }
      }
    } else if (searchValue.startsWith('date:') && hasRoleOrCat) {
      const date = searchValue.replace('date:', '');
      for (const p of targetPlayers) {
        if (!filtered.some(s => s.player === p && s.date === date)) {
          filtered.push(makeDayOff(p, date));
        }
      }
    }

    setResults(filtered.sort((a, b) => a.date.localeCompare(b.date)));
    setSearched(true);
  };

  const handleSuggestionClick = (item: { type: string; label: string; value: string }) => {
    if (item.type === 'player') {
      setQuery(item.label);
      executeSearch(item.value);
    } else {
      setQuery(item.label);
      executeSearch(item.value);
    }
  };

  const handleInputChange = (val: string) => {
    setQuery(val);
    setShowSuggestions(true);
    if (val.trim().length >= 2) {
      const q = val.trim().toLowerCase();
      const playerMatch = players.filter(p => p.toLowerCase().includes(q));
      if (playerMatch.length === 1) {
        // don't auto-search, let suggestions show
      }
    }
  };

  const groupedByPlayer = useMemo(() => {
    const map: Record<string, VBSession[]> = {};
    results.forEach(s => {
      if (!map[s.player]) map[s.player] = [];
      map[s.player].push(s);
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [results]);

  const cardClass = `rounded-xl border p-5 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} shadow-sm`;

  return (
    <div className="space-y-6">
      <div className={cardClass}>
        <div className="flex items-center gap-2 mb-4">
          <Search size={14} className="text-orange-500" />
          <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('Search')}</h3>
        </div>
        <div className="relative">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => handleInputChange(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
              onKeyDown={e => {
                if (e.key === 'Enter') { executeSearch(query); }
                if (e.key === 'Escape') { setShowSuggestions(false); }
              }}
              placeholder={t('Search player, date, month, season...')}
              className={`flex-1 px-4 py-2.5 rounded-lg text-sm border outline-none transition-all ${isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-orange-500' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-orange-500'}`}
            />
            <button onClick={() => executeSearch(query)} className="px-4 py-2.5 rounded-lg bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 transition-colors">
              {t('Search')}
            </button>
          </div>

          {showSuggestions && suggestions.length > 0 && query.trim().length >= 1 && (
            <div className={`absolute left-0 right-12 top-full mt-1 rounded-lg border shadow-lg z-50 overflow-hidden ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              {suggestions.map((item, i) => (
                <button
                  key={`${item.value}-${i}`}
                  onMouseDown={e => { e.preventDefault(); handleSuggestionClick(item); }}
                  className={`w-full text-left px-4 py-2.5 flex items-center gap-3 text-sm transition-colors ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}
                >
                  <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${
                    item.type === 'category' ? 'bg-cyan-500/10 text-cyan-500' :
                    item.type === 'role' ? 'bg-pink-500/10 text-pink-500' :
                    item.type === 'player' ? 'bg-orange-500/10 text-orange-500' :
                    item.type === 'season' ? 'bg-blue-500/10 text-blue-500' :
                    item.type === 'month' ? 'bg-purple-500/10 text-purple-500' :
                    'bg-emerald-500/10 text-emerald-500'
                  }`}>
                    {item.type === 'category' ? '🏷️' : item.type === 'role' ? '🏀' : item.type === 'player' ? '👤' : item.type === 'season' ? '📅' : item.type === 'month' ? '📆' : '📌'}
                  </span>
                  <span className={isDark ? 'text-gray-200' : 'text-gray-700'}>{item.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {searched && results.length === 0 && (
        <div className={`${cardClass} text-center py-8`}>
          <Search size={32} className={`mx-auto mb-3 ${isDark ? 'text-gray-700' : 'text-gray-300'}`} />
          <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{t('No results found')}</p>
        </div>
      )}

      {searched && results.length > 0 && (
        <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
          {results.length} {t('sessions')} · {groupedByPlayer.length} {t('players')}
        </div>
      )}

      {groupedByPlayer.map(([player, playerSessions]) => {
        const profile = profiles.find(p => p.name === player);
        return (
          <div key={player} className={cardClass}>
            <div className="flex items-center gap-3 mb-4">
              {profile?.mugShot ? (
                <img src={profile.mugShot} alt={player} className="w-10 h-10 rounded-lg object-cover border border-orange-500/30" />
              ) : (
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold ${isDark ? 'bg-gray-800 text-gray-600' : 'bg-gray-100 text-gray-300'}`}>
                  {player.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                </div>
              )}
              <div>
                <div className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{player}</div>
                <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{profile?.role || '—'} · {playerSessions.length} {t('sessions')}</div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className={`w-full text-xs ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                <thead>
                  <tr className={`border-b ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
                    <th className="text-left py-2 px-2 font-medium">{t('Date')}</th>
                    <th className="text-right py-2 px-2 font-medium">{t('Height')}</th>
                    <th className="text-right py-2 px-2 font-medium">{t('Weight')}</th>
                    <th className="text-right py-2 px-2 font-medium">{t('Sprint')}</th>
                    <th className="text-right py-2 px-2 font-medium">{t('Cone Drill')}</th>
                    <th className="text-right py-2 px-2 font-medium">{t('Pure Vertical')}</th>
                    <th className="text-right py-2 px-2 font-medium">{t('No-Step Vertical')}</th>
                    <th className="text-right py-2 px-2 font-medium">{t('Deadlift')}</th>
                    <th className="text-right py-2 px-2 font-medium">{t('Practice')}</th>
                    <th className="text-right py-2 px-2 font-medium">{t('Vitamins')}</th>
                    <th className="text-right py-2 px-2 font-medium">{t('Weights')}</th>
                    <th className="text-right py-2 px-2 font-medium">{t('Game')}</th>
                    <th className="text-right py-2 px-2 font-medium">{t('3PT %')}</th>
                    <th className="text-right py-2 px-2 font-medium">{t('Injured')}</th>
                    <th className="text-right py-2 px-2 font-medium">{t('NT')}</th>
                    <th className="text-center py-2 px-2 font-medium">{t('Status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {playerSessions.map((s, i) => {
                    const active = isSessionActive(s);
                    const isNT = s.nationalTeam !== null && s.nationalTeam > 0;
                    const isVacation = getSeason(s.date) === null;
                    const isDayOff = !active && !isVacation;
                    return (
                    <tr key={i} className={`border-b ${isVacation ? (isDark ? 'bg-amber-900/10 border-gray-800/50' : 'bg-amber-50/50 border-amber-100') : isDayOff ? (isDark ? 'bg-gray-800/20 border-gray-800/50' : 'bg-gray-50/50 border-gray-100') : isDark ? 'border-gray-800/50 hover:bg-gray-800/30' : 'border-gray-50 hover:bg-gray-50'}`}>
                      <td className="py-1.5 px-2 font-medium">{s.date.split('-').reverse().join('-')}</td>
                      <td className="py-1.5 px-2 text-right">{s.height ?? '—'}</td>
                      <td className="py-1.5 px-2 text-right">{s.weight ?? '—'}</td>
                      <td className="py-1.5 px-2 text-right">{s.sprint ?? '—'}</td>
                      <td className="py-1.5 px-2 text-right">{s.coneDrill ?? '—'}</td>
                      <td className="py-1.5 px-2 text-right">{s.pureVertical !== null && s.standingReach !== null ? (s.pureVertical as number) - (s.standingReach as number) : '—'}</td>
                      <td className="py-1.5 px-2 text-right">{s.noStepVertical !== null && s.standingReach !== null ? (s.noStepVertical as number) - (s.standingReach as number) : '—'}</td>
                      <td className="py-1.5 px-2 text-right">{s.deadlift ?? '—'}</td>
                      <td className="py-1.5 px-2 text-right">{s.practiceLoad ?? '—'}</td>
                      <td className="py-1.5 px-2 text-right">{s.vitaminsLoad ?? '—'}</td>
                      <td className="py-1.5 px-2 text-right">{s.weightsLoad ?? '—'}</td>
                      <td className="py-1.5 px-2 text-right">{s.gameLoad ?? '—'}</td>
                      <td className="py-1.5 px-2 text-right">
                        {s.shootingPct !== null ? (
                          <span className={`font-semibold ${(s.shootingPct || 0) >= 40 ? 'text-emerald-500' : (s.shootingPct || 0) >= 30 ? 'text-amber-500' : 'text-red-500'}`}>
                            {s.shootsMade}/{s.shootsTaken} ({s.shootingPct}%)
                          </span>
                        ) : '—'}
                      </td>
                      <td className="py-1.5 px-2 text-right">{s.injured && s.injured > 0 ? <span className="text-red-500 font-medium">Lv {s.injured}</span> : '—'}</td>
                      <td className="py-1.5 px-2 text-right">{isNT ? <span className="text-blue-500 font-semibold">NT</span> : '—'}</td>
                      <td className="py-1.5 px-2 text-center">
                        {isVacation ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">{t('Vacation')}</span>
                        ) : isDayOff ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400">{t('Day Off')}</span>
                        ) : isNT ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">{t('NT')}</span>
                        ) : s.injured && s.injured > 0 ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">{t('Injured')}</span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">{t('Active')}</span>
                        )}
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CompareTab({ sessions, players, profiles }: { sessions: VBSession[]; players: string[]; profiles: PlayerProfile[] }) {
  const { t } = useLanguage();
  const isDark = useIsDark();

  const validSessions = useMemo(() => sessions.filter(s => getSeason(s.date)), [sessions]);
  const seasons = useMemo(() => [...new Set(validSessions.map(s => getSeason(s.date)!))].sort().reverse(), [validSessions]);
  const [selectedSeason, setSelectedSeason] = useState(() => getCurrentSeason());
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedRole, setSelectedRole] = useState<string>('all');

  const seasonFiltered = useMemo(() => {
    if (selectedSeason === 'all') return validSessions;
    return validSessions.filter(s => getSeason(s.date) === selectedSeason);
  }, [validSessions, selectedSeason]);

  const availableCategories = useMemo(() =>
    [...new Set(seasonFiltered.map(s => getPlayerCategory(s.player, profiles, selectedSeason !== 'all' ? selectedSeason : undefined)).filter(c => c))].sort(),
  [seasonFiltered, profiles, selectedSeason]);

  const categoryFiltered = useMemo(() => {
    if (selectedCategory === 'all') return seasonFiltered;
    return seasonFiltered.filter(s => getPlayerCategory(s.player, profiles, selectedSeason !== 'all' ? selectedSeason : undefined) === selectedCategory);
  }, [seasonFiltered, selectedCategory, profiles, selectedSeason]);

  const availableRoles = useMemo(() =>
    [...new Set(categoryFiltered.map(s => getPlayerPosition(s.player, profiles)).filter(r => r))].sort(),
  [categoryFiltered, profiles]);

  const roleFiltered = useMemo(() => {
    if (selectedRole === 'all') return categoryFiltered;
    return categoryFiltered.filter(s => getPlayerPosition(s.player, profiles) === selectedRole);
  }, [categoryFiltered, selectedRole, profiles]);

  const filteredPlayers = useMemo(() => {
    const pSet = new Set(roleFiltered.map(s => s.player));
    return players.filter(p => pSet.has(p));
  }, [roleFiltered, players]);

  useEffect(() => { setSelectedCategory('all'); setSelectedRole('all'); }, [selectedSeason]);
  useEffect(() => { setSelectedRole('all'); }, [selectedCategory]);

  const [selected, setSelected] = useState<string[]>(players.slice(0, 2));

  useEffect(() => {
    setSelected(prev => {
      const valid = prev.filter(p => filteredPlayers.includes(p));
      if (valid.length >= 2) return valid;
      const remaining = filteredPlayers.filter(p => !valid.includes(p));
      return [...valid, ...remaining].slice(0, 2);
    });
  }, [filteredPlayers]);

  const getPlayerVal = (player: string, key: string): number | null => {
    let val = getLatestMetric(roleFiltered, player, key as keyof VBSession);
    if (val !== null && (key === 'pureVertical' || key === 'noStepVertical')) {
      const reach = getLatestMetric(roleFiltered, player, 'standingReach');
      if (reach !== null) val = val - reach; else return null;
    }
    if (val !== null && key === 'bodyFat') {
      const dobSerial = getPlayerDobSerial(player, profiles);
      const bfSession = getPlayerSessions(roleFiltered, player).filter(s => s.bodyFat !== null).sort((a, b) => b.date.localeCompare(a.date))[0];
      const bf = calcBodyFatPct(val, dobSerial, bfSession?.date);
      if (bf !== null) val = bf;
    }
    return val;
  };

  const teamRanges = useMemo(() => {
    const metricKeys = ['pureVertical', 'noStepVertical', 'deadlift', 'shootingPct', 'bodyFat', 'sprint', 'coneDrill'];
    const ranges: Record<string, { min: number; max: number }> = {};
    metricKeys.forEach(key => {
      const allVals = filteredPlayers.map(p => getPlayerVal(p, key)).filter(v => v !== null) as number[];
      ranges[key] = { min: allVals.length ? Math.min(...allVals) : 0, max: allVals.length ? Math.max(...allVals) : 1 };
    });
    return ranges;
  }, [roleFiltered, filteredPlayers, profiles]);

  const radarData = useMemo(() => {
    if (selected.length < 2) return [];
    const metricDefs = [
      { key: 'pureVertical', label: t('Pure Vertical'), invert: false },
      { key: 'noStepVertical', label: t('No-Step V.'), invert: false },
      { key: 'deadlift', label: t('Deadlift'), invert: false },
      { key: 'shootingPct', label: t('3PT %'), invert: false },
      { key: 'bodyFat', label: t('Body Fat'), invert: true },
      { key: 'sprint', label: t('Sprint'), invert: true },
      { key: 'coneDrill', label: t('Cone Drill'), invert: true },
    ];
    return metricDefs.map(m => {
      const { min: teamMin, max: teamMax } = teamRanges[m.key] || { min: 0, max: 1 };
      const range = teamMax - teamMin || 1;
      const entry: any = { metric: m.label };
      selected.forEach(p => {
        const val = getPlayerVal(p, m.key);
        if (val === null) { entry[p] = 0; return; }
        if (m.invert) {
          entry[p] = Math.round(((teamMax - val) / range) * 80 + 20);
        } else {
          entry[p] = Math.round(((val - teamMin) / range) * 80 + 20);
        }
      });
      return entry;
    });
  }, [roleFiltered, selected, t, profiles, teamRanges]);

  const teamLoadRanges = useMemo(() => {
    const loadKeys = ['vitaminsLoad', 'weightsLoad', 'gameLoad', 'practiceLoad', 'shootsTaken'];
    const ranges: Record<string, number> = {};
    loadKeys.forEach(key => {
      let globalMax = 0;
      filteredPlayers.forEach(p => {
        const ps = getPlayerSessions(roleFiltered, p);
        const total = ps.reduce((sum, s) => sum + ((s[key as keyof VBSession] as number) || 0), 0);
        if (total > globalMax) globalMax = total;
      });
      ranges[key] = globalMax || 1;
    });
    return ranges;
  }, [roleFiltered, filteredPlayers]);

  const loadRadarData = useMemo(() => {
    if (selected.length < 2) return [];
    const metrics = [
      { key: 'vitaminsLoad', label: t('Vitamins') },
      { key: 'weightsLoad', label: t('Weights') },
      { key: 'gameLoad', label: t('Game') },
      { key: 'practiceLoad', label: t('Practice') },
      { key: 'shootsTaken', label: t('Shots Taken') },
    ];
    return metrics.map(m => {
      const entry: any = { metric: m.label };
      selected.forEach(p => {
        const ps = getPlayerSessions(roleFiltered, p);
        const total = ps.reduce((sum, s) => sum + ((s[m.key as keyof VBSession] as number) || 0), 0);
        entry[p] = Math.round((total / teamLoadRanges[m.key]) * 100);
      });
      return entry;
    });
  }, [roleFiltered, selected, t, teamLoadRanges]);

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
      values: selected.map(p => {
        const raw = getLatestMetric(roleFiltered, p, m.key);
        if (raw !== null && m.key === 'bodyFat') {
          const dobSerial = getPlayerDobSerial(p, profiles);
          const bfSession = getPlayerSessions(roleFiltered, p).filter(s => s.bodyFat !== null).sort((a, b) => b.date.localeCompare(a.date))[0];
          const bf = calcBodyFatPct(raw, dobSerial, bfSession?.date);
          return bf !== null ? bf : raw;
        }
        if (raw !== null && (m.key === 'pureVertical' || m.key === 'noStepVertical')) {
          const sr = getLatestMetric(roleFiltered, p, 'standingReach');
          return sr !== null ? raw - sr : null;
        }
        return raw;
      }),
    }));
  }, [roleFiltered, selected, t, profiles]);

  const selectClass = `px-3 py-1.5 rounded-lg text-xs font-medium appearance-none pr-7 ${isDark ? 'bg-gray-800 text-gray-300 border-gray-700' : 'bg-white text-gray-700 border-gray-200'} border`;

  return (
    <div className="space-y-6">
      <div className={`grid grid-cols-4 gap-2 rounded-xl border p-3 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} shadow-sm`}>
        <div className="relative">
          <select value={selectedSeason} onChange={e => setSelectedSeason(e.target.value)} className={selectClass + ' w-full'}>
            <option value="all">{t('All Seasons')}</option>
            {seasons.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
        </div>
        <div className="relative">
          <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} className={selectClass + ' w-full'}>
            <option value="all">{t('All Categories')}</option>
            {availableCategories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
        </div>
        <div className="relative">
          <select value={selectedRole} onChange={e => setSelectedRole(e.target.value)} className={selectClass + ' w-full'}>
            <option value="all">{t('All Roles')}</option>
            {availableRoles.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
        </div>
        <div className="flex items-center justify-end">
          <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{filteredPlayers.length} {t('players')}</span>
        </div>
      </div>
      <div>
        <label className={`text-xs font-medium mb-2 block ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('Select players to compare')} ({t('max 4')})</label>
        <PlayerSelector players={filteredPlayers} selected={selected} onChange={setSelected} multiple />
      </div>

      {selected.length >= 2 && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className={`rounded-xl border p-5 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} shadow-sm`}>
              <h3 className={`text-sm font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('Performance Radar')}</h3>
              <div className="h-96">
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
              <h3 className={`text-sm font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('Load Radar')}</h3>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={loadRadarData}>
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

type CompareMode = 'players' | 'roles' | 'categories' | 'seasons';

function ProgressionChart({ sessions, lines, metric, profiles, isDark, convertVal, compareMode }: {
  sessions: VBSession[];
  lines: { key: string; label: string; sessions: VBSession[] }[];
  metric: keyof VBSession;
  profiles: PlayerProfile[];
  isDark: boolean;
  convertVal: (session: VBSession, player: string, met: keyof VBSession) => number | null;
  compareMode?: string;
}) {
  const { t } = useLanguage();
  const seasonMonthOrder = ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  const allMetrics: { key: keyof VBSession; label: string; unit: string }[] = [
    { key: 'weight', label: t('Weight'), unit: 'kg' },
    { key: 'bodyFat', label: t('Body Fat'), unit: '%' },
    { key: 'pureVertical', label: t('Pure Vertical'), unit: 'cm' },
    { key: 'noStepVertical', label: t('No-Step Vertical'), unit: 'cm' },
    { key: 'sprint', label: t('Sprint'), unit: 'ms' },
    { key: 'coneDrill', label: t('Cone Drill'), unit: 'ms' },
    { key: 'deadlift', label: t('Deadlift'), unit: 'kg' },
    { key: 'shootingPct', label: t('3PT %'), unit: '%' },
  ];
  const currentMetric = allMetrics.find(m => m.key === metric);

  const chartData = useMemo(() => {
    if (compareMode === 'seasons') {
      const monthMap = new Map<string, Map<string, number[]>>();
      lines.forEach(line => {
        line.sessions.filter(s => s[metric] !== null).forEach(s => {
          const d = new Date(s.date);
          const monthLabel = d.toLocaleDateString('en-US', { month: 'short' });
          if (!monthMap.has(monthLabel)) monthMap.set(monthLabel, new Map());
          const val = convertVal(s, s.player, metric);
          if (val !== null && val !== 0) {
            const gm = monthMap.get(monthLabel)!;
            if (!gm.has(line.key)) gm.set(line.key, []);
            gm.get(line.key)!.push(val);
          }
        });
      });
      return seasonMonthOrder
        .filter(m => monthMap.has(m))
        .map(monthLabel => {
          const groups = monthMap.get(monthLabel)!;
          const entry: any = { date: monthLabel };
          lines.forEach(line => {
            const vals = groups.get(line.key);
            entry[line.key] = vals && vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length * 10) / 10 : null;
          });
          return entry;
        });
    }
    const monthMap = new Map<string, { sortKey: string; groups: Map<string, number[]> }>();
    lines.forEach(line => {
      line.sessions.filter(s => s[metric] !== null).forEach(s => {
        const monthKey = s.date.substring(0, 7);
        const d = new Date(s.date);
        const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        if (!monthMap.has(label)) monthMap.set(label, { sortKey: monthKey, groups: new Map() });
        const val = convertVal(s, s.player, metric);
        if (val !== null && val !== 0) {
          const gm = monthMap.get(label)!.groups;
          if (!gm.has(line.key)) gm.set(line.key, []);
          gm.get(line.key)!.push(val);
        }
      });
    });
    return [...monthMap.entries()]
      .sort((a, b) => a[1].sortKey.localeCompare(b[1].sortKey))
      .map(([label, data]) => {
        const entry: any = { date: label };
        lines.forEach(line => {
          const vals = data.groups.get(line.key);
          entry[line.key] = vals && vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length * 10) / 10 : null;
        });
        return entry;
      });
  }, [sessions, lines, metric, profiles, compareMode]);

  if (lines.length === 0) return <div className={`flex items-center justify-center h-full text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{t('No data')}</div>;
  if (chartData.length === 0) return <div className={`flex items-center justify-center h-full text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{t('No data')}</div>;

  return (
    <div className="h-full">
      <h3 className={`text-sm font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
        {currentMetric?.label} <span className="text-gray-400 font-normal">({currentMetric?.unit})</span>
      </h3>
      <div className="h-[calc(100%-28px)]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} />
            <XAxis dataKey="date" tick={{ fontSize: 9, fill: isDark ? '#9ca3af' : '#6b7280' }} />
            <YAxis tick={{ fontSize: 9, fill: isDark ? '#9ca3af' : '#6b7280' }} domain={[(dataMin: number) => { if (isNaN(dataMin)) return 0; const pad = Math.max(1, Math.abs(dataMin) * 0.1); return Math.floor(dataMin - pad); }, (dataMax: number) => { if (isNaN(dataMax)) return 100; const pad = Math.max(1, Math.abs(dataMax) * 0.1); return Math.ceil(dataMax + pad); }]} />
            <Tooltip contentStyle={{ borderRadius: 8, fontSize: 11, backgroundColor: isDark ? '#1f2937' : '#fff', border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`, color: isDark ? '#f3f4f6' : '#111827' }} />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            {lines.map((line, i) => (
              <Line key={line.key} type="monotone" dataKey={line.key} name={line.label} stroke={METRIC_COLORS[i % METRIC_COLORS.length]} strokeWidth={2} dot={{ r: 2 }} connectNulls />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function ProgressionTab({ sessions, players, profiles }: { sessions: VBSession[]; players: string[]; profiles: PlayerProfile[] }) {
  const { t } = useLanguage();
  const isDark = useIsDark();

  const [compareMode, setCompareMode] = useState<CompareMode>('players');
  const [selected, setSelected] = useState<string[]>(players.slice(0, 3));
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSeasons, setSelectedSeasons] = useState<string[]>([]);
  const [selectedYoYPlayers, setSelectedYoYPlayers] = useState<string[]>([]);
  const [selectedYoYRole, setSelectedYoYRole] = useState<string>('all');
  const [selectedYoYCategory, setSelectedYoYCategory] = useState<string>('all');
  const [chartCount, setChartCount] = useState(1);
  const [chartMetrics, setChartMetrics] = useState<(keyof VBSession)[]>(['pureVertical', 'weight', 'sprint', 'shootingPct']);

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

  const allSeasons = useMemo(() => [...new Set(sessions.map(s => getSeason(s.date)!).filter(Boolean))].sort().reverse(), [sessions]);
  const allCategories = useMemo(() => {
    const cats = new Set<string>();
    sessions.forEach(s => {
      const season = getSeason(s.date);
      if (season) {
        const cat = getPlayerCategory(s.player, profiles, season);
        if (cat) cats.add(cat);
      }
    });
    return [...cats].sort();
  }, [sessions, players, profiles]);
  const allRoles = useMemo(() => [...new Set(players.map(p => getPlayerPosition(p, profiles)).filter(r => r))].sort(), [players, profiles]);

  const yoyRoles = useMemo(() => {
    if (selectedSeasons.length === 0) return [];
    const roles = new Set<string>();
    sessions.filter(s => selectedSeasons.includes(getSeason(s.date) || '')).forEach(s => {
      const r = getPlayerPosition(s.player, profiles);
      if (r) roles.add(r);
    });
    return [...roles].sort();
  }, [sessions, selectedSeasons, profiles]);

  const yoyCategories = useMemo(() => {
    if (selectedSeasons.length === 0) return [];
    const cats = new Set<string>();
    sessions.filter(s => selectedSeasons.includes(getSeason(s.date) || '')).forEach(s => {
      const season = getSeason(s.date);
      if (season) {
        const cat = getPlayerCategory(s.player, profiles, season);
        if (cat) cats.add(cat);
      }
    });
    return [...cats].sort();
  }, [sessions, selectedSeasons, profiles]);

  const yoyPlayers = useMemo(() => {
    if (selectedSeasons.length === 0) return [];
    let filtered = sessions.filter(s => selectedSeasons.includes(getSeason(s.date) || ''));
    if (selectedYoYRole !== 'all') filtered = filtered.filter(s => getPlayerPosition(s.player, profiles) === selectedYoYRole);
    if (selectedYoYCategory !== 'all') filtered = filtered.filter(s => {
      const season = getSeason(s.date);
      return season ? getPlayerCategory(s.player, profiles, season) === selectedYoYCategory : false;
    });
    return [...new Set(filtered.map(s => s.player))].sort();
  }, [sessions, selectedSeasons, selectedYoYRole, selectedYoYCategory, profiles]);

  useEffect(() => {
    if (compareMode === 'roles' && selectedRoles.length === 0 && allRoles.length > 0) setSelectedRoles(allRoles.slice(0, 3));
    if (compareMode === 'categories' && selectedCategories.length === 0 && allCategories.length > 0) setSelectedCategories(allCategories.slice(0, 4));
    if (compareMode === 'seasons' && selectedSeasons.length === 0 && allSeasons.length > 0) setSelectedSeasons(allSeasons.slice(0, 3));
  }, [compareMode, allRoles, allCategories, allSeasons]);

  const convertVal = (session: VBSession, player: string, met: keyof VBSession): number | null => {
    const val = session[met] as number | null;
    if (val === null) return null;
    if (met === 'bodyFat') {
      const dobSerial = getPlayerDobSerial(player, profiles);
      const bf = calcBodyFatPct(val, dobSerial, session.date);
      return bf !== null ? bf : val;
    }
    if (met === 'pureVertical' || met === 'noStepVertical') {
      const sr = session.standingReach;
      return sr !== null ? val - sr : null;
    }
    return val;
  };

  const lines = useMemo((): { key: string; label: string; sessions: VBSession[] }[] => {
    if (compareMode === 'players') {
      return selected.map(p => ({ key: p, label: p.split(' ').pop() || p, sessions: sessions.filter(s => s.player === p) }));
    }
    if (compareMode === 'roles') {
      return selectedRoles.map(role => ({
        key: role,
        label: role,
        sessions: sessions.filter(s => getPlayerPosition(s.player, profiles) === role)
      }));
    }
    if (compareMode === 'categories') {
      return selectedCategories.map(cat => ({
        key: cat,
        label: cat,
        sessions: sessions.filter(s => {
          const season = getSeason(s.date);
          return season ? getPlayerCategory(s.player, profiles, season) === cat : false;
        })
      }));
    }
    if (compareMode === 'seasons') {
      const filterSession = (s: VBSession) => {
        if (selectedYoYRole !== 'all' && getPlayerPosition(s.player, profiles) !== selectedYoYRole) return false;
        if (selectedYoYCategory !== 'all') {
          const season = getSeason(s.date);
          if (!season || getPlayerCategory(s.player, profiles, season) !== selectedYoYCategory) return false;
        }
        return true;
      };
      if (selectedYoYPlayers.length > 0) {
        const result: { key: string; label: string; sessions: VBSession[] }[] = [];
        selectedYoYPlayers.forEach(player => {
          selectedSeasons.forEach(season => {
            const playerSessions = sessions.filter(s => s.player === player && getSeason(s.date) === season && filterSession(s));
            if (playerSessions.length > 0) {
              const shortName = player.split(' ').pop() || player;
              const shortSeason = season.split('/').map(s => s.slice(-2)).join('/');
              result.push({ key: `${player}_${season}`, label: `${shortName} ${shortSeason}`, sessions: playerSessions });
            }
          });
        });
        return result;
      }
      return selectedSeasons.map(season => ({
        key: season,
        label: season,
        sessions: sessions.filter(s => getSeason(s.date) === season && filterSession(s))
      }));
    }
    return [];
  }, [compareMode, selected, selectedRoles, selectedCategories, selectedSeasons, selectedYoYPlayers, selectedYoYRole, selectedYoYCategory, sessions, profiles]);

  const selectClass = `w-full px-3 py-2 rounded-lg text-sm font-medium appearance-none pr-8 ${isDark ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-gray-900 border-gray-200'} border`;
  const gridClass = chartCount === 1 ? 'grid-cols-1' : chartCount === 2 ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1 lg:grid-cols-2';

  const compareModes: { key: CompareMode; label: string }[] = [
    { key: 'players', label: t('Players') },
    { key: 'roles', label: t('Role') },
    { key: 'categories', label: t('Category') },
    { key: 'seasons', label: 'YoY' },
  ];

  const toggleItem = (list: string[], item: string, setter: (v: string[]) => void) => {
    setter(list.includes(item) ? list.filter(x => x !== item) : [...list, item]);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div>
          <label className={`text-xs font-medium mb-2 block ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('Compare')}</label>
          <div className="flex gap-1">
            {compareModes.map(m => (
              <button key={m.key} onClick={() => setCompareMode(m.key)} className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${compareMode === m.key ? 'bg-orange-500 text-white' : isDark ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>{m.label}</button>
            ))}
          </div>
        </div>

        <div className="flex-1">
          {compareMode === 'players' && (
            <div>
              <label className={`text-xs font-medium mb-2 block ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('Players')}</label>
              <PlayerSelector players={players} selected={selected} onChange={setSelected} multiple />
            </div>
          )}
          {compareMode === 'roles' && (
            <div>
              <label className={`text-xs font-medium mb-2 block ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('Role')}</label>
              <div className="flex flex-wrap gap-1.5">
                {allRoles.map(role => (
                  <button key={role} onClick={() => toggleItem(selectedRoles, role, setSelectedRoles)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${selectedRoles.includes(role) ? 'bg-orange-500 text-white' : isDark ? 'bg-gray-800 text-gray-400 hover:bg-gray-700 border border-gray-700' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'}`}>{role}</button>
                ))}
              </div>
            </div>
          )}
          {compareMode === 'categories' && (
            <div>
              <label className={`text-xs font-medium mb-2 block ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('Category')}</label>
              <div className="flex flex-wrap gap-1.5">
                {allCategories.map(cat => (
                  <button key={cat} onClick={() => toggleItem(selectedCategories, cat, setSelectedCategories)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${selectedCategories.includes(cat) ? 'bg-orange-500 text-white' : isDark ? 'bg-gray-800 text-gray-400 hover:bg-gray-700 border border-gray-700' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'}`}>{cat}</button>
                ))}
              </div>
            </div>
          )}
          {compareMode === 'seasons' && (
            <div className="space-y-3">
              <div>
                <label className={`text-xs font-medium mb-2 block ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('Season')}</label>
                <div className="flex flex-wrap gap-1.5">
                  {allSeasons.map(season => (
                    <button key={season} onClick={() => toggleItem(selectedSeasons, season, setSelectedSeasons)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${selectedSeasons.includes(season) ? 'bg-orange-500 text-white' : isDark ? 'bg-gray-800 text-gray-400 hover:bg-gray-700 border border-gray-700' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'}`}>{season}</button>
                  ))}
                </div>
              </div>
              {selectedSeasons.length > 0 && (
                <div className="flex flex-wrap gap-3">
                  {yoyRoles.length > 0 && (
                    <div>
                      <label className={`text-xs font-medium mb-1.5 block ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('Role')} <span className={`font-normal ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>({t('optional')})</span></label>
                      <div className="flex flex-wrap gap-1">
                        <button onClick={() => setSelectedYoYRole('all')} className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${selectedYoYRole === 'all' ? 'bg-orange-500 text-white' : isDark ? 'bg-gray-800 text-gray-400 hover:bg-gray-700 border border-gray-700' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'}`}>{t('All')}</button>
                        {yoyRoles.map(role => (
                          <button key={role} onClick={() => { setSelectedYoYRole(role); setSelectedYoYPlayers([]); }} className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${selectedYoYRole === role ? 'bg-orange-500 text-white' : isDark ? 'bg-gray-800 text-gray-400 hover:bg-gray-700 border border-gray-700' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'}`}>{role}</button>
                        ))}
                      </div>
                    </div>
                  )}
                  {yoyCategories.length > 0 && (
                    <div>
                      <label className={`text-xs font-medium mb-1.5 block ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('Category')} <span className={`font-normal ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>({t('optional')})</span></label>
                      <div className="flex flex-wrap gap-1">
                        <button onClick={() => setSelectedYoYCategory('all')} className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${selectedYoYCategory === 'all' ? 'bg-orange-500 text-white' : isDark ? 'bg-gray-800 text-gray-400 hover:bg-gray-700 border border-gray-700' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'}`}>{t('All')}</button>
                        {yoyCategories.map(cat => (
                          <button key={cat} onClick={() => { setSelectedYoYCategory(cat); setSelectedYoYPlayers([]); }} className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${selectedYoYCategory === cat ? 'bg-orange-500 text-white' : isDark ? 'bg-gray-800 text-gray-400 hover:bg-gray-700 border border-gray-700' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'}`}>{cat}</button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              {selectedSeasons.length > 0 && yoyPlayers.length > 0 && (
                <div>
                  <label className={`text-xs font-medium mb-2 block ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('Players')} <span className={`font-normal ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>({t('optional — team avg if none')})</span></label>
                  <PlayerSelector players={yoyPlayers} selected={selectedYoYPlayers} onChange={setSelectedYoYPlayers} multiple />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <label className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('Charts')}:</label>
        {[1, 2, 3, 4].map(n => (
          <button key={n} onClick={() => setChartCount(n)} className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${chartCount === n ? 'bg-orange-500 text-white' : isDark ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>{n}</button>
        ))}
      </div>

      <div className={`grid ${gridClass} gap-4`}>
        {Array.from({ length: chartCount }).map((_, idx) => {
          const met = chartMetrics[idx];
          const currentMetric = metrics.find(m => m.key === met);
          const showDeltas = chartCount <= 2;
          const deltaData = showDeltas ? lines.map(line => {
            const validSessions = line.sessions.filter(s => s[met] !== null).sort((a, b) => a.date.localeCompare(b.date));
            const vals = validSessions.map(s => convertVal(s, s.player, met)).filter((v): v is number => v !== null && v !== 0);
            if (vals.length < 2) return { label: line.label, first: null, last: null, delta: null };
            const monthMap = new Map<string, number[]>();
            validSessions.forEach(s => {
              const mk = s.date.substring(0, 7);
              const v = convertVal(s, s.player, met);
              if (v !== null && v !== 0) {
                if (!monthMap.has(mk)) monthMap.set(mk, []);
                monthMap.get(mk)!.push(v);
              }
            });
            const months = [...monthMap.entries()].sort((a, b) => a[0].localeCompare(b[0]));
            if (months.length < 2) return { label: line.label, first: null, last: null, delta: null };
            const firstAvg = Math.round(months[0][1].reduce((a, b) => a + b, 0) / months[0][1].length * 10) / 10;
            const lastAvg = Math.round(months[months.length - 1][1].reduce((a, b) => a + b, 0) / months[months.length - 1][1].length * 10) / 10;
            return { label: line.label, first: firstAvg, last: lastAvg, delta: Math.round((lastAvg - firstAvg) * 10) / 10 };
          }) : [];

          return (
            <div key={idx}>
              <div className={`rounded-xl border p-4 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} shadow-sm`}>
                <div className="mb-3">
                  <div className="relative">
                    <select
                      value={chartMetrics[idx]}
                      onChange={e => {
                        const newMetrics = [...chartMetrics];
                        newMetrics[idx] = e.target.value as keyof VBSession;
                        setChartMetrics(newMetrics);
                      }}
                      className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-medium appearance-none pr-7 ${isDark ? 'bg-gray-800 text-white border-gray-700' : 'bg-gray-50 text-gray-900 border-gray-200'} border`}
                    >
                      {metrics.map(m => <option key={m.key} value={m.key}>{m.label} ({m.unit})</option>)}
                    </select>
                    <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
                  </div>
                </div>
                <div className={chartCount <= 2 ? 'h-64' : 'h-48'}>
                  <ProgressionChart sessions={sessions} lines={lines} metric={chartMetrics[idx]} profiles={profiles} isDark={isDark} convertVal={convertVal} compareMode={compareMode} />
                </div>
              </div>
              {showDeltas && deltaData.length > 0 && (
                <div className={`grid ${lines.length <= 2 ? 'grid-cols-2' : lines.length <= 4 ? 'grid-cols-4' : 'grid-cols-4'} gap-2 mt-3`}>
                  {deltaData.map((d, i) => (
                    <div key={d.label} className={`rounded-xl border p-3 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} shadow-sm`}>
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: METRIC_COLORS[i % METRIC_COLORS.length] }} />
                        <span className={`text-xs font-medium truncate ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{d.label}</span>
                      </div>
                      <div className="flex items-end gap-2">
                        <span className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {d.last !== null ? d.last : '—'}
                        </span>
                        {d.delta !== null && (
                          <span className={`text-xs font-semibold mb-0.5 ${
                            (met === 'sprint' || met === 'coneDrill' || met === 'bodyFat')
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
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const VBDashboard: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { t } = useLanguage();
  const isDark = useIsDark();
  const [sessions, setSessions] = useState<VBSession[]>([]);
  const [players, setPlayers] = useState<string[]>([]);
  const [profiles, setProfiles] = useState<PlayerProfile[]>([]);
  const [prospects, setProspects] = useState<VBProspect[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [selectedPlayer, setSelectedPlayer] = useState<string>('');
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async (refresh = false) => {
    try {
      if (refresh) setRefreshing(true);
      else setLoading(true);
      
      const [dataRes, profileRes, prospectsRes] = await Promise.all([
        fetch(`/api/vb-data${refresh ? '?refresh=true' : ''}`),
        fetch(`/api/vb-profiles${refresh ? '?refresh=true' : ''}`),
        fetch(`/api/vb-prospects${refresh ? '?refresh=true' : ''}`)
      ]);
      const json = await dataRes.json();
      const profileJson = await profileRes.json();
      const prospectsJson = await prospectsRes.json();
      
      if (json.success) {
        setSessions(json.data);
        setPlayers(json.players);
        if (json.players.length > 0 && !selectedPlayer) setSelectedPlayer(json.players[0]);
      } else {
        setError(json.message || 'Failed to load data');
      }
      if (profileJson.success) {
        setProfiles(profileJson.data);
      }
      if (prospectsJson.success) {
        setProspects(prospectsJson.data);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const normalizedSessions = useMemo(() => {
    if (sessions.length === 0) return sessions;

    const playerNonNTSessions: Record<string, VBSession[]> = {};
    for (const s of sessions) {
      if (!playerNonNTSessions[s.player]) playerNonNTSessions[s.player] = [];
      if (!(s.nationalTeam !== null && s.nationalTeam > 0)) {
        playerNonNTSessions[s.player].push(s);
      }
    }

    const playerAvgs: Record<string, { practice: number; vitamins: number; weights: number; game: number; shotsTaken: number; shotsMade: number; shootingPct: number }> = {};
    for (const [player, pSessions] of Object.entries(playerNonNTSessions)) {
      const activeSessions = pSessions.filter(s => (s.practiceLoad || 0) > 0 || (s.vitaminsLoad || 0) > 0 || (s.weightsLoad || 0) > 0 || (s.gameLoad || 0) > 0);
      const shootingSessions = pSessions.filter(s => s.shootsTaken !== null && s.shootsTaken > 0);
      const count = activeSessions.length || 1;
      const shootCount = shootingSessions.length || 1;
      playerAvgs[player] = {
        practice: Math.round(activeSessions.reduce((sum, s) => sum + (s.practiceLoad || 0), 0) / count),
        vitamins: Math.round(activeSessions.reduce((sum, s) => sum + (s.vitaminsLoad || 0), 0) / count),
        weights: Math.round(activeSessions.reduce((sum, s) => sum + (s.weightsLoad || 0), 0) / count),
        game: Math.round(activeSessions.reduce((sum, s) => sum + (s.gameLoad || 0), 0) / count),
        shotsTaken: Math.round(shootingSessions.reduce((sum, s) => sum + (s.shootsTaken || 0), 0) / shootCount),
        shotsMade: Math.round(shootingSessions.reduce((sum, s) => sum + (s.shootsMade || 0), 0) / shootCount),
        shootingPct: (() => {
          const totalTaken = shootingSessions.reduce((sum, s) => sum + (s.shootsTaken || 0), 0);
          const totalMade = shootingSessions.reduce((sum, s) => sum + (s.shootsMade || 0), 0);
          return totalTaken > 0 ? Math.round((totalMade / totalTaken) * 100) : 0;
        })(),
      };
    }

    return sessions.map(s => {
      let normalized = { ...s };

      if (s.nationalTeam !== null && s.nationalTeam > 0) {
        const avg = playerAvgs[s.player];
        if (avg) {
          normalized.practiceLoad = normalized.practiceLoad || avg.practice;
          normalized.vitaminsLoad = normalized.vitaminsLoad || avg.vitamins;
          normalized.weightsLoad = normalized.weightsLoad || avg.weights;
          normalized.gameLoad = normalized.gameLoad || avg.game;
          if (normalized.shootsTaken === null || normalized.shootsTaken === 0) {
            normalized.shootsTaken = avg.shotsTaken;
            normalized.shootsMade = avg.shotsMade;
            normalized.shootingPct = avg.shootingPct;
          }
        }
      }

      if (s.formShooting !== null && s.formShooting === 1) {
        const extraShots = 100;
        const avg = playerAvgs[s.player];
        const pct = avg ? avg.shootingPct : 0;
        const extraMade = Math.round(extraShots * pct / 100);
        normalized.shootsTaken = (normalized.shootsTaken || 0) + extraShots;
        normalized.shootsMade = (normalized.shootsMade || 0) + extraMade;
        normalized.shootingPct = normalized.shootsTaken > 0 ? Math.round((normalized.shootsMade / normalized.shootsTaken) * 100) : null;
      }

      return normalized;
    });
  }, [sessions]);

  const handleSelectPlayer = (p: string) => {
    setSelectedPlayer(p);
    setActiveTab('player');
  };

  const tabs: { id: TabId; label: string; icon: any }[] = [
    { id: 'overview', label: t('Overview'), icon: BarChart3 },
    { id: 'performance', label: t('Performance'), icon: Zap },
    { id: 'gameperf', label: t('Game Performance'), icon: Trophy },
    { id: 'player', label: t('Players Pack'), icon: User },
    { id: 'compare', label: t('Compare'), icon: GitCompare },
    { id: 'progression', label: t('Progression'), icon: TrendingUp },
    { id: 'prospects', label: t('Prospects'), icon: Star },
    { id: 'resources', label: t('Coaches Resources'), icon: BookOpen },
    { id: 'search', label: t('Search'), icon: Search },
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
      <header className={`sticky top-0 z-40 border-b backdrop-blur-xl no-print ${isDark ? 'bg-[#0a0a0a]/90 border-gray-800' : 'bg-white/90 border-gray-200'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <button onClick={onBack} className="w-8 h-8 flex-shrink-0 hover:opacity-70 transition-opacity" title="Back to Hub">
                <img src="https://i.imgur.com/e7khORs.png" alt="VB" className="w-full h-full object-contain" />
              </button>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-orange-500/10 flex items-center justify-center">
                  <Activity size={15} className="text-orange-500" />
                </div>
                <div>
                  <h1 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>BOps</h1>
                  <p className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Basketball Operations</p>
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

        {activeTab === 'resources' ? (
          <CoachesResourcesTab />
        ) : normalizedSessions.length === 0 && !error ? (
          <div className="text-center py-20">
            <Activity size={40} className={`mx-auto mb-3 ${isDark ? 'text-gray-700' : 'text-gray-300'}`} />
            <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{t('No VB data available')}</p>
          </div>
        ) : (
          <>
            {activeTab === 'overview' && <OverviewTab sessions={normalizedSessions} players={players} onSelectPlayer={handleSelectPlayer} profiles={profiles} />}
            {activeTab === 'performance' && <PerformanceTab sessions={normalizedSessions} players={players} profiles={profiles} />}
            {activeTab === 'gameperf' && <GamePerformanceTab sessions={normalizedSessions} players={players} profiles={profiles} />}
            {activeTab === 'player' && <PlayerProfileTab sessions={normalizedSessions} players={players} initialPlayer={selectedPlayer} profiles={profiles} />}
            {activeTab === 'compare' && <CompareTab sessions={normalizedSessions} players={players} profiles={profiles} />}
            {activeTab === 'progression' && <ProgressionTab sessions={normalizedSessions} players={players} profiles={profiles} />}
            {activeTab === 'search' && <SearchTab sessions={normalizedSessions} players={players} profiles={profiles} />}
            {activeTab === 'prospects' && <ProspectsTab prospects={prospects} />}
          </>
        )}
      </main>
    </div>
  );
};
