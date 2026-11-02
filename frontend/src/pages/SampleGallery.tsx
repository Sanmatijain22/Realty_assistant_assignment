import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Images, 
  Sparkles, 
  ArrowRight, 
  Building2, 
  Compass, 
  Tag, 
  Check, 
  MapPin, 
  Maximize2 
} from 'lucide-react';
import { api } from '../services/api';
import { PropertyPreset, ImageItem } from '../types';

export const SampleGallery: React.FC = () => {
  const navigate = useNavigate();
  const [presets, setPresets] = useState<PropertyPreset[]>([]);
  const [activePreset, setActivePreset] = useState<PropertyPreset | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<ImageItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getPresets()
      .then((data) => {
        setPresets(data.presets);
        if (data.presets && data.presets.length > 0) {
          setActivePreset(data.presets[0]);
        }
      })
      .catch((err) => console.error('Error fetching gallery presets:', err))
      .finally(() => setLoading(false));
  }, []);

  const handleLoadIntoStudio = (preset: PropertyPreset) => {
    localStorage.setItem('estate_studio_active_preset', JSON.stringify(preset));
    navigate('/create');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#E8E5DA] shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Images className="w-5 h-5 text-[#C5A059]" />
            <h1 className="text-xl font-serif font-bold text-[#1C1917]">Architectural Sample Gallery</h1>
          </div>
          <p className="text-xs text-[#78716C]">
            Explore curated luxury real estate listings and high-resolution architectural photography.
          </p>
        </div>

        {activePreset && (
          <button
            onClick={() => handleLoadIntoStudio(activePreset)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#C5A059] hover:bg-[#B38E46] text-black font-semibold text-xs transition cursor-pointer shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Load {activePreset.name} into Studio</span>
          </button>
        )}
      </div>

      {/* Preset Switcher Tabs */}
      <div className="flex items-center gap-3 overflow-x-auto pb-1">
        {presets.map((p) => {
          const isSelected = activePreset?.id === p.id;
          return (
            <button
              key={p.id}
              onClick={() => setActivePreset(p)}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                isSelected
                  ? 'bg-[#1C1917] text-white shadow-sm'
                  : 'bg-white border border-[#E8E5DA] text-[#78716C] hover:text-[#1C1917] hover:bg-stone-50'
              }`}
            >
              <Building2 className={`w-3.5 h-3.5 ${isSelected ? 'text-[#C5A059]' : 'text-[#A8A29E]'}`} />
              <span>{p.name}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${isSelected ? 'bg-white/15 text-white' : 'bg-stone-100 text-[#78716C]'}`}>
                {p.price}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active Preset Showcase */}
      {activePreset && (
        <div className="space-y-6">
          {/* Property Hero Overview */}
          <div className="bg-white rounded-2xl border border-[#E8E5DA] p-6 md:p-8 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 border-b border-[#F2EFE6] pb-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#C5A059]/15 text-[#996515] border border-[#C5A059]/30 text-[10px] font-bold uppercase tracking-wider">
                    {activePreset.property_type}
                  </span>
                  <span className="text-xs text-[#78716C] flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-[#A8A29E]" />
                    {activePreset.location}
                  </span>
                </div>
                <h2 className="text-2xl font-serif font-bold text-[#1C1917]">{activePreset.name}</h2>
                <p className="text-xs text-[#57534E] max-w-2xl leading-relaxed">
                  {activePreset.description}
                </p>
              </div>

              <div className="bg-[#F7F5EE] p-5 rounded-2xl border border-[#E8E5DA] flex-shrink-0 text-left md:text-right space-y-1">
                <span className="text-[10px] uppercase font-semibold text-[#78716C] block">Listing Valuation</span>
                <span className="text-2xl font-serif font-bold text-[#C5A059] block">{activePreset.price}</span>
                <span className="text-xs text-[#78716C] block">{activePreset.total_area}</span>
              </div>
            </div>

            {/* Room Dimensions & Highlights */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6">
              <div className="p-3.5 rounded-xl bg-[#FDFCF7] border border-[#E8E5DA]">
                <span className="text-[10px] text-[#78716C] uppercase font-semibold block mb-0.5">Bedrooms</span>
                <span className="text-sm font-bold text-[#1C1917]">{activePreset.bedrooms} Suites</span>
              </div>
              <div className="p-3.5 rounded-xl bg-[#FDFCF7] border border-[#E8E5DA]">
                <span className="text-[10px] text-[#78716C] uppercase font-semibold block mb-0.5">Bathrooms</span>
                <span className="text-sm font-bold text-[#1C1917]">{activePreset.bathrooms} Bathrooms</span>
              </div>
              <div className="p-3.5 rounded-xl bg-[#FDFCF7] border border-[#E8E5DA]">
                <span className="text-[10px] text-[#78716C] uppercase font-semibold block mb-0.5">Architecture</span>
                <span className="text-sm font-bold text-[#1C1917]">Contemporary</span>
              </div>
              <div className="p-3.5 rounded-xl bg-[#FDFCF7] border border-[#E8E5DA]">
                <span className="text-[10px] text-[#78716C] uppercase font-semibold block mb-0.5">Photographs</span>
                <span className="text-sm font-bold text-[#C5A059]">{activePreset.images.length} High-Res Frames</span>
              </div>
            </div>
          </div>

          {/* Photographic Asset Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#1C1917] uppercase tracking-wider">
                Photographic Showcase Asset Reel
              </h3>
              <span className="text-xs text-[#78716C]">Click any image to expand detail view</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              {activePreset.images.map((img, idx) => (
                <div
                  key={img.id || idx}
                  onClick={() => setSelectedPhoto(img)}
                  className="group bg-white rounded-2xl border border-[#E8E5DA] overflow-hidden shadow-sm hover:shadow-md transition cursor-pointer"
                >
                  <div className="relative aspect-video bg-stone-100 overflow-hidden">
                    <img
                      src={img.preview_url}
                      alt={img.filename}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80';
                      }}
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-white/90 text-black flex items-center justify-center shadow-lg">
                        <Maximize2 className="w-4 h-4" />
                      </div>
                    </div>
                    <span className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded bg-black/75 backdrop-blur-sm text-[10px] font-mono text-white">
                      Photo #{idx + 1}
                    </span>
                  </div>
                  <div className="p-3.5 flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#1C1917] truncate">{img.filename}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[#F7F5EE] border border-[#E0DCD1] text-[#78716C]">
                      16:9 1080p
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Expanded Photo Lightbox */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative max-w-4xl w-full bg-[#14171F] border border-[#2B3040] rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-[#2B3040] flex items-center justify-between text-white">
              <span className="text-xs font-semibold text-white">{selectedPhoto.filename}</span>
              <button
                onClick={() => setSelectedPhoto(null)}
                className="w-8 h-8 rounded-full bg-[#1F2430] hover:bg-[#282F3F] text-white flex items-center justify-center text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="p-2 bg-black flex items-center justify-center">
              <img
                src={selectedPhoto.preview_url}
                alt={selectedPhoto.filename}
                className="max-h-[75vh] w-auto object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

