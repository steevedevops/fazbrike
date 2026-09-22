# Conteúdo dos Arquivos lib/

Substitua `{{APP_NAME}}` pelo nome do pacote, `{{app_name}}` por snake_case, `{{AppName}}` por PascalCase.

---

## Pastas de Assets (criar primeiro)

Criar estrutura:

```
lib/assets/
├── logos/
│   └── .gitkeep
└── images/
    └── .gitkeep
```

**Arquivo `.gitkeep`**: arquivo vazio (ou com uma linha em branco) para que o Git versionar pastas vazias.

**app_icon.png**: o usuário deve adicionar manualmente em `lib/assets/logos/` uma imagem 1024x1024 px. Depois rodar `dart run flutter_launcher_icons` para gerar ícones Android e iOS.

---

## config.dart

```dart
const bool isProduction = bool.fromEnvironment('dart.vm.product');

const String APP_NAME = 'App';
const String PRD_URL = 'http://localhost:8005';
const String DEV_URL = 'http://localhost:8005';
const String API_VERSION = '/api/v1';
const String SOCKET_URL = 'http://localhost:8005';
const String GOOGLE_MAP_API_KEY = '';

class Config {
  static String? get prdUrl => PRD_URL;
  static String? get devUrl => DEV_URL;
  static String? get appName => APP_NAME;
  static String? get socketUrl => SOCKET_URL;
  static String? get endPoint => isProduction ? PRD_URL : DEV_URL;
  static String? get googleMapApiKey => GOOGLE_MAP_API_KEY;
  static String? get apiVersion => API_VERSION;
  static String get baseApi => Config.endPoint! + Config.apiVersion!;
}
```

---

## main.dart

```dart
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:localstorage/localstorage.dart';
import 'package:{{APP_NAME}}/services/navigator_service.dart';
import 'package:{{APP_NAME}}/src/app/{{app_name}}_app.dart';
import 'package:{{APP_NAME}}/src/router.dart';
import 'package:{{APP_NAME}}/src/theme/theme_provider.dart';

class MyHttpOverrides extends HttpOverrides {
  @override
  HttpClient createHttpClient(SecurityContext? context) {
    return super.createHttpClient(context)
      ..badCertificateCallback = ((X509Certificate cert, String host, int port) => true);
  }
}

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  HttpOverrides.global = MyHttpOverrides();
  await initLocalStorage();
  NavigatorService().router = appRouter;

  runApp(
    ProviderScope(
      overrides: [
        localStorageProvider.overrideWithValue(localStorage),
      ],
      child: const {{AppName}}App(),
    ),
  );
}
```

---

## services/navigator_service.dart

```dart
import 'package:flutter/foundation.dart';
import 'package:go_router/go_router.dart';

class NavigatorService {
  late GoRouter _router;
  NavigatorService._privateConstructor();
  static final NavigatorService _instance = NavigatorService._privateConstructor();

  factory NavigatorService() => _instance;

  void go(String path) => _router.go(path);
  void push(String path) => _router.push(path);
  void goParams(String path, Map<String, String> params) {
    _router.go(Uri(path: path, queryParameters: params).toString());
  }
  void pushParams(String path, Map<String, String> params) {
    _router.push(Uri(path: path, queryParameters: params).toString());
  }

  GoRouter get router => _router;
  set router(GoRouter router) => _router = router;
}

class RouteNotifier extends ValueNotifier<int> {
  RouteNotifier() : super(0);
  void notify() {
    value++;
    notifyListeners();
  }
}
```

---

## services/models/api_response_model.dart

```dart
import 'package:dio/dio.dart';

class ApiResponseModel {
  bool isInformational;
  bool isSuccess;
  bool isRedirect;
  bool isClientError;
  bool isServerError;
  bool isAuthorized;
  bool isNotConected;
  int? statusCode;
  Response? response;
  Map<String, dynamic> data;

  ApiResponseModel({
    this.isInformational = false,
    this.isSuccess = false,
    this.isRedirect = false,
    this.isClientError = false,
    this.isServerError = false,
    this.isAuthorized = false,
    this.isNotConected = false,
    this.statusCode,
    this.data = const {},
    this.response,
  });
}

class ApiConfig {
  String? token;
  String? baseUrl;
  ApiConfig({this.token, this.baseUrl});
}
```

---

## services/api_helpers.dart

```dart
import 'dart:convert';
import 'dart:developer';
import 'package:dio/dio.dart';
import 'package:{{APP_NAME}}/services/api_services.dart';

class ApiHelpers {
  static Map<String, dynamic> messageTag(dynamic data, String defaultMsg) {
    if (data != null && data is Map) {
      if (data.containsKey('msg')) return {...data as Map<String, dynamic>, 'message': data['msg']};
      if (data.containsKey('detail')) return {...data as Map<String, dynamic>, 'message': data['detail']};
      if (data.containsKey('descrição')) return {...data as Map<String, dynamic>, 'message': data['descrição']};
      if (data.containsKey('Mensagem')) return {...data as Map<String, dynamic>, 'message': data['Mensagem']};
      if (data.containsKey('Descrição')) return {...data as Map<String, dynamic>, 'message': data['Descrição']};
      if (data.containsKey('error')) return {...data as Map<String, dynamic>, 'message': data['error']};
      if (data.containsKey('mensagem')) return {...data as Map<String, dynamic>, 'message': data['mensagem']};
      return data as Map<String, dynamic>;
    }
    return {'message': defaultMsg};
  }

  static bool isJsonparsed(String? value) {
    if (value == null) return false;
    try {
      jsonDecode(value) as Map<String, dynamic>?;
      return true;
    } catch (_) {
      return false;
    }
  }

  static String defineMethod(ApiMethod type) {
    switch (type) {
      case ApiMethod.POST: return 'POST';
      case ApiMethod.GET: return 'GET';
      case ApiMethod.PUT: return 'PUT';
      case ApiMethod.PATCH: return 'PATCH';
      case ApiMethod.DELETE: return 'DELETE';
    }
  }

  static bool isSuccess(int? statusCode) {
    return statusCode != null && statusCode >= 200 && statusCode <= 226;
  }

  static bool isInformational(int? statusCode) => statusCode == 100 || statusCode == 101;

  static bool isRedirect(int? statusCode) {
    return statusCode != null && statusCode >= 300 && statusCode <= 308;
  }

  static bool isUnauthorized(int? statusCode) => statusCode == 401 || statusCode == 403 || statusCode == 407;

  static bool isClientError(int? statusCode) {
    if (statusCode == null) return false;
    const codes = [400, 401, 402, 403, 404, 405, 406, 407, 408, 409, 410, 411, 412, 413, 414, 415, 416, 417, 422, 424, 426, 428, 429, 431, 451];
    return codes.contains(statusCode);
  }

  static bool isServerError(int? statusCode) {
    if (statusCode == null) return false;
    const codes = [500, 501, 502, 503, 504, 505, 506, 507, 508, 509, 510, 511];
    return codes.contains(statusCode);
  }

  static bool isNotConected(int? statusCode) {
    if (statusCode == null) return false;
    const codes = [100, 101, 305, 401, 403, 407, 502, 503, 504, 507, 511];
    return codes.contains(statusCode);
  }
}
```

