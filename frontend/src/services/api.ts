import axios from 'axios';
import { PropertyDetails, ImageItem, VideoCustomization, JobStatus, PropertyPreset } from '../types';

const client = axios.create({
  baseURL: '',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const api = {
  // Health
  checkHealth: async () => {
    const res = await client.get('/api/health');
    return res.data;
  },

  // Property & Presets
  getPresets: async (): Promise<{ presets: PropertyPreset[] }> => {
    const res = await client.get('/api/property/presets');
    return res.data;
  },

  getCategories: async (): Promise<{ categories: string[] }> => {
    const res = await client.get('/api/property/categories');
    return res.data;
  },

  validateProperty: async (details: PropertyDetails) => {
    const res = await client.post('/api/property/validate', details);
    return res.data;
  },

  // Image Upload
  uploadImages: async (files: File[]): Promise<ImageItem[]> => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });
    const res = await client.post('/api/upload/images', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },

  // Voice Preview
  previewVoice: async (params: {
    text: string;
    tld?: string;
    lang?: string;
    voice_gender?: string;
    slow?: boolean;
  }) => {
    const res = await client.post('/api/voice/preview', params);
    return res.data;
  },

  // Video Generation & Status
  generateVideo: async (property_details: PropertyDetails, customization: VideoCustomization) => {
    const res = await client.post('/api/video/generate', {
      property_details,
      customization,
    });
    return res.data as { job_id: string; status: string; message: string };
  },

  getVideoStatus: async (jobId: string): Promise<JobStatus> => {
    const res = await client.get(`/api/video/status/${jobId}`);
    return res.data;
  },

  getProjects: async (): Promise<JobStatus[]> => {
    const res = await client.get('/api/projects');
    return res.data;
  },

  getDownloadUrl: (jobId: string): string => {
    return `/api/video/download/${jobId}`;
  },
};

