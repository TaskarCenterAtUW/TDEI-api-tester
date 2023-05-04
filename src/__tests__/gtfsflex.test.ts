

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
            seeder.removeHeader();

        })

        describe('Functional', ()=> {

            it('When passed with valid token, metadata and file, should return 202 status with recordId', async () => {

                //TODO: Simplify this arrange.
                let flexApi = new GTFSFlexApi(configuration);
                const uploadInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) =>uploadRequestInterceptor(req, "flex-test-upload.zip",metaToUpload))
                let metaToUpload = Utility.getRandomGtfsFlexUpload();
                metaToUpload.tdei_service_id = serviceId;
                metaToUpload.tdei_org_id = 'c552d5d1-0719-4647-b86d-6ae9b25327b7';
                let fileBlob = Utility.getFlexBlob();
                
                const uploadedFileResponse = await flexApi.uploadGtfsFlexFileForm(metaToUpload,fileBlob);
                
                expect(uploadedFileResponse.status).toBe(202);
                expect(uploadedFileResponse.data != "").toBe(true);
            
                axios.interceptors.request.eject(uploadInterceptor);
            },20000)

            it('When passed with valid token, invalid metadata and correct file, should return 400 status', async ()=>{
                
                let flexApi = new GTFSFlexApi(configuration);
                const uploadInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) =>uploadRequestInterceptor(req, "flex-test-upload.zip",metaToUpload))
                let metaToUpload = Utility.getRandomGtfsFlexUpload();
                metaToUpload.tdei_org_id = 'c552d5d1-0719-4647-b86d-6ae9b25327b7';
                metaToUpload.collection_date = "";
                let fileBlob = Utility.getFlexBlob();
                
                const uploadedFileResponse = flexApi.uploadGtfsFlexFileForm(metaToUpload,fileBlob);

                await expect(uploadedFileResponse).rejects.toMatchObject({response:{status:400}});
            
                axios.interceptors.request.eject(uploadInterceptor);

            },12000)

            it('When passed with invalid token, valid metadata and valid file, should return 401 status', async () =>{
                
                let flexApi = new GTFSFlexApi(Utility.getConfiguration());
                const uploadInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) =>uploadRequestInterceptor(req, "flex-test-upload.zip",metaToUpload))
                let metaToUpload = Utility.getRandomGtfsFlexUpload();
                metaToUpload.tdei_service_id = serviceId;
                metaToUpload.tdei_org_id = 'c552d5d1-0719-4647-b86d-6ae9b25327b7';
                let fileBlob = Utility.getFlexBlob();

                const uploadedFileResponse =  flexApi.uploadGtfsFlexFileForm(metaToUpload,fileBlob);

                await expect(uploadedFileResponse).rejects.toMatchObject({response:{status:401}});
            
                axios.interceptors.request.eject(uploadInterceptor);
            },18000)
        })
    })

    describe('List services', ()=>{
        
        describe('Functional', ()=>{
            it('When passed with valid token, should return status 200 with list of services', async ()=>{
                
                let flexApi = new GTFSFlexApi(configuration);
                
                const services = await flexApi.listFlexServices();

                expect(services.status).toBe(200);
                expect(Array.isArray(services.data)).toBe(true);

            });

            it('When passed with valid token and orgId, should return status 200 with list for same orgId', async ()=>{
                
                let orgId = 'c552d5d1-0719-4647-b86d-6ae9b25327b7';
                let flexApi = new GTFSFlexApi(configuration);
                
                const services = await flexApi.listFlexServices(orgId);

                expect(services.status).toBe(200);
                expect(Array.isArray(services.data)).toBe(true);
            });

            it('When passed with valid token and invalid orgId, should return status 200 with empty list', async ()=>{
                
                let orgId = 'dummyOrgId';
                let flexApi = new GTFSFlexApi(configuration);
                
                const services = await flexApi.listFlexServices(orgId);

                expect(services.status).toBe(200);
                expect(services.data.length).toBe(0);
            });

            it('When passed with valid token and page limit, should return status 200 with list less than or equal', async ()=>{
                let page_size = 5;
                let flexApi = new GTFSFlexApi(configuration);
                
                const services = await flexApi.listFlexServices(undefined,undefined,page_size);

                expect(services.status).toBe(200);
                expect(Array.isArray(services.data)).toBe(true);
                expect(services.data.length).toBeLessThanOrEqual(page_size);
            });

            it('When passed with invalid token, should return 401 status', async ()=>{

                let flexApi = new GTFSFlexApi(Utility.getConfiguration());
                
                const services =  flexApi.listFlexServices();

                await expect(services).rejects.toMatchObject({response:{status:401}});
            });


        })
    })

})
