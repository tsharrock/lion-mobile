import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { API_URL } from '../constants/api';

// Web-safe storage helper
const getToken = async () => {
  if (Platform.OS === 'web') {
    return localStorage.getItem('userToken');
  }
  return await SecureStore.getItemAsync('userToken');
};

const saveToken = async (token: string) => {
  if (Platform.OS === 'web') {
    localStorage.setItem('userToken', token);
  } else {
    await SecureStore.setItemAsync('userToken', token);
  }
};

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Accept': 'application/json',
  },
});

// Add a request interceptor to attach the auth token
api.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Only set application/json if not sending FormData
  const isFormData = config.data instanceof FormData || 
                    (config.data && config.data._parts !== undefined);
  
  if (isFormData) {
    // In React Native, we MUST NOT set Content-Type for FormData
    // so that the boundary is automatically added.
    if (config.headers['Content-Type']) {
      delete config.headers['Content-Type'];
    }
  } else {
    config.headers['Content-Type'] = 'application/json';
  }
  
  return config;
});

// Add a response interceptor for debugging
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
    });
    return Promise.reject(error);
  }
);

export const authService = {
  register: (data: any) => api.post('/register', data),
  login: (data: any) => api.post('/login', data),
  logout: () => api.post('/logout'),
  getUser: () => api.get('/user'),
  saveToken, // Export helper
};

export const categoryService = {
  getAll: () => api.get('/categories'),
};

export const postService = {
  getAll: (categoryId?: number) => api.get('/posts', { params: { category_id: categoryId } }),
  getMyPosts: () => api.get('/my-posts'),
  create: (formData: FormData) => api.post('/posts', formData),
};

export const voteService = {
  vote: (postId: number, type: 'yes' | 'no' | 'neutral') => api.post('/votes', { post_id: postId, type }),
};

export const profileService = {
  getStats: () => api.get('/profile/stats'),
  getHistory: () => api.get('/profile/history'),
  uploadImage: (formData: FormData) => api.post('/profile/image', formData),
  deleteImage: () => api.delete('/profile/image'),
};

export const leaderboardService = {
  get: (sort: 'highest' | 'lowest' = 'highest', categoryId?: number) =>
    api.get('/leaderboard', { params: { sort, ...(categoryId ? { category_id: categoryId } : {}) } }),
};

export default api;
