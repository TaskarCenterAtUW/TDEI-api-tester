import {
    Configuration,
    FeatureTypeEnum,
    GeoJsonObject,
    GeoJsonObjectTypeEnum,
    GtfsFlexUpload,
    GtfsFlexUploadCollectionMethodEnum,
    GtfsFlexUploadDataSourceEnum,
    GtfsPathwaysUpload,
    GtfsPathwaysUploadCollectionMethodEnum,
    GtfsPathwaysUploadDataSourceEnum,
    OswUpload,
    OswUploadCollectionMethodEnum,
    OswUploadDataSourceEnum,
} from "tdei-client";
import config from "./test-harness.json";
import { faker } from '@faker-js/faker'
import path from "path";
import * as fs from "fs";

/**
 * Utility class.
 */
export class Utility {
    static getConfiguration(): Configuration {
        return new Configuration({
            username: config.system.username,
            password: config.system.password,
            basePath: config.system.baseUrl
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

    static getRandomOswUpload(): OswUpload {
        return {
            tdei_org_id: "66c85a5a-2335-4b97-a0a3-0bb93cba1ae5",
            collected_by: "Collector name",
            collection_date: "2023-03-03T02:22:45.374Z",
            collection_method: OswUploadCollectionMethodEnum.Manual,
            data_source: OswUploadDataSourceEnum.InHouse,
            publication_date: "2023-03-02T04:22:42.493Z",
            polygon: this.getRandomPolygon(),
            osw_schema_version: "v0.1"
        };
    }

    static getRandomGtfsFlexUpload(): GtfsFlexUpload {

        return {
            tdei_org_id: "0c29017c-f0b9-433e-ae13-556982f2520b",
            tdei_service_id: "9066ad72-d044-4199-9f6c-b71f75ece7e8",
            collected_by: "test user",
            collection_date: "2023-03-03T02:22:45.374Z",
            collection_method: GtfsFlexUploadCollectionMethodEnum.Manual,
            data_source: GtfsFlexUploadDataSourceEnum.InHouse,
            valid_from: "2023-03-02T04:22:42.493Z",
            valid_to: "2023-03-02T04:22:42.493Z",
            polygon: this.getRandomPolygon(),
            flex_schema_version: "v2.0"
        };
    }

    static getRandomPathwaysUpload(): GtfsPathwaysUpload {

        return {
            tdei_org_id: "66c85a5a-2335-4b97-a0a3-0bb93cba1ae5",
            tdei_station_id: "472877cb-edb3-40d2-b0b4-d124b90e5cd1",
            collected_by: "testuser",
            collection_date: "2023-03-02T04:22:42.493Z",
            collection_method: GtfsPathwaysUploadCollectionMethodEnum.Manual,
            valid_from: "2023-03-02T04:22:42.493Z",
            valid_to: "2023-03-02T04:22:42.493Z",
            data_source: GtfsPathwaysUploadDataSourceEnum.InHouse,
            polygon: this.getRandomPolygon(),
            pathways_schema_version: "v1.0"
        };
    }

    static getRandomOrganizationUpload() {
        return {
            org_name: faker.company.name(),
            phone: faker.phone.number('###-###-####'),
            url: faker.internet.url(),
            address: `${faker.address.streetAddress()}, ${faker.address.stateAbbr()}, ${faker.address.country()}`,
            polygon: this.getRandomPolygon()
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

    static getStationUpload(orgId: string) {
        return {
            tdei_org_id: orgId,
            station_name: `${faker.animal.dog()} Station`,
            polygon: this.getRandomPolygon()
        }
    }

    static getServiceUpload(orgId: string) {
        return {
            tdei_org_id: orgId,
            service_name: `${faker.company.name()} Service`,
            polygon: this.getRandomPolygon()
        }
    }

    /**
     * All the file blob datas
     */
    static getFlexBlob(): Blob {
        return this.getFileBlob('gtfs-flex', 'success_1_all_attrs.zip');
    }

    static getPathwaysBlob(): Blob {
        return this.getFileBlob('gtfs-pathways', 'success_1_all_attrs.zip');
    }

    static getOSWBlob(): Blob {
        return this.getFileBlob('osw', 'valid.zip');
    }


    static getFileBlob(directory: string, filename: string): Blob {
        let fileDir = path.dirname(__dirname);
        let payloadFilePath = path.join(fileDir, "assets/payloads/" + directory + "/files/" + filename);
        let filestream = fs.readFileSync(payloadFilePath);
        const blob = new Blob([filestream], { type: "application/zip" });
        return blob

    }
}

