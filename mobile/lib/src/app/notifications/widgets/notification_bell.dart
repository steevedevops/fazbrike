import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:fazbrike/src/app/notifications/controllers/notification_controller.dart';
import 'package:fazbrike/src/app/notifications/screens/notifications_screen.dart';
import 'package:fazbrike/src/theme/app_radius.dart';

/// Sino da AppBar com o contador de não lidas. O contador vem do
/// [notificationsUnreadProvider], que se atualiza sozinho enquanto há sessão.
class NotificationBell extends ConsumerWidget {
  const NotificationBell({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final unread = ref.watch(notificationsUnreadProvider);
    final label = unread > 0 ? 'Notificações ($unread não lidas)' : 'Notificações';

    return IconButton(
      tooltip: label,
      onPressed: () => context.push(NotificationsScreen.path),
      icon: Stack(
        clipBehavior: Clip.none,
        children: [
          Icon(unread > 0 ? Icons.notifications : Icons.notifications_none, semanticLabel: label),
          if (unread > 0)
            Positioned(
              right: -4,
              top: -3,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
                constraints: const BoxConstraints(minWidth: 16),
                decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.primary,
                  borderRadius: BorderRadius.circular(AppRadius.pill),
                ),
                child: Text(
                  unread > 9 ? '9+' : '$unread',
                  textAlign: TextAlign.center,
                  style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w700, height: 1.4),
                ),
              ),
            ),
        ],
      ),
    );
  }
}
