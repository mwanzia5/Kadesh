import {
  GraduationCap,
  Heart,
  Droplet,
  UtensilsCrossed,
  Users,
  BookOpen,
  Home,
  Shield,
  Sun,
  Smile,
  TrendingUp,
  Building,
  HandHeart,
  Baby,
  School,
  Sprout,
} from "lucide-react";

export const PROJECT_ICONS = {
  GraduationCap,
  Heart,
  Droplet,
  UtensilsCrossed,
  Users,
  BookOpen,
  Home,
  Shield,
  Sun,
  Smile,
  TrendingUp,
  Building,
  HandHeart,
  Baby,
  School,
  Sprout,
};

export const ICON_OPTIONS = Object.keys(PROJECT_ICONS);

export function getProjectIcon(name) {
  return PROJECT_ICONS[name] || Heart;
}
