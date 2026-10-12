import React, { useEffect, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import type { MerchRefreshHistory as History } from '../types/merchandising';
import { formatMerchDate } from '../utils/merchandisingDate';
import { MerchFailureReason } from './MerchSnapshotNotice';

export function MerchRefreshHistory() {
  const { language } = useLanguage();
  const it = language === 'it';
  const [open, setOpen] = useState(false);
  const [history, setHistory] = useState<History | null>(null);
  const [error, setError] = useState<number | null>(null);
  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    let pending = false;
    let denied = false;
    const load = async () => {
      if (pending || denied) return;
      pending = true;
      try {
        const response = await fetch('/api/merch/refresh-history', { signal: controller.signal, cache: 'no-store' });
        if (!response.ok) {
          denied = response.status === 401 || response.status === 403;
          setHistory(null);
          setError(response.status);
          return;
        }
        const data = await response.json();
        if (!data.success || !Array.isArray(data.attempts)) throw new Error('Unavailable');
        setHistory(data);
        setError(null);
      } catch {
        if (!controller.signal.aborted) { setHistory(null); setError(503); }
      } finally { pending = false; }
    };
    void load();
    const timer = window.setInterval(() => { void load(); }, 10000);
    window.addEventListener('merchandising-refresh', load);
    return () => {
      controller.abort();
      window.clearInterval(timer);
      window.removeEventListener('merchandising-refresh', load);
    };
  }, [open]);
  const date = (value: string | null) => value ? `${formatMerchDate(value, language, true)} (Europe/Rome)` : '—';
  return <details onToggle={event => setOpen(event.currentTarget.open)}
    className="mt-2 rounded-lg border border-gray-200 p-2.5 text-[10px] text-gray-600 dark:border-gray-700 dark:text-gray-300">
    <summary className="cursor-pointer font-medium">{it ? 'Storico aggiornamenti XShop' : 'XShop refresh history'}</summary>
    {open && <div className="mt-2 space-y-2" aria-live="polite">
      <p>{it ? 'Ultimi 50 tentativi · Solo metadati diagnostici, nessun dato cliente o importo.'
        : 'Latest 50 attempts · Diagnostic metadata only, no customer data or amounts.'}</p>
      {error && <p role="alert" className="text-amber-700 dark:text-amber-300">{error === 401
        ? (it ? 'Sessione scaduta. Accedi nuovamente.' : 'Your session has expired. Sign in again.')
        : error === 403 ? (it ? 'Il tuo account non ha accesso ai dati Merchandising.' : 'Your account does not have access to Merchandising data.')
        : (it ? 'Storico non disponibile. Riprova più tardi.' : 'History is unavailable. Please retry later.')}</p>}
      {!history && !error && <p>{it ? 'Caricamento…' : 'Loading…'}</p>}
      {history?.persistenceUnavailable && <p role="alert" className="text-amber-700 dark:text-amber-300">{it
        ? 'Archiviazione privata non disponibile: lo storico potrebbe essere incompleto.'
        : 'Private history storage is unavailable: this history may be incomplete.'}</p>}
      {history && history.attempts.length === 0 && <p>{it ? 'Nessun tentativo registrato.' : 'No attempts recorded yet.'}</p>}
      <ol className="max-h-80 overflow-y-auto space-y-2">
        {history?.attempts.map(attempt => <li key={attempt.id}
          className="border-t border-gray-200 pt-2 dark:border-gray-700">
          <p className="font-semibold">{attempt.outcome === 'success'
            ? (it ? 'Completato' : 'Completed')
            : attempt.outcome === 'failure' ? (it ? 'Non riuscito' : 'Failed')
            : (it ? 'Senza esito registrato' : 'No result recorded')}</p>
          <dl>
            <dt>{it ? 'Inizio' : 'Started'}</dt><dd>{date(attempt.startedAt)}</dd>
            <dt>{it ? 'Fine' : 'Finished'}</dt><dd>{date(attempt.finishedAt)}</dd>
            <dt>{it ? 'Ultimo snapshot completo' : 'Last successful snapshot'}</dt><dd>{date(attempt.lastSuccessfulSnapshotAt)}</dd>
            <dt>{it ? 'Ordini riconosciuti nello snapshot' : 'Recognized orders in snapshot'}</dt><dd>{attempt.recognizedOrderCount ?? '—'}</dd>
          </dl>
          {attempt.failureCode && <p className="mt-1 text-amber-700 dark:text-amber-300">
            <span className="font-mono">{attempt.failureCode}</span> · <MerchFailureReason code={attempt.failureCode} />
          </p>}
          {attempt.outcome === 'unfinished' && <p className="mt-1">{it
            ? 'L’aggiornamento potrebbe essere ancora attivo oppure essersi interrotto prima di registrare l’esito.'
            : 'The refresh may still be active or may have stopped before recording its result.'}</p>}
        </li>)}
      </ol>
    </div>}
  </details>;
}
