import { AuthenticationApi, Configuration, DatasetItemProjectGroup, DatasetItem, DatasetItemStatusEnum, GeneralApi, VersionSpec, DatasetItemService, MetadataModelDatasetDetailCollectionMethodEnum, MetadataModelDatasetDetailDataSourceEnum } from "tdei-client";
import { Utility } from "../utils";
import axios, { InternalAxiosRequestConfig } from "axios";


const NULL_PARAM = void 0;

let configuration: Configuration = {};
let apiKeyConfiguration: Configuration = {};

const editMetadataRequestInterceptor = (request: InternalAxiosRequestConfig, tdei_dataset_id: string, datasetName: string) => {
  if (
    request.url === `${configuration.basePath}/api/v1/metadata/${tdei_dataset_id}`
  ) {
    let data = request.data as FormData;
    let metaFile = data.get("file") as File;
    delete data['file'];
    data.set('file', metaFile, datasetName);
  }
  return request;
};

beforeAll(async () => {
  configuration = Utility.getAdminConfiguration();
  apiKeyConfiguration = Utility.getApiKeyConfiguration();
  await Utility.setAuthToken(configuration);
}, 30000);

describe('List Datasets', () => {

  it('API-Key | Authenticated , When request made with no filters, should return list of dataset', async () => {
    let oswAPI = new GeneralApi(apiKeyConfiguration);

    const datasetFiles = await oswAPI.listDatasetFiles();

    expect(datasetFiles.status).toBe(200);

    expect(Array.isArray(datasetFiles.data)).toBe(true);

    datasetFiles.data.forEach(file => {
      expect(file).toMatchObject(<DatasetItem>{
        status: expect.toBeOneOf([DatasetItemStatusEnum.PreRelease.toString(), DatasetItemStatusEnum.Publish.toString()]),
        metadata: {
          data_provenance: {
            full_dataset_name: expect.any(String),
            other_published_locations: expect.toBeOneOf([null, expect.any(String)]),
            dataset_update_frequency_months: expect.toBeOneOf([null, expect.any(Number)]),
            schema_validation_run: expect.toBeOneOf([null, expect.any(Boolean)]),
            schema_validation_run_description: expect.toBeOneOf([null, expect.any(String)]),
            allow_crowd_contributions: expect.toBeOneOf([null, expect.any(Boolean)]),
            location_inaccuracy_factors: expect.toBeOneOf([null, expect.any(String)])
          },
          dataset_detail: {
            version: expect.toBeOneOf([null, expect.any(String)]),
            custom_metadata: expect.toBeOneOf([null, expect.anything()]),
            collected_by: expect.toBeOneOf([null, expect.any(String)]),
            collection_date: expect.toBeOneOf([null, expect.any(String)]),
            valid_from: expect.toBeOneOf([null, expect.any(String)]),
            valid_to: expect.toBeOneOf([null, expect.toBeOneOf([null, expect.any(String)]),]),
            collection_method: expect.toBeOneOf([
              null,
              MetadataModelDatasetDetailCollectionMethodEnum.Generated.toString(),
              MetadataModelDatasetDetailCollectionMethodEnum.Other.toString(),
              MetadataModelDatasetDetailCollectionMethodEnum.Transform.toString(),
              MetadataModelDatasetDetailCollectionMethodEnum.Manual.toString()]),
            data_source: expect.toBeOneOf([
              null,
              MetadataModelDatasetDetailDataSourceEnum.InHouse.toString(),
              MetadataModelDatasetDetailDataSourceEnum.TDEITools.toString(),
              MetadataModelDatasetDetailDataSourceEnum._3rdParty.toString()]),
            dataset_area: expect.toBeOneOf([null, expect.toBeObject()]),
            schema_version: expect.toBeOneOf([null, expect.any(String)]),
          },
          dataset_summary: {
            collection_name: expect.toBeOneOf([null, expect.any(String)]),
            department_name: expect.toBeOneOf([null, expect.any(String)]),
            city: expect.toBeOneOf([null, expect.any(String)]),
            region: expect.toBeOneOf([null, expect.any(String)]),
            county: expect.toBeOneOf([null, expect.any(String)]),
            key_limitations_of_the_dataset: expect.toBeOneOf([null, expect.any(String)]),
            challenges: expect.toBeOneOf([null, expect.any(String)])
          },
          maintenance: {
            official_maintainer: expect.toBeOneOf([null, expect.any(Array)]),
            last_updated: expect.toBeOneOf([null, expect.any(String)]),
            update_frequency: expect.toBeOneOf([null, expect.any(String)]),
            authorization_chain: expect.toBeOneOf([null, expect.any(String)]),
            maintenance_funded: expect.toBeOneOf([null, expect.any(Boolean)]),
            funding_details: expect.toBeOneOf([null, expect.any(String)])
          },
          methodology: {
            point_data_collection_device: expect.toBeOneOf([null, expect.any(String)]),
            node_locations_and_attributes_editing_software: expect.toBeOneOf([null, expect.any(String)]),
            data_collected_by_people: expect.toBeOneOf([null, expect.any(Boolean)]),
            data_collectors: expect.toBeOneOf([null, expect.any(String)]),
            data_captured_automatically: expect.toBeOneOf([null, expect.any(Boolean)]),
            automated_collection: expect.toBeOneOf([null, expect.any(String)]),
            data_collectors_organization: expect.toBeOneOf([null, expect.any(String)]),
            data_collector_compensation: expect.toBeOneOf([null, expect.any(String)]),
            preprocessing_location: expect.toBeOneOf([null, expect.any(String)]),
            preprocessing_by: expect.toBeOneOf([null, expect.any(String)]),
            preprocessing_steps: expect.toBeOneOf([null, expect.any(String)]),
            data_collection_preprocessing_documentation: expect.toBeOneOf([null, expect.any(Boolean)]),
            documentation_uri: expect.toBeOneOf([null, expect.any(String)]),
            validation_process_exists: expect.toBeOneOf([null, expect.any(Boolean)]),
            validation_process_description: expect.toBeOneOf([null, expect.any(String)]),
            validation_conducted_by: expect.toBeOneOf([null, expect.any(String)]),
            excluded_data: expect.toBeOneOf([null, expect.any(String)]),
            excluded_data_reason: expect.toBeOneOf([null, expect.any(String)])
          }
        },
        derived_from_dataset_id: expect.toBeOneOf([null, expect.any(String)]),
        uploaded_timestamp: expect.any(String),
        project_group: expect.objectContaining(<DatasetItemProjectGroup>{
          tdei_project_group_id: expect.any(String),
          name: expect.any(String)
        }),
        service: expect.objectContaining(<DatasetItemService>{
          tdei_service_id: expect.any(String),
          name: expect.any(String)
        }),
        tdei_dataset_id: expect.any(String),
        download_url: expect.any(String)
      });
    });
  });

  it('Admin | Authenticated , When request made with no filters, should return list of dataset', async () => {
    let oswAPI = new GeneralApi(configuration);

    const datasetFiles = await oswAPI.listDatasetFiles();

    expect(datasetFiles.status).toBe(200);

    expect(Array.isArray(datasetFiles.data)).toBe(true);

    datasetFiles.data.forEach(file => {
      expect(file).toMatchObject(<DatasetItem>{
        status: expect.toBeOneOf([DatasetItemStatusEnum.PreRelease.toString(), DatasetItemStatusEnum.Publish.toString()]),
        metadata: {
          data_provenance: {
            full_dataset_name: expect.any(String),
            other_published_locations: expect.toBeOneOf([null, expect.any(String)]),
            dataset_update_frequency_months: expect.toBeOneOf([null, expect.any(Number)]),
            schema_validation_run: expect.toBeOneOf([null, expect.any(Boolean)]),
            schema_validation_run_description: expect.toBeOneOf([null, expect.any(String)]),
            allow_crowd_contributions: expect.toBeOneOf([null, expect.any(Boolean)]),
            location_inaccuracy_factors: expect.toBeOneOf([null, expect.any(String)])
          },
          dataset_detail: {
            version: expect.toBeOneOf([null, expect.any(String)]),
            custom_metadata: expect.toBeOneOf([null, expect.anything()]),
            collected_by: expect.toBeOneOf([null, expect.any(String)]),
            collection_date: expect.toBeOneOf([null, expect.any(String)]),
            valid_from: expect.toBeOneOf([null, expect.any(String)]),
            valid_to: expect.toBeOneOf([null, expect.toBeOneOf([null, expect.any(String)]),]),
            collection_method: expect.toBeOneOf([
              null,
              MetadataModelDatasetDetailCollectionMethodEnum.Generated.toString(),
              MetadataModelDatasetDetailCollectionMethodEnum.Other.toString(),
              MetadataModelDatasetDetailCollectionMethodEnum.Transform.toString(),
              MetadataModelDatasetDetailCollectionMethodEnum.Manual.toString()]),
            data_source: expect.toBeOneOf([
              null,
              MetadataModelDatasetDetailDataSourceEnum.InHouse.toString(),
              MetadataModelDatasetDetailDataSourceEnum.TDEITools.toString(),
              MetadataModelDatasetDetailDataSourceEnum._3rdParty.toString()]),
            dataset_area: expect.toBeOneOf([null, expect.toBeObject()]),
            schema_version: expect.toBeOneOf([null, expect.any(String)]),
          },
          dataset_summary: {
            collection_name: expect.toBeOneOf([null, expect.any(String)]),
            department_name: expect.toBeOneOf([null, expect.any(String)]),
            city: expect.toBeOneOf([null, expect.any(String)]),
            region: expect.toBeOneOf([null, expect.any(String)]),
            county: expect.toBeOneOf([null, expect.any(String)]),
            key_limitations_of_the_dataset: expect.toBeOneOf([null, expect.any(String)]),
            challenges: expect.toBeOneOf([null, expect.any(String)])
          },
          maintenance: {
            official_maintainer: expect.toBeOneOf([null, expect.any(Array)]),
            last_updated: expect.toBeOneOf([null, expect.any(String)]),
            update_frequency: expect.toBeOneOf([null, expect.any(String)]),
            authorization_chain: expect.toBeOneOf([null, expect.any(String)]),
            maintenance_funded: expect.toBeOneOf([null, expect.any(Boolean)]),
            funding_details: expect.toBeOneOf([null, expect.any(String)])
          },
          methodology: {
            point_data_collection_device: expect.toBeOneOf([null, expect.any(String)]),
            node_locations_and_attributes_editing_software: expect.toBeOneOf([null, expect.any(String)]),
            data_collected_by_people: expect.toBeOneOf([null, expect.any(Boolean)]),
            data_collectors: expect.toBeOneOf([null, expect.any(String)]),
            data_captured_automatically: expect.toBeOneOf([null, expect.any(Boolean)]),
            automated_collection: expect.toBeOneOf([null, expect.any(String)]),
            data_collectors_organization: expect.toBeOneOf([null, expect.any(String)]),
            data_collector_compensation: expect.toBeOneOf([null, expect.any(String)]),
            preprocessing_location: expect.toBeOneOf([null, expect.any(String)]),
            preprocessing_by: expect.toBeOneOf([null, expect.any(String)]),
            preprocessing_steps: expect.toBeOneOf([null, expect.any(String)]),
            data_collection_preprocessing_documentation: expect.toBeOneOf([null, expect.any(Boolean)]),
            documentation_uri: expect.toBeOneOf([null, expect.any(String)]),
            validation_process_exists: expect.toBeOneOf([null, expect.any(Boolean)]),
            validation_process_description: expect.toBeOneOf([null, expect.any(String)]),
            validation_conducted_by: expect.toBeOneOf([null, expect.any(String)]),
            excluded_data: expect.toBeOneOf([null, expect.any(String)]),
            excluded_data_reason: expect.toBeOneOf([null, expect.any(String)])
          }
        },
        derived_from_dataset_id: expect.toBeOneOf([null, expect.any(String)]),
        uploaded_timestamp: expect.any(String),
        project_group: expect.objectContaining(<DatasetItemProjectGroup>{
          tdei_project_group_id: expect.any(String),
          name: expect.any(String)
        }),
        service: expect.objectContaining(<DatasetItemService>{
          tdei_service_id: expect.any(String),
          name: expect.any(String)
        }),
        tdei_dataset_id: expect.any(String),
        download_url: expect.any(String)
      });
    });
  });

  it('Admin | Authenticated , When request made with page size, should return datasets less than or equal to page size', async () => {
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

  it('Admin | Authenticated , When request made with project group Id, should return datasets of the specified project group', async () => {
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
      expect(file.project_group.tdei_project_group_id).toBe(project_group_id)
    })

  });

  it('Admin | Authenticated , When request made with tdei_dataset_id, should return dataset of the specified tdei_dataset_id', async () => {
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

  it('Admin | Authenticated , When request made with schema_version, should return datasets matching schema_version', async () => {
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
      expect(file.metadata.dataset_detail!.schema_version).toContain(schema_version)
    });
  });

  it('Admin | Authenticated , When request made with name, should return dataset matching name', async () => {
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
      expect(file.metadata.dataset_detail!.name).toContain(name)
    });
  });

  it('Admin | Authenticated , When request made with collection_method, should return datasets matching collection_method', async () => {
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
      expect(file.metadata.dataset_detail!.collection_method).toBe(collection_method)
    });
  });
  it('Admin | Authenticated , When request made with collected_by, should return datasets matching collected_by', async () => {
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
      expect(file.metadata.dataset_detail!.collected_by).toBe(collected_by)
    });
  });

  it('Admin | Authenticated , When request made with data_source, should return datasets matching data_source', async () => {
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
      expect(file.metadata.dataset_detail!.data_source).toBe(data_source)
    })
  });

  it('Admin | Authenticated , When request made with derived_from_dataset_id, should return datasets matching derived_from_dataset_id', async () => {
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

  it('Admin | Authenticated , When request made with valid_to, should return datasets valid from input datetime', async () => {
    let oswAPI = new GeneralApi(configuration);
    //set date one date before today
    let valid_to = (new Date(new Date().setMonth(new Date().getMonth() - 1))).toISOString();

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
      expect(new Date(file.metadata.dataset_detail!.valid_to!)).toBeAfter(new Date(valid_to))
    })
  });

  it('Admin | Authenticated , When request made with invalid tdei_dataset_id, should return empty dataset', async () => {
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

  it('Admin | un-authenticated , When request made, should respond with unauthenticated request', async () => {
    let oswAPI = new GeneralApi(Utility.getAdminConfiguration());

    const datasetFiles = oswAPI.listDatasetFiles();

    await expect(datasetFiles).rejects.toMatchObject({ response: { status: 401 } });
  });
});

