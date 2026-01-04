import React, { useMemo } from 'react';
import { GameData } from '../types';
import { AlertCircle, CheckCircle, Coins, TrendingDown } from 'lucide-react';

interface DistressedZonesProps {
  data: GameData[];
}

interface ZoneStat {
  capacity: number;
  sold: number;
  revenue: number;
}

export const DistressedZones: React.FC<DistressedZonesProps> = ({ data }) => {
  // Identify zones performing below their seasonal average in the most recent games
  // For simplicity in this "snapshot" view, we calculate the fill rate of the CURRENT selection
  // and flag anything below 65% as "Distressed".
  
  const stats = useMemo(() => {
      const agg: Record<string, ZoneStat> = {};
      
      data.forEach(g => {
          // Use filtered capacities (App.tsx already handles viewMode logic for capacity)
          if (g.zoneCapacities) {
              Object.entries(g.zoneCapacities).forEach(([z, cap]) => {
                  if (!agg[z]) agg[z] = { capacity: 0, sold: 0, revenue: 0 };
                  agg[z].capacity += (cap as number);
              });
          }
          g.salesBreakdown.forEach(s => {
              if (!agg[s.zone]) agg[s.zone] = { capacity: 0, sold: 0, revenue: 0 };
              agg[s.zone].sold += s.quantity;
              agg[s.zone].revenue += s.revenue;
          });
      });

      return agg;
  }, [data]);

  const distressed = useMemo(() => {
      return Object.entries(stats)
        .map(([zone, val]) => {
            // Explicitly cast val to ZoneStat to handle potential 'unknown' type inference issues
            const stat = val as ZoneStat; 
            
            const fillRate = stat.capacity > 0 ? (stat.sold / stat.capacity) * 100 : 0;
            const unsold = Math.max(0, stat.capacity - stat.sold);
            
            // Calculate Yield (Average Ticket Price) for this zone
            // If nothing sold, we can't calculate potential revenue accurately, assume 0 or fallback
            const yieldPrice = stat.sold > 0 ? stat.revenue / stat.sold : 0;
            const potentialRevenue = unsold * yieldPrice;

            return {
                zone,
                fillRate,
                unsold,
                potentialRevenue,
                capacity: stat.capacity
            };
        })
        // Threshold for distress: Fill rate < 75%, and capacity must be > 0 
        // (excludes zones sold out via season tickets in Game Day view)
        .filter(d => d.fillRate < 75 && d.capacity > 0) 
        .sort((a, b) => b.potentialRevenue - a.potentialRevenue); // Sort by money left on table (Highest first)
  }, [stats]);

  const totalMoneyLeftOnTable = distressed.reduce((acc, curr) => acc + curr.potentialRevenue, 0);

  if (distressed.length === 0) {
      return (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 h-full flex flex-col items-center justify-center text-center shadow-sm">
            <CheckCircle size={24} className="text-green-600 mb-2" />
            <h3 className="text-xs font-bold text-green-800 uppercase tracking-widest">Inventory Healthy</h3>
            <p className="text-[10px] text-green-600 font-medium mt-1">All monitored zones are performing above 75% occupancy.</p>
        </div>
      );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm h-full flex flex-col overflow-hidden">
        {/* Header with Total Value */}
        <div className="p-4 border-b border-gray-100 bg-red-50">
            <div className="flex items-center gap-2 mb-2">
                <AlertCircle size={16} className="text-red-600" />
                <h3 className="text-xs font-bold text-red-800 uppercase tracking-widest">Distressed Inventory</h3>
            </div>
            <div className="flex justify-between items-end">
                <div>
                    <p className="text-[10px] text-red-600/80 font-medium uppercase tracking-wide">Money Left on Table</p>
                    <p className="text-2xl font-bold text-red-700">€{(totalMoneyLeftOnTable / 1000).toFixed(1)}k</p>
                </div>
                <div className="p-2 bg-red-100 rounded-lg text-red-600">
                    <TrendingDown size={20} />
                </div>
            </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
            {distressed.map(d => (
                <div key={d.zone} className="bg-white p-3 rounded-lg border border-gray-100 hover:border-red-200 transition-colors shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-bold text-gray-800 truncate max-w-[120px]" title={d.zone}>{d.zone}</span>
                        <span className="text-xs font-bold text-red-600">€{(d.potentialRevenue/1000).toFixed(1)}k</span>
                    </div>
                    
                    <div className="flex items-center justify-between text-[10px] text-gray-500 mb-1">
                        <span>{Math.round(d.unsold)} Unsold</span>
                        <span>{d.fillRate.toFixed(0)}% Sold</span>
                    </div>

                    <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                        <div 
                            className={`h-full ${d.fillRate < 50 ? 'bg-red-500' : 'bg-orange-400'}`} 
                            style={{ width: `${d.fillRate}%` }}
                        ></div>
                    </div>
                </div>
            ))}
        </div>
        
        <div className="p-2 border-t border-gray-100 bg-gray-50 text-[9px] text-gray-400 text-center uppercase tracking-wide">
            Potential based on Avg Zone Yield
        </div>
    </div>
  );
};