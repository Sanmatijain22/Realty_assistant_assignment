from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from .property import PropertyValidateRequest, ImageItem


class VoicePreviewRequest(BaseModel):
    text: str = Field(..., min_length=2)
    tld: str = Field(default="co.in")
    lang: str = Field(default="en")
    slow: bool = Field(default=False)
    engine_mode: str = Field(default="auto")
    voice_gender: str = Field(default="female")


class VoicePreviewResponse(BaseModel):
    success: bool
    audio_url: Optional[str] = None
    duration: float = 0.0
    message: Optional[str] = None


class VideoCustomization(BaseModel):
    theme: str = Field(default="champagne", description="champagne, minimalist, cinematic, warm")
    scene_duration: float = Field(default=4.0, ge=2.0, le=10.0)
    transition_style: str = Field(default="fade", description="fade, dissolve, cut")
    font_style: str = Field(default="modern", description="modern, serif, bold")
    text_overlay_enabled: bool = Field(default=True)
    include_narration: bool = Field(default=True)
    include_background_music: bool = Field(default=True)
    bg_music_volume: float = Field(default=0.12, ge=0.0, le=0.5)
    tts_accent: str = Field(default="co.in")
    tts_gender: str = Field(default="female")
    tts_engine: str = Field(default="auto")
    sentence_gap: float = Field(default=0.3, ge=0.0, le=1.5)
    ending_hold: float = Field(default=0.8, ge=0.0, le=3.0)
    aspect_ratio: str = Field(default="16:9", description="16:9, 9:16")
    fps: int = Field(default=24, ge=15, le=60)


class VideoGenerateRequest(BaseModel):
    property_details: PropertyValidateRequest
    customization: Optional[VideoCustomization] = Field(default_factory=VideoCustomization)


class SceneInfo(BaseModel):
    index: int
    category_tag: str
    headline: str
    subheadline: str
    caption: str
    voiceover: str
    duration: float


class JobStatusResponse(BaseModel):
    job_id: str
    status: str = Field(..., description="queued, processing, completed, failed")
    progress: float = Field(default=0.0, ge=0.0, le=1.0)
    current_stage: str = Field(default="Initializing")
    message: str = Field(default="")
    video_url: Optional[str] = None
    download_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    file_size_mb: Optional[float] = None
    duration_seconds: Optional[float] = None
    resolution: Optional[str] = None
    scenes: List[Dict[str, Any]] = Field(default_factory=list)
    property_name: Optional[str] = None
    created_at: Optional[str] = None
    error: Optional[str] = None

