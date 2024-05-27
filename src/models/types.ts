
interface Credentials {
    username: string
    password: string
}

interface Users {
    poc: Credentials
    flex_data_generator: Credentials
    pathways_data_generator: Credentials
    osw_data_generator: Credentials
}


export interface SeedData {
    tdei_project_group_id: string;
    service_id: [{ data_type: string; serviceId: string; }];
    users: Users | {};
    api_key: string;
}