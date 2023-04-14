

import { Configuration, GeneralApi, GTFSFlexApi, GTFSPathwaysApi } from "tdei-client";
import testHarness from "../test-harness.json";
import axios, { InternalAxiosRequestConfig } from "axios";
import path from "path";
import { Utility } from "../utils";
import * as fs from "fs";
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
        console.log(stations.data);
        expect(Array.isArray(stations.data)).toBe(true);

    }, 10000)

    it('Should list GTFS Pathways versions', async () => {
        let gtfsPathwaysAPI = new GTFSPathwaysApi(configuration);
        const versions = await gtfsPathwaysAPI.listPathwaysVersions();
        console.log(versions.data.versions);
        expect(Array.isArray(versions.data.versions)).toBe(true);

    }, 10000)

    it("Should be able to upload Pathways files", async () => {
        let metaToUpload = Utility.getRandomGtfsPathwaysUpload();
        const requestInterceptor = (request: InternalAxiosRequestConfig, fileName: string) => {
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
        // Actual method does not give the results as expected
        // So we are writing interceptor
        const uploadInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) =>
            requestInterceptor(req, "pathways-test-upload.zip")
        );
        let fileDir = path.dirname(path.dirname(__dirname));
        let payloadFilePath = path.join(
            fileDir,
            "assets/payloads/gtfs-pathways/files/success_1_all_attrs.zip"
        );
        let filestream = fs.readFileSync(payloadFilePath);
        const blob = new Blob([filestream], { type: "application/zip" });
        let pathwaysApi = new GTFSPathwaysApi(configuration);

        const uploadedFileResponse = await pathwaysApi.uploadPathwaysFileForm(
            metaToUpload,
            blob
        );
        expect(uploadedFileResponse.data != "").toBe(true);

    }, 50000);
});