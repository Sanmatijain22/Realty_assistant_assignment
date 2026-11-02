import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, 
  Images, 
  Sliders, 
  Film, 
  Sparkles, 
  CheckCircle2, 
  Upload, 
  Trash2, 
  ArrowLeft, 
  ArrowRight, 
  Play, 
  Volume2, 
  Download, 
  RefreshCw, 
  MoveUp, 
  MoveDown,
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { api } from '../services/api';
import { PropertyDetails, ImageItem, VideoCustomization, JobStatus, PropertyPreset } from '../types';

export const CreateVideo: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [categories, setCategories] = useState<string[]>([]);
  const [presets, setPresets] = useState<PropertyPreset[]>([]);

  // Step 1: Property Details State
  const [property, setProperty] = useState<PropertyDetails>({
    name: 'Green Valley Residency',
    location: 'Chandigarh',
    price: '₹85 lakh',
    property_type: '2-BHK apartment',
    bedrooms: 2,
    bathrooms: 2,
    total_area: '4,000 sq. ft.',
    room_dimensions: {
      'Master Bedroom': '400 sq. ft.',
      'Second Bedroom': '250 sq. ft.',
      'Kitchen': '300 sq. ft.',
      'Living / Dining': '500 sq. ft.',
      'Balcony': '380 sq. ft.'
    },
    contact_number: '+91 98765 43210',
    description: 'Spacious 2-BHK apartment in the heart of Chandigarh with premium finishes, peaceful surroundings, and world-class connectivity.',
    features: ['Two bedrooms', 'Modular kitchen', 'Balcony', 'Parking', '24/7 Security'],
    call_to_action: 'Contact us today to arrange a visit.',
    image_paths: [],
    images: []
  });

  // Step 2: Upload state
  const [uploading, setUploading] = useState<boolean>(false);
  const [dragOver, setDragOver] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 3: Customization State
  const [customization, setCustomization] = useState<VideoCustomization>({
    theme: 'champagne',
    scene_duration: 4.2,
    transition_style: 'fade',
    font_style: 'modern',
    text_overlay_enabled: true,
    include_narration: true,
    include_background_music: true,
    bg_music_volume: 0.12,
    tts_accent: 'co.in',
    tts_gender: 'female',
    tts_engine: 'auto',
    sentence_gap: 0.3,
    ending_hold: 0.8,
    aspect_ratio: '16:9',
    fps: 24,
  });

  // Voice Preview State
  const [previewText, setPreviewText] = useState<string>('Welcome to Green Valley Residency in Chandigarh. Spacious luxury living designed for elegance.');
  const [previewLoading, setPreviewLoading] = useState<boolean>(false);
  const [previewAudioUrl, setPreviewAudioUrl] = useState<string | null>(null);
  const [previewDuration, setPreviewDuration] = useState<number>(0);

  // Step 4: Generation & Job State
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Load Presets and Categories on mount
  useEffect(() => {
    api.getCategories()
      .then((data) => setCategories(data.categories))
      .catch((err) => console.error('Error fetching categories:', err));

    api.getPresets()
      .then((data) => {
        setPresets(data.presets);
        // Check if an active preset was chosen from dashboard/gallery
        const saved = localStorage.getItem('estate_studio_active_preset');
        if (saved) {
          try {
            const p = JSON.parse(saved) as PropertyPreset;
            applyPreset(p);
            localStorage.removeItem('estate_studio_active_preset');
          } catch (e) {}
        } else if (data.presets && data.presets.length > 0) {
          applyPreset(data.presets[0]);
        }
      })
      .catch((err) => console.error('Error fetching presets:', err));
  }, []);

  const applyPreset = (preset: PropertyPreset) => {
    setProperty({
      name: preset.name,
      location: preset.location,
      price: preset.price,
      property_type: preset.property_type,
      bedrooms: preset.bedrooms || 2,
      bathrooms: preset.bathrooms || 2,
      total_area: preset.total_area || '4,000 sq. ft.',
      room_dimensions: preset.room_dimensions || {},
      contact_number: '+91 98765 43210',
      description: preset.description,
      features: preset.features,
      call_to_action: preset.call_to_action,
      image_paths: preset.images.map(img => img.path),
      images: preset.images
    });
    setPreviewText(`Welcome to ${preset.name} in ${preset.location}. ${preset.description.substring(0, 80)}...`);
  };

  // Image upload handling
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const fileArr = Array.from(files);
      const newItems = await api.uploadImages(fileArr);
      setProperty(prev => ({
        ...prev,
        images: [...prev.images, ...newItems],
        image_paths: [...prev.images, ...newItems].map(img => img.path)
      }));
    } catch (err: any) {
      alert(`Image upload error: ${err.response?.data?.detail || err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setProperty(prev => {
      const updated = [...prev.images];
      updated.splice(index, 1);
      return {
        ...prev,
        images: updated,
        image_paths: updated.map(img => img.path)
      };
    });
  };

  const moveImage = (index: number, direction: 'up' | 'down') => {
    setProperty(prev => {
      const updated = [...prev.images];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= updated.length) return prev;
      const temp = updated[index];
      updated[index] = updated[targetIndex];
      updated[targetIndex] = temp;
      return {
        ...prev,
        images: updated,
        image_paths: updated.map(img => img.path)
      };
    });
  };

  const updateImageCategory = (index: number, cat: string) => {
    setProperty(prev => {
      const updated = [...prev.images];
      updated[index] = { ...updated[index], category: cat };
      return { ...prev, images: updated };
    });
  };

  // Voice Preview test
  const handleVoicePreview = async () => {
    if (!previewText.trim()) return;
    setPreviewLoading(true);
    try {
      const res = await api.previewVoice({
        text: previewText,
        tld: customization.tts_accent,
        voice_gender: customization.tts_gender,
        slow: false
      });
      if (res.success && res.audio_url) {
        setPreviewAudioUrl(res.audio_url);
        setPreviewDuration(res.duration);
      } else {
        alert(res.message || 'Voice preview failed.');
      }
    } catch (err: any) {
      alert(`Voice preview error: ${err.message}`);
    } finally {
      setPreviewLoading(false);
    }
  };

  // Start Generation
  const handleStartGeneration = async () => {
    setIsGenerating(true);
    setGenerationError(null);
    setCurrentStep(4);

    try {
      const res = await api.generateVideo(property, customization);
      setJobId(res.job_id);
    } catch (err: any) {
      setIsGenerating(false);
      setGenerationError(err.response?.data?.detail?.message || err.response?.data?.detail || err.message);
    }
  };

  // Real-time polling when job is in progress
  useEffect(() => {
    if (!jobId) return;

    let intervalId: any = null;
    const poll = async () => {
      try {
        const status = await api.getVideoStatus(jobId);
        setJobStatus(status);

        if (status.status === 'completed') {
          setIsGenerating(false);
          clearInterval(intervalId);
        } else if (status.status === 'failed') {
          setIsGenerating(false);
          setGenerationError(status.error || 'Video rendering failed on backend.');
          clearInterval(intervalId);
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    };

    poll();
    intervalId = setInterval(poll, 1500);

    return () => clearInterval(intervalId);
  }, [jobId]);

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Wizard Progress Stepper */}
      <div className="bg-white rounded-2xl border border-[#E8E5DA] p-4 shadow-sm">
        <div className="grid grid-cols-4 gap-2">
          {[
            { num: 1, label: 'Property Details', icon: Building2 },
            { num: 2, label: 'Image Studio', icon: Images },
            { num: 3, label: 'Customization', icon: Sliders },
            { num: 4, label: 'Render & Export', icon: Film },
          ].map((s) => {
            const Icon = s.icon;
            const isDone = currentStep > s.num;
            const isCurrent = currentStep === s.num;
            return (
              <button
                key={s.num}
                onClick={() => {
                  if (s.num < currentStep || (currentStep !== 4 && !isGenerating)) {
                    setCurrentStep(s.num);
                  }
                }}
                disabled={isGenerating && currentStep === 4}
                className={`flex items-center gap-3 p-3 rounded-xl transition text-left cursor-pointer ${
                  isCurrent
                    ? 'bg-[#1C1917] text-white shadow-sm'
                    : isDone
                    ? 'bg-[#F7F5EE] text-[#1C1917] hover:bg-[#EFECE1]'
                    : 'text-[#A8A29E] hover:bg-stone-50'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                    isCurrent
                      ? 'bg-[#C5A059] text-black'
                      : isDone
                      ? 'bg-emerald-600 text-white'
                      : 'bg-stone-200 text-[#78716C]'
                  }`}
                >
                  {isDone ? <CheckCircle2 className="w-4 h-4" /> : s.num}
                </div>
                <div className="hidden sm:block">
                  <span className="text-[10px] uppercase tracking-wider block opacity-70">Step {s.num}</span>
                  <span className="text-xs font-medium">{s.label}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          STEP 1: PROPERTY DETAILS
      ───────────────────────────────────────────────────────────── */}
      {currentStep === 1 && (
        <div className="space-y-6">
          {/* Quick Presets Bar */}
          <div className="bg-[#14171F] text-white rounded-2xl p-4 border border-[#2B3040] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#C5A059]" />
              <span className="text-xs font-semibold text-white">Preload Sample Listing Data:</span>
            </div>
            <div className="flex items-center gap-2">
              {presets.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => applyPreset(preset)}
                  className="px-3 py-1.5 rounded-lg bg-[#232732] hover:bg-[#C5A059] hover:text-black text-xs font-medium transition cursor-pointer border border-[#3A4050]"
                >
                  🏢 {preset.name}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#E8E5DA] p-6 md:p-8 space-y-6 shadow-sm">
            <div className="border-b border-[#F2EFE6] pb-4">
              <h2 className="text-xl font-serif font-bold text-[#1C1917]">Property Specifications</h2>
              <p className="text-xs text-[#78716C] mt-1">
                Enter property marketing details, room dimensions, and call to action.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-[#1C1917] mb-1.5">Property Name *</label>
                <input
                  type="text"
                  value={property.name}
                  onChange={(e) => setProperty({ ...property, name: e.target.value })}
                  placeholder="e.g. Green Valley Residency"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D6D2C4] bg-white text-xs text-[#1C1917] focus:outline-none focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1C1917] mb-1.5">Location *</label>
                <input
                  type="text"
                  value={property.location}
                  onChange={(e) => setProperty({ ...property, location: e.target.value })}
                  placeholder="e.g. Chandigarh"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D6D2C4] bg-white text-xs text-[#1C1917] focus:outline-none focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1C1917] mb-1.5">Listing Price *</label>
                <input
                  type="text"
                  value={property.price}
                  onChange={(e) => setProperty({ ...property, price: e.target.value })}
                  placeholder="e.g. ₹85 lakh"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D6D2C4] bg-white text-xs text-[#1C1917] focus:outline-none focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1C1917] mb-1.5">Property Type *</label>
                <select
                  value={property.property_type}
                  onChange={(e) => setProperty({ ...property, property_type: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D6D2C4] bg-white text-xs text-[#1C1917] focus:outline-none focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059]"
                >
                  <option value="2-BHK apartment">2-BHK apartment</option>
                  <option value="3-BHK apartment">3-BHK apartment</option>
                  <option value="Luxury Villa">Luxury Villa</option>
                  <option value="Penthouse">Penthouse</option>
                  <option value="Studio Apartment">Studio Apartment</option>
                  <option value="Commercial Office">Commercial Office</option>
                  <option value="Plot / Land">Plot / Land</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1C1917] mb-1.5">Total Area (sq. ft.)</label>
                <input
                  type="text"
                  value={property.total_area}
                  onChange={(e) => setProperty({ ...property, total_area: e.target.value })}
                  placeholder="e.g. 4,000 sq. ft."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D6D2C4] bg-white text-xs text-[#1C1917] focus:outline-none focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1C1917] mb-1.5">Bedrooms</label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={property.bedrooms}
                    onChange={(e) => setProperty({ ...property, bedrooms: parseInt(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D6D2C4] bg-white text-xs text-[#1C1917] focus:outline-none focus:border-[#C5A059]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1C1917] mb-1.5">Bathrooms</label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={property.bathrooms}
                    onChange={(e) => setProperty({ ...property, bathrooms: parseInt(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D6D2C4] bg-white text-xs text-[#1C1917] focus:outline-none focus:border-[#C5A059]"
                  />
                </div>
              </div>
            </div>

            {/* Room Dimensions Grid */}
            <div className="p-4 rounded-xl bg-[#F7F5EE] border border-[#E8E5DA] space-y-3">
              <span className="text-xs font-semibold text-[#1C1917] block">Room Dimensions & Layout</span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Object.entries(property.room_dimensions).map(([room, dim]) => (
                  <div key={room} className="bg-white p-2.5 rounded-lg border border-[#E0DCD1]">
                    <span className="text-[10px] text-[#78716C] block font-medium">{room}</span>
                    <span className="text-xs font-bold text-[#1C1917]">{dim}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Description & Features */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-[#1C1917] mb-1.5">Overview Description</label>
                <textarea
                  rows={4}
                  value={property.description}
                  onChange={(e) => setProperty({ ...property, description: e.target.value })}
                  placeholder="Architectural overview of the listing..."
                  className="w-full p-3 rounded-xl border border-[#D6D2C4] bg-white text-xs text-[#1C1917] focus:outline-none focus:border-[#C5A059]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1C1917] mb-1.5">Features & Amenities (one per line)</label>
                <textarea
                  rows={4}
                  value={property.features.join('\n')}
                  onChange={(e) => setProperty({ ...property, features: e.target.value.split('\n').filter(f => f.trim()) })}
                  placeholder="Two bedrooms&#10;Modular kitchen&#10;Balcony&#10;Parking"
                  className="w-full p-3 rounded-xl border border-[#D6D2C4] bg-white text-xs text-[#1C1917] focus:outline-none focus:border-[#C5A059]"
                />
              </div>
            </div>

            {/* Contact & CTA */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-[#1C1917] mb-1.5">Call to Action *</label>
                <input
                  type="text"
                  value={property.call_to_action}
                  onChange={(e) => setProperty({ ...property, call_to_action: e.target.value })}
                  placeholder="e.g. Contact us today to arrange a visit."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D6D2C4] bg-white text-xs text-[#1C1917] focus:outline-none focus:border-[#C5A059]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1C1917] mb-1.5">Advisor Contact Number</label>
                <input
                  type="text"
                  value={property.contact_number}
                  onChange={(e) => setProperty({ ...property, contact_number: e.target.value })}
                  placeholder="e.g. +91 98765 43210"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D6D2C4] bg-white text-xs text-[#1C1917] focus:outline-none focus:border-[#C5A059]"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-[#F2EFE6]">
              <button
                onClick={() => setCurrentStep(2)}
                className="px-6 py-2.5 rounded-xl bg-[#1C1917] hover:bg-[#2B2724] text-white text-xs font-semibold flex items-center gap-2 transition cursor-pointer shadow-sm"
              >
                <span>Continue to Image Studio</span>
                <ArrowRight className="w-4 h-4 text-[#C5A059]" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          STEP 2: IMAGE STUDIO
      ───────────────────────────────────────────────────────────── */}
      {currentStep === 2 && (
        <div className="bg-white rounded-2xl border border-[#E8E5DA] p-6 md:p-8 space-y-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#F2EFE6] pb-4">
            <div>
              <h2 className="text-xl font-serif font-bold text-[#1C1917]">Image Studio</h2>
              <p className="text-xs text-[#78716C] mt-1">
                Upload 4 to 8 high-resolution architectural photographs. Verify category tagging and sequence.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${property.images.length >= 4 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                {property.images.length} / 8 Photographs
              </span>
            </div>
          </div>

          {/* Drag & Drop Upload Zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFileUpload(e.dataTransfer.files); }}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center transition cursor-pointer ${
              dragOver
                ? 'border-[#C5A059] bg-[#C5A059]/5'
                : 'border-[#D6D2C4] hover:border-[#C5A059] bg-[#FDFCF7]'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              multiple
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => handleFileUpload(e.target.files)}
              className="hidden"
            />
            <div className="w-12 h-12 rounded-full bg-[#F7F5EE] text-[#C5A059] flex items-center justify-center mx-auto mb-3">
              <Upload className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-[#1C1917] mb-1">
              {uploading ? 'Processing Photographs...' : 'Click to Browse or Drag & Drop Photographs'}
            </h3>
            <p className="text-xs text-[#78716C] max-w-sm mx-auto">
              Supports high-resolution JPG, PNG, and WEBP. Images will be automatically framed to 16:9 widescreen.
            </p>
          </div>

          {/* Images Grid */}
          {property.images.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#1C1917] uppercase tracking-wider">
                  Verified Showcase Photographs ({property.images.length})
                </span>
                <span className="text-[11px] text-[#78716C]">Drag or use arrows to reorder timeline</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {property.images.map((img, idx) => (
                  <div
                    key={img.id || idx}
                    className="bg-[#F7F5EE] border border-[#E0DCD1] rounded-xl overflow-hidden shadow-sm flex flex-col justify-between group"
                  >
                    <div className="relative aspect-video bg-stone-200 overflow-hidden">
                      <img
                        src={img.preview_url}
                        alt={`Photo ${idx + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80';
                        }}
                      />
                      <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/75 backdrop-blur-sm text-[10px] font-mono text-white">
                        Scene #{idx + 1}
                      </span>
                    </div>

                    <div className="p-3 space-y-2">
                      <div>
                        <label className="text-[10px] font-semibold text-[#78716C] block uppercase mb-1">
                          Category Badge
                        </label>
                        <select
                          value={img.category || 'Auto-Detect'}
                          onChange={(e) => updateImageCategory(idx, e.target.value)}
                          className="w-full px-2 py-1.5 rounded-lg border border-[#D6D2C4] bg-white text-xs text-[#1C1917] focus:outline-none"
                        >
                          <option value="Auto-Detect">Auto-Detect</option>
                          <option value="Property Exterior">Property Exterior</option>
                          <option value="Living Room">Living Room</option>
                          <option value="Modular Kitchen">Modular Kitchen</option>
                          <option value="Bedroom">Bedroom</option>
                          <option value="Balcony View">Balcony View</option>
                          <option value="Designer Bathroom">Designer Bathroom</option>
                          <option value="Parking & Garage">Parking & Garage</option>
                          <option value="Key Amenity">Key Amenity</option>
                        </select>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-[#E8E5DA]">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => moveImage(idx, 'up')}
                            disabled={idx === 0}
                            title="Move earlier"
                            className="p-1 rounded bg-white hover:bg-stone-100 text-[#1C1917] disabled:opacity-30 cursor-pointer"
                          >
                            <MoveUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => moveImage(idx, 'down')}
                            disabled={idx === property.images.length - 1}
                            title="Move later"
                            className="p-1 rounded bg-white hover:bg-stone-100 text-[#1C1917] disabled:opacity-30 cursor-pointer"
                          >
                            <MoveDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <button
                          onClick={() => removeImage(idx)}
                          className="p-1 rounded bg-white hover:bg-red-50 text-red-600 hover:text-red-700 cursor-pointer"
                          title="Delete photograph"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {property.images.length < 4 && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>Please supply at least 4 property photographs to satisfy video production requirements.</span>
            </div>
          )}

          <div className="flex justify-between pt-4 border-t border-[#F2EFE6]">
            <button
              onClick={() => setCurrentStep(1)}
              className="px-5 py-2.5 rounded-xl border border-[#D6D2C4] hover:bg-stone-50 text-xs font-semibold text-[#1C1917] flex items-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Details</span>
            </button>
            <button
              onClick={() => setCurrentStep(3)}
              disabled={property.images.length < 4}
              className="px-6 py-2.5 rounded-xl bg-[#1C1917] hover:bg-[#2B2724] text-white text-xs font-semibold flex items-center gap-2 disabled:opacity-40 cursor-pointer shadow-sm"
            >
              <span>Continue to Video Customization</span>
              <ArrowRight className="w-4 h-4 text-[#C5A059]" />
            </button>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          STEP 3: VIDEO CUSTOMIZATION
      ───────────────────────────────────────────────────────────── */}
      {currentStep === 3 && (
        <div className="bg-white rounded-2xl border border-[#E8E5DA] p-6 md:p-8 space-y-6 shadow-sm">
          <div className="border-b border-[#F2EFE6] pb-4">
            <h2 className="text-xl font-serif font-bold text-[#1C1917]">Video Production Customization</h2>
            <p className="text-xs text-[#78716C] mt-1">
              Select cinematic themes, adjust narration parameters, voice accents, and preview speech audio.
            </p>
          </div>

          {/* Theme Selector */}
          <div>
            <label className="block text-xs font-semibold text-[#1C1917] uppercase tracking-wider mb-2">
              Visual Presentation Theme
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { id: 'champagne', name: 'Luxury Champagne', desc: 'Warm gold accents & glassmorphic cards' },
                { id: 'minimalist', name: 'Modern Minimal', desc: 'Crisp black & white architectural styling' },
                { id: 'cinematic', name: 'Cinematic Noir', desc: 'Dramatic contrast with bold overlays' },
                { id: 'warm', name: 'Warm Elegance', desc: 'Soft ivory palette with serif typography' },
              ].map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => setCustomization({ ...customization, theme: theme.id as any })}
                  className={`p-3.5 rounded-xl border text-left transition cursor-pointer ${
                    customization.theme === theme.id
                      ? 'border-[#C5A059] bg-[#FBF6E9] ring-2 ring-[#C5A059]/30'
                      : 'border-[#E8E5DA] hover:border-[#D6D2C4] bg-white'
                  }`}
                >
                  <span className="text-xs font-bold text-[#1C1917] block mb-1">{theme.name}</span>
                  <span className="text-[11px] text-[#78716C] leading-snug block">{theme.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Scene Timing & Duration */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            <div>
              <div className="flex justify-between text-xs font-semibold text-[#1C1917] mb-1.5">
                <span>Base Scene Duration</span>
                <span className="text-[#C5A059]">{customization.scene_duration}s per slide</span>
              </div>
              <input
                type="range"
                min="2.5"
                max="6.0"
                step="0.1"
                value={customization.scene_duration}
                onChange={(e) => setCustomization({ ...customization, scene_duration: parseFloat(e.target.value) })}
                className="w-full accent-[#C5A059]"
              />
              <p className="text-[11px] text-[#78716C] mt-1">Slides auto-expand if narration exceeds duration</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1C1917] mb-1.5">Transition Style</label>
              <select
                value={customization.transition_style}
                onChange={(e) => setCustomization({ ...customization, transition_style: e.target.value as any })}
                className="w-full px-3 py-2 rounded-xl border border-[#D6D2C4] bg-white text-xs text-[#1C1917] focus:outline-none"
              >
                <option value="fade">Subtle Cross-Fade (0.35s)</option>
                <option value="dissolve">Smooth Dissolve</option>
                <option value="cut">Direct Architectural Cut</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1C1917] mb-1.5">Aspect Ratio</label>
              <select
                value={customization.aspect_ratio}
                onChange={(e) => setCustomization({ ...customization, aspect_ratio: e.target.value as any })}
                className="w-full px-3 py-2 rounded-xl border border-[#D6D2C4] bg-white text-xs text-[#1C1917] focus:outline-none"
              >
                <option value="16:9">16:9 Landscape (Widescreen 1080p/720p)</option>
                <option value="9:16">9:16 Vertical (Stories & Reels)</option>
              </select>
            </div>
          </div>

          {/* Voice Narration & Audio Section */}
          <div className="p-5 rounded-2xl bg-[#F7F5EE] border border-[#E8E5DA] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-[#C5A059]" />
                <span className="text-xs font-bold text-[#1C1917] uppercase tracking-wider">
                  AI Voice Narration & Audio
                </span>
              </div>
              <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={customization.include_narration}
                  onChange={(e) => setCustomization({ ...customization, include_narration: e.target.checked })}
                  className="rounded text-[#C5A059] focus:ring-[#C5A059]"
                />
                <span>Enable Voiceover</span>
              </label>
            </div>

            {customization.include_narration && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div>
                  <label className="block text-[11px] font-semibold text-[#78716C] mb-1">Accent / Dialect</label>
                  <select
                    value={customization.tts_accent}
                    onChange={(e) => setCustomization({ ...customization, tts_accent: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#D6D2C4] bg-white text-xs text-[#1C1917]"
                  >
                    <option value="co.in">Indian English (co.in)</option>
                    <option value="com">American English (com)</option>
                    <option value="co.uk">British English (co.uk)</option>
                    <option value="com.au">Australian English (com.au)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#78716C] mb-1">Voice Gender</label>
                  <select
                    value={customization.tts_gender}
                    onChange={(e) => setCustomization({ ...customization, tts_gender: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-[#D6D2C4] bg-white text-xs text-[#1C1917]"
                  >
                    <option value="female">Warm Female Voice</option>
                    <option value="male">Executive Male Voice</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#78716C] mb-1">Ambient Music Volume</label>
                  <div className="flex items-center gap-2 pt-1.5">
                    <input
                      type="range"
                      min="0.05"
                      max="0.30"
                      step="0.01"
                      value={customization.bg_music_volume}
                      onChange={(e) => setCustomization({ ...customization, bg_music_volume: parseFloat(e.target.value) })}
                      className="w-full accent-[#C5A059]"
                    />
                    <span className="text-xs font-mono text-[#78716C]">
                      {Math.round(customization.bg_music_volume * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Interactive Voice Preview Bar */}
            {customization.include_narration && (
              <div className="mt-3 p-3.5 bg-white rounded-xl border border-[#E0DCD1] space-y-2">
                <span className="text-[11px] font-semibold text-[#1C1917] block">Test Voice Narration Before Rendering:</span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={previewText}
                    onChange={(e) => setPreviewText(e.target.value)}
                    placeholder="Enter sentence to synthesize..."
                    className="flex-1 px-3 py-1.5 rounded-lg border border-[#D6D2C4] text-xs text-[#1C1917] focus:outline-none"
                  />
                  <button
                    onClick={handleVoicePreview}
                    disabled={previewLoading || !previewText.trim()}
                    className="px-4 py-1.5 rounded-lg bg-[#C5A059] hover:bg-[#B38E46] text-black text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    {previewLoading ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Play className="w-3.5 h-3.5 fill-black" />
                    )}
                    <span>{previewLoading ? 'Synthesizing...' : 'Test Voice'}</span>
                  </button>
                </div>

                {previewAudioUrl && (
                  <div className="flex items-center gap-3 pt-2">
                    <audio src={previewAudioUrl} controls autoPlay className="h-8 flex-1" />
                    <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Duration: {previewDuration}s
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-between pt-4 border-t border-[#F2EFE6]">
            <button
              onClick={() => setCurrentStep(2)}
              className="px-5 py-2.5 rounded-xl border border-[#D6D2C4] hover:bg-stone-50 text-xs font-semibold text-[#1C1917] flex items-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Images</span>
            </button>
            <button
              onClick={handleStartGeneration}
              className="px-8 py-2.5 rounded-xl bg-[#C5A059] hover:bg-[#B38E46] text-black text-xs font-bold flex items-center gap-2 cursor-pointer shadow-lg shadow-[#C5A059]/20"
            >
              <Sparkles className="w-4 h-4" />
              <span>Generate Property Video</span>
            </button>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          STEP 4: GENERATION MONITOR & FINAL EXPORT
      ───────────────────────────────────────────────────────────── */}
      {currentStep === 4 && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-[#E8E5DA] p-6 md:p-8 space-y-6 shadow-sm">
            <div className="border-b border-[#F2EFE6] pb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-serif font-bold text-[#1C1917]">
                  {jobStatus?.status === 'completed'
                    ? 'Video Generation Complete'
                    : jobStatus?.status === 'failed'
                    ? 'Video Generation Failed'
                    : 'Rendering In Progress...'}
                </h2>
                <p className="text-xs text-[#78716C] mt-1">
                  Property Studio AI is executing the video compilation and encoding pipeline.
                </p>
              </div>
              {jobStatus?.status === 'completed' && (
                <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold">
                  100% Ready
                </span>
              )}
            </div>

            {/* Error Message & Retry */}
            {generationError && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block mb-1">Video Generation Error</span>
                    <span>{generationError}</span>
                  </div>
                </div>
                <button
                  onClick={handleStartGeneration}
                  className="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold text-xs flex items-center gap-1.5 flex-shrink-0 cursor-pointer shadow-sm transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retry Job</span>
                </button>
              </div>
            )}

            {/* Progress Bar & Stage Status */}
            {isGenerating && (
              <div className="space-y-3 p-5 rounded-2xl bg-[#14171F] text-white">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-[#E5C378] flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#C5A059] animate-ping" />
                    {jobStatus?.current_stage || 'Processing'}
                  </span>
                  <span className="font-mono text-[#A8A29E]">
                    {Math.round((jobStatus?.progress || 0.1) * 100)}%
                  </span>
                </div>

                <div className="w-full bg-[#282F3F] h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-[#C5A059] via-[#D4AF37] to-[#E5C378] h-full transition-all duration-300 rounded-full"
                    style={{ width: `${Math.round((jobStatus?.progress || 0.1) * 100)}%` }}
                  />
                </div>

                <p className="text-xs text-[#8E95A5] leading-relaxed">
                  {jobStatus?.message || 'Executing architectural scene composition...'}
                </p>
              </div>
            )}

            {/* Completed Video Player */}
            {jobStatus?.status === 'completed' && jobStatus.video_url && (
              <div className="space-y-4">
                <div className="rounded-2xl overflow-hidden bg-black shadow-xl aspect-video relative">
                  <video
                    src={jobStatus.video_url}
                    controls
                    autoPlay
                    className="w-full h-full object-contain"
                  />
                </div>

                <div className="p-4 rounded-xl bg-[#F7F5EE] border border-[#E8E5DA] flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-bold text-[#1C1917] block">
                      {jobStatus.property_name || property.name} Showcase
                    </span>
                    <span className="text-[11px] text-[#78716C]">
                      {jobStatus.duration_seconds}s Duration • {jobStatus.file_size_mb} MB • {jobStatus.resolution || '1920x1080'} H.264
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        setCurrentStep(1);
                        setJobId(null);
                        setJobStatus(null);
                      }}
                      className="px-4 py-2 rounded-xl border border-[#D6D2C4] hover:bg-stone-50 text-xs font-semibold text-[#1C1917] flex items-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Create Another Video</span>
                    </button>

                    {jobStatus.download_url && (
                      <a
                        href={jobStatus.download_url}
                        download
                        className="px-5 py-2 rounded-xl bg-[#C5A059] hover:bg-[#B38E46] text-black text-xs font-bold flex items-center gap-2 shadow-md"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download MP4 Video</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Scene Breakdown Cards */}
            {jobStatus?.scenes && jobStatus.scenes.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-[#F2EFE6]">
                <span className="text-xs font-bold text-[#1C1917] uppercase tracking-wider block">
                  Promotional Scenes Breakdown ({jobStatus.scenes.length} Scenes)
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {jobStatus.scenes.map((scene) => (
                    <div
                      key={scene.index}
                      className="p-3.5 rounded-xl bg-[#FDFCF7] border border-[#E8E5DA] space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#C5A059]/15 text-[#996515] border border-[#C5A059]/30 uppercase">
                          {scene.category_tag}
                        </span>
                        <span className="text-[10px] font-mono text-[#78716C]">{scene.duration}s</span>
                      </div>
                      <h4 className="text-xs font-bold text-[#1C1917]">{scene.headline}</h4>
                      <p className="text-[11px] text-[#78716C] line-clamp-1">{scene.subheadline}</p>
                      {scene.voiceover && (
                        <p className="text-[10px] text-[#57534E] italic pt-1 border-t border-[#F2EFE6] line-clamp-2">
                          "{scene.voiceover}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

