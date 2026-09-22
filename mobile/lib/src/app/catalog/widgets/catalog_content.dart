import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:fazbrike/src/app/catalog/controllers/catalog_controller.dart';
import 'package:fazbrike/src/shared/widgets/empty_view.dart';
import 'package:fazbrike/src/shared/widgets/error_view.dart';
import 'package:fazbrike/src/shared/widgets/loading_view.dart';
import 'package:fazbrike/src/shared/widgets/product_card.dart';

class CatalogContent extends ConsumerWidget {
  const CatalogContent({super.key, required this.onRetry});
  final VoidCallback onRetry;
  @override
  Widget build(BuildContext context, WidgetRef ref) => ref.watch(catalogListProvider).when(
        loading: () => const LoadingView(),
        error: (error, _) => ErrorView(message: error.toString(), onRetry: onRetry),
        data: (page) => page.results.isEmpty
            ? const EmptyView(title: 'Nenhum produto encontrado', description: 'Tente outro filtro, categoria ou termo de busca.')
            : ProductGrid(items: page.results),
      );
}
