import React, { useMemo, useState } from 'react';
import { GameData, TicketZone, SalesChannel } from '../types';
import { PV_LOGO_URL } from '../constants';

// Channel filters for view modes
// GameDay: TIX + MP + VB + FREE (giveaways without protocol)
// Total: TIX + MP + VB + FREE + PROTOCOL + CORP + ABB
const GAMEDAY_CHANNELS = [SalesChannel.TIX, SalesChannel.MP, SalesChannel.VB, SalesChannel.GIVEAWAY];
const TOTAL_CHANNELS = [SalesChannel.TIX, SalesChannel.MP, SalesChannel.VB, SalesChannel.GIVEAWAY, SalesChannel.PROTOCOL, SalesChannel.CORP, SalesChannel.ABB];

interface ArenaMapProps {
  data: GameData[];
  onZoneClick: (zone: string) => void;
  selectedZone: string;
  viewMode?: 'gameday' | 'total';
}

interface ZoneMetrics {
  revenue: number;
  sold: number;
  capacity: number;
}

type MapMetric = 'revenue' | 'occupancy' | 'yield';
type ViewMode = 'gameday' | 'total';

// --- GEOMETRY HELPERS ---
const describeSector = (
  cx: number, cy: number, 
  innerRx: number, innerRy: number, 
  outerRx: number, outerRy: number, 
  startAngle: number, endAngle: number
) => {
  const start = (startAngle * Math.PI) / 180;
  const end = (endAngle * Math.PI) / 180;

  const x1 = cx + outerRx * Math.cos(start);
  const y1 = cy + outerRy * Math.sin(start);
  const x2 = cx + outerRx * Math.cos(end);
  const y2 = cy + outerRy * Math.sin(end);

  const x3 = cx + innerRx * Math.cos(end);
  const y3 = cy + innerRy * Math.sin(end);
  const x4 = cx + innerRx * Math.cos(start);
  const y4 = cy + innerRy * Math.sin(start);

  const largeArc = Math.abs(endAngle - startAngle) > 180 ? 1 : 0;

  return [
    `M ${x1} ${y1}`,                                     
    `A ${outerRx} ${outerRy} 0 ${largeArc} 1 ${x2} ${y2}`, 
    `L ${x3} ${y3}`,                                     
    `A ${innerRx} ${innerRy} 0 ${largeArc} 0 ${x4} ${y4}`, 
    `Z`                                                  
  ].join(" ");
};

// --- DATA HELPERS ---
const getZoneMetrics = (data: GameData[], viewMode: ViewMode) => {
  const stats: Record<string, ZoneMetrics> = {};
  let maxRevenue = 0;
  
  // Select channels based on view mode
  const channelFilter = viewMode === 'gameday' ? GAMEDAY_CHANNELS : TOTAL_CHANNELS;
  
  data.forEach(game => {
    if (game.zoneCapacities) {
        Object.entries(game.zoneCapacities).forEach(([zone, cap]) => {
            if (!stats[zone]) stats[zone] = { revenue: 0, sold: 0, capacity: 0 };
            stats[zone].capacity += (cap as number);
        });
    }

    game.salesBreakdown.forEach(s => {
      if (!stats[s.zone]) stats[s.zone] = { revenue: 0, sold: 0, capacity: 0 };
      
      // Revenue from all channels
      stats[s.zone].revenue += s.revenue;
      
      // Sold count based on view mode filter
      if (channelFilter.includes(s.channel)) {
        stats[s.zone].sold += s.quantity;
      }
    });
  });
  
  Object.values(stats).forEach((v: any) => {
    if (v.revenue > maxRevenue) maxRevenue = v.revenue;
  });

  return { stats, maxRevenue };
};

