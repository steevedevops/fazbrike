import 'package:flutter/material.dart';
import 'package:fazbrike/src/app/help/models/help_models.dart';
import 'package:fazbrike/src/shared/utils/app_utils.dart';
import 'package:fazbrike/src/theme/app_spacing.dart';

/// Um chamado com status e, quando houver, a resposta da equipe.
class SupportRequestTile extends StatelessWidget {
  const SupportRequestTile({super.key, required this.request});
  final SupportRequestModel request;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;
    final answered = request.status == 'answered';
    return Card(
      margin: const EdgeInsets.only(bottom: AppSpacing.md),
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Expanded(
              child: Text(request.subject, style: theme.textTheme.titleSmall, maxLines: 2, overflow: TextOverflow.ellipsis),
            ),
            const SizedBox(width: AppSpacing.sm),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: AppSpacing.sm, vertical: 2),
              decoration: BoxDecoration(
                color: answered ? scheme.onSurface : scheme.surfaceContainerHighest,
                borderRadius: BorderRadius.circular(99),
              ),
              child: Text(
                request.statusLabel,
                style: theme.textTheme.labelSmall?.copyWith(color: answered ? scheme.surface : scheme.onSurface),
              ),
            ),
          ]),
          const SizedBox(height: AppSpacing.xs),
          Text(
            '#${request.id} · ${helpOptionLabel(supportTopics, request.topic)} · ${formatDateTime(request.createdAt)}',
            style: theme.textTheme.bodySmall,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: AppSpacing.sm),
          Text(request.message, style: theme.textTheme.bodyMedium),
          if (request.response.isNotEmpty) ...[
            const SizedBox(height: AppSpacing.md),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(AppSpacing.md),
              decoration: BoxDecoration(
                color: scheme.surfaceContainerHighest,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(
                  request.respondedAt == null
                      ? 'Resposta da equipe'
                      : 'Resposta da equipe · ${formatDateTime(request.respondedAt!)}',
                  style: theme.textTheme.labelMedium,
                ),
                const SizedBox(height: AppSpacing.xs),
                Text(request.response, style: theme.textTheme.bodyMedium),
              ]),
            ),
          ],
        ]),
      ),
    );
  }
}
