import { OSWApi, VersionSpec, CommonAPIsApi, Configuration, JobDetails, JobDetailsJobTypeEnum, JobDetailsStatusEnum, ProjectIdTdeiDatasetIdBody, ProjectIdTdeiDatasetIdBodyStatusEnum, ProjectIdTdeiDatasetIdBodyResolutionStatusEnum } from "tdei-client";
import axios, { InternalAxiosRequestConfig } from "axios";
import { Utility } from "../utils";
import AdmZip from "adm-zip";
import { SeedData } from "../models/types";
import { waitForJobTerminalState } from "./helpers/jobPoller";
import { expectAcceptedJobResponse } from "./helpers/asyncJobAsserts";
const { addMsg } = require("jest-html-reporters/helper");

const EXTRA_TIMEOUT_MS = 60_000;

let apiKeyConfiguration: Configuration = {};
let pocConfiguration: Configuration = {};
let dgConfiguration: Configuration = {};
let adminConfiguration: Configuration = {};
let flexDgConfiguration: Configuration = {};
let pathwaysDgConfiguration: Configuration = {};
let uploadedJobId: string = '';
let uploadedJobId_PreRelease_poc: string = '';
let uploadedJobId_PreRelease_admin = '';
let publishJobId: string = '';
let confidenceJobId: string = '1';
let confidenceJobWithSubRegionId: string = '1';
let convertJobId: string = '1';
let datasetBboxJobIdOSM: string = '1';
let datasetBboxJobIdOSW: string = '1';
let validationJobId: string = '1';
let uploadedDatasetId: string = '1';
let uploadedDatasetId_PreRelease_poc: string = '1';
let uploadedDatasetId_PreRelease_admin: string = '1';
let tdei_project_group_id = "";
let service_id = "";
let qualityMetricJobId = '1';
const NULL_PARAM = void 0;
let bboxRecordId = "";
let seedData: SeedData = {} as SeedData;


const tagQualityRequestInterceptor = (request: InternalAxiosRequestConfig, tdei_dataset_id: string, datasetName: string) => {
  if (
    request.url?.includes(`/api/v1/osw/quality-metric/tag/${tdei_dataset_id}`)
  ) {
    let data = request.data as FormData;
    let metaFile = data.get("file") as File;
    delete data['file'];
    data.set('file', metaFile, datasetName);
  }
  return request;
};

const intersectionQualityRequestInterceptor = (request: InternalAxiosRequestConfig, tdei_dataset_id: string, datasetName?: string) => {
  if (
    request.url?.includes(`/api/v1/osw/quality-metric/ixn/${tdei_dataset_id}`)
  ) {
    let data = request.data as FormData;
    let intersectionFile = data.get("file") as File;
    if (intersectionFile && datasetName) {
      delete data['file'];
      data.set('file', intersectionFile, datasetName);
    }
  }
  return request;
};

const editMetadataRequestInterceptor = (request: InternalAxiosRequestConfig, tdei_dataset_id: string, datasetName: string) => {
  if (
    request.url?.includes(`/api/v1/metadata/${tdei_dataset_id}`)
  ) {
    let data = request.data as FormData;
    let metaFile = data.get("file") as File;
    delete data['file'];
    data.set('file', metaFile, datasetName);
  }
  return request;
};

const oswUploadRequestInterceptor = (request: InternalAxiosRequestConfig, tdei_project_group_id: string, service_id: string, datasetName: string, changestName: string, metafileName: string) => {
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

const oswValidateRequestInterceptor = (request: InternalAxiosRequestConfig, datasetName: string) => {
  if (
    request.url?.includes(`/api/v1/osw/validate`)
  ) {
    let data = request.data as FormData;
    let datasetFile = data.get("dataset") as File;
    delete data['dataset'];
    data.set('dataset', datasetFile, datasetName);
  }
  return request;
};

const oswConvertRequestInterceptor = (request: InternalAxiosRequestConfig, fileName: string) => {
  if (
    request.url?.includes(`/api/v1/osw/convert`)
  ) {
    let data = request.data as FormData;
    let file = data.get("file") as File;
    delete data['file'];
    data.set('file', file, fileName);
  }
  return request;
};

const oswConfidenceRequestInterceptor = (request: InternalAxiosRequestConfig, tdei_dataset_id: string, fileName: string) => {
  if (
    request.url?.includes(`/api/v1/osw/confidence/${tdei_dataset_id}`)
  ) {
    if (fileName) {
      let data = request.data as FormData;
      let file = data.get("file") as File;
      if (file) {
        delete data['file'];
        data.set('file', file, fileName);
      }
    }
  }
  return request;
};

beforeAll(async () => {
  seedData = Utility.seedData;
  tdei_project_group_id = seedData.project_group.tdei_project_group_id;
  service_id = seedData.services.find(x => x.service_type == "osw")!.tdei_service_id;
  adminConfiguration = Utility.getAdminConfiguration();
  apiKeyConfiguration = Utility.getApiKeyConfiguration();
  pocConfiguration = Utility.getPocConfiguration();
  dgConfiguration = Utility.getOSWDataGeneratorConfiguration();
  flexDgConfiguration = Utility.getFlexDataGeneratorConfiguration();
  pathwaysDgConfiguration = Utility.getPathwaysDataGeneratorConfiguration();
  bboxRecordId = seedData.datasets.osw.test_dataset;
  await authenticate();
});


afterAll(async () => {
});

describe('Upload OSW dataset', () => {
  it('OSW Data Generator | Authenticated , When request made with dataset, metadata and changeset file, should return request job id as response', async () => {
    let oswAPI = new OSWApi(dgConfiguration);
    let metaToUpload = Utility.getMetadataBlob("osw");
    let changesetToUpload = Utility.getChangesetBlob();
    let dataset = Utility.getOSWBlob();
    try {
      const uploadInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => oswUploadRequestInterceptor(req, tdei_project_group_id, service_id, 'osw-valid.zip', 'changeset.zip', 'metadata.json'))
      const uploadFileResponse = await oswAPI.uploadOswFileForm(dataset, metaToUpload, changesetToUpload, tdei_project_group_id, service_id);

      uploadedJobId = expectAcceptedJobResponse(uploadFileResponse);
      console.log("uploaded tdei_dataset_id", uploadedJobId);
      await addMsg({ message: { "OSW Data Generator - uploaded Job Id ": uploadedJobId } });
      axios.interceptors.request.eject(uploadInterceptor);
    } catch (e) {
      console.log(e);
    }
  }, 20000);

  it('POC | Authenticated , When request made with dataset, metadata and changeset file, should return request job id as response', async () => {
    let oswAPI = new OSWApi(pocConfiguration);
    let metaToUpload = Utility.getMetadataBlob("osw");
    let changesetToUpload = Utility.getChangesetBlob();
    let dataset = Utility.getOSWBlob();
    try {
      const uploadInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => oswUploadRequestInterceptor(req, tdei_project_group_id, service_id, 'osw-valid.zip', 'changeset.zip', 'metadata.json'))
      const uploadFileResponse = await oswAPI.uploadOswFileForm(dataset, metaToUpload, changesetToUpload, tdei_project_group_id, service_id);

      uploadedJobId_PreRelease_poc = expectAcceptedJobResponse(uploadFileResponse);
      console.log("uploaded tdei_dataset_id - pre-release", uploadedJobId_PreRelease_poc);
      await addMsg({ message: { "OSW POC - uploaded Job Id ": uploadedJobId_PreRelease_poc } });
      axios.interceptors.request.eject(uploadInterceptor);
    } catch (e) {
      console.log(e);
    }
  }, 20000);

  it('Admin | Authenticated , When request made with dataset, metadata and changeset file, should return request job id as response', async () => {
    let oswAPI = new OSWApi(adminConfiguration);
    let metaToUpload = Utility.getMetadataBlob("osw");
    let changesetToUpload = Utility.getChangesetBlob();
    let dataset = Utility.getOSWBlob();
    try {
      const uploadInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => oswUploadRequestInterceptor(req, tdei_project_group_id, service_id, 'osw-valid.zip', 'changeset.zip', 'metadata.json'))
      const uploadFileResponse = await oswAPI.uploadOswFileForm(dataset, metaToUpload, changesetToUpload, tdei_project_group_id, service_id);

      uploadedJobId_PreRelease_admin = expectAcceptedJobResponse(uploadFileResponse);
      await addMsg({ message: { "OSW Admin - uploaded Job Id ": uploadFileResponse.data } });
      axios.interceptors.request.eject(uploadInterceptor);
    } catch (e) {
      console.log(e);
    }
  }, 20000);

  it('Admin | Authenticated , When request made with dataset and invalid metafile, should return bad request with metadata validation errors', async () => {
    let oswAPI = new OSWApi(adminConfiguration);
    let metaToUpload = Utility.getInvalidMetadataBlob("osw");
    let changesetToUpload = Utility.getChangesetBlob();
    let dataset = Utility.getOSWBlob();
    try {
      const uploadInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => oswUploadRequestInterceptor(req, tdei_project_group_id, service_id, 'osw-valid.zip', 'changeset.zip', 'metadata.json'))
      const uploadFileResponse = oswAPI.uploadOswFileForm(dataset, metaToUpload, changesetToUpload, tdei_project_group_id, service_id)

      expect(await uploadFileResponse).rejects.toMatchObject({ response: { status: 400 } });

      axios.interceptors.request.eject(uploadInterceptor);
    } catch (e) {
      console.log(e);
    }
  }, 20000)

  it('Admin | Authenticated , When request made with invalid service id, should return service id not found', async () => {
    let oswAPI = new OSWApi(adminConfiguration);
    let metaToUpload = Utility.getMetadataBlob("osw");
    let changesetToUpload = Utility.getChangesetBlob();
    let dataset = Utility.getOSWBlob();
    try {
      const uploadInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => oswUploadRequestInterceptor(req, tdei_project_group_id, 'invalid_service_id', 'osw-valid.zip', 'changeset.zip', 'metadata.json'))
      const uploadFileResponse = oswAPI.uploadOswFileForm(dataset, metaToUpload, changesetToUpload, tdei_project_group_id, 'invalid_service_id')

      expect(await uploadFileResponse).rejects.toMatchObject({ response: { status: 404 } });

      axios.interceptors.request.eject(uploadInterceptor);
    } catch (e) {
      console.log(e);
    }
  }, 20000)

  it('Admin | Authenticated , When request made with invalid project id, should return project id not found', async () => {
    let oswAPI = new OSWApi(adminConfiguration);
    let metaToUpload = Utility.getMetadataBlob("osw");
    let changesetToUpload = Utility.getChangesetBlob();
    let dataset = Utility.getOSWBlob();
    try {
      const uploadInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => oswUploadRequestInterceptor(req, 'invalid_tdei_project_group_id', service_id, 'osw-valid.zip', 'changeset.txt', 'metadata.json'))
      const uploadFileResponse = oswAPI.uploadOswFileForm(dataset, metaToUpload, changesetToUpload, 'invalid_tdei_project_group_id', service_id)

      expect(await uploadFileResponse).rejects.toMatchObject({ response: { status: 404 } });

      axios.interceptors.request.eject(uploadInterceptor);
    } catch (e) {
      console.log(e);
    }
  }, 20000)

  it('Admin | Authenticated , When request made with invalid derived dataset id, should return derived dataset id not found', async () => {
    let oswAPI = new OSWApi(adminConfiguration);
    let metaToUpload = Utility.getMetadataBlob("osw");
    let changesetToUpload = Utility.getChangesetBlob();
    let dataset = Utility.getOSWBlob();
    try {
      const uploadInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => oswUploadRequestInterceptor(req, tdei_project_group_id, service_id, 'osw-valid.zip', 'changeset.txt', 'metadata.json'))
      const uploadFileResponse = oswAPI.uploadOswFileForm(dataset, metaToUpload, changesetToUpload, tdei_project_group_id, service_id, "InvalidDerivedDatasetId")

      expect(await uploadFileResponse).rejects.toMatchObject({ response: { status: 404 } });

      axios.interceptors.request.eject(uploadInterceptor);
    } catch (e) {
      console.log(e);
    }
  }, 20000)

  it('Flex Data generator | Authenticated , When request made with valid input, should return unauthorized request', async () => {
    let oswAPI = new OSWApi(flexDgConfiguration);
    let metaToUpload = Utility.getMetadataBlob("osw");
    let changesetToUpload = Utility.getChangesetBlob();
    let dataset = Utility.getOSWBlob();
    try {
      const uploadInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => oswUploadRequestInterceptor(req, tdei_project_group_id, service_id, 'osw-valid.zip', 'changeset.txt', 'metadata.json'))
      const uploadFileResponse = oswAPI.uploadOswFileForm(dataset, metaToUpload, changesetToUpload, tdei_project_group_id, service_id)

      expect(await uploadFileResponse).rejects.toMatchObject({ response: { status: 403 } });

      axios.interceptors.request.eject(uploadInterceptor);
    } catch (e) {
      console.log(e);
    }
  }, 20000)

  it('Admin | un-authenticated , When request made with dataset, metadata and changeset file, should respond with unauthenticated request', async () => {
    let oswAPI = new OSWApi(Utility.getAdminConfiguration());
    let metaToUpload = Utility.getMetadataBlob("osw");
    let changesetToUpload = Utility.getChangesetBlob();
    let dataset = Utility.getOSWBlob();

    const uploadInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => oswUploadRequestInterceptor(req, tdei_project_group_id, service_id, 'osw-valid.zip', 'changeset.zip', 'metadata.json'))
    const uploadFileResponse = oswAPI.uploadOswFileForm(dataset, metaToUpload, changesetToUpload, tdei_project_group_id, service_id)

    await expect(uploadFileResponse).toReject();
    axios.interceptors.request.eject(uploadInterceptor);

  }, 20000)

  it('API-Key | Authenticated , When request made with dataset, metadata and changeset file, should respond with unauthorized request', async () => {
    let oswAPI = new OSWApi(apiKeyConfiguration);
    let metaToUpload = Utility.getMetadataBlob("osw");
    let changesetToUpload = Utility.getChangesetBlob();
    let dataset = Utility.getOSWBlob();

    const uploadInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => oswUploadRequestInterceptor(req, tdei_project_group_id, service_id, 'osw-valid.zip', 'changeset.zip', 'metadata.json'))
    const uploadFileResponse = oswAPI.uploadOswFileForm(dataset, metaToUpload, changesetToUpload, tdei_project_group_id, service_id, NULL_PARAM, { headers: { 'x-api-key': apiKeyConfiguration.apiKey?.toString() } })

    await expect(uploadFileResponse).rejects.toMatchObject({ response: { status: 403 } });
    axios.interceptors.request.eject(uploadInterceptor);

  }, 20000)

});

describe('Check upload request job completion status', () => {
  jest.retryTimes(1, { logErrorsBeforeRetry: true });
  it('OSW Data Generator | Authenticated , When request made, should respond with job status', async () => {
    let generalAPI = new CommonAPIsApi(dgConfiguration);
    const { job } = await waitForJobTerminalState({
      api: generalAPI,
      projectGroupId: tdei_project_group_id,
      jobId: uploadedJobId,
      deadlineMs: 10 * 60 * 1000,
      terminalStatuses: ["COMPLETED", "FAILED"],
      onPoll: async ({ attempt, elapsedMs, snapshot }) => {
        if (attempt === 1 || attempt % 15 === 0) {
          await addMsg({ message: { "Upload job poll": { elapsedMs, snapshot } } });
        }
      },
    });

    expect((job as any)?.job_id).toBeOneOf([`${uploadedJobId}`]);
    expect((job as any)?.status).toBe("COMPLETED");
    uploadedDatasetId = (job as any).response_props.tdei_dataset_id;
    console.log("uploaded tdei_dataset_id", uploadedDatasetId);
  }, 10 * 60 * 1000 + EXTRA_TIMEOUT_MS);

  it('POC | Authenticated , When request made, should respond with job status', async () => {
    let generalAPI = new CommonAPIsApi(pocConfiguration);
    const { job } = await waitForJobTerminalState({
      api: generalAPI,
      projectGroupId: tdei_project_group_id,
      jobId: uploadedJobId_PreRelease_poc,
      deadlineMs: 10 * 60 * 1000,
      terminalStatuses: ["COMPLETED", "FAILED"],
    });
    expect((job as any)?.job_id).toBeOneOf([`${uploadedJobId_PreRelease_poc}`]);
    expect((job as any)?.status).toBe("COMPLETED");
    uploadedDatasetId_PreRelease_poc = (job as any).response_props.tdei_dataset_id;
  }, 10 * 60 * 1000 + EXTRA_TIMEOUT_MS);


  it('Admin | Authenticated , When request made, should respond with job status', async () => {
    let generalAPI = new CommonAPIsApi(adminConfiguration);
    const { job } = await waitForJobTerminalState({
      api: generalAPI,
      projectGroupId: "",
      jobId: uploadedJobId_PreRelease_admin,
      deadlineMs: 10 * 60 * 1000,
      terminalStatuses: ["COMPLETED", "FAILED"],
    });
    expect((job as any)?.job_id).toBeOneOf([`${uploadedJobId_PreRelease_admin}`]);
    expect((job as any)?.status).toBe("COMPLETED");
    uploadedDatasetId_PreRelease_admin = (job as any).response_props.tdei_dataset_id;
  }, 10 * 60 * 1000 + EXTRA_TIMEOUT_MS);

  it('Admin | un-authenticated , When request made, should respond with unauthenticated request', async () => {
    let generalAPI = new CommonAPIsApi(Utility.getAdminConfiguration());

    let downloadResponse = generalAPI.listJobs("", uploadedJobId, true);

    await expect(downloadResponse).rejects.toMatchObject({ response: { status: 401 } });
  });

});