describe("List API versions", () => {

  it('Admin | Authenticated , When request made, expect to return api version list', async () => {
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
  }, 30000);

  it('API-Key | Authenticated , When request made, expect to return api version list', async () => {
    // Arrange
    let generalAPI = new GeneralApi(apiKeyConfiguration);
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

  it('Admin | un-authenticated, When request made, should respond with unauthenticated request', async () => {

    let generalAPI = new GeneralApi(Utility.getAdminConfiguration());

    const version = generalAPI.listApiVersions();

    await expect(version).rejects.toMatchObject({ response: { status: 401 } });


  }, 30000);
});

describe('List Project Groups', () => {

  it('Admin | Authenticated , When request made, expect to return list of project groups', async () => {
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
  }, 30000);

  it('API-Key | Authenticated , When request made, expect to return list of project groups', async () => {
    let generalAPI = new GeneralApi(apiKeyConfiguration);

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
  it('Admin | un-authenticated , When request made, should respond with unauthenticated request', async () => {
    let generalAPI = new GeneralApi(Utility.getAdminConfiguration());

    const projectGroupList = generalAPI.listProjectGroups();

    await expect(projectGroupList).rejects.toMatchObject({ response: { status: 401 } });

  }, 30000)
});

describe("Edit Metadata API", () => {

  it('POC | Authenticated , When request made, expect to return sucess', async () => {
    // Arrange
    let generalAPI = new GeneralApi(configuration);
    let metaToUpload = Utility.getMetadataBlob("flex");
    let tdei_dataset_id = "f2574fe66f0046389acc68ee5848e3a9";
    // Action
    const editMetaInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => editMetadataRequestInterceptor(req, tdei_dataset_id, 'metadata.json'))
    const versions = await generalAPI.editMetadataForm(metaToUpload, tdei_dataset_id);
    // Assert
    expect(versions.status).toBe(200);
    axios.interceptors.request.eject(editMetaInterceptor);
  }, 30000);

  it('Admin | un-authenticated, When request made, should respond with unauthenticated request', async () => {

    let generalAPI = new GeneralApi(Utility.getAdminConfiguration());

    const version = generalAPI.listApiVersions();

    await expect(version).rejects.toMatchObject({ response: { status: 401 } });


  }, 30000);
});


