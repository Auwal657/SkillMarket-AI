import { useState, useEffect } from "react";
import { X, Send, CheckCircle, Loader2 } from "lucide-react";

interface Project {
  id: number;
  title: string;
  status: string;
  category: string;
}

interface InviteModalProps {
  freelancerProfileId: number;
  freelancerName: string;
  onClose: () => void;
}

export default function InviteModal({ freelancerProfileId, freelancerName, onClose }: InviteModalProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/projects/my", { credentials: "include" })
      .then(r => r.ok ? r.json() : [])
      .then((data: Project[]) => {
        const open = data.filter(p => p.status === "open");
        setProjects(open);
        if (open.length === 1) setSelectedProjectId(open[0].id);
      })
      .catch(() => {})
      .finally(() => setLoadingProjects(false));
  }, []);

  const handleSend = async () => {
    if (!selectedProjectId) { setError("Please select a project"); return; }
    setError("");
    setSending(true);
    try {
      const res = await fetch("/api/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          projectId: selectedProjectId,
          freelancerProfileId,
          message: message.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "Failed to send invitation");
        return;
      }
      setSent(true);
    } catch {
      setError("Failed to send invitation");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Invite to Project</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {sent ? (
            <div className="text-center py-6 space-y-3">
              <div className="flex justify-center">
                <CheckCircle size={48} className="text-green-500" />
              </div>
              <p className="font-semibold text-gray-900">Invitation Sent!</p>
              <p className="text-sm text-gray-500">
                {freelancerName} will be notified and can accept or decline.
              </p>
              <button onClick={onClose} className="btn-primary mt-2">Close</button>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-600">
                Inviting <span className="font-semibold text-gray-900">{freelancerName}</span> to one of your open projects.
              </p>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2">{error}</p>
              )}

              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1.5">Select Project</label>
                {loadingProjects ? (
                  <div className="flex items-center gap-2 text-sm text-gray-400 py-2">
                    <Loader2 size={14} className="animate-spin" /> Loading your projects…
                  </div>
                ) : projects.length === 0 ? (
                  <p className="text-sm text-gray-500 bg-gray-50 rounded-xl px-3 py-3">
                    You have no open projects. <a href="/post-project" className="text-indigo-600 hover:underline">Post a project first.</a>
                  </p>
                ) : (
                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                    {projects.map(p => (
                      <button
                        key={p.id}
                        onClick={() => setSelectedProjectId(p.id)}
                        className={`w-full text-left px-3 py-2.5 rounded-xl border text-sm transition-colors ${
                          selectedProjectId === p.id
                            ? "border-indigo-400 bg-indigo-50 text-indigo-900"
                            : "border-gray-200 hover:border-gray-300 text-gray-700"
                        }`}
                      >
                        <span className="font-medium">{p.title}</span>
                        <span className="ml-2 text-xs text-gray-400">{p.category}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1.5">
                  Personal Message <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  rows={3}
                  maxLength={500}
                  placeholder="Briefly explain why you think they'd be a great fit…"
                  className="input text-sm resize-none"
                />
              </div>

              <div className="flex gap-3 pt-1">
                <button onClick={onClose} className="btn-secondary flex-1 justify-center">
                  Cancel
                </button>
                <button
                  onClick={handleSend}
                  disabled={sending || !selectedProjectId || projects.length === 0}
                  className="btn-primary flex-1 justify-center disabled:opacity-60"
                >
                  {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  {sending ? "Sending…" : "Send Invite"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
