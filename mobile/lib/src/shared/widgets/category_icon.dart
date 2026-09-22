import 'package:flutter/material.dart';
import 'package:fazbrike/src/shared/utils/app_utils.dart';

/// Ícone da categoria, equivalente a `frontend/src/components/CategoryIcon.tsx`.
///
/// A web desenha SVGs próprios; aqui usamos os ícones do Material que mais se
/// aproximam de cada traço, mantendo o mesmo conjunto de 7 famílias.
const _icons = {
  'eletronicos': Icons.devices_outlined,
  'moveis': Icons.weekend_outlined,
  'roupas': Icons.checkroom_outlined,
  'veiculos': Icons.directions_car_outlined,
  'imoveis': Icons.home_outlined,
  'esportes': Icons.sports_soccer_outlined,
  'outros': Icons.more_horiz,
};

IconData categoryIconData(String slug) => _icons[categoryIconSlug(slug)] ?? Icons.more_horiz;

class CategoryIcon extends StatelessWidget {
  const CategoryIcon({super.key, required this.slug, this.size = 20, this.color});

  final String slug;
  final double size;
  final Color? color;

  @override
  Widget build(BuildContext context) => Icon(
        categoryIconData(slug),
        size: size,
        color: color ?? Theme.of(context).colorScheme.onSurface,
      );
}
