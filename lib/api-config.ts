// API Configuration
// This file centralizes API URL configuration for easy deployment

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export const API_ENDPOINTS = {
  // Products
  products: `${API_BASE_URL}/api/admin/products`,
  productById: (id: string) => `${API_BASE_URL}/api/admin/products/${id}`,
  
  // Orders
  orders: `${API_BASE_URL}/api/admin/orders`,
  orderById: (id: string) => `${API_BASE_URL}/api/admin/orders/${id}`,
  createOrder: `${API_BASE_URL}/api/orders`,
  
  // Reports
  reports: `${API_BASE_URL}/api/reports`,
  
  // Settings
  settings: `${API_BASE_URL}/api/settings`,
  
  // Auth
  login: `${API_BASE_URL}/api/admin/login`,
  
  // Health check
  health: `${API_BASE_URL}/api/health`,
};

// Helper function for fetch with error handling
export async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  try {
    const response = await fetch(endpoint, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API Fetch Error:', error);
    throw error;
  }
}
