"""Image processing and text overlay composition module for Property Studio AI.

Handles:
- Aspect-ratio preserving smart crop and resize to 1920x1080 (Full HD 16:9 widescreen).
- Cinematic, high-contrast, elegant typography with safe margins.
- Proportionate lower-third caption panel (approx. 18-22% of frame height).
- Subtle semi-transparent dark backing with refined champagne gold accents.
- Preserves the property photograph as the primary visual focus of every scene.
"""

from pathlib import Path
from typing import Tuple, Optional, List
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import numpy as np
from .script_generator import SceneScript

TARGET_WIDTH = 1920
TARGET_HEIGHT = 1080
ASPECT_RATIO = TARGET_WIDTH / TARGET_HEIGHT  # 16:9 (1.777...)


def get_default_font(size: int, bold: bool = False) -> ImageFont.ImageFont:
    """Load an available system font or fall back gracefully."""
    font_candidates = []
    if bold:
        font_candidates = [
            "C:/Windows/Fonts/segoeuib.ttf",
            "C:/Windows/Fonts/arialbd.ttf",
            "C:/Windows/Fonts/calibrib.ttf",
            "C:/Windows/Fonts/tahomabd.ttf",
            "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
            "/System/Library/Fonts/HelveticaNeue-Bold.otf",
            "arialbd.ttf"
        ]
    else:
        font_candidates = [
            "C:/Windows/Fonts/segoeui.ttf",
            "C:/Windows/Fonts/arial.ttf",
            "C:/Windows/Fonts/calibri.ttf",
            "C:/Windows/Fonts/tahoma.ttf",
            "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
            "/System/Library/Fonts/HelveticaNeue.otf",
            "arial.ttf"
        ]

    for cand in font_candidates:
        try:
            return ImageFont.truetype(cand, size)
        except Exception:
            continue

    try:
        return ImageFont.load_default(size=size)
    except Exception:
        return ImageFont.load_default()


def wrap_text(text: str, font: ImageFont.ImageFont, max_width: int) -> List[str]:
    """Break text into multiple lines that fit within max_width pixels."""
    if not text:
        return []
    words = text.split()
    lines = []
    current_line = []

    for word in words:
        test_line = " ".join(current_line + [word])
        try:
            bbox = font.getbbox(test_line)
            w = bbox[2] - bbox[0]
        except Exception:
            w = len(test_line) * (font.size if hasattr(font, 'size') else 10) * 0.6
            
        if w <= max_width:
            current_line.append(word)
        else:
            if current_line:
                lines.append(" ".join(current_line))
            current_line = [word]

    if current_line:
        lines.append(" ".join(current_line))
    return lines


