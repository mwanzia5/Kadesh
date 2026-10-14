import { useState, useRef, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
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
  Layers3,
  Crop,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useGalleryImages,
  useCreateGalleryImage,
  useDeleteGalleryImage,
  useUpdateGalleryImage,
} from "@/hooks/useGallery";
import {
  uploadAndConvert,
  uploadImage,
  deleteImage,
  getPublicUrl,
  extractPathFromUrl,
} from "@/services/upload";
import ImageCropper from "@/components/admin/ImageCropper";
import ImageKitEditor from "@/components/admin/ImageKitEditor";
import { isImageKitConfigured } from "@/lib/imagekit";

const PROJECT_CATEGORIES = [
  "Lumina Charis School of Africa",
  "Ohana Care Clinic",
  "Home Care",
  "Borewell Project",
  "Bethlehem Bread",
];

const PROJECT_STAGES = {
  "Lumina Charis School of Africa": [
    { key: "planning", label: "Land & Planning" },
    { key: "construction", label: "Construction" },
    { key: "opening", label: "School Opening" },
    { key: "classroom", label: "Classroom Activities" },
    { key: "events", label: "Events & Celebrations" },
    { key: "current", label: "Current School" },
  ],
  "Ohana Care Clinic": [
    { key: "assessment", label: "Identification & Assessment" },
    { key: "visits", label: "Clinic Visits" },
    { key: "support", label: "Treatment & Support" },
    { key: "followup", label: "Follow-up & Impact" },
  ],
  "Home Care": [
    { key: "assessment", label: "Needs Assessment" },
    { key: "visits", label: "Home Visits" },
    { key: "support", label: "Practical Support" },
    { key: "followup", label: "Follow-up & Impact" },
  ],
  "Borewell Project": [
    { key: "before", label: "Before the Project" },
    { key: "construction", label: "Construction" },
    { key: "opening", label: "Opening & Dedication" },
    { key: "in-use", label: "In Use & Community Impact" },
  ],
  "Bethlehem Bread": [
    { key: "preparation", label: "Preparation" },
    { key: "distribution", label: "Distribution" },
    { key: "visits", label: "Community Visits" },
    { key: "impact", label: "Impact Stories" },
  ],
};

const LEGACY_PROJECT_NAMES = {};

const FILTERS = ["All", ...PROJECT_CATEGORIES, "Gallery"];

function normalizeProjectCategory(project) {
  return LEGACY_PROJECT_NAMES[project] || project;
}

function getStagesForProject(project) {
  return PROJECT_STAGES[normalizeProjectCategory(project)] || [];
}

function parseGalleryMeta(description) {
  if (!description) return { stageKey: "", date: "", caption: "" };

  try {
    const parsed = JSON.parse(description);
    if (parsed && typeof parsed === "object" && (parsed.__khmGallery || parsed.stageKey || parsed.stage || parsed.date)) {
      return {
        stageKey: String(parsed.stageKey || parsed.stage || ""),
        date: String(parsed.date || ""),
        caption: String(parsed.caption || ""),
      };
    }
  } catch {
    // Legacy descriptions were plain text. Preserve them as captions.
  }

  return { stageKey: "", date: "", caption: String(description) };
}

function buildGalleryMeta({ stageKey = "", date = "", caption = "" }) {
  return JSON.stringify({
    __khmGallery: 1,
    stageKey,
    date,
    caption,
  });
}

