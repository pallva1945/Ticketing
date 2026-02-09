import React, { useState } from 'react';
import { Euro, Trophy, Flag, Activity, TrendingUp, CheckCircle2, Calendar, Target, Dumbbell } from 'lucide-react';

const formatCurrency = (val: number) => `€${val.toLocaleString('it-IT', { maximumFractionDigits: 0 })}`;

const SPONSORSHIP_DEALS = [
  { name: 'PRevcom', annual: 250000, h1: 125000 },
  { name: 'Elmec', annual: 70000, h1: 35000 },
  { name: 'BSN', annual: 24000, h1: 12000 },
  { name: 'VNC', annual: 12000, h1: 6000 },
  { name: 'C\'era Una Volta', annual: 10000, h1: 5000 },
  { name: 'Nippo Motors', annual: 3000, h1: 1500 },
  { name: 'Edil Domus', annual: 2000, h1: 1000 },
];

const SPONSORSHIP_H2_PIPELINE = [
  { name: 'Sports & Health (S&H)', annual: 25000, h2: 12500, note: '3-year solar contract – recovers H1 budget gap' },
];

const BOPS_BREAKDOWN = [
  { name: 'Parametri', h1: 46270, note: 'Fixed allocation' },
  { name: 'Buyouts (Elisée Assui)', h1: 40000, note: '4/10 months of €100k buyout' },
  { name: 'U23–U26', h1: 18539, note: '4/10 months' },
  { name: 'Annual Fee', h1: 12428, note: 'Fixed annual fee' },
];

const EBP_BREAKDOWN = [
  { name: 'YAP (Year Around Program)', h1: 32200, note: '4 players · €15k/year each', players: 4 },
  { name: 'EDBP (Elite Dev Basketball Program)', h1: 30001, note: '3 players · €20k/year each', players: 3 },
];

const GAMEDAY_DATA = {
  h1Revenue: 1082,
  homeGames: 5,
  avgPerGame: 200,
  league: 'Serie B',
};

const FINANCIALS = {
  gameday: { actual: 1082, budget: 1299 },
  sponsorship: { actual: 184975, budget: 190002 },
  bops: { actual: 117237, budget: 138000 },
  ebp: { actual: 62201, budget: 63865 },
};

const totalH1Actual = 366315;
const totalH1Budget = 395668;
const seasonBudget = totalH1Budget * 2;

type Section = 'overview' | 'sponsorship' | 'bops' | 'ebp';