---

## services/api_services.dart

```dart
import 'dart:convert';
import 'package:cookie_jar/cookie_jar.dart';
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:{{APP_NAME}}/config.dart';
import 'package:{{APP_NAME}}/services/api_helpers.dart';
import 'package:{{APP_NAME}}/services/middlewares/auth_middleware.dart';
import 'package:{{APP_NAME}}/services/middlewares/cookies.dart';
import 'package:{{APP_NAME}}/services/middlewares/error_middleware.dart';
import 'package:{{APP_NAME}}/services/models/api_response_model.dart';
import 'package:{{APP_NAME}}/src/shared/utils/app_directory.dart';
import 'package:talker_dio_logger/talker_dio_logger_interceptor.dart';
import 'package:talker_dio_logger/talker_dio_logger_settings.dart';

var talker = const TalkerDioLoggerSettings(
  printRequestData: true,
  printRequestHeaders: true,
  printResponseData: true,
  printResponseMessage: true,
  printErrorData: true,
  printResponseHeaders: false,
  printErrorHeaders: false,
  printErrorMessage: false,
);

final ApiServices apiNoAuthServices = ApiServices(
  baseUrl: '${Config.endPoint}/mobile',
  showLogs: kDebugMode ? TalkerDioLogger(settings: talker) : null,
);

final ApiServices apiAuthServices = ApiServices(
  baseUrl: '${Config.endPoint}/mobile',
  withCredentials: true,
  middlewares: [AuthMiddlewareRequired(), CustomErrorMiddleware()],
  showLogs: kDebugMode ? TalkerDioLogger(settings: talker) : null,
);

enum TypeHeader { SESSIONID, TOKEN }
enum TypeBody { JSON, FORMDATA }
enum ApiMethod { POST, PUT, DELETE, GET, PATCH }

class ApiServices {
  final String? baseUrl;
  final TalkerDioLogger? showLogs;
  final bool withCredentials;
  final List<InterceptorsWrapper>? middlewares;

  ApiServices({this.baseUrl, this.withCredentials = false, this.showLogs, this.middlewares});

  Future<ApiResponseModel> callApi({
    required ApiMethod method,
    required String rota,
    Map<String, dynamic>? params,
    Map<String, dynamic>? payload,
    void Function(int, int)? onSendProgress,
    TypeBody typeBody = TypeBody.JSON,
    TypeHeader typeHeader = TypeHeader.SESSIONID,
    List<InterceptorsWrapper>? middlewaresClass,
    ApiConfig? apiConfig,
    TalkerDioLogger? customLog,
    Map<String, dynamic>? customHeader,
  }) async {
    final dio = Dio(BaseOptions(
      baseUrl: (apiConfig != null && apiConfig.baseUrl != null && apiConfig.baseUrl!.isNotEmpty)
          ? '${apiConfig.baseUrl}/'
          : '$baseUrl/',
    ));

    Map<String, dynamic> headers = {...customHeader ?? {}};
    ApiResponseModel responseModel = ApiResponseModel();

    if (typeBody != TypeBody.FORMDATA) {
      headers['Accept'] = 'application/json';
      headers['Content-Type'] = 'application/json';
    }
    if (typeBody == TypeBody.FORMDATA) headers['Accept'] = '*/*';
    if (typeHeader == TypeHeader.TOKEN && apiConfig != null) headers['Authorization'] = apiConfig.token;
    if (kIsWeb && withCredentials) dio.options.extra['withCredentials'] = true;

    dio.options.headers = headers;
    dio.options.method = ApiHelpers.defineMethod(method);
    dio.options.responseType = ResponseType.json;
    dio.interceptors.clear();

    if (!kIsWeb) {
      final cookiePath = await Appdirctory('cookies').getDirectory();
      if (typeHeader == TypeHeader.SESSIONID) {
        dio.interceptors.add(CookieManager(PersistCookieJar(storage: FileStorage(cookiePath))));
      }
    }

    if (middlewaresClass != null && middlewaresClass.isNotEmpty) dio.interceptors.addAll(middlewaresClass);
    if (middlewares != null && middlewaresClass == null) dio.interceptors.addAll(middlewares ?? []);

    if (customLog != null) {
      dio.interceptors.add(customLog);
    } else if (showLogs != null) {
      dio.interceptors.add(showLogs!);
    }

    try {
      final responseResult = await dio.request(
        rota,
        onSendProgress: onSendProgress,
        data: typeBody == TypeBody.FORMDATA ? FormData.fromMap(payload!) : payload,
        queryParameters: params,
      );
      responseModel.response = responseResult;
      responseModel.isAuthorized = true;
      responseModel.statusCode = responseResult.statusCode;
      responseModel.isSuccess = ApiHelpers.isSuccess(responseResult.statusCode);

      if (responseResult.data is Map) {
        responseModel.data = responseResult.data as Map<String, dynamic>;
      } else if (responseResult.data is String) {
        responseModel.data = ApiHelpers.isJsonparsed(responseResult.data)
            ? jsonDecode(responseResult.data) as Map<String, dynamic>
            : {'message': 'sucesso!'};
      } else if (responseResult.data is List) {
        responseModel.data = {'message': 'sucesso!', 'results': responseResult.data};
      } else {
        responseModel.data = {'message': 'Sucesso!'};
      }
    } on DioException catch (err) {
      responseModel.response = err.response;
      responseModel.statusCode = err.response?.statusCode;
      if (ApiHelpers.isClientError(err.response?.statusCode)) {
        responseModel.isClientError = true;
        responseModel.isAuthorized = !ApiHelpers.isUnauthorized(err.response?.statusCode);
        responseModel.data = ApiHelpers.messageTag(err.response?.data,
            responseModel.isAuthorized ? 'Não foi possível completar sua consulta.' : 'As credenciais de autenticação não foram fornecidas.');
      } else if (ApiHelpers.isServerError(err.response?.statusCode)) {
        responseModel.isServerError = true;
        responseModel.data = ApiHelpers.messageTag(err.response?.data, 'Há um problema no nosso servidor, tente mais tarde.');
      } else if (ApiHelpers.isRedirect(err.response?.statusCode)) {
        responseModel.isRedirect = true;
        responseModel.data = ApiHelpers.messageTag(err.response?.data, 'Redirect');
      } else if (ApiHelpers.isInformational(err.response?.statusCode)) {
        responseModel.isInformational = true;
        responseModel.data = ApiHelpers.messageTag(err.response?.data, 'Informational');
      } else if (ApiHelpers.isNotConected(err.response?.statusCode)) {
        responseModel.isNotConected = true;
        responseModel.data = ApiHelpers.messageTag(err.response?.data, 'Sem conexão.');
      } else {
        responseModel.data = ApiHelpers.messageTag(err.response?.data, 'Erro desconhecido.');
      }

      switch (err.type) {
        case DioExceptionType.badCertificate:
          responseModel.isServerError = true;
          responseModel.data = ApiHelpers.messageTag(err.response?.data, 'Certificado inválido.');
          break;
        case DioExceptionType.connectionTimeout:
        case DioExceptionType.receiveTimeout:
          responseModel.isServerError = true;
          responseModel.data = ApiHelpers.messageTag(err.response?.data, 'Timeout.');
          break;
        case DioExceptionType.cancel:
          responseModel.isClientError = true;
          responseModel.data = ApiHelpers.messageTag(err.response?.data, 'Requisição cancelada.');
          break;
        case DioExceptionType.connectionError:
        case DioExceptionType.unknown:
          responseModel.isNotConected = true;
          responseModel.data = ApiHelpers.messageTag(err.response?.data, 'Sem conexão com a internet.');
          break;
        default:
          responseModel.data = ApiHelpers.messageTag(err.response?.data, 'Erro. Tente novamente.');
      }
    }
    return responseModel;
  }
}
```

