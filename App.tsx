import React, { useState, useMemo, useEffect, useRef } from 'react';
import { LayoutDashboard, MessageSquare, Upload, Filter, X, Loader2, ArrowLeftRight, Trash2, UserX, Cloud, CloudOff, Database, Settings, ExternalLink, Copy, AlertCircle, ShieldAlert, Save, Goal, Calendar, Briefcase, Calculator } from 'lucide-react';
import { DashboardChart } from './components/DashboardChart';
import { StatsCards } from './components/StatsCards';
import { ZoneTable } from './components/ZoneTable';
import { ArenaMap } from './components/ArenaMap'; 
import { ChatInterface, AIAvatar } from './components/ChatInterface';
import { ComparisonView } from './components/ComparisonView';
import { Simulator } from './components/Simulator';
import { MultiSelect } from './components/MultiSelect';
import { TargetSettingsModal } from './components/TargetSettingsModal';
import { PacingWidget } from './components/PacingWidget';
import { DistressedZones } from './components/DistressedZones';
import { CompKillerWidget } from './components/CompKillerWidget';
import { TEAM_NAME, APP_NAME, GOOGLE_SHEET_CSV_URL, PV_LOGO_URL, FIXED_CAPACITY_25_26, SEASON_TARGET_TOTAL, SEASON_TARGET_GAMEDAY } from './constants';
import { GameData, DashboardStats, SalesChannel, TicketZone, KPIConfig } from './types';
import { FALLBACK_CSV_CONTENT } from './data/csvData';
import { processGameData } from './utils/dataProcessor';
import { getCsvFromFirebase, saveCsvToFirebase } from './services/dbService';
import { isFirebaseConfigured } from './firebaseConfig';

const getDayName = (dateStr: string) => {
  const [day, month, year] = dateStr.split('/');
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  return date.toLocaleDateString('en-US', { weekday: 'short' });
};

