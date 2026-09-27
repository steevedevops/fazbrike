import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:fazbrike/src/app/catalog/controllers/catalog_controller.dart';
import 'package:fazbrike/src/app/catalog/models/catalog_models.dart';
import 'package:fazbrike/src/theme/app_radius.dart';
import 'package:fazbrike/src/theme/app_spacing.dart';

/// Trilho de categorias em pílulas, sempre à mão no topo das telas de compra.
/// `null` no callback é a opção "Todos".
class CategoryChips extends ConsumerWidget {
  const CategoryChips({
    super.key,
    required this.selectedSlug,
    required this.onSelected,
    this.height = 44,
  });

  final String selectedSlug;
  final ValueChanged<CategoryModel?> onSelected;
  final double height;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final categories = ref.watch(categoriesProvider);
    // Sem categorias carregadas o trilho não ocupa espaço nem pisca skeleton:
    // ele aparece quando a lista chega.
    final items = categories.asData?.value.results ?? const <CategoryModel>[];
    if (items.isEmpty) return SizedBox(height: height);

    return SizedBox(
      height: height,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
        itemCount: items.length + 1,
        separatorBuilder: (_, __) => const SizedBox(width: AppSpacing.sm),
        itemBuilder: (_, index) {
          if (index == 0) {
            return _Chip(
              label: 'Todos',
              selected: selectedSlug.isEmpty,
              onTap: () => onSelected(null),
            );
          }
          final category = items[index - 1];
          return _Chip(
            label: category.name,
            selected: category.slug == selectedSlug,
            onTap: () => onSelected(category),
          );
        },
      ),
    );
  }
}

class _Chip extends StatelessWidget {
  const _Chip({required this.label, required this.selected, required this.onTap});

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Center(
      child: Material(
        color: selected ? theme.colorScheme.onSurface : theme.colorScheme.surface,
        borderRadius: BorderRadius.circular(AppRadius.pill),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(AppRadius.pill),
          child: Ink(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(AppRadius.pill),
              border: Border.all(color: selected ? theme.colorScheme.onSurface : theme.dividerColor),
            ),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              child: Text(
                label,
                style: theme.textTheme.bodySmall?.copyWith(
                  fontWeight: FontWeight.w600,
                  color: selected ? theme.colorScheme.surface : theme.colorScheme.onSurface,
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
