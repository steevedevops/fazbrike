import 'package:flutter/material.dart';
import 'package:fazbrike/src/shared/utils/image_url.dart';
import 'package:fazbrike/src/theme/app_colors.dart';

/// Foto remota. Sem URL, ou se o arquivo não carrega, mostra um espaço vazio
/// em vez de uma imagem de estoque.
class RemoteImage extends StatelessWidget {
  const RemoteImage({
    super.key,
    required this.url,
    this.fit = BoxFit.cover,
    this.width,
    this.height,
  });

  final String? url;
  final BoxFit fit;
  final double? width;
  final double? height;

  @override
  Widget build(BuildContext context) {
    final resolved = resolveImageUrl(url);
    if (resolved == null) return EmptyPhoto(width: width, height: height);
    return Image.network(
      resolved,
      fit: fit,
      width: width,
      height: height,
      errorBuilder: (_, __, ___) => EmptyPhoto(width: width, height: height),
      loadingBuilder: (context, child, progress) => progress == null
          ? child
          : const Center(child: CircularProgressIndicator(strokeWidth: 2)),
    );
  }
}

/// Área neutra com ícone, para card, avatar ou banner sem foto.
class EmptyPhoto extends StatelessWidget {
  const EmptyPhoto({super.key, this.width, this.height});

  final double? width;
  final double? height;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final background = theme.brightness == Brightness.dark ? AppColors.darkSubtle : AppColors.subtle;
    final iconColor = theme.textTheme.bodySmall?.color ?? AppColors.muted;
    return Semantics(
      label: 'Sem foto',
      child: ColoredBox(
        color: background,
        child: SizedBox(
          width: width,
          height: height,
          child: LayoutBuilder(
            builder: (context, constraints) {
              final side = constraints.biggest.shortestSide;
              final iconSize = side.isFinite ? (side * 0.38).clamp(16.0, 36.0) : 28.0;
              return Center(child: Icon(Icons.image_outlined, color: iconColor, size: iconSize));
            },
          ),
        ),
      ),
    );
  }
}
