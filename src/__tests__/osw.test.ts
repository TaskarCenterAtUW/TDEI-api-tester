import { AuthenticationApi, OSWApi, VersionSpec, GeneralApi } from "tdei-client";
import axios, { InternalAxiosRequestConfig } from "axios";
import { Utility } from "../utils";
import AdmZip from "adm-zip";


let configuration = Utility.getConfiguration();
let uploadedJobId: string = '';
let publishJobId: string = '';
let confidenceJobId: string = '1';
let convertJobId: string = '1';
let datasetBboxJobId: string = '1';
let validationJobId: string = '1';
let uploadedDatasetId: string = '1';

const oswUploadRequestInterceptor = (request: InternalAxiosRequestConfig, tdei_project_group_id: string, service_id: string, datasetName: string, changestName: string, metafileName: string) => {
  if (
    request.url?.includes(`${configuration.basePath}/api/v1/osw/upload/${tdei_project_group_id}/${service_id}`)
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
    request.url === `${configuration.basePath}/api/v1/osw/validate`
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
    request.url === `${configuration.basePath}/api/v1/osw/convert`
  ) {
    let data = request.data as FormData;
    let file = data.get("file") as File;
    delete data['file'];
    data.set('file', file, fileName);
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

afterAll(async () => {
});

describe('Upload OSW dataset', () => {
  it('Admin | Authenticated , When request made with dataset, metadata and changeset file, should return request job id as response', async () => {
    let oswAPI = new OSWApi(configuration);
    let metaToUpload = Utility.getMetadataBlob("osw");
    let changesetToUpload = Utility.getChangesetBlob();
    let dataset = Utility.getOSWBlob();
    let tdei_project_group_id = 'd8271b7d-a07f-4bc9-a0b9-8de864464277';
    let service_id = 'bb29e704-aaad-423e-8e31-cf8eff559585';
    let derived_from_dataset_id = '40566429d02c4c80aee68c970977bed8';
    try {
      const uploadInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => oswUploadRequestInterceptor(req, tdei_project_group_id, service_id, 'osw-valid.zip', 'changeset.txt', 'metadata.json'))
      const uploadFileResponse = await oswAPI.uploadOswFileForm(dataset, metaToUpload, changesetToUpload, tdei_project_group_id, service_id, derived_from_dataset_id);

      expect(uploadFileResponse.status).toBe(202);
      expect(uploadFileResponse.data).not.toBeNull();
      uploadedJobId = uploadFileResponse.data;
      console.log("uploaded tdei_dataset_id", uploadedJobId);
      axios.interceptors.request.eject(uploadInterceptor);
    } catch (e) {
      console.log(e);
    }
  }, 20000);

  it('Admin | Authenticated , When request made with dataset and invalid metafile, should return bad request with metadata validation errors', async () => {
    let oswAPI = new OSWApi(configuration);
    let metaToUpload = Utility.getInvalidMetadataBlob("osw");
    let changesetToUpload = Utility.getChangesetBlob();
    let dataset = Utility.getOSWBlob();
    let tdei_project_group_id = 'd8271b7d-a07f-4bc9-a0b9-8de864464277';
    let service_id = 'bb29e704-aaad-423e-8e31-cf8eff559585';
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
    let oswAPI = new OSWApi(Utility.getConfiguration());
    let metaToUpload = Utility.getMetadataBlob("osw");
    let changesetToUpload = Utility.getChangesetBlob();
    let dataset = Utility.getOSWBlob();
    let tdei_project_group_id = 'd8271b7d-a07f-4bc9-a0b9-8de864464277';
    let service_id = 'bb29e704-aaad-423e-8e31-cf8eff559585';

    const uploadInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => oswUploadRequestInterceptor(req, tdei_project_group_id, service_id, 'osw-valid.zip', 'changeset.txt', 'metadata.json'))
    const uploadFileResponse = oswAPI.uploadOswFileForm(dataset, metaToUpload, changesetToUpload, tdei_project_group_id, service_id)

    await expect(uploadFileResponse).toReject();
    axios.interceptors.request.eject(uploadInterceptor);

  }, 20000)

});

