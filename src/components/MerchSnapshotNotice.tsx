import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import type { MerchSnapshotStatus } from '../types/merchandising';
import { formatMerchDate } from '../utils/merchandisingDate';

export function MerchSnapshotNotice({ lastUpdated, status, error, compact = false }: {
  lastUpdated?: string; status?: MerchSnapshotStatus; error?: string | null; compact?: boolean;
}) {
  const { language } = useLanguage();
  const it = language === 'it';
  const warning = error || status?.refreshError || status?.persistenceError;
  const previous = status?.stale || status?.restored;
  const expiredSession = error === 'Please sign in again to load merchandising data.';
  const deniedAccess = error === 'Your account does not have access to merchandising data.';
  const failureReasons = {
    timeout: it ? 'XShop non ha risposto entro il tempo previsto, anche dopo i tentativi automatici.' : 'XShop timed out after automatic retries.',
    connection: it ? 'La connessione a XShop è stata interrotta, anche dopo i tentativi automatici.' : 'The connection to XShop was interrupted after automatic retries.',
    access: it ? 'XShop ha rifiutato l’accesso API. Verifica la connessione e i permessi del negozio.' : 'XShop rejected API access. Check the connection and store permissions.',
    temporary: it ? 'XShop è temporaneamente non disponibile o sta limitando le richieste API.' : 'XShop is temporarily unavailable or limiting API requests.',
    response: it ? 'XShop ha restituito una risposta API non valida.' : 'XShop returned an invalid API response.',
    pagination: it ? 'I dati XShop sono cambiati durante il download; nessuna copia parziale è stata pubblicata.' : 'XShop changed during download; no partial snapshot was published.',
    credentials: it ? 'Le credenziali API XShop non sono configurate.' : 'XShop API credentials are not configured.',
  };
  return (
    <div role="status" className={`rounded-lg border ${compact ? 'p-2.5 text-[10px] leading-relaxed' : 'p-3 text-sm mb-4'} ${
      warning || previous ? 'border-amber-300 bg-amber-50 text-amber-900 dark:bg-amber-900/20 dark:text-amber-200'
        : 'border-gray-200 bg-gray-50 text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300'
    }`}>
      <span className="font-medium">XShop · </span>
      {lastUpdated ? <>
        {previous ? (it ? 'Ultima copia completa salvata' : 'Last saved complete snapshot')
          : (it ? 'Snapshot completo' : 'Complete snapshot')}
         <span className={compact ? 'block mt-1 text-[10px]' : ''}>
           {compact ? '' : ' · '}{formatMerchDate(lastUpdated, language, true)} (Europe/Rome).
         </span>
      </> : (it ? 'In attesa del primo snapshot completo.' : 'Waiting for the first complete snapshot.')}
      {status?.refreshing && <span> {it ? 'Aggiornamento in corso in secondo piano.' : 'Updating in the background.'}</span>}
       {expiredSession && <span> {it ? 'Sessione scaduta. Accedi nuovamente per aggiornare i dati.' : 'Your session has expired. Sign in again to update the data.'}</span>}
       {deniedAccess && <span> {it ? 'Il tuo account non ha accesso ai dati Merchandising.' : 'Your account does not have access to Merchandising data.'}</span>}
       {(error || status?.refreshError) && !expiredSession && !deniedAccess && <span> {lastUpdated
        ? (it ? 'Aggiornamento non riuscito. La copia completa precedente rimane disponibile; puoi riprovare.'
          : 'Update failed. The previous complete snapshot is still available; you can retry.')
        : (it ? 'Download non riuscito; puoi riprovare.' : 'Download failed; you can retry.')}</span>}
       {status?.refreshError && status.refreshErrorCode && !expiredSession && !deniedAccess && <span className="block mt-1">
         {failureReasons[status.refreshErrorCode]}
       </span>}
      {status?.persistenceError && <span> {it
        ? 'Archiviazione privata non disponibile: la copia salvata potrebbe non essere aggiornata al prossimo riavvio.'
        : 'Private storage is unavailable: the saved copy may not be current at the next restart.'}</span>}
    </div>
  );
}
