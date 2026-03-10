import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Home, FileSpreadsheet, Loader2, Check, X, RefreshCw } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { PV_LOGO_URL } from '../constants';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, ComposedChart } from 'recharts';

const MODULE_KEY = 'five_year';

interface FiveYearPlanProps {
  onBackToLanding: () => void;
  onHome?: () => void;
}

interface ParsedRow {
  label: string;
  section: string;
  values: number[];
}

interface FiveYearData {
  headers: string[];
  rows: ParsedRow[];
  sections: string[];
}

function parseFiveYearData(raw: string[][]): FiveYearData | null {
  if (!raw || raw.length < 2) return null;

  const headerRow = raw[0];
  const headers = headerRow.slice(1).map(h => (h || '').trim()).filter(h => h.length > 0);
  if (headers.length === 0) return null;

  const rows: ParsedRow[] = [];
  let currentSection = 'General';

  for (let i = 1; i < raw.length; i++) {
    const row = raw[i];
    if (!row || row.length === 0) continue;

    const label = (row[0] || '').trim();
    if (!label) continue;

    const numericValues = row.slice(1, headers.length + 1).map(v => {
      if (!v || v === '' || v === '-' || v === '—') return 0;
      const s = String(v).replace(/[€$£\s]/g, '').trim();
      let num: number;
      if (s.includes(',') && s.includes('.')) {
        const lastComma = s.lastIndexOf(',');
        const lastDot = s.lastIndexOf('.');
        if (lastComma > lastDot) {
          num = parseFloat(s.replace(/\./g, '').replace(',', '.'));
        } else {
          num = parseFloat(s.replace(/,/g, ''));
        }
      } else if (s.includes(',')) {
        const parts = s.split(',');
        if (parts.length === 2 && parts[1].length <= 2) {
          num = parseFloat(s.replace(',', '.'));
        } else {
          num = parseFloat(s.replace(/,/g, ''));
        }
      } else {
        num = parseFloat(s);
      }
      return isNaN(num) ? 0 : num;
    });

    const hasValues = numericValues.some(v => v !== 0);

    if (!hasValues && label.length > 0) {
      currentSection = label;
      continue;
    }

    rows.push({
      label,
      section: currentSection,
      values: numericValues,
    });
  }

  const sections = [...new Set(rows.map(r => r.section))];

  return { headers, rows, sections };
}

const fmt = (v: number) => {
  if (Math.abs(v) >= 1000000) return `€${(v / 1000000).toFixed(1)}M`;
  if (Math.abs(v) >= 1000) return `€${Math.round(v / 1000)}K`;
  return `€${Math.round(v)}`;
};

