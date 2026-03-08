/**
 * organizations.js — CRUD de organizações
 */

const OrgAPI = (() => {

  async function create(name) {
    const res = await http.post('/organizations', { name });
    return res.data;
  }

  async function get(id) {
    const res = await http.get(`/organizations/${id}`);
    return res.data;
  }

  async function getMembers(id) {
    const res = await http.get(`/organizations/${id}/members`);
    return res.data;
  }

  async function update(id, name) {
    const res = await http.patch(`/organizations/${id}`, { name });
    return res.data;
  }

  async function remove(id) {
    const res = await http.delete(`/organizations/${id}`);
    return res.data;
  }

  async function join(id) {
    const res = await http.post(`/organizations/${id}/join`);
    return res.data;
  }

  return { create, get, update, remove, join };
})();

window.OrgAPI = OrgAPI;