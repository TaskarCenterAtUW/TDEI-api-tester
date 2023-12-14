import { Utility } from './utils'
import { SeedData } from './models/types'
import axios, { AxiosInstance } from "axios";
import { environment } from './environment/environment';
export class Seeder {
    private client: APIUtility;
    private readonly roles: Array<string>

    constructor() {
        this.client = new APIUtility()
        this.roles = ['poc', 'flex_data_generator', 'pathways_data_generator', 'osw_data_generator']
    }

    public async seed(): Promise<{} | SeedData> {
        await this.client.login()
        let seedData = {}
        const project_group_id = await this.client.createProjectGroup()
        console.info(`Created Project Group with ID: ${project_group_id}`)
        seedData['tdei_project_group_id'] = project_group_id
        const serviceId = await this.client.createService(project_group_id)
        console.info(`Created Service with ID: ${serviceId}`)
        seedData['service_id'] = serviceId
        const stationId = await this.client.createStation(project_group_id)
        seedData['station_id'] = stationId
        console.info(`Created Station with ID: ${stationId}`)
        seedData['users'] = await this.createUsers(project_group_id)
        return seedData
    }

    public async createStation(project_group_id: string): Promise<string> {
        await this.client.login()
        return this.client.createStation(project_group_id);
    }

    public async createService(project_group_id: string): Promise<string> {
        await this.client.login()
        return this.client.createService(project_group_id);
    }

    public async removeHeader() {
        axios.defaults.headers.common.Authorization = null;
    }

    private async createUsers(project_group_id): Promise<object> {
        const users = {}
        for await (const role of this.roles) {
            const userDetails = await this.client.createUser()
            await this.client.addPermission(project_group_id, userDetails.username, role)
            console.info(`Added ${role} permission to username: ${userDetails.username}`)
            users[role] = {
                username: userDetails.username,
                password: 'Pa$s1word'
            }
        }
        return users
    }

    public async deactivateProjectGroup(project_group_id: string): Promise<boolean> {
        return await this.client.activateOrDeactivateProjectGroup(project_group_id, false)
    }

    public async activateProjectGroup(project_group_id: string): Promise<boolean> {
        return await this.client.activateOrDeactivateProjectGroup(project_group_id, true)
    }
}


class APIUtility {
    private instance: AxiosInstance;

    constructor() {
        axios.defaults.baseURL = environment.seed.baseUrl;
        this.instance = axios.create();
        // console.log(Utility.getRandomProjectGroupUpload())
    }

    async login(): Promise<void> {
        try {
            const resp = await axios({
                method: 'post',
                url: '/api/v1/authenticate',
                data: {
                    username: environment.seed.adminUser,
                    password: environment.seed.adminPassword
                }
            })
            const accessToken = resp?.data?.access_token
            axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`
        } catch (err: any) {
            throw err?.response?.data?.message
        }
    }

    async createProjectGroup(): Promise<string> {
        try {
            const resp = await axios({
                method: 'post',
                url: '/api/v1/project-group',
                data: Utility.getRandomProjectGroupUpload()
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

    async addPermission(project_group_id: string, username: string, role: string): Promise<void> {
        try {
            const resp = await axios({
                method: 'post',
                url: '/api/v1/permission',
                data: {
                    tdei_project_group_id: project_group_id,
                    user_name: username,
                    roles: [role]
                }
            })
            return resp?.data?.data
        } catch (err: any) {
            throw err?.response?.data?.message
        }
    }

    async createStation(project_group_id: string): Promise<string> {
        try {
            const resp = await axios({
                method: 'post',
                url: '/api/v1/station',
                data: Utility.getStationUpload(project_group_id)
            })
            return resp?.data?.data
        } catch (err: any) {
            throw err?.response?.data?.message
        }
    }

    async createService(project_group_id: string): Promise<string> {
        try {
            const resp = await axios({
                method: 'post',
                url: '/api/v1/service',
                data: Utility.getServiceUpload(project_group_id)
            })
            return resp?.data?.data
        } catch (err: any) {
            throw err?.response?.data?.message
        }
    }

    async activateOrDeactivateProjectGroup(project_group_id: string, isActive: boolean): Promise<boolean> {
        if (!axios.defaults.headers.common['Authorization']) {
            await this.login()
        }
        try {
            const resp = await axios({
                method: 'delete',
                url: `/api/v1/project-group/${project_group_id}/active/${isActive}`,
            })
            return resp?.data
        } catch (err: any) {
            throw err?.response?.data
        }
    }
}
