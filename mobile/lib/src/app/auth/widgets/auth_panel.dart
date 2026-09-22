import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:fazbrike/services/models/api_exception.dart';
import 'package:fazbrike/src/app/auth/controllers/auth_controller.dart';
import 'package:fazbrike/src/theme/app_spacing.dart';

class AuthPanel extends ConsumerStatefulWidget {
  const AuthPanel({super.key});
  @override
  ConsumerState<AuthPanel> createState() => _AuthPanelState();
}

class _AuthPanelState extends ConsumerState<AuthPanel> {
  final _formKey = GlobalKey<FormState>();
  final _name = TextEditingController();
  final _email = TextEditingController();
  final _password = TextEditingController();
  final _confirm = TextEditingController();
  bool _register = false;
  bool _remember = false;
  bool _obscure = true;
  String _error = '';

  @override
  void initState() {
    super.initState();
    SharedPreferences.getInstance().then((prefs) {
      final remembered = prefs.getString('fazbrike_remember');
      if (remembered != null && mounted) setState(() { _email.text = remembered; _remember = true; });
    });
  }

  @override
  void dispose() {
    _name.dispose();
    _email.dispose();
    _password.dispose();
    _confirm.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _error = '');
    try {
      final form = ref.read(authFormProvider.notifier);
      if (_register) {
        final email = await form.register(_name.text, _email.text, _password.text);
        if (mounted) context.go('/verificar-email?email=${Uri.encodeQueryComponent(email)}');
      } else {
        await form.login(_email.text, _password.text);
        final prefs = await SharedPreferences.getInstance();
        if (_remember) {
          await prefs.setString('fazbrike_remember', _email.text.trim());
        } else {
          await prefs.remove('fazbrike_remember');
        }
        if (mounted) context.go('/');
      }
    } catch (error) {
      if (!mounted) return;
      final apiError = error is ApiException ? error : null;
      if (!_register && apiError?.details is Map && apiError!.details['email_verified'] == false) {
        context.go('/verificar-email?email=${Uri.encodeQueryComponent(_email.text.trim())}');
      } else {
        setState(() => _error = error.toString());
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final busy = ref.watch(authFormProvider).isLoading;
    return ListView(
      padding: const EdgeInsets.all(AppSpacing.xl),
      children: [
        const SizedBox(height: AppSpacing.lg),
        Text(
          _register ? 'Crie sua conta' : 'Bem-vindo de volta',
          style: Theme.of(context).textTheme.headlineMedium,
        ),
        const SizedBox(height: AppSpacing.sm),
        Text(_register ? 'Junte-se à comunidade Fazbrike.' : 'Acesse sua conta para continuar.'),
        const SizedBox(height: AppSpacing.xl),
        SegmentedButton<bool>(
          segments: const [
            ButtonSegment(value: false, label: Text('Entrar')),
            ButtonSegment(value: true, label: Text('Criar conta')),
          ],
          selected: {_register},
          onSelectionChanged: busy ? null : (value) => setState(() { _register = value.first; _error = ''; }),
        ),
        const SizedBox(height: AppSpacing.xl),
        if (_error.isNotEmpty) ...[
          Text(_error, style: TextStyle(color: Theme.of(context).colorScheme.error)),
          const SizedBox(height: AppSpacing.md),
        ],
        Form(
          key: _formKey,
          child: Column(
            children: [
              if (_register) ...[
                TextFormField(
                  controller: _name,
                  textInputAction: TextInputAction.next,
                  decoration: const InputDecoration(labelText: 'Nome completo'),
                  validator: (value) => (value?.trim().length ?? 0) < 2 ? 'Informe seu nome completo.' : null,
                ),
                const SizedBox(height: AppSpacing.md),
              ],
              TextFormField(
                controller: _email,
                keyboardType: TextInputType.emailAddress,
                textInputAction: TextInputAction.next,
                autofillHints: const [AutofillHints.email],
                decoration: const InputDecoration(labelText: 'Email'),
                validator: (value) => RegExp(r'^\S+@\S+\.\S+$').hasMatch(value?.trim() ?? '') ? null : 'Informe um email válido.',
              ),
              const SizedBox(height: AppSpacing.md),
              TextFormField(
                controller: _password,
                obscureText: _obscure,
                autofillHints: [_register ? AutofillHints.newPassword : AutofillHints.password],
                decoration: InputDecoration(
                  labelText: 'Senha',
                  suffixIcon: IconButton(
                    onPressed: () => setState(() => _obscure = !_obscure),
                    icon: Icon(_obscure ? Icons.visibility_outlined : Icons.visibility_off_outlined),
                  ),
                ),
                validator: (value) => _register && (value?.length ?? 0) < 8
                    ? 'A senha deve ter pelo menos 8 caracteres.'
                    : (value?.isEmpty ?? true) ? 'Informe sua senha.' : null,
              ),
              if (_register) ...[
                const SizedBox(height: AppSpacing.md),
                TextFormField(
                  controller: _confirm,
                  obscureText: _obscure,
                  decoration: const InputDecoration(labelText: 'Confirmar senha'),
                  validator: (value) => value != _password.text ? 'As senhas não coincidem.' : null,
                ),
              ] else ...[
                CheckboxListTile(
                  contentPadding: EdgeInsets.zero,
                  value: _remember,
                  onChanged: (value) => setState(() => _remember = value ?? false),
                  title: const Text('Lembrar meu email'),
                  controlAffinity: ListTileControlAffinity.leading,
                ),
              ],
              const SizedBox(height: AppSpacing.lg),
              SizedBox(
                width: double.infinity,
                child: FilledButton(
                  onPressed: busy ? null : _submit,
                  child: Text(busy ? 'Aguarde...' : _register ? 'Criar conta' : 'Entrar'),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
