import React, { useState } from 'react';
import { Loader2, XCircle, Terminal, CheckCircle2, ChevronDown, ChevronUp, Cpu } from 'lucide-react';
import { GenerationJob } from '../types';

interface GenerationProgressProps {
  job: GenerationJob;
  onCancel: () => void;
}

const PIPELINE_STEPS = [
  { id: 1, label: 'File Validation & Inspection', minPct: 5 },
  { id: 2, label: 'Audio Normalization (16kHz PCM)', minPct: 18 },
  { id: 3, label: 'Facial Landmark Mapping', minPct: 35 },
  { id: 4, label: 'DirectML / Engine Lip-Sync Inference', minPct: 50 },
  { id: 5, label: 'Background & Frame Inpainting', minPct: 68 },
  { id: 6, label: 'FFmpeg MP4 Encoding', minPct: 80 },
  { id: 7, label: '2-Pass Animated GIF Palette Loop', minPct: 90 },
];

export const GenerationProgress: React.FC<GenerationProgressProps> = ({ job, onCancel }) => {
  const [showLogs, setShowLogs] = useState(false);

  return (
    <div className="bg-slate-900/90 border border-indigo-500/40 rounded-2xl p-6 shadow-2xl backdrop-blur-md relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 animate-pulse" />

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              Generating Talking-Character Video
            </h3>
            <p className="text-xs text-indigo-300 font-medium">{job.currentStep}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 border border-red-800/40 text-red-300 text-xs font-medium transition-colors"
        >
          <XCircle className="w-3.5 h-3.5" />
          <span>Cancel Job</span>
        </button>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs font-semibold mb-1.5">
          <span className="text-slate-400 flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-indigo-400" />
            Hardware Acceleration: AMD RX 9060 XT DirectML
          </span>
          <span className="text-indigo-400 font-mono text-sm">{job.progress}%</span>
        </div>
        <div className="h-2.5 w-full bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-fuchsia-500 rounded-full transition-all duration-300 shadow-sm"
            style={{ width: `${Math.max(4, job.progress)}%` }}
          />
        </div>
      </div>

      {/* Pipeline Steps Tracker */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
        {PIPELINE_STEPS.slice(0, 4).map((step) => {
          const isDone = job.progress > step.minPct;
          const isCurrent = job.progress >= step.minPct && job.progress <= step.minPct + 18;

          return (
            <div
              key={step.id}
              className={`p-2 rounded-lg border text-xs flex items-center gap-2 ${
                isDone
                  ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300'
                  : isCurrent
                  ? 'bg-indigo-950/40 border-indigo-500/60 text-indigo-200 animate-pulse'
                  : 'bg-slate-950/30 border-slate-800/60 text-slate-500'
              }`}
            >
              {isDone ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              ) : isCurrent ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400 flex-shrink-0" />
              ) : (
                <div className="w-3.5 h-3.5 rounded-full border border-slate-700 flex-shrink-0" />
              )}
              <span className="truncate text-[11px] font-medium">{step.label}</span>
            </div>
          );
        })}
      </div>

      {/* Terminal Logs Drawer */}
      <div className="border-t border-slate-800 pt-3">
        <button
          type="button"
          onClick={() => setShowLogs(!showLogs)}
          className="flex items-center justify-between w-full text-xs text-slate-400 hover:text-slate-200"
        >
          <span className="flex items-center gap-1.5 font-mono">
            <Terminal className="w-3.5 h-3.5 text-indigo-400" />
            Live Execution Logs ({job.logs.length} events)
          </span>
          {showLogs ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showLogs && (
          <div className="mt-2.5 bg-slate-950 rounded-xl p-3 border border-slate-800 font-mono text-[11px] text-slate-300 max-h-40 overflow-y-auto space-y-1 shadow-inner">
            {job.logs.map((log, idx) => (
              <div key={idx} className="leading-relaxed">
                {log}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
