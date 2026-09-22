import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:fazbrike/src/app/auth/controllers/auth_controller.dart';
import 'package:fazbrike/src/app/items/controllers/item_controller.dart';
import 'package:fazbrike/src/app/items/models/item_model.dart';
import 'package:fazbrike/src/app/items/widgets/item_comments_section.dart';
import 'package:fazbrike/src/app/items/widgets/item_gallery.dart';
import 'package:fazbrike/src/app/messages/controllers/messages_controller.dart';
import 'package:fazbrike/src/shared/utils/app_utils.dart';
import 'package:fazbrike/src/shared/widgets/product_card.dart';
import 'package:fazbrike/src/theme/app_spacing.dart';

class ItemDetailContent extends ConsumerStatefulWidget {
  const ItemDetailContent({super.key, required this.item});
  final ItemModel item;
  @override
  ConsumerState<ItemDetailContent> createState() => _ItemDetailContentState();
}

class _ItemDetailContentState extends ConsumerState<ItemDetailContent> {
  final message = TextEditingController();
  bool viewed = false;
  @override
  void initState() {
    super.initState();
    message.text = 'Olá, gostaria de mais informações sobre este anúncio: ${widget.item.title}.';
    Future.microtask(_registerView);
  }
  Future<void> _registerView() async {
    if (viewed || ref.read(authSessionProvider).value == null) return;
    viewed = true;
    try { await ref.read(itemFormProvider.notifier).registerView(widget.item.id); } catch (_) {}
  }
  @override
  void dispose() { message.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    final item = widget.item;
    final user = ref.watch(authSessionProvider).value;
    final isOwner = user?.id == item.userId;
    final attrs = item.attributes;
    return CustomScrollView(slivers: [
      SliverAppBar(
        pinned: true,
        expandedHeight: MediaQuery.sizeOf(context).width * .75,
        flexibleSpace: FlexibleSpaceBar(background: ItemGallery(item: item)),
        actions: [
          IconButton(
            tooltip: item.isFavorited ? 'Remover dos favoritos' : 'Salvar',
            onPressed: () async {
              if (user == null) { context.go('/login'); return; }
              try { await ref.read(itemFormProvider.notifier).toggleFavorite(item); }
              catch (error) { if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(error.toString()))); }
            },
            icon: Icon(item.isFavorited ? Icons.favorite : Icons.favorite_border),
          ),
          IconButton(
            tooltip: 'Copiar link',
            onPressed: () async {
              await Clipboard.setData(ClipboardData(text: 'fazbrike://produto/${item.id}'));
              if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Link copiado.')));
            },
            icon: const Icon(Icons.share_outlined),
          ),
        ],
      ),
      SliverPadding(
        padding: const EdgeInsets.all(AppSpacing.lg),
        sliver: SliverList.list(children: [
          Text(formatPrice(item.price), style: Theme.of(context).textTheme.headlineMedium),
          Text(item.title, style: Theme.of(context).textTheme.titleLarge),
          if (item.location.isNotEmpty) Text(item.location),
          const SizedBox(height: AppSpacing.sm),
          Text('${item.viewsCount} visualizações · ${item.favoritesCount} salvos · ${item.commentsCount} perguntas', style: Theme.of(context).textTheme.bodySmall),
          const Divider(height: AppSpacing.xxl),
          Wrap(spacing: 8, runSpacing: 8, children: [
            if (item.condition.isNotEmpty) Chip(label: Text(conditionLabel(item.condition))),
            if (item.category.isNotEmpty) Chip(label: Text(categoryLabel(item.category))),
            for (final entry in attrs.entries)
              if (entry.value.toString().isNotEmpty) Chip(label: Text('${_attrLabel(entry.key)}: ${_attrValue(entry.key, entry.value.toString())}')),
          ]),
          const SizedBox(height: AppSpacing.xl),
          Text('Descrição', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: AppSpacing.sm),
          Text(item.description),
          const SizedBox(height: AppSpacing.xl),
          Card(
            child: ListTile(
              leading: CircleAvatar(child: Text((item.user?.name ?? 'V').characters.first.toUpperCase())),
              title: Text(item.user?.name ?? 'Vendedor'),
              subtitle: const Text('Ver perfil e outros anúncios'),
              trailing: const Icon(Icons.chevron_right),
              onTap: () => context.push('/usuario/${item.userId}'),
            ),
          ),
          if (isOwner) ...[
            const SizedBox(height: AppSpacing.lg),
            Row(children: [
              Expanded(child: FilledButton(onPressed: () => context.push('/editar/${item.id}'), child: const Text('Editar anúncio'))),
              const SizedBox(width: AppSpacing.sm),
              Expanded(child: OutlinedButton(onPressed: () => _delete(context, item.id), child: const Text('Excluir anúncio'))),
            ]),
          ] else ...[
            const SizedBox(height: AppSpacing.lg),
            Text('Fale com o anunciante', style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: AppSpacing.sm),
            TextField(controller: message, maxLength: 150, maxLines: 3, decoration: const InputDecoration(hintText: 'Escreva sua mensagem')),
            FilledButton(onPressed: () => _sendMessage(context, item), child: const Text('Enviar mensagem')),
            const SizedBox(height: AppSpacing.sm),
            OutlinedButton(onPressed: () => _openConversation(context, item), child: const Text('Abrir conversa')),
          ],
          const Divider(height: AppSpacing.xxl),
          ItemCommentsSection(item: item),
          const SizedBox(height: AppSpacing.xxl),
          Text('Anúncios que você pode gostar', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: AppSpacing.md),
          SizedBox(
            height: 280,
            child: ref.watch(relatedItemsProvider((item.id, item.category))).maybeWhen(
              data: (page) => ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount: page.results.length,
                separatorBuilder: (_, __) => const SizedBox(width: AppSpacing.sm),
                itemBuilder: (_, index) => SizedBox(width: 190, child: ProductCard(item: page.results[index])),
              ),
              orElse: () => const Center(child: CircularProgressIndicator()),
            ),
          ),
        ]),
      ),
    ]);
  }

  Future<void> _sendMessage(BuildContext context, ItemModel item) async {
    if (ref.read(authSessionProvider).value == null) { context.go('/login'); return; }
    if (message.text.trim().isEmpty) return;
    try {
      await ref.read(messageFormProvider.notifier).send(itemId: item.id, receiverId: item.userId, content: message.text.substring(0, message.text.length > 150 ? 150 : message.text.length));
      if (context.mounted) _openConversation(context, item);
    } catch (error) {
      if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(error.toString())));
    }
  }

  void _openConversation(BuildContext context, ItemModel item) {
    if (ref.read(authSessionProvider).value == null) { context.go('/login'); return; }
    context.push('/mensagens/conversa?itemId=${item.id}&otherUserId=${item.userId}&otherUserName=${Uri.encodeQueryComponent(item.user?.name ?? 'Vendedor')}&itemTitle=${Uri.encodeQueryComponent(item.title)}');
  }

  Future<void> _delete(BuildContext context, int id) async {
    final confirmed = await showDialog<bool>(context: context, builder: (_) => AlertDialog(title: const Text('Excluir anúncio?'), content: const Text('Essa ação não pode ser desfeita.'), actions: [TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancelar')), FilledButton(onPressed: () => Navigator.pop(context, true), child: const Text('Excluir'))])) ?? false;
    if (!confirmed) return;
    try { await ref.read(itemFormProvider.notifier).delete(id); if (context.mounted) context.go('/perfil'); }
    catch (error) { if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(error.toString()))); }
  }

  String _attrLabel(String key) => const {'brand': 'Marca', 'model': 'Modelo', 'year': 'Ano', 'mileage': 'Quilometragem', 'transmission': 'Câmbio', 'property_type': 'Tipo', 'bedrooms': 'Quartos', 'bathrooms': 'Banheiros', 'area_m2': 'Área', 'furnished': 'Mobília', 'pets_allowed': 'Aceita pets', 'listing_mode': 'Finalidade'}[key] ?? key;
  String _attrValue(String key, String value) {
    if (key == 'transmission') return value == 'automatic' ? 'Automático' : value == 'manual' ? 'Manual' : value;
    if (key == 'listing_mode') return value == 'rent' ? 'Locação' : 'Venda';
    if (key == 'mileage') return '$value km';
    if (key == 'area_m2') return '$value m²';
    if ((key == 'furnished' || key == 'pets_allowed') && value == 'yes') return 'Sim';
    if ((key == 'furnished' || key == 'pets_allowed') && value == 'no') return 'Não';
    return value;
  }
}
