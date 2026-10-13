import type { MerchRefreshErrorCode } from '../src/types/merchandising';

// Only fixed, safe messages may leave the provider boundary. Never retain causes,
// request URLs, credentials or provider response bodies.
const messages: Record<MerchRefreshErrorCode, string> = {
  timeout: 'XShop did not respond within the request time limit.',
  connection: 'The connection to XShop was interrupted.',
  access: 'XShop rejected API access. Check the connection and store permissions.',
  blocked: 'XShop bot protection is blocking API requests. The shop administrator must allow authenticated WooCommerce API access.',
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

export function xshopHttpError(status: number, contentType: string | null): MerchRefreshErrorCode | null {
  // Hosting bot challenges can return a successful 202 but contain an HTML
  // JavaScript page. They are not WooCommerce data or bad API credentials.
  const html = contentType?.toLowerCase().includes('text/html');
  if (html && (status === 202 || status === 403)) return 'blocked';
  if (status === 429 || status >= 500) return 'temporary';
  if (status === 401 || status === 403) return 'access';
  if (status < 200 || status >= 300) return 'response';
  return null;
}

export async function withXShopRetries<T>(
  read: () => Promise<T>,
  pause: (ms: number) => Promise<void> = ms => new Promise(resolve => setTimeout(resolve, ms)),
  signal?: AbortSignal,
): Promise<T> {
  for (let attempt = 0; attempt < 3; attempt++) {
    signal?.throwIfAborted();
    try {
      return await read();
    } catch (cause) {
      signal?.throwIfAborted();
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

export async function withXShopDeadline<T>(work: Promise<T>, ms: number, expire?: () => void): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([work, new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        expire?.();
        reject(new XShopReadError('timeout'));
      }, ms);
    })]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export function xshopRetryDelay(value: string | null, now = Date.now()): number {
  const seconds = value !== null && value.trim() !== '' ? Number(value) : NaN;
  const delay = Number.isFinite(seconds) ? seconds * 1000
    : value ? Date.parse(value) - now : NaN;
  return Number.isFinite(delay) ? Math.min(10000, Math.max(1000, delay)) : 2000;
}
