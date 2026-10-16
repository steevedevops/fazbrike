import 'dart:async';
import 'dart:io';

import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:fazbrike/services/fcm/push_local_notification_service.dart';

typedef FcmDataHandler = void Function(Map<String, dynamic> data);
typedef FcmTokenHandler = Future<void> Function(String token);

/// Token FCM + listeners de mensagem (foreground / abertura pelo push).
/// Sem Firebase inicializado (testes, plataformas sem config) vira no-op.
class FcmService {
  FcmService._();

  static final FcmService instance = FcmService._();

  StreamSubscription<RemoteMessage>? _foregroundSub;
  StreamSubscription<RemoteMessage>? _openedSub;
  StreamSubscription<String>? _tokenRefreshSub;
  String? _cachedToken;
  bool _started = false;

  bool get isAvailable => Firebase.apps.isNotEmpty;
  String? get cachedToken => _cachedToken;
  FirebaseMessaging get _messaging => FirebaseMessaging.instance;

  static String get platform {
    if (Platform.isIOS) return 'ios';
    if (Platform.isAndroid) return 'android';
    return 'mobile';
  }

  Future<bool> requestPermission() async {
    if (!isAvailable) return false;
    final settings = await _messaging.requestPermission(alert: true, badge: true, sound: true);
    return settings.authorizationStatus == AuthorizationStatus.authorized ||
        settings.authorizationStatus == AuthorizationStatus.provisional;
  }

  Future<String?> fetchToken() async {
    if (!isAvailable) return null;
    try {
      _cachedToken = await _messaging.getToken();
      return _cachedToken;
    } catch (error) {
      // iOS sem APNs configurado (simulador, sem entitlement) cai aqui.
      debugPrint('FCM: falha ao obter token — $error');
      return null;
    }
  }

  /// Liga os listeners (uma vez), pede permissão e entrega o token atual e os
  /// renovados para [onToken]. [onMessage] recebe mensagens com o app aberto;
  /// [onOpen] recebe o push tocado pelo usuário.
  Future<void> start({
    required FcmTokenHandler onToken,
    required FcmDataHandler onMessage,
    required FcmDataHandler onOpen,
  }) async {
    if (!isAvailable) return;
    if (!_started) {
      _started = true;
      if (Platform.isIOS) {
        await _messaging.setForegroundNotificationPresentationOptions(alert: true, badge: true, sound: true);
      }
      await PushLocalNotificationService.instance.initialize(onTap: onOpen);
      _foregroundSub = FirebaseMessaging.onMessage.listen((message) async {
        onMessage(_normalize(message));
        // iOS mostra o banner sozinho (presentation options acima).
        if (Platform.isAndroid) await PushLocalNotificationService.instance.showFromRemoteMessage(message);
      });
      _openedSub = FirebaseMessaging.onMessageOpenedApp.listen((message) => onOpen(_normalize(message)));
      _tokenRefreshSub = _messaging.onTokenRefresh.listen((token) {
        _cachedToken = token;
        onToken(token);
      });
      final initial = await _messaging.getInitialMessage();
      if (initial != null) onOpen(_normalize(initial));
    }

    await requestPermission();
    final token = await fetchToken();
    if (token != null && token.isNotEmpty) await onToken(token);
  }

  Future<void> stop() async {
    await _foregroundSub?.cancel();
    await _openedSub?.cancel();
    await _tokenRefreshSub?.cancel();
    _foregroundSub = null;
    _openedSub = null;
    _tokenRefreshSub = null;
    _started = false;
  }

  Map<String, dynamic> _normalize(RemoteMessage message) {
    final data = Map<String, dynamic>.from(message.data);
    final notification = message.notification;
    if (notification != null) {
      data.putIfAbsent('title', () => notification.title ?? '');
      data.putIfAbsent('body', () => notification.body ?? '');
    }
    return data;
  }
}
