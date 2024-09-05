import { Configuration, GTFSPathwaysApi, GeneralApi, VersionSpec } from "tdei-client";
import { Utility } from "../utils";
import axios, { InternalAxiosRequestConfig } from "axios";
import AdmZip from "adm-zip";

let apiKeyConfiguration: Configuration = {};
let pocConfiguration: Configuration = {};
let dgConfiguration: Configuration = {};
let adminConfiguration: Configuration = {};
const NULL_PARAM = void 0;

let validationJobId: string = '1';
let uploadedJobId: string = '1';
let publishJobId: string = '1';
let uploadedDatasetId: string = '1';
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
    request.url?.includes(`${adminConfiguration.basePath}/api/v1/gtfs-pathways/upload/${tdei_project_group_id}/${service_id}`)
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
    request.url === `${adminConfiguration.basePath}/api/v1/gtfs-pathways/validate`
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
  service_id = seedData.service_id.find(x => x.data_type == "pathways")!.serviceId;
  adminConfiguration = Utility.getAdminConfiguration();
  apiKeyConfiguration = Utility.getApiKeyConfiguration();
  pocConfiguration = Utility.getPocConfiguration();
  dgConfiguration = Utility.getPathwaysDataGeneratorConfiguration();
  await Utility.setAuthToken(adminConfiguration);
  await Utility.setAuthToken(pocConfiguration);
  await Utility.setAuthToken(dgConfiguration);
});


