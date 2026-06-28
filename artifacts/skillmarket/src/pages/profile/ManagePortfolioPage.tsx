import { useState } from "react";
import { ImageIcon, Plus, Trash2, ExternalLink, ImagePlus, FileText, CheckCircle } from "lucide-react";
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
    if (!confirm("Are you sure you want to delete this portfolio piece?")) return;
    await deleteMutation.mutateAsync({ itemId });
    queryClient.invalidateQueries({ queryKey: ["/api/freelancers/me/portfolio"] });
  };

  if (isLoading) return <div className="flex justify-center items-center min-h-[60vh]"><LoadingSpinner size="xl" /></div>;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-10 gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center shadow-sm">
              <ImageIcon size={24} className="text-indigo-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Portfolio</h1>
          </div>
          <p className="text-gray-500 sm:ml-15 mt-1">Showcase your best projects to attract high-quality clients.</p>
        </div>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="btn-primary py-3 px-6 shadow-md shadow-indigo-200">
            <Plus size={18} /> Add New Project
          </button>
        )}
      </div>

      {showForm && (
        <div className="card p-8 mb-10 border-2 border-indigo-100 shadow-md animate-slide-up relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
          
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <FileText size={20} className="text-indigo-600" /> Create Portfolio Item
          </h2>
          
          {error && <div className="bg-red-50 border border-red-200 text-red-700 font-medium rounded-xl px-4 py-3 mb-6">{error}</div>}
          
          <form onSubmit={handleAdd} className="space-y-6 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="label font-medium text-gray-800">Project Title <span className="text-red-500">*</span></label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="input text-lg py-3 focus:bg-white bg-gray-50/50" placeholder="e.g. E-Commerce Dashboard Redesign" required />
              </div>
              
              <div className="md:col-span-2">
                <label className="label font-medium text-gray-800">Description <span className="text-red-500">*</span></label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="input min-h-[140px] resize-y py-3 focus:bg-white bg-gray-50/50" placeholder="Explain the problem, your solution, and the impact..." required />
              </div>
              
              <div>
                <label className="label font-medium text-gray-800">Preview Image URL <span className="text-gray-400 font-normal text-xs ml-1">optional</span></label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <ImagePlus size={16} className="text-gray-400" />
                  </div>
                  <input value={form.imageUrl} onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))} className="input pl-10 focus:bg-white bg-gray-50/50" placeholder="https://image-host.com/cover.jpg" />
                </div>
              </div>
              
              <div>
                <label className="label font-medium text-gray-800">Live URL <span className="text-gray-400 font-normal text-xs ml-1">optional</span></label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <ExternalLink size={16} className="text-gray-400" />
                  </div>
                  <input value={form.projectUrl} onChange={e => setForm(f => ({ ...f, projectUrl: e.target.value }))} className="input pl-10 focus:bg-white bg-gray-50/50" placeholder="https://your-project.com" />
                </div>
              </div>
              
              <div className="md:col-span-2">
                <label className="label font-medium text-gray-800">Tags <span className="text-gray-400 font-normal text-xs ml-1">comma-separated</span></label>
                <input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} className="input focus:bg-white bg-gray-50/50" placeholder="React, Node.js, UI Design" />
              </div>
            </div>
            
            <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
              <button type="submit" disabled={addMutation.isPending} className="btn-primary py-3 px-8 text-base">
                {addMutation.isPending ? <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" /> : <span className="flex items-center gap-2"><CheckCircle size={18} /> Publish Project</span>}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-ghost py-3 px-6 text-gray-500 hover:text-gray-900">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {portfolio && portfolio.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {portfolio.map(item => (
            <div key={item.id} className="group card overflow-hidden flex flex-col h-full bg-white transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
              <div className="relative h-48 bg-gray-100 overflow-hidden flex-shrink-0">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-200 text-gray-400">
                    <ImageIcon size={48} className="opacity-20" />
                  </div>
                )}
                
                {/* Overlay actions */}
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                  {item.projectUrl && (
                    <a href={item.projectUrl} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm text-gray-700 hover:text-indigo-600 flex items-center justify-center shadow-sm transition-colors" title="Visit Live Site">
                      <ExternalLink size={14} />
                    </a>
                  )}
                  <button onClick={() => handleDelete(item.id)} className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm text-gray-700 hover:text-red-600 flex items-center justify-center shadow-sm transition-colors" title="Delete Project">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              
              <div className="p-6 flex-1 flex flex-col">
                <h3 className="font-bold text-gray-900 text-lg mb-2 line-clamp-1 group-hover:text-indigo-600 transition-colors">{item.title}</h3>
                <p className="text-sm text-gray-600 mb-4 line-clamp-3 leading-relaxed flex-1">{item.description}</p>
                
                {item.tags && item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-auto pt-4 border-t border-gray-50">
                    {item.tags.map(t => (
                      <span key={t} className="px-2.5 py-1 bg-gray-100/80 text-gray-600 text-[11px] font-semibold tracking-wide rounded-md">
                        {t.toUpperCase()}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        !showForm && (
          <EmptyState 
            icon={ImageIcon} 
            title="Your portfolio is empty" 
            description="A strong portfolio is the #1 reason clients hire freelancers. Add your past projects, case studies, or personal work." 
            action={{ label: "Create First Project", onClick: () => setShowForm(true) }} 
          />
        )
      )}
    </div>
  );
}
