import React from 'react';
import { Github, Heart, Shield } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-links">
          <a href="#devices" className="footer-link">Device Simulator</a>
          <a href="#benchmark" className="footer-link">Offline Benchmark</a>
          <a href="#scaling" className="footer-link">Backend Scaling</a>
          <a href="#deployment" className="footer-link">Deployment Guide</a>
          <a href="#download" className="footer-link">Downloads</a>
          <a href="https://github.com/mahmud-r-farhan/smart-reply-ai" target="_blank" rel="noreferrer" className="footer-link">GitHub Repository</a>
          <a href="https://github.com/mahmud-r-farhan/smart-reply-ai/blob/master/SMARTWATCH.md" target="_blank" rel="noreferrer" className="footer-link">Smartwatch Guide</a>
          <a href="https://github.com/mahmud-r-farhan/smart-reply-ai/blob/master/HUAWEI_HARMONYOS.md" target="_blank" rel="noreferrer" className="footer-link">HarmonyOS Guide</a>
        </div>

        <div className="footer-copy">
          Smart Reply AI Suite • Open-Source under MIT License • Released with v1.1.0 Multiplatform Distribution.
        </div>
      </div>
    </footer>
  );
}