describe('Upload pathways dataset', () => {

  it('Pathways Data Generator | Authenticated , When request made with dataset, metadata and changeset file, should return request job id as response', async () => {
    let pathwaysAPI = new GTFSPathwaysApi(dgConfiguration);
    let metaToUpload = Utility.getMetadataBlob("pathways")
    let changesetToUpload = Utility.getChangesetBlob();
    let dataset = Utility.getPathwaysBlob();
    let derived_from_dataset_id = '';
    try {
      const uploadInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => uploadRequestInterceptor(req, tdei_project_group_id, service_id, 'pathways-valid.zip', 'changeset.zip', 'metadata.json'))
      const uploadFileResponse = await pathwaysAPI.uploadGtfsPathwaysFileForm(dataset, metaToUpload, changesetToUpload, tdei_project_group_id, service_id, derived_from_dataset_id);

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
    let pathwaysAPI = new GTFSPathwaysApi(pocConfiguration);
    let metaToUpload = Utility.getMetadataBlob("pathways")
    let changesetToUpload = Utility.getChangesetBlob();
    let dataset = Utility.getPathwaysBlob();
    let derived_from_dataset_id = '';
    try {
      const uploadInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => uploadRequestInterceptor(req, tdei_project_group_id, service_id, 'pathways-valid.zip', 'changeset.zip', 'metadata.json'))
      const uploadFileResponse = await pathwaysAPI.uploadGtfsPathwaysFileForm(dataset, metaToUpload, changesetToUpload, tdei_project_group_id, service_id, derived_from_dataset_id);

      expect(uploadFileResponse.status).toBe(202);
      expect(uploadFileResponse.data).not.toBeNull();
      axios.interceptors.request.eject(uploadInterceptor);
    } catch (e) {
      console.log(e);
    }
  }, 20000);

  it('Admin | Authenticated , When request made with dataset, metadata and changeset file, should return request job id as response', async () => {
    let pathwaysAPI = new GTFSPathwaysApi(adminConfiguration);
    let metaToUpload = Utility.getMetadataBlob("pathways")
    let changesetToUpload = Utility.getChangesetBlob();
    let dataset = Utility.getPathwaysBlob();
    let derived_from_dataset_id = '';
    try {
      const uploadInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => uploadRequestInterceptor(req, tdei_project_group_id, service_id, 'pathways-valid.zip', 'changeset.zip', 'metadata.json'))
      const uploadFileResponse = await pathwaysAPI.uploadGtfsPathwaysFileForm(dataset, metaToUpload, changesetToUpload, tdei_project_group_id, service_id, derived_from_dataset_id);

      expect(uploadFileResponse.status).toBe(202);
      expect(uploadFileResponse.data).not.toBeNull();
      axios.interceptors.request.eject(uploadInterceptor);
    } catch (e) {
      console.log(e);
    }
  }, 20000);

  it('Admin | Authenticated , When request made with dataset and invalid metafile, should return bad request with metadata validation errors', async () => {
    let pathwaysAPI = new GTFSPathwaysApi(adminConfiguration);
    let metaToUpload = Utility.getInvalidMetadataBlob("Pathways");
    let changesetToUpload = Utility.getChangesetBlob();
    let dataset = Utility.getPathwaysBlob();
    try {
      const uploadInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => uploadRequestInterceptor(req, tdei_project_group_id, service_id, 'pathways-valid.zip', 'changeset.zip', 'metadata.json'))
      const uploadFileResponse = pathwaysAPI.uploadGtfsPathwaysFileForm(dataset, metaToUpload, changesetToUpload, tdei_project_group_id, service_id)

      expect(await uploadFileResponse).rejects.toMatchObject({ response: { status: 400 } });

      axios.interceptors.request.eject(uploadInterceptor);
    } catch (e) {
      console.log(e);
    }
  }, 20000)

  it('Admin | Authenticated , When request made with invalid service id, should return bad request', async () => {
    let pathwaysAPI = new GTFSPathwaysApi(adminConfiguration);
    let metaToUpload = Utility.getMetadataBlob("pathways");
    let changesetToUpload = Utility.getChangesetBlob();
    let dataset = Utility.getPathwaysBlob();
    try {
      const uploadInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => uploadRequestInterceptor(req, tdei_project_group_id, "invalid_service_id", 'pathways-valid.zip', 'changeset.zip', 'metadata.json'))
      const uploadFileResponse = pathwaysAPI.uploadGtfsPathwaysFileForm(dataset, metaToUpload, changesetToUpload, tdei_project_group_id, "invalid_service_id")

      expect(await uploadFileResponse).rejects.toMatchObject({ response: { status: 400 } });

      axios.interceptors.request.eject(uploadInterceptor);
    } catch (e) {
      console.log(e);
    }
  }, 20000)

  it('Admin | Authenticated , When request made with invalid project group id, should return bad request', async () => {
    let pathwaysAPI = new GTFSPathwaysApi(adminConfiguration);
    let metaToUpload = Utility.getMetadataBlob("pathways");
    let changesetToUpload = Utility.getChangesetBlob();
    let dataset = Utility.getPathwaysBlob();
    try {
      const uploadInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => uploadRequestInterceptor(req, "invalid_tdei_project_group_id", service_id, 'pathways-valid.zip', 'changeset.zip', 'metadata.json'))
      const uploadFileResponse = pathwaysAPI.uploadGtfsPathwaysFileForm(dataset, metaToUpload, changesetToUpload, "invalid_tdei_project_group_id", service_id)

      expect(await uploadFileResponse).rejects.toMatchObject({ response: { status: 400 } });

      axios.interceptors.request.eject(uploadInterceptor);
    } catch (e) {
      console.log(e);
    }
  }, 20000)

  it('Admin | un-authenticated , When request made with dataset, metadata and changeset file, should respond with unauthenticated request', async () => {
    let pathwaysAPI = new GTFSPathwaysApi(Utility.getAdminConfiguration());
    let metaToUpload = Utility.getMetadataBlob("pathways");
    let changesetToUpload = Utility.getChangesetBlob();
    let dataset = Utility.getPathwaysBlob();

    const uploadInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => uploadRequestInterceptor(req, tdei_project_group_id, service_id, 'pathways-valid.zip', 'changeset.zip', 'metadata.json'))
    const uploadFileResponse = pathwaysAPI.uploadGtfsPathwaysFileForm(dataset, metaToUpload, changesetToUpload, tdei_project_group_id, service_id)

    await expect(uploadFileResponse).rejects.toMatchObject({ response: { status: 401 } });
    axios.interceptors.request.eject(uploadInterceptor);

  }, 20000)

  it('API-Key | authenticated , When request made with dataset, metadata and changeset file, should respond with unauthenticated request', async () => {
    let pathwaysAPI = new GTFSPathwaysApi(apiKeyConfiguration);
    let metaToUpload = Utility.getMetadataBlob("pathways");
    let changesetToUpload = Utility.getChangesetBlob();
    let dataset = Utility.getPathwaysBlob();

    const uploadInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => uploadRequestInterceptor(req, tdei_project_group_id, service_id, 'pathways-valid.zip', 'changeset.zip', 'metadata.json'))
    const uploadFileResponse = pathwaysAPI.uploadGtfsPathwaysFileForm(dataset, metaToUpload, changesetToUpload, tdei_project_group_id, service_id)

    await expect(uploadFileResponse).rejects.toMatchObject({ response: { status: 401 } });
    axios.interceptors.request.eject(uploadInterceptor);

  }, 20000)

});

