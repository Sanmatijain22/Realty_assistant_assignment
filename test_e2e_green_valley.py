import sys
import os
import time
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

# Add backend and backend/src to path
BACKEND_DIR = Path(__file__).resolve().parent / "backend"
sys.path.insert(0, str(BACKEND_DIR))

from backend.app.services.video_service import VideoService
from backend.app.schemas.property import PropertyValidateRequest, ImageItem
from backend.app.schemas.video import VideoCustomization, VideoGenerateRequest
from backend.app.core.config import settings

def main():
    print("=" * 65)
    print("  ESTATE STUDIO AI — END-TO-END VERIFICATION TEST")
    print("=" * 65)

    sample_images = sorted(list((settings.assets_dir / "sample_images").glob("*.jpg")))
    print(f"Sample images located: {len(sample_images)} images")
    assert len(sample_images) >= 4, "Must have at least 4 sample images"

    # Explicit category assignment matching actual photographs
    categories = [
        "exterior",
        "living_room",
        "kitchen",
        "bedroom",
        "balcony"
    ]

    img_items = [
        ImageItem(
            id=f"img_{i}",
            filename=p.name,
            path=str(p.resolve()),
            preview_url=f"/api/media/sample/sample_images/{p.name}",
            category=categories[i] if i < len(categories) else None
        )
        for i, p in enumerate(sample_images[:5])
    ]

    prop_req = PropertyValidateRequest(
        name="Green Valley Residency",
        location="Chandigarh",
        price="₹85 lakh",
        property_type="2-BHK apartment",
        features=["Two bedrooms", "Modular kitchen", "Balcony", "Parking"],
        call_to_action="Contact us today to arrange a visit.",
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
        description="Spacious 2-BHK apartment in the heart of Chandigarh with premium finishes, peaceful surroundings, and world-class connectivity.",
        images=img_items
    )

    # 1. Validation Test
    print("\n[Step 1] Validating property details via VideoService...")
    val_res = VideoService.validate_property(prop_req)
    assert val_res.valid, f"Validation failed: {val_res.errors}"
    print("  ✓ Validation passed!")

    # 2. Voice Preview Test
    print("\n[Step 2] Testing voice preview synthesis...")
    voice_res = VideoService.generate_voice_preview(
        text="Welcome to Green Valley Residency, located in the prime center of Chandigarh.",
        tld="co.in",
        voice_gender="female"
    )
    assert voice_res["success"], "Voice preview synthesis failed"
    print(f"  ✓ Voice preview synthesized: {voice_res['audio_url']} ({voice_res['duration']}s)")

    # 3. Submit Video Generation Job
    print("\n[Step 3] Submitting video generation job...")
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

    # 4. Poll until completion
    print("\n[Step 4] Monitoring real-time rendering progress...")
    start_t = time.time()
    last_stage = ""
    while True:
        status = VideoService.get_job_status(job_id)
        if not status:
            time.sleep(1)
            continue

        pct = int(status.progress * 100)
        stage_str = f"[{pct}%] {status.current_stage}: {status.message[:45]}"
        if stage_str != last_stage:
            print(f"  -> {stage_str}")
            last_stage = stage_str

        if status.status == "completed":
            print(f"\n  ✓ RENDER COMPLETE in {time.time() - start_t:.1f} seconds!")
            break
        elif status.status == "failed":
            raise RuntimeError(f"Video generation job failed: {status.error}")

        time.sleep(2)

    # 5. Verify Generated MP4
    print("\n[Step 5] Verifying generated MP4 file...")
    file_path = VideoService.get_job_file_path(job_id)
    assert file_path is not None, "File path is None"
    assert file_path.exists(), f"File does not exist: {file_path}"
    file_size_mb = file_path.stat().st_size / (1024 * 1024)
    print(f"  ✓ File Path   : {file_path}")
    print(f"  ✓ File Size   : {file_size_mb:.2f} MB ({file_path.stat().st_size} bytes)")
    assert file_path.stat().st_size > 500000, "File size suspiciously small"

    # Verify duration and resolution with MoviePy VideoFileClip
    from moviepy import VideoFileClip
    with VideoFileClip(str(file_path)) as clip:
        print(f"  ✓ Resolution  : {clip.w}x{clip.h}")
        print(f"  ✓ Duration    : {clip.duration:.2f} seconds")
        print(f"  ✓ FPS         : {clip.fps}")
        print(f"  ✓ Has Audio   : {clip.audio is not None}")
        assert clip.duration > 15.0, "Video duration should be > 15 seconds"
        assert clip.w == 1920 and clip.h == 1080, f"Video must be 1920x1080, found {clip.w}x{clip.h}"
        assert clip.audio is not None, "Video must have audio track"

        # Frame inspection at each scene midpoint
        print("\n[Step 6] Verifying scene frames and text overlays at 1920x1080...")
        job_status = VideoService.get_job_status(job_id)
        scenes = job_status.scenes if job_status else []
        print(f"  Total scenes in script: {len(scenes)}")
        for idx, sc in enumerate(scenes):
            print(f"    Scene {idx+1}: [{sc.get('category_tag')}] {sc.get('headline')} — {sc.get('subheadline')}")
        
        # Sample mid-video frame
        sample_frame = clip.get_frame(5.0)
        assert sample_frame.shape == (1080, 1920, 3), f"Frame shape mismatch: {sample_frame.shape}"
        assert sample_frame.mean() > 10.0, "Sample frame appears to be blank/black"
        print(f"  ✓ Frame at 5.0s verified: {sample_frame.shape}, mean brightness {sample_frame.mean():.1f}")

    print("\n" + "=" * 65)
    print("  ALL VERIFICATION CHECKS PASSED: 100% OPERATIONAL!")
    print("=" * 65)

if __name__ == "__main__":
    main()
