import React from 'react';
import { GameData } from '../types';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface DistressedZonesProps {
  data: GameData[];
}

export const DistressedZones: React.FC<DistressedZonesProps> = ({ data }) => {
  // Identify zones performing below their seasonal average in the most recent games
  // For simplicity in this "snapshot" view, we calculate the fill rate of the CURRENT selection
  // and flag anything below 65% as "Distressed".
  
  const stats: Record<string, { capacity: number, sold: number }> = {};
  
  data.forEach(g => {
      // Use filtered capacities
      if (g.zoneCapacities) {
          Object.entries(g.zoneCapacities).forEach(([z, cap]) => {
              if (!stats[z]) stats[z] = { capacity: 0, sold: 0 };
              stats[z].capacity += (cap as number);
          });
      }
      g.salesBreakdown.forEach(s => {
          if (!stats[s.zone]) stats[s.zone] = { capacity: 0, sold: 0 };
          stats[s.zone].sold += s.quantity;
      });
  });

  const distressed = Object.entries(stats)
    .map(([zone, val]) => ({
        zone,
        fillRate: val.capacity > 0 ? (val.sold / val.capacity) * 100 : 0,
        unsold: val.capacity - val.sold,
        capacity: val.capacity // Added for check
    }))
    // Threshold for distress: Fill rate < 65%, and capacity must be > 0 (excludes zones sold out via season tickets in Game Day view)
    .filter(d => d.fillRate < 65 && d.fillRate >= 0 && d.capacity > 0) 
    .sort((a, b) => a.fillRate - b.fillRate);

  if (distressed.length === 0) {
      return (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 h-full flex flex-col items-center justify-center text-center shadow-sm">
            <CheckCircle size={24} className="text-green-600 mb-2" />
            <h3 className="text-xs font-bold text-green-800 uppercase tracking-widest">Inventory Healthy</h3>
            <p className="text-[10px] text-green-600 font-medium mt-1">All monitored zones are performing above 65% occupancy.</p>
        </div>
      );
  }

  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-4 h-full overflow-y-auto custom-scrollbar shadow-sm">
        <div className="flex items-center gap-2 mb-3 sticky top-0 bg-red-50 z-10 pb-2 border-b border-red-100">
            <AlertCircle size={16} className="text-red-600" />
            <h3 className="text-xs font-bold text-red-800 uppercase tracking-widest">Distressed Inventory</h3>
        </div>
        <div className="space-y-2">
            {distressed.map(d => (
                <div key={d.zone} className="bg-white p-2 rounded-lg border border-red-100 shadow-sm flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-700 truncate max-w-[100px]" title={d.zone}>{d.zone}</span>
                    <div className="flex items-center gap-2">
                        <span className="text-[9px] text-gray-400 whitespace-nowrap">{Math.round(d.unsold)} Unsold</span>
                        <span className="text-[10px] font-bold text-red-600 bg-red-100 px-1.5 py-0.5 rounded">{d.fillRate.toFixed(0)}%</span>
                    </div>
                </div>
            ))}
        </div>
        <div className="mt-3 text-[9px] text-red-700 font-medium text-center opacity-80">
            Action: Initiate Flash Promo.
        </div>
    </div>
  );
};