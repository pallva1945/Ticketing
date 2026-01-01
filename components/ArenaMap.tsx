import React, { useMemo, useState } from 'react';
import { GameData, TicketZone } from '../types';
import { PV_LOGO_URL } from '../constants';

interface ArenaMapProps {
  data: GameData[];
  onZoneClick: (zone: string) => void;
  selectedZone: string;
}

interface ZoneMetrics {
  revenue: number;
  sold: number;
  capacity: number;
}

type MapMetric = 'revenue' | 'occupancy';

// --- GEOMETRY HELPERS ---

// Generates an SVG path for a donut sector (oval arc)
const describeSector = (
  cx: number, cy: number, 
  innerRx: number, innerRy: number, 
  outerRx: number, outerRy: number, 
  startAngle: number, endAngle: number
) => {
  // Convert angles to radians (0 degrees is 3 o'clock, clockwise)
  const start = (startAngle * Math.PI) / 180;
  const end = (endAngle * Math.PI) / 180;

  // Calculate coordinates
  const x1 = cx + outerRx * Math.cos(start);
  const y1 = cy + outerRy * Math.sin(start);
  const x2 = cx + outerRx * Math.cos(end);
  const y2 = cy + outerRy * Math.sin(end);

  const x3 = cx + innerRx * Math.cos(end);
  const y3 = cy + innerRy * Math.sin(end);
  const x4 = cx + innerRx * Math.cos(start);
  const y4 = cy + innerRy * Math.sin(start);

  // Large Arc Flag (if angle > 180)
  const largeArc = Math.abs(endAngle - startAngle) > 180 ? 1 : 0;

  return [
    `M ${x1} ${y1}`,                                     // Move to Outer Start
    `A ${outerRx} ${outerRy} 0 ${largeArc} 1 ${x2} ${y2}`, // Arc to Outer End
    `L ${x3} ${y3}`,                                     // Line to Inner End
    `A ${innerRx} ${innerRy} 0 ${largeArc} 0 ${x4} ${y4}`, // Arc to Inner Start (Reverse)
    `Z`                                                  // Close
  ].join(" ");
};

// --- DATA HELPERS ---

const getZoneMetrics = (data: GameData[]) => {
  const stats: Record<string, ZoneMetrics> = {};
  let maxRevenue = 0;
  
  data.forEach(game => {
    if (game.zoneCapacities) {
        Object.entries(game.zoneCapacities).forEach(([zone, cap]) => {
            if (!stats[zone]) stats[zone] = { revenue: 0, sold: 0, capacity: 0 };
            stats[zone].capacity += (cap as number);
        });
    }

    game.salesBreakdown.forEach(s => {
      if (!stats[s.zone]) stats[s.zone] = { revenue: 0, sold: 0, capacity: 0 };
      stats[s.zone].revenue += s.revenue;
      stats[s.zone].sold += s.quantity;
    });
  });
  
  Object.values(stats).forEach((v: any) => {
    if (v.revenue > maxRevenue) maxRevenue = v.revenue;
  });

  return { stats, maxRevenue };
};

