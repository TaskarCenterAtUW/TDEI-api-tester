// global.d.ts
declare global {
    namespace NodeJS {
        interface Global {
            seedData: SeedData; // Replace 'any' with the actual type of your seed data
        }
    }
}

export { };