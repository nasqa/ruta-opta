import { createRequire } from 'node:module';
import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import boundaries from 'eslint-plugin-boundaries';
import checkFile from 'eslint-plugin-check-file';

const require = createRequire(import.meta.url);
const root = import.meta.dirname;

// The repo allows only error or off; Next's presets leave some rules at warn
const warnToError = (configs) =>
  configs.map((config) =>
    !config.rules
      ? config
      : {
          ...config,
          rules: Object.fromEntries(
            Object.entries(config.rules).map(([ruleId, value]) => {
              const [severity, ...options] = [value].flat();
              return [ruleId, [1, 'warn'].includes(severity) ? ['error', ...options] : value];
            }),
          ),
        },
  );

// D1: the architecture table, as boundaries policies (the last matching policy wins)
const moduleEntries = ['index.ts', 'server.ts', 'actions.ts'];
const sameApp = { app: '{{ from.element.captured.app }}' };
const toApp = (type, selector = {}) => ({ to: { element: { type, captured: sameApp, ...selector } } });
const toPackage = { to: { element: { type: 'package' } } };

const boundariesConfig = {
  files: ['apps/*/src/**/*.{ts,tsx}', 'packages/*/**/*.{ts,tsx,mts,cts,js,jsx,mjs,cjs}'],
  plugins: { boundaries },
  settings: {
    'boundaries/root-path': root,
    'boundaries/elements': [
      { type: 'route', pattern: 'apps/*/src/app', capture: ['app'], partialMatch: false },
      { type: 'module', pattern: 'apps/*/src/modules/*', capture: ['app', 'name'], partialMatch: false },
      { type: 'shared', pattern: 'apps/*/src/shared', capture: ['app'], partialMatch: false },
      { type: 'i18n', pattern: 'apps/*/src/i18n', capture: ['app'], partialMatch: false },
      { type: 'messages', pattern: 'apps/*/messages', capture: ['app'], partialMatch: false },
      { type: 'package', pattern: 'packages/*', capture: ['name'], partialMatch: false },
    ],
    // A single file is not an element in boundaries v7, so the proxy is a file category
    'boundaries/files': [{ category: 'proxy', pattern: 'apps/*/src/proxy.ts', capture: ['app'] }],
    'import/resolver': {
      [require.resolve('eslint-import-resolver-typescript')]: {
        alwaysTryTypes: true,
        project: [`${root}/apps/*/tsconfig.json`, `${root}/packages/*/tsconfig.json`],
        noWarnOnMultipleProjects: true,
      },
    },
  },
  rules: {
    'boundaries/no-unknown-files': 'error',
    'boundaries/dependencies': [
      'error',
      {
        default: 'disallow',
        checkUnknownLocals: true,
        policies: [
          { from: { element: { type: 'route' } }, allow: [toApp('shared'), toApp('i18n'), toPackage] },
          {
            from: { element: { type: 'route' } },
            disallow: toApp('module'),
            message: 'Import a module only through index.ts, server.ts or actions.ts.',
          },
          { from: { element: { type: 'route' } }, allow: toApp('module', { fileInternalPath: moduleEntries }) },
          { from: { element: { type: 'module' } }, allow: [toApp('shared'), toApp('i18n'), toPackage] },
          {
            from: { element: { type: 'module' } },
            disallow: toApp('module'),
            message:
              'A module does not import another module ({{to.element.captured.name}}). Compose them in the route, or ask to move the shared code.',
          },
          { from: { element: { type: 'shared' } }, allow: toApp('i18n') },
          {
            from: { element: { type: 'shared' } },
            disallow: toApp('module'),
            message: 'shared knows no domains: move this code into the module that uses it.',
          },
          { from: { element: { type: 'i18n' } }, allow: toApp('messages') },
          {
            from: { file: { categories: 'proxy' } },
            allow: { to: { element: { type: 'i18n', captured: { app: '{{ from.file.captured.app }}' } } } },
          },
          // Any package: "declared in its package.json" is dependency-cruiser's npm-no-pkg once the first package exists (see docs/decisions)
          { from: { element: { type: 'package' } }, allow: toPackage },
        ],
      },
    ],
  },
};

const keepLocale = 'Use Link, redirect, useRouter and usePathname from @/i18n/navigation to keep the locale.';

// jsx-no-literals ignores props, so these text props get their own check; alt="" (decorative) stays allowed
const textProp = 'JSXAttribute[name.name=/^(alt|title|placeholder|aria-label|aria-description)$/]';
const textFromMessages = [
  `${textProp} > Literal[value=/\\S/]`,
  `${textProp} > JSXExpressionContainer > Literal[value=/\\S/]`,
  `${textProp} > JSXExpressionContainer > TemplateLiteral > TemplateElement[value.raw=/\\S/]`,
].map((selector) => ({ selector, message: "Accessible and visible text comes from messages: use t('…')." }));

const eslintConfig = defineConfig([
  globalIgnores(['**/.next/**', '**/out/**', '**/next-env.d.ts', '**/playwright-report/**', '**/.lighthouseci/**']),
  ...warnToError(nextVitals),
  ...warnToError(nextTs),
  {
    linterOptions: { reportUnusedDisableDirectives: 'error' },
    // Absolute: Next resolves rootDir against process.cwd(), not this file
    settings: { next: { rootDir: `${root}/apps/*/` } },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/ban-ts-comment': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
    },
  },
  boundariesConfig,
  // D6: links and redirects keep the locale only through next-intl's navigation
  {
    files: ['apps/*/src/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            { name: 'next/link', message: keepLocale },
            { name: 'next/navigation', importNames: ['redirect', 'useRouter', 'usePathname'], message: keepLocale },
          ],
        },
      ],
    },
  },
  { files: ['apps/*/src/i18n/navigation.ts'], rules: { 'no-restricted-imports': 'off' } },
  // D6: visible text comes from messages; D1: styles come from CSS that reads theme variables
  {
    files: ['apps/*/src/**/*.tsx'],
    rules: {
      'react/jsx-no-literals': ['error', { noStrings: true, ignoreProps: true }],
      'no-restricted-syntax': ['error', ...textFromMessages],
      'react/forbid-dom-props': [
        'error',
        {
          forbid: [
            {
              propName: 'style',
              message: 'No inline style: style it in a CSS module that reads theme variables.',
            },
          ],
        },
      ],
    },
  },
  // CSS is not JavaScript: check-file's processor hands ESLint an empty block so the file name still gets checked
  {
    files: ['apps/*/src/**/*.css'],
    plugins: { 'check-file': checkFile },
    processor: 'check-file/eslint-processor-check-file',
  },
  {
    files: ['apps/*/src/**/*.{ts,tsx,css}'],
    plugins: { 'check-file': checkFile },
    rules: {
      'check-file/filename-naming-convention': [
        'error',
        { 'apps/*/src/**/*.{ts,tsx,css}': 'KEBAB_CASE' },
        {
          ignoreMiddleExtensions: true,
          errorMessage: 'File names are kebab-case: rename "{{ target }}" to lowercase words joined by hyphens.',
        },
      ],
      // Route folders may also use Next's forms: [locale], [...rest], (site), _components
      'check-file/folder-naming-convention': [
        'error',
        { 'apps/*/src/app/**/': 'NEXT_JS_APP_ROUTER_CASE', 'apps/*/src/!(app)/**/': 'KEBAB_CASE' },
        {
          errorMessage:
            'Folder names are kebab-case (route folders may also use [param], (group) and _private): rename "{{ target }}".',
        },
      ],
    },
  },
]);

export default eslintConfig;
