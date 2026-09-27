import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:fazbrike/services/api_services.dart';
import 'package:fazbrike/services/session_signal.dart';
import 'package:fazbrike/src/app/notifications/models/notification_model.dart';
import 'package:fazbrike/src/shared/models/paginator_model.dart';
import 'package:fazbrike/src/shared/utils/json_utils.dart';

/// Lista da central de notificações.
final notificationsListProvider = StateNotifierProvider<NotificationsListNotifier,
    AsyncValue<PaginatorModel<NotificationModel>>>((ref) => NotificationsListNotifier(ref));

class NotificationsListNotifier
    extends StateNotifier<AsyncValue<PaginatorModel<NotificationModel>>> {
  NotificationsListNotifier(this.ref) : super(const AsyncValue.loading());
  final Ref ref;

  Future<void> list({int? page, bool paginate = false, bool silent = false}) async {
    if (!silent) state = const AsyncValue.loading();
    try {
      final response = await ref.read(apiServicesProvider).get('/notifications');
      final data = asMap(response.data);
      state = AsyncValue.data(
        PaginatorModel(results: NotificationModel.fromJsonList(data['results'])),
      );
      ref.read(notificationsUnreadProvider.notifier).set(asInt(data['unread']));
    } catch (error, stack) {
      if (!silent) state = AsyncValue.error(error, stack);
    }
  }

  void update(NotificationModel notification) {
    state.whenData((paginator) {
      state = AsyncValue.data(paginator.copyWith(
        results: paginator.results
            .map((value) => value.id == notification.id ? notification : value)
            .toList(),
      ));
    });
  }

  void remove(int id) {
    state.whenData((paginator) {
      state = AsyncValue.data(paginator.copyWith(
        results: paginator.results.where((value) => value.id != id).toList(),
      ));
    });
  }

  void markAllReadLocally() {
    state.whenData((paginator) {
      state = AsyncValue.data(paginator.copyWith(
        results: paginator.results.map((value) => value.copyWith(isRead: true)).toList(),
      ));
    });
  }
}

/// Contador de não lidas que alimenta o badge do sino. Mantido fora da lista
/// para que o sino funcione em qualquer tela sem carregar a central inteira.
final notificationsUnreadProvider =
    StateNotifierProvider<NotificationsUnreadNotifier, int>((ref) => NotificationsUnreadNotifier(ref));

class NotificationsUnreadNotifier extends StateNotifier<int> {
  NotificationsUnreadNotifier(this.ref) : super(0) {
    sessionSignal.addListener(_onSession);
    _onSession();
  }

  final Ref ref;
  Timer? _timer;

  static const _interval = Duration(seconds: 30);

  void _onSession() {
    if (sessionSignal.value == SessionStatus.authenticated) {
      refresh();
      _timer ??= Timer.periodic(_interval, (_) => refresh());
      return;
    }
    _timer?.cancel();
    _timer = null;
    if (mounted) state = 0;
  }

  void set(int value) {
    if (mounted) state = value < 0 ? 0 : value;
  }

  /// Enquanto o push não está ligado, o badge se mantém por polling curto.
  Future<void> refresh() async {
    if (sessionSignal.value != SessionStatus.authenticated) return;
    try {
      final response = await ref.read(apiServicesProvider).get('/notifications/unread-count');
      set(asInt(asMap(response.data)['unread']));
    } catch (_) {
      // Badge é acessório: erro de rede não vira alerta na tela.
    }
  }

  @override
  void dispose() {
    sessionSignal.removeListener(_onSession);
    _timer?.cancel();
    super.dispose();
  }
}

/// Ações sobre notificações (marcar lida, apagar) e registro do aparelho.
final notificationFormProvider = StateNotifierProvider<NotificationFormNotifier,
    AsyncValue<String>>((ref) => NotificationFormNotifier(ref));

class NotificationFormNotifier extends StateNotifier<AsyncValue<String>> {
  NotificationFormNotifier(this.ref) : super(const AsyncValue.data(''));
  final Ref ref;

  Future<void> markRead(NotificationModel notification) async {
    if (notification.isRead) return;
    try {
      await ref.read(apiServicesProvider).put('/notifications/${notification.id}/read');
      ref.read(notificationsListProvider.notifier).update(notification.copyWith(isRead: true));
      await ref.read(notificationsUnreadProvider.notifier).refresh();
      state = const AsyncValue.data('');
    } catch (error) {
      state = AsyncValue.error(error.toString(), StackTrace.current);
    }
  }

  Future<void> markAllRead() async {
    try {
      await ref.read(apiServicesProvider).put('/notifications/read-all');
      ref.read(notificationsListProvider.notifier).markAllReadLocally();
      ref.read(notificationsUnreadProvider.notifier).set(0);
      state = const AsyncValue.data('');
    } catch (error) {
      state = AsyncValue.error(error.toString(), StackTrace.current);
      rethrow;
    }
  }

  Future<void> delete(int id) async {
    try {
      await ref.read(apiServicesProvider).delete('/notifications/$id');
      ref.read(notificationsListProvider.notifier).remove(id);
      await ref.read(notificationsUnreadProvider.notifier).refresh();
      state = const AsyncValue.data('');
    } catch (error) {
      state = AsyncValue.error(error.toString(), StackTrace.current);
      rethrow;
    }
  }

  /// Registra o token de push do aparelho. Fica pronto para o dia em que o
  /// FCM/APNs entrar: só falta quem produz o `token`.
  Future<void> registerDevice({required String token, required String platform, String appVersion = ''}) async {
    try {
      await ref.read(apiServicesProvider).post('/devices', data: {
        'token': token,
        'platform': platform,
        'app_version': appVersion,
      });
      state = const AsyncValue.data('');
    } catch (error) {
      state = AsyncValue.error(error.toString(), StackTrace.current);
    }
  }

  Future<void> unregisterDevice(String token) async {
    try {
      await ref.read(apiServicesProvider).delete('/devices', data: {'token': token});
      state = const AsyncValue.data('');
    } catch (error) {
      state = AsyncValue.error(error.toString(), StackTrace.current);
    }
  }
}
