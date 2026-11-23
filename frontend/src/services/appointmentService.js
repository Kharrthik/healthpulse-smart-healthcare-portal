import { request } from './api';

export const appointmentService = {
  /**
   * Book a new appointment
   * @param {Object} data - { doctorId, patientName, patientEmail, patientPhone, appointmentDateTime, reason, patientId }
   */
  async createAppointment(data) {
    const res = await request('/appointments', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return res.data;
  },

  /**
   * Fetch appointments with optional filters (doctorId, patientEmail, patientId, status)
   */
  async getAppointments(params = {}) {
    const query = new URLSearchParams();
    if (params.doctorId) query.append('doctorId', params.doctorId);
    if (params.patientEmail) query.append('patientEmail', params.patientEmail);
    if (params.patientId) query.append('patientId', params.patientId);
    if (params.status) query.append('status', params.status);

    const queryString = query.toString();
    const endpoint = queryString ? `/appointments?${queryString}` : '/appointments';

    const res = await request(endpoint, { method: 'GET' });
    return res.data;
  },

  /**
   * Get single appointment details by ID
   */
  async getAppointmentById(id) {
    const res = await request(`/appointments/${id}`, { method: 'GET' });
    return res.data;
  },

  /**
   * Update appointment status and record doctor consultation notes
   * @param {number} id
   * @param {string} status - PENDING, CONFIRMED, CANCELLED, COMPLETED
   * @param {string} consultationNotes - optional doctor notes
   */
  async updateStatus(id, status, consultationNotes = '') {
    const res = await request(`/appointments/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, consultationNotes })
    });
    return res.data;
  }
};

