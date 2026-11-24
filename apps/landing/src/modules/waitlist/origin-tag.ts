const originTagPattern = /^[a-z0-9-]{1,24}$/;

// The campaign label of a tracked link, such as ig in /es?o=ig. A server action posts to the page's own URL, so the Referer carries its query
// and the home stays static. Anything that is not a plain label is dropped: the signup goes on without one
export const readOriginTag = (referer: string | null | undefined) => {
  if (!referer || !URL.canParse(referer)) return undefined;
  const tag = new URL(referer).searchParams.get('o')?.toLowerCase();
  return tag && originTagPattern.test(tag) ? tag : undefined;
};
