import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX } from 'lucide-react';

interface AudioPlayerWaveformProps {
  audioUrl: string;
  fileName?: string;
  onDurationChange?: (duration: number) => void;
}

export const AudioPlayerWaveform: React.FC<AudioPlayerWaveformProps> = ({
  audioUrl,
  fileName,
  onDurationChange,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (audioRef.current) {
      audioRef.current.load();
    }
  }, [audioUrl]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    setCurrentTime(audioRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (!audioRef.current) return;
    const dur = audioRef.current.duration || 0;
    setDuration(dur);
    if (onDurationChange) {
      onDurationChange(dur);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Generate deterministic decorative waveform bars
  const barsCount = 36;
  const progressRatio = duration > 0 ? currentTime / duration : 0;

  return (
    <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-4 shadow-lg backdrop-blur-sm">
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
      />

      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-slate-300 truncate max-w-[240px]">
          {fileName || 'Selected Speech Audio'}
        </span>
        <span className="text-xs font-mono text-purple-300">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>

      {/* Visualizer Waveform Bar */}
      <div className="h-10 flex items-center justify-between gap-[3px] my-2 px-1 bg-slate-950/60 rounded-lg p-1.5 border border-slate-800">
        {Array.from({ length: barsCount }).map((_, idx) => {
          const ratio = idx / barsCount;
          const isActive = ratio <= progressRatio;
          // pseudo-random waveform height based on sin/cos
          const heightPct = Math.min(
            95,
            Math.max(20, Math.sin(idx * 0.7) * 35 + Math.cos(idx * 1.3) * 25 + 50)
          );

          return (
            <div
              key={idx}
              className={`w-full rounded-full transition-colors duration-150 ${
                isActive
                  ? 'bg-gradient-to-t from-fuchsia-500 to-indigo-400'
                  : 'bg-slate-700/60 hover:bg-slate-600'
              }`}
              style={{ height: `${heightPct}%` }}
            />
          );
        })}
      </div>

      {/* Scrub bar */}
      <input
        type="range"
        min="0"
        max={duration || 1}
        step="0.01"
        value={currentTime}
        onChange={handleSeek}
        className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-400"
        aria-label="Audio playback seek"
      />

      {/* Controls */}
      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={togglePlay}
            className="w-9 h-9 flex items-center justify-center rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-md transition-all active:scale-95"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          </button>
          <button
            type="button"
            onClick={() => {
              if (audioRef.current) {
                audioRef.current.currentTime = 0;
                setCurrentTime(0);
              }
            }}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Restart audio"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        <button
          type="button"
          onClick={toggleMute}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};
