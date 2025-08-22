// src/lib/patchFetch.ts
const getCookie = (name) =>
  document.cookie.split('; ')
    .find(c => c.startsWith(name + '='))?.split('=')[1] || '';

const _fetch = window.fetch.bind(window);
window.fetch = (input, init = {}) => {
  const csrf = getCookie('X-CSRF-Token');

  const method = (init.method || 'GET').toUpperCase();
  const needsCsrf = !['GET','HEAD','OPTIONS'].includes(method);

  const headers = new Headers(init.headers || {});
  if (needsCsrf && !headers.has('X-CSRF-Token')) {
    headers.set('X-CSRF-Token', csrf);
  }
  if (!headers.has('Content-Type') && init.body && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  return _fetch(input, {
    credentials: 'include',
    ...init,
    headers
  });
};
