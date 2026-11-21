import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { ESLint } from 'eslint';
import stylelint from 'stylelint';

const root = join(import.meta.dirname, '..');
const src = join(root, 'apps/landing/src');
const eslint = new ESLint({ cwd: root });

const messages = {
  moduleToModule: (name) =>
    `A module does not import another module (${name}). Compose them in the route, or ask to move the shared code.`,
  routeToModuleInternals: 'Import a module only through index.ts, server.ts or actions.ts.',
  sharedToModule: 'shared knows no domains: move this code into the module that uses it.',
  navigation: 'Use Link, redirect, useRouter and usePathname from @/i18n/navigation to keep the locale.',
};

// Lints source as if it lived at a path under the repo root; the file itself need not exist
const lint = async (path, code) => {
  const [result] = await eslint.lintText(code, { filePath: join(root, path) });
  return result.messages;
};

const summary = (reports) => JSON.stringify(reports.map(({ ruleId, message }) => ({ ruleId, message })));

const assertReported = (reports, ruleId, message) => {
  const hits = reports.filter((report) => report.ruleId === ruleId);
  assert.ok(hits.length > 0, `expected ${ruleId}, got ${summary(reports)}`);
  if (message) assert.ok(hits.some((hit) => hit.message.includes(message)), `expected "${message}", got ${summary(hits)}`);
  assert.ok(reports.every((report) => report.severity === 2), `every report must be an error: ${summary(reports)}`);
};

const assertClean = (reports) => assert.deepEqual(reports, [], summary(reports));

// Boundaries skips imports its resolver cannot find on disk, so the imported modules are real files.
// Unique folder names keep parallel runs apart; finally removes them even when an assertion fails.
const withModules = async (files, check) => {
  const id = randomBytes(4).toString('hex');
  const name = (module) => `${module}-${id}`;
  const folders = [...new Set(Object.keys(files).map((file) => file.split('/')[0]))];
  try {
    for (const [file, code] of Object.entries(files)) {
      const [module, ...rest] = file.split('/');
      const path = join(src, 'modules', name(module), ...rest);
      await mkdir(dirname(path), { recursive: true });
      await writeFile(path, code);
    }
    await check(name);
  } finally {
    await Promise.all(folders.map((module) => rm(join(src, 'modules', name(module)), { recursive: true, force: true })));
  }
};

test('a module cannot import another module', () =>
  withModules({ 'a/index.ts': 'export const a = 1;\n', 'b/index.ts': 'export const b = 1;\n' }, async (name) => {
    const reports = await lint(
      `apps/landing/src/modules/${name('a')}/use-b.ts`,
      `import { b } from '@/modules/${name('b')}';\n\nexport const useB = b;\n`,
    );
    assertReported(reports, 'boundaries/dependencies', messages.moduleToModule(name('b')));
  }));

test('a route imports a module only through its entry files', () =>
  withModules(
    {
      'a/index.ts': 'export const a = 1;\n',
      'a/server.ts': 'export const aServer = 1;\n',
      'a/actions.ts': 'export const aAction = 1;\n',
      'a/ui/form.ts': 'export const form = 1;\n',
    },
    async (name) => {
      const route = 'apps/landing/src/app/[locale]/probe/page.tsx';
      assertReported(
        await lint(route, `import { form } from '@/modules/${name('a')}/ui/form';\n\nexport const value = form;\n`),
        'boundaries/dependencies',
        messages.routeToModuleInternals,
      );
      assertClean(await lint(route, `import { a } from '@/modules/${name('a')}';\n\nexport const value = a;\n`));
      assertClean(await lint(route, `import { aServer } from '@/modules/${name('a')}/server';\n\nexport const value = aServer;\n`));
      assertClean(await lint(route, `import { aAction } from '@/modules/${name('a')}/actions';\n\nexport const value = aAction;\n`));
    },
  ));

test('shared cannot import a module', () =>
  withModules({ 'a/index.ts': 'export const a = 1;\n' }, async (name) => {
    const reports = await lint('apps/landing/src/shared/probe.ts', `import { a } from '@/modules/${name('a')}';\n\nexport const value = a;\n`);
    assertReported(reports, 'boundaries/dependencies', messages.sharedToModule);
  }));

test('i18n imports nothing from the app', async () => {
  const reports = await lint('apps/landing/src/i18n/probe.ts', `import { siteUrl } from '@/shared/env';\n\nexport const value = siteUrl;\n`);
  assertReported(reports, 'boundaries/dependencies');
});

test('a package cannot import an app', async () => {
  const reports = await lint(
    'packages/probe/src/index.ts',
    `import { routing } from '../../../apps/landing/src/i18n/routing';\n\nexport const value = routing;\n`,
  );
  assertReported(reports, 'boundaries/dependencies');
});

test('an app cannot import another app', async () => {
  const other = join(root, 'apps', `probe-${randomBytes(4).toString('hex')}`);
  try {
    await mkdir(join(other, 'src/shared'), { recursive: true });
    await writeFile(join(other, 'src/shared/value.ts'), 'export const value = 1;\n');
    // A route may import shared code, but only its own app's
    const reports = await lint(
      'apps/landing/src/app/probe.ts',
      `import { value } from '../../../${other.split('/').at(-1)}/src/shared/value';\n\nexport const copy = value;\n`,
    );
    assertReported(reports, 'boundaries/dependencies');
  } finally {
    await rm(other, { recursive: true, force: true });
  }
});

