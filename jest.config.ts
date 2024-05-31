import type { Config } from 'jest';

export default async (): Promise<Config> => {
    return {
        globalSetup: "./global.setup.ts",
        verbose: false,
        preset: 'ts-jest',
        testEnvironment: 'node',
        testTimeout: 15000,
        setupFilesAfterEnv: ["./jest.setup.ts"],
        reporters: [
            "default",
            ["jest-html-reporters", {
                "filename": "test-report.html",
                "urlForTestFiles": "https://github.com/TaskarCenterAtUW/TDEI-api-tester/tree/dev",
                "enableMergeData": true
            }]
            // ["./node_modules/jest-html-reporter", {
            //     "pageTitle": "Test Report",
            //     "includeFailureMsg": true
            // }]
        ],
        transform: {
            '^.+\\.(ts|tsx)?$': 'ts-jest'
        }
    }
}