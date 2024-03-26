import { AuthenticationApi, DatasetItem, DatasetItemCollectionMethodEnum, DatasetItemDataSourceEnum, DatasetItemStatusEnum, GeneralApi, VersionSpec } from "tdei-client";
import { Utility } from "../utils";


describe("General service", () => {
  const NULL_PARAM = void 0;

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

  describe('List Files', () => {
    describe('Functional', () => {
      it('When passed with valid token, should return 200 status with list of osw records', async () => {
        let oswAPI = new GeneralApi(configuration);

        const datasetFiles = await oswAPI.listDatasetFiles();

        expect(datasetFiles.status).toBe(200);

        expect(Array.isArray(datasetFiles.data)).toBe(true);

        datasetFiles.data.forEach(file => {
          expect(file).toMatchObject(<DatasetItem>{
            status: expect.toBeOneOf([DatasetItemStatusEnum.PreRelease.toString(), DatasetItemStatusEnum.Publish.toString()]),
            name: expect.any(String),
            description: expect.toBeOneOf([null, expect.any(String)]),
            version: expect.any(String),
            derived_from_dataset_id: expect.toBeOneOf([null, expect.any(String)]),
            custom_metadata: expect.anything(),
            uploaded_timestamp: expect.any(String),
            tdei_project_group_id: expect.any(String),
            collected_by: expect.any(String),
            collection_date: expect.any(String),
            collection_method: expect.toBeOneOf([
              DatasetItemCollectionMethodEnum.Generated.toString(),
              DatasetItemCollectionMethodEnum.Other.toString(),
              DatasetItemCollectionMethodEnum.Transform.toString(),
              DatasetItemCollectionMethodEnum.Manual.toString()]),
            valid_from: expect.any(String),
            valid_to: expect.toBeOneOf([null, expect.any(String)]),
            confidence_level: expect.any(Number),
            data_source: expect.toBeOneOf([
              DatasetItemDataSourceEnum.InHouse.toString(),
              DatasetItemDataSourceEnum.TDEITools.toString(),
              DatasetItemDataSourceEnum._3rdParty.toString()]),
            dataset_area: expect.toBeOneOf([null, expect.toBeObject()]),
            tdei_dataset_id: expect.any(String),
            schema_version: expect.any(String),
            download_url: expect.any(String)
          });
        });
      });


      it('When passed with valid token and page size, should return 200 status with files less than or equal to 5', async () => {
        let oswAPI = new GeneralApi(configuration);
        let page_size = 5;

        const datasetFiles = await oswAPI.listDatasetFiles(
          NULL_PARAM,//data_type ?: string, 
          NULL_PARAM, //status ?: string,
          NULL_PARAM, // name ?: string,
          NULL_PARAM, // version ?: string, 
          NULL_PARAM, //data_source ?: string, 
          NULL_PARAM, // collection_method ?: string, 
          NULL_PARAM, //collected_by ?: string, 
          NULL_PARAM, // derived_from_dataset_id ?: string, 
          NULL_PARAM,// collection_date ?: string, 
          NULL_PARAM,// confidence_level ?: number, 
          NULL_PARAM,// schema_version ?: string, 
          NULL_PARAM,// tdei_project_group_id ?: string,
          NULL_PARAM,// valid_from ?: string, 
          NULL_PARAM, // valid_to ?: string, 
          NULL_PARAM,// tdei_dataset_id ?: string, 
          NULL_PARAM,// bbox ?: Array<number>, 
          NULL_PARAM,// page_no ?: number, 
          page_size,// page_size?: number | undefined, 
          // options?: AxiosRequestConfig<...> | undefined
        );

        expect(datasetFiles.status).toBe(200);
        expect(datasetFiles.data.length).toBeLessThanOrEqual(page_size);


      });

      it('When passed with valid token and valid project group ID, should return 200 status with files of the same project group', async () => {
        let oswAPI = new GeneralApi(configuration);
        //TODO: read from seeder or config
        let project_group_id = '5e339544-3b12-40a5-8acd-78c66d1fa981';
        const datasetFiles = await oswAPI.listDatasetFiles(
          NULL_PARAM,//data_type ?: string, 
          "All", //status ?: string,
          NULL_PARAM, // name ?: string,
          NULL_PARAM, // version ?: string, 
          NULL_PARAM, //data_source ?: string, 
          NULL_PARAM, // collection_method ?: string, 
          NULL_PARAM, //collected_by ?: string, 
          NULL_PARAM, // derived_from_dataset_id ?: string, 
          NULL_PARAM,// collection_date ?: string, 
          NULL_PARAM,// confidence_level ?: number, 
          NULL_PARAM,// schema_version ?: string, 
          project_group_id,// tdei_project_group_id ?: string,
          // NULL_PARAM,// valid_from ?: string, 
          // NULL_PARAM, // valid_to ?: string, 
          // NULL_PARAM,// tdei_dataset_id ?: string, 
          // NULL_PARAM,// bbox ?: Array<number>, 
          // NULL_PARAM,// page_no ?: number, 
          // page_size,// page_size?: number | undefined, 
          // options?: AxiosRequestConfig<...> | undefined
        );

        expect(datasetFiles.status).toBe(200);
        datasetFiles.data.forEach(file => {
          expect(file.tdei_project_group_id).toBe(project_group_id)
        })

      });

      it('When passed with valid token and valid recordId, should return 200 status with same record ID', async () => {
        let oswAPI = new GeneralApi(configuration);
        let recordId = "40566429d02c4c80aee68c970977bed8";

        const datasetFiles = await oswAPI.listDatasetFiles(
          NULL_PARAM,//data_type ?: string, 
          "All", //status ?: string,
          NULL_PARAM, // name ?: string,
          NULL_PARAM, // version ?: string, 
          NULL_PARAM, //data_source ?: string, 
          NULL_PARAM, // collection_method ?: string, 
          NULL_PARAM, //collected_by ?: string, 
          NULL_PARAM, // derived_from_dataset_id ?: string, 
          NULL_PARAM,// collection_date ?: string, 
          NULL_PARAM,// confidence_level ?: number, 
          NULL_PARAM,// schema_version ?: string, 
          NULL_PARAM,// tdei_project_group_id ?: string,
          NULL_PARAM,// valid_from ?: string, 
          NULL_PARAM, // valid_to ?: string, 
          recordId,// tdei_dataset_id ?: string, 
          // NULL_PARAM,// bbox ?: Array<number>, 
          // NULL_PARAM,// page_no ?: number, 
          // page_size,// page_size?: number | undefined, 
          // options?: AxiosRequestConfig<...> | undefined
        );

        expect(datasetFiles.status).toBe(200);
        expect(datasetFiles.data.length).toBe(1);
        datasetFiles.data.forEach(file => {
          expect(file.tdei_dataset_id).toBe(recordId)
        });
      });

      it('When passed with valid token and valid schema_version, should return 200 status with records matching schema_version', async () => {
        let oswAPI = new GeneralApi(configuration);
        let schema_version = "v0.1";

        const datasetFiles = await oswAPI.listDatasetFiles(
          NULL_PARAM,//data_type ?: string, 
          "All", //status ?: string,
          NULL_PARAM, // name ?: string,
          NULL_PARAM, // version ?: string, 
          NULL_PARAM, //data_source ?: string, 
          NULL_PARAM, // collection_method ?: string, 
          NULL_PARAM, //collected_by ?: string, 
          NULL_PARAM, // derived_from_dataset_id ?: string, 
          NULL_PARAM,// collection_date ?: string, 
          NULL_PARAM,// confidence_level ?: number, 
          schema_version,// schema_version ?: string, 
          // NULL_PARAM,// tdei_project_group_id ?: string,
          // NULL_PARAM,// valid_from ?: string, 
          // NULL_PARAM, // valid_to ?: string, 
          // NULL_PARAM,// tdei_dataset_id ?: string, 
          // NULL_PARAM,// bbox ?: Array<number>, 
          // NULL_PARAM,// page_no ?: number, 
          // NULL_PARAM,// page_size?: number | undefined, 
          // options?: AxiosRequestConfig<...> | undefined
        );

        expect(datasetFiles.status).toBe(200);
        datasetFiles.data.forEach(file => {
          expect(file.schema_version).toContain(schema_version)
        });
      });

      it('When passed with valid token and valid name, should return 200 status with records matching name', async () => {
        let oswAPI = new GeneralApi(configuration);
        let name = "manual";

        const datasetFiles = await oswAPI.listDatasetFiles(
          NULL_PARAM,//data_type ?: string, 
          "All", //status ?: string,
          name, // name ?: string,
          // NULL_PARAM, // version ?: string, 
          // NULL_PARAM, //data_source ?: string, 
          // NULL_PARAM, // collection_method ?: string, 
          // NULL_PARAM, //collected_by ?: string, 
          // NULL_PARAM, // derived_from_dataset_id ?: string, 
          // NULL_PARAM,// collection_date ?: string, 
          // NULL_PARAM,// confidence_level ?: number, 
          // NULL_PARAM,// schema_version ?: string, 
          // NULL_PARAM,// tdei_project_group_id ?: string,
          // NULL_PARAM,// valid_from ?: string, 
          // NULL_PARAM, // valid_to ?: string, 
          // NULL_PARAM,// tdei_dataset_id ?: string, 
          // NULL_PARAM,// bbox ?: Array<number>, 
          // NULL_PARAM,// page_no ?: number, 
          // NULL_PARAM,// page_size?: number | undefined, 
          // // options?: AxiosRequestConfig<...> | undefined
        );

        expect(datasetFiles.status).toBe(200);
        datasetFiles.data.forEach(file => {
          expect(file.name).toContain(name)
        });
      });

      it('When passed with valid token and valid collection_method, should return 200 status with records matching collection_method', async () => {
        let oswAPI = new GeneralApi(configuration);
        let collection_method = "manual";

        const datasetFiles = await oswAPI.listDatasetFiles(
          NULL_PARAM,//data_type ?: string, 
          "All", //status ?: string,
          NULL_PARAM, // name ?: string,
          NULL_PARAM, // version ?: string, 
          NULL_PARAM, //data_source ?: string, 
          collection_method, // collection_method ?: string, 
          // NULL_PARAM, //collected_by ?: string, 
          // NULL_PARAM, // derived_from_dataset_id ?: string, 
          // NULL_PARAM,// collection_date ?: string, 
          // NULL_PARAM,// confidence_level ?: number, 
          // NULL_PARAM,// schema_version ?: string, 
          // NULL_PARAM,// tdei_project_group_id ?: string,
          // NULL_PARAM,// valid_from ?: string, 
          // NULL_PARAM, // valid_to ?: string, 
          // NULL_PARAM,// tdei_dataset_id ?: string, 
          // NULL_PARAM,// bbox ?: Array<number>, 
          // NULL_PARAM,// page_no ?: number, 
          // NULL_PARAM,// page_size?: number | undefined, 
          // // options?: AxiosRequestConfig<...> | undefined
        );

        expect(datasetFiles.status).toBe(200);
        datasetFiles.data.forEach(file => {
          expect(file.collection_method).toBe(collection_method)
        });
      });
      it('When passed with valid token and valid collected_by, should return 200 status with records matching collected_by', async () => {
        let oswAPI = new GeneralApi(configuration);
        let collected_by = "John Doe";

        const datasetFiles = await oswAPI.listDatasetFiles(
          NULL_PARAM,//data_type ?: string, 
          NULL_PARAM, //status ?: string,
          NULL_PARAM, // name ?: string,
          NULL_PARAM, // version ?: string, 
          NULL_PARAM, //data_source ?: string, 
          NULL_PARAM, // collection_method ?: string, 
          collected_by, //collected_by ?: string, 
          NULL_PARAM, // derived_from_dataset_id ?: string, 
          NULL_PARAM,// collection_date ?: string, 
          NULL_PARAM,// confidence_level ?: number, 
          NULL_PARAM,// schema_version ?: string, 
          NULL_PARAM,// tdei_project_group_id ?: string,
          NULL_PARAM,// valid_from ?: string, 
          NULL_PARAM, // valid_to ?: string, 
          NULL_PARAM,// tdei_dataset_id ?: string, 
          NULL_PARAM,// bbox ?: Array<number>, 
          NULL_PARAM,// page_no ?: number, 
          NULL_PARAM,// page_size?: number | undefined, 
          // options?: AxiosRequestConfig<...> | undefined
        );

        expect(datasetFiles.status).toBe(200);
        datasetFiles.data.forEach(file => {
          expect(file.collected_by).toBe(collected_by)
        });
      });

      it('When passed with valid token and valid data_source, should return 200 status with records matching data_source', async () => {
        let oswAPI = new GeneralApi(configuration);
        let data_source = "3rdParty";

        const datasetFiles = await oswAPI.listDatasetFiles(
          NULL_PARAM,//data_type ?: string, 
          NULL_PARAM, //status ?: string,
          NULL_PARAM, // name ?: string,
          NULL_PARAM, // version ?: string, 
          data_source, //data_source ?: string, 
          NULL_PARAM, // collection_method ?: string, 
          NULL_PARAM, //collected_by ?: string, 
          NULL_PARAM, // derived_from_dataset_id ?: string, 
          NULL_PARAM,// collection_date ?: string, 
          NULL_PARAM,// confidence_level ?: number, 
          NULL_PARAM,// schema_version ?: string, 
          NULL_PARAM,// tdei_project_group_id ?: string,
          NULL_PARAM,// valid_from ?: string, 
          NULL_PARAM, // valid_to ?: string, 
          NULL_PARAM,// tdei_dataset_id ?: string, 
          NULL_PARAM,// bbox ?: Array<number>, 
          NULL_PARAM,// page_no ?: number, 
          NULL_PARAM,// page_size?: number | undefined, 
          // options?: AxiosRequestConfig<...> | undefined
        );

        expect(datasetFiles.status).toBe(200);
        datasetFiles.data.forEach(file => {
          expect(file.data_source).toBe(data_source)
        })
      });

      it('When passed with valid token and valid derived_from_dataset_id, should return 200 status with records matching derived_from_dataset_id', async () => {
        let oswAPI = new GeneralApi(configuration);
        let derived_from_dataset_id = "a042a1b3aa874701929cb33a98f28e9d";

        const datasetFiles = await oswAPI.listDatasetFiles(
          NULL_PARAM,//data_type ?: string, 
          "All", //status ?: string,
          NULL_PARAM, // name ?: string,
          NULL_PARAM, // version ?: string, 
          NULL_PARAM, //data_source ?: string, 
          NULL_PARAM, // collection_method ?: string, 
          NULL_PARAM, //collected_by ?: string, 
          derived_from_dataset_id, // derived_from_dataset_id ?: string, 
          NULL_PARAM,// collection_date ?: string, 
          NULL_PARAM,// confidence_level ?: number, 
          NULL_PARAM,// schema_version ?: string, 
          NULL_PARAM,// tdei_project_group_id ?: string,
          NULL_PARAM,// valid_from ?: string, 
          NULL_PARAM, // valid_to ?: string, 
          NULL_PARAM,// tdei_dataset_id ?: string, 
          NULL_PARAM,// bbox ?: Array<number>, 
          NULL_PARAM,// page_no ?: number, 
          NULL_PARAM,// page_size?: number | undefined, 
          // options?: AxiosRequestConfig<...> | undefined
        );

        expect(datasetFiles.status).toBe(200);
        datasetFiles.data.forEach(file => {
          expect(file.derived_from_dataset_id).toBe(derived_from_dataset_id)
        })
      });

      it('When passed with valid token and valid valid_to, should return 200 status with records valid from input datetime', async () => {
        let oswAPI = new GeneralApi(configuration);
        //set date one date before today
        let valid_to = new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString();

        const datasetFiles = await oswAPI.listDatasetFiles(
          NULL_PARAM,//data_type ?: string, 
          "All", //status ?: string,
          NULL_PARAM, // name ?: string,
          NULL_PARAM, // version ?: string, 
          NULL_PARAM, //data_source ?: string, 
          NULL_PARAM, // collection_method ?: string, 
          NULL_PARAM, //collected_by ?: string, 
          NULL_PARAM, // derived_from_dataset_id ?: string, 
          NULL_PARAM,// collection_date ?: string, 
          NULL_PARAM,// confidence_level ?: number, 
          NULL_PARAM,// schema_version ?: string, 
          NULL_PARAM,// tdei_project_group_id ?: string,
          NULL_PARAM,// valid_from ?: string, 
          valid_to, // valid_to ?: string, 
          // NULL_PARAM,// tdei_dataset_id ?: string, 
          // NULL_PARAM,// bbox ?: Array<number>, 
          // NULL_PARAM,// page_no ?: number, 
          // NULL_PARAM,// page_size?: number | undefined, 
          // options?: AxiosRequestConfig<...> | undefined
        );

        expect(datasetFiles.status).toBe(200);
        datasetFiles.data.forEach(file => {
          expect(new Date(file.valid_from)).toBeAfter(new Date(valid_to))
        })
      });
    });

    describe('Validation', () => {
      it('When passed with valid token and invalid recordId, should return status 200 with 0 record', async () => {
        let oswAPI = new GeneralApi(configuration);
        let recordId = 'dummyRecordId';

        const datasetFiles = await oswAPI.listDatasetFiles(
          NULL_PARAM,//data_type ?: string, 
          "All", //status ?: string,
          NULL_PARAM, // name ?: string,
          NULL_PARAM, // version ?: string, 
          NULL_PARAM, //data_source ?: string, 
          NULL_PARAM, // collection_method ?: string, 
          NULL_PARAM, //collected_by ?: string, 
          NULL_PARAM, // derived_from_dataset_id ?: string, 
          NULL_PARAM,// collection_date ?: string, 
          NULL_PARAM,// confidence_level ?: number, 
          NULL_PARAM,// schema_version ?: string, 
          NULL_PARAM,// tdei_project_group_id ?: string,
          NULL_PARAM,// valid_from ?: string, 
          NULL_PARAM, // valid_to ?: string, 
          recordId,// tdei_dataset_id ?: string, 
          // NULL_PARAM,// bbox ?: Array<number>, 
          // NULL_PARAM,// page_no ?: number, 
          // NULL_PARAM,// page_size?: number | undefined, 
          // options?: AxiosRequestConfig<...> | undefined
        );

        expect(datasetFiles.status).toBe(200);
        expect(datasetFiles.data.length).toBe(0);

      });

      it('When passed without valid token, should reject with 401 status', async () => {
        let oswAPI = new GeneralApi(Utility.getConfiguration());

        const datasetFiles = oswAPI.listDatasetFiles();

        await expect(datasetFiles).rejects.toMatchObject({ response: { status: 401 } });
      });
    })

  });

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
  });

});

