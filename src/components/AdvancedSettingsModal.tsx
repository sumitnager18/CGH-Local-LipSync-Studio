import React from 'react';
import { Sliders, RotateCcw, AlertCircle } from 'lucide-react';
import { GenerationSettings } from '../types';

interface AdvancedSettingsProps {
  settings: GenerationSettings;
  onUpdateSettings: (updates: Partial<GenerationSettings>) => void;
  onReset: () => void;
}

export const AdvancedSettings: React.FC<AdvancedSettingsProps> = ({
  settings,
  onUpdateSettings,
  onReset,
}) => {
  return (
    <div className="bg-slate-950/80 border border-slate-800/90 rounded-2xl p-5 shadow-2xl space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-indigo-400" />
          <h3 className="text-sm font-bold text-white">Advanced Inference & Animation Settings</h3>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="flex items-center gap-1 text-xs text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 px-2.5 py-1 rounded-md transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset to Recommended</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        {/* Model Selection */}
        <div>
          <label className="block text-slate-300 font-semibold mb-1.5">
            Local LipSync Engine
          </label>
          <select
            value={settings.engineId}
            onChange={(e) => onUpdateSettings({ engineId: e.target.value })}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="wav2lip_directml">
              Wav2Lip (ONNX DirectML - AMD RX 9060 XT Recommended)
            </option>
            <option value="wav2lip_pytorch">
              Wav2Lip (PyTorch DirectML / CPU)
            </option>
            <option value="musetalk">
              MuseTalk (Experimental Latent Inpainting)
            </option>
            <option value="cpu_fallback">
              CPU Fallback Engine (No weights download needed)
            </option>
          </select>
          <p className="text-[11px] text-slate-400 mt-1">
            Wav2Lip with DirectML utilizes the 16GB VRAM on your AMD RX 9060 XT via DirectX 12.
          </p>
        </div>

        {/* GIF Framerate */}
        <div>
          <label className="block text-slate-300 font-semibold mb-1.5">
            Animated GIF FPS
          </label>
          <select
            value={settings.gifFps}
            onChange={(e) => onUpdateSettings({ gifFps: parseInt(e.target.value, 10) })}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value={10}>10 FPS (Smallest file size)</option>
            <option value={12}>12 FPS (Balanced for web)</option>
            <option value={15}>15 FPS (Recommended smooth GIF)</option>
            <option value={20}>20 FPS (High smoothness, larger size)</option>
          </select>
          <p className="text-[11px] text-slate-400 mt-1">
            Higher GIF framerates increase file size. 15 FPS provides optimal balance.
          </p>
        </div>

        {/* Face Padding Controls */}
        <div className="md:col-span-2 bg-slate-900/50 border border-slate-800 rounded-xl p-3">
          <label className="block text-slate-300 font-semibold mb-2">
            Face Crop & Mouth Bounding Box Padding (Pixels)
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <span className="text-slate-400 text-[11px]">Top Padding: {settings.facePaddingTop}px</span>
              <input
                type="range"
                min="0"
                max="40"
                value={settings.facePaddingTop}
                onChange={(e) => onUpdateSettings({ facePaddingTop: parseInt(e.target.value, 10) })}
                className="w-full accent-indigo-500"
              />
            </div>
            <div>
              <span className="text-slate-400 text-[11px]">Bottom (Chin): {settings.facePaddingBottom}px</span>
              <input
                type="range"
                min="0"
                max="40"
                value={settings.facePaddingBottom}
                onChange={(e) => onUpdateSettings({ facePaddingBottom: parseInt(e.target.value, 10) })}
                className="w-full accent-indigo-500"
              />
            </div>
            <div>
              <span className="text-slate-400 text-[11px]">Left: {settings.facePaddingLeft}px</span>
              <input
                type="range"
                min="0"
                max="40"
                value={settings.facePaddingLeft}
                onChange={(e) => onUpdateSettings({ facePaddingLeft: parseInt(e.target.value, 10) })}
                className="w-full accent-indigo-500"
              />
            </div>
            <div>
              <span className="text-slate-400 text-[11px]">Right: {settings.facePaddingRight}px</span>
              <input
                type="range"
                min="0"
                max="40"
                value={settings.facePaddingRight}
                onChange={(e) => onUpdateSettings({ facePaddingRight: parseInt(e.target.value, 10) })}
                className="w-full accent-indigo-500"
              />
            </div>
          </div>
          <p className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5 text-indigo-400" />
            Increasing bottom padding ensures chin movements remain inside the inpainting field.
          </p>
        </div>
      </div>
    </div>
  );
};
