import React, { useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
  Play,
  AlertCircle,
  ShieldAlert,
  Cpu,
  HardDrive,
  CheckCircle2,
  Server,
  Terminal,
} from 'lucide-react';
import { Header } from './components/Header';
import { BackendStatusBanner } from './components/BackendStatusBanner';
import { StepImageUpload } from './components/StepImageUpload';
import { StepAudioUpload } from './components/StepAudioUpload';
import { StepOutputConfig } from './components/StepOutputConfig';
import { AdvancedSettings } from './components/AdvancedSettingsModal';
import { GenerationProgress } from './components/GenerationProgress';
import { ResultsView } from './components/ResultsView';
import { DiagnosticsModal } from './components/DiagnosticsModal';
import { SetupGuideModal } from './components/SetupGuideModal';

import {
  GenerationSettings,
  SampleCharacter,
  SampleAudio,
  GenerationJob,
  GenerationJobResult,
  SystemDiagnostics,
  BackgroundMode,
  BackendConnectionDiagnostics,
} from './types';
import { api } from './services/apiClient';

const DEFAULT_SETTINGS: GenerationSettings = {
  outputFormat: 'both',
  resolution: 'original',
  fps: 25,
  quality: 'high',
  backgroundMode: 'original',
  engineId: 'wav2lip_directml',
  facePaddingTop: 0,
  facePaddingBottom: 10,
  facePaddingLeft: 0,
  facePaddingRight: 0,
  faceIndex: 0,
  gifFps: 15,
};