---

## services/middlewares/auth_middleware.dart

```dart
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:localstorage/localstorage.dart';
import 'package:{{APP_NAME}}/src/router.dart';

bool isUnauthorized(int? statusCode) => statusCode == 401 || statusCode == 403;

bool isLoggedIn() => localStorage.getItem('token') != null;

class AuthMiddlewareRequired extends InterceptorsWrapper {
  @override
  Future<void> onRequest(RequestOptions options, RequestInterceptorHandler handler) async {
    final token = localStorage.getItem('token');
    if (token != null) options.headers['Authorization'] = 'Bearer $token';
    return handler.next(options);
  }

  @override
  Future<void> onError(DioException err, ErrorInterceptorHandler handler) async {
    if (err.type == DioExceptionType.badResponse && isUnauthorized(err.response?.statusCode)) {
      localStorage.removeItem('token');
      routeNotifier.notify();
    }
    super.onError(err, handler);
  }
}
```

---

## services/middlewares/cookies.dart

```dart
import 'package:cookie_jar/cookie_jar.dart';
import 'package:dio/dio.dart';

class CookieManager extends Interceptor {
  final CookieJar cookieJar;
  CookieManager(this.cookieJar);

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    cookieJar.loadForRequest(options.uri).then((cookies) {
      final cookie = cookies.map((c) => '${c.name}=${c.value}').join('; ');
      if (cookie.isNotEmpty) options.headers['cookie'] = cookie;
      handler.next(options);
    }).catchError((e, _) => handler.reject(DioException(requestOptions: options, error: e), true));
  }

  @override
  void onResponse(Response response, ResponseInterceptorHandler handler) {
    _saveCookies(response).then((_) => handler.next(response)).catchError(
        (e, _) => handler.reject(DioException(requestOptions: response.requestOptions, error: e), true));
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    if (err.response != null) {
      _saveCookies(err.response!).then((_) => handler.next(err)).catchError((e, _) => handler.next(err));
    } else {
      handler.next(err);
    }
  }

  Future<void> _saveCookies(Response response) async {
    final cookies = response.headers['set-cookie'];
    if (cookies != null) {
      await cookieJar.saveFromResponse(
        response.requestOptions.uri,
        cookies.map((str) => Cookie.fromSetCookieValue(str)).toList(),
      );
    }
  }
}
```

---

## services/middlewares/error_middleware.dart

