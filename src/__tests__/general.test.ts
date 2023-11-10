import { AuthenticationApi, GeneralApi, RecordStatus, VersionSpec } from "tdei-client";
import { Utility } from "../utils";


describe("General service", () => {

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



  describe("List API versions", () => {
    describe("Functional", () => {

      it('When valid token is provided, expect to return 200 status with api version list', async () => {
        // Arrange
        let generalAPI = new GeneralApi(configuration);
        // Action
        const versions = await generalAPI.listApiVersions();

        // Assert
        expect(versions.status).toBe(200);
        expect(versions.data.versions).not.toBeNull();

        versions.data.versions?.forEach(version => {
          expect(version).toMatchObject(<VersionSpec>{
            version: expect.any(String),
            documentation: expect.any(String),
            specification: expect.any(String)
          });
        })
      }, 30000)

      it('When no token is provided, expect to 401 status in return', async () => {

        let generalAPI = new GeneralApi(Utility.getConfiguration());

        const version = generalAPI.listApiVersions();

        await expect(version).rejects.toMatchObject({ response: { status: 401 } });


      }, 30000);

    });
  })

  describe('List ProjectGroups', () => {

    describe('Functional', () => {

      it('When valid token provided, expect to return 200 status and list of project groups', async () => {
        let generalAPI = new GeneralApi(configuration);

        const projectGroupList = await generalAPI.listProjectGroups();

        expect(projectGroupList.status).toBe(200);
        expect(Array.isArray(projectGroupList.data)).toBe(true);

        projectGroupList.data.forEach(data => {
          expect(data).toMatchObject(<any>{
            tdei_project_group_id: expect.any(String),
            project_group_name: expect.any(String),
            polygon: expect.any(Object || null)
          })
        })
      }, 30000)

      //Commenting below test case, we cannot predict project_group_id to be present in list unless we filter by project_group_id. 
      //Currently project_group_id filter is not defined as part of API spec, when introduced we can modify below test case
      //by applying project_group_id filter and expect the desired output

      // it('When valid token provided, expect to return 200 status and contain project_group_id that is predefined ', async () => {
      //   let generalAPI = new GeneralApi(configuration);
      //   const projectGroupList = await generalAPI.listProjectGroups();

      //   expect(projectGroupList.status).toBe(200);
      //   expect(projectGroupList.data).toEqual(expect.arrayContaining([expect.objectContaining({ tdei_project_group_id: 'c552d5d1-0719-4647-b86d-6ae9b25327b7' })]));
      // }, 30000)
    })

    describe('Validation', () => {
      it('When requested without token, it should return 401 status', async () => {
        let generalAPI = new GeneralApi(Utility.getConfiguration());

        const projectGroupList = generalAPI.listProjectGroups();

        await expect(projectGroupList).rejects.toMatchObject({ response: { status: 401 } });

      }, 30000)
    })
  })

  describe('Get status', () => {
    describe('Functional', () => {
      it('When passed with recordId and valid token, should return result with same recordId', async () => {
        let generalAPI = new GeneralApi(configuration);
        const recordId = '7cd301eb50ea413f90be12598d158149';

        const recordStatus = await generalAPI.getStatus(recordId);

        expect(recordStatus.status).toBe(200);
        expect(recordStatus.data).toMatchObject(<RecordStatus>{
          tdeiRecordId: recordId,
          stage: expect.any(String),
          status: expect.any(String),
          isComplete: expect.any(Boolean)
        })
      }, 30000)
    })

    describe('Validation', () => {
      it('When passed with wrong recordId and valid token, should fail with 404 not found', async () => {

        let generalAPI = new GeneralApi(configuration);
        const wrongRecordId = '7cd301eb50ea413f90be12598d158133';

        const recordStatus = generalAPI.getStatus(wrongRecordId);

        await expect(recordStatus).rejects.toMatchObject({ response: { status: 404 } });

      }, 30000)

      it('When passed with recordId and without token, should fail with 401 error', async () => {

        let generalAPI = new GeneralApi(Utility.getConfiguration());
        const recordId = '7cd301eb50ea413f90be12598d158149';

        const recordStatus = generalAPI.getStatus(recordId);

        await expect(recordStatus).rejects.toMatchObject({ response: { status: 401 } });

      }, 30000)

    })
  })

});