describe("Edit Metadata API", () => {

  it('OSW Data Generator | Authenticated , When request made, expect to return sucess', async () => {
    // Arrange
    let generalAPI = new CommonAPIsApi(dgConfiguration);
    let metaToUpload = Utility.getMetadataBlob("osw");
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
    let generalAPI = new CommonAPIsApi(pocConfiguration);
    let metaToUpload = Utility.getMetadataBlob("osw");
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
    let generalAPI = new CommonAPIsApi(adminConfiguration);
    let metaToUpload = Utility.getMetadataBlob("osw");
    let tdei_dataset_id = uploadedDatasetId;
    // Action
    const editMetaInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => editMetadataRequestInterceptor(req, tdei_dataset_id, 'metadata.json'))
    const versions = await generalAPI.editMetadataForm(metaToUpload, tdei_dataset_id);
    // Assert
    expect(versions.status).toBe(200);
    axios.interceptors.request.eject(editMetaInterceptor);
  }, 30000);

  it('Admin | Authenticated, When request made with invalid dataset id, should respond with dataset not found error', async () => {

    // Arrange
    let generalAPI = new CommonAPIsApi(adminConfiguration);
    let metaToUpload = Utility.getMetadataBlob("osw");
    // Action
    const editMetaInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => editMetadataRequestInterceptor(req, "invalid_tdei_dataset_id", 'metadata.json'))
    // Assert
    await expect(generalAPI.editMetadataForm(metaToUpload, "invalid_tdei_dataset_id")).rejects.toMatchObject({ response: { status: 404 } });
    axios.interceptors.request.eject(editMetaInterceptor);
  }, 30000);

  it('Admin | Authenticated, When request made with invalid osw schema version, should respond with metadata error', async () => {

    // Arrange
    let generalAPI = new CommonAPIsApi(adminConfiguration);
    let metaToUpload = Utility.getEditMetadataBlob("osw", { schema_version: "invalid" });
    // Action
    const editMetaInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => editMetadataRequestInterceptor(req, uploadedDatasetId, 'metadata.json'))
    // Assert
    await expect(generalAPI.editMetadataForm(metaToUpload, uploadedDatasetId)).rejects.toMatchObject({ response: { status: 400 } });
    axios.interceptors.request.eject(editMetaInterceptor);
  }, 30000);

  it('Admin | un-authenticated, When request made, should respond with unauthenticated request', async () => {

    // Arrange
    let generalAPI = new CommonAPIsApi(Utility.getAdminConfiguration());
    let metaToUpload = Utility.getMetadataBlob("osw");
    let tdei_dataset_id = uploadedDatasetId;
    // Action
    const editMetaInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => editMetadataRequestInterceptor(req, tdei_dataset_id, 'metadata.json'))
    // Assert
    await expect(generalAPI.editMetadataForm(metaToUpload, tdei_dataset_id)).rejects.toMatchObject({ response: { status: 401 } });
    axios.interceptors.request.eject(editMetaInterceptor);
  }, 30000);

  it('API-Key | Authenticated, When request made, should respond with unauthorized request', async () => {
    // Arrange
    let generalAPI = new CommonAPIsApi(apiKeyConfiguration);
    let metaToUpload = Utility.getMetadataBlob("osw");
    let tdei_dataset_id = uploadedDatasetId;
    // Action
    const editMetaInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => editMetadataRequestInterceptor(req, tdei_dataset_id, 'metadata.json'))
    // Assert
    await expect(generalAPI.editMetadataForm(metaToUpload, tdei_dataset_id, { headers: { 'x-api-key': apiKeyConfiguration.apiKey?.toString() } })).rejects.toMatchObject({ response: { status: 403 } });
    axios.interceptors.request.eject(editMetaInterceptor);
  }, 30000);
});

let datasetInclineTagJobId = '1';
describe('Dataset Incline Tag Request', () => {

  it('Admin | Authenticated , When request made with valid dataset, should return request job id as response', async () => {
    let oswAPI = new OSWApi(adminConfiguration);
    let inclineRequest = await oswAPI.datasetTagIncline(uploadedDatasetId_PreRelease_admin);

    expect(inclineRequest.status).toBe(202);
    expect(inclineRequest.data).toBeNumber();
    datasetInclineTagJobId = inclineRequest.data!;

    //verify location header
    expect(inclineRequest.headers.location).toBeDefined();
    expect(inclineRequest.headers.location).toContain(`/api/v1/jobs?job_id=${datasetInclineTagJobId}`);
  });

  it('Admin | authenticated , When request made with invalid dataset, should return with dataset not found error', async () => {
    let oswAPI = new OSWApi(adminConfiguration);

    let inclineRequest = oswAPI.datasetTagIncline('invalid_dataset_id');

    await expect(inclineRequest).rejects.toMatchObject({ response: { status: 404 } });
  });

  it('Admin | authenticated , When request made with empty source dataset, should return with dataset not found error', async () => {

    let oswAPI = new OSWApi(adminConfiguration);

    let inclineRequest = oswAPI.datasetTagIncline(" ");

    await expect(inclineRequest).rejects.toMatchObject({ response: { status: 404 } });
  });

  it('Admin | un-authenticated , When request made with dataset, should return with unauthenticated request', async () => {
    let oswAPI = new OSWApi(Utility.getAdminConfiguration());

    let inclineRequest = oswAPI.datasetTagIncline(uploadedDatasetId_PreRelease_admin);

    await expect(inclineRequest).rejects.toMatchObject({ response: { status: 401 } });
  });

  it('API-Key | Authenticated , When request made with dataset, should return with unauthorized request', async () => {
    let oswAPI = new OSWApi(apiKeyConfiguration);

    let inclineRequest = oswAPI.datasetTagIncline(uploadedDatasetId_PreRelease_admin, { headers: { 'x-api-key': apiKeyConfiguration.apiKey?.toString() } });

    await expect(inclineRequest).rejects.toMatchObject({ response: { status: 403 } });
  });
});

describe('Check dataset-incline request job running status', () => {
  jest.retryTimes(1, { logErrorsBeforeRetry: true });
  it('Admin | Authenticated, When request made, should respond with job status', async () => {
    let generalAPI = new CommonAPIsApi(adminConfiguration);
    const { job } = await waitForJobTerminalState({
      api: generalAPI,
      projectGroupId: "",
      jobId: datasetInclineTagJobId,
      deadlineMs: 6 * 60 * 1000,
      terminalStatuses: ["COMPLETED", "FAILED"],
    });
    expect((job as any)?.job_id).toBeOneOf([`${datasetInclineTagJobId}`]);
    expect((job as any)?.status).toBeOneOf(["COMPLETED", "FAILED"]);
    if ((job as any)?.progress) {
      expect((job as any).progress).toEqual(
        expect.objectContaining({
          total_stages: expect.any(Number),
          completed_stages: expect.any(Number),
          current_stage: expect.any(String),
        })
      );
    }
  }, 6 * 60 * 1000 + EXTRA_TIMEOUT_MS);

  it('Admin | Authenticated , When request made, should respond with job status', async () => {
    let generalAPI = new CommonAPIsApi(adminConfiguration);
    const resp = await generalAPI.listJobs('', datasetInclineTagJobId, true);
    expect(resp.status).toBe(200);
  }, 25000);

  it('Admin | un-authenticated , When request made, should respond with unauthenticated request', async () => {
    let generalAPI = new CommonAPIsApi(Utility.getAdminConfiguration());

    let bboxStatusResponse = generalAPI.listJobs('', datasetInclineTagJobId, true);

    await expect(bboxStatusResponse).rejects.toMatchObject({ response: { status: 401 } });
  });

});

describe('Download Incline request file', () => {

  // it('Admin | Authenticated , When request made with tdei_dataset_id, should stream the zip file', async () => {
  //   let generalAPI = new CommonAPIsApi(adminConfiguration);
  //   await new Promise((r) => setTimeout(r, 10000));
  //
  //   let response = await generalAPI.jobDownload(datasetInclineTagJobId, { responseType: 'arraybuffer' });
  //   const data: any = response.data;
  //   const contentType = response.headers['content-type'];
  //
  //   expect(contentType).toBeOneOf(["application/xml", "application/zip"]);
  //   expect(response.data).not.toBeNull();
  //   expect(response.status).toBe(200);
  //   if (contentType === "application/zip") {
  //     const zip = new AdmZip(data);
  //     const entries = zip.getEntries();
  //     expect(entries.length).toBeGreaterThanOrEqual(1);
  //   }
  // }, 20000);

  it('Admin | un-authenticated , When request made with tdei_dataset_id, should respond with unauthenticated request', async () => {
    let generalAPI = new CommonAPIsApi(Utility.getAdminConfiguration());

    let downloadResponse = generalAPI.jobDownload(datasetInclineTagJobId);

    await expect(downloadResponse).rejects.toMatchObject({ response: { status: 401 } });
  });
});

describe('Publish the OSW dataset', () => {
  it('Admin | When passed with valid input having null valid_from & valid_to metadata, should respond with required field error', async () => {
    let oswAPI = new OSWApi(adminConfiguration);

    let publishResponse = oswAPI.publishOswFile(uploadedDatasetId);

    await expect(publishResponse).rejects.toMatchObject({ response: { status: 400 } });
  });

  it('OSW Data Generator | Authenticated , Edit metadata before publishing, should return success', async () => {
    // Arrange
    let generalAPI = new CommonAPIsApi(dgConfiguration);
    let metaToUpload = Utility.getEditMetadataBlob("osw", {
      valid_from: "2021-01-01",
      valid_to: "2021-12-31"
    });
    let tdei_dataset_id = uploadedDatasetId;
    // Action
    const editMetaInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => editMetadataRequestInterceptor(req, tdei_dataset_id, 'metadata.json'))
    const versions = await generalAPI.editMetadataForm(metaToUpload, tdei_dataset_id);
    // Assert
    expect(versions.status).toBe(200);
    axios.interceptors.request.eject(editMetaInterceptor);
  }, 30000);

  it('OSW Data Generator | Authenticated , When request made with tdei_dataset_id, should return request job id as response', async () => {

    let oswAPI = new OSWApi(dgConfiguration);
    let publishOsw = await oswAPI.publishOswFile(uploadedDatasetId);
    expect(publishOsw.status).toBe(202);
    expect(publishOsw.data).toBeNumber();
    publishJobId = publishOsw.data;
    await addMsg({ message: { "OSW Data Generator - publish Job Id ": publishJobId } });
    console.log("publish job_id", publishJobId);
    //verify location header
    expect(publishOsw.headers.location).toBeDefined();
    expect(publishOsw.headers.location).toContain(`/api/v1/jobs?job_id=${publishJobId}`);
  });

  it('OSW Data Generator | Authenticated , Pre-release dataset , edit metadata before publishing, should return success', async () => {
    // Arrange
    let generalAPI = new CommonAPIsApi(dgConfiguration);
    let metaToUpload = Utility.getEditMetadataBlob("osw", {
      valid_from: "2021-01-01",
      valid_to: "2021-12-31"
    });
    let tdei_dataset_id = uploadedDatasetId_PreRelease_admin;
    // Action
    const editMetaInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => editMetadataRequestInterceptor(req, tdei_dataset_id, 'metadata.json'))
    const versions = await generalAPI.editMetadataForm(metaToUpload, tdei_dataset_id);
    // Assert
    expect(versions.status).toBe(200);
    axios.interceptors.request.eject(editMetaInterceptor);
  }, 30000);

  it('Admin | Authenticated , When request made with tdei_dataset_id, should return request job id as response', async () => {

    let oswAPI = new OSWApi(adminConfiguration);
    let publishOsw = await oswAPI.publishOswFile(uploadedDatasetId_PreRelease_admin);
    await addMsg({ message: { "OSW Admin - publish Job Id ": publishOsw.data } });
    expect(publishOsw.status).toBe(202);
    expect(publishOsw.data).toBeNumber();
  });

  it('When passed with already published tdei_dataset_id, should respond with bad request', async () => {

    let oswAPI = new OSWApi(adminConfiguration);
    let tdei_dataset_id = seedData.datasets.osw.published_dataset;

    let publishOswResponse = oswAPI.publishOswFile(tdei_dataset_id);

    await expect(publishOswResponse).rejects.toMatchObject({ response: { status: 400 } });
  });

  it('When passed with flex tdei_dataset_id, should respond dataset data type mismatch error', async () => {

    let oswAPI = new OSWApi(adminConfiguration);

    let publishOswResponse = oswAPI.publishOswFile(seedData.datasets.flex.pre_release_dataset);

    await expect(publishOswResponse).rejects.toMatchObject({ response: { status: 400 } });
  });

  it('When passed with invalid tdei_dataset_id, should respond with dataset id not found error', async () => {

    let oswAPI = new OSWApi(adminConfiguration);

    let publishOswResponse = oswAPI.publishOswFile("invalid_tdei_dataset_id");

    await expect(publishOswResponse).rejects.toMatchObject({ response: { status: 404 } });
  });

  it('Admin | un-authenticated , When request made, should respond with unauthenticated request', async () => {
    let oswAPI = new OSWApi(Utility.getAdminConfiguration());

    let publishOswResponse = oswAPI.publishOswFile(uploadedDatasetId);

    await expect(publishOswResponse).rejects.toMatchObject({ response: { status: 401 } });
  });

  it('API-Key | Authenticated , When request made, should respond with unauthorized request', async () => {
    let oswAPI = new OSWApi(Utility.getAdminConfiguration());

    let publishOswResponse = oswAPI.publishOswFile(uploadedDatasetId, { headers: { 'x-api-key': apiKeyConfiguration.apiKey?.toString() } });

    await expect(publishOswResponse).rejects.toMatchObject({ response: { status: 403 } });
  });
});

describe('Check publish request job running status', () => {
  jest.retryTimes(1, { logErrorsBeforeRetry: true });
  it('OSW Data Generaror | Authenticated , When request made, should respond with job status', async () => {
    let generalAPI = new CommonAPIsApi(dgConfiguration);
    const { job } = await waitForJobTerminalState({
      api: generalAPI,
      projectGroupId: tdei_project_group_id,
      jobId: publishJobId,
      deadlineMs: 6 * 60 * 1000,
      terminalStatuses: ["COMPLETED", "FAILED"],
    });
    expect((job as any)?.job_id).toBeOneOf([`${publishJobId}`]);
    expect((job as any)?.status).toBeOneOf(["COMPLETED", "FAILED"]);
  }, 6 * 60 * 1000 + EXTRA_TIMEOUT_MS);

  it('POC | Authenticated , When request made, should respond with job status', async () => {
    let generalAPI = new CommonAPIsApi(pocConfiguration);
    let uploadStatus = await generalAPI.listJobs(tdei_project_group_id, publishJobId, true);
    expect(uploadStatus.status).toBe(200);
  }, 25000);


  it('Admin | Authenticated , When request made, should respond with job status', async () => {
    let generalAPI = new CommonAPIsApi(adminConfiguration);
    let uploadStatus = await generalAPI.listJobs("", publishJobId, true);
    expect(uploadStatus.status).toBe(200);
  }, 25000);

  it('Admin | un-authenticated , When request made, should respond with unauthenticated request', async () => {
    let generalAPI = new CommonAPIsApi(Utility.getAdminConfiguration());

    let downloadResponse = generalAPI.listJobs("", publishJobId, true);

    await expect(downloadResponse).rejects.toMatchObject({ response: { status: 401 } });
  });
});

describe('Validate-only OSW dataset request', () => {
  it('OSW Data Generator | Authenticated , When request made with valid dataset, should return request job id as response', async () => {
    let oswAPI = new OSWApi(dgConfiguration);
    let dataset = Utility.getOSWBlob();
    try {
      const validateInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => oswValidateRequestInterceptor(req, 'osw-valid.zip'))
      const validateFileResponse = await oswAPI.validateOswFileForm(dataset);

      expect(validateFileResponse.status).toBe(202);
      expect(validateFileResponse.data).not.toBeNull();
      validationJobId = validateFileResponse.data;
      console.log("validation job_id", validationJobId);
      axios.interceptors.request.eject(validateInterceptor);

      //verify location header
      expect(validateFileResponse.headers.location).toBeDefined();
      expect(validateFileResponse.headers.location).toContain(`/api/v1/jobs?job_id=${validationJobId}`);
    } catch (e) {
      console.log(e);
    }
  }, 20000);

  it('POC | Authenticated , When request made with valid dataset, should return request job id as response', async () => {
    let oswAPI = new OSWApi(pocConfiguration);
    let dataset = Utility.getOSWBlob();
    try {
      const validateInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => oswValidateRequestInterceptor(req, 'osw-valid.zip'))
      const uploadFileResponse = await oswAPI.validateOswFileForm(dataset);

      expect(uploadFileResponse.status).toBe(202);
      expect(uploadFileResponse.data).not.toBeNull();
      axios.interceptors.request.eject(validateInterceptor);
    } catch (e) {
      console.log(e);
    }
  }, 20000)

  it('Admin | Authenticated , When request made with valid dataset, should return request job id as response', async () => {
    let oswAPI = new OSWApi(adminConfiguration);
    let dataset = Utility.getOSWBlob();
    const validateInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => oswValidateRequestInterceptor(req, 'osw-valid.zip'))
    const uploadFileResponse = await oswAPI.validateOswFileForm(dataset);

    expect(uploadFileResponse.status).toBe(202);
    expect(uploadFileResponse.data).not.toBeNull();
    axios.interceptors.request.eject(validateInterceptor);

  }, 20000)

  it('Admin | un-authenticated , When request made with dataset, should return with unauthenticated request', async () => {
    let oswAPI = new OSWApi(Utility.getAdminConfiguration());
    let dataset = Utility.getOSWBlob();

    const validateInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => oswValidateRequestInterceptor(req, 'osw-valid.zip'))
    const uploadFileResponse = oswAPI.validateOswFileForm(dataset);

    await expect(uploadFileResponse).rejects.toMatchObject({ response: { status: 401 } });
    axios.interceptors.request.eject(validateInterceptor);

  }, 20000);

  it('API-Key | Authenticated , When request made with dataset, should return request job id as response', async () => {
    let oswAPI = new OSWApi(apiKeyConfiguration);
    let dataset = Utility.getOSWBlob();
    const validateInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => oswValidateRequestInterceptor(req, 'osw-valid.zip'))
    const uploadFileResponse = await oswAPI.validateOswFileForm(dataset, { headers: { 'x-api-key': apiKeyConfiguration.apiKey?.toString() } });

    expect(uploadFileResponse.status).toBe(202);
    expect(uploadFileResponse.data).not.toBeNull();
    axios.interceptors.request.eject(validateInterceptor);
  }, 20000);

});

describe('Check validation-only request job running status', () => {
  jest.retryTimes(1, { logErrorsBeforeRetry: true });
  it('OSW Data Generator | Authenticated , When request made, should respond with job status', async () => {
    let generalAPI = new CommonAPIsApi(dgConfiguration);
    const { job } = await waitForJobTerminalState({
      api: generalAPI,
      projectGroupId: tdei_project_group_id,
      jobId: validationJobId,
      deadlineMs: 6 * 60 * 1000,
      terminalStatuses: ["COMPLETED", "FAILED"],
    });
    expect((job as any)?.job_id).toBeOneOf([`${validationJobId}`]);
    expect((job as any)?.status).toBeOneOf(["COMPLETED", "FAILED"]);
  }, 6 * 60 * 1000 + EXTRA_TIMEOUT_MS);

  it('POC | Authenticated , When request made, should respond with job status', async () => {
    let generalAPI = new CommonAPIsApi(pocConfiguration);
    let uploadStatus = await generalAPI.listJobs(tdei_project_group_id, validationJobId, true);
    expect(uploadStatus.status).toBe(200);
  }, 25000);


  it('Admin | Authenticated , When request made, should respond with job status', async () => {
    let generalAPI = new CommonAPIsApi(adminConfiguration);
    let uploadStatus = await generalAPI.listJobs("", validationJobId, true);
    expect(uploadStatus.status).toBe(200);
  }, 25000);

  it('Admin | un-authenticated , When request made, should respond with unauthenticated request', async () => {
    let generalAPI = new CommonAPIsApi(Utility.getAdminConfiguration());
    let validateStatusResponse = generalAPI.listJobs("", validationJobId, true);
    await expect(validateStatusResponse).rejects.toMatchObject({ response: { status: 401 } });
  });
});

