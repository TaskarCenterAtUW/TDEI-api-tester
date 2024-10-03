import { OSWApi, VersionSpec, GeneralApi, Configuration, QualityMetricRequestAlgorithmsEnum, JobDetails, JobDetailsJobTypeEnum, JobDetailsStatusEnum } from "tdei-client";
import axios, { InternalAxiosRequestConfig } from "axios";
import { Utility } from "../utils";
import AdmZip from "adm-zip";
import { Seeder } from "../seeder";

let apiKeyConfiguration: Configuration = {};
let pocConfiguration: Configuration = {};
let dgConfiguration: Configuration = {};
let adminConfiguration: Configuration = {};
let flexDgConfiguration: Configuration = {};
let pathwaysDgConfiguration: Configuration = {};
let uploadedJobId: string = '';
let uploadedJobId_PreRelease: string = '';
let publishJobId: string = '';
let confidenceJobId: string = '1';
let confidenceJobWithSubRegionId: string = '1';
let convertJobId: string = '1';
let datasetBboxJobIdOSM: string = '1';
let datasetBboxJobIdOSW: string = '1';
let validationJobId: string = '1';
let uploadedDatasetId: string = '1';
let uploadedDatasetId_PreRelease: string = '1';
let tdei_project_group_id = "";
let service_id = "";
let qualityMetricJobId = '1';
let qualityMetricJobIdWithIntersection = '1';
const NULL_PARAM = void 0;

const tagQualityRequestInterceptor = (request: InternalAxiosRequestConfig, tdei_dataset_id: string, datasetName: string) => {
  if (
    request.url === `${adminConfiguration.basePath}/api/v1/osw/quality-metric/tag/${tdei_dataset_id}`
  ) {
    let data = request.data as FormData;
    let metaFile = data.get("file") as File;
    delete data['file'];
    data.set('file', metaFile, datasetName);
  }
  return request;
};

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

const oswUploadRequestInterceptor = (request: InternalAxiosRequestConfig, tdei_project_group_id: string, service_id: string, datasetName: string, changestName: string, metafileName: string) => {
  if (
    request.url?.includes(`${adminConfiguration.basePath}/api/v1/osw/upload/${tdei_project_group_id}/${service_id}`)
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
    request.url === `${adminConfiguration.basePath}/api/v1/osw/validate`
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
    request.url === `${adminConfiguration.basePath}/api/v1/osw/convert`
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
    request.url === `${adminConfiguration.basePath}/api/v1/osw/confidence/${tdei_dataset_id}`
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
  let seedData = Utility.seedData;
  tdei_project_group_id = seedData.tdei_project_group_id;
  service_id = seedData.service_id.find(x => x.data_type == "osw")!.serviceId;
  adminConfiguration = Utility.getAdminConfiguration();
  apiKeyConfiguration = Utility.getApiKeyConfiguration();
  pocConfiguration = Utility.getPocConfiguration();
  dgConfiguration = Utility.getOSWDataGeneratorConfiguration();
  flexDgConfiguration = Utility.getFlexDataGeneratorConfiguration();
  pathwaysDgConfiguration = Utility.getPathwaysDataGeneratorConfiguration();

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
      const uploadInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => oswUploadRequestInterceptor(req, tdei_project_group_id, service_id, 'osw-valid.zip', 'changeset.txt', 'metadata.json'))
      const uploadFileResponse = await oswAPI.uploadOswFileForm(dataset, metaToUpload, changesetToUpload, tdei_project_group_id, service_id);

      expect(uploadFileResponse.status).toBe(202);
      expect(uploadFileResponse.data).not.toBeNull();
      uploadedJobId = uploadFileResponse.data;
      console.log("uploaded tdei_dataset_id", uploadedJobId);
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
      const uploadInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => oswUploadRequestInterceptor(req, tdei_project_group_id, service_id, 'osw-valid.zip', 'changeset.txt', 'metadata.json'))
      const uploadFileResponse = await oswAPI.uploadOswFileForm(dataset, metaToUpload, changesetToUpload, tdei_project_group_id, service_id);

      expect(uploadFileResponse.status).toBe(202);
      expect(uploadFileResponse.data).not.toBeNull();
      uploadedJobId_PreRelease = uploadFileResponse.data;
      console.log("uploaded tdei_dataset_id - pre-release", uploadedJobId_PreRelease);
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
      const uploadInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => oswUploadRequestInterceptor(req, tdei_project_group_id, service_id, 'osw-valid.zip', 'changeset.txt', 'metadata.json'))
      const uploadFileResponse = await oswAPI.uploadOswFileForm(dataset, metaToUpload, changesetToUpload, tdei_project_group_id, service_id);

      expect(uploadFileResponse.status).toBe(202);
      expect(uploadFileResponse.data).not.toBeNull();
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
      const uploadInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => oswUploadRequestInterceptor(req, tdei_project_group_id, service_id, 'osw-valid.zip', 'changeset.txt', 'metadata.json'))
      const uploadFileResponse = oswAPI.uploadOswFileForm(dataset, metaToUpload, changesetToUpload, tdei_project_group_id, service_id)

      expect(await uploadFileResponse).rejects.toMatchObject({ response: { status: 400 } });

      axios.interceptors.request.eject(uploadInterceptor);
    } catch (e) {
      console.log(e);
    }
  }, 20000)

  it('Admin | Authenticated , When request made with invalid service id, should return bad request', async () => {
    let oswAPI = new OSWApi(adminConfiguration);
    let metaToUpload = Utility.getMetadataBlob("osw");
    let changesetToUpload = Utility.getChangesetBlob();
    let dataset = Utility.getOSWBlob();
    try {
      const uploadInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => oswUploadRequestInterceptor(req, tdei_project_group_id, service_id, 'osw-valid.zip', 'changeset.txt', 'metadata.json'))
      const uploadFileResponse = oswAPI.uploadOswFileForm(dataset, metaToUpload, changesetToUpload, tdei_project_group_id, 'invalid_service_id')

      expect(await uploadFileResponse).rejects.toMatchObject({ response: { status: 400 } });

      axios.interceptors.request.eject(uploadInterceptor);
    } catch (e) {
      console.log(e);
    }
  }, 20000)

  it('Admin | Authenticated , When request made with invalid project id, should return bad request', async () => {
    let oswAPI = new OSWApi(adminConfiguration);
    let metaToUpload = Utility.getMetadataBlob("osw");
    let changesetToUpload = Utility.getChangesetBlob();
    let dataset = Utility.getOSWBlob();
    try {
      const uploadInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => oswUploadRequestInterceptor(req, tdei_project_group_id, service_id, 'osw-valid.zip', 'changeset.txt', 'metadata.json'))
      const uploadFileResponse = oswAPI.uploadOswFileForm(dataset, metaToUpload, changesetToUpload, 'invalid_tdei_project_group_id', service_id)

      expect(await uploadFileResponse).rejects.toMatchObject({ response: { status: 400 } });

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

    const uploadInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => oswUploadRequestInterceptor(req, tdei_project_group_id, service_id, 'osw-valid.zip', 'changeset.txt', 'metadata.json'))
    const uploadFileResponse = oswAPI.uploadOswFileForm(dataset, metaToUpload, changesetToUpload, tdei_project_group_id, service_id)

    await expect(uploadFileResponse).toReject();
    axios.interceptors.request.eject(uploadInterceptor);

  }, 20000)

  it('API-Key | Authenticated , When request made with dataset, metadata and changeset file, should respond with unauthorized request', async () => {
    let oswAPI = new OSWApi(Utility.getAdminConfiguration());
    let metaToUpload = Utility.getMetadataBlob("osw");
    let changesetToUpload = Utility.getChangesetBlob();
    let dataset = Utility.getOSWBlob();

    const uploadInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => oswUploadRequestInterceptor(req, tdei_project_group_id, service_id, 'osw-valid.zip', 'changeset.txt', 'metadata.json'))
    const uploadFileResponse = oswAPI.uploadOswFileForm(dataset, metaToUpload, changesetToUpload, tdei_project_group_id, service_id)

    await expect(uploadFileResponse).toReject();
    axios.interceptors.request.eject(uploadInterceptor);

  }, 20000)

});

