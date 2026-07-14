import { useState, useRef } from "react";
import { useVideos, useCreateVideo, useUpdateVideo, useDeleteVideo } from "@/hooks/useVideos";
import { uploadImage, getPublicUrl } from "@/services/upload";
import { Upload, Trash2, Edit, ExternalLink, Plus, X, Film, Link as LinkIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const CATEGORIES = ["Education", "Health", "Food Security", "Women & Youth", "Community"];

const inputClasses =
  "w-full px-4 py-3 rounded-lg border border-gray-200 bg-white font-body text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all";

function extractYouTubeId(url) {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  return match ? match[1] : null;
}

export default function VideosManager() {
  const { data: videosData, isLoading } = useVideos();
  const createVideo = useCreateVideo();
  const updateVideo = useUpdateVideo();
  const deleteVideo = useDeleteVideo();

  const [showForm, setShowForm] = useState(false);
  const [editingVideo, setEditingVideo] = useState(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Education");
  const [inputType, setInputType] = useState("youtube");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [videoFile, setVideoFile] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [isFeatured, setIsFeatured] = useState(false);
  const [duration, setDuration] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef(null);
  const thumbRef = useRef(null);

  const videos = videosData?.data || [];

  const resetForm = () => {
    setTitle("");
    setCategory("Education");
    setInputType("youtube");
    setYoutubeUrl("");
    setVideoFile(null);
    setThumbnailFile(null);
    setIsFeatured(false);
    setDuration("");
    setError("");
    setEditingVideo(null);
    setShowForm(false);
  };

  const handleEdit = (video) => {
    setEditingVideo(video);
    setTitle(video.title);
    setCategory(video.category);
    setIsFeatured(video.is_featured);
    setDuration(video.duration || "");
    if (video.url && video.url.includes("youtube")) {
      setInputType("youtube");
      setYoutubeUrl(video.url);
    } else if (video.url) {
      setInputType("upload");
    }
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setUploading(true);

    try {
      let videoUrl = "";

      if (inputType === "youtube") {
        const ytId = extractYouTubeId(youtubeUrl);
        if (!ytId) {
          setError("Invalid YouTube URL");
          setUploading(false);
          return;
        }
        videoUrl = `https://www.youtube.com/embed/${ytId}`;
      } else {
        if (!videoFile && !editingVideo) {
          setError("Please select a video file");
          setUploading(false);
          return;
        }
        if (videoFile) {
          const ext = videoFile.name.split(".").pop();
          const path = `videos/${Date.now()}.${ext}`;
          const { error: uploadErr } = await uploadImage(videoFile, "videos", path);
          if (uploadErr) {
            setError("Failed to upload video: " + uploadErr.message);
            setUploading(false);
            return;
          }
          videoUrl = getPublicUrl("videos", path);
        } else {
          videoUrl = editingVideo.url;
        }
      }

      let thumbnailUrl = editingVideo?.thumbnail || null;
      if (thumbnailFile) {
        const ext = thumbnailFile.name.split(".").pop();
        const path = `thumbnails/${Date.now()}.${ext}`;
        const { error: thumbErr } = await uploadImage(thumbnailFile, "thumbnails", path);
        if (!thumbErr) {
          thumbnailUrl = getPublicUrl("thumbnails", path);
        }
      }

      const videoData = {
        title,
        url: videoUrl,
        category,
        duration: duration || null,
        is_featured: isFeatured,
        thumbnail: thumbnailUrl,
      };

      if (editingVideo) {
        const { error: updateErr } = await updateVideo.mutateAsync({ id: editingVideo.id, ...videoData });
        if (updateErr) throw updateErr;
      } else {
        videoData.sort_order = videos.length;
        const { error: createErr } = await createVideo.mutateAsync(videoData);
        if (createErr) throw createErr;
      }

      resetForm();
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this video?")) return;
    await deleteVideo.mutateAsync(id);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-display text-2xl font-semibold text-[#0D1B3E]">Videos</h2>
          <p className="font-body text-sm text-gray-500 mt-1">Manage your videos — YouTube or uploaded files</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-[#2563EB] text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Video
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display text-xl font-semibold text-[#0D1B3E]">
                {editingVideo ? "Edit Video" : "Add Video"}
              </h3>
              <button onClick={resetForm} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Video title"
                  className={inputClasses}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputClasses}>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Source</label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setInputType("youtube")}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all",
                      inputType === "youtube"
                        ? "border-[#2563EB] bg-blue-50 text-[#2563EB]"
                        : "border-gray-200 text-gray-500 hover:border-gray-300"
                    )}
                  >
                    <LinkIcon className="w-4 h-4" />
                    YouTube URL
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputType("upload")}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all",
                      inputType === "upload"
                        ? "border-[#2563EB] bg-blue-50 text-[#2563EB]"
                        : "border-gray-200 text-gray-500 hover:border-gray-300"
                    )}
                  >
                    <Upload className="w-4 h-4" />
                    Upload File
                  </button>
                </div>
              </div>

              {inputType === "youtube" ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">YouTube URL</label>
                  <input
                    type="url"
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className={inputClasses}
                    required={inputType === "youtube"}
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Video File</label>
                  <input
                    type="file"
                    ref={fileRef}
                    accept="video/*"
                    onChange={(e) => setVideoFile(e.target.files[0])}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 px-4 py-8 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-400 hover:text-blue-500 transition-colors"
                  >
                    <Film className="w-6 h-6" />
                    {videoFile ? videoFile.name : "Click to select video file"}
                  </button>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Thumbnail (optional)</label>
                <input
                  type="file"
                  ref={thumbRef}
                  accept="image/*"
                  onChange={(e) => setThumbnailFile(e.target.files[0])}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => thumbRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 px-4 py-6 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-400 hover:text-blue-500 transition-colors"
                >
                  <Upload className="w-5 h-5" />
                  {thumbnailFile ? thumbnailFile.name : "Click to select thumbnail image"}
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration (optional)</label>
                <input
                  type="text"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="e.g. 4:12"
                  className={inputClasses}
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-[#2563EB] focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Featured video</span>
              </label>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 px-4 py-2.5 bg-[#2563EB] text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {uploading ? "Saving..." : editingVideo ? "Update" : "Add Video"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Videos List */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-[#2563EB] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : videos.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Film className="w-12 h-12 mx-auto mb-3" />
          <p>No videos yet. Click "Add Video" to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {videos.map((video) => (
            <div key={video.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="aspect-video bg-gray-900 relative group">
                {video.thumbnail ? (
                  <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
                ) : video.url?.includes("youtube") ? (
                  <img
                    src={`https://img.youtube.com/vi/${extractYouTubeId(video.url)}/hqdefault.jpg`}
                    alt={video.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500">
                    <Film className="w-10 h-10" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 gap-2">
                  <a
                    href={video.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center text-gray-700 hover:bg-white"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <button
                    onClick={() => handleEdit(video)}
                    className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center text-gray-700 hover:bg-white"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(video.id)}
                    className="w-10 h-10 rounded-full bg-red-500/90 flex items-center justify-center text-white hover:bg-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h4 className="font-medium text-gray-900 truncate">{video.title}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium">
                        {video.category}
                      </span>
                      {video.is_featured && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 font-medium">
                          Featured
                        </span>
                      )}
                      {video.duration && (
                        <span className="text-xs text-gray-400">{video.duration}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
