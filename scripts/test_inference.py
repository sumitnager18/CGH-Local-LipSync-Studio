#!/usr/bin/env python3
"""
CGH Local LipSync Studio - Neural Inference & Motion Verification Test
Executes genuine Wav2Lip neural inference on a real character portrait and speech audio,
verifies that the character's mouth actively articulates across frames (proving the output
is NOT a static image), and benchmarks throughput for AMD Radeon RX 9060 XT / DirectML.
"""

import os
import sys
import time
from pathlib import Path

# Add backend directory to sys.path
base_dir = Path(__file__).resolve().parent.parent
backend_dir = base_dir / "backend"
sys.path.insert(0, str(backend_dir))

from inference import RealLipSyncPipeline

def run_verification_test():
    print("=" * 65)
    print("   CGH Local LipSync Studio - Neural Lip-Sync Verification Test  ")
    print("=" * 65)

    image_path = base_dir / "public" / "samples" / "cgh_presenter.png"
    audio_path = base_dir / "public" / "samples" / "hindi_speech_sample.wav"
    output_mp4 = base_dir / "outputs" / "verified_cgh_lipsync.mp4"
    output_gif = base_dir / "outputs" / "verified_cgh_lipsync.gif"

    output_mp4.parent.mkdir(parents=True, exist_ok=True)

    print(f"\n[1/4] Input Assets:")
    print(f"      Character Image: {image_path.name} (exists: {image_path.exists()})")
    print(f"      Speech Audio:    {audio_path.name} (exists: {audio_path.exists()})")

    print("\n[2/4] Initializing RealLipSyncPipeline (DirectML / CPU)...")
    pipeline = RealLipSyncPipeline(models_dir=str(base_dir / "models"), prefer_directml=True)

    def on_progress(pct: int, msg: str):
        print(f"      [{pct}%] {msg}")

    print("\n[3/4] Synthesizing Neural Lip-Synchronized Talking Video...")
    t0 = time.time()
    result = pipeline.generate(
        image_path=str(image_path),
        audio_path=str(audio_path),
        output_video_path=str(output_mp4),
        output_gif_path=str(output_gif),
        fps=25,
        quality="high",
        progress_cb=on_progress
    )
    total_time = round(time.time() - t0, 2)

    print("\n[4/4] Evaluating Genuine Mouth Motion & Verification Proof:")
    ver = result["verification"]
    status = ver["status"]
    is_genuine = ver["is_genuine_lipsync"]

    print("-" * 65)
    print(f"  Verification Status:           {status}")
    print(f"  Is Genuine Neural Lip-Sync:    {is_genuine}")
    print(f"  Inter-frame Mean Mouth Delta:  {ver['mean_interframe_mouth_diff']:.3f} px")
    print(f"  Peak Phoneme Mouth Delta:      {ver['max_interframe_mouth_diff']:.3f} px")
    print(f"  Displacement from 1st Frame:   {ver['mean_diff_from_first_frame']:.3f} px")
    print(f"  Animated Frames Ratio:         {ver['animated_frames_count']}/{ver['total_frames']} ({ver['animated_frames_percent']}%)")
    print(f"  Target Hardware Backend:       {result['backend']}")
    print(f"  Inference Speed:               {result['fps_speed']} FPS")
    print(f"  Output MP4 Size:               {round(output_mp4.stat().st_size / 1024, 1)} KB")
    print(f"  Output GIF Size:               {round(output_gif.stat().st_size / 1024, 1)} KB")
    print("-" * 65)

    if not is_genuine:
        print("\n[FAILED] Output was flagged as INVALID_STATIC: Mouth did not articulate sufficiently.")
        sys.exit(1)
    else:
        print("\n[SUCCESS] TEST PASSED: Video is confirmed VALID_ANIMATED with genuine lip motion!")
        print(f"Generated talking character video: {output_mp4}")
        print(f"Generated animated preview GIF:   {output_gif}")
        print("=" * 65 + "\n")

if __name__ == "__main__":
    run_verification_test()
