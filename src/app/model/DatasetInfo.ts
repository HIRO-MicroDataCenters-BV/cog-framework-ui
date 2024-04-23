export interface DatasetInfo {
    data: Dataset[];
    errors?: any;
    message: string;
    success: boolean;
}

export interface DatasetById {
    data: Dataset;
    errors?: any;
    message: string;
    success: boolean;
}

export interface Dataset {
    dataset_id: number;
    dataset_name: string;
}