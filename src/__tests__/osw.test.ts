import { OSWApi, VersionSpec, GeneralApi, Configuration } from "tdei-client";
import axios, { InternalAxiosRequestConfig } from "axios";
import { Utility } from "../utils";
import AdmZip from "adm-zip";

let apiKeyConfiguration: Configuration = {};
let pocConfiguration: Configuration = {};
let dgConfiguration: Configuration = {};
let adminConfiguration: Configuration = {};

let uploadedJobId: string = '';
let publishJobId: string = '';
let confidenceJobId: string = '1';
let confidenceJobWithSubRegionId: string = '1';
let convertJobId: string = '1';
let datasetBboxJobId: string = '1';
let validationJobId: string = '1';
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
    let data = request.data as FormData;
    let file = data.get("file") as File;
    delete data['file'];
    data.set('file', file, fileName);
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
    console.log("uploaded tdei_dataset_id", uploadedDatasetId);
  }, 195000);

  it('POC | Authenticated , When request made, should respond with job status', async () => {
    let generalAPI = new GeneralApi(pocConfiguration);
    let uploadStatus = await generalAPI.listJobs(uploadedJobId);
    expect(uploadStatus.status).toBe(200);
  }, 25000);


  it('Admin | Authenticated , When request made, should respond with job status', async () => {
    let generalAPI = new GeneralApi(adminConfiguration);
    let uploadStatus = await generalAPI.listJobs(uploadedJobId);
    expect(uploadStatus.status).toBe(200);
  }, 25000);

  it('Admin | un-authenticated , When request made, should respond with unauthenticated request', async () => {
    let generalAPI = new GeneralApi(Utility.getAdminConfiguration());

    let downloadResponse = generalAPI.listJobs(uploadedJobId);

    await expect(downloadResponse).rejects.toMatchObject({ response: { status: 401 } });
  });

});

describe("Edit Metadata API", () => {

  it('Flex Data Generator | Authenticated , When request made, expect to return sucess', async () => {
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

    let uploadStatus = await generalAPI.listJobs(publishJobId);

    expect(uploadStatus.status).toBe(200);
    expect(uploadStatus.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          job_id: expect.toBeOneOf([`${publishJobId}`]),
          status: expect.toBeOneOf(["COMPLETED", "IN-PROGRESS","RUNNING"])
        })
      ])
    );
  }, 45000);

  it('POC | Authenticated , When request made, should respond with job status', async () => {
    let generalAPI = new GeneralApi(pocConfiguration);
    let uploadStatus = await generalAPI.listJobs(publishJobId);
    expect(uploadStatus.status).toBe(200);
  }, 25000);


  it('Admin | Authenticated , When request made, should respond with job status', async () => {
    let generalAPI = new GeneralApi(adminConfiguration);
    let uploadStatus = await generalAPI.listJobs(publishJobId);
    expect(uploadStatus.status).toBe(200);
  }, 25000);

  it('Admin | un-authenticated , When request made, should respond with unauthenticated request', async () => {
    let generalAPI = new GeneralApi(Utility.getAdminConfiguration());

    let downloadResponse = generalAPI.listJobs(publishJobId);

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
    let generalAPI = new GeneralApi(adminConfiguration);

    await new Promise((r) => setTimeout(r, 90000));
    let validateStatus = await generalAPI.listJobs(validationJobId);

    expect(validateStatus.status).toBe(200);
    expect(validateStatus.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          job_id: expect.toBeOneOf([`${validationJobId}`]),
          status: expect.toBeOneOf(["COMPLETED", "IN-PROGRESS","RUNNING"])
        })
      ])
    );
  }, 95000);

  it('POC | Authenticated , When request made, should respond with job status', async () => {
    let generalAPI = new GeneralApi(pocConfiguration);
    let uploadStatus = await generalAPI.listJobs(validationJobId);
    expect(uploadStatus.status).toBe(200);
  }, 25000);


  it('Admin | Authenticated , When request made, should respond with job status', async () => {
    let generalAPI = new GeneralApi(adminConfiguration);
    let uploadStatus = await generalAPI.listJobs(validationJobId);
    expect(uploadStatus.status).toBe(200);
  }, 25000);

  it('Admin | un-authenticated , When request made, should respond with unauthenticated request', async () => {
    let generalAPI = new GeneralApi(Utility.getAdminConfiguration());
    let validateStatusResponse = generalAPI.listJobs(validationJobId);
    await expect(validateStatusResponse).rejects.toMatchObject({ response: { status: 401 } });
  });
});

