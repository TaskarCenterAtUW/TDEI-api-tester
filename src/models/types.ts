
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
    tdei_org_id: string
    service_id: string
    station_id: string
    users: Users | {}
}