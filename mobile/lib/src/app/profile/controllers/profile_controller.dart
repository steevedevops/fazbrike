import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:fazbrike/services/api_services.dart';
import 'package:fazbrike/src/app/auth/controllers/auth_controller.dart';
import 'package:fazbrike/src/app/items/models/item_model.dart';
import 'package:fazbrike/src/app/profile/models/profile_models.dart';
import 'package:fazbrike/src/shared/models/paginator_model.dart';
import 'package:fazbrike/src/shared/utils/json_utils.dart';

final myProfileProvider = StateNotifierProvider<MyProfileNotifier,
    AsyncValue<MyProfileModel>>((ref) => MyProfileNotifier(ref));

class MyProfileNotifier extends StateNotifier<AsyncValue<MyProfileModel>> {
  MyProfileNotifier(this.ref) : super(const AsyncValue.loading());
  final Ref ref;
  Future<void> load() async {
    state = const AsyncValue.loading();
    try {
      final response = await ref.read(apiServicesProvider).get('/profile');
      state = AsyncValue.data(MyProfileModel.fromJson(asMap(response.data)));
    } catch (error, stack) {
      state = AsyncValue.error(error, stack);
    }
  }
  void replace(MyProfileModel value) => state = AsyncValue.data(value);
}

final myItemsListProvider = StateNotifierProvider<MyItemsListNotifier,
    AsyncValue<PaginatorModel<ItemModel>>>((ref) => MyItemsListNotifier(ref));

class MyItemsListNotifier
    extends StateNotifier<AsyncValue<PaginatorModel<ItemModel>>> {
  MyItemsListNotifier(this.ref) : super(const AsyncValue.loading());
  final Ref ref;
  Future<void> list({int? page, bool paginate = false}) async {
    state = const AsyncValue.loading();
    try {
      final response = await ref.read(apiServicesProvider).get('/items/my');
      state = AsyncValue.data(PaginatorModel(results: ItemModel.fromJsonList(response.data)));
    } catch (error, stack) {
      state = AsyncValue.error(error, stack);
    }
  }
  void update(ItemModel item) => state.whenData((value) {
        state = AsyncValue.data(value.copyWith(
          results: value.results.map((current) => current.id == item.id ? item : current).toList(),
        ));
      });
  void insert(ItemModel item) => state.whenData((value) {
        state = AsyncValue.data(value.copyWith(results: [item, ...value.results]));
      });
  void remove(int id) => state.whenData((value) {
        state = AsyncValue.data(value.copyWith(results: value.results.where((item) => item.id != id).toList()));
      });
}

final profileFormProvider =
    StateNotifierProvider<ProfileFormNotifier, AsyncValue<String>>((ref) => ProfileFormNotifier(ref));

class ProfileFormNotifier extends StateNotifier<AsyncValue<String>> {
  ProfileFormNotifier(this.ref) : super(const AsyncValue.data(''));
  final Ref ref;

  Future<MyProfileModel> update(Map<String, dynamic> body) async {
    state = const AsyncValue.loading();
    try {
      final response = await ref.read(apiServicesProvider).put('/profile', data: body);
      final profile = MyProfileModel.fromJson(asMap(response.data));
      ref.read(myProfileProvider.notifier).replace(profile);
      ref.read(authSessionProvider.notifier).setAuthenticated(profile.user);
      state = const AsyncValue.data('');
      return profile;
    } catch (error, stack) {
      state = AsyncValue.error(error, stack);
      rethrow;
    }
  }

  Future<void> uploadAvatar(UploadFile file) async {
    await ref.read(apiServicesProvider).upload('/profile/avatar', [file]);
    await ref.read(myProfileProvider.notifier).load();
  }

  Future<void> uploadBanner(UploadFile file) async {
    await ref.read(apiServicesProvider).upload('/profile/banner', [file]);
    await ref.read(myProfileProvider.notifier).load();
  }
}

final publicProfileProvider = StateNotifierProvider.family<PublicProfileNotifier,
    AsyncValue<PublicProfileModel>, int>((ref, id) => PublicProfileNotifier(ref, id));

class PublicProfileNotifier extends StateNotifier<AsyncValue<PublicProfileModel>> {
  PublicProfileNotifier(this.ref, this.userId) : super(const AsyncValue.loading()) {
    load();
  }
  final Ref ref;
  final int userId;
  Future<void> load() async {
    state = const AsyncValue.loading();
    try {
      final response = await ref.read(apiServicesProvider).get('/users/$userId');
      state = AsyncValue.data(PublicProfileModel.fromJson(asMap(response.data)));
    } catch (error, stack) {
      state = AsyncValue.error(error, stack);
    }
  }
}

final publicItemsProvider = StateNotifierProvider.family<PublicItemsNotifier,
    AsyncValue<PaginatorModel<ItemModel>>, (int, String, String)>(
  (ref, args) => PublicItemsNotifier(ref, args.$1, args.$2, args.$3),
);

class PublicItemsNotifier
    extends StateNotifier<AsyncValue<PaginatorModel<ItemModel>>> {
  PublicItemsNotifier(this.ref, this.userId, this.status, this.query)
      : super(const AsyncValue.loading()) {
    list();
  }
  final Ref ref;
  final int userId;
  final String status;
  final String query;
  Future<void> list({int? page, bool paginate = false}) async {
    state = const AsyncValue.loading();
    try {
      final response = await ref.read(apiServicesProvider).get(
        '/users/$userId/items',
        query: {'status': status, if (query.trim().isNotEmpty) 'q': query.trim()},
      );
      state = AsyncValue.data(PaginatorModel(results: ItemModel.fromJsonList(response.data)));
    } catch (error, stack) {
      state = AsyncValue.error(error, stack);
    }
  }
}

