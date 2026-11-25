import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { test } from 'node:test';

const root = join(import.meta.dirname, '..');
const read = (path) => readFile(join(root, path), 'utf8');
const readJSON = async (path) => JSON.parse(await read(path));

const workbookPath = 'docs/privacy/workbook.md';
const registerPath = 'docs/privacy/register.json';
const skillPath = '.claude/skills/privacy-changes/SKILL.md';
const testPath = 'tests/privacy-register.test.mjs';

// A published text never changes and never leaves the register. Marking a version published means adding its pair here, which review sees
const publishedPins = {
  '2026-11-draft': '8f12ee233492dded124d378dabdfa0ce6b5dc54a1a8b7026d566a098bf6544d5',
};

// Every action and what it blocks. An action is closed with status "done", never deleted, and what it blocks never changes unseen.
// Opening one means adding it here (docs/privacy/workbook.md, "Open an action")
const actionPins = {
  'check-subscribers-before-publish': 'publish',
  'confirm-effective-date': 'publish',
  'consent-wording-purpose': 'publish',
  'abuse-protection-records-in-policy': 'publish',
  'unsubscribe-sentence': 'publish',
  'plausible-hostname-allow-list': 'measurement',
  'netlify-script-variable': 'measurement',
  'record-publication-2026-11-25-draft': null,
  'counsel-review': null,
  'name-counsel': null,
  'rnbd-threshold': null,
  'delete-old-throttle-records': null,
  'course-whatsapp-utm-source': null,
  'name-weekly-tally-owner': null,
  'consent-proof': null,
  'name-incident-owner': null,
  'set-mailbox-check': null,
  'choose-records-location': null,
  'yearly-list-reminder': null,
  'yearly-policy-review': null,
  'calendar-reminder': null,
};

const sortKeys = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
    ? Object.fromEntries(Object.keys(value).toSorted().map((key) => [key, sortKeys(value[key])]))
    : value;

// What a person reads before authorizing: the whole Privacy namespace and the consent label, in both locales
const fingerprint = async () => {
  const [en, es] = await Promise.all(['en', 'es'].map((locale) => readJSON(`apps/landing/messages/${locale}.json`)));
  const text = ({ Privacy, Waitlist }) => ({ consent: Waitlist.consent.label, privacy: Privacy });
  return createHash('sha256').update(JSON.stringify(sortKeys({ en: text(en), es: text(es) }))).digest('hex');
};

