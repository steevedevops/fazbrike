import 'package:flutter/material.dart';
import 'package:fazbrike/src/app/items/models/item_model.dart';
import 'package:fazbrike/src/app/items/widgets/item_attributes.dart';
import 'package:fazbrike/src/shared/utils/app_utils.dart';
import 'package:fazbrike/src/theme/app_radius.dart';
import 'package:fazbrike/src/theme/app_spacing.dart';

/// Bloco de abertura: selos, preço, título, local, data e números do anúncio.
class ItemDetailHeader extends StatelessWidget {
  const ItemDetailHeader({super.key, required this.item});
  final ItemModel item;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final mode = listingModeLabel(item);
    final status = _statusLabel(item.status);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Wrap(spacing: AppSpacing.xs, runSpacing: AppSpacing.xs, children: [
          if (status != null) _Badge(label: status, emphasis: true),
          if (mode.isNotEmpty) _Badge(label: mode, emphasis: status == null),
          if (item.category.isNotEmpty) _Badge(label: categoryLabel(item.category)),
        ]),
        const SizedBox(height: AppSpacing.md),
        Text(formatPrice(item.price), style: theme.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w700)),
        const SizedBox(height: AppSpacing.xs),
        Text(item.title, style: theme.textTheme.titleLarge),
        const SizedBox(height: AppSpacing.sm),
        if (item.location.isNotEmpty)
          _MetaLine(icon: Icons.place_outlined, text: item.location),
        _MetaLine(icon: Icons.schedule_outlined, text: 'Publicado em ${formatDate(item.createdAt)}'),
        const SizedBox(height: AppSpacing.md),
        Wrap(spacing: AppSpacing.lg, runSpacing: AppSpacing.xs, children: [
          _Stat(icon: Icons.visibility_outlined, text: _plural(item.viewsCount, 'visualização', 'visualizações')),
          _Stat(icon: Icons.favorite_border, text: _plural(item.favoritesCount, 'salvo', 'salvos')),
          _Stat(icon: Icons.chat_bubble_outline, text: _plural(item.commentsCount, 'pergunta', 'perguntas')),
        ]),
      ],
    );
  }

  String? _statusLabel(String status) => const {'sold': 'Vendido', 'reserved': 'Reservado', 'inactive': 'Pausado'}[status];
  String _plural(int count, String one, String many) => '$count ${count == 1 ? one : many}';
}

class _Badge extends StatelessWidget {
  const _Badge({required this.label, this.emphasis = false});
  final String label;
  final bool emphasis;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return DecoratedBox(
      decoration: BoxDecoration(
        color: emphasis ? scheme.onSurface : scheme.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(AppRadius.pill),
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
        child: Text(
          label,
          style: Theme.of(context).textTheme.labelMedium?.copyWith(
                color: emphasis ? scheme.surface : scheme.onSurface,
                fontWeight: FontWeight.w600,
              ),
        ),
      ),
    );
  }
}

class _MetaLine extends StatelessWidget {
  const _MetaLine({required this.icon, required this.text});
  final IconData icon;
  final String text;

  @override
  Widget build(BuildContext context) {
    final style = Theme.of(context).textTheme.bodySmall;
    return Padding(
      padding: const EdgeInsets.only(top: 2),
      child: Row(children: [
        Icon(icon, size: 16, color: style?.color),
        const SizedBox(width: 6),
        Expanded(child: Text(text, style: style, maxLines: 1, overflow: TextOverflow.ellipsis)),
      ]),
    );
  }
}

class _Stat extends StatelessWidget {
  const _Stat({required this.icon, required this.text});
  final IconData icon;
  final String text;

  @override
  Widget build(BuildContext context) {
    final style = Theme.of(context).textTheme.bodySmall;
    return Row(mainAxisSize: MainAxisSize.min, children: [
      Icon(icon, size: 15, color: style?.color),
      const SizedBox(width: 4),
      Text(text, style: style),
    ]);
  }
}
