import 'package:flutter/material.dart';
import 'package:fazbrike/src/shared/widgets/category_icon.dart';
import 'package:fazbrike/src/theme/app_colors.dart';
import 'package:fazbrike/src/theme/app_radius.dart';
import 'package:fazbrike/src/theme/app_spacing.dart';

/// Card de categoria equivalente ao da home do site (`frontend/src/app/page.tsx`):
/// um retângulo `surface` com borda, ícone dentro de um círculo `subtle` e o
/// nome ao lado em `.type-meta`.
class CategoryCard extends StatelessWidget {
  const CategoryCard({
    super.key,
    required this.slug,
    required this.name,
    required this.onTap,
    this.iconSlug,
  });

  final String slug;
  final String name;

  /// Slug usado só para escolher o ícone. Quando a API manda `icon` na
  /// categoria, ele vem aqui; senão o próprio `slug` resolve a família.
  final String? iconSlug;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Material(
      color: theme.colorScheme.surface,
      borderRadius: BorderRadius.circular(AppRadius.card),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(AppRadius.card),
        child: Ink(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(AppRadius.card),
            border: Border.all(color: theme.dividerColor),
          ),
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Row(
              children: [
                Container(
                  height: 40,
                  width: 40,
                  decoration: BoxDecoration(
                    color: isDark ? AppColors.darkSubtle : AppColors.subtle,
                    borderRadius: BorderRadius.circular(AppRadius.pill),
                  ),
                  child: Center(
                    child: CategoryIcon(
                      slug: iconSlug?.isNotEmpty == true ? iconSlug! : slug,
                      size: 20,
                      color: theme.colorScheme.onSurface,
                    ),
                  ),
                ),
                const SizedBox(width: AppSpacing.md),
                Expanded(
                  child: Text(
                    name,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: theme.colorScheme.onSurface,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
