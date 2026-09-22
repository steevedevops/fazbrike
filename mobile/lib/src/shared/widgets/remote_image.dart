import 'package:flutter/material.dart';
import 'package:fazbrike/src/shared/utils/image_url.dart';

class RemoteImage extends StatelessWidget {
  const RemoteImage({
    super.key,
    required this.url,
    required this.fallbackAsset,
    this.fit = BoxFit.cover,
    this.width,
    this.height,
  });
  final String? url;
  final String fallbackAsset;
  final BoxFit fit;
  final double? width;
  final double? height;

  @override
  Widget build(BuildContext context) {
    final resolved = resolveImageUrl(url);
    if (resolved == null) return Image.asset(fallbackAsset, fit: fit, width: width, height: height);
    return Image.network(
      resolved,
      fit: fit,
      width: width,
      height: height,
      errorBuilder: (_, __, ___) => Image.asset(fallbackAsset, fit: fit, width: width, height: height),
      loadingBuilder: (context, child, progress) => progress == null
          ? child
          : const Center(child: CircularProgressIndicator(strokeWidth: 2)),
    );
  }
}
