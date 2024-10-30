import { Configuration, DatasetItemProjectGroup, DatasetItem, DatasetItemStatusEnum, CommonAPIsApi, VersionSpec, DatasetItemService, MetadataModelDatasetDetailCollectionMethodEnum, MetadataModelDatasetDetailDataSourceEnum, JobDetails, JobProgress, ServiceModel, AuthenticationApi, MetricsApi } from "tdei-client";
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
let apiInput: any = {};

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
  tdei_project_group_id = seedData.project_group.tdei_project_group_id;
  tdei_service_id_osw = seedData.services.find(x => x.service_type == "osw")!.tdei_service_id;
  tdei_service_id_flex = seedData.services.find(x => x.service_type == "flex")!.tdei_service_id;
  tdei_service_id_pathways = seedData.services.find(x => x.service_type == "pathways")!.tdei_service_id;
  apiInput = Utility.getApiInput();

}, 30000);

describe('List Datasets', () => {

  it('API-Key | Authenticated , When request made with no filters, should return list of dataset', async () => {
    let oswAPI = new CommonAPIsApi(apiKeyConfiguration);

    const datasetFiles = await oswAPI.listDatasetFiles();

    expect(datasetFiles.status).toBe(200);

    expect(Array.isArray(datasetFiles.data)).toBe(true);

    datasetFiles.data.forEach(file => {
      expect(file).toMatchObject({
        status: expect.toBeOneOf([DatasetItemStatusEnum.PreRelease.toString(), DatasetItemStatusEnum.Publish.toString()]),
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

      // Special handling for metadata field which can be null or undefined
      if (file.metadata.data_provenance && Object.keys(file.metadata.data_provenance).length > 0) {
        expect(file.metadata.data_provenance).toEqual(
          {
            full_dataset_name: expect.any(String),
            other_published_locations: expect.toBeOneOf([null, undefined, expect.any(String)]),
            dataset_update_frequency_months: expect.toBeOneOf([null, undefined, expect.any(Number)]),
            schema_validation_run: expect.toBeOneOf([null, undefined, expect.any(Boolean)]),
            schema_validation_run_description: expect.toBeOneOf([null, undefined, expect.any(String)]),
            allow_crowd_contributions: expect.toBeOneOf([null, undefined, expect.any(Boolean)]),
            location_inaccuracy_factors: expect.toBeOneOf([null, undefined, expect.any(String)])
          }
        );
      }
      if (file.metadata.dataset_detail) {
        expect(file.metadata.dataset_detail).toEqual(
          {
            name: expect.toBeOneOf([null, expect.any(String)]),
            description: expect.toBeOneOf([null, expect.any(String)]),
            version: expect.toBeOneOf([null, expect.any(String)]),
            custom_metadata: expect.toBeOneOf([null, expect.anything()]),
            collected_by: expect.toBeOneOf([null, expect.any(String)]),
            collection_date: expect.toBeOneOf([null, expect.any(String)]),
            valid_from: expect.toBeOneOf([null, expect.any(String)]),
            valid_to: expect.toBeOneOf([null, expect.toBeOneOf([null, expect.any(String)]),]),
            collection_method: expect.toBeOneOf([
              null,
              MetadataModelDatasetDetailCollectionMethodEnum.Generated.toString(),
              MetadataModelDatasetDetailCollectionMethodEnum.Other.toString(), "others",
              MetadataModelDatasetDetailCollectionMethodEnum.Transform.toString(),
              MetadataModelDatasetDetailCollectionMethodEnum.Manual.toString()]),
            data_source: expect.toBeOneOf([
              null,
              MetadataModelDatasetDetailDataSourceEnum.InHouse.toString(),
              MetadataModelDatasetDetailDataSourceEnum.TDEITools.toString(),
              MetadataModelDatasetDetailDataSourceEnum._3rdParty.toString()]),
            dataset_area: expect.toBeOneOf([null, expect.toBeObject()]),
            schema_version: expect.toBeOneOf([null, expect.any(String)]),
          }
        );
      }
      if (file.metadata.dataset_summary && Object.keys(file.metadata.dataset_summary).length > 0) {
        expect(file.metadata.dataset_summary).toEqual(
          {
            collection_name: expect.toBeOneOf([null, expect.any(String)]),
            department_name: expect.toBeOneOf([null, expect.any(String)]),
            city: expect.toBeOneOf([null, expect.any(String)]),
            region: expect.toBeOneOf([null, expect.any(String)]),
            county: expect.toBeOneOf([null, expect.any(String)]),
            key_limitations_of_the_dataset: expect.toBeOneOf([null, expect.any(String)]),
            challenges: expect.toBeOneOf([null, expect.any(String)])
          }
        );
      }
      if (file.metadata.maintenance && Object.keys(file.metadata.maintenance).length > 0) {
        expect(file.metadata.maintenance).toEqual(
          {
            official_maintainer: expect.toBeOneOf([null, expect.any(Array)]),
            last_updated: expect.toBeOneOf([null, expect.any(String)]),
            update_frequency: expect.toBeOneOf([null, expect.any(String)]),
            authorization_chain: expect.toBeOneOf([null, expect.any(String)]),
            maintenance_funded: expect.toBeOneOf([null, expect.any(Boolean)]),
            funding_details: expect.toBeOneOf([null, expect.any(String)])
          }
        );
      }
      if (file.metadata.methodology && Object.keys(file.metadata.methodology).length > 0) {
        expect(file.metadata.methodology).toEqual(
          {
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
        );
      }
    });
  });

  it('Admin | Authenticated , When request made with no filters, should return list of dataset', async () => {
    let oswAPI = new CommonAPIsApi(adminConfiguration);

    const datasetFiles = await oswAPI.listDatasetFiles();

    expect(datasetFiles.status).toBe(200);

    expect(Array.isArray(datasetFiles.data)).toBe(true);

    datasetFiles.data.forEach(file => {
      expect(file).toMatchObject(<DatasetItem>{
        status: expect.toBeOneOf([DatasetItemStatusEnum.PreRelease.toString(), DatasetItemStatusEnum.Publish.toString()]),
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

      // Special handling for metadata field which can be null or undefined
      if (file.metadata.data_provenance && Object.keys(file.metadata.data_provenance).length > 0) {
        expect(file.metadata.data_provenance).toEqual(
          {
            full_dataset_name: expect.any(String),
            other_published_locations: expect.toBeOneOf([null, undefined, expect.any(String)]),
            dataset_update_frequency_months: expect.toBeOneOf([null, undefined, expect.any(Number)]),
            schema_validation_run: expect.toBeOneOf([null, undefined, expect.any(Boolean)]),
            schema_validation_run_description: expect.toBeOneOf([null, undefined, expect.any(String)]),
            allow_crowd_contributions: expect.toBeOneOf([null, undefined, expect.any(Boolean)]),
            location_inaccuracy_factors: expect.toBeOneOf([null, undefined, expect.any(String)])
          }
        );
      }
      if (file.metadata.dataset_detail) {
        expect(file.metadata.dataset_detail).toEqual(
          {
            name: expect.toBeOneOf([null, expect.any(String)]),
            description: expect.toBeOneOf([null, expect.any(String)]),
            version: expect.toBeOneOf([null, expect.any(String)]),
            custom_metadata: expect.toBeOneOf([null, expect.anything()]),
            collected_by: expect.toBeOneOf([null, expect.any(String)]),
            collection_date: expect.toBeOneOf([null, expect.any(String)]),
            valid_from: expect.toBeOneOf([null, expect.any(String)]),
            valid_to: expect.toBeOneOf([null, expect.toBeOneOf([null, expect.any(String)]),]),
            collection_method: expect.toBeOneOf([
              null,
              MetadataModelDatasetDetailCollectionMethodEnum.Generated.toString(),
              MetadataModelDatasetDetailCollectionMethodEnum.Other.toString(), "others",
              MetadataModelDatasetDetailCollectionMethodEnum.Transform.toString(),
              MetadataModelDatasetDetailCollectionMethodEnum.Manual.toString()]),
            data_source: expect.toBeOneOf([
              null,
              MetadataModelDatasetDetailDataSourceEnum.InHouse.toString(),
              MetadataModelDatasetDetailDataSourceEnum.TDEITools.toString(),
              MetadataModelDatasetDetailDataSourceEnum._3rdParty.toString()]),
            dataset_area: expect.toBeOneOf([null, expect.toBeObject()]),
            schema_version: expect.toBeOneOf([null, expect.any(String)]),
          }
        );
      }
      if (file.metadata.dataset_summary && Object.keys(file.metadata.dataset_summary).length > 0) {
        expect(file.metadata.dataset_summary).toEqual(
          {
            collection_name: expect.toBeOneOf([null, expect.any(String)]),
            department_name: expect.toBeOneOf([null, expect.any(String)]),
            city: expect.toBeOneOf([null, expect.any(String)]),
            region: expect.toBeOneOf([null, expect.any(String)]),
            county: expect.toBeOneOf([null, expect.any(String)]),
            key_limitations_of_the_dataset: expect.toBeOneOf([null, expect.any(String)]),
            challenges: expect.toBeOneOf([null, expect.any(String)])
          }
        );
      }
      if (file.metadata.maintenance && Object.keys(file.metadata.maintenance).length > 0) {
        expect(file.metadata.maintenance).toEqual(
          {
            official_maintainer: expect.toBeOneOf([null, expect.any(Array)]),
            last_updated: expect.toBeOneOf([null, expect.any(String)]),
            update_frequency: expect.toBeOneOf([null, expect.any(String)]),
            authorization_chain: expect.toBeOneOf([null, expect.any(String)]),
            maintenance_funded: expect.toBeOneOf([null, expect.any(Boolean)]),
            funding_details: expect.toBeOneOf([null, expect.any(String)])
          }
        );
      }
      if (file.metadata.methodology && Object.keys(file.metadata.methodology).length > 0) {
        expect(file.metadata.methodology).toEqual(
          {
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
        );
      }
    });
  });

  it('Admin | Authenticated , When request made with page size, should return datasets less than or equal to page size', async () => {
    let oswAPI = new CommonAPIsApi(adminConfiguration);
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
      NULL_PARAM,// service_id,
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
      page_size,
      "status",
      "asc"
      // options ?: AxiosRequestConfig
    );

    expect(datasetFiles.status).toBe(200);
    expect(datasetFiles.data.length).toBeLessThanOrEqual(page_size);


  });

  it('Admin | Authenticated , When request made with project group Id, should return datasets of the specified project group', async () => {
    let oswAPI = new CommonAPIsApi(adminConfiguration);
    //TODO: read from seeder or config
    //let project_group_id = '5e339544-3b12-40a5-8acd-78c66d1fa981';
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
      tdei_project_group_id,// tdei_project_group_id,
      NULL_PARAM,// service_id,
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
      1,// page_no,
      1,// page_size,
      "valid_from",
      "asc"
      // options ?: AxiosRequestConfig
    );

    expect(datasetFiles.status).toBe(200);
    datasetFiles.data.forEach(file => {
      expect(file.project_group.tdei_project_group_id).toBe(tdei_project_group_id)
    })

  });

  it('Admin | Authenticated , When request made with service Id, should return datasets of the specified service', async () => {
    let oswAPI = new CommonAPIsApi(adminConfiguration);
    //TODO: read from seeder or config
    //let project_group_id = '5e339544-3b12-40a5-8acd-78c66d1fa981';
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
      tdei_service_id_osw,// service_id,
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
      1,// page_no,
      1,// page_size,
      "valid_to",
      "asc"
      // options ?: AxiosRequestConfig
    );

    expect(datasetFiles.status).toBe(200);
    datasetFiles.data.forEach(file => {
      expect(file.service.tdei_service_id).toBe(tdei_service_id_osw)
    })

  });

  it('Admin | Authenticated , When request made with tdei_dataset_id, should return dataset of the specified tdei_dataset_id', async () => {
    let oswAPI = new CommonAPIsApi(adminConfiguration);
    //let recordId = "40566429d02c4c80aee68c970977bed8";

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
      NULL_PARAM,// service_id,
      NULL_PARAM,// valid_from,
      NULL_PARAM,// valid_to,
      apiInput.osw.published_dataset,// tdei_dataset_id,
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
      1,// page_no,
      1,//page_size,
      "uploaded_timestamp",
      "asc"
      // options ?: AxiosRequestConfig
    );

    expect(datasetFiles.status).toBe(200);
    expect(datasetFiles.data.length).toBe(1);
    datasetFiles.data.forEach(file => {
      expect(file.tdei_dataset_id).toBe(apiInput.osw.published_dataset)
    });
  });

  it('Admin | Authenticated , When request made with schema_version, should return datasets matching schema_version', async () => {
    let oswAPI = new CommonAPIsApi(adminConfiguration);
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
      NULL_PARAM,// service_id,
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
      1,// page_no,
      1,//page_size,
      "project_group_name",
      "asc"
      // options ?: AxiosRequestConfig
    );

    expect(datasetFiles.status).toBe(200);
    datasetFiles.data.forEach(file => {
      expect(file.metadata.dataset_detail!.schema_version).toContain(schema_version)
    });
  });

  it('Admin | Authenticated , When request made with name, should return dataset matching name', async () => {
    let oswAPI = new CommonAPIsApi(adminConfiguration);
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
      NULL_PARAM,// service_id,
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
      1,// page_no,
      1,//page_size
      // options ?: AxiosRequestConfig
    );

    expect(datasetFiles.status).toBe(200);
    datasetFiles.data.forEach(file => {
      expect(file.metadata.dataset_detail!.name).toContain(name)
    });
  });

  it('Admin | Authenticated , When request made with collection_method, should return datasets matching collection_method', async () => {
    let oswAPI = new CommonAPIsApi(adminConfiguration);
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
      NULL_PARAM,// service_id,
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
      1,// page_no,
      1,//page_size
      // options ?: AxiosRequestConfig
    );

    expect(datasetFiles.status).toBe(200);
    datasetFiles.data.forEach(file => {
      expect(file.metadata.dataset_detail!.collection_method).toBe(collection_method)
    });
  });
  it('Admin | Authenticated , When request made with collected_by, should return datasets matching collected_by', async () => {
    let oswAPI = new CommonAPIsApi(adminConfiguration);
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
      NULL_PARAM,// service_id,
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
      1,// page_no,
      1,//page_size
      // options ?: AxiosRequestConfig
    );

    expect(datasetFiles.status).toBe(200);
    datasetFiles.data.forEach(file => {
      expect(file.metadata.dataset_detail!.collected_by).toBe(collected_by)
    });
  });
  it('Admin | Authenticated , When request made with data_source, should return datasets matching data_source', async () => {
    let oswAPI = new CommonAPIsApi(adminConfiguration);
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
      NULL_PARAM,// service_id,
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
      1,// page_no,
      1,//page_size
      // options ?: AxiosRequestConfig
    );

    expect(datasetFiles.status).toBe(200);
    datasetFiles.data.forEach(file => {
      expect(file.metadata.dataset_detail!.data_source).toBe(data_source)
    })
  });

  it('Admin | Authenticated , When request made with data_type OSW, should return datasets matching data_type', async () => {
    let oswAPI = new CommonAPIsApi(adminConfiguration);
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
      NULL_PARAM,// service_id,
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
      1,// page_no,
      1,//page_size
      // options ?: AxiosRequestConfig
    );

    expect(datasetFiles.status).toBe(200);
    datasetFiles.data.forEach((file: any) => {
      expect(file.data_type).toBe(data_type)
    })
  });

  it('Admin | Authenticated , When request made with data_type Flex, should return datasets matching data_type', async () => {
    let oswAPI = new CommonAPIsApi(adminConfiguration);
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
      NULL_PARAM,// service_id,
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
      1,// page_no,
      1,//page_size
      // options ?: AxiosRequestConfig
    );

    expect(datasetFiles.status).toBe(200);
    datasetFiles.data.forEach((file: any) => {
      expect(file.data_type).toBe(data_type)
    })
  });

  it('Admin | Authenticated , When request made with data_type Pathways, should return datasets matching data_type', async () => {
    let oswAPI = new CommonAPIsApi(adminConfiguration);
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
      NULL_PARAM,// service_id,
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
      1,// page_no,
      1,//page_size
      // options ?: AxiosRequestConfig
    );

    expect(datasetFiles.status).toBe(200);
    datasetFiles.data.forEach((file: any) => {
      expect(file.data_type).toBe(data_type)
    })
  });

  it('Admin | Authenticated , When request made with derived_from_dataset_id, should return datasets matching derived_from_dataset_id', async () => {
    let oswAPI = new CommonAPIsApi(adminConfiguration);
    //let derived_from_dataset_id = "a042a1b3aa874701929cb33a98f28e9d";

    const datasetFiles = await oswAPI.listDatasetFiles(
      NULL_PARAM,// data_type,
      "All",// status,
      NULL_PARAM,// name,
      NULL_PARAM,// version,
      NULL_PARAM,// data_source,
      NULL_PARAM,// collection_method,
      NULL_PARAM,// collected_by,
      apiInput.osw.derived_dataset_id,// derived_from_dataset_id,
      NULL_PARAM,// collection_date,
      NULL_PARAM,// confidence_level,
      NULL_PARAM,// schema_version,
      NULL_PARAM,// tdei_project_group_id,
      NULL_PARAM,// service_id,
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
      1,// page_no,
      1,//page_size
      // options ?: AxiosRequestConfig
    );

    expect(datasetFiles.status).toBe(200);
    datasetFiles.data.forEach(file => {
      expect(file.derived_from_dataset_id).toBe(apiInput.osw.derived_dataset_id)
    })
  });

  it('Admin | Authenticated , When request made with valid_to, should return datasets valid from input datetime', async () => {
    let oswAPI = new CommonAPIsApi(adminConfiguration);
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
      NULL_PARAM,// service_id,
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
      1,// page_no,
      1,//page_size
      // options ?: AxiosRequestConfig
    );

    expect(datasetFiles.status).toBe(200);
    datasetFiles.data.forEach(file => {
      expect(new Date(file.metadata.dataset_detail!.valid_to!)).toBeAfter(new Date(valid_to))
    })
  });

  it('Admin | Authenticated , When request made with valid_from, should return datasets valid from input datetime', async () => {
    let oswAPI = new CommonAPIsApi(adminConfiguration);
    //set date one date before today
    let valid_from = (new Date(new Date().setMonth(new Date().getMonth() - 1))).toISOString();

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
      NULL_PARAM,// service_id,
      valid_from,// valid_from,
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
      1,// page_no,
      1,//page_size
      // options ?: AxiosRequestConfig
    );

    expect(datasetFiles.status).toBe(200);
    datasetFiles.data.forEach(file => {
      expect(new Date(file.metadata.dataset_detail!.valid_from!)).toBeAfter(new Date(valid_from))
    })
  });

  it('Admin | Authenticated , When request made with invalid tdei_dataset_id, should return empty dataset', async () => {
    let oswAPI = new CommonAPIsApi(adminConfiguration);
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
      NULL_PARAM,// service_id,
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
      1,// page_no,
      1,//page_size
      // options ?: AxiosRequestConfig
    );

    expect(datasetFiles.status).toBe(200);
    expect(datasetFiles.data.length).toBe(0);

  });

  it('Admin | un-authenticated , When request made, should respond with unauthenticated request', async () => {
    let oswAPI = new CommonAPIsApi(Utility.getAdminConfiguration());

    const datasetFiles = oswAPI.listDatasetFiles();

    await expect(datasetFiles).rejects.toMatchObject({ response: { status: 401 } });
  });
});