```dart
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:talker_dio_logger/talker_dio_logger_interceptor.dart';
import 'package:{{APP_NAME}}/services/api_services.dart';
import 'package:{{APP_NAME}}/src/router.dart';

class CustomErrorMiddleware extends InterceptorsWrapper {
  bool _isDialogOpen = false;

  String _getErrorTitle(DioExceptionType type) {
    switch (type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.receiveTimeout:
      case DioExceptionType.sendTimeout:
        return 'Tempo de conexão esgotado';
      case DioExceptionType.badCertificate:
        return 'Falha de segurança';
      case DioExceptionType.cancel:
        return 'Requisição cancelada';
      case DioExceptionType.badResponse:
        return 'Erro ao processar a requisição';
      case DioExceptionType.connectionError:
      case DioExceptionType.unknown:
        return 'Sem conexão com o servidor';
    }
  }

  String _getErrorDescription(DioExceptionType type) {
    switch (type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.receiveTimeout:
      case DioExceptionType.sendTimeout:
        return 'A conexão demorou demais. Verifique sua internet e tente novamente.';
      case DioExceptionType.badCertificate:
        return 'Problema ao validar o certificado. Tente novamente mais tarde.';
      case DioExceptionType.cancel:
        return 'A requisição foi cancelada.';
      case DioExceptionType.badResponse:
        return 'O servidor retornou uma resposta inesperada. Tente novamente.';
      case DioExceptionType.connectionError:
      case DioExceptionType.unknown:
        return 'Verifique sua conexão com a internet e tente novamente.';
    }
  }

  @override
  Future<void> onRequest(RequestOptions options, RequestInterceptorHandler handler) async {
    _isDialogOpen = false;
    options.connectTimeout = const Duration(seconds: 60);
    options.receiveTimeout = const Duration(seconds: 60);
    options.sendTimeout = const Duration(seconds: 60);
    return handler.next(options);
  }

  @override
  Future<void> onError(DioException err, ErrorInterceptorHandler handler) async {
    final isConnectionError = [
      DioExceptionType.connectionTimeout,
      DioExceptionType.receiveTimeout,
      DioExceptionType.sendTimeout,
      DioExceptionType.connectionError,
      DioExceptionType.unknown,
    ].contains(err.type);

    if (isConnectionError && !_isDialogOpen) {
      _isDialogOpen = true;
      final context = rootNavigatorKey.currentState?.overlay?.context;

      if (context != null && context.mounted) {
        showDialog(
          context: context,
          barrierDismissible: false,
          builder: (_) => AlertDialog(
            backgroundColor: Colors.white,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(5)),
            content: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(100),
                    color: Colors.redAccent.withOpacity(0.5),
                  ),
                  child: const Icon(Icons.wifi_off_rounded, size: 25),
                ),
                const SizedBox(height: 10),
                Text(_getErrorTitle(err.type), style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16), textAlign: TextAlign.center),
                const SizedBox(height: 5),
                Text(_getErrorDescription(err.type), style: const TextStyle(fontSize: 14, height: 1.5), textAlign: TextAlign.center),
                const SizedBox(height: 10),
                ElevatedButton(
                  onPressed: () async {
                    try {
                      final dioRetry = Dio(BaseOptions(
                        baseUrl: err.requestOptions.baseUrl,
                        connectTimeout: err.requestOptions.connectTimeout,
                        receiveTimeout: err.requestOptions.receiveTimeout,
                        headers: err.requestOptions.headers,
                      ));
                      dioRetry.interceptors.add(TalkerDioLogger(settings: talker));
                      final retryResponse = await dioRetry.request(
                        err.requestOptions.path,
                        data: err.requestOptions.data,
                        queryParameters: err.requestOptions.queryParameters,
                        options: Options(
                          method: err.requestOptions.method,
                          responseType: err.requestOptions.responseType,
                          contentType: err.requestOptions.contentType,
                          followRedirects: err.requestOptions.followRedirects,
                          validateStatus: err.requestOptions.validateStatus,
                        ),
                      );
                      if (rootNavigatorKey.currentState?.canPop() ?? false) rootNavigatorKey.currentState?.pop();
                      _isDialogOpen = false;
                      handler.resolve(retryResponse);
                    } catch (_) {
                      if (rootNavigatorKey.currentState?.canPop() ?? false) rootNavigatorKey.currentState?.pop();
                      _isDialogOpen = false;
                      handler.next(err);
                    }
                  },
                  child: const Text('Tentar novamente'),
                ),
              ],
            ),
          ),
        );
      } else {
        _isDialogOpen = false;
        handler.next(err);
      }
      return;
    }
    return super.onError(err, handler);
  }
}
```

---

## src/shared/utils/app_directory.dart

```dart
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:path_provider/path_provider.dart';

class Appdirctory {
  final String pathDir;
  Appdirctory(this.pathDir);

  Future<String> getDirectory({bool localPath = true}) async {
    if (kIsWeb) return '';
    Directory? appDocDir = await getApplicationDocumentsDirectory();
    if (Platform.isAndroid && localPath) appDocDir = await getExternalStorageDirectory();
    final dir = Directory('${appDocDir?.path}/$pathDir/');
    return (await dir.exists()) ? dir.path : (await dir.create(recursive: true)).path;
  }
}
```

---

## src/shared/utils/app_utils.dart

```dart
class AppUtils {
  static String formatarTelefone(String telefone) => telefone.replaceAll(RegExp(r'[^0-9]'), '');
  static String removerCaracteresEspeciais(String texto) => texto.replaceAll(RegExp(r'[^0-9]'), '');
}
```

---

## src/theme/app_colors.dart

```dart
import 'package:flutter/material.dart';

class AppColorsLight {
  static const Color primary = Color(0xff102949);
  static const Color secondary = Color(0xffF98927);
  static const Color tertiary = Color(0xffF3D4BA);
  static const Color background = Color(0xffffffff);
  static const Color scaffoldBackground = Color(0xffF5F8FA);
  static const Color textPrimary = Color(0xff111827);
  static const Color textSecondary = Color(0xff263238);
  static const Color textTertiary = Color(0xff6C6C84);
  static const Color textQuaternary = Color(0xffA1A5B7);
  static const Color textDisabled = Color(0xffC5CAD3);
  static const Color surface = Color(0xffF9F9F9);
  static const Color surfaceVariant = Color(0xffF5F8FA);
  static const Color surfaceDisabled = Color(0xffD9D9D9);
  static const Color surfaceBorder = Color(0xffF4F4F4);
  static const Color surfaceDivider = Color(0xffE3E5EB);
  static const Color info = Color(0xff0358F1);
  static const Color error = Color(0xffF53D6B);
  static const Color success = Color(0xff2DCA72);
  static const Color warning = Color(0xffF79E1E);
  static Color get border => textQuaternary.withValues(alpha: 0.4);
  static const Color grey = Color(0xffE3E5EB);
}

class AppColorsDark {
  static const Color primary = Color(0xff4A90E2);
  static const Color secondary = Color(0xffFFB347);
  static const Color tertiary = Color(0xff5A4A3A);
  static const Color background = Color(0xff121212);
  static const Color scaffoldBackground = Color(0xff0D0D0D);
  static const Color textPrimary = Color(0xffFFFFFF);
  static const Color textSecondary = Color(0xffE0E0E0);
  static const Color textTertiary = Color(0xffB0B0B0);
  static const Color textQuaternary = Color(0xff808080);
  static const Color textDisabled = Color(0xff606060);
  static const Color surface = Color(0xff1E1E1E);
  static const Color surfaceVariant = Color(0xff2A2A2A);
  static const Color surfaceDisabled = Color(0xff3A3A3A);
  static const Color surfaceBorder = Color(0xff333333);
  static const Color surfaceDivider = Color(0xff404040);
  static const Color info = Color(0xff4A9EFF);
  static const Color error = Color(0xffFF6B8A);
  static const Color success = Color(0xff4CD964);
  static const Color warning = Color(0xffFFB347);
  static Color get border => surfaceBorder;
  static const Color grey = Color(0xff404040);
}

extension AppColorsExtension on BuildContext {
  bool get isDarkMode => Theme.of(this).brightness == Brightness.dark;
  Color get primaryColor => isDarkMode ? AppColorsDark.primary : AppColorsLight.primary;
  Color get secondaryColor => isDarkMode ? AppColorsDark.secondary : AppColorsLight.secondary;
  Color get backgroundColor => isDarkMode ? AppColorsDark.background : AppColorsLight.background;
  Color get scaffoldBackgroundColor => isDarkMode ? AppColorsDark.scaffoldBackground : AppColorsLight.scaffoldBackground;
  Color get textPrimaryColor => isDarkMode ? AppColorsDark.textPrimary : AppColorsLight.textPrimary;
  Color get textSecondaryColor => isDarkMode ? AppColorsDark.textSecondary : AppColorsLight.textSecondary;
  Color get borderColor => isDarkMode ? AppColorsDark.border : AppColorsLight.border;
  Color get surfaceColor => isDarkMode ? AppColorsDark.surface : AppColorsLight.surface;
}
```

