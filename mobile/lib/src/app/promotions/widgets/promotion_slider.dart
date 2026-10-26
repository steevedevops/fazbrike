import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:fazbrike/src/app/promotions/controllers/promotion_controller.dart';
import 'package:fazbrike/src/app/promotions/models/promotion_model.dart';
import 'package:fazbrike/src/shared/widgets/remote_image.dart';
import 'package:fazbrike/src/theme/app_colors.dart';
import 'package:fazbrike/src/theme/app_radius.dart';
import 'package:fazbrike/src/theme/app_spacing.dart';

/// Slider das promoções cadastradas na plataforma. Some da home quando não há
/// campanha ativa — nada de espaço vazio ou mensagem de erro no topo da loja.
class PromotionSlider extends ConsumerStatefulWidget {
  const PromotionSlider({super.key, this.header, this.fallback, this.height = 168});

  /// Cabeçalho opcional da seção. Renderizado junto com o slider para que
  /// título e banners sumam juntos quando não há campanha ativa.
  final Widget? header;

  /// Conteúdo exibido enquanto não há campanha ativa (ou enquanto a lista
  /// carrega). Sem ele, a seção simplesmente some.
  final Widget? fallback;
  final double height;

  @override
  ConsumerState<PromotionSlider> createState() => _PromotionSliderState();
}

class _PromotionSliderState extends ConsumerState<PromotionSlider> {
  final _controller = PageController(viewportFraction: .92);
  Timer? _autoPlay;
  int _current = 0;

  @override
  void dispose() {
    _autoPlay?.cancel();
    _controller.dispose();
    super.dispose();
  }

  void _ensureAutoPlay(int total) {
    if (total < 2) {
      _autoPlay?.cancel();
      _autoPlay = null;
      return;
    }
    _autoPlay ??= Timer.periodic(const Duration(seconds: 6), (_) {
      if (!mounted || !_controller.hasClients) return;
      _controller.animateToPage(
        (_current + 1) % total,
        duration: const Duration(milliseconds: 420),
        curve: Curves.easeOutCubic,
      );
    });
  }

  /// Conta o clique e navega pelo destino confirmado pelo backend. Se a
  /// chamada falhar, segue com o destino que veio na listagem — métrica nunca
  /// segura a navegação.
  Future<void> _open(PromotionModel promotion) async {
    if (!promotion.target.isClickable) return;
    final confirmed = await ref.read(promotionFormProvider.notifier).click(promotion.id);
    final target = confirmed ?? promotion.target;
    if (!mounted) return;

    if (target.isInternal) {
      context.push(target.route);
      return;
    }
    final uri = Uri.tryParse(target.externalUrl);
    if (uri == null) return;
    await launchUrl(uri, mode: LaunchMode.externalApplication);
  }

  /// Marca como exibido o banner que está na tela (uma vez por sessão).
  void _markSeen(int id) {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(promotionFormProvider.notifier).registerImpressions([id]);
    });
  }

  @override
  Widget build(BuildContext context) {
    final promotions = ref.watch(promotionsListProvider);
    return promotions.maybeWhen(
      // Loading e erro são silenciosos: a home não depende do banner.
      data: (page) {
        final results = page.results;
        if (results.isEmpty) return _fallback;
        _ensureAutoPlay(results.length);
        _markSeen(results[_current.clamp(0, results.length - 1)].id);
        return Column(
          children: [
            if (widget.header != null) widget.header!,
            SizedBox(
              height: widget.height,
              child: PageView.builder(
                controller: _controller,
                onPageChanged: (index) {
                  setState(() => _current = index);
                  _markSeen(results[index].id);
                },
                itemCount: results.length,
                itemBuilder: (_, index) => Padding(
                  padding: const EdgeInsets.symmetric(horizontal: AppSpacing.xs),
                  child: _PromotionCard(
                  promotion: results[index],
                  onTap: results[index].target.isClickable ? () => _open(results[index]) : null,
                ),
                ),
              ),
            ),
            if (results.length > 1) ...[
              const SizedBox(height: AppSpacing.sm),
              _Dots(total: results.length, current: _current),
            ],
          ],
        );
      },
      orElse: () => _fallback,
    );
  }

  Widget get _fallback => widget.fallback ?? const SizedBox.shrink();
}

class _PromotionCard extends StatelessWidget {
  const _PromotionCard({required this.promotion, required this.onTap});

  final PromotionModel promotion;

  /// Nulo quando o banner é só informativo (sem destino cadastrado).
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    return InkWell(
      borderRadius: BorderRadius.circular(AppRadius.card),
      onTap: onTap,
      child: ClipRRect(
        borderRadius: BorderRadius.circular(AppRadius.card),
        child: Stack(
          fit: StackFit.expand,
          children: [
            RemoteImage(url: promotion.imageUrl),
            // Véu escuro fixo: garante contraste do texto sobre qualquer foto.
            Container(color: AppColors.ink.withValues(alpha: .5)),
            Padding(
              padding: const EdgeInsets.all(AppSpacing.lg),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.end,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    promotion.title,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: textTheme.titleLarge?.copyWith(color: Colors.white),
                  ),
                  if (promotion.subtitle.isNotEmpty) ...[
                    const SizedBox(height: 4),
                    Text(
                      promotion.subtitle,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: textTheme.bodySmall?.copyWith(color: Colors.white.withValues(alpha: .85)),
                    ),
                  ],
                  if (promotion.ctaLabel.isNotEmpty) ...[
                    const SizedBox(height: AppSpacing.md),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md, vertical: 6),
                      decoration: BoxDecoration(
                        color: AppColors.brand500,
                        borderRadius: BorderRadius.circular(AppRadius.pill),
                      ),
                      child: Text(
                        promotion.ctaLabel,
                        style: textTheme.bodySmall?.copyWith(color: Colors.white, fontWeight: FontWeight.w700),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _Dots extends StatelessWidget {
  const _Dots({required this.total, required this.current});

  final int total;
  final int current;

  @override
  Widget build(BuildContext context) {
    final active = Theme.of(context).colorScheme.primary;
    final inactive = Theme.of(context).colorScheme.outline;
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: List.generate(total, (index) {
        final isActive = index == current;
        return AnimatedContainer(
          duration: const Duration(milliseconds: 220),
          margin: const EdgeInsets.symmetric(horizontal: 3),
          width: isActive ? 18 : 6,
          height: 6,
          decoration: BoxDecoration(
            color: isActive ? active : inactive,
            borderRadius: BorderRadius.circular(AppRadius.pill),
          ),
        );
      }),
    );
  }
}
