
from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
import json
from pathlib import Path

# Corrected imports
from app.core.config import settings
from app.schemas.property import (
    PropertyValidateRequest,
    PropertyValidateResponse
)
from app.services.video_service import VideoService
from src.image_classifier import DISPLAY_NAMES


router = APIRouter(
    prefix="/api/property",
    tags=["property"]
)


# =========================================================
# PROPERTY VALIDATION
# =========================================================

@router.post(
    "/validate",
    response_model=PropertyValidateResponse
)
def validate_property(request: PropertyValidateRequest):
    """Validate property listing details and photographic asset paths."""

    res = VideoService.validate_property(request)
    return res


# =========================================================
# PROPERTY PRESETS
# =========================================================

@router.get("/presets")
def get_presets():
    """Returns curated luxury property presets."""

    presets = []

    # Green Valley Residency Preset
    gv_path = settings.sample_data_dir / "sample_property.json"

    if gv_path.exists():

        with open(gv_path, "r", encoding="utf-8") as f:
            data = json.load(f)

            presets.append({
                "id": "green_valley",
                "name": data.get(
                    "name",
                    "Green Valley Residency"
                ),
                "tagline": "Modern High-Rise Living",
                "location": data.get("location", "Chandigarh"),
                "price": data.get("price", "₹85 lakh"),
                "property_type": data.get(
                    "property_type",
                    "2-BHK apartment"
                ),
                "bedrooms": data.get("bedrooms", 2),
                "bathrooms": 2,
                "total_area": "4,000 sq. ft.",

                "contact_number": "+91 98765 43210",
                "room_dimensions": {
                    "Master Bedroom": "400 sq. ft.",
                    "Second Bedroom": "250 sq. ft.",
                    "Kitchen": "300 sq. ft.",
                    "Living / Dining": "500 sq. ft.",
                    "Balcony": "380 sq. ft."
                },
                "features": data.get(
                    "features",
                    [
                        "Two bedrooms",
                        "Modular kitchen",
                        "Balcony",
                        "Parking"
                    ]
                ),
                "call_to_action": data.get(
                    "call_to_action",
                    "Contact us today to arrange a visit."
                ),
                "description": data.get(
                    "description",
                    "Spacious 2-BHK apartment in the heart of Chandigarh "
                    "with premium finishes, peaceful surroundings, "
                    "and world-class connectivity."
                ),
                "images": [
                    {
                        "id": f"gv_img_{idx}",
                        "filename": Path(rel).name,
                        "path": str((settings.upload_dir.parent / rel).resolve()),
                        "preview_url": f"/api/media/sample/sample_images/{Path(rel).name}",
                        "category": ["Property Exterior", "Living Room", "Modular Kitchen", "Bedroom", "Balcony View"][idx % 5]
                    }
                    for idx, rel in enumerate(data.get("images", []))
                ]
            })


    # =====================================================
    # OCEAN CREST LUXURY VILLA PRESET
    # =====================================================

    oc_path = (
        settings.sample_data_dir /
        "sample_property_villa.json"
    )

    if oc_path.exists():

        with open(oc_path, "r", encoding="utf-8") as f:
            data = json.load(f)

            presets.append({
                "id": "ocean_crest",
                "name": data.get(
                    "name",
                    "Ocean Crest Luxury Villa"
                ),
                "tagline": "Private Coastal Sanctuary",
                "location": data.get("location", "Goa Coast"),
                "price": data.get("price", "₹6.5 Crore"),
                "property_type": data.get(
                    "property_type",
                    "Luxury Villa"
                ),
                "bedrooms": data.get("bedrooms", 4),
                "bathrooms": 5,
                "total_area": "6,200 sq. ft.",

                "room_dimensions": {
                    "Grand Master Suite": "650 sq. ft.",
                    "Guest Suites (3)": "400 sq. ft. each",
                    "Chef's Kitchen": "450 sq. ft.",
                    "Double-Height Living": "900 sq. ft.",
                    "Pool Deck": "1,200 sq. ft."
                },

                "features": data.get(
                    "features",
                    [
                        "Infinity Pool",
                        "Private Beach Access",
                        "Landscaped Gardens",
                        "Smart Home Automation"
                    ]
                ),

                "call_to_action": data.get(
                    "call_to_action",
                    "Schedule a private confidential showing today."
                ),

                "description": data.get(
                    "description",
                    "An architectural triumph perched along the "
                    "pristine Goa coastline featuring panoramic "
                    "ocean vistas, private infinity pool, "
                    "and bespoke Italian interiors."
                ),

                "contact_number": "+91 98200 12345",
                "images": [
                    {
                        "id": f"oc_img_{idx}",
                        "filename": Path(rel).name,
                        "path": str(
                            (settings.upload_dir.parent / rel).resolve()
                        ),
                        "preview_url": (
                            f"/api/media/sample/sample_images_villa/"
                            f"{Path(rel).name}"
                        ),
                        "category": ["Property Exterior", "Living Room", "Modular Kitchen", "Bedroom", "Balcony View", "Key Amenity"][idx % 6]
                    }
                    for idx, rel in enumerate(
                        data.get("images", [])
                    )
                ]
            })

    return {
        "presets": presets
    }


# =========================================================
# PROPERTY IMAGE CATEGORIES
# =========================================================

@router.get("/categories")
def get_categories():
    """Returns valid image room categories."""

    categories = [
        "Auto-Detect",
        "Property Exterior",
        "Living Room",
        "Modular Kitchen",
        "Bedroom",
        "Balcony View",
        "Designer Bathroom",
        "Parking & Garage",
        "Key Amenity"
    ]

    return {
        "categories": categories
    }
