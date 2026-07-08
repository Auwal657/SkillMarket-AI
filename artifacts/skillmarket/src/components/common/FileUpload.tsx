import { useRef, useCallback, useState } from "react";
import { Upload, X, FileText, AlertCircle, Image as ImageIcon } from "lucide-react";

interface UploadResult {
  url: string;
  name: string;
  type: string;
}

// Returns just the filename from a /uploads/<filename> URL, or null if not an
// uploaded file (could be an external http URL or empty string).
function extractUploadFilename(url: string): string | null {
  if (!url) return null;
  const match = url.match(/^\/uploads\/([^/]+)$/);
  return match ? (match[1] ?? null) : null;
}

// Best-effort: delete from server storage. Ignores failures (file may have
// already been removed or may be an external URL).
async function deleteUploadedFile(url: string): Promise<void> {
  const filename = extractUploadFilename(url);
  if (!filename) return;
  try {
    await fetch(`/api/uploads/${encodeURIComponent(filename)}`, {
      method: "DELETE",
      credentials: "include",
    });
  } catch {
    // Fire-and-forget — don't surface delete errors to the user
  }
}

// ─── Single File Upload ───────────────────────────────────────────────────────

interface FileUploadProps {
  label?: string;
  accept?: string;
  maxSizeMB?: number;
  hint?: string;
  value?: string | null;
  onChange: (url: string | null) => void;
}

