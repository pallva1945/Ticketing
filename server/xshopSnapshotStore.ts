import { ObjectStorageService, objectStorageClient } from './replit_integrations/object_storage/objectStorage';
import { validateXShopSnapshot, XSHOP_SNAPSHOT_VERSION, XSHOP_SNAPSHOT_TTL, type XShopSnapshotStore, type XShopRefreshState } from './xshopSnapshotCache';
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

type SnapshotFile = Pick<File, 'save' | 'download' | 'getMetadata'> & {
  // Pin downloads to the generation whose metadata was read.
  bucket: Pick<File['bucket'], 'file'>;
  name: string;
};

export function createXShopSnapshotStore(
  resolveFile: () => SnapshotFile = () => privateFile(`xshop-v${XSHOP_SNAPSHOT_VERSION}.json`),
  now = Date.now,
  resolveHistoryFile: () => Pick<File, 'save' | 'download' | 'getMetadata'> = () => privateFile(`xshop-history-v${XSHOP_HISTORY_VERSION}.json`),
): XShopSnapshotStore {
  async function read() {
    const file = resolveFile();
    for (let attempt = 0; attempt < 12; attempt++) {
      let generation: string;
      try {
        const [metadata] = await file.getMetadata();
        if (!metadata.generation) throw new Error('Missing XShop snapshot generation');
        generation = String(metadata.generation);
      } catch (error) {
        if ((error as { code?: number }).code === 404) {
          return { state: { data: null, revision: null, lease: null, retryAfter: 0 } as XShopRefreshState, generation: 0 };
        }
        throw error;
      }
      try {
        const [content] = await file.bucket.file(file.name, { generation }).download();
        const envelope = JSON.parse(content.toString('utf8'));
        if (envelope.version !== XSHOP_SNAPSHOT_VERSION) throw new Error('Unsupported XShop snapshot version');
        let data = envelope.data ?? null;
        if (data !== null) {
          try {
            validateXShopSnapshot(data);
          } catch {
            // A damaged payload is unavailable, not a permanent lockout.
            // Retain valid coordination metadata and the exact generation so
            // repair still requires an exclusive, fenced refresh lease.
            data = null;
          }
        }
        const state: XShopRefreshState = {
          data,
          revision: envelope.revision ?? null,
          lease: envelope.lease ?? null,
          retryAfter: envelope.retryAfter ?? 0,
        };
        if ((state.lease && (typeof state.lease.owner !== 'string' || !Number.isFinite(state.lease.expiresAt)))
          || !Number.isFinite(state.retryAfter)
          || (state.revision !== null && typeof state.revision !== 'string')) {
          throw new Error('Invalid XShop coordination state');
        }
        return { state, generation };
      } catch (error) {
        // Replacement may remove the generation between metadata and download.
        // Retry the head, but never treat that race as an empty snapshot.
        if ((error as { code?: number }).code !== 404) {
          throw error;
        }
      }
    }
    throw new Error('XShop snapshot read contention');
  }

  async function mutate(change: (state: XShopRefreshState) => boolean) {
    for (let attempt = 0; attempt < 12; attempt++) {
      const { state, generation } = await read();
      if (!change(state)) return { changed: false, state };
      const data = state.data;
      const snapshot = data ? (({ snapshotStatus: _status, ...rest }) => rest)(data) : null;
      try {
        await resolveFile().save(JSON.stringify({ version: XSHOP_SNAPSHOT_VERSION, ...state, data: snapshot }), {
          resumable: false,
          contentType: 'application/json',
          preconditionOpts: { ifGenerationMatch: generation },
          metadata: {
            cacheControl: 'private, no-store',
            metadata: { 'custom:aclPolicy': JSON.stringify({ visibility: 'private', owner: 'server-xshop' }) },
          },
        });
        return { changed: true, state };
      } catch (error) {
        if ((error as { code?: number }).code !== 412) throw error;
      }
    }
    throw new Error('XShop snapshot coordination contention');
  }

  return {
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
    async readState() { return (await read()).state; },
    async acquire(owner, ttl, revision, force) {
      return (await mutate(state => {
        if (state.lease && state.lease.expiresAt > now()) return false;
        // A peer already completed the refresh requested against this revision.
        if (state.data && state.revision !== revision) return false;
        if (!force && (state.retryAfter > now()
          || (state.data && now() - Date.parse(state.data.lastUpdated) < XSHOP_SNAPSHOT_TTL))) return false;
        state.lease = { owner, expiresAt: now() + ttl };
        return true;
      })).state;
    },
    async renew(owner, ttl) {
      return (await mutate(state => {
        if (state.lease?.owner !== owner || state.lease.expiresAt <= now()) return false;
        state.lease.expiresAt = now() + ttl;
        return true;
      })).changed;
    },
    async commit(owner, data) {
      validateXShopSnapshot(data);
      return (await mutate(state => {
        if (state.lease?.owner !== owner || state.lease.expiresAt <= now()
          || (state.data && Date.parse(data.lastUpdated) < Date.parse(state.data.lastUpdated))) return false;
        state.data = data;
        state.revision = owner;
        state.lease = null;
        state.retryAfter = 0;
        return true;
      })).changed;
    },
    async release(owner, retryAfter = 0) {
      await mutate(state => {
        if (state.lease?.owner !== owner || state.lease.expiresAt <= now()) return false;
        state.lease = null;
        state.retryAfter = retryAfter;
        return true;
      });
    },
  };
}

export const xshopSnapshotStore = createXShopSnapshotStore();
