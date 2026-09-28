import subprocess
import shutil
from pathlib import Path
from typing import Optional, Dict, Any

class VideoService:
    """
    Handles FFmpeg MP4 encoding, GIF generation with palette optimization,
    and transparent video/GIF preservation.
    """

    def __init__(self):
        self.ffmpeg = shutil.which("ffmpeg") or "ffmpeg"

    def create_mp4(
        self,
        frames_pattern_or_image: str,
        audio_path: str,
        output_mp4: str,
        fps: int = 25,
        resolution: str = "original",
        quality: str = "high"
    ) -> bool:
        # CRF 18 for high, 23 for standard
        crf = "18" if quality == "high" else "23"

        vf_filters = []
        if resolution == "720p":
            vf_filters.append("scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2")
        elif resolution == "1080p":
            vf_filters.append("scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2")

        vf_arg = []
        if vf_filters:
            vf_arg = ["-vf", ",".join(vf_filters)]

        cmd = [
            self.ffmpeg, "-y",
            "-loop", "1", "-i", str(frames_pattern_or_image),
            "-i", str(audio_path),
            "-c:v", "libx264",
            "-crf", crf,
            "-preset", "medium",
            *vf_arg,
            "-c:a", "aac",
            "-b:a", "192k",
            "-pix_fmt", "yuv420p",
            "-shortest",
            "-movflags", "+faststart",
            str(output_mp4)
        ]

        res = subprocess.run(cmd, capture_output=True, text=True)
        return res.returncode == 0

    def create_animated_gif(
        self,
        video_or_image_path: str,
        output_gif: str,
        fps: int = 15,
        max_width: int = 480,
        preserve_transparency: bool = False
    ) -> bool:
        """
        Creates a high-quality, optimized animated GIF using FFmpeg's palettegen & paletteuse filters.
        Prevents color banding and keeps file size reasonable.
        """
        palette_path = Path(output_gif).parent / "palette.png"

        # Filter string for palette generation
        filter_str = f"fps={fps},scale={max_width}:-1:flags=lanczos"

        # Pass 1: Generate palette
        cmd_palette = [
            self.ffmpeg, "-y",
            "-i", str(video_or_image_path),
            "-vf", f"{filter_str},palettegen=reserve_transparent={1 if preserve_transparency else 0}",
            str(palette_path)
        ]
        res1 = subprocess.run(cmd_palette, capture_output=True, text=True)
        if res1.returncode != 0:
            return False

        # Pass 2: Apply palette with Bayer dither
        cmd_gif = [
            self.ffmpeg, "-y",
            "-i", str(video_or_image_path),
            "-i", str(palette_path),
            "-lavfi", f"{filter_str} [x]; [x][1:v] paletteuse=dither=bayer:bayer_scale=4",
            str(output_gif)
        ]
        res2 = subprocess.run(cmd_gif, capture_output=True, text=True)

        if palette_path.exists():
            try:
                palette_path.unlink()
            except Exception:
                pass

        return res2.returncode == 0
