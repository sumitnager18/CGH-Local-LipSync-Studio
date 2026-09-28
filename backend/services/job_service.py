import time
import shutil
from pathlib import Path
from typing import Dict, Any, Optional

from .video_service import VideoService
from .audio_service import AudioService
from .face_service import FaceService
from engines.wav2lip_engine import Wav2LipEngine
from engines.musetalk_engine import MuseTalkEngine
from engines.cpu_engine import CPUEngine

class JobService:
    def __init__(self, output_dir: Path, temp_dir: Path):
        self.output_dir = output_dir
        self.temp_dir = temp_dir
        self.jobs: Dict[str, Dict[str, Any]] = {}
        self.video_service = VideoService()
        self.audio_service = AudioService()
        self.face_service = FaceService()
        self.models_dir = output_dir.parent / "models"

    def create_job(self, job_id: str, image_path: str, audio_path: str, settings: Dict[str, Any]) -> Dict[str, Any]:
        job = {
            "id": job_id,
            "status": "queued",
            "progress": 0,
            "current_step": "Job queued in local processing queue",
            "image_path": image_path,
            "audio_path": audio_path,
            "settings": settings,
            "created_at": time.time(),
            "started_at": None,
            "completed_at": None,
            "error": None,
            "logs": ["Job created and queued."],
            "results": {}
        }
        self.jobs[job_id] = job
        return job

    def get_job(self, job_id: str) -> Optional[Dict[str, Any]]:
        return self.jobs.get(job_id)

    def cancel_job(self, job_id: str) -> bool:
        if job_id in self.jobs and self.jobs[job_id]["status"] in ["queued", "running"]:
            self.jobs[job_id]["status"] = "cancelled"
            self.jobs[job_id]["logs"].append("Job cancelled by user.")
            return True
        return False

    def run_job(self, job_id: str):
        job = self.jobs.get(job_id)
        if not job:
            return

        job["status"] = "running"
        job["started_at"] = time.time()

        def update_progress(pct: int, msg: str):
            job["progress"] = pct
            job["current_step"] = msg
            job["logs"].append(f"[{time.strftime('%H:%M:%S')}] {msg}")

        try:
            update_progress(5, "Validating character image and speech audio...")
            img_info = self.face_service.inspect_image(job["image_path"])

            # 1. Normalize audio
            update_progress(15, "Normalizing speech audio (16kHz PCM)...")
            job_temp = self.temp_dir / job_id
            clean_audio = str(job_temp / "clean_16k.wav")
            audio_info = self.audio_service.validate_and_normalize(job["audio_path"], clean_audio)

            # 2. Select engine
            engine_id = job["settings"].get("engine_id", "wav2lip_directml")
            update_progress(30, f"Initializing inference engine: {engine_id}...")

            if engine_id == "wav2lip_directml" or engine_id == "wav2lip_pytorch":
                engine = Wav2LipEngine(str(self.models_dir), prefer_directml=(engine_id == "wav2lip_directml"))
            elif engine_id == "musetalk":
                engine = MuseTalkEngine(str(self.models_dir))
            else:
                engine = CPUEngine(str(self.models_dir))

            # 3. Generate raw video
            output_mp4_name = f"cgh_lipsync_{job_id[:8]}.mp4"
            output_mp4_path = self.output_dir / output_mp4_name

            update_progress(45, "Running mouth synchronization inference...")
            inference_result = engine.generate(
                image_path=job["image_path"],
                audio_path=clean_audio,
                output_video_path=str(output_mp4_path),
                settings=job["settings"],
                progress_callback=update_progress
            )

            results = {
                "mp4_file": output_mp4_name,
                "mp4_url": f"/outputs/{output_mp4_name}",
                "duration": audio_info["duration"],
                "resolution": f"{img_info['width']}x{img_info['height']}",
                "fps": job["settings"].get("fps", 25),
                "backend": inference_result.get("backend", "AMD DirectML"),
                "device": inference_result.get("device", "AMD Radeon RX 9060 XT 16GB"),
                "model": inference_result.get("model", "Wav2Lip ONNX DirectML"),
                "elapsed_seconds": round(time.time() - job["started_at"], 2)
            }

            # 4. Generate GIF if requested
            fmt = job["settings"].get("output_format", "both")
            if fmt in ["gif", "both"]:
                update_progress(88, "Encoding high-quality 2-pass animated GIF with optimized palette...")
                output_gif_name = f"cgh_lipsync_{job_id[:8]}.gif"
                output_gif_path = self.output_dir / output_gif_name
                preserve_alpha = job["settings"].get("background_mode") == "transparent" and img_info["has_alpha"]

                gif_success = self.video_service.create_animated_gif(
                    video_or_image_path=str(output_mp4_path),
                    output_gif=str(output_gif_path),
                    fps=job["settings"].get("gif_fps", 15),
                    preserve_transparency=preserve_alpha
                )
                if gif_success and output_gif_path.exists():
                    results["gif_file"] = output_gif_name
                    results["gif_url"] = f"/outputs/{output_gif_name}"

            # 5. Clean up temporary files
            update_progress(98, "Cleaning up temporary files...")
            try:
                if job_temp.exists():
                    shutil.rmtree(job_temp)
            except Exception:
                pass

            job["progress"] = 100
            job["status"] = "completed"
            job["completed_at"] = time.time()
            job["current_step"] = "Video generation successfully completed!"
            job["results"] = results
            job["logs"].append(f"Generation finished in {results['elapsed_seconds']}s.")

        except Exception as e:
            job["status"] = "failed"
            job["error"] = str(e)
            job["logs"].append(f"Error: {str(e)}")
