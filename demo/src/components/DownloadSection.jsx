import React from 'react';
import { Download, Monitor, Smartphone, Globe, Shield, Terminal, Apple, Layers, Cpu, ExternalLink } from 'lucide-react';

const DOWNLOAD_ITEMS = [
  {
    platform: 'Windows (Native C++)',
    tag: 'Recommended for PC',
    icon: Terminal,
    iconBg: '#3B82F620',
    iconColor: '#60A5FA',
    filename: 'SmartReplyAI-standalone.exe',
    size: '< 2 MB',
    specs: 'Windows 10/11 • 64-bit • Zero Install',
    description: 'Ultra-lightweight Win32 desktop assistant. Press Ctrl + Shift + R anywhere to auto-paste suggestions via SendInput.',
    url: 'https://github.com/mahmud-r-farhan/smart-reply-ai/releases/download/v1.1.0/SmartReplyAI-standalone.exe'
  },
  {
    platform: 'Android (Phone & Tablet)',
    tag: 'Wear OS Sync',
    icon: Smartphone,
    iconBg: '#10B98120',
    iconColor: '#34D399',
    filename: 'smart-reply-android-release.apk',
    size: '~28 MB',
    specs: 'Android 6.0+ • Phone & Tablet',
    description: 'Includes WearableExtender bridge for circular suggestion pills on Samsung Galaxy Watch, Pixel Watch, and TicWatch.',
    url: 'https://github.com/mahmud-r-farhan/smart-reply-ai/releases/download/v1.1.0/smart-reply-android-release.apk'
  },
  {
    platform: 'HarmonyOS (Native ArkTS)',
    tag: 'Huawei & HarmonyOS NEXT',
    icon: Cpu,
    iconBg: '#EC489920',
    iconColor: '#F472B6',
    filename: 'smart-reply-harmonyos-native.zip',
    size: '< 1 MB',
    specs: 'HarmonyOS API 12 • Stage Model',
    description: 'Pure native ArkTS / ArkUI app bundle with Huawei Watch GT / Watch 4 notification mirror and @ohos.net.http cloud adapter.',
    url: 'https://github.com/mahmud-r-farhan/smart-reply-ai/releases/download/v1.1.0/smart-reply-harmonyos-native.zip'
  },
  {
    platform: 'Chrome / Edge / Brave',
    tag: 'Browser Extension',
    icon: Globe,
    iconBg: '#8B5CF620',
    iconColor: '#A78BFA',
    filename: 'smart-reply-chrome-extension.zip',
    size: '< 1 MB',
    specs: 'Manifest V3 • Chromium Browsers',
    description: 'Inject smart reply pill overlays into Gmail, Outlook Web, LinkedIn, WhatsApp Web, Zendesk, and Twitter.',
    url: 'https://github.com/mahmud-r-farhan/smart-reply-ai/releases/download/v1.1.0/smart-reply-chrome-extension.zip'
  },
  {
    platform: 'Windows (Flutter Desktop)',
    tag: 'Rich GUI',
    icon: Monitor,
    iconBg: '#06B6D420',
    iconColor: '#22D3EE',
    filename: 'smart-reply-flutter-windows-x64.zip',
    size: '~25 MB',
    specs: 'Windows 10/11 • Full Window GUI',
    description: 'Complete Flutter Desktop experience with multi-engine switching, tone sliders, and telemetry badges.',
    url: 'https://github.com/mahmud-r-farhan/smart-reply-ai/releases/download/v1.1.0/smart-reply-flutter-windows-x64.zip'
  },
  {
    platform: 'macOS (Universal)',
    tag: 'Apple Silicon & Intel',
    icon: Apple,
    iconBg: '#F59E0B20',
    iconColor: '#FBBF24',
    filename: 'smart-reply-macos-universal.zip',
    size: '~35 MB',
    specs: 'macOS 11+ • M1/M2/M3 & x64',
    description: 'Universal macOS desktop bundle with native Menubar support and hybrid race latency dispatcher.',
    url: 'https://github.com/mahmud-r-farhan/smart-reply-ai/releases/download/v1.1.0/smart-reply-macos-universal.zip'
  },
  {
    platform: 'Linux (x64)',
    tag: 'GTK Desktop',
    icon: Layers,
    iconBg: '#3B82F620',
    iconColor: '#60A5FA',
    filename: 'smart-reply-linux-x64.tar.gz',
    size: '~20 MB',
    specs: 'glibc 2.31+ • Ubuntu, Fedora, Arch',
    description: 'Standalone Linux x64 GTK desktop bundle with zero system library requirements.',
    url: 'https://github.com/mahmud-r-farhan/smart-reply-ai/releases/download/v1.1.0/smart-reply-linux-x64.tar.gz'
  },
  {
    platform: 'iOS (Sideload IPA)',
    tag: 'Apple Watch Support',
    icon: Apple,
    iconBg: '#6366F120',
    iconColor: '#818CF8',
    filename: 'smart-reply-ios-unsigned.ipa',
    size: '~30 MB',
    specs: 'iOS 14+ • AltStore / Sideloadly',
    description: 'Includes UNNotificationAction smart reply categories mirrored dynamically to Apple Watch.',
    url: 'https://github.com/mahmud-r-farhan/smart-reply-ai/releases/download/v1.1.0/smart-reply-ios-unsigned.ipa'
  },
  {
    platform: 'Static Web Bundle',
    tag: 'Deploy Anywhere',
    icon: Globe,
    iconBg: '#10B98120',
    iconColor: '#34D399',
    filename: 'smart-reply-web.zip',
    size: '~15 MB',
    specs: 'Static HTML/JS • Vercel / Netlify',
    description: 'Ready-to-host web bundle for deploying to any static web server or CDN with zero build steps.',
    url: 'https://github.com/mahmud-r-farhan/smart-reply-ai/releases/download/v1.1.0/smart-reply-web.zip'
  }
];

