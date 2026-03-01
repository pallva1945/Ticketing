import React, { useState, useEffect, useMemo } from 'react';
import { Shield, Zap, Truck, Search, Sun, Moon, ArrowLeft, Home, FileSpreadsheet, Loader2, Check, Settings, RefreshCw, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Cell, Legend, LineChart, Line } from 'recharts';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { PV_LOGO_URL } from '../constants';

const SEASON_MONTHS = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
const formatCurrency = (val: number) => `€${val.toLocaleString('it-IT', { maximumFractionDigits: 0 })}`;
const formatCompact = (val: number) => {
  if (Math.abs(val) >= 10000) return `€${Math.round(val / 1000)}K`;
  if (Math.abs(val) >= 1000) return `€${(val / 1000).toFixed(1)}K`;
  return `€${Math.round(val)}`;
};

const parseEuro = (s: string): number => {
  if (!s || typeof s !== 'string') return 0;
  const cleaned = s.replace(/[€\s]/g, '').replace(/\./g, '').replace(',', '.');
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
};

interface MonthlyItem {
  name: string;
  values: number[];
  color: string;
}

interface MonthRow {
  seasonMonthIndex: number;
  season: string;
  gasArena: number;
  gasCampus: number;
  gasCost: number;
  elecArena: number;
  elecCampus: number;
  elecCost: number;
  totalCost: number;
  gasYoyEur: number;
  gasYoyPer: string;
  elecYoyEur: number;
  elecYoyPer: string;
  totalYoyEur: number;
  eurPerMw: number;
  kwhPrice: number;
}

interface SheetTabData {
  items: MonthlyItem[];
  seasonBudget: number;
  allSeasons: string[];
  monthRows: MonthRow[];
  facilityGas: { arena: number[]; campus: number[] };
  facilityElec: { arena: number[]; campus: number[] };
  prevFacilityGas: { arena: number[]; campus: number[] };
  prevFacilityElec: { arena: number[]; campus: number[] };
  yoyLineData: { month: string; [season: string]: number | string }[];
  seasonYtds: Record<string, number>;
  ltmMonthlyTotals: number[];
  ltmPeriods: { label: string; season: string; monthlyTotals: number[]; gasCosts: number[]; elecCosts: number[]; facilityGas: { arena: number[]; campus: number[] }; facilityElec: { arena: number[]; campus: number[] } }[];
  ltmMonthLabels: string[];
  yoySummary: { gasYtd: number; gasYtdPrev: number; elecYtd: number; elecYtdPrev: number; totalYtd: number; totalYtdPrev: number };
}

interface VanTrip {
  date: string;
  calMonth: number;
  calYear: number;
  season: string;
  seasonMonthIndex: number;
  van: string;
  km: number;
  gasCost: number;
  tollCrosses: number;
  parkingCost: number;
  serviceCost: number;
  repairCost: number;
  insurance: number;
  bollo: number;
  employee: string;
  department: string;
}

interface VanSummary {
  km: number;
  gasCost: number;
  tollCrosses: number;
  parkingCost: number;
  serviceCost: number;
  repairCost: number;
  insurance: number;
  bollo: number;
  trips: number;
  days: number;
  totalCost: number;
}

interface VanTabData {
  overall: VanSummary;
  byVan: Record<string, VanSummary>;
  vans: string[];
  allSeasons: string[];
  monthlyOverall: { month: string; km: number; gasCost: number; tollCrosses: number; parkingCost: number; serviceCost: number; repairCost: number; insurance: number; bollo: number; totalCost: number; trips: number }[];
  monthlyByVan: Record<string, { month: string; km: number; gasCost: number; totalCost: number }[]>;
  projYearlyKm: number;
  daysInSeason: number;
  yoyLineData: { month: string; [season: string]: number | string }[];
}

const TOLL_COST_PER_CROSS = 4.30;

const COLORS = {
  gas: '#f59e0b',
  gasLight: '#fbbf24',
  electricity: '#3b82f6',
  electricityLight: '#60a5fa',
  arena: '#8b5cf6',
  campus: '#10b981',
  total: '#6366f1',
  prevSeason: '#9ca3af',
};

function dateToSeasonMonthIndex(dateStr: string): number {
  const parts = dateStr.split('/');
  if (parts.length < 3) return -1;
  const m = parseInt(parts[1], 10);
  const MAP: Record<number, number> = { 7: 0, 8: 1, 9: 2, 10: 3, 11: 4, 12: 5, 1: 6, 2: 7, 3: 8, 4: 9, 5: 10, 6: 11 };
  return MAP[m] ?? -1;
}

function parsePercent(s: string): string {
  return (s || '').trim().replace(/\s/g, '');
}

