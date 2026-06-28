import { useState } from "react";
import { Link } from "wouter";
import { Briefcase, Plus, Edit, Trash2, Users, Eye, CheckSquare } from "lucide-react";
import { useListMyProjects, useDeleteProject } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import EmptyState from "../../components/common/EmptyState";
import { formatCurrency, getStatusColor, formatDate, cn } from "../../lib/utils";

export default function MyProjectsPage() {
  const { data: projects, isLoading, refetch } = useListMyProjects();
  const deleteMutation = useDeleteProject();
  const queryClient = useQueryClient();
  const [deleting, setDeleting] = useState<number | null>(null);
  const [completing, setCompleting] = useState<number | null>(null);

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this project? This will also remove all applications.")) return;
    setDeleting(id);
    try {
      await deleteMutation.mutateAsync({ id });
      queryClient.invalidateQueries({ queryKey: ["/api/projects/my"] });
    } catch {
      alert("Failed to delete project");
    } finally {
      setDeleting(null);
    }
  };

  const handleMarkComplete = async (id: number, title: string) => {
    if (!confirm(`Mark "${title}" as complete? This will notify the freelancer and allow you to leave a review.`)) return;
    setCompleting(id);
    try {
      const res = await fetch(`/api/projects/${id}/complete`, {
        method: "PATCH",
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data?.error ?? "Failed to mark project complete");
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["/api/projects/my"] });
      await refetch();
    } catch {
      alert("Failed to mark project complete");
    } finally {
      setCompleting(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Projects</h1>
          <p className="text-gray-500 mt-1">Manage your posted projects</p>
        </div>
        <Link href="/post-project" className="btn-primary"><Plus size={16} /> Post Project</Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
      ) : projects && projects.length > 0 ? (
        <div className="space-y-4">
          {projects.map(p => (
            <div key={p.id} className="card p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={cn("badge", getStatusColor(p.status))}>{p.status.replace("_", " ")}</span>
                    <span className="badge bg-indigo-100 text-indigo-700">{p.category}</span>
                    <span className="text-xs text-gray-400">{formatDate(p.createdAt)}</span>
                  </div>
                  <Link href={`/projects/${p.id}`} className="font-semibold text-gray-900 hover:text-indigo-600 transition-colors text-lg">{p.title}</Link>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">{p.description}</p>
                  <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                    <span>{formatCurrency(p.budgetMin)} – {formatCurrency(p.budgetMax)}</span>
                    <div className="flex items-center gap-1"><Users size={14} /> {p.applicationCount ?? 0} applications</div>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0 flex-wrap justify-end">
                  {p.status === "in_progress" && (
                    <button
                      onClick={() => handleMarkComplete(p.id, p.title)}
                      disabled={completing === p.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                      title="Mark Complete"
                    >
                      {completing === p.id
                        ? <span className="animate-spin w-3 h-3 border border-white border-t-transparent rounded-full" />
                        : <CheckSquare size={13} />}
                      Complete
                    </button>
                  )}
                  <Link href={`/projects/${p.id}`} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="View">
                    <Eye size={16} />
                  </Link>
                  {p.status === "open" && (
                    <Link href={`/projects/${p.id}/edit`} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                      <Edit size={16} />
                    </Link>
                  )}
                  {p.status === "open" && (
                    <button onClick={() => handleDelete(p.id)} disabled={deleting === p.id} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                      {deleting === p.id ? <span className="animate-spin w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full block" /> : <Trash2 size={16} />}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState icon={Briefcase} title="No projects yet" description="Post your first project and start receiving applications from talented freelancers." action={{ label: "Post a Project", onClick: () => window.location.href = "/post-project" }} />
      )}
    </div>
  );
}
