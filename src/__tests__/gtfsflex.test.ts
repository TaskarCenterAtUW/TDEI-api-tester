

import {  GeneralApi, GTFSFlexApi, GtfsFlexUpload } from "tdei-client";
import { Utility } from "../utils";
import axios, { InternalAxiosRequestConfig } from "axios";
import path from "path";
import * as fs from "fs";
import { Seeder } from "../seeder";


describe('GTFS Flex service', ()=>{
    let configuration = Utility.getConfiguration();
    // Upload interceptor
    const uploadRequestInterceptor = (request: InternalAxiosRequestConfig, fileName: string, metaToUpload:GtfsFlexUpload) => {
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
        let generalAPI = new GeneralApi(configuration);
        const loginResponse = await generalAPI.authenticate({ username: configuration.username, password: configuration.password });
        configuration.baseOptions = {
          headers: {
            ...Utility.addAuthZHeader(loginResponse.data.access_token)
          }
        };
    });

    describe('List Files', ()=>{
        it('When passed with valid token, should return 200 status with files list', async () =>{
            
            let gtfsFlexAPI = new GTFSFlexApi(configuration);
            
            const filesResponse = await gtfsFlexAPI.listFlexFiles();

            expect(filesResponse.status).toBe(200)
            expect(Array.isArray(filesResponse.data)).toBe(true);

        })

        it('When passed without token, should return 401 status', async ()=>{
            
            let flexApi = new GTFSFlexApi(Utility.getConfiguration());

            const filesPromise = flexApi.listFlexFiles();

            await expect(filesPromise).rejects.toMatchObject({response:{status:401}})

        })

        it('When passed with token and page_size 5, should return 200 status with less than 5 elements', async ()=>{
            
            let flexApi = new GTFSFlexApi(configuration);

            const files = await flexApi.listFlexFiles(undefined,undefined,undefined,undefined,undefined,undefined,undefined,5);

            expect(files.status).toBe(200);
            expect(files.data.length).toBeLessThanOrEqual(5);

        })

        it('When passed with valid token and tdei_service_id, shold return records of same service', async ()=>{
            
            let tdei_service_id = '801018f7-db32-4085-bbae-5339fa094cce';
            let flexApi = new GTFSFlexApi(configuration);

            const files = await flexApi.listFlexFiles(tdei_service_id);

            expect(files.status).toBe(200);

            // test.each(files.data)
            files.data.forEach(element => {
                expect(element.tdei_service_id).toEqual(tdei_service_id);
            });
        })

        it('When passed with valid token and valid recordId, should return 200 status with only single record with same record Id', async () => {
           
            let tdei_record_id = '2bf7f70127b146cbb96319b5d39ada93';
            let flexApi = new GTFSFlexApi(configuration);

            const files = await flexApi.listFlexFiles(undefined,undefined,undefined,undefined,undefined,tdei_record_id);

            expect(files.status).toBe(200);
            expect(files.data.length).toBe(1);
            expect(files.data[0].tdei_record_id).toBe(tdei_record_id);
        })

        it('When passed with valid token and invalid recordId, should return 200 status with no records', async () => {

            let tdei_record_id = 'randomrecordid';
            let flexApi = new GTFSFlexApi(configuration);

            const files = await flexApi.listFlexFiles(undefined,undefined,undefined,undefined,undefined,tdei_record_id);

            expect(files.status).toBe(200);
            expect(files.data.length).toBe(0);

        })
    })

    describe('Post flex file ', () => {

        var serviceId: string = '';

        beforeAll( async ()=>{
            const seeder = new Seeder();
            serviceId = await seeder.createService('c552d5d1-0719-4647-b86d-6ae9b25327b7');

        })

        describe('Functional', ()=> {

            it('When passed with valid token, metadata and file, should return 202 status with recordId', async () => {

                let flexApi = new GTFSFlexApi(configuration);
                let metaToUpload = Utility.getRandomGtfsFlexUpload();
                metaToUpload.tdei_service_id = serviceId;
                metaToUpload.tdei_org_id = 'c552d5d1-0719-4647-b86d-6ae9b25327b7';
                const uploadInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) =>uploadRequestInterceptor(req, "flex-test-upload.zip",metaToUpload))
                let fileDir = path.dirname(path.dirname(__dirname));
                let payloadFilePath = path.join(fileDir,"assets/payloads/gtfs-flex/files/success_1_all_attrs.zip");
                let filestream = fs.readFileSync(payloadFilePath);
                const blob = new Blob([filestream], { type: "application/zip" });
                try {
                const uploadedFileResponse = await flexApi.uploadGtfsFlexFileForm(
                    metaToUpload,
                    blob
                );
                
                expect(uploadedFileResponse.status).toBe(202);
                expect(uploadedFileResponse.data != "").toBe(true);
                }
                catch(e){
                     console.log(e);
                }
            
                axios.interceptors.request.eject(uploadInterceptor);
            },20000)
        })
    })

})


describe('GTFS FLEX API', () => {

    let configuration = Utility.getConfiguration();

    beforeAll(async () => {
        let generalAPI = new GeneralApi(configuration);
        const loginResponse = await generalAPI.authenticate({ username: configuration.username, password: configuration.password });
        configuration.baseOptions = {
          headers: {
            ...Utility.addAuthZHeader(loginResponse.data.access_token)
          }
        };
    });

    it('Should list GTFS flex services', async () => {
        let gtfsFlexAPI = new GTFSFlexApi(configuration);

        const services = await gtfsFlexAPI.listFlexServices();

        expect(Array.isArray(services.data)).toBe(true);

    }, 10000)

    it('Should list GTFS flex versions', async () => {
        let gtfsFlexAPI = new GTFSFlexApi(configuration);

        const versions = await gtfsFlexAPI.listFlexVersions();

        expect(Array.isArray(versions.data["versions"])).toBe(true);
    }, 10000)

    it('Should list GTFS flex files', async () => {
        let gtfsFlexAPI = new GTFSFlexApi(configuration);

        const files = await gtfsFlexAPI.listFlexFiles();

        expect(Array.isArray(files.data)).toBe(true);
    }, 10000)

    it("Should be able to upload Flex files", async () => {
        let metaToUpload = Utility.getRandomGtfsFlexUpload();
        const requestInterceptor = (request: InternalAxiosRequestConfig, fileName: string) => {
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
        // Actual method does not give the results as expected
        // So we are writing interceptor
        const uploadInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) =>
            requestInterceptor(req, "flex-test-upload.zip")
        );
        let fileDir = path.dirname(path.dirname(__dirname));
        let payloadFilePath = path.join(
            fileDir,
            "assets/payloads/gtfs-flex/files/success_1_all_attrs.zip"
        );
        let filestream = fs.readFileSync(payloadFilePath);
        const blob = new Blob([filestream], { type: "application/zip" });
        let flexApi = new GTFSFlexApi(configuration);

        const uploadedFileResponse = await flexApi.uploadGtfsFlexFileForm(
            metaToUpload,
            blob
        );

        expect(uploadedFileResponse.data != "").toBe(true);

    }, 50000);
});