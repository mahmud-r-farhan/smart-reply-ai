import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../utils/app_theme.dart';

class DeveloperSidePanel extends StatelessWidget {
  final VoidCallback onClose;

  const DeveloperSidePanel({
    super.key,
    required this.onClose,
  });

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
                        onTap: onClose,
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
                              backgroundImage: NetworkImage(
                                'https://avatars.githubusercontent.com/u/114731414?v=4',
                              ),
                              backgroundColor: AppTheme.primaryBlue.withValues(alpha: 0.15),
                            ),
                            const SizedBox(height: 12),
                            Text(
                              'Mahmud Rahman',
                              style: Theme.of(context)
                                  .textTheme
                                  .titleSmall
                                  ?.copyWith(
                                    fontWeight: FontWeight.w600,
                                  ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'Full Stack Developer',
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
                          _buildInfoRow(context, 'Name', 'Smart Reply AI'),
                          _buildInfoRow(context, 'Version', '0.2.0'),
                          _buildInfoRow(context, 'License', 'MIT'),
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
                            'https://github.com/mahmud-r-farhan',
                          ),
                          _buildLink(
                            context,
                            Icons.work_rounded,
                            'LinkedIn',
                            'https://www.linkedin.com/in/mahmud-r-farhan/',
                          ),
                        ],
                      ),
                      const SizedBox(height: 20),
                      // Footer text
                      Text(
                        '© 2024-${DateTime.now().year} Mahmud Rahman',
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