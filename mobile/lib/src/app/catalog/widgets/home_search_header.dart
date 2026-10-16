import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:fazbrike/src/app/catalog/widgets/category_chips.dart';
import 'package:fazbrike/src/theme/app_spacing.dart';

/// Busca + trilho de categorias da home. Vai dentro de um
/// [SliverPersistentHeader] fixo: a linha da marca rola embora, esta faixa
/// fica presa no topo — comprar começa pela busca.
class HomeSearchHeader extends ConsumerStatefulWidget {
  const HomeSearchHeader({super.key});

  static const double _topGap = 6;
  static const double _fieldHeight = 48;
  static const double _gap = AppSpacing.sm;
  static const double _chipsHeight = 44;

  /// O fio de baixo é desenhado dentro do container e come altura do conteúdo.
  static const double _border = 1;

  /// Altura da faixa. Acompanha o ajuste de fonte do sistema para o campo não
  /// estourar a altura fixa do sliver em quem usa texto ampliado.
  static double heightOf(BuildContext context) {
    final scale = MediaQuery.textScalerOf(context).scale(15) / 15;
    final extra = (scale.clamp(1.0, 1.8) - 1.0) * 44;
    return _topGap + _fieldHeight + _gap + _chipsHeight + _border + extra;
  }

  @override
  ConsumerState<HomeSearchHeader> createState() => _HomeSearchHeaderState();
}

class _HomeSearchHeaderState extends ConsumerState<HomeSearchHeader> {
  final _controller = TextEditingController();

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _search(String value) {
    final term = value.trim();
    if (term.isEmpty) return;
    context.push('/catalogo?search=${Uri.encodeQueryComponent(term)}');
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      // Opaco e com fio embaixo: enquanto fixa, a vitrine passa por baixo sem
      // aparecer atrás da busca.
      decoration: BoxDecoration(
        color: theme.appBarTheme.backgroundColor ?? theme.colorScheme.surface,
        border: Border(bottom: BorderSide(color: theme.dividerColor)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const SizedBox(height: HomeSearchHeader._topGap),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
            child: TextField(
              controller: _controller,
              textInputAction: TextInputAction.search,
              onSubmitted: _search,
              decoration: const InputDecoration(
                hintText: 'O que você procura?',
                prefixIcon: Icon(Icons.search),
              ),
            ),
          ),
          const SizedBox(height: HomeSearchHeader._gap),
          CategoryChips(
            height: HomeSearchHeader._chipsHeight,
            selectedSlug: '',
            onSelected: (category) {
              if (category == null) {
                context.push('/catalogo');
                return;
              }
              context.push(
                '/catalogo?category=${Uri.encodeQueryComponent(category.slug)}'
                '&title=${Uri.encodeQueryComponent(category.name)}',
              );
            },
          ),
        ],
      ),
    );
  }
}

/// Delegate que prende a [HomeSearchHeader] no topo da rolagem.
class HomeSearchHeaderDelegate extends SliverPersistentHeaderDelegate {
  const HomeSearchHeaderDelegate({required this.height});

  final double height;

  @override
  double get minExtent => height;

  @override
  double get maxExtent => height;

  @override
  Widget build(BuildContext context, double shrinkOffset, bool overlapsContent) =>
      const SizedBox.expand(child: HomeSearchHeader());

  @override
  bool shouldRebuild(covariant HomeSearchHeaderDelegate oldDelegate) =>
      oldDelegate.height != height;
}
