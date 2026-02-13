import React, { useState } from 'react';
import { Activity, Euro, TrendingUp, TrendingDown, Users, Briefcase, UserCog, UsersRound, Wrench, Scale, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend, Area, AreaChart } from 'recharts';
import { useLanguage } from '../contexts/LanguageContext';

const formatCurrency = (val: number) => `€${val.toLocaleString('it-IT', { maximumFractionDigits: 0 })}`;
const formatPct = (val: number) => `${val.toFixed(1)}%`;

type Season = '22/23' | '23/24' | '24/25' | '25/26';

interface CategoryLine {
  name: string;
  salaries: number;
  taxes: number;
  agents: number;
  relatedCost: number;
  total: number;
}

interface SeasonData {
  season: Season;
  players: CategoryLine;
  coaches: CategoryLine;
  management: CategoryLine;
  staff: CategoryLine;
  anr: { personnel: number; softServices: number; total: number };
  luxuryTax: number;
  totalBops: number;
  netSalaryRatio: number;
}

const SEASONS_DATA: SeasonData[] = [
  {
    season: '22/23',
    players: { name: 'Players', salaries: 840345, taxes: 668649, agents: 84871, relatedCost: 283750, total: 1877615 },
    coaches: { name: 'Coaches', salaries: 178000, taxes: 223000, agents: 14800, relatedCost: 54000, total: 469800 },
    management: { name: 'Management', salaries: 101000, taxes: 110191, agents: 0, relatedCost: 27500, total: 238691 },
    staff: { name: 'Staff', salaries: 80792, taxes: 54365, agents: 0, relatedCost: 17500, total: 152657 },
    anr: { personnel: 62357, softServices: 29000, total: 91357 },
    luxuryTax: 0,
    totalBops: 2830120,
    netSalaryRatio: 0.30,
  },
  {
    season: '23/24',
    players: { name: 'Players', salaries: 958586, taxes: 688176, agents: 113364, relatedCost: 347051, total: 2107177 },
    coaches: { name: 'Coaches', salaries: 156802, taxes: 118049, agents: 11033, relatedCost: 66182, total: 352066 },
    management: { name: 'Management', salaries: 56000, taxes: 26060, agents: 0, relatedCost: 26000, total: 108060 },
    staff: { name: 'Staff', salaries: 82133, taxes: 8021, agents: 0, relatedCost: 12660, total: 102814 },
    anr: { personnel: 94225, softServices: 79025, total: 173250 },
    luxuryTax: 0,
    totalBops: 2843367,
    netSalaryRatio: 0.34,
  },
  {
    season: '24/25',
    players: { name: 'Players', salaries: 1206569, taxes: 943136, agents: 190323, relatedCost: 494882, total: 2834910 },
    coaches: { name: 'Coaches', salaries: 212277, taxes: 160142, agents: 21565, relatedCost: 59352, total: 453335 },
    management: { name: 'Management', salaries: 110408, taxes: 75226, agents: 0, relatedCost: 32014, total: 217648 },
    staff: { name: 'Staff', salaries: 78169, taxes: 9251, agents: 3000, relatedCost: 16488, total: 106908 },
    anr: { personnel: 54504, softServices: 24416, total: 78920 },
    luxuryTax: 40000,
    totalBops: 3731721,
    netSalaryRatio: 0.32,
  },
  {
    season: '25/26',
    players: { name: 'Players', salaries: 1463535, taxes: 1062374, agents: 160754, relatedCost: 424178, total: 3110841 },
    coaches: { name: 'Coaches', salaries: 176700, taxes: 169078, agents: 14200, relatedCost: 49383, total: 409361 },
    management: { name: 'Management', salaries: 75000, taxes: 57858, agents: 0, relatedCost: 40785, total: 173643 },
    staff: { name: 'Staff', salaries: 87000, taxes: 32890, agents: 3300, relatedCost: 15666, total: 138856 },
    anr: { personnel: 59500, softServices: 57525, total: 117025 },
    luxuryTax: 40000,
    totalBops: 3989726,
    netSalaryRatio: 0.37,
  },
];

const CATEGORY_COLORS: Record<string, string> = {
  Players: '#ef4444',
  Coaches: '#f97316',
  Management: '#8b5cf6',
  Staff: '#3b82f6',
  'A&R': '#10b981',
  'Luxury Tax': '#f59e0b',
};

const SUB_COLORS = {
  salaries: '#ef4444',
  taxes: '#f97316',
  agents: '#8b5cf6',
  relatedCost: '#3b82f6',
};

