import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:fazbrike/services/api_services.dart';
import 'package:fazbrike/src/app/help/models/help_models.dart';
import 'package:fazbrike/src/shared/models/paginator_model.dart';
import 'package:fazbrike/src/shared/utils/json_utils.dart';

/// Perguntas frequentes publicadas. A busca e o filtro por tema são feitos na
/// tela sobre a lista carregada (são poucas dezenas de perguntas).
final helpArticlesListProvider = StateNotifierProvider<HelpArticlesListNotifier,
    AsyncValue<PaginatorModel<HelpArticleModel>>>((ref) => HelpArticlesListNotifier(ref));

class HelpArticlesListNotifier extends StateNotifier<AsyncValue<PaginatorModel<HelpArticleModel>>> {
  HelpArticlesListNotifier(this.ref) : super(const AsyncValue.loading());
  final Ref ref;

  Future<void> list({int? page, bool paginate = false}) async {
    state = const AsyncValue.loading();
    try {
      final response = await ref.read(apiServicesProvider).get('/help/articles');
      state = AsyncValue.data(PaginatorModel(
        results: HelpArticleModel.fromJsonList(asMap(response.data)['results']),
      ));
    } catch (error, stack) {
      state = AsyncValue.error(error, stack);
    }
  }
}

/// Documento legal (termos, privacidade...) pelo slug.
final legalDocumentProvider = StateNotifierProvider.family<LegalDocumentNotifier,
    AsyncValue<LegalDocumentModel>, String>((ref, slug) => LegalDocumentNotifier(ref, slug));

class LegalDocumentNotifier extends StateNotifier<AsyncValue<LegalDocumentModel>> {
  LegalDocumentNotifier(this.ref, this.slug) : super(const AsyncValue.loading()) {
    load();
  }
  final Ref ref;
  final String slug;

  Future<void> load() async {
    state = const AsyncValue.loading();
    try {
      final response = await ref.read(apiServicesProvider).get('/legal/$slug');
      state = AsyncValue.data(LegalDocumentModel.fromJson(asMap(response.data)));
    } catch (error, stack) {
      state = AsyncValue.error(error, stack);
    }
  }
}

/// Chamados do usuário logado, com a resposta da equipe.
final supportRequestsListProvider = StateNotifierProvider<SupportRequestsListNotifier,
    AsyncValue<PaginatorModel<SupportRequestModel>>>((ref) => SupportRequestsListNotifier(ref));

class SupportRequestsListNotifier extends StateNotifier<AsyncValue<PaginatorModel<SupportRequestModel>>> {
  SupportRequestsListNotifier(this.ref) : super(const AsyncValue.loading());
  final Ref ref;

  Future<void> list({int? page, bool paginate = false}) async {
    state = const AsyncValue.loading();
    try {
      final response = await ref.read(apiServicesProvider).get('/support/requests/mine');
      state = AsyncValue.data(PaginatorModel(
        results: SupportRequestModel.fromJsonList(asMap(response.data)['results']),
      ));
    } catch (error, stack) {
      state = AsyncValue.error(error, stack);
    }
  }
}

/// Abertura de chamado (visitante ou logado).
final supportFormProvider =
    StateNotifierProvider<SupportFormNotifier, AsyncValue<String>>((ref) => SupportFormNotifier(ref));

class SupportFormNotifier extends StateNotifier<AsyncValue<String>> {
  SupportFormNotifier(this.ref) : super(const AsyncValue.data(''));
  final Ref ref;

  /// Devolve a mensagem de confirmação da API.
  Future<String> create(Map<String, dynamic> body, {bool authenticated = false}) async {
    state = const AsyncValue.loading();
    try {
      final response = await ref.read(apiServicesProvider).post('/support/requests', data: body);
      final message = asMap(response.data)['message']?.toString() ?? 'Chamado enviado.';
      if (authenticated) ref.read(supportRequestsListProvider.notifier).list();
      state = const AsyncValue.data('');
      return message;
    } catch (error, stack) {
      state = AsyncValue.error(error, stack);
      rethrow;
    }
  }
}