export const ArenaMap: React.FC<ArenaMapProps> = ({ data, onZoneClick, selectedZone }) => {
  const { stats, maxRevenue } = useMemo(() => getZoneMetrics(data), [data]);
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);
  const [metric, setMetric] = useState<MapMetric>('revenue');

  const gameCount = data.length || 1;

  const getColor = (zone: string) => {
    if (selectedZone !== 'All' && selectedZone !== zone) return '#1e293b'; // Very dark/dimmed

    const zoneData = stats[zone];
    if (!zoneData) return '#334155'; // Base Slate-700

    if (metric === 'revenue') {
        const val = zoneData.revenue;
        if (val === 0) return '#334155';
        
        // Revenue Scale: Dark Red -> Bright Red -> White-ish Red
        const intensity = maxRevenue > 0 ? val / maxRevenue : 0;
        const lightness = 25 + (intensity * 50); 
        return `hsl(348, 83%, ${lightness}%)`; 
    } else {
        // Occupancy Scale
        const occupancy = zoneData.capacity > 0 ? zoneData.sold / zoneData.capacity : 0;
        if (occupancy >= 0.90) return '#22c55e'; // Green
        if (occupancy >= 0.75) return '#84cc16'; // Lime
        if (occupancy >= 0.50) return '#eab308'; // Yellow
        return '#ef4444'; // Red
    }
  };
  
  // --- LAYOUT CONSTANTS ---
  const CX = 400;
  const CY = 300;
  
  // Radius Definitions (Oval shape: Rx > Ry)
  // Ring 1 (Parterre) - Inner expanded from ~110/75 to 130/90
  const R1 = { ix: 130, iy: 90, ox: 175, oy: 125 }; 
  // Ring 2 (Tribuna) - Pushed out accordingly
  const R2 = { ix: 185, iy: 135, ox: 240, oy: 180 };
  // Ring 3 (Upper) - Pushed out
  const R3 = { ix: 250, iy: 190, ox: 295, oy: 225 };

  const stadiumZones = [
    // --- RING 1: PARTERRE (Split into 4 visual areas) ---
    // TOP (Sideline): Parterre Est
    { 
      id: TicketZone.PAR_E, 
      label: 'Parterre Est', 
      path: describeSector(CX, CY, R1.ix, R1.iy, R1.ox, R1.oy, 230, 310),
      isZone: true 
    },
    // RIGHT (Baseline): Parterre Ovest
    { 
      id: TicketZone.PAR_O, 
      label: 'Parterre Ovest (Right)', 
      path: describeSector(CX, CY, R1.ix, R1.iy, R1.ox, R1.oy, -40, 40),
      isZone: true 
    },
    // BOTTOM (Sideline): Parterre Ovest
    { 
      id: TicketZone.PAR_O, 
      label: 'Parterre Ovest (Bottom)', 
      path: describeSector(CX, CY, R1.ix, R1.iy, R1.ox, R1.oy, 50, 130),
      isZone: true 
    },
    // LEFT (Baseline): Parterre Ovest
    { 
      id: TicketZone.PAR_O, 
      label: 'Parterre Ovest (Left)', 
      path: describeSector(CX, CY, R1.ix, R1.iy, R1.ox, R1.oy, 140, 220),
      isZone: true 
    },

    // --- RING 2: TRIBUNA ---
    // TOP (Sideline): Tribuna Gold
    { 
      id: TicketZone.TRIB_G, 
      label: 'Tribuna Gold (Top)', 
      path: describeSector(CX, CY, R2.ix, R2.iy, R2.ox, R2.oy, 230, 310),
      isZone: true 
    },
    // RIGHT (Baseline): Tribuna Silver
    { 
      id: TicketZone.TRIB_S, 
      label: 'Tribuna Silver (Right)', 
      path: describeSector(CX, CY, R2.ix, R2.iy, R2.ox, R2.oy, -40, 40),
      isZone: true 
    },
    // BOTTOM (Sideline): Tribuna Gold
    { 
      id: TicketZone.TRIB_G, 
      label: 'Tribuna Gold (Bottom)', 
      path: describeSector(CX, CY, R2.ix, R2.iy, R2.ox, R2.oy, 50, 130),
      isZone: true 
    },
    // LEFT (Baseline): Tribuna Silver
    { 
      id: TicketZone.TRIB_S, 
      label: 'Tribuna Silver (Left)', 
      path: describeSector(CX, CY, R2.ix, R2.iy, R2.ox, R2.oy, 140, 220),
      isZone: true 
    },

    // --- RING 3: UPPER ---
    // TOP (Sideline): Galleria (Split Gold/Silver)
    // Same side as Par E
    { 
      id: TicketZone.GALL_G, 
      label: 'Galleria Gold (Top Left)', 
      path: describeSector(CX, CY, R3.ix, R3.iy, R3.ox, R3.oy, 230, 270),
      isZone: true 
    },
    { 
      id: TicketZone.GALL_S, 
      label: 'Galleria Silver (Top Right)', 
      path: describeSector(CX, CY, R3.ix, R3.iy, R3.ox, R3.oy, 270, 310),
      isZone: true 
    },
    // RIGHT (Baseline): Ospiti
    { 
      id: TicketZone.OSPITI, 
      label: 'Ospiti', 
      path: describeSector(CX, CY, R3.ix, R3.iy, R3.ox, R3.oy, -40, 40),
      isZone: true 
    },
    // BOTTOM (Sideline): Skyboxes
    { 
      id: TicketZone.SKYBOX, 
      label: 'Skyboxes', 
      path: describeSector(CX, CY, R3.ix, R3.iy, R3.ox, R3.oy, 50, 130),
      isZone: true 
    },
    // LEFT (Baseline): Curva
    { 
      id: TicketZone.CURVA, 
      label: 'Curva', 
      path: describeSector(CX, CY, R3.ix, R3.iy, R3.ox, R3.oy, 140, 220),
      isZone: true 
    },

    // --- COURTSIDE (Special Manual Rectangles near court) ---
    { 
      id: TicketZone.COURTSIDE, 
      label: 'Courtside', 
      path: `M ${CX-80},${CY-60} H ${CX+80} L ${CX+70},${CY-50} H ${CX-70} Z`, 
      isZone: true 
    },
    { 
      id: TicketZone.COURTSIDE, 
      label: 'Courtside', 
      path: `M ${CX-80},${CY+60} H ${CX+80} L ${CX+70},${CY+50} H ${CX-70} Z`, 
      isZone: true 
    },
  ];

  return (
    <div className="bg-[#0f172a] p-4 rounded-xl shadow-lg border border-gray-800 flex flex-col items-center h-full relative overflow-hidden group">
      {/* Background Radial Gradient */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-800/50 via-[#0f172a] to-[#0f172a]"></div>

      {/* Header Controls - Positioned Absolute Top */}
      <div className="w-full flex justify-between items-center mb-2 z-10 px-4 absolute top-4 left-0 right-0">
        <h3 className="text-sm font-bold text-gray-200 uppercase tracking-wider flex items-center gap-2 drop-shadow-md">
           <span className="w-1.5 h-4 bg-red-600 rounded-sm"></span>
           Arena Map
        </h3>
        
        <div className="flex bg-slate-900/80 backdrop-blur-sm rounded-lg p-0.5 border border-slate-700 shadow-lg">
            <button 
                onClick={() => setMetric('revenue')}
                className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all ${metric === 'revenue' ? 'bg-red-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
            >
                Revenue
            </button>
            <button 
                onClick={() => setMetric('occupancy')}
                className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all ${metric === 'occupancy' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
            >
                Occupancy
            </button>
        </div>
      </div>
      
      {/* Map Content - Zoomed In with tighter ViewBox */}
      <div className="relative w-full flex-1 flex items-center justify-center z-0 mt-8">
        <svg viewBox="100 60 600 480" className="w-full h-full drop-shadow-2xl">
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

          {/* --- COURT RENDERING --- */}
          <g transform={`translate(${CX}, ${CY})`}>
             {/* Main Court Rect */}
             <rect x="-80" y="-45" width="160" height="90" fill="#1c1917" stroke="#444" strokeWidth="1" rx="2" />
             
             {/* Center Logo */}
             <image href={PV_LOGO_URL} x="-20" y="-20" width="40" height="40" opacity="0.5" />

             {/* Center Line Only - Circle removed */}
             <line x1="0" y1="-45" x2="0" y2="45" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />

             {/* Left Area (Home) */}
             <rect x="-80" y="-14" width="28" height="28" fill="rgba(255,255,255,0.05)" stroke="none" />
             {/* Free Throw Semicircle */}
             <path d="M -52,-14 A 14 14 0 0 1 -52,14" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
             {/* 3pt Line Left - Updated Geometry to clear FT circle */}
             <path d="M -80,-42 L -47,-42 A 50 50 0 0 1 -47,42 L -80,42" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />

             {/* Right Area (Away) */}
             <rect x="52" y="-14" width="28" height="28" fill="rgba(255,255,255,0.05)" stroke="none" />
             {/* Free Throw Semicircle */}
             <path d="M 52,-14 A 14 14 0 0 0 52,14" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
             {/* 3pt Line Right - Updated Geometry to clear FT circle */}
             <path d="M 80,-42 L 47,-42 A 50 50 0 0 0 47,42 L 80,42" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
          </g>

          {/* --- ZONES --- */}
          {stadiumZones.map((shape, idx) => (
            <g key={idx}>
              <path
                d={shape.path}
                fill={getColor(shape.id)}
                stroke="#0f172a"
                strokeWidth="1.5"
                className="transition-all duration-200 cursor-pointer hover:opacity-100"
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
          ))}
        </svg>

        {hoveredZone && stats[hoveredZone] && (
          <div className="absolute bottom-4 right-4 bg-slate-900/95 text-white p-3 rounded-lg shadow-2xl border border-slate-700 backdrop-blur-md z-30 min-w-[140px] animate-in fade-in slide-in-from-bottom-2 duration-200 pointer-events-none">
            <div className="flex justify-between items-center mb-2 border-b border-slate-700 pb-2">
               <span className="font-bold text-xs text-red-400 uppercase tracking-wider">{hoveredZone}</span>
            </div>
            
            <div className="space-y-1 font-mono text-[10px]">
                <div className="flex justify-between text-slate-400">
                  <span>Rev</span>
                  <span className="text-white">€{(stats[hoveredZone].revenue || 0).toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Sold (Avg)</span>
                  <span className="text-white">
                    {Math.round(stats[hoveredZone].sold / gameCount)} 
                    <span className="text-slate-600"> / {Math.round(stats[hoveredZone].capacity / gameCount)}</span>
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-1 mt-1 rounded-full overflow-hidden">
                   <div 
                     className="h-full bg-red-600" 
                     style={{width: `${Math.min(((stats[hoveredZone].sold / stats[hoveredZone].capacity)*100), 100)}%`}}
                   ></div>
                </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Footer Legend */}
      <div className="w-full flex justify-center mt-auto pb-2 pt-2 z-10">
         {metric === 'revenue' ? (
             <div className="flex flex-col items-center gap-1">
                 <div className="text-[9px] text-slate-400 uppercase tracking-widest font-semibold">Revenue Scale</div>
                 <div className="flex items-center gap-2 text-[9px] text-slate-500 font-medium">
                    <span>Low</span>
                    <div className="w-48 h-2 rounded-full bg-gradient-to-r from-[hsl(348,83%,25%)] via-[hsl(348,83%,55%)] to-[hsl(348,83%,85%)] border border-slate-700 shadow-inner"></div>
                    <span>High</span>
                 </div>
             </div>
         ) : (
             <div className="flex flex-col items-center gap-1">
                 <div className="text-[9px] text-slate-400 uppercase tracking-widest font-semibold">Occupancy Rate</div>
                 <div className="flex items-center gap-4 text-[9px] text-slate-400 font-bold uppercase">
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-sm bg-red-500 shadow-sm"></div>&lt;50%</div>
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-sm bg-yellow-500 shadow-sm"></div>50-75%</div>
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-sm bg-[#84cc16] shadow-sm"></div>75-90%</div>
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-sm bg-green-500 shadow-sm"></div>&gt;90%</div>
                 </div>
             </div>
         )}
      </div>
    </div>
  );
};