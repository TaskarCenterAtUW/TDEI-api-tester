
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
    default_user: Credentials
}


export interface SeedData {
    datasets: {
        osw: {
            pre_release_dataset: string;
            test_dataset: string;
            published_dataset: string;
            spatial_target_dataset: string;
            spatial_source_dataset: string;
        },
        flex: {
            published_dataset: string;
            pre_release_dataset: string;
        },
        pathways: {
            published_dataset: string;
            pre_release_dataset: string;
        }
    },
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