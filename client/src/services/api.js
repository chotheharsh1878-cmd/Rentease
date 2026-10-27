import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor to inject JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('rentease_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Session expired or invalid
      if (localStorage.getItem('rentease_token')) {
        localStorage.removeItem('rentease_token');
        localStorage.removeItem('rentease_user');
        window.dispatchEvent(new Event('auth:logout'));
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (passwords) => api.put('/auth/password', passwords)
};

export const propertyApi = {
  getProperties: (params) => api.get('/properties', { params }),
  getPropertyById: (id) => api.get(`/properties/${id}`),
  getFeatured: (limit = 6) => api.get('/properties/featured', { params: { limit } }),
  getMyProperties: () => api.get('/properties/my'),
  createProperty: (data) => api.post('/properties', data),
  updateProperty: (id, data) => api.put(`/properties/${id}`, data),
  deleteProperty: (id) => api.delete(`/properties/${id}`)
};

export const favoriteApi = {
  getFavorites: () => api.get('/favorites'),
  getFavoriteIds: () => api.get('/favorites/ids'),
  addFavorite: (propertyId) => api.post(`/favorites/${propertyId}`),
  removeFavorite: (propertyId) => api.delete(`/favorites/${propertyId}`)
};

export const inquiryApi = {
  create: (data) => api.post('/inquiries', data),
  getMyInquiries: () => api.get('/inquiries/my'),
  getOwnerInquiries: () => api.get('/inquiries/owner'),
  getById: (id) => api.get(`/inquiries/${id}`),
  updateStatus: (id, status) => api.patch(`/inquiries/${id}/status`, { status }),
  addReply: (id, message) => api.post(`/inquiries/${id}/replies`, { message })
};

export const chatApi = {
  sendMessage: (message, sessionId) => api.post('/chat', { message, sessionId }),
  getHistory: (sessionId) => api.get('/chat/history', { params: { sessionId } }),
  clearHistory: (sessionId) => api.delete('/chat/history', { params: { sessionId } })
};

export const adminApi = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: () => api.get('/admin/users'),
  toggleUserActive: (id, is_active) => api.patch(`/admin/users/${id}/toggle`, { is_active }),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getPendingProperties: () => api.get('/admin/properties/pending'),
  updateApproval: (id, approval_status) => api.patch(`/admin/properties/${id}/approval`, { approval_status })
};

export const faqApi = {
  getFaqs: (category) => api.get('/faqs', { params: { category } })
};

export const visitApi = {
  create: (data) => api.post('/visits', data),
  getMyVisits: () => api.get('/visits/my'),
  getOwnerVisits: () => api.get('/visits/owner'),
  updateStatus: (id, status) => api.patch(`/visits/${id}/status`, { status }),
  cancel: (id) => api.delete(`/visits/${id}`)
};

export const globalPropertyApi = {
  search: (params) => api.get('/global-properties', { params }),
  getById: (id) => api.get(`/global-properties/${id}`)
};

export const neighborhoodApi = {
  getCity: (city) => api.get('/neighborhood', { params: { city } }),
  getNearby: (params) => api.get('/neighborhood/nearby', { params })
};

export default api;

