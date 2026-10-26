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
import 'package:fazbrike/src/shared/widgets/app_select_field.dart';
import 'package:fazbrike/src/shared/widgets/remote_image.dart';
import 'package:fazbrike/src/theme/app_colors.dart';
import 'package:fazbrike/src/theme/app_radius.dart';
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
  String listingType = '';
  int _step = 0;
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
    listingType = item?.listingType ?? '';
    if (item != null) _step = 2;
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
    if (mounted) {
      setState(() {
        newPhotos.addAll(accepted);
        if (accepted.length != selected.length) {
          error = 'Algumas imagens foram ignoradas. Use JPEG, PNG, WebP ou GIF de até 10MB.';
        }
      });
    }
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

  static const _stepLabels = ['Tipo', 'Categoria', 'Detalhes'];

  void _openStep(int index) {
    if (index == _step) return;
    if (index < _step || item != null) {
      setState(() {
        _step = index;
        error = '';
      });
    }
  }

  void _selectType(String value) {
    if (item != null) return;
    setState(() {
      listingType = value;
      category = '';
      condition = value == 'property' ? 'used_good' : 'new';
      error = '';
    });
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
    final theme = Theme.of(context);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(AppSpacing.lg, AppSpacing.md, AppSpacing.lg, AppSpacing.sm),
          child: _StepHeader(step: _step, onSelect: _openStep),
        ),
        Expanded(
          child: Form(
            key: _formKey,
            child: ListView(
              padding: const EdgeInsets.fromLTRB(AppSpacing.lg, AppSpacing.sm, AppSpacing.lg, AppSpacing.lg),
              children: [
                Text(_stepTitle, style: theme.textTheme.headlineSmall),
                const SizedBox(height: AppSpacing.sm),
                Text(_stepHelp, style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w500, height: 1.4, color: theme.textTheme.bodySmall?.color)),
                const SizedBox(height: AppSpacing.xl),
                if (error.isNotEmpty) ...[
                  Text(error, style: theme.textTheme.titleMedium?.copyWith(color: AppColors.danger, fontWeight: FontWeight.w500, height: 1.4)),
                  const SizedBox(height: AppSpacing.lg),
                ],
                if (_step == 0) _typeStep(),
                if (_step == 1) _categoryStep(categories),
                if (_step == 2) ..._detailsStep(states, cities, existing),
              ],
            ),
          ),
        ),
        _actions(busy),
      ],
    );
  }

  String get _stepTitle => switch (_step) {
        0 => 'O que você quer anunciar?',
        1 => 'Qual é a categoria?',
        _ => item == null ? 'Conte os detalhes' : 'Atualize os detalhes',
      };

  String get _stepHelp => switch (_step) {
        0 => 'Escolha uma opção para continuar.',
        1 => 'Toque na categoria que melhor descreve o anúncio.',
        _ => 'Preencha o que o comprador precisa saber. Dá para voltar e mudar o tipo ou a categoria.',
      };

  Widget _typeStep() {
    const options = [
      ('item', 'Item para venda', 'Objetos, eletrônicos, móveis, roupas…'),
      ('vehicle', 'Veículo para venda', 'Carros, motos, barcos…'),
      ('property', 'Imóvel', 'Venda ou locação residencial'),
    ];
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        for (final option in options) ...[
          _ChoiceTile(
            title: option.$2,
            subtitle: option.$3,
            selected: listingType == option.$1,
            onTap: item != null ? null : () => _selectType(option.$1),
          ),
          const SizedBox(height: AppSpacing.md),
        ],
        if (item != null)
          Text('O tipo não muda depois que o anúncio foi publicado.', style: Theme.of(context).textTheme.bodySmall),
      ],
    );
  }

  Widget _categoryStep(List<CategoryModel> categories) {
    if (ref.watch(categoriesProvider).isLoading && categories.isEmpty) {
      return const Padding(
        padding: EdgeInsets.symmetric(vertical: AppSpacing.xl),
        child: Center(child: CircularProgressIndicator(strokeWidth: 2)),
      );
    }
    if (categories.isEmpty) {
      return Text('Nenhuma categoria disponível para esse tipo.', style: Theme.of(context).textTheme.titleMedium);
    }
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        for (final value in categories) ...[
          _ChoiceTile(
            title: value.name,
            selected: category == value.slug,
            onTap: () => setState(() {
              category = value.slug;
              if (category == 'gratis') price.text = '0';
              error = '';
            }),
          ),
          const SizedBox(height: AppSpacing.sm),
        ],
      ],
    );
  }

  List<Widget> _detailsStep(List<StateOptionModel> states, List<CityOptionModel> cities, List<ItemImageModel> existing) => [
        _fieldLabel('Fotos'),
        const SizedBox(height: AppSpacing.sm),
        Wrap(spacing: 8, runSpacing: 8, children: [
          for (final image in existing)
            _PhotoTile(
              child: RemoteImage(url: image.url),
              onRemove: () => setState(() => removedPhotoIds.add(image.id)),
            ),
          for (final file in newPhotos)
            _PhotoTile(
              child: Image.file(File(file.path), fit: BoxFit.cover),
              onRemove: () => setState(() => newPhotos.remove(file)),
            ),
          if (existing.length + newPhotos.length < 8)
            SizedBox(
              width: 92,
              height: 92,
              child: OutlinedButton(onPressed: _pickPhotos, child: const Icon(Icons.add_a_photo_outlined)),
            ),
        ]),
        const SizedBox(height: AppSpacing.xl),
        _textField(label: 'Título', controller: title, validator: (value) => value?.trim().isEmpty == true ? 'Informe o título.' : null),
        _textField(
          label: 'Preço',
          controller: price,
          keyboardType: const TextInputType.numberWithOptions(decimal: true),
          prefixText: 'R\$ ',
          validator: (value) => parsePrice(value ?? '') == null ? 'Informe um preço válido.' : null,
        ),
        if (listingType != 'property')
          AppSelectField<String>(
            label: 'Condição',
            value: condition,
            items: const [
              DropdownMenuItem(value: 'new', child: Text('Novo')),
              DropdownMenuItem(value: 'used_like_new', child: Text('Usado — como novo')),
              DropdownMenuItem(value: 'used_good', child: Text('Usado — bom')),
              DropdownMenuItem(value: 'used_fair', child: Text('Usado — aceitável')),
            ],
            onChanged: (value) => setState(() => condition = value ?? 'new'),
          ),
        if (listingType != 'property') const SizedBox(height: AppSpacing.xl),
        if (listingType == 'vehicle') ..._vehicleFields(),
        if (listingType == 'property') ..._propertyFields(),
        AppSelectField<int>(
          label: 'Estado',
          value: states.any((value) => value.id == stateId) ? stateId : null,
          items: [for (final value in states) DropdownMenuItem(value: value.id, child: Text('${value.name} (${value.code})', maxLines: 1, overflow: TextOverflow.ellipsis))],
          onChanged: (value) {
            setState(() {
              stateId = value;
              cityId = null;
            });
            if (value != null) ref.read(citiesProvider.notifier).list(value);
          },
          validator: (value) => value == null ? 'Selecione o estado.' : null,
        ),
        const SizedBox(height: AppSpacing.xl),
        AppSelectField<int>(
          key: ValueKey(stateId),
          label: 'Cidade',
          value: cities.any((value) => value.id == cityId) ? cityId : null,
          items: [for (final value in cities) DropdownMenuItem(value: value.id, child: Text(value.name, maxLines: 1, overflow: TextOverflow.ellipsis))],
          onChanged: stateId == null ? null : (value) => setState(() => cityId = value),
          validator: (value) => value == null ? 'Selecione a cidade.' : null,
        ),
        const SizedBox(height: AppSpacing.xl),
        _textField(
          label: 'Descrição',
          controller: description,
          minLines: 5,
          maxLines: 8,
          validator: (value) => value?.trim().isEmpty == true ? 'Informe a descrição.' : null,
        ),
      ];

  List<Widget> _vehicleFields() => [
        _textField(label: 'Marca', controller: brand),
        _textField(label: 'Modelo', controller: model),
        Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Expanded(child: _textField(label: 'Ano', controller: year, keyboardType: TextInputType.number)),
          const SizedBox(width: AppSpacing.md),
          Expanded(child: _textField(label: 'Quilometragem', controller: mileage, keyboardType: TextInputType.number)),
        ]),
        AppSelectField<String>(
          label: 'Câmbio',
          value: transmission.isEmpty ? null : transmission,
          items: const [
            DropdownMenuItem(value: 'manual', child: Text('Manual')),
            DropdownMenuItem(value: 'automatic', child: Text('Automático')),
          ],
          onChanged: (value) => setState(() => transmission = value ?? ''),
        ),
        const SizedBox(height: AppSpacing.xl),
      ];

  List<Widget> _propertyFields() => [
        AppSelectField<String>(
          label: 'Finalidade',
          value: listingMode,
          items: const [
            DropdownMenuItem(value: 'sale', child: Text('Venda')),
            DropdownMenuItem(value: 'rent', child: Text('Locação')),
          ],
          onChanged: (value) => setState(() => listingMode = value ?? 'sale'),
        ),
        const SizedBox(height: AppSpacing.xl),
        AppSelectField<String>(
          label: 'Tipo de imóvel',
          value: propertyType.isEmpty ? null : propertyType,
          items: const [
            DropdownMenuItem(value: 'apartment', child: Text('Apartamento')),
            DropdownMenuItem(value: 'house', child: Text('Casa')),
            DropdownMenuItem(value: 'room', child: Text('Quarto')),
            DropdownMenuItem(value: 'land', child: Text('Terreno')),
            DropdownMenuItem(value: 'other', child: Text('Outro')),
          ],
          onChanged: (value) => setState(() => propertyType = value ?? ''),
        ),
        const SizedBox(height: AppSpacing.xl),
        Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Expanded(child: _textField(label: 'Quartos', controller: bedrooms, keyboardType: TextInputType.number)),
          const SizedBox(width: AppSpacing.md),
          Expanded(child: _textField(label: 'Banheiros', controller: bathrooms, keyboardType: TextInputType.number)),
        ]),
        _textField(label: 'Área (m²)', controller: area, keyboardType: TextInputType.number),
        AppSelectField<String>(
          label: 'Mobília',
          value: furnished.isEmpty ? null : furnished,
          items: const [
            DropdownMenuItem(value: 'yes', child: Text('Mobiliado')),
            DropdownMenuItem(value: 'no', child: Text('Sem mobília')),
            DropdownMenuItem(value: 'partial', child: Text('Parcial')),
          ],
          onChanged: (value) => setState(() => furnished = value ?? ''),
        ),
        const SizedBox(height: AppSpacing.xl),
        AppSelectField<String>(
          label: 'Aceita pets',
          value: petsAllowed.isEmpty ? null : petsAllowed,
          items: const [
            DropdownMenuItem(value: 'yes', child: Text('Sim')),
            DropdownMenuItem(value: 'no', child: Text('Não')),
          ],
          onChanged: (value) => setState(() => petsAllowed = value ?? ''),
        ),
        const SizedBox(height: AppSpacing.xl),
      ];

  Widget _fieldLabel(String label) => Text(
        label,
        style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600),
      );

  Widget _textField({
    required String label,
    required TextEditingController controller,
    TextInputType? keyboardType,
    String? prefixText,
    int minLines = 1,
    int maxLines = 1,
    String? Function(String?)? validator,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.xl),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _fieldLabel(label),
          const SizedBox(height: AppSpacing.sm),
          TextFormField(
            controller: controller,
            keyboardType: keyboardType,
            minLines: minLines,
            maxLines: maxLines,
            validator: validator,
            style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w500),
            decoration: InputDecoration(
              prefixText: prefixText,
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            ),
          ),
        ],
      ),
    );
  }

  Widget _actions(bool busy) {
    final theme = Theme.of(context);
    final canContinue = switch (_step) {
      0 => listingType.isNotEmpty,
      1 => category.isNotEmpty,
      _ => !busy,
    };
    final label = switch (_step) {
      2 => busy ? 'Salvando...' : item == null ? 'Publicar anúncio' : 'Salvar alterações',
      _ => 'Continuar',
    };
    return Material(
      color: theme.scaffoldBackgroundColor,
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(AppSpacing.lg, AppSpacing.sm, AppSpacing.lg, AppSpacing.md),
          child: Row(
            children: [
              if (_step > 0) ...[
                Expanded(
                  child: OutlinedButton(
                    onPressed: busy ? null : () => _openStep(_step - 1),
                    style: OutlinedButton.styleFrom(minimumSize: const Size.fromHeight(56)),
                    child: const Text('Voltar'),
                  ),
                ),
                const SizedBox(width: AppSpacing.md),
              ],
              Expanded(
                flex: _step > 0 ? 2 : 1,
                child: FilledButton(
                  onPressed: !canContinue
                      ? null
                      : _step < 2
                          ? () => setState(() {
                                _step += 1;
                                error = '';
                              })
                          : _submit,
                  style: FilledButton.styleFrom(
                    minimumSize: const Size.fromHeight(56),
                    textStyle: theme.textTheme.titleMedium,
                  ),
                  child: Text(label, maxLines: 1, overflow: TextOverflow.ellipsis),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _StepHeader extends StatelessWidget {
  const _StepHeader({required this.step, required this.onSelect});

  final int step;
  final ValueChanged<int> onSelect;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Passo ${step + 1} de 3', style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600)),
        const SizedBox(height: AppSpacing.md),
        Row(
          children: [
            for (var index = 0; index < _ItemEditorFormState._stepLabels.length; index++) ...[
              if (index > 0) const SizedBox(width: AppSpacing.sm),
              Expanded(
                child: _StepMark(
                  label: _ItemEditorFormState._stepLabels[index],
                  done: index <= step,
                  current: index == step,
                  onTap: index <= step ? () => onSelect(index) : null,
                ),
              ),
            ],
          ],
        ),
      ],
    );
  }
}

class _ChoiceTile extends StatelessWidget {
  const _ChoiceTile({required this.title, required this.selected, required this.onTap, this.subtitle});

  final String title;
  final String? subtitle;
  final bool selected;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final fill = selected
        ? (theme.brightness == Brightness.dark ? AppColors.darkSubtle : AppColors.subtle)
        : theme.colorScheme.surface;
    final subtitleStyle = theme.textTheme.bodySmall?.copyWith(height: 1.35);
    return SizedBox(
      width: double.infinity,
      child: Material(
        color: fill,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppRadius.card),
          side: BorderSide(color: selected ? theme.colorScheme.onSurface : theme.dividerColor),
        ),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(AppRadius.card),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg, vertical: AppSpacing.lg),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  maxLines: subtitle == null ? 2 : 1,
                  overflow: TextOverflow.ellipsis,
                  style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600),
                ),
                if (subtitle != null) ...[
                  const SizedBox(height: AppSpacing.xs),
                  SizedBox(
                    height: (subtitleStyle?.fontSize ?? 12) * 1.35 * 2,
                    child: Align(
                      alignment: Alignment.topLeft,
                      child: Text(subtitle!, maxLines: 2, overflow: TextOverflow.ellipsis, style: subtitleStyle),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _StepMark extends StatelessWidget {
  const _StepMark({required this.label, required this.done, required this.current, required this.onTap});

  final String label;
  final bool done;
  final bool current;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final bar = done ? theme.colorScheme.onSurface : theme.dividerColor;
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(AppRadius.control),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: AppSpacing.sm),
        child: Column(
          children: [
            Container(
              height: 4,
              decoration: BoxDecoration(color: bar, borderRadius: BorderRadius.circular(AppRadius.pill)),
            ),
            const SizedBox(height: 6),
            Text(
              label,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: theme.textTheme.bodySmall?.copyWith(
                fontWeight: current ? FontWeight.w700 : FontWeight.w500,
                color: current ? theme.colorScheme.onSurface : theme.textTheme.bodySmall?.color,
              ),
            ),
          ],
        ),
      ),
    );
  }
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
