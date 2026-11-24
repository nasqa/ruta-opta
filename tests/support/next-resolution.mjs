import { registerHooks } from 'node:module';

// The app's TypeScript is resolved by Next's bundler: imports without extensions, JSON without import attributes, and
// next/* subpaths without an exports map. These hooks give plain Node the same resolution, so the tests run the real modules.
// The extension is read from the URL's pathname: a test may import a file with a query string to evaluate it again
const isTypeScript = (url) => url !== undefined && new URL(url).pathname.endsWith('.ts');
// The landing's @/* alias (apps/landing/tsconfig.json), for TypeScript files that import through it
const landingSource = new URL('../../apps/landing/src/', import.meta.url);

registerHooks({
  resolve: (specifier, context, nextResolve) => {
    if (/^next\/[\w-]+$/.test(specifier)) return nextResolve(`${specifier}.js`, context);
    if (specifier.startsWith('@/') && isTypeScript(context.parentURL)) {
      return { ...nextResolve(new URL(`${specifier.slice(2)}.ts`, landingSource).href, context), format: 'module-typescript' };
    }
    if (specifier.endsWith('.json')) return { ...nextResolve(specifier, context), importAttributes: { type: 'json' } };
    const extensionless = /^\.\.?\//.test(specifier) && !/\.\w+$/.test(specifier);
    const resolved = nextResolve(extensionless && isTypeScript(context.parentURL) ? `${specifier}.ts` : specifier, context);
    // apps/landing/package.json declares no "type", so name the format instead of letting Node guess and warn
    return isTypeScript(resolved.url) ? { ...resolved, format: 'module-typescript' } : resolved;
  },
});
