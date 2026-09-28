# CGH Local LipSync Studio - Troubleshooting Guide

## 1. AMD Radeon RX 9060 XT Not Showing DirectML Acceleration
- **Cause**: The `onnxruntime-directml` package was not installed, or Windows graphics drivers need updating.
- **Solution**:
  1. Open AMD Adrenalin Edition software and verify you have the latest drivers installed.
  2. In your virtual environment, run:
     ```cmd
     pip install --upgrade onnxruntime-directml
     ```
  3. Run `scripts\diagnostic.bat` to verify `DmlExecutionProvider` is detected.

## 2. FFmpeg Is Not Recognized
- **Symptom**: Error message "FFmpeg not found in PATH" during setup or generation.
- **Solution**:
  1. Install via Windows Package Manager:
     ```cmd
     winget install "Gyan.FFmpeg"
     ```
  2. Restart your command prompt or terminal so the updated PATH takes effect.

## 3. "No Face Detected" Warning on Cartoon/Anime Image
- **Cause**: Stylized anime or cartoon characters with unconventional features might need padding adjustment.
- **Solution**:
  1. In **Advanced Settings**, increase **Face Padding (Bottom)** to `15` or `20`.
  2. Ensure the character image is front-facing with the mouth clearly visible.
  3. Minimum resolution of 256x256 is recommended.

## 4. Video Generated But No Audio in Output
- **Cause**: Input audio file had an unsupported sampling rate or was muted.
- **Solution**:
  - The Studio automatically normalizes all audio to 16,000Hz mono WAV. Ensure your audio file plays audibly in the Step 2 audio player before clicking Generate.

## 5. Animated GIF File Size Is Too Large
- **Solution**:
  1. In **Advanced Settings**, lower the **GIF FPS** from `15` to `12` or `10`.
  2. Set **Output Quality** to `Standard` or select **720p** resolution.
  3. GIFs longer than 15 seconds are automatically capped to maintain reasonable web file sizes.
