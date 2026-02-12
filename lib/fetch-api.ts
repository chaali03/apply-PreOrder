// API base URL: di browser baca dari /config.json (bisa diubah tanpa ganti env Vercel), fallback ke env
let cachedApiUrl: string | null = null;

const defaultApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export async function getApiBaseUrl(): Promise<string> {
  if (cachedApiUrl) return cachedApiUrl;
  if (typeof window === 'undefined') return defaultApiUrl;
  try {
    const r = await fetch('/config.json', { cache: 'no-store' });
    const d = await r.json();
    if (d?.apiUrl && typeof d.apiUrl === 'string' && d.apiUrl.startsWith('http')) {
      cachedApiUrl = d.apiUrl.replace(/\/$/, '');
      return cachedApiUrl;
    }
  } catch (_) {}
  cachedApiUrl = defaultApiUrl;
  return cachedApiUrl;
}

export async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const base = await getApiBaseUrl();
  const url = `${base}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
  const headers = {
    'ngrok-skip-browser-warning': 'true',
    ...options.headers,
  };
  const response = await fetch(url, { ...options, headers });
  return response;
}

export const API_URL = defaultApiUrl;
