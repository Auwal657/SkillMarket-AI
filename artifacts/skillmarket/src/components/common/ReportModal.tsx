import { useState } from "react";
import { Flag, X } from "lucide-react";
import { cn } from "../../lib/utils";

interface ReportModalProps {
  targetType: "user" | "project" | "message";
  targetId: number;
  targetLabel?: string;
  onClose: () => void;
}

const REASONS = [
  { value: "spam", label: "Spam or misleading" },
  { value: "harassment", label: "Harassment or abuse" },
  { value: "fake_profile", label: "Fake profile or impersonation" },
  { value: "inappropriate_content", label: "Inappropriate content" },
  { value: "scam", label: "Scam or fraud" },
  { value: "other", label: "Other" },
];

export default function ReportModal({ targetType, targetId, targetLabel, onClose }: ReportModalProps) {
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) { setError("Please select a reason"); return; }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ targetType, targetId, reason, description: description.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to submit report"); return; }
      setSuccess(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-red-100 rounded-xl flex items-center justify-center">
              <Flag size={16} className="text-red-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Report {targetType}</h2>
              {targetLabel && <p className="text-xs text-gray-400">{targetLabel}</p>}
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={18} className="text-gray-400" />
          </button>
        </div>

        <div className="p-6">
          {success ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Flag size={20} className="text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Report submitted</h3>
              <p className="text-sm text-gray-500">Our team will review your report and take appropriate action.</p>
              <button onClick={onClose} className="mt-4 btn-secondary">Close</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <div className="bg-red-50 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>}
              <div>
                <label className="label">Reason for reporting</label>
                <div className="space-y-2">
                  {REASONS.map(r => (
                    <label key={r.value} className={cn(
                      "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors",
                      reason === r.value ? "border-red-300 bg-red-50" : "border-gray-200 hover:bg-gray-50"
                    )}>
                      <input type="radio" name="reason" value={r.value} checked={reason === r.value} onChange={e => setReason(e.target.value)} className="text-red-600" />
                      <span className="text-sm text-gray-700">{r.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="label">Additional details <span className="text-gray-400 font-normal">optional</span></label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Provide any additional context..."
                  className="input min-h-24"
                  maxLength={500}
                />
                <p className="text-xs text-gray-400 mt-1">{description.length}/500</p>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={submitting || !reason} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50">
                  {submitting ? <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> : <Flag size={14} />}
                  {submitting ? "Submitting..." : "Submit Report"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
