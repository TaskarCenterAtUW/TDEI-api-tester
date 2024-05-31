import { Seeder } from "./src/seeder";


module.exports = async function () {
    let seeder = new Seeder();
    global.seedData = await seeder.seed();
}