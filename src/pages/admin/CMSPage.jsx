import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Save, Check, RotateCcw, Search, X, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useAllPageContent,
  useUpdatePageContent,
  useResetPageContent,
} from "@/hooks/usePageContent";
import { primeCMSCache } from "@/hooks/useCMS";
import { CMS_PAGES as PAGES, CMS_GROUPS as GROUPS } from "@/content/cmsFields";


const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

export default function CMSPage() {
  const [selectedPage, setSelectedPage] = useState(PAGES[0].id);
  const [editingSection, setEditingSection] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [search, setSearch] = useState("");
  const [errorMsg, setErrorMsg] = useState(null);

  const { data: allContent, isLoading } = useAllPageContent();
  const updateContent = useUpdatePageContent();
  const resetContent = useResetPageContent();

  // Build { pageSlug: { sectionKey: content } } from the flat Supabase rows
  const contentMap = useMemo(() => {
    const rows = allContent?.data ?? [];
    const map = {};
    for (const row of rows) {
      if (!map[row.page_slug]) map[row.page_slug] = {};
      map[row.page_slug][row.section_key] = row.content;
    }
    return map;
  }, [allContent]);

  const currentPage = PAGES.find((p) => p.id === selectedPage);

  const getValue = (pageId, sectionId, defaultValue) => {
    const override = contentMap[pageId]?.[sectionId];
    if (override === undefined || override === null) return defaultValue;
    return typeof override === "string" ? override : String(override);
  };

  const isEdited = (pageId, sectionId) => contentMap[pageId]?.[sectionId] !== undefined;

  const handleEdit = (section) => {
    setEditingSection(section.id);
    setEditContent(getValue(selectedPage, section.id, section.content));
    setErrorMsg(null);
  };

  // Awaited, not fired and forgotten: the public site reads the in-memory cache
  // that primeCMSCache rewrites, so waiting guarantees the page a visitor lands
  // on next already shows the new text.
  const handleSave = async (sectionId) => {
    setErrorMsg(null);
    try {
      const { error } = await updateContent.mutateAsync({
        pageSlug: selectedPage,
        sectionKey: sectionId,
        content: editContent,
      });
      if (error) throw error;
      await primeCMSCache(true); // refresh the cache the public pages read from
      setEditingSection(null);
    } catch (err) {
      setErrorMsg(err.message || "Failed to save this field.");
    }
  };

  const handleReset = async (pageId) => {
    setErrorMsg(null);
    try {
      const { error } = await resetContent.mutateAsync(pageId);
      if (error) throw error;
      await primeCMSCache(true); // refresh the cache the public pages read from
    } catch (err) {
      setErrorMsg(err.message || "Failed to reset this page.");
    }
  };

  const filteredSections = currentPage?.sections.filter((s) =>
    !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.content.toLowerCase().includes(search.toLowerCase())
  );

  const pageHasOverrides = (pageId) => contentMap[pageId] && Object.keys(contentMap[pageId]).length > 0;

  return (
    <motion.div variants={itemVariants} initial="hidden" animate="visible">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="font-display text-2xl font-semibold text-deep-navy">Content Management</h2>
          <p className="font-body text-sm text-on-surface-variant mt-1">
            Edit any text across the entire site — changes save live and are shared with every admin
          </p>
        </div>
      </div>

      {/* Page selector, grouped, with search alongside */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        <div className="flex-1 space-y-3">
          {GROUPS.map((group) => {
            const pagesInGroup = PAGES.filter((p) => p.group === group);
            if (pagesInGroup.length === 0) return null;
            return (
              <div key={group} className="flex items-start gap-3">
                <span className="font-body text-xs font-semibold uppercase tracking-wide text-gray-400 pt-1.5 w-16 shrink-0">
                  {group}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {pagesInGroup.map((page) => (
                    <button
                      key={page.id}
                      onClick={() => { setSelectedPage(page.id); setEditingSection(null); setErrorMsg(null); }}
                      className={cn(
                        "px-3 py-1.5 rounded-xl font-body text-xs font-semibold transition-all duration-200 border inline-flex items-center gap-1.5",
                        selectedPage === page.id
                          ? "bg-vibrant-blue text-white border-vibrant-blue shadow-md shadow-vibrant-blue/20 scale-[1.02]"
                          : "bg-white text-on-surface-variant border-gray-200 hover:border-vibrant-blue/30 hover:text-deep-navy hover:shadow-sm"
                      )}
                    >
                      {page.label}
                      {pageHasOverrides(page.id) && (
                        <span className={cn(
                          "inline-block w-1.5 h-1.5 rounded-full",
                          selectedPage === page.id ? "bg-white/80" : "bg-emerald-400 animate-pulse"
                        )} />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Search field — icon and input are flex siblings inside one bordered
            box, not an absolutely-positioned overlay, so they can never drift
            apart on wrap/resize. */}
        <div className="flex items-center gap-2 w-full lg:w-64 shrink-0 px-3 py-2.5 border border-gray-200 rounded-xl bg-white shadow-sm focus-within:ring-2 focus-within:ring-vibrant-blue/30 focus-within:border-vibrant-blue transition-all h-fit">
          <Search className="h-4 w-4 text-gray-400 shrink-0" />
          <input
            type="text"
            placeholder="Search fields..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent font-body text-sm focus:outline-none min-w-0"
          />
          {search && (
            <button onClick={() => setSearch("")} className="shrink-0 text-gray-400 hover:text-gray-600">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="mb-4 flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-700 font-body text-sm">
          <AlertCircle className="h-4 w-4 shrink-0" /> {errorMsg}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 text-vibrant-blue animate-spin" />
        </div>
      ) : (
        <>
          {pageHasOverrides(selectedPage) && (
            <div className="mb-4">
              <button
                onClick={() => handleReset(selectedPage)}
                disabled={resetContent.isPending}
                className="inline-flex items-center gap-1.5 font-body text-sm text-red-500 hover:text-red-700 transition-colors disabled:opacity-50"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                {resetContent.isPending ? "Resetting…" : `Reset ${currentPage?.label} to defaults`}
              </button>
            </div>
          )}

          <div className="space-y-3">
            {filteredSections?.map((section) => {
              const currentValue = getValue(selectedPage, section.id, section.content);
              const edited = isEdited(selectedPage, section.id);
              const isMultiline = section.type === "multiline";
              const isThisSaving = updateContent.isPending && editingSection === section.id;

              return (
                <div key={section.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden transition-shadow hover:shadow-sm">
                  <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
                    <div className="flex items-center gap-2 min-w-0">
                      <h3 className="font-display text-sm font-semibold text-deep-navy truncate">{section.name}</h3>
                      {edited && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 font-body text-caption text-emerald-600 shrink-0">
                          <Check className="h-2.5 w-2.5" /> Custom
                        </span>
                      )}
                    </div>
                    {editingSection !== section.id && (
                      <button onClick={() => handleEdit(section)} className="font-body text-sm font-medium text-vibrant-blue hover:text-vibrant-blue/80 transition-colors shrink-0 ml-3">
                        Edit
                      </button>
                    )}
                  </div>

                  {editingSection === section.id ? (
                    <div className="p-4">
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        rows={isMultiline ? 6 : 4}
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 font-body text-sm resize-y focus:outline-none focus:ring-2 focus:ring-vibrant-blue/20"
                      />
                      <div className="flex items-center gap-3 mt-3">
                        <button
                          onClick={() => handleSave(section.id)}
                          disabled={isThisSaving}
                          className={cn(
                            "inline-flex items-center gap-1.5 px-4 py-2 rounded-lg font-body text-sm font-semibold text-white transition-colors",
                            isThisSaving ? "bg-vibrant-blue/60 cursor-not-allowed" : "bg-vibrant-blue hover:bg-vibrant-blue/90"
                          )}
                        >
                          {isThisSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                          {isThisSaving ? "Saving..." : "Save"}
                        </button>
                        <button
                          onClick={() => setEditingSection(null)}
                          className="px-4 py-2 rounded-lg font-body text-sm text-gray-500 hover:bg-gray-100 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="px-5 py-3.5">
                      <p className="font-body text-sm text-on-surface-variant leading-relaxed">
                        {String(currentValue).slice(0, 200)}{String(currentValue).length > 200 ? "…" : ""}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </motion.div>
  );
}