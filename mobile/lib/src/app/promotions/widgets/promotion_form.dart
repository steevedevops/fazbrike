import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:fazbrike/services/api_services.dart';
import 'package:fazbrike/src/app/promotions/controllers/promotion_controller.dart';
import 'package:fazbrike/src/app/promotions/models/promotion_model.dart';
import 'package:fazbrike/src/app/promotions/widgets/promotion_target_picker.dart';
import 'package:fazbrike/src/shared/utils/app_utils.dart';
import 'package:fazbrike/src/shared/widgets/remote_image.dart';
import 'package:fazbrike/src/theme/app_radius.dart';
import 'package:fazbrike/src/theme/app_spacing.dart';

/// Formulário de campanha. A arte sobe pelo próprio app (o backend recusa
/// imagem hospedada fora).
class PromotionForm extends ConsumerStatefulWidget {
  const PromotionForm({super.key, this.promotion});

  final MyPromotionModel? promotion;

  @override
  ConsumerState<PromotionForm> createState() => _PromotionFormState();
}

class _PromotionFormState extends ConsumerState<PromotionForm> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _title;
  late final TextEditingController _subtitle;
  late final TextEditingController _cta;

  late PromotionTargetDraft _target;
  String _imageUrl = '';
  DateTime? _startsAt;
  DateTime? _endsAt;
  bool _busy = false;
  String _error = '';

  @override
  void initState() {
    super.initState();
    final promotion = widget.promotion;
    _title = TextEditingController(text: promotion?.title ?? '');
    _subtitle = TextEditingController(text: promotion?.subtitle ?? '');
    _cta = TextEditingController(text: promotion?.ctaLabel ?? '');
    _imageUrl = promotion?.imageUrl ?? '';
    _startsAt = promotion?.startsAt;
    _endsAt = promotion?.endsAt;
    _target = PromotionTargetDraft(
      type: promotion?.targetType ?? PromotionTargetType.profile,
      itemId: promotion?.targetId,
      value: promotion?.targetValue ?? '',
    );
  }

  @override
  void dispose() {
    _title.dispose();
    _subtitle.dispose();
    _cta.dispose();
    super.dispose();
  }

  Future<void> _pickImage() async {
    final file = await ImagePicker().pickImage(source: ImageSource.gallery, imageQuality: 88);
    if (file == null) return;
    setState(() { _busy = true; _error = ''; });
    try {
      final url = await ref.read(promotionFormProvider.notifier)
          .uploadImage(UploadFile(path: file.path, name: file.name));
      if (mounted) setState(() => _imageUrl = url);
    } catch (error) {
      if (mounted) setState(() => _error = error.toString());
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _pickDate({required bool start}) async {
    final now = DateTime.now();
    final initial = (start ? _startsAt : _endsAt) ?? now;
    final picked = await showDatePicker(
      context: context,
      initialDate: initial.isBefore(now) ? now : initial,
      firstDate: now.subtract(const Duration(days: 1)),
      lastDate: now.add(const Duration(days: 365)),
    );
    if (picked == null) return;
    setState(() {
      if (start) {
        _startsAt = picked;
      } else {
        // Fim do dia escolhido: a campanha vale o dia inteiro.
        _endsAt = DateTime(picked.year, picked.month, picked.day, 23, 59);
      }
    });
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_imageUrl.isEmpty) {
      setState(() => _error = 'Escolha a imagem do banner.');
      return;
    }
    final targetError = _target.validationError;
    if (targetError != null) {
      setState(() => _error = targetError);
      return;
    }
    if (_startsAt != null && _endsAt != null && !_endsAt!.isAfter(_startsAt!)) {
      setState(() => _error = 'A data final deve ser maior que a inicial.');
      return;
    }

    setState(() { _busy = true; _error = ''; });
    final body = <String, dynamic>{
      'title': _title.text.trim(),
      'subtitle': _subtitle.text.trim(),
      'cta_label': _cta.text.trim(),
      'image_url': _imageUrl,
      'starts_at': _startsAt?.toUtc().toIso8601String(),
      'ends_at': _endsAt?.toUtc().toIso8601String(),
      ..._target.toJson(),
    };

    try {
      final notifier = ref.read(promotionFormProvider.notifier);
      if (widget.promotion == null) {
        await notifier.create(body);
      } else {
        await notifier.update(widget.promotion!.id, body);
      }
      if (mounted) context.pop(true);
    } catch (error) {
      if (mounted) setState(() => _error = error.toString());
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Form(
      key: _formKey,
      child: ListView(
        padding: const EdgeInsets.all(AppSpacing.lg),
        children: [
          _ImageField(imageUrl: _imageUrl, busy: _busy, onPick: _pickImage),
          const SizedBox(height: AppSpacing.lg),
          if (_error.isNotEmpty) ...[
            Text(_error, style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.error)),
            const SizedBox(height: AppSpacing.md),
          ],
          TextFormField(
            controller: _title,
            decoration: const InputDecoration(labelText: 'Título', hintText: 'Ex.: Semana de ofertas'),
            maxLength: 80,
            validator: (value) => (value?.trim().isEmpty ?? true) ? 'Informe o título do banner.' : null,
          ),
          TextFormField(
            controller: _subtitle,
            decoration: const InputDecoration(labelText: 'Subtítulo (opcional)'),
            maxLength: 160,
          ),
          TextFormField(
            controller: _cta,
            decoration: const InputDecoration(labelText: 'Texto do botão (opcional)', hintText: 'Ver minha loja'),
            maxLength: 24,
          ),
          const SizedBox(height: AppSpacing.md),
          PromotionTargetPicker(
            draft: _target,
            onChanged: (value) => setState(() => _target = value),
          ),
          const SizedBox(height: AppSpacing.xl),
          Text(
            'Período (opcional)',
            style: theme.textTheme.bodySmall?.copyWith(
              fontWeight: FontWeight.w500,
              color: theme.colorScheme.onSurface,
            ),
          ),
          const SizedBox(height: AppSpacing.sm),
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: () => _pickDate(start: true),
                  child: Text(_startsAt == null ? 'Começa hoje' : 'De ${formatDate(_startsAt!)}'),
                ),
              ),
              const SizedBox(width: AppSpacing.sm),
              Expanded(
                child: OutlinedButton(
                  onPressed: () => _pickDate(start: false),
                  child: Text(_endsAt == null ? 'Sem fim' : 'Até ${formatDate(_endsAt!)}'),
                ),
              ),
            ],
          ),
          if (_startsAt != null || _endsAt != null)
            Align(
              alignment: Alignment.centerLeft,
              child: TextButton(
                onPressed: () => setState(() { _startsAt = null; _endsAt = null; }),
                child: const Text('Limpar período'),
              ),
            ),
          const SizedBox(height: AppSpacing.xl),
          FilledButton(
            onPressed: _busy ? null : _submit,
            child: Text(_busy
                ? 'Salvando...'
                : widget.promotion == null
                    ? 'Publicar campanha'
                    : 'Salvar alterações'),
          ),
        ],
      ),
    );
  }
}

