import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:fazbrike/services/session_signal.dart';
import 'package:fazbrike/src/app/items/controllers/item_controller.dart';
import 'package:fazbrike/src/app/items/models/item_model.dart';
import 'package:fazbrike/src/shared/utils/app_utils.dart';
import 'package:fazbrike/src/shared/widgets/remote_image.dart';
import 'package:fazbrike/src/theme/app_radius.dart';
import 'package:fazbrike/src/theme/app_spacing.dart';

/// Card de vitrine para os carrosséis da home: a foto ocupa o card inteiro e o
/// preço fica numa pílula sobre ela. Mais leve que o [ProductCard] do catálogo,
/// que precisa de título, local e moldura para a leitura em lista.
class ShowcaseCard extends ConsumerWidget {
  const ShowcaseCard({super.key, required this.item, this.width = 158});

  final ItemModel item;
  final double width;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);

    return SizedBox(
      width: width,
      child: InkWell(
        borderRadius: BorderRadius.circular(AppRadius.card),
        onTap: () => context.push('/produto/${item.id}'),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            AspectRatio(
              aspectRatio: 4 / 5,
              child: ClipRRect(
                borderRadius: BorderRadius.circular(AppRadius.card),
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    RemoteImage(url: item.imageUrl, fallbackAsset: categoryAsset(item.category)),
                    Positioned(
                      left: AppSpacing.sm,
                      bottom: AppSpacing.sm,
                      child: _PriceTag(price: item.price),
                    ),
                    Positioned(top: 4, right: 4, child: _FavoriteButton(item: item)),
                  ],
                ),
              ),
            ),
            const SizedBox(height: AppSpacing.sm),
            Text(
              item.title,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurface),
            ),
            if (item.location.isNotEmpty)
              Text(item.location, maxLines: 1, overflow: TextOverflow.ellipsis, style: theme.textTheme.bodySmall),
          ],
        ),
      ),
    );
  }
}

class _PriceTag extends StatelessWidget {
  const _PriceTag({required this.price});

  final double price;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        borderRadius: BorderRadius.circular(AppRadius.pill),
        // Borda fina para a pílula não sumir sobre foto clara.
        border: Border.all(color: theme.dividerColor),
      ),
      child: Text(
        formatPrice(price),
        style: theme.textTheme.bodySmall?.copyWith(
          fontWeight: FontWeight.w700,
          color: theme.colorScheme.onSurface,
        ),
      ),
    );
  }
}

class _FavoriteButton extends ConsumerWidget {
  const _FavoriteButton({required this.item});

  final ItemModel item;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return IconButton(
      tooltip: item.isFavorited ? 'Remover dos favoritos' : 'Salvar nos favoritos',
      visualDensity: VisualDensity.compact,
      style: IconButton.styleFrom(
        backgroundColor: Theme.of(context).colorScheme.surface.withValues(alpha: .85),
        foregroundColor: Theme.of(context).colorScheme.onSurface,
      ),
      onPressed: () async {
        if (sessionSignal.value != SessionStatus.authenticated) {
          context.go('/login');
          return;
        }
        try {
          await ref.read(itemFormProvider.notifier).toggleFavorite(item);
        } catch (error) {
          if (context.mounted) {
            ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(error.toString())));
          }
        }
      },
      icon: Icon(item.isFavorited ? Icons.favorite : Icons.favorite_border, size: 17),
    );
  }
}
