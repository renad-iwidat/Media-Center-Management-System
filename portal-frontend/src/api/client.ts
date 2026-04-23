import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/portal';

console.log('🔧 API Base URL:', API_BASE_URL);

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Add response interceptor for transforming API responses
client.interceptors.response.use(
  response => {
    console.log('✅ API Response:', response.status, response.data);
    
    // إذا الـ response فيه data و success، نرجع الـ data مباشرة
    if (response.data && typeof response.data === 'object' && response.data.data !== undefined) {
      console.log('📦 Transformed data:', response.data.data);
      return {
        ...response,
        data: response.data.data,
      };
    }
    
    return response;
  },
  error => {
    console.error('❌ API Error:', error.message, error.response?.status, error.response?.data);
    return Promise.reject(error);
  }
);

export default client;
