import os
import sys
import time
from pathlib import Path
import numpy as np
import cv2
import soundfile as sf
import onnxruntime as ort
import librosa
from scipy import signal

# --- Audio Mel Spectrogram computation matching Wav2Lip ---
def preemphasis(wav, k=0.97):
    return signal.lfilter([1, -k], [1], wav)

def linear_to_mel(spectrogram, sr=16000, n_fft=800, n_mels=80, fmin=55, fmax=7600):
    mel_basis = librosa.filters.mel(sr=sr, n_fft=n_fft, n_mels=n_mels, fmin=fmin, fmax=fmax)
    return np.dot(mel_basis, spectrogram)

def amp_to_db(x, min_level_db=-100):
    min_level = np.exp(min_level_db / 20 * np.log(10))
    return 20 * np.log10(np.maximum(min_level, x))

def normalize_mel(S, min_level_db=-100, max_abs_value=4.0):
    return np.clip((2 * max_abs_value) * ((S - min_level_db) / (-min_level_db)) - max_abs_value, -max_abs_value, max_abs_value)

def compute_mel_chunks(audio_path, fps=25):
    wav, sr = sf.read(audio_path)
    if len(wav.shape) > 1:
        wav = np.mean(wav, axis=1)
    if sr != 16000:
        wav = librosa.resample(wav.astype(np.float32), orig_sr=sr, target_sr=16000)
        sr = 16000

    # Rescale
    max_val = np.max(np.abs(wav))
    if max_val > 0:
        wav = wav * (0.9 / max_val)

    wav_filtered = preemphasis(wav, 0.97)
    # STFT: n_fft=800, hop_length=200, win_length=800
    D = librosa.stft(y=wav_filtered, n_fft=800, hop_length=200, win_length=800)
    S = amp_to_db(linear_to_mel(np.abs(D))) - 20 # ref_level_db = 20
    mel = normalize_mel(S)

    mel_step_size = 16
    mel_idx_multiplier = 80.0 / fps
    mel_chunks = []
    i = 0
    while True:
        start_idx = int(i * mel_idx_multiplier)
        if start_idx + mel_step_size > mel.shape[1]:
            mel_chunks.append(mel[:, mel.shape[1] - mel_step_size:])
            break
        mel_chunks.append(mel[:, start_idx : start_idx + mel_step_size])
        i += 1

    return mel_chunks, len(wav) / sr

print("Starting test...")
audio_file = "public/samples/english_speech_sample.wav"
image_file = "/tmp/obama.jpg"

mel_chunks, duration = compute_mel_chunks(audio_file)
print(f"Loaded audio: {duration:.2f}s, generated {len(mel_chunks)} mel chunks (shape: {mel_chunks[0].shape})")

# Load Face
img = cv2.imread(image_file)
h, w, _ = img.shape
detector = cv2.FaceDetectorYN_create('models/yunet.onnx', '', (w, h), score_threshold=0.6)
_, faces = detector.detect(img)
if faces is None:
    print("Face detection failed!")
    sys.exit(1)

box = faces[0][0:4].astype(int)
x, y, fw, fh = box
# Face crop coordinates with slight margin
pady1, pady2, padx1, padx2 = 0, 10, 0, 0
y1 = max(0, y - pady1)
y2 = min(h, y + fh + pady2)
x1 = max(0, x - padx1)
x2 = min(w, x + fw + padx2)
face_crop = img[y1:y2, x1:x2]
orig_crop_h, orig_crop_w = face_crop.shape[:2]

# Load Wav2Lip ONNX
providers = ['CPUExecutionProvider']
sess = ort.InferenceSession('models/wav2lip_gan.onnx', providers=providers)
input_names = [inp.name for inp in sess.get_inputs()]
output_name = sess.get_outputs()[0].name
print(f"Loaded ONNX model successfully with providers {sess.get_providers()}")
print(f"Inputs: {input_names}, Output: {output_name}")

# Prepare Face target: 96x96
face_resized = cv2.resize(face_crop, (96, 96))
face_rgb = cv2.cvtColor(face_resized, cv2.COLOR_BGR2RGB)

face_masked = face_rgb.copy()
face_masked[48:, :] = 0 # zero out lower face

# Shape: (6, 96, 96) normalized to [0, 1]
# channels 0..2: masked, channels 3..5: original
target_frame = np.concatenate((face_masked, face_rgb), axis=2).transpose(2, 0, 1).astype(np.float32) / 255.0

# Batch inference
batch_size = 16
out_frames = []
t0 = time.time()

for b_start in range(0, len(mel_chunks), batch_size):
    b_end = min(b_start + batch_size, len(mel_chunks))
    cur_b_size = b_end - b_start

    # Batch target: (B, 6, 96, 96)
    target_batch = np.tile(target_frame[np.newaxis, ...], (cur_b_size, 1, 1, 1))

    # Batch source: (B, 1, 80, 16)
    source_list = [mel_chunks[idx][np.newaxis, :, :] for idx in range(b_start, b_end)]
    source_batch = np.stack(source_list, axis=0).astype(np.float32)

    feed = {}
    for name in input_names:
        if 'source' in name or 'mel' in name:
            feed[name] = source_batch
        else:
            feed[name] = target_batch

    out = sess.run([output_name], feed)[0] # Shape: (B, 3, 96, 96)

    for i in range(cur_b_size):
        pred_rgb = out[i].transpose(1, 2, 0)
        pred_rgb = np.clip(pred_rgb * 255.0, 0, 255).astype(np.uint8)
        pred_bgr = cv2.cvtColor(pred_rgb, cv2.COLOR_RGB2BGR)

        # Seamless paste back
        pred_resized = cv2.resize(pred_bgr, (orig_crop_w, orig_crop_h))

        frame = img.copy()
        # Blend lower half with gentle feathering
        mask = np.zeros((orig_crop_h, orig_crop_w), dtype=np.float32)
        # Mouth is typically in bottom 60% of face box
        blend_start = int(orig_crop_h * 0.45)
        for row in range(blend_start, orig_crop_h):
            alpha = min(1.0, (row - blend_start) / max(1, orig_crop_h * 0.15))
            mask[row, :] = alpha

        mask = cv2.GaussianBlur(mask, (15, 15), 0)
        mask = mask[..., np.newaxis]

        blended_crop = (pred_resized * mask + face_crop * (1.0 - mask)).astype(np.uint8)
        frame[y1:y2, x1:x2] = blended_crop
        out_frames.append(frame)

print(f"Generated {len(out_frames)} frames in {time.time() - t0:.2f}s (~{len(out_frames)/(time.time()-t0):.1f} FPS)")

# Write video and merge audio
temp_vid = "/tmp/test_synced_noaudio.mp4"
final_vid = "outputs/test_real_lipsync.mp4"
fourcc = cv2.VideoWriter_fourcc(*'mp4v')
writer = cv2.VideoWriter(temp_vid, fourcc, 25, (w, h))
for f in out_frames:
    writer.write(f)
writer.release()

cmd = f"ffmpeg -y -i {temp_vid} -i {audio_file} -c:v libx264 -pix_fmt yuv420p -c:a aac -shortest {final_vid}"
os.system(cmd)
print(f"SUCCESS! Output saved to: {final_vid}, size: {os.path.getsize(final_vid)} bytes")
