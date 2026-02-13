import React from 'react';
import { HardHat, Euro, Users, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { useLanguage } from '../contexts/LanguageContext';

const formatCurrency = (val: number) => `€${val.toLocaleString('it-IT', { maximumFractionDigits: 0 })}`;

interface DeptLine {
  name: string;
  employees: number;
  netSalary: number;
  taxes: number;
  relatedCost: number;
  total: number;
  color: string;
}

const DEPARTMENTS: DeptLine[] = [
  { name: 'Executive', employees: 4, netSalary: 143200, taxes: 60024, relatedCost: 16928, total: 227252, color: '#ef4444' },
  { name: 'Sales', employees: 3, netSalary: 48000, taxes: 26854, relatedCost: 0, total: 70503, color: '#f97316' },
  { name: 'Finance', employees: 2, netSalary: 47120, taxes: 161303, relatedCost: 0, total: 60936, color: '#3b82f6' },
  { name: 'Admin', employees: 2, netSalary: 48800, taxes: 9590, relatedCost: 4000, total: 95879, color: '#8b5cf6' },
  { name: 'Media', employees: 2, netSalary: 38240, taxes: 35347, relatedCost: 0, total: 54816, color: '#10b981' },
  { name: 'Marketing', employees: 1, netSalary: 1760, taxes: 0, relatedCost: 0, total: 1760, color: '#f59e0b' },
];

const GRAND_TOTAL = DEPARTMENTS.reduce((s, d) => s + d.total, 0);
const TOTAL_EMPLOYEES = DEPARTMENTS.reduce((s, d) => s + d.employees, 0);
const TOTAL_NET = DEPARTMENTS.reduce((s, d) => s + d.netSalary, 0);
const TOTAL_TAXES = DEPARTMENTS.reduce((s, d) => s + d.taxes, 0);
const TOTAL_RELATED = DEPARTMENTS.reduce((s, d) => s + d.relatedCost, 0);
const SORTED = [...DEPARTMENTS].sort((a, b) => b.total - a.total);
const AVG_COST_PER_EMP = GRAND_TOTAL / TOTAL_EMPLOYEES;

const COST_STRUCTURE = [
  { name: 'Net Salary', value: TOTAL_NET, color: '#ef4444' },
  { name: 'Taxes', value: TOTAL_TAXES, color: '#f97316' },
  { name: 'Employee Related Cost', value: TOTAL_RELATED, color: '#3b82f6' },
];

export const LaborCostDashboard: React.FC = () => {
  const { t } = useLanguage();

  const barData = SORTED.map(d => ({
    name: t(d.name),
    total: d.total,
    color: d.color,
    employees: d.employees,
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-orange-100 dark:bg-orange-900/20 rounded-xl">
          <HardHat className="text-orange-600" size={22} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('Labor')} — {t('Cost Structure')}</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">{t('Season')} 2025/26 · SG&A</p>
        </div>
        <div className="ml-auto px-2 py-0.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded text-[10px] text-amber-600 dark:text-amber-400">
          {t('Season Projection')}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm p-4">
          <div className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400 mb-1">
            <Euro size={12} />
            <span>{t('Total Labor Cost')}</span>
          </div>
          <div className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(GRAND_TOTAL)}</div>
          <div className="text-[10px] text-gray-400 mt-1">{t('Costo Aziendale')}</div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm p-4">
          <div className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400 mb-1">
            <Users size={12} />
            <span>{t('Headcount')}</span>
          </div>
          <div className="text-xl font-bold text-gray-900 dark:text-white">{TOTAL_EMPLOYEES}</div>
          <div className="text-[10px] text-gray-400 mt-1">6 {t('departments')}</div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm p-4">
          <div className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400 mb-1">
            <TrendingUp size={12} />
            <span>{t('Avg Cost / Employee')}</span>
          </div>
          <div className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(AVG_COST_PER_EMP)}</div>
          <div className="text-[10px] text-gray-400 mt-1">{t('Costo Aziendale')}</div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm p-4">
          <div className="flex items-center gap-1.5 text-[11px] text-orange-500 mb-1">
            <Euro size={12} />
            <span>{t('Net Salary Total')}</span>
          </div>
          <div className="text-xl font-bold text-orange-600">{formatCurrency(TOTAL_NET)}</div>
          <div className="text-[10px] text-gray-400 mt-1">{((TOTAL_NET / GRAND_TOTAL) * 100).toFixed(1)}% {t('of total')}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-4">{t('Cost by Department')}</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} barSize={36} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `€${(v / 1000).toFixed(0)}K`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} width={80} />
                <Tooltip
                  cursor={{ fill: 'rgba(0,0,0,0.04)' }}
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-xl text-xs min-w-[160px]">
                        <div className="font-semibold text-gray-800 dark:text-white mb-2">{d.name}</div>
                        <div className="flex justify-between mb-1">
                          <span className="text-gray-500">{t('Total')}</span>
                          <span className="font-medium text-gray-800 dark:text-white">{formatCurrency(d.total)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">{t('Employees')}</span>
                          <span className="font-medium text-gray-800 dark:text-white">{d.employees}</span>
                        </div>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="total" radius={[0, 8, 8, 0]}>
                  {barData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-4">{t('Cost Composition')}</h3>
          <div className="h-56 flex items-center">
            <div className="w-1/2 h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={COST_STRUCTURE.map(c => ({ ...c, name: t(c.name) }))}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {COST_STRUCTURE.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null;
                      const d = payload[0].payload;
                      return (
                        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-xl text-xs">
                          <div className="font-semibold text-gray-800 dark:text-white">{d.name}</div>
                          <div className="text-gray-500">{formatCurrency(d.value)} · {((d.value / GRAND_TOTAL) * 100).toFixed(1)}%</div>
                        </div>
                      );
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-1/2 space-y-3">
              {COST_STRUCTURE.map(c => (
                <div key={c.name} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }} />
                  <div>
                    <div className="text-xs text-gray-700 dark:text-gray-200">{t(c.name)}</div>
                    <div className="text-xs font-semibold text-gray-900 dark:text-white">{formatCurrency(c.value)} <span className="text-[10px] text-gray-400 font-normal">{((c.value / GRAND_TOTAL) * 100).toFixed(1)}%</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-4">{t('Department Breakdown')}</h3>
        <div className="space-y-2.5">
          {SORTED.map(dept => {
            const pct = (dept.total / GRAND_TOTAL) * 100;
            return (
              <div key={dept.name}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: dept.color }} />
                    <span className="text-xs text-gray-700 dark:text-gray-200">{t(dept.name)}</span>
                    <span className="text-[10px] text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">{dept.employees} {t('emp')}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-gray-400 tabular-nums">{pct.toFixed(1)}%</span>
                    <span className="text-xs font-semibold text-gray-900 dark:text-white tabular-nums">{formatCurrency(dept.total)}</span>
                  </div>
                </div>
                <div className="ml-4 bg-gray-100 dark:bg-gray-800 rounded-full h-1">
                  <div className="h-1 rounded-full" style={{ width: `${pct}%`, backgroundColor: dept.color }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-4">{t('Full Cost Breakdown')}</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-2 pr-4 text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap">{t('Department')}</th>
                <th className="text-center py-2 px-3 text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap">#</th>
                <th className="text-right py-2 px-3 text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap">{t('Net Salary')}</th>
                <th className="text-right py-2 px-3 text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap">{t('Taxes')}</th>
                <th className="text-right py-2 px-3 text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap">{t('Employee Related Cost')}</th>
                <th className="text-right py-2 pl-3 text-orange-600 font-semibold whitespace-nowrap">{t('Costo Aziendale')}</th>
              </tr>
            </thead>
            <tbody>
              {DEPARTMENTS.map(dept => (
                <tr key={dept.name} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="py-2 pr-4 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: dept.color }} />
                      {t(dept.name)}
                    </div>
                  </td>
                  <td className="text-center py-2 px-3 text-gray-700 dark:text-gray-300 tabular-nums">{dept.employees}</td>
                  <td className="text-right py-2 px-3 text-gray-700 dark:text-gray-300 tabular-nums whitespace-nowrap">{formatCurrency(dept.netSalary)}</td>
                  <td className={`text-right py-2 px-3 tabular-nums whitespace-nowrap ${dept.taxes === 0 ? 'text-gray-300 dark:text-gray-600' : 'text-gray-700 dark:text-gray-300'}`}>
                    {dept.taxes === 0 ? '—' : formatCurrency(dept.taxes)}
                  </td>
                  <td className={`text-right py-2 px-3 tabular-nums whitespace-nowrap ${dept.relatedCost === 0 ? 'text-gray-300 dark:text-gray-600' : 'text-gray-700 dark:text-gray-300'}`}>
                    {dept.relatedCost === 0 ? '—' : formatCurrency(dept.relatedCost)}
                  </td>
                  <td className="text-right py-2 pl-3 font-semibold text-gray-900 dark:text-white tabular-nums whitespace-nowrap">{formatCurrency(dept.total)}</td>
                </tr>
              ))}
              <tr className="border-t-2 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/30">
                <td className="py-2.5 pr-4 font-bold text-gray-900 dark:text-white">{t('Total')}</td>
                <td className="text-center py-2.5 px-3 font-bold text-gray-900 dark:text-white">{TOTAL_EMPLOYEES}</td>
                <td className="text-right py-2.5 px-3 font-bold text-gray-900 dark:text-white tabular-nums whitespace-nowrap">{formatCurrency(TOTAL_NET)}</td>
                <td className="text-right py-2.5 px-3 font-bold text-gray-900 dark:text-white tabular-nums whitespace-nowrap">{formatCurrency(TOTAL_TAXES)}</td>
                <td className="text-right py-2.5 px-3 font-bold text-gray-900 dark:text-white tabular-nums whitespace-nowrap">{formatCurrency(TOTAL_RELATED)}</td>
                <td className="text-right py-2.5 pl-3 font-bold text-orange-600 tabular-nums whitespace-nowrap">{formatCurrency(GRAND_TOTAL)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
