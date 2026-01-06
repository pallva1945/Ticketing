import React, { useState, useMemo, useEffect, useRef } from 'react';
import { LayoutDashboard, MessageSquare, Upload, Filter, X, Loader2, ArrowLeftRight, UserX, Cloud, Database, Settings, ExternalLink, Calendar, Briefcase, Calculator, Ticket, ShoppingBag, Landmark, Flag, Activity, GraduationCap, Construction, PieChart, TrendingUp, ArrowRight, Menu, Clock, ToggleLeft, ToggleRight, ChevronDown, Crown, Bell, Users, FileText, ShieldAlert } from 'lucide-react';
import { DashboardChart } from './components/DashboardChart';
import { StatsCards } from './components/StatsCards';
import { ZoneTable } from './components/ZoneTable';
import { ArenaMap } from './components/ArenaMap'; 
import { ChatInterface, AIAvatar } from './components/ChatInterface';
import { ComparisonView } from './components/ComparisonView';
import { Simulator } from './components/Simulator';
import { MultiSelect } from './components/MultiSelect';
import { PacingWidget } from './components/PacingWidget';
import { DistressedZones } from './components/DistressedZones';
import { CompKillerWidget } from './components/CompKillerWidget';
import { GameDayDashboard } from './components/GameDayDashboard';
import { MobileTicker, TickerItem } from './components/MobileTicker';
import { TEAM_NAME, GOOGLE_SHEET_CSV_URL, PV_LOGO_URL, FIXED_CAPACITY_25_26, SEASON_TARGET_TOTAL, SEASON_TARGET_GAMEDAY, SEASON_TARGET_GAMEDAY_TOTAL, SEASON_TARGET_TICKETING_DAY } from './constants';
import { GameData, GameDayData, DashboardStats, SalesChannel, TicketZone, KPIConfig, RevenueModule } from './types';
import { FALLBACK_CSV_CONTENT } from './data/csvData';
import { GAMEDAY_CSV_CONTENT } from './data/gameDayData';
import { processGameData, processGameDayData } from './utils/dataProcessor';
import { getCsvFromFirebase, saveCsvToFirebase } from './services/dbService';
import { isFirebaseConfigured } from './firebaseConfig';

const getDayName = (dateStr: string) => {
  const [day, month, year] = dateStr.split('/');
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  return date.toLocaleDateString('en-US', { weekday: 'short' });
};

// --- PLACEHOLDER MODULE VIEW ---
const PlaceholderView = ({ moduleName, icon: Icon }: { moduleName: string, icon: any }) => (
  <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] text-center p-8 animate-fade-in pt-6">
    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6 shadow-inner relative overflow-hidden">
        <Icon size={40} className="text-gray-400 relative z-10" />
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/50 to-transparent opacity-50"></div>
    </div>
    <h2 className="text-3xl font-bold text-gray-800 mb-2">{moduleName}</h2>
    <p className="text-gray-500 max-w-md mb-8">
      This revenue vertical is currently being integrated into the PV Revenue Center. 
      Data pipelines are under construction.
    </p>
    <div className="flex items-center gap-2 px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-full text-yellow-700 text-xs font-bold uppercase tracking-wider">
      <Construction size={14} />
      Module In Development
    </div>
  </div>
);

