import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:fazbrike/services/api_services.dart';
import 'package:fazbrike/src/app/messages/models/message_models.dart';
import 'package:fazbrike/src/shared/models/paginator_model.dart';
import 'package:fazbrike/src/shared/utils/json_utils.dart';

final conversationsListProvider = StateNotifierProvider<ConversationsListNotifier,
    AsyncValue<PaginatorModel<ConversationModel>>>((ref) => ConversationsListNotifier(ref));

class ConversationsListNotifier
    extends StateNotifier<AsyncValue<PaginatorModel<ConversationModel>>> {
  ConversationsListNotifier(this.ref) : super(const AsyncValue.loading());
  final Ref ref;
  Future<void> list({int? page, bool paginate = false, bool silent = false}) async {
    if (!silent) state = const AsyncValue.loading();
    try {
      final response = await ref.read(apiServicesProvider).get('/messages');
      state = AsyncValue.data(PaginatorModel(results: ConversationModel.fromJsonList(response.data)));
    } catch (error, stack) {
      if (!silent) state = AsyncValue.error(error, stack);
    }
  }
}

final threadProvider = StateNotifierProvider.family<ThreadNotifier,
    AsyncValue<PaginatorModel<MessageModel>>, (int, int)>(
  (ref, args) => ThreadNotifier(ref, args.$1, args.$2),
);

class ThreadNotifier extends StateNotifier<AsyncValue<PaginatorModel<MessageModel>>> {
  ThreadNotifier(this.ref, this.itemId, this.otherUserId) : super(const AsyncValue.loading()) {
    list(markRead: true);
  }
  final Ref ref;
  final int itemId;
  final int otherUserId;
  Timer? _timer;

  Future<void> list({int? page, bool paginate = false, bool markRead = false, bool silent = false}) async {
    if (!silent) state = const AsyncValue.loading();
    try {
      final response = await ref.read(apiServicesProvider).get(
        '/messages/item/$itemId',
        query: {'other_user_id': otherUserId},
      );
      state = AsyncValue.data(PaginatorModel(results: MessageModel.fromJsonList(response.data)));
      if (markRead) {
        await ref.read(apiServicesProvider).put('/messages/item/$itemId/read', query: {'other_user_id': otherUserId});
        await ref.read(conversationsListProvider.notifier).list(silent: true);
      }
      _timer ??= Timer.periodic(const Duration(seconds: 5), (_) => list(silent: true));
    } catch (error, stack) {
      if (!silent) state = AsyncValue.error(error, stack);
    }
  }

  void add(MessageModel message) => state.whenData((value) {
        state = AsyncValue.data(value.copyWith(results: [...value.results, message]));
      });

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }
}

final messageFormProvider =
    StateNotifierProvider<MessageFormNotifier, AsyncValue<String>>((ref) => MessageFormNotifier(ref));

class MessageFormNotifier extends StateNotifier<AsyncValue<String>> {
  MessageFormNotifier(this.ref) : super(const AsyncValue.data(''));
  final Ref ref;

  Future<MessageModel> send({
    required int itemId,
    required int receiverId,
    required String content,
    UploadFile? attachment,
  }) async {
    state = const AsyncValue.loading();
    try {
      MessageAttachmentModel? uploaded;
      if (attachment != null) {
        final response = await ref.read(apiServicesProvider).upload('/messages/attachment', [attachment]);
        uploaded = MessageAttachmentModel.fromJson(asMap(response.data));
      }
      final payload = <String, dynamic>{
        'receiver_id': receiverId,
        'content': content.trim(),
        if (itemId > 0) 'item_id': itemId,
        if (uploaded != null) ...{
          'attachment_url': uploaded.url,
          'attachment_name': uploaded.name,
          'attachment_mime': uploaded.mime,
          'attachment_size': uploaded.size,
          'attachment_kind': uploaded.kind,
        },
      };
      final response = await ref.read(apiServicesProvider).post('/messages', data: payload);
      final message = MessageModel.fromJson(asMap(response.data));
      ref.read(threadProvider((itemId, receiverId)).notifier).add(message);
      await ref.read(conversationsListProvider.notifier).list(silent: true);
      state = const AsyncValue.data('');
      return message;
    } catch (error, stack) { state = AsyncValue.error(error, stack); rethrow; }
  }
}
