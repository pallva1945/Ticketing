import React, { useMemo } from 'react';
import { GameData, SalesChannel, CRMRecord } from '../types';
import { AlertOctagon, TrendingDown } from 'lucide-react';

interface CompKillerWidgetProps {
  data: GameData[];
  crmData?: CRMRecord[];
  capacityView?: 'all' | 'fixed' | 'flexible';
}

export const CompKillerWidget: React.FC<CompKillerWidgetProps> = ({ data, crmData = [], capacityView = 'all' }) => {
  const analysis = useMemo(() => {
    // If CRM data is available, use commercial_value from giveaway/protocol records
    if (crmData.length > 0) {
      // Filter giveaway records based on capacityView toggle
      const giveawayRecords = crmData.filter(r => {
        const sellLower = (r.sellType || '').toLowerCase().trim();
        const isGiveaway = sellLower === 'giveaway' || sellLower === 'giveaways';
        const isProtocol = sellLower === 'protocol';
        
        if (capacityView === 'all') {
          return isGiveaway || isProtocol;
        } else if (capacityView === 'fixed') {
          return isProtocol;
        } else { // flexible
          return isGiveaway;
        }
      });
      
      // Sum up commercial_value and ticket counts
      let totalLostRevenue = 0;
      let totalGiveawayCount = 0;
      
      giveawayRecords.forEach(r => {
        totalLostRevenue += (r.commercialValue || 0) * (r.quantity || 1);
        totalGiveawayCount += r.quantity || 1;
      });
      
      // Calculate total paid tickets for comp rate
      const paidRecords = crmData.filter(r => {
        const sellLower = (r.sellType || '').toLowerCase().trim();
        return sellLower !== 'giveaway' && sellLower !== 'giveaways' && sellLower !== 'protocol';
      });
      const totalPaidCount = paidRecords.reduce((sum, r) => sum + (r.quantity || 1), 0);
      
      const totalTickets = totalPaidCount + totalGiveawayCount;
      const compRate = totalTickets > 0 ? (totalGiveawayCount / totalTickets) * 100 : 0;
      
      return { totalLostRevenue, totalGiveawayCount, compRate };
    }
    
    // Fallback to GameData-based calculation if no CRM data
    let totalLostRevenue = 0;
    let totalGiveawayCount = 0;
    let totalPaidCount = 0;
    
    data.forEach(game => {
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

        Object.values(zoneStats).forEach(stats => {
            if (stats.compQty > 0) {
                const atp = stats.paidQty > 0 ? stats.paidRev / stats.paidQty : 0;
                totalLostRevenue += (stats.compQty * atp);
            }
        });
    });

    const totalTickets = totalPaidCount + totalGiveawayCount;
    const compRate = totalTickets > 0 ? (totalGiveawayCount / totalTickets) * 100 : 0;

    return { totalLostRevenue, totalGiveawayCount, compRate };
  }, [data, crmData, capacityView]);

  return (
    <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 h-full shadow-sm relative overflow-hidden flex flex-col justify-between">
        <div className="flex items-center justify-between z-10">
            <div className="flex items-center gap-2">
                <AlertOctagon size={16} className="text-orange-600" />
                <h3 className="text-xs font-bold text-orange-800 uppercase tracking-widest">Revenue Leakage (Giveaways)</h3>
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