---

## src/theme/app_spacing.dart

```dart
class AppSpacing {
  static const double space5 = 5;
  static const double space10 = 10;
  static const double space15 = 15;
  static const double space18 = 18;
  static const double space20 = 20;
  static const double space25 = 25;
  static const double space30 = 30;
  static const double horizontalSpaces = 15;
}

class AppRadius {
  static const double small = 4;
  static const double medium = 5;
  static const double large = 8;
  static const double xLarge = 12;
  static const double circular = 999;
}
```

---

## src/theme/app_radius.dart

```dart
class AppRadius {
  static const double extraSmall = 4.0;
  static const double small = 8.0;
  static const double medium = 12.0;
  static const double large = 16.0;
  static const double extraLarge = 24.0;
  static const double full = 999.0;
}
```

---

## src/theme/app_text_styles.dart

```dart
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'app_colors.dart';

class AppFontSizes {
  static const double displayLarge = 96, displayMedium = 60, displaySmall = 48;
  static const double headlineLarge = 44, headlineMedium = 34, headlineSmall = 24;
  static const double titleLarge = 20, titleMedium = 16, titleSmall = 14;
  static const double bodyLarge = 16, bodyMedium = 13, bodySmall = 12;
  static const double labelLarge = 14, labelMedium = 12, labelSmall = 10;
}

class AppTextStylesLight {
  static TextTheme get textTheme => TextTheme(
    displayLarge: GoogleFonts.inter(fontSize: AppFontSizes.displayLarge, fontWeight: FontWeight.w300, color: AppColorsLight.textPrimary),
    displayMedium: GoogleFonts.inter(fontSize: AppFontSizes.displayMedium, fontWeight: FontWeight.w300, color: AppColorsLight.textPrimary),
    displaySmall: GoogleFonts.inter(fontSize: AppFontSizes.displaySmall, fontWeight: FontWeight.w400, color: AppColorsLight.textPrimary),
    headlineLarge: GoogleFonts.inter(fontSize: AppFontSizes.headlineLarge, fontWeight: FontWeight.w400, color: AppColorsLight.textPrimary),
    headlineMedium: GoogleFonts.inter(fontSize: AppFontSizes.headlineMedium, fontWeight: FontWeight.w400, color: AppColorsLight.textPrimary),
    headlineSmall: GoogleFonts.inter(fontSize: AppFontSizes.headlineSmall, fontWeight: FontWeight.w400, color: AppColorsLight.textPrimary),
    titleLarge: GoogleFonts.inter(fontSize: AppFontSizes.titleLarge, fontWeight: FontWeight.w500, color: AppColorsLight.textPrimary),
    titleMedium: GoogleFonts.inter(fontSize: AppFontSizes.titleMedium, fontWeight: FontWeight.w400, color: AppColorsLight.textPrimary),
    titleSmall: GoogleFonts.inter(fontSize: AppFontSizes.titleSmall, fontWeight: FontWeight.w400, color: AppColorsLight.textPrimary),
    bodyLarge: GoogleFonts.inter(fontSize: AppFontSizes.bodyLarge, fontWeight: FontWeight.w400, color: AppColorsLight.textPrimary),
    bodyMedium: GoogleFonts.inter(fontSize: AppFontSizes.bodyMedium, fontWeight: FontWeight.w400, color: AppColorsLight.textPrimary),
    bodySmall: GoogleFonts.inter(fontSize: AppFontSizes.bodySmall, fontWeight: FontWeight.w400, color: AppColorsLight.textPrimary),
    labelLarge: GoogleFonts.inter(fontSize: AppFontSizes.labelLarge, fontWeight: FontWeight.w600, color: AppColorsLight.textPrimary),
    labelMedium: GoogleFonts.inter(fontSize: AppFontSizes.labelMedium, fontWeight: FontWeight.w500, color: AppColorsLight.textPrimary),
    labelSmall: GoogleFonts.inter(fontSize: AppFontSizes.labelSmall, fontWeight: FontWeight.w400, color: AppColorsLight.textPrimary),
  );
}

class AppTextStylesDark {
  static TextTheme get textTheme => TextTheme(
    displayLarge: GoogleFonts.inter(fontSize: AppFontSizes.displayLarge, fontWeight: FontWeight.w300, color: AppColorsDark.textPrimary),
    displayMedium: GoogleFonts.inter(fontSize: AppFontSizes.displayMedium, fontWeight: FontWeight.w300, color: AppColorsDark.textPrimary),
    displaySmall: GoogleFonts.inter(fontSize: AppFontSizes.displaySmall, fontWeight: FontWeight.w400, color: AppColorsDark.textPrimary),
    headlineLarge: GoogleFonts.inter(fontSize: AppFontSizes.headlineLarge, fontWeight: FontWeight.w400, color: AppColorsDark.textPrimary),
    headlineMedium: GoogleFonts.inter(fontSize: AppFontSizes.headlineMedium, fontWeight: FontWeight.w400, color: AppColorsDark.textPrimary),
    headlineSmall: GoogleFonts.inter(fontSize: AppFontSizes.headlineSmall, fontWeight: FontWeight.w400, color: AppColorsDark.textPrimary),
    titleLarge: GoogleFonts.inter(fontSize: AppFontSizes.titleLarge, fontWeight: FontWeight.w500, color: AppColorsDark.textPrimary),
    titleMedium: GoogleFonts.inter(fontSize: AppFontSizes.titleMedium, fontWeight: FontWeight.w400, color: AppColorsDark.textPrimary),
    titleSmall: GoogleFonts.inter(fontSize: AppFontSizes.titleSmall, fontWeight: FontWeight.w400, color: AppColorsDark.textPrimary),
    bodyLarge: GoogleFonts.inter(fontSize: AppFontSizes.bodyLarge, fontWeight: FontWeight.w400, color: AppColorsDark.textPrimary),
    bodyMedium: GoogleFonts.inter(fontSize: AppFontSizes.bodyMedium, fontWeight: FontWeight.w400, color: AppColorsDark.textPrimary),
    bodySmall: GoogleFonts.inter(fontSize: AppFontSizes.bodySmall, fontWeight: FontWeight.w400, color: AppColorsDark.textPrimary),
    labelLarge: GoogleFonts.inter(fontSize: AppFontSizes.labelLarge, fontWeight: FontWeight.w600, color: AppColorsDark.textPrimary),
    labelMedium: GoogleFonts.inter(fontSize: AppFontSizes.labelMedium, fontWeight: FontWeight.w500, color: AppColorsDark.textPrimary),
    labelSmall: GoogleFonts.inter(fontSize: AppFontSizes.labelSmall, fontWeight: FontWeight.w400, color: AppColorsDark.textPrimary),
  );
}
```

