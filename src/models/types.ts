
export interface Credentials {
    username: string
    password: string
}

export interface Users {
    poc: Credentials
    flex_data_generator: Credentials
    pathways_data_generator: Credentials
    osw_data_generator: Credentials
    api_key_tester: Credentials
}


export interface SeedData {
    project_group: {
        tdei_project_group_id: string,
        name: string,
    };
    services: [{
        tdei_project_group_id: string,
        service_type: string,
        service_name: string,
        tdei_service_id: string
    }];
    users: Users;
    api_key: string;
    api_key_tester: string
}