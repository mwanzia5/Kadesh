import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Plus, Edit, Trash2, X, Save, Upload, Newspaper, Calendar, Tag, Eye, Loader2, Image as ImageIcon, Video, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useAllNews,
  useCreateArticle,
  useUpdateArticle,
  useDeleteArticle,
} from "@/hooks/useNews";
import { uploadAndConvert, uploadImage, getPublicUrl } from "@/services/upload";

const CATEGORIES = ["Education", "Health", "Food Security", "Community", "Events", "Announcement"];

const DISPLAY_LOCATIONS = [
  { value: "both", label: "News Page & Popup", description: "Show on both the news page and the popup" },
  { value: "page_only", label: "News Page Only", description: "Only show on the /news page, not the popup" },
  { value: "popup_only", label: "Popup Only", description: "Only show in the floating popup, not on the news page" },
];

const inputClasses =
  "w-full px-4 py-3 rounded-lg border border-gray-200 bg-white font-body text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all";

const emptyArticle = {
  title: "",
  excerpt: "",
  content: "",
  category: "Community",
  author: "Kadesh Hope Mission",
  image: "",
  video_url: "",
  display_location: "both",
  published: true,
};

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function NewsManager() {
  const { data: newsData, isLoading } = useAllNews();
  const createArticle = useCreateArticle();
  const updateArticle = useUpdateArticle();
  const deleteArticle = useDeleteArticle();

  const articles = newsData?.data ?? [];

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyArticle);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    e.target.value = "";

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      let path = `news/${Date.now()}.${ext}`;

      const { error: uploadErr, path: finalPath } = await uploadAndConvert(file, "news", path);
      if (uploadErr) throw uploadErr;

      const publicUrl = getPublicUrl("news", finalPath || path);
      setForm((prev) => ({ ...prev, image: publicUrl }));
    } catch (err) {
      alert("Image upload failed: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleVideoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("video/")) return;
    e.target.value = "";

    setUploadingVideo(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `news/${Date.now()}.${ext}`;

      const { error: uploadErr } = await uploadImage(file, "videos", path);
      if (uploadErr) throw uploadErr;

      const publicUrl = getPublicUrl("videos", path);
      setForm((prev) => ({ ...prev, video_url: publicUrl }));
    } catch (err) {
      alert("Video upload failed: " + err.message);
    } finally {
      setUploadingVideo(false);
    }
  };

  const resetForm = () => {
    setForm(emptyArticle);
    setEditing(null);
    setShowForm(false);
  };

  const handleEdit = (article) => {
    setEditing(article);
    setForm({
      title: article.title || "",
      excerpt: article.excerpt || "",
      content: article.content || "",
      category: article.category || "Community",
      author: article.author || "Kadesh Hope Mission",
      image: article.image || "",
      video_url: article.video_url || "",
      display_location: article.display_location || "both",
      published: article.is_published ?? true,
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this article?")) return;
    setDeleting(id);
    try {
      await deleteArticle.mutateAsync(id);
    } catch (err) {
      alert("Failed to delete: " + err.message);
    } finally {
      setDeleting(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const slug = slugify(form.title) + "-" + Date.now().toString(36);
      const articleData = {
        title: form.title,
        slug,
        excerpt: form.excerpt,
        content: form.content,
        image: form.image || null,
        video_url: form.video_url || null,
        category: form.category,
        author: form.author,
        display_location: form.display_location,
        is_published: form.published,
        published_at: form.published ? new Date().toISOString() : null,
      };

      if (editing) {
        await updateArticle.mutateAsync({
          id: editing.id,
          ...articleData,
        });
      } else {
        await createArticle.mutateAsync(articleData);
      }

      resetForm();
    } catch (err) {
      alert("Failed to save: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredArticles = articles.filter((a) => {
    const matchesSearch =
      (a.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.excerpt || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === "All" || a.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 text-vibrant-blue animate-spin" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-display text-2xl font-semibold text-deep-navy">News</h2>
          <p className="font-body text-sm text-gray-500 mt-1">Create and manage news articles for your site</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-vibrant-blue text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Article
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="text"
          placeholder="Search articles..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 bg-white font-body text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
        />
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-4 py-2.5 rounded-lg border border-gray-200 bg-white font-body text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
        >
          <option value="All">All Categories</option>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display text-xl font-semibold text-deep-navy">
                {editing ? "Edit Article" : "New Article"}
              </h3>
              <button onClick={resetForm} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => handleChange("title", e.target.value)}
                  placeholder="Article title"
                  className={inputClasses}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => handleChange("category", e.target.value)}
                    className={inputClasses}
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Author</label>
                  <input
                    type="text"
                    value={form.author}
                    onChange={(e) => handleChange("author", e.target.value)}
                    placeholder="Author name"
                    className={inputClasses}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                {form.image ? (
                  <div className="relative rounded-lg overflow-hidden border border-gray-200 group">
                    <img
                      src={form.image}
                      alt="Article preview"
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => imageInputRef.current?.click()}
                        disabled={uploading}
                        className="px-4 py-2 bg-white text-deep-navy rounded-lg font-body text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-100 disabled:opacity-50"
                      >
                        Change Image
                      </button>
                      <button
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, image: "" }))}
                        className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    disabled={uploading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-8 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-vibrant-blue hover:text-vibrant-blue transition-colors disabled:opacity-50"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <ImageIcon className="w-5 h-5" />
                        Upload Image
                      </>
                    )}
                  </button>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Video (optional)</label>
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleVideoUpload}
                  className="hidden"
                />
                {form.video_url ? (
                  <div className="relative rounded-lg overflow-hidden border border-gray-200 group">
                    <video
                      src={form.video_url}
                      className="w-full h-48 object-cover"
                      controls
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => videoInputRef.current?.click()}
                        disabled={uploadingVideo}
                        className="px-4 py-2 bg-white text-deep-navy rounded-lg font-body text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-100 disabled:opacity-50"
                      >
                        Change Video
                      </button>
                      <button
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, video_url: "" }))}
                        className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => videoInputRef.current?.click()}
                    disabled={uploadingVideo}
                    className="w-full flex items-center justify-center gap-2 px-4 py-8 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-vibrant-blue hover:text-vibrant-blue transition-colors disabled:opacity-50"
                  >
                    {uploadingVideo ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Video className="w-5 h-5" />
                        Upload Video (max 100MB)
                      </>
                    )}
                  </button>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Display Location</label>
                <select
                  value={form.display_location}
                  onChange={(e) => handleChange("display_location", e.target.value)}
                  className={inputClasses}
                >
                  {DISPLAY_LOCATIONS.map((loc) => (
                    <option key={loc.value} value={loc.value}>{loc.label}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-400 mt-1">
                  {DISPLAY_LOCATIONS.find(l => l.value === form.display_location)?.description}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Excerpt</label>
                <textarea
                  value={form.excerpt}
                  onChange={(e) => handleChange("excerpt", e.target.value)}
                  placeholder="Short summary shown in article cards..."
                  rows={2}
                  className={inputClasses}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Content</label>
                <textarea
                  value={form.content}
                  onChange={(e) => handleChange("content", e.target.value)}
                  placeholder="Write the full article content here..."
                  rows={10}
                  className={inputClasses}
                  required
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.published}
                  onChange={(e) => handleChange("published", e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-vibrant-blue focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Publish immediately</span>
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
                  disabled={submitting}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-vibrant-blue text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-60"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {editing ? "Update Article" : "Publish Article"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {filteredArticles.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Newspaper className="w-12 h-12 mx-auto mb-3" />
          <p>{articles.length === 0 ? 'No articles yet. Click "Add Article" to get started.' : "No articles match your filters."}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredArticles.map((article) => (
            <div key={article.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row">
                {article.image && (
                  <div className="md:w-48 h-48 md:h-auto bg-gray-100 shrink-0">
                    <img src={article.image} alt={article.title} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex-1 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-vibrant-blue/10 text-vibrant-blue font-medium">
                          <Tag className="w-3 h-3" />
                          {article.category || "General"}
                        </span>
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(article.created_at).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                        {!article.is_published && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 font-medium">
                            Draft
                          </span>
                        )}
                        {article.display_location === "popup_only" && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 font-medium">
                            Popup Only
                          </span>
                        )}
                        {article.display_location === "page_only" && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-600 font-medium">
                            Page Only
                          </span>
                        )}
                        {article.video_url && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium">
                            Has Video
                          </span>
                        )}
                      </div>
                      <h4 className="font-display text-lg font-semibold text-deep-navy mb-1">
                        {article.title}
                      </h4>
                      <p className="font-body text-sm text-gray-500 line-clamp-2">{article.excerpt}</p>
                      <p className="text-xs text-gray-400 mt-2">by {article.author || "Kadesh Hope Mission"}</p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleEdit(article)}
                        className="p-2 rounded-lg text-gray-400 hover:text-vibrant-blue hover:bg-blue-50 transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(article.id)}
                        disabled={deleting === article.id}
                        className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                        title="Delete"
                      >
                        {deleting === article.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