describe("List API versions", () => {

  it('Admin | Authenticated , When request made, expect to return api version list', async () => {
    // Arrange
    let generalAPI = new CommonAPIsApi(adminConfiguration);
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
    let generalAPI = new CommonAPIsApi(apiKeyConfiguration);
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

    let generalAPI = new CommonAPIsApi(Utility.getAdminConfiguration());

    const version = generalAPI.listApiVersions();

    await expect(version).rejects.toMatchObject({ response: { status: 401 } });


  }, 30000);
});

describe('List Project Groups', () => {

  it('Admin | Authenticated , When request made, expect to return list of project groups', async () => {
    let generalAPI = new CommonAPIsApi(adminConfiguration);

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


  it('POC | Authenticated , When request made, expect to return list of project groups', async () => {
    let generalAPI = new CommonAPIsApi(pocConfiguration);

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
    let generalAPI = new CommonAPIsApi(apiKeyConfiguration);

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

  it('POC | Authenticated , When requested with invalid tdei_project_group_id, expect to return tdei_project_group_id not found', async () => {
    let generalAPI = new CommonAPIsApi(pocConfiguration);
    const projectGroupList = generalAPI.listProjectGroups('D552d5d1-0719-4647-b86d-6ae9b25327b7');

    await expect(projectGroupList).rejects.toMatchObject({ response: { status: 404 } });
  }, 30000);

  it('POC | Authenticated , When requested with specific tdei_project_group_id, expect to return project details identified by tdei_project_group_id', async () => {
    let generalAPI = new CommonAPIsApi(pocConfiguration);
    const projectGroupList = await generalAPI.listServices(NULL_PARAM, NULL_PARAM, tdei_project_group_id);

    expect(projectGroupList.status).toBe(200);
    expect(Array.isArray(projectGroupList.data)).toBe(true);

    projectGroupList.data.forEach(data => {
      expect(data).toMatchObject(<any>{
        tdei_project_group_id: expect.any(tdei_project_group_id)
      });
    });
  }, 30000);

  it('POC | Authenticated , When requested with specific service name, expect to return project details name matching input', async () => {
    let generalAPI = new CommonAPIsApi(pocConfiguration);
    let project_name = "";
    const projectGroupList = await generalAPI.listProjectGroups(NULL_PARAM, project_name);

    expect(projectGroupList.status).toBe(200);
    expect(Array.isArray(projectGroupList.data)).toBe(true);

    projectGroupList.data.forEach(data => {
      expect(data).toMatchObject(<any>{
        project_group_name: expect.containskey(project_name)
      });
    });
  }, 30000);

  it('Admin | un-authenticated , When request made, should respond with unauthenticated request', async () => {
    let generalAPI = new CommonAPIsApi(Utility.getAdminConfiguration());

    const projectGroupList = generalAPI.listProjectGroups();

    await expect(projectGroupList).rejects.toMatchObject({ response: { status: 401 } });

  }, 30000)
});

describe('Clone Dataset', () => {
  //Clone flex dataset
  it('POC | Authenticated , When request made to clone flex dataset, expect to return cloned dataset id', async () => {
    // Arrange
    let generalAPI = new CommonAPIsApi(pocConfiguration);
    let metaToUpload = Utility.getMetadataBlob("flex");
    let tdei_dataset_id = apiInput.flex.published_dataset; //"ecf96dce3d36477b8ba53c6833ca4545"; //Published flex dataset

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
    let generalAPI = new CommonAPIsApi(adminConfiguration);
    let metaToUpload = Utility.getMetadataBlob("flex");
    let tdei_dataset_id = apiInput.flex.published_dataset;//"ecf96dce3d36477b8ba53c6833ca4545";//Published flex dataset

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
    let generalAPI = new CommonAPIsApi(flexDgConfiguration);
    let metaToUpload = Utility.getMetadataBlob("flex");
    let tdei_dataset_id = apiInput.flex.published_dataset;//"ecf96dce3d36477b8ba53c6833ca4545";//Published flex dataset

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
    let generalAPI = new CommonAPIsApi(pocConfiguration);
    let metaToUpload = Utility.getMetadataBlob("pathways");
    let tdei_dataset_id = apiInput.pathways.published_dataset;//"1fa972ecdd034ed6807dc5027dd26da2";//Published Pathways dataset

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
    let generalAPI = new CommonAPIsApi(adminConfiguration);
    let metaToUpload = Utility.getMetadataBlob("pathways");
    let tdei_dataset_id = apiInput.pathways.published_dataset;//"1fa972ecdd034ed6807dc5027dd26da2";//Published Pathways dataset

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
    let generalAPI = new CommonAPIsApi(pathwaysDgConfiguration);
    let metaToUpload = Utility.getMetadataBlob("pathways");
    let tdei_dataset_id = apiInput.pathways.published_dataset;//"1fa972ecdd034ed6807dc5027dd26da2";//Published Pathways dataset

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
    // Arrange
    let generalAPI = new CommonAPIsApi(pocConfiguration);
    let metaToUpload = Utility.getMetadataBlob("osw");
    let tdei_dataset_id = apiInput.osw.published_dataset;//"d4dc9901f4794f2da414dcb96412b7c1";//Published OSW dataset`

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
    let generalAPI = new CommonAPIsApi(adminConfiguration);
    let metaToUpload = Utility.getMetadataBlob("osw");
    let tdei_dataset_id = apiInput.osw.published_dataset;//"d4dc9901f4794f2da414dcb96412b7c1";//Published OSW dataset

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
    let generalAPI = new CommonAPIsApi(oswDgConfiguration);
    let metaToUpload = Utility.getMetadataBlob("osw");
    let tdei_dataset_id = apiInput.osw.published_dataset;//"d4dc9901f4794f2da414dcb96412b7c1";//Published OSW dataset

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
    let generalAPI = new CommonAPIsApi(pocConfiguration);
    let metaToUpload = Utility.getMetadataBlob("flex");
    let tdei_dataset_id = apiInput.flex.pre_release_dataset;//"f2574fe66f0046389acc68ee5848e3a9";//Pre-Release dataset

    // Action
    const editMetaInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => cloneDatasetRequestInterceptor(req, tdei_dataset_id, tdei_project_group_id, tdei_service_id_flex, 'metadata.json'))
    // Assert
    await expect(generalAPI.cloneDatasetForm(metaToUpload, tdei_dataset_id, tdei_project_group_id, tdei_service_id_flex)).rejects.toMatchObject({ response: { status: 400 } });
    axios.interceptors.request.eject(editMetaInterceptor);
  }, 30000);

  it('POC | Authenticated , When request made to clone flex dataset with invalid service type, expect to return input error', async () => {
    // Arrange
    let generalAPI = new CommonAPIsApi(pocConfiguration);
    let metaToUpload = Utility.getMetadataBlob("flex");
    let tdei_dataset_id = apiInput.flex.pre_release_dataset;//"f2574fe66f0046389acc68ee5848e3a9";//Pre-Release dataset

    // Action
    const editMetaInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => cloneDatasetRequestInterceptor(req, tdei_dataset_id, tdei_project_group_id, tdei_service_id_osw, 'metadata.json'))
    // Assert
    await expect(generalAPI.cloneDatasetForm(metaToUpload, tdei_dataset_id, tdei_project_group_id, tdei_service_id_osw)).rejects.toMatchObject({ response: { status: 400 } });
    axios.interceptors.request.eject(editMetaInterceptor);
  }, 30000);

  it('POC | Authenticated , When request made to clone flex dataset with invalid service id, expect to return not found error', async () => {
    // Arrange
    let generalAPI = new CommonAPIsApi(pocConfiguration);
    let metaToUpload = Utility.getMetadataBlob("flex");
    let tdei_dataset_id = apiInput.flex.pre_release_dataset;//"f2574fe66f0046389acc68ee5848e3a9";//Pre-Release dataset

    // Action
    const editMetaInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => cloneDatasetRequestInterceptor(req, tdei_dataset_id, tdei_project_group_id, "invalid_service_id", 'metadata.json'))
    // Assert
    await expect(generalAPI.cloneDatasetForm(metaToUpload, tdei_dataset_id, tdei_project_group_id, "invalid_service_id")).rejects.toMatchObject({ response: { status: 404 } });
    axios.interceptors.request.eject(editMetaInterceptor);
  }, 30000);

  it('POC | Authenticated , When request made to clone flex dataset with invalid project group id, expect to return not found error', async () => {
    // Arrange
    let generalAPI = new CommonAPIsApi(pocConfiguration);
    let metaToUpload = Utility.getMetadataBlob("flex");
    let tdei_dataset_id = apiInput.flex.pre_release_dataset;//"f2574fe66f0046389acc68ee5848e3a9";//Pre-Release dataset

    // Action
    const editMetaInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => cloneDatasetRequestInterceptor(req, tdei_dataset_id, "invalid_project_id", tdei_service_id_flex, 'metadata.json'))
    // Assert
    await expect(generalAPI.cloneDatasetForm(metaToUpload, tdei_dataset_id, "invalid_project_id", tdei_service_id_flex)).rejects.toMatchObject({ response: { status: 404 } });
    axios.interceptors.request.eject(editMetaInterceptor);
  }, 30000);

  it('POC | Authenticated , When request made to clone flex dataset with service id not associated with project group id, expect to return input error', async () => {
    // Arrange
    let generalAPI = new CommonAPIsApi(pocConfiguration);
    let metaToUpload = Utility.getMetadataBlob("flex");
    let tdei_dataset_id = apiInput.flex.pre_release_dataset;//"0b165272-afff-46b9-8eb4-14f81bfb92b7";//Pre-Release other project group dataset

    // Action
    const editMetaInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => cloneDatasetRequestInterceptor(req, tdei_dataset_id, tdei_project_group_id, tdei_service_id_flex, 'metadata.json'))
    // Assert
    await expect(generalAPI.cloneDatasetForm(metaToUpload, tdei_dataset_id, tdei_project_group_id, tdei_service_id_flex)).rejects.toMatchObject({ response: { status: 400 } });
    axios.interceptors.request.eject(editMetaInterceptor);
  }, 30000);

  it('POC | Authenticated , When request made to clone flex dataset with invalid metadata, expect to return input error', async () => {
    // Arrange
    let generalAPI = new CommonAPIsApi(pocConfiguration);
    let metaToUpload = Utility.getInvalidMetadataBlob("flex");
    let tdei_dataset_id = apiInput.flex.pre_release_dataset;//"f2574fe66f0046389acc68ee5848e3a9";//Pre-Release dataset

    // Action
    const editMetaInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => cloneDatasetRequestInterceptor(req, tdei_dataset_id, tdei_project_group_id, tdei_service_id_flex, 'metadata.json'))
    // Assert
    await expect(generalAPI.cloneDatasetForm(metaToUpload, tdei_dataset_id, tdei_project_group_id, tdei_service_id_flex)).rejects.toMatchObject({ response: { status: 400 } });
    axios.interceptors.request.eject(editMetaInterceptor);
  }, 30000);

  it('Admin | un-authenticated, When request made, should respond with unauthenticated request', async () => {
    // Arrange
    let generalAPI = new CommonAPIsApi(Utility.getAdminConfiguration());
    let metaToUpload = Utility.getMetadataBlob("flex");
    let tdei_dataset_id = apiInput.flex.pre_release_dataset;

    // Action
    const cloneMetaInterceptor = axios.interceptors.request.use((req: InternalAxiosRequestConfig) => cloneDatasetRequestInterceptor(req, tdei_dataset_id, tdei_project_group_id, tdei_service_id_osw, 'metadata.json'))
    // Assert
    await expect(generalAPI.cloneDatasetForm(metaToUpload, tdei_dataset_id, tdei_project_group_id, tdei_service_id_osw)).rejects.toMatchObject({ response: { status: 401 } });
    axios.interceptors.request.eject(cloneMetaInterceptor);
  }, 30000);
});

