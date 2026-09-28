import React from 'react';
import { Cpu, ShieldCheck, Activity, Terminal, Sparkles, Server, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { SystemDiagnostics, BackendConnectionDiagnostics } from '../types';

interface HeaderProps {
  diagnostics: SystemDiagnostics | null;
  connectionDiagnostics: BackendConnectionDiagnostics;
  onOpenDiagnostics: () => void;
  onOpenSetupGuide: () => void;
  onCheckConnection: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  diagnostics,
  connectionDiagnostics,
  onOpenDiagnostics,
  onOpenSetupGuide,
  onCheckConnection,
}) => {
  const isConnected = connectionDiagnostics.state === 'connected';
  const isChecking = connectionDiagnostics.state === 'checking';

  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
        {/* Brand & App Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 p-0.5 shadow-lg shadow-indigo-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-indigo-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold tracking-widest text-indigo-400 uppercase bg-indigo-950/70 border border-indigo-800/60 px-1.5 py-0.5 rounded">
                ComputerGuruHub
              </span>
              <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950/70 border border-emerald-800/60 px-1.5 py-0.5 rounded flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> 100% Local & Offline
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
              CGH Local LipSync Studio
            </h1>
          </div>
        </div>

        {/* Status Badges & Quick Action Buttons */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Backend Connection Status Pill (Interactive) */}
          <button
            type="button"
            onClick={onOpenDiagnostics}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium shadow-sm transition-all ${
              isConnected
                ? 'bg-emerald-950/60 border-emerald-700/60 hover:border-emerald-500 text-emerald-300'
                : 'bg-amber-950/60 border-amber-600/70 hover:border-amber-400 text-amber-300'
            }`}
            title="Click to open Backend Diagnostics & URL Settings"
          >
            <Server className={`w-3.5 h-3.5 ${isConnected ? 'text-emerald-400' : 'text-amber-400'}`} />
            {isConnected ? (
              <>
                <span className="hidden sm:inline font-semibold">Backend Connected</span>
                <span className="text-[11px] font-mono text-emerald-400/90">
                  {connectionDiagnostics.latencyMs ? `(${connectionDiagnostics.latencyMs}ms)` : ''}
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
              </>
            ) : (
              <>
                <span className="font-semibold">
                  {isChecking ? 'Checking Backend...' : 'Backend Not Connected'}
                </span>
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping ml-0.5" />
              </>
            )}
          </button>

          {/* Hardware & GPU status button */}
          <button
            type="button"
            onClick={onOpenDiagnostics}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 hover:border-indigo-500/60 text-slate-200 text-xs font-medium shadow-sm transition-all hover:bg-slate-800/80"
            title="View hardware & DirectML status"
          >
            <Cpu className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline text-slate-400">Target GPU:</span>
            <span className="text-white font-semibold">AMD RX 9060 XT</span>
          </button>

          {/* Setup Guide Button */}
          <button
            type="button"
            onClick={onOpenSetupGuide}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/20 border border-indigo-500/40 hover:bg-indigo-600/30 text-indigo-200 text-xs font-medium transition-all"
          >
            <Terminal className="w-3.5 h-3.5 text-indigo-300" />
            <span>Windows Setup (.bat)</span>
          </button>

          {/* Quick Hardware Diagnostic */}
          <button
            type="button"
            onClick={onOpenDiagnostics}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            title="System Diagnostics & Hardware Benchmark"
          >
            <Activity className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
