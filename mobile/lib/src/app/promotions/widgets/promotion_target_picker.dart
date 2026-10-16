import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:fazbrike/src/app/catalog/controllers/catalog_controller.dart';
import 'package:fazbrike/src/app/catalog/models/catalog_models.dart';
import 'package:fazbrike/src/app/items/models/item_model.dart';
import 'package:fazbrike/src/app/profile/controllers/profile_controller.dart';
import 'package:fazbrike/src/app/promotions/models/promotion_model.dart';
import 'package:fazbrike/src/theme/app_radius.dart';
import 'package:fazbrike/src/theme/app_spacing.dart';

/// Destino escolhido no formulário. Guarda o tipo e o complemento (anúncio,
/// categoria ou termo) do jeito que o backend espera.
class PromotionTargetDraft {
  const PromotionTargetDraft({this.type = PromotionTargetType.profile, this.itemId, this.value = ''});

  final String type;
  final int? itemId;
  final String value;

  PromotionTargetDraft copyWith({String? type, int? itemId, String? value, bool clearItem = false}) =>
      PromotionTargetDraft(
        type: type ?? this.type,
        itemId: clearItem ? null : (itemId ?? this.itemId),
        value: value ?? this.value,
      );

  /// Mensagem de erro quando falta escolher o complemento do destino.
  String? get validationError {
    switch (type) {
      case PromotionTargetType.item:
        return itemId == null ? 'Escolha qual anúncio o banner vai abrir.' : null;
      case PromotionTargetType.category:
        return value.isEmpty ? 'Escolha a categoria de destino.' : null;
      case PromotionTargetType.search:
        return value.trim().length < 2 ? 'Escreva o termo de busca (mínimo 2 letras).' : null;
      default:
        return null;
    }
  }

  Map<String, dynamic> toJson() => {
        'target_type': type,
        'target_id': type == PromotionTargetType.item ? itemId : null,
        'target_value': type == PromotionTargetType.category || type == PromotionTargetType.search
            ? value.trim()
            : '',
      };
}

const _options = [
  (type: PromotionTargetType.profile, label: 'Minha loja', icon: Icons.storefront_outlined),
  (type: PromotionTargetType.item, label: 'Um anúncio meu', icon: Icons.sell_outlined),
  (type: PromotionTargetType.category, label: 'Categoria', icon: Icons.grid_view_outlined),
  (type: PromotionTargetType.search, label: 'Busca', icon: Icons.search),
  (type: PromotionTargetType.none, label: 'Sem destino', icon: Icons.block_outlined),
];

/// Seletor do destino do banner. Só oferece destinos internos: campanha de
/// anunciante não aponta para fora da plataforma.
class PromotionTargetPicker extends ConsumerWidget {
  const PromotionTargetPicker({super.key, required this.draft, required this.onChanged});

  final PromotionTargetDraft draft;
  final ValueChanged<PromotionTargetDraft> onChanged;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Para onde o banner leva',
          style: theme.textTheme.bodySmall?.copyWith(
            fontWeight: FontWeight.w500,
            color: theme.colorScheme.onSurface,
          ),
        ),
        const SizedBox(height: AppSpacing.sm),
        Wrap(
          spacing: AppSpacing.sm,
          runSpacing: AppSpacing.sm,
          children: _options.map((option) {
            final selected = draft.type == option.type;
            return _TypeChip(
              label: option.label,
              icon: option.icon,
              selected: selected,
              onTap: () => onChanged(draft.copyWith(type: option.type, value: '', clearItem: true)),
            );
          }).toList(),
        ),
        const SizedBox(height: AppSpacing.md),
        _complement(context, ref),
      ],
    );
  }

  Widget _complement(BuildContext context, WidgetRef ref) {
    switch (draft.type) {
      case PromotionTargetType.profile:
        return _Hint(text: 'Quem tocar no banner cai na sua loja, dentro do app ou do site.');

      case PromotionTargetType.none:
        return _Hint(text: 'O banner aparece, mas não abre nada ao ser tocado.');

      case PromotionTargetType.item:
        final items = ref.watch(myItemsListProvider);
        final active = items.asData?.value.results.where((item) => item.status == 'active').toList() ??
            const <ItemModel>[];
        if (active.isEmpty) {
          return _Hint(text: 'Você ainda não tem anúncio ativo para destacar.');
        }
        return DropdownButtonFormField<int>(
          initialValue: draft.itemId,
          isExpanded: true,
          decoration: const InputDecoration(labelText: 'Anúncio de destino'),
          items: active
              .map((item) => DropdownMenuItem(
                    value: item.id,
                    child: Text(item.title, maxLines: 1, overflow: TextOverflow.ellipsis),
                  ))
              .toList(),
          onChanged: (value) => onChanged(draft.copyWith(itemId: value)),
        );

      case PromotionTargetType.category:
        final categories = ref.watch(categoriesProvider);
        final results = categories.asData?.value.results ?? const <CategoryModel>[];
        if (results.isEmpty) return const SizedBox.shrink();
        return DropdownButtonFormField<String>(
          initialValue: draft.value.isEmpty ? null : draft.value,
          isExpanded: true,
          decoration: const InputDecoration(labelText: 'Categoria de destino'),
          items: results
              .map((category) => DropdownMenuItem(
                    value: category.slug,
                    child: Text(category.name, maxLines: 1, overflow: TextOverflow.ellipsis),
                  ))
              .toList(),
          onChanged: (value) => onChanged(draft.copyWith(value: value ?? '')),
        );

      case PromotionTargetType.search:
        return TextFormField(
          initialValue: draft.value,
          decoration: const InputDecoration(
            labelText: 'Termo de busca',
            hintText: 'ex.: bicicleta aro 29',
          ),
          onChanged: (value) => onChanged(draft.copyWith(value: value)),
        );

      default:
        return const SizedBox.shrink();
    }
  }
}

class _TypeChip extends StatelessWidget {
  const _TypeChip({required this.label, required this.icon, required this.selected, required this.onTap});

  final String label;
  final IconData icon;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Material(
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
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(icon, size: 16, color: selected ? theme.colorScheme.surface : theme.colorScheme.onSurface),
                const SizedBox(width: 6),
                Text(
                  label,
                  style: theme.textTheme.bodySmall?.copyWith(
                    fontWeight: FontWeight.w600,
                    color: selected ? theme.colorScheme.surface : theme.colorScheme.onSurface,
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

class _Hint extends StatelessWidget {
  const _Hint({required this.text});
  final String text;
  @override
  Widget build(BuildContext context) => Text(text, style: Theme.of(context).textTheme.bodySmall);
}
