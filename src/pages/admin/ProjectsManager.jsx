import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  Star,
  X,
  Save,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useProjects,
  useCreateProject,
  useUpdateProject,
  useDeleteProject,
} from "@/hooks/useProjects";

const CATEGORIES = [
  "All",
  "Education",
  "Healthcare",
  "Community",
  "Water",
  "Food",
  "Women",
];

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function ProjectsManager() {
  const { data, isLoading } = useProjects();
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();

  const projects = data?.data ?? [];

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProject, setNewProject] = useState({
    title: "",
    category: "Education",
    short_description: "",
  });

  const filteredProjects = projects.filter((p) => {
    const matchesCategory =
      categoryFilter === "All" || p.category === categoryFilter;
    const matchesSearch = p.title
      .toLowerCase()
      .includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleFeatured = (project) => {
    updateProject.mutate({
      id: project.id,
      data: { is_featured: !project.is_featured },
    });
  };

  const handleEdit = (project) => {
    setEditingId(project.id);
    setEditData({
      title: project.title,
      category: project.category,
      short_description: project.short_description || "",
    });
  };

  const handleSave = () => {
    updateProject.mutate(
      { id: editingId, data: editData },
      { onSuccess: () => setEditingId(null) }
    );
  };

  const handleDelete = (id) => {
    deleteProject.mutate(id, {
      onSuccess: () => setShowDeleteConfirm(null),
    });
  };

  const handleAdd = () => {
    if (!newProject.title.trim()) return;
    createProject.mutate(
      {
        ...newProject,
        slug: slugify(newProject.title),
        is_featured: false,
        sort_order: projects.length,
      },
      {
        onSuccess: () => {
          setNewProject({
            title: "",
            category: "Education",
            short_description: "",
          });
          setShowAddForm(false);
        },
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h2 className="font-display text-2xl font-semibold text-deep-navy">
          Projects Manager
        </h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-vibrant-blue text-white rounded-lg font-body text-sm font-semibold hover:bg-vibrant-blue/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add New Project
        </button>
      </div>

      {/* Add project form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-6"
          >
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-base font-semibold text-deep-navy">
                  New Project
                </h3>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="text-on-surface-variant hover:text-deep-navy"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Project title"
                  value={newProject.title}
                  onChange={(e) =>
                    setNewProject((p) => ({ ...p, title: e.target.value }))
                  }
                  className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 font-body text-sm focus:outline-none focus:ring-2 focus:ring-vibrant-blue/20 focus:border-vibrant-blue"
                />
                <select
                  value={newProject.category}
                  onChange={(e) =>
                    setNewProject((p) => ({
                      ...p,
                      category: e.target.value,
                    }))
                  }
                  className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 font-body text-sm focus:outline-none focus:ring-2 focus:ring-vibrant-blue/20 focus:border-vibrant-blue"
                >
                  {CATEGORIES.filter((c) => c !== "All").map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <textarea
                  placeholder="Description"
                  value={newProject.short_description}
                  onChange={(e) =>
                    setNewProject((p) => ({
                      ...p,
                      short_description: e.target.value,
                    }))
                  }
                  rows={2}
                  className="sm:col-span-2 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 font-body text-sm resize-y focus:outline-none focus:ring-2 focus:ring-vibrant-blue/20 focus:border-vibrant-blue"
                />
              </div>
              <div className="flex items-center gap-3 mt-4">
                <button
                  onClick={handleAdd}
                  disabled={createProject.isPending}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-vibrant-blue text-white rounded-lg font-body text-sm font-semibold hover:bg-vibrant-blue/90 transition-colors disabled:opacity-60"
                >
                  {createProject.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {createProject.isPending ? "Saving..." : "Save Project"}
                </button>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 font-body text-sm text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant" />
          <input
            type="text"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-lg pl-9 pr-4 py-2 font-body text-sm focus:outline-none focus:ring-2 focus:ring-vibrant-blue/20 focus:border-vibrant-blue"
          />
        </div>
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 overflow-x-auto">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategoryFilter(c)}
              className={cn(
                "px-3 py-1.5 rounded-md font-body text-xs font-medium transition-colors whitespace-nowrap",
                categoryFilter === c
                  ? "bg-white text-deep-navy shadow-sm"
                  : "text-on-surface-variant hover:text-deep-navy"
              )}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Projects table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="hidden md:grid grid-cols-[1fr_120px_100px_120px] gap-4 px-5 py-3 bg-gray-50 border-b border-gray-200">
          <span className="font-body text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
            Title
          </span>
          <span className="font-body text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
            Category
          </span>
          <span className="font-body text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
            Featured
          </span>
          <span className="font-body text-xs font-semibold text-on-surface-variant uppercase tracking-wider text-right">
            Actions
          </span>
        </div>
        <div className="divide-y divide-gray-100">
          {filteredProjects.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="font-body text-sm text-on-surface-variant">
                No projects found.
              </p>
            </div>
          ) : (
            filteredProjects.map((project) => (
              <div key={project.id} className="px-5 py-4">
                {editingId === project.id ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={editData.title}
                      onChange={(e) =>
                        setEditData((d) => ({
                          ...d,
                          title: e.target.value,
                        }))
                      }
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 font-body text-sm focus:outline-none focus:ring-2 focus:ring-vibrant-blue/20 focus:border-vibrant-blue"
                    />
                    <div className="flex gap-3">
                      <select
                        value={editData.category}
                        onChange={(e) =>
                          setEditData((d) => ({
                            ...d,
                            category: e.target.value,
                          }))
                        }
                        className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 font-body text-sm focus:outline-none focus:ring-2 focus:ring-vibrant-blue/20 focus:border-vibrant-blue"
                      >
                        {CATEGORIES.filter((c) => c !== "All").map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={handleSave}
                        disabled={updateProject.isPending}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-vibrant-blue text-white rounded-lg font-body text-sm font-semibold hover:bg-vibrant-blue/90 transition-colors disabled:opacity-60"
                      >
                        {updateProject.isPending ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Save className="h-3.5 w-3.5" />
                        )}
                        Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-4 py-2 font-body text-sm text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                    <textarea
                      value={editData.short_description}
                      onChange={(e) =>
                        setEditData((d) => ({
                          ...d,
                          short_description: e.target.value,
                        }))
                      }
                      rows={2}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 font-body text-sm resize-y focus:outline-none focus:ring-2 focus:ring-vibrant-blue/20 focus:border-vibrant-blue"
                    />
                  </div>
                ) : (
                  <div className="md:grid md:grid-cols-[1fr_120px_100px_120px] md:gap-4 md:items-center">
                    <div className="mb-2 md:mb-0">
                      <p className="font-body text-sm font-medium text-deep-navy">
                        {project.title}
                      </p>
                      <p className="font-body text-xs text-on-surface-variant md:hidden">
                        {project.category}
                      </p>
                    </div>
                    <span className="hidden md:block font-body text-xs text-on-surface-variant">
                      {project.category}
                    </span>
                    <button
                      onClick={() => toggleFeatured(project)}
                      className="flex items-center gap-1.5 w-fit"
                    >
                      <Star
                        className={cn(
                          "h-4 w-4 transition-colors",
                          project.is_featured
                            ? "fill-hope-orange text-hope-orange"
                            : "text-gray-300"
                        )}
                      />
                      <span className="font-body text-xs text-on-surface-variant">
                        {project.is_featured ? "Yes" : "No"}
                      </span>
                    </button>
                    <div className="flex items-center gap-2 justify-end mt-2 md:mt-0">
                      <button
                        onClick={() => handleEdit(project)}
                        className="p-1.5 text-on-surface-variant hover:text-vibrant-blue hover:bg-vibrant-blue/5 rounded-lg transition-colors"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      {showDeleteConfirm === project.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDelete(project.id)}
                            disabled={deleteProject.isPending}
                            className="px-2 py-1 bg-red-600 text-white rounded font-body text-xs font-semibold hover:bg-red-700 transition-colors disabled:opacity-60"
                          >
                            {deleteProject.isPending ? (
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
                          onClick={() => setShowDeleteConfirm(project.id)}
                          className="p-1.5 text-on-surface-variant hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
