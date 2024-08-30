import type { Config } from 'jest';

export default async (): Promise<Config> => {
    return {
        globalSetup: "./global.setup.ts",
        maxWorkers: 1,
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
                "enableMergeData": true,
                "inlineSource": true,
                "pageTitle": `TDEI API Test Report - ${new Date().toLocaleString()}`,
                "logoImgPath": "assets/tdei_logo.png",
                "customInfos": [{
                    "title": "Project",
                    "value": "TDEI API Tester"
                }]
            }]
        ],
        transform: {
            '^.+\\.(ts|tsx)?$': 'ts-jest'
        }
    }
}