export default function DownloadSection() {
  return (
    <section id="download" className="downloads-section">
      <div className="container">
        <div className="section-header">
          <span className="section-tag" style={{ color: '#3B82F6' }}>Official v1.1.0 Releases</span>
          <h2 className="section-title">Download Smart Reply AI for Your Device</h2>
          <p className="section-subtitle">
            Pre-compiled, digitally signed packages for all desktop, mobile, browser, and wearable platforms.
            No developer setup or compilers needed.
          </p>
        </div>

        <div className="downloads-grid">
          {DOWNLOAD_ITEMS.map((item, idx) => {
            const IconComponent = item.icon;
            return (
              <div key={idx} className="download-card">
                <div>
                  <div className="download-header">
                    <div className="download-icon" style={{ background: item.iconBg, color: item.iconColor }}>
                      <IconComponent size={22} />
                    </div>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: '#F8FAFC' }}>
                        {item.platform}
                      </div>
                      <span style={{ fontSize: '11px', color: item.iconColor, fontWeight: 600 }}>
                        {item.tag}
                      </span>
                    </div>
                  </div>

                  <div className="download-meta">
                    <strong>{item.filename}</strong> • {item.size}<br />
                    <span>{item.specs}</span>
                  </div>

                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: 1.5 }}>
                    {item.description}
                  </p>
                </div>

                <a
                  href={item.url}
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                >
                  <Download size={16} />
                  <span>Download {item.filename.split('.').pop().toUpperCase()}</span>
                </a>
              </div>
            );
          })}
        </div>

        {/* GitHub Releases Link & Checksum verification */}
        <div style={{ textAlign: 'center', marginTop: '48px', padding: '24px', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
            🔒 All binaries are cryptographically signed with SHA-256 checksums in <code>SHA256SUMS.txt</code>.
          </div>
          <a
            href="https://github.com/mahmud-r-farhan/smart-reply-ai/releases/tag/v1.1.0"
            target="_blank"
            rel="noreferrer"
            className="btn btn-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <span>View Full GitHub Release Notes (v1.1.0)</span>
            <ExternalLink size={14} />
          </a>
        </div>
      </div>
    </section>
  );
}
