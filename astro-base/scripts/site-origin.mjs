export function siteOrigin(env = process.env) {
  const value =
    env.SITE_URL ||
    (env.CF_PAGES_BRANCH === 'main'
      ? 'https://yelihi.pages.dev'
      : env.CF_PAGES_URL) ||
    'http://localhost:4321';
  const url = new URL(value);
  if (
    !['https:', 'http:'].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.pathname !== '/' ||
    url.search ||
    url.hash
  )
    throw new Error('SITE_URL / CF_PAGES_URL must be an HTTP(S) origin');
  if (
    url.protocol !== 'https:' &&
    !['localhost', '127.0.0.1'].includes(url.hostname)
  )
    throw new Error('Production site origin must use HTTPS');
  return url.origin;
}
