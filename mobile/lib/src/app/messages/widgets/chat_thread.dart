import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:fazbrike/services/api_services.dart';
import 'package:fazbrike/src/app/auth/controllers/auth_controller.dart';
import 'package:fazbrike/src/app/messages/controllers/messages_controller.dart';
import 'package:fazbrike/src/shared/utils/app_utils.dart';
import 'package:fazbrike/src/shared/utils/image_url.dart';
import 'package:fazbrike/src/shared/widgets/error_view.dart';
import 'package:fazbrike/src/shared/widgets/loading_view.dart';
import 'package:fazbrike/src/shared/widgets/remote_image.dart';
import 'package:fazbrike/src/theme/app_colors.dart';
import 'package:fazbrike/src/theme/app_spacing.dart';

class ChatThread extends ConsumerStatefulWidget {
  const ChatThread({super.key, required this.itemId, required this.otherUserId});
  final int itemId;
  final int otherUserId;
  @override
  ConsumerState<ChatThread> createState() => _ChatThreadState();
}

class _ChatThreadState extends ConsumerState<ChatThread> {
  final message = TextEditingController();
  PlatformFile? file;
  String error = '';
  @override
  void dispose() { message.dispose(); super.dispose(); }

  Future<void> _pick() async {
    final result = await FilePicker.platform.pickFiles(type: FileType.custom, allowedExtensions: const ['jpg', 'jpeg', 'png', 'webp', 'gif', 'pdf']);
    final selected = result?.files.single;
    if (selected == null) return;
    if (selected.size > 5 * 1024 * 1024) { setState(() => error = 'Arquivo muito grande (máx. 5MB).'); return; }
    if (selected.path == null) { setState(() => error = 'Não foi possível ler o arquivo.'); return; }
    setState(() { file = selected; error = ''; });
  }

  Future<void> _send() async {
    if (message.text.trim().isEmpty && file == null) return;
    try {
      await ref.read(messageFormProvider.notifier).send(
        itemId: widget.itemId,
        receiverId: widget.otherUserId,
        content: message.text,
        attachment: file == null ? null : UploadFile(path: file!.path!, name: file!.name),
      );
      message.clear();
      setState(() { file = null; error = ''; });
    } catch (exception) { if (mounted) setState(() => error = exception.toString()); }
  }

  @override
  Widget build(BuildContext context) {
    final currentUser = ref.watch(authSessionProvider).value;
    final state = ref.watch(threadProvider((widget.itemId, widget.otherUserId)));
    final sending = ref.watch(messageFormProvider).isLoading;
    return Column(children: [
      Expanded(
        child: state.when(
          loading: () => const LoadingView(),
          error: (exception, _) => ErrorView(message: exception.toString(), onRetry: () => ref.read(threadProvider((widget.itemId, widget.otherUserId)).notifier).list(markRead: true)),
          data: (page) => page.results.isEmpty
              ? const Center(child: Text('Nenhuma mensagem ainda. Comece a conversa.'))
              : ListView.builder(
                  reverse: true,
                  padding: const EdgeInsets.all(AppSpacing.md),
                  itemCount: page.results.length,
                  itemBuilder: (_, index) {
                    final value = page.results[page.results.length - 1 - index];
                    final mine = value.senderId == currentUser?.id;
                    return Align(
                      alignment: mine ? Alignment.centerRight : Alignment.centerLeft,
                      child: Container(
                        constraints: BoxConstraints(maxWidth: MediaQuery.sizeOf(context).width * .78),
                        margin: const EdgeInsets.only(bottom: 8),
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(color: mine ? AppColors.ink : AppColors.surface, borderRadius: BorderRadius.circular(12), border: mine ? null : Border.all(color: AppColors.border)),
                        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          if (value.attachmentUrl.isNotEmpty)
                            value.attachmentKind == 'image'
                                ? GestureDetector(onTap: () => _open(value.attachmentUrl), child: ClipRRect(borderRadius: BorderRadius.circular(8), child: RemoteImage(url: value.attachmentUrl, fallbackAsset: 'lib/assets/images/categories/outros.jpg', height: 190)))
                                : TextButton.icon(onPressed: () => _open(value.attachmentUrl), icon: const Icon(Icons.attach_file), label: Text(value.attachmentName.isEmpty ? 'Arquivo' : value.attachmentName)),
                          if (value.content.isNotEmpty) Text(value.content, style: TextStyle(color: mine ? Colors.white : AppColors.ink)),
                          Text(DateFormat.Hm('pt_BR').format(value.createdAt.toLocal()), style: TextStyle(fontSize: 11, color: mine ? Colors.white70 : AppColors.muted)),
                        ]),
                      ),
                    );
                  },
                ),
        ),
      ),
      Material(
        color: AppColors.surface,
        child: Padding(
          padding: EdgeInsets.fromLTRB(8, 8, 8, 8 + MediaQuery.paddingOf(context).bottom),
          child: Column(children: [
            if (error.isNotEmpty) Align(alignment: Alignment.centerLeft, child: Text(error, style: TextStyle(color: Theme.of(context).colorScheme.error))),
            if (file != null) ListTile(dense: true, leading: const Icon(Icons.attach_file), title: Text(file!.name), trailing: IconButton(onPressed: () => setState(() => file = null), icon: const Icon(Icons.close))),
            Row(children: [
              IconButton(onPressed: sending ? null : _pick, tooltip: 'Anexar foto ou PDF', icon: const Icon(Icons.attach_file)),
              Expanded(child: TextField(controller: message, minLines: 1, maxLines: 4, decoration: const InputDecoration(hintText: 'Escreva algo...'))),
              IconButton.filled(onPressed: sending ? null : _send, tooltip: 'Enviar', icon: const Icon(Icons.send)),
            ]),
          ]),
        ),
      ),
    ]);
  }

  Future<void> _open(String raw) async {
    final url = resolveImageUrl(raw);
    if (url != null) await launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication);
  }
}