describe('Calculate dataset confidence request', () => {
  it('OSW Data Generator | Authenticated , When request made with invalid tdei_dataset_id, should respond with bad request', async () => {
    let oswAPI = new OSWApi(dgConfiguration);

    let calculateConfidence = oswAPI.oswConfidenceCalculateForm("dummytdeirecordid");

    await expect(calculateConfidence).rejects.toMatchObject({ response: { status: 404 } });
  });

  it('OSW Data Generator | Authenticated , When request made, should respond request job id as response', async () => {
    let oswAPI = new OSWApi(dgConfiguration);

    let calculateConfidence = await oswAPI.oswConfidenceCalculateForm(uploadedDatasetId);

    expect(calculateConfidence.status).toBe(202);

    expect(calculateConfidence.data).toBeNumber();

    confidenceJobId = calculateConfidence.data;
    console.log("confidence job_id", confidenceJobId);
    //verify location header
    expect(calculateConfidence.headers.location).toBeDefined();
    expect(calculateConfidence.headers.location).toContain(`/api/v1/jobs?job_id=${confidenceJobId}`);
  });

  it('OSW Data Generator | Authenticated , When request made with sub-region, should respond request job id as response', async () => {
    let oswAPI = new OSWApi(dgConfiguration);

    const confidenceInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => oswConfidenceRequestInterceptor(req, uploadedDatasetId, 'subregion.geojson'))
    let calculateConfidence = await oswAPI.oswConfidenceCalculateForm(uploadedDatasetId, Utility.getOSWSubRegionBlob());

    expect(calculateConfidence.status).toBe(202);

    expect(calculateConfidence.data).toBeNumber();

    confidenceJobWithSubRegionId = calculateConfidence.data;
    console.log("confidence with sub-region job_id", confidenceJobWithSubRegionId);
    axios.interceptors.request.eject(confidenceInterceptor);
  });

  it('POC | Authenticated , When request made, should respond request job id as response', async () => {
    let oswAPI = new OSWApi(pocConfiguration);

    let calculateConfidence = await oswAPI.oswConfidenceCalculateForm(uploadedDatasetId);

    expect(calculateConfidence.status).toBe(202);

    expect(calculateConfidence.data).toBeNumber();
  });

  it('Admin | Authenticated , When request made, should respond request job id as response', async () => {
    let oswAPI = new OSWApi(adminConfiguration);

    let calculateConfidence = await oswAPI.oswConfidenceCalculateForm(uploadedDatasetId);

    expect(calculateConfidence.status).toBe(202);

    expect(calculateConfidence.data).toBeNumber();
  });

  it('Admin | Authenticated , When request made with invalid sub-region file, should respond with bad request', async () => {
    let oswAPI = new OSWApi(adminConfiguration);

    let calculateConfidenceResponse = oswAPI.oswConfidenceCalculateForm(uploadedDatasetId, Utility.getOSWInvalidSubRegionBlob());

    await expect(calculateConfidenceResponse).rejects.toMatchObject({ response: { status: 400 } });
  })

  it('Admin | Authenticated , When request made with invalid sub-region file type zip , should respond with bad request', async () => {
    let oswAPI = new OSWApi(adminConfiguration);

    let calculateConfidenceResponse = oswAPI.oswConfidenceCalculateForm(uploadedDatasetId, Utility.getOSWBlob());

    await expect(calculateConfidenceResponse).rejects.toMatchObject({ response: { status: 400 } });
  })

  it('Admin | Authenticated , When request made with invalid dataset id, should respond with Dataset not found error', async () => {
    let oswAPI = new OSWApi(adminConfiguration);

    let calculateConfidenceResponse = oswAPI.oswConfidenceCalculateForm("Invalid_uploadedDatasetId");

    await expect(calculateConfidenceResponse).rejects.toMatchObject({ response: { status: 404 } });
  })

  it('Admin | Authenticated , When request made with flex dataset id, should respond with Dataset type mismatch error', async () => {
    let oswAPI = new OSWApi(adminConfiguration);

    let calculateConfidenceResponse = oswAPI.oswConfidenceCalculateForm(seedData.datasets.flex.pre_release_dataset);

    await expect(calculateConfidenceResponse).rejects.toMatchObject({ response: { status: 400 } });
  })

  it('Admin | un-authenticated , When request made, should respond with unauthenticated request', async () => {
    let oswAPI = new OSWApi(Utility.getAdminConfiguration());

    let calculateConfidenceResponse = oswAPI.oswConfidenceCalculateForm(uploadedDatasetId);

    await expect(calculateConfidenceResponse).rejects.toMatchObject({ response: { status: 401 } });
  })

  it('API-Key | Authenticated , When request made, should respond request job id as response', async () => {
    let oswAPI = new OSWApi(apiKeyConfiguration);

    let calculateConfidence = await oswAPI.oswConfidenceCalculateForm(uploadedDatasetId);

    expect(calculateConfidence.status).toBe(202);

    expect(calculateConfidence.data).toBeNumber();
  })
});

describe('Check confidence request job running status', () => {
  jest.retryTimes(1, { logErrorsBeforeRetry: true });

  it('OSW Data Generator | Authenticated , When request made, should respond with job status', async () => {
    let generalAPI = new CommonAPIsApi(dgConfiguration);
    const { job } = await waitForJobTerminalState({
      api: generalAPI,
      projectGroupId: tdei_project_group_id,
      jobId: confidenceJobId.toString(),
      deadlineMs: 6 * 60 * 1000,
      terminalStatuses: ["COMPLETED", "FAILED"],
    });
    expect((job as any)?.job_id).toBeOneOf([`${confidenceJobId}`]);
    expect((job as any)?.status).toBeOneOf(["COMPLETED", "FAILED"]);
    if ((job as any)?.progress) {
      expect((job as any).progress).toEqual(
        expect.objectContaining({
          total_stages: expect.any(Number),
          completed_stages: expect.any(Number),
          current_state: expect.toBeOneOf(["COMPLETED", "IN-PROGRESS", "RUNNING", "FAILED"]),
          current_stage: expect.any(String),
        })
      );
    }
  }, 6 * 60 * 1000 + EXTRA_TIMEOUT_MS);

  it('OSW Data Generator | Authenticated , When request made to check confidence with sub-region request, should respond with job status', async () => {
    let generalAPI = new CommonAPIsApi(dgConfiguration);
    const { job } = await waitForJobTerminalState({
      api: generalAPI,
      projectGroupId: tdei_project_group_id,
      jobId: confidenceJobWithSubRegionId.toString(),
      deadlineMs: 6 * 60 * 1000,
      terminalStatuses: ["COMPLETED", "FAILED"],
    });
    expect((job as any)?.job_id).toBeOneOf([`${confidenceJobWithSubRegionId}`]);
    expect((job as any)?.status).toBeOneOf(["COMPLETED", "FAILED"]);
    if ((job as any)?.progress) {
      expect((job as any).progress).toEqual(
        expect.objectContaining({
          total_stages: expect.any(Number),
          completed_stages: expect.any(Number),
          current_state: expect.toBeOneOf(["COMPLETED", "IN-PROGRESS", "RUNNING", "FAILED"]),
          current_stage: expect.any(String),
        })
      );
    }
  }, 6 * 60 * 1000 + EXTRA_TIMEOUT_MS);

  it('POC | Authenticated , When request made, should respond with job status', async () => {
    let generalAPI = new CommonAPIsApi(pocConfiguration);
    let uploadStatus = await generalAPI.listJobs(tdei_project_group_id, confidenceJobId, true);
    expect(uploadStatus.status).toBe(200);
  }, 25000);


  it('Admin | Authenticated , When request made, should respond with job status', async () => {
    let generalAPI = new CommonAPIsApi(adminConfiguration);
    let uploadStatus = await generalAPI.listJobs("", confidenceJobId, true);
    expect(uploadStatus.status).toBe(200);
  }, 25000);

  it('Admin | un-authenticated , When request made, should respond with unauthenticated request', async () => {
    let generalAPI = new CommonAPIsApi(Utility.getAdminConfiguration());
    let confidenceStatusResponse = generalAPI.listJobs("", confidenceJobId, true);

    await expect(confidenceStatusResponse).rejects.toMatchObject({ response: { status: 401 } });
  });
});

describe('List OSW Versions', () => {
  it('API-Key | Authenticated , When request made, should respond with OSW version list', async () => {
    let oswAPI = new OSWApi(apiKeyConfiguration);

    let oswVersions = await oswAPI.listOswVersions({ headers: { 'x-api-key': apiKeyConfiguration.apiKey?.toString() } });

    expect(oswVersions.status).toBe(200);
    expect(Array.isArray(oswVersions.data.versions)).toBe(true);
    oswVersions.data.versions?.forEach(version => {
      expect(version).toMatchObject(<VersionSpec>{
        version: expect.any(String),
        documentation: expect.any(String),
        specification: expect.any(String)
      })
    })
  })

  it('Admin | un-authenticated , When request made, should respond with unauthenticated request', async () => {
    let oswAPI = new OSWApi(Utility.getAdminConfiguration());

    let oswVersionsResponse = oswAPI.listOswVersions();

    await expect(oswVersionsResponse).rejects.toMatchObject({ response: { status: 401 } });
  })
});
let convertJobIdOSMToOSW = '';
describe('Convert dataset request', () => {
  it('OSW Data Generator | Authenticated , When request made with valid dataset OSW to OSM, should return request job id as response', async () => {
    let oswAPI = new OSWApi(dgConfiguration);
    let oswBlob = Utility.getOSWBlob();

    const convertInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => oswConvertRequestInterceptor(req, 'osw-valid.zip'))
    let formatResponse = await oswAPI.oswOnDemandFormatForm(oswBlob, "osw", "osm");

    expect(formatResponse.status).toBe(202);
    expect(formatResponse.data).toBeNumber();
    convertJobId = formatResponse.data!;
    console.log("convert job_id", convertJobId);
    axios.interceptors.request.eject(convertInterceptor);
    //verify location header
    expect(formatResponse.headers.location).toBeDefined();
    expect(formatResponse.headers.location).toContain(`/api/v1/jobs?job_id=${convertJobId}`);
  });

  it('OSW Data Generator | Authenticated , When request made with valid dataset OSM to OSW, should return request job id as response', async () => {
    let oswAPI = new OSWApi(dgConfiguration);
    let oswBlob = Utility.getOSMBlob();

    const convertInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => oswConvertRequestInterceptor(req, 'osw-valid.zip'))
    let formatResponse = await oswAPI.oswOnDemandFormatForm(oswBlob, "osm", "osw");

    expect(formatResponse.status).toBe(202);
    expect(formatResponse.data).toBeNumber();
    convertJobIdOSMToOSW = formatResponse.data!;
    console.log("convert OSM to OSW job_id", convertJobIdOSMToOSW);
    axios.interceptors.request.eject(convertInterceptor);
    //verify location header  
    expect(formatResponse.headers.location).toBeDefined();
    expect(formatResponse.headers.location).toContain(`/api/v1/jobs?job_id=${convertJobIdOSMToOSW}`);
  });

  it('POC | Authenticated , When request made with valid dataset, should return request job id as response', async () => {
    let oswAPI = new OSWApi(pocConfiguration);
    let oswBlob = Utility.getOSWBlob();

    const convertInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => oswConvertRequestInterceptor(req, 'osw-valid.zip'))
    let formatResponse = await oswAPI.oswOnDemandFormatForm(oswBlob, "osw", "osm");

    expect(formatResponse.status).toBe(202);
    expect(formatResponse.data).toBeNumber();
    axios.interceptors.request.eject(convertInterceptor);
  });

  it('Admin | Authenticated , When request made with valid dataset, should return request job id as response', async () => {
    let oswAPI = new OSWApi(adminConfiguration);
    let oswBlob = Utility.getOSWBlob();

    const convertInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => oswConvertRequestInterceptor(req, 'osw-valid.zip'))
    let formatResponse = await oswAPI.oswOnDemandFormatForm(oswBlob, "osw", "osm");

    expect(formatResponse.status).toBe(202);
    expect(formatResponse.data).toBeNumber();
    axios.interceptors.request.eject(convertInterceptor);
  });

  it('Admin | Authenticated , When request made with dataset with same source=target output, should return with bad request', async () => {
    let oswAPI = new OSWApi(adminConfiguration);
    let oswBlob = Utility.getOSWBlob();

    const convertInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => oswConvertRequestInterceptor(req, 'osw-valid.zip'))
    let formatResponse = oswAPI.oswOnDemandFormatForm(oswBlob, "osw", "osw");

    await expect(formatResponse).rejects.toMatchObject({ response: { status: 400 } });
    axios.interceptors.request.eject(convertInterceptor);
  });

  it('Admin | Authenticated , When request made with dataset with invalid source, should return with bad request', async () => {
    let oswAPI = new OSWApi(adminConfiguration);
    let oswBlob = Utility.getOSWBlob();

    const convertInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => oswConvertRequestInterceptor(req, 'osw-valid.zip'))
    let formatResponse = oswAPI.oswOnDemandFormatForm(oswBlob, "osw_invalid", "osm");

    await expect(formatResponse).rejects.toMatchObject({ response: { status: 400 } });
    axios.interceptors.request.eject(convertInterceptor);
  });

  it('Admin | Authenticated , When request made with dataset with invalid target, should return with bad request', async () => {
    let oswAPI = new OSWApi(adminConfiguration);
    let oswBlob = Utility.getOSWBlob();

    const convertInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => oswConvertRequestInterceptor(req, 'osw-valid.zip'))
    let formatResponse = oswAPI.oswOnDemandFormatForm(oswBlob, "osw", "osm_invalid");

    await expect(formatResponse).rejects.toMatchObject({ response: { status: 400 } });
    axios.interceptors.request.eject(convertInterceptor);
  });

  it('Admin | Authenticated , When request made with unsupported geojson extension dataset, should return with dataset file type error', async () => {
    let oswAPI = new OSWApi(adminConfiguration);
    let oswBlob = Utility.getMetadataBlob("osw");

    const convertInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => oswConvertRequestInterceptor(req, 'osw-valid.geojson'))
    let formatResponse = oswAPI.oswOnDemandFormatForm(oswBlob, "osw", "osm");

    await expect(formatResponse).rejects.toMatchObject({ response: { status: 400 } });
    axios.interceptors.request.eject(convertInterceptor);
  });

  it('Admin | un-authenticated , When request made with dataset, should return with unauthenticated request', async () => {
    let oswAPI = new OSWApi(Utility.getAdminConfiguration());
    let oswBlob = Utility.getOSWBlob();

    const convertInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => oswConvertRequestInterceptor(req, 'osw-valid.zip'))
    let formatResponse = oswAPI.oswOnDemandFormatForm(oswBlob, "osw", "osm");

    await expect(formatResponse).rejects.toMatchObject({ response: { status: 401 } });
    axios.interceptors.request.eject(convertInterceptor);
  });

  it('API-Key | Authenticated , When request made with dataset, should return request job id as response', async () => {
    let oswAPI = new OSWApi(apiKeyConfiguration);
    let oswBlob = Utility.getOSWBlob();

    const convertInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => oswConvertRequestInterceptor(req, 'osw-valid.zip'))
    let formatResponse = await oswAPI.oswOnDemandFormatForm(oswBlob, "osw", "osm", { headers: { 'x-api-key': apiKeyConfiguration.apiKey?.toString() } });

    expect(formatResponse.status).toBe(202);
    expect(formatResponse.data).toBeNumber();
    axios.interceptors.request.eject(convertInterceptor);
  });

});

describe('Check convert request job running status', () => {
  jest.retryTimes(1, { logErrorsBeforeRetry: true });

  it('OSW Data Generator | Authenticated , When request made, should respond with job status', async () => {
    let generalAPI = new CommonAPIsApi(dgConfiguration);
    const { job } = await waitForJobTerminalState({
      api: generalAPI,
      projectGroupId: tdei_project_group_id,
      jobId: convertJobId,
      deadlineMs: 6 * 60 * 1000,
      terminalStatuses: ["COMPLETED", "FAILED"],
    });
    expect((job as any)?.job_id).toBeOneOf([`${convertJobId}`]);
    expect((job as any)?.status).toBeOneOf(["COMPLETED", "FAILED"]);
    if ((job as any)?.progress) {
      expect((job as any).progress).toEqual(
        expect.objectContaining({
          total_stages: expect.any(Number),
          completed_stages: expect.any(Number),
          current_state: expect.toBeOneOf(["COMPLETED", "IN-PROGRESS", "RUNNING", "FAILED"]),
          current_stage: expect.any(String),
        })
      );
    }
  }, 6 * 60 * 1000 + EXTRA_TIMEOUT_MS);

  it('OSW Data Generator | Authenticated , When request made for OSM to OSW conversion, should respond with job status', async () => {
    let generalAPI = new CommonAPIsApi(dgConfiguration);
    const { job } = await waitForJobTerminalState({
      api: generalAPI,
      projectGroupId: tdei_project_group_id,
      jobId: convertJobIdOSMToOSW,
      deadlineMs: 6 * 60 * 1000,
      terminalStatuses: ["COMPLETED", "FAILED"],
    });
    expect((job as any)?.job_id).toBeOneOf([`${convertJobIdOSMToOSW}`]);
    expect((job as any)?.status).toBeOneOf(["COMPLETED", "FAILED"]);
    if ((job as any)?.progress) {
      expect((job as any).progress).toEqual(
        expect.objectContaining({
          total_stages: expect.any(Number),
          completed_stages: expect.any(Number),
          current_state: expect.toBeOneOf(["COMPLETED", "IN-PROGRESS", "RUNNING", "FAILED"]),
          current_stage: expect.any(String),
        })
      );
    }
  }, 6 * 60 * 1000 + EXTRA_TIMEOUT_MS);

  it('POC | Authenticated , When request made, should respond with job status', async () => {
    let generalAPI = new CommonAPIsApi(pocConfiguration);
    let uploadStatus = await generalAPI.listJobs(tdei_project_group_id, convertJobId, true);
    expect(uploadStatus.status).toBe(200);
  }, 25000);


  it('Admin | Authenticated , When request made, should respond with job status', async () => {
    let generalAPI = new CommonAPIsApi(adminConfiguration);
    let uploadStatus = await generalAPI.listJobs("", convertJobId, true);
    expect(uploadStatus.status).toBe(200);
  }, 25000);

  it('Admin | un-authenticated , When request made, should respond with unauthenticated request', async () => {
    let generalAPI = new CommonAPIsApi(Utility.getAdminConfiguration());

    let formatStatusResponse = generalAPI.listJobs("", convertJobId, true);

    await expect(formatStatusResponse).rejects.toMatchObject({ response: { status: 401 } });
  });

})

