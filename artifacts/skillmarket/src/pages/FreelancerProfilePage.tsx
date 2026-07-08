import { useState, useEffect } from "react";
import { useParams, Link, useLocation } from "wouter";
import { ArrowLeft, MessageCircle, Bookmark, ExternalLink, Star, Flag, Send, BadgeCheck, MapPin, Award, CheckCircle, Github, Calendar } from "lucide-react";
import { useGetFreelancer } from "@workspace/api-client-react";
import { useAuth } from "../contexts/AuthContext";
import Avatar from "../components/common/Avatar";
import SkillBadge from "../components/common/SkillBadge";
import StarRating from "../components/common/StarRating";
import LoadingSpinner from "../components/common/LoadingSpinner";
import ReportModal from "../components/common/ReportModal";
import InviteModal from "../components/common/InviteModal";
import { formatCurrency, getAvailabilityColor, formatDate, cn } from "../lib/utils";

interface Review {
  id: number;
  rating: number;
  comment: string | null;
  reviewerName: string | null;
  reviewerAvatar: string | null;
  createdAt: string;
  projectId: number | null;
}

interface CanReviewData {
  canReview: boolean;
  alreadyReviewed?: boolean;
  projectId?: number;
  reason?: string | null;
}

export default function FreelancerProfilePage() {
  const { id } = useParams<{ id: string }>();
  const fid = parseInt(id, 10);
  const { user } = useAuth();
  const [, navigate] = useLocation();

  const [isSaved, setIsSaved] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [saveChecked, setSaveChecked] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [isOnline, setIsOnline] = useState(false);

  const [reviews, setReviews] = useState<Review[]>([]);
  const [canReviewData, setCanReviewData] = useState<CanReviewData | null>(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  const { data: freelancer, isLoading } = useGetFreelancer(fid, { query: { enabled: !!fid, queryKey: ["freelancer", fid] } });

  useEffect(() => {
    if (!fid) return;
    fetch(`/api/reviews/freelancer/${fid}`, { credentials: "include" })
      .then(r => r.ok ? r.json() : [])
      .then((data: Review[]) => setReviews(data))
      .catch(() => {});
  }, [fid]);

  useEffect(() => {
    if (!user || user.role !== "client" || !fid) return;
    fetch(`/api/reviews/can-review/${fid}`, { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then((data: CanReviewData | null) => { if (data) setCanReviewData(data); })
      .catch(() => {});
  }, [fid, user]);

  useEffect(() => {
    if (!user || !fid) return;
    fetch(`/api/saved/check?itemType=freelancer&itemId=${fid}`, { credentials: "include" })
      .then(r => r.json())
      .then(d => {
        if (d.saved !== undefined) setIsSaved(d.saved);
        setSaveChecked(true);
      })
      .catch(() => setSaveChecked(true));
  }, [fid, user]);

  useEffect(() => {
    if (!freelancer?.userId) return;
    fetch(`/api/presence?ids=${freelancer.userId}`)
      .then(r => r.ok ? r.json() : {})
      .then((d: Record<number, boolean>) => setIsOnline(!!d[freelancer.userId!]))
      .catch(() => {});
  }, [freelancer?.userId]);

  const handleSaveProfile = async () => {
    if (!user) { navigate("/login"); return; }
    setSavingProfile(true);
    try {
      if (isSaved) {
        await fetch(`/api/saved?itemType=freelancer&itemId=${fid}`, { method: "DELETE", credentials: "include" });
      } else {
        await fetch("/api/saved", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ itemType: "freelancer", itemId: fid }),
        });
      }
      setIsSaved(!isSaved);
    } catch {
      // Handle error implicitly
    } finally {
      setSavingProfile(false);
    }
  };

  const handleContact = () => {
    if (!user) { navigate("/login"); return; }
    navigate(`/messages?recipient=${freelancer?.userId}`);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setReviewError("");
    if (!canReviewData?.projectId) return;
    setSubmittingReview(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          freelancerProfileId: fid,
          projectId: canReviewData.projectId,
          rating: reviewForm.rating,
          comment: reviewForm.comment || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setReviewError(data?.error ?? "Failed to submit review");
        return;
      }
      setReviewSubmitted(true);
      setCanReviewData(prev => prev ? { ...prev, canReview: false, alreadyReviewed: true } : null);
      const updated = await fetch(`/api/reviews/freelancer/${fid}`, { credentials: "include" });
      if (updated.ok) setReviews(await updated.json());
    } catch {
      setReviewError("Failed to submit review");
    } finally {
      setSubmittingReview(false);
    }
  };

  if (isLoading) return <div className="flex justify-center items-center min-h-[60vh]"><LoadingSpinner size="xl" /></div>;
  if (!freelancer) return <div className="flex flex-col items-center justify-center min-h-[60vh] text-center"><h2 className="text-2xl font-bold text-gray-900 mb-2">Profile not found</h2><p className="text-gray-500 mb-6">This freelancer profile may have been removed.</p><Link href="/freelancers" className="btn-primary">Browse Talent</Link></div>;

  const name = freelancer.user?.name ?? "Freelancer";
  const skillsByCategory = (freelancer.skills ?? []).reduce((acc, s) => {
    const cat = s.skillCategory ?? "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(s);
    return acc;
  }, {} as Record<string, typeof freelancer.skills>);

  return (
    <div className="page-container animate-in">
      <Link href="/freelancers" className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-gray-900 mb-8 transition-colors shadow-sm">
        <ArrowLeft size={16} /> Back to Talent
      </Link>

      {showReport && user && (
        <ReportModal
          targetType="user"
          targetId={freelancer.userId ?? fid}
          targetLabel={name}
          onClose={() => setShowReport(false)}
        />
      )}

      {showInvite && user?.role === "client" && (
        <InviteModal
          freelancerProfileId={fid}
          freelancerName={name}
          onClose={() => setShowInvite(false)}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Sidebar - 4 cols */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden relative">
            <div className="h-24 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
            <div className="px-8 pb-8 -mt-12 text-center">
              <div className="relative inline-block mb-4">
                <div className="p-1.5 bg-white rounded-full">
                  <Avatar name={name} avatarUrl={freelancer.user?.avatarUrl} size="2xl" />
                </div>
                <span className={cn(
                  "absolute bottom-2 right-2 w-4 h-4 rounded-full border-2 border-white shadow-sm",
                  isOnline ? "bg-green-500" : "bg-gray-300"
                )} />
              </div>
              <div className="flex items-center justify-center gap-2 mb-1">
                <h1 className="text-2xl font-extrabold text-gray-900">{name}</h1>
                {freelancer.user?.emailVerified && (
                  <BadgeCheck size={20} className="text-indigo-500" />
                )}
              </div>
              <p className="text-gray-600 font-medium mb-3">{freelancer.headline}</p>
              
              {freelancer.user?.university && (
                <div className="flex items-center justify-center gap-1.5 text-sm text-gray-500 mb-4 bg-gray-50 py-1.5 px-3 rounded-full inline-flex mx-auto">
                  <MapPin size={14} className="text-gray-400" />
                  {freelancer.user.university}
                </div>
              )}

              {freelancer.availabilityStatus && (
                <div className="mb-6">
                  <span className={cn("px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-md", getAvailabilityColor(freelancer.availabilityStatus))}>
                    {freelancer.availabilityStatus.replace("-", " ")}
                  </span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <p className="text-xl font-extrabold text-gray-900">{formatCurrency(freelancer.hourlyRate)}</p>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mt-1">Hourly Rate</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <p className="text-xl font-extrabold text-gray-900">{freelancer.completedProjects ?? 0}</p>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mt-1">Jobs Done</p>
                </div>
              </div>

              {freelancer.averageRating && (
                <div className="flex items-center justify-center gap-2 mb-8">
                  <div className="flex items-center gap-1 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100">
                    <StarRating rating={freelancer.averageRating} size={16} />
                    <span className="text-base font-bold text-amber-900 ml-1">{freelancer.averageRating.toFixed(1)}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-500">({freelancer.totalReviews ?? 0} reviews)</span>
                </div>
              )}

              <div className="space-y-3">
                {user?.role === "client" && (
                  <>
                    <button onClick={handleContact} className="btn-primary w-full justify-center py-3.5 text-base">
                      <MessageCircle size={18} /> Message
                    </button>
                    <button
                      onClick={() => setShowInvite(true)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl border-2 border-indigo-600 text-indigo-700 font-bold hover:bg-indigo-50 transition-colors"
                    >
                      <Send size={18} /> Invite to Project
                    </button>
                  </>
                )}
                {user && (
                  <button
                    onClick={handleSaveProfile}
                    disabled={savingProfile || !saveChecked}
                    className={cn(
                      "w-full justify-center flex items-center gap-2 px-4 py-3.5 rounded-xl border-2 text-sm font-bold transition-colors disabled:opacity-60",
                      isSaved
                        ? "border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                        : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                    )}
                  >
                    <Bookmark size={18} className={isSaved ? "fill-current" : ""} />
                    {savingProfile ? "Saving..." : isSaved ? "Saved to Profile" : "Save Profile"}
                  </button>
                )}
                {!user && (
                  <Link href="/login" className="btn-primary w-full justify-center py-3.5 text-base">Sign In to Contact</Link>
                )}
                {user && user.id !== (freelancer.userId ?? fid) && (
                  <button onClick={() => setShowReport(true)} className="w-full flex items-center justify-center gap-2 py-2 mt-4 text-sm font-medium text-gray-400 hover:text-red-600 transition-colors">
                    <Flag size={14} /> Report this profile
                  </button>
                )}
              </div>
            </div>
          </div>

          {user?.role === "client" && canReviewData && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Star size={18} className="text-amber-500" /> Leave a Review
              </h3>
              {reviewSubmitted || canReviewData.alreadyReviewed ? (
                <div className="flex items-center gap-3 bg-green-50 text-green-800 p-4 rounded-xl border border-green-100">
                  <CheckCircle size={20} className="text-green-600 flex-shrink-0" />
                  <p className="text-sm font-medium">{reviewSubmitted ? "Review submitted — thank you!" : "You've already reviewed this freelancer."}</p>
                </div>
              ) : canReviewData.canReview ? (
                <form onSubmit={handleSubmitReview} className="space-y-4">
                  {reviewError && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-3 border border-red-100">{reviewError}</p>}
                  <div>
                    <label className="text-sm font-bold text-gray-900 block mb-2">Rating</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map(v => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setReviewForm(f => ({ ...f, rating: v }))}
                          className="focus:outline-none hover:scale-110 transition-transform"
                        >
                          <Star
                            size={28}
                            className={v <= reviewForm.rating ? "fill-amber-400 text-amber-400" : "text-gray-200"}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-bold text-gray-900 block mb-2">Comment</label>
                    <textarea
                      value={reviewForm.comment}
                      onChange={e => setReviewForm(f => ({ ...f, comment: e.target.value }))}
                      className="input min-h-[100px] p-3 text-sm"
                      placeholder="Share your experience..."
                      maxLength={2000}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="btn-primary w-full justify-center py-3 text-sm"
                  >
                    {submittingReview ? <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> : "Submit Review"}
                  </button>
                </form>
              ) : (
                <p className="text-sm text-gray-500 bg-gray-50 p-4 rounded-xl border border-gray-100">{canReviewData.reason ?? "You are not eligible to review this freelancer."}</p>
              )}
            </div>
          )}
        </div>

        {/* Right Content - 8 cols */}
        <div className="lg:col-span-8 space-y-8">
          {freelancer.bio && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">About Me</h2>
              <div className="prose prose-indigo max-w-none prose-p:leading-relaxed prose-p:text-gray-600">
                <p className="whitespace-pre-wrap">{freelancer.bio}</p>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Skills & Expertise</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {Object.entries(skillsByCategory).map(([category, catSkills]) => (
                <div key={category}>
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 pb-2 border-b border-gray-100">{category}</h3>
                  <div className="flex flex-wrap gap-2">
                    {catSkills?.map(s => <SkillBadge key={s.skillName} name={s.skillName} proficiency={s.proficiencyLevel} variant="purple" />)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {freelancer.portfolio && freelancer.portfolio.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Portfolio</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {freelancer.portfolio.map(item => (
                  <div key={item.id} className="group border border-gray-200 rounded-xl overflow-hidden hover:border-indigo-300 hover:shadow-md transition-all duration-300 flex flex-col h-full bg-white">
                    {/* Cover image */}
                    {item.imageUrl ? (
                      <div className="aspect-[4/3] overflow-hidden relative">
                        <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                        {item.category && (
                          <span className="absolute top-3 left-3 px-2 py-0.5 bg-black/50 backdrop-blur-sm text-white text-[10px] font-bold tracking-wide rounded-md uppercase">
                            {item.category}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="aspect-[4/3] bg-gray-50 flex items-center justify-center border-b border-gray-100 relative">
                        <Award size={48} className="text-gray-300" />
                        {item.category && (
                          <span className="absolute top-3 left-3 px-2 py-0.5 bg-gray-200 text-gray-600 text-[10px] font-bold tracking-wide rounded-md uppercase">
                            {item.category}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Screenshots strip */}
                    {item.screenshots && item.screenshots.length > 0 && (
                      <div className="flex gap-1 px-3 pt-3 overflow-hidden">
                        {item.screenshots.slice(0, 4).map((s, i) => (
                          <img key={i} src={s} alt={`screenshot ${i + 1}`} className="w-16 h-11 object-cover rounded-md border border-gray-100 flex-shrink-0" />
                        ))}
                        {item.screenshots.length > 4 && (
                          <div className="w-16 h-11 rounded-md border border-gray-100 bg-gray-100 flex items-center justify-center flex-shrink-0 text-[10px] text-gray-500 font-bold">
                            +{item.screenshots.length - 4}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="p-5 flex-1 flex flex-col">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="text-base font-bold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-1">{item.title}</h3>
                        {item.completionDate && (
                          <span className="flex items-center gap-1 text-[10px] text-gray-400 font-medium whitespace-nowrap flex-shrink-0 mt-0.5">
                            <Calendar size={10} />
                            {new Date(item.completionDate + "-01").toLocaleDateString("en-US", { year: "numeric", month: "short" })}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2 mb-4 flex-1 leading-relaxed">{item.description}</p>

                      {item.tags && item.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {item.tags.slice(0, 3).map(t => <span key={t} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-semibold rounded-md uppercase tracking-wide">{t}</span>)}
                          {item.tags.length > 3 && <span className="text-xs text-gray-400 font-medium self-center">+{item.tags.length - 3}</span>}
                        </div>
                      )}

                      <div className="flex items-center gap-3 mt-auto pt-3 border-t border-gray-50">
                        {item.githubUrl && (
                          <a href={item.githubUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors">
                            <Github size={15} /> Code
                          </a>
                        )}
                        {item.projectUrl && (
                          <a href={item.projectUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors">
                            <ExternalLink size={15} /> Live Demo
                          </a>
                        )}
                        {!item.githubUrl && !item.projectUrl && (
                          <span className="text-xs text-gray-400">No links provided</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Client Reviews</h2>
              {reviews.length > 0 && (
                <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
                  <Star className="fill-amber-400 text-amber-400" size={16} />
                  <span className="font-bold text-gray-900">{freelancer.averageRating?.toFixed(1) ?? "0.0"}</span>
                  <span className="text-sm font-medium text-gray-500">({reviews.length})</span>
                </div>
              )}
            </div>
            
            {reviews.length === 0 ? (
              <div className="bg-gray-50 rounded-xl p-10 text-center border border-gray-100 border-dashed">
                <Star size={40} className="mx-auto text-gray-300 mb-3" />
                <h3 className="text-lg font-bold text-gray-900 mb-1">No reviews yet</h3>
                <p className="text-gray-500">This freelancer hasn't received any reviews.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {reviews.map(r => (
                  <div key={r.id} className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm hover:border-indigo-100 transition-colors">
                    <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={r.reviewerName ?? "?"} size="md" />
                        <div>
                          <p className="font-bold text-gray-900">{r.reviewerName ?? "Anonymous Client"}</p>
                          <p className="text-xs font-medium text-gray-500">{formatDate(r.createdAt)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 bg-amber-50 px-3 py-1 rounded-full border border-amber-100">
                        <StarRating rating={r.rating} size={14} />
                        <span className="text-sm font-bold text-amber-900 ml-1">{r.rating}.0</span>
                      </div>
                    </div>
                    {r.comment && (
                      <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <p className="text-sm text-gray-700 leading-relaxed italic">"{r.comment}"</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
