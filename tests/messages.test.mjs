import assert from 'node:assert/strict';
import { test } from 'node:test';
import en from '../apps/landing/messages/en.json' with { type: 'json' };
import es from '../apps/landing/messages/es.json' with { type: 'json' };

const keyPaths = (messages, prefix = '') =>
  Object.entries(messages)
    .flatMap(([key, value]) =>
      typeof value === 'object' ? keyPaths(value, `${prefix}${key}.`) : [`${prefix}${key}`],
    )
    .sort();

test('an English namespace is complete or absent', () => {
  for (const [namespace, messages] of Object.entries(en)) {
    assert.ok(namespace in es, `en.json has a namespace that es.json lacks: ${namespace}`);
    assert.deepEqual(
      keyPaths(messages),
      keyPaths(es[namespace]),
      `en.json ${namespace} must have exactly the keys of es.json ${namespace}`,
    );
  }
});