describe('Download converted file', () => {
  jest.retryTimes(3, { logErrorsBeforeRetry: true });
  it('OSW Data Generator | Authenticated , When request made with tdei_dataset_id, should stream the zip file', async () => {
    let generalAPI = new CommonAPIsApi(dgConfiguration);
    await waitForJobTerminalState({
      api: generalAPI,
      projectGroupId: tdei_project_group_id,
      jobId: convertJobId,
      deadlineMs: 6 * 60 * 1000,
      terminalStatuses: ["COMPLETED", "FAILED"],
    });

    let response = await generalAPI.jobDownload(convertJobId, { responseType: 'arraybuffer' });
    const data: any = response.data;
    const contentType = response.headers['content-type'];

    expect(contentType).toBeOneOf(["application/xml", "application/zip"]);
    expect(response.data).not.toBeNull();
    expect(response.status).toBe(200);
    if (contentType === "application/zip") {
      const zip = new AdmZip(data);
      const entries = zip.getEntries();
      expect(entries.length).toBe(1);
    }
  }, 6 * 60 * 1000 + EXTRA_TIMEOUT_MS);

  it('OSW Data Generator | Authenticated , When request made for OSM to OSW conversion, should stream the zip file', async () => {
    let generalAPI = new CommonAPIsApi(dgConfiguration);
    await waitForJobTerminalState({
      api: generalAPI,
      projectGroupId: tdei_project_group_id,
      jobId: convertJobIdOSMToOSW,
      deadlineMs: 6 * 60 * 1000,
      terminalStatuses: ["COMPLETED", "FAILED"],
    });

    let response = await generalAPI.jobDownload(convertJobIdOSMToOSW, { responseType: 'arraybuffer' });
    const data: any = response.data;
    const contentType = response.headers['content-type'];

    expect(contentType).toBeOneOf(["application/xml", "application/zip"]);
    expect(response.data).not.toBeNull();
    expect(response.status).toBe(200);
  }, 6 * 60 * 1000 + EXTRA_TIMEOUT_MS);
  it('Admin | un-authenticated , When request made, should respond with unauthenticated request', async () => {
    let generalAPI = new CommonAPIsApi(Utility.getAdminConfiguration());

    let downloadResponse = generalAPI.jobDownload(convertJobId);

    await expect(downloadResponse).rejects.toMatchObject({ response: { status: 401 } });
  });

});

describe('Download OSW File as zip', () => {
  it('API-Key | Authenticated , When request made with tdei_dataset_id, should stream the zip file', async () => {

    let oswAPI = new OSWApi(apiKeyConfiguration);

    let response = await oswAPI.getOswFile(uploadedDatasetId, "osw", "latest", { responseType: 'arraybuffer' });
    const data: any = response.data;
    const contentType = response.headers['content-type'];
    const zip = new AdmZip(data);
    const entries = zip.getEntries();

    expect(entries.length).toBeGreaterThanOrEqual(2);
    expect(contentType).toBe("application/octet-stream");
    expect(response.data).not.toBeNull();
    expect(response.status).toBe(200);
  }, 10000);

  it('Admin | Authenticated , When request made with invalid file format, should respond with bad request error', async () => {

    let oswAPI = new OSWApi(adminConfiguration);

    let response = oswAPI.getOswFile("42292e88-21b1-448a-b4c1-493fb3346571", "oos");

    await expect(response).rejects.toMatchObject({ response: { status: 400 } });

  });

  it('Admin | Authenticated , When request made with invalid file version, should respond with bad request error', async () => {

    let oswRecordId = 'dummyRecordId';
    let oswAPI = new OSWApi(adminConfiguration);

    let response = oswAPI.getOswFile(oswRecordId, "osm", "dummyVersion");

    await expect(response).rejects.toMatchObject({ response: { status: 400 } });

  });

  it('Admin | Authenticated , When request made with invalid tdei_dataset_id, should respond with dataset id not found error', async () => {

    let oswRecordId = 'dummyRecordId';
    let oswAPI = new OSWApi(adminConfiguration);

    let response = oswAPI.getOswFile(oswRecordId);

    await expect(response).rejects.toMatchObject({ response: { status: 404 } });

  });

  it('Admin | Authenticated , When request made with flex tdei_dataset_id, should respond with dataset type mismatch error', async () => {

    let oswAPI = new OSWApi(adminConfiguration);

    let response = oswAPI.getOswFile(seedData.datasets.flex.pre_release_dataset);

    await expect(response).rejects.toMatchObject({ response: { status: 400 } });

  });

  it('Admin | un-authenticated , When request made with tdei_dataset_id, should respond with unauthenticated request', async () => {

    let oswAPI = new OSWApi(Utility.getAdminConfiguration());

    let response = oswAPI.getOswFile(uploadedDatasetId);

    await expect(response).rejects.toMatchObject({ response: { status: 401 } });

  });
});

describe('Dataset Bbox Request', () => {
  it('OSW Data Generator | Authenticated ,[OSM] When request made with valid dataset, should return request job id as response', async () => {
    let oswAPI = new OSWApi(dgConfiguration);

    let bboxRequest = await oswAPI.datasetBbox(bboxRecordId, 'osm', [-118.27222419, 34.0511586948, -118.2658509169, 34.0559536885]);

    expect(bboxRequest.status).toBe(202);
    expect(bboxRequest.data).toBeNumber();
    datasetBboxJobIdOSM = bboxRequest.data!;
    //verify location header
    expect(bboxRequest.headers.location).toBeDefined();
    expect(bboxRequest.headers.location).toContain(`/api/v1/jobs?job_id=${datasetBboxJobIdOSM}`);
  });

  it('POC | Authenticated ,[OSM] When request made with valid dataset, should return request job id as response', async () => {
    let oswAPI = new OSWApi(pocConfiguration);

    let bboxRequest = await oswAPI.datasetBbox(bboxRecordId, 'osm', [-118.27222419, 34.0511586948, -118.2658509169, 34.0559536885]);

    expect(bboxRequest.status).toBe(202);
    expect(bboxRequest.data).toBeNumber();
  });

  it('Admin | Authenticated ,[OSM] When request made with valid dataset, should return request job id as response', async () => {
    let oswAPI = new OSWApi(adminConfiguration);

    let bboxRequest = await oswAPI.datasetBbox(bboxRecordId, 'osm', [-118.27222419, 34.0511586948, -118.2658509169, 34.0559536885]);

    expect(bboxRequest.status).toBe(202);
    expect(bboxRequest.data).toBeNumber();
  });


  it('API-Key | Authenticated ,[OSM] When request made with dataset, should return request job id as response', async () => {
    let oswAPI = new OSWApi(apiKeyConfiguration);

    let bboxRequest = await oswAPI.datasetBbox(bboxRecordId, 'osm', [-118.27222419, 34.0511586948, -118.2658509169, 34.0559536885], { headers: { 'x-api-key': apiKeyConfiguration.apiKey?.toString() } });

    expect(bboxRequest.status).toBe(202);
    expect(bboxRequest.data).toBeNumber();
  });

  it('OSW Data Generator | Authenticated ,[OSW] When request made with valid dataset, should return request job id as response', async () => {
    let oswAPI = new OSWApi(dgConfiguration);

    let bboxRequest = await oswAPI.datasetBbox(bboxRecordId, 'osw', [-118.27222419, 34.0511586948, -118.2658509169, 34.0559536885]);

    expect(bboxRequest.status).toBe(202);
    expect(bboxRequest.data).toBeNumber();
    datasetBboxJobIdOSW = bboxRequest.data!;
    console.log("dataset bbox job_id", datasetBboxJobIdOSW);
  });

  it('POC | Authenticated ,[OSW] When request made with valid dataset, should return request job id as response', async () => {
    let oswAPI = new OSWApi(pocConfiguration);

    let bboxRequest = await oswAPI.datasetBbox(bboxRecordId, 'osw', [-118.27222419, 34.0511586948, -118.2658509169, 34.0559536885]);

    expect(bboxRequest.status).toBe(202);
    expect(bboxRequest.data).toBeNumber();
  });

  it('Admin | Authenticated ,[OSW] When request made with valid dataset, should return request job id as response', async () => {
    let oswAPI = new OSWApi(adminConfiguration);

    let bboxRequest = await oswAPI.datasetBbox(bboxRecordId, 'osw', [-118.27222419, 34.0511586948, -118.2658509169, 34.0559536885]);

    expect(bboxRequest.status).toBe(202);
    expect(bboxRequest.data).toBeNumber();
  });


  it('API-Key | Authenticated ,[OSW] When request made with dataset, should return request job id as response', async () => {
    let oswAPI = new OSWApi(apiKeyConfiguration);

    let bboxRequest = await oswAPI.datasetBbox(bboxRecordId, 'osw', [-118.27222419, 34.0511586948, -118.2658509169, 34.0559536885], { headers: { 'x-api-key': apiKeyConfiguration.apiKey?.toString() } });

    expect(bboxRequest.status).toBe(202);
    expect(bboxRequest.data).toBeNumber();
  });

  it('Admin | un-authenticated , When request made with dataset, should return with unauthenticated request', async () => {
    let oswAPI = new OSWApi(Utility.getAdminConfiguration());

    let bboxRequest = oswAPI.datasetBbox(bboxRecordId, 'osm', [-118.27222419, 34.0511586948, -118.2658509169, 34.0559536885]);

    await expect(bboxRequest).rejects.toMatchObject({ response: { status: 401 } });
  });

  it('Admin | Authenticated , When request made with invalid dataset, should return with dataset not found error', async () => {
    let oswAPI = new OSWApi(adminConfiguration);

    let bboxRequest = oswAPI.datasetBbox("invalid_bboxRecordId", 'osm', [-118.27222419, 34.0511586948, -118.2658509169, 34.0559536885]);

    await expect(bboxRequest).rejects.toMatchObject({ response: { status: 404 } });
  });

  it('Admin | Authenticated , When request made with invalid bbox, should return with invalid bbox error', async () => {
    let oswAPI = new OSWApi(adminConfiguration);

    let bboxRequest = oswAPI.datasetBbox(bboxRecordId, 'osm', [47.691327]);

    await expect(bboxRequest).rejects.toMatchObject({ response: { status: 400 } });
  });

  it('Admin | Authenticated , When request made with flex dataset, should return with dataset type mismatch error error', async () => {
    let oswAPI = new OSWApi(adminConfiguration);

    let bboxRequest = oswAPI.datasetBbox(seedData.datasets.flex.pre_release_dataset, 'osm', [-118.27222419, 34.0511586948, -118.2658509169, 34.0559536885]);

    await expect(bboxRequest).rejects.toMatchObject({ response: { status: 400 } });
  });

});

describe('Check dataset-bbox request job running status', () => {
  jest.retryTimes(1, { logErrorsBeforeRetry: true });
  it('OSW Data Generator | Authenticated ,[OSM] When request made, should respond with job status', async () => {
    let generalAPI = new CommonAPIsApi(dgConfiguration);
    const { job } = await waitForJobTerminalState({
      api: generalAPI,
      projectGroupId: tdei_project_group_id,
      jobId: datasetBboxJobIdOSM,
      deadlineMs: 6 * 60 * 1000,
      terminalStatuses: ["COMPLETED", "FAILED"],
    });
    expect((job as any)?.job_id).toBeOneOf([`${datasetBboxJobIdOSM}`]);
    expect((job as any)?.status).toBeOneOf(["COMPLETED", "FAILED"]);
  }, 6 * 60 * 1000 + EXTRA_TIMEOUT_MS);

  it('OSW Data Generator | Authenticated , [OSW] When request made, should respond with job status', async () => {
    let generalAPI = new CommonAPIsApi(dgConfiguration);
    const { job } = await waitForJobTerminalState({
      api: generalAPI,
      projectGroupId: tdei_project_group_id,
      jobId: datasetBboxJobIdOSW,
      deadlineMs: 6 * 60 * 1000,
      terminalStatuses: ["COMPLETED", "FAILED"],
    });
    expect((job as any)?.job_id).toBeOneOf([`${datasetBboxJobIdOSW}`]);
    expect((job as any)?.status).toBeOneOf(["COMPLETED", "FAILED"]);
  }, 6 * 60 * 1000 + EXTRA_TIMEOUT_MS);

  it('POC | Authenticated , When request made, should respond with job status', async () => {
    let generalAPI = new CommonAPIsApi(pocConfiguration);
    let uploadStatus = await generalAPI.listJobs(tdei_project_group_id, datasetBboxJobIdOSM, true);
    expect(uploadStatus.status).toBe(200);
  }, 25000);


  it('Admin | Authenticated , When request made, should respond with job status', async () => {
    let generalAPI = new CommonAPIsApi(adminConfiguration);
    let uploadStatus = await generalAPI.listJobs("", datasetBboxJobIdOSM, true);
    expect(uploadStatus.status).toBe(200);
  }, 25000);

  it('Admin | un-authenticated , When request made, should respond with unauthenticated request', async () => {
    let generalAPI = new CommonAPIsApi(Utility.getAdminConfiguration());

    let bboxStatusResponse = generalAPI.listJobs("", datasetBboxJobIdOSM, true);

    await expect(bboxStatusResponse).rejects.toMatchObject({ response: { status: 401 } });
  });

});

describe('Download Dataset Bbox request file', () => {
  jest.retryTimes(3, { logErrorsBeforeRetry: true });
  it('OSW Data Generator | Authenticated , When request made with tdei_dataset_id, should stream the zip file', async () => {
    let generalAPI = new CommonAPIsApi(dgConfiguration);
    await waitForJobTerminalState({
      api: generalAPI,
      projectGroupId: tdei_project_group_id,
      jobId: datasetBboxJobIdOSM,
      deadlineMs: 6 * 60 * 1000,
      terminalStatuses: ["COMPLETED", "FAILED"],
    });

    let response = await generalAPI.jobDownload(datasetBboxJobIdOSM, { responseType: 'arraybuffer' });
    const data: any = response.data;
    const contentType = response.headers['content-type'];

    expect(contentType).toBeOneOf(["application/xml", "application/zip"]);
    expect(response.data).not.toBeNull();
    expect(response.status).toBe(200);
    if (contentType === "application/zip") {
      const zip = new AdmZip(data);
      const entries = zip.getEntries();
      expect(entries.length).toBeGreaterThanOrEqual(1);
    }
  }, 6 * 60 * 1000 + EXTRA_TIMEOUT_MS);

  it('Admin | un-authenticated , When request made with tdei_dataset_id, should respond with unauthenticated request', async () => {
    let generalAPI = new CommonAPIsApi(Utility.getAdminConfiguration());

    let downloadResponse = generalAPI.jobDownload(datasetBboxJobIdOSM);

    await expect(downloadResponse).rejects.toMatchObject({ response: { status: 401 } });
  });

});

let datasetRoadTagJobId = '1';
describe('Dataset Road Tag Request', () => {
  // let datasetTagSourceRecordId = seedData.datasets.osw.test_dataset;
  // let datasetTagTargetPublishedRecordId = seedData.datasets.osw.published_dataset;//'762f3533-b18f-470f-8051-1a7988bf80c7';

  it('OSW Data Generator | Authenticated , When request made with valid dataset, should return request job id as response', async () => {
    let oswAPI = new OSWApi(dgConfiguration);

    let roadTagRequest = await oswAPI.datasetTagRoad(seedData.datasets.osw.test_dataset, uploadedDatasetId_PreRelease_poc);

    expect(roadTagRequest.status).toBe(202);
    expect(roadTagRequest.data).toBeNumber();
    datasetRoadTagJobId = roadTagRequest.data!;
    console.log("dataset road tag job_id", datasetRoadTagJobId);
    //verify location header
    expect(roadTagRequest.headers.location).toBeDefined();
    expect(roadTagRequest.headers.location).toContain(`/api/v1/jobs?job_id=${datasetRoadTagJobId}`);
  });

  it('Admin | Authenticated , When request made with valid dataset, should return request job id as response', async () => {
    let oswAPI = new OSWApi(adminConfiguration);

    let bboxRequest = await oswAPI.datasetTagRoad(seedData.datasets.osw.test_dataset, uploadedDatasetId_PreRelease_poc);

    expect(bboxRequest.status).toBe(202);
    expect(bboxRequest.data).toBeNumber();
  });

  it('POC | Authenticated , When request made with valid dataset, should return request job id as response', async () => {
    let oswAPI = new OSWApi(pocConfiguration);

    let bboxRequest = await oswAPI.datasetTagRoad(seedData.datasets.osw.test_dataset, uploadedDatasetId_PreRelease_poc);

    expect(bboxRequest.status).toBe(202);
    expect(bboxRequest.data).toBeNumber();
  });

  it('Admin | authenticated , When request made with publish target dataset, should return with bad request', async () => {
    let oswAPI = new OSWApi(adminConfiguration);

    let bboxRequest = oswAPI.datasetTagRoad(seedData.datasets.osw.test_dataset, seedData.datasets.osw.published_dataset);

    await expect(bboxRequest).rejects.toMatchObject({ response: { status: 400 } });
  });

  it('Admin | authenticated , When request made with invalid source dataset, should return with dataset not found error', async () => {

    let oswAPI = new OSWApi(adminConfiguration);

    let bboxRequest = oswAPI.datasetTagRoad("invalid_source", seedData.datasets.osw.published_dataset);

    await expect(bboxRequest).rejects.toMatchObject({ response: { status: 404 } });
  });

  it('Admin | authenticated , When request made with invalid target dataset, should return with dataset not found error', async () => {
    let oswAPI = new OSWApi(adminConfiguration);

    let bboxRequest = oswAPI.datasetTagRoad(seedData.datasets.osw.test_dataset, "invalid_target");

    await expect(bboxRequest).rejects.toMatchObject({ response: { status: 404 } });
  });

  it('Admin | un-authenticated , When request made with dataset, should return with unauthenticated request', async () => {
    let oswAPI = new OSWApi(Utility.getAdminConfiguration());

    let bboxRequest = oswAPI.datasetTagRoad(seedData.datasets.osw.test_dataset, uploadedDatasetId_PreRelease_poc);

    await expect(bboxRequest).rejects.toMatchObject({ response: { status: 401 } });
  });

  it('API-Key | Authenticated , When request made with dataset, should return with unauthorized request', async () => {
    let oswAPI = new OSWApi(apiKeyConfiguration);

    let bboxRequest = oswAPI.datasetTagRoad(seedData.datasets.osw.test_dataset, uploadedDatasetId_PreRelease_poc, { headers: { 'x-api-key': apiKeyConfiguration.apiKey?.toString() } });

    await expect(bboxRequest).rejects.toMatchObject({ response: { status: 403 } });
  });

});

