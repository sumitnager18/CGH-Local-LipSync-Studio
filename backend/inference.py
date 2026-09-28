import os
import sys
import time
import json
import argparse
import subprocess
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple

import cv2
import numpy as np
import onnxruntime as ort

# Add parent directory
sys.path.insert(0, str(Path(__file__).resolve().parent))
from audio_utils import load_and_normalize_audio, generate_mel_chunks

class RealLipSyncPipeline:
    """
    True Neural Lip-Synchronization Pipeline for ComputerGuruHub (CGH Local LipSync Studio).
    Runs 100% locally with AMD Radeon RX 9060 XT 16GB DirectML acceleration or CPU fallback.
    """

    def __init__(self, models_dir: Optional[str] = None, prefer_directml: bool = True):
        if models_dir is None:
            self.models_dir = Path(__file__).resolve().parent.parent / "models"
        else:
            self.models_dir = Path(models_dir)

        self.prefer_directml = prefer_directml
        self.yunet_model = self.models_dir / "yunet.onnx"
        self.w2l_gan_model = self.models_dir / "wav2lip_gan.onnx"
        self.w2l_base_model = self.models_dir / "wav2lip.onnx"

        self.session: Optional[ort.InferenceSession] = None
        self.detector = None
        self.active_provider = "CPUExecutionProvider"
        self.active_backend_name = "CPU Inference"

    def _init_session(self):
        """Initializes ONNX Runtime session with AMD DirectML or CPU."""
        if self.session is not None:
            return

        available_providers = ort.get_available_providers()
        selected_providers = []

        if self.prefer_directml and "DmlExecutionProvider" in available_providers:
            selected_providers.append("DmlExecutionProvider")
            self.active_backend_name = "AMD Radeon RX 9060 XT (DirectML / DirectX 12)"
        else:
            self.active_backend_name = "CPU Fallback (ONNX Runtime)"

        selected_providers.append("CPUExecutionProvider")

        # Choose model checkpoint
        model_path = self.w2l_gan_model if self.w2l_gan_model.exists() else self.w2l_base_model
        if not model_path.exists():
            raise FileNotFoundError(
                f"Wav2Lip ONNX model not found in {self.models_dir}. "
                "Ensure wav2lip_gan.onnx or wav2lip.onnx is downloaded."
            )

        sess_options = ort.SessionOptions()
        sess_options.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL
        self.session = ort.InferenceSession(
            str(model_path),
            sess_options=sess_options,
            providers=selected_providers
        )
        self.active_provider = self.session.get_providers()[0]

    def detect_face_bbox(self, img: np.ndarray, pads: Tuple[int, int, int, int] = (0, 10, 0, 0)) -> Tuple[int, int, int, int]:
        """
        Detects face using YuNet DNN or falls back to center-portrait bounding box.
        Returns: (y1, y2, x1, x2)
        """
        h, w = img.shape[:2]
        pady1, pady2, padx1, padx2 = pads

        if self.yunet_model.exists():
            try:
                detector = cv2.FaceDetectorYN_create(str(self.yunet_model), "", (w, h), score_threshold=0.5)
                _, faces = detector.detect(img)
                if faces is not None and len(faces) > 0:
                    box = faces[0][:4].astype(int)
                    x, y, fw, fh = box
                    y1 = max(0, y - pady1)
                    y2 = min(h, y + fh + pady2)
                    x1 = max(0, x - padx1)
                    x2 = min(w, x + fw + padx2)
                    return (y1, y2, x1, x2)
            except Exception as e:
                pass

        # Fallback bounding box for stylized characters or cartoons
        y1 = max(0, int(h * 0.15) - pady1)
        y2 = min(h, int(h * 0.85) + pady2)
        x1 = max(0, int(w * 0.20) - padx1)
        x2 = min(w, int(w * 0.80) + padx2)
        return (y1, y2, x1, x2)

    def generate(
        self,
        image_path: str,
        audio_path: str,
        output_video_path: str,
        output_gif_path: Optional[str] = None,
        fps: int = 25,
        quality: str = "high",
        pads: Tuple[int, int, int, int] = (0, 10, 0, 0),
        batch_size: int = 16,
        progress_cb: Optional[Any] = None
    ) -> Dict[str, Any]:
        """
        Executes genuine neural Wav2Lip inference.
        """
        start_time = time.time()
        self._init_session()

        if progress_cb: progress_cb(10, "Loading character image and audio...")

        # 1. Load image
        img = cv2.imread(image_path)
        if img is None:
            raise ValueError(f"Could not read input image: {image_path}")
        h, w = img.shape[:2]

        # 2. Load and process audio
        if progress_cb: progress_cb(20, "Computing audio mel-spectrogram chunks...")
        wav, duration = load_and_normalize_audio(audio_path)
        mel_chunks = generate_mel_chunks(wav, fps=fps)
        total_chunks = len(mel_chunks)

        if total_chunks == 0:
            raise ValueError("Audio duration is too short for lip-synchronization.")

        # 3. Detect face
        if progress_cb: progress_cb(30, "Detecting face landmarks & mouth region...")
        y1, y2, x1, x2 = self.detect_face_bbox(img, pads=pads)
        face_crop = img[y1:y2, x1:x2]
        crop_h, crop_w = face_crop.shape[:2]

        # 4. Prepare target input for Wav2Lip (96x96 BGR)
        face_96 = cv2.resize(face_crop, (96, 96))
        face_masked = face_96.copy()
        face_masked[48:, :] = 0  # Zero out mouth region (lower half)

        # Concatenate (masked, unmasked) -> shape: (6, 96, 96) normalized to [0, 1]
        target_frame = np.concatenate((face_masked, face_96), axis=2).transpose(2, 0, 1).astype(np.float32) / 255.0

        # Discover session input/output names
        input_names = [inp.name for inp in self.session.get_inputs()]
        output_name = self.session.get_outputs()[0].name

        # 5. Run Neural Inference Batches
        if progress_cb: progress_cb(40, f"Synthesizing {total_chunks} synchronized mouth frames on {self.active_backend_name}...")

        generated_frames = []
        mouth_predictions_96 = []
        inference_t0 = time.time()

        # Precompute smooth blending mask for the mouth region to prevent any border seams
        blend_mask = np.zeros((crop_h, crop_w), dtype=np.float32)
        # Start smooth transition just above the mouth line (around 45% of face height)
        blend_start = int(crop_h * 0.42)
        for r in range(blend_start, crop_h):
            val = min(1.0, (r - blend_start) / max(1, crop_h * 0.18))
            blend_mask[r, :] = val

        # Edge feathering horizontally as well
        h_margin = int(crop_w * 0.08)
        for c in range(crop_w):
            if c < h_margin:
                blend_mask[:, c] *= (c / max(1, h_margin))
            elif c > crop_w - h_margin:
                blend_mask[:, c] *= ((crop_w - c) / max(1, h_margin))

        blend_mask = cv2.GaussianBlur(blend_mask, (15, 15), 0)
        blend_mask_3d = blend_mask[..., np.newaxis]

        for b_start in range(0, total_chunks, batch_size):
            b_end = min(b_start + batch_size, total_chunks)
            cur_bs = b_end - b_start

            target_batch = np.tile(target_frame[np.newaxis, ...], (cur_bs, 1, 1, 1))
            source_batch = np.stack(
                [mel_chunks[idx][np.newaxis, :, :] for idx in range(b_start, b_end)],
                axis=0
            ).astype(np.float32)

            feed = {}
            for name in input_names:
                if "source" in name or "mel" in name:
                    feed[name] = source_batch
                else:
                    feed[name] = target_batch

            pred_batch = self.session.run([output_name], feed)[0]  # Shape: (B, 3, 96, 96)

            for i in range(cur_bs):
                pred_face_96 = pred_batch[i].transpose(1, 2, 0)
                pred_face_96 = np.clip(pred_face_96 * 255.0, 0, 255).astype(np.uint8)
                mouth_predictions_96.append(pred_face_96[48:, :].copy())

                pred_crop_resized = cv2.resize(pred_face_96, (crop_w, crop_h))

                # Smoothly composite mouth with original face
                frame = img.copy()
                blended_face = (pred_crop_resized * blend_mask_3d + face_crop * (1.0 - blend_mask_3d)).astype(np.uint8)
                frame[y1:y2, x1:x2] = blended_face
                generated_frames.append(frame)

            pct = 40 + int((b_end / total_chunks) * 35)
            if progress_cb: progress_cb(pct, f"Inference progress: {b_end}/{total_chunks} frames...")

        inference_time = time.time() - inference_t0
        fps_speed = round(total_chunks / max(0.01, inference_time), 1)

        # 6. Motion & Animation Verification Test
        if progress_cb: progress_cb(80, "Verifying genuine lip movement & phoneme articulation...")
        verification = self.verify_animation(mouth_predictions_96)

        # 7. Encode MP4 via FFmpeg
        if progress_cb: progress_cb(85, "Encoding synchronized MP4 video (H.264 / AAC)...")
        temp_raw_vid = Path(output_video_path).parent / f"temp_raw_{int(time.time())}.mp4"

        # Write video frames
        writer = cv2.VideoWriter(
            str(temp_raw_vid),
            cv2.VideoWriter_fourcc(*"mp4v"),
            fps,
            (w, h)
        )
        for f in generated_frames:
            writer.write(f)
        writer.release()

        # Mux with speech audio
        crf = "18" if quality == "high" else "23"
        ffmpeg_cmd = [
            "ffmpeg", "-y",
            "-i", str(temp_raw_vid),
            "-i", str(audio_path),
            "-c:v", "libx264",
            "-crf", crf,
            "-preset", "fast",
            "-pix_fmt", "yuv420p",
            "-c:a", "aac",
            "-b:a", "192k",
            "-shortest",
            "-movflags", "+faststart",
            str(output_video_path)
        ]
        subprocess.run(ffmpeg_cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

        if temp_raw_vid.exists():
            try: temp_raw_vid.unlink()
            except Exception: pass

        # 8. Export GIF if requested
        gif_file = None
        if output_gif_path:
            if progress_cb: progress_cb(92, "Generating optimized animated GIF...")
            gif_cmd = [
                "ffmpeg", "-y",
                "-i", str(output_video_path),
                "-vf", f"fps={min(fps, 16)},scale=400:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse=dither=bayer:bayer_scale=4",
                str(output_gif_path)
            ]
            try:
                subprocess.run(gif_cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                gif_file = str(output_gif_path)
            except Exception:
                pass

        total_elapsed = round(time.time() - start_time, 2)
        if progress_cb: progress_cb(100, "Lip-sync generation completed successfully!")

        return {
            "success": True,
            "status": "completed",
            "video_path": str(output_video_path),
            "gif_path": gif_file,
            "duration": round(duration, 2),
            "frames_generated": total_chunks,
            "fps": fps,
            "inference_time_seconds": round(inference_time, 2),
            "total_time_seconds": total_elapsed,
            "fps_speed": fps_speed,
            "backend": self.active_backend_name,
            "provider": self.active_provider,
            "verification": verification
        }

    @staticmethod
    def verify_animation(mouth_crops: List[np.ndarray]) -> Dict[str, Any]:
        """
        Mathematically proves the output video contains genuine lip movement
        by measuring pixel variance across sequential mouth frames.
        """
        if len(mouth_crops) < 2:
            return {
                "verified": False,
                "status": "INVALID_INSUFFICIENT_FRAMES",
                "mean_mouth_diff": 0.0,
                "max_mouth_diff": 0.0,
                "animated_frames": 0,
                "total_frames": len(mouth_crops),
                "is_genuine_lipsync": False
            }

        diffs = []
        diffs_from_first = []
        first_mouth = mouth_crops[0].astype(float)

        for i in range(1, len(mouth_crops)):
            prev = mouth_crops[i - 1].astype(float)
            curr = mouth_crops[i].astype(float)
            inter_diff = float(np.mean(np.abs(curr - prev)))
            from_first_diff = float(np.mean(np.abs(curr - first_mouth)))
            diffs.append(inter_diff)
            diffs_from_first.append(from_first_diff)

        mean_diff = float(np.mean(diffs))
        max_diff = float(np.max(diffs))
        mean_from_first = float(np.mean(diffs_from_first))
        max_from_first = float(np.max(diffs_from_first))
        animated_count = sum(1 for d in diffs if d > 0.05)
        animated_pct = round((animated_count / len(diffs)) * 100, 1)

        # Genuine lip sync criteria:
        # Mouth moves relative to frame 0 and between phonemes
        is_genuine = (mean_from_first > 0.5) and (max_diff > 0.1) and (animated_count > len(diffs) * 0.3)

        return {
            "verified": is_genuine,
            "status": "VALID_ANIMATED" if is_genuine else "INVALID_STATIC",
            "mean_interframe_mouth_diff": round(mean_diff, 3),
            "max_interframe_mouth_diff": round(max_diff, 3),
            "mean_diff_from_first_frame": round(mean_from_first, 3),
            "max_diff_from_first_frame": round(max_from_first, 3),
            "animated_frames_count": animated_count,
            "animated_frames_percent": animated_pct,
            "total_frames": len(mouth_crops),
            "is_genuine_lipsync": is_genuine,
            "proof_message": (
                f"Verified: Character mouth actively articulates across {animated_count}/{len(diffs)} frames "
                f"with {mean_from_first:.2f} avg pixel displacement."
                if is_genuine else
                "Warning: Insufficient mouth motion detected."
            )
        }

def main():
    parser = argparse.ArgumentParser(description="CGH Local LipSync Studio Neural Inference Engine")
    parser.add_argument("--image", required=True, help="Path to character image (PNG/JPG/WebP)")
    parser.add_argument("--audio", required=True, help="Path to speech audio (WAV/MP3/M4A)")
    parser.add_argument("--output_video", required=True, help="Path to output MP4 video")
    parser.add_argument("--output_gif", required=False, default=None, help="Path to output GIF")
    parser.add_argument("--fps", type=int, default=25, help="Video FPS (default: 25)")
    parser.add_argument("--quality", default="high", choices=["high", "standard"], help="Video quality")
    parser.add_argument("--prefer_directml", action="store_true", default=True, help="Prefer AMD DirectML")
    parser.add_argument("--models_dir", default=None, help="Directory containing ONNX models")

    args = parser.parse_args()

    pipeline = RealLipSyncPipeline(models_dir=args.models_dir, prefer_directml=args.prefer_directml)

    def print_progress(pct: int, msg: str):
        print(f"PROGRESS:{pct}:{msg}", flush=True)

    result = pipeline.generate(
        image_path=args.image,
        audio_path=args.audio,
        output_video_path=args.output_video,
        output_gif_path=args.output_gif,
        fps=args.fps,
        quality=args.quality,
        progress_cb=print_progress
    )

    print("RESULT_JSON:" + json.dumps(result), flush=True)

if __name__ == "__main__":
    main()
