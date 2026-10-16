import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:fazbrike/src/app/items/models/item_model.dart';
import 'package:fazbrike/src/shared/utils/app_utils.dart';

/// Um atributo do anúncio já traduzido para exibição.
class ItemFact {
  const ItemFact({required this.icon, required this.label, required this.value});
  final IconData icon;
  final String label;
  final String value;
}

final _number = NumberFormat.decimalPattern('pt_BR');

const _labels = {
  'listing_mode': 'Finalidade',
  'property_type': 'Tipo de imóvel',
  'bedrooms': 'Quartos',
  'bathrooms': 'Banheiros',
  'area_m2': 'Área',
  'furnished': 'Mobília',
  'pets_allowed': 'Aceita pets',
  'brand': 'Marca',
  'model': 'Modelo',
  'year': 'Ano',
  'mileage': 'Quilometragem',
  'transmission': 'Câmbio',
};

const _icons = {
  'listing_mode': Icons.sell_outlined,
  'property_type': Icons.home_work_outlined,
  'bedrooms': Icons.bed_outlined,
  'bathrooms': Icons.bathtub_outlined,
  'area_m2': Icons.square_foot,
  'furnished': Icons.chair_outlined,
  'pets_allowed': Icons.pets_outlined,
  'brand': Icons.directions_car_outlined,
  'model': Icons.badge_outlined,
  'year': Icons.calendar_today_outlined,
  'mileage': Icons.speed_outlined,
  'transmission': Icons.settings_outlined,
};

String _value(String key, String raw) {
  switch (key) {
    case 'listing_mode':
      return raw == 'rent' ? 'Locação' : 'Venda';
    case 'property_type':
      return const {'apartment': 'Apartamento', 'house': 'Casa', 'room': 'Quarto', 'land': 'Terreno', 'other': 'Outro'}[raw] ?? raw;
    case 'furnished':
      return const {'yes': 'Mobiliado', 'no': 'Sem mobília', 'partial': 'Parcial'}[raw] ?? raw;
    case 'pets_allowed':
      return const {'yes': 'Sim', 'no': 'Não'}[raw] ?? raw;
    case 'transmission':
      return const {'automatic': 'Automático', 'manual': 'Manual'}[raw] ?? raw;
    case 'mileage':
      final km = num.tryParse(raw);
      return km == null ? '$raw km' : '${_number.format(km)} km';
    case 'area_m2':
      return '$raw m²';
    default:
      return raw;
  }
}

ItemFact? _fact(ItemModel item, String key) {
  final raw = item.attributes[key]?.toString().trim() ?? '';
  if (raw.isEmpty) return null;
  return ItemFact(icon: _icons[key] ?? Icons.info_outline, label: _labels[key] ?? key, value: _value(key, raw));
}

/// "Venda"/"Locação" para imóveis; vazio nos demais anúncios.
String listingModeLabel(ItemModel item) {
  final raw = item.attributes['listing_mode']?.toString() ?? '';
  return raw.isEmpty ? '' : _value('listing_mode', raw);
}

/// Até 4 números que resumem o anúncio no topo (quartos, área, ano, km...).
List<ItemFact> itemKeyFacts(ItemModel item) {
  final keys = switch (item.listingType) {
    'property' => const ['bedrooms', 'bathrooms', 'area_m2', 'property_type'],
    'vehicle' => const ['year', 'mileage', 'transmission', 'brand'],
    _ => const <String>[],
  };
  final facts = [for (final key in keys) _fact(item, key)].whereType<ItemFact>().toList();
  if (item.listingType == 'item' && item.condition.isNotEmpty) {
    facts.add(ItemFact(icon: Icons.verified_outlined, label: 'Condição', value: conditionLabel(item.condition)));
  }
  return facts.take(4).toList();
}

/// Ficha completa: categoria, condição e todos os atributos preenchidos.
List<ItemFact> itemSpecs(ItemModel item) => [
      if (item.category.isNotEmpty) ItemFact(icon: Icons.category_outlined, label: 'Categoria', value: categoryLabel(item.category)),
      if (item.condition.isNotEmpty) ItemFact(icon: Icons.verified_outlined, label: 'Condição', value: conditionLabel(item.condition)),
      for (final key in item.attributes.keys) ?_fact(item, key),
    ];
