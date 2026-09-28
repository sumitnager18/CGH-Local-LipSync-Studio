import React, { useRef, useState } from 'react';
import { UploadCloud, Image as ImageIcon, CheckCircle2, AlertTriangle, RefreshCw, Trash2, Sparkles } from 'lucide-react';
import { BackgroundMode, SampleCharacter } from '../types';

interface StepImageUploadProps {
  selectedFile: File | null;
  previewUrl: string | null;
  onSelectFile: (file: File | null, url: string | null) => void;
  backgroundMode: BackgroundMode;
  onBackgroundModeChange: (mode: BackgroundMode) => void;
  sampleCharacters: SampleCharacter[];
  onSelectSample: (sample: SampleCharacter) => void;
}

export const StepImageUpload: React.FC<StepImageUploadProps> = ({
  selectedFile,
  previewUrl,
  onSelectFile,
  backgroundMode,
  onBackgroundModeChange,
  sampleCharacters,
  onSelectSample,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [imageMeta, setImageMeta] = useState<{ width: number; height: number; isPng: boolean } | null>(null);

  const handleFile = (file: File) => {
    const valid = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!valid.includes(file.type) && !file.name.match(/\.(png|jpe?g|webp)$/i)) {
      alert('Please upload a valid PNG, JPG, or WebP image.');
      return;
    }

    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setImageMeta({
        width: img.width,
        height: img.height,
        isPng: file.type === 'image/png' || file.name.toLowerCase().endsWith('.png'),
      });
    };
    img.src = url;

    onSelectFile(file, url);
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

  const removeImage = () => {
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setImageMeta(null);
    onSelectFile(null, null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const isLowRes = imageMeta && (imageMeta.width < 200 || imageMeta.height < 200);

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-xl relative backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-sm border border-indigo-500/30">
            1
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">Choose Character Image</h2>
            <p className="text-xs text-slate-400">Front-facing portrait, cartoon, illustration, or educational character</p>
          </div>
        </div>

        {previewUrl && (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title="Replace image"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={removeImage}
              className="p-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/50 text-red-400 border border-red-800/40 transition-colors"
              title="Remove image"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp"
        onChange={(e) => {
          if (e.target.files?.[0]) handleFile(e.target.files[0]);
        }}
        className="hidden"
      />

      {/* Upload Dropzone or Active Preview */}
      {!previewUrl ? (
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[220px] ${
            isDragging
              ? 'border-indigo-400 bg-indigo-950/30'
              : 'border-slate-700/80 hover:border-indigo-500/60 hover:bg-slate-850/50 bg-slate-950/40'
          }`}
        >
          <div className="w-12 h-12 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-3 shadow-inner">
            <UploadCloud className="w-6 h-6" />
          </div>
          <p className="text-sm font-medium text-white mb-1">
            Drag & drop character image, or <span className="text-indigo-400 underline">browse</span>
          </p>
          <p className="text-xs text-slate-400 mb-3">
            PNG (with transparency), JPG, JPEG, WebP
          </p>
          <div className="flex flex-wrap items-center justify-center gap-1 text-[11px] text-slate-500">
            <span>Portraits</span> • <span>Cartoons</span> • <span>CGH Explainer</span> • <span>Educational</span>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-700/80 flex items-center justify-center p-3 max-h-[260px]">
            <img
              src={previewUrl}
              alt="Character Preview"
              className="max-h-[230px] w-auto max-w-full object-contain rounded-lg shadow-md"
            />
            {/* Overlay Badges */}
            <div className="absolute top-2 left-2 flex items-center gap-1.5">
              <span className="bg-slate-900/90 backdrop-blur-sm border border-slate-700 text-[11px] text-slate-200 px-2 py-0.5 rounded-md flex items-center gap-1 shadow">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Image Ready
              </span>
              {imageMeta && (
                <span className="bg-slate-900/90 backdrop-blur-sm border border-slate-700 text-[11px] text-slate-300 px-2 py-0.5 rounded-md font-mono shadow">
                  {imageMeta.width}x{imageMeta.height}
                </span>
              )}
            </div>
            {/* Transparent PNG Tag */}
            {(imageMeta?.isPng || previewUrl.includes('robot')) && (
              <div className="absolute top-2 right-2">
                <span className="bg-purple-950/80 border border-purple-700 text-[10px] text-purple-300 px-2 py-0.5 rounded-md font-semibold">
                  PNG Alpha Ready
                </span>
              </div>
            )}
          </div>

          {/* Warning if low res */}
          {isLowRes && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-950/40 border border-amber-800/60 text-amber-300 text-xs">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>Low resolution image detected ({imageMeta.width}x{imageMeta.height}). For best lip sync detail, 512x512 or higher is recommended.</span>
            </div>
          )}

          {/* Background Mode Toggle */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex items-center justify-between text-xs">
            <span className="text-slate-300 font-medium">Output Background:</span>
            <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-700">
              <button
                type="button"
                onClick={() => onBackgroundModeChange('original')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                  backgroundMode === 'original'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Original Background
              </button>
              <button
                type="button"
                onClick={() => onBackgroundModeChange('transparent')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                  backgroundMode === 'transparent'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Transparent (PNG)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Sample Selector */}
      {sampleCharacters && sampleCharacters.length > 0 && (
        <div className="mt-4 pt-3 border-t border-slate-800/80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              Or try a starter character:
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {sampleCharacters.map((char) => (
              <button
                key={char.id}
                type="button"
                onClick={() => onSelectSample(char)}
                className="flex items-center gap-2 p-1.5 rounded-lg bg-slate-950/60 hover:bg-indigo-950/40 border border-slate-800 hover:border-indigo-500/50 text-left transition-all group"
              >
                <img
                  src={char.imageUrl}
                  alt={char.name}
                  className="w-8 h-8 rounded-md object-cover bg-slate-900 border border-slate-700"
                />
                <div className="truncate">
                  <p className="text-[11px] font-medium text-slate-300 group-hover:text-white truncate">
                    {char.name}
                  </p>
                  <p className="text-[10px] text-slate-500 truncate">
                    {char.transparent ? 'Transparent' : 'Portrait'}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