describe('Calculate dataset confidence request', () => {
  uploadedDatasetId = "d5ca0eb5c0554f6ab7a057e4814ee9f9";
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
    let confidenceStatus = await generalAPI.listJobs(confidenceJobId.toString());

    expect(confidenceStatus.status).toBe(200);

    expect(confidenceStatus.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          job_id: expect.toBeOneOf([`${confidenceJobId}`]),
          status: expect.toBeOneOf(["COMPLETED", "IN-PROGRESS","RUNNING"])
        })
      ])
    );
  }, 15000);

  it('OSW Data Generator | Authenticated , When request made to check confidence with sub-region request, should respond with job status', async () => {
    let generalAPI = new GeneralApi(dgConfiguration);
    await new Promise((r) => setTimeout(r, 10000));
    let confidenceStatus = await generalAPI.listJobs(confidenceJobWithSubRegionId.toString());

    expect(confidenceStatus.status).toBe(200);

    expect(confidenceStatus.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          job_id: expect.toBeOneOf([`${confidenceJobWithSubRegionId}`]),
          status: expect.toBeOneOf(["COMPLETED", "IN-PROGRESS", "RUNNING"])
        })
      ])
    );
  }, 15000);

  it('POC | Authenticated , When request made, should respond with job status', async () => {
    let generalAPI = new GeneralApi(pocConfiguration);
    let uploadStatus = await generalAPI.listJobs(confidenceJobId);
    expect(uploadStatus.status).toBe(200);
  }, 25000);


  it('Admin | Authenticated , When request made, should respond with job status', async () => {
    let generalAPI = new GeneralApi(adminConfiguration);
    let uploadStatus = await generalAPI.listJobs(confidenceJobId);
    expect(uploadStatus.status).toBe(200);
  }, 25000);

  it('Admin | un-authenticated , When request made, should respond with unauthenticated request', async () => {
    let generalAPI = new GeneralApi(Utility.getAdminConfiguration());
    let confidenceStatusResponse = generalAPI.listJobs(confidenceJobId);

    await expect(confidenceStatusResponse).rejects.toMatchObject({ response: { status: 401 } });
  });
});

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

    let formatStatus = await generalAPI.listJobs(convertJobId);

    expect(formatStatus.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          job_id: expect.toBeOneOf([`${convertJobId}`]),
          status: expect.toBeOneOf(["COMPLETED", "IN-PROGRESS","RUNNING"]),
          progress: expect.objectContaining({
            total_stages: expect.any(Number),
            completed_stages: expect.any(Number),
            current_state: expect.toBeOneOf(["COMPLETED", "IN-PROGRESS","RUNNING"]),
            current_stage: expect.any(String)
          })
        })
      ])
    );
  }, 35000);

  it('POC | Authenticated , When request made, should respond with job status', async () => {
    let generalAPI = new GeneralApi(pocConfiguration);
    let uploadStatus = await generalAPI.listJobs(convertJobId);
    expect(uploadStatus.status).toBe(200);
  }, 25000);


  it('Admin | Authenticated , When request made, should respond with job status', async () => {
    let generalAPI = new GeneralApi(adminConfiguration);
    let uploadStatus = await generalAPI.listJobs(convertJobId);
    expect(uploadStatus.status).toBe(200);
  }, 25000);

  it('Admin | un-authenticated , When request made, should respond with unauthenticated request', async () => {
    let generalAPI = new GeneralApi(Utility.getAdminConfiguration());

    let formatStatusResponse = generalAPI.listJobs(convertJobId);

    await expect(formatStatusResponse).rejects.toMatchObject({ response: { status: 401 } });
  });

})

