import { FeatureTypeEnum, GeoJsonObject, GeoJsonObjectTypeEnum, OswUpload, OswUploadCollectionMethodEnum, OswUploadDataSourceEnum } from "tdei-client";

/**
 * Utility class.
 */
export class Utility {

    static getRandomPolygon(): GeoJsonObject {
        return {
            type : GeoJsonObjectTypeEnum.FeatureCollection,
            features:[
                {
                    type: FeatureTypeEnum.Feature,
                    geometry: {
                        type:"Polygon",
                        coordinates:[this.generateRandomCoordinates()]
                    }
                }
            ]
        }

    }

    static generateRandomCoordinates():number[][]{
        var randomCoordinates : number[][] = [];
        var firstRandom = [this.getRandomNumber(70,79),this.getRandomNumber(12,15)];
        randomCoordinates.push(firstRandom);
        for(let i=3;i--;){
            randomCoordinates.push([this.getRandomNumber(70,79),this.getRandomNumber(12,15)]);
        }
        randomCoordinates.push(firstRandom);

        return randomCoordinates;

    }

    static getRandomNumber(min:number,max:number): number{
        var diff = max - min;
        return parseFloat((min + Math.random()*diff).toFixed(6));
    }

    static getRandomOswUpload():OswUpload {
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
        
        return  {
            tdei_org_id:"66c85a5a-2335-4b97-a0a3-0bb93cba1ae5",
            collected_by:"Collector name",
            collection_date:"2023-03-03T02:22:45.374Z",
            collection_method:OswUploadCollectionMethodEnum.Manual,
            data_source:OswUploadDataSourceEnum.InHouse,
            publication_date:"2023-03-02T04:22:42.493Z",
            polygon:this.getRandomPolygon(),
            osw_schema_version:"v0.1"
        };
    }

    
}