function parseEnergySheetData(rows: string[][], selectedSeason: string): SheetTabData | null {
  if (!rows || rows.length < 2) return null;

  const headers = rows[0].map(h => (h || '').trim().toLowerCase().replace(/\s+/g, '_'));
  const col = (name: string) => headers.indexOf(name);
  const dateIdx = col('date');
  const seasonIdx = col('season');
  if (dateIdx < 0 || seasonIdx < 0) return null;

  const allSeasons = new Set<string>();
  const allRows: MonthRow[] = [];

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length < 2) continue;
    const date = (row[dateIdx] || '').trim();
    const season = (row[seasonIdx] || '').trim();
    if (!date || !season) continue;
    allSeasons.add(season);
    const smi = dateToSeasonMonthIndex(date);
    if (smi < 0) continue;

    const getVal = (name: string) => { const i = col(name); return i >= 0 ? parseEuro(row[i] || '') : 0; };
    const rawCell = (name: string) => { const i = col(name); return i >= 0 ? (row[i] || '').trim() : ''; };

    const requiredFields = ['gas_arena', 'gas_campus', 'gas_cost', 'electricity_arena', 'electricity_campus', 'electricity_cost', 'total_cost'];
    const hasIncomplete = requiredFields.some(f => rawCell(f) === '');
    if (hasIncomplete) continue;

    allRows.push({
      seasonMonthIndex: smi,
      season,
      gasArena: getVal('gas_arena'),
      gasCampus: getVal('gas_campus'),
      gasCost: getVal('gas_cost'),
      elecArena: getVal('electricity_arena'),
      elecCampus: getVal('electricity_campus'),
      elecCost: getVal('electricity_cost'),
      totalCost: getVal('total_cost'),
      gasYoyEur: getVal('gas_eur_yoy'),
      gasYoyPer: parsePercent(row[col('gas_per_yoy')] || ''),
      elecYoyEur: getVal('electricity_eur_yoy'),
      elecYoyPer: parsePercent(row[col('electricity_per_yoy')] || ''),
      totalYoyEur: getVal('price_diff_yoy'),
      eurPerMw: getVal('eur/mw'),
      kwhPrice: getVal('kwh_price'),
    });
  }

  const sortedSeasons = Array.from(allSeasons).sort();
  const seasonRows = allRows.filter(r => r.season === selectedSeason);
  const prevSeasonIdx = sortedSeasons.indexOf(selectedSeason) - 1;
  const prevSeason = prevSeasonIdx >= 0 ? sortedSeasons[prevSeasonIdx] : null;
  const prevRows = prevSeason ? allRows.filter(r => r.season === prevSeason) : [];

  const activeMonthIndices = new Set(seasonRows.map(r => r.seasonMonthIndex));
  const prevRowsLtm = prevRows.filter(r => activeMonthIndices.has(r.seasonMonthIndex));

  const gasValues = new Array(12).fill(0);
  const elecValues = new Array(12).fill(0);
  const gasArena = new Array(12).fill(0);
  const gasCampus = new Array(12).fill(0);
  const elecArena = new Array(12).fill(0);
  const elecCampus = new Array(12).fill(0);

  seasonRows.forEach(r => {
    gasValues[r.seasonMonthIndex] += r.gasCost;
    elecValues[r.seasonMonthIndex] += r.elecCost;
    gasArena[r.seasonMonthIndex] += r.gasArena;
    gasCampus[r.seasonMonthIndex] += r.gasCampus;
    elecArena[r.seasonMonthIndex] += r.elecArena;
    elecCampus[r.seasonMonthIndex] += r.elecCampus;
  });

  const prevGasArena = new Array(12).fill(0);
  const prevGasCampus = new Array(12).fill(0);
  const prevElecArena = new Array(12).fill(0);
  const prevElecCampus = new Array(12).fill(0);

  const ltmMonthlyTotals = new Array(12).fill(0);

  prevRowsLtm.forEach(r => {
    prevGasArena[r.seasonMonthIndex] += r.gasArena;
    prevGasCampus[r.seasonMonthIndex] += r.gasCampus;
    prevElecArena[r.seasonMonthIndex] += r.elecArena;
    prevElecCampus[r.seasonMonthIndex] += r.elecCampus;
    ltmMonthlyTotals[r.seasonMonthIndex] += r.totalCost;
  });

  const items: MonthlyItem[] = [
    { name: 'Gas', values: gasValues, color: COLORS.gas },
    { name: 'Electricity', values: elecValues, color: COLORS.electricity },
  ].filter(item => item.values.some(v => v > 0));

  const yoyLineData: { month: string; [season: string]: number | string }[] = SEASON_MONTHS.map((month, mi) => {
    const entry: { month: string; [season: string]: number | string } = { month };
    sortedSeasons.forEach(s => {
      const row = allRows.find(r => r.season === s && r.seasonMonthIndex === mi);
      entry[s] = row ? row.totalCost : 0;
    });
    return entry;
  });

  const seasonYtds: Record<string, number> = {};
  sortedSeasons.forEach(s => {
    seasonYtds[s] = allRows.filter(r => r.season === s).reduce((sum, r) => sum + r.totalCost, 0);
  });

  const gasYtd = seasonRows.reduce((s, r) => s + r.gasCost, 0);
  const gasYtdPrev = prevRowsLtm.reduce((s, r) => s + r.gasCost, 0);
  const elecYtd = seasonRows.reduce((s, r) => s + r.elecCost, 0);
  const elecYtdPrev = prevRowsLtm.reduce((s, r) => s + r.elecCost, 0);
  const totalYtd = gasYtd + elecYtd;
  const totalYtdPrev = gasYtdPrev + elecYtdPrev;

  const selectedIdx = sortedSeasons.indexOf(selectedSeason);
  const ltmPeriods: SheetTabData['ltmPeriods'] = [];

  const emptyReturn = () => ({
    items, seasonBudget: 0, allSeasons: sortedSeasons, monthRows: seasonRows,
    facilityGas: { arena: gasArena, campus: gasCampus }, facilityElec: { arena: elecArena, campus: elecCampus },
    prevFacilityGas: { arena: prevGasArena, campus: prevGasCampus }, prevFacilityElec: { arena: prevElecArena, campus: prevElecCampus },
    yoyLineData, seasonYtds, ltmMonthlyTotals, ltmPeriods, ltmMonthLabels: [] as string[],
    yoySummary: { gasYtd, gasYtdPrev, elecYtd, elecYtdPrev, totalYtd, totalYtdPrev },
  });

  if (selectedIdx < 0) return emptyReturn();

  const lastActiveSMI = (() => { for (let i = 11; i >= 0; i--) { if (gasValues[i] + elecValues[i] > 0) return i; } return -1; })();
  if (lastActiveSMI < 0) return emptyReturn();

  const windowSMIs: number[] = [];
  for (let i = 1; i <= 12; i++) windowSMIs.push((lastActiveSMI + i) % 12);
  const ltmMonthLabels = windowSMIs.map(smi => SEASON_MONTHS[smi]);

  const rowsBySeason: Record<string, MonthRow[]> = {};
  sortedSeasons.forEach(s => { rowsBySeason[s] = allRows.filter(r => r.season === s); });

  for (let k = 0; ; k++) {
    const laterIdx = selectedIdx - k;
    const earlierIdx = lastActiveSMI < 11 ? selectedIdx - 1 - k : laterIdx;
    if (laterIdx < 0 || earlierIdx < 0) break;

    const laterSeason = sortedSeasons[laterIdx];
    const earlierSeason = sortedSeasons[earlierIdx];
    const laterRows = rowsBySeason[laterSeason] || [];
    const earlierRows = laterSeason === earlierSeason ? laterRows : (rowsBySeason[earlierSeason] || []);

    const mt = new Array(12).fill(0);
    const gc = new Array(12).fill(0);
    const ec = new Array(12).fill(0);
    const fga = new Array(12).fill(0);
    const fgc = new Array(12).fill(0);
    const fea = new Array(12).fill(0);
    const fec = new Array(12).fill(0);

    let complete = true;
    for (let wi = 0; wi < 12; wi++) {
      const smi = windowSMIs[wi];
      const rows = smi <= lastActiveSMI ? laterRows : earlierRows;
      const row = rows.find(r => r.seasonMonthIndex === smi);
      if (!row) { if (k > 0) { complete = false; break; } continue; }
      mt[wi] = row.totalCost;
      gc[wi] = row.gasCost;
      ec[wi] = row.elecCost;
      fga[wi] = row.gasArena;
      fgc[wi] = row.gasCampus;
      fea[wi] = row.elecArena;
      fec[wi] = row.elecCampus;
    }
    if (!complete) break;

    ltmPeriods.push({
      label: k === 0 ? 'LTM' : `LTM-${k}`,
      season: laterSeason,
      monthlyTotals: mt,
      gasCosts: gc,
      elecCosts: ec,
      facilityGas: { arena: fga, campus: fgc },
      facilityElec: { arena: fea, campus: fec },
    });
  }

  return {
    items,
    seasonBudget: 0,
    allSeasons: sortedSeasons,
    monthRows: seasonRows,
    facilityGas: { arena: gasArena, campus: gasCampus },
    facilityElec: { arena: elecArena, campus: elecCampus },
    prevFacilityGas: { arena: prevGasArena, campus: prevGasCampus },
    prevFacilityElec: { arena: prevElecArena, campus: prevElecCampus },
    yoyLineData,
    seasonYtds,
    ltmMonthlyTotals,
    ltmPeriods,
    ltmMonthLabels,
    yoySummary: { gasYtd, gasYtdPrev, elecYtd, elecYtdPrev, totalYtd, totalYtdPrev },
  };
}

function dateToSeason(dateStr: string): string {
  const parts = dateStr.split('/');
  if (parts.length < 3) return '';
  const m = parseInt(parts[1], 10);
  const y = parseInt(parts[2], 10);
  const fullY = y < 100 ? 2000 + y : y;
  if (m >= 7) return `${String(fullY).slice(-2)}-${String(fullY + 1).slice(-2)}`;
  return `${String(fullY - 1).slice(-2)}-${String(fullY).slice(-2)}`;
}

