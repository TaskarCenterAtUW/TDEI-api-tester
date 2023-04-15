import {
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
  OswUploadDataSourceEnum
} from "tdei-client";

/**
 * Utility class.
 */
export class Utility {
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
    /**
     * {"tdei_org_id":"66c85a5a-2335-4b97-a0a3-0bb93cba1ae5",
     * "collected_by":"sfsd",
     * "collection_date":"2023-03-03T02:22:45.374Z",
     * "collection_method":"manual",
     * "publication_date":"2023-03-02T04:22:42.493Z",
     * "data_source":"InHouse",
     * "polygon":{"type":"FeatureCollection","features":[{"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[77.588807608,12.976222962],[77.589285425,12.972094479],[77.593012392,12.974608826],[77.588839463,12.976254003],[77.588807608,12.976222962]]]}}]},
     * "osw_schema_version":"v0.1"}
     */

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
    /**
    {
    "tdei_org_id": "66c85a5a-2335-4b97-a0a3-0bb93cba1ae5",
    "tdei_service_id": "9db42377-a4a7-4e5f-bc4a-ebbe40bfed19",
    "collected_by": "testuser",
    "collection_date": "2023-03-02T04:22:42.493Z",
    "collection_method": "manual",
    "valid_from": "2023-03-02T04:22:42.493Z",
    "valid_to": "2023-03-06T04:22:42.493Z",
    "data_source": "TDEITools",
    "polygon": {
    "type": "FeatureCollection",
    "features": [
      {
        "type": "Feature",
        "geometry": {
          "type": "Polygon",
          "coordinates": [
            [
              [
                78.319084,
                13.0361
              ],
              [
                71.508215,
                13.9144
              ],
              [
                73.175267,
                13.187164
              ],
              [
                71.323583,
                12.67485
              ],
              [
                78.319084,
                13.0361
              ]
            ]
          ]
        }
      }
    ]
    },
    "flex_schema_version": "v2.0"
    }
     */

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
      flex_schema_version: "v2.0"};
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

}