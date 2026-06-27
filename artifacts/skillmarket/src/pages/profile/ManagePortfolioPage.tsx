import { useState } from "react";
import { ImageIcon, Plus, Trash2, ExternalLink } from "lucide-react";
import { useListMyPortfolio, useAddPortfolioItem, useDeletePortfolioItem } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import EmptyState from "../../components/common/EmptyState";

export default function ManagePortfolioPage() {
  const queryClient = useQueryClient();
  const { data: portfolio, isLoading } = useListMyPortfolio();
  const addMutation = useAddPortfolioItem();
  const deleteMutation = useDeletePortfolioItem();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", imageUrl: "", projectUrl: "", tags: "" });
  const [error, setError] = useState("");

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await addMutation.mutateAsync({
        data: {
          title: form.title, description: form.description,
          imageUrl: form.imageUrl || undefined, projectUrl: form.projectUrl || undefined,
          tags: form.tags ? form.tags.split(",").map(t => t.trim()).filter(Boolean) : undefined,
        }
      });
      queryClient.invalidateQueries({ queryKey: ["/api/freelancers/me/portfolio"] });
      setForm({ title: "", description: "", imageUrl: "", projectUrl: "", tags: "" });
      setShowForm(false);
    } catch (err: unknown) {
      setError((err as { data?: { error?: string } })?.data?.error ?? "Failed to add item");
    }
  };

  const handleDelete = async (itemId: number) => {
    if (!confirm("Delete this portfolio item?")) return;
    await deleteMutation.mutateAsync({ itemId });
    queryClient.invalidateQueries({ queryKey: ["/api/freelancers/me/portfolio"] });
  };

  if (isLoading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center"><ImageIcon size={20} className="text-indigo-600" /></div>
            <h1 className="text-2xl font-bold text-gray-900">Portfolio</h1>
          </div>
          <p className="text-gray-500">Showcase your best work</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary"><Plus size={16} /> Add Item</button>
      </div>

      {showForm && (
        <div className="card p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">New Portfolio Item</h2>
          {error && <div className="bg-red-50 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">{error}</div>}
          <form onSubmit={handleAdd} className="space-y-4">
            <div><label className="label">Title *</label><input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="input" required /></div>
            <div><label className="label">Description *</label><textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="input min-h-24" required /></div>
            <div><label className="label">Image URL <span className="text-gray-400 font-normal">optional</span></label><input value={form.imageUrl} onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))} className="input" placeholder="https://..." /></div>
            <div><label className="label">Project URL <span className="text-gray-400 font-normal">optional</span></label><input value={form.projectUrl} onChange={e => setForm(f => ({ ...f, projectUrl: e.target.value }))} className="input" placeholder="https://..." /></div>
            <div><label className="label">Tags <span className="text-gray-400 font-normal">comma-separated</span></label><input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} className="input" placeholder="React, TypeScript, UI" /></div>
            <div className="flex gap-3">
              <button type="submit" disabled={addMutation.isPending} className="btn-primary">
                {addMutation.isPending ? <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> : "Add Item"}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {portfolio && portfolio.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {portfolio.map(item => (
            <div key={item.id} className="card overflow-hidden">
              {item.imageUrl && <img src={item.imageUrl} alt={item.title} className="w-full h-40 object-cover" />}
              <div className="p-5">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-semibold text-gray-900">{item.title}</h3>
                  <button onClick={() => handleDelete(item.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0">
                    <Trash2 size={14} />
                  </button>
                </div>
                <p className="text-sm text-gray-500 mb-3 line-clamp-3">{item.description}</p>
                {item.tags && item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">{item.tags.map(t => <span key={t} className="badge bg-gray-100 text-gray-500">{t}</span>)}</div>
                )}
                {item.projectUrl && (
                  <a href={item.projectUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800">
                    <ExternalLink size={12} /> View Project
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState icon={ImageIcon} title="No portfolio items" description="Add projects to showcase your work to potential clients." action={{ label: "Add First Item", onClick: () => setShowForm(true) }} />
      )}
    </div>
  );
}