describe('Check dataset-road-tag request job completion status', () => {
  jest.retryTimes(1, { logErrorsBeforeRetry: true });

  it('OSW Data Generator | Authenticated , When request made, should respond with job status', async () => {
    let generalAPI = new CommonAPIsApi(dgConfiguration);
    const { job } = await waitForJobTerminalState({
      api: generalAPI,
      projectGroupId: tdei_project_group_id,
      jobId: datasetRoadTagJobId,
      deadlineMs: 8 * 60 * 1000,
      terminalStatuses: ["COMPLETED", "FAILED"],
    });
    expect((job as any)?.job_id).toBeOneOf([`${datasetRoadTagJobId}`]);
    expect((job as any)?.status).toBe("COMPLETED");
  }, 8 * 60 * 1000 + EXTRA_TIMEOUT_MS);

  it('POC | Authenticated , When request made, should respond with job status', async () => {
    let generalAPI = new CommonAPIsApi(pocConfiguration);
    let uploadStatus = await generalAPI.listJobs(tdei_project_group_id, datasetRoadTagJobId, true);
    expect(uploadStatus.status).toBe(200);
  }, 25000);


  it('Admin | Authenticated , When request made, should respond with job status', async () => {
    let generalAPI = new CommonAPIsApi(adminConfiguration);
    let uploadStatus = await generalAPI.listJobs("", datasetRoadTagJobId, true);
    expect(uploadStatus.status).toBe(200);
  }, 25000);

  it('Admin | un-authenticated , When request made, should respond with unauthenticated request', async () => {
    let generalAPI = new CommonAPIsApi(Utility.getAdminConfiguration());

    let bboxStatusResponse = generalAPI.listJobs("", datasetRoadTagJobId, true);

    await expect(bboxStatusResponse).rejects.toMatchObject({ response: { status: 401 } });
  });

});

describe('Download Dataset Road Tag request file', () => {
  jest.retryTimes(3, { logErrorsBeforeRetry: true });

  it('Admin | Authenticated , When request made with tdei_dataset_id, should stream the zip file', async () => {
    let generalAPI = new CommonAPIsApi(adminConfiguration);
    await waitForJobTerminalState({
      api: generalAPI,
      projectGroupId: "",
      jobId: datasetRoadTagJobId,
      deadlineMs: 8 * 60 * 1000,
      terminalStatuses: ["COMPLETED", "FAILED"],
    });

    let response = await generalAPI.jobDownload(datasetRoadTagJobId, { responseType: 'arraybuffer' });
    const data: any = response.data;
    const contentType = response.headers['content-type'];

    expect(contentType).toBeOneOf(["application/xml", "application/zip"]);
    expect(response.data).not.toBeNull();
    expect(response.status).toBe(200);
    if (contentType === "application/zip") {
      const zip = new AdmZip(data);
      const entries = zip.getEntries();
      expect(entries.length).toBeGreaterThanOrEqual(1);
    }
  }, 8 * 60 * 1000 + EXTRA_TIMEOUT_MS);

  it('API-Key | Authenticated , When request made with tdei_dataset_id, should stream the zip file', async () => {
    let generalAPI = new CommonAPIsApi(apiKeyConfiguration);

    let response = await generalAPI.jobDownload(datasetRoadTagJobId, { responseType: 'arraybuffer' });
    const data: any = response.data;
    const contentType = response.headers['content-type'];

    expect(contentType).toBeOneOf(["application/xml", "application/zip"]);
    expect(response.data).not.toBeNull();
    expect(response.status).toBe(200);
    if (contentType === "application/zip") {
      const zip = new AdmZip(data);
      const entries = zip.getEntries();
      expect(entries.length).toBeGreaterThanOrEqual(1);
    }
  }, 20000);

  it('Admin | un-authenticated , When request made with tdei_dataset_id, should respond with unauthenticated request', async () => {
    let generalAPI = new CommonAPIsApi(Utility.getAdminConfiguration());

    let downloadResponse = generalAPI.jobDownload(datasetRoadTagJobId);

    await expect(downloadResponse).rejects.toMatchObject({ response: { status: 401 } });
  });

});

let datasetUnionJobId = '1';
describe('Dataset Union Request', () => {

  it('OSW Data Generator | Authenticated , When request made with valid dataset, should return request job id as response', async () => {
    let oswAPI = new OSWApi(dgConfiguration);

    let unionRequest = await oswAPI.oswUnion({
      tdei_dataset_id_one: uploadedDatasetId,
      tdei_dataset_id_two: uploadedDatasetId_PreRelease_poc
    }
    );

    expect(unionRequest.status).toBe(202);
    expect(unionRequest.data).toBeNumber();
    datasetUnionJobId = unionRequest.data!;
    console.log("dataset Union job_id", datasetUnionJobId);
    //verify location header
    expect(unionRequest.headers.location).toBeDefined();
    expect(unionRequest.headers.location).toContain(`/api/v1/jobs?job_id=${datasetUnionJobId}`);
  });

  it('Admin | Authenticated , When request made with valid dataset, should return request job id as response', async () => {
    let oswAPI = new OSWApi(adminConfiguration);

    let bboxRequest = await oswAPI.oswUnion({
      tdei_dataset_id_one: uploadedDatasetId,
      tdei_dataset_id_two: uploadedDatasetId_PreRelease_poc
    });

    expect(bboxRequest.status).toBe(202);
    expect(bboxRequest.data).toBeNumber();
  });

  it('POC | Authenticated , When request made with valid dataset, should return request job id as response', async () => {
    let oswAPI = new OSWApi(pocConfiguration);

    let bboxRequest = await oswAPI.oswUnion({
      tdei_dataset_id_one: uploadedDatasetId,
      tdei_dataset_id_two: uploadedDatasetId_PreRelease_poc
    });

    expect(bboxRequest.status).toBe(202);
    expect(bboxRequest.data).toBeNumber();
  });

  it('Admin | authenticated , When request made with invalid left dataset, should return with dataset not found error', async () => {
    let oswAPI = new OSWApi(adminConfiguration);

    let bboxRequest = oswAPI.oswUnion({
      tdei_dataset_id_one: "invalid",
      tdei_dataset_id_two: uploadedDatasetId
    });

    await expect(bboxRequest).rejects.toMatchObject({ response: { status: 404 } });
  });

  it('Admin | authenticated , When request made with invalid right dataset, should return with dataset not found error', async () => {
    let oswAPI = new OSWApi(adminConfiguration);

    let bboxRequest = oswAPI.oswUnion({
      tdei_dataset_id_one: uploadedDatasetId,
      tdei_dataset_id_two: "invalid"
    });

    await expect(bboxRequest).rejects.toMatchObject({ response: { status: 404 } });
  });

  it('Admin | un-authenticated , When request made with dataset, should return with unauthenticated request', async () => {
    let oswAPI = new OSWApi(Utility.getAdminConfiguration());

    let bboxRequest = oswAPI.oswUnion({
      tdei_dataset_id_one: uploadedDatasetId,
      tdei_dataset_id_two: uploadedDatasetId_PreRelease_poc
    });

    await expect(bboxRequest).rejects.toMatchObject({ response: { status: 401 } });
  });

  it('API-Key | Authenticated , When request made with dataset, should return request job id as response', async () => {
    let oswAPI = new OSWApi(apiKeyConfiguration);

    let bboxRequest = await oswAPI.oswUnion({
      tdei_dataset_id_one: seedData.datasets.osw.test_dataset,
      tdei_dataset_id_two: uploadedDatasetId_PreRelease_poc
    }, { headers: { 'x-api-key': apiKeyConfiguration.apiKey?.toString() } });

    expect(bboxRequest.status).toBe(202);
    expect(bboxRequest.data).toBeNumber();
  });

});

describe('Check dataset union request job completion status', () => {
  jest.retryTimes(3, { logErrorsBeforeRetry: true });

  it('OSW Data Generator | Authenticated , When request made, should respond with job status', async () => {
    let generalAPI = new CommonAPIsApi(dgConfiguration);
    const { job } = await waitForJobTerminalState({
      api: generalAPI,
      projectGroupId: tdei_project_group_id,
      jobId: datasetUnionJobId,
      deadlineMs: 12 * 60 * 1000,
      terminalStatuses: ["COMPLETED", "FAILED"],
    });
    expect((job as any)?.job_id).toBeOneOf([`${datasetUnionJobId}`]);
    expect((job as any)?.status).toBe("COMPLETED");
  }, 12 * 60 * 1000 + EXTRA_TIMEOUT_MS);

  it('POC | Authenticated , When request made, should respond with job status', async () => {
    let generalAPI = new CommonAPIsApi(pocConfiguration);
    let uploadStatus = await generalAPI.listJobs(tdei_project_group_id, datasetUnionJobId, true);
    expect(uploadStatus.status).toBe(200);
  }, 25000);


  it('Admin | Authenticated , When request made, should respond with job status', async () => {
    let generalAPI = new CommonAPIsApi(adminConfiguration);
    let uploadStatus = await generalAPI.listJobs("", datasetUnionJobId, true);
    expect(uploadStatus.status).toBe(200);
  }, 25000);

  it('Admin | un-authenticated , When request made, should respond with unauthenticated request', async () => {
    let generalAPI = new CommonAPIsApi(Utility.getAdminConfiguration());

    let bboxStatusResponse = generalAPI.listJobs("", datasetUnionJobId, true);

    await expect(bboxStatusResponse).rejects.toMatchObject({ response: { status: 401 } });
  });

});

describe('Download Dataset Union request file', () => {
  jest.retryTimes(3, { logErrorsBeforeRetry: true });

  it('Admin | Authenticated , When request made with tdei_dataset_id, should stream the zip file', async () => {
    let generalAPI = new CommonAPIsApi(adminConfiguration);

    let response = await generalAPI.jobDownload(datasetUnionJobId, { responseType: 'arraybuffer' });
    const data: any = response.data;
    const contentType = response.headers['content-type'];

    expect(contentType).toBeOneOf(["application/zip"]);
    expect(response.data).not.toBeNull();
    expect(response.status).toBe(200);
    if (contentType === "application/zip") {
      const zip = new AdmZip(data);
      const entries = zip.getEntries();
      expect(entries.length).toBeGreaterThanOrEqual(0);
    }
  }, 20000);

  it('API-Key | Authenticated , When request made with tdei_dataset_id, should stream the zip file', async () => {
    let generalAPI = new CommonAPIsApi(apiKeyConfiguration);

    let response = await generalAPI.jobDownload(datasetUnionJobId, { responseType: 'arraybuffer' });
    const data: any = response.data;
    const contentType = response.headers['content-type'];

    expect(contentType).toBeOneOf(["application/zip"]);
    expect(response.data).not.toBeNull();
    expect(response.status).toBe(200);
    if (contentType === "application/zip") {
      const zip = new AdmZip(data);
      const entries = zip.getEntries();
      expect(entries.length).toBeGreaterThanOrEqual(0);
    }
  }, 20000);

  it('Admin | un-authenticated , When request made with tdei_dataset_id, should respond with unauthenticated request', async () => {
    let generalAPI = new CommonAPIsApi(Utility.getAdminConfiguration());

    let downloadResponse = generalAPI.jobDownload(datasetUnionJobId);

    await expect(downloadResponse).rejects.toMatchObject({ response: { status: 401 } });
  });

});

let spacialJoinJobId = '';
describe('Spatial join Request', () => {

  it('OSW Data Generator | Authenticated , When request made with invalid/missing join input, should return bad response', async () => {
    let oswAPI = new OSWApi(dgConfiguration);
    let input = Utility.getSpatialJoinInput();
    input.join_condition = "";
    input.target_dimension = "invalid" as any;

    await expect(oswAPI.oswSpatialJoin(input)).rejects.toMatchObject({ response: { status: 400 } });
  });

  it('OSW Data Generator | Authenticated , When request made with invalid target dataset id input, should return dataset not found response', async () => {
    let oswAPI = new OSWApi(dgConfiguration);
    let input = Utility.getSpatialJoinInput();
    input.target_dataset_id = "invalid";

    await expect(oswAPI.oswSpatialJoin(input)).rejects.toMatchObject({ response: { status: 404 } });
  });

  it('OSW Data Generator | Authenticated , When request made with invalid source dataset id input, should return dataset not found response', async () => {
    let oswAPI = new OSWApi(dgConfiguration);
    let input = Utility.getSpatialJoinInput();
    input.source_dataset_id = "invalid";

    await expect(oswAPI.oswSpatialJoin(input)).rejects.toMatchObject({ response: { status: 404 } });
  });

  it('OSW Data Generator | Authenticated , When request made with SQL Injection command, should return bad request', async () => {
    let oswAPI = new OSWApi(dgConfiguration);
    let input = Utility.getSpatialJoinInput();
    input.target_dataset_id = "DELETE * FROM Table;--";

    await expect(oswAPI.oswSpatialJoin(input)).rejects.toMatchObject({ response: { status: 400 } });
  });

  it('OSW Data Generator | Authenticated , When request made with non osw source dataset id, should return bad request', async () => {
    let oswAPI = new OSWApi(dgConfiguration);
    let input = Utility.getSpatialJoinInput();
    input.source_dataset_id = seedData.datasets.flex.published_dataset;

    await expect(oswAPI.oswSpatialJoin(input)).rejects.toMatchObject({ response: { status: 400 } });
  });

  it('OSW Data Generator | Authenticated , When request made with non osw target dataset id, should return bad request', async () => {
    let oswAPI = new OSWApi(dgConfiguration);
    let input = Utility.getSpatialJoinInput();
    input.target_dataset_id = seedData.datasets.pathways.published_dataset;

    await expect(oswAPI.oswSpatialJoin(input)).rejects.toMatchObject({ response: { status: 400 } });
  });

  it('OSW Data Generator | Authenticated , When request made with valid join input, should return request job id as response', async () => {
    let oswAPI = new OSWApi(dgConfiguration);

    let spatialRequest = await oswAPI.oswSpatialJoin(Utility.getSpatialJoinInput());

    expect(spatialRequest.status).toBe(202);
    expect(spatialRequest.data).toBeNumber();
    spacialJoinJobId = spatialRequest.data!;
    console.log("Spatial join job_id", spacialJoinJobId);
    //verify location header
    expect(spatialRequest.headers.location).toBeDefined();
    expect(spatialRequest.headers.location).toContain(`/api/v1/jobs?job_id=${spacialJoinJobId}`);
  }, 20000);

  it('Admin | Authenticated , When request made with valid join input, should return request job id as response', async () => {
    let oswAPI = new OSWApi(adminConfiguration);

    let spatialRequest = await oswAPI.oswSpatialJoin(Utility.getSpatialJoinInput());

    expect(spatialRequest.status).toBe(202);
    expect(spatialRequest.data).toBeNumber();
  });

  it('POC | Authenticated , When request made with valid join input, should return request job id as response', async () => {
    let oswAPI = new OSWApi(pocConfiguration);

    let spatialRequest = await oswAPI.oswSpatialJoin(Utility.getSpatialJoinInput());

    expect(spatialRequest.status).toBe(202);
    expect(spatialRequest.data).toBeNumber();
  });

  it('Admin | un-authenticated , When request made with valid join input, should return with unauthenticated request', async () => {
    let oswAPI = new OSWApi(Utility.getAdminConfiguration());

    let bboxRequest = oswAPI.datasetTagRoad(seedData.datasets.osw.published_dataset, uploadedDatasetId);

    await expect(bboxRequest).rejects.toMatchObject({ response: { status: 401 } });
  });

});

describe('Check spatial join request job completion status', () => {
  jest.retryTimes(1, { logErrorsBeforeRetry: true });

  it('OSW Data Generator | Authenticated , When request made, should respond with job status', async () => {
    let generalAPI = new CommonAPIsApi(dgConfiguration);
    const { job } = await waitForJobTerminalState({
      api: generalAPI,
      projectGroupId: tdei_project_group_id,
      jobId: spacialJoinJobId,
      deadlineMs: 8 * 60 * 1000,
      terminalStatuses: ["COMPLETED", "FAILED"],
    });
    expect((job as any)?.job_id).toBeOneOf([`${spacialJoinJobId}`]);
    expect((job as any)?.status).toBeOneOf(["COMPLETED", "FAILED"]);
    if ((job as any)?.progress) {
      expect((job as any).progress).toEqual(
        expect.objectContaining({
          total_stages: expect.any(Number),
          completed_stages: expect.any(Number),
          current_state: expect.toBeOneOf(["COMPLETED", "IN-PROGRESS", "RUNNING", "FAILED"]),
          current_stage: expect.any(String),
        })
      );
    }
  }, 8 * 60 * 1000 + EXTRA_TIMEOUT_MS);

  it('POC | Authenticated , When request made, should respond with job status', async () => {
    let generalAPI = new CommonAPIsApi(pocConfiguration);
    let uploadStatus = await generalAPI.listJobs(tdei_project_group_id, spacialJoinJobId, true);
    expect(uploadStatus.status).toBe(200);
  }, 25000);

  it('Admin | Authenticated , When request made, should respond with job status', async () => {
    let generalAPI = new CommonAPIsApi(adminConfiguration);
    let uploadStatus = await generalAPI.listJobs("", spacialJoinJobId, true);
    expect(uploadStatus.status).toBe(200);
  }, 25000);

  it('Admin | un-authenticated , When request made, should respond with unauthenticated request', async () => {
    let generalAPI = new CommonAPIsApi(Utility.getAdminConfiguration());

    let bboxStatusResponse = generalAPI.listJobs("", spacialJoinJobId, true);

    await expect(bboxStatusResponse).rejects.toMatchObject({ response: { status: 401 } });
  });

});

