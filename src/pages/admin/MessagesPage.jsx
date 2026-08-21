import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  MailOpen,
  Trash2,
  Search,
  X,
  Clock,
  Reply,
  Loader2,
  Pencil,
  Save,
  Send,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useMessages,
  useMarkAsRead,
  useMarkAsUnread,
  useDeleteMessage,
  useUpdateMessage, // NOTE: assumed to exist alongside the other mutations in
                     // useContact — mutateAsync({ id, subject, message }).
                     // If it isn't there yet, add it (mirrors useMarkAsRead's
                     // shape, just PATCHing subject/message instead of is_read).
  useReplyToMessage, // NOTE: same assumption — mutateAsync({ id, body }),
                      // hitting whatever endpoint actually sends the reply
                      // email server-side. If you don't have that endpoint,
                      // the Reply modal below falls back to a prefilled
                      // mailto: link, so it still works without it.
} from "@/hooks/useContact";

const FILTERS = ["All", "Unread", "Read"];

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function MessagesPage() {
  const { data: messagesData, isLoading } = useMessages();
  const markAsRead = useMarkAsRead();
  const markAsUnread = useMarkAsUnread();
  const deleteMessage = useDeleteMessage();
  const updateMessage = useUpdateMessage?.();
  const replyToMessage = useReplyToMessage?.();

  // getMessages() resolves to the row array itself (not { data }), so use it directly
  const messages = (messagesData ?? []).map((m) => ({
    ...m,
    from: [m.first_name, m.last_name].filter(Boolean).join(" "),
    date: m.created_at
      ? new Date(m.created_at).toISOString().split("T")[0]
      : "",
    body: m.message,
    read: m.is_read,
  }));

  const [selectedMessage, setSelectedMessage] = useState(null);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  // Edit state
  const [editingId, setEditingId] = useState(null);
  const [editSubject, setEditSubject] = useState("");
  const [editBody, setEditBody] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  // Reply state
  const [replyTarget, setReplyTarget] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  const filteredMessages = messages.filter((m) => {
    const matchesFilter =
      filter === "All" ||
      (filter === "Unread" && !m.read) ||
      (filter === "Read" && m.read);
    const matchesSearch =
      m.from.toLowerCase().includes(search.toLowerCase()) ||
      (m.subject || "").toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const toggleRead = async (msg) => {
    setActionLoading(msg.id);
    try {
      if (msg.read) {
        await markAsUnread.mutateAsync(msg.id);
      } else {
        await markAsRead.mutateAsync(msg.id);
      }
      if (selectedMessage?.id === msg.id) {
        setSelectedMessage((prev) => prev && { ...prev, read: !prev.read });
      }
    } catch (err) {
      console.error("Toggle read failed:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id) => {
    setActionLoading(id);
    try {
      await deleteMessage.mutateAsync(id);
      setShowDeleteConfirm(null);
      if (selectedMessage?.id === id) setSelectedMessage(null);
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const startEdit = (msg) => {
    setEditingId(msg.id);
    setEditSubject(msg.subject || "");
    setEditBody(msg.body || "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditSubject("");
    setEditBody("");
  };

  const saveEdit = async (msg) => {
    setSavingEdit(true);
    try {
      if (updateMessage) {
        await updateMessage.mutateAsync({
          id: msg.id,
          subject: editSubject,
          message: editBody,
        });
      }
      setSelectedMessage((prev) =>
        prev && prev.id === msg.id
          ? { ...prev, subject: editSubject, body: editBody }
          : prev
      );
      setEditingId(null);
    } catch (err) {
      console.error("Save edit failed:", err);
    } finally {
      setSavingEdit(false);
    }
  };

  const openReply = (msg) => {
    setReplyTarget(msg);
    setReplyText("");
  };

  const closeReply = () => {
    setReplyTarget(null);
    setReplyText("");
  };

  const sendReply = async () => {
    if (!replyTarget || !replyText.trim()) return;
    setSendingReply(true);
    try {
      if (replyToMessage) {
        await replyToMessage.mutateAsync({
          id: replyTarget.id,
          body: replyText,
        });
      } else {
        // Fallback: no backend send-mail endpoint wired up yet, open the
        // user's mail client with the reply prefilled instead.
        window.location.href = `mailto:${replyTarget.email}?subject=${encodeURIComponent(
          `Re: ${replyTarget.subject || ""}`
        )}&body=${encodeURIComponent(replyText)}`;
      }
      closeReply();
    } catch (err) {
      console.error("Send reply failed:", err);
    } finally {
      setSendingReply(false);
    }
  };

  const unreadCount = messages.filter((m) => !m.read).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 text-vibrant-blue animate-spin" />
      </div>
    );
  }

  // Shared detail body, used both in the desktop sidebar and the mobile sheet.
  const renderDetail = (msg) => {
    const isEditing = editingId === msg.id;
    return (
      <>
        <div className="space-y-4">
          <div>
            <p className="font-body text-xs text-on-surface-variant mb-1">From</p>
            <p className="font-body text-sm font-medium text-deep-navy">{msg.from}</p>
            <p className="font-body text-xs text-vibrant-blue break-all">{msg.email}</p>
          </div>

          <div>
            <p className="font-body text-xs text-on-surface-variant mb-1">Subject</p>
            {isEditing ? (
              <input
                type="text"
                value={editSubject}
                onChange={(e) => setEditSubject(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 font-body text-sm focus:outline-none focus:ring-2 focus:ring-vibrant-blue/20 focus:border-vibrant-blue"
              />
            ) : (
              <p className="font-body text-sm font-medium text-deep-navy">
                {msg.subject || "No subject"}
              </p>
            )}
          </div>

          <div>
            <p className="font-body text-xs text-on-surface-variant mb-1">Date</p>
            <p className="font-body text-sm text-deep-navy">
              {msg.created_at
                ? new Date(msg.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : msg.date}
            </p>
          </div>

          <div className="pt-3 border-t border-gray-100">
            <p className="font-body text-xs text-on-surface-variant mb-2">Message</p>
            {isEditing ? (
              <textarea
                value={editBody}
                onChange={(e) => setEditBody(e.target.value)}
                rows={6}
                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 font-body text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-vibrant-blue/20 focus:border-vibrant-blue resize-none"
              />
            ) : (
              <p className="font-body text-sm text-on-surface leading-relaxed whitespace-pre-wrap">
                {msg.body}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 mt-6 pt-4 border-t border-gray-100">
          {isEditing ? (
            <>
              <button
                onClick={() => saveEdit(msg)}
                disabled={savingEdit}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-vibrant-blue text-white rounded-lg font-body text-xs font-semibold hover:bg-vibrant-blue/90 transition-colors disabled:opacity-60"
              >
                {savingEdit ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Save className="h-3.5 w-3.5" />
                )}
                Save
              </button>
              <button
                onClick={cancelEdit}
                disabled={savingEdit}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-gray-100 text-deep-navy rounded-lg font-body text-xs font-medium hover:bg-gray-200 transition-colors disabled:opacity-60"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => toggleRead(msg)}
                disabled={actionLoading === msg.id}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-gray-100 text-deep-navy rounded-lg font-body text-xs font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                {actionLoading === msg.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : msg.read ? (
                  <>
                    <Mail className="h-3.5 w-3.5" />
                    Mark Unread
                  </>
                ) : (
                  <>
                    <MailOpen className="h-3.5 w-3.5" />
                    Mark Read
                  </>
                )}
              </button>
              <button
                onClick={() => startEdit(msg)}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-gray-100 text-deep-navy rounded-lg font-body text-xs font-medium hover:bg-gray-200 transition-colors"
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </button>
              <button
                onClick={() => openReply(msg)}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-vibrant-blue text-white rounded-lg font-body text-xs font-semibold hover:bg-vibrant-blue/90 transition-colors"
              >
                <Reply className="h-3.5 w-3.5" />
                Reply
              </button>
            </>
          )}
        </div>
      </>
    );
  };

  return (
    <motion.div variants={itemVariants} initial="hidden" animate="visible">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="font-display text-2xl font-semibold text-deep-navy">
            Messages
          </h2>
          <p className="font-body text-sm text-on-surface-variant mt-1">
            {unreadCount} unread message{unreadCount !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <div className="flex gap-6">
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant" />
              <input
                type="text"
                placeholder="Search messages..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-lg pl-9 pr-4 py-2 font-body text-sm focus:outline-none focus:ring-2 focus:ring-vibrant-blue/20 focus:border-vibrant-blue"
              />
            </div>
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 w-fit">
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
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="hidden md:grid grid-cols-[1fr_1.5fr_120px_80px_100px] gap-4 px-5 py-3 bg-gray-50 border-b border-gray-200">
              <span className="font-body text-xs font-semibold text-on-surface-variant uppercase tracking-wider">From</span>
              <span className="font-body text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Subject</span>
              <span className="font-body text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Date</span>
              <span className="font-body text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Status</span>
              <span className="font-body text-xs font-semibold text-on-surface-variant uppercase tracking-wider text-right">Actions</span>
            </div>
            <div className="divide-y divide-gray-100">
              {filteredMessages.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <Mail className="w-10 h-10 mx-auto mb-2 opacity-40" />
                  <p className="font-body text-sm">No messages found</p>
                </div>
              ) : (
                filteredMessages.map((msg) => (
                  <button
                    key={msg.id}
                    onClick={() => {
                      setSelectedMessage(msg);
                      if (!msg.read && actionLoading !== msg.id) toggleRead(msg);
                    }}
                    disabled={actionLoading === msg.id}
                    className={cn(
                      "w-full text-left px-5 py-4 transition-colors hover:bg-gray-50 disabled:opacity-60",
                      !msg.read && "bg-vibrant-blue/5",
                      selectedMessage?.id === msg.id && "bg-vibrant-blue/5"
                    )}
                  >
                    <div className="md:grid md:grid-cols-[1fr_1.5fr_120px_80px_100px] md:gap-4 md:items-center">
                      <div className="flex items-center gap-2 mb-1 md:mb-0">
                        {!msg.read ? (
                          <Mail className="h-4 w-4 text-vibrant-blue shrink-0" />
                        ) : (
                          <MailOpen className="h-4 w-4 text-gray-300 shrink-0" />
                        )}
                        <span className={cn(
                          "font-body text-sm truncate",
                          !msg.read ? "font-semibold text-deep-navy" : "text-on-surface-variant"
                        )}>
                          {msg.from}
                        </span>
                        <span className="md:hidden ml-auto shrink-0">
                          <span
                            className={cn(
                              "inline-flex items-center px-2 py-0.5 rounded-full font-body text-xs font-medium",
                              !msg.read
                                ? "bg-vibrant-blue/10 text-vibrant-blue"
                                : "bg-gray-100 text-on-surface-variant"
                            )}
                          >
                            {!msg.read ? "Unread" : "Read"}
                          </span>
                        </span>
                      </div>
                      <p className={cn(
                        "font-body text-sm truncate mb-1 md:mb-0",
                        !msg.read ? "font-medium text-deep-navy" : "text-on-surface-variant"
                      )}>
                        {msg.subject || "No subject"}
                      </p>
                      <span className="font-body text-xs text-on-surface-variant flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {msg.date}
                      </span>
                      <span
                        className={cn(
                          "hidden md:inline-flex w-fit items-center px-2 py-0.5 rounded-full font-body text-xs font-medium",
                          !msg.read
                            ? "bg-vibrant-blue/10 text-vibrant-blue"
                            : "bg-gray-100 text-on-surface-variant"
                        )}
                      >
                        {!msg.read ? "Unread" : "Read"}
                      </span>
                      <div className="flex items-center gap-1 justify-end mt-2 md:mt-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleRead(msg);
                          }}
                          disabled={actionLoading === msg.id}
                          className="p-1.5 text-on-surface-variant hover:text-vibrant-blue hover:bg-vibrant-blue/5 rounded-lg transition-colors disabled:opacity-50"
                          title={msg.read ? "Mark as unread" : "Mark as read"}
                        >
                          {actionLoading === msg.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : msg.read ? (
                            <Mail className="h-4 w-4" />
                          ) : (
                            <MailOpen className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openReply(msg);
                          }}
                          className="p-1.5 text-on-surface-variant hover:text-vibrant-blue hover:bg-vibrant-blue/5 rounded-lg transition-colors"
                          title="Reply"
                        >
                          <Reply className="h-4 w-4" />
                        </button>
                        {showDeleteConfirm === msg.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(msg.id);
                              }}
                              disabled={actionLoading === msg.id}
                              className="px-2 py-1 bg-red-600 text-white rounded font-body text-xs font-semibold hover:bg-red-700 transition-colors disabled:opacity-60"
                            >
                              {actionLoading === msg.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                "Yes"
                              )}
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowDeleteConfirm(null);
                              }}
                              className="px-2 py-1 bg-gray-100 text-gray-600 rounded font-body text-xs hover:bg-gray-200 transition-colors"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowDeleteConfirm(msg.id);
                            }}
                            className="p-1.5 text-on-surface-variant hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Desktop / large-screen detail sidebar */}
        <AnimatePresence>
          {selectedMessage && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="hidden lg:block w-96 shrink-0 bg-white rounded-xl border border-gray-200 p-6 h-fit sticky top-0"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-base font-semibold text-deep-navy">
                  Message Detail
                </h3>
                <button
                  onClick={() => {
                    setSelectedMessage(null);
                    cancelEdit();
                  }}
                  className="text-on-surface-variant hover:text-deep-navy"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              {renderDetail(selectedMessage)}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile / tablet detail sheet — same content, full-screen below lg */}
      <AnimatePresence>
        {selectedMessage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center sm:justify-center"
            onClick={() => {
              setSelectedMessage(null);
              cancelEdit();
            }}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-full sm:max-w-lg sm:rounded-xl rounded-t-2xl p-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-base font-semibold text-deep-navy">
                  Message Detail
                </h3>
                <button
                  onClick={() => {
                    setSelectedMessage(null);
                    cancelEdit();
                  }}
                  className="text-on-surface-variant hover:text-deep-navy p-1"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              {renderDetail(selectedMessage)}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reply modal — works on both mobile and desktop */}
      <AnimatePresence>
        {replyTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center sm:justify-center"
            onClick={closeReply}
          >
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-full sm:max-w-lg sm:rounded-xl rounded-t-2xl p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-display text-base font-semibold text-deep-navy">
                    Reply to {replyTarget.from}
                  </h3>
                  <p className="font-body text-xs text-on-surface-variant mt-0.5">
                    {replyTarget.email}
                  </p>
                </div>
                <button
                  onClick={closeReply}
                  className="text-on-surface-variant hover:text-deep-navy p-1"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                <p className="font-body text-xs text-on-surface-variant mb-1">
                  Re: {replyTarget.subject || "No subject"}
                </p>
                <p className="font-body text-xs text-on-surface-variant line-clamp-2">
                  {replyTarget.body}
                </p>
              </div>

              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                rows={6}
                placeholder="Write your reply..."
                autoFocus
                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 font-body text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-vibrant-blue/20 focus:border-vibrant-blue resize-none"
              />

              <div className="flex items-center gap-2 mt-4">
                <button
                  onClick={sendReply}
                  disabled={sendingReply || !replyText.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-vibrant-blue text-white rounded-lg font-body text-xs font-semibold hover:bg-vibrant-blue/90 transition-colors disabled:opacity-50"
                >
                  {sendingReply ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Send className="h-3.5 w-3.5" />
                  )}
                  {replyToMessage ? "Send Reply" : "Open in Email"}
                </button>
                <button
                  onClick={closeReply}
                  className="px-4 py-2 bg-gray-100 text-deep-navy rounded-lg font-body text-xs font-medium hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}