import type { OAuth2Config, OAuth2Provider } from "./types/auth-types.js";

type FrontendURL = "localhost:3000" | "production";

interface AppConfig {
    example: string; // Placeholder for additional config sections
    apiBaseUrl: string;
}

const CONFIG_MAP: Record<FrontendURL, AppConfig> = {
    "localhost:3000": {
        example: "This is the development config",
        apiBaseUrl: "http://localhost:8080/v1",
    },
    "production": {
        example: "This is the production config",
        apiBaseUrl: "https://api.smotra.net/v1",
    }
};

export function getEnvironmentConfig(): AppConfig {
    const host = window.location.host as FrontendURL;
    return CONFIG_MAP[host] ? CONFIG_MAP[host] : CONFIG_MAP["production"];
}
