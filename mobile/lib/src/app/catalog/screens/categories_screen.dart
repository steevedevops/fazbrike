import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:fazbrike/src/app/catalog/controllers/catalog_controller.dart';
import 'package:fazbrike/src/app/catalog/widgets/category_photo_card.dart';
import 'package:fazbrike/src/shared/widgets/empty_view.dart';
import 'package:fazbrike/src/shared/widgets/error_view.dart';
import 'package:fazbrike/src/shared/widgets/loading_view.dart';
import 'package:fazbrike/src/theme/app_spacing.dart';

/// Todas as categorias em grade com foto — o "ver todas" da home.
class CategoriesScreen extends ConsumerStatefulWidget {
  const CategoriesScreen({super.key});
  static const path = '/categorias';

  @override
  ConsumerState<CategoriesScreen> createState() => _CategoriesScreenState();
}

class _CategoriesScreenState extends ConsumerState<CategoriesScreen> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() => ref.read(categoriesProvider.notifier).list());
  }

  @override
  Widget build(BuildContext context) {
    final categories = ref.watch(categoriesProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Categorias')),
      body: categories.when(
        loading: () => const LoadingView(),
        error: (error, _) => ErrorView(
          message: error.toString(),
          onRetry: () => ref.read(categoriesProvider.notifier).list(),
        ),
        data: (page) => page.results.isEmpty
            ? const EmptyView(
                title: 'Nenhuma categoria',
                description: 'As categorias aparecem aqui assim que forem cadastradas.',
              )
            : GridView.builder(
                padding: const EdgeInsets.all(AppSpacing.lg),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  crossAxisSpacing: AppSpacing.md,
                  mainAxisSpacing: AppSpacing.lg,
                  childAspectRatio: .86,
                ),
                itemCount: page.results.length,
                itemBuilder: (_, index) {
                  final category = page.results[index];
                  return CategoryPhotoCard(
                    slug: category.icon.isNotEmpty ? category.icon : category.slug,
                    name: category.name,
                    aspectRatio: 4 / 3,
                    onTap: () => context.push(
                      '/catalogo?category=${Uri.encodeQueryComponent(category.slug)}'
                      '&title=${Uri.encodeQueryComponent(category.name)}',
                    ),
                  );
                },
              ),
      ),
    );
  }
}