final favoritesProvider = StateNotifierProvider.family<FavoritesNotifier,
    AsyncValue<PaginatorModel<ItemModel>>, int>((ref, id) => FavoritesNotifier(ref, id));

class FavoritesNotifier extends StateNotifier<AsyncValue<PaginatorModel<ItemModel>>> {
  FavoritesNotifier(this.ref, this.userId) : super(const AsyncValue.loading()) { list(); }
  final Ref ref;
  final int userId;
  Future<void> list({int? page, bool paginate = false}) async {
    state = const AsyncValue.loading();
    try {
      final response = await ref.read(apiServicesProvider).get('/users/$userId/favorites');
      state = AsyncValue.data(PaginatorModel(results: ItemModel.fromJsonList(response.data)));
    } catch (error, stack) { state = AsyncValue.error(error, stack); }
  }
}

final followersProvider = StateNotifierProvider.family<PeopleNotifier,
    AsyncValue<PaginatorModel<FollowUserModel>>, (int, bool)>(
  (ref, args) => PeopleNotifier(ref, args.$1, args.$2),
);

class PeopleNotifier extends StateNotifier<AsyncValue<PaginatorModel<FollowUserModel>>> {
  PeopleNotifier(this.ref, this.userId, this.following) : super(const AsyncValue.loading()) { list(); }
  final Ref ref;
  final int userId;
  final bool following;
  Future<void> list({int? page, bool paginate = false}) async {
    state = const AsyncValue.loading();
    try {
      final response = await ref.read(apiServicesProvider).get('/users/$userId/${following ? 'following' : 'followers'}');
      state = AsyncValue.data(PaginatorModel(results: FollowUserModel.fromJsonList(response.data)));
    } catch (error, stack) { state = AsyncValue.error(error, stack); }
  }
}

final reviewsProvider = StateNotifierProvider.family<ReviewsNotifier,
    AsyncValue<PaginatorModel<ReviewModel>>, int>((ref, id) => ReviewsNotifier(ref, id));

class ReviewsNotifier extends StateNotifier<AsyncValue<PaginatorModel<ReviewModel>>> {
  ReviewsNotifier(this.ref, this.userId) : super(const AsyncValue.loading()) { list(); }
  final Ref ref;
  final int userId;
  Future<void> list({int? page, bool paginate = false}) async {
    state = const AsyncValue.loading();
    try {
      final response = await ref.read(apiServicesProvider).get('/users/$userId/reviews');
      state = AsyncValue.data(PaginatorModel(results: ReviewModel.fromJsonList(response.data)));
    } catch (error, stack) { state = AsyncValue.error(error, stack); }
  }
  void update(ReviewModel review) => state.whenData((value) {
        final exists = value.results.any((item) => item.id == review.id);
        state = AsyncValue.data(value.copyWith(results: exists
            ? value.results.map((item) => item.id == review.id ? review : item).toList()
            : [review, ...value.results]));
      });
  void remove(int id) => state.whenData((value) {
        state = AsyncValue.data(value.copyWith(results: value.results.where((item) => item.id != id).toList()));
      });
}

final socialFormProvider =
    StateNotifierProvider<SocialFormNotifier, AsyncValue<String>>((ref) => SocialFormNotifier(ref));

class SocialFormNotifier extends StateNotifier<AsyncValue<String>> {
  SocialFormNotifier(this.ref) : super(const AsyncValue.data(''));
  final Ref ref;
  Future<void> setFollowing(int userId, bool follow) async {
    state = const AsyncValue.loading();
    try {
      if (follow) {
        await ref.read(apiServicesProvider).post('/users/$userId/follow');
      } else {
        await ref.read(apiServicesProvider).delete('/users/$userId/follow');
      }
      await ref.read(publicProfileProvider(userId).notifier).load();
      state = const AsyncValue.data('');
    } catch (error, stack) { state = AsyncValue.error(error, stack); rethrow; }
  }
  Future<ReviewModel> saveReview(int userId, int rating, String comment, {int? reviewId}) async {
    state = const AsyncValue.loading();
    try {
      final response = reviewId == null
          ? await ref.read(apiServicesProvider).post('/reviews', data: {'reviewee_id': userId, 'rating': rating, 'comment': comment.trim()})
          : await ref.read(apiServicesProvider).put('/reviews/$reviewId', data: {'rating': rating, 'comment': comment.trim()});
      final review = ReviewModel.fromJson(asMap(response.data));
      ref.read(reviewsProvider(userId).notifier).update(review);
      await ref.read(publicProfileProvider(userId).notifier).load();
      state = const AsyncValue.data('');
      return review;
    } catch (error, stack) { state = AsyncValue.error(error, stack); rethrow; }
  }
  Future<void> deleteReview(int userId, int reviewId) async {
    state = const AsyncValue.loading();
    try {
      await ref.read(apiServicesProvider).delete('/reviews/$reviewId');
      ref.read(reviewsProvider(userId).notifier).remove(reviewId);
      await ref.read(publicProfileProvider(userId).notifier).load();
      state = const AsyncValue.data('');
    } catch (error, stack) { state = AsyncValue.error(error, stack); rethrow; }
  }
}
