
import React from 'react';
import { Construction, Users } from 'lucide-react';

export const CRMView: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] text-center p-8 animate-fade-in pt-6">
      <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6 shadow-inner relative overflow-hidden">
          <Users size={40} className="text-gray-400 relative z-10" />
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/50 to-transparent opacity-50"></div>
      </div>
      <h2 className="text-3xl font-bold text-gray-800 mb-2">CRM System</h2>
      <p className="text-gray-500 max-w-md mb-8">
        The CRM module is currently under development. 
        Advanced fan relationship management and corporate sales tracking will be available soon.
      </p>
      <div className="flex items-center gap-2 px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-full text-yellow-700 text-xs font-bold uppercase tracking-wider">
        <Construction size={14} />
        Module Placeholder
      </div>
    </div>
  );
};
