import { GeneralApi, GTFSPathwaysApi, GtfsPathwaysUpload } from "tdei-client";
import { Utility } from "../utils";
import axios, { InternalAxiosRequestConfig } from "axios";
import path from "path";
import * as fs from "fs";
import { Seeder } from "../seeder";


describe('GTFS Pathways service', () => {

  let configuration = Utility.getConfiguration();

  const uploadRequestInterceptor = (request: InternalAxiosRequestConfig, fileName: string, metaToUpload:GtfsPathwaysUpload) => {
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
    let generalAPI = new GeneralApi(configuration);
    const loginResponse = await generalAPI.authenticate({
      username: configuration.username,
      password: configuration.password
    });
    configuration.baseOptions = {
      headers: { ...Utility.addAuthZHeader(loginResponse.data.access_token) }
    };
  });

  describe('List files ', () => {

    describe('Functional', () => {

      it('When passed with valid token, should return list of flex files', async () => {

        let gtfsPathwaysAPI = new GTFSPathwaysApi(configuration);

        const pathwayFiles = await gtfsPathwaysAPI.listPathwaysFiles();

        expect(Array.isArray(pathwayFiles.data)).toBe(true);
      })

      it('When passed with valid token and page size 5, should return list of files less than or equal to 5', async () => {

        let gtfsPathwaysAPI = new GTFSPathwaysApi(configuration);
        let page_size = 5

        const pathwayFiles = await gtfsPathwaysAPI.listPathwaysFiles(undefined,undefined,undefined,undefined,undefined,undefined,undefined,page_size);

        expect(pathwayFiles.status).toBe(200)
        expect(pathwayFiles.data.length).toBeLessThanOrEqual(page_size)

      })

      it('When passed with valid token and serviceId, should return list of files of same service id', async () =>{

        let gtfsPathwaysAPI = new GTFSPathwaysApi(configuration);
        let stationId = '5e20eb06-a950-4a5d-a9ca-1e390a801b8a';

        const pathwayFiles = await gtfsPathwaysAPI.listPathwaysFiles(undefined,stationId);

        expect(pathwayFiles.status).toBe(200);
        pathwayFiles.data.forEach(element => {
          expect(element.tdei_station_id).toEqual(stationId);
        });

      })

      it('When passed with valid token and recordId, should return record with same recordId', async () => {

        let recordId = '90d81b53e2e54abebd66986d2fdab169';
        let gtfsPathwaysAPI = new GTFSPathwaysApi(configuration);

        const pathwayFiles = await gtfsPathwaysAPI.listPathwaysFiles(undefined,undefined,undefined,undefined,undefined,recordId);

        expect(pathwayFiles.status).toBe(200);
        expect(pathwayFiles.data.length).toBe(1);
        expect(pathwayFiles.data[0].tdei_record_id).toBe(recordId);

      })

    })

    describe('Validation', ()=>{

      it('When passed without token, should return 401 status', async () => {

        let pathwaysAPI = new GTFSPathwaysApi(Utility.getConfiguration());

        const pathwaysResponse = pathwaysAPI.listPathwaysFiles();

        await expect(pathwaysResponse).rejects.toMatchObject({response:{status:401}});

      })

      it('When passed with valid token and invalid recordId, should return 200 status with no elements', async () =>{
        let dummyRecordId = 'dummyRecordId';
        let pathwaysAPI = new GTFSPathwaysApi(configuration);

        const pathwaysResponse = await pathwaysAPI.listPathwaysFiles(undefined,undefined,undefined,undefined,undefined,dummyRecordId);

        expect(pathwaysResponse.status).toBe(200);
        expect(pathwaysResponse.data.length).toBe(0);
      })
    })

  })

  describe('Post Pathway File', ()=>{
    var stationId: string = '';
    const orgId = 'c552d5d1-0719-4647-b86d-6ae9b25327b7';

    beforeAll( async ()=>{
        const seeder = new Seeder();
        stationId = await seeder.createStation(orgId);
        seeder.removeHeader();
    })

    describe('Functional', ()=>{

      it('When passed with valid token, metadata and file, should return 202 with recordId', async () =>{
        let pathwaysAPI = new GTFSPathwaysApi(configuration);
        let metaToUpload = Utility.getRandomPathwaysUpload();
        const uploadInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) =>uploadRequestInterceptor(req, "pathways-test-upload.zip",metaToUpload))
        metaToUpload.tdei_org_id = orgId;
        metaToUpload.tdei_station_id = stationId;
        let fileBlob = Utility.getPathwaysBlob();

        const uploadedFileResponse = await pathwaysAPI.uploadPathwaysFileForm(metaToUpload,fileBlob);
                
        expect(uploadedFileResponse.status).toBe(202);
        expect(uploadedFileResponse.data != "").toBe(true);
    
        axios.interceptors.request.eject(uploadInterceptor);

      },20000)

      it('When passed with valid token, file and invalid metadata, should return 400 status', async () => {

        let pathwaysAPI = new GTFSPathwaysApi(configuration);
        let metaToUpload = Utility.getRandomPathwaysUpload();
        const uploadInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) =>uploadRequestInterceptor(req, "pathways-test-upload.zip",metaToUpload))
        metaToUpload.tdei_org_id = orgId;
        metaToUpload.tdei_station_id = stationId;
        metaToUpload.collection_date = "";
        let fileBlob = Utility.getPathwaysBlob();

        const uploadedFileResponse =  pathwaysAPI.uploadPathwaysFileForm(metaToUpload,fileBlob);
                
        await expect(uploadedFileResponse).rejects.toMatchObject({response:{status:400}});
    
        axios.interceptors.request.eject(uploadInterceptor);
      },20000)

      it('When passed with invalid token, valid metadata and file, should return 401 status', async ()=>{

        let pathwaysAPI = new GTFSPathwaysApi(Utility.getConfiguration());
        let metaToUpload = Utility.getRandomPathwaysUpload();
        const uploadInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) =>uploadRequestInterceptor(req, "pathways-test-upload.zip",metaToUpload))
        metaToUpload.tdei_org_id = orgId;
        metaToUpload.tdei_station_id = stationId;
        let fileBlob = Utility.getPathwaysBlob();

        const uploadedFileResponse = pathwaysAPI.uploadPathwaysFileForm(metaToUpload,fileBlob);

        await expect(uploadedFileResponse).rejects.toMatchObject({response:{status:401}});
    
        axios.interceptors.request.eject(uploadInterceptor);
      })
    })
  })

  describe('List stations', ()=>{

    const orgId = 'c552d5d1-0719-4647-b86d-6ae9b25327b7';
    describe('Functional', ()=>{

      it('When passed with valid token, should return return 200 status with list of stations', async () => {
        let pathwaysAPI = new GTFSPathwaysApi(configuration);

        let stations = await pathwaysAPI.listStations();

        expect(stations.status).toBe(200);
        expect(Array.isArray(stations.data)).toBe(true);
        
      })

      it('When passed with valid token and orgId, should return the stations', async () =>{
        let pathwaysAPI = new GTFSPathwaysApi(configuration);

        let stations = await pathwaysAPI.listStations(orgId);

        expect(stations.status).toBe(200);
        expect(Array.isArray(stations.data)).toBe(true);
        
      })

      it('When passed with valid token and page limit, should return less than or equal to number of stations', async ()=>{
        let page_size = 5;
        let pathwaysAPI = new GTFSPathwaysApi(configuration);

        let stations = await pathwaysAPI.listStations(undefined,undefined,page_size);

        expect(stations.status).toBe(200);
        expect(stations.data.length).toBeLessThanOrEqual(page_size);
      })

    })
    describe('Validation', ()=>{

      it('When passed with invalid token, should return 401 status', async () =>{
        let pathwaysAPI = new GTFSPathwaysApi(Utility.getConfiguration());

        let stations = pathwaysAPI.listStations();

        await expect(stations).rejects.toMatchObject({response:{status:401}});
      })

      it('When passed with valid token and invalid orgId, should return 200 status with 0 stations', async () =>{
        let orgId = "dummyOrgID";
        let pathwaysAPI = new GTFSPathwaysApi(configuration);

        let stations = await pathwaysAPI.listStations(orgId);

        expect(stations.status).toBe(200);
        expect(stations.data.length).toBe(0);

      })

    })
  })

  describe('Pathways versions', () => {
    describe('Functional', ()=>{
      it('When passed with valid token, should return 200 status with versions list', async () =>{
        let pathwaysAPI = new GTFSPathwaysApi(configuration);

        let versions = await pathwaysAPI.listPathwaysVersions();

        expect(versions.status).toBe(200);
      })
    })
    describe('Validation', ()=>{
      it('When passed without token, should return 401 status', async () =>{
        let pathwaysAPI = new GTFSPathwaysApi(Utility.getConfiguration());

        let versions =  pathwaysAPI.listPathwaysVersions();

        await expect(versions).rejects.toMatchObject({response:{status:401}});
      })
    })
  })

})
