from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
from typing import List, Optional
from pathlib import Path

from app.core.config import settings
from app.schemas.video import (
    VoicePreviewRequest,
    VoicePreviewResponse,
    VideoGenerateRequest,
    JobStatusResponse
)
from app.services.video_service import VideoService

router = APIRouter(tags=["video"])


@router.post("/api/voice/preview", response_model=VoicePreviewResponse)
@router.post("/api/video/voice-preview", response_model=VoicePreviewResponse)
def preview_voice(req: VoicePreviewRequest):
    """Generate audio sample for narration preview."""
    res = VideoService.generate_voice_preview(
        text=req.text,
        tld=req.tld,
        lang=req.lang,
        slow=req.slow,
        engine_mode=req.engine_mode,
        voice_gender=req.voice_gender
    )
    return VoicePreviewResponse(**res)


@router.post("/api/video/generate", response_model=dict)
def generate_video(req: VideoGenerateRequest):
    """Submit video generation job to rendering pipeline."""
    # Run preliminary validation
    validation = VideoService.validate_property(req.property_details)
    if not validation.valid:
        raise HTTPException(
            status_code=422,
            detail={"message": validation.message, "errors": validation.errors}
        )

    job_id = VideoService.create_generation_job(req)
    return {
        "job_id": job_id,
        "status": "queued",
        "message": "Video production job initiated successfully."
    }


@router.get("/api/video/status/{job_id}", response_model=JobStatusResponse)
def get_video_status(job_id: str):
    """Retrieve real-time generation progress and metadata."""
    job = VideoService.get_job_status(job_id)
    if not job:
        raise HTTPException(status_code=404, detail=f"Job not found: {job_id}")
    return job


@router.get("/api/video/download/{job_id}")
def download_video(job_id: str):
    """Download generated MP4 video file."""
    job = VideoService.get_job_status(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")

    if job.status != "completed":
        raise HTTPException(status_code=400, detail="Video rendering is not yet complete.")

    file_path = VideoService.get_job_file_path(job_id)
    if not file_path or not file_path.exists():
        raise HTTPException(status_code=404, detail="Video file not found on disk.")

    safe_name = "".join(c for c in (job.property_name or "property_video") if c.isalnum() or c in (' ', '_', '-')).strip().replace(" ", "_")
    download_filename = f"{safe_name}_showcase.mp4"

    return FileResponse(
        path=file_path,
        media_type="video/mp4",
        filename=download_filename,
        headers={"Content-Disposition": f'attachment; filename="{download_filename}"'}
    )


@router.get("/api/projects", response_model=List[JobStatusResponse])
def get_all_projects():
    """Retrieve list of generated property videos for gallery and projects view."""
    return VideoService.get_all_jobs()


