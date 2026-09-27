import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:fazbrike/src/app/auth/widgets/auth_panel.dart';

// Tema padrão de propósito: AppTheme usa google_fonts, que tenta baixar a
// fonte e polui o teste com erro de rede. O que importa aqui é o layout.
Future<void> _pumpAuth(WidgetTester tester) async {
  // Tela de celular: no padrão 800x600 do teste o botão fica fora da área
  // visível e não recebe toque.
  tester.view.physicalSize = const Size(1200, 2600);
  tester.view.devicePixelRatio = 3;
  addTearDown(tester.view.resetPhysicalSize);
  addTearDown(tester.view.resetDevicePixelRatio);
  await tester.pumpWidget(
    const ProviderScope(
      child: MaterialApp(home: Scaffold(body: SafeArea(child: AuthPanel()))),
    ),
  );
  await tester.pumpAndSettle();
}

void main() {
  setUp(() => SharedPreferences.setMockInitialValues({}));

  group('tela de acesso', () {
    testWidgets('entrar mostra rótulo acima do campo, como no site', (tester) async {
      await _pumpAuth(tester);

      expect(find.text('Email'), findsOneWidget);
      expect(find.text('Senha'), findsOneWidget);
      expect(find.text('seu@email.com'), findsOneWidget); // placeholder
      expect(find.text('Acesse sua conta para continuar.'), findsOneWidget);
      expect(find.text('Lembrar de mim'), findsOneWidget);
      expect(find.text('Esqueceu a senha?'), findsOneWidget);
      expect(find.widgetWithText(FilledButton, 'Entrar'), findsOneWidget);
    });

    testWidgets('a aba criar conta troca o formulário', (tester) async {
      await _pumpAuth(tester);

      await tester.tap(find.text('Criar conta').first);
      await tester.pumpAndSettle();

      expect(find.text('Nome completo'), findsOneWidget);
      expect(find.text('Confirmar senha'), findsOneWidget);
      expect(find.text('Junte-se à comunidade Fazbrike.'), findsOneWidget);
      expect(find.widgetWithText(FilledButton, 'Criar conta'), findsOneWidget);
      expect(find.textContaining('termos de uso'), findsOneWidget);
    });

    testWidgets('a força da senha aparece enquanto se digita no cadastro', (tester) async {
      await _pumpAuth(tester);
      await tester.tap(find.text('Criar conta').first);
      await tester.pumpAndSettle();

      expect(find.textContaining('Força da senha'), findsNothing);

      await tester.enterText(find.byType(TextFormField).at(2), 'abc');
      await tester.pumpAndSettle();
      expect(find.text('Força da senha: Fraca'), findsOneWidget);

      await tester.enterText(find.byType(TextFormField).at(2), 'abc123');
      await tester.pumpAndSettle();
      expect(find.text('Força da senha: Média'), findsOneWidget);

      await tester.enterText(find.byType(TextFormField).at(2), 'senha12345');
      await tester.pumpAndSettle();
      expect(find.text('Força da senha: Forte'), findsOneWidget);
    });

    testWidgets('senha curta no cadastro avisa o mínimo da API', (tester) async {
      await _pumpAuth(tester);
      await tester.tap(find.text('Criar conta').first);
      await tester.pumpAndSettle();

      await tester.enterText(find.byType(TextFormField).at(0), 'Maria Silva');
      await tester.enterText(find.byType(TextFormField).at(1), 'maria@exemplo.com');
      await tester.enterText(find.byType(TextFormField).at(2), 'curta1');
      await tester.enterText(find.byType(TextFormField).at(3), 'curta1');
      await tester.tap(find.widgetWithText(FilledButton, 'Criar conta'));
      await tester.pumpAndSettle();

      expect(find.text('A senha deve ter pelo menos 8 caracteres.'), findsOneWidget);
    });
  });
}
