// Turbopack emits an imported font file as a static asset, so the import returns its URL
declare module '*.woff2' {
  const url: string;
  export default url;
}
