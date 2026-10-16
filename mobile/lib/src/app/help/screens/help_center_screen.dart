import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:fazbrike/src/app/help/controllers/help_controller.dart';
import 'package:fazbrike/src/app/help/widgets/help_center_content.dart';
import 'package:fazbrike/src/shared/widgets/error_view.dart';
import 'package:fazbrike/src/shared/widgets/loading_view.dart';

class HelpCenterScreen extends ConsumerStatefulWidget {
  const HelpCenterScreen({super.key});
  static const path = '/ajuda';

  @override
  ConsumerState<HelpCenterScreen> createState() => _HelpCenterScreenState();
}

class _HelpCenterScreenState extends ConsumerState<HelpCenterScreen> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() => ref.read(helpArticlesListProvider.notifier).list());
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(title: const Text('Central de ajuda')),
        body: RefreshIndicator(
          onRefresh: () => ref.read(helpArticlesListProvider.notifier).list(),
          child: ref.watch(helpArticlesListProvider).when(
                loading: () => const LoadingView(),
                error: (error, _) => ErrorView(
                  message: error.toString(),
                  onRetry: () => ref.read(helpArticlesListProvider.notifier).list(),
                ),
                data: (page) => HelpCenterContent(articles: page.results),
              ),
        ),
      );
}
