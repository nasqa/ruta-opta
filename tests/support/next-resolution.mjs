import { registerHooks } from 'node:module';

// The app's TypeScript is resolved by Next's bundler: imports without extensions, JSON without import attributes, and
// next/* subpaths without an exports map. These hooks give plain Node the same resolution, so the tests run the real modules.
registerHooks({
  resolve: (specifier, context, nextResolve) => {
    if (/^next\/[\w-]+$/.test(specifier)) return nextResolve(`${specifier}.js`, context);
    if (specifier.endsWith('.json')) return { ...nextResolve(specifier, context), importAttributes: { type: 'json' } };
    const extensionless = /^\.\.?\//.test(specifier) && !/\.\w+$/.test(specifier);
    const resolved = nextResolve(extensionless && context.parentURL?.endsWith('.ts') ? `${specifier}.ts` : specifier, context);
    // apps/landing/package.json declares no "type", so name the format instead of letting Node guess and warn
    return resolved.url.endsWith('.ts') ? { ...resolved, format: 'module-typescript' } : resolved;
  },
});
