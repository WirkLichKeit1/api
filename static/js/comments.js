/**
 * comments.js — CRUD de comentários
 */

const CommentsAPI = (() => {

  async function list(projectId, taskId) {
    const res = await http.get(`/projects/${projectId}/tasks/${taskId}/comments`);
    return res.data;
  }

  async function create(projectId, taskId, content) {
    const res = await http.post(
      `/projects/${projectId}/tasks/${taskId}/comments`,
      { content }
    );
    return res.data;
  }

  async function remove(projectId, taskId, commentId) {
    const res = await http.delete(
      `/projects/${projectId}/tasks/${taskId}/comments/${commentId}`
    );
    return res.data;
  }

  return { list, create, remove };
})();