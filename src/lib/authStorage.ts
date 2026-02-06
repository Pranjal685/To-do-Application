/**
 * Auth Storage Abstraction Layer
 * 
 * Provides a thin abstraction over localStorage for auth data.
 * This allows future migration to httpOnly cookies without modifying AuthContext.
 * 
 * @module authStorage
 */

import type { User } from '@/types';

const STORAGE_KEYS = {
    TOKEN: 'token',
    USER: 'user',
} as const;

/**
 * Token operations
 */
export function getToken(): string | null {
    try {
        return localStorage.getItem(STORAGE_KEYS.TOKEN);
    } catch {
        // Handle cases where localStorage is unavailable (SSR, private browsing)
        return null;
    }
}

export function setToken(token: string): void {
    try {
        localStorage.setItem(STORAGE_KEYS.TOKEN, token);
    } catch {
        console.warn('Unable to persist token to storage');
    }
}

export function clearToken(): void {
    try {
        localStorage.removeItem(STORAGE_KEYS.TOKEN);
    } catch {
        // Silently fail if localStorage unavailable
    }
}

/**
 * User operations
 */
export function getUser(): User | null {
    try {
        const stored = localStorage.getItem(STORAGE_KEYS.USER);
        if (!stored) return null;
        return JSON.parse(stored) as User;
    } catch {
        // Handle parse errors or localStorage unavailability
        return null;
    }
}

export function setUser(user: User): void {
    try {
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    } catch {
        console.warn('Unable to persist user to storage');
    }
}

export function clearUser(): void {
    try {
        localStorage.removeItem(STORAGE_KEYS.USER);
    } catch {
        // Silently fail if localStorage unavailable
    }
}

/**
 * Clear all auth data
 */
export function clearAuthData(): void {
    clearToken();
    clearUser();
}

/**
 * Check if auth data exists in storage
 */
export function hasStoredAuth(): boolean {
    return getToken() !== null && getUser() !== null;
}
