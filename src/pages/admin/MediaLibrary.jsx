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

const MOCK_IMAGES = [
  { id: 1, name: "african-children-having-fun-with-jumping-rope-in-a-village-in-northern-kenya-east-africa.webp", src: "/images/others/african-children-having-fun-with-jumping-rope-in-a-village-in-northern-kenya-east-africa.webp", category: "Gallery", size: "2.4 MB", dimensions: "1920 × 1080", date: "2024-01-15" },
  { id: 2, name: "kadesh images_02.jpg", src: "/images/kadesh images_02.jpg", category: "Projects", size: "1.8 MB", dimensions: "1600 × 900", date: "2024-01-14" },
  { id: 3, name: "kadesh images_03.jpg", src: "/images/kadesh images_03.jpg", category: "Gallery", size: "3.1 MB", dimensions: "1920 × 1280", date: "2024-01-13" },
  { id: 4, name: "kadesh images_04.jpg", src: "/images/kadesh images_04.jpg", category: "Partners", size: "1.5 MB", dimensions: "1200 × 800", date: "2024-01-12" },
  { id: 5, name: "kadesh images_05.jpg", src: "/images/kadesh images_05.jpg", category: "Gallery", size: "2.7 MB", dimensions: "1920 × 1440", date: "2024-01-11" },
  { id: 6, name: "kadesh images_06.jpg", src: "/images/kadesh images_06.jpg", category: "Projects", size: "2.0 MB", dimensions: "1600 × 1067", date: "2024-01-10" },
];

const FILTERS = ["All", "Gallery", "Projects", "Partners"];

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function MediaLibrary() {
  const [images, setImages] = useState(MOCK_IMAGES);
  const [selectedImage, setSelectedImage] = useState(null);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const fileInputRef = useRef(null);

  const filteredImages = images.filter((img) => {
    const matchesFilter = filter === "All" || img.category === filter;
    const matchesSearch = img.name.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const simulateUpload = (file) => {
    setUploading(true);
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setUploading(false);
          const newImage = {
            id: Date.now(),
            name: file.name,
            src: URL.createObjectURL(file),
            category: "Gallery",
            size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
            dimensions: "—",
            date: new Date().toISOString().split("T")[0],
          };
          setImages((prev) => [newImage, ...prev]);
          return 0;
        }
        return prev + 10;
      });
    }, 150);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      simulateUpload(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      simulateUpload(file);
    }
  };

  const handleDelete = (id) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
    setShowDeleteConfirm(null);
    if (selectedImage?.id === id) setSelectedImage(null);
  };

  return (
    <motion.div variants={itemVariants} initial="hidden" animate="visible">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h2 className="font-display text-2xl font-semibold text-deep-navy">
          Media Library
        </h2>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-vibrant-blue text-white rounded-lg font-body text-sm font-semibold hover:bg-vibrant-blue/90 transition-colors"
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
