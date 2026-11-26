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

// The sha256 of each published entry, every field with keys sorted (sha256 below). A published entry never changes unseen and never leaves the
// register. Marking a version published means adding its line here, which review sees
const publishedPins = {
  '2026-11-draft': '667ee53eacab2f3db5524d51d520ba1a7236413e05d266f48b612583b9c3d5a8',
  '2026-11-25-draft': '2b8145647aaf584587f39bbd7d30ba96b1d498034ecf8f8d1404e216fa76d1ac',
};

// Every action and what it blocks: null, 'measurement', or 'publish:<the version it gates>' (scope below). An action is closed with status
// "done", never deleted, and what it blocks never changes unseen. Opening one means adding it here (docs/privacy/workbook.md, "Open an action")
const actionPins = {
  'check-subscribers-before-publish': 'publish:2026-11-25-draft',
  'confirm-effective-date': 'publish:2026-11-25-draft',
  'consent-wording-purpose': 'publish:2026-11-25-draft',
  'abuse-protection-records-in-policy': 'publish:2026-11-25-draft',
  'unsubscribe-sentence': 'publish:2026-11-25-draft',
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
  'session-reminders': null,
  'faq-unsubscribe-sentence': null,
  'confirm-link-codes-in-policy': null,
  'verify-zoho-source-after-deploy': null,
};

const sortKeys = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
    ? Object.fromEntries(Object.keys(value).toSorted().map((key) => [key, sortKeys(value[key])]))
    : value;

const sha256 = (value) => createHash('sha256').update(JSON.stringify(sortKeys(value))).digest('hex');
const scope = ({ blocks, gates }) => (blocks === 'publish' ? `publish:${gates}` : blocks);

// What a person reads before authorizing: the whole Privacy namespace, the consent label and the notice under it, in both locales
const fingerprintOf = ({ en, es }) => {
  const text = ({ Privacy, Waitlist: { consent } }) => ({ consent: { label: consent.label, notice: consent.notice }, privacy: Privacy });
  return sha256({ en: text(en), es: text(es) });
};
const readMessages = async () => {
  const [en, es] = await Promise.all(['en', 'es'].map((locale) => readJSON(`apps/landing/messages/${locale}.json`)));
  return { en, es };
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
        Object.keys(action).filter((key) => key !== 'gates').toSorted().join() !== actionKeys.join() && `${name}: keys must be ${actionKeys.join(', ')}, and gates for a publish blocker`,
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
  const line = (entry) => `'${entry.version}': '${sha256(entry)}',`;
  return [
    ...Object.entries(publishedPins).flatMap(([version, hash]) => {
      const entry = byName.get(version);
      if (!entry) return [`${version}: a published version left the register`];
      return sha256(entry) === hash
        ? []
        : [
            `${version}: a published entry changed. Change one only to record what happened later, such as that people were told (subjectsTold), ` +
              `never its text: a new text is a new version. If the change is right, put ${line(entry)} in publishedPins in ${testPath}`,
          ];
    }),
    ...policyVersions
      .filter(({ version, publishedOn }) => publishedOn !== null && !Object.hasOwn(publishedPins, version))
      .map((entry) => `${entry.version}: marked published but not pinned. Add ${line(entry)} to publishedPins in ${testPath}`),
  ];
};

const actionPinProblems = ({ actions }) => {
  const byId = new Map(actions.map((action) => [action.id, action]));
  const pin = (action) => (scope(action) === null ? 'null' : `'${scope(action)}'`);
  return [
    ...Object.entries(actionPins).flatMap(([id, pinned]) => {
      if (!byId.has(id)) return [`${id}: an action left the register. Close it with status "done" instead`];
      const action = byId.get(id);
      return scope(action) === pinned ? [] : [`${id}: what it blocks changed from ${pinned} to ${scope(action)}. Pin it as '${id}': ${pin(action)} in ${testPath}; a new scope needs the owner's yes`];
    }),
    ...actions.filter(({ id }) => !Object.hasOwn(actionPins, id)).map((action) => `${action.id}: not pinned. Add '${action.id}': ${pin(action)} to actionPins in ${testPath}`),
  ];
};

// A publish blocker names the publication it holds back: a registered version, or "after:<label>" for the first version after <label>, valid
// only while <label> is the newest entry and published, so any newer entry forces it to be re-pointed
const gatesProblems = ({ policyVersions, actions }) => {
  const published = new Set(policyVersions.filter(({ publishedOn }) => publishedOn !== null).map(({ version }) => version));
  const labels = new Set(policyVersions.map(({ version }) => version));
  const newest = policyVersions.at(-1);
  return actions.flatMap(({ id, blocks, gates = null, status }) => {
    if (blocks !== 'publish') return gates === null ? [] : [`${id}: only a publish blocker has gates`];
    const after = /^after:(.+)$/.exec(gates ?? '')?.[1];
    if (after !== undefined)
      return after === newest?.version && newest.publishedOn
        ? []
        : [`${id}: gates "${gates}", but ${after} is not the newest published entry. Point it at ${newest?.version}, the version it holds back`];
    if (!labels.has(gates)) return [`${id}: gates must be a registered version or "after:<the newest entry, published>", not ${gates}`];
    return status === 'open' && published.has(gates) ? [`${id}: open, but the version it gates, ${gates}, is marked published`] : [];
  });
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
  const [computed, { policyVersions }] = await Promise.all([readMessages().then(fingerprintOf), readJSON(registerPath)]);
  const newest = policyVersions.at(-1);
  const fix =
    newest.publishedOn === null
      ? `${newest.version} is not published yet: once the owner has approved the exact text, put the computed hash in its textSha256.`
      : `${newest.version} is published: add a new version with the computed hash and bump policyVersion. Never edit a published version's hash.`;
  assert.equal(newest.textSha256, computed, `The privacy text or the consent wording changed. Computed fingerprint: ${computed}. ${fix} Follow ${workbookPath}, cases 5 and 11.`);
});

