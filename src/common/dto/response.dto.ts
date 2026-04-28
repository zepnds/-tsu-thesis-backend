export class ApiResponse<T = any> {
  status: string;
  message: string;
  data?: T;
  errorCode?: string;

  constructor(status: string, message: string, data?: T, errorCode?: string) {
    this.status = status;
    this.message = message;
    this.data = data;
    this.errorCode = errorCode;
  }

  static success<T>(message: string, data?: T): ApiResponse<T> {
    return new ApiResponse('success', message, data);
  }

  static error<T>(message: string, data?: T, errorCode?: string): ApiResponse<T> {
    return new ApiResponse('error', message, data, errorCode);
  }
}
