import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:fazbrike/src/app/auth/controllers/auth_controller.dart';
import 'package:fazbrike/src/app/profile/controllers/profile_controller.dart';
import 'package:fazbrike/src/app/profile/models/profile_models.dart';
import 'package:fazbrike/src/app/profile/widgets/public_profile_content.dart';
import 'package:fazbrike/src/shared/utils/app_utils.dart';
import 'package:fazbrike/src/shared/widgets/empty_view.dart';
import 'package:fazbrike/src/shared/widgets/error_view.dart';
import 'package:fazbrike/src/shared/widgets/loading_view.dart';
import 'package:fazbrike/src/shared/widgets/product_card.dart';
import 'package:fazbrike/src/shared/widgets/remote_image.dart';
import 'package:fazbrike/src/theme/app_spacing.dart';

class PublicProfileTabContent extends ConsumerWidget {
  const PublicProfileTabContent({super.key, required this.userId, required this.tab, required this.query, required this.owner});
  final int userId;
  final PublicProfileTab tab;
  final String query;
  final bool owner;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (tab == PublicProfileTab.forSale || tab == PublicProfileTab.sold) {
      final status = tab == PublicProfileTab.forSale ? 'active' : 'sold';
      return ref.watch(publicItemsProvider((userId, status, tab == PublicProfileTab.forSale ? query : ''))).when(
        loading: () => const LoadingView(),
        error: (error, _) => ErrorView(message: error.toString()),
        data: (page) => page.results.isEmpty
            ? EmptyView(title: tab == PublicProfileTab.sold ? 'Nada vendido ainda' : 'Nenhum anúncio', description: 'Quando houver itens, eles aparecem aqui.')
            : ProductGrid(items: page.results),
      );
    }
    if (tab == PublicProfileTab.favorites) {
      return ref.watch(favoritesProvider(userId)).when(
        loading: () => const LoadingView(),
        error: (error, _) => ErrorView(message: error.toString()),
        data: (page) => page.results.isEmpty ? const EmptyView(title: 'Sem favoritos', description: 'Nenhum item favorito por aqui.') : ProductGrid(items: page.results),
      );
    }
    if (tab == PublicProfileTab.followers || tab == PublicProfileTab.following) {
      final following = tab == PublicProfileTab.following;
      return ref.watch(followersProvider((userId, following))).when(
        loading: () => const LoadingView(),
        error: (error, _) => ErrorView(message: error.toString()),
        data: (page) => page.results.isEmpty
            ? const EmptyView(title: 'Ninguém por aqui', description: 'Ainda não há usuários nesta lista.')
            : ListView.separated(
                itemCount: page.results.length,
                separatorBuilder: (_, __) => const Divider(height: 1),
                itemBuilder: (_, index) {
                  final person = page.results[index];
                  return ListTile(
                    leading: CircleAvatar(child: person.avatarUrl.isEmpty ? Text(person.name.characters.first.toUpperCase()) : ClipOval(child: RemoteImage(url: person.avatarUrl, fallbackAsset: 'lib/assets/images/categories/outros.jpg'))),
                    title: Text(person.name),
                    onTap: () => context.push('/usuario/${person.id}'),
                  );
                },
              ),
      );
    }
    return _ReviewsContent(userId: userId, owner: owner);
  }
}

class _ReviewsContent extends ConsumerWidget {
  const _ReviewsContent({required this.userId, required this.owner});
  final int userId;
  final bool owner;
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final current = ref.watch(authSessionProvider).value;
    return ref.watch(reviewsProvider(userId)).when(
      loading: () => const LoadingView(),
      error: (error, _) => ErrorView(message: error.toString()),
      data: (page) {
        final myReview = current == null ? null : page.results.cast<ReviewModel?>().firstWhere((review) => review?.reviewerId == current.id, orElse: () => null);
        return ListView(
          children: [
            if (!owner)
              Padding(
                padding: const EdgeInsets.only(bottom: AppSpacing.md),
                child: current == null
                    ? OutlinedButton(onPressed: () => context.go('/login'), child: const Text('Entre para avaliar'))
                    : FilledButton.tonal(onPressed: () => _reviewDialog(context, ref, myReview), child: Text(myReview == null ? 'Avaliar este vendedor' : 'Editar minha avaliação')),
              ),
            if (myReview != null)
              Align(alignment: Alignment.centerRight, child: TextButton(onPressed: () => _deleteReview(context, ref, myReview.id), child: const Text('Remover minha avaliação'))),
            if (page.results.isEmpty)
              const EmptyView(title: 'Sem avaliações', description: 'Este vendedor ainda não recebeu avaliações.')
            else
              for (final review in page.results)
                Card(child: ListTile(
                  title: Text('${'★' * review.rating}${'☆' * (5 - review.rating)} · ${review.reviewerName}'),
                  subtitle: Text('${review.comment.isEmpty ? 'Sem comentário' : review.comment}\n${formatDate(review.createdAt)}'),
                  isThreeLine: true,
                  onTap: () => context.push('/usuario/${review.reviewerId}'),
                )),
          ],
        );
      },
    );
  }

  Future<void> _reviewDialog(BuildContext context, WidgetRef ref, ReviewModel? existing) async {
    var rating = existing?.rating ?? 0;
    final comment = TextEditingController(text: existing?.comment ?? '');
    final result = await showDialog<(int, String)?>(
      context: context,
      builder: (dialogContext) => StatefulBuilder(builder: (_, setState) => AlertDialog(
        title: Text(existing == null ? 'Avaliar vendedor' : 'Editar avaliação'),
        content: Column(mainAxisSize: MainAxisSize.min, children: [
          Wrap(children: [for (var value = 1; value <= 5; value++) IconButton(onPressed: () => setState(() => rating = value), icon: Icon(value <= rating ? Icons.star : Icons.star_border))]),
          TextField(controller: comment, maxLength: 1000, maxLines: 4, decoration: const InputDecoration(labelText: 'Comentário (opcional)')),
        ]),
        actions: [TextButton(onPressed: () => Navigator.pop(dialogContext), child: const Text('Cancelar')), FilledButton(onPressed: rating < 1 ? null : () => Navigator.pop(dialogContext, (rating, comment.text)), child: const Text('Salvar'))],
      )),
    );
    comment.dispose();
    if (result == null) return;
    try { await ref.read(socialFormProvider.notifier).saveReview(userId, result.$1, result.$2, reviewId: existing?.id); }
    catch (error) { if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(error.toString()))); }
  }

  Future<void> _deleteReview(BuildContext context, WidgetRef ref, int id) async {
    try { await ref.read(socialFormProvider.notifier).deleteReview(userId, id); }
    catch (error) { if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(error.toString()))); }
  }
}
