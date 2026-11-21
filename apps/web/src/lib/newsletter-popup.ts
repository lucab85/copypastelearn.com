/**
 * Pages where the newsletter popup stays closed: a lesson being watched, and
 * every step between deciding to pay and having paid.
 */
const QUIET = [
  /^\/courses\/[^/]+\/lessons\//,
  /^\/(pricing|checkout|sign-in|sign-up|dashboard|settings|labs|admin)(\/|$)/,
];

export function newsletterPopupAllowed(pathname: string | null): boolean {
  if (!pathname) return false;
  return !QUIET.some((quiet) => quiet.test(pathname));
}

/**
 * How long to wait on the current page: `delayMs` after arriving on the site,
 * but never sooner than `minOnPageMs` after a navigation.
 */
export function newsletterPopupDelay(msOnSite: number, delayMs: number, minOnPageMs: number): number {
  return Math.max(delayMs - msOnSite, minOnPageMs);
}
