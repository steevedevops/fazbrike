import 'package:flutter/material.dart';

/// Troca entre entrar e criar conta, em texto, sem caixa em volta.
class AuthModeTabs extends StatelessWidget {
  const AuthModeTabs({super.key, required this.isRegister, required this.onChanged});

  final bool isRegister;
  final ValueChanged<bool>? onChanged;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final prompt = isRegister ? 'Já tem conta?' : 'Não tem conta?';
    final action = isRegister ? 'Entrar' : 'Criar conta';

    return Wrap(
      alignment: WrapAlignment.center,
      crossAxisAlignment: WrapCrossAlignment.center,
      spacing: 4,
      children: [
        Text(prompt, style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w500)),
        TextButton(
          onPressed: onChanged == null ? null : () => onChanged!(!isRegister),
          style: TextButton.styleFrom(
            foregroundColor: theme.colorScheme.onSurface,
            minimumSize: const Size(48, 48),
            padding: const EdgeInsets.symmetric(horizontal: 8),
            tapTargetSize: MaterialTapTargetSize.shrinkWrap,
            textStyle: theme.textTheme.titleMedium?.copyWith(decoration: TextDecoration.underline),
          ),
          child: Text(action, maxLines: 1, overflow: TextOverflow.ellipsis),
        ),
      ],
    );
  }
}
