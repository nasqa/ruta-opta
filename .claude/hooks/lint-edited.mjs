import { readFileSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import { ESLint } from 'eslint';
import stylelint from 'stylelint';

const root = resolve(import.meta.dirname, '../..');
const { tool_input } = JSON.parse(readFileSync(0, 'utf8'));
const file = tool_input?.file_path && relative(root, resolve(root, tool_input.file_path));

const inScope = file && /^(apps|packages)\//.test(file) && /\.(tsx?|css)$/.test(file);
if (!inScope) process.exit(0);

const eslintLines = async () => {
  const eslint = new ESLint({ cwd: root });
  if (await eslint.isPathIgnored(file)) return [];
  const [result] = await eslint.lintFiles([file]);
  return result.messages.map(({ line, ruleId, message }) => `${file}:${line} ${ruleId ?? 'parse-error'} ${message}`);
};

const stylelintLines = async () => {
  const { results } = await stylelint.lint({ files: file, cwd: root });
  return results.flatMap(({ warnings }) => warnings.map(({ line, rule, text }) => `${file}:${line} ${rule} ${text}`));
};

const lines = await (file.endsWith('.css') ? stylelintLines() : eslintLines());
if (lines.length === 0) process.exit(0);
console.error(lines.join('\n'));
process.exit(2);
