import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:fazbrike/src/app/auth/controllers/auth_controller.dart';
import 'package:fazbrike/src/app/items/controllers/item_controller.dart';
import 'package:fazbrike/src/app/items/models/item_model.dart';
import 'package:fazbrike/src/app/items/widgets/item_gallery.dart';
import 'package:fazbrike/src/app/items/widgets/report_item_sheet.dart';

/// App bar com a galeria expandida e ações sobre fundo circular, para os
/// ícones continuarem legíveis em cima de qualquer foto.
class ItemDetailAppBar extends ConsumerWidget {
  const ItemDetailAppBar({super.key, required this.item});
  final ItemModel item;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authSessionProvider).value;
    final isOwner = user?.id == item.userId;
    return SliverAppBar(
      pinned: true,
      expandedHeight: MediaQuery.sizeOf(context).width * .8,
      leading: Navigator.of(context).canPop()
          ? _RoundAction(tooltip: 'Voltar', icon: Icons.arrow_back, onPressed: () => Navigator.of(context).maybePop())
          : null,
      flexibleSpace: FlexibleSpaceBar(background: ItemGallery(item: item)),
      actions: [
        _RoundAction(
          tooltip: item.isFavorited ? 'Remover dos favoritos' : 'Salvar',
          icon: item.isFavorited ? Icons.favorite : Icons.favorite_border,
          onPressed: () => _toggleFavorite(context, ref, user != null),
        ),
        _RoundAction(
          tooltip: 'Copiar link',
          icon: Icons.share_outlined,
          onPressed: () async {
            await Clipboard.setData(ClipboardData(text: 'fazbrike://produto/${item.id}'));
            if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Link copiado.')));
          },
        ),
        if (!isOwner)
          _RoundAction(tooltip: 'Denunciar anúncio', icon: Icons.outlined_flag, onPressed: () => _report(context, user != null)),
        const SizedBox(width: 4),
      ],
    );
  }

  Future<void> _toggleFavorite(BuildContext context, WidgetRef ref, bool signedIn) async {
    if (!signedIn) { context.go('/login'); return; }
    try { await ref.read(itemFormProvider.notifier).toggleFavorite(item); }
    catch (error) { if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(error.toString()))); }
  }

  Future<void> _report(BuildContext context, bool signedIn) async {
    if (!signedIn) { context.go('/login'); return; }
    final message = await showModalBottomSheet<String>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      builder: (_) => ReportItemSheet(itemId: item.id),
    );
    if (message != null && context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
    }
  }
}

class _RoundAction extends StatelessWidget {
  const _RoundAction({required this.tooltip, required this.icon, required this.onPressed});
  final String tooltip;
  final IconData icon;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 2, vertical: 6),
      child: IconButton(
        tooltip: tooltip,
        onPressed: onPressed,
        style: IconButton.styleFrom(
          backgroundColor: scheme.surface.withValues(alpha: .92),
          foregroundColor: scheme.onSurface,
        ),
        icon: Icon(icon, size: 20),
      ),
    );
  }
}
