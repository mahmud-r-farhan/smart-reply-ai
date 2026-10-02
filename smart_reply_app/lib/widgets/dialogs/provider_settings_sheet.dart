import 'package:flutter/material.dart';
import '../../models/provider_config.dart';
import '../../utils/app_theme.dart';

/// Modal bottom sheet for configuring Universal Cloud LLM Providers
class ProviderSettingsSheet extends StatefulWidget {
  final ProviderConfig currentConfig;
  final ValueChanged<ProviderConfig> onSave;

  const ProviderSettingsSheet({
    super.key,
    required this.currentConfig,
    required this.onSave,
  });

  @override
  State<ProviderSettingsSheet> createState() => _ProviderSettingsSheetState();
}

class _ProviderSettingsSheetState extends State<ProviderSettingsSheet> {
  late TextEditingController _nameController;
  late TextEditingController _baseUrlController;
  late TextEditingController _apiKeyController;
  late TextEditingController _modelController;
  late double _temperature;
  bool _obscureApiKey = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController(text: widget.currentConfig.name);
    _baseUrlController = TextEditingController(text: widget.currentConfig.baseURL);
    _apiKeyController = TextEditingController(text: widget.currentConfig.apiKey);
    _modelController = TextEditingController(text: widget.currentConfig.model);
    _temperature = widget.currentConfig.temperature;
  }

  @override
  void dispose() {
    _nameController.dispose();
    _baseUrlController.dispose();
    _apiKeyController.dispose();
    _modelController.dispose();
    super.dispose();
  }

  void _applyPreset(ProviderConfig preset) {
    setState(() {
      final endpointChanged = _baseUrlController.text.trim() != preset.baseURL;
      _nameController.text = preset.name;
      _baseUrlController.text = preset.baseURL;
      _modelController.text = preset.model;
      // API keys are issued per endpoint: never carry one over to a different
      // provider, or the previous provider's secret would be sent to the new one.
      if (endpointChanged) _apiKeyController.clear();
      _error = null;
    });
  }

  void _save() {
    final baseUrl = _baseUrlController.text.trim();
    final uri = Uri.tryParse(baseUrl);
    final model = _modelController.text.trim();

    if (baseUrl.isEmpty ||
        uri == null ||
        !uri.hasScheme ||
        (uri.scheme != 'http' && uri.scheme != 'https') ||
        uri.host.isEmpty) {
      setState(() => _error =
          'Enter a valid http(s) base URL, e.g. https://api.groq.com/openai/v1');
      return;
    }
    if (model.isEmpty) {
      setState(() => _error = 'Enter the model identifier, e.g. llama-3.1-8b-instant');
      return;
    }

    final updated = ProviderConfig(
      id: widget.currentConfig.id,
      name: _nameController.text.trim().isEmpty ? uri.host : _nameController.text.trim(),
      baseURL: baseUrl,
      apiKey: _apiKeyController.text.trim(),
      model: model,
      temperature: _temperature,
      maxTokens: widget.currentConfig.maxTokens,
    );
    widget.onSave(updated);
    Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppTheme.backgroundDark,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        border: Border.all(color: AppTheme.borderColor.withValues(alpha: 0.5)),
      ),
      padding: EdgeInsets.fromLTRB(
        20,
        16,
        20,
        MediaQuery.of(context).viewInsets.bottom + 20,
      ),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Handle bar
            Center(
              child: Container(
                width: 36,
                height: 4,
                decoration: BoxDecoration(
                  color: AppTheme.borderColor,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Title
            Row(
              children: [
                const Icon(Icons.cloud_sync_rounded, color: AppTheme.primaryLight, size: 22),
                const SizedBox(width: 8),
                const Text(
                  'Cloud AI Provider Settings',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.textPrimary,
                  ),
                ),
                const Spacer(),
                IconButton(
                  icon: const Icon(Icons.close_rounded, size: 20, color: AppTheme.textMuted),
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(),
                  onPressed: () => Navigator.of(context).pop(),
                ),
              ],
            ),
            const SizedBox(height: 12),

            // Quick Preset Chips
            Text(
              'QUICK PRESETS',
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w700,
                color: AppTheme.textMuted.withValues(alpha: 0.8),
                letterSpacing: 0.5,
              ),
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: ProviderConfig.defaultPresets.map((preset) {
                final isSelected = _baseUrlController.text == preset.baseURL;
                return InkWell(
                  onTap: () => _applyPreset(preset),
                  borderRadius: BorderRadius.circular(10),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: isSelected
                          ? AppTheme.primary.withValues(alpha: 0.25)
                          : AppTheme.surface.withValues(alpha: 0.5),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(
                        color: isSelected ? AppTheme.primary : AppTheme.borderColor.withValues(alpha: 0.3),
                      ),
                    ),
                    child: Text(
                      preset.name.split(' (').first,
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                        color: isSelected ? AppTheme.textPrimary : AppTheme.textSecondary,
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
            const SizedBox(height: 16),

            // Base URL Field
            _buildField(
              controller: _baseUrlController,
              label: 'Base URL (OpenAI /v1 compatible)',
              hint: 'https://api.groq.com/openai/v1 or http://localhost:11434/v1',
            ),
            const SizedBox(height: 12),

            // Model ID
            _buildField(
              controller: _modelController,
              label: 'Model Identifier',
              hint: 'llama-3.1-8b-instant, meta-llama/llama-3.3-70b-instruct:free, etc.',
            ),
            const SizedBox(height: 12),

            // API Key
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'API Key (stored on this device, sent only to the base URL above)',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: AppTheme.textSecondary,
                  ),
                ),
                const SizedBox(height: 6),
                Container(
                  decoration: BoxDecoration(
                    color: AppTheme.surface.withValues(alpha: 0.6),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppTheme.borderColor.withValues(alpha: 0.4)),
                  ),
                  child: TextField(
                    controller: _apiKeyController,
                    obscureText: _obscureApiKey,
                    style: const TextStyle(color: AppTheme.textPrimary, fontSize: 13),
                    decoration: InputDecoration(
                      hintText: 'Enter API Key (Optional for local Ollama)',
                      hintStyle: TextStyle(color: AppTheme.textMuted.withValues(alpha: 0.5), fontSize: 13),
                      border: InputBorder.none,
                      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                      suffixIcon: IconButton(
                        icon: Icon(
                          _obscureApiKey ? Icons.visibility_off_rounded : Icons.visibility_rounded,
                          size: 18,
                          color: AppTheme.textMuted,
                        ),
                        onPressed: () => setState(() => _obscureApiKey = !_obscureApiKey),
                      ),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 14),

            // Temperature Slider
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Creativity (Temperature): ${_temperature.toStringAsFixed(2)}',
                  style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary, fontWeight: FontWeight.w600),
                ),
              ],
            ),
            Slider(
              value: _temperature,
              min: 0.0,
              max: 1.0,
              divisions: 10,
              activeColor: AppTheme.primary,
              inactiveColor: AppTheme.borderColor,
              onChanged: (val) => setState(() => _temperature = val),
            ),
            const SizedBox(height: 12),

            if (_error != null) ...[
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                decoration: BoxDecoration(
                  color: AppTheme.errorColor.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: AppTheme.errorColor.withValues(alpha: 0.35)),
                ),
                child: Text(
                  _error!,
                  style: const TextStyle(
                    fontSize: 12,
                    color: AppTheme.errorColor,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
              const SizedBox(height: 12),
            ],

            // Save Button
            ElevatedButton(
              onPressed: _save,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primary,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: const Text('Save Provider Settings', style: TextStyle(fontWeight: FontWeight.w700)),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildField({
    required TextEditingController controller,
    required String label,
    required String hint,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            color: AppTheme.textSecondary,
          ),
        ),
        const SizedBox(height: 6),
        Container(
          decoration: BoxDecoration(
            color: AppTheme.surface.withValues(alpha: 0.6),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppTheme.borderColor.withValues(alpha: 0.4)),
          ),
          child: TextField(
            controller: controller,
            style: const TextStyle(color: AppTheme.textPrimary, fontSize: 13),
            decoration: InputDecoration(
              hintText: hint,
              hintStyle: TextStyle(color: AppTheme.textMuted.withValues(alpha: 0.5), fontSize: 13),
              border: InputBorder.none,
              contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            ),
          ),
        ),
      ],
    );
  }
}
