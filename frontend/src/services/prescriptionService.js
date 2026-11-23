import { request } from './api';

export const prescriptionService = {
  createPrescription: async (consultationId, data) => {
    return request(`/prescriptions/consultation/${consultationId}`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  getPrescriptionByConsultation: async (consultationId) => {
    return request(`/prescriptions/consultation/${consultationId}`);
  },

  getPrescriptionsByDoctor: async (doctorId) => {
    return request(`/prescriptions/doctor/${doctorId}`);
  }
};

