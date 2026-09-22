import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:fazbrike/src/shared/utils/app_utils.dart';
import 'package:fazbrike/src/shared/widgets/category_card.dart';
import 'package:fazbrike/src/shared/widgets/category_icon.dart';
import 'package:fazbrike/src/theme/app_theme.dart';

/// Reproduz a célula do grid da home: 2 colunas com 16 de margem lateral,
/// 8 de gutter e a altura fixa usada em `home_content.dart`.
Widget _cell({required Widget child, double width = 164, double height = 68}) => MaterialApp(
      theme: AppTheme.lightTheme,
      home: Scaffold(
        body: Center(
          child: SizedBox(width: width, height: height, child: child),
        ),
      ),
    );

void main() {
  group('categoryIconSlug', () {
    test('subcategoria herda a família do pai, como no site', () {
      expect(categoryIconSlug('carros'), 'veiculos');
      expect(categoryIconSlug('motos'), 'veiculos');
      expect(categoryIconSlug('celulares'), 'eletronicos');
      expect(categoryIconSlug('eletrodomesticos'), 'eletronicos');
      expect(categoryIconSlug('casa-aluguel'), 'imoveis');
      expect(categoryIconSlug('calcados'), 'roupas');
    });

    test('slug desconhecido cai em outros', () {
      expect(categoryIconSlug('slug-que-nao-existe'), 'outros');
      expect(categoryIconSlug(''), 'outros');
    });

    test('todas as famílias têm ícone e imagem', () {
      for (final family in ['eletronicos', 'moveis', 'roupas', 'veiculos', 'imoveis', 'esportes', 'outros']) {
        expect(categoryIconData(family), isNotNull);
        expect(categoryAsset(family), 'lib/assets/images/categories/$family.jpg');
      }
    });
  });

  group('CategoryCard', () {
    testWidgets('mostra nome e ícone da categoria', (tester) async {
      await tester.pumpWidget(_cell(
        child: CategoryCard(slug: 'veiculos', name: 'Veículos', onTap: () {}),
      ));

      expect(find.text('Veículos'), findsOneWidget);
      expect(find.byIcon(Icons.directions_car_outlined), findsOneWidget);
    });

    testWidgets('usa iconSlug quando a API manda icon diferente do slug', (tester) async {
      await tester.pumpWidget(_cell(
        child: CategoryCard(
          slug: 'locacao-imoveis',
          iconSlug: 'imoveis',
          name: 'Locação de imóveis',
          onTap: () {},
        ),
      ));

      expect(find.byIcon(Icons.home_outlined), findsOneWidget);
    });

    testWidgets('nome longo de duas linhas não estoura a altura do grid', (tester) async {
      await tester.pumpWidget(_cell(
        child: CategoryCard(
          slug: 'locacao-imoveis',
          name: 'Locação de imóveis residenciais e comerciais',
          onTap: () {},
        ),
      ));

      // Um overflow de layout vira exceção no teste.
      expect(tester.takeException(), isNull);
    });

    testWidgets('em tela estreita continua sem estourar', (tester) async {
      await tester.pumpWidget(_cell(
        child: CategoryCard(
          slug: 'eletronicos',
          name: 'Eletrodomésticos e eletroportáteis',
          onTap: () {},
        ),
        width: 140,
      ));

      expect(tester.takeException(), isNull);
    });

    testWidgets('dispara onTap', (tester) async {
      var taps = 0;
      await tester.pumpWidget(_cell(
        child: CategoryCard(slug: 'roupas', name: 'Roupas', onTap: () => taps++),
      ));

      await tester.tap(find.byType(CategoryCard));
      expect(taps, 1);
    });
  });
}
