import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  Grid,
  List,
  Search,
  Trash2,
  X,
  Image as ImageIcon,
  Calendar,
  HardDrive,
  Link2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useGalleryImages, useCreateGalleryImage, useDeleteGalleryImage } from "@/hooks/useGallery";
import { uploadImage, getPublicUrl } from "@/services/upload";

const FILTERS = ["All", "Gallery", "Projects", "Partners"];

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function MediaLibrary() {
  const { data: galleryData, isLoading } = useGalleryImages();
  const createGalleryImage = useCreateGalleryImage();
  const deleteGalleryImage = useDeleteGalleryImage();

  const [selectedImage, setSelectedImage] = useState(null);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const fileInputRef = useRef(null);

  const images = galleryData?.data?.map(img => ({
    ...img,
    src: img.image_url,
    name: img.title || "Untitled Image",
    date: new Date(img.created_at).toISOString().split("T")[0],
  })) || [];

  const filteredImages = images.filter((img) => {
    const matchesFilter = filter === "All" || img.category === filter;
    const matchesSearch = img.name.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleUpload = async (file) => {
    setUploading(true);
    setUploadProgress(0);

    try {
      const ext = file.name.split(".").pop();
      const path = `gallery/${Date.now()}.${ext}`;
      
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => (prev >= 90 ? 90 : prev + 10));
      }, 150);

      const { error: uploadErr } = await uploadImage(file, "images", path);
      clearInterval(progressInterval);

      if (uploadErr) throw uploadErr;

      const publicUrl = getPublicUrl("images", path);
      
      setUploadProgress(100);

      await createGalleryImage.mutateAsync({
        title: file.name,
        image_url: publicUrl,
        category: "Gallery",
        sort_order: 0
      });

    } catch (err) {
      console.error("Upload failed:", err);
      alert("Upload failed: " + err.message);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      handleUpload(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      handleUpload(file);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteGalleryImage.mutateAsync(id);
      setShowDeleteConfirm(null);
      if (selectedImage?.id === id) setSelectedImage(null);
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  return (
    <motion.div variants={itemVariants} initial="hidden" animate="visible">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h2 className="font-display text-2xl font-semibold text-deep-navy">
          Media Library
        </h2>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-vibrant-blue text-white rounded-lg font-body text-sm font-semibold hover:bg-vibrant-blue/90 transition-colors disabled:opacity-50"
        >
          <Upload className="h-4 w-4" />
          Upload Image
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Upload zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={cn(
          "border-2 border-dashed rounded-xl p-8 text-center mb-6 transition-colors",
          dragOver
            ? "border-vibrant-blue bg-vibrant-blue/5"
            : "border-gray-300 hover:border-gray-400"
        )}
      >
        <Upload className="h-10 w-10 text-gray-400 mx-auto mb-3" />
        <p className="font-body text-sm text-on-surface-variant">
          Drag and drop an image here, or{" "}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-vibrant-blue font-semibold hover:underline"
          >
            browse
          </button>
        </p>
        <p className="font-body text-xs text-on-surface-variant mt-1">
          PNG, JPG, GIF up to 10MB
        </p>
        {uploading && (
          <div className="mt-4 max-w-xs mx-auto">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-vibrant-blue rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${uploadProgress}%` }}
                transition={{ duration: 0.15 }}
              />
            </div>
            <p className="font-body text-xs text-on-surface-variant mt-1">
              Uploading... {uploadProgress}%
            </p>
          </div>
        )}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant" />
          <input
            type="text"
            placeholder="Search images..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-lg pl-9 pr-4 py-2 font-body text-sm focus:outline-none focus:ring-2 focus:ring-vibrant-blue/20 focus:border-vibrant-blue"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-3 py-1.5 rounded-md font-body text-xs font-medium transition-colors",
                filter === f
                  ? "bg-white text-deep-navy shadow-sm"
                  : "text-on-surface-variant hover:text-deep-navy"
              )}
            >
              {f}
            </button>
          ))}
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode("grid")}
            className={cn(
              "p-1.5 rounded-md transition-colors",
              viewMode === "grid"
                ? "bg-white text-deep-navy shadow-sm"
                : "text-on-surface-variant"
            )}
          >
            <Grid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={cn(
              "p-1.5 rounded-md transition-colors",
              viewMode === "list"
                ? "bg-white text-deep-navy shadow-sm"
                : "text-on-surface-variant"
            )}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Image grid/list */}
        <div className="flex-1 min-w-0">
          {viewMode === "grid" ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {filteredImages.map((img) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImage(img)}
                  className={cn(
                    "group relative aspect-square rounded-xl overflow-hidden border-2 transition-colors",
                    selectedImage?.id === img.id
                      ? "border-vibrant-blue"
                      : "border-transparent hover:border-gray-300"
                  )}
                >
                  <img
                    src={img.src}
                    alt={img.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-end p-2">
                    <span className="font-body text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity truncate">
                      {img.name}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
              {filteredImages.map((img) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImage(img)}
                  className={cn(
                    "w-full flex items-center gap-4 px-4 py-3 text-left hover:bg-gray-50 transition-colors",
                    selectedImage?.id === img.id && "bg-vibrant-blue/5"
                  )}
                >
                  <img
                    src={img.src}
                    alt={img.name}
                    className="w-12 h-12 rounded-lg object-cover shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-body text-sm font-medium text-deep-navy truncate">
                      {img.name}
                    </p>
                    <p className="font-body text-xs text-on-surface-variant">
                      {img.size} &middot; {img.category}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details panel */}
        <AnimatePresence>
          {selectedImage && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="hidden lg:block w-72 shrink-0 bg-white rounded-xl border border-gray-200 p-5 h-fit sticky top-0"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-sm font-semibold text-deep-navy">
                  Image Details
                </h3>
                <button
                  onClick={() => setSelectedImage(null)}
                  className="text-on-surface-variant hover:text-deep-navy"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="rounded-lg overflow-hidden mb-4">
                <img
                  src={selectedImage.src}
                  alt={selectedImage.name}
                  className="w-full aspect-video object-cover"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <ImageIcon className="h-4 w-4 text-on-surface-variant mt-0.5 shrink-0" />
                  <div>
                    <p className="font-body text-xs text-on-surface-variant">Name</p>
                    <p className="font-body text-sm text-deep-navy">{selectedImage.name}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <HardDrive className="h-4 w-4 text-on-surface-variant mt-0.5 shrink-0" />
                  <div>
                    <p className="font-body text-xs text-on-surface-variant">Size</p>
                    <p className="font-body text-sm text-deep-navy">{selectedImage.size}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Grid className="h-4 w-4 text-on-surface-variant mt-0.5 shrink-0" />
                  <div>
                    <p className="font-body text-xs text-on-surface-variant">Dimensions</p>
                    <p className="font-body text-sm text-deep-navy">{selectedImage.dimensions}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Calendar className="h-4 w-4 text-on-surface-variant mt-0.5 shrink-0" />
                  <div>
                    <p className="font-body text-xs text-on-surface-variant">Uploaded</p>
                    <p className="font-body text-sm text-deep-navy">{selectedImage.date}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Link2 className="h-4 w-4 text-on-surface-variant mt-0.5 shrink-0" />
                  <div>
                    <p className="font-body text-xs text-on-surface-variant">URL</p>
                    <p className="font-body text-xs text-vibrant-blue break-all">{selectedImage.src}</p>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-gray-100">
                {showDeleteConfirm === selectedImage.id ? (
                  <div className="flex items-center gap-2">
                    <span className="font-body text-xs text-red-600">Delete?</span>
                    <button
                      onClick={() => handleDelete(selectedImage.id)}
                      className="px-3 py-1 bg-red-600 text-white rounded-md font-body text-xs font-semibold hover:bg-red-700 transition-colors"
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(null)}
                      className="px-3 py-1 bg-gray-100 text-gray-600 rounded-md font-body text-xs font-medium hover:bg-gray-200 transition-colors"
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowDeleteConfirm(selectedImage.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg font-body text-xs font-medium transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete Image
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
