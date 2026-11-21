import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { mkdir, readFile, rm, rmdir, stat, writeFile } from 'node:fs/promises';
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
  textProps: "Accessible and visible text comes from messages: use t('…').",
  componentStyle: 'No inline style or styles on components: use a CSS module that reads theme variables, or Mantine style props with theme keys.',
  styleProps: 'Mantine style props take theme keys (p="md", c="action", fz="sm"), not literal colors or lengths. Use a theme key or a CSS module that reads theme variables.',
  serverOnly: "A module's server.ts starts with import 'server-only', so a client import fails the build. Make it the first line.",
  exportAll: 'Module entry files export by name: replace export * with export { … } from ….',
  processEnv:
    "Read process.env only in a module's server.ts or in src/shared/env.ts, and import the value from there. Any file may read process.env.NEXT_PUBLIC_*.",
  typescriptOnly: 'Source under src is TypeScript: rename this file to .ts or .tsx.',
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

test('a package may import another package', async () => {
  const packages = join(root, 'packages');
  const existed = await stat(packages).then(() => true, () => false);
  const name = `probe-${randomBytes(4).toString('hex')}`;
  try {
    await mkdir(join(packages, name, 'src'), { recursive: true });
    await writeFile(join(packages, name, 'src/index.ts'), 'export const value = 1;\n');
    assertClean(
      await lint(`packages/${name}-consumer/src/index.ts`, `import { value } from '../../${name}/src/index';\n\nexport const copy = value;\n`),
    );
  } finally {
    await rm(join(packages, name), { recursive: true, force: true });
    if (!existed) await rmdir(packages).catch(() => {});
  }
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

test('accessible text comes from messages', async () => {
  const route = 'apps/landing/src/app/[locale]/probe/page.tsx';
  const hardcoded = ['alt="Photo"', "title={'Opens in a new tab'}", 'placeholder={`Your name`}', 'aria-label="Close"', 'aria-description="Closes the dialog"'];
  for (const prop of hardcoded) {
    assertReported(await lint(route, `export const Probe = () => <input ${prop} />;\n`), 'no-restricted-syntax', messages.textProps);
  }
  assertClean(
    await lint(
      route,
      `import { useTranslations } from 'next-intl';\n\nexport const Probe = () => {\n  const t = useTranslations('Common');\n\n  return <input className="t-body-lg" aria-label={t('close')} placeholder={t('close')} title={t('close')} />;\n};\n`,
    ),
  );
  // An empty alt marks a decorative image, so it is not text
  assertClean(
    await lint(route, `import Image from 'next/image';\n\nexport const Probe = () => <Image alt="" src="/x.png" width={1} height={1} />;\n`),
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

test('folder names are kebab-case, and route folders follow Next', async () => {
  for (const path of ['apps/landing/src/shared/MyFolder/x.ts', 'apps/landing/src/modules/my_module/index.ts', 'apps/landing/src/app/[locale]/AboutUs/page.tsx']) {
    assertReported(await lint(path, 'export const x = 1;\n'), 'check-file/folder-naming-convention');
  }
  for (const path of ['apps/landing/src/app/[locale]/(site)/_components/x.tsx', 'apps/landing/src/app/[locale]/[...rest]/x.ts', 'apps/landing/src/modules/my-module/index.ts']) {
    assertClean(await lint(path, 'export const x = 1;\n'));
  }
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
  assert.deepEqual(
    cssRules(await lintCss('.x {\n  color: var(--color-text-primary);\n  margin: 0;\n  border-color: currentColor;\n  outline-color: currentcolor;\n}\n')),
    [],
  );
});

test('CSS cannot invent tokens', async () => {
  assert.deepEqual(cssRules(await lintCss('.x {\n  color: var(--color-nope);\n}\n')), ['no-unknown-custom-properties:error']);
});

test('CSS cannot hide a literal in a var() fallback or a local custom property', async () => {
  for (const token of ['--color-text-primary', '--color-nope']) {
    assert.deepEqual(cssRules(await lintCss(`.x {\n  color: var(${token}, #f00);\n}\n`)), ['declaration-property-value-disallowed-list:error']);
  }
  assert.deepEqual(cssRules(await lintCss('.x {\n  --c: #fff;\n  color: var(--c);\n}\n')), ['property-disallowed-list:error']);
});

const route = 'apps/landing/src/app/[locale]/probe/page.tsx';

test('Mantine text props come from messages', async () => {
  for (const prop of ['label="Email"', "description={'We reply within a day'}", 'error={`Required`}']) {
    assertReported(
      await lint(route, `import { TextInput } from '@mantine/core';\n\nexport const Probe = () => <TextInput ${prop} />;\n`),
      'no-restricted-syntax',
      messages.textProps,
    );
  }
  assertClean(
    await lint(
      route,
      `import { TextInput } from '@mantine/core';\nimport { useTranslations } from 'next-intl';\n\nexport const Probe = () => {\n  const t = useTranslations('Common');\n\n  return <TextInput label={t('close')} description={t('close')} error />;\n};\n`,
    ),
  );
});

test('no inline style or styles on components', async () => {
  for (const prop of ['style={{}}', 'styles={{}}']) {
    assertReported(
      await lint(route, `import { Button } from '@mantine/core';\n\nexport const Probe = () => <Button ${prop} />;\n`),
      'react/forbid-component-props',
      messages.componentStyle,
    );
  }
  // className stays allowed: it is how components get CSS modules and Trama's text classes
  assertClean(
    await lint(
      route,
      `import { useTranslations } from 'next-intl';\nimport { Link } from '@/i18n/navigation';\n\nexport const Probe = () => {\n  const t = useTranslations('NotFound');\n\n  return (\n    <Link className="t-body-lg" href="/">\n      {t('home')}\n    </Link>\n  );\n};\n`,
    ),
  );
});

test('Mantine style props take theme keys, not literal colors or lengths', async () => {
  const literals = ['p={12}', 'mt={-4}', 'w="320px"', 'maw="40rem"', 'c="#ff0000"', 'bg="rgb(0 0 0)"', 'bd="1px solid red"', 'fz={`1.25rem`}', 'lh={1.4}', 'm={{ base: 8, md: 16 }}'];
  for (const prop of literals) {
    assertReported(
      await lint(route, `import { Box } from '@mantine/core';\n\nexport const Probe = () => <Box ${prop} />;\n`),
      'no-restricted-syntax',
      messages.styleProps,
    );
  }
  assertClean(
    await lint(route, `import { Box } from '@mantine/core';\n\nexport const Probe = () => <Box p="md" c="action" fz="sm" maw="100%" m={{ base: 'xs', md: 'lg' }} />;\n`),
  );
});

test("a module's server.ts starts with import 'server-only'", async () => {
  const server = 'apps/landing/src/modules/probe/server.ts';
  for (const code of ['export const query = () => 1;\n', `import { cache } from 'react';\nimport 'server-only';\n\nexport const query = cache(() => 1);\n`]) {
    assertReported(await lint(server, code), 'no-restricted-syntax', messages.serverOnly);
  }
  assertClean(await lint(server, `import 'server-only';\n\nexport const query = () => 1;\n`));
});

test('module entry files export by name, never export *', () =>
  withModules({ 'a/value.ts': 'export const value = 1;\n' }, async (name) => {
    for (const entry of ['index.ts', 'server.ts', 'actions.ts']) {
      const path = `apps/landing/src/modules/${name('a')}/${entry}`;
      const head = entry === 'server.ts' ? `import 'server-only';\n\n` : '';
      assertReported(await lint(path, `${head}export * from './value';\n`), 'no-restricted-syntax', messages.exportAll);
      assertClean(await lint(path, `${head}export { value } from './value';\n`));
    }
  }));

test('process.env is read only in a module server.ts and in shared/env.ts', async () => {
  const reads = ['export const url = process.env.URL;\n', 'export const { URL } = process.env;\n', "export const url = process.env['URL'];\n", 'export const env = process.env;\n'];
  for (const path of ['apps/landing/src/shared/probe.ts', 'apps/landing/src/modules/probe/index.ts', 'apps/landing/src/modules/probe/actions.ts', 'apps/landing/src/app/[locale]/probe/data.ts']) {
    for (const code of reads) assertReported(await lint(path, code), 'no-restricted-syntax', messages.processEnv);
  }
  assertReported(await lint(route, 'export const Probe = () => <p>{process.env.URL}</p>;\n'), 'no-restricted-syntax', messages.processEnv);
  // Next inlines NEXT_PUBLIC_* at build time, so any file may read them
  assertClean(await lint('apps/landing/src/shared/probe.ts', 'export const site = process.env.NEXT_PUBLIC_SITE;\n'));
  assertClean(await lint('apps/landing/src/modules/probe/server.ts', `import 'server-only';\n\nexport const url = process.env.URL;\n`));
  assertClean(await lint('apps/landing/src/shared/env.ts', `import 'server-only';\n\nexport const siteUrl = new URL(process.env.URL ?? 'http://localhost:3000');\n`));
});

test('each file kind keeps every selector it needs', async () => {
  // Flat config replaces no-restricted-syntax options per matching block, so a .tsx in a module must still get the text and env checks
  const reports = await lint('apps/landing/src/modules/probe/ui/form.tsx', 'export const Form = () => <input aria-label="Close" defaultValue={process.env.URL} />;\n');
  assertReported(reports, 'no-restricted-syntax', messages.textProps);
  assertReported(reports, 'no-restricted-syntax', messages.processEnv);
});

test('source under src is TypeScript', async () => {
  for (const path of ['apps/landing/src/shared/probe.js', 'apps/landing/src/app/[locale]/probe/page.jsx', 'apps/landing/src/shared/probe.mjs']) {
    assertReported(await lint(path, 'export const x = 1;\n'), 'no-restricted-syntax', messages.typescriptOnly);
  }
});

test("Next's special files at the src root are known files", async () => {
  for (const path of ['apps/landing/src/instrumentation.ts', 'apps/landing/src/instrumentation-client.ts', 'apps/landing/src/mdx-components.tsx']) {
    assertClean(await lint(path, 'export const register = () => {};\n'));
  }
  // Only those names: any other file at the src root is still out of place
  assertReported(await lint('apps/landing/src/setup.ts', 'export const x = 1;\n'), 'boundaries/no-unknown-files');
});

const stylelintCommand = JSON.parse(await readFile(join(root, 'package.json'), 'utf8')).scripts.lint.split(' && ').find((command) => command.startsWith('stylelint'));
const runStylelint = () =>
  spawnSync(stylelintCommand, { cwd: root, shell: true, encoding: 'utf8', env: { ...process.env, PATH: `${join(root, 'node_modules/.bin')}:${process.env.PATH}` } });

test('npm run lint checks CSS in packages too, and passes while packages has none', async () => {
  const packages = join(root, 'packages');
  const existed = await stat(packages).then(() => true, () => false);
  const name = `probe-${randomBytes(4).toString('hex')}`;
  try {
    const clean = runStylelint();
    assert.equal(clean.status, 0, `${clean.stdout}${clean.stderr}`);
    await mkdir(join(packages, name, 'src'), { recursive: true });
    await writeFile(join(packages, name, 'src/card.css'), '.card {\n  color: #fff;\n}\n');
    const { status, stdout, stderr } = runStylelint();
    assert.notEqual(status, 0, 'stylelint passed a literal color in packages/');
    assert.match(`${stdout}${stderr}`, new RegExp(`${name}/src/card\\.css`));
  } finally {
    await rm(join(packages, name), { recursive: true, force: true });
    if (!existed) await rmdir(packages).catch(() => {});
  }
});
