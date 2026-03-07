/**
 * app.js — Orquestrador principal da SPA
 *
 * Responsável por:
 *   - Inicialização e verificação de sessão
 *   - Navegação entre screens (auth / org-setup / app)
 *   - Renderização de cada view (dashboard, projects, tasks)
 *   - State global mínimo (currentProject, etc.)
 */

const App = (() => {

  /* ── State ── */
  const state = {
    user:           null,
    org:            null,
    projects:       [],
    currentProject: null,
  };

  /* ══════════════════════════════════════════
     INIT
  ═══════════════════════════════════════════ */
  async function init() {
    if (!Auth.isAuthenticated()) {
      showScreen('auth');
      return;
    }

    state.user = Auth.getUser();

    if (!state.user.organization_id) {
      showScreen('org-setup');
      _initOrgSetup();
      return;
    }

    // Reload user info to ensure org is up to date
    try {
      const orgData = await OrgAPI.get(state.user.organization_id);
      state.org = orgData;
    } catch (e) {
      // Org may have been deleted — force re-auth
      if (e.response?.status === 403 || e.response?.status === 404) {
        Auth.clearSession();
        showScreen('auth');
        return;
      }
    }

    _initAppShell();
    showScreen('app');
    Router.start();
  }

  /* ══════════════════════════════════════════
     SCREEN MANAGEMENT
  ═══════════════════════════════════════════ */
  function showScreen(name) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const el = document.getElementById(`screen-${name}`);
    if (el) el.classList.add('active');
  }

  function goTo(name) {
    showScreen(name);
  }

  /* ══════════════════════════════════════════
     AUTH SCREEN
  ═══════════════════════════════════════════ */
  function _initAuth() {
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

    // LOGIN submit
    $('btn-login').addEventListener('click', async () => {
      errorLogin.textContent = '';
      const email    = $('login-email').value.trim();
      const password = $('login-password').value;

      if (!email || !password) {
        errorLogin.textContent = 'Preencha todos os campos.';
        return;
      }

      await withLoading($('btn-login'), async () => {
        try {
          const user = await Auth.login(email, password);
          state.user = user;
          if (!user.organization_id) {
            showScreen('org-setup');
            _initOrgSetup();
          } else {
            const orgData = await OrgAPI.get(user.organization_id);
            state.org = orgData;
            _initAppShell();
            showScreen('app');
            Router.start();
          }
        } catch (e) {
          errorLogin.textContent = apiErrorMessage(e);
        }
      });
    });

    // Permite submeter com Enter
    [$('login-email'), $('login-password')].forEach(el => {
      el.addEventListener('keydown', e => { if (e.key === 'Enter') $('btn-login').click(); });
    });

    // REGISTER submit
    $('btn-register').addEventListener('click', async () => {
      errorReg.textContent = '';
      const name     = $('reg-name').value.trim();
      const email    = $('reg-email').value.trim();
      const password = $('reg-password').value;

      if (!name || !email || !password) {
        errorReg.textContent = 'Preencha todos os campos.';
        return;
      }

      await withLoading($('btn-register'), async () => {
        try {
          await Auth.register(name, email, password);
          // Auto-login após registro
          const user = await Auth.login(email, password);
          state.user = user;
          showScreen('org-setup');
          _initOrgSetup();
          Toast.success('Conta criada com sucesso!');
        } catch (e) {
          errorReg.textContent = apiErrorMessage(e);
        }
      });
    });
  }

  /* ══════════════════════════════════════════
     ORG SETUP SCREEN
  ═══════════════════════════════════════════ */
  function _initOrgSetup() {
    const btnCreate    = $('org-btn-create');
    const btnJoin      = $('org-btn-join');
    const panelCreate  = $('org-panel-create');
    const panelJoin    = $('org-panel-join');

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

    // Create org
    $('org-create-submit').addEventListener('click', async () => {
      const name = $('org-create-name').value.trim();
      if (!name) { Toast.warning('Digite um nome para a organização.'); return; }

      await withLoading($('org-create-submit'), async () => {
        try {
          const org = await OrgAPI.create(name);
          state.org = org;

          // O backend já atualizou o role e organization_id do usuário.
          // Como não há endpoint GET /me, patchamos localmente com os
          // valores esperados (criador sempre vira admin).
          state.user = Auth.patchUser({
            organization_id: org.id,
            role: 'admin',
          });

          _initAppShell();
          showScreen('app');
          Router.start();
          Toast.success(`Organização "${name}" criada!`);
        } catch (e) {
          Toast.error(apiErrorMessage(e));
        }
      });
    });

    // Join org
    $('org-join-submit').addEventListener('click', async () => {
      const orgId = parseInt($('org-join-id').value.trim());
      if (!orgId) { Toast.warning('Digite o ID da organização.'); return; }

      await withLoading($('org-join-submit'), async () => {
        try {
          const org = await OrgAPI.join(orgId);
          state.org = org;
          state.user = Auth.patchUser({ organization_id: org.id });
          Auth.saveUser(state.user);
          _initAppShell();
          showScreen('app');
          Router.start();
          Toast.success(`Entrou em "${org.name}"!`);
        } catch (e) {
          Toast.error(apiErrorMessage(e));
        }
      });
    });

    // Logout link
    const logoutLink = $('org-setup-logout');
    if (logoutLink) {
      logoutLink.addEventListener('click', async (e) => {
        e.preventDefault();
        await Auth.logout();
        showScreen('auth');
      });
    }
  }

  /* ══════════════════════════════════════════
     APP SHELL (sidebar + topbar)
  ═══════════════════════════════════════════ */
  function _initAppShell() {
    // User chip
    const u = state.user;
    $('shell-user-name').textContent  = u?.name  || 'Usuário';
    $('shell-user-role').textContent  = u?.role  || 'member';
    $('shell-user-avatar').textContent = (u?.name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

    // Logout
    $('btn-shell-logout').addEventListener('click', async () => {
      const ok = await confirmDialog({
        title: 'Sair',
        message: 'Deseja encerrar sua sessão?',
        confirmLabel: 'Sair',
      });
      if (!ok) return;
      await Auth.logout();
      state.user = null;
      state.org  = null;
      state.projects = [];
      showScreen('auth');
      Router.navigate('dashboard');
    });

    // Register routes
    Router.on('dashboard',         () => _viewDashboard());
    Router.on('projects',          () => _viewProjects());
    Router.on('projects/:id',      ({ id }) => _viewTasks(parseInt(id)));

    // Nav items
    document.querySelectorAll('[data-nav]').forEach(el => {
      el.addEventListener('click', () => {
        Router.navigate(el.dataset.nav);
      });
    });

    // Highlight active nav on hash change
    window.addEventListener('hashchange', _updateNavActive);
    _updateNavActive();
  }

  function _updateNavActive() {
    const hash = window.location.hash.replace(/^#\/?/, '');
    document.querySelectorAll('[data-nav]').forEach(el => {
      const nav = el.dataset.nav;
      const active = hash === nav || hash.startsWith(nav + '/');
      el.classList.toggle('active', active);
    });
  }

  function _setTopbar(title, breadcrumb = null, actions = '') {
    $('topbar-title').textContent = title;
    const bc = $('topbar-breadcrumb');
    if (breadcrumb) {
      bc.innerHTML = breadcrumb;
      bc.style.display = 'flex';
    } else {
      bc.style.display = 'none';
    }
    $('topbar-actions').innerHTML = actions;
  }

  function _setContent(html) {
    $('main-view').innerHTML = html;
  }

  /* ══════════════════════════════════════════
     VIEW: DASHBOARD
  ═══════════════════════════════════════════ */
  async function _viewDashboard() {
    _updateNavActive();
    _setTopbar('Dashboard');
    _setContent(`<div class="loading-center"><div class="spinner"></div></div>`);

    try {
      const [projects] = await Promise.all([ProjectsAPI.list()]);
      state.projects = projects;

      // Fetch task counts from each project (first page)
      let totalTasks = 0, totalDone = 0, totalDoing = 0, totalTodo = 0;
      const taskPromises = projects.slice(0, 6).map(p =>
        TasksAPI.list(p.id, { per_page: 1 }).catch(() => null)
      );
      const taskResults = await Promise.all(taskPromises);

      // We only get accurate totals per project from the paginated response
      taskResults.forEach(r => { if (r) totalTasks += r.total; });

      // For status counts, fetch with filters
      if (projects.length) {
        const pid = projects[0].id;
        const [todo, doing, done] = await Promise.all([
          TasksAPI.list(pid, { status: 'todo',  per_page: 1 }).catch(() => ({ total: 0 })),
          TasksAPI.list(pid, { status: 'doing', per_page: 1 }).catch(() => ({ total: 0 })),
          TasksAPI.list(pid, { status: 'done',  per_page: 1 }).catch(() => ({ total: 0 })),
        ]);
        totalTodo  = todo.total;
        totalDoing = doing.total;
        totalDone  = done.total;
      }

      const recentProjects = [...projects]
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 6);

      const html = `
        <div class="page">
          <div class="org-banner">
            <div>
              <div class="org-banner__name">${escHtml(state.org?.name || '—')}</div>
              <div class="org-banner__meta">ID #${state.org?.id || '?'} · ${state.user?.role || 'member'}</div>
            </div>
            <span class="badge badge-${state.user?.role === 'admin' ? 'admin' : 'member'}">${state.user?.role || 'member'}</span>
          </div>

          <div class="stat-grid">
            <div class="stat-card stat-card--accent">
              <div class="stat-card__value">${projects.length}</div>
              <div class="stat-card__label">Projetos</div>
            </div>
            <div class="stat-card stat-card--info">
              <div class="stat-card__value">${totalTasks}</div>
              <div class="stat-card__label">Tarefas (proj.1)</div>
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
              ` : `<p class="text-muted text-sm">Nenhum projeto ainda.</p>`}
            </div>

            <div class="card">
              <div class="card-header">
                <h3>Organização</h3>
              </div>
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
                ${state.user?.role === 'admin' ? `
                  <button class="btn btn-sm" onclick="App._editOrg()">Editar organização</button>
                ` : ''}
              </div>
            </div>
          </div>
        </div>
      `;

      _setContent(html);
    } catch (e) {
      _setContent(`<div class="page"><p class="text-muted">Erro ao carregar dashboard: ${apiErrorMessage(e)}</p></div>`);
    }
  }

  /* ══════════════════════════════════════════
     VIEW: PROJECTS
  ═══════════════════════════════════════════ */
  async function _viewProjects() {
    _updateNavActive();
    _setTopbar('Projetos');
    _setContent(`<div class="loading-center"><div class="spinner"></div></div>`);

    try {
      const projects = await ProjectsAPI.list();
      state.projects = projects;
      _renderProjectsPage(projects);
    } catch (e) {
      _setContent(`<div class="page"><p class="text-muted">Erro: ${apiErrorMessage(e)}</p></div>`);
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
            <p class="empty-state__desc">Crie seu primeiro projeto para começar a organizar tarefas.</p>
          </div>
        ` : `
          <div class="projects-grid" id="projects-grid">
            ${projects.map(p => _projectCardHTML(p)).join('')}
          </div>
        `}
      </div>
    `;

    _setContent(html);

    // New project
    $('btn-new-project')?.addEventListener('click', () => _openNewProjectModal());

    // Card actions
    document.querySelectorAll('[data-open-project]').forEach(el => {
      el.addEventListener('click', () => Router.navigate(`projects/${el.dataset.openProject}`));
    });
    document.querySelectorAll('[data-edit-project]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const id   = parseInt(el.dataset.editProject);
        const proj = state.projects.find(p => p.id === id);
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
          message: `Excluir <strong>${escHtml(proj?.name)}</strong>? Esta ação não pode ser desfeita.`,
          confirmLabel: 'Excluir',
          danger: true,
        });
        if (!ok) return;
        try {
          await ProjectsAPI.remove(id);
          state.projects = state.projects.filter(p => p.id !== id);
          _renderProjectsPage(state.projects);
          Toast.success('Projeto excluído');
        } catch (err) {
          Toast.error(apiErrorMessage(err));
        }
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
              Toast.success(`Projeto "${p.name}" criado!`);
            } catch (e) {
              err.textContent = apiErrorMessage(e);
            }
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
        input.focus();
        input.select();

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
            } catch (e) {
              err.textContent = apiErrorMessage(e);
            }
          });
        });
      },
    });
  }

  /* ══════════════════════════════════════════
     VIEW: TASKS (Kanban)
  ═══════════════════════════════════════════ */
  let _taskState = {
    projectId: null,
    project:   null,
    filters:   { status: '', priority: '', page: 1, per_page: 20 },
    allTasks:  [],         // flat list fetched
    pagination: null,
  };

  async function _viewTasks(projectId) {
    _taskState.projectId = projectId;
    _taskState.filters   = { status: '', priority: '', page: 1, per_page: 50 };

    _setTopbar(
      'Carregando…',
      `<span class="topbar__breadcrumb-current">Projetos</span>
       <span class="topbar__breadcrumb-sep">/</span>
       <span>…</span>`
    );
    _setContent(`<div class="loading-center"><div class="spinner"></div></div>`);

    try {
      const project = await ProjectsAPI.get(projectId);
      _taskState.project = project;
      state.currentProject = project;

      _setTopbar(
        project.name,
        `<button class="btn btn-ghost btn-sm" onclick="Router.navigate('projects')" style="padding:4px 8px;">
           <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
           Projetos
         </button>
         <span class="topbar__breadcrumb-sep">/</span>
         <span class="topbar__breadcrumb-current">${escHtml(project.name)}</span>`
      );

      await _fetchAndRenderBoard();

    } catch (e) {
      _setContent(`<div class="page"><p class="text-muted">Projeto não encontrado ou sem acesso.</p></div>`);
    }
  }

  async function _fetchAndRenderBoard() {
    const { projectId, filters } = _taskState;

    // Fetch all statuses (up to per_page each for kanban view)
    const [todoRes, doingRes, doneRes] = await Promise.all([
      TasksAPI.list(projectId, { ...filters, status: 'todo',  page: 1, per_page: 30 }),
      TasksAPI.list(projectId, { ...filters, status: 'doing', page: 1, per_page: 30 }),
      TasksAPI.list(projectId, { ...filters, status: 'done',  page: 1, per_page: 30 }),
    ]);

    _taskState.allTasks = [
      ...todoRes.items,
      ...doingRes.items,
      ...doneRes.items,
    ];

    _renderBoard({
      todo:  { items: todoRes.items,  total: todoRes.total },
      doing: { items: doingRes.items, total: doingRes.total },
      done:  { items: doneRes.items,  total: doneRes.total },
    });
  }

  function _renderBoard(columns) {
    const { projectId, project, filters } = _taskState;

    const html = `
      <div class="page">
        <div class="kanban-toolbar">
          <button class="btn btn-primary btn-sm" id="btn-new-task">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nova tarefa
          </button>

          <span class="kanban-toolbar__sep"></span>

          <select class="input" id="filter-priority" style="width:130px;" title="Filtrar por prioridade">
            <option value="">Prioridade</option>
            <option value="high"   ${filters.priority==='high'   ? 'selected' : ''}>High</option>
            <option value="medium" ${filters.priority==='medium' ? 'selected' : ''}>Medium</option>
            <option value="low"    ${filters.priority==='low'    ? 'selected' : ''}>Low</option>
          </select>

          ${(filters.priority) ? `<button class="btn btn-ghost btn-sm" id="btn-clear-filters">Limpar filtros</button>` : ''}
        </div>

        <div class="kanban-board">
          ${_colHTML('todo',  'To Do',       columns.todo)}
          ${_colHTML('doing', 'In Progress', columns.doing)}
          ${_colHTML('done',  'Done',        columns.done)}
        </div>
      </div>
    `;

    _setContent(html);

    // Wire new task
    $('btn-new-task')?.addEventListener('click', () => _openNewTaskModal());

    // Wire filters
    $('filter-priority')?.addEventListener('change', async (e) => {
      _taskState.filters.priority = e.target.value;
      await _fetchAndRenderBoard();
    });

    $('btn-clear-filters')?.addEventListener('click', async () => {
      _taskState.filters = { status: '', priority: '', page: 1, per_page: 50 };
      await _fetchAndRenderBoard();
    });

    // Wire task card clicks
    document.querySelectorAll('[data-task-id]').forEach(el => {
      el.addEventListener('click', () => {
        const id   = parseInt(el.dataset.taskId);
        const task = _taskState.allTasks.find(t => t.id === id);
        if (task) {
          Drawer.open(task, projectId, _onTaskStatusChanged);
          Drawer.setMeta(projectId, task.id);
        }
      });
    });
  }

  function _colHTML(status, label, col) {
    const { items, total } = col;
    const extra = total > items.length ? ` (+${total - items.length})` : '';

    return `
      <div class="kanban-col kanban-col--${status}">
        <div class="kanban-col__header">
          <span class="kanban-col__title">
            <span class="kanban-col__dot"></span>
            ${label}
          </span>
          <span class="kanban-col__count">${total}${extra}</span>
        </div>
        <div class="kanban-col__body">
          ${items.length === 0
            ? `<div style="padding:16px 0;text-align:center;">
                 <span class="text-muted text-xs">Nenhuma tarefa</span>
               </div>`
            : items.map(t => _taskCardHTML(t)).join('')
          }
          <button
            class="btn btn-ghost btn-sm w-full"
            style="margin-top:4px;justify-content:center;"
            onclick="App._quickAddTask('${status}')"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Adicionar
          </button>
        </div>
      </div>
    `;
  }

  function _taskCardHTML(task) {
    return `
      <div class="task-card" data-task-id="${task.id}">
        <div class="task-card__title">${escHtml(task.title)}</div>
        <div class="task-card__footer">
          <div class="task-card__badges">
            ${Render.priorityBadge(task.priority)}
            ${task.assigned_to ? `<span class="task-card__assignee">#${task.assigned_to}</span>` : ''}
          </div>
          ${Render.deadlineBadge(task.deadline)}
        </div>
      </div>
    `;
  }

  function _onTaskStatusChanged(updatedTask) {
    // Update in local state and re-render board
    const idx = _taskState.allTasks.findIndex(t => t.id === updatedTask.id);
    if (idx > -1) _taskState.allTasks[idx] = updatedTask;
    _fetchAndRenderBoard();
  }

  /* ── New task modal ── */
  function _openNewTaskModal(defaultStatus = 'todo') {
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
            <label class="form-label">Atribuir a (ID usuário)</label>
            <input class="input" id="tf-assigned" type="number" placeholder="Opcional" />
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

          const data = {
            title,
            description:  $('tf-desc').value.trim()     || null,
            status:       $('tf-status').value,
            priority:     $('tf-priority').value,
            assigned_to:  parseInt($('tf-assigned').value) || null,
            deadline:     $('tf-deadline').value || null,
          };

          await withLoading($('tf-submit'), async () => {
            try {
              const task = await TasksAPI.create(_taskState.projectId, data);
              _taskState.allTasks.push(task);
              Modal.close();
              await _fetchAndRenderBoard();
              Toast.success('Tarefa criada!');
            } catch (e) {
              err.textContent = apiErrorMessage(e);
            }
          });
        });
      },
    });
  }

  /* Atalho: botão "Adicionar" direto na coluna */
  function _quickAddTask(status) {
    _openNewTaskModal(status);
  }

  /* ══════════════════════════════════════════
     Org edit (chamado do dashboard)
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
            } catch (e) {
              err.textContent = apiErrorMessage(e);
            }
          });
        });
      },
    });
  }

  /* ── Public ── */
  return {
    init,
    goTo,
    _editOrg,
    _quickAddTask,
  };

})();

/* ── Bootstrap ── */
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});