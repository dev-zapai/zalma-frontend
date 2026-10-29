// A tiny stand-in for react-router-dom (v7 does not resolve under CRA jest).
// Behaves like the real hook where it matters: setSearchParams(obj) replaces
// the whole query string, the last call wins, and its identity changes
// whenever the URL changes (v7 useCallback deps [navigate, searchParams]).
const React = require('react');

const store = { url: '', subs: new Set(), cache: new Map(), navs: [], params: {} };

function current() {
  let sp = store.cache.get(store.url);
  if (!sp) { sp = new URLSearchParams(store.url); store.cache.set(store.url, sp); }
  return sp;
}

function useSearchParams() {
  const [, force] = React.useState(0);
  React.useEffect(() => {
    const f = () => force(x => x + 1);
    store.subs.add(f);
    return () => store.subs.delete(f);
  }, []);
  const sp = current();
  const set = React.useCallback((p) => {
    store.url = new URLSearchParams(typeof p === 'function' ? p(new URLSearchParams(store.url)) : p).toString();
    store.subs.forEach(f => f());
  }, [sp]); // eslint-disable-line react-hooks/exhaustive-deps
  return [sp, set];
}

function reset(url = '', params = {}) {
  store.url = url; store.cache = new Map(); store.navs = []; store.params = params;
}

module.exports = {
  useSearchParams,
  useNavigate: () => (to) => store.navs.push(to),
  useParams: () => store.params,
  __store: store,
  __reset: reset,
};
