// API helper for fetching from backend
// Directly calls backend API (no proxy needed)

export async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  // Get backend URL from environment
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';
  
  // Remove leading slash if present
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  const url = `${backendUrl}/${cleanEndpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  const response = await fetch(url, { ...options, headers });
  return response;
}

// For backward compatibility
export const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';
export async function getApiBaseUrl(): Promise<string> {
  return API_URL;
}
