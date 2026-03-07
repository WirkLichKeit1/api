/**
 * ui.js — Componentes de UI programáticos
 *   Toast, Modal genérico, Confirm dialog, Drawer de tarefa
 *   Helpers de render (badges, datas, avatares)
 */

/* ════════════════════════════════════════
   ICONS — SVG inline snippets (15×15)
════════════════════════════════════════ */
const Icon = {
  check:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
  x:        `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
  plus:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
  edit:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
  trash:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>`,
  folder:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`,
  task:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>`,
  home:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
  logout:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`,
  org:      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  calendar: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
  comment:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
  chevronL: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>`,
  chevronR: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>`,
  warn:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
  info:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,
  arrowBack:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>`,
  settings: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
};

function iconEl(name, size = 15) {
  const wrapper = document.createElement('span');
  wrapper.innerHTML = Icon[name] || '';
  const svg = wrapper.querySelector('svg');
  if (svg) { svg.style.width = size + 'px'; svg.style.height = size + 'px'; }
  return wrapper.firstChild;
}

/* ════════════════════════════════════════
   TOAST
════════════════════════════════════════ */
const Toast = (() => {
  let container;

  function _getContainer() {
    if (!container) {
      container = document.getElementById('toast-container');
    }
    return container;
  }

  function _iconForType(type) {
    const map = { success: 'check', error: 'x', info: 'info', warning: 'warn' };
    return map[type] || 'info';
  }

  function show(message, type = 'info', duration = 3500) {
    const c = _getContainer();
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;

    const iconSpan = document.createElement('span');
    iconSpan.className = 'toast__icon';
    iconSpan.appendChild(iconEl(_iconForType(type), 15));

    const text = document.createElement('span');
    text.textContent = message;

    el.appendChild(iconSpan);
    el.appendChild(text);
    c.appendChild(el);

    setTimeout(() => {
      el.style.animation = 'fadeIn .3s ease reverse both';
      setTimeout(() => el.remove(), 280);
    }, duration);
  }

  const success = (msg, d) => show(msg, 'success', d);
  const error   = (msg, d) => show(msg, 'error',   d);
  const info    = (msg, d) => show(msg, 'info',     d);
  const warning = (msg, d) => show(msg, 'warning',  d);

  return { show, success, error, info, warning };
})();

/* ════════════════════════════════════════
   MODAL (genérico programático)
════════════════════════════════════════ */
const Modal = (() => {
  let _overlay = null;
  let _escHandler = null; // FIX: guarda referência para remover corretamente

  function _close() {
    if (_escHandler) {
      document.removeEventListener('keydown', _escHandler);
      _escHandler = null;
    }
    if (_overlay) {
      _overlay.remove();
      _overlay = null;
    }
  }

  /**
   * Abre um modal.
   * @param {Object} opts
   *   title        {string}
   *   size         {'sm'|'md'|'lg'} default 'md'
   *   bodyHTML     {string}  HTML do corpo
   *   footerHTML   {string}  HTML do footer (botões)
   *   onAfterOpen  {Function} callback após abrir
   */
  function open({ title, size = 'md', bodyHTML = '', footerHTML = '', onAfterOpen } = {}) {
    _close(); // Fecha modal anterior e remove listener ESC pendente

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';

    const sizeClass = size === 'lg' ? 'modal-lg' : size === 'sm' ? '' : 'modal-md';

    overlay.innerHTML = `
      <div class="modal ${sizeClass}" role="dialog" aria-modal="true">
        <div class="modal-header">
          <h2>${title || ''}</h2>
          <button class="btn-icon" data-close aria-label="Fechar">
            ${Icon.x}
          </button>
        </div>
        <div class="modal-body">${bodyHTML}</div>
        ${footerHTML ? `<div class="modal-footer">${footerHTML}</div>` : ''}
      </div>
    `;

    overlay.querySelectorAll('[data-close] svg').forEach(s => {
      s.style.width = '16px'; s.style.height = '16px';
    });

    // FIX: todos os caminhos de fechar chamam _close(), que remove o listener ESC
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) _close();
    });

    overlay.querySelector('[data-close]').addEventListener('click', _close);

    // FIX: guarda referência do handler para poder remover em qualquer caminho de fechamento
    _escHandler = (e) => { if (e.key === 'Escape') _close(); };
    document.addEventListener('keydown', _escHandler);

    document.body.appendChild(overlay);
    _overlay = overlay;

    if (onAfterOpen) onAfterOpen(overlay);

    return overlay;
  }

  function close() { _close(); }

  function getOverlay() { return _overlay; }

  return { open, close, getOverlay };
})();