describe('Check upload request job completion status', () => {
  jest.retryTimes(1, { logErrorsBeforeRetry: true });
  it('OSW Data Generator | Authenticated , When request made, should respond with job status', async () => {
    let generalAPI = new GeneralApi(dgConfiguration);
    await new Promise((r) => setTimeout(r, 190000));
    let uploadStatus = await generalAPI.listJobs(uploadedJobId, true, NULL_PARAM, NULL_PARAM, tdei_project_group_id);
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
    console.log("uploaded tdei_dataset_id", uploadedDatasetId);
  }, 195000);

  it('POC | Authenticated , When request made, should respond with job status', async () => {
    let generalAPI = new GeneralApi(pocConfiguration);
    let uploadStatus = await generalAPI.listJobs(uploadedJobId_PreRelease, true, NULL_PARAM, NULL_PARAM, tdei_project_group_id);
    expect(uploadStatus.status).toBe(200);
    uploadedDatasetId_PreRelease = uploadStatus.data[0].response_props.tdei_dataset_id;
  }, 25000);


  it('Admin | Authenticated , When request made, should respond with job status', async () => {
    let generalAPI = new GeneralApi(adminConfiguration);
    let uploadStatus = await generalAPI.listJobs(uploadedJobId, true, NULL_PARAM, NULL_PARAM);
    expect(uploadStatus.status).toBe(200);
  }, 25000);

  it('Admin | un-authenticated , When request made, should respond with unauthenticated request', async () => {
    let generalAPI = new GeneralApi(Utility.getAdminConfiguration());

    let downloadResponse = generalAPI.listJobs(uploadedJobId, true, NULL_PARAM, NULL_PARAM);

    await expect(downloadResponse).rejects.toMatchObject({ response: { status: 401 } });
  });

});

describe("Edit Metadata API", () => {

  it('OSW Data Generator | Authenticated , When request made, expect to return sucess', async () => {
    // Arrange
    let generalAPI = new GeneralApi(dgConfiguration);
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
    let generalAPI = new GeneralApi(pocConfiguration);
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
    let generalAPI = new GeneralApi(adminConfiguration);
    let metaToUpload = Utility.getMetadataBlob("osw");
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
    let metaToUpload = Utility.getMetadataBlob("osw");
    let tdei_dataset_id = uploadedDatasetId;
    // Action
    const editMetaInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => editMetadataRequestInterceptor(req, tdei_dataset_id, 'metadata.json'))
    // Assert
    await expect(generalAPI.editMetadataForm(metaToUpload, tdei_dataset_id)).rejects.toMatchObject({ response: { status: 401 } });
    axios.interceptors.request.eject(editMetaInterceptor);
  }, 30000);
});

describe('Publish the OSW dataset', () => {
  it('OSW Data Generator | Authenticated , When request made with tdei_dataset_id, should return request job id as response', async () => {

    let oswAPI = new OSWApi(dgConfiguration);
    let publishOsw = await oswAPI.publishOswFile(uploadedDatasetId);
    expect(publishOsw.status).toBe(202);
    expect(publishOsw.data).toBeNumber();
    publishJobId = publishOsw.data;
    console.log("publish job_id", publishJobId);
  });

  it('POC | Authenticated , When request made with tdei_dataset_id, should return request job id as response', async () => {

    let oswAPI = new OSWApi(pocConfiguration);
    let publishOsw = await oswAPI.publishOswFile(uploadedDatasetId);
    expect(publishOsw.status).toBe(202);
    expect(publishOsw.data).toBeNumber();
  });

  it('Admin | Authenticated , When request made with tdei_dataset_id, should return request job id as response', async () => {

    let oswAPI = new OSWApi(adminConfiguration);
    let publishOsw = await oswAPI.publishOswFile(uploadedDatasetId);
    expect(publishOsw.status).toBe(202);
    expect(publishOsw.data).toBeNumber();
  });

  it('When passed with already published tdei_dataset_id, should respond with bad request', async () => {

    let oswAPI = new OSWApi(adminConfiguration);
    let tdei_dataset_id = "40566429d02c4c80aee68c970977bed8";

    let publishOswResponse = oswAPI.publishOswFile(tdei_dataset_id);

    await expect(publishOswResponse).rejects.toMatchObject({ response: { status: 400 } });
  })

  it('Admin | un-authenticated , When request made, should respond with unauthenticated request', async () => {
    let oswAPI = new OSWApi(Utility.getAdminConfiguration());

    let publishOswResponse = oswAPI.publishOswFile(uploadedDatasetId);

    await expect(publishOswResponse).rejects.toMatchObject({ response: { status: 401 } });
  });

  it('API-Key | Authenticated , When request made, should respond with unauthorized request', async () => {
    let oswAPI = new OSWApi(Utility.getAdminConfiguration());

    let publishOswResponse = oswAPI.publishOswFile(uploadedDatasetId);

    await expect(publishOswResponse).rejects.toMatchObject({ response: { status: 401 } });
  });
});

describe('Check publish request job running status', () => {
  jest.retryTimes(1, { logErrorsBeforeRetry: true });
  it('OSW Data Generaror | Authenticated , When request made, should respond with job status', async () => {
    let generalAPI = new GeneralApi(dgConfiguration);
    await new Promise((r) => setTimeout(r, 40000));

    let uploadStatus = await generalAPI.listJobs(publishJobId, true, NULL_PARAM, NULL_PARAM, tdei_project_group_id);

    expect(uploadStatus.status).toBe(200);
    expect(uploadStatus.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          job_id: expect.toBeOneOf([`${publishJobId}`]),
          status: expect.toBeOneOf(["COMPLETED", "IN-PROGRESS", "RUNNING"])
        })
      ])
    );
  }, 45000);

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

