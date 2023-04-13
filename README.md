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


## TODO:
 Document on what the component is and where it helps
