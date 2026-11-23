/**
 * Centralized API Service for HealthPulse TeleConsultation Portal
 * Handles BASE_URL resolution from environment, CSRF double-submit token synchronization,
 * and session-cookie credentials ('include').
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

let cachedCsrfToken = null;

/**
 * Fetch fresh CSRF token and ensure XSRF-TOKEN cookie is initialized
 */
export async function getCsrfToken(forceRefresh = false) {
  if (!forceRefresh && cachedCsrfToken) return cachedCsrfToken;

  if (!forceRefresh) {
    const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
    if (match) {
      cachedCsrfToken = decodeURIComponent(match[1]);
      return cachedCsrfToken;
    }
  }

  try {
    const res = await fetch(`${BASE_URL}/csrf`, { credentials: 'include' });
    if (res.ok) {
      const data = await res.json();
      cachedCsrfToken = data.token;
      return cachedCsrfToken;
    }
  } catch (err) {
    console.warn('Could not fetch CSRF token:', err);
  }
  return null;
}

/**
 * Universal JSON Fetch wrapper with session cookie and CSRF handling.
 * Unwraps Spring Boot ApiResponse data property so caller receives the actual payload.
 */
export async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const method = (options.method || 'GET').toUpperCase();

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  // For mutating requests (POST, PUT, DELETE, PATCH), attach CSRF token header
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    const csrfToken = await getCsrfToken();
    if (csrfToken) {
      headers['X-XSRF-TOKEN'] = csrfToken;
      headers['X-CSRF-TOKEN'] = csrfToken;
    }
  }

  const config = {
    ...options,
    headers,
    credentials: 'include' // Transmit Spring Security JSESSIONID session cookie
  };

  try {
    let response = await fetch(url, config);

    // If 403 Forbidden received on a mutating request, retry once after refreshing CSRF token
    if (response.status === 403 && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
      cachedCsrfToken = null;
      const refreshedToken = await getCsrfToken(true);
      if (refreshedToken) {
        headers['X-XSRF-TOKEN'] = refreshedToken;
        headers['X-CSRF-TOKEN'] = refreshedToken;
        response = await fetch(url, { ...config, headers });
      }
    }

    const result = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMessage = result?.message || `Request failed with HTTP status ${response.status}`;
      const validationErrors = result?.data || null;
      const error = new Error(errorMessage);
      error.status = response.status;
      error.validationErrors = validationErrors;
      throw error;
    }

    // Auto-unwrap ApiResponse.data so callers receive data directly while preserving full payload if needed
    if (result && typeof result === 'object' && result.data !== undefined) {
      return result.data;
    }

    return result;
  } catch (err) {
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      throw new Error('Network error: Unable to reach the backend server. Please verify backend is running on port 8080.');
    }
    throw err;
  }
}

// Domain-Specific API Services

export const doctorApi = {
  async getAll(specialization = '') {
    const ep = specialization ? `/doctors?specialization=${encodeURIComponent(specialization)}` : '/doctors';
    const data = await request(ep, { method: 'GET' });
    return Array.isArray(data) ? data : data?.data || [];
  },

  async getById(id) {
    const res = await request(`/doctors/${id}`, { method: 'GET' });
    return res?.data !== undefined ? res.data : res;
  }
};

export const appointmentApi = {
  async getAll(params = {}) {
    const query = new URLSearchParams();
    if (params.doctorId) query.append('doctorId', params.doctorId);
    if (params.patientEmail) query.append('patientEmail', params.patientEmail);
    if (params.patientId) query.append('patientId', params.patientId);
    if (params.status && params.status !== 'ALL') query.append('status', params.status);

    const qs = query.toString();
    const endpoint = qs ? `/appointments?${qs}` : '/appointments';
    const data = await request(endpoint, { method: 'GET' });
    return Array.isArray(data) ? data : data?.data || [];
  },

  async getById(id) {
    const res = await request(`/appointments/${id}`, { method: 'GET' });
    return res?.data !== undefined ? res.data : res;
  },

  async create(data) {
    const res = await request('/appointments', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return res?.data !== undefined ? res.data : res;
  },

  async updateStatus(id, status, consultationNotes = '') {
    const res = await request(`/appointments/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, consultationNotes })
    });
    return res?.data !== undefined ? res.data : res;
  }
};

export const authApi = {
  async login(email, password) {
    const res = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    return res?.data !== undefined ? res.data : res;
  },

  async register(userData) {
    const res = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
    return res?.data !== undefined ? res.data : res;
  },

  async logout() {
    return request('/auth/logout', { method: 'POST' });
  },

  async getMe(userId) {
    const res = await request(`/auth/me/${userId}`, { method: 'GET' });
    return res?.data !== undefined ? res.data : res;
  }
};

export const aiApi = {
  async previewTriage(payload) {
    const res = await request('/ai/preview-triage', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    return res?.data !== undefined ? res.data : res;
  }
};

export default {
  request,
  getCsrfToken,
  doctor: doctorApi,
  appointment: appointmentApi,
  auth: authApi,
  ai: aiApi
};
