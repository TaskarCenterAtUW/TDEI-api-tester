import { Configuration, GeneralApi, GTFSFlexApi, VersionSpec } from "tdei-client";
import { Utility } from "../utils";
import axios, { InternalAxiosRequestConfig } from "axios";
import AdmZip from "adm-zip";

const NULL_PARAM = void 0;

let apiKeyConfiguration: Configuration = {};
let pocConfiguration: Configuration = {};
let dgConfiguration: Configuration = {};
let adminConfiguration: Configuration = {};
let validationJobId: string = '1';
let uploadedJobId: string = '1';
let uploadedDatasetId: string = '1';
let publishJobId: string = '1';
let tdei_project_group_id = "";
let service_id = "";

const editMetadataRequestInterceptor = (request: InternalAxiosRequestConfig, tdei_dataset_id: string, datasetName: string) => {
    if (
        request.url === `${adminConfiguration.basePath}/api/v1/metadata/${tdei_dataset_id}`
    ) {
        let data = request.data as FormData;
        let metaFile = data.get("file") as File;
        delete data['file'];
        data.set('file', metaFile, datasetName);
    }
    return request;
};

const uploadRequestInterceptor = (request: InternalAxiosRequestConfig, tdei_project_group_id: string, service_id: string, datasetName: string, changestName: string, metafileName: string) => {
    if (
        request.url?.includes(`${adminConfiguration.basePath}/api/v1/gtfs-flex/upload/${tdei_project_group_id}/${service_id}`)
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
        request.url === `${adminConfiguration.basePath}/api/v1/gtfs-flex/validate`
    ) {
        let data = request.data as FormData;
        let datasetFile = data.get("dataset") as File;
        delete data['dataset'];
        data.set('dataset', datasetFile, datasetName);
    }
    return request;
};

beforeAll(async () => {
    let seedData = Utility.seedData;
    tdei_project_group_id = seedData.tdei_project_group_id;
    service_id = seedData.service_id.find(x => x.data_type == "flex")!.serviceId;
    apiKeyConfiguration = Utility.getApiKeyConfiguration();
    pocConfiguration = Utility.getPocConfiguration();
    dgConfiguration = Utility.getFlexDataGeneratorConfiguration();
    adminConfiguration = Utility.getAdminConfiguration();
    await Utility.setAuthToken(adminConfiguration);
    await Utility.setAuthToken(pocConfiguration);
    await Utility.setAuthToken(dgConfiguration);

});


