/**
 * auth.js — Gerenciamento de sessão e chamadas de autenticação
 *
 * Tokens são guardados em localStorage.
 * O módulo Auth é usado tanto pelo api.js (interceptors) quanto
 * pelo app.js (verificação de sessão na inicialização).
 */

const Auth = (() => {
  const KEYS = {
    ACCESS:  'tf_access',
    REFRESH: 'tf_refresh',
    USER:    'tf_user',
  };

  /* ── Token storage ── */

  function saveTokens(accessToken, refreshToken) {
    localStorage.setItem(KEYS.ACCESS,  accessToken);
    if (refreshToken) {
      localStorage.setItem(KEYS.REFRESH, refreshToken);
    }
  }

  function saveUser(user) {
    localStorage.setItem(KEYS.USER, JSON.stringify(user));
  }

  function getAccessToken()  { return localStorage.getItem(KEYS.ACCESS); }
  function getRefreshToken() { return localStorage.getItem(KEYS.REFRESH); }

  function getUser() {
    try {
      return JSON.parse(localStorage.getItem(KEYS.USER));
    } catch {
      return null;
    }
  }

  function clearSession() {
    localStorage.removeItem(KEYS.ACCESS);
    localStorage.removeItem(KEYS.REFRESH);
    localStorage.removeItem(KEYS.USER);
  }

  function isAuthenticated() {
    return !!getAccessToken() && !!getUser();
  }

  /* ── API calls ── */

  async function register(name, email, password) {
    const res = await http.post('/register', { name, email, password });
    return res.data;
  }

  async function login(email, password) {
    // Login não usa o interceptor (ainda não há token)
    const res = await axios.post(`${API_PREFIX}/login`, { email, password });
    const { access_token, refresh_token, user } = res.data;
    saveTokens(access_token, refresh_token);
    saveUser(user);
    return user;
  }

  async function logout() {
    const refreshToken = getRefreshToken();
    try {
      if (refreshToken) {
        await http.post('/logout', { refresh_token: refreshToken });
      }
    } catch {
      // ignora erros no logout
    } finally {
      clearSession();
    }
  }

  /**
   * Atualiza o objeto user em cache com novos dados
   * (ex: após criar/entrar em organização)
   */
  function patchUser(partial) {
    const current = getUser() || {};
    const updated = { ...current, ...partial };
    saveUser(updated);
    return updated;
  }

  return {
    saveTokens,
    saveUser,
    patchUser,
    getAccessToken,
    getRefreshToken,
    getUser,
    clearSession,
    isAuthenticated,
    register,
    login,
    logout,
  };
})();