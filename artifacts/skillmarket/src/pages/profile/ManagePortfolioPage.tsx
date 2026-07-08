import { useState, useCallback } from "react";
import {
  ImageIcon, Plus, Trash2, ExternalLink, Github, CheckCircle,
  FileText, Pencil, X, Calendar, Tag, FolderOpen,
} from "lucide-react";
import {
  useListMyPortfolio, useAddPortfolioItem, useDeletePortfolioItem,
  useUpdatePortfolioItem,
} from "@workspace/api-client-react";
import type { PortfolioItem } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import EmptyState from "../../components/common/EmptyState";
import { FileUpload, MultiFileUpload } from "../../components/common/FileUpload";

const CATEGORIES = [
  "Frontend", "Backend", "Mobile", "Full Stack", "Design", "UI/UX",
  "Data Science", "Machine Learning", "DevOps", "API / Integration",
  "E-Commerce", "Dashboard", "Game", "Other",
];

type FormState = {
  title: string;
  description: string;
  category: string;
  tags: string;          // comma-separated technologies
  imageUrl: string;      // cover image
  projectUrl: string;    // live demo URL
  githubUrl: string;
  screenshots: string[];
  completionDate: string;
};

const EMPTY_FORM: FormState = {
  title: "", description: "", category: "", tags: "",
  imageUrl: "", projectUrl: "", githubUrl: "",
  screenshots: [], completionDate: "",
};

function itemToForm(item: PortfolioItem): FormState {
  return {
    title: item.title,
    description: item.description,
    category: item.category ?? "",
    tags: (item.tags ?? []).join(", "),
    imageUrl: item.imageUrl ?? "",
    projectUrl: item.projectUrl ?? "",
    githubUrl: item.githubUrl ?? "",
    screenshots: item.screenshots ?? [],
    completionDate: item.completionDate ?? "",
  };
}