describe('Upload flex dataset', () => {

    it('Flex Data Generator | Authenticated , When request made with dataset, metadata and changeset file, should return request job id as response', async () => {
        let flexAPI = new GTFSFlexApi(dgConfiguration);
        let metaToUpload = Utility.getMetadataBlob("flex");
        let changesetToUpload = Utility.getChangesetBlob();
        let dataset = Utility.getFlexBlob();
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

    it('POC | Authenticated , When request made with dataset, metadata and changeset file, should return request job id as response', async () => {
        let flexAPI = new GTFSFlexApi(pocConfiguration);
        let metaToUpload = Utility.getMetadataBlob("flex");
        let changesetToUpload = Utility.getChangesetBlob();
        let dataset = Utility.getFlexBlob();
        let derived_from_dataset_id = '';
        try {
            const uploadInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => uploadRequestInterceptor(req, tdei_project_group_id, service_id, 'flex-valid.zip', 'changeset.txt', 'metadata.json'))
            const uploadFileResponse = await flexAPI.uploadGtfsFlexFileForm(dataset, metaToUpload, changesetToUpload, tdei_project_group_id, service_id, derived_from_dataset_id);

            expect(uploadFileResponse.status).toBe(202);
            expect(uploadFileResponse.data).not.toBeNull();
            axios.interceptors.request.eject(uploadInterceptor);
        } catch (e) {
            console.log(e);
        }
    }, 20000);

    it('Admin | Authenticated , When request made with dataset, metadata and changeset file, should return request job id as response', async () => {
        let flexAPI = new GTFSFlexApi(adminConfiguration);
        let metaToUpload = Utility.getMetadataBlob("flex");
        let changesetToUpload = Utility.getChangesetBlob();
        let dataset = Utility.getFlexBlob();
        let derived_from_dataset_id = '';
        try {
            const uploadInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => uploadRequestInterceptor(req, tdei_project_group_id, service_id, 'flex-valid.zip', 'changeset.txt', 'metadata.json'))
            const uploadFileResponse = await flexAPI.uploadGtfsFlexFileForm(dataset, metaToUpload, changesetToUpload, tdei_project_group_id, service_id, derived_from_dataset_id);

            expect(uploadFileResponse.status).toBe(202);
            expect(uploadFileResponse.data).not.toBeNull();

            axios.interceptors.request.eject(uploadInterceptor);
        } catch (e) {
            console.log(e);
        }
    }, 20000);

    it('Admin | Authenticated , When request made with dataset and invalid metafile, should return bad request with metadata validation errors', async () => {
        let flexAPI = new GTFSFlexApi(adminConfiguration);
        let metaToUpload = Utility.getInvalidMetadataBlob("flex");
        let changesetToUpload = Utility.getChangesetBlob();
        let dataset = Utility.getFlexBlob();
        try {
            const uploadInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => uploadRequestInterceptor(req, tdei_project_group_id, service_id, 'flex-valid.zip', 'changeset.txt', 'metadata.json'))
            const uploadFileResponse = flexAPI.uploadGtfsFlexFileForm(dataset, metaToUpload, changesetToUpload, tdei_project_group_id, service_id)

            expect(await uploadFileResponse).rejects.toMatchObject({ response: { status: 400 } });

            axios.interceptors.request.eject(uploadInterceptor);
        } catch (e) {
            console.log(e);
        }
    }, 20000)

    it('Admin | Authenticated , When request made with invalid service id, should return bad request with metadata validation errors', async () => {
        let flexAPI = new GTFSFlexApi(adminConfiguration);
        let metaToUpload = Utility.getMetadataBlob("flex");
        let changesetToUpload = Utility.getChangesetBlob();
        let dataset = Utility.getFlexBlob();
        try {
            const uploadInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => uploadRequestInterceptor(req, tdei_project_group_id, "invalid_service_id", 'flex-valid.zip', 'changeset.txt', 'metadata.json'))
            const uploadFileResponse = flexAPI.uploadGtfsFlexFileForm(dataset, metaToUpload, changesetToUpload, tdei_project_group_id, "invalid_service_id")

            expect(await uploadFileResponse).rejects.toMatchObject({ response: { status: 400 } });

            axios.interceptors.request.eject(uploadInterceptor);
        } catch (e) {
            console.log(e);
        }
    }, 20000)

    it('Admin | Authenticated , When request made with invalid project id, should return bad request with metadata validation errors', async () => {
        let flexAPI = new GTFSFlexApi(adminConfiguration);
        let metaToUpload = Utility.getMetadataBlob("flex");
        let changesetToUpload = Utility.getChangesetBlob();
        let dataset = Utility.getFlexBlob();
        try {
            const uploadInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => uploadRequestInterceptor(req, "invalid_tdei_project_group_id", service_id, 'flex-valid.zip', 'changeset.txt', 'metadata.json'))
            const uploadFileResponse = flexAPI.uploadGtfsFlexFileForm(dataset, metaToUpload, changesetToUpload, "invalid_tdei_project_group_id", service_id)

            expect(await uploadFileResponse).rejects.toMatchObject({ response: { status: 400 } });

            axios.interceptors.request.eject(uploadInterceptor);
        } catch (e) {
            console.log(e);
        }
    }, 20000)

    it('Admin | un-authenticated , When request made with dataset, metadata and changeset file, should respond with unauthenticated request', async () => {
        let flexAPI = new GTFSFlexApi(Utility.getAdminConfiguration());
        let metaToUpload = Utility.getMetadataBlob("flex");
        let changesetToUpload = Utility.getChangesetBlob();
        let dataset = Utility.getFlexBlob();

        const uploadInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => uploadRequestInterceptor(req, tdei_project_group_id, service_id, 'flex-valid.zip', 'changeset.txt', 'metadata.json'))
        const uploadFileResponse = flexAPI.uploadGtfsFlexFileForm(dataset, metaToUpload, changesetToUpload, tdei_project_group_id, service_id)

        await expect(uploadFileResponse).rejects.toMatchObject({ response: { status: 401 } });
        axios.interceptors.request.eject(uploadInterceptor);

    }, 20000)

    it('API-Key | Authenticated , When request made with dataset, metadata and changeset file, should respond with unauthorized request', async () => {
        let flexAPI = new GTFSFlexApi(apiKeyConfiguration);
        let metaToUpload = Utility.getMetadataBlob("flex");
        let changesetToUpload = Utility.getChangesetBlob();
        let dataset = Utility.getFlexBlob();

        const uploadInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => uploadRequestInterceptor(req, tdei_project_group_id, service_id, 'flex-valid.zip', 'changeset.txt', 'metadata.json'))
        const uploadFileResponse = flexAPI.uploadGtfsFlexFileForm(dataset, metaToUpload, changesetToUpload, tdei_project_group_id, service_id)

        await expect(uploadFileResponse).rejects.toMatchObject({ response: { status: 401 } });
        axios.interceptors.request.eject(uploadInterceptor);

    }, 20000)
});

