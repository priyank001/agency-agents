import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validate, ValidationError } from '../../src/lib/validate.js';

const schema = {
  name: { type: 'string', required: true, min: 2, max: 40, pattern: /^[a-z][a-z0-9-]*$/ },
  email: { type: 'email', required: true },
  port: { type: 'int', min: 1, max: 65535, default: 8080 },
  tier: { type: 'enum', values: ['development', 'staging', 'production'], required: true },
  repoUrl: { type: 'url', protocols: ['https:', 'ssh:', 'git:'] },
  tags: { type: 'array', of: { type: 'string', max: 10 }, max: 3, default: [] },
};

test('valid input passes, defaults applied, unknown keys dropped', () => {
  const out = validate(schema, { name: 'shop-api', email: 'A@B.co', tier: 'staging', extra: 1 });
  assert.deepEqual(out, { name: 'shop-api', email: 'a@b.co', port: 8080, tier: 'staging', tags: [] });
});

test('collects all errors with field names', () => {
  try {
    validate(schema, { name: 'X', email: 'nope', tier: 'prod', port: 70000 });
    assert.fail('should throw');
  } catch (e) {
    assert.ok(e instanceof ValidationError);
    const fields = e.details.map((d) => d.field).sort();
    assert.deepEqual(fields, ['email', 'name', 'port', 'tier']);
  }
});

test('rejects non-object bodies and prototype pollution keys', () => {
  assert.throws(() => validate(schema, null), ValidationError);
  assert.throws(() => validate(schema, []), ValidationError);
  assert.throws(() => validate(schema, 'str'), ValidationError);
  const polluted = JSON.parse('{"__proto__": {"admin": true}, "name": "ok-name", "email": "a@b.co", "tier": "staging"}');
  const out = validate(schema, polluted);
  assert.equal(({}).admin, undefined);
  assert.equal(Object.getPrototypeOf(out), Object.prototype);
  assert.equal(out.admin, undefined);
});

test('int rejects floats, strings, NaN, Infinity', () => {
  for (const port of [1.5, '80', NaN, Infinity, true]) {
    assert.throws(() => validate(schema, { name: 'ab', email: 'a@b.co', tier: 'staging', port }), ValidationError, String(port));
  }
});

test('url enforces protocols and rejects javascript:', () => {
  assert.throws(() => validate(schema, { name: 'ab', email: 'a@b.co', tier: 'staging', repoUrl: 'javascript:alert(1)' }), ValidationError);
  const ok = validate(schema, { name: 'ab', email: 'a@b.co', tier: 'staging', repoUrl: 'https://github.com/acme/shop.git' });
  assert.equal(ok.repoUrl, 'https://github.com/acme/shop.git');
});

test('strings are trimmed and control characters rejected', () => {
  const ok = validate(schema, { name: '  ab  ', email: 'a@b.co', tier: 'staging' });
  assert.equal(ok.name, 'ab');
  assert.throws(() => validate({ s: { type: 'string' } }, { s: 'a\u0000b' }), ValidationError);
});

test('array length and item validation', () => {
  assert.throws(() => validate(schema, { name: 'ab', email: 'a@b.co', tier: 'staging', tags: ['a', 'b', 'c', 'd'] }), ValidationError);
  assert.throws(() => validate(schema, { name: 'ab', email: 'a@b.co', tier: 'staging', tags: [1] }), ValidationError);
});

test('partial mode ignores required', () => {
  assert.deepEqual(validate(schema, { tier: 'production' }, { partial: true }), { tier: 'production' });
});
