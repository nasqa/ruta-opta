import assert from 'node:assert/strict';
import { join } from 'node:path';
import { test } from 'node:test';
import './support/next-resolution.mjs';
import es from '../apps/landing/messages/es.json' with { type: 'json' };

const landing = join(import.meta.dirname, '../apps/landing');
const { events, retiredGoals, questions, allyRoutes, pageGoalRoutes } = await import(join(landing, 'src/modules/analytics/catalog.ts'));
const { routing } = await import(join(landing, 'src/i18n/routing.ts'));

// A goal name is a contract with the analytics dashboard, where its history lives. This ledger holds every name ever declared:
// a new event adds a line, and a line is never edited or deleted (the event is retired instead)
const goalLedger = [
  'Hero Follow',
  'Hero Ally',
  'Tourism Follow',
  'Ally Train WhatsApp',
  'Ally Train Email',
  'Ally Link WhatsApp',
  'Ally Link Email',
  'Ally Validate WhatsApp',
  'Ally Validate Email',
  'Ally Drive WhatsApp',
  'Ally Drive Email',
  'Ally Accompany WhatsApp',
  'Ally Accompany Email',
  'Ally Share WhatsApp',
  'Ally Share Email',
  'Ally Other WhatsApp',
  'Ally Other Email',
  'Copy Email',
  'WhatsApp Floating',
  'Footer WhatsApp',
  'Footer Email',
  'Footer Instagram',
];

const activeGoals = () => Object.values(events).map(({ goal }) => goal);
const declaredGoals = () => [...activeGoals(), ...retiredGoals.map(({ goal }) => goal)];

test('every goal name ever declared is still active or retired, and a new one has its ledger line', () => {
  assert.deepEqual(declaredGoals().toSorted(), goalLedger.toSorted());
});

test('a goal name belongs to one event only, retired events included', () => {
  assert.deepEqual(
    declaredGoals().filter((goal, index, all) => all.indexOf(goal) !== index),
    [],
  );
});

test('a goal name is words of letters with single spaces, so every vendor syntax can carry it', () => {
  assert.deepEqual(
    declaredGoals().filter((goal) => !/^[A-Za-z]+(?: [A-Za-z]+)*$/.test(goal)),
    [],
  );
});

test('every event answers a business question', () => {
  for (const [id, { answers }] of Object.entries(events)) {
    assert.ok(answers.length > 0, `${id} answers no question`);
    for (const question of answers) assert.ok(question in questions, `${id} answers an unknown question: ${question}`);
  }
});

test('every business question has events that answer it and a decision it informs', () => {
  for (const [name, { ask, action }] of Object.entries(questions)) {
    assert.ok(ask && action, `${name} needs both the question and the decision it informs`);
    assert.ok(
      Object.values(events).some(({ answers }) => answers.includes(name)),
      `no event answers ${name}`,
    );
  }
});

test('every ally route in the copy has its WhatsApp event and its e-mail event', () => {
  assert.deepEqual(allyRoutes.toSorted(), Object.keys(es.Prelaunch.allies.routes).toSorted());
  for (const route of allyRoutes) {
    for (const channel of ['whatsapp', 'email']) {
      const event = events[`ally-${route}-${channel}`];
      assert.ok(event, `${route} has no ${channel} event`);
      assert.deepEqual([event.intent, event.allyRoute, event.channel], ['ally', route, channel]);
    }
  }
});

test('the pageview goals are the localised paths of the funnel pages', () => {
  const paths = pageGoalRoutes.flatMap((route) => routing.locales.map((locale) => `/${locale}${routing.pathnames[route][locale]}`));
  // These are the goals typed into the dashboard: a renamed slug must fail here until the dashboard changes too
  assert.deepEqual(paths.toSorted(), ['/en/confirm', '/en/confirmed', '/en/unsubscribed', '/es/baja', '/es/confirmado', '/es/confirmar']);
});
