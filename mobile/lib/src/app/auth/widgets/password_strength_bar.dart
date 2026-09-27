import 'package:flutter/material.dart';
import 'package:fazbrike/src/theme/app_colors.dart';

/// Força da senha com as mesmas três faixas do cadastro do site
/// (`RegisterForm`): comprimento + mistura de letras e números.
class PasswordStrength {
  const PasswordStrength._(this.score, this.label, this.color);

  final int score;
  final String label;
  final Color color;

  static const weak = PasswordStrength._(1, 'Fraca', AppColors.danger);
  static const medium = PasswordStrength._(2, 'Média', AppColors.brand500);
  static const strong = PasswordStrength._(3, 'Forte', AppColors.success);

  static PasswordStrength? of(String password) {
    if (password.isEmpty) return null;
    var score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 10) score++;
    if (RegExp(r'[A-Za-z]').hasMatch(password) && RegExp(r'\d').hasMatch(password)) score++;
    score = score.clamp(1, 3);
    return score == 1 ? weak : (score == 2 ? medium : strong);
  }
}

class PasswordStrengthBar extends StatelessWidget {
  const PasswordStrengthBar({super.key, required this.password});

  final String password;

  @override
  Widget build(BuildContext context) {
    final strength = PasswordStrength.of(password);
    if (strength == null) return const SizedBox.shrink();

    final theme = Theme.of(context);
    final empty = theme.inputDecorationTheme.fillColor ?? theme.colorScheme.surfaceContainerHighest;

    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: List.generate(3, (index) {
              return Expanded(
                child: Container(
                  height: 4,
                  margin: EdgeInsets.only(right: index == 2 ? 0 : 6),
                  decoration: BoxDecoration(
                    color: index < strength.score ? strength.color : empty,
                    borderRadius: BorderRadius.circular(999),
                  ),
                ),
              );
            }),
          ),
          const SizedBox(height: 6),
          Text(
            'Força da senha: ${strength.label}',
            style: theme.textTheme.bodySmall?.copyWith(color: strength.color),
          ),
        ],
      ),
    );
  }
}
