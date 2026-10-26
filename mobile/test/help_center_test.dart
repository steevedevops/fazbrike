import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:fazbrike/services/api_services.dart';
import 'package:fazbrike/services/models/api_exception.dart';
import 'package:fazbrike/services/models/api_response_model.dart';
import 'package:fazbrike/src/app/auth/widgets/auth_panel.dart';
import 'package:fazbrike/src/app/help/models/help_models.dart';
import 'package:fazbrike/src/app/help/screens/help_center_screen.dart';
import 'package:fazbrike/src/app/help/widgets/legal_document_body.dart';
import 'package:fazbrike/src/app/help/widgets/support_request_form.dart';
import 'package:fazbrike/src/app/help/widgets/support_request_tile.dart';
import 'package:fazbrike/src/app/items/widgets/report_item_sheet.dart';

const _articles = [
  {'id': 1, 'category': 'conta', 'title': 'Como crio minha conta?', 'body': 'Toque em Entrar.', 'position': 1},
  {'id': 2, 'category': 'denuncias', 'title': 'Como denuncio um anúncio?', 'body': 'Use o botão Denunciar.', 'position': 1},
  {'id': 3, 'category': 'privacidade', 'title': 'Como peço meus dados?', 'body': 'Abra um chamado.', 'position': 1},
];

/// API falsa: responde a central e guarda os POSTs recebidos.
class _FakeApi implements ApiServices {
  final List<(String, Object?)> posts = [];
  String? postError;

  @override
  Future<ApiResponseModel<dynamic>> get(String route, {Map<String, dynamic>? query}) async {
    if (route == '/help/articles') {
      return const ApiResponseModel<dynamic>(data: {'results': _articles}, statusCode: 200);
    }
    return const ApiResponseModel<dynamic>(data: <String, dynamic>{}, statusCode: 200);
  }

