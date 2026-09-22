import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:fazbrike/services/api_services.dart';
import 'package:fazbrike/src/app/auth/controllers/auth_controller.dart';
import 'package:fazbrike/src/app/items/controllers/item_controller.dart';
import 'package:fazbrike/src/app/items/models/item_model.dart';
import 'package:fazbrike/src/app/profile/controllers/profile_controller.dart';
import 'package:fazbrike/src/app/profile/widgets/profile_edit_sheet.dart';
import 'package:fazbrike/src/shared/utils/app_utils.dart';
import 'package:fazbrike/src/shared/widgets/empty_view.dart';
import 'package:fazbrike/src/shared/widgets/error_view.dart';
import 'package:fazbrike/src/shared/widgets/loading_view.dart';
import 'package:fazbrike/src/shared/widgets/remote_image.dart';
import 'package:fazbrike/src/theme/app_spacing.dart';

class ProfileContent extends ConsumerWidget {
  const ProfileContent({super.key});

  Future<void> _pick(BuildContext context, WidgetRef ref, bool banner) async {
    final file = await ImagePicker().pickImage(source: ImageSource.gallery, imageQuality: 88);
    if (file == null) return;
    try {
      final upload = UploadFile(path: file.path, name: file.name);
      if (banner) { await ref.read(profileFormProvider.notifier).uploadBanner(upload); }
      else { await ref.read(profileFormProvider.notifier).uploadAvatar(upload); }
    } catch (error) {
      if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(error.toString())));
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profileState = ref.watch(myProfileProvider);
    final itemsState = ref.watch(myItemsListProvider);
    return RefreshIndicator(
      onRefresh: () async => Future.wait([ref.read(myProfileProvider.notifier).load(), ref.read(myItemsListProvider.notifier).list()]),
      child: profileState.when(
        loading: () => const LoadingView(),
        error: (error, _) => ListView(children: [SizedBox(height: 500, child: ErrorView(message: error.toString(), onRetry: () => ref.read(myProfileProvider.notifier).load()))]),
        data: (data) => ListView(
          children: [
            Stack(clipBehavior: Clip.none, children: [
              SizedBox(height: 170, width: double.infinity, child: data.profile.bannerUrl.isEmpty
                  ? const ColoredBox(color: Color(0xFFE4E4E4))
                  : RemoteImage(url: data.profile.bannerUrl, fallbackAsset: 'lib/assets/images/categories/outros.jpg')),
              Positioned(right: 12, bottom: 12, child: IconButton.filledTonal(onPressed: () => _pick(context, ref, true), tooltip: 'Alterar capa', icon: const Icon(Icons.photo_camera_outlined))),
            ]),
            Padding(
              padding: const EdgeInsets.all(AppSpacing.lg),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Stack(children: [
                    CircleAvatar(
                      radius: 42,
                      child: data.profile.avatarUrl.isEmpty
                          ? Text(data.user.name.characters.first.toUpperCase())
                          : ClipOval(child: RemoteImage(url: data.profile.avatarUrl, fallbackAsset: 'lib/assets/images/categories/outros.jpg', width: 84, height: 84)),
                    ),
                    Positioned(right: 0, bottom: 0, child: InkWell(onTap: () => _pick(context, ref, false), child: const CircleAvatar(radius: 14, child: Icon(Icons.edit, size: 15)))),
                  ]),
                  const SizedBox(width: AppSpacing.md),
                  Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text(data.user.name, style: Theme.of(context).textTheme.titleLarge),
                    Text(data.user.email),
                    Text('${data.listingsCount} anúncio(s) · ${data.profile.isPublic ? 'Perfil público' : 'Perfil privado'}', style: Theme.of(context).textTheme.bodySmall),
                  ])),
                ]),
                if (data.profile.bio.isNotEmpty) ...[const SizedBox(height: AppSpacing.md), Text(data.profile.bio)],
                const SizedBox(height: AppSpacing.md),
                Wrap(spacing: 8, runSpacing: 8, children: [
                  FilledButton.tonal(onPressed: () => showModalBottomSheet(context: context, isScrollControlled: true, useSafeArea: true, builder: (_) => ProfileEditSheet(profile: data)), child: const Text('Editar perfil')),
                  OutlinedButton(onPressed: () => context.push('/usuario/${data.user.id}'), child: const Text('Ver como público')),
                  OutlinedButton(onPressed: () async { await ref.read(authSessionProvider.notifier).logout(); if (context.mounted) context.go('/'); }, child: const Text('Sair')),
                ]),
                const Divider(height: AppSpacing.xxl),
                Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                  Text('Meus anúncios', style: Theme.of(context).textTheme.titleLarge),
                  TextButton(onPressed: () => context.push('/vender'), child: const Text('Novo anúncio')),
                ]),
                itemsState.when(
                  loading: () => const SizedBox(height: 180, child: LoadingView()),
                  error: (error, _) => ErrorView(message: error.toString(), onRetry: () => ref.read(myItemsListProvider.notifier).list()),
                  data: (page) => page.results.isEmpty
                      ? EmptyView(title: 'Você ainda não publicou', description: 'Publique o primeiro item e ele aparece aqui.', action: FilledButton(onPressed: () => context.push('/vender'), child: const Text('Publicar item')))
                      : Column(children: [for (final item in page.results) _OwnedItemTile(item: item)]),
                ),
              ]),
            ),
          ],
        ),
      ),
    );
  }
}

