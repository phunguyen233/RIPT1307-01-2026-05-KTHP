import shopApiClient from "./shopApiClient";

/**
 * Products API for shop-frontend
 * Uses x-api-key header from .env to authenticate and resolve shop_id server-side.
 */
export const productsAPI = {
  getAll: async () => {
    const res = await shopApiClient.get("/products");
    return res.data;
  },

  getById: async (id: number) => {
    const res = await shopApiClient.get(`/products/${id}`);
    return res.data;
  },

  getByShop: async (_shopId?: number) => {
    const res = await shopApiClient.get("/products");
    return res.data;
  },
};

export default productsAPI;