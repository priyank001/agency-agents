import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RateLimiter } from '../../src/lib/ratelimit.js';

test('allows up to limit within window then blocks, then recovers', () => {
  let now = 0;
  const rl = new RateLimiter({ limit: 3, windowMs: 1000, now: () => now });
  assert.equal(rl.hit('k').allowed, true);
  assert.equal(rl.hit('k').allowed, true);
  assert.equal(rl.hit('k').allowed, true);
  const blocked = rl.hit('k');
  assert.equal(blocked.allowed, false);
  assert.ok(blocked.retryAfterMs > 0 && blocked.retryAfterMs <= 1000);
  assert.equal(rl.hit('other').allowed, true, 'keys are independent');
  now = 1001;
  assert.equal(rl.hit('k').allowed, true);
});

test('bounded memory: evicts old keys beyond maxKeys', () => {
  const rl = new RateLimiter({ limit: 1, windowMs: 1000, maxKeys: 100 });
  for (let i = 0; i < 1000; i++) rl.hit('k' + i);
  assert.ok(rl.size <= 100, String(rl.size));
});

test('reset clears a key', () => {
  const rl = new RateLimiter({ limit: 1, windowMs: 1000 });
  rl.hit('a');
  assert.equal(rl.hit('a').allowed, false);
  rl.reset('a');
  assert.equal(rl.hit('a').allowed, true);
});
