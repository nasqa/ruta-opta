const originTagPattern = /^[a-z0-9-]{1,24}$/;

// The source of a tracked link, such as instagram in /es?utm_source=instagram: the same parameter the analytics tool reads, so one link
// names one origin in both. A server action posts to the page's own URL, so the Referer carries its query and the home stays static.
// Anything that is not a plain label is dropped: the signup goes on without one
export const readOriginTag = (referer: string | null | undefined) => {
  if (!referer || !URL.canParse(referer)) return undefined;
  const tag = new URL(referer).searchParams.get('utm_source')?.toLowerCase();
  return tag && originTagPattern.test(tag) ? tag : undefined;
};
