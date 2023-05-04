import {GeneralApi, GTFSPathwaysApi} from "tdei-client";
import {Utility} from "../utils";
import axios from "axios";
import path from "path";
import * as fs from "fs";
import {Seeder} from '../seeder'
import {promisify, types} from "util";
import AdmZip from 'adm-zip'


const DOWNLOAD_FILE_PATH = `${__dirname}/tmp`

let orgDetails;


describe("GTFS PATHWAYS API", () => {
    let configuration = Utility.getConfiguration();

    beforeAll(async () => {
        let generalAPI = new GeneralApi(configuration);
        const loginResponse = await generalAPI.authenticate({
            username: configuration.username,
            password: configuration.password
        });
        configuration.baseOptions = {
            headers: {...Utility.addAuthZHeader(loginResponse.data.access_token)}
        };
        // Create a cleaned up download folder
        if (!fs.existsSync(DOWNLOAD_FILE_PATH)) {
            fs.mkdirSync(DOWNLOAD_FILE_PATH);
        } else {
            fs.rmSync(DOWNLOAD_FILE_PATH, {recursive: true, force: true});
            fs.mkdirSync(DOWNLOAD_FILE_PATH);
        }
        // orgDetails = await new Seeder().seed()
    })

    afterAll(async () => {
        fs.rmSync(DOWNLOAD_FILE_PATH, {recursive: true, force: true});
    })

    it("Should list GTFS Pathways Files", async () => {
        let gtfsPathwaysAPI = new GTFSPathwaysApi(configuration);

        const gtfsPathwaysDownload = await gtfsPathwaysAPI.listPathwaysFiles();

        expect(Array.isArray(gtfsPathwaysDownload.data)).toBe(true);
    }, 10000);

    it("Should list GTFS Pathways Stations", async () => {
        let gtfsPathwaysAPI = new GTFSPathwaysApi(configuration);

        const stations = await gtfsPathwaysAPI.listStations();

        expect(Array.isArray(stations.data)).toBe(true);
    }, 10000);

    it("Should list GTFS Pathways versions", async () => {
        let gtfsPathwaysAPI = new GTFSPathwaysApi(configuration);

        const versions = await gtfsPathwaysAPI.listPathwaysVersions();

        expect(Array.isArray(versions.data.versions)).toBe(true);
    }, 10000);

    it("Should be able to upload GTFS pathways file", async () => {
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
        const blob = new Blob([filestream], {type: "application/zip"});

        const uploadedFileResponse = await gtfsPathwaysAPI.uploadPathwaysFileForm(
            metaToUpload,
            blob
        );
        expect(uploadedFileResponse.status).toBe(202);
        expect(uploadedFileResponse.data).not.toBeNull();
        axios.interceptors.request.eject(uploadInterceptor);
    });

    it('Should be able to download file', async () => {
        let tdei_record_id = '6d658630ce9f4c53a7fdd30bfd759476';
        let gtfsPathwaysAPI = new GTFSPathwaysApi(configuration);
        let response = await gtfsPathwaysAPI.getPathwaysFile(tdei_record_id, {responseType: 'arraybuffer'});
        const data: any = response.data

        const contentDisposition = response.headers['content-disposition'];
        const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
        const matches = filenameRegex.exec(contentDisposition);
        const fileName = (matches != null && matches[1]) ? matches[1].replace(/['"]/g, '') : 'data.zip';
        const filePath = `${DOWNLOAD_FILE_PATH}/${fileName}`
        fs.writeFileSync(filePath, new Uint8Array(data))
        const zip = new AdmZip(filePath);
        zip.extractAllTo(DOWNLOAD_FILE_PATH, true);
        expect(fileName.includes('zip')).toBe(true)
        expect(response.data).not.toBeNull();
        expect(response.status).toBe(200);
    });
});
