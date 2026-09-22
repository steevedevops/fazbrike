class ApiException implements Exception {
  const ApiException(
    this.message, {
    this.statusCode,
    this.details,
    this.isOffline = false,
  });

  final String message;
  final int? statusCode;
  final dynamic details;
  final bool isOffline;

  @override
  String toString() => message;
}
