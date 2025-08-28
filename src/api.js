export const apiUrl = import.meta.env.MODE === 'development'
  ? import.meta.env.VITE_BACKEND_URL
  : import.meta.env.VITE_API_URL;
