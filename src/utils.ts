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
} from "tdei-client";
import { environment } from "./environment/environment";
import { faker } from '@faker-js/faker'
import path from "path";
import * as fs from "fs";

/**
 * Utility class.
 */
export class Utility {
    static getConfiguration(): Configuration {
        return new Configuration({
            username: environment.system.username,
            password: environment.system.password,
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


    static getRandomGtfsFlexUpload(): GtfsFlexUpload {

        return {
            tdei_project_group_id: "0c29017c-f0b9-433e-ae13-556982f2520b",
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
            tdei_project_group_id: "66c85a5a-2335-4b97-a0a3-0bb93cba1ae5",
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

    static getRandomProjectGroupUpload() {
        return {
            project_group_name: faker.company.name(),
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

    static getStationUpload(project_group_id: string) {
        return {
            tdei_project_group_id: project_group_id,
            station_name: `${faker.animal.dog()} Station`,
            polygon: this.getRandomPolygon()
        }
    }

    static getServiceUpload(project_group_id: string) {
        return {
            tdei_project_group_id: project_group_id,
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
        return this.getFileBlob('osw', 'osm.zip');
    }

    // Change the implementation
    static getChangesetBlob(): Blob {
        return this.getFileBlob('osw', 'changeset.txt', 'text/plain');
    }
    // Change the implementation  here
    static getOSWMetadataBlob(): Blob {
        //const blob = new Blob([jsonString], { type: 'application/json' });
        let randomMetadata = {
            "name": "Upload testing",
            "version": "v2.0",
            "descption": "Bootstrap",
            "custom_metadata": {
                "name": "Lara",
                "gender": "female"
            },
            "collected_by": "John Doe",
            "collection_date": "2019-02-10T09:30Z",
            "collection_method": "manual",
            "data_source": "3rdParty",
            "osw_schema_version": "v0.1"
        }
        randomMetadata['name'] = faker.random.alphaNumeric(9);
        let jsonString = JSON.stringify(randomMetadata);
        const blob = new Blob([jsonString], { type: 'application/json' });

        return blob;
    }

    static getInvalidOSWMetadataBlob(): Blob {
        //no name and version required fields
        let randomMetadata = {
            "descption": "Bootstrap",
            "custom_metadata": {
                "name": "Lara",
                "gender": "female"
            },
            "collected_by": "John Doe",
            "collection_date": "2019-02-10T09:30Z",
            "collection_method": "manual",
            "data_source": "3rdParty",
            "osw_schema_version": "v0.1"
        }
        randomMetadata['name'] = faker.random.alphaNumeric(9);
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
}

