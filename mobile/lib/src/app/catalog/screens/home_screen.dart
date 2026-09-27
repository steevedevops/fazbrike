import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:fazbrike/src/app/catalog/controllers/catalog_controller.dart';
import 'package:fazbrike/src/app/catalog/widgets/home_content.dart';
import 'package:fazbrike/src/app/catalog/widgets/home_search_header.dart';
import 'package:fazbrike/src/app/notifications/widgets/notification_bell.dart';
import 'package:fazbrike/src/app/promotions/controllers/promotion_controller.dart';
import 'package:fazbrike/src/shared/widgets/app_logo.dart';
import 'package:fazbrike/src/theme/app_spacing.dart';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});
  static const path = '/';
  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  @override
  void initState() {
    super.initState();
    Future.microtask(_load);
  }

  Future<void> _load() => Future.wait([
        ref.read(categoriesProvider.notifier).list(),
        ref.read(promotionsListProvider.notifier).list(),
        ref.read(homeLatestProvider.notifier).list(),
        ref.read(homeDealsProvider.notifier).list(),
      ]);

  @override
  Widget build(BuildContext context) => Scaffold(
        body: RefreshIndicator(
          onRefresh: _load,
          child: CustomScrollView(
            slivers: [
              SliverAppBar(
                pinned: true,
                titleSpacing: AppSpacing.lg,
                title: const AppLogo(),
                actions: const [NotificationBell(), SizedBox(width: AppSpacing.xs)],
                bottom: const HomeSearchHeader(),
              ),
              const SliverToBoxAdapter(child: HomeContent()),
            ],
          ),
        ),
      );
}
