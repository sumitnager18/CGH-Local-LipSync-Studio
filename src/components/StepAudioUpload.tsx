import React, { useRef, useState } from 'react';
import { UploadCloud, Music, RefreshCw, Trash2, Sparkles, Mic } from 'lucide-react';
import { AudioPlayerWaveform } from './AudioPlayerWaveform';
import { SampleAudio } from '../types';

interface StepAudioUploadProps {
  selectedFile: File | null;
  audioUrl: string | null;
  audioName: string;
  onSelectFile: (file: File | null, url: string | null, name: string) => void;
  sampleAudios: SampleAudio[];
  onSelectSample: (sample: SampleAudio) => void;
}

export const StepAudioUpload: React.FC<StepAudioUploadProps> = ({
  selectedFile,
  audioUrl,
  audioName,
  onSelectFile,
  sampleAudios,
  onSelectSample,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [duration, setDuration] = useState<number>(0);

  const handleFile = (file: File) => {
    const valid = [
      'audio/wav',
      'audio/x-wav',
      'audio/mpeg',
      'audio/mp3',
      'audio/m4a',
      'audio/x-m4a',
      'audio/flac',
      'audio/ogg',
    ];
    if (!valid.includes(file.type) && !file.name.match(/\.(wav|mp3|m4a|flac|ogg)$/i)) {
      alert('Please upload a valid audio file (WAV, MP3, M4A, FLAC, or OGG).');
      return;
    }

    const url = URL.createObjectURL(file);
    onSelectFile(file, url, file.name);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const removeAudio = () => {
    if (audioUrl && audioUrl.startsWith('blob:')) {
      URL.revokeObjectURL(audioUrl);
    }
    setDuration(0);
    onSelectFile(null, null, '');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-xl relative backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-sm border border-purple-500/30">
            2
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">Choose Speech Audio</h2>
            <p className="text-xs text-slate-400">Hindi, English, or Hinglish speech (WAV, MP3, M4A, FLAC)</p>
          </div>
        </div>

        {audioUrl && (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title="Replace audio"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={removeAudio}
              className="p-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/50 text-red-400 border border-red-800/40 transition-colors"
              title="Remove audio"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="audio/wav,audio/mpeg,audio/mp3,audio/m4a,audio/flac,audio/ogg"
        onChange={(e) => {
          if (e.target.files?.[0]) handleFile(e.target.files[0]);
        }}
        className="hidden"
      />

      {/* Upload Dropzone or Waveform Player */}
      {!audioUrl ? (
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[220px] ${
            isDragging
              ? 'border-purple-400 bg-purple-950/30'
              : 'border-slate-700/80 hover:border-purple-500/60 hover:bg-slate-850/50 bg-slate-950/40'
          }`}
        >
          <div className="w-12 h-12 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-3 shadow-inner">
            <Music className="w-6 h-6" />
          </div>
          <p className="text-sm font-medium text-white mb-1">
            Drag & drop speech audio, or <span className="text-purple-400 underline">browse</span>
          </p>
          <p className="text-xs text-slate-400 mb-3">
            WAV, MP3, M4A, FLAC, OGG
          </p>
          <div className="flex flex-wrap items-center justify-center gap-1.5 text-[11px] text-slate-400 bg-slate-900/80 px-3 py-1 rounded-full border border-slate-800">
            <Mic className="w-3 h-3 text-purple-400" />
            <span>Direct Waveform Sync: No transcription or language selection required</span>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <AudioPlayerWaveform
            audioUrl={audioUrl}
            fileName={audioName}
            onDurationChange={setDuration}
          />
          <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
            <span>Audio Resampling: 16,000Hz 16-bit Mono</span>
            <span className="text-emerald-400 font-medium">Ready for Sync</span>
          </div>
        </div>
      )}

      {/* Quick Sample Selector */}
      {sampleAudios && sampleAudios.length > 0 && (
        <div className="mt-4 pt-3 border-t border-slate-800/80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              Or try sample speech audio:
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {sampleAudios.map((aud) => (
              <button
                key={aud.id}
                type="button"
                onClick={() => onSelectSample(aud)}
                className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 hover:bg-purple-950/40 border border-slate-800 hover:border-purple-500/50 text-left transition-all group"
              >
                <div className="flex items-center gap-2 truncate">
                  <div className="w-6 h-6 rounded bg-purple-500/20 text-purple-300 flex items-center justify-center flex-shrink-0">
                    <Music className="w-3.5 h-3.5" />
                  </div>
                  <div className="truncate">
                    <p className="text-[11px] font-medium text-slate-300 group-hover:text-white truncate">
                      {aud.name}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {aud.language} • {aud.duration}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] text-purple-400 group-hover:underline flex-shrink-0 ml-1">
                  Load
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
