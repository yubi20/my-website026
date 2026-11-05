import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('banana_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to catch unauthorized errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token if expired or unauthorized
      if (localStorage.getItem('banana_token')) {
        localStorage.removeItem('banana_token');
        window.dispatchEvent(new Event('auth_expired'));
      }
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const registerUser = (data) => api.post('/auth/register', data);
export const loginUser = (data) => api.post('/auth/login', data);
export const getMyProfile = () => api.get('/auth/me');

// Game endpoints
export const startNewRound = () => api.post('/game/start');
export const requestHint = (data) => api.post('/game/hint', data);
export const submitRoundAnswer = (data) => api.post('/game/submit', data);

// Leaderboard endpoints
export const fetchLeaderboard = (type = 'score') => api.get(`/leaderboard?type=${type}`);

// User Profile endpoints
export const fetchUserProfile = () => api.get('/user/profile');
export const updateUserAvatar = (avatar) => api.put('/user/avatar', { avatar });

export default api;
