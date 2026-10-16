import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:fazbrike/src/app/help/controllers/help_controller.dart';
import 'package:fazbrike/src/app/help/widgets/support_request_list.dart';
import 'package:fazbrike/src/shared/widgets/error_view.dart';
import 'package:fazbrike/src/shared/widgets/loading_view.dart';

class MySupportRequestsScreen extends ConsumerStatefulWidget {
  const MySupportRequestsScreen({super.key});
  static const path = '/ajuda/chamados';

  @override
  ConsumerState<MySupportRequestsScreen> createState() => _MySupportRequestsScreenState();
}

class _MySupportRequestsScreenState extends ConsumerState<MySupportRequestsScreen> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() => ref.read(supportRequestsListProvider.notifier).list());
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(
          title: const Text('Meus chamados'),
          actions: [
            IconButton(
              tooltip: 'Novo chamado',
              onPressed: () => context.push('/ajuda/contato'),
              icon: const Icon(Icons.add_comment_outlined),
            ),
          ],
        ),
        body: RefreshIndicator(
          onRefresh: () => ref.read(supportRequestsListProvider.notifier).list(),
          child: ref.watch(supportRequestsListProvider).when(
                loading: () => const LoadingView(),
                error: (error, _) => ErrorView(
                  message: error.toString(),
                  onRetry: () => ref.read(supportRequestsListProvider.notifier).list(),
                ),
                data: (page) => SupportRequestList(requests: page.results),
              ),
        ),
      );
}
