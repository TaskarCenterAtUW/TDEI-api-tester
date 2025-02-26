import { Utility } from './utils'
import { SeedData, Users } from './models/types'
import axios, { AxiosInstance } from "axios";
import { environment } from './environment/environment';
import { existsSync } from "fs";
import { readFile, writeFile } from "fs/promises";
import apiInput from "../api.input.json";

export class Seeder {
    private client: APIUtility;
    private readonly roles: Array<string>;
    private readonly data_types: Array<string>;

    constructor() {
        this.client = new APIUtility()
        this.roles = ['poc', 'flex_data_generator', 'pathways_data_generator', 'osw_data_generator']
        this.data_types = ['osw', 'flex', 'pathways']
    }

    public async seed(freshSeed = false): Promise<{} | SeedData> {
        try {
            if (!freshSeed && existsSync('seed.data.json')) {
                const data = await readFile('seed.data.json', { encoding: 'utf8' });
                if (data) {
                    console.log("Serving from local seed data!");
                    return JSON.parse(data);
                }
                return {};
            } else {
                console.log('Seeding...');
                await this.client.login()
                let seedData: SeedData = {} as any;
                const project_group = await this.client.createProjectGroup()
                seedData.project_group = project_group
                const services = await this.createService(project_group.tdei_project_group_id)
                seedData.services = services
                seedData.users = await this.assignUserRoles(project_group.tdei_project_group_id)
                let userProfile = (await this.getUserProfile((seedData.users as Users).poc.username));
                seedData.api_key = userProfile.apiKey;
                if (seedData.users.api_key_tester) {
                    let apiTesterProfile = await this.getUserProfile(seedData.users.api_key_tester.username);
                    seedData.api_key_tester = apiTesterProfile.apiKey;
                }

                await this.writeFile(seedData);
                console.info('Seeding complete');
                return seedData;
            }
        } catch (error) {
            console.error('seed error ', error);
            throw error;
        }
    }

    private async writeFile(data) {
        await writeFile('./seed.data.json', JSON.stringify(data), 'utf8');
    }

    public async getUserProfile(user_name: string): Promise<any> {
        try {
            await this.client.login();
            const result = await this.client.getUserProfile(user_name, 'Pa$s1word')
            return result;
        } catch (error) {
            console.log(user_name)
            console.error('getUserProfile', error);
            throw error;
        }
    }

    public async createService(project_group_id: string): Promise<[{
        tdei_project_group_id: string,
        service_type: string,
        service_name: string,
        tdei_service_id: string
    }]> {
        await this.client.login();
        let list: [{
            tdei_project_group_id: string,
            service_type: string,
            service_name: string,
            tdei_service_id: string
        }] = [] as any;
        for await (const data_type of this.data_types) {
            const service = await this.client.createService(project_group_id, data_type)
            console.info(`Created Service with ID: ${service.tdei_service_id}`);
            list.push(service);

        }
        return list;
    }

    public async removeHeader() {
        axios.defaults.headers.common.Authorization = null;
    }

    private async assignUserRoles(project_group_id: string): Promise<Users> {
        console.log('Assigning user roles...')
        const users = apiInput.dev.users; // Have to change based on the environment though.
        let usersDictionary = {} as Users;
        try {
            for await (const role of this.roles) {
                await this.client.addPermission(project_group_id, users[role], role)
                console.info(`Added ${role} permission to username: ${users[role]}`)
                usersDictionary[role] = {
                    username: users[role],
                    password: 'Pa$s1word'
                }
            }
            // Assugn api_key_tester user to poc
            if (users.api_key_tester) {
                await this.client.addPermission(project_group_id, users.api_key_tester, 'poc')
                console.info(`Added poc permission to username: ${users.api_key_tester}`)
                usersDictionary['api_key_tester'] = {
                    username: users.api_key_tester,
                    password: 'Pa$s1word'
                }
            }
            return usersDictionary
        } catch (error) {
            console.error('assignUserRoles', error);
            throw error;
        }
    }

    // private async createUsers(project_group_id): Promise<object> {
    //     const users = {}
    //     for await (const role of this.roles) {
    //         const userDetails = await this.client.createUser()
    //         await this.client.addPermission(project_group_id, userDetails.username, role)
    //         console.info(`Added ${role} permission to username: ${userDetails.username}`)
    //         users[role] = {
    //             username: userDetails.username,
    //             password: 'Pa$s1word'
    //         }
    //     }
    //     return users
    // }

    // public async deactivateProjectGroup(project_group_id: string): Promise<boolean> {
    //     return await this.client.activateOrDeactivateProjectGroup(project_group_id, false)
    // }

    // public async activateProjectGroup(project_group_id: string): Promise<boolean> {
    //     return await this.client.activateOrDeactivateProjectGroup(project_group_id, true)
    // }
}


class APIUtility {
    private instance: AxiosInstance;

    constructor() {
        axios.defaults.baseURL = environment.seed.baseUrl;
        this.instance = axios.create();
        // console.log(Utility.getRandomProjectGroupUpload())
    }

    async login(userName: string = environment.seed.adminUser!, password: string = environment.seed.adminPassword!): Promise<void> {
        try {
            const resp = await axios({
                method: 'post',
                url: '/api/v1/authenticate',
                data: {
                    username: userName,
                    password: password
                }
            });
            const accessToken = resp?.data?.access_token
            axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`
        } catch (err: any) {
            throw err;
        }
    }

    async createProjectGroup(): Promise<{
        tdei_project_group_id: string;
        name: string;
    }> {
        try {
            let data: any = Utility.getRandomProjectGroupUpload();
            const resp = await axios({
                method: 'post',
                url: '/api/v1/project-group',
                data: data
            });

            data.tdei_project_group_id = resp?.data?.data;

            return { tdei_project_group_id: data.tdei_project_group_id, name: data.project_group_name };
        } catch (err: any) {
            throw err;
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
            throw err;
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
            console.error(err)
            throw err;
        }
    }

    async createService(project_group_id: string, service_type: string): Promise<any> {
        try {
            let data: any = Utility.getServiceUpload(project_group_id, service_type);
            const resp = await axios({
                method: 'post',
                url: '/api/v1/service',
                data: data
            })
            data.tdei_service_id = resp?.data?.data;
            return { tdei_service_id: data.tdei_service_id, service_type: data.service_type, service_name: data.service_name, tdei_project_group_id: data.tdei_project_group_id };
        } catch (err: any) {
            throw err;
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
            throw err;
        }
    }

    async getUserProfile(user_name: string, password: string): Promise<string> {
        this.login(user_name, password);
        try {
            const resp = await axios({
                method: 'get',
                url: '/api/v1/user-profile?user_name=' + user_name,
            })
            return resp?.data;
        } catch (err: any) {
            throw err;
        }
    }
}
