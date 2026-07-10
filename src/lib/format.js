export function relativeTime(dateStr) {
  if (!dateStr) return "";
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export function formatBytes(bytes) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export function isRecent(dateStr, hours = 24) {
  if (!dateStr) return false;
  return Date.now() - new Date(dateStr).getTime() < hours * 60 * 60 * 1000;
}

export function fileVisual(mimeType = "") {
  if (mimeType.startsWith("image/")) return { icon: "image", label: "IMAGE", color: "text-primary", bg: "bg-primary-container/20" };
  if (mimeType.startsWith("video/")) return { icon: "movie", label: "VIDEO", color: "text-secondary", bg: "bg-secondary-container/20" };
  if (mimeType === "application/pdf") return { icon: "picture_as_pdf", label: "PDF", color: "text-error", bg: "bg-error/10" };
  if (mimeType.includes("presentation")) return { icon: "present_to_all", label: "PPTX", color: "text-secondary", bg: "bg-secondary/10" };
  if (mimeType.includes("zip") || mimeType.includes("compressed")) return { icon: "folder_zip", label: "ARCHIVE", color: "text-tertiary", bg: "bg-tertiary/10" };
  if (mimeType.startsWith("text/") || mimeType.includes("markdown")) return { icon: "description", label: "DOC", color: "text-on-surface-variant", bg: "bg-surface-variant" };
  return { icon: "draft", label: "FILE", color: "text-on-surface-variant", bg: "bg-surface-variant" };
}
