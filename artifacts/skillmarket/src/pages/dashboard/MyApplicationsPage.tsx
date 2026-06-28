import { useState } from "react";
import { Link } from "wouter";
import { FileText, Trash2, Eye } from "lucide-react";
import { useListMyApplications } from "@workspace/api-client-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../contexts/AuthContext";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import EmptyState from "../../components/common/EmptyState";
import { formatCurrency, getStatusColor, formatDate, cn } from "../../lib/utils";

function useWithdrawApplication() {
  const { token } = useAuth();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/applications/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? "Failed to withdraw");
      }
      return res.json();
    },
  });
}

export default function MyApplicationsPage() {
  const { data: applications, isLoading } = useListMyApplications();
  const withdrawMutation = useWithdrawApplication();
  const queryClient = useQueryClient();
  const [withdrawing, setWithdrawing] = useState<number | null>(null);

  const handleWithdraw = async (id: number) => {
    if (!confirm("Withdraw this application? This cannot be undone.")) return;
    setWithdrawing(id);
    try {
      await withdrawMutation.mutateAsync(id);
      queryClient.invalidateQueries({ queryKey: ["/api/applications/my"] });
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to withdraw application");
    } finally {
      setWithdrawing(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Applications</h1>
          <p className="text-gray-500 mt-1">Track your project applications</p>
        </div>
        <Link href="/projects" className="btn-primary text-sm py-2 px-4">Find Projects</Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
      ) : applications && applications.length > 0 ? (
        <div className="space-y-4">
          {applications.map(app => (
            <div key={app.id} className="card p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={cn("badge", getStatusColor(app.status))}>{app.status}</span>
                    <span className="text-xs text-gray-400">{formatDate(app.createdAt)}</span>
                  </div>
                  <Link href={`/projects/${app.projectId}`} className="font-semibold text-gray-900 hover:text-indigo-600 transition-colors text-lg">{(app as unknown as { projectTitle?: string }).projectTitle ?? "Project"}</Link>
                  <p className="text-sm text-gray-500 mt-1">Proposed rate: <span className="font-medium text-gray-700">{formatCurrency(app.proposedRate)}/hr</span></p>
                  <p className="text-sm text-gray-600 mt-3 line-clamp-2 italic">"{app.coverLetter}"</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Link href={`/projects/${app.projectId}`} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                    <Eye size={16} />
                  </Link>
                  {app.status === "pending" && (
                    <button onClick={() => handleWithdraw(app.id)} disabled={withdrawing === app.id} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      {withdrawing === app.id ? <span className="animate-spin w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full block" /> : <Trash2 size={16} />}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState icon={FileText} title="No applications yet" description="Browse open projects and apply to opportunities that match your skills." action={{ label: "Browse Projects", onClick: () => window.location.href = "/projects" }} />
      )}
    </div>
  );
}
