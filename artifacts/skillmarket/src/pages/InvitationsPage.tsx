import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Inbox, CheckCircle, XCircle, Clock, ExternalLink, Loader2, Send } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { formatCurrency, formatDate, cn } from "../lib/utils";
import Avatar from "../components/common/Avatar";

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
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  accepted: "bg-green-100 text-green-800 border-green-200",
  declined: "bg-red-100 text-red-800 border-red-200",
};

const STATUS_ICONS = {
  pending: <Clock size={14} />,
  accepted: <CheckCircle size={14} />,
  declined: <XCircle size={14} />,
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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fade-in">
      <div className="mb-10 border-b border-gray-100 pb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center shadow-sm">
            <Send size={24} className="text-indigo-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            {user.role === "freelancer" ? "Project Invitations" : "Sent Invitations"}
          </h1>
        </div>
        <p className="text-gray-500 sm:ml-15 mt-1 text-base">
          {user.role === "freelancer"
            ? "Review and respond to exclusive project offers from clients."
            : "Track the status of invitations you've sent to top freelancers."}
        </p>
      </div>

      {error && (
        <div className="mb-8 bg-red-50 text-red-700 rounded-xl px-5 py-4 text-sm font-medium border border-red-200 shadow-sm flex items-center gap-2">
          <XCircle size={18} /> {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center min-h-[40vh]">
          <Loader2 size={40} className="animate-spin text-indigo-500" />
        </div>
      ) : invitations.length === 0 ? (
        <div className="card p-12 text-center border-dashed border-2">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Inbox size={32} className="text-gray-300" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No invitations yet</h3>
          <p className="text-gray-500 max-w-sm mx-auto mb-8">
            {user.role === "freelancer"
              ? "Ensure your profile is complete and has an updated portfolio to attract clients."
              : "Find the perfect match for your project by browsing our freelancer directory."}
          </p>
          {user.role === "client" && (
            <Link href="/freelancers" className="btn-primary py-3 px-8 text-base shadow-md">
              Browse Top Talent
            </Link>
          )}
        </div>
      ) : user.role === "freelancer" ? (
        <div className="grid gap-6">
          {(invitations as FreelancerInvitation[]).map(inv => (
            <div key={inv.id} className="card p-0 overflow-hidden transition-all duration-300 hover:shadow-lg border border-gray-200">
              
              <div className="p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 mb-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 flex-wrap mb-3">
                      <Link
                        href={`/projects/${inv.projectId}`}
                        className="text-xl font-bold text-gray-900 hover:text-indigo-600 transition-colors"
                      >
                        {inv.projectTitle}
                      </Link>
                      <span className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${STATUS_STYLES[inv.status]}`}>
                        {STATUS_ICONS[inv.status]}
                        {inv.status}
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-600 bg-gray-50 inline-flex px-4 py-2 rounded-lg">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-gray-300"></span> 
                        <span className="font-medium text-gray-900">{inv.clientName}</span>
                      </span>
                      <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                      <span>{inv.projectCategory}</span>
                      <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                      <span className="font-semibold text-gray-900">
                        {formatCurrency(inv.projectBudgetMin)} – {formatCurrency(inv.projectBudgetMax)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-right sm:flex-shrink-0">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Received</p>
                    <p className="text-sm font-medium text-gray-900 mt-0.5">{formatDate(inv.createdAt)}</p>
                  </div>
                </div>

                {inv.message && (
                  <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-5 mb-6 relative">
                    <div className="absolute top-0 left-6 -mt-2 w-4 h-4 bg-indigo-50/50 border-t border-l border-indigo-100 transform rotate-45"></div>
                    <p className="text-sm text-indigo-900 leading-relaxed italic relative z-10">"{inv.message}"</p>
                  </div>
                )}

                {inv.status === "pending" ? (
                  <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-100">
                    <button
                      onClick={() => handleRespond(inv.id, "accepted")}
                      disabled={responding === inv.id}
                      className="btn-primary flex-1 justify-center py-3 text-base shadow-md shadow-indigo-200"
                    >
                      {responding === inv.id ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                      Accept Invitation
                    </button>
                    <button
                      onClick={() => handleRespond(inv.id, "declined")}
                      disabled={responding === inv.id}
                      className="btn-secondary flex-1 justify-center py-3 text-base border-gray-200 text-gray-700 hover:bg-red-50 hover:text-red-700 hover:border-red-200"
                    >
                      <XCircle size={18} />
                      Decline
                    </button>
                    <Link
                      href={`/projects/${inv.projectId}`}
                      className="btn-secondary flex-1 justify-center py-3 text-base"
                    >
                      View Details
                    </Link>
                  </div>
                ) : (
                  <div className="pt-6 border-t border-gray-100 flex justify-end">
                    <Link href={`/projects/${inv.projectId}`} className="btn-secondary py-2 px-6 text-sm flex items-center gap-2">
                      View Project <ExternalLink size={14} />
                    </Link>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-6">
          {(invitations as ClientInvitation[]).map(inv => (
            <div key={inv.id} className="card p-6 border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="flex items-center gap-4 flex-1">
                  <Avatar name={inv.freelancerName} avatarUrl={inv.freelancerAvatarUrl} size="lg" />
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg font-bold text-gray-900">{inv.freelancerName}</h3>
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${STATUS_STYLES[inv.status]}`}>
                        {STATUS_ICONS[inv.status]}
                        {inv.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Invited to work on{" "}
                      <Link href={`/projects/${inv.projectId}`} className="font-semibold text-indigo-600 hover:underline">
                        {inv.projectTitle}
                      </Link>
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Sent on {formatDate(inv.createdAt)}</p>
                  </div>
                </div>
                
                <div className="sm:flex-shrink-0 flex items-center gap-3 sm:border-l border-gray-100 sm:pl-6">
                  <Link
                    href={`/freelancers/${inv.freelancerProfileId}`}
                    className="btn-secondary py-2"
                  >
                    View Profile
                  </Link>
                </div>
              </div>
              
              {inv.message && (
                <div className="mt-6 bg-gray-50 border border-gray-100 rounded-xl p-4 ml-0 sm:ml-16">
                  <p className="text-sm text-gray-600 italic">"{inv.message}"</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
