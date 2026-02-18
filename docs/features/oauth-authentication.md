# OAuth2 Authentication with PKCE

This document describes the OAuth2 authentication implementation with PKCE (Proof Key for Code Exchange) used in the Smotra frontend.

## Overview

The application uses OAuth2 with PKCE for secure authentication. PKCE enhances the OAuth2 authorization code flow with a cryptographic challenge, making it secure for public clients (browser-based applications).

## Supported Providers

The application supports multiple OAuth2 providers:

- **Okta**: Enterprise identity management
- **Auth0**: Modern authentication platform
- **Azure AD**: Microsoft Azure Active Directory
- **Google**: Google OAuth2
- **OIDC**: Generic OpenID Connect provider

## Authentication Flow

### 1. User Initiates Login

User clicks on an OAuth provider button on the login page:

```typescript
await login('okta'); // or 'auth0', 'azure', 'google', 'oidc'
```

### 2. PKCE Challenge Generation

The application generates a PKCE code verifier and challenge:

```typescript
const pkce = await generatePKCEChallenge();
// Returns:
// {
//   code_verifier: 'random-string',
//   code_challenge: 'base64-url-encoded-sha256-hash',
//   code_challenge_method: 'S256'
// }
```

- **Code Verifier**: 43-128 character random string
- **Code Challenge**: Base64-URL encoded SHA-256 hash of verifier
- **Challenge Method**: S256 (SHA-256)

### 3. Authorization Request

User is redirected to the OAuth provider with:

- `client_id`: Application identifier
- `redirect_uri`: Callback URL (`/auth/callback`)
- `response_type`: `code`
- `scope`: Requested permissions
- `state`: Random CSRF protection token
- `code_challenge`: PKCE challenge
- `code_challenge_method`: `S256`

The code verifier and state are stored in localStorage for verification.

### 4. User Authentication

User authenticates with the OAuth provider (username/password, MFA, etc.).

### 5. Authorization Code Redirect

OAuth provider redirects back to `/auth/callback` with:

- `code`: Authorization code
- `state`: CSRF token

### 6. Callback Validation

The application validates the callback:

```typescript
const callback = handleOAuthCallback();
// Validates:
// - state parameter matches stored value
// - no error parameter present
// - authorization code is present
```

### 7. Token Exchange

Exchange authorization code for access token:

```typescript
const tokens = await exchangeCodeForTokens(code, codeVerifier);
// Sends:
// - grant_type: 'authorization_code'
// - code: authorization code
// - code_verifier: PKCE verifier
// - redirect_uri: callback URL
//
// Returns:
// - access_token
// - refresh_token
// - expires_in
// - token_type
```

### 8. User Info Retrieval

Fetch user information using access token:

```typescript
const userInfo = await fetchUserInfo(accessToken);
// Returns:
// - id
// - email
// - name
// - picture
```

### 9. Session Establishment

Store authentication state in localStorage:

```typescript
{
  "auth": {
    "access_token": "...",
    "refresh_token": "...",
    "expires_at": 1234567890,
    "user_info": { ... }
  }
}
```

Schedule automatic token refresh before expiration.

## Security Features

### PKCE Protection

PKCE prevents authorization code interception attacks. Even if an attacker intercepts the authorization code, they cannot exchange it for tokens without the code verifier.

### State Parameter

The state parameter protects against CSRF attacks. The application validates that the returned state matches the stored value.

### Token Expiration

- Access tokens expire (typically 1 hour)
- Refresh tokens used for obtaining new access tokens
- Automatic refresh scheduled 60 seconds before expiration
- Expired tokens trigger re-authentication

### Secure Storage

- Tokens stored in localStorage (user preference)
- Only transmitted over HTTPS
- Tokens not exposed in URLs

## Token Management

### Access Token

- Short-lived credential for API requests
- Included in Authorization header: `Bearer {access_token}`
- Expires after configured duration (typically 1 hour)

### Refresh Token

- Long-lived credential for obtaining new access tokens
- Stored securely in localStorage
- Used when access token expires

### Automatic Refresh

```typescript
// Schedule refresh 60 seconds before expiration
const cleanup = scheduleTokenRefresh(tokens);

// Token refresh happens automatically
// If refresh fails, user is redirected to login
```

### Manual Refresh

```typescript
const newAccessToken = await refreshAccessToken();
```

