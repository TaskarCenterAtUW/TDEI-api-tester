

import { Configuration, GeneralApi, GTFSFlexApi } from "tdei-client";
import testHarness from "../test-harness.json";

describe('GTFS FLEX API', () => {

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

    it('Should list GTFS flex services', async () => {
        let gtfsFlexAPI = new GTFSFlexApi(configuration);
        const services = await gtfsFlexAPI.listFlexServices();
        expect(Array.isArray(services.data)).toBe(true);
       
    },10000)

    it('Should list GTFS flex versions', async () => {
        let gtfsFlexAPI = new GTFSFlexApi(configuration);
        const versions = await gtfsFlexAPI.listFlexVersions();
        console.log(versions.data);
        expect(Array.isArray(versions.data["versions"])).toBe(true);
       
    },10000)

    it('Should list GTFS flex files', async () => {
        let gtfsFlexAPI = new GTFSFlexApi(configuration);
        const files = await gtfsFlexAPI.listFlexFiles();
        expect(Array.isArray(files.data)).toBe(true);
       
    },10000)







});