/* ════════════════════════════════════════
   CONFIRM DIALOG
════════════════════════════════════════ */
/**
 * Exibe um diálogo de confirmação.
 * @param {Object} opts - { title, message, confirmLabel, danger }
 * @returns {Promise<boolean>}
 */
function confirmDialog({ title = 'Confirmar', message, confirmLabel = 'Confirmar', danger = false } = {}) {
  return new Promise((resolve) => {
    Modal.open({
      title,
      size: 'sm',
      bodyHTML: `<p class="confirm-dialog__message">${message || ''}</p>`,
      footerHTML: `
        <button class="btn btn-ghost btn-sm" data-action="cancel">Cancelar</button>
        <button class="btn ${danger ? 'btn-danger' : 'btn-primary'} btn-sm" data-action="confirm">${confirmLabel}</button>
      `,
      onAfterOpen(overlay) {
        overlay.querySelector('[data-action="cancel"]').addEventListener('click', () => {
          Modal.close();
          resolve(false);
        });
        overlay.querySelector('[data-action="confirm"]').addEventListener('click', () => {
          Modal.close();
          resolve(true);
        });
      },
    });
  });
}

/* ════════════════════════════════════════
   DRAWER — Task Detail
════════════════════════════════════════ */
const Drawer = (() => {
  let _overlay = null;
  let _drawer  = null;

  function _close() {
    if (_overlay) { _overlay.remove(); _overlay = null; }
    if (_drawer)  { _drawer.remove();  _drawer  = null; }
  }

  function open(taskData, projectId, onStatusChange) {
    _close();

    const user = Auth.getUser();

    // Overlay
    const overlay = document.createElement('div');
    overlay.className = 'drawer-overlay';
    overlay.addEventListener('click', _close);

    // Drawer
    const drawer = document.createElement('div');
    drawer.className = 'drawer';
    drawer.setAttribute('role', 'complementary');

    // FIX: guarda projectId e taskId no elemento imediatamente, antes de qualquer async
    drawer.dataset.projectId = projectId;
    drawer.dataset.taskId    = taskData.id;

    drawer.innerHTML = _buildDrawerHTML(taskData, projectId, user);

    document.body.appendChild(overlay);
    document.body.appendChild(drawer);
    _overlay = overlay;
    _drawer  = drawer;

    // ESC
    const onKey = (e) => { if (e.key === 'Escape') { _close(); document.removeEventListener('keydown', onKey); } };
    document.addEventListener('keydown', onKey);

    // Wire up events
    drawer.querySelector('[data-close-drawer]').addEventListener('click', _close);

    // Status pills
    drawer.querySelectorAll('.status-pill').forEach((pill) => {
      pill.addEventListener('click', async () => {
        const newStatus = pill.dataset.status;
        if (newStatus === taskData.status) return;
        try {
          const updated = await TasksAPI.update(projectId, taskData.id, { status: newStatus });
          taskData.status = updated.status;
          drawer.querySelectorAll('.status-pill').forEach(p => {
            p.className = `status-pill${p.dataset.status === updated.status ? ` active-${updated.status}` : ''}`;
          });
          const statusBadge = drawer.querySelector('[data-status-badge]');
          if (statusBadge) statusBadge.outerHTML = Render.statusBadge(updated.status, true);
          Toast.success('Status atualizado');
          if (onStatusChange) onStatusChange(updated);
        } catch (e) {
          Toast.error(apiErrorMessage(e));
        }
      });
    });

    // Load comments
    _loadComments(drawer, projectId, taskData.id, user);

    // Comment submit
    const commentInput = drawer.querySelector('[data-comment-input]');
    const commentBtn   = drawer.querySelector('[data-comment-submit]');

    async function submitComment() {
      const content = commentInput.value.trim();
      if (!content) return;
      commentBtn.disabled = true;
      try {
        const newComment = await CommentsAPI.create(projectId, taskData.id, content);
        commentInput.value = '';
        _prependComment(drawer, newComment, user);
      } catch (e) {
        Toast.error(apiErrorMessage(e));
      } finally {
        commentBtn.disabled = false;
      }
    }

    commentBtn.addEventListener('click', submitComment);
    commentInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        submitComment();
      }
    });
  }

  function _buildDrawerHTML(task, projectId, user) {
    const deadline = task.deadline
      ? Render.deadline(task.deadline)
      : '<span class="drawer-section__value empty">—</span>';

    const desc = task.description
      ? `<p class="task-detail-description">${escHtml(task.description)}</p>`
      : '<span class="drawer-section__value empty">Sem descrição</span>';

    const statusPills = ['todo', 'doing', 'done'].map((s) => `
      <button class="status-pill${task.status === s ? ` active-${s}` : ''}" data-status="${s}">${s}</button>
    `).join('');

    return `
      <div class="drawer-header">
        <div class="drawer-header__top">
          <h3 class="drawer-header__title">${escHtml(task.title)}</h3>
          <button class="btn-icon" data-close-drawer aria-label="Fechar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div class="drawer-header__badges">
          <span data-status-badge>${Render.statusBadge(task.status)}</span>
          ${Render.priorityBadge(task.priority)}
        </div>
      </div>

      <div class="drawer-body">

        <div>
          <div class="drawer-section__label">Status rápido</div>
          <div class="status-pills">${statusPills}</div>
        </div>

        <div class="task-detail-meta">
          <div>
            <div class="drawer-section__label">Prazo</div>
            ${deadline}
          </div>
          <div>
            <div class="drawer-section__label">Atribuído a</div>
            <span class="drawer-section__value">${task.assigned_to ? `#${task.assigned_to}` : '—'}</span>
          </div>
          <div>
            <div class="drawer-section__label">Criado em</div>
            <span class="drawer-section__value">${Render.date(task.created_at)}</span>
          </div>
          <div>
            <div class="drawer-section__label">ID</div>
            <span class="drawer-section__value text-mono text-xs">#${task.id}</span>
          </div>
        </div>

        <div>
          <div class="drawer-section__label">Descrição</div>
          ${desc}
        </div>

        <div>
          <div class="drawer-section__label" style="margin-bottom:12px;">Comentários</div>
          <div data-comment-list class="comment-list">
            <div class="loading-center"><div class="spinner spinner-sm"></div></div>
          </div>

          <div class="comment-form" style="margin-top:14px;">
            <textarea
              class="input"
              placeholder="Adicionar comentário… (Enter para enviar)"
              data-comment-input
              rows="2"
            ></textarea>
            <button class="btn btn-primary btn-sm" data-comment-submit>Enviar</button>
          </div>
        </div>
      </div>
    `;
  }

  async function _loadComments(drawer, projectId, taskId, user) {
    const list = drawer.querySelector('[data-comment-list]');
    try {
      const comments = await CommentsAPI.list(projectId, taskId);
      if (!comments.length) {
        list.innerHTML = `
          <div class="empty-state" style="padding:24px 0;">
            <p class="empty-state__desc">Nenhum comentário ainda.</p>
          </div>`;
        return;
      }
      list.innerHTML = '';
      comments.forEach((c) => _appendComment(list, c, user));
    } catch {
      list.innerHTML = `<p class="text-muted text-sm">Erro ao carregar comentários.</p>`;
    }
  }

  function _buildCommentHTML(c, user) {
    const isOwn = c.user_id === user?.id;
    return `
      <div class="comment" data-comment-id="${c.id}">
        <div class="comment-header">
          <span class="comment-author">user#${c.user_id}</span>
          <div style="display:flex;align-items:center;gap:6px;">
            <span class="comment-date">${Render.relativeDate(c.created_at)}</span>
            ${isOwn ? `<button class="btn-icon" data-delete-comment="${c.id}" title="Excluir">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
            </button>` : ''}
          </div>
        </div>
        <p class="comment-body">${escHtml(c.content)}</p>
      </div>
    `;
  }

  function _appendComment(list, c, user) {
    list.insertAdjacentHTML('beforeend', _buildCommentHTML(c, user));
    _wireDeleteComment(list.lastElementChild, c, list);
  }

  function _prependComment(drawer, c, user) {
    const list = drawer.querySelector('[data-comment-list]');
    const empty = list.querySelector('.empty-state');
    if (empty) empty.remove();
    list.insertAdjacentHTML('afterbegin', _buildCommentHTML(c, user));
    _wireDeleteComment(list.firstElementChild, c, list);
  }

  function _wireDeleteComment(el, c, list) {
    const btn = el.querySelector('[data-delete-comment]');
    if (!btn) return;

    // FIX: captura projectId e taskId do drawer no momento do clique,
    // não antes — o drawer pode ter fechado entre o clique e o confirm
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();

      // Lê os IDs do elemento do drawer no momento do clique (ainda está aberto)
      const drawerEl = document.querySelector('.drawer');
      const pId = drawerEl?.dataset.projectId;
      const tId = drawerEl?.dataset.taskId;

      const ok = await confirmDialog({
        title: 'Excluir comentário',
        message: 'Tem certeza que deseja excluir este comentário?',
        confirmLabel: 'Excluir',
        danger: true,
      });

      if (!ok) return;

      // FIX: após o confirm (async), o drawer pode ter fechado — verifica antes de chamar API
      if (!pId || !tId) {
        Toast.error('Drawer foi fechado antes de confirmar.');
        return;
      }

      try {
        await CommentsAPI.remove(pId, tId, c.id);
        el.remove();
        Toast.success('Comentário excluído');
      } catch (err) {
        Toast.error(apiErrorMessage(err));
      }
    });
  }

  function setMeta(projectId, taskId) {
    if (_drawer) {
      _drawer.dataset.projectId = projectId;
      _drawer.dataset.taskId    = taskId;
    }
  }

  function close() { _close(); }

  return { open, close, setMeta };
})();

/* ════════════════════════════════════════
   RENDER HELPERS
════════════════════════════════════════ */
const Render = (() => {

  function statusBadge(status, withAttr = false) {
    const attr = withAttr ? 'data-status-badge' : '';
    return `<span class="badge badge-${status}" ${attr}>${status}</span>`;
  }

  function priorityBadge(priority) {
    const labels = { high: '↑ high', medium: '— medium', low: '↓ low' };
    return `<span class="badge badge-${priority}">${labels[priority] || priority}</span>`;
  }

  function date(iso) {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleDateString('pt-BR', {
        day: '2-digit', month: 'short', year: 'numeric'
      });
    } catch { return iso; }
  }

  function relativeDate(iso) {
    if (!iso) return '';
    try {
      const diff = Date.now() - new Date(iso).getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 1)   return 'agora';
      if (mins < 60)  return `${mins}m atrás`;
      const hrs = Math.floor(mins / 60);
      if (hrs < 24)   return `${hrs}h atrás`;
      const days = Math.floor(hrs / 24);
      if (days < 30)  return `${days}d atrás`;
      return date(iso);
    } catch { return ''; }
  }

  function deadline(iso) {
    if (!iso) return '<span class="drawer-section__value empty">—</span>';
    const d = new Date(iso);
    const isOverdue = d < new Date();
    const cls = isOverdue ? 'task-card__deadline--overdue' : '';
    return `<span class="drawer-section__value ${cls}">${date(iso)}${isOverdue ? ' ⚠' : ''}</span>`;
  }

  function deadlineBadge(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    const isOverdue = d < new Date();
    const cls = 'task-card__deadline' + (isOverdue ? ' task-card__deadline--overdue' : '');
    return `<span class="${cls}">${date(iso)}</span>`;
  }

  function avatar(name) {
    const initials = (name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
    return `<div class="user-avatar">${initials}</div>`;
  }

  return { statusBadge, priorityBadge, date, relativeDate, deadline, deadlineBadge, avatar };
})();

/* ════════════════════════════════════════
   DOM HELPERS
════════════════════════════════════════ */

/** Escapa HTML para evitar XSS em textContent dinâmico */
function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/** Retorna elemento pelo id */
function $(id) { return document.getElementById(id); }

/** Ativa/desativa classes num botão de submit enquanto async corre */
async function withLoading(btn, asyncFn) {
  const original = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = `<span class="spinner spinner-sm"></span>`;
  try {
    return await asyncFn();
  } finally {
    btn.disabled = false;
    btn.innerHTML = original;
  }
}