export default function ManagePortfolioPage() {
  const queryClient = useQueryClient();
  const { data: portfolio, isLoading } = useListMyPortfolio();
  const addMutation = useAddPortfolioItem();
  const updateMutation = useUpdatePortfolioItem();
  const deleteMutation = useDeletePortfolioItem();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [error, setError] = useState("");

  const openAdd = () => { setForm(EMPTY_FORM); setEditingId(null); setError(""); setShowForm(true); };
  const openEdit = (item: PortfolioItem) => { setForm(itemToForm(item)); setEditingId(item.id); setError(""); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setEditingId(null); setError(""); };

  const setField = useCallback(<K extends keyof FormState>(key: K, val: FormState[K]) => {
    setForm(f => ({ ...f, [key]: val }));
  }, []);

  const buildPayload = () => ({
    title: form.title,
    description: form.description,
    category: form.category || undefined,
    tags: form.tags ? form.tags.split(",").map(t => t.trim()).filter(Boolean) : [],
    imageUrl: form.imageUrl || undefined,
    projectUrl: form.projectUrl || undefined,
    githubUrl: form.githubUrl || undefined,
    screenshots: form.screenshots.length > 0 ? form.screenshots : [],
    completionDate: form.completionDate || undefined,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      if (editingId !== null) {
        await updateMutation.mutateAsync({ itemId: editingId, data: buildPayload() });
      } else {
        await addMutation.mutateAsync({ data: buildPayload() });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/freelancers/me/portfolio"] });
      closeForm();
    } catch (err: unknown) {
      setError((err as { data?: { error?: string } })?.data?.error ?? "Failed to save item");
    }
  };

  const handleDelete = async (itemId: number) => {
    if (!confirm("Delete this portfolio project?")) return;
    await deleteMutation.mutateAsync({ itemId });
    queryClient.invalidateQueries({ queryKey: ["/api/freelancers/me/portfolio"] });
  };

  if (isLoading) return <div className="flex justify-center items-center min-h-[60vh]"><LoadingSpinner size="xl" /></div>;

  const isPending = addMutation.isPending || updateMutation.isPending;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fade-in">
      {/* Header */}
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
          <button onClick={openAdd} className="btn-primary py-3 px-6 shadow-md shadow-indigo-200">
            <Plus size={18} /> Add New Project
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <div className="card p-8 mb-10 border-2 border-indigo-100 shadow-md animate-slide-up relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />

          <div className="flex items-center justify-between mb-6 relative z-10">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <FileText size={20} className="text-indigo-600" />
              {editingId ? "Edit Portfolio Project" : "Add Portfolio Project"}
            </h2>
            <button type="button" onClick={closeForm} className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors">
              <X size={20} />
            </button>
          </div>

          {error && <div className="bg-red-50 border border-red-200 text-red-700 font-medium rounded-xl px-4 py-3 mb-6 relative z-10">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            {/* Title + Category */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="label font-medium text-gray-800">Project Title <span className="text-red-500">*</span></label>
                <input
                  value={form.title}
                  onChange={e => setField("title", e.target.value)}
                  className="input text-lg py-3 focus:bg-white bg-gray-50/50"
                  placeholder="e.g. E-Commerce Dashboard Redesign"
                  required
                />
              </div>

              <div>
                <label className="label font-medium text-gray-800">
                  <FolderOpen size={14} className="inline mr-1" />Category
                </label>
                <select
                  value={form.category}
                  onChange={e => setField("category", e.target.value)}
                  className="input focus:bg-white bg-gray-50/50"
                >
                  <option value="">Select a category…</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="label font-medium text-gray-800">
                  <Calendar size={14} className="inline mr-1" />Completion Date <span className="text-gray-400 font-normal text-xs ml-1">optional</span>
                </label>
                <input
                  type="month"
                  value={form.completionDate}
                  onChange={e => setField("completionDate", e.target.value)}
                  className="input focus:bg-white bg-gray-50/50"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="label font-medium text-gray-800">Description <span className="text-red-500">*</span></label>
              <textarea
                value={form.description}
                onChange={e => setField("description", e.target.value)}
                className="input min-h-[140px] resize-y py-3 focus:bg-white bg-gray-50/50"
                placeholder="Explain the problem, your solution, and the impact you delivered…"
                required
              />
            </div>

            {/* Technologies */}
            <div>
              <label className="label font-medium text-gray-800">
                <Tag size={14} className="inline mr-1" />Technologies Used <span className="text-gray-400 font-normal text-xs ml-1">comma-separated</span>
              </label>
              <input
                value={form.tags}
                onChange={e => setField("tags", e.target.value)}
                className="input focus:bg-white bg-gray-50/50"
                placeholder="React, Node.js, PostgreSQL, Tailwind CSS"
              />
            </div>

            {/* URLs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="label font-medium text-gray-800">
                  <Github size={14} className="inline mr-1" />GitHub Repository <span className="text-gray-400 font-normal text-xs ml-1">optional</span>
                </label>
                <input
                  value={form.githubUrl}
                  onChange={e => setField("githubUrl", e.target.value)}
                  className="input focus:bg-white bg-gray-50/50"
                  placeholder="https://github.com/username/repo"
                  type="url"
                />
              </div>
              <div>
                <label className="label font-medium text-gray-800">
                  <ExternalLink size={14} className="inline mr-1" />Live Demo URL <span className="text-gray-400 font-normal text-xs ml-1">optional</span>
                </label>
                <input
                  value={form.projectUrl}
                  onChange={e => setField("projectUrl", e.target.value)}
                  className="input focus:bg-white bg-gray-50/50"
                  placeholder="https://your-project.com"
                  type="url"
                />
              </div>
            </div>

            {/* Cover Image */}
            <FileUpload
              label="Cover Image"
              accept="image/jpeg,image/png,image/webp,image/gif"
              maxSizeMB={5}
              hint="JPG, PNG or WebP · max 5 MB"
              value={form.imageUrl || null}
              onChange={url => setField("imageUrl", url ?? "")}
            />

            {/* Screenshots */}
            <MultiFileUpload
              label="Screenshots (optional)"
              accept="image/jpeg,image/png,image/webp,image/gif"
              maxSizeMB={5}
              hint="Additional screenshots · max 5 MB each"
              values={form.screenshots}
              onChange={urls => setField("screenshots", urls)}
              maxFiles={6}
            />

            {/* Actions */}
            <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
              <button type="submit" disabled={isPending} className="btn-primary py-3 px-8 text-base">
                {isPending
                  ? <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                  : <span className="flex items-center gap-2">
                      <CheckCircle size={18} />
                      {editingId ? "Save Changes" : "Publish Project"}
                    </span>
                }
              </button>
              <button type="button" onClick={closeForm} className="btn-ghost py-3 px-6 text-gray-500 hover:text-gray-900">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Portfolio Grid */}
      {portfolio && portfolio.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {portfolio.map(item => (
            <div key={item.id} className="group card overflow-hidden flex flex-col h-full bg-white transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
              {/* Cover */}
              <div className="relative h-48 bg-gray-100 overflow-hidden flex-shrink-0">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-200 text-gray-400">
                    <ImageIcon size={48} className="opacity-20" />
                  </div>
                )}
                {/* Category badge */}
                {item.category && (
                  <span className="absolute top-3 left-3 px-2 py-0.5 bg-black/50 backdrop-blur-sm text-white text-[10px] font-bold tracking-wide rounded-md uppercase">
                    {item.category}
                  </span>
                )}
                {/* Actions overlay */}
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1.5">
                  <button
                    onClick={() => openEdit(item)}
                    className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm text-gray-700 hover:text-indigo-600 flex items-center justify-center shadow-sm transition-colors"
                    title="Edit"
                  >
                    <Pencil size={13} />
                  </button>
                  {item.projectUrl && (
                    <a href={item.projectUrl} target="_blank" rel="noopener noreferrer"
                      className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm text-gray-700 hover:text-indigo-600 flex items-center justify-center shadow-sm transition-colors"
                      title="Live Demo">
                      <ExternalLink size={13} />
                    </a>
                  )}
                  {item.githubUrl && (
                    <a href={item.githubUrl} target="_blank" rel="noopener noreferrer"
                      className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm text-gray-700 hover:text-gray-900 flex items-center justify-center shadow-sm transition-colors"
                      title="GitHub">
                      <Github size={13} />
                    </a>
                  )}
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm text-gray-700 hover:text-red-600 flex items-center justify-center shadow-sm transition-colors"
                    title="Delete">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-bold text-gray-900 text-base line-clamp-1 group-hover:text-indigo-600 transition-colors">{item.title}</h3>
                  {item.completionDate && (
                    <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap mt-0.5 flex-shrink-0">
                      {new Date(item.completionDate + "-01").toLocaleDateString("en-US", { year: "numeric", month: "short" })}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-4 line-clamp-3 leading-relaxed flex-1">{item.description}</p>

                {/* Screenshots strip */}
                {item.screenshots && item.screenshots.length > 0 && (
                  <div className="flex gap-1.5 mb-3 overflow-hidden">
                    {item.screenshots.slice(0, 4).map((s, i) => (
                      <img key={i} src={s} alt={`screenshot ${i + 1}`} className="w-14 h-10 object-cover rounded-md border border-gray-100 flex-shrink-0" />
                    ))}
                    {item.screenshots.length > 4 && (
                      <div className="w-14 h-10 rounded-md border border-gray-100 bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-[10px] text-gray-500 font-bold">+{item.screenshots.length - 4}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Tech tags */}
                {item.tags && item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-auto pt-3 border-t border-gray-50">
                    {item.tags.slice(0, 4).map(t => (
                      <span key={t} className="px-2 py-0.5 bg-gray-100/80 text-gray-600 text-[10px] font-semibold tracking-wide rounded-md uppercase">{t}</span>
                    ))}
                    {item.tags.length > 4 && <span className="text-[10px] text-gray-400 font-medium self-center">+{item.tags.length - 4}</span>}
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
            action={{ label: "Create First Project", onClick: openAdd }}
          />
        )
      )}
    </div>
  );
}
