import shopApiClient from "./shopApiClient";

/**
 * Categories API for shop-frontend
 * Uses x-api-key header for authentication
 */
export const categoriesAPI = {
  getAll: async () => {
    const res = await shopApiClient.get("/categories");
    return res.data;
  },

  getById: async (id: number) => {
    const res = await shopApiClient.get(`/categories/${id}`);
    return res.data;
  },
};

export default categoriesAPI;
