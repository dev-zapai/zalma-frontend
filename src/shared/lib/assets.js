// Resolve a stored asset reference into a browser-loadable URL.
//
// Backend uploads return a RELATIVE, backend-proxied path such as
//   "/api/files/profile-photos/<tenant>/<user>/<uuid>.jpg"
// Dropped straight into an <img src>, the browser resolves that against the
// FRONTEND origin (which serves no such route), so the image silently 404s.
// axios avoids this for API calls by prefixing REACT_APP_BACKEND_URL; plain
// <img>/<a> tags don't go through axios, so we prepend it here instead.
//
// Values that are already loadable are passed through untouched:
//   - absolute URLs  (http(s)://… or protocol-relative //…) — legacy/full URLs
//   - data: URIs
//   - blob: URLs     — a just-picked local file previewed before upload
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

export function assetUrl(ref) {
  if (!ref || typeof ref !== 'string') return '';
  if (/^(https?:)?\/\//i.test(ref) || ref.startsWith('data:') || ref.startsWith('blob:')) {
    return ref;
  }
  // Backend-proxied relative path (e.g. "/api/files/…").
  if (ref.startsWith('/')) return `${BACKEND_URL}${ref}`;
  return ref;
}