describe('Validate-only OSW dataset request', () => {
  it('OSW Data Generator | Authenticated , When request made with valid dataset, should return request job id as response', async () => {
    let oswAPI = new OSWApi(dgConfiguration);
    let dataset = Utility.getOSWBlob();
    try {
      const validateInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => oswValidateRequestInterceptor(req, 'osw-valid.zip'))
      const uploadFileResponse = await oswAPI.validateOswFileForm(dataset);

      expect(uploadFileResponse.status).toBe(202);
      expect(uploadFileResponse.data).not.toBeNull();
      validationJobId = uploadFileResponse.data;
      console.log("validation job_id", validationJobId);
      axios.interceptors.request.eject(validateInterceptor);
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

  it('Admin | un-authenticated , When request made with dataset, should return with unauthenticated request', async () => {
    let oswAPI = new OSWApi(Utility.getAdminConfiguration());
    let dataset = Utility.getOSWBlob();

    const validateInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => oswValidateRequestInterceptor(req, 'osw-valid.zip'))
    const uploadFileResponse = oswAPI.validateOswFileForm(dataset);

    await expect(uploadFileResponse).toReject();
    axios.interceptors.request.eject(validateInterceptor);

  }, 20000);

  it('API-Key | Authenticated , When request made with dataset, should return with unauthorized request', async () => {
    let oswAPI = new OSWApi(apiKeyConfiguration);
    let dataset = Utility.getOSWBlob();

    const validateInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => oswValidateRequestInterceptor(req, 'osw-valid.zip'))
    const uploadFileResponse = oswAPI.validateOswFileForm(dataset);

    await expect(uploadFileResponse).toReject();
    axios.interceptors.request.eject(validateInterceptor);

  }, 20000);

});

describe('Check validation-only request job running status', () => {
  jest.retryTimes(1, { logErrorsBeforeRetry: true });
  it('OSW Data Generator | Authenticated , When request made, should respond with job status', async () => {
    let generalAPI = new GeneralApi(dgConfiguration);

    await new Promise((r) => setTimeout(r, 90000));
    let validateStatus = await generalAPI.listJobs(validationJobId, true, NULL_PARAM, NULL_PARAM, tdei_project_group_id);

    expect(validateStatus.status).toBe(200);
    expect(validateStatus.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          job_id: expect.toBeOneOf([`${validationJobId}`]),
          status: expect.toBeOneOf(["COMPLETED", "IN-PROGRESS", "RUNNING"])
        })
      ])
    );
  }, 95000);

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
    let generalAPI = new GeneralApi(dgConfiguration);
    await new Promise((r) => setTimeout(r, 10000));
    let confidenceStatus = await generalAPI.listJobs(confidenceJobId.toString(), true, NULL_PARAM, NULL_PARAM, tdei_project_group_id);

    expect(confidenceStatus.status).toBe(200);

    expect(confidenceStatus.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          job_id: expect.toBeOneOf([`${confidenceJobId}`]),
          status: expect.toBeOneOf(["COMPLETED", "IN-PROGRESS", "RUNNING"]),
          progress: expect.objectContaining({
            total_stages: expect.any(Number),
            completed_stages: expect.any(Number),
            current_state: expect.toBeOneOf(["COMPLETED", "IN-PROGRESS", "RUNNING"]),
            current_stage: expect.any(String)
          })
        })
      ])
    );
  }, 15000);

  it('OSW Data Generator | Authenticated , When request made to check confidence with sub-region request, should respond with job status', async () => {
    let generalAPI = new GeneralApi(dgConfiguration);
    await new Promise((r) => setTimeout(r, 10000));
    let confidenceStatus = await generalAPI.listJobs(confidenceJobWithSubRegionId.toString(), true, NULL_PARAM, NULL_PARAM, tdei_project_group_id);

    expect(confidenceStatus.status).toBe(200);

    expect(confidenceStatus.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          job_id: expect.toBeOneOf([`${confidenceJobWithSubRegionId}`]),
          status: expect.toBeOneOf(["COMPLETED", "IN-PROGRESS", "RUNNING"]),
          progress: expect.objectContaining({
            total_stages: expect.any(Number),
            completed_stages: expect.any(Number),
            current_state: expect.toBeOneOf(["COMPLETED", "IN-PROGRESS", "RUNNING"]),
            current_stage: expect.any(String)
          })
        })
      ])
    );
  }, 15000);

  it('POC | Authenticated , When request made, should respond with job status', async () => {
    let generalAPI = new GeneralApi(pocConfiguration);
    let uploadStatus = await generalAPI.listJobs(confidenceJobId, true, NULL_PARAM, NULL_PARAM, tdei_project_group_id);
    expect(uploadStatus.status).toBe(200);
  }, 25000);


  it('Admin | Authenticated , When request made, should respond with job status', async () => {
    let generalAPI = new GeneralApi(adminConfiguration);
    let uploadStatus = await generalAPI.listJobs(confidenceJobId, true, NULL_PARAM, NULL_PARAM);
    expect(uploadStatus.status).toBe(200);
  }, 25000);

  it('Admin | un-authenticated , When request made, should respond with unauthenticated request', async () => {
    let generalAPI = new GeneralApi(Utility.getAdminConfiguration());
    let confidenceStatusResponse = generalAPI.listJobs(confidenceJobId, true, NULL_PARAM, NULL_PARAM);

    await expect(confidenceStatusResponse).rejects.toMatchObject({ response: { status: 401 } });
  });
});

describe('Calculate dataset quality metric request', () => {
  let uploadedDatasetId_local = "2ed566ac-ebe8-465e-8e10-9e1bda2de97b";
  it('OSW Data Generator | Authenticated , When request made with invalid tdei_dataset_id, should respond with bad request', async () => {
    let oswAPI = new OSWApi(dgConfiguration);
    let qmRequest = { algorithms: [QualityMetricRequestAlgorithmsEnum.Fixed], persist: {} };

    let calculateQualityMetric = oswAPI.oswQualityCalculateForm("dummyset");

    await expect(calculateQualityMetric).rejects.toMatchObject({ response: { status: 404 } });
  });

  it('OSW Data Generator | Authenticated , When request made, should respond request job id as response', async () => {
    let oswAPI = new OSWApi(dgConfiguration);
    let calculateQualityMetric = await oswAPI.oswQualityCalculateForm(uploadedDatasetId_local);

    expect(calculateQualityMetric.status).toBe(202);
    expect(calculateQualityMetric.data).toBeNumber();

    qualityMetricJobId = calculateQualityMetric.data;
    console.log("quality metric job_id", qualityMetricJobId);
  });

  it('OSW Data Generator | Authenticated , When request made with intersection file, should respond job id as response', async () => {
     let oswAPI = new OSWApi(dgConfiguration);
     let calculateQualityMetric = await oswAPI.oswQualityCalculateForm(uploadedDatasetId_local, Utility.getOSWSubRegionBlob());

      expect(calculateQualityMetric.status).toBe(202);
      expect(calculateQualityMetric.data).toBeNumber();
      qualityMetricJobIdWithIntersection = calculateQualityMetric.data;
      console.log("quality metric job_id with intersection", qualityMetricJobIdWithIntersection);

  });

  it('POC | Authenticated , When request made, should respond request job id as response', async () => {
    let oswAPI = new OSWApi(pocConfiguration);
    let qmRequest = { algorithms: [QualityMetricRequestAlgorithmsEnum.Fixed], persist: {} };

    let calculateQualityMetric = await oswAPI.oswQualityCalculateForm(uploadedDatasetId_local);

    expect(calculateQualityMetric.status).toBe(202);

    expect(calculateQualityMetric.data).toBeNumber();

  });

  it('Admin | Authenticated , When request made, should respond request job id as response', async () => {
    let oswAPI = new OSWApi(adminConfiguration);
    // let qmRequest = { algorithms: [QualityMetricRequestAlgorithmsEnum.Fixed], persist: {} };

    let calculateQualityMetric = await oswAPI.oswQualityCalculateForm(uploadedDatasetId_local);

    expect(calculateQualityMetric.status).toBe(202);

    expect(calculateQualityMetric.data).toBeNumber();

  });

  

  it('Admin | un-authenticated , When request made, should respond with unauthenticated request', async () => {
    let oswAPI = new OSWApi(Utility.getAdminConfiguration());
    // let qmRequest = { algorithms: [QualityMetricRequestAlgorithmsEnum.Fixed], persist: {} };

    let calculateQualityMetric = oswAPI.oswQualityCalculateForm(uploadedDatasetId_local);

    await expect(calculateQualityMetric).rejects.toMatchObject({ response: { status: 401 } });
  })

  it('API-Key | Authenticated , When request made, should respond request job id as response', async () => {
    let oswAPI = new OSWApi(apiKeyConfiguration);
    let qmRequest = { algorithms: [QualityMetricRequestAlgorithmsEnum.Fixed], persist: {} };

    let calculateQualityMetric = await oswAPI.oswQualityCalculateForm(uploadedDatasetId_local);

    expect(calculateQualityMetric.status).toBe(202);

    expect(calculateQualityMetric.data).toBeNumber();
  })


})

