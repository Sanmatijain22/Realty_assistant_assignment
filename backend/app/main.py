
import sys
from pathlib import Path

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles

# =========================================================
# PATH CONFIGURATION
# =========================================================

# Backend root directory
BACKEND_DIR = Path(__file__).resolve().parent.parent

if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

# =========================================================
# APPLICATION IMPORTS
# =========================================================

from app.core.config import settings
from app.routes.property import router as property_router
from app.routes.upload import router as upload_router
from app.routes.video import router as video_router


# =========================================================
# FASTAPI APPLICATION
# =========================================================

app = FastAPI(
    title=settings.app_name,
    version=settings.version,
    description="High-end AI promotional property video rendering service."
)


# =========================================================
# CORS CONFIGURATION
# =========================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# REGISTER API ROUTERS
# =========================================================

app.include_router(property_router)
app.include_router(upload_router)
app.include_router(video_router)


# =========================================================
# HEALTH CHECK
# =========================================================

@app.get("/api/health")
def health_check():
    """Health check endpoint."""

    return {
        "status": "healthy",
        "service": settings.app_name,
        "version": settings.version,
        "ffmpeg_installed": True,
        "output_dir_ready": settings.output_dir.exists(),
        "upload_dir_ready": settings.upload_dir.exists()
    }


# =========================================================
# VIDEO STREAMING ENDPOINT
# =========================================================

@app.get("/api/media/stream/{filename}")
def stream_video(filename: str, request: Request):
    """Streams MP4 video with HTTP 206 Partial Content support."""

    # Prevent path traversal
    if Path(filename).name != filename:
        raise HTTPException(
            status_code=400,
            detail="Invalid filename."
        )

    video_path = settings.output_dir / filename

    if not video_path.is_file():
        raise HTTPException(
            status_code=404,
            detail="Video file not found."
        )

    file_size = video_path.stat().st_size
    range_header = request.headers.get("Range")

    if not range_header:
        return FileResponse(
            video_path,
            media_type="video/mp4"
        )

    try:
        if not range_header.startswith("bytes="):
            raise ValueError("Invalid range header")

        range_str = range_header.replace("bytes=", "", 1)
        parts = range_str.split("-")

        start = int(parts[0]) if parts[0] else 0
        end = int(parts[1]) if parts[1] else file_size - 1

        if start < 0 or start >= file_size or end < start:
            raise ValueError("Invalid byte range")

        end = min(end, file_size - 1)

    except (ValueError, IndexError):
        raise HTTPException(
            status_code=416,
            detail="Requested range not satisfiable.",
            headers={"Content-Range": f"bytes */{file_size}"}
        )

    chunk_length = end - start + 1

    def iterfile():
        with open(video_path, "rb") as file:
            file.seek(start)
            remaining = chunk_length

            while remaining > 0:
                chunk = file.read(min(remaining, 64 * 1024))

                if not chunk:
                    break

                remaining -= len(chunk)
                yield chunk

    headers = {
        "Content-Range": f"bytes {start}-{end}/{file_size}",
        "Accept-Ranges": "bytes",
        "Content-Length": str(chunk_length),
        "Content-Type": "video/mp4",
    }

    return StreamingResponse(
        iterfile(),
        status_code=206,
        headers=headers,
        media_type="video/mp4"
    )


# =========================================================
# AUDIO STREAMING ENDPOINT
# =========================================================

@app.get("/api/media/audio/{filename}")
def stream_audio(filename: str):
    """Serve synthesized audio sample."""

    if Path(filename).name != filename:
        raise HTTPException(
            status_code=400,
            detail="Invalid filename."
        )

    audio_path = settings.output_dir / "voice_previews" / filename

    if not audio_path.is_file():
        audio_path = settings.output_dir / filename

    if not audio_path.is_file():
        raise HTTPException(
            status_code=404,
            detail="Audio file not found."
        )

    media_type = (
        "audio/mpeg"
        if audio_path.suffix.lower() == ".mp3"
        else "audio/wav"
    )

    return FileResponse(
        audio_path,
        media_type=media_type
    )


# =========================================================
# THUMBNAIL ENDPOINT
# =========================================================

@app.get("/api/media/thumbnail/{filename}")
def stream_thumbnail(filename: str):
    """Serve thumbnail poster."""

    if Path(filename).name != filename:
        raise HTTPException(
            status_code=400,
            detail="Invalid filename."
        )

    thumb_path = settings.output_dir / "thumbnails" / filename

    if not thumb_path.is_file():
        raise HTTPException(
            status_code=404,
            detail="Thumbnail not found."
        )

    return FileResponse(
        thumb_path,
        media_type="image/jpeg"
    )


# =========================================================
# UPLOADED IMAGE ENDPOINT
# =========================================================

@app.get("/api/media/upload/{filename}")
def stream_uploaded_image(filename: str):
    """Serve uploaded photograph preview."""

    if Path(filename).name != filename:
        raise HTTPException(
            status_code=400,
            detail="Invalid filename."
        )

    img_path = settings.upload_dir / filename

    if not img_path.is_file():
        raise HTTPException(
            status_code=404,
            detail="Uploaded image not found."
        )

    ext = img_path.suffix.lower()

    media_type = (
        "image/png" if ext == ".png"
        else "image/webp" if ext == ".webp"
        else "image/jpeg"
    )

    return FileResponse(
        img_path,
        media_type=media_type
    )


# =========================================================
# SAMPLE IMAGE ENDPOINT
# =========================================================

@app.get("/api/media/sample/{folder}/{filename}")
def stream_sample_image(folder: str, filename: str):
    """Serve sample assets images."""

    if (
        Path(folder).name != folder
        or Path(filename).name != filename
    ):
        raise HTTPException(
            status_code=400,
            detail="Invalid file path."
        )

    img_path = settings.assets_dir / folder / filename

    if not img_path.is_file():
        raise HTTPException(
            status_code=404,
            detail="Sample image not found."
        )

    return FileResponse(
        img_path,
        media_type="image/jpeg"
    )


# =========================================================
# FRONTEND STATIC FILE SERVING
# =========================================================

frontend_dist = (
    BACKEND_DIR.parent / "frontend" / "dist"
)

if frontend_dist.is_dir():

    app.mount(
        "/",
        StaticFiles(
            directory=str(frontend_dist),
            html=True
        ),
        name="frontend"
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="127.0.0.1",
        port=8000,
        reload=True,
        reload_dirs=[str(BACKEND_DIR / "app"), str(BACKEND_DIR / "src")],
        reload_excludes=["*.mp4", "*.mp3", "*.jpg", "*.png", "*.json", "output/*", "uploads/*"]
    )
