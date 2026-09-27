import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:fazbrike/src/shared/widgets/app_logo.dart';
import 'package:fazbrike/src/theme/app_spacing.dart';

/// Topo da tela de acesso: atalho "voltar à loja" e a marca centralizada,
/// como na versão mobile da página de login do site.
class AuthBrandHeader extends StatelessWidget {
  const AuthBrandHeader({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Align(
          alignment: Alignment.centerLeft,
          child: TextButton.icon(
            onPressed: () => context.go('/'),
            icon: const Icon(Icons.arrow_back, size: 18),
            label: const Text('voltar à loja'),
            style: TextButton.styleFrom(
              foregroundColor: theme.textTheme.bodySmall?.color,
              padding: const EdgeInsets.symmetric(horizontal: AppSpacing.sm),
              minimumSize: const Size(0, 40),
              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
              textStyle: theme.textTheme.bodySmall?.copyWith(fontWeight: FontWeight.w500),
            ),
          ),
        ),
        const SizedBox(height: AppSpacing.lg),
        const Center(child: AppLogo(markSize: 36)),
      ],
    );
  }
}
