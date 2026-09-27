import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:fazbrike/src/app/catalog/controllers/catalog_controller.dart';
import 'package:fazbrike/src/app/catalog/widgets/catalog_content.dart';
import 'package:fazbrike/src/app/catalog/widgets/catalog_filter_sheet.dart';
import 'package:fazbrike/src/app/catalog/widgets/category_chips.dart';
import 'package:fazbrike/src/app/catalog/models/catalog_models.dart';
import 'package:fazbrike/src/theme/app_spacing.dart';

class CatalogScreen extends ConsumerStatefulWidget {
  const CatalogScreen({super.key, this.category = '', this.search = '', this.title = 'Todos os anúncios', this.priceAscending = false});
  static const path = '/catalogo';
  final String category;
  final String search;
  final String title;
  final bool priceAscending;

  @override
  ConsumerState<CatalogScreen> createState() => _CatalogScreenState();
}

class _CatalogScreenState extends ConsumerState<CatalogScreen> {
  late Map<String, dynamic> filters;
  late final TextEditingController search;

  @override
  void initState() {
    super.initState();
    search = TextEditingController(text: widget.search);
    filters = {
      if (widget.category.isNotEmpty) 'category': widget.category,
      if (widget.search.isNotEmpty) 'search': widget.search,
      if (widget.priceAscending) ...{'sort_by': 'price', 'order': 'asc'},
    };
    Future.microtask(() {
      ref.read(categoriesProvider.notifier).list();
      ref.read(statesProvider.notifier).list();
      ref.read(catalogListProvider.notifier).list(query: filters);
    });
  }

  @override
  void dispose() { search.dispose(); super.dispose(); }

  Future<void> _submitSearch(String value) async {
    final term = value.trim();
    setState(() {
      if (term.isEmpty) {
        filters.remove('search');
      } else {
        filters['search'] = term;
      }
    });
    await ref.read(catalogListProvider.notifier).list(query: filters);
  }

  Future<void> _clearSearch() async {
    search.clear();
    setState(() => filters.remove('search'));
    await ref.read(catalogListProvider.notifier).list(query: filters);
  }

  /// Filtro rápido pelo trilho de categorias, sem abrir a folha de filtros.
  Future<void> _selectCategory(CategoryModel? category) async {
    setState(() {
      if (category == null) {
        filters.remove('category');
      } else {
        filters['category'] = category.slug;
      }
    });
    await ref.read(catalogListProvider.notifier).list(query: filters);
  }

  Future<void> _openFilters() async {
    final next = await showModalBottomSheet<Map<String, dynamic>>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      builder: (_) => CatalogFilterSheet(initial: filters),
    );
    if (next == null) return;
    setState(() => filters = next);
    await ref.read(catalogListProvider.notifier).list(query: filters);
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(
          title: Text(widget.title),
          actions: [IconButton(onPressed: _openFilters, tooltip: 'Filtros', icon: const Icon(Icons.tune))],
        ),
        body: Column(children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(AppSpacing.lg, AppSpacing.sm, AppSpacing.lg, AppSpacing.sm),
            // TextField em vez de SearchBar: o SearchBar tem tema próprio
            // (pílula elevada) e ignora o inputDecorationTheme do app.
            // O ValueListenableBuilder faz o botão de limpar aparecer enquanto
            // se digita — o controller sozinho não reconstrói a tela.
            child: ValueListenableBuilder<TextEditingValue>(
              valueListenable: search,
              builder: (context, value, _) => TextField(
                controller: search,
                textInputAction: TextInputAction.search,
                onSubmitted: _submitSearch,
                decoration: InputDecoration(
                  hintText: 'Buscar anúncios',
                  prefixIcon: const Icon(Icons.search),
                  suffixIcon: value.text.isEmpty
                      ? null
                      : IconButton(
                          onPressed: _clearSearch,
                          tooltip: 'Limpar busca',
                          icon: const Icon(Icons.close),
                        ),
                ),
              ),
            ),
          ),
          CategoryChips(
            selectedSlug: filters['category']?.toString() ?? '',
            onSelected: _selectCategory,
          ),
          const SizedBox(height: AppSpacing.xs),
          Expanded(child: CatalogContent(onRetry: () => ref.read(catalogListProvider.notifier).retry())),
        ]),
      );
}