function getStageLabel(project, stageKey) {
  return getStagesForProject(project).find((stage) => stage.key === stageKey)?.label || "Unassigned stage";
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

// Edited images get a "?v=<timestamp>" cache-busting suffix appended to their
// URL (see handleEditSave below). Storage paths must always be derived from
// the URL with that query string stripped, or extractPathFromUrl will return
// a malformed path (or null) and silently break future edits/deletes on that
// image.
function stripQuery(url) {
  return url ? url.split("?")[0] : url;
}

function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return null;
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

/**
 * Loads Size + Dimensions for the details panel purely client-side, since
 * the gallery table doesn't currently store either. Dimensions come from
 * decoding the image; size comes from a HEAD request's Content-Length
 * header (falls back gracefully if the storage host doesn't expose it).
 */
function useImageMeta(src) {
  const [meta, setMeta] = useState({ size: null, dimensions: null });

  useEffect(() => {
    if (!src) {
      setMeta({ size: null, dimensions: null });
      return;
    }
    let cancelled = false;
    setMeta({ size: null, dimensions: null });

    const img = new Image();
    img.onload = () => {
      if (!cancelled) {
        setMeta((m) => ({
          ...m,
          dimensions: `${img.naturalWidth} × ${img.naturalHeight}`,
        }));
      }
    };
    img.src = src;

    fetch(src, { method: "HEAD" })
      .then((resp) => {
        const len = resp.headers.get("content-length");
        if (!cancelled && len) {
          setMeta((m) => ({ ...m, size: formatBytes(Number(len)) }));
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [src]);

  return meta;
}

export default function MediaLibrary() {
  const { data: galleryData, isLoading } = useGalleryImages();
  const createGalleryImage = useCreateGalleryImage();
  const deleteGalleryImage = useDeleteGalleryImage();
  const updateGalleryImage = useUpdateGalleryImage();
  const queryClient = useQueryClient();

  const [selectedImage, setSelectedImage] = useState(null);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [uploading, setUploading] = useState(false);
  const [uploadCategory, setUploadCategory] = useState("");
  const [uploadStage, setUploadStage] = useState("");
  const [uploadDate, setUploadDate] = useState("");
  const [bulkCount, setBulkCount] = useState({ current: 0, total: 0 });
  const [dragOver, setDragOver] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [pendingFile, setPendingFile] = useState(null);
  const [showCropper, setShowCropper] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [showEditor, setShowEditor] = useState(false);
  const [editorSourceUrl, setEditorSourceUrl] = useState(null);
  const [pendingTempPath, setPendingTempPath] = useState(null);
  const fileInputRef = useRef(null);

  const selectedMeta = useImageMeta(selectedImage?.src);

  const MAX_BULK = 20;

  const images = galleryData?.data?.map((img) => {
    const meta = parseGalleryMeta(img.description);
    const normalizedCategory = normalizeProjectCategory(img.category);
    return {
      ...img,
      // Keep legacy database rows intact, but present Home Care as the same
      // project as Ohana Care Clinic throughout the admin UI.
      originalCategory: img.category,
      category: normalizedCategory,
      src: img.image_url,
      name: "project-photo",
      date: new Date(img.created_at).toISOString().split("T")[0],
      stageKey: meta.stageKey,
      stageLabel: getStageLabel(normalizedCategory, meta.stageKey),
      journeyDate: meta.date,
      caption: meta.caption,
    };
  }) || [];

  const filteredImages = images.filter((img) => {
    const matchesFilter = filter === "All" || img.category === filter;
    const query = search.toLowerCase();
    const matchesSearch = !query || [img.category, img.stageLabel, img.journeyDate, img.date].some((value) =>
      String(value || "").toLowerCase().includes(query)
    );
    return matchesFilter && matchesSearch;
  });

  const handleUpload = async (file, onProgress, options = {}) => {
    try {
      const ext = file.name.split(".").pop();
      let path = `gallery/${Date.now()}.${ext}`;

      const { error: uploadErr, path: finalPath } = await uploadAndConvert(
        file,
        "images",
        path,
        options
      );
      path = finalPath || path;

      if (uploadErr) throw uploadErr;

      const publicUrl = getPublicUrl("images", path);

      await createGalleryImage.mutateAsync({
        title: `${uploadCategory} photo`,
        image_url: publicUrl,
        category: uploadCategory,
        description: buildGalleryMeta({ stageKey: uploadStage, date: uploadDate }),
        sort_order: 0,
      });

      if (onProgress) onProgress();
    } catch (err) {
      console.error("Upload failed:", err);
      throw err;
    }
  };

  const handleBulkUpload = async (files) => {
    setUploading(true);
    setBulkCount({ current: 0, total: files.length });

    let failed = 0;

    for (let i = 0; i < files.length; i++) {
      try {
        await handleUpload(files[i], () => {});
        setBulkCount({ current: i + 1, total: files.length });
      } catch {
        failed++;
        setBulkCount({ current: i + 1, total: files.length });
      }
    }

    setUploading(false);
    setBulkCount({ current: 0, total: 0 });

    if (failed > 0) {
      alert(`${files.length - failed} of ${files.length} images uploaded. ${failed} failed.`);
    }
  };

  const handleFileSelect = (e) => {
    if (!uploadCategory || !uploadStage) {
      alert("Choose both a project and a journey stage before uploading photos.");
      e.target.value = "";
      return;
    }

    const files = Array.from(e.target.files || []).filter((f) =>
      f.type.startsWith("image/")
    );
    if (files.length === 0) return;
    e.target.value = "";

    if (files.length > MAX_BULK) {
      alert(`You can upload a maximum of ${MAX_BULK} images at once.`);
      return;
    }

    if (files.length === 1) {
      beginSingleUpload(files[0]);
    } else {
      handleBulkUpload(files);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);

    if (!uploadCategory || !uploadStage) {
      alert("Choose both a project and a journey stage before uploading photos.");
      return;
    }

    const files = Array.from(e.dataTransfer.files || []).filter((f) =>
      f.type.startsWith("image/")
    );
    if (files.length === 0) return;

    if (files.length > MAX_BULK) {
      alert(`You can upload a maximum of ${MAX_BULK} images at once.`);
      return;
    }

    if (files.length === 1) {
      beginSingleUpload(files[0]);
    } else {
      handleBulkUpload(files);
    }
  };

  // Single-image uploads: when ImageKit is configured, the original file is
  // staged to a temp "_pending/" path so the editor can preview and transform
  // it via its public URL. The temp object is deleted once the editor is
  // saved or cancelled (see handleEditorSave / handleEditorCancel). Without
  // ImageKit, fall back to the legacy canvas cropper.
  const beginSingleUpload = async (file) => {
    if (!isImageKitConfigured()) {
      setPendingFile(file);
      setShowCropper(true);
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const tempPath = `_pending/${Date.now()}.${ext}`;
      const { error, path: finalTempPath } = await uploadImage(
        file,
        "images",
        tempPath,
        { compress: false }
      );
      if (error) throw error;

      const storedTempPath = finalTempPath || tempPath;
      setEditTarget(null);
      setPendingFile(file);
      setPendingTempPath(storedTempPath);
      setEditorSourceUrl(getPublicUrl("images", storedTempPath));
      setShowEditor(true);
    } catch (err) {
      console.error("Failed to stage image:", err);
      alert("Could not prepare image for editing: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleEditorSave = async (editedFile) => {
    setShowEditor(false);
    const target = editTarget;
    const tempPath = pendingTempPath;
    setEditTarget(null);
    setPendingTempPath(null);
    setPendingFile(null);
    setEditorSourceUrl(null);

    if (!editedFile) return;

    if (target) {
      await handleEditSave(editedFile, target);
    } else {
      setUploading(true);
      try {
        await handleUpload(editedFile, null, { enhance: false });
      } catch (err) {
        console.error("Upload failed:", err);
        alert("Upload failed: " + err.message);
      } finally {
        setUploading(false);
      }
      if (tempPath) {
        await deleteImage("images", tempPath).catch(() => {});
      }
    }
  };

  const handleEditorCancel = () => {
    setShowEditor(false);
    const tempPath = pendingTempPath;
    setEditTarget(null);
    setPendingTempPath(null);
    setPendingFile(null);
    setEditorSourceUrl(null);
    if (tempPath) {
      deleteImage("images", tempPath).catch(() => {});
    }
  };

  const handleCropComplete = async (croppedFile) => {
    setShowCropper(false);
    const target = editTarget;
    setEditTarget(null);
    setPendingFile(null);

    if (!croppedFile) return;

    if (target) {
      await handleEditSave(croppedFile, target);
    } else {
      setUploading(true);
      try {
        await handleUpload(croppedFile, null, { enhance: false });
      } catch (err) {
        console.error("Upload failed:", err);
        alert("Upload failed: " + err.message);
      } finally {
        setUploading(false);
      }
    }
  };

  const handleEditImage = async (image) => {
    if (isImageKitConfigured()) {
      setEditTarget(image);
      setPendingFile(null);
      setPendingTempPath(null);
      setEditorSourceUrl(image.src);
      setShowEditor(true);
      return;
    }

    try {
      const resp = await fetch(image.src);
      if (!resp.ok) throw new Error("Could not fetch image");
      const blob = await resp.blob();
      const ext =
        stripQuery(image.src).split(".").pop() || "jpg";
      const file = new File(
        [blob],
        `${image.name.replace(/\.[^.]+$/, "")}.${ext}`,
        { type: blob.type || "image/jpeg" }
      );
      setEditTarget(image);
      setPendingFile(file);
      setShowCropper(true);
    } catch (err) {
      console.error("Failed to load image for editing:", err);
      alert("Could not load image for editing. Try re-uploading it instead.");
    }
  };

  const handleEditSave = async (file, image) => {
    setUploading(true);
    try {
      // Strip any "?v=..." cache-busting suffix from a previous edit before
      // deriving the storage path — otherwise the query string gets treated
      // as part of the path and the re-upload silently targets the wrong
      // (or a non-existent) object.
      const path = extractPathFromUrl(stripQuery(image.src));
      if (!path) throw new Error("Could not determine image path");

      const { error, path: finalPath } = await uploadImage(file, "images", path, {
        upsert: true,
      });
      if (error) throw error;

      // Compression can change the extension (e.g. .jpg -> .webp). Remove the
      // old object so it doesn't linger, and point the row at the new URL.
      if (finalPath && finalPath !== path) {
        await deleteImage("images", path).catch(() => {});
      }
      const newSrc = `${getPublicUrl("images", finalPath || path)}?v=${Date.now()}`;

      const { error: updateErr, data: updated } =
        await updateGalleryImage.mutateAsync({
          id: image.id,
          updates: { image_url: newSrc },
        });
      if (updateErr) throw updateErr;

      if (updated?.image_url) {
        setSelectedImage((prev) =>
          prev && prev.id === image.id
            ? { ...prev, src: updated.image_url, image_url: updated.image_url }
            : prev
        );
      }
      queryClient.invalidateQueries({ queryKey: ["gallery"] });
    } catch (err) {
      console.error("Edit save failed:", err);
      alert("Failed to save edits: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    setEditTarget(null);
    setPendingFile(null);
  };

  const handleCategoryUpdate = async (category) => {
    if (!selectedImage || !category) return;

    const currentMeta = parseGalleryMeta(selectedImage.description);
    const validStages = getStagesForProject(category);
    const nextStageKey = validStages.some((stage) => stage.key === currentMeta.stageKey)
      ? currentMeta.stageKey
      : "";
    const nextDescription = buildGalleryMeta({
      stageKey: nextStageKey,
      date: currentMeta.date,
      caption: currentMeta.caption,
    });

    try {
      const { error, data: updated } = await updateGalleryImage.mutateAsync({
        id: selectedImage.id,
        updates: { category, description: nextDescription },
      });
      if (error) throw error;

      setSelectedImage((prev) =>
        prev && prev.id === selectedImage.id
          ? {
              ...prev,
              category: updated?.category || category,
              description: updated?.description || nextDescription,
              stageKey: nextStageKey,
              stageLabel: getStageLabel(category, nextStageKey),
            }
          : prev
      );
      queryClient.invalidateQueries({ queryKey: ["gallery"] });
    } catch (err) {
      console.error("Category update failed:", err);
      alert("Could not update the project category: " + err.message);
    }
  };

  const handleStageUpdate = async (stageKey) => {
    if (!selectedImage) return;
    const currentMeta = parseGalleryMeta(selectedImage.description);
    const nextDescription = buildGalleryMeta({
      stageKey,
      date: currentMeta.date,
      caption: currentMeta.caption,
    });

    try {
      const { error, data: updated } = await updateGalleryImage.mutateAsync({
        id: selectedImage.id,
        updates: { description: nextDescription },
      });
      if (error) throw error;
      setSelectedImage((prev) =>
        prev && prev.id === selectedImage.id
          ? {
              ...prev,
              description: updated?.description || nextDescription,
              stageKey,
              stageLabel: getStageLabel(prev.category, stageKey),
            }
          : prev
      );
      queryClient.invalidateQueries({ queryKey: ["gallery"] });
    } catch (err) {
      console.error("Stage update failed:", err);
      alert("Could not update the journey stage: " + err.message);
    }
  };

  const handleJourneyDateUpdate = async (date) => {
    if (!selectedImage) return;
    const currentMeta = parseGalleryMeta(selectedImage.description);
    const nextDescription = buildGalleryMeta({
      stageKey: currentMeta.stageKey,
      date,
      caption: currentMeta.caption,
    });

    try {
      const { error, data: updated } = await updateGalleryImage.mutateAsync({
        id: selectedImage.id,
        updates: { description: nextDescription },
      });
      if (error) throw error;
      setSelectedImage((prev) =>
        prev && prev.id === selectedImage.id
          ? {
              ...prev,
              description: updated?.description || nextDescription,
              journeyDate: date,
            }
          : prev
      );
      queryClient.invalidateQueries({ queryKey: ["gallery"] });
    } catch (err) {
      console.error("Journey date update failed:", err);
      alert("Could not update the journey date: " + err.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      const image = images.find((img) => img.id === id);
      if (image && image.src) {
        const storagePath = extractPathFromUrl(stripQuery(image.src));
        if (storagePath) {
          await deleteImage("images", storagePath);
        }
      }
      await deleteGalleryImage.mutateAsync(id);
      setShowDeleteConfirm(null);
      if (selectedImage?.id === id) setSelectedImage(null);
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  return (
    <motion.div variants={itemVariants} initial="hidden" animate="visible">
      <div className="mb-6 rounded-2xl border border-[#dbe5f4] bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="font-display text-2xl font-semibold text-deep-navy">
              Media Library
            </h2>
            <p className="mt-1 font-body text-xs text-on-surface-variant sm:text-sm">
              Select the project first. Every photo you upload will automatically appear under that project in the public Gallery.
            </p>
          </div>

          <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2 lg:w-auto lg:grid-cols-[250px_250px_170px_auto] lg:items-end">
            <label className="block min-w-0">
              <span className="mb-1.5 block font-body text-xs font-bold uppercase tracking-wider text-deep-navy">Project</span>
              <select
                value={uploadCategory}
                onChange={(e) => {
                  setUploadCategory(e.target.value);
                  setUploadStage("");
                }}
                className="w-full rounded-lg border-2 border-vibrant-blue/30 bg-[#f8fbff] px-3 py-2.5 font-body text-sm font-semibold text-deep-navy outline-none transition focus:border-vibrant-blue focus:ring-2 focus:ring-vibrant-blue/15"
              >
                <option value="">Choose a project...</option>
                {PROJECT_CATEGORIES.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </label>

            <label className="block min-w-0">
              <span className="mb-1.5 block font-body text-xs font-bold uppercase tracking-wider text-deep-navy">Journey stage</span>
              <select
                value={uploadStage}
                onChange={(e) => setUploadStage(e.target.value)}
                disabled={!uploadCategory}
                className="w-full rounded-lg border-2 border-vibrant-blue/30 bg-[#f8fbff] px-3 py-2.5 font-body text-sm font-semibold text-deep-navy outline-none transition focus:border-vibrant-blue focus:ring-2 focus:ring-vibrant-blue/15 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Choose a stage...</option>
                {getStagesForProject(uploadCategory).map((stage) => (
                  <option key={stage.key} value={stage.key}>{stage.label}</option>
                ))}
              </select>
            </label>

            <label className="block min-w-0">
              <span className="mb-1.5 block font-body text-xs font-bold uppercase tracking-wider text-deep-navy">Date / month <span className="normal-case font-medium text-on-surface-variant">optional</span></span>
              <input
                type="month"
                value={uploadDate}
                onChange={(e) => setUploadDate(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 font-body text-sm text-deep-navy outline-none focus:border-vibrant-blue focus:ring-2 focus:ring-vibrant-blue/15"
              />
            </label>

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || !uploadCategory || !uploadStage}
              className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-lg bg-vibrant-blue px-5 py-2.5 font-body text-sm font-semibold text-white transition-colors hover:bg-vibrant-blue/90 disabled:cursor-not-allowed disabled:opacity-45"
            >
              <Upload className="h-4 w-4" />
              Upload Image
            </button>
          </div>
        </div>

        {(!uploadCategory || !uploadStage) && (
          <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 font-body text-xs font-medium text-amber-700">
            Choose both a project and a journey stage before browsing, dragging, or uploading photos.
          </p>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
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
          Drag and drop images here, or{" "}
          <button
            onClick={() => uploadCategory && uploadStage && fileInputRef.current?.click()}
            disabled={!uploadCategory || !uploadStage}
            className="text-vibrant-blue font-semibold hover:underline disabled:cursor-not-allowed disabled:text-gray-400 disabled:no-underline"
          >
            browse
          </button>
        </p>
        <p className="font-body text-xs text-on-surface-variant mt-1">
          {uploadCategory && uploadStage
            ? `Uploading to: ${uploadCategory} → ${getStageLabel(uploadCategory, uploadStage)}${uploadDate ? ` · ${uploadDate}` : ""} · up to ${MAX_BULK} images at once`
            : "Select a project and journey stage above before uploading"}
        </p>
        {uploading && bulkCount.total > 0 && (
          <div className="mt-4 max-w-xs mx-auto">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-vibrant-blue rounded-full"
                initial={{ width: 0 }}
                animate={{
                  width: `${bulkCount.total > 0 ? (bulkCount.current / bulkCount.total) * 100 : 0}%`,
                }}
                transition={{ duration: 0.15 }}
              />
            </div>
            <p className="font-body text-xs text-on-surface-variant mt-1">
              Uploading {bulkCount.current} of {bulkCount.total}...
            </p>
          </div>
        )}
        {uploading && bulkCount.total === 0 && (
          <div className="mt-4 max-w-xs mx-auto">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-vibrant-blue rounded-full"
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <p className="font-body text-xs text-on-surface-variant mt-1">
              Processing...
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
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 overflow-x-auto">
          {FILTERS.map((f) => (
            <button
              key={f === "Gallery" ? "Unassigned" : f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-3 py-1.5 rounded-md font-body text-xs font-medium transition-colors",
                filter === f
                  ? "bg-white text-deep-navy shadow-sm"
                  : "text-on-surface-variant hover:text-deep-navy"
              )}
            >
              {f === "Gallery" ? "Unassigned" : f}
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
                    alt={img.category && img.category !== "Gallery" ? `${img.category} photo` : "Gallery photo"}
                    className="w-full h-full object-cover"
                  />
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
                    alt={img.category && img.category !== "Gallery" ? `${img.category} photo` : "Gallery photo"}
                    className="w-12 h-12 rounded-lg object-cover shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-body text-sm font-medium text-deep-navy truncate">
                      {img.category && img.category !== "Gallery" ? img.category : "Unassigned photo"}
                    </p>
                    <p className="font-body text-xs text-on-surface-variant">
                      {img.stageLabel}{img.journeyDate ? ` · ${img.journeyDate}` : ""}
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
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              className="fixed inset-x-3 bottom-3 z-40 max-h-[70vh] overflow-y-auto rounded-2xl bg-white border border-gray-200 p-5 shadow-2xl lg:static lg:inset-auto lg:z-auto lg:max-h-none lg:overflow-visible lg:rounded-xl lg:shadow-none lg:w-72 lg:shrink-0 lg:h-fit lg:sticky lg:top-0"
            >
              <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-gray-200 lg:hidden" />
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
                  alt={selectedImage.category && selectedImage.category !== "Gallery" ? `${selectedImage.category} photo` : "Gallery photo"}
                  className="w-full aspect-video object-cover"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <ImageIcon className="h-4 w-4 text-on-surface-variant mt-0.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-body text-xs text-on-surface-variant">Project</p>
                    <select
                      value={selectedImage.category || ""}
                      onChange={(e) => handleCategoryUpdate(e.target.value)}
                      className="mt-1 w-full rounded-md border border-gray-200 bg-white px-2 py-1.5 font-body text-xs text-deep-navy outline-none focus:border-vibrant-blue"
                    >
                      {selectedImage.category &&
                        selectedImage.category !== "Gallery" &&
                        !PROJECT_CATEGORIES.includes(selectedImage.category) && (
                          <option value={selectedImage.category}>{selectedImage.category}</option>
                        )}
                      <option value="Gallery">Unassigned / Legacy Gallery</option>
                      {PROJECT_CATEGORIES.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Layers3 className="h-4 w-4 text-on-surface-variant mt-0.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-body text-xs text-on-surface-variant">Journey stage</p>
                    <select
                      value={selectedImage.stageKey || ""}
                      onChange={(e) => handleStageUpdate(e.target.value)}
                      disabled={!PROJECT_CATEGORIES.includes(selectedImage.category)}
                      className="mt-1 w-full rounded-md border border-gray-200 bg-white px-2 py-1.5 font-body text-xs text-deep-navy outline-none focus:border-vibrant-blue disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">Unassigned stage</option>
                      {getStagesForProject(selectedImage.category).map((stage) => (
                        <option key={stage.key} value={stage.key}>{stage.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Calendar className="h-4 w-4 text-on-surface-variant mt-0.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-body text-xs text-on-surface-variant">Journey date / month</p>
                    <input
                      type="month"
                      value={selectedImage.journeyDate || ""}
                      onChange={(e) => {
                        const date = e.target.value;
                        setSelectedImage((prev) => prev ? { ...prev, journeyDate: date } : prev);
                      }}
                      onBlur={(e) => handleJourneyDateUpdate(e.target.value)}
                      className="mt-1 w-full rounded-md border border-gray-200 bg-white px-2 py-1.5 font-body text-xs text-deep-navy outline-none focus:border-vibrant-blue"
                    />
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <HardDrive className="h-4 w-4 text-on-surface-variant mt-0.5 shrink-0" />
                  <div>
                    <p className="font-body text-xs text-on-surface-variant">Size</p>
                    <p className="font-body text-sm text-deep-navy">
                      {selectedMeta.size || "—"}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Grid className="h-4 w-4 text-on-surface-variant mt-0.5 shrink-0" />
                  <div>
                    <p className="font-body text-xs text-on-surface-variant">Dimensions</p>
                    <p className="font-body text-sm text-deep-navy">
                      {selectedMeta.dimensions || "—"}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Calendar className="h-4 w-4 text-on-surface-variant mt-0.5 shrink-0" />
                  <div>
                    <p className="font-body text-xs text-on-surface-variant">Uploaded</p>
                    <p className="font-body text-sm text-deep-navy">{selectedImage.date}</p>
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
                  <div className="flex flex-wrap items-center gap-1">
                    <button
                      onClick={() => handleEditImage(selectedImage)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-vibrant-blue hover:bg-vibrant-blue/5 rounded-lg font-body text-xs font-medium transition-colors"
                    >
                      <Crop className="h-3.5 w-3.5" />
                      Edit
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(selectedImage.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg font-body text-xs font-medium transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {showCropper && pendingFile && (
        <ImageCropper
          file={pendingFile}
          onComplete={handleCropComplete}
          onCancel={handleCropCancel}
        />
      )}

      {showEditor && editorSourceUrl && (
        <ImageKitEditor
          sourceUrl={editorSourceUrl}
          fileName="project-photo"
          onComplete={handleEditorSave}
          onCancel={handleEditorCancel}
        />
      )}
    </motion.div>
  );
}