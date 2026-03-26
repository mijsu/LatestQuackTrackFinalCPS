/**
 * API Configuration for QuackTrack
 * 
 * This module provides API configuration that works across:
 * - Web (local API routes)
 * - Desktop Electron (local server)
 * - Mobile Capacitor (production server)
 */

// Production server URL - Your deployed Next.js server on Render
const PRODUCTION_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://quacktrack-dsvr.onrender.com';

/**
 * Check if running in a mobile app (Capacitor)
 */
export function isMobileApp(): boolean {
  if (typeof window === 'undefined') return false;
  return typeof (window as any).Capacitor !== 'undefined' || 
         typeof (window as any).capacitorPlugins !== 'undefined';
}

/**
 * Check if running in Electron desktop app
 */
export function isElectronApp(): boolean {
  if (typeof window === 'undefined') return false;
  return typeof (window as any).electronAPI !== 'undefined' || 
         navigator.userAgent.toLowerCase().includes('electron');
}

/**
 * Get the base URL for API calls
 */
export function getApiBaseUrl(): string {
  // Mobile app - use production server
  if (isMobileApp()) {
    return PRODUCTION_API_URL;
  }
  
  // Electron app or web - use local server
  return '';
}

/**
 * Build full API URL
 */
export function getApiUrl(path: string): string {
  const base = getApiBaseUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return base ? `${base}${cleanPath}` : cleanPath;
}

/**
 * Fetch wrapper that handles mobile/web differences
 */
export async function apiFetch(
  path: string, 
  options: RequestInit = {}
): Promise<Response> {
  const url = getApiUrl(path);
  
  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  // Add credentials for session cookies
  const fetchOptions: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    credentials: 'include',
  };
  
  return fetch(url, fetchOptions);
}

/**
 * Convenience methods for common HTTP verbs
 */
export const api = {
  get: (path: string) => apiFetch(path),
  
  post: (path: string, data?: unknown) => apiFetch(path, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  }),
  
  put: (path: string, data?: unknown) => apiFetch(path, {
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  }),
  
  patch: (path: string, data?: unknown) => apiFetch(path, {
    method: 'PATCH',
    body: data ? JSON.stringify(data) : undefined,
  }),
  
  delete: (path: string) => apiFetch(path, {
    method: 'DELETE',
  }),
};

// Export the production URL for reference
export { PRODUCTION_API_URL };
