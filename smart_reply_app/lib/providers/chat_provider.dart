import 'package:flutter/foundation.dart';
import '../models/engine_mode.dart';
import '../models/provider_config.dart';
import '../models/reply_suggestion.dart';
import '../services/hybrid_dispatcher.dart';
import '../services/settings_storage.dart';
import '../utils/constants.dart';

class ChatProvider extends ChangeNotifier {
  final HybridDispatcher _dispatcher;
  SettingsStorage? _storage;
  bool _disposed = false;

  /// Guards every async completion so a slow request cannot notify a
  /// disposed provider (which would throw in debug builds).
  void _safeNotify() {
    if (!_disposed) notifyListeners();
  }

  // State
  String _input = '';
  List<ReplySuggestion> _results = [];
  bool _loading = false;
  String _style = ResponseStyle.professional;
  String _mode = AppMode.reply;
  String _targetLanguage = 'Spanish';
  String? _error;
  EngineMode _engineMode = EngineMode.hybridRace;
  ProviderConfig _providerConfig = ProviderConfig.defaultPresets.first;
  int _lastLatencyMs = 0;

  ChatProvider({
    HybridDispatcher? dispatcher,
    SettingsStorage? storage,
  })  : _dispatcher = dispatcher ?? HybridDispatcher(),
        _storage = storage {
    _initStorage();
  }

  Future<void> _initStorage() async {
    try {
      _storage ??= await SettingsStorage.init();
      _engineMode = _storage!.getEngineMode();
      _providerConfig = _storage!.getProviderConfig();
      // Honours SMART_REPLY_BACKEND_URL / the saved backend setting: when no
      // BYOK key is configured, cloud modes fall back to the self-hosted API.
      _dispatcher.updateBackendUrl(_storage!.getBackendUrl());
    } catch (error) {
      debugPrint('Failed to load saved settings: $error');
    }
    _safeNotify();
  }

  // Getters
  String get input => _input;
  List<ReplySuggestion> get results => _results;
  bool get loading => _loading;
  String get style => _style;
  String get mode => _mode;
  String get targetLanguage => _targetLanguage;
  String? get error => _error;
  EngineMode get engineMode => _engineMode;
  ProviderConfig get providerConfig => _providerConfig;
  int get lastLatencyMs => _lastLatencyMs;

  // Setters
  void setInput(String value) {
    _input = value;
    notifyListeners();
  }

  void setStyle(String value) {
    _style = value;
    notifyListeners();
  }

  void setMode(String value) {
    _mode = value;
    _results = [];
    _error = null;
    notifyListeners();
  }

  void setTargetLanguage(String lang) {
    _targetLanguage = lang;
    notifyListeners();
  }

  void setEngineMode(EngineMode mode) {
    _engineMode = mode;
    _storage?.saveEngineMode(mode);
    notifyListeners();
  }

  void setProviderConfig(ProviderConfig config) {
    _providerConfig = config;
    _storage?.saveProviderConfig(config);
    notifyListeners();
  }

  void clear() {
    _input = '';
    _results = [];
    _error = null;
    notifyListeners();
  }

  /// Generate results based on current mode and engine settings
  Future<void> getResults() async {
    final cleanInput = _input.trim();
    if (cleanInput.isEmpty) return;

    _loading = true;
    _results = [];
    _error = null;
    notifyListeners();

    final stopwatch = Stopwatch()..start();

    try {
      List<ReplySuggestion> fetched = [];

      switch (_mode) {
        case AppMode.reply:
          fetched = await _dispatcher.dispatchReply(
            message: cleanInput,
            tone: _style,
            mode: _engineMode,
            providerConfig: _providerConfig,
          );
          break;

        case AppMode.enhance:
          fetched = await _dispatcher.dispatchEnhance(
            text: cleanInput,
            tone: _style,
            mode: _engineMode,
            providerConfig: _providerConfig,
          );
          break;

        case AppMode.translate:
          fetched = await _dispatcher.dispatchTranslate(
            text: cleanInput,
            targetLanguage: _targetLanguage,
            tone: _style,
            mode: _engineMode,
            providerConfig: _providerConfig,
          );
          break;

        case AppMode.summarize:
          fetched = await _dispatcher.dispatchSummarize(
            text: cleanInput,
            mode: _engineMode,
            providerConfig: _providerConfig,
          );
          break;

        default:
          fetched = await _dispatcher.dispatchReply(
            message: cleanInput,
            tone: _style,
            mode: _engineMode,
            providerConfig: _providerConfig,
          );
      }

      stopwatch.stop();
      _lastLatencyMs = stopwatch.elapsedMilliseconds;
      _results = fetched;
    } catch (e) {
      stopwatch.stop();
      _lastLatencyMs = stopwatch.elapsedMilliseconds;
      _error = e.toString().replaceFirst('Exception: ', '');
    } finally {
      _loading = false;
      _safeNotify();
    }
  }

  /// Regenerate results with current settings
  Future<void> regenerate() async {
    await getResults();
  }

  @override
  void dispose() {
    _disposed = true;
    _dispatcher.dispose();
    super.dispose();
  }
}
