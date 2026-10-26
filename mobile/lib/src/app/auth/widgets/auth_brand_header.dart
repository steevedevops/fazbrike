import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:fazbrike/src/shared/widgets/app_logo.dart';
import 'package:fazbrike/src/theme/app_spacing.dart';

/// Topo da tela de acesso: volta para a loja e a marca, alinhados à coluna do formulário.
class AuthBrandHeader extends StatelessWidget {
  const AuthBrandHeader({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        TextButton.icon(
          onPressed: () => context.go('/'),
          icon: const Icon(Icons.arrow_back, size: 22),
          label: const Text('Voltar à loja'),
          style: TextButton.styleFrom(
            foregroundColor: theme.colorScheme.onSurface,
            padding: EdgeInsets.zero,
            minimumSize: const Size(48, 48),
            tapTargetSize: MaterialTapTargetSize.shrinkWrap,
            alignment: Alignment.centerLeft,
            textStyle: theme.textTheme.titleMedium,
          ),
        ),
        const SizedBox(height: AppSpacing.lg),
        const AppLogo(markSize: 40),
      ],
    );
  }
}