describe('List Services', () => {

  it('Admin | Authenticated , When request made, expect to return list of services', async () => {
    let generalAPI = new CommonAPIsApi(adminConfiguration);

    const serviceList = await generalAPI.listServices();

    expect(serviceList.status).toBe(200);
    expect(Array.isArray(serviceList.data)).toBe(true);

    serviceList.data.forEach(data => {
      expect(data).toMatchObject(<any>{
        tdei_service_id: expect.any(String),
        service_name: expect.any(String),
        polygon: expect.any(Object || null),
        service_type: expect.any(String)
      });
    });
  }, 30000);


  it('POC | Authenticated , When request made, expect to return list of services', async () => {
    let generalAPI = new CommonAPIsApi(pocConfiguration);

    const serviceList = await generalAPI.listServices();

    expect(serviceList.status).toBe(200);
    expect(Array.isArray(serviceList.data)).toBe(true);

    serviceList.data.forEach(data => {
      expect(data).toMatchObject(<any>{
        tdei_service_id: expect.any(String),
        service_name: expect.any(String),
        polygon: expect.any(Object || null),
        service_type: expect.any(String)
      });
    });
  }, 30000);

  it('API-Key | Authenticated , When request made, expect to return list of services', async () => {
    let generalAPI = new CommonAPIsApi(apiKeyConfiguration);

    const serviceList = await generalAPI.listServices();

    expect(serviceList.status).toBe(200);
    expect(Array.isArray(serviceList.data)).toBe(true);

    serviceList.data.forEach(data => {
      expect(data).toMatchObject(<any>{
        tdei_service_id: expect.any(String),
        service_name: expect.any(String),
        polygon: expect.any(Object || null),
        service_type: expect.any(String)
      });
    });
  }, 30000);

  it('POC | Authenticated , When requested with invalid tdei_project_group_id, expect to return tdei_project_group_id not found', async () => {
    let generalAPI = new CommonAPIsApi(pocConfiguration);
    const serviceList = generalAPI.listServices(NULL_PARAM, NULL_PARAM, 'D552d5d1-0719-4647-b86d-6ae9b25327b7');

    await expect(serviceList).rejects.toMatchObject({ response: { status: 404 } });
  }, 30000);

  it('POC | Authenticated , When requested with invalid tdei_service_id, expect to return tdei_service_id not found', async () => {
    let generalAPI = new CommonAPIsApi(pocConfiguration);
    const serviceList = generalAPI.listServices('D552d5d1-0719-4647-b86d-6ae9b25327b7');

    await expect(serviceList).rejects.toMatchObject({ response: { status: 404 } });
  }, 30000);

  it('POC | Authenticated , When requested with invalid service type, expect to return invalid service type input error', async () => {
    let generalAPI = new CommonAPIsApi(pocConfiguration);
    const serviceList = generalAPI.listServices(NULL_PARAM, NULL_PARAM, NULL_PARAM, 'invalidServiceType');

    await expect(serviceList).rejects.toMatchObject({ response: { status: 400 } });
  }, 30000);

  it('POC | Authenticated , When requested with specific tdei_service_id, expect to return service details identified by tdei_service_id', async () => {
    let generalAPI = new CommonAPIsApi(pocConfiguration);
    const serviceList = await generalAPI.listServices(tdei_service_id_osw);

    expect(serviceList.status).toBe(200);
    expect(Array.isArray(serviceList.data)).toBe(true);

    serviceList.data.forEach(data => {
      expect(data).toMatchObject(<any>{
        tdei_service_id: expect.any(tdei_service_id_osw)
      });
    });
  }, 30000);

  it('POC | Authenticated , When requested with specific tdei_project_group_id, expect to return service details identified by tdei_project_group_id', async () => {
    let generalAPI = new CommonAPIsApi(pocConfiguration);
    const serviceList = await generalAPI.listServices(NULL_PARAM, NULL_PARAM, tdei_project_group_id);

    expect(serviceList.status).toBe(200);
    expect(Array.isArray(serviceList.data)).toBe(true);

    serviceList.data.forEach(data => {
      expect(data).toMatchObject(<any>{
        tdei_project_group_id: expect.any(tdei_project_group_id)
      });
    });
  }, 30000);

  it('POC | Authenticated , When requested with specific service name, expect to return service details name matching input', async () => {
    let generalAPI = new CommonAPIsApi(pocConfiguration);
    let service_name = "";
    const serviceList = await generalAPI.listServices(NULL_PARAM, service_name);

    expect(serviceList.status).toBe(200);
    expect(Array.isArray(serviceList.data)).toBe(true);

    serviceList.data.forEach(data => {
      expect(data).toMatchObject(<any>{
        service_name: expect.containskey(service_name)
      });
    });
  }, 30000);

  it('Admin | un-authenticated , When request made, should respond with unauthenticated request', async () => {
    let generalAPI = new CommonAPIsApi(Utility.getAdminConfiguration());

    const serviceList = generalAPI.listProjectGroups();

    await expect(serviceList).rejects.toMatchObject({ response: { status: 401 } });

  }, 30000);
});

