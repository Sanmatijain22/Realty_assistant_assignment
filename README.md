# ESTATE STUDIO AI — Premium Real Estate Creative Studio (v2.0)

A luxury real-estate video production web application migrated from Streamlit to a modern, interactive **React + Vite** frontend and high-performance **Python FastAPI** backend.

Converts architectural listings and photographs into 20–45 second 1080p branded marketing videos with synchronized voice narration, glassmorphic typography, and ambient music.

---

## 1. System Architecture

```
assignment-main/
├── frontend/                     # React 19 + Vite + TypeScript Frontend
│   ├── src/
│   │   ├── components/           # UI components
│   │   ├── layouts/
│   │   │   └── MainLayout.tsx    # Luxury dark sidebar & navigation
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx     # Metrics, Quick Create, Featured Properties
│   │   │   ├── CreateVideo.tsx   # 4-step interactive video production wizard
│   │   │   ├── Projects.tsx      # Video archive, in-app player, MP4 downloads
│   │   │   ├── SampleGallery.tsx # Architectural gallery & 1-click studio loader
│   │   │   └── Settings.tsx      # Production preferences & system diagnostics
│   │   ├── services/
│   │   │   └── api.ts            # Axios API client
│   │   ├── types/
│   │   │   └── index.ts          # TypeScript domain interfaces
│   │   ├── App.tsx               # Client-side router
│   │   ├── main.tsx              # Entry point
│   │   └── index.css             # Luxury styling, gold gradients, glassmorphism
│   ├── package.json
│   ├── vite.config.ts            # Proxy configured for FastAPI backend
│   └── tsconfig.json
│
├── backend/                      # Python FastAPI Backend
│   ├── app/
│   │   ├── main.py               # FastAPI app, CORS, media byte-range streaming
│   │   ├── core/
│   │   │   └── config.py         # Paths and application settings
│   │   ├── schemas/
│   │   │   ├── property.py       # Pydantic models for listings & validation
│   │   │   └── video.py          # Pydantic models for jobs & customization
│   │   ├── routes/
│   │   │   ├── property.py       # /api/property/validate & /presets
│   │   │   ├── upload.py         # /api/upload/images with category detection
│   │   │   └── video.py          # /api/video/generate, /status, /download
│   │   └── services/
│   │       └── video_service.py  # Threaded job queue & status management
│   ├── src/                      # Adapted Python Video Generation Engine
│   │   ├── audio_generator.py    # Multi-engine TTS + procedural ambient music
│   │   ├── video_generator.py    # MoviePy 2.x timeline composition & render
│   │   ├── image_processor.py    # 16:9 smart crop & glassmorphism lower-third
│   │   ├── image_classifier.py   # Room category classification
│   │   ├── script_generator.py   # Scene script composition
│   │   └── validators.py         # Listing input validation
│   ├── sample_data/              # Sample property JSON presets
│   ├── assets/                   # Sample architectural photography
│   ├── output/                   # Generated MP4 videos, previews, and thumbnails
│   ├── tests/
│   │   └── test_api.py           # Backend automated test suite
│   └── requirements.txt
│
├── requirements.txt              # Root Python dependencies
├── .env.example                  # Environment configuration template
└── README.md
```

---

## 2. Root Cause Analysis & Video Pipeline Fixes

### Why the "Generate Property Video" Button Previously Failed

1. **Streamlit Session State & Upload Thrashing**:
   - In Streamlit, any interaction with sliders, selectboxes, or buttons triggered a full script re-execution.
   - Uploaded files were written to ephemeral temporary directories (`tempfile.mkdtemp()`) that were re-created on every widget update, breaking file paths when the user finally clicked "Generate".
   - Long MoviePy rendering jobs (40+ seconds) in Streamlit caused WebSocket timeout disconnections, resetting the session state and silently killing video generation.

2. **TTS Narration Failures (Network Isolation & Windows COM Errors)**:
   - When online, `gTTS` timed out under restricted or offline network conditions.
   - The offline fallback `pyttsx3` failed on Windows with `_ctypes.COMError: (-2147200967)` because SAPI5 voice tokens were not properly accessible.
   - This caused `generate_tts_audio` to return `None`, leading to a silent failure in `generate_full_audio_track` and causing the video generator to throw `VideoGenerationError`.

