import React from 'react';
import { X, Printer, Download, Calendar, ShieldCheck, TrendingUp, AlertTriangle } from 'lucide-react';
import { DashboardStats, GameData } from '../types';
import { TEAM_NAME, PV_LOGO_URL } from '../constants';

interface BoardReportModalProps {
  stats: DashboardStats;
  data: GameData[];
  onClose: () => void;
  seasonTarget: number;
}

export const BoardReportModal: React.FC<BoardReportModalProps> = ({ stats, data, onClose, seasonTarget }) => {
  const dateStr = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const projectedRev = (stats.totalRevenue / (data.length || 1)) * 15;
  const variance = projectedRev - seasonTarget;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto print:shadow-none print:max-w-none print:max-h-none print:overflow-visible">
        
        {/* Actions Bar (Hidden on Print) */}
        <div className="bg-slate-900 p-4 flex justify-between items-center print:hidden sticky top-0 z-50">
          <h2 className="text-white font-bold flex items-center gap-2">
            <ShieldCheck size={20} className="text-green-400" /> Executive Briefing Generator
          </h2>
          <div className="flex gap-3">
            <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-white text-slate-900 rounded-lg text-sm font-bold hover:bg-gray-100 transition-colors">
              <Printer size={16} /> Print / Save PDF
            </button>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-white transition-colors">
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Report Content */}
        <div className="p-12 print:p-0">
          {/* Header */}
          <div className="flex justify-between items-start border-b-4 border-red-600 pb-6 mb-8">
            <div>
                <img src={PV_LOGO_URL} alt="Logo" className="h-16 w-auto mb-4 object-contain" />
                <h1 className="text-3xl font-extrabold text-slate-900 uppercase tracking-tight">{TEAM_NAME}</h1>
                <p className="text-slate-500 font-medium">Commercial Performance Report</p>
            </div>
            <div className="text-right">
                <div className="bg-slate-100 px-4 py-2 rounded-lg inline-block">
                    <p className="text-xs font-bold text-slate-500 uppercase">Report Date</p>
                    <p className="text-lg font-bold text-slate-900">{dateStr}</p>
                </div>
            </div>
          </div>

          {/* Executive Summary Box */}
          <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 mb-8">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <ShieldCheck size={16} /> Strategic Status
            </h3>
            <p className="text-slate-800 text-lg leading-relaxed font-serif">
                As of <strong>{dateStr}</strong>, {TEAM_NAME} has recognized <strong>€{(stats.totalRevenue/1000).toFixed(1)}k</strong> in revenue across <strong>{data.length}</strong> matches tracked. 
                The current pacing indicates a projected season finish of <strong>€{(projectedRev/1000000).toFixed(2)}M</strong>, which is 
                <span className={variance >= 0 ? "text-green-600 font-bold" : "text-red-600 font-bold"}> {variance >= 0 ? 'ahead of' : 'behind'} </span> 
                the <strong>€{(seasonTarget/1000000).toFixed(2)}M</strong> budget target.
            </p>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 gap-8 mb-8">
             <div>
                 <h4 className="text-xs font-bold text-slate-400 uppercase border-b border-slate-200 pb-2 mb-4">Financials</h4>
                 <div className="space-y-4">
                     <div className="flex justify-between items-center">
                         <span className="text-slate-600 font-medium">Total Revenue (YTD)</span>
                         <span className="text-xl font-bold text-slate-900">€{(stats.totalRevenue/1000).toFixed(1)}k</span>
                     </div>
                     <div className="flex justify-between items-center">
                         <span className="text-slate-600 font-medium">Avg Revenue / Game</span>
                         <span className="text-xl font-bold text-slate-900">€{(stats.totalRevenue/data.length).toFixed(0)}</span>
                     </div>
                     <div className="flex justify-between items-center">
                         <span className="text-slate-600 font-medium">Yield (ATP)</span>
                         <span className="text-xl font-bold text-slate-900">€{(stats.totalRevenue/stats.avgAttendance/data.length).toFixed(2)}</span>
                     </div>
                 </div>
             </div>
             <div>
                 <h4 className="text-xs font-bold text-slate-400 uppercase border-b border-slate-200 pb-2 mb-4">Engagement</h4>
                 <div className="space-y-4">
                     <div className="flex justify-between items-center">
                         <span className="text-slate-600 font-medium">Avg Attendance</span>
                         <span className="text-xl font-bold text-slate-900">{stats.avgAttendance.toFixed(0)}</span>
                     </div>
                     <div className="flex justify-between items-center">
                         <span className="text-slate-600 font-medium">Load Factor</span>
                         <span className="text-xl font-bold text-slate-900">{stats.occupancyRate.toFixed(1)}%</span>
                     </div>
                     <div className="flex justify-between items-center">
                         <span className="text-slate-600 font-medium">Giveaway Rate</span>
                         <span className="text-xl font-bold text-orange-600">{stats.giveawayRate.toFixed(1)}%</span>
                     </div>
                 </div>
             </div>
          </div>

          {/* Performance Table */}
          <div className="mb-8">
             <h4 className="text-xs font-bold text-slate-400 uppercase border-b border-slate-200 pb-2 mb-4">Last 5 Matches</h4>
             <table className="w-full text-sm text-left">
                 <thead className="bg-slate-100 text-slate-600 font-bold">
                     <tr>
                         <th className="p-3 rounded-l-lg">Opponent</th>
                         <th className="p-3">Date</th>
                         <th className="p-3 text-right">Att.</th>
                         <th className="p-3 rounded-r-lg text-right">Rev.</th>
                     </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                     {[...data].reverse().slice(0, 5).map((game) => (
                         <tr key={game.id}>
                             <td className="p-3 font-bold text-slate-800">{game.opponent}</td>
                             <td className="p-3 text-slate-500">{game.date}</td>
                             <td className="p-3 text-right text-slate-600">{game.attendance}</td>
                             <td className="p-3 text-right font-mono font-bold text-slate-900">€{(game.totalRevenue/1000).toFixed(1)}k</td>
                         </tr>
                     ))}
                 </tbody>
             </table>
          </div>

          {/* Footer */}
          <div className="border-t border-slate-200 pt-6 mt-8 flex justify-between items-center text-xs text-slate-400">
              <p>Generated by {TEAM_NAME} Revenue Intelligence</p>
              <p>Confidential - Internal Board Use Only</p>
          </div>

        </div>
      </div>
    </div>
  );
};