---

## src/theme/app_theme.dart

```dart
import 'package:flutter/material.dart';
import 'app_colors.dart';
import 'app_text_styles.dart';
import 'app_spacing.dart';

MaterialColor createMaterialColor(Color color) {
  final strengths = <double>[.05, .1, .2, .3, .4, .5, .6, .7, .8, .9];
  final swatch = <int, Color>{};
  final r = color.red, g = color.green, b = color.blue;
  for (var i = 0; i < 10; i++) {
    final ds = 0.5 - (i * 0.1);
    swatch[(strengths[i] * 1000).round()] = Color.fromRGBO(
      r + ((ds < 0 ? r : (255 - r)) * ds).round(),
      g + ((ds < 0 ? g : (255 - g)) * ds).round(),
      b + ((ds < 0 ? b : (255 - b)) * ds).round(),
      1,
    );
  }
  return MaterialColor(color.value, swatch);
}

class AppTheme {
  static ThemeData get lightTheme => ThemeData(
    useMaterial3: false,
    brightness: Brightness.light,
    primarySwatch: createMaterialColor(AppColorsLight.primary),
    primaryColor: AppColorsLight.primary,
    scaffoldBackgroundColor: AppColorsLight.scaffoldBackground,
    visualDensity: VisualDensity.adaptivePlatformDensity,
    colorScheme: const ColorScheme.light(
      primary: AppColorsLight.primary,
      onPrimary: Colors.white,
      secondary: AppColorsLight.secondary,
      onSecondary: Colors.white,
      tertiary: AppColorsLight.tertiary,
      onTertiary: AppColorsLight.textPrimary,
      error: AppColorsLight.error,
      onError: Colors.white,
      surface: AppColorsLight.surface,
      onSurface: AppColorsLight.textPrimary,
      surfaceContainerHighest: AppColorsLight.surfaceVariant,
      onSurfaceVariant: AppColorsLight.textSecondary,
    ),
    textTheme: AppTextStylesLight.textTheme,
    appBarTheme: AppBarTheme(
      backgroundColor: AppColorsLight.background,
      foregroundColor: AppColorsLight.textPrimary,
      elevation: 0,
      centerTitle: false,
      iconTheme: const IconThemeData(color: AppColorsLight.textPrimary),
      titleTextStyle: AppTextStylesLight.textTheme.titleLarge?.copyWith(color: AppColorsLight.textPrimary, fontWeight: FontWeight.w600),
    ),
    cardTheme: CardThemeData(
      color: AppColorsLight.background,
      elevation: 0,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.medium), side: BorderSide(color: AppColorsLight.border, width: 1)),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: AppColorsLight.background,
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(AppRadius.medium), borderSide: BorderSide(color: AppColorsLight.border)),
      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(AppRadius.medium), borderSide: BorderSide(color: AppColorsLight.border)),
      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(AppRadius.medium), borderSide: const BorderSide(color: AppColorsLight.primary, width: 2)),
      errorBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(AppRadius.medium), borderSide: const BorderSide(color: AppColorsLight.error)),
      contentPadding: const EdgeInsets.symmetric(horizontal: AppSpacing.space15, vertical: AppSpacing.space15),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: AppColorsLight.primary,
        foregroundColor: Colors.white,
        elevation: 0,
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.space20, vertical: AppSpacing.space15),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.medium)),
        textStyle: AppTextStylesLight.textTheme.labelLarge,
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: AppColorsLight.primary,
        side: const BorderSide(color: AppColorsLight.primary),
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.space20, vertical: AppSpacing.space15),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.medium)),
        textStyle: AppTextStylesLight.textTheme.labelLarge,
      ),
    ),
    textButtonTheme: TextButtonThemeData(
      style: TextButton.styleFrom(
        foregroundColor: AppColorsLight.primary,
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.space15, vertical: AppSpacing.space10),
        textStyle: AppTextStylesLight.textTheme.labelLarge,
      ),
    ),
    bottomNavigationBarTheme: BottomNavigationBarThemeData(
      backgroundColor: AppColorsLight.surface,
      selectedItemColor: AppColorsLight.primary,
      unselectedItemColor: AppColorsLight.textQuaternary,
      selectedLabelStyle: AppTextStylesLight.textTheme.bodySmall,
      unselectedLabelStyle: AppTextStylesLight.textTheme.bodySmall,
      type: BottomNavigationBarType.fixed,
      elevation: 2,
    ),
    splashColor: Colors.transparent,
    highlightColor: Colors.transparent,
    hoverColor: Colors.transparent,
  );

  static ThemeData get darkTheme => ThemeData(
    useMaterial3: false,
    brightness: Brightness.dark,
    primarySwatch: createMaterialColor(AppColorsDark.primary),
    primaryColor: AppColorsDark.primary,
    scaffoldBackgroundColor: AppColorsDark.scaffoldBackground,
    visualDensity: VisualDensity.adaptivePlatformDensity,
    colorScheme: const ColorScheme.dark(
      primary: AppColorsDark.primary,
      onPrimary: Colors.white,
      secondary: AppColorsDark.secondary,
      onSecondary: Colors.white,
      tertiary: AppColorsDark.tertiary,
      onTertiary: AppColorsDark.textPrimary,
      error: AppColorsDark.error,
      onError: Colors.white,
      surface: AppColorsDark.surface,
      onSurface: AppColorsDark.textPrimary,
      surfaceContainerHighest: AppColorsDark.surfaceVariant,
      onSurfaceVariant: AppColorsDark.textSecondary,
    ),
    textTheme: AppTextStylesDark.textTheme,
    appBarTheme: AppBarTheme(
      backgroundColor: AppColorsDark.background,
      foregroundColor: AppColorsDark.textPrimary,
      elevation: 0,
      centerTitle: false,
      iconTheme: const IconThemeData(color: AppColorsDark.textPrimary),
      titleTextStyle: AppTextStylesDark.textTheme.titleLarge?.copyWith(color: AppColorsDark.textPrimary, fontWeight: FontWeight.w600),
    ),
    cardTheme: CardThemeData(
      color: AppColorsDark.surface,
      elevation: 0,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.medium), side: BorderSide(color: AppColorsDark.border, width: 1)),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: AppColorsDark.surface,
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(AppRadius.medium), borderSide: BorderSide(color: AppColorsDark.border)),
      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(AppRadius.medium), borderSide: BorderSide(color: AppColorsDark.border)),
      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(AppRadius.medium), borderSide: const BorderSide(color: AppColorsDark.primary, width: 2)),
      errorBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(AppRadius.medium), borderSide: const BorderSide(color: AppColorsDark.error)),
      contentPadding: const EdgeInsets.symmetric(horizontal: AppSpacing.space15, vertical: AppSpacing.space15),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: AppColorsDark.primary,
        foregroundColor: Colors.white,
        elevation: 0,
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.space20, vertical: AppSpacing.space15),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.medium)),
        textStyle: AppTextStylesDark.textTheme.labelLarge,
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: AppColorsDark.primary,
        side: const BorderSide(color: AppColorsDark.primary),
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.space20, vertical: AppSpacing.space15),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.medium)),
        textStyle: AppTextStylesDark.textTheme.labelLarge,
      ),
    ),
    textButtonTheme: TextButtonThemeData(
      style: TextButton.styleFrom(
        foregroundColor: AppColorsDark.primary,
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.space15, vertical: AppSpacing.space10),
        textStyle: AppTextStylesDark.textTheme.labelLarge,
      ),
    ),
    bottomNavigationBarTheme: BottomNavigationBarThemeData(
      backgroundColor: AppColorsDark.surface,
      selectedItemColor: AppColorsDark.primary,
      unselectedItemColor: AppColorsDark.textQuaternary,
      selectedLabelStyle: AppTextStylesDark.textTheme.bodySmall,
      unselectedLabelStyle: AppTextStylesDark.textTheme.bodySmall,
      type: BottomNavigationBarType.fixed,
      elevation: 2,
    ),
    splashColor: Colors.transparent,
    highlightColor: Colors.transparent,
    hoverColor: Colors.transparent,
  );
}
```

