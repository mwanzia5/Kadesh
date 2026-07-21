import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  X,
  Save,
  Loader2,
  Upload,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useChildren,
  useCreateChild,
  useUpdateChild,
  useDeleteChild,
} from "@/hooks/useChildren";
import { uploadImage, getPublicUrl } from "@/services/upload";

const STATUSES = ["All", "available", "sponsored", "pending"];
const GENDERS = ["male", "female"];

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

function StatusBadge({ status }) {
  const styles = {
    available: "bg-green-100 text-green-700",
    sponsored: "bg-vibrant-blue/10 text-vibrant-blue",
    pending: "bg-hope-orange/10 text-hope-orange",
  };
  return (
    <span
      className={cn(
        "inline-block px-2.5 py-1 rounded-full font-body text-xs font-semibold capitalize",
        styles[status] || "bg-gray-100 text-gray-600"
      )}
    >
      {status}
    </span>
  );
}

function PhotoPreview({ src, name, size = "md" }) {
  const sizeClasses = {
    sm: "w-10 h-10",
    md: "w-14 h-14",
    lg: "w-full aspect-[3/4]",
  };

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn(
          "rounded-lg object-cover",
          sizeClasses[size],
          size === "lg" && "rounded-t-xl"
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        "rounded-lg bg-gradient-to-br from-vibrant-blue/15 to-hope-orange/15 flex items-center justify-center",
        sizeClasses[size]
      )}
    >
      <span
        className={cn(
          "font-display font-bold text-vibrant-blue/40",
          size === "sm" && "text-sm",
          size === "md" && "text-lg",
          size === "lg" && "text-6xl"
        )}
      >
        {name?.charAt(0) || "?"}
      </span>
    </div>
  );
}

function Toast({ message, type, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20, x: "-50%" }}
      animate={{ opacity: 1, y: 0, x: "-50%" }}
      exit={{ opacity: 0, y: -20, x: "-50%" }}
      className={cn(
        "fixed top-4 left-1/2 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg font-body text-sm font-medium",
        type === "success" && "bg-green-600 text-white",
        type === "error" && "bg-red-600 text-white"
      )}
    >
      {type === "success" ? (
        <CheckCircle2 className="h-4 w-4" />
      ) : (
        <AlertCircle className="h-4 w-4" />
      )}
      {message}
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100">
        <X className="h-3.5 w-3.5" />
      </button>
    </motion.div>
  );
}

