import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:fazbrike/services/api_services.dart';
import 'package:fazbrike/src/app/catalog/controllers/catalog_controller.dart';
import 'package:fazbrike/src/app/items/models/item_model.dart';
import 'package:fazbrike/src/shared/models/paginator_model.dart';
import 'package:fazbrike/src/shared/utils/json_utils.dart';

final itemDetailProvider = StateNotifierProvider.family<ItemDetailNotifier,
    AsyncValue<ItemModel>, int>((ref, id) => ItemDetailNotifier(ref, id));

class ItemDetailNotifier extends StateNotifier<AsyncValue<ItemModel>> {
  ItemDetailNotifier(this.ref, this.id) : super(const AsyncValue.loading()) {
    load();
  }
  final Ref ref;
  final int id;

  Future<void> load() async {
    state = const AsyncValue.loading();
    try {
      final response = await ref.read(apiServicesProvider).get('/items/$id');
      state = AsyncValue.data(ItemModel.fromJson(asMap(response.data)));
    } catch (error, stack) {
      state = AsyncValue.error(error, stack);
    }
  }

  void replace(ItemModel item) => state = AsyncValue.data(item);
}

final itemCommentsProvider = StateNotifierProvider.family<ItemCommentsNotifier,
    AsyncValue<PaginatorModel<ItemCommentModel>>, int>(
  (ref, id) => ItemCommentsNotifier(ref, id),
);

final relatedItemsProvider = StateNotifierProvider.family<RelatedItemsNotifier,
    AsyncValue<PaginatorModel<ItemModel>>, (int, String)>(
  (ref, args) => RelatedItemsNotifier(ref, args.$1, args.$2),
);

class RelatedItemsNotifier
    extends StateNotifier<AsyncValue<PaginatorModel<ItemModel>>> {
  RelatedItemsNotifier(this.ref, this.itemId, this.category)
      : super(const AsyncValue.loading()) {
    list();
  }
  final Ref ref;
  final int itemId;
  final String category;
  Future<void> list({int? page, bool paginate = false}) async {
    state = const AsyncValue.loading();
    try {
      final response = await ref.read(apiServicesProvider).get(
        '/items',
        query: category.isEmpty ? null : {'category': category},
      );
      final items = ItemModel.fromJsonList(response.data)
          .where((item) => item.id != itemId)
          .take(8)
          .toList();
      state = AsyncValue.data(PaginatorModel(results: items));
    } catch (error, stack) {
      state = AsyncValue.error(error, stack);
    }
  }
}

class ItemCommentsNotifier
    extends StateNotifier<AsyncValue<PaginatorModel<ItemCommentModel>>> {
  ItemCommentsNotifier(this.ref, this.itemId) : super(const AsyncValue.loading()) {
    list();
  }
  final Ref ref;
  final int itemId;
  Future<void> list() async {
    state = const AsyncValue.loading();
    try {
      final response = await ref.read(apiServicesProvider).get('/items/$itemId/comments');
      state = AsyncValue.data(PaginatorModel(results: ItemCommentModel.fromJsonList(response.data)));
    } catch (error, stack) {
      state = AsyncValue.error(error, stack);
    }
  }
  void add(ItemCommentModel comment) => state.whenData((value) {
        state = AsyncValue.data(value.copyWith(results: [comment, ...value.results]));
      });
  void remove(int id) => state.whenData((value) {
        state = AsyncValue.data(value.copyWith(results: value.results.where((item) => item.id != id).toList()));
      });
}

final itemFormProvider =
    StateNotifierProvider<ItemFormNotifier, AsyncValue<String>>((ref) => ItemFormNotifier(ref));

class ItemFormNotifier extends StateNotifier<AsyncValue<String>> {
  ItemFormNotifier(this.ref) : super(const AsyncValue.data(''));
  final Ref ref;

