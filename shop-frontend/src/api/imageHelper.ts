const API_BASE_URL = process.env.REACT_APP_SHOP_API_URL || 'http://localhost:4000/api';
const API_ORIGIN = (() => {
  try { return new URL(API_BASE_URL).origin; } catch { return ''; }
})();

export function resolveImageUrl(hinh_anh?: string) {
  if (!hinh_anh) return '/placeholder.png';
  const trimmed = (hinh_anh || '').trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  if (trimmed.startsWith('/')) return `${API_ORIGIN}${trimmed}`;
  return `${API_ORIGIN}/${trimmed}`;
}

export default resolveImageUrl;
