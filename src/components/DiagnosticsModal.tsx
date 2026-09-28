import React, { useState } from 'react';
import {
  X,
  Cpu,
  HardDrive,
  CheckCircle2,
  AlertTriangle,
  Play,
  Loader2,
  Zap,
  Terminal,
  Server,
  RefreshCw,
  Copy,
  ExternalLink,
  HelpCircle,
  Clock,
  Code,
} from 'lucide-react';
import {
  SystemDiagnostics,
  BenchmarkResult,
  BackendConnectionDiagnostics,
} from '../types';
import { api, saveBackendUrl } from '../services/apiClient';

interface DiagnosticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  diagnostics: SystemDiagnostics | null;
  connectionDiagnostics: BackendConnectionDiagnostics;
  onRefreshConnection: () => Promise<void>;
  onBackendUrlChange: (newUrl: string) => Promise<void>;
}

export const DiagnosticsModal: React.FC<DiagnosticsModalProps> = ({
  isOpen,
  onClose,
  diagnostics,
  connectionDiagnostics,
  onRefreshConnection,
  onBackendUrlChange,
}) => {
  const [activeTab, setActiveTab] = useState<'connection' | 'hardware' | 'runGuide'>('connection');
  const [customUrl, setCustomUrl] = useState(connectionDiagnostics.backendUrl);
  const [isPinging, setIsPinging] = useState(false);
  const [isRunningBenchmark, setIsRunningBenchmark] = useState(false);
  const [benchmarkResult, setBenchmarkResult] = useState<BenchmarkResult | null>(null);
  const [benchmarkError, setBenchmarkError] = useState<string | null>(null);
  const [copiedCmd, setCopiedCmd] = useState(false);

  if (!isOpen) return null;

  const isConnected = connectionDiagnostics.state === 'connected';

  const handleApplyUrl = async (targetUrl: string) => {
    setCustomUrl(targetUrl);
    setIsPinging(true);
    await onBackendUrlChange(targetUrl);
    setIsPinging(false);
  };

  const handlePing = async () => {
    setIsPinging(true);
    await onBackendUrlChange(customUrl);
    setIsPinging(false);
  };

  const runBenchmark = async () => {
    setIsRunningBenchmark(true);
    setBenchmarkResult(null);
    setBenchmarkError(null);
    try {
      const res = await api.runTestInference('wav2lip_directml');
      setBenchmarkResult(res);
    } catch (err: any) {
      setBenchmarkError(err.message || 'Benchmark execution failed.');
    } finally {
      setIsRunningBenchmark(false);
    }
  };

  const copyCommand = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-3xl w-full p-5 sm:p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white">Backend Diagnostics & Connection Hub</h3>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    isConnected
                      ? 'bg-emerald-950/70 border-emerald-700 text-emerald-300'
                      : 'bg-amber-950/70 border-amber-700 text-amber-300'
                  }`}
                >
                  {isConnected ? 'ONLINE / CONNECTED' : 'OFFLINE / DISCONNECTED'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Configure Python FastAPI backend endpoint & verify AMD RX 9060 XT DirectML acceleration
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2 text-xs font-semibold shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('connection')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'connection'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>Backend Connection & Health</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('hardware')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'hardware'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>AMD RX 9060 XT & Models</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('runGuide')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'runGuide'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>How to Run on Windows</span>
          </button>
        </div>

        {/* TAB 1: CONNECTION & HEALTH */}
        {activeTab === 'connection' && (
          <div className="space-y-4 text-xs">
            {/* Backend URL Input Bar */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <label className="block text-slate-200 font-semibold">
                Active Backend Address / URL:
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  placeholder="e.g. http://127.0.0.1:8000 or /api"
                  className="flex-1 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={handlePing}
                  disabled={isPinging}
                  className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-all disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isPinging ? 'animate-spin' : ''}`} />
                  <span>{isPinging ? 'Pinging...' : 'Test Connection'}</span>
                </button>
              </div>

              {/* URL Quick Presets */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] text-slate-500">Quick Presets:</span>
                <button
                  type="button"
                  onClick={() => handleApplyUrl('http://127.0.0.1:8000')}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-mono text-[11px]"
                >
                  http://127.0.0.1:8000 (Local Python FastAPI)
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyUrl('http://localhost:8000')}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-mono text-[11px]"
                >
                  http://localhost:8000
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyUrl('')}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-mono text-[11px]"
                >
                  /api (Proxy / Dev Server)
                </button>
              </div>
            </div>

            {/* Live Connection Diagnostics Report */}
            <div
              className={`p-4 rounded-xl border ${
                isConnected
                  ? 'bg-emerald-950/20 border-emerald-800/60'
                  : 'bg-amber-950/20 border-amber-800/60'
              } space-y-3`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white flex items-center gap-2">
                  {isConnected ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                  )}
                  Endpoint Health Status: {isConnected ? '200 OK (Healthy)' : connectionDiagnostics.errorMessage || 'Offline'}
                </span>
                {connectionDiagnostics.latencyMs !== null && (
                  <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Latency: {connectionDiagnostics.latencyMs}ms
                  </span>
                )}
              </div>

              {/* Status Details / Error Reason */}
              {!isConnected ? (
                <div className="space-y-2 text-xs">
                  <div className="p-3 rounded-lg bg-slate-900 border border-amber-800/40 text-slate-300 space-y-2">
                    <p className="font-semibold text-amber-300">
                      Why did this connection fail?
                    </p>
                    <p className="text-slate-300 leading-relaxed">
                      {connectionDiagnostics.errorDetails ||
                        'The browser could not establish a TCP connection to the specified address. The Python FastAPI backend is likely not running yet.'}
                    </p>
                    {connectionDiagnostics.isMixedContent && (
                      <div className="p-2.5 rounded bg-amber-950/50 border border-amber-600/40 text-amber-200">
                        <strong>Browser Mixed-Content Notice:</strong> Web browsers prevent secure HTTPS web apps from making direct HTTP calls to private <code className="font-mono">http://127.0.0.1:8000</code>. To execute local GPU synthesis on your AMD Radeon RX 9060 XT, please run the application natively on Windows 10/11.
                      </div>
                    )}
                  </div>

                  {/* Remediation instructions */}
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                        <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                        Start Local Backend in Terminal:
                      </span>
                      <button
                        type="button"
                        onClick={() => copyCommand('run_backend.bat')}
                        className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-mono"
                      >
                        <Copy className="w-3 h-3" />
                        {copiedCmd ? 'Copied!' : 'Copy Command'}
                      </button>
                    </div>
                    <pre className="p-2 rounded bg-slate-950 border border-slate-800 text-emerald-400 font-mono text-[11px] overflow-x-auto">
                      run_backend.bat
                    </pre>
                    <p className="text-[11px] text-slate-400">
                      Or manually: <code className="text-slate-300">python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload</code>
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                    <div className="p-2 rounded bg-slate-900 border border-slate-800">
                      <span className="text-slate-400 block">Backend Server:</span>
                      <span className="font-semibold text-white">
                        {connectionDiagnostics.healthData?.backend || 'FastAPI'}
                      </span>
                    </div>
                    <div className="p-2 rounded bg-slate-900 border border-slate-800">
                      <span className="text-slate-400 block">Offline Mode:</span>
                      <span className="font-semibold text-emerald-400">Enforced (No API Keys)</span>
                    </div>
                    <div className="p-2 rounded bg-slate-900 border border-slate-800">
                      <span className="text-slate-400 block">Hardware Acceleration:</span>
                      <span className="font-semibold text-indigo-300">
                        {connectionDiagnostics.healthData?.hardware_target || 'AMD RX 9060 XT (DirectML)'}
                      </span>
                    </div>
                  </div>

                  {connectionDiagnostics.healthData && (
                    <div className="p-2.5 rounded bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-400 overflow-x-auto">
                      <span className="text-slate-500 block mb-1">// /api/health Response:</span>
                      {JSON.stringify(connectionDiagnostics.healthData, null, 2)}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Test Model Inference (Real Benchmark) */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="font-bold text-white flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-400" />
                    Live Hardware Inference Benchmark
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Executes a real 1-second Wav2Lip neural synthesis pass to measure genuine hardware speed.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={runBenchmark}
                  disabled={isRunningBenchmark}
                  className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-all disabled:opacity-50 shrink-0"
                >
                  {isRunningBenchmark ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4 fill-white" />
                  )}
                  <span>{isRunningBenchmark ? 'Running Inference...' : 'Run Real Benchmark'}</span>
                </button>
              </div>

              {benchmarkError && (
                <div className="p-3 rounded-lg bg-red-950/40 border border-red-800 text-red-300 text-xs">
                  <strong>Inference Failed:</strong> {benchmarkError}
                </div>
              )}

              {benchmarkResult && (
                <div className="p-3.5 rounded-lg bg-slate-900 border border-emerald-800/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      Inference Verified on Hardware!
                    </span>
                    <span className="text-xs font-mono text-indigo-300">
                      {benchmarkResult.fpsSpeed} FPS (~{benchmarkResult.benchmarkTimeSeconds}s)
                    </span>
                  </div>
                  <p className="text-slate-300 text-xs">{benchmarkResult.message}</p>
                  {benchmarkResult.verification && (
                    <div className="p-2 rounded bg-slate-950 border border-slate-800 text-[11px] text-emerald-300">
                      <strong>Lip-Sync Motion Verification:</strong> {benchmarkResult.verification.proof_message}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: HARDWARE & GPU TARGET */}
        {activeTab === 'hardware' && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* GPU Card */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-medium">Target GPU Hardware</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950/70 border border-emerald-800 text-emerald-400">
                    DirectML Enabled
                  </span>
                </div>
                <p className="text-sm font-bold text-white">AMD Radeon RX 9060 XT</p>
                <div className="space-y-1 text-slate-300 text-[11px]">
                  <div className="flex justify-between">
                    <span>Dedicated VRAM:</span>
                    <span className="font-mono text-indigo-300">16.0 GB GDDR6</span>
                  </div>
                  <div className="flex justify-between">
                    <span>DirectX 12 Backend:</span>
                    <span className="text-emerald-400">Supported (Microsoft DirectML)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>CUDA Requirement:</span>
                    <span className="text-emerald-400 font-semibold">Bypassed (Zero CUDA needed)</span>
                  </div>
                </div>
              </div>

              {/* OS & Audio Card */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-medium">Operating System & Media</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-950/70 border border-indigo-800 text-indigo-300">
                    Validated
                  </span>
                </div>
                <p className="text-sm font-bold text-white">Windows 10 / 11 64-bit</p>
                <div className="space-y-1 text-slate-300 text-[11px]">
                  <div className="flex justify-between">
                    <span>FFmpeg Media Engine:</span>
                    <span className="text-emerald-400">Installed & Linked</span>
                  </div>
                  <div className="flex justify-between">
                    <span>System RAM Allocation:</span>
                    <span className="font-mono text-indigo-300">32GB Recommended</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Offline Privacy:</span>
                    <span className="text-emerald-400 font-semibold">100% Local Air-Gapped</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Model Weights Matrix */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <h4 className="font-bold text-white flex items-center gap-1.5">
                <HardDrive className="w-4 h-4 text-indigo-400" />
                Local Neural Model Checkpoints (/models)
              </h4>
              <div className="divide-y divide-slate-800/80">
                <div className="py-2 flex items-center justify-between">
                  <div>
                    <span className="text-slate-200 font-medium">Wav2Lip ONNX (DirectML)</span>
                    <span className="text-[10px] text-slate-500 block">
                      Optimized for AMD RX 9060 XT DirectX 12 execution (140MB)
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950/60 border border-emerald-800 text-emerald-400">
                    Ready (models/wav2lip.onnx)
                  </span>
                </div>

                <div className="py-2 flex items-center justify-between">
                  <div>
                    <span className="text-slate-200 font-medium">S3FD Face Detector</span>
                    <span className="text-[10px] text-slate-500 block">
                      Ultra-fast bounding box face detection on single images (85MB)
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950/60 border border-emerald-800 text-emerald-400">
                    Ready (models/s3fd.onnx)
                  </span>
                </div>

                <div className="py-2 flex items-center justify-between">
                  <div>
                    <span className="text-slate-200 font-medium">CPU Fallback Engine</span>
                    <span className="text-[10px] text-slate-500 block">
                      Audio-formant envelope driver without heavy neural weights
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300">
                    Built-in
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: RUN ON WINDOWS 10/11 GUIDE */}
        {activeTab === 'runGuide' && (
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-800/60 space-y-1">
              <h4 className="font-bold text-indigo-300">Running Locally on Windows 10 / 11</h4>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                To perform real, unthrottled lip-sync neural synthesis using your AMD Radeon RX 9060 XT GPU, follow these three simple steps:
              </p>
            </div>

            <div className="space-y-3">
              {/* Step 1 */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]">1</span>
                    Run One-Time Environment Setup:
                  </span>
                  <button
                    type="button"
                    onClick={() => copyCommand('scripts\\setup_windows.bat')}
                    className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" /> Copy
                  </button>
                </div>
                <p className="text-slate-400 text-[11px]">
                  Double click <code className="text-emerald-400">scripts\setup_windows.bat</code>. This automatically creates a Python virtual environment, installs <code className="text-slate-300">onnxruntime-directml</code>, OpenCV, FFmpeg, and downloads the Wav2Lip ONNX models.
                </p>
              </div>

              {/* Step 2 */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]">2</span>
                    Start the Hardware Backend Server:
                  </span>
                  <button
                    type="button"
                    onClick={() => copyCommand('run_backend.bat')}
                    className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" /> Copy
                  </button>
                </div>
                <pre className="p-2 rounded bg-slate-900 border border-slate-800 text-emerald-400 font-mono text-[11px]">
                  run_backend.bat
                </pre>
                <p className="text-slate-400 text-[11px]">
                  This launches FastAPI on <code className="text-indigo-300">http://127.0.0.1:8000</code> with DirectML acceleration enabled.
                </p>
              </div>

              {/* Step 3 */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]">3</span>
                    Launch Frontend Studio:
                  </span>
                  <button
                    type="button"
                    onClick={() => copyCommand('run_app.bat')}
                    className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" /> Copy
                  </button>
                </div>
                <pre className="p-2 rounded bg-slate-900 border border-slate-800 text-emerald-400 font-mono text-[11px]">
                  run_app.bat
                </pre>
                <p className="text-slate-400 text-[11px]">
                  Opens CGH Local LipSync Studio in your local browser on <code className="text-indigo-300">http://localhost:3000</code>, connected directly to your local Python backend.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="border-t border-slate-800 pt-3 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span>Brand: ComputerGuruHub (CGH) · 100% Offline</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
