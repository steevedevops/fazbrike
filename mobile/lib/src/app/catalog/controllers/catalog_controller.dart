import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:fazbrike/services/api_services.dart';
import 'package:fazbrike/src/app/catalog/models/catalog_models.dart';
import 'package:fazbrike/src/app/items/models/item_model.dart';
import 'package:fazbrike/src/shared/models/paginator_model.dart';

final catalogListProvider = StateNotifierProvider<CatalogListNotifier,
    AsyncValue<PaginatorModel<ItemModel>>>((ref) => CatalogListNotifier(ref));

class CatalogListNotifier
    extends StateNotifier<AsyncValue<PaginatorModel<ItemModel>>> {
  CatalogListNotifier(this.ref) : super(const AsyncValue.loading());
  final Ref ref;
  Map<String, dynamic> _lastQuery = const {};

  Future<void> list({Map<String, dynamic>? query, int? page, bool paginate = false}) async {
    _lastQuery = {...?query}..removeWhere((_, value) => value == null || value == '');
    state = const AsyncValue.loading();
    try {
      final response = await ref.read(apiServicesProvider).get('/items', query: _lastQuery);
      state = AsyncValue.data(PaginatorModel(results: ItemModel.fromJsonList(response.data)));
    } catch (error, stack) {
      state = AsyncValue.error(error, stack);
    }
  }

  Future<void> retry() => list(query: _lastQuery);

  void update(ItemModel item) {
    state.whenData((paginator) {
      state = AsyncValue.data(paginator.copyWith(
        results: paginator.results.map((value) => value.id == item.id ? item : value).toList(),
      ));
    });
  }

  void remove(int id) {
    state.whenData((paginator) {
      state = AsyncValue.data(paginator.copyWith(
        results: paginator.results.where((value) => value.id != id).toList(),
      ));
    });
  }
}

final categoriesProvider = StateNotifierProvider<CategoriesNotifier,
    AsyncValue<PaginatorModel<CategoryModel>>>((ref) => CategoriesNotifier(ref));

class CategoriesNotifier
    extends StateNotifier<AsyncValue<PaginatorModel<CategoryModel>>> {
  CategoriesNotifier(this.ref) : super(const AsyncValue.loading());
  final Ref ref;

  Future<void> list({String? listingType}) async {
    state = const AsyncValue.loading();
    try {
      final response = await ref.read(apiServicesProvider).get(
        '/categories',
        query: listingType == null ? null : {'listing_type': listingType},
      );
      state = AsyncValue.data(PaginatorModel(results: CategoryModel.fromJsonList(response.data)));
    } catch (error, stack) {
      state = AsyncValue.error(error, stack);
    }
  }
}

final statesProvider = StateNotifierProvider<StatesNotifier,
    AsyncValue<PaginatorModel<StateOptionModel>>>((ref) => StatesNotifier(ref));

class StatesNotifier
    extends StateNotifier<AsyncValue<PaginatorModel<StateOptionModel>>> {
  StatesNotifier(this.ref) : super(const AsyncValue.loading());
  final Ref ref;
  Future<void> list() async {
    state = const AsyncValue.loading();
    try {
      final response = await ref.read(apiServicesProvider).get('/states');
      state = AsyncValue.data(PaginatorModel(results: StateOptionModel.fromJsonList(response.data)));
    } catch (error, stack) {
      state = AsyncValue.error(error, stack);
    }
  }
}

final citiesProvider = StateNotifierProvider<CitiesNotifier,
    AsyncValue<PaginatorModel<CityOptionModel>>>((ref) => CitiesNotifier(ref));

class CitiesNotifier
    extends StateNotifier<AsyncValue<PaginatorModel<CityOptionModel>>> {
  CitiesNotifier(this.ref) : super(const AsyncValue.data(PaginatorModel(results: [])));
  final Ref ref;
  Future<void> list(int stateId, {String? query}) async {
    state = const AsyncValue.loading();
    try {
      final response = await ref.read(apiServicesProvider).get(
        '/cities',
        query: {'state_id': stateId, if (query != null && query.isNotEmpty) 'q': query},
      );
      state = AsyncValue.data(PaginatorModel(results: CityOptionModel.fromJsonList(response.data)));
    } catch (error, stack) {
      state = AsyncValue.error(error, stack);
    }
  }
}
