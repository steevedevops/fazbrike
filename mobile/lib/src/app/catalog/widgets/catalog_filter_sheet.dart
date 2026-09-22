import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:fazbrike/src/app/catalog/controllers/catalog_controller.dart';
import 'package:fazbrike/src/theme/app_spacing.dart';

class CatalogFilterSheet extends ConsumerStatefulWidget {
  const CatalogFilterSheet({super.key, required this.initial});
  final Map<String, dynamic> initial;
  @override
  ConsumerState<CatalogFilterSheet> createState() => _CatalogFilterSheetState();
}

class _CatalogFilterSheetState extends ConsumerState<CatalogFilterSheet> {
  late Map<String, dynamic> values;
  late final TextEditingController minPrice;
  late final TextEditingController maxPrice;
  @override
  void initState() {
    super.initState();
    values = Map.of(widget.initial);
    minPrice = TextEditingController(text: values['min_price']?.toString() ?? '');
    maxPrice = TextEditingController(text: values['max_price']?.toString() ?? '');
  }
  @override
  void dispose() { minPrice.dispose(); maxPrice.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    final categories = ref.watch(categoriesProvider).value?.results ?? [];
    final states = ref.watch(statesProvider).value?.results ?? [];
    final cities = ref.watch(citiesProvider).value?.results ?? [];
    return Scaffold(
      appBar: AppBar(
        title: const Text('Filtros'),
        actions: [TextButton(onPressed: () => setState(() { values.clear(); minPrice.clear(); maxPrice.clear(); }), child: const Text('Limpar'))],
      ),
      body: ListView(
        padding: const EdgeInsets.all(AppSpacing.lg),
        children: [
          DropdownButtonFormField<String>(
            initialValue: values['listing_type']?.toString(),
            decoration: const InputDecoration(labelText: 'Tipo de anúncio'),
            items: const [
              DropdownMenuItem(value: 'item', child: Text('Itens')),
              DropdownMenuItem(value: 'vehicle', child: Text('Veículos')),
              DropdownMenuItem(value: 'property', child: Text('Imóveis')),
            ],
            onChanged: (value) => setState(() => values['listing_type'] = value),
          ),
          const SizedBox(height: AppSpacing.md),
          DropdownButtonFormField<String>(
            initialValue: values['category']?.toString(),
            decoration: const InputDecoration(labelText: 'Categoria'),
            isExpanded: true,
            items: [for (final category in categories) DropdownMenuItem(value: category.slug, child: Text(category.name))],
            onChanged: (value) => setState(() => values['category'] = value),
          ),
          const SizedBox(height: AppSpacing.md),
          DropdownButtonFormField<String>(
            initialValue: values['condition']?.toString(),
            decoration: const InputDecoration(labelText: 'Condição'),
            items: const [
              DropdownMenuItem(value: 'new', child: Text('Novo')),
              DropdownMenuItem(value: 'used_like_new', child: Text('Usado — como novo')),
              DropdownMenuItem(value: 'used_good', child: Text('Usado — bom')),
              DropdownMenuItem(value: 'used_fair', child: Text('Usado — aceitável')),
            ],
            onChanged: (value) => setState(() => values['condition'] = value),
          ),
          const SizedBox(height: AppSpacing.md),
          Row(children: [
            Expanded(child: TextField(controller: minPrice, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Preço mínimo'))),
            const SizedBox(width: AppSpacing.sm),
            Expanded(child: TextField(controller: maxPrice, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Preço máximo'))),
          ]),
          const SizedBox(height: AppSpacing.md),
          DropdownButtonFormField<int>(
            initialValue: int.tryParse(values['state_id']?.toString() ?? ''),
            decoration: const InputDecoration(labelText: 'Estado'),
            items: [for (final state in states) DropdownMenuItem(value: state.id, child: Text('${state.name} (${state.code})'))],
            onChanged: (value) {
              setState(() { values['state_id'] = value; values.remove('city_id'); });
              if (value != null) ref.read(citiesProvider.notifier).list(value);
            },
          ),
          const SizedBox(height: AppSpacing.md),
          DropdownButtonFormField<int>(
            initialValue: int.tryParse(values['city_id']?.toString() ?? ''),
            decoration: const InputDecoration(labelText: 'Cidade'),
            items: [for (final city in cities) DropdownMenuItem(value: city.id, child: Text(city.name))],
            onChanged: (value) => setState(() => values['city_id'] = value),
          ),
          const SizedBox(height: AppSpacing.md),
          DropdownButtonFormField<String>(
            initialValue: values['sort_by'] == 'price' ? '${values['order']}' : 'recent',
            decoration: const InputDecoration(labelText: 'Ordenar'),
            items: const [
              DropdownMenuItem(value: 'recent', child: Text('Mais recentes')),
              DropdownMenuItem(value: 'asc', child: Text('Menor preço')),
              DropdownMenuItem(value: 'desc', child: Text('Maior preço')),
            ],
            onChanged: (value) => setState(() {
              if (value == 'recent') { values['sort_by'] = 'date'; values['order'] = 'desc'; }
              else { values['sort_by'] = 'price'; values['order'] = value; }
            }),
          ),
          const SizedBox(height: AppSpacing.xl),
          FilledButton(onPressed: () {
            if (minPrice.text.trim().isNotEmpty) {
              values['min_price'] = minPrice.text.trim();
            } else {
              values.remove('min_price');
            }
            if (maxPrice.text.trim().isNotEmpty) {
              values['max_price'] = maxPrice.text.trim();
            } else {
              values.remove('max_price');
            }
            values.removeWhere((_, value) => value == null || value == '');
            Navigator.pop(context, values);
          }, child: const Text('Aplicar filtros')),
        ],
      ),
    );
  }
}
