import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:fazbrike/firebase_options.dart';

/// Handler top-level exigido pelo Firebase Messaging (isolate em background).
/// Com o app fechado, o próprio sistema exibe a notificação enviada pelo FCM.
@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
}
