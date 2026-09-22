import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:fazbrike/services/api_services.dart';
import 'package:fazbrike/services/models/api_response_model.dart';
import 'package:fazbrike/src/app/catalog/screens/catalog_screen.dart';
import 'package:fazbrike/src/theme/app_theme.dart';

/// API falsa: devolve lista vazia e guarda as queries recebidas, para checar
/// o que a tela pediu ao backend a cada busca.
class _FakeApi implements ApiServices {
  final List<Map<String, dynamic>> itemQueries = [];

  @override
  Future<ApiResponseModel<dynamic>> get(String route, {Map<String, dynamic>? query}) async {
    if (route == '/items') itemQueries.add({...?query});
    return const ApiResponseModel<dynamic>(data: <dynamic>[], statusCode: 200);
  }

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

Future<_FakeApi> _pumpCatalog(WidgetTester tester) async {
  final api = _FakeApi();
  await tester.pumpWidget(
    ProviderScope(
      overrides: [apiServicesProvider.overrideWithValue(api)],
      child: MaterialApp(
        theme: AppTheme.lightTheme,
        home: const CatalogScreen(),
      ),
    ),
  );
  await tester.pumpAndSettle();
  return api;
}

void main() {
  group('busca da tela de todos os anúncios', () {
    testWidgets('usa o input padrão do app, não o SearchBar do Material', (tester) async {
      await _pumpCatalog(tester);

      expect(find.byType(SearchBar), findsNothing);
      expect(find.byType(TextField), findsOneWidget);
      expect(find.text('Buscar anúncios'), findsOneWidget); // hint
      expect(find.byIcon(Icons.search), findsOneWidget);
    });

    testWidgets('o botão de limpar aparece assim que se digita', (tester) async {
      await _pumpCatalog(tester);

      // Estado inicial: campo vazio, sem botão de limpar.
      expect(find.byIcon(Icons.close), findsNothing);

      await tester.enterText(find.byType(TextField), 'sofá');
      await tester.pump();

      // Era o bug: o X só aparecia depois de submeter, porque nada
      // reconstruía a tela enquanto se digitava.
      expect(find.byIcon(Icons.close), findsOneWidget);
    });

    testWidgets('submeter manda o termo na query', (tester) async {
      final api = await _pumpCatalog(tester);
      api.itemQueries.clear();

      await tester.enterText(find.byType(TextField), '  bicicleta  ');
      await tester.testTextInput.receiveAction(TextInputAction.search);
      await tester.pumpAndSettle();

      expect(api.itemQueries.last['search'], 'bicicleta');
    });

    testWidgets('limpar remove o filtro e recarrega a lista', (tester) async {
      final api = await _pumpCatalog(tester);

      await tester.enterText(find.byType(TextField), 'geladeira');
      await tester.testTextInput.receiveAction(TextInputAction.search);
      await tester.pumpAndSettle();
      expect(api.itemQueries.last.containsKey('search'), isTrue);

      await tester.tap(find.byIcon(Icons.close));
      await tester.pumpAndSettle();

      expect(api.itemQueries.last.containsKey('search'), isFalse);
      expect(find.byIcon(Icons.close), findsNothing);
      expect(tester.widget<TextField>(find.byType(TextField)).controller?.text, '');
    });

    testWidgets('submeter em branco não deixa filtro vazio pendurado', (tester) async {
      final api = await _pumpCatalog(tester);

      await tester.enterText(find.byType(TextField), '   ');
      await tester.testTextInput.receiveAction(TextInputAction.search);
      await tester.pumpAndSettle();

      expect(api.itemQueries.last.containsKey('search'), isFalse);
    });

    testWidgets('abre já filtrado quando vem de uma categoria', (tester) async {
      final api = _FakeApi();
      await tester.pumpWidget(
        ProviderScope(
          overrides: [apiServicesProvider.overrideWithValue(api)],
          child: MaterialApp(
            theme: AppTheme.lightTheme,
            home: const CatalogScreen(category: 'veiculos', title: 'Veículos'),
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(api.itemQueries.first['category'], 'veiculos');
    });
  });
}
