import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import type { MerchSnapshotStatus } from '../types/merchandising';

export function MerchSnapshotNotice({ lastUpdated, status, error }: {
  lastUpdated?: string; status?: MerchSnapshotStatus; error?: string | null;
}) {
  const { language } = useLanguage();
  const it = language === 'it';
  const warning = error || status?.refreshError || status?.persistenceError;
  const previous = status?.stale || status?.restored;
  return (
    <div role="status" className={`rounded-lg border p-3 text-sm mb-4 ${
      warning || previous ? 'border-amber-300 bg-amber-50 text-amber-900 dark:bg-amber-900/20 dark:text-amber-200'
        : 'border-gray-200 bg-gray-50 text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300'
    }`}>
      <span className="font-medium">XShop · </span>
      {lastUpdated ? <>
        {previous ? (it ? 'Ultima copia completa salvata' : 'Last saved complete snapshot')
          : (it ? 'Snapshot completo' : 'Complete snapshot')}
        {' · '}{new Date(lastUpdated).toLocaleString(it ? 'it-IT' : 'en-GB', { timeZone: 'Europe/Rome' })} (Europe/Rome).
      </> : (it ? 'In attesa del primo snapshot completo.' : 'Waiting for the first complete snapshot.')}
      {status?.refreshing && <span> {it ? 'Aggiornamento in corso in secondo piano.' : 'Updating in the background.'}</span>}
      {(error || status?.refreshError) && <span> {lastUpdated
        ? (it ? 'Aggiornamento non riuscito. La copia completa precedente rimane disponibile; puoi riprovare.'
          : 'Update failed. The previous complete snapshot is still available; you can retry.')
        : (it ? 'Download non riuscito; puoi riprovare.' : 'Download failed; you can retry.')}</span>}
      {status?.persistenceError && <span> {it
        ? 'Archiviazione privata non disponibile: la copia salvata potrebbe non essere aggiornata al prossimo riavvio.'
        : 'Private storage is unavailable: the saved copy may not be current at the next restart.'}</span>}
    </div>
  );
}
