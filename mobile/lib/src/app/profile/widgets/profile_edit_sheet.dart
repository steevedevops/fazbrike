import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:fazbrike/src/app/catalog/controllers/catalog_controller.dart';
import 'package:fazbrike/src/app/profile/controllers/profile_controller.dart';
import 'package:fazbrike/src/app/profile/models/profile_models.dart';
import 'package:fazbrike/src/theme/app_spacing.dart';

class ProfileEditSheet extends ConsumerStatefulWidget {
  const ProfileEditSheet({super.key, required this.profile});
  final MyProfileModel profile;
  @override
  ConsumerState<ProfileEditSheet> createState() => _ProfileEditSheetState();
}

class _ProfileEditSheetState extends ConsumerState<ProfileEditSheet> {
  late final TextEditingController name;
  late final TextEditingController bio;
  late final TextEditingController phone;
  late final TextEditingController website;
  int? stateId;
  int? cityId;
  bool isPublic = true;
  String error = '';
  @override
  void initState() {
    super.initState();
    name = TextEditingController(text: widget.profile.user.name);
    bio = TextEditingController(text: widget.profile.profile.bio);
    phone = TextEditingController(text: widget.profile.profile.phone);
    website = TextEditingController(text: widget.profile.profile.website);
    stateId = widget.profile.profile.stateId;
    cityId = widget.profile.profile.cityId;
    isPublic = widget.profile.profile.isPublic;
    Future.microtask(() { ref.read(statesProvider.notifier).list(); if (stateId != null) ref.read(citiesProvider.notifier).list(stateId!); });
  }
  @override
  void dispose() { name.dispose(); bio.dispose(); phone.dispose(); website.dispose(); super.dispose(); }
  Future<void> _save() async {
    if (name.text.trim().isEmpty) { setState(() => error = 'Nome é obrigatório.'); return; }
    try {
      await ref.read(profileFormProvider.notifier).update({'name': name.text.trim(), 'bio': bio.text.trim(), 'phone': phone.text.trim(), 'website': website.text.trim(), 'state_id': stateId, 'city_id': cityId, 'is_public': isPublic});
      if (mounted) Navigator.pop(context);
    } catch (exception) { if (mounted) setState(() => error = exception.toString()); }
  }
  @override
  Widget build(BuildContext context) {
    final states = ref.watch(statesProvider).value?.results ?? [];
    final cities = ref.watch(citiesProvider).value?.results ?? [];
    final busy = ref.watch(profileFormProvider).isLoading;
    return Scaffold(
      appBar: AppBar(title: const Text('Editar perfil')),
      body: ListView(padding: const EdgeInsets.all(AppSpacing.lg), children: [
        if (error.isNotEmpty) Text(error, style: TextStyle(color: Theme.of(context).colorScheme.error)),
        TextField(controller: name, decoration: const InputDecoration(labelText: 'Nome')),
        const SizedBox(height: 12),
        TextField(controller: bio, maxLines: 3, decoration: const InputDecoration(labelText: 'Bio')),
        const SizedBox(height: 12),
        TextField(controller: phone, keyboardType: TextInputType.phone, decoration: const InputDecoration(labelText: 'Telefone')),
        const SizedBox(height: 12),
        TextField(controller: website, keyboardType: TextInputType.url, decoration: const InputDecoration(labelText: 'Site')),
        const SizedBox(height: 12),
        DropdownButtonFormField<int>(initialValue: stateId, isExpanded: true, decoration: const InputDecoration(labelText: 'Estado'), items: [for (final state in states) DropdownMenuItem(value: state.id, child: Text('${state.name} (${state.code})'))], onChanged: (value) { setState(() { stateId = value; cityId = null; }); if (value != null) ref.read(citiesProvider.notifier).list(value); }),
        const SizedBox(height: 12),
        DropdownButtonFormField<int>(initialValue: cities.any((city) => city.id == cityId) ? cityId : null, isExpanded: true, decoration: const InputDecoration(labelText: 'Cidade'), items: [for (final city in cities) DropdownMenuItem(value: city.id, child: Text(city.name))], onChanged: (value) => setState(() => cityId = value)),
        SwitchListTile(contentPadding: EdgeInsets.zero, title: const Text('Perfil público'), value: isPublic, onChanged: (value) => setState(() => isPublic = value)),
        const SizedBox(height: 16),
        FilledButton(onPressed: busy ? null : _save, child: Text(busy ? 'Salvando...' : 'Salvar')),
      ]),
    );
  }
}