// GitHub's heading ids: lowercase, punctuation dropped, each space a hyphen, -1, -2 for repeats. Headings inside code fences do not count
const anchors = (markdown) => {
  const seen = new Map();
  let fenced = false;
  return markdown.split('\n').flatMap((line) => {
    if (line.startsWith('```')) fenced = !fenced;
    const heading = fenced ? undefined : /^#{1,6} (.+)$/.exec(line)?.[1];
    if (heading === undefined) return [];
    const base = heading
      .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/[`*]/g, '')
      .trim()
      .toLowerCase()
      .replace(/[^\p{L}\p{M}\p{N}\p{Pc} -]/gu, '')
      .replaceAll(' ', '-');
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    return [`#${count === 0 ? base : `${base}-${count}`}`];
  });
};

const isDate = (value) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;
const isText = (value) => typeof value === 'string' && value.trim() !== '';

const versionKeys = ['publishedOn', 'subjectsTold', 'substantial', 'summary', 'textSha256', 'version'];
const actionKeys = ['blocks', 'due', 'id', 'owner', 'repeat', 'status', 'title', 'workbook'];

// Each check returns the problems it finds, so the tests can also prove a check fails on a broken copy
const versionProblems = ({ policyVersions }) => {
  if (!Array.isArray(policyVersions) || policyVersions.length === 0) return ['policyVersions is empty'];
  const problems = policyVersions.flatMap((entry, index) => {
    const name = entry.version ?? `#${index}`;
    const newest = index === policyVersions.length - 1;
    return [
      Object.keys(entry).toSorted().join() !== versionKeys.join() && `${name}: keys must be ${versionKeys.join(', ')}`,
      !isText(entry.version) && `${name}: version is empty`,
      !/^[0-9a-f]{64}$/.test(entry.textSha256) && `${name}: textSha256 is not a sha256 hex`,
      !isText(entry.summary) && `${name}: summary is empty`,
      typeof entry.substantial !== 'boolean' && `${name}: substantial is not true or false`,
      !isText(entry.subjectsTold) && `${name}: subjectsTold is empty`,
      entry.publishedOn !== null && !isDate(entry.publishedOn) && `${name}: publishedOn is not null or a real YYYY-MM-DD`,
      entry.publishedOn === null && !newest && `${name}: only the newest version may be unpublished`,
    ].filter(Boolean);
  });
  const names = policyVersions.map(({ version }) => version);
  const dates = policyVersions.map(({ publishedOn }) => publishedOn).filter(Boolean);
  return [
    ...problems,
    new Set(names).size !== names.length && 'two versions share a name',
    dates.join() !== dates.toSorted().join() && 'versions are not oldest first',
  ].filter(Boolean);
};

const actionProblems = ({ actions }, workbookAnchors) => {
  if (!Array.isArray(actions)) return ['actions is not a list'];
  const ids = actions.map(({ id }) => id);
  return [
    ...actions.flatMap((action, index) => {
      const name = action.id ?? `#${index}`;
      return [
        Object.keys(action).toSorted().join() !== actionKeys.join() && `${name}: keys must be ${actionKeys.join(', ')}`,
        !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(action.id) && `${name}: id is not kebab-case`,
        !isText(action.title) && `${name}: title is empty`,
        !isText(action.owner) && `${name}: owner is empty`,
        action.due !== null && !isDate(action.due) && `${name}: due is not null or a real YYYY-MM-DD`,
        ![null, 'yearly'].includes(action.repeat) && `${name}: repeat is not null or "yearly"`,
        ![null, 'publish', 'measurement'].includes(action.blocks) && `${name}: blocks is not null, "publish" or "measurement"`,
        !['open', 'done'].includes(action.status) && `${name}: status is not "open" or "done"`,
        !workbookAnchors.includes(action.workbook) && `${name}: ${action.workbook} is not a heading anchor in ${workbookPath}`,
      ].filter(Boolean);
    }),
    new Set(ids).size !== ids.length && 'two actions share an id',
  ].filter(Boolean);
};

const yearlyProblems = ({ policyVersions, actions }) =>
  policyVersions.at(-1)?.publishedOn
    ? actions.filter(({ repeat, status, due }) => repeat === 'yearly' && status === 'open' && due === null).map(({ id }) => `${id}: a yearly duty with no due date`)
    : [];

const pinProblems = ({ policyVersions }) => {
  const byName = new Map(policyVersions.map((entry) => [entry.version, entry]));
  return [
    ...Object.entries(publishedPins).flatMap(([version, hash]) => {
      const entry = byName.get(version);
      if (!entry) return [`${version}: a published version left the register`];
      return [
        entry.publishedOn === null && `${version}: a published version is marked unpublished`,
        entry.textSha256 !== hash && `${version}: a published version's hash changed. Never edit it: add a new version`,
      ].filter(Boolean);
    }),
    ...policyVersions
      .filter(({ version, publishedOn }) => publishedOn !== null && !Object.hasOwn(publishedPins, version))
      .map(({ version, textSha256 }) => `${version}: marked published but not pinned. Add '${version}': '${textSha256}' to publishedPins in ${testPath}`),
  ];
};

const actionPinProblems = ({ actions }) => {
  const byId = new Map(actions.map((action) => [action.id, action]));
  return [
    ...Object.entries(actionPins).flatMap(([id, blocks]) => {
      if (!byId.has(id)) return [`${id}: an action left the register. Close it with status "done" instead`];
      return byId.get(id).blocks === blocks ? [] : [`${id}: blocks changed from ${blocks} to ${byId.get(id).blocks}. That needs the owner's yes and the pin updated in ${testPath}`];
    }),
    ...actions
      .filter(({ id }) => !Object.hasOwn(actionPins, id))
      .map(({ id, blocks }) => `${id}: not pinned. Add '${id}': ${blocks === null ? 'null' : `'${blocks}'`} to actionPins in ${testPath}`),
  ];
};

const publishBlockerProblems = ({ policyVersions, actions }) => {
  const newest = policyVersions.at(-1);
  return newest?.publishedOn
    ? actions.filter(({ blocks, status }) => blocks === 'publish' && status === 'open').map(({ id }) => `${id}: blocks publishing and is open, but ${newest.version} is marked published`)
    : [];
};

// Until the publication is recorded, the live text still reads as an editable draft, so recording it is an open action of its own
const recordProblems = ({ policyVersions, actions }) => {
  const newest = policyVersions.at(-1);
  const id = `record-publication-${newest?.version}`;
  return newest && newest.publishedOn === null && !actions.some((action) => action.id === id && action.status === 'open')
    ? [`${newest.version} is unpublished and has no open "${id}" action (${workbookPath}, case 11)`]
    : [];
};

test('the policy version in the code is the newest in the register', async () => {
  const source = await read('apps/landing/src/modules/waitlist/server.ts');
  const inCode = /const policyVersion = '([^']+)'/.exec(source)?.[1];
  assert.ok(inCode, 'server.ts no longer declares policyVersion as a string literal');
  const { policyVersions } = await readJSON(registerPath);
  assert.equal(inCode, policyVersions.at(-1)?.version, `policyVersion in server.ts must be the last entry of ${registerPath} (see ${workbookPath}, case 11)`);
});

