import { test } from 'node:test';
import assert from 'node:assert/strict';
import { answer } from '../../src/domain/assistant.js';

const ctx = { apps: [{ id: 'a1', name: 'Shop API' }], environments: [{ id: 'e1', name: 'Production' }], openIncidents: [], monthlyCost: 812.5, health: { score: 96, status: 'healthy' } };

test('maps plain-English intents to answers with actions', () => {
  const cases = [
    ['how do I deploy my app?', /#\/apps/],
    ['my website is slow', /#\/reliability/],
    ['how much am I spending', /#\/costs/],
    ['connect jenkins', /#\/integrations/],
    ['add a server we own', /#\/infrastructure/],
    ['is everything secure?', /#\/security/],
    ['undo the last release', /#\/apps/],
  ];
  for (const [q, route] of cases) {
    const r = answer(q, ctx);
    assert.ok(r.reply.length > 10, q);
    assert.ok(r.actions.some((a) => route.test(a.route)), `${q} -> ${JSON.stringify(r.actions)}`);
  }
});

test('uses live context in replies', () => {
  assert.match(answer('how much does this cost', ctx).reply, /812/);
  assert.match(answer('status?', ctx).reply, /96/);
});

test('handles empty / hostile input gracefully', () => {
  for (const q of ['', '   ', '<script>alert(1)</script>', 'x'.repeat(5000)]) {
    const r = answer(q, ctx);
    assert.equal(typeof r.reply, 'string');
    assert.ok(Array.isArray(r.actions));
  }
});
