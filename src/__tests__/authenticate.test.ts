import { AuthenticationApi, GeneralApi, Organization, RecordStatus, VersionSpec } from "tdei-client";
import { Utility } from "../utils";
import { AxiosError } from "axios";
import { isAxiosError } from "axios";
import exp from "constants";
import { type } from "os";


describe("Authenticate service", () => {

  let configuration = Utility.getConfiguration();

  beforeAll(async () => {
    let authAPI = new AuthenticationApi(configuration);
    const loginResponse = await authAPI.authenticate({
      username: configuration.username,
      password: configuration.password
    });
    configuration.baseOptions = {
      headers: { ...Utility.addAuthZHeader(loginResponse.data.access_token) }
    };
  }, 30000);


  describe('Authentication', () => {
    describe('Functional', () => {

      it('When valid username and password provided, should return 200 status with access_token', async () => {

        let authAPI = new AuthenticationApi(Utility.getConfiguration());

        const loginResponse = await authAPI.authenticate({
          username: configuration.username,
          password: configuration.password
        });

        expect(loginResponse.data.access_token).not.toBeNull();
      }, 30000)
    })
    describe('Validate', () => {
      it('When invalid username and password provided, should return 401 status', async () => {

        let authAPI = new AuthenticationApi(Utility.getConfiguration());

        let loginResponse = authAPI.authenticate({ username: 'abc@gmail.com', password: 'invalidpassword' });

        await expect(loginResponse).rejects.toMatchObject({ response: { status: 401 } });

      }, 30000)
    })
  })
});

