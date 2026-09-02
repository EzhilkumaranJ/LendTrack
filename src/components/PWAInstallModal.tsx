import React, { useState } from 'react';
import {
  X,
  Download,
  Smartphone,
  Tablet,
  CheckCircle2,
  Copy,
  ExternalLink,
  ShieldCheck,
  Zap,
  Layers,
  Sparkles,
  Info
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, isAndroid, isIOS, install } = usePWAInstall();
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [activeTab, setActiveTab] = useState<'instant' | 'apk'>('instant');

  if (!isOpen) return null;

  const appUrl = typeof window !== 'undefined' ? window.location.href : 'https://ai.studio';

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(appUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2500);
  };

  const handleDirectInstall = async () => {
    if (isInstallable) {
      await install();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        id="apk-download-modal"
        className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/95">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 font-bold">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-1.5">
                Install on Android & POCO Pad
              </h2>
              <p className="text-xs text-slate-400">Direct standalone install & APK guide</p>
            </div>
          </div>
          <button
            id="close-apk-modal-btn"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 p-1.5 gap-1.5">
          <button
            onClick={() => setActiveTab('instant')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'instant'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Tablet className="w-3.5 h-3.5" />
            <span>Instant App Install (Recommended)</span>
          </button>
          <button
            onClick={() => setActiveTab('apk')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'apk'
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Build .APK Package</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'instant' ? (
            <div className="space-y-4">
              {/* Highlight Card */}
              <div className="bg-gradient-to-br from-emerald-950/40 to-slate-900 border border-emerald-500/30 rounded-2xl p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl shrink-0 mt-0.5">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Native Android & Tablet App Experience</h3>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      Installing this app directly on your <strong>POCO Pad 5G</strong> or Android phone adds a full-screen launcher icon, removes the browser URL bar, and enables offline access.
                    </p>
                  </div>
                </div>

                {/* Direct Install Button if supported by current browser session */}
                {isInstallable && (
                  <button
                    id="direct-pwa-install-btn"
                    onClick={handleDirectInstall}
                    className="w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 shadow-lg shadow-emerald-600/30 transition-all active:scale-98 flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Click to Install on this Device Now</span>
                  </button>
                )}

                {isInstalled && (
                  <div className="bg-emerald-900/30 border border-emerald-500/40 rounded-xl p-2.5 flex items-center gap-2 text-xs text-emerald-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>App is already installed and running in standalone mode!</span>
                  </div>
                )}
              </div>

              {/* Step-by-Step for Tablet / Phone */}
              <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Tablet className="w-4 h-4 text-emerald-400" />
                  How to Install on POCO Pad 5G / Android:
                </h4>

                <div className="space-y-2.5 text-xs text-slate-300">
                  <div className="flex items-start gap-2.5 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800/80">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold flex items-center justify-center shrink-0 text-[11px]">
                      1
                    </span>
                    <div>
                      <strong className="text-white block mb-0.5">Open this App in Chrome / Browser</strong>
                      <span>Open the app URL in Google Chrome on your POCO Pad 5G.</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800/80">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold flex items-center justify-center shrink-0 text-[11px]">
                      2
                    </span>
                    <div>
                      <strong className="text-white block mb-0.5">Tap Chrome Menu (⋮)</strong>
                      <span>
                        Tap the 3 dots in the top-right corner of Chrome, then select <strong className="text-emerald-300">"Install App"</strong> or <strong className="text-emerald-300">"Add to Home screen"</strong>.
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800/80">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold flex items-center justify-center shrink-0 text-[11px]">
                      3
                    </span>
                    <div>
                      <strong className="text-white block mb-0.5">Launch from Your Tablet Home Screen</strong>
                      <span>The green Interest & Lending icon will appear on your tablet home screen and app drawer just like any installed APK.</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Share URL */}
              <div className="bg-slate-950/60 rounded-2xl p-3.5 border border-slate-800 flex items-center justify-between gap-2">
                <div className="truncate text-xs text-slate-400">
                  <span className="block text-[10px] uppercase text-slate-500 font-semibold">App URL</span>
                  <span className="font-mono text-slate-300 truncate">{appUrl}</span>
                </div>
                <button
                  onClick={handleCopyUrl}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors"
                >
                  {copiedUrl ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-300">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy URL</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Standalone APK Guide */}
              <div className="bg-sky-950/30 border border-sky-800/40 rounded-2xl p-4 space-y-3 text-xs text-sky-200">
                <div className="flex items-start gap-2.5">
                  <Smartphone className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white text-sm block mb-1">Generate Standalone .APK / .AAB File</strong>
                    <p className="leading-relaxed text-slate-300">
                      Because this app is fully configured with standard Web Manifest and PWA service workers, you can package it into a standalone <strong>.apk</strong> or <strong>.aab</strong> file for Android in 2 minutes:
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2.5 text-xs">
                {/* Method 1: PWABuilder */}
                <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-sky-400"></span>
                      Option 1: PWABuilder (Instant APK generator)
                    </span>
                    <a
                      href="https://www.pwabuilder.com"
                      target="_blank"
                      rel="noreferrer"
                      className="text-sky-400 hover:text-sky-300 flex items-center gap-1 text-[11px] font-semibold"
                    >
                      <span>Visit Site</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <p className="text-slate-400 leading-relaxed">
                    1. Go to <code className="bg-slate-900 text-sky-300 px-1 py-0.5 rounded font-mono">pwabuilder.com</code>.<br />
                    2. Paste this app's shared URL and click <strong>Start</strong>.<br />
                    3. Click <strong>Package for Android</strong> to download the ready-to-sideload <code className="text-emerald-400 font-mono">.apk</code> file or signed Google Play package.
                  </p>
                </div>

                {/* Method 2: Capacitor / Android Studio */}
                <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                      Option 2: Android Studio & Capacitor Export
                    </span>
                  </div>
                  <p className="text-slate-400 leading-relaxed">
                    Export the project ZIP from AI Studio Settings, then run:
                  </p>
                  <pre className="bg-slate-900 p-2.5 rounded-xl font-mono text-[11px] text-emerald-300 overflow-x-auto border border-slate-800">
                    npm install @capacitor/core @capacitor/android{'\n'}
                    npx cap init "LendingTracker" "com.lending.tracker"{'\n'}
                    npx cap add android && npx cap open android
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Full Offline & Tablet Support
          </span>
          <button
            onClick={onClose}
            className="text-xs font-semibold text-slate-300 hover:text-white px-3.5 py-1.5 rounded-xl hover:bg-slate-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
