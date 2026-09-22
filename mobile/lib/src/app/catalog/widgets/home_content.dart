import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:fazbrike/src/app/catalog/controllers/catalog_controller.dart';
import 'package:fazbrike/src/shared/widgets/error_view.dart';
import 'package:fazbrike/src/shared/widgets/loading_view.dart';
import 'package:fazbrike/src/shared/widgets/category_card.dart';
import 'package:fazbrike/src/shared/widgets/product_card.dart';
import 'package:fazbrike/src/theme/app_colors.dart';
import 'package:fazbrike/src/theme/app_radius.dart';
import 'package:fazbrike/src/theme/app_spacing.dart';

class HomeContent extends ConsumerWidget {
  const HomeContent({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final categories = ref.watch(categoriesProvider);
    final items = ref.watch(catalogListProvider);
    return RefreshIndicator(
      onRefresh: () async {
        await Future.wait([
          ref.read(categoriesProvider.notifier).list(),
          ref.read(catalogListProvider.notifier).list(query: {'sort_by': 'date', 'order': 'desc'}),
        ]);
      },
      child: ListView(
        padding: const EdgeInsets.only(bottom: AppSpacing.xxl),
        children: [
          _Hero(onSearch: (value) => context.push('/catalogo?search=${Uri.encodeQueryComponent(value)}')),
          _SectionTitle(
            title: 'Categorias',
            subtitle: 'Escolha uma categoria para começar',
            actionLabel: 'Ver todas',
            onAction: () => context.push('/catalogo'),
          ),
          categories.when(
            loading: () => const SizedBox(height: 160, child: LoadingView()),
            error: (error, _) => ErrorView(message: error.toString(), onRetry: () => ref.read(categoriesProvider.notifier).list()),
            data: (page) {
              // A home do site mostra 8 categorias; o resto fica em "Ver todas".
              final visible = page.results.take(8).toList();
              return GridView.builder(
                padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  crossAxisSpacing: AppSpacing.sm,
                  mainAxisSpacing: AppSpacing.sm,
                  mainAxisExtent: 68,
                ),
                itemCount: visible.length,
                itemBuilder: (_, index) {
                  final category = visible[index];
                  return CategoryCard(
                    slug: category.slug,
                    iconSlug: category.icon,
                    name: category.name,
                    onTap: () => context.push('/catalogo?category=${Uri.encodeQueryComponent(category.slug)}&title=${Uri.encodeQueryComponent(category.name)}'),
                  );
                },
              );
            },
          ),
          const _SectionTitle(title: 'Novidades', subtitle: 'Acabaram de chegar na vitrine'),
          items.when(
            loading: () => const SizedBox(height: 240, child: LoadingView()),
            error: (error, _) => ErrorView(message: error.toString(), onRetry: () => ref.read(catalogListProvider.notifier).retry()),
            data: (page) => page.results.isEmpty
                ? const Padding(padding: EdgeInsets.all(AppSpacing.xl), child: Text('Nenhum anúncio disponível agora.'))
                : GridView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 2,
                      childAspectRatio: .68,
                      crossAxisSpacing: AppSpacing.sm,
                      mainAxisSpacing: AppSpacing.sm,
                    ),
                    itemCount: page.results.length > 8 ? 8 : page.results.length,
                    itemBuilder: (_, index) => ProductCard(item: page.results[index]),
                  ),
          ),
        ],
      ),
    );
  }
}

class _Hero extends StatefulWidget {
  const _Hero({required this.onSearch});
  final ValueChanged<String> onSearch;
  @override
  State<_Hero> createState() => _HeroState();
}

class _HeroState extends State<_Hero> {
  final controller = TextEditingController();
  @override
  void dispose() { controller.dispose(); super.dispose(); }
  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    return Container(
      margin: const EdgeInsets.all(AppSpacing.lg),
      padding: const EdgeInsets.all(AppSpacing.xl),
      decoration: BoxDecoration(
        color: AppColors.ink,
        borderRadius: BorderRadius.circular(AppRadius.card),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(
          'Compre. Venda. Conecte.',
          style: textTheme.headlineMedium?.copyWith(color: Colors.white),
        ),
        const SizedBox(height: AppSpacing.sm),
        Text(
          'Descubra produtos e venda o que você não usa mais.',
          style: textTheme.bodyLarge?.copyWith(color: Colors.white.withValues(alpha: .8)),
        ),
        const SizedBox(height: AppSpacing.lg),
        // TextField comum em vez de SearchBar: o SearchBar tem tema próprio e
        // ignora o inputDecorationTheme, saindo do padrão de input do site.
        TextField(
          controller: controller,
          textInputAction: TextInputAction.search,
          onSubmitted: widget.onSearch,
          decoration: const InputDecoration(
            hintText: 'O que você procura?',
            prefixIcon: Icon(Icons.search),
          ),
        ),
      ]),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  const _SectionTitle({
    required this.title,
    required this.subtitle,
    this.actionLabel,
    this.onAction,
  });
  final String title;
  final String subtitle;
  final String? actionLabel;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.fromLTRB(AppSpacing.lg, AppSpacing.xl, AppSpacing.lg, AppSpacing.md),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(title, style: Theme.of(context).textTheme.titleLarge),
                Text(subtitle, style: Theme.of(context).textTheme.bodySmall),
              ]),
            ),
            if (actionLabel != null && onAction != null)
              TextButton(
                onPressed: onAction,
                style: TextButton.styleFrom(
                  foregroundColor: AppColors.muted,
                  padding: const EdgeInsets.symmetric(horizontal: AppSpacing.sm),
                  minimumSize: const Size(0, 36),
                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                  textStyle: Theme.of(context).textTheme.bodySmall,
                ),
                child: Text(actionLabel!),
              ),
          ],
        ),
      );
}
