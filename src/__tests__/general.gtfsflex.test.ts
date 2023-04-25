import {GeneralApi, GTFSFlexApi} from 'tdei-client';
import {Utility} from '../utils';
import axios, {InternalAxiosRequestConfig} from 'axios';
import {Seeder} from '../seeder'
import path from 'path';
import * as fs from 'fs';
import AdmZip from 'adm-zip'


const DOWNLOAD_FILE_PATH = `${__dirname}/tmp`

describe('GTFS FLEX API', () => {

    let configuration = Utility.getConfiguration();

    beforeAll(async () => {
        let generalAPI = new GeneralApi(configuration);

        const loginResponse = await generalAPI.authenticate({
            username: configuration.username,
            password: configuration.password
        });
        configuration.baseOptions = {
            headers: {
                ...Utility.addAuthZHeader(loginResponse.data.access_token)
            }
        };

        if (!fs.existsSync(DOWNLOAD_FILE_PATH)) {
            fs.mkdirSync(DOWNLOAD_FILE_PATH);
        } else {
            fs.rmSync(DOWNLOAD_FILE_PATH, { recursive: true, force: true });
            fs.mkdirSync(DOWNLOAD_FILE_PATH);
        }
    });

    afterAll(async () => {
        fs.rmSync(DOWNLOAD_FILE_PATH, { recursive: true, force: true });
    })


    it('Should be able to upload Flex files', async () => {
        let metaToUpload = Utility.getRandomGtfsFlexUpload();
        const orgDetails = await new Seeder().seed()
        // @ts-ignore
        metaToUpload.tdei_org_id = orgDetails.tdei_org_id
        // @ts-ignore
        metaToUpload.tdei_service_id = orgDetails.service_id
        const requestInterceptor = (request: InternalAxiosRequestConfig, fileName: string) => {
            if (
                request.url === `${configuration.basePath}/api/v1/gtfs-flex`
            ) {
                let data = request.data as FormData;
                let file = data.get('file') as File;
                delete data['file'];
                delete data['meta'];
                data.set('file', file, fileName);
                data.set('meta', JSON.stringify(metaToUpload));
            }
            return request;
        };
        // Actual method does not give the results as expected
        // So we are writing interceptor
        const uploadInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) =>
            requestInterceptor(req, 'flex-test-upload.zip')
        );
        let fileDir = path.dirname(path.dirname(__dirname));
        let payloadFilePath = path.join(
            fileDir,
            'assets/payloads/gtfs-flex/files/success_1_all_attrs.zip'
        );
        let filestream = fs.readFileSync(payloadFilePath);

        let isValidZipFile = false
        try {
            fs.writeFileSync(`${DOWNLOAD_FILE_PATH}/success_1_all_attrs.zip`, filestream);
            const zip = new AdmZip(`${DOWNLOAD_FILE_PATH}/success_1_all_attrs.zip`)
            zip.extractAllTo(DOWNLOAD_FILE_PATH, true)
            isValidZipFile = true
        } catch (e) {
            console.error(e)
        }
        if (isValidZipFile) {
            let uploadFilestream = fs.readFileSync(`${DOWNLOAD_FILE_PATH}/success_1_all_attrs.zip`);
            const blob = new Blob([uploadFilestream], {type: 'application/zip'});
            let flexApi = new GTFSFlexApi(configuration);

            const uploadedFileResponse = await flexApi.uploadGtfsFlexFileForm(
                metaToUpload,
                blob
            );

            expect(uploadedFileResponse.data != "").toBe(true);
        }
        expect(isValidZipFile).toBe(true);
    }, 50000);
});