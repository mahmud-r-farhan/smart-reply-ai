import React from 'react';
import { Download, Sparkles, Watch, Cpu, ShieldCheck, Zap, Layers } from 'lucide-react';

export default function Hero() {
  return (
    <section className="hero">
      <div className="container">
        <div className="hero-pill">
          <Sparkles size={14} />
          <span>New in v1.1.0: Wear OS, Apple Watch & Native HarmonyOS Support</span>
        </div>

        <h1 className="hero-title">
          Universal Smart Reply <span className="gradient-text">for Every Screen & Wrist</span>
        </h1>

        <p className="hero-subtitle">
          Experience zero-latency on-device intelligence (&lt; 1ms) and universal cloud LLM orchestration.
          From smartwatches to native Windows desktops, Android, iOS, and Web — draft perfect responses anywhere.
        </p>

        <div className="hero-cta-group">
          <a
            href="https://github.com/mahmud-r-farhan/smart-reply-ai/releases/tag/v1.1.0"
            target="_blank"
            rel="noreferrer"
            className="btn btn-primary"
            style={{ padding: '14px 28px', fontSize: '15px' }}
          >
            <Download size={18} />
            <span>Download All Platforms (v1.1.0)</span>
          </a>

          <a
            href="#devices"
            className="btn btn-secondary"
            style={{ padding: '14px 24px', fontSize: '15px' }}
          >
            <Watch size={18} />
            <span>Try Interactive Watch & Device Demos</span>
          </a>
        </div>

        <div className="hero-badges-row">
          <div className="hero-badge-item">
            <Zap size={16} color="#10B981" />
            <span>&lt; 1ms On-Device Heuristics</span>
          </div>
          <div className="hero-badge-item">
            <ShieldCheck size={16} color="#3B82F6" />
            <span>100% Offline &amp; Private</span>
          </div>
          <div className="hero-badge-item">
            <Watch size={16} color="#8B5CF6" />
            <span>Wear OS &amp; Apple Watch Pills</span>
          </div>
          <div className="hero-badge-item">
            <Layers size={16} color="#EC4899" />
            <span>9 Universal Platforms</span>
          </div>
        </div>
      </div>
    </section>
  );
}
