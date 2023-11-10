import { AuthenticationApi, GeoJsonObject, GTFSPathwaysApi, GtfsPathwaysDownload, GtfsPathwaysUpload, Station, VersionSpec } from "tdei-client";
import { Utility } from "../utils";
import axios, { InternalAxiosRequestConfig } from "axios";
import * as fs from "fs";
import { Seeder } from "../seeder";
import AdmZip from "adm-zip";

const DOWNLOAD_FILE_PATH = `${__dirname}/gtfs-pathways-tmp`;

describe('GTFS Pathways service', () => {

  let configuration = Utility.getConfiguration();
  const NULL_PARAM = void 0;


  const uploadRequestInterceptor = (request: InternalAxiosRequestConfig, fileName: string, metaToUpload: GtfsPathwaysUpload) => {
    if (
      request.url === `${configuration.basePath}/api/v1/gtfs-pathways`
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

  describe('List files ', () => {

    describe('Functional', () => {

      it('When passed with valid token, should return list of flex files', async () => {

        let gtfsPathwaysAPI = new GTFSPathwaysApi(configuration);

        const pathwayFiles = await gtfsPathwaysAPI.listPathwaysFiles();

        expect(Array.isArray(pathwayFiles.data)).toBe(true);
        pathwayFiles.data.forEach(download => {
          expectPolygon(download.polygon)
          expect(download).toMatchObject(<GtfsPathwaysDownload>{
            tdei_project_group_id: expect.any(String),
            tdei_station_id: expect.any(String),
            collected_by: expect.any(String),
            collection_date: expect.any(String),
            collection_method: expect.any(String),
            valid_from: expect.any(String),
            valid_to: expect.any(String),
            //TODO:
            // confidence_level: expect.any(Number),
            data_source: expect.any(String),
            polygon: expect.any(Object || null),
            tdei_record_id: expect.any(String),
            pathways_schema_version: expect.any(String),
            download_url: expect.any(String)
          })
        })
      })

      it('When passed with valid token and page size 5, should return list of files less than or equal to 5', async () => {

        let gtfsPathwaysAPI = new GTFSPathwaysApi(configuration);
        let page_size = 5

        const pathwayFiles = await gtfsPathwaysAPI.listPathwaysFiles(NULL_PARAM, NULL_PARAM, NULL_PARAM, NULL_PARAM, NULL_PARAM, NULL_PARAM, NULL_PARAM, page_size);

        expect(pathwayFiles.status).toBe(200)
        expect(pathwayFiles.data.length).toBeLessThanOrEqual(page_size)
        pathwayFiles.data.forEach(download => {
          expectPolygon(download.polygon);
          expect(download).toMatchObject(<GtfsPathwaysDownload>{
            tdei_project_group_id: expect.any(String),
            tdei_station_id: expect.any(String),
            collected_by: expect.any(String),
            collection_date: expect.any(String),
            collection_method: expect.any(String),
            valid_from: expect.any(String),
            valid_to: expect.any(String),
            //TODO:
            // confidence_level: expect.any(Number),
            data_source: expect.any(String),
            polygon: expect.any(Object || null),
            tdei_record_id: expect.any(String),
            pathways_schema_version: expect.any(String),
            download_url: expect.any(String)
          })
        })
      })

      it('When passed with valid token and serviceId, should return list of files of same service id', async () => {

        let gtfsPathwaysAPI = new GTFSPathwaysApi(configuration);
        //TODO: feed from seeder or configuration
        let stationId = '5e20eb06-a950-4a5d-a9ca-1e390a801b8a';

        const pathwayFiles = await gtfsPathwaysAPI.listPathwaysFiles(NULL_PARAM, stationId);

        expect(pathwayFiles.status).toBe(200);
        pathwayFiles.data.forEach(download => {
          expectPolygon(download.polygon);
          expect(download).toMatchObject(<GtfsPathwaysDownload>{
            tdei_project_group_id: expect.any(String),
            tdei_station_id: stationId,
            collected_by: expect.any(String),
            collection_date: expect.any(String),
            collection_method: expect.any(String),
            valid_from: expect.any(String),
            valid_to: expect.any(String),
            //TODO:
            // confidence_level: expect.any(Number),
            data_source: expect.any(String),
            polygon: expect.any(Object || null),
            tdei_record_id: expect.any(String),
            pathways_schema_version: expect.any(String),
            download_url: expect.any(String)
          })
        })
      })

      it('When passed with valid token and recordId, should return record with same recordId', async () => {
        //TODO: feed from seeder or configuration
        let recordId = '90d81b53e2e54abebd66986d2fdab169';
        let gtfsPathwaysAPI = new GTFSPathwaysApi(configuration);

        const pathwayFiles = await gtfsPathwaysAPI.listPathwaysFiles(NULL_PARAM, NULL_PARAM, NULL_PARAM, NULL_PARAM, NULL_PARAM, recordId);

        expect(pathwayFiles.status).toBe(200);
        expect(pathwayFiles.data.length).toBe(1);
        pathwayFiles.data.forEach(download => {
          expectPolygon(download.polygon);
          expect(download).toMatchObject(<GtfsPathwaysDownload>{
            tdei_project_group_id: expect.any(String),
            tdei_station_id: expect.any(String),
            collected_by: expect.any(String),
            collection_date: expect.any(String),
            collection_method: expect.any(String),
            valid_from: expect.any(String),
            valid_to: expect.any(String),
            //TODO:
            // confidence_level: expect.any(Number),
            data_source: expect.any(String),
            polygon: expect.any(Object || null),
            tdei_record_id: recordId,
            pathways_schema_version: expect.any(String),
            download_url: expect.any(String)
          })
        })
      })
    })

    describe('Validation', () => {

      it('When passed without token, should return 401 status', async () => {

        let pathwaysAPI = new GTFSPathwaysApi(Utility.getConfiguration());

        const pathwaysResponse = pathwaysAPI.listPathwaysFiles();

        await expect(pathwaysResponse).rejects.toMatchObject({ response: { status: 401 } });

      })

      it('When passed with valid token and invalid recordId, should return 200 status with no elements', async () => {
        let dummyRecordId = 'dummyRecordId';
        let pathwaysAPI = new GTFSPathwaysApi(configuration);

        const pathwaysResponse = await pathwaysAPI.listPathwaysFiles(undefined, undefined, undefined, undefined, undefined, dummyRecordId);

        expect(pathwaysResponse.status).toBe(200);
        expect(pathwaysResponse.data.length).toBe(0);
      })
    })

  })

  describe('Post Pathway File', () => {
    var stationId: string = '';
    //TODO: feed from seeder or configuration
    const project_group_id = 'c552d5d1-0719-4647-b86d-6ae9b25327b7';

    beforeAll(async () => {
      const seeder = new Seeder();
      stationId = await seeder.createStation(project_group_id);
      seeder.removeHeader();
    })

    describe('Functional', () => {

      it('When passed with valid token, metadata and file, should return 202 with recordId', async () => {
        let pathwaysAPI = new GTFSPathwaysApi(configuration);
        let metaToUpload = Utility.getRandomPathwaysUpload();
        const uploadInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => uploadRequestInterceptor(req, "pathways-test-upload.zip", metaToUpload))
        metaToUpload.tdei_project_group_id = project_group_id;
        metaToUpload.tdei_station_id = stationId;
        let fileBlob = Utility.getPathwaysBlob();

        const uploadedFileResponse = await pathwaysAPI.uploadPathwaysFileForm(metaToUpload, fileBlob);

        expect(uploadedFileResponse.status).toBe(202);
        expect(uploadedFileResponse.data != "").toBe(true);

        axios.interceptors.request.eject(uploadInterceptor);

      }, 20000)

      it('When passed with valid token, file and invalid metadata, should return 400 status', async () => {

        let pathwaysAPI = new GTFSPathwaysApi(configuration);
        let metaToUpload = Utility.getRandomPathwaysUpload();
        const uploadInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => uploadRequestInterceptor(req, "pathways-test-upload.zip", metaToUpload))
        metaToUpload.tdei_project_group_id = project_group_id;
        metaToUpload.tdei_station_id = stationId;
        metaToUpload.collection_date = "";
        let fileBlob = Utility.getPathwaysBlob();

        const uploadedFileResponse = pathwaysAPI.uploadPathwaysFileForm(metaToUpload, fileBlob);

        await expect(uploadedFileResponse).rejects.toMatchObject({ response: { status: 400 } });

        axios.interceptors.request.eject(uploadInterceptor);
      }, 20000)

      it('When passed with invalid token, valid metadata and file, should return 401 status', async () => {

        let pathwaysAPI = new GTFSPathwaysApi(Utility.getConfiguration());
        let metaToUpload = Utility.getRandomPathwaysUpload();
        const uploadInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => uploadRequestInterceptor(req, "pathways-test-upload.zip", metaToUpload))
        metaToUpload.tdei_project_group_id = project_group_id;
        metaToUpload.tdei_station_id = stationId;
        let fileBlob = Utility.getPathwaysBlob();

        const uploadedFileResponse = pathwaysAPI.uploadPathwaysFileForm(metaToUpload, fileBlob);

        await expect(uploadedFileResponse).rejects.toMatchObject({ response: { status: 401 } });

        axios.interceptors.request.eject(uploadInterceptor);
      })
    })
  })

  describe('List stations', () => {
    //TODO: feed from seeder or configuration
    const project_group_id = 'c552d5d1-0719-4647-b86d-6ae9b25327b7';
    describe('Functional', () => {

      it('When passed with valid token, should return return 200 status with list of stations', async () => {
        let pathwaysAPI = new GTFSPathwaysApi(configuration);

        let stations = await pathwaysAPI.listStations();

        expect(stations.status).toBe(200);
        expect(Array.isArray(stations.data)).toBe(true);
        stations.data.forEach(station => {
          expectPolygon(station.polygon);
          expect(station).toMatchObject(<Station>{
            polygon: expect.any(Object || null),
            station_name: expect.any(String),
            tdei_station_id: expect.any(String)
          })
        })
      })

      it('When passed with valid token and project_group_id, should return the stations', async () => {
        let pathwaysAPI = new GTFSPathwaysApi(configuration);

        let stations = await pathwaysAPI.listStations(project_group_id);

        expect(stations.status).toBe(200);
        expect(Array.isArray(stations.data)).toBe(true);
        stations.data.forEach(station => {
          expectPolygon(station.polygon);
          expect(station).toMatchObject(<Station>{
            polygon: expect.any(Object || null),
            station_name: expect.any(String),
            tdei_station_id: expect.any(String)
          })
        })

      })

      it('When passed with valid token and page limit, should return less than or equal to number of stations', async () => {
        let page_size = 5;
        let pathwaysAPI = new GTFSPathwaysApi(configuration);

        let stations = await pathwaysAPI.listStations(undefined, undefined, page_size);

        expect(stations.status).toBe(200);
        expect(stations.data.length).toBeLessThanOrEqual(page_size);
      })

    })
    describe('Validation', () => {

      it('When passed with invalid token, should return 401 status', async () => {
        let pathwaysAPI = new GTFSPathwaysApi(Utility.getConfiguration());

        let stations = pathwaysAPI.listStations();

        await expect(stations).rejects.toMatchObject({ response: { status: 401 } });
      })

      it('When passed with valid token and invalid project_group_id, should return 200 status with 0 stations', async () => {
        let project_group_id = "dummyproject_group_id";
        let pathwaysAPI = new GTFSPathwaysApi(configuration);

        let stations = await pathwaysAPI.listStations(project_group_id);

        expect(stations.status).toBe(200);
        expect(stations.data.length).toBe(0);

      })

    })
  })

  describe('Pathways versions', () => {
    describe('Functional', () => {
      it('When passed with valid token, should return 200 status with versions list', async () => {
        let pathwaysAPI = new GTFSPathwaysApi(configuration);

        let versions = await pathwaysAPI.listPathwaysVersions();

        expect(versions.status).toBe(200);
        versions.data.versions?.forEach(version => {
          expect(version).toMatchObject(<VersionSpec>{
            version: expect.any(String),
            documentation: expect.any(String),
            specification: expect.any(String)
          })
        })

      })
    })
    describe('Validation', () => {
      it('When passed without token, should return 401 status', async () => {
        let pathwaysAPI = new GTFSPathwaysApi(Utility.getConfiguration());

        let versions = pathwaysAPI.listPathwaysVersions();

        await expect(versions).rejects.toMatchObject({ response: { status: 401 } });
      })
    })
  })

  describe('Get a record for pathways', () => {
    describe('Functional', () => {
      it('When passed with valid recordId, should be able to get the zip file', async () => {

        let pathwaysRecordId = '7cd301eb50ea413f90be12598d158149';
        let pathwaysAPI = new GTFSPathwaysApi(configuration);

        let response = await pathwaysAPI.getPathwaysFile(pathwaysRecordId, { responseType: 'arraybuffer' });
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

        let pathwaysRecordId = '7cd301eb50ea413f90be12598d158149';
        let pathwaysAPI = new GTFSPathwaysApi(Utility.getConfiguration());

        let response = pathwaysAPI.getPathwaysFile(pathwaysRecordId);

        await expect(response).rejects.toMatchObject({ response: { status: 401 } });

      })

      it('When passed with invalid record and valid token, should return 404 status', async () => {

        let pathwaysRecordId = 'dummyRecordId';
        let pathwaysAPI = new GTFSPathwaysApi(configuration);

        let response = pathwaysAPI.getPathwaysFile(pathwaysRecordId);

        await expect(response).rejects.toMatchObject({ response: { status: 404 } });

      })

    })

  })

})

function expectPolygon(polygon: any) {
  if (polygon) {
    var aPolygon = polygon as GeoJsonObject;
    expect(typeof aPolygon.features).not.toBeNull();
    expect(aPolygon.features?.length).toBeGreaterThan(0);

  }
}