import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:fazbrike/src/app/notifications/controllers/notification_controller.dart';
import 'package:fazbrike/src/app/notifications/models/notification_model.dart';
import 'package:fazbrike/src/shared/utils/app_utils.dart';
import 'package:fazbrike/src/shared/utils/image_url.dart';
import 'package:fazbrike/src/theme/app_colors.dart';
import 'package:fazbrike/src/theme/app_radius.dart';
import 'package:fazbrike/src/theme/app_spacing.dart';

/// Ícone por tipo de notificação — o texto sempre vem do backend.
IconData notificationIcon(String type) => const {
      'message': Icons.chat_bubble_outline,
      'comment': Icons.mode_comment_outlined,
      'favorite': Icons.favorite_border,
      'follow': Icons.person_add_alt_outlined,
      'review': Icons.star_border,
      'boost': Icons.rocket_launch_outlined,
      'system': Icons.campaign_outlined,
    }[type] ??
    Icons.notifications_none;

class NotificationTile extends ConsumerWidget {
  const NotificationTile({super.key, required this.notification});

  final NotificationModel notification;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final avatar = resolveImageUrl(notification.actor?.avatarUrl);

    return Dismissible(
      key: ValueKey('notification-${notification.id}'),
      direction: DismissDirection.endToStart,
      background: Container(
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.xl),
        color: AppColors.danger,
        child: const Icon(Icons.delete_outline, color: Colors.white),
      ),
      confirmDismiss: (_) async {
        try {
          await ref.read(notificationFormProvider.notifier).delete(notification.id);
          return true;
        } catch (error) {
          if (context.mounted) {
            ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(error.toString())));
          }
          return false;
        }
      },
      child: Material(
        color: notification.isRead ? Colors.transparent : theme.colorScheme.primary.withValues(alpha: .06),
        child: InkWell(
          onTap: () => _open(context, ref),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg, vertical: AppSpacing.md),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                CircleAvatar(
                  radius: 22,
                  backgroundColor: theme.colorScheme.surfaceContainerHighest,
                  foregroundImage: avatar == null ? null : NetworkImage(avatar),
                  child: Icon(notificationIcon(notification.type), size: 20, color: theme.colorScheme.onSurface),
                ),
                const SizedBox(width: AppSpacing.md),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        notification.title,
                        style: theme.textTheme.bodyLarge?.copyWith(
                          fontWeight: notification.isRead ? FontWeight.w500 : FontWeight.w700,
                        ),
                      ),
                      if (notification.body.isNotEmpty) ...[
                        const SizedBox(height: 2),
                        Text(
                          notification.body,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: theme.textTheme.bodySmall,
                        ),
                      ],
                      const SizedBox(height: 4),
                      Text(formatRelativeTime(notification.createdAt), style: theme.textTheme.bodySmall),
                    ],
                  ),
                ),
                if (!notification.isRead)
                  Container(
                    margin: const EdgeInsets.only(top: 6, left: AppSpacing.sm),
                    width: 8,
                    height: 8,
                    decoration: BoxDecoration(
                      color: theme.colorScheme.primary,
                      borderRadius: BorderRadius.circular(AppRadius.pill),
                    ),
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Future<void> _open(BuildContext context, WidgetRef ref) async {
    await ref.read(notificationFormProvider.notifier).markRead(notification);
    if (!context.mounted) return;
    // Só navega para rota interna: link externo cadastrado no admin não abre
    // navegação dentro do app.
    if (notification.link.startsWith('/')) context.push(notification.link);
  }
}
