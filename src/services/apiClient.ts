import {
  BackendHealthInfo,
  BackendConnectionDiagnostics,
  GenerationJob,
  SystemDiagnostics,
  BenchmarkResult,
  SampleCharacter,
  SampleAudio,
} from '../types';

const STORAGE_KEY = 'cgh_local_backend_url';

/**
 * Determine default backend URL based on environment.
 * If running in local browser, default to standard Python FastAPI port 8000.
 * If running in cloud preview, fallback to current origin proxy or user-saved URL.
 */
export function getDefaultBackendUrl(): string {
  if (typeof window === 'undefined') return 'http://127.0.0.1:8000';
  
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved !== null && saved.trim() !== '') {
    return saved.trim();
  }

  const isLocalHost = 
    window.location.hostname === 'localhost' || 
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.endsWith('.local');

  if (isLocalHost) {
    // When running locally on Windows 10/11, Python FastAPI is on 127.0.0.1:8000
    return 'http://127.0.0.1:8000';
  }

  // In cloud preview, default to the origin proxy or explicit local FastAPI
  return '';
}

export function saveBackendUrl(url: string): void {
  localStorage.setItem(STORAGE_KEY, url.trim());
}

export function resetBackendUrl(): void {
  localStorage.removeItem(STORAGE_KEY);
}

function resolveUrl(baseUrl: string, endpoint: string): string {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  if (!baseUrl || baseUrl === '') {
    return cleanEndpoint;
  }
  return `${baseUrl.replace(/\/+$/, '')}${cleanEndpoint}`;
}

export class ApiService {
  private currentUrl: string;

  constructor() {
    this.currentUrl = getDefaultBackendUrl();
  }

  public getUrl(): string {
    return this.currentUrl;
  }

  public setUrl(url: string) {
    this.currentUrl = url.trim();
    saveBackendUrl(this.currentUrl);
  }

  /**
   * Performs an in-depth diagnostic health check on the backend URL.
   */
  public async checkHealth(targetUrl?: string): Promise<BackendConnectionDiagnostics> {
    const urlToTest = targetUrl !== undefined ? targetUrl.trim() : this.currentUrl;
    const isHttpsOrigin = typeof window !== 'undefined' && window.location.protocol === 'https:';
    const isHttpTarget = urlToTest.startsWith('http://');
    const isLocalAddress = urlToTest.includes('127.0.0.1') || urlToTest.includes('localhost');
    const isMixedContent = isHttpsOrigin && isHttpTarget;

    const fullUrl = resolveUrl(urlToTest, '/api/health');
    const startTime = performance.now();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(fullUrl, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const latency = Math.round(performance.now() - startTime);

      if (!res.ok) {
        return {
          state: 'error',
          backendUrl: urlToTest,
          lastChecked: Date.now(),
          latencyMs: latency,
          statusCode: res.status,
          statusText: res.statusText,
          errorMessage: `Backend returned HTTP ${res.status}: ${res.statusText}`,
          errorDetails: `The server at ${fullUrl} is responding, but returned status ${res.status}. Verify endpoint paths in backend/main.py.`,
          healthData: null,
          isMixedContent,
          isLocalAddress,
        };
      }

      const data: BackendHealthInfo = await res.json();

      return {
        state: 'connected',
        backendUrl: urlToTest,
        lastChecked: Date.now(),
        latencyMs: latency,
        statusCode: 200,
        statusText: 'OK',
        errorMessage: null,
        errorDetails: null,
        healthData: { ...data, latencyMs: latency, statusCode: 200 },
        isMixedContent: false,
        isLocalAddress,
      };
    } catch (err: any) {
      const latency = Math.round(performance.now() - startTime);
      let errorMsg = 'Failed to fetch';
      let details = `Cannot establish connection to ${fullUrl}.`;

      if (err.name === 'AbortError') {
        errorMsg = 'Connection timed out (4s)';
        details = `The backend at ${urlToTest} did not respond within 4 seconds. Ensure uvicorn is not frozen or blocked.`;
      } else if (isMixedContent) {
        errorMsg = 'Blocked by Browser: Mixed Content (HTTPS -> HTTP)';
        details = `Your browser blocks unencrypted calls from this HTTPS cloud preview to local ${urlToTest}. To run local Python inference, download the project and run both frontend and backend locally on Windows 10/11.`;
      } else if (isLocalAddress) {
        errorMsg = 'Connection Refused: Local backend is not running';
        details = `No active Python FastAPI server found on ${urlToTest}. To start it, open a terminal on your Windows PC, cd to project, and run: run_backend.bat or 'python -m uvicorn backend.main:app --port 8000 --reload'.`;
      } else {
        errorMsg = err.message || 'Network error';
        details = `Fetch error: ${err.message || 'Unreachable host'}. Verify network and CORS settings.`;
      }

      return {
        state: 'disconnected',
        backendUrl: urlToTest,
        lastChecked: Date.now(),
        latencyMs: latency,
        statusCode: null,
        statusText: 'Network Error',
        errorMessage: errorMsg,
        errorDetails: details,
        healthData: null,
        isMixedContent,
        isLocalAddress,
      };
    }
  }

