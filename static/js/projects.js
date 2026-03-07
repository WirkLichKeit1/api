/**
 * projects.js — CRUD de projetos
 */

const ProjectsAPI = (() => {

  async function list() {
    const res = await http.get('/projects');
    return res.data;
  }

  async function get(id) {
    const res = await http.get(`/projects/${id}`);
    return res.data;
  }

  async function create(name) {
    const res = await http.post('/projects', { name });
    return res.data;
  }

  async function update(id, name) {
    const res = await http.patch(`/projects/${id}`, { name });
    return res.data;
  }

  async function remove(id) {
    const res = await http.delete(`/projects/${id}`);
    return res.data;
  }

  return { list, get, create, update, remove };
})();