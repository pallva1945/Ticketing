import React, { useState } from 'react';
import { GameData } from '../types';
import { ComparisonMetricKey } from './comparisonMetrics';
import { ComparisonReport, printComparisonReports } from './comparisonReport';
import {
  buildSeasonComparison, SeasonComparisonMode, SeasonComparisonSelection,
} from './SeasonComparison';

type ReportMode = SeasonComparisonMode | 'custom';
type ReportSlot = { mode: ReportMode; selection: SeasonComparisonSelection };

const modes: { value: ReportMode; label: string }[] = [
  { value: 'opponent', label: 'Opponent vs opponent' },
  { value: 'tier', label: 'Tier over the years' },
  { value: 'week', label: 'Week vs week' },
  { value: 'ytd', label: 'Season to date' },
  { value: 'custom', label: 'Custom' },
];

interface Props {
  fullData: GameData[];
  viewMode: 'total' | 'gameday';
  selectedMetrics: ComparisonMetricKey[];
  initialMode: ReportMode;
  initialSelection: SeasonComparisonSelection;
  customReport: ComparisonReport;
  onClose: () => void;
}

export const ComparisonPrintDialog: React.FC<Props> = ({
  fullData, viewMode, selectedMetrics, initialMode, initialSelection, customReport, onClose,
}) => {
  const [slots, setSlots] = useState<ReportSlot[]>([{ mode: initialMode, selection: { ...initialSelection } }]);
  const selectClass = 'mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white';
  const updateSlot = (index: number, update: Partial<ReportSlot>) =>
    setSlots(current => current.map((slot, i) => i === index ? { ...slot, ...update } : slot));
  const changeCount = (count: number) => {
    setSlots(current => {
      const next = current.slice(0, count);
      while (next.length < count) {
        const available = modes.find(mode => !next.some(slot => slot.mode === mode.value))!;
        next.push({ mode: available.value, selection: { ...initialSelection } });
      }
      return next;
    });
  };
  const reports: ComparisonReport[] = slots.map(slot => {
    if (slot.mode === 'custom') return customReport;
    const result = buildSeasonComparison(fullData, slot.mode, viewMode, slot.selection);
    return {
      title: result.title, subtitle: result.description, groups: result.groups,
      highlightLabels: result.currentLabels, showTrend: true, perGame: slot.mode === 'tier',
    };
  });
  const emptyReports = reports.flatMap((report, index) =>
    report.groups.some(group => group.games.length > 0) ? [] : [index + 1]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onKeyDown={event => {
      if (event.key === 'Escape') onClose();
    }}>
      <div role="dialog" aria-modal="true" aria-labelledby="comparison-print-title"
        className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-xl bg-white shadow-2xl dark:bg-gray-900">
        <div className="border-b border-gray-200 p-5 dark:border-gray-700">
          <h2 id="comparison-print-title" className="text-lg font-bold text-gray-900 dark:text-white">Print / Save PDF</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Choose the reports and their order. Each report gets one page in the same PDF.</p>
        </div>
        <div className="space-y-4 overflow-y-auto p-5">
          <label className="block max-w-xs text-sm font-semibold text-gray-700 dark:text-gray-200">
            How many reports do you want to include?
            <select className={selectClass} value={slots.length}
              onChange={event => changeCount(Number(event.target.value))}>
              {modes.map((_, index) => <option key={index} value={index + 1}>{index + 1}</option>)}
            </select>
          </label>
          {slots.map((slot, index) => {
            const details = slot.mode !== 'custom'
              ? buildSeasonComparison(fullData, slot.mode, viewMode, slot.selection) : null;
            const updateSelection = (update: Partial<SeasonComparisonSelection>) =>
              updateSlot(index, { selection: { ...slot.selection, ...update } });
            return <fieldset key={index} className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
              <legend className="px-1 text-sm font-bold text-gray-900 dark:text-white">Page {index + 1}</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                  Report
                  <select className={selectClass} value={slot.mode}
                    onChange={event => updateSlot(index, { mode: event.target.value as ReportMode })}>
                    {modes.map(mode => <option key={mode.value} value={mode.value}
                      disabled={slots.some((other, i) => i !== index && other.mode === mode.value)}>
                      {mode.label}</option>)}
                  </select>
                </label>
                {details && <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                  League
                  <select className={selectClass} value={details.league}
                    onChange={event => updateSelection({ league: event.target.value, opponent: '', secondOpponent: '', firstTier: null, week: 1 })}>
                    {details.leagues.map(league => <option key={league} value={league}>{league}</option>)}
                  </select>
                </label>}
                {slot.mode === 'opponent' && details && <>
                  <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                    Opponent
                    <select className={selectClass} value={details.selectedOpponent}
                      onChange={event => updateSelection({ opponent: event.target.value, secondOpponent: '' })}>
                      {details.opponents.map(opponent => <option key={opponent} value={opponent}>{opponent}</option>)}
                    </select>
                  </label>
                  <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                    Compare with (optional)
                    <select className={selectClass} value={details.selectedSecond}
                      onChange={event => updateSelection({ secondOpponent: event.target.value })}>
                      <option value="">Same fixture across seasons</option>
                      {details.opponents.filter(opponent => opponent !== details.selectedOpponent)
                        .map(opponent => <option key={opponent} value={opponent}>{opponent}</option>)}
                    </select>
                  </label>
                </>}
                {slot.mode === 'tier' && details && <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                  Tier
                  <select className={selectClass} value={details.selectedFirstTier ?? ''}
                    onChange={event => updateSelection({ firstTier: Number(event.target.value) })}>
                    {details.tiers.map(tier => <option key={tier} value={tier}>Tier {tier}</option>)}
                  </select>
                </label>}
                {slot.mode === 'week' && details && <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                  Home game week
                  <select className={selectClass} value={details.selectedWeek}
                    onChange={event => updateSelection({ week: Number(event.target.value) })}>
                    {Array.from({ length: details.maxWeek }, (_, week) =>
                      <option key={week} value={week + 1}>W{week + 1}</option>)}
                  </select>
                </label>}
              </div>
              {slot.mode === 'custom' && <p className="mt-2 text-xs text-gray-500">
                Uses the current Custom scenarios A and B.</p>}
            </fieldset>;
          })}
          {emptyReports.length > 0 && <p role="alert" className="text-sm text-red-600">
            No matching games for {emptyReports.map(page => `page ${page}`).join(', ')}. Change its selection before printing.
          </p>}
        </div>
        <div className="flex justify-end gap-3 border-t border-gray-200 p-5 dark:border-gray-700">
          <button type="button" onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 dark:border-gray-600 dark:text-gray-200">Cancel</button>
          <button type="button" disabled={emptyReports.length > 0} onClick={() => {
            printComparisonReports(reports, selectedMetrics);
            onClose();
          }} className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 dark:bg-white dark:text-gray-900">
            Print {slots.length} {slots.length === 1 ? 'report' : 'reports'}
          </button>
        </div>
      </div>
    </div>
  );
};