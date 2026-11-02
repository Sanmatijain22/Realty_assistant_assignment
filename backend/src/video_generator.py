"""Video generation engine for Property Studio AI.

Orchestrates:
- Scene frame rendering with readable text overlays and category badges.
- Smooth transitions between property scenes.
- Audio synchronization (voiceover narration and ambient background music).
- H.264 MP4 export at 1280x720 resolution.
- Temporary file management and cleanup.
"""

import subprocess
import shutil
import tempfile
import time
from pathlib import Path
from typing import Optional, Callable, Dict, Any, List
import numpy as np
from PIL import Image

import imageio_ffmpeg
from proglog import ProgressBarLogger

from moviepy import VideoClip, ImageClip, CompositeVideoClip, AudioFileClip, concatenate_videoclips
import moviepy.video.fx as vfx

from .validators import PropertyInput
from .script_generator import VideoScript, SceneScript, generate_script
from .image_processor import render_scene_frame, render_scene_overlay_only, resize_and_crop_to_16_9, TARGET_WIDTH, TARGET_HEIGHT
from .audio_generator import generate_full_audio_track, generate_scene_narration, get_media_duration


class VideoGenerationError(Exception):
    """Raised when video compilation or encoding fails."""
    pass


class MoviePyProgressLogger(ProgressBarLogger):
    """Custom progress logger forwarding frame-by-frame rendering updates to frontend."""
    def __init__(self, callback: Optional[Callable[[float, str], None]], start_pct: float = 0.35, end_pct: float = 0.85):
        super().__init__()
        self.progress_callback = callback
        self.start_pct = start_pct
        self.end_pct = end_pct
        self.last_update_time = 0.0

    def callback(self, **kw):
        pass

    def bars_callback(self, bar, attr, value, old_value=None):
        if not self.progress_callback:
            return
        if bar == "frame_index" and attr == "index":
            total = self.bars.get("frame_index", {}).get("total", 1) or 1
            idx = min(value, total)
            now = time.time()
            if now - self.last_update_time > 0.35 or idx == total:
                self.last_update_time = now
                ratio = self.start_pct + (self.end_pct - self.start_pct) * (idx / total)
                pct = int(ratio * 100)
                self.progress_callback(
                    ratio,
                    f"Encoding H.264 video frames: {idx}/{total} frames ({pct}%)..."
                )


