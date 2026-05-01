/**
 * Helpers for reading list/collection responses from the backend.
 *
 * The backend now returns paginated responses for list endpoints in the form:
 *
 *     { items: [...], total: 123, page: 1, limit: 50, has_more: true }
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
    };
  }
  const len = Array.isArray(data) ? data.length : 0;
  return { total: len, page: 1, limit: len, hasMore: false };
}
