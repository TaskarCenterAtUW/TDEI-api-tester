import { GeneralApi } from "tdei-client";
import { Utility } from "../utils";

describe("General API", () => {
  let configuration = Utility.getConfiguration();

  beforeAll(async () => {
    let generalAPI = new GeneralApi(configuration);
    const loginResponse = await generalAPI.authenticate({
      username: configuration.username,
      password: configuration.password
    });
    configuration.baseOptions = {
      headers: { ...Utility.addAuthZHeader(loginResponse.data.access_token) }
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
  }, 10000);

  it("Should list down all the stations", async () => {
    let generalAPI = new GeneralApi(configuration);

    const StationList = await generalAPI.listStations();

    expect(Array.isArray(StationList.data)).toBe(true);
  }, 10000);

  it("Should get status", async () => {
    let generalAPI = new GeneralApi(configuration);
    let recordId = "3a9f0655ccab4e88833f015fe926a7ca";

    const status = await generalAPI.getStatus(recordId);

    expect(status.status).toBe(200);
    expect(status.data.tdeiRecordId).toBe(recordId);
  }, 10000);

  it("Should list available API versions", async () => {
    let generalAPI = new GeneralApi(configuration);

    const versions = await generalAPI.listApiVersions();

    expect(versions.data.version).not.toBeNull();
  }, 10000);
});