describe('Check upload request job completion status', () => {
  jest.retryTimes(1, { logErrorsBeforeRetry: true });
  it('Admin | Authenticated , When request made, should respond with job status', async () => {
    let generalAPI = new GeneralApi(configuration);
    await new Promise((r) => setTimeout(r, 130000));
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
  }, 135000);

  it('Admin | un-authenticated , When request made, should respond with unauthenticated request', async () => {
    let generalAPI = new GeneralApi(Utility.getConfiguration());

    let downloadResponse = generalAPI.listJobs(uploadedJobId);

    await expect(downloadResponse).rejects.toMatchObject({ response: { status: 401 } });
  });

});

describe('Publish the OSW dataset', () => {
  it('Admin | Authenticated , When request made with tdei_dataset_id, should return request job id as response', async () => {

    let oswAPI = new OSWApi(configuration);
    let publishOsw = await oswAPI.publishOswFile(uploadedDatasetId);
    expect(publishOsw.status).toBe(202);
    expect(publishOsw.data).toBeNumber();
    publishJobId = publishOsw.data;
    console.log("publish job_id", publishJobId);
  });

  it('When passed with already published tdei_dataset_id, should respond with bad request', async () => {

    let oswAPI = new OSWApi(configuration);
    let tdei_dataset_id = "40566429d02c4c80aee68c970977bed8";

    let publishOswResponse = oswAPI.publishOswFile(tdei_dataset_id);

    await expect(publishOswResponse).rejects.toMatchObject({ response: { status: 400 } });
  })

  it('Admin | un-authenticated , When request made, should respond with unauthenticated request', async () => {
    let oswAPI = new OSWApi(Utility.getConfiguration());

    let publishOswResponse = oswAPI.publishOswFile(uploadedDatasetId);

    await expect(publishOswResponse).rejects.toMatchObject({ response: { status: 401 } });
  })
});

describe('Check publish request job completion status', () => {
  jest.retryTimes(1, { logErrorsBeforeRetry: true });
  it('Admin | Authenticated , When request made, should respond with job status', async () => {
    let generalAPI = new GeneralApi(configuration);
    await new Promise((r) => setTimeout(r, 40000));

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
  }, 45000);

  it('Admin | un-authenticated , When request made, should respond with unauthenticated request', async () => {
    let generalAPI = new GeneralApi(Utility.getConfiguration());

    let downloadResponse = generalAPI.listJobs(publishJobId);

    await expect(downloadResponse).rejects.toMatchObject({ response: { status: 401 } });
  });
});

describe('Validate-only OSW dataset request', () => {
  it('Admin | Authenticated , When request made with valid dataset, should return request job id as response', async () => {
    let oswAPI = new OSWApi(configuration);
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
  }, 20000)

  it('Admin | un-authenticated , When request made with dataset, should return with unauthenticated request', async () => {
    let oswAPI = new OSWApi(Utility.getConfiguration());
    let dataset = Utility.getOSWBlob();

    const validateInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => oswValidateRequestInterceptor(req, 'osw-valid.zip'))
    const uploadFileResponse = oswAPI.validateOswFileForm(dataset);

    await expect(uploadFileResponse).toReject();
    axios.interceptors.request.eject(validateInterceptor);

  }, 20000);

});

describe('Check validation-only request job completion status', () => {
  jest.retryTimes(1, { logErrorsBeforeRetry: true });
  it('Admin | Authenticated , When request made, should respond with job status', async () => {
    let generalAPI = new GeneralApi(configuration);

    await new Promise((r) => setTimeout(r, 90000));
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
  }, 95000);

  it('Admin | un-authenticated , When request made, should respond with unauthenticated request', async () => {
    let generalAPI = new GeneralApi(Utility.getConfiguration());
    let validateStatusResponse = generalAPI.listJobs(validationJobId);
    await expect(validateStatusResponse).rejects.toMatchObject({ response: { status: 401 } });
  });
});

describe('Calculate dataset confidence request', () => {

  it('Admin | Authenticated , When request made with invalid tdei_dataset_id, should respond with bad request', async () => {
    let oswAPI = new OSWApi(configuration);

    let calculateConfidence = oswAPI.oswConfidenceCalculate("dummytdeirecordid");

    await expect(calculateConfidence).rejects.toMatchObject({ response: { status: 404 } });
  })

  it('Admin | Authenticated , When request made, should respond request job id as response', async () => {
    let oswAPI = new OSWApi(configuration);

    let calculateConfidence = await oswAPI.oswConfidenceCalculate(uploadedDatasetId);

    expect(calculateConfidence.status).toBe(202);

    expect(calculateConfidence.data).toBeNumber();

    confidenceJobId = calculateConfidence.data;
    console.log("confidence job_id", confidenceJobId);
  });

  it('Admin | un-authenticated , When request made, should respond with unauthenticated request', async () => {
    let oswAPI = new OSWApi(Utility.getConfiguration());

    let calculateConfidenceResponse = oswAPI.oswConfidenceCalculate(uploadedDatasetId);

    await expect(calculateConfidenceResponse).rejects.toMatchObject({ response: { status: 401 } });
  })
});

