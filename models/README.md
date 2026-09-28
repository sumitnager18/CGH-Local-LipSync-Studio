# Models Directory for CGH Local LipSync Studio

This directory holds the offline AI model checkpoints.

## Supported Model Checkpoints

### 1. Wav2Lip (ONNX DirectML - Primary for AMD Radeon RX 9060 XT 16GB)
- **File**: `wav2lip.onnx`
- **Location**: `models/wav2lip.onnx`
- **Size**: ~140 MB
- **License**: BSD-3-Clause / Academic Research
- **Attribution**: K R Prajwal, Rudrabha Mukhopadhyay, Vinay P. Namboodiri, C.V. Jawahar ("A Lip Sync Expert Is All You Need for Speech to Lip Generation In The Wild", ACM Multimedia 2020).
- **Download**:
  Run `python scripts/download_models.py` or download the ONNX checkpoint directly.

### 2. S3FD Face Detector (ONNX)
- **File**: `s3fd.onnx`
- **Location**: `models/s3fd.onnx`
- **Size**: ~85 MB
- **License**: MIT
- **Purpose**: Fast, robust face and landmark detection for portraits, cartoons, and illustrations.

### 3. Wav2Lip + GAN (PyTorch) [Optional]
- **File**: `wav2lip_gan.pth`
- **Location**: `models/wav2lip_gan.pth`
- **Size**: ~435 MB
- **License**: BSD-3-Clause

### 4. MuseTalk (Diffusion Latent Inpainting) [Optional / Experimental]
- **Directory**: `models/musetalk/`
- **Files**: `musetalk.json`, `pytorch_model.bin`
- **License**: MIT
- **Note**: MuseTalk requires large VRAM and specific Whisper / Diffusers dependencies. On AMD RX 9060 XT, Wav2Lip with DirectML is the primary recommended engine.

### 5. Built-in CPU Fallback Engine
- Requires **NO external weights**. Works immediately out of the box on any CPU using signal formant and envelope analysis.
