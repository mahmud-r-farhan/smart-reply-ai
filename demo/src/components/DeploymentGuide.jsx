import React, { useState } from 'react';
import { Cloud, Terminal, Check, Copy, ExternalLink, ShieldCheck, HeartPulse, Server } from 'lucide-react';

export default function DeploymentGuide() {
  const [activeTab, setActiveTab] = useState('render');
  const [copiedKey, setCopiedKey] = useState(null);

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const RENDER_ENV = `# Smart Reply Backend Environment Configuration
NODE_ENV=production
PORT=10000                # Render provides $PORT automatically
TRUST_PROXY=1             # Render terminates TLS in front of your service

# Universal OpenAI-compatible cloud LLM provider (any of Groq/OpenRouter/OpenAI)
OPENROUTER_API_KEY=sk-or-v1-your_openrouter_key
LLM_BASE_URL=https://openrouter.ai/api/v1
# Optional local model server:
# LLM_BASE_URL=http://127.0.0.1:11434/v1

# Caching, singleflight & rate limiting
CACHE_TTL_MS=600000
CACHE_MAX_ENTRIES=5000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=60
`;

  const DOCKER_COMPOSE_SNIPPET = `# Production stack: Nginx load balancer + scaled backend + Redis L2 cache
services:
  load_balancer:
    image: nginx:alpine
    ports:
      - "5006:80"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      backend:
        condition: service_healthy

  backend:
    build: ./backend
    restart: always
    environment:
      - PORT=5006
      - NODE_ENV=production
      - TRUST_PROXY=1
      - WORKERS=2
      - OPENROUTER_API_KEY=\${OPENROUTER_API_KEY}
      - REDIS_URL=redis://cache:6379
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5006/health"]
      interval: 15s
      timeout: 5s
      retries: 3
    depends_on:
      cache:
        condition: service_healthy

  cache:
    image: redis:7-alpine
    command: redis-server --maxmemory 256mb --maxmemory-policy allkeys-lru
`;

  return (
    <section id="deployment" className="deployment-section">
      <div className="container">
        <div className="section-header">
          <span className="section-tag" style={{ color: '#06B6D4' }}>Visual Deployment Guide</span>
          <h2 className="section-title">How to Deploy the Backend in Under 3 Minutes</h2>
          <p className="section-subtitle">
            Deploy the Smart Reply universal microservice to <strong>Render</strong>,
            Docker containers, or any VPS with health checks, auto-clustering, and zero-downtime restarts.
          </p>
        </div>

        {/* Deployment Tabs */}
        <div className="deploy-tabs" style={{ justifyContent: 'center' }}>
          <button
            className={`deploy-tab ${activeTab === 'render' ? 'active' : ''}`}
            onClick={() => setActiveTab('render')}
          >
            🚀 Render (Web Service)
          </button>
          <button
            className={`deploy-tab ${activeTab === 'docker' ? 'active' : ''}`}
            onClick={() => setActiveTab('docker')}
          >
            🐳 Docker &amp; Docker Compose
          </button>
          <button
            className={`deploy-tab ${activeTab === 'vps' ? 'active' : ''}`}
            onClick={() => setActiveTab('vps')}
          >
            ☁️ VPS &amp; Nginx (Ubuntu)
          </button>
        </div>

        <div className="glass-card" style={{ padding: '36px' }}>
          {/* 1. Render Deployment Tab */}
          {activeTab === 'render' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '28px' }}>
                <div style={{ background: '#0B0F19', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '12px', color: '#06B6D4', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>
                    Step 1: Service Settings
                  </div>
                  <div style={{ fontSize: '14px', color: '#F8FAFC', lineHeight: 1.6 }}>
                    • <strong>Root Directory:</strong> <code>backend</code><br />
                    • <strong>Runtime:</strong> <code>Node</code><br />
                    • <strong>Build Command:</strong> <code>npm install</code><br />
                    • <strong>Start Command:</strong> <code>npm run start:cluster</code>
                  </div>
                </div>

                <div style={{ background: '#0B0F19', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '12px', color: '#10B981', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>
                    Step 2: Zero-Downtime Health Check
                  </div>
                  <div style={{ fontSize: '14px', color: '#F8FAFC', lineHeight: 1.6 }}>
                    • <strong>Health Check Path:</strong> <code>/health</code><br />
                    • Returns live CPU usage, uptime, worker PID, and cache metrics.<br />
                    • Render will only route traffic when healthy!
                  </div>
                </div>
              </div>

              {/* Render Environment Variables Box */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: '#F8FAFC' }}>
                    Copyable Production Environment Variables (.env):
                  </span>
                  <button
                    className="btn btn-secondary"
                    style={{ padding: '6px 12px', fontSize: '12px' }}
                    onClick={() => copyToClipboard(RENDER_ENV, 'render-env')}
                  >
                    {copiedKey === 'render-env' ? <Check size={14} color="#10B981" /> : <Copy size={14} />}
                    <span>{copiedKey === 'render-env' ? 'Copied to Clipboard!' : 'Copy .env Config'}</span>
                  </button>
                </div>

                <div className="code-block-container">
                  <pre><code>{RENDER_ENV}</code></pre>
                </div>
              </div>
            </div>
          )}

          {/* 2. Docker Compose Tab */}
          {activeTab === 'docker' && (
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginBottom: '20px' }}>
                Run the whole enterprise cluster with Nginx SSL reverse proxy and in-memory singleflight deduplication with a single command:
              </p>

              <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                <div style={{ background: '#0B0F19', padding: '12px 18px', borderRadius: '8px', border: '1px solid var(--border-subtle)', fontFamily: 'var(--font-mono)', fontSize: '14px', color: '#34D399', flex: 1 }}>
                  docker compose up -d --build
                </div>
                <button
                  className="btn btn-secondary"
                  onClick={() => copyToClipboard('docker compose up -d --build', 'docker-cmd')}
                >
                  {copiedKey === 'docker-cmd' ? <Check size={14} color="#10B981" /> : <Copy size={14} />}
                </button>
              </div>

              <div className="code-block-container">
                <button
                  className="copy-code-btn"
                  onClick={() => copyToClipboard(DOCKER_COMPOSE_SNIPPET, 'docker-snippet')}
                >
                  {copiedKey === 'docker-snippet' ? 'Copied!' : 'Copy YAML'}
                </button>
                <pre><code>{DOCKER_COMPOSE_SNIPPET}</code></pre>
              </div>
            </div>
          )}

          {/* 3. VPS & Nginx Tab */}
          {activeTab === 'vps' && (
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginBottom: '20px' }}>
                Deploy on Ubuntu / Debian using PM2 process manager and Nginx reverse proxy:
              </p>

              <div className="code-block-container">
                <pre><code>{`# 1. Clone repository
git clone https://github.com/mahmud-r-farhan/smart-reply-ai.git
cd smart-reply-ai/backend

# 2. Install dependencies
npm install --production

# 3. Start cluster with PM2 across all CPU cores
npm install -g pm2
pm2 start cluster.js --name "smart-reply-backend" -i max
pm2 save
pm2 startup

# 4. Verify cluster health
curl -s http://localhost:5000/health | jq .`}</code></pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
