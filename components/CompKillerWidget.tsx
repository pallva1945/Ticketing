import React, { useMemo } from 'react';
import { GameData, SalesChannel } from '../types';
import { AlertOctagon, TrendingDown } from 'lucide-react';

interface CompKillerWidgetProps {
  data: GameData[];
}

export const CompKillerWidget: React.FC<CompKillerWidgetProps> = ({ data }) => {
  const analysis = useMemo(() => {
    let totalLostRevenue = 0;
    let totalGiveawayCount = 0;
    let totalPaidCount = 0;
    
    // Per game, per zone analysis to get accurate pricing
    data.forEach(game => {
        // 1. Calculate Average Paid Price (ATP) per Zone for this Game
        const zonePrices: Record<string, number> = {};
        
        game.salesBreakdown.forEach(s => {
            if ([SalesChannel.TIX, SalesChannel.MP, SalesChannel.ABB, SalesChannel.CORP, SalesChannel.VB].includes(s.channel)) {
                if (!zonePrices[s.zone]) {
                    // Initialize if needed, but we calculate per channel line item actually
                }
                // We will aggregate paid revenue and quantity per zone first
            }
        });

        // Simpler approach: Aggregate Paid Rev and Paid Qty per zone first
        const zoneStats: Record<string, { paidRev: number, paidQty: number, compQty: number }> = {};

        game.salesBreakdown.forEach(s => {
            if (!zoneStats[s.zone]) zoneStats[s.zone] = { paidRev: 0, paidQty: 0, compQty: 0 };

            if ([SalesChannel.TIX, SalesChannel.MP, SalesChannel.ABB, SalesChannel.CORP, SalesChannel.VB].includes(s.channel)) {
                zoneStats[s.zone].paidRev += s.revenue;
                zoneStats[s.zone].paidQty += s.quantity;
                totalPaidCount += s.quantity;
            } else if ([SalesChannel.GIVEAWAY, SalesChannel.PROTOCOL].includes(s.channel)) {
                zoneStats[s.zone].compQty += s.quantity;
                totalGiveawayCount += s.quantity;
            }
        });

        // 2. Calculate Opportunity Cost
        Object.values(zoneStats).forEach(stats => {
            if (stats.compQty > 0) {
                // If there were paid tickets, use that ATP. 
                // If NO paid tickets in that zone (rare), assume a floor price or 0 (conservative).
                const atp = stats.paidQty > 0 ? stats.paidRev / stats.paidQty : 0;
                totalLostRevenue += (stats.compQty * atp);
            }
        });
    });

    const totalTickets = totalPaidCount + totalGiveawayCount;
    const compRate = totalTickets > 0 ? (totalGiveawayCount / totalTickets) * 100 : 0;

    return {
        totalLostRevenue,
        totalGiveawayCount,
        compRate
    };
  }, [data]);

  return (
    <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 h-full shadow-sm relative overflow-hidden flex flex-col justify-between">
        <div className="flex items-center justify-between z-10">
            <div className="flex items-center gap-2">
                <AlertOctagon size={16} className="text-orange-600" />
                <h3 className="text-xs font-bold text-orange-800 uppercase tracking-widest">Revenue Leakage (Comps)</h3>
            </div>
            <span className="text-[10px] font-bold bg-orange-100 text-orange-700 px-2 py-0.5 rounded border border-orange-200">
                {analysis.compRate.toFixed(1)}% of Vol
            </span>
        </div>

        <div className="flex-1 flex flex-col justify-center z-10 mt-2">
            <div className="flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-orange-700">
                    €{(analysis.totalLostRevenue / 1000).toFixed(1)}k
                </span>
                <span className="text-xs font-medium text-orange-600">Opportunity Cost</span>
            </div>
            <div className="w-full bg-orange-200 h-1.5 rounded-full mt-2 overflow-hidden">
                <div className="h-full bg-orange-500 animate-pulse" style={{ width: `${Math.min(analysis.compRate * 5, 100)}%` }}></div>
            </div>
            <p className="text-[9px] text-orange-500 mt-2 font-medium">
                {analysis.totalGiveawayCount.toLocaleString()} Free Tickets Distributed
            </p>
        </div>

        {/* Background Graphic */}
        <div className="absolute -bottom-4 -right-4 text-orange-100 opacity-50">
            <TrendingDown size={80} />
        </div>
    </div>
  );
};