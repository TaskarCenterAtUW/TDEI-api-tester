import {
    AuthenticationApi,
    Configuration,
    FeatureTypeEnum,
    GeoJsonObject,
    GeoJsonObjectTypeEnum,
    OswSpatialjoinBody,
    OswSpatialjoinBodySourceDimensionEnum,
    OswSpatialjoinBodyTargetDimensionEnum
} from "tdei-client";
import { environment } from "./environment/environment";
import { faker } from '@faker-js/faker'
import path from "path";
import * as fs from "fs";
import metadata_flex from "../assets/payloads/gtfs-flex/metadata.json";
import metadata_osw from "../assets/payloads/osw/metadata.json";
import metadata_pathways from "../assets/payloads/gtfs-pathways/metadata.json";

/**
 * Utility class.
 */
export class Utility {

    static get seedData() {
        const seedData = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../seed.data.json'), 'utf-8'));
        return seedData;
    }

    static async setAuthToken(configuration: Configuration) {
        let authAPI = new AuthenticationApi(configuration);
        const loginResponse = await authAPI.authenticate({
            username: configuration.username,
            password: configuration.password
        });
        configuration.baseOptions = {
            headers: { ...Utility.addAuthZHeader(loginResponse.data.access_token) }
        };
    }

    static getApiKeyConfiguration() {
        let configuration = new Configuration({
            basePath: environment.system.baseUrl,
            apiKey: this.seedData.api_key
        });
        return configuration;
    }

    static getAdminConfiguration(): Configuration {
        return new Configuration({
            username: environment.seed.adminUser,
            password: environment.seed.adminPassword,
            basePath: environment.system.baseUrl
        });
    }

    static getPocConfiguration(): Configuration {
        return new Configuration({
            username: this.seedData.users.poc.username,
            password: this.seedData.users.poc.password,
            basePath: environment.system.baseUrl
        });
    }

    static getOSWDataGeneratorConfiguration(): Configuration {
        return new Configuration({
            username: this.seedData.users.osw_data_generator.username,
            password: this.seedData.users.osw_data_generator.password,
            basePath: environment.system.baseUrl
        });
    }

    static getPathwaysDataGeneratorConfiguration(): Configuration {
        return new Configuration({
            username: this.seedData.users.pathways_data_generator.username,
            password: this.seedData.users.pathways_data_generator.password,
            basePath: environment.system.baseUrl
        });
    }

    static getFlexDataGeneratorConfiguration(): Configuration {
        return new Configuration({
            username: this.seedData.users.flex_data_generator.username,
            password: this.seedData.users.flex_data_generator.password,
            basePath: environment.system.baseUrl
        });
    }
    static addAuthZHeader(accessToken) {
        return { Authorization: `Bearer ${accessToken}` };
    }

    static getRandomPolygon(): GeoJsonObject {
        return {
            type: GeoJsonObjectTypeEnum.FeatureCollection,
            features: [
                {
                    type: FeatureTypeEnum.Feature,
                    geometry: {
                        type: "Polygon",
                        coordinates: [this.generateRandomCoordinates()]
                    }
                }
            ]
        };
    }

    static generateRandomCoordinates(): number[][] {
        var randomCoordinates: number[][] = [];
        var firstRandom = [
            this.getRandomNumber(70, 79),
            this.getRandomNumber(12, 15)
        ];
        randomCoordinates.push(firstRandom);
        for (let i = 3; i--;) {
            randomCoordinates.push([
                this.getRandomNumber(70, 79),
                this.getRandomNumber(12, 15)
            ]);
        }
        randomCoordinates.push(firstRandom);

        return randomCoordinates;
    }

    static getRandomNumber(min: number, max: number): number {
        var diff = max - min;
        return parseFloat((min + Math.random() * diff).toFixed(6));
    }

    static getRandomProjectGroupUpload() {
        return {
            project_group_name: faker.company.name(),
            phone: faker.phone.number('###-###-####'),
            url: faker.internet.url(),
            address: `${faker.address.streetAddress()}, ${faker.address.stateAbbr()}, ${faker.address.country()}`,
            dataset_area: this.getRandomPolygon()
        }
    }

    static getUserUpload() {
        return {
            firstName: faker.name.firstName(),
            lastName: faker.name.lastName(),
            email: faker.internet.email(),
            phone: faker.phone.number('##########'),
            password: 'Pa$s1word'
        }
    }

    static getStationUpload(project_group_id: string) {
        return {
            tdei_project_group_id: project_group_id,
            station_name: `${faker.animal.dog()} Station`,
            dataset_area: this.getRandomPolygon()
        }
    }

    static getServiceUpload(project_group_id: string, service_type: string) {
        return {
            tdei_project_group_id: project_group_id,
            service_type: service_type,
            service_name: `${faker.company.name()} Service`,
            dataset_area: this.getRandomPolygon()
        }
    }

    /**
     * All the file blob datas
     */
    static getFlexBlob(): Blob {
        return this.getFileBlob('gtfs-flex', 'flex_success_1.zip');
    }

    static getPathwaysBlob(): Blob {
        return this.getFileBlob('gtfs-pathways', 'gtfs-pathways-valid.zip');
    }

    static getOSWBlob(): Blob {
        return this.getFileBlob('osw', 'Archivew.zip');
    }

