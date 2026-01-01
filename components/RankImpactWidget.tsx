import React, { useMemo } from 'react';
import { GameData } from '../types';
import { TrendingUp, TrendingDown, Trophy, Medal } from 'lucide-react';

interface RankImpactWidgetProps {
  data: GameData[];
}

export const RankImpactWidget: React.FC<RankImpactWidgetProps> = ({ data }) => {
  const analysis = useMemo(() => {
    // Filter games where we have a valid PV Rank
    const validGames = data.filter(g => g.pvRank && g.pvRank > 0);
    
    if (validGames.length < 2) return null;

    const ranks = validGames.map(g => g.pvRank).sort((a, b) => a - b);
    const medianRank = ranks[Math.floor(ranks.length / 2)];

    // Split into Top Half (Better or equal to median) vs Bottom Half (Worse than median)
    // Note: Lower rank number is better (1 is best)
    const topHalf = validGames.filter(g => g.pvRank <= medianRank);
    const bottomHalf = validGames.filter(g => g.pvRank > medianRank);

    const avgRevTop = topHalf.length ? topHalf.reduce((sum, g) => sum + g.totalRevenue, 0) / topHalf.length : 0;
    const avgRevBot = bottomHalf.length ? bottomHalf.reduce((sum, g) => sum + g.totalRevenue, 0) / bottomHalf.length : 0;

    const delta = avgRevTop - avgRevBot;
    const isPositiveCorrelation = delta > 0;

    return {
        medianRank,
        avgRevTop,
        avgRevBot,
        delta,
        isPositiveCorrelation,
        topCount: topHalf.length,
        botCount: bottomHalf.length
    };
  }, [data]);

  if (!analysis) {
      return (
        <div className="bg-white border border-gray-200 rounded-xl p-4 h-full flex flex-col items-center justify-center text-center shadow-sm">
            <Trophy size={20} className="text-gray-300 mb-2" />
            <p className="text-[10px] text-gray-400">Not enough rank data for elasticity analysis.</p>
        </div>
      );
  }

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 h-full shadow-sm text-white relative overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-3 z-10">
            <div className="flex items-center gap-2">
                <Trophy size={16} className="text-yellow-500" />
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest">Performance Elasticity</h3>
            </div>
            <span className="text-[9px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400 border border-slate-700">Split: Rank {analysis.medianRank}</span>
        </div>

        <div className="flex-1 flex flex-col justify-center z-10 space-y-3">
            {/* Value of Winning */}
            <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400">Value of Top Half</span>
                <span className={`text-lg font-bold ${analysis.delta >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {analysis.delta > 0 ? '+' : ''}€{(analysis.delta/1000).toFixed(1)}k
                    <span className="text-[9px] text-slate-500 font-normal ml-1">/ game</span>
                </span>
            </div>

            {/* Visual Bars */}
            <div className="space-y-2">
                <div className="flex items-center gap-2 text-[10px]">
                    <span className="w-8 text-right text-yellow-500 font-bold">Top</span>
                    <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-yellow-500" style={{ width: `${Math.min((analysis.avgRevTop / (analysis.avgRevTop + analysis.avgRevBot))*100 * 1.5, 100)}%` }}></div>
                    </div>
                    <span className="w-12 text-right font-mono">€{(analysis.avgRevTop/1000).toFixed(0)}k</span>
                </div>
                <div className="flex items-center gap-2 text-[10px]">
                    <span className="w-8 text-right text-slate-500">Bot</span>
                    <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-slate-500" style={{ width: `${Math.min((analysis.avgRevBot / (analysis.avgRevTop + analysis.avgRevBot))*100 * 1.5, 100)}%` }}></div>
                    </div>
                    <span className="w-12 text-right font-mono text-slate-500">€{(analysis.avgRevBot/1000).toFixed(0)}k</span>
                </div>
            </div>
        </div>
        
        {/* Background Glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
    </div>
  );
};
