import { useState, useEffect } from "react";
import { useParams, Link, useLocation } from "wouter";
import { ArrowLeft, MessageCircle, Bookmark, ExternalLink, Star, Flag } from "lucide-react";
import { useGetFreelancer } from "@workspace/api-client-react";
import { useAuth } from "../contexts/AuthContext";
import Avatar from "../components/common/Avatar";
import SkillBadge from "../components/common/SkillBadge";
import StarRating from "../components/common/StarRating";
import LoadingSpinner from "../components/common/LoadingSpinner";
import ReportModal from "../components/common/ReportModal";
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

  // Fetch online presence for this freelancer's user
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

  if (isLoading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>;
  if (!freelancer) return <div className="text-center py-20 text-gray-500">Freelancer not found</div>;

  const name = freelancer.user?.name ?? "Freelancer";
  const skillsByCategory = (freelancer.skills ?? []).reduce((acc, s) => {
    const cat = s.skillCategory ?? "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(s);
    return acc;
  }, {} as Record<string, typeof freelancer.skills>);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Link href="/freelancers" className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 transition-colors">
        <ArrowLeft size={16} /> Back to Freelancers
      </Link>

      {showReport && user && (
        <ReportModal
          targetType="user"
          targetId={freelancer.userId ?? fid}
          targetLabel={name}
          onClose={() => setShowReport(false)}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sidebar */}
        <div className="space-y-4">
          <div className="card p-6 text-center">
            <div className="relative inline-block mb-4">
              <Avatar name={name} avatarUrl={freelancer.user?.avatarUrl} size="xl" />
              <span className={cn(
                "absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full border-2 border-white",
                isOnline ? "bg-green-500" : "bg-gray-300"
              )} />
            </div>
            <h1 className="text-xl font-bold text-gray-900">{name}</h1>
            <p className="text-gray-500 text-sm mt-1">{freelancer.headline}</p>
            {freelancer.user?.university && (
              <p className="text-xs text-gray-400 mt-1">{freelancer.user.university}</p>
            )}
            <div className="flex items-center justify-center gap-1.5 text-xs mt-1">
              <span className={cn("w-2 h-2 rounded-full", isOnline ? "bg-green-500" : "bg-gray-300")} />
              <span className={isOnline ? "text-green-600" : "text-gray-400"}>{isOnline ? "Online now" : "Offline"}</span>
            </div>
            {freelancer.availabilityStatus && (
              <span className={cn("badge mt-3 inline-block", getAvailabilityColor(freelancer.availabilityStatus))}>
                {freelancer.availabilityStatus}
              </span>
            )}

            <div className="grid grid-cols-3 gap-3 mt-5 pt-5 border-t border-gray-100">
              <div className="text-center">
                <p className="font-bold text-gray-900">{formatCurrency(freelancer.hourlyRate)}</p>
                <p className="text-xs text-gray-400">per hour</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-gray-900">{freelancer.completedProjects ?? 0}</p>
                <p className="text-xs text-gray-400">projects</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-gray-900">{freelancer.profileViews ?? 0}</p>
                <p className="text-xs text-gray-400">views</p>
              </div>
            </div>

            {freelancer.averageRating && (
              <div className="flex items-center justify-center gap-2 mt-4">
                <StarRating rating={freelancer.averageRating} size={14} />
                <span className="text-sm font-medium text-gray-900">{freelancer.averageRating.toFixed(1)}</span>
                <span className="text-sm text-gray-400">({freelancer.totalReviews ?? 0})</span>
              </div>
            )}

            <div className="mt-5 space-y-2">
              {user?.role === "client" && (
                <button onClick={handleContact} className="btn-primary w-full justify-center">
                  <MessageCircle size={16} /> Contact
                </button>
              )}
              {user && (
                <button
                  onClick={handleSaveProfile}
                  disabled={savingProfile || !saveChecked}
                  className={cn(
                    "w-full justify-center flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors disabled:opacity-60",
                    isSaved
                      ? "border-indigo-200 bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                      : "border-gray-200 text-gray-600 hover:bg-gray-50"
                  )}
                >
                  <Bookmark size={16} className={isSaved ? "fill-current" : ""} />
                  {savingProfile ? "Saving..." : isSaved ? "Saved" : "Save Profile"}
                </button>
              )}
              {!user && (
                <Link href="/login" className="btn-secondary w-full justify-center text-sm">Sign In to Contact</Link>
              )}
              {user && user.id !== (freelancer.userId ?? fid) && (
                <button onClick={() => setShowReport(true)} className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-gray-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 rounded-xl transition-colors">
                  <Flag size={13} /> Report
                </button>
              )}
            </div>
          </div>

          {/* Leave a Review card (client only, eligible) */}
          {user?.role === "client" && canReviewData && (
            <div className="card p-5">
              <h3 className="font-semibold text-gray-900 mb-3 text-sm">Leave a Review</h3>
              {reviewSubmitted || canReviewData.alreadyReviewed ? (
                <p className="text-sm text-green-700 bg-green-50 rounded-xl px-3 py-2">
                  {reviewSubmitted ? "Review submitted — thank you!" : "You've already reviewed this freelancer."}
                </p>
              ) : canReviewData.canReview ? (
                <form onSubmit={handleSubmitReview} className="space-y-3">
                  {reviewError && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{reviewError}</p>}
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1">Rating</label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(v => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setReviewForm(f => ({ ...f, rating: v }))}
                          className="focus:outline-none"
                        >
                          <Star
                            size={20}
                            className={v <= reviewForm.rating ? "fill-amber-400 text-amber-400" : "text-gray-300"}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1">Comment (optional)</label>
                    <textarea
                      value={reviewForm.comment}
                      onChange={e => setReviewForm(f => ({ ...f, comment: e.target.value }))}
                      className="input text-sm min-h-20"
                      placeholder="Describe your experience working with this freelancer..."
                      maxLength={2000}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="btn-primary w-full justify-center text-sm py-2"
                  >
                    {submittingReview ? <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> : "Submit Review"}
                  </button>
                </form>
              ) : (
                <p className="text-xs text-gray-500">{canReviewData.reason ?? "You are not eligible to review this freelancer."}</p>
              )}
            </div>
          )}
        </div>

        {/* Main */}
        <div className="lg:col-span-2 space-y-6">
          {freelancer.bio && (
            <div className="card p-6">
              <h2 className="font-semibold text-gray-900 mb-3">About</h2>
              <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{freelancer.bio}</p>
            </div>
          )}

          {Object.entries(skillsByCategory).map(([category, catSkills]) => (
            <div key={category} className="card p-6">
              <h2 className="font-semibold text-gray-900 mb-3">{category}</h2>
              <div className="flex flex-wrap gap-2">
                {catSkills?.map(s => <SkillBadge key={s.skillName} name={s.skillName} proficiency={s.proficiencyLevel} />)}
              </div>
            </div>
          ))}

          {freelancer.portfolio && freelancer.portfolio.length > 0 && (
            <div className="card p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Portfolio</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {freelancer.portfolio.map(item => (
                  <div key={item.id} className="border border-gray-100 rounded-xl overflow-hidden hover:border-indigo-200 transition-colors">
                    {item.imageUrl && <img src={item.imageUrl} alt={item.title} className="w-full h-36 object-cover" />}
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                      <p className="text-sm text-gray-500 line-clamp-2 mb-3">{item.description}</p>
                      {item.tags && item.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {item.tags.map(t => <span key={t} className="badge bg-gray-100 text-gray-500">{t}</span>)}
                        </div>
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
            </div>
          )}

          {/* Reviews */}
          <div className="card p-6">
            <h2 className="font-semibold text-gray-900 mb-4">
              Reviews {reviews.length > 0 && <span className="text-gray-400 font-normal text-sm">({reviews.length})</span>}
            </h2>
            {reviews.length === 0 ? (
              <p className="text-sm text-gray-400">No reviews yet.</p>
            ) : (
              <div className="space-y-4">
                {reviews.map(r => (
                  <div key={r.id} className="border-b border-gray-50 last:border-0 pb-4 last:pb-0">
                    <div className="flex items-center gap-3 mb-2">
                      <Avatar name={r.reviewerName ?? "?"} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{r.reviewerName ?? "Anonymous"}</p>
                        <p className="text-xs text-gray-400">{formatDate(r.createdAt)}</p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <StarRating rating={r.rating} size={13} />
                        <span className="text-sm font-semibold text-gray-900 ml-1">{r.rating}</span>
                      </div>
                    </div>
                    {r.comment && <p className="text-sm text-gray-600 leading-relaxed ml-10">{r.comment}</p>}
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
