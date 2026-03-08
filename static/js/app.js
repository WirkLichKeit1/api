/**
 * app.js — Orquestrador principal da SPA
 *
 * FEATURES nesta versão:
 *   1. _setupAuthScreen()     guarda flag _authInitialized    — sem listeners duplicados
 *   2. _setupOrgSetupScreen() guarda flag _orgSetupInitialized — sem listeners duplicados
 *   3. _setupAppShell()       guarda flag _shellInitialized   — comportamento anterior mantido
 *   4. _navigate(user)        ponto único de roteamento pós-login
 *   5. _doLogout()            reset centralizado de estado e flags
 *   6. state.members          cache de membros da org para resolver nomes por ID
 *   7. _viewMembers()         nova página com lista de membros
 *   8. Assignee exibe nome em tasks e no drawer
 *   9. Comentários exibem nome do autor
 *  10. Botão Dashboard na topbar de Projects e Members
 */

const App = (() => {

  /* ── State ── */
  const state = {
    user:           null,
    org:            null,
    projects:       [],
    currentProject: null,
    members:        [],
  };

  let _authInitialized     = false;
  let _orgSetupInitialized = false;
  let _shellInitialized    = false;

  /* ── Helpers de membros ── */
  function _memberName(id) {
    if (!id) return null;
    const m = state.members.find(m => m.id === id);
    return m ? m.name : null;
  }

  function _memberLabel(id) {
    if (!id) return '—';
    const name = _memberName(id);
    return name
      ? `${escHtml(name)} <span class="text-muted text-xs">#${id}</span>`
      : `#${id}`;
  }

  async function _loadMembers() {
    if (!state.org) return;
    try {
      state.members = await OrgAPI.getMembers(state.org.id);
    } catch {
      state.members = [];
    }
  }

  /* ══════════════════════════════════════════
     INIT
  ═══════════════════════════════════════════ */
  async function init() {
    _setupAuthScreen();

    if (!Auth.isAuthenticated()) {
      _showScreen('auth');
      return;
    }

    state.user = Auth.getUser();
    await _navigate(state.user);
  }

  async function _navigate(user) {
    if (!user) { _showScreen('auth'); return; }

    if (!user.organization_id) {
      _setupOrgSetupScreen();
      _showScreen('org-setup');
      return;
    }

    try {
      state.org = await OrgAPI.get(user.organization_id);
    } catch (e) {
      if (e.response?.status === 403 || e.response?.status === 404) {
        Auth.clearSession();
        _showScreen('auth');
        return;
      }
    }

    await _loadMembers();

    _setupAppShell();
    _showScreen('app');
    Router.start();
  }

  /* ══════════════════════════════════════════
     SCREEN MANAGEMENT
  ═══════════════════════════════════════════ */
  function _showScreen(name) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const el = document.getElementById('screen-' + name);
    if (el) el.classList.add('active');
  }

  function goTo(name) { _showScreen(name); }

  /* ══════════════════════════════════════════
     AUTH SCREEN
  ═══════════════════════════════════════════ */
  function _setupAuthScreen() {
    if (_authInitialized) return;
    _authInitialized = true;

    const tabLogin    = $('auth-tab-login');
    const tabRegister = $('auth-tab-register');
    const formLogin   = $('auth-form-login');
    const formReg     = $('auth-form-register');
    const errorLogin  = $('auth-error-login');
    const errorReg    = $('auth-error-register');

    tabLogin.addEventListener('click', () => {
      tabLogin.classList.add('active');
      tabRegister.classList.remove('active');
      formLogin.classList.remove('hidden');
      formReg.classList.add('hidden');
      errorLogin.textContent = '';
    });

    tabRegister.addEventListener('click', () => {
      tabRegister.classList.add('active');
      tabLogin.classList.remove('active');
      formReg.classList.remove('hidden');
      formLogin.classList.add('hidden');
      errorReg.textContent = '';
    });

    $('btn-login').addEventListener('click', async () => {
      errorLogin.textContent = '';
      const email    = $('login-email').value.trim();
      const password = $('login-password').value;
      if (!email || !password) { errorLogin.textContent = 'Preencha todos os campos.'; return; }
      await withLoading($('btn-login'), async () => {
        try {
          const user = await Auth.login(email, password);
          state.user = user;
          await _navigate(user);
        } catch (e) {
          errorLogin.textContent = apiErrorMessage(e);
        }
      });
    });

    [$('login-email'), $('login-password')].forEach(el => {
      el.addEventListener('keydown', e => { if (e.key === 'Enter') $('btn-login').click(); });
    });

    $('btn-register').addEventListener('click', async () => {
      errorReg.textContent = '';
      const name     = $('reg-name').value.trim();
      const email    = $('reg-email').value.trim();
      const password = $('reg-password').value;
      if (!name || !email || !password) { errorReg.textContent = 'Preencha todos os campos.'; return; }
      await withLoading($('btn-register'), async () => {
        try {
          await Auth.register(name, email, password);
          const user = await Auth.login(email, password);
          state.user = user;
          Toast.success('Conta criada com sucesso!');
          await _navigate(user);
        } catch (e) {
          errorReg.textContent = apiErrorMessage(e);
        }
      });
    });
  }

  /* ══════════════════════════════════════════
     ORG SETUP SCREEN
  ═══════════════════════════════════════════ */
  function _setupOrgSetupScreen() {
    if (_orgSetupInitialized) return;
    _orgSetupInitialized = true;

    const btnCreate   = $('org-btn-create');
    const btnJoin     = $('org-btn-join');
    const panelCreate = $('org-panel-create');
    const panelJoin   = $('org-panel-join');

    btnCreate.addEventListener('click', () => {
      panelCreate.classList.toggle('hidden');
      panelJoin.classList.add('hidden');
      btnCreate.classList.toggle('selected');
      btnJoin.classList.remove('selected');
    });

    btnJoin.addEventListener('click', () => {
      panelJoin.classList.toggle('hidden');
      panelCreate.classList.add('hidden');
      btnJoin.classList.toggle('selected');
      btnCreate.classList.remove('selected');
    });

    $('org-create-submit').addEventListener('click', async () => {
      const name = $('org-create-name').value.trim();
      if (!name) { Toast.warning('Digite um nome para a organização.'); return; }
      await withLoading($('org-create-submit'), async () => {
        try {
          const org = await OrgAPI.create(name);
          state.org  = org;
          state.user = Auth.patchUser({ organization_id: org.id, role: 'admin' });
          await _loadMembers();
          _setupAppShell();
          _showScreen('app');
          Router.start();
          Toast.success('Organização "' + name + '" criada!');
        } catch (e) { Toast.error(apiErrorMessage(e)); }
      });
    });

    $('org-join-submit').addEventListener('click', async () => {
      const orgId = parseInt($('org-join-id').value.trim());
      if (!orgId) { Toast.warning('Digite o ID da organização.'); return; }
      await withLoading($('org-join-submit'), async () => {
        try {
          const org  = await OrgAPI.join(orgId);
          state.org  = org;
          state.user = Auth.patchUser({ organization_id: org.id });
          Auth.saveUser(state.user);
          await _loadMembers();
          _setupAppShell();
          _showScreen('app');
          Router.start();
          Toast.success('Entrou em "' + org.name + '"!');
        } catch (e) { Toast.error(apiErrorMessage(e)); }
      });
    });

    const logoutLink = $('org-setup-logout');
    if (logoutLink) {
      logoutLink.addEventListener('click', async (e) => {
        e.preventDefault();
        await Auth.logout();
        _doLogout();
      });
    }
  }

  /* ══════════════════════════════════════════
     APP SHELL
  ═══════════════════════════════════════════ */
  function _setupAppShell() {
    const u = state.user;
    $('shell-user-name').textContent   = u?.name || 'Usuário';
    $('shell-user-role').textContent   = u?.role || 'member';
    $('shell-user-avatar').textContent = (u?.name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

    if (_shellInitialized) return;
    _shellInitialized = true;

    $('btn-shell-logout').addEventListener('click', async () => {
      const ok = await confirmDialog({ title: 'Sair', message: 'Deseja encerrar sua sessão?', confirmLabel: 'Sair' });
      if (!ok) return;
      await Auth.logout();
      _doLogout();
    });

    Router.on('dashboard',    () => _viewDashboard());
    Router.on('projects',     () => _viewProjects());
    Router.on('projects/:id', ({ id }) => _viewTasks(parseInt(id)));
    Router.on('members',      () => _viewMembers());

    document.querySelectorAll('[data-nav]').forEach(el => {
      el.addEventListener('click', () => Router.navigate(el.dataset.nav));
    });

    window.addEventListener('hashchange', _updateNavActive);
    _updateNavActive();
  }

  function _doLogout() {
    state.user     = null;
    state.org      = null;
    state.projects = [];
    state.members  = [];
    _shellInitialized    = false;
    _orgSetupInitialized = false;
    window.location.hash = '';
    _showScreen('auth');
  }

  function _updateNavActive() {
    const hash = window.location.hash.replace(/^#\/?/, '');
    document.querySelectorAll('[data-nav]').forEach(el => {
      const nav = el.dataset.nav;
      el.classList.toggle('active', hash === nav || hash.startsWith(nav + '/'));
    });
  }

  function _setTopbar(title, breadcrumb, actions) {
    $('topbar-title').textContent = title;
    const bc = $('topbar-breadcrumb');
    if (breadcrumb) { bc.innerHTML = breadcrumb; bc.style.display = 'flex'; }
    else { bc.style.display = 'none'; }
    $('topbar-actions').innerHTML = actions || '';
  }

  function _setContent(html) { $('main-view').innerHTML = html; }

  /* ══════════════════════════════════════════
     VIEW: DASHBOARD
  ═══════════════════════════════════════════ */
  async function _viewDashboard() {
    _updateNavActive();
    _setTopbar('Dashboard');
    _setContent('<div class="loading-center"><div class="spinner"></div></div>');

    try {
      const projects = await ProjectsAPI.list();
      state.projects = projects;

      let totalTodo = 0, totalDone = 0;
      if (projects.length) {
        const pid = projects[0].id;
        const [todo, done] = await Promise.all([
          TasksAPI.list(pid, { status: 'todo',  per_page: 1 }).catch(() => ({ total: 0 })),
          TasksAPI.list(pid, { status: 'done',  per_page: 1 }).catch(() => ({ total: 0 })),
        ]);
        totalTodo = todo.total;
        totalDone = done.total;
      }

      const recentProjects = [...projects]
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 6);

      const html = `
        <div class="page">
          <div class="org-banner">
            <div>
              <div class="org-banner__name">${escHtml(state.org?.name || '—')}</div>
              <div class="org-banner__meta">ID #${state.org?.id || '?'} · ${state.members.length} membro${state.members.length !== 1 ? 's' : ''}</div>
            </div>
            <div style="display:flex;gap:8px;align-items:center;">
              <span class="badge badge-${state.user?.role === 'admin' ? 'admin' : 'member'}">${state.user?.role || 'member'}</span>
              <button class="btn btn-ghost btn-sm" onclick="Router.navigate('members')">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                Membros
              </button>
            </div>
          </div>

          <div class="stat-grid">
            <div class="stat-card stat-card--accent">
              <div class="stat-card__value">${projects.length}</div>
              <div class="stat-card__label">Projetos</div>
            </div>
            <div class="stat-card stat-card--info">
              <div class="stat-card__value">${state.members.length}</div>
              <div class="stat-card__label">Membros</div>
            </div>
            <div class="stat-card stat-card--danger">
              <div class="stat-card__value">${totalTodo}</div>
              <div class="stat-card__label">A fazer</div>
            </div>
            <div class="stat-card stat-card--success">
              <div class="stat-card__value">${totalDone}</div>
              <div class="stat-card__label">Concluídas</div>
            </div>
          </div>

          <div class="dashboard-grid">
            <div class="card">
              <div class="card-header">
                <h3>Projetos recentes</h3>
                <button class="btn btn-ghost btn-sm" onclick="Router.navigate('projects')">Ver todos</button>
              </div>
              ${recentProjects.length ? `
                <div class="recent-list">
                  ${recentProjects.map(p => `
                    <div class="recent-item" onclick="Router.navigate('projects/${p.id}')">
                      <div class="recent-item__dot" style="background:var(--accent)"></div>
                      <span class="recent-item__name">${escHtml(p.name)}</span>
                      <span class="recent-item__date">${Render.date(p.created_at)}</span>
                    </div>
                  `).join('')}
                </div>
              ` : '<p class="text-muted text-sm">Nenhum projeto ainda.</p>'}
            </div>

            <div class="card">
              <div class="card-header"><h3>Organização</h3></div>
              <div style="display:flex;flex-direction:column;gap:12px;">
                <div>
                  <div class="drawer-section__label">Nome</div>
                  <div style="font-size:.88rem;">${escHtml(state.org?.name || '—')}</div>
                </div>
                <div>
                  <div class="drawer-section__label">Criada em</div>
                  <div style="font-size:.88rem;">${Render.date(state.org?.created_at)}</div>
                </div>
                <div>
                  <div class="drawer-section__label">Seu papel</div>
                  <span class="badge badge-${state.user?.role === 'admin' ? 'admin' : 'member'}">${state.user?.role}</span>
                </div>
                ${state.user?.role === 'admin' ? '<button class="btn btn-sm" onclick="App._editOrg()">Editar organização</button>' : ''}
              </div>
            </div>
          </div>
        </div>
      `;
      _setContent(html);
    } catch (e) {
      _setContent('<div class="page"><p class="text-muted">Erro ao carregar dashboard: ' + apiErrorMessage(e) + '</p></div>');
    }
  }

  /* ══════════════════════════════════════════
     VIEW: PROJECTS
  ═══════════════════════════════════════════ */
  async function _viewProjects() {
    _updateNavActive();
    _setTopbar(
      'Projetos',
      null,
      '<button class="btn btn-ghost btn-sm" onclick="Router.navigate(\'dashboard\')">' +
        '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>' +
        ' Dashboard' +
      '</button>'
    );
    _setContent('<div class="loading-center"><div class="spinner"></div></div>');

    try {
      const projects = await ProjectsAPI.list();
      state.projects = projects;
      _renderProjectsPage(projects);
    } catch (e) {
      _setContent('<div class="page"><p class="text-muted">Erro: ' + apiErrorMessage(e) + '</p></div>');
    }
  }

  function _renderProjectsPage(projects) {
    const html = `
      <div class="page">
        <div class="page__header">
          <div class="page__header-info">
            <h1>Projetos</h1>
            <p>${projects.length} projeto${projects.length !== 1 ? 's' : ''} na organização</p>
          </div>
          <div class="page__actions">
            <button class="btn btn-primary" id="btn-new-project">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Novo projeto
            </button>
          </div>
        </div>
        ${projects.length === 0 ? `
          <div class="empty-state">
            <svg class="empty-state__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
            </svg>
            <div class="empty-state__title">Nenhum projeto ainda</div>
            <p class="empty-state__desc">Crie seu primeiro projeto para começar.</p>
          </div>
        ` : `
          <div class="projects-grid" id="projects-grid">
            ${projects.map(p => _projectCardHTML(p)).join('')}
          </div>
        `}
      </div>
    `;
    _setContent(html);

    $('btn-new-project')?.addEventListener('click', () => _openNewProjectModal());
    document.querySelectorAll('[data-open-project]').forEach(el => {
      el.addEventListener('click', () => Router.navigate('projects/' + el.dataset.openProject));
    });
    document.querySelectorAll('[data-edit-project]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const proj = state.projects.find(p => p.id === parseInt(el.dataset.editProject));
        if (proj) _openEditProjectModal(proj);
      });
    });
    document.querySelectorAll('[data-delete-project]').forEach(el => {
      el.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id   = parseInt(el.dataset.deleteProject);
        const proj = state.projects.find(p => p.id === id);
        const ok   = await confirmDialog({
          title: 'Excluir projeto',
          message: 'Excluir <strong>' + escHtml(proj?.name) + '</strong>? Esta ação não pode ser desfeita.',
          confirmLabel: 'Excluir', danger: true,
        });
        if (!ok) return;
        try {
          await ProjectsAPI.remove(id);
          state.projects = state.projects.filter(p => p.id !== id);
          _renderProjectsPage(state.projects);
          Toast.success('Projeto excluído');
        } catch (err) { Toast.error(apiErrorMessage(err)); }
      });
    });
  }

  function _projectCardHTML(p) {
    return `
      <div class="project-card" data-open-project="${p.id}">
        <div class="project-card__actions">
          <button class="btn-icon" data-edit-project="${p.id}" title="Editar">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="btn-icon" data-delete-project="${p.id}" title="Excluir" style="color:var(--danger)">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M9 6V4h6v2"/></svg>
          </button>
        </div>
        <div class="project-card__name">${escHtml(p.name)}</div>
        <div class="project-card__meta">
          <span class="project-card__date">${Render.date(p.created_at)}</span>
          <span class="badge badge-todo">#${p.id}</span>
        </div>
      </div>
    `;
  }

  function _openNewProjectModal() {
    Modal.open({
      title: 'Novo projeto',
      bodyHTML: `
        <div class="form-group">
          <label class="form-label">Nome do projeto</label>
          <input class="input" id="modal-project-name" placeholder="Ex: Website Redesign" maxlength="120" />
        </div>
        <span class="form-error" id="modal-project-error"></span>
      `,
      footerHTML: `
        <button class="btn btn-ghost btn-sm" onclick="Modal.close()">Cancelar</button>
        <button class="btn btn-primary btn-sm" id="modal-project-submit">Criar projeto</button>
      `,
      onAfterOpen() {
        const input = $('modal-project-name');
        const err   = $('modal-project-error');
        input.focus();
        const submit = async () => {
          const name = input.value.trim();
          if (!name) { err.textContent = 'Digite um nome.'; return; }
          await withLoading($('modal-project-submit'), async () => {
            try {
              const p = await ProjectsAPI.create(name);
              state.projects.unshift(p);
              Modal.close();
              _renderProjectsPage(state.projects);
              Toast.success('Projeto "' + p.name + '" criado!');
            } catch (e) { err.textContent = apiErrorMessage(e); }
          });
        };
        $('modal-project-submit').addEventListener('click', submit);
        input.addEventListener('keydown', e => { if (e.key === 'Enter') submit(); });
      },
    });
  }

  function _openEditProjectModal(proj) {
    Modal.open({
      title: 'Editar projeto',
      bodyHTML: `
        <div class="form-group">
          <label class="form-label">Nome</label>
          <input class="input" id="modal-edit-project-name" value="${escHtml(proj.name)}" maxlength="120" />
        </div>
        <span class="form-error" id="modal-edit-project-error"></span>
      `,
      footerHTML: `
        <button class="btn btn-ghost btn-sm" onclick="Modal.close()">Cancelar</button>
        <button class="btn btn-primary btn-sm" id="modal-edit-project-submit">Salvar</button>
      `,
      onAfterOpen() {
        const input = $('modal-edit-project-name');
        const err   = $('modal-edit-project-error');
        input.focus(); input.select();
        $('modal-edit-project-submit').addEventListener('click', async () => {
          const name = input.value.trim();
          if (!name) { err.textContent = 'Digite um nome.'; return; }
          await withLoading($('modal-edit-project-submit'), async () => {
            try {
              const updated = await ProjectsAPI.update(proj.id, name);
              const idx = state.projects.findIndex(p => p.id === proj.id);
              if (idx > -1) state.projects[idx] = updated;
              Modal.close();
              _renderProjectsPage(state.projects);
              Toast.success('Projeto atualizado');
            } catch (e) { err.textContent = apiErrorMessage(e); }
          });
        });
      },
    });
  }

  /* ══════════════════════════════════════════
     VIEW: TASKS (Kanban)
  ═══════════════════════════════════════════ */
  let _taskState = {
    projectId:  null,
    project:    null,
    filters:    { status: '', priority: '', page: 1, per_page: 20 },
    allTasks:   [],
    pagination: null,
  };

  async function _viewTasks(projectId) {
    _taskState.projectId = projectId;
    _taskState.filters   = { status: '', priority: '', page: 1, per_page: 50 };

    _setTopbar(
      'Carregando…',
      '<button class="btn btn-ghost btn-sm" onclick="Router.navigate(\'projects\')" style="padding:4px 8px;">' +
        '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>' +
        ' Projetos</button><span class="topbar__breadcrumb-sep">/</span><span>…</span>'
    );
    _setContent('<div class="loading-center"><div class="spinner"></div></div>');

    try {
      const project = await ProjectsAPI.get(projectId);
      _taskState.project   = project;
      state.currentProject = project;

      _setTopbar(
        project.name,
        '<button class="btn btn-ghost btn-sm" onclick="Router.navigate(\'projects\')" style="padding:4px 8px;">' +
          '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>' +
          ' Projetos</button><span class="topbar__breadcrumb-sep">/</span>' +
          '<span class="topbar__breadcrumb-current">' + escHtml(project.name) + '</span>'
      );

      await _fetchAndRenderBoard();
    } catch (e) {
      _setContent('<div class="page"><p class="text-muted">Projeto não encontrado ou sem acesso.</p></div>');
    }
  }

  async function _fetchAndRenderBoard() {
    const { projectId, filters } = _taskState;
    const [todoRes, doingRes, doneRes] = await Promise.all([
      TasksAPI.list(projectId, { ...filters, status: 'todo',  page: 1, per_page: 30 }),
      TasksAPI.list(projectId, { ...filters, status: 'doing', page: 1, per_page: 30 }),
      TasksAPI.list(projectId, { ...filters, status: 'done',  page: 1, per_page: 30 }),
    ]);
    _taskState.allTasks = [...todoRes.items, ...doingRes.items, ...doneRes.items];
    _renderBoard({
      todo:  { items: todoRes.items,  total: todoRes.total },
      doing: { items: doingRes.items, total: doingRes.total },
      done:  { items: doneRes.items,  total: doneRes.total },
    });
  }

  function _renderBoard(columns) {
    const { filters } = _taskState;
    const html = `
      <div class="page">
        <div class="kanban-toolbar">
          <button class="btn btn-primary btn-sm" id="btn-new-task">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nova tarefa
          </button>
          <span class="kanban-toolbar__sep"></span>
          <select class="input" id="filter-priority" style="width:130px;">
            <option value="">Prioridade</option>
            <option value="high"   ${filters.priority==='high'   ? 'selected' : ''}>High</option>
            <option value="medium" ${filters.priority==='medium' ? 'selected' : ''}>Medium</option>
            <option value="low"    ${filters.priority==='low'    ? 'selected' : ''}>Low</option>
          </select>
          ${filters.priority ? '<button class="btn btn-ghost btn-sm" id="btn-clear-filters">Limpar filtros</button>' : ''}
        </div>
        <div class="kanban-board">
          ${_colHTML('todo',  'To Do',       columns.todo)}
          ${_colHTML('doing', 'In Progress', columns.doing)}
          ${_colHTML('done',  'Done',        columns.done)}
        </div>
      </div>
    `;
    _setContent(html);

    $('btn-new-task')?.addEventListener('click', () => _openNewTaskModal());
    $('filter-priority')?.addEventListener('change', async (e) => {
      _taskState.filters.priority = e.target.value;
      await _fetchAndRenderBoard();
    });
    $('btn-clear-filters')?.addEventListener('click', async () => {
      _taskState.filters = { status: '', priority: '', page: 1, per_page: 50 };
      await _fetchAndRenderBoard();
    });
    document.querySelectorAll('[data-task-id]').forEach(el => {
      el.addEventListener('click', () => {
        const id   = parseInt(el.dataset.taskId);
        const task = _taskState.allTasks.find(t => t.id === id);
        if (task) {
          Drawer.open(task, _taskState.projectId, _onTaskStatusChanged, state.members);
          Drawer.setMeta(_taskState.projectId, task.id);
        }
      });
    });
  }

  function _colHTML(status, label, col) {
    const { items, total } = col;
    const extra = total > items.length ? ' (+' + (total - items.length) + ')' : '';
    return `
      <div class="kanban-col kanban-col--${status}">
        <div class="kanban-col__header">
          <span class="kanban-col__title"><span class="kanban-col__dot"></span>${label}</span>
          <span class="kanban-col__count">${total}${extra}</span>
        </div>
        <div class="kanban-col__body">
          ${items.length === 0
            ? '<div style="padding:16px 0;text-align:center;"><span class="text-muted text-xs">Nenhuma tarefa</span></div>'
            : items.map(t => _taskCardHTML(t)).join('')}
          <button class="btn btn-ghost btn-sm w-full" style="margin-top:4px;justify-content:center;"
            onclick="App._quickAddTask('${status}')">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Adicionar
          </button>
        </div>
      </div>
    `;
  }

  function _taskCardHTML(task) {
    // Assignee: mostra primeiro nome + #id como tooltip, ou só #id
    const name = task.assigned_to ? _memberName(task.assigned_to) : null;
    const assigneeHTML = task.assigned_to
      ? '<span class="task-card__assignee" title="' + escHtml(name ? name + ' #' + task.assigned_to : '#' + task.assigned_to) + '">' +
          escHtml(name ? name.split(' ')[0] : '#' + task.assigned_to) +
        '</span>'
      : '';

    return `
      <div class="task-card" data-task-id="${task.id}">
        <div class="task-card__title">${escHtml(task.title)}</div>
        <div class="task-card__footer">
          <div class="task-card__badges">
            ${Render.priorityBadge(task.priority)}
            ${assigneeHTML}
          </div>
          ${Render.deadlineBadge(task.deadline)}
        </div>
      </div>
    `;
  }

  function _onTaskStatusChanged(updatedTask) {
    const idx = _taskState.allTasks.findIndex(t => t.id === updatedTask.id);
    if (idx > -1) _taskState.allTasks[idx] = updatedTask;
    _fetchAndRenderBoard();
  }

  function _openNewTaskModal(defaultStatus) {
    defaultStatus = defaultStatus || 'todo';

    // Select de assignee com nomes se membros disponíveis, senão input numérico
    const assigneeField = state.members.length
      ? '<select class="input" id="tf-assigned"><option value="">— Nenhum —</option>' +
          state.members.map(m => '<option value="' + m.id + '">' + escHtml(m.name) + ' (#' + m.id + ')</option>').join('') +
        '</select>'
      : '<input class="input" id="tf-assigned" type="number" placeholder="ID do usuário (opcional)" />';

    Modal.open({
      title: 'Nova tarefa',
      size: 'lg',
      bodyHTML: `
        <div class="task-form-grid">
          <div class="form-group col-span-2">
            <label class="form-label">Título *</label>
            <input class="input" id="tf-title" placeholder="Descreva a tarefa…" maxlength="200" />
          </div>
          <div class="form-group col-span-2">
            <label class="form-label">Descrição</label>
            <textarea class="input" id="tf-desc" placeholder="Detalhes opcionais…" rows="3"></textarea>
          </div>
          <div class="form-group">
            <label class="form-label">Status</label>
            <select class="input" id="tf-status">
              <option value="todo"  ${defaultStatus==='todo'  ? 'selected' : ''}>To Do</option>
              <option value="doing" ${defaultStatus==='doing' ? 'selected' : ''}>In Progress</option>
              <option value="done"  ${defaultStatus==='done'  ? 'selected' : ''}>Done</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Prioridade</label>
            <select class="input" id="tf-priority">
              <option value="low">Low</option>
              <option value="medium" selected>Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Atribuir a</label>
            ${assigneeField}
          </div>
          <div class="form-group">
            <label class="form-label">Prazo</label>
            <input class="input" id="tf-deadline" type="datetime-local" />
          </div>
        </div>
        <span class="form-error" id="tf-error" style="margin-top:4px;"></span>
      `,
      footerHTML: `
        <button class="btn btn-ghost btn-sm" onclick="Modal.close()">Cancelar</button>
        <button class="btn btn-primary btn-sm" id="tf-submit">Criar tarefa</button>
      `,
      onAfterOpen() {
        const err = $('tf-error');
        $('tf-title').focus();
        $('tf-submit').addEventListener('click', async () => {
          err.textContent = '';
          const title = $('tf-title').value.trim();
          if (!title) { err.textContent = 'Título é obrigatório.'; return; }
          const assignedVal = parseInt($('tf-assigned').value) || null;
          const data = {
            title,
            description: $('tf-desc').value.trim()  || null,
            status:      $('tf-status').value,
            priority:    $('tf-priority').value,
            assigned_to: assignedVal,
            deadline:    $('tf-deadline').value      || null,
          };
          await withLoading($('tf-submit'), async () => {
            try {
              const task = await TasksAPI.create(_taskState.projectId, data);
              _taskState.allTasks.push(task);
              Modal.close();
              await _fetchAndRenderBoard();
              Toast.success('Tarefa criada!');
            } catch (e) { err.textContent = apiErrorMessage(e); }
          });
        });
      },
    });
  }

  function _quickAddTask(status) { _openNewTaskModal(status); }

  /* ══════════════════════════════════════════
     VIEW: MEMBERS
  ═══════════════════════════════════════════ */
  async function _viewMembers() {
    _updateNavActive();
    _setTopbar(
      'Membros',
      null,
      '<button class="btn btn-ghost btn-sm" onclick="Router.navigate(\'dashboard\')">' +
        '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>' +
        ' Dashboard</button>'
    );
    _setContent('<div class="loading-center"><div class="spinner"></div></div>');

    try {
      const members = await OrgAPI.getMembers(state.org.id);
      state.members = members;

      const html = `
        <div class="page">
          <div class="page__header">
            <div class="page__header-info">
              <h1>Membros</h1>
              <p>${members.length} membro${members.length !== 1 ? 's' : ''} em <strong>${escHtml(state.org?.name || '—')}</strong></p>
            </div>
          </div>
          ${members.length === 0 ? `
            <div class="empty-state">
              <svg class="empty-state__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
              </svg>
              <div class="empty-state__title">Nenhum membro</div>
            </div>
          ` : `
            <div class="card" style="padding:0;overflow:hidden;">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nome</th>
                    <th>Email</th>
                    <th>Papel</th>
                    <th>Entrou em</th>
                  </tr>
                </thead>
                <tbody>
                  ${members.map(m => `
                    <tr>
                      <td><span class="text-mono text-xs text-muted">#${m.id}</span>${m.id === state.user?.id ? ' <span class="badge badge-member" style="font-size:.6rem;">você</span>' : ''}</td>
                      <td>
                        <div style="display:flex;align-items:center;gap:8px;">
                          <div class="user-avatar" style="width:26px;height:26px;font-size:.65rem;flex-shrink:0;">
                            ${escHtml(m.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase())}
                          </div>
                          <span style="font-size:.85rem;color:var(--text);">${escHtml(m.name)}</span>
                        </div>
                      </td>
                      <td style="font-size:.8rem;">${escHtml(m.email)}</td>
                      <td><span class="badge badge-${m.role === 'admin' ? 'admin' : 'member'}">${m.role}</span></td>
                      <td style="font-size:.8rem;">${Render.date(m.created_at)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          `}
        </div>
      `;
      _setContent(html);
    } catch (e) {
      _setContent('<div class="page"><p class="text-muted">Erro ao carregar membros: ' + apiErrorMessage(e) + '</p></div>');
    }
  }

  /* ══════════════════════════════════════════
     EDIT ORG
  ═══════════════════════════════════════════ */
  function _editOrg() {
    if (!state.org) return;
    Modal.open({
      title: 'Editar organização',
      bodyHTML: `
        <div class="form-group">
          <label class="form-label">Nome</label>
          <input class="input" id="modal-org-name" value="${escHtml(state.org.name)}" maxlength="120" />
        </div>
        <span class="form-error" id="modal-org-error"></span>
      `,
      footerHTML: `
        <button class="btn btn-ghost btn-sm" onclick="Modal.close()">Cancelar</button>
        <button class="btn btn-primary btn-sm" id="modal-org-submit">Salvar</button>
      `,
      onAfterOpen() {
        const input = $('modal-org-name');
        const err   = $('modal-org-error');
        input.focus(); input.select();
        $('modal-org-submit').addEventListener('click', async () => {
          const name = input.value.trim();
          if (!name) { err.textContent = 'Digite um nome.'; return; }
          await withLoading($('modal-org-submit'), async () => {
            try {
              const updated = await OrgAPI.update(state.org.id, name);
              state.org = updated;
              Modal.close();
              _viewDashboard();
              Toast.success('Organização atualizada');
            } catch (e) { err.textContent = apiErrorMessage(e); }
          });
        });
      },
    });
  }

  return { init, goTo, _editOrg, _quickAddTask, _memberLabel };

})();

document.addEventListener('DOMContentLoaded', () => { App.init(); });

window.App = App;