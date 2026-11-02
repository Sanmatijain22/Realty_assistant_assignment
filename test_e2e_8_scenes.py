import sys
import os
import time
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

BACKEND_DIR = Path(__file__).resolve().parent / "backend"
sys.path.insert(0, str(BACKEND_DIR))

from backend.app.services.video_service import VideoService
from backend.app.schemas.property import PropertyValidateRequest, ImageItem
from backend.app.schemas.video import VideoCustomization, VideoGenerateRequest
from backend.app.core.config import settings

def main():
    print("=" * 70)
    print("  ESTATE STUDIO AI — 8-SCENE FULL VERIFICATION & DEBUG TEST")
    print("=" * 70)

    # Gather 7 images (5 standard + 2 villa images for pool/amenity & second bedroom)
    sample_images = sorted(list((settings.assets_dir / "sample_images").glob("*.jpg")))
    villa_images = sorted(list((settings.assets_dir / "sample_images_villa").glob("*.jpg")))
    
    # 7 images = 8 scenes (7 feature scenes + 1 closing CTA scene)
    selected_paths = [
        sample_images[0],  # 01_exterior.jpg -> Exterior
        sample_images[1],  # 02_living_room.jpg -> Living Room
        sample_images[2],  # 03_modular_kitchen.jpg -> Kitchen
        sample_images[3],  # 04_bedroom.jpg -> Master Bedroom
        sample_images[4],  # 05_balcony_view.jpg -> Balcony
        villa_images[5],   # 06_villa_pool_amenity.jpg -> Amenity / Pool
        villa_images[3],   # 04_villa_bedroom.jpg -> Second Bedroom
    ]

    categories = [
        "exterior",
        "living_room",
        "kitchen",
        "bedroom",
        "balcony",
        "amenity",
        "bedroom"
    ]

    img_items = [
        ImageItem(
            id=f"img_{i}",
            filename=p.name,
            path=str(p.resolve()),
            preview_url=f"/api/media/sample/{p.name}",
            category=categories[i]
        )
        for i, p in enumerate(selected_paths)
    ]

    prop_req = PropertyValidateRequest(
        name="Green Valley Residency",
        location="Chandigarh",
        price="₹85 lakh",
        property_type="2-BHK apartment",
        features=["Two bedrooms", "Modular kitchen", "Balcony", "Swimming Pool", "Parking"],
        call_to_action="Contact us today to arrange a private visit.",
        bedrooms=2,
        bathrooms=2,
        total_area="4,000 sq. ft.",
        room_dimensions={
            "Master Bedroom": "400 sq. ft.",
            "Second Bedroom": "250 sq. ft.",
            "Kitchen": "300 sq. ft.",
            "Living / Dining": "500 sq. ft.",
            "Balcony": "380 sq. ft."
        },
        contact_number="+91 98765 43210",
        description="Spacious 2-BHK luxury apartment in central Chandigarh with open-concept living, world-class amenities, and peaceful green views.",
        images=img_items
    )

    # 1. Validation Test
    print("\n[Step 1] Validating 8-scene property configuration...")
    val_res = VideoService.validate_property(prop_req)
    assert val_res.valid, f"Validation failed: {val_res.errors}"
    print("  ✓ Validation passed!")

    # 2. Submit 8-scene Video Generation Job
    print("\n[Step 2] Submitting 8-scene video generation job to VideoService...")
    customization = VideoCustomization(
        theme="champagne",
        scene_duration=4.0,
        include_narration=True,
        include_background_music=True,
        bg_music_volume=0.12,
        fps=24
    )
    gen_req = VideoGenerateRequest(
        property_details=prop_req,
        customization=customization
    )

    job_id = VideoService.create_generation_job(gen_req)
    print(f"  ✓ Job started with ID: {job_id}")

    # 3. Poll and observe real-time progress
    print("\n[Step 3] Monitoring live rendering pipeline (verifying 80% fix)...")
    start_t = time.time()
    last_msg = ""
    seen_80_plus = False
    
    while True:
        status = VideoService.get_job_status(job_id)
        if not status:
            time.sleep(1)
            continue

        pct = int(status.progress * 100)
        msg_str = f"[{pct}%] {status.status.upper()} | {status.current_stage}: {status.message}"
        if msg_str != last_msg:
            print(f"  -> {msg_str}")
            last_msg = msg_str

        if pct > 80 and pct < 100:
            seen_80_plus = True

        if status.status == "completed":
            print(f"\n  ✓ 8-SCENE RENDER COMPLETED in {time.time() - start_t:.1f} seconds!")
            break
        elif status.status == "failed":
            raise RuntimeError(f"Video generation job failed: {status.error}")

        time.sleep(1.5)

    assert seen_80_plus, "Progress should smoothly pass through 80%-99% without stalling!"

    # 4. Verify Generated 8-Scene MP4
    print("\n[Step 4] Verifying generated MP4 file & media streams...")
    file_path = VideoService.get_job_file_path(job_id)
    assert file_path is not None, "File path is None"
    assert file_path.exists(), f"File does not exist: {file_path}"
    file_size_mb = file_path.stat().st_size / (1024 * 1024)
    print(f"  ✓ File Path   : {file_path}")
    print(f"  ✓ File Size   : {file_size_mb:.2f} MB ({file_path.stat().st_size} bytes)")
    assert file_path.stat().st_size > 1000000, "File size must be > 1 MB"

    # Verify duration and resolution with MoviePy VideoFileClip
    from moviepy import VideoFileClip
    with VideoFileClip(str(file_path)) as clip:
        print(f"  ✓ Resolution  : {clip.w}x{clip.h}")
        print(f"  ✓ Duration    : {clip.duration:.2f} seconds")
        print(f"  ✓ FPS         : {clip.fps}")
        print(f"  ✓ Has Audio   : {clip.audio is not None}")
        assert clip.duration > 25.0, "8-scene video duration should be > 25 seconds"
        assert clip.w == 1920 and clip.h == 1080, f"Video must be 1920x1080, found {clip.w}x{clip.h}"
        assert clip.audio is not None, "Video must have synchronized audio track"

    # Verify scene breakdown in job status
    print("\n[Step 5] Verifying 8 promotional scenes breakdown...")
    job_status = VideoService.get_job_status(job_id)
    scenes = job_status.scenes if job_status else []
    print(f"  Total scenes in script: {len(scenes)}")
    assert len(scenes) == 8, f"Expected exactly 8 scenes, found {len(scenes)}"
    for idx, sc in enumerate(scenes):
        print(f"    Scene {idx+1}: [{sc.get('category_tag')}] {sc.get('headline')} — {sc.get('subheadline')}")

    print("\n" + "=" * 70)
    print("  ALL 8-SCENE VERIFICATION CHECKS PASSED: 100% OPERATIONAL!")
    print("=" * 70)

if __name__ == "__main__":
    main()