const fmtFull = (v: number) => `€${v.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;

export const FiveYearPlan: React.FC<FiveYearPlanProps> = ({ onBackToLanding, onHome }) => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const isDark = theme === 'dark';

  const [rawData, setRawData] = useState<FiveYearData | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [showSheetConfig, setShowSheetConfig] = useState(false);
  const [sheetId, setSheetId] = useState('');
  const [sheetName, setSheetName] = useState('5Y Plan');
  const [sheetConfigured, setSheetConfigured] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch(`/api/revenue/sheet-config/${MODULE_KEY}`)
      .then(r => r.json())
      .then(res => {
        if (res.success) {
          if (res.sheetId) { setSheetId(res.sheetId); setSheetConfigured(true); }
          if (res.sheetName) setSheetName(res.sheetName);
        }
      })
      .catch(() => {});
    fetch(`/api/revenue/sheet-data/${MODULE_KEY}`)
      .then(r => r.json())
      .then(res => {
        if (res.success && res.data) {
          const parsed = parseFiveYearData(res.data);
          if (parsed) setRawData(parsed);
        }
      })
      .catch(() => {});
  }, []);

  const handleSyncSheet = async () => {
    setIsSyncing(true);
    setSyncSuccess(false);
    try {
      const res = await fetch(`/api/revenue/sync-sheet/${MODULE_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const result = await res.json();
      if (result.success) {
        const parsed = parseFiveYearData(result.data);
        if (parsed) setRawData(parsed);
        setSyncSuccess(true);
        setTimeout(() => setSyncSuccess(false), 3000);
      } else {
        alert(result.message || 'Sync failed');
      }
    } catch (err) {
      console.error('Sheet sync failed:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSaveSheetConfig = async () => {
    if (!sheetId.trim()) return;
    try {
      const res = await fetch(`/api/revenue/sheet-config/${MODULE_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sheetId: sheetId.trim(), sheetName: sheetName.trim() }),
      });
      const result = await res.json();
      if (result.success) {
        setSheetConfigured(true);
        setShowSheetConfig(false);
        handleSyncSheet();
      }
    } catch (err) {
      console.error('Config save failed:', err);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) next.delete(section);
      else next.add(section);
      return next;
    });
  };

  const sectionTotals = useMemo(() => {
    if (!rawData) return [];
    return rawData.sections.map(section => {
      const sectionRows = rawData.rows.filter(r => r.section === section);
      const totals = rawData.headers.map((_, hi) => sectionRows.reduce((s, r) => s + (r.values[hi] || 0), 0));
      return { section, totals };
    });
  }, [rawData]);

  const chartData = useMemo(() => {
    if (!rawData || sectionTotals.length === 0) return [];
    return rawData.headers.map((h, hi) => {
      const entry: Record<string, any> = { name: h };
      sectionTotals.forEach(st => {
        entry[st.section] = st.totals[hi];
      });
      entry.total = sectionTotals.reduce((s, st) => s + st.totals[hi], 0);
      return entry;
    });
  }, [rawData, sectionTotals]);

  const SECTION_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

  const card = isDark ? 'bg-gray-900/60 border border-gray-800 rounded-xl' : 'bg-white border border-gray-200 rounded-xl shadow-sm';
  const subtext = isDark ? 'text-gray-500' : 'text-gray-400';

  const tipStyle = {
    backgroundColor: isDark ? '#1f2937' : '#ffffff',
    border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
    borderRadius: '8px',
    fontSize: '11px',
    color: isDark ? '#e5e7eb' : '#374151',
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-950 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="sticky top-0 z-30 backdrop-blur-xl border-b" style={{ borderColor: isDark ? '#1f2937' : '#e5e7eb', backgroundColor: isDark ? 'rgba(3,7,18,0.85)' : 'rgba(249,250,251,0.85)' }}>
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBackToLanding} className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-200'}`}>
              <ArrowLeft size={18} />
            </button>
            <img src={PV_LOGO_URL} alt="PV" className="w-8 h-8 object-contain" />
            <div>
              <h1 className="text-sm font-bold">{t('5 Year Financial Plan')}</h1>
              <p className={`text-[10px] ${subtext}`}>{t('Long-term projections')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={sheetConfigured ? handleSyncSheet : () => setShowSheetConfig(true)}
              disabled={isSyncing}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                syncSuccess
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                  : isDark ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700' : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
              title={sheetConfigured ? t('Sync from Google Sheets') : t('Connect Google Sheet')}
            >
              {isSyncing ? <Loader2 size={14} className="animate-spin" /> : syncSuccess ? <Check size={14} /> : <FileSpreadsheet size={14} />}
              {isSyncing ? t('Syncing...') : syncSuccess ? t('Synced') : sheetConfigured ? t('Sync Sheet') : t('Connect Sheet')}
            </button>
            {sheetConfigured && (
              <button onClick={() => setShowSheetConfig(true)} className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-800 text-gray-500' : 'hover:bg-gray-200 text-gray-400'}`} title={t('Sheet Settings')}>
                <RefreshCw size={14} />
              </button>
            )}
            {onHome && (
              <button onClick={onHome} className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-200'}`}>
                <Home size={18} />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {!rawData ? (
          <div className={`${card} p-12 text-center`}>
            <FileSpreadsheet size={48} className={`mx-auto mb-4 ${subtext}`} />
            <h2 className="text-lg font-semibold mb-2">{t('No Data Connected')}</h2>
            <p className={`text-sm ${subtext} mb-4`}>{t('Connect a Google Sheet to load your 5-year financial projections.')}</p>
            <button
              onClick={() => setShowSheetConfig(true)}
              className="px-4 py-2 rounded-lg bg-amber-600 text-white font-medium text-sm hover:bg-amber-700 transition-colors"
            >
              {t('Connect Google Sheet')}
            </button>
          </div>
        ) : (
          <>
            {chartData.length > 0 && (
              <div className={`${card} p-4`}>
                <h3 className={`text-xs font-semibold mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{t('Revenue & Cost Projections')}</h3>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData} margin={{ top: 10, right: 20, bottom: 5, left: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} opacity={0.5} />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: isDark ? '#9ca3af' : '#6b7280' }} />
                      <YAxis tick={{ fontSize: 9, fill: isDark ? '#9ca3af' : '#6b7280' }} tickFormatter={(v: number) => fmt(v)} />
                      <Tooltip contentStyle={tipStyle} formatter={(v: number) => fmtFull(v)} />
                      <Legend wrapperStyle={{ fontSize: 10 }} />
                      {rawData.sections.map((section, i) => (
                        <Bar key={section} dataKey={section} name={section} fill={SECTION_COLORS[i % SECTION_COLORS.length]} stackId="a" opacity={0.85} radius={i === rawData.sections.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]} />
                      ))}
                      <Line type="monotone" dataKey="total" name={t('Total')} stroke={isDark ? '#f59e0b' : '#d97706'} strokeWidth={2.5} dot={{ r: 4 }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {sectionTotals.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {rawData.headers.map((h, hi) => {
                  const total = sectionTotals.reduce((s, st) => s + st.totals[hi], 0);
                  const prevTotal = hi > 0 ? sectionTotals.reduce((s, st) => s + st.totals[hi - 1], 0) : 0;
                  const growth = hi > 0 && prevTotal > 0 ? ((total - prevTotal) / prevTotal) * 100 : 0;
                  return (
                    <div key={h} className={`${card} p-4`}>
                      <p className={`text-[10px] font-medium ${subtext} mb-1`}>{h}</p>
                      <p className="text-lg font-bold">{fmt(total)}</p>
                      {hi > 0 && prevTotal > 0 && (
                        <p className={`text-[10px] font-medium ${growth >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                          {growth >= 0 ? '+' : ''}{growth.toFixed(1)}% vs {rawData.headers[hi - 1]}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <div className={`${card} p-4 overflow-x-auto`}>
              <h3 className={`text-xs font-semibold mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{t('Detailed Breakdown')}</h3>
              <table className="w-full text-xs min-w-[600px]">
                <thead>
                  <tr className={`border-b ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
                    <th className={`py-2 px-3 text-left font-semibold ${subtext}`}>{t('Item')}</th>
                    {rawData.headers.map(h => (
                      <th key={h} className={`py-2 px-3 text-right font-semibold ${subtext}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rawData.sections.map((section, si) => {
                    const sectionRows = rawData.rows.filter(r => r.section === section);
                    const totals = sectionTotals.find(st => st.section === section)?.totals || [];
                    const isExpanded = expandedSections.has(section);
                    const color = SECTION_COLORS[si % SECTION_COLORS.length];

                    return (
                      <React.Fragment key={section}>
                        <tr
                          className={`border-b cursor-pointer ${isDark ? 'border-gray-800 hover:bg-gray-800/50' : 'border-gray-100 hover:bg-gray-50'}`}
                          onClick={() => toggleSection(section)}
                        >
                          <td className="py-2.5 px-3 font-bold" style={{ color }}>
                            <span className="inline-flex items-center gap-1.5">
                              <span className="text-[10px]">{isExpanded ? '▼' : '▶'}</span>
                              {section}
                            </span>
                          </td>
                          {totals.map((v, vi) => (
                            <td key={vi} className="py-2.5 px-3 text-right tabular-nums font-bold" style={{ color }}>{fmt(v)}</td>
                          ))}
                        </tr>
                        {isExpanded && sectionRows.map((row, ri) => (
                          <tr key={ri} className={`border-b ${isDark ? 'border-gray-800/30' : 'border-gray-50'}`}>
                            <td className={`py-1.5 px-3 pl-8 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{row.label}</td>
                            {row.values.map((v, vi) => (
                              <td key={vi} className={`py-1.5 px-3 text-right tabular-nums ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{v !== 0 ? fmt(v) : '—'}</td>
                            ))}
                          </tr>
                        ))}
                      </React.Fragment>
                    );
                  })}
                  <tr className={`border-t-2 ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>
                    <td className={`py-2.5 px-3 font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('Total')}</td>
                    {rawData.headers.map((_, hi) => {
                      const total = sectionTotals.reduce((s, st) => s + st.totals[hi], 0);
                      return <td key={hi} className={`py-2.5 px-3 text-right tabular-nums font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{fmt(total)}</td>;
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {showSheetConfig && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]" onClick={() => setShowSheetConfig(false)}>
          <div className={`rounded-xl shadow-2xl w-full max-w-md mx-4 ${isDark ? 'bg-gray-900 border border-gray-700' : 'bg-white border border-gray-200'}`} onClick={e => e.stopPropagation()}>
            <div className={`flex items-center justify-between p-5 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex items-center gap-2">
                <FileSpreadsheet size={18} className="text-amber-600" />
                <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('Google Sheet Configuration')}</h3>
              </div>
              <button onClick={() => setShowSheetConfig(false)} className={`p-1 rounded ${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}>
                <X size={16} className="text-gray-500" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{t('Spreadsheet ID')}</label>
                <input
                  type="text"
                  value={sheetId}
                  onChange={e => setSheetId(e.target.value)}
                  placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms"
                  className={`w-full px-3 py-2 rounded-lg border text-sm ${isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}`}
                />
                <p className="text-[10px] text-gray-400 mt-1">{t('Found in the Google Sheets URL between /d/ and /edit')}</p>
              </div>
              <div>
                <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{t('Sheet Tab Name')}</label>
                <input
                  type="text"
                  value={sheetName}
                  onChange={e => setSheetName(e.target.value)}
                  placeholder="5Y Plan"
                  className={`w-full px-3 py-2 rounded-lg border text-sm ${isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}`}
                />
              </div>
            </div>
            <div className={`flex justify-end gap-2 p-5 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <button onClick={() => setShowSheetConfig(false)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${isDark ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'}`}>{t('Cancel')}</button>
              <button
                onClick={handleSaveSheetConfig}
                disabled={!sheetId.trim()}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50 transition-all"
              >
                {t('Save & Sync')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
