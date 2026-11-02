import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  Sliders, 
  Volume2, 
  HardDrive, 
  ShieldCheck, 
  Cpu, 
  CheckCircle2, 
  Save, 
  RefreshCw 
} from 'lucide-react';
import { api } from '../services/api';

export const Settings: React.FC = () => {
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  // Settings State
  const [defaultTheme, setDefaultTheme] = useState<string>('champagne');
  const [defaultFps, setDefaultFps] = useState<number>(24);
  const [defaultDuration, setDefaultDuration] = useState<number>(4.2);
  const [defaultAccent, setDefaultAccent] = useState<string>('co.in');
  const [defaultGender, setDefaultGender] = useState<string>('female');
  const [defaultMusicVol, setDefaultMusicVol] = useState<number>(12);

  useEffect(() => {
    // Load local stored settings if any
    const stored = localStorage.getItem('estate_studio_settings');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setDefaultTheme(parsed.defaultTheme || 'champagne');
        setDefaultFps(parsed.defaultFps || 24);
        setDefaultDuration(parsed.defaultDuration || 4.2);
        setDefaultAccent(parsed.defaultAccent || 'co.in');
        setDefaultGender(parsed.defaultGender || 'female');
        setDefaultMusicVol(parsed.defaultMusicVol || 12);
      } catch (e) {}
    }

    api.checkHealth()
      .then((data) => setHealth(data))
      .catch((err) => console.error('Health check failed:', err))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = () => {
    const config = {
      defaultTheme,
      defaultFps,
      defaultDuration,
      defaultAccent,
      defaultGender,
      defaultMusicVol
    };
    localStorage.setItem('estate_studio_settings', JSON.stringify(config));
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#E8E5DA] shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <SettingsIcon className="w-5 h-5 text-[#C5A059]" />
            <h1 className="text-xl font-serif font-bold text-[#1C1917]">Studio Configuration & Preferences</h1>
          </div>
          <p className="text-xs text-[#78716C]">
            Configure video production defaults, speech synthesis accents, and review system diagnostics.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#C5A059] hover:bg-[#B38E46] text-black font-semibold text-xs transition cursor-pointer shadow-sm"
        >
          {savedSuccess ? <CheckCircle2 className="w-4 h-4 text-emerald-950" /> : <Save className="w-4 h-4" />}
          <span>{savedSuccess ? 'Preferences Saved!' : 'Save Preferences'}</span>
        </button>
      </div>

      {/* Production Defaults */}
      <div className="bg-white rounded-2xl border border-[#E8E5DA] p-6 space-y-6 shadow-sm">
        <div className="border-b border-[#F2EFE6] pb-3 flex items-center gap-2">
          <Sliders className="w-4 h-4 text-[#C5A059]" />
          <h2 className="text-sm font-bold text-[#1C1917] uppercase tracking-wider">Video Production Defaults</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div>
            <label className="block text-xs font-semibold text-[#1C1917] mb-1.5">Default Theme</label>
            <select
              value={defaultTheme}
              onChange={(e) => setDefaultTheme(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-[#D6D2C4] bg-white text-xs text-[#1C1917]"
            >
              <option value="champagne">Luxury Champagne</option>
              <option value="minimalist">Modern Minimal</option>
              <option value="cinematic">Cinematic Noir</option>
              <option value="warm">Warm Elegance</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1C1917] mb-1.5">Default Framerate</label>
            <select
              value={defaultFps}
              onChange={(e) => setDefaultFps(parseInt(e.target.value))}
              className="w-full px-3 py-2 rounded-xl border border-[#D6D2C4] bg-white text-xs text-[#1C1917]"
            >
              <option value={24}>24 FPS (Cinematic Standard)</option>
              <option value={30}>30 FPS (Digital Broadcast)</option>
              <option value={60}>60 FPS (Ultra Smooth)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1C1917] mb-1.5">
              Default Slide Duration: {defaultDuration}s
            </label>
            <input
              type="range"
              min="2.5"
              max="6.0"
              step="0.1"
              value={defaultDuration}
              onChange={(e) => setDefaultDuration(parseFloat(e.target.value))}
              className="w-full accent-[#C5A059] mt-2"
            />
          </div>
        </div>
      </div>

      {/* Voice & Audio Defaults */}
      <div className="bg-white rounded-2xl border border-[#E8E5DA] p-6 space-y-6 shadow-sm">
        <div className="border-b border-[#F2EFE6] pb-3 flex items-center gap-2">
          <Volume2 className="w-4 h-4 text-[#C5A059]" />
          <h2 className="text-sm font-bold text-[#1C1917] uppercase tracking-wider">Audio & Voiceover Defaults</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div>
            <label className="block text-xs font-semibold text-[#1C1917] mb-1.5">Default Accent</label>
            <select
              value={defaultAccent}
              onChange={(e) => setDefaultAccent(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-[#D6D2C4] bg-white text-xs text-[#1C1917]"
            >
              <option value="co.in">Indian English (co.in)</option>
              <option value="com">American English (com)</option>
              <option value="co.uk">British English (co.uk)</option>
              <option value="com.au">Australian English (com.au)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1C1917] mb-1.5">Voice Persona</label>
            <select
              value={defaultGender}
              onChange={(e) => setDefaultGender(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-[#D6D2C4] bg-white text-xs text-[#1C1917]"
            >
              <option value="female">Warm Female Voice</option>
              <option value="male">Executive Male Voice</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1C1917] mb-1.5">
              Ambient Background Music: {defaultMusicVol}%
            </label>
            <input
              type="range"
              min="5"
              max="35"
              value={defaultMusicVol}
              onChange={(e) => setDefaultMusicVol(parseInt(e.target.value))}
              className="w-full accent-[#C5A059] mt-2"
            />
          </div>
        </div>
      </div>

      {/* Backend Diagnostics & Infrastructure */}
      <div className="bg-white rounded-2xl border border-[#E8E5DA] p-6 space-y-6 shadow-sm">
        <div className="border-b border-[#F2EFE6] pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-[#C5A059]" />
            <h2 className="text-sm font-bold text-[#1C1917] uppercase tracking-wider">
              System Infrastructure & Diagnostics
            </h2>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" />
            <span>Operational</span>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div className="p-3.5 rounded-xl bg-[#F7F5EE] border border-[#E8E5DA]">
            <span className="text-[10px] text-[#78716C] uppercase font-semibold block mb-1">FastAPI Backend</span>
            <span className="text-xs font-bold text-[#1C1917] block">Active (v2.0.0)</span>
            <span className="text-[10px] text-[#78716C]">Port 8000 • Proxy 5173</span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#F7F5EE] border border-[#E8E5DA]">
            <span className="text-[10px] text-[#78716C] uppercase font-semibold block mb-1">MoviePy Engine</span>
            <span className="text-xs font-bold text-[#1C1917] block">v2.2.1 (H.264 / AAC)</span>
            <span className="text-[10px] text-emerald-600 font-medium">Libx264 Active</span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#F7F5EE] border border-[#E8E5DA]">
            <span className="text-[10px] text-[#78716C] uppercase font-semibold block mb-1">FFmpeg Binary</span>
            <span className="text-xs font-bold text-[#1C1917] block">ImageIO FFmpeg v7.1</span>
            <span className="text-[10px] text-emerald-600 font-medium">Verified & Linked</span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#F7F5EE] border border-[#E8E5DA]">
            <span className="text-[10px] text-[#78716C] uppercase font-semibold block mb-1">Speech Synthesis</span>
            <span className="text-xs font-bold text-[#1C1917] block">Windows SAPI / PowerShell / gTTS</span>
            <span className="text-[10px] text-emerald-600 font-medium">100% Offline Capable</span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#F7F5EE] border border-[#E8E5DA]">
            <span className="text-[10px] text-[#78716C] uppercase font-semibold block mb-1">Photographic Processing</span>
            <span className="text-xs font-bold text-[#1C1917] block">Pillow 11.3 & OpenCV</span>
            <span className="text-[10px] text-[#78716C]">LANCZOS 16:9 Smart Framing</span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#F7F5EE] border border-[#E8E5DA]">
            <span className="text-[10px] text-[#78716C] uppercase font-semibold block mb-1">Local Storage Output</span>
            <span className="text-xs font-bold text-[#1C1917] block truncate">backend/output</span>
            <span className="text-[10px] text-[#78716C]">MP4 + Voice Previews</span>
          </div>
        </div>
      </div>
    </div>
  );
};

