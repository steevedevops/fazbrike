import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:fazbrike/src/app/messages/controllers/messages_controller.dart';
import 'package:fazbrike/src/app/messages/widgets/conversation_list.dart';

class MessagesScreen extends ConsumerStatefulWidget {
  const MessagesScreen({super.key});
  static const path = '/mensagens';
  @override
  ConsumerState<MessagesScreen> createState() => _MessagesScreenState();
}

class _MessagesScreenState extends ConsumerState<MessagesScreen> {
  Timer? timer;
  @override
  void initState() {
    super.initState();
    Future.microtask(() => ref.read(conversationsListProvider.notifier).list());
    timer = Timer.periodic(const Duration(seconds: 15), (_) => ref.read(conversationsListProvider.notifier).list(silent: true));
  }
  @override
  void dispose() { timer?.cancel(); super.dispose(); }
  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(title: const Text('Mensagens')),
        body: const ConversationList(),
      );
}