describe('Check confidence request job completion status', () => {
  jest.retryTimes(1, { logErrorsBeforeRetry: true });

  it('Admin | Authenticated , When request made, should respond with job status', async () => {
    let generalAPI = new GeneralApi(configuration);
    await new Promise((r) => setTimeout(r, 10000));
    let confidenceStatus = await generalAPI.listJobs(confidenceJobId.toString());

    expect(confidenceStatus.status).toBe(200);

    expect(confidenceStatus.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          job_id: expect.toBeOneOf([`${confidenceJobId}`]),
          status: expect.toBeOneOf(["COMPLETED"])
        })
      ])
    );
  }, 15000);

  it('Admin | un-authenticated , When request made, should respond with unauthenticated request', async () => {
    let generalAPI = new GeneralApi(Utility.getConfiguration());
    let confidenceStatusResponse = generalAPI.listJobs(confidenceJobId);

    await expect(confidenceStatusResponse).rejects.toMatchObject({ response: { status: 401 } });
  });
});

describe('List OSW Versions', () => {
  it('Admin | Authenticated , When request made, should respond with OSW version list', async () => {
    let oswAPI = new OSWApi(configuration);

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
    let oswAPI = new OSWApi(Utility.getConfiguration());

    let oswVersionsResponse = oswAPI.listOswVersions();

    await expect(oswVersionsResponse).rejects.toMatchObject({ response: { status: 401 } });
  })
});

describe('Convert dataset request', () => {
  it('Admin | Authenticated , When request made with valid dataset, should return request job id as response', async () => {
    let oswAPI = new OSWApi(configuration);
    let oswBlob = Utility.getOSWBlob();

    const convertInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => oswConvertRequestInterceptor(req, 'osw-valid.zip'))
    let formatResponse = await oswAPI.oswOnDemandFormatForm("osw", "osm", oswBlob);

    expect(formatResponse.status).toBe(202);
    expect(formatResponse.data).toBeNumber();
    convertJobId = formatResponse.data!;
    console.log("convert job_id", convertJobId);
    axios.interceptors.request.eject(convertInterceptor);
  });

  it('Admin | un-authenticated , When request made with dataset, should return with unauthenticated request', async () => {
    let oswAPI = new OSWApi(Utility.getConfiguration());
    let oswBlob = Utility.getOSWBlob();

    const convertInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => oswConvertRequestInterceptor(req, 'osw-valid.zip'))
    let formatResponse = oswAPI.oswOnDemandFormatForm("osw", "osm", oswBlob);

    await expect(formatResponse).toReject();
    axios.interceptors.request.eject(convertInterceptor);
  });

});

describe('Check convert request job completion status', () => {
  jest.retryTimes(1, { logErrorsBeforeRetry: true });

  it('Admin | Authenticated , When request made, should respond with job status', async () => {
    let generalAPI = new GeneralApi(configuration);
    await new Promise((r) => setTimeout(r, 20000));

    let formatStatus = await generalAPI.listJobs(convertJobId);

    expect(formatStatus.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          job_id: expect.toBeOneOf([`${convertJobId}`]),
          status: expect.toBeOneOf(["COMPLETED"])
        })
      ])
    );
  }, 35000);

  it('Admin | un-authenticated , When request made, should respond with unauthenticated request', async () => {
    let generalAPI = new GeneralApi(Utility.getConfiguration());

    let formatStatusResponse = generalAPI.listJobs(convertJobId);

    await expect(formatStatusResponse).rejects.toMatchObject({ response: { status: 401 } });
  });

})

describe('Download converted file', () => {
  jest.retryTimes(1, { logErrorsBeforeRetry: true });
  it('Admin | Authenticated , When request made with tdei_dataset_id, should stream the zip file', async () => {
    let generalAPI = new GeneralApi(configuration);

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
    let generalAPI = new GeneralApi(Utility.getConfiguration());

    let downloadResponse = generalAPI.jobDownload(convertJobId);

    await expect(downloadResponse).rejects.toMatchObject({ response: { status: 401 } });
  });

});

