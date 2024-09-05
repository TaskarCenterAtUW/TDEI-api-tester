import { Configuration, DatasetItemProjectGroup, DatasetItem, DatasetItemStatusEnum, GeneralApi, VersionSpec, DatasetItemService, MetadataModelDatasetDetailCollectionMethodEnum, MetadataModelDatasetDetailDataSourceEnum, JobDetails, JobProgress } from "tdei-client";
import { Utility } from "../utils";
import axios, { InternalAxiosRequestConfig } from "axios";


const NULL_PARAM = void 0;

let adminConfiguration: Configuration = {};
let apiKeyConfiguration: Configuration = {};
let pocConfiguration: Configuration = {};
let flexDgConfiguration: Configuration = {};
let pathwaysDgConfiguration: Configuration = {};
let oswDgConfiguration: Configuration = {};
let tdei_project_group_id: string = "";
let tdei_service_id_osw: string = "";
let tdei_service_id_flex: string = "";
let tdei_service_id_pathways: string = "";

const cloneDatasetRequestInterceptor = (request: InternalAxiosRequestConfig, tdei_dataset_id: string, tdei_project_group_id: string, tdei_service_id: string, datasetName: string) => {
  if (
    request.url === `${adminConfiguration.basePath}/api/v1/dataset/clone/${tdei_dataset_id}/${tdei_project_group_id}/${tdei_service_id}`
  ) {
    let data = request.data as FormData;
    let metaFile = data.get("file") as File;
    delete data['file'];
    data.set('file', metaFile, datasetName);
  }
  return request;
};