3. **Audio Duration Mismatch & Overlap**:
   - Hardcoded durations conflicted with actual spoken voiceover lengths, leading to narration getting cut off or video slides ending before speech finished.

### How the Pipeline Was Fixed

- **Asynchronous FastAPI Job Queue**: Video generation now runs in a dedicated background worker thread (`VideoService._render_worker`). The React frontend polls `/api/video/status/{job_id}` in real-time without blocking the user interface or dropping connection.
- **Robust Multi-Tier Audio Engine**:
  1. High-fidelity online neural TTS (`gTTS`).
  2. Windows native PowerShell `System.Speech.Synthesis.SpeechSynthesizer` fallback that works 100% offline with zero external network access.
  3. Procedural harmonic vocal fallback ensuring `generate_tts_audio` **never** returns `None` or crashes the pipeline.
- **MoviePy 2.x Compatibility**: Adapted effects (`vfx.FadeIn`), durations (`clip.with_duration`), and audio muxing (`final_video.with_audio`).
- **HTTP 206 Partial Content Media Streaming**: Enables HTML5 `<video>` scrubbable playback and byte-range streaming for generated MP4 files.

---

## 3. Quick Start (Windows PowerShell)

Open two Windows PowerShell terminals in the project root:

### Terminal 1: Launch FastAPI Backend (Port 8000)

```powershell
# Navigate to project directory
cd "c:\Users\Sanmati Jain\Downloads\assignment-main"

# Activate Python environment (or run directly with python)
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```

*Backend Swagger API docs available at: `http://127.0.0.1:8000/docs`*

### Terminal 2: Launch React Frontend (Port 5173)

```powershell
# Navigate to frontend
cd "c:\Users\Sanmati Jain\Downloads\assignment-main\frontend"

# Launch Vite development server
npm run dev
```

*Open your browser at: `http://localhost:5173`*

---

## 4. API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health status and engine diagnostics |
| `GET` | `/api/property/presets` | Curated sample properties (Green Valley, Ocean Crest) |
| `GET` | `/api/property/categories` | Supported room tags (Living Room, Modular Kitchen, etc.) |
| `POST` | `/api/property/validate` | Validates listing specifications and photo requirements |
| `POST` | `/api/upload/images` | Multi-image upload with auto category detection |
| `POST` | `/api/voice/preview` | Real-time speech narration preview synthesis |
| `POST` | `/api/video/generate` | Starts asynchronous video rendering job |
| `GET` | `/api/video/status/{job_id}` | Real-time progress, stage, and metadata polling |
| `GET` | `/api/video/download/{job_id}` | Direct MP4 video download |
| `GET` | `/api/projects` | Vault history of all generated videos |
| `GET` | `/api/media/stream/{filename}` | HTTP 206 seekable MP4 video streaming |

---

## 5. Verification & Testing

### Run Backend API Unit Tests

```powershell
python -m pytest backend/tests/test_api.py -v
```

### Run Full End-to-End Green Valley Verification

```powershell
python test_e2e_green_valley.py
```

*Generates a verified 1280x720 H.264 promotional video for Green Valley Residency with full audio track (voice narration + ambient music) in `backend/output/`.*

### Build Frontend for Production

```powershell
cd frontend
npm run build
```

---

## 6. Luxury UI/UX Design System

- **Color Palette**: Ivory (`#FDFCF7`), Warm Stone (`#F7F5EE`), Charcoal typography (`#1C1917`), and Champagne Gold accents (`#C5A059`, `#D4AF37`).
- **Sidebar**: Elegant dark aesthetic (`#111317`) with live FastAPI connection indicator.
- **Glassmorphism**: Backdrop blur cards with safe video rendering margins.
- **Interactive Wizards**:
  - Drag-and-drop photograph management with category auto-tagging.
  - Interactive "Test Voice Narration" audio player.
  - Real-time percentage progress bar with multi-stage status breakdowns.

