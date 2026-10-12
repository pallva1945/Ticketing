import type { MerchRefreshErrorCode } from '../src/types/merchandising';

// Only fixed, safe messages may leave the provider boundary. Never retain causes,
// request URLs, credentials or provider response bodies.
const messages: Record<MerchRefreshErrorCode, string> = {
  timeout: 'XShop did not respond within the request time limit.',
  connection: 'The connection to XShop was interrupted.',
  access: 'XShop rejected API access. Check the connection and store permissions.',
  temporary: 'XShop is temporarily unavailable or limiting API requests.',
  response: 'XShop returned an invalid API response.',
  pagination: 'XShop changed during pagination; retry to obtain a complete snapshot. No partial snapshot was published.',
  credentials: 'XShop API credentials are not configured.',
};

export class XShopReadError extends Error {
  constructor(public readonly code: MerchRefreshErrorCode, public readonly retryDelay = 2000) {
    super(messages[code]);
    this.name = 'XShopReadError';
  }
}

export async function withXShopRetries<T>(
  read: () => Promise<T>,
  pause: (ms: number) => Promise<void> = ms => new Promise(resolve => setTimeout(resolve, ms)),
): Promise<T> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await read();
    } catch (cause) {
      let error = cause;
      if (cause instanceof Error && ['TimeoutError', 'AbortError'].includes(cause.name)) {
        error = new XShopReadError('timeout');
      } else if (cause instanceof TypeError) {
        error = new XShopReadError('connection');
      }
      const transient = error instanceof XShopReadError
        && ['timeout', 'connection', 'temporary', 'pagination'].includes(error.code);
      if (!transient || attempt === 2) throw error;
      await pause(Math.min(10000, Math.max(1000, (error as XShopReadError).retryDelay * (attempt + 1))));
    }
  }
  throw new XShopReadError('temporary');
}

export function xshopRetryDelay(value: string | null, now = Date.now()): number {
  const seconds = value !== null && value.trim() !== '' ? Number(value) : NaN;
  const delay = Number.isFinite(seconds) ? seconds * 1000
    : value ? Date.parse(value) - now : NaN;
  return Number.isFinite(delay) ? Math.min(10000, Math.max(1000, delay)) : 2000;
}
