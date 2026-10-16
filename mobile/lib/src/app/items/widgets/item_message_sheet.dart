import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:fazbrike/src/app/items/models/item_model.dart';
import 'package:fazbrike/src/app/messages/controllers/messages_controller.dart';
import 'package:fazbrike/src/theme/app_spacing.dart';

/// Primeira mensagem ao anunciante. Fecha com `true` quando enviou.
class ItemMessageSheet extends ConsumerStatefulWidget {
  const ItemMessageSheet({super.key, required this.item});
  final ItemModel item;
  @override
  ConsumerState<ItemMessageSheet> createState() => _ItemMessageSheetState();
}

class _ItemMessageSheetState extends ConsumerState<ItemMessageSheet> {
  static const _maxLength = 150;
  late final message = TextEditingController(
    text: _clip('Olá, gostaria de mais informações sobre este anúncio: ${widget.item.title}.'),
  );
  bool busy = false;
  String error = '';

  @override
  void dispose() { message.dispose(); super.dispose(); }

  String _clip(String value) => value.length > _maxLength ? value.substring(0, _maxLength) : value;

  Future<void> _send() async {
    final content = message.text.trim();
    if (content.isEmpty) { setState(() => error = 'Escreva uma mensagem.'); return; }
    setState(() { busy = true; error = ''; });
    try {
      await ref.read(messageFormProvider.notifier).send(itemId: widget.item.id, receiverId: widget.item.userId, content: _clip(content));
      if (mounted) Navigator.of(context).pop(true);
    } catch (exception) {
      if (mounted) setState(() { busy = false; error = exception.toString(); });
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: EdgeInsets.fromLTRB(AppSpacing.lg, AppSpacing.lg, AppSpacing.lg, AppSpacing.lg + MediaQuery.viewInsetsOf(context).bottom),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text('Fale com o anunciante', style: theme.textTheme.titleLarge),
          const SizedBox(height: 2),
          Text(widget.item.title, style: theme.textTheme.bodySmall, maxLines: 1, overflow: TextOverflow.ellipsis),
          const SizedBox(height: AppSpacing.md),
          TextField(
            controller: message,
            autofocus: true,
            maxLength: _maxLength,
            minLines: 3,
            maxLines: 5,
            decoration: const InputDecoration(hintText: 'Escreva sua mensagem'),
          ),
          if (error.isNotEmpty) ...[
            Text(error, style: TextStyle(color: theme.colorScheme.error)),
            const SizedBox(height: AppSpacing.sm),
          ],
          FilledButton(onPressed: busy ? null : _send, child: Text(busy ? 'Enviando...' : 'Enviar mensagem')),
        ],
      ),
    );
  }
}
