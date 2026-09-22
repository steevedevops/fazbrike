import 'package:flutter/material.dart';
import 'package:fazbrike/src/app/messages/widgets/chat_thread.dart';

class ThreadScreen extends StatelessWidget {
  const ThreadScreen({super.key, required this.itemId, required this.otherUserId, required this.otherUserName, required this.itemTitle});
  final int itemId;
  final int otherUserId;
  final String otherUserName;
  final String itemTitle;
  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(title: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text(otherUserName), Text(itemTitle, style: Theme.of(context).textTheme.bodySmall)])),
        body: ChatThread(itemId: itemId, otherUserId: otherUserId),
      );
}
