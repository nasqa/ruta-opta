// CI installs @nasqa/trama-react and @nasqa/trama-theme-opta from GitHub Packages with the workflow's GITHUB_TOKEN. Until the owner grants this
// repository read access to each package, `npm ci` fails with a bare 404 that names no one; this step runs first and says what to do. The line
// goes to a public CI log and fetch's own error can quote the header it refused (Node puts the whole `Bearer <token>`, trimmed, in it), so
// nothing fetch says is ever printed: only this script's own messages are
export const PACKAGES = ['trama-react', 'trama-theme-opta'];

const denied = (name, status) => `nasqa/ruta-opta cannot read @nasqa/${name} on GitHub Packages (HTTP ${status}). The owner grants it once: github.com/orgs/nasqa/packages → ${name} → Package settings → Manage Actions access → Add repository → nasqa/ruta-opta (Read). Then re-run this workflow.`;

export const checkRegistryAccess = async ({ token, get = fetch }) => {
  if (!token) throw new Error('NASQA_PACKAGES_TOKEN is empty: the workflow sets it from GITHUB_TOKEN (.github/workflows/check.yml).');
  for (const name of PACKAGES) {
    const { status, ok } = await get(`https://npm.pkg.github.com/@nasqa%2f${name}`, { headers: { Authorization: `Bearer ${token}` } })
      .catch(() => { throw new Error('Could not reach npm.pkg.github.com: the request failed before an answer (no network, or a malformed token). Check NASQA_PACKAGES_TOKEN.'); });
    if ([401, 403, 404].includes(status)) throw new Error(denied(name, status));
    if (!ok) throw new Error(`npm.pkg.github.com answered HTTP ${status} for @nasqa/${name}.`);
  }
};

if (import.meta.main) {
  try {
    await checkRegistryAccess({ token: process.env.NASQA_PACKAGES_TOKEN });
    console.log(`GitHub Packages: ${PACKAGES.map((name) => `@nasqa/${name}`).join(' and ')} are readable`);
  } catch (error) {
    console.log(`::error::${error.message}`);
    process.exit(1);
  }
}
