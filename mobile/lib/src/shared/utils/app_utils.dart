import 'package:intl/intl.dart';

final _currency = NumberFormat.currency(locale: 'pt_BR', symbol: 'R\$', decimalDigits: 2);

String formatPrice(num value) => _currency.format(value);

double? parsePrice(String raw) {
  final normalized = raw.trim().replaceAll(' ', '').replaceAll('.', '').replaceAll(',', '.');
  final value = double.tryParse(normalized);
  if (value == null || !value.isFinite || value < 0) return null;
  return value;
}

String formatDate(DateTime value) => DateFormat('dd/MM/yyyy', 'pt_BR').format(value.toLocal());

/// Tempo relativo curto ("agora", "5 min", "3 h", "2 d") para listas densas
/// como a central de notificações. Acima de uma semana volta para a data.
String formatRelativeTime(DateTime value) {
  final elapsed = DateTime.now().difference(value.toLocal());
  if (elapsed.inMinutes < 1) return 'agora';
  if (elapsed.inMinutes < 60) return '${elapsed.inMinutes} min';
  if (elapsed.inHours < 24) return '${elapsed.inHours} h';
  if (elapsed.inDays < 7) return '${elapsed.inDays} d';
  return formatDate(value);
}

String formatDateTime(DateTime value) => DateFormat('dd/MM/yyyy HH:mm', 'pt_BR').format(value.toLocal());

String categoryLabel(String slug) => const {
      'veiculos': 'Veículos',
      'locacao-imoveis': 'Locação de imóveis',
      'imoveis': 'Venda de imóveis',
      'eletronicos': 'Eletrônicos',
      'roupas': 'Roupas e acessórios',
      'moveis': 'Móveis e casa',
      'esportes': 'Artigos esportivos',
      'gratis': 'Itens grátis',
    }[slug] ?? slug;

String conditionLabel(String value) => const {
      'new': 'Novo',
      'used_like_new': 'Usado — como novo',
      'used_good': 'Usado — bom',
      'used_fair': 'Usado — aceitável',
    }[value] ?? value;

/// Reduz qualquer slug de categoria a uma das 7 famílias visuais do design
/// system. Espelha `CATEGORY_COVERS` + `categoryIconSlug` de
/// `frontend/src/lib/catalog.ts` — subcategorias herdam o visual do pai.
const _categoryFamily = {
  // Eletrônicos
  'eletronicos': 'eletronicos',
  'celulares': 'eletronicos',
  'computadores': 'eletronicos',
  'tvs-audio': 'eletronicos',
  'acessorios-eletronicos': 'eletronicos',
  'eletrodomesticos': 'eletronicos',
  // Móveis
  'moveis': 'moveis',
  // Roupas
  'roupas': 'roupas',
  'roupas-masculinas': 'roupas',
  'roupas-femininas': 'roupas',
  'roupas-infantis': 'roupas',
  'calcados': 'roupas',
  // Veículos
  'veiculos': 'veiculos',
  'carros': 'veiculos',
  'motos': 'veiculos',
  'barcos': 'veiculos',
  'outros-veiculos': 'veiculos',
  'pecas-auto': 'veiculos',
  // Imóveis
  'imoveis': 'imoveis',
  'locacao-imoveis': 'imoveis',
  'apartamento-aluguel': 'imoveis',
  'casa-aluguel': 'imoveis',
  'quarto-aluguel': 'imoveis',
  'apartamento-venda': 'imoveis',
  'casa-venda': 'imoveis',
  'terreno': 'imoveis',
  // Esportes
  'esportes': 'esportes',
};

/// Família visual de um slug (`eletronicos`, `moveis`, `roupas`, `veiculos`,
/// `imoveis`, `esportes` ou `outros`).
String categoryIconSlug(String slug) => _categoryFamily[slug] ?? 'outros';

String categoryAsset(String slug) =>
    'lib/assets/images/categories/${categoryIconSlug(slug)}.jpg';
