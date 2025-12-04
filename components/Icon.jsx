"use client";
import * as icons from "lucide-react";

export default function Icon({ name, ...props }) {
  const LucideIcon = icons[name] || icons.HelpCircle;
  if (!icons[name] && process.env.NODE_ENV === "development")
    console.warn(`Icon "${name}" not found. Using HelpCircle.`);
  return <LucideIcon {...props} />;
}