function parseVanSheetData(rows: string[][], selectedSeason: string): VanTabData | null {
  if (!rows || rows.length < 2) return null;

  const headers = rows[0].map(h => (h || '').trim().toLowerCase().replace(/\s+/g, '_'));
  const col = (name: string) => headers.indexOf(name);
  const colIncludes = (name: string) => headers.findIndex(h => h.includes(name));
  const dateIdx = col('date') >= 0 ? col('date') : colIncludes('date');
  const vanIdx = col('van') >= 0 ? col('van') : (col('vehicle') >= 0 ? col('vehicle') : colIncludes('van'));
  const kmIdx = col('km') >= 0 ? col('km') : col('km_');
  const gasCostIdx = col('gas_cost') >= 0 ? col('gas_cost') : colIncludes('gas_cost');
  const tollIdx = col('toll_crosses') >= 0 ? col('toll_crosses') : colIncludes('toll');
  const parkingIdx = col('parking_cost') >= 0 ? col('parking_cost') : colIncludes('parking');
  const olioIdx = col('olio') >= 0 ? col('olio') : colIncludes('olio');
  const repairIdx = col('repair_cost') >= 0 ? col('repair_cost') : colIncludes('repair');
  const insuranceIdx = col('insurance') >= 0 ? col('insurance') : colIncludes('insurance');
  const bolloIdx = col('bollo') >= 0 ? col('bollo') : colIncludes('bollo');
  const employeeIdx = col('employee');
  const deptIdx = col('department');

  if (dateIdx < 0 || vanIdx < 0) return null;

  const allTrips: VanTrip[] = [];
  const allSeasonSet = new Set<string>();
  const vanFixedCosts: Record<string, { insurance: number; bollo: number }> = {};

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length < 2) continue;

    const dateStr = (row[dateIdx] || '').trim();
    const vanName = (row[vanIdx] || '').trim();

    const insuranceVal = insuranceIdx >= 0 && insuranceIdx < row.length ? parseEuro(row[insuranceIdx] || '') : 0;
    const bolloVal = bolloIdx >= 0 && bolloIdx < row.length ? parseEuro(row[bolloIdx] || '') : 0;

    if ((insuranceVal > 0 || bolloVal > 0) && dateStr && vanName) {
      const fcSeason = dateToSeason(dateStr);
      if (fcSeason) {
        allSeasonSet.add(fcSeason);
        const key = `${fcSeason}||${vanName}`;
        if (!vanFixedCosts[key]) vanFixedCosts[key] = { insurance: 0, bollo: 0 };
        if (insuranceVal > 0 && vanFixedCosts[key].insurance === 0) vanFixedCosts[key].insurance = insuranceVal;
        if (bolloVal > 0 && vanFixedCosts[key].bollo === 0) vanFixedCosts[key].bollo = bolloVal;
      }
    }

    if (row.length < 5) continue;
    if (!dateStr) continue;

    const parts = dateStr.split('/');
    if (parts.length < 3) continue;
    const calMonth = parseInt(parts[1], 10);
    const calYear = (() => { const y = parseInt(parts[2], 10); return y < 100 ? 2000 + y : y; })();
    const season = dateToSeason(dateStr);
    if (!season) continue;
    allSeasonSet.add(season);

    const smi = dateToSeasonMonthIndex(dateStr);

    const km = (() => {
      const v = kmIdx >= 0 ? (row[kmIdx] || '').trim() : '';
      if (!v) return 0;
      return parseInt(v.replace(/\./g, '').replace(',', '.'), 10) || 0;
    })();

    const gasCost = gasCostIdx >= 0 ? parseEuro(row[gasCostIdx] || '') : 0;
    const tollCrosses = tollIdx >= 0 ? (parseInt((row[tollIdx] || '').replace(/\D/g, ''), 10) || 0) : 0;

    const parkingRaw = parkingIdx >= 0 ? (row[parkingIdx] || '').trim() : '';
    const parkingCost = parkingRaw && !/^[A-Za-z]/.test(parkingRaw) ? parseEuro(parkingRaw) : 0;

    const olioRaw = olioIdx >= 0 ? (row[olioIdx] || '').trim() : '';
    const serviceCost = olioRaw && /[€\d]/.test(olioRaw) && !/^[A-Za-z]/.test(olioRaw) ? parseEuro(olioRaw) : 0;

    const repairCost = repairIdx >= 0 ? parseEuro(row[repairIdx] || '') : 0;

    allTrips.push({
      date: dateStr,
      calMonth,
      calYear,
      season,
      seasonMonthIndex: smi,
      van: vanName,
      km,
      gasCost,
      tollCrosses,
      parkingCost,
      serviceCost,
      repairCost,
      insurance: 0,
      bollo: 0,
      employee: employeeIdx >= 0 ? (row[employeeIdx] || '').trim() : '',
      department: deptIdx >= 0 ? (row[deptIdx] || '').trim() : '',
    });
  }

  const sortedSeasons = Array.from(allSeasonSet).sort();
  const seasonTrips = allTrips.filter(t => t.season === selectedSeason);
  if (seasonTrips.length === 0 && allTrips.length > 0) {
    return { overall: { km: 0, gasCost: 0, tollCrosses: 0, parkingCost: 0, serviceCost: 0, repairCost: 0, insurance: 0, bollo: 0, trips: 0, days: 0, totalCost: 0 }, byVan: {}, vans: [], allSeasons: sortedSeasons, monthlyOverall: [], monthlyByVan: {}, projYearlyKm: 0, daysInSeason: 0, yoyLineData: [] };
  }

  const sumTrips = (trips: VanTrip[]): Omit<VanSummary, 'insurance' | 'bollo'> & { insurance: number; bollo: number } => {
    const uniqueDays = new Set(trips.map(t => t.date)).size;
    const km = trips.reduce((s, t) => s + t.km, 0);
    const gasCost = trips.reduce((s, t) => s + t.gasCost, 0);
    const tollCrosses = trips.reduce((s, t) => s + t.tollCrosses, 0);
    const parkingCost = trips.reduce((s, t) => s + t.parkingCost, 0);
    const serviceCost = trips.reduce((s, t) => s + t.serviceCost, 0);
    const repairCost = trips.reduce((s, t) => s + t.repairCost, 0);
    const totalCost = gasCost + (tollCrosses * TOLL_COST_PER_CROSS) + parkingCost + serviceCost + repairCost;
    return { km, gasCost, tollCrosses, parkingCost, serviceCost, repairCost, insurance: 0, bollo: 0, trips: trips.length, days: uniqueDays, totalCost };
  };

  const vanNames = Array.from(new Set(seasonTrips.map(t => t.van))).sort();

  const seasonFixedByVan: Record<string, { insurance: number; bollo: number }> = {};
  let totalSeasonInsurance = 0;
  let totalSeasonBollo = 0;
  vanNames.forEach(v => {
    const key = `${selectedSeason}||${v}`;
    const fc = vanFixedCosts[key] || { insurance: 0, bollo: 0 };
    seasonFixedByVan[v] = fc;
    totalSeasonInsurance += fc.insurance;
    totalSeasonBollo += fc.bollo;
  });

  const byVan: Record<string, VanSummary> = {};
  vanNames.forEach(v => {
    const s = sumTrips(seasonTrips.filter(t => t.van === v));
    const fc = seasonFixedByVan[v];
    s.insurance = fc.insurance;
    s.bollo = fc.bollo;
    s.totalCost += fc.insurance + fc.bollo;
    byVan[v] = s;
  });

  const overallBase = sumTrips(seasonTrips);
  overallBase.insurance = totalSeasonInsurance;
  overallBase.bollo = totalSeasonBollo;
  overallBase.totalCost += totalSeasonInsurance + totalSeasonBollo;
  const overall = overallBase;

  const monthlyInsurance = Math.round((totalSeasonInsurance / 12) * 100) / 100;
  const monthlyBollo = Math.round((totalSeasonBollo / 12) * 100) / 100;

  const monthlyOverall = SEASON_MONTHS.map((month, mi) => {
    const mTrips = seasonTrips.filter(t => t.seasonMonthIndex === mi);
    const s = sumTrips(mTrips);
    return { month, km: s.km, gasCost: s.gasCost, tollCrosses: s.tollCrosses, parkingCost: s.parkingCost, serviceCost: s.serviceCost, repairCost: s.repairCost, insurance: monthlyInsurance, bollo: monthlyBollo, totalCost: s.totalCost + monthlyInsurance + monthlyBollo, trips: mTrips.length };
  });

  const monthlyByVan: Record<string, { month: string; km: number; gasCost: number; totalCost: number }[]> = {};
  vanNames.forEach(v => {
    const vTrips = seasonTrips.filter(t => t.van === v);
    const fc = seasonFixedByVan[v];
    const mIns = Math.round((fc.insurance / 12) * 100) / 100;
    const mBol = Math.round((fc.bollo / 12) * 100) / 100;
    monthlyByVan[v] = SEASON_MONTHS.map((month, mi) => {
      const mTrips = vTrips.filter(t => t.seasonMonthIndex === mi);
      const s = sumTrips(mTrips);
      return { month, km: s.km, gasCost: s.gasCost, totalCost: s.totalCost + mIns + mBol };
    });
  });

  const activeMonths = monthlyOverall.filter(m => m.trips > 0).length;
  const daysInSeason = new Set(seasonTrips.map(t => t.date)).size;
  const projYearlyKm = activeMonths > 0 ? Math.round((overall.km / activeMonths) * 12) : 0;

  const yoyLineData: { month: string; [season: string]: number | string }[] = SEASON_MONTHS.map((month, mi) => {
    const entry: { month: string; [season: string]: number | string } = { month };
    sortedSeasons.forEach(s => {
      const sTrips = allTrips.filter(t => t.season === s && t.seasonMonthIndex === mi);
      const variableCost = sTrips.reduce((sum, t) => sum + t.gasCost + (t.tollCrosses * TOLL_COST_PER_CROSS) + t.parkingCost + t.serviceCost + t.repairCost, 0);
      const sVans = Array.from(new Set(allTrips.filter(t => t.season === s).map(t => t.van)));
      let sFixedMonthly = 0;
      sVans.forEach(v => {
        const fc = vanFixedCosts[`${s}||${v}`];
        if (fc) sFixedMonthly += (fc.insurance + fc.bollo) / 12;
      });
      entry[s] = Math.round((variableCost + sFixedMonthly) * 100) / 100;
    });
    return entry;
  });

  return { overall, byVan, vans: vanNames, allSeasons: sortedSeasons, monthlyOverall, monthlyByVan, projYearlyKm, daysInSeason, yoyLineData };
}

function getCurrentSeason(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  if (month >= 6) {
    return `${String(year).slice(-2)}-${String(year + 1).slice(-2)}`;
  }
  return `${String(year - 1).slice(-2)}-${String(year).slice(-2)}`;
}

type TabId = 'energy' | 'van' | 'transactions';

interface CostControlCenterProps {
  onBackToLanding: () => void;
  onHome?: () => void;
}

