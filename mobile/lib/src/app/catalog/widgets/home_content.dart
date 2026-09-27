import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:fazbrike/src/app/catalog/controllers/catalog_controller.dart';
import 'package:fazbrike/src/app/catalog/models/catalog_models.dart';
import 'package:fazbrike/src/app/catalog/screens/categories_screen.dart';
import 'package:fazbrike/src/app/catalog/widgets/category_photo_card.dart';
import 'package:fazbrike/src/app/items/models/item_model.dart';
import 'package:fazbrike/src/app/promotions/widgets/promotion_slider.dart';
import 'package:fazbrike/src/shared/models/paginator_model.dart';
import 'package:fazbrike/src/shared/widgets/error_view.dart';
import 'package:fazbrike/src/shared/widgets/section_header.dart';
import 'package:fazbrike/src/shared/widgets/showcase_card.dart';
import 'package:fazbrike/src/theme/app_colors.dart';
import 'package:fazbrike/src/theme/app_radius.dart';
import 'package:fazbrike/src/theme/app_spacing.dart';

/// Corpo da home: destaque, categorias e vitrines em carrossel. Rola dentro do
/// `CustomScrollView` da tela, por isso não traz scroll próprio.
class HomeContent extends ConsumerWidget {
  const HomeContent({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: AppSpacing.md),
        const PromotionSlider(fallback: HomeHighlight()),
        const _CategoryRail(),
        _ItemRail(
          title: 'Novidades',
          subtitle: 'Acabaram de chegar na vitrine',
          provider: homeLatestProvider,
          destination: '/novidades',
        ),
        _ItemRail(
          title: 'Menores preços',
          subtitle: 'Oportunidades a partir de quanto custa menos',
          provider: homeDealsProvider,
          destination: '/promocoes',
        ),
        Padding(
          padding: const EdgeInsets.fromLTRB(AppSpacing.lg, AppSpacing.xl, AppSpacing.lg, AppSpacing.xxl),
          child: SizedBox(
            width: double.infinity,
            child: OutlinedButton(
              onPressed: () => context.push('/catalogo'),
              child: const Text('Ver todos os anúncios'),
            ),
          ),
        ),
      ],
    );
  }
}

/// Destaque padrão quando não há campanha cadastrada no admin — a home nunca
/// abre com um buraco no lugar do banner.
class HomeHighlight extends StatelessWidget {
  const HomeHighlight({super.key});

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
      child: Container(
        padding: const EdgeInsets.all(AppSpacing.xl),
        decoration: BoxDecoration(
          color: AppColors.ink,
          borderRadius: BorderRadius.circular(AppRadius.card),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Compre. Venda. Conecte.',
              style: textTheme.headlineSmall?.copyWith(color: Colors.white),
            ),
            const SizedBox(height: AppSpacing.sm),
            Text(
              'Anuncie o que você não usa mais e negocie direto com quem compra.',
              style: textTheme.bodySmall?.copyWith(color: Colors.white.withValues(alpha: .8)),
            ),
            const SizedBox(height: AppSpacing.lg),
            FilledButton(
              onPressed: () => context.push('/vender'),
              child: const Text('Vender um item'),
            ),
          ],
        ),
      ),
    );
  }
}

class _CategoryRail extends ConsumerWidget {
  const _CategoryRail();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final categories = ref.watch(categoriesProvider);
    final results = categories.asData?.value.results ?? const <CategoryModel>[];
    if (results.isEmpty) return const SizedBox.shrink();

    final visible = results.take(10).toList();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SectionHeader(
          title: 'Explorar por categoria',
          subtitle: 'Escolha por onde começar',
          actionLabel: 'ver todas',
          onAction: () => context.push(CategoriesScreen.path),
        ),
        SizedBox(
          // Foto (104) + respiro + duas linhas de rótulo.
          height: 164,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
            itemCount: visible.length,
            separatorBuilder: (_, __) => const SizedBox(width: AppSpacing.md),
            itemBuilder: (_, index) {
              final category = visible[index];
              return CategoryPhotoCard(
                width: 104,
                slug: category.icon.isNotEmpty ? category.icon : category.slug,
                name: category.name,
                onTap: () => context.push(
                  '/catalogo?category=${Uri.encodeQueryComponent(category.slug)}'
                  '&title=${Uri.encodeQueryComponent(category.name)}',
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}

class _ItemRail extends ConsumerWidget {
  const _ItemRail({
    required this.title,
    required this.subtitle,
    required this.provider,
    required this.destination,
  });

  final String title;
  final String subtitle;
  final StateNotifierProvider<HomeFeedNotifier, AsyncValue<PaginatorModel<ItemModel>>> provider;
  final String destination;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final feed = ref.watch(provider);

    return feed.when(
      loading: () => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SectionHeader(title: title, subtitle: subtitle),
          const _RailSkeleton(),
        ],
      ),
      error: (error, _) => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SectionHeader(title: title, subtitle: subtitle),
          SizedBox(
            height: 200,
            child: ErrorView(
              message: error.toString(),
              onRetry: () => ref.read(provider.notifier).list(),
            ),
          ),
        ],
      ),
      data: (page) {
        if (page.results.isEmpty) return const SizedBox.shrink();
        final visible = page.results.take(10).toList();
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SectionHeader(
              title: title,
              subtitle: subtitle,
              actionLabel: 'ver todos',
              onAction: () => context.push(destination),
            ),
            SizedBox(
              height: 262,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
                itemCount: visible.length,
                separatorBuilder: (_, __) => const SizedBox(width: AppSpacing.md),
                itemBuilder: (_, index) => ShowcaseCard(item: visible[index]),
              ),
            ),
          ],
        );
      },
    );
  }
}

class _RailSkeleton extends StatelessWidget {
  const _RailSkeleton();

  @override
  Widget build(BuildContext context) {
    final color = Theme.of(context).inputDecorationTheme.fillColor ??
        Theme.of(context).colorScheme.surfaceContainerHighest;
    return SizedBox(
      height: 262,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
        itemCount: 3,
        separatorBuilder: (_, __) => const SizedBox(width: AppSpacing.md),
        itemBuilder: (_, __) => Container(
          width: 158,
          decoration: BoxDecoration(
            color: color,
            borderRadius: BorderRadius.circular(AppRadius.card),
          ),
        ),
      ),
    );
  }
}
