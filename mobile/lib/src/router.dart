import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:fazbrike/services/navigator_service.dart';
import 'package:fazbrike/services/session_signal.dart';
import 'package:fazbrike/src/app/auth/screens/auth_screen.dart';
import 'package:fazbrike/src/app/auth/screens/verify_email_screen.dart';
import 'package:fazbrike/src/app/base/screens/base_dash.dart';
import 'package:fazbrike/src/app/catalog/screens/catalog_screen.dart';
import 'package:fazbrike/src/app/catalog/screens/categories_screen.dart';
import 'package:fazbrike/src/app/catalog/screens/home_screen.dart';
import 'package:fazbrike/src/app/help/screens/help_center_screen.dart';
import 'package:fazbrike/src/app/help/screens/legal_document_screen.dart';
import 'package:fazbrike/src/app/help/screens/my_support_requests_screen.dart';
import 'package:fazbrike/src/app/help/screens/support_request_screen.dart';
import 'package:fazbrike/src/app/items/screens/create_item_screen.dart';
import 'package:fazbrike/src/app/items/screens/edit_item_screen.dart';
import 'package:fazbrike/src/app/items/screens/item_detail_screen.dart';
import 'package:fazbrike/src/app/messages/screens/messages_screen.dart';
import 'package:fazbrike/src/app/notifications/screens/notifications_screen.dart';
import 'package:fazbrike/src/app/messages/screens/thread_screen.dart';
import 'package:fazbrike/src/app/profile/screens/profile_screen.dart';
import 'package:fazbrike/src/app/promotions/models/promotion_model.dart';
import 'package:fazbrike/src/app/promotions/screens/my_promotions_screen.dart';
import 'package:fazbrike/src/app/promotions/screens/promotion_editor_screen.dart';
import 'package:fazbrike/src/app/profile/screens/public_profile_screen.dart';
import 'package:fazbrike/src/app/splash/screens/splash_screen.dart';

final _shellNavigatorKey = GlobalKey<NavigatorState>(debugLabel: 'shell');

bool _protected(String path) => path.startsWith('/vender') ||
    path.startsWith('/editar') ||
    path.startsWith('/mensagens') ||
    path.startsWith('/messages') ||
    path.startsWith('/notificacoes') ||
    path.startsWith('/minhas-promocoes') ||
    path.startsWith(MySupportRequestsScreen.path) ||
    path.startsWith('/perfil');