  Future<ItemModel> create(Map<String, dynamic> body, List<UploadFile> photos) async {
    state = const AsyncValue.loading();
    try {
      final response = await ref.read(apiServicesProvider).post('/items', data: body);
      var item = ItemModel.fromJson(asMap(response.data));
      if (photos.isNotEmpty) {
        await uploadPhotos(item.id, photos);
        final refreshed = await ref.read(apiServicesProvider).get('/items/${item.id}');
        item = ItemModel.fromJson(asMap(refreshed.data));
      }
      ref.read(catalogListProvider.notifier).list();
      state = const AsyncValue.data('');
      return item;
    } catch (error, stack) {
      state = AsyncValue.error(error, stack);
      rethrow;
    }
  }

  Future<ItemModel> update(int id, Map<String, dynamic> body) async {
    state = const AsyncValue.loading();
    try {
      final response = await ref.read(apiServicesProvider).put('/items/$id', data: body);
      final item = ItemModel.fromJson(asMap(response.data));
      ref.read(catalogListProvider.notifier).update(item);
      ref.read(itemDetailProvider(id).notifier).replace(item);
      state = const AsyncValue.data('');
      return item;
    } catch (error, stack) {
      state = AsyncValue.error(error, stack);
      rethrow;
    }
  }

  Future<void> delete(int id) async {
    state = const AsyncValue.loading();
    try {
      await ref.read(apiServicesProvider).delete('/items/$id');
      ref.read(catalogListProvider.notifier).remove(id);
      state = const AsyncValue.data('');
    } catch (error, stack) {
      state = AsyncValue.error(error, stack);
      rethrow;
    }
  }

  Future<void> uploadPhotos(int id, List<UploadFile> photos) async {
    if (photos.isEmpty) return;
    await ref.read(apiServicesProvider).upload('/items/$id/images', photos, field: 'files');
  }

  Future<void> deletePhoto(int itemId, int imageId) async {
    await ref.read(apiServicesProvider).delete('/items/$itemId/images/$imageId');
  }

  Future<ItemModel> updateStatus(int itemId, String status, {Map<String, dynamic>? survey}) async {
    final response = await ref.read(apiServicesProvider).put(
      '/items/$itemId/status',
      data: {'status': status, ...?survey},
    );
    return ItemModel.fromJson(asMap(response.data));
  }

  Future<ItemModel> duplicate(int itemId) async {
    final response = await ref.read(apiServicesProvider).post('/items/$itemId/duplicate');
    return ItemModel.fromJson(asMap(response.data));
  }

  Future<String> boost(int itemId) async {
    await ref.read(apiServicesProvider).post('/items/$itemId/boost');
    return 'Solicitação de impulsionamento enviada.';
  }

  Future<ItemModel> toggleFavorite(ItemModel item) async {
    final response = item.isFavorited
        ? await ref.read(apiServicesProvider).delete('/items/${item.id}/favorite')
        : await ref.read(apiServicesProvider).post('/items/${item.id}/favorite');
    final data = asMap(response.data);
    final updated = item.copyWith(
      isFavorited: asBool(data['favorited']),
      favoritesCount: asInt(data['favorites_count']),
    );
    ref.read(catalogListProvider.notifier).update(updated);
    ref.read(itemDetailProvider(item.id).notifier).replace(updated);
    return updated;
  }

  Future<void> registerView(int itemId) async {
    await ref.read(apiServicesProvider).post('/items/$itemId/view');
  }

  Future<ItemCommentModel> createComment(int itemId, String content) async {
    final response = await ref.read(apiServicesProvider).post(
      '/items/$itemId/comments',
      data: {'content': content.trim()},
    );
    final comment = ItemCommentModel.fromJson(asMap(response.data));
    ref.read(itemCommentsProvider(itemId).notifier).add(comment);
    return comment;
  }

  Future<void> deleteComment(int itemId, int commentId) async {
    await ref.read(apiServicesProvider).delete('/items/$itemId/comments/$commentId');
    ref.read(itemCommentsProvider(itemId).notifier).remove(commentId);
  }
}
