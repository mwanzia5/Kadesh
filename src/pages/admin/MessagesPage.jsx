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
} from "lucide-react";
import { cn } from "@/lib/utils";

const MOCK_MESSAGES = [
  { id: 1, from: "John Doe", email: "john@example.com", subject: "Inquiry about volunteer opportunities", date: "2024-01-15", read: false, body: "Hello, I am interested in volunteering with your organization. Could you provide more information about available opportunities and how to get involved?" },
  { id: 2, from: "Sarah Johnson", email: "sarah@example.com", subject: "Partnership proposal", date: "2024-01-14", read: false, body: "Dear Kadesh Hope Mission, I represent Global Impact Fund and would like to discuss a potential partnership for your education programs." },
  { id: 3, from: "Michael Chen", email: "michael@example.com", subject: "Donation query", date: "2024-01-13", read: true, body: "Hi, I would like to make a monthly donation to support your borewell project. Please share the details for recurring donations." },
  { id: 4, from: "Emily Williams", email: "emily@example.com", subject: "School visit request", date: "2024-01-12", read: true, body: "I am a teacher and would like to organize a visit to one of your schools in Congo with my students. Is this possible?" },
  { id: 5, from: "David Okafor", email: "david@example.com", subject: "Feedback on community program", date: "2024-01-11", read: false, body: "The community development program has made a significant impact in our area. I wanted to share my gratitude and some suggestions for improvement." },
  { id: 6, from: "Lisa Patel", email: "lisa@example.com", subject: "Media collaboration", date: "2024-01-10", read: true, body: "We would love to feature your work in our documentary about African NGOs. Could we schedule an interview?" },
];

const FILTERS = ["All", "Unread", "Read"];

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function MessagesPage() {
  const [messages, setMessages] = useState(MOCK_MESSAGES);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  const filteredMessages = messages.filter((m) => {
    const matchesFilter =
      filter === "All" ||
      (filter === "Unread" && !m.read) ||
      (filter === "Read" && m.read);
    const matchesSearch =
      m.from.toLowerCase().includes(search.toLowerCase()) ||
      m.subject.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const toggleRead = (id) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, read: !m.read } : m))
    );
    if (selectedMessage?.id === id) {
      setSelectedMessage((prev) => prev && { ...prev, read: !prev.read });
    }
  };

  const handleDelete = (id) => {
    setMessages((prev) => prev.filter((m) => m.id !== id));
    setShowDeleteConfirm(null);
    if (selectedMessage?.id === id) setSelectedMessage(null);
  };

  const unreadCount = messages.filter((m) => !m.read).length;

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
        {/* Message list */}
        <div className="flex-1 min-w-0">
          {/* Filters */}
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

          {/* Messages table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="hidden md:grid grid-cols-[1fr_1.5fr_120px_80px_100px] gap-4 px-5 py-3 bg-gray-50 border-b border-gray-200">
              <span className="font-body text-xs font-semibold text-on-surface-variant uppercase tracking-wider">From</span>
              <span className="font-body text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Subject</span>
              <span className="font-body text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Date</span>
              <span className="font-body text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Status</span>
              <span className="font-body text-xs font-semibold text-on-surface-variant uppercase tracking-wider text-right">Actions</span>
            </div>
            <div className="divide-y divide-gray-100">
              {filteredMessages.map((msg) => (
                <button
                  key={msg.id}
                  onClick={() => {
                    setSelectedMessage(msg);
                    if (!msg.read) toggleRead(msg.id);
                  }}
                  className={cn(
                    "w-full text-left px-5 py-4 transition-colors hover:bg-gray-50",
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
                      {msg.subject}
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
                          toggleRead(msg.id);
                        }}
                        className="p-1.5 text-on-surface-variant hover:text-vibrant-blue hover:bg-vibrant-blue/5 rounded-lg transition-colors"
                        title={msg.read ? "Mark as unread" : "Mark as read"}
                      >
                        {msg.read ? (
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
                            className="px-2 py-1 bg-red-600 text-white rounded font-body text-xs font-semibold hover:bg-red-700 transition-colors"
                          >
                            Yes
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
              ))}
            </div>
          </div>
        </div>

        {/* Message detail panel */}
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
                  <p className="font-body text-sm font-medium text-deep-navy">{selectedMessage.subject}</p>
                </div>
                <div>
                  <p className="font-body text-xs text-on-surface-variant mb-1">Date</p>
                  <p className="font-body text-sm text-deep-navy">{selectedMessage.date}</p>
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
                  onClick={() => toggleRead(selectedMessage.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-gray-100 text-deep-navy rounded-lg font-body text-xs font-medium hover:bg-gray-200 transition-colors"
                >
                  {selectedMessage.read ? (
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
                <button className="inline-flex items-center gap-1.5 px-3 py-2 bg-vibrant-blue text-white rounded-lg font-body text-xs font-semibold hover:bg-vibrant-blue/90 transition-colors">
                  <Reply className="h-3.5 w-3.5" />
                  Reply
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
