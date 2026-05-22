/**
 * Mock user data for testing
 */

import type { UserInfo } from '../../src/types/auth-types.js';

export const mockUserInfo: UserInfo = {
    // id: 'user-123',
    sub: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    picture: 'https://example.com/avatar.jpg',
    //   email_verified: true,
    //   preferred_username: 'testuser',
    //   given_name: 'Test',
    //   family_name: 'User',
    //   locale: 'en-US',
};

export const mockUserInfo2: UserInfo = {
    // id: 'user-456',
    sub: 'user-456',
    email: 'admin@example.com',
    name: 'Admin User',
    picture: 'https://example.com/admin-avatar.jpg',
    //   email_verified: true,
    //   preferred_username: 'admin',
    //   given_name: 'Admin',
    //   family_name: 'User',
    //   locale: 'en-US',
};
