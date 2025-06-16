import { Seeder } from "./seeder";

export default async function globalSetup() {
    try {
        console.log('Starting global setup...');
        const seeder = new Seeder();
        console.log('Seeder instance created.');

        global.seedData = await seeder.seed();
        console.log('Seeding completed successfully.');
    } catch (error) {
        console.error('Global setup error:', error);
    }
}