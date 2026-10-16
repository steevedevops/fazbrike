import 'package:flutter/material.dart';
import 'package:fazbrike/src/app/items/widgets/item_attributes.dart';
import 'package:fazbrike/src/theme/app_spacing.dart';

/// Ficha técnica em linhas "rótulo ........ valor".
class ItemSpecsSection extends StatelessWidget {
  const ItemSpecsSection({super.key, required this.specs});
  final List<ItemFact> specs;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Características', style: theme.textTheme.titleLarge),
        const SizedBox(height: AppSpacing.xs),
        for (var index = 0; index < specs.length; index++) ...[
          if (index > 0) Divider(height: 1, color: theme.colorScheme.outlineVariant),
          Padding(
            padding: const EdgeInsets.symmetric(vertical: AppSpacing.md),
            child: Row(children: [
              Icon(specs[index].icon, size: 18, color: theme.textTheme.bodySmall?.color),
              const SizedBox(width: AppSpacing.sm),
              Expanded(
                child: Text(specs[index].label, style: theme.textTheme.bodySmall, maxLines: 1, overflow: TextOverflow.ellipsis),
              ),
              const SizedBox(width: AppSpacing.sm),
              Expanded(
                child: Text(
                  specs[index].value,
                  style: theme.textTheme.titleSmall,
                  textAlign: TextAlign.right,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ]),
          ),
        ],
      ],
    );
  }
}
