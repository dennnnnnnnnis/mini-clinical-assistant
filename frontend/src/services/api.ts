import axios from 'axios';
import { 
  Patient, 
  ClinicalNote, 
  MedicalCode, 
  PatientFormData, 
  NoteFormData,
  NoteAssistance,
  CodingSuggestion,
  SearchFilters,
  CodingStats
} from '@/types';

const API_BASE_URL = 'http://localhost:3001/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`🚀 ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ Request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
    return response;
  },
  (error) => {
    console.error(`❌ ${error.config?.method?.toUpperCase()} ${error.config?.url} - ${error.response?.status}`, error.response?.data);
    return Promise.reject(error);
  }
);

// Patient API
export const patientAPI = {
  // Get all patients
  getAll: async (filters: SearchFilters = {}) => {
    const response = await api.get('/patients', { params: filters });
    return response.data;
  },

  // Get patient by ID
  getById: async (id: string): Promise<Patient> => {
    const response = await api.get(`/patients/${id}`);
    return response.data;
  },

  // Create new patient
  create: async (data: PatientFormData): Promise<Patient> => {
    const response = await api.post('/patients', data);
    return response.data;
  },

  // Update patient
  update: async (id: string, data: Partial<PatientFormData>): Promise<Patient> => {
    const response = await api.put(`/patients/${id}`, data);
    return response.data;
  },

  // Delete patient
  delete: async (id: string): Promise<void> => {
    await api.delete(`/patients/${id}`);
  },
};

// Notes API
export const notesAPI = {
  // Get all notes
  getAll: async (filters: SearchFilters = {}) => {
    const response = await api.get('/notes', { params: filters });
    return response.data;
  },

  // Get note by ID
  getById: async (id: string): Promise<ClinicalNote> => {
    const response = await api.get(`/notes/${id}`);
    return response.data;
  },

  // Create new note
  create: async (data: NoteFormData): Promise<ClinicalNote> => {
    const response = await api.post('/notes', data);
    return response.data;
  },

  // Update note
  update: async (id: string, data: Partial<NoteFormData>): Promise<ClinicalNote> => {
    const response = await api.put(`/notes/${id}`, data);
    return response.data;
  },

  // Delete note
  delete: async (id: string): Promise<void> => {
    await api.delete(`/notes/${id}`);
  },

  // Get AI assistance for note writing
  getAssistance: async (data: {
    chief_complaint: string;
    symptoms?: string;
    context?: string;
  }): Promise<{ success: boolean; assistance: NoteAssistance }> => {
    const response = await api.post('/notes/assist', data);
    return response.data;
  },

  // Improve existing note with AI
  improveNote: async (id: string, improvement_request: string) => {
    const response = await api.post(`/notes/${id}/improve`, { improvement_request });
    return response.data;
  },
};

// Coding API
export const codingAPI = {
  // Get all medical codes
  getCodes: async (filters: SearchFilters = {}) => {
    const response = await api.get('/coding/codes', { params: filters });
    return response.data;
  },

  // Search medical codes
  searchCodes: async (data: {
    query: string;
    code_type?: 'ICD10' | 'CPT';
    limit?: number;
  }) => {
    const response = await api.post('/coding/search', data);
    return response.data;
  },

  // Get AI coding suggestions
  getSuggestions: async (data: {
    diagnosis?: string;
    procedures?: string;
    symptoms?: string;
    note_content?: string;
  }): Promise<CodingSuggestion> => {
    const response = await api.post('/coding/suggest', data);
    return response.data;
  },

  // Validate medical codes
  validateCodes: async (codes: string[]) => {
    const response = await api.post('/coding/validate', { codes });
    return response.data;
  },

  // Get coding statistics
  getStats: async (): Promise<CodingStats> => {
    const response = await api.get('/coding/stats');
    return response.data;
  },
};

// Health check API
export const healthAPI = {
  check: async () => {
    const response = await api.get('/health');
    return response.data;
  },
};

// Export the axios instance for custom requests
export { api };

// Error handling utility
export const handleAPIError = (error: any): string => {
  if (error.response) {
    // Server responded with error status
    return error.response.data?.error || error.response.data?.message || `Server error: ${error.response.status}`;
  } else if (error.request) {
    // Request made but no response received
    return 'Network error: Please check your connection';
  } else {
    // Something else happened
    return error.message || 'An unexpected error occurred';
  }
};