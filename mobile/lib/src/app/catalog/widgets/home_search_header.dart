import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:fazbrike/src/app/catalog/widgets/category_chips.dart';
import 'package:fazbrike/src/theme/app_spacing.dart';

/// Busca + trilho de categorias que ficam grudados no topo da home enquanto se
/// rola a vitrine — comprar começa pela busca, não por um banner.
class HomeSearchHeader extends ConsumerStatefulWidget implements PreferredSizeWidget {
  const HomeSearchHeader({super.key});

  static const _searchRow = 60.0;
  static const _chipsRow = 44.0;

  @override
  Size get preferredSize => const Size.fromHeight(_searchRow + _chipsRow);

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
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(AppSpacing.lg, 0, AppSpacing.lg, AppSpacing.md),
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
        CategoryChips(
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
    );
  }
}
