import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:fazbrike/src/app/notifications/controllers/notification_controller.dart';
import 'package:fazbrike/src/app/notifications/widgets/notification_tile.dart';
import 'package:fazbrike/src/shared/widgets/empty_view.dart';
import 'package:fazbrike/src/shared/widgets/error_view.dart';
import 'package:fazbrike/src/shared/widgets/loading_view.dart';

class NotificationList extends ConsumerWidget {
  const NotificationList({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final notifications = ref.watch(notificationsListProvider);
    return notifications.when(
      loading: () => const LoadingView(),
      error: (error, _) => ErrorView(
        message: error.toString(),
        onRetry: () => ref.read(notificationsListProvider.notifier).list(),
      ),
      data: (page) => RefreshIndicator(
        onRefresh: () => ref.read(notificationsListProvider.notifier).list(silent: true),
        child: page.results.isEmpty
            ? ListView(
                physics: const AlwaysScrollableScrollPhysics(),
                children: const [
                  SizedBox(height: 120),
                  EmptyView(
                    title: 'Nenhuma notificação',
                    description: 'Avisos sobre mensagens, comentários e seus anúncios aparecem aqui.',
                  ),
                ],
              )
            : ListView.separated(
                physics: const AlwaysScrollableScrollPhysics(),
                itemCount: page.results.length,
                separatorBuilder: (_, __) => const Divider(height: 1),
                itemBuilder: (_, index) => NotificationTile(notification: page.results[index]),
              ),
      ),
    );
  }
}