describe('Download Spatial join request file', () => {
  jest.retryTimes(3, { logErrorsBeforeRetry: true });

  it('Admin | Authenticated , When request made with job_id, should stream the zip file', async () => {
    let generalAPI = new CommonAPIsApi(adminConfiguration);
    await waitForJobTerminalState({
      api: generalAPI,
      projectGroupId: "",
      jobId: spacialJoinJobId,
      deadlineMs: 8 * 60 * 1000,
      terminalStatuses: ["COMPLETED", "FAILED"],
    });
    let response = await generalAPI.jobDownload(spacialJoinJobId, { responseType: 'arraybuffer' });
    const data: any = response.data;
    const contentType = response.headers['content-type'];

    expect(contentType).toBeOneOf(["application/xml", "application/zip"]);
    expect(response.data).not.toBeNull();
    expect(response.status).toBe(200);
    if (contentType === "application/zip") {
      const zip = new AdmZip(data);
      const entries = zip.getEntries();
      expect(entries.length).toBeGreaterThanOrEqual(1);
    }
  }, 8 * 60 * 1000 + EXTRA_TIMEOUT_MS);

  it('API-Key | Authenticated , When request made with job_id, should stream the zip file', async () => {
    let generalAPI = new CommonAPIsApi(apiKeyConfiguration);
    let response = await generalAPI.jobDownload(spacialJoinJobId, { responseType: 'arraybuffer' });
    const data: any = response.data;
    const contentType = response.headers['content-type'];

    expect(contentType).toBeOneOf(["application/xml", "application/zip"]);
    expect(response.data).not.toBeNull();
    expect(response.status).toBe(200);
    if (contentType === "application/zip") {
      const zip = new AdmZip(data);
      const entries = zip.getEntries();
      expect(entries.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('Admin | un-authenticated , When request made with job_id, should respond with unauthenticated request', async () => {
    let generalAPI = new CommonAPIsApi(Utility.getAdminConfiguration());

    let downloadResponse = generalAPI.jobDownload(spacialJoinJobId);

    await expect(downloadResponse).rejects.toMatchObject({ response: { status: 401 } });
  });

});
let qualityReportJobId = '';
describe("Quality Report API", () => {
  it("Admin | Authenticated, when request made with valid tdei_dataset_id, should return job id (202) and complete", async () => {
    let oswAPI = new OSWApi(dgConfiguration);
    const resp = await oswAPI.oswQualityReportGenerate(uploadedDatasetId);
    qualityReportJobId = resp.data!;
    expect(resp.status).toBe(202);
    expect(resp.data).toBeNumber();
    expect(resp.headers.location).toBeDefined();
    expect(resp.headers.location).toContain(`/api/v1/jobs?job_id=${qualityReportJobId}`);
  }, 8 * 60 * 1000 + EXTRA_TIMEOUT_MS);

  it("POC | Authenticated, when request made with valid tdei_dataset_id, should return job id (202) and complete", async () => {
    let oswAPI = new OSWApi(pocConfiguration);
    let tdei_dataset_id = seedData.datasets.osw.published_dataset;
    const resp = await oswAPI.oswQualityReportGenerate(tdei_dataset_id);
    expect(resp.status).toBe(202);
    expect(resp.data).toBeNumber();
    expect(resp.headers.location).toBeDefined();
    expect(resp.headers.location).toContain(`/api/v1/jobs?job_id=${resp.data}`);
  }, 8 * 60 * 1000 + EXTRA_TIMEOUT_MS);

  it("Admin | Authenticated, when request made twice, should return 409", async () => {
    const tdei_dataset_id = uploadedDatasetId;
    let oswAPI = new OSWApi(dgConfiguration);
    await expect(oswAPI.oswQualityReportGenerate(tdei_dataset_id)).rejects.toMatchObject({ response: { status: 409 } });
  }, 8 * 60 * 1000 + EXTRA_TIMEOUT_MS);

  it("Admin | un-authenticated, when request made, should return 401", async () => {
    const tdei_dataset_id = uploadedDatasetId;
    let oswAPI = new OSWApi(Utility.getAdminConfiguration());
    await expect(oswAPI.oswQualityReportGenerate(tdei_dataset_id)).rejects.toMatchObject({ response: { status: 401 } });
  }, 8 * 60 * 1000 + EXTRA_TIMEOUT_MS);

  it("Admin | Authenticated, when request made with non-OSW dataset id, should return 400/404", async () => {
    const nonOswDatasetId = seedData.datasets.flex.published_dataset;
    let oswAPI = new OSWApi(adminConfiguration);
    await expect(oswAPI.oswQualityReportGenerate(nonOswDatasetId)).rejects.toMatchObject({ response: { status: 400 } });
  }, 8 * 60 * 1000 + EXTRA_TIMEOUT_MS);

  it("Admin | Authenticated, when request made with invalid tdei_dataset_id, should return 404", async () => {
    const tdei_dataset_id = "invalid_tdei_dataset_id";
    let oswAPI = new OSWApi(adminConfiguration);
    await expect(oswAPI.oswQualityReportGenerate(tdei_dataset_id)).rejects.toMatchObject({ response: { status: 404 } });
  }, 8 * 60 * 1000 + EXTRA_TIMEOUT_MS);
});

describe('Check quality report request job completion status', () => {
  jest.retryTimes(3, { logErrorsBeforeRetry: true });
  it('Admin | Authenticated , When request made, should respond with job status', async () => {
    let generalAPI = new CommonAPIsApi(adminConfiguration);
    const { job } = await waitForJobTerminalState({
      api: generalAPI,
      projectGroupId: "",
      jobId: qualityReportJobId,
      deadlineMs: 8 * 60 * 1000,
      terminalStatuses: ["COMPLETED", "FAILED"],
    });
    expect((job as any)?.job_id).toBeOneOf([`${qualityReportJobId}`]);
    expect((job as any)?.status).toBe("COMPLETED");
  }, 8 * 60 * 1000 + EXTRA_TIMEOUT_MS);

  it('POC | Authenticated , When request made, should respond with job status', async () => {
    let generalAPI = new CommonAPIsApi(pocConfiguration);
    let uploadStatus = await generalAPI.listJobs(tdei_project_group_id, qualityReportJobId, true);
    expect(uploadStatus.status).toBe(200);
  }, 25000);

  it('Admin | un-authenticated , When request made, should respond with unauthenticated request', async () => {
    let generalAPI = new CommonAPIsApi(Utility.getAdminConfiguration());
    let qualityReportStatusResponse = generalAPI.listJobs("", qualityReportJobId, true);
    await expect(qualityReportStatusResponse).rejects.toMatchObject({ response: { status: 401 } });
  });
});

describe("Tag Quality Metric", () => {
  it('OSW Data Generator | Authenticated , When request made with edge, node tags, expect to return quality metric', async () => {
    // Arrange
    let oswAPI = new OSWApi(dgConfiguration);
    let tagMetricToUpload = Utility.getOSWTagMetricBlob();
    let tdei_dataset_id = uploadedDatasetId;
    // Action
    const tagQualityInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => tagQualityRequestInterceptor(req, tdei_dataset_id, 'tag-quality.json'))
    const metric_result = await oswAPI.qualityMetricTagForm(tagMetricToUpload, tdei_dataset_id);
    // Assert
    expect(metric_result.status).toBe(200);
    expect(metric_result.data).toBeArray();
    expect(metric_result.data.length).toBeGreaterThan(0);
    expect(metric_result.data[0]).toContainAllKeys(['entity_type', 'total_entity_count', 'overall_quality_metric', 'metric_details']);
    axios.interceptors.request.eject(tagQualityInterceptor);
  }, 30000);

  it('POC | Authenticated , When request made with edge, node tags, expect to return quality metric', async () => {
    // Arrange
    let oswAPI = new OSWApi(pocConfiguration);
    let tagMetricToUpload = Utility.getOSWTagMetricBlob();
    let tdei_dataset_id = uploadedDatasetId;
    // Action
    const tagQualityInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => tagQualityRequestInterceptor(req, tdei_dataset_id, 'tag-quality.json'))
    const metric_result = await oswAPI.qualityMetricTagForm(tagMetricToUpload, tdei_dataset_id);
    // Assert
    expect(metric_result.status).toBe(200);
    expect(metric_result.data).toBeArray();
    expect(metric_result.data.length).toBeGreaterThan(0);
    expect(metric_result.data[0]).toContainAllKeys(['entity_type', 'total_entity_count', 'overall_quality_metric', 'metric_details']);
    axios.interceptors.request.eject(tagQualityInterceptor);
  }, 30000);

  it('Admin | Authenticated ,When request made with edge, node tags, expect to return quality metric', async () => {
    // Arrange
    let oswAPI = new OSWApi(adminConfiguration);
    let tagMetricToUpload = Utility.getOSWTagMetricBlob();
    let tdei_dataset_id = uploadedDatasetId;
    // Action
    const tagQualityInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => tagQualityRequestInterceptor(req, tdei_dataset_id, 'tag-quality.json'))
    const metric_result = await oswAPI.qualityMetricTagForm(tagMetricToUpload, tdei_dataset_id);
    // Assert
    expect(metric_result.status).toBe(200);
    expect(metric_result.data).toBeArray();
    expect(metric_result.data.length).toBeGreaterThan(0);
    expect(metric_result.data[0]).toContainAllKeys(['entity_type', 'total_entity_count', 'overall_quality_metric', 'metric_details']);
    axios.interceptors.request.eject(tagQualityInterceptor);
  }, 30000);

  it('API-Key | Authenticated ,When request made with edge, node tags, expect to return quality metric', async () => {
    // Arrange
    let oswAPI = new OSWApi(apiKeyConfiguration);
    let tagMetricToUpload = Utility.getOSWTagMetricBlob();
    let tdei_dataset_id = uploadedDatasetId;
    // Action
    const tagQualityInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => tagQualityRequestInterceptor(req, tdei_dataset_id, 'tag-quality.json'))
    const metric_result = await oswAPI.qualityMetricTagForm(tagMetricToUpload, tdei_dataset_id);
    // Assert
    expect(metric_result.status).toBe(200);
    expect(metric_result.data).toBeArray();
    expect(metric_result.data.length).toBeGreaterThan(0);
    expect(metric_result.data[0]).toContainAllKeys(['entity_type', 'total_entity_count', 'overall_quality_metric', 'metric_details']);
    axios.interceptors.request.eject(tagQualityInterceptor);
  }, 30000);

  it('Admin | Authenticated ,When request made with SQL Injection command, expect to return quality metric', async () => {
    // Arrange
    let oswAPI = new OSWApi(adminConfiguration);
    let tagMetricToUpload = Utility.getOSWTagMetricSQLInjEntityBlob();
    let tdei_dataset_id = uploadedDatasetId;
    // Action
    const tagQualityInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => tagQualityRequestInterceptor(req, tdei_dataset_id, 'tag-quality.json'))
    // Assert
    await expect(oswAPI.qualityMetricTagForm(tagMetricToUpload, tdei_dataset_id)).rejects.toMatchObject({ response: { status: 400 } });
    axios.interceptors.request.eject(tagQualityInterceptor);
  }, 30000);

  it('POC | authenticated, When request made with invalid dataset, should respond with dataset not found error', async () => {

    // Arrange
    let oswAPI = new OSWApi(pocConfiguration);
    let tagMetricToUpload = Utility.getOSWTagMetricEmptyBlob();
    // Action
    const tagQualityInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => tagQualityRequestInterceptor(req, "invalid_tdei_dataset_id", 'tag-quality.json'))
    // Assert
    await expect(oswAPI.qualityMetricTagForm(tagMetricToUpload, "invalid_tdei_dataset_id")).rejects.toMatchObject({ response: { status: 404 } });
    axios.interceptors.request.eject(tagQualityInterceptor);
  }, 30000);

  it('POC | authenticated, When request made with empty file, should respond with invalid request', async () => {

    // Arrange
    let oswAPI = new OSWApi(pocConfiguration);
    let tagMetricToUpload = Utility.getOSWTagMetricEmptyBlob();
    let tdei_dataset_id = uploadedDatasetId;
    // Action
    const tagQualityInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => tagQualityRequestInterceptor(req, tdei_dataset_id, 'tag-quality.json'))
    // Assert
    await expect(oswAPI.qualityMetricTagForm(tagMetricToUpload, tdei_dataset_id)).rejects.toMatchObject({ response: { status: 400 } });
    axios.interceptors.request.eject(tagQualityInterceptor);
  }, 30000);

  it('POC | authenticated, When request made with invalid entity, should respond with invalid request', async () => {

    // Arrange
    let oswAPI = new OSWApi(pocConfiguration);
    let tagMetricToUpload = Utility.getOSWTagMetricInvalidEntityBlob();
    let tdei_dataset_id = uploadedDatasetId;
    // Action
    const tagQualityInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => tagQualityRequestInterceptor(req, tdei_dataset_id, 'tag-quality.json'))
    // Assert
    await expect(oswAPI.qualityMetricTagForm(tagMetricToUpload, tdei_dataset_id)).rejects.toMatchObject({ response: { status: 400 } });
    axios.interceptors.request.eject(tagQualityInterceptor);
  }, 30000);

  it('POC | authenticated, When request made with invalid tag, should respond with invalid request', async () => {

    // Arrange
    let oswAPI = new OSWApi(pocConfiguration);
    let tagMetricToUpload = Utility.getOSWTagMetricInvalidTagBlob();
    let tdei_dataset_id = uploadedDatasetId;
    // Action
    const tagQualityInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => tagQualityRequestInterceptor(req, tdei_dataset_id, 'tag-quality.json'))
    // Assert
    await expect(oswAPI.qualityMetricTagForm(tagMetricToUpload, tdei_dataset_id)).rejects.toMatchObject({ response: { status: 400 } });
    axios.interceptors.request.eject(tagQualityInterceptor);
  }, 30000);

  it('POC | un-authenticated, When request made with edge, node tags, should respond with unauthenticated request', async () => {

    // Arrange
    let oswAPI = new OSWApi(Utility.getPocConfiguration());
    let tagMetricToUpload = Utility.getOSWTagMetricBlob();
    let tdei_dataset_id = uploadedDatasetId;
    // Action
    const tagQualityInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => tagQualityRequestInterceptor(req, tdei_dataset_id, 'tag-quality.json'))
    // Assert
    await expect(oswAPI.qualityMetricTagForm(tagMetricToUpload, tdei_dataset_id)).rejects.toMatchObject({ response: { status: 401 } });
    axios.interceptors.request.eject(tagQualityInterceptor);
  }, 30000);
});

describe("Intersection Quality Metric", () => {
  it('Admin | Authenticated, When request made with a valid intersection polygon file, should accept request and return job id', async () => {
    // Arrange
    let oswAPI = new OSWApi(adminConfiguration);
    let intersectionPolygon = Utility.getOSWSubRegionBlob();
    let tdei_dataset_id = uploadedDatasetId;
    const intersectionQualityInterceptor = axios.interceptors.request.use(
      (req: InternalAxiosRequestConfig) => intersectionQualityRequestInterceptor(req, tdei_dataset_id, "intersection-polygon.geojson")
    );

    // Action
    const qualityMetricResult = await oswAPI.oswQualityCalculateForm(tdei_dataset_id, intersectionPolygon);

    // Assert
    qualityMetricJobId = expectAcceptedJobResponse(qualityMetricResult);
    axios.interceptors.request.eject(intersectionQualityInterceptor);
  }, 30000);

  it('POC | authenticated, When request made without intersection file, should accept request and return job id', async () => {
    // Arrange
    let oswAPI = new OSWApi(pocConfiguration);
    let tdei_dataset_id = uploadedDatasetId;
    const intersectionQualityInterceptor = axios.interceptors.request.use(
      (req: InternalAxiosRequestConfig) => intersectionQualityRequestInterceptor(req, tdei_dataset_id)
    );

    // Assert
    const qualityMetricResult = await oswAPI.oswQualityCalculateForm(tdei_dataset_id);
    let responseJobId = expectAcceptedJobResponse(qualityMetricResult);
    expect(responseJobId).toBeDefined();
    axios.interceptors.request.eject(intersectionQualityInterceptor);
  }, 30000);

  it('POC | un-authenticated, When request made with valid intersection polygon file, should respond with unauthenticated request', async () => {
    // Arrange
    let oswAPI = new OSWApi(Utility.getPocConfiguration());
    let intersectionPolygon = Utility.getOSWSubRegionBlob();
    let tdei_dataset_id = uploadedDatasetId;
    const intersectionQualityInterceptor = axios.interceptors.request.use(
      (req: InternalAxiosRequestConfig) => intersectionQualityRequestInterceptor(req, tdei_dataset_id, "intersection-polygon.geojson")
    );

    // Assert
    await expect(oswAPI.oswQualityCalculateForm(tdei_dataset_id, intersectionPolygon)).rejects.toMatchObject({ response: { status: 401 } });
    axios.interceptors.request.eject(intersectionQualityInterceptor);
  }, 30000);
});

describe('Check intersection quality metric request job completion status', () => {
  jest.retryTimes(3, { logErrorsBeforeRetry: true });
  it('Admin | Authenticated , When request made, should respond with job status', async () => {
    let generalAPI = new CommonAPIsApi(adminConfiguration);
    const { job } = await waitForJobTerminalState({
      api: generalAPI,
      projectGroupId: "",
      jobId: qualityMetricJobId,
      deadlineMs: 12 * 60 * 1000,
      terminalStatuses: ["COMPLETED", "FAILED"],
    });
    expect((job as any)?.job_id).toBeOneOf([`${qualityMetricJobId}`]);
    expect((job as any)?.status).toBe("COMPLETED");
  }, 12 * 60 * 1000 + EXTRA_TIMEOUT_MS);

  it('POC | Authenticated , When request made, should respond with job status', async () => {
    let generalAPI = new CommonAPIsApi(pocConfiguration);
    let uploadStatus = await generalAPI.listJobs(tdei_project_group_id, qualityMetricJobId, true);
    expect(uploadStatus.status).toBe(200);
  }, 25000);

  it('Admin | un-authenticated , When request made, should respond with unauthenticated request', async () => {
    let generalAPI = new CommonAPIsApi(Utility.getAdminConfiguration());
    let qualityMetricStatusResponse = generalAPI.listJobs("", qualityMetricJobId, true);
    await expect(qualityMetricStatusResponse).rejects.toMatchObject({ response: { status: 401 } });
  });
});

let datasetViewerFeedbackId: number | null = null;

describe("Dataset Viewer Preferences", () => {
  it('Admin | Authenticated, When request made to allow viewer access, should update preferences successfully', async () => {
    let oswAPI = new OSWApi(adminConfiguration);
    let tdei_dataset_id = uploadedDatasetId;

    const resp = await oswAPI.oswDatasetViewer({ allow_viewer_access: true }, tdei_dataset_id);
    expect(resp.status).toBe(200);
    expect(resp.data).toBeDefined();
  }, 30000);

  it('POC | Authenticated, When request made to allow viewer access, should update preferences successfully', async () => {
    let oswAPI = new OSWApi(pocConfiguration);
    let tdei_dataset_id = uploadedDatasetId;

    const resp = await oswAPI.oswDatasetViewer({ allow_viewer_access: true }, tdei_dataset_id);
    expect(resp.status).toBe(200);
    expect(resp.data).toBeDefined();
  }, 30000);

  it('Admin | Authenticated, When request made with invalid dataset id, should respond with dataset not found error', async () => {
    let oswAPI = new OSWApi(adminConfiguration);
    await expect(oswAPI.oswDatasetViewer({ allow_viewer_access: true }, "invalid_tdei_dataset_id")).rejects.toMatchObject({ response: { status: 404 } });
  }, 30000);

  it('Admin | un-authenticated, When request made, should respond with unauthenticated request', async () => {
    let oswAPI = new OSWApi(Utility.getAdminConfiguration());
    let tdei_dataset_id = uploadedDatasetId;
    await expect(oswAPI.oswDatasetViewer({ allow_viewer_access: true }, tdei_dataset_id)).rejects.toMatchObject({ response: { status: 401 } });
  }, 30000);
});

