
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { LayoutDashboard, MessageSquare, Upload, Filter, X, Loader2, ArrowLeftRight, UserX, Cloud, Database, Settings, ExternalLink, ShieldAlert, Calendar, Briefcase, Calculator, Ticket, ShoppingBag, Landmark, Flag, Activity, GraduationCap, Construction, PieChart, TrendingUp, ArrowRight, Menu, Clock, ToggleLeft, ToggleRight, Crown, Bell, Users, FileText, ChevronDown, Target, Shield } from 'lucide-react';
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
import { BoardReportModal } from './components/BoardReportModal';
import { CRMView } from './components/CRMView';
import { SponsorshipDashboard } from './components/SponsorshipDashboard';
import { TEAM_NAME, GOOGLE_SHEET_CSV_URL, PV_LOGO_URL, FIXED_CAPACITY_25_26, SEASON_TARGET_TOTAL, SEASON_TARGET_GAMEDAY, SEASON_TARGET_GAMEDAY_TOTAL, SEASON_TARGET_TICKETING_DAY } from './constants';
import { GameData, GameDayData, SponsorData, DashboardStats, SalesChannel, TicketZone, KPIConfig, RevenueModule } from './types';
import { FALLBACK_CSV_CONTENT } from './data/csvData';
import { GAMEDAY_CSV_CONTENT } from './data/gameDayData';
import { SPONSOR_CSV_CONTENT } from './data/sponsorData';
import { processGameData, processGameDayData, processSponsorData } from './utils/dataProcessor';
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
    sponsorshipRevenue,
    onAiClick,
    gamesPlayed,
    seasonFilter,
    onSeasonChange
}: { 
    modules: any[], 
    ticketingRevenue: number, 
    gameDayRevenue: number, 
    sponsorshipRevenue: number,
    onNavigate: (id: RevenueModule) => void,
    onAiClick: () => void,
    gamesPlayed: number,
    seasonFilter: string,
    onSeasonChange: (s: string) => void
}) => {
    // Constants
    const TOTAL_GAMES_SEASON = 15;
    const gamesCount = Math.max(gamesPlayed, 1);
    const seasonProgressPct = (gamesPlayed / TOTAL_GAMES_SEASON) * 100;

    // Season progress fraction (0 to 1) for prorating
    const seasonProgressFraction = gamesPlayed / TOTAL_GAMES_SEASON;

    // 7 Revenue Verticals with actual data for Ticketing, GameDay, Sponsorship
    // isProrated: Sponsorship contracts are signed for the full year but recognized over time
    // hasData: indicates if this vertical has real data connected
    const verticalPerformance = [
      { 
          id: 'sponsorship', 
          name: 'Sponsorship', 
          signedValue: sponsorshipRevenue, // Full year contracts signed
          current: sponsorshipRevenue * seasonProgressFraction, // Recognized YTD (prorated)
          target: 2100000,
          icon: Flag, colorClass: 'text-blue-600', bgClass: 'bg-blue-50', barClass: 'bg-blue-500', isVariable: false, isProrated: true, hasData: true 
      },
      { 
          id: 'ticketing', 
          name: 'Ticketing', 
          current: ticketingRevenue, 
          target: 1650000, 
          icon: Ticket, colorClass: 'text-red-600', bgClass: 'bg-red-50', barClass: 'bg-red-500', isVariable: true, isProrated: false, hasData: true 
      },
      { 
          id: 'gameday', 
          name: 'GameDay', 
          current: gameDayRevenue, 
          target: 1250000, 
          icon: Calendar, colorClass: 'text-indigo-600', bgClass: 'bg-indigo-50', barClass: 'bg-indigo-500', isVariable: true, isProrated: false, hasData: true 
      },
      { 
          id: 'sg', 
          name: 'Varese Basketball', 
          current: 0, 
          target: 930000, 
          icon: GraduationCap, colorClass: 'text-teal-600', bgClass: 'bg-teal-50', barClass: 'bg-teal-500', isVariable: false, isProrated: false, hasData: false 
      },
      { 
          id: 'bops', 
          name: 'BOps', 
          current: 0, 
          target: 525000, 
          icon: Activity, colorClass: 'text-emerald-600', bgClass: 'bg-emerald-50', barClass: 'bg-emerald-500', isVariable: false, isProrated: false, hasData: false 
      },
      { 
          id: 'venue_ops', 
          name: 'Venue Ops', 
          current: 0, 
          target: 258000, 
          icon: Landmark, colorClass: 'text-slate-600', bgClass: 'bg-slate-50', barClass: 'bg-slate-500', isVariable: false, isProrated: false, hasData: false 
      },
      { 
          id: 'merchandising', 
          name: 'Merchandising', 
          current: 0, 
          target: 131000, 
          icon: ShoppingBag, colorClass: 'text-orange-600', bgClass: 'bg-orange-50', barClass: 'bg-orange-500', isVariable: false, isProrated: false, hasData: false 
      },
    ];

    // Calculate pacing for each vertical
    const verticalsWithPacing = verticalPerformance.map(v => {
        let pacePct: number;
        let expectedAtThisPoint: number;
        
        if (v.isVariable) {
            // Variable: Pace based on games played
            expectedAtThisPoint = (v.target / TOTAL_GAMES_SEASON) * gamesPlayed;
            pacePct = expectedAtThisPoint > 0 ? ((v.current / expectedAtThisPoint) - 1) * 100 : 0;
        } else {
            // Absolute/Prorated: Pace based on % of target achieved vs time
            expectedAtThisPoint = v.target * seasonProgressFraction;
            pacePct = expectedAtThisPoint > 0 ? ((v.current / expectedAtThisPoint) - 1) * 100 : 0;
        }
        
        // Projected finish calculation
        let projectedFinish: number;
        if (v.isVariable) {
            projectedFinish = (v.current / gamesCount) * TOTAL_GAMES_SEASON;
        } else if (v.isProrated && 'signedValue' in v) {
            // For prorated: full signed value is the projected finish
            projectedFinish = v.signedValue as number;
        } else {
            projectedFinish = v.current; // For absolute, current is what we have
        }
        
        return { ...v, pacePct, expectedAtThisPoint, projectedFinish };
    });

    // Filter verticals with actual data for aggregates
    const verticalsWithData = verticalsWithPacing.filter(v => v.hasData);
    const verticalsWithoutData = verticalsWithPacing.filter(v => !v.hasData);

    // SORTED VERTICALS (Only those with data, highest YTD first)
    const sortedVerticals = [...verticalsWithData].sort((a, b) => b.current - a.current);
    const bestVertical = sortedVerticals[0];
    const worstPacingVertical = [...verticalsWithData].sort((a, b) => a.pacePct - b.pacePct)[0];
    const bestPacingVertical = [...verticalsWithData].sort((a, b) => b.pacePct - a.pacePct)[0];

    // AGGREGATES (Only verticals with actual data)
    const totalRevenueYTD = verticalsWithData.reduce((acc, v) => acc + v.current, 0);
    const totalTarget = verticalsWithData.reduce((acc, v) => acc + v.target, 0);
    const totalRevenueProjected = verticalsWithData.reduce((acc, v) => {
        if(v.isVariable) {
             return acc + v.projectedFinish;
        } else if (v.isProrated && 'signedValue' in v) {
             return acc + (v.signedValue as number);
        } else {
             return acc + v.current;
        }
    }, 0);
    
    // PACING LOGIC
    const revenueProgressPct = totalTarget > 0 ? (totalRevenueYTD / totalTarget) * 100 : 0;
    const pacingDelta = revenueProgressPct - seasonProgressPct;
    const isAhead = pacingDelta >= 0;
    const projectionDiff = totalRevenueProjected - totalTarget;

    const variableYTD = verticalsWithData.filter(v => v.isVariable).reduce((acc, v) => acc + v.current, 0);
    const fixedYTD = verticalsWithData.filter(v => !v.isVariable).reduce((acc, v) => acc + v.current, 0);
    const currentVariableRunRate = variableYTD / gamesCount;

    // Helper for formatting
    const formatCompact = (val: number) => {
        if (val >= 1000000) return `€${(val/1000000).toFixed(2)}M`;
        if (val >= 1000) return `€${(val/1000).toFixed(0)}k`;
        return `€${val.toFixed(0)}`;
    };

    return (
        <div className="max-w-7xl mx-auto animate-fade-in space-y-6 pt-2 pb-12">
            
            {/* Top Bar: Title & Season Selector */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Executive Overview</h1>
                    <p className="text-gray-500 text-sm">Season {seasonFilter} • {gamesPlayed} of {TOTAL_GAMES_SEASON} games played</p>
                </div>
                
                <div className="flex items-center gap-3">
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
            </div>

            {/* AI Executive Summary */}
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
                                ? `YTD pacing is strong (+${pacingDelta.toFixed(1)}% vs Time). ${bestPacingVertical.name} leads at ${bestPacingVertical.pacePct >= 0 ? '+' : ''}${bestPacingVertical.pacePct.toFixed(0)}% pace. Forecast: ${formatCompact(totalRevenueProjected)}.` 
                                : `Alert: Collections trail timeline by ${Math.abs(pacingDelta).toFixed(1)}%. ${worstPacingVertical.name} needs attention (${worstPacingVertical.pacePct.toFixed(0)}% pace). Focus on variable revenue acceleration.`
                            }
                        </p>
                    </div>
                    <button onClick={onAiClick} className="shrink-0 bg-white/10 backdrop-blur-md text-white px-5 py-3 rounded-xl text-sm font-bold hover:bg-white/20 transition-colors border border-white/20 flex items-center gap-2">
                        Full Analysis <ArrowRight size={16} />
                    </button>
                </div>
            </div>

            {/* MAIN PACE WIDGET (Stacked Bar) */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm relative overflow-hidden">
                <div className="flex justify-between items-end mb-4">
                    <div>
                        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Season Pacing</h2>
                        <div className="flex items-baseline gap-3">
                            <span className="text-4xl font-extrabold text-gray-900">{formatCompact(totalRevenueYTD)}</span>
                            <span className="text-lg text-gray-400 font-medium">/ {formatCompact(totalTarget)}</span>
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
                <div className="relative h-8 bg-gray-100 rounded-full overflow-hidden mb-3 flex border border-gray-200">
                    {/* Time Marker */}
                    <div 
                        className="absolute top-0 bottom-0 border-r-2 border-dashed border-gray-800 z-20 opacity-60"
                        style={{ width: `${seasonProgressPct}%` }}
                    >
                        <div className="bg-gray-800 text-white text-[9px] font-bold px-1.5 py-0.5 rounded absolute -bottom-5 right-0 transform translate-x-1/2 whitespace-nowrap">
                            {seasonProgressPct.toFixed(0)}% Time
                        </div>
                    </div>

                    {/* Stacked Segments (YTD) */}
                    {sortedVerticals.map((v) => {
                        const widthPct = (v.current / totalTarget) * 100;
                        if (widthPct <= 0) return null;
                        return (
                            <div 
                                key={v.id}
                                className={`h-full ${v.barClass} first:rounded-l-full relative group transition-all duration-300 hover:brightness-110 cursor-help`}
                                style={{ width: `${widthPct}%` }}
                            >
                                {/* Enhanced Tooltip */}
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 bg-slate-900 text-white text-xs rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-200 z-50 min-w-[180px] pointer-events-none">
                                    <div className="p-3 border-b border-slate-700 font-bold bg-slate-950 rounded-t-lg flex justify-between items-center">
                                        <span>{v.name}</span>
                                        <span className={`text-xs px-1.5 py-0.5 rounded ${v.isVariable ? 'bg-purple-600' : v.isProrated ? 'bg-cyan-600' : 'bg-blue-600'}`}>
                                            {v.isVariable ? 'Variable' : v.isProrated ? 'Prorated' : 'Fixed'}
                                        </span>
                                    </div>
                                    <div className="p-3 space-y-2">
                                        {v.isProrated && 'signedValue' in v && (
                                            <div className="flex justify-between">
                                                <span className="text-slate-400">Signed (Full Year):</span>
                                                <span className="font-mono text-cyan-400">{formatCompact(v.signedValue as number)}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">{v.isProrated ? 'Recognized YTD:' : 'YTD Collected:'}</span>
                                            <span className="font-mono font-bold">{formatCompact(v.current)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">Season Target:</span>
                                            <span className="font-mono text-slate-300">{formatCompact(v.target)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">Achievement:</span>
                                            <span className="font-mono text-blue-400">{((v.current / v.target) * 100).toFixed(1)}%</span>
                                        </div>
                                        <div className="flex justify-between border-t border-slate-700 pt-2 mt-1">
                                            <span className="text-slate-400">Pace vs Time:</span>
                                            <span className={`font-mono font-bold ${v.pacePct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                {v.pacePct >= 0 ? '+' : ''}{v.pacePct.toFixed(1)}%
                                            </span>
                                        </div>
                                        {(v.isVariable || v.isProrated) && (
                                            <div className="flex justify-between">
                                                <span className="text-slate-400">{v.isProrated ? 'Full Year:' : 'Projected:'}</span>
                                                <span className="font-mono text-purple-400">{formatCompact(v.projectedFinish)}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-8 border-x-transparent border-t-8 border-t-slate-900"></div>
                                </div>
                            </div>
                        );
                    })}
                </div>
                
                {/* Legend */}
                <div className="flex flex-wrap gap-3 justify-center mt-5">
                    {sortedVerticals.map((v) => (
                        <div key={v.id} className="flex items-center gap-1.5">
                            <div className={`w-2.5 h-2.5 rounded-full ${v.barClass}`}></div>
                            <span className="text-[10px] font-medium text-gray-600">{v.name}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* 7 VERTICAL SCORE CARDS */}
            <div>
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">Revenue Verticals</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                    {verticalsWithPacing.map((v) => {
                        const progressPct = v.hasData ? Math.min((v.current / v.target) * 100, 100) : 0;
                        const isOnTrack = v.pacePct >= -5;
                        
                        // Card for verticals WITHOUT data - Coming Soon
                        if (!v.hasData) {
                            return (
                                <div key={v.id} className="bg-gray-50 rounded-xl border border-dashed border-gray-300 p-4 shadow-sm relative">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className={`w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center`}>
                                            <v.icon size={16} className="text-gray-400" />
                                        </div>
                                    </div>
                                    <p className="text-sm font-medium text-gray-400 leading-tight">Coming Soon</p>
                                    <p className="text-[10px] text-gray-300 mb-2">Target: {formatCompact(v.target)}</p>
                                    <div className="h-1.5 bg-gray-200 rounded-full mb-1" />
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] text-gray-400">{v.name}</span>
                                        <span className="text-[10px] font-medium text-gray-400">—</span>
                                    </div>
                                </div>
                            );
                        }
                        
                        // Card for verticals WITH data
                        return (
                            <div key={v.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm relative group hover:shadow-md transition-shadow">
                                {/* Icon & Name */}
                                <div className="flex items-center gap-2 mb-3">
                                    <div className={`w-8 h-8 ${v.bgClass} rounded-lg flex items-center justify-center`}>
                                        <v.icon size={16} className={v.colorClass} />
                                    </div>
                                    <span className={`text-[10px] font-bold uppercase ${v.isVariable ? 'text-purple-600' : v.isProrated ? 'text-cyan-600' : 'text-gray-500'}`}>
                                        {v.isVariable ? '●' : v.isProrated ? '◐' : '○'}
                                    </span>
                                </div>
                                
                                {/* Values */}
                                <p className="text-lg font-bold text-gray-900 leading-tight">{formatCompact(v.current)}</p>
                                <p className="text-[10px] text-gray-400 mb-2">/ {formatCompact(v.target)}</p>
                                
                                {/* Progress Bar with Tooltip */}
                                <div className="relative h-1.5 bg-gray-100 rounded-full overflow-hidden mb-1">
                                    <div 
                                        className={`h-full ${v.barClass} transition-all duration-500`}
                                        style={{ width: `${progressPct}%` }}
                                    />
                                    {/* Time marker */}
                                    <div 
                                        className="absolute top-0 bottom-0 w-0.5 bg-gray-800 opacity-40"
                                        style={{ left: `${seasonProgressPct}%` }}
                                    />
                                </div>
                                
                                {/* Pace Indicator */}
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] text-gray-500">{v.name}</span>
                                    <span className={`text-[10px] font-bold ${isOnTrack ? 'text-green-600' : 'text-red-600'}`}>
                                        {v.pacePct >= 0 ? '+' : ''}{v.pacePct.toFixed(0)}%
                                    </span>
                                </div>

                                {/* Hover Tooltip */}
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-slate-900 text-white text-[10px] rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-200 z-50 min-w-[140px] pointer-events-none p-2">
                                    <p className="font-bold mb-1">{v.name}</p>
                                    {v.isProrated && 'signedValue' in v && (
                                        <p className="text-cyan-400">Signed: {formatCompact(v.signedValue as number)}</p>
                                    )}
                                    <p>{v.isProrated ? 'Recognized:' : 'Collected:'} {formatCompact(v.current)}</p>
                                    <p>Target: {formatCompact(v.target)}</p>
                                    <p>Progress: {((v.current / v.target) * 100).toFixed(1)}%</p>
                                    <p className={v.pacePct >= 0 ? 'text-green-400' : 'text-red-400'}>
                                        Pace: {v.pacePct >= 0 ? '+' : ''}{v.pacePct.toFixed(1)}%
                                    </p>
                                    {v.isVariable && <p className="text-purple-400">Proj: {formatCompact(v.projectedFinish)}</p>}
                                    {v.isProrated && 'signedValue' in v && <p className="text-purple-400">Full Year: {formatCompact(v.signedValue as number)}</p>}
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-slate-900"></div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* STRATEGIC SIGNALS */}
            <div>
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">Strategic Signals</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    
                    {/* Signal 1: Projected Finish */}
                    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-5 text-white shadow-lg border border-slate-700">
                        <div className="flex items-center gap-2 mb-3">
                            <Target size={16} className="text-slate-400" />
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Projected Finish</span>
                        </div>
                        <p className="text-2xl font-bold">{formatCompact(totalRevenueProjected)}</p>
                        <p className={`text-sm font-medium mt-1 ${projectionDiff >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {projectionDiff >= 0 ? '+' : ''}{formatCompact(projectionDiff)} vs Target
                        </p>
                        <div className="mt-3 pt-3 border-t border-slate-700 text-[10px] text-slate-500">
                            Based on current run-rate extrapolation
                        </div>
                    </div>

                    {/* Signal 2: Variable Run Rate */}
                    <div className="bg-white border border-purple-200 rounded-xl p-5 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                            <TrendingUp size={16} className="text-purple-600" />
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Variable Run Rate</span>
                        </div>
                        <div className="flex items-baseline gap-1">
                            <p className="text-2xl font-bold text-gray-900">{formatCompact(currentVariableRunRate)}</p>
                            <span className="text-xs text-gray-400">/ game</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Ticketing + GameDay combined</p>
                        <div className="mt-3 h-1.5 bg-purple-100 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-purple-500" 
                                style={{ width: `${Math.min((currentVariableRunRate/200000)*100, 100)}%` }}
                            />
                        </div>
                    </div>

                    {/* Signal 3: Fixed Revenue Secured */}
                    <div className="bg-white border border-blue-200 rounded-xl p-5 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                            <Shield size={16} className="text-blue-600" />
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Fixed Revenue Secured</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{formatCompact(fixedYTD)}</p>
                        <p className="text-xs text-gray-500 mt-1">Sponsorship + VB + Others</p>
                        <div className="mt-3 flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-blue-100 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-blue-500" 
                                    style={{ width: `${Math.min((fixedYTD / (totalTarget - variableYTD + fixedYTD)) * 100, 100)}%` }}
                                />
                            </div>
                            <span className="text-[10px] font-bold text-blue-600">
                                {((fixedYTD / totalRevenueYTD) * 100).toFixed(0)}%
                            </span>
                        </div>
                    </div>

                    {/* Signal 4: Attention Required */}
                    <div className={`rounded-xl p-5 shadow-sm border ${worstPacingVertical.pacePct < -10 ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
                        <div className="flex items-center gap-2 mb-3">
                            <Bell size={16} className={worstPacingVertical.pacePct < -10 ? 'text-red-600' : 'text-amber-600'} />
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Attention Required</span>
                        </div>
                        <p className="text-lg font-bold text-gray-900">{worstPacingVertical.name}</p>
                        <p className={`text-2xl font-bold ${worstPacingVertical.pacePct < -10 ? 'text-red-600' : 'text-amber-600'}`}>
                            {worstPacingVertical.pacePct.toFixed(0)}% pace
                        </p>
                        <p className="text-[10px] text-gray-500 mt-2">
                            Gap: {formatCompact(worstPacingVertical.target * (seasonProgressPct/100) - worstPacingVertical.current)} behind expected
                        </p>
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
      const [activeTab, setActiveTab] = useState<'dashboard' | 'comparison' | 'simulator' | 'chat' | 'crm'>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  
  // Data State
  const [data, setData] = useState<GameData[]>([]);
  const [gameDayData, setGameDayData] = useState<GameDayData[]>([]);
  const [sponsorData, setSponsorData] = useState<SponsorData[]>([]);
  const [sponsorDataSource, setSponsorDataSource] = useState<'local' | 'cloud'>('local');
  const [sponsorLastUpdated, setSponsorLastUpdated] = useState<string | null>(null);
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

    // 2. SPONSOR DATA LOADING
    try {
        let sponsorCsv = SPONSOR_CSV_CONTENT;
        let sponsorSource: 'local' | 'cloud' = 'local';
        
        if (isFirebaseConfigured) {
            const cloudSponsor = await getCsvFromFirebase('sponsor');
            if (cloudSponsor) {
                sponsorCsv = cloudSponsor.content;
                setSponsorLastUpdated(cloudSponsor.updatedAt);
                sponsorSource = 'cloud';
            }
        }
        const loadedSponsors = processSponsorData(sponsorCsv);
        setSponsorData(loadedSponsors);
        setSponsorDataSource(sponsorSource);
    } catch(e) {
        console.error("Error loading Sponsor data", e);
        setSponsorData(processSponsorData(SPONSOR_CSV_CONTENT));
        setSponsorDataSource('local');
    }

    // 3. TICKETING DATA LOADING
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
    const targetDataset = activeModule === 'gameday' ? 'gameday' : activeModule === 'sponsorship' ? 'sponsor' : 'ticketing';

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
          } else if (targetDataset === 'gameday') {
              const testData = processGameDayData(text);
              isValid = testData.length > 0;
              if (isValid) setGameDayData(testData);
          } else if (targetDataset === 'sponsor') {
              const testData = processSponsorData(text);
              isValid = testData.length > 0;
              if (isValid) {
                  setSponsorData(testData);
                  setSponsorDataSource('cloud');
              }
          }

          if (isValid) {
            try {
              // Upload to separate database path based on dataset
              await saveCsvToFirebase(text, targetDataset);
              const now = new Date().toISOString();
              
              // UPDATE STATE IMMEDIATELY
              if (targetDataset === 'sponsor') {
                  setSponsorLastUpdated(now);
              } else {
                  setLastUploadTimes(prev => ({...prev, [targetDataset]: now}));
                  setDataSources(prev => ({...prev, [targetDataset]: 'cloud'}));
              }
              
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
      const totalAttendance = totalViewData.reduce((sum, game) => sum + game.attendance, 0);
      const totalCapacity = totalViewData.reduce((sum, game) => sum + game.capacity, 0);
      const avgAttendance = totalViewData.length > 0 ? totalAttendance / totalViewData.length : 0;
      const occupancyRate = totalCapacity > 0 ? (totalAttendance / totalCapacity) * 100 : 0;
      
      const totalGiveaways = totalViewData.reduce((sum, game) => {
         const ga = game.salesBreakdown.filter(s => s.channel === SalesChannel.GIVEAWAY || s.channel === SalesChannel.PROTOCOL);
         return sum + ga.reduce((acc, curr) => acc + curr.quantity, 0);
      }, 0);
      const giveawayRate = totalAttendance > 0 ? (totalGiveaways / totalAttendance) * 100 : 0;

      return { totalRevenue, avgAttendance, topPerformingZone: '', occupancyRate, giveawayRate };
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

  // Aggregate Game Day Revenue
  const gameDayRevenueNet = useMemo(() => {
      return filteredGameDayData.reduce((acc, game) => {
          return acc + (game.totalRevenue - game.tixRevenue);
      }, 0);
  }, [filteredGameDayData]);

  // Filtered Game Day Revenue for PACING WIDGET
  const filteredGameDayRevForPacing = useMemo(() => {
      return filteredGameDayData.reduce((acc, game) => {
          if (gameDayIncludeTicketing) {
              return acc + game.totalRevenue; 
          } 
          else {
              return acc + (game.totalRevenue - game.tixRevenue);
          }
      }, 0);
  }, [filteredGameDayData, gameDayIncludeTicketing]);

  // Sponsorship Stats for Executive Overview
  const sponsorshipStats = useMemo(() => {
      // Convert season filter format: "25-26" -> "25/26"
      const seasonMatch = selectedSeasons[0]?.replace('-', '/') || '25/26';
      const filteredSponsors = sponsorData.filter(s => s.season === seasonMatch);
      
      const totalSponsorRec = filteredSponsors.reduce((sum, d) => sum + d.sponsorReconciliation, 0);
      const totalCSR = filteredSponsors.reduce((sum, d) => sum + d.csrReconciliation, 0);
      const pureSponsorship = totalSponsorRec + totalCSR;
      const totalCommercial = filteredSponsors.reduce((sum, d) => sum + d.commercialValue, 0);
      
      return { pureSponsorship, totalCommercial, sponsorCount: filteredSponsors.length };
  }, [sponsorData, selectedSeasons]);

  const getAvailableOptions = (targetField: 'season' | 'league' | 'opponent' | 'tier' | 'day' | 'zone') => {
      // ... logic same as previous block ...
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

  // START INSERTION
  const allSeasons = useMemo(() => Array.from(new Set(data.map(d => d.season))).sort().reverse(), [data]);
  const allLeagues = useMemo(() => Array.from(new Set(data.map(d => d.league))).sort(), [data]);
  const allOpponents = useMemo(() => Array.from(new Set(data.map(d => d.opponent))).sort(), [data]);
  const allTiers = useMemo(() => Array.from(new Set(data.map(d => d.tier))).filter((t: any) => t > 0).map(String).sort((a: any,b: any)=>Number(a)-Number(b)), [data]);
  const allZones = useMemo(() => {
     const z = new Set<string>();
     data.forEach(g => g.salesBreakdown.forEach(s => z.add(s.zone)));
     return Array.from(z).sort();
  }, [data]);
  // END INSERTION

  const aiContext = useMemo(() => {
    if (activeModule === 'home') {
        const totalLiveTix = totalStats.totalRevenue; // Uses total stats (unaffected by viewMode)
        const totalLiveGD = filteredGameDayRevForPacing; // Uses filtered data
        
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
      {showReportModal && (
        <BoardReportModal 
            stats={totalStats} 
            data={totalViewData} 
            onClose={() => setShowReportModal(false)} 
            seasonTarget={SEASON_TARGET_TOTAL}
        />
      )}
      
      {/* Top Navigation */}
      <div className="fixed top-0 left-0 w-full bg-white border-b border-gray-200 h-16 z-50 px-6 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4 w-full md:w-auto">
             <button className="md:hidden text-gray-600 hover:bg-gray-100 p-2 rounded-lg" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                <Menu size={24} />
             </button>
             <div className="w-8 h-8 flex-shrink-0">
               <img src={PV_LOGO_URL} alt="PV" className="w-full h-full object-contain" />
             </div>
             
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
                            <button onClick={() => { setActiveTab('crm'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${activeTab === 'crm' ? 'bg-red-50 text-red-700 font-bold border border-red-100' : 'text-gray-600 hover:bg-gray-50'}`}>
                                <Users size={18} /> <span className="inline md:hidden lg:inline text-sm">CRM</span>
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
                            <strong className={`flex items-center gap-1 ${
                                activeModule === 'sponsorship' 
                                    ? (sponsorDataSource === 'cloud' ? 'text-green-600' : 'text-orange-600')
                                    : (dataSources[activeModule === 'gameday' ? 'gameday' : 'ticketing'] === 'cloud' ? 'text-green-600' : 'text-orange-600')
                            }`}>
                                {activeModule === 'sponsorship' 
                                    ? (sponsorDataSource === 'cloud' ? <Cloud size={10} /> : <Database size={10} />)
                                    : (dataSources[activeModule === 'gameday' ? 'gameday' : 'ticketing'] === 'cloud' ? <Cloud size={10} /> : <Database size={10} />)
                                }
                                {activeModule === 'sponsorship' 
                                    ? sponsorDataSource.toUpperCase()
                                    : dataSources[activeModule === 'gameday' ? 'gameday' : 'ticketing'].toUpperCase()
                                }
                            </strong>
                        </div>
                        <button onClick={triggerFileUpload} disabled={isUploading} className="w-full flex items-center justify-center gap-2 py-2 px-4 text-xs font-medium text-gray-600 bg-white hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors shadow-sm active:bg-gray-50 hover:shadow-md hover:text-gray-900">
                            {isUploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />} 
                            Upload {activeModule === 'gameday' ? 'GameDay' : activeModule === 'sponsorship' ? 'Sponsor' : 'Ticketing'} CSV
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
                sponsorshipRevenue={sponsorshipStats.pureSponsorship}
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
                                        <>Tracking <strong>Total Net Revenue</strong> against the <strong>€2.9M Budget</strong> (Includes Tix + Spons + TV + Variable).</>
                                    ) : (
                                        <>Tracking <strong>Net Revenue (Excl. Tix)</strong> against the <strong>€1.25M Budget</strong> (Includes Spons + TV + Variable).</>
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
                {activeTab === 'crm' && <CRMView />}
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
                                            {[...viewData].sort((a, b) => {
                                                const [da, ma, ya] = a.date.split('/').map(Number);
                                                const [db, mb, yb] = b.date.split('/').map(Number);
                                                const dateA = new Date(ya < 100 ? 2000 + ya : ya, ma - 1, da);
                                                const dateB = new Date(yb < 100 ? 2000 + yb : yb, mb - 1, db);
                                                return dateB.getTime() - dateA.getTime();
                                            }).map((game) => (
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
          ) : activeModule === 'sponsorship' ? (
              <div className="pt-6">
                <SponsorshipDashboard 
                  data={sponsorData}
                  onUploadCsv={async (content: string) => {
                    const newData = processSponsorData(content);
                    setSponsorData(newData);
                    if (isFirebaseConfigured) {
                      await saveCsvToFirebase('sponsor', content);
                      setSponsorDataSource('cloud');
                      setSponsorLastUpdated(new Date().toLocaleString());
                    }
                  }}
                  dataSource={sponsorDataSource}
                  lastUpdated={sponsorLastUpdated}
                />
              </div>
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