class _OwnedItemTile extends ConsumerWidget {
  const _OwnedItemTile({required this.item});
  final ItemModel item;
  @override
  Widget build(BuildContext context, WidgetRef ref) => Card(
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.sm),
          child: Column(children: [
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: ClipRRect(borderRadius: BorderRadius.circular(8), child: RemoteImage(url: item.imageUrl, fallbackAsset: categoryAsset(item.category), width: 72, height: 72)),
              title: Text(item.title, maxLines: 2, overflow: TextOverflow.ellipsis),
              subtitle: Text('${formatPrice(item.price)} · ${item.status == 'active' ? 'Ativo' : item.status == 'sold' ? 'Vendido' : 'Pausado'}'),
              onTap: () => context.push('/produto/${item.id}'),
            ),
            Wrap(spacing: 6, runSpacing: 6, children: [
              if (item.status == 'active')
                OutlinedButton(onPressed: () => _markSold(context, ref), child: const Text('Marcar vendido')),
              if (item.status != 'sold')
                OutlinedButton(onPressed: () => _status(context, ref, item.status == 'inactive' ? 'active' : 'inactive'), child: Text(item.status == 'inactive' ? 'Reativar' : 'Pausar')),
              OutlinedButton(onPressed: () async {
                try { final created = await ref.read(itemFormProvider.notifier).duplicate(item.id); ref.read(myItemsListProvider.notifier).insert(created); }
                catch (error) { if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(error.toString()))); }
              }, child: const Text('Duplicar')),
              OutlinedButton(onPressed: () async {
                try { final text = await ref.read(itemFormProvider.notifier).boost(item.id); if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(text))); }
                catch (error) { if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(error.toString()))); }
              }, child: const Text('Impulsionar')),
            ]),
          ]),
        ),
      );

  Future<void> _status(BuildContext context, WidgetRef ref, String status) async {
    try { final updated = await ref.read(itemFormProvider.notifier).updateStatus(item.id, status); ref.read(myItemsListProvider.notifier).update(updated); }
    catch (error) { if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(error.toString()))); }
  }

  Future<void> _markSold(BuildContext context, WidgetRef ref) async {
    final result = await showDialog<Map<String, dynamic>>(context: context, builder: (_) => const MarkSoldDialog());
    if (result == null) return;
    final status = result['channel'] == 'not_sold' ? 'inactive' : 'sold';
    try { final updated = await ref.read(itemFormProvider.notifier).updateStatus(item.id, status, survey: result); ref.read(myItemsListProvider.notifier).update(updated); }
    catch (error) { if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(error.toString()))); }
  }
}

class MarkSoldDialog extends StatefulWidget {
  const MarkSoldDialog({super.key});
  @override
  State<MarkSoldDialog> createState() => _MarkSoldDialogState();
}

class _MarkSoldDialogState extends State<MarkSoldDialog> {
  String channel = 'platform';
  final price = TextEditingController();
  final comment = TextEditingController();
  @override
  void dispose() { price.dispose(); comment.dispose(); super.dispose(); }
  @override
  Widget build(BuildContext context) => AlertDialog(
        title: const Text('Encerrar anúncio'),
        content: SingleChildScrollView(child: Column(mainAxisSize: MainAxisSize.min, children: [
          RadioGroup<String>(groupValue: channel, onChanged: (value) => setState(() => channel = value ?? 'platform'), child: const Column(children: [
            RadioListTile(value: 'platform', title: Text('Vendi aqui na plataforma')),
            RadioListTile(value: 'off_platform', title: Text('Vendi fora da plataforma')),
            RadioListTile(value: 'not_sold', title: Text('Não vendi, só desativando')),
          ])),
          if (channel != 'not_sold') TextField(controller: price, keyboardType: const TextInputType.numberWithOptions(decimal: true), decoration: const InputDecoration(labelText: 'Preço final (opcional)')),
          const SizedBox(height: 8),
          TextField(controller: comment, maxLines: 3, decoration: const InputDecoration(labelText: 'Comentário (opcional)')),
        ])),
        actions: [TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancelar')), FilledButton(onPressed: () {
          final parsed = price.text.trim().isEmpty ? null : parsePrice(price.text);
          if (price.text.trim().isNotEmpty && parsed == null) { ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Informe um preço final válido.'))); return; }
          Navigator.pop(context, {'channel': channel, 'final_price': parsed, 'comment': comment.text.trim()});
        }, child: const Text('Confirmar'))],
      );
}
