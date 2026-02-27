// API Client with retry logic and error handling

interface FetchOptions extends RequestInit {
  retries?: number;
  retryDelay?: number;
  timeout?: number;
}

/**
 * Fetch with automatic retry and timeout
 */
export async function fetchWithRetry(
  url: string,
  options: FetchOptions = {}
): Promise<Response> {
  const {
    retries = 3,
    retryDelay = 1000,
    timeout = 10000,
    ...fetchOptions
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // If successful or client error (4xx), return immediately
      if (response.ok || (response.status >= 400 && response.status < 500)) {
        return response;
      }

      // Server error (5xx), retry
      lastError = new Error(`Server error: ${response.status}`);
      
      if (attempt < retries) {
        console.log(`[Retry ${attempt + 1}/${retries}] ${url}`);
        await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
        continue;
      }

      return response;
    } catch (error) {
      lastError = error as Error;
      
      if (attempt < retries) {
        console.log(`[Retry ${attempt + 1}/${retries}] ${url} - ${lastError.message}`);
        await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
        continue;
      }
    }
  }

  throw lastError || new Error('Failed to fetch');
}

/**
 * Fetch JSON with retry and fallback
 */
export async function fetchJSON<T>(
  url: string,
  options: FetchOptions = {},
  fallback?: T
): Promise<T> {
  try {
    const response = await fetchWithRetry(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      if (fallback !== undefined) {
        console.warn(`[API] Using fallback for ${url}`);
        return fallback;
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`[API] Error fetching ${url}:`, error);
    
    if (fallback !== undefined) {
      console.warn(`[API] Using fallback for ${url}`);
      return fallback;
    }
    
    throw error;
  }
}

/**
 * Get pending orders count with automatic fallback
 */
export async function getPendingOrdersCount(): Promise<number> {
  try {
    const data = await fetchJSON<{ success: boolean; count: number }>(
      '/api/orders/pending-count',
      { 
        retries: 2, 
        timeout: 5000 
      },
      { success: true, count: 0 } // Fallback
    );
    
    return data.count || 0;
  } catch (error) {
    console.error('[API] Failed to get pending orders count:', error);
    return 0; // Always return 0 on error
  }
}

/**
 * Check if backend is healthy
 */
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const response = await fetchWithRetry('/api/health', {
      retries: 1,
      timeout: 3000,
    });
    return response.ok;
  } catch {
    return false;
  }
}
