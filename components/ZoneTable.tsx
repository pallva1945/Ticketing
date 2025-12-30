import React, { useMemo } from 'react';
import { GameData, TicketZone } from '../types';

interface ZoneTableProps {
  data: GameData[];
  onZoneClick?: (zone: string) => void;
}

export const ZoneTable: React.FC<ZoneTableProps> = ({ data, onZoneClick }) => {
  
  const zoneStats = useMemo(() => {
    // We aggregate both revenue/sold AND capacity to get accurate averages
    // for periods where capacity might change (e.g. Skyboxes).
    const stats: Record<string, { revenue: number; sold: number; totalCapacity: number }> = {};
    
    data.forEach(game => {
      // 1. Sum up Capacities for the selected games
      // We iterate through all known zones in the game's capacity map
      if (game.zoneCapacities) {
        Object.entries(game.zoneCapacities).forEach(([zoneName, cap]) => {
           if (!stats[zoneName]) {
             stats[zoneName] = { revenue: 0, sold: 0, totalCapacity: 0 };
           }
           stats[zoneName].totalCapacity += (cap as number);
        });
      }

      // 2. Sum up Sales/Revenue
      game.salesBreakdown.forEach(pt => {
        if (!stats[pt.zone]) {
          // Initialize if it wasn't in zoneCapacities for some reason
          stats[pt.zone] = { revenue: 0, sold: 0, totalCapacity: 0 };
        }
        stats[pt.zone].revenue += pt.revenue;
        stats[pt.zone].sold += pt.quantity;
      });
    });

    const gameCount = data.length || 1;
    const totalRev = Object.values(stats).reduce((acc, curr) => acc + curr.revenue, 0);

    return Object.entries(stats).map(([zone, val]) => {
      // Average Capacity across the filtered games
      const avgCapacity = Math.round(val.totalCapacity / gameCount);
      const avgSold = val.sold / gameCount;
      
      // Fill rate is based on the total potential seats vs total sold seats in the period
      // (Total Sold / Total Capacity) * 100
      const fillRate = val.totalCapacity > 0 ? (val.sold / val.totalCapacity) * 100 : 0;

      return {
        zone,
        capacity: avgCapacity,
        totalRevenue: val.revenue,
        avgRevenue: val.revenue / gameCount,
        avgSold: avgSold,
        avgPrice: val.sold > 0 ? val.revenue / val.sold : 0,
        revShare: totalRev > 0 ? (val.revenue / totalRev) * 100 : 0,
        fillRate: fillRate
      };
    }).sort((a, b) => b.totalRevenue - a.totalRevenue);
  }, [data]);

  if (data.length === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden h-full flex flex-col">
      <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 flex-shrink-0">
        <h3 className="text-lg font-semibold text-gray-800">Zone Efficiency Matrix</h3>
        <span className="text-xs text-gray-500 bg-white border border-gray-200 px-2 py-1 rounded">Avg per game</span>
      </div>
      <div className="overflow-auto flex-1">
        <table className="w-full text-sm text-left text-gray-600">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0 z-10">
            <tr>
              <th className="px-6 py-3 bg-gray-50">Zone</th>
              <th className="px-6 py-3 text-right bg-gray-50">Avg Sold / Cap</th>
              <th className="px-6 py-3 text-right bg-gray-50">Avg Price (Yield)</th>
              <th className="px-6 py-3 text-right bg-gray-50">Avg Revenue</th>
              <th className="px-6 py-3 text-right bg-gray-50">Rev Share</th>
              <th className="px-6 py-3 w-32 bg-gray-50">Fill Rate %</th>
            </tr>
          </thead>
          <tbody>
            {zoneStats.map((row, idx) => {
              // Color coding for fill rate
              let fillColor = 'bg-red-600';
              if (row.fillRate < 50) fillColor = 'bg-red-200 text-red-800';
              else if (row.fillRate < 75) fillColor = 'bg-orange-400';
              else if (row.fillRate < 90) fillColor = 'bg-blue-500';
              else fillColor = 'bg-green-500';

              return (
                <tr 
                  key={row.zone} 
                  className="bg-white border-b hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => onZoneClick && onZoneClick(row.zone)}
                  title="Click to filter by this zone"
                >
                  <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-2">
                    <div className={`w-2 h-8 rounded-sm ${
                      idx < 3 ? 'bg-red-600' : 'bg-gray-300'
                    }`}></div>
                    {row.zone}
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-xs">
                    <span className="font-bold text-gray-800">{Math.round(row.avgSold)}</span>
                    <span className="text-gray-400 mx-1">/</span>
                    <span className="text-gray-500">{row.capacity || '-'}</span>
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-gray-900">€{row.avgPrice.toFixed(1)}</td>
                  <td className="px-6 py-4 text-right">€{row.avgRevenue.toLocaleString(undefined, {maximumFractionDigits: 0})}</td>
                  <td className="px-6 py-4 text-right">{row.revShare.toFixed(1)}%</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                        <div className="flex justify-between text-[10px] font-bold text-gray-500">
                            <span>{row.fillRate.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                            className={`h-2 rounded-full ${fillColor} transition-all duration-500`} 
                            style={{ width: `${Math.min(row.fillRate, 100)}%` }}
                            ></div>
                        </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};