import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:fazbrike/src/app/items/controllers/item_controller.dart';
import 'package:fazbrike/src/app/items/widgets/item_detail_content.dart';
import 'package:fazbrike/src/shared/widgets/error_view.dart';
import 'package:fazbrike/src/shared/widgets/loading_view.dart';

class ItemDetailScreen extends ConsumerWidget {
  const ItemDetailScreen({super.key, required this.itemId});
  final int itemId;
  @override
  Widget build(BuildContext context, WidgetRef ref) => Scaffold(
        body: ref.watch(itemDetailProvider(itemId)).when(
              loading: () => const LoadingView(),
              error: (error, _) => ErrorView(message: error.toString(), onRetry: () => ref.read(itemDetailProvider(itemId).notifier).load()),
              data: (item) => ItemDetailContent(item: item),
            ),
      );
}