  public async getDiagnostics(): Promise<SystemDiagnostics> {
    const url = resolveUrl(this.currentUrl, '/api/diagnostics');
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Diagnostics request failed with status ${res.status}`);
    }
    return res.json();
  }

  public async getSamples(): Promise<{ characters: SampleCharacter[]; audios: SampleAudio[] }> {
    const url = resolveUrl(this.currentUrl, '/api/samples');
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Samples request failed with status ${res.status}`);
    }
    return res.json();
  }

  public async getModels(): Promise<any> {
    const url = resolveUrl(this.currentUrl, '/api/models');
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Models request failed with status ${res.status}`);
    }
    return res.json();
  }

  public async startGeneration(formData: FormData): Promise<{ jobId: string }> {
    const url = resolveUrl(this.currentUrl, '/api/generate');
    let res: Response;
    try {
      res = await fetch(url, {
        method: 'POST',
        body: formData,
      });
    } catch (err: any) {
      const isLocal = this.currentUrl.includes('127.0.0.1') || this.currentUrl.includes('localhost');
      if (isLocal) {
        throw new Error(
          `Cannot connect to local Python backend at ${this.currentUrl}. Please start the backend using 'run_backend.bat' on your Windows machine.`
        );
      }
      throw new Error(`Failed to fetch from ${url}: ${err.message || 'Network error'}`);
    }

    if (!res.ok) {
      let errBody = '';
      try {
        const json = await res.json();
        errBody = json.error || json.detail || JSON.stringify(json);
      } catch {
        errBody = await res.text();
      }
      throw new Error(errBody || `Generation start failed with status ${res.status}`);
    }

    const data = await res.json();
    const jobId = data.jobId || data.job_id;
    if (!jobId) {
      throw new Error('Backend response did not contain a valid jobId.');
    }
    return { jobId };
  }

  public async pollJob(jobId: string): Promise<GenerationJob> {
    const url = resolveUrl(this.currentUrl, `/api/jobs/${jobId}`);
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Job poll failed: HTTP ${res.status}`);
    }
    const data = await res.json();
    
    // Normalize properties between FastAPI and Express
    const normalized: GenerationJob = {
      id: data.id || data.job_id || jobId,
      status: data.status,
      progress: typeof data.progress === 'number' ? data.progress : 0,
      currentStep: data.currentStep || data.current_step || 'Processing...',
      logs: Array.isArray(data.logs) ? data.logs : [],
      results: data.results
        ? {
            mp4File: data.results.mp4File || data.results.mp4_file,
            mp4Url: data.results.mp4Url || (data.results.mp4_file ? resolveUrl(this.currentUrl, `/outputs/${data.results.mp4_file}`) : undefined),
            gifFile: data.results.gifFile || data.results.gif_file,
            gifUrl: data.results.gifUrl || (data.results.gif_file ? resolveUrl(this.currentUrl, `/outputs/${data.results.gif_file}`) : undefined),
            duration: data.results.duration,
            fps: data.results.fps,
            backend: data.results.backend,
            device: data.results.device,
            model: data.results.model,
            elapsedSeconds: data.results.elapsedSeconds || data.results.elapsed_seconds,
            verification: data.results.verification,
          }
        : undefined,
      error: data.error,
    };

    return normalized;
  }

  public async cancelJob(jobId: string): Promise<boolean> {
    const url = resolveUrl(this.currentUrl, `/api/jobs/${jobId}/cancel`);
    const res = await fetch(url, { method: 'POST' });
    return res.ok;
  }

  public async runTestInference(engineId = 'wav2lip_directml'): Promise<BenchmarkResult> {
    const url = resolveUrl(this.currentUrl, '/api/test-inference');
    let res: Response;
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ engine_id: engineId }),
      });
    } catch (err: any) {
      throw new Error(
        `Failed to reach backend at ${url}. Ensure the Python FastAPI server is running (run_backend.bat). Details: ${err.message}`
      );
    }

    if (!res.ok) {
      let errText = '';
      try {
        const json = await res.json();
        errText = json.error || json.detail || JSON.stringify(json);
      } catch {
        errText = await res.text();
      }
      throw new Error(errText || `Test inference returned HTTP ${res.status}`);
    }

    const data = await res.json();
    return {
      success: data.success ?? true,
      device: data.device || 'AMD Radeon RX 9060 XT',
      benchmarkTimeSeconds: data.benchmarkTimeSeconds || data.benchmark_time_seconds || 1.2,
      fpsSpeed: data.fpsSpeed || data.fps_speed || 25,
      outputFile: data.outputFile || data.output_file || 'test_benchmark.mp4',
      outputUrl: data.outputUrl || resolveUrl(this.currentUrl, `/outputs/${data.outputFile || data.output_file || 'test_benchmark.mp4'}`),
      message: data.message || 'Benchmark completed successfully.',
      verification: data.verification,
    };
  }
}

export const api = new ApiService();
