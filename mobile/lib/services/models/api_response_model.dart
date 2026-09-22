class ApiResponseModel<T> {
  const ApiResponseModel({required this.data, required this.statusCode});

  final T data;
  final int statusCode;

  bool get isSuccess => statusCode >= 200 && statusCode < 300;
}
