import { AuthenticationApi, GeoJsonObject, OSWApi, OswDownload, OswDownloadStatusEnum, OswUpload, VersionSpec } from "tdei-client";
import axios, { InternalAxiosRequestConfig } from "axios";
import { Utility } from "../utils";
import * as fs from "fs";
import AdmZip from "adm-zip";


const DOWNLOAD_FILE_PATH = `${__dirname}/osw-tmp`;
describe('OSW service', () => {
  let configuration = Utility.getConfiguration();
  const NULL_PARAM = void 0;
  const uploadRequestInterceptor = (request: InternalAxiosRequestConfig, fileName: string, metaToUpload: OswUpload) => {
    if (
      request.url === `${configuration.basePath}/api/v1/osw`
    ) {
      let data = request.data as FormData;
      let file = data.get("file") as File;
      delete data["file"];
      delete data["meta"];
      data.set("file", file, fileName);
      data.set("meta", JSON.stringify(metaToUpload));
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

    // Create a cleand up download folder
    if (!fs.existsSync(DOWNLOAD_FILE_PATH)) {
      fs.mkdirSync(DOWNLOAD_FILE_PATH)
    } else {
      fs.rmSync(DOWNLOAD_FILE_PATH, { recursive: true, force: true });
      fs.mkdirSync(DOWNLOAD_FILE_PATH);
    }
  });

  afterAll(async () => {
    fs.rmSync(DOWNLOAD_FILE_PATH, { recursive: true, force: true });
  })

  describe('List Files', () => {
    describe('Functional', () => {
      it('When passed with valid token, should return 200 status with list of osw records', async () => {
        let oswAPI = new OSWApi(configuration);

        const oswFiles = await oswAPI.listOswFiles();

        expect(oswFiles.status).toBe(200);

        expect(Array.isArray(oswFiles.data)).toBe(true);
        oswFiles.data.forEach(file => {
          // expect(file).toMatchObject(<OswDownload>{
          //   tdei_project_group_id: expect.any(String),
          //   collected_by: expect.any(String),
          //   collection_date: expect.any(String),
          //   collection_method: expect.any(String),
          //   status:expect.any(OswDownloadStatusEnum),
            
          //   data_source: expect.any(String),
          //   polygon: expect.anything() as null | GeoJsonObject,
          //   tdei_record_id: expect.any(String),
          //   osw_schema_version: expect.any(String),
          //   download_url: expect.any(String)
          // })
          expect(file).toMatchObject(<OswDownload>{
            tdei_project_group_id: expect.any(String),
            
          })

        })
      })

      it('When passed with valid token and page size, should return 200 status with files less than or equal to 5', async () => {
        let oswAPI = new OSWApi(configuration);
        let page_size = 5;

        const oswFiles = await oswAPI.listOswFiles(NULL_PARAM, NULL_PARAM, NULL_PARAM, NULL_PARAM, NULL_PARAM, NULL_PARAM, page_size);

        expect(oswFiles.status).toBe(200);
        expect(oswFiles.data.length).toBeLessThanOrEqual(page_size);
        oswFiles.data.forEach(file => {
          expect(file).toMatchObject(<OswDownload>{
            tdei_project_group_id: expect.any(String),
            collected_by: expect.any(String),
            collection_date: expect.any(String),
            collection_method: expect.any(String),
            //TODO:
            // collection_method: expect.any(OswDownloadCollectionMethodEnum),
            //TODO:
            // publication_date: expect.any(String),
            // confidence_level: expect.any(String),
            data_source: expect.any(String),
            polygon: expect.anything() as null | GeoJsonObject,
            tdei_record_id: expect.any(String),
            osw_schema_version: expect.any(String),
            download_url: expect.any(String)
          })
        })

      })

      it('When passed with valid token and valid project group ID, should return 200 status with files of the same project group', async () => {
        let oswAPI = new OSWApi(configuration);
        //TODO: read from seeder or config
        let project_group_id = '5e339544-3b12-40a5-8acd-78c66d1fa981';

        const oswFiles = await oswAPI.listOswFiles(NULL_PARAM, NULL_PARAM, project_group_id);

        expect(oswFiles.status).toBe(200);
        oswFiles.data.forEach(file => {
          expect(file).toMatchObject(<OswDownload>{
            tdei_project_group_id: project_group_id,
            collected_by: expect.any(String),
            collection_date: expect.any(String),
            collection_method: expect.any(String),
            //TODO:
            // collection_method: expect.any(OswDownloadCollectionMethodEnum),
            //TODO:
            // publication_date: expect.any(String),
            // confidence_level: expect.any(String),
            data_source: expect.any(String),
            polygon: expect.anything() as null | GeoJsonObject,
            tdei_record_id: expect.any(String),
            osw_schema_version: expect.any(String),
            download_url: expect.any(String)
          })
        })

      })

      it('When passed with valid token and valid recordId, should return 200 status with same record ID', async () => {
        let oswAPI = new OSWApi(configuration);
        //TODO: feed from seeder
        let recordId = '978203eeac334bdeba262899fce1fd8a';

        const oswFiles = await oswAPI.listOswFiles(NULL_PARAM, NULL_PARAM, NULL_PARAM, NULL_PARAM, recordId);

        expect(oswFiles.status).toBe(200);
        expect(oswFiles.data.length).toBe(1);
        oswFiles.data.forEach(file => {
          expect(file).toMatchObject(<OswDownload>{
            tdei_project_group_id: expect.any(String),
            collected_by: expect.any(String),
            collection_date: expect.any(String),
            collection_method: expect.any(String),
            //TODO:
            // collection_method: expect.any(OswDownloadCollectionMethodEnum),
            //TODO:
            // publication_date: expect.any(String),
            // confidence_level: expect.any(String),
            data_source: expect.any(String),
            polygon: expect.anything() as null | GeoJsonObject,
            tdei_record_id: recordId,
            osw_schema_version: expect.any(String),
            download_url: expect.any(String)
          })
        })
      })

    })

    describe('Validation', () => {
      it('When passed with valid token and invalid recordId, should return 200 with 0 records', async () => {
        let oswAPI = new OSWApi(configuration);
        let recordId = 'dummyRecordId';

        const oswFiles = await oswAPI.listOswFiles(NULL_PARAM, NULL_PARAM, NULL_PARAM, NULL_PARAM, recordId);

        expect(oswFiles.status).toBe(200);
        expect(oswFiles.data.length).toBe(0);

      })

      it('When passed without valid token, should reject with 401 status', async () => {
        let oswAPI = new OSWApi(Utility.getConfiguration());

        const oswFiles = oswAPI.listOswFiles();

        await expect(oswFiles).rejects.toMatchObject({ response: { status: 401 } });
      })

    })

  })

  describe('Post file', () => {
    describe('Functional', () => {
      it('When passed with valid token, metadata and file, should return 202 status with recordId in response', async () => {
        let oswAPI = new OSWApi(configuration);
        let metaToUpload = Utility.getRandomOswUpload();
        const uploadInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => uploadRequestInterceptor(req, "flex-test-upload.zip", metaToUpload))
        //TODO: feed from seeder or configuration
        metaToUpload.tdei_project_group_id = 'c552d5d1-0719-4647-b86d-6ae9b25327b7';
        let fileBlob = Utility.getOSWBlob();

        const uploadedFileResponse = await oswAPI.uploadOswFileForm(metaToUpload, fileBlob);

        expect(uploadedFileResponse.status).toBe(202);
        expect(uploadedFileResponse.data != "").toBe(true);

        axios.interceptors.request.eject(uploadInterceptor);

      }, 20000)

      it('When passed with valid token, invalid metadata and file, should return 400 status in response', async () => {
        let oswAPI = new OSWApi(configuration);
        let metaToUpload = Utility.getRandomOswUpload();
        const uploadInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => uploadRequestInterceptor(req, "flex-test-upload.zip", metaToUpload))
        //TODO: feed from seeder or configuration
        metaToUpload.tdei_project_group_id = 'c552d5d1-0719-4647-b86d-6ae9b25327b7';
        metaToUpload.collection_date = "";
        let fileBlob = Utility.getOSWBlob();

        const uploadedFileResponse = oswAPI.uploadOswFileForm(metaToUpload, fileBlob);

        await expect(uploadedFileResponse).rejects.toMatchObject({ response: { status: 400 } });

        axios.interceptors.request.eject(uploadInterceptor);

      }, 20000)

      it('When passed without valid token, metadata and file, should return 401 status in response', async () => {
        let oswAPI = new OSWApi(Utility.getConfiguration());
        let metaToUpload = Utility.getRandomOswUpload();
        const uploadInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => uploadRequestInterceptor(req, "flex-test-upload.zip", metaToUpload))
        //TODO: feed from seeder or configuraiton
        metaToUpload.tdei_project_group_id = 'c552d5d1-0719-4647-b86d-6ae9b25327b7';
        let fileBlob = Utility.getOSWBlob();

        const uploadedFileResponse = oswAPI.uploadOswFileForm(metaToUpload, fileBlob);

        await expect(uploadedFileResponse).rejects.toMatchObject({ response: { status: 401 } });

        axios.interceptors.request.eject(uploadInterceptor);

      }, 20000)

    })
  })
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
  })

  describe('Get a record for OSW', () => {
    describe('Functional', () => {
      it('When passed with valid recordId, should be able to get the zip file', async () => {

        let oswRecordId = '8ec3e5c760024640ade1c7acce9ad9b6';
        let oswAPI = new OSWApi(configuration);

        let response = await oswAPI.getOswFile(oswRecordId, { responseType: 'arraybuffer' });
        const data: any = response.data;
        const contentDisposition = response.headers['content-disposition'];
        const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
        const matches = filenameRegex.exec(contentDisposition);
        const fileName = (matches != null && matches[1]) ? matches[1].replace(/['"]/g, '') : 'data.zip';
        const filePath = `${DOWNLOAD_FILE_PATH}/${fileName}`
        fs.writeFileSync(filePath, new Uint8Array(data))
        const zip = new AdmZip(filePath);
        const entries = zip.getEntries();

        expect(entries.length).toBeGreaterThan(0);
        expect(fileName.includes('zip')).toBe(true);
        expect(response.data).not.toBeNull();
        expect(response.status).toBe(200);

      })

    })

    describe('Validation', () => {
      it('When passed with valid recordId and invalid token, should return 401 status', async () => {

        let oswRecordId = '8ec3e5c760024640ade1c7acce9ad9b6';
        let oswAPI = new OSWApi(Utility.getConfiguration());

        let response = oswAPI.getOswFile(oswRecordId);

        await expect(response).rejects.toMatchObject({ response: { status: 401 } });

      })

      it('When passed with invalid record and valid token, should return 404 status', async () => {

        let oswRecordId = 'dummyRecordId';
        let oswAPI = new OSWApi(configuration);

        let response = oswAPI.getOswFile(oswRecordId);

        await expect(response).rejects.toMatchObject({ response: { status: 404 } });

      })

    })

  })

})
