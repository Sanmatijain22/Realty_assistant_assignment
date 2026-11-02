from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class ImageItem(BaseModel):
    id: str
    filename: str
    path: str
    preview_url: str
    category: Optional[str] = None
    detected_category: Optional[str] = None
    confidence: Optional[float] = None


class PropertyValidateRequest(BaseModel):
    name: str = Field(..., min_length=2, description="Property marketing name")
    location: str = Field(..., min_length=2, description="City / Neighborhood location")
    price: str = Field(..., min_length=2, description="Listing price e.g. ₹85 lakh")
    property_type: str = Field(default="2-BHK apartment")
    features: List[str] = Field(default_factory=list, description="List of amenities & key features")
    call_to_action: str = Field(default="Contact us today to arrange a visit.", min_length=3)
    bedrooms: Optional[int] = Field(default=2, ge=0)
    bathrooms: Optional[int] = Field(default=2, ge=0)
    total_area: Optional[str] = Field(default=None, description="e.g. 4,000 sq. ft.")
    room_dimensions: Optional[Dict[str, str]] = Field(default_factory=dict)
    contact_number: Optional[str] = Field(default=None)
    description: Optional[str] = Field(default=None)
    image_paths: List[str] = Field(default_factory=list)
    images: Optional[List[ImageItem]] = Field(default_factory=list)


class PropertyValidateResponse(BaseModel):
    valid: bool
    message: str
    errors: List[str] = Field(default_factory=list)
    property_data: Optional[Dict[str, Any]] = None

