import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:fazbrike/services/api_services.dart';
import 'package:fazbrike/services/models/api_response_model.dart';
import 'package:fazbrike/src/app/promotions/controllers/promotion_controller.dart';
import 'package:fazbrike/src/app/promotions/models/promotion_model.dart';
import 'package:fazbrike/src/app/promotions/widgets/promotion_slider.dart';

/// API falsa que responde a listagem e guarda as chamadas de métrica.
class _FakeApi implements ApiServices {
  _FakeApi({required this.target});

  final Map<String, dynamic> target;
  final List<String> posts = [];

  @override
  Future<ApiResponseModel<dynamic>> get(String route, {Map<String, dynamic>? query}) async {
    if (route == '/promotions') {
      return ApiResponseModel<dynamic>(data: [
        {
          'id': 7,
          'title': 'Minha loja',
          'subtitle': 'Confira meus anúncios',
          'image_url': '/api/uploads/banner.png',
          'cta_label': 'Ver loja',
          'target': target,
        },
      ], statusCode: 200);
    }
    return const ApiResponseModel<dynamic>(data: <dynamic>[], statusCode: 200);
  }

  @override
  Future<ApiResponseModel<dynamic>> post(String route, {Object? data, Map<String, dynamic>? query}) async {
    posts.add(route);
    if (route.endsWith('/click')) {
      return ApiResponseModel<dynamic>(data: {'target': target}, statusCode: 200);
    }
    return const ApiResponseModel<dynamic>(data: <dynamic>{}, statusCode: 200);
  }

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

/// Carrega as promoções antes de montar o slider, como a home faz.
class _SliderHarness extends ConsumerStatefulWidget {
  const _SliderHarness();
  @override
  ConsumerState<_SliderHarness> createState() => _SliderHarnessState();
}

class _SliderHarnessState extends ConsumerState<_SliderHarness> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() => ref.read(promotionsListProvider.notifier).list());
  }

  @override
  Widget build(BuildContext context) => const Scaffold(body: PromotionSlider());
}

Future<_FakeApi> _pumpSlider(WidgetTester tester, Map<String, dynamic> target) async {
  final api = _FakeApi(target: target);
  final router = GoRouter(
    routes: [
      GoRoute(path: '/', builder: (_, __) => const _SliderHarness()),
      GoRoute(
        path: '/usuario/:id',
        builder: (_, state) => Scaffold(body: Text('perfil ${state.pathParameters['id']}')),
      ),
    ],
  );
  addTearDown(router.dispose);

  await tester.pumpWidget(
    ProviderScope(
      overrides: [apiServicesProvider.overrideWithValue(api)],
      child: MaterialApp.router(routerConfig: router),
    ),
  );
  await tester.pumpAndSettle();
  return api;
}

void main() {
  group('banner com destino interno', () {
    testWidgets('o toque navega dentro do app, sem abrir link externo', (tester) async {
      final api = await _pumpSlider(tester, {
        'type': 'profile',
        'route': '/usuario/2',
        'label': 'Loja da Maria',
      });

      expect(find.text('Minha loja'), findsOneWidget);

      await tester.tap(find.text('Ver loja'));
      await tester.pumpAndSettle();

      // Caiu no perfil do anunciante, dentro do próprio app.
      expect(find.text('perfil 2'), findsOneWidget);
      expect(api.posts, contains('/promotions/7/click'));
    });

    testWidgets('a exibição é contada uma vez', (tester) async {
      final api = await _pumpSlider(tester, {'type': 'profile', 'route': '/usuario/2'});

      expect(api.posts.where((route) => route == '/promotions/impressions').length, 1);
    });
  });

  group('banner sem destino', () {
    testWidgets('aparece, mas não é clicável', (tester) async {
      final api = await _pumpSlider(tester, {'type': 'none'});

      expect(find.text('Minha loja'), findsOneWidget);

      await tester.tap(find.text('Ver loja'));
      await tester.pumpAndSettle();

      expect(api.posts.where((route) => route.endsWith('/click')), isEmpty);
    });
  });

  group('model do anunciante', () {
    test('lê destino resolvido, métricas e motivo de estar fora do ar', () {
      final promotion = MyPromotionModel.fromJson({
        'id': 3,
        'title': 'Minha loja',
        'image_url': '/api/uploads/banner.png',
        'target': {'type': 'item', 'route': '/produto/9', 'label': 'Bicicleta'},
        'target_type': 'item',
        'target_id': 9,
        'is_active': true,
        'is_visible': false,
        'unavailable_for': 'O anúncio de destino não está mais ativo.',
        'click_count': 4,
        'impression_count': 12,
      });

      expect(promotion.target.route, '/produto/9');
      expect(promotion.target.isInternal, isTrue);
      expect(promotion.targetId, 9);
      expect(promotion.isVisible, isFalse);
      expect(promotion.unavailableFor, contains('não está mais ativo'));
      expect(promotion.clickCount, 4);
      expect(promotion.copyWith(isActive: false).isActive, isFalse);
    });

    test('destino vazio não é clicável', () {
      const target = PromotionTargetModel();
      expect(target.isClickable, isFalse);
      expect(const PromotionTargetModel(type: 'external', externalUrl: 'https://x.com').isClickable, isTrue);
    });
  });
}
