export type OutputFormat = 'mp4' | 'gif' | 'both';
export type ResolutionOption = 'original' | '720p' | '1080p';
export type QualityOption = 'standard' | 'high';
export type BackgroundMode = 'original' | 'transparent';

export interface GenerationSettings {
  outputFormat: OutputFormat;
  resolution: ResolutionOption;
  fps: number;
  quality: QualityOption;
  backgroundMode: BackgroundMode;
  engineId: string;
  facePaddingTop: number;
  facePaddingBottom: number;
  facePaddingLeft: number;
  facePaddingRight: number;
  faceIndex: number;
  gifFps: number;
}

export interface SampleCharacter {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  transparent?: boolean;
}

export interface SampleAudio {
  id: string;
  name: string;
  language: string;
  duration: string;
  audioUrl: string;
}

export interface LipSyncVerification {
  verified: boolean;
  status: 'VALID_ANIMATED' | 'INVALID_STATIC';
  mean_interframe_mouth_diff: number;
  max_interframe_mouth_diff: number;
  mean_diff_from_first_frame: number;
  max_diff_from_first_frame: number;
  animated_frames_count: number;
  animated_frames_percent: number;
  total_frames: number;
  is_genuine_lipsync: boolean;
  proof_message: string;
}

export interface GenerationJobResult {
  mp4File?: string;
  mp4Url?: string;
  gifFile?: string;
  gifUrl?: string;
  duration?: number;
  resolution?: string;
  fps?: number;
  backend?: string;
  device?: string;
  model?: string;
  elapsedSeconds?: number;
  verification?: LipSyncVerification;
}

export interface GenerationJob {
  id: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  currentStep: string;
  logs: string[];
  results?: GenerationJobResult;
  error?: string;
}

export interface SystemDiagnostics {
  os: {
    system: string;
    release: string;
    platform: string;
    hostname: string;
    compatible: boolean;
  };
  gpu: {
    name: string;
    vendor: string;
    vramGb: number;
    isAmd: boolean;
    directmlSupported: boolean;
    status: string;
    notes: string;
  };
  backend: {
    active: string;
    status: string;
    directmlReady: boolean;
    cudaRequired: boolean;
    modelsInstalled: number;
  };
  ffmpeg: {
    installed: boolean;
    version: string;
  };
  memory: {
    totalGb: number;
    freeGb: number;
    status: string;
  };
  models: Array<{
    id: string;
    name: string;
    filename: string;
    installed: boolean;
    sizeMb: number;
  }>;
}

export interface BenchmarkResult {
  success: boolean;
  device: string;
  benchmarkTimeSeconds: number;
  fpsSpeed: number;
  outputFile: string;
  outputUrl: string;
  message: string;
  verification?: LipSyncVerification;
}

export type ConnectionState = 'connected' | 'disconnected' | 'checking' | 'error';

export interface BackendHealthInfo {
  status: string;
  backend?: string;
  version?: string;
  app?: string;
  brand?: string;
  host?: string;
  offline_mode?: boolean;
  api_keys_required?: boolean;
  hardware_target?: string;
  models_installed?: any[];
  latencyMs?: number;
  statusCode?: number;
}

export interface BackendConnectionDiagnostics {
  state: ConnectionState;
  backendUrl: string;
  lastChecked: number | null;
  latencyMs: number | null;
  statusCode: number | null;
  statusText: string | null;
  errorMessage: string | null;
  errorDetails: string | null;
  healthData: BackendHealthInfo | null;
  isMixedContent: boolean;
  isLocalAddress: boolean;
}
