export interface ModelDetailInfo {
    data: Data
    errors: any
    message: string
    success: boolean
}

export interface Data {
    datasets: DatasetInfo[]
    model_files: ModelFileInfo[]
    model_id: string
    model_name: string
    model_description: string
    author: string
    register_date: string

}

export interface DatasetInfo {
    dataset_id: string,
    dataset_name: string,
}

export interface ModelFileInfo {
    file_id: string,
    file_name: string,
}