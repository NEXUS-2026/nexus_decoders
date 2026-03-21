"""
Video compression service for reducing file sizes
"""
import os
import subprocess
from pathlib import Path
import logging
from typing import Optional

logger = logging.getLogger(__name__)

class VideoCompressor:
    def __init__(self):
        self.ffmpeg_path = self._get_ffmpeg_path()
        
    def _get_ffmpeg_path(self) -> str:
        """Get FFmpeg path - try common locations"""
        common_paths = [
            "ffmpeg",  # If in PATH
            r"C:\ffmpeg\bin\ffmpeg.exe",  # Windows common installation
            r"C:\Program Files\ffmpeg\bin\ffmpeg.exe",  # Windows Program Files
            "/usr/bin/ffmpeg",  # Linux
            "/usr/local/bin/ffmpeg",  # macOS
        ]
        
        for path in common_paths:
            try:
                result = subprocess.run([path, "-version"], 
                                      capture_output=True, 
                                      text=True, 
                                      timeout=5)
                if result.returncode == 0:
                    logger.info(f"Found FFmpeg at: {path}")
                    return path
            except (subprocess.TimeoutExpired, FileNotFoundError):
                continue
                
        # Default to just 'ffmpeg' and let it fail if not found
        logger.warning("FFmpeg not found in common paths, using 'ffmpeg'")
        return "ffmpeg"
    
    def compress_video(
        self, 
        input_path: str, 
        output_path: str,
        target_size_mb: Optional[int] = 10,
        quality: str = "medium"
    ) -> bool:
        """
        Compress video to target size or quality
        
        Args:
            input_path: Path to input video
            output_path: Path for compressed output
            target_size_mb: Target file size in MB (approximate)
            quality: Compression quality (low, medium, high)
        """
        try:
            # Ensure output directory exists
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            
            # Compression settings based on quality
            quality_settings = {
                "low": {
                    "crf": "35",  # Constant Rate Factor (lower = better quality)
                    "preset": "fast",
                    "audio_bitrate": "64k"
                },
                "medium": {
                    "crf": "28",
                    "preset": "medium", 
                    "audio_bitrate": "96k"
                },
                "high": {
                    "crf": "23",
                    "preset": "slow",
                    "audio_bitrate": "128k"
                }
            }
            
            settings = quality_settings.get(quality, quality_settings["medium"])
            
            # Build FFmpeg command
            cmd = [
                self.ffmpeg_path,
                "-i", input_path,
                "-c:v", "libx264",  # Video codec
                "-preset", settings["preset"],  # Encoding speed vs compression
                "-crf", settings["crf"],  # Quality (18-28 is good range)
                "-c:a", "aac",  # Audio codec
                "-b:a", settings["audio_bitrate"],  # Audio bitrate
                "-y",  # Overwrite output file
                output_path
            ]
            
            logger.info(f"Compressing video: {input_path} -> {output_path}")
            logger.info(f"Command: {' '.join(cmd)}")
            
            # Run compression
            result = subprocess.run(cmd, capture_output=True, text=True)
            
            if result.returncode == 0:
                # Check compression ratio
                original_size = os.path.getsize(input_path) / (1024 * 1024)  # MB
                compressed_size = os.path.getsize(output_path) / (1024 * 1024)  # MB
                compression_ratio = (1 - compressed_size / original_size) * 100
                
                logger.info(f"Compression successful!")
                logger.info(f"Original: {original_size:.2f} MB")
                logger.info(f"Compressed: {compressed_size:.2f} MB")
                logger.info(f"Compression ratio: {compression_ratio:.1f}%")
                
                return True
            else:
                logger.error(f"FFmpeg error: {result.stderr}")
                return False
                
        except Exception as e:
            logger.error(f"Video compression failed: {str(e)}")
            return False
    
    def compress_for_email(
        self, 
        input_path: str, 
        output_path: Optional[str] = None,
        max_size_mb: int = 25  # Gmail attachment limit is 25MB
    ) -> Optional[str]:
        """
        Compress video for email attachment with size limit
        
        Returns:
            Path to compressed video, or None if compression failed
        """
        if not os.path.exists(input_path):
            logger.error(f"Input video not found: {input_path}")
            return None
            
        # Generate output path if not provided
        if output_path is None:
            input_file = Path(input_path)
            output_path = str(input_file.parent / f"{input_file.stem}_compressed{input_file.suffix}")
        
        # Check original size
        original_size_mb = os.path.getsize(input_path) / (1024 * 1024)
        
        # If already under limit, just copy
        if original_size_mb <= max_size_mb:
            logger.info(f"Video already under size limit ({original_size_mb:.2f} MB)")
            import shutil
            shutil.copy2(input_path, output_path)
            return output_path
        
        # Try different compression levels
        quality_levels = ["high", "medium", "low"]
        
        for quality in quality_levels:
            logger.info(f"Trying {quality} quality compression...")
            
            if self.compress_video(input_path, output_path, quality=quality):
                compressed_size_mb = os.path.getsize(output_path) / (1024 * 1024)
                
                if compressed_size_mb <= max_size_mb:
                    logger.info(f"Successfully compressed to {compressed_size_mb:.2f} MB")
                    return output_path
                else:
                    logger.info(f"Still too large ({compressed_size_mb:.2f} MB), trying lower quality...")
                    # Remove failed attempt
                    if os.path.exists(output_path):
                        os.remove(output_path)
        
        logger.error(f"Could not compress video under {max_size_mb} MB limit")
        return None

# Global compressor instance
video_compressor = VideoCompressor()