export const ArenaMap: React.FC<ArenaMapProps> = ({ data, onZoneClick, selectedZone, viewMode = 'gameday' }) => {
  const [arenaViewMode, setArenaViewMode] = useState<ViewMode>(viewMode);
  const { stats, maxRevenue } = useMemo(() => getZoneMetrics(data, arenaViewMode), [data, arenaViewMode]);
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);
  const [metric, setMetric] = useState<MapMetric>('revenue');

  const gameCount = data.length || 1;

  // Determine if a zone is "Critical" (Low Occupancy)
  const isCritical = (zone: string) => {
      const zoneData = stats[zone];
      if (!zoneData || zoneData.capacity === 0) return false;
      return (zoneData.sold / zoneData.capacity) < 0.50; // Under 50%
  };

  const getColor = (zone: string) => {
    if (selectedZone !== 'All' && selectedZone !== zone) return '#1e293b'; 

    const zoneData = stats[zone];
    if (!zoneData) return '#334155'; 

    if (metric === 'revenue') {
        const val = zoneData.revenue;
        if (val === 0) return '#334155';
        const intensity = maxRevenue > 0 ? val / maxRevenue : 0;
        const lightness = 25 + (intensity * 50); 
        return `hsl(348, 83%, ${lightness}%)`; 
    } else if (metric === 'yield') {
        // Yield Opportunity: If occupancy > 95%, turn PURPLE. Else Gray/Normal.
        const occupancy = zoneData.capacity > 0 ? zoneData.sold / zoneData.capacity : 0;
        if (occupancy > 0.95) return '#9333ea'; // Purple 600
        return '#475569'; // Slate 600
    } else {
        // Occupancy Scale
        if (zoneData.capacity === 0) return '#334155'; // Grey for no capacity (N/A)

        const occupancy = zoneData.capacity > 0 ? zoneData.sold / zoneData.capacity : 0;
        if (occupancy < 0.50) return '#dc2626'; // Red 600 (Critical)
        if (occupancy >= 0.90) return '#22c55e'; // Green
        if (occupancy >= 0.75) return '#84cc16'; // Lime
        return '#eab308'; // Yellow
    }
  };
  
  const CX = 400;
  const CY = 300;
  const R1 = { ix: 130, iy: 90, ox: 175, oy: 125 }; 
  const R2 = { ix: 185, iy: 135, ox: 240, oy: 180 };
  const R3 = { ix: 250, iy: 190, ox: 295, oy: 225 };

  // Calculate split radius for Parterre Executive (Front rows / Near Court)
  // We allocate the inner 40% of the ring to Executive
  const R1_Split = { 
      x: R1.ix + (R1.ox - R1.ix) * 0.40, 
      y: R1.iy + (R1.oy - R1.iy) * 0.40 
  };

  const stadiumZones = [
    { id: TicketZone.PAR_E, label: 'Parterre Est', path: describeSector(CX, CY, R1.ix, R1.iy, R1.ox, R1.oy, 230, 310), isZone: true },
    
    // Parterre Ovest Left & Right (Full Depth)
    { id: TicketZone.PAR_O, label: 'Parterre Ovest', path: describeSector(CX, CY, R1.ix, R1.iy, R1.ox, R1.oy, -40, 40), isZone: true },
    { id: TicketZone.PAR_O, label: 'Parterre Ovest', path: describeSector(CX, CY, R1.ix, R1.iy, R1.ox, R1.oy, 140, 220), isZone: true },
    
    // Parterre Ovest Central (Split: Inner = Par Ex, Outer = Par O)
    { id: TicketZone.PAR_EX, label: 'Parterre Executive', path: describeSector(CX, CY, R1.ix, R1.iy, R1_Split.x, R1_Split.y, 50, 130), isZone: true },
    { id: TicketZone.PAR_O, label: 'Parterre Ovest', path: describeSector(CX, CY, R1_Split.x, R1_Split.y, R1.ox, R1.oy, 50, 130), isZone: true },

    { id: TicketZone.TRIB_G, label: 'Tribuna Gold', path: describeSector(CX, CY, R2.ix, R2.iy, R2.ox, R2.oy, 230, 310), isZone: true },
    { id: TicketZone.TRIB_S, label: 'Tribuna Silver', path: describeSector(CX, CY, R2.ix, R2.iy, R2.ox, R2.oy, -40, 40), isZone: true },
    { id: TicketZone.TRIB_G, label: 'Tribuna Gold', path: describeSector(CX, CY, R2.ix, R2.iy, R2.ox, R2.oy, 50, 130), isZone: true },
    { id: TicketZone.TRIB_S, label: 'Tribuna Silver', path: describeSector(CX, CY, R2.ix, R2.iy, R2.ox, R2.oy, 140, 220), isZone: true },
    { id: TicketZone.GALL_G, label: 'Galleria Gold', path: describeSector(CX, CY, R3.ix, R3.iy, R3.ox, R3.oy, 230, 270), isZone: true },
    { id: TicketZone.GALL_S, label: 'Galleria Silver', path: describeSector(CX, CY, R3.ix, R3.iy, R3.ox, R3.oy, 270, 310), isZone: true },
    { id: TicketZone.OSPITI, label: 'Ospiti', path: describeSector(CX, CY, R3.ix, R3.iy, R3.ox, R3.oy, -40, 40), isZone: true },
    { id: TicketZone.SKYBOX, label: 'Skyboxes', path: describeSector(CX, CY, R3.ix, R3.iy, R3.ox, R3.oy, 50, 130), isZone: true },
    { id: TicketZone.CURVA, label: 'Curva', path: describeSector(CX, CY, R3.ix, R3.iy, R3.ox, R3.oy, 140, 220), isZone: true },
    { id: TicketZone.COURTSIDE, label: 'Courtside', path: `M ${CX-80},${CY-60} H ${CX+80} L ${CX+70},${CY-50} H ${CX-70} Z`, isZone: true },
    { id: TicketZone.COURTSIDE, label: 'Courtside', path: `M ${CX-80},${CY+60} H ${CX+80} L ${CX+70},${CY+50} H ${CX-70} Z`, isZone: true },
  ];

  return (
    <div className="bg-[#0f172a] p-4 rounded-xl shadow-lg border border-gray-800 flex flex-col items-center h-full relative overflow-hidden group">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-800/50 via-[#0f172a] to-[#0f172a]"></div>

      <style>{`
        @keyframes pulse-red {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        .critical-zone {
          animation: pulse-red 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>

      {/* Header controls */}
      <div className="w-full flex justify-between items-center mb-2 z-10 px-4 absolute top-4 left-0 right-0">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-bold text-gray-200 uppercase tracking-wider flex items-center gap-2 drop-shadow-md">
             <span className="w-1.5 h-5 bg-red-600 rounded-sm"></span>
             Arena Map
          </h3>
          <div className="flex bg-slate-800/80 rounded-md p-0.5 border border-slate-700">
            <button onClick={() => setArenaViewMode('gameday')} className={`px-2 py-1 rounded text-[10px] font-bold uppercase transition-all ${arenaViewMode === 'gameday' ? 'bg-amber-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}>GameDay</button>
            <button onClick={() => setArenaViewMode('total')} className={`px-2 py-1 rounded text-[10px] font-bold uppercase transition-all ${arenaViewMode === 'total' ? 'bg-sky-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}>Total</button>
          </div>
        </div>
        
        <div className="flex bg-slate-900/80 backdrop-blur-sm rounded-lg p-0.5 border border-slate-700 shadow-lg">
            <button onClick={() => setMetric('revenue')} className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase transition-all ${metric === 'revenue' ? 'bg-red-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}>Revenue</button>
            <button onClick={() => setMetric('occupancy')} className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase transition-all ${metric === 'occupancy' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}>Occupancy</button>
            <button onClick={() => setMetric('yield')} className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase transition-all ${metric === 'yield' ? 'bg-purple-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}>Yield Opportunity</button>
        </div>
      </div>
      
      {/* Map Graphic Area */}
      <div className="relative w-full flex-1 min-h-0 flex items-center justify-center z-0 mt-12 mb-0">
        {/* Adjusted viewBox: 90 60 620 480 for tighter fit around arena */}
        <svg viewBox="90 60 620 480" preserveAspectRatio="xMidYMid meet" className="w-full h-full drop-shadow-2xl">
          <defs>
             <pattern id="grid" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
                <circle cx="1" cy="1" r="0.5" fill="rgba(255,255,255,0.05)" />
             </pattern>
             <filter id="glow" height="130%">
                <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
                <feOffset dx="0" dy="0" result="offsetblur"/>
                <feFlood floodColor="white" floodOpacity="0.3"/>
                <feComposite in2="offsetblur" operator="in"/>
                <feMerge>
                    <feMergeNode/>
                    <feMergeNode in="SourceGraphic"/>
                </feMerge>
            </filter>
          </defs>

          <g transform={`translate(${CX}, ${CY})`}>
             <rect x="-80" y="-45" width="160" height="90" fill="#1c1917" stroke="#444" strokeWidth="1" rx="2" />
             <image href={PV_LOGO_URL} x="-20" y="-20" width="40" height="40" opacity="0.5" />
             <line x1="0" y1="-45" x2="0" y2="45" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
             <rect x="-80" y="-14" width="28" height="28" fill="rgba(255,255,255,0.05)" stroke="none" />
             <path d="M -52,-14 A 14 14 0 0 1 -52,14" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
             <path d="M -80,-42 L -47,-42 A 50 50 0 0 1 -47,42 L -80,42" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
             <rect x="52" y="-14" width="28" height="28" fill="rgba(255,255,255,0.05)" stroke="none" />
             <path d="M 52,-14 A 14 14 0 0 0 52,14" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
             <path d="M 80,-42 L 47,-42 A 50 50 0 0 0 47,42 L 80,42" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
          </g>

          {stadiumZones.map((shape, idx) => {
            const isPulse = metric === 'occupancy' && isCritical(shape.id);
            return (
                <g key={idx}>
                <path
                    d={shape.path}
                    fill={getColor(shape.id)}
                    stroke="#0f172a"
                    strokeWidth="1.5"
                    className={`transition-all duration-200 cursor-pointer hover:opacity-100 ${isPulse ? 'critical-zone' : ''}`}
                    style={{
                    filter: hoveredZone === shape.id ? 'url(#glow)' : 'none',
                    opacity: selectedZone !== 'All' && selectedZone !== shape.id ? 0.2 : 1,
                    }}
                    onClick={() => shape.isZone && onZoneClick(shape.id === selectedZone ? 'All' : shape.id)}
                    onMouseEnter={() => setHoveredZone(shape.id)}
                    onMouseLeave={() => setHoveredZone(null)}
                />
                <path d={shape.path} fill="url(#grid)" className="pointer-events-none opacity-50" />
                </g>
            );
          })}
        </svg>

        {/* Tooltip */}
        {hoveredZone && stats[hoveredZone] && (() => {
            const occupancyPct = stats[hoveredZone].capacity > 0 ? (stats[hoveredZone].sold / stats[hoveredZone].capacity) * 100 : 0;
            const yieldVal = stats[hoveredZone].sold > 0 ? stats[hoveredZone].revenue / stats[hoveredZone].sold : 0;
            const isYieldOpp = occupancyPct > 90;

            return (
                <div className="absolute top-20 left-4 bg-slate-900/95 text-white p-3 rounded-lg shadow-2xl border border-slate-700 backdrop-blur-md z-30 min-w-[140px] pointer-events-none animate-in fade-in zoom-in duration-200">
                    <div className="flex justify-between items-center mb-2 border-b border-slate-700 pb-2">
                    <span className="font-bold text-xs text-red-400 uppercase tracking-wider">{hoveredZone}</span>
                    </div>
                    
                    <div className="space-y-1.5 font-mono text-[10px]">
                        <div className="flex justify-between text-slate-400">
                            <span>Rev</span>
                            <span className="text-white">€{(stats[hoveredZone].revenue || 0).toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                            <span>Yield (ATP)</span>
                            <span className="text-green-400 font-bold">
                                €{yieldVal.toFixed(2)}
                            </span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                            <span>Sold (Avg)</span>
                            <span className="text-white">
                                {Math.round(stats[hoveredZone].sold / gameCount)} 
                                <span className="text-slate-600"> / {Math.round(stats[hoveredZone].capacity / gameCount)}</span>
                            </span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                            <span>Occupancy</span>
                            <span className={`${stats[hoveredZone].capacity === 0 ? 'text-gray-400' : (occupancyPct > 90 ? 'text-green-400 font-bold' : (occupancyPct < 50 ? 'text-red-400' : 'text-white'))}`}>
                                {stats[hoveredZone].capacity === 0 ? 'N/A' : `${occupancyPct.toFixed(1)}%`}
                            </span>
                        </div>
                        
                        {isYieldOpp && (
                            <div className="mt-1 pt-1 border-t border-slate-700 text-center">
                                <span className="text-[9px] font-bold text-purple-400 uppercase animate-pulse">Yield Opportunity: High</span>
                            </div>
                        )}

                        <div className="w-full bg-slate-800 h-1 mt-1 rounded-full overflow-hidden">
                            <div 
                                className={`h-full ${stats[hoveredZone].capacity === 0 ? 'bg-slate-600' : (occupancyPct > 90 ? 'bg-purple-500' : 'bg-red-600')}`} 
                                style={{width: `${stats[hoveredZone].capacity === 0 ? 0 : Math.min(occupancyPct, 100)}%`}}
                            ></div>
                        </div>
                    </div>
                </div>
            );
        })()}
      </div>
      
      {/* Legend / Reference */}
      <div className="w-full flex justify-center pb-3 pt-2 z-20 bg-slate-900 border-t border-slate-800 rounded-b-lg">
         {metric === 'yield' ? (
             <div className="flex items-center gap-2 text-xs text-slate-400 font-bold uppercase">
                <div className="w-3 h-3 rounded bg-purple-600 border border-white/20"></div> High Occ. (&gt;95%) - Raise Price
             </div>
         ) : metric === 'revenue' ? (
             <div className="flex flex-col items-center gap-1">
                 <div className="text-xs text-slate-400 uppercase tracking-widest font-semibold">Revenue Scale</div>
                 <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                    <span>Low</span>
                    <div className="w-48 h-3 rounded-full bg-gradient-to-r from-[hsl(348,83%,25%)] via-[hsl(348,83%,55%)] to-[hsl(348,83%,85%)] border border-slate-700 shadow-inner"></div>
                    <span>High</span>
                 </div>
             </div>
         ) : (
             <div className="flex items-center gap-4 text-xs text-slate-400 font-bold uppercase">
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-red-600 animate-pulse"></div>Critical &lt;50%</div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-yellow-500 shadow-sm"></div>50-75%</div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-green-500 shadow-sm"></div>75-90%</div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-green-500 shadow-sm"></div>&gt;90%</div>
             </div>
         )}
      </div>
    </div>
  );
};