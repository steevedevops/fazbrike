import 'package:flutter/material.dart';
import 'package:fazbrike/src/theme/app_spacing.dart';

/// Campo com rótulo acima, como no site (`labelClass` + `fieldClass`) — em vez
/// do label flutuante padrão do Material.
class AuthField extends StatelessWidget {
  const AuthField({
    super.key,
    required this.label,
    required this.controller,
    this.hint,
    this.keyboardType,
    this.textInputAction,
    this.autofillHints,
    this.obscureText = false,
    this.suffixIcon,
    this.validator,
    this.onChanged,
  });

  final String label;
  final TextEditingController controller;
  final String? hint;
  final TextInputType? keyboardType;
  final TextInputAction? textInputAction;
  final Iterable<String>? autofillHints;
  final bool obscureText;
  final Widget? suffixIcon;
  final String? Function(String?)? validator;
  final ValueChanged<String>? onChanged;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600),
        ),
        const SizedBox(height: AppSpacing.sm),
        TextFormField(
          controller: controller,
          keyboardType: keyboardType,
          textInputAction: textInputAction,
          autofillHints: autofillHints,
          obscureText: obscureText,
          onChanged: onChanged,
          validator: validator,
          style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w500),
          decoration: InputDecoration(
            hintText: hint,
            suffixIcon: suffixIcon,
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 18),
          ),
        ),
        const SizedBox(height: AppSpacing.xl),
      ],
    );
  }
}
