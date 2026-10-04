import React from 'react';
import { Target, TrendingUp, AlertTriangle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { compareRevenueForecast } from '../utils/revenueForecast';

interface PacingWidgetProps {
  currentRevenue: number;
  seasonTarget: number;
  gamesPlayed: number;
  totalGamesInSeason: number; // Guaranteed season revenue fixtures, including BCL/friendly where applicable
}

export const PacingWidget: React.FC<PacingWidgetProps> = ({ 
  currentRevenue, 
  seasonTarget = 4800000, // €4.8M Target
  gamesPlayed,
  totalGamesInSeason = 15
}) => {
  const { t } = useLanguage();
  if (gamesPlayed === 0) return <div className="h-full rounded-xl border border-slate-700 bg-slate-900 p-5 text-white shadow-lg">
    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">{t('Season Target (Budget)')}</h3>
    <p className="mt-2 text-2xl font-bold">€{(seasonTarget / 1000000).toFixed(1)}M</p>
    <p className="mt-3 text-sm text-slate-400">{t('No games played yet. Projection unavailable.')}</p>
    <p className="mt-2 text-xs text-slate-400">0 / {totalGamesInSeason} {t('Games Played')}</p>
  </div>;
  const progress = Math.min((currentRevenue / seasonTarget) * 100, 100);
  const projectedRevenue = (currentRevenue / (gamesPlayed || 1)) * totalGamesInSeason;
  const projectedProgress = Math.min((projectedRevenue / seasonTarget) * 100, 100);
  
  const isOnTrack = projectedRevenue >= seasonTarget;
  const variance = projectedRevenue - seasonTarget;
  const forecast = compareRevenueForecast(projectedRevenue, seasonTarget);

  return (
    <div className="bg-slate-900 rounded-xl p-5 text-white shadow-lg border border-slate-700 relative overflow-hidden h-full flex flex-col justify-center">
      {/* Background Pulse for urgency if off track */}
      {!isOnTrack && <div className="absolute top-0 right-0 w-20 h-20 bg-red-600/20 blur-3xl rounded-full"></div>}
      
      <div className="flex flex-wrap justify-between items-start gap-3 mb-4 z-10">
        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Target size={14} /> Season Target (Budget)
          </h3>
          <div className="flex items-baseline gap-2 mt-1">
             <span className="text-2xl font-bold text-white">€{(currentRevenue / 1000000).toFixed(2)}M</span>
             <span className="text-sm text-slate-500">/ €{(seasonTarget / 1000000).toFixed(1)}M</span>
          </div>
        </div>
        <div className={`ml-auto px-2 py-1 rounded text-right border ${isOnTrack ? 'bg-green-500/20 border-green-500 text-green-400' : 'bg-red-500/20 border-red-500 text-red-400'}`}>
            <p className="text-[9px] font-bold uppercase">{t('Forecast vs Target')}</p>
            <p className="text-lg font-bold">{forecast.percent === null ? '—' : `${forecast.percent >= 0 ? '+' : ''}${forecast.percent.toFixed(1)}%`}</p>
            <p className="text-[9px] text-slate-400">{t('Projected Revenue')}</p>
            <p className="text-sm font-semibold">€{(projectedRevenue / 1000000).toFixed(2)}M</p>
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
            {variance >= 0 ? '+' : '-'}€{(Math.abs(variance)/1000).toFixed(0)}k {t('vs season target')}
         </span>
      </div>
    </div>
  );
};