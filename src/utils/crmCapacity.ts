/**
 * Full-season subscriptions only. These are the two event naming families
 * used by the CRM: legacy LBA and current subscriptions (including renewal).
 * Do not infer capacity from sales channel, match, price or "abbonamento"
 * alone: packs, "7eventi" and "Girone di Ritorno" remain flexible.
 */
export const isFixedCapacityEvent = (event: unknown): boolean => {
  if (typeof event !== 'string') return false;
  const name = event.trim();
  const match = name.match(/^abbonamento lba (20\d{2})\/(\d{2})$/i)
    || name.match(/^abbonamento (20\d{2})\/(\d{2})(?: - prelazione)?\.*$/i);
  if (!match) return false;
  return (Number(match[1]) + 1) % 100 === Number(match[2]);
};

export const isRowFixedCapacity = (row: { event?: unknown; Event?: unknown; EVENT?: unknown }): boolean =>
  isFixedCapacityEvent(row.event || row.Event || row.EVENT || '');

export const getCapacityBucket = (row: { event?: unknown; Event?: unknown; EVENT?: unknown }): 'fixed' | 'flexible' =>
  isRowFixedCapacity(row) ? 'fixed' : 'flexible';