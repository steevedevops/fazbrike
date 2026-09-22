import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:fazbrike/src/app/auth/controllers/auth_controller.dart';
import 'package:fazbrike/src/app/items/controllers/item_controller.dart';
import 'package:fazbrike/src/app/items/models/item_model.dart';
import 'package:fazbrike/src/shared/utils/app_utils.dart';
import 'package:fazbrike/src/shared/widgets/error_view.dart';
import 'package:fazbrike/src/shared/widgets/loading_view.dart';
import 'package:fazbrike/src/theme/app_spacing.dart';

class ItemCommentsSection extends ConsumerStatefulWidget {
  const ItemCommentsSection({super.key, required this.item});
  final ItemModel item;
  @override
  ConsumerState<ItemCommentsSection> createState() => _ItemCommentsSectionState();
}

class _ItemCommentsSectionState extends ConsumerState<ItemCommentsSection> {
  final controller = TextEditingController();
  String error = '';
  @override
  void dispose() { controller.dispose(); super.dispose(); }
  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authSessionProvider).value;
    final comments = ref.watch(itemCommentsProvider(widget.item.id));
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text('Perguntas públicas', style: Theme.of(context).textTheme.titleLarge),
      const SizedBox(height: AppSpacing.sm),
      const Text('Pergunte sobre o produto. Todos podem ver as perguntas.'),
      const SizedBox(height: AppSpacing.md),
      if (user == null)
        OutlinedButton(onPressed: () => context.go('/login'), child: const Text('Entre para perguntar'))
      else ...[
        TextField(controller: controller, maxLength: 300, maxLines: 3, decoration: const InputDecoration(hintText: 'Escreva sua pergunta...')),
        if (error.isNotEmpty) Text(error, style: TextStyle(color: Theme.of(context).colorScheme.error)),
        Align(
          alignment: Alignment.centerRight,
          child: FilledButton(
            onPressed: () async {
              if (controller.text.trim().isEmpty) { setState(() => error = 'Escreva uma pergunta ou comentário.'); return; }
              try { await ref.read(itemFormProvider.notifier).createComment(widget.item.id, controller.text); controller.clear(); setState(() => error = ''); }
              catch (exception) { setState(() => error = exception.toString()); }
            },
            child: const Text('Publicar pergunta'),
          ),
        ),
      ],
      const SizedBox(height: AppSpacing.lg),
      comments.when(
        loading: () => const SizedBox(height: 80, child: LoadingView()),
        error: (exception, _) => ErrorView(message: exception.toString(), onRetry: () => ref.read(itemCommentsProvider(widget.item.id).notifier).list()),
        data: (page) => page.results.isEmpty
            ? const Text('Ainda não há perguntas neste anúncio.')
            : Column(children: [for (final comment in page.results) Card(child: ListTile(
                title: Text(comment.userName),
                subtitle: Text('${comment.content}\n${formatDateTime(comment.createdAt)}'),
                isThreeLine: true,
                trailing: user != null && (comment.userId == user.id || widget.item.userId == user.id || user.role == 'admin')
                    ? IconButton(
                        tooltip: 'Remover',
                        onPressed: () async {
                          try { await ref.read(itemFormProvider.notifier).deleteComment(widget.item.id, comment.id); }
                          catch (exception) { if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(exception.toString()))); }
                        },
                        icon: const Icon(Icons.delete_outline),
                      )
                    : null,
              ))]),
      ),
    ]);
  }
}