describe('Check quality metric request with intersection file job running status', () => {
  jest.retryTimes(1, { logErrorsBeforeRetry: true });

  it('OSW Data Generator | Authenticated , When request made, should respond with job status', async () => {
    let generalAPI = new GeneralApi(dgConfiguration);
    await new Promise((r) => setTimeout(r, 10000));
    let qualityMetricStatus = await generalAPI.listJobs(qualityMetricJobIdWithIntersection.toString(), true, NULL_PARAM, NULL_PARAM, tdei_project_group_id);

    expect(qualityMetricStatus.status).toBe(200);

    expect(qualityMetricStatus.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          job_id: expect.toBeOneOf([`${qualityMetricJobIdWithIntersection}`]),
          status: expect.toBeOneOf(["COMPLETED", "IN-PROGRESS", "RUNNING"]),
          progress: expect.objectContaining({
            total_stages: expect.any(Number),
            completed_stages: expect.any(Number),
            current_state: expect.toBeOneOf(["COMPLETED", "IN-PROGRESS", "RUNNING"]),
            current_stage: expect.any(String)
          })
        })
      ])
    );
  }, 15000);

  it('POC | Authenticated , When request made, should respond with job status', async () => {
    let generalAPI = new GeneralApi(pocConfiguration);
    let uploadStatus = await generalAPI.listJobs(qualityMetricJobIdWithIntersection, true, NULL_PARAM, NULL_PARAM, tdei_project_group_id);
    expect(uploadStatus.status).toBe(200);
  }, 25000);

  it('Admin | un-authenticated , When request made, should respond with unauthenticated request', async () => {
    let generalAPI = new GeneralApi(Utility.getAdminConfiguration());
    let qualityMetricStatusResponse = generalAPI.listJobs(qualityMetricJobIdWithIntersection, true, NULL_PARAM, NULL_PARAM);

    await expect(qualityMetricStatusResponse).rejects.toMatchObject({ response: { status: 401 } });
  });
})

describe('Check quality metric request job running status', () => {
  jest.retryTimes(1, { logErrorsBeforeRetry: true });

  it('OSW Data Generator | Authenticated , When request made, should respond with job status', async () => {
    let generalAPI = new GeneralApi(dgConfiguration);
    await new Promise((r) => setTimeout(r, 10000));
    let qualityMetricStatus = await generalAPI.listJobs(qualityMetricJobId.toString(), true, NULL_PARAM, NULL_PARAM, tdei_project_group_id);

    expect(qualityMetricStatus.status).toBe(200);

    expect(qualityMetricStatus.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          job_id: expect.toBeOneOf([`${qualityMetricJobId}`]),
          status: expect.toBeOneOf(["COMPLETED", "IN-PROGRESS", "RUNNING"]),
          progress: expect.objectContaining({
            total_stages: expect.any(Number),
            completed_stages: expect.any(Number),
            current_state: expect.toBeOneOf(["COMPLETED", "IN-PROGRESS", "RUNNING"]),
            current_stage: expect.any(String)
          })
        })
      ])
    );
  }, 15000);

  it('POC | Authenticated , When request made, should respond with job status', async () => {
    let generalAPI = new GeneralApi(pocConfiguration);
    let uploadStatus = await generalAPI.listJobs(qualityMetricJobId, true, NULL_PARAM, NULL_PARAM, tdei_project_group_id);
    expect(uploadStatus.status).toBe(200);
  }, 25000);

  it('Admin | un-authenticated , When request made, should respond with unauthenticated request', async () => {
    let generalAPI = new GeneralApi(Utility.getAdminConfiguration());
    let qualityMetricStatusResponse = generalAPI.listJobs(qualityMetricJobId, true, NULL_PARAM, NULL_PARAM);

    await expect(qualityMetricStatusResponse).rejects.toMatchObject({ response: { status: 401 } });
  });
})

describe('List OSW Versions', () => {
  it('API-Key | Authenticated , When request made, should respond with OSW version list', async () => {
    let oswAPI = new OSWApi(apiKeyConfiguration);

    let oswVersions = await oswAPI.listOswVersions();

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

describe('Convert dataset request', () => {
  it('OSW Data Generator | Authenticated , When request made with valid dataset, should return request job id as response', async () => {
    let oswAPI = new OSWApi(dgConfiguration);
    let oswBlob = Utility.getOSWBlob();

    const convertInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => oswConvertRequestInterceptor(req, 'osw-valid.zip'))
    let formatResponse = await oswAPI.oswOnDemandFormatForm("osw", "osm", oswBlob);

    expect(formatResponse.status).toBe(202);
    expect(formatResponse.data).toBeNumber();
    convertJobId = formatResponse.data!;
    console.log("convert job_id", convertJobId);
    axios.interceptors.request.eject(convertInterceptor);
  });

  it('POC | Authenticated , When request made with valid dataset, should return request job id as response', async () => {
    let oswAPI = new OSWApi(pocConfiguration);
    let oswBlob = Utility.getOSWBlob();

    const convertInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => oswConvertRequestInterceptor(req, 'osw-valid.zip'))
    let formatResponse = await oswAPI.oswOnDemandFormatForm("osw", "osm", oswBlob);

    expect(formatResponse.status).toBe(202);
    expect(formatResponse.data).toBeNumber();
    axios.interceptors.request.eject(convertInterceptor);
  });

  it('Admin | Authenticated , When request made with valid dataset, should return request job id as response', async () => {
    let oswAPI = new OSWApi(adminConfiguration);
    let oswBlob = Utility.getOSWBlob();

    const convertInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => oswConvertRequestInterceptor(req, 'osw-valid.zip'))
    let formatResponse = await oswAPI.oswOnDemandFormatForm("osw", "osm", oswBlob);

    expect(formatResponse.status).toBe(202);
    expect(formatResponse.data).toBeNumber();
    axios.interceptors.request.eject(convertInterceptor);
  });

  it('Admin | Authenticated , When request made with dataset with same source=target output, should return with bad request', async () => {
    let oswAPI = new OSWApi(adminConfiguration);
    let oswBlob = Utility.getOSWBlob();

    const convertInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => oswConvertRequestInterceptor(req, 'osw-valid.zip'))
    let formatResponse = oswAPI.oswOnDemandFormatForm("osw", "osw", oswBlob);

    await expect(formatResponse).rejects.toMatchObject({ response: { status: 400 } });
    axios.interceptors.request.eject(convertInterceptor);
  });


  it('Admin | un-authenticated , When request made with dataset, should return with unauthenticated request', async () => {
    let oswAPI = new OSWApi(Utility.getAdminConfiguration());
    let oswBlob = Utility.getOSWBlob();

    const convertInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => oswConvertRequestInterceptor(req, 'osw-valid.zip'))
    let formatResponse = oswAPI.oswOnDemandFormatForm("osw", "osm", oswBlob);

    await expect(formatResponse).toReject();
    axios.interceptors.request.eject(convertInterceptor);
  });

  it('API-Key | Authenticated , When request made with dataset, should return request job id as response', async () => {
    let oswAPI = new OSWApi(apiKeyConfiguration);
    let oswBlob = Utility.getOSWBlob();

    const convertInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => oswConvertRequestInterceptor(req, 'osw-valid.zip'))
    let formatResponse = await oswAPI.oswOnDemandFormatForm("osw", "osm", oswBlob);

    expect(formatResponse.status).toBe(202);
    expect(formatResponse.data).toBeNumber();
    axios.interceptors.request.eject(convertInterceptor);
  });

});

