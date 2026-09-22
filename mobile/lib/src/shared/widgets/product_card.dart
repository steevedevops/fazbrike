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

class ProductCard extends ConsumerWidget {
  const ProductCard({super.key, required this.item, this.compact = false});
  final ItemModel item;
  final bool compact;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return InkWell(
      borderRadius: BorderRadius.circular(AppRadius.card),
      onTap: () => context.push('/produto/${item.id}'),
      child: Card(
        clipBehavior: Clip.antiAlias,
        child: compact ? _horizontal(context, ref) : _vertical(context, ref),
      ),
    );
  }

  Widget _favorite(BuildContext context, WidgetRef ref) => IconButton.filledTonal(
        tooltip: item.isFavorited ? 'Remover dos favoritos' : 'Salvar nos favoritos',
        onPressed: () async {
          if (sessionSignal.value != SessionStatus.authenticated) {
            context.go('/login');
            return;
          }
          try {
            await ref.read(itemFormProvider.notifier).toggleFavorite(item);
          } catch (error) {
            if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(error.toString())));
          }
        },
        icon: Icon(item.isFavorited ? Icons.favorite : Icons.favorite_border, size: 19),
      );

  Widget _vertical(BuildContext context, WidgetRef ref) => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          AspectRatio(
            aspectRatio: 4 / 3,
            child: Stack(
              fit: StackFit.expand,
              children: [
                RemoteImage(url: item.imageUrl, fallbackAsset: categoryAsset(item.category)),
                Positioned(top: 6, right: 6, child: _favorite(context, ref)),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(AppSpacing.md),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(formatPrice(item.price), style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 3),
                Text(item.title, maxLines: 2, overflow: TextOverflow.ellipsis),
                if (item.location.isNotEmpty) ...[
                  const SizedBox(height: 5),
                  Text(item.location, style: Theme.of(context).textTheme.bodySmall),
                ],
              ],
            ),
          ),
        ],
      );

  Widget _horizontal(BuildContext context, WidgetRef ref) => SizedBox(
        height: 126,
        child: Row(
          children: [
            SizedBox(
              width: 132,
              child: RemoteImage(url: item.imageUrl, fallbackAsset: categoryAsset(item.category)),
            ),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(AppSpacing.md),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(children: [
                      Expanded(child: Text(formatPrice(item.price), style: Theme.of(context).textTheme.titleMedium)),
                      _favorite(context, ref),
                    ]),
                    Text(item.title, maxLines: 2, overflow: TextOverflow.ellipsis),
                    const Spacer(),
                    Text(item.location, style: Theme.of(context).textTheme.bodySmall),
                  ],
                ),
              ),
            ),
          ],
        ),
      );
}

class ProductGrid extends StatelessWidget {
  const ProductGrid({super.key, required this.items, this.compact = false});
  final List<ItemModel> items;
  final bool compact;
  @override
  Widget build(BuildContext context) {
    if (compact) {
      return ListView.separated(
        padding: const EdgeInsets.all(AppSpacing.lg),
        itemCount: items.length,
        separatorBuilder: (_, __) => const SizedBox(height: AppSpacing.sm),
        itemBuilder: (_, index) => ProductCard(item: items[index], compact: true),
      );
    }
    return GridView.builder(
      padding: const EdgeInsets.all(AppSpacing.lg),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        childAspectRatio: .68,
        crossAxisSpacing: AppSpacing.sm,
        mainAxisSpacing: AppSpacing.sm,
      ),
      itemCount: items.length,
      itemBuilder: (_, index) => ProductCard(item: items[index]),
    );
  }
}
