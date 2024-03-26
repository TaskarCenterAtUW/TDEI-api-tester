import { AuthenticationApi, OSWApi, VersionSpec, JobDetails, GeneralApi } from "tdei-client";
import axios, { InternalAxiosRequestConfig } from "axios";
import { Utility } from "../utils";
import AdmZip from "adm-zip";
import { toBeNumber } from "jest-extended";


describe('OSW service', () => {
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
    describe('Functional', () => {
      it('When passed with valid token, metafile and changeset, should return 202 status with recordId in response', async () => {
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

      it('When passed with valid token, dataset and invalid metafile, should return 400 status with errors', async () => {
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
    });
    describe('Validation', () => {
      it('When passed with invalid token, metafile and changeset, should return 401 status with recordId in response', async () => {
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
  });

  describe('Get Upload Status', () => {
    jest.retryTimes(1, { logErrorsBeforeRetry: true });
    it('When passed without valid token, should respond with 401 status', async () => {
      let generalAPI = new GeneralApi(Utility.getConfiguration());

      let downloadResponse = generalAPI.listJobs(uploadedJobId);

      await expect(downloadResponse).rejects.toMatchObject({ response: { status: 401 } });
    });


    it('When passed with valid token, should respond with 200 status', async () => {
      let generalAPI = new GeneralApi(configuration);
      await new Promise((r) => setTimeout(r, 80000));
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
    }, 85000);
  });

  describe('Publish the OSW dataset for the tdei_dataset_id', () => {
    it('When passed with valid token and valid tdei_dataset_id, should return a string', async () => {

      let oswAPI = new OSWApi(configuration);
      let publishOsw = await oswAPI.publishOswFile(uploadedDatasetId);
      expect(publishOsw.status).toBe(202);
      expect(publishOsw.data).toBeNumber();
      publishJobId = publishOsw.data;
      console.log("publish job_id", publishJobId);
    });

    it('When passed with already published tdei_dataset_id, should respond with 400 status', async () => {

      let oswAPI = new OSWApi(configuration);
      let tdei_dataset_id = "40566429d02c4c80aee68c970977bed8";

      let publishOswResponse = oswAPI.publishOswFile(tdei_dataset_id);

      await expect(publishOswResponse).rejects.toMatchObject({ response: { status: 400 } });
    })

    it('When passed without valid token, should respond with 401 status', async () => {
      let oswAPI = new OSWApi(Utility.getConfiguration());

      let publishOswResponse = oswAPI.publishOswFile(uploadedDatasetId);

      await expect(publishOswResponse).rejects.toMatchObject({ response: { status: 401 } });
    })
  });

  describe('Get Publish Status', () => {
    jest.retryTimes(1, { logErrorsBeforeRetry: true });
    it('When passed without valid token, should respond with 401 status', async () => {
      let generalAPI = new GeneralApi(Utility.getConfiguration());

      let downloadResponse = generalAPI.listJobs(publishJobId);

      await expect(downloadResponse).rejects.toMatchObject({ response: { status: 401 } });
    })


    it('When passed with valid token, should respond with 200 status', async () => {
      let generalAPI = new GeneralApi(configuration);
      await new Promise((r) => setTimeout(r, 130000));

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
    }, 135000);
  });

  describe('Validate OSW dataset', () => {
    describe('Functional', () => {
      it('When passed with valid dataset, should return 202 status with job_id in response', async () => {
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
    });

    describe('Validation', () => {
      it('When passed with invalid token, dataset, should return 401 status with recordId in response', async () => {
        let oswAPI = new OSWApi(Utility.getConfiguration());
        let dataset = Utility.getOSWBlob();

        const validateInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => oswValidateRequestInterceptor(req, 'osw-valid.zip'))
        const uploadFileResponse = oswAPI.validateOswFileForm(dataset);

        await expect(uploadFileResponse).toReject();
        axios.interceptors.request.eject(validateInterceptor);

      }, 20000);

    });
  });

  describe('Validate Status', () => {
    jest.retryTimes(1, { logErrorsBeforeRetry: true });
    it('When passed without valid token, should respond with 401 status', async () => {
      let generalAPI = new GeneralApi(Utility.getConfiguration());
      let validateStatusResponse = generalAPI.listJobs(validationJobId);
      await expect(validateStatusResponse).rejects.toMatchObject({ response: { status: 401 } });
    })

    it('When passed with valid token, should respond with 200 status', async () => {
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
  });

  describe('Calculate Confidence', () => {

    it('When passed without valid token, should respond with 401 status', async () => {
      let oswAPI = new OSWApi(Utility.getConfiguration());

      let calculateConfidenceResponse = oswAPI.oswConfidenceCalculate(uploadedDatasetId);

      await expect(calculateConfidenceResponse).rejects.toMatchObject({ response: { status: 401 } });
    })

    it('When passed with invalid tdei_dataset_id, should respond with 404 status', async () => {
      let oswAPI = new OSWApi(configuration);

      let calculateConfidence = oswAPI.oswConfidenceCalculate("dummytdeirecordid");

      await expect(calculateConfidence).rejects.toMatchObject({ response: { status: 404 } });
    })

    it('When passed with valid token, should respond with 202 status', async () => {
      let oswAPI = new OSWApi(configuration);

      let calculateConfidence = await oswAPI.oswConfidenceCalculate(uploadedDatasetId);

      expect(calculateConfidence.status).toBe(202);

      expect(calculateConfidence.data).toBeNumber();

      confidenceJobId = calculateConfidence.data;
      console.log("confidence job_id", confidenceJobId);
    });
  });

  describe('Confidence Status', () => {
    jest.retryTimes(1, { logErrorsBeforeRetry: true });

    it('When passed without valid token, should respond with 401 status', async () => {
      let generalAPI = new GeneralApi(Utility.getConfiguration());
      let confidenceStatusResponse = generalAPI.listJobs(confidenceJobId);

      await expect(confidenceStatusResponse).rejects.toMatchObject({ response: { status: 401 } });
    })



    it('When passed with valid token and valid job id, should respond with 200 status', async () => {
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
  });

  describe('List OSW Versions', () => {
    it('When passed with valid token, should respond with 200 status', async () => {
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

    it('When passed without valid token, should respond with 401 status', async () => {
      let oswAPI = new OSWApi(Utility.getConfiguration());

      let oswVersionsResponse = oswAPI.listOswVersions();

      await expect(oswVersionsResponse).rejects.toMatchObject({ response: { status: 401 } });
    })
  });

  describe('Convert Request', () => {
    it('When passed without valid token, should respond with 401 status', async () => {
      let oswAPI = new OSWApi(Utility.getConfiguration());
      let oswBlob = Utility.getOSWBlob();

      const convertInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => oswConvertRequestInterceptor(req, 'osw-valid.zip'))
      let formatResponse = oswAPI.oswOnDemandFormatForm("osw", "osm", oswBlob);

      await expect(formatResponse).toReject();
      axios.interceptors.request.eject(convertInterceptor);
    });

    it('When passed with valid token, should respond with job_id', async () => {
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
  });

  describe('Fetch Convert Request Status', () => {
    jest.retryTimes(1, { logErrorsBeforeRetry: true });
    it('When passed without valid token, should respond with 401 status', async () => {
      let generalAPI = new GeneralApi(Utility.getConfiguration());

      let formatStatusResponse = generalAPI.listJobs(convertJobId);

      await expect(formatStatusResponse).rejects.toMatchObject({ response: { status: 401 } });
    });

    it('When passed with valid token and job_id. should respond with 200 status', async () => {
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
  })

  describe('Download converted file', () => {
    it('When passed without valid token, should respond with 401 status', async () => {
      let generalAPI = new GeneralApi(Utility.getConfiguration());

      let downloadResponse = generalAPI.jobDownload(convertJobId);

      await expect(downloadResponse).rejects.toMatchObject({ response: { status: 401 } });
    });

    it('When passed valid token, should respond with 200 status and stream', async () => {
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
  });

  describe('Download OSW File as zip', () => {
    describe('Functional', () => {
      it('When passed with valid recordId, should be able to get the zip file', async () => {

        // let oswRecordId = 'b52ca07e81174b978d3c9baef4198c87';
        let oswAPI = new OSWApi(configuration);

        let response = await oswAPI.getOswFile(uploadedDatasetId, "osw", { responseType: 'arraybuffer' });
        const data: any = response.data;
        const contentType = response.headers['content-type'];
        const zip = new AdmZip(data);
        const entries = zip.getEntries();

        expect(entries.length).toBeGreaterThanOrEqual(2);
        expect(contentType).toBe("application/zip");
        expect(response.data).not.toBeNull();
        expect(response.status).toBe(200);
      }, 10000);
    });

    describe('Validation', () => {
      it('When passed with valid recordId and invalid token, should return 401 status', async () => {

        let oswAPI = new OSWApi(Utility.getConfiguration());

        let response = oswAPI.getOswFile(uploadedDatasetId);

        await expect(response).rejects.toMatchObject({ response: { status: 401 } });

      })

      it('When passed with invalid record and valid token, should return 404 status', async () => {

        let oswRecordId = 'dummyRecordId';
        let oswAPI = new OSWApi(configuration);

        let response = oswAPI.getOswFile(oswRecordId);

        await expect(response).rejects.toMatchObject({ response: { status: 404 } });

      })
    });
  });

  let flatteningRecordId = 'b89494ba9b2d48b9a961135aea3f0211';
  let bboxRecordId = 'f5fd7445fbbf4f248ea1096f0e17b7b3';
  let dataFlatteningJobId = "1";
  describe('Dataset Flattening', () => {

    it('When passed without valid token, should respond with 401 status', async () => {
      let oswAPI = new OSWApi(Utility.getConfiguration());

      let datasetFlatternByIdRequest = oswAPI.datasetflattenById(flatteningRecordId);

      await expect(datasetFlatternByIdRequest).rejects.toMatchObject({ response: { status: 401 } });
    })

    it('When passed with invalid tdei_dataset_id, should respond with 404 status', async () => {
      let oswAPI = new OSWApi(configuration);

      let datasetFlatternByIdRequest = oswAPI.datasetflattenById("test_flatteningRecordId");

      await expect(datasetFlatternByIdRequest).rejects.toMatchObject({ response: { status: 404 } });
    });

    it('When passed with valid token, should respond with 202 status', async () => {
      let oswAPI = new OSWApi(configuration);

      let datasetFlatternByIdRequest = await oswAPI.datasetflattenById(flatteningRecordId, true);

      expect(datasetFlatternByIdRequest.status).toBe(202);

      expect(datasetFlatternByIdRequest.data).toBeNumber();

      dataFlatteningJobId = datasetFlatternByIdRequest.data!;
      console.log("dataset flattening job_id", dataFlatteningJobId);
    });

    it('When requesting for already flattened dataset without override flag, should respond with 400 status', async () => {
      let oswAPI = new OSWApi(configuration);

      let datasetFlatternByIdRequest = oswAPI.datasetflattenById(bboxRecordId);

      await expect(datasetFlatternByIdRequest).rejects.toMatchObject({ response: { status: 400 } });
    });
  });

  describe('Dataset Flattening Status', () => {
    jest.retryTimes(1, { logErrorsBeforeRetry: true });
    it('When passed without valid token, should respond with 401 status', async () => {
      let generalAPI = new GeneralApi(Utility.getConfiguration());
      let job_id = "1";
      let flatteningStatusRequest = generalAPI.listJobs(job_id);

      await expect(flatteningStatusRequest).rejects.toMatchObject({ response: { status: 401 } });
    });

    it('When passed with valid token and valid job id, should respond with 200 status', async () => {
      let generalAPI = new GeneralApi(configuration);
      await new Promise((r) => setTimeout(r, 20000));
      let flatteningStatus = await generalAPI.listJobs(dataFlatteningJobId.toString());

      expect(flatteningStatus.status).toBe(200);

      expect(flatteningStatus.data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            job_id: expect.toBeOneOf([`${dataFlatteningJobId}`]),
            status: expect.toBeOneOf(["COMPLETED"])
          })
        ])
      );
    }, 25000);
  });

  describe('Dataset Bbox Request', () => {
    it('When passed without valid token, should respond with 401 status', async () => {
      let oswAPI = new OSWApi(Utility.getConfiguration());

      let bboxRequest = oswAPI.datasetBbox(bboxRecordId, [-122.264913, 47.558543, -122.10549, 47.691327]);

      await expect(bboxRequest).rejects.toMatchObject({ response: { status: 401 } });
    });

    it('When passed with valid token, should respond with job_id', async () => {
      let oswAPI = new OSWApi(configuration);

      let bboxRequest = await oswAPI.datasetBbox(bboxRecordId, [-122.264913, 47.558543, -122.10549, 47.691327]);

      expect(bboxRequest.status).toBe(202);
      expect(bboxRequest.data).toBeNumber();
      datasetBboxJobId = bboxRequest.data!;
      console.log("dataset bbox job_id", datasetBboxJobId);
    });
  });

  describe('Fetch Dataset Bbox Request Status', () => {
    jest.retryTimes(1, { logErrorsBeforeRetry: true });
    it('When passed without valid token, should respond with 401 status', async () => {
      let generalAPI = new GeneralApi(Utility.getConfiguration());

      let bboxStatusResponse = generalAPI.listJobs(datasetBboxJobId);

      await expect(bboxStatusResponse).rejects.toMatchObject({ response: { status: 401 } });
    });

    it('When passed with valid token and job_id. should respond with 200 status', async () => {
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
  });

  describe('Download Dataset Bbox request file', () => {
    it('When passed without valid token, should respond with 401 status', async () => {
      let generalAPI = new GeneralApi(Utility.getConfiguration());

      let downloadResponse = generalAPI.jobDownload(datasetBboxJobId);

      await expect(downloadResponse).rejects.toMatchObject({ response: { status: 401 } });
    });

    it('When passed valid token, should respond with 200 status and stream', async () => {
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
  });

  //This test should be ran at last as it will invalidate the uploaded file
  describe('Invalidate the OSW file', () => {

    it('When passed with valid token, should respond with 200 status', async () => {
      let generalAPI = new GeneralApi(configuration);

      let downloadResponse = generalAPI.deleteDataset(uploadedDatasetId);

      await expect((await downloadResponse).status).toBe(200);
    });

    it('When passed without valid token, should respond with 401 status', async () => {
      let generalAPI = new GeneralApi(Utility.getConfiguration());

      let downloadResponse = generalAPI.deleteDataset(uploadedDatasetId);

      await expect(downloadResponse).rejects.toMatchObject({ response: { status: 401 } });
    });
  });
});
