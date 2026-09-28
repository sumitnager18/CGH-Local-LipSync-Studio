import os
import subprocess
import numpy as np
import soundfile as sf
import librosa
from scipy import signal
from typing import List, Tuple

HP_NUM_MELS = 80
HP_N_FFT = 800
HP_HOP_SIZE = 200
HP_WIN_SIZE = 800
HP_SAMPLE_RATE = 16000
HP_PREEMPHASIS = 0.97
HP_REF_LEVEL_DB = 20
HP_MIN_LEVEL_DB = -100
HP_MAX_ABS_VALUE = 4.0
HP_FMIN = 55
HP_FMAX = 7600
HP_MEL_STEP_SIZE = 16

def preemphasis(wav: np.ndarray, k: float = HP_PREEMPHASIS) -> np.ndarray:
    return signal.lfilter([1, -k], [1], wav)

def linear_to_mel(spectrogram: np.ndarray) -> np.ndarray:
    mel_basis = librosa.filters.mel(
        sr=HP_SAMPLE_RATE,
        n_fft=HP_N_FFT,
        n_mels=HP_NUM_MELS,
        fmin=HP_FMIN,
        fmax=HP_FMAX
    )
    return np.dot(mel_basis, spectrogram)

def amp_to_db(x: np.ndarray) -> np.ndarray:
    min_level = np.exp(HP_MIN_LEVEL_DB / 20 * np.log(10))
    return 20 * np.log10(np.maximum(min_level, x))

def normalize_mel(S: np.ndarray) -> np.ndarray:
    norm = (2 * HP_MAX_ABS_VALUE) * ((S - HP_MIN_LEVEL_DB) / (-HP_MIN_LEVEL_DB)) - HP_MAX_ABS_VALUE
    return np.clip(norm, -HP_MAX_ABS_VALUE, HP_MAX_ABS_VALUE)

def melspectrogram(wav: np.ndarray) -> np.ndarray:
    D = librosa.stft(
        y=preemphasis(wav, HP_PREEMPHASIS),
        n_fft=HP_N_FFT,
        hop_length=HP_HOP_SIZE,
        win_length=HP_WIN_SIZE
    )
    S = amp_to_db(linear_to_mel(np.abs(D))) - HP_REF_LEVEL_DB
    return normalize_mel(S)

def load_and_normalize_audio(audio_path: str) -> Tuple[np.ndarray, float]:
    """
    Loads audio file in any format via soundfile or ffmpeg fallback,
    resamples to 16,000Hz mono, scales peak, and returns (wav, duration).
    """
    try:
        wav, sr = sf.read(audio_path)
        if len(wav.shape) > 1:
            wav = np.mean(wav, axis=1)
        if sr != HP_SAMPLE_RATE:
            wav = librosa.resample(wav.astype(np.float32), orig_sr=sr, target_sr=HP_SAMPLE_RATE)
    except Exception:
        # Fallback to ffmpeg decode
        temp_wav = f"/tmp/converted_{os.path.basename(audio_path)}.wav"
        subprocess.run(
            ["ffmpeg", "-y", "-i", str(audio_path), "-ar", "16000", "-ac", "1", "-c:a", "pcm_s16le", temp_wav],
            check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
        )
        wav, _ = sf.read(temp_wav)
        if os.path.exists(temp_wav):
            try: os.remove(temp_wav)
            except Exception: pass

    wav = wav.astype(np.float32)
    # Peak rescale to 0.9
    max_val = np.max(np.abs(wav))
    if max_val > 0.01:
        wav = wav * (0.9 / max_val)

    duration = len(wav) / HP_SAMPLE_RATE
    return wav, duration

def generate_mel_chunks(wav: np.ndarray, fps: float = 25.0) -> List[np.ndarray]:
    """
    Generates 16-frame sliding audio mel chunks synchronized to video frame rate.
    Each chunk has shape (80, 16).
    """
    mel = melspectrogram(wav)
    if np.isnan(mel.reshape(-1)).sum() > 0:
        mel = np.nan_to_num(mel, nan=-4.0)

    mel_chunks = []
    mel_idx_multiplier = 80.0 / fps
    i = 0
    while True:
        start_idx = int(i * mel_idx_multiplier)
        if start_idx + HP_MEL_STEP_SIZE > mel.shape[1]:
            mel_chunks.append(mel[:, mel.shape[1] - HP_MEL_STEP_SIZE:])
            break
        mel_chunks.append(mel[:, start_idx : start_idx + HP_MEL_STEP_SIZE])
        i += 1

    return mel_chunks
