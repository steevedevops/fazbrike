import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:fazbrike/src/app/items/controllers/item_controller.dart';
import 'package:fazbrike/src/app/items/models/item_model.dart';
import 'package:fazbrike/src/shared/widgets/product_card.dart';
import 'package:fazbrike/src/theme/app_radius.dart';
import 'package:fazbrike/src/theme/app_spacing.dart';

const _cardWidth = 200.0;
const _railHeight = 292.0;

/// Trilho horizontal com anúncios parecidos ("Imóveis relacionados" quando o
/// anúncio aberto é um imóvel). Vai até a borda da tela, por isso recebe o
/// padding lateral em vez de herdar o da lista.
class ItemRelatedSection extends ConsumerWidget {
  const ItemRelatedSection({super.key, required this.item});
  final ItemModel item;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final query = relatedQueryFor(item);
    final (title, empty) = switch (item.listingType) {
      'property' => ('Imóveis relacionados', 'Nenhum outro imóvel parecido no momento.'),
      'vehicle' => ('Veículos relacionados', 'Nenhum outro veículo parecido no momento.'),
      _ => ('Anúncios relacionados', 'Nenhum anúncio parecido no momento.'),
    };
    final subtitle = item.listingType == 'property'
        ? 'Mesma região, finalidade e faixa de preço'
        : 'Mesma categoria e faixa de preço';

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(title, style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 2),
            Text(subtitle, style: Theme.of(context).textTheme.bodySmall),
          ]),
        ),
        const SizedBox(height: AppSpacing.md),
        ref.watch(relatedItemsProvider(query)).when(
              loading: () => const _RelatedLoading(),
              error: (error, _) => _RelatedMessage(
                message: error.toString(),
                onRetry: () => ref.read(relatedItemsProvider(query).notifier).list(),
              ),
              data: (page) => page.results.isEmpty
                  ? _RelatedMessage(message: empty)
                  : SizedBox(
                      height: _railHeight,
                      child: ListView.separated(
                        scrollDirection: Axis.horizontal,
                        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
                        itemCount: page.results.length,
                        separatorBuilder: (_, __) => const SizedBox(width: AppSpacing.sm),
                        itemBuilder: (_, index) => SizedBox(width: _cardWidth, child: ProductCard(item: page.results[index])),
                      ),
                    ),
            ),
      ],
    );
  }
}

class _RelatedLoading extends StatelessWidget {
  const _RelatedLoading();

  @override
  Widget build(BuildContext context) {
    final color = Theme.of(context).colorScheme.surfaceContainerHighest;
    return SizedBox(
      height: _railHeight,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        physics: const NeverScrollableScrollPhysics(),
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
        itemCount: 3,
        separatorBuilder: (_, __) => const SizedBox(width: AppSpacing.sm),
        itemBuilder: (_, __) => Container(
          width: _cardWidth,
          decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(AppRadius.card)),
        ),
      ),
    );
  }
}

class _RelatedMessage extends StatelessWidget {
  const _RelatedMessage({required this.message, this.onRetry});
  final String message;
  final VoidCallback? onRetry;

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
        child: Row(children: [
          Expanded(child: Text(message, style: Theme.of(context).textTheme.bodySmall, maxLines: 2, overflow: TextOverflow.ellipsis)),
          if (onRetry != null) TextButton(onPressed: onRetry, child: const Text('Tentar de novo')),
        ]),
      );
}
