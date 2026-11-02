import sys
import os
from pathlib import Path
import json
import uuid
import time
import threading
from typing import Dict, Any, Optional, List
from datetime import datetime
from PIL import Image

# Ensure backend root and backend/src are on sys.path
BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.core.config import settings
from app.schemas.property import PropertyValidateRequest, PropertyValidateResponse, ImageItem
from app.schemas.video import VideoCustomization, VideoGenerateRequest, JobStatusResponse

from src.validators import validate_property_input, PropertyImage, ValidationError
from src.script_generator import generate_script, VideoScript
from src.video_generator import generate_property_video, VideoGenerationError
from src.audio_generator import generate_tts_audio, get_media_duration
from src.image_classifier import detect_image_category

JOBS_FILE = settings.output_dir / "jobs_registry.json"
THUMBNAILS_DIR = settings.output_dir / "thumbnails"
VOICE_PREVIEWS_DIR = settings.output_dir / "voice_previews"

THUMBNAILS_DIR.mkdir(parents=True, exist_ok=True)
VOICE_PREVIEWS_DIR.mkdir(parents=True, exist_ok=True)

# In-memory thread-safe jobs store
_jobs_lock = threading.Lock()
_jobs: Dict[str, Dict[str, Any]] = {}


def _save_jobs_to_disk():
    try:
        serializable = {}
        for jid, data in _jobs.items():
            copy_data = dict(data)
            # Remove raw objects if any
            if "script_obj" in copy_data:
                del copy_data["script_obj"]
            serializable[jid] = copy_data
        with open(JOBS_FILE, "w", encoding="utf-8") as f:
            json.dump(serializable, f, indent=2, default=str)
    except Exception as e:
        print(f"Error saving jobs to disk: {e}")


def _load_jobs_from_disk():
    global _jobs
    if JOBS_FILE.exists():
        try:
            with open(JOBS_FILE, "r", encoding="utf-8") as f:
                _jobs = json.load(f)
        except Exception as e:
            print(f"Error loading jobs from disk: {e}")
            _jobs = {}


_load_jobs_from_disk()


