import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:fazbrike/src/app/auth/controllers/auth_controller.dart';
import 'package:fazbrike/src/app/items/controllers/item_controller.dart';
import 'package:fazbrike/src/app/items/models/item_model.dart';
import 'package:fazbrike/src/app/items/widgets/item_message_sheet.dart';
import 'package:fazbrike/src/shared/utils/app_utils.dart';
import 'package:fazbrike/src/theme/app_spacing.dart';

/// Barra fixa no rodapé: contato para quem visita, editar/excluir para o dono.
class ItemContactBar extends ConsumerWidget {
  const ItemContactBar({super.key, required this.item});
  final ItemModel item;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final user = ref.watch(authSessionProvider).value;
    final isOwner = user?.id == item.userId;
    return DecoratedBox(
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        border: Border(top: BorderSide(color: theme.colorScheme.outlineVariant)),
      ),
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(AppSpacing.lg, AppSpacing.sm, AppSpacing.lg, AppSpacing.sm),
          child: isOwner
              ? Row(children: [
                  Expanded(child: OutlinedButton(onPressed: () => _delete(context, ref), child: const Text('Excluir'))),
                  const SizedBox(width: AppSpacing.sm),
                  Expanded(child: FilledButton(onPressed: () => context.push('/editar/${item.id}'), child: const Text('Editar anúncio'))),
                ])
              : Row(children: [
                  Expanded(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(formatPrice(item.price), style: theme.textTheme.titleMedium, maxLines: 1, overflow: TextOverflow.ellipsis),
                        Text(item.user?.name ?? 'Anunciante', style: theme.textTheme.bodySmall, maxLines: 1, overflow: TextOverflow.ellipsis),
                      ],
                    ),
                  ),
                  IconButton.outlined(
                    tooltip: 'Abrir conversa',
                    onPressed: () => _openConversation(context, user != null),
                    icon: const Icon(Icons.chat_bubble_outline),
                  ),
                  const SizedBox(width: AppSpacing.sm),
                  FilledButton.icon(
                    onPressed: () => _message(context, user != null),
                    icon: const Icon(Icons.send_outlined, size: 18),
                    label: const Text('Mensagem'),
                  ),
                ]),
        ),
      ),
    );
  }

  Future<void> _message(BuildContext context, bool signedIn) async {
    if (!signedIn) { context.go('/login'); return; }
    final sent = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      builder: (_) => ItemMessageSheet(item: item),
    );
    if (sent == true && context.mounted) _openConversation(context, true);
  }

  void _openConversation(BuildContext context, bool signedIn) {
    if (!signedIn) { context.go('/login'); return; }
    context.push('/mensagens/conversa?itemId=${item.id}&otherUserId=${item.userId}&otherUserName=${Uri.encodeQueryComponent(item.user?.name ?? 'Vendedor')}&itemTitle=${Uri.encodeQueryComponent(item.title)}');
  }

  Future<void> _delete(BuildContext context, WidgetRef ref) async {
    final confirmed = await showDialog<bool>(
          context: context,
          builder: (dialogContext) => AlertDialog(
            title: const Text('Excluir anúncio?'),
            content: const Text('Essa ação não pode ser desfeita.'),
            actions: [
              TextButton(onPressed: () => Navigator.pop(dialogContext, false), child: const Text('Cancelar')),
              FilledButton(onPressed: () => Navigator.pop(dialogContext, true), child: const Text('Excluir')),
            ],
          ),
        ) ??
        false;
    if (!confirmed) return;
    try { await ref.read(itemFormProvider.notifier).delete(item.id); if (context.mounted) context.go('/perfil'); }
    catch (error) { if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(error.toString()))); }
  }
}
