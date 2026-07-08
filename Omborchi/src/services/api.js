const API_BASE_URL = 'https://api.milliycrm.uz/api';

const getToken = () => localStorage.getItem('authToken');

const clearAuthAndRedirect = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('authData');
  window.location.href = '/login';
};

const apiRequest = async (endpoint, options = {}, requiresAuth = true) => {
  const token = getToken();
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(requiresAuth && token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    if (response.status === 401 && endpoint !== '/auth/omborchi/login') {
      clearAuthAndRedirect();
    }
    throw new Error(data?.message || data?.error || 'So‘rovda xatolik yuz berdi');
  }

  return data ?? { success: true };
};

export const authAPI = {
  loginOmborchi: async (username, password) =>
    apiRequest(
      '/auth/omborchi/login',
      {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      },
      false
    ),

  getOmborchiProfile: async () => apiRequest('/auth/omborchi/profile'),

  getOmborchiOmbors: async () => apiRequest('/auth/omborchi/ombors'),

  changeOmborchiPassword: async (oldPassword, newPassword) =>
    apiRequest('/auth/omborchi/change-password', {
      method: 'PATCH',
      body: JSON.stringify({ oldPassword, newPassword }),
    }),
};

export const omborchiKirimAPI = {
  getOmbors: async () => apiRequest('/omborchi-kirimlar/ombors'),
  getProducts: async () => apiRequest('/omborchi-kirimlar/products'),
  createKirim: async (payload) =>
    apiRequest('/omborchi-kirimlar', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateKirim: async (id, payload) =>
    apiRequest(`/omborchi-kirimlar/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  deleteKirim: async (id) =>
    apiRequest(`/omborchi-kirimlar/${id}`, {
      method: 'DELETE',
    }),
  getMyKirimlar: async () => apiRequest('/omborchi-kirimlar/my'),
};

export const omborchiKirimArizalariAPI = {
  create: async (payload) =>
    apiRequest('/omborchi-kirim-arizalari', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getList: async (status) => {
    const query = status ? `?status=${encodeURIComponent(status)}` : '';
    return apiRequest(`/omborchi-kirim-arizalari${query}`);
  },
  getOne: async (id) => apiRequest(`/omborchi-kirim-arizalari/${id}`),
};

export const omborchiChiqimAPI = {
  getOmbors: async () => apiRequest('/omborchi-chiqimlar/ombors'),
  getOmborProducts: async (omborId) =>
    apiRequest(`/omborchi-chiqimlar/ombors/${omborId}/products`),
  getRecipientOmbors: async (sourceOmborId) => {
    const query = sourceOmborId ? `?sourceOmborId=${encodeURIComponent(sourceOmborId)}` : '';
    return apiRequest(`/omborchi-chiqimlar/recipient-ombors${query}`);
  },
  createChiqim: async (payload) =>
    apiRequest('/omborchi-chiqimlar', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getMyChiqimlar: async () => apiRequest('/omborchi-chiqimlar'),
  getChiqim: async (id) => apiRequest(`/omborchi-chiqimlar/${id}`),
};

export const omborchiChiqimArizalariAPI = {
  create: async (payload) =>
    apiRequest('/omborchi-chiqim-arizalari', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getList: async (status) => {
    const query = status ? `?status=${encodeURIComponent(status)}` : '';
    return apiRequest(`/omborchi-chiqim-arizalari${query}`);
  },
  getOne: async (id) => apiRequest(`/omborchi-chiqim-arizalari/${id}`),
};

export const omborchiKelayotganKirimAPI = {
  getList: async (status) => {
    const query = status ? `?status=${encodeURIComponent(status)}` : '';
    return apiRequest(`/omborchi-kelayotgan-kirimlar${query}`);
  },
  getOne: async (id) => apiRequest(`/omborchi-kelayotgan-kirimlar/${id}`),
  qabul: async (id) =>
    apiRequest(`/omborchi-kelayotgan-kirimlar/${id}/qabul`, {
      method: 'POST',
    }),
  bekor: async (id) =>
    apiRequest(`/omborchi-kelayotgan-kirimlar/${id}/bekor`, {
      method: 'POST',
    }),
};

export const omborchiBalansAPI = {
  getBalans: async () => apiRequest('/omborchi-balans'),
};

export const omborchiDashboardAPI = {
  getDashboard: async () => apiRequest('/omborchi-dashboard'),
};

const buildQueryString = (params = {}) => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    searchParams.append(key, String(value));
  });
  const query = searchParams.toString();
  return query ? `?${query}` : '';
};

export const omborchiStatistikaAPI = {
  getAll: async (params) => apiRequest(`/omborchi-statistika/all${buildQueryString(params)}`),
  getKirimlar: async (params) => apiRequest(`/omborchi-statistika/kirimlar${buildQueryString(params)}`),
  getChiqimlar: async (params) => apiRequest(`/omborchi-statistika/chiqimlar${buildQueryString(params)}`),
  getQabulQilganlar: async (params) =>
    apiRequest(`/omborchi-statistika/qabul-qilganlar${buildQueryString(params)}`),
};

