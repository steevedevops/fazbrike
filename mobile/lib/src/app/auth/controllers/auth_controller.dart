import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:fazbrike/services/api_services.dart';
import 'package:fazbrike/services/secure_storage_service.dart';
import 'package:fazbrike/services/session_signal.dart';
import 'package:fazbrike/src/app/auth/models/user_model.dart';
import 'package:fazbrike/src/shared/utils/json_utils.dart';

final authSessionProvider =
    StateNotifierProvider<AuthSessionNotifier, AsyncValue<UserModel?>>((ref) {
  return AuthSessionNotifier(ref);
});

class AuthSessionNotifier extends StateNotifier<AsyncValue<UserModel?>> {
  AuthSessionNotifier(this.ref) : super(const AsyncValue.loading()) {
    restore();
  }

  final Ref ref;

  Future<void> restore() async {
    final storage = ref.read(secureStorageProvider);
    final token = await storage.readToken();
    if (token == null || token.isEmpty) {
      state = const AsyncValue.data(null);
      sessionSignal.value = SessionStatus.unauthenticated;
      return;
    }
    try {
      final response = await ref.read(apiServicesProvider).get('/auth/me');
      state = AsyncValue.data(UserModel.fromJson(asMap(response.data)));
      sessionSignal.value = SessionStatus.authenticated;
    } catch (error, stack) {
      await storage.deleteToken();
      state = AsyncValue.error(error, stack);
      state = const AsyncValue.data(null);
      sessionSignal.value = SessionStatus.unauthenticated;
    }
  }

  void setAuthenticated(UserModel user) {
    state = AsyncValue.data(user);
    sessionSignal.value = SessionStatus.authenticated;
  }

  Future<void> logout() async {
    await ref.read(secureStorageProvider).deleteToken();
    state = const AsyncValue.data(null);
    sessionSignal.value = SessionStatus.unauthenticated;
  }
}

final authFormProvider =
    StateNotifierProvider<AuthFormNotifier, AsyncValue<String>>((ref) {
  return AuthFormNotifier(ref);
});

class AuthFormNotifier extends StateNotifier<AsyncValue<String>> {
  AuthFormNotifier(this.ref) : super(const AsyncValue.data(''));
  final Ref ref;

  Future<void> login(String email, String password) async {
    state = const AsyncValue.loading();
    try {
      final response = await ref.read(apiServicesProvider).post(
        '/auth/login',
        data: {'email': email.trim(), 'password': password},
      );
      await _saveSession(asMap(response.data));
      state = const AsyncValue.data('');
    } catch (error, stack) {
      state = AsyncValue.error(error, stack);
      rethrow;
    }
  }

  Future<String> register(String name, String email, String password) async {
    state = const AsyncValue.loading();
    try {
      final response = await ref.read(apiServicesProvider).post(
        '/auth/register',
        data: {'name': name.trim(), 'email': email.trim(), 'password': password},
      );
      state = const AsyncValue.data('');
      return asMap(response.data)['email']?.toString() ?? email.trim();
    } catch (error, stack) {
      state = AsyncValue.error(error, stack);
      rethrow;
    }
  }

  Future<void> verifyCode(String email, String code) async {
    state = const AsyncValue.loading();
    try {
      final response = await ref.read(apiServicesProvider).post(
        '/auth/verify-code',
        data: {'email': email.trim(), 'code': code.trim()},
      );
      await _saveSession(asMap(response.data));
      state = const AsyncValue.data('');
    } catch (error, stack) {
      state = AsyncValue.error(error, stack);
      rethrow;
    }
  }

  Future<String> resendCode(String email) async {
    state = const AsyncValue.loading();
    try {
      final response = await ref.read(apiServicesProvider).post(
        '/auth/resend-code',
        data: {'email': email.trim()},
      );
      state = const AsyncValue.data('');
      return asMap(response.data)['message']?.toString() ?? 'Código reenviado.';
    } catch (error, stack) {
      state = AsyncValue.error(error, stack);
      rethrow;
    }
  }

  Future<void> _saveSession(Map<String, dynamic> data) async {
    final token = data['token']?.toString() ?? '';
    if (token.isEmpty) throw StateError('Token não recebido pelo servidor.');
    final user = UserModel.fromJson(asMap(data['user']));
    await ref.read(secureStorageProvider).writeToken(token);
    ref.read(authSessionProvider.notifier).setAuthenticated(user);
  }
}
