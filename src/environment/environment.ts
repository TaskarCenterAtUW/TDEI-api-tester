import dotenv from 'dotenv';
dotenv.config();

export const environment = {
    appName: process.env.npm_package_name,
    seed: {
        baseUrl: process.env.SEED_BASE_URL,
        adminUser: process.env.SEED_ADMIN_USER,
        adminPassword: process.env.SEED_ADMIN_PASSWORD,
    },
    system: {
        baseUrl: process.env.SYSTEM_BASE_URL
    },
    environment: process.env.ENVIRONMENT ?? "dev",
    sso: {
        // Must be registered in Keycloak as a valid redirect URI for the default client.
        redirectUri: process.env.SSO_REDIRECT_URI ?? ((process.env.ENVIRONMENT ?? "dev") === "dev" ? "https://portal-dev.tdei.us/login" : undefined)
    },
    default: {
        username: process.env.DEFAULT_USERNAME,
        password: process.env.DEFAULT_PASSWORD
    }
}