import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:fazbrike/src/app/promotions/controllers/promotion_controller.dart';
import 'package:fazbrike/src/app/promotions/models/promotion_model.dart';
import 'package:fazbrike/src/shared/widgets/remote_image.dart';
import 'package:fazbrike/src/theme/app_colors.dart';
import 'package:fazbrike/src/theme/app_radius.dart';
import 'package:fazbrike/src/theme/app_spacing.dart';

/// Rótulo legível do destino, para o dono conferir sem decorar tipos.
String promotionTargetLabel(MyPromotionModel promotion) {
  final label = promotion.target.label;
  switch (promotion.targetType) {
    case PromotionTargetType.profile:
      return 'Abre a sua loja';
    case PromotionTargetType.item:
      return label.isEmpty ? 'Abre um anúncio seu' : 'Abre o anúncio "$label"';
    case PromotionTargetType.category:
      return label.isEmpty ? 'Abre uma categoria' : 'Abre a categoria $label';
    case PromotionTargetType.search:
      return 'Abre a busca por "${promotion.targetValue}"';
    case PromotionTargetType.page:
      return 'Abre $label';
    case PromotionTargetType.external:
      return 'Abre um site externo';
    default:
      return 'Sem destino';
  }
}

class MyPromotionCard extends ConsumerWidget {
  const MyPromotionCard({
    super.key,
    required this.promotion,
    required this.onEdit,
    required this.onDelete,
  });

  final MyPromotionModel promotion;
  final VoidCallback onEdit;
  final VoidCallback onDelete;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);

    return Card(
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          AspectRatio(
            aspectRatio: 16 / 7,
            child: Stack(
              fit: StackFit.expand,
              children: [
                RemoteImage(
                  url: promotion.imageUrl,
                  fallbackAsset: 'lib/assets/images/highlights/highlight-deal.jpg',
                ),
                Positioned(
                  left: AppSpacing.sm,
                  top: AppSpacing.sm,
                  child: _StatusTag(visible: promotion.isVisible, active: promotion.isActive),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(AppSpacing.md),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(promotion.title, style: theme.textTheme.titleMedium, maxLines: 1, overflow: TextOverflow.ellipsis),
                const SizedBox(height: 2),
                Text(promotionTargetLabel(promotion), style: theme.textTheme.bodySmall),
                if (promotion.unavailableFor.isNotEmpty) ...[
                  const SizedBox(height: AppSpacing.sm),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(AppSpacing.sm),
                    decoration: BoxDecoration(
                      color: AppColors.warning.withValues(alpha: .1),
                      borderRadius: BorderRadius.circular(AppRadius.control),
                    ),
                    child: Text(
                      promotion.unavailableFor,
                      style: theme.textTheme.bodySmall?.copyWith(color: AppColors.warning),
                    ),
                  ),
                ],
                const SizedBox(height: AppSpacing.md),
                Row(
                  children: [
                    _Metric(icon: Icons.visibility_outlined, value: promotion.impressionCount, label: 'exibições'),
                    const SizedBox(width: AppSpacing.lg),
                    _Metric(icon: Icons.touch_app_outlined, value: promotion.clickCount, label: 'cliques'),
                    const Spacer(),
                    Switch(
                      value: promotion.isActive,
                      onChanged: (value) async {
                        try {
                          await ref.read(promotionFormProvider.notifier).setActive(promotion, value);
                        } catch (error) {
                          if (context.mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(error.toString())));
                          }
                        }
                      },
                    ),
                  ],
                ),
                const Divider(height: AppSpacing.xl),
                Row(
                  children: [
                    TextButton.icon(
                      onPressed: onEdit,
                      icon: const Icon(Icons.edit_outlined, size: 18),
                      label: const Text('Editar'),
                    ),
                    const Spacer(),
                    TextButton.icon(
                      onPressed: onDelete,
                      style: TextButton.styleFrom(foregroundColor: AppColors.danger),
                      icon: const Icon(Icons.delete_outline, size: 18),
                      label: const Text('Excluir'),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _StatusTag extends StatelessWidget {
  const _StatusTag({required this.visible, required this.active});

  final bool visible;
  final bool active;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final color = visible ? AppColors.success : (active ? AppColors.warning : AppColors.muted);
    final label = visible ? 'No ar' : (active ? 'Fora do ar' : 'Desativado');

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(AppRadius.pill),
      ),
      child: Text(
        label,
        style: theme.textTheme.bodySmall?.copyWith(color: Colors.white, fontWeight: FontWeight.w700),
      ),
    );
  }
}

class _Metric extends StatelessWidget {
  const _Metric({required this.icon, required this.value, required this.label});

  final IconData icon;
  final int value;
  final String label;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 16, color: theme.textTheme.bodySmall?.color),
        const SizedBox(width: 4),
        Text('$value $label', style: theme.textTheme.bodySmall),
      ],
    );
  }
}
