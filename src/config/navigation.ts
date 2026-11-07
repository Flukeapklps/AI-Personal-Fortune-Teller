import {
  BarChart3,
  BookOpen,
  ClipboardCheck,
  Layers,
  LayoutDashboard,
  Languages,
  NotebookPen,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Belongs to the HSK learning system (untouched by the Fortune module). */
  module: "core" | "hsk" | "fortune";
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, module: "core" },
  { href: "/learn", label: "Chinese Learning", icon: Languages, module: "hsk" },
  { href: "/flashcards", label: "Flashcards", icon: Layers, module: "hsk" },
  { href: "/vocabulary", label: "Vocabulary", icon: BookOpen, module: "hsk" },
  { href: "/memo", label: "Smart Memo", icon: NotebookPen, module: "hsk" },
  { href: "/exam", label: "HSK Exam", icon: ClipboardCheck, module: "hsk" },
  { href: "/analytics", label: "Learning Analytics", icon: BarChart3, module: "hsk" },
  { href: "/fortune", label: "ดูดวง", icon: Sparkles, module: "fortune" },
];
