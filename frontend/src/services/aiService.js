import { request } from './api';

export const aiService = {
  previewTriage: async (symptomData) => {
    return request('/ai/preview-triage', {
      method: 'POST',
      body: JSON.stringify(symptomData)
    });
  }
};

