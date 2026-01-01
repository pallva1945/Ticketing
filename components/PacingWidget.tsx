import React from 'react';
import { Target, TrendingUp, AlertTriangle } from 'lucide-react';

interface PacingWidgetProps {
  currentRevenue: number;
  seasonTarget: number;
  gamesPlayed: number;
  totalGamesInSeason: number; // Regular season usually 15 home games
}

export const PacingWidget: React.FC<PacingWidgetProps> = ({ 
  currentRevenue, 
  seasonTarget = 4800000, // €4.8M Target
  gamesPlayed,
  totalGamesInSeason = 15
}) => {
  const progress = Math.min((currentRevenue / seasonTarget) * 100, 100);
  const projectedRevenue = (currentRevenue / (gamesPlayed || 1)) * totalGamesInSeason;
  const projectedProgress = Math.min((projectedRevenue / seasonTarget) * 100, 100);
  
  const isOnTrack = projectedRevenue >= seasonTarget;
  const variance = projectedRevenue - seasonTarget;

  return (
    <div className="bg-slate-900 rounded-xl p-5 text-white shadow-lg border border-slate-700 relative overflow-hidden h-full flex flex-col justify-center">
      {/* Background Pulse for urgency if off track */}
      {!isOnTrack && <div className="absolute top-0 right-0 w-20 h-20 bg-red-600/20 blur-3xl rounded-full"></div>}
      
      <div className="flex justify-between items-start mb-4 z-10">
        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Target size={14} /> Season Target (Budget)
          </h3>
          <div className="flex items-baseline gap-2 mt-1">
             <span className="text-2xl font-bold text-white">€{(currentRevenue / 1000000).toFixed(2)}M</span>
             <span className="text-sm text-slate-500">/ €{(seasonTarget / 1000000).toFixed(1)}M</span>
          </div>
        </div>
        <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase border ${isOnTrack ? 'bg-green-500/20 border-green-500 text-green-400' : 'bg-red-500/20 border-red-500 text-red-400'}`}>
            {isOnTrack ? 'On Track' : 'Risk'}
        </div>
      </div>

      <div className="relative h-3 bg-slate-800 rounded-full overflow-hidden mb-2">
        {/* Current Progress */}
        <div 
            className="absolute top-0 left-0 h-full bg-blue-600 transition-all duration-1000 ease-out z-20"
            style={{ width: `${progress}%` }}
        ></div>
        
        {/* Projected Ghost Bar */}
        <div 
            className={`absolute top-0 left-0 h-full transition-all duration-1000 ease-out z-10 opacity-30 ${isOnTrack ? 'bg-green-400' : 'bg-red-500'}`}
            style={{ width: `${projectedProgress}%` }}
        ></div>
      </div>

      <div className="flex justify-between items-center text-[10px] font-medium z-10">
         <span className="text-slate-400">{gamesPlayed} / {totalGamesInSeason} Games Played</span>
         <span className={`${isOnTrack ? 'text-green-400' : 'text-red-400'} flex items-center gap-1`}>
            {isOnTrack ? <TrendingUp size={12} /> : <AlertTriangle size={12} />}
            Proj: €{(projectedRevenue/1000000).toFixed(2)}M ({variance > 0 ? '+' : ''}€{(variance/1000).toFixed(0)}k)
         </span>
      </div>
    </div>
  );
};