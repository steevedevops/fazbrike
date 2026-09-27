import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:fazbrike/src/app/notifications/controllers/notification_controller.dart';
import 'package:fazbrike/src/app/notifications/widgets/notification_list.dart';

class NotificationsScreen extends ConsumerStatefulWidget {
  const NotificationsScreen({super.key});
  static const path = '/notificacoes';

  @override
  ConsumerState<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends ConsumerState<NotificationsScreen> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() => ref.read(notificationsListProvider.notifier).list());
  }

  Future<void> _markAllRead() async {
    try {
      await ref.read(notificationFormProvider.notifier).markAllRead();
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(error.toString())));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final unread = ref.watch(notificationsUnreadProvider);
    return Scaffold(
      appBar: AppBar(
        title: const Text('Notificações'),
        actions: [
          if (unread > 0)
            TextButton(
              onPressed: _markAllRead,
              child: const Text('Marcar todas'),
            ),
        ],
      ),
      body: const NotificationList(),
    );
  }
}
