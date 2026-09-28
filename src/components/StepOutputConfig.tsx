import React from 'react';
import { Video, Film, Sliders, ChevronDown, ChevronUp, Layers } from 'lucide-react';
import { GenerationSettings, OutputFormat, ResolutionOption, QualityOption } from '../types';

interface StepOutputConfigProps {
  settings: GenerationSettings;
  onUpdateSettings: (updates: Partial<GenerationSettings>) => void;
  showAdvanced: boolean;
  onToggleAdvanced: () => void;
}

export const StepOutputConfig: React.FC<StepOutputConfigProps> = ({
  settings,
  onUpdateSettings,
  showAdvanced,
  onToggleAdvanced,
}) => {
  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-pink-500/20 text-pink-400 flex items-center justify-center font-bold text-sm border border-pink-500/30">
            3
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">Select Output Format & Quality</h2>
            <p className="text-xs text-slate-400">Choose video, animated GIF, and video presentation settings</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onToggleAdvanced}
          className="flex items-center gap-1 text-xs font-medium text-indigo-400 hover:text-indigo-300 bg-indigo-950/40 hover:bg-indigo-900/50 px-2.5 py-1 rounded-lg border border-indigo-800/40 transition-colors"
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Advanced</span>
          {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* 3 Main Output Format Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        {/* Card 1: MP4 */}
        <div
          onClick={() => onUpdateSettings({ outputFormat: 'mp4' })}
          className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
            settings.outputFormat === 'mp4'
              ? 'bg-indigo-950/50 border-indigo-500 shadow-md shadow-indigo-500/10'
              : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Video className="w-4 h-4" />
            </div>
            <input
              type="radio"
              name="outputFormat"
              checked={settings.outputFormat === 'mp4'}
              onChange={() => onUpdateSettings({ outputFormat: 'mp4' })}
              className="accent-indigo-500"
            />
          </div>
          <div>
            <p className="text-xs font-bold text-white mb-0.5">MP4 Video</p>
            <p className="text-[11px] text-slate-400">H.264 video with synchronized audio track</p>
          </div>
        </div>

        {/* Card 2: Animated GIF */}
        <div
          onClick={() => onUpdateSettings({ outputFormat: 'gif' })}
          className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
            settings.outputFormat === 'gif'
              ? 'bg-purple-950/50 border-purple-500 shadow-md shadow-purple-500/10'
              : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <Film className="w-4 h-4" />
            </div>
            <input
              type="radio"
              name="outputFormat"
              checked={settings.outputFormat === 'gif'}
              onChange={() => onUpdateSettings({ outputFormat: 'gif' })}
              className="accent-purple-500"
            />
          </div>
          <div>
            <p className="text-xs font-bold text-white mb-0.5">Animated GIF</p>
            <p className="text-[11px] text-slate-400">Optimized 2-pass palette loop for social & stickers</p>
          </div>
        </div>

        {/* Card 3: Both */}
        <div
          onClick={() => onUpdateSettings({ outputFormat: 'both' })}
          className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
            settings.outputFormat === 'both'
              ? 'bg-gradient-to-br from-indigo-950/60 to-purple-950/60 border-fuchsia-500 shadow-md shadow-fuchsia-500/10'
              : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-lg bg-fuchsia-500/20 text-fuchsia-400 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <input
              type="radio"
              name="outputFormat"
              checked={settings.outputFormat === 'both'}
              onChange={() => onUpdateSettings({ outputFormat: 'both' })}
              className="accent-fuchsia-500"
            />
          </div>
          <div>
            <p className="text-xs font-bold text-white mb-0.5">Both MP4 + GIF</p>
            <p className="text-[11px] text-slate-400">Generate full-fidelity video and animated GIF together</p>
          </div>
        </div>
      </div>

      {/* Simple Settings Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
        {/* Resolution */}
        <div>
          <label className="block text-slate-400 font-medium mb-1">Resolution</label>
          <select
            value={settings.resolution}
            onChange={(e) => onUpdateSettings({ resolution: e.target.value as ResolutionOption })}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="original">Original Aspect Ratio</option>
            <option value="720p">720p HD (1280x720)</option>
            <option value="1080p">1080p Full HD (1920x1080)</option>
          </select>
        </div>

        {/* Frame Rate */}
        <div>
          <label className="block text-slate-400 font-medium mb-1">Video Frame Rate</label>
          <select
            value={settings.fps}
            onChange={(e) => onUpdateSettings({ fps: parseInt(e.target.value, 10) })}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value={24}>24 FPS (Cinematic)</option>
            <option value={25}>25 FPS (Standard PAL)</option>
            <option value={30}>30 FPS (Smooth NTSC)</option>
          </select>
        </div>

        {/* Quality */}
        <div className="col-span-2 sm:col-span-1">
          <label className="block text-slate-400 font-medium mb-1">Output Quality</label>
          <select
            value={settings.quality}
            onChange={(e) => onUpdateSettings({ quality: e.target.value as QualityOption })}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="high">High Quality (CRF 18)</option>
            <option value="standard">Standard Quality (CRF 23)</option>
          </select>
        </div>
      </div>
    </div>
  );
};
