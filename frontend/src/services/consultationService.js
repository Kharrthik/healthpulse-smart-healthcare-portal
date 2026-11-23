import { request } from './api';

export const consultationService = {
  bookConsultation: async (data) => {
    return request('/consultations', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  getConsultations: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.patientId) query.append('patientId', params.patientId);
    if (params.doctorId) query.append('doctorId', params.doctorId);
    if (params.status) query.append('status', params.status);
    const queryString = query.toString();
    return request(`/consultations${queryString ? '?' + queryString : ''}`);
  },

  getConsultationById: async (id) => {
    return request(`/consultations/${id}`);
  },

  updateStatus: async (id, status) => {
    return request(`/consultations/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
  },

  getAiPrep: async (id) => {
    return request(`/consultations/${id}/ai-prep`);
  }
};

