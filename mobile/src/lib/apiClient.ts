import { create, type AxiosAdapter, type AxiosInstance } from 'axios';
import { API_URL } from '../config/api.ts';

export const API_TIMEOUT_MS = 15000;

export function normalizeApiUrl(value: string): string {
  return value.trim().replace(/\/+$/, '');
}

export function isValidApiUrl(value: string): boolean {
  return /^https?:\/\/[^/\s]+/i.test(normalizeApiUrl(value));
}

export function createApiClient(baseURL: string, adapter?: AxiosAdapter, timeout = API_TIMEOUT_MS): AxiosInstance {
  return create({
    baseURL: normalizeApiUrl(baseURL),
    timeout,
    adapter,
    headers: { Accept: 'application/json' },
  });
}

export const apiClient = createApiClient(API_URL);