describe('Check convert request job running status', () => {
  jest.retryTimes(1, { logErrorsBeforeRetry: true });

  it('OSW Data Generator | Authenticated , When request made, should respond with job status', async () => {
    let generalAPI = new GeneralApi(dgConfiguration);
    await new Promise((r) => setTimeout(r, 20000));

    let formatStatus = await generalAPI.listJobs(convertJobId, true, NULL_PARAM, NULL_PARAM, tdei_project_group_id);

    expect(formatStatus.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          job_id: expect.toBeOneOf([`${convertJobId}`]),
          status: expect.toBeOneOf(["COMPLETED", "IN-PROGRESS", "RUNNING"]),
          progress: expect.objectContaining({
            total_stages: expect.any(Number),
            completed_stages: expect.any(Number),
            current_state: expect.toBeOneOf(["COMPLETED", "IN-PROGRESS", "RUNNING"]),
            current_stage: expect.any(String)
          })
        })
      ])
    );
  }, 35000);

  it('POC | Authenticated , When request made, should respond with job status', async () => {
    let generalAPI = new GeneralApi(pocConfiguration);
    let uploadStatus = await generalAPI.listJobs(convertJobId, true, NULL_PARAM, NULL_PARAM, tdei_project_group_id);
    expect(uploadStatus.status).toBe(200);
  }, 25000);


  it('Admin | Authenticated , When request made, should respond with job status', async () => {
    let generalAPI = new GeneralApi(adminConfiguration);
    let uploadStatus = await generalAPI.listJobs(convertJobId, true, NULL_PARAM, NULL_PARAM);
    expect(uploadStatus.status).toBe(200);
  }, 25000);

  it('Admin | un-authenticated , When request made, should respond with unauthenticated request', async () => {
    let generalAPI = new GeneralApi(Utility.getAdminConfiguration());

    let formatStatusResponse = generalAPI.listJobs(convertJobId, true, NULL_PARAM, NULL_PARAM);

    await expect(formatStatusResponse).rejects.toMatchObject({ response: { status: 401 } });
  });

})