export const VareseBasketballDashboard: React.FC = () => {
  const [activeSection, setActiveSection] = useState<Section>('overview');

  const sponsorshipGap = FINANCIALS.sponsorship.budget - FINANCIALS.sponsorship.actual;
  const h2SponsorshipRecovery = SPONSORSHIP_H2_PIPELINE.reduce((s, d) => s + d.h2, 0);
  const totalEbpPlayers = EBP_BREAKDOWN.reduce((s, p) => s + (p.players || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2.5 rounded-xl bg-teal-50">
          <Trophy size={22} className="text-teal-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Varese Basketball</h2>
          <p className="text-xs text-gray-500">Serie B Operations – Season 2025/26</p>
        </div>
      </div>

      <div className="flex gap-2 border-b border-gray-200 pb-1">
        {(['overview', 'sponsorship', 'bops', 'ebp'] as const).map(section => (
          <button key={section} onClick={() => setActiveSection(section)}
            className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors ${activeSection === section ? 'bg-teal-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
            {section === 'overview' ? 'Overview' : section === 'sponsorship' ? 'Sponsorship' : section === 'bops' ? 'BOps' : 'EBP'}
          </button>
        ))}
      </div>

      {activeSection === 'overview' && (
        <>
          <div className="bg-gradient-to-r from-teal-800 to-teal-900 rounded-xl p-6 text-white">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
              <div>
                <p className="text-[10px] font-bold text-teal-300 uppercase tracking-wider mb-1">Total Revenue (H1)</p>
                <p className="text-4xl font-bold">{formatCurrency(totalH1Actual)}</p>
                <p className="text-xs text-teal-300/70 mt-1">Jul – Dec 2025</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-teal-300 uppercase tracking-wider mb-1">H1 Budget</p>
                <p className="text-4xl font-bold text-teal-200">{formatCurrency(totalH1Budget)}</p>
                <div className="w-full bg-teal-700 h-2 rounded-full mt-3 overflow-hidden">
                  <div className="h-full bg-green-400 rounded-full" style={{ width: `${Math.min(100, totalH1Actual / totalH1Budget * 100).toFixed(1)}%` }}></div>
                </div>
                <p className="text-[10px] text-teal-400 mt-1">{(totalH1Actual / totalH1Budget * 100).toFixed(1)}% achieved</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-teal-300 uppercase tracking-wider mb-1">Season Budget</p>
                <p className="text-4xl font-bold text-teal-200">{formatCurrency(seasonBudget)}</p>
                <div className="w-full bg-teal-700 h-2 rounded-full mt-3 overflow-hidden">
                  <div className="h-full bg-green-400 rounded-full" style={{ width: `${(totalH1Actual / seasonBudget * 100).toFixed(1)}%` }}></div>
                </div>
                <p className="text-[10px] text-teal-400 mt-1">{(totalH1Actual / seasonBudget * 100).toFixed(1)}% of annual target</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-teal-300 uppercase tracking-wider mb-1">H1 Variance</p>
                <p className={`text-4xl font-bold ${totalH1Actual >= totalH1Budget ? 'text-green-400' : 'text-amber-400'}`}>
                  {totalH1Actual >= totalH1Budget ? '+' : ''}{formatCurrency(totalH1Actual - totalH1Budget)}
                </p>
                <p className="text-xs text-teal-300/70 mt-1">{totalH1Actual >= totalH1Budget ? 'Over budget' : 'Under budget – recoverable in H2'}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveSection('sponsorship')}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Sponsorship</p>
                <div className="p-2 rounded-lg bg-blue-50"><Flag size={18} className="text-blue-600" /></div>
              </div>
              <p className="text-3xl font-bold text-gray-900">{formatCurrency(FINANCIALS.sponsorship.actual)}</p>
              <p className="text-xs text-gray-400 mt-1">Budget: {formatCurrency(FINANCIALS.sponsorship.budget)}</p>
              <div className="w-full bg-gray-100 h-2 rounded-full mt-3 overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(FINANCIALS.sponsorship.actual / FINANCIALS.sponsorship.budget * 100).toFixed(0)}%` }}></div>
              </div>
              <div className="flex items-center gap-1 mt-2">
                <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                  Gap: {formatCurrency(sponsorshipGap)} – H2 recovery confirmed
                </span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveSection('bops')}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">BOps</p>
                <div className="p-2 rounded-lg bg-emerald-50"><Activity size={18} className="text-emerald-600" /></div>
              </div>
              <p className="text-3xl font-bold text-gray-900">{formatCurrency(FINANCIALS.bops.actual)}</p>
              <p className="text-xs text-gray-400 mt-1">Budget: {formatCurrency(FINANCIALS.bops.budget)}</p>
              <div className="w-full bg-gray-100 h-2 rounded-full mt-3 overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, FINANCIALS.bops.actual / FINANCIALS.bops.budget * 100).toFixed(0)}%` }}></div>
              </div>
              <div className="flex items-center gap-1 mt-2">
                <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded flex items-center gap-1">
                  <CheckCircle2 size={10} /> {(FINANCIALS.bops.actual / FINANCIALS.bops.budget * 100).toFixed(1)}% of budget
                </span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveSection('ebp')}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">EBP</p>
                <div className="p-2 rounded-lg bg-purple-50"><Dumbbell size={18} className="text-purple-600" /></div>
              </div>
              <p className="text-3xl font-bold text-gray-900">{formatCurrency(FINANCIALS.ebp.actual)}</p>
              <p className="text-xs text-gray-400 mt-1">{totalEbpPlayers} players enrolled</p>
              <div className="w-full bg-gray-100 h-2 rounded-full mt-3 overflow-hidden">
                <div className="h-full bg-purple-500 rounded-full" style={{ width: '100%' }}></div>
              </div>
              <div className="flex items-center gap-1 mt-2">
                <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-0.5 rounded flex items-center gap-1">
                  <CheckCircle2 size={10} /> 2 programs active
                </span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">GameDay (Serie B)</p>
                <div className="p-2 rounded-lg bg-indigo-50"><Calendar size={18} className="text-indigo-600" /></div>
              </div>
              <p className="text-3xl font-bold text-gray-900">{formatCurrency(GAMEDAY_DATA.h1Revenue)}</p>
              <p className="text-xs text-gray-400 mt-1">{GAMEDAY_DATA.homeGames} home games · ~€{GAMEDAY_DATA.avgPerGame}/game</p>
              <div className="flex items-center gap-1 mt-3">
                <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                  Ticketing only
                </span>
              </div>
            </div>
          </div>

          <div className="bg-teal-50 border border-teal-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <TrendingUp size={18} className="text-teal-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-teal-800">H2 Outlook</p>
                <p className="text-xs text-teal-700 mt-1">
                  The €{sponsorshipGap.toLocaleString('it-IT')} sponsorship gap will be recovered with the new Sports & Health (S&H) 3-year solar contract, 
                  bringing €{h2SponsorshipRecovery.toLocaleString('it-IT')} in H2. Additionally, the Finale Nazionali is backloaded into H2 — last season it generated €51.500, with potential to improve this year. BOps is tracking at {(FINANCIALS.bops.actual / FINANCIALS.bops.budget * 100).toFixed(1)}% of budget.
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {activeSection === 'sponsorship' && (
        <>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-bold text-gray-900">Sponsorship Portfolio – H1</p>
                <p className="text-xs text-gray-400">{SPONSORSHIP_DEALS.length} active sponsors</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(FINANCIALS.sponsorship.actual)}</p>
                <p className="text-xs text-gray-400">of {formatCurrency(FINANCIALS.sponsorship.budget)} budget</p>
              </div>
            </div>
            <div className="space-y-2">
              {SPONSORSHIP_DEALS.map((deal, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-blue-50/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{deal.name}</p>
                      <p className="text-xs text-gray-400">Annual: {formatCurrency(deal.annual)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">{formatCurrency(deal.h1)}</p>
                    <p className="text-[10px] text-gray-400">H1 recognized</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-200">
              <p className="text-xs font-semibold text-gray-500">H1 Total from listed sponsors</p>
              <p className="text-sm font-bold text-gray-900">{formatCurrency(SPONSORSHIP_DEALS.reduce((s, d) => s + d.h1, 0))}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <p className="text-sm font-bold text-gray-900 mb-3">H2 Pipeline – New Business</p>
            {SPONSORSHIP_H2_PIPELINE.map((deal, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-green-50/50 border border-green-100 rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle2 size={16} className="text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{deal.name}</p>
                    <p className="text-xs text-gray-500">{deal.note}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-green-700">{formatCurrency(deal.h2)}</p>
                  <p className="text-[10px] text-gray-400">Annual: {formatCurrency(deal.annual)}</p>
                </div>
              </div>
            ))}
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mt-3">
              <p className="text-xs text-blue-800">
                <span className="font-semibold">Budget recovery:</span> The H1 gap of {formatCurrency(sponsorshipGap)} vs budget will be fully covered by the S&H deal ({formatCurrency(h2SponsorshipRecovery)} in H2), resulting in a net surplus of {formatCurrency(h2SponsorshipRecovery - sponsorshipGap)} for the season.
              </p>
            </div>
          </div>
        </>
      )}

      {activeSection === 'bops' && (
        <>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-bold text-gray-900">Basketball Operations – H1 Breakdown</p>
                <p className="text-xs text-gray-400">Player acquisitions, allocations & fees</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(FINANCIALS.bops.actual)}</p>
                <p className="text-xs text-gray-400">of {formatCurrency(FINANCIALS.bops.budget)} budget</p>
              </div>
            </div>
            <div className="space-y-2">
              {BOPS_BREAKDOWN.map((item, idx) => {
                const pct = item.h1 / FINANCIALS.bops.actual * 100;
                return (
                  <div key={idx} className="p-3 bg-gray-50 rounded-lg hover:bg-emerald-50/50 transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{item.name}</p>
                        <p className="text-xs text-gray-400">{item.note}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-900">{formatCurrency(item.h1)}</p>
                        <p className="text-[10px] text-gray-400">{pct.toFixed(1)}% of total</p>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden mt-1">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-200">
              <p className="text-xs font-semibold text-gray-500">BOps H1 Total</p>
              <p className="text-sm font-bold text-gray-900">{formatCurrency(FINANCIALS.bops.actual)}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-3">Budget Status</p>
            <div className="flex items-center justify-center h-28">
              <div className="text-center">
                <p className="text-5xl font-bold text-emerald-600">{(FINANCIALS.bops.actual / FINANCIALS.bops.budget * 100).toFixed(1)}%</p>
                <p className="text-xs text-gray-400 mt-2">of H1 budget achieved</p>
                <div className="flex items-center gap-1 mt-3 justify-center">
                  <CheckCircle2 size={14} className="text-green-600" />
                  <span className="text-xs font-medium text-green-600">On target</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {activeSection === 'ebp' && (
        <>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-bold text-gray-900">Elite Basketball Program – H1</p>
                <p className="text-xs text-gray-400">Player development revenue across {totalEbpPlayers} enrolled players</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(FINANCIALS.ebp.actual)}</p>
                <p className="text-xs text-gray-400">H1 total</p>
              </div>
            </div>
            <div className="space-y-3">
              {EBP_BREAKDOWN.map((program, idx) => {
                const pct = program.h1 / FINANCIALS.ebp.actual * 100;
                return (
                  <div key={idx} className="p-4 bg-purple-50/50 border border-purple-100 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{program.name}</p>
                        <p className="text-xs text-gray-500">{program.note}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">{formatCurrency(program.h1)}</p>
                        <p className="text-[10px] text-gray-400">{pct.toFixed(1)}% of EBP revenue</p>
                      </div>
                    </div>
                    <div className="w-full bg-purple-100 h-2 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-500 rounded-full" style={{ width: `${pct}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 text-center">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Total Players</p>
              <p className="text-4xl font-bold text-purple-600">{totalEbpPlayers}</p>
              <p className="text-xs text-gray-400 mt-1">Enrolled in programs</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 text-center">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Avg Revenue / Player</p>
              <p className="text-4xl font-bold text-purple-600">{formatCurrency(Math.round(FINANCIALS.ebp.actual / totalEbpPlayers))}</p>
              <p className="text-xs text-gray-400 mt-1">H1 average</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 text-center">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Programs</p>
              <p className="text-4xl font-bold text-purple-600">{EBP_BREAKDOWN.length}</p>
              <p className="text-xs text-gray-400 mt-1">EDBP + YAP</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
