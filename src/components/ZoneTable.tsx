import React, { useMemo, useState } from 'react';
import { GameData } from '../types';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface ZoneTableProps {
  data: GameData[];
  onZoneClick?: (zone: string) => void;
}

type SortKey = 'zone' | 'avgSold' | 'avgPrice' | 'revPas' | 'avgRevenue' | 'revShare' | 'fillRate';

interface SortConfig {
  key: SortKey;
  direction: 'asc' | 'desc';
}

export const ZoneTable: React.FC<ZoneTableProps> = ({ data, onZoneClick }) => {
  const { t } = useLanguage();
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'avgRevenue', direction: 'desc' });

  const handleSort = (key: SortKey) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc',
    }));
  };

  const zoneStats = useMemo(() => {
    const stats: Record<string, { revenue: number; sold: number; totalCapacity: number }> = {};
    
    data.forEach(game => {
      // The game.zoneCapacities object here has already been modified by App.tsx
      // to reflect the View Mode (Total vs Game Day), so we just sum it up.
      if (game.zoneCapacities) {
        Object.entries(game.zoneCapacities).forEach(([zoneName, cap]) => {
           if (!stats[zoneName]) {
             stats[zoneName] = { revenue: 0, sold: 0, totalCapacity: 0 };
           }
           stats[zoneName].totalCapacity += (cap as number);
        });
      }

      game.salesBreakdown.forEach(pt => {
        if (!stats[pt.zone]) {
          stats[pt.zone] = { revenue: 0, sold: 0, totalCapacity: 0 };
        }
        stats[pt.zone].revenue += pt.revenue;
        stats[pt.zone].sold += pt.quantity;
      });
    });

    const gameCount = data.length || 1;
    const totalRev = Object.values(stats).reduce((acc, curr) => acc + curr.revenue, 0);

    const rows = Object.entries(stats)
      .map(([zone, val]) => {
        const avgCapacity = Math.round(val.totalCapacity / gameCount);
        const avgSold = val.sold / gameCount;
        const fillRate = val.totalCapacity > 0 ? (val.sold / val.totalCapacity) * 100 : 0;
        const revPas = val.totalCapacity > 0 ? val.revenue / val.totalCapacity : 0;

        return {
          zone,
          capacity: avgCapacity,
          totalRevenue: val.revenue,
          avgRevenue: val.revenue / gameCount,
          avgSold: avgSold,
          avgPrice: val.sold > 0 ? val.revenue / val.sold : 0,
          revPas: revPas,
          revShare: totalRev > 0 ? (val.revenue / totalRev) * 100 : 0,
          fillRate: fillRate
        };
      })
      // Filter out zones with 0 capacity (e.g. Skyboxes in Game Day view)
      .filter(row => row.capacity > 0);

    return rows.sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortConfig]);

  const totals = useMemo(() => {
    if (zoneStats.length === 0) return null;
    const sumAvgRevenue = zoneStats.reduce((acc, curr) => acc + curr.avgRevenue, 0);
    const sumAvgSold = zoneStats.reduce((acc, curr) => acc + curr.avgSold, 0);
    const sumCapacity = zoneStats.reduce((acc, curr) => acc + curr.capacity, 0);

    return {
        avgSold: sumAvgSold,
        capacity: sumCapacity,
        avgPrice: sumAvgSold > 0 ? sumAvgRevenue / sumAvgSold : 0,
        revPas: sumCapacity > 0 ? sumAvgRevenue / sumCapacity : 0,
        avgRevenue: sumAvgRevenue,
        revShare: 100,
        fillRate: sumCapacity > 0 ? (sumAvgSold / sumCapacity) * 100 : 0
    };
  }, [zoneStats]);

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortConfig.key !== col) return null;
    return sortConfig.direction === 'asc' ? <ArrowUp size={12} className="ml-1 inline" /> : <ArrowDown size={12} className="ml-1 inline" />;
  };

  const thClass = "px-2 py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors select-none text-xs font-bold text-gray-600 dark:text-gray-400 align-bottom";

  if (data.length === 0) return null;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden h-full flex flex-col">
      <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-800 flex-shrink-0">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{t('Zone Efficiency Matrix')}</h3>
        <span className="text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 px-2 py-1 rounded">{t('Avg per game')}</span>
      </div>
      <div className="overflow-auto flex-1">
        <table className="w-full text-sm text-left text-gray-600 dark:text-gray-400">
          <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10 shadow-sm border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className={`${thClass} text-left pl-4`} onClick={() => handleSort('zone')}>
                {t('Zone')} <SortIcon col="zone" />
              </th>
              <th className={`${thClass} text-right`} onClick={() => handleSort('avgSold')}>
                {t('Avg Sold')}<br/>/ {t('Cap')} <SortIcon col="avgSold" />
              </th>
              <th className={`${thClass} text-right`} onClick={() => handleSort('avgPrice')}>
                {t('Avg Price')}<br/>({t('Yield')}) <SortIcon col="avgPrice" />
              </th>
              <th className={`${thClass} text-right`} onClick={() => handleSort('revPas')}>
                {t('RevPAS')} <SortIcon col="revPas" />
              </th>
              <th className={`${thClass} text-right`} onClick={() => handleSort('avgRevenue')}>
                {t('Avg Revenue')}<br/> <SortIcon col="avgRevenue" />
              </th>
              <th className={`${thClass} text-right`} onClick={() => handleSort('revShare')}>
                {t('Rev Share')}<br/> <SortIcon col="revShare" />
              </th>
              <th className={`${thClass} w-24 pl-3`} onClick={() => handleSort('fillRate')}>
                {t('Fill Rate %')} <SortIcon col="fillRate" />
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
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
                  className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer group"
                  onClick={() => onZoneClick && onZoneClick(row.zone)}
                  title={t("Click to filter by this zone")}
                >
                  <td className="px-3 py-3 font-medium text-gray-900 dark:text-white flex items-center gap-2 pl-4">
                    <div className={`w-1.5 h-6 rounded-sm flex-shrink-0 ${
                        idx < 3 && sortConfig.key === 'avgRevenue' && sortConfig.direction === 'desc' 
                        ? 'bg-red-600' 
                        : 'bg-gray-300'
                    }`}></div>
                    <span className="truncate max-w-[120px]" title={row.zone}>{row.zone}</span>
                  </td>
                  <td className="px-2 py-3 text-right font-mono text-xs whitespace-nowrap">
                    <span className="font-bold text-gray-800 dark:text-gray-200">{Math.round(row.avgSold)}</span>
                    <span className="text-gray-400 mx-0.5">/</span>
                    <span className="text-gray-500 dark:text-gray-400">{row.capacity || '-'}</span>
                  </td>
                  <td className="px-2 py-3 text-right font-medium text-gray-900 dark:text-white whitespace-nowrap">€{row.avgPrice.toFixed(1)}</td>
                  <td className="px-2 py-3 text-right font-medium text-blue-600 whitespace-nowrap">€{row.revPas.toFixed(1)}</td>
                  <td className="px-2 py-3 text-right whitespace-nowrap">€{row.avgRevenue.toLocaleString(undefined, {maximumFractionDigits: 0})}</td>
                  <td className="px-2 py-3 text-right whitespace-nowrap">{row.revShare.toFixed(1)}%</td>
                  <td className="px-3 py-3 w-24">
                    <div className="flex flex-col gap-1">
                        <div className="flex justify-between text-[10px] font-bold text-gray-500 dark:text-gray-400">
                            <span>{row.fillRate.toFixed(0)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                            <div 
                            className={`h-1.5 rounded-full ${fillColor} transition-all duration-500`} 
                            style={{ width: `${Math.min(row.fillRate, 100)}%` }}
                            ></div>
                        </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
          {totals && (
            <tfoot className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-bold sticky bottom-0 z-10 border-t-2 border-gray-200 dark:border-gray-700 shadow-inner text-xs">
              <tr>
                <td className="px-3 py-3 uppercase text-[10px] tracking-wider pl-4">{t('TOTAL / AVG')}</td>
                <td className="px-2 py-3 text-right font-mono whitespace-nowrap">
                  <span>{Math.round(totals.avgSold)}</span>
                  <span className="text-gray-400 mx-0.5">/</span>
                  <span className="text-gray-600 dark:text-gray-400">{totals.capacity}</span>
                </td>
                <td className="px-2 py-3 text-right whitespace-nowrap">€{totals.avgPrice.toFixed(1)}</td>
                <td className="px-2 py-3 text-right text-blue-800 whitespace-nowrap">€{totals.revPas.toFixed(1)}</td>
                <td className="px-2 py-3 text-right whitespace-nowrap">€{totals.avgRevenue.toLocaleString(undefined, {maximumFractionDigits: 0})}</td>
                <td className="px-2 py-3 text-right whitespace-nowrap">100%</td>
                <td className="px-3 py-3 w-24">
                  <div className="flex flex-col gap-1">
                      <div className="flex justify-between text-[10px] font-bold text-gray-600 dark:text-gray-400">
                          <span>{totals.fillRate.toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-gray-300 dark:bg-gray-600 rounded-full h-1.5">
                          <div 
                          className="h-1.5 rounded-full bg-gray-800 transition-all duration-500" 
                          style={{ width: `${Math.min(totals.fillRate, 100)}%` }}
                          ></div>
                      </div>
                  </div>
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
};