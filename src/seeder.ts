import {APIUtility} from './utils'
import {SeedData} from './models/types'

class Seeder {
    private client: APIUtility;
    private readonly roles: Array<string>
    public seedData: {} | SeedData

    constructor() {
        this.client = new APIUtility()
        this.roles = ['poc', 'flex_data_generator', 'pathways_data_generator', 'osw_data_generator']
        this.seedData = {}
    }

    public async seed() {
        await this.client.login()
        const orgId = await this.client.createOrg()
        console.info(`Created Organisation with ID: ${orgId}`)
        this.seedData['tdei_org_id'] = orgId
        const serviceId= await this.client.createService(orgId)
        console.info(`Created Service with ID: ${serviceId}`)
        this.seedData['service_id'] = serviceId
         const stationId = await this.client.createStation(orgId)
        this.seedData['station_id'] = stationId
        console.info(`Created Station with ID: ${serviceId}`)
        this.seedData['users'] = await this.createUsers(orgId)
    }

    private async createUsers(orgId): Promise<object> {
        const users = {}
        for await (const role of this.roles) {
            const userDetails = await this.client.createUser()
            await this.client.addPermission(orgId, userDetails.username, role)
            console.info(`Added ${role} permission to username: ${userDetails.username}`)
            users[role] = {
                username: userDetails.username,
                password: 'Pa$s1word'
            }
        }
        return users
    }
}
