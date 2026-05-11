import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const apiService = {
  // Health Check
  getHealth: async () => {
    const response = await apiClient.get('/health');
    return response.data;
  },

  // Skills
  getSkills: async () => {
    const response = await apiClient.get('/skills');
    return response.data;
  },

  // Career Paths
  getCareerPaths: async () => {
    const response = await apiClient.get('/career-paths');
    return response.data;
  },

  // Resume Upload
  uploadResume: async (file, onUploadProgress) => {
    const formData = new FormData();
    formData.append('resume', file);
    const response = await apiClient.post('/upload-resume', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
    });
    return response.data;
  },

  // Profile Analysis
  analyzeProfile: async (profileData) => {
    const response = await apiClient.post('/analyze-profile', profileData);
    return response.data;
  },

  // AI Chat
  sendChatMessage: async (message, context) => {
    const response = await apiClient.post('/chat', { message, context });
    return response.data;
  },

  // Mentor Advice
  getMentorAdvice: async (userData) => {
    const response = await apiClient.post('/mentor-advice', userData);
    return response.data;
  },

  // Job Matching
  getJobs: async (career, city) => {
    const response = await apiClient.post('/jobs', { career, city });
    return response.data;
  },

  // Interview Prep
  getInterviewPrep: async (career) => {
    const response = await apiClient.post('/interview-prep', { career });
    return response.data;
  },
};

export default apiService;