def resize_and_crop_to_16_9(image_path: Path, target_w: int = TARGET_WIDTH, target_h: int = TARGET_HEIGHT) -> Image.Image:
    """Resize and center-crop an image to target dimensions without distortion.
    
    Preserves aspect ratio by scaling to cover target bounds, then center-cropping.
    """
    with Image.open(image_path) as img:
        img = img.convert("RGBA")
        src_w, src_h = img.size
        src_ratio = src_w / src_h
        target_ratio = target_w / target_h

        if src_ratio > target_ratio:
            # Source is wider than target: scale by height, crop width
            new_h = target_h
            new_w = int(src_w * (target_h / src_h))
        else:
            # Source is taller than target: scale by width, crop height
            new_w = target_w
            new_h = int(src_h * (target_w / src_w))

        resample_filter = getattr(Image.Resampling, 'LANCZOS', Image.LANCZOS)
        resized = img.resize((new_w, new_h), resample=resample_filter)

        left = max(0, (new_w - target_w) // 2)
        top = max(0, (new_h - target_h) // 2)
        right = left + target_w
        bottom = top + target_h

        cropped = resized.crop((left, top, right, bottom))
        return cropped


def render_scene_overlay_only(
    scene: SceneScript,
    target_w: int = TARGET_WIDTH,
    target_h: int = TARGET_HEIGHT
) -> Image.Image:
    """Render the transparent RGBA overlay containing the refined cinematic caption panel.
    
    Adheres strictly to luxury real-estate specifications:
    - Caption panel height occupies approx. 19% of frame height (leaving ~81% open for photograph).
    - Positioned at the bottom of the video within safe margins.
    - Subtle semi-transparent dark charcoal background with gold accent line.
    - Headline: 32px (at 1080p).
    - Subtitle: 20px (at 1080p).
    - Supporting description: 15px (at 1080p).
    - Small, elegant category badge: 11px (at 1080p).
    - Clean vertical spacing, no overlap, and consistent alignment.
    """
    scale = target_h / 1080.0
    overlay = Image.new("RGBA", (target_w, target_h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    # 1. Discreet, Ultra-Minimal Top Header Watermark (Safe margins: 50px left, 25px top)
    brand_font = get_default_font(max(10, int(13 * scale)), bold=True)
    brand_sub_font = get_default_font(max(9, int(11 * scale)), bold=False)
    draw.text((int(50 * scale), int(25 * scale)), "ESTATE STUDIO AI", fill=(255, 255, 255, 170), font=brand_font)
    draw.text((int(185 * scale), int(27 * scale)), "• ARCHITECTURAL CINEMA", fill=(212, 175, 55, 180), font=brand_sub_font)

    # 2. Refined Lower-Third Caption Panel (18% - 22% of frame height)
    # At 1080p: card_height = 210px (19.4% of 1080), margin_bottom = 28px, margin_x = 55px
    margin_x = int(55 * scale)
    margin_bottom = int(28 * scale)
    card_height = int(210 * scale)
    card_y0 = target_h - card_height - margin_bottom
    card_width = target_w - 2 * margin_x

    # Rounded card mask for smooth corners
    radius = int(12 * scale)
    card_mask = Image.new("L", (card_width, card_height), 0)
    mask_draw = ImageDraw.Draw(card_mask)
    mask_draw.rounded_rectangle([(0, 0), (card_width, card_height)], radius=radius, fill=255)

    # Subtle semi-transparent dark charcoal / slate backing (78% opacity = alpha 200)
    card_bg = Image.new("RGBA", (card_width, card_height), (12, 16, 24, 200))
    card_draw = ImageDraw.Draw(card_bg)

    # Subtle champagne-gold accent top border line
    gold_line_w = int(2 * scale) if scale > 0.8 else 1
    card_draw.line(
        [(int(20 * scale), 0), (card_width - int(20 * scale), 0)],
        fill=(212, 175, 55, 190),
        width=gold_line_w
    )

    overlay.paste(card_bg, (margin_x, card_y0), card_mask)

    # 3. Panel Content & Typography
    content_draw = ImageDraw.Draw(overlay)
    padding_x = int(30 * scale)
    text_x = margin_x + padding_x
    content_max_w = card_width - (2 * padding_x)
    curr_y = card_y0 + int(14 * scale)

    # A. Category Badge (Small, refined champagne-gold pill)
    badge_font = get_default_font(max(9, int(11 * scale)), bold=True)
    badge_text = scene.category_tag.upper().strip()
    try:
        bbox = badge_font.getbbox(badge_text)
        b_text_w = bbox[2] - bbox[0]
        b_text_h = bbox[3] - bbox[1]
    except Exception:
        b_text_w = len(badge_text) * int(7 * scale)
        b_text_h = int(12 * scale)

    badge_pad_x = int(8 * scale)
    badge_pad_y = int(3 * scale)
    badge_w = b_text_w + 2 * badge_pad_x
    badge_h = b_text_h + 2 * badge_pad_y

    badge_rect = [(text_x, curr_y), (text_x + badge_w, curr_y + badge_h)]
    content_draw.rounded_rectangle(badge_rect, radius=int(4 * scale), fill=(212, 175, 55, 230))
    content_draw.text((text_x + badge_pad_x, curr_y + badge_pad_y - int(1 * scale)), badge_text, fill=(12, 16, 24, 255), font=badge_font)

    curr_y += badge_h + int(8 * scale)

    # B. Heading (32px at 1080p, proportionate and elegant, not overly heavy)
    font_head_size = max(18, int(32 * scale))
    font_headline = get_default_font(font_head_size, bold=True)
    # Subtle drop shadow for guaranteed contrast
    content_draw.text((text_x + 1, curr_y + 1), scene.headline, fill=(0, 0, 0, 160), font=font_headline)
    content_draw.text((text_x, curr_y), scene.headline, fill=(255, 255, 255, 250), font=font_headline)
    curr_y += font_head_size + int(6 * scale)

    # C. Subtitle (20px at 1080p, warm champagne/light slate)
    font_sub_size = max(13, int(20 * scale))
    font_subhead = get_default_font(font_sub_size, bold=False)
    content_draw.text((text_x, curr_y), scene.subheadline, fill=(225, 205, 150, 235), font=font_subhead)
    curr_y += font_sub_size + int(6 * scale)

    # D. Supporting Description (15px at 1080p, soft slate white, max 1-2 lines)
    font_desc_size = max(10, int(15 * scale))
    font_desc = get_default_font(font_desc_size, bold=False)
    desc_lines = wrap_text(scene.caption, font_desc, content_max_w)
    for line in desc_lines[:1]:  # 1 concise line ensures zero crowding
        content_draw.text((text_x, curr_y), line, fill=(210, 218, 228, 215), font=font_desc)

    return overlay


def render_scene_frame(
    image_path: Path,
    scene: SceneScript,
    target_w: int = TARGET_WIDTH,
    target_h: int = TARGET_HEIGHT
) -> Image.Image:
    """Render a complete Full HD video frame with photography and refined lower-third overlay."""
    base_img = resize_and_crop_to_16_9(image_path, target_w, target_h)
    overlay = render_scene_overlay_only(scene, target_w, target_h)
    final_frame = Image.alpha_composite(base_img, overlay).convert("RGB")
    return final_frame


def save_scene_frame(image_path: Path, scene: SceneScript, output_path: Path) -> Path:
    """Render and save a processed scene frame to disk."""
    frame = render_scene_frame(image_path, scene)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    frame.save(output_path, "JPEG", quality=95)
    return output_path
