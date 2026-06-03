import axios from "axios";

// Ưu tiên dùng biến môi trường, nếu không có thì fallback sang URL deploy
const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:4000/api";

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
});

// Attach token tự động
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle lỗi response
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token hết hạn hoặc sai
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/auth";
    }
    return Promise.reject(error);
  }
);

export default axiosClient;