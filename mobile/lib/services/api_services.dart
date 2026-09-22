import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:fazbrike/config.dart';
import 'package:fazbrike/services/middlewares/auth_middleware.dart';
import 'package:fazbrike/services/middlewares/error_middleware.dart';
import 'package:fazbrike/services/models/api_exception.dart';
import 'package:fazbrike/services/models/api_response_model.dart';
import 'package:fazbrike/services/secure_storage_service.dart';

class UploadFile {
  const UploadFile({required this.path, required this.name});
  final String path;
  final String name;
}

class ApiServices {
  ApiServices(SecureStorageService storage)
      : _dio = Dio(
          BaseOptions(
            baseUrl: Config.apiBaseUrl,
            connectTimeout: const Duration(seconds: 30),
            receiveTimeout: const Duration(seconds: 30),
            sendTimeout: const Duration(seconds: 30),
            headers: const {'Accept': 'application/json'},
          ),
        ) {
    _dio.interceptors.addAll([
      AuthMiddleware(storage),
      ErrorMiddleware(storage),
    ]);
  }

  final Dio _dio;

  Future<ApiResponseModel<dynamic>> get(
    String route, {
    Map<String, dynamic>? query,
  }) => _request('GET', route, query: query);

  Future<ApiResponseModel<dynamic>> post(
    String route, {
    Object? data,
    Map<String, dynamic>? query,
  }) => _request('POST', route, data: data, query: query);

  Future<ApiResponseModel<dynamic>> put(
    String route, {
    Object? data,
    Map<String, dynamic>? query,
  }) => _request('PUT', route, data: data, query: query);

  Future<ApiResponseModel<dynamic>> delete(
    String route, {
    Object? data,
    Map<String, dynamic>? query,
  }) => _request('DELETE', route, data: data, query: query);

  Future<ApiResponseModel<dynamic>> upload(
    String route,
    List<UploadFile> files, {
    String field = 'file',
    ProgressCallback? onProgress,
  }) async {
    final form = FormData();
    for (final file in files) {
      form.files.add(
        MapEntry(field, await MultipartFile.fromFile(file.path, filename: file.name)),
      );
    }
    return _request(
      'POST',
      route,
      data: form,
      onSendProgress: onProgress,
      contentType: 'multipart/form-data',
    );
  }

  Future<ApiResponseModel<dynamic>> _request(
    String method,
    String route, {
    Object? data,
    Map<String, dynamic>? query,
    ProgressCallback? onSendProgress,
    String? contentType,
  }) async {
    try {
      final response = await _dio.request<dynamic>(
        route,
        data: data,
        queryParameters: query,
        onSendProgress: onSendProgress,
        options: Options(method: method, contentType: contentType),
      );
      return ApiResponseModel<dynamic>(
        data: response.data,
        statusCode: response.statusCode ?? 200,
      );
    } on DioException catch (error) {
      if (error.error is ApiException) throw error.error! as ApiException;
      throw const ApiException('Não foi possível concluir a solicitação.');
    }
  }
}

final apiServicesProvider = Provider<ApiServices>((ref) {
  return ApiServices(ref.watch(secureStorageProvider));
});