describe('Download converted file', () => {
  jest.retryTimes(1, { logErrorsBeforeRetry: true });
  it('OSW Data Generator | Authenticated , When request made with tdei_dataset_id, should stream the zip file', async () => {
    let generalAPI = new GeneralApi(dgConfiguration);

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
  }, 20000);

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

  it('OSW Data Generator | Authenticated , When request made with valid dataset, should return request job id as response', async () => {
    let oswAPI = new OSWApi(dgConfiguration);

    let bboxRequest = await oswAPI.datasetBbox(bboxRecordId, 'osm', [-122.264913, 47.558543, -122.10549, 47.691327]);

    expect(bboxRequest.status).toBe(202);
    expect(bboxRequest.data).toBeNumber();
    datasetBboxJobId = bboxRequest.data!;
    console.log("dataset bbox job_id", datasetBboxJobId);
  });

  it('POC | Authenticated , When request made with valid dataset, should return request job id as response', async () => {
    let oswAPI = new OSWApi(pocConfiguration);

    let bboxRequest = await oswAPI.datasetBbox(bboxRecordId, 'osm', [-122.264913, 47.558543, -122.10549, 47.691327]);

    expect(bboxRequest.status).toBe(202);
    expect(bboxRequest.data).toBeNumber();
    console.log("dataset bbox job_id", datasetBboxJobId);
  });

  it('Admin | Authenticated , When request made with valid dataset, should return request job id as response', async () => {
    let oswAPI = new OSWApi(adminConfiguration);

    let bboxRequest = await oswAPI.datasetBbox(bboxRecordId, 'osm', [-122.264913, 47.558543, -122.10549, 47.691327]);

    expect(bboxRequest.status).toBe(202);
    expect(bboxRequest.data).toBeNumber();
    console.log("dataset bbox job_id", datasetBboxJobId);
  });

  it('Admin | un-authenticated , When request made with dataset, should return with unauthenticated request', async () => {
    let oswAPI = new OSWApi(Utility.getAdminConfiguration());

    let bboxRequest = oswAPI.datasetBbox(bboxRecordId, 'osm', [-122.264913, 47.558543, -122.10549, 47.691327]);

    await expect(bboxRequest).rejects.toMatchObject({ response: { status: 401 } });
  });

  it('API-Key | Authenticated , When request made with dataset, should return request job id as response', async () => {
    let oswAPI = new OSWApi(apiKeyConfiguration);

    let bboxRequest = await oswAPI.datasetBbox(bboxRecordId, 'osm', [-122.264913, 47.558543, -122.10549, 47.691327]);

    expect(bboxRequest.status).toBe(202);
    expect(bboxRequest.data).toBeNumber();
    console.log("dataset bbox job_id", datasetBboxJobId);
  });

});

describe('Check dataset-bbox request job running status', () => {
  jest.retryTimes(1, { logErrorsBeforeRetry: true });
  it('OSW Data Generator | Authenticated , When request made, should respond with job status', async () => {
    let generalAPI = new GeneralApi(dgConfiguration);
    await new Promise((r) => setTimeout(r, 40000));

    let formatStatus = await generalAPI.listJobs(datasetBboxJobId);

    expect(formatStatus.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          job_id: expect.toBeOneOf([`${datasetBboxJobId}`]),
          status: expect.toBeOneOf(["COMPLETED", "IN-PROGRESS","RUNNING"]),
          progress: expect.objectContaining({
            total_stages: expect.any(Number),
            completed_stages: expect.any(Number),
            current_state: expect.toBeOneOf(["COMPLETED", "IN-PROGRESS","RUNNING"]),
            current_stage: expect.any(String)
          })
        })
      ])
    );
  }, 45000);

  it('POC | Authenticated , When request made, should respond with job status', async () => {
    let generalAPI = new GeneralApi(pocConfiguration);
    let uploadStatus = await generalAPI.listJobs(datasetBboxJobId);
    expect(uploadStatus.status).toBe(200);
  }, 25000);


  it('Admin | Authenticated , When request made, should respond with job status', async () => {
    let generalAPI = new GeneralApi(adminConfiguration);
    let uploadStatus = await generalAPI.listJobs(datasetBboxJobId);
    expect(uploadStatus.status).toBe(200);
  }, 25000);

  it('Admin | un-authenticated , When request made, should respond with unauthenticated request', async () => {
    let generalAPI = new GeneralApi(Utility.getAdminConfiguration());

    let bboxStatusResponse = generalAPI.listJobs(datasetBboxJobId);

    await expect(bboxStatusResponse).rejects.toMatchObject({ response: { status: 401 } });
  });

});

describe('Download Dataset Bbox request file', () => {

  it('OSW Data Generator | Authenticated , When request made with tdei_dataset_id, should stream the zip file', async () => {
    let generalAPI = new GeneralApi(dgConfiguration);

    let response = await generalAPI.jobDownload(datasetBboxJobId, { responseType: 'arraybuffer' });
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

    let downloadResponse = generalAPI.jobDownload(datasetBboxJobId);

    await expect(downloadResponse).rejects.toMatchObject({ response: { status: 401 } });
  });

});