export function FileUpload({ label, accept, maxSizeMB = 10, hint, value, onChange }: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const isImage = value ? /\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(value) || value.startsWith("data:image") : false;

  const handleFile = useCallback((file: File) => {
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File too large. Max ${maxSizeMB}MB.`);
      return;
    }
    setError("");
    setUploading(true);
    setProgress(0);

    const formData = new FormData();
    formData.append("file", file);

    const xhr = new XMLHttpRequest();
    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
    });
    xhr.addEventListener("load", () => {
      setUploading(false);
      if (xhr.status === 201) {
        const data: UploadResult = JSON.parse(xhr.responseText);
        // If replacing an existing upload, remove the old file from storage
        if (value) deleteUploadedFile(value);
        onChange(data.url);
      } else {
        try { setError(JSON.parse(xhr.responseText).error ?? "Upload failed"); }
        catch { setError("Upload failed"); }
      }
    });
    xhr.addEventListener("error", () => { setUploading(false); setError("Upload failed. Check your connection."); });
    xhr.open("POST", "/api/uploads");
    xhr.withCredentials = true;
    xhr.send(formData);
  }, [maxSizeMB, onChange, value]);

  const handleRemove = useCallback(() => {
    if (value) deleteUploadedFile(value);
    onChange(null);
  }, [value, onChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  return (
    <div className="space-y-1.5">
      {label && <label className="label font-medium text-gray-800">{label}</label>}
      {value ? (
        <div className="relative">
          {isImage ? (
            <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-gray-50" style={{ aspectRatio: "16/9" }}>
              <img src={value} alt="Preview" className="w-full h-full object-cover" />
              <button type="button" onClick={handleRemove}
                className="absolute top-2 right-2 w-7 h-7 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center transition-colors">
                <X size={13} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl border border-gray-200">
              <FileText size={18} className="text-gray-500 flex-shrink-0" />
              <span className="text-sm text-gray-700 truncate flex-1">{value.split("/").pop()}</span>
              <button type="button" onClick={handleRemove} className="text-gray-400 hover:text-red-600 transition-colors flex-shrink-0">
                <X size={15} />
              </button>
            </div>
          )}
        </div>
      ) : uploading ? (
        <div className="border-2 border-dashed border-indigo-300 rounded-xl p-5 bg-indigo-50/40">
          <div className="text-center space-y-3">
            <div className="w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center mx-auto">
              <Upload size={16} className="text-indigo-600 animate-pulse" />
            </div>
            <p className="text-sm text-gray-600 font-medium">Uploading… {progress}%</p>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>
      ) : (
        <div
          className="border-2 border-dashed border-gray-200 rounded-xl p-5 hover:border-indigo-300 hover:bg-indigo-50/20 cursor-pointer transition-all group"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
        >
          <div className="text-center space-y-2">
            <div className="w-9 h-9 bg-gray-100 group-hover:bg-indigo-100 rounded-full flex items-center justify-center mx-auto transition-colors">
              <Upload size={16} className="text-gray-400 group-hover:text-indigo-600 transition-colors" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 group-hover:text-indigo-700 transition-colors">Click or drag to upload</p>
              {hint && <p className="text-xs text-gray-400 mt-0.5">{hint}</p>}
            </div>
          </div>
          <input ref={inputRef} type="file" accept={accept} className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }} />
        </div>
      )}
      {error && (
        <div className="flex items-center gap-1.5 text-red-600 text-xs">
          <AlertCircle size={12} />{error}
        </div>
      )}
    </div>
  );
}

// ─── Multi-File Upload (screenshots) ─────────────────────────────────────────

interface MultiFileUploadProps {
  label?: string;
  accept?: string;
  maxSizeMB?: number;
  hint?: string;
  values: string[];
  onChange: (urls: string[]) => void;
  maxFiles?: number;
}

export function MultiFileUpload({ label, accept, maxSizeMB = 10, hint, values, onChange, maxFiles = 10 }: MultiFileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    if (values.length >= maxFiles) { setError(`Maximum ${maxFiles} files.`); return; }
    if (file.size > maxSizeMB * 1024 * 1024) { setError(`File too large. Max ${maxSizeMB}MB.`); return; }
    setError("");
    setUploading(true);
    setProgress(0);

    const formData = new FormData();
    formData.append("file", file);

    const xhr = new XMLHttpRequest();
    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
    });
    xhr.addEventListener("load", () => {
      setUploading(false);
      if (xhr.status === 201) {
        const data: UploadResult = JSON.parse(xhr.responseText);
        onChange([...values, data.url]);
      } else {
        try { setError(JSON.parse(xhr.responseText).error ?? "Upload failed"); }
        catch { setError("Upload failed"); }
      }
    });
    xhr.addEventListener("error", () => { setUploading(false); setError("Upload failed."); });
    xhr.open("POST", "/api/uploads");
    xhr.withCredentials = true;
    xhr.send(formData);
  }, [values, maxFiles, maxSizeMB, onChange]);

  const removeAt = (idx: number) => {
    const url = values[idx];
    if (url) deleteUploadedFile(url);
    onChange(values.filter((_, i) => i !== idx));
  };

  const isImageUrl = (url: string) => /\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(url);

  return (
    <div className="space-y-2">
      {label && <label className="label font-medium text-gray-800">{label}</label>}

      {values.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-2">
          {values.map((url, idx) => (
            <div key={idx} className="relative group rounded-lg overflow-hidden border border-gray-200 bg-gray-50 aspect-video">
              {isImageUrl(url) ? (
                <img src={url} alt={`screenshot ${idx + 1}`} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-1 text-gray-400">
                  <FileText size={20} />
                  <span className="text-[10px] truncate px-1 max-w-full">{url.split("/").pop()}</span>
                </div>
              )}
              <button type="button" onClick={() => removeAt(idx)}
                className="absolute top-1 right-1 w-5 h-5 bg-black/60 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                <X size={10} />
              </button>
            </div>
          ))}
        </div>
      )}

      {values.length < maxFiles && (
        uploading ? (
          <div className="border-2 border-dashed border-indigo-300 rounded-xl p-4 bg-indigo-50/40">
            <div className="flex items-center gap-3">
              <Upload size={16} className="text-indigo-600 animate-pulse flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-gray-600">Uploading… {progress}%</p>
                <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                  <div className="bg-indigo-600 h-1 rounded-full transition-all" style={{ width: `${progress}%` }} />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div
            className="border-2 border-dashed border-gray-200 rounded-xl p-4 hover:border-indigo-300 hover:bg-indigo-50/20 cursor-pointer transition-all group flex items-center gap-3"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
          >
            <div className="w-8 h-8 bg-gray-100 group-hover:bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0 transition-colors">
              <ImageIcon size={15} className="text-gray-400 group-hover:text-indigo-600 transition-colors" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 group-hover:text-indigo-700 transition-colors">Add screenshot</p>
              {hint && <p className="text-xs text-gray-400">{hint}</p>}
            </div>
            <input ref={inputRef} type="file" accept={accept} className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }} />
          </div>
        )
      )}

      {error && (
        <div className="flex items-center gap-1.5 text-red-600 text-xs">
          <AlertCircle size={12} />{error}
        </div>
      )}
    </div>
  );
}
