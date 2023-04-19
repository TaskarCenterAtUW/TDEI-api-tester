import {Utility} from './utils'
import {SeedData} from './models/types'
import axios, {AxiosInstance} from "axios";
import config from "./test-harness.json";

class Seeder {
    private client: APIUtility;
    private readonly roles: Array<string>
    constructor() {
        this.client = new APIUtility()
        this.roles = ['poc', 'flex_data_generator', 'pathways_data_generator', 'osw_data_generator']
    }

    public async seed(): Promise<{} | SeedData> {
        await this.client.login()
        let seedData = {}
        const orgId = await this.client.createOrg()
        console.info(`Created Organisation with ID: ${orgId}`)
        seedData['tdei_org_id'] = orgId
        const serviceId= await this.client.createService(orgId)
        console.info(`Created Service with ID: ${serviceId}`)
        seedData['service_id'] = serviceId
         const stationId = await this.client.createStation(orgId)
        seedData['station_id'] = stationId
        console.info(`Created Station with ID: ${stationId}`)
        seedData['users'] = await this.createUsers(orgId)
        return seedData
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


class APIUtility {
    private instance: AxiosInstance;

    constructor() {
        axios.defaults.baseURL = config.seed.baseUrl;
        this.instance = axios.create();
        // console.log(Utility.getRandomOrganizationUpload())
    }

    async login(): Promise<void> {
        try {
            const resp = await axios({
                method: 'post',
                url: '/api/v1/authenticate',
                data: {
                    username: config.seed.adminUser,
                    password: config.seed.adminPassword
                }
            })
            const accessToken = resp?.data?.access_token
            axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`
        } catch (err: any) {
            throw err?.response?.data?.message
        }
    }

    async createOrg(): Promise<string> {
        try {
            const resp = await axios({
                method: 'post',
                url: '/api/v1/organization',
                data: Utility.getRandomOrganizationUpload()
            })
            return resp?.data?.data
        } catch (err: any) {
            throw err?.response?.data?.message
        }
    }

    async createUser(): Promise<any> {
        try {
            const resp = await axios({
                method: 'post',
                url: '/api/v1/register',
                data: Utility.getUserUpload()
            })
            return resp?.data?.data
        } catch (err: any) {
            throw err?.response?.data?.message
        }
    }

    async addPermission(orgId: string, username: string, role: string): Promise<void> {
        try {
            const resp = await axios({
                method: 'post',
                url: '/api/v1/permission',
                data: {
                    tdei_org_id: orgId,
                    user_name: username,
                    roles: [role]
                }
            })
            return resp?.data?.data
        } catch (err: any) {
            throw err?.response?.data?.message
        }
    }

    async createStation(orgId: string): Promise<string> {
        try {
            const resp = await axios({
                method: 'post',
                url: '/api/v1/station',
                data: Utility.getStationUpload(orgId)
            })
            return resp?.data?.data
        } catch (err: any) {
            throw err?.response?.data?.message
        }
    }

    async createService(orgId: string): Promise<string> {
        try {
            const resp = await axios({
                method: 'post',
                url: '/api/v1/service',
                data: Utility.getServiceUpload(orgId)
            })
            return resp?.data?.data
        } catch (err: any) {
            throw err?.response?.data?.message
        }
    }
}

const run = async () => {
    const seeder = await new Seeder().seed()
    console.log(seeder)

}

run()