describe('Check upload request job completion status', () => {
    jest.retryTimes(1, { logErrorsBeforeRetry: true });
    it('Flex Data Generator | Authenticated , When request made, should respond with job status', async () => {
        let generalAPI = new GeneralApi(dgConfiguration);
        await new Promise((r) => setTimeout(r, 20000));
        let uploadStatus = await generalAPI.listJobs(uploadedJobId, true, NULL_PARAM, NULL_PARAM, tdei_project_group_id);
        expect(uploadStatus.status).toBe(200);
        expect(uploadStatus.data).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    job_id: expect.toBeOneOf([`${uploadedJobId}`]),
                    status: expect.toBeOneOf(["COMPLETED"]),
                    progress: expect.objectContaining({
                        total_stages: expect.any(Number),
                        completed_stages: expect.any(Number),
                        current_state: expect.toBeOneOf(["COMPLETED", "IN-PROGRESS", "RUNNING"]),
                        current_stage: expect.any(String)
                    })
                })
            ])
        );
        uploadedDatasetId = uploadStatus.data[0].response_props.tdei_dataset_id;
        console.log("uploaded dataset_id", uploadedDatasetId);
    }, 25000);

    it('POC | Authenticated , When request made, should respond with job status', async () => {
        let generalAPI = new GeneralApi(pocConfiguration);
        let uploadStatus = await generalAPI.listJobs(uploadedJobId, true, NULL_PARAM, NULL_PARAM, tdei_project_group_id);
        expect(uploadStatus.status).toBe(200);
    }, 25000);


    it('Admin | Authenticated , When request made, should respond with job status', async () => {
        let generalAPI = new GeneralApi(adminConfiguration);
        let uploadStatus = await generalAPI.listJobs(uploadedJobId, true, NULL_PARAM, NULL_PARAM);
        expect(uploadStatus.status).toBe(200);
    }, 25000);

    it('Admin | un-authenticated , When request made, should respond with unauthenticated request', async () => {
        let generalAPI = new GeneralApi(Utility.getAdminConfiguration());

        let listResponse = generalAPI.listJobs(uploadedJobId, true, NULL_PARAM, NULL_PARAM);

        await expect(listResponse).rejects.toMatchObject({ response: { status: 401 } });
    });

    it('API-Key | Authenticated , When request made, should respond with success request', async () => {
        let generalAPI = new GeneralApi(apiKeyConfiguration);

        let listResponse = await generalAPI.listJobs(uploadedJobId, true, NULL_PARAM, NULL_PARAM, tdei_project_group_id);

        expect(listResponse.status).toBe(200);
    });
});

