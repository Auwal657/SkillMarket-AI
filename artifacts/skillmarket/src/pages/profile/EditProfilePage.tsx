import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useUpdateUser, useGetMyFreelancerProfile, useCreateFreelancerProfile, useUpdateFreelancerProfile } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle, User } from "lucide-react";
import Avatar from "../../components/common/Avatar";

export default function EditProfilePage() {
  const { user, updateUser } = useAuth();
  const queryClient = useQueryClient();
  const updateUserMutation = useUpdateUser();
  const createFpMutation = useCreateFreelancerProfile();
  const updateFpMutation = useUpdateFreelancerProfile();

  const { data: fp } = useGetMyFreelancerProfile({ query: { enabled: user?.role === "freelancer", queryKey: ["fp-me"] } });

  const [userForm, setUserForm] = useState({ name: user?.name ?? "", university: user?.university ?? "", avatarUrl: user?.avatarUrl ?? "" });
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
      const updatedUser = await updateUserMutation.mutateAsync({ id: user!.id, data: { name: userForm.name, university: userForm.university || undefined, avatarUrl: userForm.avatarUrl || undefined } });
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

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center"><User size={20} className="text-indigo-600" /></div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Profile</h1>
        </div>
      </div>

      <div className="card p-8">
        {success && <div className="flex items-center gap-2 bg-green-50 text-green-700 rounded-xl px-4 py-3 mb-6"><CheckCircle size={16} /> Profile updated successfully!</div>}
        {error && <div className="bg-red-50 text-red-700 text-sm rounded-xl px-4 py-3 mb-6">{error}</div>}

        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
          <Avatar name={user?.name ?? ""} avatarUrl={userForm.avatarUrl || undefined} size="xl" />
          <div>
            <p className="font-semibold text-gray-900">{user?.name}</p>
            <p className="text-sm text-gray-500 capitalize">{user?.role}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <h3 className="font-semibold text-gray-900">Account Details</h3>
          <div>
            <label className="label">Full Name</label>
            <input value={userForm.name} onChange={e => setUserForm(f => ({ ...f, name: e.target.value }))} className="input" required />
          </div>
          <div>
            <label className="label">Avatar URL <span className="text-gray-400 font-normal">optional</span></label>
            <input value={userForm.avatarUrl} onChange={e => setUserForm(f => ({ ...f, avatarUrl: e.target.value }))} className="input" placeholder="https://..." />
          </div>
          <div>
            <label className="label">University / School <span className="text-gray-400 font-normal">optional</span></label>
            <input value={userForm.university} onChange={e => setUserForm(f => ({ ...f, university: e.target.value }))} className="input" />
          </div>

          {user?.role === "freelancer" && (
            <>
              <div className="border-t border-gray-100 pt-5">
                <h3 className="font-semibold text-gray-900 mb-4">Freelancer Profile</h3>
              </div>
              <div>
                <label className="label">Headline</label>
                <input value={fpForm.headline} onChange={e => setFpForm(f => ({ ...f, headline: e.target.value }))} className="input" placeholder="e.g. Full-Stack React Developer" required />
              </div>
              <div>
                <label className="label">Bio</label>
                <textarea value={fpForm.bio} onChange={e => setFpForm(f => ({ ...f, bio: e.target.value }))} className="input min-h-32" placeholder="Tell clients about your experience, skills, and what makes you unique..." required />
              </div>
              <div>
                <label className="label">Hourly Rate (USD)</label>
                <input type="number" min="1" step="0.01" value={fpForm.hourlyRate} onChange={e => setFpForm(f => ({ ...f, hourlyRate: e.target.value }))} className="input" placeholder="25" required />
              </div>
              <div>
                <label className="label">Availability</label>
                <select value={fpForm.availabilityStatus} onChange={e => setFpForm(f => ({ ...f, availabilityStatus: e.target.value as "available" | "busy" | "unavailable" }))} className="input">
                  <option value="available">Available</option>
                  <option value="busy">Busy</option>
                  <option value="unavailable">Unavailable</option>
                </select>
              </div>
            </>
          )}

          <button type="submit" disabled={updateUserMutation.isPending || createFpMutation.isPending || updateFpMutation.isPending} className="btn-primary w-full justify-center py-3.5">
            {(updateUserMutation.isPending || createFpMutation.isPending || updateFpMutation.isPending) ? <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
}
