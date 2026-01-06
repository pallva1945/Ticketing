
import React, { useState, useMemo } from 'react';
import { GameData, SalesChannel } from '../types';
import { FIXED_CAPACITY_25_26 } from '../constants';
import { Calculator, TrendingUp, TrendingDown, RefreshCcw, Plus, Trash2, Sun, Snowflake, ArrowRight, Sparkles, Loader2, BrainCircuit } from 'lucide-react';
import { sendMessageToGemini } from '../services/geminiService';

interface SimulatorProps {
  data: GameData[];
}

type StrategyMode = 'SUMMER' | 'IN_SEASON';

interface Decision {
  id: string;
  zone: string;
  priceAdj: number;
  demandAdj: number;
  reasoning?: string;
}

export const Simulator: React.FC<SimulatorProps> = ({ data }) => {
  const [mode, setMode] = useState<StrategyMode>('IN_SEASON');
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Current Input State
  const [selectedZone, setSelectedZone] = useState<string>('Curva');
  const [priceAdjustment, setPriceAdjustment] = useState<number>(0);
  const [demandElasticity, setDemandElasticity] = useState<number>(0);

  const zones = useMemo(() => {
      const z = new Set<string>();
      data.forEach(g => g.salesBreakdown.forEach(s => z.add(s.zone)));
      return Array.from(z).sort();
  }, [data]);

  // Helper to filter data based on mode
  const getRelevantData = (games: GameData[]) => {
      return games.map(g => {
          let relevantSales = g.salesBreakdown;
          if (mode === 'SUMMER') {
              relevantSales = relevantSales.filter(s => s.channel === SalesChannel.ABB);
          } else {
              // Game Day: Tix, MP, VB (Exclude ABB, Corp, Protocol, Giveaway)
              relevantSales = relevantSales.filter(s => 
                  [SalesChannel.TIX, SalesChannel.MP, SalesChannel.VB].includes(s.channel)
              );
          }
          return { ...g, salesBreakdown: relevantSales };
      });
  };

  const processedData = useMemo(() => getRelevantData(data), [data, mode]);

  // Calculate Baseline for ALL zones (to show total impact)
  const baselineStats = useMemo(() => {
      const stats: Record<string, { totalRev: number, totalSold: number, maxCapacity: number }> = {};
      
      data.forEach(g => {
          // Get total capacity for zone from source data
          if (g.zoneCapacities) {
              Object.entries(g.zoneCapacities).forEach(([z, cap]) => {
                  if (!stats[z]) stats[z] = { totalRev: 0, totalSold: 0, maxCapacity: 0 };
                  if ((cap as number) > stats[z].maxCapacity) stats[z].maxCapacity = cap as number;
              });
          }
      });

      processedData.forEach(g => {
          g.salesBreakdown.forEach(s => {
              if (!stats[s.zone]) stats[s.zone] = { totalRev: 0, totalSold: 0, maxCapacity: 0 };
              stats[s.zone].totalRev += s.revenue;
              stats[s.zone].totalSold += s.quantity;
          });
      });

      const gameCount = data.length || 1;

      const zoneBaselines: Record<string, { avgPrice: number, avgVol: number, avgRev: number, totalCapacity: number }> = {};
      
      Object.entries(stats).forEach(([z, val]) => {
          const avgVol = val.totalSold / gameCount;
          const avgRev = val.totalRev / gameCount;
          const avgPrice = val.totalSold > 0 ? val.totalRev / val.totalSold : 0;
          zoneBaselines[z] = { avgPrice, avgVol, avgRev, totalCapacity: val.maxCapacity };
      });

      return zoneBaselines;
  }, [processedData, data]);

  const addDecision = () => {
      const newDecision: Decision = {
          id: Math.random().toString(36).substr(2, 9),
          zone: selectedZone,
          priceAdj: priceAdjustment,
          demandAdj: demandElasticity
      };
      setDecisions([...decisions, newDecision]);
      // Reset inputs slightly but keep zone for rapid entry if needed
      setPriceAdjustment(0);
      setDemandElasticity(0);
  };

  const removeDecision = (id: string) => {
      setDecisions(decisions.filter(d => d.id !== id));
  };

  const handleGenerateAIStrategy = async () => {
      setIsGenerating(true);
      try {
          const context = JSON.stringify(baselineStats);
          const prompt = `
            Act as a Revenue Manager. Analyze the following Zone Baseline Data (AvgPrice, AvgVol, TotalCapacity).
            Identify ONE zone with either high elasticity potential (raise price) or distress (lower price to fill).
            
            Return ONLY a valid JSON object with this format (no markdown, no other text):
            {
                "zone": "Exact Zone Name from list",
                "priceAdj": number (e.g. 5 or -2),
                "demandAdj": number (estimated % change in volume, e.g. -10 or 20),
                "reasoning": "Short strategic reason."
            }
          `;
          
          const response = await sendMessageToGemini(prompt, context);
          
          // Clean response to ensure valid JSON
          const cleanJson = response.replace(/```json/g, '').replace(/```/g, '').trim();
          const aiDecision = JSON.parse(cleanJson);

          if (aiDecision.zone && typeof aiDecision.priceAdj === 'number') {
              const newDecision: Decision = {
                  id: Math.random().toString(36).substr(2, 9),
                  zone: aiDecision.zone,
                  priceAdj: aiDecision.priceAdj,
                  demandAdj: aiDecision.demandAdj || 0,
                  reasoning: aiDecision.reasoning
              };
              setDecisions(prev => [...prev, newDecision]);
          } else {
              alert("AI could not generate a valid strategy. Try again.");
          }

      } catch (error) {
          console.error("AI Strategy Error", error);
          alert("AI Consultant is offline. Please input manually.");
      } finally {
          setIsGenerating(false);
      }
  };

  // Calculate Cumulative Impact with Constraints
  const simulationResults = useMemo(() => {
      let totalBaselineRev = 0;
      let totalNewRev = 0;
      
      const zoneModifications: Record<string, { priceDelta: number, volDeltaPercent: number }> = {};
      
      decisions.forEach(d => {
          if (!zoneModifications[d.zone]) zoneModifications[d.zone] = { priceDelta: 0, volDeltaPercent: 0 };
          zoneModifications[d.zone].priceDelta += d.priceAdj;
          zoneModifications[d.zone].volDeltaPercent += d.demandAdj;
      });

      Object.keys(baselineStats).forEach(z => {
          const base = baselineStats[z];
          totalBaselineRev += base.avgRev;

          const mod = zoneModifications[z];
          if (mod) {
              const newPrice = Math.max(0, base.avgPrice + mod.priceDelta);
              
              // CAPACITY CONSTRAINT LOGIC
              let availableCapacity = base.totalCapacity;
              if (mode === 'IN_SEASON') {
                  // If In-Season, available capacity is Total - Fixed (Summer Sales)
                  const fixedSold = FIXED_CAPACITY_25_26[z] || 0;
                  availableCapacity = Math.max(0, base.totalCapacity - fixedSold);
              }
              // If Summer, available capacity is full stadium (theoretical max)

              const calculatedVol = Math.max(0, base.avgVol * (1 + mod.volDeltaPercent / 100));
              
              // Apply Cap
              const finalVol = Math.min(calculatedVol, availableCapacity);

              totalNewRev += (newPrice * finalVol);
          } else {
              totalNewRev += base.avgRev;
          }
      });

      return {
          baselineRev: totalBaselineRev,
          newRev: totalNewRev,
          netImpact: totalNewRev - totalBaselineRev
      };
  }, [baselineStats, decisions, mode]);

  // Preview Calculation for Input Form (Duplicates logic for single zone preview)
  const currentZoneBaseline = baselineStats[selectedZone] || { avgPrice: 0, avgVol: 0, avgRev: 0, totalCapacity: 0 };
  
  const previewNewPrice = Math.max(0, currentZoneBaseline.avgPrice + priceAdjustment);
  
  let previewAvailableCap = currentZoneBaseline.totalCapacity;
  if (mode === 'IN_SEASON') {
      const fixedSold = FIXED_CAPACITY_25_26[selectedZone] || 0;
      previewAvailableCap = Math.max(0, currentZoneBaseline.totalCapacity - fixedSold);
  }

  const previewCalculatedVol = Math.max(0, currentZoneBaseline.avgVol * (1 + demandElasticity / 100));
  const previewFinalVol = Math.min(previewCalculatedVol, previewAvailableCap);
  
  const previewImpact = (previewNewPrice * previewFinalVol) - currentZoneBaseline.avgRev;
  const isCapped = previewCalculatedVol > previewAvailableCap;
  
  // Calculate percentage of bar to be "capped" (red)
  const capOverflowWidth = isCapped ? Math.min(((previewCalculatedVol - previewAvailableCap) / previewAvailableCap) * 100, 100) : 0;

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in pb-12">
        {/* Header & Mode Switch */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-100 rounded-xl text-indigo-700 shadow-sm">
                    <Calculator size={28} />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Strategy Simulator</h2>
                    <p className="text-gray-500 text-sm">Build a comprehensive pricing strategy.</p>
                </div>
            </div>
            
            <div className="bg-gray-100 p-1 rounded-xl flex gap-1 border border-gray-200">
                <button 
                    onClick={() => { setMode('SUMMER'); setDecisions([]); }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                        mode === 'SUMMER' 
                        ? 'bg-white text-orange-600 shadow-sm border border-gray-100' 
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                >
                    <Sun size={16} />
                    Summer (Season Tix)
                </button>
                <button 
                    onClick={() => { setMode('IN_SEASON'); setDecisions([]); }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                        mode === 'IN_SEASON' 
                        ? 'bg-white text-blue-600 shadow-sm border border-gray-100' 
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                >
                    <Snowflake size={16} />
                    In-Season (Game Day)
                </button>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* LEFT COLUMN: Input Form */}
            <div className="lg:col-span-4 space-y-6">
                
                {/* AI Button */}
                <button 
                    onClick={handleGenerateAIStrategy}
                    disabled={isGenerating}
                    className="w-full py-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2 border border-white/20 relative overflow-hidden group"
                >
                    {isGenerating ? (
                        <>
                            <Loader2 size={18} className="animate-spin" />
                            Calculating...
                        </>
                    ) : (
                        <>
                            <BrainCircuit size={18} className="group-hover:animate-pulse" />
                            Auto-Generate Strategy (AI)
                        </>
                    )}
                    <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                </button>

                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500"></div>
                    <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <Plus size={18} className="text-indigo-500" />
                        Manual Adjustment
                    </h3>

                    <div className="space-y-5">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Zone</label>
                            <select 
                                value={selectedZone}
                                onChange={(e) => setSelectedZone(e.target.value)}
                                className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-gray-50 font-medium"
                            >
                                {zones.map(z => <option key={z} value={z}>{z}</option>)}
                            </select>
                        </div>

                        <div>
                            <div className="flex justify-between mb-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Price Adj. (€)</label>
                                <span className={`text-xs font-bold px-2 py-0.5 rounded ${priceAdjustment > 0 ? 'bg-green-100 text-green-700' : (priceAdjustment < 0 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500')}`}>
                                    {priceAdjustment > 0 ? '+' : ''}{priceAdjustment}€
                                </span>
                            </div>
                            <input 
                                type="range" min="-20" max="20" step="1" 
                                value={priceAdjustment}
                                onChange={(e) => setPriceAdjustment(parseFloat(e.target.value))}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                            />
                        </div>

                        <div>
                            <div className="flex justify-between mb-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Demand Impact (%)</label>
                                <span className={`text-xs font-bold px-2 py-0.5 rounded ${demandElasticity > 0 ? 'bg-green-100 text-green-700' : (demandElasticity < 0 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500')}`}>
                                    {demandElasticity > 0 ? '+' : ''}{demandElasticity}%
                                </span>
                            </div>
                            <input 
                                type="range" min="-50" max="100" step="5" 
                                value={demandElasticity}
                                onChange={(e) => setDemandElasticity(parseFloat(e.target.value))}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            />
                        </div>

                        <div className="p-4 bg-gray-50 rounded-xl border border-dashed border-gray-300 relative overflow-hidden">
                            <div className="flex justify-between items-center text-sm mb-1 relative z-10">
                                <span className="text-gray-500">Current Yield:</span>
                                <span className="font-mono text-gray-700">€{currentZoneBaseline.avgPrice.toFixed(1)}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm font-bold relative z-10">
                                <span className="text-gray-800">Proj. Impact:</span>
                                <span className={`${previewImpact >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {previewImpact > 0 ? '+' : ''}€{Math.round(previewImpact).toLocaleString()}
                                </span>
                            </div>
                            
                            {isCapped && (
                                <div className="mt-2 text-[10px] text-white bg-red-500 px-2 py-1 rounded font-bold text-center border border-red-600 relative z-10 animate-pulse">
                                    UNFULFILLED DEMAND: {Math.round(previewCalculatedVol - previewAvailableCap)} SEATS LOST
                                </div>
                            )}

                            {/* Visual Bar for Capacity */}
                            <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden flex relative">
                                <div className="h-full bg-indigo-500" style={{ width: `${Math.min((previewFinalVol / previewAvailableCap) * 100, 100)}%` }}></div>
                                {isCapped && (
                                    <div 
                                      className="h-full bg-[repeating-linear-gradient(45deg,red,red_5px,white_5px,white_10px)] opacity-70"
                                      style={{ width: '100%' }} // Fill remaining space implies overflow
                                    ></div>
                                )}
                            </div>
                            <div className="flex justify-between text-[9px] text-gray-400 mt-1">
                                <span>0</span>
                                <span>Cap: {Math.round(previewAvailableCap)}</span>
                            </div>
                        </div>

                        <button 
                            onClick={addDecision}
                            className="w-full py-3 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-xl font-bold text-sm transition-all shadow-sm active:scale-95 flex items-center justify-center gap-2"
                        >
                            Add to List <ArrowRight size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* RIGHT COLUMN: Strategy Overview */}
            <div className="lg:col-span-8 space-y-6">
                
                {/* Scoreboard */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Baseline Rev (Avg)</p>
                        <p className="text-2xl font-bold text-gray-900">€{Math.round(simulationResults.baselineRev).toLocaleString()}</p>
                    </div>
                    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden">
                        <div className={`absolute top-0 right-0 p-4 opacity-10 ${simulationResults.netImpact >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {simulationResults.netImpact >= 0 ? <TrendingUp size={48} /> : <TrendingDown size={48} />}
                        </div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Projected Rev (Avg)</p>
                        <p className={`text-2xl font-bold ${simulationResults.netImpact >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                            €{Math.round(simulationResults.newRev).toLocaleString()}
                        </p>
                    </div>
                    <div className={`p-5 rounded-xl border shadow-sm flex flex-col justify-center ${simulationResults.netImpact >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                        <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${simulationResults.netImpact >= 0 ? 'text-green-700' : 'text-red-700'}`}>Net Impact / Game</p>
                        <div className="flex items-baseline gap-1">
                            <span className={`text-2xl font-extrabold ${simulationResults.netImpact >= 0 ? 'text-green-800' : 'text-red-800'}`}>
                                {simulationResults.netImpact > 0 ? '+' : ''}€{Math.round(simulationResults.netImpact).toLocaleString()}
                            </span>
                        </div>
                        <p className={`text-[10px] font-medium mt-1 ${simulationResults.netImpact >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            Season Est: {simulationResults.netImpact > 0 ? '+' : ''}€{Math.round(simulationResults.netImpact * 15).toLocaleString()}
                        </p>
                    </div>
                </div>

                {/* Decision List */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm min-h-[300px] flex flex-col">
                    <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl">
                        <h3 className="font-bold text-gray-800">Active Decisions</h3>
                        <span className="text-xs font-medium px-2 py-1 bg-white border border-gray-200 rounded text-gray-500">
                            {decisions.length} Applied
                        </span>
                    </div>
                    
                    <div className="flex-1 p-2">
                        {decisions.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-3 opacity-60 min-h-[200px]">
                                <Calculator size={40} />
                                <p className="text-sm">No decisions added yet.</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {decisions.map((d) => (
                                    <div key={d.id} className="group flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl hover:shadow-md transition-all hover:border-indigo-100">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-xs">
                                                {d.zone.substring(0, 2).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900 text-sm">{d.zone}</p>
                                                <div className="flex items-center gap-3 text-xs mt-0.5">
                                                    <span className={`${d.priceAdj > 0 ? 'text-green-600' : 'text-red-600'} font-medium bg-gray-50 px-1.5 rounded`}>
                                                        Price: {d.priceAdj > 0 ? '+' : ''}{d.priceAdj}€
                                                    </span>
                                                    <span className={`${d.demandAdj > 0 ? 'text-green-600' : 'text-red-600'} font-medium bg-gray-50 px-1.5 rounded`}>
                                                        Vol: {d.demandAdj > 0 ? '+' : ''}{d.demandAdj}%
                                                    </span>
                                                </div>
                                                {d.reasoning && (
                                                    <p className="text-[10px] text-indigo-600 mt-1 italic flex items-center gap-1">
                                                        <Sparkles size={8} /> {d.reasoning}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => removeDecision(d.id)}
                                            className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    
                    {decisions.length > 0 && (
                        <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
                            <button onClick={() => setDecisions([])} className="text-xs text-red-600 font-bold hover:underline flex items-center gap-1">
                                <RefreshCcw size={12} /> Clear Strategy
                            </button>
                        </div>
                    )}
                </div>

            </div>
        </div>
    </div>
  );
};
