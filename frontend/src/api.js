import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Set auth token helper
export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

// Set token from localStorage on page load
const token = localStorage.getItem('token');
if (token) {
  setAuthToken(token);
}

// Auth API
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me')
};

// Admin API
export const adminAPI = {
  // Users
  getUsers: () => api.get('/admin/users'),
  createUser: (userData) => api.post('/admin/users', userData),
  updateUser: (id, userData) => api.put(`/admin/users/${id}`, userData),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  
  // Answer CSV
  uploadAnswerCSV: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/admin/answer-csv', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  getAnswerCSV: () => api.get('/admin/answer-csv'),
  
  // Config
  updateConfig: (key, value) => api.put('/admin/config', { key, value }),
  getConfig: (key) => api.get(`/admin/config/${key}`),
  
  // Submissions
  getAllSubmissions: () => api.get('/admin/submissions')
};

// Submission API
export const submissionAPI = {
  upload: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/submissions/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  getMySubmissions: () => api.get('/submissions'),
  getSubmission: (id) => api.get(`/submissions/${id}`),
  getBestSubmission: () => api.get('/submissions/user/best')
};

// Leaderboard API
export const leaderboardAPI = {
  getLeaderboard: (limit = 50, includeRank = false) => 
    api.get('/leaderboard', { params: { limit, includeRank } })
};

export default api;
