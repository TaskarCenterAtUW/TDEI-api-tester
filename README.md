# TDEI-api-tester

This service repository contains automated test cases for TDEI API endpoints to verify their functionality and generate a comprehensive test report. The API specifications are received from Swagger (OpenAPI), ensuring tests are aligned with the latest API definition and remain reliable, functional, and compliant with their specifications

1. Automated Testing of API Endpoints 
   - Executes test cases for all TDEI API endpoints to validate expected responses.
2. Test Case Management
	- Covers positive, negative, and edge cases to ensure robustness.
3.	Report Generation
	- Generates a detailed test report after execution.
	- Includes test results for all endpoints, status codes, response validation, and errors.
4.	Integration with CI/CD
	- Can be integrated into GitHub Workflows or any CI/CD pipeline.

## System requirements
| Software | Version|
|----|---|
| NodeJS | 18.16.0|
| Typescript | 4.8.2 |

## Environment variables

Application configuration is read from .env file. Below are the list of environemnt variables service is dependent on. Description of environment variable is presented in below table

|Name| Description |
|--|--|
| PROVIDER | Provider for cloud service or local (optional)|
|SEED_BASE_URL | User management portal api url  |
|SEED_ADMIN_USER | admin user name|
|SEED_ADMIN_PASSWORD |admin password|
|SYSTEM_BASE_URL | TDEI API url|
|ENVIRONMENT | Environement to run api tester dev, stage, prod|


## API Tester Environment Data

The API Tester requires environment-specific data to execute test cases. This data is essential for ensuring that tests run successfully with the required dependencies.

Environment Data Dependencies stored in api.input.json.

Types of Environment Data Included:
1.	User Accounts:
- Pre-verified users to bypass email verification in user registration tests.
- Includes credentials for different roles like admin, data generators, API key testers, etc.
2.	Dataset IDs:
- Used for testing both positive and negative cases in dataset-related API endpoints.
3. Other API-Specific Dependencies:
- Any additional environment-specific data required by the API test cases.

By maintaining this structured environment input data, the API Tester can run consistent and reliable test cases across different environments. 🚀

## Seeder requirements
- To enhance the testing with different personas and varied systems, it is imperative that we generate some scripts that allow generation of users and other seed data required for testing.

Here are the requirements for seed data generation

- Create an project group with random project group data
- Assign the roles to the users for the generated project group
- Create a service
- Assign role to the users.

When we start test , seeder process will start and start with above seed generation and generate one file with `seed.data.json` which is used while testing the API's with different personas. Json format shown below:

```json
{
    "project_group": {
        "tdei_project_group_id": "<PROJECT_GROUP_ID>",
        "name": "<PROJECT_GROUP_NAME>"
    },
    "services": [
        {
            "tdei_service_id": "<SERVICE_ID_1>",
            "service_type": "<SERVICE_TYPE_1>",
            "service_name": "<SERVICE_NAME_1>",
            "tdei_project_group_id": "<PROJECT_GROUP_ID>"
        },
        {
            "tdei_service_id": "<SERVICE_ID_2>",
            "service_type": "<SERVICE_TYPE_2>",
            "service_name": "<SERVICE_NAME_2>",
            "tdei_project_group_id": "<PROJECT_GROUP_ID>"
        },
        {
            "tdei_service_id": "<SERVICE_ID_3>",
            "service_type": "<SERVICE_TYPE_3>",
            "service_name": "<SERVICE_NAME_3>",
            "tdei_project_group_id": "<PROJECT_GROUP_ID>"
        }
    ],
    "users": {
        "poc": {
            "username": "<POC_USERNAME>",
            "password": "<POC_PASSWORD>"
        },
        "flex_data_generator": {
            "username": "<FLEX_USERNAME>",
            "password": "<FLEX_PASSWORD>"
        },
        "pathways_data_generator": {
            "username": "<PATHWAYS_USERNAME>",
            "password": "<PATHWAYS_PASSWORD>"
        },
        "osw_data_generator": {
            "username": "<OSW_USERNAME>",
            "password": "<OSW_PASSWORD>"
        },
        "api_key_tester": {
            "username": "<API_KEY_TESTER_USERNAME>",
            "password": "<API_KEY_TESTER_PASSWORD>"
        },
        "default_user": {
            "username": "<DEFAULT_USER_USERNAME>",
            "password": "<DEFAULT_USER_PASSWORD>"
        }
    },
    "api_key": "<API_KEY>",
    "api_key_tester": "<API_KEY_TESTER>"
}

```

# Steps
- The testing rig is currently configured based on `.env` file.
- `npm i`
- `npm run test`

The above code runs the tests and generates a `test-report.html` (already included for reference)


## Adding more test cases
- create a file in `src/__tests__` folder.
- name it in the format `<group>.test.ts`
- Write test cases based on [jest](https://jestjs.io/docs/getting-started)

## Important notes on writing tests for better readability
- Consider Adding tests in the below format
> Given
- Setup test data in this step
- Give a line break
> When
- Perform some action
- Give a line break
> Then
- Assert result

```  
describe('my-awesome-test', () => {
	const getTestData => return {};
	it('should validate schema response', () => {
		let testData = getTestData();
		let api = new myAwesomeApi();
		
		const result = api.getVersions();

		expect(result.status).toBe(200);
		expect(result.myAwesomeField).toBe('valid');
	});
});
```
