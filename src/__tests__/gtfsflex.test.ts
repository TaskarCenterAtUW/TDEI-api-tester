

import { AuthenticationApi, GeneralApi, JobDetails, GTFSFlexApi, VersionSpec } from "tdei-client";
import { Utility } from "../utils";
import axios, { InternalAxiosRequestConfig } from "axios";
import AdmZip from "adm-zip";

const DOWNLOAD_FILE_PATH = `${__dirname}/gtfs-flex-tmp`;

describe('GTFS Flex service', () => {
    let configuration = Utility.getConfiguration();
    let validationJobId: string = '1';
    let uploadedJobId: string = '1';
    let uploadedDatasetId: string = '1';
    let publishJobId: string = '1';

    const uploadRequestInterceptor = (request: InternalAxiosRequestConfig, tdei_project_group_id: string, service_id: string, datasetName: string, changestName: string, metafileName: string) => {
        if (
            request.url?.includes(`${configuration.basePath}/api/v1/gtfs-flex/upload/${tdei_project_group_id}/${service_id}`)
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

    const validateRequestInterceptor = (request: InternalAxiosRequestConfig, datasetName: string) => {
        if (
            request.url === `${configuration.basePath}/api/v1/gtfs-flex/validate`
        ) {
            let data = request.data as FormData;
            let datasetFile = data.get("dataset") as File;
            delete data['dataset'];
            data.set('dataset', datasetFile, datasetName);
        }
        return request;
    };

    beforeAll(async () => {
        let authAPI = new AuthenticationApi(configuration);
        const loginResponse = await authAPI.authenticate({
            username: configuration.username,
            password: configuration.password
        });
        configuration.baseOptions = {
            headers: { ...Utility.addAuthZHeader(loginResponse.data.access_token) }
        };
    });


    describe('Upload Flex dataset', () => {
        describe('Functional', () => {
            it('When passed with valid token, metafile and changeset, should return 202 status with recordId in response', async () => {
                let flexAPI = new GTFSFlexApi(configuration);
                let metaToUpload = Utility.getMetadataBlob("flex");
                let changesetToUpload = Utility.getChangesetBlob();
                let dataset = Utility.getFlexBlob();
                let tdei_project_group_id = 'd8271b7d-a07f-4bc9-a0b9-8de864464277';
                let service_id = 'bb29e704-aaad-423e-8e31-cf8eff559585';
                let derived_from_dataset_id = '';
                try {
                    const uploadInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => uploadRequestInterceptor(req, tdei_project_group_id, service_id, 'flex-valid.zip', 'changeset.txt', 'metadata.json'))
                    const uploadFileResponse = await flexAPI.uploadGtfsFlexFileForm(dataset, metaToUpload, changesetToUpload, tdei_project_group_id, service_id, derived_from_dataset_id);

                    expect(uploadFileResponse.status).toBe(202);
                    expect(uploadFileResponse.data).not.toBeNull();
                    uploadedJobId = uploadFileResponse.data;
                    console.log("uploaded job_id", uploadedJobId);
                    axios.interceptors.request.eject(uploadInterceptor);
                } catch (e) {
                    console.log(e);
                }
            }, 20000);

            it('When passed with valid token, dataset and invalid metafile, should return 400 status with errors', async () => {
                let flexAPI = new GTFSFlexApi(configuration);
                let metaToUpload = Utility.getInvalidMetadataBlob("flex");
                let changesetToUpload = Utility.getChangesetBlob();
                let dataset = Utility.getFlexBlob();
                let tdei_project_group_id = 'd8271b7d-a07f-4bc9-a0b9-8de864464277';
                let service_id = 'bb29e704-aaad-423e-8e31-cf8eff559585';
                try {
                    const uploadInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => uploadRequestInterceptor(req, tdei_project_group_id, service_id, 'flex-valid.zip', 'changeset.txt', 'metadata.json'))
                    const uploadFileResponse = flexAPI.uploadGtfsFlexFileForm(dataset, metaToUpload, changesetToUpload, tdei_project_group_id, service_id)

                    expect(await uploadFileResponse).rejects.toMatchObject({ response: { status: 400 } });

                    axios.interceptors.request.eject(uploadInterceptor);
                } catch (e) {
                    console.log(e);
                }
            }, 20000)
        });
        describe('Validation', () => {
            it('When passed with invalid token, metafile and changeset, should return 401 status with recordId in response', async () => {
                let flexAPI = new GTFSFlexApi(Utility.getConfiguration());
                let metaToUpload = Utility.getMetadataBlob("flex");
                let changesetToUpload = Utility.getChangesetBlob();
                let dataset = Utility.getFlexBlob();
                let tdei_project_group_id = 'd8271b7d-a07f-4bc9-a0b9-8de864464277';
                let service_id = 'bb29e704-aaad-423e-8e31-cf8eff559585';

                const uploadInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => uploadRequestInterceptor(req, tdei_project_group_id, service_id, 'flex-valid.zip', 'changeset.txt', 'metadata.json'))
                const uploadFileResponse = flexAPI.uploadGtfsFlexFileForm(dataset, metaToUpload, changesetToUpload, tdei_project_group_id, service_id)

                await expect(uploadFileResponse).rejects.toMatchObject({ response: { status: 401 } });
                axios.interceptors.request.eject(uploadInterceptor);

            }, 20000)

        });
    });

    describe('Get Upload Status', () => {
        it('When passed without valid token, should respond with 401 status', async () => {
            let generalAPI = new GeneralApi(Utility.getConfiguration());

            let downloadResponse = generalAPI.listJobs(uploadedJobId);

            await expect(downloadResponse).rejects.toMatchObject({ response: { status: 401 } });
        });


        it('When passed with valid token, should respond with 200 status', async () => {
            let generalAPI = new GeneralApi(configuration);
            await new Promise((r) => setTimeout(r, 20000));
            let uploadStatus = await generalAPI.listJobs(uploadedJobId);
            expect(uploadStatus.status).toBe(200);
            expect(uploadStatus.data).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        job_id: expect.toBeOneOf([`${uploadedJobId}`]),
                        status: expect.toBeOneOf(["COMPLETED"])
                    })
                ])
            );
            uploadedDatasetId = uploadStatus.data[0].response_props.tdei_dataset_id;
            console.log("uploaded dataset_id", uploadedDatasetId);
        }, 25000);
    });

    describe('Publish the Flex dataset for the tdei_dataset_id', () => {
        it('When passed with valid token and valid tdei_dataset_id, should return a job_id', async () => {

            let flexAPI = new GTFSFlexApi(configuration);
            let publish = await flexAPI.publishGtfsFlexFile(uploadedDatasetId);
            expect(publish.status).toBe(202);
            expect(publish.data).toBeNumber();
            publishJobId = publish.data;
            console.log("publish job_id", publishJobId);
        });

        it('When passed with already published tdei_dataset_id, should respond with 400 status', async () => {

            let flexAPI = new GTFSFlexApi(configuration);
            let tdei_dataset_id = "40566429d02c4c80aee68c970977bed8";

            let publishResponse = flexAPI.publishGtfsFlexFile(tdei_dataset_id);

            await expect(publishResponse).rejects.toMatchObject({ response: { status: 400 } });
        })

        it('When passed without valid token, should respond with 401 status', async () => {
            let flexAPI = new GTFSFlexApi(Utility.getConfiguration());

            let publishResponse = flexAPI.publishGtfsFlexFile(uploadedJobId);

            await expect(publishResponse).rejects.toMatchObject({ response: { status: 401 } });
        })
    });

    describe('Get Publish Status', () => {
        it('When passed without valid token, should respond with 401 status', async () => {
            let generalAPI = new GeneralApi(Utility.getConfiguration());

            let downloadResponse = generalAPI.listJobs(publishJobId);

            await expect(downloadResponse).rejects.toMatchObject({ response: { status: 401 } });
        })


        it('When passed with valid token, should respond with 200 status', async () => {
            let generalAPI = new GeneralApi(configuration);
            await new Promise((r) => setTimeout(r, 20000));

            let uploadStatus = await generalAPI.listJobs(publishJobId);

            expect(uploadStatus.status).toBe(200);
            expect(uploadStatus.data).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        job_id: expect.toBeOneOf([`${publishJobId}`]),
                        status: expect.toBeOneOf(["COMPLETED"])
                    })
                ])
            );
        }, 25000);
    });

    describe('Validate Flex dataset', () => {
        describe('Functional', () => {
            it('When passed with valid dataset, should return 202 status with job_id in response', async () => {
                let flexAPI = new GTFSFlexApi(configuration);
                let dataset = Utility.getFlexBlob();
                try {
                    const validateInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => validateRequestInterceptor(req, 'flex-valid.zip'))
                    const uploadFileResponse = await flexAPI.validateGtfsFlexFileForm(dataset);

                    expect(uploadFileResponse.status).toBe(202);
                    expect(uploadFileResponse.data).not.toBeNull();
                    validationJobId = uploadFileResponse.data;
                    console.log("validation job_id", validationJobId);
                    axios.interceptors.request.eject(validateInterceptor);
                } catch (e) {
                    console.log(e);
                }
            }, 20000)
        });

        describe('Validation', () => {
            it('When passed with invalid token, dataset, should return 401 status with recordId in response', async () => {
                let flexAPI = new GTFSFlexApi(Utility.getConfiguration());
                let dataset = Utility.getFlexBlob();

                const validateInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => validateRequestInterceptor(req, 'flex-valid.zip'))
                const uploadFileResponse = flexAPI.validateGtfsFlexFileForm(dataset);

                await expect(uploadFileResponse).rejects.toMatchObject({ response: { status: 401 } });
                axios.interceptors.request.eject(validateInterceptor);

            }, 20000);

        });
    });

    describe('Validate Status', () => {
        it('When passed without valid token, should respond with 401 status', async () => {
            let generalAPI = new GeneralApi(Utility.getConfiguration());
            let validateStatusResponse = generalAPI.listJobs(validationJobId);
            await expect(validateStatusResponse).rejects.toMatchObject({ response: { status: 401 } });
        })

        it('When passed with valid token, should respond with 200 status', async () => {
            let generalAPI = new GeneralApi(configuration);

            await new Promise((r) => setTimeout(r, 20000));
            let validateStatus = await generalAPI.listJobs(validationJobId);

            expect(validateStatus.status).toBe(200);
            expect(validateStatus.data).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        job_id: expect.toBeOneOf([`${validationJobId}`]),
                        status: expect.toBeOneOf(["COMPLETED"])
                    })
                ])
            );
        }, 25000);
    });

    describe('List Flex Versions', () => {
        it('When passed with valid token, should respond with 200 status', async () => {
            let flexAPI = new GTFSFlexApi(configuration);

            let versions = await flexAPI.listGtfsFlexVersions();

            expect(versions.status).toBe(200);
            expect(Array.isArray(versions.data.versions)).toBe(true);
            versions.data.versions?.forEach(version => {
                expect(version).toMatchObject(<VersionSpec>{
                    version: expect.any(String),
                    documentation: expect.any(String),
                    specification: expect.any(String)
                })
            })
        })

        it('When passed without valid token, should respond with 401 status', async () => {
            let flexAPI = new GTFSFlexApi(Utility.getConfiguration());

            let versionsResponse = flexAPI.listGtfsFlexVersions();

            await expect(versionsResponse).rejects.toMatchObject({ response: { status: 401 } });
        })
    });

    describe('Download Flex File as zip', () => {
        describe('Functional', () => {
            it('When passed with valid recordId, should be able to get the zip file', async () => {

                let flexAPI = new GTFSFlexApi(configuration);

                let response = await flexAPI.getGtfsFlexFile(uploadedDatasetId, { responseType: 'arraybuffer' });
                const data: any = response.data;
                const contentType = response.headers['content-type'];
                const zip = new AdmZip(data);
                const entries = zip.getEntries();

                expect(entries.length).toBeGreaterThanOrEqual(0);
                expect(contentType).toBe("application/zip");
                expect(response.data).not.toBeNull();
                expect(response.status).toBe(200);
            }, 10000);
        });

        describe('Validation', () => {
            it('When passed with valid recordId and invalid token, should return 401 status', async () => {

                let flexAPI = new GTFSFlexApi(Utility.getConfiguration());

                let response = flexAPI.getGtfsFlexFile(uploadedDatasetId);

                await expect(response).rejects.toMatchObject({ response: { status: 401 } });

            })

            it('When passed with invalid record and valid token, should return 404 status', async () => {

                let recordId = 'dummyRecordId';
                let flexAPI = new GTFSFlexApi(configuration);

                let response = flexAPI.getGtfsFlexFile(recordId);

                await expect(response).rejects.toMatchObject({ response: { status: 404 } });

            })
        });
    });
});