def create_cinematic_scene_clip(
    img_path: Path,
    scene: SceneScript,
    duration: float,
    scene_index: int,
    target_w: int = TARGET_WIDTH,
    target_h: int = TARGET_HEIGHT
) -> VideoClip:
    """Create a cinematic Full HD scene clip with subtle Ken Burns camera motion and static text overlay."""
    import cv2

    scale_oversize = 1.10
    base_w = int(target_w * scale_oversize)
    base_h = int(target_h * scale_oversize)

    # 1. Prepare high-resolution base photography
    base_img = resize_and_crop_to_16_9(Path(img_path), base_w, base_h).convert("RGB")
    base_rgb = np.array(base_img)

    # 2. Render static refined text overlay
    overlay_img = render_scene_overlay_only(scene, target_w, target_h)
    overlay_rgba = np.array(overlay_img)

    # Pre-slice overlay regions with active alpha and precalculate blend factors
    top_h = int(65 * (target_h / 1080.0))
    bot_y0 = int(800 * (target_h / 1080.0))

    alpha_top = overlay_rgba[0:top_h, :, 3:4].astype(np.float32) / 255.0
    rgb_top = overlay_rgba[0:top_h, :, :3].astype(np.float32)
    inv_top = 1.0 - alpha_top
    pre_top = rgb_top * alpha_top

    alpha_bot = overlay_rgba[bot_y0:target_h, :, 3:4].astype(np.float32) / 255.0
    rgb_bot = overlay_rgba[bot_y0:target_h, :, :3].astype(np.float32)
    inv_bot = 1.0 - alpha_bot
    pre_bot = rgb_bot * alpha_bot

    motion_type = scene_index % 4

    def make_frame(t):
        p = min(1.0, max(0.0, t / duration)) if duration > 0 else 0.0

        if motion_type == 0:
            # Mode 0: Gentle Zoom In (Centered)
            zoom = 1.0 + 0.05 * p
            cw = int(base_w / zoom)
            ch = int(base_h / zoom)
            cx = (base_w - cw) // 2
            cy = (base_h - ch) // 2
        elif motion_type == 1:
            # Mode 1: Gentle Pan Right + Drift Zoom
            zoom = 1.05 - 0.02 * p
            cw = int(base_w / zoom)
            ch = int(base_h / zoom)
            cx = int((base_w - cw) * (0.2 + 0.6 * p))
            cy = (base_h - ch) // 2
        elif motion_type == 2:
            # Mode 2: Gentle Zoom Out (Centered)
            zoom = 1.05 - 0.05 * p
            cw = int(base_w / zoom)
            ch = int(base_h / zoom)
            cx = (base_w - cw) // 2
            cy = (base_h - ch) // 2
        else:
            # Mode 3: Gentle Pan Left + Drift Zoom
            zoom = 1.03 + 0.02 * p
            cw = int(base_w / zoom)
            ch = int(base_h / zoom)
            cx = int((base_w - cw) * (0.8 - 0.6 * p))
            cy = (base_h - ch) // 2

        cx = max(0, min(base_w - cw, cx))
        cy = max(0, min(base_h - ch, cy))
        crop = base_rgb[cy:cy + ch, cx:cx + cw]

        frame = cv2.resize(crop, (target_w, target_h), interpolation=cv2.INTER_LINEAR)

        # Composite top watermark (fast pre-multiplied ROI blend)
        if top_h > 0:
            frame[0:top_h, :] = (frame[0:top_h, :].astype(np.float32) * inv_top + pre_top).astype(np.uint8)

        # Composite bottom caption panel (fast pre-multiplied ROI blend)
        if bot_y0 < target_h:
            frame[bot_y0:target_h, :] = (frame[bot_y0:target_h, :].astype(np.float32) * inv_bot + pre_bot).astype(np.uint8)

        return frame

    clip = VideoClip(make_frame, duration=duration)
    return clip


