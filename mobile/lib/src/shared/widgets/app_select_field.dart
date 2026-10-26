import 'package:flutter/material.dart';
import 'package:fazbrike/src/theme/app_radius.dart';
import 'package:fazbrike/src/theme/app_spacing.dart';

/// Lista de seleção com o rótulo acima do campo, no mesmo desenho dos inputs
/// do site. O rótulo não fica cortando a borda.
class AppSelectField<T> extends StatelessWidget {
  const AppSelectField({
    super.key,
    required this.label,
    required this.items,
    required this.onChanged,
    this.value,
    this.validator,
  });

  final String label;
  final T? value;
  final List<DropdownMenuItem<T>> items;
  final ValueChanged<T?>? onChanged;
  final String? Function(T?)? validator;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600)),
        const SizedBox(height: AppSpacing.sm),
        DropdownButtonFormField<T>(
          initialValue: value,
          isExpanded: true,
          items: items,
          onChanged: onChanged,
          validator: validator,
          borderRadius: BorderRadius.circular(AppRadius.control),
          icon: const Icon(Icons.keyboard_arrow_down),
          style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w500),
          decoration: const InputDecoration(
            floatingLabelBehavior: FloatingLabelBehavior.never,
            contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          ),
        ),
      ],
    );
  }
}
