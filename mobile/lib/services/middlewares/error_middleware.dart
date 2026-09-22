import 'package:dio/dio.dart';
import 'package:fazbrike/services/models/api_exception.dart';
import 'package:fazbrike/services/secure_storage_service.dart';
import 'package:fazbrike/services/session_signal.dart';

class ErrorMiddleware extends Interceptor {
  ErrorMiddleware(this._storage);

  final SecureStorageService _storage;

  @override
  Future<void> onError(
    DioException err,
    ErrorInterceptorHandler handler,
  ) async {
    final status = err.response?.statusCode;
    final data = err.response?.data;
    if (status == 401 || status == 403) {
      await _storage.deleteToken();
      sessionSignal.value = SessionStatus.unauthenticated;
    }

    final message = switch (data) {
      {'error': final Object value} => value.toString(),
      {'message': final Object value} => value.toString(),
      _ when err.type == DioExceptionType.connectionError =>
        'Sem conexão com o servidor.',
      _ when err.type == DioExceptionType.connectionTimeout ||
              err.type == DioExceptionType.receiveTimeout ||
              err.type == DioExceptionType.sendTimeout =>
        'A conexão demorou demais. Tente novamente.',
      _ => 'Não foi possível concluir a solicitação.',
    };

    handler.reject(
      DioException(
        requestOptions: err.requestOptions,
        response: err.response,
        type: err.type,
        error: ApiException(
          message,
          statusCode: status,
          details: data is Map<String, dynamic> ? data['details'] : null,
          isOffline: err.type == DioExceptionType.connectionError,
        ),
      ),
    );
  }
}
