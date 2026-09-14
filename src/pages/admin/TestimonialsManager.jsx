import { useState, useRef } from "react";
import {
  useAdminTestimonials,
  useCreateTestimonial,
  useUpdateTestimonial,
  useDeleteTestimonial,
} from "@/hooks/useTestimonials";
import { uploadImage, getPublicUrl } from "@/services/upload";
import { Plus, X, Edit, Trash2, Upload, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import ImageCropper from "@/components/admin/ImageCropper";

const inputClasses =
  "w-full px-4 py-3 rounded-lg border border-gray-200 bg-white font-body text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all";

export default function TestimonialsManager() {
  const { data, isLoading } = useAdminTestimonials();
  const createTestimonial = useCreateTestimonial();
  const updateTestimonial = useUpdateTestimonial();
  const deleteTestimonial = useDeleteTestimonial();

  const testimonials = data?.data || [];

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [content, setContent] = useState("");
  const [avatar, setAvatar] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [isActive, setIsActive] = useState(true);
  const [pendingAvatar, setPendingAvatar] = useState(null);
  const [showCropper, setShowCropper] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const avatarRef = useRef(null);

  const resetForm = () => {
    setName("");
    setRole("");
    setContent("");
    setAvatar("");
    setAvatarFile(null);
    setIsActive(true);
    setError("");
    setEditing(null);
    setShowForm(false);
  };

  const handleEdit = (testimonial) => {
    setEditing(testimonial);
    setName(testimonial.name);
    setRole(testimonial.role || "");
    setContent(testimonial.content);
    setAvatar(testimonial.avatar || "");
    setIsActive(testimonial.is_active !== false);
    setError("");
    setShowForm(true);
  };

  const handleAvatarSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    e.target.value = "";
    setPendingAvatar(file);
    setShowCropper(true);
  };

  const handleCropComplete = (croppedFile) => {
    setShowCropper(false);
    setPendingAvatar(null);
    if (croppedFile) {
      setAvatarFile(croppedFile);
    }
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    setPendingAvatar(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      if (!name.trim() || !content.trim()) {
        setError("Name and testimonial are required.");
        setSaving(false);
        return;
      }

      let avatarUrl = avatar || null;
      if (avatarFile) {
        const ext = avatarFile.name.split(".").pop();
        const path = `testimonial-avatars/${Date.now()}.${ext}`;
        const { error: uploadErr, path: finalPath } = await uploadImage(
          avatarFile,
          "images",
          path
        );
        if (uploadErr) throw uploadErr;
        avatarUrl = getPublicUrl("images", finalPath || path);
      }

      const testimonialData = {
        name: name.trim(),
        role: role.trim() || null,
        content: content.trim(),
        avatar: avatarUrl,
        is_active: isActive,
      };

      if (editing) {
        const { error: updateErr } = await updateTestimonial.mutateAsync({
          id: editing.id,
          ...testimonialData,
        });
        if (updateErr) throw updateErr;
      } else {
        testimonialData.sort_order = testimonials.length;
        const { error: createErr } = await createTestimonial.mutateAsync(testimonialData);
        if (createErr) throw createErr;
      }

      resetForm();
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this testimonial?")) return;
    await deleteTestimonial.mutateAsync(id);
  };

  const handleToggleActive = async (testimonial) => {
    await updateTestimonial.mutateAsync({
      id: testimonial.id,
      is_active: !(testimonial.is_active !== false),
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-display text-2xl font-semibold text-[#0D1B3E]">Testimonials</h2>
          <p className="font-body text-sm text-gray-500 mt-1">
            Manage testimonials — active ones appear in the "Voices of Hope" carousel on the home page
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-[#2563EB] text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Testimonial
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display text-xl font-semibold text-[#0D1B3E]">
                {editing ? "Edit Testimonial" : "Add Testimonial"}
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Grace Wanjiku"
                  className={inputClasses}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g. Women's Project Beneficiary"
                  className={inputClasses}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Testimonial</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="What did Kadesh Hope Mission do for them?"
                  rows={4}
                  className={cn(inputClasses, "resize-none")}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Avatar Photo <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="file"
                  ref={avatarRef}
                  accept="image/*"
                  onChange={handleAvatarSelect}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => avatarRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 px-4 py-6 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-400 hover:text-blue-500 transition-colors"
                >
                  <Upload className="w-5 h-5" />
                  {avatarFile
                    ? avatarFile.name
                    : avatar
                    ? "Replace photo"
                    : "Click to select avatar photo"}
                </button>
                {(avatar || avatarFile) && (
                  <p className="text-xs text-gray-400 mt-1">Photo will be auto-cropped and optimized.</p>
                )}
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-[#2563EB] focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Active (shown on home page carousel)
                </span>
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
                  disabled={saving}
                  className="flex-1 px-4 py-2.5 bg-[#2563EB] text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {saving ? "Saving..." : editing ? "Update" : "Add Testimonial"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Testimonials List */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-[#2563EB] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : testimonials.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <MessageSquare className="w-12 h-12 mx-auto mb-3" />
          <p>No testimonials yet. Click "Add Testimonial" to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.id}
              className={cn(
                "bg-white rounded-xl border p-5 flex flex-col",
                testimonial.is_active === false ? "border-gray-200 opacity-70" : "border-gray-200"
              )}
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  {testimonial.avatar ? (
                    <img
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      className="w-11 h-11 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-blue-50 text-[#2563EB] flex items-center justify-center shrink-0">
                      <span className="font-semibold">
                        {(testimonial.name || "?").charAt(0)}
                      </span>
                    </div>
                  )}
                  <div className="min-w-0">
                    <h4 className="font-medium text-gray-900 truncate">{testimonial.name}</h4>
                    {testimonial.role && (
                      <p className="text-xs text-gray-500 truncate">{testimonial.role}</p>
                    )}
                  </div>
                </div>
                <span
                  className={cn(
                    "text-xs px-2 py-0.5 rounded-full font-medium shrink-0",
                    testimonial.is_active !== false
                      ? "bg-green-50 text-green-600"
                      : "bg-gray-100 text-gray-500"
                  )}
                >
                  {testimonial.is_active !== false ? "Active" : "Inactive"}
                </span>
              </div>

              <p className="font-body text-sm text-gray-700 leading-relaxed line-clamp-4 flex-1">
                &ldquo;{testimonial.content}&rdquo;
              </p>

              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100">
                <button
                  onClick={() => handleToggleActive(testimonial)}
                  className="flex-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  {testimonial.is_active !== false ? "Deactivate" : "Activate"}
                </button>
                <button
                  onClick={() => handleEdit(testimonial)}
                  className="flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <Edit className="w-3.5 h-3.5" />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(testimonial.id)}
                  className="flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCropper && pendingAvatar && (
        <ImageCropper
          file={pendingAvatar}
          onComplete={handleCropComplete}
          onCancel={handleCropCancel}
        />
      )}
    </div>
  );
}