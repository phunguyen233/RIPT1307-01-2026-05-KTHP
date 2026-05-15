import axios from "axios";

// API key được cấu hình trong file .env hoặc biến môi trường
// REACT_APP_SHOP_API_KEY=your_api_key_here
// Điền API_KEY của Cửa hàng Cafe bạn vừa tạo vào đây hoặc vào file .env
export const API_KEY = process.env.REACT_APP_SHOP_API_KEY || "551d9e8f8c8c31ab6b7fa463b0cb2f67cf2d574d738184c5a0c725ba18b4a387";
const API_BASE_URL = process.env.REACT_APP_SHOP_API_URL || "http://localhost:4000";

const defaultHeaders: Record<string, string> = {
  "Content-Type": "application/json",
};
if (API_KEY) {
  defaultHeaders["x-api-key"] = API_KEY;
}

/**
 * API client for shop-frontend
 * Uses x-api-key header for authentication when configured
 */
const shopApiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: defaultHeaders,
});

// Handle response errors
shopApiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error("Invalid API key - please check REACT_APP_SHOP_API_KEY");
    }
    return Promise.reject(error);
  }
);

export default shopApiClient;