import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FolderOpen,
  Image,
  Mail,
  Users,
  Upload,
  Plus,
  MessageSquare,
  Settings,
  Newspaper,
  Quote,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useProjects } from "@/hooks/useProjects";
import { useGalleryImages } from "@/hooks/useGallery";
import { useMessages } from "@/hooks/useContact";
import { usePartners } from "@/hooks/usePartners";
import { useNews } from "@/hooks/useNews";
import { useTestimonials } from "@/hooks/useTestimonials";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

function formatTimeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function DashboardHome() {
  const { data: projectsRes } = useProjects();
  const { data: galleryRes } = useGalleryImages();
  const { data: messagesRes } = useMessages();
  const { data: partnersRes } = usePartners();
  const { data: newsRes } = useNews();
  const { data: testimonialsRes } = useTestimonials();

  const projects = projectsRes?.data ?? [];
  const gallery = galleryRes?.data ?? [];
  const messages = messagesRes?.data ?? [];
  const partners = partnersRes?.data ?? [];
  const news = newsRes?.data ?? [];
  const testimonials = testimonialsRes?.data ?? [];

  const unreadMessages = messages.filter((m) => !m.is_read).length;

  const stats = [
    {
      label: "Total Projects",
      value: projects.length,
      icon: FolderOpen,
      color: "bg-vibrant-blue/10 text-vibrant-blue",
    },
    {
      label: "Gallery Images",
      value: gallery.length,
      icon: Image,
      color: "bg-hope-orange/10 text-hope-orange",
    },
    {
      label: "Messages",
      value: messages.length,
      icon: Mail,
      color: "bg-emerald-500/10 text-emerald-600",
      badge: unreadMessages > 0 ? `${unreadMessages} unread` : null,
    },
    {
      label: "Partners",
      value: partners.length,
      icon: Users,
      color: "bg-purple-500/10 text-purple-600",
    },
  ];

  const recentActivity = [
    ...messages.slice(0, 3).map((m) => ({
      text: `Message from ${m.first_name} ${m.last_name}`,
      time: m.created_at,
      icon: Mail,
    })),
    ...gallery.slice(0, 2).map((g) => ({
      text: `Gallery: ${g.title}`,
      time: g.created_at,
      icon: Image,
    })),
    ...projects.slice(0, 2).map((p) => ({
      text: `Project: ${p.title}`,
      time: p.created_at,
      icon: FolderOpen,
    })),
    ...news.slice(0, 2).map((n) => ({
      text: `News: ${n.title}`,
      time: n.created_at,
      icon: Newspaper,
    })),
    ...testimonials.slice(0, 1).map((t) => ({
      text: `Testimonial from ${t.name}`,
      time: t.created_at,
      icon: Quote,
    })),
  ]
    .sort((a, b) => new Date(b.time) - new Date(a.time))
    .slice(0, 8);

  const quickActions = [
    { label: "Upload Image", icon: Upload, path: "/admin/media" },
    { label: "Create Project", icon: Plus, path: "/admin/projects" },
    { label: "View Messages", icon: MessageSquare, path: "/admin/messages" },
    { label: "Edit Settings", icon: Settings, path: "/admin/settings" },
  ];

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      <motion.h2
        variants={itemVariants}
        className="font-display text-2xl font-semibold text-deep-navy mb-6"
      >
        Dashboard Overview
      </motion.h2>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <motion.div
            key={stat.label}
            variants={itemVariants}
            className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div
                className={cn(
                  "flex items-center justify-center w-11 h-11 rounded-lg",
                  stat.color
                )}
              >
                <stat.icon className="h-5 w-5" />
              </div>
              {stat.badge && (
                <span className="text-xs font-body font-semibold text-vibrant-blue bg-vibrant-blue/10 px-2 py-0.5 rounded-full">
                  {stat.badge}
                </span>
              )}
            </div>
            <p className="font-display text-3xl font-bold text-deep-navy">
              {stat.value}
            </p>
            <p className="font-body text-sm text-on-surface-variant mt-1">
              {stat.label}
            </p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent activity */}
        <motion.div
          variants={itemVariants}
          className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6"
        >
          <h3 className="font-display text-lg font-semibold text-deep-navy mb-4">
            Recent Activity
          </h3>
          <div className="divide-y divide-gray-100">
            {recentActivity.length === 0 ? (
              <p className="font-body text-sm text-on-surface-variant py-4 text-center">
                No recent activity yet.
              </p>
            ) : (
              recentActivity.map((activity, i) => (
                <div key={i} className="flex items-center gap-3 py-3">
                  <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gray-100 shrink-0">
                    <activity.icon className="h-4 w-4 text-on-surface-variant" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-body text-sm text-deep-navy truncate">
                      {activity.text}
                    </p>
                    <p className="font-body text-xs text-on-surface-variant">
                      {formatTimeAgo(activity.time)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>

        {/* Quick actions */}
        <motion.div
          variants={itemVariants}
          className="bg-white rounded-xl border border-gray-200 p-6"
        >
          <h3 className="font-display text-lg font-semibold text-deep-navy mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action) => (
              <Link
                key={action.label}
                to={action.path}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-200 hover:border-vibrant-blue hover:bg-vibrant-blue/5 transition-colors text-center group"
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 group-hover:bg-vibrant-blue/10 transition-colors">
                  <action.icon className="h-5 w-5 text-on-surface-variant group-hover:text-vibrant-blue transition-colors" />
                </div>
                <span className="font-body text-xs font-medium text-deep-navy">
                  {action.label}
                </span>
              </Link>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
