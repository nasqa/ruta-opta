import { notFound } from 'next/navigation';

// Unknown paths under a locale render [locale]/not-found.tsx inside the localized layout
const CatchAllPage = () => notFound();

export default CatchAllPage;
