import 'dart:convert';
import 'dart:io';

import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

/// Exibe o banner do push quando o app está aberto no Android (o FCM não
/// mostra notificação em foreground por conta própria).
class PushLocalNotificationService {
  PushLocalNotificationService._();

  static final PushLocalNotificationService instance = PushLocalNotificationService._();

  /// Mesmo id do meta-data `default_notification_channel_id` no AndroidManifest.
  static const androidChannelId = 'fazbrike_default';
  static const _androidChannelName = 'Fazbrike';

  final FlutterLocalNotificationsPlugin _plugin = FlutterLocalNotificationsPlugin();
  bool _initialized = false;
  void Function(Map<String, dynamic> data)? _onTap;

  Future<void> initialize({void Function(Map<String, dynamic> data)? onTap}) async {
    _onTap = onTap;
    if (_initialized) return;

    const settings = InitializationSettings(
      android: AndroidInitializationSettings('@mipmap/ic_launcher'),
      // Permissão do iOS é pedida pelo FirebaseMessaging.
      iOS: DarwinInitializationSettings(
        requestAlertPermission: false,
        requestBadgePermission: false,
        requestSoundPermission: false,
      ),
    );
    await _plugin.initialize(
      settings: settings,
      onDidReceiveNotificationResponse: (response) {
        final payload = response.payload;
        if (payload == null || payload.isEmpty) return;
        try {
          _onTap?.call(Map<String, dynamic>.from(jsonDecode(payload) as Map));
        } catch (_) {}
      },
    );

    if (Platform.isAndroid) {
      const channel = AndroidNotificationChannel(
        androidChannelId,
        _androidChannelName,
        description: 'Mensagens, perguntas e avisos do Fazbrike',
        importance: Importance.high,
      );
      await _plugin
          .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
          ?.createNotificationChannel(channel);
    }
    _initialized = true;
  }

  Future<void> showFromRemoteMessage(RemoteMessage message) async {
    if (!_initialized) return;
    final notification = message.notification;
    final title = notification?.title?.trim() ?? '';
    final body = notification?.body?.trim() ?? '';
    if (title.isEmpty && body.isEmpty) return;

    final data = Map<String, dynamic>.from(message.data);
    final id = int.tryParse(data['notification_id']?.toString() ?? '') ?? message.hashCode;
    try {
      await _plugin.show(
        id: id,
        title: title.isEmpty ? 'Fazbrike' : title,
        body: body,
        notificationDetails: const NotificationDetails(
          android: AndroidNotificationDetails(
            androidChannelId,
            _androidChannelName,
            importance: Importance.high,
            priority: Priority.high,
            icon: '@mipmap/ic_launcher',
          ),
        ),
        payload: jsonEncode(data),
      );
    } catch (error) {
      debugPrint('PushLocalNotification: falha ao exibir — $error');
    }
  }
}
