# TDEI-api-tester
API tester for the client-API received from swagger

# Steps
- The testing rig is currently configured based on `test-harness.json` file.
- An example of the file is already given as `test-harness.example.json`
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


## TODO:
 Document on what the component is and where it helps

## Seeder requirements
- To enhance the testing with different personas and varied systems, it is imperative that we generate
  some scripts that allow generation of users and other seed data required for testing.
- Here are the requirements for seed data generation

- Create an project group with random project group data
- Create/register a user for POC role
- Create a user for each role 
- Assign the roles to the users for the generated project group
- Create a pathways station
- Create a flex service

- Generate and keep the access tokens of all the users.

The above seeder should generate all of this and respond with a json or object with the following format:

```json
{
	"users":{
		"poc":"<poc api token>",
		"flexdg":"<flex data generator api key>",
		"pathwaydg":"<pathways data generator api key>",
		"oswdg":"<osw data generator api key>"
	},
	"tdei_project_group_id":"<generated project group ID>",
	"station_id":"<generated station ID>",
	"service_id":"<service ID>"
}

```
