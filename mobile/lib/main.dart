import 'dart:io';

import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:fazbrike/firebase_options.dart';
import 'package:fazbrike/services/fcm/fcm_background_handler.dart';
import 'package:fazbrike/src/app/fazbrike_app.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await _initFirebase();
  runApp(const ProviderScope(child: FazbrikeApp()));
}

/// Firebase só existe para Android e iOS (lib/firebase_options.dart). Falha
/// aqui não pode impedir o app de abrir: sem push, a central segue por polling.
Future<void> _initFirebase() async {
  if (kIsWeb || !(Platform.isAndroid || Platform.isIOS)) return;
  try {
    await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
    FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);
  } catch (error) {
    debugPrint('Firebase: falha ao inicializar — $error');
  }
}