import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(amount);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(date));
}

export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const d = new Date(date);
  const diff = now.getTime() - d.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatDate(date);
}

export function getInitials(name: string): string {
  return name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + "…";
}

export function getAvailabilityColor(status: string): string {
  switch (status) {
    case "available": return "bg-green-100 text-green-700";
    case "busy": return "bg-yellow-100 text-yellow-700";
    case "unavailable": return "bg-red-100 text-red-700";
    default: return "bg-gray-100 text-gray-700";
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case "open": return "bg-green-100 text-green-700";
    case "in_progress": return "bg-blue-100 text-blue-700";
    case "completed": return "bg-purple-100 text-purple-700";
    case "cancelled": return "bg-red-100 text-red-700";
    case "pending": return "bg-yellow-100 text-yellow-700";
    case "accepted": return "bg-green-100 text-green-700";
    case "rejected": return "bg-red-100 text-red-700";
    default: return "bg-gray-100 text-gray-700";
  }
}
