
import React from 'react';
import { X, Printer, ShieldCheck, TrendingUp, AlertTriangle, Calendar } from 'lucide-react';
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
  const variancePct = (variance / seasonTarget) * 100;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 print:p-0 print:bg-white print:static print:block">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto print:shadow-none print:max-w-none print:max-h-none print:overflow-visible print:w-full">
        
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
        <div className="p-12 print:p-8">
          {/* Header */}
          <div className="flex justify-between items-start border-b-4 border-red-600 pb-6 mb-8">
            <div className="flex items-center gap-6">
                <img src={PV_LOGO_URL} alt="Logo" className="h-20 w-auto object-contain" />
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 uppercase tracking-tight">{TEAM_NAME}</h1>
                    <p className="text-slate-500 font-medium text-lg">Commercial Performance Report</p>
                </div>
            </div>
            <div className="text-right">
                <div className="bg-slate-50 border border-slate-200 px-4 py-2 rounded-lg inline-block">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Report Date</p>
                    <p className="text-xl font-bold text-slate-900 flex items-center gap-2 justify-end">
                        <Calendar size={18} /> {dateStr}
                    </p>
                </div>
            </div>
          </div>

          {/* Executive Summary Box */}
          <div className="bg-slate-50 p-8 rounded-xl border-l-4 border-slate-900 mb-10 shadow-sm print:shadow-none">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <ShieldCheck size={16} /> Strategic Status
            </h3>
            <p className="text-slate-800 text-xl leading-relaxed font-serif">
                As of <strong>{dateStr}</strong>, {TEAM_NAME} has recognized <strong>€{(stats.totalRevenue/1000).toFixed(1)}k</strong> in revenue across <strong>{data.length}</strong> matches tracked. 
                The current pacing indicates a projected season finish of <strong>€{(projectedRev/1000000).toFixed(2)}M</strong>. 
                This represents a variance of <span className={variance >= 0 ? "text-green-700 font-bold" : "text-red-700 font-bold"}>{variance >= 0 ? '+' : ''}{variancePct.toFixed(1)}%</span> against the budget target of <strong>€{(seasonTarget/1000000).toFixed(2)}M</strong>.
            </p>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-3 gap-8 mb-10">
             <div className="p-4 border rounded-lg border-gray-200">
                 <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Total Revenue (YTD)</h4>
                 <div className="flex items-end gap-2">
                    <span className="text-3xl font-extrabold text-slate-900">€{(stats.totalRevenue/1000).toFixed(1)}k</span>
                 </div>
             </div>
             <div className="p-4 border rounded-lg border-gray-200">
                 <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Avg Revenue / Game</h4>
                 <div className="flex items-end gap-2">
                    <span className="text-3xl font-extrabold text-slate-900">€{(stats.totalRevenue/data.length).toFixed(0)}</span>
                 </div>
             </div>
             <div className="p-4 border rounded-lg border-gray-200">
                 <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Yield (ATP)</h4>
                 <div className="flex items-end gap-2">
                    <span className="text-3xl font-extrabold text-blue-700">€{(stats.totalRevenue/stats.avgAttendance/data.length).toFixed(2)}</span>
                 </div>
             </div>
             <div className="p-4 border rounded-lg border-gray-200">
                 <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Avg Attendance</h4>
                 <div className="flex items-end gap-2">
                    <span className="text-3xl font-extrabold text-slate-900">{stats.avgAttendance.toFixed(0)}</span>
                 </div>
             </div>
             <div className="p-4 border rounded-lg border-gray-200">
                 <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Load Factor</h4>
                 <div className="flex items-end gap-2">
                    <span className={`text-3xl font-extrabold ${stats.occupancyRate < 60 ? 'text-red-600' : 'text-green-600'}`}>{stats.occupancyRate.toFixed(1)}%</span>
                 </div>
             </div>
             <div className="p-4 border rounded-lg border-gray-200">
                 <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Giveaway Rate</h4>
                 <div className="flex items-end gap-2">
                    <span className="text-3xl font-extrabold text-orange-600">{stats.giveawayRate.toFixed(1)}%</span>
                 </div>
             </div>
          </div>

          {/* Performance Table */}
          <div className="mb-10">
             <h4 className="text-sm font-bold text-slate-900 uppercase border-b-2 border-slate-900 pb-2 mb-4 flex items-center gap-2">
                <TrendingUp size={16} /> Last 5 Matches Performance
             </h4>
             <table className="w-full text-sm text-left border-collapse">
                 <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-xs">
                     <tr>
                         <th className="p-3 rounded-l-lg">Opponent</th>
                         <th className="p-3">Date</th>
                         <th className="p-3 text-right">Att.</th>
                         <th className="p-3 text-right">Revenue</th>
                         <th className="p-3 rounded-r-lg text-right">Yield</th>
                     </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                     {[...data].reverse().slice(0, 5).map((game) => (
                         <tr key={game.id}>
                             <td className="p-3 font-bold text-slate-800">{game.opponent}</td>
                             <td className="p-3 text-slate-500">{game.date}</td>
                             <td className="p-3 text-right text-slate-600">{game.attendance}</td>
                             <td className="p-3 text-right font-mono font-bold text-slate-900">€{(game.totalRevenue/1000).toFixed(1)}k</td>
                             <td className="p-3 text-right text-blue-600 font-bold">€{(game.attendance > 0 ? game.totalRevenue/game.attendance : 0).toFixed(1)}</td>
                         </tr>
                     ))}
                 </tbody>
             </table>
          </div>

          {/* Warning Footer */}
          <div className="bg-yellow-50 border border-yellow-100 p-4 rounded-lg flex items-start gap-3 mb-8">
             <AlertTriangle className="text-yellow-600 flex-shrink-0" size={20} />
             <div>
                 <h5 className="text-xs font-bold text-yellow-800 uppercase mb-1">Confidentiality Notice</h5>
                 <p className="text-xs text-yellow-700">
                     This document contains proprietary financial data of {TEAM_NAME}. Unauthorized distribution is strictly prohibited.
                     Data generated via PV Strategy AI Module.
                 </p>
             </div>
          </div>

          {/* Signature Block */}
          <div className="border-t border-slate-200 pt-6 flex justify-between items-center text-xs text-slate-400">
              <p>Generated by {TEAM_NAME} Revenue Intelligence</p>
              <p>Page 1 of 1</p>
          </div>

        </div>
      </div>
    </div>
  );
};
