import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../providers/chat_provider.dart';
import '../utils/app_config.dart';
import '../utils/app_theme.dart';

/// About panel: app/developer metadata (read from [AppConfig] so it can never
/// drift from the build) plus the self-hosted backend URL used when no BYOK key
/// is configured.
class DeveloperSidePanel extends StatefulWidget {
  final VoidCallback onClose;

  const DeveloperSidePanel({
    super.key,
    required this.onClose,
  });

  @override
  State<DeveloperSidePanel> createState() => _DeveloperSidePanelState();
}

class _DeveloperSidePanelState extends State<DeveloperSidePanel> {
  late final TextEditingController _backendController;
  String? _backendError;

  @override
  void initState() {
    super.initState();
    _backendController =
        TextEditingController(text: context.read<ChatProvider>().backendUrl);
  }

  @override
  void dispose() {
    _backendController.dispose();
    super.dispose();
  }

  Future<void> _saveBackendUrl() async {
    final value = _backendController.text.trim();
    final uri = value.isEmpty ? null : Uri.tryParse(value);

    if (value.isNotEmpty &&
        (uri == null ||
            !uri.hasScheme ||
            (uri.scheme != 'http' && uri.scheme != 'https') ||
            uri.host.isEmpty)) {
      setState(() => _backendError =
          'Enter a valid http(s) URL, e.g. http://10.0.2.2:5006/api');
      return;
    }

    await context.read<ChatProvider>().setBackendUrl(value);
    if (!mounted) return;

    setState(() => _backendError = null);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          value.isEmpty
              ? 'Backend bridge disabled — on-device and BYOK cloud modes only'
              : 'Backend bridge set to $value',
          style: const TextStyle(fontWeight: FontWeight.w600),
        ),
        backgroundColor: AppTheme.backgroundCard,
        behavior: SnackBarBehavior.floating,
        duration: const Duration(seconds: 3),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return SlideTransition(
      position: Tween<Offset>(
        begin: const Offset(1, 0),
        end: Offset.zero,
      ).animate(
        CurvedAnimation(
          parent: ModalRoute.of(context)?.animation ?? kAlwaysCompleteAnimation,
          curve: Curves.easeOutCubic,
        ),
      ),
      child: Container(
        decoration: BoxDecoration(
          color: AppTheme.backgroundCard.withValues(alpha: 0.95),
          border: Border(
            left: BorderSide(
              color: AppTheme.borderColor.withValues(alpha: 0.2),
            ),
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.15),
              blurRadius: 20,
              offset: const Offset(-8, 0),
            ),
          ],
        ),
        child: SafeArea(
          child: Column(
            children: [
              // Header
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'About',
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                            fontWeight: FontWeight.w600,
                          ),
                    ),
                    Material(
                      color: Colors.transparent,
                      child: InkWell(
                        onTap: widget.onClose,
                        borderRadius: BorderRadius.circular(8),
                        child: Padding(
                          padding: const EdgeInsets.all(8),
                          child: Icon(
                            Icons.close_rounded,
                            color: AppTheme.textMuted,
                            size: 20,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              Divider(
                color: AppTheme.borderColor.withValues(alpha: 0.15),
                thickness: 1,
                height: 1,
              ),
              // Content
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Developer Card
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: AppTheme.primaryBlue.withValues(alpha: 0.08),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: AppTheme.primaryBlue.withValues(alpha: 0.2),
                          ),
                        ),
                        child: Column(
                          children: [
                            CircleAvatar(
                              radius: 36,
                              backgroundImage: NetworkImage(AppConfig.developerAvatar),
                              backgroundColor: AppTheme.primaryBlue.withValues(alpha: 0.15),
                            ),
                            const SizedBox(height: 12),
                            Text(
                              AppConfig.developerName,
                              style: Theme.of(context)
                                  .textTheme
                                  .titleSmall
                                  ?.copyWith(
                                    fontWeight: FontWeight.w600,
                                  ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              AppConfig.developerTitle,
                              style: Theme.of(context)
                                  .textTheme
                                  .bodySmall
                                  ?.copyWith(
                                    color: AppTheme.textMuted,
                                  ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 24),
                      // App Info
                      _buildSection(
                        context,
                        'App',
                        [
                          _buildInfoRow(context, 'Name', AppConfig.appName),
                          _buildInfoRow(
                            context,
                            'Version',
                            '${AppConfig.appVersion} (${AppConfig.buildNumber})',
                          ),
                          _buildInfoRow(context, 'License', AppConfig.licenseName),
                        ],
                      ),
                      const SizedBox(height: 20),
                      // Backend bridge configuration
                      _buildSection(
                        context,
                        'Backend bridge',
                        [
                          Text(
                            'Used when no cloud API key is set. Leave empty to disable.',
                            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                  color: AppTheme.textMuted,
                                ),
                          ),
                          const SizedBox(height: 8),
                          Container(
                            decoration: BoxDecoration(
                              color: AppTheme.surface.withValues(alpha: 0.6),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                color: _backendError != null
                                    ? AppTheme.errorColor.withValues(alpha: 0.6)
                                    : AppTheme.borderColor.withValues(alpha: 0.4),
                              ),
                            ),
                            child: TextField(
                              controller: _backendController,
                              keyboardType: TextInputType.url,
                              autocorrect: false,
                              style: const TextStyle(
                                color: AppTheme.textPrimary,
                                fontSize: 13,
                              ),
                              decoration: InputDecoration(
                                hintText: 'http://10.0.2.2:5006/api',
                                hintStyle: TextStyle(
                                  color: AppTheme.textMuted.withValues(alpha: 0.5),
                                  fontSize: 13,
                                ),
                                border: InputBorder.none,
                                contentPadding:
                                    const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                              ),
                            ),
                          ),
                          if (_backendError != null) ...[
                            const SizedBox(height: 6),
                            Text(
                              _backendError!,
                              style: const TextStyle(
                                fontSize: 11,
                                color: AppTheme.errorColor,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                          const SizedBox(height: 10),
                          Align(
                            alignment: Alignment.centerRight,
                            child: ElevatedButton(
                              onPressed: _saveBackendUrl,
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppTheme.primaryBlue,
                                foregroundColor: Colors.white,
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 18,
                                  vertical: 10,
                                ),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(10),
                                ),
                              ),
                              child: const Text(
                                'Save backend URL',
                                style: TextStyle(fontWeight: FontWeight.w700, fontSize: 12),
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 20),
                      // Links
                      _buildSection(
                        context,
                        'Connect',
                        [
                          _buildLink(
                            context,
                            Icons.language_rounded,
                            'GitHub',
                            AppConfig.githubUrl,
                          ),
                          _buildLink(
                            context,
                            Icons.work_rounded,
                            'LinkedIn',
                            AppConfig.linkedinUrl,
                          ),
                        ],
                      ),
                      const SizedBox(height: 20),
                      // Footer text
                      Text(
                        '© ${AppConfig.licenseYear}-${DateTime.now().year} '
                        '${AppConfig.copyrightHolder}',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: AppTheme.textDisabled,
                            ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSection(
    BuildContext context,
    String title,
    List<Widget> children,
  ) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: Theme.of(context).textTheme.labelMedium?.copyWith(
                fontWeight: FontWeight.w600,
                color: AppTheme.textMuted,
              ),
        ),
        const SizedBox(height: 10),
        ...children.map((child) => Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: child,
            )),
      ],
    );
  }

  Widget _buildInfoRow(
    BuildContext context,
    String label,
    String value,
  ) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: AppTheme.textMuted,
              ),
        ),
        Text(
          value,
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: AppTheme.textSecondary,
                fontWeight: FontWeight.w500,
              ),
        ),
      ],
    );
  }

  Widget _buildLink(
    BuildContext context,
    IconData icon,
    String label,
    String url,
  ) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () => _launchUrl(url),
        borderRadius: BorderRadius.circular(8),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 10),
          child: Row(
            children: [
              Icon(
                icon,
                size: 18,
                color: AppTheme.primaryBlue,
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  label,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: AppTheme.primaryBlue,
                        fontWeight: FontWeight.w500,
                      ),
                ),
              ),
              Icon(
                Icons.arrow_outward_rounded,
                size: 14,
                color: AppTheme.primaryBlue.withValues(alpha: 0.5),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _launchUrl(String url) async {
    final Uri uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    } else {
      debugPrint('Could not launch $url');
    }
  }
}
