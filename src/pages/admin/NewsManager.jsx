import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Edit, Trash2, X, Save, Upload, Newspaper, Calendar, Tag, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "khm_news";

const CATEGORIES = ["Education", "Health", "Food Security", "Community", "Events", "Announcement"];

function loadNews() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveNews(articles) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(articles));
}

const inputClasses =
  "w-full px-4 py-3 rounded-lg border border-gray-200 bg-white font-body text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all";

const emptyArticle = {
  title: "",
  excerpt: "",
  content: "",
  category: "Community",
  author: "Kadesh Hope Mission",
  image: "",
  published: true,
};

export default function NewsManager() {
  const [articles, setArticles] = useState(loadNews);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyArticle);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setForm(emptyArticle);
    setEditing(null);
    setShowForm(false);
  };

  const handleEdit = (article) => {
    setEditing(article);
    setForm({ ...article });
    setShowForm(true);
  };

  const handleDelete = (id) => {
    if (!confirm("Are you sure you want to delete this article?")) return;
    const updated = articles.filter((a) => a.id !== id);
    setArticles(updated);
    saveNews(updated);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    let updated;

    if (editing) {
      updated = articles.map((a) =>
        a.id === editing.id ? { ...a, ...form, updatedAt: new Date().toISOString() } : a
      );
    } else {
      const newArticle = {
        ...form,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      updated = [newArticle, ...articles];
    }

    setArticles(updated);
    saveNews(updated);
    resetForm();
  };

  const filteredArticles = articles.filter((a) => {
    const matchesSearch =
      a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === "All" || a.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

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

      {/* Filters */}
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

      {/* Form Modal */}
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Image URL (optional)</label>
                <input
                  type="url"
                  value={form.image}
                  onChange={(e) => handleChange("image", e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className={inputClasses}
                />
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
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-vibrant-blue text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  {editing ? "Update Article" : "Publish Article"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Articles List */}
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
                          {article.category}
                        </span>
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(article.createdAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                        {!article.published && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 font-medium">
                            Draft
                          </span>
                        )}
                      </div>
                      <h4 className="font-display text-lg font-semibold text-deep-navy mb-1">
                        {article.title}
                      </h4>
                      <p className="font-body text-sm text-gray-500 line-clamp-2">{article.excerpt}</p>
                      <p className="text-xs text-gray-400 mt-2">by {article.author}</p>
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
                        className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
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
