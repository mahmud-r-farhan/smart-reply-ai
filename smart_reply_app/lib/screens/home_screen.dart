import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/provider_config.dart';
import '../providers/chat_provider.dart';
import '../utils/app_theme.dart';
import '../utils/constants.dart';
import '../widgets/common/latency_badge.dart';
import '../widgets/dialogs/provider_settings_sheet.dart';
import '../widgets/dialogs/smartwatch_modal.dart';
import '../services/watch_bridge_service.dart';
import '../widgets/developer_side_panel.dart';
import '../widgets/gradient_background.dart';
import '../widgets/input/modular_text_input.dart';
import '../widgets/input/sample_prompts_row.dart';
import '../widgets/results/empty_results_view.dart';
import '../widgets/results/results_container.dart';
import '../widgets/selectors/engine_mode_chip_bar.dart';
import '../widgets/selectors/language_picker.dart';
import '../widgets/selectors/mode_tab_bar.dart';
import '../widgets/selectors/style_selector_bar.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();
  StreamSubscription<WatchReplyEvent>? _watchReplySub;

  @override
  void initState() {
    super.initState();
    WatchBridgeService.initialize();
    _watchReplySub = WatchBridgeService.replyStream.listen((event) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Row(
            children: [
              const Icon(Icons.watch_rounded, color: Colors.white, size: 20),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  '⌚ Reply sent from watch to ${event.sender}: "${event.reply}"',
                  style: const TextStyle(fontWeight: FontWeight.w600),
                ),
              ),
            ],
          ),
          backgroundColor: const Color(0xFF6366F1),
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          duration: const Duration(seconds: 4),
        ),
      );
    });
  }

  @override
  void dispose() {
    _watchReplySub?.cancel();
    super.dispose();
  }

  void _openSmartwatchModal(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => const SmartwatchModal(),
    );
  }

  void _openProviderSettings(BuildContext context, ChatProvider provider) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => ProviderSettingsSheet(
        currentConfig: provider.providerConfig,
        onSave: (ProviderConfig newConfig) {
          provider.setProviderConfig(newConfig);
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      key: _scaffoldKey,
      endDrawer: Drawer(
        backgroundColor: Colors.transparent,
        child: DeveloperSidePanel(
          onClose: () => _scaffoldKey.currentState?.closeEndDrawer(),
        ),
      ),
      body: GradientBackground(
        child: SafeArea(
          child: Consumer<ChatProvider>(
            builder: (context, chatProvider, _) {
              final isTranslate = chatProvider.mode == AppMode.translate;

              return Column(
                children: [
                  // App Bar / Top Navigation
                  _buildHeader(context, chatProvider),

                  // Engine Mode Selector (Hybrid, Offline, Cloud)
                  EngineModeChipBar(
                    activeMode: chatProvider.engineMode,
                    onModeChanged: chatProvider.setEngineMode,
                    onSettingsPressed: () => _openProviderSettings(context, chatProvider),
                  ),

                  // Main Scrollable Area
                  Expanded(
                    child: CustomScrollView(
                      physics: const BouncingScrollPhysics(),
                      slivers: [
                        // Mode Tabs (Reply, Enhance, Translate, Summarize)
                        SliverToBoxAdapter(
                          child: ModeTabBar(
                            currentMode: chatProvider.mode,
                            onModeChanged: chatProvider.setMode,
                          ),
                        ),

                        // Style / Tone Selector (or Language picker if translate)
                        SliverToBoxAdapter(
                          child: Padding(
                            padding: const EdgeInsets.only(top: 4, bottom: 8),
                            child: StyleSelectorBar(
                              currentStyle: chatProvider.style,
                              onStyleChanged: chatProvider.setStyle,
                            ),
                          ),
                        ),

                        // Language Picker if translate mode
                        if (isTranslate)
                          SliverToBoxAdapter(
                            child: LanguagePicker(
                              currentLanguage: chatProvider.targetLanguage,
                              onLanguageChanged: chatProvider.setTargetLanguage,
                            ),
                          ),

                        // Sample Prompts Quick Row
                        SliverToBoxAdapter(
                          child: Padding(
                            padding: const EdgeInsets.only(top: 4, bottom: 10),
                            child: SamplePromptsRow(
                              mode: chatProvider.mode,
                              onSelectPrompt: (prompt) {
                                chatProvider.setInput(prompt);
                              },
                            ),
                          ),
                        ),

                        // Modular Text Input Section
                        SliverToBoxAdapter(
                          child: ModularTextInput(
                            input: chatProvider.input,
                            mode: chatProvider.mode,
                            loading: chatProvider.loading,
                            error: chatProvider.error,
                            onInputChanged: chatProvider.setInput,
                            onSubmit: chatProvider.getResults,
                            onClear: chatProvider.clear,
                          ),
                        ),

                        const SliverToBoxAdapter(child: SizedBox(height: 16)),

                        // Results List
                        SliverToBoxAdapter(
                          child: ResultsContainer(
                            results: chatProvider.results,
                            mode: chatProvider.mode,
                            loading: chatProvider.loading,
                            onRegenerate: chatProvider.regenerate,
                          ),
                        ),

                        // Empty State if no results
                        if (chatProvider.results.isEmpty && !chatProvider.loading)
                          SliverFillRemaining(
                            hasScrollBody: false,
                            child: EmptyResultsView(mode: chatProvider.mode),
                          ),

                        const SliverToBoxAdapter(child: SizedBox(height: 24)),
                      ],
                    ),
                  ),
                ],
              );
            },
          ),
        ),
      ),
    );
  }

  Widget _buildHeader(BuildContext context, ChatProvider provider) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 6),
      child: Row(
        children: [
          // Logo & Title
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF6366F1), Color(0xFF8B5CF6)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(12),
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFF6366F1).withValues(alpha: 0.35),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: const Icon(
              Icons.auto_awesome_rounded,
              color: Colors.white,
              size: 20,
            ),
          ),
          const SizedBox(width: 12),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Smart Reply AI',
                style: TextStyle(
                  fontSize: 17,
                  fontWeight: FontWeight.w800,
                  color: AppTheme.textPrimary,
                  letterSpacing: -0.3,
                ),
              ),
              Text(
                'High-performance on-device & cloud assistant',
                style: TextStyle(
                  fontSize: 11,
                  color: AppTheme.textMuted.withValues(alpha: 0.7),
                ),
              ),
            ],
          ),

          const Spacer(),

          // If there was a previous run latency, show badge
          if (provider.lastLatencyMs > 0)
            Padding(
              padding: const EdgeInsets.only(right: 6),
              child: LatencyBadge(
                latencyMs: provider.lastLatencyMs,
                source: provider.results.firstOrNull?.source ?? 'heuristic',
              ),
            ),

          // Smartwatch Sync & Wear OS Modal
          IconButton(
            icon: const Icon(Icons.watch_rounded, color: AppTheme.textSecondary, size: 22),
            tooltip: 'Wear OS & Smartwatch Sync',
            onPressed: () => _openSmartwatchModal(context),
          ),

          // Menu button (Side panel)
          IconButton(
            icon: const Icon(Icons.info_outline_rounded, color: AppTheme.textSecondary, size: 22),
            tooltip: 'About & Open Source Info',
            onPressed: () => _scaffoldKey.currentState?.openEndDrawer(),
          ),
        ],
      ),
    );
  }
}
