import os
import sys
import math
import time
import subprocess
from pathlib import Path
from typing import Dict, Any, Callable, Optional, Tuple
from .base_engine import LipSyncEngine

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from inference import RealLipSyncPipeline

class Wav2LipEngine(LipSyncEngine):
    """
    Wav2Lip model adapter with native AMD Radeon RX 9060 XT DirectML acceleration
    and automatic CPU fallback.
    """

    def __init__(self, models_dir: str, prefer_directml: bool = True):
        super().__init__("Wav2Lip", models_dir)
        self.prefer_directml = prefer_directml
        self.models_path = Path(models_dir)
        self.checkpoint_path = self.models_path / "wav2lip_gan.onnx"
        self.checkpoint_base = self.models_path / "wav2lip.onnx"
        self.yunet_model = self.models_path / "yunet.onnx"
        self._pipeline: Optional[RealLipSyncPipeline] = None

    def _get_pipeline(self) -> RealLipSyncPipeline:
        if self._pipeline is None:
            self._pipeline = RealLipSyncPipeline(
                models_dir=str(self.models_path),
                prefer_directml=self.prefer_directml
            )
        return self._pipeline

    def is_available(self) -> Tuple[bool, str]:
        """Check if ONNX runtime and model weights exist."""
        has_onnx = self.checkpoint_path.exists() or self.checkpoint_base.exists()

        if not has_onnx:
            return (
                False,
                f"Wav2Lip checkpoint not found in '{self.models_dir}'. Run scripts/download_models.py to install."
            )

        # Check inference runtime
        try:
            import onnxruntime as ort
            providers = ort.get_available_providers()
            if "DmlExecutionProvider" in providers and self.prefer_directml:
                return (True, "Ready (AMD DirectML GPU acceleration active)")
            elif "CPUExecutionProvider" in providers:
                return (True, "Ready (CPU inference mode)")
        except ImportError:
            pass

        return (False, "ONNX Runtime is not installed. Run setup_windows.bat.")

    def get_hardware_info(self) -> Dict[str, Any]:
        try:
            import onnxruntime as ort
            providers = ort.get_available_providers()
            if "DmlExecutionProvider" in providers and self.prefer_directml:
                return {
                    "backend": "DirectML (DirectX 12)",
                    "device": "AMD Radeon RX 9060 XT (16GB VRAM)",
                    "status": "Hardware Accelerated",
                    "accelerated": True
                }
            return {
                "backend": "ONNX Runtime CPU",
                "device": "System CPU",
                "status": "CPU Fallback Active",
                "accelerated": False
            }
        except Exception:
            return {
                "backend": "CPU Fallback",
                "device": "System CPU",
                "status": "Active",
                "accelerated": False
            }

    def generate(
        self,
        image_path: str,
        audio_path: str,
        output_video_path: str,
        settings: Dict[str, Any],
        progress_callback: Optional[Callable[[int, str], None]] = None
    ) -> Dict[str, Any]:
        pipeline = self._get_pipeline()
        fps = settings.get("fps", 25)
        quality = settings.get("quality", "high")
        output_gif = settings.get("output_gif_path")

        pads = (
            settings.get("face_padding_top", 0),
            settings.get("face_padding_bottom", 10),
            settings.get("face_padding_left", 0),
            settings.get("face_padding_right", 0)
        )

        res = pipeline.generate(
            image_path=str(image_path),
            audio_path=str(audio_path),
            output_video_path=str(output_video_path),
            output_gif_path=str(output_gif) if output_gif else None,
            fps=fps,
            quality=quality,
            pads=pads,
            progress_cb=progress_callback
        )

        return {
            "success": True,
            "duration": res["duration"],
            "frames": res["frames_generated"],
            "fps": res["fps"],
            "elapsed_time": res["total_time_seconds"],
            "inference_time": res["inference_time_seconds"],
            "fps_speed": res["fps_speed"],
            "backend": res["backend"],
            "device": self.get_hardware_info()["device"],
            "model": "Wav2Lip Neural ONNX",
            "verification": res.get("verification", {})
        }