describe('Authentication', () => {

  it('When request made with valid credentials, expect to return access_token & refresh_token in response', async () => {
    let authApi = new AuthenticationApi(adminConfiguration);

    const response = await authApi.authenticate({ username: adminConfiguration.username, password: adminConfiguration.password });

    expect(response.status).toBe(200);

    expect(response.data).toMatchObject(<any>{
      access_token: expect.any(String),
      refresh_token: expect.any(String)
    });
  }, 30000);

  it('When request made with invalid user, should respond with user not found error', async () => {
    let authApi = new AuthenticationApi(undefined, adminConfiguration.basePath);

    const response = authApi.authenticate({ username: 'invalid', password: 'Invalid01*' });

    await expect(response).rejects.toMatchObject({ response: { status: 404 } });

  }, 30000);

  it('When request made with invalid creds, should respond with unauthenticated request', async () => {
    let authApi = new AuthenticationApi(undefined, adminConfiguration.basePath);

    const response = authApi.authenticate({ username: 'admin@tdei.com', password: 'Invalid01*' });

    await expect(response).rejects.toMatchObject({ response: { status: 401 } });

  }, 30000);

  it('When request made with invalid password policy, should respond with bad request', async () => {
    let authApi = new AuthenticationApi(undefined, adminConfiguration.basePath);

    const response = authApi.authenticate({ username: 'admin@tdei.com', password: 'Invalid' });

    await expect(response).rejects.toMatchObject({ response: { status: 400 } });

  }, 30000);

  it('When request made with long password > 255, should respond with bad request', async () => {
    let authApi = new AuthenticationApi(undefined, adminConfiguration.basePath);

    const response = authApi.authenticate({
      username: 'admin@tdei.com', password: `ABCDEFG*IJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz012345678ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz01234567HIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz012345678CDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789`
    });

    await expect(response).rejects.toMatchObject({ response: { status: 400 } });

  }, 30000);
});

