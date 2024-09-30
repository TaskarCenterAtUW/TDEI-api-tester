import { Seeder } from "./src/seeder";


module.exports = async function () {
    try {
        let seeder = new Seeder();
        global.seedData = await seeder.seed();
    } catch (error) {
        console.error('global setup error', error);
    }
}