// --- REVENUE CENTER HOME ---
const RevenueHome = ({ 
    ticketingRevenue, 
    gameDayRevenue, 
    onAiClick,
    gamesPlayed,
    seasonFilter,
    onSeasonChange
}: { 
    modules: any[], 
    ticketingRevenue: number, 
    gameDayRevenue: number, 
    onNavigate: (id: RevenueModule) => void,
    onAiClick: () => void,
    gamesPlayed: number,
    seasonFilter: string,
    onSeasonChange: (s: string) => void
}) => {
    // Constants
    const TOTAL_GAMES_SEASON = 15;
    const gamesCount = Math.max(gamesPlayed, 1);

    // --- VERTICAL DATA CONFIGURATION ---
    // 'current' = YTD Actuals (Using FAKE values where requested)
    // 'target' = Budget (Specific values from 2025 Sales Budget)
    
    // Internal Projections for Pacing Widget (Still useful there)
    // const projTicketing = (ticketingRevenue / gamesCount) * TOTAL_GAMES_SEASON;
    // const projGameDay = (gameDayRevenue / gamesCount) * TOTAL_GAMES_SEASON;

    const verticalPerformance = [
      { 
          id: 'sponsorship', 
          name: 'Sponsorship', 
          current: 800000, // FAKE YTD
          target: 2098000, // Budget 2.098m
          icon: Flag, colorClass: 'text-blue-600', bgClass: 'bg-blue-50', barClass: 'bg-blue-500', isVariable: false 
      },
      { 
          id: 'ticketing', 
          name: 'Ticketing', 
          current: ticketingRevenue, // ACTUAL YTD
          target: 1650000, // Budget 1.65m
          icon: Ticket, colorClass: 'text-red-600', bgClass: 'bg-red-50', barClass: 'bg-red-500', isVariable: true 
      },
      { 
          id: 'gameday', 
          name: 'Game Day', 
          current: gameDayRevenue, // ACTUAL YTD
          target: 1218000, // Budget 1.218m
          icon: Calendar, colorClass: 'text-indigo-600', bgClass: 'bg-indigo-50', barClass: 'bg-indigo-500', isVariable: true 
      },
      { 
          id: 'sg', 
          name: 'Varese Basketball', 
          current: 500000, // FAKE YTD
          target: 930000, // Budget 930k
          icon: GraduationCap, colorClass: 'text-teal-600', bgClass: 'bg-teal-50', barClass: 'bg-teal-500', isVariable: false 
      },
      { 
          id: 'bops', 
          name: 'BOps', 
          current: 200000, // FAKE YTD
          target: 525000, // Budget 525k
          icon: Activity, colorClass: 'text-emerald-600', bgClass: 'bg-emerald-50', barClass: 'bg-emerald-500', isVariable: false 
      },
      { 
          id: 'venue_ops', 
          name: 'Venue Ops', 
          current: 100000, // FAKE YTD
          target: 258000, // Budget 258k
          icon: Landmark, colorClass: 'text-slate-600', bgClass: 'bg-slate-50', barClass: 'bg-slate-500', isVariable: false 
      },
      { 
          id: 'merchandising', 
          name: 'Merchandising', 
          current: 80000, // FAKE YTD
          target: 131000, // Budget 131k
          icon: ShoppingBag, colorClass: 'text-orange-600', bgClass: 'bg-orange-50', barClass: 'bg-orange-500', isVariable: false 
      },
      { 
          id: 'ebp', 
          name: 'EBP', 
          current: 20000, // FAKE YTD
          target: 41250, // Budget 41.25k
          icon: Briefcase, colorClass: 'text-pink-600', bgClass: 'bg-pink-50', barClass: 'bg-pink-500', isVariable: false 
      },
    ];

    // SORTED VERTICALS (Highest YTD Revenue First)
    const sortedVerticals = [...verticalPerformance].sort((a, b) => b.current - a.current);
    
    // Identify Best Vertical (by YTD volume)
    const bestVertical = sortedVerticals[0];

    // AGGREGATES
    const totalRevenueYTD = verticalPerformance.reduce((acc, v) => acc + v.current, 0);
    // Projecting sum of targets just for top level context
    const totalTarget = verticalPerformance.reduce((acc, v) => acc + v.target, 0);
    // Re-calculating projections based on new mix
    const totalRevenueProjected = verticalPerformance.reduce((acc, v) => {
        if(v.isVariable) {
             return acc + (v.current / gamesCount) * TOTAL_GAMES_SEASON;
        } else {
             // For static/fake verticals, assume linear or fixed? Let's just use target as placeholder if we don't have pacing
             // Actually, lets assume they are fixed contracts so YTD is what it is, maybe 80% collected?
             // To simplify pacing widget:
             return acc + v.target; 
        }
    }, 0);
    
    // PACING LOGIC
    const seasonProgressPct = (gamesPlayed / TOTAL_GAMES_SEASON) * 100; 
    const revenueProgressPct = (totalRevenueYTD / totalTarget) * 100;
    const pacingDelta = revenueProgressPct - seasonProgressPct;
    const isAhead = pacingDelta >= 0;
    const projectionDiff = totalRevenueProjected - totalTarget;

    // Run Rate (Variable Only)
    const variableYTD = verticalPerformance.filter(v => v.isVariable).reduce((acc, v) => acc + v.current, 0);
    const currentVariableRunRate = variableYTD / gamesCount;

    return (
        <div className="max-w-7xl mx-auto animate-fade-in space-y-8 pt-2 pb-12">
            
            {/* Top Bar: Title & Season Selector */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Executive Overview</h1>
                    <p className="text-gray-500 text-sm">Consolidated Budget Performance (YTD Actuals)</p>
                </div>
                
                {/* Season Filter - Only Filter Here */}
                <div className="relative">
                    <select 
                        value={seasonFilter}
                        onChange={(e) => onSeasonChange(e.target.value)}
                        className="appearance-none bg-white border border-gray-300 text-gray-700 py-2 pl-4 pr-10 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-red-500 shadow-sm cursor-pointer hover:bg-gray-50"
                    >
                        <option value="25-26">Season 25-26</option>
                        <option value="24-25">Season 24-25</option>
                        <option value="23-24">Season 23-24</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                        <ChevronDown size={16} />
                    </div>
                </div>
            </div>

            {/* AI Executive Summary - HIDDEN ON MOBILE */}
            <div className="hidden md:block relative bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white shadow-xl overflow-hidden border border-slate-700">
                <div className="absolute top-4 right-4 opacity-30">
                    <AIAvatar size="sm" />
                </div>
                <div className="relative z-10 flex flex-col md:flex-row gap-6 items-start md:items-center">
                    <div className="flex-1">
                        <h3 className="font-bold text-sm mb-2 flex items-center gap-2 text-slate-300 uppercase tracking-wide">
                            <MessageSquare size={16} /> Strategic Assessment
                        </h3>
                        <p className="text-white/90 text-lg font-medium leading-relaxed">
                            {isAhead 
                                ? `YTD pacing is strong (+${pacingDelta.toFixed(1)}% vs Time). Sponsorship & VB collections are front-loaded, securing cash flow. Forecast indicates we will land €${(projectionDiff/1000).toFixed(0)}k above budget.` 
                                : `Alert: YTD collections trail the seasonal timeline by ${Math.abs(pacingDelta).toFixed(1)}%. While fixed revenues (Spons/VB) are stable, variable streams need acceleration to close the projected gap.`
                            }
                        </p>
                    </div>
                    <button onClick={onAiClick} className="shrink-0 bg-white/10 backdrop-blur-md text-white px-5 py-3 rounded-xl text-sm font-bold hover:bg-white/20 transition-colors border border-white/20 flex items-center gap-2">
                        Full Analysis <ArrowRight size={16} />
                    </button>
                </div>
            </div>

            {/* MAIN PACE WIDGET (Stacked Bar) */}
            <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm relative overflow-hidden">
                <div className="flex justify-between items-end mb-6">
                    <div>
                        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Season Pacing (YTD Collected vs Budget)</h2>
                        <div className="flex items-baseline gap-3">
                            <span className="text-5xl font-extrabold text-gray-900">€{(totalRevenueYTD / 1000000).toFixed(2)}M</span>
                            <span className="text-lg text-gray-400 font-medium">/ €{(totalTarget / 1000000).toFixed(2)}M</span>
                        </div>
                    </div>
                    <div className={`text-right px-4 py-2 rounded-lg ${isAhead ? 'bg-green-50' : 'bg-red-50'}`}>
                        <p className={`text-xs font-bold uppercase ${isAhead ? 'text-green-600' : 'text-red-600'}`}>
                            {isAhead ? 'Ahead of Pace' : 'Behind Pace'}
                        </p>
                        <p className={`text-2xl font-bold ${isAhead ? 'text-green-700' : 'text-red-700'}`}>
                            {isAhead ? '+' : ''}{pacingDelta.toFixed(1)}%
                        </p>
                    </div>
                </div>

                {/* Stacked Progress Bar */}
                <div className="relative h-10 bg-gray-100 rounded-full overflow-hidden mb-3 flex border border-gray-200">
                    {/* Time Marker */}
                    <div 
                        className="absolute top-0 bottom-0 border-r-2 border-dashed border-gray-800 z-20 flex items-center justify-end pr-2 opacity-50"
                        style={{ width: `${seasonProgressPct}%` }}
                    >
                        <div className="bg-gray-800 text-white text-[10px] font-bold px-1.5 py-0.5 rounded absolute -bottom-6 transform translate-x-1/2">
                            Time: {seasonProgressPct.toFixed(0)}%
                        </div>
                    </div>

                    {/* Stacked Segments (YTD) */}
                    {sortedVerticals.map((v) => {
                        // Calculate width as percentage of TOTAL TARGET
                        const widthPct = (v.current / totalTarget) * 100;
                        const shareOfYTD = (v.current / totalRevenueYTD) * 100;
                        const contributionToTarget = (v.current / totalTarget) * 100;

                        if (widthPct <= 0) return null;
                        return (
                            <div 
                                key={v.id}
                                className={`h-full ${v.barClass} first:rounded-l-full last:rounded-r-full relative group transition-all duration-500 hover:brightness-110 cursor-help`}
                                style={{ width: `${widthPct}%` }}
                            >
                                {/* Enhanced Tooltip */}
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 bg-slate-900 text-white text-xs rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-200 z-50 min-w-[160px] pointer-events-none transform translate-y-1 group-hover:translate-y-0">
                                    <div className="p-3 border-b border-slate-700 font-bold bg-slate-950 rounded-t-lg flex justify-between items-center">
                                        <span>{v.name}</span>
                                        <v.icon size={12} className="text-slate-400" />
                                    </div>
                                    <div className="p-3 space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">YTD Revenue:</span>
                                            <span className="font-mono font-bold">€{(v.current/1000).toFixed(0)}k</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">Share of YTD:</span>
                                            <span className="font-mono text-blue-400">{shareOfYTD.toFixed(1)}%</span>
                                        </div>
                                        <div className="flex justify-between border-t border-slate-700 pt-2 mt-1">
                                            <span className="text-slate-400">vs Season Goal:</span>
                                            <span className="font-mono text-green-400">{contributionToTarget.toFixed(1)}%</span>
                                        </div>
                                    </div>
                                    {/* Arrow */}
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px w-0 h-0 border-x-8 border-x-transparent border-t-8 border-t-slate-900"></div>
                                </div>
                            </div>
                        );
                    })}
                </div>
                
                {/* Legend for Stacked Bar */}
                <div className="flex flex-wrap gap-4 justify-center mt-6">
                    {sortedVerticals.map((v) => (
                        <div key={v.id} className="flex items-center gap-1.5">
                            <div className={`w-3 h-3 rounded-full ${v.barClass}`}></div>
                            <span className="text-[10px] font-bold text-gray-600 uppercase">{v.name}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* STRATEGIC SIGNALS */}
            <div>
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Activity size={20} className="text-gray-500" /> Strategic Signals
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    
                    {/* Signal 1: Projected Finish */}
                    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex flex-col justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Flag size={18} className="text-blue-600" />
                                <span className="text-xs font-bold text-gray-500 uppercase">Projected Finish</span>
                            </div>
                            <p className="text-3xl font-bold text-gray-900">€{(totalRevenueProjected/1000000).toFixed(2)}M</p>
                            <p className={`text-sm font-medium mt-1 ${projectionDiff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {projectionDiff >= 0 ? 'Surplus' : 'Gap'}: €{(Math.abs(projectionDiff)/1000).toFixed(0)}k
                            </p>
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-500">
                            Forecast based on YTD run-rate + fixed contracts.
                        </div>
                    </div>

                    {/* Signal 2: Variable Efficiency */}
                    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex flex-col justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <TrendingUp size={18} className="text-purple-600" />
                                <span className="text-xs font-bold text-gray-500 uppercase">Variable Run Rate</span>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <p className="text-3xl font-bold text-gray-900">€{(currentVariableRunRate/1000).toFixed(1)}k</p>
                                <span className="text-sm text-gray-400">/ gm</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Ticketing + GameDay Avg</p>
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-100">
                            <div className="w-full bg-gray-100 h-1.5 rounded-full mt-2 overflow-hidden">
                                <div 
                                    className="h-full bg-purple-500" 
                                    style={{ width: `${Math.min((currentVariableRunRate/150000)*100, 100)}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>

                    {/* Signal 3: Top Revenue Driver (YTD) */}
                    <div className="bg-white border border-yellow-200 rounded-xl p-6 shadow-sm flex flex-col justify-between relative overflow-hidden">
                        <div className="absolute -right-6 -top-6 bg-yellow-50 w-24 h-24 rounded-full"></div>
                        <div>
                            <div className="flex items-center gap-2 mb-2 relative z-10">
                                <Crown size={18} className="text-yellow-600" />
                                <span className="text-xs font-bold text-yellow-700 uppercase">Top Driver (YTD)</span>
                            </div>
                            <p className="text-2xl font-bold text-gray-900 relative z-10">{bestVertical.name}</p>
                            <p className="text-3xl font-extrabold text-yellow-600 mt-1 relative z-10">
                                €{(bestVertical.current / 1000000).toFixed(2)}M
                            </p>
                        </div>
                        <div className="mt-4 pt-4 border-t border-yellow-100 relative z-10">
                            <p className="text-xs text-gray-500">
                                Contributes <span className="font-bold text-gray-700">{((bestVertical.current / totalRevenueYTD) * 100).toFixed(1)}%</span> of total YTD revenue.
                            </p>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

const SetupModal = ({ onClose }: { onClose: () => void }) => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden">
        <div className="bg-slate-900 p-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-red-600 p-2 rounded-lg">
              <Database className="text-white" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Connect Database</h2>
              <p className="text-slate-400 text-sm">Enable cloud storage for team collaboration</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>
        
        <div className="p-8 space-y-6">
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 font-bold flex items-center justify-center flex-shrink-0">1</div>
              <div>
                <h3 className="font-semibold text-gray-900">Create a Firebase Project</h3>
                <p className="text-sm text-gray-500 mt-1">Go to the <a href="https://console.firebase.google.com/" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1">Firebase Console <ExternalLink size={12}/></a>, create a project (e.g. "pv-sales"), and disable Analytics.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 font-bold flex items-center justify-center flex-shrink-0">2</div>
              <div>
                <h3 className="font-semibold text-gray-900">Create the Database</h3>
                <p className="text-sm text-gray-500 mt-1">
                  In the left sidebar, go to <strong>Build &gt; Firestore Database</strong>. Click "Create Database", choose a location (eur3), and select <strong>"Start in Test Mode"</strong>.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 font-bold flex items-center justify-center flex-shrink-0">3</div>
              <div>
                <h3 className="font-semibold text-gray-900">Get Config & Paste</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Click the <strong>Project Overview (Gear Icon)</strong> &gt; Project Settings. Scroll down to "Your apps", click the Web icon <code>&lt;/&gt;</code>, register app, and copy the <code>firebaseConfig</code> object.
                </p>
                <div className="mt-3 bg-slate-50 p-3 rounded-lg border border-slate-200 font-mono text-xs text-slate-600">
                  Paste it into <span className="font-bold text-slate-900">firebaseConfig.ts</span> in your project files.
                </div>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex gap-3">
            <Settings className="text-yellow-600 flex-shrink-0" size={20} />
            <p className="text-xs text-yellow-800">
              <strong>Tip:</strong> Without this setup, data uploads will only save to your browser's temporary memory or fail silently.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button 
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Continue Offline
            </button>
            <button 
              onClick={() => window.open('https://console.firebase.google.com/', '_blank')}
              className="px-4 py-2 text-sm font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
            >
              Open Console <ExternalLink size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const RulesErrorModal = ({ onClose }: { onClose: () => void }) => (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
      <div className="bg-orange-600 p-6 flex justify-between items-center">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <ShieldAlert size={24} />
          Database Access Denied
        </h2>
        <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
          <X size={24} />
        </button>
      </div>
      <div className="p-6">
        <div className="bg-orange-50 border-l-4 border-orange-500 p-4 mb-4">
          <p className="text-sm text-orange-800">
            <strong>Permission Blocked:</strong> Firebase is rejecting your request. This usually happens if "Test Mode" wasn't selected or has expired.
          </p>
        </div>
        
        <p className="text-sm font-bold text-gray-800 mb-2">How to unlock your database:</p>
        <ol className="list-decimal list-inside space-y-3 text-sm text-gray-600 mb-5">
          <li>Go to <a href="https://console.firebase.google.com/" target="_blank" className="text-blue-600 underline font-medium inline-flex items-center gap-1">Firebase Console <ExternalLink size={10}/></a> &gt; Firestore Database.</li>
          <li>Click the <strong>Rules</strong> tab at the top.</li>
          <li>Delete the existing code and paste the code below.</li>
          <li>Click <strong>Publish</strong>.</li>
        </ol>
        
        <div className="bg-slate-900 p-4 rounded-lg border border-slate-700 relative group">
          <code className="text-green-400 font-mono text-xs whitespace-pre">
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}`}
          </code>
        </div>
        
        <div className="mt-6 flex justify-end">
           <button 
              onClick={onClose}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-semibold hover:bg-orange-700 transition-colors"
           >
             I've Updated The Rules
           </button>
        </div>
      </div>
    </div>
  </div>
);

// --- NEW COMPONENT: Action Center (Smart Alerts) ---
const ActionCenter = ({ data }: { data: GameData[] }) => {
    // Logic to find critical alerts
    const alerts = useMemo(() => {
        const list: { type: 'critical'|'warning', msg: string, action: string }[] = [];
        
        // 1. Check last game occupancy
        if (data.length > 0) {
            const lastGame = data[data.length - 1]; // Assuming sorted elsewhere, or just take last in array
            const occ = lastGame.capacity > 0 ? (lastGame.attendance / lastGame.capacity) * 100 : 0;
            
            if (occ < 60) {
                list.push({ type: 'critical', msg: `Low occupancy (${occ.toFixed(0)}%) in last match vs ${lastGame.opponent}.`, action: 'Launch Promo' });
            }
        }

        // 2. Check Overall Yield Trend
        // Simple logic: if avg yield < 10 euro
        const avgYield = data.reduce((acc, g) => acc + (g.attendance>0 ? g.totalRevenue/g.attendance : 0), 0) / (data.length||1);
        if (avgYield < 12) {
             list.push({ type: 'warning', msg: `Average Yield is €${avgYield.toFixed(1)}, below target floor of €12.0.`, action: 'Review Pricing' });
        }

        return list;
    }, [data]);

    if (alerts.length === 0) return null;

    return (
        <div className="mb-6 bg-white border-l-4 border-red-500 rounded-r-xl shadow-sm p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-in slide-in-from-top-2">
            <div className="flex items-start gap-3">
                <div className="p-2 bg-red-100 rounded-full text-red-600">
                    <Bell size={20} />
                </div>
                <div>
                    <h3 className="font-bold text-gray-900 text-sm">Action Required</h3>
                    <div className="flex flex-col gap-1 mt-1">
                        {alerts.map((alert, idx) => (
                            <p key={idx} className="text-xs text-gray-600 flex items-center gap-2">
                                <span className={`w-1.5 h-1.5 rounded-full ${alert.type==='critical' ? 'bg-red-500' : 'bg-orange-400'}`}></span>
                                {alert.msg}
                            </p>
                        ))}
                    </div>
                </div>
            </div>
            <button className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap">
                Open Strategy Simulator
            </button>
        </div>
    );
};

const App: React.FC = () => {
  // Navigation State - Defaults to HOME
  const [activeModule, setActiveModule] = useState<RevenueModule>('home');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'comparison' | 'simulator' | 'chat'>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Data State
  const [data, setData] = useState<GameData[]>([]);
  const [gameDayData, setGameDayData] = useState<GameDayData[]>([]); 
  const [isLoadingData, setIsLoadingData] = useState(true);
  
  // Sources separated by vertical
  const [dataSources, setDataSources] = useState<Record<string, 'live' | 'cloud' | 'local'>>({
      ticketing: isFirebaseConfigured ? 'cloud' : 'local',
      gameday: isFirebaseConfigured ? 'cloud' : 'local'
  });
  
  const [lastUploadTimes, setLastUploadTimes] = useState<Record<string, string | null>>({ ticketing: null, gameday: null });
  const [isUploading, setIsUploading] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(!isFirebaseConfigured);
  const [showRulesError, setShowRulesError] = useState(false);
  
  // View Mode
  const [viewMode, setViewMode] = useState<'total' | 'gameday'>('gameday');
  const [gameDayIncludeTicketing, setGameDayIncludeTicketing] = useState(false);

  // KPI Configuration (Hardcoded)
  const [kpiConfig] = useState<KPIConfig>({
    arpgGrowth: 10,
    yieldGrowth: 10,
    revPasGrowth: 10,
    occupancyGrowth: 10,
    giveawayTarget: 10, 
    baselineMode: 'prev_season'
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Filters (Arrays for Multi-Select)
  const [selectedSeasons, setSelectedSeasons] = useState<string[]>(['25-26']);
  const [selectedLeagues, setSelectedLeagues] = useState<string[]>(['LBA']);
  const [selectedZones, setSelectedZones] = useState<string[]>(['All']);
  const [selectedOpponents, setSelectedOpponents] = useState<string[]>(['All']);
  const [selectedTiers, setSelectedTiers] = useState<string[]>(['All']);
  const [selectedDays, setSelectedDays] = useState<string[]>(['All']);
  
  // Strategy Filters
  const [ignoreOspiti, setIgnoreOspiti] = useState(false);

  // --- VERTICALS CONFIGURATION ---
  const MODULES: { id: RevenueModule; label: string; icon: any }[] = [
    { id: 'home', label: 'Executive Overview', icon: PieChart },
    { id: 'ticketing', label: 'Ticketing', icon: Ticket },
    { id: 'gameday', label: 'GameDay', icon: Calendar },
    { id: 'sponsorship', label: 'Sponsorship', icon: Flag },
    { id: 'merchandising', label: 'Merchandising', icon: ShoppingBag },
    { id: 'venue_ops', label: 'Venue Ops', icon: Landmark },
    { id: 'bops', label: 'BOps', icon: Activity },
    { id: 'sg', label: 'Varese Basketball', icon: GraduationCap },
  ];

  const loadData = async () => {
    setIsLoadingData(true);
    let loadedTicketing: GameData[] = [];
    let loadedGameDay: GameDayData[] = [];
    
    // 1. GAME DAY DATA LOADING
    try {
        let gdCsv = GAMEDAY_CSV_CONTENT;
        let gdSource: 'local' | 'cloud' = 'local';
        
        if (isFirebaseConfigured) {
            const cloudGd = await getCsvFromFirebase('gameday');
            if (cloudGd) {
                gdCsv = cloudGd.content;
                setLastUploadTimes(prev => ({...prev, gameday: cloudGd.updatedAt}));
                gdSource = 'cloud';
            }
        }
        loadedGameDay = processGameDayData(gdCsv);
        setDataSources(prev => ({...prev, gameday: gdSource}));
    } catch(e) {
        console.error("Error loading GameDay data", e);
        loadedGameDay = processGameDayData(GAMEDAY_CSV_CONTENT);
        setDataSources(prev => ({...prev, gameday: 'local'}));
    }
    setGameDayData(loadedGameDay);

    // 2. TICKETING DATA LOADING
    try {
      if (isFirebaseConfigured) {
        try {
          const cloudData = await getCsvFromFirebase('ticketing');
          if (cloudData) {
            loadedTicketing = processGameData(cloudData.content);
            if (loadedTicketing.length > 0) {
              setData(loadedTicketing);
              setLastUploadTimes(prev => ({...prev, ticketing: cloudData.updatedAt}));
              setDataSources(prev => ({...prev, ticketing: 'cloud'})); 
              setIsLoadingData(false);
              return; 
            }
          }
        } catch (dbError: any) {
          if (dbError.message === 'permission-denied') setShowRulesError(true);
        }
      }

      if (GOOGLE_SHEET_CSV_URL) {
        try {
          const cacheBuster = `&t=${Date.now()}`;
          const response = await fetch(GOOGLE_SHEET_CSV_URL + cacheBuster);
          if (response.ok) {
            const csvText = await response.text();
            loadedTicketing = processGameData(csvText);
            if (loadedTicketing.length > 0) {
                setData(loadedTicketing);
                setDataSources(prev => ({...prev, ticketing: 'live'}));
                setIsLoadingData(false);
                return;
            }
          }
        } catch (directError) {
          console.warn("Direct fetch failed", directError);
        }
      }

      if (loadedTicketing.length === 0) {
        loadedTicketing = processGameData(FALLBACK_CSV_CONTENT);
        setData(loadedTicketing);
        setDataSources(prev => ({...prev, ticketing: 'local'}));
      }

    } catch (error) {
      console.error("Critical error processing data:", error);
      setData(processGameData(FALLBACK_CSV_CONTENT));
      setDataSources(prev => ({...prev, ticketing: 'local'}));
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!isFirebaseConfigured) {
        alert("Cannot upload: Database is not connected.");
        setShowSetupModal(true);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
    }

    // Determine target based on active module
    const targetDataset = activeModule === 'gameday' ? 'gameday' : 'ticketing';

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      if (text) {
        try {
          // Validate Processing
          let isValid = false;
          if (targetDataset === 'ticketing') {
              const testData = processGameData(text);
              isValid = testData.length > 0;
              if (isValid) setData(testData);
          } else {
              const testData = processGameDayData(text);
              isValid = testData.length > 0;
              if (isValid) setGameDayData(testData);
          }

          if (isValid) {
            try {
              // Upload to separate database path based on dataset
              await saveCsvToFirebase(text, targetDataset);
              const now = new Date().toISOString();
              
              // UPDATE STATE IMMEDIATELY
              setLastUploadTimes(prev => ({...prev, [targetDataset]: now}));
              setDataSources(prev => ({...prev, [targetDataset]: 'cloud'}));
              
              alert(`Success! ${targetDataset.toUpperCase()} data updated in cloud.`);
            } catch (dbError: any) {
              if (dbError.message === 'permission-denied') setShowRulesError(true);
              else alert("Database Error: " + dbError.message);
            }
          } else {
            alert("Error: The CSV file format seems invalid for this module.");
          }
        } catch (error) {
          alert("Failed to upload data.");
        } finally {
          setIsUploading(false);
          // Reset input in finally block to ensure it's cleared even if errors occur
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      }
    };
    reader.readAsText(file);
  };

  const triggerFileUpload = () => {
    if (!isFirebaseConfigured) { setShowSetupModal(true); return; }
    if (activeModule === 'home') return; // Disable for home
    // Removed window.confirm for smoother UX
    if (fileInputRef.current) {
        fileInputRef.current.click();
    } else {
        alert("Upload interface error. Please refresh.");
    }
  };

  // --- Filtering & Logic ---

  const getFilteredGames = () => {
    return data.filter(d => {
      const matchSeason = selectedSeasons.includes('All') || selectedSeasons.includes(d.season);
      const matchLeague = selectedLeagues.includes('All') || selectedLeagues.includes(d.league);
      const matchOpponent = selectedOpponents.includes('All') || selectedOpponents.includes(d.opponent);
      const matchTier = selectedTiers.includes('All') || selectedTiers.includes(String(d.tier));
      const matchDay = selectedDays.includes('All') || selectedDays.includes(getDayName(d.date));
      return matchSeason && matchLeague && matchOpponent && matchTier && matchDay;
    });
  };

  const filteredGames = useMemo(() => getFilteredGames(), [data, selectedSeasons, selectedLeagues, selectedOpponents, selectedTiers, selectedDays]);

  // NEW: Total View Data (Independent of viewMode) for Executive Overview
  const totalViewData = useMemo(() => {
    return filteredGames.map(game => {
      let zoneSales = game.salesBreakdown;

      if (ignoreOspiti) zoneSales = zoneSales.filter(s => s.zone !== TicketZone.OSPITI);
      if (!selectedZones.includes('All')) zoneSales = zoneSales.filter(s => selectedZones.includes(s.zone));

      // No channel filtering (Total View)
      
      const zoneRevenue = zoneSales.reduce((acc, curr) => acc + curr.revenue, 0);
      const zoneAttendance = zoneSales.reduce((acc, curr) => acc + curr.quantity, 0);

      let zoneCapacity = 0;
      let filteredZoneCapacities = { ...game.zoneCapacities };
      if (ignoreOspiti) delete filteredZoneCapacities[TicketZone.OSPITI];
      
      if (!selectedZones.includes('All')) {
          const newCapMap: Record<string, number> = {};
          Object.keys(filteredZoneCapacities).forEach(z => {
              if (selectedZones.includes(z)) newCapMap[z] = filteredZoneCapacities[z];
          });
          filteredZoneCapacities = newCapMap;
      }

      // No fixed deduction (Total View)

      Object.values(filteredZoneCapacities).forEach((cap) => { zoneCapacity += (cap as number); });

      return {
        ...game,
        attendance: zoneAttendance,
        totalRevenue: zoneRevenue,
        capacity: zoneCapacity,
        salesBreakdown: zoneSales,
        zoneCapacities: filteredZoneCapacities
      };
    });
  }, [filteredGames, selectedZones, ignoreOspiti]);

  const totalStats = useMemo(() => {
      const totalRevenue = totalViewData.reduce((sum, game) => sum + game.totalRevenue, 0);
      return { totalRevenue };
  }, [totalViewData]);

  const viewData = useMemo(() => {
    return filteredGames.map(game => {
      let zoneSales = game.salesBreakdown;

      if (ignoreOspiti) zoneSales = zoneSales.filter(s => s.zone !== TicketZone.OSPITI);
      if (!selectedZones.includes('All')) zoneSales = zoneSales.filter(s => selectedZones.includes(s.zone));

      if (viewMode === 'gameday') {
          zoneSales = zoneSales.filter(s => 
              [SalesChannel.TIX, SalesChannel.MP, SalesChannel.VB, SalesChannel.GIVEAWAY].includes(s.channel)
          );
      }
      
      const zoneRevenue = zoneSales.reduce((acc, curr) => acc + curr.revenue, 0);
      const zoneAttendance = zoneSales.reduce((acc, curr) => acc + curr.quantity, 0);

      let zoneCapacity = 0;
      let filteredZoneCapacities = { ...game.zoneCapacities };
      if (ignoreOspiti) delete filteredZoneCapacities[TicketZone.OSPITI];
      
      if (!selectedZones.includes('All')) {
          const newCapMap: Record<string, number> = {};
          Object.keys(filteredZoneCapacities).forEach(z => {
              if (selectedZones.includes(z)) newCapMap[z] = filteredZoneCapacities[z];
          });
          filteredZoneCapacities = newCapMap;
      }

      if (viewMode === 'gameday') {
          Object.keys(filteredZoneCapacities).forEach(z => {
              const fixedDeduction = FIXED_CAPACITY_25_26[z] || 0;
              filteredZoneCapacities[z] = Math.max(0, filteredZoneCapacities[z] - fixedDeduction);
          });
      }

      Object.values(filteredZoneCapacities).forEach((cap) => { zoneCapacity += (cap as number); });

      return {
        ...game,
        attendance: zoneAttendance,
        totalRevenue: zoneRevenue,
        capacity: zoneCapacity,
        salesBreakdown: zoneSales,
        zoneCapacities: filteredZoneCapacities
      };
    });
  }, [filteredGames, selectedZones, ignoreOspiti, viewMode]);

  // GameDay Data Filtering
  const filteredGameDayData = useMemo(() => {
      return gameDayData.filter(d => {
          const matchSeason = selectedSeasons.includes('All') || selectedSeasons.includes(d.season);
          const matchLeague = selectedLeagues.includes('All') || selectedLeagues.includes(d.league);
          const matchOpponent = selectedOpponents.includes('All') || selectedOpponents.includes(d.opponent);
          const matchDay = selectedDays.includes('All') || selectedDays.includes(getDayName(d.date));
          
          // Filter by Tier (Indirectly using main data)
          let matchTier = true;
          if (!selectedTiers.includes('All')) {
              // Find the matching game in the main dataset to get the tier
              const matchingGame = data.find(g => g.season === d.season && g.opponent === d.opponent);
              if (matchingGame) {
                  matchTier = selectedTiers.includes(String(matchingGame.tier));
              } else {
                  matchTier = true; 
              }
          }

          return matchSeason && matchLeague && matchOpponent && matchDay && matchTier;
      });
  }, [gameDayData, data, selectedSeasons, selectedLeagues, selectedOpponents, selectedDays, selectedTiers]);

  const efficiencyData = useMemo(() => {
    return filteredGames.map(game => {
      let zoneSales = game.salesBreakdown.filter(s => 
          [SalesChannel.TIX, SalesChannel.MP, SalesChannel.VB, SalesChannel.GIVEAWAY].includes(s.channel)
      );

      if (ignoreOspiti) zoneSales = zoneSales.filter(s => s.zone !== TicketZone.OSPITI);
      if (!selectedZones.includes('All')) zoneSales = zoneSales.filter(s => selectedZones.includes(s.zone));

      const zoneRevenue = zoneSales.reduce((acc, curr) => acc + curr.revenue, 0);
      const zoneAttendance = zoneSales.reduce((acc, curr) => acc + curr.quantity, 0);

      let zoneCapacity = 0;
      let filteredZoneCapacities = { ...game.zoneCapacities };
      if (ignoreOspiti) delete filteredZoneCapacities[TicketZone.OSPITI];
      
      if (!selectedZones.includes('All')) {
          const newCapMap: Record<string, number> = {};
          Object.keys(filteredZoneCapacities).forEach(z => {
              if (selectedZones.includes(z)) newCapMap[z] = filteredZoneCapacities[z];
          });
          filteredZoneCapacities = newCapMap;
      }

      Object.keys(filteredZoneCapacities).forEach(z => {
          const fixedDeduction = FIXED_CAPACITY_25_26[z] || 0;
          filteredZoneCapacities[z] = Math.max(0, filteredZoneCapacities[z] - fixedDeduction);
      });

      Object.values(filteredZoneCapacities).forEach((cap) => { zoneCapacity += (cap as number); });

      return {
        ...game,
        attendance: zoneAttendance,
        totalRevenue: zoneRevenue,
        capacity: zoneCapacity,
        salesBreakdown: zoneSales,
        zoneCapacities: filteredZoneCapacities
      };
    });
  }, [filteredGames, selectedZones, ignoreOspiti]);

  const stats: DashboardStats = useMemo(() => {
    const totalRevenue = viewData.reduce((sum, game) => sum + game.totalRevenue, 0);
    const totalAttendance = viewData.reduce((sum, game) => sum + game.attendance, 0);
    const totalCapacity = viewData.reduce((sum, game) => sum + game.capacity, 0);
    const avgAttendance = viewData.length > 0 ? totalAttendance / viewData.length : 0;
    
    const totalGiveaways = viewData.reduce((sum, game) => {
       const ga = game.salesBreakdown.filter(s => 
           s.channel === SalesChannel.GIVEAWAY || s.channel === SalesChannel.PROTOCOL
       );
       return sum + ga.reduce((acc, curr) => acc + curr.quantity, 0);
    }, 0);

    const giveawayRate = totalAttendance > 0 ? (totalGiveaways / totalAttendance) * 100 : 0;
    
    const zoneCounts: Record<string, number> = {};
    viewData.forEach(game => {
      game.salesBreakdown.forEach(pt => {
        zoneCounts[pt.zone] = (zoneCounts[pt.zone] || 0) + pt.quantity;
      });
    });
    
    const topZone = Object.entries(zoneCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
    const occupancyRate = totalCapacity > 0 ? (totalAttendance / totalCapacity) * 100 : 0;

    return { totalRevenue, avgAttendance, topPerformingZone: topZone, occupancyRate, giveawayRate };
  }, [viewData]);

  // Aggregate Game Day Revenue (For Home Screen Card - Total Revenue MINUS Ticketing)
  // This matches the user's request for "bring all game day revenue minus tix"
  const gameDayRevenueNet = useMemo(() => {
      return filteredGameDayData.reduce((acc, game) => {
          // Total Revenue - Ticketing Revenue = (Merch + F&B + Hosp + Park + Exp + Spons + TV)
          return acc + (game.totalRevenue - game.tixRevenue);
      }, 0);
  }, [filteredGameDayData]);

  // Filtered Game Day Revenue for PACING WIDGET in GameDay Module
  // STRICTLY follows the "Budget is 3.3M (Full) or 1.65M (Net minus Tix)" rule.
  const filteredGameDayRevForPacing = useMemo(() => {
      return filteredGameDayData.reduce((acc, game) => {
          // If Toggle ON: Everything (Total Revenue from CSV includes Tix+Spons+TV+Variable)
          if (gameDayIncludeTicketing) {
              return acc + game.totalRevenue; 
          } 
          // If Toggle OFF: Everything MINUS Ticketing
          else {
              return acc + (game.totalRevenue - game.tixRevenue);
          }
      }, 0);
  }, [filteredGameDayData, gameDayIncludeTicketing]);

  const getAvailableOptions = (targetField: 'season' | 'league' | 'opponent' | 'tier' | 'day' | 'zone') => {
      const filtered = data.filter(d => {
        const matchSeason = targetField === 'season' || selectedSeasons.includes('All') || selectedSeasons.includes(d.season);
        const matchLeague = targetField === 'league' || selectedLeagues.includes('All') || selectedLeagues.includes(d.league);
        const matchOpponent = targetField === 'opponent' || selectedOpponents.includes('All') || selectedOpponents.includes(d.opponent);
        const matchTier = targetField === 'tier' || selectedTiers.includes('All') || selectedTiers.includes(String(d.tier));
        const matchDay = targetField === 'day' || selectedDays.includes('All') || selectedDays.includes(getDayName(d.date));
        return matchSeason && matchLeague && matchOpponent && matchTier && matchDay;
      });

      const unique = new Set<string>();
      filtered.forEach(d => {
          if (targetField === 'season') unique.add(d.season);
          if (targetField === 'league') unique.add(d.league);
          if (targetField === 'opponent') unique.add(d.opponent);
          if (targetField === 'tier') unique.add(String(d.tier));
          if (targetField === 'day') unique.add(getDayName(d.date));
          if (targetField === 'zone') d.salesBreakdown.forEach(s => unique.add(s.zone));
      });

      const arr = Array.from(unique);
      if (targetField === 'season') return arr.sort().reverse();
      if (targetField === 'tier') return arr.sort((a,b) => Number(a)-Number(b));
      if (targetField === 'day') {
          const order = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
          return arr.sort((a,b) => order.indexOf(a) - order.indexOf(b));
      }
      return arr.sort();
  };

  const seasons = useMemo(() => getAvailableOptions('season'), [data, selectedLeagues, selectedOpponents, selectedTiers, selectedDays]);
  const leagues = useMemo(() => getAvailableOptions('league'), [data, selectedSeasons, selectedOpponents, selectedTiers, selectedDays]);
  const opponents = useMemo(() => getAvailableOptions('opponent'), [data, selectedSeasons, selectedLeagues, selectedTiers, selectedDays]);
  const tiers = useMemo(() => getAvailableOptions('tier'), [data, selectedSeasons, selectedLeagues, selectedOpponents, selectedDays]);
  const days = useMemo(() => getAvailableOptions('day'), [data, selectedSeasons, selectedLeagues, selectedOpponents, selectedTiers]);
  const zones = useMemo(() => getAvailableOptions('zone'), [data, selectedSeasons, selectedLeagues, selectedOpponents, selectedTiers, selectedDays]);

  const aiContext = useMemo(() => {
    if (activeModule === 'home') {
        const totalLiveTix = totalStats.totalRevenue; // Uses total stats (unaffected by viewMode)
        const totalLiveGD = filteredGameDayRevForPacing; // Uses filtered data
        
        // Pass the actual YTD data to the AI for accurate context
        return JSON.stringify({
            context_filter: { seasons: selectedSeasons, leagues: selectedLeagues },
            view_mode: 'HOME_OVERVIEW',
            totals: {
                ticketingRevenue: totalLiveTix,
                gameDayRevenue: totalLiveGD,
                sponsorshipRevenue: 800000,
                vareseBasketballRevenue: 550000,
                merchRevenue: 90000,
                gamesCount: viewData.length
            }
        });
    }

    if (activeModule === 'gameday') {
        const totalNet = filteredGameDayData.reduce((acc, g) => acc + (g.totalRevenue - g.tixRevenue), 0);
        const totalMerch = filteredGameDayData.reduce((acc, g) => acc + g.merchRevenue, 0);
        const totalFb = filteredGameDayData.reduce((acc, g) => acc + g.fbRevenue, 0);
        const totalAtt = filteredGameDayData.reduce((acc, g) => acc + g.attendance, 0);
        const sph = totalAtt > 0 ? totalNet / totalAtt : 0;

        return JSON.stringify({
            context_filter: { seasons: selectedSeasons, leagues: selectedLeagues },
            view_mode: 'GAMEDAY_ANCILLARY',
            totals: {
                totalRevenue: totalNet,
                merchRevenue: totalMerch,
                fbRevenue: totalFb,
                sph: sph,
                attendance: totalAtt
            },
            games_in_view: filteredGameDayData.length
        });
    }

    return JSON.stringify({
      context_filter: { seasons: selectedSeasons, leagues: selectedLeagues, zones: selectedZones },
      view_mode: viewMode,
      totals: stats,
      games_in_view: viewData.length
    });
  }, [viewData, stats, selectedSeasons, selectedLeagues, selectedZones, viewMode, activeModule, filteredGameDayData, filteredGameDayRevForPacing, totalStats]);

  const lastGame = useMemo(() => {
    if (data.length === 0) return null;
    const sorted = [...data].sort((a, b) => {
         const [da, ma, ya] = a.date.split('/').map(Number);
         const [db, mb, yb] = b.date.split('/').map(Number);
         return new Date(yb, mb-1, db).getTime() - new Date(ya, ma-1, da).getTime();
    });
    return sorted[0];
  }, [data]);

  const clearFilters = () => {
    setSelectedSeasons(['25-26']);
    setSelectedLeagues(['LBA']);
    setSelectedZones(['All']);
    setSelectedOpponents(['All']);
    setSelectedTiers(['All']);
    setSelectedDays(['All']);
    setIgnoreOspiti(false);
  };

  const handleChartFilterChange = (type: 'opponent' | 'tier' | 'day', value: string) => {
    if (!value) return;
    if (type === 'opponent') setSelectedOpponents(selectedOpponents.includes(value) && selectedOpponents.length === 1 ? ['All'] : [value]);
    if (type === 'tier') setSelectedTiers(selectedTiers.includes(value) && selectedTiers.length === 1 ? ['All'] : [value]);
    if (type === 'day') setSelectedDays(selectedDays.includes(value) && selectedDays.length === 1 ? ['All'] : [value]);
  };

  const handleZoneClick = (zone: string) => {
     setSelectedZones(selectedZones.includes(zone) && selectedZones.length === 1 ? ['All'] : [zone]);
  };

  const allSeasons = useMemo(() => Array.from(new Set(data.map(d => d.season))).sort().reverse(), [data]);
  const allLeagues = useMemo(() => Array.from(new Set(data.map(d => d.league))).sort(), [data]);
  const allOpponents = useMemo(() => Array.from(new Set(data.map(d => d.opponent))).sort(), [data]);
  const allTiers = useMemo(() => Array.from(new Set(data.map(d => d.tier))).filter((t: any) => t > 0).map(String).sort((a,b)=>Number(a)-Number(b)), [data]);
  const allZones = useMemo(() => {
     const z = new Set<string>();
     data.forEach(g => g.salesBreakdown.forEach(s => z.add(s.zone)));
     return Array.from(z).sort();
  }, [data]);

  const FilterBar = () => (
    <div className="mb-6 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-gray-500">
            <Filter size={18} />
            <span className="text-sm font-medium">Data Filters</span>
        </div>
        <div className="flex items-center gap-3">
            {activeModule === 'ticketing' && (
                <button onClick={() => setIgnoreOspiti(!ignoreOspiti)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${ignoreOspiti ? 'bg-red-50 text-red-700 border-red-200' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}>
                    <UserX size={14} /> {ignoreOspiti ? 'Zona Ospiti Excluded' : 'Ignore Zona Ospiti'}
                </button>
            )}
            {(selectedSeasons.length > 1 || !selectedSeasons.includes('25-26') || !selectedLeagues.includes('LBA') || !selectedZones.includes('All') || !selectedOpponents.includes('All') || !selectedTiers.includes('All') || !selectedDays.includes('All') || ignoreOspiti) && (
                <button onClick={clearFilters} className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-red-700 transition-colors ml-2">
                    <X size={14} /> Clear All
                </button>
            )}
        </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <div><MultiSelect label="Season" options={seasons} selected={selectedSeasons} onChange={setSelectedSeasons} /></div>
        <div><MultiSelect label="League" options={leagues} selected={selectedLeagues} onChange={setSelectedLeagues} /></div>
        <div><MultiSelect label="Tier" options={tiers} selected={selectedTiers} onChange={setSelectedTiers} /></div>
        <div><MultiSelect label="Opponent" options={opponents} selected={selectedOpponents} onChange={setSelectedOpponents} /></div>
        <div><MultiSelect label="Day" options={days} selected={selectedDays} onChange={setSelectedDays} /></div>
        {activeModule === 'ticketing' && (
            <div><MultiSelect label="Zone" options={zones} selected={selectedZones} onChange={setSelectedZones} /></div>
        )}
        </div>
    </div>
  );

  // --- COMPREHENSIVE TICKER ITEMS ---
  const tickerItems: TickerItem[] = useMemo(() => [
    { label: "TICKET", value: `€${(stats.totalRevenue/1000).toFixed(0)}k`, icon: Ticket, color: "text-red-400" },
    { label: "AVG ATT", value: stats.avgAttendance.toFixed(0), icon: Users, color: "text-red-200" },
    { label: "SPONSOR", value: "€800k", icon: Flag, color: "text-blue-400" },
    { label: "GAMEDAY", value: `€${(gameDayRevenueNet/1000).toFixed(0)}k`, icon: Calendar, color: "text-indigo-400" },
    { label: "MERCH", value: "€90k", icon: ShoppingBag, color: "text-orange-400" },
    { label: "VARESE BSK", value: "€550k", icon: GraduationCap, color: "text-teal-400" },
    { label: "VENUE", value: "€100k", icon: Landmark, color: "text-slate-400" },
    { label: "BOPS", value: "€100k", icon: Activity, color: "text-emerald-400" },
  ], [stats, gameDayRevenueNet]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row relative">
      {showSetupModal && <SetupModal onClose={() => setShowSetupModal(false)} />}
      {showRulesError && <RulesErrorModal onClose={() => { setShowRulesError(false); window.location.reload(); }} />}
      
      {/* Top Navigation */}
      <div className="fixed top-0 left-0 w-full bg-white border-b border-gray-200 h-16 z-50 px-6 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4 w-full md:w-auto">
             <button className="md:hidden text-gray-600 hover:bg-gray-100 p-2 rounded-lg" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                <Menu size={24} />
             </button>
             <div className="w-8 h-8 flex-shrink-0">
               <img src={PV_LOGO_URL} alt="PV" className="w-full h-full object-contain" />
             </div>
             
             {/* Integrated Mobile Ticker (Hidden on Desktop) */}
             {!isLoadingData && (
                <MobileTicker items={tickerItems} />
             )}

             <div className="h-6 w-px bg-gray-200 hidden md:block"></div>
             <div className="hidden md:flex items-center gap-1 overflow-x-auto">
                {MODULES.map((module) => (
                    <button 
                        key={module.id}
                        onClick={() => { setActiveModule(module.id); setActiveTab('dashboard'); }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                            activeModule === module.id 
                            ? 'bg-slate-900 text-white shadow-md' 
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                        <module.icon size={16} className={activeModule === module.id ? 'text-white' : 'text-gray-400'} />
                        {module.label}
                    </button>
                ))}
             </div>
          </div>
          <div className="hidden md:flex items-center gap-3">
             <div className="text-right">
                 <p className="text-xs font-bold text-gray-900">{TEAM_NAME}</p>
                 <p className="text-[10px] text-gray-500 uppercase">Revenue Intelligence</p>
             </div>
             <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center border border-gray-200">
                 <span className="text-xs font-bold text-gray-600">PV</span>
             </div>
          </div>
      </div>

      {/* Sidebar - Contextual */}
      <aside className={`bg-white border-r border-gray-200 w-64 md:w-24 lg:w-64 flex-shrink-0 flex flex-col fixed left-0 top-16 bottom-0 z-40 overflow-y-auto transform transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        
        {/* Module Specific Tools */}
        <div className="p-4 flex-1">
            {/* Mobile-only Module Switcher */}
            <div className="md:hidden mb-6 space-y-2 border-b border-gray-100 pb-4">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2 mb-2">Modules</p>
                {MODULES.map((module) => (
                    <button 
                        key={module.id}
                        onClick={() => { setActiveModule(module.id); setActiveTab('dashboard'); setIsMobileMenuOpen(false); }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                            activeModule === module.id 
                            ? 'bg-slate-900 text-white shadow-md' 
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                    >
                        <module.icon size={18} className={activeModule === module.id ? 'text-white' : 'text-gray-400'} />
                        {module.label}
                    </button>
                ))}
            </div>

            {activeModule === 'ticketing' && (
                <div className="animate-in slide-in-from-left-2 duration-300 space-y-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3 px-2">Ticketing Tools</p>
                    <button onClick={() => { setActiveTab('dashboard'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${activeTab === 'dashboard' ? 'bg-red-50 text-red-700 font-bold border border-red-100' : 'text-gray-600 hover:bg-gray-50'}`}>
                        <LayoutDashboard size={18} /> <span className="inline md:hidden lg:inline text-sm">Overview</span>
                    </button>
                    <button onClick={() => { setActiveTab('comparison'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${activeTab === 'comparison' ? 'bg-red-50 text-red-700 font-bold border border-red-100' : 'text-gray-600 hover:bg-gray-50'}`}>
                        <ArrowLeftRight size={18} /> <span className="inline md:hidden lg:inline text-sm">Comparison</span>
                    </button>
                    <button onClick={() => { setActiveTab('simulator'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${activeTab === 'simulator' ? 'bg-red-50 text-red-700 font-bold border border-red-100' : 'text-gray-600 hover:bg-gray-50'}`}>
                        <Calculator size={18} /> <span className="inline md:hidden lg:inline text-sm">Simulator</span>
                    </button>
                    <button onClick={() => { setActiveTab('chat'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${activeTab === 'chat' ? 'bg-red-50 text-red-700 font-bold border border-red-100' : 'text-gray-600 hover:bg-gray-50'}`}>
                        <MessageSquare size={18} /> <span className="inline md:hidden lg:inline text-sm">AI Strategist</span>
                    </button>

                    {(activeTab === 'dashboard' || activeTab === 'comparison') && (
                        <div className="mt-4 bg-gray-50 p-3 rounded-xl border border-gray-100">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Data View</p>
                            <div className="flex flex-col gap-2">
                                <button 
                                    onClick={() => setViewMode('total')}
                                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                                        viewMode === 'total' 
                                        ? 'bg-white text-gray-900 shadow-sm border border-gray-200' 
                                        : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    <Briefcase size={14} />
                                    Total View
                                </button>
                                <button 
                                    onClick={() => setViewMode('gameday')}
                                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                                        viewMode === 'gameday' 
                                        ? 'bg-white text-red-600 shadow-sm border border-gray-200' 
                                        : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    <Calendar size={14} />
                                    GameDay Only
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {activeModule === 'gameday' && (
                <div className="animate-in slide-in-from-left-2 duration-300 space-y-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3 px-2">GameDay Tools</p>
                    <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-indigo-50 text-indigo-700 font-bold border border-indigo-100 mb-4">
                        <LayoutDashboard size={18} /> <span className="inline md:hidden lg:inline text-sm">Dashboard</span>
                    </button>
                    
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">View Configuration</p>
                        <button 
                            onClick={() => setGameDayIncludeTicketing(!gameDayIncludeTicketing)}
                            className={`w-full flex items-center justify-between p-2 rounded-lg text-xs font-bold transition-all ${gameDayIncludeTicketing ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-gray-500 border border-gray-200'}`}
                        >
                            <span>Include Ticketing</span>
                            {gameDayIncludeTicketing ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                        </button>
                    </div>
                </div>
            )}

            {activeModule === 'home' && (
                <div className="space-y-4 animate-in slide-in-from-left-2 duration-300">
                    <div className="p-4 bg-gray-50 rounded-lg text-center border border-gray-100">
                        <PieChart size={32} className="mx-auto text-gray-300 mb-2" />
                        <p className="text-xs text-gray-500">Global Overview Mode</p>
                    </div>
                    
                    <a 
                        href="https://shareholders.pallacanestrovarese.club/" 
                        target="_blank" 
                        rel="noreferrer"
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white border border-gray-200 text-gray-600 font-medium shadow-sm hover:border-red-200 hover:text-red-700 transition-all group"
                    >
                        <div className="p-1.5 bg-gray-100 rounded-md group-hover:bg-red-50 transition-colors">
                            <FileText size={16} />
                        </div>
                        <span className="inline md:hidden lg:inline text-sm">Monthly Reports</span>
                        <ExternalLink size={12} className="ml-auto opacity-50 group-hover:opacity-100" />
                    </a>
                </div>
            )}
        </div>

        {/* Data Source Controls - Context Aware */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/50">
           <div className="flex items-center gap-2 mb-4 text-xs font-semibold uppercase text-gray-400">
              <Database size={14} />
              <span>Data Management</span>
           </div>
           
           <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".csv" className="hidden" />
           
           {!isFirebaseConfigured ? (
             <button onClick={() => setShowSetupModal(true)} className="w-full mb-3 flex items-center justify-center gap-2 py-2 px-4 text-xs font-medium text-white bg-red-600 hover:bg-red-700 border border-transparent rounded-lg transition-colors shadow-sm animate-pulse">
                Connect Database
             </button>
           ) : (
             <div className="space-y-2 mb-4">
                 {activeModule !== 'home' ? (
                     <>
                        <div className="text-[10px] text-gray-500 mb-1 px-1 flex items-center gap-1">
                            Current Source: 
                            <strong className={`flex items-center gap-1 ${dataSources[activeModule === 'gameday' ? 'gameday' : 'ticketing'] === 'cloud' ? 'text-green-600' : 'text-orange-600'}`}>
                                {dataSources[activeModule === 'gameday' ? 'gameday' : 'ticketing'] === 'cloud' ? <Cloud size={10} /> : <Database size={10} />}
                                {dataSources[activeModule === 'gameday' ? 'gameday' : 'ticketing'].toUpperCase()}
                            </strong>
                        </div>
                        <button onClick={triggerFileUpload} disabled={isUploading} className="w-full flex items-center justify-center gap-2 py-2 px-4 text-xs font-medium text-gray-600 bg-white hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors shadow-sm active:bg-gray-50 hover:shadow-md hover:text-gray-900">
                            {isUploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />} 
                            Upload {activeModule === 'gameday' ? 'GameDay' : 'Ticketing'} CSV
                        </button>
                     </>
                 ) : (
                     <div className="text-center p-2 bg-white rounded border border-gray-200">
                         <p className="text-[10px] text-gray-400">Select a specific vertical to manage its data.</p>
                     </div>
                 )}
             </div>
           )}
           
           {!isLoadingData && activeModule !== 'home' && (
             <div className="bg-white border border-gray-200 rounded-lg p-3">
                <p className="text-[10px] text-gray-400 font-semibold uppercase mb-1">Data Source Info</p>
                <div className="flex flex-col">
                    {/* Prioritize showing Upload Time if available, regardless of whether it was just uploaded or loaded from cloud */}
                    {lastUploadTimes[activeModule === 'gameday' ? 'gameday' : 'ticketing'] ? (
                        <>
                            <div className="flex items-center gap-1 text-green-600 mb-0.5">
                                <Clock size={10} />
                                <span className="text-[10px] font-bold uppercase">Last Uploaded</span>
                            </div>
                            <span className="text-xs font-bold text-gray-800">
                                {new Date(lastUploadTimes[activeModule === 'gameday' ? 'gameday' : 'ticketing']!).toLocaleDateString()}
                            </span>
                            <span className="text-[10px] text-gray-500">
                                {new Date(lastUploadTimes[activeModule === 'gameday' ? 'gameday' : 'ticketing']!).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </span>
                        </>
                    ) : (
                        /* Fallback to Last Game info if no upload time is tracked (e.g. local fallback data) */
                        lastGame ? (
                            <>
                                <span className="text-xs font-bold text-gray-800 truncate">{lastGame.opponent}</span>
                                <span className="text-[10px] text-gray-500">{lastGame.season} • {lastGame.date}</span>
                            </>
                        ) : (
                            <span className="text-[10px] text-gray-400">No data loaded</span>
                        )
                    )}
                </div>
             </div>
           )}
        </div>
      </aside>

      {/* Overlay for mobile sidebar */}
      {isMobileMenuOpen && (
        <div 
            className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}

      <main className="flex-1 overflow-x-hidden pt-16 pl-0 md:pl-24 lg:pl-64">
        
        <div className="p-6 max-w-7xl mx-auto min-h-[calc(100vh-64px)]">
          
          {/* --- CONTENT AREA SWITCHER --- */}
          
          {activeModule === 'home' ? (
              <RevenueHome 
                modules={MODULES} 
                ticketingRevenue={totalStats.totalRevenue} 
                gameDayRevenue={gameDayRevenueNet} 
                onNavigate={(id) => { setActiveModule(id); setActiveTab('dashboard'); }}
                onAiClick={() => {
                    setActiveModule('ticketing');
                    setActiveTab('chat');
                }}
                gamesPlayed={viewData.length}
                seasonFilter={selectedSeasons[0]}
                onSeasonChange={(s) => setSelectedSeasons([s])}
              />
          ) : activeModule === 'gameday' ? (
              <div className="pt-6">
                {!isLoadingData && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                        <div className="hidden md:block lg:col-span-2 relative bg-gradient-to-br from-indigo-800 to-slate-900 rounded-xl p-6 text-white shadow-lg overflow-hidden group border border-indigo-700">
                            <div className="absolute top-4 right-4 opacity-50 group-hover:opacity-100 transition-opacity duration-500">
                            <AIAvatar size="sm" />
                            </div>
                            <div className="relative z-10 pr-20">
                                <h3 className="font-bold text-lg mb-2 flex items-center gap-2 text-indigo-100 uppercase tracking-wide">
                                AI Director's Briefing
                                </h3>
                                <p className="text-white/90 text-sm leading-relaxed mb-4">
                                {filteredGameDayData.length > 0 ? (
                                    <>
                                    Monitoring <strong>{filteredGameDayData.length} GameDay events</strong>. 
                                    {gameDayIncludeTicketing ? (
                                        <>Tracking <strong>Total Net Revenue</strong> against the <strong>€3.3M Budget</strong> (Includes Tix + Spons + TV + Variable).</>
                                    ) : (
                                        <>Tracking <strong>Net Revenue (Excl. Tix)</strong> against the <strong>€1.65M Budget</strong> (Includes Spons + TV + Variable).</>
                                    )}
                                    Look for correlations between Merchandising spikes and specific opponents.
                                    </>
                                ) : (
                                    "No GameDay data matches your current filter selection."
                                )}
                                </p>
                                <button onClick={() => { setActiveModule('ticketing'); setActiveTab('chat'); }} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-indigo-500 transition-colors shadow-lg border border-indigo-500">
                                OPEN STRATEGY CHAT
                                </button>
                            </div>
                            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-indigo-600/20 rounded-full blur-3xl"></div>
                        </div>

                        <div className="lg:col-span-1 h-full">
                            <PacingWidget 
                                currentRevenue={filteredGameDayRevForPacing} 
                                gamesPlayed={filteredGameDayData.length} 
                                seasonTarget={gameDayIncludeTicketing ? SEASON_TARGET_GAMEDAY_TOTAL : SEASON_TARGET_GAMEDAY} 
                                totalGamesInSeason={15} 
                            />
                        </div>
                    </div>
                )}
                
                <FilterBar />
                
                <GameDayDashboard data={filteredGameDayData} includeTicketing={gameDayIncludeTicketing} />
              </div>
          ) : activeModule === 'ticketing' ? (
            <>
                {/* EXISTING TICKETING LOGIC */}
                {activeTab === 'dashboard' && (
                    <div className="pt-6">
                    {/* DIRECTOR'S NOTE */}
                    {!isLoadingData && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                            <div className="hidden md:block lg:col-span-2 relative bg-gradient-to-br from-red-700 to-slate-900 rounded-xl p-6 text-white shadow-lg overflow-hidden group border border-red-900">
                                <div className="absolute top-4 right-4 opacity-50 group-hover:opacity-100 transition-opacity duration-500">
                                <AIAvatar size="sm" />
                                </div>
                                <div className="relative z-10 pr-20">
                                    <h3 className="font-bold text-lg mb-2 flex items-center gap-2 text-red-100 uppercase tracking-wide">
                                    AI Director's Briefing
                                    </h3>
                                    <p className="text-white/90 text-sm leading-relaxed mb-4">
                                    {viewData.length > 0 ? (
                                        <>
                                        Analyzing <strong>{viewData.length} games</strong> matching criteria. 
                                        {!selectedOpponents.includes('All') && selectedSeasons.length > 1 
                                            ? ` You are reviewing a YoY comparison for ${selectedOpponents.length === 1 ? selectedOpponents[0] : 'selected opponents'}. Note the variance in Yield.` 
                                            : ` Trend analysis indicates fluctuations in attendance efficiency. Review the Distressed Inventory report below.`
                                        }
                                        </>
                                    ) : (
                                        "No data matches your current filter selection."
                                    )}
                                    </p>
                                    <button onClick={() => setActiveTab('chat')} className="bg-red-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-red-500 transition-colors shadow-lg border border-red-500">
                                    OPEN STRATEGY CHAT
                                    </button>
                                </div>
                                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-red-600/20 rounded-full blur-3xl"></div>
                            </div>

                            <div className="lg:col-span-1 h-full">
                                {/* PACING WIDGET */}
                                <PacingWidget 
                                    currentRevenue={stats.totalRevenue} 
                                    gamesPlayed={viewData.length} 
                                    seasonTarget={viewMode === 'gameday' ? SEASON_TARGET_TICKETING_DAY : SEASON_TARGET_TOTAL} 
                                    totalGamesInSeason={15} // Approx
                                />
                            </div>
                        </div>
                    )}

                    {/* Filter Bar */}
                    <FilterBar />
                    
                    {/* Action Center - Smart Alerts */}
                    <ActionCenter data={viewData} />
                    
                    {isLoadingData && data.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-96">
                            <Loader2 size={40} className="text-red-600 animate-spin mb-4" />
                            <p className="text-gray-500 font-medium">Loading sales data...</p>
                        </div>
                    ) : (
                        <div className="animate-fade-in space-y-6">
                        
                        <StatsCards 
                            stats={stats} 
                            data={viewData} 
                            fullDataset={data} 
                            filters={{ season: selectedSeasons, league: selectedLeagues, zone: selectedZones, opponent: selectedOpponents, tier: selectedTiers }} 
                            kpiConfig={{ ...kpiConfig, giveawayTarget: viewMode === 'gameday' ? 15 : 10 }}
                            viewMode={viewMode}
                        />

                        <div className="mb-8">
                            <div className="flex justify-between items-end mb-4">
                                <h2 className="text-xl font-bold text-gray-800">Venue Intelligence</h2>
                            </div>
                            
                            {/* Map and Vertical Widgets Row */}
                            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 mb-6">
                                {/* Map Area - Slimmer (8/12 = 66%) */}
                                <div className="xl:col-span-8 h-[600px]">
                                    <ArenaMap 
                                        data={viewData} 
                                        onZoneClick={handleZoneClick} 
                                        selectedZone={selectedZones.includes('All') ? 'All' : selectedZones[0]} 
                                    />
                                </div>

                                {/* Vertical Widgets Column - Wider (4/12 = 33%) */}
                                <div className="xl:col-span-4 flex flex-col gap-4 h-[600px]">
                                    {/* 70% Height */}
                                    <div className="flex-[7] min-h-0">
                                        <DistressedZones 
                                            data={viewData} 
                                            fullDataset={data}
                                            currentSeasons={selectedSeasons}
                                        />
                                    </div>
                                    {/* 30% Height */}
                                    <div className="flex-[3] min-h-0">
                                        <CompKillerWidget data={viewData} />
                                    </div>
                                </div>
                            </div>

                            {/* Full Width Zone Table */}
                            <div className="h-[600px] w-full">
                                {selectedZones.includes('All') ? (
                                    <ZoneTable data={viewData} onZoneClick={handleZoneClick} />
                                ) : (
                                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden h-full flex flex-col">
                                        <div className="p-4 border-b border-gray-100 font-semibold text-gray-700 flex justify-between items-center bg-gray-50 flex-shrink-0">
                                            <div className="flex items-center gap-2">
                                                <span>Detailed Games Log ({selectedZones[0]})</span>
                                                <button onClick={() => setSelectedZones(['All'])} className="text-xs text-red-600 hover:underline ml-2 bg-white px-2 py-1 rounded border border-red-200">Reset View</button>
                                            </div>
                                            <span className="text-xs bg-white border border-gray-200 px-2 py-1 rounded text-gray-500">{viewData.length} Matches</span>
                                        </div>
                                        <div className="divide-y divide-gray-50 overflow-y-auto flex-1 p-2">
                                            {[...viewData].reverse().map((game) => (
                                                <div key={game.id} className="p-3 flex items-center justify-between hover:bg-gray-50 transition-colors rounded-lg">
                                                    <div>
                                                        <p className="font-bold text-gray-900 text-sm">{game.opponent}</p>
                                                        <p className="text-xs text-gray-400">{game.date} • {game.season}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-bold text-gray-900 text-sm">€{(game.totalRevenue/1000).toFixed(1)}k</p>
                                                        <p className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded inline-block mt-1">
                                                            {game.attendance} Sold
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        <div className="mb-8 relative z-0">
                            <h2 className="text-xl font-bold text-gray-800 mb-4">
                            Trend & Performance Analysis
                            </h2>
                            <DashboardChart 
                                data={viewData} 
                                efficiencyData={efficiencyData}
                                onFilterChange={handleChartFilterChange} 
                            />
                        </div>
                        </div>
                    )}
                    </div>
                )}

                {activeTab === 'comparison' && (
                    <div className="pt-6">
                        <ComparisonView fullData={data} options={{ seasons: allSeasons, leagues: allLeagues, opponents: allOpponents, tiers: allTiers, zones: allZones }} viewMode={viewMode} />
                    </div>
                )}

                {activeTab === 'simulator' && (
                    <div className="pt-6">
                        <Simulator data={viewData} />
                    </div>
                )}

                {activeTab === 'chat' && (
                    <div className="h-full animate-fade-in max-w-4xl mx-auto pt-6">
                        <div className="mb-6 text-center">
                        <h2 className="text-2xl font-bold text-gray-900">Strategy Assistant</h2>
                        <p className="text-gray-500">Analyze "What If" scenarios for the current selection</p>
                        </div>
                        <ChatInterface contextData={aiContext} />
                    </div>
                )}
            </>
          ) : (
              <PlaceholderView 
                moduleName={MODULES.find(m => m.id === activeModule)?.label || 'Module'} 
                icon={MODULES.find(m => m.id === activeModule)?.icon || Construction}
              />
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