describe("Dataset Viewer PM Tiles", () => {
  it('Admin | Authenticated, When request made, should return PM tiles SAS url', async () => {
    let oswAPI = new OSWApi(adminConfiguration);
    let tdei_dataset_id = seedData.datasets.osw.published_dataset;

    const resp = await oswAPI.oswDatasetViewerPMTiles(tdei_dataset_id);
    expect(resp.status).toBe(200);
    expect(resp.data).toBeString();
    expect(resp.data.length).toBeGreaterThan(0);
  }, 30000);

  it('Admin | un-authenticated, When request made, should respond with unauthenticated request', async () => {
    let oswAPI = new OSWApi(Utility.getAdminConfiguration());
    let tdei_dataset_id = seedData.datasets.osw.published_dataset;
    await expect(oswAPI.oswDatasetViewerPMTiles(tdei_dataset_id)).rejects.toMatchObject({ response: { status: 401 } });
  }, 30000);
});

describe("Dataset Viewer Feedback Submit", () => {
  it('POC | Authenticated, When request made to submit feedback, should return feedback id', async () => {
    let oswAPI = new OSWApi(pocConfiguration);
    let tdei_dataset_id = uploadedDatasetId;

    const feedbackBody = {
      dataset_element_id: "14325",
      feedback_text: "API tester feedback: dataset-viewer looks good.",
      customer_email: seedData.users.poc.username,
      location_latitude: 47.6062,
      location_longitude: -122.3321,
    };

    const resp = await oswAPI.oswDatasetViewerFeedback(feedbackBody, tdei_project_group_id, tdei_dataset_id);
    expect(resp.status).toBe(200);
    expect(resp.data).toBeNumber();
    datasetViewerFeedbackId = resp.data as number;
    console.log("datasetViewerFeedbackId : ", datasetViewerFeedbackId);
  }, 30000);

  it('POC | Authenticated, When request made with invalid dataset id, should respond with not found', async () => {
    let oswAPI = new OSWApi(pocConfiguration);
    const feedbackBody = {
      dataset_element_id: "14325",
      feedback_text: "invalid dataset id feedback",
      customer_email: seedData.users.poc.username,
      location_latitude: 47.6062,
      location_longitude: -122.3321,
    };
    await expect(oswAPI.oswDatasetViewerFeedback(feedbackBody, tdei_project_group_id, "invalid_tdei_dataset_id")).rejects.toMatchObject({ response: { status: 404 } });
  }, 30000);
});

describe("Dataset Viewer Feedback Status Update", () => {
  it('POC | Authenticated, When request made to update feedback status, should return per-item update results', async () => {
    let oswAPI = new OSWApi(pocConfiguration);
    let tdei_dataset_id = uploadedDatasetId;
    if (datasetViewerFeedbackId == null) {
      throw new Error("Missing feedback id from prior test");
    }

    const updateBody: ProjectIdTdeiDatasetIdBody[] = [
      {
        id: datasetViewerFeedbackId,
        status: ProjectIdTdeiDatasetIdBodyStatusEnum.Resolved,
        resolution_status: ProjectIdTdeiDatasetIdBodyResolutionStatusEnum.Fixed,
        resolution_description: "Verified and resolved via api tester.",
      },
    ];

    const resp = await oswAPI.oswDatasetViewerFeedbackStatusUpdate(updateBody, tdei_project_group_id, tdei_dataset_id);
    expect(resp.status).toBe(200);
    expect(resp.data).toBeArray();
    expect(resp.data.length).toBeGreaterThan(0);
    expect(resp.data[0]).toContainAllKeys(["id", "message", "status"]);
  }, 30000);
});

describe("Dataset Viewer Feedbacks List", () => {
  it('Admin | Authenticated, When request made to list feedbacks, should return an array', async () => {
    let oswAPI = new OSWApi(adminConfiguration);
    const resp = await oswAPI.oswDatasetViewerFeedbacks(tdei_project_group_id, uploadedDatasetId);
    expect(resp.status).toBe(200);
    expect(resp.data).toBeArray();
  }, 30000);

  it('Admin | un-authenticated, When request made to list feedbacks, should respond with unauthenticated request', async () => {
    let oswAPI = new OSWApi(Utility.getAdminConfiguration());
    await expect(oswAPI.oswDatasetViewerFeedbacks(tdei_project_group_id, uploadedDatasetId)).rejects.toMatchObject({ response: { status: 401 } });
  }, 30000);
});

describe("Dataset Viewer Feedbacks Metadata", () => {
  it('Admin | Authenticated, When request made for feedback metadata, should return summary object', async () => {
    let oswAPI = new OSWApi(adminConfiguration);
    const resp = await oswAPI.oswDatasetViewerFeedbacksMetadata(tdei_project_group_id);
    expect(resp.status).toBe(200);
    expect(resp.data).toBeObject();
  }, 30000);
});

describe("Dataset Viewer Feedbacks Download", () => {
  it('POC | Authenticated, When request made to download feedbacks CSV, should stream csv response', async () => {
    let oswAPI = new OSWApi(pocConfiguration);
    const resp = await oswAPI.oswDatasetViewerFeedbacksDownload(tdei_project_group_id, uploadedDatasetId, NULL_PARAM, NULL_PARAM, NULL_PARAM, NULL_PARAM, NULL_PARAM, NULL_PARAM, 1);
    expect(resp.status).toBe(200);
    expect(resp.data).toBeDefined();
  }, 30000);
});

//This test should be ran at last as it will invalidate the uploaded file
describe('Invalidate the OSW file', () => {

  it('POC | Authenticated , When request made, should return true if successful', async () => {
    let generalAPI = new CommonAPIsApi(pocConfiguration);

    let downloadResponse = generalAPI.deleteDataset(uploadedDatasetId);

    expect((await downloadResponse).status).toBe(200);
  });

  it('POC | Authenticated , When request made with invalid dataset id, should return dataset not found error', async () => {
    let generalAPI = new CommonAPIsApi(pocConfiguration);

    let downloadResponse = generalAPI.deleteDataset('invalid_dataset_id');

    await expect(downloadResponse).rejects.toMatchObject({ response: { status: 404 } });
  });

  it('Admin | un-authenticated , When request made with dataset, should return with unauthenticated request', async () => {
    let generalAPI = new CommonAPIsApi(Utility.getAdminConfiguration());

    let downloadResponse = generalAPI.deleteDataset(uploadedDatasetId);

    await expect(downloadResponse).rejects.toMatchObject({ response: { status: 401 } });
  });
});


