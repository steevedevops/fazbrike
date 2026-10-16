import 'package:flutter/material.dart';
import 'package:fazbrike/src/app/items/widgets/item_attributes.dart';
import 'package:fazbrike/src/theme/app_radius.dart';
import 'package:fazbrike/src/theme/app_spacing.dart';

/// Faixa com os números principais (quartos, banheiros, área / ano, km...).
class ItemKeyFacts extends StatelessWidget {
  const ItemKeyFacts({super.key, required this.facts});
  final List<ItemFact> facts;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return DecoratedBox(
      decoration: BoxDecoration(
        border: Border.all(color: scheme.outlineVariant),
        borderRadius: BorderRadius.circular(AppRadius.card),
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: AppSpacing.md, horizontal: AppSpacing.xs),
        child: IntrinsicHeight(
          child: Row(children: [
            for (var index = 0; index < facts.length; index++) ...[
              if (index > 0) VerticalDivider(width: 1, color: scheme.outlineVariant),
              Expanded(child: _FactTile(fact: facts[index])),
            ],
          ]),
        ),
      ),
    );
  }
}

class _FactTile extends StatelessWidget {
  const _FactTile({required this.fact});
  final ItemFact fact;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.xs),
      child: Column(children: [
        Icon(fact.icon, size: 22, color: theme.colorScheme.onSurface),
        const SizedBox(height: AppSpacing.xs),
        Text(fact.value, style: theme.textTheme.titleSmall, maxLines: 1, overflow: TextOverflow.ellipsis, textAlign: TextAlign.center),
        Text(fact.label, style: theme.textTheme.bodySmall, maxLines: 1, overflow: TextOverflow.ellipsis, textAlign: TextAlign.center),
      ]),
    );
  }
}
