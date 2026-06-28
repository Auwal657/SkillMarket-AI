import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useUpdateUser, useGetMyFreelancerProfile, useCreateFreelancerProfile, useUpdateFreelancerProfile } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle, User, Briefcase, Settings, ArrowRight } from "lucide-react";
import Avatar from "../../components/common/Avatar";

export default function EditProfilePage() {
  const { user, updateUser } = useAuth();
  const queryClient = useQueryClient();
  const updateUserMutation = useUpdateUser();
  const createFpMutation = useCreateFreelancerProfile();
  const updateFpMutation = useUpdateFreelancerProfile();

  const { data: fp } = useGetMyFreelancerProfile({ query: { enabled: user?.role === "freelancer", queryKey: ["fp-me"] } });

  const [userForm, setUserForm] = useState({ name: user?.name ?? "", university: user?.university ?? "", avatarUrl: user?.avatarUrl ?? "" });
  const [clientForm, setClientForm] = useState({ companyName: "", companyDescription: "", companyLogoUrl: "", website: "" });
  const [fpForm, setFpForm] = useState({ headline: "", bio: "", hourlyRate: "", availabilityStatus: "available" as "available" | "busy" | "unavailable" });
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (fp) setFpForm({ headline: fp.headline, bio: fp.bio, hourlyRate: String(fp.hourlyRate), availabilityStatus: fp.availabilityStatus ?? "available" });
  }, [fp]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSuccess(false);
    try {
      const body: Record<string, unknown> = { name: userForm.name, university: userForm.university || undefined, avatarUrl: userForm.avatarUrl || undefined };
      if (user?.role === "client") {
        body.companyName = clientForm.companyName || undefined;
        body.companyDescription = clientForm.companyDescription || undefined;
        body.companyLogoUrl = clientForm.companyLogoUrl || undefined;
        body.website = clientForm.website || undefined;
      }
      const updatedUser = await updateUserMutation.mutateAsync({ id: user!.id, data: body as Parameters<typeof updateUserMutation.mutateAsync>[0]["data"] });
      updateUser(updatedUser as Parameters<typeof updateUser>[0]);

      if (user?.role === "freelancer") {
        const rate = parseFloat(fpForm.hourlyRate);
        if (isNaN(rate) || rate <= 0) { setError("Enter a valid hourly rate"); return; }
        if (fp) {
          await updateFpMutation.mutateAsync({ data: { headline: fpForm.headline, bio: fpForm.bio, hourlyRate: rate, availabilityStatus: fpForm.availabilityStatus } });
        } else {
          await createFpMutation.mutateAsync({ data: { headline: fpForm.headline, bio: fpForm.bio, hourlyRate: rate, availabilityStatus: fpForm.availabilityStatus } });
        }
        queryClient.invalidateQueries({ queryKey: ["fp-me"] });
      }
      setSuccess(true);
    } catch (err: unknown) {
      setError((err as { data?: { error?: string } })?.data?.error ?? "Failed to update profile");
    }
  };

  const isPending = updateUserMutation.isPending || createFpMutation.isPending || updateFpMutation.isPending;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fade-in">
      <div className="mb-10 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Edit Profile</h1>
          <p className="text-gray-500 mt-2 text-sm">Update your personal information and preferences.</p>
        </div>
        <div className="hidden sm:block">
          <Avatar name={user?.name ?? ""} avatarUrl={userForm.avatarUrl || undefined} size="lg" />
        </div>
      </div>

      {success && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 text-green-700 rounded-xl px-5 py-4 mb-8 animate-in shadow-sm">
          <CheckCircle size={20} /> 
          <span className="font-medium">Profile updated successfully!</span>
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 font-medium rounded-xl px-5 py-4 mb-8 shadow-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Account Details */}
        <div className="card p-8 shadow-sm">
          <div className="flex items-center gap-2 mb-6 border-b border-gray-100 pb-4">
            <User size={20} className="text-indigo-600" />
            <h3 className="text-lg font-semibold text-gray-900">Account Details</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2 flex items-center gap-6 mb-2">
              <Avatar name={user?.name ?? ""} avatarUrl={userForm.avatarUrl || undefined} size="xl" />
              <div className="flex-1">
                <label className="label">Avatar URL <span className="text-gray-400 font-normal text-xs ml-1">optional</span></label>
                <input value={userForm.avatarUrl} onChange={e => setUserForm(f => ({ ...f, avatarUrl: e.target.value }))} className="input" placeholder="https://..." />
              </div>
            </div>

            <div>
              <label className="label">Full Name</label>
              <input value={userForm.name} onChange={e => setUserForm(f => ({ ...f, name: e.target.value }))} className="input focus:bg-white bg-gray-50/50" required />
            </div>
            
            <div>
              <label className="label">University / School <span className="text-gray-400 font-normal text-xs ml-1">optional</span></label>
              <input value={userForm.university} onChange={e => setUserForm(f => ({ ...f, university: e.target.value }))} className="input focus:bg-white bg-gray-50/50" placeholder="e.g. University of Lagos" />
            </div>
          </div>
        </div>

        {/* Client Profile */}
        {user?.role === "client" && (
          <div className="card p-8 shadow-sm">
            <div className="flex items-center gap-2 mb-6 border-b border-gray-100 pb-4">
              <Briefcase size={20} className="text-indigo-600" />
              <h3 className="text-lg font-semibold text-gray-900">Company Profile</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="label">Company Name <span className="text-gray-400 font-normal text-xs ml-1">optional</span></label>
                <input value={clientForm.companyName} onChange={e => setClientForm(f => ({ ...f, companyName: e.target.value }))} className="input focus:bg-white bg-gray-50/50" placeholder="e.g. Acme Corp" />
              </div>
              
              <div>
                <label className="label">Website <span className="text-gray-400 font-normal text-xs ml-1">optional</span></label>
                <input value={clientForm.website} onChange={e => setClientForm(f => ({ ...f, website: e.target.value }))} className="input focus:bg-white bg-gray-50/50" placeholder="https://..." />
              </div>

              <div className="md:col-span-2">
                <label className="label">Company Logo URL <span className="text-gray-400 font-normal text-xs ml-1">optional</span></label>
                <input value={clientForm.companyLogoUrl} onChange={e => setClientForm(f => ({ ...f, companyLogoUrl: e.target.value }))} className="input focus:bg-white bg-gray-50/50" placeholder="https://..." />
              </div>

              <div className="md:col-span-2">
                <label className="label">Company Description <span className="text-gray-400 font-normal text-xs ml-1">optional</span></label>
                <textarea value={clientForm.companyDescription} onChange={e => setClientForm(f => ({ ...f, companyDescription: e.target.value }))} className="input min-h-[120px] focus:bg-white bg-gray-50/50 resize-y" placeholder="What does your company do?" />
              </div>
            </div>
          </div>
        )}

        {/* Freelancer Profile */}
        {user?.role === "freelancer" && (
          <div className="card p-8 shadow-sm">
            <div className="flex items-center gap-2 mb-6 border-b border-gray-100 pb-4">
              <Settings size={20} className="text-indigo-600" />
              <h3 className="text-lg font-semibold text-gray-900">Freelancer Settings</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="label">Professional Headline</label>
                <input value={fpForm.headline} onChange={e => setFpForm(f => ({ ...f, headline: e.target.value }))} className="input focus:bg-white bg-gray-50/50 font-medium" placeholder="e.g. Full-Stack React Developer" required />
              </div>
              
              <div>
                <label className="label">Hourly Rate (USD)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input type="number" min="1" step="0.01" value={fpForm.hourlyRate} onChange={e => setFpForm(f => ({ ...f, hourlyRate: e.target.value }))} className="input pl-7 focus:bg-white bg-gray-50/50" placeholder="25.00" required />
                </div>
              </div>

              <div>
                <label className="label">Availability Status</label>
                <select value={fpForm.availabilityStatus} onChange={e => setFpForm(f => ({ ...f, availabilityStatus: e.target.value as "available" | "busy" | "unavailable" }))} className="input focus:bg-white bg-gray-50/50">
                  <option value="available">🟢 Available for work</option>
                  <option value="busy">🟡 Busy right now</option>
                  <option value="unavailable">🔴 Unavailable</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="label">About Me (Bio)</label>
                <textarea value={fpForm.bio} onChange={e => setFpForm(f => ({ ...f, bio: e.target.value }))} className="input min-h-[160px] focus:bg-white bg-gray-50/50 resize-y leading-relaxed" placeholder="Tell clients about your experience, skills, and what makes you unique..." required />
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end pt-4">
          <button type="submit" disabled={isPending} className="btn-primary w-full sm:w-auto py-3 px-8 text-base shadow-lg shadow-indigo-200">
            {isPending ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> 
                Saving...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                Save Changes
                <ArrowRight size={16} />
              </span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
