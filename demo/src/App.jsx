import React from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import DeviceSimulator from './components/DeviceSimulator';
import BenchmarkSection from './components/BenchmarkSection';
import ScalingVisualizer from './components/ScalingVisualizer';
import DeploymentGuide from './components/DeploymentGuide';
import DownloadSection from './components/DownloadSection';
import Footer from './components/Footer';

export default function App() {
  return (
    <div className="app-root">
      {/* Dynamic Ambient Background Glow Orbs */}
      <div className="bg-ambient-layer">
        <div className="glow-orb glow-orb-1"></div>
        <div className="glow-orb glow-orb-2"></div>
        <div className="glow-orb glow-orb-3"></div>
      </div>

      {/* Navigation */}
      <Navbar />

      {/* Hero Section */}
      <Hero />

      {/* Interactive Device & Smartwatch Simulator */}
      <DeviceSimulator />

      {/* Live On-Device Latency Benchmark */}
      <BenchmarkSection />

      {/* High-Concurrency Microservice Scaling Visualizer */}
      <ScalingVisualizer />

      {/* Visual Backend Deployment Guide (Render, Docker, VPS) */}
      <DeploymentGuide />

      {/* Official v1.1.0 Platform Downloads */}
      <DownloadSection />

      {/* Footer */}
      <Footer />
    </div>
  );
}
