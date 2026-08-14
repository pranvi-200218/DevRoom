import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { formatBytes, relativeTime } from "../lib/format";
import { mi } from "../lib/icons";

const TEXT_PREVIEWABLE = [
  "text/",
  "application/json",
  "application/javascript",
  "application/xml",
  "application/x-yaml",
];

function previewKind(mimeType = "") {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType === "application/pdf") return "pdf";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  if (TEXT_PREVIEWABLE.some((p) => mimeType.startsWith(p))) return "text";
  return "none";
}

/**
 * Inline preview modal for a Resource Vault file. Opened by clicking a
 * file card/row (download + delete buttons still work independently via
 * stopPropagation). Animates in with GSAP; closes on backdrop click, the
 * close button, or Escape.
 */
export default function FilePreviewModal({ file, url, onClose }) {
  const backdropRef = useRef(null);
  const panelRef = useRef(null);
  const kind = previewKind(file?.mimeType);
  const [textContent, setTextContent] = useState(null);
  const [textError, setTextError] = useState(false);

  useLayoutEffect(() => {
    if (!file) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(backdropRef.current, { opacity: 0 }, { opacity: 1, duration: 0.2 });
      gsap.fromTo(
        panelRef.current,
        { opacity: 0, y: 24, scale: 0.97 },
        { opacity: 1, y: 0, scale: 1, duration: 0.35, ease: "power3.out" }
      );
    });
    return () => ctx.revert();
  }, [file]);

  useEffect(() => {
    if (!file || kind !== "text" || !url) return;
    let cancelled = false;
    setTextContent(null);
    setTextError(false);
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load file");
        return res.text();
      })
      .then((text) => { if (!cancelled) setTextContent(text.slice(0, 20000)); })
      .catch(() => { if (!cancelled) setTextError(true); });
    return () => { cancelled = true; };
  }, [file, kind, url]);

  useEffect(() => {
    if (!file) return;
    function onKey(e) { if (e.key === "Escape") close(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file]);

  function close() {
    const ctx = gsap.context(() => {
      gsap.to(panelRef.current, { opacity: 0, y: 12, scale: 0.98, duration: 0.18, ease: "power2.in" });
      gsap.to(backdropRef.current, { opacity: 0, duration: 0.18, delay: 0.02, onComplete: onClose });
    });
    return () => ctx.revert();
  }

  if (!file) return null;

  return (
    <div
      ref={backdropRef}
      onClick={close}
      className="fixed inset-0 z-[300] bg-black/70 backdrop-blur-sm flex items-center justify-center p-6"
    >
      <div
        ref={panelRef}
        onClick={(e) => e.stopPropagation()}
        className="glass rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden border border-outline-variant/10"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant/10 flex-shrink-0">
          <div className="min-w-0">
            <p className="font-body-sm text-body-sm font-medium text-on-surface truncate">{file.name}</p>
            <p className="font-code-sm text-code-sm text-on-surface-variant">
              {relativeTime(file.$createdAt)} • {formatBytes(file.size)}
            </p>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0 ml-4">
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-lg text-on-surface-variant hover:text-primary hover:bg-surface-variant/40 transition-colors"
              title="Download"
            >
              <i className={`${mi("download")} text-[20px]`} />
            </a>
            <button
              onClick={close}
              className="p-2 rounded-lg text-on-surface-variant hover:text-error hover:bg-surface-variant/40 transition-colors"
              title="Close"
            >
              <i className={`${mi("close")} text-[20px]`} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto bg-surface-container-lowest flex items-center justify-center min-h-[240px]">
          {kind === "image" && (
            <img src={url} alt={file.name} className="max-w-full max-h-[70vh] object-contain" />
          )}
          {kind === "pdf" && (
            <iframe src={url} title={file.name} className="w-full h-[70vh] border-0" />
          )}
          {kind === "video" && (
            <video src={url} controls className="max-w-full max-h-[70vh]" />
          )}
          {kind === "audio" && (
            <div className="w-full p-10 flex flex-col items-center gap-4">
              <i className={`${mi("audio_file")} text-primary text-[48px]`} />
              <audio src={url} controls className="w-full max-w-md" />
            </div>
          )}
          {kind === "text" && (
            <div className="w-full h-full p-5 overflow-auto">
              {textError && <p className="text-sm text-error">Couldn't load a preview for this file.</p>}
              {!textError && textContent === null && (
                <p className="text-sm text-on-surface-variant">Loading preview…</p>
              )}
              {!textError && textContent !== null && (
                <pre className="font-code-sm text-code-sm text-on-surface whitespace-pre-wrap break-words">
                  {textContent}
                </pre>
              )}
            </div>
          )}
          {kind === "none" && (
            <div className="flex flex-col items-center gap-3 p-10 text-center">
              <i className={`${mi("draft")} text-on-surface-variant text-[48px] opacity-40`} />
              <p className="text-sm text-on-surface-variant">
                No inline preview for this file type.<br />Download it to view the contents.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}