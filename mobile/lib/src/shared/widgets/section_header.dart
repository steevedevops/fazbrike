import 'package:flutter/material.dart';
import 'package:fazbrike/src/theme/app_spacing.dart';

/// Cabeçalho de seção da home: título, subtítulo opcional e um atalho à
/// direita ("ver todas" + chevron) quando a seção tem continuação.
class SectionHeader extends StatelessWidget {
  const SectionHeader({
    super.key,
    required this.title,
    this.subtitle,
    this.actionLabel,
    this.onAction,
  });

  final String title;
  final String? subtitle;
  final String? actionLabel;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final hasAction = onAction != null;

    return Padding(
      padding: const EdgeInsets.fromLTRB(AppSpacing.lg, AppSpacing.xl, AppSpacing.sm, AppSpacing.md),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: theme.textTheme.titleLarge),
                if (subtitle != null) ...[
                  const SizedBox(height: 2),
                  Text(subtitle!, style: theme.textTheme.bodySmall),
                ],
              ],
            ),
          ),
          if (hasAction)
            TextButton(
              onPressed: onAction,
              style: TextButton.styleFrom(
                foregroundColor: theme.textTheme.bodySmall?.color,
                padding: const EdgeInsets.symmetric(horizontal: AppSpacing.sm),
                minimumSize: const Size(0, 40),
                tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                textStyle: theme.textTheme.bodySmall,
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (actionLabel != null) Text(actionLabel!),
                  const Icon(Icons.chevron_right, size: 18),
                ],
              ),
            ),
        ],
      ),
    );
  }
}
