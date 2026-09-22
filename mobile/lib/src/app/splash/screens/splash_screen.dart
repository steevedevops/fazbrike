import 'package:flutter/material.dart';
import 'package:fazbrike/src/shared/widgets/loading_view.dart';

class SplashScreen extends StatelessWidget {
  const SplashScreen({super.key});
  static const path = '/splash';
  @override
  Widget build(BuildContext context) => const Scaffold(body: LoadingView(label: 'Iniciando Fazbrike'));
}
