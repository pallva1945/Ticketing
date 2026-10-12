import { createXShopSnapshotStore } from '../../server/xshopSnapshotStore.ts';

// Generation-precondition fake: independent store/cache instances share only
// this backing object, just as published workers share App Storage.
export function snapshotObject(initial = null) {
  let generation = initial === null ? 0 : 1;
  let content = initial === null ? null : JSON.stringify(initial);
  let failure = null;
  let lastOptions;
  let historyContent = null, historyGeneration = 0;
  const historyFile = {
    getMetadata: async () => {
      if (!historyContent) throw error(404);
      return [{ generation: String(historyGeneration) }];
    },
    download: async () => {
      if (!historyContent) throw error(404);
      return [Buffer.from(historyContent)];
    },
    save: async (data, options) => {
      if (Number(options.preconditionOpts.ifGenerationMatch) !== historyGeneration) throw error(412);
      historyContent = data;
      historyGeneration++;
    },
  };
  let beforeDownload = null;
  const error = code => Object.assign(new Error('Simulated private storage failure'), { code });
  const resolveFile = () => ({
    name: 'private-snapshot',
    bucket: { file: (_name, options) => ({
      download: async () => {
        if (beforeDownload) {
          const hook = beforeDownload;
          beforeDownload = null;
          hook();
        }
        if (failure) throw failure;
        if (String(options.generation) !== String(generation) || content === null) throw error(404);
        return [Buffer.from(content)];
      },
    }) },
    getMetadata: async () => {
      if (failure) throw failure;
      if (content === null) throw error(404);
      return [{ generation: String(generation) }];
    },
    save: async (data, options) => {
      if (failure) throw failure;
      if (String(options.preconditionOpts.ifGenerationMatch) !== String(generation)) throw error(412);
      content = data;
      generation++;
      lastOptions = options;
    },
    download: async () => [Buffer.from(content)],
  });
  return {
    store: (now = Date.now) => createXShopSnapshotStore(resolveFile, now, () => historyFile),
    content: () => JSON.parse(content),
    options: () => lastOptions,
    fail: error => { failure = error; },
    replace: value => { content = JSON.stringify(value); generation++; },
    beforeDownload: hook => { beforeDownload = hook; },
  };
}

// Cache unit-test dependency with injectable read/write failures. Distributed
// correctness is tested separately using the real store above.
export function cacheUnitStore(store) {
  let data = null, lease = null, revision = null;
  return {
    readHistory: store.readHistory ? () => store.readHistory() : undefined,
    writeHistory: store.writeHistory ? attempts => store.writeHistory(attempts) : undefined,
    async readState() { data = await store.read(); return { data, lease, revision, retryAfter: 0 }; },
    async acquire(owner, ttl) {
      lease = { owner, expiresAt: Date.now() + ttl };
      return { data: null, lease, revision, retryAfter: 0 };
    },
    async renew() { return true; },
    async commit(owner, snapshot) { await store.write(snapshot); data = snapshot; revision = owner; lease = null; return true; },
    async release() { lease = null; },
  };
}
