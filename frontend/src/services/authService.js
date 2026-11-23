import { request } from './api';

export const authService = {
  login: async (email, password) => {
    return request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  },

  register: async (userData) => {
    return request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  },

  logout: async () => {
    return request('/auth/logout', {
      method: 'POST'
    });
  },

  getProfile: async (userId) => {
    return request(`/auth/me/${userId}`);
  }
};
