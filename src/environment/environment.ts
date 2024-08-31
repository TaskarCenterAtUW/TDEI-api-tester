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
    }
}