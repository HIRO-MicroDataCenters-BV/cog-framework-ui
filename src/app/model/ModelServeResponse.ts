export interface ModelServeResponse {
  data: ModelServeResponseData;
  errors: Error[];
  message: string;
  success: boolean;
}

export interface Error {
  date: string;
  error_code: string;
  error_message: string;
}

export interface ModelServeResponseData {
  msg: string;
  status: boolean;
}
