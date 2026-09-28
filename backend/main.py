from fastapi import FastAPI, UploadFile, File, Form, BackgroundTasks, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
import os
import shutil
import uuid
import sys
from pathlib import Path
from typing import Optional

# Add parent directory to sys.path
sys.path.insert(0, str(Path(__file__).parent))

from services.hardware_service import HardwareService
from services.job_service import JobService
from services.video_service import VideoService
from engines.wav2lip_engine import Wav2LipEngine
from engines.musetalk_engine import MuseTalkEngine
from engines.cpu_engine import CPUEngine

app = FastAPI(
    title="CGH Local LipSync Studio Backend",
    description="Local AI lip-sync backend for ComputerGuruHub. Runs completely offline on Windows 10/11 with AMD RX 9060 XT GPU DirectML or CPU fallback.",
    version="1.0.0"
)

# Comprehensive CORS enabled for local frontend access from any local port or browser
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD"],
    allow_headers=["*"],
    expose_headers=["*"],
)

BASE_DIR = Path(__file__).resolve().parent.parent
OUTPUTS_DIR = BASE_DIR / "outputs"
TEMP_DIR = BASE_DIR / "temp"
MODELS_DIR = BASE_DIR / "models"
PUBLIC_DIR = BASE_DIR / "public"

OUTPUTS_DIR.mkdir(parents=True, exist_ok=True)
TEMP_DIR.mkdir(parents=True, exist_ok=True)
MODELS_DIR.mkdir(parents=True, exist_ok=True)

# Mount outputs for direct local viewing
app.mount("/outputs", StaticFiles(directory=str(OUTPUTS_DIR)), name="outputs")

hardware_service = HardwareService()
job_service = JobService(output_dir=OUTPUTS_DIR, temp_dir=TEMP_DIR)
video_service = VideoService()

@app.get("/api/health")
def health_check():
    """Backend health check returning operational status, GPU target, and model availability."""
    models_info = hardware_service.check_installed_models(MODELS_DIR)
    return {
        "status": "healthy",
        "backend": "Python FastAPI (Local Windows Engine)",
        "version": "1.0.0",
        "app": "CGH Local LipSync Studio",
        "brand": "ComputerGuruHub",
        "host": "127.0.0.1:8000",
        "offline_mode": True,
        "api_keys_required": False,
        "hardware_target": "AMD Radeon RX 9060 XT 16GB (DirectML)",
        "models_installed": models_info
    }

@app.get("/api/diagnostics")
def get_diagnostics():
    return hardware_service.get_system_diagnostics()

@app.get("/api/samples")
def get_samples():
    """Returns available starter character portraits and speech audio files."""
    return {
        "characters": [
            {
                "id": "cgh_presenter",
                "name": "ComputerGuruHub Tech Explainer",
                "description": "Front-facing tech educator character with high-contrast portrait.",
                "imageUrl": "/samples/cgh_presenter.png",
            },
            {
                "id": "hindi_teacher",
                "name": "Hindi Educational Character",
                "description": "Friendly educational teacher for Hindi tutorial videos.",
                "imageUrl": "/samples/hindi_teacher.png",
            },
            {
                "id": "cartoon_robot",
                "name": "Cartoon Character (Transparent PNG)",
                "description": "Cute animated avatar with transparent alpha background.",
                "imageUrl": "/samples/cartoon_robot.png",
                "transparent": True,
            },
        ],
        "audios": [
            {
                "id": "hindi_sample",
                "name": "Hindi Speech: 'नमस्ते, ComputerGuruHub में आपका स्वागत है!'",
                "language": "Hindi",
                "duration": "3.5s",
                "audioUrl": "/samples/hindi_speech_sample.wav",
            },
            {
                "id": "english_sample",
                "name": "English Speech: 'Welcome to CGH Local LipSync Studio!'",
                "language": "English",
                "duration": "4.0s",
                "audioUrl": "/samples/english_speech_sample.wav",
            },
        ],
    }

@app.get("/api/models")
def list_models():
    return {
        "installed": hardware_service.check_installed_models(MODELS_DIR),
        "available_engines": [
            {
                "id": "wav2lip_directml",
                "name": "Wav2Lip (ONNX DirectML - AMD RX 9060 XT Optimized)",
                "description": "Recommended for AMD Radeon RX 9060 XT 16GB. Fast, native Windows DirectX 12 hardware acceleration.",
                "supported": True,
                "license": "BSD-3-Clause / Academic",
                "recommended": True
            },
            {
                "id": "wav2lip_pytorch",
                "name": "Wav2Lip (PyTorch DirectML / ROCm)",
                "description": "Standard PyTorch implementation using torch-directml or CPU.",
                "supported": True,
                "license": "BSD-3-Clause / Academic",
                "recommended": False
            },
            {
                "id": "musetalk",
                "name": "MuseTalk (High-Resolution Experimental)",
                "description": "Whisper-based inpainting. Requires large VRAM and specific dependencies. Checked locally.",
                "supported": hardware_service.check_musetalk_supported(),
                "license": "MIT / Academic",
                "recommended": False
            },
            {
                "id": "cpu_fallback",
                "name": "CPU Fallback Engine (No Model Download Required)",
                "description": "Audio envelope and formant-driven mouth synchronization. Guaranteed to work on any PC without heavy downloads.",
                "supported": True,
                "license": "Open Source / CGH",
                "recommended": False
            }
        ]
    }