describe('Download OSW File as zip', () => {
  it('Admin | Authenticated , When request made with tdei_dataset_id, should stream the zip file', async () => {

    // let oswRecordId = 'b52ca07e81174b978d3c9baef4198c87';
    let oswAPI = new OSWApi(configuration);

    let response = await oswAPI.getOswFile(uploadedDatasetId, "osw", "latest", { responseType: 'arraybuffer' });
    const data: any = response.data;
    const contentType = response.headers['content-type'];
    const zip = new AdmZip(data);
    const entries = zip.getEntries();

    expect(entries.length).toBeGreaterThanOrEqual(2);
    expect(contentType).toBe("application/zip");
    expect(response.data).not.toBeNull();
    expect(response.status).toBe(200);
  }, 10000);

  it('Admin | Authenticated , When request made with invalid tdei_dataset_id, should respond with bad request', async () => {

    let oswRecordId = 'dummyRecordId';
    let oswAPI = new OSWApi(configuration);

    let response = oswAPI.getOswFile(oswRecordId);

    await expect(response).rejects.toMatchObject({ response: { status: 404 } });

  });

  it('Admin | un-authenticated , When request made with tdei_dataset_id, should respond with unauthenticated request', async () => {

    let oswAPI = new OSWApi(Utility.getConfiguration());

    let response = oswAPI.getOswFile(uploadedDatasetId);

    await expect(response).rejects.toMatchObject({ response: { status: 401 } });

  });
});

let bboxRecordId = 'f5fd7445fbbf4f248ea1096f0e17b7b3';
describe('Dataset Bbox Request', () => {

  it('Admin | Authenticated , When request made with valid dataset, should return request job id as response', async () => {
    let oswAPI = new OSWApi(configuration);

    let bboxRequest = await oswAPI.datasetBbox(bboxRecordId, 'osm', [-122.264913, 47.558543, -122.10549, 47.691327]);

    expect(bboxRequest.status).toBe(202);
    expect(bboxRequest.data).toBeNumber();
    datasetBboxJobId = bboxRequest.data!;
    console.log("dataset bbox job_id", datasetBboxJobId);
  });

  it('Admin | un-authenticated , When request made with dataset, should return with unauthenticated request', async () => {
    let oswAPI = new OSWApi(Utility.getConfiguration());

    let bboxRequest = oswAPI.datasetBbox(bboxRecordId, 'osm', [-122.264913, 47.558543, -122.10549, 47.691327]);

    await expect(bboxRequest).rejects.toMatchObject({ response: { status: 401 } });
  });

});

describe('Check dataset-bbox request job completion status', () => {
  jest.retryTimes(1, { logErrorsBeforeRetry: true });
  it('Admin | Authenticated , When request made, should respond with job status', async () => {
    let generalAPI = new GeneralApi(configuration);
    await new Promise((r) => setTimeout(r, 40000));

    let formatStatus = await generalAPI.listJobs(datasetBboxJobId);

    expect(formatStatus.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          job_id: expect.toBeOneOf([`${datasetBboxJobId}`]),
          status: expect.toBeOneOf(["COMPLETED"])
        })
      ])
    );
  }, 45000);

  it('Admin | un-authenticated , When request made, should respond with unauthenticated request', async () => {
    let generalAPI = new GeneralApi(Utility.getConfiguration());

    let bboxStatusResponse = generalAPI.listJobs(datasetBboxJobId);

    await expect(bboxStatusResponse).rejects.toMatchObject({ response: { status: 401 } });
  });

});

describe('Download Dataset Bbox request file', () => {

  it('Admin | Authenticated , When request made with tdei_dataset_id, should stream the zip file', async () => {
    let generalAPI = new GeneralApi(configuration);

    let response = await generalAPI.jobDownload(datasetBboxJobId, { responseType: 'arraybuffer' });
    const data: any = response.data;
    const contentType = response.headers['content-type'];

    expect(contentType).toBeOneOf(["application/xml", "application/zip"]);
    expect(response.data).not.toBeNull();
    expect(response.status).toBe(200);
    if (contentType === "application/zip") {
      const zip = new AdmZip(data);
      const entries = zip.getEntries();
      expect(entries.length).toBeGreaterThan(1);
    }
  }, 20000);

  it('Admin | un-authenticated , When request made with tdei_dataset_id, should respond with unauthenticated request', async () => {
    let generalAPI = new GeneralApi(Utility.getConfiguration());

    let downloadResponse = generalAPI.jobDownload(datasetBboxJobId);

    await expect(downloadResponse).rejects.toMatchObject({ response: { status: 401 } });
  });

});

