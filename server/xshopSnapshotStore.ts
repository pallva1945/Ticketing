import { ObjectStorageService, objectStorageClient } from './replit_integrations/object_storage/objectStorage';
import { validateXShopSnapshot, XSHOP_SNAPSHOT_VERSION, type XShopSnapshotStore } from './xshopSnapshotCache';
import type { File } from '@google-cloud/storage';
import { sanitizeXShopHistory, mergeXShopHistory, XSHOP_HISTORY_VERSION } from './xshopRefreshHistory';

// Reserved server-only namespace: never served by /objects/* or public search.
export const XSHOP_PRIVATE_SNAPSHOT_PREFIX = 'server-snapshots';

function privateFile(name: string) {
  const service = new ObjectStorageService();
  const directory = service.getPrivateObjectDir().replace(/\/+$/, '');
  if (!directory.startsWith('/') || directory.split('/').filter(Boolean).length < 2
    || service.getPublicObjectSearchPaths().some(path =>
      directory === path.replace(/\/+$/, '') || directory.startsWith(`${path.replace(/\/+$/, '')}/`))) {
    throw new Error('XShop snapshot requires a private storage directory');
  }
  const [bucket, ...prefix] = directory.slice(1).split('/');
  return objectStorageClient.bucket(bucket).file(`${prefix.join('/')}/${XSHOP_PRIVATE_SNAPSHOT_PREFIX}/${name}`);
}

const privateOptions = {
  resumable: false,
  contentType: 'application/json',
  metadata: {
    cacheControl: 'private, no-store',
    metadata: { 'custom:aclPolicy': JSON.stringify({ visibility: 'private', owner: 'server-xshop' }) },
  },
};

export function createXShopSnapshotStore(
  resolveFile: () => Pick<File, 'save' | 'download'> = () => privateFile(`xshop-v${XSHOP_SNAPSHOT_VERSION}.json`),
  resolveHistoryFile: () => Pick<File, 'save' | 'download' | 'getMetadata'> = () => privateFile(`xshop-history-v${XSHOP_HISTORY_VERSION}.json`),
): XShopSnapshotStore {
  return {
  async read() {
    try {
      const [content] = await resolveFile().download();
      const envelope = JSON.parse(content.toString('utf8'));
      if (envelope.version !== XSHOP_SNAPSHOT_VERSION) throw new Error('Unsupported XShop snapshot version');
      validateXShopSnapshot(envelope.data);
      return envelope.data;
    } catch (error) {
      if ((error as { code?: number }).code === 404) return null;
      throw error;
    }
  },
  async write(data) {
    validateXShopSnapshot(data);
    const { snapshotStatus: _status, ...snapshot } = data;
    await resolveFile().save(JSON.stringify({ version: XSHOP_SNAPSHOT_VERSION, data: snapshot }), privateOptions);
  },
  async readHistory() {
    try {
      const [content] = await resolveHistoryFile().download();
      const envelope = JSON.parse(content.toString('utf8'));
      if (envelope.version !== XSHOP_HISTORY_VERSION) throw new Error('Unsupported XShop history version');
      return sanitizeXShopHistory(envelope.attempts);
    } catch (error) {
      if ((error as { code?: number }).code === 404) return [];
      throw error;
    }
  },
  async writeHistory(attempts) {
    const incoming = sanitizeXShopHistory(attempts);
    const file = resolveHistoryFile();
    // Conditional object replacement prevents separate instances from losing
    // each other's diagnostic records. This does not coordinate shop downloads.
    for (let retry = 0; retry < 5; retry++) {
      let saved = [], generation = 0;
      try {
        const [metadata] = await file.getMetadata();
        generation = Number(metadata.generation);
        if (!Number.isSafeInteger(generation) || generation <= 0) throw new Error('Invalid history generation');
        const [content] = await file.download();
        const envelope = JSON.parse(content.toString('utf8'));
        if (envelope.version !== XSHOP_HISTORY_VERSION) throw new Error('Unsupported XShop history version');
        saved = sanitizeXShopHistory(envelope.attempts);
      } catch (error) {
        if ((error as { code?: number }).code !== 404) throw error;
        generation = 0;
      }
      try {
        await file.save(JSON.stringify({
          version: XSHOP_HISTORY_VERSION, attempts: mergeXShopHistory(saved, incoming),
        }), { ...privateOptions, preconditionOpts: { ifGenerationMatch: generation } });
        return;
      } catch (error) {
        if ((error as { code?: number }).code !== 412 || retry === 4) throw error;
      }
    }
  },
  };
}

export const xshopSnapshotStore = createXShopSnapshotStore();