beforeAll(async () => {
  adminConfiguration = Utility.getAdminConfiguration();
  apiKeyConfiguration = Utility.getApiKeyConfiguration();
  pocConfiguration = Utility.getPocConfiguration();
  flexDgConfiguration = Utility.getFlexDataGeneratorConfiguration();
  pathwaysDgConfiguration = Utility.getPathwaysDataGeneratorConfiguration();
  oswDgConfiguration = Utility.getOSWDataGeneratorConfiguration();

  await Utility.setAuthToken(adminConfiguration);
  await Utility.setAuthToken(pocConfiguration);
  await Utility.setAuthToken(flexDgConfiguration);
  await Utility.setAuthToken(pathwaysDgConfiguration);
  await Utility.setAuthToken(oswDgConfiguration);

  let seedData = Utility.seedData;
  tdei_project_group_id = seedData.tdei_project_group_id;
  tdei_service_id_osw = seedData.service_id.find(x => x.data_type == "osw")!.serviceId;
  tdei_service_id_flex = seedData.service_id.find(x => x.data_type == "flex")!.serviceId;
  tdei_service_id_pathways = seedData.service_id.find(x => x.data_type == "pathways")!.serviceId;
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
    let oswAPI = new GeneralApi(adminConfiguration);

    const datasetFiles = await oswAPI.listDatasetFiles();

    expect(datasetFiles.status).toBe(200);

    expect(Array.isArray(datasetFiles.data)).toBe(true);

    datasetFiles.data.forEach(file => {
      expect(file).toMatchObject(<DatasetItem>{
        status: expect.toBeOneOf([DatasetItemStatusEnum.PreRelease.toString(), DatasetItemStatusEnum.Publish.toString()]),
        metadata: {
          data_provenance: expect.any(Object),
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
          dataset_summary: expect.any(Object),
          maintenance: expect.any(Object),
          methodology: expect.any(Object)
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
    let oswAPI = new GeneralApi(adminConfiguration);
    let page_size = 5;

    const datasetFiles = await oswAPI.listDatasetFiles(
      NULL_PARAM,// data_type,
      NULL_PARAM,// status,
      NULL_PARAM,// name,
      NULL_PARAM,// version,
      NULL_PARAM,// data_source,
      NULL_PARAM,// collection_method,
      NULL_PARAM,// collected_by,
      NULL_PARAM,// derived_from_dataset_id,
      NULL_PARAM,// collection_date,
      NULL_PARAM,// confidence_level,
      NULL_PARAM,// schema_version,
      NULL_PARAM,// tdei_project_group_id,
      NULL_PARAM,// valid_from,
      NULL_PARAM,// valid_to,
      NULL_PARAM,// tdei_dataset_id,
      NULL_PARAM,// bbox,
      NULL_PARAM,// other_published_locations,
      NULL_PARAM,// dataset_update_frequency_months,
      NULL_PARAM,// schema_validation_run_description,
      NULL_PARAM,// full_dataset_name,
      NULL_PARAM,// collection_name,
      NULL_PARAM,// department_name,
      NULL_PARAM,// city,
      NULL_PARAM,// region,
      NULL_PARAM,// county,
      NULL_PARAM,// key_limitations_of_the_dataset,
      NULL_PARAM,// challenges,
      NULL_PARAM,// official_maintainer,
      NULL_PARAM,// last_updated,
      NULL_PARAM,// update_frequency,
      NULL_PARAM,// authorization_chain,
      NULL_PARAM,// maintenance_funded,
      NULL_PARAM,// funding_details,
      NULL_PARAM,// point_data_collection_device,
      NULL_PARAM,// node_locations_and_attributes_editing_software,
      NULL_PARAM,// data_collected_by_people,
      NULL_PARAM,// data_collectors,
      NULL_PARAM,// data_captured_automatically,
      NULL_PARAM,// automated_collection,
      NULL_PARAM,// data_collectors_organization,
      NULL_PARAM,// data_collector_compensation,
      NULL_PARAM,// preprocessing_location,
      NULL_PARAM,// preprocessing_by,
      NULL_PARAM,// preprocessing_steps,
      NULL_PARAM,// data_collection_preprocessing_documentation,
      NULL_PARAM,// documentation_uri,
      NULL_PARAM,// validation_process_exists,
      NULL_PARAM,// validation_process_description,
      NULL_PARAM,// validation_conducted_by,
      NULL_PARAM,// excluded_data,
      NULL_PARAM,// excluded_data_reason,
      NULL_PARAM,// page_no,
      page_size
      // options ?: AxiosRequestConfig
    );

    expect(datasetFiles.status).toBe(200);
    expect(datasetFiles.data.length).toBeLessThanOrEqual(page_size);


  });

  it('Admin | Authenticated , When request made with project group Id, should return datasets of the specified project group', async () => {
    let oswAPI = new GeneralApi(adminConfiguration);
    //TODO: read from seeder or config
    let project_group_id = '5e339544-3b12-40a5-8acd-78c66d1fa981';
    const datasetFiles = await oswAPI.listDatasetFiles(
      NULL_PARAM,// data_type,
      "All",// status,
      NULL_PARAM,// name,
      NULL_PARAM,// version,
      NULL_PARAM,// data_source,
      NULL_PARAM,// collection_method,
      NULL_PARAM,// collected_by,
      NULL_PARAM,// derived_from_dataset_id,
      NULL_PARAM,// collection_date,
      NULL_PARAM,// confidence_level,
      NULL_PARAM,// schema_version,
      project_group_id,// tdei_project_group_id,
      NULL_PARAM,// valid_from,
      NULL_PARAM,// valid_to,
      NULL_PARAM,// tdei_dataset_id,
      NULL_PARAM,// bbox,
      NULL_PARAM,// other_published_locations,
      NULL_PARAM,// dataset_update_frequency_months,
      NULL_PARAM,// schema_validation_run_description,
      NULL_PARAM,// full_dataset_name,
      NULL_PARAM,// collection_name,
      NULL_PARAM,// department_name,
      NULL_PARAM,// city,
      NULL_PARAM,// region,
      NULL_PARAM,// county,
      NULL_PARAM,// key_limitations_of_the_dataset,
      NULL_PARAM,// challenges,
      NULL_PARAM,// official_maintainer,
      NULL_PARAM,// last_updated,
      NULL_PARAM,// update_frequency,
      NULL_PARAM,// authorization_chain,
      NULL_PARAM,// maintenance_funded,
      NULL_PARAM,// funding_details,
      NULL_PARAM,// point_data_collection_device,
      NULL_PARAM,// node_locations_and_attributes_editing_software,
      NULL_PARAM,// data_collected_by_people,
      NULL_PARAM,// data_collectors,
      NULL_PARAM,// data_captured_automatically,
      NULL_PARAM,// automated_collection,
      NULL_PARAM,// data_collectors_organization,
      NULL_PARAM,// data_collector_compensation,
      NULL_PARAM,// preprocessing_location,
      NULL_PARAM,// preprocessing_by,
      NULL_PARAM,// preprocessing_steps,
      NULL_PARAM,// data_collection_preprocessing_documentation,
      NULL_PARAM,// documentation_uri,
      NULL_PARAM,// validation_process_exists,
      NULL_PARAM,// validation_process_description,
      NULL_PARAM,// validation_conducted_by,
      NULL_PARAM,// excluded_data,
      NULL_PARAM,// excluded_data_reason,
      NULL_PARAM,// page_no,
      NULL_PARAM,// page_size,
      // options ?: AxiosRequestConfig
    );

    expect(datasetFiles.status).toBe(200);
    datasetFiles.data.forEach(file => {
      expect(file.project_group.tdei_project_group_id).toBe(project_group_id)
    })

  });

  it('Admin | Authenticated , When request made with tdei_dataset_id, should return dataset of the specified tdei_dataset_id', async () => {
    let oswAPI = new GeneralApi(adminConfiguration);
    let recordId = "80f97d3b-4d33-4a84-b4f0-fbade7f7de5b";

    const datasetFiles = await oswAPI.listDatasetFiles(
      NULL_PARAM,// data_type,
      "All",// status,
      NULL_PARAM,// name,
      NULL_PARAM,// version,
      NULL_PARAM,// data_source,
      NULL_PARAM,// collection_method,
      NULL_PARAM,// collected_by,
      NULL_PARAM,// derived_from_dataset_id,
      NULL_PARAM,// collection_date,
      NULL_PARAM,// confidence_level,
      NULL_PARAM,// schema_version,
      NULL_PARAM,// tdei_project_group_id,
      NULL_PARAM,// valid_from,
      NULL_PARAM,// valid_to,
      recordId,// tdei_dataset_id,
      NULL_PARAM,// bbox,
      NULL_PARAM,// other_published_locations,
      NULL_PARAM,// dataset_update_frequency_months,
      NULL_PARAM,// schema_validation_run_description,
      NULL_PARAM,// full_dataset_name,
      NULL_PARAM,// collection_name,
      NULL_PARAM,// department_name,
      NULL_PARAM,// city,
      NULL_PARAM,// region,
      NULL_PARAM,// county,
      NULL_PARAM,// key_limitations_of_the_dataset,
      NULL_PARAM,// challenges,
      NULL_PARAM,// official_maintainer,
      NULL_PARAM,// last_updated,
      NULL_PARAM,// update_frequency,
      NULL_PARAM,// authorization_chain,
      NULL_PARAM,// maintenance_funded,
      NULL_PARAM,// funding_details,
      NULL_PARAM,// point_data_collection_device,
      NULL_PARAM,// node_locations_and_attributes_editing_software,
      NULL_PARAM,// data_collected_by_people,
      NULL_PARAM,// data_collectors,
      NULL_PARAM,// data_captured_automatically,
      NULL_PARAM,// automated_collection,
      NULL_PARAM,// data_collectors_organization,
      NULL_PARAM,// data_collector_compensation,
      NULL_PARAM,// preprocessing_location,
      NULL_PARAM,// preprocessing_by,
      NULL_PARAM,// preprocessing_steps,
      NULL_PARAM,// data_collection_preprocessing_documentation,
      NULL_PARAM,// documentation_uri,
      NULL_PARAM,// validation_process_exists,
      NULL_PARAM,// validation_process_description,
      NULL_PARAM,// validation_conducted_by,
      NULL_PARAM,// excluded_data,
      NULL_PARAM,// excluded_data_reason,
      NULL_PARAM,// page_no,
      NULL_PARAM,//page_size
      // options ?: AxiosRequestConfig
    );

    expect(datasetFiles.status).toBe(200);
    expect(datasetFiles.data.length).toBe(1);
    datasetFiles.data.forEach(file => {
      expect(file.tdei_dataset_id).toBe(recordId)
    });
  });

  it('Admin | Authenticated , When request made with schema_version, should return datasets matching schema_version', async () => {
    let oswAPI = new GeneralApi(adminConfiguration);
    let schema_version = "v0.1";

    const datasetFiles = await oswAPI.listDatasetFiles(
      NULL_PARAM,// data_type,
      "All",// status,
      NULL_PARAM,// name,
      NULL_PARAM,// version,
      NULL_PARAM,// data_source,
      NULL_PARAM,// collection_method,
      NULL_PARAM,// collected_by,
      NULL_PARAM,// derived_from_dataset_id,
      NULL_PARAM,// collection_date,
      NULL_PARAM,// confidence_level,
      schema_version,// schema_version,
      NULL_PARAM,// tdei_project_group_id,
      NULL_PARAM,// valid_from,
      NULL_PARAM,// valid_to,
      NULL_PARAM,// tdei_dataset_id,
      NULL_PARAM,// bbox,
      NULL_PARAM,// other_published_locations,
      NULL_PARAM,// dataset_update_frequency_months,
      NULL_PARAM,// schema_validation_run_description,
      NULL_PARAM,// full_dataset_name,
      NULL_PARAM,// collection_name,
      NULL_PARAM,// department_name,
      NULL_PARAM,// city,
      NULL_PARAM,// region,
      NULL_PARAM,// county,
      NULL_PARAM,// key_limitations_of_the_dataset,
      NULL_PARAM,// challenges,
      NULL_PARAM,// official_maintainer,
      NULL_PARAM,// last_updated,
      NULL_PARAM,// update_frequency,
      NULL_PARAM,// authorization_chain,
      NULL_PARAM,// maintenance_funded,
      NULL_PARAM,// funding_details,
      NULL_PARAM,// point_data_collection_device,
      NULL_PARAM,// node_locations_and_attributes_editing_software,
      NULL_PARAM,// data_collected_by_people,
      NULL_PARAM,// data_collectors,
      NULL_PARAM,// data_captured_automatically,
      NULL_PARAM,// automated_collection,
      NULL_PARAM,// data_collectors_organization,
      NULL_PARAM,// data_collector_compensation,
      NULL_PARAM,// preprocessing_location,
      NULL_PARAM,// preprocessing_by,
      NULL_PARAM,// preprocessing_steps,
      NULL_PARAM,// data_collection_preprocessing_documentation,
      NULL_PARAM,// documentation_uri,
      NULL_PARAM,// validation_process_exists,
      NULL_PARAM,// validation_process_description,
      NULL_PARAM,// validation_conducted_by,
      NULL_PARAM,// excluded_data,
      NULL_PARAM,// excluded_data_reason,
      NULL_PARAM,// page_no,
      NULL_PARAM,//page_size
      // options ?: AxiosRequestConfig
    );

    expect(datasetFiles.status).toBe(200);
    datasetFiles.data.forEach(file => {
      expect(file.metadata.dataset_detail!.schema_version).toContain(schema_version)
    });
  });

  it('Admin | Authenticated , When request made with name, should return dataset matching name', async () => {
    let oswAPI = new GeneralApi(adminConfiguration);
    let name = "manual";

    const datasetFiles = await oswAPI.listDatasetFiles(
      NULL_PARAM,// data_type,
      "All",// status,
      name,// name,
      NULL_PARAM,// version,
      NULL_PARAM,// data_source,
      NULL_PARAM,// collection_method,
      NULL_PARAM,// collected_by,
      NULL_PARAM,// derived_from_dataset_id,
      NULL_PARAM,// collection_date,
      NULL_PARAM,// confidence_level,
      NULL_PARAM,// schema_version,
      NULL_PARAM,// tdei_project_group_id,
      NULL_PARAM,// valid_from,
      NULL_PARAM,// valid_to,
      NULL_PARAM,// tdei_dataset_id,
      NULL_PARAM,// bbox,
      NULL_PARAM,// other_published_locations,
      NULL_PARAM,// dataset_update_frequency_months,
      NULL_PARAM,// schema_validation_run_description,
      NULL_PARAM,// full_dataset_name,
      NULL_PARAM,// collection_name,
      NULL_PARAM,// department_name,
      NULL_PARAM,// city,
      NULL_PARAM,// region,
      NULL_PARAM,// county,
      NULL_PARAM,// key_limitations_of_the_dataset,
      NULL_PARAM,// challenges,
      NULL_PARAM,// official_maintainer,
      NULL_PARAM,// last_updated,
      NULL_PARAM,// update_frequency,
      NULL_PARAM,// authorization_chain,
      NULL_PARAM,// maintenance_funded,
      NULL_PARAM,// funding_details,
      NULL_PARAM,// point_data_collection_device,
      NULL_PARAM,// node_locations_and_attributes_editing_software,
      NULL_PARAM,// data_collected_by_people,
      NULL_PARAM,// data_collectors,
      NULL_PARAM,// data_captured_automatically,
      NULL_PARAM,// automated_collection,
      NULL_PARAM,// data_collectors_organization,
      NULL_PARAM,// data_collector_compensation,
      NULL_PARAM,// preprocessing_location,
      NULL_PARAM,// preprocessing_by,
      NULL_PARAM,// preprocessing_steps,
      NULL_PARAM,// data_collection_preprocessing_documentation,
      NULL_PARAM,// documentation_uri,
      NULL_PARAM,// validation_process_exists,
      NULL_PARAM,// validation_process_description,
      NULL_PARAM,// validation_conducted_by,
      NULL_PARAM,// excluded_data,
      NULL_PARAM,// excluded_data_reason,
      NULL_PARAM,// page_no,
      NULL_PARAM,//page_size
      // options ?: AxiosRequestConfig
    );

    expect(datasetFiles.status).toBe(200);
    datasetFiles.data.forEach(file => {
      expect(file.metadata.dataset_detail!.name).toContain(name)
    });
  });

  it('Admin | Authenticated , When request made with collection_method, should return datasets matching collection_method', async () => {
    let oswAPI = new GeneralApi(adminConfiguration);
    let collection_method = "manual";

    const datasetFiles = await oswAPI.listDatasetFiles(
      NULL_PARAM,// data_type,
      "All",// status,
      NULL_PARAM,// name,
      NULL_PARAM,// version,
      NULL_PARAM,// data_source,
      collection_method,// collection_method,
      NULL_PARAM,// collected_by,
      NULL_PARAM,// derived_from_dataset_id,
      NULL_PARAM,// collection_date,
      NULL_PARAM,// confidence_level,
      NULL_PARAM,// schema_version,
      NULL_PARAM,// tdei_project_group_id,
      NULL_PARAM,// valid_from,
      NULL_PARAM,// valid_to,
      NULL_PARAM,// tdei_dataset_id,
      NULL_PARAM,// bbox,
      NULL_PARAM,// other_published_locations,
      NULL_PARAM,// dataset_update_frequency_months,
      NULL_PARAM,// schema_validation_run_description,
      NULL_PARAM,// full_dataset_name,
      NULL_PARAM,// collection_name,
      NULL_PARAM,// department_name,
      NULL_PARAM,// city,
      NULL_PARAM,// region,
      NULL_PARAM,// county,
      NULL_PARAM,// key_limitations_of_the_dataset,
      NULL_PARAM,// challenges,
      NULL_PARAM,// official_maintainer,
      NULL_PARAM,// last_updated,
      NULL_PARAM,// update_frequency,
      NULL_PARAM,// authorization_chain,
      NULL_PARAM,// maintenance_funded,
      NULL_PARAM,// funding_details,
      NULL_PARAM,// point_data_collection_device,
      NULL_PARAM,// node_locations_and_attributes_editing_software,
      NULL_PARAM,// data_collected_by_people,
      NULL_PARAM,// data_collectors,
      NULL_PARAM,// data_captured_automatically,
      NULL_PARAM,// automated_collection,
      NULL_PARAM,// data_collectors_organization,
      NULL_PARAM,// data_collector_compensation,
      NULL_PARAM,// preprocessing_location,
      NULL_PARAM,// preprocessing_by,
      NULL_PARAM,// preprocessing_steps,
      NULL_PARAM,// data_collection_preprocessing_documentation,
      NULL_PARAM,// documentation_uri,
      NULL_PARAM,// validation_process_exists,
      NULL_PARAM,// validation_process_description,
      NULL_PARAM,// validation_conducted_by,
      NULL_PARAM,// excluded_data,
      NULL_PARAM,// excluded_data_reason,
      NULL_PARAM,// page_no,
      NULL_PARAM,//page_size
      // options ?: AxiosRequestConfig
    );

    expect(datasetFiles.status).toBe(200);
    datasetFiles.data.forEach(file => {
      expect(file.metadata.dataset_detail!.collection_method).toBe(collection_method)
    });
  });
  it('Admin | Authenticated , When request made with collected_by, should return datasets matching collected_by', async () => {
    let oswAPI = new GeneralApi(adminConfiguration);
    let collected_by = "John Doe";

    const datasetFiles = await oswAPI.listDatasetFiles(
      NULL_PARAM,// data_type,
      "All",// status,
      NULL_PARAM,// name,
      NULL_PARAM,// version,
      NULL_PARAM,// data_source,
      NULL_PARAM,// collection_method,
      collected_by,// collected_by,
      NULL_PARAM,// derived_from_dataset_id,
      NULL_PARAM,// collection_date,
      NULL_PARAM,// confidence_level,
      NULL_PARAM,// schema_version,
      NULL_PARAM,// tdei_project_group_id,
      NULL_PARAM,// valid_from,
      NULL_PARAM,// valid_to,
      NULL_PARAM,// tdei_dataset_id,
      NULL_PARAM,// bbox,
      NULL_PARAM,// other_published_locations,
      NULL_PARAM,// dataset_update_frequency_months,
      NULL_PARAM,// schema_validation_run_description,
      NULL_PARAM,// full_dataset_name,
      NULL_PARAM,// collection_name,
      NULL_PARAM,// department_name,
      NULL_PARAM,// city,
      NULL_PARAM,// region,
      NULL_PARAM,// county,
      NULL_PARAM,// key_limitations_of_the_dataset,
      NULL_PARAM,// challenges,
      NULL_PARAM,// official_maintainer,
      NULL_PARAM,// last_updated,
      NULL_PARAM,// update_frequency,
      NULL_PARAM,// authorization_chain,
      NULL_PARAM,// maintenance_funded,
      NULL_PARAM,// funding_details,
      NULL_PARAM,// point_data_collection_device,
      NULL_PARAM,// node_locations_and_attributes_editing_software,
      NULL_PARAM,// data_collected_by_people,
      NULL_PARAM,// data_collectors,
      NULL_PARAM,// data_captured_automatically,
      NULL_PARAM,// automated_collection,
      NULL_PARAM,// data_collectors_organization,
      NULL_PARAM,// data_collector_compensation,
      NULL_PARAM,// preprocessing_location,
      NULL_PARAM,// preprocessing_by,
      NULL_PARAM,// preprocessing_steps,
      NULL_PARAM,// data_collection_preprocessing_documentation,
      NULL_PARAM,// documentation_uri,
      NULL_PARAM,// validation_process_exists,
      NULL_PARAM,// validation_process_description,
      NULL_PARAM,// validation_conducted_by,
      NULL_PARAM,// excluded_data,
      NULL_PARAM,// excluded_data_reason,
      NULL_PARAM,// page_no,
      NULL_PARAM,//page_size
      // options ?: AxiosRequestConfig
    );

    expect(datasetFiles.status).toBe(200);
    datasetFiles.data.forEach(file => {
      expect(file.metadata.dataset_detail!.collected_by).toBe(collected_by)
    });
  });

  it('Admin | Authenticated , When request made with data_source, should return datasets matching data_source', async () => {
    let oswAPI = new GeneralApi(adminConfiguration);
    let data_source = "3rdParty";

    const datasetFiles = await oswAPI.listDatasetFiles(
      NULL_PARAM,// data_type,
      "All",// status,
      NULL_PARAM,// name,
      NULL_PARAM,// version,
      data_source,// data_source,
      NULL_PARAM,// collection_method,
      NULL_PARAM,// collected_by,
      NULL_PARAM,// derived_from_dataset_id,
      NULL_PARAM,// collection_date,
      NULL_PARAM,// confidence_level,
      NULL_PARAM,// schema_version,
      NULL_PARAM,// tdei_project_group_id,
      NULL_PARAM,// valid_from,
      NULL_PARAM,// valid_to,
      NULL_PARAM,// tdei_dataset_id,
      NULL_PARAM,// bbox,
      NULL_PARAM,// other_published_locations,
      NULL_PARAM,// dataset_update_frequency_months,
      NULL_PARAM,// schema_validation_run_description,
      NULL_PARAM,// full_dataset_name,
      NULL_PARAM,// collection_name,
      NULL_PARAM,// department_name,
      NULL_PARAM,// city,
      NULL_PARAM,// region,
      NULL_PARAM,// county,
      NULL_PARAM,// key_limitations_of_the_dataset,
      NULL_PARAM,// challenges,
      NULL_PARAM,// official_maintainer,
      NULL_PARAM,// last_updated,
      NULL_PARAM,// update_frequency,
      NULL_PARAM,// authorization_chain,
      NULL_PARAM,// maintenance_funded,
      NULL_PARAM,// funding_details,
      NULL_PARAM,// point_data_collection_device,
      NULL_PARAM,// node_locations_and_attributes_editing_software,
      NULL_PARAM,// data_collected_by_people,
      NULL_PARAM,// data_collectors,
      NULL_PARAM,// data_captured_automatically,
      NULL_PARAM,// automated_collection,
      NULL_PARAM,// data_collectors_organization,
      NULL_PARAM,// data_collector_compensation,
      NULL_PARAM,// preprocessing_location,
      NULL_PARAM,// preprocessing_by,
      NULL_PARAM,// preprocessing_steps,
      NULL_PARAM,// data_collection_preprocessing_documentation,
      NULL_PARAM,// documentation_uri,
      NULL_PARAM,// validation_process_exists,
      NULL_PARAM,// validation_process_description,
      NULL_PARAM,// validation_conducted_by,
      NULL_PARAM,// excluded_data,
      NULL_PARAM,// excluded_data_reason,
      NULL_PARAM,// page_no,
      NULL_PARAM,//page_size
      // options ?: AxiosRequestConfig
    );

    expect(datasetFiles.status).toBe(200);
    datasetFiles.data.forEach(file => {
      expect(file.metadata.dataset_detail!.data_source).toBe(data_source)
    })
  });

  it('Admin | Authenticated , When request made with data_type OSW, should return datasets matching data_type', async () => {
    let oswAPI = new GeneralApi(adminConfiguration);
    let data_type = "osw";

    const datasetFiles = await oswAPI.listDatasetFiles(
      data_type,// data_type,
      "All",// status,
      NULL_PARAM,// name,
      NULL_PARAM,// version,
      NULL_PARAM,// data_source,
      NULL_PARAM,// collection_method,
      NULL_PARAM,// collected_by,
      NULL_PARAM,// derived_from_dataset_id,
      NULL_PARAM,// collection_date,
      NULL_PARAM,// confidence_level,
      NULL_PARAM,// schema_version,
      NULL_PARAM,// tdei_project_group_id,
      NULL_PARAM,// valid_from,
      NULL_PARAM,// valid_to,
      NULL_PARAM,// tdei_dataset_id,
      NULL_PARAM,// bbox,
      NULL_PARAM,// other_published_locations,
      NULL_PARAM,// dataset_update_frequency_months,
      NULL_PARAM,// schema_validation_run_description,
      NULL_PARAM,// full_dataset_name,
      NULL_PARAM,// collection_name,
      NULL_PARAM,// department_name,
      NULL_PARAM,// city,
      NULL_PARAM,// region,
      NULL_PARAM,// county,
      NULL_PARAM,// key_limitations_of_the_dataset,
      NULL_PARAM,// challenges,
      NULL_PARAM,// official_maintainer,
      NULL_PARAM,// last_updated,
      NULL_PARAM,// update_frequency,
      NULL_PARAM,// authorization_chain,
      NULL_PARAM,// maintenance_funded,
      NULL_PARAM,// funding_details,
      NULL_PARAM,// point_data_collection_device,
      NULL_PARAM,// node_locations_and_attributes_editing_software,
      NULL_PARAM,// data_collected_by_people,
      NULL_PARAM,// data_collectors,
      NULL_PARAM,// data_captured_automatically,
      NULL_PARAM,// automated_collection,
      NULL_PARAM,// data_collectors_organization,
      NULL_PARAM,// data_collector_compensation,
      NULL_PARAM,// preprocessing_location,
      NULL_PARAM,// preprocessing_by,
      NULL_PARAM,// preprocessing_steps,
      NULL_PARAM,// data_collection_preprocessing_documentation,
      NULL_PARAM,// documentation_uri,
      NULL_PARAM,// validation_process_exists,
      NULL_PARAM,// validation_process_description,
      NULL_PARAM,// validation_conducted_by,
      NULL_PARAM,// excluded_data,
      NULL_PARAM,// excluded_data_reason,
      NULL_PARAM,// page_no,
      NULL_PARAM,//page_size
      // options ?: AxiosRequestConfig
    );

    expect(datasetFiles.status).toBe(200);
    datasetFiles.data.forEach((file: any) => {
      expect(file.data_type).toBe(data_type)
    })
  });

  it('Admin | Authenticated , When request made with data_type Flex, should return datasets matching data_type', async () => {
    let oswAPI = new GeneralApi(adminConfiguration);
    let data_type = "flex";

    const datasetFiles = await oswAPI.listDatasetFiles(
      data_type,// data_type,
      "All",// status,
      NULL_PARAM,// name,
      NULL_PARAM,// version,
      NULL_PARAM,// data_source,
      NULL_PARAM,// collection_method,
      NULL_PARAM,// collected_by,
      NULL_PARAM,// derived_from_dataset_id,
      NULL_PARAM,// collection_date,
      NULL_PARAM,// confidence_level,
      NULL_PARAM,// schema_version,
      NULL_PARAM,// tdei_project_group_id,
      NULL_PARAM,// valid_from,
      NULL_PARAM,// valid_to,
      NULL_PARAM,// tdei_dataset_id,
      NULL_PARAM,// bbox,
      NULL_PARAM,// other_published_locations,
      NULL_PARAM,// dataset_update_frequency_months,
      NULL_PARAM,// schema_validation_run_description,
      NULL_PARAM,// full_dataset_name,
      NULL_PARAM,// collection_name,
      NULL_PARAM,// department_name,
      NULL_PARAM,// city,
      NULL_PARAM,// region,
      NULL_PARAM,// county,
      NULL_PARAM,// key_limitations_of_the_dataset,
      NULL_PARAM,// challenges,
      NULL_PARAM,// official_maintainer,
      NULL_PARAM,// last_updated,
      NULL_PARAM,// update_frequency,
      NULL_PARAM,// authorization_chain,
      NULL_PARAM,// maintenance_funded,
      NULL_PARAM,// funding_details,
      NULL_PARAM,// point_data_collection_device,
      NULL_PARAM,// node_locations_and_attributes_editing_software,
      NULL_PARAM,// data_collected_by_people,
      NULL_PARAM,// data_collectors,
      NULL_PARAM,// data_captured_automatically,
      NULL_PARAM,// automated_collection,
      NULL_PARAM,// data_collectors_organization,
      NULL_PARAM,// data_collector_compensation,
      NULL_PARAM,// preprocessing_location,
      NULL_PARAM,// preprocessing_by,
      NULL_PARAM,// preprocessing_steps,
      NULL_PARAM,// data_collection_preprocessing_documentation,
      NULL_PARAM,// documentation_uri,
      NULL_PARAM,// validation_process_exists,
      NULL_PARAM,// validation_process_description,
      NULL_PARAM,// validation_conducted_by,
      NULL_PARAM,// excluded_data,
      NULL_PARAM,// excluded_data_reason,
      NULL_PARAM,// page_no,
      NULL_PARAM,//page_size
      // options ?: AxiosRequestConfig
    );

    expect(datasetFiles.status).toBe(200);
    datasetFiles.data.forEach((file: any) => {
      expect(file.data_type).toBe(data_type)
    })
  });

  it('Admin | Authenticated , When request made with data_type Pathways, should return datasets matching data_type', async () => {
    let oswAPI = new GeneralApi(adminConfiguration);
    let data_type = "pathways";

    const datasetFiles = await oswAPI.listDatasetFiles(
      data_type,// data_type,
      "All",// status,
      NULL_PARAM,// name,
      NULL_PARAM,// version,
      NULL_PARAM,// data_source,
      NULL_PARAM,// collection_method,
      NULL_PARAM,// collected_by,
      NULL_PARAM,// derived_from_dataset_id,
      NULL_PARAM,// collection_date,
      NULL_PARAM,// confidence_level,
      NULL_PARAM,// schema_version,
      NULL_PARAM,// tdei_project_group_id,
      NULL_PARAM,// valid_from,
      NULL_PARAM,// valid_to,
      NULL_PARAM,// tdei_dataset_id,
      NULL_PARAM,// bbox,
      NULL_PARAM,// other_published_locations,
      NULL_PARAM,// dataset_update_frequency_months,
      NULL_PARAM,// schema_validation_run_description,
      NULL_PARAM,// full_dataset_name,
      NULL_PARAM,// collection_name,
      NULL_PARAM,// department_name,
      NULL_PARAM,// city,
      NULL_PARAM,// region,
      NULL_PARAM,// county,
      NULL_PARAM,// key_limitations_of_the_dataset,
      NULL_PARAM,// challenges,
      NULL_PARAM,// official_maintainer,
      NULL_PARAM,// last_updated,
      NULL_PARAM,// update_frequency,
      NULL_PARAM,// authorization_chain,
      NULL_PARAM,// maintenance_funded,
      NULL_PARAM,// funding_details,
      NULL_PARAM,// point_data_collection_device,
      NULL_PARAM,// node_locations_and_attributes_editing_software,
      NULL_PARAM,// data_collected_by_people,
      NULL_PARAM,// data_collectors,
      NULL_PARAM,// data_captured_automatically,
      NULL_PARAM,// automated_collection,
      NULL_PARAM,// data_collectors_organization,
      NULL_PARAM,// data_collector_compensation,
      NULL_PARAM,// preprocessing_location,
      NULL_PARAM,// preprocessing_by,
      NULL_PARAM,// preprocessing_steps,
      NULL_PARAM,// data_collection_preprocessing_documentation,
      NULL_PARAM,// documentation_uri,
      NULL_PARAM,// validation_process_exists,
      NULL_PARAM,// validation_process_description,
      NULL_PARAM,// validation_conducted_by,
      NULL_PARAM,// excluded_data,
      NULL_PARAM,// excluded_data_reason,
      NULL_PARAM,// page_no,
      NULL_PARAM,//page_size
      // options ?: AxiosRequestConfig
    );

    expect(datasetFiles.status).toBe(200);
    datasetFiles.data.forEach((file: any) => {
      expect(file.data_type).toBe(data_type)
    })
  });

  it('Admin | Authenticated , When request made with derived_from_dataset_id, should return datasets matching derived_from_dataset_id', async () => {
    let oswAPI = new GeneralApi(adminConfiguration);
    let derived_from_dataset_id = "a042a1b3aa874701929cb33a98f28e9d";

    const datasetFiles = await oswAPI.listDatasetFiles(
      NULL_PARAM,// data_type,
      "All",// status,
      NULL_PARAM,// name,
      NULL_PARAM,// version,
      NULL_PARAM,// data_source,
      NULL_PARAM,// collection_method,
      NULL_PARAM,// collected_by,
      derived_from_dataset_id,// derived_from_dataset_id,
      NULL_PARAM,// collection_date,
      NULL_PARAM,// confidence_level,
      NULL_PARAM,// schema_version,
      NULL_PARAM,// tdei_project_group_id,
      NULL_PARAM,// valid_from,
      NULL_PARAM,// valid_to,
      NULL_PARAM,// tdei_dataset_id,
      NULL_PARAM,// bbox,
      NULL_PARAM,// other_published_locations,
      NULL_PARAM,// dataset_update_frequency_months,
      NULL_PARAM,// schema_validation_run_description,
      NULL_PARAM,// full_dataset_name,
      NULL_PARAM,// collection_name,
      NULL_PARAM,// department_name,
      NULL_PARAM,// city,
      NULL_PARAM,// region,
      NULL_PARAM,// county,
      NULL_PARAM,// key_limitations_of_the_dataset,
      NULL_PARAM,// challenges,
      NULL_PARAM,// official_maintainer,
      NULL_PARAM,// last_updated,
      NULL_PARAM,// update_frequency,
      NULL_PARAM,// authorization_chain,
      NULL_PARAM,// maintenance_funded,
      NULL_PARAM,// funding_details,
      NULL_PARAM,// point_data_collection_device,
      NULL_PARAM,// node_locations_and_attributes_editing_software,
      NULL_PARAM,// data_collected_by_people,
      NULL_PARAM,// data_collectors,
      NULL_PARAM,// data_captured_automatically,
      NULL_PARAM,// automated_collection,
      NULL_PARAM,// data_collectors_organization,
      NULL_PARAM,// data_collector_compensation,
      NULL_PARAM,// preprocessing_location,
      NULL_PARAM,// preprocessing_by,
      NULL_PARAM,// preprocessing_steps,
      NULL_PARAM,// data_collection_preprocessing_documentation,
      NULL_PARAM,// documentation_uri,
      NULL_PARAM,// validation_process_exists,
      NULL_PARAM,// validation_process_description,
      NULL_PARAM,// validation_conducted_by,
      NULL_PARAM,// excluded_data,
      NULL_PARAM,// excluded_data_reason,
      NULL_PARAM,// page_no,
      NULL_PARAM,//page_size
      // options ?: AxiosRequestConfig
    );

    expect(datasetFiles.status).toBe(200);
    datasetFiles.data.forEach(file => {
      expect(file.derived_from_dataset_id).toBe(derived_from_dataset_id)
    })
  });

  it('Admin | Authenticated , When request made with valid_to, should return datasets valid from input datetime', async () => {
    let oswAPI = new GeneralApi(adminConfiguration);
    //set date one date before today
    let valid_to = (new Date(new Date().setMonth(new Date().getMonth() - 1))).toISOString();

    const datasetFiles = await oswAPI.listDatasetFiles(
      NULL_PARAM,// data_type,
      "All",// status,
      NULL_PARAM,// name,
      NULL_PARAM,// version,
      NULL_PARAM,// data_source,
      NULL_PARAM,// collection_method,
      NULL_PARAM,// collected_by,
      NULL_PARAM,// derived_from_dataset_id,
      NULL_PARAM,// collection_date,
      NULL_PARAM,// confidence_level,
      NULL_PARAM,// schema_version,
      NULL_PARAM,// tdei_project_group_id,
      NULL_PARAM,// valid_from,
      valid_to,// valid_to,
      NULL_PARAM,// tdei_dataset_id,
      NULL_PARAM,// bbox,
      NULL_PARAM,// other_published_locations,
      NULL_PARAM,// dataset_update_frequency_months,
      NULL_PARAM,// schema_validation_run_description,
      NULL_PARAM,// full_dataset_name,
      NULL_PARAM,// collection_name,
      NULL_PARAM,// department_name,
      NULL_PARAM,// city,
      NULL_PARAM,// region,
      NULL_PARAM,// county,
      NULL_PARAM,// key_limitations_of_the_dataset,
      NULL_PARAM,// challenges,
      NULL_PARAM,// official_maintainer,
      NULL_PARAM,// last_updated,
      NULL_PARAM,// update_frequency,
      NULL_PARAM,// authorization_chain,
      NULL_PARAM,// maintenance_funded,
      NULL_PARAM,// funding_details,
      NULL_PARAM,// point_data_collection_device,
      NULL_PARAM,// node_locations_and_attributes_editing_software,
      NULL_PARAM,// data_collected_by_people,
      NULL_PARAM,// data_collectors,
      NULL_PARAM,// data_captured_automatically,
      NULL_PARAM,// automated_collection,
      NULL_PARAM,// data_collectors_organization,
      NULL_PARAM,// data_collector_compensation,
      NULL_PARAM,// preprocessing_location,
      NULL_PARAM,// preprocessing_by,
      NULL_PARAM,// preprocessing_steps,
      NULL_PARAM,// data_collection_preprocessing_documentation,
      NULL_PARAM,// documentation_uri,
      NULL_PARAM,// validation_process_exists,
      NULL_PARAM,// validation_process_description,
      NULL_PARAM,// validation_conducted_by,
      NULL_PARAM,// excluded_data,
      NULL_PARAM,// excluded_data_reason,
      NULL_PARAM,// page_no,
      NULL_PARAM,//page_size
      // options ?: AxiosRequestConfig
    );

    expect(datasetFiles.status).toBe(200);
    datasetFiles.data.forEach(file => {
      expect(new Date(file.metadata.dataset_detail!.valid_to!)).toBeAfter(new Date(valid_to))
    })
  });

  it('Admin | Authenticated , When request made with invalid tdei_dataset_id, should return empty dataset', async () => {
    let oswAPI = new GeneralApi(adminConfiguration);
    let recordId = 'dummyRecordId';

    const datasetFiles = await oswAPI.listDatasetFiles(
      NULL_PARAM,// data_type,
      "All",// status,
      NULL_PARAM,// name,
      NULL_PARAM,// version,
      NULL_PARAM,// data_source,
      NULL_PARAM,// collection_method,
      NULL_PARAM,// collected_by,
      NULL_PARAM,// derived_from_dataset_id,
      NULL_PARAM,// collection_date,
      NULL_PARAM,// confidence_level,
      NULL_PARAM,// schema_version,
      NULL_PARAM,// tdei_project_group_id,
      NULL_PARAM,// valid_from,
      NULL_PARAM,// valid_to,
      recordId,// tdei_dataset_id,
      NULL_PARAM,// bbox,
      NULL_PARAM,// other_published_locations,
      NULL_PARAM,// dataset_update_frequency_months,
      NULL_PARAM,// schema_validation_run_description,
      NULL_PARAM,// full_dataset_name,
      NULL_PARAM,// collection_name,
      NULL_PARAM,// department_name,
      NULL_PARAM,// city,
      NULL_PARAM,// region,
      NULL_PARAM,// county,
      NULL_PARAM,// key_limitations_of_the_dataset,
      NULL_PARAM,// challenges,
      NULL_PARAM,// official_maintainer,
      NULL_PARAM,// last_updated,
      NULL_PARAM,// update_frequency,
      NULL_PARAM,// authorization_chain,
      NULL_PARAM,// maintenance_funded,
      NULL_PARAM,// funding_details,
      NULL_PARAM,// point_data_collection_device,
      NULL_PARAM,// node_locations_and_attributes_editing_software,
      NULL_PARAM,// data_collected_by_people,
      NULL_PARAM,// data_collectors,
      NULL_PARAM,// data_captured_automatically,
      NULL_PARAM,// automated_collection,
      NULL_PARAM,// data_collectors_organization,
      NULL_PARAM,// data_collector_compensation,
      NULL_PARAM,// preprocessing_location,
      NULL_PARAM,// preprocessing_by,
      NULL_PARAM,// preprocessing_steps,
      NULL_PARAM,// data_collection_preprocessing_documentation,
      NULL_PARAM,// documentation_uri,
      NULL_PARAM,// validation_process_exists,
      NULL_PARAM,// validation_process_description,
      NULL_PARAM,// validation_conducted_by,
      NULL_PARAM,// excluded_data,
      NULL_PARAM,// excluded_data_reason,
      NULL_PARAM,// page_no,
      NULL_PARAM,//page_size
      // options ?: AxiosRequestConfig
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
    let generalAPI = new GeneralApi(adminConfiguration);
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
    let generalAPI = new GeneralApi(adminConfiguration);

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

describe('Clone Dataset', () => {
  //Clone flex dataset
  it('POC | Authenticated , When request made to clone flex dataset, expect to return cloned dataset id', async () => {
    // Arrange
    let generalAPI = new GeneralApi(pocConfiguration);
    let metaToUpload = Utility.getMetadataBlob("flex");
    let tdei_dataset_id = "80f97d3b-4d33-4a84-b4f0-fbade7f7de5b"; //Published flex dataset

    // Action
    const cloneDatasetInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => cloneDatasetRequestInterceptor(req, tdei_dataset_id, tdei_project_group_id, tdei_service_id_flex, 'metadata.json'))
    const versions = await generalAPI.cloneDatasetForm(metaToUpload, tdei_dataset_id, tdei_project_group_id, tdei_service_id_flex);
    // Assert
    expect(versions.status).toBe(200);
    expect(versions.data).toBeString();
    expect(versions.data).not.toBe('');
    axios.interceptors.request.eject(cloneDatasetInterceptor);
  }, 30000);

  it('Admin | Authenticated , When request made to clone flex dataset, expect to return cloned dataset id', async () => {
    // Arrange
    let generalAPI = new GeneralApi(adminConfiguration);
    let metaToUpload = Utility.getMetadataBlob("flex");
    let tdei_dataset_id = "80f97d3b-4d33-4a84-b4f0-fbade7f7de5b";//Published flex dataset

    // Action
    const editMetaInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => cloneDatasetRequestInterceptor(req, tdei_dataset_id, tdei_project_group_id, tdei_service_id_flex, 'metadata.json'))
    const versions = await generalAPI.cloneDatasetForm(metaToUpload, tdei_dataset_id, tdei_project_group_id, tdei_service_id_flex);
    // Assert
    expect(versions.status).toBe(200);
    expect(versions.data).toBeString();
    expect(versions.data).not.toBe('');
    axios.interceptors.request.eject(editMetaInterceptor);
  }, 30000);

  it('Flex Data Generator | Authenticated , When request made to clone flex dataset, expect to return cloned dataset id', async () => {
    // Arrange
    let generalAPI = new GeneralApi(flexDgConfiguration);
    let metaToUpload = Utility.getMetadataBlob("flex");
    let tdei_dataset_id = "80f97d3b-4d33-4a84-b4f0-fbade7f7de5b";//Published flex dataset

    // Action
    const editMetaInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => cloneDatasetRequestInterceptor(req, tdei_dataset_id, tdei_project_group_id, tdei_service_id_flex, 'metadata.json'))
    const versions = await generalAPI.cloneDatasetForm(metaToUpload, tdei_dataset_id, tdei_project_group_id, tdei_service_id_flex);
    // Assert
    expect(versions.status).toBe(200);
    expect(versions.data).toBeString();
    expect(versions.data).not.toBe('');
    axios.interceptors.request.eject(editMetaInterceptor);
  }, 30000);

  //Clone Pathways dataset
  it('POC | Authenticated , When request made to clone pathways dataset, expect to return cloned dataset id', async () => {
    // Arrange
    let generalAPI = new GeneralApi(pocConfiguration);
    let metaToUpload = Utility.getMetadataBlob("pathways");
    let tdei_dataset_id = "6a55980a-dba9-4d62-92cb-b252b2141be5";//Published Pathways dataset

    // Action
    const editMetaInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => cloneDatasetRequestInterceptor(req, tdei_dataset_id, tdei_project_group_id, tdei_service_id_pathways, 'metadata.json'))
    const versions = await generalAPI.cloneDatasetForm(metaToUpload, tdei_dataset_id, tdei_project_group_id, tdei_service_id_pathways);
    // Assert
    expect(versions.status).toBe(200);
    expect(versions.data).toBeString();
    expect(versions.data).not.toBe('');
    axios.interceptors.request.eject(editMetaInterceptor);
  }, 30000);

  it('Admin | Authenticated , When request made to clone pathways dataset, expect to return cloned dataset id', async () => {
    // Arrange
    let generalAPI = new GeneralApi(adminConfiguration);
    let metaToUpload = Utility.getMetadataBlob("pathways");
    let tdei_dataset_id = "6a55980a-dba9-4d62-92cb-b252b2141be5";//Published Pathways dataset

    // Action
    const editMetaInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => cloneDatasetRequestInterceptor(req, tdei_dataset_id, tdei_project_group_id, tdei_service_id_pathways, 'metadata.json'))
    const versions = await generalAPI.cloneDatasetForm(metaToUpload, tdei_dataset_id, tdei_project_group_id, tdei_service_id_pathways);
    // Assert
    expect(versions.status).toBe(200);
    expect(versions.data).toBeString();
    expect(versions.data).not.toBe('');
    axios.interceptors.request.eject(editMetaInterceptor);
  }, 30000);

  it('Pathways Data Generator | Authenticated , When request made to clone pathways dataset, expect to return cloned dataset id', async () => {
    // Arrange
    let generalAPI = new GeneralApi(pathwaysDgConfiguration);
    let metaToUpload = Utility.getMetadataBlob("pathways");
    let tdei_dataset_id = "6a55980a-dba9-4d62-92cb-b252b2141be5";//Published Pathways dataset

    // Action
    const editMetaInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => cloneDatasetRequestInterceptor(req, tdei_dataset_id, tdei_project_group_id, tdei_service_id_pathways, 'metadata.json'))
    const versions = await generalAPI.cloneDatasetForm(metaToUpload, tdei_dataset_id, tdei_project_group_id, tdei_service_id_pathways);
    // Assert
    expect(versions.status).toBe(200);
    expect(versions.data).toBeString();
    expect(versions.data).not.toBe('');
    axios.interceptors.request.eject(editMetaInterceptor);
  }, 30000);

  //Clone osw dataset
  it('POC | Authenticated , When request made to clone OSW dataset, expect to return cloned dataset id', async () => {
    // Arrange`
    let generalAPI = new GeneralApi(pocConfiguration);
    let metaToUpload = Utility.getMetadataBlob("osw");
    let tdei_dataset_id = "18477f8c-c0c7-4b3d-b38d-7260b5681750";//Published OSW dataset`

    // Action
    const editMetaInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => cloneDatasetRequestInterceptor(req, tdei_dataset_id, tdei_project_group_id, tdei_service_id_osw, 'metadata.json'))
    const versions = await generalAPI.cloneDatasetForm(metaToUpload, tdei_dataset_id, tdei_project_group_id, tdei_service_id_osw);
    // Assert
    expect(versions.status).toBe(200);
    expect(versions.data).toBeString();
    expect(versions.data).not.toBe('');
    axios.interceptors.request.eject(editMetaInterceptor);
  }, 30000);

  it('Admin | Authenticated , When request made to clone OSW dataset, expect to return cloned dataset id', async () => {
    // Arrange
    let generalAPI = new GeneralApi(adminConfiguration);
    let metaToUpload = Utility.getMetadataBlob("osw");
    let tdei_dataset_id = "18477f8c-c0c7-4b3d-b38d-7260b5681750";//Published OSW dataset

    // Action
    const editMetaInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => cloneDatasetRequestInterceptor(req, tdei_dataset_id, tdei_project_group_id, tdei_service_id_osw, 'metadata.json'))
    const versions = await generalAPI.cloneDatasetForm(metaToUpload, tdei_dataset_id, tdei_project_group_id, tdei_service_id_osw);
    // Assert
    expect(versions.status).toBe(200);
    expect(versions.data).toBeString();
    expect(versions.data).not.toBe('');
    axios.interceptors.request.eject(editMetaInterceptor);
  }, 30000);

  it('OSW Data Generator | Authenticated , When request made to clone OSW dataset, expect to return cloned dataset id', async () => {
    // Arrange
    let generalAPI = new GeneralApi(oswDgConfiguration);
    let metaToUpload = Utility.getMetadataBlob("osw");
    let tdei_dataset_id = "18477f8c-c0c7-4b3d-b38d-7260b5681750";//Published OSW dataset

    // Action
    const editMetaInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => cloneDatasetRequestInterceptor(req, tdei_dataset_id, tdei_project_group_id, tdei_service_id_osw, 'metadata.json'))
    const versions = await generalAPI.cloneDatasetForm(metaToUpload, tdei_dataset_id, tdei_project_group_id, tdei_service_id_osw);
    // Assert
    expect(versions.status).toBe(200);
    expect(versions.data).toBeString();
    expect(versions.data).not.toBe('');
    axios.interceptors.request.eject(editMetaInterceptor);
  }, 30000);

  it('POC | Authenticated , When request made to clone Pre-Release flex dataset which user not belong to project group, expect to return unauthorized error', async () => {
    // Arrange
    let generalAPI = new GeneralApi(pocConfiguration);
    let metaToUpload = Utility.getMetadataBlob("flex");
    let tdei_dataset_id = "563a8cae-d37e-43f7-86b1-a53edbf72796";//Pre-Release dataset

    // Action
    const editMetaInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => cloneDatasetRequestInterceptor(req, tdei_dataset_id, tdei_project_group_id, tdei_service_id_flex, 'metadata.json'))
    // Assert
    await expect(generalAPI.cloneDatasetForm(metaToUpload, tdei_dataset_id, tdei_project_group_id, tdei_service_id_flex)).rejects.toMatchObject({ response: { status: 400 } });
    axios.interceptors.request.eject(editMetaInterceptor);
  }, 30000);

  it('POC | Authenticated , When request made to clone flex dataset with invalid service id, expect to return input error', async () => {
    // Arrange
    let generalAPI = new GeneralApi(pocConfiguration);
    let metaToUpload = Utility.getMetadataBlob("flex");
    let tdei_dataset_id = "2e5ff85f-fdb8-4384-9f22-98b3cb841015";//Pre-Release dataset
    let invalid_service_id = "f15284bd-f55c-4f51-a862-089166c75b491";

    // Action
    const editMetaInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => cloneDatasetRequestInterceptor(req, tdei_dataset_id, tdei_project_group_id, invalid_service_id, 'metadata.json'))
    // Assert
    await expect(generalAPI.cloneDatasetForm(metaToUpload, tdei_dataset_id, tdei_project_group_id, invalid_service_id)).rejects.toMatchObject({ response: { status: 404 } });
    axios.interceptors.request.eject(editMetaInterceptor);
  }, 30000);

  it('POC | Authenticated , When request made to clone flex dataset with invalid project group id, expect to return forbidden error', async () => {
    // Arrange
    let generalAPI = new GeneralApi(pocConfiguration);
    let metaToUpload = Utility.getMetadataBlob("flex");
    let tdei_dataset_id = "96fe53c4-a8a0-4a05-888f-597a3bf32f97";//Pre-Release dataset
    let invalid_project_group_id = "4257c52a-6a41-40b3-87ce-1b14cf61d9fa1";

    // Action
    const editMetaInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => cloneDatasetRequestInterceptor(req, tdei_dataset_id, invalid_project_group_id, tdei_service_id_flex, 'metadata.json'))
    // Assert
    await expect(generalAPI.cloneDatasetForm(metaToUpload, tdei_dataset_id, invalid_project_group_id, tdei_service_id_flex)).rejects.toMatchObject({ response: { status: 403 } });
    axios.interceptors.request.eject(editMetaInterceptor);
  }, 30000);

  it('POC | Authenticated , When request made to clone flex dataset with service id not associated with project group id, expect to return input error', async () => {
    // Arrange
    let generalAPI = new GeneralApi(pocConfiguration);
    let metaToUpload = Utility.getMetadataBlob("flex");
    let tdei_dataset_id = "563a8cae-d37e-43f7-86b1-a53edbf72796";//Pre-Release other project group dataset
    let invalid_service_group_id = "4257c52a-6a41-40b3-87ce-1b14cf61d9fa";

    // Action
    const editMetaInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => cloneDatasetRequestInterceptor(req, tdei_dataset_id, tdei_project_group_id, invalid_service_group_id, 'metadata.json'))
    // Assert
    await expect(generalAPI.cloneDatasetForm(metaToUpload, tdei_dataset_id, tdei_project_group_id, tdei_service_id_flex)).rejects.toMatchObject({ response: { status: 400 } });
    axios.interceptors.request.eject(editMetaInterceptor);
  }, 30000);

  it('POC | Authenticated , When request made to clone flex dataset with invalid metadata, expect to return input error', async () => {
    // Arrange
    let generalAPI = new GeneralApi(pocConfiguration);
    let metaToUpload = Utility.getInvalidMetadataBlob("flex");
    let tdei_dataset_id = "563a8cae-d37e-43f7-86b1-a53edbf72796";//Pre-Release dataset

    // Action
    const editMetaInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => cloneDatasetRequestInterceptor(req, tdei_dataset_id, tdei_project_group_id, tdei_service_id_flex, 'metadata.json'))
    // Assert
    await expect(generalAPI.cloneDatasetForm(metaToUpload, tdei_dataset_id, tdei_project_group_id, tdei_service_id_flex)).rejects.toMatchObject({ response: { status: 400 } });
    axios.interceptors.request.eject(editMetaInterceptor);
  }, 30000);

  it('Admin | un-authenticated, When request made, should respond with unauthenticated request', async () => {
    // Arrange
    let generalAPI = new GeneralApi(Utility.getAdminConfiguration());
    let metaToUpload = Utility.getMetadataBlob("flex");
    let tdei_dataset_id = "563a8cae-d37e-43f7-86b1-a53edbf72796";

    // Action
    const editMetaInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => cloneDatasetRequestInterceptor(req, tdei_dataset_id, tdei_project_group_id, tdei_service_id_osw, 'metadata.json'))
    // Assert
    await expect(generalAPI.cloneDatasetForm(metaToUpload, tdei_dataset_id, tdei_project_group_id, tdei_service_id_osw)).rejects.toMatchObject({ response: { status: 401 } });
    axios.interceptors.request.eject(editMetaInterceptor);
  }, 30000);
});

