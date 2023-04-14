

import path from "path";
import { Configuration, GeneralApi, GTFSPathwaysApi } from "tdei-client";
import testHarness from "../test-harness.json";
import { Utility } from "../utils";
import * as fs from "fs";
import axios from "axios";

describe('GTFS PATHWAYS API', () => {

    let configuration = new Configuration({
        username: testHarness.system.username,
        password: testHarness.system.password,
        basePath: testHarness.system.baseUrl

    });

    beforeAll(async () => {
        let generalAPI = new GeneralApi(configuration);
        const loginResponse = await generalAPI.authenticate({ username: configuration.username, password: configuration.password });
        configuration.baseOptions = {
            headers: {
                'Authorization': 'Bearer ' + loginResponse.data.access_token
            }
        };
    });

    it('Should list GTFS Pathways Files', async () => {
        let gtfsPathwaysAPI = new GTFSPathwaysApi(configuration);
        const gtfsPathwaysDownload = await gtfsPathwaysAPI.listPathwaysFiles();
        expect(Array.isArray(gtfsPathwaysDownload.data)).toBe(true);

    }, 10000)

    it('Should list GTFS Pathways Stations', async () => {
        let gtfsPathwaysAPI = new GTFSPathwaysApi(configuration);
        const stations = await gtfsPathwaysAPI.listStations();
        expect(Array.isArray(stations.data)).toBe(true);

    }, 10000)

    it('Should list GTFS Pathways versions', async () => {
        let gtfsPathwaysAPI = new GTFSPathwaysApi(configuration);
        const versions = await gtfsPathwaysAPI.listPathwaysVersions();
        expect(Array.isArray(versions.data.versions)).toBe(true);

    }, 10000)



    it('Should be able to upload GTFS pathways file', async ()=>{
        let gtfsPathwaysAPI = new GTFSPathwaysApi(configuration);

        let metaToUpload = Utility.getRandomPathwaysUpload();

        const uploadInterceptor = axios.interceptors.request.use((req) =>
        requestInterceptor(req, "pathways-test-upload.zip")
      );

        const requestInterceptor = (request, fileName) => {
            
              let data = request.data as FormData;
              let file = data.get("file") as File;
              delete data["file"];
              delete data["meta"];
              data.set("file", file, fileName);
              data.set("meta", JSON.stringify(metaToUpload));
            
            return request;
          };


        let fileDir = path.dirname(path.dirname(__dirname));
        let payloadFilePath = path.join(
          fileDir,
          "assets/payloads/gtfs-pathways/files/success_1_all_attrs.zip"
        );
        let filestream = fs.readFileSync(payloadFilePath);
        const blob = new Blob([filestream], { type: "application/zip" });

         const uploadedFileResponse = await gtfsPathwaysAPI.uploadPathwaysFileForm(
           metaToUpload,
           blob
          );


        expect(uploadedFileResponse.status).toBe(202);
        expect(uploadedFileResponse.data).not.toBeNull();
        axios.interceptors.request.eject(uploadInterceptor);
  

    });

 
});