const SetupModal = ({ onClose }: { onClose: () => void }) => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
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
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
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

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'comparison' | 'simulator' | 'chat'>('dashboard');
  const [data, setData] = useState<GameData[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [dataSource, setDataSource] = useState<'live' | 'cloud' | 'local'>('local');
  const [rawCsv, setRawCsv] = useState<string>(''); 
  const [lastUploadTime, setLastUploadTime] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(!isFirebaseConfigured);
  const [showRulesError, setShowRulesError] = useState(false);
  
  // New State: View Mode (Total vs Game Day)
  const [viewMode, setViewMode] = useState<'total' | 'gameday'>('total');

  // KPI Configuration
  const [showKpiModal, setShowKpiModal] = useState(false);
  const [kpiConfig, setKpiConfig] = useState<KPIConfig>({
    arpgGrowth: 10,
    yieldGrowth: 10,
    revPasGrowth: 10,
    occupancyGrowth: 10,
    giveawayTarget: 7,
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

  const loadData = async () => {
    setIsLoadingData(true);
    let loadedData: GameData[] = [];
    let source: 'live' | 'cloud' | 'local' = 'local';
    let loadedRaw = '';

    try {
      if (isFirebaseConfigured) {
        try {
          const cloudData = await getCsvFromFirebase();
          if (cloudData) {
            loadedData = processGameData(cloudData.content);
            if (loadedData.length > 0) {
              setData(loadedData);
              setDataSource('cloud');
              setRawCsv(cloudData.content);
              setLastUploadTime(cloudData.updatedAt);
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
            loadedData = processGameData(csvText);
            if (loadedData.length > 0) {
                source = 'live';
                loadedRaw = csvText;
            }
          }
        } catch (directError) {
          console.warn("Direct fetch failed", directError);
        }
      }

      if (loadedData.length === 0) {
        loadedData = processGameData(FALLBACK_CSV_CONTENT);
        loadedRaw = FALLBACK_CSV_CONTENT;
        source = 'local';
      }

      setData(loadedData);
      setDataSource(source);
      setRawCsv(loadedRaw);
      setLastUploadTime(null); 

    } catch (error) {
      console.error("Critical error processing data:", error);
      setData(processGameData(FALLBACK_CSV_CONTENT));
      setDataSource('local');
      setRawCsv(FALLBACK_CSV_CONTENT);
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
        event.target.value = ''; 
        return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      if (text) {
        try {
          const testData = processGameData(text);
          if (testData.length > 0) {
            try {
              await saveCsvToFirebase(text);
              setData(testData);
              setDataSource('cloud');
              setRawCsv(text);
              setLastUploadTime(new Date().toISOString());
              alert("Success! This file is now the default data.");
            } catch (dbError: any) {
              if (dbError.message === 'permission-denied') setShowRulesError(true);
              else alert("Database Error: " + dbError.message);
            }
          } else {
            alert("Error: The CSV file format seems invalid.");
          }
        } catch (error) {
          alert("Failed to upload data.");
        } finally {
          setIsUploading(false);
        }
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const handleSyncToCloud = async () => {
    if (!isFirebaseConfigured) { setShowSetupModal(true); return; }
    if (!rawCsv) { alert("No data to sync."); return; }

    setIsSyncing(true);
    try {
        await saveCsvToFirebase(rawCsv);
        setDataSource('cloud');
        setLastUploadTime(new Date().toISOString());
        alert("Synced successfully!");
    } catch (dbError: any) {
        if (dbError.message === 'permission-denied') setShowRulesError(true);
        else alert("Failed to sync: " + dbError.message);
    } finally {
        setIsSyncing(false);
    }
  };

  const triggerFileUpload = () => {
    if (!isFirebaseConfigured) { setShowSetupModal(true); return; }
    if (window.confirm("Uploading a file will update the database for ALL users. Continue?")) {
        fileInputRef.current?.click();
    }
  };

  // --- Filtering & Logic ---

  // Common filter logic
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

  // Dedicated Data for Efficiency Matrix (Always LOCKED to GameDay view logic)
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

      // Always deduct fixed capacity for this view
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
    
    // Count both types of giveaways based on view mode
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

  // Rest of app logic (Filters, Options, etc) remains the same
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
    return JSON.stringify({
      context_filter: { seasons: selectedSeasons, leagues: selectedLeagues, zones: selectedZones },
      view_mode: viewMode,
      totals: stats,
      games_in_view: viewData.length
    });
  }, [viewData, stats, selectedSeasons, selectedLeagues, selectedZones, viewMode]);

  const lastGame = useMemo(() => {
    if (data.length === 0) return null;
    const sorted = [...data].sort((a, b) => {
         const [da, ma, ya] = a.date.split('/').map(Number);
         const [db, mb, yb] = b.date.split('/').map(Number);
         return new Date(yb, mb-1, db).getTime() - new Date(ya, ma-1, da).getTime();
    });
    return sorted[0];
  }, [data]);

  // Filter change handlers...
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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {showSetupModal && <SetupModal onClose={() => setShowSetupModal(false)} />}
      {showRulesError && <RulesErrorModal onClose={() => { setShowRulesError(false); window.location.reload(); }} />}
      {showKpiModal && <TargetSettingsModal currentConfig={kpiConfig} onSave={setKpiConfig} onClose={() => setShowKpiModal(false)} />}
      
      {/* Sidebar */}
      <aside className="bg-white border-r border-gray-200 w-full md:w-20 lg:w-64 flex-shrink-0 flex flex-col sticky top-0 md:h-screen z-20">
        <div className="p-6 flex items-center gap-3 border-b border-gray-100">
           <div className="w-12 h-12 flex-shrink-0">
             <img src={PV_LOGO_URL} alt="Pallacanestro Varese" className="w-full h-full object-contain" />
           </div>
           <div className="hidden lg:block">
             <h1 className="font-bold text-gray-900">{APP_NAME}</h1>
             <p className="text-xs text-gray-500">Sales Intelligence</p>
           </div>
        </div>

        <nav className="p-4 space-y-2 flex-1">
          <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'dashboard' ? 'bg-red-50 text-red-700 font-medium shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}>
            <LayoutDashboard size={20} />
            <span className="hidden lg:inline">Dashboard</span>
          </button>
          <button onClick={() => setActiveTab('comparison')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'comparison' ? 'bg-red-50 text-red-700 font-medium shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}>
            <ArrowLeftRight size={20} />
            <span className="hidden lg:inline">Comparison</span>
          </button>
          <button onClick={() => setActiveTab('simulator')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'simulator' ? 'bg-red-50 text-red-700 font-medium shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}>
            <Calculator size={20} />
            <span className="hidden lg:inline">Simulator</span>
          </button>
          <button onClick={() => setActiveTab('chat')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'chat' ? 'bg-red-50 text-red-700 font-medium shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}>
            <MessageSquare size={20} />
            <span className="hidden lg:inline">AI Strategist</span>
          </button>
        </nav>

        {/* Data Source Controls */}
        <div className="p-4 border-t border-gray-100 hidden lg:block">
           <div className="flex items-center gap-2 mb-4 text-xs font-semibold uppercase text-gray-400">
              {dataSource === 'cloud' && <Cloud size={14} className="text-blue-500" />}
              {dataSource === 'local' && <CloudOff size={14} className="text-gray-500" />}
              {dataSource === 'live' && <span className="w-2 h-2 rounded-full bg-green-500"></span>}
              <span>Source: {dataSource}</span>
           </div>
           <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".csv" className="hidden" />
           {!isFirebaseConfigured ? (
             <button onClick={() => setShowSetupModal(true)} className="w-full mb-3 flex items-center justify-center gap-2 py-2 px-4 text-xs font-medium text-white bg-red-600 hover:bg-red-700 border border-transparent rounded-lg transition-colors shadow-sm animate-pulse">
                <Database size={14} /> Connect Database
             </button>
           ) : (
             <div className="space-y-2 mb-4">
                 {dataSource !== 'cloud' && (
                     <button onClick={handleSyncToCloud} disabled={isSyncing} className="w-full flex items-center justify-center gap-2 py-2 px-4 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 border border-transparent rounded-lg transition-colors shadow-sm">
                        {isSyncing ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Sync Data
                     </button>
                 )}
                 <button onClick={triggerFileUpload} disabled={isUploading} className="w-full flex items-center justify-center gap-2 py-2 px-4 text-xs font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors">
                    {isUploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />} Upload CSV
                 </button>
             </div>
           )}
           
           {!isLoadingData && lastGame && (
             <div className="bg-gray-100 rounded-xl p-4">
                <p className="text-[10px] text-gray-400 font-semibold uppercase mb-1">Data Version</p>
                <div className="flex flex-col">
                    {dataSource === 'cloud' && lastUploadTime ? (
                        <>
                            <span className="text-xs font-bold text-gray-800">{new Date(lastUploadTime).toLocaleDateString()}</span>
                            <span className="text-[10px] text-gray-500">{new Date(lastUploadTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </>
                    ) : (
                        <>
                            <span className="text-xs font-bold text-gray-800 truncate">{lastGame.opponent}</span>
                            <span className="text-[10px] text-gray-500">{lastGame.season} • {lastGame.date}</span>
                        </>
                    )}
                </div>
             </div>
           )}
        </div>
      </aside>

      <main className="flex-1 overflow-x-hidden">
        <header className="bg-white border-b border-gray-200 py-4 px-6 flex flex-col sm:flex-row items-center justify-between sticky top-0 z-10 gap-4">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <h2 className="text-xl font-bold text-gray-800">
              {activeTab === 'dashboard' ? 'Season Overview' : (activeTab === 'comparison' ? 'Scenario Comparison' : (activeTab === 'simulator' ? 'Strategy Simulator' : 'Strategic Planning'))}
            </h2>
          </div>
          
          {/* Global View Toggle (Total vs Game Day) */}
          {(activeTab === 'dashboard' || activeTab === 'comparison') && (
            <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200">
                <button 
                    onClick={() => setViewMode('total')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                        viewMode === 'total' 
                        ? 'bg-white text-gray-900 shadow-sm' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    <Briefcase size={14} />
                    Total View
                </button>
                <button 
                    onClick={() => setViewMode('gameday')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                        viewMode === 'gameday' 
                        ? 'bg-white text-red-600 shadow-sm' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    <Calendar size={14} />
                    GameDay Only
                </button>
            </div>
          )}
        </header>

        <div className="p-6 max-w-7xl mx-auto">
          {activeTab === 'dashboard' && (
            <>
              {/* DIRECTOR'S NOTE - MOVED TO TOP */}
              {!isLoadingData && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                    <div className="lg:col-span-2 relative bg-gradient-to-br from-red-700 to-slate-900 rounded-xl p-6 text-white shadow-lg overflow-hidden group border border-red-900">
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
                            seasonTarget={viewMode === 'gameday' ? SEASON_TARGET_GAMEDAY : SEASON_TARGET_TOTAL} 
                            totalGamesInSeason={15} // Approx
                        />
                    </div>
                </div>
              )}

              {/* Filter Bar */}
              <div className="mb-6 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-gray-500">
                      <Filter size={18} />
                      <span className="text-sm font-medium">Data Filters</span>
                  </div>
                  <div className="flex items-center gap-3">
                      <button onClick={() => setShowKpiModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors">
                        <Goal size={14} /> Set KPIs
                      </button>
                      <button onClick={() => setIgnoreOspiti(!ignoreOspiti)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${ignoreOspiti ? 'bg-red-50 text-red-700 border-red-200' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}>
                        <UserX size={14} /> {ignoreOspiti ? 'Zona Ospiti Excluded' : 'Ignore Zona Ospiti'}
                      </button>
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
                  <div><MultiSelect label="Zone" options={zones} selected={selectedZones} onChange={setSelectedZones} /></div>
                </div>
              </div>
              
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
                    kpiConfig={kpiConfig}
                    viewMode={viewMode}
                  />

                  <div className="mb-8">
                    <div className="flex justify-between items-end mb-4">
                        <h2 className="text-xl font-bold text-gray-800">Venue Intelligence</h2>
                    </div>
                    
                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                        {/* Map Area */}
                        <div className="xl:col-span-5 h-[500px]">
                            <ArenaMap 
                                data={viewData} 
                                onZoneClick={handleZoneClick} 
                                selectedZone={selectedZones.includes('All') ? 'All' : selectedZones[0]} 
                            />
                        </div>

                        {/* Distressed Zones & Comp Killer & Table Area */}
                        <div className="xl:col-span-7 h-[500px] flex flex-col gap-4">
                            {/* Top Row: Distress & Comp Killer (Side by Side) */}
                            <div className="flex-shrink-0 grid grid-cols-1 md:grid-cols-2 gap-4 h-40">
                                <DistressedZones data={viewData} />
                                <CompKillerWidget data={viewData} />
                            </div>

                            <div className="flex-1 overflow-hidden min-h-0">
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
            </>
          )}

          {activeTab === 'comparison' && (
            <ComparisonView fullData={data} options={{ seasons: allSeasons, leagues: allLeagues, opponents: allOpponents, tiers: allTiers, zones: allZones }} viewMode={viewMode} />
          )}

          {activeTab === 'simulator' && (
             <Simulator data={viewData} />
          )}

          {activeTab === 'chat' && (
             <div className="h-full animate-fade-in max-w-4xl mx-auto">
                <div className="mb-6 text-center">
                  <h2 className="text-2xl font-bold text-gray-900">Strategy Assistant</h2>
                  <p className="text-gray-500">Analyze "What If" scenarios for the current selection</p>
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