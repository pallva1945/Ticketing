import React, { useMemo, useState } from 'react';
import { GameData, TicketZone } from '../types';

interface ArenaMapProps {
  data: GameData[];
  onZoneClick: (zone: string) => void;
  selectedZone: string;
}

// Helper to aggregate data
const getZoneMetrics = (data: GameData[]) => {
  const stats: Record<string, number> = {};
  let maxVal = 0;
  
  data.forEach(game => {
    game.salesBreakdown.forEach(s => {
      stats[s.zone] = (stats[s.zone] || 0) + s.revenue;
    });
  });
  
  // Find max for scaling
  Object.values(stats).forEach(v => {
    if (v > maxVal) maxVal = v;
  });

  return { stats, maxVal };
};

export const ArenaMap: React.FC<ArenaMapProps> = ({ data, onZoneClick, selectedZone }) => {
  const { stats, maxVal } = useMemo(() => getZoneMetrics(data), [data]);
  const totalStatsRevenue = useMemo(() => Object.values(stats).reduce((a: number, b: number) => a + b, 0), [stats]);
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);

  const getColor = (zone: string) => {
    // Dimming logic
    if (selectedZone !== 'All' && selectedZone !== zone) return '#334155'; // Slate-700
    if (selectedZone === zone) return '#DC2626'; // Red-600 Highlight

    // Heatmap Logic
    const val = stats[zone] || 0;
    if (val === 0) return '#475569'; // Base Color (Slate-600)

    const intensity = maxVal > 0 ? val / maxVal : 0;
    // Scale: Dark Red (20%) -> Bright Red (60%) -> Almost White/Red (80%)
    const lightness = 20 + (intensity * 40);
    return `hsl(348, 83%, ${lightness}%)`; 
  };
  
  // --- VARESE ARENA GEOMETRY ---
  // ViewBox: 0 0 800 600
  // Center: 400, 300
  
  const stadiumZones = [
    // --- COURT LEVEL ---
    { 
      id: TicketZone.COURTSIDE, 
      label: 'Courtside', 
      // Two strips directly alongside the court
      path: 'M 320,245 H 480 L 485,225 H 315 Z  M 320,355 H 480 L 485,375 H 315 Z', 
      isZone: true 
    },

    // --- PARTERRE (Lower Tier) ---
    { 
      id: TicketZone.PAR_E, // North (Top)
      label: 'Parterre Est', 
      path: 'M 310,220 H 490 L 500,180 H 300 Z', 
      isZone: true 
    },
    { 
      id: TicketZone.PAR_O, // South (Bottom) - Outer Part
      label: 'Parterre Ovest', 
      path: 'M 300,420 H 500 L 490,380 H 310 Z', 
      isZone: true 
    },
    { 
      id: TicketZone.PAR_EX, // South (Bottom) - Exclusive (Inner)
      label: 'Parterre Ex', 
      path: 'M 312,375 H 488 L 485,395 H 315 Z', 
      isZone: true 
    },

    // --- TRIBUNA (Middle Tier) ---
    { 
      id: TicketZone.TRIB_G, // Gold (North/South Central Blocks)
      label: 'Tribuna Gold', 
      // Top Block & Bottom Block
      path: 'M 295,175 H 505 L 520,110 H 280 Z  M 295,425 H 505 L 520,490 H 280 Z', 
      isZone: true 
    },
    { 
      id: TicketZone.TRIB_S, // Silver (Corners)
      label: 'Tribuna Silver', 
      // 4 Corner wedges connecting Tribuna to Curva
      path: 'M 275,175 L 230,210 L 190,160 L 260,110 Z  M 525,175 L 570,210 L 610,160 L 540,110 Z  M 275,425 L 230,390 L 190,440 L 260,490 Z  M 525,425 L 570,390 L 610,440 L 540,490 Z',
      isZone: true 
    },

    // --- CURVA (Ends) ---
    { 
      id: TicketZone.CURVA, 
      label: 'Curva', 
      // West (Left) and East (Right) large trapezoids
      path: 'M 225,215 L 290,240 V 360 L 225,385 L 160,350 V 250 Z  M 575,215 L 510,240 V 360 L 575,385 L 640,350 V 250 Z', 
      isZone: true 
    },

    // --- GALLERIA (Upper Ring - Floating Modules) ---
    // These are distinctive separate blocks in many arenas
    { 
      id: TicketZone.GALL_G, // Gold (North Side Central Blocks)
      label: 'Galleria Gold', 
      // 3 Blocks at top
      path: 'M 330,100 L 350,50 H 450 L 470,100 H 420 L 410,70 H 390 L 380,100 Z M 250,100 L 270,60 H 320 L 300,100 Z M 550,100 L 530,60 H 480 L 500,100 Z',
      isZone: true,
      isFloating: true
    },
    { 
      id: TicketZone.GALL_S, // Silver (Outer Ring/Corners/South)
      label: 'Galleria Silver', 
      // Blocks wrapping around
      path: 'M 180,150 L 140,120 L 100,200 L 140,220 Z M 620,150 L 660,120 L 700,200 L 660,220 Z  M 140,380 L 100,400 L 140,480 L 180,450 Z M 660,380 L 700,400 L 660,480 L 620,450 Z M 280,500 L 260,550 H 540 L 520,500 H 480 L 470,530 H 330 L 320,500 Z',
      isZone: true,
      isFloating: true
    },

    // --- SKYBOXES (VIP Top) ---
    { 
      id: TicketZone.SKYBOX, 
      label: 'Skyboxes', 
      path: 'M 200,30 H 600 V 45 H 200 Z', 
      isZone: true 
    },
  ];

  return (
    <div className="bg-[#1e293b] p-6 rounded-xl shadow-lg border border-gray-700 flex flex-col items-center h-full relative overflow-hidden group">
      {/* Dynamic Background Glow */}
      <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-700 via-[#1e293b] to-[#1e293b]"></div>

      <div className="w-full flex justify-between items-center mb-4 z-10">
        <h3 className="text-lg font-semibold text-white tracking-wide flex items-center gap-2">
           <span className="w-2 h-6 bg-red-600 rounded-sm"></span>
           Arena Map
        </h3>
        <div className="flex items-center gap-3">
             {selectedZone !== 'All' && (
                <button 
                    onClick={() => onZoneClick('All')}
                    className="text-[10px] font-bold uppercase tracking-wider text-red-400 hover:text-white transition-colors"
                >
                    Reset Zoom
                </button>
            )}
            <div className="bg-slate-800 rounded-lg p-1 flex gap-1 border border-slate-700">
               <div className="w-3 h-3 rounded bg-slate-600" title="No Revenue"></div>
               <div className="w-3 h-3 rounded bg-[hsl(348,83%,30%)]" title="Low Revenue"></div>
               <div className="w-3 h-3 rounded bg-[hsl(348,83%,50%)]" title="Med Revenue"></div>
               <div className="w-3 h-3 rounded bg-[hsl(348,83%,70%)]" title="High Revenue"></div>
            </div>
        </div>
      </div>
      
      <div className="relative w-full flex-1 flex items-center justify-center z-10">
        <svg viewBox="0 0 800 600" className="w-full h-full max-h-[450px] drop-shadow-2xl">
          <defs>
             {/* Seat Pattern Texture */}
             <pattern id="seats" x="0" y="0" width="4" height="4" patternUnits="userSpaceOnUse">
                <circle cx="1" cy="1" r="0.5" fill="rgba(0,0,0,0.3)" />
             </pattern>
             
             {/* Drop Shadow for Upper Decks */}
             <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
               <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
               <feOffset dx="2" dy="4" result="offsetblur"/>
               <feComponentTransfer>
                 <feFuncA type="linear" slope="0.5"/>
               </feComponentTransfer>
               <feMerge> 
                 <feMergeNode/>
                 <feMergeNode in="SourceGraphic"/> 
               </feMerge>
             </filter>
             
             {/* Glow Filter for Hover */}
             <filter id="glow">
                <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
                <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                </feMerge>
            </filter>
          </defs>

          {/* --- FLOOR (Context) --- */}
          {/* Main Court Area */}
          <rect x="320" y="240" width="160" height="120" fill="#18181b" rx="4" />

          {/* --- BASKETBALL COURT (Accurate Markings) --- */}
          <g transform="translate(400, 300)">
            {/* Hardwood */}
            <rect x="-75" y="-45" width="150" height="90" fill="#d97706" stroke="rgba(255,255,255,0.8)" strokeWidth="1" />
            
            {/* Center Circle */}
            <circle cx="0" cy="0" r="10" fill="none" stroke="white" strokeWidth="1" opacity="0.6" />
            <line x1="0" y1="-45" x2="0" y2="45" stroke="white" strokeWidth="1" opacity="0.3" />

            {/* Key / Paint Left */}
            <rect x="-75" y="-12" width="19" height="24" fill="#92400e" stroke="white" strokeWidth="1" />
            <path d="M -56,-12 A 12,12 0 0,1 -56,12" fill="none" stroke="white" strokeWidth="1" />

            {/* Key / Paint Right */}
            <rect x="56" y="-12" width="19" height="24" fill="#92400e" stroke="white" strokeWidth="1" />
            <path d="M 56,-12 A 12,12 0 0,0 56,12" fill="none" stroke="white" strokeWidth="1" />

            {/* 3-Point Arcs */}
            <path d="M -75,-38 L -64,-38 Q -30,0 -64,38 L -75,38" fill="none" stroke="white" strokeWidth="1" />
            <path d="M 75,-38 L 64,-38 Q 30,0 64,38 L 75,38" fill="none" stroke="white" strokeWidth="1" />
            
            <text x="0" y="2" textAnchor="middle" fontSize="5" fontWeight="900" fill="rgba(255,255,255,0.4)" letterSpacing="1">VARESE</text>
          </g>

          {/* --- ZONES LAYER --- */}
          {stadiumZones.map((shape, idx) => (
            <g key={idx} filter={shape.isFloating ? "url(#shadow)" : ""}>
              {/* Main Zone Shape */}
              <path
                d={shape.path}
                fill={getColor(shape.id)}
                stroke="#0f172a"
                strokeWidth="1"
                className="transition-all duration-200 cursor-pointer hover:stroke-white hover:stroke-2"
                style={{
                  filter: hoveredZone === shape.id ? 'url(#glow)' : 'none',
                  opacity: selectedZone !== 'All' && selectedZone !== shape.id ? 0.3 : 1
                }}
                onClick={() => shape.isZone && onZoneClick(shape.id === selectedZone ? 'All' : shape.id)}
                onMouseEnter={() => setHoveredZone(shape.id)}
                onMouseLeave={() => setHoveredZone(null)}
              />
              {/* Seat Texture Overlay */}
              <path 
                d={shape.path} 
                fill="url(#seats)" 
                className="pointer-events-none opacity-40"
              />
            </g>
          ))}
        </svg>

        {/* Tooltip */}
        {hoveredZone && (
          <div className="absolute top-4 left-4 bg-slate-800/95 text-white p-3 rounded-lg shadow-xl border border-slate-600 backdrop-blur-sm z-30 min-w-[160px] animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="flex justify-between items-center mb-2 border-b border-slate-600 pb-2">
               <span className="font-bold text-sm text-red-400">{hoveredZone}</span>
               <div className="w-2 h-2 rounded-full" style={{background: getColor(hoveredZone)}}></div>
            </div>
            
            {stats[hoveredZone] !== undefined ? (
                <div className="space-y-1.5 font-mono text-xs">
                    <div className="flex justify-between text-slate-300">
                      <span>Revenue</span>
                      <span className="text-white font-bold">€{(stats[hoveredZone] || 0).toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Share</span>
                      <span className={`${((stats[hoveredZone] || 0) / totalStatsRevenue) > 0.1 ? 'text-green-400' : 'text-slate-400'}`}>
                        {maxVal > 0 ? (((stats[hoveredZone] || 0) / totalStatsRevenue)*100).toFixed(1) : 0}%
                      </span>
                    </div>
                </div>
            ) : (
                <p className="text-slate-500 italic text-xs">No Data Available</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};