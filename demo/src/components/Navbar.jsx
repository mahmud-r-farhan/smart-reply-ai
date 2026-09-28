import React from 'react';
import { Download, Sparkles, Github } from 'lucide-react';

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="container nav-wrapper">
        <a href="#" className="logo-group">
          <div className="logo-badge">⚡</div>
          <span className="logo-title">Smart Reply AI</span>
          <span className="logo-tag">v1.1.0</span>
        </a>

        <ul className="nav-links">
          <li><a href="#devices" className="nav-link">Devices & Watch</a></li>
          <li><a href="#benchmark" className="nav-link">Offline Benchmark</a></li>
          <li><a href="#scaling" className="nav-link">Scaling & Singleflight</a></li>
          <li><a href="#deployment" className="nav-link">Deploy Backend</a></li>
          <li><a href="#download" className="nav-link">Download</a></li>
        </ul>

        <div className="nav-actions">
          <a
            href="https://github.com/mahmud-r-farhan/smart-reply-ai"
            target="_blank"
            rel="noreferrer"
            className="btn btn-secondary"
            title="GitHub Repository"
          >
            <Github size={16} />
            <span>GitHub</span>
          </a>

          <a
            href="https://github.com/mahmud-r-farhan/smart-reply-ai/releases/tag/v1.1.0"
            target="_blank"
            rel="noreferrer"
            className="btn btn-primary"
          >
            <Download size={16} />
            <span>Get v1.1.0</span>
          </a>
        </div>
      </div>
    </nav>
  );
}
