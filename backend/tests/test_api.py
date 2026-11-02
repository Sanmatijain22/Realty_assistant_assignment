import pytest
import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.core.config import settings
from app.schemas.property import PropertyValidateRequest
from app.schemas.video import VoicePreviewRequest
from app.routes.property import validate_property, get_categories, get_presets
from app.routes.video import preview_voice, get_all_projects


def test_health_check_config():
    """Verify backend settings and directories."""
    assert settings.upload_dir.exists()
    assert settings.output_dir.exists()
    assert settings.sample_data_dir.exists()
    assert settings.assets_dir.exists()


def test_get_categories():
    """Verify categories endpoint returns expected real estate room tags."""
    data = get_categories()
    assert "categories" in data
    assert "Living Room" in data["categories"]
    assert "Modular Kitchen" in data["categories"]
    assert "Bedroom" in data["categories"]


def test_get_presets():
    """Verify presets endpoint returns Green Valley Residency preset."""
    data = get_presets()
    assert "presets" in data
    assert len(data["presets"]) >= 1
    names = [p["name"] for p in data["presets"]]
    assert any("Green Valley" in n for n in names)


def test_validate_property_success():
    """Verify property validation succeeds with sample Green Valley data."""
    sample_images = list((settings.assets_dir / "sample_images").glob("*.jpg"))
    assert len(sample_images) >= 4, "Sample images must exist"

    req = PropertyValidateRequest(
        name="Green Valley Residency",
        location="Chandigarh",
        price="â‚¹85 lakh",
        property_type="2-BHK apartment",
        features=["Two bedrooms", "Modular kitchen", "Balcony", "Parking"],
        call_to_action="Contact us today to arrange a visit.",
        bedrooms=2,
        description="Spacious luxury apartment",
        image_paths=[str(p) for p in sample_images[:5]]
    )

    data = validate_property(req)
    assert data.valid is True
    assert data.property_data["name"] == "Green Valley Residency"


def test_validate_property_failure_missing_images():
    """Verify validation fails gracefully when insufficient images are provided."""
    req = PropertyValidateRequest(
        name="Incomplete Property",
        location="Mumbai",
        price="â‚¹2 Crore",
        property_type="Apartment",
        features=["Gym"],
        call_to_action="Call now",
        image_paths=[]
    )
    data = validate_property(req)
    assert data.valid is False
    assert len(data.errors) > 0


def test_voice_preview_generation():
    """Verify voice preview synthesis works."""
    req = VoicePreviewRequest(
        text="Welcome to Green Valley Residency in Chandigarh.",
        tld="co.in",
        lang="en",
        voice_gender="female"
    )
    data = preview_voice(req)
    assert data.success is True
    assert data.audio_url is not None
    assert data.duration > 0

