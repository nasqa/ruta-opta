import { fileURLToPath } from 'node:url';

// The theme's custom properties: CSS may read only what these declare
const themeFiles = [
  '@nasqa/trama-theme-opta/tokens.css',
  '@nasqa/trama-theme-opta/type.css',
  '@nasqa/trama-react/system.css',
  '@mantine/core/styles.css',
].map((specifier) => fileURLToPath(import.meta.resolve(specifier)));

const stylelintConfig = {
  referenceFiles: themeFiles,
  ignoreFiles: ['**/.next/**', '**/out/**', '**/playwright-report/**', '**/test-results/**', '**/.lighthouseci/**'],
  rules: {
    'no-unknown-custom-properties': true,
    'value-type-custom-property-required-list': [
      ['color', 'length'],
      { ignoreValues: ['0', 'transparent', '/^currentcolor$/i'] },
    ],
    // Both rules above let a literal through: as a var() fallback, or as a custom property defined here
    'declaration-property-value-disallowed-list': [
      { '/.*/': ['/var\\(\\s*--[^,)]+,/'] },
      { message: 'No var() fallback: a literal there skips the theme. Read a token the theme declares, with no fallback.' },
    ],
    'property-disallowed-list': [
      ['/^--/'],
      { message: 'Custom properties come from the theme: read its tokens with var(--…) instead of defining one here.' },
    ],
  },
};

export default stylelintConfig;
