import 'package:flutter/material.dart';
import 'package:fazbrike/src/theme/app_radius.dart';

/// Alternador "Entrar / Criar conta" no mesmo formato do site: trilho em
/// `bg-subtle` e a aba ativa como pílula escura (`bg-ink text-white`).
class AuthModeTabs extends StatelessWidget {
  const AuthModeTabs({super.key, required this.isRegister, required this.onChanged});

  final bool isRegister;
  final ValueChanged<bool>? onChanged;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    // Mesmo tom dos inputs (bg-subtle no site), sem duplicar o token aqui.
    final track = theme.inputDecorationTheme.fillColor ?? theme.colorScheme.surfaceContainerHighest;

    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: track,
        borderRadius: BorderRadius.circular(AppRadius.control),
      ),
      child: Row(
        children: [
          Expanded(child: _Tab(label: 'Entrar', selected: !isRegister, onTap: onChanged == null ? null : () => onChanged!(false))),
          Expanded(child: _Tab(label: 'Criar conta', selected: isRegister, onTap: onChanged == null ? null : () => onChanged!(true))),
        ],
      ),
    );
  }
}

class _Tab extends StatelessWidget {
  const _Tab({required this.label, required this.selected, required this.onTap});

  final String label;
  final bool selected;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Semantics(
      selected: selected,
      button: true,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(AppRadius.chip),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 180),
          height: 40,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            // onSurface/surface em vez do token fixo: no tema escuro a pílula
            // ativa inverte junto e o rótulo continua legível.
            color: selected ? theme.colorScheme.onSurface : Colors.transparent,
            borderRadius: BorderRadius.circular(AppRadius.chip),
          ),
          child: Text(
            label,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: theme.textTheme.bodyLarge?.copyWith(
              fontWeight: FontWeight.w600,
              color: selected ? theme.colorScheme.surface : theme.textTheme.bodySmall?.color,
            ),
          ),
        ),
      ),
    );
  }
}
