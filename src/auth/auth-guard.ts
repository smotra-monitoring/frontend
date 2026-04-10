/**
 * Authentication guards for route protection
 */

import type { AuthGuardResult } from '../types/auth-types.js';
import { isAuthenticated } from '../state/auth-state.js';
import { getValidAccessToken } from './token-manager.js';

/**
 * Check if user can access protected route
 */
async function canAccessRoute(requireAuth: boolean = true): Promise<AuthGuardResult> {
  if (!requireAuth) {
    return { allowed: true };
  }

  // Check if user is authenticated
  if (!isAuthenticated()) {
    return {
      allowed: false,
      redirectTo: '/login',
    };
  }

  // Check if token is valid
  const token = await getValidAccessToken();

  if (!token) {
    return {
      allowed: false,
      redirectTo: '/login',
    };
  }

  return { allowed: true };
}
export const canAccessRoute_ForTest = canAccessRoute; // Export for testing


/**
 * Protect route - redirect if not authenticated
 */
export async function protectRoute(currentPath: string = window.location.pathname): Promise<boolean> {
  const result = await canAccessRoute(true);

  if (!result.allowed && result.redirectTo) {
    // Store intended destination for redirect after login
    sessionStorage.setItem('redirect_after_login', currentPath);

    // Redirect to login
    window.location.href = result.redirectTo;
    return false;
  }

  return result.allowed;
}

/**
 * Check if user can access public route (logged out only)
 */
export function canAccessPublicRoute(): AuthGuardResult {
  // If already authenticated, redirect to dashboard
  if (isAuthenticated()) {
    return {
      allowed: false,
      redirectTo: '/dashboard',
    };
  }

  return { allowed: true };
}

/**
 * Get redirect destination after login
 */
export function getRedirectAfterLogin(): string | null {
  const stored = sessionStorage.getItem('redirect_after_login');
  sessionStorage.removeItem('redirect_after_login');
  return stored;
}

/**
 * Higher-order function to wrap route handlers with auth guard
 */
export function withAuthGuard(
  handler: () => void | Promise<void>,
  requireAuth: boolean = true
): () => Promise<void> {
  return async () => {
    const result = await canAccessRoute(requireAuth);

    if (result.allowed) {
      await handler();
    } else if (result.redirectTo) {
      window.location.href = result.redirectTo;
    }
  };
}

/**
 * Check if specific permission/role is granted
 * (Placeholder for future role-based access control)
 */
export function hasPermission(permission: string): boolean {
  // TODO: Implement actual permission checking
  // This would check user roles/permissions from token or user info
  return true;
}

/**
 * Check if user has any of the specified roles
 * (Placeholder for future role-based access control)
 */
export function hasAnyRole(roles: string[]): boolean {
  // TODO: Implement actual role checking
  // This would extract roles from JWT token or user info
  return true;
}

/**
 * Check if user has all of the specified roles
 * (Placeholder for future role-based access control)
 */
export function hasAllRoles(roles: string[]): boolean {
  // TODO: Implement actual role checking
  return true;
}
