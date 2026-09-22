import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:fazbrike/config.dart';
import 'package:fazbrike/services/navigator_service.dart';
import 'package:fazbrike/src/app/auth/controllers/auth_controller.dart';
import 'package:fazbrike/src/router.dart';
import 'package:fazbrike/src/theme/app_theme.dart';
import 'package:fazbrike/src/theme/theme_provider.dart';

class FazbrikeApp extends ConsumerWidget {
  const FazbrikeApp({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    ref.watch(authSessionProvider);
    NavigatorService.instance.router = appRouter;
    return MaterialApp.router(
      title: appName,
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: ref.watch(flutterThemeModeProvider),
      routerConfig: appRouter,
      locale: const Locale('pt', 'BR'),
      supportedLocales: const [Locale('pt', 'BR')],
      localizationsDelegates: const [
        GlobalMaterialLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
      ],
    );
  }
}
