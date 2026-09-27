import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:fazbrike/services/api_services.dart';
import 'package:fazbrike/src/app/promotions/models/promotion_model.dart';
import 'package:fazbrike/src/shared/models/paginator_model.dart';

final promotionsListProvider = StateNotifierProvider<PromotionsListNotifier,
    AsyncValue<PaginatorModel<PromotionModel>>>((ref) => PromotionsListNotifier(ref));

class PromotionsListNotifier extends StateNotifier<AsyncValue<PaginatorModel<PromotionModel>>> {
  PromotionsListNotifier(this.ref) : super(const AsyncValue.loading());
  final Ref ref;

  Future<void> list({int? page, bool paginate = false}) async {
    state = const AsyncValue.loading();
    try {
      final response = await ref.read(apiServicesProvider).get('/promotions');
      state = AsyncValue.data(PaginatorModel(results: PromotionModel.fromJsonList(response.data)));
    } catch (error, stack) {
      state = AsyncValue.error(error, stack);
    }
  }
}