describe('Download converted file', () => {
  jest.retryTimes(1, { logErrorsBeforeRetry: true });
  it('OSW Data Generator | Authenticated , When request made with tdei_dataset_id, should stream the zip file', async () => {
    let generalAPI = new GeneralApi(dgConfiguration);
    await new Promise((r) => setTimeout(r, 20000));

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
  }, 30000);

  it('Admin | un-authenticated , When request made, should respond with unauthenticated request', async () => {
    let generalAPI = new GeneralApi(Utility.getAdminConfiguration());

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

  it('Admin | Authenticated , When request made with invalid tdei_dataset_id, should respond with bad request', async () => {

    let oswRecordId = 'dummyRecordId';
    let oswAPI = new OSWApi(adminConfiguration);

    let response = oswAPI.getOswFile(oswRecordId);

    await expect(response).rejects.toMatchObject({ response: { status: 404 } });

  });

  it('Admin | un-authenticated , When request made with tdei_dataset_id, should respond with unauthenticated request', async () => {

    let oswAPI = new OSWApi(Utility.getAdminConfiguration());

    let response = oswAPI.getOswFile(uploadedDatasetId);

    await expect(response).rejects.toMatchObject({ response: { status: 401 } });

  });
});

let bboxRecordId = 'f5fd7445fbbf4f248ea1096f0e17b7b3';
describe('Dataset Bbox Request', () => {

  it('OSW Data Generator | Authenticated ,[OSM] When request made with valid dataset, should return request job id as response', async () => {
    let oswAPI = new OSWApi(dgConfiguration);

    let bboxRequest = await oswAPI.datasetBbox(bboxRecordId, 'osm', [-122.264913, 47.558543, -122.10549, 47.691327]);

    expect(bboxRequest.status).toBe(202);
    expect(bboxRequest.data).toBeNumber();
    datasetBboxJobIdOSM = bboxRequest.data!;
  });

  it('POC | Authenticated ,[OSM] When request made with valid dataset, should return request job id as response', async () => {
    let oswAPI = new OSWApi(pocConfiguration);

    let bboxRequest = await oswAPI.datasetBbox(bboxRecordId, 'osm', [-122.264913, 47.558543, -122.10549, 47.691327]);

    expect(bboxRequest.status).toBe(202);
    expect(bboxRequest.data).toBeNumber();
  });

  it('Admin | Authenticated ,[OSM] When request made with valid dataset, should return request job id as response', async () => {
    let oswAPI = new OSWApi(adminConfiguration);

    let bboxRequest = await oswAPI.datasetBbox(bboxRecordId, 'osm', [-122.264913, 47.558543, -122.10549, 47.691327]);

    expect(bboxRequest.status).toBe(202);
    expect(bboxRequest.data).toBeNumber();
  });


  it('API-Key | Authenticated ,[OSM] When request made with dataset, should return request job id as response', async () => {
    let oswAPI = new OSWApi(apiKeyConfiguration);

    let bboxRequest = await oswAPI.datasetBbox(bboxRecordId, 'osm', [-122.264913, 47.558543, -122.10549, 47.691327]);

    expect(bboxRequest.status).toBe(202);
    expect(bboxRequest.data).toBeNumber();
  });

  it('OSW Data Generator | Authenticated ,[OSW] When request made with valid dataset, should return request job id as response', async () => {
    let oswAPI = new OSWApi(dgConfiguration);

    let bboxRequest = await oswAPI.datasetBbox(bboxRecordId, 'osw', [-122.264913, 47.558543, -122.10549, 47.691327]);

    expect(bboxRequest.status).toBe(202);
    expect(bboxRequest.data).toBeNumber();
    datasetBboxJobIdOSW = bboxRequest.data!;
    console.log("dataset bbox job_id", datasetBboxJobIdOSW);
  });

  it('POC | Authenticated ,[OSW] When request made with valid dataset, should return request job id as response', async () => {
    let oswAPI = new OSWApi(pocConfiguration);

    let bboxRequest = await oswAPI.datasetBbox(bboxRecordId, 'osw', [-122.264913, 47.558543, -122.10549, 47.691327]);

    expect(bboxRequest.status).toBe(202);
    expect(bboxRequest.data).toBeNumber();
  });

  it('Admin | Authenticated ,[OSW] When request made with valid dataset, should return request job id as response', async () => {
    let oswAPI = new OSWApi(adminConfiguration);

    let bboxRequest = await oswAPI.datasetBbox(bboxRecordId, 'osw', [-122.264913, 47.558543, -122.10549, 47.691327]);

    expect(bboxRequest.status).toBe(202);
    expect(bboxRequest.data).toBeNumber();
  });


  it('API-Key | Authenticated ,[OSW] When request made with dataset, should return request job id as response', async () => {
    let oswAPI = new OSWApi(apiKeyConfiguration);

    let bboxRequest = await oswAPI.datasetBbox(bboxRecordId, 'osw', [-122.264913, 47.558543, -122.10549, 47.691327]);

    expect(bboxRequest.status).toBe(202);
    expect(bboxRequest.data).toBeNumber();
  });

  it('Admin | un-authenticated , When request made with dataset, should return with unauthenticated request', async () => {
    let oswAPI = new OSWApi(Utility.getAdminConfiguration());

    let bboxRequest = oswAPI.datasetBbox(bboxRecordId, 'osm', [-122.264913, 47.558543, -122.10549, 47.691327]);

    await expect(bboxRequest).rejects.toMatchObject({ response: { status: 401 } });
  });


});

describe('Check dataset-bbox request job running status', () => {
  jest.retryTimes(1, { logErrorsBeforeRetry: true });
  it('OSW Data Generator | Authenticated ,[OSM] When request made, should respond with job status', async () => {
    let generalAPI = new GeneralApi(dgConfiguration);
    await new Promise((r) => setTimeout(r, 40000));

    let formatStatus = await generalAPI.listJobs(datasetBboxJobIdOSM, true, NULL_PARAM, NULL_PARAM, tdei_project_group_id);

    expect(formatStatus.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          job_id: expect.toBeOneOf([`${datasetBboxJobIdOSM}`]),
          status: expect.toBeOneOf(["COMPLETED", "IN-PROGRESS", "RUNNING"]),
          progress: expect.objectContaining({
            total_stages: expect.any(Number),
            completed_stages: expect.any(Number),
            current_state: expect.toBeOneOf(["COMPLETED", "IN-PROGRESS", "RUNNING"]),
            current_stage: expect.any(String)
          })
        })
      ])
    );
  }, 45000);

  it('OSW Data Generator | Authenticated , [OSW] When request made, should respond with job status', async () => {
    let generalAPI = new GeneralApi(dgConfiguration);
    await new Promise((r) => setTimeout(r, 40000));

    let formatStatus = await generalAPI.listJobs(datasetBboxJobIdOSW, true, NULL_PARAM, NULL_PARAM, tdei_project_group_id);

    expect(formatStatus.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          job_id: expect.toBeOneOf([`${datasetBboxJobIdOSW}`]),
          status: expect.toBeOneOf(["COMPLETED", "IN-PROGRESS", "RUNNING"]),
          progress: expect.objectContaining({
            total_stages: expect.any(Number),
            completed_stages: expect.any(Number),
            current_state: expect.toBeOneOf(["COMPLETED", "IN-PROGRESS", "RUNNING"]),
            current_stage: expect.any(String)
          })
        })
      ])
    );
  }, 45000);

  it('POC | Authenticated , When request made, should respond with job status', async () => {
    let generalAPI = new GeneralApi(pocConfiguration);
    let uploadStatus = await generalAPI.listJobs(datasetBboxJobIdOSM, true, NULL_PARAM, NULL_PARAM, tdei_project_group_id);
    expect(uploadStatus.status).toBe(200);
  }, 25000);


  it('Admin | Authenticated , When request made, should respond with job status', async () => {
    let generalAPI = new GeneralApi(adminConfiguration);
    let uploadStatus = await generalAPI.listJobs(datasetBboxJobIdOSM, true, NULL_PARAM, NULL_PARAM);
    expect(uploadStatus.status).toBe(200);
  }, 25000);

  it('Admin | un-authenticated , When request made, should respond with unauthenticated request', async () => {
    let generalAPI = new GeneralApi(Utility.getAdminConfiguration());

    let bboxStatusResponse = generalAPI.listJobs(datasetBboxJobIdOSM, true, NULL_PARAM, NULL_PARAM);

    await expect(bboxStatusResponse).rejects.toMatchObject({ response: { status: 401 } });
  });

});

describe('Download Dataset Bbox request file', () => {

  it('OSW Data Generator | Authenticated , When request made with tdei_dataset_id, should stream the zip file', async () => {
    let generalAPI = new GeneralApi(dgConfiguration);

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
  }, 20000);

  it('Admin | un-authenticated , When request made with tdei_dataset_id, should respond with unauthenticated request', async () => {
    let generalAPI = new GeneralApi(Utility.getAdminConfiguration());

    let downloadResponse = generalAPI.jobDownload(datasetBboxJobIdOSM);

    await expect(downloadResponse).rejects.toMatchObject({ response: { status: 401 } });
  });

});

