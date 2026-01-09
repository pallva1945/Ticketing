
import React, { useState } from 'react';
import { Search, Filter, Mail, Phone, MoreHorizontal, User, Building, Star, CheckCircle, Clock, ArrowUpRight, AlertCircle } from 'lucide-react';

export const CRMView: React.FC = () => {
  const [filter, setFilter] = useState('All');

  // Mock Data for CRM
  const contacts = [
    { id: 1, name: 'Alessandro Rossi', company: 'TechVarese S.r.l.', role: 'CEO', type: 'Corporate', spend: 12500, status: 'Hot', probability: 90, lastContact: '2 days ago', avatar: 'AR' },
    { id: 2, name: 'Marco Bianchi', company: 'Private', role: 'Fan', type: 'VIP', spend: 4200, status: 'Warm', probability: 60, lastContact: '1 week ago', avatar: 'MB' },
    { id: 3, name: 'Giulia Verdi', company: 'Lombardia Logistica', role: 'Marketing Dir', type: 'Corporate', spend: 8500, status: 'Negotiating', probability: 40, lastContact: 'Yesterday', avatar: 'GV' },
    { id: 4, name: 'Tigros SpA (HQ)', company: 'Tigros', role: 'Partnership Office', type: 'Sponsor', spend: 45000, status: 'Active', probability: 100, lastContact: '3 days ago', avatar: 'TI' },
    { id: 5, name: 'Luca Esposito', company: 'Private', role: 'Fan', type: 'Season Tix', spend: 850, status: 'At Risk', probability: 20, lastContact: '1 month ago', avatar: 'LE' },
    { id: 6, name: 'Openjobmetis HR', company: 'Openjobmetis', role: 'HR Manager', type: 'Sponsor', spend: 120000, status: 'Active', probability: 100, lastContact: '1 week ago', avatar: 'OJ' },
    { id: 7, name: 'Matteo Colombo', company: 'Private', role: 'Fan', type: 'VIP', spend: 3100, status: 'Cold', probability: 10, lastContact: '2 months ago', avatar: 'MC' },
  ];

  const getStatusColor = (status: string) => {
    switch(status) {
        case 'Hot': return 'bg-red-100 text-red-700';
        case 'Active': return 'bg-green-100 text-green-700';
        case 'Warm': return 'bg-orange-100 text-orange-700';
        case 'Negotiating': return 'bg-blue-100 text-blue-700';
        case 'At Risk': return 'bg-red-50 text-red-600 border border-red-200';
        default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getTypeIcon = (type: string) => {
      if (type === 'Corporate' || type === 'Sponsor') return <Building size={14} />;
      return <User size={14} />;
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
        {/* CRM Header Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Pipeline Value</p>
                        <p className="text-2xl font-bold text-gray-900">€245k</p>
                    </div>
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                        <ArrowUpRight size={20} />
                    </div>
                </div>
                <div className="text-xs text-green-600 font-medium flex items-center gap-1">
                    <ArrowUpRight size={12} /> +12% vs Last Month
                </div>
            </div>
            
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Active Leads</p>
                        <p className="text-2xl font-bold text-gray-900">142</p>
                    </div>
                    <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                        <Star size={20} />
                    </div>
                </div>
                <div className="text-xs text-gray-500 font-medium">
                    28 Hot Priority
                </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Renewal Rate</p>
                        <p className="text-2xl font-bold text-gray-900">84%</p>
                    </div>
                    <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                        <CheckCircle size={20} />
                    </div>
                </div>
                <div className="text-xs text-red-500 font-medium">
                    -2% vs Target
                </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Churn Risk</p>
                        <p className="text-2xl font-bold text-gray-900">18</p>
                    </div>
                    <div className="p-2 bg-red-50 text-red-600 rounded-lg">
                        <AlertCircle size={20} />
                    </div>
                </div>
                <div className="text-xs text-gray-500 font-medium">
                    Season Ticket Holders
                </div>
            </div>
        </div>

        {/* Action Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input 
                    type="text" 
                    placeholder="Search contacts, companies..." 
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none"
                />
            </div>
            <div className="flex gap-2 w-full md:w-auto">
                <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-50 transition-colors">
                    <Filter size={16} /> Filters
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold hover:bg-slate-800 transition-colors">
                    <User size={16} /> Add Lead
                </button>
            </div>
        </div>

        {/* Contacts Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 font-bold border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-4">Name / Company</th>
                            <th className="px-6 py-4">Type</th>
                            <th className="px-6 py-4 text-right">LTV / Spend</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Last Contact</th>
                            <th className="px-6 py-4 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {contacts.map((contact) => (
                            <tr key={contact.id} className="hover:bg-gray-50 transition-colors group cursor-pointer">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs border border-slate-200">
                                            {contact.avatar}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900">{contact.name}</p>
                                            <p className="text-xs text-gray-500 flex items-center gap-1">
                                                {contact.company !== 'Private' && <Building size={10} />}
                                                {contact.company} • {contact.role}
                                            </p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                                        {getTypeIcon(contact.type)} {contact.type}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <p className="font-bold text-gray-900">€{contact.spend.toLocaleString()}</p>
                                    <p className="text-xs text-gray-400">YTD</p>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${getStatusColor(contact.status)}`}>
                                        {contact.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2 text-gray-500 text-xs">
                                        <Clock size={14} />
                                        {contact.lastContact}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button className="p-2 hover:bg-gray-200 rounded-lg text-gray-500 hover:text-blue-600 transition-colors" title="Email">
                                            <Mail size={16} />
                                        </button>
                                        <button className="p-2 hover:bg-gray-200 rounded-lg text-gray-500 hover:text-green-600 transition-colors" title="Call">
                                            <Phone size={16} />
                                        </button>
                                        <button className="p-2 hover:bg-gray-200 rounded-lg text-gray-500 hover:text-gray-900 transition-colors" title="More">
                                            <MoreHorizontal size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            {/* Pagination Footer */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center text-xs text-gray-500">
                <p>Showing <strong>1-7</strong> of <strong>142</strong> leads</p>
                <div className="flex gap-2">
                    <button className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50">Previous</button>
                    <button className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50">Next</button>
                </div>
            </div>
        </div>
    </div>
  );
};