export const CostControlCenter: React.FC<CostControlCenterProps> = ({ onBackToLanding, onHome }) => {
  const { theme, toggleTheme } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();
  const isDark = theme === 'dark';

  const [activeTab, setActiveTab] = useState<TabId>('energy');
  const [selectedSeason, setSelectedSeason] = useState(getCurrentSeason());

  const [energyRawRows, setEnergyRawRows] = useState<string[][] | null>(null);
  const [vanRawRows, setVanRawRows] = useState<string[][] | null>(null);

  const [energySheetId, setEnergySheetId] = useState('');
  const [energySheetName, setEnergySheetName] = useState('Energy');
  const [energyConfigured, setEnergyConfigured] = useState(false);
  const [showEnergyConfig, setShowEnergyConfig] = useState(false);

  const [vanSheetId, setVanSheetId] = useState('');
  const [vanSheetName, setVanSheetName] = useState('Van');
  const [vanConfigured, setVanConfigured] = useState(false);
  const [showVanConfig, setShowVanConfig] = useState(false);

  const [isSyncing, setIsSyncing] = useState<string | null>(null);
  const [syncSuccess, setSyncSuccess] = useState<string | null>(null);

  const [txSearch, setTxSearch] = useState('');

  const energyData = useMemo(() => {
    if (!energyRawRows) return null;
    const hdr = energyRawRows[0]?.map(h => (h || '').trim().toLowerCase().replace(/\s+/g, '_'));
    const sIdx = hdr?.indexOf('season') ?? -1;
    let latest = selectedSeason;
    if (sIdx >= 0) {
      const ss = new Set<string>();
      for (let r = 1; r < energyRawRows.length; r++) { const s = (energyRawRows[r]?.[sIdx] || '').trim(); if (s) ss.add(s); }
      const sorted = Array.from(ss).sort();
      if (sorted.length > 0) latest = sorted[sorted.length - 1];
    }
    return parseEnergySheetData(energyRawRows, latest);
  }, [energyRawRows]);
  const vanData = useMemo(() => vanRawRows ? parseVanSheetData(vanRawRows, selectedSeason) : null, [vanRawRows, selectedSeason]);

  const seasons = useMemo(() => {
    const fromData = new Set<string>();
    energyData?.allSeasons.forEach(s => fromData.add(s));
    vanData?.allSeasons?.forEach(s => fromData.add(s));
    if (fromData.size > 0) return Array.from(fromData).sort();
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const currentStartYear = month >= 6 ? year : year - 1;
    const result: string[] = [];
    for (let y = currentStartYear; y >= currentStartYear - 2; y--) {
      result.push(`${String(y).slice(-2)}-${String(y + 1).slice(-2)}`);
    }
    return result;
  }, [energyData, vanData]);

  useEffect(() => {
    ['energy', 'van'].forEach(mod => {
      fetch(`/api/revenue/sheet-config/${mod}`)
        .then(r => r.json())
        .then(res => {
          if (res.success) {
            if (mod === 'energy') {
              if (res.sheetId) { setEnergySheetId(res.sheetId); setEnergyConfigured(true); }
              if (res.sheetName) setEnergySheetName(res.sheetName);
            } else {
              if (res.sheetId) { setVanSheetId(res.sheetId); setVanConfigured(true); }
              if (res.sheetName) setVanSheetName(res.sheetName);
            }
          }
        }).catch(() => {});
      fetch(`/api/revenue/sheet-data/${mod}`)
        .then(r => r.json())
        .then(res => {
          if (res.success && res.data) {
            if (mod === 'energy') setEnergyRawRows(res.data);
            if (mod === 'van') setVanRawRows(res.data);
          }
        }).catch(() => {});
    });
  }, []);

  const handleSyncSheet = async (mod: 'energy' | 'van') => {
    setIsSyncing(mod);
    setSyncSuccess(null);
    try {
      const res = await fetch(`/api/revenue/sync-sheet/${mod}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
      const result = await res.json();
      if (result.success) {
        if (mod === 'energy') setEnergyRawRows(result.data);
        if (mod === 'van') setVanRawRows(result.data);
        setSyncSuccess(mod);
        setTimeout(() => setSyncSuccess(null), 3000);
      } else {
        alert(result.message || 'Sync failed');
      }
    } catch (err) {
      console.error('Sync failed:', err);
    } finally {
      setIsSyncing(null);
    }
  };

  const handleSaveConfig = async (mod: 'energy' | 'van') => {
    const sid = mod === 'energy' ? energySheetId : vanSheetId;
    const sname = mod === 'energy' ? energySheetName : vanSheetName;
    if (!sid.trim()) return;
    try {
      const res = await fetch(`/api/revenue/sheet-config/${mod}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sheetId: sid.trim(), sheetName: sname.trim() }) });
      const result = await res.json();
      if (result.success) {
        if (mod === 'energy') { setEnergyConfigured(true); setShowEnergyConfig(false); }
        else { setVanConfigured(true); setShowVanConfig(false); }
      }
    } catch (err) {
      console.error('Config save failed:', err);
    }
  };

  const tabs: { id: TabId; label: string; icon: React.ElementType; color: string }[] = [
    { id: 'energy', label: t('Energy'), icon: Zap, color: 'text-yellow-600' },
    { id: 'van', label: t('Van'), icon: Truck, color: 'text-blue-600' },
    { id: 'transactions', label: t('Transaction Search'), icon: Search, color: 'text-purple-600' },
  ];

  const yoyPctLabel = (cur: number, prev: number) => {
    if (!prev) return '';
    const pct = ((cur - prev) / prev) * 100;
    return `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`;
  };
  const yoyColor = (cur: number, prev: number) => {
    if (!prev) return isDark ? 'text-gray-500' : 'text-gray-400';
    return cur <= prev ? 'text-emerald-500' : 'text-red-500';
  };

  const renderSheetTab = (mod: 'energy' | 'van', data: SheetTabData | null, configured: boolean, sheetId: string, setSheetIdFn: (v: string) => void, sheetName: string, setSheetNameFn: (v: string) => void, showConfig: boolean, setShowConfigFn: (v: boolean) => void, icon: React.ElementType, iconColor: string) => {
    const Icon = icon;
    const items = data?.items || [];

    const LTM_LINE_COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];
    const ltmPeriods = data?.ltmPeriods || [];
    const ltmMonthLabels = data?.ltmMonthLabels || [];
    const ltmCurrent = ltmPeriods.length > 0 ? ltmPeriods[0] : null;
    const ltmPrev = ltmPeriods.length > 1 ? ltmPeriods[1] : null;
    const isLtmMode = mod === 'energy' && ltmCurrent !== null && ltmMonthLabels.length === 12;

    const ltmActiveIndices = isLtmMode ? ltmCurrent!.monthlyTotals.map((v, i) => v > 0 ? i : -1).filter(i => i >= 0) : [];
    const ltmActiveLabels = ltmActiveIndices.map(i => ltmMonthLabels[i]);
    const ltmTotal = isLtmMode ? ltmActiveIndices.reduce((s, i) => s + ltmCurrent!.monthlyTotals[i], 0) : 0;
    const ltmGasTotal = isLtmMode ? ltmActiveIndices.reduce((s, i) => s + ltmCurrent!.gasCosts[i], 0) : 0;
    const ltmElecTotal = isLtmMode ? ltmActiveIndices.reduce((s, i) => s + ltmCurrent!.elecCosts[i], 0) : 0;
    const ltmPrevTotal = isLtmMode && ltmPrev ? ltmActiveIndices.reduce((s, i) => s + ltmPrev.monthlyTotals[i], 0) : 0;
    const ltmPrevGasTotal = isLtmMode && ltmPrev ? ltmActiveIndices.reduce((s, i) => s + ltmPrev.gasCosts[i], 0) : 0;
    const ltmPrevElecTotal = isLtmMode && ltmPrev ? ltmActiveIndices.reduce((s, i) => s + ltmPrev.elecCosts[i], 0) : 0;
    const ltmActiveMonths = ltmActiveIndices.length;

    const monthlyTotals = SEASON_MONTHS.map((_, mi) => items.reduce((s, item) => s + item.values[mi], 0));
    const ytd = monthlyTotals.reduce((s, v) => s + v, 0);
    const lastActiveMonth = (() => { for (let i = 11; i >= 0; i--) { if (monthlyTotals[i] > 0) return i; } return -1; })();
    const chartData = isLtmMode
      ? ltmActiveIndices.map(wi => {
          const name = ltmMonthLabels[wi];
          return { name, total: ltmCurrent!.monthlyTotals[wi], hasData: true, Gas: ltmCurrent!.gasCosts[wi], Electricity: ltmCurrent!.elecCosts[wi] };
        })
      : SEASON_MONTHS.map((name, i) => {
          const entry: Record<string, any> = { name, total: monthlyTotals[i], hasData: i <= lastActiveMonth };
          items.forEach(item => { entry[item.name] = item.values[i]; });
          return entry;
        }).slice(0, Math.max(lastActiveMonth + 2, 7));
    const itemYTDs = isLtmMode ? [ltmGasTotal, ltmElecTotal] : items.map(item => item.values.reduce((s, v) => s + v, 0));
    const energyItems = isLtmMode ? [{ name: 'Gas', color: COLORS.gas }, { name: 'Electricity', color: COLORS.electricity }].filter((_, idx) => (idx === 0 ? ltmGasTotal > 0 : ltmElecTotal > 0)) : items;

    const yoy = data?.yoySummary;
    const hasPrevSeason = isLtmMode ? ltmPrev !== null : (yoy && yoy.totalYtdPrev > 0);

    const facilityChartData = isLtmMode
      ? ltmActiveIndices.map(wi => ({
          name: ltmMonthLabels[wi],
          'Gas Arena': ltmCurrent!.facilityGas.arena[wi],
          'Gas Campus': ltmCurrent!.facilityGas.campus[wi],
          'Elec Arena': ltmCurrent!.facilityElec.arena[wi],
          'Elec Campus': ltmCurrent!.facilityElec.campus[wi],
        }))
      : data ? SEASON_MONTHS.map((name, i) => ({
          name,
          'Gas Arena': data.facilityGas.arena[i],
          'Gas Campus': data.facilityGas.campus[i],
          'Elec Arena': data.facilityElec.arena[i],
          'Elec Campus': data.facilityElec.campus[i],
        })).slice(0, Math.max(lastActiveMonth + 2, 7)) : [];

    const ltmLineChartData = ltmMonthLabels.length === 12 ? ltmMonthLabels.map((month, wi) => {
      const entry: Record<string, number | string> = { month };
      ltmPeriods.forEach(p => { entry[`${p.label} (${p.season})`] = p.monthlyTotals[wi]; });
      return entry;
    }) : [];
    const ltmLineKeys = ltmPeriods.map(p => `${p.label} (${p.season})`);

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
              <Icon size={20} className={iconColor} />
            </div>
            <div>
              <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>{mod === 'energy' ? t('Energy Consumption') : t('Van Costs')}</h2>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{isLtmMode ? t('Last Twelve Months') : `${t('Season')} ${selectedSeason}`}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {configured && (
              <button onClick={() => handleSyncSheet(mod)} disabled={isSyncing === mod}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${syncSuccess === mod ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-900/50'}`}>
                {isSyncing === mod ? <Loader2 size={14} className="animate-spin" /> : syncSuccess === mod ? <Check size={14} /> : <RefreshCw size={14} />}
                {syncSuccess === mod ? t('Synced') : t('Sync Sheet')}
              </button>
            )}
            <button onClick={() => setShowConfigFn(!showConfig)}
              className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
              <Settings size={16} />
            </button>
          </div>
        </div>

        {showConfig && (
          <div className={`p-4 rounded-xl border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
            <h4 className={`text-sm font-semibold mb-3 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>{t('Google Sheet Configuration')}</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">{t('Sheet ID')}</label>
                <input value={sheetId} onChange={(e) => setSheetIdFn(e.target.value)} placeholder="1abc..." className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">{t('Tab Name')}</label>
                <input value={sheetName} onChange={(e) => setSheetNameFn(e.target.value)} placeholder={mod === 'energy' ? 'Energy' : 'Van'} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <button onClick={() => handleSaveConfig(mod)} className="px-4 py-1.5 bg-purple-600 text-white text-xs rounded-lg hover:bg-purple-700">{t('Save')}</button>
              <button onClick={() => setShowConfigFn(false)} className="px-4 py-1.5 bg-gray-200 dark:bg-gray-700 text-xs rounded-lg">{t('Cancel')}</button>
            </div>
          </div>
        )}

        {!data || (!data.items.length && !data.monthRows.length) ? (
          <div className={`p-12 rounded-xl border text-center ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
            <FileSpreadsheet size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>{t('No Data Connected')}</h3>
            <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {t('Connect a Google Sheet to start tracking')} {mod === 'energy' ? t('energy consumption') : t('van costs')}.
            </p>
            <button onClick={() => setShowConfigFn(true)} className="px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700">
              <FileSpreadsheet size={16} className="inline mr-1.5" />{t('Connect Sheet')}
            </button>
          </div>
        ) : (items.length === 0 && !isLtmMode) ? (
          <div className={`p-8 rounded-xl border text-center ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
            <Calendar size={36} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
            <h3 className={`text-base font-semibold mb-1 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>{t('No data for season')} {selectedSeason}</h3>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('Select a different season or sync the sheet with updated data.')}</p>
          </div>
        ) : (
          <>
            {}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className={`p-4 rounded-xl border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} shadow-sm`}>
                <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{isLtmMode ? t('LTM Total') : t('YTD Total')}</p>
                <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>{formatCurrency(isLtmMode ? ltmTotal : ytd)}</p>
                {isLtmMode && ltmPrev ? <p className={`text-[10px] mt-1 font-semibold ${yoyColor(ltmTotal, ltmPrevTotal)}`}>{yoyPctLabel(ltmTotal, ltmPrevTotal)} {t('vs LTM-1')}</p>
                : hasPrevSeason && !isLtmMode ? <p className={`text-[10px] mt-1 font-semibold ${yoyColor(ytd, yoy!.totalYtdPrev)}`}>{yoyPctLabel(ytd, yoy!.totalYtdPrev)} {t('vs LTM')}</p>
                : <p className={`text-[10px] mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{isLtmMode ? `${ltmActiveMonths} ${t('months')}` : `${t('Through')} ${SEASON_MONTHS[lastActiveMonth] || '—'}`}</p>}
              </div>
              <div className={`p-4 rounded-xl border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} shadow-sm`}>
                <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 text-amber-500`}>{isLtmMode ? t('Gas LTM') : t('Gas YTD')}</p>
                <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>{formatCurrency(isLtmMode ? ltmGasTotal : (yoy?.gasYtd || 0))}</p>
                {isLtmMode && ltmPrev ? <p className={`text-[10px] mt-1 font-semibold ${yoyColor(ltmGasTotal, ltmPrevGasTotal)}`}>{yoyPctLabel(ltmGasTotal, ltmPrevGasTotal)} {t('vs LTM-1')}</p>
                : hasPrevSeason && !isLtmMode && <p className={`text-[10px] mt-1 font-semibold ${yoyColor(yoy!.gasYtd, yoy!.gasYtdPrev)}`}>{yoyPctLabel(yoy!.gasYtd, yoy!.gasYtdPrev)} {t('vs LTM')}</p>}
              </div>
              <div className={`p-4 rounded-xl border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} shadow-sm`}>
                <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 text-blue-500`}>{isLtmMode ? t('Electricity LTM') : t('Electricity YTD')}</p>
                <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>{formatCurrency(isLtmMode ? ltmElecTotal : (yoy?.elecYtd || 0))}</p>
                {isLtmMode && ltmPrev ? <p className={`text-[10px] mt-1 font-semibold ${yoyColor(ltmElecTotal, ltmPrevElecTotal)}`}>{yoyPctLabel(ltmElecTotal, ltmPrevElecTotal)} {t('vs LTM-1')}</p>
                : hasPrevSeason && !isLtmMode && <p className={`text-[10px] mt-1 font-semibold ${yoyColor(yoy!.elecYtd, yoy!.elecYtdPrev)}`}>{yoyPctLabel(yoy!.elecYtd, yoy!.elecYtdPrev)} {t('vs LTM')}</p>}
              </div>
              <div className={`p-4 rounded-xl border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} shadow-sm`}>
                <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('Avg Monthly')}</p>
                <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>{isLtmMode ? formatCurrency(ltmActiveMonths > 0 ? ltmTotal / ltmActiveMonths : 0) : (lastActiveMonth >= 0 ? formatCurrency(ytd / (lastActiveMonth + 1)) : '—')}</p>
                <p className={`text-[10px] mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{isLtmMode ? `${ltmActiveMonths} ${t('months')}` : `${lastActiveMonth + 1} ${t('months')}`}</p>
              </div>
            </div>

            {}
            <div className={`p-5 rounded-xl border shadow-sm ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
              <h3 className={`text-sm font-bold uppercase tracking-wider mb-4 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>{t('Monthly Cost Breakdown')}</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tickFormatter={formatCompact} tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                    {(isLtmMode ? energyItems : items).length > 1 && <Legend wrapperStyle={{ fontSize: 11 }} />}
                    {(isLtmMode ? energyItems : items).length > 1 ? (isLtmMode ? energyItems : items).map((item, idx) => (
                      <Bar key={item.name} dataKey={item.name} stackId="cost" fill={item.color} radius={idx === (isLtmMode ? energyItems : items).length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]} />
                    )) : (
                      <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                        {chartData.map((entry, index) => (
                          <Cell key={index} fill={entry.hasData ? (mod === 'energy' ? '#f59e0b' : '#3b82f6') : '#e5e7eb'} />
                        ))}
                      </Bar>
                    )}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {}
            {ltmLineKeys.length > 1 && ltmLineChartData.length > 0 && (
              <div className={`p-5 rounded-xl border shadow-sm ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
                <h3 className={`text-sm font-bold uppercase tracking-wider mb-4 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>{t('LTM Comparison')}</h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={ltmLineChartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                      <YAxis tickFormatter={formatCompact} tick={{ fontSize: 10 }} />
                      <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      {ltmLineKeys.map((key, i) => (
                        <Line
                          key={key}
                          type="monotone"
                          dataKey={key}
                          stroke={LTM_LINE_COLORS[i % LTM_LINE_COLORS.length]}
                          strokeWidth={i === 0 ? 3 : 1.5}
                          strokeOpacity={i === 0 ? 1 : 0.5}
                          dot={i === 0 ? { r: 4 } : false}
                          activeDot={i === 0 ? { r: 6 } : { r: 3 }}
                          connectNulls
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {}
            {mod === 'energy' && data && (data.facilityGas.arena.some(v => v > 0) || data.facilityElec.arena.some(v => v > 0)) && (
              <div className={`p-5 rounded-xl border shadow-sm ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
                <h3 className={`text-sm font-bold uppercase tracking-wider mb-4 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>{t('Consumption by Facility')}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <h4 className={`text-xs font-semibold mb-2 text-amber-500`}>{t('Gas Consumption')} (m³)</h4>
                    <div className="h-52">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={facilityChartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                          <YAxis tickFormatter={(v: number) => v >= 1000 ? `${(v/1000).toFixed(0)}K` : String(v)} tick={{ fontSize: 9 }} />
                          <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} formatter={(v: number) => v.toLocaleString('it-IT')} />
                          <Legend wrapperStyle={{ fontSize: 10 }} />
                          <Bar dataKey="Gas Arena" stackId="gas" fill={COLORS.arena} radius={[0, 0, 0, 0]} />
                          <Bar dataKey="Gas Campus" stackId="gas" fill={COLORS.campus} radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div>
                    <h4 className={`text-xs font-semibold mb-2 text-blue-500`}>{t('Electricity Consumption')} (kWh)</h4>
                    <div className="h-52">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={facilityChartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                          <YAxis tickFormatter={(v: number) => v >= 1000 ? `${(v/1000).toFixed(0)}K` : String(v)} tick={{ fontSize: 9 }} />
                          <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} formatter={(v: number) => v.toLocaleString('it-IT')} />
                          <Legend wrapperStyle={{ fontSize: 10 }} />
                          <Bar dataKey="Elec Arena" stackId="elec" fill={COLORS.arena} radius={[0, 0, 0, 0]} />
                          <Bar dataKey="Elec Campus" stackId="elec" fill={COLORS.campus} radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
                {}
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {(() => {
                    const sumActive = (arr: number[]) => isLtmMode ? ltmActiveIndices.reduce((s, i) => s + arr[i], 0) : arr.reduce((s,v) => s+v, 0);
                    const curFGas = isLtmMode ? ltmCurrent!.facilityGas : data.facilityGas;
                    const curFElec = isLtmMode ? ltmCurrent!.facilityElec : data.facilityElec;
                    const prevFGas = isLtmMode && ltmPrev ? ltmPrev.facilityGas : { arena: data.prevFacilityGas.arena, campus: data.prevFacilityGas.campus };
                    const prevFElec = isLtmMode && ltmPrev ? ltmPrev.facilityElec : { arena: data.prevFacilityElec.arena, campus: data.prevFacilityElec.campus };
                    const gaA = sumActive(curFGas.arena);
                    const gaC = sumActive(curFGas.campus);
                    const elA = sumActive(curFElec.arena);
                    const elC = sumActive(curFElec.campus);
                    const pGaA = sumActive(prevFGas.arena);
                    const pGaC = sumActive(prevFGas.campus);
                    const pElA = sumActive(prevFElec.arena);
                    const pElC = sumActive(prevFElec.campus);
                    return [
                      { label: t('Gas Arena'), value: gaA.toLocaleString('it-IT') + ' m³', color: 'text-purple-500', cur: gaA, prev: pGaA },
                      { label: t('Gas Campus'), value: gaC.toLocaleString('it-IT') + ' m³', color: 'text-emerald-500', cur: gaC, prev: pGaC },
                      { label: t('Elec Arena'), value: elA.toLocaleString('it-IT') + ' kWh', color: 'text-purple-500', cur: elA, prev: pElA },
                      { label: t('Elec Campus'), value: elC.toLocaleString('it-IT') + ' kWh', color: 'text-emerald-500', cur: elC, prev: pElC },
                    ].map((s, i) => (
                      <div key={i} className={`p-3 rounded-lg border ${isDark ? 'bg-gray-800/50 border-gray-800' : 'bg-gray-50 border-gray-100'}`}>
                        <p className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 ${s.color}`}>{s.label}</p>
                        <p className={`text-sm font-semibold tabular-nums ${isDark ? 'text-white' : 'text-gray-800'}`}>{s.value}</p>
                        {s.prev > 0 && <p className={`text-[10px] mt-0.5 font-semibold ${yoyColor(s.cur, s.prev)}`}>{yoyPctLabel(s.cur, s.prev)} {isLtmMode ? t('vs LTM-1') : t('vs LTM')}</p>}
                      </div>
                    ));
                  })()}
                </div>
              </div>
            )}

            {}
            {mod === 'energy' && ltmPeriods.length > 1 && ltmMonthLabels.length === 12 && (() => {
              const FACILITY_METRICS = [
                { title: t('Gas Arena LTM') + ' (m³)', color: 'text-amber-500', accessor: (p: typeof ltmPeriods[0]) => p.facilityGas.arena },
                { title: t('Gas Campus LTM') + ' (m³)', color: 'text-amber-500', accessor: (p: typeof ltmPeriods[0]) => p.facilityGas.campus },
                { title: t('Elec Arena LTM') + ' (kWh)', color: 'text-blue-500', accessor: (p: typeof ltmPeriods[0]) => p.facilityElec.arena },
                { title: t('Elec Campus LTM') + ' (kWh)', color: 'text-blue-500', accessor: (p: typeof ltmPeriods[0]) => p.facilityElec.campus },
              ];
              return (
                <div className={`p-5 rounded-xl border shadow-sm ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
                  <h3 className={`text-sm font-bold uppercase tracking-wider mb-4 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>{t('LTM Facility Comparison')}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {FACILITY_METRICS.map((metric, mi) => {
                      const chartData = ltmMonthLabels.map((month, wi) => {
                        const entry: Record<string, number | string> = { month };
                        ltmPeriods.forEach(p => { entry[`${p.label} (${p.season})`] = metric.accessor(p)[wi]; });
                        return entry;
                      });
                      const lineKeys = ltmPeriods.map(p => `${p.label} (${p.season})`);
                      return (
                        <div key={mi}>
                          <h4 className={`text-xs font-semibold mb-2 ${metric.color}`}>{metric.title}</h4>
                          <div className="h-52">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="month" tick={{ fontSize: 9 }} />
                                <YAxis tickFormatter={(v: number) => v >= 1000 ? `${(v/1000).toFixed(0)}K` : String(v)} tick={{ fontSize: 9 }} />
                                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} formatter={(v: number) => v.toLocaleString('it-IT')} />
                                <Legend wrapperStyle={{ fontSize: 10 }} />
                                {lineKeys.map((key, li) => (
                                  <Line
                                    key={key}
                                    type="monotone"
                                    dataKey={key}
                                    stroke={LTM_LINE_COLORS[li % LTM_LINE_COLORS.length]}
                                    strokeWidth={li === 0 ? 2.5 : 1.5}
                                    strokeOpacity={li === 0 ? 1 : 0.5}
                                    dot={li === 0 ? { r: 3 } : false}
                                    activeDot={li === 0 ? { r: 5 } : { r: 3 }}
                                    connectNulls
                                  />
                                ))}
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {}
            <div className={`p-5 rounded-xl border shadow-sm ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
              <h3 className={`text-sm font-bold uppercase tracking-wider mb-4 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>{t('Monthly Detail')}</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className={`border-b ${isDark ? 'border-gray-700 text-gray-400' : 'border-gray-200 text-gray-500'}`}>
                      <th className="text-left py-2 px-3 font-medium">{t('Item')}</th>
                      {(isLtmMode ? ltmActiveLabels : SEASON_MONTHS.slice(0, Math.max(lastActiveMonth + 1, 1))).map(m => (
                        <th key={m} className="text-right py-2 px-2 font-medium text-xs">{m}</th>
                      ))}
                      <th className="text-right py-2 px-3 font-medium">{t('Total')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLtmMode ? (
                      <>
                        {ltmGasTotal > 0 && (
                          <tr className={`border-b ${isDark ? 'border-gray-800 hover:bg-gray-800/50' : 'border-gray-100 hover:bg-gray-50'}`}>
                            <td className={`py-2 px-3 font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                              <span className="inline-block w-2 h-2 rounded-full mr-2" style={{ backgroundColor: COLORS.gas }} />Gas
                            </td>
                            {ltmActiveIndices.map(wi => {
                              const v = ltmCurrent!.gasCosts[wi];
                              return <td key={wi} className={`text-right py-2 px-2 tabular-nums text-xs ${v > 0 ? (isDark ? 'text-gray-200' : 'text-gray-700') : (isDark ? 'text-gray-600' : 'text-gray-300')}`}>{v > 0 ? formatCurrency(v) : '—'}</td>;
                            })}
                            <td className={`text-right py-2 px-3 font-semibold tabular-nums ${isDark ? 'text-white' : 'text-gray-800'}`}>{formatCurrency(ltmGasTotal)}</td>
                          </tr>
                        )}
                        {ltmElecTotal > 0 && (
                          <tr className={`border-b ${isDark ? 'border-gray-800 hover:bg-gray-800/50' : 'border-gray-100 hover:bg-gray-50'}`}>
                            <td className={`py-2 px-3 font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                              <span className="inline-block w-2 h-2 rounded-full mr-2" style={{ backgroundColor: COLORS.electricity }} />Electricity
                            </td>
                            {ltmActiveIndices.map(wi => {
                              const v = ltmCurrent!.elecCosts[wi];
                              return <td key={wi} className={`text-right py-2 px-2 tabular-nums text-xs ${v > 0 ? (isDark ? 'text-gray-200' : 'text-gray-700') : (isDark ? 'text-gray-600' : 'text-gray-300')}`}>{v > 0 ? formatCurrency(v) : '—'}</td>;
                            })}
                            <td className={`text-right py-2 px-3 font-semibold tabular-nums ${isDark ? 'text-white' : 'text-gray-800'}`}>{formatCurrency(ltmElecTotal)}</td>
                          </tr>
                        )}
                        <tr className={`font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                          <td className="py-2 px-3">{t('Total')}</td>
                          {ltmActiveIndices.map(wi => {
                            const v = ltmCurrent!.monthlyTotals[wi];
                            return <td key={wi} className="text-right py-2 px-2 tabular-nums text-xs">{v > 0 ? formatCurrency(v) : '—'}</td>;
                          })}
                          <td className="text-right py-2 px-3 tabular-nums">{formatCurrency(ltmTotal)}</td>
                        </tr>
                        {ltmPrev && (
                          <tr className={`${isDark ? 'text-gray-500' : 'text-gray-400'} text-xs`}>
                            <td className="py-1.5 px-3 italic">{t('LTM-1')} ({ltmPrev.season})</td>
                            {ltmActiveIndices.map(wi => {
                              const v = ltmPrev.monthlyTotals[wi];
                              return <td key={wi} className="text-right py-1.5 px-2 tabular-nums">{v > 0 ? formatCurrency(v) : '—'}</td>;
                            })}
                            <td className="text-right py-1.5 px-3 tabular-nums">{formatCurrency(ltmPrevTotal)}</td>
                          </tr>
                        )}
                      </>
                    ) : (
                      <>
                        {items.map((item, idx) => (
                          <tr key={idx} className={`border-b ${isDark ? 'border-gray-800 hover:bg-gray-800/50' : 'border-gray-100 hover:bg-gray-50'}`}>
                            <td className={`py-2 px-3 font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                              <span className="inline-block w-2 h-2 rounded-full mr-2" style={{ backgroundColor: item.color }} />
                              {item.name}
                            </td>
                            {SEASON_MONTHS.slice(0, Math.max(lastActiveMonth + 1, 1)).map((m, mi) => (
                              <td key={m} className={`text-right py-2 px-2 tabular-nums text-xs ${item.values[mi] > 0 ? (isDark ? 'text-gray-200' : 'text-gray-700') : (isDark ? 'text-gray-600' : 'text-gray-300')}`}>
                                {item.values[mi] > 0 ? formatCurrency(item.values[mi]) : '—'}
                              </td>
                            ))}
                            <td className={`text-right py-2 px-3 font-semibold tabular-nums ${isDark ? 'text-white' : 'text-gray-800'}`}>{formatCurrency(itemYTDs[idx])}</td>
                          </tr>
                        ))}
                        <tr className={`font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                          <td className="py-2 px-3">{t('Total')}</td>
                          {SEASON_MONTHS.slice(0, Math.max(lastActiveMonth + 1, 1)).map((m, mi) => (
                            <td key={m} className="text-right py-2 px-2 tabular-nums text-xs">{monthlyTotals[mi] > 0 ? formatCurrency(monthlyTotals[mi]) : '—'}</td>
                          ))}
                          <td className="text-right py-2 px-3 tabular-nums">{formatCurrency(ytd)}</td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  const VAN_COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444'];

  const renderVanTab = () => {
    const data = vanData;
    const configured = vanConfigured;
    const formatNum = (v: number) => v.toLocaleString('it-IT');
    const formatKm = (v: number) => `${v.toLocaleString('it-IT')} km`;
    const perKm = (cost: number, km: number) => km > 0 ? `€${(cost / km).toFixed(3)}` : '—';
    const lastActiveMonth = data ? (() => { for (let i = 11; i >= 0; i--) { if (data.monthlyOverall[i]?.trips > 0) return i; } return -1; })() : -1;

    const sheetConfigBlock = (
      <>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
              <Truck size={20} className="text-blue-600" />
            </div>
            <div>
              <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>{t('Van Costs')}</h2>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('Season')} {selectedSeason}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {configured && (
              <button onClick={() => handleSyncSheet('van')} disabled={isSyncing === 'van'}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${syncSuccess === 'van' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-900/50'}`}>
                {isSyncing === 'van' ? <Loader2 size={14} className="animate-spin" /> : syncSuccess === 'van' ? <Check size={14} /> : <RefreshCw size={14} />}
                {syncSuccess === 'van' ? t('Synced') : t('Sync Sheet')}
              </button>
            )}
            <button onClick={() => setShowVanConfig(!showVanConfig)}
              className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
              <Settings size={16} />
            </button>
          </div>
        </div>

        {showVanConfig && (
          <div className={`p-4 rounded-xl border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
            <h4 className={`text-sm font-semibold mb-3 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>{t('Google Sheet Configuration')}</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">{t('Sheet ID')}</label>
                <input value={vanSheetId} onChange={(e) => setVanSheetId(e.target.value)} placeholder="1abc..." className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">{t('Tab Name')}</label>
                <input value={vanSheetName} onChange={(e) => setVanSheetName(e.target.value)} placeholder="Van" className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <button onClick={() => handleSaveConfig('van')} className="px-4 py-1.5 bg-purple-600 text-white text-xs rounded-lg hover:bg-purple-700">{t('Save')}</button>
              <button onClick={() => setShowVanConfig(false)} className="px-4 py-1.5 bg-gray-200 dark:bg-gray-700 text-xs rounded-lg">{t('Cancel')}</button>
            </div>
          </div>
        )}
      </>
    );

    if (!data || data.overall.trips === 0) {
      return (
        <div className="space-y-6">
          {sheetConfigBlock}
          <div className={`p-12 rounded-xl border text-center ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
            <FileSpreadsheet size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>{data ? t('No data for season') + ' ' + selectedSeason : t('No Data Connected')}</h3>
            <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {data ? t('Select a different season or sync the sheet with updated data.') : t('Connect a Google Sheet to start tracking') + ' ' + t('van costs') + '.'}
            </p>
            {!configured && (
              <button onClick={() => setShowVanConfig(true)} className="px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700">
                <FileSpreadsheet size={16} className="inline mr-1.5" />{t('Connect Sheet')}
              </button>
            )}
          </div>
        </div>
      );
    }

    const o = data.overall;
    const tollCost = o.tollCrosses * TOLL_COST_PER_CROSS;
    const fixedCost = o.insurance + o.bollo;
    const dailyKm = data.daysInSeason > 0 ? Math.round(o.km / data.daysInSeason) : 0;
    const costPerKm = o.km > 0 ? o.totalCost / o.km : 0;

    const chartData = SEASON_MONTHS.map((name, i) => {
      const m = data.monthlyOverall[i];
      return { name, Gas: m.gasCost, Toll: m.tollCrosses * TOLL_COST_PER_CROSS, Insurance: m.insurance, Bollo: m.bollo, Service: m.serviceCost, Repair: m.repairCost, total: m.totalCost };
    }).slice(0, Math.max(lastActiveMonth + 2, 7));

    const kmChartData = SEASON_MONTHS.map((name, i) => {
      const entry: Record<string, any> = { name };
      data.vans.forEach(v => { entry[v] = data.monthlyByVan[v]?.[i]?.km || 0; });
      return entry;
    }).slice(0, Math.max(lastActiveMonth + 2, 7));

    const SEASON_LINE_COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

    return (
      <div className="space-y-6">
        {sheetConfigBlock}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'YTD Km', value: formatKm(o.km), sub: `${formatNum(o.trips)} ${t('trips')} · ${formatNum(data.daysInSeason)} ${t('days')}` },
            { label: 'YTD Gas', value: formatCurrency(o.gasCost), sub: perKm(o.gasCost, o.km) + ' /km' },
            { label: 'YTD Toll', value: formatCurrency(tollCost), sub: `${formatNum(o.tollCrosses)} ${t('crosses')} · €${TOLL_COST_PER_CROSS.toFixed(2)}/cross` },
            { label: t('Fix Cost (Yr)'), value: formatCurrency(fixedCost), sub: `${t('Ins.')} ${formatCurrency(o.insurance)} · ${t('Bollo')} ${formatCurrency(o.bollo)} · ${formatCurrency(Math.round((fixedCost / 12) * 100) / 100)}/mo` },
            { label: 'YTD Service', value: formatCurrency(o.serviceCost), sub: perKm(o.serviceCost, o.km) + ' /km' },
            { label: 'YTD Repair', value: formatCurrency(o.repairCost), sub: perKm(o.repairCost, o.km) + ' /km' },
            { label: t('Proj. Yearly Km'), value: formatKm(data.projYearlyKm), sub: `${lastActiveMonth + 1}/12 ${t('months')}` },
            { label: t('YTD Cost / Km'), value: `€${costPerKm.toFixed(3)}`, sub: formatCurrency(o.totalCost) + ` ${t('total')}` },
          ].map((kpi, i) => (
            <div key={i} className={`p-4 rounded-xl border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} shadow-sm`}>
              <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{kpi.label}</p>
              <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>{kpi.value}</p>
              <p className={`text-[10px] mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{kpi.sub}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: t('Daily Km'), value: formatNum(dailyKm) },
            { label: t('Gas / Km'), value: perKm(o.gasCost, o.km) },
            { label: t('Toll / Cross'), value: `€${TOLL_COST_PER_CROSS.toFixed(2)}` },
            { label: t('Fix Cost / Km'), value: perKm(fixedCost, o.km) },
            { label: t('Service / Km'), value: perKm(o.serviceCost, o.km) },
            { label: t('Repair / Km'), value: perKm(o.repairCost, o.km) },
            { label: t('Total / Km'), value: perKm(o.totalCost, o.km) },
          ].map((m, i) => (
            <div key={i} className={`p-3 rounded-lg border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} shadow-sm text-center`}>
              <p className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{m.label}</p>
              <p className={`text-base font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>{m.value}</p>
            </div>
          ))}
        </div>

        <div className={`p-5 rounded-xl border shadow-sm ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
          <h3 className={`text-sm font-bold uppercase tracking-wider mb-4 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>{t('Monthly Cost Breakdown')}</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tickFormatter={formatCompact} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="Gas" stackId="cost" fill="#f59e0b" />
                <Bar dataKey="Toll" stackId="cost" fill="#8b5cf6" />
                <Bar dataKey="Insurance" stackId="cost" fill="#06b6d4" />
                <Bar dataKey="Bollo" stackId="cost" fill="#64748b" />
                <Bar dataKey="Service" stackId="cost" fill="#10b981" />
                <Bar dataKey="Repair" stackId="cost" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={`p-5 rounded-xl border shadow-sm ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
          <h3 className={`text-sm font-bold uppercase tracking-wider mb-4 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>{t('Km by Van')}</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={kmChartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tickFormatter={(v: number) => v >= 1000 ? `${(v/1000).toFixed(0)}K` : String(v)} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(value: number) => formatNum(value) + ' km'} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {data.vans.map((v, i) => (
                  <Bar key={v} dataKey={v} stackId="km" fill={VAN_COLORS[i % VAN_COLORS.length]} radius={i === data.vans.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {data.allSeasons.length > 1 && (
          <div className={`p-5 rounded-xl border shadow-sm ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
            <h3 className={`text-sm font-bold uppercase tracking-wider mb-4 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>{t('Year-over-Year Comparison')}</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.yoyLineData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                  <YAxis tickFormatter={formatCompact} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  {data.allSeasons.map((s, i) => (
                    <Line key={s} type="monotone" dataKey={s} stroke={SEASON_LINE_COLORS[i % SEASON_LINE_COLORS.length]} strokeWidth={s === selectedSeason ? 3 : 1.5} strokeOpacity={s === selectedSeason ? 1 : 0.5} dot={s === selectedSeason ? { r: 4 } : false} activeDot={s === selectedSeason ? { r: 6 } : { r: 3 }} connectNulls />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        <div className={`p-5 rounded-xl border shadow-sm ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
          <h3 className={`text-sm font-bold uppercase tracking-wider mb-4 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>{t('Breakdown by Van')}</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={`border-b ${isDark ? 'border-gray-700 text-gray-400' : 'border-gray-200 text-gray-500'}`}>
                  <th className="text-left py-2 px-3 font-medium">{t('Van')}</th>
                  <th className="text-right py-2 px-2 font-medium text-xs">{t('Trips')}</th>
                  <th className="text-right py-2 px-2 font-medium text-xs">Gas/km</th>
                  <th className="text-right py-2 px-2 font-medium text-xs">{t('Toll')}/km</th>
                  <th className="text-right py-2 px-2 font-medium text-xs">{t('Service')}/km</th>
                  <th className="text-right py-2 px-2 font-medium text-xs">{t('Repair')}/km</th>
                  <th className="text-right py-2 px-2 font-medium text-xs">Km</th>
                  <th className="text-right py-2 px-2 font-medium text-xs">{t('Total')}</th>
                  <th className="text-right py-2 px-2 font-medium text-xs">{t('Insurance')}</th>
                  <th className="text-right py-2 px-2 font-medium text-xs">{t('Bollo')}</th>
                  <th className="text-right py-2 px-3 font-medium text-xs">€/km</th>
                </tr>
              </thead>
              <tbody>
                {data.vans.map((v, idx) => {
                  const s = data.byVan[v];
                  return (
                    <tr key={v} className={`border-b ${isDark ? 'border-gray-800 hover:bg-gray-800/50' : 'border-gray-100 hover:bg-gray-50'}`}>
                      <td className={`py-2 px-3 font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                        <span className="inline-block w-2 h-2 rounded-full mr-2" style={{ backgroundColor: VAN_COLORS[idx % VAN_COLORS.length] }} />
                        {v}
                      </td>
                      <td className={`text-right py-2 px-2 tabular-nums text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{formatNum(s.trips)}</td>
                      <td className={`text-right py-2 px-2 tabular-nums text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{perKm(s.gasCost, s.km)}</td>
                      <td className={`text-right py-2 px-2 tabular-nums text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{perKm(s.tollCrosses * TOLL_COST_PER_CROSS, s.km)}</td>
                      <td className={`text-right py-2 px-2 tabular-nums text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{s.serviceCost > 0 ? perKm(s.serviceCost, s.km) : '—'}</td>
                      <td className={`text-right py-2 px-2 tabular-nums text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{s.repairCost > 0 ? perKm(s.repairCost, s.km) : '—'}</td>
                      <td className={`text-right py-2 px-2 tabular-nums text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{formatNum(s.km)}</td>
                      <td className={`text-right py-2 px-2 tabular-nums text-xs font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>{formatCurrency(s.totalCost)}</td>
                      <td className={`text-right py-2 px-2 tabular-nums text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{s.insurance > 0 ? formatCurrency(s.insurance) : '—'}</td>
                      <td className={`text-right py-2 px-2 tabular-nums text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{s.bollo > 0 ? formatCurrency(s.bollo) : '—'}</td>
                      <td className={`text-right py-2 px-3 tabular-nums text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{perKm(s.totalCost, s.km)}</td>
                    </tr>
                  );
                })}
                <tr className={`font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                  <td className="py-2 px-3">{t('Total')}</td>
                  <td className="text-right py-2 px-2 tabular-nums text-xs">{formatNum(o.trips)}</td>
                  <td className="text-right py-2 px-2 tabular-nums text-xs">{perKm(o.gasCost, o.km)}</td>
                  <td className="text-right py-2 px-2 tabular-nums text-xs">{perKm(tollCost, o.km)}</td>
                  <td className="text-right py-2 px-2 tabular-nums text-xs">{o.serviceCost > 0 ? perKm(o.serviceCost, o.km) : '—'}</td>
                  <td className="text-right py-2 px-2 tabular-nums text-xs">{perKm(o.repairCost, o.km)}</td>
                  <td className="text-right py-2 px-2 tabular-nums text-xs">{formatNum(o.km)}</td>
                  <td className="text-right py-2 px-2 tabular-nums text-xs">{formatCurrency(o.totalCost)}</td>
                  <td className="text-right py-2 px-2 tabular-nums text-xs">{formatCurrency(o.insurance)}</td>
                  <td className="text-right py-2 px-2 tabular-nums text-xs">{formatCurrency(o.bollo)}</td>
                  <td className="text-right py-2 px-3 tabular-nums text-xs">{perKm(o.totalCost, o.km)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className={`p-5 rounded-xl border shadow-sm ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
          <h3 className={`text-sm font-bold uppercase tracking-wider mb-4 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>{t('Per-Van KPIs')}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {data.vans.map((v, idx) => {
              const s = data.byVan[v];
              const tc = s.tollCrosses * TOLL_COST_PER_CROSS;
              return (
                <div key={v} className={`p-4 rounded-xl border ${isDark ? 'bg-gray-800/50 border-gray-800' : 'bg-gray-50 border-gray-100'}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: VAN_COLORS[idx % VAN_COLORS.length] }} />
                    <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>{v}</span>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    {[
                      { label: 'Km', value: formatNum(s.km) },
                      { label: t('Daily Km'), value: formatNum(s.days > 0 ? Math.round(s.km / s.days) : 0) },
                      { label: 'Gas/km', value: perKm(s.gasCost, s.km) },
                      { label: t('Toll Cost'), value: formatCurrency(tc) },
                      { label: t('Insurance (Yr)'), value: s.insurance > 0 ? formatCurrency(s.insurance) : '—' },
                      { label: t('Bollo (Yr)'), value: s.bollo > 0 ? formatCurrency(s.bollo) : '—' },
                      { label: t('Repair'), value: s.repairCost > 0 ? formatCurrency(s.repairCost) : '—' },
                      { label: '€/km', value: perKm(s.totalCost, s.km) },
                    ].map((row, i) => (
                      <div key={i} className="flex justify-between">
                        <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>{row.label}</span>
                        <span className={`font-medium tabular-nums ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>{row.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderTransactionsTab = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
          <Search size={20} className="text-purple-600" />
        </div>
        <div>
          <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>{t('Transaction Search')}</h2>
          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('Search accounting transactions from Xero')}</p>
        </div>
      </div>

      <div className={`p-8 rounded-xl border text-center ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
        <Search size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
        <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>{t('Xero Integration Coming Soon')}</h3>
        <p className={`text-sm mb-4 max-w-md mx-auto ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          {t('Connect your Xero account to search invoices, bills, and payments directly from the portal. Set up your Xero API credentials to get started.')}
        </p>
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm ${isDark ? 'bg-purple-900/30 text-purple-400' : 'bg-purple-50 text-purple-700'}`}>
          <Shield size={16} />
          {t('Requires Xero OAuth setup')}
        </div>

        <div className="mt-6">
          <div className="relative max-w-lg mx-auto">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={txSearch}
              onChange={(e) => setTxSearch(e.target.value)}
              placeholder={t('Search transactions (connect Xero to enable)...')}
              disabled
              className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm opacity-50 cursor-not-allowed ${isDark ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-700'}`}
            />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen ${isDark ? 'dark bg-gray-950' : 'bg-gray-50'}`}>
      <header className={`sticky top-0 z-50 border-b ${isDark ? 'bg-gray-950/95 border-gray-800' : 'bg-white/95 border-gray-200'} backdrop-blur-sm`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBackToLanding} className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
              <ArrowLeft size={18} />
            </button>
            {onHome && (
              <button onClick={onHome} className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
                <Home size={18} />
              </button>
            )}
            <img src={PV_LOGO_URL} alt="PV" className="w-7 h-7 object-contain" />
            <div>
              <h1 className={`text-base font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>{t('Cost Control Center')}</h1>
              <p className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Pallacanestro Varese</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={selectedSeason}
              onChange={(e) => setSelectedSeason(e.target.value)}
              className={`px-3 py-1.5 rounded-lg text-sm border ${isDark ? 'bg-gray-800 border-gray-700 text-gray-200' : 'bg-white border-gray-200 text-gray-700'}`}
            >
              {seasons.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <button onClick={toggleLanguage} className={`px-2 py-1.5 rounded-lg text-xs font-medium border ${isDark ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-white border-gray-200 text-gray-700'}`}>
              {language === 'en' ? 'IT' : 'EN'}
            </button>
            <button onClick={toggleTheme} className={`p-1.5 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-white border-gray-200 text-gray-700'}`}>
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </div>

        <div className={`border-t ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex gap-0 overflow-x-auto">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? `${tab.color} border-current`
                      : `${isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'} border-transparent`
                  }`}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {activeTab === 'energy' && renderSheetTab('energy', energyData, energyConfigured, energySheetId, setEnergySheetId, energySheetName, setEnergySheetName, showEnergyConfig, setShowEnergyConfig, Zap, 'text-yellow-600')}
        {activeTab === 'van' && renderVanTab()}
        {activeTab === 'transactions' && renderTransactionsTab()}
      </main>
    </div>
  );
};