describe('Check upload request job completion status', () => {
  jest.retryTimes(1, { logErrorsBeforeRetry: true });

  it('Pathways Data Generator | Authenticated , When request made, should respond with job status', async () => {
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
    console.log("uploaded tdei_dataset_id", uploadedDatasetId);
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
    let metaToUpload = Utility.getMetadataBlob("pathways");
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
    let metaToUpload = Utility.getMetadataBlob("pathways");
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
    let metaToUpload = Utility.getMetadataBlob("pathways");
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
    let metaToUpload = Utility.getMetadataBlob("pathways");
    let tdei_dataset_id = uploadedDatasetId;
    // Action
    const editMetaInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => editMetadataRequestInterceptor(req, tdei_dataset_id, 'metadata.json'))
    // Assert
    await expect(generalAPI.editMetadataForm(metaToUpload, tdei_dataset_id)).rejects.toMatchObject({ response: { status: 401 } });
    axios.interceptors.request.eject(editMetaInterceptor);
  }, 30000);
});

describe('Publish the flex dataset', () => {
  it('Pathways Data Generator | Authenticated , When request made with tdei_dataset_id, should return request job id as response', async () => {

    let pathwaysAPI = new GTFSPathwaysApi(dgConfiguration);
    let publish = await pathwaysAPI.publishGtfsPathwaysFile(uploadedDatasetId);
    expect(publish.status).toBe(202);
    expect(publish.data).toBeNumber();
    publishJobId = publish.data;
    console.log("publish job_id", publishJobId);
  });

  it('Admin | When passed with already published tdei_dataset_id, should respond with bad request', async () => {

    let pathwaysAPI = new GTFSPathwaysApi(adminConfiguration);
    let tdei_dataset_id = "395f3155-3238-4fd1-b4f1-3a55160decd9";

    let publishResponse = pathwaysAPI.publishGtfsPathwaysFile(tdei_dataset_id);

    await expect(publishResponse).rejects.toMatchObject({ response: { status: 400 } });
  })

  it('Admin | un-authenticated , When request made, should respond with unauthenticated request', async () => {
    let pathwaysAPI = new GTFSPathwaysApi(Utility.getAdminConfiguration());

    let publishResponse = pathwaysAPI.publishGtfsPathwaysFile(uploadedDatasetId);

    await expect(publishResponse).rejects.toMatchObject({ response: { status: 401 } });
  })

  it('API-Key | Authenticated , When request made, should respond with unauthenticated request', async () => {
    let pathwaysAPI = new GTFSPathwaysApi(apiKeyConfiguration);

    let publishResponse = pathwaysAPI.publishGtfsPathwaysFile(uploadedDatasetId);

    await expect(publishResponse).rejects.toMatchObject({ response: { status: 401 } });
  })
});

