/**
 * Validation Utilities
 * 
 * Contains validation functions for authentication and form inputs.
 * Designed to be extensible for future requirements (email verification, etc.)
 * 
 * @module validation
 */

export interface ValidationResult {
    valid: boolean;
    error?: string;
}

/**
 * Password validation rules:
 * - Minimum 8 characters
 * - At least one letter (a-zA-Z)
 * - At least one number (0-9)
 */
export function validatePassword(password: string): ValidationResult {
    if (!password) {
        return { valid: false, error: 'Password is required' };
    }

    if (password.length < 8) {
        return { valid: false, error: 'Password must be at least 8 characters' };
    }

    if (!/[a-zA-Z]/.test(password)) {
        return { valid: false, error: 'Password must contain at least one letter' };
    }

    if (!/[0-9]/.test(password)) {
        return { valid: false, error: 'Password must contain at least one number' };
    }

    return { valid: true };
}

/**
 * Email validation - basic format check
 */
export function validateEmail(email: string): ValidationResult {
    if (!email) {
        return { valid: false, error: 'Email is required' };
    }

    // Basic email regex - intentionally not overly strict
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return { valid: false, error: 'Please enter a valid email address' };
    }

    return { valid: true };
}

/**
 * Validate full name (optional, but if provided must be reasonable)
 */
export function validateFullName(name: string | undefined): ValidationResult {
    if (!name || name.trim() === '') {
        // Name is optional
        return { valid: true };
    }

    if (name.trim().length < 2) {
        return { valid: false, error: 'Name must be at least 2 characters' };
    }

    if (name.trim().length > 100) {
        return { valid: false, error: 'Name is too long' };
    }

    return { valid: true };
}

/**
 * Validate entire signup form
 */
export function validateSignupForm(data: {
    email: string;
    password: string;
    fullName?: string;
}): ValidationResult {
    const emailResult = validateEmail(data.email);
    if (!emailResult.valid) return emailResult;

    const passwordResult = validatePassword(data.password);
    if (!passwordResult.valid) return passwordResult;

    const nameResult = validateFullName(data.fullName);
    if (!nameResult.valid) return nameResult;

    return { valid: true };
}

/**
 * Validate login form
 */
export function validateLoginForm(data: {
    email: string;
    password: string;
}): ValidationResult {
    const emailResult = validateEmail(data.email);
    if (!emailResult.valid) return emailResult;

    // For login, we don't validate password strength - just check it exists
    if (!data.password) {
        return { valid: false, error: 'Password is required' };
    }

    return { valid: true };
}
