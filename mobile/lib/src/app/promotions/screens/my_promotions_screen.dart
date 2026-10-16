import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:fazbrike/src/app/promotions/controllers/promotion_controller.dart';
import 'package:fazbrike/src/app/promotions/models/promotion_model.dart';
import 'package:fazbrike/src/app/promotions/screens/promotion_editor_screen.dart';
import 'package:fazbrike/src/app/promotions/widgets/my_promotion_card.dart';
import 'package:fazbrike/src/shared/widgets/empty_view.dart';
import 'package:fazbrike/src/shared/widgets/error_view.dart';
import 'package:fazbrike/src/shared/widgets/loading_view.dart';
import 'package:fazbrike/src/theme/app_spacing.dart';

/// Campanhas do anunciante: o que está no ar, quanto rendeu e o que fazer.
class MyPromotionsScreen extends ConsumerStatefulWidget {
  const MyPromotionsScreen({super.key});
  static const path = '/minhas-promocoes';

  @override
  ConsumerState<MyPromotionsScreen> createState() => _MyPromotionsScreenState();
}

class _MyPromotionsScreenState extends ConsumerState<MyPromotionsScreen> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() => ref.read(myPromotionsProvider.notifier).list());
  }

  Future<void> _openEditor([MyPromotionModel? promotion]) async {
    final saved = await context.push<bool>(
      promotion == null
          ? PromotionEditorScreen.newPath
          : '${MyPromotionsScreen.path}/${promotion.id}',
      extra: promotion,
    );
    if (saved == true) ref.read(myPromotionsProvider.notifier).list();
  }

  Future<void> _delete(MyPromotionModel promotion) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Excluir campanha'),
        content: Text('A campanha "${promotion.title}" sai do ar e o histórico de cliques se perde.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(dialogContext, false), child: const Text('Cancelar')),
          FilledButton(onPressed: () => Navigator.pop(dialogContext, true), child: const Text('Excluir')),
        ],
      ),
    );
    if (confirmed != true) return;
    try {
      await ref.read(promotionFormProvider.notifier).delete(promotion.id);
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(error.toString())));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final promotions = ref.watch(myPromotionsProvider);
    final maxActive = ref.watch(myPromotionsProvider.notifier).maxActive;

    return Scaffold(
      appBar: AppBar(title: const Text('Minhas promoções')),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _openEditor(),
        icon: const Icon(Icons.add),
        label: const Text('Nova campanha'),
      ),
      body: promotions.when(
        loading: () => const LoadingView(),
        error: (error, _) => ErrorView(
          message: error.toString(),
          onRetry: () => ref.read(myPromotionsProvider.notifier).list(),
        ),
        data: (page) => RefreshIndicator(
          onRefresh: () => ref.read(myPromotionsProvider.notifier).list(),
          child: page.results.isEmpty
              ? ListView(
                  children: const [
                    SizedBox(height: 120),
                    EmptyView(
                      title: 'Nenhuma campanha ainda',
                      description:
                          'Crie um banner para aparecer na home e levar quem toca direto para a sua loja.',
                    ),
                  ],
                )
              : ListView.separated(
                  padding: const EdgeInsets.fromLTRB(AppSpacing.lg, AppSpacing.lg, AppSpacing.lg, 96),
                  itemCount: page.results.length + 1,
                  separatorBuilder: (_, __) => const SizedBox(height: AppSpacing.md),
                  itemBuilder: (_, index) {
                    if (index == 0) {
                      return Padding(
                        padding: const EdgeInsets.only(bottom: AppSpacing.xs),
                        child: Text(
                          'Você pode manter até $maxActive campanha(s) no ar ao mesmo tempo.',
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                      );
                    }
                    final promotion = page.results[index - 1];
                    return MyPromotionCard(
                      promotion: promotion,
                      onEdit: () => _openEditor(promotion),
                      onDelete: () => _delete(promotion),
                    );
                  },
                ),
        ),
      ),
    );
  }
}
