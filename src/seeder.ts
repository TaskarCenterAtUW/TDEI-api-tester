import { Utility } from './utils'
import { SeedData, Users } from './models/types'
import axios, { AxiosInstance, InternalAxiosRequestConfig } from "axios";
import { environment } from './environment/environment';
import { existsSync } from "fs";
import { readFile, writeFile } from "fs/promises";
import { CommonAPIsApi, Configuration, GTFSFlexApi, GTFSPathwaysApi, JobDetails, JobDetailsStatusEnum, OSWApi } from 'tdei-client';

export class Seeder {
    private client: APIUtility;
    private readonly roles: Array<string>;
    private readonly data_types: Array<string>;
    private dgConfiguration: Configuration = {};

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
                //User associated project group and service
                const project_group = await this.client.createProjectGroup();
                seedData.project_group = project_group;
                const services = await this.createService(project_group.tdei_project_group_id);
                seedData.services = services;
                //User not associated project group and service
                const project_group_2 = await this.client.createProjectGroup();
                seedData.user_not_associated_project = project_group_2;
                const services_2 = await this.createService(project_group_2.tdei_project_group_id);
                seedData.user_not_associated_service = services_2;

                // seedData.users = await this.assignUserRoles(project_group.tdei_project_group_id)
                seedData.users = await this.createUserWithPromo(project_group.tdei_project_group_id);
                let userProfile = (await this.getUserProfile((seedData.users as Users).poc.username));
                seedData.api_key = userProfile.apiKey;
                if (seedData.users.api_key_tester) {
                    let apiTesterProfile = await this.getUserProfile(seedData.users.api_key_tester.username);
                    seedData.api_key_tester = apiTesterProfile.apiKey;
                }

                //seed osw datasets
                this.dgConfiguration = new Configuration({
                    username: seedData.users.osw_data_generator.username,
                    password: seedData.users.osw_data_generator.password,
                    basePath: environment.system.baseUrl
                });
                console.log("Configuration ", this.dgConfiguration);
                await Utility.setAuthToken(this.dgConfiguration);

                seedData.datasets = {} as any;
                console.log("seed osw datasets");
                const oswDatasets = await this.client.setupOSWDatasets(project_group.tdei_project_group_id, services.find(x => x.service_type == "osw")!.tdei_service_id, this.dgConfiguration);
                seedData.datasets.osw = oswDatasets;

                //Seed flex datasets
                this.dgConfiguration = new Configuration({
                    username: seedData.users.flex_data_generator.username,
                    password: seedData.users.flex_data_generator.password,
                    basePath: environment.system.baseUrl
                });
                await Utility.setAuthToken(this.dgConfiguration);
                console.log("seed flex datasets");
                const flexDatasets = await this.client.setupFlexDatasets(project_group.tdei_project_group_id, services.find(x => x.service_type == "flex")!.tdei_service_id, this.dgConfiguration);
                seedData.datasets.flex = flexDatasets;

