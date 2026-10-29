// No unit test may reach the network: a test that forgets to mock
// '@/shared/lib/api' fails here instead of calling the backend (and, through
// it, the live tables). See backend-grooming/bugs/2026-10-28/tests_wrote_to_live_dynamodb.md.
const refuse = (what) => new Error(`unit test tried to reach the network (${what}); mock '@/shared/lib/api'`);

window.XMLHttpRequest.prototype.open = function open(method, url) {
  throw refuse(`${method} ${url}`);
};
global.fetch = (url) => Promise.reject(refuse(`fetch ${url}`));
