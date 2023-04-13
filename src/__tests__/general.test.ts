// import { describe } from "node:test";

import { Configuration, GeneralApi } from "tdei-client";
// import { HarnessTester } from "../harness-tester";
import testHarness from "../test-harness.json";

describe('Login API', () =>{

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

    it('Should be able to login',async ()=> {
        
        let generalAPI = new GeneralApi(configuration);
        const loginResponse = await generalAPI.authenticate({username:configuration.username,password:configuration.password});
        expect(loginResponse.data.access_token).not.toBe('');
    });

    it('Should list down all the organizations',async () => {

        let generalAPI = new GeneralApi(configuration);
        const orgList = await generalAPI.listOrganizations();
        expect(Array.isArray(orgList.data)).toBe(true);

    },10000);

});