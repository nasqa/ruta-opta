import { analyticsScript } from '@/modules/analytics/server';

// Plain tags, not next/script, which would add client code
export const AnalyticsScript = () => {
  const script = analyticsScript();
  if (!script) return null;

  return (
    <>
      <script async src={script.src} />
      <script dangerouslySetInnerHTML={{ __html: script.init }} />
    </>
  );
};
