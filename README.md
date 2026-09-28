# CGH Local LipSync Studio
**Brand:** ComputerGuruHub  
**Subtitle:** Create talking-character videos locally with your own image and voice.

A 100% locally running AI lip-sync application engineered for Windows 10 and Windows 11 PCs, optimized specifically for **AMD Radeon RX 9060 XT 16GB GPU** using Microsoft DirectML (DirectX 12) hardware acceleration, with automatic CPU fallback.

---

## Key Features

- **100% Local & Offline**: No cloud APIs (no Gemini, no OpenAI, no Replicate, no ElevenLabs). Zero data leaves your computer.
- **AMD GPU Acceleration**: Fully optimized for AMD Radeon RX 9060 XT 16GB via ONNX Runtime DirectML.
- **CPU Fallback**: Guaranteed to generate talking videos even without GPU acceleration or while weights are downloading.
- **Hindi, English & Hinglish Ready**: Synchronizes mouth movements directly to raw audio waveforms without requiring speech-to-text models.
- **Multi-Format Output**: Generates both MP4 video and 2-pass palette-optimized animated GIFs.
- **Transparent PNG Support**: Preserves transparent character backgrounds for OBS, animations, and video editing.
- **Beginner-Friendly UI**: Simple 5-step workflow: Image -> Audio -> Output -> Generate -> Preview & Save.

---

## Hardware Target & Requirements

- **Operating System**: Windows 10 or Windows 11 (64-bit)
- **GPU**: AMD Radeon RX 9060 XT 16GB (or any DirectX 12 compatible GPU / CPU)
- **RAM**: 16GB minimum (32GB recommended)
- **Storage**: 5GB free space on SSD or NVMe
- **Python**: Python 3.10 (recommended)
- **FFmpeg**: Installed and on system PATH

---

## Quick Start Guide for Windows

### Step 1: Automated Setup
Open PowerShell or Command Prompt in the project folder and run:
```cmd
scripts\setup_windows.bat
```
This script automatically:
1. Verifies Windows 10/11 version and 64-bit architecture.
2. Checks Python 3.10 and FFmpeg.
3. Detects your AMD Radeon RX 9060 XT GPU.
4. Creates an isolated Python virtual environment (`venv`).
5. Installs `onnxruntime-directml` for AMD DirectX 12 hardware acceleration.
6. Downloads or verifies local model weights into `models/`.
7. Executes a benchmark inference test.

### Step 2: Start the Studio
Double-click:
```cmd
scripts\start_app.bat
```
Your browser will open to:
```
http://localhost:3000
```

### Step 3: Stop the Studio
Double-click:
```cmd
scripts\stop_app.bat
```

---

## Supported Input & Output Formats

| Type | Supported Formats |
| :--- | :--- |
| **Character Image** | PNG (including transparent alpha), JPG, JPEG, WebP |
| **Speech Audio** | WAV, MP3, M4A, FLAC, OGG (Hindi, English, Hinglish) |
| **Output Video** | MP4 (H.264 / AAC, 24/25/30 FPS, Original / 720p / 1080p) |
| **Output Animation** | Animated GIF (Bayer dithered palettegen/paletteuse) |

---

## Model Licensing & Attribution

- **Wav2Lip**: BSD-3-Clause / Academic Research (Prajwal et al., ACM Multimedia 2020).
- **DirectML**: MIT License (Microsoft Corporation).
- **ONNX Runtime**: MIT License.
- **FFmpeg**: LGPL / GPL.

---

## Troubleshooting

For common issues and solutions regarding AMD GPU drivers, DirectML, and FFmpeg, refer to `TROUBLESHOOTING.md`.
