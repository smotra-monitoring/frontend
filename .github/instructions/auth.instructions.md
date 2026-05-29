---
description: "Authentication rules: OAuth2 with PKCE flow, token management, localStorage strategy, security requirements. Use when working on auth logic, login page, OAuth callback, token storage, or auth guards."
applyTo: "src/auth/**, src/services/auth-service.ts, src/state/auth-state.ts, src/pages/login.ts, src/pages/oauth-callback.ts, src/types/auth-types.ts"
---

# Authentication

Authentication is implemented using **OAuth2 with PKCE** (Proof Key for Code Exchange) for enhanced security. The application supports multiple OAuth providers: Okta, Auth0, Azure AD, Google, and generic OIDC.

## OAuth2 Flow

1. User clicks login
2. Generate PKCE `code_verifier` and `code_challenge`
3. Generate random `state` parameter (CSRF protection)
4. Redirect to OAuth provider with `client_id`, `redirect_uri`, `code_challenge`, `state`
5. Provider authenticates user and redirects back with authorization code
6. Exchange code for `access_token` and `refresh_token` using `code_verifier`
7. Store tokens in localStorage
8. Use `access_token` for API requests

## Token Management

- **Access tokens** stored in localStorage with expiration timestamp
- **Refresh tokens** stored in localStorage (secure contexts only)
- Automatic token refresh before expiration
- Token revocation on logout
- 401 responses trigger token refresh attempt, then re-login if refresh fails

## Storage Strategy

Using **localStorage** for token persistence across sessions:
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

## Security Considerations

- PKCE required for all OAuth flows
- `state` parameter validates to prevent CSRF
- Tokens only sent over HTTPS
- XSS protection via CSP headers
- No tokens in URL query parameters

For detailed OAuth implementation, see `docs/features/oauth-authentication.md`.