describe("Edit Metadata API", () => {

    it('Flex Data Generator | Authenticated , When request made, expect to return sucess', async () => {
        // Arrange
        let generalAPI = new GeneralApi(dgConfiguration);
        let metaToUpload = Utility.getMetadataBlob("flex");
        let tdei_dataset_id = uploadedDatasetId;
        // Action
        const editMetaInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => editMetadataRequestInterceptor(req, tdei_dataset_id, 'metadata.json'))
        const versions = await generalAPI.editMetadataForm(metaToUpload, tdei_dataset_id);
        // Assert
        expect(versions.status).toBe(200);
        axios.interceptors.request.eject(editMetaInterceptor);
    }, 30000);

    it('POC | Authenticated , When request made, expect to return sucess', async () => {
        // Arrange
        let generalAPI = new GeneralApi(pocConfiguration);
        let metaToUpload = Utility.getMetadataBlob("flex");
        let tdei_dataset_id = uploadedDatasetId;
        // Action
        const editMetaInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => editMetadataRequestInterceptor(req, tdei_dataset_id, 'metadata.json'))
        const versions = await generalAPI.editMetadataForm(metaToUpload, tdei_dataset_id);
        // Assert
        expect(versions.status).toBe(200);
        axios.interceptors.request.eject(editMetaInterceptor);
    }, 30000);

    it('Admin | Authenticated , When request made, expect to return sucess', async () => {
        // Arrange
        let generalAPI = new GeneralApi(adminConfiguration);
        let metaToUpload = Utility.getMetadataBlob("flex");
        let tdei_dataset_id = uploadedDatasetId;
        // Action
        const editMetaInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => editMetadataRequestInterceptor(req, tdei_dataset_id, 'metadata.json'))
        const versions = await generalAPI.editMetadataForm(metaToUpload, tdei_dataset_id);
        // Assert
        expect(versions.status).toBe(200);
        axios.interceptors.request.eject(editMetaInterceptor);
    }, 30000);

    it('Admin | un-authenticated, When request made, should respond with unauthenticated request', async () => {

        // Arrange
        let generalAPI = new GeneralApi(Utility.getAdminConfiguration());
        let metaToUpload = Utility.getMetadataBlob("flex");
        let tdei_dataset_id = uploadedDatasetId;
        // Action
        const editMetaInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => editMetadataRequestInterceptor(req, tdei_dataset_id, 'metadata.json'))
        // Assert
        await expect(generalAPI.editMetadataForm(metaToUpload, tdei_dataset_id)).rejects.toMatchObject({ response: { status: 401 } });
        axios.interceptors.request.eject(editMetaInterceptor);
    }, 30000);
});

describe('Publish the flex dataset', () => {
    it('Flex Data Generator | Authenticated , When request made with tdei_dataset_id, should return request job id as response', async () => {

        let flexAPI = new GTFSFlexApi(dgConfiguration);
        let publish = await flexAPI.publishGtfsFlexFile(uploadedDatasetId);
        expect(publish.status).toBe(202);
        expect(publish.data).toBeNumber();
        publishJobId = publish.data;
        console.log("publish job_id", publishJobId);
    });

    it('Admin | When passed with already published tdei_dataset_id, should respond with bad request', async () => {

        let flexAPI = new GTFSFlexApi(adminConfiguration);
        let tdei_dataset_id = "8a859fd3-0443-4d75-9962-b081b5b9f8b0";

        let publishResponse = flexAPI.publishGtfsFlexFile(tdei_dataset_id);

        await expect(publishResponse).rejects.toMatchObject({ response: { status: 400 } });
    });

    it('Admin | un-authenticated , When request made, should respond with unauthenticated request', async () => {
        let flexAPI = new GTFSFlexApi(Utility.getAdminConfiguration());

        let publishResponse = flexAPI.publishGtfsFlexFile(uploadedDatasetId);

        await expect(publishResponse).rejects.toMatchObject({ response: { status: 401 } });
    });

    it('API-Key | Authenticated , When request made, should respond with unauthorized request', async () => {
        let flexAPI = new GTFSFlexApi(apiKeyConfiguration);

        let publishResponse = flexAPI.publishGtfsFlexFile(uploadedDatasetId);

        await expect(publishResponse).rejects.toMatchObject({ response: { status: 401 } });
    });
});