def generate_property_video(
    prop: PropertyInput,
    output_path: Path,
    script: Optional[VideoScript] = None,
    include_narration: bool = True,
    include_background_music: bool = True,
    fps: int = 24,
    progress_callback: Optional[Callable[[float, str], None]] = None,
    tts_tld: str = "co.in",
    tts_lang: str = "en",
    tts_slow: bool = False,
    tts_engine: str = "auto",
    tts_gender: str = "female",
    bg_music_volume: float = 0.12,
    sentence_gap: float = 0.3,
    ending_hold: float = 0.8,
    target_w: int = TARGET_WIDTH,
    target_h: int = TARGET_HEIGHT,
    ken_burns: bool = True,
) -> Path:
    """Generate a complete promotional property video MP4.
    
    Parameters:
    - prop: Validated PropertyInput object containing details and image paths
    - output_path: Destination path for the generated MP4 file
    - script: Optional pre-generated VideoScript; if None, generates default template script
    - include_narration: Whether to generate TTS narration
    - include_background_music: Whether to synthesize royalty-free ambient music
    - fps: Output frames per second (default 24)
    - progress_callback: Optional function(progress_ratio: float, status_text: str)
    - sentence_gap: Configurable gap in seconds between narration lines (default 0.3s)
    - ending_hold: Configurable visual hold in seconds after the final spoken sentence (default 0.8s)
    
    Returns:
    - Path to verified output MP4 file
    """
    def update_progress(ratio: float, text: str):
        if progress_callback:
            progress_callback(ratio, text)

    update_progress(0.05, "Validating input and preparing script...")

    if script is None:
        script = generate_script(prop)

    if not script.scenes:
        raise VideoGenerationError("Script contains no scenes to render.")

    # Use an isolated temporary directory for intermediate files
    temp_dir = Path(tempfile.mkdtemp(prefix="prop_video_"))
    
    try:
        total_scenes = len(script.scenes)
        scene_audio_files = []
        actual_durations = []

        # Step 1: Pre-generate TTS narration clips and measure their actual audio durations
        if include_narration:
            update_progress(0.10, "Synthesizing voice narration and measuring audio clips...")
            for idx, scene in enumerate(script.scenes):
                clean_voice = scene.voiceover.strip() if scene.voiceover else ""
                if clean_voice:
                    scene_audio_path = temp_dir / f"narration_scene_{idx+1}.mp3"
                    generated_path = generate_scene_narration(
                        scene=scene,
                        output_path=scene_audio_path,
                        tld=tts_tld,
                        lang=tts_lang,
                        slow=tts_slow,
                        engine_mode=tts_engine,
                        voice_gender=tts_gender
                    )
                    speech_dur = get_media_duration(generated_path) if (generated_path and generated_path.exists()) else 0.0
                    scene_audio_files.append(generated_path)
                    actual_durations.append(speech_dur)
                else:
                    scene_audio_files.append(None)
                    actual_durations.append(0.0)
        else:
            scene_audio_files = [None] * total_scenes
            actual_durations = [0.0] * total_scenes

        # Step 2: Build strict sequential narration schedule & calculate slide durations
        min_slide_duration = 3.0
        slide_durations = []
        narration_schedule = []
        curr_time = 0.0

        for idx, scene in enumerate(script.scenes):
            is_last = (idx == total_scenes - 1)
            speech_dur = actual_durations[idx]
            audio_path = scene_audio_files[idx]

            if speech_dur > 0.0 and audio_path and audio_path.exists():
                hold = ending_hold if is_last else sentence_gap
                slide_dur = max(min_slide_duration, speech_dur + hold)
                narr_start = curr_time
                narr_end = curr_time + speech_dur
            else:
                slide_dur = max(min_slide_duration, 4.0)
                narr_start = curr_time
                narr_end = curr_time

            scene.duration = slide_dur
            slide_durations.append(slide_dur)
            narration_schedule.append({
                "index": idx,
                "audio_path": audio_path,
                "duration": speech_dur,
                "start_time": narr_start,
                "end_time": narr_end,
                "slide_start": curr_time,
                "slide_duration": slide_dur
            })
            curr_time += slide_dur

        total_video_duration = curr_time
        script.estimated_duration = total_video_duration

        # Step 3: Prepare visual scene clips
        update_progress(0.28, "Preparing scene compositions and animations...")
        clips = []
        for idx, scene in enumerate(script.scenes):
            update_progress(
                0.28 + (0.07 * ((idx + 1) / total_scenes)),
                f"Preparing scene {idx + 1}/{total_scenes}: {scene.headline}..."
            )
            
            img_path = scene.image_path if hasattr(scene, "image_path") and scene.image_path else (prop.image_paths[idx % len(prop.image_paths)])
            if not Path(img_path).exists():
                raise VideoGenerationError(f"Image not found for scene {scene.scene_index}: {img_path}")

            slide_dur = slide_durations[idx]

            # Render scene clip with subtle Ken Burns camera motion or static fallback
            if ken_burns:
                clip = create_cinematic_scene_clip(
                    img_path=Path(img_path),
                    scene=scene,
                    duration=slide_dur,
                    scene_index=idx,
                    target_w=target_w,
                    target_h=target_h
                )
            else:
                frame_img = render_scene_frame(img_path, scene, target_w=target_w, target_h=target_h)
                frame_array = np.array(frame_img)
                clip = ImageClip(frame_array)
                if hasattr(clip, "with_duration"):
                    clip = clip.with_duration(slide_dur)
                else:
                    clip = clip.set_duration(slide_dur)

            # Smooth subtle fade-in transition for scenes after the first
            if idx > 0:
                fade_time = min(0.35, slide_dur * 0.10)
                if hasattr(clip, "with_effects"):
                    clip = clip.with_effects([vfx.FadeIn(fade_time)])
                elif hasattr(clip, "fadein"):
                    clip = clip.fadein(fade_time)

            clips.append(clip)

        update_progress(0.35, "Concatenating scenes into video timeline...")
        final_video = concatenate_videoclips(clips, method="compose")

        # Step 4: Export raw H.264 video file (video-only to eliminate audio deadlocks)
        temp_video_raw = temp_dir / "raw_video_track.mp4"
        moviepy_logger = MoviePyProgressLogger(progress_callback, start_pct=0.35, end_pct=0.85)

        final_video.write_videofile(
            str(temp_video_raw),
            fps=fps,
            codec="libx264",
            audio=False,  # Video-only encoding: prevents audio buffer stalls and deadlock
            preset="fast",
            threads=4,
            logger=moviepy_logger
        )

        # Cleanly release MoviePy clip resources
        try:
            final_video.close()
            for c in clips:
                c.close()
        except Exception:
            pass

        # Step 5: Assemble synchronized audio track (narration + ambient music)
        update_progress(0.85, "Synthesizing and balancing soundtrack...")
        audio_path = None
        if include_narration or include_background_music:
            try:
                audio_path = generate_full_audio_track(
                    script=script,
                    temp_dir=temp_dir,
                    include_narration=include_narration,
                    include_background_music=include_background_music,
                    narration_schedule=narration_schedule,
                    total_duration=total_video_duration,
                    tld=tts_tld,
                    lang=tts_lang,
                    slow=tts_slow,
                    engine_mode=tts_engine,
                    voice_gender=tts_gender,
                    bg_music_volume=bg_music_volume,
                    sentence_gap=sentence_gap,
                    ending_hold=ending_hold
                )
            except Exception as e:
                print(f"Audio assembly warning: {e}")
                audio_path = None

        # Step 6: Multiplex video and audio with direct FFmpeg subprocess
        update_progress(0.92, "Multiplexing final MP4 with AAC audio stream...")
        output_path.parent.mkdir(parents=True, exist_ok=True)
        ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()

        if audio_path and audio_path.exists():
            cmd = [
                ffmpeg_exe, "-y",
                "-i", str(temp_video_raw),
                "-i", str(audio_path),
                "-c:v", "copy",
                "-c:a", "aac",
                "-b:a", "192k",
                "-shortest",
                "-movflags", "+faststart",
                str(output_path)
            ]
        else:
            cmd = [
                ffmpeg_exe, "-y",
                "-i", str(temp_video_raw),
                "-c:v", "copy",
                "-an",
                "-movflags", "+faststart",
                str(output_path)
            ]

        res = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
        if res.returncode != 0:
            raise VideoGenerationError(f"FFmpeg muxing failed: {res.stderr}")

        # Step 7: Verify output MP4
        update_progress(0.97, "Verifying completed MP4 video file...")
        if not output_path.exists():
            raise VideoGenerationError(f"Video file was not created at {output_path}")

        file_size = output_path.stat().st_size
        if file_size < 1000:
            output_path.unlink(missing_ok=True)
            raise VideoGenerationError(f"Generated MP4 file is empty or corrupted ({file_size} bytes).")

        update_progress(1.0, "Video generated successfully!")
        return output_path

    except Exception as e:
        if isinstance(e, VideoGenerationError):
            raise
        raise VideoGenerationError(f"Video encoding failed: {str(e)}") from e

    finally:
        # Safely remove intermediate temp files
        try:
            shutil.rmtree(temp_dir, ignore_errors=True)
        except Exception:
            pass