describe('Refresh token', () => {

  it('When request made with valid refresh token, expect to return fresh access_token & refresh_token in response', async () => {
    let authApi = new AuthenticationApi(adminConfiguration);

    const response = await authApi.authenticate({ username: adminConfiguration.username, password: adminConfiguration.password });

    expect(response.status).toBe(200);

    expect(response.data).toMatchObject(<any>{
      access_token: expect.any(String),
      refresh_token: expect.any(String)
    });

    let requestResponse = await authApi.refreshToken(response.data.refresh_token!);
    expect(requestResponse.status).toBe(200);

    expect(requestResponse.data).toMatchObject(<any>{
      access_token: expect.any(String),
      refresh_token: expect.any(String)
    });


  }, 30000);

  it('When request made with invalid refresh_token, should respond with unauthenticated request', async () => {
    let authApi = new AuthenticationApi(adminConfiguration);

    const response = authApi.refreshToken("invalid");

    await expect(response).rejects.toMatchObject({ response: { status: 401 } });

  }, 30000);
});

describe('Recover password', () => {

  it('Admin | Authenticated, When request made with valid email, expect to return success response', async () => {
    let authApi = new AuthenticationApi(Utility.getAdminConfiguration());

    let requestResponse = await authApi.recoverPassword(pocConfiguration.username!);
    expect(requestResponse.status).toBe(200);

  }, 30000);

  it('When request made with invalid username, should respond with user not found error', async () => {
    let authApi = new AuthenticationApi(Utility.getAdminConfiguration());

    const response = authApi.recoverPassword("invalid");

    await expect(response).rejects.toMatchObject({ response: { status: 404 } });

  }, 30000);
});