let datasetTagSourceRecordId = 'f5fd7445fbbf4f248ea1096f0e17b7b3';
let datasetTagTargetRecordId = 'f5fd7445fbbf4f248ea1096f0e17b7b3';
let datasetRoadTagJobId = '1';
describe('Dataset Road Tag Request', () => {

  it('OSW Data Generator | Authenticated , When request made with valid dataset, should return request job id as response', async () => {
    let oswAPI = new OSWApi(dgConfiguration);

    let bboxRequest = await oswAPI.datasetTagRoad(datasetTagSourceRecordId, uploadedDatasetId);

    expect(bboxRequest.status).toBe(202);
    expect(bboxRequest.data).toBeNumber();
    datasetRoadTagJobId = bboxRequest.data!;
    console.log("dataset road tag job_id", datasetRoadTagJobId);
  });

  it('Admin | un-authenticated , When request made with dataset, should return with unauthenticated request', async () => {
    let oswAPI = new OSWApi(Utility.getAdminConfiguration());

    let bboxRequest = oswAPI.datasetTagRoad(datasetTagSourceRecordId, uploadedDatasetId);

    await expect(bboxRequest).rejects.toMatchObject({ response: { status: 401 } });
  });

  // it('API-Key | Authenticated , When request made with dataset, should return with unauthorized request', async () => {
  //   let oswAPI = new OSWApi(apiKeyConfiguration);

  //   let bboxRequest = oswAPI.datasetTagRoad(datasetTagSourceRecordId, datasetTagTargetRecordId);

  //   await expect(bboxRequest).rejects.toMatchObject({ response: { status: 401 } });
  // });

});

describe('Check dataset-road-tag request job completion status', () => {
  jest.retryTimes(1, { logErrorsBeforeRetry: true });

  it('OSW Data Generator | Authenticated , When request made, should respond with job status', async () => {
    let generalAPI = new GeneralApi(dgConfiguration);
    await new Promise((r) => setTimeout(r, 40000));

    let formatStatus = await generalAPI.listJobs(datasetRoadTagJobId);

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
    let uploadStatus = await generalAPI.listJobs(datasetRoadTagJobId);
    expect(uploadStatus.status).toBe(200);
  }, 25000);


  it('Admin | Authenticated , When request made, should respond with job status', async () => {
    let generalAPI = new GeneralApi(adminConfiguration);
    let uploadStatus = await generalAPI.listJobs(datasetRoadTagJobId);
    expect(uploadStatus.status).toBe(200);
  }, 25000);

  it('Admin | un-authenticated , When request made, should respond with unauthenticated request', async () => {
    let generalAPI = new GeneralApi(Utility.getAdminConfiguration());

    let bboxStatusResponse = generalAPI.listJobs(datasetRoadTagJobId);

    await expect(bboxStatusResponse).rejects.toMatchObject({ response: { status: 401 } });
  });

});

describe('Download Dataset Road Tag request file', () => {

  it('Admin | Authenticated , When request made with tdei_dataset_id, should stream the zip file', async () => {
    let generalAPI = new GeneralApi(adminConfiguration);

    let response = await generalAPI.jobDownload(datasetBboxJobId, { responseType: 'arraybuffer' });
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

    let response = await generalAPI.jobDownload(datasetBboxJobId, { responseType: 'arraybuffer' });
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

    let downloadResponse = generalAPI.jobDownload(datasetBboxJobId);

    await expect(downloadResponse).rejects.toMatchObject({ response: { status: 401 } });
  });

});

//This test should be ran at last as it will invalidate the uploaded file
describe('Invalidate the OSW file', () => {

  it('POC | Authenticated , When request made, should return true if successful', async () => {
    let generalAPI = new GeneralApi(pocConfiguration);

    let downloadResponse = generalAPI.deleteDataset(uploadedDatasetId);

    await expect((await downloadResponse).status).toBe(200);
  });

  it('Admin | un-authenticated , When request made with dataset, should return with unauthenticated request', async () => {
    let generalAPI = new GeneralApi(Utility.getAdminConfiguration());

    let downloadResponse = generalAPI.deleteDataset(uploadedDatasetId);

    await expect(downloadResponse).rejects.toMatchObject({ response: { status: 401 } });
  });
});

async function authenticate() {
  await Utility.setAuthToken(adminConfiguration);
  await Utility.setAuthToken(pocConfiguration);
  await Utility.setAuthToken(dgConfiguration);
}

