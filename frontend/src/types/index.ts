export interface ImageItem {
  id: string;
  filename: string;
  path: string;
  preview_url: string;
  category?: string;
  detected_category?: string;
  confidence?: number;
}

export interface PropertyDetails {
  name: string;
  location: string;
  price: string;
  property_type: string;
  bedrooms: number;
  bathrooms: number;
  total_area: string;
  room_dimensions: Record<string, string>;
  contact_number: string;
  description: string;
  features: string[];
  call_to_action: string;
  image_paths: string[];
  images: ImageItem[];
}

export interface VideoCustomization {
  theme: 'champagne' | 'minimalist' | 'cinematic' | 'warm';
  scene_duration: number;
  transition_style: 'fade' | 'dissolve' | 'cut';
  font_style: 'modern' | 'serif' | 'bold';
  text_overlay_enabled: boolean;
  include_narration: boolean;
  include_background_music: boolean;
  bg_music_volume: number;
  tts_accent: string;
  tts_gender: 'female' | 'male';
  tts_engine: string;
  sentence_gap: number;
  ending_hold: number;
  aspect_ratio: '16:9' | '9:16';
  fps: number;
}

export interface SceneMeta {
  index: number;
  category_tag: string;
  headline: string;
  subheadline: string;
  caption: string;
  voiceover: string;
  duration: number;
}

export interface JobStatus {
  job_id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  current_stage: string;
  message: string;
  video_url?: string;
  download_url?: string;
  thumbnail_url?: string;
  file_size_mb?: number;
  duration_seconds?: number;
  resolution?: string;
  scenes?: SceneMeta[];
  property_name?: string;
  created_at?: string;
  error?: string;
}

export interface PropertyPreset {
  id: string;
  name: string;
  tagline: string;
  location: string;
  price: string;
  property_type: string;
  bedrooms: number;
  bathrooms: number;
  total_area: string;
  room_dimensions: Record<string, string>;
  features: string[];
  call_to_action: string;
  description: string;
  images: ImageItem[];
}