export default function App() {
  // Step 1: Image
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [sampleImagePath, setSampleImagePath] = useState<string | null>(null);

  // Step 2: Audio
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);
  const [audioName, setAudioName] = useState<string>('');
  const [sampleAudioPath, setSampleAudioPath] = useState<string | null>(null);

  // Step 3 & Advanced Settings
  const [settings, setSettings] = useState<GenerationSettings>(DEFAULT_SETTINGS);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Step 4: Generation State & Job
  const [activeJob, setActiveJob] = useState<GenerationJob | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Step 5: Results
  const [results, setResults] = useState<GenerationJobResult | null>(null);

  // Connection & Diagnostics State
  const [connectionDiagnostics, setConnectionDiagnostics] = useState<BackendConnectionDiagnostics>({
    state: 'checking',
    backendUrl: api.getUrl(),
    lastChecked: null,
    latencyMs: null,
    statusCode: null,
    statusText: null,
    errorMessage: null,
    errorDetails: null,
    healthData: null,
    isMixedContent: false,
    isLocalAddress: true,
  });

  // Modals & Metadata
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [showSetupGuide, setShowSetupGuide] = useState(false);
  const [diagnostics, setDiagnostics] = useState<SystemDiagnostics | null>(null);
  const [sampleCharacters, setSampleCharacters] = useState<SampleCharacter[]>([]);
  const [sampleAudios, setSampleAudios] = useState<SampleAudio[]>([]);

  // Check Backend Connection
  const checkBackendHealth = useCallback(async (targetUrl?: string) => {
    setConnectionDiagnostics((prev) => ({ ...prev, state: 'checking' }));
    const diag = await api.checkHealth(targetUrl);
    setConnectionDiagnostics(diag);

    if (diag.state === 'connected') {
      // Refresh samples and system diagnostics from active backend
      fetchSamples();
      fetchDiagnostics();
    }
  }, []);

  const handleBackendUrlChange = async (newUrl: string) => {
    api.setUrl(newUrl);
    await checkBackendHealth(newUrl);
  };

  // Initial load
  useEffect(() => {
    checkBackendHealth();
    fetchSamples();
    fetchDiagnostics();

    // Periodic heartbeat every 15s to detect when local server starts up
    const interval = setInterval(() => {
      checkBackendHealth();
    }, 15000);

    return () => clearInterval(interval);
  }, [checkBackendHealth]);

  const fetchDiagnostics = async () => {
    try {
      const data = await api.getDiagnostics();
      setDiagnostics(data);
    } catch (e) {
      console.warn('Diagnostics fetch notice:', e);
    }
  };

  const fetchSamples = async () => {
    try {
      const data = await api.getSamples();
      setSampleCharacters(data.characters || []);
      setSampleAudios(data.audios || []);
    } catch (e) {
      // Fallback to local files if backend not ready
      console.warn('Samples fetch notice:', e);
    }
  };

  // Poll for job updates
  useEffect(() => {
    if (!activeJob || activeJob.status === 'completed' || activeJob.status === 'failed' || activeJob.status === 'cancelled') {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const updated = await api.pollJob(activeJob.id);
        setActiveJob(updated);

        if (updated.status === 'completed') {
          setIsGenerating(false);
          if (updated.results) {
            setResults(updated.results);
          }
        } else if (updated.status === 'failed') {
          setIsGenerating(false);
          setErrorMessage(updated.error || 'Lip-sync generation encountered an error.');
        } else if (updated.status === 'cancelled') {
          setIsGenerating(false);
        }
      } catch (err: any) {
        console.error('Job poll error:', err);
      }
    }, 600);

    return () => clearInterval(interval);
  }, [activeJob]);

  // Handle starter character select
  const handleSelectSampleCharacter = (sample: SampleCharacter) => {
    setImageFile(null);
    setImagePreviewUrl(sample.imageUrl);
    setSampleImagePath(sample.imageUrl);
    if (sample.transparent) {
      setSettings((prev) => ({ ...prev, backgroundMode: 'transparent' }));
    }
    setErrorMessage(null);
  };

  // Handle starter audio select
  const handleSelectSampleAudio = (sample: SampleAudio) => {
    setAudioFile(null);
    setAudioPreviewUrl(sample.audioUrl);
    setAudioName(sample.name);
    setSampleAudioPath(sample.audioUrl);
    setErrorMessage(null);
  };

  // Handle manual image selection
  const handleSelectImageFile = (file: File | null, url: string | null) => {
    setImageFile(file);
    setImagePreviewUrl(url);
    setSampleImagePath(null);
    setErrorMessage(null);
  };

  // Handle manual audio selection
  const handleSelectAudioFile = (file: File | null, url: string | null, name: string) => {
    setAudioFile(file);
    setAudioPreviewUrl(url);
    setAudioName(name);
    setSampleAudioPath(null);
    setErrorMessage(null);
  };

  // Start Generation
  const handleGenerate = async () => {
    if (!imagePreviewUrl) {
      setErrorMessage('Please choose or upload a character image (Step 1).');
      return;
    }
    if (!audioPreviewUrl) {
      setErrorMessage('Please choose or upload speech audio (Step 2).');
      return;
    }

    // Safety check: Is local backend connected?
    if (connectionDiagnostics.state !== 'connected') {
      setShowDiagnostics(true);
      setErrorMessage(
        `Local Python backend is not connected (${connectionDiagnostics.backendUrl || '127.0.0.1:8000'}). Please start the FastAPI backend on your Windows PC using 'run_backend.bat' before generating.`
      );
      return;
    }

    setErrorMessage(null);
    setIsGenerating(true);
    setResults(null);

    const formData = new FormData();
    if (imageFile) {
      formData.append('image', imageFile);
    } else if (sampleImagePath) {
      formData.append('sample_image', sampleImagePath);
    }

    if (audioFile) {
      formData.append('audio', audioFile);
    } else if (sampleAudioPath) {
      formData.append('sample_audio', sampleAudioPath);
    }

    formData.append('output_format', settings.outputFormat);
    formData.append('resolution', settings.resolution);
    formData.append('fps', settings.fps.toString());
    formData.append('quality', settings.quality);
    formData.append('background_mode', settings.backgroundMode);
    formData.append('engine_id', settings.engineId);
    formData.append('face_padding_top', settings.facePaddingTop.toString());
    formData.append('face_padding_bottom', settings.facePaddingBottom.toString());
    formData.append('face_padding_left', settings.facePaddingLeft.toString());
    formData.append('face_padding_right', settings.facePaddingRight.toString());
    formData.append('face_index', settings.faceIndex.toString());
    formData.append('gif_fps', settings.gifFps.toString());

    try {
      const { jobId } = await api.startGeneration(formData);
      setActiveJob({
        id: jobId,
        status: 'running',
        progress: 5,
        currentStep: 'Initializing neural pipeline on AMD RX 9060 XT DirectML...',
        logs: ['Job started.'],
      });
    } catch (err: any) {
      setIsGenerating(false);
      setErrorMessage(err.message || 'Error communicating with local backend.');
    }
  };

  // Cancel Job
  const handleCancelJob = async () => {
    if (!activeJob) return;
    try {
      await api.cancelJob(activeJob.id);
      setActiveJob((prev) => (prev ? { ...prev, status: 'cancelled' } : null));
      setIsGenerating(false);
    } catch (e) {
      console.error(e);
    }
  };

  // Clear Project
  const handleClearProject = () => {
    setImageFile(null);
    setImagePreviewUrl(null);
    setSampleImagePath(null);
    setAudioFile(null);
    setAudioPreviewUrl(null);
    setAudioName('');
    setSampleAudioPath(null);
    setActiveJob(null);
    setResults(null);
    setIsGenerating(false);
    setErrorMessage(null);
    setSettings(DEFAULT_SETTINGS);
  };

  const isBackendConnected = connectionDiagnostics.state === 'connected';
  const isReadyToGenerate = Boolean(imagePreviewUrl && audioPreviewUrl && !isGenerating);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Application Bar */}
      <Header
        diagnostics={diagnostics}
        connectionDiagnostics={connectionDiagnostics}
        onOpenDiagnostics={() => setShowDiagnostics(true)}
        onOpenSetupGuide={() => setShowSetupGuide(true)}
        onCheckConnection={() => checkBackendHealth()}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-indigo-950/80 to-purple-950/80 border border-indigo-800/60 text-xs font-semibold text-indigo-300 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>ComputerGuruHub Local AI Studio</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Turn Any Image Into a{' '}
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Talking Character
            </span>
          </h2>

          <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
            Upload an image and Hindi or English speech audio. Generate genuine, synchronized lip movement locally on your Windows 10/11 PC with AMD Radeon RX 9060 XT GPU acceleration.
          </p>
        </div>

        {/* Prominent Backend Status Banner (when disconnected) */}
        <BackendStatusBanner
          diagnostics={connectionDiagnostics}
          onOpenDiagnostics={() => setShowDiagnostics(true)}
          onOpenSetupGuide={() => setShowSetupGuide(true)}
          onRetryConnection={() => checkBackendHealth()}
        />

        {/* Error Alert if any */}
        {errorMessage && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-xs shadow-lg animate-in fade-in">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-400 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-red-200">Execution Error</p>
              <p className="text-red-300 leading-relaxed">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Results Screen (if generated) */}
        {results && (
          <ResultsView
            results={results}
            onGenerateAnother={() => setResults(null)}
            onClearProject={handleClearProject}
          />
        )}

        {/* Live Generation Progress (if actively running) */}
        {isGenerating && activeJob && (
          <GenerationProgress
            job={activeJob}
            onCancel={handleCancelJob}
          />
        )}

        {/* Standard 5-Step Workflow (when not in full results view) */}
        {!results && (
          <div className="space-y-6">
            {/* Step 1: Image & Step 2: Audio Side-by-Side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <StepImageUpload
                selectedFile={imageFile}
                previewUrl={imagePreviewUrl}
                onSelectFile={handleSelectImageFile}
                backgroundMode={settings.backgroundMode}
                onBackgroundModeChange={(mode: BackgroundMode) =>
                  setSettings((prev) => ({ ...prev, backgroundMode: mode }))
                }
                sampleCharacters={sampleCharacters}
                onSelectSample={handleSelectSampleCharacter}
              />

              <StepAudioUpload
                selectedFile={audioFile}
                audioUrl={audioPreviewUrl}
                audioName={audioName}
                onSelectFile={handleSelectAudioFile}
                sampleAudios={sampleAudios}
                onSelectSample={handleSelectSampleAudio}
              />
            </div>

            {/* Step 3: Output Format & Quality */}
            <StepOutputConfig
              settings={settings}
              onUpdateSettings={(updates) => setSettings((prev) => ({ ...prev, ...updates }))}
              showAdvanced={showAdvanced}
              onToggleAdvanced={() => setShowAdvanced(!showAdvanced)}
            />

            {/* Collapsible Advanced Settings */}
            {showAdvanced && (
              <AdvancedSettings
                settings={settings}
                onUpdateSettings={(updates) => setSettings((prev) => ({ ...prev, ...updates }))}
                onReset={() => setSettings(DEFAULT_SETTINGS)}
              />
            )}

            {/* Step 4: Primary Generate Button */}
            <div className="flex flex-col items-center pt-2 space-y-3">
              {isBackendConnected ? (
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={!isReadyToGenerate}
                  className={`w-full sm:w-auto min-w-[280px] px-8 py-4 rounded-2xl font-bold text-base shadow-2xl flex items-center justify-center gap-3 transition-all active:scale-98 ${
                    isReadyToGenerate
                      ? 'bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500 hover:from-indigo-400 hover:via-purple-500 hover:to-pink-400 text-white shadow-indigo-500/25 cursor-pointer ring-2 ring-indigo-400/30'
                      : 'bg-slate-800/80 text-slate-500 border border-slate-700 cursor-not-allowed'
                  }`}
                >
                  <Play className="w-5 h-5 fill-current" />
                  <span>Generate Lip-Sync Video</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowDiagnostics(true)}
                  className="w-full sm:w-auto min-w-[320px] px-8 py-4 rounded-2xl font-bold text-base shadow-2xl flex items-center justify-center gap-3 bg-slate-900 border border-amber-500/60 hover:border-amber-400 text-amber-300 hover:bg-slate-800 transition-all cursor-pointer shadow-amber-950/20"
                >
                  <Server className="w-5 h-5 text-amber-400" />
                  <span>Backend Not Connected — Open Diagnostics</span>
                </button>
              )}

              <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                  Target: AMD RX 9060 XT 16GB (DirectML)
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-emerald-400" />
                  100% Offline & Private
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5">
                  <HardDrive className="w-3.5 h-3.5 text-purple-400" />
                  Real Wav2Lip Neural Synthesis
                </span>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 text-center text-xs text-slate-400 space-y-1">
        <p className="font-medium text-slate-400">
          CGH Local LipSync Studio — ComputerGuruHub
        </p>
        <p className="text-[11px] text-slate-400">
          Engineered for Windows 10 & 11 with AMD Radeon RX 9060 XT 16GB DirectML hardware acceleration and CPU fallback.
        </p>
      </footer>

      {/* Modals */}
      <DiagnosticsModal
        isOpen={showDiagnostics}
        onClose={() => setShowDiagnostics(false)}
        diagnostics={diagnostics}
        connectionDiagnostics={connectionDiagnostics}
        onRefreshConnection={() => checkBackendHealth()}
        onBackendUrlChange={handleBackendUrlChange}
      />

      <SetupGuideModal
        isOpen={showSetupGuide}
        onClose={() => setShowSetupGuide(false)}
      />
    </div>
  );
}