describe('Verify Email', () => {

  it('When request made with valid email, expect to return success response', async () => {
    let authApi = new AuthenticationApi(Utility.getAdminConfiguration());

    let requestResponse = await authApi.verifyEmail(pocConfiguration.username!);
    expect(requestResponse.status).toBe(200);

  }, 30000);

  it('When request made with invalid username, should respond with user not found error', async () => {
    let authApi = new AuthenticationApi(Utility.getAdminConfiguration());

    const response = authApi.verifyEmail("invalid");

    await expect(response).rejects.toMatchObject({ response: { status: 404 } });

  }, 30000);

});

describe('System metrics', () => {

  it('Admin | Authenticated, When request made, expect to return success response', async () => {
    let metricsApi = new MetricsApi(adminConfiguration);

    let requestResponse = await metricsApi.systemMetrics();
    expect(requestResponse.status).toBe(200);

  }, 30000);

  it('POC | Authenticated, When request made, expect to return success response', async () => {
    let metricsApi = new MetricsApi(pocConfiguration);

    let requestResponse = await metricsApi.systemMetrics();
    expect(requestResponse.status).toBe(200);

  }, 30000);

  it('API-Key | Authenticated, When request made, expect to return success response', async () => {
    let metricsApi = new MetricsApi(apiKeyConfiguration);

    let requestResponse = await metricsApi.systemMetrics();
    expect(requestResponse.status).toBe(200);

  }, 30000);

  it('Admin | un-authenticated, When request made, should respond with unauthenticated request', async () => {
    let metricsApi = new MetricsApi(Utility.getAdminConfiguration());

    const response = metricsApi.systemMetrics();

    await expect(response).rejects.toMatchObject({ response: { status: 401 } });

  }, 30000);
});

describe('Data metrics', () => {

  it('Admin | Authenticated, When request made, expect to return success response', async () => {
    let metricsApi = new MetricsApi(adminConfiguration);

    let requestResponse = await metricsApi.dataMetrics();
    expect(requestResponse.status).toBe(200);

  }, 30000);

  it('POC | Authenticated, When request made, expect to return success response', async () => {
    let metricsApi = new MetricsApi(pocConfiguration);

    let requestResponse = await metricsApi.dataMetrics();
    expect(requestResponse.status).toBe(200);

  }, 30000);

  it('API-Key | Authenticated, When request made, expect to return success response', async () => {
    let metricsApi = new MetricsApi(apiKeyConfiguration);

    let requestResponse = await metricsApi.dataMetrics();
    expect(requestResponse.status).toBe(200);

  }, 30000);

  it('Admin | un-authenticated, When request made, should respond with unauthenticated request', async () => {
    let metricsApi = new MetricsApi(Utility.getAdminConfiguration());

    const response = metricsApi.dataMetrics();

    await expect(response).rejects.toMatchObject({ response: { status: 401 } });

  }, 30000);
});