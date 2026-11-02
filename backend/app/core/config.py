from pathlib import Path
from pydantic import BaseModel
import os

BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
PROJECT_ROOT = BACKEND_DIR.parent
UPLOAD_DIR = BACKEND_DIR / "uploads"
OUTPUT_DIR = BACKEND_DIR / "output"
SAMPLE_DATA_DIR = BACKEND_DIR / "sample_data"
ASSETS_DIR = BACKEND_DIR / "assets"

UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


class Settings(BaseModel):
    app_name: str = "ESTATE STUDIO AI API"
    version: str = "2.0.0"
    api_prefix: str = "/api"
    cors_origins: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*"
    ]
    upload_dir: Path = UPLOAD_DIR
    output_dir: Path = OUTPUT_DIR
    sample_data_dir: Path = SAMPLE_DATA_DIR
    assets_dir: Path = ASSETS_DIR


settings = Settings()

