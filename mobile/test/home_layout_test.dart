import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:fazbrike/services/api_services.dart';
import 'package:fazbrike/services/models/api_response_model.dart';
import 'package:fazbrike/src/app/catalog/screens/categories_screen.dart';
import 'package:fazbrike/src/app/catalog/screens/home_screen.dart';
import 'package:fazbrike/src/shared/widgets/showcase_card.dart';

/// API falsa com o mínimo que a home consome: categorias, promoções e itens.
class _FakeApi implements ApiServices {
  _FakeApi({this.promotions = const []});

  final List<Map<String, dynamic>> promotions;
  static const _itemCount = 4;
  final List<String> routes = [];

  @override
  Future<ApiResponseModel<dynamic>> get(String route, {Map<String, dynamic>? query}) async {
    routes.add(route);
    if (route == '/categories') {
      return ApiResponseModel<dynamic>(data: [
        {'id': 1, 'slug': 'veiculos', 'name': 'Veículos', 'icon': 'veiculos', 'listing_type': 'item'},
        {'id': 2, 'slug': 'eletronicos', 'name': 'Eletrônicos', 'icon': 'eletronicos', 'listing_type': 'item'},
      ], statusCode: 200);
    }
    if (route == '/promotions') {
      return ApiResponseModel<dynamic>(data: promotions, statusCode: 200);
    }
    if (route == '/items') {
      return ApiResponseModel<dynamic>(
        data: List.generate(_itemCount, (index) => {
              'id': index + 1,
              'title': 'Bicicleta ${index + 1}',
              'description': '',
              'price': 120.0,
              'user_id': 9,
              'category': 'veiculos',
              'location': 'São Paulo, SP',
              'created_at': '2026-01-01T10:00:00Z',
              'updated_at': '2026-01-01T10:00:00Z',
            }),
        statusCode: 200,
      );
    }
    return const ApiResponseModel<dynamic>(data: <dynamic>[], statusCode: 200);
  }

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

Future<_FakeApi> _pumpHome(WidgetTester tester, {List<Map<String, dynamic>> promotions = const []}) async {
  tester.view.physicalSize = const Size(1179, 2556);
  tester.view.devicePixelRatio = 3;
  addTearDown(tester.view.resetPhysicalSize);
  addTearDown(tester.view.resetDevicePixelRatio);

  final api = _FakeApi(promotions: promotions);
  await tester.pumpWidget(
    ProviderScope(
      overrides: [apiServicesProvider.overrideWithValue(api)],
      child: const MaterialApp(home: HomeScreen()),
    ),
  );
  await tester.pumpAndSettle();
  return api;
}

void main() {
  group('home', () {
    testWidgets('busca e trilho de categorias ficam no topo', (tester) async {
      await _pumpHome(tester);

      expect(find.text('O que você procura?'), findsOneWidget); // hint da busca
      expect(find.text('Todos'), findsOneWidget);
      expect(find.text('Veículos'), findsWidgets);
    });

    testWidgets('sem campanha cadastrada mostra o destaque padrão', (tester) async {
      await _pumpHome(tester);

      expect(find.text('Compre. Venda. Conecte.'), findsOneWidget);
      expect(find.widgetWithText(FilledButton, 'Vender um item'), findsOneWidget);
    });

    testWidgets('com campanha o destaque vira o banner do admin', (tester) async {
      await _pumpHome(tester, promotions: [
        {
          'id': 1,
          'title': 'Semana de ofertas',
          'subtitle': 'Descontos em eletrônicos',
          'image_url': '',
          'link_url': '/categoria/eletronicos',
          'cta_label': 'Ver ofertas',
        },
      ]);

      expect(find.text('Semana de ofertas'), findsOneWidget);
      expect(find.text('Compre. Venda. Conecte.'), findsNothing);
    });

    testWidgets('vitrines vêm em carrossel com preço sobre a foto', (tester) async {
      await _pumpHome(tester);

      expect(find.text('Novidades'), findsOneWidget);
      expect(find.text('Menores preços'), findsOneWidget);
      expect(find.byType(ShowcaseCard), findsWidgets);
      expect(find.textContaining('120,00'), findsWidgets);
    });

    testWidgets('a home usa vitrines próprias, não a lista da tela Explorar', (tester) async {
      final api = await _pumpHome(tester);

      // Duas chamadas a /items: novidades e menores preços.
      expect(api.routes.where((route) => route == '/items').length, 2);
    });
  });

  testWidgets('categorias abrem em grade com foto', (tester) async {
    tester.view.physicalSize = const Size(1179, 2556);
    tester.view.devicePixelRatio = 3;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    await tester.pumpWidget(
      ProviderScope(
        overrides: [apiServicesProvider.overrideWithValue(_FakeApi())],
        child: const MaterialApp(home: CategoriesScreen()),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Categorias'), findsOneWidget);
    expect(find.text('Veículos'), findsOneWidget);
    expect(find.text('Eletrônicos'), findsOneWidget);
  });
}
