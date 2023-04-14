

import {  GeneralApi, GTFSFlexApi } from "tdei-client";
import { Utility } from "../utils";
import axios, { InternalAxiosRequestConfig } from "axios";
import path from "path";
import * as fs from "fs";

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