---

## src/theme/theme_provider.dart

```dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:localstorage/localstorage.dart';

enum AppThemeMode { light, dark, system }

class ThemeNotifier extends StateNotifier<AppThemeMode> {
  final LocalStorage _storage;
  static const String _storageKey = 'theme_mode';

  ThemeNotifier(this._storage) : super(AppThemeMode.system) {
    _loadTheme();
  }

  Future<void> _loadTheme() async {
    try {
      final savedTheme = _storage.getItem(_storageKey);
      if (savedTheme != null) {
        state = AppThemeMode.values.firstWhere((mode) => mode.toString() == savedTheme, orElse: () => AppThemeMode.system);
      }
    } catch (_) {
      state = AppThemeMode.system;
    }
  }

  Future<void> setTheme(AppThemeMode mode) async {
    state = mode;
    try {
      _storage.setItem(_storageKey, mode.toString());
    } catch (_) {}
  }

  Future<void> toggleTheme() async {
    if (state == AppThemeMode.light) await setTheme(AppThemeMode.dark);
    else if (state == AppThemeMode.dark) await setTheme(AppThemeMode.light);
    else await setTheme(AppThemeMode.dark);
  }
}

final localStorageProvider = Provider<LocalStorage>((ref) {
  throw UnimplementedError('LocalStorage deve ser fornecido via override');
});

final themeProvider = StateNotifierProvider<ThemeNotifier, AppThemeMode>((ref) {
  return ThemeNotifier(ref.watch(localStorageProvider));
});

final flutterThemeModeProvider = Provider<ThemeMode>((ref) {
  switch (ref.watch(themeProvider)) {
    case AppThemeMode.light: return ThemeMode.light;
    case AppThemeMode.dark: return ThemeMode.dark;
    case AppThemeMode.system: return ThemeMode.system;
  }
});
```

---

## src/theme/theme.dart

```dart
library;
export 'app_colors.dart';
export 'app_text_styles.dart';
export 'app_spacing.dart';
export 'app_theme.dart';
export 'theme_provider.dart';
```

---

## src/app/{{app_name}}_app.dart

```dart
import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:{{APP_NAME}}/services/navigator_service.dart';
import 'package:{{APP_NAME}}/src/theme/app_theme.dart';
import 'package:{{APP_NAME}}/src/theme/theme_provider.dart';
import 'package:toastification/toastification.dart';

class {{AppName}}App extends ConsumerWidget {
  const {{AppName}}App({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final themeMode = ref.watch(flutterThemeModeProvider);
    return MaterialApp.router(
      supportedLocales: const [Locale('pt', 'BR')],
      localizationsDelegates: const [
        GlobalMaterialLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
      ],
      debugShowCheckedModeBanner: false,
      title: 'App',
      scrollBehavior: MyCustomScrollBehavior(),
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: themeMode,
      routerConfig: NavigatorService().router,
      builder: (context, child) => MediaQuery(
        data: MediaQuery.of(context).copyWith(textScaler: const TextScaler.linear(1.0)),
        child: ToastificationWrapper(child: child ?? const SizedBox.shrink()),
      ),
    );
  }
}

class MyCustomScrollBehavior extends MaterialScrollBehavior {
  @override
  Set<PointerDeviceKind> get dragDevices => {PointerDeviceKind.touch, PointerDeviceKind.mouse, PointerDeviceKind.trackpad};
}
```

---

## src/router.dart

