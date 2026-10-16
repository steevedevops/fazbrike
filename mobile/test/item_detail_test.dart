import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'package:fazbrike/services/api_services.dart';
import 'package:fazbrike/services/models/api_response_model.dart';
import 'package:fazbrike/src/app/items/controllers/item_controller.dart';
import 'package:fazbrike/src/app/items/models/item_model.dart';
import 'package:fazbrike/src/app/items/screens/item_detail_screen.dart';

Map<String, dynamic> _json({
  required int id,
  String title = 'Apartamento 2 quartos no centro',
  String category = 'apartamento-aluguel',
  String listingType = 'property',
  int? cityId = 10,
  int? stateId = 1,
  double price = 2000,
  String attrs = '{"listing_mode":"rent","property_type":"apartment","bedrooms":"2","bathrooms":"1","area_m2":"68","furnished":"partial","pets_allowed":"yes"}',
}) =>
    {
      'id': id,
      'title': title,
      'description': 'Apartamento claro, perto do metrô e de comércio.\n' * 6,
      'price': price,
      'user_id': 9,
      'user': {'id': 9, 'name': 'Marina Souza', 'created_at': '2024-03-01T10:00:00Z'},
      'category': category,
      'listing_type': listingType,
      'city_id': cityId,
      'state_id': stateId,
      'location': 'São Paulo, SP',
      'attrs': attrs,
      'views_count': 31,
      'favorites_count': 1,
      'comments_count': 0,
      'created_at': '2026-01-01T10:00:00Z',
      'updated_at': '2026-01-01T10:00:00Z',
    };

/// API falsa: detalhe do anúncio, perguntas e a busca de relacionados.
class _FakeApi implements ApiServices {
  _FakeApi(this.detail, this.related);
  final Map<String, dynamic> detail;
  final List<Map<String, dynamic>> related;
  final List<(String, Map<String, dynamic>?)> calls = [];

  @override
  Future<ApiResponseModel<dynamic>> get(String route, {Map<String, dynamic>? query}) async {
    calls.add((route, query));
    if (route == '/items/${detail['id']}') return ApiResponseModel<dynamic>(data: detail, statusCode: 200);
    if (route == '/items') return ApiResponseModel<dynamic>(data: related, statusCode: 200);
    return const ApiResponseModel<dynamic>(data: <dynamic>[], statusCode: 200);
  }

  Map<String, dynamic>? queryFor(String route) => calls.firstWhere((call) => call.$1 == route).$2;

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

Future<_FakeApi> _pump(WidgetTester tester, Map<String, dynamic> detail, List<Map<String, dynamic>> related) async {
  tester.view.physicalSize = const Size(1179, 2556); // iPhone 15
  tester.view.devicePixelRatio = 3;
  addTearDown(tester.view.resetPhysicalSize);
  addTearDown(tester.view.resetDevicePixelRatio);

  final api = _FakeApi(detail, related);
  await tester.pumpWidget(ProviderScope(
    overrides: [apiServicesProvider.overrideWithValue(api)],
    child: MaterialApp(home: ItemDetailScreen(itemId: detail['id'] as int)),
  ));
  await tester.pumpAndSettle();
  return api;
}

void main() {
  setUpAll(() => initializeDateFormatting('pt_BR'));
  setUp(() => FlutterSecureStorage.setMockInitialValues({}));

  group('ranking de relacionados', () {
    final current = ItemModel.fromJson(_json(id: 1));

    test('prioriza mesma cidade, finalidade e preço próximo e tira o próprio anúncio', () {
      final candidates = [
        ItemModel.fromJson(_json(id: 2, cityId: 99, stateId: 5, attrs: '{"listing_mode":"sale"}', price: 900000)),
        ItemModel.fromJson(_json(id: 1)),
        ItemModel.fromJson(_json(id: 3, price: 2100)),
        ItemModel.fromJson(_json(id: 4, cityId: 11, price: 2000)),
      ];
      final ranked = rankRelatedItems(relatedQueryFor(current), candidates);
      expect(ranked.map((item) => item.id), [3, 4, 2]);
    });

    test('respeita o limite', () {
      final candidates = [for (var id = 2; id < 30; id++) ItemModel.fromJson(_json(id: id))];
      expect(rankRelatedItems(relatedQueryFor(current), candidates, limit: 10), hasLength(10));
    });
  });

  group('detalhe do anúncio', () {
    testWidgets('imóvel mostra resumo, características e imóveis relacionados', (tester) async {
      final api = await _pump(tester, _json(id: 1), [
        _json(id: 1),
        _json(id: 2, title: 'Casa com quintal', category: 'casa-aluguel', price: 2500),
        _json(id: 3, title: 'Studio mobiliado', price: 1800),
      ]);

      // Busca pelo tipo inteiro, não só pela subcategoria.
      expect(api.queryFor('/items'), {'listing_type': 'property'});

      expect(find.text('Locação'), findsWidgets);
      expect(find.text('Quartos'), findsWidgets);
      expect(find.text('68 m²'), findsWidgets);
      expect(find.text('Mensagem'), findsOneWidget);

      await tester.scrollUntilVisible(find.text('Imóveis relacionados'), 300, scrollable: find.byType(Scrollable).first);
      await tester.pumpAndSettle();
      expect(find.text('Studio mobiliado'), findsOneWidget);
      expect(find.text('Casa com quintal'), findsOneWidget);
      expect(tester.takeException(), isNull);
    });

    testWidgets('anúncio comum busca pela categoria e avisa quando não há parecidos', (tester) async {
      final api = await _pump(
        tester,
        _json(id: 7, title: 'Notebook', category: 'computadores', listingType: 'item', attrs: '{}'),
        [_json(id: 7, title: 'Notebook', category: 'computadores', listingType: 'item', attrs: '{}')],
      );
      expect(api.queryFor('/items'), {'category': 'computadores'});

      await tester.scrollUntilVisible(find.text('Anúncios relacionados'), 300, scrollable: find.byType(Scrollable).first);
      await tester.pumpAndSettle();
      expect(find.text('Nenhum anúncio parecido no momento.'), findsOneWidget);
      expect(tester.takeException(), isNull);
    });
  });
}
