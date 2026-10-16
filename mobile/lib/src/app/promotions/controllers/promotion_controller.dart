import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:fazbrike/services/api_services.dart';
import 'package:fazbrike/src/app/promotions/models/promotion_model.dart';
import 'package:fazbrike/src/shared/models/paginator_model.dart';
import 'package:fazbrike/src/shared/utils/json_utils.dart';

/// Banners da home.
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

/// Campanhas do próprio anunciante.
final myPromotionsProvider = StateNotifierProvider<MyPromotionsNotifier,
    AsyncValue<PaginatorModel<MyPromotionModel>>>((ref) => MyPromotionsNotifier(ref));

class MyPromotionsNotifier extends StateNotifier<AsyncValue<PaginatorModel<MyPromotionModel>>> {
  MyPromotionsNotifier(this.ref) : super(const AsyncValue.loading());
  final Ref ref;

  /// Quantas campanhas o anunciante pode manter ativas ao mesmo tempo (vem da
  /// configuração do backend).
  int maxActive = 2;

  Future<void> list({int? page, bool paginate = false}) async {
    state = const AsyncValue.loading();
    try {
      final response = await ref.read(apiServicesProvider).get('/promotions/mine');
      final data = asMap(response.data);
      maxActive = asInt(data['max_active'], 2);
      state = AsyncValue.data(PaginatorModel(results: MyPromotionModel.fromJsonList(data['results'])));
    } catch (error, stack) {
      state = AsyncValue.error(error, stack);
    }
  }

  void update(MyPromotionModel promotion) {
    state.whenData((paginator) {
      state = AsyncValue.data(paginator.copyWith(
        results: paginator.results.map((value) => value.id == promotion.id ? promotion : value).toList(),
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

/// Criação, edição e métricas das campanhas.
final promotionFormProvider =
    StateNotifierProvider<PromotionFormNotifier, AsyncValue<String>>((ref) => PromotionFormNotifier(ref));

class PromotionFormNotifier extends StateNotifier<AsyncValue<String>> {
  PromotionFormNotifier(this.ref) : super(const AsyncValue.data(''));
  final Ref ref;

  /// Ids já contados nesta sessão — a exibição vale uma vez por abertura da
  /// home, não uma por quadro do carrossel.
  final Set<int> _seen = {};

  Future<String> uploadImage(UploadFile file) async {
    final response = await ref.read(apiServicesProvider).upload('/promotions/image', [file]);
    final url = asMap(response.data)['image_url']?.toString() ?? '';
    if (url.isEmpty) throw Exception('Não foi possível enviar a imagem do banner.');
    return url;
  }

  Future<MyPromotionModel> create(Map<String, dynamic> body) async {
    state = const AsyncValue.loading();
    try {
      final response = await ref.read(apiServicesProvider).post('/promotions', data: body);
      final promotion = MyPromotionModel.fromJson(asMap(response.data));
      await ref.read(myPromotionsProvider.notifier).list();
      ref.read(promotionsListProvider.notifier).list();
      state = const AsyncValue.data('');
      return promotion;
    } catch (error, stack) {
      state = AsyncValue.error(error, stack);
      rethrow;
    }
  }

  Future<MyPromotionModel> update(int id, Map<String, dynamic> body) async {
    state = const AsyncValue.loading();
    try {
      final response = await ref.read(apiServicesProvider).put('/promotions/$id', data: body);
      final promotion = MyPromotionModel.fromJson(asMap(response.data));
      ref.read(myPromotionsProvider.notifier).update(promotion);
      ref.read(promotionsListProvider.notifier).list();
      state = const AsyncValue.data('');
      return promotion;
    } catch (error, stack) {
      state = AsyncValue.error(error, stack);
      rethrow;
    }
  }

  Future<void> setActive(MyPromotionModel promotion, bool isActive) async {
    try {
      final response = await ref.read(apiServicesProvider)
          .put('/promotions/${promotion.id}/status', data: {'is_active': isActive});
      ref.read(myPromotionsProvider.notifier).update(MyPromotionModel.fromJson(asMap(response.data)));
      ref.read(promotionsListProvider.notifier).list();
      state = const AsyncValue.data('');
    } catch (error) {
      state = AsyncValue.error(error.toString(), StackTrace.current);
      rethrow;
    }
  }

  Future<void> delete(int id) async {
    try {
      await ref.read(apiServicesProvider).delete('/promotions/$id');
      ref.read(myPromotionsProvider.notifier).remove(id);
      ref.read(promotionsListProvider.notifier).list();
      state = const AsyncValue.data('');
    } catch (error) {
      state = AsyncValue.error(error.toString(), StackTrace.current);
      rethrow;
    }
  }

  /// Registra o clique e devolve o destino confirmado na hora. Se a chamada
  /// falhar, o chamador segue com o destino que já veio na listagem — métrica
  /// nunca pode impedir a navegação.
  Future<PromotionTargetModel?> click(int id) async {
    try {
      final response = await ref.read(apiServicesProvider).post('/promotions/$id/click');
      return PromotionTargetModel.fromJson(asMap(asMap(response.data)['target']));
    } catch (_) {
      return null;
    }
  }

  Future<void> registerImpressions(Iterable<int> ids) async {
    final novos = ids.where((id) => id > 0 && _seen.add(id)).toList();
    if (novos.isEmpty) return;
    try {
      await ref.read(apiServicesProvider).post('/promotions/impressions', data: {'ids': novos});
    } catch (_) {
      // Métrica é acessório: falha não vira alerta na tela.
    }
  }
}
