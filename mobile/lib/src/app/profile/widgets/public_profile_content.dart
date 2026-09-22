import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:fazbrike/src/app/auth/controllers/auth_controller.dart';
import 'package:fazbrike/src/app/profile/controllers/profile_controller.dart';
import 'package:fazbrike/src/app/profile/models/profile_models.dart';
import 'package:fazbrike/src/app/profile/widgets/public_profile_tab_content.dart';
import 'package:fazbrike/src/shared/widgets/error_view.dart';
import 'package:fazbrike/src/shared/widgets/loading_view.dart';
import 'package:fazbrike/src/shared/widgets/remote_image.dart';
import 'package:fazbrike/src/theme/app_spacing.dart';

enum PublicProfileTab { forSale, sold, favorites, followers, following, reviews }

class PublicProfileContent extends ConsumerStatefulWidget {
  const PublicProfileContent({super.key, required this.userId});
  final int userId;
  @override
  ConsumerState<PublicProfileContent> createState() => _PublicProfileContentState();
}

class _PublicProfileContentState extends ConsumerState<PublicProfileContent> {
  PublicProfileTab tab = PublicProfileTab.forSale;
  String query = '';
  @override
  Widget build(BuildContext context) => ref.watch(publicProfileProvider(widget.userId)).when(
        loading: () => const LoadingView(),
        error: (error, _) => ErrorView(message: error.toString(), onRetry: () => ref.read(publicProfileProvider(widget.userId).notifier).load()),
        data: (profile) {
          final user = ref.watch(authSessionProvider).value;
          final owner = user?.id == profile.id;
          return CustomScrollView(slivers: [
            SliverAppBar(
              pinned: true,
              expandedHeight: 190,
              title: Text(profile.name),
              flexibleSpace: FlexibleSpaceBar(background: profile.bannerUrl.isEmpty
                  ? const ColoredBox(color: Color(0xFFE4E4E4))
                  : RemoteImage(url: profile.bannerUrl, fallbackAsset: 'lib/assets/images/categories/outros.jpg')),
            ),
            SliverPadding(
              padding: const EdgeInsets.all(AppSpacing.lg),
              sliver: SliverList.list(children: [
                Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  CircleAvatar(
                    radius: 42,
                    child: profile.avatarUrl.isEmpty
                        ? Text(profile.name.characters.first.toUpperCase())
                        : ClipOval(child: RemoteImage(url: profile.avatarUrl, fallbackAsset: 'lib/assets/images/categories/outros.jpg', width: 84, height: 84)),
                  ),
                  const SizedBox(width: 12),
                  Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text(profile.name, style: Theme.of(context).textTheme.titleLarge),
                    Text('${profile.ratingAverage.toStringAsFixed(1)} ★ (${profile.ratingCount})'),
                    Text('${profile.city}${profile.city.isNotEmpty && profile.state.isNotEmpty ? ', ' : ''}${profile.state}', style: Theme.of(context).textTheme.bodySmall),
                  ])),
                ]),
                if (profile.bio.isNotEmpty) ...[const SizedBox(height: 12), Text(profile.bio)],
                const SizedBox(height: 12),
                if (owner)
                  OutlinedButton(onPressed: () => context.push('/perfil'), child: const Text('Editar perfil'))
                else
                  Row(children: [
                    Expanded(child: FilledButton.tonal(onPressed: () => _follow(context, profile), child: Text(profile.isFollowing ? 'Seguindo' : 'Seguir'))),
                    const SizedBox(width: 8),
                    Expanded(child: OutlinedButton(onPressed: () => _chat(context, profile), child: const Text('Conversar'))),
                  ]),
                const Divider(height: 30),
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: SegmentedButton<PublicProfileTab>(
                    showSelectedIcon: false,
                    segments: [
                      ButtonSegment(value: PublicProfileTab.forSale, label: Text('${profile.forSaleCount} à venda')),
                      ButtonSegment(value: PublicProfileTab.sold, label: Text('${profile.soldCount} vendidos')),
                      ButtonSegment(value: PublicProfileTab.favorites, label: Text('${profile.favoritesCount} favoritos')),
                      ButtonSegment(value: PublicProfileTab.followers, label: Text('${profile.followersCount} seguidores')),
                      ButtonSegment(value: PublicProfileTab.following, label: Text('${profile.followingCount} seguindo')),
                      ButtonSegment(value: PublicProfileTab.reviews, label: Text('Avaliações (${profile.ratingCount})')),
                    ],
                    selected: {tab},
                    onSelectionChanged: (value) => setState(() => tab = value.first),
                  ),
                ),
                if (tab == PublicProfileTab.forSale) ...[
                  const SizedBox(height: 12),
                  TextField(
                    textInputAction: TextInputAction.search,
                    onSubmitted: (value) => setState(() => query = value.trim()),
                    decoration: const InputDecoration(
                      hintText: 'Buscar nessa loja',
                      prefixIcon: Icon(Icons.search),
                    ),
                  ),
                ],
                const SizedBox(height: 16),
                SizedBox(height: 620, child: PublicProfileTabContent(userId: widget.userId, tab: tab, query: query, owner: owner)),
              ]),
            ),
          ]);
        },
      );

  Future<void> _follow(BuildContext context, PublicProfileModel profile) async {
    if (ref.read(authSessionProvider).value == null) { context.go('/login'); return; }
    try { await ref.read(socialFormProvider.notifier).setFollowing(profile.id, !profile.isFollowing); }
    catch (error) { if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(error.toString()))); }
  }

  void _chat(BuildContext context, PublicProfileModel profile) {
    if (ref.read(authSessionProvider).value == null) { context.go('/login'); return; }
    context.push('/mensagens/conversa?itemId=0&otherUserId=${profile.id}&otherUserName=${Uri.encodeQueryComponent(profile.name)}&itemTitle=${Uri.encodeQueryComponent('Conversa com ${profile.name}')}');
  }
}