@app.post("/api/generate")
async def start_generation(
    background_tasks: BackgroundTasks,
    image: Optional[UploadFile] = File(None),
    audio: Optional[UploadFile] = File(None),
    sample_image: Optional[str] = Form(None),
    sample_audio: Optional[str] = Form(None),
    output_format: str = Form("both"), # "mp4", "gif", "both"
    resolution: str = Form("original"), # "original", "720p", "1080p"
    fps: int = Form(25),
    quality: str = Form("high"),
    background_mode: str = Form("original"), # "original", "transparent"
    engine_id: str = Form("wav2lip_directml"),
    face_padding_top: int = Form(0),
    face_padding_bottom: int = Form(10),
    face_padding_left: int = Form(0),
    face_padding_right: int = Form(0),
    face_index: int = Form(0),
    gif_fps: int = Form(15)
):
    job_id = str(uuid.uuid4())
    job_temp_dir = TEMP_DIR / job_id
    job_temp_dir.mkdir(parents=True, exist_ok=True)

    # 1. Resolve Image (either uploaded or built-in sample)
    image_path = None
    if image and image.filename:
        img_ext = Path(image.filename).suffix.lower()
        if img_ext not in [".png", ".jpg", ".jpeg", ".webp"]:
            raise HTTPException(status_code=400, detail=f"Unsupported image format: {img_ext}")
        image_path = job_temp_dir / f"input_image{img_ext}"
        with open(image_path, "wb") as f:
            shutil.copyfileobj(image.file, f)
    elif sample_image:
        clean_sample = sample_image.lstrip("/")
        candidate = PUBLIC_DIR / clean_sample
        if not candidate.exists():
            candidate = BASE_DIR / clean_sample
        if candidate.exists():
            image_path = candidate
        else:
            raise HTTPException(status_code=400, detail=f"Sample image not found: {sample_image}")
    else:
        raise HTTPException(status_code=400, detail="Character image is required (upload or sample).")

    # 2. Resolve Audio (either uploaded or built-in sample)
    audio_path = None
    if audio and audio.filename:
        aud_ext = Path(audio.filename).suffix.lower()
        if aud_ext not in [".wav", ".mp3", ".m4a", ".flac", ".ogg"]:
            raise HTTPException(status_code=400, detail=f"Unsupported audio format: {aud_ext}")
        audio_path = job_temp_dir / f"input_audio{aud_ext}"
        with open(audio_path, "wb") as f:
            shutil.copyfileobj(audio.file, f)
    elif sample_audio:
        clean_sample = sample_audio.lstrip("/")
        candidate = PUBLIC_DIR / clean_sample
        if not candidate.exists():
            candidate = BASE_DIR / clean_sample
        if candidate.exists():
            audio_path = candidate
        else:
            raise HTTPException(status_code=400, detail=f"Sample audio not found: {sample_audio}")
    else:
        raise HTTPException(status_code=400, detail="Speech audio is required (upload or sample).")

    settings = {
        "output_format": output_format,
        "resolution": resolution,
        "fps": fps,
        "quality": quality,
        "background_mode": background_mode,
        "engine_id": engine_id,
        "face_padding": [face_padding_top, face_padding_bottom, face_padding_left, face_padding_right],
        "face_index": face_index,
        "gif_fps": gif_fps
    }

    job = job_service.create_job(
        job_id=job_id,
        image_path=str(image_path),
        audio_path=str(audio_path),
        settings=settings
    )

    background_tasks.add_task(job_service.run_job, job_id)

    # Return both jobId and job_id for frontend compatibility
    return {"jobId": job_id, "job_id": job_id, "status": "queued"}

@app.get("/api/jobs/{job_id}")
def get_job_status(job_id: str):
    job = job_service.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job

@app.post("/api/jobs/{job_id}/cancel")
def cancel_job(job_id: str):
    success = job_service.cancel_job(job_id)
    return {"success": success}

@app.post("/api/test-inference")
async def test_inference(request: Request, engine_id: Optional[str] = None):
    """Runs a quick 1-second benchmark test on the detected hardware."""
    # Try reading from JSON body if present
    target_engine = engine_id or "wav2lip_directml"
    try:
        body = await request.json()
        if isinstance(body, dict) and "engine_id" in body:
            target_engine = body["engine_id"]
    except Exception:
        pass

    return hardware_service.run_test_inference(target_engine, TEMP_DIR, OUTPUTS_DIR)

@app.get("/api/download/{filename}")
def download_file(filename: str):
    safe_name = Path(filename).name
    file_path = OUTPUTS_DIR / safe_name
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Requested file not found")
    return FileResponse(path=str(file_path), filename=safe_name)

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    print(f"Starting CGH Local LipSync Studio backend on http://127.0.0.1:{port}")
    uvicorn.run("main:app", host="127.0.0.1", port=port, reload=False)
