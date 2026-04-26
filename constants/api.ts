const USE_LOCAL = true;

const BASE_URL = USE_LOCAL
  ? 'http://localhost:8000'
  : 'https://lion-api.laravel.cloud';

export const API_URL = `${BASE_URL}/api`;
export const STORAGE_URL = `${BASE_URL}/storage`;
