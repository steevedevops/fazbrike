import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:fazbrike/services/api_services.dart';
import 'package:fazbrike/services/models/api_exception.dart';
import 'package:fazbrike/services/secure_storage_service.dart';
import 'package:fazbrike/services/session_signal.dart';
import 'package:fazbrike/src/app/notifications/controllers/push_notifications_controller.dart';
import 'package:fazbrike/src/app/auth/models/user_model.dart';
import 'package:fazbrike/src/shared/utils/json_utils.dart';

enum SocialProvider {
  google('Google'),
  apple('Apple');

  const SocialProvider(this.label);
  final String label;
}

/// Pessoa fechou a tela do Google/Apple: não é erro para mostrar.
class SocialLoginCancelled implements Exception {
  const SocialLoginCancelled();
}

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
    // Remove o token de push enquanto o JWT ainda vale (DELETE /api/devices exige login).
    try {
      await ref.read(pushNotificationsProvider).unregister();
    } catch (_) {}
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

  /// Google/Apple via Firebase Authentication. O Firebase confirma a
  /// identidade e `POST /api/auth/social` devolve o JWT do Fazbrike; o aceite
  /// dos termos é exibido junto aos botões. Cancelar lança [SocialLoginCancelled].
  Future<void> socialLogin(SocialProvider provider) async {
    state = const AsyncValue.loading();
    final auth = FirebaseAuth.instance;
    try {
      final credential = await auth.signInWithProvider(
        provider == SocialProvider.google
            ? (GoogleAuthProvider()..setCustomParameters({'prompt': 'select_account'}))
            : (AppleAuthProvider()
              ..addScope('email')
              ..addScope('name')),
      );
      final idToken = await credential.user?.getIdToken();
      if (idToken == null || idToken.isEmpty) throw const ApiException('Não foi possível confirmar seu login.');
      final response = await ref.read(apiServicesProvider).post('/auth/social', data: {
        'id_token': idToken,
        // A Apple só envia o nome no primeiro login; o Firebase guarda em displayName.
        'name': credential.user?.displayName ?? '',
        'accept_terms': true,
      });
      await _saveSession(asMap(response.data));
      state = const AsyncValue.data('');
    } on FirebaseAuthException catch (error, stack) {
      state = const AsyncValue.data('');
      if (_cancelCodes.contains(error.code)) throw const SocialLoginCancelled();
      final message = _firebaseErrors[error.code] ?? 'Não foi possível entrar com ${provider.label}.';
      Error.throwWithStackTrace(ApiException(message), stack);
    } catch (error, stack) {
      state = AsyncValue.error(error, stack);
      rethrow;
    } finally {
      // A sessão do app é o JWT próprio; a do Firebase não é mais usada.
      try {
        await auth.signOut();
      } catch (_) {}
    }
  }

  static const _cancelCodes = {'canceled', 'web-context-canceled', 'web-context-cancelled', 'user-cancelled', 'popup-closed-by-user'};
  static const _firebaseErrors = {
    'operation-not-allowed': 'Este método de login ainda não está disponível.',
    'network-request-failed': 'Sem conexão. Verifique sua internet e tente de novo.',
    'account-exists-with-different-credential': 'Este e-mail já usa outro método de login. Entre com o método usado antes.',
    'user-disabled': 'Esta conta foi desativada. Fale com a Central de ajuda.',
  };

  Future<String> register(String name, String email, String password, {required bool acceptTerms}) async {
    state = const AsyncValue.loading();
    try {
      final response = await ref.read(apiServicesProvider).post(
        '/auth/register',
        data: {'name': name.trim(), 'email': email.trim(), 'password': password, 'accept_terms': acceptTerms},
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