final appRouter = GoRouter(
  navigatorKey: rootNavigatorKey,
  initialLocation: SplashScreen.path,
  refreshListenable: sessionSignal,
  redirect: (context, state) {
    final status = sessionSignal.value;
    final path = state.uri.path;
    if (status == SessionStatus.checking) return path == SplashScreen.path ? null : SplashScreen.path;
    if (path == SplashScreen.path) return HomeScreen.path;
    if (status == SessionStatus.unauthenticated && _protected(path)) return AuthScreen.path;
    if (status == SessionStatus.authenticated && (path == AuthScreen.path || path == VerifyEmailScreen.path)) return HomeScreen.path;
    return null;
  },
  routes: [
    GoRoute(path: SplashScreen.path, builder: (_, __) => const SplashScreen()),
    GoRoute(path: AuthScreen.path, builder: (_, __) => const AuthScreen()),
    GoRoute(path: VerifyEmailScreen.path, builder: (_, state) => VerifyEmailScreen(email: state.uri.queryParameters['email'] ?? '')),
    GoRoute(path: '/produto/:id', builder: (_, state) => ItemDetailScreen(itemId: int.tryParse(state.pathParameters['id'] ?? '') ?? 0)),
    GoRoute(path: '/editar/:id', builder: (_, state) => EditItemScreen(itemId: int.tryParse(state.pathParameters['id'] ?? '') ?? 0)),
    GoRoute(path: '/usuario/:id', builder: (_, state) => PublicProfileScreen(userId: int.tryParse(state.pathParameters['id'] ?? '') ?? 0)),
    GoRoute(
      path: '/mensagens/conversa',
      builder: (_, state) => ThreadScreen(
        itemId: int.tryParse(state.uri.queryParameters['itemId'] ?? '') ?? 0,
        otherUserId: int.tryParse(state.uri.queryParameters['otherUserId'] ?? '') ?? 0,
        otherUserName: state.uri.queryParameters['otherUserName'] ?? 'Usuário',
        itemTitle: state.uri.queryParameters['itemTitle'] ?? 'Conversa',
      ),
    ),
    GoRoute(path: '/messages', redirect: (_, __) => '/mensagens'),
    GoRoute(path: NotificationsScreen.path, builder: (_, __) => const NotificationsScreen()),
    // Central de ajuda e documentos legais são públicos (inclusive para quem
    // não consegue entrar); só "Meus chamados" exige login.
    GoRoute(path: HelpCenterScreen.path, builder: (_, __) => const HelpCenterScreen()),
    GoRoute(
      path: SupportRequestScreen.path,
      builder: (_, state) => SupportRequestScreen(
        initialTopic: state.uri.queryParameters['assunto'] ?? 'conta',
        itemId: int.tryParse(state.uri.queryParameters['anuncio'] ?? ''),
      ),
    ),
    GoRoute(path: MySupportRequestsScreen.path, builder: (_, __) => const MySupportRequestsScreen()),
    GoRoute(path: LegalDocumentScreen.path, builder: (_, state) => LegalDocumentScreen(slug: state.pathParameters['slug'] ?? '')),
    GoRoute(path: MyPromotionsScreen.path, builder: (_, __) => const MyPromotionsScreen()),
    // A rota estática vem antes da com parâmetro: "nova" não pode cair no :id.
    GoRoute(path: PromotionEditorScreen.newPath, builder: (_, __) => const PromotionEditorScreen()),
    GoRoute(
      path: '${MyPromotionsScreen.path}/:id',
      builder: (_, state) => PromotionEditorScreen(promotion: state.extra as MyPromotionModel?),
    ),
    GoRoute(path: '/buscar', builder: (_, state) => CatalogScreen(search: state.uri.queryParameters['q'] ?? '', title: 'Resultados da busca')),
    GoRoute(path: '/categoria/:slug', builder: (_, state) => CatalogScreen(category: state.pathParameters['slug'] ?? '', title: state.pathParameters['slug'] ?? 'Categoria')),
    GoRoute(path: CategoriesScreen.path, builder: (_, __) => const CategoriesScreen()),
    GoRoute(path: '/novidades', builder: (_, __) => const CatalogScreen(title: 'Novidades')),
    GoRoute(path: '/promocoes', builder: (_, __) => const CatalogScreen(title: 'Promoções', priceAscending: true)),
    GoRoute(path: '/marcas', builder: (_, __) => const CatalogScreen(title: 'Marcas')),
    ShellRoute(
      navigatorKey: _shellNavigatorKey,
      builder: (_, __, child) => BaseDash(child: child),
      routes: [
        GoRoute(path: HomeScreen.path, pageBuilder: (_, state) => _page(state.pageKey, const HomeScreen())),
        GoRoute(
          path: CatalogScreen.path,
          pageBuilder: (_, state) => _page(
            state.pageKey,
            CatalogScreen(
              category: state.uri.queryParameters['category'] ?? '',
              search: state.uri.queryParameters['search'] ?? '',
              title: state.uri.queryParameters['title'] ?? 'Todos os anúncios',
            ),
          ),
        ),
        GoRoute(path: '/geral', pageBuilder: (_, state) => _page(state.pageKey, CatalogScreen(category: state.uri.queryParameters['category'] ?? ''))),
        GoRoute(path: CreateItemScreen.path, pageBuilder: (_, state) => _page(state.pageKey, const CreateItemScreen())),
        GoRoute(path: MessagesScreen.path, pageBuilder: (_, state) => _page(state.pageKey, const MessagesScreen())),
        GoRoute(path: ProfileScreen.path, pageBuilder: (_, state) => _page(state.pageKey, const ProfileScreen())),
      ],
    ),
  ],
);

CustomTransitionPage<void> _page(LocalKey key, Widget child) => CustomTransitionPage<void>(
      key: key,
      child: child,
      transitionsBuilder: (_, animation, __, child) => FadeTransition(opacity: animation, child: child),
    );
