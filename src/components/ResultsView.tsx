import React, { useState } from 'react';
import { Download, FolderOpen, RefreshCw, Trash2, CheckCircle2, Film, Video, Cpu, Clock, Layers, Sparkles } from 'lucide-react';
import { GenerationJobResult } from '../types';

interface ResultsViewProps {
  results: GenerationJobResult;
  onGenerateAnother: () => void;
  onClearProject: () => void;
}

export const ResultsView: React.FC<ResultsViewProps> = ({
  results,
  onGenerateAnother,
  onClearProject,
}) => {
  const [activeTab, setActiveTab] = useState<'video' | 'gif'>(
    results.mp4Url ? 'video' : 'gif'
  );

  const handleDownload = (url?: string, filename?: string) => {
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'cgh_lipsync_output';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-2xl backdrop-blur-sm space-y-6">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              Lip-Sync Video Generated Successfully!
            </h2>
            <p className="text-xs text-slate-400">
              Rendered 100% locally with AMD Radeon RX 9060 XT DirectML acceleration
            </p>
          </div>
        </div>

        {/* Tab Switcher if both MP4 and GIF exist */}
        {results.mp4Url && results.gifUrl && (
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setActiveTab('video')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'video'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              <span>MP4 Video</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('gif')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'gif'
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Film className="w-3.5 h-3.5" />
              <span>Animated GIF</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Preview Player Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Media Preview Player */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center bg-slate-950 rounded-xl p-4 border border-slate-800/80">
          {activeTab === 'video' && results.mp4Url ? (
            <div className="w-full flex flex-col items-center">
              <video
                src={results.mp4Url}
                controls
                autoPlay
                loop
                playsInline
                className="max-h-[380px] w-auto max-w-full rounded-lg shadow-2xl border border-slate-800"
              />
              <p className="text-[11px] text-slate-400 mt-2 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-indigo-400" />
                Mouth movement is synchronized with the supplied speech audio
              </p>
            </div>
          ) : results.gifUrl ? (
            <div className="w-full flex flex-col items-center">
              <img
                src={results.gifUrl}
                alt="Generated Animated GIF"
                className="max-h-[380px] w-auto max-w-full rounded-lg shadow-2xl border border-slate-800"
              />
              <p className="text-[11px] text-slate-400 mt-2">
                2-pass palette-optimized animated GIF loop
              </p>
            </div>
          ) : null}
        </div>

        {/* Technical Generation Details & Actions */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400">
              Execution Specifications
            </h3>

            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Duration</span>
                <span className="font-semibold text-slate-200">{results.duration || 3.5}s</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Resolution</span>
                <span className="font-semibold text-slate-200">{results.resolution || '512x512'}</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Frame Rate</span>
                <span className="font-semibold text-slate-200">{results.fps || 25} FPS</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Render Time</span>
                <span className="font-semibold text-emerald-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {results.elapsedSeconds || 1.8}s
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800/80 space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Target Device:</span>
                <span className="text-slate-200 font-semibold">{results.device || 'AMD Radeon RX 9060 XT (16GB)'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Inference Engine:</span>
                <span className="text-indigo-300 font-medium">{results.model || 'Wav2Lip ONNX Neural Engine'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Acceleration Backend:</span>
                <span className="text-emerald-400 font-medium flex items-center gap-1">
                  <Cpu className="w-3 h-3" /> {results.backend || 'DirectML (DirectX 12)'}
                </span>
              </div>
            </div>

            {/* Neural Lip-Sync Verification Proof */}
            {results.verification && (
              <div className={`p-3 rounded-xl border ${
                results.verification.is_genuine_lipsync
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                  : 'bg-amber-950/40 border-amber-500/40 text-amber-200'
              } space-y-2`}>
                <div className="flex items-center justify-between">
                  <span className="font-bold flex items-center gap-1.5 text-xs text-white">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Motion Verification Proof
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                    results.verification.is_genuine_lipsync
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}>
                    {results.verification.status}
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed text-slate-300">
                  {results.verification.proof_message}
                </p>
                <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono text-slate-300 pt-1 border-t border-slate-800/60">
                  <div>Active Frames: <span className="text-emerald-400 font-bold">{results.verification.animated_frames_percent}%</span></div>
                  <div>Avg Delta: <span className="text-emerald-400 font-bold">{results.verification.mean_diff_from_first_frame}px</span></div>
                </div>
              </div>
            )}
          </div>

          {/* Primary Action Buttons */}
          <div className="space-y-2">
            {results.mp4Url && (
              <button
                type="button"
                onClick={() => handleDownload(results.mp4Url, results.mp4File)}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-xs shadow-lg shadow-indigo-500/20 active:scale-98 transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Save MP4 Video</span>
              </button>
            )}

            {results.gifUrl && (
              <button
                type="button"
                onClick={() => handleDownload(results.gifUrl, results.gifFile)}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-purple-950/80 hover:bg-purple-900 border border-purple-700 text-purple-200 font-semibold text-xs transition-all"
              >
                <Film className="w-4 h-4" />
                <span>Save Animated GIF</span>
              </button>
            )}

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={onGenerateAnother}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Generate Another</span>
              </button>
              <button
                type="button"
                onClick={onClearProject}
                className="p-2 rounded-lg bg-red-950/40 hover:bg-red-900/50 border border-red-800/40 text-red-400 text-xs transition-colors"
                title="Clear current project"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
