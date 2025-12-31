
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { LayoutDashboard, MessageSquare, Upload, Filter, X, Loader2, ArrowLeftRight, Trash2 } from 'lucide-react';
import { DashboardChart } from './components/DashboardChart';
import { StatsCards } from './components/StatsCards';
import { ZoneTable } from './components/ZoneTable';
import { ArenaMap } from './components/ArenaMap'; // Imported ArenaMap
import { ChatInterface } from './components/ChatInterface';
import { ComparisonView } from './components/ComparisonView';
import { MultiSelect } from './components/MultiSelect';
import { TEAM_NAME, APP_NAME, GOOGLE_SHEET_CSV_URL } from './constants';
import { GameData, DashboardStats, SalesChannel } from './types';
import { FALLBACK_CSV_CONTENT } from './data/csvData';
import { processGameData } from './utils/dataProcessor';

const getDayName = (dateStr: string) => {
  const [day, month, year] = dateStr.split('/');
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  return date.toLocaleDateString('en-US', { weekday: 'short' });
};

const STORAGE_KEY = 'pv_app_csv_data';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'comparison' | 'chat'>('dashboard');
  const [data, setData] = useState<GameData[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [dataSource, setDataSource] = useState<'live' | 'local'>('local');
  const [hasStoredData, setHasStoredData] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Filters (Arrays for Multi-Select)
  const [selectedSeasons, setSelectedSeasons] = useState<string[]>(['25-26']);
  const [selectedLeagues, setSelectedLeagues] = useState<string[]>(['All']);
  const [selectedZones, setSelectedZones] = useState<string[]>(['All']);
  const [selectedOpponents, setSelectedOpponents] = useState<string[]>(['All']);
  const [selectedTiers, setSelectedTiers] = useState<string[]>(['All']);
  const [selectedDays, setSelectedDays] = useState<string[]>(['All']);

  const loadData = async () => {
    setIsLoadingData(true);
    let loadedData: GameData[] = [];
    let source: 'live' | 'local' = 'local';

    try {
      // 1. Priority: Check Local Storage (Persistence)
      const storedCsv = localStorage.getItem(STORAGE_KEY);
      if (storedCsv) {
        try {
          loadedData = processGameData(storedCsv);
          if (loadedData.length > 0) {
            console.log("Loaded data from Local Storage");
            setData(loadedData);
            setDataSource('local');
            setHasStoredData(true);
            setIsLoadingData(false);
            return; // Stop here, do not fetch live
          }
        } catch (e) {
          console.error("Stored data corrupted, clearing...", e);
          localStorage.removeItem(STORAGE_KEY);
        }
      }
      setHasStoredData(false);

      if (GOOGLE_SHEET_CSV_URL) {
        // Strategy 1: Direct Fetch with Cache Busting
        try {
          const cacheBuster = `&t=${Date.now()}`;
          const response = await fetch(GOOGLE_SHEET_CSV_URL + cacheBuster);
          if (response.ok) {
            const csvText = await response.text();
            loadedData = processGameData(csvText);
            if (loadedData.length > 0) {
                source = 'live';
                console.log("Successfully loaded LIVE data (Direct)");
            }
          } else {
             throw new Error("Direct fetch returned " + response.status);
          }
        } catch (directError) {
          console.warn("Direct fetch failed, attempting CORS proxy...", directError);
          
          // Strategy 2: CORS Proxy Fallback
          try {
            const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(GOOGLE_SHEET_CSV_URL)}`;
            const response = await fetch(proxyUrl);
            if (response.ok) {
                const csvText = await response.text();
                loadedData = processGameData(csvText);
                if (loadedData.length > 0) {
                    source = 'live';
                    console.log("Successfully loaded LIVE data (Proxy)");
                }
            }
          } catch (proxyError) {
             console.error("All fetch strategies failed", proxyError);
          }
        }
      }

      // Fallback if no live data loaded
      if (loadedData.length === 0) {
        console.log("Using LOCAL fallback data");
        loadedData = processGameData(FALLBACK_CSV_CONTENT);
        source = 'local';
      }

      setData(loadedData);
      setDataSource(source);

    } catch (error) {
      console.error("Critical error processing data:", error);
      // Last resort
      setData(processGameData(FALLBACK_CSV_CONTENT));
      setDataSource('local');
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

    setIsLoadingData(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) {
        try {
          const loadedData = processGameData(text);
          if (loadedData.length > 0) {
            setData(loadedData);
            setDataSource('local');
            // Persist to local storage
            localStorage.setItem(STORAGE_KEY, text);
            setHasStoredData(true);
          }
        } catch (error) {
          console.error("Error parsing uploaded CSV", error);
        } finally {
          setIsLoadingData(false);
        }
      }
    };
    reader.readAsText(file);
    // Reset input so same file can be selected again
    event.target.value = '';
  };

  const handleResetData = () => {
    if (window.confirm("Are you sure you want to clear the uploaded data and revert to the default/live feed?")) {
      localStorage.removeItem(STORAGE_KEY);
      setHasStoredData(false);
      loadData();
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  // Identify the latest game in the dataset (most recent date)
  const lastGame = useMemo(() => {
    if (data.length === 0) return null;
    // Clone and sort descending by date
    const sorted = [...data].sort((a, b) => {
         const [da, ma, ya] = a.date.split('/').map(Number);
         const [db, mb, yb] = b.date.split('/').map(Number);
         // Compare dates: B - A for descending
         return new Date(yb, mb-1, db).getTime() - new Date(ya, ma-1, da).getTime();
    });
    return sorted[0];
  }, [data]);

  // --- Cascading Filter Options Logic ---
  const getAvailableOptions = (targetField: 'season' | 'league' | 'opponent' | 'tier' | 'day' | 'zone') => {
      const filtered = data.filter(d => {
        // We filter by every field EXCEPT the target field to determine availability
        const matchSeason = targetField === 'season' || selectedSeasons.includes('All') || selectedSeasons.includes(d.season);
        const matchLeague = targetField === 'league' || selectedLeagues.includes('All') || selectedLeagues.includes(d.league);
        const matchOpponent = targetField === 'opponent' || selectedOpponents.includes('All') || selectedOpponents.includes(d.opponent);
        const matchTier = targetField === 'tier' || selectedTiers.includes('All') || selectedTiers.includes(String(d.tier));
        const matchDay = targetField === 'day' || selectedDays.includes('All') || selectedDays.includes(getDayName(d.date));
        
        // Note: selectedZones is treated as a View Slice, not a row filter for game availability, 
        // so we do not filter rows by selectedZones when calculating options for other fields.
        
        return matchSeason && matchLeague && matchOpponent && matchTier && matchDay;
      });

      const unique = new Set<string>();
      filtered.forEach(d => {
          if (targetField === 'season') unique.add(d.season);
          if (targetField === 'league') unique.add(d.league);
          if (targetField === 'opponent') unique.add(d.opponent);
          if (targetField === 'tier') unique.add(String(d.tier));
          if (targetField === 'day') unique.add(getDayName(d.date));
          if (targetField === 'zone') {
               d.salesBreakdown.forEach(s => unique.add(s.zone));
          }
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

  // Memoized Options
  const seasons = useMemo(() => getAvailableOptions('season'), [data, selectedLeagues, selectedOpponents, selectedTiers, selectedDays]);
  const leagues = useMemo(() => getAvailableOptions('league'), [data, selectedSeasons, selectedOpponents, selectedTiers, selectedDays]);
  const opponents = useMemo(() => getAvailableOptions('opponent'), [data, selectedSeasons, selectedLeagues, selectedTiers, selectedDays]);
  const tiers = useMemo(() => getAvailableOptions('tier'), [data, selectedSeasons, selectedLeagues, selectedOpponents, selectedDays]);
  const days = useMemo(() => getAvailableOptions('day'), [data, selectedSeasons, selectedLeagues, selectedOpponents, selectedTiers]);
  const zones = useMemo(() => getAvailableOptions('zone'), [data, selectedSeasons, selectedLeagues, selectedOpponents, selectedTiers, selectedDays]);


  // Filter AND Transform Data (View Data)
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
    
    // Calculate Total Giveaways for Rate
    const totalGiveaways = viewData.reduce((sum, game) => {
       const ga = game.salesBreakdown.filter(s => s.channel === SalesChannel.GIVEAWAY);
       return sum + ga.reduce((acc, curr) => acc + curr.quantity, 0);
    }, 0);

    const giveawayRate = totalAttendance > 0 ? (totalGiveaways / totalAttendance) * 100 : 0;
    
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

    return { totalRevenue, avgAttendance, topPerformingZone: topZone, occupancyRate, giveawayRate };
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

  // Provide initial full options for ComparisonView independently of dashboard cascading
  const allSeasons = useMemo(() => Array.from(new Set(data.map(d => d.season))).sort().reverse(), [data]);
  const allLeagues = useMemo(() => Array.from(new Set(data.map(d => d.league))).sort(), [data]);
  const allOpponents = useMemo(() => Array.from(new Set(data.map(d => d.opponent))).sort(), [data]);
  const allTiers = useMemo(() => Array.from(new Set(data.map(d => d.tier))).filter((t: any) => t > 0).map(String).sort((a,b)=>Number(a)-Number(b)), [data]);
  const allZones = useMemo(() => {
     const z = new Set<string>();
     data.forEach(g => g.salesBreakdown.forEach(s => z.add(s.zone)));
     return Array.from(z).sort();
  }, [data]);

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
            onClick={() => setActiveTab('comparison')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === 'comparison' 
                ? 'bg-red-50 text-red-700 font-medium shadow-sm' 
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <ArrowLeftRight size={20} />
            <span className="hidden lg:inline">Comparison</span>
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
           <input 
             type="file" 
             ref={fileInputRef} 
             onChange={handleFileUpload} 
             accept=".csv" 
             className="hidden" 
           />
           <button 
              onClick={triggerFileUpload}
              disabled={isLoadingData}
              className="w-full mb-3 flex items-center justify-center gap-2 py-2 px-4 text-xs font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors"
           >
              {isLoadingData ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              Upload CSV
           </button>

           {hasStoredData && (
             <button 
                onClick={handleResetData}
                className="w-full mb-4 flex items-center justify-center gap-2 py-2 px-4 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors"
             >
                <Trash2 size={14} />
                Reset to Default
             </button>
           )}
           
           {/* Last Game Info Only */}
           {!isLoadingData && lastGame && (
             <div className="bg-gray-100 rounded-xl p-4">
                <p className="text-[10px] text-gray-400 font-semibold uppercase mb-1">Latest Update</p>
                <div className="flex flex-col">
                    <span className="text-xs font-bold text-gray-800 truncate">{lastGame.opponent}</span>
                    <span className="text-[10px] text-gray-500">{lastGame.season} • {lastGame.date}</span>
                </div>
             </div>
           )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-x-hidden">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 py-4 px-6 flex flex-col sm:flex-row items-center justify-between sticky top-0 z-10 gap-4">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <h2 className="text-xl font-bold text-gray-800">
              {activeTab === 'dashboard' ? 'Season Overview' : (activeTab === 'comparison' ? 'Scenario Comparison' : 'Strategic Planning')}
            </h2>
          </div>
          
          <div className="hidden sm:block">
              {/* Spacer or future elements could go here. Bell/User removed as requested. */}
          </div>
        </header>

        {/* View Content */}
        <div className="p-6 max-w-7xl mx-auto">
          {activeTab === 'dashboard' && (
            <>
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
              
              {isLoadingData && data.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-96">
                    <Loader2 size={40} className="text-red-600 animate-spin mb-4" />
                    <p className="text-gray-500 font-medium">Loading sales data...</p>
                </div>
              ) : (
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

                  {/* Visual Analytics Section - Fixed Layout Overlap */}
                  <div className="mb-8">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Venue Intelligence</h2>
                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                        {/* Map Column - Fixed Height to prevent stretch */}
                        <div className="xl:col-span-5 h-[500px]">
                            <ArenaMap 
                                data={viewData} 
                                onZoneClick={handleZoneClick} 
                                selectedZone={selectedZones.includes('All') ? 'All' : selectedZones[0]} 
                            />
                        </div>

                        {/* Table Column - Fixed Height matching map, with scroll */}
                        <div className="xl:col-span-7 h-[500px] flex flex-col">
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
                  </div>
                  
                  <div className="mb-8 relative z-0">
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
              )}
            </>
          )}

          {activeTab === 'comparison' && (
            <ComparisonView 
              fullData={data} 
              options={{
                seasons: allSeasons,
                leagues: allLeagues,
                opponents: allOpponents,
                tiers: allTiers,
                zones: allZones
              }} 
            />
          )}

          {activeTab === 'chat' && (
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
