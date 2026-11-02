from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import List
import uuid
import shutil
from pathlib import Path
from PIL import Image

from app.core.config import settings
from app.schemas.property import ImageItem
from src.image_classifier import detect_image_category

router = APIRouter(prefix="/api/upload", tags=["upload"])


@router.post("/images", response_model=List[ImageItem])
async def upload_images(files: List[UploadFile] = File(...)):
    """Upload multiple property photographs and auto-detect architectural categories."""
    if not files:
        raise HTTPException(status_code=400, detail="No files uploaded.")

    if len(files) > 15:
        raise HTTPException(status_code=400, detail="Maximum 15 images allowed per batch.")

    uploaded_items: List[ImageItem] = []
    allowed_extensions = {".jpg", ".jpeg", ".png", ".webp"}

    for f in files:
        orig_name = f.filename or "photo.jpg"
        ext = Path(orig_name).suffix.lower()
        if ext not in allowed_extensions:
            continue

        unique_id = uuid.uuid4().hex[:10]
        safe_name = f"prop_{unique_id}_{Path(orig_name).stem[:20]}{ext}"
        dest_path = settings.upload_dir / safe_name

        try:
            with open(dest_path, "wb") as buffer:
                shutil.copyfileobj(f.file, buffer)

            # Verify image integrity with PIL
            with Image.open(dest_path) as img:
                img.verify()

            # Detect category
            cat_key, cat_display, confidence = detect_image_category(dest_path)

            uploaded_items.append(
                ImageItem(
                    id=unique_id,
                    filename=orig_name,
                    path=str(dest_path.resolve()),
                    preview_url=f"/api/media/upload/{safe_name}",
                    category=cat_display if cat_display != "Property Exterior" else "Property Exterior",
                    detected_category=cat_display,
                    confidence=round(confidence, 2)
                )
            )
        except Exception as e:
            # Clean up broken upload
            dest_path.unlink(missing_ok=True)
            print(f"Failed to process uploaded file {orig_name}: {e}")

    if not uploaded_items:
        raise HTTPException(status_code=400, detail="No valid image files could be processed.")

    return uploaded_items


