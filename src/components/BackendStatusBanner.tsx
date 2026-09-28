import React from 'react';
import { AlertTriangle, Terminal, Activity, RefreshCw, CheckCircle2, ArrowRight } from 'lucide-react';
import { BackendConnectionDiagnostics } from '../types';

interface BackendStatusBannerProps {
  diagnostics: BackendConnectionDiagnostics;
  onOpenDiagnostics: () => void;
  onOpenSetupGuide: () => void;
  onRetryConnection: () => void;
}

export const BackendStatusBanner: React.FC<BackendStatusBannerProps> = ({
  diagnostics,
  onOpenDiagnostics,
  onOpenSetupGuide,
  onRetryConnection,
}) => {
  if (diagnostics.state === 'connected') {
    return null; // When connected, no warning banner needed
  }

  const isChecking = diagnostics.state === 'checking';

  return (
    <div className="mb-6 rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-950/40 via-slate-900 to-amber-950/30 p-4 sm:p-5 shadow-xl shadow-amber-950/20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shrink-0 mt-0.5">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-amber-200">
                Local Python Backend Disconnected ({diagnostics.backendUrl || '127.0.0.1:8000'})
              </h3>
              <span className="text-[11px] font-semibold text-amber-300 bg-amber-900/60 border border-amber-700/50 px-2 py-0.5 rounded-full">
                Action Required
              </span>
            </div>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              {diagnostics.errorMessage || 'Cannot reach Python FastAPI server.'}{' '}
              {diagnostics.isMixedContent ? (
                <span>
                  Browser security blocks HTTPS cloud preview from accessing local <code className="text-amber-300 font-mono">http://127.0.0.1:8000</code>. To synthesize real lip-sync videos, download the project and run it natively on your Windows 10/11 PC.
                </span>
              ) : (
                <span>
                  Start the local FastAPI server using <code className="text-amber-300 font-mono">run_backend.bat</code> to enable real neural inference with your AMD Radeon RX 9060 XT GPU.
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center flex-wrap gap-2.5 sm:self-center shrink-0">
          <button
            type="button"
            onClick={onRetryConnection}
            disabled={isChecking}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium transition-all shadow-sm disabled:opacity-50"
            title="Retry backend connection"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${isChecking ? 'animate-spin' : ''}`} />
            <span>{isChecking ? 'Checking...' : 'Check Connection'}</span>
          </button>

          <button
            type="button"
            onClick={onOpenDiagnostics}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 text-xs font-semibold transition-all shadow-sm"
          >
            <Activity className="w-3.5 h-3.5 text-amber-300" />
            <span>Diagnostics & URL</span>
          </button>

          <button
            type="button"
            onClick={onOpenSetupGuide}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all shadow-sm shadow-indigo-600/30"
          >
            <Terminal className="w-3.5 h-3.5 text-indigo-200" />
            <span>How to Run Locally</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