test('the fingerprint changes with each text a person reads before authorizing', async () => {
  const messages = await readMessages();
  const computed = fingerprintOf(messages);
  for (const locale of ['en', 'es']) {
    for (const edit of [({ Waitlist }) => (Waitlist.consent.label += '.'), ({ Waitlist }) => (Waitlist.consent.notice += '.'), ({ Privacy }) => (Privacy.effective += '.')]) {
      const copy = structuredClone(messages);
      edit(copy[locale]);
      assert.notEqual(fingerprintOf(copy), computed, `${locale}: ${edit}`);
    }
  }
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

test('published entries match their pins, every field included, and every published entry is pinned', async () => {
  const register = await readJSON(registerPath);
  assert.deepEqual(pinProblems(register), []);
  const [first, ...rest] = register.policyVersions;
  assert.deepEqual(pinProblems({ policyVersions: rest }), ['2026-11-draft: a published version left the register']);
  const edits = [{ textSha256: '0'.repeat(64) }, { publishedOn: '2026-11-24' }, { publishedOn: null }, { substantial: !first.substantial }, { subjectsTold: 'probe' }, { summary: 'probe' }];
  for (const edit of edits) assert.match(pinProblems({ policyVersions: [{ ...first, ...edit }, ...rest] }).join(), /2026-11-draft: a published entry changed/, JSON.stringify(edit));
  const unpinned = { ...first, version: 'probe', publishedOn: '2026-12-01' };
  assert.match(pinProblems({ policyVersions: [...register.policyVersions, unpinned] }).join(), /probe: marked published but not pinned. Add 'probe': '[0-9a-f]{64}',/);
});

test('actions are never deleted, and what each blocks is pinned', async () => {
  const register = await readJSON(registerPath);
  assert.deepEqual(actionPinProblems(register), []);
  const withoutBlockers = register.actions.filter(({ blocks }) => blocks !== 'publish');
  assert.match(actionPinProblems({ actions: withoutBlockers }).join(), /left the register/);
  const rescoped = register.actions.map((action) => ({ ...action, blocks: null, gates: null }));
  assert.match(actionPinProblems({ actions: rescoped }).join(), /what it blocks changed/);
  const repointed = register.actions.map((action) => (action.blocks === 'publish' ? { ...action, gates: 'after:2026-11-draft' } : action));
  assert.match(actionPinProblems({ actions: repointed }).join(), /changed from publish:.+ to publish:after:2026-11-draft/);
});

test('a publish blocker gates a version: never a published one, and "after:<label>" only while that label is the newest, published', async () => {
  const register = await readJSON(registerPath);
  assert.deepEqual(gatesProblems(register), []);
  const policyVersions = [
    { version: 'old', publishedOn: '2026-11-23' },
    { version: 'new', publishedOn: null },
  ];
  const blocker = { id: 'probe', blocks: 'publish', status: 'open' };
  const check = (actions, versions = policyVersions) => gatesProblems({ policyVersions: versions, actions }).join();
  assert.equal(check([{ ...blocker, gates: 'new' }]), '');
  assert.match(check([blocker]), /gates must be a registered version or "after:/);
  assert.match(check([{ ...blocker, gates: 'unknown' }]), /gates must be/);
  assert.match(check([{ id: 'probe', blocks: null, gates: 'new' }]), /only a publish blocker has gates/);
  assert.match(check([{ ...blocker, gates: 'old' }]), /open, but the version it gates, old, is marked published/);
  assert.equal(check([{ ...blocker, gates: 'old', status: 'done' }]), '');
  // Before any newer entry, "after:old" is the way to hold back the next version
  assert.equal(check([{ ...blocker, gates: 'after:old' }], [policyVersions[0]]), '');
  assert.match(check([{ ...blocker, gates: 'after:new' }]), /after:new", but new is not the newest published entry/);
  // A newer entry, unpublished: the blocker must be re-pointed
  assert.match(check([{ ...blocker, gates: 'after:old' }]), /after:old", but old is not the newest published entry. Point it at new/);
  // Review step 7: the newer entry marked published instead of re-pointing; step 8: it arrives already published
  const allPublished = policyVersions.map((version) => ({ ...version, publishedOn: version.publishedOn ?? '2026-12-01' }));
  assert.match(check([{ ...blocker, gates: 'after:old' }], allPublished), /Point it at new/);
  assert.match(check([{ ...blocker, gates: 'after:old', status: 'done' }], allPublished), /Point it at new/);
  assert.match(check([{ ...blocker, gates: 'new' }], allPublished), /new, is marked published/);
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
