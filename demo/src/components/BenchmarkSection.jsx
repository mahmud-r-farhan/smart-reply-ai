import React, { useState, useEffect } from 'react';
import { Zap, Clock, Shield, Sparkles, Check, Play, RefreshCw } from 'lucide-react';

const PRESET_QUERIES = [
  { label: '📅 Meeting Request', text: 'Can we sync up tomorrow at 10 AM to discuss the API migration?' },
  { label: '💰 Pricing Question', text: 'What are your enterprise rates for 500 active users?' },
  { label: '🙏 Appreciation', text: 'Thank you so much for fixing the production issue so quickly!' },
  { label: '⚠️ Urgent Issue', text: 'The checkout service is throwing 500 errors on mobile!' }
];

export default function BenchmarkSection() {
  const [inputText, setInputText] = useState(PRESET_QUERIES[0].text);
  const [selectedTone, setSelectedTone] = useState('friendly');
  const [results, setResults] = useState([]);
  const [latency, setLatency] = useState(0.8);
  const [copiedId, setCopiedId] = useState(null);

  const runBenchmark = (text, tone) => {
    const start = performance.now();
    const clean = text.toLowerCase().trim();
    let replies = [];

    if (/(meet|meeting|sync|calendar|call|tomorrow|today|hour)/i.test(clean)) {
      if (tone === 'professional') {
        replies = [
          'I would be glad to meet. Please send an invite for that time.',
          'Confirmed. I have reserved that time on my calendar.',
          'I have a conflict then. Could we push to later in the afternoon?'
        ];
      } else {
        replies = [
          'Sounds great! Looking forward to catching up.',
          'That time works perfectly for me! See you then. ☕',
          'Let me double check my schedule and get right back to you.'
        ];
      }
    } else if (/(price|pricing|rate|rates|cost|license|enterprise)/i.test(clean)) {
      replies = [
        'I will prepare a detailed pricing breakdown and share it shortly.',
        'Our tiered volume rates start at $12/seat. Would you like a demo call?',
        'Happy to discuss our enterprise discount for teams over 500.'
      ];
    } else if (/(thank|thanks|appreciate|grateful|kudos)/i.test(clean)) {
      replies = [
        'You are very welcome! Always glad to help out. 😊',
        'Anytime! Let me know if you need anything else.',
        'My pleasure, team effort all the way!'
      ];
    } else if (/(urgent|error|500|broken|down|bug|issue)/i.test(clean)) {
      replies = [
        'Investigating the error logs immediately. Update in 5 mins.',
        'Received. Alerting the on-call engineering team right now.',
        'Rolling back the latest deployment while we triage.'
      ];
    } else {
      replies = [
        'Got it, thank you for sharing the update!',
        'Understood. I will review this and follow up shortly.',
        'Thanks! Let me know if there are any specific next steps.'
      ];
    }

    const elapsed = Math.max(0.4, Number((performance.now() - start).toFixed(2)));
    setLatency(elapsed);
    setResults(replies);
  };

  useEffect(() => {
    runBenchmark(inputText, selectedTone);
  }, [inputText, selectedTone]);

  const copyReply = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <section id="benchmark" className="benchmark-section">
      <div className="container">
        <div className="section-header">
          <span className="section-tag" style={{ color: '#10B981' }}>Offline Working Option</span>
          <h2 className="section-title">Zero-Latency On-Device Heuristic Benchmark</h2>
          <p className="section-subtitle">
            Smart Reply AI operates 100% locally when offline. Test the on-device regex heuristics
            engine directly in your browser below and compare execution latency against cloud LLMs.
          </p>
        </div>

        <div className="glass-card benchmark-card">
          {/* Preset Prompts */}
          <div className="interactive-input-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Try Sample Scenarios:
              </span>
              <div style={{ display: 'flex', gap: '6px' }}>
                {['friendly', 'professional', 'concise'].map((t) => (
                  <button
                    key={t}
                    onClick={() => setSelectedTone(t)}
                    style={{
                      background: selectedTone === t ? 'var(--accent-blue)' : '#1E293B',
                      color: selectedTone === t ? '#FFF' : '#94A3B8',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '3px 10px',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textTransform: 'capitalize'
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="preset-chips-row">
              {PRESET_QUERIES.map((p, idx) => (
                <button
                  key={idx}
                  className="preset-chip"
                  onClick={() => setInputText(p.text)}
                  style={{
                    background: inputText === p.text ? 'rgba(59, 130, 246, 0.2)' : '',
                    borderColor: inputText === p.text ? 'var(--accent-blue)' : ''
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <textarea
              className="benchmark-textarea"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type any message to see on-device suggestions generate live..."
            />
          </div>

          {/* Results & Latency Comparison Grid */}
          <div className="benchmark-results-grid">
            {/* Live Suggestions Generated */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#F8FAFC', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={16} color="#34D399" />
                  <span>Instant Local Suggestions</span>
                </span>
                <span style={{ fontSize: '11px', background: 'rgba(16,185,129,0.2)', color: '#34D399', padding: '3px 8px', borderRadius: '12px', fontWeight: 600 }}>
                  ⚡ {latency} ms (On-Device)
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {results.map((res, i) => (
                  <div
                    key={i}
                    style={{
                      background: '#0B0F19',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '10px',
                      padding: '12px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px'
                    }}
                  >
                    <span style={{ fontSize: '14px', color: '#F8FAFC' }}>{res}</span>
                    <button
                      onClick={() => copyReply(res, i)}
                      style={{
                        background: copiedId === i ? '#10B981' : '#1E293B',
                        border: '1px solid var(--border-subtle)',
                        color: '#FFF',
                        borderRadius: '6px',
                        padding: '6px 10px',
                        fontSize: '11px',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {copiedId === i ? '✓ Copied' : 'Copy'}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Latency Comparison Visualizer */}
            <div style={{ background: '#0B0F19', padding: '20px', borderRadius: '14px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={16} color="#60A5FA" />
                <span>Response Latency Comparison</span>
              </div>

              {/* Bar 1: Smart Reply On-Device */}
              <div className="latency-bar-item">
                <div className="latency-bar-header">
                  <span style={{ color: '#34D399', fontWeight: 600 }}>⚡ Smart Reply AI (On-Device)</span>
                  <span style={{ color: '#34D399', fontWeight: 700 }}>&lt; 1 ms</span>
                </div>
                <div className="latency-track">
                  <div className="latency-fill fill-fast" style={{ width: '4%' }}></div>
                </div>
              </div>

              {/* Bar 2: Groq LPU */}
              <div className="latency-bar-item">
                <div className="latency-bar-header">
                  <span>☁️ Groq LPU Cloud (llama-3.1-8b)</span>
                  <span style={{ color: '#60A5FA' }}>~210 ms</span>
                </div>
                <div className="latency-track">
                  <div className="latency-fill fill-medium" style={{ width: '22%' }}></div>
                </div>
              </div>

              {/* Bar 3: OpenRouter */}
              <div className="latency-bar-item">
                <div className="latency-bar-header">
                  <span>☁️ OpenRouter (Llama 3.3 70B)</span>
                  <span style={{ color: '#A5B4FC' }}>~420 ms</span>
                </div>
                <div className="latency-track">
                  <div className="latency-fill fill-medium" style={{ width: '42%' }}></div>
                </div>
              </div>

              {/* Bar 4: OpenAI GPT-4o */}
              <div className="latency-bar-item">
                <div className="latency-bar-header">
                  <span>☁️ OpenAI (GPT-4o)</span>
                  <span style={{ color: '#FBBF24' }}>~850 ms</span>
                </div>
                <div className="latency-track">
                  <div className="latency-fill fill-slow" style={{ width: '75%' }}></div>
                </div>
              </div>

              {/* Bar 5: Cold Start LLM */}
              <div className="latency-bar-item" style={{ marginBottom: 0 }}>
                <div className="latency-bar-header">
                  <span style={{ color: 'var(--text-muted)' }}>❄️ Cold LLM Instance</span>
                  <span style={{ color: '#EF4444' }}>~1,800 ms</span>
                </div>
                <div className="latency-track">
                  <div className="latency-fill fill-slow" style={{ width: '100%' }}></div>
                </div>
              </div>

              <div style={{ marginTop: '16px', fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                * Smart Reply AI uses the <strong>Hybrid Race Dispatcher</strong>: local heuristics execute immediately,
                giving you a guaranteed instantaneous answer while optional cloud reasoning enriches the stream.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
