const API_BASE_URL = 'https://api.milliycrm.uz/api';

const getToken = () => localStorage.getItem('adminToken');

const clearAuthAndRedirect = () => {
  localStorage.removeItem('adminToken');
  localStorage.removeItem('adminData');
  window.location.href = '/login';
};

const normalizeAdmin = (admin) => {
  if (!admin || typeof admin !== 'object') return admin;
  return {
    ...admin,
    id: admin.id ?? admin._id,
    _id: admin._id ?? admin.id,
    fullName:
      admin.fullName ??
      [admin.firstName, admin.lastName].filter(Boolean).join(' ').trim(),
  };
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
    if (response.status === 401 && !endpoint.includes('/auth/login')) {
      clearAuthAndRedirect();
    }
    throw new Error(data?.message || data?.error || "So'rovda xatolik yuz berdi");
  }

  return data ?? { success: true };
};

export const adminAPI = {
  login: async (username, password) =>
    apiRequest(
      '/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      },
      false
    ),

  getMe: async () => {
    const response = await apiRequest('/admins/me');
    return { ...response, data: normalizeAdmin(response?.data ?? response) };
  },

  getAllAdmins: async () => {
    const response = await apiRequest('/admins');
    const items = Array.isArray(response?.data)
      ? response.data
      : Array.isArray(response)
        ? response
        : [];
    return { ...response, data: items.map(normalizeAdmin) };
  },

  getAdminById: async (id) => {
    const response = await apiRequest(`/admins/${id}`);
    return { ...response, data: normalizeAdmin(response?.data ?? response) };
  },

  createAdmin: async (payload) =>
    apiRequest('/admins', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateAdmin: async (id, payload) =>
    apiRequest(`/admins/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  deleteAdmin: async (id) =>
    apiRequest(`/admins/${id}`, {
      method: 'DELETE',
    }),
};

const normalizeOmbor = (item) => {
  if (!item || typeof item !== 'object') return item;
  return {
    ...item,
    id: item.id ?? item._id,
    _id: item._id ?? item.id,
  };
};

export const omborAPI = {
  getAll: async () => {
    const response = await apiRequest('/omborlar');
    const items = Array.isArray(response?.data)
      ? response.data
      : Array.isArray(response)
        ? response
        : [];
    return { ...response, data: items.map(normalizeOmbor) };
  },
  getById: async (id) => {
    const response = await apiRequest(`/omborlar/${id}`);
    return { ...response, data: normalizeOmbor(response?.data ?? response) };
  },
  create: async (payload) =>
    apiRequest('/omborlar', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  update: async (id, payload) =>
    apiRequest(`/omborlar/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  delete: async (id) =>
    apiRequest(`/omborlar/${id}`, {
      method: 'DELETE',
    }),
};

const normalizeOmborRef = (ref) => {
  if (!ref) return null;
  if (typeof ref === 'object') {
    return {
      ...ref,
      id: ref.id ?? ref._id,
      _id: ref._id ?? ref.id,
      name: ref.name ?? null,
    };
  }
  return { id: ref, _id: ref, name: null };
};

const normalizeOmborchi = (item) => {
  if (!item || typeof item !== 'object') return item;

  let ombors = [];
  if (Array.isArray(item.ombors)) {
    ombors = item.ombors.map(normalizeOmborRef).filter(Boolean);
  } else if (item.ombor) {
    const single = normalizeOmborRef(item.ombor);
    if (single) ombors = [single];
  }

  const omborIds = ombors.map((o) => o.id).filter(Boolean);

  return {
    ...item,
    id: item.id ?? item._id,
    _id: item._id ?? item.id,
    ombors,
    omborIds,
    ombor: ombors[0] ?? null,
    omborId: omborIds[0] ?? null,
  };
};

export const omborchiAPI = {
  getAll: async () => {
    const response = await apiRequest('/omborchilar');
    const items = Array.isArray(response?.data)
      ? response.data
      : Array.isArray(response)
        ? response
        : [];
    return { ...response, data: items.map(normalizeOmborchi) };
  },
  getById: async (id) => {
    const response = await apiRequest(`/omborchilar/${id}`);
    return { ...response, data: normalizeOmborchi(response?.data ?? response) };
  },
  create: async (payload) =>
    apiRequest('/omborchilar', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  update: async (id, payload) =>
    apiRequest(`/omborchilar/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  delete: async (id) =>
    apiRequest(`/omborchilar/${id}`, {
      method: 'DELETE',
    }),
  attachOmbor: async (id, omborId) =>
    apiRequest(`/omborchilar/${id}/attach-ombor`, {
      method: 'PATCH',
      body: JSON.stringify({ omborId }),
    }),
  detachOmbor: async (id, omborId) =>
    apiRequest(`/omborchilar/${id}/detach-ombor`, {
      method: 'PATCH',
      body: JSON.stringify({ omborId }),
    }),
};

const normalizeMaxsulot = (item) => {
  if (!item || typeof item !== 'object') return item;
  return {
    ...item,
    id: item.id ?? item._id,
    _id: item._id ?? item.id,
  };
};

export const maxsulotAPI = {
  getAll: async () => {
    const response = await apiRequest('/maxsulotlar');
    const items = Array.isArray(response?.data)
      ? response.data
      : Array.isArray(response)
        ? response
        : [];
    return { ...response, data: items.map(normalizeMaxsulot) };
  },
  getById: async (id) => {
    const response = await apiRequest(`/maxsulotlar/${id}`);
    return { ...response, data: normalizeMaxsulot(response?.data ?? response) };
  },
  create: async (payload) =>
    apiRequest('/maxsulotlar', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  update: async (id, payload) =>
    apiRequest(`/maxsulotlar/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  delete: async (id) =>
    apiRequest(`/maxsulotlar/${id}`, {
      method: 'DELETE',
    }),
};

const buildQueryString = (params = {}) => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    if (typeof value === 'boolean') {
      searchParams.append(key, value ? 'true' : 'false');
      return;
    }
    searchParams.append(key, String(value));
  });
  const qs = searchParams.toString();
  return qs ? `?${qs}` : '';
};

const normalizeStatistikaItem = (item) => {
  if (!item || typeof item !== 'object') return item;
  return {
    ...item,
    id: item.id ?? item._id,
    _id: item._id ?? item.id,
    type: item.type || item.amalTuri || item.operationType || '',
    omborchi: item.omborchi || item.sender || item.owner || null,
    recipientOmbor: normalizeOmborRef(item.recipientOmbor) || normalizeOmborRef(item.recipientOmborId),
    product: item.product || item.maxsulot || null,
    ombor: normalizeOmborRef(item.ombor) || normalizeOmborRef(item.omborId),
  };
};

const normalizeStatistikaResponse = (response) => {
  const rawData = Array.isArray(response?.data)
    ? response.data
    : Array.isArray(response?.items)
      ? response.items
      : Array.isArray(response?.results)
        ? response.results
        : Array.isArray(response)
          ? response
          : [];

  const byType = response?.summary?.byType || null;
  const normalizedByType = byType
    ? Object.fromEntries(
        Object.entries(byType).map(([key, value]) => [
          key,
          {
            count: value?.count ?? 0,
            netWeightKg: value?.netWeightKg ?? 0,
          },
        ])
      )
    : null;

  return {
    ...response,
    data: rawData.map(normalizeStatistikaItem),
    summary: response?.summary
      ? { ...response.summary, byType: normalizedByType }
      : null,
    pagination: response?.pagination ?? null,
    count: response?.count ?? rawData.length,
    filters: response?.filters ?? null,
  };
};

export const statistikaAPI = {
  getAll: async (params = {}) =>
    normalizeStatistikaResponse(await apiRequest(`/admin-statistika/all${buildQueryString(params)}`)),

  getKirimlar: async (params = {}) =>
    normalizeStatistikaResponse(await apiRequest(`/admin-statistika/kirimlar${buildQueryString(params)}`)),

  getChiqimlar: async (params = {}) =>
    normalizeStatistikaResponse(await apiRequest(`/admin-statistika/chiqimlar${buildQueryString(params)}`)),

  getQabulQilganlar: async (params = {}) =>
    normalizeStatistikaResponse(
      await apiRequest(`/admin-statistika/qabul-qilganlar${buildQueryString(params)}`)
    ),

  startExport: async ({ scope, filters = {} }) =>
    apiRequest('/admin-statistika/export', {
      method: 'POST',
      body: JSON.stringify({ scope, filters }),
    }),

  getExportStatus: async (jobId) => apiRequest(`/admin-statistika/export/${jobId}`),

  downloadExport: async (jobId) => {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/admin-statistika/export/${jobId}/download`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        clearAuthAndRedirect();
      }
      let message = "Yuklab olishda xatolik yuz berdi";
      try {
        const data = await response.json();
        message = data?.message || data?.error || message;
      } catch {
        // ignore parse errors
      }
      throw new Error(message);
    }

    const blob = await response.blob();
    const disposition = response.headers.get('Content-Disposition');
    let filename = `statistika-${jobId}.xlsx`;
    const match = disposition?.match(/filename\*?=(?:UTF-8''|")?([^";\n]+)/i);
    if (match?.[1]) {
      filename = decodeURIComponent(match[1].replace(/['"]/g, ''));
    }

    return { blob, filename };
  },
};

const normalizeAriza = (item) => {
  if (!item || typeof item !== 'object') return item;
  return {
    ...item,
    id: item.id ?? item._id,
    _id: item._id ?? item.id,
  };
};

const normalizeArizaListResponse = (response) => {
  const items = Array.isArray(response?.data) ? response.data : [];
  return {
    ...response,
    data: items.map(normalizeAriza),
    pagination: response?.pagination ?? null,
    count: response?.count ?? items.length,
  };
};

const createAdminArizaAPI = (basePath) => ({
  getAll: async (params = {}) =>
    normalizeArizaListResponse(await apiRequest(`${basePath}${buildQueryString(params)}`)),

  getById: async (id) => {
    const response = await apiRequest(`${basePath}/${id}`);
    return { ...response, data: normalizeAriza(response?.data ?? response) };
  },

  update: async (id, payload) => {
    const response = await apiRequest(`${basePath}/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return { ...response, data: normalizeAriza(response?.data ?? response) };
  },
});

export const adminKirimArizalariAPI = createAdminArizaAPI('/admin-kirim-arizalari');
export const adminChiqimArizalariAPI = createAdminArizaAPI('/admin-chiqim-arizalari');

export const adminDashboardAPI = {
  getDashboard: async (params = {}) =>
    apiRequest(`/admin-dashboard${buildQueryString(params)}`),
};