export const BOpsCostDashboard: React.FC = () => {
  const { t } = useLanguage();
  const [selectedSeason, setSelectedSeason] = useState<Season>('25/26');

  const current = SEASONS_DATA.find(s => s.season === selectedSeason)!;
  const currentIdx = SEASONS_DATA.findIndex(s => s.season === selectedSeason);
  const previous = currentIdx > 0 ? SEASONS_DATA[currentIdx - 1] : null;

  const yoyChange = previous ? ((current.totalBops - previous.totalBops) / previous.totalBops) * 100 : null;

  const pieData = [
    { name: t('Players'), value: current.players.total, color: CATEGORY_COLORS.Players },
    { name: t('Coaches'), value: current.coaches.total, color: CATEGORY_COLORS.Coaches },
    { name: t('Management'), value: current.management.total, color: CATEGORY_COLORS.Management },
    { name: t('Staff'), value: current.staff.total, color: CATEGORY_COLORS.Staff },
    { name: t('A&R'), value: current.anr.total, color: CATEGORY_COLORS['A&R'] },
    ...(current.luxuryTax > 0 ? [{ name: t('Luxury Tax'), value: current.luxuryTax, color: CATEGORY_COLORS['Luxury Tax'] }] : []),
  ];

  const trendData = SEASONS_DATA.map(s => ({
    season: s.season,
    [t('Players')]: s.players.total,
    [t('Coaches')]: s.coaches.total,
    [t('Management')]: s.management.total,
    [t('Staff')]: s.staff.total,
    [t('A&R')]: s.anr.total,
    [t('Luxury Tax')]: s.luxuryTax,
    total: s.totalBops,
  }));

  const ratioData = SEASONS_DATA.map(s => ({
    season: s.season,
    ratio: +(s.netSalaryRatio * 100).toFixed(1),
  }));

  const categories: { key: string; icon: any; data: CategoryLine; pct: number }[] = [
    { key: 'Players', icon: Users, data: current.players, pct: (current.players.total / current.totalBops) * 100 },
    { key: 'Coaches', icon: Briefcase, data: current.coaches, pct: (current.coaches.total / current.totalBops) * 100 },
    { key: 'Management', icon: UserCog, data: current.management, pct: (current.management.total / current.totalBops) * 100 },
    { key: 'Staff', icon: UsersRound, data: current.staff, pct: (current.staff.total / current.totalBops) * 100 },
  ];

  const stackedBarData = SEASONS_DATA.map(s => ({
    season: s.season,
    [t('Salaries')]: s.players.salaries + s.coaches.salaries + s.management.salaries + s.staff.salaries,
    [t('Taxes')]: s.players.taxes + s.coaches.taxes + s.management.taxes + s.staff.taxes,
    [t('Agents')]: s.players.agents + s.coaches.agents + s.management.agents + s.staff.agents,
    [t('Related Costs')]: s.players.relatedCost + s.coaches.relatedCost + s.management.relatedCost + s.staff.relatedCost,
    [t('A&R')]: s.anr.total,
    [t('Luxury Tax')]: s.luxuryTax,
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-red-100 dark:bg-red-900/20 rounded-xl">
            <Activity className="text-red-600" size={22} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('BOps — Cost Structure')}</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t('Basketball Operations')} · {t('Full Season Cost Analysis')}</p>
          </div>
        </div>
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          {SEASONS_DATA.map(s => (
            <button
              key={s.season}
              onClick={() => setSelectedSeason(s.season)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                selectedSeason === s.season
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {s.season}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-1">
            <Euro size={13} />
            <span>{t('Total BOps Cost')}</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(current.totalBops)}</div>
          {yoyChange !== null && (
            <div className={`flex items-center gap-1 mt-2 text-xs ${yoyChange > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
              {yoyChange > 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
              <span>{yoyChange > 0 ? '+' : ''}{formatPct(yoyChange)} {t('vs prior season')}</span>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-1">
            <Users size={13} />
            <span>{t('Player Cost Share')}</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{formatPct((current.players.total / current.totalBops) * 100)}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">{formatCurrency(current.players.total)} {t('of')} {formatCurrency(current.totalBops)}</div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-1">
            <Scale size={13} />
            <span>{t('Net Salary to BOps Ratio')}</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{(current.netSalaryRatio * 100).toFixed(0)}%</div>
          <div className="mt-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2">
            <div className="bg-red-500 h-2 rounded-full transition-all" style={{ width: `${current.netSalaryRatio * 100}%` }} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-4">{t('Cost Distribution')} — {selectedSeason}</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={85} dataKey="value" paddingAngle={2}>
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ borderRadius: '8px', fontSize: '12px', border: '1px solid #e5e7eb' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-3 mt-2">
            {pieData.map((item) => (
              <div key={item.name} className="flex items-center gap-1.5 text-[11px] text-gray-600 dark:text-gray-400">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                {item.name} ({formatPct((item.value / current.totalBops) * 100)})
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-4">{t('Total BOps Trend')}</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="season" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => `€${(v / 1000000).toFixed(1)}M`} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ borderRadius: '8px', fontSize: '12px', border: '1px solid #e5e7eb' }} />
                <Area type="monotone" dataKey="total" stroke="#ef4444" fill="#ef444420" strokeWidth={2} name={t('Total BOps')} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-4">{t('Cost Type Breakdown by Season')}</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stackedBarData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="season" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => `€${(v / 1000000).toFixed(1)}M`} />
              <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ borderRadius: '8px', fontSize: '12px', border: '1px solid #e5e7eb' }} />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Bar dataKey={t('Salaries')} stackId="a" fill="#ef4444" />
              <Bar dataKey={t('Taxes')} stackId="a" fill="#f97316" />
              <Bar dataKey={t('Agents')} stackId="a" fill="#8b5cf6" />
              <Bar dataKey={t('Related Costs')} stackId="a" fill="#3b82f6" />
              <Bar dataKey={t('A&R')} stackId="a" fill="#10b981" />
              <Bar dataKey={t('Luxury Tax')} stackId="a" fill="#f59e0b" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">{t('Category Breakdown')} — {selectedSeason}</h3>
        {categories.map(({ key, icon: Icon, data, pct }) => (
          <div key={key} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${CATEGORY_COLORS[key]}15` }}>
                  <Icon size={16} style={{ color: CATEGORY_COLORS[key] }} />
                </div>
                <div>
                  <span className="text-sm font-semibold text-gray-800 dark:text-white">{t(key)}</span>
                  <span className="text-xs text-gray-400 ml-2">{formatPct(pct)} {t('of total')}</span>
                </div>
              </div>
              <span className="text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(data.total)}</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: t('Salaries'), value: data.salaries, color: SUB_COLORS.salaries },
                { label: t('Taxes'), value: data.taxes, color: SUB_COLORS.taxes },
                { label: t('Agents'), value: data.agents, color: SUB_COLORS.agents },
                { label: t(`${key} Related Cost`), value: data.relatedCost, color: SUB_COLORS.relatedCost },
              ].map(sub => (
                <div key={sub.label} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: sub.color }} />
                    <span className="text-[10px] text-gray-500 dark:text-gray-400">{sub.label}</span>
                  </div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">{formatCurrency(sub.value)}</div>
                  <div className="text-[10px] text-gray-400">{data.total > 0 ? formatPct((sub.value / data.total) * 100) : '0%'} {t('of category')}</div>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${CATEGORY_COLORS['A&R']}15` }}>
                <Wrench size={16} style={{ color: CATEGORY_COLORS['A&R'] }} />
              </div>
              <div>
                <span className="text-sm font-semibold text-gray-800 dark:text-white">{t('A&R')}</span>
                <span className="text-xs text-gray-400 ml-2">{formatPct((current.anr.total / current.totalBops) * 100)} {t('of total')}</span>
              </div>
            </div>
            <span className="text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(current.anr.total)}</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              <div className="text-[10px] text-gray-500 dark:text-gray-400 mb-1">{t('Personnel')}</div>
              <div className="text-sm font-semibold text-gray-900 dark:text-white">{formatCurrency(current.anr.personnel)}</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              <div className="text-[10px] text-gray-500 dark:text-gray-400 mb-1">{t('Software & Services')}</div>
              <div className="text-sm font-semibold text-gray-900 dark:text-white">{formatCurrency(current.anr.softServices)}</div>
            </div>
          </div>
        </div>

        {current.luxuryTax > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-amber-50 dark:bg-amber-900/20">
                  <Scale size={16} className="text-amber-500" />
                </div>
                <span className="text-sm font-semibold text-gray-800 dark:text-white">{t('Luxury Tax')}</span>
              </div>
              <span className="text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(current.luxuryTax)}</span>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-4">{t('Net Salary to BOps Ratio Trend')}</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={ratioData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="season" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => `${v}%`} domain={[25, 40]} />
                <Tooltip formatter={(value: number) => `${value}%`} contentStyle={{ borderRadius: '8px', fontSize: '12px', border: '1px solid #e5e7eb' }} />
                <Line type="monotone" dataKey="ratio" stroke="#ef4444" strokeWidth={2} dot={{ fill: '#ef4444', r: 4 }} name={t('Ratio')} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-4">{t('Season-over-Season Comparison')}</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-2 text-gray-500 dark:text-gray-400 font-medium">{t('Category')}</th>
                  {SEASONS_DATA.map(s => (
                    <th key={s.season} className={`text-right py-2 font-medium ${s.season === selectedSeason ? 'text-red-600' : 'text-gray-500 dark:text-gray-400'}`}>{s.season}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { label: t('Players'), values: SEASONS_DATA.map(s => s.players.total) },
                  { label: t('Coaches'), values: SEASONS_DATA.map(s => s.coaches.total) },
                  { label: t('Management'), values: SEASONS_DATA.map(s => s.management.total) },
                  { label: t('Staff'), values: SEASONS_DATA.map(s => s.staff.total) },
                  { label: t('A&R'), values: SEASONS_DATA.map(s => s.anr.total) },
                  { label: t('Luxury Tax'), values: SEASONS_DATA.map(s => s.luxuryTax) },
                ].map(row => (
                  <tr key={row.label} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-2 text-gray-700 dark:text-gray-300">{row.label}</td>
                    {row.values.map((val, i) => (
                      <td key={i} className={`text-right py-2 ${SEASONS_DATA[i].season === selectedSeason ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                        {formatCurrency(val)}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr className="border-t-2 border-gray-300 dark:border-gray-600">
                  <td className="py-2 font-bold text-gray-900 dark:text-white">{t('Total')}</td>
                  {SEASONS_DATA.map((s, i) => (
                    <td key={i} className={`text-right py-2 font-bold ${s.season === selectedSeason ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>
                      {formatCurrency(s.totalBops)}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
