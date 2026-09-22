import 'package:flutter/material.dart';
import 'package:fazbrike/src/theme/app_spacing.dart';

class EmptyView extends StatelessWidget {
  const EmptyView({super.key, required this.title, required this.description, this.action});
  final String title;
  final String description;
  final Widget? action;
  @override
  Widget build(BuildContext context) => Center(
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.xl),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.inventory_2_outlined, size: 44),
              const SizedBox(height: AppSpacing.md),
              Text(title, style: Theme.of(context).textTheme.titleMedium, textAlign: TextAlign.center),
              const SizedBox(height: AppSpacing.sm),
              Text(description, textAlign: TextAlign.center),
              if (action != null) ...[const SizedBox(height: AppSpacing.lg), action!],
            ],
          ),
        ),
      );
}
