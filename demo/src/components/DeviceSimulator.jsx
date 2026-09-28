import React, { useState } from 'react';
import { Watch, Smartphone, Monitor, Globe, CheckCircle, Send, Sparkles, MessageSquare, Terminal } from 'lucide-react';

const WATCH_PRESETS = [
  {
    sender: 'Alex Mercer',
    app: 'WhatsApp',
    message: 'Hey! Are we still syncing up for coffee at 3 PM?',
    replies: ['Sounds great, see you at 3! ☕', 'Can we push to 3:30 PM?', 'Need to reschedule today.']
  },
  {
    sender: 'Dev Lead (Slack)',
    app: 'Slack',
    message: 'Can you review the PR for the auth microservice?',
    replies: ['On it right now! 🚀', 'Reviewing in 15 mins.', 'Will check after lunch.']
  },
  {
    sender: 'Elena Rostova',
    app: 'Telegram',
    message: 'Did the production release build pass the tests?',
    replies: ['All green, v1.1.0 published! ✅', 'Running final checks now.', 'Checking GitHub Actions.']
  }
];

export default function DeviceSimulator() {
  const [activeDevice, setActiveDevice] = useState('watch');
  const [watchIndex, setWatchIndex] = useState(0);
  const [watchStatus, setWatchStatus] = useState(null);

  // Phone states
  const [phoneMessage, setPhoneMessage] = useState('Can you send the contract draft by EOD?');
  const [phoneReply, setPhoneReply] = useState('');
  const [phoneSent, setPhoneSent] = useState(false);

  // Desktop states
  const [desktopSelected, setDesktopSelected] = useState(null);
  const [desktopCopied, setDesktopCopied] = useState(false);

  const handleWatchReply = (reply) => {
    setWatchStatus(reply);
    setTimeout(() => {
      setWatchStatus(null);
    }, 3000);
  };

  const handlePhoneSend = (text) => {
    setPhoneReply(text);
    setPhoneSent(true);
    setTimeout(() => setPhoneSent(false), 2500);
  };

  const handleDesktopInsert = (text) => {
    setDesktopSelected(text);
    setDesktopCopied(true);
    setTimeout(() => setDesktopCopied(false), 2500);
  };

  return (
    <section id="devices" className="devices-section">
      <div className="container">
        <div className="section-header">
          <span className="section-tag">Interactive Device Showcase</span>
          <h2 className="section-title">See How It Works on Every Platform</h2>
          <p className="section-subtitle">
            Switch between devices to experience real-time smart reply suggestion pills,
            watch Bluetooth dispatching, desktop SendInput auto-paste, and mobile widgets.
          </p>
        </div>

        {/* Device Switcher Tabs */}
        <div className="device-tabs">
          <button
            className={`device-tab-btn ${activeDevice === 'watch' ? 'active' : ''}`}
            onClick={() => setActiveDevice('watch')}
          >
            <Watch size={18} />
            <span>Smartwatch (Wear OS &amp; Apple Watch)</span>
          </button>

          <button
            className={`device-tab-btn ${activeDevice === 'phone' ? 'active' : ''}`}
            onClick={() => setActiveDevice('phone')}
          >
            <Smartphone size={18} />
            <span>Smartphone (Android &amp; HarmonyOS)</span>
          </button>

          <button
            className={`device-tab-btn ${activeDevice === 'desktop' ? 'active' : ''}`}
            onClick={() => setActiveDevice('desktop')}
          >
            <Monitor size={18} />
            <span>Desktop (Win32 Native C++)</span>
          </button>

          <button
            className={`device-tab-btn ${activeDevice === 'web' ? 'active' : ''}`}
            onClick={() => setActiveDevice('web')}
          >
            <Globe size={18} />
            <span>Web Client &amp; Chrome Extension</span>
          </button>
        </div>

        {/* 1. Smartwatch Demo View */}
        {activeDevice === 'watch' && (
          <div className="simulator-layout">
            <div className="smartwatch-wrapper">
              <div className="smartwatch-case">
                <div className="smartwatch-crown"></div>
                <div className="smartwatch-screen">
                  {watchStatus ? (
                    <div style={{ animation: 'slideUp 0.3s ease' }}>
                      <CheckCircle size={36} color="#10B981" style={{ margin: '0 auto 8px' }} />
                      <div style={{ fontSize: '11px', color: '#34D399', fontWeight: 600 }}>REPLY SENT VIA PHONE!</div>
                      <div style={{ fontSize: '12px', color: '#F8FAFC', marginTop: '6px', fontWeight: 500 }}>
                        "{watchStatus}"
                      </div>
                      <div style={{ fontSize: '10px', color: '#94A3B8', marginTop: '6px' }}>
                        ⚡ Latency: 0.8ms (On-Device)
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="watch-sender">
                        {WATCH_PRESETS[watchIndex].app} • {WATCH_PRESETS[watchIndex].sender}
                      </div>
                      <div className="watch-message">
                        "{WATCH_PRESETS[watchIndex].message}"
                      </div>
                      <div className="watch-pill-stack">
                        {WATCH_PRESETS[watchIndex].replies.map((reply, idx) => (
                          <button
                            key={idx}
                            className="watch-pill"
                            onClick={() => handleWatchReply(reply)}
                            title="Tap to send this smart reply from your watch"
                          >
                            {reply}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="glass-card" style={{ padding: '32px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 12px', background: 'rgba(99,102,241,0.15)', borderRadius: '20px', color: '#A5B4FC', fontSize: '12px', fontWeight: 600, marginBottom: '16px' }}>
                <Watch size={14} />
                <span>Wear OS &amp; Apple Watch Native Bridge</span>
              </div>
              <h3 style={{ fontSize: '24px', marginBottom: '12px' }}>Interactive Smart Reply Pills on Your Wrist</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginBottom: '20px', lineHeight: 1.6 }}>
                When your phone receives a chat message, Android's <code>NotificationListenerService</code> intercepts it,
                computes on-device heuristic suggestions in <strong>&lt; 1ms</strong>, and pushes a notification with
                <code>NotificationCompat.WearableExtender</code> choices directly to your smartwatch.
              </p>

              <div style={{ marginBottom: '20px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                  Simulate Different Incoming Messages:
                </span>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {WATCH_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      className="preset-chip"
                      style={{ background: watchIndex === idx ? 'rgba(99,102,241,0.25)' : '', borderColor: watchIndex === idx ? 'var(--accent-indigo)' : '' }}
                      onClick={() => setWatchIndex(idx)}
                    >
                      {preset.app}: {preset.sender.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ background: '#0B0F19', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-subtle)', fontSize: '13px' }}>
                <div style={{ color: '#10B981', fontWeight: 600, marginBottom: '4px' }}>✓ 100% Zero-Latency &amp; Offline</div>
                <div style={{ color: 'var(--text-secondary)' }}>
                  No companion watch APK required. Uses native Wear OS RemoteInput pills and Apple watchOS UNNotificationAction mirroring.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. Smartphone Demo View */}
        {activeDevice === 'phone' && (
          <div className="simulator-layout">
            <div className="phone-case">
              <div className="phone-notch"></div>
              <div className="phone-screen">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '13px' }}>EM</div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600 }}>Emma Watson</div>
                      <div style={{ fontSize: '10px', color: '#10B981' }}>Online</div>
                    </div>
                  </div>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>14:32</span>
                </div>

                <div style={{ flex: 1, padding: '16px 0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {/* Incoming bubble */}
                  <div style={{ alignSelf: 'flex-start', background: '#1E293B', padding: '10px 14px', borderRadius: '14px', borderTopLeftRadius: '2px', maxWidth: '85%', fontSize: '13px' }}>
                    {phoneMessage}
                  </div>

                  {/* Outgoing bubble if sent */}
                  {phoneReply && (
                    <div style={{ alignSelf: 'flex-end', background: 'linear-gradient(135deg, #2563EB, #4F46E5)', padding: '10px 14px', borderRadius: '14px', borderTopRightRadius: '2px', maxWidth: '85%', fontSize: '13px', color: '#FFFFFF' }}>
                      {phoneReply}
                    </div>
                  )}
                </div>

                {/* Smart Suggestion Chips */}
                <div style={{ marginBottom: '10px' }}>
                  <div style={{ fontSize: '11px', color: '#93C5FD', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                    <Sparkles size={12} />
                    <span>Instant Smart Suggestions:</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {[
                      'Yes, I will email the draft before 5 PM! 📄',
                      'Working on the final edits now, sending soon.',
                      'Could you extend the deadline to tomorrow morning?'
                    ].map((sugg, i) => (
                      <button
                        key={i}
                        onClick={() => handlePhoneSend(sugg)}
                        style={{ textAlign: 'left', background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.35)', color: '#DBEAFE', padding: '6px 10px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer' }}
                      >
                        {sugg}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Input bar */}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="text"
                    placeholder="Type message..."
                    value={phoneReply}
                    onChange={(e) => setPhoneReply(e.target.value)}
                    style={{ flex: 1, background: '#0B0F19', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 12px', borderRadius: '20px', color: '#FFF', fontSize: '12px', outline: 'none' }}
                  />
                  <button
                    onClick={() => phoneReply && setPhoneSent(true)}
                    style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#3B82F6', border: 'none', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                  >
                    <Send size={14} />
                  </button>
                </div>
              </div>
            </div>

            <div className="glass-card" style={{ padding: '32px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 12px', background: 'rgba(16,185,129,0.15)', borderRadius: '20px', color: '#34D399', fontSize: '12px', fontWeight: 600, marginBottom: '16px' }}>
                <Smartphone size={14} />
                <span>Android &amp; HarmonyOS Experience</span>
              </div>
              <h3 style={{ fontSize: '24px', marginBottom: '12px' }}>Instant Replies in Any Messaging App</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginBottom: '20px', lineHeight: 1.6 }}>
                Whether you use WhatsApp, Telegram, Google Messages, SMS, or Slack, Smart Reply AI suggests context-aware,
                grammatically flawless replies in your favorite tone with single-tap insertion.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <span style={{ color: '#10B981', fontWeight: 700 }}>•</span>
                  <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}><strong>7 Tailored Tones:</strong> Professional, Friendly, Casual, Concise, Formal, Flirty, and Romantic.</span>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <span style={{ color: '#3B82F6', fontWeight: 700 }}>•</span>
                  <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}><strong>Pure HarmonyOS &amp; Android:</strong> Runs 100% offline without needing Google Play Services.</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <a href="#download" className="btn btn-primary">Download Android APK</a>
                <a href="#download" className="btn btn-secondary">Get HarmonyOS Bundle</a>
              </div>
            </div>
          </div>
        )}

        {/* 3. Desktop Native Win32 C++ Demo */}
        {activeDevice === 'desktop' && (
          <div className="simulator-layout">
            <div className="desktop-monitor">
              <div className="desktop-header-bar">
                <div className="window-dots">
                  <div className="window-dot dot-red"></div>
                  <div className="window-dot dot-yellow"></div>
                  <div className="window-dot dot-green"></div>
                </div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Slack • #engineering-sync</span>
                <span style={{ fontSize: '11px', background: '#334155', padding: '2px 8px', borderRadius: '4px' }}>Ctrl + Shift + R</span>
              </div>

              {/* Mock active conversation */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#93C5FD' }}>Jordan Peterson (Tech Lead)</div>
                <div style={{ fontSize: '14px', color: '#E2E8F0', marginTop: '4px' }}>
                  "Team, the high-throughput test is starting in 10 minutes. Is everyone ready with their endpoints?"
                </div>
              </div>

              {/* Floating Pill Window */}
              <div className="floating-pill-window">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#A5B4FC', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Sparkles size={14} />
                    <span>Smart Reply AI Floating Assistant</span>
                  </span>
                  <span style={{ fontSize: '10px', background: 'rgba(16,185,129,0.2)', color: '#34D399', padding: '2px 6px', borderRadius: '4px' }}>
                    ⚡ 0.6ms Win32 GDI+
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[
                    'All endpoints verified and ready for testing! 🚀',
                    'Endpoints are active and monitored in Grafana.',
                    'Just warming up the caches, ready in 2 mins.'
                  ].map((sugg, i) => (
                    <button
                      key={i}
                      onClick={() => handleDesktopInsert(sugg)}
                      style={{ textAlign: 'left', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#F8FAFC', padding: '8px 12px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s' }}
                      title="Click to simulate SendInput auto-paste into active app"
                    >
                      {sugg}
                    </button>
                  ))}
                </div>

                {desktopCopied && (
                  <div style={{ marginTop: '10px', fontSize: '12px', color: '#34D399', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle size={14} />
                    <span>Auto-pasted into Slack via native SendInput!</span>
                  </div>
                )}
              </div>
            </div>

            <div className="glass-card" style={{ padding: '32px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 12px', background: 'rgba(59,130,246,0.15)', borderRadius: '20px', color: '#60A5FA', fontSize: '12px', fontWeight: 600, marginBottom: '16px' }}>
                <Terminal size={14} />
                <span>Zero-Install Win32 C++ Architecture</span>
              </div>
              <h3 style={{ fontSize: '24px', marginBottom: '12px' }}>Standalone &lt; 2MB Windows Assistant</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginBottom: '20px', lineHeight: 1.6 }}>
                Compiled as a single standalone executable (<code>SmartReplyAI-standalone.exe</code>).
                Press <kbd style={{ background: '#334155', padding: '2px 6px', borderRadius: '4px', fontSize: '13px' }}>Ctrl + Shift + R</kbd> anywhere
                in Windows to display an ultra-fast floating pill next to your mouse and auto-paste directly into your active window.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', gap: '8px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                  <span style={{ color: '#10B981' }}>✓</span>
                  <span>Zero runtime dependencies — no Node.js or Python required</span>
                </div>
                <div style={{ display: 'flex', gap: '8px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                  <span style={{ color: '#10B981' }}>✓</span>
                  <span>Direct auto-paste into Slack, Outlook, Word, Discord, WhatsApp, Chrome</span>
                </div>
                <div style={{ display: 'flex', gap: '8px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                  <span style={{ color: '#10B981' }}>✓</span>
                  <span>System Tray resident with minimal RAM footprint (&lt; 15MB)</span>
                </div>
              </div>

              <a href="https://github.com/mahmud-r-farhan/smart-reply-ai/releases/download/v1.1.0/SmartReplyAI-standalone.exe" className="btn btn-primary">
                Download SmartReplyAI-standalone.exe (&lt; 2MB)
              </a>
            </div>
          </div>
        )}

        {/* 4. Web & Chrome Extension Demo */}
        {activeDevice === 'web' && (
          <div className="simulator-layout">
            <div className="desktop-monitor">
              <div className="desktop-header-bar">
                <div className="window-dots">
                  <div className="window-dot dot-red"></div>
                  <div className="window-dot dot-yellow"></div>
                  <div className="window-dot dot-green"></div>
                </div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>mail.google.com — Compose Reply</span>
                <span style={{ fontSize: '11px', background: '#334155', padding: '2px 8px', borderRadius: '4px' }}>Manifest V3</span>
              </div>

              <div style={{ padding: '16px', background: '#0F172A', borderRadius: '12px', border: '1px solid var(--border-subtle)', minHeight: '220px' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>From: client@enterprise.com</div>
                <div style={{ fontSize: '13px', color: '#CBD5E1', marginBottom: '16px' }}>
                  "Could you provide an updated price breakdown for the enterprise annual license?"
                </div>

                <div style={{ background: '#1E293B', padding: '14px', borderRadius: '10px', border: '1px solid rgba(99,102,241,0.4)', position: 'relative' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#A5B4FC', fontWeight: 600, marginBottom: '8px' }}>
                    <Sparkles size={14} />
                    <span>Chrome Extension Auto-Suggest</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <button
                      onClick={() => alert('Inserted directly into active text area!')}
                      style={{ textAlign: 'left', background: 'rgba(255,255,255,0.05)', border: 'none', color: '#F8FAFC', padding: '6px 10px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}
                    >
                      "I'll prepare the updated enterprise breakdown and share the PDF shortly."
                    </button>
                    <button
                      onClick={() => alert('Inserted directly into active text area!')}
                      style={{ textAlign: 'left', background: 'rgba(255,255,255,0.05)', border: 'none', color: '#F8FAFC', padding: '6px 10px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}
                    >
                      "Please find our tiered enterprise volume pricing attached."
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-card" style={{ padding: '32px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 12px', background: 'rgba(236,72,153,0.15)', borderRadius: '20px', color: '#F472B6', fontSize: '12px', fontWeight: 600, marginBottom: '16px' }}>
                <Globe size={14} />
                <span>Web Client &amp; Chromium Extension</span>
              </div>
              <h3 style={{ fontSize: '24px', marginBottom: '12px' }}>One Extension for All Web Messaging</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginBottom: '20px', lineHeight: 1.6 }}>
                Install the Manifest V3 browser extension on Chrome, Brave, or Microsoft Edge.
                Highlight any message in Gmail, Outlook Web, LinkedIn, Twitter, or Zendesk,
                and instantly paste AI suggestions into any input field.
              </p>

              <div style={{ display: 'flex', gap: '12px' }}>
                <a href="https://github.com/mahmud-r-farhan/smart-reply-ai/releases/download/v1.1.0/smart-reply-chrome-extension.zip" className="btn btn-primary">
                  Download Chrome Extension (.zip)
                </a>
                <a href="https://smart-reply-delta.vercel.app" target="_blank" rel="noreferrer" className="btn btn-secondary">
                  Launch Web App
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