let datasetTagSourceRecordId = 'f5fd7445fbbf4f248ea1096f0e17b7b3';
let datasetTagTargetRecordId = 'f5fd7445fbbf4f248ea1096f0e17b7b3';
let datasetRoadTagJobId = '1';
describe('Dataset Road Tag Request', () => {

  it('Admin | Authenticated , When request made with valid dataset, should return request job id as response', async () => {
    let oswAPI = new OSWApi(configuration);

    let bboxRequest = await oswAPI.datasetTagRoad(datasetTagSourceRecordId, datasetTagTargetRecordId);

    expect(bboxRequest.status).toBe(202);
    expect(bboxRequest.data).toBeNumber();
    datasetRoadTagJobId = bboxRequest.data!;
    console.log("dataset road tag job_id", datasetBboxJobId);
  });

  it('Admin | un-authenticated , When request made with dataset, should return with unauthenticated request', async () => {
    let oswAPI = new OSWApi(Utility.getConfiguration());

    let bboxRequest = oswAPI.datasetTagRoad(datasetTagSourceRecordId, datasetTagTargetRecordId);

    await expect(bboxRequest).rejects.toMatchObject({ response: { status: 401 } });
  });

});

describe('Check dataset-road-tag request job completion status', () => {
  jest.retryTimes(1, { logErrorsBeforeRetry: true });

  it('Admin | Authenticated , When request made, should respond with job status', async () => {
    let generalAPI = new GeneralApi(configuration);
    await new Promise((r) => setTimeout(r, 40000));

    let formatStatus = await generalAPI.listJobs(datasetBboxJobId);

    expect(formatStatus.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          job_id: expect.toBeOneOf([`${datasetBboxJobId}`]),
          status: expect.toBeOneOf(["COMPLETED"])
        })
      ])
    );
  }, 45000);

  it('Admin | un-authenticated , When request made, should respond with unauthenticated request', async () => {
    let generalAPI = new GeneralApi(Utility.getConfiguration());

    let bboxStatusResponse = generalAPI.listJobs(datasetBboxJobId);

    await expect(bboxStatusResponse).rejects.toMatchObject({ response: { status: 401 } });
  });

});

describe('Download Dataset Road Tag request file', () => {

  it('Admin | Authenticated , When request made with tdei_dataset_id, should stream the zip file', async () => {
    let generalAPI = new GeneralApi(configuration);

    let response = await generalAPI.jobDownload(datasetBboxJobId, { responseType: 'arraybuffer' });
    const data: any = response.data;
    const contentType = response.headers['content-type'];

    expect(contentType).toBeOneOf(["application/xml", "application/zip"]);
    expect(response.data).not.toBeNull();
    expect(response.status).toBe(200);
    if (contentType === "application/zip") {
      const zip = new AdmZip(data);
      const entries = zip.getEntries();
      expect(entries.length).toBeGreaterThan(1);
    }
  }, 20000);

  it('Admin | un-authenticated , When request made with tdei_dataset_id, should respond with unauthenticated request', async () => {
    let generalAPI = new GeneralApi(Utility.getConfiguration());

    let downloadResponse = generalAPI.jobDownload(datasetBboxJobId);

    await expect(downloadResponse).rejects.toMatchObject({ response: { status: 401 } });
  });

});

//This test should be ran at last as it will invalidate the uploaded file
describe('Invalidate the OSW file', () => {

  it('Admin | Authenticated , When request made, should return true if successful', async () => {
    let generalAPI = new GeneralApi(configuration);

    let downloadResponse = generalAPI.deleteDataset(uploadedDatasetId);

    await expect((await downloadResponse).status).toBe(200);
  });

  it('Admin | un-authenticated , When request made with dataset, should return with unauthenticated request', async () => {
    let generalAPI = new GeneralApi(Utility.getConfiguration());

    let downloadResponse = generalAPI.deleteDataset(uploadedDatasetId);

    await expect(downloadResponse).rejects.toMatchObject({ response: { status: 401 } });
  });
});
