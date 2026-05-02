import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Returns the base URL for the public-facing site.
 *
 * Resolution order:
 *   1. REACT_APP_SITE_URL — explicit override (e.g. for SaaS multi-domain)
 *   2. window.location.origin — the normal case
 */
export function getSiteBaseUrl() {
  if (process.env.REACT_APP_SITE_URL) return process.env.REACT_APP_SITE_URL;
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const publicPath = (process.env.PUBLIC_URL || '').replace(/\/$/, '');
  return `${origin}${publicPath}`;
}

export function getTenantSiteUrl(slug) {
  return `${getSiteBaseUrl()}/s/${slug}`;
}
