

import { Configuration, GeneralApi, GTFSPathwaysApi } from "tdei-client";
import testHarness from "../test-harness.json";

describe('GTFS PATHWAYS API', () => {

    let configuration = new Configuration({
        username: testHarness.system.username,
        password: testHarness.system.password,
        basePath: testHarness.system.baseUrl
        
    });

    beforeAll( async ()=>{
        let generalAPI = new GeneralApi(configuration);
        const loginResponse = await generalAPI.authenticate({username:configuration.username,password:configuration.password});
        configuration.baseOptions = {
            headers:{
                'Authorization':'Bearer '+ loginResponse.data.access_token
            }
        };
    });

    it('Should list GTFS Pathways Files', async () => {
        let gtfsPathwaysAPI = new GTFSPathwaysApi(configuration);
        const gtfsPathwaysDownload = await gtfsPathwaysAPI.listPathwaysFiles();
        expect(Array.isArray(gtfsPathwaysDownload.data)).toBe(true);
       
    },10000)

    it('Should list GTFS Pathways Stations', async () => {
        let gtfsPathwaysAPI = new GTFSPathwaysApi(configuration);
        const stations = await gtfsPathwaysAPI.listStations();
        console.log(stations.data);
        expect(Array.isArray(stations.data)).toBe(true);
       
    },10000)

    it('Should list GTFS Pathways versions', async () => {
        let gtfsPathwaysAPI = new GTFSPathwaysApi(configuration);
        const versions = await gtfsPathwaysAPI.listPathwaysVersions();
        console.log(versions.data);
        expect(Array.isArray(versions.data["versions"])).toBe(true);
       
    },10000)

 
});