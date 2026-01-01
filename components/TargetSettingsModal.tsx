import React, { useState } from 'react';
import { X, Target, TrendingUp, Users, Gift, History, DollarSign, Ticket } from 'lucide-react';
import { KPIConfig } from '../types';

interface TargetSettingsModalProps {
  currentConfig: KPIConfig;
  onSave: (config: KPIConfig) => void;
  onClose: () => void;
}

export const TargetSettingsModal: React.FC<TargetSettingsModalProps> = ({ currentConfig, onSave, onClose }) => {
  const [config, setConfig] = useState<KPIConfig>(currentConfig);

  const handleChange = (field: keyof KPIConfig, value: any) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="bg-slate-900 p-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Target className="text-white" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">KPI Configuration</h2>
              <p className="text-slate-400 text-sm">Set specific performance targets</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          
          {/* ARPG Growth */}
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                <DollarSign size={16} className="text-blue-600" />
                ARPG Growth (Avg Rev/Game)
            </label>
            <div className="flex items-center gap-2">
                <input 
                    type="number" 
                    value={config.arpgGrowth}
                    onChange={(e) => handleChange('arpgGrowth', Number(e.target.value))}
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <span className="text-gray-500 font-bold">%</span>
            </div>
          </div>

          {/* Yield Growth */}
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                <Ticket size={16} className="text-blue-600" />
                Yield Growth (Avg Ticket Price)
            </label>
            <div className="flex items-center gap-2">
                <input 
                    type="number" 
                    value={config.yieldGrowth}
                    onChange={(e) => handleChange('yieldGrowth', Number(e.target.value))}
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <span className="text-gray-500 font-bold">%</span>
            </div>
          </div>

          {/* RevPAS Growth */}
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                <TrendingUp size={16} className="text-blue-600" />
                RevPAS Growth
            </label>
            <div className="flex items-center gap-2">
                <input 
                    type="number" 
                    value={config.revPasGrowth}
                    onChange={(e) => handleChange('revPasGrowth', Number(e.target.value))}
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <span className="text-gray-500 font-bold">%</span>
            </div>
          </div>

          {/* Occupancy Growth */}
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                <Users size={16} className="text-blue-600" />
                Occupancy Growth
            </label>
            <div className="flex items-center gap-2">
                <input 
                    type="number" 
                    value={config.occupancyGrowth}
                    onChange={(e) => handleChange('occupancyGrowth', Number(e.target.value))}
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <span className="text-gray-500 font-bold">%</span>
            </div>
          </div>

          {/* Giveaway Cap */}
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                <Gift size={16} className="text-blue-600" />
                Max Giveaway Rate (Limit)
            </label>
            <div className="flex items-center gap-2">
                <input 
                    type="number" 
                    value={config.giveawayTarget}
                    onChange={(e) => handleChange('giveawayTarget', Number(e.target.value))}
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <span className="text-gray-500 font-bold">%</span>
            </div>
          </div>

          {/* Baseline Configuration */}
          <div className="pt-2 border-t border-gray-100">
             <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                <History size={16} className="text-gray-500" />
                Baseline Comparison
            </label>
            <select 
                value={config.baselineMode}
                onChange={(e) => handleChange('baselineMode', e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
            >
                <option value="prev_season">Last Season Only</option>
                <option value="avg_2_seasons">Avg Last 2 Seasons (Coming Soon)</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button 
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={() => { onSave(config); onClose(); }}
              className="px-6 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
            >
              Save KPIs
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
