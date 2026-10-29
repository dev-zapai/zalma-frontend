import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * Cursor paging state for list pages (fix 01).
 *
 * The backend returns `next_cursor`; the page keeps the cursor it is showing,
 * a stack of the cursors it came from (so Previous works without a server
 * round trip), and mirrors the current cursor into the URL so a refresh or
 * the back button restores the page. Any change of `filterKey` (filters,
 * sort, page size) resets to page 1.
 *
 * A cursor restored from the URL has no history, so it is shown as page 2
 * and Previous returns to page 1.
 */
export function useCursorPager({ filterKey }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const initial = searchParams.get('cursor') || null;
  const [cursor, setCursor] = useState(initial);
  const [history, setHistory] = useState([]);
  const [base, setBase] = useState(initial ? 2 : 1);
  const lastKey = useRef(filterKey);

  const write = useCallback((c) => {
    const next = new URLSearchParams(searchParams);
    if (c) next.set('cursor', c); else next.delete('cursor');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  const reset = useCallback(() => {
    setHistory([]); setCursor(null); setBase(1); write(null);
  }, [write]);

  useEffect(() => {
    if (lastKey.current !== filterKey) {
      lastKey.current = filterKey;
      reset();
    }
  }, [filterKey, reset]);

  const next = useCallback((nextCursor) => {
    if (!nextCursor) return;
    setHistory(h => [...h, cursor]);
    setCursor(nextCursor);
    write(nextCursor);
  }, [cursor, write]);

  const prev = useCallback(() => {
    if (history.length) {
      const h = history.slice();
      const c = h.pop();
      setHistory(h); setCursor(c); write(c);
    } else if (cursor) {
      setCursor(null); setBase(1); write(null);
    }
  }, [history, cursor, write]);

  // In the render where the filters changed, the old cursor already belongs to
  // another query: report none, so the page's fetch asks for page 1 at once
  // instead of sending the stale cursor (bug stale_cursor_in_url_after_filter_change).
  const stale = lastKey.current !== filterKey;
  return {
    cursor: stale ? null : cursor,
    pageNumber: stale ? 1 : base + history.length,
    canPrev: !stale && (history.length > 0 || cursor !== null),
    next,
    prev,
    reset,
  };
}
