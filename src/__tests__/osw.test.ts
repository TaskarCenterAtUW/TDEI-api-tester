import { Configuration, GeneralApi, OSWApi } from "tdei-client";
import testHarness from "../test-harness.json";

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

});