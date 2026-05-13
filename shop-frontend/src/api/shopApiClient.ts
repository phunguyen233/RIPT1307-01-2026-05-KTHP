import axios from "axios";

// API key được cấu hình trong file .env hoặc biến môi trường
// REACT_APP_SHOP_API_KEY=your_api_key_here
export const API_KEY = process.env.REACT_APP_SHOP_API_KEY || "bepmam_51033565fd6c3177ab4cb7e0a723fb5e584b2b41b495542d7dcb5b460607a598";
const API_BASE_URL = process.env.REACT_APP_SHOP_API_URL || "http://localhost:4000/api";

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