import 'package:flutter/material.dart';
import 'package:fazbrike/src/shared/utils/app_utils.dart';
import 'package:fazbrike/src/theme/app_radius.dart';
import 'package:fazbrike/src/theme/app_spacing.dart';

/// Categoria apresentada pela foto, com o nome logo abaixo. Usada no carrossel
/// da home e na grade de `/categorias`.
class CategoryPhotoCard extends StatelessWidget {
  const CategoryPhotoCard({
    super.key,
    required this.slug,
    required this.name,
    required this.onTap,
    this.width,
    this.aspectRatio = 1,
  });

  final String slug;
  final String name;
  final VoidCallback onTap;
  final double? width;
  final double aspectRatio;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return SizedBox(
      width: width,
      child: InkWell(
        borderRadius: BorderRadius.circular(AppRadius.card),
        onTap: onTap,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            AspectRatio(
              aspectRatio: aspectRatio,
              child: ClipRRect(
                borderRadius: BorderRadius.circular(AppRadius.card),
                child: Image.asset(categoryAsset(slug), fit: BoxFit.cover),
              ),
            ),
            const SizedBox(height: AppSpacing.sm),
            Text(
              name,
              textAlign: TextAlign.center,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: theme.textTheme.bodySmall?.copyWith(
                fontWeight: FontWeight.w600,
                color: theme.colorScheme.onSurface,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
