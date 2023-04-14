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
  }, 10000);
});
