/**
 * Helpers for reading list/collection responses from the backend.
 *
 * The backend now returns paginated responses for list endpoints in the form:
 *
 *     { items: [...], limit: 20, has_more: true, next_cursor: '...' }   (cursor lists)
 *     { items: [...], total: 123, page: 1, limit: 50, has_more: true }   (older endpoints)
 *
 * Some legacy endpoints (and external APIs) still return bare arrays. These
 * helpers normalise both shapes so frontend code can stay simple.
 */

/**
 * Extract the items array from any of:
 *   - bare array `[...]`
 *   - paginated envelope `{ items: [...], ... }`
 *   - null / undefined / unknown shape → returns []
 */
export function listItems(data) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.items)) return data.items;
  return [];
}

/**
 * Extract pagination metadata. Returns sensible defaults for bare arrays
 * so callers can render pagination UI without branching.
 */
export function listMeta(data) {
  if (data && typeof data === 'object' && !Array.isArray(data) && 'items' in data) {
    return {
      total: data.total ?? data.items.length ?? 0,
      page: data.page ?? 1,
      limit: data.limit ?? data.items.length ?? 0,
      hasMore: data.has_more ?? false,
      // Cursor contract (fix 01): pass back as ?cursor= for the next page.
      nextCursor: data.next_cursor ?? null,
    };
  }
  const len = Array.isArray(data) ? data.length : 0;
  return { total: len, page: 1, limit: len, hasMore: false, nextCursor: null };
}


/**
 * Fetch every page of a cursor list (fix 01). For grid views that must show
 * the whole window (calendar week, availability day). Follows `next_cursor`
 * until `has_more` is false or `maxRows` is reached, in which case
 * `truncated` is true so the view can warn. Legacy shapes (bare array,
 * envelope without cursors) are returned after one call.
 */
export async function fetchAllPages(api, url, params = {}, { maxRows = 500 } = {}) {
  const items = [];
  let cursor = null;
  for (;;) {
    const res = await api.get(url, { params: cursor ? { ...params, cursor } : { ...params } });
    const page = listItems(res.data);
    items.push(...page);
    const meta = listMeta(res.data);
    if (!meta.hasMore || !meta.nextCursor) return { items, truncated: false };
    if (items.length >= maxRows) return { items: items.slice(0, maxRows), truncated: true };
    cursor = meta.nextCursor;
  }
}
