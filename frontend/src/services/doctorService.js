import { request } from './api';

export const doctorService = {
  getDoctors: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.specialization && params.specialization !== 'ALL') {
      query.append('specialization', params.specialization);
    }
    if (params.maxFee) {
      query.append('maxFee', params.maxFee);
    }
    if (params.search) {
      query.append('search', params.search);
    }
    const queryString = query.toString();
    return request(`/doctors${queryString ? '?' + queryString : ''}`);
  },

  getDoctorById: async (id) => {
    return request(`/doctors/${id}`);
  }
};

