import { ObjectStorageService, objectStorageClient } from './replit_integrations/object_storage/objectStorage';
import { validateXShopSnapshot, XSHOP_SNAPSHOT_VERSION, type XShopSnapshotStore } from './xshopSnapshotCache';
import type { File } from '@google-cloud/storage';

// Reserved server-only namespace: never served by /objects/* or public search.
export const XSHOP_PRIVATE_SNAPSHOT_PREFIX = 'server-snapshots';

function snapshotFile() {
  const service = new ObjectStorageService();
  const directory = service.getPrivateObjectDir().replace(/\/+$/, '');
  if (!directory.startsWith('/') || directory.split('/').filter(Boolean).length < 2
    || service.getPublicObjectSearchPaths().some(path =>
      directory === path.replace(/\/+$/, '') || directory.startsWith(`${path.replace(/\/+$/, '')}/`))) {
    throw new Error('XShop snapshot requires a private storage directory');
  }
  const [bucket, ...prefix] = directory.slice(1).split('/');
  return objectStorageClient.bucket(bucket).file(`${prefix.join('/')}/${XSHOP_PRIVATE_SNAPSHOT_PREFIX}/xshop-v${XSHOP_SNAPSHOT_VERSION}.json`);
}

export function createXShopSnapshotStore(resolveFile: () => Pick<File, 'save' | 'download'> = snapshotFile): XShopSnapshotStore {
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
    await resolveFile().save(JSON.stringify({ version: XSHOP_SNAPSHOT_VERSION, data: snapshot }), {
      resumable: false,
      contentType: 'application/json',
      metadata: {
        cacheControl: 'private, no-store',
        metadata: { 'custom:aclPolicy': JSON.stringify({ visibility: 'private', owner: 'server-xshop' }) },
      },
    });
  },
  };
}

export const xshopSnapshotStore = createXShopSnapshotStore();