test('files outside a known element are reported', async () => {
  assertReported(await lint('apps/landing/src/misc/x.ts', 'export const x = 1;\n'), 'boundaries/no-unknown-files');
  // Config, e2e and root files are outside the boundaries scope
  for (const path of ['apps/landing/e2e/probe.spec.ts', 'apps/landing/probe.config.ts', 'tests/probe.test.mjs']) {
    assertClean(await lint(path, 'export const x = 1;\n'));
  }
});

test('navigation keeps the locale', async () => {
  const route = 'apps/landing/src/app/[locale]/probe/page.tsx';
  const restricted = [
    `import Link from 'next/link';\n\nexport const value = Link;\n`,
    `import { redirect } from 'next/navigation';\n\nexport const value = redirect;\n`,
    `import { useRouter } from 'next/navigation';\n\nexport const value = useRouter;\n`,
    `import { usePathname } from 'next/navigation';\n\nexport const value = usePathname;\n`,
  ];
  for (const code of restricted) assertReported(await lint(route, code), 'no-restricted-imports', messages.navigation);
  assertClean(await lint(route, `import { notFound } from 'next/navigation';\n\nexport const value = notFound;\n`));
  assertClean(
    await lint(
      'apps/landing/src/i18n/navigation.ts',
      `import Link from 'next/link';\nimport { redirect, usePathname, useRouter } from 'next/navigation';\n\nexport const value = [Link, redirect, usePathname, useRouter];\n`,
    ),
  );
});

test('visible text comes from messages', async () => {
  const route = 'apps/landing/src/app/[locale]/probe/page.tsx';
  assertReported(await lint(route, 'export const Probe = () => <p>Hello</p>;\n'), 'react/jsx-no-literals');
  assertReported(await lint(route, `export const Probe = () => <p>{'Hello'}</p>;\n`), 'react/jsx-no-literals');
  assertClean(
    await lint(
      route,
      `import { useTranslations } from 'next-intl';\n\nexport const Probe = () => {\n  const t = useTranslations('Home');\n\n  return <p className="t-body-lg">{t('lead')}</p>;\n};\n`,
    ),
  );
});

test('explicit any is an error', async () => {
  assertReported(
    await lint('apps/landing/src/shared/probe.ts', 'export const identity = (value: any) => value;\n'),
    '@typescript-eslint/no-explicit-any',
  );
});

test('@ts-ignore is an error', async () => {
  assertReported(
    await lint('apps/landing/src/shared/probe.ts', `// @ts-ignore\nexport const count: number = 'one';\n`),
    '@typescript-eslint/ban-ts-comment',
  );
});

test('a non-null assertion is an error', async () => {
  assertReported(
    await lint('apps/landing/src/shared/probe.ts', 'export const first = (list: string[]) => list[0]!;\n'),
    '@typescript-eslint/no-non-null-assertion',
  );
});

test('file names are kebab-case', async () => {
  assertReported(await lint('apps/landing/src/shared/MyThing.ts', 'export const x = 1;\n'), 'check-file/filename-naming-convention');
  assertReported(await lint('apps/landing/src/shared/my_thing.tsx', 'export const x = 1;\n'), 'check-file/filename-naming-convention');
  assertReported(await lint('apps/landing/src/app/MyThing.module.css', '.x {}\n'), 'check-file/filename-naming-convention');
  assertClean(await lint('apps/landing/src/shared/my-thing.ts', 'export const x = 1;\n'));
  assertClean(await lint('apps/landing/src/app/my-thing.module.css', '.x {}\n'));
});

test('no inline style on DOM elements', async () => {
  assertReported(
    await lint('apps/landing/src/app/[locale]/probe/page.tsx', 'export const Probe = () => <div style={{}} />;\n'),
    'react/forbid-dom-props',
  );
});

test('every rule is an error or off, never a warning', async () => {
  for (const path of ['apps/landing/src/app/[locale]/(site)/page.tsx', 'apps/landing/src/i18n/request.ts', 'apps/landing/e2e/smoke.spec.ts', 'eslint.config.mjs']) {
    const config = await eslint.calculateConfigForFile(join(root, path));
    const warnings = Object.entries(config.rules)
      .filter(([, value]) => [1, 'warn'].includes([value].flat()[0]))
      .map(([ruleId]) => ruleId);
    assert.deepEqual(warnings, [], `${path} has rules at warn`);
    assert.equal(config.linterOptions.reportUnusedDisableDirectives, 2, `${path} reports unused disable directives as a warning`);
  }
});

const lintCss = async (code) => {
  const { results } = await stylelint.lint({
    code,
    codeFilename: join(src, 'app/[locale]/probe/page.module.css'),
    configFile: join(root, 'stylelint.config.mjs'),
  });
  return results[0].warnings;
};

const cssRules = (warnings) => warnings.map(({ rule, severity }) => `${rule}:${severity}`);

test('CSS uses theme variables, not literals', async () => {
  assert.deepEqual(cssRules(await lintCss('.x {\n  color: #fff;\n  margin: 12px;\n}\n')), [
    'value-type-custom-property-required-list:error',
    'value-type-custom-property-required-list:error',
  ]);
  assert.deepEqual(cssRules(await lintCss('.x {\n  color: var(--color-text-primary);\n  margin: 0;\n}\n')), []);
});

test('CSS cannot invent tokens', async () => {
  assert.deepEqual(cssRules(await lintCss('.x {\n  color: var(--color-nope);\n}\n')), ['no-unknown-custom-properties:error']);
});
