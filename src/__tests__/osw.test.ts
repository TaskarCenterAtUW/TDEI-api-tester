import { AuthenticationApi, OSWApi, OSWConfidenceStatus, OswDownload, OSWFormatStatusResponse, RecordPublishStatus, RecordUploadStatus, ValidationStatus, VersionSpec, OSWConfidenceResponse, OswDownloadStatusEnum, OswDownloadCollectionMethodEnum, OswDownloadDataSourceEnum, OSWFormatResponse } from "tdei-client";
import axios, { InternalAxiosRequestConfig } from "axios";
import { Utility } from "../utils";
import * as fs from "fs";
import AdmZip from "adm-zip";
import exp from "constants";


describe('OSW service', () => {
  let configuration = Utility.getConfiguration();
  const NULL_PARAM = void 0;
  let uploadedTdeiRecordId: string = '';
  let confidenceJobId: number = 1;
  let convertJobId: string = '1';
  let validationJobId: string = '1';

  const oswUploadRequestInterceptor = (request: InternalAxiosRequestConfig, tdei_project_group_id: string, service_id: string, datasetName: string, changestName: string, metafileName: string) => {
    // console.log("AAAAAA");
    // console.log(request.url);
    if (
      request.url === `${configuration.basePath}/api/v1/osw/upload/${tdei_project_group_id}/${service_id}`
    ) {
      // console.log('Applying stuff');
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
        let metaToUpload = Utility.getOSWMetadataBlob();
        let changesetToUpload = Utility.getChangesetBlob();
        let dataset = Utility.getOSWBlob();
        let tdei_project_group_id = '0c29017c-f0b9-433e-ae13-556982f2520b';
        let service_id = 'f5002a09-3ac1-4353-bb67-cb7a7c6fcc40';
        let derived_from_dataset_id = 'a042a1b3aa874701929cb33a98f28e9d';
        try {
          const uploadInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => oswUploadRequestInterceptor(req, tdei_project_group_id, service_id, 'osw-valid.zip', 'changeset.txt', 'metadata.json'))
          const uploadFileResponse = await oswAPI.uploadOswFileForm(dataset, metaToUpload, changesetToUpload, tdei_project_group_id, service_id, derived_from_dataset_id);

          expect(uploadFileResponse.status).toBe(202);
          expect(uploadFileResponse.data).not.toBeNull();
          uploadedTdeiRecordId = uploadFileResponse.data;
          console.log("uploaded tdei_record_id", uploadedTdeiRecordId);
          axios.interceptors.request.eject(uploadInterceptor);
        } catch (e) {
          console.log(e);
        }
      }, 20000);

      it('When passed with valid token, dataset and invalid metafile, should return 400 status with errors', async () => {
        let oswAPI = new OSWApi(configuration);
        let metaToUpload = Utility.getInvalidOSWMetadataBlob();
        let changesetToUpload = Utility.getChangesetBlob();
        let dataset = Utility.getOSWBlob();
        let tdei_project_group_id = '0c29017c-f0b9-433e-ae13-556982f2520b';
        let service_id = 'f5002a09-3ac1-4353-bb67-cb7a7c6fcc40';
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
        let metaToUpload = Utility.getOSWMetadataBlob();
        let changesetToUpload = Utility.getChangesetBlob();
        let dataset = Utility.getOSWBlob();
        let tdei_project_group_id = '0c29017c-f0b9-433e-ae13-556982f2520b';
        let service_id = 'f5002a09-3ac1-4353-bb67-cb7a7c6fcc40';

        const uploadInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => oswUploadRequestInterceptor(req, tdei_project_group_id, service_id, 'osw-valid.zip', 'changeset.txt', 'metadata.json'))
        const uploadFileResponse = oswAPI.uploadOswFileForm(dataset, metaToUpload, changesetToUpload, tdei_project_group_id, service_id)

        await expect(uploadFileResponse).rejects.toMatchObject({ response: { status: 401 } });
        axios.interceptors.request.eject(uploadInterceptor);

      }, 20000)

    });
  });

  describe('Get Upload Status', () => {
    it('When passed without valid token, should respond with 401 status', async () => {
      let oswAPI = new OSWApi(Utility.getConfiguration());

      let downloadResponse = oswAPI.getUploadStatus(uploadedTdeiRecordId);

      await expect(downloadResponse).rejects.toMatchObject({ response: { status: 401 } });
    });


    it('When passed with valid token, should respond with 200 status', async () => {
      let oswAPI = new OSWApi(configuration);
      await new Promise((r) => setTimeout(r, 40000));

      let uploadStatus = await oswAPI.getUploadStatus(uploadedTdeiRecordId);
      expect(uploadStatus.status).toBe(200);
      expect(uploadStatus.data).toMatchObject(<RecordUploadStatus>{
        tdei_record_id: expect.any(String),
        stage: expect.any(String),
        status: expect.toBeOneOf([undefined, null, expect.any(String)]),
        completed: expect.any(Boolean)
      })
    }, 45000);
  });

  describe('Publish the OSW dataset for the tdei_record_id', () => {
    it('When passed with valid token and valid tdei_record_id, should return a string', async () => {

      let oswAPI = new OSWApi(configuration);
      let publishOsw = await oswAPI.publishOswFile(uploadedTdeiRecordId);
      expect(publishOsw.status).toBe(202);
      expect(publishOsw.data).not.toBeNull();
    });

    it('When passed with already published tdei_record_id, should respond with 400 status', async () => {

      let oswAPI = new OSWApi(configuration);
      let tdei_record_id = "93e39bfc527d4a25a1d8af54695aa05d";

      let publishOswResponse = oswAPI.publishOswFile(tdei_record_id);

      await expect(publishOswResponse).rejects.toMatchObject({ response: { status: 400 } });
    })

    it('When passed without valid token, should respond with 401 status', async () => {
      let oswAPI = new OSWApi(Utility.getConfiguration());

      let publishOswResponse = oswAPI.publishOswFile(uploadedTdeiRecordId);

      await expect(publishOswResponse).rejects.toMatchObject({ response: { status: 401 } });
    })
  });

  describe('Get Publish Status', () => {
    it('When passed without valid token, should respond with 401 status', async () => {
      let oswAPI = new OSWApi(Utility.getConfiguration());

      let downloadResponse = oswAPI.getPublishStatus(uploadedTdeiRecordId);

      await expect(downloadResponse).rejects.toMatchObject({ response: { status: 401 } });
    })


    it('When passed with valid token, should respond with 200 status', async () => {
      let oswAPI = new OSWApi(configuration);
      await new Promise((r) => setTimeout(r, 60000));

      let uploadStatus = await oswAPI.getPublishStatus(uploadedTdeiRecordId);

      expect(uploadStatus.status).toBe(200);
      expect(uploadStatus.data).toMatchObject(<RecordPublishStatus>{
        tdei_record_id: expect.any(String),
        stage: expect.any(String),
        status: expect.any(String),
        published: expect.any(Boolean)
      })
    }, 65000);
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

        await expect(uploadFileResponse).rejects.toMatchObject({ response: { status: 401 } });
        axios.interceptors.request.eject(validateInterceptor);

      }, 20000);

    });
  });

  describe('Validate Status', () => {
    it('When passed without valid token, should respond with 401 status', async () => {
      let oswAPI = new OSWApi(Utility.getConfiguration());
      let validateStatusResponse = oswAPI.getValidateStatus(validationJobId);
      await expect(validateStatusResponse).rejects.toMatchObject({ response: { status: 401 } });
    })

    it('When passed with valid token, should respond with 200 status', async () => {
      let oswAPI = new OSWApi(configuration);

      await new Promise((r) => setTimeout(r, 50000));
      let validateStatus = await oswAPI.getValidateStatus(validationJobId);

      expect(validateStatus.status).toBe(200);
      expect(validateStatus.data).toMatchObject(<ValidationStatus>{
        job_id: expect.any(String),
        status: expect.any(String),
        updated_at: expect.any(String),
      });
    }, 55000);
  });

  describe('List Files', () => {
    describe('Functional', () => {
      it('When passed with valid token, should return 200 status with list of osw records', async () => {
        let oswAPI = new OSWApi(configuration);

        const oswFiles = await oswAPI.listOswFiles();

        expect(oswFiles.status).toBe(200);

        expect(Array.isArray(oswFiles.data)).toBe(true);

        oswFiles.data.forEach(file => {
          expect(file).toMatchObject(<OswDownload>{
            status: expect.toBeOneOf([OswDownloadStatusEnum.PreRelease.toString(), OswDownloadStatusEnum.Publish.toString()]),
            name: expect.any(String),
            description: expect.toBeOneOf([null, expect.any(String)]),
            version: expect.any(String),
            derived_from_dataset_id: expect.toBeOneOf([null, expect.any(String)]),
            custom_metadata: expect.anything(),
            uploaded_timestamp: expect.any(String),
            tdei_project_group_id: expect.any(String),
            collected_by: expect.any(String),
            collection_date: expect.any(String),
            collection_method: expect.toBeOneOf([
              OswDownloadCollectionMethodEnum.Generated.toString(),
              OswDownloadCollectionMethodEnum.Other.toString(),
              OswDownloadCollectionMethodEnum.Transform.toString(),
              OswDownloadCollectionMethodEnum.Manual.toString()]),
            valid_from: expect.any(String),
            valid_to: expect.toBeOneOf([null, expect.any(String)]),
            confidence_level: expect.any(Number),
            data_source: expect.toBeOneOf([
              OswDownloadDataSourceEnum.InHouse.toString(),
              OswDownloadDataSourceEnum.TDEITools.toString(),
              OswDownloadDataSourceEnum._3rdParty.toString()]),
            dataset_area: expect.toBeOneOf([null, expect.toBeObject()]),
            tdei_record_id: expect.any(String),
            osw_schema_version: expect.any(String),
            download_url: expect.any(String)
          });
        });
      });


      it('When passed with valid token and page size, should return 200 status with files less than or equal to 5', async () => {
        let oswAPI = new OSWApi(configuration);
        let page_size = 5;

        const oswFiles = await oswAPI.listOswFiles(
          NULL_PARAM, // bbox?: number[] | undefined, 
          NULL_PARAM,// name?: string | undefined, 
          NULL_PARAM,// version?: string | undefined, 
          NULL_PARAM,// data_source?: string | undefined, 
          NULL_PARAM,// collection_method?: string | undefined, 
          NULL_PARAM,// collected_by?: string | undefined, 
          NULL_PARAM,// derived_from_dataset_id?: string | undefined, 
          NULL_PARAM,// collection_date?: string | undefined, 
          NULL_PARAM,// confidence_level?: number | undefined, 
          NULL_PARAM,// status?: string | undefined, 
          NULL_PARAM,// osw_schema_version?: string | undefined, 
          NULL_PARAM,// tdei_project_group_id?: string | undefined, 
          NULL_PARAM,// valid_from?: string | undefined, 
          NULL_PARAM,// valid_to?: string | undefined, 
          NULL_PARAM,// tdei_record_id?: string | undefined, 
          NULL_PARAM,// page_no?: number | undefined, 
          page_size,// page_size?: number | undefined, 
          // options?: AxiosRequestConfig<...> | undefined
        );

        expect(oswFiles.status).toBe(200);
        expect(oswFiles.data.length).toBeLessThanOrEqual(page_size);


      });

      it('When passed with valid token and valid project group ID, should return 200 status with files of the same project group', async () => {
        let oswAPI = new OSWApi(configuration);
        //TODO: read from seeder or config
        let project_group_id = '5e339544-3b12-40a5-8acd-78c66d1fa981';

        const oswFiles = await oswAPI.listOswFiles(
          NULL_PARAM,// bbox?: number[] | undefined, 
          NULL_PARAM,// name?: string | undefined, 
          NULL_PARAM,// version?: string | undefined, 
          NULL_PARAM,// data_source?: string | undefined, 
          NULL_PARAM,// collection_method?: string | undefined, 
          NULL_PARAM,// collected_by?: string | undefined, 
          NULL_PARAM,// derived_from_dataset_id?: string | undefined, 
          NULL_PARAM,// collection_date?: string | undefined, 
          NULL_PARAM,// confidence_level?: number | undefined, 
          "All",// status?: string | undefined, 
          NULL_PARAM,// osw_schema_version?: string | undefined, 
          project_group_id// tdei_project_group_id?: string | undefined, 
          // valid_from?: string | undefined, 
          // valid_to?: string | undefined, 
          // tdei_record_id?: string | undefined, 
          // page_no?: number | undefined, 
          // page_size?: number | undefined, 
          // options?: AxiosRequestConfig<...> | undefined
        );

        expect(oswFiles.status).toBe(200);
        oswFiles.data.forEach(file => {
          expect(file.tdei_project_group_id).toBe(project_group_id)
        })

      });

      it('When passed with valid token and valid recordId, should return 200 status with same record ID', async () => {
        let oswAPI = new OSWApi(configuration);
        let recordId = "fb0ae8ed553e40b99112dec89c309445";

        const oswFiles = await oswAPI.listOswFiles(
          NULL_PARAM, // bbox?: number[] | undefined, 
          NULL_PARAM,// name?: string | undefined, 
          NULL_PARAM,// version?: string | undefined, 
          NULL_PARAM,// data_source?: string | undefined, 
          NULL_PARAM,// collection_method?: string | undefined, 
          NULL_PARAM,// collected_by?: string | undefined, 
          NULL_PARAM,// derived_from_dataset_id?: string | undefined, 
          NULL_PARAM,// collection_date?: string | undefined, 
          NULL_PARAM,// confidence_level?: number | undefined, 
          "All",// status?: string | undefined, 
          NULL_PARAM,// osw_schema_version?: string | undefined, 
          NULL_PARAM,// tdei_project_group_id?: string | undefined, 
          NULL_PARAM,// valid_from?: string | undefined, 
          NULL_PARAM,// valid_to?: string | undefined, 
          recordId,// tdei_record_id?: string | undefined, 
          // page_no?: number | undefined, 
          // page_size?: number | undefined, 
          // options?: AxiosRequestConfig<...> | undefined
        );

        expect(oswFiles.status).toBe(200);
        expect(oswFiles.data.length).toBe(1);
        oswFiles.data.forEach(file => {
          expect(file.tdei_record_id).toBe(recordId)
        });
      });

      it('When passed with valid token and valid collection_method, should return 200 status with records matching collection_method', async () => {
        let oswAPI = new OSWApi(configuration);
        let collection_method = "manual";

        const oswFiles = await oswAPI.listOswFiles(
          NULL_PARAM, // bbox?: number[] | undefined, 
          NULL_PARAM,// name?: string | undefined, 
          NULL_PARAM,// version?: string | undefined, 
          NULL_PARAM,// data_source?: string | undefined, 
          collection_method,// collection_method?: string | undefined, 
          NULL_PARAM,// collected_by?: string | undefined, 
          NULL_PARAM, // derived_from_dataset_id?: string | undefined, 
          NULL_PARAM,// collection_date?: string | undefined, 
          NULL_PARAM,// confidence_level?: number | undefined, 
          "All",// status?: string | undefined, 
          // osw_schema_version?: string | undefined, 
          // tdei_project_group_id?: string | undefined, 
          // valid_from?: string | undefined, 
          // valid_to?: string | undefined, 
          // tdei_record_id?: string | undefined, 
          // page_no?: number | undefined, 
          // page_size?: number | undefined, 
          // options?: AxiosRequestConfig<...> | undefined
        );

        expect(oswFiles.status).toBe(200);
        oswFiles.data.forEach(file => {
          expect(file.collection_method).toBe(collection_method)
        });
      });

      it('When passed with valid token and valid collected_by, should return 200 status with records matching collected_by', async () => {
        let oswAPI = new OSWApi(configuration);
        let collected_by = "John Doe";

        const oswFiles = await oswAPI.listOswFiles(
          NULL_PARAM, // bbox?: number[] | undefined, 
          NULL_PARAM,// name?: string | undefined, 
          NULL_PARAM,// version?: string | undefined, 
          NULL_PARAM,// data_source?: string | undefined, 
          NULL_PARAM,// collection_method?: string | undefined, 
          collected_by,// collected_by?: string | undefined, 
          NULL_PARAM,// derived_from_dataset_id?: string | undefined, 
          NULL_PARAM,// collection_date?: string | undefined, 
          NULL_PARAM,// confidence_level?: number | undefined, 
          "All",// status?: string | undefined, 
          // osw_schema_version?: string | undefined, 
          // tdei_project_group_id?: string | undefined, 
          // valid_from?: string | undefined, 
          // valid_to?: string | undefined, 
          // tdei_record_id?: string | undefined, 
          // page_no?: number | undefined, 
          // page_size?: number | undefined, 
          // options?: AxiosRequestConfig<...> | undefined
        );

        expect(oswFiles.status).toBe(200);
        oswFiles.data.forEach(file => {
          expect(file.collected_by).toBe(collected_by)
        });
      });

      it('When passed with valid token and valid data_source, should return 200 status with records matching data_source', async () => {
        let oswAPI = new OSWApi(configuration);
        let data_source = "3rdParty";

        const oswFiles = await oswAPI.listOswFiles(
          NULL_PARAM, // bbox?: number[] | undefined, 
          NULL_PARAM,// name?: string | undefined, 
          NULL_PARAM,// version?: string | undefined, 
          data_source,// data_source?: string | undefined, 
          NULL_PARAM,// collection_method?: string | undefined, 
          NULL_PARAM,// collected_by?: string | undefined, 
          NULL_PARAM,// derived_from_dataset_id?: string | undefined, 
          NULL_PARAM,// collection_date?: string | undefined, 
          NULL_PARAM,// confidence_level?: number | undefined, 
          "All",// status?: string | undefined, 
          // osw_schema_version?: string | undefined, 
          // tdei_project_group_id?: string | undefined, 
          // valid_from?: string | undefined, 
          // valid_to?: string | undefined, 
          // tdei_record_id?: string | undefined, 
          // page_no?: number | undefined, 
          // page_size?: number | undefined, 
          // options?: AxiosRequestConfig<...> | undefined
        );

        expect(oswFiles.status).toBe(200);
        oswFiles.data.forEach(file => {
          expect(file.data_source).toBe(data_source)
        })
      });

      it('When passed with valid token and valid derived_from_dataset_id, should return 200 status with records matching derived_from_dataset_id', async () => {
        let oswAPI = new OSWApi(configuration);
        let derived_from_dataset_id = "a042a1b3aa874701929cb33a98f28e9d";

        const oswFiles = await oswAPI.listOswFiles(
          NULL_PARAM, // bbox?: number[] | undefined, 
          NULL_PARAM,// name?: string | undefined, 
          NULL_PARAM,// version?: string | undefined, 
          NULL_PARAM,// data_source?: string | undefined, 
          NULL_PARAM,// collection_method?: string | undefined, 
          NULL_PARAM,// collected_by?: string | undefined, 
          derived_from_dataset_id,// derived_from_dataset_id?: string | undefined, 
          NULL_PARAM,// collection_date?: string | undefined, 
          NULL_PARAM,// confidence_level?: number | undefined, 
          "All",// status?: string | undefined, 
          // osw_schema_version?: string | undefined, 
          // tdei_project_group_id?: string | undefined, 
          // valid_from?: string | undefined, 
          // valid_to?: string | undefined, 
          // tdei_record_id?: string | undefined, 
          // page_no?: number | undefined, 
          // page_size?: number | undefined, 
          // options?: AxiosRequestConfig<...> | undefined
        );

        expect(oswFiles.status).toBe(200);
        oswFiles.data.forEach(file => {
          expect(file.derived_from_dataset_id).toBe(derived_from_dataset_id)
        })
      });

      it('When passed with valid token and valid valid_to, should return 200 status with records valid from input datetime', async () => {
        let oswAPI = new OSWApi(configuration);
        //set date one date before today
        let valid_to = new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString();

        const oswFiles = await oswAPI.listOswFiles(
          NULL_PARAM, // bbox?: number[] | undefined, 
          NULL_PARAM,// name?: string | undefined, 
          NULL_PARAM,// version?: string | undefined, 
          NULL_PARAM,// data_source?: string | undefined, 
          NULL_PARAM,// collection_method?: string | undefined, 
          NULL_PARAM,// collected_by?: string | undefined, 
          NULL_PARAM,// derived_from_dataset_id?: string | undefined, 
          NULL_PARAM,// collection_date?: string | undefined, 
          NULL_PARAM,// confidence_level?: number | undefined, 
          "All",// status?: string | undefined, 
          NULL_PARAM,// osw_schema_version?: string | undefined, 
          NULL_PARAM,// tdei_project_group_id?: string | undefined, 
          NULL_PARAM,// valid_from?: string | undefined, 
          valid_to,// valid_to?: string | undefined, 
          // tdei_record_id?: string | undefined, 
          // page_no?: number | undefined, 
          // page_size?: number | undefined, 
          // options?: AxiosRequestConfig<...> | undefined
        );

        expect(oswFiles.status).toBe(200);
        oswFiles.data.forEach(file => {
          expect(new Date(file.valid_from)).toBeAfter(new Date(valid_to))
        })
      });
    });

    describe('Validation', () => {
      it('When passed with valid token and invalid recordId, should return 200 with 0 records', async () => {
        let oswAPI = new OSWApi(configuration);
        let recordId = 'dummyRecordId';

        const oswFiles = await oswAPI.listOswFiles(NULL_PARAM, NULL_PARAM, NULL_PARAM, NULL_PARAM, NULL_PARAM, NULL_PARAM, NULL_PARAM, recordId);

        expect(oswFiles.status).toBe(200);
        expect(oswFiles.data.length).toBe(0);

      })

      it('When passed without valid token, should reject with 401 status', async () => {
        let oswAPI = new OSWApi(Utility.getConfiguration());

        const oswFiles = oswAPI.listOswFiles();

        await expect(oswFiles).rejects.toMatchObject({ response: { status: 401 } });
      });
    })

  });


  describe('Calculate Confidence', () => {

    it('When passed without valid token, should respond with 401 status', async () => {
      let oswAPI = new OSWApi(Utility.getConfiguration());

      let calculateConfidenceResponse = oswAPI.oswConfidenceCalculate({ tdei_record_id: uploadedTdeiRecordId });

      await expect(calculateConfidenceResponse).rejects.toMatchObject({ response: { status: 401 } });
    })

    it('When passed with invalid tdei_record_id, should respond with 404 status', async () => {
      let oswAPI = new OSWApi(configuration);

      let calculateConfidence = oswAPI.oswConfidenceCalculate({ tdei_record_id: "dummytdeirecordid" });

      await expect(calculateConfidence).rejects.toMatchObject({ response: { status: 404 } });
    })

    it('When passed with valid token, should respond with 202 status', async () => {
      let oswAPI = new OSWApi(configuration);

      let calculateConfidence = await oswAPI.oswConfidenceCalculate({ tdei_record_id: uploadedTdeiRecordId });

      expect(calculateConfidence.status).toBe(202);

      expect(calculateConfidence.data).toMatchObject(<OSWConfidenceResponse>{
        tdei_record_id: expect.any(String),
        job_id: expect.any(String)
      });

      confidenceJobId = calculateConfidence.data.job_id!;
      console.log("confidence job_id", confidenceJobId);
    });
  });

  describe('Confidence Status', () => {
    it('When passed without valid token, should respond with 401 status', async () => {
      let oswAPI = new OSWApi(Utility.getConfiguration());
      let job_id = "1";
      let confidenceStatusResponse = oswAPI.getOSWConfidenceStatus(job_id);

      await expect(confidenceStatusResponse).rejects.toMatchObject({ response: { status: 401 } });
    })



    it('When passed with valid token and valid job id, should respond with 200 status', async () => {
      let oswAPI = new OSWApi(configuration);
      await new Promise((r) => setTimeout(r, 10000));
      let confidenceStatus = await oswAPI.getOSWConfidenceStatus(confidenceJobId.toString());

      expect(confidenceStatus.status).toBe(200);

      expect(confidenceStatus.data).toMatchObject(<OSWConfidenceStatus>{
        job_id: expect.any(String),
        confidenceValue: expect.any(Number),
        updatedAt: expect.any(String),
        status: expect.any(String),
        message: expect.any(String)
      })
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

      await expect(formatResponse).rejects.toMatchObject({ response: { status: 401 } });
      axios.interceptors.request.eject(convertInterceptor);
    });

    it('When passed with valid token, should respond with job_id', async () => {
      let oswAPI = new OSWApi(configuration);
      let oswBlob = Utility.getOSWBlob();

      const convertInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => oswConvertRequestInterceptor(req, 'osw-valid.zip'))
      let formatResponse = await oswAPI.oswOnDemandFormatForm("osw", "osm", oswBlob);

      expect(formatResponse.status).toBe(202);
      expect(formatResponse.data).toMatchObject(<OSWFormatResponse>{
        job_id: expect.any(String)
      });
      convertJobId = formatResponse.data!.job_id!;
      console.log("convert job_id", convertJobId);
      axios.interceptors.request.eject(convertInterceptor);
    });
  });

  describe('Fetch Convert Request Status', () => {
    it('When passed without valid token, should respond with 401 status', async () => {
      let oswAPI = new OSWApi(Utility.getConfiguration());

      let formatStatusResponse = oswAPI.oswFormatStatus(convertJobId);

      await expect(formatStatusResponse).rejects.toMatchObject({ response: { status: 401 } });
    });

    it('When passed with valid token and job_id. should respond with 200 status', async () => {
      let oswAPI = new OSWApi(configuration);
      await new Promise((r) => setTimeout(r, 20000));

      let formatStatus = await oswAPI.oswFormatStatus(convertJobId);

      expect(formatStatus.data).toMatchObject(<OSWFormatStatusResponse>{
        job_id: expect.any(String),
        status: expect.any(String),
        message: expect.any(String),
        downloadUrl: expect.any(String),
        conversion: expect.any(String)
      })
    }, 25000);
  })

  describe('Download converted file', () => {
    it('When passed without valid token, should respond with 401 status', async () => {
      let oswAPI = new OSWApi(Utility.getConfiguration());

      let downloadResponse = oswAPI.oswFormatDownload(convertJobId);

      await expect(downloadResponse).rejects.toMatchObject({ response: { status: 401 } });
    });

    it('When passed valid token, should respond with 200 status and stream', async () => {
      let oswAPI = new OSWApi(configuration);

      let response = await oswAPI.oswFormatDownload(convertJobId, { responseType: 'arraybuffer' });
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
    });
  });

  describe('Download OSW File as zip', () => {
    describe('Functional', () => {
      it('When passed with valid recordId, should be able to get the zip file', async () => {

        // let oswRecordId = 'b52ca07e81174b978d3c9baef4198c87';
        let oswAPI = new OSWApi(configuration);

        let response = await oswAPI.getOswFile(uploadedTdeiRecordId, "osw", { responseType: 'arraybuffer' });
        const data: any = response.data;
        const contentType = response.headers['content-type'];
        const zip = new AdmZip(data);
        const entries = zip.getEntries();

        expect(entries.length).toBeGreaterThanOrEqual(2);
        expect(contentType).toBe("application/zip");
        expect(response.data).not.toBeNull();
        expect(response.status).toBe(200);
      });
    });

    describe('Validation', () => {
      it('When passed with valid recordId and invalid token, should return 401 status', async () => {

        let oswAPI = new OSWApi(Utility.getConfiguration());

        let response = oswAPI.getOswFile(uploadedTdeiRecordId);

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

  //This test should be ran at last as it will invalidate the uploaded file
  describe('Invalidate the OSW file', () => {

    it('When passed with valid token, should respond with 200 status', async () => {
      let oswAPI = new OSWApi(configuration);

      let downloadResponse = oswAPI.deleteOsw(uploadedTdeiRecordId);

      await expect((await downloadResponse).status).toBe(200);
    });

    it('When passed without valid token, should respond with 401 status', async () => {
      let oswAPI = new OSWApi(Utility.getConfiguration());

      let downloadResponse = oswAPI.deleteOsw(uploadedTdeiRecordId);

      await expect(downloadResponse).rejects.toMatchObject({ response: { status: 401 } });
    });
  });

});
