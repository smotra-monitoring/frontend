import type { OAuth2Config, OAuth2Provider } from "./types/auth-types.js";

type FrontendURL = "localhost:3000" | "production";

interface AppConfig {
    auth: {
        providers: Record<OAuth2Provider, OAuth2Config>;
    };
}

const CONFIG_MAP: Record<FrontendURL, AppConfig> = {
    "localhost:3000": {
        auth: {
            providers: {
                okta: {
                    authorizationEndpoint: 'https://your-domain.okta.com/oauth2/v1/authorize',
                    tokenEndpoint: 'https://your-domain.okta.com/oauth2/v1/token',
                    redirectUri: `${window.location.origin}/auth/callback`,
                    provider: "okta",
                    clientId: 'your-client-id',
                    scopes: ['openid', 'profile', 'email'],
                },
                auth0: {
                    authorizationEndpoint: 'https://dev-66c3w4hb34p1ajnk.us.auth0.com/authorize',
                    tokenEndpoint: 'https://dev-66c3w4hb34p1ajnk.us.auth0.com/oauth/token',
                    provider: "auth0",
                    redirectUri: `${window.location.origin}/auth/callback`,
                    clientId: 'orsIdxADC6Dfnk0mqG5Q1GtCeAW4u2NS',
                    scopes: ['openid', 'profile', 'email'],
                },
                azure: {
                    authorizationEndpoint: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
                    tokenEndpoint: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
                    provider: "azure",
                    redirectUri: `${window.location.origin}/auth/callback`,
                    clientId: 'your-client-id',
                    scopes: ['openid', 'profile', 'email'],
                },
                google: {
                    authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
                    tokenEndpoint: 'https://oauth2.googleapis.com/token',
                    provider: "google",
                    redirectUri: `${window.location.origin}/auth/callback`,
                    clientId: 'your-client-id',
                    scopes: ['openid', 'profile', 'email'],
                },
                oidc: {
                    // Generic OIDC - endpoints should be discovered from .well-known/openid-configuration
                    authorizationEndpoint: '',
                    tokenEndpoint: '',
                    provider: "oidc",
                    redirectUri: `${window.location.origin}/auth/callback`,
                    clientId: 'your-client-id',
                    scopes: ['openid', 'profile', 'email'],
                },
            }
        },
    },
    "production": {
        auth: {
            providers: {
                okta: {
                    authorizationEndpoint: 'https://your-domain.okta.com/oauth2/v1/authorize',
                    tokenEndpoint: 'https://your-domain.okta.com/oauth2/v1/token',
                    redirectUri: `${window.location.origin}/auth/callback`,
                    provider: "okta",
                    clientId: 'your-client-id',
                    scopes: ['openid', 'profile', 'email'],
                },
                auth0: {
                    authorizationEndpoint: 'https://dev-66c3w4hb34p1ajnk.us.auth0.com/authorize',
                    tokenEndpoint: 'https://dev-66c3w4hb34p1ajnk.us.auth0.com/oauth/token',
                    provider: "auth0",
                    redirectUri: `${window.location.origin}/auth/callback`,
                    clientId: 'orsIdxADC6Dfnk0mqG5Q1GtCeAW4u2NS',
                    scopes: ['openid', 'profile', 'email'],
                },
                azure: {
                    authorizationEndpoint: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
                    tokenEndpoint: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
                    provider: "azure",
                    redirectUri: `${window.location.origin}/auth/callback`,
                    clientId: 'your-client-id',
                    scopes: ['openid', 'profile', 'email'],
                },
                google: {
                    authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
                    tokenEndpoint: 'https://oauth2.googleapis.com/token',
                    provider: "google",
                    redirectUri: `${window.location.origin}/auth/callback`,
                    clientId: 'your-client-id',
                    scopes: ['openid', 'profile', 'email'],
                },
                oidc: {
                    // Generic OIDC - endpoints should be discovered from .well-known/openid-configuration
                    authorizationEndpoint: '',
                    tokenEndpoint: '',
                    provider: "oidc",
                    redirectUri: `${window.location.origin}/auth/callback`,
                    clientId: 'your-client-id',
                    scopes: ['openid', 'profile', 'email'],
                },
            }
        }
    }
};

export function getEnvironmentConfig(): AppConfig {
    const host = window.location.host as FrontendURL;
    return CONFIG_MAP[host] ? CONFIG_MAP[host] : CONFIG_MAP["production"];
}
