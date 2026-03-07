/**
 * tasks.js — CRUD de tarefas com filtros e paginação
 */

const TasksAPI = (() => {

  /**
   * Lista tarefas de um projeto com filtros e paginação.
   * @param {number} projectId
   * @param {Object} opts - { status, priority, assigned_to, page, per_page }
   */
  async function list(projectId, opts = {}) {
    const params = {};
    if (opts.status)      params.status      = opts.status;
    if (opts.priority)    params.priority    = opts.priority;
    if (opts.assigned_to) params.assigned_to = opts.assigned_to;
    params.page     = opts.page     || 1;
    params.per_page = opts.per_page || 20;

    const res = await http.get(`/projects/${projectId}/tasks`, { params });
    return res.data; // { items, total, pages, page, per_page }
  }

  async function get(projectId, taskId) {
    const res = await http.get(`/projects/${projectId}/tasks/${taskId}`);
    return res.data;
  }

  /**
   * Cria tarefa.
   * @param {number} projectId
   * @param {Object} data - { title, description, status, priority, assigned_to, deadline }
   */
  async function create(projectId, data) {
    const payload = { ...data };
    // Remove campos vazios para não enviar null desnecessariamente
    Object.keys(payload).forEach((k) => {
      if (payload[k] === '' || payload[k] === null || payload[k] === undefined) {
        delete payload[k];
      }
    });
    const res = await http.post(`/projects/${projectId}/tasks`, payload);
    return res.data;
  }

  /**
   * Atualiza tarefa parcialmente.
   * @param {number} projectId
   * @param {number} taskId
   * @param {Object} data - campos a atualizar
   */
  async function update(projectId, taskId, data) {
    const payload = { ...data };
    Object.keys(payload).forEach((k) => {
      if (payload[k] === '' || payload[k] === undefined) {
        delete payload[k];
      }
    });
    const res = await http.patch(`/projects/${projectId}/tasks/${taskId}`, payload);
    return res.data;
  }

  async function remove(projectId, taskId) {
    const res = await http.delete(`/projects/${projectId}/tasks/${taskId}`);
    return res.data;
  }

  return { list, get, create, update, remove };
})();