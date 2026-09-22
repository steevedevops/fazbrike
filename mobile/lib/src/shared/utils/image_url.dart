import 'package:fazbrike/config.dart';

String? resolveImageUrl(String? raw) {
  final value = raw?.trim() ?? '';
  if (value.isEmpty) return null;
  final uri = Uri.tryParse(value);
  if (uri != null && (uri.scheme == 'http' || uri.scheme == 'https')) return value;
  if (value.startsWith('/api/uploads/')) return '${Config.serverBaseUrl}$value';
  if (value.startsWith('/uploads/')) return '${Config.serverBaseUrl}/api$value';
  return '${Config.serverBaseUrl}${value.startsWith('/') ? '' : '/'}$value';
}
