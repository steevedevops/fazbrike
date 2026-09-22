import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:fazbrike/services/api_services.dart';
import 'package:fazbrike/src/app/catalog/controllers/catalog_controller.dart';
import 'package:fazbrike/src/app/catalog/models/catalog_models.dart';
import 'package:fazbrike/src/app/items/controllers/item_controller.dart';
import 'package:fazbrike/src/app/items/models/item_model.dart';
import 'package:fazbrike/src/shared/utils/app_utils.dart';
import 'package:fazbrike/src/shared/widgets/remote_image.dart';
import 'package:fazbrike/src/theme/app_spacing.dart';

class ItemEditorForm extends ConsumerStatefulWidget {
  const ItemEditorForm({super.key, this.initialItem});
  final ItemModel? initialItem;
  @override
  ConsumerState<ItemEditorForm> createState() => _ItemEditorFormState();
}

class _ItemEditorFormState extends ConsumerState<ItemEditorForm> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController title;
  late final TextEditingController price;
  late final TextEditingController description;
  late final TextEditingController brand;
  late final TextEditingController model;
  late final TextEditingController year;
  late final TextEditingController mileage;
  late final TextEditingController bedrooms;
  late final TextEditingController bathrooms;
  late final TextEditingController area;
  String listingType = 'item';
  String category = '';
  String condition = 'new';
  String transmission = '';
  String propertyType = '';
  String listingMode = 'sale';
  String furnished = '';
  String petsAllowed = '';
  int? stateId;
  int? cityId;
  final List<XFile> newPhotos = [];
  final Set<int> removedPhotoIds = {};
  String error = '';

  ItemModel? get item => widget.initialItem;

  @override
  void initState() {
    super.initState();
    final attrs = item?.attributes ?? {};
    title = TextEditingController(text: item?.title ?? '');
    price = TextEditingController(text: item == null ? '' : item!.price.toStringAsFixed(2).replaceAll('.', ','));
    description = TextEditingController(text: item?.description ?? '');
    brand = TextEditingController(text: attrs['brand']?.toString() ?? '');
    model = TextEditingController(text: attrs['model']?.toString() ?? '');
    year = TextEditingController(text: attrs['year']?.toString() ?? '');
    mileage = TextEditingController(text: attrs['mileage']?.toString() ?? '');
    bedrooms = TextEditingController(text: attrs['bedrooms']?.toString() ?? '');
    bathrooms = TextEditingController(text: attrs['bathrooms']?.toString() ?? '');
    area = TextEditingController(text: attrs['area_m2']?.toString() ?? '');
    listingType = item?.listingType ?? 'item';
    category = item?.category ?? '';
    condition = item?.condition.isNotEmpty == true ? item!.condition : 'new';
    transmission = attrs['transmission']?.toString() ?? '';
    propertyType = attrs['property_type']?.toString() ?? '';
    listingMode = attrs['listing_mode']?.toString() ?? 'sale';
    furnished = attrs['furnished']?.toString() ?? '';
    petsAllowed = attrs['pets_allowed']?.toString() ?? '';
    stateId = item?.stateId;
    cityId = item?.cityId;
    Future.microtask(() {
      ref.read(categoriesProvider.notifier).list();
      ref.read(statesProvider.notifier).list();
      if (stateId != null) ref.read(citiesProvider.notifier).list(stateId!);
    });
  }

  @override
  void dispose() {
    for (final controller in [title, price, description, brand, model, year, mileage, bedrooms, bathrooms, area]) {
      controller.dispose();
    }
    super.dispose();
  }

  Future<void> _pickPhotos() async {
    final available = 8 - (item?.images.where((image) => !removedPhotoIds.contains(image.id)).length ?? 0) - newPhotos.length;
    if (available <= 0) {
      return;
    }
    final selected = await ImagePicker().pickMultiImage(imageQuality: 88, limit: available);
    final accepted = <XFile>[];
    for (final file in selected.take(available)) {
      final extension = file.name.split('.').last.toLowerCase();
      final size = await file.length();
      if (const ['jpg', 'jpeg', 'png', 'webp', 'gif'].contains(extension) && size <= 10 * 1024 * 1024) {
        accepted.add(file);
      }
    }
    if (mounted) setState(() {
      newPhotos.addAll(accepted);
      if (accepted.length != selected.length) error = 'Algumas imagens foram ignoradas. Use JPEG, PNG, WebP ou GIF de até 10MB.';
    });
  }

  List<CategoryModel> _flatten(List<CategoryModel> input) => [
        for (final category in input) ...[category, ..._flatten(category.children)],
      ];

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    final parsedPrice = parsePrice(price.text);
    if (parsedPrice == null || cityId == null || category.isEmpty) {
      setState(() => error = parsedPrice == null ? 'Informe um preço válido.' : cityId == null ? 'Selecione a cidade do anúncio.' : 'Selecione a categoria.');
      return;
    }
    final attrs = listingType == 'vehicle'
        ? {'brand': brand.text.trim(), 'model': model.text.trim(), 'year': year.text.trim(), 'mileage': mileage.text.trim(), 'transmission': transmission}
        : listingType == 'property'
            ? {'property_type': propertyType, 'bedrooms': bedrooms.text.trim(), 'bathrooms': bathrooms.text.trim(), 'area_m2': area.text.trim(), 'furnished': furnished, 'pets_allowed': petsAllowed, 'listing_mode': listingMode}
            : <String, String>{};
    attrs.removeWhere((_, value) => value.isEmpty);
    final body = <String, dynamic>{
      'title': title.text.trim(),
      'description': description.text.trim(),
      'price': parsedPrice,
      'category': category,
      'listing_type': listingType,
      'city_id': cityId,
      'condition': condition,
      'attrs': jsonEncode(attrs),
    };
    try {
      final files = newPhotos.map((file) => UploadFile(path: file.path, name: file.name)).toList();
      ItemModel saved;
      if (item == null) {
        saved = await ref.read(itemFormProvider.notifier).create(body, files);
      } else {
        saved = await ref.read(itemFormProvider.notifier).update(item!.id, body);
        for (final imageId in removedPhotoIds) {
          await ref.read(itemFormProvider.notifier).deletePhoto(item!.id, imageId);
        }
        await ref.read(itemFormProvider.notifier).uploadPhotos(item!.id, files);
        await ref.read(itemDetailProvider(item!.id).notifier).load();
      }
      if (mounted) context.go('/produto/${saved.id}');
    } catch (exception) {
      if (mounted) setState(() => error = exception.toString());
    }
  }

  @override
  Widget build(BuildContext context) {
    final categories = _flatten(ref.watch(categoriesProvider).value?.results ?? [])
        .where((value) => value.listingType == listingType || value.listingType == 'all')
        .toList();
    final states = ref.watch(statesProvider).value?.results ?? [];
    final cities = ref.watch(citiesProvider).value?.results ?? [];
    final busy = ref.watch(itemFormProvider).isLoading;
    final existing = item?.images.where((image) => !removedPhotoIds.contains(image.id)).toList() ?? [];
    return Form(
      key: _formKey,
      child: ListView(
        padding: const EdgeInsets.all(AppSpacing.lg),
        children: [
          Text(item == null ? 'Publique em poucos minutos' : 'Atualize seu anúncio', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: AppSpacing.lg),
          if (error.isNotEmpty) ...[Text(error, style: TextStyle(color: Theme.of(context).colorScheme.error)), const SizedBox(height: AppSpacing.md)],
          Wrap(spacing: 8, runSpacing: 8, children: [
            for (final image in existing)
              _PhotoTile(
                child: RemoteImage(url: image.url, fallbackAsset: categoryAsset(item?.category ?? '')),
                onRemove: () => setState(() => removedPhotoIds.add(image.id)),
              ),
            for (final file in newPhotos)
              _PhotoTile(
                child: Image.file(File(file.path), fit: BoxFit.cover),
                onRemove: () => setState(() => newPhotos.remove(file)),
              ),
            if (existing.length + newPhotos.length < 8)
              SizedBox(width: 92, height: 92, child: OutlinedButton(onPressed: _pickPhotos, child: const Icon(Icons.add_a_photo_outlined))),
          ]),
          const SizedBox(height: AppSpacing.lg),
          DropdownButtonFormField<String>(
            initialValue: listingType,
            decoration: const InputDecoration(labelText: 'Tipo de anúncio'),
            items: const [
              DropdownMenuItem(value: 'item', child: Text('Item para venda')),
              DropdownMenuItem(value: 'vehicle', child: Text('Veículo para venda')),
              DropdownMenuItem(value: 'property', child: Text('Imóvel')),
            ],
            onChanged: item == null ? (value) => setState(() { listingType = value ?? 'item'; category = ''; condition = listingType == 'property' ? 'used_good' : 'new'; }) : null,
          ),
          const SizedBox(height: AppSpacing.md),
          TextFormField(controller: title, decoration: const InputDecoration(labelText: 'Título'), validator: (value) => value?.trim().isEmpty == true ? 'Informe o título.' : null),
          const SizedBox(height: AppSpacing.md),
          TextFormField(controller: price, keyboardType: const TextInputType.numberWithOptions(decimal: true), decoration: const InputDecoration(labelText: 'Preço', prefixText: 'R\$ '), validator: (value) => parsePrice(value ?? '') == null ? 'Informe um preço válido.' : null),
          const SizedBox(height: AppSpacing.md),
          DropdownButtonFormField<String>(
            initialValue: categories.any((value) => value.slug == category) ? category : null,
            isExpanded: true,
            decoration: const InputDecoration(labelText: 'Categoria'),
            items: [for (final value in categories) DropdownMenuItem(value: value.slug, child: Text(value.name))],
            onChanged: (value) => setState(() { category = value ?? ''; if (category == 'gratis') price.text = '0'; }),
            validator: (value) => value == null || value.isEmpty ? 'Selecione a categoria.' : null,
          ),
          if (listingType != 'property') ...[
            const SizedBox(height: AppSpacing.md),
            DropdownButtonFormField<String>(
              initialValue: condition,
              decoration: const InputDecoration(labelText: 'Condição'),
              items: const [
                DropdownMenuItem(value: 'new', child: Text('Novo')),
                DropdownMenuItem(value: 'used_like_new', child: Text('Usado — como novo')),
                DropdownMenuItem(value: 'used_good', child: Text('Usado — bom')),
                DropdownMenuItem(value: 'used_fair', child: Text('Usado — aceitável')),
              ],
              onChanged: (value) => setState(() => condition = value ?? 'new'),
            ),
          ],
          if (listingType == 'vehicle') ..._vehicleFields(),
          if (listingType == 'property') ..._propertyFields(),
          const SizedBox(height: AppSpacing.md),
          DropdownButtonFormField<int>(
            initialValue: stateId,
            isExpanded: true,
            decoration: const InputDecoration(labelText: 'Estado'),
            items: [for (final value in states) DropdownMenuItem(value: value.id, child: Text('${value.name} (${value.code})'))],
            onChanged: (value) { setState(() { stateId = value; cityId = null; }); if (value != null) ref.read(citiesProvider.notifier).list(value); },
            validator: (value) => value == null ? 'Selecione o estado.' : null,
          ),
          const SizedBox(height: AppSpacing.md),
          DropdownButtonFormField<int>(
            initialValue: cities.any((value) => value.id == cityId) ? cityId : null,
            isExpanded: true,
            decoration: const InputDecoration(labelText: 'Cidade'),
            items: [for (final value in cities) DropdownMenuItem(value: value.id, child: Text(value.name))],
            onChanged: (value) => setState(() => cityId = value),
            validator: (value) => value == null ? 'Selecione a cidade.' : null,
          ),
          const SizedBox(height: AppSpacing.md),
          TextFormField(controller: description, minLines: 5, maxLines: 8, decoration: const InputDecoration(labelText: 'Descrição'), validator: (value) => value?.trim().isEmpty == true ? 'Informe a descrição.' : null),
          const SizedBox(height: AppSpacing.xl),
          FilledButton(onPressed: busy ? null : _submit, child: Text(busy ? 'Salvando...' : item == null ? 'Publicar anúncio' : 'Salvar alterações')),
        ],
      ),
    );
  }

  List<Widget> _vehicleFields() => [
        const SizedBox(height: AppSpacing.md),
        TextFormField(controller: brand, decoration: const InputDecoration(labelText: 'Marca')),
        const SizedBox(height: AppSpacing.md),
        TextFormField(controller: model, decoration: const InputDecoration(labelText: 'Modelo')),
        const SizedBox(height: AppSpacing.md),
        Row(children: [
          Expanded(child: TextFormField(controller: year, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Ano'))),
          const SizedBox(width: AppSpacing.sm),
          Expanded(child: TextFormField(controller: mileage, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Quilometragem'))),
        ]),
        const SizedBox(height: AppSpacing.md),
        DropdownButtonFormField<String>(initialValue: transmission.isEmpty ? null : transmission, decoration: const InputDecoration(labelText: 'Câmbio'), items: const [DropdownMenuItem(value: 'manual', child: Text('Manual')), DropdownMenuItem(value: 'automatic', child: Text('Automático'))], onChanged: (value) => setState(() => transmission = value ?? '')),
      ];

  List<Widget> _propertyFields() => [
        const SizedBox(height: AppSpacing.md),
        DropdownButtonFormField<String>(initialValue: listingMode, decoration: const InputDecoration(labelText: 'Finalidade'), items: const [DropdownMenuItem(value: 'sale', child: Text('Venda')), DropdownMenuItem(value: 'rent', child: Text('Locação'))], onChanged: (value) => setState(() => listingMode = value ?? 'sale')),
        const SizedBox(height: AppSpacing.md),
        DropdownButtonFormField<String>(initialValue: propertyType.isEmpty ? null : propertyType, decoration: const InputDecoration(labelText: 'Tipo de imóvel'), items: const [DropdownMenuItem(value: 'apartment', child: Text('Apartamento')), DropdownMenuItem(value: 'house', child: Text('Casa')), DropdownMenuItem(value: 'room', child: Text('Quarto')), DropdownMenuItem(value: 'land', child: Text('Terreno')), DropdownMenuItem(value: 'other', child: Text('Outro'))], onChanged: (value) => setState(() => propertyType = value ?? '')),
        const SizedBox(height: AppSpacing.md),
        Row(children: [Expanded(child: TextFormField(controller: bedrooms, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Quartos'))), const SizedBox(width: 8), Expanded(child: TextFormField(controller: bathrooms, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Banheiros')))]),
        const SizedBox(height: AppSpacing.md),
        TextFormField(controller: area, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Área (m²)')),
        const SizedBox(height: AppSpacing.md),
        DropdownButtonFormField<String>(initialValue: furnished.isEmpty ? null : furnished, decoration: const InputDecoration(labelText: 'Mobília'), items: const [DropdownMenuItem(value: 'yes', child: Text('Mobiliado')), DropdownMenuItem(value: 'no', child: Text('Sem mobília')), DropdownMenuItem(value: 'partial', child: Text('Parcial'))], onChanged: (value) => setState(() => furnished = value ?? '')),
        const SizedBox(height: AppSpacing.md),
        DropdownButtonFormField<String>(initialValue: petsAllowed.isEmpty ? null : petsAllowed, decoration: const InputDecoration(labelText: 'Aceita pets'), items: const [DropdownMenuItem(value: 'yes', child: Text('Sim')), DropdownMenuItem(value: 'no', child: Text('Não'))], onChanged: (value) => setState(() => petsAllowed = value ?? '')),
      ];
}

class _PhotoTile extends StatelessWidget {
  const _PhotoTile({required this.child, required this.onRemove});
  final Widget child;
  final VoidCallback onRemove;
  @override
  Widget build(BuildContext context) => SizedBox(
        width: 92,
        height: 92,
        child: Stack(fit: StackFit.expand, children: [
          ClipRRect(borderRadius: BorderRadius.circular(10), child: child),
          Positioned(right: 2, top: 2, child: IconButton.filledTonal(onPressed: onRemove, icon: const Icon(Icons.close, size: 16))),
        ]),
      );
}
