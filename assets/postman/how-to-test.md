# Testing the metadata validation postman 
- Import the collection to your postman
- Pre-run the `Authenticate` call to ensure that there is access token
- The .zip files needed for upload are available in [payloads](../payloads/) folder
- For flex, use [valid-flex-zip-file](../payloads/gtfs-flex/files/success_1_all_attrs.zip)
- For pathways, use [valid-pathway-file](../payloads/gtfs-pathways/files/success_1_all_attrs.zip)
- Run either of the folders to run all the tests of that specific file type of files


# Testing with different credentials
- If you are testing with different credentials, change the following variables in the collection variables payloads
    - tdei_project_group_id
    - station_id
    - service_id
    
- To know the status of the succesfully uploaded file, call `Status of file` API to know the actual status of the file.