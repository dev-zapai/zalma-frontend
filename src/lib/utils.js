import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Returns the base URL for the public-facing site, INCLUDING the app's
 * public path prefix (e.g. "/zalma" in production where the CRA is built
 * with `homepage: "/zalma"`). This is what should be shown to the user
 * and used in `<a href>` to actual public pages — anything that strips
 * the prefix (like the previous version) will 404 in production because
 * the salon routes live under `${origin}${PUBLIC_URL}/s/:slug`.
 *
 * Resolution order:
 *   1. REACT_APP_SITE_URL — explicit override (e.g. for SaaS multi-domain)
 *   2. window.location.origin + PUBLIC_URL — the normal case
 */
export function getSiteBaseUrl() {
  if (process.env.REACT_APP_SITE_URL) return process.env.REACT_APP_SITE_URL;
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  // PUBLIC_URL is "" in dev (npm start) and "/zalma" in the production build.
  // Strip a trailing slash so we don't end up with double-slashes downstream.
  const publicPath = (process.env.PUBLIC_URL || '').replace(/\/$/, '');
  return `${origin}${publicPath}`;
}

/**
 * Returns the full public URL for a tenant's website. Use this instead of
 * hard-coding `/s/${slug}` so the URL works under both `/` (dev) and
 * `/zalma` (prod) paths.
 */
export function getTenantSiteUrl(slug) {
  return `${getSiteBaseUrl()}/s/${slug}`;
}
