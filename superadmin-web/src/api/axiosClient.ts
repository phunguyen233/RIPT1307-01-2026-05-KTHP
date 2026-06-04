import axios from 'axios';

const baseURL = process.env.REACT_APP_API_URL || 'https://bepmam-backend.onrender.com/api';

const axiosClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosClient.interceptors.request.use((config) => {
  if (config.headers) {
    const token = window.localStorage.getItem('superadmin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export default axiosClient;
