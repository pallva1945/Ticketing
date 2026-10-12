import assert from 'node:assert/strict';
import test from 'node:test';
import { XShopReadError, withXShopRetries, xshopRetryDelay, xshopHttpError } from '../server/xshopRead.ts';
test('HTML bot challenges are identified separately from API authentication or temporary failures', async () => {
  assert.equal(xshopHttpError(202, 'text/html'), 'blocked');
  assert.equal(xshopHttpError(403, 'text/html; charset=UTF-8'), 'blocked');
  assert.equal(xshopHttpError(403, 'application/json'), 'access');
  assert.equal(xshopHttpError(401, 'application/json'), 'access');
  assert.equal(xshopHttpError(429, 'application/json'), 'temporary');
  assert.equal(xshopHttpError(503, 'text/html'), 'temporary');
  assert.equal(xshopHttpError(200, 'application/json'), null);
  assert.equal(xshopHttpError(202, 'application/json'), null);
  let attempts = 0;
  await assert.rejects(withXShopRetries(async () => {
    attempts++;
    throw new XShopReadError('blocked');
  }), /bot protection/);
  assert.equal(attempts, 1);
});
import { mapConcurrent } from '../server/xshopApi.ts';

test('timeout and interrupted connections retry with bounded backoff', async () => {
  for (const error of [Object.assign(new Error('private-url'), { name: 'TimeoutError' }), new TypeError('private-url')]) {
    let attempts = 0;
    const delays = [];
    const value = await withXShopRetries(async () => {
      if (++attempts < 3) throw error;
      return 'complete';
    }, async delay => { delays.push(delay); });
    assert.equal(value, 'complete');
    assert.equal(attempts, 3);
    assert.deepEqual(delays, [2000, 4000]);
  }
});

test('exhausted transport retries produce only a safe failure reason', async () => {
  let attempts = 0;
  await assert.rejects(withXShopRetries(async () => {
    attempts++;
    throw Object.assign(new Error('PRIVATE_CREDENTIAL_AND_URL'), { name: 'TimeoutError' });
  }, async () => {}), error => error instanceof XShopReadError
    && error.code === 'timeout' && !error.message.includes('PRIVATE'));
  assert.equal(attempts, 3);
});

test('permission, credential and malformed-response failures are not retried', async () => {
  for (const code of ['access', 'credentials', 'response']) {
    let attempts = 0;
    await assert.rejects(withXShopRetries(async () => {
      attempts++;
      throw new XShopReadError(code);
    }, async () => assert.fail('Unexpected retry')), error => error.code === code);
    assert.equal(attempts, 1);
  }
});

test('rate limits retry but honor bounded Retry-After seconds and HTTP dates', async () => {
  assert.equal(xshopRetryDelay(null), 2000);
  assert.equal(xshopRetryDelay('invalid'), 2000);
  assert.equal(xshopRetryDelay('3'), 3000);
  assert.equal(xshopRetryDelay('300'), 10000);
  assert.equal(xshopRetryDelay('0'), 1000);
  const now = Date.parse('2026-10-12T08:00:00Z');
  assert.equal(xshopRetryDelay('Mon, 12 Oct 2026 08:00:04 GMT', now), 4000);
  let attempts = 0;
  await withXShopRetries(async () => {
    if (++attempts < 3) throw new XShopReadError('temporary', 3000);
  }, async delay => assert.ok(delay >= 3000 && delay <= 10000));
  assert.equal(attempts, 3);
});

test('failed parallel download stops scheduling and drains outstanding reads before retry', async () => {
  let release, started = [], finished = false;
  const pending = new Promise(resolve => { release = resolve; });
  const result = mapConcurrent([0, 1, 2, 3, 4], 2, async item => {
    started.push(item);
    if (item === 0) throw new XShopReadError('access');
    await pending;
    return item;
  }).then(() => assert.fail('Partial data must never succeed'), error => {
    finished = true;
    assert.equal(error.code, 'access');
  });
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(started, [0, 1]);
  assert.equal(finished, false);
  release();
  await result;
  assert.equal(finished, true);
  assert.deepEqual(started, [0, 1]);
});
