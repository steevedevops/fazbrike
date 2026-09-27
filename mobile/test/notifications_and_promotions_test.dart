import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:fazbrike/services/api_services.dart';
import 'package:fazbrike/services/models/api_response_model.dart';
import 'package:fazbrike/services/session_signal.dart';
import 'package:fazbrike/src/app/notifications/models/notification_model.dart';
import 'package:fazbrike/src/app/notifications/widgets/notification_bell.dart';
import 'package:fazbrike/src/app/promotions/controllers/promotion_controller.dart';
import 'package:fazbrike/src/app/promotions/widgets/promotion_slider.dart';
import 'package:fazbrike/src/theme/app_theme.dart';

/// API falsa: responde as rotas usadas pelo sino e pelo slider.
class _FakeApi implements ApiServices {
  _FakeApi({this.promotions = const [], this.unread = 0});

  final List<Map<String, dynamic>> promotions;
  final int unread;

  @override
  Future<ApiResponseModel<dynamic>> get(String route, {Map<String, dynamic>? query}) async {
    if (route == '/promotions') {
      return ApiResponseModel<dynamic>(data: promotions, statusCode: 200);
    }
    if (route == '/notifications/unread-count') {
      return ApiResponseModel<dynamic>(data: {'unread': unread}, statusCode: 200);
    }
    return const ApiResponseModel<dynamic>(data: <dynamic>[], statusCode: 200);
  }

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

/// Carrega as promoções antes de renderizar o slider, como a home faz.
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

Future<void> _pumpSlider(WidgetTester tester, _FakeApi api) async {
  await tester.pumpWidget(
    ProviderScope(
      overrides: [apiServicesProvider.overrideWithValue(api)],
      child: MaterialApp(theme: AppTheme.lightTheme, home: const _SliderHarness()),
    ),
  );
  await tester.pumpAndSettle();
}

void main() {
  group('slider de promoções', () {
    testWidgets('some da home quando não há campanha ativa', (tester) async {
      await _pumpSlider(tester, _FakeApi());

      expect(find.byType(PageView), findsNothing);
    });

    testWidgets('mostra título, subtítulo e botão da campanha', (tester) async {
      await _pumpSlider(
        tester,
        _FakeApi(promotions: [
          {
            'id': 1,
            'title': 'Semana de ofertas',
            'subtitle': 'Descontos em eletrônicos',
            'image_url': '/api/uploads/banner.jpg',
            'link_url': '/categoria/eletronicos',
            'cta_label': 'Ver ofertas',
          },
        ]),
      );

      expect(find.byType(PageView), findsOneWidget);
      expect(find.text('Semana de ofertas'), findsOneWidget);
      expect(find.text('Descontos em eletrônicos'), findsOneWidget);
      expect(find.text('Ver ofertas'), findsOneWidget);
    });
  });

  group('sino de notificações', () {
    setUp(() => sessionSignal.value = SessionStatus.authenticated);
    tearDown(() => sessionSignal.value = SessionStatus.unauthenticated);

    testWidgets('mostra o total de não lidas no badge', (tester) async {
      await tester.pumpWidget(
        ProviderScope(
          overrides: [apiServicesProvider.overrideWithValue(_FakeApi(unread: 3))],
          child: MaterialApp(
            theme: AppTheme.lightTheme,
            home: Scaffold(appBar: AppBar(actions: const [NotificationBell()])),
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('3'), findsOneWidget);
      expect(find.byIcon(Icons.notifications), findsOneWidget);
    });

    testWidgets('sem não lidas fica sem badge', (tester) async {
      await tester.pumpWidget(
        ProviderScope(
          overrides: [apiServicesProvider.overrideWithValue(_FakeApi())],
          child: MaterialApp(
            theme: AppTheme.lightTheme,
            home: Scaffold(appBar: AppBar(actions: const [NotificationBell()])),
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.byIcon(Icons.notifications_none), findsOneWidget);
      expect(find.text('0'), findsNothing);
    });
  });

  group('model de notificação', () {
    test('desserializa snake_case e o autor da ação', () {
      final notification = NotificationModel.fromJson({
        'id': 7,
        'type': 'comment',
        'title': 'Ana comentou no seu anúncio',
        'body': 'Ainda está disponível?',
        'link': '/produto/12',
        'item_id': 12,
        'is_read': false,
        'created_at': '2026-01-10T10:00:00Z',
        'actor': {'id': 3, 'name': 'Ana', 'avatar_url': '/uploads/ana.jpg'},
      });

      expect(notification.id, 7);
      expect(notification.itemId, 12);
      expect(notification.isRead, isFalse);
      expect(notification.actor?.name, 'Ana');
      expect(notification.copyWith(isRead: true).isRead, isTrue);
    });
  });
}