describe('Check publish request job completion status', () => {
    jest.retryTimes(1, { logErrorsBeforeRetry: true });

    it('Admin | Authenticated , When request made, should respond with job status', async () => {
        let generalAPI = new GeneralApi(adminConfiguration);
        await new Promise((r) => setTimeout(r, 20000));

        let uploadStatus = await generalAPI.listJobs(publishJobId, true, NULL_PARAM, NULL_PARAM, tdei_project_group_id);

        expect(uploadStatus.status).toBe(200);
        expect(uploadStatus.data).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    job_id: expect.toBeOneOf([`${publishJobId}`]),
                    status: expect.toBeOneOf(["COMPLETED"]),
                    progress: expect.objectContaining({
                        total_stages: expect.any(Number),
                        completed_stages: expect.any(Number),
                        current_state: expect.toBeOneOf(["COMPLETED", "IN-PROGRESS", "RUNNING"]),
                        current_stage: expect.any(String)
                    })
                })
            ])
        );
    }, 25000);

    it('POC | Authenticated , When request made, should respond with job status', async () => {
        let generalAPI = new GeneralApi(pocConfiguration);
        let uploadStatus = await generalAPI.listJobs(publishJobId, true, NULL_PARAM, NULL_PARAM, tdei_project_group_id);
        expect(uploadStatus.status).toBe(200);
    }, 25000);


    it('Admin | Authenticated , When request made, should respond with job status', async () => {
        let generalAPI = new GeneralApi(adminConfiguration);
        let uploadStatus = await generalAPI.listJobs(publishJobId, true, NULL_PARAM, NULL_PARAM);
        expect(uploadStatus.status).toBe(200);
    }, 25000);

    it('Admin | un-authenticated , When request made, should respond with unauthenticated request', async () => {
        let generalAPI = new GeneralApi(Utility.getAdminConfiguration());

        let downloadResponse = generalAPI.listJobs(publishJobId, true, NULL_PARAM, NULL_PARAM);

        await expect(downloadResponse).rejects.toMatchObject({ response: { status: 401 } });
    });

});

describe('Validate-only flex dataset request', () => {
    it('Flex Data Generator | Authenticated , When request made with valid dataset, should return request job id as response', async () => {
        let flexAPI = new GTFSFlexApi(dgConfiguration);
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

    it('Admin | Authenticated , When request made with valid dataset, should return request job id as response', async () => {
        let flexAPI = new GTFSFlexApi(adminConfiguration);
        let dataset = Utility.getFlexBlob();
        try {
            const validateInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => validateRequestInterceptor(req, 'flex-valid.zip'))
            const uploadFileResponse = await flexAPI.validateGtfsFlexFileForm(dataset);

            expect(uploadFileResponse.status).toBe(202);
            expect(uploadFileResponse.data).not.toBeNull();
            axios.interceptors.request.eject(validateInterceptor);
        } catch (e) {
            console.log(e);
        }
    }, 20000)

    it('Admin | un-authenticated , When request made with dataset, should return with unauthenticated request', async () => {
        let flexAPI = new GTFSFlexApi(Utility.getAdminConfiguration());
        let dataset = Utility.getFlexBlob();

        const validateInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => validateRequestInterceptor(req, 'flex-valid.zip'))
        const uploadFileResponse = flexAPI.validateGtfsFlexFileForm(dataset);

        await expect(uploadFileResponse).rejects.toMatchObject({ response: { status: 401 } });
        axios.interceptors.request.eject(validateInterceptor);

    }, 20000);

    it('API-Key | Authenticated , When request made with dataset, should return with unauthorized request', async () => {
        let flexAPI = new GTFSFlexApi(apiKeyConfiguration);
        let dataset = Utility.getFlexBlob();

        const validateInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => validateRequestInterceptor(req, 'flex-valid.zip'))
        const uploadFileResponse = flexAPI.validateGtfsFlexFileForm(dataset);

        await expect(uploadFileResponse).rejects.toMatchObject({ response: { status: 401 } });
        axios.interceptors.request.eject(validateInterceptor);

    }, 20000);

});

describe('Check validation-only request job completion status', () => {
    jest.retryTimes(1, { logErrorsBeforeRetry: true });
    it('Admin | Authenticated , When request made, should respond with job status', async () => {
        let generalAPI = new GeneralApi(adminConfiguration);

        await new Promise((r) => setTimeout(r, 20000));
        let validateStatus = await generalAPI.listJobs(validationJobId, true, NULL_PARAM, NULL_PARAM);

        expect(validateStatus.status).toBe(200);
        expect(validateStatus.data).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    job_id: expect.toBeOneOf([`${validationJobId}`]),
                    status: expect.toBeOneOf(["COMPLETED", "IN-PROGRESS"]),
                    progress: expect.objectContaining({
                        total_stages: expect.any(Number),
                        completed_stages: expect.any(Number),
                        current_state: expect.toBeOneOf(["COMPLETED", "IN-PROGRESS", "RUNNING"]),
                        current_stage: expect.any(String)
                    })
                })
            ])
        );
    }, 25000);

    it('POC | Authenticated , When request made, should respond with job status', async () => {
        let generalAPI = new GeneralApi(pocConfiguration);
        let uploadStatus = await generalAPI.listJobs(validationJobId, true, NULL_PARAM, NULL_PARAM, tdei_project_group_id);
        expect(uploadStatus.status).toBe(200);
    }, 25000);


    it('Admin | Authenticated , When request made, should respond with job status', async () => {
        let generalAPI = new GeneralApi(adminConfiguration);
        let uploadStatus = await generalAPI.listJobs(validationJobId, true, NULL_PARAM, NULL_PARAM);
        expect(uploadStatus.status).toBe(200);
    }, 25000);

    it('Admin | un-authenticated , When request made, should respond with unauthenticated request', async () => {
        let generalAPI = new GeneralApi(Utility.getAdminConfiguration());
        let validateStatusResponse = generalAPI.listJobs(validationJobId, true, NULL_PARAM, NULL_PARAM);
        await expect(validateStatusResponse).rejects.toMatchObject({ response: { status: 401 } });
    })

});

