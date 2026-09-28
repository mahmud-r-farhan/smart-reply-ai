import React, { useState } from 'react';
import { Server, Cpu, Database, Activity, Shield, ArrowRight, Layers, DollarSign } from 'lucide-react';

export default function ScalingVisualizer() {
  const [concurrency, setConcurrency] = useState(2500);

  // Derived metrics based on our backend cluster & singleflight benchmarks
  const cacheHitPercent = Math.min(94, 75 + Math.log10(concurrency) * 5.2).toFixed(1);
  const totalCachedRps = Math.round(concurrency * (cacheHitPercent / 100));
  const rawLlmRps = concurrency - totalCachedRps;
  // Singleflight deduplicates concurrent in-flight calls:
  const singleflightCoalescedRps = Math.round(rawLlmRps * 0.12);
  const costSavedPerHour = ((totalCachedRps + (rawLlmRps - singleflightCoalescedRps)) * 3600 * 0.00008).toFixed(2);
  const p99Latency = (concurrency < 5000 ? 8 : concurrency < 20000 ? 14 : 22);

  return (
    <section id="scaling" className="scaling-section">
      <div className="container">
        <div className="section-header">
          <span className="section-tag" style={{ color: '#8B5CF6' }}>High-Concurrency Microservice</span>
          <h2 className="section-title">Backend Cluster &amp; Singleflight Scaling Visualizer</h2>
          <p className="section-subtitle">
            Experience how the multi-worker cluster, SHA-256 cache, and Singleflight coalescer
            protect your LLM endpoints from thundering herds during traffic spikes.
          </p>
        </div>

        {/* Interactive Slider Controller */}
        <div className="glass-card" style={{ padding: '32px', marginBottom: '36px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '15px', fontWeight: 700, color: '#F8FAFC' }}>
              Simulate Ingress Traffic Load:
            </span>
            <span style={{ fontSize: '20px', fontWeight: 800, color: 'var(--accent-indigo)', fontFamily: 'var(--font-display)' }}>
              {concurrency.toLocaleString()} req / sec
            </span>
          </div>

          <input
            type="range"
            min="100"
            max="50000"
            step="100"
            value={concurrency}
            onChange={(e) => setConcurrency(Number(e.target.value))}
            className="custom-range-slider"
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>
            <span>100 rps (Normal)</span>
            <span>10,000 rps (Traffic Surge)</span>
            <span>50,000 rps (Viral Spike)</span>
          </div>

          {/* Metrics Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '28px' }}>
            <div className="metrics-stat-card">
              <div style={{ fontSize: '12px', color: '#93C5FD', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Activity size={14} />
                <span>Ingress Requests</span>
              </div>
              <div className="metric-value" style={{ color: '#60A5FA' }}>
                {concurrency.toLocaleString()} <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>/s</span>
              </div>
            </div>

            <div className="metrics-stat-card">
              <div style={{ fontSize: '12px', color: '#34D399', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Database size={14} />
                <span>Cache Hit Ratio</span>
              </div>
              <div className="metric-value" style={{ color: '#10B981' }}>
                {cacheHitPercent}%
              </div>
            </div>

            <div className="metrics-stat-card">
              <div style={{ fontSize: '12px', color: '#C084FC', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Shield size={14} />
                <span>Singleflight Upstream</span>
              </div>
              <div className="metric-value" style={{ color: '#C084FC' }}>
                {singleflightCoalescedRps} <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>LLM calls</span>
              </div>
            </div>

            <div className="metrics-stat-card">
              <div style={{ fontSize: '12px', color: '#FBBF24', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <DollarSign size={14} />
                <span>Est. Cloud Savings</span>
              </div>
              <div className="metric-value" style={{ color: '#FBBF24' }}>
                ${costSavedPerHour} <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>/hr</span>
              </div>
            </div>
          </div>
        </div>

        {/* Visual Architecture Flow Diagram */}
        <div className="glass-card" style={{ padding: '32px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px', textAlign: 'center' }}>
            How Singleflight Coalescing &amp; Cluster Workers Defend Your Backend
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', alignItems: 'center' }}>
            {/* Box 1 */}
            <div style={{ background: '#0B0F19', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', color: '#60A5FA' }}>
                <Layers size={20} />
              </div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#F8FAFC' }}>1. Clients Ingress</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Web, Android, iOS, Windows, Wear OS ({concurrency} rps)
              </div>
            </div>

            {/* Box 2 */}
            <div style={{ background: '#0B0F19', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(139,92,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', color: '#A78BFA' }}>
                <Cpu size={20} />
              </div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#F8FAFC' }}>2. Worker Cluster</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Node.js Cluster cores load-balanced with zero master bottleneck
              </div>
            </div>

            {/* Box 3 */}
            <div style={{ background: '#0B0F19', padding: '20px', borderRadius: '12px', border: '1px solid rgba(16,185,129,0.4)', textAlign: 'center' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', color: '#34D399' }}>
                <Database size={20} />
              </div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#F8FAFC' }}>3. SHA-256 + Singleflight</div>
              <div style={{ fontSize: '12px', color: '#34D399', marginTop: '4px' }}>
                Deduplicates concurrent calls: only <strong>{singleflightCoalescedRps}</strong> hit LLM
              </div>
            </div>

            {/* Box 4 */}
            <div style={{ background: '#0B0F19', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(236,72,153,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', color: '#F472B6' }}>
                <Server size={20} />
              </div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#F8FAFC' }}>4. Upstream LLM</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Groq LPU / OpenRouter / Ollama protected from rate limits
              </div>
            </div>
          </div>

          <div style={{ marginTop: '24px', padding: '16px', background: 'rgba(99,102,241,0.08)', borderRadius: '10px', border: '1px solid rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <span style={{ fontSize: '13px', color: '#CBD5E1' }}>
              Want to deploy this high-concurrency microservice to production?
            </span>
            <a href="#deployment" className="btn btn-primary" style={{ padding: '8px 18px', fontSize: '13px' }}>
              View Visual Deployment Guide
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
