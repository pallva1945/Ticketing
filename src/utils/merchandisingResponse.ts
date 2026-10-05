import type { MerchandisingData } from '../types/merchandising';

/** Do not mistake an HTML proxy error or an outdated SPA response for API data. */
export async function readMerchandisingResponse(response: Response): Promise<MerchandisingData> {
  const contentType = response.headers.get('content-type')?.split(';')[0].trim().toLowerCase();
  if (contentType !== 'application/json' && !contentType?.endsWith('+json')) {
    throw new Error('The published server did not return merchandising data. Please retry; if this persists, publish the current dashboard version.');
  }
  let result;
  try {
    result = await response.json();
  } catch {
    throw new Error('The server returned invalid merchandising data. Please retry.');
  }
  if (response.status === 401) throw new Error('Please sign in again to load merchandising data.');
  if (response.status === 403) throw new Error('Your account does not have access to merchandising data.');
  if (!response.ok) {
    throw new Error(typeof result?.message === 'string'
      ? result.message : 'XShop data could not be loaded. Please retry.');
  }
  if (result?.source !== 'XShop' || result.complete !== true
    || !Array.isArray(result.orders) || !Array.isArray(result.products) || !Array.isArray(result.customers)) {
    throw new Error('XShop returned an incomplete merchandising snapshot');
  }
  return result;
}