function ChildForm({ type, data, onChange, onUpload, onUploadChange, uploading, onSubmit, onCancel, submitting }) {
  const fileRef = useRef(null);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-base font-semibold text-deep-navy">
          {type === "add" ? "New Child" : `Edit ${data.first_name}`}
        </h3>
        <button
          onClick={onCancel}
          className="text-on-surface-variant hover:text-deep-navy"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <input
          type="text"
          placeholder="First name *"
          value={data.first_name}
          onChange={(e) => onChange({ ...data, first_name: e.target.value })}
          className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 font-body text-sm focus:outline-none focus:ring-2 focus:ring-vibrant-blue/20 focus:border-vibrant-blue"
        />
        <input
          type="number"
          placeholder="Age *"
          min="0"
          max="18"
          value={data.age}
          onChange={(e) => onChange({ ...data, age: e.target.value })}
          className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 font-body text-sm focus:outline-none focus:ring-2 focus:ring-vibrant-blue/20 focus:border-vibrant-blue"
        />
        <select
          value={data.gender}
          onChange={(e) => onChange({ ...data, gender: e.target.value })}
          className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 font-body text-sm focus:outline-none focus:ring-2 focus:ring-vibrant-blue/20 focus:border-vibrant-blue"
        >
          {GENDERS.map((g) => (
            <option key={g} value={g}>
              {g.charAt(0).toUpperCase() + g.slice(1)}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Location (city/region) *"
          value={data.location}
          onChange={(e) => onChange({ ...data, location: e.target.value })}
          className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 font-body text-sm focus:outline-none focus:ring-2 focus:ring-vibrant-blue/20 focus:border-vibrant-blue"
        />
        <select
          value={data.sponsorship_status}
          onChange={(e) => onChange({ ...data, sponsorship_status: e.target.value })}
          className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 font-body text-sm focus:outline-none focus:ring-2 focus:ring-vibrant-blue/20 focus:border-vibrant-blue"
        >
          <option value="available">Available</option>
          <option value="sponsored">Sponsored</option>
          <option value="pending">Pending</option>
        </select>
        <div>
          <label className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg font-body text-sm text-on-surface-variant hover:bg-gray-100 cursor-pointer transition-colors">
            <Upload className="h-4 w-4" />
            {data.photo_url ? "Change Photo" : "Upload Photo"}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={onUpload}
              className="hidden"
            />
          </label>
          {uploading && (
            <p className="font-body text-xs text-vibrant-blue mt-1.5 flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              Uploading...
            </p>
          )}
          {data.photo_url && !uploading && (
            <p className="font-body text-xs text-green-600 mt-1.5 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Photo uploaded
            </p>
          )}
        </div>
      </div>

      {/* Photo preview */}
      {data.photo_url && (
        <div className="mt-4">
          <p className="font-body text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">
            Photo Preview
          </p>
          <div className="w-32 h-40 rounded-lg overflow-hidden border border-gray-200">
            <PhotoPreview src={data.photo_url} name={data.first_name} size="lg" />
          </div>
        </div>
      )}

      {/* Bio */}
      <div className="mt-4">
        <label className="block font-body text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
          Bio / About the Child
        </label>
        <textarea
          placeholder="Tell us about this child — their personality, interests, dreams, and daily life..."
          value={data.bio}
          onChange={(e) => onChange({ ...data, bio: e.target.value })}
          rows={4}
          className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 font-body text-sm resize-y focus:outline-none focus:ring-2 focus:ring-vibrant-blue/20 focus:border-vibrant-blue"
        />
      </div>

      {/* Needs / Story */}
      <div className="mt-4">
        <label className="block font-body text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
          Needs / How Sponsorship Helps
        </label>
        <textarea
          placeholder="What does this child need? How will sponsorship change their life? Share their story..."
          value={data.needs}
          onChange={(e) => onChange({ ...data, needs: e.target.value })}
          rows={4}
          className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 font-body text-sm resize-y focus:outline-none focus:ring-2 focus:ring-vibrant-blue/20 focus:border-vibrant-blue"
        />
      </div>

      <div className="flex items-center gap-3 mt-5">
        <button
          onClick={onSubmit}
          disabled={submitting}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-vibrant-blue text-white rounded-lg font-body text-sm font-semibold hover:bg-vibrant-blue/90 transition-colors disabled:opacity-60"
        >
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {submitting ? "Saving..." : type === "add" ? "Save Child" : "Save Changes"}
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2.5 font-body text-sm text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default function ChildrenManager() {
  const { data, isLoading } = useChildren();
  const createChild = useCreateChild();
  const updateChild = useUpdateChild();
  const deleteChild = useDeleteChild();

  const children = data?.data ?? [];

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState(null);

  const [newChild, setNewChild] = useState({
    first_name: "",
    age: "",
    gender: "male",
    location: "",
    bio: "",
    needs: "",
    sponsorship_status: "available",
    photo_url: "",
  });

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const filteredChildren = children.filter((c) => {
    const matchesStatus =
      statusFilter === "All" || c.sponsorship_status === statusFilter;
    const matchesSearch =
      c.first_name.toLowerCase().includes(search.toLowerCase()) ||
      c.location?.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handlePhotoUpload = async (e, isNew = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("Please select an image file", "error");
      return;
    }

    setUploading(true);

    try {
      const ext = file.name.split(".").pop();
      const path = `children/${Date.now()}.${ext}`;

      const { error: uploadErr } = await uploadImage(file, "images", path);
      if (uploadErr) throw uploadErr;

      const publicUrl = getPublicUrl("images", path);

      if (isNew) {
        setNewChild((p) => ({ ...p, photo_url: publicUrl }));
      } else {
        setEditData((d) => ({ ...d, photo_url: publicUrl }));
      }

      showToast("Photo uploaded successfully");
    } catch (err) {
      showToast("Upload failed: " + err.message, "error");
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (child) => {
    setEditingId(child.id);
    setEditData({
      first_name: child.first_name,
      age: child.age,
      gender: child.gender,
      location: child.location,
      bio: child.bio || "",
      needs: child.needs || "",
      sponsorship_status: child.sponsorship_status,
      photo_url: child.photo_url || "",
    });
  };

  const handleSave = () => {
    updateChild.mutate(
      { id: editingId, data: editData },
      {
        onSuccess: () => {
          setEditingId(null);
          showToast("Child updated successfully");
        },
        onError: (err) => showToast("Failed to save: " + err.message, "error"),
      }
    );
  };

  const handleDelete = (id) => {
    deleteChild.mutate(id, {
      onSuccess: () => {
        setShowDeleteConfirm(null);
        showToast("Child removed");
      },
      onError: (err) => showToast("Failed to delete: " + err.message, "error"),
    });
  };

  const handleAdd = () => {
    if (!newChild.first_name.trim() || !newChild.age || !newChild.location.trim()) {
      showToast("Please fill in name, age, and location", "error");
      return;
    }
    createChild.mutate(
      { ...newChild, age: Number(newChild.age) },
      {
        onSuccess: () => {
          setNewChild({
            first_name: "",
            age: "",
            gender: "male",
            location: "",
            bio: "",
            needs: "",
            sponsorship_status: "available",
            photo_url: "",
          });
          setShowAddForm(false);
          showToast("Child added successfully");
        },
        onError: (err) => showToast("Failed to save: " + err.message, "error"),
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-vibrant-blue" />
      </div>
    );
  }

  return (
    <motion.div variants={itemVariants} initial="hidden" animate="visible">
      <AnimatePresence>
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </AnimatePresence>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="font-display text-2xl font-semibold text-deep-navy">
            Children Manager
          </h2>
          <p className="font-body text-sm text-on-surface-variant mt-1">
            {children.length} child{children.length !== 1 ? "ren" : ""} total
            {" "}&middot;{" "}
            {children.filter((c) => c.sponsorship_status === "available").length} available
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-vibrant-blue text-white rounded-lg font-body text-sm font-semibold hover:bg-vibrant-blue/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add New Child
        </button>
      </div>

      {/* Add child form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-6"
          >
            <ChildForm
              type="add"
              data={newChild}
              onChange={setNewChild}
              onUpload={(e) => handlePhotoUpload(e, true)}
              uploading={uploading}
              onSubmit={handleAdd}
              onCancel={() => setShowAddForm(false)}
              submitting={createChild.isPending}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant" />
          <input
            type="text"
            placeholder="Search by name or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-lg pl-9 pr-4 py-2 font-body text-sm focus:outline-none focus:ring-2 focus:ring-vibrant-blue/20 focus:border-vibrant-blue"
          />
        </div>
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 overflow-x-auto">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                "px-3 py-1.5 rounded-md font-body text-xs font-medium transition-colors whitespace-nowrap capitalize",
                statusFilter === s
                  ? "bg-white text-deep-navy shadow-sm"
                  : "text-on-surface-variant hover:text-deep-navy"
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Children list */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="hidden lg:grid grid-cols-[64px_1fr_60px_70px_100px_90px_80px_100px] gap-3 px-5 py-3 bg-gray-50 border-b border-gray-200">
          <span className="font-body text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
            Photo
          </span>
          <span className="font-body text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
            Name &amp; Bio
          </span>
          <span className="font-body text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
            Age
          </span>
          <span className="font-body text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
            Gender
          </span>
          <span className="font-body text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
            Location
          </span>
          <span className="font-body text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
            Status
          </span>
          <span className="font-body text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
            Profile
          </span>
          <span className="font-body text-xs font-semibold text-on-surface-variant uppercase tracking-wider text-right">
            Actions
          </span>
        </div>
        <div className="divide-y divide-gray-100">
          {filteredChildren.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="font-body text-sm text-on-surface-variant">
                No children found.
              </p>
            </div>
          ) : (
            filteredChildren.map((child) => (
              <div key={child.id} className="px-5 py-4">
                {editingId === child.id ? (
                  <ChildForm
                    type="edit"
                    data={editData}
                    onChange={setEditData}
                    onUpload={(e) => handlePhotoUpload(e)}
                    uploading={uploading}
                    onSubmit={handleSave}
                    onCancel={() => setEditingId(null)}
                    submitting={updateChild.isPending}
                  />
                ) : (
                  <div className="lg:grid lg:grid-cols-[64px_1fr_60px_70px_100px_90px_80px_100px] lg:gap-3 lg:items-center">
                    {/* Photo */}
                    <div className="mb-2 lg:mb-0">
                      <PhotoPreview
                        src={child.photo_url}
                        name={child.first_name}
                        size="md"
                      />
                    </div>

                    {/* Name + bio snippet */}
                    <div className="mb-2 lg:mb-0 min-w-0">
                      <p className="font-body text-sm font-medium text-deep-navy truncate">
                        {child.first_name}
                      </p>
                      {child.bio ? (
                        <p className="font-body text-xs text-on-surface-variant truncate mt-0.5">
                          {child.bio}
                        </p>
                      ) : (
                        <p className="font-body text-xs text-on-surface-variant/40 italic mt-0.5">
                          No bio added
                        </p>
                      )}
                    </div>

                    {/* Age */}
                    <span className="hidden lg:block font-body text-xs text-on-surface-variant">
                      {child.age}
                    </span>

                    {/* Gender */}
                    <span className="hidden lg:block font-body text-xs text-on-surface-variant capitalize">
                      {child.gender}
                    </span>

                    {/* Location */}
                    <span className="hidden lg:block font-body text-xs text-on-surface-variant truncate">
                      {child.location}
                    </span>

                    {/* Status */}
                    <span className="hidden lg:block">
                      <StatusBadge status={child.sponsorship_status} />
                    </span>

                    {/* Profile completeness */}
                    <div className="hidden lg:flex items-center gap-1">
                      {child.photo_url ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-500" title="Photo" />
                      ) : (
                        <X className="h-3.5 w-3.5 text-gray-300" title="No photo" />
                      )}
                      {child.bio ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-500" title="Bio" />
                      ) : (
                        <X className="h-3.5 w-3.5 text-gray-300" title="No bio" />
                      )}
                      {child.needs ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-500" title="Story" />
                      ) : (
                        <X className="h-3.5 w-3.5 text-gray-300" title="No story" />
                      )}
                    </div>

                    {/* Mobile info */}
                    <div className="flex flex-wrap items-center gap-2 lg:hidden mb-2">
                      <span className="font-body text-xs text-on-surface-variant">
                        Age {child.age}
                      </span>
                      <span className="font-body text-xs text-on-surface-variant capitalize">
                        {child.gender}
                      </span>
                      <span className="font-body text-xs text-on-surface-variant">
                        {child.location}
                      </span>
                      <StatusBadge status={child.sponsorship_status} />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 justify-end lg:justify-start mt-2 lg:mt-0">
                      <button
                        onClick={() => handleEdit(child)}
                        className="p-1.5 text-on-surface-variant hover:text-vibrant-blue hover:bg-vibrant-blue/5 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      {showDeleteConfirm === child.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDelete(child.id)}
                            disabled={deleteChild.isPending}
                            className="px-2 py-1 bg-red-600 text-white rounded font-body text-xs font-semibold hover:bg-red-700 transition-colors disabled:opacity-60"
                          >
                            {deleteChild.isPending ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              "Yes"
                            )}
                          </button>
                          <button
                            onClick={() => setShowDeleteConfirm(null)}
                            className="px-2 py-1 bg-gray-100 text-gray-600 rounded font-body text-xs hover:bg-gray-200 transition-colors"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setShowDeleteConfirm(child.id)}
                          className="p-1.5 text-on-surface-variant hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </motion.div>
  );
}
