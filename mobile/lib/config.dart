import 'dart:io';

const String appName = 'Fazbrike';
const String productionApiUrl = String.fromEnvironment('API_BASE_URL');

class Config {
  const Config._();

  static String get apiBaseUrl {
    if (productionApiUrl.isNotEmpty) {
      return productionApiUrl.replaceFirst(RegExp(r'/+$'), '');
    }
    if (Platform.isAndroid) return 'http://10.0.2.2:8080/api';
    return 'http://127.0.0.1:8080/api';
  }

  static String get serverBaseUrl =>
      apiBaseUrl.replaceFirst(RegExp(r'/api/?$'), '');
}
