import React, { useState, useMemo, useEffect } from 'react';
import { LayoutDashboard, MessageSquare, Upload, Bell, Filter, X } from 'lucide-react';
import { DashboardChart } from './components/DashboardChart';
import { StatsCards } from './components/StatsCards';
import { ZoneTable } from './components/ZoneTable';
import { ChatInterface } from './components/ChatInterface';
import { MultiSelect } from './components/MultiSelect';
import { TEAM_NAME, APP_NAME, MAX_CAPACITY } from './constants';
import { GameData, DashboardStats, TicketZone } from './types';
import { CSV_CONTENT } from './data/csvData';
import { processGameData } from './utils/dataProcessor';

const getDayName = (dateStr: string) => {
  const [day, month, year] = dateStr.split('/');
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  return date.toLocaleDateString('en-US', { weekday: 'short' });
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'chat'>('dashboard');
  const [data, setData] = useState<GameData[]>([]);
  
  // Filters (Arrays for Multi-Select)
  const [selectedSeasons, setSelectedSeasons] = useState<string[]>(['25-26']);
  const [selectedLeagues, setSelectedLeagues] = useState<string[]>(['All']);
  const [selectedZones, setSelectedZones] = useState<string[]>(['All']);
  const [selectedOpponents, setSelectedOpponents] = useState<string[]>(['All']);
  const [selectedTiers, setSelectedTiers] = useState<string[]>(['All']);
  const [selectedDays, setSelectedDays] = useState<string[]>(['All']);

  useEffect(() => {
    // Process the CSV data on mount
    const processed = processGameData(CSV_CONTENT);
    setData(processed);
  }, []);

  // Extract unique filtering options
  const seasons = useMemo(() => {
    const s = Array.from(new Set(data.map(d => d.season))).sort().reverse();
    return s;
  }, [data]);

  const leagues = useMemo(() => {
    const l = Array.from(new Set(data.map(d => d.league))).sort();
    return l;
  }, [data]);

  const zones = useMemo(() => {
    // Get all unique zones present in the sales breakdown across all games
    const allZones = new Set<string>();
    data.forEach(g => g.salesBreakdown.forEach(s => allZones.add(s.zone)));
    return Array.from(allZones).sort();
  }, [data]);

  const opponents = useMemo(() => {
    const o = Array.from(new Set(data.map(d => d.opponent))).sort();
    return o;
  }, [data]);

  const tiers = useMemo(() => {
    // Tiers are numbers in data, convert to string for the filter
    const t = Array.from(new Set(data.map(d => d.tier)))
        .filter((t: number) => t > 0) // Filter out 0/Unknown if relevant, or keep them
        .sort((a: number, b: number) => a - b)
        .map(String);
    return t;
  }, [data]);

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Filter AND Transform Data
  const viewData = useMemo(() => {
    // 1. Filter Games by Season, League, Opponent, Tier, and Day
    const filteredGames = data.filter(d => {
      const matchSeason = selectedSeasons.includes('All') || selectedSeasons.includes(d.season);
      const matchLeague = selectedLeagues.includes('All') || selectedLeagues.includes(d.league);
      const matchOpponent = selectedOpponents.includes('All') || selectedOpponents.includes(d.opponent);
      const matchTier = selectedTiers.includes('All') || selectedTiers.includes(String(d.tier));
      const matchDay = selectedDays.includes('All') || selectedDays.includes(getDayName(d.date));
      return matchSeason && matchLeague && matchOpponent && matchTier && matchDay;
    });

    // 2. Transform Data based on Selected Zones
    // If 'All' zones selected, use the game as is.
    // If specific zones selected, transform the game to only sum those zones.
    if (selectedZones.includes('All')) {
      return filteredGames;
    }

    return filteredGames.map(game => {
      // Filter the breakdown for selected zones
      const zoneSales = game.salesBreakdown.filter(s => selectedZones.includes(s.zone));
      
      // Recalculate totals for this slice
      const zoneRevenue = zoneSales.reduce((acc, curr) => acc + curr.revenue, 0);
      const zoneAttendance = zoneSales.reduce((acc, curr) => acc + curr.quantity, 0);

      // Recalculate Capacity for this slice
      let zoneCapacity = 0;
      if (game.zoneCapacities) {
        selectedZones.forEach(z => {
             zoneCapacity += (game.zoneCapacities[z] || 0);
        });
      }

      // Return a new game object that looks like the original but represents only the zone slice
      return {
        ...game,
        attendance: zoneAttendance,
        totalRevenue: zoneRevenue,
        capacity: zoneCapacity, // Important override for occupancy calculation
        salesBreakdown: zoneSales
      };
    });
  }, [data, selectedSeasons, selectedLeagues, selectedZones, selectedOpponents, selectedTiers, selectedDays]);

  // Calculate Statistics based on View Data
  const stats: DashboardStats = useMemo(() => {
    const totalRevenue = viewData.reduce((sum, game) => sum + game.totalRevenue, 0);
    const totalAttendance = viewData.reduce((sum, game) => sum + game.attendance, 0);
    const totalCapacity = viewData.reduce((sum, game) => sum + game.capacity, 0);
    const avgAttendance = viewData.length > 0 ? totalAttendance / viewData.length : 0;
    
    // Find top zone (simplified calculation based on the visible slice)
    const zoneCounts: Record<string, number> = {};
    viewData.forEach(game => {
      game.salesBreakdown.forEach(pt => {
        zoneCounts[pt.zone] = (zoneCounts[pt.zone] || 0) + pt.quantity;
      });
    });
    
    const topZone = Object.entries(zoneCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
    
    // Occupancy relative to dynamic capacity
    const occupancyRate = totalCapacity > 0 ? (totalAttendance / totalCapacity) * 100 : 0;

    return { totalRevenue, avgAttendance, topPerformingZone: topZone, occupancyRate };
  }, [viewData]);

  // Prepare context string for AI
  const aiContext = useMemo(() => {
    const recentGames = viewData.slice(-5).map(g => ({
      opponent: g.opponent,
      date: g.date,
      revenue: g.totalRevenue,
      attendance: g.attendance,
      yield: g.attendance > 0 ? (g.totalRevenue / g.attendance).toFixed(2) : 0
    }));

    return JSON.stringify({
      context_filter: { 
        seasons: selectedSeasons, 
        leagues: selectedLeagues, 
        zones: selectedZones,
        opponents: selectedOpponents,
        tiers: selectedTiers,
        days: selectedDays
      },
      games_in_view: viewData.length,
      totals: stats,
      recent_performance: recentGames,
    });
  }, [viewData, stats, selectedSeasons, selectedLeagues, selectedZones, selectedOpponents, selectedTiers, selectedDays]);

  const getFilterSummary = () => {
    let summary = [];
    if (!selectedSeasons.includes('All')) summary.push(`${selectedSeasons.length} Seasons`);
    else summary.push('All Seasons');

    if (!selectedLeagues.includes('All')) summary.push(`${selectedLeagues.length} Leagues`);
    
    if (!selectedOpponents.includes('All')) {
        if (selectedOpponents.length === 1) summary.push(selectedOpponents[0]);
        else summary.push(`${selectedOpponents.length} Opponents`);
    }

    if (!selectedTiers.includes('All')) {
        summary.push(`Tier ${selectedTiers.join(', ')}`);
    }
    
    if (!selectedDays.includes('All')) {
        summary.push(`${selectedDays.join(', ')}`);
    }

    if (!selectedZones.includes('All')) {
       if (selectedZones.length === 1) summary.push(selectedZones[0]);
       else summary.push(`${selectedZones.length} Zones`);
    } else {
       summary.push('Entire Arena');
    }
    
    return summary.join(' • ');
  };
  
  const hasActiveFilters = 
    !selectedSeasons.includes('All') || 
    !selectedLeagues.includes('All') || 
    !selectedZones.includes('All') || 
    !selectedOpponents.includes('All') || 
    !selectedTiers.includes('All') || 
    !selectedDays.includes('All');

  const clearFilters = () => {
    setSelectedSeasons(['25-26']);
    setSelectedLeagues(['All']);
    setSelectedZones(['All']);
    setSelectedOpponents(['All']);
    setSelectedTiers(['All']);
    setSelectedDays(['All']);
  };

  const handleChartFilterChange = (type: 'opponent' | 'tier' | 'day', value: string) => {
    if (!value) return;

    if (type === 'opponent') {
       if (selectedOpponents.includes(value) && selectedOpponents.length === 1) {
           setSelectedOpponents(['All']); // Toggle off
       } else {
           setSelectedOpponents([value]);
       }
    }
    if (type === 'tier') {
       if (selectedTiers.includes(value) && selectedTiers.length === 1) {
           setSelectedTiers(['All']); // Toggle off
       } else {
           setSelectedTiers([value]);
       }
    }
    if (type === 'day') {
       if (selectedDays.includes(value) && selectedDays.length === 1) {
           setSelectedDays(['All']); // Toggle off
       } else {
           setSelectedDays([value]);
       }
    }
  };

  const handleZoneClick = (zone: string) => {
     if (selectedZones.includes(zone) && selectedZones.length === 1) {
         setSelectedZones(['All']);
     } else {
         setSelectedZones([zone]);
     }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Sidebar Navigation */}
      <aside className="bg-white border-r border-gray-200 w-full md:w-20 lg:w-64 flex-shrink-0 flex flex-col sticky top-0 md:h-screen z-20">
        <div className="p-6 flex items-center gap-3 border-b border-gray-100">
           <div className="w-12 h-12 flex-shrink-0">
             <img 
               src="https://i.imgur.com/r1fWDF1.png" 
               alt="Pallacanestro Varese" 
               className="w-full h-full object-contain"
             />
           </div>
           <div className="hidden lg:block">
             <h1 className="font-bold text-gray-900">{APP_NAME}</h1>
             <p className="text-xs text-gray-500">Sales Intelligence</p>
           </div>
        </div>

        <nav className="p-4 space-y-2 flex-1">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === 'dashboard' 
                ? 'bg-red-50 text-red-700 font-medium shadow-sm' 
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <LayoutDashboard size={20} />
            <span className="hidden lg:inline">Dashboard</span>
          </button>
          <button 
            onClick={() => setActiveTab('chat')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === 'chat' 
                ? 'bg-red-50 text-red-700 font-medium shadow-sm' 
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <MessageSquare size={20} />
            <span className="hidden lg:inline">AI Strategist</span>
          </button>
        </nav>

        <div className="p-4 border-t border-gray-100 hidden lg:block">
           <div className="bg-gray-100 rounded-xl p-4">
             <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Data Status</h4>
             <div className="flex items-center gap-2 text-sm text-gray-700">
               <span className="w-2 h-2 rounded-full bg-green-500"></span>
               {viewData.length} Matches in View
             </div>
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-x-hidden">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 py-4 px-6 flex flex-col sm:flex-row items-center justify-between sticky top-0 z-10 gap-4">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <h2 className="text-xl font-bold text-gray-800">
              {activeTab === 'dashboard' ? 'Season Overview' : 'Strategic Planning'}
            </h2>
          </div>
          
          <div className="flex items-center gap-4 w-full sm:w-auto justify-end">
            <button className="p-2 text-gray-400 hover:text-red-600 transition-colors relative">
              <Bell size={20} />
              <span className="absolute top-1 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
            </button>
            <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white shadow-sm overflow-hidden">
               <img src="https://picsum.photos/100/100" alt="User" className="w-full h-full object-cover" />
            </div>
          </div>
        </header>

        {/* View Content */}
        <div className="p-6 max-w-7xl mx-auto">
          {/* Filters Bar */}
          <div className="mb-6 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
               <div className="flex items-center gap-2 text-gray-500">
                  <Filter size={18} />
                  <span className="text-sm font-medium">Data Filters</span>
               </div>
               {hasActiveFilters && (
                  <button 
                    onClick={clearFilters}
                    className="flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-800 transition-colors"
                  >
                    <X size={14} />
                    Clear All
                  </button>
               )}
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
               <div>
                  <MultiSelect 
                    label="Season" 
                    options={seasons} 
                    selected={selectedSeasons} 
                    onChange={setSelectedSeasons} 
                  />
               </div>
               
               <div>
                  <MultiSelect 
                    label="League" 
                    options={leagues} 
                    selected={selectedLeagues} 
                    onChange={setSelectedLeagues} 
                  />
               </div>

               <div>
                  <MultiSelect 
                    label="Tier" 
                    options={tiers} 
                    selected={selectedTiers} 
                    onChange={setSelectedTiers} 
                  />
               </div>

               <div>
                  <MultiSelect 
                    label="Opponent" 
                    options={opponents} 
                    selected={selectedOpponents} 
                    onChange={setSelectedOpponents} 
                  />
               </div>
               
               <div>
                  <MultiSelect 
                    label="Day" 
                    options={days} 
                    selected={selectedDays} 
                    onChange={setSelectedDays} 
                  />
               </div>

               <div>
                  <MultiSelect 
                    label="Zone" 
                    options={zones} 
                    selected={selectedZones} 
                    onChange={setSelectedZones} 
                  />
               </div>
            </div>
          </div>

          {activeTab === 'dashboard' ? (
            <div className="animate-fade-in space-y-6">
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900">{TEAM_NAME}</h1>
                <p className="text-gray-500 mt-1 font-medium">
                  {getFilterSummary()}
                </p>
              </div>
              
              <StatsCards 
                stats={stats} 
                data={viewData} 
                fullDataset={data} 
                filters={{ 
                  season: selectedSeasons, 
                  league: selectedLeagues, 
                  zone: selectedZones, 
                  opponent: selectedOpponents,
                  tier: selectedTiers 
                }} 
              />

              {/* Table / List Section */}
              <div className="mb-8">
                 <div className="flex flex-col gap-6">
                    {selectedZones.includes('All') ? (
                      <ZoneTable data={viewData} onZoneClick={handleZoneClick} />
                    ) : (
                      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden h-full">
                        <div className="p-4 border-b border-gray-100 font-semibold text-gray-700 flex justify-between items-center">
                          <div className="flex items-center gap-2">
                             <span>Detailed Games Log (Filtered Zone)</span>
                             <button onClick={() => setSelectedZones(['All'])} className="text-xs text-red-600 hover:underline ml-2">(Show All Zones)</button>
                          </div>
                          <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-500">{viewData.length} Games</span>
                        </div>
                        <div className="divide-y divide-gray-50 overflow-y-auto max-h-[500px]">
                          {[...viewData].reverse().map((game) => (
                            <div key={game.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                              <div>
                                <p className="font-medium text-gray-900">{game.opponent}</p>
                                <p className="text-xs text-gray-400">{game.date} • {game.season}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-gray-900">€{(game.totalRevenue/1000).toFixed(1)}k</p>
                                <p className="text-xs text-gray-500">
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
              
              <div className="mb-8">
                 <h2 className="text-xl font-bold text-gray-800 mb-4">
                   Trend & Performance Analysis
                 </h2>
                 <p className="text-xs text-gray-400 mb-4">Click on charts to filter data</p>
                 <DashboardChart data={viewData} onFilterChange={handleChartFilterChange} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {/* Quick Insight Card */}
                 <div className="bg-gradient-to-br from-red-600 to-red-800 rounded-xl p-6 text-white shadow-lg">
                    <h3 className="font-bold text-lg mb-2">Director's Note</h3>
                    <p className="text-red-100 text-sm leading-relaxed mb-4">
                      {viewData.length > 0 ? (
                        <>
                          Analyzing <strong>{viewData.length} games</strong> matching your criteria.
                          {!selectedOpponents.includes('All') && selectedSeasons.length > 1 
                            ? ` You are currently viewing a YoY comparison for ${selectedOpponents.length === 1 ? selectedOpponents[0] : 'selected opponents'}. Analyze the revenue variance across seasons.` 
                            : ` The general trend shows a variance in attendance. Monitor the Yield KPI across different zones.`
                          }
                        </>
                      ) : (
                        "No data matches your current filter selection."
                      )}
                    </p>
                    <button 
                      onClick={() => setActiveTab('chat')}
                      className="bg-white text-red-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-100 transition-colors"
                    >
                      Ask AI for Strategy
                    </button>
                 </div>
              </div>
            </div>
          ) : (
            <div className="h-full animate-fade-in max-w-4xl mx-auto">
              <div className="mb-6 text-center">
                 <h2 className="text-2xl font-bold text-gray-900">Strategy Assistant</h2>
                 <p className="text-gray-500">
                   Analyze "What If" scenarios for the current selection
                 </p>
              </div>
              <ChatInterface contextData={aiContext} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;