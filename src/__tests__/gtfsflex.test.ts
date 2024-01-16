

import { AuthenticationApi, GeoJsonObject, GTFSFlexApi, GtfsFlexDownload, GtfsFlexUpload, VersionSpec } from "tdei-client";
import { Utility } from "../utils";
import axios, { InternalAxiosRequestConfig } from "axios";
import * as fs from "fs";
import { Seeder } from "../seeder";
import AdmZip from "adm-zip";

const DOWNLOAD_FILE_PATH = `${__dirname}/gtfs-flex-tmp`;

describe('GTFS Flex service', () => {
    let configuration = Utility.getConfiguration();
    // Upload interceptor
    const uploadRequestInterceptor = (request: InternalAxiosRequestConfig, fileName: string, metaToUpload: GtfsFlexUpload) => {
        if (
            request.url === `${configuration.basePath}/api/v1/gtfs-flex`
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
        const loginResponse = await authAPI.authenticate({ username: configuration.username, password: configuration.password });
        configuration.baseOptions = {
            headers: {
                ...Utility.addAuthZHeader(loginResponse.data.access_token)
            }
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
        it('When passed with valid token, should return 200 status with files list', async () => {

            let gtfsFlexAPI = new GTFSFlexApi(configuration);

            const filesResponse = await gtfsFlexAPI.listFlexFiles();

            expect(filesResponse.status).toBe(200)
            expect(Array.isArray(filesResponse.data)).toBe(true);
            filesResponse.data.forEach(element => {
                expectPolygon(element.polygon);
                expect(element).toMatchObject(<GtfsFlexDownload>{
                    tdei_record_id: expect.any(String),
                    tdei_project_group_id: expect.any(String),
                    tdei_service_id: expect.any(String),
                    collected_by: expect.any(String),
                    collection_date: expect.any(String),
                    collection_method: expect.any(String),
                    //TODO:
                    //  collection_method: expect.any(GtfsFlexDownloadCollectionMethodEnum),
                    valid_from: expect.any(String),
                    valid_to: expect.any(String),
                    //TODO:
                    //  confidence_level: expect.any(Number),
                    data_source: expect.any(String),
                    //TODO:
                    //  data_source: expect.any(GtfsFlexDownloadDataSourceEnum),
                    polygon: expect.any(Object || null),
                    flex_schema_version: expect.any(String),
                    download_url: expect.any(String)
                })
            })
        })

        it('When passed without token, should return 401 status', async () => {

            let flexApi = new GTFSFlexApi(Utility.getConfiguration());

            const filesPromise = flexApi.listFlexFiles();

            await expect(filesPromise).rejects.toMatchObject({ response: { status: 401 } })

        })

        it('When passed with token and page_size 5, should return 200 status with less than 5 elements', async () => {

            let flexApi = new GTFSFlexApi(configuration);

            const files = await flexApi.listFlexFiles(undefined, undefined, undefined, undefined, undefined, undefined, undefined, 5);

            expect(files.status).toBe(200);
            expect(files.data.length).toBeLessThanOrEqual(5);

        })

        it('When passed with valid token and tdei_service_id, shold return records of same service', async () => {

            let tdei_service_id = '801018f7-db32-4085-bbae-5339fa094cce';
            let flexApi = new GTFSFlexApi(configuration);

            const files = await flexApi.listFlexFiles(tdei_service_id);

            expect(files.status).toBe(200);

            files.data.forEach(element => {
                expectPolygon(element.polygon);
                expect(element).toMatchObject(<GtfsFlexDownload>{
                    tdei_record_id: expect.any(String),
                    tdei_project_group_id: expect.any(String),
                    tdei_service_id: tdei_service_id,
                    collected_by: expect.any(String),
                    collection_date: expect.any(String),
                    collection_method: expect.any(String),
                    //TODO:
                    //  collection_method: expect.any(GtfsFlexDownloadCollectionMethodEnum),
                    valid_from: expect.any(String),
                    valid_to: expect.any(String),
                    //TODO:
                    //  confidence_level: expect.any(Number),
                    data_source: expect.any(String),
                    //TODO:
                    //  data_source: expect.any(GtfsFlexDownloadDataSourceEnum),
                    polygon: expect.any(Object || null),
                    flex_schema_version: expect.any(String),
                    download_url: expect.any(String)
                })
            })


        })

        it('When passed with valid token and valid recordId, should return 200 status with only single record with same record Id', async () => {

            let tdei_record_id = '2bf7f70127b146cbb96319b5d39ada93';
            let flexApi = new GTFSFlexApi(configuration);

            const files = await flexApi.listFlexFiles(undefined, undefined, undefined, undefined, undefined, tdei_record_id);

            expect(files.status).toBe(200);
            expect(files.data.length).toBe(1);
            files.data.forEach(element => {
                expectPolygon(element.polygon);
                expect(element).toMatchObject(<GtfsFlexDownload>{
                    tdei_record_id: tdei_record_id,
                    tdei_project_group_id: expect.any(String),
                    tdei_service_id: expect.any(String),
                    collected_by: expect.any(String),
                    collection_date: expect.any(String),
                    collection_method: expect.any(String),
                    //TODO:
                    //  collection_method: expect.any(GtfsFlexDownloadCollectionMethodEnum),
                    valid_from: expect.any(String),
                    valid_to: expect.any(String),
                    //TODO:
                    //  confidence_level: expect.any(Number),
                    data_source: expect.any(String),
                    //TODO:
                    //  data_source: expect.any(GtfsFlexDownloadDataSourceEnum),
                    polygon: expect.any(Object || null),
                    flex_schema_version: expect.any(String),
                    download_url: expect.any(String)
                })
            })
        })

        it('When passed with valid token and invalid recordId, should return 200 status with no records', async () => {

            let tdei_record_id = 'randomrecordid';
            let flexApi = new GTFSFlexApi(configuration);

            const files = await flexApi.listFlexFiles(undefined, undefined, undefined, undefined, undefined, tdei_record_id);

            expect(files.status).toBe(200);
            expect(files.data.length).toBe(0);

        })
    })

    describe('Post flex file ', () => {

        var serviceId: string = '';

        beforeAll(async () => {
            const seeder = new Seeder();
            serviceId = await seeder.createService('c552d5d1-0719-4647-b86d-6ae9b25327b7');
            seeder.removeHeader();

        })

        describe('Functional', () => {

            it('When passed with valid token, metadata and file, should return 202 status with recordId', async () => {

                //TODO: Add back when needed
                // let flexApi = new GTFSFlexApi(configuration);
                // const uploadInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => uploadRequestInterceptor(req, "flex-test-upload.zip", metaToUpload))
                // let metaToUpload = Utility.getRandomGtfsFlexUpload();
                // metaToUpload.tdei_service_id = serviceId;
                // metaToUpload.tdei_project_group_id = 'c552d5d1-0719-4647-b86d-6ae9b25327b7';
                // let fileBlob = Utility.getFlexBlob();

                // const uploadedFileResponse = await flexApi.uploadGtfsFlexFileForm(metaToUpload, fileBlob);

                // expect(uploadedFileResponse.status).toBe(202);
                // expect(uploadedFileResponse.data != "").toBe(true);

                // axios.interceptors.request.eject(uploadInterceptor);
            }, 20000)

            it('When passed with valid token, invalid metadata and correct file, should return 400 status', async () => {
                //TODO: Add back when needed
                // let flexApi = new GTFSFlexApi(configuration);
                // const uploadInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => uploadRequestInterceptor(req, "flex-test-upload.zip", metaToUpload))
                // let metaToUpload = Utility.getRandomGtfsFlexUpload();
                // metaToUpload.tdei_project_group_id = 'c552d5d1-0719-4647-b86d-6ae9b25327b7';
                // metaToUpload.data_source = <any>"Test";
                // let fileBlob = Utility.getFlexBlob();

                // const uploadedFileResponse = flexApi.uploadGtfsFlexFileForm(metaToUpload, fileBlob);

                // await expect(uploadedFileResponse).rejects.toMatchObject({ response: { status: 400 } });

                // axios.interceptors.request.eject(uploadInterceptor);

            }, 12000)

            it('When passed with invalid token, valid metadata and valid file, should return 401 status', async () => {
                // TODO: Add back when ready
                // let flexApi = new GTFSFlexApi(Utility.getConfiguration());
                // const uploadInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => uploadRequestInterceptor(req, "flex-test-upload.zip", metaToUpload))
                // let metaToUpload = Utility.getRandomGtfsFlexUpload();
                // metaToUpload.tdei_service_id = serviceId;
                // metaToUpload.tdei_project_group_id = 'c552d5d1-0719-4647-b86d-6ae9b25327b7';
                // let fileBlob = Utility.getFlexBlob();
                // try {
                // const uploadedFileResponse = await flexApi.uploadGtfsFlexFileForm(metaToUpload, fileBlob);
                // }catch (e){
                //     console.log(e)
                // }

                // // await expect(uploadedFileResponse).rejects.toMatchObject({ response: { status: 401 } });

                // axios.interceptors.request.eject(uploadInterceptor);
            }, 18000)
        })
    })


    describe('List Flex versions', () => {
        describe('Functional', () => {
            it('When passed with valid token, should return 200 status with versions', async () => {
                let flexApi = new GTFSFlexApi(configuration);

                const versions = await flexApi.listFlexVersions();

                expect(versions.status).toBe(200)
                expect(Array.isArray(versions.data.versions)).toBe(true);
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
            it('When passed with invalid token, should return 401 status', async () => {
                let flexApi = new GTFSFlexApi(Utility.getConfiguration());

                const versions = flexApi.listFlexVersions();

                await expect(versions).rejects.toMatchObject({ response: { status: 401 } });
            })
        })
    })

    describe('Get a record for Flex', () => {
        describe('Functional', () => {
            it('When passed with valid recordId, should be able to get the zip file', async () => {

                let flexRecordId = '8c6c92c8cb38415e9e2775733a4bf52e';
                let flexAPI = new GTFSFlexApi(configuration);

                let response = await flexAPI.getFlexFile(flexRecordId, { responseType: 'arraybuffer' });
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

                let flexRecordId = '8c6c92c8cb38415e9e2775733a4bf52e';
                let flexAPI = new GTFSFlexApi(Utility.getConfiguration());

                let response = flexAPI.getFlexFile(flexRecordId);

                await expect(response).rejects.toMatchObject({ response: { status: 401 } });

            })

            it('When passed with invalid record and valid token, should return 404 status', async () => {

                let flexRecordId = 'dummyRecordId';
                let flexAPI = new GTFSFlexApi(configuration);

                let response = flexAPI.getFlexFile(flexRecordId);

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