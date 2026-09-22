import 'package:dio/dio.dart';
import 'package:fazbrike/services/secure_storage_service.dart';

class AuthMiddleware extends Interceptor {
  AuthMiddleware(this._storage);

  final SecureStorageService _storage;

  @override
  Future<void> onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    final token = await _storage.readToken();
    if (token != null && token.isNotEmpty) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    handler.next(options);
  }
}
