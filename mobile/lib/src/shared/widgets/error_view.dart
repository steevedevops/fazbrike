import 'package:flutter/material.dart';
import 'package:fazbrike/src/theme/app_spacing.dart';

class ErrorView extends StatelessWidget {
  const ErrorView({super.key, required this.message, this.onRetry});
  final String message;
  final VoidCallback? onRetry;
  @override
  Widget build(BuildContext context) => Center(
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.xl),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.cloud_off_outlined, size: 42),
              const SizedBox(height: AppSpacing.md),
              Text(message, textAlign: TextAlign.center),
              if (onRetry != null) ...[
                const SizedBox(height: AppSpacing.lg),
                OutlinedButton(onPressed: onRetry, child: const Text('Tentar novamente')),
              ],
            ],
          ),
        ),
      );
}
