import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:fazbrike/services/fcm/fcm_service.dart';
import 'package:fazbrike/services/navigator_service.dart';
import 'package:fazbrike/services/session_signal.dart';
import 'package:fazbrike/src/app/notifications/controllers/notification_controller.dart';

/// Liga o push (FCM) à sessão: com login registra o token do aparelho em
/// `POST /api/devices`; no logout o token é removido antes de apagar o JWT.
final pushNotificationsProvider = Provider<PushNotificationsController>((ref) {
  final controller = PushNotificationsController(ref);
  ref.onDispose(controller.dispose);
  return controller;
});

class PushNotificationsController {
  PushNotificationsController(this.ref) {
    sessionSignal.addListener(_onSession);
    _onSession();
  }

  final Ref ref;

  void _onSession() {
    if (sessionSignal.value != SessionStatus.authenticated) return;
    FcmService.instance
        .start(onToken: _registerToken, onMessage: _onMessage, onOpen: _onOpen)
        .catchError((Object error) => debugPrint('FCM: falha ao iniciar — $error'));
  }

  Future<void> _registerToken(String token) =>
      ref.read(notificationFormProvider.notifier).registerDevice(token: token, platform: FcmService.platform);

  /// Push com o app aberto: atualiza o sino e a central sem recarregar a tela.
  void _onMessage(Map<String, dynamic> data) {
    ref.read(notificationsUnreadProvider.notifier).refresh();
    ref.read(notificationsListProvider.notifier).list(silent: true);
  }

  /// Push tocado: abre a rota interna enviada pelo backend (`link`) ou a central.
  void _onOpen(Map<String, dynamic> data) {
    _onMessage(data);
    final link = data['link']?.toString() ?? '';
    try {
      NavigatorService.instance.push(link.startsWith('/') ? link : '/notificacoes');
    } catch (error) {
      debugPrint('FCM: falha ao abrir destino do push — $error');
    }
  }

  /// Chamado no logout, ainda autenticado, para o aparelho parar de receber
  /// avisos da conta que saiu.
  Future<void> unregister() async {
    final fcm = FcmService.instance;
    if (!fcm.isAvailable) return;
    final token = fcm.cachedToken ?? await fcm.fetchToken();
    if (token != null && token.isNotEmpty) {
      await ref.read(notificationFormProvider.notifier).unregisterDevice(token);
    }
    await fcm.stop();
  }

  void dispose() => sessionSignal.removeListener(_onSession);
}
