import 'package:flutter/material.dart';
import 'package:fazbrike/src/app/items/widgets/item_editor_form.dart';

class CreateItemScreen extends StatelessWidget {
  const CreateItemScreen({super.key});
  static const path = '/vender';
  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(title: const Text('Criar anúncio')),
        body: const SafeArea(child: ItemEditorForm()),
      );
}