test('the policy text and the consent wording match the newest version\'s fingerprint', async () => {
  const [computed, { policyVersions }] = await Promise.all([fingerprint(), readJSON(registerPath)]);
  const newest = policyVersions.at(-1);
  const fix =
    newest.publishedOn === null
      ? `${newest.version} is not published yet: once the owner has approved the exact text, put the computed hash in its textSha256.`
      : `${newest.version} is published: add a new version with the computed hash and bump policyVersion. Never edit a published version's hash.`;
  assert.equal(newest.textSha256, computed, `The privacy text or the consent wording changed. Computed fingerprint: ${computed}. ${fix} Follow ${workbookPath}, cases 5 and 11.`);
});

test('versions are unique, complete, and only the newest may be unpublished', async () => {
  assert.deepEqual(versionProblems(await readJSON(registerPath)), []);
});

test('the version check refuses an unpublished version before the newest', async () => {
  const register = await readJSON(registerPath);
  const older = { ...register.policyVersions[0], version: 'older-probe', publishedOn: null };
  assert.notDeepEqual(versionProblems({ policyVersions: [older, ...register.policyVersions] }), []);
});

test('actions are well formed', async () => {
  const [register, workbook] = await Promise.all([readJSON(registerPath), read(workbookPath)]);
  assert.deepEqual(actionProblems(register, anchors(workbook)), []);
});

test('the anchor check reads headings as GitHub does', () => {
  const markdown = '# Title\n## 1. A new field, or datum\n## Who does what?\n```\n## Not a heading\n```\n## Who does what?\n';
  assert.deepEqual(anchors(markdown), ['#title', '#1-a-new-field-or-datum', '#who-does-what', '#who-does-what-1']);
});

// The yearly duties are promised by the newest text, so an older published version (2026-11-draft) does not date them
test('once the newest version is published, every open yearly duty has a due date', async () => {
  const register = await readJSON(registerPath);
  assert.deepEqual(yearlyProblems(register), []);
  const undated = [{ id: 'probe', repeat: 'yearly', status: 'open', due: null }];
  const versions = (...dates) => dates.map((publishedOn, index) => ({ version: `probe-${index}`, publishedOn }));
  assert.deepEqual(yearlyProblems({ policyVersions: versions('2026-11-23', null), actions: undated }), []);
  assert.deepEqual(yearlyProblems({ policyVersions: versions('2026-11-23', '2026-12-01'), actions: undated }), ['probe: a yearly duty with no due date']);
});

