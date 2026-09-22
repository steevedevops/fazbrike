import 'package:flutter/foundation.dart';

enum SessionStatus { checking, authenticated, unauthenticated }

final sessionSignal = ValueNotifier<SessionStatus>(SessionStatus.checking);
