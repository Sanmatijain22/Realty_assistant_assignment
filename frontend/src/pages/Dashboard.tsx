import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  Video, 
  Layers, 
  Clock, 
  ArrowRight, 
  Play, 
  Download, 
  CheckCircle2, 
  Building2,
  Volume2
} from 'lucide-react';
import { api } from '../services/api';
import { JobStatus, PropertyPreset } from '../types';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<JobStatus[]>([]);
  const [presets, setPresets] = useState<PropertyPreset[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<JobStatus | null>(null);

  useEffect(() => {
    Promise.all([api.getProjects(), api.getPresets()])
      .then(([jobsData, presetsData]) => {
        setProjects(jobsData);
        setPresets(presetsData.presets || []);
      })
      .catch((err) => console.error('Error loading dashboard data:', err))
      .finally(() => setLoading(false));
  }, []);

  const completedProjects = projects.filter((p) => p.status === 'completed');

  const handleUsePreset = (preset: PropertyPreset) => {
    localStorage.setItem('estate_studio_active_preset', JSON.stringify(preset));
    navigate('/create');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Welcome Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-[#14171F] border border-[#2B3040] p-8 md:p-10 shadow-xl text-white">
        <div className="absolute -right-20 -top-20 w-96 h-96 bg-[#C5A059]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C5A059]/20 border border-[#C5A059]/40 text-[#E5C378] text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Real Estate Production Studio</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-serif font-medium tracking-tight text-white mb-3">
            Cinematic Property Videos, Powered by AI
          </h1>
          <p className="text-[#A1A7B7] text-sm md:text-base leading-relaxed mb-6">
            Transform architectural photographs and listing specifications into luxury 1080p promotional videos with synchronized voice narration, glassmorphic typography, and ambient music.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => navigate('/create')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#C5A059] hover:bg-[#B38E46] text-black font-semibold text-xs tracking-wide transition shadow-lg shadow-[#C5A059]/25 cursor-pointer"
            >
              <Video className="w-4 h-4" />
              <span>Create Property Video</span>
            </button>
            <button
              onClick={() => navigate('/gallery')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#1F2430] hover:bg-[#282F3F] text-white font-medium text-xs border border-[#373F54] transition cursor-pointer"
            >
              <span>Explore Sample Properties</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#C5A059]" />
            </button>
          </div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 border border-[#E8E5DA] shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-[#78716C] uppercase tracking-wider">Videos Generated</span>
            <div className="w-8 h-8 rounded-lg bg-[#F7F5EE] flex items-center justify-center text-[#C5A059]">
              <Video className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#1C1917]">{completedProjects.length}</div>
          <p className="text-[11px] text-[#A8A29E] mt-1">Ready for high-definition streaming</p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-[#E8E5DA] shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-[#78716C] uppercase tracking-wider">Properties Created</span>
            <div className="w-8 h-8 rounded-lg bg-[#F7F5EE] flex items-center justify-center text-[#C5A059]">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#1C1917]">{presets.length + completedProjects.length}</div>
          <p className="text-[11px] text-[#A8A29E] mt-1">Archived in listing repository</p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-[#E8E5DA] shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-[#78716C] uppercase tracking-wider">Avg Render Speed</span>
            <div className="w-8 h-8 rounded-lg bg-[#F7F5EE] flex items-center justify-center text-[#C5A059]">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#1C1917]">~35 sec</div>
          <p className="text-[11px] text-emerald-600 font-medium mt-1">Hardware acceleration active</p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-[#E8E5DA] shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-[#78716C] uppercase tracking-wider">Audio Engine</span>
            <div className="w-8 h-8 rounded-lg bg-[#F7F5EE] flex items-center justify-center text-[#C5A059]">
              <Volume2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#1C1917]">Dual-Sync</div>
          <p className="text-[11px] text-[#A8A29E] mt-1">Voiceover + Royalty-free BGM</p>
        </div>
      </div>

      {/* Quick Launch Presets Showcase */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-serif font-semibold text-[#1C1917]">Featured Properties</h2>
            <p className="text-xs text-[#78716C]">Load sample properties directly into the Studio wizard with 1 click.</p>
          </div>
          <button
            onClick={() => navigate('/gallery')}
            className="text-xs font-medium text-[#C5A059] hover:text-[#B38E46] flex items-center gap-1 cursor-pointer"
          >
            <span>View all gallery</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {presets.map((preset) => {
            const firstImg = preset.images[0]?.preview_url || '/api/media/sample/sample_images/apartment_01_exterior.jpg';
            return (
              <div
                key={preset.id}
                className="group bg-white rounded-2xl border border-[#E8E5DA] overflow-hidden hover:shadow-md transition-all duration-200 flex flex-col sm:flex-row"
              >
                <div className="sm:w-48 h-48 sm:h-auto relative overflow-hidden bg-stone-100 flex-shrink-0">
                  <img
                    src={firstImg}
                    alt={preset.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80';
                    }}
                  />
                  <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded bg-black/70 backdrop-blur-md text-[10px] font-semibold text-[#E5C378] tracking-wider uppercase">
                    {preset.property_type}
                  </span>
                </div>
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-serif font-bold text-base text-[#1C1917] group-hover:text-[#C5A059] transition-colors">
                        {preset.name}
                      </h3>
                      <span className="text-xs font-bold text-[#C5A059] whitespace-nowrap">{preset.price}</span>
                    </div>
                    <p className="text-xs text-[#78716C] mb-2">{preset.location} • {preset.total_area}</p>
                    <p className="text-xs text-[#57534E] line-clamp-2 leading-relaxed mb-3">
                      {preset.description}
                    </p>
                  </div>
                  <div className="pt-3 border-t border-[#F2EFE6] flex items-center justify-between">
                    <span className="text-[11px] text-[#78716C]">{preset.images.length} High-Res Photos</span>
                    <button
                      onClick={() => handleUsePreset(preset)}
                      className="px-3 py-1.5 rounded-lg bg-[#F7F5EE] hover:bg-[#C5A059] hover:text-black text-xs font-semibold text-[#1C1917] transition cursor-pointer flex items-center gap-1.5"
                    >
                      <span>Load into Studio</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Generated Projects */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-serif font-semibold text-[#1C1917]">Recent Production Projects</h2>
            <p className="text-xs text-[#78716C]">Watch and download previously compiled video campaigns.</p>
          </div>
          {completedProjects.length > 0 && (
            <button
              onClick={() => navigate('/projects')}
              className="text-xs font-medium text-[#C5A059] hover:text-[#B38E46] flex items-center gap-1 cursor-pointer"
            >
              <span>View all projects ({completedProjects.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {completedProjects.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-[#D6D2C4] p-10 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#F7F5EE] text-[#C5A059] flex items-center justify-center mx-auto">
              <Video className="w-6 h-6" />
            </div>
            <h3 className="font-serif font-medium text-[#1C1917]">No Generated Videos Yet</h3>
            <p className="text-xs text-[#78716C] max-w-sm mx-auto">
              Launch the 4-step studio wizard to generate your first promotional showcase video with voice narration.
            </p>
            <button
              onClick={() => navigate('/create')}
              className="px-4 py-2 rounded-lg bg-[#C5A059] hover:bg-[#B38E46] text-black font-semibold text-xs transition cursor-pointer inline-flex items-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Create First Video</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {completedProjects.slice(0, 3).map((job) => (
              <div
                key={job.job_id}
                className="bg-white rounded-2xl border border-[#E8E5DA] overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between"
              >
                <div className="relative aspect-video bg-black/90 group">
                  {job.thumbnail_url ? (
                    <img
                      src={job.thumbnail_url}
                      alt={job.property_name || 'Property'}
                      className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#78716C]">
                      <Video className="w-8 h-8" />
                    </div>
                  )}
                  <button
                    onClick={() => setSelectedVideo(job)}
                    className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-[#C5A059]/90 hover:bg-[#C5A059] text-black flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 cursor-pointer"
                  >
                    <Play className="w-5 h-5 ml-0.5 fill-black" />
                  </button>
                  <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/80 backdrop-blur-md text-[10px] font-mono text-white">
                    {job.duration_seconds ? `${job.duration_seconds}s` : 'MP4'}
                  </span>
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-serif font-bold text-sm text-[#1C1917] mb-1">
                      {job.property_name || 'Listing Showcase'}
                    </h3>
                    <p className="text-[11px] text-[#78716C] mb-3">
                      Created on {job.created_at || 'Recently'} • {job.file_size_mb || 1.5} MB
                    </p>
                  </div>
                  <div className="pt-3 border-t border-[#F2EFE6] flex items-center justify-between">
                    <button
                      onClick={() => setSelectedVideo(job)}
                      className="text-xs font-semibold text-[#1C1917] hover:text-[#C5A059] flex items-center gap-1 cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Watch</span>
                    </button>
                    {job.download_url && (
                      <a
                        href={job.download_url}
                        download
                        className="text-xs font-semibold text-[#C5A059] hover:text-[#B38E46] flex items-center gap-1"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download MP4</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Video Modal Player */}
      {selectedVideo && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#14171F] border border-[#2B3040] rounded-2xl overflow-hidden max-w-3xl w-full shadow-2xl text-white">
            <div className="p-4 border-b border-[#2B3040] flex items-center justify-between">
              <div>
                <h3 className="font-serif font-semibold text-base text-white">
                  {selectedVideo.property_name || 'Property Showcase'}
                </h3>
                <p className="text-xs text-[#8E95A5]">1080p H.264 • {selectedVideo.duration_seconds}s</p>
              </div>
              <button
                onClick={() => setSelectedVideo(null)}
                className="w-8 h-8 rounded-full bg-[#1F2430] hover:bg-[#282F3F] text-white flex items-center justify-center text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="p-4 bg-black">
              <video
                src={selectedVideo.video_url}
                controls
                autoPlay
                className="w-full aspect-video rounded-xl shadow-lg"
              />
            </div>
            <div className="p-4 border-t border-[#2B3040] flex items-center justify-between">
              <span className="text-xs text-[#8E95A5]">
                {selectedVideo.file_size_mb} MB • High-Fidelity Audio
              </span>
              <a
                href={selectedVideo.download_url}
                download
                className="px-4 py-2 rounded-lg bg-[#C5A059] hover:bg-[#B38E46] text-black font-semibold text-xs flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Download MP4</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

