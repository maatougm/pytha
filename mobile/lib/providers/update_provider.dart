import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/update_service.dart';

// Update check state
class UpdateState {
  final bool isChecking;
  final bool hasUpdate;
  final bool forceUpdate;
  final String? version;
  final String? error;
  final bool hasChecked;

  const UpdateState({
    this.isChecking = false,
    this.hasUpdate = false,
    this.forceUpdate = false,
    this.version,
    this.error,
    this.hasChecked = false,
  });

  UpdateState copyWith({
    bool? isChecking,
    bool? hasUpdate,
    bool? forceUpdate,
    String? version,
    String? error,
    bool? hasChecked,
  }) {
    return UpdateState(
      isChecking: isChecking ?? this.isChecking,
      hasUpdate: hasUpdate ?? this.hasUpdate,
      forceUpdate: forceUpdate ?? this.forceUpdate,
      version: version ?? this.version,
      error: error ?? this.error,
      hasChecked: hasChecked ?? this.hasChecked,
    );
  }
}

// Update notifier
class UpdateNotifier extends StateNotifier<UpdateState> {
  UpdateNotifier() : super(const UpdateState());

  Future<void> checkForUpdate(BuildContext context) async {
    // Don't check if already checking or already checked this session
    if (state.isChecking || state.hasChecked) return;

    state = state.copyWith(isChecking: true);

    try {
      final updateInfo = await UpdateService().checkForUpdate();

      if (updateInfo != null) {
        state = state.copyWith(
          isChecking: false,
          hasChecked: true,
          hasUpdate: updateInfo.hasUpdate,
          forceUpdate: updateInfo.forceUpdate,
          version: updateInfo.version,
        );

        // Show update dialog if update is available
        if (updateInfo.hasUpdate && context.mounted) {
          // Small delay to let the UI settle
          await Future.delayed(const Duration(milliseconds: 500));
          if (context.mounted) {
            UpdateService().showUpdateDialog(
              context,
              updateInfo,
              showSkip: !updateInfo.forceUpdate,
            );
          }
        }
      } else {
        state = state.copyWith(
          isChecking: false,
          hasChecked: true,
        );
      }
    } catch (e) {
      state = state.copyWith(
        isChecking: false,
        hasChecked: true,
        error: e.toString(),
      );
    }
  }

  // Manual check for updates
  Future<void> manualCheck(BuildContext context) async {
    state = const UpdateState(); // Reset state
    await checkForUpdate(context);
  }

  // Reset state (for testing or retry)
  void reset() {
    state = const UpdateState();
  }
}

// Provider
final updateProvider = StateNotifierProvider<UpdateNotifier, UpdateState>((ref) {
  return UpdateNotifier();
});

// Stream provider for periodic update checks (optional)
final periodicUpdateProvider = StreamProvider.autoDispose<void>((ref) async* {
  // Check every 24 hours when app is in use
  while (true) {
    await Future.delayed(const Duration(hours: 24));
    yield null;
  }
});
