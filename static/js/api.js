/**
 * api.js — Axios instance configurada com:
 *   - Base URL automática (mesma origem, /api/v1)
 *   - Injeção automática do Bearer token
 *   - Refresh automático ao receber 401
 *   - Fila de requisições durante o refresh
 */

const API_PREFIX = '/api/v1';

const http = axios.create({
  baseURL: API_PREFIX,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

/* ── State para refresh ── */
let _isRefreshing = false;
let _refreshQueue = []; // [{resolve, reject}]

function _processQueue(error, token = null) {
  // Copia o array antes de iterar para evitar problemas se ele for modificado
  const queue = _refreshQueue.slice();
  _refreshQueue = [];
  queue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
}

/* ── Request interceptor: injeta token ── */
http.interceptors.request.use(
  (config) => {
    // Auth é carregado após api.js — acessamos via window para garantir
    const token = window.Auth?.getAccessToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/* ── Response interceptor: refresh automático ── */
http.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    // Não tenta refresh para rotas de auth
    const isAuthRoute = original.url.includes('/login') ||
                        original.url.includes('/register') ||
                        original.url.includes('/refresh');

    if (
      error.response?.status === 401 &&
      !original._retry &&
      !isAuthRoute
    ) {
      if (_isRefreshing) {
        // Coloca na fila enquanto refresh rola
        return new Promise((resolve, reject) => {
          _refreshQueue.push({ resolve, reject });
        }).then((newToken) => {
          original.headers['Authorization'] = `Bearer ${newToken}`;
          return http(original);
        });
      }

      original._retry = true;
      _isRefreshing = true;

      try {
        const refreshToken = window.Auth?.getRefreshToken();
        if (!refreshToken) throw new Error('No refresh token');

        const res = await axios.post(`${API_PREFIX}/refresh`, {
          refresh_token: refreshToken,
        });

        const { access_token, refresh_token } = res.data;
        window.Auth?.saveTokens(access_token, refresh_token);

        http.defaults.headers['Authorization'] = `Bearer ${access_token}`;
        original.headers['Authorization']       = `Bearer ${access_token}`;

        _processQueue(null, access_token);
        return http(original);

      } catch (refreshError) {
        _processQueue(refreshError, null);
        window.Auth?.clearSession();
        window.App?.goTo('auth');
        return Promise.reject(refreshError);
      } finally {
        _isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

/**
 * Extrai mensagem de erro de uma resposta Axios de forma consistente.
 * @param {any} err
 * @returns {string}
 */
function apiErrorMessage(err) {
  if (err.response?.data?.error) {
    const e = err.response.data.error;
    if (typeof e === 'string') return e;
    if (Array.isArray(e)) {
      return e.map((v) => `${v.loc?.join('.')}: ${v.msg}`).join('; ');
    }
  }
  if (err.message) return err.message;
  return 'Erro desconhecido';
}