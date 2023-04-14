import { Configuration, GeneralApi, OSWApi, OswUpload } from "tdei-client";
import testHarness from "../test-harness.json";
import axios from "axios";
import { Utility } from "../utils";
import path from "path";
import * as fs from "fs";

describe('Tests for OSW', ()=>{

    let configuration = new Configuration({
        username: testHarness.system.username,
        password: testHarness.system.password,
        basePath: testHarness.system.baseUrl
        
    });
    
    beforeAll( async ()=>{
        // console.log('Hello there');
        let generalAPI = new GeneralApi(configuration);
        const loginResponse = await generalAPI.authenticate({username:configuration.username,password:configuration.password});
        configuration.baseOptions = {
            headers:{
                'Authorization':'Bearer '+ loginResponse.data.access_token
            }
        };
        
      
    });
    
    it('Should get list of osw versions', async ()=>{
        let oswAPI = new OSWApi(configuration);
        const oswVersions = await oswAPI.listOswVersions();
        expect(oswVersions.status).toBe(200);
        expect(Array.isArray(oswVersions.data.versions)).toBe(true);

    });
    
    it('Should return list of osw files', async ()=>{
        let oswAPI = new OSWApi(configuration);
        const oswFiles = await oswAPI.listOswFiles();
        expect(oswFiles.status).toBe(200);
        expect(Array.isArray(oswFiles.data)).toBe(true);

    });

    it('Should be able to upload osw files', async ()=>{
        
        let metaToUpload = Utility.getRandomOswUpload();
        // Actual method does not give the results as expected
        // So we are writing interceptor

const uploadInterceptor  =  axios.interceptors.request.use((x) => {
            const data = x.data as FormData;
            var file = data.get('file') as File;
            data.delete('file');
            data.set('file',file,'abc.zip');
            data.delete('meta');
            data.set('meta',JSON.stringify(metaToUpload));
            return x;
        });

        let fileDir = path.dirname(path.dirname(__dirname));
        let payloadFilePath = path.join(fileDir,'assets/payloads/osw/files/valid.zip');
        let filestream = fs.readFileSync(payloadFilePath);
        const blob = new Blob([filestream],{type:'application/zip'}) ;
        let oswAPI = new OSWApi(configuration);
        // try {
        const uploadedFileResponse = await oswAPI.uploadOswFileForm(metaToUpload,blob);
        console.log(uploadedFileResponse.data);
        expect(uploadedFileResponse.status).toBe(202);
        expect(uploadedFileResponse.data).not.toBe('');
        axios.interceptors.request.eject(uploadInterceptor);
        // }
        // catch (e){
        //     // console.log(e);
        //     if (axios.isAxiosError(e)) {
        //         console.log(e.response?.data);
        //     }
        //     axios.interceptors.request.eject(myInterceptor);
        // }
    });
    


});