test('published versions match their pins, and every published version is pinned', async () => {
  const register = await readJSON(registerPath);
  assert.deepEqual(pinProblems(register), []);
  const [first, ...rest] = register.policyVersions;
  assert.deepEqual(pinProblems({ policyVersions: rest }), ['2026-11-draft: a published version left the register']);
  assert.match(pinProblems({ policyVersions: [{ ...first, textSha256: '0'.repeat(64) }, ...rest] }).join(), /hash changed/);
  const unpinned = { ...first, version: 'probe', publishedOn: '2026-12-01' };
  assert.match(pinProblems({ policyVersions: [...register.policyVersions, unpinned] }).join(), /probe: marked published but not pinned/);
});

test('actions are never deleted, and what each blocks is pinned', async () => {
  const register = await readJSON(registerPath);
  assert.deepEqual(actionPinProblems(register), []);
  const withoutBlockers = register.actions.filter(({ blocks }) => blocks !== 'publish');
  assert.match(actionPinProblems({ actions: withoutBlockers }).join(), /left the register/);
  const rescoped = register.actions.map((action) => ({ ...action, blocks: null }));
  assert.match(actionPinProblems({ actions: rescoped }).join(), /blocks changed/);
});

test('a version is not marked published while a publish blocker is open', async () => {
  const register = await readJSON(registerPath);
  assert.deepEqual(publishBlockerProblems(register), []);
  const policyVersions = register.policyVersions.map((version) => ({ ...version, publishedOn: version.publishedOn ?? '2026-12-01' }));
  const blocker = { id: 'probe', blocks: 'publish', status: 'open' };
  assert.equal(publishBlockerProblems({ policyVersions, actions: [blocker] }).length, 1);
  assert.deepEqual(publishBlockerProblems({ policyVersions, actions: [{ ...blocker, status: 'done' }] }), []);
});

test('an unpublished newest version has an open action to record its publication', async () => {
  const register = await readJSON(registerPath);
  assert.deepEqual(recordProblems(register), []);
  const unpublished = { policyVersions: [{ version: 'probe', publishedOn: null }], actions: [] };
  assert.match(recordProblems(unpublished).join(), /no open "record-publication-probe" action/);
  assert.deepEqual(recordProblems({ ...unpublished, actions: [{ id: 'record-publication-probe', status: 'open' }] }), []);
});

test('claude finds the workbook', async () => {
  const [skill, agents] = await Promise.all([read(skillPath), read('AGENTS.md')]);
  const frontMatter = /^---\n([\s\S]*?)\n---\n/.exec(skill)?.[1] ?? '';
  assert.match(frontMatter, /^name: privacy-changes$/m, `${skillPath} must be named privacy-changes`);
  assert.match(frontMatter, /^description: \S/m, `${skillPath} needs a description, which is what makes Claude load it`);
  for (const [path, text] of [[skillPath, skill], ['AGENTS.md', agents]]) assert.ok(text.includes(workbookPath), `${path} does not name ${workbookPath}`);
  assert.ok(agents.includes('`privacy-changes`'), 'AGENTS.md does not list the privacy-changes procedure');
});

test('the privacy folder holds no address outside rutaopta.org', async () => {
  const files = (await readdir(join(root, 'docs/privacy'), { recursive: true, withFileTypes: true })).filter((entry) => entry.isFile());
  assert.ok(files.length > 0, 'docs/privacy is empty');
  for (const file of files) {
    const path = join(file.parentPath, file.name);
    const text = await readFile(path, 'utf8');
    const outside = [...text.matchAll(/[\p{L}\p{N}._%+-]+@([\p{L}\p{N}-]+(?:\.[\p{L}\p{N}-]+)+)/gu)].filter(([, domain]) => !/(^|\.)rutaopta\.org$/i.test(domain));
    assert.deepEqual(outside.map(([address]) => address), [], `${path} holds an address outside rutaopta.org. Personal data never goes in this repository`);
  }
});
