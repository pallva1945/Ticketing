import React, { useState } from 'react';
import {
  Building2, CalendarDays, Euro, TrendingUp, AlertTriangle, CheckCircle2,
  Clock, Users, PartyPopper, Camera, GraduationCap, Trophy,
  ArrowRight, Shield, ChevronDown, ChevronUp,
  Landmark, MapPin, DollarSign,
  BarChart3, PieChart as PieChartIcon
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const formatCurrency = (val: number) => `€${val.toLocaleString('it-IT', { maximumFractionDigits: 0 })}`;

const VENUE_FINANCIALS = {
  budget: { revenue: 131182, costs: 122000 },
  actual: { revenue: 85485.36, costs: 122000 },
  note: 'The revenue gap vs. budget is non-operational. It is driven by the VSE €100k right-to-equity conversion, shifting value from the P&L to the Balance Sheet. Operationally, the department is performing as expected, with all costs tracking on-budget for the first half of the season.'
};

const MONTHLY_OCCUPANCY = [
  { month: 'Jul', days: 0, total: 31, events: [] },
  { month: 'Aug', days: 1, total: 31, events: [{ name: 'Birthday Party', type: 'private' }] },
  { month: 'Sep', days: 2, total: 30, events: [{ name: '2 Friendly Games (Bergamo, Reggio Emilia)', type: 'game' }] },
  { month: 'Oct', days: 5, total: 31, events: [
    { name: '2 Serie A Games', type: 'game' },
    { name: '2 Birthday Parties', type: 'private' },
    { name: '1 Video Production (Carlo Recalcati Movie)', type: 'production' }
  ]},
  { month: 'Nov', days: 2, total: 30, events: [{ name: '2 Serie A Home Games', type: 'game' }] },
  { month: 'Dec', days: 8, total: 31, events: [
    { name: '1 Serie A Home Game', type: 'game' },
    { name: '3 Christmas Dinners (OJM, BSN, PV)', type: 'corporate' },
    { name: '1 Christmas Party (Varese Calcio)', type: 'corporate' },
    { name: '1 University Career Day (Municipality)', type: 'community' },
    { name: '2 Days Preparation', type: 'setup' }
  ]}
];

const EVENT_TYPE_COLORS: Record<string, { bg: string; text: string; icon: any }> = {
  game: { bg: 'bg-red-50 dark:bg-red-900/30', text: 'text-red-700', icon: Trophy },
  private: { bg: 'bg-purple-50 dark:bg-purple-900/30', text: 'text-purple-700', icon: PartyPopper },
  production: { bg: 'bg-blue-50 dark:bg-blue-900/30', text: 'text-blue-700', icon: Camera },
  corporate: { bg: 'bg-amber-50 dark:bg-amber-900/30', text: 'text-amber-700', icon: Building2 },
  community: { bg: 'bg-green-50 dark:bg-green-900/30', text: 'text-green-700', icon: GraduationCap },
  setup: { bg: 'bg-gray-50 dark:bg-gray-800', text: 'text-gray-500 dark:text-gray-400', icon: Clock }
};

const PIPELINE = {
  revenue: [
    { name: 'Minibasket Tournament Finals', date: 'Feb 22', revenue: 1500, extra: '+ Cleaning costs', status: 'confirmed' as const },
    { name: 'U13 Tournament', date: 'May 30 – Jun 2', revenue: 4000, extra: '€1.000/day + Cleaning (4 days)', status: 'confirmed' as const },
    { name: 'Foresteria Rental (Trofeo Garbosi)', date: 'Apr', revenue: 1200, extra: '3 days, 12 kids + 2 coaches', status: 'confirmed' as const },
    { name: 'Foresteria Rental (U13 Tournament)', date: 'May/Jun', revenue: 1200, extra: '3 days, 12 kids + 2 coaches', status: 'confirmed' as const },
    { name: 'Municipality Payment (H2)', date: 'Jan – Jun 2026', revenue: 48000, extra: 'Equal to H1 contribution', status: 'confirmed' as const },
  ],
  community: [
    { name: 'School Cup Finals – Middle Schools', date: 'Mar 27', status: 'confirmed' as const },
    { name: 'School Cup Finals – High Schools', date: 'Apr 24', status: 'confirmed' as const },
    { name: 'Trofeo Giovani Leggende – Final', date: 'Apr 5', status: 'confirmed' as const },
    { name: 'Trofeo Garbosi – Final', date: 'Apr 6', status: 'confirmed' as const },
  ],
  unrealized: [
    { name: 'RAI Production (4-Day Event)', date: 'Apr (TBD)', revenue: null, status: 'pending' as const, note: 'Full arena buyout for concert. Offer submitted, awaiting response. Final follow-up by mid-February.' },
    { name: 'Music Video Production', date: 'Cancelled', revenue: 2000, status: 'cancelled' as const, note: 'Client paid €2,000 non-refundable deposit but chose not to proceed. Deposit retained.' },
    { name: 'Dancing Event (Campus)', date: 'N/A', revenue: null, status: 'lost' as const, note: 'Court measurement standards not met (roof height).' },
  ]
};

const COMPLIANCE_ITEMS = [
  { name: 'RSPP (Safety Manager)', status: 'active', description: 'Monthly fixed fee – legally required' },
  { name: 'ODV (Supervisory Body)', status: 'active', description: 'Monthly fixed fee – legally required' },
  { name: 'Visiting Fan Section Upgrade', status: 'completed', description: 'Replaced metal cage with glass barrier system. Engineering certifications obtained.' },
];

export const VenueOpsDashboard: React.FC = () => {
  const [expandedMonth, setExpandedMonth] = useState<string | null>('Dec');
  const [activeSection, setActiveSection] = useState<'overview' | 'pipeline'>('overview');

  const totalOccupiedDays = MONTHLY_OCCUPANCY.reduce((s, m) => s + m.days, 0);
  const totalDays = MONTHLY_OCCUPANCY.reduce((s, m) => s + m.total, 0);
  const occupancyRate = ((totalOccupiedDays / totalDays) * 100).toFixed(1);

  const totalPipelineRevenue = PIPELINE.revenue.reduce((s, e) => s + e.revenue, 0);
  const confirmedEvents = PIPELINE.revenue.length + PIPELINE.community.length;

  const eventTypeBreakdown = MONTHLY_OCCUPANCY.flatMap(m => m.events).reduce((acc, e) => {
    acc[e.type] = (acc[e.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(eventTypeBreakdown).map(([type, count]) => ({
    name: type.charAt(0).toUpperCase() + type.slice(1),
    value: count
  }));

  const PIE_COLORS = ['#ef4444', '#a855f7', '#3b82f6', '#f59e0b', '#22c55e', '#94a3b8'];

  const occupancyChartData = MONTHLY_OCCUPANCY.map(m => ({
    name: m.month,
    occupied: m.days,
    available: m.total - m.days
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Venue Operations</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Season 25-26 • H1 Report (Jul 1 – Dec 31, 2025)</p>
        </div>
        <div className="flex gap-2">
          {(['overview', 'pipeline'] as const).map(section => (
            <button
              key={section}
              onClick={() => setActiveSection(section)}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeSection === section
                  ? 'bg-slate-800 text-white shadow-md'
                  : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              {section === 'overview' ? 'Overview' : 'Event Pipeline'}
            </button>
          ))}
        </div>
      </div>

      {activeSection === 'overview' && (
        <>
          <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-6 text-white">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Total Revenue (YTD)</p>
                <p className="text-4xl font-bold">{formatCurrency(VENUE_FINANCIALS.actual.revenue)}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">H1 Actual (Jul – Dec 2025)</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Season Budget</p>
                <p className="text-4xl font-bold text-gray-300">{formatCurrency(262364)}</p>
                <div className="w-full bg-gray-700 h-2 rounded-full mt-3 overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full" style={{ width: `${(VENUE_FINANCIALS.actual.revenue / 262364 * 100).toFixed(1)}%` }}></div>
                </div>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">{(VENUE_FINANCIALS.actual.revenue / 262364 * 100).toFixed(1)}% of target</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">H2 Confirmed Pipeline</p>
                <p className="text-4xl font-bold text-green-400">{formatCurrency(totalPipelineRevenue)}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Projected Total: {formatCurrency(VENUE_FINANCIALS.actual.revenue + totalPipelineRevenue)}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Arena Occupancy</p>
                <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30"><CalendarDays size={18} className="text-blue-600" /></div>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{occupancyRate}%</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{totalOccupiedDays} / {totalDays} days used</p>
              <div className="w-full bg-gray-100 dark:bg-gray-800 h-2 rounded-full mt-3 overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${occupancyRate}%` }}></div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">H1 Budget</p>
                <div className="p-2 rounded-lg bg-green-50 dark:bg-green-900/30"><Euro size={18} className="text-green-600" /></div>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{formatCurrency(VENUE_FINANCIALS.budget.revenue)}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Revenue budget for H1</p>
              <div className="flex items-center gap-1 mt-2">
                <span className="text-xs font-medium text-amber-600 bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded">See note below</span>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Campus Status</p>
                <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/30"><MapPin size={18} className="text-emerald-600" /></div>
              </div>
              <p className="text-3xl font-bold text-green-600">Daily</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Fully operational</p>
              <div className="flex items-center gap-1 mt-2">
                <span className="text-xs font-medium text-green-600 bg-green-50 dark:bg-green-900/30 px-2 py-0.5 rounded flex items-center gap-1">
                  <CheckCircle2 size={10} /> Active
                </span>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle size={18} className="text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-amber-800 mb-1">Financial Note</p>
                <p className="text-xs text-amber-700 leading-relaxed">{VENUE_FINANCIALS.note}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
              <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100 uppercase tracking-wider mb-4 flex items-center gap-2">
                <BarChart3 size={16} className="text-blue-600" />
                Monthly Arena Usage
              </h3>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={occupancyChartData} margin={{ left: 0, right: 10, top: 5, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      formatter={(value: number, name: string) => [
                        `${value} days`,
                        name === 'occupied' ? 'Used' : 'Available'
                      ]}
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }}
                    />
                    <Bar dataKey="occupied" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} name="Used" />
                    <Bar dataKey="available" stackId="a" fill="#e5e7eb" radius={[4, 4, 0, 0]} name="Available" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
              <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100 uppercase tracking-wider mb-4 flex items-center gap-2">
                <PieChartIcon size={16} className="text-purple-600" />
                Event Type Breakdown
              </h3>
              <div className="h-[250px] flex items-center">
                <div className="w-1/2 h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        dataKey="value"
                        paddingAngle={3}
                      >
                        {pieData.map((_, idx) => (
                          <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number, name: string) => [`${value} events`, name]}
                        contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-1/2 space-y-2">
                  {pieData.map((entry, idx) => {
                    const typeKey = entry.name.toLowerCase();
                    const config = EVENT_TYPE_COLORS[typeKey] || EVENT_TYPE_COLORS.setup;
                    const Icon = config.icon;
                    return (
                      <div key={idx} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}></div>
                        <Icon size={12} className={config.text} />
                        <span className="text-xs text-gray-700 dark:text-gray-200">{entry.name}</span>
                        <span className="text-xs font-bold text-gray-900 dark:text-white ml-auto">{entry.value}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
            <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100 uppercase tracking-wider mb-4 flex items-center gap-2">
              <CalendarDays size={16} className="text-blue-600" />
              Monthly Event Detail
            </h3>
            <div className="space-y-2">
              {MONTHLY_OCCUPANCY.map(m => (
                <div key={m.month} className="border border-gray-100 dark:border-gray-800 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setExpandedMonth(expandedMonth === m.month ? null : m.month)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-gray-800 dark:text-gray-100 w-8">{m.month}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-100 dark:bg-gray-800 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${m.days > 0 ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-700'}`}
                            style={{ width: `${(m.days / m.total) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">{m.days}/{m.total} days</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-400 dark:text-gray-500">{m.events.length} event{m.events.length !== 1 ? 's' : ''}</span>
                      {expandedMonth === m.month ? <ChevronUp size={14} className="text-gray-400 dark:text-gray-500" /> : <ChevronDown size={14} className="text-gray-400 dark:text-gray-500" />}
                    </div>
                  </button>
                  {expandedMonth === m.month && m.events.length > 0 && (
                    <div className="px-4 pb-3 space-y-2 border-t border-gray-50">
                      {m.events.map((e, idx) => {
                        const config = EVENT_TYPE_COLORS[e.type] || EVENT_TYPE_COLORS.setup;
                        const Icon = config.icon;
                        return (
                          <div key={idx} className={`flex items-center gap-2 px-3 py-2 rounded-lg ${config.bg}`}>
                            <Icon size={14} className={config.text} />
                            <span className={`text-xs font-medium ${config.text}`}>{e.name}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {expandedMonth === m.month && m.events.length === 0 && (
                    <div className="px-4 pb-3 border-t border-gray-50">
                      <p className="text-xs text-gray-400 dark:text-gray-500 italic py-2">No events scheduled</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
            <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Shield size={16} className="text-green-600" />
              Compliance & Safety
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {COMPLIANCE_ITEMS.map((item, idx) => (
                <div key={idx} className={`p-4 rounded-lg border ${item.status === 'completed' ? 'border-green-200 bg-green-50 dark:bg-green-900/30' : 'border-blue-200 bg-blue-50 dark:bg-blue-900/30'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 size={14} className={item.status === 'completed' ? 'text-green-600' : 'text-blue-600'} />
                    <span className={`text-xs font-bold uppercase ${item.status === 'completed' ? 'text-green-700' : 'text-blue-700'}`}>
                      {item.status === 'completed' ? 'Completed' : 'Active'}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-1">{item.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {activeSection === 'pipeline' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm border-t-4 border-t-green-500">
              <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Confirmed Revenue</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(totalPipelineRevenue)}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{PIPELINE.revenue.length} revenue events</p>
            </div>
            <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm border-t-4 border-t-blue-500">
              <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Community Events</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{PIPELINE.community.length}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Zero cost to club (organizers cover expenses)</p>
            </div>
            <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm border-t-4 border-t-amber-500">
              <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Unrealized / Lost</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{PIPELINE.unrealized.length}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{formatCurrency(2000)} deposit retained</p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
            <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100 uppercase tracking-wider mb-4 flex items-center gap-2">
              <DollarSign size={16} className="text-green-600" />
              Revenue-Generating Events
            </h3>
            <div className="space-y-3">
              {PIPELINE.revenue.map((event, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-green-50/50 dark:bg-green-900/30 border border-green-100 rounded-lg hover:bg-green-50 dark:bg-green-900/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                      <Euro size={18} className="text-green-700" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{event.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{event.extra}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-700">{formatCurrency(event.revenue)}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{event.date}</p>
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between p-3 bg-green-100 dark:bg-green-900/20 rounded-lg border border-green-200">
                <span className="text-sm font-bold text-green-800">Total Confirmed Revenue</span>
                <span className="text-lg font-bold text-green-800">{formatCurrency(totalPipelineRevenue)}</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
            <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Users size={16} className="text-blue-600" />
              Community Events (Zero Net Cost)
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Organizers cover all operational expenses (cleaning, utilities, staff), ensuring zero loss for the club.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PIPELINE.community.map((event, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 bg-blue-50/50 dark:bg-blue-900/30 border border-blue-100 rounded-lg">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Trophy size={14} className="text-blue-700" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{event.name}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{event.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
            <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100 uppercase tracking-wider mb-4 flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-600" />
              Unrealized & Pending Opportunities
            </h3>
            <div className="space-y-3">
              {PIPELINE.unrealized.map((opp, idx) => {
                const statusColors = {
                  pending: { bg: 'bg-amber-50 dark:bg-amber-900/30', border: 'border-amber-200', text: 'text-amber-700', badge: 'bg-amber-100 dark:bg-amber-900/20 text-amber-800' },
                  cancelled: { bg: 'bg-red-50 dark:bg-red-900/30', border: 'border-red-200', text: 'text-red-700', badge: 'bg-red-100 dark:bg-red-900/20 text-red-800' },
                  lost: { bg: 'bg-gray-50 dark:bg-gray-800', border: 'border-gray-200 dark:border-gray-700', text: 'text-gray-600 dark:text-gray-400', badge: 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200' }
                };
                const colors = statusColors[opp.status];
                return (
                  <div key={idx} className={`p-4 ${colors.bg} border ${colors.border} rounded-lg`}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{opp.name}</p>
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${colors.badge}`}>
                          {opp.status}
                        </span>
                      </div>
                      {opp.revenue && (
                        <span className={`text-sm font-bold ${colors.text}`}>{formatCurrency(opp.revenue)}</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{opp.note}</p>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">{opp.date}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

    </div>
  );
};