describe("Job List API", () => {

  it('Admin | Authenticated , When request made, expect to return job list', async () => {
    // Arrange
    let generalAPI = new CommonAPIsApi(adminConfiguration);
    // Action
    const list_result = await generalAPI.listJobs("", NULL_PARAM, true);

    // Assert
    expect(list_result.status).toBe(200);
    expect(list_result.data).not.toBeNull();
    expect(list_result.data).toBeArray();

    expect(list_result.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining(<JobDetails>{
          job_id: expect.any(String),
          download_url: expect.toBeNullOrString(),
          message: expect.toBeNullOrString(),
          status: expect.toBeOneOf(["COMPLETED", "IN-PROGRESS", "FAILED"]),
          job_type: expect.any(String),
          tdei_project_group_id: expect.toBeNullOrString(),
          tdei_project_group_name: expect.toBeNullOrString(),
          requested_by: expect.any(String),
          request_input: expect.any(Object),
          response_props: expect.any(Object),
          created_at: expect.any(String),
          updated_at: expect.any(String),
          data_type: expect.any(String),
          current_stage: expect.any(String),
          progress: expect.objectContaining({
            total_stages: expect.any(Number),
            current_stage: expect.any(String),
            completed_stages: expect.any(Number),
            last_updated_at: expect.any(String),
            current_state: expect.toBeOneOf(["COMPLETED", "IN-PROGRESS", "FAILED", "RUNNING"]),
            current_stage_percent_done: expect.any(Number)
          })
        })
      ])
    );
  }, 30000);

  it('POC | Authenticated , When request made, expect to return job list', async () => {
    // Arrange
    let generalAPI = new CommonAPIsApi(pocConfiguration);
    // Action
    const list_result = await generalAPI.listJobs(tdei_project_group_id, NULL_PARAM, true);

    // Assert
    expect(list_result.status).toBe(200);
    expect(list_result.data).not.toBeNull();
    expect(list_result.data).toBeArray();

    expect(list_result.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining(<JobDetails>{
          job_id: expect.any(String),
          download_url: expect.toBeNullOrString(),
          message: expect.toBeNullOrString(),
          status: expect.toBeOneOf(["COMPLETED", "IN-PROGRESS", "FAILED"]),
          job_type: expect.any(String),
          tdei_project_group_id: expect.toBeNullOrString(),
          tdei_project_group_name: expect.toBeNullOrString(),
          requested_by: expect.any(String),
          request_input: expect.any(Object),
          response_props: expect.any(Object),
          created_at: expect.any(String),
          updated_at: expect.any(String),
          data_type: expect.any(String),
          current_stage: expect.any(String),
          progress: expect.objectContaining({
            total_stages: expect.any(Number),
            current_stage: expect.any(String),
            completed_stages: expect.any(Number),
            last_updated_at: expect.any(String),
            current_state: expect.toBeOneOf(["COMPLETED", "IN-PROGRESS", "FAILED", "RUNNING"]),
            current_stage_percent_done: expect.any(Number)
          })
        })
      ])
    );
  }, 30000);

  it('Flex Data Generator | Authenticated , When request made, expect to return job list', async () => {
    // Arrange
    let generalAPI = new CommonAPIsApi(flexDgConfiguration);
    // Action
    const list_result = await generalAPI.listJobs(tdei_project_group_id, NULL_PARAM, true);

    // Assert
    expect(list_result.status).toBe(200);
    expect(list_result.data).not.toBeNull();
    expect(list_result.data).toBeArray();

    expect(list_result.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining(<JobDetails>{
          job_id: expect.any(String),
          download_url: expect.toBeNullOrString(),
          message: expect.toBeNullOrString(),
          status: expect.toBeOneOf(["COMPLETED", "IN-PROGRESS", "FAILED"]),
          job_type: expect.any(String),
          tdei_project_group_id: expect.toBeNullOrString(),
          tdei_project_group_name: expect.toBeNullOrString(),
          requested_by: expect.any(String),
          request_input: expect.any(Object),
          response_props: expect.any(Object),
          created_at: expect.any(String),
          updated_at: expect.any(String),
          data_type: expect.any(String),
          current_stage: expect.any(String),
          progress: expect.objectContaining({
            total_stages: expect.any(Number),
            current_stage: expect.any(String),
            completed_stages: expect.any(Number),
            last_updated_at: expect.any(String),
            current_state: expect.toBeOneOf(["COMPLETED", "IN-PROGRESS", "FAILED", "RUNNING"]),
            current_stage_percent_done: expect.any(Number)
          })
        })
      ])
    );
  }, 30000);

  it('OSW Data Generator | Authenticated , When request made, expect to return job list', async () => {
    // Arrange
    let generalAPI = new CommonAPIsApi(dgConfiguration);
    // Action
    const list_result = await generalAPI.listJobs(tdei_project_group_id, NULL_PARAM, true);

    // Assert
    expect(list_result.status).toBe(200);
    expect(list_result.data).not.toBeNull();
    expect(list_result.data).toBeArray();

    expect(list_result.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining(<JobDetails>{
          job_id: expect.any(String),
          download_url: expect.toBeNullOrString(),
          message: expect.toBeNullOrString(),
          status: expect.toBeOneOf(["COMPLETED", "IN-PROGRESS", "FAILED"]),
          job_type: expect.any(String),
          tdei_project_group_id: expect.toBeNullOrString(),
          tdei_project_group_name: expect.toBeNullOrString(),
          requested_by: expect.any(String),
          request_input: expect.any(Object),
          response_props: expect.any(Object),
          created_at: expect.any(String),
          updated_at: expect.any(String),
          data_type: expect.any(String),
          current_stage: expect.any(String),
          progress: expect.objectContaining({
            total_stages: expect.any(Number),
            current_stage: expect.any(String),
            completed_stages: expect.any(Number),
            last_updated_at: expect.any(String),
            current_state: expect.toBeOneOf(["COMPLETED", "IN-PROGRESS", "FAILED", "RUNNING"]),
            current_stage_percent_done: expect.any(Number)
          })
        })
      ])
    );
  }, 30000);

  it('Pathways Data Generator | Authenticated , When request made, expect to return job list', async () => {
    // Arrange
    let generalAPI = new CommonAPIsApi(pathwaysDgConfiguration);
    // Action
    const list_result = await generalAPI.listJobs(tdei_project_group_id, NULL_PARAM, true);

    // Assert
    expect(list_result.status).toBe(200);
    expect(list_result.data).not.toBeNull();
    expect(list_result.data).toBeArray();

    expect(list_result.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining(<JobDetails>{
          job_id: expect.any(String),
          download_url: expect.toBeNullOrString(),
          message: expect.toBeNullOrString(),
          status: expect.toBeOneOf(["COMPLETED", "IN-PROGRESS", "FAILED"]),
          job_type: expect.any(String),
          tdei_project_group_id: expect.toBeNullOrString(),
          tdei_project_group_name: expect.toBeNullOrString(),
          requested_by: expect.any(String),
          request_input: expect.any(Object),
          response_props: expect.any(Object),
          created_at: expect.any(String),
          updated_at: expect.any(String),
          data_type: expect.any(String),
          current_stage: expect.any(String),
          progress: expect.objectContaining({
            total_stages: expect.any(Number),
            current_stage: expect.any(String),
            completed_stages: expect.any(Number),
            last_updated_at: expect.any(String),
            current_state: expect.toBeOneOf(["COMPLETED", "IN-PROGRESS", "FAILED", "RUNNING"]),
            current_stage_percent_done: expect.any(Number)
          })
        })
      ])
    );
  }, 30000);

  it('Admin | Authenticated , When request made with Job type filter `ConfidenceCalculate`, expect to return job list with filter job type', async () => {
    // Arrange
    let generalAPI = new CommonAPIsApi(adminConfiguration);
    // Action
    const list_result = await generalAPI.listJobs("", NULL_PARAM, true, JobDetailsJobTypeEnum.ConfidenceCalculate);

    // Assert
    expect(list_result.status).toBe(200);
    expect(list_result.data).not.toBeNull();
    expect(list_result.data).toBeArray();

    expect(list_result.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining(<JobDetails>{
          job_id: expect.any(String),
          download_url: expect.toBeNullOrString(),
          message: expect.toBeNullOrString(),
          status: expect.toBeOneOf(["COMPLETED", "IN-PROGRESS", "FAILED"]),
          job_type: expect.stringContaining(JobDetailsJobTypeEnum.ConfidenceCalculate),
          tdei_project_group_id: expect.toBeNullOrString(),
          tdei_project_group_name: expect.toBeNullOrString(),
          requested_by: expect.any(String),
          request_input: expect.any(Object),
          response_props: expect.any(Object),
          created_at: expect.any(String),
          updated_at: expect.any(String),
          data_type: expect.any(String),
          current_stage: expect.any(String),
          progress: expect.objectContaining({
            total_stages: expect.any(Number),
            current_stage: expect.any(String),
            completed_stages: expect.any(Number),
            last_updated_at: expect.any(String),
            current_state: expect.toBeOneOf(["COMPLETED", "IN-PROGRESS", "FAILED", "RUNNING"]),
            current_stage_percent_done: expect.any(Number)
          })
        })
      ])
    );
  }, 30000);

  it('Admin | Authenticated , When request made with Job type filter `DatasetUpload`, expect to return job list with filter job type', async () => {
    // Arrange
    let generalAPI = new CommonAPIsApi(adminConfiguration);
    // Action
    const list_result = await generalAPI.listJobs("", NULL_PARAM, true, JobDetailsJobTypeEnum.DatasetUpload);

    // Assert
    expect(list_result.status).toBe(200);
    expect(list_result.data).not.toBeNull();
    expect(list_result.data).toBeArray();

    expect(list_result.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining(<JobDetails>{
          job_id: expect.any(String),
          download_url: expect.toBeNullOrString(),
          message: expect.toBeNullOrString(),
          status: expect.toBeOneOf(["COMPLETED", "IN-PROGRESS", "FAILED"]),
          job_type: expect.stringContaining(JobDetailsJobTypeEnum.DatasetUpload),
          tdei_project_group_id: expect.toBeNullOrString(),
          tdei_project_group_name: expect.toBeNullOrString(),
          requested_by: expect.any(String),
          request_input: expect.any(Object),
          response_props: expect.any(Object),
          created_at: expect.any(String),
          updated_at: expect.any(String),
          data_type: expect.any(String),
          current_stage: expect.any(String),
          progress: expect.objectContaining({
            total_stages: expect.any(Number),
            current_stage: expect.any(String),
            completed_stages: expect.any(Number),
            last_updated_at: expect.any(String),
            current_state: expect.toBeOneOf(["COMPLETED", "IN-PROGRESS", "FAILED", "RUNNING"]),
            current_stage_percent_done: expect.any(Number)
          })
        })
      ])
    );
  }, 30000);

  it('Admin | Authenticated , When request made with Job type filter `DatasetPublish`, expect to return job list with filter job type', async () => {
    // Arrange
    let generalAPI = new CommonAPIsApi(adminConfiguration);
    // Action
    const list_result = await generalAPI.listJobs("", NULL_PARAM, true, JobDetailsJobTypeEnum.DatasetPublish);

    // Assert
    expect(list_result.status).toBe(200);
    expect(list_result.data).not.toBeNull();
    expect(list_result.data).toBeArray();

    expect(list_result.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining(<JobDetails>{
          job_id: expect.any(String),
          download_url: expect.toBeNullOrString(),
          message: expect.toBeNullOrString(),
          status: expect.toBeOneOf(["COMPLETED", "IN-PROGRESS", "FAILED"]),
          job_type: expect.stringContaining(JobDetailsJobTypeEnum.DatasetPublish),
          tdei_project_group_id: expect.toBeNullOrString(),
          tdei_project_group_name: expect.toBeNullOrString(),
          requested_by: expect.any(String),
          request_input: expect.any(Object),
          response_props: expect.any(Object),
          created_at: expect.any(String),
          updated_at: expect.any(String),
          data_type: expect.any(String),
          current_stage: expect.any(String),
          progress: expect.objectContaining({
            total_stages: expect.any(Number),
            current_stage: expect.any(String),
            completed_stages: expect.any(Number),
            last_updated_at: expect.any(String),
            current_state: expect.toBeOneOf(["COMPLETED", "IN-PROGRESS", "FAILED", "RUNNING"]),
            current_stage_percent_done: expect.any(Number)
          })
        })
      ])
    );
  }, 30000);

  it('Admin | Authenticated , When request made with Job type filter `DatasetSpatialJoin`, expect to return job list with filter job type', async () => {
    // Arrange
    let generalAPI = new CommonAPIsApi(adminConfiguration);
    // Action
    const list_result = await generalAPI.listJobs("", NULL_PARAM, true, JobDetailsJobTypeEnum.DatasetSpatialJoin);

    // Assert
    expect(list_result.status).toBe(200);
    expect(list_result.data).not.toBeNull();
    expect(list_result.data).toBeArray();

    expect(list_result.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining(<JobDetails>{
          job_id: expect.any(String),
          download_url: expect.toBeNullOrString(),
          message: expect.toBeNullOrString(),
          status: expect.toBeOneOf(["COMPLETED", "IN-PROGRESS", "FAILED"]),
          job_type: expect.stringContaining(JobDetailsJobTypeEnum.DatasetSpatialJoin),
          tdei_project_group_id: expect.toBeNullOrString(),
          tdei_project_group_name: expect.toBeNullOrString(),
          requested_by: expect.any(String),
          request_input: expect.any(Object),
          response_props: expect.any(Object),
          created_at: expect.any(String),
          updated_at: expect.any(String),
          data_type: expect.any(String),
          current_stage: expect.any(String),
          progress: expect.objectContaining({
            total_stages: expect.any(Number),
            current_stage: expect.any(String),
            completed_stages: expect.any(Number),
            last_updated_at: expect.any(String),
            current_state: expect.toBeOneOf(["COMPLETED", "IN-PROGRESS", "FAILED", "RUNNING"]),
            current_stage_percent_done: expect.any(Number)
          })
        })
      ])
    );
  }, 30000);

  it('Admin | Authenticated , When request made with Job type filter `DatasetReformat`, expect to return job list with filter job type', async () => {
    // Arrange
    let generalAPI = new CommonAPIsApi(adminConfiguration);
    // Action
    const list_result = await generalAPI.listJobs("", NULL_PARAM, true, JobDetailsJobTypeEnum.DatasetReformat);

    // Assert
    expect(list_result.status).toBe(200);
    expect(list_result.data).not.toBeNull();
    expect(list_result.data).toBeArray();

    expect(list_result.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining(<JobDetails>{
          job_id: expect.any(String),
          download_url: expect.toBeNullOrString(),
          message: expect.toBeNullOrString(),
          status: expect.toBeOneOf(["COMPLETED", "IN-PROGRESS", "FAILED"]),
          job_type: expect.stringContaining(JobDetailsJobTypeEnum.DatasetReformat),
          tdei_project_group_id: expect.toBeNullOrString(),
          tdei_project_group_name: expect.toBeNullOrString(),
          requested_by: expect.any(String),
          request_input: expect.any(Object),
          response_props: expect.any(Object),
          created_at: expect.any(String),
          updated_at: expect.any(String),
          data_type: expect.any(String),
          current_stage: expect.any(String),
          progress: expect.objectContaining({
            total_stages: expect.any(Number),
            current_stage: expect.any(String),
            completed_stages: expect.any(Number),
            last_updated_at: expect.any(String),
            current_state: expect.toBeOneOf(["COMPLETED", "IN-PROGRESS", "FAILED", "RUNNING"]),
            current_stage_percent_done: expect.any(Number)
          })
        })
      ])
    );
  }, 30000);

  it('Admin | Authenticated , When request made with Job type filter `DatasetValidate`, expect to return job list with filter job type', async () => {
    // Arrange
    let generalAPI = new CommonAPIsApi(adminConfiguration);
    // Action
    const list_result = await generalAPI.listJobs("", NULL_PARAM, true, JobDetailsJobTypeEnum.DatasetValidate);

    // Assert
    expect(list_result.status).toBe(200);
    expect(list_result.data).not.toBeNull();
    expect(list_result.data).toBeArray();

    expect(list_result.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining(<JobDetails>{
          job_id: expect.any(String),
          download_url: expect.toBeNullOrString(),
          message: expect.toBeNullOrString(),
          status: expect.toBeOneOf(["COMPLETED", "IN-PROGRESS", "FAILED"]),
          job_type: expect.stringContaining(JobDetailsJobTypeEnum.DatasetValidate),
          tdei_project_group_id: expect.toBeNullOrString(),
          tdei_project_group_name: expect.toBeNullOrString(),
          requested_by: expect.any(String),
          request_input: expect.any(Object),
          response_props: expect.any(Object),
          created_at: expect.any(String),
          updated_at: expect.any(String),
          data_type: expect.any(String),
          current_stage: expect.any(String),
          progress: expect.objectContaining({
            total_stages: expect.any(Number),
            current_stage: expect.any(String),
            completed_stages: expect.any(Number),
            last_updated_at: expect.any(String),
            current_state: expect.toBeOneOf(["COMPLETED", "IN-PROGRESS", "FAILED", "RUNNING"]),
            current_stage_percent_done: expect.any(Number)
          })
        })
      ])
    );
  }, 30000);

  it('Admin | Authenticated , When request made with Job type filter `DatasetInclineTag`, expect to return job list with filter job type', async () => {
    // Arrange
    let generalAPI = new CommonAPIsApi(adminConfiguration);
    // Action
    const list_result = await generalAPI.listJobs("", NULL_PARAM, true, JobDetailsJobTypeEnum.DatasetInclineTag);

    // Assert
    expect(list_result.status).toBe(200);
    expect(list_result.data).not.toBeNull();
    expect(list_result.data).toBeArray();

    expect(list_result.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining(<JobDetails>{
          job_id: expect.any(String),
          download_url: expect.toBeNullOrString(),
          message: expect.toBeNullOrString(),
          status: expect.toBeOneOf(["COMPLETED", "IN-PROGRESS", "FAILED"]),
          job_type: expect.stringContaining(JobDetailsJobTypeEnum.DatasetInclineTag),
          tdei_project_group_id: expect.toBeNullOrString(),
          tdei_project_group_name: expect.toBeNullOrString(),
          requested_by: expect.any(String),
          request_input: expect.any(Object),
          response_props: expect.any(Object),
          created_at: expect.any(String),
          updated_at: expect.any(String),
          data_type: expect.any(String),
          current_stage: expect.any(String),
          progress: expect.objectContaining({
            total_stages: expect.any(Number),
            current_stage: expect.any(String),
            completed_stages: expect.any(Number),
            last_updated_at: expect.any(String),
            current_state: expect.toBeOneOf(["COMPLETED", "IN-PROGRESS", "FAILED", "RUNNING"]),
            current_stage_percent_done: expect.any(Number)
          })
        })
      ])
    );
  }, 30000);

  it('Admin | Authenticated , When request made with Job type filter `DatasetRoadTag`, expect to return job list with filter job type', async () => {
    // Arrange
    let generalAPI = new CommonAPIsApi(adminConfiguration);
    // Action
    const list_result = await generalAPI.listJobs("", NULL_PARAM, true, JobDetailsJobTypeEnum.DatasetRoadTag);

    // Assert
    expect(list_result.status).toBe(200);
    expect(list_result.data).not.toBeNull();
    expect(list_result.data).toBeArray();

    expect(list_result.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining(<JobDetails>{
          job_id: expect.any(String),
          download_url: expect.toBeNullOrString(),
          message: expect.toBeNullOrString(),
          status: expect.toBeOneOf(["COMPLETED", "IN-PROGRESS", "FAILED"]),
          job_type: expect.stringContaining(JobDetailsJobTypeEnum.DatasetRoadTag),
          tdei_project_group_id: expect.toBeNullOrString(),
          tdei_project_group_name: expect.toBeNullOrString(),
          requested_by: expect.any(String),
          request_input: expect.any(Object),
          response_props: expect.any(Object),
          created_at: expect.any(String),
          updated_at: expect.any(String),
          data_type: expect.any(String),
          current_stage: expect.any(String),
          progress: expect.objectContaining({
            total_stages: expect.any(Number),
            current_stage: expect.any(String),
            completed_stages: expect.any(Number),
            last_updated_at: expect.any(String),
            current_state: expect.toBeOneOf(["COMPLETED", "IN-PROGRESS", "FAILED", "RUNNING"]),
            current_stage_percent_done: expect.any(Number)
          })
        })
      ])
    );
  }, 30000);

  it('Admin | Authenticated , When request made with Job type filter `DatasetUnion`, expect to return job list with filter job type', async () => {
    // Arrange
    let generalAPI = new CommonAPIsApi(adminConfiguration);
    // Action
    const list_result = await generalAPI.listJobs("", NULL_PARAM, true, JobDetailsJobTypeEnum.DatasetUnion);

    // Assert
    expect(list_result.status).toBe(200);
    expect(list_result.data).not.toBeNull();
    expect(list_result.data).toBeArray();

    expect(list_result.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining(<JobDetails>{
          job_id: expect.any(String),
          download_url: expect.toBeNullOrString(),
          message: expect.toBeNullOrString(),
          status: expect.toBeOneOf(["COMPLETED", "IN-PROGRESS", "FAILED"]),
          job_type: expect.stringContaining(JobDetailsJobTypeEnum.DatasetUnion),
          tdei_project_group_id: expect.toBeNullOrString(),
          tdei_project_group_name: expect.toBeNullOrString(),
          requested_by: expect.any(String),
          request_input: expect.any(Object),
          response_props: expect.any(Object),
          created_at: expect.any(String),
          updated_at: expect.any(String),
          data_type: expect.any(String),
          current_stage: expect.any(String),
          progress: expect.objectContaining({
            total_stages: expect.any(Number),
            current_stage: expect.any(String),
            completed_stages: expect.any(Number),
            last_updated_at: expect.any(String),
            current_state: expect.toBeOneOf(["COMPLETED", "IN-PROGRESS", "FAILED", "RUNNING"]),
            current_stage_percent_done: expect.any(Number)
          })
        })
      ])
    );
  }, 30000);

  it('Admin | Authenticated , When request made with Job type filter `DatasetBBox`, expect to return job list with filter job type', async () => {
    // Arrange
    let generalAPI = new CommonAPIsApi(adminConfiguration);
    // Action
    const list_result = await generalAPI.listJobs("", NULL_PARAM, true, JobDetailsJobTypeEnum.DatasetBBox);

    // Assert
    expect(list_result.status).toBe(200);
    expect(list_result.data).not.toBeNull();
    expect(list_result.data).toBeArray();

    expect(list_result.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining(<JobDetails>{
          job_id: expect.any(String),
          download_url: expect.toBeNullOrString(),
          message: expect.toBeNullOrString(),
          status: expect.toBeOneOf(["COMPLETED", "IN-PROGRESS", "FAILED"]),
          job_type: expect.stringContaining(JobDetailsJobTypeEnum.DatasetBBox),
          tdei_project_group_id: expect.toBeNullOrString(),
          tdei_project_group_name: expect.toBeNullOrString(),
          requested_by: expect.any(String),
          request_input: expect.any(Object),
          response_props: expect.any(Object),
          created_at: expect.any(String),
          updated_at: expect.any(String),
          data_type: expect.any(String),
          current_stage: expect.any(String),
          progress: expect.objectContaining({
            total_stages: expect.any(Number),
            current_stage: expect.any(String),
            completed_stages: expect.any(Number),
            last_updated_at: expect.any(String),
            current_state: expect.toBeOneOf(["COMPLETED", "IN-PROGRESS", "FAILED", "RUNNING"]),
            current_stage_percent_done: expect.any(Number)
          })
        })
      ])
    );
  }, 30000);

  it('Admin | Authenticated , When request made with Status `COMPLETED`, expect to return job list with COMPLETED status', async () => {
    // Arrange
    let generalAPI = new CommonAPIsApi(adminConfiguration);
    // Action
    const list_result = await generalAPI.listJobs("", NULL_PARAM, true, NULL_PARAM, JobDetailsStatusEnum.COMPLETED);

    // Assert
    expect(list_result.status).toBe(200);
    expect(list_result.data).not.toBeNull();
    expect(list_result.data).toBeArray();

    expect(list_result.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining(<JobDetails>{
          job_id: expect.any(String),
          download_url: expect.toBeNullOrString(),
          message: expect.toBeNullOrString(),
          status: expect.stringContaining(JobDetailsStatusEnum.COMPLETED),
          job_type: expect.any(String),
          tdei_project_group_id: expect.toBeNullOrString(),
          tdei_project_group_name: expect.toBeNullOrString(),
          requested_by: expect.any(String),
          request_input: expect.any(Object),
          response_props: expect.any(Object),
          created_at: expect.any(String),
          updated_at: expect.any(String),
          data_type: expect.any(String),
          current_stage: expect.any(String),
          progress: expect.objectContaining({
            total_stages: expect.any(Number),
            current_stage: expect.any(String),
            completed_stages: expect.any(Number),
            last_updated_at: expect.any(String),
            current_state: expect.toBeOneOf(["COMPLETED", "IN-PROGRESS", "FAILED", "RUNNING"]),
            current_stage_percent_done: expect.any(Number)
          })
        })
      ])
    );
  }, 30000);

  it('Admin | Authenticated , When request made with Status `INPROGRESS`, expect to return job list with INPROGRESS status', async () => {
    // Arrange
    let generalAPI = new CommonAPIsApi(adminConfiguration);
    // Action
    const list_result = await generalAPI.listJobs("", NULL_PARAM, true, NULL_PARAM, JobDetailsStatusEnum.INPROGRESS);

    // Assert
    expect(list_result.status).toBe(200);
    expect(list_result.data).not.toBeNull();
    expect(list_result.data).toBeArray();
    if (list_result.data.length > 0) {
      expect(list_result.data).toEqual(
        expect.arrayContaining([
          expect.objectContaining(<JobDetails>{
            job_id: expect.any(String),
            download_url: expect.toBeNullOrString(),
            message: expect.toBeNullOrString(),
            status: expect.stringContaining(JobDetailsStatusEnum.INPROGRESS),
            job_type: expect.any(String),
            tdei_project_group_id: expect.toBeNullOrString(),
            tdei_project_group_name: expect.toBeNullOrString(),
            requested_by: expect.any(String),
            request_input: expect.any(Object),
            response_props: expect.any(Object),
            created_at: expect.any(String),
            updated_at: expect.any(String),
            data_type: expect.any(String),
            current_stage: expect.any(String),
            progress: expect.objectContaining({
              total_stages: expect.any(Number),
              current_stage: expect.any(String),
              completed_stages: expect.any(Number),
              last_updated_at: expect.any(String),
              current_state: expect.toBeOneOf(["COMPLETED", "IN-PROGRESS", "FAILED", "RUNNING"]),
              current_stage_percent_done: expect.any(Number)
            })
          })
        ])
      );
    }
  }, 30000);

  it('Admin | Authenticated , When request made with Status `FAILED`, expect to return job list with FAILED status', async () => {
    // Arrange
    let generalAPI = new CommonAPIsApi(adminConfiguration);
    // Action
    const list_result = await generalAPI.listJobs("", NULL_PARAM, true, NULL_PARAM, JobDetailsStatusEnum.FAILED);

    // Assert
    expect(list_result.status).toBe(200);
    expect(list_result.data).not.toBeNull();
    expect(list_result.data).toBeArray();
    if (list_result.data.length > 0) {
      expect(list_result.data).toEqual(
        expect.arrayContaining([
          expect.objectContaining(<JobDetails>{
            job_id: expect.any(String),
            download_url: expect.toBeNullOrString(),
            message: expect.toBeNullOrString(),
            status: expect.stringContaining(JobDetailsStatusEnum.FAILED),
            job_type: expect.any(String),
            tdei_project_group_id: expect.toBeNullOrString(),
            tdei_project_group_name: expect.toBeNullOrString(),
            requested_by: expect.any(String),
            request_input: expect.any(Object),
            response_props: expect.any(Object),
            created_at: expect.any(String),
            updated_at: expect.any(String),
            data_type: expect.any(String),
            current_stage: expect.any(String),
            progress: expect.objectContaining({
              total_stages: expect.any(Number),
              current_stage: expect.any(String),
              completed_stages: expect.any(Number),
              last_updated_at: expect.any(String),
              current_state: expect.toBeOneOf(["COMPLETED", "IN-PROGRESS", "FAILED", "RUNNING"]),
              current_stage_percent_done: expect.any(Number)
            })
          })
        ])
      );
    }
  }, 30000);

  it('Admin | Authenticated , When request made with invalid job id, should return job id not found error', async () => {
    let generalAPI = new CommonAPIsApi(adminConfiguration);

    let jobResponse = generalAPI.listJobs("", "000", true);

    await expect(jobResponse).rejects.toMatchObject({ response: { status: 404 } });
  });

  it('Admin | Authenticated , When request made with invalid project group id, should return project group id not found error', async () => {
    let generalAPI = new CommonAPIsApi(adminConfiguration);

    let jobResponse = generalAPI.listJobs("project_group_id", NULL_PARAM, true);

    await expect(jobResponse).rejects.toMatchObject({ response: { status: 404 } });
  });
});

describe("Job Download API", () => {
  it('Admin | un-authenticated , When request made with invalid job id, should return job id not found error', async () => {
    let generalAPI = new CommonAPIsApi(adminConfiguration);

    let response = generalAPI.jobDownload("000", { responseType: 'arraybuffer' });

    await expect(response).rejects.toMatchObject({ response: { status: 404 } });
  });

  it('Admin | un-authenticated , When request made with job id, should return unauthenticated error', async () => {
    let generalAPI = new CommonAPIsApi(Utility.getAdminConfiguration());

    let response = generalAPI.jobDownload(convertJobId, { responseType: 'arraybuffer' });

    await expect(response).rejects.toMatchObject({ response: { status: 401 } });
  });
});

async function authenticate() {
  await Utility.setAuthToken(adminConfiguration);
  await Utility.setAuthToken(pocConfiguration);
  await Utility.setAuthToken(dgConfiguration);
  await Utility.setAuthToken(flexDgConfiguration);
  await Utility.setAuthToken(pathwaysDgConfiguration);
}