let datasetTagSourceRecordId = 'f5fd7445fbbf4f248ea1096f0e17b7b3';
let datasetTagTargetPublishedRecordId = '762f3533-b18f-470f-8051-1a7988bf80c7';
let datasetRoadTagJobId = '1';
describe('Dataset Road Tag Request', () => {

  it('OSW Data Generator | Authenticated , When request made with valid dataset, should return request job id as response', async () => {
    let oswAPI = new OSWApi(dgConfiguration);

    let bboxRequest = await oswAPI.datasetTagRoad(datasetTagSourceRecordId, uploadedDatasetId_PreRelease);

    expect(bboxRequest.status).toBe(202);
    expect(bboxRequest.data).toBeNumber();
    datasetRoadTagJobId = bboxRequest.data!;
    console.log("dataset road tag job_id", datasetRoadTagJobId);
  });

  it('Admin | Authenticated , When request made with valid dataset, should return request job id as response', async () => {
    let oswAPI = new OSWApi(adminConfiguration);

    let bboxRequest = await oswAPI.datasetTagRoad(datasetTagSourceRecordId, uploadedDatasetId_PreRelease);

    expect(bboxRequest.status).toBe(202);
    expect(bboxRequest.data).toBeNumber();
  });

  it('POC | Authenticated , When request made with valid dataset, should return request job id as response', async () => {
    let oswAPI = new OSWApi(pocConfiguration);

    let bboxRequest = await oswAPI.datasetTagRoad(datasetTagSourceRecordId, uploadedDatasetId_PreRelease);

    expect(bboxRequest.status).toBe(202);
    expect(bboxRequest.data).toBeNumber();
  });

  it('Admin | authenticated , When request made with publish target dataset, should return with bad request', async () => {
    let oswAPI = new OSWApi(adminConfiguration);

    let bboxRequest = oswAPI.datasetTagRoad(datasetTagSourceRecordId, datasetTagTargetPublishedRecordId);

    await expect(bboxRequest).rejects.toMatchObject({ response: { status: 400 } });
  });

  it('Admin | un-authenticated , When request made with dataset, should return with unauthenticated request', async () => {
    let oswAPI = new OSWApi(Utility.getAdminConfiguration());

    let bboxRequest = oswAPI.datasetTagRoad(datasetTagSourceRecordId, uploadedDatasetId_PreRelease);

    await expect(bboxRequest).rejects.toMatchObject({ response: { status: 401 } });
  });

  it('API-Key | Authenticated , When request made with dataset, should return with unauthorized request', async () => {
    let oswAPI = new OSWApi(apiKeyConfiguration);

    let bboxRequest = oswAPI.datasetTagRoad(datasetTagSourceRecordId, uploadedDatasetId_PreRelease);

    await expect(bboxRequest).rejects.toMatchObject({ response: { status: 401 } });
  });

});

describe('Check dataset-road-tag request job completion status', () => {
  jest.retryTimes(1, { logErrorsBeforeRetry: true });

  it('OSW Data Generator | Authenticated , When request made, should respond with job status', async () => {
    let generalAPI = new GeneralApi(dgConfiguration);
    await new Promise((r) => setTimeout(r, 40000));

    let formatStatus = await generalAPI.listJobs(datasetRoadTagJobId, true, NULL_PARAM, NULL_PARAM, tdei_project_group_id);

    expect(formatStatus.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          job_id: expect.toBeOneOf([`${datasetRoadTagJobId}`]),
          status: expect.toBeOneOf(["COMPLETED"])
        })
      ])
    );
  }, 45000);

  it('POC | Authenticated , When request made, should respond with job status', async () => {
    let generalAPI = new GeneralApi(pocConfiguration);
    let uploadStatus = await generalAPI.listJobs(datasetRoadTagJobId, true, NULL_PARAM, NULL_PARAM, tdei_project_group_id);
    expect(uploadStatus.status).toBe(200);
  }, 25000);


  it('Admin | Authenticated , When request made, should respond with job status', async () => {
    let generalAPI = new GeneralApi(adminConfiguration);
    let uploadStatus = await generalAPI.listJobs(datasetRoadTagJobId, true, NULL_PARAM, NULL_PARAM);
    expect(uploadStatus.status).toBe(200);
  }, 25000);

  it('Admin | un-authenticated , When request made, should respond with unauthenticated request', async () => {
    let generalAPI = new GeneralApi(Utility.getAdminConfiguration());

    let bboxStatusResponse = generalAPI.listJobs(datasetRoadTagJobId, true, NULL_PARAM, NULL_PARAM);

    await expect(bboxStatusResponse).rejects.toMatchObject({ response: { status: 401 } });
  });

});

describe('Download Dataset Road Tag request file', () => {

  it('Admin | Authenticated , When request made with tdei_dataset_id, should stream the zip file', async () => {
    let generalAPI = new GeneralApi(adminConfiguration);

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
  }, 20000);

  it('API-Key | Authenticated , When request made with tdei_dataset_id, should stream the zip file', async () => {
    let generalAPI = new GeneralApi(apiKeyConfiguration);

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
  }, 20000);

  it('Admin | un-authenticated , When request made with tdei_dataset_id, should respond with unauthenticated request', async () => {
    let generalAPI = new GeneralApi(Utility.getAdminConfiguration());

    let downloadResponse = generalAPI.jobDownload(datasetBboxJobIdOSM);

    await expect(downloadResponse).rejects.toMatchObject({ response: { status: 401 } });
  });

});

let spacialJoinJobId = '';
describe('Spatial join Request', () => {

  it('OSW Data Generator | Authenticated , When request made with invalid join input, should return bad response', async () => {
    let oswAPI = new OSWApi(dgConfiguration);
    let input = Utility.getSpatialJoinInput();
    input.join_condition = "";
    input.target_dimension = "invalid" as any;

    await expect(oswAPI.oswSpatialJoin(input)).rejects.toMatchObject({ response: { status: 400 } });
  });

  it('OSW Data Generator | Authenticated , When request made with invalid dataset id input, should return not found response', async () => {
    let oswAPI = new OSWApi(dgConfiguration);
    let input = Utility.getSpatialJoinInput();
    input.target_dataset_id = "invalid";

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
    input.source_dataset_id = "459115ad-537d-4708-9ef6-52e4a15ca91f"; //flex dataset id

    await expect(oswAPI.oswSpatialJoin(input)).rejects.toMatchObject({ response: { status: 400 } });
  });

  it('OSW Data Generator | Authenticated , When request made with non osw target dataset id, should return bad request', async () => {
    let oswAPI = new OSWApi(dgConfiguration);
    let input = Utility.getSpatialJoinInput();
    input.target_dataset_id = "c2e63402-bd4c-4bd6-8335-10eca656bf7b"; //pathways dataset id

    await expect(oswAPI.oswSpatialJoin(input)).rejects.toMatchObject({ response: { status: 400 } });
  });

  it('OSW Data Generator | Authenticated , When request made with valid join input, should return request job id as response', async () => {
    let oswAPI = new OSWApi(dgConfiguration);

    let spatialRequest = await oswAPI.oswSpatialJoin(Utility.getSpatialJoinInput());

    expect(spatialRequest.status).toBe(202);
    expect(spatialRequest.data).toBeNumber();
    spacialJoinJobId = spatialRequest.data!;
    console.log("Spatial join job_id", spacialJoinJobId);
  });

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

    let bboxRequest = oswAPI.datasetTagRoad(datasetTagSourceRecordId, uploadedDatasetId);

    await expect(bboxRequest).rejects.toMatchObject({ response: { status: 401 } });
  });

});

