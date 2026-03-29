/**
 * Environment Configuration for QuackTrack
 * 
 * This module provides a centralized configuration for API URLs
 * based on the build target (web, desktop, or mobile)
 */

// Determine the API base URL based on environment
const getApiBaseUrl = (): string => {
  // Check if we're in a mobile app (Capacitor)
  if (typeof window !== 'undefined') {
    // Check for Capacitor
    const isCapacitor = typeof (window as any).Capacitor !== 'undefined';
    
    if (isCapacitor) {
      // Mobile app - use production server
      return process.env.NEXT_PUBLIC_API_URL || 'https://quacktrack.onrender.com';
    }
    
    // Check if we're in Electron
    const isElectron = typeof (window as any).electronAPI !== 'undefined' || 
                       navigator.userAgent.toLowerCase().includes('electron');
    
    if (isElectron) {
      // Electron app - use local server
      return 'http://localhost:3000';
    }
  }
  
  // Web - use relative URLs (same origin)
  return '';
};

// Export the API base URL
export const API_BASE_URL = getApiBaseUrl();

// Helper function to build API URLs
export function getApiUrl(path: string): string {
  const base = API_BASE_URL;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return base ? `${base}${cleanPath}` : cleanPath;
}

// Helper for fetch with proper URL handling
export async function apiFetch(path: string, options?: RequestInit): Promise<Response> {
  const url = getApiUrl(path);
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
}

// Log configuration on load (development only)
if (process.env.NODE_ENV === 'development') {
  console.log('QuackTrack Config:', {
    API_BASE_URL,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    BUILD_TARGET: process.env.BUILD_TARGET,
  });
}