  @override
  Future<ApiResponseModel<dynamic>> post(String route, {Object? data, Map<String, dynamic>? query}) async {
    posts.add((route, data));
    if (postError != null) throw ApiException(postError!, statusCode: 409);
    return const ApiResponseModel<dynamic>(data: {'id': 1, 'message': 'Recebido.'}, statusCode: 201);
  }

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

Future<void> _pump(WidgetTester tester, Widget child, {_FakeApi? api, Size size = const Size(1200, 2600)}) async {
  tester.view.physicalSize = size;
  tester.view.devicePixelRatio = 3;
  addTearDown(tester.view.resetPhysicalSize);
  addTearDown(tester.view.resetDevicePixelRatio);
  await tester.pumpWidget(ProviderScope(
    overrides: [apiServicesProvider.overrideWithValue(api ?? _FakeApi())],
    child: MaterialApp(home: child),
  ));
  await tester.pumpAndSettle();
}

void main() {
  setUpAll(() => initializeDateFormatting('pt_BR'));
  setUp(() {
    SharedPreferences.setMockInitialValues({});
    FlutterSecureStorage.setMockInitialValues({});
  });

  group('documentos legais', () {
    test('markdown simples vira seções, parágrafos e listas', () {
      final blocks = LegalBlock.parse('Intro linha 1\nlinha 2\n\n## 1. Dados\n- nome\n- e-mail\nDepois da lista.');
      expect(blocks.map((b) => b.kind), [
        LegalBlockKind.paragraph,
        LegalBlockKind.heading,
        LegalBlockKind.list,
        LegalBlockKind.paragraph,
      ]);
      expect(blocks[0].text, 'Intro linha 1 linha 2');
      expect(blocks[1].text, '1. Dados');
      expect(blocks[2].items, ['nome', 'e-mail']);
    });

    testWidgets('documento mostra versão, data e conteúdo', (tester) async {
      final document = LegalDocumentModel.fromJson({
        'slug': 'politica-de-privacidade',
        'title': 'Política de Privacidade',
        'summary': 'Resumo',
        'version': '1.2',
        'updated_at': '2026-09-28T10:00:00Z',
        'content': '## Seus direitos\n- Acesso aos dados',
      });
      await _pump(tester, Scaffold(body: LegalDocumentBody(document: document)));

      expect(find.text('Política de Privacidade'), findsOneWidget);
      expect(find.textContaining('Versão 1.2 · Atualizado em 28/09/2026'), findsOneWidget);
      expect(find.text('Seus direitos'), findsOneWidget);
      expect(find.text('Acesso aos dados'), findsOneWidget);
    });
  });

  group('central de ajuda', () {
    testWidgets('busca ignora acento e o filtro por tema funciona', (tester) async {
      await _pump(tester, const HelpCenterScreen());

      expect(find.text('Como crio minha conta?'), findsOneWidget);
      expect(find.text('Como denuncio um anúncio?'), findsOneWidget);

      await tester.enterText(find.byType(TextField).first, 'anuncio');
      await tester.pumpAndSettle();
      expect(find.text('Como denuncio um anúncio?'), findsOneWidget);
      expect(find.text('Como crio minha conta?'), findsNothing);

      await tester.tap(find.byTooltip('Limpar busca'));
      await tester.pumpAndSettle();
      await tester.ensureVisible(find.widgetWithText(ChoiceChip, 'Privacidade e dados'));
      await tester.tap(find.widgetWithText(ChoiceChip, 'Privacidade e dados'));
      await tester.pumpAndSettle();
      expect(find.text('Como peço meus dados?'), findsOneWidget);
      expect(find.text('Como crio minha conta?'), findsNothing);
    });

    testWidgets('atalhos de contato e políticas aparecem na central', (tester) async {
      await _pump(tester, const HelpCenterScreen());
      await tester.scrollUntilVisible(find.text('Política de cookies'), 300, scrollable: find.byType(Scrollable).first);

      expect(find.text('Fale com a gente'), findsOneWidget);
      expect(find.text('Meus chamados'), findsOneWidget);
      expect(find.text('Termos de uso'), findsOneWidget);
      expect(find.text('Política de privacidade'), findsOneWidget);
      expect(find.text('Regras de publicação'), findsOneWidget);
    });

    testWidgets('não estoura em tela estreita com fonte ampliada', (tester) async {
      tester.platformDispatcher.textScaleFactorTestValue = 1.3;
      addTearDown(tester.platformDispatcher.clearTextScaleFactorTestValue);
      await _pump(tester, const HelpCenterScreen(), size: const Size(960, 1800)); // 320x600 lógicos
      await tester.tap(find.text('Como crio minha conta?'));
      await tester.pumpAndSettle();
      expect(tester.takeException(), isNull);
    });
  });

  group('chamados', () {
    testWidgets('visitante precisa de nome e e-mail válidos', (tester) async {
      final api = _FakeApi();
      await _pump(tester, const Scaffold(body: SingleChildScrollView(child: SupportRequestForm())), api: api);

      await tester.tap(find.widgetWithText(FilledButton, 'Enviar chamado'));
      await tester.pumpAndSettle();
      expect(find.text('Informe seu nome.'), findsOneWidget);
      expect(find.text('Informe um e-mail válido.'), findsOneWidget);
      expect(api.posts, isEmpty);
    });

    testWidgets('envia o chamado com assunto e anúncio relacionado', (tester) async {
      final api = _FakeApi();
      await _pump(
        tester,
        const Scaffold(body: SingleChildScrollView(child: SupportRequestForm(initialTopic: 'anuncio', itemId: 42))),
        api: api,
      );

      final fields = find.byType(TextFormField);
      await tester.enterText(fields.at(0), 'Maria Silva');
      await tester.enterText(fields.at(1), 'maria@exemplo.com');
      await tester.enterText(fields.at(2), 'Anúncio retirado');
      await tester.enterText(fields.at(3), 'Quero contestar a retirada do meu anúncio.');
      await tester.tap(find.widgetWithText(FilledButton, 'Enviar chamado'));
      await tester.pumpAndSettle();

      expect(api.posts.single.$1, '/support/requests');
      expect(api.posts.single.$2, {
        'name': 'Maria Silva',
        'email': 'maria@exemplo.com',
        'topic': 'anuncio',
        'subject': 'Anúncio retirado',
        'message': 'Quero contestar a retirada do meu anúncio.',
        'item_id': 42,
      });
      expect(find.text('Recebido.'), findsOneWidget);
    });

    testWidgets('chamado respondido mostra status e resposta', (tester) async {
      final request = SupportRequestModel.fromJson({
        'id': 9,
        'topic': 'exclusao_conta',
        'subject': 'Excluir conta',
        'message': 'Quero excluir minha conta',
        'status': 'answered',
        'response': 'Conta excluída.',
        'created_at': '2026-09-28T10:00:00Z',
        'responded_at': '2026-09-28T12:00:00Z',
      });
      await _pump(tester, Scaffold(body: SupportRequestTile(request: request)));

      expect(find.text('Respondido'), findsOneWidget);
      expect(find.textContaining('Excluir minha conta'), findsOneWidget);
      expect(find.text('Conta excluída.'), findsOneWidget);
    });
  });

  group('denúncia de anúncio', () {
    testWidgets('outro motivo exige detalhes antes de chamar a API', (tester) async {
      final api = _FakeApi();
      await _pump(tester, const Scaffold(body: ReportItemSheet(itemId: 5)), api: api);

      await tester.tap(find.text('Outro motivo'));
      await tester.pumpAndSettle();
      expect(find.text('Detalhes (obrigatório)'), findsOneWidget);
      await tester.tap(find.widgetWithText(FilledButton, 'Enviar denúncia'));
      await tester.pumpAndSettle();

      expect(find.text('Descreva o problema ao selecionar outro motivo.'), findsOneWidget);
      expect(api.posts, isEmpty);
    });

    testWidgets('envia motivo e detalhes para a rota do anúncio', (tester) async {
      final api = _FakeApi();
      await _pump(tester, const Scaffold(body: ReportItemSheet(itemId: 5)), api: api);

      await tester.tap(find.text('Suspeita de fraude'));
      await tester.enterText(find.byType(TextField), '  pediu pix antecipado  ');
      await tester.tap(find.widgetWithText(FilledButton, 'Enviar denúncia'));
      await tester.pumpAndSettle();

      expect(api.posts.single.$1, '/items/5/reports');
      expect(api.posts.single.$2, {'reason': 'fraud', 'details': 'pediu pix antecipado'});
    });

    testWidgets('erro da API (denúncia repetida) aparece na folha', (tester) async {
      final api = _FakeApi()..postError = 'Você já denunciou este anúncio';
      await _pump(tester, const Scaffold(body: ReportItemSheet(itemId: 5)), api: api);

      await tester.tap(find.widgetWithText(FilledButton, 'Enviar denúncia'));
      await tester.pumpAndSettle();
      expect(find.text('Você já denunciou este anúncio'), findsOneWidget);
    });
  });

  group('aceite dos termos no cadastro', () {
    testWidgets('cadastro sem aceitar os termos não chama a API', (tester) async {
      final api = _FakeApi();
      await _pump(tester, const Scaffold(body: SafeArea(child: AuthPanel())), api: api, size: const Size(1200, 3300));
      await tester.tap(find.text('Criar conta').first);
      await tester.pumpAndSettle();

      await tester.enterText(find.byType(TextFormField).at(0), 'Maria Silva');
      await tester.enterText(find.byType(TextFormField).at(1), 'maria@exemplo.com');
      await tester.tap(find.widgetWithText(FilledButton, 'Continuar'));
      await tester.pumpAndSettle();
      await tester.enterText(find.byType(TextFormField).at(0), 'senha12345');
      await tester.enterText(find.byType(TextFormField).at(1), 'senha12345');
      await tester.tap(find.widgetWithText(FilledButton, 'Continuar'));
      await tester.pumpAndSettle();
      await tester.tap(find.widgetWithText(FilledButton, 'Criar conta'));
      await tester.pumpAndSettle();

      expect(find.text('Aceite os Termos de uso e a Política de privacidade para criar a conta.'), findsOneWidget);
      expect(api.posts, isEmpty);
    });

    testWidgets('com o aceite marcado envia accept_terms', (tester) async {
      final api = _FakeApi();
      await _pump(tester, const Scaffold(body: SafeArea(child: AuthPanel())), api: api, size: const Size(1200, 3300));
      await tester.tap(find.text('Criar conta').first);
      await tester.pumpAndSettle();

      await tester.enterText(find.byType(TextFormField).at(0), 'Maria Silva');
      await tester.enterText(find.byType(TextFormField).at(1), 'maria@exemplo.com');
      await tester.tap(find.widgetWithText(FilledButton, 'Continuar'));
      await tester.pumpAndSettle();
      await tester.enterText(find.byType(TextFormField).at(0), 'senha12345');
      await tester.enterText(find.byType(TextFormField).at(1), 'senha12345');
      await tester.tap(find.widgetWithText(FilledButton, 'Continuar'));
      await tester.pumpAndSettle();
      await tester.tap(find.byType(Checkbox));
      await tester.pump();
      await tester.tap(find.widgetWithText(FilledButton, 'Criar conta'));
      await tester.pump();

      expect(api.posts.single.$1, '/auth/register');
      expect((api.posts.single.$2 as Map)['accept_terms'], isTrue);
    });
  });
}