describe('Check spatial join request job completion status', () => {
  jest.retryTimes(1, { logErrorsBeforeRetry: true });

  it('OSW Data Generator | Authenticated , When request made, should respond with job status', async () => {
    let generalAPI = new GeneralApi(dgConfiguration);
    await new Promise((r) => setTimeout(r, 20000));

    let formatStatus = await generalAPI.listJobs(spacialJoinJobId, true, NULL_PARAM, NULL_PARAM, tdei_project_group_id);

    expect(formatStatus.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          job_id: expect.toBeOneOf([`${spacialJoinJobId}`]),
          status: expect.toBeOneOf(["COMPLETED", "IN-PROGRESS", "RUNNING"]),
          progress: expect.objectContaining({
            total_stages: expect.any(Number),
            completed_stages: expect.any(Number),
            current_state: expect.toBeOneOf(["COMPLETED", "IN-PROGRESS", "RUNNING"]),
            current_stage: expect.any(String)
          })
        })
      ])
    );
  }, 45000);

  it('POC | Authenticated , When request made, should respond with job status', async () => {
    let generalAPI = new GeneralApi(pocConfiguration);
    let uploadStatus = await generalAPI.listJobs(spacialJoinJobId, true, NULL_PARAM, NULL_PARAM, tdei_project_group_id);
    expect(uploadStatus.status).toBe(200);
  }, 25000);


  it('Admin | Authenticated , When request made, should respond with job status', async () => {
    let generalAPI = new GeneralApi(adminConfiguration);
    let uploadStatus = await generalAPI.listJobs(spacialJoinJobId, true, NULL_PARAM, NULL_PARAM);
    expect(uploadStatus.status).toBe(200);
  }, 25000);

  it('Admin | un-authenticated , When request made, should respond with unauthenticated request', async () => {
    let generalAPI = new GeneralApi(Utility.getAdminConfiguration());

    let bboxStatusResponse = generalAPI.listJobs(spacialJoinJobId, true, NULL_PARAM, NULL_PARAM);

    await expect(bboxStatusResponse).rejects.toMatchObject({ response: { status: 401 } });
  });

});

describe('Download Spatial join request file', () => {
  jest.retryTimes(1, { logErrorsBeforeRetry: true });

  it('Admin | Authenticated , When request made with job_id, should stream the zip file', async () => {
    let generalAPI = new GeneralApi(adminConfiguration);
    await new Promise((r) => setTimeout(r, 20000));

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
  }, 30000);

  it('API-Key | Authenticated , When request made with job_id, should stream the zip file', async () => {
    let generalAPI = new GeneralApi(apiKeyConfiguration);

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
  }, 20000);

  it('Admin | un-authenticated , When request made with job_id, should respond with unauthenticated request', async () => {
    let generalAPI = new GeneralApi(Utility.getAdminConfiguration());

    let downloadResponse = generalAPI.jobDownload(spacialJoinJobId);

    await expect(downloadResponse).rejects.toMatchObject({ response: { status: 401 } });
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

//This test should be ran at last as it will invalidate the uploaded file
describe('Invalidate the OSW file', () => {

  it('POC | Authenticated , When request made, should return true if successful', async () => {
    let generalAPI = new GeneralApi(pocConfiguration);

    let downloadResponse = generalAPI.deleteDataset(uploadedDatasetId);

    expect((await downloadResponse).status).toBe(200);
  });

  it('POC | Authenticated , When request made with invalid dataset id, should return dataset not found error', async () => {
    let generalAPI = new GeneralApi(pocConfiguration);

    let downloadResponse = generalAPI.deleteDataset('invalid_dataset_id');

    await expect(downloadResponse).rejects.toMatchObject({ response: { status: 404 } });
  });

  it('Admin | un-authenticated , When request made with dataset, should return with unauthenticated request', async () => {
    let generalAPI = new GeneralApi(Utility.getAdminConfiguration());

    let downloadResponse = generalAPI.deleteDataset(uploadedDatasetId);

    await expect(downloadResponse).rejects.toMatchObject({ response: { status: 401 } });
  });
});


describe("Job List API", () => {

  it('Admin | Authenticated , When request made, expect to return job list', async () => {
    // Arrange
    let generalAPI = new GeneralApi(adminConfiguration);
    // Action
    const list_result = await generalAPI.listJobs(NULL_PARAM, true);

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
    let generalAPI = new GeneralApi(pocConfiguration);
    // Action
    const list_result = await generalAPI.listJobs(NULL_PARAM, true, NULL_PARAM, NULL_PARAM, tdei_project_group_id);

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
    let generalAPI = new GeneralApi(flexDgConfiguration);
    // Action
    const list_result = await generalAPI.listJobs(NULL_PARAM, true, NULL_PARAM, NULL_PARAM, tdei_project_group_id);

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
    let generalAPI = new GeneralApi(dgConfiguration);
    // Action
    const list_result = await generalAPI.listJobs(NULL_PARAM, true, NULL_PARAM, NULL_PARAM, tdei_project_group_id);

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
    let generalAPI = new GeneralApi(pathwaysDgConfiguration);
    // Action
    const list_result = await generalAPI.listJobs(NULL_PARAM, true, NULL_PARAM, NULL_PARAM, tdei_project_group_id);

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
    let generalAPI = new GeneralApi(adminConfiguration);
    // Action
    const list_result = await generalAPI.listJobs(NULL_PARAM, true, JobDetailsJobTypeEnum.ConfidenceCalculate, NULL_PARAM);

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
    let generalAPI = new GeneralApi(adminConfiguration);
    // Action
    const list_result = await generalAPI.listJobs(NULL_PARAM, true, JobDetailsJobTypeEnum.DatasetUpload, NULL_PARAM);

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
    let generalAPI = new GeneralApi(adminConfiguration);
    // Action
    const list_result = await generalAPI.listJobs(NULL_PARAM, true, JobDetailsJobTypeEnum.DatasetPublish, NULL_PARAM);

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

  it('Admin | Authenticated , When request made with Job type filter `DatasetQueries`, expect to return job list with filter job type', async () => {
    // Arrange
    let generalAPI = new GeneralApi(adminConfiguration);
    // Action
    const list_result = await generalAPI.listJobs(NULL_PARAM, true, JobDetailsJobTypeEnum.DatasetQueries, NULL_PARAM);

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
          job_type: expect.stringContaining(JobDetailsJobTypeEnum.DatasetQueries),
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
    let generalAPI = new GeneralApi(adminConfiguration);
    // Action
    const list_result = await generalAPI.listJobs(NULL_PARAM, true, JobDetailsJobTypeEnum.DatasetReformat, NULL_PARAM);

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
    let generalAPI = new GeneralApi(adminConfiguration);
    // Action
    const list_result = await generalAPI.listJobs(NULL_PARAM, true, JobDetailsJobTypeEnum.DatasetValidate, NULL_PARAM);

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

  it('Admin | Authenticated , When request made with Status `COMPLETED`, expect to return job list with COMPLETED status', async () => {
    // Arrange
    let generalAPI = new GeneralApi(adminConfiguration);
    // Action
    const list_result = await generalAPI.listJobs(NULL_PARAM, true, NULL_PARAM, JobDetailsStatusEnum.COMPLETED);

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
    let generalAPI = new GeneralApi(adminConfiguration);
    // Action
    const list_result = await generalAPI.listJobs(NULL_PARAM, true, NULL_PARAM, JobDetailsStatusEnum.INPROGRESS);

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
  }, 30000);

  it('Admin | Authenticated , When request made with Status `FAILED`, expect to return job list with FAILED status', async () => {
    // Arrange
    let generalAPI = new GeneralApi(adminConfiguration);
    // Action
    const list_result = await generalAPI.listJobs(NULL_PARAM, true, NULL_PARAM, JobDetailsStatusEnum.FAILED);

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
  }, 30000);
});


async function authenticate() {
  await Utility.setAuthToken(adminConfiguration);
  await Utility.setAuthToken(pocConfiguration);
  await Utility.setAuthToken(dgConfiguration);
  await Utility.setAuthToken(flexDgConfiguration);
  await Utility.setAuthToken(pathwaysDgConfiguration);
}