class _ImageField extends StatelessWidget {
  const _ImageField({required this.imageUrl, required this.busy, required this.onPick});

  final String imageUrl;
  final bool busy;
  final VoidCallback onPick;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final empty = theme.inputDecorationTheme.fillColor ?? theme.colorScheme.surfaceContainerHighest;

    return InkWell(
      borderRadius: BorderRadius.circular(AppRadius.card),
      onTap: busy ? null : onPick,
      child: AspectRatio(
        aspectRatio: 16 / 9,
        child: ClipRRect(
          borderRadius: BorderRadius.circular(AppRadius.card),
          child: imageUrl.isEmpty
              ? Container(
                  color: empty,
                  alignment: Alignment.center,
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.add_photo_alternate_outlined, size: 32),
                      const SizedBox(height: AppSpacing.sm),
                      Text('Escolher a arte do banner', style: theme.textTheme.bodySmall),
                    ],
                  ),
                )
              : Stack(
                  fit: StackFit.expand,
                  children: [
                    RemoteImage(
                      url: imageUrl,
                      fallbackAsset: 'lib/assets/images/highlights/highlight-deal.jpg',
                    ),
                    Positioned(
                      right: AppSpacing.sm,
                      bottom: AppSpacing.sm,
                      child: IconButton.filledTonal(
                        onPressed: busy ? null : onPick,
                        tooltip: 'Trocar imagem',
                        icon: const Icon(Icons.photo_camera_outlined),
                      ),
                    ),
                  ],
                ),
        ),
      ),
    );
  }
}
