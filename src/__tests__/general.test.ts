import { Configuration, GeneralApi } from "tdei-client";
import testHarness from "../test-harness.json";

describe("General API", () => {
  let configuration = new Configuration({
    username: testHarness.system.username,
    password: testHarness.system.password,
    basePath: testHarness.system.baseUrl
  });

  beforeAll(async () => {
    let generalAPI = new GeneralApi(configuration);
    const loginResponse = await generalAPI.authenticate({
      username: configuration.username,
      password: configuration.password
    });
    configuration.baseOptions = {
      headers: {
        Authorization: `Bearer ${loginResponse.data.access_token}`
      }
    };
  });

  it("Should be able to login", async () => {
    let generalAPI = new GeneralApi(configuration);

    const loginResponse = await generalAPI.authenticate({
      username: configuration.username,
      password: configuration.password
    });

    expect(loginResponse.data.access_token).not.toBeNull();
  });

  it("Should list down all the organizations", async () => {
    let generalAPI = new GeneralApi(configuration);

    const orgList = await generalAPI.listOrganizations();

        expect(Array.isArray(orgList.data)).toBe(true);

    },10000);

    it('Should list down all the stations',async () => {
        let generalAPI = new GeneralApi(configuration);
        const StationList = await generalAPI.listStations();
        expect(Array.isArray(StationList.data)).toBe(true);
        
    },10000);

    it('Should get status', async () => {
        let generalAPI = new GeneralApi(configuration);
        const status = await generalAPI.getStatus('');
        expect(status.data).toBe(true);
    },10000)

    it('Should list available API versions', async () => {
        let generalAPI = new GeneralApi(configuration);
        const versions = await generalAPI.listApiVersions();
        // status check
        // versions.status to be 200
        expect(versions.data.version).not.toBe('');

    },10000)

});
