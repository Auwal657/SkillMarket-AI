import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Inbox, CheckCircle, XCircle, Clock, ExternalLink, Loader2 } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { formatCurrency, formatDate } from "../lib/utils";

interface FreelancerInvitation {
  id: number;
  status: "pending" | "accepted" | "declined";
  message: string | null;
  createdAt: string;
  projectId: number;
  projectTitle: string;
  projectCategory: string;
  projectBudgetMin: number;
  projectBudgetMax: number;
  projectStatus: string;
  clientId: number;
  clientName: string;
}

interface ClientInvitation {
  id: number;
  status: "pending" | "accepted" | "declined";
  message: string | null;
  createdAt: string;
  projectId: number;
  projectTitle: string;
  freelancerProfileId: number;
  freelancerName: string;
  freelancerAvatarUrl: string | null;
}

const STATUS_STYLES = {
  pending: "bg-amber-50 text-amber-700 border border-amber-200",
  accepted: "bg-green-50 text-green-700 border border-green-200",
  declined: "bg-red-50 text-red-700 border border-red-200",
};

const STATUS_ICONS = {
  pending: <Clock size={12} />,
  accepted: <CheckCircle size={12} />,
  declined: <XCircle size={12} />,
};

export default function InvitationsPage() {
  const { user } = useAuth();
  const [invitations, setInvitations] = useState<FreelancerInvitation[] | ClientInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState<number | null>(null);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    fetch("/api/invitations", { credentials: "include" })
      .then(r => r.ok ? r.json() : [])
      .then(data => setInvitations(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleRespond = async (id: number, status: "accepted" | "declined") => {
    setResponding(id);
    setError("");
    try {
      const res = await fetch(`/api/invitations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.error ?? "Failed to respond");
        return;
      }
      setInvitations(prev =>
        (prev as FreelancerInvitation[]).map(inv =>
          inv.id === id ? { ...inv, status } : inv
        )
      );
    } catch {
      setError("Failed to respond");
    } finally {
      setResponding(null);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          {user.role === "freelancer" ? "Project Invitations" : "Sent Invitations"}
        </h1>
        <p className="text-gray-500 mt-1 text-sm">
          {user.role === "freelancer"
            ? "Clients who have invited you to work on their projects"
            : "Track the invitations you've sent to freelancers"}
        </p>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 text-red-700 rounded-xl px-4 py-3 text-sm">{error}</div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 size={32} className="animate-spin text-indigo-500" />
        </div>
      ) : invitations.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Inbox size={40} className="mx-auto mb-3 opacity-40" />
          <p className="font-medium text-gray-500">No invitations yet</p>
          <p className="text-sm mt-1">
            {user.role === "freelancer"
              ? "When clients invite you to projects, they'll appear here."
              : "Invite freelancers from their profile pages to get started."}
          </p>
          {user.role === "client" && (
            <Link href="/freelancers" className="btn-primary mt-6 inline-flex">
              Browse Freelancers
            </Link>
          )}
        </div>
      ) : user.role === "freelancer" ? (
        <div className="space-y-4">
          {(invitations as FreelancerInvitation[]).map(inv => (
            <div key={inv.id} className="card p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link
                      href={`/projects/${inv.projectId}`}
                      className="font-semibold text-gray-900 hover:text-indigo-600 transition-colors flex items-center gap-1"
                    >
                      {inv.projectTitle}
                      <ExternalLink size={13} className="opacity-50" />
                    </Link>
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_STYLES[inv.status]}`}>
                      {STATUS_ICONS[inv.status]}
                      {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">
                    from <span className="font-medium text-gray-700">{inv.clientName}</span>
                    {" · "}
                    <span className="text-gray-400">{inv.projectCategory}</span>
                    {" · "}
                    <span className="text-gray-400">{formatCurrency(inv.projectBudgetMin)}–{formatCurrency(inv.projectBudgetMax)}</span>
                  </p>
                  {inv.message && (
                    <p className="mt-2 text-sm text-gray-600 bg-gray-50 rounded-xl px-3 py-2 italic">
                      "{inv.message}"
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-2">{formatDate(inv.createdAt)}</p>
                </div>
              </div>

              {inv.status === "pending" && (
                <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => handleRespond(inv.id, "accepted")}
                    disabled={responding === inv.id}
                    className="btn-primary flex-1 justify-center text-sm disabled:opacity-60"
                  >
                    {responding === inv.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                    Accept
                  </button>
                  <button
                    onClick={() => handleRespond(inv.id, "declined")}
                    disabled={responding === inv.id}
                    className="btn-secondary flex-1 justify-center text-sm disabled:opacity-60 hover:bg-red-50 hover:text-red-700 hover:border-red-200"
                  >
                    <XCircle size={14} />
                    Decline
                  </button>
                  <Link
                    href={`/projects/${inv.projectId}`}
                    className="btn-secondary text-sm flex items-center gap-1.5"
                  >
                    View Project
                  </Link>
                </div>
              )}

              {inv.status !== "pending" && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <Link href={`/projects/${inv.projectId}`} className="text-sm text-indigo-600 hover:underline flex items-center gap-1">
                    View Project <ExternalLink size={12} />
                  </Link>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {(invitations as ClientInvitation[]).map(inv => (
            <div key={inv.id} className="card p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900">{inv.freelancerName}</span>
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_STYLES[inv.status]}`}>
                      {STATUS_ICONS[inv.status]}
                      {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">
                    invited to{" "}
                    <Link href={`/projects/${inv.projectId}`} className="font-medium text-gray-700 hover:text-indigo-600">
                      {inv.projectTitle}
                    </Link>
                  </p>
                  {inv.message && (
                    <p className="mt-2 text-sm text-gray-600 bg-gray-50 rounded-xl px-3 py-2 italic">
                      "{inv.message}"
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-2">{formatDate(inv.createdAt)}</p>
                </div>
                <Link
                  href={`/freelancers/${inv.freelancerProfileId}`}
                  className="btn-secondary text-sm shrink-0"
                >
                  View Profile
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