```dart
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:{{APP_NAME}}/services/navigator_service.dart';
import 'package:{{APP_NAME}}/src/app/base/screens/base_dash.dart';
import 'package:{{APP_NAME}}/src/app/auth/screens/login_screen.dart';
import 'package:{{APP_NAME}}/src/app/home/screens/home_screen.dart';
import 'package:{{APP_NAME}}/src/app/home/screens/home_perfil_screen.dart';
import 'package:{{APP_NAME}}/src/app/imoveis/screens/imoveis_screen.dart';
import 'package:{{APP_NAME}}/src/app/perfil/screens/perfil_screen.dart';
import 'package:{{APP_NAME}}/src/app/splash/screens/splash_screen.dart';

final GlobalKey<NavigatorState> rootNavigatorKey = GlobalKey<NavigatorState>(debugLabel: 'root');
final GlobalKey<NavigatorState> _shellNavigatorKey = GlobalKey<NavigatorState>(debugLabel: 'shell');
final routeNotifier = RouteNotifier();

final GoRouter appRouter = GoRouter(
  initialLocation: SplashScreen.path,
  navigatorKey: rootNavigatorKey,
  refreshListenable: routeNotifier,
  debugLogDiagnostics: true,
  redirect: (context, state) async => null,
  routes: [
    GoRoute(path: SplashScreen.path, builder: (_, state) => const SplashScreen()),
    GoRoute(path: LoginScreen.path, builder: (_, state) => const LoginScreen()),
    ShellRoute(
      navigatorKey: _shellNavigatorKey,
      builder: (context, state, child) => BaseDash(child: child),
      routes: [
        GoRoute(path: HomeScreen.path, pageBuilder: (_, state) => _transition(state.pageKey, const HomeScreen())),
        GoRoute(path: HomePerfilScreen.path, pageBuilder: (_, state) => _transition(state.pageKey, const HomePerfilScreen())),
        GoRoute(path: ImoveisScreen.path, pageBuilder: (_, state) => _transition(state.pageKey, const ImoveisScreen())),
        GoRoute(path: PerfilScreen.path, pageBuilder: (_, state) => _transition(state.pageKey, const PerfilScreen())),
      ],
    ),
  ],
);

CustomTransitionPage _transition(LocalKey key, Widget child) => CustomTransitionPage(
  key: key,
  child: child,
  transitionsBuilder: (context, animation, _, child) => FadeTransition(
    opacity: CurveTween(curve: Curves.linear).animate(animation),
    child: child,
  ),
);
```

---

## src/app/base/screens/base_dash.dart

```dart
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:{{APP_NAME}}/src/app/home/screens/home_screen.dart';
import 'package:{{APP_NAME}}/src/app/imoveis/screens/imoveis_screen.dart';
import 'package:{{APP_NAME}}/src/app/perfil/screens/perfil_screen.dart';

class BaseDash extends ConsumerStatefulWidget {
  final Widget child;
  const BaseDash({super.key, required this.child});

  @override
  ConsumerState<BaseDash> createState() => _BaseDashState();
}

class _BaseDashState extends ConsumerState<BaseDash> {
  @override
  Widget build(BuildContext context) {
    final items = [
      const BottomNavigationBarItem(icon: Icon(Icons.home), label: 'Home'),
      const BottomNavigationBarItem(icon: Icon(Icons.list), label: 'Lista'),
      const BottomNavigationBarItem(icon: Icon(Icons.person), label: 'Perfil'),
    ];

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.dark,
      child: Material(
        child: Scaffold(
          backgroundColor: const Color(0xFFF6F6F7),
          body: Theme(
            data: Theme.of(context).copyWith(highlightColor: Colors.transparent, splashColor: Colors.transparent),
            child: SafeArea(top: false, bottom: false, child: widget.child),
          ),
          bottomNavigationBar: BottomNavigationBar(
            items: items,
            currentIndex: _calculateSelectedIndex(context),
            onTap: (idx) => _onItemTapped(idx, context),
          ),
        ),
      ),
    );
  }

  static int _calculateSelectedIndex(BuildContext context) {
    final location = GoRouterState.of(context).uri.toString();
    if (location.startsWith(HomeScreen.path)) return 0;
    if (location.startsWith(ImoveisScreen.path)) return 1;
    if (location.startsWith(PerfilScreen.path)) return 2;
    return 0;
  }

  void _onItemTapped(int index, BuildContext context) {
    switch (index) {
      case 0: GoRouter.of(context).go(HomeScreen.path);
      case 1: GoRouter.of(context).go(ImoveisScreen.path);
      case 2: GoRouter.of(context).go(PerfilScreen.path);
    }
  }
}
```

---

## src/app/splash/screens/splash_screen.dart

```dart
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:{{APP_NAME}}/src/app/home/screens/home_screen.dart';

class SplashScreen extends StatelessWidget {
  const SplashScreen({super.key});
  static const String path = '/';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: FutureBuilder<void>(
        future: Future<void>.delayed(const Duration(milliseconds: 1200)),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.done) context.go(HomeScreen.path);
          return const Center(child: CircularProgressIndicator());
        },
      ),
    );
  }
}
```

---

## src/app/auth/screens/login_screen.dart

```dart
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:{{APP_NAME}}/src/app/home/screens/home_screen.dart';

class LoginScreen extends StatelessWidget {
  const LoginScreen({super.key});
  static const String path = '/login';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Login'), centerTitle: true),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const SizedBox(height: 32),
            const TextField(
              decoration: InputDecoration(labelText: 'E-mail', border: OutlineInputBorder()),
              keyboardType: TextInputType.emailAddress,
            ),
            const SizedBox(height: 16),
            const TextField(
              decoration: InputDecoration(labelText: 'Senha', border: OutlineInputBorder()),
              obscureText: true,
            ),
            const SizedBox(height: 24),
            SizedBox(
              height: 48,
              child: ElevatedButton(
                onPressed: () => context.go(HomeScreen.path),
                child: const Text('Entrar'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
```

---

## src/app/home/screens/home_screen.dart

```dart
import 'package:flutter/material.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});
  static const String path = '/home';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Início'), centerTitle: true),
      body: const Center(child: Text('Home')),
    );
  }
}
```

---

## src/app/home/screens/home_perfil_screen.dart

```dart
import 'package:flutter/material.dart';

class HomePerfilScreen extends StatelessWidget {
  const HomePerfilScreen({super.key});
  static const String path = '/home-perfil';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Perfil'), centerTitle: true),
      body: const Center(child: Text('Home Perfil')),
    );
  }
}
```

---

## src/app/imoveis/screens/imoveis_screen.dart

```dart
import 'package:flutter/material.dart';

class ImoveisScreen extends StatelessWidget {
  const ImoveisScreen({super.key});
  static const String path = '/imoveis';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Lista'), centerTitle: true),
      body: const Center(child: Text('Lista')),
    );
  }
}
```

---

## src/app/perfil/screens/perfil_screen.dart

```dart
import 'package:flutter/material.dart';

class PerfilScreen extends StatelessWidget {
  const PerfilScreen({super.key});
  static const String path = '/perfil';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Perfil'), centerTitle: true),
      body: const Center(child: Text('Perfil')),
    );
  }
}
```
