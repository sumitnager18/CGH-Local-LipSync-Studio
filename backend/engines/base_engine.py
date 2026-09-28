import abc
from typing import Dict, Any, Callable, Optional

class LipSyncEngine(abc.ABC):
    """
    Abstract base engine for CGH Local LipSync Studio.
    All local model adapters (Wav2Lip, MuseTalk, CPU fallback) inherit from this interface.
    """

    def __init__(self, name: str, models_dir: str):
        self.name = name
        self.models_dir = models_dir

    @abc.abstractmethod
    def is_available(self) -> tuple[bool, str]:
        """
        Check if the model dependencies, weights, and hardware backend are available.
        Returns (is_ready, message).
        """
        raise NotImplementedError

    @abc.abstractmethod
    def generate(
        self,
        image_path: str,
        audio_path: str,
        output_video_path: str,
        settings: Dict[str, Any],
        progress_callback: Optional[Callable[[int, str], None]] = None
    ) -> Dict[str, Any]:
        """
        Execute the lip sync generation pipeline:
        1. Read image and audio
        2. Detect face and bounding box
        3. Preprocess audio to 16kHz mel/features
        4. Run model inference
        5. Blend mouth back into frame
        6. Encode to video via FFmpeg
        """
        raise NotImplementedError

    def get_hardware_info(self) -> Dict[str, Any]:
        """Return details about device being used (e.g. AMD DirectML vs CPU)."""
        return {"backend": "cpu", "device_name": "CPU Fallback"}
