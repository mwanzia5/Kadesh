import { Routes, Route, Navigate } from "react-router-dom";
import AdminLayout from "@/components/admin/AdminLayout";
import DashboardHome from "./DashboardHome";
import CMSPage from "./CMSPage";
import MediaLibrary from "./MediaLibrary";
import ProjectsManager from "./ProjectsManager";
import MessagesPage from "./MessagesPage";
import SettingsPage from "./SettingsPage";
import VideosManager from "./VideosManager";

export default function Dashboard() {
  return (
    <AdminLayout>
      <Routes>
        <Route index element={<DashboardHome />} />
        <Route path="cms" element={<CMSPage />} />
        <Route path="media" element={<MediaLibrary />} />
        <Route path="projects" element={<ProjectsManager />} />
        <Route path="videos" element={<VideosManager />} />
        <Route path="messages" element={<MessagesPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="testimonials" element={<PlaceholderPage title="Testimonials" />} />
        <Route path="news" element={<PlaceholderPage title="News" />} />
        <Route path="users" element={<PlaceholderPage title="Users" />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </AdminLayout>
  );
}

function PlaceholderPage({ title }) {
  return (
    <div className="flex items-center justify-center h-96">
      <div className="text-center">
        <h2 className="font-display text-2xl font-semibold text-deep-navy mb-2">
          {title}
        </h2>
        <p className="font-body text-on-surface-variant">
          This section is coming soon.
        </p>
      </div>
    </div>
  );
}
