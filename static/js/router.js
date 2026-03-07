/**
 * router.js — Hash-based SPA router
 *
 * Rotas suportadas:
 *   #/dashboard
 *   #/projects
 *   #/projects/:id
 *   (auth e org-setup são controladas diretamente pelo App)
 */

const Router = (() => {
  const routes = {};
  let _current = null;

  function on(path, handler) {
    routes[path] = handler;
  }

  function _parse(hash) {
    // Remove leading #/ or #
    const raw = (hash || '').replace(/^#\/?/, '') || 'dashboard';
    const parts = raw.split('/');
    return parts;
  }

  function _match(parts) {
    // Try exact match first
    const exact = parts.join('/');
    if (routes[exact]) return { handler: routes[exact], params: {} };

    // Try patterns
    for (const pattern in routes) {
      const patternParts = pattern.split('/');
      if (patternParts.length !== parts.length) continue;
      const params = {};
      let match = true;
      for (let i = 0; i < patternParts.length; i++) {
        if (patternParts[i].startsWith(':')) {
          params[patternParts[i].slice(1)] = parts[i];
        } else if (patternParts[i] !== parts[i]) {
          match = false;
          break;
        }
      }
      if (match) return { handler: routes[pattern], params };
    }
    return null;
  }

  function _resolve() {
    const parts = _parse(window.location.hash);
    const result = _match(parts);
    if (result) {
      _current = parts.join('/');
      result.handler(result.params);
    } else {
      // Default: dashboard
      navigate('dashboard');
    }
  }

  function navigate(path) {
    window.location.hash = '/' + path;
  }

  function start() {
    window.addEventListener('hashchange', _resolve);
    _resolve();
  }

  function current() { return _current; }

  return { on, navigate, start, current };
})();