    // Change the implementation
    static getChangesetBlob(): Blob {
        return this.getFileBlob('osw', 'changeset.zip');
    }
    // Change the implementation  here
    static getMetadataBlob(type: string): Blob {
        //const blob = new Blob([jsonString], { type: 'application/json' });
        let randomMetadata = {};
        if (type == 'flex') {
            randomMetadata = metadata_flex;
            randomMetadata['dataset_detail']['schema_version'] = 'v2.0';
        } else if (type == 'pathways') {
            randomMetadata = metadata_pathways;
            randomMetadata['dataset_detail']['schema_version'] = 'v1.0';
        } else if (type == 'osw') {
            randomMetadata = metadata_osw;
            randomMetadata['dataset_detail']['schema_version'] = 'v0.2';
        }

        randomMetadata['dataset_detail']['name'] = faker.random.alphaNumeric(9) + `_${type}`;
        let jsonString = JSON.stringify(randomMetadata);
        const blob = new Blob([jsonString], { type: 'application/json' });

        return blob;
    }

    static getOSWSubRegionBlob(): Blob {
        let filePath = path.join(__dirname, '../assets/payloads/osw/sub-region.geojson');
        console.log(filePath);
        let filestream = fs.readFileSync(filePath);
        // let jsonString = JSON.stringify(osw_sub_region);
        const blob = new Blob([filestream], { type: 'application/json' });
        return blob;
    }

    static getOSWInvalidSubRegionBlob(): Blob {
        let randomMetadata = [
            {
                "type": "FeatureCollection",
                "features": [
                    {
                        "type": "Feature",
                        "properties": {},
                        "geometry": {
                            "type": "Polygon"
                        }
                    }
                ]
            }];
        let jsonString = JSON.stringify(randomMetadata);
        const blob = new Blob([jsonString], { type: 'application/json' });

        return blob;
    }

    static getOSWTagMetricBlob(): Blob {
        let filePath = path.join(__dirname, '../assets/payloads/osw/tag-quality.json');
        console.log(filePath);
        let filestream = fs.readFileSync(filePath);
        const blob = new Blob([filestream], { type: 'application/json' });
        return blob;
    }

    static getOSWTagMetricEmptyBlob(): Blob {
        let randomMetadata = [{}];
        let jsonString = JSON.stringify(randomMetadata);
        const blob = new Blob([jsonString], { type: 'application/json' });

        return blob;
    }

    static getOSWTagMetricSQLInjEntityBlob(): Blob {
        let randomMetadata = [
            {
                "entity_type": "Footway; Delete * from table;--",
                "tags": [
                    "surface",
                    "width",
                    "incline",
                    "length",
                    "description",
                    "name",
                    "foot"
                ]
            }];
        let jsonString = JSON.stringify(randomMetadata);
        const blob = new Blob([jsonString], { type: 'application/json' });

        return blob;
    }

    static getOSWTagMetricInvalidEntityBlob(): Blob {
        let randomMetadata = [
            {
                "entity_type": "Footway_invalid",
                "tags": [
                    "surface",
                    "width",
                    "incline",
                    "length",
                    "description",
                    "name",
                    "foot"
                ]
            }];
        let jsonString = JSON.stringify(randomMetadata);
        const blob = new Blob([jsonString], { type: 'application/json' });

        return blob;
    }

    static getOSWTagMetricInvalidTagBlob(): Blob {
        let randomMetadata = [
            {
                "entity_type": "Footway",
                "tags": [
                    "surface_old",
                    "width",
                    "incline",
                    "length",
                    "description",
                    "name",
                    "foot"
                ]
            }];
        let jsonString = JSON.stringify(randomMetadata);
        const blob = new Blob([jsonString], { type: 'application/json' });

        return blob;
    }

    static getInvalidMetadataBlob(type: string): Blob {
        //no name and version required fields
        let randomMetadata = {
            "description": "Bootstrap",
            "custom_metadata": {
                "name": "Lara",
                "gender": "female"
            },
            "collected_by": "John Doe",
            "collection_date": "2019-02-10T09:30Z",
            "collection_method": "manual",
            "data_source": "3rdParty",
            "schema_version": "v0.1"
        }
        randomMetadata['name'] = faker.random.alphaNumeric(9) + `_${type}`;
        let jsonString = JSON.stringify(randomMetadata);
        const blob = new Blob([jsonString], { type: 'application/json' });

        return blob;
    }

    static getFileBlob(directory: string, filename: string, type: string = "application/zip"): Blob {
        let fileDir = path.dirname(__dirname);
        let payloadFilePath = path.join(fileDir, "assets/payloads/" + directory + "/files/" + filename);
        let filestream = fs.readFileSync(payloadFilePath);
        const blob = new Blob([filestream], { type: type });
        return blob

    }

    static getSpatialJoinInput() {
        let model: OswSpatialjoinBody = {
            target_dataset_id: "fa8e12ea-6b0c-4d3e-8b38-5b87b268e76b",
            target_dimension: OswSpatialjoinBodyTargetDimensionEnum.Edge,
            source_dataset_id: "0d661b69495d47fb838862edf699fe09",
            source_dimension: OswSpatialjoinBodySourceDimensionEnum.Point,
            join_condition: "ST_Contains(ST_Buffer(geometry_target, 5), geometry_source)",
            join_filter_target: "highway='footway' AND footway='sidewalk'",
            join_filter_source: "highway='street_lamp'",
            aggregate: ["ARRAY_AGG(highway) as my_highway"]
        }
        return model;
    }
}