                //Seed pathways datasets
                this.dgConfiguration = new Configuration({
                    username: seedData.users.pathways_data_generator.username,
                    password: seedData.users.pathways_data_generator.password,
                    basePath: environment.system.baseUrl
                });
                await Utility.setAuthToken(this.dgConfiguration);
                console.log("seed pathways datasets");
                const pathwaysDatasets = await this.client.setupPathwaysDatasets(project_group.tdei_project_group_id, services.find(x => x.service_type == "pathways")!.tdei_service_id, this.dgConfiguration);
                seedData.datasets.pathways = pathwaysDatasets;

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
            const result = await this.client.getUserProfile(user_name, environment.default.password!)
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
            console.info(`Created Service with ID and name : ${service.tdei_service_id} ${service.service_name}`);
            list.push(service);

        }
        return list;
    }

    public async removeHeader() {
        axios.defaults.headers.common.Authorization = null;
    }

    // private async assignUserRoles(project_group_id: string): Promise<Users> {
    //     console.log('Assigning user roles...');

    //     const users = Utility.getApiInput().users;
    //     let usersDictionary = {} as Users;
    //     try {
    //         for await (const role of this.roles) {
    //             await this.client.addPermission(project_group_id, users[role], role)
    //             console.info(`Added ${role} permission to username: ${users[role]}`)
    //             usersDictionary[role] = {
    //                 username: users[role],
    //                 password: environment.default.password
    //             }
    //         }
    //         // Assugn api_key_tester user to poc
    //         if (users.api_key_tester) {
    //             await this.client.addPermission(project_group_id, users.api_key_tester, 'poc')
    //             console.info(`Added poc permission to username: ${users.api_key_tester}`)
    //             usersDictionary['api_key_tester'] = {
    //                 username: users.api_key_tester,
    //                 password: environment.default.password
    //             }
    //         }
    //         //add default user 
    //         usersDictionary['default_user'] = {
    //             username: users.default_user,
    //             password: environment.default.password
    //         }
    //         return usersDictionary
    //     } catch (error) {
    //         console.error('assignUserRoles', error);
    //         throw error;
    //     }
    // }

    private async createUserWithPromo(project_group_id: string): Promise<Users> {
        console.log('Create users and register with promo code...');

        let usersDictionary = {} as Users;
        try {

            const promo_code = await this.client.createPromoCode(project_group_id);

            //Create user for each role using promo code
            for await (const role of this.roles) {
                const username = await this.client.createUserWithPromo(promo_code);
                await this.client.addPermission(project_group_id, username, role)
                console.info(`Added ${role} permission to username: ${username}`)
                usersDictionary[role] = {
                    username: username,
                    password: environment.default.password
                }
            }

            // Assign api_key_tester user to poc
            const api_tester_username = await this.client.createUserWithPromo(promo_code);
            await this.client.addPermission(project_group_id, api_tester_username, 'poc')
            console.info(`Added poc permission to username: ${api_tester_username}`)
            usersDictionary['api_key_tester'] = {
                username: api_tester_username,
                password: environment.default.password!
            }

            //add default user 
            usersDictionary['default_user'] = {
                username: environment.default.username!,
                password: environment.default.password!
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
    //             password: environment.default.password
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

    async createPromoCode(project_group_id: string): Promise<string> {
        const data = Utility.getPromoCodeUpload();
        try {
            const resp = await axios({
                method: 'post',
                url: `api/v1/project-group/${project_group_id}/referral-codes`,
                data: data
            });
            if (resp.status === 200) {
                console.log('Created Promo code : ', data.code);
                return data.code;
            } else {
                throw new Error(`Failed to create promo code, status code: ${resp.status}`);
            }
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
            console.log('Created Project group with ID & name : ', data.tdei_project_group_id, data.project_group_name);
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

    async createUserWithPromo(promo_code: string): Promise<string> {
        let data: any = Utility.getUserUpload();
        data.code = promo_code;
        try {
            const resp = await axios({
                method: 'post',
                url: `/api/v1/register`,
                data: data
            });
            console.log('Created User with username : ', data.email);
            return data.email;
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


    oswUploadRequestInterceptor = (request: InternalAxiosRequestConfig, tdei_project_group_id: string, service_id: string, datasetName: string, changestName: string, metafileName: string) => {
        if (
            request.url?.includes(`/api/v1/osw/upload/${tdei_project_group_id}/${service_id}`)
        ) {
            let data = request.data as FormData;
            let datasetFile = data.get("dataset") as File;
            let metaFile = data.get('metadata') as File;
            let changesetFile = data.get('changeset') as File;
            delete data['dataset'];
            delete data['metadata'];
            delete data['changeset'];
            data.set('dataset', datasetFile, datasetName);
            data.set('metadata', metaFile, metafileName);
            data.set('changeset', changesetFile, changestName);
        }
        return request;
    };

    cloneDatasetRequestInterceptor = (request: InternalAxiosRequestConfig, tdei_dataset_id: string, tdei_project_group_id: string, tdei_service_id: string, datasetName: string) => {
        if (
            request.url?.includes(`/api/v1/dataset/clone/${tdei_dataset_id}/${tdei_project_group_id}/${tdei_service_id}`)
        ) {
            let data = request.data as FormData;
            let metaFile = data.get("file") as File;
            delete data['file'];
            data.set('file', metaFile, datasetName);
        }
        return request;
    };

    async setupOSWDatasets(tdei_project_group_id: string, service_id: string, dgConfiguration: any): Promise<any> {
        let oswDatasets: {
            pre_release_dataset: string;
            test_dataset: string;
            published_dataset: string;
            spatial_target_dataset: string;
            spatial_source_dataset: string;
        } = {} as any;
        let oswAPI = new OSWApi(dgConfiguration);
        console.log("osw api config", dgConfiguration)
        let metaToUpload = Utility.getMetadataBlob("osw");
        let changesetToUpload = Utility.getChangesetBlob();
        let dataset = Utility.getOSWBlob();
        try {
            console.log('Uploading osw with project id and service id ', tdei_project_group_id, service_id)
            //upload pre-release dataset
            const uploadInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => this.oswUploadRequestInterceptor(req, tdei_project_group_id, service_id, 'osw-valid.zip', 'changeset.zip', 'metadata.json'))
            const uploadFileResponse = await oswAPI.uploadOswFileForm(dataset, metaToUpload, changesetToUpload, tdei_project_group_id, service_id);

            const uploadedJobId = uploadFileResponse.data;
            console.log("seed uploaded with job_id", uploadedJobId);
            axios.interceptors.request.eject(uploadInterceptor);

            //wait until the job is completed
            while (true) {
                let jobDetails = await this.waitForJobCompletion(uploadedJobId, tdei_project_group_id, dgConfiguration);
                if (jobDetails[0].status === JobDetailsStatusEnum.COMPLETED) {
                    let uploadedDatasetId = jobDetails[0].response_props.tdei_dataset_id;
                    oswDatasets.pre_release_dataset = uploadedDatasetId;
                    console.log("seed pre_release_dataset", oswDatasets.pre_release_dataset);
                    break;
                }
                await new Promise(resolve => setTimeout(resolve, 10000));
            }

            //Clone pre-release dataset to test dataset
            let metaToUpload_2 = Utility.getMetadataBlob("osw");
            let generalAPI = new CommonAPIsApi(dgConfiguration);
            const cloneInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => this.cloneDatasetRequestInterceptor(req, oswDatasets.pre_release_dataset, tdei_project_group_id, service_id, 'metadata.json'))
            const cloneFileResponse = await generalAPI.cloneDatasetForm(metaToUpload_2, oswDatasets.pre_release_dataset, tdei_project_group_id, service_id);
            axios.interceptors.request.eject(cloneInterceptor);
            const clonedDatasetId = cloneFileResponse.data;
            oswDatasets.test_dataset = clonedDatasetId;
            console.log("seed test_dataset tdei_dataset_id", oswDatasets.test_dataset);

            //Clone pre-release dataset and publish it
            let metaToUpload_3 = Utility.getMetadataBlob("osw");
            let generalAPI_2 = new CommonAPIsApi(dgConfiguration);
            const cloneInterceptor_2 = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => this.cloneDatasetRequestInterceptor(req, oswDatasets.pre_release_dataset, tdei_project_group_id, service_id, 'metadata.json'))
            const cloneFileResponse_2 = await generalAPI_2.cloneDatasetForm(metaToUpload_3, oswDatasets.pre_release_dataset, tdei_project_group_id, service_id);
            axios.interceptors.request.eject(cloneInterceptor_2);
            oswDatasets.published_dataset = cloneFileResponse_2.data;
            console.log("seed published_dataset tdei_dataset_id ", oswDatasets.published_dataset);

            let publishResponse = await oswAPI.publishOswFile(oswDatasets.published_dataset);
            const publishJobId = publishResponse.data;
            console.log("seed published_dataset publish_job_id", publishJobId);
            while (true) {
                let jobDetails = await this.waitForJobCompletion(publishJobId, tdei_project_group_id, dgConfiguration);
                if (jobDetails[0].status === JobDetailsStatusEnum.COMPLETED) {
                    console.log("seed published_dataset completed");
                    break;
                }
                await new Promise(resolve => setTimeout(resolve, 10000));
            }

            //Clone published dataset to spatial target dataset
            let metaToUpload_4 = Utility.getMetadataBlob("osw");
            let generalAPI_3 = new CommonAPIsApi(dgConfiguration);
            const cloneInterceptor_3 = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => this.cloneDatasetRequestInterceptor(req, oswDatasets.published_dataset, tdei_project_group_id, service_id, 'metadata.json'))
            const cloneFileResponse_3 = await generalAPI_3.cloneDatasetForm(metaToUpload_4, oswDatasets.published_dataset, tdei_project_group_id, service_id);
            axios.interceptors.request.eject(cloneInterceptor_3);
            const clonedDatasetId_3 = cloneFileResponse_3.data;
            console.log("seed spatial_target_dataset tdei_dataset_id", clonedDatasetId_3);
            oswDatasets.spatial_target_dataset = clonedDatasetId_3;
            console.log("seed spatial_target_dataset tdei_dataset_id", oswDatasets.spatial_target_dataset);

            //Clone published dataset to spatial source dataset
            let metaToUpload_5 = Utility.getMetadataBlob("osw");
            let generalAPI_4 = new CommonAPIsApi(dgConfiguration);
            const cloneInterceptor_4 = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => this.cloneDatasetRequestInterceptor(req, oswDatasets.published_dataset, tdei_project_group_id, service_id, 'metadata.json'))
            const cloneFileResponse_4 = await generalAPI_4.cloneDatasetForm(metaToUpload_5, oswDatasets.published_dataset, tdei_project_group_id, service_id);
            axios.interceptors.request.eject(cloneInterceptor_4);
            const clonedDatasetId_4 = cloneFileResponse_4.data;
            console.log("seed spatial_source_dataset tdei_dataset_id", clonedDatasetId_4);
            oswDatasets.spatial_source_dataset = clonedDatasetId_4;
            console.log("seed spatial_source_dataset tdei_dataset_id", oswDatasets.spatial_source_dataset);

            return oswDatasets;

        } catch (e) {
            console.log(e);
        }
    }

    flexUploadRequestInterceptor = (request: InternalAxiosRequestConfig, tdei_project_group_id: string, service_id: string, datasetName: string, changestName: string, metafileName: string) => {
        if (
            request.url?.includes(`/api/v1/gtfs-flex/upload/${tdei_project_group_id}/${service_id}`)
        ) {
            let data = request.data as FormData;
            let datasetFile = data.get("dataset") as File;
            let metaFile = data.get('metadata') as File;
            let changesetFile = data.get('changeset') as File;
            delete data['dataset'];
            delete data['metadata'];
            delete data['changeset'];
            data.set('dataset', datasetFile, datasetName);
            data.set('metadata', metaFile, metafileName);
            data.set('changeset', changesetFile, changestName);

        }
        return request;
    };

    async setupFlexDatasets(tdei_project_group_id: string, service_id: string, dgConfiguration: any): Promise<any> {
        let flexDatasets: {
            published_dataset: string;
            pre_release_dataset: string;
        } = {} as any;
        let flexAPI = new GTFSFlexApi(dgConfiguration);
        let metaToUpload = Utility.getMetadataBlob("flex");
        let changesetToUpload = Utility.getChangesetBlob();
        let dataset = Utility.getFlexBlob();
        try {
            //upload pre-release dataset
            const uploadInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => this.flexUploadRequestInterceptor(req, tdei_project_group_id, service_id, 'flex-valid.zip', 'changeset.zip', 'metadata.json'))
            const uploadFileResponse = await flexAPI.uploadGtfsFlexFileForm(dataset, metaToUpload, changesetToUpload, tdei_project_group_id, service_id);

            const uploadedJobId = uploadFileResponse.data;
            console.log("seed flex pre_release_dataset uploaded job_id", uploadedJobId);
            axios.interceptors.request.eject(uploadInterceptor);

            //wait until the job is completed
            while (true) {
                let jobDetails = await this.waitForJobCompletion(uploadedJobId, tdei_project_group_id, dgConfiguration);
                if (jobDetails[0].status === JobDetailsStatusEnum.COMPLETED) {
                    flexDatasets.pre_release_dataset = jobDetails[0].response_props.tdei_dataset_id;
                    console.log("seed flex pre_release_dataset tdei_dataset_id", flexDatasets.pre_release_dataset);
                    break;
                }
                await new Promise(resolve => setTimeout(resolve, 10000));
            }

            //Clone pre-release dataset to test dataset
            let metaToUpload_2 = Utility.getMetadataBlob("flex");
            let generalAPI = new CommonAPIsApi(dgConfiguration);
            const cloneInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => this.cloneDatasetRequestInterceptor(req, flexDatasets.pre_release_dataset, tdei_project_group_id, service_id, 'metadata.json'))
            const cloneFileResponse = await generalAPI.cloneDatasetForm(metaToUpload_2, flexDatasets.pre_release_dataset, tdei_project_group_id, service_id);
            axios.interceptors.request.eject(cloneInterceptor);
            const clonedDatasetId = cloneFileResponse.data;
            flexDatasets.published_dataset = clonedDatasetId;
            console.log("seed flex published_dataset tdei_dataset_id", flexDatasets.published_dataset);

            //publish test dataset
            let publishResponse = await flexAPI.publishGtfsFlexFile(clonedDatasetId);
            const publishJobId = publishResponse.data;
            console.log("seed flex published_dataset publish_job_id", publishJobId);
            while (true) {
                let jobDetails = await this.waitForJobCompletion(publishJobId, tdei_project_group_id, dgConfiguration);
                if (jobDetails[0].status === JobDetailsStatusEnum.COMPLETED) {
                    console.log("seed flex published_dataset completed");
                    break;
                }
                await new Promise(resolve => setTimeout(resolve, 10000));
            }
            return flexDatasets;
        } catch (e) {
            console.log(e);
        }
    }


    pathwaysUploadRequestInterceptor = (request: InternalAxiosRequestConfig, tdei_project_group_id: string, service_id: string, datasetName: string, changestName: string, metafileName: string) => {
        if (
            request.url?.includes(`/api/v1/gtfs-pathways/upload/${tdei_project_group_id}/${service_id}`)
        ) {
            let data = request.data as FormData;
            let datasetFile = data.get("dataset") as File;
            let metaFile = data.get('metadata') as File;
            let changesetFile = data.get('changeset') as File;
            delete data['dataset'];
            delete data['metadata'];
            delete data['changeset'];
            data.set('dataset', datasetFile, datasetName);
            data.set('metadata', metaFile, metafileName);
            data.set('changeset', changesetFile, changestName);
        }
        return request;
    };

    async setupPathwaysDatasets(tdei_project_group_id: string, service_id: string, dgConfiguration: any): Promise<any> {
        let pathwaysDatasets: {
            published_dataset: string;
            pre_release_dataset: string;
        } = {} as any;

        let pathwaysAPI = new GTFSPathwaysApi(dgConfiguration);
        let metaToUpload = Utility.getMetadataBlob("pathways");
        let changesetToUpload = Utility.getChangesetBlob();
        let dataset = Utility.getPathwaysBlob();
        try {
            //upload pre-release dataset
            const uploadInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => this.pathwaysUploadRequestInterceptor(req, tdei_project_group_id, service_id, 'pathways-valid.zip', 'changeset.zip', 'metadata.json'))
            const uploadFileResponse = await pathwaysAPI.uploadGtfsPathwaysFileForm(dataset, metaToUpload, changesetToUpload, tdei_project_group_id, service_id);

            const uploadedJobId = uploadFileResponse.data;
            console.log("seed pathways pre_release_dataset uploaded job_id", uploadedJobId);
            axios.interceptors.request.eject(uploadInterceptor);

            //wait until the job is completed
            while (true) {
                let jobDetails = await this.waitForJobCompletion(uploadedJobId, tdei_project_group_id, dgConfiguration);
                if (jobDetails[0].status === JobDetailsStatusEnum.COMPLETED) {
                    pathwaysDatasets.pre_release_dataset = jobDetails[0].response_props.tdei_dataset_id;
                    console.log("seed pathways pre_release_dataset tdei_dataset_id", pathwaysDatasets.pre_release_dataset);
                    break;
                }
                await new Promise(resolve => setTimeout(resolve, 10000));
            }

            //Clone pre-release dataset to test dataset
            let metaToUpload_2 = Utility.getMetadataBlob("pathways");
            let generalAPI = new CommonAPIsApi(dgConfiguration);
            const cloneInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => this.cloneDatasetRequestInterceptor(req, pathwaysDatasets.pre_release_dataset, tdei_project_group_id, service_id, 'metadata.json'))
            const cloneFileResponse = await generalAPI.cloneDatasetForm(metaToUpload_2, pathwaysDatasets.pre_release_dataset, tdei_project_group_id, service_id);
            axios.interceptors.request.eject(cloneInterceptor);
            const clonedDatasetId = cloneFileResponse.data;
            pathwaysDatasets.published_dataset = clonedDatasetId;
            console.log("seed pathways published_dataset tdei_dataset_id", pathwaysDatasets.published_dataset);

            //publish test dataset
            let publishResponse = await pathwaysAPI.publishGtfsPathwaysFile(pathwaysDatasets.published_dataset);
            const publishJobId = publishResponse.data;
            console.log("seed pathways test_dataset publish_job_id", publishJobId);
            while (true) {
                let jobDetails = await this.waitForJobCompletion(publishJobId, tdei_project_group_id, dgConfiguration);
                if (jobDetails[0].status === JobDetailsStatusEnum.COMPLETED) {
                    console.log("seed pathways published_dataset completed");
                    break;
                }
                await new Promise(resolve => setTimeout(resolve, 10000));
            }
            return pathwaysDatasets;
        } catch (e) {
            console.log(e);
        }
    }

    async waitForJobCompletion(jobId: string, tdei_project_group_id: string, dgConfiguration: any): Promise<JobDetails[]> {
        let generalAPI = new CommonAPIsApi(dgConfiguration);
        let uploadStatus = await generalAPI.listJobs(tdei_project_group_id, jobId, true);
        return uploadStatus.data;

    }
}
