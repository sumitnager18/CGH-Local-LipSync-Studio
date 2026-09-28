import React, { useState } from 'react';
import { X, Terminal, Download, CheckCircle2, ShieldCheck, Copy, ExternalLink, Cpu, Check } from 'lucide-react';

interface SetupGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SetupGuideModal: React.FC<SetupGuideModalProps> = ({ isOpen, onClose }) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Windows 10 & 11 Local Setup Guide</h3>
              <p className="text-xs text-slate-400">Step-by-step installation for ComputerGuruHub users</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* AMD RX 9060 XT Highlight */}
        <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-800/60 flex items-start gap-3">
          <Cpu className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-bold text-white">Hardware Target: AMD Radeon RX 9060 XT 16GB</p>
            <p className="text-slate-300">
              The setup automatically configures <span className="text-indigo-300 font-semibold">Microsoft DirectML</span> to leverage the full 16GB VRAM of your AMD GPU using native DirectX 12 acceleration without needing NVIDIA CUDA.
            </p>
          </div>
        </div>

        {/* Setup Steps */}
        <div className="space-y-3.5 text-xs">
          {/* Step 1 */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-[10px]">1</span>
                Install Python 3.10 (64-bit)
              </span>
              <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                Required
              </span>
            </div>
            <p className="text-slate-400">
              Download and install Python 3.10. Ensure you check the box for <strong>"Add python.exe to PATH"</strong> during installation.
            </p>
          </div>

          {/* Step 2 */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-[10px]">2</span>
                Install FFmpeg Video Engine
              </span>
              <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                Required
              </span>
            </div>
            <p className="text-slate-400">
              Open Windows PowerShell or CMD and run:
            </p>
            <div className="flex items-center justify-between bg-slate-900 px-3 py-1.5 rounded-lg font-mono text-[11px] text-indigo-300 border border-slate-800">
              <code>winget install Gyan.FFmpeg</code>
              <button
                type="button"
                onClick={() => copyToClipboard('winget install Gyan.FFmpeg', 'ffmpeg')}
                className="text-slate-400 hover:text-white flex items-center gap-1 text-[10px]"
                title="Copy command"
              >
                {copiedKey === 'ffmpeg' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'ffmpeg' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Step 3 */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-[10px]">3</span>
                Run One-Time Environment Setup
              </span>
              <span className="text-[10px] text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800">
                One-Time
              </span>
            </div>
            <p className="text-slate-400">
              Double-click <code className="text-indigo-300">scripts\setup_windows.bat</code> in the project directory. This automatically creates a virtual environment, installs <code className="text-slate-300">onnxruntime-directml</code>, OpenCV, and downloads the model checkpoints into <code className="text-slate-300">models/</code>.
            </p>
          </div>

          {/* Step 4 */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-[10px]">4</span>
                Start Hardware Backend & App
              </span>
              <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                Launch
              </span>
            </div>
            <p className="text-slate-400">
              Double-click <code className="text-emerald-400 font-bold">run_backend.bat</code> to start the FastAPI server on <code className="text-slate-300">http://127.0.0.1:8000</code>. Then double click <code className="text-emerald-400 font-bold">run_app.bat</code> to launch your browser at <code className="text-slate-300">http://localhost:3000</code>.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>100% Offline: No API key or remote server access ever needed.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
