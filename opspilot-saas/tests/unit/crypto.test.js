import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hashPassword, verifyPassword, createSecretBox, randomId, timingSafeEqualStr } from '../../src/lib/crypto.js';

test('hashPassword produces salted scrypt hash that verifies', async () => {
  const h1 = await hashPassword('correct horse battery');
  const h2 = await hashPassword('correct horse battery');
  assert.notEqual(h1, h2, 'salts must differ');
  assert.match(h1, /^scrypt\$/);
  assert.equal(await verifyPassword('correct horse battery', h1), true);
  assert.equal(await verifyPassword('wrong password!!', h1), false);
});

test('verifyPassword rejects malformed hashes without throwing', async () => {
  assert.equal(await verifyPassword('x', 'garbage'), false);
  assert.equal(await verifyPassword('x', ''), false);
  assert.equal(await verifyPassword('x', null), false);
  assert.equal(await verifyPassword('x', 'scrypt$zz$zz'), false);
});

test('secret box encrypts with AES-GCM and detects tampering', () => {
  const box = createSecretBox('a'.repeat(64));
  const enc = box.encrypt('jenkins-api-token-123');
  assert.notEqual(enc, 'jenkins-api-token-123');
  assert.ok(!enc.includes('jenkins'));
  assert.equal(box.decrypt(enc), 'jenkins-api-token-123');
  assert.notEqual(box.encrypt('same'), box.encrypt('same'), 'IV must be random');
  const parts = enc.split('.');
  parts[2] = Buffer.from('tampered').toString('base64url');
  assert.throws(() => box.decrypt(parts.join('.')));
});

test('secret box rejects weak keys', () => {
  assert.throws(() => createSecretBox('short'));
});

test('randomId is url-safe and unique', () => {
  const ids = new Set(Array.from({ length: 1000 }, () => randomId('app')));
  assert.equal(ids.size, 1000);
  for (const id of ids) assert.match(id, /^app_[A-Za-z0-9_-]{16,}$/);
});

test('timingSafeEqualStr handles different lengths', () => {
  assert.equal(timingSafeEqualStr('abc', 'abc'), true);
  assert.equal(timingSafeEqualStr('abc', 'abcd'), false);
  assert.equal(timingSafeEqualStr('', ''), true);
});