describe('List flex versions', () => {
    it('Admin | Authenticated , When request made, should respond with flex version list', async () => {
        let flexAPI = new GTFSFlexApi(adminConfiguration);

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

    it('API-Key | Authenticated , When request made, should respond with flex version list', async () => {
        let flexAPI = new GTFSFlexApi(apiKeyConfiguration);

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

    it('Admin | un-authenticated , When request made, should respond with unauthenticated request', async () => {
        let flexAPI = new GTFSFlexApi(Utility.getAdminConfiguration());

        let versionsResponse = flexAPI.listGtfsFlexVersions();

        await expect(versionsResponse).rejects.toMatchObject({ response: { status: 401 } });
    })
});

describe('Download flex dataset', () => {
    it('Admin | Authenticated , When request made with tdei_dataset_id, should stream the zip file', async () => {

        let flexAPI = new GTFSFlexApi(adminConfiguration);

        let response = await flexAPI.getGtfsFlexFile(uploadedDatasetId, { responseType: 'arraybuffer' });
        const data: any = response.data;
        const contentType = response.headers['content-type'];
        const zip = new AdmZip(data);
        const entries = zip.getEntries();

        expect(entries.length).toBeGreaterThanOrEqual(0);
        expect(contentType).toBe("application/octet-stream");
        expect(response.data).not.toBeNull();
        expect(response.status).toBe(200);
    }, 10000);

    it('Flex Data Generator | Authenticated , When request made with tdei_dataset_id, should stream the zip file', async () => {

        let flexAPI = new GTFSFlexApi(dgConfiguration);

        let response = await flexAPI.getGtfsFlexFile(uploadedDatasetId, { responseType: 'arraybuffer' });
        const data: any = response.data;
        const contentType = response.headers['content-type'];
        const zip = new AdmZip(data);
        const entries = zip.getEntries();

        expect(entries.length).toBeGreaterThanOrEqual(0);
        expect(contentType).toBe("application/octet-stream");
        expect(response.data).not.toBeNull();
        expect(response.status).toBe(200);
    }, 10000);

    it('API-Key | Authenticated , When request made with tdei_dataset_id, should stream the zip file', async () => {

        let flexAPI = new GTFSFlexApi(apiKeyConfiguration);

        let response = await flexAPI.getGtfsFlexFile(uploadedDatasetId, { responseType: 'arraybuffer' });
        const data: any = response.data;
        const contentType = response.headers['content-type'];
        const zip = new AdmZip(data);
        const entries = zip.getEntries();

        expect(entries.length).toBeGreaterThanOrEqual(0);
        expect(contentType).toBe("application/octet-stream");
        expect(response.data).not.toBeNull();
        expect(response.status).toBe(200);
    }, 10000);

    it('Admin | Authenticated , When request made with invalid tdei_dataset_id, should respond with bad request', async () => {

        let recordId = 'dummyRecordId';
        let flexAPI = new GTFSFlexApi(adminConfiguration);

        let response = flexAPI.getGtfsFlexFile(recordId);

        await expect(response).rejects.toMatchObject({ response: { status: 404 } });

    });

    it('Admin | un-authenticated , When request made with tdei_dataset_id, should respond with unauthenticated request', async () => {

        let flexAPI = new GTFSFlexApi(Utility.getAdminConfiguration());

        let response = flexAPI.getGtfsFlexFile(uploadedDatasetId);

        await expect(response).rejects.toMatchObject({ response: { status: 401 } });

    });

});