class VideoService:
    @staticmethod
    def validate_property(request: PropertyValidateRequest) -> PropertyValidateResponse:
        """Validates listing specifications and verifies photographic assets."""
        errors = []

        if not request.name.strip():
            errors.append("Property name is required.")
        if not request.location.strip():
            errors.append("Property location is required.")
        if not request.price.strip():
            errors.append("Property price is required.")

        # Resolve image paths
        resolved_images = []
        raw_paths = []
        if request.images:
            for img in request.images:
                p = Path(img.path)
                if not p.is_absolute():
                    p = (settings.upload_dir / img.path).resolve()
                if p.exists():
                    resolved_images.append(PropertyImage(path=p, category=img.category))
                    raw_paths.append(str(p))
                else:
                    errors.append(f"Image not found: {img.filename or img.path}")
        elif request.image_paths:
            for p_str in request.image_paths:
                p = Path(p_str)
                if not p.is_absolute():
                    p = (settings.upload_dir / p_str).resolve()
                if p.exists():
                    resolved_images.append(PropertyImage(path=p, category=None))
                    raw_paths.append(str(p))
                else:
                    errors.append(f"Image not found: {p_str}")

        if len(resolved_images) < 4:
            errors.append(f"At least 4 property photographs are required (received {len(resolved_images)}).")
        elif len(resolved_images) > 12:
            errors.append(f"Maximum 12 photographs allowed (received {len(resolved_images)}).")

        if errors:
            return PropertyValidateResponse(
                valid=False,
                message="Property validation failed. Please check the requirements.",
                errors=errors
            )

        try:
            validated = validate_property_input(
                name=request.name,
                location=request.location,
                price=request.price,
                property_type=request.property_type,
                features=request.features,
                call_to_action=request.call_to_action,
                image_paths=resolved_images,
                bedrooms=request.bedrooms,
                description=request.description
            )
            return PropertyValidateResponse(
                valid=True,
                message="Property specifications successfully validated.",
                property_data={
                    "name": validated.name,
                    "location": validated.location,
                    "price": validated.price,
                    "property_type": validated.property_type,
                    "features": validated.features,
                    "call_to_action": validated.call_to_action,
                    "bedrooms": validated.bedrooms,
                    "description": validated.description,
                    "image_count": len(validated.image_paths)
                }
            )
        except ValidationError as ve:
            return PropertyValidateResponse(
                valid=False,
                message=str(ve),
                errors=[str(ve)]
            )

    @staticmethod
    def generate_voice_preview(text: str, tld: str = "co.in", lang: str = "en", slow: bool = False, engine_mode: str = "auto", voice_gender: str = "female") -> Dict[str, Any]:
        """Generates a quick speech audio preview."""
        sample_hash = str(uuid.uuid4())[:8]
        output_file = VOICE_PREVIEWS_DIR / f"preview_{sample_hash}.mp3"

        out_path = generate_tts_audio(
            text=text,
            output_path=output_file,
            tld=tld,
            lang=lang,
            slow=slow,
            engine_mode=engine_mode,
            voice_gender=voice_gender
        )

        if out_path and out_path.exists():
            duration = get_media_duration(out_path)
            audio_url = f"/api/media/audio/{out_path.name}"
            return {
                "success": True,
                "audio_url": audio_url,
                "duration": round(duration, 2),
                "message": "Voice preview generated successfully."
            }
        else:
            return {
                "success": False,
                "audio_url": None,
                "duration": 0.0,
                "message": "Could not synthesize voice preview."
            }

    @staticmethod
    def create_generation_job(request: VideoGenerateRequest) -> str:
        """Initializes a background job for video rendering."""
        job_id = f"job_{int(time.time())}_{uuid.uuid4().hex[:6]}"
        now_iso = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        with _jobs_lock:
            _jobs[job_id] = {
                "job_id": job_id,
                "status": "queued",
                "progress": 0.05,
                "current_stage": "Queued for generation",
                "message": "Job received and added to rendering queue...",
                "property_name": request.property_details.name,
                "created_at": now_iso,
                "video_url": None,
                "download_url": None,
                "thumbnail_url": None,
                "file_size_mb": None,
                "duration_seconds": None,
                "resolution": "1280x720",
                "scenes": [],
                "error": None
            }
            _save_jobs_to_disk()

        # Launch rendering thread (non-daemon to guarantee completion)
        thread = threading.Thread(
            target=VideoService._render_worker,
            args=(job_id, request),
            daemon=False
        )
        thread.start()

        return job_id

    @staticmethod
    def _render_worker(job_id: str, request: VideoGenerateRequest):
        """Worker executing real-time video generation pipeline."""
        last_disk_save = [0.0]

        def update_job(progress: float, stage: str, message: str, **kwargs):
            now = time.time()
            with _jobs_lock:
                if job_id in _jobs:
                    _jobs[job_id]["progress"] = round(progress, 3)
                    _jobs[job_id]["current_stage"] = stage
                    _jobs[job_id]["message"] = message
                    if "status" in kwargs:
                        _jobs[job_id]["status"] = kwargs.pop("status")
                    elif _jobs[job_id].get("status") == "queued":
                        _jobs[job_id]["status"] = "processing"

                    for k, v in kwargs.items():
                        _jobs[job_id][k] = v

                    # Throttle disk writes to prevent filesystem file-watcher reload storms
                    is_terminal = _jobs[job_id].get("status") in ("completed", "failed")
                    if is_terminal or (now - last_disk_save[0] > 3.0):
                        last_disk_save[0] = now
                        _save_jobs_to_disk()

        try:
            update_job(0.05, "Validating input", "Validating property specifications and photographic assets...", status="processing")

            # 1. Resolve images and categories
            property_req = request.property_details
            custom = request.customization or VideoCustomization()

            resolved_image_objs: List[PropertyImage] = []
            if property_req.images:
                for img in property_req.images:
                    p = Path(img.path)
                    if not p.is_absolute():
                        p = (settings.upload_dir / img.path).resolve()
                    if not p.exists():
                        # Try assets dir
                        p_alt = (settings.assets_dir / "sample_images" / p.name).resolve()
                        if p_alt.exists():
                            p = p_alt
                    if p.exists():
                        resolved_image_objs.append(PropertyImage(path=p, category=img.category))
            elif property_req.image_paths:
                for p_str in property_req.image_paths:
                    p = Path(p_str)
                    if not p.is_absolute():
                        p = (settings.upload_dir / p_str).resolve()
                    if not p.exists():
                        p_alt = (settings.assets_dir / "sample_images" / p.name).resolve()
                        if p_alt.exists():
                            p = p_alt
                    if p.exists():
                        resolved_image_objs.append(PropertyImage(path=p, category=None))

            if len(resolved_image_objs) < 4:
                raise VideoGenerationError(f"Insufficient verified photographs: expected at least 4, found {len(resolved_image_objs)}.")

            # Validate input using existing domain model
            prop_input = validate_property_input(
                name=property_req.name,
                location=property_req.location,
                price=property_req.price,
                property_type=property_req.property_type,
                features=property_req.features,
                call_to_action=property_req.call_to_action,
                image_paths=resolved_image_objs,
                bedrooms=property_req.bedrooms,
                bathrooms=property_req.bathrooms,
                contact_number=property_req.contact_number,
                total_area=property_req.total_area,
                room_dimensions=property_req.room_dimensions,
                description=property_req.description
            )

            # 2. Script Generation
            update_job(0.15, "Generating script", "Generating marketing scene scripts and architectural captions...")
            script: VideoScript = generate_script(prop_input)

            scenes_meta = [
                {
                    "index": s.scene_index,
                    "category_tag": s.category_tag,
                    "headline": s.headline,
                    "subheadline": s.subheadline,
                    "caption": s.caption,
                    "voiceover": s.voiceover,
                    "duration": s.duration
                }
                for s in script.scenes
            ]
            update_job(0.20, "Script ready", f"Generated {len(script.scenes)} promotional scenes", scenes=scenes_meta)

            # 3. Output paths
            safe_name = "".join(c for c in prop_input.name if c.isalnum() or c in (' ', '_', '-')).strip().replace(" ", "_").lower()
            timestamp_str = time.strftime("%Y%m%d_%H%M%S")
            output_filename = f"{safe_name}_{timestamp_str}_{job_id[:6]}.mp4"
            output_mp4_path = settings.output_dir / output_filename

            # 4. Progress callback from video generator
            def on_engine_progress(ratio: float, status_text: str):
                stage = "Encoding video"
                if ratio < 0.25:
                    stage = "Synthesizing voice"
                elif ratio < 0.35:
                    stage = "Preparing scenes"
                elif ratio < 0.88:
                    stage = "Encoding video"
                elif ratio < 0.95:
                    stage = "Muxing audio"
                else:
                    stage = "Finalizing"
                update_job(ratio, stage, status_text, status="processing")

            # 5. Run video generator engine
            generate_property_video(
                prop=prop_input,
                output_path=output_mp4_path,
                script=script,
                include_narration=custom.include_narration,
                include_background_music=custom.include_background_music,
                fps=custom.fps,
                progress_callback=on_engine_progress,
                tts_tld=custom.tts_accent,
                tts_lang="en",
                tts_engine=custom.tts_engine,
                tts_gender=custom.tts_gender,
                bg_music_volume=custom.bg_music_volume,
                sentence_gap=custom.sentence_gap,
                ending_hold=custom.ending_hold,
                target_w=1920,
                target_h=1080,
                ken_burns=True
            )

            # 6. Verify and extract thumbnail
            update_job(0.97, "Finalizing", "Verifying MP4 stream and capturing thumbnail poster...", status="processing")
            if not output_mp4_path.exists() or output_mp4_path.stat().st_size == 0:
                raise VideoGenerationError("Output MP4 file was not written to disk.")

            file_size_mb = round(output_mp4_path.stat().st_size / (1024 * 1024), 2)
            duration_sec = 0.0
            thumb_filename = f"thumb_{job_id}.jpg"
            thumb_path = THUMBNAILS_DIR / thumb_filename

            # Extract thumbnail from first image or video
            try:
                first_img = prop_input.image_paths[0]
                with Image.open(first_img) as img:
                    img = img.convert("RGB")
                    img.thumbnail((640, 360))
                    img.save(thumb_path, "JPEG", quality=85)
            except Exception:
                pass

            try:
                from moviepy import VideoFileClip
                with VideoFileClip(str(output_mp4_path)) as clip:
                    duration_sec = round(float(clip.duration), 2)
            except Exception:
                duration_sec = round(script.estimated_duration, 2)

            video_url = f"/api/media/stream/{output_filename}"
            download_url = f"/api/video/download/{job_id}"
            thumb_url = f"/api/media/thumbnail/{thumb_filename}" if thumb_path.exists() else None

            update_job(
                1.0,
                "Completed",
                "High-definition property showcase video successfully generated!",
                status="completed",
                video_url=video_url,
                download_url=download_url,
                thumbnail_url=thumb_url,
                file_size_mb=file_size_mb,
                duration_seconds=duration_sec,
                output_filename=output_filename
            )

        except Exception as e:
            err_msg = str(e)
            print(f"Video generation error for {job_id}: {err_msg}")
            update_job(
                1.0,
                "Failed",
                f"Generation failed: {err_msg}",
                status="failed",
                error=err_msg
            )

    @staticmethod
    def get_job_status(job_id: str) -> Optional[JobStatusResponse]:
        with _jobs_lock:
            data = _jobs.get(job_id)
            if not data:
                return None
            return JobStatusResponse(**data)

    @staticmethod
    def get_all_jobs() -> List[JobStatusResponse]:
        with _jobs_lock:
            sorted_jobs = sorted(
                _jobs.values(),
                key=lambda x: x.get("created_at", ""),
                reverse=True
            )
            return [JobStatusResponse(**j) for j in sorted_jobs]

    @staticmethod
    def get_job_file_path(job_id: str) -> Optional[Path]:
        with _jobs_lock:
            data = _jobs.get(job_id)
            if not data:
                return None
            filename = data.get("output_filename")
            if filename:
                p = settings.output_dir / filename
                if p.exists():
                    return p
        return None


