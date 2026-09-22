import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:fazbrike/src/app/messages/controllers/messages_controller.dart';
import 'package:fazbrike/src/shared/utils/app_utils.dart';
import 'package:fazbrike/src/shared/widgets/empty_view.dart';
import 'package:fazbrike/src/shared/widgets/error_view.dart';
import 'package:fazbrike/src/shared/widgets/loading_view.dart';
import 'package:fazbrike/src/shared/widgets/remote_image.dart';

class ConversationList extends ConsumerWidget {
  const ConversationList({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) => ref.watch(conversationsListProvider).when(
        loading: () => const LoadingView(),
        error: (error, _) => ErrorView(message: error.toString(), onRetry: () => ref.read(conversationsListProvider.notifier).list()),
        data: (page) => page.results.isEmpty
            ? const EmptyView(title: 'Nenhuma conversa ainda', description: 'Suas conversas com compradores e vendedores aparecem aqui.')
            : RefreshIndicator(
                onRefresh: () => ref.read(conversationsListProvider.notifier).list(),
                child: ListView.separated(
                  itemCount: page.results.length,
                  separatorBuilder: (_, __) => const Divider(height: 1),
                  itemBuilder: (_, index) {
                    final conversation = page.results[index];
                    return ListTile(
                      leading: CircleAvatar(
                        child: conversation.otherUserAvatarUrl.isEmpty
                            ? Text(conversation.otherUserName.characters.first.toUpperCase())
                            : ClipOval(child: RemoteImage(url: conversation.otherUserAvatarUrl, fallbackAsset: 'lib/assets/images/categories/outros.jpg')),
                      ),
                      title: Text(conversation.otherUserName, style: TextStyle(fontWeight: conversation.unreadCount > 0 ? FontWeight.bold : null)),
                      subtitle: Text('${conversation.itemTitle}\n${conversation.lastMessage}', maxLines: 2, overflow: TextOverflow.ellipsis),
                      isThreeLine: true,
                      trailing: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                        Text(formatDate(conversation.lastMessageAt), style: Theme.of(context).textTheme.bodySmall),
                        if (conversation.unreadCount > 0) Badge(label: Text('${conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}')),
                      ]),
                      onTap: () => context.push('/mensagens/conversa?itemId=${conversation.itemId ?? 0}&otherUserId=${conversation.otherUserId}&otherUserName=${Uri.encodeQueryComponent(conversation.otherUserName)}&itemTitle=${Uri.encodeQueryComponent(conversation.itemTitle)}'),
                    );
                  },
                ),
              ),
      );
}
