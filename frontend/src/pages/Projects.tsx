import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Clapperboard, 
  Video, 
  Play, 
  Download, 
  RefreshCw, 
  Sparkles, 
  Search, 
  Calendar, 
  Clock, 
  HardDrive,
  Eye
} from 'lucide-react';
import { api } from '../services/api';
import { JobStatus } from '../types';

export const Projects: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<JobStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVideo, setSelectedVideo] = useState<JobStatus | null>(null);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const data = await api.getProjects();
      setProjects(data);
    } catch (err) {
      console.error('Error fetching projects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const filteredProjects = projects.filter((p) => {
    const name = p.property_name || 'Property Showcase';
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#E8E5DA] shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Clapperboard className="w-5 h-5 text-[#C5A059]" />
            <h1 className="text-xl font-serif font-bold text-[#1C1917]">Production Project Vault</h1>
          </div>
          <p className="text-xs text-[#78716C]">
            Access and manage previously rendered high-definition property video campaigns.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#A8A29E] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects..."
              className="pl-9 pr-3.5 py-2 rounded-xl border border-[#D6D2C4] text-xs text-[#1C1917] bg-white focus:outline-none focus:border-[#C5A059] w-48 sm:w-60"
            />
          </div>

          <button
            onClick={() => navigate('/create')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#C5A059] hover:bg-[#B38E46] text-black font-semibold text-xs transition cursor-pointer shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>New Video</span>
          </button>
        </div>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs text-[#78716C]">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#C5A059]" />
          <span>Loading project catalog...</span>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-[#D6D2C4] p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#F7F5EE] text-[#C5A059] flex items-center justify-center mx-auto">
            <Video className="w-6 h-6" />
          </div>
          <h3 className="font-serif font-semibold text-[#1C1917]">No Projects Found</h3>
          <p className="text-xs text-[#78716C] max-w-sm mx-auto">
            {searchQuery
              ? `No projects matching "${searchQuery}".`
              : 'You have not produced any property promotional videos yet.'}
          </p>
          <button
            onClick={() => navigate('/create')}
            className="px-5 py-2 rounded-xl bg-[#C5A059] hover:bg-[#B38E46] text-black text-xs font-semibold inline-flex items-center gap-2 transition cursor-pointer shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Create First Video</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <div
              key={project.job_id}
              className="bg-white rounded-2xl border border-[#E8E5DA] overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between group"
            >
              {/* Thumbnail Container */}
              <div className="relative aspect-video bg-black/95 overflow-hidden">
                {project.thumbnail_url ? (
                  <img
                    src={project.thumbnail_url}
                    alt={project.property_name || 'Property'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#78716C]">
                    <Video className="w-10 h-10" />
                  </div>
                )}

                {project.status === 'completed' && (
                  <button
                    onClick={() => setSelectedVideo(project)}
                    className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-[#C5A059]/90 hover:bg-[#C5A059] text-black flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 cursor-pointer"
                  >
                    <Play className="w-5 h-5 ml-0.5 fill-black" />
                  </button>
                )}

                <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold backdrop-blur-md uppercase tracking-wider ${
                      project.status === 'completed'
                        ? 'bg-emerald-500/90 text-white'
                        : project.status === 'failed'
                        ? 'bg-rose-500/90 text-white'
                        : 'bg-amber-500/90 text-black'
                    }`}
                  >
                    {project.status}
                  </span>
                </div>

                <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded bg-black/80 backdrop-blur-md text-[10px] font-mono text-white">
                  {project.duration_seconds ? `${project.duration_seconds}s` : '1080p'}
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="font-serif font-bold text-base text-[#1C1917] group-hover:text-[#C5A059] transition-colors mb-2">
                    {project.property_name || 'Property Showcase'}
                  </h3>

                  <div className="grid grid-cols-2 gap-2 text-[11px] text-[#78716C] mb-3">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#A8A29E]" />
                      <span>{project.created_at ? project.created_at.split(' ')[0] : 'Recent'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#A8A29E]" />
                      <span>{project.duration_seconds || 24}s Duration</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <HardDrive className="w-3.5 h-3.5 text-[#A8A29E]" />
                      <span>{project.file_size_mb || 1.5} MB</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-[#A8A29E]" />
                      <span>1280x720 MP4</span>
                    </div>
                  </div>

                  {project.scenes && project.scenes.length > 0 && (
                    <div className="flex items-center gap-1 overflow-hidden">
                      {project.scenes.slice(0, 4).map((s, idx) => (
                        <span
                          key={idx}
                          className="text-[9px] px-1.5 py-0.5 bg-[#F7F5EE] border border-[#E8E5DA] rounded text-[#78716C] truncate"
                        >
                          {s.category_tag}
                        </span>
                      ))}
                      {project.scenes.length > 4 && (
                        <span className="text-[9px] text-[#A8A29E]">+{project.scenes.length - 4}</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div className="pt-3 border-t border-[#F2EFE6] flex items-center justify-between gap-2">
                  <button
                    onClick={() => setSelectedVideo(project)}
                    className="px-3 py-1.5 rounded-lg bg-[#F7F5EE] hover:bg-stone-200 text-xs font-semibold text-[#1C1917] flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Watch</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigate('/create')}
                      className="px-2.5 py-1.5 rounded-lg border border-[#D6D2C4] hover:bg-stone-50 text-[11px] font-medium text-[#78716C] hover:text-[#1C1917] transition cursor-pointer"
                      title="Duplicate or modify in studio"
                    >
                      <RefreshCw className="w-3 h-3" />
                    </button>
                    {project.download_url && (
                      <a
                        href={project.download_url}
                        download
                        className="px-3.5 py-1.5 rounded-lg bg-[#C5A059] hover:bg-[#B38E46] text-black text-xs font-bold flex items-center gap-1.5 shadow-sm"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Video Modal Player */}
      {selectedVideo && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#14171F] border border-[#2B3040] rounded-2xl overflow-hidden max-w-3xl w-full shadow-2xl text-white">
            <div className="p-4 border-b border-[#2B3040] flex items-center justify-between">
              <div>
                <h3 className="font-serif font-bold text-base text-white">
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
                className="px-5 py-2 rounded-xl bg-[#C5A059] hover:bg-[#B38E46] text-black font-bold text-xs flex items-center gap-2 shadow-md"
              >
                <Download className="w-4 h-4" />
                <span>Download MP4 Video</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
