import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/engine_mode.dart';
import '../models/provider_config.dart';
import '../utils/app_config.dart';

/// Local Settings & Preferences Storage
class SettingsStorage {
  static const _keyEngineMode = 'smart_reply_engine_mode';
  static const _keyProviderConfig = 'smart_reply_provider_config';
  static const _keyBackendUrl = 'smart_reply_backend_url';

  final SharedPreferences? _prefs;

  SettingsStorage({SharedPreferences? prefs}) : _prefs = prefs;

  static Future<SettingsStorage> init() async {
    final prefs = await SharedPreferences.getInstance();
    return SettingsStorage(prefs: prefs);
  }

  /// Get active engine mode
  EngineMode getEngineMode() {
    final str = _prefs?.getString(_keyEngineMode);
    if (str != null) {
      for (final m in EngineMode.values) {
        if (m.name == str) return m;
      }
    }
    return EngineMode.hybridRace; // Default: Hybrid Race (Zero Latency)
  }

  Future<void> saveEngineMode(EngineMode mode) async {
    await _prefs?.setString(_keyEngineMode, mode.name);
  }

  /// Get provider configuration
  ProviderConfig getProviderConfig() {
    final raw = _prefs?.getString(_keyProviderConfig);
    if (raw != null) {
      try {
        final map = jsonDecode(raw) as Map<String, dynamic>;
        return ProviderConfig.fromJson(map);
      } catch (_) {}
    }
    return ProviderConfig.defaultPresets.first; // Groq
  }

  Future<void> saveProviderConfig(ProviderConfig config) async {
    await _prefs?.setString(_keyProviderConfig, jsonEncode(config.toJson()));
  }

  /// Get optional backend URL
  String getBackendUrl() {
    return _prefs?.getString(_keyBackendUrl) ?? AppConfig.baseUrl;
  }

  Future<void> saveBackendUrl(String url) async {
    final clean = url.trim();
    if (clean.isEmpty) return;
    await _prefs?.setString(_keyBackendUrl, clean);
  }
}