## Route Protection

### Protected Routes

Routes that require authentication:

```typescript
// In router.ts
{ path: '/dashboard', component: DashboardPage, protected: true }
```

### Auth Guard

Check authentication before accessing protected routes:

```typescript
if (!canAccessRoute(path)) {
  protectRoute(path); // Saves return URL and redirects to login
}
```

### Post-Login Redirect

After successful login, user is redirected to originally requested URL:

```typescript
const redirectUrl = getRedirectAfterLogin() || '/dashboard';
window.location.href = redirectUrl;
```

## Logout

```typescript
await logout();
// - Stops automatic token refresh
// - Revokes tokens on server
// - Clears localStorage
// - Redirects to login page
```

## API Integration

### Making Authenticated API Calls

```typescript
// Get valid access token (automatically refreshes if needed)
const token = await getValidAccessToken();

// Make API request
const response = await fetch('/api/agents', {
  headers: {
    'Authorization': `Bearer ${token}`,
  },
});
```

### Handling 401 Responses

```typescript
// 401 triggers token refresh attempt
// If refresh fails, user is redirected to login
```

## Configuration

OAuth configuration is provider-specific:

```typescript
const config = {
  provider: 'okta',
  clientId: process.env.OAUTH_CLIENT_ID,
  redirectUri: `${window.location.origin}/auth/callback`,
  authorizationEndpoint: 'https://your-domain.okta.com/oauth2/v1/authorize',
  tokenEndpoint: 'https://your-domain.okta.com/oauth2/v1/token',
  userInfoEndpoint: 'https://your-domain.okta.com/oauth2/v1/userinfo',
  scope: 'openid profile email',
};
```

## Error Handling

### Common Errors

- **Invalid state**: CSRF attack or session expired during auth
- **PKCE verification failed**: Missing or invalid code verifier
- **Token exchange failed**: Invalid authorization code or configuration
- **User info fetch failed**: Invalid access token or permissions

### Error Recovery

- User-friendly error messages displayed on login page
- Automatic retry for transient failures
- Fallback to login page for authentication failures

## Testing

### Unit Tests

```typescript
describe('OAuth Manager', () => {
  it('generates valid PKCE challenge', async () => {
    const pkce = await generatePKCEChallenge();
    expect(pkce.code_verifier).toHaveLength(43);
    expect(pkce.code_challenge_method).toBe('S256');
  });
  
  it('validates state parameter', () => {
    // Save state
    const state = 'random-state';
    savePKCE({ state, code_verifier: 'verifier' });
    
    // Validate callback
    const callback = handleOAuthCallback();
    expect(callback.valid).toBe(true);
  });
});
```

### Integration Tests

```typescript
describe('OAuth Flow', () => {
  it('completes full OAuth login', async () => {
    // Mock OAuth provider responses
    mockOAuthServer();
    
    // Initiate login
    await login('okta');
    
    // Simulate callback
    window.location.href = '/auth/callback?code=abc&state=xyz';
    
    // Handle callback
    const success = await handleLoginCallback();
    
    expect(success).toBe(true);
    expect(isAuthenticated()).toBe(true);
  });
});
```

## Best Practices

1. **Always use HTTPS**: OAuth2 requires secure communication
2. **Validate state parameter**: Prevents CSRF attacks
3. **Use PKCE**: Enhanced security for public clients
4. **Store tokens securely**: localStorage with HTTPS only
5. **Implement token refresh**: Seamless user experience
6. **Handle errors gracefully**: User-friendly error messages
7. **Clear tokens on logout**: Complete session cleanup
8. **Respect token expiration**: Don't use expired tokens

## Troubleshooting

### "Invalid state" Error

- Check that localStorage is enabled
- Ensure cookies are not blocked
- Verify redirect URI matches configuration

### Token Refresh Fails

- Check refresh token is valid
- Verify token endpoint configuration
- Ensure refresh_token grant type is enabled

### PKCE Verification Failed

- Verify code_challenge_method is 'S256'
- Check that code_verifier is stored correctly
- Ensure OAuth provider supports PKCE

## References

- [RFC 7636: PKCE](https://tools.ietf.org/html/rfc7636)
- [RFC 6749: OAuth 2.0](https://tools.ietf.org/html/rfc6749)
- [OpenID Connect](https://openid.net/connect/)