describe('Check publish request job completion status', () => {
  jest.retryTimes(1, { logErrorsBeforeRetry: true });

  it('Pathways Data Generator | Authenticated , When request made, should respond with job status', async () => {
    let generalAPI = new GeneralApi(dgConfiguration);
    await new Promise((r) => setTimeout(r, 20000));

    let uploadStatus = await generalAPI.listJobs(publishJobId, true, NULL_PARAM, NULL_PARAM, tdei_project_group_id);

    expect(uploadStatus.status).toBe(200);
    expect(uploadStatus.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          job_id: expect.toBeOneOf([`${publishJobId}`]),
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

describe('Validate-only pathways dataset request', () => {
  it('Pathways Data Generator | Authenticated , When request made with valid dataset, should return request job id as response', async () => {
    let pathwaysAPI = new GTFSPathwaysApi(dgConfiguration);
    let dataset = Utility.getPathwaysBlob();
    try {
      const validateInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => validateRequestInterceptor(req, 'pathways-valid.zip'))
      const uploadFileResponse = await pathwaysAPI.validateGtfsPathwaysFileForm(dataset);

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
    let pathwaysAPI = new GTFSPathwaysApi(adminConfiguration);
    let dataset = Utility.getPathwaysBlob();
    try {
      const validateInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => validateRequestInterceptor(req, 'pathways-valid.zip'))
      const uploadFileResponse = await pathwaysAPI.validateGtfsPathwaysFileForm(dataset);

      expect(uploadFileResponse.status).toBe(202);
      expect(uploadFileResponse.data).not.toBeNull();
      axios.interceptors.request.eject(validateInterceptor);
    } catch (e) {
      console.log(e);
    }
  }, 20000)

  it('Admin | un-authenticated , When request made with dataset, should return with unauthenticated request', async () => {
    let pathwaysAPI = new GTFSPathwaysApi(Utility.getAdminConfiguration());
    let dataset = Utility.getPathwaysBlob();

    const validateInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => validateRequestInterceptor(req, 'pathways-valid.zip'))
    const uploadFileResponse = pathwaysAPI.validateGtfsPathwaysFileForm(dataset);

    await expect(uploadFileResponse).rejects.toMatchObject({ response: { status: 401 } });
    axios.interceptors.request.eject(validateInterceptor);

  }, 20000);

  it('API-Key | Authenticated , When request made with dataset, should return with unauthenticated request', async () => {
    let pathwaysAPI = new GTFSPathwaysApi(apiKeyConfiguration);
    let dataset = Utility.getPathwaysBlob();

    const validateInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => validateRequestInterceptor(req, 'pathways-valid.zip'))
    const uploadFileResponse = pathwaysAPI.validateGtfsPathwaysFileForm(dataset);

    await expect(uploadFileResponse).rejects.toMatchObject({ response: { status: 401 } });
    axios.interceptors.request.eject(validateInterceptor);

  }, 20000);
});

describe('Check validation-only request job completion status', () => {
  jest.retryTimes(1, { logErrorsBeforeRetry: true });

  it('Pathways Data Generator | Authenticated , When request made, should respond with job status', async () => {
    let generalAPI = new GeneralApi(dgConfiguration);

    await new Promise((r) => setTimeout(r, 20000));
    let validateStatus = await generalAPI.listJobs(validationJobId, true, NULL_PARAM, NULL_PARAM, tdei_project_group_id);

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

describe('List pathways versions', () => {
  it('Admin | Authenticated , When request made, should respond with pathways version list', async () => {
    let pathwaysAPI = new GTFSPathwaysApi(adminConfiguration);

    let versions = await pathwaysAPI.listGtfsPathwaysVersions();

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
  it('API-Key | Authenticated , When request made, should respond with pathways version list', async () => {
    let pathwaysAPI = new GTFSPathwaysApi(apiKeyConfiguration);

    let versions = await pathwaysAPI.listGtfsPathwaysVersions();

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
    let pathwaysAPI = new GTFSPathwaysApi(Utility.getAdminConfiguration());

    let versionsResponse = pathwaysAPI.listGtfsPathwaysVersions();

    await expect(versionsResponse).rejects.toMatchObject({ response: { status: 401 } });
  })
});

describe('Download pathways dataset', () => {
  it('Admin | Authenticated , When request made with tdei_dataset_id, should stream the zip file', async () => {

    let pathwaysAPI = new GTFSPathwaysApi(adminConfiguration);

    let response = await pathwaysAPI.getGtfsPathwaysFile(uploadedDatasetId, { responseType: 'arraybuffer' });
    const data: any = response.data;
    const contentType = response.headers['content-type'];
    const zip = new AdmZip(data);
    const entries = zip.getEntries();

    expect(entries.length).toBeGreaterThanOrEqual(0);
    expect(contentType).toBe("application/octet-stream");
    expect(response.data).not.toBeNull();
    expect(response.status).toBe(200);
  }, 10000);

  it('Pathways Data Generator | Authenticated , When request made with tdei_dataset_id, should stream the zip file', async () => {

    let pathwaysAPI = new GTFSPathwaysApi(dgConfiguration);

    let response = await pathwaysAPI.getGtfsPathwaysFile(uploadedDatasetId, { responseType: 'arraybuffer' });
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

    let pathwaysAPI = new GTFSPathwaysApi(apiKeyConfiguration);

    let response = await pathwaysAPI.getGtfsPathwaysFile(uploadedDatasetId, { responseType: 'arraybuffer' });
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
    let pathwaysAPI = new GTFSPathwaysApi(adminConfiguration);

    let response = pathwaysAPI.getGtfsPathwaysFile(recordId);

    await expect(response).rejects.toMatchObject({ response: { status: 404 } });

  })

  it('Admin | un-authenticated , When request made with tdei_dataset_id, should respond with unauthenticated request', async () => {

    let pathwaysAPI = new GTFSPathwaysApi(Utility.getAdminConfiguration());

    let response = pathwaysAPI.getGtfsPathwaysFile(uploadedDatasetId);

    await expect(response).rejects.toMatchObject({ response: { status: 401 } });

  })
});