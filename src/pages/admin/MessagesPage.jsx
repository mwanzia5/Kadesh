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
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useMessages,
  useMarkAsRead,
  useMarkAsUnread,
  useDeleteMessage,
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

  const messages = (messagesData?.data ?? []).map((m) => ({
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

  const unreadCount = messages.filter((m) => !m.read).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 text-vibrant-blue animate-spin" />
      </div>
    );
  }

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
                          "inline-flex w-fit items-center px-2 py-0.5 rounded-full font-body text-xs font-medium",
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
                  onClick={() => setSelectedMessage(null)}
                  className="text-on-surface-variant hover:text-deep-navy"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="font-body text-xs text-on-surface-variant mb-1">From</p>
                  <p className="font-body text-sm font-medium text-deep-navy">{selectedMessage.from}</p>
                  <p className="font-body text-xs text-vibrant-blue">{selectedMessage.email}</p>
                </div>
                <div>
                  <p className="font-body text-xs text-on-surface-variant mb-1">Subject</p>
                  <p className="font-body text-sm font-medium text-deep-navy">{selectedMessage.subject || "No subject"}</p>
                </div>
                <div>
                  <p className="font-body text-xs text-on-surface-variant mb-1">Date</p>
                  <p className="font-body text-sm text-deep-navy">
                    {selectedMessage.created_at
                      ? new Date(selectedMessage.created_at).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : selectedMessage.date}
                  </p>
                </div>
                <div className="pt-3 border-t border-gray-100">
                  <p className="font-body text-xs text-on-surface-variant mb-2">Message</p>
                  <p className="font-body text-sm text-on-surface leading-relaxed">
                    {selectedMessage.body}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-6 pt-4 border-t border-gray-100">
                <button
                  onClick={() => toggleRead(selectedMessage)}
                  disabled={actionLoading === selectedMessage.id}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-gray-100 text-deep-navy rounded-lg font-body text-xs font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  {actionLoading === selectedMessage.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : selectedMessage.read ? (
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
                <a
                  href={`mailto:${selectedMessage.email}?subject=Re: ${encodeURIComponent(selectedMessage.subject || "")}`}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-vibrant-blue text-white rounded-lg font-body text-xs font-semibold hover:bg-vibrant-blue/90 transition-colors"
                >
                  <Reply className="h-3.5 w-3.5" />
                  Reply
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
