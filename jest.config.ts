import type {Config} from 'jest';

export default async (): Promise<Config>=>{
    return {
        verbose:true,
        preset:'ts-jest',
        testEnvironment:'jsdom',
        testEnvironmentOptions:{
            html: '<html lang="zh-cmn-Hant"></html>',
            url: 'https://tdei-gateway-dev.azurewebsites.net',
            userAgent: 'Agent/007',
        },
        reporters:[
            "default",
            ["./node_modules/jest-html-reporter",{
                "pageTitle": "Test Report",
                "includeFailureMsg": true
            }]
        ],
        transform:{
            '^.+\\.(ts|tsx)?$':'ts-jest'
        }
    }
}