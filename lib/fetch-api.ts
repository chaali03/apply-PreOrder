// API helper for fetching from backend
// Now uses Next.js API proxy at /api/* which forwards to backend

export async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  // All API calls now go through Next.js API proxy
  // No need for config.json anymore
  const url = endpoint.startsWith('/') ? endpoint : '/' + endpoint;
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  const response = await fetch(url, { ...options, headers });
  return response;
}

// For backward compatibility
export const API_URL = process.env.NEXT_PUBLIC_API_URL || '';
export async function getApiBaseUrl(): Promise<string> {
  return '';
}
